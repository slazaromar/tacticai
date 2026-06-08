from typing import Dict, List, Tuple

import pandas as pd

from app.core.configuracion         import configuracion
from app.models.esquemas            import (
    JugadorEntrada, JugadorPuntuado, RespuestaRecomendacion, PartidoEntrada,
)
from app.services.procesador_datos  import jugadores_a_dataframe, calcular_puntuaciones


FORMACIONES: Dict[str, List[Tuple[str, str]]] = {
    "4-3-3": [
        ("PO",  "PO"),
        ("LI",  "LI"), ("DFC", "DFC"), ("DFC", "DFC"), ("LD",  "LD"),
        ("MC",  "MC"), ("MC",  "MC"),  ("MC",  "MC"),
        ("EI",  "EI"), ("DC",  "DC"),  ("ED",  "ED"),
    ],
    "4-4-2": [
        ("PO",  "PO"),
        ("LI",  "LI"), ("DFC", "DFC"), ("DFC", "DFC"), ("LD",  "LD"),
        ("MI",  "MI"), ("MC",  "MC"),  ("MC",  "MC"),  ("MD",  "MD"),
        ("DC",  "DC"), ("DC",  "DC"),
    ],
    "4-2-3-1": [
        ("PO",  "PO"),
        ("LI",  "LI"), ("DFC", "DFC"), ("DFC", "DFC"), ("LD",  "LD"),
        ("MCD", "MCD"), ("MCD", "MCD"),
        ("MI",  "MI"), ("MCO", "MCO"), ("MD",  "MD"),
        ("DC",  "DC"),
    ],
    "3-5-2": [
        ("PO",  "PO"),
        ("DFC", "DFC"), ("DFC", "DFC"), ("DFC", "DFC"),
        ("MI",  "MI"), ("MC",  "MC"), ("MC", "MC"), ("MC", "MC"), ("MD", "MD"),
        ("DC",  "DC"), ("DC",  "DC"),
    ],
    "5-3-2": [
        ("PO",  "PO"),
        ("LI",  "LI"), ("DFC", "DFC"), ("DFC", "DFC"), ("DFC", "DFC"), ("LD", "LD"),
        ("MC",  "MC"), ("MC",  "MC"),  ("MC",  "MC"),
        ("DC",  "DC"), ("DC",  "DC"),
    ],
}

COMPATIBILIDAD_POSICIONES: Dict[str, List[str]] = {
    "PO":  ["PO"],
    "DFC": ["DFC"],
    "LI":  ["LI", "DFC"],
    "LD":  ["LD", "DFC"],
    "MCD": ["MCD", "MC"],
    "MC":  ["MC", "MCD", "MCO"],
    "MCO": ["MCO", "MC"],
    "MI":  ["MI", "MC", "EI"],
    "MD":  ["MD", "MC", "ED"],
    "EI":  ["EI", "MI", "SD"],
    "ED":  ["ED", "MD", "SD"],
    "SD":  ["SD", "DC", "EI", "ED"],
    "DC":  ["DC", "SD"],
}


def _obtener_pesos() -> Dict[str, float]:
    return {
        "forma":    configuracion.PESO_FORMA,
        "rol":      configuracion.PESO_ROL,
        "contrato": configuracion.PESO_CONTRATO,
        "general":  configuracion.PESO_GENERAL,
    }


