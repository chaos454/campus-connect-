# Deploy Campus Connect

## Prerequisites (do once)

1. **Database** — [Supabase SQL Editor](https://supabase.com/dashboard/project/asjaybuusyfnostqsigk/sql/new) → paste `SETUP_ALL.sql` → **Run**
2. **Email auth** — Supabase → Authentication → Providers → enable **Email**
3. After you get a live URL, set Auth URLs (see bottom of this file)

---

## Option A — Netlify (via GitHub)

### 1. Push code to GitHub

```powershell
cd "C:\Users\Harshit\Documents\campus connect"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

git init
git add .
git commit -m "Campus Connect - Netlify ready"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/campus-connect.git
git push -u origin main
```

### 2. Connect Netlify to GitHub

1. Go to [https://app.netlify.com](https://app.netlify.com) → **Sign up with GitHub**
2. **Add new site** → **Import an existing project**
3. Choose the **campus-connect** repo
4. Build settings are already in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist/client`
5. **Before deploying**, open **Environment variables** and add:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://asjaybuusyfnostqsigk.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your Supabase **anon** key |
| `SUPABASE_URL` | `https://asjaybuusyfnostqsigk.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | same anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your **service_role** key |

Keys: [Supabase → Settings → API](https://supabase.com/dashboard/project/asjaybuusyfnostqsigk/settings/api)

6. Click **Deploy site**

Your site will be at something like:  
`https://random-name-123.netlify.app`

You can rename it under **Site configuration → Domain management**.

### 3. CLI alternative (optional)

```powershell
npm install
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_SUPABASE_URL "https://asjaybuusyfnostqsigk.supabase.co"
# set the other env vars the same way, then:
netlify deploy --prod
```

---

## Option B — Vercel

See previous setup: import the same GitHub repo at [vercel.com/new](https://vercel.com/new), add the same env vars, deploy.  
`vercel.json` is already in the project.

---

## After deploy — Supabase Auth URLs

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://YOUR-SITE.netlify.app`
- **Redirect URLs:**  
  `https://YOUR-SITE.netlify.app/**`  
  `http://localhost:3000/**`

Save, then test signup with a college email.

---

## Local production test

```powershell
npm install
npm run build
npm start
```
