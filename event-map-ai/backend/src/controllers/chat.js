const retrievalService = require('../ai/retrievalService');
const geminiService = require('../ai/geminiService');

exports.chat = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get relevant context from events
    const context = await retrievalService.getEventContextForQuery(message);
    
    // Generate RAG response using Gemini
    const response = await geminiService.generateRAGResponse(message, context);
    
    res.json({ 
      response,
      context: context ? context.substring(0, 100) + '...' : null
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.chatStream = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get relevant context from events
    const context = await retrievalService.getEventContextForQuery(message);
    
    // For streaming, we'll send the context first, then the response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send context
    if (context) {
      res.write(`data: ${JSON.stringify({ type: 'context', content: context.substring(0, 100) + '...' })}\n\n`);
    }
    
    // Generate and stream response
    const response = await geminiService.generateRAGResponse(message, context);
    res.write(`data: ${JSON.stringify({ type: 'response', content: response })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error('Chat stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};