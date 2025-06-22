import os
from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, Request, Query, Depends, Body, status, HTTPException
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text, Column, String, Text, DateTime, Integer, func
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from dotenv import load_dotenv
import requests

load_dotenv()

# --- FastAPI app and Middleware ---
app = FastAPI(title="Unified Text Storage API", version="1.0.0")
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "super-seecert"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://mcimihlmagolajnkpfbhmjmphehgogkn",  # Chrome extension
        "http://localhost:3000"  # React frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Google OAuth Setup ---
client = os.getenv("GOOGLE_CLIENT_ID", "870923621419-4ss7pa1cfg0f9rvqq02en2ssqm6pratd.apps.googleusercontent.com")
key = os.getenv("GOOGLE_CLIENT_SECRET", "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")
oauth = OAuth()
oauth.register(
    name="google",
    client_id=client,
    client_secret=key,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
        "token_endpoint_auth_method": "client_secret_post"
    },
)

# --- Database Setup ---
SQLALCHEMY_DATABASE_URL = "sqlite:///../databases/text_storage.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Models ---
class UserProfile(Base):
    __tablename__ = "user_profiles"
    email = Column(String, primary_key=True)
    name = Column(String)
    location = Column(String)
    role = Column(String)

class TextEntry(Base):
    __tablename__ = "text_entries"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, primary_key=False)
    text = Column(Text, nullable=False)
    date = Column(DateTime, default=func.now())
    url = Column(String, nullable=False)

Base.metadata.create_all(bind=engine)

# --- Pydantic Models ---
class TextEntryCreate(BaseModel):
    url: str
    text: str

class TextEntryResponse(BaseModel):
    email: str
    text: str
    date: datetime
    url: str
    class Config:
        from_attributes = True

# --- Security ---
security = HTTPBearer()

def verify_google_token(token: str) -> str:
    """Verify Google OAuth token and return email"""
    try:
        response = requests.get(f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={token}")
        if response.status_code == 200:
            user_info = response.json()
            return user_info.get("email")
        else:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

def get_current_user_email(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    return verify_google_token(token)

# --- Routes ---
@app.get("/")
async def home():
    return {"msg": "Unified Text Storage API is running"}

@app.get("/login")
async def login(request: Request):
    try:
        redirect_uri = "http://localhost:8000/auth/callback"
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        return {"error": f"Login error: {str(e)}"}

@app.get("/auth/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        try:
            user = await oauth.google.parse_id_token(request, token)
        except Exception:
            resp = await oauth.google.get("https://openidconnect.googleapis.com/v1/userinfo", token=token)
            user = resp.json()
        email = user.get("email")
        name = user.get("name")
        picture = user.get("picture")
        frontend_url = f"http://localhost:3000/profile?email={email}"
        return RedirectResponse(frontend_url)
    except Exception as e:
        return {"error": f"Auth callback error: {str(e)}"}

@app.get("/api/check-url")
async def check_url_exists(
    url: str = Query(...),
    db: Session = Depends(lambda: SessionLocal()),
    user_email: str = Depends(get_current_user_email)
):
    exists = db.query(TextEntry).filter(TextEntry.url == url, TextEntry.email == user_email).first()
    return {"exists": exists is not None}

@app.post("/api/store-text", response_model=TextEntryResponse)
async def store_text(
    text_entry: TextEntryCreate,
    db: Session = Depends(lambda: SessionLocal()),
    user_email: str = Depends(get_current_user_email)
):
    # Block localhost URLs
    if "localhost" in text_entry.url or "127.0.0.1" in text_entry.url:
        raise HTTPException(status_code=400, detail="Storing localhost URLs is not allowed.")
    # Optionally import and use summarizer if available
    try:
        from summarizer import get_summary
        summary = get_summary(text_entry.text)
    except Exception:
        summary = text_entry.text
    db_entry = TextEntry(
        email=user_email,
        text=summary,
        url=text_entry.url,
        date=datetime.utcnow()
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/profile")
async def get_profile_data(request: Request):
    email = request.query_params.get("email")
    if not email:
        return {"error": "Email not provided"}
    db: Session = SessionLocal()
    try:
        user_profile = db.execute(text("SELECT * FROM user_profiles WHERE email = :email"), {"email": email}).fetchone()
        profile_data = None
        if user_profile:
            profile_data = dict(user_profile._mapping)
        result = db.execute(text("SELECT * FROM text_entries WHERE email = :email ORDER BY date DESC"), {"email": email}).fetchall()
        data = [dict(row._mapping) for row in result]
        return {"profile": profile_data, "entries": data}
    finally:
        db.close()

@app.post("/profile")
async def update_profile(request: Request):
    data = await request.json()
    email = data.get("email")
    name = data.get("name")
    location = data.get("location")
    role = data.get("role")
    if not (email and name and location and role):
        return JSONResponse({"error": "Missing fields"}, status_code=status.HTTP_400_BAD_REQUEST)
    db: Session = SessionLocal()
    try:
        existing = db.execute(text("SELECT * FROM user_profiles WHERE email = :email"), {"email": email}).fetchone()
        if existing:
            db.execute(text("UPDATE user_profiles SET name = :name, location = :location, role = :role WHERE email = :email"),
                       {"name": name, "location": location, "role": role, "email": email})
        else:
            db.execute(text("INSERT INTO user_profiles (email, name, location, role) VALUES (:email, :name, :location, :role)"),
                       {"email": email, "name": name, "location": location, "role": role})
        db.commit()
        return {"success": True}
    finally:
        db.close()

@app.get("/ForYou")
async def get_recent_tweets(request: Request):
    db: Session = SessionLocal()
    try:
        query = '''select * from text_entries as te
        join user_profiles as up
        where up.email = te.email
        order by date desc;'''
        result = db.execute(text(query)).fetchall()
        data = [dict(row._mapping) for row in result]
        return {"entries": data}
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)