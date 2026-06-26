const STORAGE_KEY = 'beike_data';

const storage = {
  _memory: {} as Record<string, string>,
  _available: true,
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._initialized = true;
    try {
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
      this._available = true;
    } catch {
      this._available = false;
    }
  },

  get(key: string): string | null {
    if (this._available) {
      try { return localStorage.getItem(key); } catch {}
    }
    return this._memory[key] ?? null;
  },

  set(key: string, value: string) {
    if (this._available) {
      try { localStorage.setItem(key, value); return; } catch { this._available = false; }
    }
    this._memory[key] = value;
  },

  remove(key: string) {
    if (this._available) try { localStorage.removeItem(key); } catch {}
    delete this._memory[key];
  }
};

storage.init();

export function loadAppData<T>(defaultData: T, key = STORAGE_KEY): T {
  const raw = storage.get(key);
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return defaultData;
}

export function saveAppData<T>(data: T, key = STORAGE_KEY) {
  storage.set(key, JSON.stringify(data));
}

export { storage };
export default storage;
