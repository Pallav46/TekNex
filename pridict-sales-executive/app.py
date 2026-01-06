from flask import Flask, request, jsonify
from kafka import KafkaConsumer, KafkaProducer
import json
import threading
import random
import os

app = Flask(__name__)

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')

# Initialize Kafka producer
producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Dummy sales executives data for matching
SALES_EXECUTIVES = [
    {
        "salesExecutiveId": 1,
        "salesExecutiveName": "Rajesh Kumar",
        "salesExecutiveEmail": "rajesh.kumar@premiumautohub.com",
        "dealerId": 1,
        "dealerName": "Premium Auto Hub",
        "expertise": ["SUV", "Sedan", "Luxury"]
    },
    {
        "salesExecutiveId": 2,
        "salesExecutiveName": "Priya Sharma",
        "salesExecutiveEmail": "priya.sharma@premiumautohub.com",
        "dealerId": 1,
        "dealerName": "Premium Auto Hub",
        "expertise": ["Hatchback", "Sedan", "Electric"]
    },
    {
        "salesExecutiveId": 3,
        "salesExecutiveName": "Amit Patel",
        "salesExecutiveEmail": "amit.patel@elitemotors.com",
        "dealerId": 2,
        "dealerName": "Elite Motors",
        "expertise": ["SUV", "Electric", "Luxury"]
    },
    {
        "salesExecutiveId": 4,
        "salesExecutiveName": "Sneha Reddy",
        "salesExecutiveEmail": "sneha.reddy@elitemotors.com",
        "dealerId": 2,
        "dealerName": "Elite Motors",
        "expertise": ["Sedan", "Hatchback", "Compact"]
    }
]


def match_sales_executive(request_data):
    """
    Simulate ML-based sales executive matching
    """
    interest_category = request_data.get('interestCategory', 'Sedan')
    
    # Find matching sales executives based on expertise
    matching_executives = []
    for se in SALES_EXECUTIVES:
        if interest_category in se['expertise']:
            matching_executives.append(se)
    
    # If no exact match, return random
    if not matching_executives:
        matching_executives = SALES_EXECUTIVES
    
    # Select best match (for demo, just pick the first or random)
    selected = random.choice(matching_executives)
    
    return {
        "salesExecutiveId": selected["salesExecutiveId"],
        "salesExecutiveName": selected["salesExecutiveName"],
        "salesExecutiveEmail": selected["salesExecutiveEmail"],
        "dealerId": selected["dealerId"],
        "dealerName": selected["dealerName"],
        "message": f"Matched based on expertise in {interest_category}"
    }


def consume_match_requests():
    """
    Kafka consumer to listen for sales executive match requests
    """
    consumer = KafkaConsumer(
        'sales-executive-match-request',
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='sales-executive-predictor-group'
    )
    
    print("Sales Executive Predictor - Listening for match requests...")
    
    for message in consumer:
        try:
            request_data = message.value
            print(f"Received match request: {request_data}")
            
            # Perform matching
            response = match_sales_executive(request_data)
            
            # Send response back to CRM
            producer.send('sales-executive-match-response', response)
            producer.flush()
            
            print(f"Sent match response: {response}")
            
        except Exception as e:
            print(f"Error processing match request: {e}")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "sales-executive-predictor"}), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Manual prediction endpoint for testing
    """
    try:
        data = request.get_json()
        response = match_sales_executive(data)
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Start Kafka consumer in a separate thread
    consumer_thread = threading.Thread(target=consume_match_requests, daemon=True)
    consumer_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=5001, debug=True)
