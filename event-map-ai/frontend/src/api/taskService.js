const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

class TaskService {
  async getTasks(params = {}) {
    try {
      // Fetch tasks from the backend API
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/tasks${
        queryParams ? `?${queryParams}` : ""
      }`;

      console.log("TaskService: Making request to:", url);
      const response = await fetch(url);
      console.log(
        "TaskService: Received response:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch tasks: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("TaskService: Parsed", data.length, "tasks from response");
      return data;
    } catch (error) {
      console.error("TaskService: Error fetching tasks:", error);
      // Throw error instead of returning static tasks
      throw error;
    }
  }
}

export default new TaskService();
