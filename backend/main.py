from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from database import supabase_admin
from auth import get_current_user_id

app = FastAPI(
    title="Marginku API",
    description="AI Price-Tag Margin Alert — warung kelontong Indonesia",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
def root():
    return {"app": "Marginku", "docs": "/docs", "status": "running"}
