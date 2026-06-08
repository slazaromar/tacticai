from datetime import date, datetime
from typing   import List, Dict

import numpy  as np
import pandas as pd

from app.models.esquemas import JugadorEntrada


PUNTUACION_ROL: Dict[str, float] = {
    "titular":  1.00,
    "rotacion": 0.70,
    "reserva":  0.40,
    "cantera":  0.20,
}


def jugadores_a_dataframe(jugadores: List[JugadorEntrada]) -> pd.DataFrame:
    registros = [j.model_dump() for j in jugadores]
    df = pd.DataFrame(registros)

    if df.empty:
        return df
    forma_media = df["puntuacion_forma"].mean(skipna=True)
    df["puntuacion_forma"] = df["puntuacion_forma"].fillna(
        forma_media if not np.isnan(forma_media) else 5.0
    )
    df["puntuacion_general"] = df["puntuacion_general"].fillna(70).astype(float)
    df["puntuacion_rol"] = df["rol_equipo"].map(PUNTUACION_ROL).fillna(0.5)
    hoy = date.today()
    def puntuacion_contrato(hasta_str):
        if not hasta_str:
            return 0.3   # desconocido → estabilidad por debajo de la media
        try:
            hasta = datetime.fromisoformat(str(hasta_str)).date()
            anos_restantes = (hasta - hoy).days / 365.25
            # Normaliza: 0 años → 0.0, 5+ años → 1.0
            return float(np.clip(anos_restantes / 5.0, 0.0, 1.0))
        except Exception:
            return 0.3

    df["puntuacion_contrato"] = df["contrato_hasta"].apply(puntuacion_contrato)
    df["forma_norm"]   = (df["puntuacion_forma"]   - 1) / 9.0
    df["general_norm"] = (df["puntuacion_general"] - 1) / 99.0
    df["disponible"] = ~(df["esta_lesionado"] | df["esta_sancionado"])

    return df


def calcular_puntuaciones(df: pd.DataFrame, pesos: Dict[str, float]) -> pd.DataFrame:
    df = df.copy()
    df["puntuacion_recomendacion"] = (
        pesos["forma"]    * df["forma_norm"]          * 100 +
        pesos["rol"]      * df["puntuacion_rol"]      * 100 +
        pesos["contrato"] * df["puntuacion_contrato"] * 100 +
        pesos["general"]  * df["general_norm"]        * 100
    ).round(2)

    df["desglose_puntuacion"] = df.apply(
        lambda r: {
            "forma":    round(pesos["forma"]    * r["forma_norm"]          * 100, 2),
            "rol":      round(pesos["rol"]      * r["puntuacion_rol"]      * 100, 2),
            "contrato": round(pesos["contrato"] * r["puntuacion_contrato"] * 100, 2),
            "general":  round(pesos["general"]  * r["general_norm"]        * 100, 2),
        },
        axis=1,
    )

    return df
