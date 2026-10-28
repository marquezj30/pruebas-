# Conexión a Neon (PostgreSQL)

Este proyecto utiliza [Neon](https://neon.tech) como base de datos PostgreSQL en la nube.

## Pasos para conectar

1. Crea una cuenta en [Neon Console](https://console.neon.tech).
2. Crea un proyecto y una base de datos.
3. En el panel del proyecto, copia la **Connection String** (DATABASE_URL).
   Tiene este formato:
   ```
   postgres://usuario:contraseña@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Crea un archivo `.env` en la raíz del proyecto basado en `.env.example` y pega tu `DATABASE_URL`.
5. Ejecuta el script `database/estacionamiento.sql` contra tu base de datos de Neon para crear las tablas.

## Script SQL

El esquema completo está en:
```
database/estacionamiento.sql
```

Contiene 16 tablas con auditoría, restricciones de integridad, índices y membresías.

## Notas

- Neon requiere conexión SSL (`sslmode=require`).
- La tabla `users` es autoreferencial (`created_id` y `modified_id` apuntan a `users.id`). El primer usuario debe insertarse manualmente.
