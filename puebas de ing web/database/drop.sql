-- Borra todas las tablas para reiniciar la base de datos (se usa con: npm run db:reset)
DROP TABLE IF EXISTS
  public.memberships,
  public.payments,
  public.receipt_types,
  public.payment_methods,
  public.entries,
  public.parking_spots,
  public.zones,
  public.rates,
  public.vehicles,
  public.vehicle_types,
  public.models,
  public.brands,
  public.customers,
  public.employees,
  public.roles,
  public.users
CASCADE;
