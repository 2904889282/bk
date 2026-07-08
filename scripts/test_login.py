import urllib.request, json

data = json.dumps({"username": "admin", "password": "admin"}).encode()
req = urllib.request.Request("http://localhost:8080/api/auth/login", data=data,
    headers={"Content-Type": "application/json"}, method="POST")
try:
    resp = urllib.request.urlopen(req)
    print("OK:", json.dumps(json.loads(resp.read()), indent=2, ensure_ascii=False))
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()}")
except Exception as e:
    print("ERR:", e)
