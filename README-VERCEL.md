# Vercel Deployment Fix

If you're still getting the `.next/routes-manifest.json` error, follow these steps:

## 1. Check Vercel Project Settings

In your Vercel dashboard:
- Go to your project settings
- Navigate to "Settings" → "General"
- Under "Framework Preset", make sure it's set to **"Other"** or **"Vite"** (NOT Next.js)
- If it's set to Next.js, change it and redeploy

## 2. Clear Build Cache

In Vercel dashboard:
- Go to "Settings" → "Build & Development Settings"
- Click "Clear Build Cache"
- Redeploy

## 3. Verify Configuration

The `vercel.json` should have:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 4. Manual Override

If the above doesn't work, in Vercel dashboard:
- Go to "Settings" → "Build & Development Settings"
- Set "Framework Preset" to "Other"
- Set "Build Command" to: `npm run build`
- Set "Output Directory" to: `dist`
- Set "Install Command" to: `npm install`
- Save and redeploy

