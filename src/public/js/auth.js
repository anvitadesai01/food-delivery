document.addEventListener("DOMContentLoaded", () => {

  const showError = (elementId, message) => {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
      setTimeout(() => {
        errorEl.style.display = "none";
      }, 5000);
    }
  };

  const showSuccess = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        showError("errorMsg", data.message || "Invalid credentials");
        return;
      }

      localStorage.setItem("token", data.data.token);
      showSuccess("Login successful! 🎉");
      
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      showError("errorMsg", "Something went wrong. Please try again.");
    }
  });

  document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        showError("errorMsg", data.message || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.data.token);
      showSuccess("Account created! 🎉");
      
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      showError("errorMsg", "Something went wrong. Please try again.");
    }
  });

});
