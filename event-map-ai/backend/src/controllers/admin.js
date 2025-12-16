const Event = require('../models/Event');
const User = require('../models/User');

// Get all pending events for admin review
exports.getPendingEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending' })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching pending events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve or reject event
exports.reviewEvent = async (req, res) => {
  try {
    const { eventId, status, rejectionReason } = req.body;
    
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Update event status
    event.status = status;
    if (rejectionReason) {
      event.rejectionReason = rejectionReason;
    }
    
    await event.save();
    
    // Populate organizer info
    await event.populate('organizer', 'name email');
    
    res.json({
      message: `Event ${status} successfully`,
      event: {
        _id: event._id,
        title: event.title,
        status: event.status,
        organizer: {
          id: event.organizer._id,
          name: event.organizer.name,
          email: event.organizer.email
        }
      }
    });
  } catch (error) {
    console.error('Error reviewing event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get flagged events for moderation review
exports.getFlaggedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      'aiFlags.riskScore': { $gt: 0.5 }
    })
      .populate('organizer', 'name email')
      .sort({ 'aiFlags.riskScore': -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching flagged events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get duplicate event pairs for review
exports.getDuplicateEvents = async (req, res) => {
  try {
    // Find events with high duplicate risk
    const events = await Event.find({
      'aiFlags.duplicateRisk': { $gt: 0.8 }
    })
      .populate('organizer', 'name email')
      .sort({ 'aiFlags.duplicateRisk': -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching duplicate events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (for admin panel)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    // Validate role
    if (!['user', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Update user role
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
};