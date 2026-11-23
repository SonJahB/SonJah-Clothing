const form = document.querySelector("#product-form");
const inventoryList = document.querySelector("#inventory-list");
const productCount = document.querySelector("#product-count");
const productMessage = document.querySelector("#product-message");
const storageMessage = document.querySelector("#storage-message");
const formTitle = document.querySelector("#product-form-title");
const submitButton = document.querySelector("#save-product");
const cancelButton = document.querySelector("#cancel-edit");

let products = [];
const formatPrice = window.MarketplaceProducts.formatPrice;

function isWebUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function persistProducts(updatedProducts, message) {
  try {
    products = await window.MarketplaceProducts.save(updatedProducts);
    storageMessage.textContent = "Saved to the shared catalogue.";
    productMessage.textContent = message;
    renderInventory();
    return true;
  } catch (error) {
    console.error("Could not save the catalogue.", error);
    storageMessage.textContent = error.message;
    return false;
  }
}

function renderInventory() {
  productCount.textContent = String(products.length);
  inventoryList.replaceChildren();

  products.forEach((product) => {
    const row = document.createElement("tr");
    const itemCell = document.createElement("td");
    const item = document.createElement("div");
    item.className = "inventory-item";
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = "";
    image.loading = "lazy";
    const itemInfo = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = product.name;
    const category = document.createElement("span");
    category.textContent = product.category;
    itemInfo.append(name, category);
    item.append(image, itemInfo);
    itemCell.append(item);

    const priceCell = document.createElement("td");
    priceCell.textContent = formatPrice(product.price);
    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    const isAvailable = product.availability !== "sold-out";
    status.className = `status-label ${isAvailable ? "is-available" : "is-sold-out"}`;
    status.textContent = isAvailable ? "Available" : "Sold out";
    statusCell.append(status);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "inventory-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "text-button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => startEditing(product));
    const availabilityButton = document.createElement("button");
    availabilityButton.type = "button";
    availabilityButton.className = "text-button";
    availabilityButton.textContent = isAvailable ? "Mark sold out" : "Mark available";
    availabilityButton.addEventListener("click", () => {
      const updatedProducts = products.map((entry) => entry.id === product.id
        ? { ...entry, availability: isAvailable ? "sold-out" : "available" }
        : entry);
    persistProducts(updatedProducts, `${product.name} marked ${isAvailable ? "sold out" : "available"}.`);
    });
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "text-button delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      if (!window.confirm(`Delete “${product.name}” from the catalogue?`)) return;
      const updatedProducts = products.filter((entry) => entry.id !== product.id);
      persistProducts(updatedProducts, `${product.name} deleted.`).then((saved) => { if (saved && form.elements.id.value === product.id) resetForm(); });
    });
    actions.append(editButton, availabilityButton, deleteButton);
    actionsCell.append(actions);
    row.append(itemCell, priceCell, statusCell, actionsCell);
    inventoryList.append(row);
  });
}

function startEditing(product) {
  form.elements.id.value = product.id;
  form.elements.name.value = product.name;
  form.elements.price.value = product.price;
  form.elements.category.value = product.category;
  form.elements.description.value = product.description;
  form.elements.image.value = product.image;
  form.elements.purchaseUrl.value = product.purchaseUrl || "";
  form.elements.availability.value = product.availability || "available";
  formTitle.textContent = "Edit clothing item";
  submitButton.textContent = "Save changes";
  cancelButton.hidden = false;
  productMessage.textContent = `Editing ${product.name}.`;
  form.elements.name.focus();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  form.elements.availability.value = "available";
  formTitle.textContent = "Add clothing item";
  submitButton.textContent = "Add item";
  cancelButton.hidden = true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const name = String(formData.get("name")).trim();
  const description = String(formData.get("description")).trim();
  const imageUrl = String(formData.get("image")).trim();
  const purchaseUrl = String(formData.get("purchaseUrl")).trim();
  if (!name || !description) {
    productMessage.textContent = "Enter a clothing name and description.";
    return;
  }
  if (!isWebUrl(imageUrl) || !isWebUrl(purchaseUrl)) {
    productMessage.textContent = "Image and purchase links must use an http or https URL.";
    return;
  }
  const id = formData.get("id") || `item-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`;
  const product = {
    id,
    name,
    price: Number(formData.get("price")),
    category: String(formData.get("category")),
    description,
    image: imageUrl,
    imageAlt: `Image of ${name}`,
    purchaseUrl,
    availability: String(formData.get("availability"))
  };

  const isEditing = products.some((entry) => entry.id === id);
  const updatedProducts = isEditing
    ? products.map((entry) => entry.id === id ? product : entry)
    : [...products, product];
  persistProducts(updatedProducts, isEditing ? `${name} updated.` : `${name} added.`).then((saved) => { if (saved) resetForm(); });
});

cancelButton.addEventListener("click", () => {
  resetForm();
  productMessage.textContent = "Edit cancelled.";
});

(async () => {
  try {
    products = await window.MarketplaceProducts.list();
    storageMessage.textContent = "Connected to the shared catalogue.";
    renderInventory();
  } catch (error) {
    console.error("Could not load the catalogue.", error);
    storageMessage.textContent = "Could not connect to the backend. Start the server and reload this page.";
    productMessage.textContent = error.message;
  }
})();
