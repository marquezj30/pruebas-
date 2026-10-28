-- ============================================================================
-- BASE DE DATOS: ESTACIONAMIENTO
-- Esquema mejorado con auditoría, restricciones de integridad y membresías
-- Motor sugerido: PostgreSQL (Neon)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. ZONA HORARIA: Neon trabaja en UTC. Con esto, now() guarda la hora de Perú
--    en todas las conexiones nuevas a esta base de datos.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'America/Lima');
END $$;

-- ----------------------------------------------------------------------------
-- 1. USUARIOS (nueva tabla para autenticación y auditoría)
--    created_id y modified_id son autoreferenciales (un usuario crea/modifica a otro)
--    role_id indica el rol del usuario (Administrador, Cajero...); su FK se agrega
--    después de crear la tabla roles.
-- ----------------------------------------------------------------------------
CREATE TABLE public.users (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  role_id integer NOT NULL,
  username character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT users_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 2. ROLES (roles de los usuarios y cargos de los empleados)
-- ----------------------------------------------------------------------------
CREATE TABLE public.roles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT roles_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- users y roles se referencian entre sí (users.role_id -> roles y roles.created_id -> users).
-- Por eso la FK de users.role_id se agrega aquí, y es DEFERRABLE para poder insertar
-- el primer usuario y su rol dentro de la misma transacción.
ALTER TABLE public.users
  ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
  DEFERRABLE INITIALLY DEFERRED;

-- ----------------------------------------------------------------------------
-- 3. EMPLEADOS
--    created_id y modified_id ahora referencian a public.users(id)
-- ----------------------------------------------------------------------------
CREATE TABLE public.employees (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  role_id integer NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  document_number character varying NOT NULL UNIQUE,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT employees_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT employees_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 4. CLIENTES
-- ----------------------------------------------------------------------------
CREATE TABLE public.customers (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  document_number character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  phone character varying,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT customers_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 5. MARCAS DE VEHÍCULOS
-- ----------------------------------------------------------------------------
CREATE TABLE public.brands (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT brands_pkey PRIMARY KEY (id),
  CONSTRAINT brands_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT brands_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 6. MODELOS DE VEHÍCULOS
-- ----------------------------------------------------------------------------
CREATE TABLE public.models (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  brand_id integer NOT NULL,
  name character varying NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT models_pkey PRIMARY KEY (id),
  CONSTRAINT models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT models_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT models_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 7. TIPOS DE VEHÍCULO (moto, carro, camioneta, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE public.vehicle_types (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT vehicle_types_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_types_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT vehicle_types_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 8. VEHÍCULOS
-- ----------------------------------------------------------------------------
CREATE TABLE public.vehicles (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id integer NOT NULL,
  model_id integer NOT NULL,
  vehicle_type_id integer NOT NULL,
  license_plate character varying NOT NULL UNIQUE,
  color character varying,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT vehicles_pkey PRIMARY KEY (id),
  CONSTRAINT vehicles_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT vehicles_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.models(id),
  CONSTRAINT vehicles_vehicle_type_id_fkey FOREIGN KEY (vehicle_type_id) REFERENCES public.vehicle_types(id),
  CONSTRAINT vehicles_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT vehicles_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 9. TARIFAS (por tipo de vehículo)
-- ----------------------------------------------------------------------------
CREATE TABLE public.rates (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  vehicle_type_id integer NOT NULL,
  hourly_price numeric NOT NULL,
  daily_price numeric NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT rates_pkey PRIMARY KEY (id),
  CONSTRAINT rates_vehicle_type_id_fkey FOREIGN KEY (vehicle_type_id) REFERENCES public.vehicle_types(id),
  CONSTRAINT rates_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT rates_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 10. ZONAS DEL ESTACIONAMIENTO
-- ----------------------------------------------------------------------------
CREATE TABLE public.zones (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT zones_pkey PRIMARY KEY (id),
  CONSTRAINT zones_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT zones_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 11. CUPOS / PARQUEADEROS INDIVIDUALES
-- ----------------------------------------------------------------------------
CREATE TABLE public.parking_spots (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  zone_id integer NOT NULL,
  number character varying NOT NULL,
  floor integer NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT parking_spots_pkey PRIMARY KEY (id),
  CONSTRAINT parking_spots_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(id),
  CONSTRAINT parking_spots_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT parking_spots_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 12. ENTRADAS / REGISTROS DE ESTACIONAMIENTO
--    Mejora: índice único parcial para evitar que un cupo tenga dos vehículos
--    dentro al mismo tiempo (exit_datetime IS NULL).
-- ----------------------------------------------------------------------------
CREATE TABLE public.entries (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  vehicle_id integer NOT NULL,
  parking_spot_id integer NOT NULL,
  rate_id integer NOT NULL,
  employee_id integer NOT NULL,
  entry_datetime timestamp without time zone NOT NULL,
  exit_datetime timestamp without time zone,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT entries_pkey PRIMARY KEY (id),
  CONSTRAINT entries_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id),
  CONSTRAINT entries_parking_spot_id_fkey FOREIGN KEY (parking_spot_id) REFERENCES public.parking_spots(id),
  CONSTRAINT entries_rate_id_fkey FOREIGN KEY (rate_id) REFERENCES public.rates(id),
  CONSTRAINT entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT entries_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT entries_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- Índice único parcial: un cupo no puede tener más de una entrada activa
CREATE UNIQUE INDEX entries_parking_spot_active_unique
  ON public.entries (parking_spot_id)
  WHERE exit_datetime IS NULL AND status = true;

-- ----------------------------------------------------------------------------
-- 13. MÉTODOS DE PAGO
-- ----------------------------------------------------------------------------
CREATE TABLE public.payment_methods (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT payment_methods_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 14. TIPOS DE COMPROBANTE (factura, boleta, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE public.receipt_types (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT receipt_types_pkey PRIMARY KEY (id),
  CONSTRAINT receipt_types_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT receipt_types_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 15. PAGOS
--    Mejora: entry_id es UNIQUE para garantizar un pago por entrada (1:1).
--    El monto se calcula en la aplicación (horas x tarifa) y se guarda aquí.
-- ----------------------------------------------------------------------------
CREATE TABLE public.payments (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  entry_id integer NOT NULL UNIQUE,
  payment_method_id integer NOT NULL,
  receipt_type_id integer NOT NULL,
  receipt_number character varying NOT NULL,
  payment_datetime timestamp without time zone NOT NULL,
  amount numeric NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.entries(id),
  CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id),
  CONSTRAINT payments_receipt_type_id_fkey FOREIGN KEY (receipt_type_id) REFERENCES public.receipt_types(id),
  CONSTRAINT payments_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT payments_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- 16. MEMBRESÍAS / ABONOS (nueva tabla)
--    Útil para clientes con pase mensual o tarifa plana.
-- ----------------------------------------------------------------------------
CREATE TABLE public.memberships (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id integer NOT NULL,
  vehicle_id integer NOT NULL,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone NOT NULL,
  total_price numeric NOT NULL,
  status boolean DEFAULT true,
  created timestamp without time zone DEFAULT now(),
  modified timestamp without time zone,
  created_id integer NOT NULL,
  modified_id integer,
  CONSTRAINT memberships_pkey PRIMARY KEY (id),
  CONSTRAINT memberships_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT memberships_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id),
  CONSTRAINT memberships_created_id_fkey FOREIGN KEY (created_id) REFERENCES public.users(id),
  CONSTRAINT memberships_modified_id_fkey FOREIGN KEY (modified_id) REFERENCES public.users(id)
);

-- ----------------------------------------------------------------------------
-- ÍNDICES ADICIONALES PARA MEJORAR CONSULTAS FRECUENTES
-- ----------------------------------------------------------------------------
CREATE INDEX idx_entries_vehicle_id ON public.entries (vehicle_id);
CREATE INDEX idx_entries_exit_datetime ON public.entries (exit_datetime);
CREATE INDEX idx_vehicles_license_plate ON public.vehicles (license_plate);
CREATE INDEX idx_payments_entry_id ON public.payments (entry_id);
CREATE INDEX idx_memberships_customer_id ON public.memberships (customer_id);

-- ----------------------------------------------------------------------------
-- NOTAS IMPORTANTES PARA EL DESARROLLO
-- ----------------------------------------------------------------------------
-- 1. La tabla USERS es necesaria porque created_id/modified_id de todas las
--    tablas ahora apuntan a ella. El primer usuario debe insertarse
--    manualmente con su propio id en created_id (autoreferencia) y con
--    role_id = 1 (Administrador), en la misma transacción que crea ese rol.
--
-- 2. El índice único parcial en entries evita asignar un cupo que ya esté
--    ocupado (exit_datetime IS NULL). Validar esto también en la aplicación.
--
-- 3. El monto del pago (payments.amount) se calcula en la lógica de negocio:
--    (tiempo entre entry_datetime y exit_datetime) * tarifa aplicable.
--
-- 4. La tabla memberships permite manejar abonos mensuales. Un cliente con
--    membresía activa podría no generar pago por entrada/salida tradicional.
--
-- 5. Para Neon: usar la cadena de conexión (DATABASE_URL) provista por
--    Neon en la consola. Ejemplo:
--    postgres://usuario:contraseña@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
--
-- ============================================================================
