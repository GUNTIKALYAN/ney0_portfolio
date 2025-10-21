import os
import requests
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer, CrossEncoder
import chromadb
from groq import Groq
from langchain_text_splitters import RecursiveCharacterTextSplitter

# -------------------------------
# CONFIGURATION
# -------------------------------
GITHUB_USERNAME = "GUNTIKALYAN"
RESUME_PATH = "Kalyan_Resume.pdf"
CHROMA_DB_PATH = "chroma_db"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.1-8b-instant"

# -------------------------------
# Initialize ChromaDB
# -------------------------------
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
collection_name = "rag_collection"
collection = client.get_or_create_collection(name=collection_name)

# -------------------------------
# Load Models
# -------------------------------
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# -------------------------------
# Helper Functions
# -------------------------------

def clean_text(text):
    """Clean resume text by replacing garbled characters and normalizing"""
    text = text.replace("�", "")
    text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    return text

def chunk_text(text, chunk_size=1500, chunk_overlap=200):
    """Chunk text using RecursiveCharacterTextSplitter"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " "],
        keep_separator=True
    )
    chunks = splitter.split_text(text)
    # Remove only empty chunks
    return [chunk for chunk in chunks if chunk.strip()]

def extract_text_from_pdf(pdf_path):
    """Extract and clean text from PDF"""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"
        return clean_text(text)
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def fetch_github_data(username):
    """Fetch GitHub bio and create chunks per repo"""
    try:
        user_url = f"https://api.github.com/users/{username}"
        user_resp = requests.get(user_url)
        if user_resp.status_code != 200:
            return []
        
        user_data = user_resp.json()
        bio = user_data.get("bio", "").strip()
        
        repos_url = user_data.get("repos_url", "")
        repos_resp = requests.get(repos_url)
        if repos_resp.status_code != 200:
            return [bio] if bio else []
        
        repos = repos_resp.json()
        chunks = [bio] if bio else []
        
        for repo in repos:
            name = repo.get("name", "")
            desc = repo.get("description", "") or ""
            language = repo.get("language", "") or "Unknown"
            topics = ", ".join(repo.get("topics", []))
            chunk = f"Repository: {name}\nDescription: {desc}\nLanguage: {language}\nTopics: {topics}\nStars: {repo.get('stargazers_count', 0)}\nForks: {repo.get('forks_count', 0)}"
            chunks.append(chunk.strip())
        
        return [chunk for chunk in chunks if chunk]
    except Exception as e:
        print(f"Error fetching GitHub: {e}")
        return []

def create_embeddings(texts):
    """Generate embeddings for texts"""
    return embed_model.encode(texts).tolist()

def index_documents(chunks, metadatas, source):
    """Index chunks with unique IDs"""
    if not chunks:
        return
    
    embeddings = create_embeddings(chunks)
    ids = [f"{source}_{i}" for i in range(len(chunks))]
    
    collection.upsert(
        ids=ids,
        documents=chunks,
        metadatas=metadatas,
        embeddings=embeddings
    )

def initialize_rag(force_reindex=False):
    """Initialize or reindex RAG database"""
    if force_reindex:
        client.delete_collection(name=collection_name)
        global collection
        collection = client.create_collection(name=collection_name)
    
    existing_ids = collection.get()["ids"]
    if existing_ids and not force_reindex:
        print("Database already initialized. Use force_reindex=True to reindex.")
        return
    
    # Resume chunks
    resume_text = extract_text_from_pdf(RESUME_PATH)
    if resume_text:
        resume_chunks = chunk_text(resume_text)
        resume_metadatas = [{"source": "resume", "section": f"section_{i}"} for i in range(len(resume_chunks))]
        index_documents(resume_chunks, resume_metadatas, "resume")
        print(f"Indexed {len(resume_chunks)} resume chunks with content: {resume_chunks}")
    
    # GitHub chunks
    github_chunks_raw = fetch_github_data(GITHUB_USERNAME)
    if github_chunks_raw:
        github_text = "\n\n".join(github_chunks_raw)
        github_chunks = chunk_text(github_text)
        github_metadatas = [{"source": "github", "repo": f"repo_{i}"} for i in range(len(github_chunks))]
        index_documents(github_chunks, github_metadatas, "github")
        print(f"Indexed {len(github_chunks)} GitHub chunks with content: {github_chunks}")
    
    print("RAG initialization complete!")

def retrieve_and_rerank(query, initial_top_k=15, final_top_k=10):  # Increased to 10
    """Retrieve top docs and re-rank with cross-encoder"""
    if collection.count() == 0:
        return "No data indexed. Please initialize RAG first."
    
    query_emb = embed_model.encode([query])[0].tolist()
    results = collection.query(
        query_embeddings=[query_emb],
        n_results=initial_top_k,
        include=["documents", "metadatas"]
    )
    
    if not results["documents"] or not results["documents"][0]:
        return "No relevant context found."
    
    retrieved_docs = results["documents"][0]
    pairs = [[query, doc] for doc in retrieved_docs]
    scores = cross_encoder.predict(pairs)
    
    sorted_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    top_docs = [retrieved_docs[i] for i in sorted_indices[:final_top_k]]
    
    return "\n\n".join(top_docs)

def build_prompt(query, context):
    name = "Gunti Kalyan"
    query_lower = query.lower()

    if "project" in query_lower:
        instructions = """
Instructions:
- Only list unique projects in the format: 
  Project 1 Name - Brief description
- Each project on a new line
- Do not include skills, certificates, or other info
"""
    elif "skill" in query_lower:
        instructions = """
Instructions:
- Only list skills in bullet points under relevant categories
- Do not include projects or certificates
"""
    elif "certificate" in query_lower:
        instructions = """
Instructions:
- Only list certificates numbered per line
- Do not include projects or skills
"""
    elif "contact" in query_lower or "email" in query_lower or "phone" in query_lower:
        instructions = """
Instructions:
- Only provide contact information
- Do not include projects, skills, or certificates
"""
    else:
        instructions = f"""
Instructions:
- Answer based on context
- If information not present, suggest contacting {name}
"""

    return f"""
You are a polite and professional AI assistant for {name}'s portfolio website.
Use the provided context from resume and GitHub to answer accurately.

Context:
{context}

User Query: {query}

{instructions}

Response:
"""


def call_llm(prompt, max_tokens=500):
    """Call Groq API for generation"""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set in environment variables.")
    
    client = Groq(api_key=GROQ_API_KEY)
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=max_tokens,
            top_p=0.9,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API error: {e}")
        return "Sorry, I'm unable to respond right now. Please try again later."