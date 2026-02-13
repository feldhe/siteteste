from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import random
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Pydantic Models ──
class OnboardingData(BaseModel):
    display_name: str
    city: str
    school: str
    grade: str
    subjects: List[str]

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    college_plan: Optional[str] = None
    current_course: Optional[str] = None
    profile_photo: Optional[str] = None
    banner: Optional[str] = None
    profile_color: Optional[str] = None
    frame: Optional[str] = None
    active_badge: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None

class ActivityCreate(BaseModel):
    title: str
    subject: str
    description: Optional[str] = ""
    difficulty: int = 3
    estimated_time: Optional[int] = 30
    checklist: Optional[List[Dict[str, Any]]] = []

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[int] = None
    estimated_time: Optional[int] = None
    checklist: Optional[List[Dict[str, Any]]] = None
    actual_time_start: Optional[str] = None
    actual_time_end: Optional[str] = None

class ClanCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    photo: Optional[str] = ""
    banner: Optional[str] = ""

class WeeklyGoalUpdate(BaseModel):
    xp_goal: Optional[int] = None
    minutes_goal: Optional[int] = None
    activities_goal: Optional[int] = None

class FriendRequest(BaseModel):
    to_user_id: str

class FriendRespond(BaseModel):
    request_id: str
    action: str  # accept or reject

# ── Helper Functions ──
def calculate_xp(duration_minutes: int, difficulty: int, streak_days: int, activities_today: int) -> int:
    base_xp = 50
    duration_bonus = min(100, (duration_minutes // 15) * 15)
    difficulty_bonus = difficulty * 10
    raw_xp = base_xp + duration_bonus + difficulty_bonus
    if streak_days >= 30:
        multiplier = 1.5
    elif streak_days >= 7:
        multiplier = 1.25
    elif streak_days >= 3:
        multiplier = 1.1
    else:
        multiplier = 1.0
    xp = int(raw_xp * multiplier)
    if activities_today >= 3:
        xp += 25
    if activities_today >= 5:
        xp += 50
    return xp

def get_level_info(total_level_xp: int) -> dict:
    level = 0
    xp_remaining = total_level_xp
    while level < 100 and xp_remaining >= (level + 1) * 100:
        xp_remaining -= (level + 1) * 100
        level += 1
    next_level_xp = (level + 1) * 100 if level < 100 else 0
    rank = "Bronze"
    if level >= 100:
        rank = "Platina Lendário"
    elif level >= 75:
        rank = "Rubi"
    elif level >= 50:
        rank = "Ouro"
    elif level >= 25:
        rank = "Prata"
    return {"level": level, "current_xp": xp_remaining, "next_level_xp": next_level_xp, "rank": rank}

def get_today_str():
    utc_now = datetime.now(timezone.utc) - timedelta(hours=3)
    return utc_now.strftime("%Y-%m-%d")

def validate_title(title: str) -> str:
    if len(title) < 4:
        return "Título deve ter pelo menos 4 caracteres"
    vowels = set("aeiouáéíóúâêîôûãõAEIOUÁÉÍÓÚÂÊÎÔÛÃÕ")
    if not any(c in vowels for c in title):
        return "Título parece inválido"
    if re.match(r'^(.)\1{3,}', title):
        return "Título contém repetição excessiva"
    if re.match(r'^[a-zA-Z]{1,3}\d+$', title):
        return "Título parece ser spam"
    return ""

def validate_url(url: str) -> bool:
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    return bool(re.match(pattern, url))

# ── Auth Middleware ──
async def get_current_user(request: Request) -> dict:
    token = None
    cookie_token = request.cookies.get("session_token")
    if cookie_token:
        token = cookie_token
    auth_header = request.headers.get("Authorization")
    if not token and auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Sessão inválida")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessão expirada")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user

# ── AUTH ROUTES ──
@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id obrigatório")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Sessão inválida")
        data = resp.json()
    user_id = None
    existing = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {
            "name": data.get("name", existing.get("name", "")),
            "picture": data.get("picture", existing.get("picture", "")),
        }})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id, "email": data["email"],
            "name": data.get("name", ""), "picture": data.get("picture", ""),
            "display_name": "", "city": "", "school": "", "grade": "",
            "subjects": [], "bio": "", "college_plan": "", "current_course": "",
            "profile_photo": "", "banner": "", "profile_color": "#fafafa",
            "frame": "", "active_badge": "", "social_links": {},
            "level_xp": 0, "total_xp": 0, "level": 0, "streak": 0,
            "last_activity_date": "", "onboarding_complete": False,
            "rival_id": "", "clan_id": "", "inventory": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    session_token = data.get("session_token", f"sess_{uuid.uuid4().hex}")
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True,
                        secure=True, samesite="none", path="/", max_age=7*24*3600)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"message": "Logout realizado"}

