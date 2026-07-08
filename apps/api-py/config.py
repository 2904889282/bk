import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'),
        env_file_encoding='utf-8',
    )
    db_host: str = "localhost"
    db_port: int = 3306
    db_name: str = "beike_platform"
    db_user: str = "beike"
    db_password: str = "BEIKEadmin123"
    jwt_secret: str = "beike-cloud-dev-jwt-secret-2026-must-be-at-least-64-characters-long-for-hs384"
    jwt_access_expire_hours: int = 72
    jwt_refresh_expire_days: int = 30
    upload_dir: str = "./uploads"
    log_dir: str = "./logs"

settings = Settings()
