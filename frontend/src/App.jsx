import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [candidates, setCandidates] = useState([])
  const [alert, setAlert] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnnounced, setIsAnnounced] = useState(false)
  
  const [activeTab, setActiveTab] = useState('register') 
  const [sessionUser, setSessionUser] = useState(null)
  const [isAdminAuth, setIsAdminAuth] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

  const [regName, setRegName] = useState('')
  const [regStudentId, setRegStudentId] = useState('')
  const [regRole, setRegRole] = useState('voter')

  const API_BASE = "http://127.0.0.1:8000/api"

  const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0)
  // Sort candidates by highest votes
  const rankedCandidates = [...candidates].sort((a, b) => b.vote_count - a.vote_count)

  const fetchData = async () => {
    try {
      const candRes = await fetch(`${API_BASE}/candidates`)
      const candData = await candRes.json()
      setCandidates(candData)

      const statRes = await fetch(`${API_BASE}/status`)
      const statData = await statRes.json()
      setIsAnnounced(statData.announced)
      
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const triggerAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  const handleNav = (targetTab) => {
    if ((targetTab === 'voter' || targetTab === 'results') && !sessionUser) {
      triggerAlert('error', 'Access Denied: Please complete node registration first.')
      return
    }
    if (targetTab === 'results' && !isAnnounced && !isAdminAuth) {
      triggerAlert('error', 'Results Locked: Administrator has not authorized public release yet.')
      return
    }
    setActiveTab(targetTab)
  }

  const handleRegistration = async (e) => {
    e.preventDefault()
    if (!regName.trim() || !regStudentId.trim()) return;

    if (regRole === 'candidate') {
      try {
        const response = await fetch(`${API_BASE}/candidates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: regName })
        })
        if (!response.ok) return triggerAlert('error', 'Registration Failed.')
      } catch (error) {
        return triggerAlert('error', 'Network Error: Cannot reach secure node')
      }
    }

    const numericUserId = Math.abs(regStudentId.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)) || 1;
    setSessionUser({ name: regName, role: regRole, numericId: numericUserId })
    triggerAlert('success', `Session Established: Welcome ${regName}`)
    fetchData()
    setActiveTab('voter')
  }

  const handleVote = async (candidateId) => {
    try {
      const response = await fetch(`${API_BASE}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sessionUser.numericId, candidate_id: candidateId })
      })
      const data = await response.json()
      if (!response.ok) {
        triggerAlert('error', `Transaction Blocked: ${data.detail}`)
      } else {
        triggerAlert('success', 'Zero-Trust Verification: Ballot Encrypted')
        fetchData()
      }
    } catch (error) {
      triggerAlert('error', 'Network Error: Cannot reach secure node')
    }
  }

  const handleAdminLogin = (e) => {
    e.preventDefault()
    if (passwordInput === 'admin123') {
      setIsAdminAuth(true)
      setPasswordInput('')
    } else {
      triggerAlert('error', 'Authentication Failed: Invalid Credentials')
      setPasswordInput('')
    }
  }

  const handleAnnounce = async () => {
    try {
      const response = await fetch(`${API_BASE}/announce`, { method: 'POST' })
      if (response.ok) {
        triggerAlert('success', 'Authorization Granted: Results are now public.')
        fetchData()
      }
    } catch (error) {
      triggerAlert('error', 'System Error: Cannot announce results.')
    }
  }

  const handleReset = async () => {
    if (!window.confirm("WARNING: This drops all DB locks and truncates tallies. Proceed?")) return;
    try {
      const response = await fetch(`${API_BASE}/reset`, { method: 'POST' })
      if (response.ok) {
        triggerAlert('success', 'System Purged: Constraints reset to baseline')
        setSessionUser(null)
        setActiveTab('register')
        fetchData()
      }
    } catch (error) {
      triggerAlert('error', 'Purge Failed: Check DB connection')
    }
  }

  const Icons = {
    Shield: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    User: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    Lock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    Terminal: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
    Chart: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="21"/><line x1="16" y1="12" x2="16" y2="21"/><line x1="8" y1="16" x2="8" y2="21"/></svg>
  }

  if (isLoading) return <div className="dashboard-layout"><div className="main-panel">Initializing Secure Connection...</div></div>

  return (
    <div className="dashboard-layout">
      {alert && <div className="toast-container"><div className={`toast ${alert.type}`}>{alert.type === 'error' ? '🚫' : '✅'} {alert.message}</div></div>}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-icon">{Icons.Shield}</div>
          <div className="brand-text"><h1>SecureVote</h1><span>Zero-Trust Protocol</span></div>
        </div>
        <nav className="nav-menu">
          {!sessionUser && <button className={`nav-item ${activeTab === 'register' ? 'active' : ''}`} onClick={() => handleNav('register')}>{Icons.User} Node Registration</button>}
          
          <button className={`nav-item ${activeTab === 'voter' ? 'active' : ''}`} onClick={() => handleNav('voter')} style={{ opacity: sessionUser ? 1 : 0.5 }}>
            {sessionUser ? Icons.User : Icons.Lock} Voter Terminal
          </button>
          
          <button className={`nav-item ${activeTab === 'results' ? 'active' : ''}`} onClick={() => handleNav('results')} style={{ opacity: sessionUser && isAnnounced ? 1 : 0.5 }}>
            {sessionUser && isAnnounced ? Icons.Chart : Icons.Lock} Live Results
          </button>
          
          <button className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => handleNav('admin')}>{Icons.Terminal} System Admin</button>
        </nav>
        {sessionUser && (
          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Session</div>
            <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{sessionUser.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Role: {sessionUser.role}</div>
          </div>
        )}
      </aside>

      <main className="main-panel">
        <header className="top-bar">
          <h2 className="page-title">
            {activeTab === 'register' && 'Participant Identity Verification'}
            {activeTab === 'voter' && 'Active Election Roster'}
            {activeTab === 'results' && 'Official Election Results'}
            {activeTab === 'admin' && 'Administrative Override'}
          </h2>
          <div className="system-status"><div className="status-dot"></div> Node Secure</div>
        </header>

        {activeTab === 'register' && (
          <div className="glass-card admin-lock-screen">
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Establish Network Identity</h3>
            <form onSubmit={handleRegistration}>
              <div className="form-group">
                <label className="form-label">Full Legal Name</label>
                <input type="text" className="input-glass" placeholder="Enter your name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Campus/Student ID</label>
                <input type="text" className="input-glass" placeholder="e.g., 2026-CS-XXX" value={regStudentId} onChange={(e) => setRegStudentId(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Network Role</label>
                <select className="input-glass" value={regRole} onChange={(e) => setRegRole(e.target.value)} style={{ appearance: 'none', cursor: 'pointer' }}>
                  <option value="voter">Standard Voter Only</option>
                  <option value="candidate">Contesting Candidate</option>
                </select>
              </div>
              <button type="submit" className="btn-secure">Initialize Session</button>
            </form>
          </div>
        )}

        {activeTab === 'voter' && sessionUser && (
          <div className="roster-grid">
            {candidates.map(candidate => {
              const votePercentage = totalVotes > 0 ? ((candidate.vote_count / totalVotes) * 100).toFixed(1) : 0;
              return (
                <div key={candidate.candidate_id} className="glass-card">
                  <div className="card-header">
                    <div className="candidate-info"><h3>{candidate.full_name}</h3><span>Node ID: {candidate.candidate_id}</span></div>
                    <div className="candidate-avatar">{Icons.User}</div>
                  </div>
                  <div className="stats-container">
                    <div className="stats-header"><span style={{ color: 'var(--text-muted)' }}>Cryptographic Tally</span><span className="vote-count">{candidate.vote_count}</span></div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${votePercentage}%` }}></div></div>
                  </div>
                  <button className="btn-secure" onClick={() => handleVote(candidate.candidate_id)} disabled={isAnnounced} style={{ opacity: isAnnounced ? 0.5 : 1, cursor: isAnnounced ? 'not-allowed' : 'pointer' }}>
                    {isAnnounced ? "Election Closed" : <>{Icons.Lock} Authorize Ballot</>}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'results' && sessionUser && isAnnounced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* NEW WINNER BANNER */}
            {rankedCandidates.length > 0 && rankedCandidates[0].vote_count > 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <h2 style={{ color: 'var(--success)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '2px' }}>👑 Election Winner</h2>
                <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  {rankedCandidates[0].full_name}
                </div>
                <div style={{ color: 'var(--success)', fontSize: '1.25rem', fontWeight: '600' }}>
                  Won with {rankedCandidates[0].vote_count} verified votes
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center' }}>
                <h3>No votes were cast in this election.</h3>
              </div>
            )}

            {/* FULL RANKINGS LIST */}
            <div className="glass-card" style={{ padding: '3rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '2rem', color: 'var(--text-muted)' }}>Complete Cryptographic Tally</h3>
              <div className="ranking-list">
                {rankedCandidates.map((candidate, index) => (
                  <div key={candidate.candidate_id} className="ranking-item">
                    <div className="ranking-position">#{index + 1}</div>
                    <div className="candidate-avatar">{Icons.User}</div>
                    <div className="ranking-details">
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
                        {candidate.full_name}
                        {index === 0 && candidate.vote_count > 0 && (
                          <span className="winner-tag" style={{ background: 'var(--success)', color: '#000', marginLeft: '1rem' }}>WINNER</span>
                        )}
                      </h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Node ID: {candidate.candidate_id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{candidate.vote_count}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified Votes</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'admin' && (
          <div className="admin-workspace">
            {!isAdminAuth ? (
              <div className="glass-card admin-lock-screen">
                <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Elevated Access Required</h3>
                <form onSubmit={handleAdminLogin}>
                  <input type="password" className="input-glass" placeholder="Enter root password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus />
                  <button type="submit" className="btn-secure">Authenticate Session</button>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="admin-control-panel" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>Release Election Results</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Authorize the public release of all cryptographic tallies to the voter network.</p>
                  </div>
                  <button 
                    className="btn-secure" 
                    onClick={handleAnnounce} 
                    style={{ width: 'auto', background: isAnnounced ? 'transparent' : 'rgba(16, 185, 129, 0.1)', color: isAnnounced ? 'var(--text-muted)' : 'var(--success)', borderColor: isAnnounced ? 'var(--border-light)' : 'rgba(16, 185, 129, 0.3)' }}
                    disabled={isAnnounced}
                  >
                    {isAnnounced ? 'Results Already Public' : 'Announce Results'}
                  </button>
                </div>

                <div className="admin-control-panel">
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>Database Truncation Tool</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Warning: This drops all `has_voted` locks, resets tallies, and hides results again.</p>
                  </div>
                  <button className="btn-danger" onClick={handleReset}>Execute Master Purge</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App