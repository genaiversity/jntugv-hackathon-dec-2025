import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Path to jobs.json file
const JOBS_FILE = path.join(__dirname, "../data/jobs.json");

/**
 * POST /api/jobs
 * Save a job to jobs.json
 */
app.post("/api/jobs", (req, res) => {
  try {
    const { title, description, company, location, salary, jobType } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Job title is required" });
    }
    if (!description || !description.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Job description is required" });
    }

    // Read existing jobs
    let existingJobs = [];
    if (fs.existsSync(JOBS_FILE)) {
      const fileContent = fs.readFileSync(JOBS_FILE, "utf-8");
      existingJobs = fileContent.trim() ? JSON.parse(fileContent) : [];
    }

    // Create new job
    const newJob = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      company: company || "",
      location: location || "",
      salary: salary || "",
      jobType: jobType || "Full-time",
      postedAt: new Date().toISOString(),
    };

    // Add and save
    existingJobs.push(newJob);
    fs.writeFileSync(JOBS_FILE, JSON.stringify(existingJobs, null, 2));

    res
      .status(201)
      .json({ success: true, message: "Job saved successfully", job: newJob });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/jobs
 * Get all jobs
 */
app.get("/api/jobs", (req, res) => {
  try {
    let jobs = [];
    if (fs.existsSync(JOBS_FILE)) {
      const fileContent = fs.readFileSync(JOBS_FILE, "utf-8");
      jobs = fileContent.trim() ? JSON.parse(fileContent) : [];
    }
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Job API running on http://localhost:${PORT}`);
  console.log(`Jobs saved to: ${JOBS_FILE}`);
});
