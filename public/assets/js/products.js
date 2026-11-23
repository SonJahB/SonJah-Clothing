// Shared catalogue client backed by the Node API.
(() => {
  function endpoint(path) {
    const apiBaseUrl = String(window.SONJAH_CONFIG?.apiBaseUrl || "").trim();
    if (apiBaseUrl) {
      let base;
      try {
        base = new URL(apiBaseUrl);
      } catch {
        throw new Error("The backend URL in assets/js/config.js is invalid.");
      }
      if (!["http:", "https:"].includes(base.protocol) || base.pathname !== "/" || base.search || base.hash) {
        throw new Error("Set apiBaseUrl to the backend origin only, such as https://api.example.com.");
      }
      return new URL(path, base.origin).href;
    }
    if (window.location.hostname.endsWith(".github.io")) {
      throw new Error("The catalogue backend URL is not configured. Set apiBaseUrl in assets/js/config.js.");
    }
    return new URL(path, window.location.origin).href;
  }

  async function request(path, options = {}) {
    const headers = { ...options.headers };
    if (options.method === "PUT") {
      let key = sessionStorage.getItem("sonjah-admin-key");
      if (!key) {
        key = window.prompt("Enter the admin API key to save catalogue changes:");
        if (!key) throw new Error("An admin API key is required to save changes.");
        sessionStorage.setItem("sonjah-admin-key", key);
      }
      headers.Authorization = `Bearer ${key}`;
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(path, {
      ...options,
      headers
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) sessionStorage.removeItem("sonjah-admin-key");
      throw new Error(result.error || `Request failed (${response.status})`);
    }
    return result;
  }

  async function list() {
    return request(endpoint("/api/products"));
  }

  async function save(products) {
    return request(endpoint("/api/products"), { method: "PUT", body: JSON.stringify(products) });
  }

  function formatPrice(price) {
    return `${price} Robux`;
  }

  window.MarketplaceProducts = { list, save, formatPrice };
})();
