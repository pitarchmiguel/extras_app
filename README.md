# Extras

Aplicación personal para registrar horas extras y festivas, controlar pagos y firmas y adjuntar la foto de cada hoja. Interfaz en español, adaptable a móvil y escritorio.

## Funciones

- Alta y edición de registros por fecha, tipo y duración en horas y minutos.
- Pago y firma del jefe como estados independientes, editables desde la tabla.
- Fotografías JPG, PNG y WebP o PDF, hasta 10 MB, en un bucket privado.
- Vista previa de documentos mediante enlaces temporales de cinco minutos.
- Resumen mensual, gráfico por semanas, búsqueda, filtros y paginación.
- Exportación CSV con los filtros activos y protección frente a fórmulas.
- Registro e inicio de sesión por correo y contraseña; recuperación de contraseña.
- Modo de demostración separado de los datos reales. Sus cambios se pierden al recargar y nunca se importan a la cuenta.
- Archivado reversible en base de datos mediante `deleted_at`. Las fotos anteriores se conservan en privado al reemplazarlas para evitar pérdidas accidentales.

## Desarrollo

Requiere Node.js 22 o posterior.

```sh
npm ci
cp .env.example .env
npm run dev
```

```sh
npm run build
npm test
```

React, TypeScript, Vite y Supabase. Las dependencias están fijadas y el lockfile se incluye para instalaciones reproducibles. La clave publicable de Supabase es pública por diseño: la protección reside en Auth y las políticas RLS; nunca añadir una clave secreta o `service_role` al cliente.

## Supabase

Proyecto: `extras-app` (`mlxpvghndzuevytojwwf`), región `eu-west-1`.

La base de datos y el bucket ya están configurados. `supabase/schema.sql` reproduce el esquema inicial y las políticas aplicadas mediante la migración remota `create_overtime_entries_and_private_storage`. No ejecutar de nuevo sobre la base de datos existente.

Cada usuario solo puede leer y escribir sus propios registros y los archivos de su carpeta. Los adjuntos no son públicos. Se verificó RLS y no se detectaron avisos de seguridad en el análisis de Supabase.

En **Authentication → URL Configuration**, establecer la URL definitiva como **Site URL** y permitirla en **Redirect URLs**, junto con `http://localhost:5173` durante el desarrollo. Esto permite que los correos de confirmación y recuperación vuelvan a la app. Usar SMTP propio para producción si se necesitan correos fuera de las limitaciones del proveedor de pruebas de Supabase.

## Despliegue

Importar `pitarchmiguel/extras_app` en Vercel como proyecto Vite: instalación `npm ci`, compilación `npm run build`, salida `dist`. El cliente ya tiene la URL y clave publicable del proyecto; las variables de `.env.example` permiten sustituirlas por otro entorno. No subir `.env`.

## Comprobaciones

- Compilación TypeScript y Vite.
- Pruebas de duraciones, estados independientes y exportación segura.
- Verificación del bucket privado, límite de tamaño y políticas de propiedad.

No se han registrado horas reales ni creado cuentas personales durante la preparación. La validación visual y el flujo completo de correo, acceso y subida con una cuenta real deben verificarse en el alojamiento final.
