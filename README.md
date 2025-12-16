---
# AI-Powered Event Viewer Web Application (MVP)

The **AI-Powered Event Viewer Web Application** is a web-based platform that helps users discover, explore, and participate in events using an interactive map and AI-driven search.
It combines **geospatial visualization**, **Machine Learning**, and **Generative AI** to make event discovery faster, smarter, and more intuitive for users, organizers, and administrators.

This project represents a **Minimum Viable Product (MVP)** built for real-world usability .
---

## Problem Statement

Event information is often scattered across multiple platforms and presented in unstructured formats. Users find it difficult to discover nearby or relevant events, while event organizers struggle with categorization, visibility, and management. Traditional event platforms lack intelligent search, personalization, and automation.

---

## Solution Overview

This project solves the problem by introducing:

- A map-based event discovery system
- An AI Event Assistant for conversational search using RAG
- Machine Learning for automatic event classification
- RAG (Retrieval-Augmented Generation) to answer queries using real event data
- Agent-based workflows for recommendations and moderation
- Integration with Gemini API for advanced AI capabilities
- ChromaDB vector database for efficient similarity search

Together, these features create an intelligent and scalable event management platform.

---

## Why This Matters

- Users easily find events relevant to their location and interests
- Organizers save time using AI-assisted event creation and management
- Admins benefit from automated moderation and oversight
- Communities experience better engagement and participation

The system improves productivity and accessibility using AI.

---

## Core MVP Features

App User

- View events on an interactive map
- View event details
- Login and logout
- RSVP to events
- Ask questions using the AI assistant

Event Organizer

- Create, update, and delete events
- Assign event locations on the map
- Get AI assistance for event descriptions

Admin

- Approve or reject events
- Manage users and events
- Moderate AI-flagged content

---

## Tech Stack

Frontend

- React
- JavaScript
- Leaflet API for interactive maps
- Vite for fast development

Backend

- Node.js (Express)
- MongoDB with Mongoose for data storage
- MongoDB geospatial indexing for location-based queries

AI and Machine Learning

- Gemini API for advanced AI capabilities
- ChromaDB (vector database) for RAG implementation
- Custom ML models for classification, moderation, and duplicate detection
- Embedding services for semantic similarity

Authentication

- JWT-based authentication
- Role-based access control (RBAC)

---

## Architecture / Design

1. User accesses the web application
2. Events are fetched from the backend and displayed on the map
3. User queries the AI assistant
4. Query is processed through embedding service
5. Query embeddings are matched in ChromaDB for relevant event retrieval
6. Retrieved event data is injected into the LLM prompt (RAG)
7. Gemini API generates contextual response
8. Agents handle search, ranking, duplicate detection, and moderation tasks
9. AI response is returned to the user

---

## Assumptions

- Users have internet access during usage
- Event organizers provide accurate event information
- API keys for external LLMs are provided by the user
- Local LLMs are pre-downloaded if used
- MVP focuses on functionality rather than large-scale optimization

---

## Installation Instructions

Clone the repository

```bash
git clone https://github.com/Lokesh-Madiri/TEAM-124-NODE.git
cd TEAM-124-NODE
```

Backend setup

```bash
cd event-map-ai/backend
npm install
```

Frontend setup

```bash
cd ../frontend
npm install
```

Environment Configuration

Create a `.env` file in the `backend` directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventmap
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
CHROMA_DB_URL=http://localhost:8000
```

---

## Usage Examples

- Open the application in a browser
- View nearby events on the map
- Click on an event marker to see details
- Login to RSVP for events
- Ask the AI assistant questions like:
  "What events are happening near me this weekend?"

---

## Configuration Details

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventmap
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
CHROMA_DB_URL=http://localhost:8000
```

For the ChromaDB vector database, you can either:
1. Run it locally with Docker: `docker run -p 8000:8000 chromadb/chroma`
2. Use a hosted ChromaDB instance

For the Gemini API, you'll need to obtain an API key from Google AI Studio.

---

## Limitations and Future Scope

Limitations

- Basic personalization in MVP
- Limited ML model accuracy
- Dependence on external APIs or local hardware
- No real-time event updates

Future Scope

- Advanced event recommendations
- Multi-agent orchestration using MCP
- Real-time notifications
- Event reviews and ratings
- Improved guardrails and evaluations
- Viirtual and hybrid event support

---
