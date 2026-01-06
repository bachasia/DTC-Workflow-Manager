<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DTC Workflow Manager - Production Edition

A comprehensive task management and workflow automation system for DTC (Direct-to-Consumer) teams, featuring real-time collaboration, Lark integration, and AI-powered analytics.

## 🌟 Features

### Core Functionality
- ✅ **Task Management** - Create, assign, track, and manage tasks across departments
- ✅ **Role-Based Access Control** - Manager, Designer, Seller, and CS roles with appropriate permissions
- ✅ **Real-time Updates** - WebSocket-powered live updates across all connected clients
- ✅ **Daily Reporting** - Staff can submit daily reports with automatic analytics
- ✅ **Dashboard Analytics** - Comprehensive performance metrics and team insights

### Lark (Feishu) Integration
- 📱 **Task Notifications** - Automatic notifications when tasks are assigned
- ⏰ **Smart Reminders** - Deadline approaching and overdue alerts
- 📊 **Lark Base Sync** - Daily reports automatically synced to Lark Base
- 🤖 **Bot Commands** - Interact with tasks via Lark messenger

### AI-Powered Features
- 🧠 **Gemini AI Analytics** - Intelligent insights and productivity scoring
- 📈 **Performance Tracking** - Automated staff performance analysis
- 💡 **Smart Suggestions** - AI-generated task recommendations

### Technical Highlights
- 🔐 **JWT Authentication** - Secure token-based authentication
- 🗄️ **PostgreSQL Database** - Robust data persistence with Prisma ORM
- ⚡ **WebSocket Server** - Real-time bidirectional communication
- ⏱️ **Scheduled Jobs** - Automated background tasks with node-cron
- 🐳 **Docker Ready** - Easy deployment with Docker Compose

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Lark (Feishu) account for bot integration

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DTC-Workflow-Manager
```

2. **Backend Setup**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

3. **Frontend Setup**
```bash
cd ..
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@dtc.com | manager123 |
| Designer | tu@dtc.com | designer123 |
| Seller | huyen@dtc.com | seller123 |
| CS | dao@dtc.com | cs123 |

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Detailed setup instructions including Lark integration
- **[API Documentation](SETUP.md#api-documentation)** - REST API endpoints reference
- **[Deployment Guide](SETUP.md#production-deployment)** - Production deployment options

## 🏗️ Architecture

```
DTC-Workflow-Manager/
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic & Lark integration
│   │   ├── middleware/    # Auth & validation
│   │   ├── jobs/          # Scheduled tasks
│   │   └── lib/           # Utilities
│   └── prisma/            # Database schema & migrations
├── components/            # React components
├── services/              # Frontend services
└── types.ts              # TypeScript definitions
```

## 🔧 Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- Recharts for analytics
- Lucide React icons

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- WebSocket (ws)
- Lark SDK
- Winston (logging)
- node-cron (scheduling)

**AI & Integration:**
- Google Gemini AI
- Lark (Feishu) API
- Lark Base

## 🐳 Docker Deployment

```bash
# Copy environment file
cp .env.docker .env

# Edit .env with your credentials

# Start all services
docker-compose up -d
```

## 📊 Features in Detail

### Task Management
- Create tasks with priority, deadline, and assignments
- Track progress with percentage completion
- Mark tasks as blocked with reason tracking
- Automatic overdue detection
- Complete task history logs

### Notifications
- **Task Assignment**: Instant notification when assigned
- **Deadline Reminder**: Alert 2 hours before deadline
- **Overdue Alert**: Notification when task becomes overdue
- **Status Changes**: Manager notified of blockers and completions
- **Daily Report Reminder**: 5 PM reminder to submit report

### Analytics Dashboard
- Real-time task statistics
- Department workload distribution
- Staff performance metrics
- Priority breakdown
- Completion rates

## 🤝 Contributing

This is a production application for DTC team workflow management.

## 📝 License

MIT

## 🆘 Support

For setup issues, see [SETUP.md](SETUP.md) or check the logs in `server/logs/`

---

Built with ❤️ for DTC Team
