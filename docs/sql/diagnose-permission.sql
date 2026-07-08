-- ================================================================
-- 权限诊断 SQL — 排查普通用户无法查看线索详情问题
-- 使用方法：按顺序执行，观察输出结果
-- ================================================================

-- 1. 查看所有角色及其权限数量
SELECT r.id AS role_id, r.code, r.name,
       COUNT(rp.permission_id) AS permission_count
FROM sys_role r
LEFT JOIN sys_role_permission rp ON r.id = rp.role_id
WHERE r.is_deleted = 0
GROUP BY r.id, r.code, r.name;

-- 2. 查看 ROLE_USER (role_id=3) 拥有的所有权限
--    预期应包含 clue:list、pipeline:list 等 7 个 :list 权限
SELECT p.id, p.code, p.name
FROM sys_permission p
INNER JOIN sys_role_permission rp ON p.id = rp.permission_id
WHERE rp.role_id = 3 AND p.is_deleted = 0
ORDER BY p.id;

-- 3. 检查 ROLE_USER 是否缺少任何 :list 权限
--    如果这里有输出，说明初始化不完整
SELECT p.id, p.code, p.name
FROM sys_permission p
WHERE p.code LIKE '%:list' AND p.is_deleted = 0
  AND p.id NOT IN (
    SELECT rp.permission_id FROM sys_role_permission rp WHERE rp.role_id = 3
  );

-- 4. 查看所有用户及其角色绑定
SELECT u.id AS user_id, u.username, u.real_name, u.role_type, u.status,
       r.code AS role_code, r.name AS role_name
FROM sys_user u
LEFT JOIN sys_user_role ur ON u.id = ur.user_id
LEFT JOIN sys_role r ON ur.role_id = r.id AND r.is_deleted = 0
WHERE u.is_deleted = 0
ORDER BY u.id;

-- 5. 针对具体用户（替换 'your_username' 为实际用户名），检查其权限链
--    预期结果应包含 clue:list
SELECT DISTINCT p.code AS permission_code
FROM sys_user u
INNER JOIN sys_user_role ur ON u.id = ur.user_id
INNER JOIN sys_role_permission rp ON ur.role_id = rp.role_id
INNER JOIN sys_permission p ON rp.permission_id = p.id
WHERE u.username = 'your_username'
  AND p.is_deleted = 0
  AND u.is_deleted = 0
ORDER BY p.code;

-- 6. 检查是否有用户绑定了角色但角色未分配权限
SELECT u.username, u.real_name, r.code AS role_code,
       COUNT(rp.permission_id) AS permission_count
FROM sys_user u
INNER JOIN sys_user_role ur ON u.id = ur.user_id
INNER JOIN sys_role r ON ur.role_id = r.id AND r.is_deleted = 0
LEFT JOIN sys_role_permission rp ON r.id = rp.role_id
WHERE u.is_deleted = 0
GROUP BY u.username, u.real_name, r.code
HAVING COUNT(rp.permission_id) = 0;

-- 7. 查看种子权限是否全部创建成功
--    预期应有 32 条记录
SELECT COUNT(*) AS total_permissions FROM sys_permission WHERE is_deleted = 0;

-- 8. 快速修复：如果 ROLE_USER 缺少某些 :list 权限，可手动补充
--    注意：仅在确认权限缺失时执行！
-- INSERT IGNORE INTO sys_role_permission (role_id, permission_id)
-- SELECT 3, id FROM sys_permission WHERE code LIKE '%:list' AND is_deleted = 0;
