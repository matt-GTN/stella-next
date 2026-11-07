# src/fetch_data.py

import os
from urllib.parse import urlsplit
import requests
import pandas as pd


FMP_API_KEY = os.getenv("FMP_API_KEY")


# ------------------------------- #
#   Exceptions personnalisées     #
# ------------------------------- #

class APILimitError(Exception):
    """Exception levée lorsque la clé API est invalide ou la limite d'appels est atteinte."""
    pass


# ------------------------------- #
#   Fonctions génériques API      #
# ------------------------------- #

def _call_fmp_api(url: str) -> pd.DataFrame:
    """
    Appelle un endpoint FMP et renvoie un DataFrame.
    Gère automatiquement :
        - les erreurs 401 / 429
        - les réponses vides
    """

    safe_url = urlsplit(url)._replace(query="", fragment="").geturl()
    print(f"[FMP] GET {safe_url}")
    try:
        response = requests.get(url, timeout=15)
    except requests.RequestException:
        raise ValueError("Le service de données financières est indisponible.") from None

    if response.status_code == 200:
        try:
            data = response.json()
        except Exception:
            raise ValueError(f"Réponse non JSON depuis {safe_url}") from None

        if not data:
            raise ValueError(f"Réponse vide reçue depuis {safe_url}")
        return pd.DataFrame(data)

    # Cas limites API / clé invalide
    if response.status_code in [401, 429]:
        raise APILimitError("Clé API invalide ou quota atteint.")

    # Autres erreurs HTTP
    raise ValueError(
        f"Erreur API pour {safe_url} — Status {response.status_code}"
    )


# ------------------------------- #
#      Endpoints individuels      #
# ------------------------------- #

def fetch_key_metrics(ticker: str) -> pd.DataFrame:
    """Récupère les données /key-metrics (stable)."""
    if not FMP_API_KEY:
        raise ValueError("FMP_API_KEY n'est pas configurée.")

    url = (
        f"https://financialmodelingprep.com/stable/key-metrics"
        f"?symbol={ticker}&period=annual&apikey={FMP_API_KEY}"
    )
    return _call_fmp_api(url)


def fetch_ratios(ticker: str) -> pd.DataFrame:
    """Récupère les ratios financiers (netProfitMargin, returnOnEquity, etc.)."""
    if not FMP_API_KEY:
        raise ValueError("FMP_API_KEY n'est pas configurée.")

    url = (
        f"https://financialmodelingprep.com/stable/ratios"
        f"?symbol={ticker}&apikey={FMP_API_KEY}"
    )
    return _call_fmp_api(url)


# ------------------------------- #
#   Fetch combiné pour un ticker  #
# ------------------------------- #

def fetch_fundamental_data(ticker: str) -> pd.DataFrame:
    """
    Récupère, fusionne et normalise les données fondamentales d'un ticker.

    Contient automatiquement :
        - key metrics
        - ratios (ex: netProfitMargin, returnOnEquity)
    """

    print(f"\n=== FETCH FUNDAMENTAL DATA — {ticker} ===")

    key_metrics_df = fetch_key_metrics(ticker)
    ratios_df = fetch_ratios(ticker)

    # Fusion basée sur la date (clé fiable, présente dans les 2 endpoints)
    merged = pd.merge(
        key_metrics_df,
        ratios_df,
        on=["date", "fiscalYear", "period", "symbol"],
        how="left"
    )

    print(f"[OK] Données fondamentales fusionnées pour {ticker} — {merged.shape[0]} lignes")
    return merged


# ------------------------------- #
#     Exécution directe (debug)   #
# ------------------------------- #

if __name__ == "__main__":
    try:
        df = fetch_fundamental_data("AAPL")
        print(df.head())
    except APILimitError as e:
        print(f"[API LIMIT] {e}")
    except Exception as e:
        print(f"[ERROR] {e}")

