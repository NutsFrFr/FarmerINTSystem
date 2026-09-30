import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from pymongo.errors import PyMongoError

load_dotenv()
load_dotenv(".env.local")

mongo_uri = os.getenv("MONGO_URI") or "mongodb://localhost:27017"

client = None
users_collection = None
memory_users = {}

try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
    client.admin.command("ping")
    db = client["loginpass"]
    users_collection = db["users"]
except Exception:
    client = None
    users_collection = None

app = FastAPI()


@app.middleware("http")
async def log_request_path(request: Request, call_next):
    print(
        f"REQUEST_PATH={request.scope.get('path')}",
        flush=True
    )

    response = await call_next(request)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5500",
        "http://localhost:5501",
        "https://farmer-int-system.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    username: str
    password: str


def _find_user(username: str):
    if users_collection is not None:
        return users_collection.find_one({"username": username})
    return memory_users.get(username)


def _save_user(username: str, password: str):
    if users_collection is not None:
        users_collection.insert_one({
            "username": username,
            "password": password,
        })
        return

    memory_users[username] = {
        "username": username,
        "password": password,
    }


@app.get("/api/")
def root():
    if client is not None:
        try:
            client.admin.command("ping")
            return {"message": "Backend is working", "database": "mongodb"}
        except PyMongoError as error:
            raise HTTPException(status_code=503, detail=str(error))

    return {"message": "Backend is working", "database": "memory"}


@app.post("/register")
@app.post("/api/register")
def register(user: RegisterRequest):
    if _find_user(user.username):
        raise HTTPException(status_code=400, detail="Username already exists")

    _save_user(user.username, user.password)

    return {"message": "User registered successfully"}


@app.post("/login")
@app.post("/api/login")
def login(user: RegisterRequest):
    existing_user = _find_user(user.username)

    if not existing_user or existing_user["password"] != user.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful"}