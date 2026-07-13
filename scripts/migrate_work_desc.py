import asyncio
from database import async_session
from sqlalchemy import text

async def run():
    async with async_session() as s:
        try:
            await s.execute(text("ALTER TABLE biz_project_team ADD COLUMN work_description TEXT COMMENT 'work description'"))
            await s.commit()
            print("MIGRATION OK")
        except Exception as e:
            if "Duplicate column" in str(e):
                print("Column already exists, skipping")
            else:
                print(f"Error: {e}")

asyncio.run(run())
