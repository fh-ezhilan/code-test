# Judge0 Code Execution Setup

## Overview
Judge0 is integrated to compile and execute Java, JavaScript, and Python code against test cases.

## Setup Instructions

### 1. Start Judge0 with Docker
```bash
# From the project root directory
docker-compose up -d
```

This will start:
- Judge0 Server (port 2358)
- PostgreSQL database
- Redis cache

### 2. Verify Judge0 is Running
```bash
curl http://localhost:2358/about
```

You should see Judge0 version information.

### 3. Check Docker Containers
```bash
docker-compose ps
```

All three containers should be "Up".

### 4. View Logs (if needed)
```bash
docker-compose logs -f judge0-server
```

## Supported Languages

| Language   | Judge0 ID | Version          |
|------------|-----------|------------------|
| JavaScript | 63        | Node.js 12.14.0  |
| Python     | 71        | Python 3.8.1     |
| Java       | 62        | OpenJDK 13.0.1   |

## How It Works

1. **Code Submission**: When a candidate submits code, it's sent to Judge0
2. **Test Execution**: Code runs against all test cases defined in the Program
3. **Results**: Each test case returns:
   - Expected output
   - Actual output
   - Pass/Fail status
   - Execution time
   - Memory used
   - Compilation errors (if any)
4. **Score Calculation**: Score = (Passed Tests / Total Tests) × 100

## Test Case Format

Test cases are stored in the Program model:
```javascript
{
  input: "5\n3",        // Standard input
  output: "8"           // Expected output
}
```

## Stopping Judge0
```bash
docker-compose down
```

To remove volumes (database data):
```bash
docker-compose down -v
```

## Troubleshooting

### Judge0 Not Starting
- Check Docker is running: `docker info`
- Check port 2358 is not in use: `lsof -i:2358`
- View logs: `docker-compose logs judge0-server`

### Execution Timeout
- Default limit is 2 seconds CPU time
- Increase in `server/services/judge0Service.js`: `cpu_time_limit`

### Memory Limit
- Default is 128MB
- Increase in `server/services/judge0Service.js`: `memory_limit`

## API Endpoints

### Submit and Execute Code
```javascript
POST /api/candidate/test/submit
{
  "programId": "...",
  "code": "print('Hello')",
  "language": "python"
}
```

Response includes test results:
```javascript
{
  "msg": "Solution submitted successfully",
  "solution": { ... },
  "testResults": {
    "totalTests": 3,
    "passedTests": 2,
    "failedTests": 1,
    "score": 67,
    "results": [ ... ]
  }
}
```

## Security Notes

- Code runs in sandboxed Docker containers
- CPU and memory limits enforced
- Network access is restricted
- File system access is limited

## Production Deployment

For production:
1. Change database password in `docker-compose.yml`
2. Use proper secrets management
3. Consider using Judge0 CE (Community Edition) or Enterprise
4. Set up monitoring and logging
5. Use a reverse proxy (nginx) for HTTPS
