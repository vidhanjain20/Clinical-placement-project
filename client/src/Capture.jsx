import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from './api.js'

const MIN_LENGTH = 20 // matches server/src/routes/notes.js's own check
const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition

// Screen 3 from design-spec.md: capture a note, then show what came back
// from the two Claude calls (extraction + recommendation). One component
// because the two are never seen independently — result only exists in
// relation to the note that produced it.
export default function Capture({ placementId }) {
  const { getToken } = useAuth()
  const [rawText, setRawText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const baseTextRef = useRef('') // rawText as it was when the mic was tapped — voice appends after it, never overwrites it
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    if (!SpeechRecognitionApi) return
    const recognition = new SpeechRecognitionApi()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript
        } else {
          interimTranscript += transcript
        }
      }
      setRawText(`${baseTextRef.current}${finalTranscriptRef.current}${interimTranscript}`)
    }
    // Covers both a genuine error and a silent recording (empty result):
    // design-spec.md §5 says either should just reset the mic, no error shown.
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    return () => recognition.stop()
  }, [])

  function toggleListening() {
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }
    baseTextRef.current = rawText ? `${rawText} ` : ''
    finalTranscriptRef.current = ''
    recognitionRef.current.start()
    setListening(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const body = await apiFetch(getToken, '/api/notes', {
        method: 'POST',
        body: JSON.stringify({ raw_text: rawText, placement_id: placementId }),
      })
      setResult(body)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const tooShort = rawText.trim().length < MIN_LENGTH

  return (
    <div className="capture-screen">
      <form onSubmit={handleSubmit}>
        <label htmlFor="raw-text">What did you see today?</label>
        <div className="textarea-wrap">
          <textarea
            id="raw-text"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={6}
            placeholder="e.g. Clerked a patient with CHF, struggled to hear the S3 gallop..."
          />
          {SpeechRecognitionApi && (
            <button
              type="button"
              className={`mic-button${listening ? ' listening' : ''}`}
              onClick={toggleListening}
              aria-label={listening ? 'Stop voice input' : 'Start voice input'}
              title={listening ? 'Stop voice input' : 'Start voice input'}
            >
              🎤
            </button>
          )}
        </div>
        <button type="submit" disabled={submitting || tooShort}>
          {submitting ? 'Processing...' : 'Submit'}
        </button>
        {tooShort && rawText.length > 0 && (
          <p className="hint">Add a little more detail — even a sentence is enough.</p>
        )}
      </form>

      {error && <p className="error">Something went wrong: {error}</p>}

      {result && <ResultPanel result={result} onRetry={() => handleSubmit({ preventDefault() {} })} />}
    </div>
  )
}

// design-spec.md §5's error-handling table drives the branches here:
// extraction can fail outright (note still saved, raw text never lost),
// or extraction can succeed while recommendation fails independently.
function ResultPanel({ result, onRetry }) {
  if (result.extraction_status === 'failed') {
    return (
      <div className="result-panel">
        <p>{result.message}</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    )
  }

  const { structured, next_actions: nextActions, recommendations_available: recommendationsAvailable } = result

  return (
    <div className="result-panel">
      <section>
        <h2>What we picked up</h2>
        <TagGroup label="Conditions" items={structured.conditions} />
        <TagGroup label="Skills" items={structured.skills} />
        <TagGroup label="Gaps" items={structured.gaps} />
      </section>

      <section>
        <h2>Recommendations</h2>
        {recommendationsAvailable ? (
          <ul className="recommendations">
            {nextActions.map((action, i) => (
              <li key={i}>
                <strong>{action.topic}</strong>
                <p>{action.why}</p>
                <p>{action.how}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">Recommendations unavailable — try refreshing.</p>
        )}
      </section>
    </div>
  )
}

function TagGroup({ label, items }) {
  if (!items || items.length === 0) return null
  return (
    <div className="tag-group">
      <span className="tag-label">{label}:</span>
      {items.map((item) => (
        <span className="tag" key={item}>
          {item}
        </span>
      ))}
    </div>
  )
}
