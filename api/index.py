import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from backend.auth import router as auth_router

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "https://backsr-o2lumthh7-null-pointers18.vercel.app")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://farmer-int-system-1wpmd6w52-null-pointers18.vercel.app")
DB_NAME = os.getenv("DB_NAME", "farmer_int_db")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
async def root():
    return {
        "message": "Backend is running!",
        "backend_url": BACKEND_URL,
        "frontend_url": FRONTEND_URL,
        "database": DB_NAME,
    }

handler = Mangum(app)