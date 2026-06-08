from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

from app.core.configuracion import configuracion

cabecera_clave_api = APIKeyHeader(name="X-API-Key", auto_error=False)


async def requerir_clave_api(clave: str = Security(cabecera_clave_api)):
    if clave != configuracion.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clave de API ausente o no válida",
        )
    return clave
