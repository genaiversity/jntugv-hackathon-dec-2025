const API_BASE_URL = "http://localhost:5000/api";

class EventService {
  async getEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/events${
        queryParams ? `?${queryParams}` : ""
      }`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching events:", error);
      // Return static events when backend is unavailable
      return this.getStaticEvents();
    }
  }

  async getEventById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch event");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching event:", error);
      throw error;
    }
  }

  async createEvent(formData, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }

  async attendEvent(eventId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/attend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update attendance");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw error;
    }
  }

  async generateDescription(data, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate description");
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating description:", error);
      throw error;
    }
  }

  // Static events for demonstration when backend is unavailable
  getStaticEvents() {
    return [
      {
        _id: "1",
        title: "Tech Conference 2025",
        description:
          "Annual technology conference featuring the latest innovations and networking opportunities.",
        location: "Convention Center, Downtown",
        latitude: 51.5074,
        longitude: -0.1278,
        date: new Date().toISOString(),
        category: "Technology",
        attendees: 150,
      },
      {
        _id: "2",
        title: "Music Festival",
        description:
          "Three-day music festival with local and international artists.",
        location: "Central Park",
        latitude: 51.5034,
        longitude: -0.1195,
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        category: "Music",
        attendees: 850,
      },
      {
        _id: "3",
        title: "Art Workshop",
        description:
          "Hands-on workshop for beginners to learn watercolor painting techniques.",
        location: "Community Arts Center",
        latitude: 51.5136,
        longitude: -0.1278,
        date: new Date(Date.now() + 172800000).toISOString(), // In 2 days
        category: "Workshop",
        attendees: 25,
      },
    ];
  }

  // Method to get both events and tasks
  async getEventsAndTasks(params = {}) {
    try {
      // Get events
      const events = await this.getEvents(params);

      // Get tasks positioned near user
      const tasks = this.getStaticTasksNearUser(
        params.latitude,
        params.longitude
      );

      return { events, tasks };
    } catch (error) {
      console.error("Error fetching events and tasks:", error);
      return {
        events: this.getStaticEvents(),
        tasks: this.getStaticTasksNearUser(params.latitude, params.longitude),
      };
    }
  }

  // Generate static tasks positioned near the user's location
  getStaticTasksNearUser(userLat, userLon) {
    // If no user location provided, use default London coordinates
    const lat = userLat || 51.5074;
    const lon = userLon || -0.1278;

    // Generate tasks within a small radius of the user's location
    return [
      {
        _id: "task1",
        title: "Team Meeting",
        description:
          "Weekly team sync to discuss project progress and blockers.",
        location: "Conference Room A",
        latitude: lat + (Math.random() - 0.5) * 0.01, // Small offset from user location
        longitude: lon + (Math.random() - 0.5) * 0.01,
        date: new Date(Date.now() + 3600000).toISOString(), // In 1 hour
        category: "Meeting",
        attendees: 5,
        priority: "high",
        status: "pending",
      },
      {
        _id: "task2",
        title: "Code Review",
        description: "Review pull requests for the new feature implementation.",
        location: "Engineering Department",
        latitude: lat + (Math.random() - 0.5) * 0.01,
        longitude: lon + (Math.random() - 0.5) * 0.01,
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        category: "Development",
        attendees: 2,
        priority: "medium",
        status: "pending",
      },
      {
        _id: "task3",
        title: "Client Presentation",
        description:
          "Present Q4 results and roadmap to key client stakeholders.",
        location: "Executive Boardroom",
        latitude: lat + (Math.random() - 0.5) * 0.01,
        longitude: lon + (Math.random() - 0.5) * 0.01,
        date: new Date(Date.now() + 172800000).toISOString(), // In 2 days
        category: "Business",
        attendees: 8,
        priority: "high",
        status: "pending",
      },
    ];
  }
}

export default new EventService();
