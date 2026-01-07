# How to Load and Use the CRM Matching Model

## Quick Start

```python
from crm_matching_system import SalesExecutiveMatcher

# Load the saved model (no retraining needed!)
matcher = SalesExecutiveMatcher.load_model('crm_matching_model.pkl')

# Get top-5 sales executives for a customer
top_execs = matcher.get_top_sales_execs('CUST0001', top_k=5)
print(top_execs)  # ['SALESP091', 'SALESP015', 'SALESP006', 'SALESP087', 'SALESP003']
```

## Main Methods

### 1. Load the Model
```python
matcher = SalesExecutiveMatcher.load_model('crm_matching_model.pkl')
```
- Loads the pre-trained model instantly
- No need to retrain or load CSV files
- Ready to use immediately

### 2. Get Top Sales Executives
```python
top_execs = matcher.get_top_sales_execs(customer_id, top_k=5)
```
- **Input**: Customer ID (e.g., 'CUST0001') and number of recommendations
- **Output**: List of SalespersonIDs (e.g., ['SALESP091', 'SALESP015', ...])
- **Use case**: Quick matching for assignment

### 3. Get Detailed Matching Information
```python
details = matcher.get_matching_details(customer_id, top_k=5)
```
- **Input**: Customer ID and number of recommendations
- **Output**: Dictionary with complete matching information
- **Use case**: Display detailed information to users

## Example: Detailed Information

```python
details = matcher.get_matching_details('CUST0001', top_k=5)

# Access the information:
print(details['customer_id'])           # 'CUST0001'
print(details['customer_segment'])      # 'loyal'
print(details['vehicle_interest'])       # 'SUV'
print(details['budget_range'])          # '$33,657-$45,943'
print(details['matched_cluster'])       # 2
print(details['top_executives'])         # ['SALESP091', 'SALESP015', ...]

# Executive details (list of dictionaries):
for exec_info in details['executive_details']:
    print(exec_info['Name'])                    # 'Barbara Anderson'
    print(exec_info['SalespersonID'])            # 'SALESP091'
    print(exec_info['ExperienceYears'])         # 12
    print(exec_info['AverageDealValue'])        # '$41,716'
    print(exec_info['PreferredVehicleClass'])   # 'sedan, SUV'
    print(exec_info['BestAtHandling'])          # 'new buyers'
```

## Common Use Cases

### Process Multiple Customers
```python
customer_ids = ['CUST0001', 'CUST0002', 'CUST0003']
for cust_id in customer_ids:
    top_execs = matcher.get_top_sales_execs(cust_id, top_k=5)
    print(f"{cust_id}: {top_execs}")
```

### Get Different Numbers of Recommendations
```python
# Get top-3
top_3 = matcher.get_top_sales_execs('CUST0001', top_k=3)

# Get top-10
top_10 = matcher.get_top_sales_execs('CUST0001', top_k=10)
```

### Error Handling
```python
try:
    top_execs = matcher.get_top_sales_execs('CUST9999', top_k=5)
except ValueError as e:
    print(f"Error: {e}")  # Customer not found
```

## Files

- `crm_matching_model.pkl` - The saved trained model (DO NOT DELETE!)
- `crm_matching_system.py` - The main class with all methods
- `how_to_use_model.py` - Complete example script
- `load_and_use_model.py` - Simple example script

## Notes

- The model is already trained and ready to use
- No need to call `.train()` when loading a saved model
- The model uses clustering + scoring to match customers to sales executives
- Returns top-k executives based on: experience, conversion rates, and budget match

