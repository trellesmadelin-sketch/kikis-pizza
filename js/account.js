const el = id => document.getElementById(`account${id}`);
const dialog = el('Dialog');
let auth, settings, mode = 'login', inviteToken, busy = false;
const open = () => { if (!dialog.open) dialog.showModal(); };
el('Btn').addEventListener('click', open);
el('Close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
const status = message => { el('Status').textContent = message; };
function render(next = mode) {
  mode = next;
  const user = auth.getCurrentUser();
  const passwordFlow = mode === 'invite' || mode === 'password';
  const signedIn = !!user && !passwordFlow;
  const registration = mode === 'register';
  const recovery = mode === 'recover';
  el('Title').textContent = signedIn ? 'Tu cuenta' : ({login: 'Bienvenido a Kiki’s', register: 'Crea tu cuenta', recover: 'Recupera tu cuenta', password: 'Nueva contraseña', invite: 'Acepta tu invitación'})[mode];
  el('Profile').hidden = !signedIn;
  el('Profile').textContent = signedIn ? `${user.userMetadata?.full_name || user.name || 'Tu sesión está activa'} · ${user.email || ''}` : '';
  el('Form').hidden = signedIn;
  el('NameLabel').hidden = !registration;
  el('Name').required = registration;
  el('EmailLabel').hidden = passwordFlow;
  el('Email').required = !passwordFlow;
  el('PasswordLabel').hidden = recovery;
  el('Password').required = !recovery;
  el('Password').minLength = registration || passwordFlow ? 8 : 1;
  el('Password').autocomplete = registration || passwordFlow ? 'new-password' : 'current-password';
  el('ConfirmLabel').hidden = !passwordFlow;
  el('Confirm').required = passwordFlow;
  el('Submit').textContent = ({login:'Entrar', register:'Crear cuenta', recover:'Enviar enlace', password:'Guardar contraseña', invite:'Activar mi cuenta'})[mode];
  el('Login').hidden = signedIn || passwordFlow || mode === 'login';
  el('Register').hidden = signedIn || passwordFlow || registration || settings.disableSignup;
  el('Recover').hidden = signedIn || passwordFlow || recovery;
  el('Logout').hidden = !signedIn;
  el('Providers').hidden = signedIn || passwordFlow || recovery;
  status(!signedIn && mode === 'login' && settings.disableSignup ? 'El registro está disponible solo por invitación.' : '');
}
for (const [id, next] of [['Login','login'], ['Register','register'], ['Recover','recover']]) {
  el(id).addEventListener('click', () => { if (busy) return; el('Form').reset(); render(next); });
}
async function perform(action) {
  if (busy) return;
  busy = true;
  dialog.setAttribute('aria-busy', 'true');
  const buttons = [...dialog.querySelectorAll('button')].filter(button => button !== el('Close'));
  buttons.forEach(button => { button.disabled = true; });
  status('Un momento…');
  try { await action(); }
  catch { status('No se pudo completar la operación. Inténtalo de nuevo.'); }
  finally { busy = false; dialog.removeAttribute('aria-busy'); buttons.forEach(button => { button.disabled = false; }); }
}
el('Form').addEventListener('submit', event => {
  event.preventDefault();
  if (!auth || !el('Form').reportValidity()) return;
  if ((mode === 'password' || mode === 'invite') && el('Password').value !== el('Confirm').value) {
    status('Las contraseñas no coinciden.'); el('Confirm').focus(); return;
  }
  perform(async () => {
    const email = el('Email').value, password = el('Password').value;
    const result = await (mode === 'register' ? auth.register({name:el('Name').value, email, password}) : mode === 'recover' ? auth.resetPassword(email) : mode === 'invite' ? auth.joinInvitation(inviteToken, password) : mode === 'password' ? auth.setNewPassword(password) : auth.signIn(email, password));
    if (!result.success) { status(result.message); return; }
    const completed = mode;
    el('Form').reset();
    if (completed === 'invite') inviteToken = undefined;
    render('login');
    status(completed === 'recover' ? 'Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña.' : completed === 'register' && !auth.getCurrentUser() ? 'Revisa tu correo para confirmar tu cuenta antes de entrar.' : completed === 'password' ? 'Tu contraseña se actualizó.' : 'Tu sesión está iniciada.');
  });
});
el('Logout').addEventListener('click', () => perform(async () => {
  const result = await auth.signOut();
  if (result.success) { render('login'); status('Cerraste tu sesión.'); }
  else status(result.message);
}));
try {
  auth = await import('./auth.js');
  // Process email links before rendering the ordinary login form.
  const callback = await auth.initializeAuth();
  settings = await auth.getSettings();
  for (const [provider, enabled] of Object.entries(settings.providers)) {
    if (!enabled || provider === 'email') continue;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn out sm';
    button.textContent = `Continuar con ${provider.charAt(0).toUpperCase() + provider.slice(1)}`;
    button.addEventListener('click', () => perform(() => auth.oauthLogin(provider)));
    el('Providers').append(button);
  }
  auth.onAuthChange(user => {
    el('Btn').textContent = user ? 'Mi cuenta · ✓' : 'Mi cuenta';
    if (settings) render();
  });
  if (callback?.type === 'invite') {
    inviteToken = callback.token;
    render('invite'); open();
    status('Elige una contraseña de al menos 8 caracteres para activar tu cuenta.');
  } else if (callback?.type === 'recovery') {
    render('password'); open();
    status('Elige una contraseña de al menos 8 caracteres.');
  } else {
    render('login');
    if (callback) { open(); status(callback.type === 'confirmation' ? 'Tu correo quedó confirmado.' : 'Tu cuenta se actualizó.'); }
  }
} catch {
  el('Form').hidden = true;
  status('No se pudo cargar el acceso o el enlace ha caducado. Vuelve a abrir el sitio e inténtalo de nuevo. Puedes seguir pidiendo por WhatsApp.');
  if (/token=|error=/.test(location.hash)) {
    history.replaceState(null, '', location.pathname + location.search);
    open();
  }
}
