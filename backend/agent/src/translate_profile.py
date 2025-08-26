# Fichier: src/translate_profile.py

import json
import os
from typing import Dict, Any
from langchain_openai import ChatOpenAI

def translate_text_to_french(text: str) -> str:
    """
    Traduit un texte en français en utilisant OpenAI.
    
    Args:
        text: Texte à traduire en anglais
        
    Returns:
        Texte traduit en français
    """
    if not text or len(text.strip()) == 0:
        return text
    
    try:
        # Utiliser la même configuration OpenAI que le reste du projet
        OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
        if not OPENROUTER_API_KEY:
            print("[WARNING] No OpenRouter API key found, skipping description translation")
            return text
        
        llm = ChatOpenAI(
            model="google/gemini-2.5-flash-lite",
            api_key=OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1",
            temperature=0,
            max_tokens=1000
        )
        
        prompt = f"""Traduis ce texte de description d'entreprise en français de manière naturelle et professionnelle. 

RÈGLES IMPORTANTES:
- Garde le même ton et le même niveau de détail
- CONSERVE TOUS les noms de produits, marques, et entreprises EXACTEMENT comme dans l'original (iPhone, iPad, Apple Watch, AirPods, etc.)
- CONSERVE TOUS les noms de lieux EXACTEMENT comme dans l'original (Cupertino, California, etc.)
- Ne traduis QUE le contenu descriptif, pas les noms propres
- Ne remplace JAMAIS les noms de produits par des placeholders comme [Nom du produit]

Texte à traduire:
{text}

Traduction française (en conservant tous les noms propres):"""
        
        response = llm.invoke(prompt)
        translated_text = response.content.strip()
        
        print(f"[DEBUG] Description translation successful: {len(text)} -> {len(translated_text)} chars")
        return translated_text
        
    except Exception as e:
        print(f"[WARNING] Failed to translate description: {e}")
        return text  # Retourner le texte original en cas d'erreur

