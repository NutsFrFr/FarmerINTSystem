import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from pymongo.errors import PyMongoError

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    raise RuntimeError("MONGO_URI is not set in the .env file")

client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
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
    allow_origins=["http://127.0.0.1:5501"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

db = client["loginpass"]
users_collection = db["users"]


class RegisterRequest(BaseModel):
    username: str
    password: str


@app.get("/api/")
def root():
    try:
        client.admin.command("ping")
    except PyMongoError as error:
        raise HTTPException(status_code=503, detail=str(error))

    return {"message": "Backend is working"}


@app.post("/register")
@app.post("/api/register")
def register(user: RegisterRequest):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")

    users_collection.insert_one({
        "username": user.username,
        "password": user.password,
    })

    return {"message": "User registered successfully"}


@app.post("/login")
@app.post("/api/login")
def login(user: RegisterRequest):
    existing_user = users_collection.find_one({"username": user.username})

    if not existing_user or existing_user["password"] != user.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful"}