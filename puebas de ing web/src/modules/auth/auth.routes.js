const { Router } = require('express');
const controller = require('./auth.controller');
const asyncHandler = require('../../utils/asyncHandler');
const auth = require('../../middlewares/auth');

const router = Router();

router.post('/login', asyncHandler(controller.login));
router.get('/me', auth, asyncHandler(controller.me));

module.exports = router;
