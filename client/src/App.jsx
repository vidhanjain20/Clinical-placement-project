import { useState } from 'react'
import { SignedIn, SignedOut, SignIn, SignUp, UserButton } from '@clerk/clerk-react'
import SignedInApp from './SignedInApp.jsx'
import './App.css'

// Phase 2 is screen 3 only (capture + result) — design-spec.md §3's other
// screens (onboarding, placement setup, dashboard) are Phase 3. No router:
// Clerk's <SignIn>/<SignUp> manage their own internal navigation fine
// without one, and a single signed-in screen doesn't need routes yet.
function App() {
  const [authMode, setAuthMode] = useState('sign-in')

  return (
    <>
      <SignedOut>
        <div className="auth-screen">
          <h1>Clinical Learning Navigator</h1>
          {authMode === 'sign-in' ? <SignIn routing="virtual" /> : <SignUp routing="virtual" />}
          <button className="link-button" onClick={() => setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in')}>
            {authMode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </SignedOut>
      <SignedIn>
        <header className="app-header">
          <h1>Clinical Learning Navigator</h1>
          <UserButton />
        </header>
        <SignedInApp />
      </SignedIn>
    </>
  )
}

export default App
