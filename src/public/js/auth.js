document.addEventListener("DOMContentLoaded", () => {

  console.log("Auth JS Loaded ✅");

  // LOGIN
  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Login submit triggered ✅");

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Response:", data);

      if (!data.success) {
        errorMsg.textContent = data.message;
        return;
      }

      localStorage.setItem("token", data.data.token);
      console.log("Token stored ✅");

      window.location.href = "/";
    } catch (err) {
      errorMsg.textContent = "Something went wrong";
    }
  });

  // REGISTER
  document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");

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
        errorMsg.textContent = data.message;
        return;
      }

      localStorage.setItem("token", data.data.token);
      window.location.href = "/";
    } catch (err) {
      errorMsg.textContent = "Something went wrong";
    }
  });

});