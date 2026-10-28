const { Router } = require('express');
const controller = require('./parkingSpots.controller');
const asyncHandler = require('../../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.getAll));
// Va antes de /:id para que "available" no se tome como un id
router.get('/available', asyncHandler(controller.getAvailable));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
