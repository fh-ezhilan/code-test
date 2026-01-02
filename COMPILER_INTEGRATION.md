# Code Compiler Integration - Piston API

## Overview
Integrated **Piston API** for compiling and executing Java, JavaScript, and Python code against test cases.

## Features
✅ **No setup required** - Uses free public Piston API
✅ **Supports 3 languages**: JavaScript (Node.js), Python 3, Java
✅ **Test case execution**: Runs code against all defined test cases
✅ **Detailed results**: Shows pass/fail, expected vs actual output, errors
✅ **Real-time compilation**: Click "Run" to see results instantly

## How It Works

### 1. Run Button
- Candidate clicks **"Run"** button in code editor
- Code is sent to Piston API
- Executes against all test cases defined in the program
- Results displayed in **"Test Result"** tab

### 2. Test Results Display
Each test case shows:
- ✅ or ✗ Pass/Fail indicator
- Input provided
- Expected output
- Actual output (color-coded: green for pass, red for fail)
- Compilation errors (if any)
- Runtime errors (if any)
- Overall score: X/Y tests passed (percentage)

### 3. Submit Button
- Runs all test cases
- Saves results to database
- Stores score in TestAssignment model
- Marks test as completed

## API Limits
- **Free tier**: ~5 requests/second per IP
- **No API key needed**
- Suitable for classroom/testing scenarios

## Supported Languages

| Language   | Runtime        | File Extension |
|------------|----------------|----------------|
| JavaScript | Node.js 18.15  | .js            |
| Python     | Python 3.10    | .py            |
| Java       | OpenJDK 15     | .java          |

## Test Case Format

Test cases are stored in the Program model:
```javascript
{
  testCases: [
    {
      input: "5\n3",    // stdin input
      output: "8"       // expected stdout
    }
  ]
}
```

## Files Modified

### Backend
- `server/services/judge0Service.js` - Piston API integration
- `server/controllers/candidateController.js`:
  - `runCode()` - Execute code against test cases
  - `submitSolution()` - Save results with score
- `server/models/Solution.js` - Added testResults field

### Frontend
- `client/src/pages/TestPage.jsx`:
  - Updated `handleRun()` to fetch test results
  - Enhanced Test Result tab UI to display all test case results

## Usage Example

1. **Admin creates a program** with test cases:
   ```
   Problem: Add two numbers
   Test Case 1: input "5\n3", expected output "8"
   Test Case 2: input "10\n20", expected output "30"
   ```

2. **Candidate writes code**:
   ```javascript
   const a = parseInt(input[0]);
   const b = parseInt(input[1]);
   console.log(a + b);
   ```

3. **Clicks "Run"**:
   - Test Result shows: ✓ 2/2 Tests Passed (100%)

4. **Clicks "Submit"**:
   - Solution saved with 100% score
   - Test marked as completed

## Error Handling

- **Compilation errors**: Shown in red box under each test case
- **Runtime errors**: stderr output displayed
- **API failures**: Graceful error messages to candidate
- **Rate limiting**: Handled automatically by backend

## Future Enhancements

- Add custom input box for manual testing
- Support more languages (C++, C#, etc.)
- Add execution time and memory usage display
- Implement queue system for high load
- Self-host Piston for unlimited usage
