from fastapi import FastAPI, APIRouter, HTTPException, Header, Query, UploadFile, File, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
ADMIN_PASSCODE = os.environ.get('ADMIN_PASSCODE', 'jry2026')

# ------------------- Object storage -------------------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "madebyjry"
MIME_TYPES = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}
_storage_key = None


def init_storage():
    global _storage_key
    if _storage_key:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


app = FastAPI()
api_router = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ------------------- Models -------------------
class WorkItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # thumbnail | short | longform | design
    title: str
    subtitle: Optional[str] = ""
    image_url: str = ""
    youtube_url: Optional[str] = ""
    link: Optional[str] = ""
    order: int = 0
    created_at: str = Field(default_factory=now_iso)


class WorkCreate(BaseModel):
    category: str
    title: str
    subtitle: Optional[str] = ""
    image_url: str = ""
    youtube_url: Optional[str] = ""
    link: Optional[str] = ""
    order: int = 0


class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    followers: str
    logo_url: str
    link: Optional[str] = ""
    order: int = 0
    created_at: str = Field(default_factory=now_iso)


class ClientCreate(BaseModel):
    name: str
    followers: str
    logo_url: str
    link: Optional[str] = ""
    order: int = 0


class PasscodeInput(BaseModel):
    passcode: str


class SettingsInput(BaseModel):
    values: dict


DEFAULT_SETTINGS = {
    "desktop_quote": "IMAGINE THINKING YOU'RE NOT DOING IT RIGHT JUST BECAUSE PEOPLE SAID SO",
    "network_title": "THE NETWORK",
    "network_subtitle": "creators & brands i've leveled up",
    "contact_kicker": "LET'S_WORK.BAT",
    "contact_title": "READY TO ELEVATE YOUR CONTENT?",
}


def require_admin(passcode: Optional[str]):
    if passcode != ADMIN_PASSCODE:
        raise HTTPException(status_code=401, detail="Invalid passcode")


# ------------------- Routes -------------------
@api_router.get("/")
async def root():
    return {"message": "JRY OS API"}


@api_router.post("/admin/verify")
async def admin_verify(payload: PasscodeInput):
    if payload.passcode != ADMIN_PASSCODE:
        raise HTTPException(status_code=401, detail="Invalid passcode")
    return {"ok": True}


@api_router.get("/settings")
async def get_settings():
    merged = dict(DEFAULT_SETTINGS)
    docs = await db.settings.find({}, {"_id": 0}).to_list(100)
    for d in docs:
        if "key" in d:
            merged[d["key"]] = d.get("value", "")
    return merged


@api_router.put("/settings")
async def update_settings(payload: SettingsInput, x_admin_passcode: Optional[str] = Header(None)):
    require_admin(x_admin_passcode)
    for key, value in payload.values.items():
        await db.settings.update_one({"key": key}, {"$set": {"key": key, "value": value}}, upsert=True)
    return await get_settings()


@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...), x_admin_passcode: Optional[str] = Header(None)):
    require_admin(x_admin_passcode)
    ext = (file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "png")
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, content_type)
    stored_path = result["path"]
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": stored_path,
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "created_at": now_iso(),
    })
    return {"path": stored_path, "url": f"/api/files/{stored_path}"}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path})
    try:
        data, content_type = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    ct = record.get("content_type") if record else content_type
    return Response(content=data, media_type=ct, headers={"Cache-Control": "public, max-age=31536000"})


# ---- Work ----
@api_router.get("/work", response_model=List[WorkItem])
async def get_work(category: Optional[str] = Query(None)):
    q = {"category": category} if category else {}
    items = await db.work.find(q, {"_id": 0}).sort([("order", 1), ("created_at", -1)]).to_list(1000)
    return items


@api_router.post("/work", response_model=WorkItem)
async def create_work(payload: WorkCreate, x_admin_passcode: Optional[str] = Header(None)):
    require_admin(x_admin_passcode)
    item = WorkItem(**payload.model_dump())
    await db.work.insert_one(item.model_dump())
    return item


@api_router.delete("/work/{item_id}")
async def delete_work(item_id: str, x_admin_passcode: Optional[str] = Header(None)):
    require_admin(x_admin_passcode)
    res = await db.work.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ---- Network ----
@api_router.get("/network", response_model=List[Client])
async def get_network():
    items = await db.network.find({}, {"_id": 0}).sort([("order", 1), ("created_at", -1)]).to_list(1000)
    return items


