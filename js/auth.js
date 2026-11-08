
/**
 * Kiki's Pizza - Netlify Identity
 * Registro, autenticación y gestión de sesiones.
 */

import {
  signup,
  login,
  logout,
  getUser,
  recoverPassword,
  handleAuthCallback
} from "@netlify/identity";

const AUTH_ENDPOINT = "https://kikispizza.netlify.app/.netlify/identity";

let currentUser = null;

const authEvents = new EventTarget();

function notifyAuthChange(user) {
  currentUser = user;

  authEvents.dispatchEvent(
    new CustomEvent("auth:change", {
      detail: { user }
    })
  );
}

export function onAuthChange(callback) {
  authEvents.addEventListener("auth:change", event => {
    callback(event.detail.user);
  });

  callback(currentUser);
}

export function getCurrentUser() {
  return currentUser;
}

export async function register({ name, email, password }) {
  try {
    const user = await signup({
      email: email.trim(),
      password,
      data: { full_name: name.trim() }
    });

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
    const user = await login({
      email: email.trim(),
      password
    });

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
    await recoverPassword(email.trim());

    return {
      success: true,
      message: "Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña."
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "No se pudo procesar la solicitud."
    };
  }
}

export async function initializeAuth() {
  try {
    await handleAuthCallback();

    const user = await getUser();

    notifyAuthChange(user || null);

    return user || null;
  } catch (error) {
    console.error("Error inicializando Identity:", error);
    notifyAuthChange(null);
    return null;
  }
}

export { AUTH_ENDPOINT };
