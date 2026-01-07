"""Inference helpers for SalesExecutiveMatcher.

This module does NOT change the model implementation in crm_matching_system.py.
It only adapts DB-shaped request fields into the model's expected customer_row.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict, Optional

import pandas as pd

from crm_matching_system import SalesExecutiveMatcher


REQUIRED_FIELDS = {
    "CustomerID",
    "InterestedVehicleClass",
    "BudgetRange",
    "IntendedPurchaseTimeframe",
    "CustomerSegment",
    "PreferredCommunication",
}


@dataclass(frozen=True)
class MatchRequest:
    CustomerID: str
    InterestedVehicleClass: str
    BudgetRange: str
    IntendedPurchaseTimeframe: str
    CustomerSegment: str
    PreferredCommunication: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MatchRequest":
        missing = [k for k in REQUIRED_FIELDS if k not in data or data[k] is None]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(sorted(missing))}")

        return cls(
            CustomerID=str(data["CustomerID"]),
            InterestedVehicleClass=str(data["InterestedVehicleClass"]),
            BudgetRange=str(data["BudgetRange"]),
            IntendedPurchaseTimeframe=str(data["IntendedPurchaseTimeframe"]),
            CustomerSegment=str(data["CustomerSegment"]),
            PreferredCommunication=str(data["PreferredCommunication"]),
        )


@lru_cache(maxsize=8)
def load_matcher(model_path: str = "crm_matching_model.pkl") -> SalesExecutiveMatcher:
    return SalesExecutiveMatcher.load_model(model_path)


def predict_salesperson_id(
    request: MatchRequest | Dict[str, Any],
    *,
    model_path: str = "crm_matching_model.pkl",
) -> str:
    """Return the single best SalespersonID for the request."""

    if isinstance(request, dict):
        request_obj = MatchRequest.from_dict(request)
    else:
        request_obj = request

    matcher = load_matcher(model_path)

    # Build a synthetic customer row with only the fields the model uses.
    customer_row = pd.Series(
        {
            "CustomerID": request_obj.CustomerID,
            "InterestedVehicleClass": request_obj.InterestedVehicleClass,
            "BudgetRange": request_obj.BudgetRange,
            "IntendedPurchaseTimeframe": request_obj.IntendedPurchaseTimeframe,
            "CustomerSegment": request_obj.CustomerSegment,
            "PreferredCommunication": request_obj.PreferredCommunication,
        }
    )

    # Use the model's existing internal steps.
    customer_vector = matcher._create_customer_feature_vector(customer_row)
    best_cluster = matcher._match_customer_to_cluster(customer_vector)
    top_execs = matcher._rank_executives_in_cluster(best_cluster, customer_row, top_k=1)

    if not top_execs:
        raise RuntimeError("Model returned no executives")

    return str(top_execs[0])
