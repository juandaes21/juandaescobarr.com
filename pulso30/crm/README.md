# Activación del CRM automático de PULSO 30

Estado actual: **Google Sheets listo; Apps Script aún no autorizado ni publicado**.

CRM: https://docs.google.com/spreadsheets/d/1kbhfmHqzTyDpKoIhauzPUgQd_SEXE69zAQzaE9aJvO8/edit

## Paso único en tu cuenta de Google (necesario por seguridad)
1. Abre la hoja; ve a **Extensiones → Apps Script**. Si está disponible, pega el contenido de `Code.gs`.
2. Guarda el proyecto. En Implementar → Nueva implementación → Aplicación web, selecciona **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**. Esta configuración hace público SOLO el endpoint; nunca el archivo de Google Sheets.
3. Autoriza acceso a Sheets y MailApp desde la cuenta propietaria.
4. Copia la URL HTTPS que termina en `/exec`.
5. Configúrala en la web en `pulso30/diagnostico.html` como `CRM_WEB_APP_URL` y prueba con un prospecto ficticio.
6. Verifica fila nueva en la pestaña Prospectos, cambio de estado en CRM y llegada de la notificación al correo antes de distribuir la landing.

## Seguridad
- No compartas el CRM públicamente ni publiques tokens.
- Se requiere consentimiento explícito. Ajustar aviso de privacidad y políticas de retención antes de tráfico real.
- Protecciones básicas incluidas: formulario señuelo, validación del lado servidor, límites por correo, bloqueo contra envíos simultáneos y protección de fórmulas. **No es protección avanzada anti-bot**.
- Un endpoint público de Apps Script podría ser abusado. Evaluar Cloudflare Turnstile verificado en backend para una campaña masiva.
- El script utiliza un formulario POST. Debe verificarse respuesta de registro y envío de correo mediante pruebas reales.

## Degradación
No sustituyas el formulario actual por este endpoint mientras no esté autorizado y probado. Hasta entonces, el fallback manual por email sigue disponible.
