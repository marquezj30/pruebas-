const { Router } = require('express');
const controller = require('./customers.controller');
const asyncHandler = require('../../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.getAll));
// Va antes de /:id para que "document" no se tome como un id
router.get('/document/:document', asyncHandler(controller.getByDocument));
router.get('/:id', asyncHandler(controller.getById));
router.get('/:id/vehicles', asyncHandler(controller.getVehicles));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
