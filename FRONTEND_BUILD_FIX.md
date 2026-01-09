# Quick Fix for "next: not found" Error on Render

## Problem
You're getting this error when deploying the frontend:
```
> next build
sh: 1: next: not found
==> Build failed 😞
```

## ⚠️ CRITICAL: Check Your Service Type

**The most common cause of this error is using the wrong service type on Render.**

### Wrong Service Type ❌
- **Static Site** - This is for static HTML/CSS/JavaScript only
- Next.js requires a Node.js server and cannot run as a static site

### Correct Service Type ✅
- **Web Service** - This provides a Node.js runtime environment
- Required for Next.js Server-Side Rendering (SSR)

## Solution 1: Fix Service Type (Most Important!)

If you created a "Static Site" service, you need to:

1. **Delete the Static Site service** (or leave it, but don't use it)
2. **Create a new Web Service**:
   - Go to Render Dashboard
   - Click "New +" → **"Web Service"** (NOT Static Site)
   - Connect your repository
   - Configure:
     - **Root Directory**: `client`
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
   - Add environment variable:
     - `NEXT_PUBLIC_API_URL` = your backend URL

## Solution 2: Update Build Script

The build script has been updated to use `npx`:

1. **Pull latest code**:
   ```bash
   git pull origin main
   ```

2. **Or update manually** - Edit `client/package.json`:
   ```json
   "scripts": {
     "build": "npx next build",
     "start": "npx next start"
   }
   ```

3. **Commit and push**:
   ```bash
   git add client/package.json
   git commit -m "Fix: Use npx for Next.js commands"
   git push origin main
   ```

## Solution 3: Quick Fix in Render (Without Code Changes)

If you're using a Web Service and still getting the error:

1. Go to your frontend service on Render
2. Click **Settings**
3. Find **Build Command**
4. Change from: `npm install && npm run build`
5. To: `npm install && npx next build`
6. Click **Save Changes**
7. Go to **Manual Deploy** → **Deploy latest commit**

## How to Identify Your Service Type

In Render Dashboard:
- **Web Service** will show: "Web Service" with Node.js runtime options
- **Static Site** will show: "Static Site" with build command but no start command

**Next.js needs:**
- ✅ Web Service (has both build AND start commands)
- ❌ Static Site (only has build command, no Node.js runtime)

## Verify Configuration

Your frontend service should have:

- ✅ **Service Type**: Web Service
- ✅ **Root Directory**: `client`
- ✅ **Runtime**: Node
- ✅ **Build Command**: `npm install && npm run build` (or `npm install && npx next build`)
- ✅ **Start Command**: `npm start` (or `npx next start`)
- ✅ **Environment Variable**: `NEXT_PUBLIC_API_URL` = your backend URL

## Build Taking Too Long?

If your build is stuck on "Linting and checking validity of types":

**Solution**: The `next.config.ts` has been updated to skip type checking and linting during production builds for faster deployments.

1. **Pull latest code**:
   ```bash
   git pull origin main
   ```

2. **Or update manually** - Edit `client/next.config.ts`:
   ```typescript
   typescript: {
     ignoreBuildErrors: process.env.NODE_ENV === "production",
   },
   eslint: {
     ignoreDuringBuilds: process.env.NODE_ENV === "production",
   },
   ```

3. **Note**: This speeds up builds but won't catch type/ESLint errors during build
   - Errors are still caught in development mode
   - For strict checking, remove these options

## Still Having Issues?

1. Check that `next` is in `dependencies` (not devDependencies) in `client/package.json`
2. Verify Root Directory is exactly `client` (case-sensitive)
3. Try clearing build cache: Manual Deploy → "Clear build cache & deploy"
4. Check build logs for any npm install errors
5. If build is slow, ensure type checking/linting are disabled in production (see above)

## Quick Checklist

- [ ] Service type is "Web Service" (not Static Site)
- [ ] Root Directory is set to `client`
- [ ] Build Command includes `npm install`
- [ ] Start Command is `npm start` or `npx next start`
- [ ] `next` package is in dependencies
- [ ] Environment variables are set (especially `NEXT_PUBLIC_API_URL`)

