if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", {
      scope: "/",
      updateViaCache: "none"
    }).catch(() => {
      console.warn("No se pudo activar el acceso sin conexión de Kiki's Pizza.");
    });
  });
}
