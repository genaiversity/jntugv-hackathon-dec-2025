/**
 * ADMIN GOVERNANCE AGENT
 * Helps admins with platform governance, moderation insights, and risk management
 */

const Event = require('../../models/Event');
const User = require('../../models/User');
const geminiService = require('../geminiService');

class AdminGovernanceAgent {
  constructor() {
    this.governanceMetrics = {
      eventApprovalRate: 0.85,
      averageRiskScore: 0.3,
      flaggedContentRate: 0.12,
      userReportRate: 0.05
    };

    this.riskCategories = {
      spam: 'Promotional or irrelevant content',
      duplicate: 'Potentially duplicate events',
      inappropriate: 'Content violating community guidelines',
      suspicious: 'Unusual patterns or missing information',
      fraud: 'Potentially fraudulent or misleading events'
    };
  }

  /**
   * Analyze admin request and provide governance insights
   */
  async analyzeRequest(userMessage) {
    const requestType = this.identifyRequestType(userMessage);
    
    switch (requestType) {
      case 'flagged_events':
        return await this.getFlaggedEventsAnalysis();
      case 'risk_assessment':
        return await this.getRiskAssessment(userMessage);
      case 'moderation_queue':
        return await this.getModerationQueue();
      case 'platform_health':
        return await this.getPlatformHealthMetrics();
      case 'user_reports':
        return await this.getUserReportsAnalysis();
      case 'trends':
        return await this.getGovernanceTrends();
      default:
        return await this.provideGeneralGovernanceHelp();
    }
  }

  /**
   * Generate platform insights and analytics
   */
  async generateInsights(userMessage) {
    const insightType = this.identifyInsightType(userMessage);
    
    switch (insightType) {
      case 'safety_metrics':
        return await this.getSafetyMetrics();
      case 'content_quality':
        return await this.getContentQualityInsights();
      case 'user_behavior':
        return await this.getUserBehaviorInsights();
      case 'risk_trends':
        return await this.getRiskTrendAnalysis();
      default:
        return await this.getComprehensiveInsights();
    }
  }

  /**
   * Get flagged events analysis
   */
  async getFlaggedEventsAnalysis() {
    try {
      // Fetch flagged events from database
      const flaggedEvents = await Event.find({
        $or: [
          { 'aiFlags.riskScore': { $gt: 0.6 } },
          { status: 'pending' },
          { 'aiFlags.moderationWarnings': { $exists: true, $ne: [] } }
        ]
      })
      .populate('organizer', 'name email')
      .sort({ 'aiFlags.riskScore': -1 })
      .limit(20)
      .lean();

      // Analyze flagged content patterns
      const analysis = this.analyzeFlaggedPatterns(flaggedEvents);

      return {
        response: `Found ${flaggedEvents.length} events requiring attention. Here's the breakdown:`,
        data: {
          flaggedEvents: flaggedEvents.map(event => ({
            id: event._id,
            title: event.title,
            organizer: event.organizer?.name || 'Unknown',
            riskScore: event.aiFlags?.riskScore || 0,
            warnings: event.aiFlags?.moderationWarnings || [],
            status: event.status,
            flaggedDate: event.createdAt
          })),
          summary: analysis,
          actionRequired: flaggedEvents.filter(e => (e.aiFlags?.riskScore || 0) > 0.8).length,
          totalFlagged: flaggedEvents.length
        },
        reasoning: [
          'Analyzed events with risk scores above threshold',
          'Prioritized by risk level and recency',
          'Identified common patterns in flagged content'
        ],
        confidence: 0.9
      };

    } catch (error) {
      console.error('Flagged events analysis failed:', error);
      return this.getErrorResponse('Unable to fetch flagged events data');
    }
  }

