const { Router } = require('express');
const controller = require('./vehicles.controller');
const asyncHandler = require('../../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.getAll));
// Va antes de /:id para que "plate" no se tome como un id
router.get('/plate/:plate', asyncHandler(controller.getByPlate));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
