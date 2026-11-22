# Extras

Registro personal de horas extras y festivas en una única pantalla.

App: https://extras-app-pitarch.vercel.app

## Uso

Pulsa **Añadir horas** y completa fecha, tipo y duración. Puedes marcar si están pagadas y si la hoja está firmada, y adjuntar una foto o PDF de hasta 10 MB. Los registros se guardan en Supabase. Desde la lista puedes editar, cambiar los estados, ver la hoja o archivar un registro. Los filtros permiten consultar por mes, pago o firma.

No hay cuentas, espacio personal, demostración, gráficos ni pantallas de inicio de sesión dentro de la app. La protección privada del alojamiento en Vercel se mantiene: si no tienes sesión de Vercel en un dispositivo, el alojamiento puede pedir acceso antes de abrir la app.

## Desarrollo

Node.js 22 o posterior:

```sh
npm ci
npm run build
npm test
```

Para desarrollo completo utiliza Vercel CLI (`vercel dev`) con el proyecto enlazado y las variables del entorno. `npm run dev` solo inicia la interfaz Vite; necesita la API de servidor para leer y guardar datos.

React + TypeScript + Vite. `api/entries.js` es el intermediario de servidor que llama a la función Supabase `personal-ledger`. La clave `EXTRAS_API_KEY` se almacena como variable sensible del servidor Vercel; nunca se añade al código ni se envía al navegador. La función verifica su hash antes de cualquier operación.

## Datos y privacidad

Supabase: `mlxpvghndzuevytojwwf`, región `eu-west-1`.

- `overtime_entries` mantiene RLS; no tiene acceso público a los registros personales.
- La API sirve un solo registro personal, sin cuentas ni datos separados por usuario.
- El bucket `overtime-sheets` es privado. Las subidas usan permisos temporales para una ruta concreta y las vistas previas caducan a los cinco minutos.
- Las duraciones se almacenan en minutos enteros; el servidor valida fechas, estados y archivos.
- Archivar conserva el registro con `deleted_at`. Reemplazar una hoja conserva la anterior en privado.
- `supabase/schema.sql` y `supabase/personal-ledger.sql` documentan los cambios ya aplicados. No volver a ejecutarlos sobre el proyecto existente.

La API depende de la protección de despliegues de Vercel ya activada en el proyecto. **No desactivarla** sin añadir antes una protección equivalente. La API rechaza dominios personalizados porque la configuración actual de Vercel los excluye de su protección.

## Despliegue

Los cambios en `main` de `pitarchmiguel/extras_app` se publican automáticamente en Vercel. Compilación: `npm run build`; salida: `dist`. Los cambios de la función Supabase se despliegan por separado, manteniendo su verificación de credencial de servidor.
