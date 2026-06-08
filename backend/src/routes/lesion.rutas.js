const router   = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const ctrl     = require('../controllers/lesion.controlador');
const validar  = require('../middleware/validar');
const { autenticar, autorizar } = require('../middleware/autenticacion');

router.use(autenticar);

router.get('/', ctrl.obtenerHistorial);

router.post('/',
  autorizar('admin', 'entrenador'),
  body('descripcion').trim().notEmpty(),
  body('fecha_inicio').isISO8601(),
  body('fecha_fin').optional({ nullable: true }).isISO8601(),
  validar, ctrl.registrar
);

router.delete('/:lesionId',
  autorizar('admin', 'entrenador'),
  ctrl.eliminar
);

module.exports = router;
