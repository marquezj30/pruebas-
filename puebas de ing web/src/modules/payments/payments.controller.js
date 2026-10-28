const service = require('./payments.service');
const entriesService = require('../entries/entries.service');
const paymentMethodsService = require('../payment-methods/paymentMethods.service');
const receiptTypesService = require('../receipt-types/receiptTypes.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

const getAll = async (req, res) => {
  res.json(await service.findAll(req.query));
};

const getById = async (req, res) => {
  const payment = await service.findById(req.params.id);
  if (!payment) throw new AppError('Pago no encontrado', 404);
  res.json(payment);
};

const getByEntry = async (req, res) => {
  const payment = await service.findByEntry(req.params.entryId);
  if (!payment) throw new AppError('Esa entrada no tiene pago registrado', 404);
  res.json(payment);
};

// Cobra una entrada que ya salió: { entry_id, payment_method_id, receipt_type_id }
const create = async (req, res) => {
  requireFields(req.body, ['entry_id', 'payment_method_id', 'receipt_type_id']);
  const { entry_id, payment_method_id, receipt_type_id } = req.body;

  const entry = await entriesService.findById(entry_id);
  if (!entry) throw new AppError('Entrada no encontrada', 404);
  if (!entry.exit_datetime) throw new AppError('Registra la salida antes de cobrar', 400);
  if (await service.findByEntry(entry.id)) throw new AppError('Esta entrada ya fue pagada', 409);

  if (!(await paymentMethodsService.findById(payment_method_id))) {
    throw new AppError('El método de pago no existe o está inactivo', 400);
  }
  const receiptType = await receiptTypesService.findById(receipt_type_id);
  if (!receiptType) throw new AppError('El tipo de comprobante no existe o está inactivo', 400);

  // El monto lo calcula el servidor, nunca se recibe del cliente
  const charge = await entriesService.calculateCharge(entry);
  if (charge.amount === 0) throw new AppError('La estadía está cubierta por una membresía', 400);

  const payment = await service.create(
    { entry_id: entry.id, payment_method_id, receipt_type_id, receipt_type_name: receiptType.name, amount: charge.amount },
    req.user.id
  );
  res.status(201).json({ payment, charge });
};

module.exports = { getAll, getById, getByEntry, create };
