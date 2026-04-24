# Supabase Deployment Instructions

## Prerequisites
- Supabase project connected to this Make file
- GROQ_API_KEY added as a secret in Supabase settings

## Steps to Deploy

### 1. Run Database Migration
In your Supabase dashboard:
1. Go to SQL Editor
2. Copy and execute the contents of `migrations/20260410000000_create_diary_entries.sql`
3. Verify the `diary_entries` table was created successfully

### 2. Deploy Edge Functions
Using Supabase CLI:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the functions
supabase functions deploy calculate-calories
supabase functions deploy diary-entry
```

### 3. Set Environment Variables
Make sure the GROQ_API_KEY is set in your Supabase project:
- Go to Project Settings > Edge Functions
- Add secret: `GROQ_API_KEY` with value: `your-groq-api-key-here` (check .env.local for local development)

### 4. Enable Secure Mode in Frontend
Once the Edge Functions are deployed:
1. Open `src/app/App.tsx`
2. Change `USE_EDGE_FUNCTIONS` from `false` to `true`
3. The app will now use secure Supabase Edge Functions instead of exposing the API key

## Security Note
With Edge Functions enabled:
- ✅ API key is securely stored in Supabase environment
- ✅ All AI API calls happen server-side
- ✅ Data is persisted in Supabase database instead of localStorage
- ✅ No sensitive credentials exposed in frontend code
