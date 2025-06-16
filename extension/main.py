#uvicorn main:app --reload    
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import create_engine, Integer,Column, String, Text, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime

from fastapi import Query
import requests

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///../databases/text_storage.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI app
app = FastAPI(title="Text Storage API", version="1.0.0")

# CORS middleware for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://mcimihlmagolajnkpfbhmjmphehgogkn", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database Model
class TextEntry(Base):
    __tablename__ = "text_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, primary_key=False)
    text = Column(Text, nullable=False)
    date = Column(DateTime, default=func.now())
    url = Column(String, nullable=False)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
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

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication function
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
    """Get current user email from token"""
    token = credentials.credentials
    return verify_google_token(token)

# Routes
@app.get("/")
async def root():
    return {"message": "Text Storage API is running"}

from summarizer import get_summary

@app.post("/api/store-text", response_model=TextEntryResponse)
async def store_text(
    text_entry: TextEntryCreate,
    db: Session = Depends(get_db),
    user_email: str = Depends(get_current_user_email)
):
    """Store extracted text with user's email"""
    
    # Create new text entry
    db_entry = TextEntry(
        email=user_email,
        text=get_summary(text_entry.text),
        url=text_entry.url,
        date=datetime.utcnow()
    )
    
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return db_entry

@app.get("/api/check-url")
async def check_url_exists(
    url: str = Query(...),
    db: Session = Depends(get_db),
    user_email: str = Depends(get_current_user_email)
):
    exists = db.query(TextEntry).filter(TextEntry.url == url, TextEntry.email == user_email).first()
    return {"exists": exists is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)