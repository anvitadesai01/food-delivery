document.addEventListener("DOMContentLoaded", () => {
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/;

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
    if (window.showAppToast) {
      window.showAppToast({ title: message, icon: "success" });
      return;
    }
  };

  const showFieldValidation = (element, message) => {
    if (!element) return false;
    element.focus();
    element.setCustomValidity(message);
    element.reportValidity();
    setTimeout(() => element.setCustomValidity(""), 0);
    showError("errorMsg", message);
    return false;
  };

  const validateName = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Name is required";
    if (trimmed.length < 2) return "Name must be at least 2 characters";
    return "";
  };

  const validateEmail = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Email is required";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed)) return "Invalid email format";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (!passwordPattern.test(value)) {
      return "Password must be 8-30 characters with uppercase, lowercase, number, and special character";
    }
    return "";
  };

  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    const email = emailEl.value.trim();
    const password = passwordEl.value;

    const emailError = validateEmail(email);
    if (emailError) return showFieldValidation(emailEl, emailError);

    const passwordError = validatePassword(password);
    if (passwordError) return showFieldValidation(passwordEl, passwordError);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const data = await res.json();

      if (!data.success) {
        showError("errorMsg", data.message || "Invalid credentials");
        return;
      }

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      showSuccess("Login successful! 🎉");
      
      setTimeout(() => {
        window.location.href = data?.data?.redirectTo || "/";
      }, 1000);
    } catch (err) {
      showError("errorMsg", "Something went wrong. Please try again.");
    }
  });

  document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameEl = document.getElementById("name");
    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    const confirmPasswordEl = document.getElementById("confirmPassword");

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const confirmPassword = confirmPasswordEl.value;

    const nameError = validateName(name);
    if (nameError) return showFieldValidation(nameEl, nameError);

    const emailError = validateEmail(email);
    if (emailError) return showFieldValidation(emailEl, emailError);

    const passwordError = validatePassword(password);
    if (passwordError) return showFieldValidation(passwordEl, passwordError);

    if (!confirmPassword) {
      return showFieldValidation(confirmPasswordEl, "Confirm password is required");
    }

    if (confirmPassword !== password) {
      return showFieldValidation(confirmPasswordEl, "Passwords do not match");
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: email.toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        showError("errorMsg", data.message || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      showSuccess("Account created! 🎉");
      
      setTimeout(() => {
        window.location.href = data?.data?.redirectTo || "/";
      }, 1000);
    } catch (err) {
      showError("errorMsg", "Something went wrong. Please try again.");
    }
  });

});
