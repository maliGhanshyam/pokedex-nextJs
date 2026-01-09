# Complete Deployment Guide for Pokedex App on Render

This guide will walk you through deploying both the **Backend (NestJS)** and **Frontend (Next.js)** applications on Render, along with setting up a PostgreSQL database.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Step 1: Prepare Your Repository](#step-1-prepare-your-repository)
4. [Step 2: Create PostgreSQL Database on Render](#step-2-create-postgresql-database-on-render)
5. [Step 3: Deploy Backend (NestJS)](#step-3-deploy-backend-nestjs)
6. [Step 4: Deploy Frontend (Next.js)](#step-4-deploy-frontend-nextjs)
7. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
8. [Step 6: Database Setup (Migrations & Seeding)](#step-6-database-setup-migrations--seeding)
9. [Step 7: Update CORS Configuration](#step-7-update-cors-configuration)
10. [Step 8: Testing Your Deployment](#step-8-testing-your-deployment)
11. [Troubleshooting](#troubleshooting)
12. [Post-Deployment](#post-deployment)

---

## Prerequisites

Before starting, ensure you have:

- ✅ A GitHub, GitLab, or Bitbucket account
- ✅ Your code pushed to a repository
- ✅ A Render account (sign up at [render.com](https://render.com))
- ✅ Basic understanding of environment variables
- ✅ Node.js 20.x or higher (verified locally)

---

## Project Structure

```
pokedex-nextJs/
├── server/          # NestJS Backend API
│   ├── src/
│   ├── package.json
│   └── ...
├── client/          # Next.js Frontend
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
```

---

## Step 1: Prepare Your Repository

### 1.1 Ensure .gitignore is Configured

Make sure your `.gitignore` includes:

```gitignore
# Dependencies
node_modules/
package-lock.json

# Build outputs
dist/
.next/
build/
out/

# Environment files
.env
.env.local
.env*.local

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### 1.2 Commit and Push Your Code

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## Step 2: Create PostgreSQL Database on Render

### 2.1 Create Database Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure the database:
   - **Name**: `pokedex-db` (or your preferred name)
   - **Database**: `pokedex` (or leave default)
   - **User**: Leave default (auto-generated)
   - **Region**: Choose closest to your location
   - **PostgreSQL Version**: Latest (recommended)
   - **Plan**: Free tier (or your preferred plan)
4. Click **"Create Database"**

### 2.2 Save Database Connection String

Once created, Render will provide:
- **Internal Database URL**: For backend services (same private network)
- **External Database URL**: For external connections

**Important**: Note down the connection string from the dashboard. It looks like:
```
postgresql://username:password@dpg-xxxxx-a/pokedex
```

You'll need these values:
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`

---

## Step 3: Deploy Backend (NestJS)

### 3.1 Create Web Service for Backend

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your repository
3. Configure the service:

#### Basic Settings:
- **Name**: `pokedex-backend` (or your preferred name)
- **Region**: Same as database (for better performance)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `server` ⚠️ **Important: Set this to `server`**
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`
- **Plan**: Free tier (or your preferred plan)

**Important Build Command Note**: 
- The build script uses `tsc` (TypeScript compiler) directly
- This is more reliable than using the NestJS CLI on Render
- TypeScript is already included in devDependencies

#### Environment Variables:

Add these environment variables (we'll configure values in Step 5):

- `NODE_ENV` = `production`
- `PORT` = `10000` (Render sets this automatically, but you can specify)
- `DB_HOST` = (from database connection string)
- `DB_PORT` = `5432` (usually)
- `DB_USERNAME` = (from database connection string)
- `DB_PASSWORD` = (from database connection string)
- `DB_DATABASE` = `pokedex` (or your database name)
- `JWT_SECRET` = (generate a strong random string)
- `JWT_ACCESS_TOKEN_EXPIRATION` = `15m`
- `JWT_REFRESH_TOKEN_EXPIRATION` = `7d`
- `POKEAPI_BASE_URL` = `https://pokeapi.co/api/v2`
- `CORS_ORIGIN` = (leave empty for now, we'll update after frontend deployment)

### 3.2 Advanced Settings

- **Health Check Path**: `/` (or create a health endpoint)
- **Auto-Deploy**: `Yes` (deploys on every push to main branch)

### 3.3 Create the Service

Click **"Create Web Service"** to start deployment.

**Note**: The first deployment may fail if the database isn't set up. That's okay - we'll run migrations next.

---

## Step 4: Deploy Frontend (Next.js)

### 4.1 Create Web Service for Frontend

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect the same repository
3. Configure the service:

#### Basic Settings:
- **Name**: `pokedex-frontend` (or your preferred name)
- **Region**: Same as backend
- **Branch**: `main`
- **Root Directory**: `client` ⚠️ **Important: Set this to `client`**
- **Runtime**: `Node`
- **Service Type**: ⚠️ **CRITICAL: Choose "Web Service" NOT "Static Site"** (Next.js requires a Node.js server)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free tier (or your preferred plan)

**⚠️ IMPORTANT**: Next.js is a server-side rendered framework and requires a Node.js runtime. Do NOT select "Static Site" - you must use "Web Service".

**Build Optimization**: 
- Type checking and linting are disabled during production builds for faster deployment
- Errors will still be caught in development mode
- If you want strict type checking in production, remove the `ignoreBuildErrors` and `ignoreDuringBuilds` options from `next.config.ts`

#### Environment Variables:

- `NODE_ENV` = `production`
- `NEXT_PUBLIC_API_URL` = (your backend URL, e.g., `https://pokedex-backend.onrender.com`)

**Important**: 
- Use `NEXT_PUBLIC_` prefix for frontend environment variables
- Use the backend URL from Step 3 (will be something like `https://pokedex-backend.onrender.com`)

### 4.2 Advanced Settings

- **Health Check Path**: `/`
- **Auto-Deploy**: `Yes`

### 4.3 Create the Service

Click **"Create Web Service"** to start deployment.

---

## Step 5: Configure Environment Variables

After both services are created, update environment variables with correct values:

### 5.1 Backend Environment Variables

Go to your backend service → **Environment** tab:

1. **Database Variables** (from Step 2.2):
   ```
   DB_HOST=dpg-xxxxx-a
   DB_PORT=5432
   DB_USERNAME=pokedex_user
   DB_PASSWORD=your_password_here
   DB_DATABASE=pokedex
   ```

2. **JWT Secret** (generate a secure random string):
   ```bash
   # Generate on your local machine:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   ```
   JWT_SECRET=your_generated_secret_here
   ```

3. **Database Synchronization** (for initial setup):
   ```
   DB_SYNCHRONIZE=true
   ```
   ⚠️ **Important**: This creates tables automatically. Safe for initial setup on fresh database. You can remove it after tables are created.

4. **CORS Origin** (update after frontend is deployed):
   ```
   CORS_ORIGIN=https://pokedex-frontend.onrender.com
   ```

### 5.2 Frontend Environment Variables

Go to your frontend service → **Environment** tab:

```
NEXT_PUBLIC_API_URL=https://pokedex-backend.onrender.com
```

**Note**: Replace `pokedex-backend` and `pokedex-frontend` with your actual service names.

### 5.3 Apply Changes

After updating environment variables:
- Backend will automatically redeploy
- Frontend may need manual redeploy (click "Manual Deploy" → "Clear build cache & deploy")

---

## Step 6: Database Setup (Create Tables)

### 6.1 Quick Setup: Enable Synchronize (Recommended for Initial Setup)

Since your database is fresh, the easiest way to create tables is to enable TypeORM's synchronize feature:

1. **Go to your backend service on Render**
2. **Click Settings → Environment**
3. **Add environment variable**:
   - **Key**: `DB_SYNCHRONIZE`
   - **Value**: `true`
4. **Save Changes** (this will trigger a redeploy)
5. **After deployment completes**, tables will be automatically created

**⚠️ Important**: 
- This is safe for initial setup on a fresh database
- After tables are created and working, you can optionally remove `DB_SYNCHRONIZE` for production safety
- The app will continue working without it (synchronize will be disabled)

### 6.2 Verify Tables Are Created

After deployment:
1. Test your API endpoint: `https://your-backend.onrender.com/pokemon?limit=10`
2. If it works, tables were created successfully
3. If you get a "relation does not exist" error, check that `DB_SYNCHRONIZE=true` is set

### 6.3 Alternative: Use Migrations (Advanced)

If you prefer to use migrations instead:

1. **Connect via Render Shell**:
   - Go to backend service → Shell tab
   - Run: `cd server && npm run migration:run`

2. **Or create migrations locally** and run them on Render

**Note**: For initial setup, enabling synchronize is the simplest approach.

### 6.4 Seed Database (Optional)

If you have a seed script and want to create a demo user:

1. Connect via Render Shell
2. Run: `cd server && npm run seed`

This creates a demo user:
- Email: `demo@example.com`
- Password: `password123`

---

## Step 7: Update CORS Configuration

After frontend is deployed:

1. **Get Frontend URL**: 
   - Go to frontend service dashboard
   - Copy the service URL (e.g., `https://pokedex-frontend.onrender.com`)

2. **Update Backend CORS**:
   - Go to backend service → Environment tab
   - Update `CORS_ORIGIN` to your frontend URL
   - Save changes (this will trigger a redeploy)

3. **Verify CORS in Code**:
   Check that your backend `main.ts` uses the `CORS_ORIGIN` environment variable:

```typescript
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.enableCors({
  origin: corsOrigin,
  credentials: true,
});
```

---

## Step 8: Testing Your Deployment

### 8.1 Test Backend

1. Visit your backend URL: `https://pokedex-backend.onrender.com`
2. Check health endpoint (if available): `https://pokedex-backend.onrender.com/health`
3. Test API endpoints:
   - `https://pokedex-backend.onrender.com/pokemon?limit=10`
   - Should return pokemon list

### 8.2 Test Frontend

1. Visit your frontend URL: `https://pokedex-frontend.onrender.com`
2. Check browser console for errors
3. Test features:
   - View pokemon list
   - Search functionality
   - Login/Signup
   - Favorites
   - Battle/Compare features

### 8.3 Common Issues

- **CORS Errors**: Ensure `CORS_ORIGIN` in backend matches frontend URL exactly
- **API Connection Errors**: Verify `NEXT_PUBLIC_API_URL` is correct
- **Database Connection Errors**: Check database credentials and ensure database is running

---

## Troubleshooting

### Backend Build Fails

**Error**: "nest: not found" or "could not determine executable to run"

**Solution**:
1. **The build script has been updated** to use `tsc` (TypeScript compiler) directly
   - This is more reliable than using the NestJS CLI
   - Make sure you've pulled the latest code with the updated package.json

2. **If you still get the error**, verify:
   - `typescript` is in `devDependencies` in package.json (it should be)
   - Build Command in Render is: `npm install && npm run build`
   - Root Directory is set to `server`

3. **Alternative**: Use tsc directly in Render Build Command
   - If Root Directory is `server`: Change Build Command to `npm install && npx tsc`
   - If Root Directory is not set: Change to `npm install && cd server && npx tsc`
   - This bypasses the npm script but achieves the same result

4. **Verify TypeScript installation**:
   - Check that `typescript` is listed in `devDependencies`
   - Render should install devDependencies by default unless NODE_ENV=production is set during install

**Error**: "Cannot connect to database"

**Solution**:
1. Verify database is running (check database service status)
2. Verify database credentials are correct
3. Check database connection string format
4. Ensure database allows connections from Render IPs

**Error**: "Port already in use"

**Solution**:
- Render sets PORT automatically, don't hardcode it
- Use `process.env.PORT || 3001` in your code

### Frontend Build Fails

**Error**: "next: not found" or "sh: 1: next: not found"

**Solution**:
1. **Check Service Type**: Make sure you selected "Web Service" NOT "Static Site"
   - Next.js requires a Node.js server runtime
   - Static Site service type won't work for Next.js SSR
   - Delete the static service and create a new Web Service instead

2. **Build script updated**: The package.json now uses `npx next build`
   - Pull latest code: `git pull origin main`
   - Or manually edit `client/package.json`:
     ```json
     "build": "npx next build"
     ```

3. **Verify Root Directory**: Ensure it's set to `client`

4. **Alternative fix in Render** (if you can't update code):
   - Go to Settings → Build Command
   - Change to: `npm install && npx next build`
   - Make sure you're using "Web Service" not "Static Site"

**Error**: "Module not found"

**Solution**:
1. Ensure `Root Directory` is set to `client`
2. Check that all dependencies are in `package.json`
3. Clear build cache: Manual Deploy → "Clear build cache & deploy"

**Error**: "API URL not defined"

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set in environment variables
2. Ensure it starts with `NEXT_PUBLIC_` prefix
3. Redeploy after adding environment variable

**Error**: "Static Site" service type selected

**Solution**:
- ❌ **Wrong**: Static Site (for static HTML/CSS/JS only)
- ✅ **Correct**: Web Service (for Node.js applications like Next.js)
- Delete the Static Site service
- Create a new "Web Service" following Step 4 instructions

### Database Issues

**Error**: "relation 'pokemon' does not exist" or "relation 'users' does not exist"

**Solution**:
1. **Enable database synchronization**:
   - Go to backend service → Environment tab
   - Add: `DB_SYNCHRONIZE=true`
   - Save (this triggers redeploy)
   - Tables will be created automatically

2. **Verify tables exist**:
   - Test API: `https://your-backend.onrender.com/pokemon?limit=10`
   - If it works, tables are created successfully

3. **Alternative**: Use migrations (if you prefer):
   - Connect via Render Shell: `cd server && npm run migration:run`
   - See `DATABASE_SETUP.md` for detailed instructions

4. **After initial setup** (optional):
   - You can remove `DB_SYNCHRONIZE` environment variable
   - App will continue working without it

**Error**: "Too many connections"

**Solution**:
- Free tier has connection limits
- Implement connection pooling in your TypeORM config
- Close connections properly

### CORS Errors

**Error**: "Access-Control-Allow-Origin"

**Solution**:
1. Verify `CORS_ORIGIN` includes protocol (`https://`)
2. Ensure no trailing slash
3. Check backend CORS configuration
4. Redeploy backend after changes

### Performance Issues

**Slow API Responses**:
- Free tier services spin down after inactivity
- First request after spin-down takes longer (cold start)
- Consider upgrading to a paid plan for always-on services

---

## Post-Deployment

### 1. Set Up Custom Domains (Optional)

**Backend**:
1. Go to backend service → Settings → Custom Domains
2. Add your domain
3. Configure DNS as instructed

**Frontend**:
1. Go to frontend service → Settings → Custom Domains
2. Add your domain
3. Configure DNS as instructed
4. Update `CORS_ORIGIN` in backend to new frontend domain

### 2. Monitor Logs

- **Backend Logs**: Service → Logs tab
- **Frontend Logs**: Service → Logs tab
- Check for errors, warnings, or unusual patterns

### 3. Set Up Alerts (Optional)

1. Go to service → Alerts
2. Configure email alerts for:
   - Deployment failures
   - Service crashes
   - High error rates

### 4. Database Backups

Render provides automatic backups for PostgreSQL:
- Free tier: Manual backups
- Paid tiers: Automatic daily backups
- Access backups in Database → Backups tab

### 5. Performance Optimization

**Backend**:
- Enable connection pooling
- Add caching where appropriate
- Optimize database queries
- Use indexes on frequently queried fields

**Frontend**:
- Enable Next.js image optimization
- Use static generation where possible
- Implement proper error boundaries
- Monitor bundle size

---

## Quick Reference: Environment Variables

### Backend Required Variables

```bash
NODE_ENV=production
PORT=10000
DB_HOST=your_db_host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=pokedex
JWT_SECRET=your_jwt_secret
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d
POKEAPI_BASE_URL=https://pokeapi.co/api/v2
DB_SYNCHRONIZE=true  # For initial setup only (creates tables automatically)
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

### Frontend Required Variables

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

---

## Render Service URLs Format

After deployment, your services will have URLs like:

- **Backend**: `https://pokedex-backend-xxxx.onrender.com`
- **Frontend**: `https://pokedex-frontend-xxxx.onrender.com`
- **Database**: Internal connection string (not a URL)

**Note**: On free tier, services may take 30-60 seconds to start if they've been inactive (cold start).

---

## Cost Estimation (Free Tier)

**Free Tier Includes**:
- 1 PostgreSQL database (90 days free trial, then $7/month)
- 2 Web services (spin down after 15 minutes of inactivity)
- 750 hours/month total compute time

**After Free Trial**:
- PostgreSQL: ~$7/month
- Web Services: Free (with limitations)

**Recommended for Production**:
- Upgrade to paid plans for:
  - Always-on services (no spin-down)
  - Better performance
  - More resources
  - Priority support

---

## Security Checklist

Before going to production:

- [ ] Use strong `JWT_SECRET` (random, 32+ characters)
- [ ] Enable HTTPS (automatic on Render)
- [ ] Set secure CORS origins (no wildcards)
- [ ] Use environment variables for all secrets
- [ ] Enable database SSL connections
- [ ] Review and limit API endpoints if needed
- [ ] Implement rate limiting
- [ ] Add input validation on all endpoints
- [ ] Set secure cookie options (if using)
- [ ] Enable database backups

---

## Support Resources

- **Render Documentation**: https://render.com/docs
- **NestJS Deployment**: https://docs.nestjs.com/recipes/deployment
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Render Status**: https://status.render.com
- **Render Community**: https://community.render.com

---

## Quick Deployment Checklist

- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] PostgreSQL database created on Render
- [ ] Backend service created (Root Directory: `server`)
- [ ] Frontend service created (Root Directory: `client`)
- [ ] All environment variables configured (including `DB_SYNCHRONIZE=true` for initial setup)
- [ ] Database tables created (via synchronize or migrations)
- [ ] CORS origin updated with frontend URL
- [ ] Both services deployed successfully
- [ ] Backend API responding
- [ ] Frontend connecting to backend
- [ ] All features tested
- [ ] Custom domains configured (optional)
- [ ] Monitoring and alerts set up (optional)

---

## Need Help?

If you encounter issues:

1. Check service logs in Render dashboard
2. Review this guide's troubleshooting section
3. Check Render documentation
4. Verify environment variables are correct
5. Test locally with production-like settings
6. Check Render status page for outages

Good luck with your deployment! 🚀

