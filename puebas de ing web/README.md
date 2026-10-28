# Proyecto: CatPark

| | |
| :--- | :--- |
| **Universidad** | Universidad La Salle (Arequipa) |
| **Facultad** | Ingenierías y Arquitectura |
| **Escuela profesional** | Ingeniería de Software |
| **Curso** | Ingeniería Web |
| **Semestre** | VII |
| **Docente** | Richart Escobedo Quispe |
| **Año** | 2026 |

**Título:** Sistema de Gestión de Estacionamiento

**Siglas:** CatPark

## Equipo

| Integrante | 
| :---: |
| Gabriel Matias Jara Zapana |
| Johan Marquez | 
| Facundo Sanz | 


## Descripción de la aplicación web

API REST para gestionar un estacionamiento: clientes, vehículos, cupos, entradas, salidas, pagos y membresías. Está hecha en Node.js con Express y usa una base de datos PostgreSQL remota en Neon. Los endpoints se prueban con Postman.

Un estacionamiento necesita saber en todo momento qué vehículos están dentro, en qué cupo está cada uno, cuánto tiempo se quedaron y cuánto deben pagar. Si esto se anota en un cuaderno o en una hoja de cálculo, es fácil perder registros, cobrar mal o asignar un cupo que ya está ocupado.

Por eso estamos construyendo **CatPark**, una **API REST**, es decir, un programa que corre en un servidor y recibe peticiones por internet (por ejemplo, "registra la entrada de la placa ABC-123") y responde con datos en formato JSON. La API todavía no tiene pantallas: las peticiones se hacen desde **Postman**, que es una herramienta para probar APIs. Más adelante, cualquier aplicación web o móvil podría usar esta misma API.

La información se guarda en **PostgreSQL**, una base de datos relacional, alojada en **Neon**, un servicio en la nube. Así los tres integrantes trabajamos sobre la misma base sin instalar PostgreSQL en nuestras computadoras.

### El proceso que automatizamos

El flujo principal del estacionamiento es el siguiente: llega un vehículo, se le asigna un cupo libre, sale después de un tiempo y se le cobra según su tarifa.

```mermaid
flowchart LR
    A[Llega el vehículo] --> B[Se busca por placa]
    B --> C[Se asigna un cupo libre]
    C --> D[Se registra la entrada]
    D --> E[Sale el vehículo]
    E --> F[Se calcula el cobro]
    F --> G[Se registra el pago y el comprobante]
```

### Cómo están organizados los datos

La base tiene 16 tablas, que se pueden agrupar así:

| Grupo | Tablas | Para qué sirven |
|---|---|---|
| Seguridad | `users` | Usuarios que inician sesión en la API; cada registro guarda qué usuario lo creó o modificó |
| Personal | `roles`, `employees` | Cargos y empleados que atienden el estacionamiento |
| Clientes y vehículos | `customers`, `brands`, `models`, `vehicle_types`, `vehicles` | Dueños, marcas, modelos, tipos (auto, moto, camioneta) y vehículos |
| Infraestructura | `zones`, `parking_spots` | Zonas y cupos del estacionamiento |
| Tarifas | `rates`, `memberships` | Precio por hora y por día según el tipo de vehículo, y abonos mensuales |
| Operación | `entries` | Cada entrada y salida de un vehículo |
| Cobro | `payment_methods`, `receipt_types`, `payments` | Métodos de pago, boleta o factura, y pagos realizados |

Todas las tablas tienen columnas de **auditoría**: `status` (activo o no), `created` y `modified` (fechas) y `created_id` y `modified_id` (qué usuario lo hizo). Gracias a `status`, nunca se borran filas: cuando algo se elimina, solo se marca como inactivo.

## Tecnología utilizada

| Ítem | Tecnología |
| :--- | :--- |
| **Desarrollo** | Windows con WSL (Ubuntu) |
| | Git |
| | GitHub |
| | Visual Studio Code |
| **Backend** | Node.js 18 o superior |
| | Express 4 (framework de la API REST) |
| | JWT con jsonwebtoken (autenticación) |
| | bcryptjs (cifrado de contraseñas) |
| | pg, node-postgres (conexión a la base de datos) |
| | dotenv (variables de entorno) |
| | nodemon (recarga automática en desarrollo) |
| **BD** | PostgreSQL (SQL) |
| | Neon (PostgreSQL en la nube) |
| **Pruebas** | Postman |

## Modelo de datos

La base de datos tiene 16 tablas con nombres en inglés, en plural y en minúsculas (`snake_case`). Todas siguen las mismas reglas vistas en clase:

* La llave primaria se llama `id` y es autoincremental (`GENERATED ALWAYS AS IDENTITY`).
* Las llaves foráneas se llaman como la tabla en singular más `_id` (por ejemplo `vehicle_id`).
* Todas tienen las columnas de auditoría `status`, `created`, `modified`, `created_id` y `modified_id`. `created_id` y `modified_id` son llaves foráneas a `users`, así se sabe qué usuario creó o modificó cada fila.
* Nunca se borran filas: el `DELETE` de la API solo pone `status = false` (borrado lógico).

El script que crea las tablas es [`database/estacionamiento.sql`](database/estacionamiento.sql).

<details>
<summary>Ver el mismo diagrama en Mermaid (GitHub lo dibuja solo)</summary>

```mermaid
erDiagram
    roles ||--o{ users : "tiene"
    roles ||--o{ employees : "tiene"
    customers ||--o{ vehicles : "posee"
    brands ||--o{ models : "agrupa"
    models ||--o{ vehicles : "clasifica"
    vehicle_types ||--o{ vehicles : "clasifica"
    vehicle_types ||--o{ rates : "define"
    zones ||--o{ parking_spots : "contiene"
    vehicles ||--o{ entries : "registra"
    parking_spots ||--o{ entries : "ocupa"
    rates ||--o{ entries : "aplica"
    employees ||--o{ entries : "atiende"
    payment_methods ||--o{ payments : "usa"
    receipt_types ||--o{ payments : "emite"
    customers ||--o{ memberships : "contrata"
    vehicles ||--o{ memberships : "cubre"
    entries ||--o| payments : "se paga con"
    users {
        integer id PK
        integer role_id FK
        varchar username UK
        varchar password_hash
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    roles {
        integer id PK
        varchar name
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    employees {
        integer id PK
        integer role_id FK
        varchar first_name
        varchar last_name
        varchar document_number UK
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    customers {
        integer id PK
        varchar document_number UK
        varchar first_name
        varchar last_name
        varchar phone
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    brands {
        integer id PK
        varchar name
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    models {
        integer id PK
        integer brand_id FK
        varchar name
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    vehicle_types {
        integer id PK
        varchar name
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    vehicles {
        integer id PK
        integer customer_id FK
        integer model_id FK
        integer vehicle_type_id FK
        varchar license_plate UK
        varchar color
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    rates {
        integer id PK
        integer vehicle_type_id FK
        numeric hourly_price
        numeric daily_price
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    zones {
        integer id PK
        varchar name
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    parking_spots {
        integer id PK
        integer zone_id FK
        varchar number
        integer floor
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    entries {
        integer id PK
        integer vehicle_id FK
        integer parking_spot_id FK
        integer rate_id FK
        integer employee_id FK
        timestamp entry_datetime
        timestamp exit_datetime
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    payment_methods {
        integer id PK
        varchar name
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    receipt_types {
        integer id PK
        varchar name
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    payments {
        integer id PK
        integer entry_id FK,UK
        integer payment_method_id FK
        integer receipt_type_id FK
        varchar receipt_number
        timestamp payment_datetime
        numeric amount
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
    memberships {
        integer id PK
        integer customer_id FK
        integer vehicle_id FK
        timestamp start_date
        timestamp end_date
        numeric total_price
        boolean status
        timestamp created
        timestamp modified
        integer created_id FK
        integer modified_id FK
    }
```