# ── ONBOARDING ──
@api_router.post("/onboarding")
async def complete_onboarding(data: OnboardingData, user: dict = Depends(get_current_user)):
    if len(data.display_name) < 3:
        raise HTTPException(status_code=400, detail="Nome deve ter pelo menos 3 caracteres")
    if len(data.display_name) > 20:
        raise HTTPException(status_code=400, detail="Nome deve ter no máximo 20 caracteres")
    existing = await db.users.find_one(
        {"display_name": {"$regex": f"^{re.escape(data.display_name)}$", "$options": "i"},
         "user_id": {"$ne": user["user_id"]}}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Nome de exibição já em uso")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {
        "display_name": data.display_name, "city": data.city,
        "school": data.school, "grade": data.grade,
        "subjects": data.subjects, "onboarding_complete": True
    }})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ── PROFILE ──
@api_router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    level_info = get_level_info(user.get("level_xp", 0))
    user["level_info"] = level_info
    return user

@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    update_data = {}
    for field, value in data.model_dump(exclude_none=True).items():
        if field == "social_links" and value:
            for platform, url in value.items():
                if url and not validate_url(url):
                    raise HTTPException(status_code=400, detail=f"URL inválida para {platform}")
        update_data[field] = value
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    updated["level_info"] = get_level_info(updated.get("level_xp", 0))
    return updated

@api_router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "email": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user["level_info"] = get_level_info(user.get("level_xp", 0))
    return user

# ── SUBJECTS ──
@api_router.get("/subjects")
async def get_subjects(user: dict = Depends(get_current_user)):
    return {"subjects": user.get("subjects", [])}

@api_router.post("/subjects")
async def add_subject(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    name = body.get("name", "").strip()
    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Nome da matéria inválido")
    subjects = user.get("subjects", [])
    if name in subjects:
        raise HTTPException(status_code=400, detail="Matéria já existe")
    subjects.append(name)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"subjects": subjects}})
    return {"subjects": subjects}

@api_router.delete("/subjects/{name}")
async def remove_subject(name: str, user: dict = Depends(get_current_user)):
    subjects = user.get("subjects", [])
    subjects = [s for s in subjects if s != name]
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"subjects": subjects}})
    return {"subjects": subjects}

