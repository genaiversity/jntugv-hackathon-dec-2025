# EventMap - Real-Time Event Discovery Platform

A location-based event discovery platform with AI-powered features for deduplication, classification, moderation, and auto-summaries. Similar to Google Maps but focused on events.

## ✨ Key Features Implemented

### 🗺️ Real-Time Location Detection

- Automatic detection of user's current location (with permission)
- Shows events within a 10km radius
- Visualizes user's location on the map
- Interactive map click for event creation

### 🎯 Event Discovery & Management

- Interactive map with event markers using Leaflet and OpenStreetMap
- Detailed event information with reviews and ratings
- Event creation for organizers with map coordinate selection
- Event attendance tracking
- Google Maps integration for directions

### 🔐 Role-Based Authentication System

- **Users**: Browse, attend events, and review events
- **Organizers**: Create and manage events
- **Admins**: Moderate and approve events
- JWT-based secure authentication

### 🤖 AI-Powered Services

- **Duplicate Detection**: Prevents duplicate events using advanced similarity algorithms
- **Event Classification**: Auto-categorizes events with confidence scoring
- **Content Moderation**: Checks for NSFW, spam, and abusive content with severity levels
- **Auto Summarization**: Generates event summaries, highlights, and tags

### 📋 Event Lifecycle Management

- Event submission workflow with approval process
- Pending/Approved/Rejected event statuses
- Organizer dashboard for managing events
- Admin panel for moderation and approvals

### ⭐ Review & Rating System

- Star ratings (1-5 stars)
- Written reviews
- Average rating display
- Community review aggregation

## 🏗️ Tech Stack

### Frontend

- **React** - JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Leaflet** - Interactive maps
- **React Router** - Declarative routing
- **CSS Modules** - Scoped styling

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **MongoDB** - NoSQL database with geospatial indexing
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt.js** - Password hashing

### AI & ML Services

- **Gemini API** - Advanced AI capabilities for natural language processing
- **ChromaDB** - Vector database for similarity search and RAG implementation
- **Custom ML Models** - For event classification, moderation, and duplicate detection
- **Embedding Services** - For semantic similarity and vector representations

## 📁 Project Structure

```
event-map-ai/
├── backend/
│   ├── src/
│   │   ├── ai/                 # AI services (duplicate detection, classification, etc.)
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Authentication and authorization
│   │   ├── models/             # Database models
│   │   ├── routes/             # API routes
│   │   ├── utils/              # Utility scripts
│   │   └── server.js           # Main server file
│   ├── .env                    # Environment variables
│   └── package.json            # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                # API service layer
│   │   ├── components/         # React components
│   │   ├── context/            # React context providers
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   └── package.json            # Frontend dependencies
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance) - Optional for basic functionality

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd event-map-ai
   ```

2. **Install backend dependencies:**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables:**
   Create a `.env` file in the `backend` directory:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/eventmap
   JWT_SECRET=your_jwt_secret_key
   ```

### Running the Application

1. **Start the backend server:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Alternative: Use the PowerShell script (Windows only):**

   ```powershell
   ./start.ps1
   ```

4. **Seed initial data (optional):**

   ```bash
   cd backend
   npm run seed
   ```

5. **Test AI services:**
   ```bash
   cd backend
   npm run test-ai
   ```

### Access the Application

- **Frontend:** http://localhost:5174
- **Backend API:** http://localhost:5001

## 🛠️ API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Events

- `GET /api/events` - Get events (with location filtering)
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event (organizer/admin only)
- `PUT /api/events/:id` - Update event (organizer/admin only)
- `DELETE /api/events/:id` - Delete event (organizer/admin only)
- `POST /api/events/:id/attend` - Attend/cancel attendance
- `GET /api/events/my/events` - Get events organized by user
- `GET /api/events/attending` - Get events user is attending

### Reviews

- `GET /api/reviews/event/:eventId` - Get reviews for an event
- `POST /api/reviews/event/:eventId` - Create review (authenticated users)
- `GET /api/reviews/event/:eventId/user` - Get user's review for event
- `PUT /api/reviews/:reviewId` - Update review (owner only)
- `DELETE /api/reviews/:reviewId` - Delete review (owner or admin)

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password
- `POST /api/users/register-organizer` - Register as organizer

### Admin

- `GET /api/admin/pending-events` - Get pending events
- `POST /api/admin/review-event` - Approve/reject event
- `GET /api/admin/flagged-events` - Get AI-flagged events
- `GET /api/admin/duplicate-events` - Get potential duplicates
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/update-user-role` - Update user role

### AI Assistant & Agents

