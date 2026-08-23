from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ParentLead Management API"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:5173"

    # --- Public site / SEO ---
    # The canonical origin the public site is served from. Canonical URLs,
    # og:url, absolute image URLs and sitemap entries are all built from this,
    # so it must be the real production origin (no trailing slash) or search
    # engines will index the wrong host.
    PUBLIC_BASE_URL: str = "http://localhost:5173"
    # Absolute path to the built frontend (`frontend/dist`). When set, the SEO
    # router serves index.html with per-page meta tags injected. Left empty in
    # development, where Vite serves the SPA itself.
    FRONTEND_DIST: str = ""
    # Guard against indexing a staging deployment: when False, robots.txt
    # disallows everything regardless of the per-route rules.
    SEO_INDEXING_ENABLED: bool = True

    @property
    def public_base_url(self) -> str:
        """Normalised — trailing slashes here would produce `//path` URLs."""
        return self.PUBLIC_BASE_URL.rstrip("/")

    @property
    def cors_origin_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        dev_origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]
        return list({*origins, *dev_origins})

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