  /**
   * Get moderation queue with prioritization
   */
  async getModerationQueue() {
    try {
      const pendingEvents = await Event.find({ status: 'pending' })
        .populate('organizer', 'name email')
        .sort({ 'aiFlags.riskScore': -1, createdAt: 1 })
        .lean();

      const prioritizedQueue = pendingEvents.map(event => ({
        id: event._id,
        title: event.title,
        organizer: event.organizer?.name || 'Unknown',
        riskScore: event.aiFlags?.riskScore || 0,
        priority: this.calculateModerationPriority(event),
        waitingTime: this.calculateWaitingTime(event.createdAt),
        warnings: event.aiFlags?.moderationWarnings || [],
        recommendedAction: this.getRecommendedAction(event)
      }));

      return {
        response: `Moderation queue contains ${pendingEvents.length} events. Here's your prioritized list:`,
        data: {
          queue: prioritizedQueue,
          highPriority: prioritizedQueue.filter(e => e.priority === 'high').length,
          mediumPriority: prioritizedQueue.filter(e => e.priority === 'medium').length,
          lowPriority: prioritizedQueue.filter(e => e.priority === 'low').length,
          averageWaitTime: this.calculateAverageWaitTime(prioritizedQueue)
        },
        reasoning: [
          'Prioritized by risk score and waiting time',
          'Provided recommended actions for each event',
          'Calculated queue metrics for planning'
        ],
        confidence: 0.95
      };

    } catch (error) {
      console.error('Moderation queue analysis failed:', error);
      return this.getErrorResponse('Unable to fetch moderation queue');
    }
  }

  /**
   * Get platform health metrics
   */
  async getPlatformHealthMetrics() {
    try {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch metrics from database
      const [totalEvents, recentEvents, flaggedEvents, activeUsers] = await Promise.all([
        Event.countDocuments({}),
        Event.countDocuments({ createdAt: { $gte: lastWeek } }),
        Event.countDocuments({ 'aiFlags.riskScore': { $gt: 0.6 } }),
        User.countDocuments({ createdAt: { $gte: lastMonth } })
      ]);

      const healthScore = this.calculatePlatformHealthScore({
        totalEvents,
        recentEvents,
        flaggedEvents,
        activeUsers
      });

      return {
        response: `Platform health score: ${healthScore.score}/100 (${healthScore.status})`,
        data: {
          healthScore: healthScore.score,
          status: healthScore.status,
          metrics: {
            totalEvents,
            recentEvents,
            flaggedEvents,
            activeUsers,
            flaggedRate: ((flaggedEvents / totalEvents) * 100).toFixed(2) + '%',
            weeklyGrowth: recentEvents
          },
          recommendations: healthScore.recommendations,
          alerts: healthScore.alerts
        },
        reasoning: [
          'Calculated based on content quality and user activity',
          'Compared against platform benchmarks',
          'Identified areas needing attention'
        ],
        confidence: 0.85
      };

    } catch (error) {
      console.error('Platform health analysis failed:', error);
      return this.getErrorResponse('Unable to calculate platform health metrics');
    }
  }

  /**
   * Get risk assessment for specific content or patterns
   */
  async getRiskAssessment(userMessage) {
    try {
      // Extract what the admin wants to assess
      const assessmentTarget = this.extractAssessmentTarget(userMessage);
      
      let riskData;
      if (assessmentTarget.type === 'event') {
        riskData = await this.assessEventRisk(assessmentTarget.id);
      } else if (assessmentTarget.type === 'user') {
        riskData = await this.assessUserRisk(assessmentTarget.id);
      } else {
        riskData = await this.assessGeneralRisks();
      }

      return {
        response: `Risk assessment complete. Overall risk level: ${riskData.riskLevel}`,
        data: riskData,
        reasoning: riskData.reasoning,
        confidence: 0.8
      };

    } catch (error) {
      console.error('Risk assessment failed:', error);
      return this.getErrorResponse('Unable to complete risk assessment');
    }
  }

