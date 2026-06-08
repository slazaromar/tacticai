-- Usuarios (contraseña: Admin1234!)
INSERT INTO usuarios (id, nombre_usuario, correo, contrasena_hash, rol) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@tacticai.com',
   '$2a$10$qwwf8LghZKKo6j6ZTJwtj.RUuOAuxROzws9AdzIkoZf3znsX39Jeq', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'entrenador_demo', 'entrenador@tacticai.com',
   '$2a$10$qwwf8LghZKKo6j6ZTJwtj.RUuOAuxROzws9AdzIkoZf3znsX39Jeq', 'entrenador'),
  ('00000000-0000-0000-0000-000000000003', 'analista_demo', 'analista@tacticai.com',
   '$2a$10$qwwf8LghZKKo6j6ZTJwtj.RUuOAuxROzws9AdzIkoZf3znsX39Jeq', 'analista')
ON CONFLICT DO NOTHING;

-- Equipos
INSERT INTO equipos (id, nombre, nombre_corto, formacion, ciudad, pais) VALUES
  ('10000000-0000-0000-0000-000000000001', 'FC Barcelona',    'FCB', '4-3-3', 'Barcelona', 'España'),
  ('10000000-0000-0000-0000-000000000002', 'Real Madrid CF',  'RMA', '4-3-3', 'Madrid',    'España')
ON CONFLICT DO NOTHING;

-- Jugadores del FC Barcelona
INSERT INTO jugadores (nombre, posicion, equipo_id, rol_equipo, edad, nacionalidad, contrato_hasta, puntuacion_forma, puntuacion_general) VALUES
  ('Joan Garcia',           'PO',  '10000000-0000-0000-0000-000000000001', 'titular',  25, 'Española',    '2028-06-30', 7.8, 89),
  ('Eric Garcia',           'DFC',  '10000000-0000-0000-0000-000000000001', 'titular', 25, 'Española',    '2028-06-30', 8.1, 85),
  ('Pau Cubarsí',           'DFC',  '10000000-0000-0000-0000-000000000001', 'titular', 18, 'Española',   '2030-06-30', 7.8, 84),
  ('Alejandro Balde',       'LI',  '10000000-0000-0000-0000-000000000001', 'titular',  22, 'Española',    '2027-06-30', 7.5, 82),
  ('Jules Koundé',          'LD',  '10000000-0000-0000-0000-000000000001', 'titular',  27, 'Francesa',    '2028-06-30', 7.9, 86),
  ('Frenkie de Jong',       'MC', '10000000-0000-0000-0000-000000000001', 'titular',  28, 'Neerlandesa', '2028-06-30', 7.2, 87),
  ('Pedri',                 'MC',  '10000000-0000-0000-0000-000000000001', 'titular',  23, 'Española',    '2028-06-30', 8.4, 88),
  ('Gavi',                  'MC',  '10000000-0000-0000-0000-000000000001', 'titular',  23, 'Española',    '2030-06-30', 8.0, 87),
  ('Raphinha',              'EI',  '10000000-0000-0000-0000-000000000001', 'titular',  29, 'Brasileña',   '2027-06-30', 8.6, 86),
  ('Robert Lewandowski',    'DC',  '10000000-0000-0000-0000-000000000001', 'titular',  37, 'Polaca',      '2026-06-30', 7.1, 88),
  ('Lamine Yamal',          'ED',  '10000000-0000-0000-0000-000000000001', 'titular',  18, 'Española',    '2031-06-30', 9.1, 87),
  ('Fermín López',          'MCO',  '10000000-0000-0000-0000-000000000001', 'rotacion', 23, 'Española',    '2029-06-30', 7.3, 80),
  ('Marcus Rashford',       'EI',  '10000000-0000-0000-0000-000000000001', 'rotacion', 28, 'Inglesa',    '2027-06-30', 7.5, 79),
  ('Ronald Araujo',         'DFC',  '10000000-0000-0000-0000-000000000001', 'rotacion', 26, 'Uruguaya',    '2028-06-30', 6.7, 78)
ON CONFLICT DO NOTHING;

-- Jugadores del Real Madrid
INSERT INTO jugadores (nombre, posicion, equipo_id, rol_equipo, edad, nacionalidad, contrato_hasta, puntuacion_forma, puntuacion_general) VALUES
  ('Thibaut Courtois',    'PO',  '10000000-0000-0000-0000-000000000002', 'titular',  33, 'Belga',     '2026-06-30', 8.0, 90),
  ('Éder Militão',        'DFC', '10000000-0000-0000-0000-000000000002','titular',  27, 'Brasileña', '2028-06-30', 7.5, 86),
  ('Antonio Rüdiger',     'DFC', '10000000-0000-0000-0000-000000000002','titular',  32, 'Alemana',   '2026-06-30', 7.8, 86),
  ('Ferland Mendy',       'LI',  '10000000-0000-0000-0000-000000000002', 'titular',  30, 'Francesa',  '2025-06-30', 6.8, 84),
  ('Dani Carvajal',       'LD',  '10000000-0000-0000-0000-000000000002', 'titular',  33, 'Española',  '2025-06-30', 7.0, 85),
  ('Aurélien Tchouaméni', 'MCD', '10000000-0000-0000-0000-000000000002', 'titular',  25, 'Francesa',  '2028-06-30', 8.6, 85),
  ('Eduardo Camavinga',   'MC',  '10000000-0000-0000-0000-000000000002', 'titular',  23, 'Francesa',  '2025-06-30', 7.8, 82),
  ('Jude Bellingham',     'MCO', '10000000-0000-0000-0000-000000000002', 'titular',  22, 'Inglesa',   '2029-06-30', 9.0, 91),
  ('Vinícius Júnior',     'EI',  '10000000-0000-0000-0000-000000000002', 'titular',  25, 'Brasileña', '2027-06-30', 8.8, 91),
  ('Rodrygo',             'ED',  '10000000-0000-0000-0000-000000000002', 'titular',  24, 'Brasileña', '2028-06-30', 8.0, 86),
  ('Kylian Mbappé',       'DC',  '10000000-0000-0000-0000-000000000002', 'titular',  27, 'Francesa',  '2029-06-30', 8.5, 93),
  ('Arda Güler',          'MCO', '10000000-0000-0000-0000-000000000002', 'rotacion', 27, 'Turca',     '2029-06-30', 8.1, 84),
  ('Álvaro Carreras',     'LI',  '10000000-0000-0000-0000-000000000002', 'rotacion', 27, 'Española',  '2029-06-30', 7.2, 83)
ON CONFLICT DO NOTHING;

-- Partidos
INSERT INTO partidos (id, equipo_local_id, equipo_visitante_id, fecha_partido, competicion, estadio, estado) VALUES
  ('20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   '2026-04-05 21:00:00',
   'La Liga', 'Spotify Camp Nou', 'programado')
ON CONFLICT DO NOTHING;
