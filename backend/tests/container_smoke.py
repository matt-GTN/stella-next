"""Offline checks for the CPU image: imports, tensor ops, embeddings, Chroma and HTTP health."""
import importlib.metadata
import os
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
os.environ['OPENROUTER_API_KEY']='ci-placeholder-not-a-real-key'
os.environ['LANGCHAIN_TRACING_V2']='false'
os.environ['LANGSMITH_TRACING']='false'
os.environ['ANONYMIZED_TELEMETRY']='False'

import numpy as np
import torch
from sentence_transformers import SentenceTransformer, models
from langchain_huggingface import HuggingFaceEmbeddings
import shap
from sklearn.ensemble import RandomForestClassifier
import chromadb
from chromadb.config import Settings

assert torch.__version__ == '2.9.1+cpu'
assert torch.version.cuda is None
names={d.metadata['Name'].lower() for d in importlib.metadata.distributions()}
assert not any(n.startswith('nvidia-') or n=='triton' for n in names)
assert torch.equal(torch.tensor([[1.,2.]]) @ torch.tensor([[3.],[4.]]),torch.tensor([[11.]]))
# Exercise SentenceTransformer's encode path offline, without model downloads or API calls.
model=SentenceTransformer(modules=[models.BoW(vocab=['hello','world'])],device='cpu')
vectors=model.encode(['hello world','hello'])
assert vectors.shape==(2,2) and np.isfinite(vectors).all()
classifier=RandomForestClassifier(n_estimators=2,random_state=1).fit([[0,0],[1,1]],[0,1])
assert len(classifier.predict([[0,0]]))==1
client=chromadb.EphemeralClient(Settings(anonymized_telemetry=False))
collection=client.create_collection('cpu-smoke')
collection.add(ids=['a','b'],embeddings=vectors.tolist(),documents=['hello world','hello'])
assert collection.count()==2
assert collection.query(query_embeddings=[vectors[0].tolist()],n_results=1)['ids'][0]==['a']
from fastapi.testclient import TestClient
from api.api import app
with TestClient(app) as http:
    response=http.get('/health')
    assert response.status_code==200
print('CPU image smoke checks passed: no CUDA packages, ML imports/ops, Chroma and API health')
