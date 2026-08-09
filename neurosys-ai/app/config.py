import os

class Settings:
    PROJECT_NAME: str = "NeuroSys AI Predictive Service"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", 8000))

settings = Settings()
