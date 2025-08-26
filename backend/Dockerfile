FROM python:3.10-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    graphviz \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements en premier pour un meilleur cache
COPY requirements.txt ./

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY . .

# Créer les répertoires nécessaires
RUN mkdir -p /app/chroma_research_db

# Exposer le port 8000 pour FastAPI (pas 8501 pour Streamlit)
EXPOSE 8000

# Exécuter le serveur FastAPI au lieu de Streamlit
CMD ["uvicorn", "api.api:app", "--host", "0.0.0.0", "--port", "8000"]