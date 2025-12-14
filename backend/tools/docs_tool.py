"""Google Docs API integration tool."""
from typing import Dict, Any, List
import logging
from .google_auth import GoogleAuthHandler

logger = logging.getLogger(__name__)


class DocsTool:
    """Google Docs API tool for document operations."""
    
    def __init__(self, auth_handler: GoogleAuthHandler):
        """
        Initialize Docs tool.
        
        Args:
            auth_handler: Google authentication handler
        """
        self.auth_handler = auth_handler
        self.service = None
    
    def _get_service(self):
        """Get or create Docs API service."""
        if not self.service:
            self.service = self.auth_handler.get_service('docs', 'v1')
        return self.service
    
    def create_document(self, title: str) -> Dict[str, Any]:
        """
        Create a new Google Doc.
        
        Args:
            title: Document title
            
        Returns:
            Created document details
        """
        try:
            service = self._get_service()
            document = service.documents().create(body={'title': title}).execute()
            
            logger.info(f"Document created successfully. Document ID: {document['documentId']}")
            return document
        
        except Exception as e:
            logger.error(f"Failed to create document: {e}")
            raise
    
    def get_document(self, document_id: str) -> Dict[str, Any]:
        """
        Get document by ID.
        
        Args:
            document_id: Document identifier
            
        Returns:
            Document details
        """
        try:
            service = self._get_service()
            document = service.documents().get(documentId=document_id).execute()
            
            return document
        
        except Exception as e:
            logger.error(f"Failed to get document: {e}")
            raise
    
    def insert_text(
        self,
        document_id: str,
        text: str,
        index: int = 1
    ) -> Dict[str, Any]:
        """
        Insert text into a document.
        
        Args:
            document_id: Document identifier
            text: Text to insert
            index: Position to insert text (default: 1, start of document)
            
        Returns:
            Update response
        """
        try:
            service = self._get_service()
            
            requests = [{
                'insertText': {
                    'location': {
                        'index': index,
                    },
                    'text': text
                }
            }]
            
            result = service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()
            
            logger.info(f"Text inserted successfully into document: {document_id}")
            return result
        
        except Exception as e:
            logger.error(f"Failed to insert text: {e}")
            raise
    
    def append_text(self, document_id: str, text: str) -> Dict[str, Any]:
        """
        Append text to the end of a document.
        
        Args:
            document_id: Document identifier
            text: Text to append
            
        Returns:
            Update response
        """
        try:
            # Get document to find end index
            document = self.get_document(document_id)
            end_index = document['body']['content'][-1]['endIndex'] - 1
            
            return self.insert_text(document_id, text, end_index)
        
        except Exception as e:
            logger.error(f"Failed to append text: {e}")
            raise
    
    def read_document_text(self, document_id: str) -> str:
        """
        Read all text from a document.
        
        Args:
            document_id: Document identifier
            
        Returns:
            Document text content
        """
        try:
            document = self.get_document(document_id)
            
            text_content = []
            for element in document.get('body', {}).get('content', []):
                if 'paragraph' in element:
                    for text_run in element['paragraph'].get('elements', []):
                        if 'textRun' in text_run:
                            text_content.append(text_run['textRun']['content'])
            
            return ''.join(text_content)
        
        except Exception as e:
            logger.error(f"Failed to read document text: {e}")
            raise
    
    def format_text(
        self,
        document_id: str,
        start_index: int,
        end_index: int,
        bold: bool = False,
        italic: bool = False,
        font_size: int = None
    ) -> Dict[str, Any]:
        """
        Format text in a document.
        
        Args:
            document_id: Document identifier
            start_index: Start position of text to format
            end_index: End position of text to format
            bold: Make text bold
            italic: Make text italic
            font_size: Font size in points
            
        Returns:
            Update response
        """
        try:
            service = self._get_service()
            
            text_style = {}
            if bold:
                text_style['bold'] = True
            if italic:
                text_style['italic'] = True
            if font_size:
                text_style['fontSize'] = {'magnitude': font_size, 'unit': 'PT'}
            
            requests = [{
                'updateTextStyle': {
                    'range': {
                        'startIndex': start_index,
                        'endIndex': end_index
                    },
                    'textStyle': text_style,
                    'fields': ','.join(text_style.keys())
                }
            }]
            
            result = service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()
            
            logger.info(f"Text formatted successfully in document: {document_id}")
            return result
        
        except Exception as e:
            logger.error(f"Failed to format text: {e}")
            raise
