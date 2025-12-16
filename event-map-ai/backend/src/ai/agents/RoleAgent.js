/**
 * ROLE AWARENESS AGENT
 * Determines user role and adjusts behavior/permissions accordingly
 */

const User = require('../../models/User');

class RoleAgent {
  constructor() {
    this.roleCapabilities = {
      guest: {
        canCreateEvents: false,
        canModerate: false,
        canAnalyze: false,
        canViewAll: false,
        isAdmin: false,
        permissions: ['search', 'view_public', 'basic_recommend']
      },
      user: {
        canCreateEvents: false,
        canModerate: false,
        canAnalyze: false,
        canViewAll: false,
        isAdmin: false,
        permissions: ['search', 'attend', 'recommend', 'view_public']
      },
      organizer: {
        canCreateEvents: true,
        canModerate: false,
        canAnalyze: true,
        canViewAll: false,
        isAdmin: false,
        permissions: ['search', 'attend', 'recommend', 'create', 'manage_own', 'analytics', 'view_public']
      },
      admin: {
        canCreateEvents: true,
        canModerate: true,
        canAnalyze: true,
        canViewAll: true,
        isAdmin: true,
        permissions: ['all']
      }
    };

    this.roleGreetings = {
      guest: "Hi! I'm your AI Event Assistant. I can help you discover events and browse what's happening. For personalized recommendations and advanced features, consider creating an account!",
      user: "Hi! I'm your AI Event Assistant. I can help you discover amazing events and get personalized recommendations.",
      organizer: "Hello Event Organizer! I can help you find events, create compelling descriptions, and analyze your event performance.",
      admin: "Welcome Admin! I can assist with event moderation, platform analytics, and governance insights."
    };
  }

  async determineRole(userId, providedRole = null) {
    try {
      // Handle guest users (no userId provided)
      if (!userId) {
        return this.buildRoleContext('guest', null);
      }

      // If role is provided in request, validate it
      if (providedRole && providedRole === 'guest') {
        return this.buildRoleContext('guest', null);
      }

      if (providedRole) {
        const userFromDb = await User.findById(userId);
        if (userFromDb && userFromDb.role === providedRole) {
          return this.buildRoleContext(providedRole, userFromDb);
        }
      }

      // Fetch user from database to get actual role
      const user = await User.findById(userId);
      if (!user) {
        // Default to guest role for anonymous/unknown users
        return this.buildRoleContext('guest', null);
      }

      return this.buildRoleContext(user.role, user);

    } catch (error) {
      console.error('Error determining user role:', error);
      // Default to guest role on error
      return this.buildRoleContext('guest', null);
    }
  }

  buildRoleContext(role, userDoc) {
    const capabilities = this.roleCapabilities[role] || this.roleCapabilities.user;
    
    return {
      role,
      userId: userDoc?._id,
      userName: userDoc?.name,
      userEmail: userDoc?.email,
      ...capabilities,
      greeting: this.roleGreetings[role] || this.roleGreetings.user,
      contextualHelp: this.getContextualHelp(role),
      restrictions: this.getRoleRestrictions(role)
    };
  }

  getContextualHelp(role) {
    const helpTexts = {
      guest: [
        "Search for events by keyword or category",
        "Find events by location and date",
        "Browse popular and trending events",
        "Get basic event information and details"
      ],
      user: [
        "Ask me to find events near you",
        "Get personalized recommendations",
        "Learn about event details and timing",
        "Find events by category or date"
      ],
      organizer: [
        "Generate compelling event descriptions",
        "Get suggestions for event categories and tags",
        "Analyze your event performance",
        "Check for duplicate events",
        "Get tips to improve event visibility"
      ],
      admin: [
        "Review flagged events and content",
        "Get moderation insights and risk scores",
        "View platform analytics and trends",
        "Manage user reports and safety issues",
        "Monitor system health and performance"
      ]
    };

    return helpTexts[role] || helpTexts.guest;
  }

