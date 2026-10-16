/** An HTML page that immediately POSTs a form to a payment gateway (with a manual button as fallback). */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function autoPostResponse(action: string, fields: Record<string, string>, label = 'Continue to secure payment') {
  const inputs = Object.entries(fields).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Redirecting to payment…</title>
<style>body{font:16px/1.6 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#faf6ee;color:#26302b}
button{font:inherit;padding:.8em 1.5em;border-radius:999px;border:0;background:#12382d;color:#fff;cursor:pointer}</style></head>
<body><form method="post" action="${esc(action)}">${inputs}<p>Taking you to Easypaisa's secure payment page…</p>
<noscript><button>${esc(label)}</button></noscript></form><script>document.forms[0].submit()</script></body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
}
