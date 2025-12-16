/**
 * AI ASSISTANT WIDGET
 * Floating corner AI assistant with multi-agent capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
import './AIAssistantWidget.css';

const AIAssistantWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize session and capabilities
  useEffect(() => {
    initializeSession();
    if (user) {
      fetchCapabilities();
    }
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const initializeSession = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setSessionId(newSessionId);
    
    // Add welcome message
    const welcomeMessage = getWelcomeMessage(user?.role);
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: welcomeMessage,
      timestamp: new Date(),
      agentsUsed: ['RoleAgent'],
      confidence: 1.0
    }]);
  };

  const fetchCapabilities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Set guest capabilities
        setCapabilities({
          features: [
            'Find events',
            'Basic event search',
            'View event details'
          ],
          examples: [
            "Show me all events",
            "Find tech events",
            "What events are this weekend?"
          ]
        });
        return;
      }

      const response = await fetch('/api/ai-assistant/capabilities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCapabilities(data.capabilities);
      }
    } catch (error) {
      console.error('Error fetching capabilities:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // For non-authenticated users, use a different endpoint or show login prompt
      if (!user && !token) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: "I'd love to help you with that! For personalized recommendations and full AI assistance, please log in to your account. I can still help you with basic event searches though. Try asking 'show me all events' or 'find tech events'.",
          timestamp: new Date(),
          agentsUsed: ['GuestHandler'],
          confidence: 1.0
        };
        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          sessionId,
          location: await getUserLocation()
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.message,
          timestamp: new Date(),
          agentsUsed: data.explanation.agentsUsed,
          reasoning: data.explanation.reasoning,
          confidence: data.explanation.confidence,
          safetyStatus: data.explanation.safetyStatus,
          data: data.data,
          executionTime: data.metadata.executionTime
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'AI Assistant error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          () => resolve(null)
        );
      } else {
        resolve(null);
      }
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWelcomeMessage = (role) => {
    if (!user) {
      return "🤖 Hello! I'm your AI-powered Event Assistant with multiple specialized agents working together to help you discover amazing events! For personalized recommendations and advanced AI features, please log in. What events are you looking for?";
    }

    const messages = {
      user: "🎯 Hi there! I'm your intelligent Event Assistant powered by 10 specialized AI agents. I can help you discover events, get smart recommendations, and answer any questions. What would you like to explore?",
      organizer: "🚀 Welcome, Event Organizer! I'm your AI assistant with advanced capabilities for event creation and optimization. My agents can help you write descriptions, analyze performance, and boost engagement. How can I help you succeed?",
      admin: "⚡ Admin Mode Activated! I'm your AI Event Assistant with full platform capabilities. My governance agents can help with moderation, analytics, risk assessment, and platform insights. What would you like to review?"
    };

    return messages[role] || messages.user;
  };

  const formatAgentsUsed = (agents) => {
    if (!agents || agents.length === 0) return 'AI Processing';
    
    const agentNames = agents.map(agent => 
      agent.replace('Agent', '').replace(/([A-Z])/g, ' $1').trim()
    );
    
    return `${agentNames.join(', ')}`;
  };

  const getConfidenceClass = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.8) return '🎯';
    if (confidence >= 0.6) return '✅';
    return '⚠️';
  };

  const renderMessage = (message) => {
    return (
      <div key={message.id} className={`message ${message.type}`}>
        <div className="message-content">
          {message.content}
          
          {/* Render event data if available */}
          {message.data?.events && (
            <div className="event-results">
              <h4>Found Events:</h4>
              {message.data.events.slice(0, 3).map((event, index) => (
                <div key={index} className="event-card-mini">
                  <h5>{event.title}</h5>
                  <p>{event.location} • {new Date(event.date).toLocaleDateString()}</p>
                  <p className="event-description">
                    {event.description?.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Render recommendations if available */}
          {message.data?.recommendations && (
            <div className="recommendations">
              <h4>Recommendations:</h4>
              {message.data.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <h5>{rec.title}</h5>
                  <p className="recommendation-reason">{rec.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI metadata */}
        {message.type === 'ai' && !message.isError && (
          <div className="message-metadata">
            <div className="metadata-row">
              <div className="agents-used">
                🤖 {formatAgentsUsed(message.agentsUsed)}
              </div>
              {message.confidence && (
                <div className={`confidence ${getConfidenceClass(message.confidence)}`}>
                  {getConfidenceIcon(message.confidence)} {Math.round(message.confidence * 100)}%
                </div>
              )}
            </div>
            {message.executionTime && (
              <div className="execution-time">
                ⚡ {message.executionTime}ms
              </div>
            )}
          </div>
        )}

        <div className="message-time">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    );
  };

  const renderQuickActions = () => {
    if (!capabilities) return null;

    let quickActions;
    if (!user) {
      quickActions = [
        "Show me all events",
        "Find tech events",
        "What events are this weekend?",
        "Login for personalized recommendations"
      ];
    } else {
      quickActions = [
        "Find events near me",
        "Recommend events for me",
        user?.role === 'organizer' ? "Help me create an event" : "What's happening this weekend?",
        user?.role === 'admin' ? "Show platform health" : "Find free events"
      ];
    }

    return (
      <div className="quick-actions">
        <p>Quick actions:</p>
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="quick-action-btn"
            onClick={() => {
              if (action === "Login for personalized recommendations") {
                window.location.href = '/login';
              } else {
                setInputMessage(action);
                setTimeout(() => sendMessage(), 100);
              }
            }}
          >
            {action}
          </button>
        ))}
      </div>
    );
  };

  // Show widget for all users, but with different functionality

  return (
    <div className="ai-assistant-widget">
      {/* Floating AI Icon */}
      <div 
        className={`ai-icon ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="ai-icon-inner">
          🤖
        </div>
        {!isOpen && (
          <div className="ai-pulse"></div>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <h3>AI Event Assistant</h3>
              <span className="user-role">{user?.role || 'guest'}</span>
            </div>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map(renderMessage)}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="message ai loading">
                <div className="ai-thinking">
                  <div className="thinking-avatar">🤖</div>
                  <div className="thinking-content">
                    <div className="thinking-text">AI is thinking...</div>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (show when no messages or just welcome) */}
          {messages.length <= 1 && renderQuickActions()}

          {/* Input */}
          <div className="ai-chat-input">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about events..."
              rows="2"
              disabled={isLoading}
            />
            <button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>

          {/* Footer */}
          <div className="ai-chat-footer">
            <div className="ai-status-indicators">
              <div className="ai-status-item">
                <span className="status-dot active"></span>
                <small>AI Agents Active</small>
              </div>
              <div className="ai-status-item">
                <span className="status-dot active"></span>
                <small>Real-time Processing</small>
              </div>
              {user?.role === 'admin' && (
                <div className="ai-status-item admin">
                  <span className="status-dot admin"></span>
                  <small>Admin Mode</small>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantWidget;