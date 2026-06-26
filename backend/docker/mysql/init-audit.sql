USE beike_admin;
CREATE TABLE IF NOT EXISTS sys_audit_log (
  id VARCHAR(16) PRIMARY KEY,
  user_id VARCHAR(16), username VARCHAR(64), operation VARCHAR(32),
  target_type VARCHAR(32), target_id VARCHAR(16), detail TEXT,
  ip_address VARCHAR(64), user_agent VARCHAR(512),
  status INT DEFAULT 1, error_msg VARCHAR(512),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id), INDEX idx_created (created_at),
  INDEX idx_operation (operation), INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
