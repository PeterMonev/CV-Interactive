# Peter Monev — Interactive CV

An interactive, animated resume built with React + Three.js.

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Build for production

```bash
npm run build
```

Output goes to the `dist/` folder.

## Deploy for free

**Vercel (recommended, easiest):**
1. Push this folder to a GitHub repo (see below).
2. Go to https://vercel.com → sign in with GitHub → "Add New Project" → pick this repo.
3. Vercel auto-detects Vite. Click **Deploy**. Done — you get a live `.vercel.app` URL.

**Netlify (just as easy):**
1. Push to GitHub.
2. Go to https://netlify.com → "Add new site" → "Import an existing project" → pick the repo.
3. Build command: `npm run build`, publish directory: `dist`. Click **Deploy**.

**GitHub Pages (free, a bit more manual):**
1. In `vite.config.js`, uncomment `base: "/repo-name/"` and set it to your actual repo name.
2. `npm install -D gh-pages`
3. Add to `package.json` scripts: `"deploy": "vite build && gh-pages -d dist"`
4. `npm run deploy`
5. In the GitHub repo settings → Pages → set source to the `gh-pages` branch.
