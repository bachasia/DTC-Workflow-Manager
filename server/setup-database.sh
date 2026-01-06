#!/bin/bash

# DTC Workflow Manager - Database Setup Script
# This script creates a new database in your existing PostgreSQL instance

echo "🗄️  Setting up DTC Workflow database..."
echo ""

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="postgres123"
NEW_DB_NAME="dtc_workflow"
NEW_DB_USER="dtc_user"
NEW_DB_PASSWORD="dtc_password"

# Check if PostgreSQL is accessible
echo "📡 Checking PostgreSQL connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to PostgreSQL. Please check:"
    echo "   - PostgreSQL is running (docker ps)"
    echo "   - Credentials are correct"
    exit 1
fi

echo "✅ PostgreSQL connection successful"
echo ""

# Create new database
echo "📦 Creating database '$NEW_DB_NAME'..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $NEW_DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database '$NEW_DB_NAME' created"
else
    echo "⚠️  Database '$NEW_DB_NAME' already exists (skipping)"
fi

# Create new user
echo "👤 Creating user '$NEW_DB_USER'..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE USER $NEW_DB_USER WITH PASSWORD '$NEW_DB_PASSWORD';" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ User '$NEW_DB_USER' created"
else
    echo "⚠️  User '$NEW_DB_USER' already exists (skipping)"
fi

# Grant privileges
echo "🔐 Granting privileges..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $NEW_DB_NAME TO $NEW_DB_USER;"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $NEW_DB_NAME -c "GRANT ALL ON SCHEMA public TO $NEW_DB_USER;"

echo "✅ Privileges granted"
echo ""

# Create .env file
echo "📝 Creating .env file..."
cat > .env << EOF
# Database
DATABASE_URL="postgresql://$NEW_DB_USER:$NEW_DB_PASSWORD@$DB_HOST:$DB_PORT/$NEW_DB_NAME?schema=public"

# JWT Authentication
JWT_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'change-this-to-a-secure-random-string-minimum-32-chars')"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'change-this-refresh-secret-to-secure-string')"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Lark (Feishu) Integration
LARK_APP_ID="your-lark-app-id"
LARK_APP_SECRET="your-lark-app-secret"
LARK_VERIFICATION_TOKEN="your-webhook-verification-token"
LARK_ENCRYPT_KEY="your-encrypt-key"

# Lark Base Configuration
LARK_BASE_ID="your-lark-base-id"
LARK_REPORT_TABLE_ID="your-report-table-id"

# Lark Bot Configuration
LARK_BOT_NAME="DTC Workflow Bot"

# Gemini AI (for analytics)
GEMINI_API_KEY="your-gemini-api-key"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"

# WebSocket
WS_PORT=3002

# Logging
LOG_LEVEL="info"
EOF

echo "✅ .env file created"
echo ""

# Verify database exists
echo "🔍 Verifying setup..."
PGPASSWORD=$NEW_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $NEW_DB_USER -d $NEW_DB_NAME -c "\l" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database verification successful"
else
    echo "❌ Database verification failed"
    exit 1
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "📋 Summary:"
echo "   Database: $NEW_DB_NAME"
echo "   User: $NEW_DB_USER"
echo "   Host: $DB_HOST:$DB_PORT"
echo ""
echo "🚀 Next steps:"
echo "   1. Review and update .env file (especially Lark and Gemini API keys)"
echo "   2. Run: npm install"
echo "   3. Run: npm run prisma:generate"
echo "   4. Run: npm run prisma:migrate"
echo "   5. Run: npm run prisma:seed"
echo "   6. Run: npm run dev"
echo ""
