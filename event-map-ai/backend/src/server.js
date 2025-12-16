const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"))); // Serve uploaded files
require("./config/passport");

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/agents", require("./routes/agents"));
app.use("/api/ai", require("./routes/aiChat"));
app.use("/api/ai-assistant", require("./routes/aiAssistant"));
app.use("/api/multimodal", require("./routes/multimodal"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "EventMap API is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Initialize AI services
const retrievalService = require("./ai/retrievalService");
const agentWorkflows = require("./ai/agentWorkflows");

// Connect to MongoDB - required for application to function
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/eventmap")
  .then(async () => {
    console.log("✅ Connected to MongoDB successfully");

    // Initialize retrieval service
    await retrievalService.initialize();

    // Start server only after successful database connection
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API Endpoint: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error("❌ Critical Error: Unable to connect to MongoDB");
    console.error("📝 Error details:", err);
    console.error(
      "🔧 Please check your MongoDB connection string in .env file"
    );
    console.error("🛑 Application will not start without database connection");

    // Exit the process since database is required
    process.exit(1);
  });
