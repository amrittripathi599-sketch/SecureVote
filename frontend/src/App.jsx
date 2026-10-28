import { useState, useEffect } from 'react'

function App() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCandidates = () => {
    fetch('http://localhost:8000/api/candidates')
      .then(response => response.json())
      .then(data => {
        setCandidates(data)
        setLoading(false)
      })
      .catch(error => console.error("Error fetching candidates:", error))
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  const handleVote = async (candidateId) => {
    try {
      const response = await fetch('http://localhost:8000/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1, 
          candidate_id: candidateId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Success: " + data.message);
        fetchCandidates(); 
      } else {
        alert("Security Block: " + data.detail);
      }
    } catch (error) {
      console.error("Voting failed:", error);
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/reset', { method: 'POST' });
      if (response.ok) {
        alert("Database reset to 0 for demo!");
        fetchCandidates(); 
      }
    } catch (error) {
      console.error("Reset failed:", error);
    }
  };

  if (loading) return <h2>Loading election data...</h2>

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
      <h1>SecureVote: Official Ballot</h1>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        {candidates.map(candidate => (
          <div key={candidate.candidate_id} style={{ border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px', minWidth: '250px' }}>
            <h2>{candidate.full_name}</h2>
            <p>Current Votes: <strong>{candidate.vote_count}</strong></p>
            <button 
              onClick={() => handleVote(candidate.candidate_id)}
              style={{ padding: '10px 20px', background: '#0078D4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px'}}>
              Cast Vote
            </button>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '4rem', padding: '1rem', borderTop: '2px dashed #ccc' }}>
        <button 
          onClick={handleReset}
          style={{ padding: '10px 20px', background: '#d11a2a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⚠️ Reset Election (Demo Only)
        </button>
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>Clicking this instantly resets all votes to 0 and unlocks the user account so you can repeatedly demonstrate the voting process.</p>
      </div>
    </div>
  )
}

export default App