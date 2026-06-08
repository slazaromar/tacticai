from pydantic_settings import BaseSettings, SettingsConfigDict


class Configuracion(BaseSettings):
    # Aplicación
    NOMBRE_APP: str = "TacticAI Motor de Recomendación"
    DEPURAR:    bool = False

    # Seguridad interna
    INTERNAL_API_KEY: str = "internal_api_key_change_in_production"

    # Servicios
    DATABASE_URL: str = "postgresql://tacticai_user:tacticai_password@localhost:5432/tacticai"
    REDIS_URL:    str = "redis://:redis_password@localhost:6379/0"
    BACKEND_URL:  str = "http://localhost:4000"

    # Pesos del algoritmo de recomendación (deben sumar 1.0)
    PESO_FORMA:     float = 0.40
    PESO_ROL:       float = 0.30
    PESO_GENERAL:   float = 0.20
    PESO_CONTRATO:  float = 0.10

    # Tamaño del banquillo
    TAMANO_BANQUILLO: int = 7

    model_config = SettingsConfigDict(env_file=".env")


configuracion = Configuracion()