- `POST /api/chat/message` - Send message to AI assistant
- `POST /api/chat/stream` - Stream response from AI assistant
- `GET /api/agents/search` - Search events using agent workflows
- `POST /api/agents/duplicates` - Check for duplicate events
- `POST /api/agents/moderate` - Moderate event content
- `GET /api/agents/recommendations` - Get event recommendations
- `POST /api/agents/approve/:eventId` - Approve/reject events (admin only)

## 🎯 User Roles & Permissions

### Regular User

- View approved events
- Attend/cancel attendance
- Write reviews and ratings
- View own profile

### Event Organizer

- All user permissions
- Create events with interactive map click
- Edit/delete own events
- View event attendance

### Administrator

- All organizer permissions
- Approve/reject events
- Moderate content
- Manage user roles
- View all events and users

## 🤖 AI Services Deep Dive

### Duplicate Detection

Prevents duplicate events by analyzing:

- Text similarity (title and description) using multiple algorithms
- Geospatial proximity (within configurable distances)
- Temporal closeness (within time windows)
- Semantic similarity using embedding vectors
- Weighted scoring system for accurate detection
- Auto-rejection of high-similarity duplicates

### Event Classification

Automatically categorizes events into:

- Music, Sports, Workshop, Exhibition
- College Fest, Religious, Promotion, Other
- Confidence scoring for classification quality
- Title-weighted analysis for better accuracy
- Powered by Gemini API for advanced NLP

### Content Moderation

Comprehensive content checking for:

- NSFW content with severity levels
- Abusive/hateful language detection
- Spam/marketing content identification
- Fake event detection
- Formatting analysis (excessive caps, exclamation marks)
- Risk scoring with detailed warnings
- Powered by Gemini API for contextual understanding

### Auto Summarization

Generates comprehensive event metadata:

- Short titles (max 5 words)
- Concise summaries (max 20 words)
- Key highlight extraction
- Relevant tag generation
- Metadata including compression ratios
- Powered by Gemini API for natural language understanding

### RAG-Powered Search

Enables intelligent event discovery:

- Natural language queries processed through embedding service
- Similarity search using ChromaDB vector database
- Context injection into LLM prompts
- Grounded responses based on real event data

### Agent Workflows

Implements specialized AI agents for:

- Event search and ranking with geospatial awareness
- Content moderation with contextual understanding
- Duplicate detection with semantic similarity
- Event recommendations based on user preferences

## 📱 Frontend Components

### MapView

- Main map interface with geolocation
- Event markers with popups
- 10km radius visualization
- User location detection

### EventDetails

- Detailed event information
- Attendance functionality
- Google Maps directions
- Review and rating system
- Community reviews display

### UserProfile

- User information
- Organized events
- Attending events
- Account settings

### CreateEvent

- Event creation form
- Interactive map click for location selection
- Coordinate auto-fill
- Date/time selection

### Authentication

- Login and registration forms
- Role-based registration
- JWT token management

## 🛠️ Data Migration Utilities

To ensure data integrity and fix any inconsistencies in the database, we've added migration utilities:

### Fix Missing Coordinates

Fixes events that are missing the required `locationCoords` field:

```bash
cd backend
npm run fix-coordinates
```

### Comprehensive Data Migration

Runs all data integrity checks and fixes:

```bash
cd backend
npm run migrate
```

This utility checks for and fixes:

- Missing or invalid location coordinates
- Invalid date formats
- Missing event categories

### Insert Sample Events

Inserts sample events into the database for testing:

```bash
cd backend
npm run insert-sample
```

### Insert Local Events

Inserts events near a specific location (18.151677, 83.373504) within a 10km radius with different categories:

```bash
cd backend
npm run insert-local
```

## 🧪 Testing AI Services

Run the AI services test suite:

```bash
cd backend
npm run test-ai
```

This will test all AI services with sample data and show detailed results.

## 🚢 Deployment

### Frontend

Build for production:

```bash
cd frontend
npm run build
```

### Backend

Start in production mode:

```bash
cd backend
npm start
```

## 📈 Future Enhancements

1. **Real-time Updates**: WebSocket integration for live event updates
2. **Image Upload**: Cloud storage for event images
3. **Advanced Search**: Elasticsearch integration
4. **Notifications**: Email/SMS notifications
5. **Social Features**: Event sharing and social login
6. **Mobile App**: React Native mobile application
7. **Analytics**: Event analytics dashboard
8. **Multi-Agent Orchestration**: Advanced agent collaboration using MCP
9. **Improved Personalization**: User preference learning and recommendation engines
10. **Multimodal AI**: Image and text processing for richer event descriptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 🙏 Acknowledgments

- Leaflet for interactive maps
- OpenStreetMap for map tiles
- Google Maps for directions API
- MongoDB for database