</details>

### Diccionario de datos

En las columnas, **PK** es llave primaria, **FK** es llave foránea y **UNIQUE** indica que el valor no se puede repetir.

#### `users`

Usuarios que inician sesión en la API. Cada uno tiene un rol que define sus permisos.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `role_id` | integer | No | FK → `roles` |  | Rol asignado |
| `username` | varchar | No | UNIQUE |  | Nombre de usuario para iniciar sesión |
| `password_hash` | varchar | No |  |  | Contraseña cifrada con bcrypt |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `roles`

Roles de los usuarios y cargos de los empleados (Administrador, Cajero, Vigilante...).

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `name` | varchar | No |  |  | Nombre |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `employees`

Personal del estacionamiento que registra las entradas.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `role_id` | integer | No | FK → `roles` |  | Cargo del empleado |
| `first_name` | varchar | No |  |  | Nombres |
| `last_name` | varchar | No |  |  | Apellidos |
| `document_number` | varchar | No | UNIQUE |  | DNI (8 dígitos) |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `customers`

Clientes dueños de los vehículos, identificados por DNI o RUC.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `document_number` | varchar | No | UNIQUE |  | DNI (8 dígitos) o RUC (11 dígitos) |
| `first_name` | varchar | No |  |  | Nombres |
| `last_name` | varchar | No |  |  | Apellidos |
| `phone` | varchar | Sí |  |  | Celular (9 dígitos, empieza con 9) |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `brands`

Marcas de vehículos.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `name` | varchar | No |  |  | Nombre |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `models`

Modelos de vehículos; cada modelo pertenece a una marca.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `brand_id` | integer | No | FK → `brands` |  | Marca del modelo |
| `name` | varchar | No |  |  | Nombre |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `vehicle_types`

Tipos de vehículo (Auto, Moto, Camioneta...), que definen la tarifa.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `name` | varchar | No |  |  | Nombre |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `vehicles`

Vehículos registrados, con su dueño, modelo, tipo y placa.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `customer_id` | integer | No | FK → `customers` |  | Cliente dueño |
| `model_id` | integer | No | FK → `models` |  | Modelo del vehículo |
| `vehicle_type_id` | integer | No | FK → `vehicle_types` |  | Tipo de vehículo |
| `license_plate` | varchar | No | UNIQUE |  | Placa (única, en mayúsculas) |
| `color` | varchar | Sí |  |  | Color del vehículo |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `rates`

Tarifas por hora y por día de cada tipo de vehículo; solo una activa por tipo.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `vehicle_type_id` | integer | No | FK → `vehicle_types` |  | Tipo de vehículo |
| `hourly_price` | numeric | No |  |  | Precio por hora o fracción (S/) |
| `daily_price` | numeric | No |  |  | Precio por día de 24 horas (S/) |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `zones`

Zonas del estacionamiento.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `name` | varchar | No |  |  | Nombre |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `parking_spots`

Cupos (espacios) de cada zona, con su número y piso.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `zone_id` | integer | No | FK → `zones` |  | Zona a la que pertenece |
| `number` | varchar | No |  |  | Número o código del cupo (por ejemplo A-1) |
| `floor` | integer | No |  |  | Piso |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `entries`

Cada estadía de un vehículo: entrada, salida, cupo, tarifa y empleado.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `vehicle_id` | integer | No | FK → `vehicles` |  | Vehículo |
| `parking_spot_id` | integer | No | FK → `parking_spots` |  | Cupo asignado |
| `rate_id` | integer | No | FK → `rates` |  | Tarifa vigente al momento de entrar |
| `employee_id` | integer | No | FK → `employees` |  | Empleado que registró la entrada |
| `entry_datetime` | timestamp | No |  |  | Fecha y hora de entrada |
| `exit_datetime` | timestamp | Sí |  |  | Fecha y hora de salida (vacío si sigue dentro) |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `payment_methods`

Métodos de pago (Efectivo, Tarjeta, Yape...).

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `name` | varchar | No |  |  | Nombre |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `receipt_types`

Tipos de comprobante (Boleta, Factura...).

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `name` | varchar | No |  |  | Nombre |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `payments`

Pagos de las estadías, con su comprobante y monto. Un pago por entrada.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `entry_id` | integer | No | FK → `entries`, UNIQUE |  | Entrada que se paga (única) |
| `payment_method_id` | integer | No | FK → `payment_methods` |  | Método de pago |
| `receipt_type_id` | integer | No | FK → `receipt_types` |  | Tipo de comprobante |
| `receipt_number` | varchar | No |  |  | Número del comprobante (por ejemplo B001-00000001) |
| `payment_datetime` | timestamp | No |  |  | Fecha y hora del pago |
| `amount` | numeric | No |  |  | Monto cobrado (S/), calculado por la API |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |

#### `memberships`

Abonos (membresías) de un vehículo por un periodo; mientras están vigentes, no se cobra la estadía.

| Columna | Tipo | Nulo | Llave | Por defecto | Descripción |
|---|---|:---:|---|---|---|
| `id` | integer | No | PK | IDENTITY | Identificador único (autoincremental) |
| `customer_id` | integer | No | FK → `customers` |  | Cliente dueño |
| `vehicle_id` | integer | No | FK → `vehicles` |  | Vehículo |
| `start_date` | timestamp | No |  |  | Inicio de la membresía |
| `end_date` | timestamp | No |  |  | Fin de la membresía |
| `total_price` | numeric | No |  |  | Precio de la membresía (S/) |
| `status` | boolean | Sí |  | `true` | Activo (true) o desactivado (false); se usa para el borrado lógico |
| `created` | timestamp | Sí |  | `now()` | Fecha y hora de creación |
| `modified` | timestamp | Sí |  |  | Fecha y hora de la última modificación |
| `created_id` | integer | No | FK → `users` |  | Usuario que creó el registro |
| `modified_id` | integer | Sí | FK → `users` |  | Usuario que modificó el registro por última vez |


## Estructura de carpetas

