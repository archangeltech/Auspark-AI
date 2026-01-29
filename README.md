# AusPark AI - Deployment Guide

## Mobile Testing (Local)
1. Run your server: `npm start`
2. Install localtunnel: `npm install -g localtunnel`
3. Run: `lt --port 8080`
4. Open the generated URL on your iPhone/Android.

## Deployment to Google Play (Android)
To fix "API Key missing" errors in your Android app, you **must** provide the key during the build process.

### Option A: Use a .env file (Recommended)
1. Create a file named `.env` in the project root.
2. Add your key: `API_KEY=your_actual_key_here`
3. Run the build:
   ```bash
   npm run build
   npx cap sync android
   ```
4. Open Android Studio and generate your Signed Bundle (.aab).

### Option B: Terminal Environment Variable
**macOS / Linux:**
```bash
API_KEY=your_key_here npm run build
npx cap sync android
```

**Windows (PowerShell):**
```powershell
$env:API_KEY="your_key_here"; npm run build
npx cap sync android
```

## Production (Vercel - Recommended)
1. Push this folder to a GitHub repository.
2. Link the repository to [Vercel](https://vercel.com).
3. Add your `API_KEY` in the Environment Variables section.
4. Deploy.

## Production (Google Cloud Run)
The `server.js` is already configured for Cloud Run. 
- Build command: `gcloud builds submit --tag gcr.io/PROJECT-ID/auspark-ai`
- Deploy command: `gcloud run deploy --image gcr.io/PROJECT-ID/auspark-ai --platform managed --set-env-vars API_KEY=YOUR_KEY`