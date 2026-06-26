CREATE DATABASE IF NOT EXISTS beike_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS seata DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE beike_admin;

CREATE TABLE IF NOT EXISTS pipelines (
  id VARCHAR(16) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  stage VARCHAR(32) NOT NULL DEFAULT 'lead',
  client VARCHAR(128),
  product VARCHAR(64),
  industry VARCHAR(32),
  amount DECIMAL(12,2) DEFAULT 0,
  win_rate INT DEFAULT 0,
  priority VARCHAR(16) DEFAULT 'normal',
  manager VARCHAR(64),
  ar_id VARCHAR(64),
  sr_id VARCHAR(64),
  fr_id VARCHAR(64),
  source VARCHAR(64),
  description TEXT,
  next_action VARCHAR(256),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(64),
  INDEX idx_stage (stage),
  INDEX idx_manager (manager),
  INDEX idx_product (product),
  INDEX idx_industry (industry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(16) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  stage VARCHAR(32) NOT NULL DEFAULT 'initiation',
  manager VARCHAR(64),
  manager_id VARCHAR(64),
  client VARCHAR(128),
  amount DECIMAL(12,2) DEFAULT 0,
  progress INT DEFAULT 0,
  start_date DATE,
  expected_end DATE,
  status VARCHAR(16) DEFAULT 'active',
  description TEXT,
  ltc_pipeline_id VARCHAR(16),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stage (stage),
  INDEX idx_manager (manager),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS risks (
  id VARCHAR(16) PRIMARY KEY,
  project_id VARCHAR(16) NOT NULL,
  type VARCHAR(64),
  level VARCHAR(16) DEFAULT 'medium',
  description TEXT,
  solution TEXT,
  owner VARCHAR(64),
  status VARCHAR(16) DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project (project_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS talent (
  id VARCHAR(16) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  role VARCHAR(64),
  skills VARCHAR(256),
  current_project VARCHAR(256),
  utilization INT DEFAULT 0,
  status VARCHAR(16) DEFAULT 'normal',
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(16) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password VARCHAR(256) NOT NULL,
  name VARCHAR(64),
  role VARCHAR(32) DEFAULT 'manager',
  avatar VARCHAR(8),
  status INT DEFAULT 1,
  phone VARCHAR(16),
  email VARCHAR(128),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 默认管理员
INSERT INTO users (id, username, password, name, role, avatar) VALUES
('U001', 'admin', '$2b$12$LiImHxSuUrccygtcxvQID.PUOLQK1Nve6./XjTklMgbPK3LEssONa', '管理员', 'admin', '👨‍💼'),
('U002', 'zhangming', '$2b$12$BxdG3GCUqNV/KdStLju3Rutj3XoahSY4MK6gbaZfLzEur5iF8FKZi', '张明', 'manager', '👤')
ON DUPLICATE KEY UPDATE username=username;
