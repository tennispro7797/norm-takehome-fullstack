from pydantic import BaseModel
from typing import List, Optional
import qdrant_client
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core.schema import Document
from llama_index.core import (
    VectorStoreIndex,
    Settings,
)
from llama_index.core.query_engine import CitationQueryEngine
from dataclasses import dataclass
import re
import os
from pdf2image import convert_from_path
import base64
from io import BytesIO
import openai

key = os.environ['OPENAI_API_KEY']

@dataclass
class Input:
    query: str
    file_path: str

@dataclass
class Citation:
    source: str
    text: str
    page_number: int
    parent_section: Optional[str] = None

class Output(BaseModel):
    query: str
    response: str
    citations: List[Citation]

# Structured output models for AI vision parsing
class LawSection(BaseModel):
    section: str  # e.g., "1.1", "2.3.1"
    section_title: str  # e.g., "Peace", "Theft"
    text: str  # The actual law text without section number
    parent_section: Optional[str] = None  # e.g., "1" if this is "1.1"

class PageParseResult(BaseModel):
    page_number: int
    laws: List[LawSection]
    
class DocumentService:

    def __init__(self):
        self.client = openai.OpenAI(api_key=key)
    
    def _pdf_to_images(self, pdf_path: str) -> List:
        """Convert PDF pages to images for AI vision processing."""
        try:
            images = convert_from_path(pdf_path, dpi=300)
            return images
        except Exception as e:
            print(f"Error converting PDF to images: {e}")
            return []
    
    def _image_to_base64(self, image) -> str:
        """Convert PIL Image to base64 string for API."""
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return img_str
    
    def _write_documents_to_file(self, documents: List[Document], filename: str) -> None:
        """
        Write parsed documents to a text file for manual validation.
        
        Notes:
        - Unused in the final submitted version, but I used this to manually verify that
          all laws were being properly parsed
        """
        try:
            from datetime import datetime
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write("PARSED LEGAL DOCUMENTS\n")
                f.write("=" * 80 + "\n")
                f.write(f"Total documents: {len(documents)}\n")
                f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("=" * 80 + "\n\n")
                
                for i, doc in enumerate(documents):
                    f.write(f"[DOCUMENT {i+1}]\n")
                    f.write("-" * 40 + "\n")
                    f.write(f"Section: {doc.metadata.get('Section', 'Unknown')}\n")
                    f.write(f"Page: {doc.metadata.get('Page', 'Unknown')}\n")
                    
                    if doc.metadata.get('Parent_Section'):
                        f.write(f"Parent Section: {doc.metadata['Parent_Section']}\n")
                    if doc.metadata.get('Section_Title'):
                        f.write(f"Section Title: {doc.metadata['Section_Title']}\n")
                    
                    f.write(f"\nFull Text:\n")
                    f.write(doc.text)
                    f.write("\n\n")
                    f.write("=" * 80 + "\n\n")
            
            print(f"✅ Documents written to {filename} for manual validation")
            
        except Exception as e:
            print(f"Error writing documents to file: {e}")
    
    def _parse_page_with_vision(self, image_base64: str, page_num: int) -> PageParseResult:
        """
        Use OpenAI Vision API with structured outputs to parse a single page.
        
        Considerations:
        - Since this document had some laws with nested sublaws and others without nested sublaws,
          I chose using an LLM to parse this document instead of a pdf text splitter, which
          might not guarantee parsing each law properly. This method would likely work with
          files structured differently, making the system more robust.
        - I choose one page at a time for simplicity and to complete within the time frame,
          but in production, I would choose a batching solution to reduce on the API calls
          to keep cost in mind.
        """
        try:
            response = self.client.beta.chat.completions.parse(
                model="gpt-4.1-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"""Analyze this page from a legal document and extract all laws and their subsections.

                                CRITICAL: 
                                1. Set page_number to exactly {page_num}
                                2. Only extract numbered law sections with actual text (like "5.1.2")
                                3. For section_title, use the HEADING TEXT, not numbers
                                
                                Example:
                                If you see "5. Taxes" followed by "5.1.2 The Great Houses gather taxes"
                                Extract: section="5.1.2", section_title="Taxes", text="The Great Houses gather taxes", parent_section="5.1"
                                
                                Rules:
                                - page_number must be {page_num}
                                - Only extract sections with actual law text
                                - section_title should be the heading name (like "Taxes", "Peace", "War")
                                - Extract law text without section numbers
                                - Set parent_section to immediate parent (e.g., "5.1" for "5.1.2")"""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                response_format=PageParseResult,
                max_tokens=2000
            )
            
            result = response.choices[0].message.parsed
            print(f"Parsed page {page_num}: {len(result.laws)} laws found")
            return result
                
        except Exception as e:
            print(f"Error parsing page {page_num} with vision API: {e}")
            return PageParseResult(
                page_number=page_num, 
                laws=[], 
            )
    
    def create_documents(self, pdf_path: str = "docs/laws.pdf") -> List[Document]:
        """
        Parse PDF and create Document objects for each law/subsection.

        Considerations:
        - The `laws.pdf` document didn't have any laws where the text started at the bottom
          of a page, and rolled over to the next page, but in production, I would update the
          prompt of the LLM call to mention that this is possible and set a flag to indicate
          there is a law that is incomplete on the current page, and then when parsing, add
          logic to find the incomplete law on the previous page and stitch the two together.
        """
                
        # Check if an API key was passed in
        if not key:
            raise Exception("No API Key passed in. Please set OPENAI_API_KEY environment variable.")
        
        # Convert PDF to images
        images = self._pdf_to_images(pdf_path)
        if not images:
            print("Failed to convert PDF to images")
            return []
                
        # Parse each page with AI vision
        all_page_data = []
        for i, image in enumerate(images):
            page_num = i + 1
            print(f"\nProcessing page {page_num}...")
            
            image_base64 = self._image_to_base64(image)
            page_data = self._parse_page_with_vision(image_base64, page_num)
            all_page_data.append(page_data)
        
        # Process the page data
        documents = []
        
        for page_data in all_page_data:
            page_num = page_data.page_number
                    
            # Process new laws on this page
            for law in page_data.laws:
                section = law.section
                text = law.text
                section_title = law.section_title
                parent_section = law.parent_section
                
                # Create metadata
                metadata = {
                    "Section": section,
                    "Page": page_num
                }
                if section_title:
                    metadata["Section_Title"] = section_title
                if parent_section:
                    metadata["Parent_Section"] = parent_section
                
                # Create document 
                doc = Document(
                    metadata=metadata,
                    text=f"{text}"
                )
                documents.append(doc)
                print(f"Created document for {section}")
        
        print(f"\nTotal documents created: {len(documents)}")
        
        return documents

class QdrantService:
    def __init__(self, k: int = 2):
        self.index = None
        self.k = k
    
    def connect(self) -> None:
        # Configure global settings
        Settings.embed_model = OpenAIEmbedding()
        Settings.llm = OpenAI(api_key=key, model="gpt-4")
        
        client = qdrant_client.QdrantClient(location=":memory:")
        vstore = QdrantVectorStore(client=client, collection_name='temp')

        self.index = VectorStoreIndex.from_vector_store(vector_store=vstore)

    def load(self, docs = List[Document]):
        self.index.insert_nodes(docs)
    
    def query(self, query_str: str) -> Output:
        """
        Query the legal documents using CitationQueryEngine and return structured results.

        Considerations:
        - I stuck with using CitationQueryEngine since it's lightweight and meets the requirements
          of this take home assessment, but in production, using LangChain RAG could be a good starting
          point, allowing us to easily swap any element in the retrierver -> reranker -> LLM chain (picking
          a different vector db, embedding, reranker, or LLM). If we want need even more fine grain control
          then building out our own RAG pipeline would be the next step.
        """
        if not self.index:
            raise ValueError("Index not initialized. Call connect() and load() first.")
        
        # Create a citation query engine with similarity top k
        citation_query_engine = CitationQueryEngine.from_args(
            self.index,
            similarity_top_k=self.k,
            citation_chunk_size=512,
        )
        
        # Execute the query
        response = citation_query_engine.query(query_str)
        
        # Extract citations from the response
        citations = []
        for source_node in response.source_nodes:
            # Get section info from metadata
            section = source_node.node.metadata.get('Section', 'Unknown Section')
            section_title = source_node.node.metadata.get('Section_Title', '')
            page_number = source_node.node.metadata.get('Page', '')
            parent_section = source_node.node.metadata.get('Parent_Section', '')
            
            # Create source identifier
            source_name = f"{section}"
            if section_title:
                source_name += f" ({section_title})"
            
            # Clean the text to remove "Source X:" prefixes
            text = source_node.node.text.strip()
            # Remove "Source N:" pattern at the beginning
            text = re.sub(r'^Source \d+:\s*', '', text)
            
            citation = Citation(
                source=source_name,
                text=text,
                page_number=page_number,
                parent_section=(parent_section if parent_section != '' else None)
            )
            citations.append(citation)
        
        # Create the output object
        output = Output(
            query=query_str, 
            response=response.response,
            citations=citations
            )
        
        return output
       

if __name__ == "__main__":
    # Example workflow to test PDF parsing
    print("Testing PDF parsing with AI vision...")
    
    doc_service = DocumentService()
    docs = doc_service.create_documents("docs/laws.pdf")
    
    print(f"\nSuccessfully parsed {len(docs)} documents from the PDF")
    
    # Test the full pipeline
    print("\n" + "="*80)
    print("TESTING QUERY ENGINE")
    print("="*80)
    
    index = QdrantService()
    index.connect()
    index.load(docs)
    
    test_query = "what happens if I steal?"
    print(f"\nQuery: {test_query}")
    result = index.query(test_query)
    
    print(f"\nResponse: {result.response}")
    print(f"\nCitations ({len(result.citations)}):")
    for i, citation in enumerate(result.citations):
        print(f"{i+1}. Source: {citation.source}")
        print(f"   Text: {citation.text[:150]}..." if len(citation.text) > 150 else f"   Text: {citation.text}")
        print()





