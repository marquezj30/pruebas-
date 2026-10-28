const { Router } = require('express');
const controller = require('./reports.controller');
const asyncHandler = require('../../utils/asyncHandler');

const router = Router();

router.get('/occupancy', asyncHandler(controller.occupancy));
router.get('/income', asyncHandler(controller.income));
router.get('/dashboard', asyncHandler(controller.dashboard));

module.exports = router;
