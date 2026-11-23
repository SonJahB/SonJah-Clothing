// Shared catalogue client backed by the Node API.
(() => {
  async function request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (options.method === "PUT") {
      let key = sessionStorage.getItem("sonjah-admin-key");
      if (!key) {
        key = window.prompt("Enter the admin API key to save catalogue changes:");
        if (!key) throw new Error("An admin API key is required to save changes.");
        sessionStorage.setItem("sonjah-admin-key", key);
      }
      headers.Authorization = `Bearer ${key}`;
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
    return request("/api/products");
  }

  async function save(products) {
    return request("/api/products", { method: "PUT", body: JSON.stringify(products) });
  }

  function formatPrice(price) {
    return `${price} Robux`;
  }

  window.MarketplaceProducts = { list, save, formatPrice };
})();
