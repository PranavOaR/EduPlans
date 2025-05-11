# Deployment Guide for EduPlans

This guide will help you deploy the EduPlans application to Render.com. The application consists of two parts:

1. Backend API (Node.js/Express)
2. Frontend (HTML/JS/CSS)

## Step 1: Deploying the Backend API

### Sign up for Render

1. Go to [Render.com](https://render.com) and sign up for an account if you don't have one already.
2. Verify your email and log in to your dashboard.

### Create a Web Service for the Backend

1. Click on the "New +" button in the dashboard and select "Web Service".
2. Connect your GitHub repository or use the Render deploy hook.
3. Configure your Web Service with the following settings:

   - **Name**: `eduplans-api` (or any name you prefer)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or select a paid plan if you need more resources)

4. Under the "Advanced" settings, add the following environment variables:

   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=https://your-frontend-app-url.onrender.com
   NODE_ENV=production
   ```

   Replace `your_mongodb_connection_string` with your actual MongoDB URI. If you don't have a MongoDB database yet, you can create one using [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (they offer a free tier).

5. Click "Create Web Service" to deploy your backend.

## Step 2: Deploying the Frontend

### Create a Static Site for the Frontend

1. From your Render dashboard, click on "New +" and select "Static Site".
2. Connect your GitHub repository.
3. Configure with the following settings:

   - **Name**: `eduplans` (or any name you prefer)
   - **Build Command**: Leave empty (since it's a plain HTML/CSS/JS site)
   - **Publish Directory**: `.` (root directory, or specify the path to your frontend files)

4. Under "Advanced" settings, add the following environment variable:

   ```
   API_URL=https://your-backend-service-url.onrender.com
   ```

   Replace `your-backend-service-url` with the URL of your backend service created in Step 1.

5. Click "Create Static Site" to deploy your frontend.

## Step 3: Update Frontend API Configuration

1. You may need to update your frontend code to point to the new backend URL. Look for any API request URLs in your JavaScript files and update them to use the deployed backend URL.

2. For example, change:

   ```javascript
   fetch('http://localhost:5000/api/auth/login', ...)
   ```

   To:

   ```javascript
   fetch('https://your-backend-service-url.onrender.com/api/auth/login', ...)
   ```

   You can do this by creating a configuration file that uses an environment variable or by directly updating the URLs.

## Step 4: Testing Your Deployment

1. After both the backend and frontend are deployed, navigate to your frontend URL to test the application.
2. Try logging in, creating events, and testing all features to ensure they work with the deployed backend.

## Troubleshooting

If you encounter any issues:

1. Check the logs in your Render dashboard for both the Web Service and Static Site.
2. Verify that your environment variables are set correctly.
3. Ensure your MongoDB database is accessible from the Render service.
4. Check for CORS issues if your frontend cannot communicate with the backend.

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [CORS Configuration Guide](https://render.com/docs/cors) 