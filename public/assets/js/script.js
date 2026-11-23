let products = [];

// Replace this fallback with each item's purchase URL, or set purchaseUrl on a product.
const DEFAULT_PURCHASE_URL = "https://www.roblox.com/catalog/";

const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#search-input");
const categoryFilter = document.querySelector("#category-filter");
const sortFilter = document.querySelector("#sort-filter");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const detailSection = document.querySelector("#product-details");
const detailContent = document.querySelector("#detail-content");
const pageIds = new Set(["home", "catalogue", "product-details"]);

function showPage(pageId) {
  const activePage = pageIds.has(pageId) ? pageId : "home";
  document.querySelectorAll(".page").forEach((page) => {
    const isActive = page.id === activePage;
    page.hidden = !isActive;
    if (isActive) {
      page.classList.remove("page-enter");
      void page.offsetWidth;
      page.classList.add("page-enter");
    }
  });
  document.querySelectorAll("[data-route-link]").forEach((link) => {
    if (link.dataset.routeLink === activePage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  window.scrollTo(0, 0);
}

function navigateTo(pageId) {
  if (window.location.hash === `#${pageId}`) {
    showPage(pageId);
  } else {
    window.location.hash = pageId;
  }
}

const formatPrice = window.MarketplaceProducts.formatPrice;

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";

  const imageButton = document.createElement("button");
  imageButton.type = "button";
  imageButton.className = "product-image-button";
  imageButton.setAttribute("aria-label", `View details for ${product.name}`);
  imageButton.addEventListener("click", () => showDetails(product));
  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.imageAlt;
  image.loading = "lazy";
  imageButton.append(image);

  const body = document.createElement("div");
  body.className = "product-card-body";

  const title = document.createElement("h3");
  title.textContent = product.name;
  const category = document.createElement("p");
  category.className = "product-meta";
  category.textContent = product.category;
  body.append(category);
  if (product.availability === "sold-out") {
    const status = document.createElement("p");
    status.className = "sold-out-label";
    status.textContent = "Sold out";
    body.append(status);
  }
  body.append(title);
  article.append(imageButton, body);
  return article;
}

function getVisibleProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const visible = products.filter((product) => {
    const matchesQuery = `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query);
    return matchesQuery && (category === "all" || product.category === category);
  });

  if (sortFilter.value === "price-asc") visible.sort((a, b) => a.price - b.price);
  if (sortFilter.value === "price-desc") visible.sort((a, b) => b.price - a.price);
  if (sortFilter.value === "name") visible.sort((a, b) => a.name.localeCompare(b.name));
  return visible;
}

function renderProducts() {
  const visible = getVisibleProducts();
  productGrid.replaceChildren(...visible.map(createProductCard));
  resultsCount.textContent = `${visible.length} ${visible.length === 1 ? "item" : "items"}`;
  emptyState.hidden = visible.length > 0;
}

function showDetails(product) {
  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.imageAlt;
  const info = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = product.name;
  const category = document.createElement("p");
  category.className = "product-meta";
  category.textContent = product.category;
  const price = document.createElement("p");
  price.className = "detail-price";
  price.textContent = formatPrice(product.price);
  const description = document.createElement("p");
  description.textContent = product.description;
  info.append(title, category, price, description);
  if (product.availability === "sold-out") {
    const status = document.createElement("p");
    status.className = "sold-out-label";
    status.textContent = "Sold out";
    info.append(status);
  } else {
    const payLink = document.createElement("a");
    payLink.className = "button";
    payLink.href = product.purchaseUrl || DEFAULT_PURCHASE_URL;
    payLink.target = "_blank";
    payLink.rel = "noopener noreferrer";
    payLink.textContent = "Pay";
    info.append(payLink);
  }
  detailContent.replaceChildren(image, info);
  detailSection.hidden = false;
  navigateTo("product-details");
}

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
sortFilter.addEventListener("change", renderProducts);
document.querySelector("#clear-filters").addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "all";
  sortFilter.value = "featured";
  renderProducts();
  searchInput.focus();
});
document.querySelector("#close-details").addEventListener("click", () => {
  navigateTo("catalogue");
});
window.addEventListener("hashchange", () => {
  const requestedPage = window.location.hash.slice(1);
  if (pageIds.has(requestedPage)) showPage(requestedPage);
});

(async () => {
  const initialPage = window.location.hash.slice(1);
  showPage(pageIds.has(initialPage) ? initialPage : "home");
  try {
    products = await window.MarketplaceProducts.list();
    renderProducts();
  } catch (error) {
    console.error("Could not load the catalogue.", error);
    productGrid.textContent = "The catalogue is temporarily unavailable. Please try again later.";
  }
})();
