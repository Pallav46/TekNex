"""
Complete Guide: How to Load and Use the Saved CRM Matching Model

This script demonstrates all the ways you can use the saved model.
"""

from crm_matching_system import SalesExecutiveMatcher

# ============================================================================
# METHOD 1: Load the Saved Model (No Retraining Needed!)
# ============================================================================
print("="*70)
print("STEP 1: Loading the Saved Model")
print("="*70)

# Simply load the model - no need to retrain!
matcher = SalesExecutiveMatcher.load_model('crm_matching_model.pkl')

print("Model loaded successfully! Ready to use.\n")


# ============================================================================
# METHOD 2: Get Top Sales Executives for a Customer
# ============================================================================
print("="*70)
print("STEP 2: Get Top-5 Sales Executives for a Customer")
print("="*70)

customer_id = 'CUST0001'
top_execs = matcher.get_top_sales_execs(customer_id, top_k=5)

print(f"Customer ID: {customer_id}")
print(f"Top-5 Recommended Sales Executives: {top_execs}\n")


# ============================================================================
# METHOD 3: Get Detailed Matching Information
# ============================================================================
print("="*70)
print("STEP 3: Get Detailed Matching Information")
print("="*70)

details = matcher.get_matching_details(customer_id, top_k=5)

print(f"Customer: {details['customer_id']}")
print(f"  Segment: {details['customer_segment']}")
print(f"  Vehicle Interest: {details['vehicle_interest']}")
print(f"  Budget Range: {details['budget_range']}")
print(f"  Matched Cluster: {details['matched_cluster']}")
print(f"\n  Top Executives:")
for i, exec_detail in enumerate(details['executive_details'], 1):
    print(f"    {i}. {exec_detail['Name']} ({exec_detail['SalespersonID']})")
    print(f"       Experience: {exec_detail['ExperienceYears']} years")
    print(f"       Avg Deal Value: {exec_detail['AverageDealValue']}")
    print(f"       Best At: {exec_detail['BestAtHandling']}")
    print(f"       Preferred Vehicle: {exec_detail['PreferredVehicleClass']}\n")


# ============================================================================
# METHOD 4: Process Multiple Customers
# ============================================================================
print("="*70)
print("STEP 4: Process Multiple Customers at Once")
print("="*70)

customer_ids = ['CUST0001', 'CUST0002', 'CUST0003', 'CUST0010', 'CUST0025']

for cust_id in customer_ids:
    try:
        top_execs = matcher.get_top_sales_execs(cust_id, top_k=3)  # Get top-3
        print(f"{cust_id}: {', '.join(top_execs)}")
    except Exception as e:
        print(f"{cust_id}: Error - {str(e)}")

print()


# ============================================================================
# METHOD 5: Customize Number of Recommendations
# ============================================================================
print("="*70)
print("STEP 5: Get Different Numbers of Recommendations")
print("="*70)

# Get top-3 executives
top_3 = matcher.get_top_sales_execs('CUST0001', top_k=3)
print(f"Top-3: {top_3}")

# Get top-10 executives
top_10 = matcher.get_top_sales_execs('CUST0001', top_k=10)
print(f"Top-10: {top_10}\n")


# ============================================================================
# QUICK REFERENCE
# ============================================================================
print("="*70)
print("QUICK REFERENCE")
print("="*70)
print("""
# Load the model:
matcher = SalesExecutiveMatcher.load_model('crm_matching_model.pkl')

# Get top executives (returns list of SalespersonIDs):
top_execs = matcher.get_top_sales_execs('CUST0001', top_k=5)

# Get detailed information (returns dictionary):
details = matcher.get_matching_details('CUST0001', top_k=5)

# Available in details:
#   - details['customer_id']
#   - details['customer_segment']
#   - details['vehicle_interest']
#   - details['budget_range']
#   - details['matched_cluster']
#   - details['top_executives'] (list of IDs)
#   - details['executive_details'] (list of dicts with full info)
""")
print("="*70)

