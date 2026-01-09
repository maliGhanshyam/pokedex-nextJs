# Quick Fix for Build Errors on Render

## Problem 1: "nest: not found"
You're getting this error when deploying to Render:
```
sh: 1: nest: not found
==> Build failed 😞
```

## Problem 2: "could not determine executable to run"
You're getting this error:
```
> npx nest build
npm error could not determine executable to run
==> Build failed 😞
```

## Solution

The issue is that the NestJS CLI (`@nestjs/cli`) might not be available or installed correctly. The most reliable solution is to use TypeScript compiler directly instead of the NestJS CLI.

### Fix Applied

The `package.json` build script has been updated to use TypeScript compiler directly:
```json
"build": "tsc"
```

This uses the `tsconfig.json` configuration file and compiles TypeScript to JavaScript in the `dist/` folder.

**Note**: TypeScript is already a devDependency, so this will work reliably.

## Steps to Apply the Fix

1. **Pull the latest code** (if you haven't already):
   ```bash
   git pull origin main
   ```

2. **Or update manually** - Edit `server/package.json`:
   ```json
   "scripts": {
     "build": "tsc",
     ...
   }
   ```

3. **Commit and push**:
   ```bash
   git add server/package.json
   git commit -m "Fix: Use tsc directly for build"
   git push origin main
   ```

4. **Render will automatically redeploy** with the fix

## Verify in Render Dashboard

1. Go to your backend service on Render
2. Check Settings → Build Command is: `npm install && npm run build`
3. Ensure Root Directory is set to: `server`
4. The build should now succeed!

## Alternative Quick Fix (Without Code Changes)

If you can't update the code right now, you can fix it directly in Render:

1. Go to your backend service on Render
2. Click **Settings**
3. Find **Build Command**
4. Change from: `npm install && npm run build`
5. To: `npm install && cd server && npx tsc`
6. Click **Save Changes**
7. Go to **Manual Deploy** → **Deploy latest commit**

**Or** if Root Directory is already set to `server`:
- Change Build Command to: `npm install && npx tsc`

This will work immediately without code changes!

**Note**: Make sure `typescript` is in your `devDependencies` (it should be already).

