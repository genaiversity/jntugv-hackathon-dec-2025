import faiss
import numpy as np
from langchain_huggingface import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def create_index(texts):
    vectors = embeddings.embed_documents(texts)
    dim = len(vectors[0])

    index = faiss.IndexFlatL2(dim)
    index.add(np.array(vectors).astype("float32"))

    return index


class VectorStore:
    """Vector store using FAISS for efficient retrieval."""
    
    def __init__(self):
        self.index = None
        self.texts = []
        self.metadata = []
        self.embeddings_cache = []
    
    def build_index(self, texts, metadata):
        """Build FAISS index from texts and metadata."""
        self.texts = texts
        self.metadata = metadata
        
        # Generate embeddings
        self.embeddings_cache = embeddings.embed_documents(texts)
        
        # Create FAISS index
        dim = len(self.embeddings_cache[0])
        self.index = faiss.IndexFlatL2(dim)
        self.index.add(np.array(self.embeddings_cache).astype("float32"))
    
    def retrieve(self, query, k=10):
        """Retrieve top k chunks similar to query."""
        if self.index is None:
            raise ValueError("Index not built. Call build_index() first.")
        
        # Embed the query
        query_embedding = embeddings.embed_documents([query])
        
        # Search
        distances, indices = self.index.search(
            np.array(query_embedding).astype("float32"), 
            k=min(k, len(self.texts))
        )
        
        # Build results with text and metadata
        results = []
        for idx in indices[0]:
            if 0 <= idx < len(self.texts):
                results.append({
                    "text": self.texts[idx],
                    "metadata": self.metadata[idx]
                })
        
        return results
