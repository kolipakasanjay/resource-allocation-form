/**
 * PMIPCC App Orchestrator
 * Tab Routing, Global Toast Alerts & Admin Authentication
 */

(function () {
  const AUTH_STORAGE_KEY = "pmipcc_admin_session_auth_v1";

  const AdminAuth = {
    validCredentials: [
      { username: "admin", password: "admin123" },
      { username: "admin@pmi-pcc.org", password: "admin123" },
      { username: "pmipcc", password: "admin123" },
      { username: "admin", password: "admin" }
    ],

    isAuthenticated() {
      try {
        return sessionStorage.getItem(AUTH_STORAGE_KEY) === "true" || localStorage.getItem(AUTH_STORAGE_KEY) === "true";
      } catch (e) {
        return false;
      }
    },

    getLoggedUser() {
      try {
        return sessionStorage.getItem(AUTH_STORAGE_KEY + "_user") || localStorage.getItem(AUTH_STORAGE_KEY + "_user") || "admin";
      } catch (e) {
        return "admin";
      }
    },

    login(username, password, remember = true) {
      const u = (username || "").trim().toLowerCase();
      const p = (password || "").trim();

      const match = this.validCredentials.some(cred => 
        cred.username.toLowerCase() === u && cred.password === p
      );

      if (match) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(AUTH_STORAGE_KEY, "true");
        storage.setItem(AUTH_STORAGE_KEY + "_user", username.trim());
        return { success: true };
      }

      return {
        success: false,
        message: "Invalid credentials. Please enter a valid username & password (default: admin / admin123)."
      };
    },

    logout() {
      try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_STORAGE_KEY + "_user");
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY + "_user");
      } catch (e) {}
    }
  };

  // Ensure page is firmly anchored at the top on initial load & prevent auto-scrolling (Matching PMIPCC_FORM)
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

  function anchorToTop() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 40);
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 120);
  }

  const AppRouter = {
    currentRoute: "form",
    currentAdminSubtab: "reports",
    pendingAdminSubtab: null,

    init() {
      this.setupAdminAuth();

      // Header brand logo click: logs out admin if authenticated and navigates to Resource Form
      const brandLogoLink = document.getElementById("brand-home-link") || document.querySelector(".brand-wrapper");
      if (brandLogoLink) {
        brandLogoLink.addEventListener("click", (e) => {
          e.preventDefault();
          if (AdminAuth.isAuthenticated()) {
            AdminAuth.logout();
            const topLogoutBtn = document.getElementById("btn-top-admin-logout");
            if (topLogoutBtn) topLogoutBtn.style.display = "none";
            this.showAdminLogin();
            window.AppNotifications?.toast("You have been signed out from the Admin Panel.", "info");
          }
          this.navigate("form");
        });
      }

      // Top nav tab buttons (Resource Form, Admin Panel)
      const topTabButtons = document.querySelectorAll(".app-header .pmipcc-nav-tabs .pmipcc-tab-btn");
      topTabButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const target = btn.getAttribute("data-target");
          this.navigate(target);
        });
      });

      // Admin subtab buttons (Reports & Downloads, Portfolios & Persons)
      const adminSubButtons = document.querySelectorAll(".admin-subtabs-nav .pmipcc-tab-btn");
      adminSubButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const subTarget = btn.getAttribute("data-admin-target");
          this.switchAdminSubtab(subTarget);
        });
      });

      // In-page navigation links (e.g. data-navigate="manage", data-navigate="reports", data-navigate="admin")
      document.querySelectorAll("[data-navigate]").forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const target = link.getAttribute("data-navigate");
          this.navigate(target);
        });
      });

      // Handle URL hash if provided
      if (window.location.hash) {
        const hash = window.location.hash.replace("#", "");
        if (["form", "admin", "reports", "manage"].includes(hash)) {
          this.navigate(hash, false);
        }
      }
    },

    navigate(routeName, updateHash = true) {
      if (!["form", "admin", "reports", "manage", "people"].includes(routeName)) return;

      let topRoute = routeName;
      let adminSub = null;

      if (routeName === "reports" || routeName === "manage") {
        topRoute = "admin";
        adminSub = routeName;
      } else if (routeName === "people") {
        topRoute = "admin";
        adminSub = "manage";
        setTimeout(() => window.ManagementController?.switchToPeopleTab(), 60);
      }

      this.currentRoute = topRoute;

      // Update Top Nav Tabs Active Class
      document.querySelectorAll(".app-header .pmipcc-nav-tabs .pmipcc-tab-btn").forEach(btn => {
        const target = btn.getAttribute("data-target");
        if (target === topRoute) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      // Toggle Top View Sections
      const viewForm = document.getElementById("view-form");
      const viewAdmin = document.getElementById("view-admin");

      if (topRoute === "form") {
        if (viewForm) viewForm.style.display = "block";
        if (viewAdmin) viewAdmin.style.display = "none";
        window.FormController?.renderAll();
      } else if (topRoute === "admin") {
        if (viewForm) viewForm.style.display = "none";
        if (viewAdmin) viewAdmin.style.display = "block";

        if (adminSub) {
          this.pendingAdminSubtab = adminSub;
        }

        // Authentication Gate for Admin Panel
        if (AdminAuth.isAuthenticated()) {
          this.showAdminContent();
        } else {
          this.showAdminLogin();
        }
      }

      if (updateHash && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", `#${routeName}`);
      }

      // Always reset scroll to the very top (firmly anchor at start)
      anchorToTop();
    },

    showAdminLogin() {
      const loginView = document.getElementById("admin-login-view");
      const contentView = document.getElementById("admin-content-view");
      if (loginView) loginView.style.display = "block";
      if (contentView) contentView.style.display = "none";

      const topLogoutBtn = document.getElementById("btn-top-admin-logout");
      if (topLogoutBtn) topLogoutBtn.style.display = "none";

      const errBox = document.getElementById("admin-login-error");
      if (errBox) errBox.style.display = "none";

      // Reset scroll position to start
      anchorToTop();

      // Only auto-focus on desktop with mouse to prevent mobile keyboard auto-scroll
      if (typeof window !== "undefined" && window.innerWidth > 768 && !("ontouchstart" in window)) {
        setTimeout(() => {
          document.getElementById("admin-username")?.focus();
        }, 120);
      }
    },

    showAdminContent(preferredSubtab = "reports") {
      const loginView = document.getElementById("admin-login-view");
      const contentView = document.getElementById("admin-content-view");
      if (loginView) loginView.style.display = "none";
      if (contentView) contentView.style.display = "block";

      const topLogoutBtn = document.getElementById("btn-top-admin-logout");
      if (topLogoutBtn) topLogoutBtn.style.display = "inline-flex";

      // Instantly start at the start (top: 0) without any scroll jumping
      anchorToTop();

      // Refresh all admin data, reports, directories fresh every time admin panel is opened
      this.refreshAdminPanel();

      const targetSub = this.pendingAdminSubtab || preferredSubtab || this.currentAdminSubtab || "reports";
      this.pendingAdminSubtab = null;
      this.switchAdminSubtab(targetSub, false);

      // Re-assert start at start across mobile and desktop
      anchorToTop();
    },

    refreshAdminPanel() {
      // 0. Synchronize real-time state with central server across mobile & laptop
      window.AppState?.syncWithServer?.();

      // 1. Refresh Reports filters and allocation register table
      window.ReportsController?.refreshFilterOptions?.();
      window.ReportsController?.renderAllReports?.();

      // 2. Refresh Portfolios and Persons tables & summary stats
      window.ManagementController?.renderPortfoliosTable?.();
      window.ManagementController?.renderPeopleTable?.();
      window.ManagementController?.updateSummaryStats?.();
    },

    setupAdminAuth() {
      // Sync initial top logout button visibility
      const topLogoutBtn = document.getElementById("btn-top-admin-logout");
      if (topLogoutBtn) {
        topLogoutBtn.style.display = AdminAuth.isAuthenticated() ? "inline-flex" : "none";
      }

      // 1. Login Form Submit
      const loginForm = document.getElementById("admin-login-form");
      if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
          e.preventDefault();

          // Immediately blur active inputs to dismiss mobile keyboard and prevent browser auto-scroll down
          if (document.activeElement && typeof document.activeElement.blur === "function") {
            document.activeElement.blur();
          }

          const uInput = document.getElementById("admin-username");
          const pInput = document.getElementById("admin-password");
          const rememberInput = document.getElementById("admin-remember-me");
          const errBox = document.getElementById("admin-login-error");

          const enteredUser = (uInput.value || "admin").trim();
          const res = AdminAuth.login(enteredUser, pInput.value, rememberInput ? rememberInput.checked : true);
          if (res.success) {
            if (errBox) errBox.style.display = "none";

            uInput.value = "";
            pInput.value = "";
            window.AppNotifications?.toast(`Welcome, ${enteredUser}! Signed in to Admin Panel.`, "success");
            
            // Open directly to Reports & Downloads
            this.showAdminContent("reports");
          } else {
            if (errBox) {
              errBox.textContent = res.message;
              errBox.style.display = "block";
            }
            window.AppNotifications?.toast("Authentication failed. Please check username and password.", "error");
          }
        });
      }

      // 2. Auto-Fill Demo Credentials Button
      const autofillBtn = document.getElementById("btn-autofill-admin-creds");
      if (autofillBtn) {
        autofillBtn.addEventListener("click", () => {
          const u = document.getElementById("admin-username");
          const p = document.getElementById("admin-password");
          if (u) u.value = "admin";
          if (p) p.value = "admin123";
          window.AppNotifications?.toast("Default credentials filled (admin / admin123)", "info");
        });
      }

      // 3. Toggle Password Visibility
      const togglePassBtn = document.getElementById("btn-toggle-admin-password");
      if (togglePassBtn) {
        togglePassBtn.addEventListener("click", () => {
          const p = document.getElementById("admin-password");
          if (p) {
            if (p.type === "password") {
              p.type = "text";
              togglePassBtn.textContent = "Hide Password";
            } else {
              p.type = "password";
              togglePassBtn.textContent = "Show Password";
            }
          }
        });
      }

      // 4. Return to Form Link
      const backBtn = document.getElementById("btn-admin-back-to-form");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          this.navigate("form");
        });
      }

      // 5. Logout Handlers (Both Top Header and Subnav)
      const handleLogout = () => {
        AdminAuth.logout();
        window.AppNotifications?.toast("You have been signed out from the Admin Panel.", "info");
        this.navigate("admin");
        this.showAdminLogin();
      };

      const logoutBtn = document.getElementById("btn-admin-logout");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
      }

      if (topLogoutBtn) {
        topLogoutBtn.addEventListener("click", handleLogout);
      }
    },

    switchAdminSubtab(subTarget, updateHash = true) {
      if (!["reports", "manage"].includes(subTarget)) subTarget = "reports";
      this.currentAdminSubtab = subTarget;

      // Update subtab buttons active state
      document.querySelectorAll(".admin-subtabs-nav .pmipcc-tab-btn").forEach(btn => {
        const target = btn.getAttribute("data-admin-target");
        if (target === subTarget) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      // Toggle admin sub-panes
      const paneReports = document.getElementById("admin-pane-reports");
      const paneManage = document.getElementById("admin-pane-manage");

      if (paneReports) paneReports.style.display = subTarget === "reports" ? "block" : "none";
      if (paneManage) paneManage.style.display = subTarget === "manage" ? "block" : "none";

      if (subTarget === "manage") {
        window.ManagementController?.renderPortfoliosTable();
        window.ManagementController?.renderPeopleTable();
        window.ManagementController?.updateSummaryStats();
      } else {
        window.ReportsController?.refreshFilterOptions();
        window.ReportsController?.renderAllReports();
      }

      // Reset scroll position to the very start whenever subtab changes (firmly anchor at top)
      anchorToTop();

      if (updateHash && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", `#${subTarget}`);
      }
    }
  };

  // Toast Notification System
  const AppNotifications = {
    toast(message, type = "info") {
      const container = document.getElementById("toast-container");
      if (!container) return;

      const toast = document.createElement("div");
      
      const colors = {
        success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", icon: "✓" },
        error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", icon: "✕" },
        info: { bg: "#eef6fc", border: "#bcd8ec", text: "#0065bd", icon: "ℹ" },
        warning: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", icon: "⚠" }
      };

      const c = colors[type] || colors.info;

      toast.style.cssText = `
        background: ${c.bg};
        border: 1.5px solid ${c.border};
        color: ${c.text};
        padding: 0.75rem 1rem;
        border-radius: var(--radius-md);
        box-shadow: 0 4px 12px rgba(0, 51, 102, 0.12);
        display: flex;
        align-items: center;
        gap: 0.65rem;
        font-size: 0.825rem;
        font-weight: 600;
        max-width: 420px;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(8px);
        transition: all 0.25s ease;
      `;

      toast.innerHTML = `
        <span style="font-weight: 800; font-size: 0.95rem;">${c.icon}</span>
        <span style="flex: 1; line-height: 1.35;">${message}</span>
        <button style="background: none; border: none; color: inherit; cursor: pointer; opacity: 0.7; padding: 0 0.25rem;">✕</button>
      `;

      toast.querySelector("button").addEventListener("click", () => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 200);
      });

      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
      });

      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.opacity = "0";
          toast.style.transform = "translateY(8px)";
          setTimeout(() => toast.remove(), 200);
        }
      }, 4000);
    }
  };

  window.AdminAuth = AdminAuth;
  window.AppNotifications = AppNotifications;
  window.AppRouter = AppRouter;

  document.addEventListener("DOMContentLoaded", () => {
    AppRouter.init();

    window.FormController?.init();
    window.ManagementController?.init();
    window.ReportsController?.init();
  });
})();

