const menuToggle = document.querySelector("#menu-toggle");
const pageSidebar = document.querySelector("#page-sidebar");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");

function setSidebarOpen(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close pages menu" : "Open pages menu");
  pageSidebar.setAttribute("aria-hidden", String(!isOpen));
  pageSidebar.inert = !isOpen;
  document.body.classList.toggle("sidebar-open", isOpen);

  if (isOpen) {
    sidebarBackdrop.hidden = false;
    pageSidebar.classList.add("is-open");
  } else {
    pageSidebar.classList.remove("is-open");
    sidebarBackdrop.hidden = true;
    menuToggle.focus();
  }
}

menuToggle.addEventListener("click", () => {
  setSidebarOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});
sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
pageSidebar.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setSidebarOpen(false));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    setSidebarOpen(false);
  }
});
