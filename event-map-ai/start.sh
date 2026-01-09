#!/bin/bash

# Start backend server
echo "Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server..."
cd ../frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Display status
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Servers started!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5000"

# Wait for processes
wait $BACKEND_PID
wait $FRONTEND_PID