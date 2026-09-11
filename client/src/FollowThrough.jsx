import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from './api.js'

// design-spec.md §3 Screen 3: "Did you act on this?" prompt for previous
// day's recommendations, shown at the top if unanswered. Kept to a plain
// yes/no in the UI even though the outcome column accepts any of
// design-spec.md's six values (sought/observed/performed/practised/
// completed/skipped) — "did you act on this?" is itself a yes/no
// question, so that's what the buttons ask.
export default function FollowThrough() {
  const { getToken } = useAuth()
  const [pending, setPending] = useState([])

  useEffect(() => {
    apiFetch(getToken, '/api/action-log/pending')
      .then(setPending)
      .catch(() => {}) // non-critical — the capture screen still works if this fails
  }, [getToken])

  async function respond(id, outcome) {
    setPending((current) => current.filter((a) => a.id !== id)) // optimistic — this is a low-stakes log, not worth blocking on
    try {
      await apiFetch(getToken, `/api/action-log/${id}`, { method: 'PATCH', body: JSON.stringify({ outcome }) })
    } catch {
      // silently drop — worst case it resurfaces next visit, which is fine for a nudge like this
    }
  }

  if (pending.length === 0) return null

  return (
    <div className="follow-through">
      {pending.map((action) => (
        <div className="follow-through-item" key={action.id}>
          <p>Did you act on this: {action.action_text}?</p>
          <div className="follow-through-buttons">
            <button onClick={() => respond(action.id, 'completed')}>Yes</button>
            <button onClick={() => respond(action.id, 'skipped')}>Not yet</button>
          </div>
        </div>
      ))}
    </div>
  )
}
