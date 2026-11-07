FROM python:3.10-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    graphviz \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements en premier pour un meilleur cache
COPY requirements.txt constraints-cpu.txt ./

# Installer les dépendances Python
# This VPS has no GPU. Install the official CPU wheel before the other packages;
# a constraint prevents sentence-transformers from pulling CUDA PyTorch later.
RUN pip install --no-cache-dir --upgrade pip==25.3 \
    && pip install --no-cache-dir torch==2.9.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -c constraints-cpu.txt -r requirements.txt \
    && pip check

# Copier le code de l'application
COPY . .

# Créer les répertoires nécessaires
RUN mkdir -p /app/chroma_research_db

# Offline smoke tests run during every build, before any image is published.
RUN python tests/container_smoke.py

# Exposer le port 8000 pour FastAPI (pas 8501 pour Streamlit)
EXPOSE 8000

# Exécuter le serveur FastAPI au lieu de Streamlit
CMD ["uvicorn", "api.api:app", "--host", "0.0.0.0", "--port", "8000"]