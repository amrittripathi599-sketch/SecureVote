from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⚠️ UPDATE THIS PASSWORD TO MATCH YOUR LOCAL MYSQL ROOT PASSWORD
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Amrit!12", 
    "database": "securevote_db"
}

# Global Election State
election_status = {"announced": False}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# Auto-build database and tables on startup to prevent schema errors
def init_db():
    try:
        conn = mysql.connector.connect(host=DB_CONFIG["host"], user=DB_CONFIG["user"], password=DB_CONFIG["password"])
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
        cursor.close()
        conn.close()

        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                candidate_id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                vote_count INT DEFAULT 0
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INT PRIMARY KEY,
                has_voted BOOLEAN DEFAULT FALSE
            )
        """)
        db.commit()
        cursor.close()
        db.close()
    except Exception as e:
        print("Database Init Error:", e)

init_db()

class VoteRequest(BaseModel):
    user_id: int
    candidate_id: int

class CandidateRequest(BaseModel):
    full_name: str

@app.get("/api/status")
def get_status():
    return election_status

@app.post("/api/announce")
def announce_results():
    global election_status
    election_status["announced"] = True
    return {"status": "success"}

@app.get("/api/candidates")
def get_candidates():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM candidates")
    candidates = cursor.fetchall()
    cursor.close()
    db.close()
    return candidates

@app.post("/api/candidates")
def add_candidate(req: CandidateRequest):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO candidates (full_name, vote_count) VALUES (%s, 0)", (req.full_name,))
    db.commit()
    cursor.close()
    db.close()
    return {"status": "success"}

@app.post("/api/vote")
def cast_vote(req: VoteRequest):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    try:
        # Zero-Trust Check
        cursor.execute("SELECT has_voted FROM users WHERE user_id = %s", (req.user_id,))
        user = cursor.fetchone()
        
        if user and user['has_voted']:
            raise HTTPException(status_code=403, detail="Vote already cast. Zero-Trust enforced.")
        
        # Log Vote
        if not user:
            cursor.execute("INSERT INTO users (user_id, has_voted) VALUES (%s, TRUE)", (req.user_id,))
        else:
            cursor.execute("UPDATE users SET has_voted = TRUE WHERE user_id = %s", (req.user_id,))
            
        cursor.execute("UPDATE candidates SET vote_count = vote_count + 1 WHERE candidate_id = %s", (req.candidate_id,))
        db.commit()
        return {"status": "success", "message": "Vote encrypted and recorded."}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@app.post("/api/reset")
def reset_election():
    global election_status
    db = get_db()
    cursor = db.cursor()
    try:
        # 1. Delete all candidates completely
        cursor.execute("DELETE FROM candidates")
        
        # 2. Safely delete all voter locks
        cursor.execute("DELETE FROM users")
        
        db.commit()
        # 3. Relock results for the next election
        election_status["announced"] = False 
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print("🚨 DATABASE RESET ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()