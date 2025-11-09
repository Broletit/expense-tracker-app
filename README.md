### Expense Tracker App

### 1. Giới thiệu
Ứng dụng Expense Tracker là hệ thống quản lý chi tiêu cá nhân được xây dựng bằng Next.js (App Router) kết hợp với SQLite, React Query, Tailwind CSS và Recharts.
Mục tiêu của ứng dụng là giúp người dùng theo dõi, phân tích và trực quan hóa thu – chi hàng ngày, hàng tháng, quản lý ngân sách, và chia sẻ báo cáo tài chính một cách nhanh chóng, dễ hiểu và bảo mật.

### 2. Chức năng chính
  ## Quản lý tài khoản
     - Đăng ký, đăng nhập, đăng xuất.
     - Chỉnh sửa hồ sơ cá nhân, đổi mật khẩu, cập nhật ảnh đại diện.
     - Hỗ trợ chế độ sáng và tối.
  ## Giao dịch (Expenses / Incomes)
     - Thêm, sửa, xóa các khoản thu chi.
     - Gắn danh mục, mô tả, ngày tháng cụ thể.
     - Tự động phân loại và tính tổng thu/chi theo tháng.
  ## Danh mục (Categories)
     - Tạo, chỉnh sửa, sắp xếp danh mục.
     - Mỗi danh mục có biểu tượng (icon) và màu riêng.
     - Tự động tổng hợp theo danh mục trong báo cáo.
  ## Ngân sách (Budgets)
     - Thiết lập hạn mức chi tiêu cho từng danh mục theo tháng.
     - Theo dõi tiến độ sử dụng ngân sách.
     - Cảnh báo khi chi vượt hạn mức.
  ## Báo cáo (Reports)
     - Biểu đồ cột và tròn thể hiện xu hướng thu – chi theo tháng và danh mục.
     - Biểu đồ đường thể hiện diễn biến theo ngày.
     - Thống kê theo thứ trong tuần.
     - Liệt kê giao dịch lớn nhất (Top transactions).
  ## Dashboard
     - Tổng quan thu nhập, chi tiêu, chênh lệch, ngày chi cao nhất.
     - Lịch giao dịch theo tháng.
     - Biểu đồ nhanh và bảng giao dịch gần nhất.
  ## Chia sẻ báo cáo (Shared Reports)
     - Tạo liên kết chia sẻ công khai cho báo cáo tài chính.
     - Liên kết có thời hạn (tự hết hạn sau khi đến ngày).
     - Người khác có thể xem mà không cần đăng nhập.

### 3. Công nghệ sử dụng
      Thành phần              |	     Công nghệ
      Framework	              |      Next.js 15 (App Router)
      Ngôn ngữ	              |      TypeScript
      Cơ sở dữ liệu           |      SQLite (better-sqlite3)
      Giao diện               |  	   TailwindCSS
      State / Data            |  	   React Query
      Biểu đồ	                |      Recharts
      Lưu phiên đăng nhập     |	     Iron Session
      Triển khai	            |      Vercel

### 4. Cấu trúc thư mục chính
src/
├── app/
│   ├── api/                # API routes (auth, reports, budgets, share…)
│   ├── dashboard/          # Trang tổng quan
│   ├── expenses/           # Trang quản lý chi tiêu
│   ├── categories/         # Trang danh mục
│   ├── budgets/            # Trang ngân sách
│   ├── reports/            # Trang báo cáo
│   ├── (share)/[id]/       # Trang báo cáo chia sẻ
│   ├── profile/            # Hồ sơ người dùng
│   └── layout.tsx          # Layout chung
│
├── components/
│   ├── ui/                 # Header, Panel, Button, Modal…
│   ├── dashboard/          # Calendar, StatsRow, RecentTable…
│   ├── reports/            # DualCharts, DailyLines, SharePopover…
│   └── expenses/           # ExpenseForm, ExpenseList…
│
├── lib/
│   ├── db/                 # Cấu hình SQLite và truy vấn
│   ├── auth/               # Xử lý đăng nhập, session
│   └── queries/            # React Query hooks
│
└── styles/
    └── globals.css         # Cấu hình Tailwind và style cơ bản

### 5. Cài đặt và chạy dự án
  ## Bước 1. Cài đặt môi trường
     npm install
  ## Cấu hình môi trường
    Tạo file .env.local ở thư mục gốc:
    IRON_SESSION_PASSWORD=your-secret-key-32-characters
    IRON_SESSION_COOKIE_NAME=session
  ## Bước 3. Chạy ứng dụng
    npm run dev
    Truy cập tại: http://localhost:3000
    -----------------------------------
    Build & chạy production:
    npm run build
    npm start
### 6. Cơ sở dữ liệu
    src/lib/db/database.sqlite
    (Có thể mở và chỉnh sửa dữ liệu bằng DB Browser for SQLite).
