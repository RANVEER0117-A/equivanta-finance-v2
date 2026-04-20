const API_BASE = "http://127.0.0.1:8000";

// ── Theme ─────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem("sa_theme") || "light";
  applyTheme(saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  const next = cur === "dark" ? "light" : "dark";

  applyTheme(next);
  localStorage.setItem("sa_theme", next);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  updateFooterLabel(theme);
}

function updateFooterLabel(theme) {
  const lbl = document.getElementById("footerThemeLabel");
  if (!lbl) return;

  lbl.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

// ── Navbar Search ─────────────────────────────────────
function initNavSearch() {
  const input = document.getElementById("navSearchInput");
  const dropdown = document.getElementById("navSearchDropdown");

  if (!input || !dropdown) return;

  let timer = null;

  input.addEventListener("input", () => {
    clearTimeout(timer);

    const q = input.value.trim();

    if (q.length < 2) {
      hideDropdown(dropdown);
      return;
    }

    timer = setTimeout(() => {
      fetchNavSuggestions(q, dropdown);
    }, 250);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideDropdown(dropdown);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".navbar-search-wrap")) {
      hideDropdown(dropdown);
    }
  });
}

// ── API CALL ──────────────────────────────────────────
async function fetchNavSuggestions(q, dropdown) {
  try {
    const res = await fetch(
      `${API_BASE}/autocomplete?q=${encodeURIComponent(q)}`
    );

    if (!res.ok) throw new Error("API failed");

    const data = await res.json();
    renderNavDropdown(data, dropdown);

  } catch (err) {
    console.error("Autocomplete error:", err);
    hideDropdown(dropdown);
  }
}

// ── Render dropdown ───────────────────────────────────
function renderNavDropdown(results, dropdown) {
  dropdown.innerHTML = "";

  if (!Array.isArray(results) || results.length === 0) {
    dropdown.innerHTML = `<div class="nav-ac-empty">No stocks found</div>`;
    dropdown.classList.add("show");
    return;
  }

  results.slice(0, 7).forEach((item) => {
    const div = document.createElement("div");
    div.className = "nav-ac-item";

    div.innerHTML = `
      <span class="nav-ac-name">${escapeHtml(item.name || "")}</span>
      <span class="nav-ac-sym">${escapeHtml(item.symbol || "")}</span>
    `;

    div.addEventListener("click", () => {
      if (item.symbol) {
        window.location.href = `/stock/${encodeURIComponent(item.symbol)}`;
      }
    });

    dropdown.appendChild(div);
  });

  dropdown.classList.add("show");
}

// ── Hide dropdown ─────────────────────────────────────
function hideDropdown(dropdown) {
  if (!dropdown) return;
  dropdown.classList.remove("show");
  dropdown.innerHTML = "";
}

// ── Safe HTML escape ──────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ── Bootstrap ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavSearch();

  const btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", toggleTheme);
});
