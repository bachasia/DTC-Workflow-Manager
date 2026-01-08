# Hướng dẫn tìm emails trong Lark Organization

## Cách 1: Qua Lark Admin Console (Dễ nhất)

### Bước 1: Đăng nhập Admin Console
1. Truy cập: https://feishu.cn/admin
2. Hoặc: https://www.larksuite.com/admin (phiên bản quốc tế)
3. Đăng nhập với tài khoản admin

### Bước 2: Xem danh sách members
1. Vào **通讯录** (Address Book) hoặc **Organization**
2. Chọn **成员管理** (Member Management) hoặc **People**
3. Bạn sẽ thấy danh sách tất cả members với:
   - Tên
   - Email
   - Phòng ban
   - Trạng thái

### Bước 3: Export danh sách (Optional)
- Click **导出** (Export) để tải file Excel
- File sẽ chứa tất cả thông tin members

---

## Cách 2: Qua Lark API (Tự động)

Sử dụng script để lấy danh sách users từ API.

### Chạy script:
\`\`\`bash
cd server
npx tsx src/scripts/list-all-lark-users.ts
\`\`\`

Script sẽ:
- ✅ Lấy tất cả users trong organization
- ✅ Hiển thị: Name, Email, User ID, Department
- ✅ So sánh với users trong database

---

## Cách 3: Kiểm tra trong Lark App

### Trên Desktop/Mobile:
1. Mở Lark/Feishu app
2. Vào **通讯录** (Contacts) 
3. Xem danh sách đồng nghiệp
4. Click vào từng người để xem email

---

## Lưu ý quan trọng:

⚠️ **Chỉ có thể gửi notification đến:**
- Users đã kích hoạt Lark account
- Users trong cùng organization với app
- Users chưa block bot

✅ **Email phải khớp chính xác:**
- Case-sensitive
- Không có khoảng trắng thừa
- Đúng domain (@company.com)
