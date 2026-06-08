import pytest
import pandas as pd
import numpy as np
from datetime import date, timedelta

from app.models.esquemas        import JugadorEntrada
from app.services.procesador_datos import jugadores_a_dataframe, calcular_puntuaciones, PUNTUACION_ROL


def _jugador(**kwargs) -> JugadorEntrada:
    defaults = dict(
        id="test-id",
        nombre="Jugador Test",
        posicion="MC",
        rol_equipo="titular",
        contrato_hasta=str(date.today() + timedelta(days=365 * 3)),
        puntuacion_forma=7.0,
        puntuacion_general=80,
    )
    defaults.update(kwargs)
    return JugadorEntrada(**defaults)


PESOS = {"forma": 0.40, "rol": 0.30, "contrato": 0.10, "general": 0.20}


class TestJugadoresADataframe:
    def test_columnas_obligatorias_presentes(self):
        df = jugadores_a_dataframe([_jugador()])
        for col in ["puntuacion_rol", "puntuacion_contrato", "forma_norm", "general_norm", "disponible"]:
            assert col in df.columns

    def test_jugador_lesionado_no_disponible(self):
        df = jugadores_a_dataframe([_jugador(esta_lesionado=True)])
        assert not df.loc[0, "disponible"]

    def test_jugador_sancionado_no_disponible(self):
        df = jugadores_a_dataframe([_jugador(esta_sancionado=True)])
        assert not df.loc[0, "disponible"]

    def test_jugador_disponible(self):
        df = jugadores_a_dataframe([_jugador()])
        assert df.loc[0, "disponible"]

    def test_forma_nula_usa_media(self):
        j1 = _jugador(id="a", puntuacion_forma=8.0)
        j2 = _jugador(id="b", puntuacion_forma=None)
        df = jugadores_a_dataframe([j1, j2])
        assert df.loc[1, "puntuacion_forma"] == pytest.approx(8.0)

    def test_general_nulo_usa_70(self):
        df = jugadores_a_dataframe([_jugador(puntuacion_general=None)])
        assert df.loc[0, "puntuacion_general"] == pytest.approx(70.0)

    def test_puntuacion_rol_titular(self):
        df = jugadores_a_dataframe([_jugador(rol_equipo="titular")])
        assert df.loc[0, "puntuacion_rol"] == pytest.approx(PUNTUACION_ROL["titular"])

    def test_puntuacion_rol_cantera(self):
        df = jugadores_a_dataframe([_jugador(rol_equipo="cantera")])
        assert df.loc[0, "puntuacion_rol"] == pytest.approx(PUNTUACION_ROL["cantera"])

    def test_contrato_vencido_puntuacion_cero(self):
        pasado = str(date.today() - timedelta(days=30))
        df = jugadores_a_dataframe([_jugador(contrato_hasta=pasado)])
        assert df.loc[0, "puntuacion_contrato"] == pytest.approx(0.0)

    def test_contrato_cinco_anos_puntuacion_uno(self):
        futuro = str(date.today() + timedelta(days=int(365.25 * 5)))
        df = jugadores_a_dataframe([_jugador(contrato_hasta=futuro)])
        assert df.loc[0, "puntuacion_contrato"] == pytest.approx(1.0, abs=0.05)

    def test_forma_norm_rango_0_1(self):
        j_min = _jugador(id="a", puntuacion_forma=1.0)
        j_max = _jugador(id="b", puntuacion_forma=10.0)
        df = jugadores_a_dataframe([j_min, j_max])
        assert df.loc[0, "forma_norm"] == pytest.approx(0.0)
        assert df.loc[1, "forma_norm"] == pytest.approx(1.0)

    def test_dataframe_vacio(self):
        df = jugadores_a_dataframe([])
        assert df.empty


class TestCalcularPuntuaciones:
    def test_puntuacion_en_rango_0_100(self):
        df = jugadores_a_dataframe([_jugador()])
        df = calcular_puntuaciones(df, PESOS)
        assert 0 <= df.loc[0, "puntuacion_recomendacion"] <= 100

    def test_desglose_suma_igual_total(self):
        df = jugadores_a_dataframe([_jugador()])
        df = calcular_puntuaciones(df, PESOS)
        d = df.loc[0, "desglose_puntuacion"]
        suma = sum(d.values())
        assert suma == pytest.approx(df.loc[0, "puntuacion_recomendacion"], abs=0.1)

    def test_claves_desglose(self):
        df = jugadores_a_dataframe([_jugador()])
        df = calcular_puntuaciones(df, PESOS)
        assert set(df.loc[0, "desglose_puntuacion"].keys()) == {"forma", "rol", "contrato", "general"}

    def test_mayor_forma_mayor_puntuacion(self):
        j_bajo = _jugador(id="a", puntuacion_forma=2.0, puntuacion_general=50, rol_equipo="cantera")
        j_alto = _jugador(id="b", puntuacion_forma=9.0, puntuacion_general=90, rol_equipo="titular")
        df = calcular_puntuaciones(jugadores_a_dataframe([j_bajo, j_alto]), PESOS)
        assert df.loc[1, "puntuacion_recomendacion"] > df.loc[0, "puntuacion_recomendacion"]

    def test_pesos_personalizados(self):
        df = jugadores_a_dataframe([_jugador()])
        pesos_forma = {"forma": 1.0, "rol": 0.0, "contrato": 0.0, "general": 0.0}
        pesos_rol   = {"forma": 0.0, "rol": 1.0, "contrato": 0.0, "general": 0.0}
        df_f = calcular_puntuaciones(df.copy(), pesos_forma)
        df_r = calcular_puntuaciones(df.copy(), pesos_rol)
        assert df_f.loc[0, "puntuacion_recomendacion"] != df_r.loc[0, "puntuacion_recomendacion"]
