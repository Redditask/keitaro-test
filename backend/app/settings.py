from pydantic import AnyHttpUrl, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(hide_input_in_errors=True)

    app_name: str = "Relay API"
    database_url: SecretStr | None = None
    keitaro_base_url: AnyHttpUrl | None = None
    keitaro_api_key: SecretStr | None = None
    keitaro_timeout: float = Field(default=15, gt=0, allow_inf_nan=False)
