"""
Automotive CRM: Customer-to-Salesperson Matching System
Using Unsupervised Clustering + Scoring Approach

Author: Senior ML Engineer
Purpose: Hackathon Prototype - Simple, Interpretable, Production-Ready
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
import warnings
warnings.filterwarnings('ignore')


class SalesExecutiveMatcher:
    """
    Matches customers with top-5 suitable sales executives using clustering.
    """
    
    def __init__(self, customers_path='customers.csv', salespeople_path='salespeople.csv'):
        """
        Initialize the matcher with data paths.
        
        Args:
            customers_path: Path to customers CSV
            salespeople_path: Path to salespeople CSV
        """
        self.customers_df = pd.read_csv(customers_path)
        self.salespeople_df = pd.read_csv(salespeople_path)
        
        # Will be set during training
        self.kmeans_model = None
        self.scaler = None
        self.cluster_centroids = None
        self.salespeople_features = None
        self.feature_columns = None
        self.n_clusters = 5  # Default: 5 clusters for sales executives
        
        # Encoding mappings
        self.vehicle_class_encoder = LabelEncoder()
        self.communication_encoder = LabelEncoder()
        self.urgency_mapping = {
            'immediate': 4,
            '<1 month': 3,
            '1-3 months': 2,
            'just exploring': 1
        }
        
    def _engineer_salesperson_features(self):
        """
        STEP 1: Sales Executive Feature Engineering
        Extract and normalize key features from sales executive profiles.
        """
        df = self.salespeople_df.copy()
        
        # Numerical features
        df['ExperienceYears'] = pd.to_numeric(df['ExperienceYears'], errors='coerce')
        df['DealsClosedTotal'] = pd.to_numeric(df['DealsClosedTotal'], errors='coerce')
        
        # Parse conversion rates (remove % and convert to float)
        for col in ['ConversionFirstTime', 'ConversionRepeat', 'ConversionLuxury', 'ConversionPriceSensitive']:
            df[col] = df[col].str.rstrip('%').astype(float) / 100
        
        # Parse average deal value (remove $ and commas)
        df['AverageDealValue'] = df['AverageDealValue'].replace(r'[\$,]', '', regex=True).astype(float)
        
        # Calculate vehicle expertise scores (deals closed per category)
        df['SedanExpertise'] = pd.to_numeric(df['DealsClosedSedan'], errors='coerce')
        df['SUVExpertise'] = pd.to_numeric(df['DealsClosedSUV'], errors='coerce')
        df['SportsExpertise'] = pd.to_numeric(df['DealsClosedSports'], errors='coerce')
        df['EVExpertise'] = pd.to_numeric(df['DealsClosedEV'], errors='coerce')
        df['UsedExpertise'] = pd.to_numeric(df['DealsClosedUsed'], errors='coerce')
        
        # Normalize expertise by total deals to get proportions
        total_deals = df['DealsClosedTotal'].replace(0, 1)  # Avoid division by zero
        df['SedanExpertise_norm'] = df['SedanExpertise'] / total_deals
        df['SUVExpertise_norm'] = df['SUVExpertise'] / total_deals
        df['SportsExpertise_norm'] = df['SportsExpertise'] / total_deals
        df['EVExpertise_norm'] = df['EVExpertise'] / total_deals
        df['UsedExpertise_norm'] = df['UsedExpertise'] / total_deals
        
        # Communication preference encoding
        df['PrefersCall'] = df['PreferredVehicleClass'].str.contains('sedan|SUV', case=False, na=False).astype(int)
        df['PrefersEmail'] = df['BestAtHandling'].str.contains('fleet|corporate', case=False, na=False).astype(int)
        df['PrefersText'] = df['BestAtHandling'].str.contains('new buyers|Budget', case=False, na=False).astype(int)
        
        # Handle missing values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        
        # Select final feature set for clustering
        self.feature_columns = [
            'ExperienceYears',
            'AverageDealValue',
            'ConversionFirstTime',
            'ConversionRepeat',
            'ConversionLuxury',
            'ConversionPriceSensitive',
            'SedanExpertise_norm',
            'SUVExpertise_norm',
            'SportsExpertise_norm',
            'EVExpertise_norm',
            'UsedExpertise_norm',
            'PrefersCall',
            'PrefersEmail',
            'PrefersText'
        ]
        
        return df[['SalespersonID'] + self.feature_columns]
    
    def _cluster_sales_executives(self, n_clusters=5):
        """
        STEP 2: Cluster Sales Executives
        Apply KMeans clustering on sales executive feature space.
        
        Args:
            n_clusters: Number of clusters (default: 5)
        """
        self.n_clusters = n_clusters
        
        # Get engineered features
        self.salespeople_features = self._engineer_salesperson_features()
        
        # Extract feature matrix
        X = self.salespeople_features[self.feature_columns].values
        
        # Normalize features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Apply KMeans clustering
        self.kmeans_model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = self.kmeans_model.fit_predict(X_scaled)
        
        # Store cluster assignments
        self.salespeople_features['cluster_id'] = cluster_labels
        
        # Store centroids for matching
        self.cluster_centroids = self.kmeans_model.cluster_centers_
        
        print(f"[OK] Clustered {len(self.salespeople_features)} sales executives into {n_clusters} clusters")
        print(f"  Cluster distribution: {np.bincount(cluster_labels)}")
    
    def _create_customer_feature_vector(self, customer_row):
        """
        STEP 3: Create Customer Feature Vector
        Convert customer attributes into the same feature space as sales executives.
        
        Args:
            customer_row: Single row from customers DataFrame
            
        Returns:
            Feature vector aligned with sales executive feature space
        """
        features = {}
        
        # Budget → Average Deal Value
        budget_range = customer_row['BudgetRange']
        if pd.notna(budget_range) and '-' in str(budget_range):
            # Parse budget range like "$33,657-$45,943"
            parts = budget_range.replace('$', '').replace(',', '').split('-')
            try:
                budget_min = float(parts[0])
                budget_max = float(parts[1])
                features['AverageDealValue'] = (budget_min + budget_max) / 2
            except:
                features['AverageDealValue'] = 35000  # Default mid-range
        else:
            features['AverageDealValue'] = 35000
        
        # Purchase urgency → Experience preference
        urgency = customer_row.get('IntendedPurchaseTimeframe', 'just exploring')
        urgency_score = self.urgency_mapping.get(urgency, 1)
        features['ExperienceYears'] = urgency_score * 3  # Higher urgency → prefer experienced
        
        # Vehicle interest → Vehicle expertise
        vehicle_interest = customer_row.get('InterestedVehicleClass', 'sedan').lower()
        features['SedanExpertise_norm'] = 1.0 if 'sedan' in vehicle_interest else 0.0
        features['SUVExpertise_norm'] = 1.0 if 'suv' in vehicle_interest else 0.0
        features['SportsExpertise_norm'] = 1.0 if 'sport' in vehicle_interest else 0.0
        features['EVExpertise_norm'] = 1.0 if 'ev' in vehicle_interest else 0.0
        features['UsedExpertise_norm'] = 1.0 if 'used' in vehicle_interest else 0.0
        
        # Customer segment → Conversion rate preferences
        segment = customer_row.get('CustomerSegment', 'first-time')
        features['ConversionFirstTime'] = 0.6 if segment == 'first-time' else 0.3
        features['ConversionRepeat'] = 0.6 if segment == 'loyal' else 0.3
        features['ConversionLuxury'] = 0.6 if segment == 'luxury' else 0.2
        features['ConversionPriceSensitive'] = 0.6 if segment == 'price-sensitive' else 0.2
        
        # Communication preference
        comm_pref = customer_row.get('PreferredCommunication', 'email').lower()
        features['PrefersCall'] = 1 if 'call' in comm_pref or 'phone' in comm_pref else 0
        features['PrefersEmail'] = 1 if 'email' in comm_pref else 0
        features['PrefersText'] = 1 if 'text' in comm_pref or 'whatsapp' in comm_pref else 0
        
        # Create feature vector in same order as training features
        feature_vector = np.array([features.get(col, 0) for col in self.feature_columns])
        
        return feature_vector
    
    def _match_customer_to_cluster(self, customer_feature_vector):
        """
        STEP 4: Match Customer to Best Cluster
        Find the most similar cluster for the customer using cosine similarity.
        
        Args:
            customer_feature_vector: Customer's feature vector
            
        Returns:
            Best matching cluster_id
        """
        # Normalize customer features using the same scaler
        customer_scaled = self.scaler.transform(customer_feature_vector.reshape(1, -1))
        
        # Compute cosine similarity with all cluster centroids
        similarities = cosine_similarity(customer_scaled, self.cluster_centroids)[0]
        
        # Select cluster with highest similarity
        best_cluster = np.argmax(similarities)
        
        return best_cluster
    
    def _rank_executives_in_cluster(self, cluster_id, customer_row, top_k=5):
        """
        STEP 5: Rank Sales Executives within Cluster
        Score and rank executives based on composite criteria.
        
        Args:
            cluster_id: Target cluster
            customer_row: Customer data for personalized scoring
            top_k: Number of top executives to return
            
        Returns:
            List of top-k SalespersonIDs
        """
        # Get executives in this cluster
        cluster_execs = self.salespeople_features[
            self.salespeople_features['cluster_id'] == cluster_id
        ].copy()
        
        if len(cluster_execs) == 0:
            # Fallback: if cluster is empty, use all executives
            cluster_execs = self.salespeople_features.copy()
        
        # Merge with original salespeople data for additional scoring
        cluster_execs = cluster_execs.merge(
            self.salespeople_df[['SalespersonID', 'ConversionFirstTime', 'ConversionRepeat', 
                                  'ConversionLuxury', 'ConversionPriceSensitive', 
                                  'AverageDealValue', 'ExperienceYears']],
            on='SalespersonID',
            how='left',
            suffixes=('', '_orig')
        )
        
        # Composite scoring function
        # Weight factors (adjustable based on business priority)
        w_experience = 0.25
        w_conversion = 0.40
        w_budget_match = 0.35
        
        # Normalize experience (0-1 scale)
        max_exp = cluster_execs['ExperienceYears_orig'].max()
        cluster_execs['exp_score'] = cluster_execs['ExperienceYears_orig'] / max_exp if max_exp > 0 else 0
        
        # Select appropriate conversion rate based on customer segment
        segment = customer_row.get('CustomerSegment', 'first-time')
        if segment == 'first-time':
            cluster_execs['conv_score'] = cluster_execs['ConversionFirstTime_orig'].str.rstrip('%').astype(float) / 100
        elif segment == 'loyal':
            cluster_execs['conv_score'] = cluster_execs['ConversionRepeat_orig'].str.rstrip('%').astype(float) / 100
        elif segment == 'luxury':
            cluster_execs['conv_score'] = cluster_execs['ConversionLuxury_orig'].str.rstrip('%').astype(float) / 100
        elif segment == 'price-sensitive':
            cluster_execs['conv_score'] = cluster_execs['ConversionPriceSensitive_orig'].str.rstrip('%').astype(float) / 100
        else:
            cluster_execs['conv_score'] = cluster_execs['ConversionFirstTime_orig'].str.rstrip('%').astype(float) / 100
        
        # Budget match score (inverse of percentage difference)
        customer_budget = self._extract_budget_midpoint(customer_row['BudgetRange'])
        cluster_execs['AverageDealValue_clean'] = (
            cluster_execs['AverageDealValue_orig']
            .astype(str)
            .str.replace(r'[\$,]', '', regex=True)
            .astype(float)
        )
        cluster_execs['budget_diff'] = abs(cluster_execs['AverageDealValue_clean'] - customer_budget)
        max_diff = cluster_execs['budget_diff'].max()
        cluster_execs['budget_score'] = 1 - (cluster_execs['budget_diff'] / max_diff) if max_diff > 0 else 1
        
        # Calculate composite score
        cluster_execs['composite_score'] = (
            w_experience * cluster_execs['exp_score'] +
            w_conversion * cluster_execs['conv_score'] +
            w_budget_match * cluster_execs['budget_score']
        )
        
        # Sort by score and return top-k
        cluster_execs = cluster_execs.sort_values('composite_score', ascending=False)
        top_executives = cluster_execs['SalespersonID'].head(top_k).tolist()
        
        return top_executives
    
    def _extract_budget_midpoint(self, budget_range):
        """Helper to extract midpoint from budget range string."""
        if pd.notna(budget_range) and '-' in str(budget_range):
            parts = budget_range.replace('$', '').replace(',', '').split('-')
            try:
                return (float(parts[0]) + float(parts[1])) / 2
            except:
                return 35000
        return 35000
    
    def train(self, n_clusters=5):
        """
        Train the matching system: cluster sales executives.
        
        Args:
            n_clusters: Number of clusters for sales executives
        """
        print("\n" + "="*60)
        print("TRAINING: Automotive CRM Matching System")
        print("="*60)
        
        self._cluster_sales_executives(n_clusters=n_clusters)
        
        print(f"\n[OK] Training complete!")
        print(f"  Model ready to match customers with top-{5} sales executives")
        print("="*60 + "\n")
    
    def get_top_sales_execs(self, customer_id, top_k=5):
        """
        Main API: Get top-k sales executives for a customer.
        
        Args:
            customer_id: Customer ID (e.g., 'CUST0001')
            top_k: Number of executives to return (default: 5)
            
        Returns:
            List of top-k SalespersonIDs
        """
        # Validate training
        if self.kmeans_model is None:
            raise ValueError("Model not trained! Call .train() first.")
        
        # Get customer data
        customer_row = self.customers_df[self.customers_df['CustomerID'] == customer_id]
        
        if len(customer_row) == 0:
            raise ValueError(f"Customer {customer_id} not found in dataset")
        
        customer_row = customer_row.iloc[0]
        
        # Create customer feature vector
        customer_vector = self._create_customer_feature_vector(customer_row)
        
        # Match to best cluster
        best_cluster = self._match_customer_to_cluster(customer_vector)
        
        # Rank executives in cluster
        top_execs = self._rank_executives_in_cluster(best_cluster, customer_row, top_k)
        
        return top_execs
    
    def get_matching_details(self, customer_id, top_k=5):
        """
        Get detailed matching information (for debugging/explanation).
        
        Args:
            customer_id: Customer ID
            top_k: Number of executives to return
            
        Returns:
            Dictionary with matching details
        """
        customer_row = self.customers_df[self.customers_df['CustomerID'] == customer_id].iloc[0]
        customer_vector = self._create_customer_feature_vector(customer_row)
        best_cluster = self._match_customer_to_cluster(customer_vector)
        top_execs = self._rank_executives_in_cluster(best_cluster, customer_row, top_k)
        
        # Get executive details
        exec_details = self.salespeople_df[
            self.salespeople_df['SalespersonID'].isin(top_execs)
        ][['SalespersonID', 'Name', 'ExperienceYears', 'AverageDealValue', 
           'PreferredVehicleClass', 'BestAtHandling']]
        
        return {
            'customer_id': customer_id,
            'customer_segment': customer_row['CustomerSegment'],
            'vehicle_interest': customer_row['InterestedVehicleClass'],
            'budget_range': customer_row['BudgetRange'],
            'matched_cluster': int(best_cluster),
            'top_executives': top_execs,
            'executive_details': exec_details.to_dict('records')
        }
    
    def save_model(self, model_path='crm_matching_model.pkl'):
        """
        Save the trained model to disk.
        
        Args:
            model_path: Path where to save the model
        """
        if self.kmeans_model is None:
            raise ValueError("Model not trained! Call .train() first.")
        
        # Prepare model data for saving
        model_data = {
            'kmeans_model': self.kmeans_model,
            'scaler': self.scaler,
            'cluster_centroids': self.cluster_centroids,
            'salespeople_features': self.salespeople_features,
            'feature_columns': self.feature_columns,
            'n_clusters': self.n_clusters,
            'urgency_mapping': self.urgency_mapping,
            'customers_df': self.customers_df,
            'salespeople_df': self.salespeople_df
        }
        
        # Save to file
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"[OK] Model saved to: {model_path}")
    
    @classmethod
    def load_model(cls, model_path='crm_matching_model.pkl'):
        """
        Load a trained model from disk.
        
        Args:
            model_path: Path to the saved model
            
        Returns:
            SalesExecutiveMatcher instance with loaded model
        """
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        # Load model data
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        # Create instance (without loading CSVs since they're in model_data)
        instance = cls.__new__(cls)
        
        # Restore all attributes
        instance.kmeans_model = model_data['kmeans_model']
        instance.scaler = model_data['scaler']
        instance.cluster_centroids = model_data['cluster_centroids']
        instance.salespeople_features = model_data['salespeople_features']
        instance.feature_columns = model_data['feature_columns']
        instance.n_clusters = model_data['n_clusters']
        instance.urgency_mapping = model_data['urgency_mapping']
        instance.customers_df = model_data['customers_df']
        instance.salespeople_df = model_data['salespeople_df']
        
        # Initialize encoders (not used but kept for compatibility)
        instance.vehicle_class_encoder = LabelEncoder()
        instance.communication_encoder = LabelEncoder()
        
        print(f"[OK] Model loaded from: {model_path}")
        return instance


def main():
    """
    Demo: Train and test the matching system.
    """
    print("\n" + "="*70)
    print("AUTOMOTIVE CRM: CUSTOMER-TO-SALESPERSON MATCHING SYSTEM")
    print("Hackathon Prototype | Unsupervised Clustering Approach")
    print("="*70)
    
    # Initialize matcher with local CSV files
    matcher = SalesExecutiveMatcher(
        customers_path='customers.csv',
        salespeople_path='salespeople.csv'
    )
    
    # Train the system
    matcher.train(n_clusters=5)
    
    # Save the trained model
    model_path = 'crm_matching_model.pkl'
    matcher.save_model(model_path)
    
    # Test with sample customers
    print("\n" + "-"*70)
    print("DEMO: Sample Customer Matches")
    print("-"*70)
    
    test_customers = ['CUST0001', 'CUST0002', 'CUST0003', 'CUST0004', 'CUST0005']
    
    for cust_id in test_customers:
        try:
            # Get top-5 executives
            top_execs = matcher.get_top_sales_execs(cust_id, top_k=5)
            
            # Get detailed info
            details = matcher.get_matching_details(cust_id, top_k=5)
            
            print(f"\n>> Customer: {cust_id}")
            print(f"  Profile: {details['customer_segment']} | {details['vehicle_interest']} | {details['budget_range']}")
            print(f"  Matched Cluster: {details['matched_cluster']}")
            print(f"  Top-5 Sales Executives: {', '.join(top_execs)}")
            
        except Exception as e:
            print(f"\n>> Customer: {cust_id} - Error: {str(e)}")
    
    print("\n" + "="*70)
    print("DEMO COMPLETE")
    print("="*70 + "\n")
    
    # Show how to use the API
    print("\n" + "-"*70)
    print("API USAGE EXAMPLE")
    print("-"*70)
    print("""