  getRoleRestrictions(role) {
    const restrictions = {
      guest: [
        "Cannot save favorite events (login required)",
        "Cannot create events (account required)",
        "Limited to basic search and browsing",
        "No personalized recommendations"
      ],
      user: [
        "Cannot create events (upgrade to organizer)",
        "Cannot access moderation tools",
        "Cannot view private analytics"
      ],
      organizer: [
        "Cannot moderate other users' content",
        "Cannot access admin-level analytics",
        "Cannot manage platform settings"
      ],
      admin: [
        "Full access - no restrictions"
      ]
    };

    return restrictions[role] || restrictions.guest;
  }

  /**
   * Check if user has permission for specific action
   */
  hasPermission(roleContext, action) {
    if (roleContext.permissions.includes('all')) return true;
    return roleContext.permissions.includes(action);
  }

  /**
   * Get role-specific response formatting
   */
  formatResponseForRole(roleContext, baseResponse) {
    const rolePrefix = {
      guest: "🔍 ",
      user: "🎉 ",
      organizer: "📊 ",
      admin: "🛡️ "
    };

    const prefix = rolePrefix[roleContext.role] || "";
    
    // Add role-specific context to responses
    if (roleContext.role === 'guest' && baseResponse.includes('event')) {
      baseResponse += "\n\n💡 *Tip: Create an account for personalized recommendations and to save favorites!*";
    } else if (roleContext.role === 'organizer' && baseResponse.includes('event')) {
      baseResponse += "\n\n💡 *Tip: I can help you create better event descriptions and analyze performance!*";
    } else if (roleContext.role === 'admin' && baseResponse.includes('flagged')) {
      baseResponse += "\n\n🔍 *Admin: Use 'review flagged events' to see moderation queue.*";
    }

    return prefix + baseResponse;
  }

  /**
   * Get role-appropriate error messages
   */
  getRoleErrorMessage(roleContext, errorType) {
    const errorMessages = {
      permission_denied: {
        guest: "This feature requires an account. Please log in or sign up to access advanced features.",
        user: "This feature requires organizer privileges. Would you like to upgrade your account?",
        organizer: "This action requires admin privileges.",
        admin: "An unexpected permission error occurred."
      },
      not_found: {
        guest: "I couldn't find what you're looking for. Try different search terms or browse our popular events.",
        user: "I couldn't find what you're looking for. Try a different search term.",
        organizer: "No events found matching your criteria. Consider broadening your search.",
        admin: "Resource not found. Check the ID and try again."
      },
      rate_limit: {
        guest: "You're browsing very quickly! Please wait a moment before trying again.",
        user: "You're asking questions very quickly! Please wait a moment before trying again.",
        organizer: "Rate limit reached. Please wait before making more requests.",
        admin: "Admin rate limit exceeded. Please wait before continuing."
      }
    };

    return errorMessages[errorType]?.[roleContext.role] || 
           "An error occurred. Please try again.";
  }

  /**
   * Determine if user can access specific event data
   */
  canAccessEvent(roleContext, event) {
    // Admins can access everything
    if (roleContext.isAdmin) return true;

    // Organizers can access their own events and public events
    if (roleContext.canCreateEvents) {
      return event.status === 'approved' || 
             event.organizer.toString() === roleContext.userId?.toString();
    }

    // Regular users can only access approved public events
    return event.status === 'approved';
  }

  /**
   * Get role-specific data filtering
   */
  getDataFilter(roleContext) {
    if (roleContext.isAdmin) {
      // Admins see everything
      return {};
    } else if (roleContext.canCreateEvents) {
      // Organizers see approved events + their own
      return {
        $or: [
          { status: 'approved' },
          { organizer: roleContext.userId }
        ]
      };
    } else {
      // Regular users only see approved events
      return { status: 'approved' };
    }
  }
}

module.exports = RoleAgent;