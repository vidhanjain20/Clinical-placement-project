import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Proxying /api means the browser only ever talks to whatever host served
// the page (localhost, a LAN IP, a tunnel — doesn't matter which), and the
// actual hop to the Express server on :4000 happens process-to-process on
// this machine, not over the network. Avoids the client needing to know
// the server's address at all.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
    // Vite blocks unrecognized Host headers by default (DNS-rebinding
    // protection) — needed to accept requests arriving through a tunnel
    // (localtunnel/ngrok) rather than localhost or a LAN IP directly.
    allowedHosts: ['.loca.lt'],
  },
})
