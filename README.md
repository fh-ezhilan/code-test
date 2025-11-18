# HackerRank Prototype

A full-stack application similar to HackerRank for conducting programming tests.

## Tech Stack

**Frontend:**
- React.js
- Material-UI (MUI)
- Monaco Editor
- Vite

**Backend:**
- Node.js
- Express
- Passport.js (Authentication)
- MongoDB/Mongoose

**Code Execution:**
- Judge0 API (to be integrated)

## Features

### Admin Dashboard
- Upload programming problems
- Create test sessions
- Create temporary candidate accounts
- Modify test duration

### Candidate Dashboard
- View test instructions
- Take programming tests
- Choose between Java, JavaScript, Python
- Auto-save solution every 30 seconds
- Timed tests

## Setup Instructions

### 1. MongoDB Setup

You have two options:

#### Option A: MongoDB Atlas (Cloud - Recommended for testing)
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update `/server/.env` file with your connection string:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hackerrank-prototype
   ```

#### Option B: Local MongoDB
1. Update your Command Line Tools:
   ```bash
   sudo rm -rf /Library/Developer/CommandLineTools
   sudo xcode-select --install
   ```
2. Install MongoDB:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```
3. Start MongoDB:
   ```bash
   brew services start mongodb-community
   ```
4. The default connection string in `.env` will work:
   ```
   MONGO_URI=mongodb://localhost:27017/hackerrank-prototype
   ```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Variables

Update `server/.env`:
```
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret_key_here
PORT=5000
```

### 4. Run the Application

**Start Backend (Terminal 1):**
```bash
cd server
npm start
```

**Start Frontend (Terminal 2):**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Test Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Test Candidate Account:**
- Username: `candidate1`
- Password: `test123`

You can create more candidates through the admin dashboard.

## Project Structure

```
code-test/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── App.jsx        # Main app component
│   └── package.json
│
└── server/                # Express backend
    ├── config/            # Configuration files
    ├── models/            # Mongoose models
    ├── controllers/       # Route controllers
    ├── routes/            # API routes
    ├── middleware/        # Custom middleware
    └── server.js          # Entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/logout` - Logout

### Admin Routes
- `POST /api/admin/program` - Upload a program
- `POST /api/admin/session` - Create test session
- `PUT /api/admin/session/:id` - Update test session
- `POST /api/admin/candidate` - Create candidate account

### Candidate Routes
- `GET /api/candidate/test/instructions` - Get test instructions
- `GET /api/candidate/test/program` - Get random program
- `POST /api/candidate/test/submit` - Submit solution

## Database Models

- **User**: Admin and candidate accounts
- **Program**: Programming problems with test cases
- **TestSession**: Test configuration and duration
- **Solution**: Candidate submissions

## To-Do / Future Enhancements

- [ ] Integrate Judge0 API for code execution
- [ ] Add timer functionality on test page
- [ ] Implement auto-submit when timer expires
- [ ] Add test case validation for programs
- [ ] Improve program selection for sessions
- [ ] Add candidate results/analytics dashboard
- [ ] Add protected routes on frontend
- [ ] Implement code execution results display

## License

MIT
