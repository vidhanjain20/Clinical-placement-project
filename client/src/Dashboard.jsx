import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from './api.js'

// Screen 4 (design-spec.md §3). The three-way strong/developing/gap split
// and the "recurring gaps" panel aren't fully specified there, so this is
// a deliberate interpretation, not a spec requirement:
// - strong (green): performed 2+ times
// - developing (amber): encountered but not yet performed 2+ times
// - priority gap (red): a placement-map item never encountered at all
// - recurring gaps panel: top gap_tally tags by frequency — struggles the
//   student flagged, which is a different thing from "never encountered"
export default function Dashboard({ placement }) {
  const { getToken } = useAuth()
  const [learnerModel, setLearnerModel] = useState(null)
  const [notes, setNotes] = useState(null)
  const [error, setError] = useState(null)
  const [expandedNoteId, setExpandedNoteId] = useState(null)
  const [summary, setSummary] = useState(placement.summary)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState(null)

  useEffect(() => {
    Promise.all([apiFetch(getToken, '/api/learner-model'), apiFetch(getToken, '/api/notes')])
      .then(([lm, notesList]) => {
        setLearnerModel(lm)
        setNotes(notesList)
      })
      .catch((err) => setError(err.message))
  }, [getToken])

  if (error) return <p className="error">Something went wrong: {error}</p>
  if (!learnerModel || !notes) return <p className="hint">Loading dashboard...</p>

  const map = placement.placement_map
  const conditionsEncountered = map.conditions.filter((c) => lookup(learnerModel.exposure, c)).length
  const skillsPerformed = map.skills.filter((s) => lookup(learnerModel.skills, s)?.performed).length

  const combined = [
    ...map.conditions.map((name) => ({ name, entry: lookup(learnerModel.exposure, name) })),
    ...map.skills.map((name) => ({ name, entry: lookup(learnerModel.skills, name) })),
  ]
  const strong = combined.filter(({ entry }) => entry?.performed && entry.count >= 2)
  const developing = combined.filter(({ entry }) => entry && !(entry.performed && entry.count >= 2))
  const priorityGaps = combined.filter(({ entry }) => !entry)

  const recurringGaps = Object.entries(learnerModel.gap_tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  async function handleGenerateSummary() {
    setGeneratingSummary(true)
    setSummaryError(null)
    try {
      const updated = await apiFetch(getToken, `/api/placements/${placement.id}/summary`, {
        method: 'POST',
        body: JSON.stringify({
          strong: strong.map((s) => s.name),
          developing: developing.map((s) => s.name),
          never_encountered: priorityGaps.map((s) => s.name),
          recurring_gaps: recurringGaps,
          notes_count: notes.length,
        }),
      })
      setSummary(updated.summary)
    } catch (err) {
      setSummaryError(err.message)
    } finally {
      setGeneratingSummary(false)
    }
  }

  return (
    <div className="dashboard">
      <section>
        <h2>{placement.name} progress</h2>
        <p>
          Conditions encountered: {conditionsEncountered}/{map.conditions.length}
        </p>
        <p>
          Skills performed: {skillsPerformed}/{map.skills.length}
        </p>
      </section>

      <section>
        <h2>Where you stand</h2>
        <StatusGroup label="Strong" className="status-strong" items={strong} />
        <StatusGroup label="Developing" className="status-developing" items={developing} />
        <StatusGroup label="Not yet encountered" className="status-gap" items={priorityGaps} />
      </section>

      {recurringGaps.length > 0 && (
        <section>
          <h2>Recurring gaps</h2>
          <div className="tag-group">
            {recurringGaps.map(([tag, count]) => (
              <span className="tag" key={tag}>
                {tag.replace(/_/g, ' ')} ({count}×)
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>History</h2>
        {notes.length === 0 && <p className="hint">No notes yet.</p>}
        <ul className="history-list">
          {notes.map((note) => (
            <li key={note.id}>
              <button className="history-card" onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}>
                <span>{new Date(note.date).toLocaleDateString()}</span>
                <span>{note.structured?.summary ?? note.raw_text.slice(0, 60)}</span>
              </button>
              {expandedNoteId === note.id && (
                <div className="history-detail">
                  <p>{note.raw_text}</p>
                  {note.gaps.length > 0 && (
                    <div className="tag-group">
                      {note.gaps.map((gap) => (
                        <span className="tag" key={gap}>
                          {gap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Placement summary</h2>
        <button onClick={handleGenerateSummary} disabled={generatingSummary}>
          {generatingSummary ? 'Generating...' : summary ? 'Regenerate summary' : 'Generate placement summary'}
        </button>
        {summaryError && <p className="error">{summaryError}</p>}
        {summary && (
          <div className="placement-summary">
            {summary.narrative.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            {summary.recommended_next_steps?.length > 0 && (
              <>
                <h3>Recommended next steps</h3>
                <ul>
                  {summary.recommended_next_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function StatusGroup({ label, className, items }) {
  if (items.length === 0) return null
  return (
    <div className="status-group">
      <span className="tag-label">{label}:</span>
      {items.map(({ name }) => (
        <span className={`tag ${className}`} key={name}>
          {name}
        </span>
      ))}
    </div>
  )
}

function lookup(dict, name) {
  return dict[name.trim().toLowerCase()]
}
