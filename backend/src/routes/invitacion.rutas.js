const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/invitacion.controlador');
const validar  = require('../middleware/validar');
const { autenticar, autorizar } = require('../middleware/autenticacion');

// Aceptar invitación (público — el usuario aún no tiene cuenta)
router.post('/aceptar',
  body('token').notEmpty(),
  body('nombre_usuario').trim().notEmpty().isLength({ min: 3, max: 50 }),
  body('contrasena').isLength({ min: 8 }),
  validar, ctrl.aceptar
);

router.use(autenticar);

router.get('/', autorizar('admin', 'entrenador'), ctrl.listar);

router.post('/',
  autorizar('admin', 'entrenador'),
  body('correo').isEmail().normalizeEmail(),
  validar, ctrl.invitar
);

module.exports = router;
