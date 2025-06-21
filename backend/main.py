import os
from authlib.integrations.starlette_client import OAuth
from fastapi import FastAPI, Request, Query, Depends, Body, status
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import RedirectResponse, JSONResponse

from sqlalchemy import create_engine, text, Column, String
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "super-seecert"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
client="870923621419-4ss7pa1cfg0f9rvqq02en2ssqm6pratd.apps.googleusercontent.com"
key="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"
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

Base = declarative_base()

class UserProfile(Base):
    __tablename__ = "user_profiles"
    email = Column(String, primary_key=True)
    name = Column(String)
    location = Column(String)
    role = Column(String)

# Create the table if it doesn't exist
engine = create_engine("sqlite:///../databases/text_storage.db", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)

@app.get("/")
async def home():
    return {"msg": "Hello world"}

@app.get("/login")
async def login(request: Request):
    try:
        # Use localhost consistently for redirect URI
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
        except Exception as e:
            resp = await oauth.google.get("https://openidconnect.googleapis.com/v1/userinfo", token=token)
            user = resp.json()
        email = user.get("email")
        name = user.get("name")
        picture = user.get("picture")

        # Save/Check in DB
        #await get_or_create_user(email, name, picture)
        # Use localhost for frontend redirect as well
        frontend_url = f"http://localhost:3000/profile?email={email}"
        return RedirectResponse(frontend_url)
    
    except Exception as e:
        return {"error": f"Auth callback error: {str(e)}"}

@app.get("/api/check-url")
async def check_url(url: str):
    return {"checked_url": url}

@app.post("/api/store-text")
async def store_text(request: Request):
    data = await request.json()
    return {"status": "success", "data": data}

@app.get("/profile")
async def get_profile_data(request: Request):
    email = request.query_params.get("email")
    if not email:
        return {"error": "Email not provided"}
    engine = create_engine("sqlite:///../databases/text_storage.db", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db: Session = SessionLocal()
    try:
        # Check user profile
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
    engine = create_engine("sqlite:///../databases/text_storage.db", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db: Session = SessionLocal()
    try:
        # Upsert user profile
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