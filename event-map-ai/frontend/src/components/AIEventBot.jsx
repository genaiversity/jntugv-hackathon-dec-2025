import React, { useState, useRef, useEffect } from 'react';
import './AIEventBot.css';

const AIEventBot = ({ events = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your Event Assistant. I can help you find information about events, answer questions, and provide recommendations. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // RAG functionality - search through events
  const searchEvents = (query) => {
    const searchTerms = query.toLowerCase().split(' ');
    return events.filter(event => {
      const searchableText = `${event.title} ${event.description} ${event.location} ${event.category}`.toLowerCase();
      return searchTerms.some(term => searchableText.includes(term));
    });
  };

  // AI Response Generator using backend RAG system
  const generateResponse = async (userMessage) => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: 'user-session-' + Date.now()
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      } else {
        // Fallback to local processing
        return generateLocalResponse(userMessage);
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      // Fallback to local processing
      return generateLocalResponse(userMessage);
    }
  };

  // Fallback local response generator
  const generateLocalResponse = (userMessage) => {
    const query = userMessage.toLowerCase();
    
    // Intent detection
    if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      return "Hello! How can I help you with events today?";
    }
    
    if (query.includes('find') || query.includes('search') || query.includes('looking for')) {
      const relevantEvents = searchEvents(query);
      if (relevantEvents.length > 0) {
        const eventList = relevantEvents.slice(0, 3).map(event => 
          `• **${event.title}** - ${event.location} (${new Date(event.date).toLocaleDateString()})`
        ).join('\n');
        return `I found ${relevantEvents.length} relevant events:\n\n${eventList}\n\nWould you like more details about any of these?`;
      } else {
        return "I couldn't find any events matching your criteria. Try searching with different keywords like location, date, or event type.";
      }
    }
    
    if (query.includes('when') || query.includes('date') || query.includes('time')) {
      const relevantEvents = searchEvents(query);
      if (relevantEvents.length > 0) {
        const event = relevantEvents[0];
        return `${event.title} is scheduled for ${new Date(event.date).toLocaleDateString()} at ${event.time || 'TBD'}. Location: ${event.location}`;
      }
    }
    
    if (query.includes('where') || query.includes('location')) {
      const relevantEvents = searchEvents(query);
      if (relevantEvents.length > 0) {
        const locations = [...new Set(relevantEvents.map(e => e.location))];
        return `Events are happening at: ${locations.join(', ')}. Would you like specific details about any location?`;
      }
    }
    
    if (query.includes('price') || query.includes('cost') || query.includes('ticket')) {
      const relevantEvents = searchEvents(query);
      if (relevantEvents.length > 0) {
        const event = relevantEvents[0];
        return `${event.title} ${event.price ? `costs $${event.price}` : 'pricing information is not available'}. You can register through our platform!`;
      }
    }
    
    if (query.includes('recommend') || query.includes('suggest')) {
      const popularEvents = events.slice(0, 3);
      if (popularEvents.length > 0) {
        const recommendations = popularEvents.map(event => 
          `• **${event.title}** - ${event.description?.substring(0, 100)}...`
        ).join('\n');
        return `Here are some popular events I'd recommend:\n\n${recommendations}`;
      }
    }
    
    // Default response with context
    return `I understand you're asking about "${userMessage}". I can help you with:
    
• Finding events by location, date, or category
• Getting event details like timing and pricing  
• Recommending popular events
• Answering questions about specific events

Try asking something like "Find music events this weekend" or "What events are near downtown?"`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(async () => {
      const response = await generateResponse(inputMessage);
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div 
        className={`chat-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="chat-icon">
          {isOpen ? '✕' : '🤖'}
        </div>
        <div className="chat-pulse"></div>
      </div>

      {/* Chat Window */}
      <div className={`chat-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="bot-avatar">🤖</div>
          <div className="bot-info">
            <h3>Event Assistant</h3>
            <span className="status">Online</span>
          </div>
          <button 
            className="close-chat"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender}`}
            >
              <div className="message-content">
                {message.text.split('\n').map((line, index) => (
                  <div key={index}>
                    {line.includes('**') ? (
                      <span dangerouslySetInnerHTML={{
                        __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    ) : (
                      line
                    )}
                  </div>
                ))}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot">
              <div className="message-content typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <div className="input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about events..."
              rows="1"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="send-button"
            >
              ➤
            </button>
          </div>
          <div className="quick-actions">
            <button onClick={() => setInputMessage("Find events near me")}>
              📍 Near me
            </button>
            <button onClick={() => setInputMessage("Recommend popular events")}>
              ⭐ Popular
            </button>
            <button onClick={() => setInputMessage("Events this weekend")}>
              📅 This weekend
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIEventBot;