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

# Sales executives data for matching (from database)
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
    },
    {
        "salesExecutiveId": 5,
        "salesExecutiveName": "Vikram Singh",
        "salesExecutiveEmail": "vikram.singh@royalwheels.com",
        "dealerId": 3,
        "dealerName": "Royal Wheels",
        "expertise": ["SUV", "MUV", "Commercial"]
    },
    {
        "salesExecutiveId": 6,
        "salesExecutiveName": "Anita Desai",
        "salesExecutiveEmail": "anita.desai@royalwheels.com",
        "dealerId": 3,
        "dealerName": "Royal Wheels",
        "expertise": ["Hatchback", "Sedan", "Electric"]
    },
    {
        "salesExecutiveId": 7,
        "salesExecutiveName": "Suresh Nair",
        "salesExecutiveEmail": "suresh.nair@crownauto.com",
        "dealerId": 4,
        "dealerName": "Crown Automobiles",
        "expertise": ["Sedan", "SUV", "Luxury"]
    },
    {
        "salesExecutiveId": 8,
        "salesExecutiveName": "Kavita Iyer",
        "salesExecutiveEmail": "kavita.iyer@crownauto.com",
        "dealerId": 4,
        "dealerName": "Crown Automobiles",
        "expertise": ["Hatchback", "Compact", "Electric"]
    },
    {
        "salesExecutiveId": 9,
        "salesExecutiveName": "Ravi Kumar",
        "salesExecutiveEmail": "ravi.kumar@sales.com",
        "dealerId": 1,
        "dealerName": "Premium Auto Hub",
        "expertise": ["SUV", "Sedan", "Electric"]
    }
]


def match_sales_executive(request_data):
    """
    Sales executive matching - hardcoded for demo/testing
    """
    print(f"=== Matching Sales Executive ===")
    print(f"Request data: {request_data}")
    
    deal_id = request_data.get('dealId')
    interest_category = request_data.get('interestCategory', 'Sedan')
    
    print(f"Deal ID: {deal_id}, Interest: {interest_category}")
    
    # HARDCODED: Always assign Rajesh Kumar (ID 1) for consistent chat testing
    selected = {
        "salesExecutiveId": 1,
        "salesExecutiveName": "Rajesh Kumar",
        "salesExecutiveEmail": "rajesh.kumar@premiumautohub.com",
        "dealerId": 1,
        "dealerName": "Premium Auto Hub"
    }
    
    response = {
        "dealId": deal_id,
        "salesExecutiveId": selected["salesExecutiveId"],
        "salesExecutiveName": selected["salesExecutiveName"],
        "salesExecutiveEmail": selected["salesExecutiveEmail"],
        "dealerId": selected["dealerId"],
        "dealerName": selected["dealerName"],
        "message": f"Assigned {selected['salesExecutiveName']} from {selected['dealerName']}"
    }
    
    print(f"Response: {response}")
    return response


def consume_match_requests():
    """
    Kafka consumer to listen for sales executive match requests
    """
    print(f"=== Starting Kafka Consumer ===")
    print(f"Kafka Servers: {KAFKA_BOOTSTRAP_SERVERS}")
    print(f"Topic: sales-executive-match-request")
    
    try:
        consumer = KafkaConsumer(
            'sales-executive-match-request',
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            group_id='sales-executive-predictor-group',
            request_timeout_ms=30000,
            session_timeout_ms=10000,
            heartbeat_interval_ms=3000,
            api_version=(0, 10, 1)
        )
        
        print("✓ Kafka Consumer Connected! Listening for match requests...")
        
        for message in consumer:
            try:
                request_data = message.value
                print(f"=== Received match request ===")
                print(f"Message: {request_data}")
                
                # Perform matching
                response = match_sales_executive(request_data)
                
                # Send response back to CRM
                print(f"Sending response to Kafka: {response}")
                producer.send('sales-executive-match-response', response)
                producer.flush()
                
                print(f"✓ Response sent successfully")
                
            except Exception as e:
                print(f"✗ Error processing match request: {e}")
                import traceback
                traceback.print_exc()
    except Exception as e:
        print(f"✗ Error connecting to Kafka: {e}")
        import traceback
        traceback.print_exc()


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
    
    # Start Flask app (debug=False to prevent reloading that kills daemon threads)
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
