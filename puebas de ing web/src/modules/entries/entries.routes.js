const { Router } = require('express');
const controller = require('./entries.controller');
const asyncHandler = require('../../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.get('/:id/amount', asyncHandler(controller.getAmount));
router.put('/:id/exit', asyncHandler(controller.exit));

module.exports = router;