```
catpark/
├── database/          estacionamiento.sql (tablas) y drop.sql (borrar tablas)
├── docs/              Guías (conexión a Neon) e Images/ (evidencia1/ a evidencia15/)
├── postman/           Colección de Postman (CatPark.postman_collection.json)
├── scripts/           db-init.js y db-seed.js
├── src/
│   ├── config/db.js   Pool de conexión a PostgreSQL
│   ├── middlewares/   auth.js (token), authorize.js (roles) y errorHandler.js (404 y errores)
│   ├── modules/       auth, users, roles, employees, customers, brands, models,
│   │                  vehicle-types, rates, vehicles, zones, parking-spots,
│   │                  payment-methods, receipt-types, memberships, entries, payments, reports
│   ├── utils/         AppError.js, asyncHandler.js, validate.js, transaction.js y fee.js
│   ├── app.js         Configuración de Express y rutas
│   └── server.js      Arranque del servidor
├── .env.example
└── package.json
```

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Comprueba que la API y la base de datos respondan |
| POST | `/api/auth/login` | Inicia sesión y devuelve el token (pública) |
| GET | `/api/auth/me` | Datos del usuario del token |
| GET | `/api/users` | Lista usuarios activos con su rol (solo Administrador) |
| GET | `/api/users/:id` | Busca un usuario (solo Administrador) |
| POST | `/api/users` | Crea un usuario `{ username, password, role_id }` (solo Administrador) |
| PUT | `/api/users/:id` | Edita un usuario o su contraseña (solo Administrador) |
| DELETE | `/api/users/:id` | Desactiva un usuario, borrado lógico (solo Administrador) |
| GET / POST | `/api/roles` | Lista los roles activos / crea un rol `{ name }` |
| GET / PUT / DELETE | `/api/roles/:id` | Busca, edita o desactiva un rol |
| GET / POST | `/api/employees` | Lista empleados activos con su rol / crea `{ role_id, first_name, last_name, document_number }` |
| GET / PUT / DELETE | `/api/employees/:id` | Busca, edita o desactiva un empleado |
| GET / POST | `/api/customers` | Lista clientes (`?search=texto`) / crea `{ document_number, first_name, last_name, phone? }` |
| GET | `/api/customers/document/:document` | Busca un cliente por DNI o RUC exacto |
| GET / PUT / DELETE | `/api/customers/:id` | Busca, edita o desactiva un cliente |
| GET / POST | `/api/brands` | Lista marcas activas / crea `{ name }` |
| GET / PUT / DELETE | `/api/brands/:id` | Busca, edita o desactiva una marca |
| GET | `/api/brands/:id/models` | Devuelve los modelos activos de una marca |
| GET / POST | `/api/models` | Lista modelos con `?brand_id=` / crea `{ brand_id, name }` |
| GET / PUT / DELETE | `/api/models/:id` | Busca, edita o desactiva un modelo |
| GET / POST | `/api/vehicle-types` | Lista tipos de vehículo / crea `{ name }` |
| GET / PUT / DELETE | `/api/vehicle-types/:id` | Busca, edita o desactiva un tipo de vehículo |
| GET / POST | `/api/rates` | Lista tarifas activas (`?vehicle_type_id=`) / crea una nueva (reemplaza la anterior) |
| GET / PUT / DELETE | `/api/rates/:id` | Busca, corrige precios o desactiva una tarifa |
| GET / POST | `/api/vehicles` | Lista vehículos (`?customer_id=`, `?plate=`) / crea un vehículo |
| GET | `/api/vehicles/plate/:plate` | Busca un vehículo por placa exacta (con cliente, marca y modelo) |
| GET / PUT / DELETE | `/api/vehicles/:id` | Busca, edita o desactiva un vehículo |
| GET | `/api/customers/:id/vehicles` | Vehículos activos de un cliente |
| GET / POST | `/api/zones` | Lista zonas activas / crea una zona `{ name }` |
| GET / PUT / DELETE | `/api/zones/:id` | Busca, edita o desactiva una zona |
| GET | `/api/zones/:id/parking-spots` | Devuelve los cupos de una zona |
| GET / POST | `/api/parking-spots` | Lista cupos con `occupied` (`?zone_id=`, `?floor=`) / crea `{ zone_id, number, floor }` |
| GET | `/api/parking-spots/available` | Devuelve solo cupos libres (`?zone_id=`) |
| GET / PUT / DELETE | `/api/parking-spots/:id` | Busca, edita o desactiva un cupo |
| GET / POST | `/api/payment-methods` | Lista métodos de pago activos / crea un método `{ name }` |
| GET / PUT / DELETE | `/api/payment-methods/:id` | Busca, edita o desactiva un método de pago |
| GET / POST | `/api/receipt-types` | Lista tipos de comprobante activos / crea un tipo `{ name }` |
| GET / PUT / DELETE | `/api/receipt-types/:id` | Busca, edita o desactiva un tipo de comprobante |
| GET / POST | `/api/memberships` | Lista membresías (`?customer_id=`, `?current=true`) / crea una membresía |
| GET / PUT / DELETE | `/api/memberships/:id` | Busca, edita o cancela (DELETE) una membresía |
| GET / POST | `/api/entries` | Lista entradas (`?active=true`, `?plate=`, `?date=`) / registra ingreso de vehículo |
| GET | `/api/entries/:id` | Detalle de una entrada |
| GET | `/api/entries/:id/amount` | Monto acumulado y desglose de cobro en tiempo real |
| PUT | `/api/entries/:id/exit` | Registra la salida del vehículo y devuelve el cobro final |
| GET / POST | `/api/payments` | Lista pagos (`?date=`, `?payment_method_id=`) / cobra una entrada emitida |
| GET | `/api/payments/entry/:entryId` | Obtiene el pago asociado a una entrada |
| GET | `/api/payments/:id` | Detalle de un pago con datos de comprobante |
| GET | `/api/reports/occupancy` | Reporte de ocupación actual por zona y totales generales |
| GET | `/api/reports/income` | Reporte de ingresos entre fechas (`?from=&to=`), por método y por día |
| GET | `/api/reports/dashboard` | Resumen ejecutivo del día (vehículos dentro, entradas, salidas e ingresos) |

## Evidencias (capturas)

Capturas de la ejecución de cada commit. Las del commit 1 están en `docs/Images/evidencia1/` (o `evidencias1/`), del commit 2 en `docs/Images/evidencia2/`, y así sucesivamente hasta el commit 15 en `docs/Images/evidencia15/`.

### Commit 1 : estructura base y conexión a Neon

En este commit se dejó lista la base del proyecto: Node.js con Express, la conexión a la base de datos de Neon y un endpoint de prueba. Todavía no hay tablas ni endpoints del estacionamiento; eso empieza en el commit 2.

**1. Proyecto creado en Neon.** Se creó el proyecto `catpark` con la base `neondb` en la rama `production`. El esquema `public` todavía muestra 0 tablas, porque las tablas se crean en el commit 2 con `npm run db:reset`. En el commit 2 también se creó la base propia `catpark_database`, que es la que usa el proyecto desde entonces.

![Proyecto catpark creado en Neon](docs/Images/evidencias1/c01-01-crear-base-neon.png)

**2. Variables de entorno.** La conexión se configura en un archivo `.env` que **no se sube a GitHub** (está en el `.gitignore`), porque contiene la contraseña de la base. En el repositorio solo va la plantilla `.env.example`:

```
DATABASE_URL=postgres://usuario:contraseña@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
PORT=3000
```

Cada integrante copia `.env.example` como `.env` y pega la *connection string* que da Neon en el botón **Connect**.

