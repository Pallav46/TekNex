"""Kafka worker: consumes match requests and publishes salesperson id.

Consumes JSON messages from REQUEST_TOPIC (default: sales-executive-match-request)
Expected JSON fields:
  - CustomerID
  - InterestedVehicleClass
  - BudgetRange
  - IntendedPurchaseTimeframe
  - CustomerSegment
  - PreferredCommunication

Publishes JSON messages to RESPONSE_TOPIC (default: sales-executive-match-response)
  - CustomerID
  - SalesExecutiveID (same as model's SalespersonID)

Env vars:
  - KAFKA_BOOTSTRAP_SERVERS (default: localhost:9092)
  - REQUEST_TOPIC (default: sales-executive-match-request)
  - RESPONSE_TOPIC (default: sales-executive-match-response)
  - KAFKA_GROUP_ID (default: sales-executive-matcher)
  - MODEL_PATH (default: crm_matching_model.pkl)
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict

from kafka import KafkaConsumer, KafkaProducer

from matcher_inference import predict_salesperson_id


def _normalize_match_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Accept both the original CRM request shape and the ML model request shape."""

    # If the message already matches the model schema, pass through.
    if all(
        k in payload
        for k in (
            "CustomerID",
            "InterestedVehicleClass",
            "BudgetRange",
            "IntendedPurchaseTimeframe",
            "CustomerSegment",
            "PreferredCommunication",
        )
    ):
        return payload

    # Map from CRM's SalesExecutiveMatchRequest DTO.
    # CRM sends: dealId, customerId, interestCategory, budgetRange, intendedTimeframe, preferredContactMode
    customer_id = payload.get("CustomerID") or payload.get("customerId")
    interested_vehicle = payload.get("InterestedVehicleClass") or payload.get("interestCategory")
    budget_range = payload.get("BudgetRange") or payload.get("budgetRange")
    intended_timeframe = payload.get("IntendedPurchaseTimeframe") or payload.get("intendedTimeframe")
    preferred_comm = payload.get("PreferredCommunication") or payload.get("preferredContactMode")

    # CRM doesn't currently have a segment field; keep a stable default.
    customer_segment = payload.get("CustomerSegment") or "Standard"

    return {
        "CustomerID": str(customer_id) if customer_id is not None else "",
        "InterestedVehicleClass": str(interested_vehicle) if interested_vehicle is not None else "",
        "BudgetRange": str(budget_range) if budget_range is not None else "",
        "IntendedPurchaseTimeframe": str(intended_timeframe) if intended_timeframe is not None else "",
        "CustomerSegment": str(customer_segment) if customer_segment is not None else "Standard",
        "PreferredCommunication": str(preferred_comm) if preferred_comm is not None else "",
    }


def _env(name: str, default: str) -> str:
    value = os.getenv(name)
    return value if value else default


def main() -> int:
    bootstrap = _env("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    request_topic = _env("REQUEST_TOPIC", "sales-executive-match-request")
    response_topic = _env("RESPONSE_TOPIC", "sales-executive-match-response")
    group_id = _env("KAFKA_GROUP_ID", "sales-executive-matcher")
    model_path = _env("MODEL_PATH", "crm_matching_model.pkl")

    consumer = KafkaConsumer(
        request_topic,
        bootstrap_servers=bootstrap,
        group_id=group_id,
        auto_offset_reset="latest",
        enable_auto_commit=True,
        value_deserializer=lambda b: json.loads(b.decode("utf-8")),
    )

    producer = KafkaProducer(
        bootstrap_servers=bootstrap,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )

    print(
        f"[OK] Listening on {request_topic} (bootstrap={bootstrap}, group={group_id}) -> publishing to {response_topic}"
    )

    for msg in consumer:
        payload: Dict[str, Any] = msg.value
        try:
            model_payload = _normalize_match_request(payload)
            sales_id = predict_salesperson_id(model_payload, model_path=model_path)

            # Publish in the shape CRM expects.
            out = {
                "dealId": payload.get("dealId"),
                "customerId": payload.get("customerId"),
                "salesExecutiveId": int(sales_id) if str(sales_id).isdigit() else sales_id,
            }

            # Also include model-oriented keys for debugging / future consumers.
            out["CustomerID"] = model_payload.get("CustomerID", "")
            out["SalesExecutiveID"] = sales_id

            if out.get("dealId"):
                out["message"] = f"Assigned sales executive {out['salesExecutiveId']} for deal {out['dealId']}"
            producer.send(response_topic, out)
            producer.flush(5)
            print(f"[OK] deal={out.get('dealId')} customer={out.get('CustomerID')} -> {out.get('salesExecutiveId')}")
        except Exception as e:
            err = {
                "dealId": payload.get("dealId"),
                "CustomerID": str(payload.get("CustomerID") or payload.get("customerId") or ""),
                "error": str(e),
            }
            # Still publish errors so downstream can see failures.
            producer.send(response_topic, err)
            producer.flush(5)
            print(f"[ERR] {err['CustomerID']}: {err['error']}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
