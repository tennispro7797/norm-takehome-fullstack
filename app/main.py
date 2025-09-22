from fastapi import FastAPI, Query, HTTPException
from app.utils import Output, DocumentService, QdrantService
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for services
doc_service = None
index = None
startup_error = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan with proper error handling."""
    global doc_service, index, startup_error
    
    try:
        logger.info("Starting up services...")
        
        # Initialize document service
        logger.info("Initializing document service...")
        doc_service = DocumentService()
        docs = doc_service.create_documents("docs/laws.pdf")
        
        if not docs:
            raise RuntimeError("Failed to create documents from PDF")
        
        logger.info(f"Successfully created {len(docs)} documents")
        
        # Initialize Qdrant service
        logger.info("Initializing Qdrant service...")
        index = QdrantService()
        index.connect()
        index.load(docs)
        
        logger.info("All services initialized successfully")
        
    except Exception as e:
        startup_error = str(e)
        logger.error(f"Failed to initialize services: {e}")
        # Don't raise the exception - let the app start but mark it as unhealthy
    
    yield
    
    # Cleanup (if needed)
    logger.info("Shutting down services...")

app = FastAPI(
    title="Legal Document Query API",
    description="Query legal documents using AI and get structured responses with citations",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/", tags=["Info"])
def root():
    """Root endpoint with API information and available endpoints."""
    return {
        "message": "Legal Document Query API", 
        "endpoints": ["/query?q=your_question", "/health", "/docs"],
        "swagger_ui": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify service status."""
    if startup_error:
        return {
            "status": "unhealthy",
            "error": startup_error,
            "message": "Services failed to initialize during startup"
        }
    
    if index is None:
        return {
            "status": "unhealthy", 
            "error": "Services not initialized",
            "message": "Services are still initializing or failed to initialize"
        }
    
    return {
        "status": "healthy",
        "message": "All services are running normally"
    }

@app.get("/query", response_model=Output, tags=["Legal Queries"])
def query_laws(q: str = Query(..., description="Your legal question", example="what happens if I steal from the Sept?")):
    """
    Query legal documents using AI and get structured responses with citations.
    
    This endpoint analyzes your legal question against a database of laws and returns:
    - AI-generated response answering your question
    - Relevant law citations that support the answer
    - Source references for verification
    
    **Example queries:**
    - "what happens if I steal?"
    - "what are the rules about taxes?"
    - "what is the punishment for treason?"
    """
    if startup_error:
        raise HTTPException(
            status_code=503, 
            detail=f"Service unavailable: {startup_error}"
        )
    
    if index is None:
        raise HTTPException(
            status_code=503, 
            detail="Service not ready: Services are still initializing"
        )
    
    try:
        return index.query(q)
    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Query processing failed: {str(e)}"
        )