// Every authenticated call needs the same three things: a fresh Clerk
// token, the Bearer header, and JSON parsing — worth centralizing now
// that Onboarding/PlacementSetup/Dashboard/Capture all need it, unlike
// Phase 2 where Capture was the only caller.
export async function apiFetch(getToken, path, options = {}) {
  const token = await getToken()
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.error || `Request failed (${response.status})`)
  }
  return body
}
