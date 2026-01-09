const API_BASE_URL = "http://localhost:5001/api";

class TaskService {
  async getTasks(params = {}) {
    try {
      // In a real implementation, this would fetch from the backend
      // For now, we'll return static tasks
      return this.getStaticTasks();
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return this.getStaticTasks();
    }
  }

  // Static tasks for demonstration
  getStaticTasks() {
    return [
      {
        _id: "task1",
        title: "Team Meeting",
        description:
          "Weekly team sync to discuss project progress and blockers.",
        location: "Conference Room A",
        latitude: 51.507,
        longitude: -0.128,
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
        latitude: 51.5065,
        longitude: -0.1275,
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
        latitude: 51.508,
        longitude: -0.129,
        date: new Date(Date.now() + 172800000).toISOString(), // In 2 days
        category: "Business",
        attendees: 8,
        priority: "high",
        status: "pending",
      },
      {
        _id: "task4",
        title: "Documentation Update",
        description: "Update API documentation for the latest endpoints.",
        location: "Remote",
        latitude: 51.505,
        longitude: -0.126,
        date: new Date(Date.now() + 259200000).toISOString(), // In 3 days
        category: "Documentation",
        attendees: 1,
        priority: "low",
        status: "pending",
      },
    ];
  }
}

export default new TaskService();