# After training and saving:
matcher = SalesExecutiveMatcher('customers.csv', 'salespeople.csv')
matcher.train(n_clusters=5)
matcher.save_model('crm_matching_model.pkl')

# To load a saved model later:
matcher = SalesExecutiveMatcher.load_model('crm_matching_model.pkl')

# Get top-5 sales executives for any customer:
top_execs = matcher.get_top_sales_execs('CUST0001', top_k=5)
print(top_execs)  # ['SALESP001', 'SALESP002', 'SALESP003', 'SALESP004', 'SALESP005']

# Get detailed matching information:
details = matcher.get_matching_details('CUST0001', top_k=5)
print(details)
    """)
    print("-"*70 + "\n")


if __name__ == "__main__":
    main()


# ============================================================================
# WHY THIS APPROACH SUITS AUTOMOTIVE CRM
# ============================================================================
"""
1. FLEXIBLE ASSIGNMENT POOL
   - Returns Top-5 executives (not single match)
   - Allows for availability/workload balancing
   - Reduces bottlenecks from busy salespeople

2. INTERPRETABLE CLUSTERING
   - Sales managers can understand cluster profiles:
     * Luxury specialists
     * Budget/Used car experts
     * First-time buyer handlers
     * EV specialists
     * Fleet/Corporate managers
   