**3. Conexión a la base (`src/config/db.js`).** Crea un *pool*, es decir, un grupo de conexiones a PostgreSQL que se reutilizan en cada consulta. Si falta `DATABASE_URL`, el programa avisa y se detiene. La línea `types.setTypeParser(1114, ...)` hace que las fechas se devuelvan tal como están en la base, sin que Node les cambie la hora.

![Archivo db.js](docs/Images/evidencias1/c01-02-db-js.png)

**4. Aplicación de Express (`src/app.js`).** Configura Express para leer JSON y define el endpoint `GET /api/health`, que ejecuta `SELECT now()` en Neon. Si la consulta funciona, responde `status: ok`; si falla, responde 500 con el error.

![Archivo app.js](docs/Images/evidencias1/c01-03-app-js.png)

**5. Arranque del servidor (`src/server.js`).** Antes de abrir el puerto 3000, prueba la conexión con `SELECT 1`. Si la base responde, muestra "Conectado a la base de datos" y empieza a escuchar; si no, muestra el error y se detiene, para no tener una API corriendo sin base de datos.

![Archivo server.js](docs/Images/evidencias1/c01-04-server-js.png)

**6. Prueba en Postman.** La petición `GET http://localhost:3000/api/health` respondió **200 OK** con `"status": "ok"`, `"db": "connected"` y la hora del servidor de Neon, lo que confirma que la API se conecta correctamente a la base remota.

![Prueba de GET /api/health en Postman](docs/Images/evidencias1/c01-05-postman.png)

### Commit 2: scripts de base de datos y manejo de errores

En este commit se crearon las 16 tablas en Neon con un solo comando, se cargaron datos de prueba y se agregó el manejo global de errores, para que la API responda siempre en formato JSON.

**1. Base propia en Neon.** En el mismo proyecto de Neon se creó la base `catpark_database`, para no usar la base por defecto `neondb`. La cadena de conexión del `.env` ahora termina en `/catpark_database`.

![Base catpark_database en Neon](docs/Images/evidencias2/c02-01-catpark-database.png)

**2. Script SQL corregido (`database/estacionamiento.sql`).** En el script original la tabla `roles` aparecía antes que `users` y fallaba, porque `roles` apuntaba a una tabla que todavía no existía. Ahora `users` va primero. Además, al inicio se fija la zona horaria de la base en `America/Lima`, porque Neon trabaja en UTC y las horas de entrada y salida saldrían 5 horas adelantadas.

![Inicio del script SQL con la zona horaria y la tabla users](docs/Images/evidencias2/c02-02-sql-inicio.png)

**3. Usuarios con rol.** La tabla `users` ahora tiene la columna `role_id`, para que cada usuario tenga un rol (Administrador, Cajero o Vigilante). Como `users` y `roles` se apuntan entre sí, la llave foránea `users_role_id_fkey` se agrega al final con `ALTER TABLE` y es `DEFERRABLE`, es decir, se revisa al terminar la transacción.

![Tabla users con role_id y la llave foránea hacia roles](docs/Images/evidencias2/c02-03-sql-roles.png)

**4. Datos de prueba (`scripts/db-seed.js`).** Inserta el usuario `admin` (contraseña `admin123`, guardada cifrada con bcrypt) con el rol Administrador. Como `users` se referencia a sí misma, el primer usuario se inserta con `id = 1` y `created_id = 1` usando `OVERRIDING SYSTEM VALUE`. Luego inserta los catálogos: 3 roles, 3 tipos de vehículo, 3 tarifas en soles, 3 marcas, 6 modelos, 2 zonas, 10 cupos, 3 métodos de pago y 2 tipos de comprobante, todo dentro de una transacción.

![Script db-seed.js insertando el usuario admin](docs/Images/evidencias2/c02-04-seed.png)

**5. Creación de las tablas y carga de datos.** `npm run db:reset` borra y vuelve a crear las 16 tablas, y `npm run db:seed` carga los datos de prueba.

![Ejecución de npm run db:reset y npm run db:seed](docs/Images/evidencias2/c02-05-terminal-reset-seed.png)

**6. Base comprobada en Neon.** Las 16 tablas quedaron creadas en `catpark_database`. La tabla `roles` tiene Administrador, Cajero y Vigilante, y la tabla `users` tiene al `admin` con `role_id = 1`.

![Las 16 tablas en Neon](docs/Images/evidencias2/c02-06-neon-tablas.png)

![Tabla roles en Neon](docs/Images/evidencias2/c02-07-neon-roles.png)

![Tabla users con el admin y su rol](docs/Images/evidencias2/c02-08-neon-users.png)

**7. Manejo global de errores.** `src/utils/AppError.js` es un error propio que lleva el código HTTP, `src/utils/asyncHandler.js` pasa los errores de los controladores al manejador sin repetir `try/catch`, y `src/middlewares/errorHandler.js` responde siempre en JSON: 404 para rutas que no existen, 400 para JSON mal escrito y, para los errores de PostgreSQL, 409 si el dato está duplicado (`23505`) y 400 si la llave foránea no existe (`23503`), falta un campo (`23502`) o el formato es inválido (`22P02`).

![Archivo errorHandler.js](docs/Images/evidencias2/c02-09-error-handler.png)


### Commit 3: autenticación con JWT y CRUD de usuarios

En este commit se agregó el inicio de sesión. Desde ahora todas las rutas, menos `/api/health` y el login, piden un token, y con ese token cada registro guarda qué usuario lo creó o modificó. Además, solo el rol Administrador puede gestionar usuarios.

**1. Variables para el token.** Se agregaron a `.env.example` las variables `JWT_SECRET`, la clave con la que el servidor firma los tokens, y `JWT_EXPIRES_IN`, el tiempo que dura cada token (8 horas). El valor real de la clave va en el `.env`, que no se sube a GitHub.

![Variables JWT en .env.example](docs/Images/evidencia3/c03-01-env-example.png)

**2. Inicio de sesión (`src/modules/auth/auth.controller.js`).** La función `login` busca al usuario activo, compara la contraseña con `bcrypt.compare` (la base solo guarda la contraseña cifrada) y, si coincide, firma un token JWT con el `id`, el `username` y el `role` del usuario. Si el usuario o la contraseña no coinciden, responde 401.

![Función login del auth.controller.js](docs/Images/evidencia3/c03-02-auth-controller.png)

**3. Protección de las rutas (`src/middlewares/auth.js`).** Lee el header `Authorization: Bearer <token>` y verifica su firma con `JWT_SECRET`. Si el token es válido, guarda en `req.user` el id, el usuario y el rol de quien hace la petición; si falta, responde 401 `Token no enviado`, y si es inválido o ya venció, 401 `Token inválido o expirado`.

![Middleware auth.js](docs/Images/evidencia3/c03-03-auth-middleware.png)

**4. Permisos por rol (`src/middlewares/authorize.js`).** `authorize('Administrador')` deja pasar solo a los usuarios con ese rol; a los demás les responde 403 `Acceso denegado`. Así se diferencia la **autenticación** (401: el servidor no sabe quién eres) de la **autorización** (403: sabe quién eres, pero no tienes permiso).

![Middleware authorize.js](docs/Images/evidencia3/c03-04-authorize.png)

