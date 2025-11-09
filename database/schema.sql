PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- USERS
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,                    
  name          TEXT,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
, avatar TEXT)

CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT DEFAULT '📁',
  color      TEXT DEFAULT '#3b82f6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, name)                                   
);

-- Không cho xoá danh mục đang được dùng ở expenses
CREATE TRIGGER IF NOT EXISTS prevent_delete_used_category
BEFORE DELETE ON categories
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM expenses WHERE category_id = OLD.id)
    THEN RAISE(ABORT, 'Cannot delete category in use')
  END;
END;

-- Tối ưu sắp xếp và lọc theo user/sort
CREATE INDEX IF NOT EXISTS idx_cat_user_sort        ON categories(user_id, sort_order);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  category_id  INTEGER,
  amount       REAL NOT NULL CHECK(amount > 0),
  description  TEXT,
  date         TEXT NOT NULL,                              
  kind         TEXT NOT NULL CHECK(kind IN ('expense','income')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Indexes cho truy vấn nhanh (dashboard/reports)
CREATE INDEX IF NOT EXISTS idx_exp_user_date        ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_exp_user_kind_date   ON expenses(user_id, kind, date DESC);
CREATE INDEX IF NOT EXISTS idx_exp_category         ON expenses(category_id);

-- BUDGETS (mỗi ngân sách chỉ có 1 hạn mức cho 1 danh mục trong 1 tháng)
CREATE TABLE IF NOT EXISTS budgets (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  category_id    INTEGER NOT NULL,                 
  period         TEXT NOT NULL,                    
  limit_amount   REAL NOT NULL CHECK(limit_amount >= 0),
  note           TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  UNIQUE (user_id, category_id, period)                 
);

-- Gợi ý index bổ sung cho các truy vấn phổ biến
CREATE INDEX IF NOT EXISTS idx_budgets_user_period   ON budgets(user_id, period);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category_id);

-- SHARED REPORTS 
CREATE TABLE IF NOT EXISTS shared_reports (
  id         TEXT PRIMARY KEY,                           
  user_id    INTEGER NOT NULL,
  title      TEXT NOT NULL,
  payload    TEXT NOT NULL,                              
  filters    TEXT,                                         
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,                                         
  is_deleted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shared_reports_user    ON shared_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_created ON shared_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_shared_reports_alive   ON shared_reports(is_deleted, expires_at);

-- VIEWS
-- Số lần danh mục được dùng
CREATE VIEW IF NOT EXISTS v_category_usage AS
SELECT c.id,
       c.user_id,
       COUNT(e.id) AS usage_count
FROM categories c
LEFT JOIN expenses e ON e.category_id = c.id
GROUP BY c.id, c.user_id;

-- Tổng chi/thu theo ngày
CREATE VIEW IF NOT EXISTS v_expenses_daily AS
SELECT user_id,
       date,
       SUM(CASE WHEN kind='expense' THEN amount ELSE 0 END) AS total_expense,
       SUM(CASE WHEN kind='income'  THEN amount ELSE 0 END) AS total_income,
       COUNT(*) AS count
FROM expenses
GROUP BY user_id, date;

-- Tổng chi/thu theo tháng 
CREATE VIEW IF NOT EXISTS v_expenses_monthly AS
SELECT user_id,
       substr(date,1,7) AS month,
       SUM(CASE WHEN kind='expense' THEN amount ELSE 0 END) AS total_expense,
       SUM(CASE WHEN kind='income'  THEN amount ELSE 0 END) AS total_income
FROM expenses
GROUP BY user_id, month;

-- Tiến độ ngân sách theo tháng
CREATE VIEW IF NOT EXISTS v_budget_progress AS
SELECT
  b.id,
  b.user_id,
  b.category_id,
  b.period,
  b.limit_amount,
  b.note,
  COALESCE(SUM(CASE WHEN e.kind='income'  THEN e.amount END),0)   AS income_actual,
  COALESCE(SUM(CASE WHEN e.kind='expense' THEN e.amount END),0)   AS expense_actual,
  CASE
    WHEN (COALESCE(SUM(CASE WHEN e.kind='expense' THEN e.amount END),0)
        - COALESCE(SUM(CASE WHEN e.kind='income'  THEN e.amount END),0)) > b.limit_amount
    THEN 1 ELSE 0
  END AS over_budget
FROM budgets b
LEFT JOIN expenses e
  ON e.user_id = b.user_id
 AND substr(e.date,1,7) = b.period
 AND e.category_id = b.category_id
GROUP BY b.id;
