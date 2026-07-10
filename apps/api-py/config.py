import os
import secrets
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'),
        env_file_encoding='utf-8',
    )
    # 数据库 — 无硬编码默认值，必须通过 .env 或环境变量提供
    db_host: str = ""
    db_port: int = 3306
    db_name: str = ""
    db_user: str = ""
    db_password: str = ""
    # JWT — 无默认值则自动生成随机密钥（仅用于开发环境）
    jwt_secret: str = ""
    jwt_access_expire_hours: int = 1
    jwt_refresh_expire_days: int = 7
    upload_dir: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    log_dir: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.jwt_secret:
            if os.environ.get("ENV", "dev") == "dev":
                self.jwt_secret = secrets.token_hex(48)
                print("[WARNING] JWT_SECRET not set, using random key for this session")
            else:
                raise ValueError(
                    "JWT_SECRET must be set in production. "
                    "Set it via the JWT_SECRET environment variable or .env file."
                )

settings = Settings()
