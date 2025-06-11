# backend/app/config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'security-toolbox-key')
    TARGET_HOST = os.environ.get('TARGET_HOST', 'printnightmare.thm')
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    EXPLOITDB_PATH = '/app/exploitdb'
    REPORTS_PATH = '/app/reports'