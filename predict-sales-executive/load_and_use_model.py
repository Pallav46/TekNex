"""
Example script showing how to load and use the saved CRM matching model.
"""

from crm_matching_system import SalesExecutiveMatcher

# Load the saved model
print("Loading saved model...")
matcher = SalesExecutiveMatcher.load_model('crm_matching_model.pkl')

# Example: Get top-5 sales executives for a customer
customer_id = 'CUST0001'
print(f"\nFinding top-5 sales executives for customer: {customer_id}")

top_execs = matcher.get_top_sales_execs(customer_id, top_k=5)
print(f"Top-5 Sales Executives: {top_execs}")

# Get detailed matching information
details = matcher.get_matching_details(customer_id, top_k=5)
print(f"\nDetailed Matching Information:")
print(f"  Customer Segment: {details['customer_segment']}")
print(f"  Vehicle Interest: {details['vehicle_interest']}")
print(f"  Budget Range: {details['budget_range']}")
print(f"  Matched Cluster: {details['matched_cluster']}")
print(f"\n  Executive Details:")
for exec_detail in details['executive_details']:
    print(f"    - {exec_detail['SalespersonID']}: {exec_detail['Name']}")
    print(f"      Experience: {exec_detail['ExperienceYears']} years")
    print(f"      Avg Deal Value: {exec_detail['AverageDealValue']}")
    print(f"      Best At: {exec_detail['BestAtHandling']}")

