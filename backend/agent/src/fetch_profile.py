# Fichier: src/fetch_profile.py

import requests
import os
import json
from .fetch_data import APILimitError # On réutilise notre exception personnalisée
from .translate_profile import translate_profile_to_french

FMP_API_KEY = os.getenv("FMP_API_KEY")

def fetch_company_profile(ticker: str) -> str:
    """
    Récupère les informations de profil d'une entreprise depuis l'API FMP.
    Retourne une chaîne de caractères JSON contenant les informations clés.
    """
    if not FMP_API_KEY:
        raise ValueError("La clé API FMP_API_KEY n'est pas configurée.")

    BASE_URL = "https://financialmodelingprep.com/stable/profile/?symbol="
    url = f"{BASE_URL}{ticker}&apikey={FMP_API_KEY}"

    try:
        response = requests.get(url, timeout=15)  # 15s timeout pour éviter les blocages
        response.raise_for_status() # Lève une exception pour les erreurs HTTP

        data = response.json()
        if not data:
            raise ValueError(f"Aucun profil trouvé pour le ticker '{ticker}'.")

        # On sélectionne seulement les informations les plus pertinentes
        # pour éviter de surcharger le LLM.
        profile_data = data[0] # L'API retourne une liste avec un seul élément
        
        key_info = {
            "companyName": profile_data.get("companyName"),
            "sector": profile_data.get("sector"),
            "industry": profile_data.get("industry"),
            "ceo": profile_data.get("ceo"),
            "website": profile_data.get("website"),
            "description": profile_data.get("description"),
            "fullTimeEmployees": profile_data.get("fullTimeEmployees"),
            "exchange": profile_data.get("exchangeShortName"),
            "country": profile_data.get("country"),
            "image": profile_data.get("image")
        }
        
        # Debug: afficher les données originales
        print(f"[DEBUG] Original profile data for {ticker}:")
        print(f"  - Country: {key_info.get('country')}")
        print(f"  - Sector: {key_info.get('sector')}")
        print(f"  - Industry: {key_info.get('industry')}")
        print(f"  - Exchange: {key_info.get('exchange')}")
        
        # Traduire les données en français
        translated_info = translate_profile_to_french(key_info)
        
        # Debug: afficher les données traduites
        print(f"[DEBUG] Translated profile data for {ticker}:")
        print(f"  - Country: {translated_info.get('country')}")
        print(f"  - Sector: {translated_info.get('sector')}")
        print(f"  - Industry: {translated_info.get('industry')}")
        print(f"  - Exchange: {translated_info.get('exchange')}")
        
        # Ajouter le ticker aux données traduites
        translated_info["ticker"] = ticker
        
        return json.dumps(translated_info)

    except requests.exceptions.RequestException as e:
        raise APILimitError(f"Erreur de réseau en contactant FMP pour le profil de {ticker}: {e}")
    except (ValueError, IndexError) as e:
        # Gère le cas où le ticker est invalide ou la réponse est vide
        raise ValueError(f"Impossible de traiter la réponse du profil pour {ticker}: {e}")