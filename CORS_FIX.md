# CORS Fix Instructions

## Problem
Backend server is configured for `http://localhost:5173` but frontend is running on `http://localhost:3000`

## Solution
Edit `server/.env` file and change this line:

```env
CORS_ORIGIN="http://localhost:5173"
```

To:

```env
CORS_ORIGIN="http://localhost:3000"
```

Then restart the backend server.