**5. Consultas de usuarios (`src/modules/users/users.service.js`).** Es el único archivo del módulo que escribe SQL. Hace un `JOIN` con `roles` para devolver el nombre del rol (`role_name`) y nunca devuelve `password_hash`. Al crear un usuario cifra la contraseña con bcrypt y guarda `created_id` con el usuario del token; al editar o desactivar guarda `modified_id`. El `DELETE` es lógico: solo pone `status = false`.

![Archivo users.service.js](docs/Images/evidencia3/c03-05-users-service.png)

**6. Rutas de usuarios (`src/modules/users/users.routes.js`).** Define el CRUD (`GET`, `POST`, `PUT` y `DELETE`) y aplica `authorize('Administrador')` a todas las rutas. Este módulo deja el patrón que siguen los demás: `routes` (las URL), `controller` (valida y responde) y `service` (el SQL).

![Archivo users.routes.js](docs/Images/evidencia3/c03-06-users-routes.png)

### Commit 4: CRUD de roles

En este commit se creó el primer catálogo del sistema siguiendo el patrón del módulo `users`. Los roles son los cargos de los empleados y también los roles de los usuarios (Administrador, Cajero y Vigilante). Todas sus rutas piden token.

**1. Consultas de roles (`src/modules/roles/roles.service.js`).** Tiene las consultas para listar, buscar, crear, editar y desactivar roles. `update` usa `COALESCE`, que deja el valor anterior si no llega uno nuevo, y `isInUse` revisa si algún empleado o usuario activo tiene ese rol.

![Archivo roles.service.js](docs/Images/evidencia4/c04-01-roles-service.png)

**2. Validaciones (`src/modules/roles/roles.controller.js`).** Exige el campo `name` al crear, responde 404 si el rol no existe y no deja desactivar un rol que esté en uso, para no dejar empleados o usuarios con un rol inactivo.

![Archivo roles.controller.js](docs/Images/evidencia4/c04-02-roles-controller.png)

**3. Rutas (`src/modules/roles/roles.routes.js` y `src/app.js`).** Se definieron las cinco rutas del CRUD y se registraron en `app.js` con `app.use('/api/roles', auth, rolesRoutes)`, así que todas piden token.

![Archivo roles.routes.js](docs/Images/evidencia4/c04-03-roles-routes.png)


### Commit 5: CRUD de empleados

En este commit se creó el módulo de empleados, es decir, el personal que atiende el estacionamiento y que más adelante registra las entradas de los vehículos. Cada empleado tiene un cargo, que se toma de la tabla `roles`. Todas sus rutas piden token.

**1. Consultas de empleados (`src/modules/employees/employees.service.js`).** Tiene las consultas para listar, buscar, crear, editar y desactivar empleados. Hace un `JOIN` con `roles` para devolver también el nombre del cargo (`role_name`), y al crear o editar guarda `created_id` o `modified_id` con el usuario del token.

![Archivo employees.service.js](docs/Images/evidencia5/c05-01-employees-service.png)

**2. Validaciones (`src/modules/employees/employees.controller.js`).** Exige `role_id`, `first_name`, `last_name` y `document_number` al crear. Revisa que el DNI tenga exactamente 8 dígitos y que el rol exista, reutilizando el service de roles del commit 4. Si el empleado no existe responde 404.

![Archivo employees.controller.js](docs/Images/evidencia5/c05-02-employees-controller.png)

**3. Rutas (`src/modules/employees/employees.routes.js` y `src/app.js`).** Se definieron las cinco rutas del CRUD y se registraron en `app.js` con el middleware `auth`, así que todas piden token.

![Archivo employees.routes.js](docs/Images/evidencia5/c05-03-employees-routes.png)

### Commit 6: CRUD de clientes y búsqueda por documento

En este commit se creó el módulo de clientes, es decir, los dueños de los vehículos que usan el estacionamiento. Cada cliente se identifica por su DNI o RUC, y se puede buscar por documento además del CRUD tradicional. Todas sus rutas piden token.

**1. Consultas de clientes (`src/modules/customers/customers.service.js`).** Tiene las consultas para listar, buscar por ID, buscar por documento, crear, editar y desactivar clientes. El listado acepta un filtro opcional `?search=` que busca por nombre, apellido o documento. Al crear o editar guarda `created_id` o `modified_id` con el usuario del token.

![Get del cliente](docs/Images/evidencia6/c6-03-custumers-postman-get-comprobacion-insertion.png)

**2. insercion de clientes (`src/modules/customers/customers.service.js`).** Se puede inertar nuevos datos a la basede datos, la manera correcta es hacerlo por el metodo de autenticacion la cual es crucial para que puede recibir la aprobacion del insercion.

![Post de clientes](docs/Images/evidencia6/c6-02-custumers-postman-isertion.png)

**3. Controladores (`src/modules/customers/customers.controller.js`).** Se muestra los controladores dentro de la carpeta src / modules donde se maneja todo los get , post y delete preacticamente el crud principal

![Controlador de clientes](docs/Images/evidencia6/c6-04-custumers-controller.png)

**4. Rutas (`src/modules/customers/customers.routes.js` y `src/app.js`).** Se definieron las seis rutas del CRUD más la ruta extra de búsqueda por documento, y se registraron en `app.js` con el middleware `auth`, así que todas piden token.

![token ](docs/Images/evidencia6/c6-01-custumers-user.png)

**Endpoints de clientes:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/customers` | Lista clientes activos (`?search=texto`) |
| GET | `/api/customers/document/:document` | Busca cliente por DNI o RUC exacto |
| GET | `/api/customers/:id` | Busca cliente por ID |
| POST | `/api/customers` | Crea un cliente |
| PUT | `/api/customers/:id` | Edita un cliente |
| DELETE | `/api/customers/:id` | Desactiva un cliente (borrado lógico) |

### Commit 7: CRUD de marcas y modelos de vehículos

En este commit se crearon los catálogos de **marcas** y **modelos** de vehículos, que se necesitan para registrar vehículos en el sistema. Cada modelo pertenece a una marca. Todas sus rutas piden token.

**1. Módulo `brands` (`src/modules/brands/`).** CRUD sobre la tabla `brands` con el campo `name`. No deja desactivar una marca que tenga modelos activos. Incluye la ruta extra `GET /api/brands/:id/models` que devuelve los modelos activos de esa marca.

![Controlador de marcas y brands ](docs/Images/evidencia7/c7-01-controlodares-brand.png)

**2. Módulo `models` (`src/modules/models/`).** CRUD sobre la tabla `models` con `brand_id` y `name`. El listado hace `JOIN` con `brands` y devuelve `brand_name`. Acepta el filtro opcional `?brand_id=`. Al crear o editar valida que la marca exista y esté activa.

![Controlador de marcas y brands](docs/Images/evidencia7/c7-02-controlodares-models.png)

**3. Consultas en postman `CRUD`.** Se definieron las rutas de `/api/brands` y `/api/models`, ambos pueden ingresar y pedir la informacion que deseen siempre y cuando sea con el token actualisado`.


![Crear marca en Postman](docs/Images/evidencia7/c7-04-post-brands.png)
![Crear modelo en Postman](docs/Images/evidencia7/c7-05-post-models.png)
![Consultar modelo en Postman](docs/Images/evidencia7/c7-03-get-models.png)

