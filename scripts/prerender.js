// Build-time prerender: renders the public pages to static HTML so search
// engines see real content without running JavaScript. The client still
// mounts with createRoot, which replaces this markup on load.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const SSR = path.join(ROOT, 'dist-ssr')
const SITE = 'https://dhanshrisgamingvault.vercel.app'

const PAGES = [
  {
    url: '/',
    title: "Dhanshri's Gaming Vault | PS5 & Xbox on Rent in Nagpur",
    description:
      'Rent a PS5, Xbox or PS4 in Nagpur from ₹599/day. Home delivery and setup included. Book online on WhatsApp.',
  },
  {
    url: '/apparels',
    title: "Dhanshri's Store | Gaming Gear & More, Delivered in Nagpur",
    description:
      'Shop consoles, games, controllers and more from Dhanshri’s Store. Home delivery across Nagpur, cash on delivery.',
  },
  {
    url: '/build',
    title: "Custom PC & AI Workstation Builder | Dhanshri's Gaming Vault",
    description:
      'Design a custom gaming PC, workstation or AI lab. Set a budget or pick every part, priced from real components.',
  },
]

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`)
  return html.replace(re, `$1${escapeAttr(value)}$2`)
}

const { render } = await import(pathToFileURL(path.join(SSR, 'entry-server.js')).href)
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')

// Un-rendered shell for every other route (cart, product pages, admin), so
// they don't flash homepage markup or claim the homepage as their canonical.
fs.writeFileSync(
  path.join(DIST, 'spa.html'),
  template.replace(/\s*<link rel="canonical"[^>]*>/, ''),
)

for (const page of PAGES) {
  const canonical = SITE + page.url
  let html = template
    .replace('<div id="root"></div>', `<div id="root">${render(page.url)}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(page.title)}</title>`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`)
  html = setMeta(html, 'name', 'description', page.description)
  html = setMeta(html, 'property', 'og:title', page.title)
  html = setMeta(html, 'property', 'og:description', page.description)
  html = setMeta(html, 'property', 'og:url', canonical)

  const out = path.join(DIST, page.url, 'index.html')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
  console.log(`prerendered ${page.url} -> ${path.relative(ROOT, out)}`)
}

fs.rmSync(SSR, { recursive: true, force: true })
