import pytest
from datetime import date, timedelta

from app.models.esquemas        import JugadorEntrada, PartidoEntrada
from app.services.recomendacion import generar_recomendacion


def _plantilla_completa() -> list[JugadorEntrada]:
    """Genera 18 jugadores suficientes para cubrir cualquier formación + banquillo."""
    posiciones = ["PO", "LI", "DFC", "DFC", "LD", "MC", "MC", "MC", "EI", "DC", "ED",
                  "MCD", "MCO", "MI", "MD", "SD", "DFC", "PO"]
    return [
        JugadorEntrada(
            id=f"p{i:02d}",
            nombre=f"Jugador {i}",
            posicion=pos,
            rol_equipo="titular",
            puntuacion_forma=float(7 + i % 3),
            puntuacion_general=80 + i % 10,
            contrato_hasta=str(date.today() + timedelta(days=365 * 3)),
        )
        for i, pos in enumerate(posiciones)
    ]


class TestGenerarRecomendacion:
    def test_retorna_11_titulares(self):
        r = generar_recomendacion(_plantilla_completa(), "4-3-3")
        titulares = [j for j in r.jugadores if j.es_titular]
        assert len(titulares) == 11

    def test_banquillo_max_7(self):
        r = generar_recomendacion(_plantilla_completa(), "4-3-3")
        banquillo = [j for j in r.jugadores if not j.es_titular]
        assert len(banquillo) <= 7

    def test_formacion_en_respuesta(self):
        r = generar_recomendacion(_plantilla_completa(), "4-4-2")
        assert r.formacion == "4-4-2"

    def test_formacion_invalida_usa_4_3_3(self):
        r = generar_recomendacion(_plantilla_completa(), "no-existe")
        assert r.formacion == "4-3-3"

    def test_puntuacion_media_calculada(self):
        r = generar_recomendacion(_plantilla_completa(), "4-3-3")
        titulares = [j for j in r.jugadores if j.es_titular]
        media_calculada = sum(j.puntuacion_recomendacion for j in titulares) / len(titulares)
        assert r.puntuacion_media == pytest.approx(media_calculada, abs=0.01)

    def test_lesionados_no_en_titular(self):
        jugadores = _plantilla_completa()
        jugadores[0].esta_lesionado = True
        r = generar_recomendacion(jugadores, "4-3-3")
        titulares = [j for j in r.jugadores if j.es_titular]
        assert not any(j.id == jugadores[0].id for j in titulares)

    def test_sancionados_no_en_titular(self):
        jugadores = _plantilla_completa()
        jugadores[1].esta_sancionado = True
        r = generar_recomendacion(jugadores, "4-3-3")
        titulares = [j for j in r.jugadores if j.es_titular]
        assert not any(j.id == jugadores[1].id for j in titulares)

    def test_total_puntuados_correcto(self):
        jugadores = _plantilla_completa()
        r = generar_recomendacion(jugadores, "4-3-3")
        assert r.total_puntuados == len(jugadores)

    def test_desglose_en_cada_jugador(self):
        r = generar_recomendacion(_plantilla_completa(), "4-3-3")
        for j in r.jugadores:
            assert isinstance(j.desglose_puntuacion, dict)
            assert set(j.desglose_puntuacion.keys()) == {"forma", "rol", "contrato", "general"}

    def test_partido_en_metadatos(self):
        partido = PartidoEntrada(id="match-01")
        r = generar_recomendacion(_plantilla_completa(), "4-3-3", partido=partido)
        assert r.metadatos.get("id_partido") == "match-01"

    def test_formacion_442(self):
        r = generar_recomendacion(_plantilla_completa(), "4-4-2")
        assert len([j for j in r.jugadores if j.es_titular]) == 11

    def test_formacion_3_5_2(self):
        r = generar_recomendacion(_plantilla_completa(), "3-5-2")
        assert len([j for j in r.jugadores if j.es_titular]) == 11

    def test_jugadores_sin_contrato_incluidos(self):
        jugadores = _plantilla_completa()
        for j in jugadores:
            j.contrato_hasta = None
        r = generar_recomendacion(jugadores, "4-3-3")
        assert len([j for j in r.jugadores if j.es_titular]) >= 1