**Endpoints de marcas y modelos:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/brands` | Lista marcas activas |
| GET | `/api/brands/:id` | Busca una marca por ID |
| POST | `/api/brands` | Crea una marca `{ name }` |
| PUT | `/api/brands/:id` | Edita una marca |
| DELETE | `/api/brands/:id` | Desactiva una marca (falla si tiene modelos activos) |
| GET | `/api/brands/:id/models` | Devuelve los modelos activos de una marca |
| GET | `/api/models` | Lista modelos (filtro opcional `?brand_id=`) |
| GET | `/api/models/:id` | Busca un modelo por ID |
| POST | `/api/models` | Crea un modelo `{ brand_id, name }` |
| PUT | `/api/models/:id` | Edita un modelo |
| DELETE | `/api/models/:id` | Desactiva un modelo |



### Commit 8: Tipos de vehículo y tarifas

En este commit se crearon los catálogos de **tipos de vehículo** y **tarifas**, que definen cuánto se cobra por hora y por día según el tipo de vehículo. Cada tipo tiene una sola tarifa activa a la vez. Todas sus rutas piden token.

**1. Módulo `vehicle-types` (`src/modules/vehicle-types/`).** CRUD sobre la tabla `vehicle_types` con el campo `name`. No deja desactivar un tipo que tenga vehículos activos.

![controladores](docs/Images/evidencia8/c8-03-controllers-rates.png)

**2. Módulo `rates` (`src/modules/rates/`).** CRUD sobre la tabla `rates` con `vehicle_type_id`, `hourly_price` y `daily_price`. Usa el helper `withTransaction` para garantizar que solo quede una tarifa activa por tipo: al crear una nueva, desactiva la anterior automáticamente.

![Controlador de tarifas](docs/Images/evidencia8/c8-03-controllers-rates.png)

**3. CRUD `tarifa` (`src/utils/transaction.js`).** se puede verificar la insercion de datos atraves del get e ingresar nuevos datos atraves del post.
![Get de tarifas](docs/Images/evidencia8/c8-01-get-tipos-tarifa.png)
![Post de tarifas](docs/Images/evidencia8/c8-02-post-nueva-tarifa.png)


**Endpoints de tipos de vehículo y tarifas:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/vehicle-types` | Lista tipos de vehículo activos |
| GET | `/api/vehicle-types/:id` | Busca un tipo por ID |
| POST | `/api/vehicle-types` | Crea un tipo `{ name }` |
| PUT | `/api/vehicle-types/:id` | Edita un tipo |
| DELETE | `/api/vehicle-types/:id` | Desactiva un tipo (falla si tiene vehículos activos) |
| GET | `/api/rates` | Lista tarifas activas (filtro `?vehicle_type_id=`) |
| GET | `/api/rates/:id` | Busca una tarifa por ID |
| POST | `/api/rates` | Crea una tarifa (desactiva la previa del mismo tipo) |
| PUT | `/api/rates/:id` | Corrige precios de una tarifa |
| DELETE | `/api/rates/:id` | Desactiva una tarifa |
| GET / POST | `/api/vehicles` | Lista vehículos (`?customer_id=`, `?plate=`) / crea uno |
| GET | `/api/vehicles/plate/:plate` | Busca un vehículo por placa (con dueño, marca y modelo) |
| GET / PUT / DELETE | `/api/vehicles/:id` | Busca, edita o desactiva un vehículo |
| DELETE | `/api/customers/:id/vehicles` | Vehículos activos de un cliente |

### Commit 9: CRUD de vehículos y búsqueda por placa

En este commit se creó el módulo de **vehículos**, que une todo lo anterior: cliente, modelo, marca y tipo de vehículo. Incluye búsqueda por placa y una ruta para listar los vehículos activos de un cliente. Todas sus rutas piden token.

**1. Módulo `vehicles` (`src/modules/vehicles/`).** CRUD sobre la tabla `vehicles`. El `SELECT` base hace `JOIN` a `customers`, `models`, `brands` y `vehicle_types` para devolver además `customer_name`, `customer_document`, `model_name`, `brand_name` y `vehicle_type_name`. El listado acepta filtros opcionales `?customer_id=` y `?plate=`. Al crear o editar valida que el cliente, el modelo y el tipo de vehículo existan y estén activos. La placa se normaliza a mayúsculas sin espacios (ej. `abc 123` → `ABC123`) y debe tener formato `ABC-123`. No deja desactivar un vehículo que esté dentro del estacionamiento (`isInside`).

![Modulo de vehiculos](docs/Images/evidencia9/c9-03_controller_de_vehiculo.png)

**2. Búsqueda por placa (`GET /api/vehicles/plate/:plate`).** Ruta extra que busca un vehículo por su placa exacta y devuelve sus datos con dueño, marca y modelo. Va registrada antes de `GET /:id` para que `plate` no se tome como un `id`.

![Get por placa](docs/Images/evidencia9/c9-02_get_de_vehiculo_por_placa.png)

**3. Inserticion de datos (`post /api/customers/:id/vehicles`).** Se puede insertar nuevos datos a la tabla de vehiculos recordando que siempre y cuando el token este activo.

![post de vehiculos ](docs/Images/evidencia9/c9-01-post_de_vehiculo.png)


