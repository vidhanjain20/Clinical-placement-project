import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from './api.js'

// Screen 1 (design-spec.md §3): year + medical school, one field per step,
// not a form. "Current placement" — the third field mentioned there — is
// what PlacementSetup collects next; there's no separate field for it
// here, onboarding just flows straight into that screen once this is done.
export default function Onboarding({ onDone }) {
  const { getToken } = useAuth()
  const [step, setStep] = useState(0)
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [medicalSchool, setMedicalSchool] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function finish(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const student = await apiFetch(getToken, '/api/student', {
        method: 'PATCH',
        body: JSON.stringify({ year_of_study: yearOfStudy, medical_school: medicalSchool }),
      })
      onDone(student)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (step === 0) {
    return (
      <OnboardingStep
        label="What year of study are you in?"
        value={yearOfStudy}
        onChange={setYearOfStudy}
        onNext={(e) => {
          e.preventDefault()
          setStep(1)
        }}
        placeholder="e.g. 4th year"
        buttonLabel="Next"
      />
    )
  }

  return (
    <OnboardingStep
      label="Which medical school?"
      value={medicalSchool}
      onChange={setMedicalSchool}
      onNext={finish}
      placeholder="e.g. Imperial College London"
      buttonLabel="Continue"
      submitting={submitting}
      error={error}
    />
  )
}

function OnboardingStep({ label, value, onChange, onNext, placeholder, buttonLabel, submitting, error }) {
  return (
    <form className="onboarding-step" onSubmit={onNext}>
      <label htmlFor="onboarding-field">{label}</label>
      <input
        id="onboarding-field"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
      />
      <button type="submit" disabled={!value.trim() || submitting}>
        {submitting ? 'Saving...' : buttonLabel}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
