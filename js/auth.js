
/**
 * Kiki's Pizza - Netlify Identity
 * Autenticación de clientes.
 */

import {
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
let initialized = false;

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

export async function initializeAuth() {
  if (initialized) return currentUser;

  try {
    await handleAuthCallback();

    const user = await getUser();
    notifyAuthChange(user);

    subscribeIdentity((event, updatedUser) => {
      notifyAuthChange(updatedUser);

      authEvents.dispatchEvent(
        new CustomEvent("auth:event", {
          detail: { event, user: updatedUser }
        })
      );
    });

    initialized = true;
    return currentUser;
  } catch (error) {
    console.error("Error inicializando Netlify Identity:", error);
    notifyAuthChange(null);
    return null;
  }
}
