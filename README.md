# EduPlans - Educational Planning Application

EduPlans is a comprehensive educational planning application that helps students organize their studies with features like a Pomodoro timer, calendar, planner, and code compiler.

## Features

- **Authentication** - User registration and login
- **Profile Management** - Personal profile with customizable settings
- **Pomodoro Timer** - Focus and break timer with task management
- **Calendar** - Event planning and scheduling
- **Planner** - Task management and organization
- **Code Compiler** - In-browser compiler for Python, C++, Java, and C
- **Responsive Design** - Works on desktop and mobile devices

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Render

## Deployment to Render

### Prerequisites

- GitHub account with your code repository
- MongoDB Atlas account for database hosting
- Render.com account for application hosting

### Step 1: Deploy the Backend API

1. **Create a MongoDB Atlas Database**:
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (the free tier is sufficient for starting)
   - Set up a database user with password
   - Configure network access to allow connections from anywhere
   - Get your MongoDB connection string

2. **Deploy Backend to Render**:
   - Log in to [Render](https://render.com) and create a new Web Service
   - Connect your GitHub repository
   - Configure with the following settings:
     - **Name**: `eduplans-api` (or your preferred name)
     - **Root Directory**: `backend` (specify the backend folder)
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free (or select a paid plan for more resources)

3. **Configure Environment Variables**:
   Add the following environment variables in the Render dashboard under "Environment":
   ```
   PORT=10000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eduplans
   JWT_SECRET=your_strong_random_jwt_secret
   FRONTEND_URL=https://your-frontend-app.onrender.com
   ```
   Replace placeholder values with your actual MongoDB connection string and a strong random JWT secret.

4. **Deploy** and wait for the build to complete.

### Step 2: Deploy the Frontend

1. **Deploy Frontend to Render**:
   - Create a new Static Site in Render
   - Connect your GitHub repository
   - Configure with the following settings:
     - **Name**: `eduplans` (or your preferred name)
     - **Build Command**: Leave empty (no build process needed)
     - **Publish Directory**: `.` (root directory, or specify the path to frontend files)

2. **Deploy** and wait for the build to complete.

3. **Update Config**: 
   - If needed, update the API URL in the config.js file to point to your deployed backend URL.

### Step 3: Testing and Troubleshooting

1. **Test Authentication**: Try registering and logging in to verify the connection to the backend.
2. **Test Features**: Try adding events to the calendar, using the timer, etc.
3. **Check Logs**: If issues occur, check the logs in the Render dashboard.

## Local Development

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/eduplans
   JWT_SECRET=your_development_secret
   FRONTEND_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Serve the frontend files using any static server, for example:
   ```bash
   python -m http.server
   ```

2. Open `http://localhost:8000` in your browser.

## Contributors

- Developed by Pranav Rao

## License

This project is licensed under the MIT License - see the LICENSE file for details.