# DTC Workflow Manager - Setup Guide

## Prerequisites

- **Node.js** 18+ installed
- **PostgreSQL** 14+ installed and running
- **Lark (Feishu) Account** for bot integration
- **Gemini API Key** for AI analytics

---

## Backend Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/dtc_workflow?schema=public"

# JWT - Generate secure secrets
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-refresh-token-secret"

# Server
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Lark Configuration (see Lark Setup section below)
LARK_APP_ID="your-lark-app-id"
LARK_APP_SECRET="your-lark-app-secret"
LARK_BASE_ID="your-lark-base-id"
LARK_REPORT_TABLE_ID="your-report-table-id"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

---

## Lark (Feishu) Integration Setup

### Step 1: Create Lark Bot Application

1. Go to [Lark Open Platform](https://open.feishu.cn/app) (or [Lark International](https://open.larksuite.com/app))
2. Click "Create Custom App"
3. Fill in app details:
   - **App Name**: DTC Workflow Bot
   - **Description**: Task management and notification bot
   - **Icon**: Upload your logo

### Step 2: Get App Credentials

1. In your app dashboard, go to **Credentials & Basic Info**
2. Copy **App ID** and **App Secret**
3. Add to `.env`:
   ```env
   LARK_APP_ID="cli_xxxxxxxxxxxxx"
   LARK_APP_SECRET="xxxxxxxxxxxxxxxxxxxxx"
   ```

### Step 3: Configure Bot Permissions

Go to **Permissions & Scopes** and enable:

- ✅ `im:message` - Send messages
- ✅ `im:message:send_as_bot` - Send as bot
- ✅ `contact:user.email:readonly` - Read user email
- ✅ `contact:user:readonly` - Read user info
- ✅ `bitable:app` - Access Lark Base
- ✅ `bitable:app:readonly` - Read Lark Base

Click **Save** and **Publish** your app.

### Step 4: Create Lark Base for Reports

1. Open Lark and create a new **Base** (similar to Airtable)
2. Name it: **DTC Daily Reports**
3. Create a table with these columns:

| Column Name | Type | Description |
|------------|------|-------------|
| Date | Date | Report date |
| Staff Name | Text | Employee name |
| Staff Email | Text | Employee email |
| Role | Single Select | DESIGNER, SELLER, CS |
| Report Content | Long Text | Daily report content |
| Completed Tasks | Long Text | JSON array of task IDs |
| Analytics | Long Text | AI-generated analytics |
| Submitted At | DateTime | Submission timestamp |

4. Get Base credentials:
   - Click **...** → **Advanced** → **API Access**
   - Copy **Base ID** (app token)
   - Copy **Table ID**
   - Add to `.env`:
     ```env
     LARK_BASE_ID="bascnxxxxxxxxxxxxx"
     LARK_REPORT_TABLE_ID="tblxxxxxxxxxxxxx"
     ```

### Step 5: Add Bot to Workspace

1. In Lark app dashboard, go to **App Release**
2. Click **Create Version** → **Submit for Review**
3. After approval, install the app to your workspace
4. Add bot to relevant group chats

### Step 6: Get User Emails

For notifications to work, ensure all team members:
1. Have Lark accounts with the same email as in the system
2. Have accepted the bot's friend request (or bot is in shared groups)

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd ..  # Back to root directory
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

---

## Testing the Application

### 1. Login

Use one of the seeded accounts:

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@dtc.com | manager123 |
| Designer | tu@dtc.com | designer123 |
| Seller 1 | huyen@dtc.com | seller123 |
| Seller 2 | tam@dtc.com | seller123 |
| CS Đào | dao@dtc.com | cs123 |
| CS Thảo | thao@dtc.com | cs123 |

### 2. Test Features

**As Manager:**
1. Login and view dashboard
2. Create a new task assigned to Designer
3. Check Lark - Designer should receive notification
4. View analytics and reports

**As Staff (Designer/Seller/CS):**
1. Login and view assigned tasks
2. Update task status and progress
3. Submit daily report
4. Check Lark Base - report should appear

**Real-time Updates:**
1. Open app in two browsers
2. Login as different users
3. Update task in one browser
4. See instant update in other browser

### 3. Test Scheduled Jobs

Jobs run automatically:
- **Overdue Checker**: Every hour
- **Deadline Reminders**: Every 30 minutes (2 hours before deadline)
- **Daily Report Reminder**: 5 PM daily
- **Lark Base Sync**: Every 30 minutes
- **Morning Reminder**: 9 AM daily

To test immediately, you can manually trigger by modifying cron schedules in `server/src/jobs/scheduler.ts` (e.g., change to `*/1 * * * *` for every minute).

---

## Production Deployment

### Option 1: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Option 2: Manual Deployment

**Backend:**
```bash
cd server
npm run build
NODE_ENV=production npm start
```

**Frontend:**
```bash
npm run build
# Deploy dist/ folder to static hosting (Vercel, Netlify, etc.)
```

### Environment Variables for Production

Update `.env` with production values:
- Use strong JWT secrets
- Use production database URL
- Set `NODE_ENV=production`
- Configure CORS_ORIGIN to your frontend URL

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U username -d dtc_workflow
```

### Lark Notifications Not Sending

1. Check app is published and installed
2. Verify user emails match Lark accounts
3. Check bot has required permissions
4. View logs: `server/logs/error.log`

### WebSocket Not Connecting

1. Check JWT token is valid
2. Verify WS_PORT is not blocked by firewall
3. Check browser console for errors

### Lark Base Sync Failing

1. Verify Base ID and Table ID are correct
2. Check bot has `bitable:app` permission
3. Ensure table column names match exactly

---

## API Documentation

### Authentication

**POST** `/api/auth/login`
```json
{
  "email": "manager@dtc.com",
  "password": "manager123"
}
```

**POST** `/api/auth/register` (Manager only)
```json
{
  "email": "newuser@dtc.com",
  "password": "password123",
  "name": "New User",
  "role": "DESIGNER"
}
```

### Tasks

**GET** `/api/tasks` - List all tasks (filtered by role)

**POST** `/api/tasks` - Create task (Manager only)
```json
{
  "title": "Design new banner",
  "purpose": "Marketing campaign",
  "description": "Create banner for Q1 campaign",
  "assignedToId": "user_id",
  "role": "DESIGNER",
  "priority": "HIGH",
  "deadline": "2026-01-10T23:59:59Z"
}
```

**PATCH** `/api/tasks/:id/status` - Update task status
```json
{
  "status": "IN_PROGRESS"
}
```

### Reports

**POST** `/api/reports` - Submit daily report
```json
{
  "date": "2026-01-06",
  "content": "Completed 3 tasks today...",
  "completedTasks": ["task_id_1", "task_id_2"]
}
```

**GET** `/api/reports/analytics` - Get analytics (Manager only)

---

## Support

For issues or questions:
1. Check logs in `server/logs/`
2. Review Lark app event logs
3. Check database with `npm run prisma:studio`

---

## Next Steps

1. ✅ Customize Lark notification messages
2. ✅ Add more task templates
3. ✅ Configure production database
4. ✅ Set up SSL certificates
5. ✅ Configure backup strategy
