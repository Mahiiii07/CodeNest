import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import os

def generate_dummy_training_data(n_samples=1000):
    """Generate dummy training data for demonstration"""
    np.random.seed(42)
    
    # Generate features
    tfidf_similarity = np.random.random(n_samples)
    hash_similarity = np.random.random(n_samples) * 0.3  # Usually lower
    import_similarity = np.random.random(n_samples)
    structure_difference = np.random.exponential(2, n_samples)
    keyword_similarity = np.random.random(n_samples)
    
    # Create labels based on realistic rules
    labels = []
    for i in range(n_samples):
        # High plagiarism if multiple indicators are high
        plagiarism_score = (
            tfidf_similarity[i] * 0.4 +
            hash_similarity[i] * 0.3 +
            import_similarity[i] * 0.2 +
            keyword_similarity[i] * 0.1
        )
        
        # Adjust for structure differences (high difference = less likely plagiarism)
        if structure_difference[i] > 5:
            plagiarism_score *= 0.7
        
        # Add some noise
        plagiarism_score += np.random.normal(0, 0.1)
        
        # Threshold for plagiarism
        labels.append(1 if plagiarism_score > 0.6 else 0)
    
    # Create DataFrame
    data = pd.DataFrame({
        'tfidf_similarity': tfidf_similarity,
        'hash_similarity': hash_similarity,
        'import_similarity': import_similarity,
        'structure_difference': structure_difference,
        'keyword_similarity': keyword_similarity,
        'is_plagiarized': labels
    })
    
    return data

# Update your train_plagiarism_model function in ml_models.py
def train_plagiarism_model(save_path='ml_models/plagiarism_model.pkl'):
    """Train and save the plagiarism detection model"""
    print("Generating training data...")
    data = generate_dummy_training_data()
    
    # Prepare features and labels with proper column names
    feature_columns = ['tfidf_similarity', 'hash_similarity', 'import_similarity', 
                      'structure_difference', 'keyword_similarity']
    X = data[feature_columns]
    y = data['is_plagiarized']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    joblib.dump(model, save_path)
    print(f"Model saved to {save_path}")
    
    return model

def load_plagiarism_model(model_path='ml_models/plagiarism_model.pkl'):
    """Load the trained plagiarism detection model"""
    if not os.path.exists(model_path):
        print("Model not found. Training new model...")
        return train_plagiarism_model(model_path)
    
    return joblib.load(model_path)

def predict_plagiarism(similarity_features, model_path='ml_models/plagiarism_model.pkl'):
    """Predict plagiarism based on similarity features"""
    model = load_plagiarism_model(model_path)
    
    # Create feature array with explicit column names to avoid warnings
    import pandas as pd
    
    feature_names = ['tfidf_similarity', 'hash_similarity', 'import_similarity',
                    'structure_difference', 'keyword_similarity']
    
    # Create DataFrame instead of numpy array
    features_df = pd.DataFrame([[
        float(similarity_features.get('tfidf_similarity', 0)),
        float(similarity_features.get('hash_similarity', 0)),
        float(similarity_features.get('import_similarity', 0)),
        float(similarity_features.get('structure_difference', 0)),
        float(similarity_features.get('keyword_similarity', 0))
    ]], columns=feature_names)

    # Make predictions
    prediction = model.predict(features_df)
    probability = model.predict_proba(features_df)

    # Extract confidence for the positive class (plagiarized)
    confidence = float(probability[0][1]) if len(probability) > 1 else 0.5

    return {
        'is_plagiarized': bool(prediction),
        'confidence': confidence
    }




if __name__ == "__main__":
    # Train model when script is run directly
    train_plagiarism_model()
