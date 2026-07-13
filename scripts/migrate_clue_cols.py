import asyncio
from database import async_session
from sqlalchemy import text

async def run():
    async with async_session() as s:
        for col_name, col_def in [("converted_opportunity_id", "BIGINT"), ("is_converted", "TINYINT(1) DEFAULT 0")]:
            try:
                await s.execute(text(f"ALTER TABLE biz_clue ADD COLUMN {col_name} {col_def}"))
                await s.commit()
                print(f"OK: {col_name}")
            except Exception as e:
                await s.rollback()
                if "Duplicate" in str(e):
                    print(f"EXISTS: {col_name}")
                else:
                    print(f"ERR: {e}")

asyncio.run(run())
