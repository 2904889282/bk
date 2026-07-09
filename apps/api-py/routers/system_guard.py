"""为 system.py 所有管理端点加 require_admin 调用"""
import re

with open('system.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 在每个 user=Depends(get_current_user_with_role) 之后、函数体之前加 require_admin
new_lines = []
for line in lines:
    new_lines.append(line)
    if 'user=Depends(get_current_user_with_role)' in line and 'async def' in line:
        indent = len(line) - len(line.lstrip())
        new_lines.append(' ' * (indent + 4) + 'require_admin(user)\n')

with open('system.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("done")
