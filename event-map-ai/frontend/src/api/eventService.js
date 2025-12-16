const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

class EventService {
  async getEvents(params = {}) {
    try {
      console.log("EventService: Fetching events with params:", params);
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/events${
        queryParams ? `?${queryParams}` : ""
      }`;

      console.log("EventService: Making request to:", url);
      const response = await fetch(url);
      console.log(
        "EventService: Received response:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch events: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("EventService: Parsed", data.length, "events from response");
      return data;
    } catch (error) {
      console.error("EventService: Error fetching events:", error);
      // Throw error instead of returning static events
      throw error;
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

  // Method to get both events and tasks
  async getEventsAndTasks(params = {}) {
    try {
      // Get events
      const events = await this.getEvents(params);

      // Get tasks from task service
      const taskService = require("./taskService");
      const tasks = await taskService.getTasks(params);

      return { events, tasks };
    } catch (error) {
      console.error("Error fetching events and tasks:", error);
      // Throw error instead of returning static data
      throw error;
    }
  }
}

export default new EventService();
