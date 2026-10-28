const { Router } = require('express');
const controller = require('./users.controller');
const asyncHandler = require('../../utils/asyncHandler');
const authorize = require('../../middlewares/authorize');

const router = Router();

// Solo el rol Administrador puede gestionar usuarios
router.use(authorize('Administrador'));

router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
