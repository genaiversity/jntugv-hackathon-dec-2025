/**
 * SAFETY & MODERATION AGENT
 * Detects spam, duplicates, fake content, and safety issues
 */

const geminiService = require('../geminiService');
const Event = require('../../models/Event');

class SafetyModerationAgent {
  constructor() {
    this.riskThresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 0.9
    };

    this.spamIndicators = [
      'guaranteed money',
      'make money fast',
      'click here now',
      'limited time only',
      'act now',
      'free money',
      'work from home',
      'no experience needed',
      'earn $$$',
      'multilevel marketing',
      'pyramid scheme'
    ];

    this.inappropriateContent = [
      'explicit',
      'adult content',
      'gambling',
      'illegal',
      'drugs',
      'weapons',
      'hate speech',
      'discrimination'
    ];

    this.duplicateThreshold = 0.85; // Similarity threshold for duplicates
  }

  /**
   * Moderate event content for safety and appropriateness
   */
  async moderateContent(content) {
    const { title, description, category, location } = content;
    
    try {
      // Run multiple moderation checks
      const checks = await Promise.all([
        this.checkSpamContent(title, description),
        this.checkInappropriateContent(title, description),
        this.checkSuspiciousPatterns(content),
        this.checkAIGenerated(title, description),
        this.validateEventDetails(content)
      ]);

      const [spamCheck, inappropriateCheck, suspiciousCheck, aiCheck, validationCheck] = checks;

      // Calculate overall risk score
      const riskScore = this.calculateRiskScore([
        spamCheck,
        inappropriateCheck,
        suspiciousCheck,
        aiCheck,
        validationCheck
      ]);

      // Determine status and actions
      const moderationResult = this.determineModerationAction(riskScore, checks);

      return {
        status: moderationResult.status,
        riskScore,
        isFlagged: riskScore > this.riskThresholds.medium,
        requiresReview: riskScore > this.riskThresholds.high,
        autoReject: riskScore > this.riskThresholds.critical,
        warnings: moderationResult.warnings,
        recommendations: moderationResult.recommendations,
        checks: {
          spam: spamCheck,
          inappropriate: inappropriateCheck,
          suspicious: suspiciousCheck,
          aiGenerated: aiCheck,
          validation: validationCheck
        }
      };

    } catch (error) {
      console.error('Content moderation error:', error);
      return this.getFailsafeModeration();
    }
  }

  /**
   * Check for duplicate events
   */
  async checkDuplicates(newEvent, existingEvents = null) {
    try {
      // Fetch existing events if not provided
      if (!existingEvents) {
        existingEvents = await Event.find({
          status: { $in: ['approved', 'pending'] }
        }).lean();
      }

      const duplicates = [];
      
      for (const existing of existingEvents) {
        const similarity = this.calculateEventSimilarity(newEvent, existing);
        
        if (similarity > this.duplicateThreshold) {
          duplicates.push({
            eventId: existing._id,
            title: existing.title,
            similarity,
            reasons: this.getDuplicateReasons(newEvent, existing, similarity)
          });
        }
      }

      return {
        isDuplicate: duplicates.length > 0,
        duplicates,
        highestSimilarity: duplicates.length > 0 ? Math.max(...duplicates.map(d => d.similarity)) : 0,
        riskLevel: this.getDuplicateRiskLevel(duplicates)
      };

    } catch (error) {
      console.error('Duplicate check error:', error);
      return { isDuplicate: false, duplicates: [], highestSimilarity: 0, riskLevel: 'low' };
    }
  }

  /**
   * Validate search results for safety
   */
  async validateResults(events) {
    const flaggedEvents = [];
    const warnings = [];

    for (const event of events) {
      // Check if event has existing flags
      if (event.aiFlags && event.aiFlags.riskScore > this.riskThresholds.medium) {
        flaggedEvents.push({
          eventId: event._id,
          title: event.title,
          reason: 'Previously flagged content',
          riskScore: event.aiFlags.riskScore
        });
      }

      // Check for suspicious patterns in results
      if (this.hasSuspiciousPatterns(event)) {
        warnings.push(`Event "${event.title}" may need review`);
      }
    }

    return {
      status: flaggedEvents.length > 0 ? 'flagged_content_detected' : 'safe',
      flaggedEvents,
      warnings,
      safeEventCount: events.length - flaggedEvents.length,
      totalEventCount: events.length
    };
  }

  /**
   * Check for spam content
   */
  async checkSpamContent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    let spamScore = 0;
    const detectedIndicators = [];

    // Check for spam indicators
    for (const indicator of this.spamIndicators) {
      if (text.includes(indicator.toLowerCase())) {
        spamScore += 0.2;
        detectedIndicators.push(indicator);
      }
    }

    // Check for excessive capitalization
    const capsRatio = (title.match(/[A-Z]/g) || []).length / title.length;
    if (capsRatio > 0.5) {
      spamScore += 0.3;
      detectedIndicators.push('excessive capitalization');
    }

    // Check for excessive punctuation
    const punctuationRatio = (text.match(/[!?]{2,}/g) || []).length;
    if (punctuationRatio > 2) {
      spamScore += 0.2;
      detectedIndicators.push('excessive punctuation');
    }

    // Check for repeated words
    const words = text.split(' ');
    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    const maxRepeats = Math.max(...Object.values(wordCounts));
    if (maxRepeats > 5) {
      spamScore += 0.3;
      detectedIndicators.push('excessive word repetition');
    }

    return {
      isSpam: spamScore > 0.5,
      score: Math.min(spamScore, 1.0),
      indicators: detectedIndicators,
      severity: this.getScoreSeverity(spamScore)
    };
  }

  /**
   * Check for inappropriate content
   */
  async checkInappropriateContent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    let inappropriateScore = 0;
    const detectedContent = [];

    // Check for inappropriate keywords
    for (const content of this.inappropriateContent) {
      if (text.includes(content.toLowerCase())) {
        inappropriateScore += 0.4;
        detectedContent.push(content);
      }
    }

    // Use AI for more sophisticated content analysis
    try {
      const aiModerationResult = await this.getAIModerationAnalysis(title, description);
      if (aiModerationResult.inappropriate) {
        inappropriateScore += aiModerationResult.score;
        detectedContent.push(...aiModerationResult.reasons);
      }
    } catch (error) {
      console.error('AI moderation failed:', error);
    }

    return {
      isInappropriate: inappropriateScore > 0.3,
      score: Math.min(inappropriateScore, 1.0),
      detectedContent,
      severity: this.getScoreSeverity(inappropriateScore)
    };
  }

  /**
   * Check for suspicious patterns
   */
  async checkSuspiciousPatterns(content) {
    let suspiciousScore = 0;
    const patterns = [];

    // Check for missing or minimal information
    if (!content.description || content.description.length < 50) {
      suspiciousScore += 0.3;
      patterns.push('minimal description');
    }

    // Check for suspicious location patterns
    if (content.location && (
      content.location.toLowerCase().includes('tbd') ||
      content.location.toLowerCase().includes('to be determined')
    )) {
      suspiciousScore += 0.2;
      patterns.push('vague location');
    }

    // Check for suspicious pricing
    if (content.price && content.price < 0) {
      suspiciousScore += 0.4;
      patterns.push('invalid pricing');
    }

    // Check for future date validity
    if (content.date && new Date(content.date) < new Date()) {
      suspiciousScore += 0.5;
      patterns.push('past date');
    }

    return {
      isSuspicious: suspiciousScore > 0.4,
      score: Math.min(suspiciousScore, 1.0),
      patterns,
      severity: this.getScoreSeverity(suspiciousScore)
    };
  }

  /**
   * Check if content appears to be AI-generated
   */
  async checkAIGenerated(title, description) {
    try {
      const prompt = `
        Analyze this event content and determine if it appears to be AI-generated:
        
        Title: ${title}
        Description: ${description}
        
        Look for signs like:
        - Generic, template-like language
        - Overly perfect grammar/structure
        - Lack of specific details
        - Repetitive phrasing
        
        Respond with JSON:
        {
          "isAIGenerated": boolean,
          "confidence": 0.0-1.0,
          "indicators": ["reason1", "reason2"]
        }
      `;

      const aiResponse = await geminiService.generateResponse(prompt);
      const analysis = JSON.parse(aiResponse);

      return {
        isAIGenerated: analysis.isAIGenerated,
        score: analysis.confidence,
        indicators: analysis.indicators || [],
        severity: this.getScoreSeverity(analysis.confidence)
      };

    } catch (error) {
      console.error('AI generation check failed:', error);
      return {
        isAIGenerated: false,
        score: 0,
        indicators: [],
        severity: 'low'
      };
    }
  }

  /**
   * Validate event details for completeness and accuracy
   */
  async validateEventDetails(content) {
    let validationScore = 0;
    const issues = [];

    // Required field validation
    if (!content.title || content.title.length < 5) {
      validationScore += 0.3;
      issues.push('title too short or missing');
    }

    if (!content.description || content.description.length < 20) {
      validationScore += 0.3;
      issues.push('description too short or missing');
    }

    if (!content.location) {
      validationScore += 0.2;
      issues.push('location missing');
    }

    if (!content.date) {
      validationScore += 0.4;
      issues.push('date missing');
    }

    // Date validation
    if (content.date) {
      const eventDate = new Date(content.date);
      const now = new Date();
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      if (eventDate < now) {
        validationScore += 0.5;
        issues.push('event date is in the past');
      } else if (eventDate > oneYearFromNow) {
        validationScore += 0.2;
        issues.push('event date is too far in the future');
      }
    }

    return {
      hasValidationIssues: validationScore > 0.2,
      score: Math.min(validationScore, 1.0),
      issues,
      severity: this.getScoreSeverity(validationScore)
    };
  }

  /**
   * Calculate event similarity for duplicate detection
   */
  calculateEventSimilarity(event1, event2) {
    let similarity = 0;
    let factors = 0;

    // Title similarity (weighted heavily)
    if (event1.title && event2.title) {
      const titleSim = this.calculateTextSimilarity(event1.title, event2.title);
      similarity += titleSim * 0.4;
      factors += 0.4;
    }

    // Description similarity
    if (event1.description && event2.description) {
      const descSim = this.calculateTextSimilarity(event1.description, event2.description);
      similarity += descSim * 0.3;
      factors += 0.3;
    }

    // Location similarity
    if (event1.location && event2.location) {
      const locSim = this.calculateTextSimilarity(event1.location, event2.location);
      similarity += locSim * 0.2;
      factors += 0.2;
    }

    // Date similarity (same day = high similarity)
    if (event1.date && event2.date) {
      const date1 = new Date(event1.date).toDateString();
      const date2 = new Date(event2.date).toDateString();
      const dateSim = date1 === date2 ? 1.0 : 0.0;
      similarity += dateSim * 0.1;
      factors += 0.1;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate text similarity using simple word overlap
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate overall risk score from individual checks
   */
  calculateRiskScore(checks) {
    const weights = [0.3, 0.3, 0.2, 0.1, 0.1]; // spam, inappropriate, suspicious, ai, validation
    
    let totalScore = 0;
    checks.forEach((check, index) => {
      totalScore += (check.score || 0) * weights[index];
    });

    return Math.min(totalScore, 1.0);
  }

  /**
   * Determine moderation action based on risk score
   */
  determineModerationAction(riskScore, checks) {
    const warnings = [];
    const recommendations = [];

    // Collect warnings from all checks
    checks.forEach(check => {
      if (check.indicators) warnings.push(...check.indicators);
      if (check.detectedContent) warnings.push(...check.detectedContent);
      if (check.patterns) warnings.push(...check.patterns);
      if (check.issues) warnings.push(...check.issues);
    });

    // Generate recommendations
    if (riskScore > this.riskThresholds.high) {
      recommendations.push('Manual review required before approval');
      recommendations.push('Consider contacting organizer for clarification');
    } else if (riskScore > this.riskThresholds.medium) {
      recommendations.push('Monitor event closely after approval');
      recommendations.push('Check organizer history and reputation');
    }

    // Determine status
    let status = 'safe';
    if (riskScore > this.riskThresholds.critical) status = 'rejected';
    else if (riskScore > this.riskThresholds.high) status = 'requires_review';
    else if (riskScore > this.riskThresholds.medium) status = 'flagged';

    return { status, warnings, recommendations };
  }

  /**
   * Get AI-powered moderation analysis
   */
  async getAIModerationAnalysis(title, description) {
    try {
      const prompt = `
        Analyze this event content for inappropriate or harmful content:
        
        Title: ${title}
        Description: ${description}
        
        Check for:
        - Hate speech or discrimination
        - Adult/explicit content
        - Illegal activities
        - Scams or fraud
        - Violence or harmful content
        
        Respond with JSON:
        {
          "inappropriate": boolean,
          "score": 0.0-1.0,
          "reasons": ["reason1", "reason2"]
        }
      `;

      const aiResponse = await geminiService.generateResponse(prompt);
      return JSON.parse(aiResponse);

    } catch (error) {
      console.error('AI moderation analysis failed:', error);
      return { inappropriate: false, score: 0, reasons: [] };
    }
  }

  /**
   * Helper methods
   */
  getScoreSeverity(score) {
    if (score >= this.riskThresholds.critical) return 'critical';
    if (score >= this.riskThresholds.high) return 'high';
    if (score >= this.riskThresholds.medium) return 'medium';
    if (score >= this.riskThresholds.low) return 'low';
    return 'minimal';
  }

  getDuplicateRiskLevel(duplicates) {
    if (duplicates.length === 0) return 'none';
    const maxSimilarity = Math.max(...duplicates.map(d => d.similarity));
    
    if (maxSimilarity > 0.95) return 'critical';
    if (maxSimilarity > 0.9) return 'high';
    if (maxSimilarity > 0.85) return 'medium';
    return 'low';
  }

  getDuplicateReasons(event1, event2, similarity) {
    const reasons = [];
    
    if (this.calculateTextSimilarity(event1.title, event2.title) > 0.8) {
      reasons.push('Very similar titles');
    }
    
    if (event1.location === event2.location) {
      reasons.push('Same location');
    }
    
    if (new Date(event1.date).toDateString() === new Date(event2.date).toDateString()) {
      reasons.push('Same date');
    }
    
    return reasons;
  }

  hasSuspiciousPatterns(event) {
    return (
      !event.description ||
      event.description.length < 30 ||
      (event.aiFlags && event.aiFlags.riskScore > this.riskThresholds.medium)
    );
  }

  getFailsafeModeration() {
    return {
      status: 'requires_review',
      riskScore: 0.5,
      isFlagged: true,
      requiresReview: true,
      autoReject: false,
      warnings: ['Moderation system error - manual review required'],
      recommendations: ['Review manually due to system error']
    };
  }
}

module.exports = SafetyModerationAgent;