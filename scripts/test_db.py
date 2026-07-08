import sys, asyncio
sys.path.insert(0, r'c:\Users\EDY\CodeBuddy\20260630145325\apps\api-py')
from database import engine
from sqlalchemy import text

async def main():
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT 1"))
        print("DB OK:", r.first())

asyncio.run(main())
