const agentWorkflows = require('../ai/agentWorkflows');
const Event = require('../models/Event');

exports.searchEvents = async (req, res) => {
  try {
    const { query, latitude, longitude } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const userLocation = latitude && longitude ? { latitude, longitude } : null;
    
    const results = await agentWorkflows.searchAndRankEvents(query, userLocation);
    
    res.json({ results });
  } catch (error) {
    console.error('Search agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.checkDuplicates = async (req, res) => {
  try {
    const eventData = req.body;
    
    const result = await agentWorkflows.detectDuplicates(eventData);
    
    res.json(result);
  } catch (error) {
    console.error('Duplicate detection agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.moderateEvent = async (req, res) => {
  try {
    const eventData = req.body;
    
    const result = await agentWorkflows.moderateContent(eventData);
    
    res.json(result);
  } catch (error) {
    console.error('Content moderation agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const { limit } = req.query;
    
    const recommendations = await agentWorkflows.recommendEvents(userId, parseInt(limit) || 5);
    
    res.json({ recommendations });
  } catch (error) {
    console.error('Recommendation agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Agent for event approval workflow
exports.approveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { approved, reason } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can approve events' });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Update event status
    event.status = approved ? 'approved' : 'rejected';
    if (reason) {
      event.adminNotes = reason;
    }
    
    await event.save();
    
    // If approved, add to retrieval index
    if (approved) {
      await agentWorkflows.retrievalService.addEventToIndex(event);
    }
    
    res.json({ 
      message: `Event ${approved ? 'approved' : 'rejected'} successfully`,
      event 
    });
  } catch (error) {
    console.error('Event approval agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};