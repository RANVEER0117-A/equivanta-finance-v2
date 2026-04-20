const searchInput = document.getElementById("searchInput");
const dropdown = document.getElementById("autocompleteDropdown");
let debounceTimer = null;

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  clearTimeout(debounceTimer);

  if (query.length < 2) {
    hideDropdown();
    return;
  }

  debounceTimer = setTimeout(() => fetchSuggestions(query), 250);
});

async function fetchSuggestions(query) {
  try {
    const res = await fetch(`/autocomplete?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    renderDropdown(data);
  } catch (e) {
    hideDropdown();
  }
}

function renderDropdown(results) {
  dropdown.innerHTML = "";

  if (!results || results.length === 0) {
    dropdown.innerHTML = `<div class="autocomplete-empty">No Indian stocks found for this query</div>`;
    dropdown.classList.add("show");
    return;
  }

  results.forEach((item) => {
    const div = document.createElement("div");
    div.className = "autocomplete-item";
    div.innerHTML = `
      <span class="autocomplete-name">${escapeHtml(item.name)}</span>
      <span class="autocomplete-symbol">${escapeHtml(item.symbol)}</span>
    `;
    div.addEventListener("click", () => {
      window.location.href = `/stock/${encodeURIComponent(item.symbol)}`;
    });
    dropdown.appendChild(div);
  });

  dropdown.classList.add("show");
}

function hideDropdown() {
  dropdown.classList.remove("show");
  dropdown.innerHTML = "";
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    hideDropdown();
  }
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideDropdown();
});
