"""Flask service exposing the matcher.

POST /match
Request JSON fields:
  - CustomerID
  - InterestedVehicleClass
  - BudgetRange
  - IntendedPurchaseTimeframe
  - CustomerSegment
  - PreferredCommunication

Response:
  {"CustomerID": "...", "SalesExecutiveID": "SALESP..."}

Env vars:
  - MODEL_PATH (default: crm_matching_model.pkl)
  - PORT (default: 8000)
"""

from __future__ import annotations

import os
import threading

from flask import Flask, jsonify, request

from matcher_inference import predict_salesperson_id
import kafka_worker


def create_app() -> Flask:
    app = Flask(__name__)

    @app.post("/match")
    def match() -> tuple:
        payload = request.get_json(force=True, silent=False)
        model_path = os.getenv("MODEL_PATH", "crm_matching_model.pkl")
        sales_id = predict_salesperson_id(payload, model_path=model_path)
        return jsonify({"CustomerID": str(payload.get("CustomerID", "")), "SalesExecutiveID": sales_id}), 200

    @app.get("/health")
    def health() -> tuple:
        return jsonify({"ok": True}), 200

    return app


if __name__ == "__main__":
    # Start Kafka consumer/producer loop in the background for CRM integration.
    worker_thread = threading.Thread(target=kafka_worker.main, daemon=True)
    worker_thread.start()

    app = create_app()
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
