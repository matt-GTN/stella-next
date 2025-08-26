# src/predict.py

import pandas as pd
import joblib
import os
import numpy as np # Assurez-vous que numpy est importé
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Le chemin vers votre modèle
# Chemin relatif au répertoire backend, peu importe d'où on exécute
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'rf_fundamental_classifier.joblib')

def analyse_risks(processed_data: pd.DataFrame) -> str:
    """
    Analyse les données pour détecter un risque de sous-performance.
    Le modèle est spécialisé pour détecter les signaux négatifs (classe 0).
    Il renvoie un verdict basé sur une prédiction de classe 0 avec une confiance de plus de 70%.
    
    Retours:
        - "Risque Élevé Détecté": Si la prédiction est '0' avec une confiance > 0.7.
        - "Aucun Risque Extrême Détecté": Dans tous les autres cas.
    """
    logger.info("Loading prediction model...")
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Modèle non trouvé à l'emplacement : {MODEL_PATH}")
    model = joblib.load(MODEL_PATH)
    
    logger.info("Preparing data for prediction...")

    expected_cols = ['marketCap', 'marginProfit', 'roe', 'roic', 'revenuePerShare', 'debtToEquity', 'revenuePerShare_YoY_Growth', 'earningsYield', 'calendarYear']
    
    # S'assure que les colonnes sont dans le bon ordre et que les manquantes sont remplies (avec 0 par ex.)
    data_for_prediction = processed_data.reindex(columns=expected_cols, fill_value=0)
    data_for_prediction = data_for_prediction.drop(columns=['calendarYear'], errors='ignore')  # On ne prédit pas sur l'année
    
    if data_for_prediction.empty or data_for_prediction.isnull().values.any():
        raise ValueError("Les données fournies sont vides ou contiennent des valeurs nulles après le reformatage.")
    
    logger.info("Executing prediction...")
    # On prédit sur la dernière ligne disponible (la plus récente)
    latest_data_point = data_for_prediction.tail(1)

    # Obtenir la classe prédite (0 ou 1)
    prediction_class = model.predict(latest_data_point)[0]
    # Obtenir les probabilités [prob_classe_0, prob_classe_1]
    probabilities = model.predict_proba(latest_data_point)[0]
    
    # Notre règle métier spécifique
    confidence_in_class_0 = probabilities[0]
    
    logger.info(f"Predicted class: {prediction_class}, Probabilities: [Class 0: {probabilities[0]:.2f}, Class 1: {probabilities[1]:.2f}]")

    # Appliquer la logique de décision
    if prediction_class == 0 and confidence_in_class_0 > 0.7:
        result = "Risque Élevé Détecté"
        logger.info(f"VERDICT: {result} (Confidence in class 0 > 70%)")
    else:
        result = "Aucun Risque Extrême Détecté"
        logger.info(f"VERDICT: {result} (High risk condition not met)")
        
    return result

if __name__ == '__main__':
    # Exemple de test
    from src.fetch_data import fetch_fundamental_data
    from src.preprocess import preprocess_financial_data
    
    try:
        # Simulez des données qui pourraient déclencher le cas négatif
        # Créez un dummy model si vous n'en avez pas un qui produit ce résultat
        cost_raw = fetch_fundamental_data("COST") # Utilisez un ticker qui fonctionne
        cost_processed = preprocess_financial_data(cost_raw)
        cost_prediction = predict_outperformance(cost_processed)
        logger.info(f"Prediction for COST: {cost_prediction}")
    except Exception as e:
        logger.error(f"Error during prediction for COST: {e}")