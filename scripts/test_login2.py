import sys, os, asyncio
sys.path.insert(0, r'c:\Users\EDY\CodeBuddy\20260630145325\apps\api-py')
os.chdir(r'c:\Users\EDY\CodeBuddy\20260630145325\apps\api-py')

from security import verify_password
from database import async_session
from sqlalchemy import select
from models import SysUser

async def main():
    async with async_session() as db:
        r = await db.execute(select(SysUser).where(SysUser.username == 'admin'))
        user = r.scalar_one_or_none()
        if not user:
            print("NO USER")
            return
        print(f"User: {user.username}, password hash: {user.password[:30]}...")
        ok = verify_password('admin', user.password)
        print(f"Password match: {ok}")

asyncio.run(main())
