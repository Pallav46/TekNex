import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.cluster import KMeans
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics.pairwise import euclidean_distances
import warnings
import os
import pickle

warnings.filterwarnings('ignore')

class DealDNAPredictor:
    def predict_single_deal(self, deal_data):
        """
        API Helper: Predict outcome for a single deal (dictionary input).
        """
        if self.pass_centroids is None or self.fail_centroids is None or self.preprocessor is None:
            raise ValueError("Model not trained! Call .train() first.")

        raw_df = pd.DataFrame([deal_data])
        processed_df = self._clean_input_data(raw_df.copy())
        row = processed_df.iloc[0]
        row_df = pd.DataFrame([row])

        for col in self.numeric_features + self.categorical_features:
            if col not in row_df.columns:
                row_df[col] = np.nan

        dna_vector = self.preprocessor.transform(row_df[self.numeric_features + self.categorical_features])

        dists_pass = euclidean_distances(dna_vector, self.pass_centroids)
        min_dist_pass = np.min(dists_pass)

        dists_fail = euclidean_distances(dna_vector, self.fail_centroids)
        min_dist_fail = np.min(dists_fail)

        epsilon = 1e-5
        sim_pass = 1 / (min_dist_pass + epsilon)
        sim_fail = 1 / (min_dist_fail + epsilon)
        total_sim = sim_pass + sim_fail

        prob_pass = sim_pass / total_sim
        prob_fail = sim_fail / total_sim

        return {
            'Prediction': "PASS" if prob_pass > prob_fail else "FAIL",
            'Pass_Conf': round(float(prob_pass), 2),
            'Fail_Conf': round(float(prob_fail), 2),
            'Closest_Archetype': 'Success' if prob_pass > prob_fail else 'Failure'
        }

    def __init__(self, n_pass_clusters=3, n_fail_clusters=3):
        self.n_pass_clusters = n_pass_clusters
        self.n_fail_clusters = n_fail_clusters
        self.pass_kmeans = None
        self.fail_kmeans = None
        self.preprocessor = None
        self.pass_centroids = None
        self.fail_centroids = None
        
        # MAPPING: PDF Field Names -> Internal Model Feature Names
        # This allows us to load the CSV directly
        self.column_mapping = {
            'Deal_HealthScore': 'HealthScore',
            'Deal_InteractionCount': 'InteractionCount',
            'Salesperson_ExperienceYears': 'ExperienceYears',
            'Deal_BudgetRange': 'BudgetRange',
            'Salesperson_AverageDealValue': 'AverageDealValue',
            'Deal_LowerBenchmark': 'LowerBenchmark',
            'Deal_UrgencyLevel': 'UrgencyLevel',
            'Customer_Segment': 'CustomerSegment',
            'Deal_InterestedVehicleClass': 'InterestedVehicleClass',
            'Customer_LeadSource': 'LeadSource',
            'Salesperson_Seniority': 'Seniority',
            'Salesperson_ClusterLabel': 'ClusterLabel',
            'Deal_Status': 'Status'
        }

        self.numeric_features = [
            'HealthScore', 'InteractionCount', 'ExperienceYears', 
            'Budget_Midpoint', 'DealValue_Midpoint', 'Delta_Benchmark_Health'
        ]
        self.categorical_features = [
            'UrgencyLevel', 'CustomerSegment', 'InterestedVehicleClass', 
            'LeadSource', 'Seniority', 'ClusterLabel'
        ]

    def _parse_budget(self, range_str):
        """Helper to convert '$40,000-$50,000' or strings to float"""
        if pd.isna(range_str) or range_str in ["NOT_YET_AVAILABLE", "IN_PROGRESS", "UNKNOWN"]:
            return 0.0
        try:
            clean = str(range_str).replace('$', '').replace(',', '')
            if '-' in clean:
                low, high = map(float, clean.split('-'))
                return (low + high) / 2
            return float(clean)
        except:
            return 0.0

    def _clean_input_data(self, df):
        """
        Prepares raw data (from CSV or DB) for the model.
        1. Renames columns based on mapping.
        2. Handles PDF placeholders (NOT_YET_AVAILABLE).
        3. Calculates calculated fields (Midpoints, Deltas).
        """
        # 1. Rename columns if they match PDF schema
        df = df.rename(columns=self.column_mapping)
        
        # 2. Replace PDF Placeholders with NaN (so Imputer handles them)
        placeholders = ["NOT_YET_AVAILABLE", "IN_PROGRESS", "UNKNOWN", "pending"]
        df = df.replace(placeholders, np.nan)
        
        # 3. Numeric Conversions
        if 'BudgetRange' in df.columns:
            df['Budget_Midpoint'] = df['BudgetRange'].apply(self._parse_budget)
        else:
            df['Budget_Midpoint'] = np.nan
            
        if 'AverageDealValue' in df.columns:
            df['DealValue_Midpoint'] = df['AverageDealValue'].apply(self._parse_budget)
        else:
            df['DealValue_Midpoint'] = np.nan
            
        # Health Calculation
        # Convert to numeric, forcing errors to NaN
        df['HealthScore'] = pd.to_numeric(df['HealthScore'], errors='coerce')
        df['LowerBenchmark'] = pd.to_numeric(df['LowerBenchmark'], errors='coerce')
        
        # Calculate Delta (Health - Benchmark)
        # If either is missing, fill with 0 to prevent error, Imputer will fix later
        df['Delta_Benchmark_Health'] = df['HealthScore'].fillna(50) - df['LowerBenchmark'].fillna(50)
        
        # Ensure 'ExperienceYears' is numeric
        df['ExperienceYears'] = pd.to_numeric(df['ExperienceYears'], errors='coerce')
        
        return df

    def train(self, raw_training_df):
        """
        Trains the dual-universe clustering model.
        """
        print(f"Training on {len(raw_training_df)} DNA records...")
        
        # Clean and prepare data
        df = self._clean_input_data(raw_training_df.copy())
        
        # Define Preprocessing Pipeline
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', Pipeline([
                    ('imputer', SimpleImputer(strategy='median')),
                    ('scaler', StandardScaler())
                ]), self.numeric_features),
                ('cat', Pipeline([
                    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
                    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
                ]), self.categorical_features)
            ]
        )
        
        # Validate Data Sufficiency
        pass_df = df[df['Status'] == 'pass']
        fail_df = df[df['Status'] != 'pass']
        
        if len(pass_df) < self.n_pass_clusters:
            print(f"WARNING: Not enough PASS data ({len(pass_df)}) for {self.n_pass_clusters} clusters. Reducing clusters.")
            self.n_pass_clusters = max(1, len(pass_df))
            
        if len(fail_df) < self.n_fail_clusters:
            print(f"WARNING: Not enough FAIL data ({len(fail_df)}) for {self.n_fail_clusters} clusters. Reducing clusters.")
            self.n_fail_clusters = max(1, len(fail_df))

        # Fit Preprocessor
        X_all = df[self.numeric_features + self.categorical_features]
        self.preprocessor.fit(X_all)
        
        # Cluster PASS Universe
        X_pass = self.preprocessor.transform(pass_df[self.numeric_features + self.categorical_features])
        self.pass_kmeans = KMeans(n_clusters=self.n_pass_clusters, random_state=42)
        self.pass_kmeans.fit(X_pass)
        self.pass_centroids = self.pass_kmeans.cluster_centers_
        
        # Cluster FAIL Universe
        X_fail = self.preprocessor.transform(fail_df[self.numeric_features + self.categorical_features])
        self.fail_kmeans = KMeans(n_clusters=self.n_fail_clusters, random_state=42)
        self.fail_kmeans.fit(X_fail)
        self.fail_centroids = self.fail_kmeans.cluster_centers_
        
        print(f"  > Learned {self.n_pass_clusters} Success Archetypes")
        print(f"  > Learned {self.n_fail_clusters} Failure Archetypes")

    def predict_from_csv(self, csv_path):
        """
        Loads partial DNA from CSV and predicts outcomes.
        """
        print(f"\n--- Loading Partial DNA from: {csv_path} ---")
        if not os.path.exists(csv_path):
            print("Error: File not found.")
            return

        # Load CSV
        raw_df = pd.read_csv(csv_path)
        
        # Process Data (handle NOT_YET_AVAILABLE, calculate fields)
        processed_df = self._clean_input_data(raw_df.copy())
        
        results = []
        
        # Iterate and Predict
        for idx, row in processed_df.iterrows():
            # Extract feature vector
            row_df = pd.DataFrame([row]) # Keep as DataFrame for transform
            
            # Use only features required by model
            # Fill missing cols with NaN if they didn't exist in CSV
            for col in self.numeric_features + self.categorical_features:
                if col not in row_df.columns:
                    row_df[col] = np.nan
            
            dna_vector = self.preprocessor.transform(row_df[self.numeric_features + self.categorical_features])
            
            # Calculate Distances
            dists_pass = euclidean_distances(dna_vector, self.pass_centroids)
            min_dist_pass = np.min(dists_pass)
            
            dists_fail = euclidean_distances(dna_vector, self.fail_centroids)
            min_dist_fail = np.min(dists_fail)
            
            # Fuzzy Probabilities
            epsilon = 1e-5
            sim_pass = 1 / (min_dist_pass + epsilon)
            sim_fail = 1 / (min_dist_fail + epsilon)
            total_sim = sim_pass + sim_fail
            
            prob_pass = sim_pass / total_sim
            prob_fail = sim_fail / total_sim
            
            results.append({
                'DNA_ID': raw_df.iloc[idx].get('DNA_ID', f"ROW_{idx}"),
                'Prediction': "PASS" if prob_pass > prob_fail else "FAIL",
                'Pass_Conf': round(prob_pass, 2),
                'Fail_Conf': round(prob_fail, 2),
                'Closest_Archetype': 'Success' if prob_pass > prob_fail else 'Failure'
            })
            
        return pd.DataFrame(results)

    def save_model(self, filepath):
        """Save trained model components to a pickle file."""
        if self.pass_centroids is None or self.fail_centroids is None or self.preprocessor is None:
            raise ValueError("Model has not been trained yet. Cannot save.")

        model_data = {
            'n_pass_clusters': self.n_pass_clusters,
            'n_fail_clusters': self.n_fail_clusters,
            'pass_kmeans': self.pass_kmeans,
            'fail_kmeans': self.fail_kmeans,
            'preprocessor': self.preprocessor,
            'pass_centroids': self.pass_centroids,
            'fail_centroids': self.fail_centroids,
            'column_mapping': self.column_mapping,
            'numeric_features': self.numeric_features,
            'categorical_features': self.categorical_features,
        }

        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        print(f"[DNA System] Model successfully saved to {filepath}")

    @classmethod
    def load_model(cls, filepath):
        """Load a trained model from a pickle file."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found at {filepath}")

        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)

        instance = cls(
            n_pass_clusters=model_data.get('n_pass_clusters', 3),
            n_fail_clusters=model_data.get('n_fail_clusters', 3),
        )

        instance.pass_kmeans = model_data.get('pass_kmeans')
        instance.fail_kmeans = model_data.get('fail_kmeans')
        instance.preprocessor = model_data.get('preprocessor')
        instance.pass_centroids = model_data.get('pass_centroids')
        instance.fail_centroids = model_data.get('fail_centroids')
        instance.column_mapping = model_data.get('column_mapping', instance.column_mapping)
        instance.numeric_features = model_data.get('numeric_features', instance.numeric_features)
        instance.categorical_features = model_data.get('categorical_features', instance.categorical_features)

        return instance

# ==========================================
# MAIN EXECUTION
# ==========================================

# ==========================================
# MAIN EXECUTION: USING YOUR ACTUAL FILES
# ==========================================

if __name__ == "__main__":
    
    # File Paths
    TRAINING_FILE = 'dna_complete.csv'
    PARTIAL_FILE = 'dna_partial.csv'
    
    # 1. Initialize the System
    # We ask for 5 clusters per side (you can adjust this number)
    predictor = DealDNAPredictor(n_pass_clusters=5, n_fail_clusters=5)
    
    # 2. LOAD & TRAIN (Using dna_complete.csv)
    print(f"--- 1. Loading Training Data from {TRAINING_FILE} ---")
    
    if os.path.exists(TRAINING_FILE):
        # Load the historical data
        train_df = pd.read_csv(TRAINING_FILE)
        
        # Train the model (Learn the Map)
        predictor.train(train_df)
        print("Training Complete. The model has learned the patterns of Success vs Failure.")
        
    else:
        print(f"ERROR: {TRAINING_FILE} not found. Please place the file in the same folder.")
        exit()

    # 3. LOAD & PREDICT (Using dna_partial.csv)
    print(f"\n--- 2. Loading Partial Data from {PARTIAL_FILE} ---")
    
    if os.path.exists(PARTIAL_FILE):
        # Predict outcomes for new deals
        # This function reads the CSV, cleans it, and maps it to the clusters we just learned
        results = predictor.predict_from_csv(PARTIAL_FILE)
        
        # Display Results
        print("\n--- 3. Prediction Results ---")
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 1000)
        print(results)
        
        import os
        import time
        
        # 1. Define the filename
        filename = 'dna_predictions.csv'
        
        try:
            # ATTEMPT 1: Save to current folder
            results.to_csv(filename, index=False)
            print(f"\n[SUCCESS] Predictions saved to '{filename}' in the current folder.")
            
        except PermissionError:
            print(f"\n[PERMISSION DENIED] Could not write to current folder.")
            
            # ATTEMPT 2: Save to Downloads folder (Usually works on Mac)
            try:
                # Get path to Downloads: /Users/yourname/Downloads
                home = os.path.expanduser("~")
                downloads_path = os.path.join(home, "Downloads")
                
                timestamp = int(time.time())
                new_filename = f'dna_predictions_{timestamp}.csv'
                full_path = os.path.join(downloads_path, new_filename)
                
                results.to_csv(full_path, index=False)
                print(f"[SAVED] Saved to your Downloads folder instead: '{full_path}'")
                
            except Exception as e:
                # ATTEMPT 3: Last Resort - Print to screen
                print(f"\n[CRITICAL] Could not write file anywhere ({str(e)}).")
                print("Here is the data in CSV format (Copy-Paste this):")
                print("-" * 50)
                print(results.to_csv(index=False))
                print("-" * 50)

        
    else:
        print(f"ERROR: {PARTIAL_FILE} not found. Cannot make predictions.")