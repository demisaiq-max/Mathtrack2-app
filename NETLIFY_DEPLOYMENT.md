# Netlify Deployment Guide

## Prerequisites
- GitHub account
- Netlify account (free tier available)
- Your code pushed to a GitHub repository

## Deployment Steps

### Method 1: Automatic Deployment via GitHub (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login with GitHub
   - Click "New site from Git"
   - Choose GitHub and authorize
   - Select your repository

3. **Configure Build Settings:**
   - Build command: `bun install && bunx expo export -p web`
   - Publish directory: `dist`
   - Node version: `18`

4. **Environment Variables (if needed):**
   - Go to Site settings > Environment variables
   - Add your environment variables (like Supabase keys)

5. **Deploy:**
   - Click "Deploy site"
   - Netlify will automatically build and deploy
   - You'll get a URL like `https://amazing-name-123456.netlify.app`

### Method 2: Manual Deployment

1. **Build locally:**
   ```bash
   bun install
   bunx expo export -p web --output-dir dist
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder to Netlify

## Important Notes

### Environment Variables
Make sure to add these to Netlify if you're using them:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Any other environment variables your app uses

### Custom Domain (Optional)
1. Go to Site settings > Domain management
2. Add custom domain
3. Configure DNS records as instructed

### Continuous Deployment
- Every push to your main branch will trigger a new deployment
- You can configure branch-specific deployments
- Preview deployments for pull requests

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

### App Doesn't Load
- Check browser console for errors
- Verify redirect rules in netlify.toml
- Ensure all assets are properly referenced

### Performance
- Netlify automatically provides CDN
- Enable asset optimization in site settings
- Consider enabling Netlify Analytics

## Cost
- Netlify free tier includes:
  - 100GB bandwidth/month
  - 300 build minutes/month
  - Automatic HTTPS
  - Custom domains

Your React Native Web app should work perfectly on Netlify!