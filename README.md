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
```
create .env file in the root
```bash
AWS_ACCESS_KEY_ID=######
AWS_SECRET_ACCESS_KEY=######
AWS_BUCKET_NAME=######
AWS_REGION=######

```

```
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


## Testing

To run the cypress tests, you have to 
```bash
cd frontend
npx cypress open
```
Make sure you are running the project while performing these tests.
