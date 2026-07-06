-- 在主库执行后，从库执行此脚本建立复制
CHANGE MASTER TO
  MASTER_HOST = 'mysql-master',
  MASTER_PORT = 3306,
  MASTER_USER = 'replica',
  MASTER_PASSWORD = 'replica_pass_2024',
  MASTER_AUTO_POSITION = 1;

START SLAVE;

-- 验证复制状态
SHOW SLAVE STATUS\G;
