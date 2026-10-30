# SecureVote 🗳️
**A Zero-Trust Campus Election System**

SecureVote is a modern, full-stack voting platform designed to bring absolute transparency and cryptographic integrity to campus elections. Built with a strict "Zero-Trust" architecture, the system guarantees that every ballot is verified and securely logged—eliminating any possibility of duplicate voting or unauthorized access.

This project combines a robust Python backend with a sleek, Glassmorphism-inspired React interface to deliver an enterprise-grade experience for both voters and election administrators.

---

## ✨ Core Capabilities

*   **Zero-Trust Security:** Enforces strict voting constraints at the database level. Once a localized Campus/Student ID casts a ballot, the system securely locks that node from submitting further transactions.
*   **Role-Based Network Access:** Distinct, separate workflows for standard voters to cast ballots and for candidates to register their contesting nodes.
*   **Controlled Result Announcements:** To prevent voting bias, live tallies remain entirely locked and hidden from the public network until a system administrator officially authorizes the release of the results.
*   **Administrative Master Purge:** A dedicated, password-protected control panel that allows authorized personnel to safely wipe candidate tallies and reset all voter locks during demonstration, testing, or new election cycles.
*   **Glassmorphism UI:** A highly polished, responsive web interface utilizing translucent visual panels, dynamic progress tracking, and secure session management.

---

## 🏗️ Technology Stack

*   **Frontend:** React.js, Vite, HTML5, Custom Enterprise CSS
*   **Backend:** Python, FastAPI, Uvicorn
*   **Database:** MySQL (Relational Database Management System)
*   **Integration:** RESTful APIs, CORS Middleware

---

## ⚙️ How to Run Locally

Follow these steps to run the complete SecureVote system on your local machine. 

### 1. Database Configuration
The system features an automated database initialization protocol. You do not need to manually write SQL queries to build the tables.
*   Ensure you have a local instance of **MySQL** running on your computer.
*   Open `backend/main.py` and verify that the `DB_CONFIG` credentials (username and password) match your local MySQL root setup. 
*   The backend will automatically generate the `securevote_db` database and all necessary tables the moment it starts up.

### 2. Start the Backend (FastAPI)
Open your terminal, navigate to the `backend` directory, and run the following commands:
```bash
cd backend
python -m venv venv

# Activate the virtual environment
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

pip install fastapi uvicorn mysql-connector-python pydantic
uvicorn main:app --reload