**Endpoints de vehículos:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/vehicles` | Lista vehículos activos (`?customer_id=`, `?plate=`) |
| GET | `/api/vehicles/plate/:plate` | Busca vehículo por placa exacta |
| GET | `/api/vehicles/:id` | Busca vehículo por ID |
| POST | `/api/vehicles` | Crea un vehículo `{ customer_id, model_id, vehicle_type_id, license_plate, color? }` |
| PUT | `/api/vehicles/:id` | Edita un vehículo |
| DELETE | `/api/vehicles/:id` | Desactiva un vehículo (falla si está dentro del estacionamiento) |
| GET | `/api/customers/:id/vehicles` | Vehículos activos de un cliente |
| GET / POST | `/api/zones` | Lista zonas / crea `{ name }` |
| GET / PUT / DELETE | `/api/zones/:id` | Busca, edita o desactiva una zona |
| GET | `/api/zones/:id/parking-spots` | Cupos de una zona |
| GET / POST | `/api/parking-spots` | Lista cupos con `occupied` (`?zone_id=`, `?floor=`) / crea uno |
| GET | `/api/parking-spots/available` | Cupos libres (`?zone_id=`) |
| GET / PUT / DELETE | `/api/parking-spots/:id` | Busca, edita o desactiva un cupo |

### Commit 10: Zonas, cupos y disponibilidad

En este commit se crearon los módulos de **zonas** y **cupos** del estacionamiento. Cada cupo indica si está ocupado (`occupied`) y hay una ruta para listar solo los cupos libres. Todas sus rutas piden token.

**1. Módulo `zones` (`src/modules/zones/`).** CRUD sobre la tabla `zones` con el campo `name`. No deja desactivar una zona que tenga cupos activos.

![Controlador de zonas](docs/Images/evidencia10/c10-02_controller_zone.png)

**2. Módulo `parking-spots` (`src/modules/parking-spots/`).** CRUD sobre la tabla `parking_spots` con `zone_id`, `number`, `floor`. El `SELECT` base hace `JOIN zones` y calcula si el cupo está ocupado con un `EXISTS` sobre `entries` (`exit_datetime IS NULL AND status = true`), devolviéndolo como columna `occupied`. `findAll` acepta filtros opcionales `?zone_id=` y `?floor=`. `findAvailable` devuelve solo los cupos activos que no están ocupados; acepta `?zone_id=`. `create` valida que la zona exista, que `floor` sea entero y que no se repita el mismo `number` dentro de la misma zona.

![Controlador de cupos](docs/Images/evidencia10/c10-01_controller_parking.png)

**3. CRUD `crud de parking`.** Se puede comparar las inserciones que se hizo con el get de manera que se pueda verificar si este guardo su informacion enviado correctamente.

![Get de parking](docs/Images/evidencia10/c10-03-get-de-parking.png)
![Post de parking](docs/Images/evidencia10/c10-04-post-de-parking.png)

**Endpoints de zonas y cupos:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/zones` | Lista zonas activas |
| GET | `/api/zones/:id` | Busca una zona por ID |
| POST | `/api/zones` | Crea una zona `{ name }` |
| PUT | `/api/zones/:id` | Edita una zona |
| DELETE | `/api/zones/:id` | Desactiva una zona (falla si tiene cupos activos) |
| GET | `/api/zones/:id/parking-spots` | Devuelve los cupos de una zona |
| GET | `/api/parking-spots` | Lista cupos con `occupied` (`?zone_id=`, `?floor=`) |
| GET | `/api/parking-spots/available` | Devuelve solo cupos libres (`?zone_id=`) |
| GET | `/api/parking-spots/:id` | Busca un cupo por ID |
| POST | `/api/parking-spots` | Crea un cupo `{ zone_id, number, floor }` |
| PUT | `/api/parking-spots/:id` | Edita un cupo |
| DELETE | `/api/parking-spots/:id` | Desactiva un cupo (falla si está ocupado) |

### Commit 11: Métodos de pago, tipos de comprobante y membresías

En este commit se crearon los catálogos base para la facturación (`payment_methods` y `receipt_types`) y el módulo de **membresías** para los clientes frecuentes del estacionamiento (abonos mensuales). Todas sus rutas requieren autenticación con token.

**1. Módulo `payment-methods` (`src/modules/payment-methods/`).** CRUD sobre la tabla `payment_methods` con el campo `name` (Efectivo, Tarjeta, Yape). Sigue el patrón estándar y no permite desactivar un método de pago si tiene pagos activos registrados.

![Controlador de métodos de pago](docs/Images/evidencia11/c11-01_controller_payment_methods.png)

![Prueba GET métodos de pago en Postman](docs/Images/evidencia11/c11-03_get_de_metodos_de_pago.png)

**2. Módulo `receipt-types` (`src/modules/receipt-types/`).** CRUD sobre la tabla `receipt_types` con el campo `name` (Boleta, Factura). Sigue el mismo patrón y no permite desactivar un tipo de comprobante que tenga registros asociados.

![Prueba GET tipos de comprobante en Postman](docs/Images/evidencia11/c11-04_get_de_receipt_types.png)

**3. Módulo `memberships` (`src/modules/memberships/`).** Gestión de suscripciones mensuales de vehículos.
- `memberships.service.js`: Incluye un `JOIN` con `customers` y `vehicles` para devolver información del titular y vehículo. Calcula dinámicamente si la membresía está vigente al día de hoy mediante `is_current`. Además, cuenta con `findCurrentByVehicle` (utilizado en el Commit 13 para exonerar de cobro a vehículos vigentes) y `hasOverlap` para impedir superposiciones de fechas en el mismo vehículo.
- `memberships.controller.js`: Valida que el cliente y el vehículo existan y estén activos, comprueba que el vehículo pertenezca efectivamente a ese cliente, que el rango de fechas sea coherente (`end_date > start_date`), que el precio sea mayor a 0 y que no haya cruce con otra membresía activa del vehículo (responde 409). El endpoint `DELETE` cancela la membresía.

![Controlador de membresías](docs/Images/evidencia11/c11-01_controller_memberships.png)

![Prueba POST membresías en Postman](docs/Images/evidencia11/c11-05_post_de_memberships.png)

**4. Rutas y registro en `app.js`.** Se incorporaron y protegieron con el middleware `auth` las rutas correspondientes a `/api/payment-methods`, `/api/receipt-types` y `/api/memberships`.

**Endpoints del Commit 11:**

| Método | Ruta | Descripción |
|---|---|---|
| GET / POST | `/api/payment-methods` | Lista métodos de pago activos / crea `{ name }` |
| GET / PUT / DELETE | `/api/payment-methods/:id` | Busca, edita o desactiva un método de pago |
| GET / POST | `/api/receipt-types` | Lista tipos de comprobante / crea `{ name }` |
| GET / PUT / DELETE | `/api/receipt-types/:id` | Busca, edita o desactiva un tipo de comprobante |
| GET / POST | `/api/memberships` | Lista membresías (`?customer_id=`, `?current=true`) / crea `{ customer_id, vehicle_id, start_date, end_date, total_price }` |
| GET / PUT / DELETE | `/api/memberships/:id` | Busca, edita o cancela (DELETE lógico) una membresía |

---

### Commit 12: Registro de entradas de vehículos

En este commit se implementó el módulo central del sistema: el **registro de ingreso vehicular**. Cada entrada vincula el vehículo, el cupo asignado, la tarifa vigente y el empleado que registra el ingreso.

**1. Módulo `entries` (`src/modules/entries/`).**
- `entries.service.js`: Registra la entrada dentro de una transacción que bloquea el cupo con `FOR UPDATE` para garantizar concurrencia segura. Devuelve los datos de la entrada mediante `JOIN` a vehículos, clientes, cupos, zonas, tarifas y empleados. Admite filtros de búsqueda por estado `?active=true`, placa `?plate=` y fecha `?date=`.
- `entries.controller.js`: Valida estrictamente en orden:
  1. Que el vehículo exista y esté registrado en la base de datos (404 si no existe).
  2. Que el vehículo no esté ya dentro del estacionamiento con una entrada abierta (409).
  3. Que el cupo seleccionado exista y se encuentre libre (409 si ya está ocupado).
  4. Que el empleado asignado exista y esté activo.
  5. Que exista una tarifa activa para el tipo de vehículo al momento de ingresar, almacenando su referencia en `rate_id` para garantizar el precio histórico al momento del cobro.
- Índice único concurrente: Para prevenir que dos registros simultáneos asignen el mismo cupo, la base de datos cuenta con el índice `entries_parking_spot_active_unique` que captura la colisión (código `23505`) y responde 409 automáticamente.

![Controlador de entradas](docs/Images/evidencia12/c12-01_controller_entries.png)

![Servicio de entradas](docs/Images/evidencia12/c12-02_service_entries.png)

![Prueba POST de entradas en Postman](docs/Images/evidencia12/c12-03_post_de_entries.png)

