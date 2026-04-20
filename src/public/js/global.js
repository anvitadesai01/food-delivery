const publicRoutes = ["/", "/login", "/register", "/restaurants", "/menu"];
let authStatePromise = null;

const getToken = () => localStorage.getItem("token");

const isLoggedIn = () => !!getToken();

const swalBase = {
  background: "#ffffff",
  color: "#1a1a1a",
  confirmButtonColor: "#fc8019",
  cancelButtonColor: "#6b7280",
  customClass: {
    popup: "app-swal-popup",
    confirmButton: "app-swal-confirm",
    cancelButton: "app-swal-cancel",
  },
  buttonsStyling: true,
};

window.showAppAlert = async function ({
  title = "Notice",
  text = "",
  icon = "info",
  timer,
  confirmButtonText = "Okay",
} = {}) {
  if (window.Swal) {
    return window.Swal.fire({
      ...swalBase,
      title,
      text,
      icon,
      timer,
      confirmButtonText,
      timerProgressBar: Boolean(timer),
    });
  }

  window.alert(text || title);
  return { isConfirmed: true };
};

window.showAppToast = async function ({
  title = "Done",
  icon = "success",
  timer = 2200,
} = {}) {
  if (window.Swal) {
    return window.Swal.fire({
      ...swalBase,
      title,
      icon,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
    });
  }

  return window.showAppAlert({ title, icon, timer });
};

window.confirmAppAction = async function ({
  title = "Are you sure?",
  text = "Please confirm this action.",
  icon = "warning",
  confirmButtonText = "Yes",
  cancelButtonText = "Cancel",
} = {}) {
  if (window.Swal) {
    const result = await window.Swal.fire({
      ...swalBase,
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    });

    return result.isConfirmed;
  }

  return window.confirm(text || title);
};

window.logout = async function () {
  const token = getToken();

  try {
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error(error);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  authStatePromise = null;
  window.location.replace("/login");
};

window.getCurrentUser = async function () {
  const token = getToken();

  if (!token) {
    return null;
  }

  if (!authStatePromise) {
    authStatePromise = fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        const data = await res.json();
        const user = data?.data?.user || null;

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }

        return user;
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return null;
      });
  }

  return authStatePromise;
};

const protectRoute = async () => {
  const path = window.location.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isRestaurantDetailsRoute = /^\/restaurants\/[^/]+$/.test(path);
  const requiresAuth =
    (!publicRoutes.includes(path) && !isRestaurantDetailsRoute) ||
    path.startsWith("/orders") ||
    path.startsWith("/cart") ||
    isAdminRoute;

  if (!requiresAuth) {
    if ((path === "/login" || path === "/register") && isLoggedIn()) {
      const user = await window.getCurrentUser();
      if (user) {
        window.location.replace(user.role === "admin" ? "/admin/dashboard" : "/");
      }
    }
    return;
  }

  if (!isLoggedIn()) {
    window.location.replace("/login");
    return;
  }

  const user = await window.getCurrentUser();

  if (!user) {
    window.location.replace("/login");
    return;
  }

  if (isAdminRoute && user.role !== "admin") {
    window.location.replace("/");
  }
};

window.addEventListener("pageshow", async (event) => {
  const isBackNav =
    event.persisted ||
    (window.performance && window.performance.navigation && window.performance.navigation.type === 2);

  if (isBackNav && !isLoggedIn()) {
    window.location.replace("/login");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  protectRoute();
});

const getCartCount = async () => {
  try {
    const token = getToken();
    const user = await window.getCurrentUser();

    if (!token || !user || user.role === "admin") return 0;

    const res = await fetch("/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!data.success || !data.data.items) return 0;

    return data.data.items.reduce((acc, item) => acc + item.quantity, 0);
  } catch (err) {
    console.error(err);
    return 0;
  }
};
