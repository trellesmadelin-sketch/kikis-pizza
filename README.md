# Kiki’s Pizza

Sitio estático publicado en Netlify, con pedidos por WhatsApp y acceso opcional de clientes mediante Netlify Identity.

## Cuentas de clientes

El botón «Mi cuenta» abre los formularios de acceso, registro y recuperación. Los enlaces de confirmación, recuperación, invitación y cambio de correo se procesan al cargar la página principal. Las invitaciones requieren elegir una contraseña antes de crear la cuenta. Los proveedores externos y la disponibilidad del registro se consultan desde Identity; no se habilitan proveedores desde el código.

`js/auth.js` encapsula el SDK `@netlify/identity` (versión 2.0.1, importada desde esm.sh). `js/account.js` conecta los formularios con el SDK. No se requiere instalar dependencias ni ejecutar una compilación.

La configuración de registro, correos y proveedores externos está en https://app.netlify.com/projects/kikispizza/identity.

## Validación en un despliegue

Netlify Identity no funciona bajo `netlify dev`. En una Deploy Preview o en el sitio publicado, comprobar:

- Crear una cuenta, confirmar el correo e iniciar sesión; recargar y cerrar sesión.
- Solicitar recuperación y abrir el enlace recibido; elegir una contraseña y entrar con ella.
- Abrir una invitación y elegir una contraseña para activar la cuenta.
- Comprobar errores de contraseña y enlaces caducados, así como el cierre del diálogo con Escape y la navegación por teclado.
- Si hay proveedores externos habilitados, completar su acceso y retorno al sitio.
- Confirmar que el pedido por WhatsApp sigue disponible sin iniciar sesión.

La cuenta identifica al cliente; esta integración no guarda pedidos ni añade un panel privado.
