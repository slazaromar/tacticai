from fastapi import APIRouter, Depends

from app.core.seguridad           import requerir_clave_api
from app.models.esquemas          import SolicitudRecomendacion, RespuestaRecomendacion
from app.services.recomendacion   import generar_recomendacion

router = APIRouter()


@router.post(
    "/recomendar",
    response_model=RespuestaRecomendacion,
    summary="Generar recomendación de alineación",
    description=(
        "Analiza la plantilla de jugadores disponibles y genera la alineación óptima "
        "para la formación indicada. Los jugadores lesionados o sancionados se excluyen "
        "automáticamente. El algoritmo pondera: **40% forma**, **30% rol en el equipo**, "
        "**20% valoración general**, **10% estabilidad de contrato**.\n\n"
        "Requiere la cabecera `X-API-Key` con la clave interna del servicio."
    ),
    responses={
        200: {"description": "Alineación generada con titulares y banquillo"},
        401: {"description": "Clave API inválida o ausente"},
        422: {"description": "Datos de entrada no válidos"},
    },
)
async def recomendar_alineacion(
    cuerpo: SolicitudRecomendacion,
    _clave: str = Depends(requerir_clave_api),
) -> RespuestaRecomendacion:
    return generar_recomendacion(
        jugadores=cuerpo.jugadores,
        formacion=cuerpo.formacion,
        partido=cuerpo.partido,
    )