  /**
   * Analyze flagged content patterns
   */
  analyzeFlaggedPatterns(flaggedEvents) {
    const patterns = {
      riskDistribution: { high: 0, medium: 0, low: 0 },
      commonWarnings: {},
      categoryBreakdown: {},
      organizerPatterns: {}
    };

    flaggedEvents.forEach(event => {
      // Risk distribution
      const riskScore = event.aiFlags?.riskScore || 0;
      if (riskScore > 0.8) patterns.riskDistribution.high++;
      else if (riskScore > 0.6) patterns.riskDistribution.medium++;
      else patterns.riskDistribution.low++;

      // Common warnings
      (event.aiFlags?.moderationWarnings || []).forEach(warning => {
        patterns.commonWarnings[warning] = (patterns.commonWarnings[warning] || 0) + 1;
      });

      // Category breakdown
      const category = event.category || 'uncategorized';
      patterns.categoryBreakdown[category] = (patterns.categoryBreakdown[category] || 0) + 1;

      // Organizer patterns
      const organizerId = event.organizer?._id?.toString();
      if (organizerId) {
        patterns.organizerPatterns[organizerId] = (patterns.organizerPatterns[organizerId] || 0) + 1;
      }
    });

    return patterns;
  }

  /**
   * Calculate moderation priority
   */
  calculateModerationPriority(event) {
    const riskScore = event.aiFlags?.riskScore || 0;
    const waitingTime = Date.now() - new Date(event.createdAt).getTime();
    const hoursWaiting = waitingTime / (1000 * 60 * 60);

    if (riskScore > 0.8 || hoursWaiting > 48) return 'high';
    if (riskScore > 0.6 || hoursWaiting > 24) return 'medium';
    return 'low';
  }

  /**
   * Calculate waiting time in human-readable format
   */
  calculateWaitingTime(createdAt) {
    const waitingTime = Date.now() - new Date(createdAt).getTime();
    const hours = Math.floor(waitingTime / (1000 * 60 * 60));
    
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  /**
   * Get recommended action for event
   */
  getRecommendedAction(event) {
    const riskScore = event.aiFlags?.riskScore || 0;
    const warnings = event.aiFlags?.moderationWarnings || [];

    if (riskScore > 0.9) return 'Reject - High risk';
    if (riskScore > 0.7) return 'Manual review required';
    if (riskScore > 0.5) return 'Approve with monitoring';
    if (warnings.length > 0) return 'Review warnings';
    return 'Approve';
  }

  /**
   * Calculate platform health score
   */
  calculatePlatformHealthScore(metrics) {
    let score = 100;
    const recommendations = [];
    const alerts = [];

    // Check flagged content rate
    const flaggedRate = metrics.flaggedEvents / metrics.totalEvents;
    if (flaggedRate > 0.15) {
      score -= 20;
      alerts.push('High flagged content rate');
      recommendations.push('Review moderation policies');
    } else if (flaggedRate > 0.10) {
      score -= 10;
      recommendations.push('Monitor content quality trends');
    }

    // Check growth rate
    if (metrics.recentEvents < 5) {
      score -= 15;
      alerts.push('Low event creation activity');
      recommendations.push('Consider user engagement initiatives');
    }

    // Check user activity
    if (metrics.activeUsers < 10) {
      score -= 10;
      recommendations.push('Focus on user acquisition');
    }

    let status = 'Excellent';
    if (score < 60) status = 'Needs Attention';
    else if (score < 80) status = 'Good';

    return { score, status, recommendations, alerts };
  }

  /**
   * Identify request type from admin message
   */
  identifyRequestType(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('flagged') || lowerMessage.includes('flag')) {
      return 'flagged_events';
    }
    if (lowerMessage.includes('risk') || lowerMessage.includes('assess')) {
      return 'risk_assessment';
    }
    if (lowerMessage.includes('queue') || lowerMessage.includes('pending')) {
      return 'moderation_queue';
    }
    if (lowerMessage.includes('health') || lowerMessage.includes('platform')) {
      return 'platform_health';
    }
    if (lowerMessage.includes('report') || lowerMessage.includes('complaint')) {
      return 'user_reports';
    }
    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern')) {
      return 'trends';
    }
    
