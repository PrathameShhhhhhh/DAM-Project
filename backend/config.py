"""
Flask App Configuration (Person 3 Module)
"""

import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dam-monitoring-ai-secret-key")
    HOST = os.environ.get("HOST", "0.0.0.0")
    PORT = int(os.environ.get("PORT", 5000))
    DEBUG = os.environ.get("DEBUG", "True").lower() == "true"
