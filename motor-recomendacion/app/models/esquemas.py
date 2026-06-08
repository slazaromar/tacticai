from datetime import date
from typing   import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class JugadorEntrada(BaseModel):
    """Jugador tal y como llega desde el backend (claves en castellano)."""
    id:                  str           = Field(..., description="UUID del jugador en la base de datos")
    nombre:              str           = Field(..., description="Nombre completo del jugador")
    posicion:            str           = Field(..., description="Código de posición: PO, DFC, LI, LD, MCD, MC, MCO, MI, MD, EI, ED, SD, DC")
    rol_equipo:          str           = Field("rotacion", description="Rol: titular, rotacion, reserva, cantera")
    edad:                Optional[int]   = Field(None, ge=15, le=45)
    contrato_hasta:      Optional[str]   = Field(None, description="Fecha ISO de fin de contrato (p. ej. 2028-06-30)")
    puntuacion_forma:    Optional[float] = Field(None, ge=1, le=10,  description="Forma reciente del jugador (1–10)")
    puntuacion_general:  Optional[int]   = Field(None, ge=1, le=100, description="Valoración global del jugador (1–100)")
    esta_lesionado:      bool = Field(False, description="Si es True, el jugador se excluye de la recomendación")
    esta_sancionado:     bool = Field(False, description="Si es True, el jugador se excluye de la recomendación")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "nombre": "Pedri",
                "posicion": "MC",
                "rol_equipo": "titular",
                "edad": 23,
                "contrato_hasta": "2028-06-30",
                "puntuacion_forma": 8.4,
                "puntuacion_general": 88,
                "esta_lesionado": False,
                "esta_sancionado": False,
            }
        }
    }


class PartidoEntrada(BaseModel):
    id:                str
    equipo_local:      Optional[Dict[str, Any]] = None
    equipo_visitante:  Optional[Dict[str, Any]] = None
    fecha_partido:     Optional[str] = None
    competicion:       Optional[str] = None


class SolicitudRecomendacion(BaseModel):
    jugadores:  List[JugadorEntrada] = Field(..., description="Lista completa de jugadores de la plantilla")
    partido:    Optional[PartidoEntrada] = Field(None, description="Información del partido (opcional, para metadatos)")
    formacion:  str = Field("4-3-3", description="Formación táctica: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-3-2")

    model_config = {
        "json_schema_extra": {
            "example": {
                "formacion": "4-3-3",
                "partido": {"id": "20000000-0000-0000-0000-000000000001"},
                "jugadores": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "nombre": "Pedri",
                        "posicion": "MC",
                        "rol_equipo": "titular",
                        "puntuacion_forma": 8.4,
                        "puntuacion_general": 88,
                        "contrato_hasta": "2028-06-30",
                    }
                ],
            }
        }
    }


class JugadorPuntuado(BaseModel):
    id:                       str
    nombre:                   str
    posicion:                 str   = Field(..., description="Posición natural del jugador")
    posicion_alineacion:      str   = Field(..., description="Posición asignada en la formación")
    rol_equipo:               str
    puntuacion_forma:         Optional[float]
    puntuacion_general:       Optional[int]
    contrato_hasta:           Optional[str]
    esta_lesionado:           bool
    esta_sancionado:          bool
    es_titular:               bool  = Field(..., description="True si entra en el once inicial, False si está en el banquillo")
    puntuacion_recomendacion: float = Field(..., description="Puntuación final ponderada (0–100)")
    desglose_puntuacion:      Dict[str, float] = Field(..., description="Aportación de cada factor: forma, rol, contrato, general")


class RespuestaRecomendacion(BaseModel):
    formacion:        str
    jugadores:        List[JugadorPuntuado] = Field(..., description="Lista ordenada: primero los 11 titulares, luego el banquillo (máx. 7)")
    puntuacion_media: float = Field(..., description="Puntuación media de los 11 titulares")
    total_puntuados:  int   = Field(..., description="Número de jugadores procesados")
    metadatos:        Dict[str, Any] = Field({}, description="Información adicional: pesos utilizados, jugadores no disponibles, id del partido")
