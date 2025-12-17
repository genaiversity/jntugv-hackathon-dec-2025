# Job Posting Feature - Setup Guide

## Overview

This setup allows users to post jobs through the React frontend, which are stored in `/data/jobs.json` and can be used by the RAG system for curriculum analysis.

## Components Created

### 1. Frontend Component: `JobForm.jsx`

Location: `TEAM-40/Frontend/src/components/JobForm.jsx`

**Features:**

- Form to submit job details (title, company, location, salary, job type, description)
- Form validation (title and description required)
- Success/error message handling
- Loading states
- Clean, responsive UI with Tailwind CSS
- Icons from lucide-react

**Form Fields:**

- Job Title (required)
- Company Name
- Location
- Salary Range
- Job Type (dropdown: Full-time, Part-time, Contract, Freelance, Internship)
- Job Description (required, textarea)

### 2. Backend Server: `job-server.js`

Location: `TEAM-40/back/job-server.js`

**API Endpoints:**

```
GET  /api/jobs        - Retrieve all jobs
POST /api/jobs        - Add a new job
DELETE /api/jobs/:id  - Delete a job by ID
GET  /health          - Health check
```

**Automatic Features:**

- Creates `/data/jobs.json` if it doesn't exist
- Stores jobs with metadata (ID, timestamp, source)
- CORS enabled for frontend communication

## Installation & Setup

### Step 1: Install Backend Dependencies

```bash
cd TEAM-40/back
npm install express cors
```

Or if you want to use the prepared package.json:

```bash
# Rename or copy
cp job-package.json package.json
npm install
```

### Step 2: Start the Backend Server

```bash
# From TEAM-40/back directory
npm start
# or for development with auto-reload:
npm run dev
```

Server will run on `http://localhost:5000`

### Step 3: Update Frontend App Routes

Option A: Display JobForm Component

```jsx
// In TEAM-40/Frontend/src/App.jsx
import "./App.css";
import JobForm from "./components/JobForm";

function App() {
  return <JobForm />;
}

export default App;
```

Option B: Create Navigation Between Course and JobForm

```jsx
// In TEAM-40/Frontend/src/App.jsx
import { useState } from "react";
import "./App.css";
import Course from "./components/course";
import JobForm from "./components/JobForm";

function App() {
  const [page, setPage] = useState("course"); // 'course' or 'jobs'

  return (
    <div>
      <nav className="bg-gray-100 p-4 flex gap-4">
        <button
          onClick={() => setPage("course")}
          className={page === "course" ? "font-bold" : ""}
        >
          Courses
        </button>
        <button
          onClick={() => setPage("jobs")}
          className={page === "jobs" ? "font-bold" : ""}
        >
          Post Job
        </button>
      </nav>
      {page === "course" && <Course />}
      {page === "jobs" && <JobForm />}
    </div>
  );
}

export default App;
```

### Step 4: Start Frontend Dev Server

```bash
cd TEAM-40/Frontend
npm run dev
```

## Usage

1. **Open the Job Form**: Navigate to the JobForm page in your frontend
2. **Fill in Job Details**: Complete the form with job information
3. **Click "Post Job"**: Submit the form
4. **Success**: Job is saved to `/data/jobs.json` and a success message appears
5. **Check Data**: Jobs are instantly available at `/data/jobs.json`

## Data Structure

Each job posted will have this structure in `jobs.json`:

```json
{
  "id": 1702486400000,
  "title": "Senior React Developer",
  "description": "We are looking for...",
  "company": "TechCorp Inc",
  "location": "San Francisco, CA",
  "salary": "$120k - $150k",
  "jobType": "Full-time",
  "postedAt": "2025-12-13T10:00:00.000Z",
  "source": "Posted via TEAM-40 Job Portal"
}
```

## Integration with RAG System

The jobs stored in `/data/jobs.json` can be used by:

1. **Job Cleaner** - `RAG_System/data_ingestion/job_cleaner.py` processes these jobs
2. **Skill Extractor** - `RAG_System/skill_engine/skill_extractor.py` extracts skills from descriptions
3. **Curriculum Analysis** - `RAG_System/reasoning/gap_analysis.py` analyzes curriculum gaps based on job trends

Run the RAG pipeline:

```bash
cd TEAM-40/RAG_System
python main.py
```

## Environment Variables

Ensure your `.env` file in RAG_System has:

```
SERPER_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

## Troubleshooting

**Error: Cannot connect to server**

- Ensure backend is running on port 5000
- Check CORS headers are correct
- Verify firewall isn't blocking port 5000

**Error: jobs.json not found**

- Backend will auto-create it on first POST request
- Ensure `/data` directory exists in TEAM-40 root

**Jobs not appearing in RAG system**

- Run `npm start` in backend to restart server
- Clear and re-run the RAG pipeline: `python main.py`
- Check `/data/jobs.json` is being populated

## Next Steps

1. Add job editing (PUT endpoint)
2. Add job search/filtering
3. Add authentication for job posting
4. Add email notifications
5. Create a jobs list display component
