import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv(
    "MONGO_URI"
)
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is required")
DB_NAME = os.getenv("DB_NAME", "farmer_int_db")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
users = db.users