@api_router.post("/network", response_model=Client)
async def create_client(payload: ClientCreate, x_admin_passcode: Optional[str] = Header(None)):
    require_admin(x_admin_passcode)
    item = Client(**payload.model_dump())
    await db.network.insert_one(item.model_dump())
    return item


@api_router.delete("/network/{item_id}")
async def delete_client(item_id: str, x_admin_passcode: Optional[str] = Header(None)):
    require_admin(x_admin_passcode)
    res = await db.network.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ------------------- Seed -------------------
SEED_WORK = [
    # thumbnails
    {"category": "thumbnail", "title": "PRESS PLAY", "subtitle": "YouTube Thumbnail", "image_url": "https://images.unsplash.com/photo-1567843017138-be96cfcbe975?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200", "order": 1},
    {"category": "thumbnail", "title": "GAME ON", "subtitle": "Stream Thumbnail", "image_url": "https://images.unsplash.com/photo-1546443046-ed1ce6ffd1ab?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200", "order": 2},
    {"category": "thumbnail", "title": "NIGHT MODE", "subtitle": "Gaming Thumbnail", "image_url": "https://images.unsplash.com/photo-1606242629702-5dd5ff63e84a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200", "order": 3},
    {"category": "thumbnail", "title": "PLAYER ONE", "subtitle": "YouTube Thumbnail", "image_url": "https://images.unsplash.com/photo-1708099332948-d6d3b06e918c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200", "order": 4},
    # shorts
    {"category": "short", "title": "Studio Cut", "subtitle": "Vertical Short", "image_url": "", "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "order": 1},
    {"category": "short", "title": "On Location", "subtitle": "Reel Edit", "image_url": "", "youtube_url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ", "order": 2},
    {"category": "short", "title": "Late Night", "subtitle": "TikTok Edit", "image_url": "", "youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw", "order": 3},
    {"category": "short", "title": "Podcast Clip", "subtitle": "Vertical Short", "image_url": "", "youtube_url": "https://www.youtube.com/watch?v=M7lc1UVf-VE", "order": 4},
    # longform
    {"category": "longform", "title": "The Documentary", "subtitle": "Long-form Edit", "image_url": "", "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "order": 1},
    {"category": "longform", "title": "Behind The Stream", "subtitle": "Long-form Edit", "image_url": "", "youtube_url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ", "order": 2},
    # designs
    {"category": "design", "title": "Brand System", "subtitle": "Identity Design", "image_url": "https://images.unsplash.com/photo-1647675975434-864e1c3fc98d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200", "order": 1},
    {"category": "design", "title": "Typographic Poster", "subtitle": "Poster Design", "image_url": "https://images.unsplash.com/photo-1655156871717-ccda8ae8274c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200", "order": 2},
    {"category": "design", "title": "Campaign Key Art", "subtitle": "Art Direction", "image_url": "https://images.unsplash.com/photo-1763671872042-decff1375c06?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200", "order": 3},
]

SEED_NETWORK = [
    {"name": "Adin Ross", "followers": "22M+", "logo_url": "https://images.unsplash.com/photo-1740252117027-4275d3f84385?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "link": "", "order": 1},
    {"name": "Kay", "followers": "10M+", "logo_url": "https://images.unsplash.com/photo-1740252117013-4fb21771e7ca?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "link": "", "order": 2},
    {"name": "Jarvis", "followers": "7M+", "logo_url": "https://images.unsplash.com/photo-1740252117012-bb53ad05e370?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "link": "", "order": 3},
    {"name": "BenDaDonnn", "followers": "2.5M+", "logo_url": "https://images.unsplash.com/photo-1581841064838-a470c740e8ee?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "link": "", "order": 4},
    {"name": "AsianJeff", "followers": "2M+", "logo_url": "https://images.unsplash.com/photo-1740252117027-4275d3f84385?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "link": "", "order": 5},
    {"name": "Raud", "followers": "1M+", "logo_url": "https://images.unsplash.com/photo-1740252117013-4fb21771e7ca?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "link": "", "order": 6},
]


@app.on_event("startup")
async def seed_db():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    if await db.work.count_documents({}) == 0:
        docs = [WorkItem(**w).model_dump() for w in SEED_WORK]
        await db.work.insert_many(docs)
        logger.info("Seeded work collection")
    if await db.network.count_documents({}) == 0:
        docs = [Client(**c).model_dump() for c in SEED_NETWORK]
        await db.network.insert_many(docs)
        logger.info("Seeded network collection")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