def translate_profile_to_french(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Traduit les données de profil d'entreprise en français.
    
    Args:
        profile_data: Dictionnaire contenant les données de profil en anglais
        
    Returns:
        Dictionnaire avec les données traduites en français
    """
    
    # Dictionnaire de traduction pour les secteurs
    sector_translations = {
        # Technology
        "Technology": "Technologie",
        "Software": "Logiciels",
        "Hardware": "Matériel informatique",
        "Semiconductors": "Semi-conducteurs",
        "Internet": "Internet",
        "Telecommunications": "Télécommunications",
        "Computer Hardware": "Matériel informatique",
        "Software - Application": "Logiciels - Applications",
        "Software - Infrastructure": "Logiciels - Infrastructure",
        "Semiconductors & Semiconductor Equipment": "Semi-conducteurs et équipements",
        "Communication Equipment": "Équipements de communication",
        "Electronic Components": "Composants électroniques",
        "Information Technology Services": "Services informatiques",
        
        # Healthcare
        "Healthcare": "Santé",
        "Biotechnology": "Biotechnologie",
        "Pharmaceuticals": "Pharmaceutique",
        "Medical Devices": "Dispositifs médicaux",
        "Health Care": "Soins de santé",
        "Drug Manufacturers - Major": "Fabricants pharmaceutiques - Majeurs",
        "Drug Manufacturers - Specialty & Generic": "Fabricants pharmaceutiques - Spécialisés et génériques",
        "Medical Instruments & Supplies": "Instruments et fournitures médicales",
        "Diagnostics & Research": "Diagnostics et recherche",
        "Health Information Services": "Services d'information santé",
        
        # Financial Services
        "Financial Services": "Services financiers",
        "Banking": "Banque",
        "Insurance": "Assurance",
        "Investment Banking": "Banque d'investissement",
        "Asset Management": "Gestion d'actifs",
        "Credit Services": "Services de crédit",
        "Banks - Diversified": "Banques - Diversifiées",
        "Banks - Regional": "Banques - Régionales",
        "Insurance - Life": "Assurance-vie",
        "Insurance - Property & Casualty": "Assurance dommages",
        "Capital Markets": "Marchés de capitaux",
        
        # Consumer
        "Consumer Cyclical": "Consommation cyclique",
        "Consumer Defensive": "Consommation défensive",
        "Retail": "Commerce de détail",
        "Restaurants": "Restaurants",
        "Apparel": "Habillement",
        "Automotive": "Automobile",
        "Consumer Electronics": "Électronique grand public",
        "Specialty Retail": "Commerce spécialisé",
        "Internet Retail": "Commerce en ligne",
        "Auto Manufacturers": "Constructeurs automobiles",
        "Auto Parts": "Pièces automobiles",
        "Leisure": "Loisirs",
        "Hotels & Motels": "Hôtels et motels",
        
        # Energy
        "Energy": "Énergie",
        "Oil & Gas": "Pétrole et gaz",
        "Renewable Energy": "Énergies renouvelables",
        "Oil & Gas E&P": "Pétrole et gaz - Exploration et production",
        "Oil & Gas Integrated": "Pétrole et gaz - Intégré",
        "Oil & Gas Refining & Marketing": "Pétrole et gaz - Raffinage et commercialisation",
        "Oil & Gas Equipment & Services": "Équipements et services pétroliers",
        "Solar": "Solaire",
        "Utilities": "Services publics",
        
        # Industrial
        "Industrials": "Industrie",
        "Manufacturing": "Fabrication",
        "Aerospace & Defense": "Aérospatiale et défense",
        "Construction": "Construction",
        "Transportation": "Transport",
        "Industrial Conglomerates": "Conglomérats industriels",
        "Machinery": "Machines",
        "Electrical Equipment": "Équipements électriques",
        "Airlines": "Compagnies aériennes",
        "Railroads": "Chemins de fer",
        "Trucking": "Transport routier",
        "Marine Shipping": "Transport maritime",
        
        # Materials
        "Materials": "Matériaux",
        "Chemicals": "Chimie",
        "Metals & Mining": "Métaux et mines",
        "Paper & Forest Products": "Papier et produits forestiers",
        "Steel": "Acier",
        "Gold": "Or",
        "Copper": "Cuivre",
        "Agricultural Inputs": "Intrants agricoles",
        
        # Real Estate
        "Real Estate": "Immobilier",
        "REITs": "REIT (Fonds immobiliers)",
        "Real Estate Development": "Développement immobilier",
        "Real Estate Services": "Services immobiliers",
        
        # Communication Services
        "Communication Services": "Services de communication",
        "Media": "Médias",
        "Entertainment": "Divertissement",
        "Broadcasting": "Radiodiffusion",
        "Publishing": "Édition",
        "Advertising Agencies": "Agences de publicité",
        
        # Utilities
        "Utilities": "Services publics",
        "Electric Utilities": "Services électriques",
        "Gas Utilities": "Services gaziers",
        "Water Utilities": "Services d'eau",
        "Renewable Utilities": "Services d'énergies renouvelables"
    }
    
    # Dictionnaire de traduction pour les pays
    country_translations = {
        # Formats complets
        "United States": "États-Unis",
        "United States of America": "États-Unis",
        "Canada": "Canada",
        "United Kingdom": "Royaume-Uni",
        "Germany": "Allemagne",
        "France": "France",
        "Italy": "Italie",
        "Spain": "Espagne",
        "Netherlands": "Pays-Bas",
        "Switzerland": "Suisse",
        "Sweden": "Suède",
        "Norway": "Norvège",
        "Denmark": "Danemark",
        "Finland": "Finlande",
        "Belgium": "Belgique",
        "Austria": "Autriche",
        "Ireland": "Irlande",
        "Portugal": "Portugal",
        "Luxembourg": "Luxembourg",
        "Japan": "Japon",
        "China": "Chine",
        "South Korea": "Corée du Sud",
        "Taiwan": "Taïwan",
        "Hong Kong": "Hong Kong",
        "Singapore": "Singapour",
        "Australia": "Australie",
        "New Zealand": "Nouvelle-Zélande",
        "India": "Inde",
        "Brazil": "Brésil",
        "Mexico": "Mexique",
        "Argentina": "Argentine",
        "Chile": "Chili",
        "Colombia": "Colombie",
        "Peru": "Pérou",
        "South Africa": "Afrique du Sud",
        "Israel": "Israël",
        "Russia": "Russie",
        "Turkey": "Turquie",
        "Saudi Arabia": "Arabie Saoudite",
        "United Arab Emirates": "Émirats arabes unis",
        "Thailand": "Thaïlande",
        "Malaysia": "Malaisie",
        "Indonesia": "Indonésie",
        "Philippines": "Philippines",
        "Vietnam": "Vietnam",
        
        # Codes pays courts (souvent utilisés par les APIs)
        "US": "États-Unis",
        "USA": "États-Unis",
        "CA": "Canada",
        "UK": "Royaume-Uni",
        "GB": "Royaume-Uni",
        "DE": "Allemagne",
        "FR": "France",
        "IT": "Italie",
        "ES": "Espagne",
        "NL": "Pays-Bas",
        "CH": "Suisse",
        "SE": "Suède",
        "NO": "Norvège",
        "DK": "Danemark",
        "FI": "Finlande",
        "BE": "Belgique",
        "AT": "Autriche",
        "IE": "Irlande",
        "PT": "Portugal",
        "LU": "Luxembourg",
        "JP": "Japon",
        "CN": "Chine",
        "KR": "Corée du Sud",
        "TW": "Taïwan",
        "HK": "Hong Kong",
        "SG": "Singapour",
        "AU": "Australie",
        "NZ": "Nouvelle-Zélande",
        "IN": "Inde",
        "BR": "Brésil",
        "MX": "Mexique",
        "AR": "Argentine",
        "CL": "Chili",
        "CO": "Colombie",
        "PE": "Pérou",
        "ZA": "Afrique du Sud",
        "IL": "Israël",
        "RU": "Russie",
        "TR": "Turquie",
        "SA": "Arabie Saoudite",
        "AE": "Émirats arabes unis",
        "TH": "Thaïlande",
        "MY": "Malaisie",
        "ID": "Indonésie",
        "PH": "Philippines",
        "VN": "Vietnam"
    }
    
    # Dictionnaire de traduction pour les bourses
    exchange_translations = {
        "NASDAQ": "NASDAQ",
        "NYSE": "NYSE",
        "AMEX": "AMEX",
        "LSE": "Bourse de Londres",
        "TSX": "Bourse de Toronto",
        "XETRA": "Bourse de Francfort",
        "EPA": "Euronext Paris",
        "AMS": "Euronext Amsterdam",
        "BRU": "Euronext Bruxelles",
        "MIL": "Bourse de Milan",
        "SWX": "Bourse suisse",
        "OSL": "Bourse d'Oslo",
        "CPH": "Bourse de Copenhague",
        "HEL": "Bourse d'Helsinki",
        "STO": "Bourse de Stockholm",
        "TYO": "Bourse de Tokyo",
        "HKG": "Bourse de Hong Kong",
        "SHA": "Bourse de Shanghai",
        "SHE": "Bourse de Shenzhen",
        "KRX": "Bourse de Corée",
        "TWO": "Bourse de Taïwan",
        "ASX": "Bourse australienne",
        "BSE": "Bourse de Bombay",
        "NSE": "Bourse nationale indienne",
        "BOVESPA": "Bourse de São Paulo",
        "BMV": "Bourse mexicaine",
        "JSE": "Bourse de Johannesburg"
    }
    
    # Créer une copie des données pour éviter de modifier l'original
    translated_data = profile_data.copy()
    
    # Traduire la description (le plus important!)
    if "description" in translated_data and translated_data["description"]:
        print(f"[DEBUG] Translating description: {translated_data['description'][:100]}...")
        translated_data["description"] = translate_text_to_french(translated_data["description"])
    
    # Traduire le secteur
    if "sector" in translated_data and translated_data["sector"]:
        sector = translated_data["sector"]
        translated_data["sector"] = sector_translations.get(sector, sector)
    
    # Traduire l'industrie
    if "industry" in translated_data and translated_data["industry"]:
        industry = translated_data["industry"]
        translated_data["industry"] = sector_translations.get(industry, industry)
    
    # Traduire le pays
    if "country" in translated_data and translated_data["country"]:
        country = translated_data["country"]
        translated_data["country"] = country_translations.get(country, country)
    
    # Traduire la bourse
    if "exchange" in translated_data and translated_data["exchange"]:
        exchange = translated_data["exchange"]
        translated_data["exchange"] = exchange_translations.get(exchange, exchange)
    
    # Ajouter des champs traduits pour l'affichage frontend
    translated_data["name"] = translated_data.get("companyName", "")
    translated_data["ticker"] = ""  # Sera rempli par la fonction appelante
    translated_data["logo"] = translated_data.get("image", "")
    translated_data["currency"] = "USD"  # Par défaut, peut être modifié selon la bourse
    
    # Déterminer la devise selon la bourse/pays
    currency_mapping = {
        "EPA": "EUR",  # Euronext Paris
        "AMS": "EUR",  # Euronext Amsterdam
        "BRU": "EUR",  # Euronext Bruxelles
        "XETRA": "EUR",  # Bourse de Francfort
        "MIL": "EUR",  # Bourse de Milan
        "LSE": "GBP",  # Bourse de Londres
        "TSX": "CAD",  # Bourse de Toronto
        "SWX": "CHF",  # Bourse suisse
        "TYO": "JPY",  # Bourse de Tokyo
        "HKG": "HKD",  # Bourse de Hong Kong
        "KRX": "KRW",  # Bourse de Corée
        "ASX": "AUD",  # Bourse australienne
    }
    
    if "exchange" in translated_data and translated_data["exchange"]:
        original_exchange = None
        # Trouver la bourse originale
        for orig, trans in exchange_translations.items():
            if trans == translated_data["exchange"]:
                original_exchange = orig
                break
        
        if original_exchange and original_exchange in currency_mapping:
            translated_data["currency"] = currency_mapping[original_exchange]
    
    return translated_data