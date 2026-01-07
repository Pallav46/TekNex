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
    try:
        print("[Matcher] Falling back to training a fresh model...")
        matcher = SalesExecutiveMatcher(
            os.path.join(BASE_PATH, 'customers.csv'),
            os.path.join(BASE_PATH, 'salespeople.csv')
        )
        matcher.train(n_clusters=5)
        matcher.save_model(MATCHING_MODEL_PATH)
        print("[Matcher] Fresh model trained and saved")
    except Exception as e2:
        print(f"[Matcher] Fresh training failed: {e2}")

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
    try:
        if os.path.exists(DNA_TRAINING_FILE):
            print("[DNA System] Falling back to training a fresh model from CSV...")
            dna_predictor = DealDNAPredictor(n_pass_clusters=5, n_fail_clusters=5)
            train_df = pd.read_csv(DNA_TRAINING_FILE)
            dna_predictor.train(train_df)
            dna_predictor.save_model(DNA_MODEL_PATH)
            print("[DNA System] Fresh model trained and saved")
        else:
            print("[DNA System] Cannot train fresh model: CSV missing")
    except Exception as e2:
        print(f"[DNA System] Fresh training failed: {e2}")

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
    
    status = str(deal_dna_data.get('status') or '').upper()
    appointment_scheduled = bool(deal_dna_data.get('appointmentScheduled') or deal_dna_data.get('AppointmentScheduled') or False)
    test_drive_completed = bool(deal_dna_data.get('testDriveCompleted') or deal_dna_data.get('TestDriveCompleted') or False)
    finance_discussed = bool(deal_dna_data.get('financeDiscussed') or deal_dna_data.get('FinanceDiscussed') or False)
    paperwork_completed = bool(deal_dna_data.get('paperworkCompleted') or deal_dna_data.get('PaperworkCompleted') or False)
    delivery_completed = bool(deal_dna_data.get('deliveryCompleted') or deal_dna_data.get('DeliveryCompleted') or False)
    deal_completed = bool(deal_dna_data.get('dealCompleted') or deal_dna_data.get('DealCompleted') or False)
    deal_failed = bool(deal_dna_data.get('dealFailed') or deal_dna_data.get('DealFailed') or False)

    stage_bonus = 0.0
    if appointment_scheduled or status == 'APPOINTMENT_SCHEDULED':
        stage_bonus += 8.0
    if status == 'TEST_DRIVE':
        stage_bonus += 4.0
    if test_drive_completed:
        stage_bonus += 10.0
    if status == 'FINANCIAL_INQUIRY' or finance_discussed:
        stage_bonus += 8.0
    if status == 'PAPERWORK' or paperwork_completed:
        stage_bonus += 8.0
    if status == 'DELIVERY' or delivery_completed:
        stage_bonus += 6.0

    # Terminal states override
    if deal_failed or status == 'LOST':
        base_terminal_score = 0.0
    elif deal_completed or status == 'CLOSED':
        base_terminal_score = 100.0
    else:
        base_terminal_score = None

    # 1. If model isn't loaded, fall back to a deterministic stage-based heuristic.
    if not dna_predictor:
        # Start from a neutral score and reward progression.
        health_score = 55.0

        # Use lightweight interaction signals if present
        try:
            interaction_count = float(deal_dna_data.get('interactionCount') or 0)
            avg_response_minutes = float(deal_dna_data.get('avgResponseMinutes') or 0)
        except Exception:
            interaction_count = 0.0
            avg_response_minutes = 0.0

        health_score += min(10.0, interaction_count * 1.0)
        if avg_response_minutes > 0:
            # Faster responses => slightly higher score
            health_score += max(0.0, 6.0 - min(6.0, avg_response_minutes / 10.0))

        if base_terminal_score is not None:
            health_score = base_terminal_score
        else:
            health_score = max(0.0, min(100.0, round(health_score + stage_bonus, 2)))

        critical_threshold = 40.0
        opportunity_threshold = 75.0
        if health_score >= opportunity_threshold:
            rec = "Strong momentum! High probability of closure."
        elif health_score <= critical_threshold:
            rec = "At risk. Consider proactive follow-up and addressing objections."
        else:
            rec = "Standard progression. Keep engagement steady."

        return {
            "dealId": deal_id,
            "healthScore": health_score,
            "criticalThreshold": critical_threshold,
            "opportunityThreshold": opportunity_threshold,
            "recommendation": rec,
            "ml_details": {
                "prediction": "HEURISTIC",
                "confidence": None,
                "archetype": None
            }
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

        # 3b. Stage-aware adjustments (best-effort)
        if base_terminal_score is not None:
            health_score = base_terminal_score
        else:
            health_score = max(0.0, min(100.0, round(health_score + stage_bonus, 2)))
        
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