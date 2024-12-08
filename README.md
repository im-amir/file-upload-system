# CSV File Upload System

A full-stack application for uploading and managing CSV files with progress tracking and resume capability, built with Next.js and FastAPI.

## Tech Stack

- **Frontend**: Next.js
- **Backend**: FastAPI (Python)
- **Containerization**: Docker Compose

## Features

- Drag and drop CSV file uploads
- Upload progress tracking
- File validation
- Resume interrupted uploads
- File preview and download
- Responsive UI with Material-UI

## Prerequisites

- Docker
- Docker Compose
- Git

## Quick Start

### Installation

```bash
git clone https://github.com/yourusername/file-upload-system.git
cd file-upload-system
docker-compose up --build
```

This command will:

- Build the frontend and backend containers
- Make the application accessible at http://localhost:3000

### Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs (Swagger UI)

## Development

- The application uses hot reloading for both frontend and backend
- Frontend changes will automatically reflect in the browser
- Backend changes will restart the FastAPI server
- Stopping the Application
- To stop the running containers:
