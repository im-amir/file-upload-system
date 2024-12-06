from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import file_routes

app = FastAPI(title="File Upload API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(file_routes.router, prefix="/api")