3. NO HISTORICAL LABELS NEEDED
   - Unsupervised approach works without years of labeled data
   - Perfect for new dealerships or CRM migrations
   
4. COMPOSITE SCORING
   - Experience + Conversion Rate + Budget Match
   - Transparent weights that can be adjusted by business
   - Easy to explain to non-technical stakeholders

5. SCALABLE FEATURE ENGINEERING
   - Customer preferences → Sales executive strengths
   - Vehicle interest → Category expertise
   - Budget range → Average deal size
   - Communication style → Preferred channels

# ============================================================================
# PRODUCTION SCALABILITY (Tekion/Tachyon CRM)
# ============================================================================

1. REAL-TIME INFERENCE
   - Pre-compute cluster assignments for all sales executives (daily batch)
   - Customer matching is near-instant (no model retraining needed)
   - Can handle 1000+ matches/second

2. DYNAMIC UPDATES
   - Retrain clusters weekly/monthly as sales team evolves
   - Add new executives seamlessly
   - Track performance drift

3. A/B TESTING FRAMEWORK
   - Test different cluster sizes (3 vs 5 vs 7)
   - Experiment with scoring weights
   - Measure conversion lift

4. INTEGRATION POINTS
   - API endpoint: POST /match_customer
   - Webhook for lead assignment
   - CRM dashboard for cluster visualization

5. MONITORING & FEEDBACK LOOP
   - Track actual conversions from matched pairs
   - Identify underperforming clusters
   - Refine features based on what drives sales

6. ENTERPRISE FEATURES
   - Multi-location support (cluster per branch)
   - Language/timezone matching
   - Load balancing based on current workload
   - VIP customer routing rules
"""
