# Legal Document Query API

A FastAPI service that uses AI to query legal documents and provide structured responses with citations.

## Quick Start

### Prerequisites

- Python 3.8+
- OpenAI API key

### Run Backend

**Option 1: Using Docker (recommended)**

```bash
# Build the image
docker build -t legal-query-api .

# Run the container
docker run -p 8000:80 -e OPENAI_API_KEY=your_openai_api_key legal-query-api
```

**Option 2: Run manually**

```bash
# Install dependencies
pip install -r requirements.txt

# Set your OpenAI API key
export OPENAI_API_KEY=sk-proj-your_actual_key_here

# Run the server
cd app
python main.py
```

**Access the application:**

- **API Docs:** `http://localhost:8000/docs` (Backend API documentation)
- **Health Check:** `http://localhost:8000/health` (Service status)
- **Direct API:** `http://localhost:8000/query?q=your_question`

## Example Usage

```bash
curl "http://localhost:8000/query?q=what happens if I steal from the Sept?"
```

Returns structured JSON with AI response and legal citations.

## Frontend

See `frontend/README.md` for client application setup, along with the reflective response.
