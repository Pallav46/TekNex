from flask import Flask, request, jsonify
from kafka import KafkaConsumer, KafkaProducer
import json
import threading
import os
import pandas as pd
import numpy as np

# Import your ML Classes
from crm_matching_system import SalesExecutiveMatcher
from deal_dna_system import DealDNAPredictor

app = Flask(__name__)

# ==========================================
# 1. CONFIGURATION & MODEL LOADING
# ==========================================

# Kafka Config
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_GROUP_ID = 'deal-dna-analyzer-group'

# File Paths
# Use the folder containing this file by default (works both locally and in Docker).
BASE_PATH = os.getenv('DNA_BASE_PATH', os.path.dirname(os.path.abspath(__file__)))
MATCHING_MODEL_PATH = os.path.join(BASE_PATH, 'crm_matching_model.pkl')
DNA_MODEL_PATH = os.path.join(BASE_PATH, 'deal_dna_model.pkl')
DNA_TRAINING_FILE = os.path.join(BASE_PATH, 'dna_complete.csv')

# Global Model Objects
matcher = None
dna_predictor = None

print("--- INITIALIZING ML SERVICE ---")

# Load Salesperson Matcher
try:
    if os.path.exists(MATCHING_MODEL_PATH):
        print(f"[Matcher] Loading existing model...")
        matcher = SalesExecutiveMatcher.load_model(MATCHING_MODEL_PATH)
    else:
        print("[Matcher] Model not found! Training new one...")
        matcher = SalesExecutiveMatcher(
            os.path.join(BASE_PATH, 'customers.csv'), 
            os.path.join(BASE_PATH, 'salespeople.csv')
        )
        matcher.train(n_clusters=5)
        matcher.save_model(MATCHING_MODEL_PATH)
except Exception as e:
    print(f"[Matcher] Error: {e}")

# Load Deal DNA Predictor
try:
    if os.path.exists(DNA_MODEL_PATH):
        print(f"[DNA System] Loading saved model...")
        dna_predictor = DealDNAPredictor.load_model(DNA_MODEL_PATH)
    elif os.path.exists(DNA_TRAINING_FILE):
        print(f"[DNA System] Training from CSV...")
        dna_predictor = DealDNAPredictor(n_pass_clusters=5, n_fail_clusters=5)
        train_df = pd.read_csv(DNA_TRAINING_FILE)
        dna_predictor.train(train_df)
        dna_predictor.save_model(DNA_MODEL_PATH)
    else:
        print(f"[DNA System] Error: Training file not found.")
except Exception as e:
    print(f"[DNA System] Error: {e}")

# Initialize Kafka Producer
try:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    print("✓ Kafka Producer Initialized")
except Exception as e:
    print(f"✗ Kafka Producer Error: {e}")
    producer = None


# ==========================================
# 2. CORE LOGIC (ML INTEGRATION)
# ==========================================

