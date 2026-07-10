"""验证码安全存储 — 内存实现，带过期清理。
生产环境应迁移到 Redis 实现分布式共享。"""
import time
import random
import threading
from dataclasses import dataclass, field
from typing import Dict


@dataclass
class _CodeEntry:
    code: str
    expires_at: float


class VerificationCodeStore:
    """在内存中存储验证码，5分钟自动过期。定期清理过期条目。"""
    def __init__(self, ttl_seconds: int = 300):
        self._ttl = ttl_seconds
        self._store: Dict[str, _CodeEntry] = {}
        self._lock = threading.Lock()
        self._start_cleaner()

    def generate(self, email: str) -> str:
        code = str(random.randint(100000, 999999))
        with self._lock:
            self._store[email] = _CodeEntry(code=code, expires_at=time.time() + self._ttl)
        return code

    def verify(self, email: str, code: str) -> bool:
        with self._lock:
            entry = self._store.get(email)
            if entry is None:
                return False
            if time.time() > entry.expires_at:
                del self._store[email]
                return False
            if entry.code != code:
                return False
            # 一次性使用，验证后立即删除
            del self._store[email]
            return True

    def _cleanup(self):
        now = time.time()
        with self._lock:
            expired = [k for k, v in self._store.items() if now > v.expires_at]
            for k in expired:
                del self._store[k]

    def _start_cleaner(self):
        def _run():
            while True:
                time.sleep(60)
                self._cleanup()
        t = threading.Thread(target=_run, daemon=True)
        t.start()


# 全局单例
code_store = VerificationCodeStore(ttl_seconds=300)
