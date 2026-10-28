const express = require('express');
const pool = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const auth = require('./middlewares/auth');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const rolesRoutes = require('./modules/roles/roles.routes');
const employeesRoutes = require('./modules/employees/employees.routes');
const customersRoutes = require('./modules/customers/customers.routes');
const brandsRoutes = require('./modules/brands/brands.routes');
const modelsRoutes = require('./modules/models/models.routes');
const vehicleTypesRoutes = require('./modules/vehicle-types/vehicleTypes.routes');
const ratesRoutes = require('./modules/rates/rates.routes');
const vehiclesRoutes = require('./modules/vehicles/vehicles.routes');
const zonesRoutes = require('./modules/zones/zones.routes');
const parkingSpotsRoutes = require('./modules/parking-spots/parkingSpots.routes');
const paymentMethodsRoutes = require('./modules/payment-methods/paymentMethods.routes');
const receiptTypesRoutes = require('./modules/receipt-types/receiptTypes.routes');
const membershipsRoutes = require('./modules/memberships/memberships.routes');
const entriesRoutes = require('./modules/entries/entries.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

const app = express();

app.use(express.json());

// Verifica que la API y la base de datos respondan
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT now() AS db_time');
    res.json({ status: 'ok', db: 'connected', db_time: rows[0].db_time });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren token)
app.use('/api/users', auth, usersRoutes);
app.use('/api/roles', auth, rolesRoutes);
app.use('/api/employees', auth, employeesRoutes);
app.use('/api/customers', auth, customersRoutes);
app.use('/api/brands', auth, brandsRoutes);
app.use('/api/models', auth, modelsRoutes);
app.use('/api/vehicle-types', auth, vehicleTypesRoutes);
app.use('/api/rates', auth, ratesRoutes);
app.use('/api/vehicles', auth, vehiclesRoutes);
app.use('/api/zones', auth, zonesRoutes);
app.use('/api/parking-spots', auth, parkingSpotsRoutes);
app.use('/api/payment-methods', auth, paymentMethodsRoutes);
app.use('/api/receipt-types', auth, receiptTypesRoutes);
app.use('/api/memberships', auth, membershipsRoutes);
app.use('/api/entries', auth, entriesRoutes);
app.use('/api/payments', auth, paymentsRoutes);
app.use('/api/reports', auth, reportsRoutes);

// Siempre al final: rutas no encontradas y manejo de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;