**Endpoints de entradas:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/entries` | Lista entradas con filtros opcionales (`?active=true`, `?plate=`, `?date=`) |
| GET | `/api/entries/:id` | Obtiene el detalle completo de una entrada por su ID |
| POST | `/api/entries` | Registra el ingreso de un vehículo `{ license_plate, parking_spot_id, employee_id }` |

---

### Commit 13: Salida de vehículos y cálculo del cobro

En este commit se añadió el cálculo del importe a pagar y el registro de la salida física del vehículo del estacionamiento, liberando inmediatamente el cupo para nuevos ingresos.

**1. Lógica de liquidación y cobro (`src/utils/fee.js`).** Aplica las reglas del negocio del estacionamiento:
- Horas cobradas: se cobra por hora completa o fracción, con un mínimo obligatorio de 1 hora (`Math.ceil(minutos / 60)`).
- Cada bloque de 24 horas continuas equivale a la tarifa por día (`Math.floor(horas / 24)`).
- Las horas sueltas adicionales nunca superan el precio máximo de un día (`min(horas_extra * precio_hora, precio_dia)`).
- Normalización numérica de valores decimales procedentes del driver `pg` con redondeo a dos decimales.

**2. Servicio y controlador de salidas (`entries.service.js` y `entries.controller.js`).**
- `getMinutes`: Calcula el tiempo transcurrido directamente en el motor PostgreSQL (`EXTRACT(EPOCH FROM (exit_time - entry_datetime))/60`) para eliminar cualquier desfase por diferencias de zonas horarias entre servidores.
- `calculateCharge`: Evalúa si el vehículo cuenta con una membresía activa y vigente al momento de salir (`memberships.service.findCurrentByVehicle`); de ser así, el monto liquidado resulta en `0`.
- `getAmount`: Endpoint de consulta previa (`GET /api/entries/:id/amount`) que permite visualizar el tiempo consumido y el desglose a pagar en tiempo real sin alterar el estado de la entrada.
- `registerExit`: Marca la hora de salida (`exit_datetime = now()`), libera el cupo y devuelve el detalle completo de la liquidación efectuada.

![Controlador de salidas](docs/Images/evidencia13/c13-01_controller_entries.png)

![Servicio de cálculo y salida](docs/Images/evidencia13/c13-02_service_entries.png)

**Endpoints de salida y cobro:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/entries/:id/amount` | Calcula y previsualiza el cobro acumulado según tiempo y tarifa |
| PUT | `/api/entries/:id/exit` | Registra la salida del vehículo, libera el cupo y liquida el importe |

---

### Commit 14: Registro de pagos y emisión de comprobantes

En este commit se implementó el módulo de **pagos y facturación**, permitiendo liquidar las entradas de vehículos que ya registraron su salida y emitiendo el comprobante de pago oficial (Boleta o Factura).

**1. Módulo `payments` (`src/modules/payments/`).**
- `payments.service.js`: Ejecuta la creación del comprobante dentro de una transacción segura. Implementa `pg_advisory_xact_lock` bloqueando por el tipo de comprobante para evitar colisiones de numeración bajo alta concurrencia. Cuenta los comprobantes emitidos de esa serie y formula el correlativo con formato estándar: letra inicial del tipo (`B` para Boleta, `F` para Factura), serie fija `001-` y correlativo de 8 dígitos (ejemplo: `B001-00000001`, `F001-00000001`).
- `payments.controller.js`: Valida rigurosamente:
  1. Que la entrada exista y cuente con salida registrada (`exit_datetime` no nulo).
  2. Que la entrada no haya sido pagada previamente (409 si ya está pagada).
  3. Que el vehículo no esté cubierto por membresía vigente (monto 0 rechaza el pago con 400).
  4. El monto no es manipulable por el cliente: se calcula y valida en el servidor mediante `calculateCharge`.
  5. Por integridad contable y legal, no existe endpoint `DELETE` (un comprobante emitido no se elimina).

![Controlador de pagos](docs/Images/evidencia14/c14-01_controller_payments.png)

![Servicio de pagos](docs/Images/evidencia14/c14-02_service_payments.png)

**Endpoints de pagos:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/payments` | Lista pagos realizados con filtros opcionales (`?date=`, `?payment_method_id=`) |
| GET | `/api/payments/entry/:entryId` | Obtiene el pago y comprobante asociado a una entrada específica |
| GET | `/api/payments/:id` | Obtiene el detalle de un pago por su ID |
| POST | `/api/payments` | Registra el pago y genera el comprobante correlativo `{ entry_id, payment_method_id, receipt_type_id }` |

---

### Commit 15: Reportes ejecutivos, colección de Postman y cierre del proyecto

En este commit de cierre se añadieron los **reportes de gestión** para administración, la colección completa de Postman parametrizada y la finalización de los scripts y documentación de entrega del sistema.

**1. Módulo `reports` (`src/modules/reports/`).** Proporciona métricas e indicadores de rendimiento de solo lectura:
- `occupancy` (`GET /api/reports/occupancy`): Ocupación actual por zona (cupos totales, ocupados, libres y porcentaje de ocupación) junto con la fila resumen de totales del establecimiento.
- `income` (`GET /api/reports/income?from=AAAA-MM-DD&to=AAAA-MM-DD`): Reporte financiero entre rangos de fechas con el total recaudado, cantidad de cobros y desglose agrupado por método de pago y por día.
- `dashboard` (`GET /api/reports/dashboard`): Resumen ejecutivo en tiempo real para el día actual: vehículos actualmente dentro, cantidad de entradas del día, salidas del día, ingresos monetarios acumulados y membresías vigentes.

![Controlador de reportes](docs/Images/evidencia15/c15-01_controller_reports.png)

![Servicio de reportes](docs/Images/evidencia15/c15-02_service_reports.png)

**2. Colección de Postman (`postman/CatPark.postman_collection.json`).**
- Organizada en carpetas modulares cubriendo la totalidad de endpoints del sistema.
- Incluye variables globales de colección (`baseUrl` y `token`).
- La petición de login guarda automáticamente el token JWT devuelto en la variable `{{token}}`, permitiendo ejecutar inmediatamente cualquier petición del estacionamiento con autenticación *Bearer*.

**Endpoints de reportes:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reports/occupancy` | Reporte de cupos ocupados, disponibles y porcentaje de ocupación por zona |
| GET | `/api/reports/income` | Reporte de ingresos entre fechas (`?from=&to=`), agrupado por día y método |
| GET | `/api/reports/dashboard` | Tablero resumen del día actual (vehículos, flujo diario, recaudación y socios) |

---

## Referencias

* Node.js: https://nodejs.org/
* Express: https://expressjs.com/
* node-postgres (pg): https://node-postgres.com/
* PostgreSQL: https://www.postgresql.org/docs/
* Neon: https://neon.tech/docs
* JSON Web Tokens: https://jwt.io/
* jsonwebtoken: https://github.com/auth0/node-jsonwebtoken
* bcryptjs: https://github.com/dcodeIO/bcrypt.js
* dotenv: https://github.com/motdotla/dotenv
* Postman: https://learning.postman.com/docs/
* Git: https://git-scm.com/
* Plantilla del curso: https://github.com/rescobedoulasalle/iw/tree/main/proyecto
