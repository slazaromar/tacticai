const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/alineacion.controlador');
const validar  = require('../middleware/validar');
const { autenticar, autorizar } = require('../middleware/autenticacion');

router.use(autenticar);

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/',    ctrl.obtenerPorPartido);
router.get('/:id', ctrl.obtenerPorId);

router.post('/recomendar',
  body('partidoId').matches(REGEX_UUID).withMessage('partidoId debe ser un UUID'),
  body('equipoId').matches(REGEX_UUID).withMessage('equipoId debe ser un UUID'),
  body('formacion').notEmpty(),
  validar, ctrl.recomendar
);

router.post('/',
  autorizar('admin', 'entrenador'),
  body('partidoId').matches(REGEX_UUID).withMessage('partidoId debe ser un UUID'),
  body('equipoId').matches(REGEX_UUID).withMessage('equipoId debe ser un UUID'),
  body('jugadores').isArray({ min: 1 }),
  validar, ctrl.guardar
);

module.exports = router;
