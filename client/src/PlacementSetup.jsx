import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from './api.js'

// Screen 2 (design-spec.md §3): name + duration -> AI generates a
// PlacementMap -> student reviews and edits it before it becomes the
// tracking reference for the placement. Two stages in one component
// because the review step only exists in relation to what was generated.
export default function PlacementSetup({ onDone }) {
  const { getToken } = useAuth()
  const [name, setName] = useState('')
  const [durationWeeks, setDurationWeeks] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [placement, setPlacement] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setGenerating(true)
    setError(null)
    try {
      const created = await apiFetch(getToken, '/api/placements', {
        method: 'POST',
        body: JSON.stringify({ name, duration_weeks: Number(durationWeeks) }),
      })
      setPlacement(created)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleConfirm(editedMap) {
    setError(null)
    try {
      const updated = await apiFetch(getToken, `/api/placements/${placement.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ placement_map: editedMap }),
      })
      onDone(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  if (placement) {
    return <PlacementMapReview placement={placement} onConfirm={handleConfirm} error={error} />
  }

  return (
    <form className="placement-setup" onSubmit={handleGenerate}>
      <h2>Set up your placement</h2>
      <label htmlFor="placement-name">Placement name</label>
      <input
        id="placement-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Cardiology"
        autoFocus
      />
      <label htmlFor="placement-duration">Duration (weeks)</label>
      <input
        id="placement-duration"
        type="number"
        min="1"
        value={durationWeeks}
        onChange={(e) => setDurationWeeks(e.target.value)}
        placeholder="e.g. 4"
      />
      <button type="submit" disabled={!name.trim() || !durationWeeks || generating}>
        {generating ? 'Generating...' : 'Generate placement map'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}

function PlacementMapReview({ placement, onConfirm, error }) {
  const [map, setMap] = useState(placement.placement_map)

  function removeItem(category, item) {
    setMap({ ...map, [category]: map[category].filter((i) => i !== item) })
  }

  function addItem(category, item) {
    if (!item.trim() || map[category].includes(item.trim())) return
    setMap({ ...map, [category]: [...map[category], item.trim()] })
  }

  return (
    <div className="placement-review">
      <h2>{placement.name} — review your placement map</h2>
      <p className="hint">AI-generated starting point — add or remove anything before you start.</p>
      <EditableList label="Conditions" items={map.conditions} onRemove={(i) => removeItem('conditions', i)} onAdd={(i) => addItem('conditions', i)} />
      <EditableList label="Skills" items={map.skills} onRemove={(i) => removeItem('skills', i)} onAdd={(i) => addItem('skills', i)} />
      <EditableList label="Competencies" items={map.competencies} onRemove={(i) => removeItem('competencies', i)} onAdd={(i) => addItem('competencies', i)} />
      <button onClick={() => onConfirm(map)}>Start this placement</button>
      {error && <p className="error">{error}</p>}
    </div>
  )
}

function EditableList({ label, items, onRemove, onAdd }) {
  const [draft, setDraft] = useState('')
  return (
    <div className="editable-list">
      <h3>{label}</h3>
      <div className="tag-group">
        {items.map((item) => (
          <span className="tag removable" key={item}>
            {item}
            <button type="button" aria-label={`Remove ${item}`} onClick={() => onRemove(item)}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="add-row">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Add ${label.toLowerCase()}...`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd(draft)
              setDraft('')
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            onAdd(draft)
            setDraft('')
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}
