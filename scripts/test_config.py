import sys, os
sys.path.insert(0, r'c:\Users\EDY\CodeBuddy\20260630145325\apps\api-py')
os.chdir(r'c:\Users\EDY\CodeBuddy\20260630145325\apps\api-py')
from config import settings
print("db_host:", settings.db_host)
print("db_port:", settings.db_port)
print("db_name:", settings.db_name)
print("db_user:", settings.db_user)
