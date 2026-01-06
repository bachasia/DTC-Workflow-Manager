# Quick Start Guide - Using Existing PostgreSQL

## Bạn Đã Có PostgreSQL Container

Bạn đang sử dụng PostgreSQL container `disputes-postgres` với:
- Host: `localhost:5432`
- User: `postgres`
- Password: `postgres123`
- Database hiện tại: `disputes_db`

## Setup Tự Động (Khuyến Nghị)

### Trên Windows:

```bash
cd server
setup-database.bat
```

Script này sẽ tự động:
1. ✅ Tạo database mới `dtc_workflow`
2. ✅ Tạo user mới `dtc_user` với password `dtc_password`
3. ✅ Cấp quyền truy cập
4. ✅ Tạo file `.env` với cấu hình đúng

### Trên Linux/Mac:

```bash
cd server
chmod +x setup-database.sh
./setup-database.sh
```

## Setup Thủ Công

Nếu script không chạy được, làm thủ công:

### 1. Tạo Database và User

```bash
# Kết nối vào PostgreSQL
docker exec -it disputes-postgres psql -U postgres

# Chạy các lệnh SQL
CREATE DATABASE dtc_workflow;
CREATE USER dtc_user WITH PASSWORD 'dtc_password';
GRANT ALL PRIVILEGES ON DATABASE dtc_workflow TO dtc_user;
GRANT ALL ON SCHEMA public TO dtc_user;
\q
```

### 2. Tạo File .env

Tạo file `server/.env` với nội dung:

```env
DATABASE_URL="postgresql://dtc_user:dtc_password@localhost:5432/dtc_workflow?schema=public"

JWT_SECRET="your-secure-random-string-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Lark credentials (cập nhật sau)
LARK_APP_ID="your-lark-app-id"
LARK_APP_SECRET="your-lark-app-secret"
LARK_BASE_ID="your-lark-base-id"
LARK_REPORT_TABLE_ID="your-report-table-id"

# Gemini API (cập nhật sau)
GEMINI_API_KEY="your-gemini-api-key"
```

## Sau Khi Setup Database

```bash
cd server

# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run prisma:generate

# 3. Run migrations
npm run prisma:migrate

# 4. Seed sample data
npm run prisma:seed

# 5. Start server
npm run dev
```

Server sẽ chạy tại: `http://localhost:3001`

## Kiểm Tra Database

```bash
# Xem danh sách databases
docker exec -it disputes-postgres psql -U postgres -c "\l"

# Kết nối vào database mới
docker exec -it disputes-postgres psql -U dtc_user -d dtc_workflow

# Xem tables (sau khi migrate)
\dt
```

## Lưu Ý

- ✅ Database `dtc_workflow` **tách biệt hoàn toàn** với `disputes_db`
- ✅ Dùng chung PostgreSQL container (tiết kiệm tài nguyên)
- ✅ Không conflict dữ liệu giữa 2 dự án
- ✅ Có thể chạy đồng thời cả 2 dự án

## Troubleshooting

### Lỗi: "database already exists"
→ Database đã được tạo, bỏ qua và tiếp tục

### Lỗi: "role already exists"
→ User đã được tạo, bỏ qua và tiếp tục

### Lỗi: "connection refused"
→ Kiểm tra PostgreSQL container đang chạy: `docker ps`

### Lỗi khi migrate
→ Kiểm tra DATABASE_URL trong .env đúng chưa
