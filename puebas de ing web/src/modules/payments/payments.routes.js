const { Router } = require('express');
const controller = require('./payments.controller');
const asyncHandler = require('../../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(controller.getAll));
// Va antes de /:id para que "entry" no se tome como un id
router.get('/entry/:entryId', asyncHandler(controller.getByEntry));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));

module.exports = router;
