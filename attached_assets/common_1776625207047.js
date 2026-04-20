// ── Theme (Dark / Light mode) ──────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem("sa_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateFooterLabel(saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("sa_theme", next);
  updateFooterLabel(next);
}

function updateFooterLabel(theme) {
  const lbl = document.getElementById("footerThemeLabel");
  if (lbl) lbl.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

// ── Navbar search autocomplete ─────────────────────────────────────────────
function initNavSearch() {
  const input = document.getElementById("navSearchInput");
  const dropdown = document.getElementById("navSearchDropdown");
  if (!input || !dropdown) return;

  let timer;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { dropdown.classList.remove("show"); return; }
    timer = setTimeout(() => fetchNavSuggestions(q, dropdown), 260);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") dropdown.classList.remove("show");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".navbar-search-wrap")) {
      dropdown.classList.remove("show");
    }
  });
}

async function fetchNavSuggestions(q, dropdown) {
  try {
    const res = await fetch(`/autocomplete?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    renderNavDropdown(data, dropdown);
  } catch (_) {
    dropdown.classList.remove("show");
  }
}

function renderNavDropdown(results, dropdown) {
  dropdown.innerHTML = "";
  if (!results || results.length === 0) {
    dropdown.innerHTML = '<div class="nav-ac-empty">No Indian stocks found</div>';
    dropdown.classList.add("show");
    return;
  }
  results.forEach((item) => {
    const div = document.createElement("div");
    div.className = "nav-ac-item";
    div.innerHTML = `
      <span class="nav-ac-name">${escHtml(item.name)}</span>
      <span class="nav-ac-sym">${escHtml(item.symbol)}</span>
    `;
    div.addEventListener("click", () => {
      window.location.href = `/stock/${encodeURIComponent(item.symbol)}`;
    });
    dropdown.appendChild(div);
  });
  dropdown.classList.add("show");
}

function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavSearch();

  const navBtn = document.getElementById("themeToggle");
  if (navBtn) navBtn.addEventListener("click", toggleTheme);
});
