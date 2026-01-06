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


def calculate_health_score(deal_dna_data):
    """
    Simulate ML-based health score calculation with thresholds
    
    This is a dummy implementation that uses random scores.
    In a real system, this would use ML models trained on historical deal data.
    """
    
    # Simulate health score calculation (0-100)
    # In reality, this would analyze:
    # - Customer engagement patterns
    # - Response times
    # - Budget alignment
    # - Timeframe urgency
    # - Sales executive performance
    
    base_score = random.uniform(40, 90)
    
    # Calculate thresholds
    # Critical Threshold (low) - typically 25-35% of scale
    critical_threshold = random.uniform(25, 35)
    
    # Opportunity Threshold (high) - typically 65-75% of scale
    opportunity_threshold = random.uniform(65, 75)
    
    # Determine recommendation
    if base_score >= opportunity_threshold:
        recommendation = "High opportunity deal! Offer premium services like home test drive."
    elif base_score <= critical_threshold:
        recommendation = "Deal at risk. Consider reducing effort if customer remains unresponsive."
    else:
        recommendation = "Deal in progress. Continue standard engagement."
    
    return {
        "healthScore": round(base_score, 2),
        "criticalThreshold": round(critical_threshold, 2),
        "opportunityThreshold": round(opportunity_threshold, 2),
        "recommendation": recommendation
    }


def consume_health_score_requests():
    """
    Kafka consumer to listen for health score calculation requests
    """
    consumer = KafkaConsumer(
        'health-score-request',
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='deal-dna-analyzer-group'
    )
    
    print("Deal DNA Analyzer - Listening for health score requests...")
    
    for message in consumer:
        try:
            request_data = message.value
            print(f"Received health score request: {request_data}")
            
            # Calculate health score and thresholds
            score_data = calculate_health_score(request_data)
            
            # Add deal ID to response
            response = {
                "dealId": request_data.get("dealId"),
                "dealDnaId": request_data.get("dealDnaId"),
                **score_data
            }
            
            # Send response back to CRM
            producer.send('health-score-response', response)
            producer.flush()
            
            print(f"Sent health score response: {response}")
            
        except Exception as e:
            print(f"Error processing health score request: {e}")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "deal-dna-analyzer"}), 200


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Manual analysis endpoint for testing
    """
    try:
        data = request.get_json()
        response = calculate_health_score(data)
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/thresholds', methods=['GET'])
def get_thresholds():
    """
    Get recommended thresholds for deal health scoring
    """
    return jsonify({
        "criticalThreshold": {
            "name": "Critical Benchmark",
            "description": "Below this threshold, the deal is likely to fail",
            "range": "25-35%",
            "action": "Minimize effort if customer unresponsive"
        },
        "opportunityThreshold": {
            "name": "Opportunity Benchmark",
            "description": "Above this threshold, offer premium services",
            "range": "65-75%",
            "action": "Offer home test drive and premium services"
        }
    }), 200


if __name__ == '__main__':
    # Start Kafka consumer in a separate thread
    consumer_thread = threading.Thread(target=consume_health_score_requests, daemon=True)
    consumer_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=5002, debug=True)
