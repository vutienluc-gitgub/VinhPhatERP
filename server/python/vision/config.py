"""
Centralized Configuration for VinhPhatERP Vision Engine
Powered by pydantic-settings for type-safe, fail-fast configuration.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class VisionSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "server/python/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Gemini API Configuration
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_max_retries: int = 3
    gemini_timeout_sec: float = 30.0

    # Gate 0 Image Quality Thresholds
    min_resolution: int = 800
    min_blur_score: float = 100.0
    min_brightness: float = 40.0
    max_brightness: float = 240.0

    # 8-Level Mathematical Validation Tolerances (kg)
    scale_precision_kg: float = 0.10
    document_tolerance_kg: float = 0.15
    package_tolerance_kg: float = 0.05

    # Confidence Policy Thresholds
    confidence_critical: float = 0.95
    confidence_important: float = 0.85
    confidence_informational: float = 0.70

    # Self-Healing Orchestration
    max_correction_attempts: int = 1
    log_level: str = "INFO"

    # FastAPI Microservice
    host: str = "127.0.0.1"
    port: int = 8000
    internal_service_key: str = "dev-vinhphat-secret-key-change-in-prod"
    max_image_size_mb: int = 10


settings = VisionSettings()
