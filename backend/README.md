# EduPlans Backend API

This is the backend API for the EduPlans educational planning application.

## Setup and Deployment

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root of the backend directory with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/eduplans
   JWT_SECRET=your_jwt_secret_key_here
   FRONTEND_URL=http://localhost:8000
   EMAIL_HOST=smtp.ethereal.email
   EMAIL_PORT=587
   EMAIL_USER=your_ethereal_email_user
   EMAIL_PASS=your_ethereal_email_password
   EMAIL_FROM=noreply@eduplans.com
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

### Production Deployment (Render)

1. **Create a MongoDB Atlas Cluster**:
   - Sign up for [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Set up database access (create a user with password)
   - Set up network access (allow connections from anywhere for Render)
   - Get your connection string

2. **Deploy to Render**:
   - Create a new Web Service on Render
   - Connect your GitHub repository
   - Configure with the following settings:
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free (or select a paid plan for better performance)
   
3. **Set Environment Variables**:
   Add the following environment variables in the Render dashboard:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eduplans
   JWT_SECRET=your_strong_random_jwt_secret
   FRONTEND_URL=https://your-frontend-app.onrender.com
   EMAIL_HOST=smtp.your-email-provider.com
   EMAIL_PORT=587
   EMAIL_USER=your_email_username
   EMAIL_PASS=your_email_password
   EMAIL_FROM=noreply@eduplans.com
   ```

## API Documentation

### Authentication Endpoints

- **POST /api/auth/signup** - Create a new user account
- **POST /api/auth/login** - Log in to an existing account
- **POST /api/auth/forgot-password** - Request a password reset
- **POST /api/auth/reset-password** - Reset password with token
- **GET /api/auth/verify-token** - Verify a JWT token

### Profile Endpoints

- **GET /api/me** - Get current user profile
- **PUT /api/me** - Update current user profile

### Health Check

- **GET /health** - Check API status and MongoDB connection

## Security Notes

- JWT tokens are used for authentication
- Passwords are hashed using bcrypt
- CORS is configured to allow only the frontend domain
- Environment variables are used for all sensitive configuration 