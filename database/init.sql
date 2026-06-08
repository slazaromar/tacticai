CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_usuario  VARCHAR(50)  UNIQUE NOT NULL,
    correo          VARCHAR(100) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol             VARCHAR(20)  NOT NULL DEFAULT 'analista'
                        CHECK (rol IN ('admin', 'entrenador', 'analista')),
    esta_activo     BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso   TIMESTAMP,
    creado_en       TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- EQUIPOS
CREATE TABLE IF NOT EXISTS equipos (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre         VARCHAR(100) NOT NULL,
    nombre_corto   VARCHAR(10),
    formacion      VARCHAR(10)  DEFAULT '4-3-3',
    ciudad         VARCHAR(100),
    pais           VARCHAR(50),
    creado_en      TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

-- JUGADORES
CREATE TABLE IF NOT EXISTS jugadores (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre              VARCHAR(100) NOT NULL,
    posicion            VARCHAR(10)  NOT NULL
                            CHECK (posicion IN ('PO','DFC','LI','LD','MCD','MC','MCO','MI','MD','EI','ED','SD','DC')),
    equipo_id           UUID REFERENCES equipos(id) ON DELETE SET NULL,
    rol_equipo          VARCHAR(20)  NOT NULL DEFAULT 'rotacion'
                            CHECK (rol_equipo IN ('titular','rotacion','reserva','cantera')),
    edad                INTEGER      CHECK (edad >= 15 AND edad <= 45),
    nacionalidad        VARCHAR(50),
    contrato_hasta      DATE,
    puntuacion_forma    DECIMAL(3,1) CHECK (puntuacion_forma >= 1.0 AND puntuacion_forma <= 10.0),
    puntuacion_general  INTEGER      CHECK (puntuacion_general >= 1 AND puntuacion_general <= 100),
    esta_lesionado      BOOLEAN NOT NULL DEFAULT FALSE,
    esta_sancionado     BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en           TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- PARTIDOS
CREATE TABLE IF NOT EXISTS partidos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipo_local_id     UUID REFERENCES equipos(id),
    equipo_visitante_id UUID REFERENCES equipos(id),
    fecha_partido       TIMESTAMP NOT NULL,
    competicion         VARCHAR(100),
    estadio             VARCHAR(100),
    estado              VARCHAR(20) NOT NULL DEFAULT 'programado'
                            CHECK (estado IN ('programado','en_curso','finalizado','cancelado')),
    creado_en           TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT equipos_distintos CHECK (equipo_local_id <> equipo_visitante_id)
);

-- ALINEACIONES
CREATE TABLE IF NOT EXISTS alineaciones (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partido_id       UUID REFERENCES partidos(id) ON DELETE CASCADE,
    equipo_id        UUID REFERENCES equipos(id),
    formacion        VARCHAR(10),
    es_recomendacion BOOLEAN NOT NULL DEFAULT FALSE,
    creado_por       UUID REFERENCES usuarios(id),
    creado_en        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alineacion_jugadores (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alineacion_id            UUID REFERENCES alineaciones(id) ON DELETE CASCADE,
    jugador_id               UUID REFERENCES jugadores(id),
    posicion_alineacion      VARCHAR(10),
    es_titular               BOOLEAN NOT NULL DEFAULT TRUE,
    puntuacion_recomendacion DECIMAL(5,2),
    UNIQUE (alineacion_id, jugador_id)
);

-- HISTORIAL DE LESIONES
CREATE TABLE IF NOT EXISTS historial_lesiones (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jugador_id   UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
    descripcion  TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin    DATE,
    creado_en    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- INVITACIONES (analistas externos)
CREATE TABLE IF NOT EXISTS invitaciones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correo      VARCHAR(100) NOT NULL,
    token       VARCHAR(64)  UNIQUE NOT NULL,
    rol         VARCHAR(20)  NOT NULL DEFAULT 'analista',
    creado_por  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    expira_en   TIMESTAMP NOT NULL,
    usado_en    TIMESTAMP,
    creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TOKENS DE REFRESCO
CREATE TABLE IF NOT EXISTS tokens_refresco (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    token       TEXT UNIQUE NOT NULL,
    expira_en   TIMESTAMP NOT NULL,
    revocado    BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_jugadores_equipo_id             ON jugadores(equipo_id);
CREATE INDEX IF NOT EXISTS idx_jugadores_posicion              ON jugadores(posicion);
CREATE INDEX IF NOT EXISTS idx_jugadores_puntuacion_forma      ON jugadores(puntuacion_forma DESC);
CREATE INDEX IF NOT EXISTS idx_partidos_fecha                  ON partidos(fecha_partido);
CREATE INDEX IF NOT EXISTS idx_partidos_equipo_local           ON partidos(equipo_local_id);
CREATE INDEX IF NOT EXISTS idx_partidos_equipo_visitante       ON partidos(equipo_visitante_id);
CREATE INDEX IF NOT EXISTS idx_alineacion_jugadores_alineacion ON alineacion_jugadores(alineacion_id);
CREATE INDEX IF NOT EXISTS idx_tokens_refresco_usuario         ON tokens_refresco(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_lesiones_jugador      ON historial_lesiones(jugador_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_token              ON invitaciones(token);

-- TRIGGER actualizado_en
CREATE OR REPLACE FUNCTION actualizar_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_actualizado  BEFORE UPDATE ON usuarios  FOR EACH ROW EXECUTE FUNCTION actualizar_actualizado_en();
CREATE TRIGGER trg_equipos_actualizado   BEFORE UPDATE ON equipos   FOR EACH ROW EXECUTE FUNCTION actualizar_actualizado_en();
CREATE TRIGGER trg_jugadores_actualizado BEFORE UPDATE ON jugadores FOR EACH ROW EXECUTE FUNCTION actualizar_actualizado_en();
CREATE TRIGGER trg_partidos_actualizado  BEFORE UPDATE ON partidos  FOR EACH ROW EXECUTE FUNCTION actualizar_actualizado_en();
