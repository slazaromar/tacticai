const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/partido.controlador');
const validar  = require('../middleware/validar');
const { autenticar, autorizar } = require('../middleware/autenticacion');

router.use(autenticar);

// UUIDs sintéticos (semilla con nibble de versión = 0) → regex permisivo
const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/',    ctrl.obtenerTodos);
router.get('/:id', ctrl.obtenerPorId);

router.post('/',
  autorizar('admin','entrenador'),
  body('equipo_local_id').matches(REGEX_UUID).withMessage('equipo_local_id debe ser un UUID'),
  body('equipo_visitante_id').matches(REGEX_UUID).withMessage('equipo_visitante_id debe ser un UUID'),
  body('fecha_partido').isISO8601(),
  validar, ctrl.crear
);

router.put('/:id',
  autorizar('admin','entrenador'),
  body('equipo_local_id').matches(REGEX_UUID),
  body('equipo_visitante_id').matches(REGEX_UUID),
  body('fecha_partido').isISO8601(),
  validar, ctrl.actualizar
);

router.delete('/:id', autorizar('admin', 'entrenador'), ctrl.eliminar);

module.exports = router;
