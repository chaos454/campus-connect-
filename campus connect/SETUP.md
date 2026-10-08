# One-time setup (do this once)

## 1. Supabase keys (30 seconds)

1. Open: https://supabase.com/dashboard/project/asjaybuusyfnostqsigk/settings/api  
2. Copy **Project URL** (already filled), **anon public** key, and **service_role** key  
3. Open `.env.local` in this folder and replace the `PASTE_YOUR_...` values  

## 2. Database (1 minute)

1. Open: https://supabase.com/dashboard/project/asjaybuusyfnostqsigk/sql/new  
2. Paste the entire contents of `SETUP_ALL.sql`  
3. Click **Run**  

This creates tables, RLS, RPCs, demo data, and **150+ Indian college domains**.  
Any other `*.ac.in` / `*.edu.in` email is accepted automatically.

## 3. Auth settings

In Supabase → **Authentication → Providers**:

- Enable **Email** (email + password)
- (Optional) Enable **Google** and add your OAuth client IDs

In **Authentication → URL Configuration**, add:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

## 4. Run the app

```powershell
cd "C:\Users\Harshit\Documents\campus connect"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
npm run dev
```

Open http://localhost:3000 and sign up with any college email, e.g. `you@iitk.ac.in`.

When the database is ready, see **DEPLOY.md** to publish the site.