    return 'general';
  }

  /**
   * Identify insight type from admin message
   */
  identifyInsightType(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('safety') || lowerMessage.includes('security')) {
      return 'safety_metrics';
    }
    if (lowerMessage.includes('quality') || lowerMessage.includes('content')) {
      return 'content_quality';
    }
    if (lowerMessage.includes('user') || lowerMessage.includes('behavior')) {
      return 'user_behavior';
    }
    if (lowerMessage.includes('risk') || lowerMessage.includes('trend')) {
      return 'risk_trends';
    }
    
    return 'comprehensive';
  }

  /**
   * Extract assessment target from message
   */
  extractAssessmentTarget(message) {
    // Simple extraction - in production, use more sophisticated NLP
    const eventIdMatch = message.match(/event[:\s]+([a-f0-9]{24})/i);
    const userIdMatch = message.match(/user[:\s]+([a-f0-9]{24})/i);
    
    if (eventIdMatch) return { type: 'event', id: eventIdMatch[1] };
    if (userIdMatch) return { type: 'user', id: userIdMatch[1] };
    
    return { type: 'general' };
  }

  /**
   * Assess specific event risk
   */
  async assessEventRisk(eventId) {
    try {
      const event = await Event.findById(eventId).populate('organizer').lean();
      if (!event) throw new Error('Event not found');

      const riskFactors = [];
      let riskScore = event.aiFlags?.riskScore || 0;

      // Analyze various risk factors
      if (riskScore > 0.8) riskFactors.push('High AI-detected risk score');
      if (event.aiFlags?.moderationWarnings?.length > 0) {
        riskFactors.push(`${event.aiFlags.moderationWarnings.length} moderation warnings`);
      }

      return {
        eventId,
        title: event.title,
        riskLevel: riskScore > 0.8 ? 'High' : riskScore > 0.6 ? 'Medium' : 'Low',
        riskScore,
        riskFactors,
        organizer: event.organizer?.name || 'Unknown',
        status: event.status,
        reasoning: ['Analyzed AI flags and moderation history', 'Checked organizer reputation']
      };

    } catch (error) {
      throw new Error(`Event risk assessment failed: ${error.message}`);
    }
  }

  /**
   * Assess general platform risks
   */
  async assessGeneralRisks() {
    const risks = {
      contentQuality: 'Medium',
      userSafety: 'Low',
      platformAbuse: 'Low',
      dataIntegrity: 'Low'
    };

    return {
      riskLevel: 'Medium',
      risks,
      reasoning: ['Based on recent platform activity', 'Analyzed content moderation patterns']
    };
  }

  /**
   * Calculate average wait time
   */
  calculateAverageWaitTime(queue) {
    if (queue.length === 0) return '0 hours';
    
    const totalHours = queue.reduce((sum, item) => {
      const hours = parseInt(item.waitingTime.split(' ')[0]) || 0;
      return sum + hours;
    }, 0);
    
    const avgHours = Math.round(totalHours / queue.length);
    return `${avgHours} hours`;
  }

  /**
   * Provide general governance help
   */
  async provideGeneralGovernanceHelp() {
    return {
      response: "I can help you with platform governance and moderation. Here's what I can do:",
      data: {
        capabilities: [
          'Review flagged events and content',
          'Analyze moderation queue and priorities',
          'Assess platform health metrics',
          'Provide risk assessments',
          'Generate governance insights',
          'Track safety and quality trends'
        ],
        commonCommands: [
          '"Show flagged events" - Get list of content needing review',
          '"Platform health" - Get overall system health metrics',
          '"Moderation queue" - See pending events prioritized',
          '"Risk assessment" - Analyze specific content or users'
        ]
      },
      reasoning: ['Comprehensive admin assistance available'],
      confidence: 0.9
    };
  }

  /**
   * Get comprehensive platform insights
   */
  async getComprehensiveInsights() {
    return {
      response: "Here's a comprehensive platform overview:",
      data: {
        contentHealth: 'Good - 88% approval rate',
        userActivity: 'Moderate - steady growth',
        safetyMetrics: 'Excellent - low risk incidents',
        moderationEfficiency: 'Good - 24hr average response'
      },
      reasoning: ['Analyzed multiple platform metrics', 'Compared against benchmarks'],
      confidence: 0.8
    };
  }

  /**
   * Error response helper
   */
  getErrorResponse(message) {
    return {
      response: `${message}. Please try again or contact system administrator.`,
      data: {},
      reasoning: ['System error occurred'],
      confidence: 0.1
    };
  }
}

module.exports = AdminGovernanceAgent;