def generar_recomendacion(
    jugadores: List[JugadorEntrada],
    formacion: str,
    partido: PartidoEntrada | None = None,
) -> RespuestaRecomendacion:
    pesos     = _obtener_pesos()
    formacion = formacion if formacion in FORMACIONES else "4-3-3"
    slots     = FORMACIONES[formacion]

    df = jugadores_a_dataframe(jugadores)
    df = calcular_puntuaciones(df, pesos)

    df_disponibles    = df[df["disponible"]].copy()
    df_no_disponibles = df[~df["disponible"]].copy()
    ids_seleccionados: set[str] = set()
    # Una posición por slot para preservar el orden de la formación
    titulares_por_slot: List[JugadorPuntuado | None] = [None] * len(slots)

    # Primera pasada: cubrir slots con candidatos de posición exacta
    for i, (slot, _etiqueta) in enumerate(slots):
        candidatos = df_disponibles[
            (df_disponibles["posicion"] == slot) &
            (~df_disponibles["id"].isin(ids_seleccionados))
        ].sort_values("puntuacion_recomendacion", ascending=False)

        if candidatos.empty:
            continue

        fila = candidatos.iloc[0]
        ids_seleccionados.add(fila["id"])
        titulares_por_slot[i] = _fila_a_jugador(fila, slot, es_titular=True)

    # Segunda pasada: cubrir slots vacíos con posiciones compatibles
    for i, (slot, _etiqueta) in enumerate(slots):
        if titulares_por_slot[i] is not None:
            continue

        compatibles = COMPATIBILIDAD_POSICIONES.get(slot, [slot])
        candidatos  = df_disponibles[
            (df_disponibles["posicion"].isin(compatibles)) &
            (~df_disponibles["id"].isin(ids_seleccionados))
        ].sort_values("puntuacion_recomendacion", ascending=False)

        if candidatos.empty:
            # Último recurso: cualquier jugador disponible excepto portero (salvo que el slot sea PO)
            candidatos = df_disponibles[
                (~df_disponibles["id"].isin(ids_seleccionados)) &
                (df_disponibles["posicion"] != "PO") if slot != "PO" else
                (~df_disponibles["id"].isin(ids_seleccionados))
            ].sort_values("puntuacion_recomendacion", ascending=False)

        if candidatos.empty:
            continue

        fila = candidatos.iloc[0]
        ids_seleccionados.add(fila["id"])
        titulares_por_slot[i] = _fila_a_jugador(fila, slot, es_titular=True)

    titulares: List[JugadorPuntuado] = [j for j in titulares_por_slot if j is not None]
    banquillo: List[JugadorPuntuado] = []
    candidatos_banquillo = df_disponibles[~df_disponibles["id"].isin(ids_seleccionados)].sort_values(
        "puntuacion_recomendacion", ascending=False
    )

    for _, fila in candidatos_banquillo.head(configuracion.TAMANO_BANQUILLO).iterrows():
        banquillo.append(_fila_a_jugador(fila, fila["posicion"], es_titular=False))

    todos = titulares + banquillo
    puntuacion_media = (
        round(sum(p.puntuacion_recomendacion for p in titulares) / len(titulares), 2)
        if titulares else 0.0
    )

    return RespuestaRecomendacion(
        formacion=formacion,
        jugadores=todos,
        puntuacion_media=puntuacion_media,
        total_puntuados=len(df),
        metadatos={
            "pesos":              pesos,
            "no_disponibles":     len(df_no_disponibles),
            "id_partido":         partido.id if partido else None,
        },
    )


def _fila_a_jugador(fila: pd.Series, posicion_alineacion: str, es_titular: bool) -> JugadorPuntuado:
    return JugadorPuntuado(
        id=fila["id"],
        nombre=fila["nombre"],
        posicion=fila["posicion"],
        posicion_alineacion=posicion_alineacion,
        rol_equipo=fila["rol_equipo"],
        puntuacion_forma=fila.get("puntuacion_forma"),
        puntuacion_general=int(fila["puntuacion_general"]) if pd.notna(fila["puntuacion_general"]) else None,
        contrato_hasta=str(fila.get("contrato_hasta")) if fila.get("contrato_hasta") else None,
        esta_lesionado=bool(fila["esta_lesionado"]),
        esta_sancionado=bool(fila["esta_sancionado"]),
        es_titular=es_titular,
        puntuacion_recomendacion=float(fila["puntuacion_recomendacion"]),
        desglose_puntuacion=fila["desglose_puntuacion"],
    )