# ── ACTIVITIES ──
@api_router.post("/activities")
async def create_activity(data: ActivityCreate, user: dict = Depends(get_current_user)):
    error = validate_title(data.title)
    if error:
        raise HTTPException(status_code=400, detail=error)
    today = get_today_str()
    existing = await db.activities.find_one(
        {"user_id": user["user_id"], "title": data.title, "date": today}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Já existe uma atividade com este título hoje")
    week_count = await db.activities.count_documents(
        {"user_id": user["user_id"], "title": data.title,
         "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}})
    if week_count >= 5:
        raise HTTPException(status_code=400, detail="Muitas atividades com o mesmo título esta semana")
    activity = {
        "activity_id": f"act_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
        "title": data.title, "subject": data.subject, "description": data.description,
        "difficulty": max(1, min(5, data.difficulty)), "estimated_time": data.estimated_time,
        "actual_time_start": None, "actual_time_end": None,
        "checklist": data.checklist or [], "image_url": "",
        "status": "pending", "xp_earned": 0, "date": today,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    await db.activities.insert_one(activity)
    return {k: v for k, v in activity.items() if k != "_id"}

@api_router.get("/activities")
async def list_activities(status: Optional[str] = None, subject: Optional[str] = None,
                          date: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"user_id": user["user_id"]}
    if status:
        query["status"] = status
    if subject:
        query["subject"] = subject
    if date:
        query["date"] = date
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return activities

@api_router.put("/activities/{activity_id}")
async def update_activity(activity_id: str, data: ActivityUpdate,
                          user: dict = Depends(get_current_user)):
    activity = await db.activities.find_one(
        {"activity_id": activity_id, "user_id": user["user_id"]}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")
    if activity["status"] == "completed":
        raise HTTPException(status_code=400, detail="Atividade já concluída")
    update = {}
    for field, value in data.model_dump(exclude_none=True).items():
        if field == "title":
            error = validate_title(value)
            if error:
                raise HTTPException(status_code=400, detail=error)
        update[field] = value
    if update:
        await db.activities.update_one({"activity_id": activity_id}, {"$set": update})
    updated = await db.activities.find_one({"activity_id": activity_id}, {"_id": 0})
    return updated

@api_router.post("/activities/{activity_id}/complete")
async def complete_activity(activity_id: str, user: dict = Depends(get_current_user)):
    activity = await db.activities.find_one(
        {"activity_id": activity_id, "user_id": user["user_id"]}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")
    if activity["status"] == "completed":
        raise HTTPException(status_code=400, detail="Atividade já concluída")
    duration = activity.get("estimated_time", 30)
    if activity.get("actual_time_start") and activity.get("actual_time_end"):
        try:
            start = datetime.fromisoformat(activity["actual_time_start"])
            end = datetime.fromisoformat(activity["actual_time_end"])
            diff = (end - start).total_seconds() / 60
            if diff > 480:
                await db.fraud_logs.insert_one({
                    "user_id": user["user_id"], "activity_id": activity_id,
                    "reason": "duration_exceeded", "timestamp": datetime.now(timezone.utc).isoformat()
                })
                raise HTTPException(status_code=400, detail="Tempo registrado excede o limite")
            if diff > 0:
                duration = int(diff)
        except (ValueError, TypeError):
            pass
    today = get_today_str()
    activities_today = await db.activities.count_documents(
        {"user_id": user["user_id"], "date": today, "status": "completed"})
    streak = user.get("streak", 0)
    last_date = user.get("last_activity_date", "")
    yesterday = (datetime.now(timezone.utc) - timedelta(hours=3) - timedelta(days=1)).strftime("%Y-%m-%d")
    if last_date == today:
        pass
    elif last_date == yesterday:
        streak += 1
    else:
        streak = 1
    xp = calculate_xp(duration, activity.get("difficulty", 3), streak, activities_today)
    all_today_pending = await db.activities.count_documents(
        {"user_id": user["user_id"], "date": today, "status": "pending"})
    if all_today_pending <= 1:
        xp += 75
    now = datetime.now(timezone.utc).isoformat()
    await db.activities.update_one({"activity_id": activity_id}, {"$set": {
        "status": "completed", "xp_earned": xp, "completed_at": now
    }})
    new_level_xp = user.get("level_xp", 0) + xp
    new_total_xp = user.get("total_xp", 0) + xp
    old_level = get_level_info(user.get("level_xp", 0))["level"]
    new_level_info = get_level_info(new_level_xp)
    leveled_up = new_level_info["level"] > old_level
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {
        "level_xp": new_level_xp, "total_xp": new_total_xp,
        "level": new_level_info["level"], "streak": streak,
        "last_activity_date": today
    }})
    await db.daily_xp.update_one(
        {"user_id": user["user_id"], "date": today},
        {"$inc": {"xp": xp}, "$set": {"display_name": user.get("display_name", ""),
                                        "picture": user.get("picture", "")}},
        upsert=True
    )
    if user.get("clan_id"):
        await db.clans.update_one({"clan_id": user["clan_id"]}, {"$inc": {"total_xp": xp}})
    await check_badges(user["user_id"])
    return {
        "xp_earned": xp, "leveled_up": leveled_up,
        "new_level": new_level_info["level"], "level_info": new_level_info,
        "streak": streak, "total_xp": new_total_xp
    }

@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, user: dict = Depends(get_current_user)):
    result = await db.activities.delete_one(
        {"activity_id": activity_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")
    return {"message": "Atividade removida"}

# ── DASHBOARD ──
@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    today = get_today_str()
    today_xp_doc = await db.daily_xp.find_one(
        {"user_id": user["user_id"], "date": today}, {"_id": 0})
    today_xp = today_xp_doc["xp"] if today_xp_doc else 0
    pending = await db.activities.find(
        {"user_id": user["user_id"], "status": "pending"}, {"_id": 0}).to_list(20)
    today_activities = await db.activities.count_documents(
        {"user_id": user["user_id"], "date": today, "status": "completed"})
    level_info = get_level_info(user.get("level_xp", 0))
    global_rank_cursor = db.daily_xp.find({"date": today}, {"_id": 0}).sort("xp", -1).limit(10)
    global_rank = await global_rank_cursor.to_list(10)
    user_rank_pos = 0
    all_today = await db.daily_xp.find({"date": today}, {"_id": 0}).sort("xp", -1).to_list(1000)
    for i, r in enumerate(all_today):
        if r["user_id"] == user["user_id"]:
            user_rank_pos = i + 1
            break
    last_7 = []
    for i in range(6, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(hours=3) - timedelta(days=i)).strftime("%Y-%m-%d")
        doc = await db.daily_xp.find_one({"user_id": user["user_id"], "date": d}, {"_id": 0})
        last_7.append({"date": d, "xp": doc["xp"] if doc else 0})
    subject_stats = await db.activities.aggregate([
        {"$match": {"user_id": user["user_id"], "status": "completed"}},
        {"$group": {"_id": "$subject", "count": {"$sum": 1}, "total_xp": {"$sum": "$xp_earned"}}}
    ]).to_list(50)
    missions = await generate_daily_missions(user)
    goals = await get_weekly_goals_data(user)
    return {
        "today_xp": today_xp, "level_info": level_info,
        "total_xp": user.get("total_xp", 0), "level_xp": user.get("level_xp", 0),
        "streak": user.get("streak", 0), "global_rank": user_rank_pos,
        "global_top": global_rank, "pending_activities": pending,
        "today_activities_count": today_activities,
        "productivity_chart": last_7, "subject_stats": subject_stats,
        "missions": missions, "weekly_goals": goals
    }

# ── RANKINGS ──
@api_router.get("/rankings/global")
async def global_ranking():
    today = get_today_str()
    ranking = await db.daily_xp.find({"date": today}, {"_id": 0}).sort("xp", -1).to_list(50)
    result = []
    for i, r in enumerate(ranking):
        user = await db.users.find_one({"user_id": r["user_id"]},
            {"_id": 0, "user_id": 1, "display_name": 1, "picture": 1, "level": 1, "frame": 1})
        if user:
            result.append({**r, **user, "position": i + 1})
    return result

@api_router.get("/rankings/streak")
async def streak_ranking():
    users = await db.users.find(
        {"onboarding_complete": True},
        {"_id": 0, "user_id": 1, "display_name": 1, "picture": 1, "streak": 1, "level": 1}
    ).sort("streak", -1).to_list(50)
    for i, u in enumerate(users):
        u["position"] = i + 1
    return users

@api_router.get("/rankings/friends")
async def friends_ranking(user: dict = Depends(get_current_user)):
    friends = await db.friends.find(
        {"$or": [{"from_user_id": user["user_id"]}, {"to_user_id": user["user_id"]}],
         "status": "accepted"}, {"_id": 0}).to_list(200)
    friend_ids = set()
    for f in friends:
        friend_ids.add(f["from_user_id"])
        friend_ids.add(f["to_user_id"])
    friend_ids.discard(user["user_id"])
    friend_ids.add(user["user_id"])
    today = get_today_str()
    ranking = await db.daily_xp.find(
        {"date": today, "user_id": {"$in": list(friend_ids)}}, {"_id": 0}
    ).sort("xp", -1).to_list(50)
    result = []
    for i, r in enumerate(ranking):
        u = await db.users.find_one({"user_id": r["user_id"]},
            {"_id": 0, "user_id": 1, "display_name": 1, "picture": 1, "level": 1})
        if u:
            result.append({**r, **u, "position": i + 1})
    return result

@api_router.get("/rankings/clans")
async def clan_ranking():
    clans = await db.clans.find({}, {"_id": 0}).sort("total_xp", -1).to_list(50)
    for i, c in enumerate(clans):
        c["position"] = i + 1
    return clans

# ── SHOP ──
@api_router.get("/shop")
async def get_shop(user: dict = Depends(get_current_user)):
    items = await db.shop_items.find({}, {"_id": 0}).to_list(200)
    inventory = user.get("inventory", [])
    for item in items:
        item["owned"] = item["item_id"] in inventory
    return {"items": items, "total_xp": user.get("total_xp", 0)}

@api_router.post("/shop/buy/{item_id}")
async def buy_item(item_id: str, user: dict = Depends(get_current_user)):
    item = await db.shop_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    if item_id in user.get("inventory", []):
        raise HTTPException(status_code=400, detail="Item já adquirido")
    if user.get("total_xp", 0) < item["price"]:
        raise HTTPException(status_code=400, detail="XP insuficiente")
    await db.users.update_one({"user_id": user["user_id"]}, {
        "$inc": {"total_xp": -item["price"]},
        "$push": {"inventory": item_id}
    })
    return {"message": "Item comprado!", "item": item}

# ── FRIENDS ──
@api_router.get("/friends")
async def list_friends(user: dict = Depends(get_current_user)):
    friends_docs = await db.friends.find(
        {"$or": [{"from_user_id": user["user_id"]}, {"to_user_id": user["user_id"]}]},
        {"_id": 0}).to_list(200)
    accepted = []
    pending_sent = []
    pending_received = []
    for f in friends_docs:
        other_id = f["to_user_id"] if f["from_user_id"] == user["user_id"] else f["from_user_id"]
        other = await db.users.find_one({"user_id": other_id},
            {"_id": 0, "user_id": 1, "display_name": 1, "picture": 1, "level": 1, "streak": 1})
        if not other:
            continue
        entry = {**f, "other_user": other}
        if f["status"] == "accepted":
            accepted.append(entry)
        elif f["status"] == "pending":
            if f["from_user_id"] == user["user_id"]:
                pending_sent.append(entry)
            else:
                pending_received.append(entry)
    return {"accepted": accepted, "pending_sent": pending_sent,
            "pending_received": pending_received, "rival_id": user.get("rival_id", "")}

@api_router.post("/friends/request")
async def send_friend_request(data: FriendRequest, user: dict = Depends(get_current_user)):
    if data.to_user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Não pode adicionar a si mesmo")
    target = await db.users.find_one({"user_id": data.to_user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    existing = await db.friends.find_one({
        "$or": [
            {"from_user_id": user["user_id"], "to_user_id": data.to_user_id},
            {"from_user_id": data.to_user_id, "to_user_id": user["user_id"]}
        ]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Solicitação já existe")
    doc = {
        "request_id": f"fr_{uuid.uuid4().hex[:12]}",
        "from_user_id": user["user_id"], "to_user_id": data.to_user_id,
        "status": "pending", "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.friends.insert_one(doc)
    return {"message": "Solicitação enviada"}

@api_router.post("/friends/respond")
async def respond_friend_request(data: FriendRespond, user: dict = Depends(get_current_user)):
    req = await db.friends.find_one(
        {"request_id": data.request_id, "to_user_id": user["user_id"]}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    if data.action == "accept":
        await db.friends.update_one({"request_id": data.request_id},
                                     {"$set": {"status": "accepted"}})
        return {"message": "Amizade aceita!"}
    else:
        await db.friends.delete_one({"request_id": data.request_id})
        return {"message": "Solicitação recusada"}

@api_router.post("/friends/rival/{target_user_id}")
async def set_rival(target_user_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one({"user_id": user["user_id"]},
                               {"$set": {"rival_id": target_user_id}})
    return {"message": "Rival definido!"}

@api_router.get("/friends/search")
async def search_users(q: str = "", user: dict = Depends(get_current_user)):
    if len(q) < 2:
        return []
    users = await db.users.find(
        {"display_name": {"$regex": q, "$options": "i"},
         "user_id": {"$ne": user["user_id"]}, "onboarding_complete": True},
        {"_id": 0, "user_id": 1, "display_name": 1, "picture": 1, "level": 1}
    ).to_list(20)
    return users

# ── CLANS ──
@api_router.get("/clans")
async def list_clans():
    clans = await db.clans.find({}, {"_id": 0}).sort("total_xp", -1).to_list(50)
    return clans

@api_router.post("/clans")
async def create_clan(data: ClanCreate, user: dict = Depends(get_current_user)):
    if user.get("clan_id"):
        raise HTTPException(status_code=400, detail="Você já está em um clã")
    if user.get("total_xp", 0) < 500:
        raise HTTPException(status_code=400, detail="Precisa de 500 Total XP para criar um clã")
    existing = await db.clans.find_one({"name": {"$regex": f"^{re.escape(data.name)}$", "$options": "i"}}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Nome de clã já existe")
    clan = {
        "clan_id": f"clan_{uuid.uuid4().hex[:12]}",
        "name": data.name, "description": data.description,
        "photo": data.photo, "banner": data.banner,
        "leader_id": user["user_id"],
        "members": [user["user_id"]], "total_xp": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.clans.insert_one(clan)
    await db.users.update_one({"user_id": user["user_id"]},
                               {"$set": {"clan_id": clan["clan_id"]},
                                "$inc": {"total_xp": -500}})
    return {k: v for k, v in clan.items() if k != "_id"}

@api_router.get("/clans/{clan_id}")
async def get_clan(clan_id: str):
    clan = await db.clans.find_one({"clan_id": clan_id}, {"_id": 0})
    if not clan:
        raise HTTPException(status_code=404, detail="Clã não encontrado")
    members = []
    for mid in clan.get("members", []):
        m = await db.users.find_one({"user_id": mid},
            {"_id": 0, "user_id": 1, "display_name": 1, "picture": 1, "level": 1, "streak": 1})
        if m:
            members.append(m)
    clan["member_details"] = members
    return clan

@api_router.post("/clans/{clan_id}/join")
async def join_clan(clan_id: str, user: dict = Depends(get_current_user)):
    if user.get("clan_id"):
        raise HTTPException(status_code=400, detail="Você já está em um clã")
    clan = await db.clans.find_one({"clan_id": clan_id}, {"_id": 0})
    if not clan:
        raise HTTPException(status_code=404, detail="Clã não encontrado")
    await db.clans.update_one({"clan_id": clan_id},
                               {"$push": {"members": user["user_id"]}})
    await db.users.update_one({"user_id": user["user_id"]},
                               {"$set": {"clan_id": clan_id}})
    return {"message": "Entrou no clã!"}

@api_router.post("/clans/{clan_id}/leave")
async def leave_clan(clan_id: str, user: dict = Depends(get_current_user)):
    clan = await db.clans.find_one({"clan_id": clan_id}, {"_id": 0})
    if not clan:
        raise HTTPException(status_code=404, detail="Clã não encontrado")
    if clan["leader_id"] == user["user_id"] and len(clan.get("members", [])) > 1:
        raise HTTPException(status_code=400, detail="Líder não pode sair com membros ativos")
    await db.clans.update_one({"clan_id": clan_id},
                               {"$pull": {"members": user["user_id"]}})
    await db.users.update_one({"user_id": user["user_id"]},
                               {"$set": {"clan_id": ""}})
    if clan["leader_id"] == user["user_id"]:
        await db.clans.delete_one({"clan_id": clan_id})
    return {"message": "Saiu do clã"}

# ── MISSIONS ──
async def generate_daily_missions(user: dict) -> list:
    today = get_today_str()
    existing = await db.missions.find_one(
        {"user_id": user["user_id"], "date": today}, {"_id": 0})
    if existing:
        return existing.get("missions", [])
    subjects = user.get("subjects", ["Matemática"])
    missions = [
        {"id": "m1", "title": "Complete 3 atividades", "type": "activities",
         "target": 3, "reward": 100, "completed": False},
        {"id": "m2", "title": f"Estude {random.choice(subjects) if subjects else 'uma matéria'}",
         "type": "subject", "target": 1, "reward": 75, "completed": False},
        {"id": "m3", "title": "Estude por 60 minutos", "type": "time",
         "target": 60, "reward": 150, "completed": False},
    ]
    await db.missions.insert_one({
        "user_id": user["user_id"], "date": today, "missions": missions
    })
    return missions

@api_router.get("/missions")
async def get_missions(user: dict = Depends(get_current_user)):
    missions = await generate_daily_missions(user)
    today = get_today_str()
    completed_today = await db.activities.count_documents(
        {"user_id": user["user_id"], "date": today, "status": "completed"})
    total_time = 0
    completed_activities = await db.activities.find(
        {"user_id": user["user_id"], "date": today, "status": "completed"}, {"_id": 0}).to_list(100)
    for a in completed_activities:
        total_time += a.get("estimated_time", 0)
    for m in missions:
        if m["type"] == "activities":
            m["progress"] = min(completed_today, m["target"])
            m["completed"] = completed_today >= m["target"]
        elif m["type"] == "time":
            m["progress"] = min(total_time, m["target"])
            m["completed"] = total_time >= m["target"]
        elif m["type"] == "subject":
            m["progress"] = 1 if completed_today > 0 else 0
            m["completed"] = completed_today > 0
    await db.missions.update_one(
        {"user_id": user["user_id"], "date": today},
        {"$set": {"missions": missions}})
    return missions

@api_router.post("/missions/{mission_id}/claim")
async def claim_mission(mission_id: str, user: dict = Depends(get_current_user)):
    today = get_today_str()
    doc = await db.missions.find_one(
        {"user_id": user["user_id"], "date": today}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Missões não encontradas")
    mission = None
    for m in doc.get("missions", []):
        if m["id"] == mission_id:
            mission = m
            break
    if not mission:
        raise HTTPException(status_code=404, detail="Missão não encontrada")
    if not mission.get("completed"):
        raise HTTPException(status_code=400, detail="Missão não concluída")
    if mission.get("claimed"):
        raise HTTPException(status_code=400, detail="Recompensa já coletada")
    xp = mission["reward"]
    await db.users.update_one({"user_id": user["user_id"]}, {
        "$inc": {"level_xp": xp, "total_xp": xp}
    })
    for m in doc["missions"]:
        if m["id"] == mission_id:
            m["claimed"] = True
    await db.missions.update_one(
        {"user_id": user["user_id"], "date": today},
        {"$set": {"missions": doc["missions"]}})
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    new_level = get_level_info(updated_user.get("level_xp", 0))["level"]
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"level": new_level}})
    return {"message": "Recompensa coletada!", "xp": xp}

# ── WEEKLY GOALS ──
async def get_weekly_goals_data(user: dict) -> dict:
    now = datetime.now(timezone.utc) - timedelta(hours=3)
    week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
    goals_doc = await db.weekly_goals.find_one(
        {"user_id": user["user_id"], "week": week_start}, {"_id": 0})
    if not goals_doc:
        goals_doc = {
            "user_id": user["user_id"], "week": week_start,
            "xp_goal": 500, "minutes_goal": 120, "activities_goal": 10
        }
        await db.weekly_goals.insert_one(goals_doc)
    week_xp = 0
    week_minutes = 0
    week_activities = 0
    for i in range(7):
        d = (now - timedelta(days=now.weekday()) + timedelta(days=i)).strftime("%Y-%m-%d")
        if d > now.strftime("%Y-%m-%d"):
            break
        xp_doc = await db.daily_xp.find_one(
            {"user_id": user["user_id"], "date": d}, {"_id": 0})
        if xp_doc:
            week_xp += xp_doc.get("xp", 0)
        acts = await db.activities.find(
            {"user_id": user["user_id"], "date": d, "status": "completed"}, {"_id": 0}).to_list(100)
        week_activities += len(acts)
        for a in acts:
            week_minutes += a.get("estimated_time", 0)
    return {
        "xp_goal": goals_doc.get("xp_goal", 500),
        "minutes_goal": goals_doc.get("minutes_goal", 120),
        "activities_goal": goals_doc.get("activities_goal", 10),
        "xp_progress": week_xp,
        "minutes_progress": week_minutes,
        "activities_progress": week_activities
    }

@api_router.get("/goals")
async def get_goals(user: dict = Depends(get_current_user)):
    return await get_weekly_goals_data(user)

@api_router.put("/goals")
async def update_goals(data: WeeklyGoalUpdate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc) - timedelta(hours=3)
    week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
    update = {}
    if data.xp_goal is not None:
        update["xp_goal"] = data.xp_goal
    if data.minutes_goal is not None:
        update["minutes_goal"] = data.minutes_goal
    if data.activities_goal is not None:
        update["activities_goal"] = data.activities_goal
    await db.weekly_goals.update_one(
        {"user_id": user["user_id"], "week": week_start},
        {"$set": update}, upsert=True)
    return await get_weekly_goals_data(user)

# ── BADGES ──
BADGE_DEFINITIONS = [
    {"badge_id": "first_activity", "name": "Primeira Atividade", "description": "Complete sua primeira atividade", "icon": "zap"},
    {"badge_id": "streak_7", "name": "7 Dias Seguidos", "description": "Mantenha um streak de 7 dias", "icon": "flame"},
    {"badge_id": "streak_30", "name": "30 Dias Seguidos", "description": "Mantenha um streak de 30 dias", "icon": "flame"},
    {"badge_id": "activities_100", "name": "100 Atividades", "description": "Complete 100 atividades", "icon": "target"},
    {"badge_id": "hours_10", "name": "10 Horas", "description": "Estude por 10 horas", "icon": "clock"},
    {"badge_id": "level_10", "name": "Nível 10", "description": "Alcance o nível 10", "icon": "trophy"},
    {"badge_id": "level_25", "name": "Prata", "description": "Alcance o nível 25", "icon": "award"},
    {"badge_id": "level_50", "name": "Ouro", "description": "Alcance o nível 50", "icon": "crown"},
    {"badge_id": "weekly_goal", "name": "Meta Semanal", "description": "Complete todas as metas semanais", "icon": "star"},
]

async def check_badges(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return
    earned = await db.user_badges.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    earned_ids = {b["badge_id"] for b in earned}
    total_activities = await db.activities.count_documents(
        {"user_id": user_id, "status": "completed"})
    checks = {
        "first_activity": total_activities >= 1,
        "streak_7": user.get("streak", 0) >= 7,
        "streak_30": user.get("streak", 0) >= 30,
        "activities_100": total_activities >= 100,
        "level_10": user.get("level", 0) >= 10,
        "level_25": user.get("level", 0) >= 25,
        "level_50": user.get("level", 0) >= 50,
    }
    for badge_id, condition in checks.items():
        if condition and badge_id not in earned_ids:
            await db.user_badges.insert_one({
                "user_id": user_id, "badge_id": badge_id,
                "earned_at": datetime.now(timezone.utc).isoformat()
            })

@api_router.get("/badges")
async def get_badges(user: dict = Depends(get_current_user)):
    earned = await db.user_badges.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    earned_ids = {b["badge_id"] for b in earned}
    result = []
    for b in BADGE_DEFINITIONS:
        result.append({**b, "earned": b["badge_id"] in earned_ids})
    return result

# ── SEED DATA ──
SHOP_ITEMS = [
    {"item_id": "frame_basic", "name": "Moldura Básica", "type": "frame", "rarity": "common", "price": 500, "description": "Uma moldura simples e elegante", "preview": "border-zinc-400"},
    {"item_id": "frame_blue", "name": "Moldura Azul", "type": "frame", "rarity": "rare", "price": 1500, "description": "Moldura com borda azul neon", "preview": "border-blue-500"},
    {"item_id": "frame_diamond", "name": "Moldura Diamante", "type": "frame", "rarity": "epic", "price": 5000, "description": "Moldura com efeito diamante", "preview": "border-cyan-300"},
    {"item_id": "frame_legendary", "name": "Moldura Lendária", "type": "frame", "rarity": "legendary", "price": 15000, "description": "A moldura mais rara do jogo", "preview": "border-yellow-400"},
    {"item_id": "color_night", "name": "Azul Noite", "type": "color", "rarity": "common", "price": 400, "description": "Cor de perfil azul escuro", "preview": "#1e3a5f"},
    {"item_id": "color_emerald", "name": "Verde Esmeralda", "type": "color", "rarity": "rare", "price": 1200, "description": "Cor de perfil verde vibrante", "preview": "#10b981"},
    {"item_id": "color_ruby", "name": "Vermelho Rubi", "type": "color", "rarity": "epic", "price": 3500, "description": "Cor de perfil vermelho intenso", "preview": "#ef4444"},
    {"item_id": "color_gold", "name": "Dourado", "type": "color", "rarity": "legendary", "price": 12000, "description": "Cor de perfil dourada brilhante", "preview": "#ffd700"},
    {"item_id": "badge_student", "name": "Estudante", "type": "badge", "rarity": "common", "price": 200, "description": "Badge de estudante dedicado", "preview": "book-open"},
    {"item_id": "badge_master", "name": "Mestre", "type": "badge", "rarity": "epic", "price": 3000, "description": "Badge de mestre dos estudos", "preview": "graduation-cap"},
    {"item_id": "badge_legend", "name": "Lenda", "type": "badge", "rarity": "legendary", "price": 10000, "description": "Badge lendária exclusiva", "preview": "crown"},
    {"item_id": "banner_minimal", "name": "Banner Minimalista", "type": "banner", "rarity": "common", "price": 600, "description": "Banner com design limpo", "preview": "linear-gradient(135deg, #1a1a2e, #16213e)"},
    {"item_id": "banner_geometric", "name": "Banner Geométrico", "type": "banner", "rarity": "rare", "price": 1500, "description": "Banner com padrões geométricos", "preview": "linear-gradient(135deg, #0f3460, #533483)"},
    {"item_id": "banner_cosmic", "name": "Banner Cósmico", "type": "banner", "rarity": "epic", "price": 4000, "description": "Banner com tema espacial", "preview": "linear-gradient(135deg, #000428, #004e92)"},
    {"item_id": "banner_legendary", "name": "Banner Lendário", "type": "banner", "rarity": "legendary", "price": 12000, "description": "O banner mais exclusivo", "preview": "linear-gradient(135deg, #232526, #ffd700)"},
]

async def seed_shop():
    count = await db.shop_items.count_documents({})
    if count == 0:
        for item in SHOP_ITEMS:
            await db.shop_items.insert_one(item)
        logger.info("Shop items seeded")

@app.on_event("startup")
async def startup():
    await seed_shop()
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("display_name")
    await db.activities.create_index([("user_id", 1), ("date", -1)])
    await db.daily_xp.create_index([("user_id", 1), ("date", 1)], unique=True)
    await db.user_sessions.create_index("session_token")
    await db.friends.create_index("request_id", unique=True)
    await db.clans.create_index("clan_id", unique=True)
    logger.info("Database indexes created")

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
