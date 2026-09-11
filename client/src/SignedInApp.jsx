import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from './api.js'
import Onboarding from './Onboarding.jsx'
import PlacementSetup from './PlacementSetup.jsx'
import Capture from './Capture.jsx'
import Dashboard from './Dashboard.jsx'

// Decides which of the four screens (design-spec.md §3) to show: an
// unfinished profile means Onboarding, no active placement means
// PlacementSetup, otherwise the daily-use screens (Capture/Dashboard,
// switched with a plain tab — no router yet, same reasoning as App.jsx).
export default function SignedInApp() {
  const { getToken } = useAuth()
  const [student, setStudent] = useState(null)
  const [placement, setPlacement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('capture')

  useEffect(() => {
    Promise.all([apiFetch(getToken, '/api/student'), apiFetch(getToken, '/api/placements/active')])
      .then(([studentData, placementData]) => {
        setStudent(studentData)
        setPlacement(placementData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [getToken])

  if (loading) return <p className="hint">Loading...</p>
  if (error) return <p className="error">Something went wrong: {error}</p>

  if (!student.year_of_study || !student.medical_school) {
    return <Onboarding onDone={setStudent} />
  }

  if (!placement) {
    return <PlacementSetup onDone={setPlacement} />
  }

  return (
    <>
      <nav className="tab-nav">
        <button className={tab === 'capture' ? 'active' : ''} onClick={() => setTab('capture')}>
          Capture
        </button>
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
          Dashboard
        </button>
      </nav>
      {tab === 'capture' ? <Capture placementId={placement.id} /> : <Dashboard placement={placement} />}
    </>
  )
}
