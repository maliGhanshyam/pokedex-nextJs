# Deployment Guide for Render

This is a **Next.js 15 Server-Side Rendered (SSR) Application** using the App Router.

## Project Type
- **Framework**: Next.js 15.3.3
- **Type**: Server-Side Rendered (SSR) Web Application
- **Node Version**: Recommended Node.js 20.x or higher

## Pre-Deployment Checklist

✅ **Source Code Protection**: 
- `.gitignore` is properly configured
- `node_modules`, `.next`, and build artifacts are excluded
- Environment files (`.env*`) are ignored

✅ **Build Configuration**:
- `package.json` has build and start scripts
- `next.config.ts` is optimized for production
- `render.yaml` is configured for Render

✅ **Responsiveness**:
- All components are mobile-responsive
- Navbar adapts to mobile screens
- Search bar is responsive
- Pokemon cards scale properly on all devices

## Deployment Steps on Render

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Connect Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Render will automatically detect `render.yaml`

3. **Render will use these settings from render.yaml**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
   - **Plan**: Free tier

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy

### Option 2: Manual Configuration

If you prefer manual setup:

1. **Create New Web Service**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your repository

2. **Configure Settings**:
   - **Name**: `pokedex` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)

3. **Environment Variables** (if needed):
   - `NODE_ENV`: `production`
   - Add any other environment variables your app needs

4. **Advanced Settings**:
   - **Health Check Path**: `/`
   - **Auto-Deploy**: Yes (deploys on every push to main branch)

## Build Process

The deployment process:
1. **Install Dependencies**: `npm install`
2. **Build Application**: `npm run build`
   - Creates optimized production build in `.next/` folder
   - Generates standalone server files
3. **Start Server**: `npm start`
   - Runs Next.js production server on port specified by Render (usually 10000)

## Important Notes

### Port Configuration
- Render automatically sets `PORT` environment variable
- Next.js will use this port automatically
- No manual port configuration needed

### Source Code Protection
✅ Your source code is protected:
- `.gitignore` excludes:
  - `node_modules/` - Dependencies
  - `.next/` - Build output
  - `.env*` - Environment files
  - Build artifacts

### Performance Optimizations
- ✅ Standalone output mode enabled (minimal server footprint)
- ✅ Image optimization configured
- ✅ Compression enabled
- ✅ Security headers configured

### Responsive Design
✅ All pages are mobile-responsive:
- Navbar collapses on mobile
- Search bar adapts to screen size
- Pokemon cards scale properly
- Pagination wraps on small screens

## Post-Deployment

1. **Test Your Deployment**:
   - Visit your Render URL
   - Test on mobile devices
   - Check all routes work correctly

2. **Custom Domain** (Optional):
   - Go to your service settings
   - Add custom domain
   - Configure DNS as instructed

3. **Monitor**:
   - Check Render logs for any errors
   - Monitor performance metrics

## Troubleshooting

### Build Fails
- Check Node.js version (should be 20.x or higher)
- Verify all dependencies are in `package.json`
- Check build logs in Render dashboard

### Application Won't Start
- Verify `npm start` works locally
- Check that port is not hardcoded
- Review application logs

### Source Code Visible
- Ensure `.gitignore` is committed
- Verify `node_modules` and `.next` are excluded
- Check Render build logs

## Local Testing Before Deployment

Test production build locally:
```bash
npm run build
npm start
```

Visit `http://localhost:3000` to verify everything works.

## Support

For Render-specific issues, check:
- [Render Documentation](https://render.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

