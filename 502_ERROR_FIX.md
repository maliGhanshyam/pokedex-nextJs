# Fixing 502 Bad Gateway Error

## What is a 502 Error?

A **502 Bad Gateway** error means your frontend cannot connect to your backend service. This typically happens when:

1. **Backend service is down/crashed**
2. **Backend is restarting** (common on Render free tier after inactivity)
3. **Backend failed to start** (startup errors)
4. **Backend is in a restart loop** (crashing repeatedly)

## How to Fix

### Step 1: Check Backend Service Status on Render

1. Go to your **backend service** on Render dashboard: `pokedexbackend-gz01`
2. Check the **Status**:
   - ✅ **Live** = Service is running (should work)
   - ⚠️ **Starting** = Service is starting up (wait a minute)
   - ❌ **Failed** = Service failed to start (check logs)

### Step 2: Check Backend Logs

1. Go to your backend service → **Logs** tab
2. Look for recent errors or crashes
3. Check for:
   - Database connection errors
   - Missing environment variables
   - Application crashes

### Step 3: Common Issues and Solutions

#### Issue 1: Backend Crashed on Startup

**Symptoms**: Logs show errors like:
- `Cannot connect to database`
- `relation "pokemon" does not exist`
- Application crashes immediately after starting

**Solution**: 
1. Verify `DB_SYNCHRONIZE=true` is set in environment variables
2. Verify all database connection variables are set correctly:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `DB_DATABASE`
3. Check database service is running (on Render dashboard)

#### Issue 2: Cold Start (Free Tier)

**Symptoms**: Service shows "Starting" status

**Solution**: 
- Wait 30-60 seconds for the service to start
- Free tier services "spin down" after 15 minutes of inactivity
- First request after spin-down takes longer (cold start)

#### Issue 3: Application Restart Loop

**Symptoms**: Service keeps restarting, logs show repeated startup attempts

**Solution**:
1. Check logs for the specific error causing crashes
2. Common causes:
   - Missing required environment variables
   - Database connection issues
   - Port conflicts
   - Syntax errors in code

#### Issue 4: Missing Environment Variables

**Required Variables**:
```
DB_HOST=your_db_host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=pokedex
DB_SYNCHRONIZE=true  ← Important for initial setup!
JWT_SECRET=your_jwt_secret
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d
POKEAPI_BASE_URL=https://pokeapi.co/api/v2
CORS_ORIGIN=https://your-frontend-url.onrender.com
NODE_ENV=production
PORT=10000  (or let Render set this automatically)
```

### Step 4: Verify Database Service is Running

1. Go to your **PostgreSQL database** service on Render
2. Check status is **Available**
3. If it's not, the backend can't connect and will crash

### Step 5: Manual Restart

If the service seems stuck:

1. Go to backend service → **Manual Deploy**
2. Click **Clear build cache & deploy**
3. Wait for deployment to complete
4. Check logs for any errors

### Step 6: Test Backend Directly

Once the service is "Live", test it directly:

```bash
# Test health/root endpoint
curl https://pokedexbackend-gz01.onrender.com/

# Test Pokemon endpoint (should return empty array if tables don't exist, or error if backend is down)
curl https://pokedexbackend-gz01.onrender.com/pokemon?limit=10
```

If you get a response (even an error), the backend is running.
If you get 502, the backend is down.

## Quick Checklist

- [ ] Backend service status is "Live" (not "Starting" or "Failed")
- [ ] Database service status is "Available"
- [ ] All required environment variables are set
- [ ] `DB_SYNCHRONIZE=true` is set (for initial setup)
- [ ] Backend logs show successful startup (no errors)
- [ ] Can access backend URL directly (not 502)

## Still Getting 502?

1. **Check Render Status Page**: https://status.render.com
   - Service-wide outages are rare but possible

2. **Review Backend Logs**:
   - Look for the LAST error before the service stopped
   - That's usually the cause

3. **Verify Build Succeeded**:
   - Check deployment logs for build errors
   - Build must complete successfully for service to start

4. **Check Port Configuration**:
   - Render sets PORT automatically
   - Make sure your code uses `process.env.PORT || 3001`

5. **Wait for Cold Start**:
   - Free tier services can take 30-60 seconds to start
   - Be patient on first request after inactivity

## Expected Logs on Successful Startup

When the backend starts correctly, you should see:
```
[Nest] INFO Starting Nest application...
[Nest] INFO [TypeOrmModule] successfully connected to database
[Nest] INFO [PokemonSyncService] Application started, initializing database...
[Nest] INFO [NestApplication] Nest application successfully started on port XXXX
```

If you see errors before "successfully started", that's the problem!

