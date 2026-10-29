import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [candidates, setCandidates] = useState([])
  const [alert, setAlert] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // New State variables for Tabs and Admin Auth
  const [activeTab, setActiveTab] = useState('voter') // 'voter' or 'admin'
  const [isAdminAuth, setIsAdminAuth] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

  const currentUserId = 1 
  const API_BASE = "http://127.0.0.1:8000/api"

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${API_BASE}/candidates`)
      const data = await response.json()
      setCandidates(data)
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to fetch candidates", error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  // Clear alerts when switching tabs
  useEffect(() => {
    setAlert(null)
  }, [activeTab])

  const handleVote = async (candidateId) => {
    setAlert(null)
    try {
      const response = await fetch(`${API_BASE}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          candidate_id: candidateId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setAlert({ type: 'error', message: `Transaction Denied: ${data.detail}` })
      } else {
        setAlert({ type: 'success', message: "Authorization Confirmed: Ballot successfully recorded in database." })
        fetchCandidates()
      }
    } catch (error) {
      setAlert({ type: 'error', message: "System Error: Unable to reach secure node." })
    }
  }

  const handleAdminLogin = (e) => {
    e.preventDefault()
    // Hardcoded password for presentation demo
    if (passwordInput === 'admin123') {
      setIsAdminAuth(true)
      setAlert(null)
      setPasswordInput('')
    } else {
      setAlert({ type: 'error', message: 'Authentication Failed: Invalid Administrator Password' })
      setPasswordInput('')
    }
  }

  const handleReset = async () => {
    if (!window.confirm("WARNING: This action will purge all current election data and release database locks. Proceed?")) return;
    
    setAlert(null)
    try {
      const response = await fetch(`${API_BASE}/reset`, { method: 'POST' })
      if (response.ok) {
        setAlert({ type: 'success', message: "System Purge Complete: All constraints reset to baseline." })
        fetchCandidates()
      }
    } catch (error) {
      setAlert({ type: 'error', message: "System Error: Failed to execute purge command." })
    }
  }

  if (isLoading) return <div className="app-container"><div className="top-navigation"><div className="brand-section"><h1 className="brand-title">Establishing Secure Connection...</h1></div></div></div>

  return (
    <div className="app-container">
      <nav className="top-navigation">
        <div className="brand-section">
          <h1 className="brand-title">SecureVote</h1>
          <span className="brand-subtitle">Zero-Trust Campus Node</span>
        </div>
        <div className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'voter' ? 'active' : ''}`}
            onClick={() => setActiveTab('voter')}
          >
            Voter Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Admin Portal
          </button>
        </div>
      </nav>

      <main className="main-content">
        {alert && (
          <div className={`system-alert ${alert.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {alert.type === 'error' ? '✖' : '✓'} {alert.message}
          </div>
        )}

        {/* VIEW 1: VOTER DASHBOARD */}
        {activeTab === 'voter' && (
          <>
            <h2 className="section-heading">Active Election Roster</h2>
            <div className="candidate-grid">
              {candidates.map(candidate => (
                <div key={candidate.candidate_id} className="candidate-card">
                  <div className="candidate-header">
                    <h3 className="candidate-name">{candidate.full_name}</h3>
                    <span className="candidate-id">ID: {candidate.candidate_id}</span>
                  </div>
                  
                  <div className="vote-metric">
                    <div className="vote-metric-label">Cryptographic Tallies</div>
                    <div className="vote-metric-value">{candidate.vote_count}</div>
                  </div>

                  <button 
                    className="btn-primary"
                    onClick={() => handleVote(candidate.candidate_id)}
                  >
                    Authorize Ballot
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* VIEW 2: ADMIN PORTAL */}
        {activeTab === 'admin' && (
          <>
            <h2 className="section-heading">System Administrator Console</h2>
            
            {!isAdminAuth ? (
              <div className="admin-login-container">
                <h3>Admin Authentication Required</h3>
                <form onSubmit={handleAdminLogin}>
                  <input 
                    type="password" 
                    className="auth-input" 
                    placeholder="Enter Admin Password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn-primary">Authenticate Node</button>
                </form>
              </div>
            ) : (
              <div className="admin-module">
                <div className="admin-info">
                  <h3>System Administrator Override</h3>
                  <p>Developer tool to drop `has_voted` locks and truncate tallies for demonstration iterations.</p>
                </div>
                <button className="btn-danger" onClick={handleReset}>
                  Execute System Purge
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App