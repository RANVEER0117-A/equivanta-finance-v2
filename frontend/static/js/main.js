const API_BASE = "http://127.0.0.1:8000";

const searchInput = document.getElementById("searchInput");
const dropdown = document.getElementById("autocompleteDropdown");

let debounceTimer = null;

// ── Init only if elements exist ───────────────────────
if (searchInput && dropdown) {

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      hideDropdown();
      return;
    }

    debounceTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 250);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      hideDropdown();
    }
  });
}

// ── API CALL ──────────────────────────────────────────
async function fetchSuggestions(query) {
  try {
    const res = await fetch(
      `${API_BASE}/autocomplete?q=${encodeURIComponent(query)}`
    );

    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    renderDropdown(data);

  } catch (e) {
    console.error("Autocomplete error:", e);
    hideDropdown();
  }
}

// ── Render dropdown ───────────────────────────────────
function renderDropdown(results) {
  if (!dropdown) return;

  dropdown.innerHTML = "";

  if (!Array.isArray(results) || results.length === 0) {
    dropdown.innerHTML = `<div class="autocomplete-empty">No stocks found</div>`;
    dropdown.classList.add("show");
    return;
  }

  results.slice(0, 7).forEach((item) => {
    const div = document.createElement("div");
    div.className = "autocomplete-item";

    div.innerHTML = `
      <span class="autocomplete-name">${escapeHtml(item?.name || "")}</span>
      <span class="autocomplete-symbol">${escapeHtml(item?.symbol || "")}</span>
    `;

    div.addEventListener("click", () => {
      if (item?.symbol) {
        window.location.href = `/stock/${encodeURIComponent(item.symbol)}`;
      }
    });

    dropdown.appendChild(div);
  });

  dropdown.classList.add("show");
}

// ── Hide dropdown ─────────────────────────────────────
function hideDropdown() {
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
