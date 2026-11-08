
/**
 * Kiki's Pizza - Netlify Identity
 * Autenticación de clientes.
 */

import {
  acceptInvite,
  getSettings,
  oauthLogin,
  signup,
  login,
  logout,
  getUser,
  handleAuthCallback,
  requestPasswordRecovery,
  updateUser,
  onAuthChange as subscribeIdentity
} from "https://esm.sh/@netlify/identity@2.0.1";

let currentUser = null;
let initialization;

export { getSettings, oauthLogin };

export async function joinInvitation(token, password) {
  try {
    const user = await acceptInvite(token, password);
    notifyAuthChange(user);
    return { success: true, user };
  } catch {
    return { success: false, message: "No se pudo aceptar la invitación. Solicita un nuevo enlace e inténtalo otra vez." };
  }
}

const authEvents = new EventTarget();

function notifyAuthChange(user) {
  currentUser = user || null;

  authEvents.dispatchEvent(
    new CustomEvent("auth:change", {
      detail: { user: currentUser }
    })
  );
}

export function onAuthChange(callback) {
  const listener = event => callback(event.detail.user);

  authEvents.addEventListener("auth:change", listener);
  callback(currentUser);

  return () => {
    authEvents.removeEventListener("auth:change", listener);
  };
}

export function getCurrentUser() {
  return currentUser;
}

export async function register({ name, email, password }) {
  try {
    const user = await signup(
      email.trim(),
      password,
      { full_name: name.trim() }
    );

    notifyAuthChange(await getUser());
    return {
      success: true,
      user,
      message: "Revisa tu correo para confirmar tu cuenta."
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "No se pudo crear la cuenta."
    };
  }
}

export async function signIn(email, password) {
  try {
    const user = await login(email.trim(), password);
    notifyAuthChange(user);

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      message: error.message || "No se pudo iniciar sesión."
    };
  }
}

export async function signOut() {
  try {
    await logout();
    notifyAuthChange(null);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.message || "No se pudo cerrar sesión."
    };
  }
}

export async function resetPassword(email) {
  try {
    await requestPasswordRecovery(email.trim());

    return {
      success: true,
      message: "Revisa tu correo para recuperar tu contraseña."
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "No se pudo enviar el correo."
    };
  }
}

export async function setNewPassword(password) {
  try {
    await updateUser({ password });

    const user = await getUser();
    notifyAuthChange(user);

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      message: error.message || "No se pudo actualizar la contraseña."
    };
  }
}

export function initializeAuth() {
  if (initialization) return initialization;
  initialization = (async () => {
    subscribeIdentity((event, user) => {
      notifyAuthChange(user);
      authEvents.dispatchEvent(new CustomEvent("auth:event", { detail: { event, user } }));
    });
    const callback = await handleAuthCallback();
    notifyAuthChange(await getUser());
    return callback;
  })();
  return initialization;
}
