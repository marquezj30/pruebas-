const service = require('./entries.service');
const vehiclesService = require('../vehicles/vehicles.service');
const parkingSpotsService = require('../parking-spots/parkingSpots.service');
const employeesService = require('../employees/employees.service');
const ratesService = require('../rates/rates.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

const getAll = async (req, res) => {
  res.json(await service.findAll(req.query));
};

const getById = async (req, res) => {
  const entry = await service.findById(req.params.id);
  if (!entry) throw new AppError('Entrada no encontrada', 404);
  res.json(entry);
};

// Registra la entrada de un vehículo: { license_plate | vehicle_id, parking_spot_id, employee_id }
const create = async (req, res) => {
  requireFields(req.body, ['parking_spot_id', 'employee_id']);
  const { license_plate, vehicle_id, parking_spot_id, employee_id } = req.body;
  if (!license_plate && !vehicle_id) {
    throw new AppError('Envía license_plate o vehicle_id', 400);
  }

  // 1. El vehículo existe
  const vehicle = license_plate
    ? await vehiclesService.findByPlate(String(license_plate).replace(/\s+/g, '').toUpperCase())
    : await vehiclesService.findById(vehicle_id);
  if (!vehicle) throw new AppError('Vehículo no registrado', 404);

  // 2. No está dentro
  if (await service.findActiveByVehicle(vehicle.id)) {
    throw new AppError(`El vehículo ${vehicle.license_plate} ya está dentro del estacionamiento`, 409);
  }

  // 3. El cupo existe y está libre
  const spot = await parkingSpotsService.findById(parking_spot_id);
  if (!spot) throw new AppError('El cupo no existe o está inactivo', 400);
  if (spot.occupied) throw new AppError(`El cupo ${spot.number} está ocupado`, 409);

  // 4. El empleado existe
  if (!(await employeesService.findById(employee_id))) {
    throw new AppError('El empleado no existe o está inactivo', 400);
  }

  // 5. Hay tarifa vigente para el tipo de vehículo
  const rate = await ratesService.findActiveByVehicleType(vehicle.vehicle_type_id);
  if (!rate) throw new AppError(`No hay tarifa activa para ${vehicle.vehicle_type_name}`, 400);

  const entry = await service.create(
    { vehicle_id: vehicle.id, parking_spot_id: spot.id, rate_id: rate.id, employee_id },
    req.user.id
  );
  res.status(201).json(entry);
};

// Cuánto pagaría si saliera ahora (no guarda nada)
const getAmount = async (req, res) => {
  const entry = await service.findById(req.params.id);
  if (!entry) throw new AppError('Entrada no encontrada', 404);
  res.json(await service.calculateCharge(entry));
};

// Registra la salida y devuelve el cobro
const exit = async (req, res) => {
  const entry = await service.findById(req.params.id);
  if (!entry) throw new AppError('Entrada no encontrada', 404);
  if (entry.exit_datetime) throw new AppError('Esta entrada ya registró su salida', 409);

  const updated = await service.registerExit(entry.id, req.user.id);
  if (!updated) throw new AppError('Esta entrada ya registró su salida', 409);
  const charge = await service.calculateCharge(updated);
  res.json({ entry: updated, charge });
};

module.exports = { getAll, getById, create, getAmount, exit };
