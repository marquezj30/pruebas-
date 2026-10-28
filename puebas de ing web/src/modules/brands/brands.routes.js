const { Router } = require('express');
const controller = require('./brands.controller');
const asyncHandler = require('../../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getById));
router.get('/:id/models', asyncHandler(controller.getModels));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
