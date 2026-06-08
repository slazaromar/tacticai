const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/jugador.controlador');
const validar  = require('../middleware/validar');
const { autenticar, autorizar } = require('../middleware/autenticacion');

const POSICIONES = ['PO','DFC','LI','LD','MCD','MC','MCO','MI','MD','EI','ED','SD','DC'];
const ROLES      = ['titular','rotacion','reserva','cantera'];

router.use(autenticar);

router.get('/',     ctrl.obtenerTodos);
router.get('/:id',  ctrl.obtenerPorId);

router.post('/',
  autorizar('admin','entrenador'),
  body('nombre').trim().notEmpty().isLength({ max: 100 }),
  body('posicion').isIn(POSICIONES),
  body('rol_equipo').optional().isIn(ROLES),
  body('puntuacion_forma').optional().isFloat({ min: 1, max: 10 }),
  body('puntuacion_general').optional().isInt({ min: 1, max: 100 }),
  validar, ctrl.crear
);

router.put('/:id',
  autorizar('admin','entrenador'),
  body('nombre').trim().notEmpty(),
  body('posicion').isIn(POSICIONES),
  validar, ctrl.actualizar
);

router.delete('/:id', autorizar('admin', 'entrenador'), ctrl.eliminar);

module.exports = router;
