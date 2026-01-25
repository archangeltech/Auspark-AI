
# AusPark AI - Deployment Guide

## Mobile Testing (Local)
1. Run your server: `npm start`
2. Install localtunnel: `npm install -g localtunnel`
3. Run: `lt --port 8080`
4. Open the generated URL on your iPhone/Android.

## Production (Vercel - Recommended)
1. Push this folder to a GitHub repository.
2. Link the repository to [Vercel](https://vercel.com).
3. Add your `API_KEY` in the Environment Variables section.
4. Deploy.

## Production (Google Cloud Run)
The `server.js` is already configured for Cloud Run. 
- Build command: `gcloud builds submit --tag gcr.io/PROJECT-ID/auspark-ai`
- Deploy command: `gcloud run deploy --image gcr.io/PROJECT-ID/auspark-ai --platform managed --set-env-vars API_KEY=YOUR_KEY`
