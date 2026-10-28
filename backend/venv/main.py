from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector

app = FastAPI()

# Allow React to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="Amrit!12", 
        database="securevote"
    )

@app.get("/api/candidates")
def get_candidates():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT candidate_id, full_name, manifesto_url, vote_count FROM Candidates")
    candidates = cursor.fetchall()
    cursor.close()
    db.close()
    return candidates

class VoteRequest(BaseModel):
    user_id: int
    candidate_id: int

@app.post("/api/vote")
def cast_vote(payload: VoteRequest):
    db = get_db()
    cursor = db.cursor()
    try:
        db.start_transaction()
        
        # 1. Lock the user row to prevent double-voting (Zero-Trust)
        cursor.execute("SELECT has_voted FROM Users WHERE user_id = %s FOR UPDATE", (payload.user_id,))
        user = cursor.fetchone()
        
        if not user or user[0] == 1:
            raise HTTPException(status_code=403, detail="Vote already cast. Zero-Trust enforced.")
        
        # 2. Update the candidate tally and user status
        cursor.execute("UPDATE Candidates SET vote_count = vote_count + 1 WHERE candidate_id = %s", (payload.candidate_id,))
        cursor.execute("UPDATE Users SET has_voted = TRUE WHERE user_id = %s", (payload.user_id,))
        
        db.commit()
        return {"status": "success", "message": "Secure ballot cast successfully."}
    
    except HTTPException:
        # Keeps the 403 error clean in the terminal logs for your demo
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
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("UPDATE Candidates SET vote_count = 0")
        cursor.execute("UPDATE Users SET has_voted = FALSE")
        db.commit()
        return {"status": "success", "message": "Demo reset complete."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()