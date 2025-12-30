# MCQ Test Implementation Guide

## Overview
The system now supports both Coding and MCQ (Multiple Choice Question) tests. Candidates are automatically routed to the appropriate test interface based on their assigned test type.

## How It Works

### 1. Admin Creates MCQ Test
- Navigate to Admin Dashboard
- Select **Test Type: MCQ** 
- Upload Excel file with format:
  ```
  Question | Option1 | Option2 | Option3 | Option4 | CorrectOption
  What is 2+2? | 3 | 4 | 5 | 6 | 2
  ```
  - CorrectOption is the index (1-4) of the correct answer

### 2. Admin Assigns MCQ Test to Candidate
- When creating/editing a candidate, select:
  - **Test Type: MCQ**
  - **Test Name:** (filtered to show only MCQ tests)
- Upload candidate Excel with format:
  ```
  Username | Password | TestType | TestName
  john.doe | pass123 | MCQ | JavaScript Basics
  ```

### 3. Candidate Takes MCQ Test
1. Login with credentials
2. Read instructions (customized for MCQ tests)
3. Click "Start Test"
4. Automatically routed to `/test/mcq`
5. MCQ Test Interface shows:
   - Timer countdown at top
   - Progress bar (answered/total questions)
   - Questions numbered 1-N
   - Radio buttons for options
   - Submit button

6. On Submit:
   - Confirmation dialog appears
   - "Are you sure? This cannot be undone"
   - Cancel or Confirm

7. After Submission:
   - Answers sent to backend
   - Score calculated automatically
   - Redirected to Test Completed page

### Auto-Submit Feature
- When timer reaches 0, test automatically submits
- No confirmation dialog for auto-submit
- Ensures fairness and time compliance

## Technical Details

### New Models
- **MCQQuestion**: Stores questions with 4 options and correct answer
- **MCQAnswer**: Stores candidate answers and calculated score

### New Endpoints
- `GET /api/candidate/test/mcq/questions` - Fetches questions (without correct answers)
- `POST /api/candidate/test/mcq/submit` - Submits answers and calculates score

### Modified Files
- **Backend:**
  - `server/models/TestSession.js` - Added testType field
  - `server/controllers/candidateController.js` - Added MCQ endpoints and updated instructions
  - `server/routes/candidate.js` - Added MCQ routes

- **Frontend:**
  - `client/src/App.jsx` - Added `/test/mcq` route
  - `client/src/pages/MCQTestPage.jsx` - New MCQ test interface
  - `client/src/pages/TestInstructionsPage.jsx` - Routes to correct test type
  - `client/src/pages/AdminDashboard.jsx` - Test type selection and filtering

## Testing Instructions

1. **Create MCQ Test:**
   ```
   Login as admin (admin/admin123)
   → Upload MCQ questions via Excel
   → Verify test appears in Active Tests table with Type "MCQ"
   ```

2. **Assign to Candidate:**
   ```
   Create/Edit Candidate
   → Select Test Type: MCQ
   → Select Test Name from filtered list
   → Save
   ```

3. **Take Test:**
   ```
   Login as candidate
   → Read instructions (should mention selecting options)
   → Click Start Test
   → Should see MCQ interface (not code editor)
   → Answer questions
   → Submit and verify completion screen
   ```

## Scoring
- Automatic scoring on submission
- 1 point per correct answer
- Score stored in MCQAnswer model
- Can be retrieved by admin for evaluation
