const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/equipo.controlador');
const validar  = require('../middleware/validar');
const { autenticar, autorizar } = require('../middleware/autenticacion');

router.use(autenticar);

router.get('/',    ctrl.obtenerTodos);
router.get('/:id', ctrl.obtenerPorId);

router.post('/',
  autorizar('admin','entrenador'),
  body('nombre').trim().notEmpty().isLength({ max: 100 }),
  validar, ctrl.crear
);

router.put('/:id',
  autorizar('admin','entrenador'),
  body('nombre').trim().notEmpty(),
  validar, ctrl.actualizar
);

router.delete('/:id', autorizar('admin', 'entrenador'), ctrl.eliminar);

module.exports = router;