def calculate_health_score(deal_dna_data):
    """
    Real ML-based health score calculation.
    """
    print(f"=== Calculating Health Score (ML) ===")
    deal_id = deal_dna_data.get('dealId', 'UNKNOWN')
    
    # 1. Check if model is loaded
    if not dna_predictor:
        return {
            "dealId": deal_id,
            "error": "ML Model not loaded",
            "healthScore": 0,
            "recommendation": "System Error"
        }

    # 2. Predict using Deal DNA System
    # The DNA predictor expects keys like 'Deal_HealthScore', 'Salesperson_ExperienceYears'
    # The Spring Boot app might send camelCase. We pass it directly, 
    # relying on the predictor's cleaning logic or adding mapping here if needed.
    try:
        prediction_result = dna_predictor.predict_single_deal(deal_dna_data)
        
        # 3. Convert ML Probability to Health Score (0-100)
        # Pass_Conf is between 0.0 and 1.0
        pass_probability = prediction_result['Pass_Conf']
        health_score = round(pass_probability * 100, 2)
        
        # 4. Define Thresholds (Can be dynamic or fixed policies)
        critical_threshold = 40.0  # Below 40% chance is Critical
        opportunity_threshold = 75.0 # Above 75% chance is Opportunity
        
        # 5. Generate Recommendation
        if health_score >= opportunity_threshold:
            rec = "Strong DNA match! High probability of closure. Fast-track this deal."
        elif health_score <= critical_threshold:
            rec = f"At Risk (Matches Failure Cluster). Intervention needed. Issue: {prediction_result['Closest_Archetype']}"
        else:
            rec = "Standard progression. Monitor interaction count."

        response = {
            "dealId": deal_id,
            "healthScore": health_score,
            "criticalThreshold": critical_threshold,
            "opportunityThreshold": opportunity_threshold,
            "recommendation": rec,
            "ml_details": {
                "prediction": prediction_result['Prediction'],
                "confidence": prediction_result['Pass_Conf'],
                "archetype": prediction_result['Closest_Archetype']
            }
        }
        
        print(f"ML Calculation Complete: Score {health_score}")
        return response
        
    except Exception as e:
        print(f"ML Prediction Error: {e}")
        return {"dealId": deal_id, "error": str(e), "healthScore": 0}


# ==========================================
# 3. KAFKA CONSUMER WORKER
# ==========================================

def consume_health_score_requests():
    """
    Listens to Spring Boot requests -> Runs ML -> Sends response back
    """
    print(f"=== Starting Kafka Consumer ===")
    
    if not KAFKA_BOOTSTRAP_SERVERS:
        print("Kafka not configured. Skipping consumer.")
        return

    try:
        consumer = KafkaConsumer(
            'health-score-request',
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='earliest',
            group_id=KAFKA_GROUP_ID
        )
        
        print("✓ Kafka Consumer Connected!")
        
        for message in consumer:
            try:
                request_data = message.value
                print(f"Received Request: {request_data.get('dealId')}")
                
                # RUN ML LOGIC
                response = calculate_health_score(request_data)
                
                # SEND RESPONSE
                if producer:
                    producer.send('health-score-response', response)
                    producer.flush()
                    print(f"✓ Response sent for {response.get('dealId')}")
                
            except Exception as e:
                print(f"✗ processing error: {e}")
                
    except Exception as e:
        print(f"✗ Connection error: {e}")


# ==========================================
# 4. FLASK API ENDPOINTS
# ==========================================

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy", 
        "service": "deal-dna-analyzer",
        "models": {
            "matcher": matcher is not None,
            "dna_predictor": dna_predictor is not None
        }
    }), 200

# Endpoint 1: Salesperson Matching (For CRM)
@app.route('/match', methods=['POST'])
def match_salesperson():
    if not matcher:
        return jsonify({"error": "Matcher model not loaded"}), 500

    data = request.get_json()
    if 'CustomerSegment' not in data:
        return jsonify({"error": "Missing CustomerSegment"}), 400

    try:
        matches = matcher.predict_new_customer(data, top_k=5)
        return jsonify({
            "status": "success",
            "matches": matches
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint 2: DNA Analysis (Manual/REST Trigger)
@app.route('/analyze', methods=['POST'])
@app.route('/predict_deal', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        response = calculate_health_score(data)
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/thresholds', methods=['GET'])
def get_thresholds():
    return jsonify({
        "criticalThreshold": {
            "name": "Critical Benchmark",
            "range": "0-40%",
            "action": "Immediate Intervention"
        },
        "opportunityThreshold": {
            "name": "Opportunity Benchmark",
            "range": "75-100%",
            "action": "Fast Track"
        }
    }), 200

if __name__ == '__main__':
    # Start Kafka consumer in background thread
    consumer_thread = threading.Thread(target=consume_health_score_requests, daemon=True)
    consumer_thread.start()
    
    # Start Flask
    port = int(os.getenv('PORT', '5003'))
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)