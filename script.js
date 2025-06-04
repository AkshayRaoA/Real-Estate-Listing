// DOM elements
const propertyList = document.getElementById("property-list");
const favoritesList = document.getElementById("favoritesList");
const modal = document.getElementById("propertyModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalDetails = document.getElementById("modalDetails");
const modalGallery = document.getElementById("modalGallery");
const modalClose = document.getElementById("modalClose");
const favoriteBtn = document.getElementById("favoriteBtn");
const searchInput = document.getElementById("searchInput");
const bedroomFilter = document.getElementById("bedroomFilter");
const priceFilter = document.getElementById("priceFilter");
const sortFilter = document.getElementById("sortFilter");
const pagination = document.getElementById("pagination");
const resultsCount = document.getElementById("resultsCount");
const avgPriceDisplay = document.getElementById("avgPrice");
const clearFiltersBtn = document.getElementById("clearFilters");

// Map
const map = L.map("map").setView([39.8283, -98.5795], 4);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// State
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let currentProperty = null;
let currentPage = 1;
const itemsPerPage = 4;

// --- Utilities ---
function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, '<mark>$1</mark>');
}

function saveFilters() {
  const filters = {
    searchText: searchInput.value,
    bedFilterVal: bedroomFilter.value,
    priceFilterVal: priceFilter.value,
    sortVal: sortFilter.value,
    currentPage,
  };
  localStorage.setItem("filters", JSON.stringify(filters));
}

function restoreFilters() {
  const savedFilters = JSON.parse(localStorage.getItem("filters"));
  if (savedFilters) {
    searchInput.value = savedFilters.searchText || "";
    bedroomFilter.value = savedFilters.bedFilterVal || "all";
    priceFilter.value = savedFilters.priceFilterVal || "all";
    sortFilter.value = savedFilters.sortVal || "";
    currentPage = savedFilters.currentPage || 1;
  }
}

function renderMapMarkers(propertiesArr) {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  propertiesArr.forEach((prop) => {
    if (prop.latitude && prop.longitude) {
      const marker = L.marker([prop.latitude, prop.longitude]).addTo(map);
      marker.bindPopup(`<strong>${prop.title}</strong><br>$${prop.price.toLocaleString()}`);
    }
  });
}

// --- Rendering ---
function renderProperties(propertiesArr, container) {
  container.innerHTML = "";
  if (propertiesArr.length === 0) {
    container.innerHTML = "<p>No properties found.</p>";
    resultsCount.textContent = "0 results found";
    avgPriceDisplay.textContent = "";
    return;
  }

  const searchText = searchInput.value.toLowerCase();
  const avgPrice = Math.round(propertiesArr.reduce((sum, p) => sum + p.price, 0) / propertiesArr.length);
  avgPriceDisplay.textContent = `Average Price: $${avgPrice.toLocaleString()}`;
  resultsCount.textContent = `${propertiesArr.length} result${propertiesArr.length > 1 ? "s" : ""} found`;

  propertiesArr.forEach((prop) => {
    const card = document.createElement("div");
    card.className = "property-card";
    card.innerHTML = `
      <img src="${prop.images[0]}" alt="${prop.title}" />
      <div class="property-info">
        <h3>${highlightMatch(prop.title, searchText)}</h3>
        <p>${highlightMatch(prop.location, searchText)}</p>
        <p class="price">$${prop.price.toLocaleString()}</p>
      </div>
      <div class="hover-detail">
        <p>${prop.bedrooms} Bedrooms</p>
        <p>${prop.amenities.slice(0, 2).join(", ")}${prop.amenities.length > 2 ? ", ..." : ""}</p>
      </div>
    `;
    card.addEventListener("click", () => openModal(prop));
    container.appendChild(card);
  });
}

function renderPagination(totalPages) {
  pagination.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = i;
      filterSortPaginate();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    pagination.appendChild(btn);
  }
}

function renderFavorites() {
  favoritesList.innerHTML = "";
  if (favorites.length === 0) {
    favoritesList.innerHTML = "<p>No favorites added.</p>";
    return;
  }
  favorites.forEach((fav) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${fav.title} - $${fav.price.toLocaleString()} 
      <button class="remove-fav-btn" data-id="${fav.id}" aria-label="Remove ${fav.title} from favorites">Remove</button>
    `;
    favoritesList.appendChild(li);
  });

  document.querySelectorAll(".remove-fav-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id);
      favorites = favorites.filter(f => f.id !== id);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      updateFavoriteButton();
      renderFavorites();
    })
  );
}

// --- Modal ---
function openModal(prop) {
  currentProperty = prop;
  modalTitle.textContent = prop.title;
  modalDescription.textContent = prop.description;

  modalDetails.innerHTML = "";
  const details = [
    `Location: ${prop.location}`,
    `Price: $${prop.price.toLocaleString()}`,
    `Bedrooms: ${prop.bedrooms}`,
    `Amenities: ${prop.amenities.join(", ")}`,
  ];
  details.forEach((detail) => {
    const li = document.createElement("li");
    li.textContent = detail;
    modalDetails.appendChild(li);
  });

  modalGallery.innerHTML = "";
  prop.images.forEach((img, idx) => {
    const galleryImg = document.createElement("img");
    galleryImg.src = img;
    galleryImg.alt = `${prop.title} image ${idx + 1}`;
    if (idx === 0) galleryImg.classList.add("active");
    galleryImg.addEventListener("click", () => {
      document.querySelectorAll("#modalGallery img").forEach((imgEl) => imgEl.classList.remove("active"));
      galleryImg.classList.add("active");
      modalTitle.style.backgroundImage = `url(${img})`;
    });
    modalGallery.appendChild(galleryImg);
  });

  updateFavoriteButton();
  modal.classList.remove("hidden");

  if (prop.latitude && prop.longitude) {
    map.setView([prop.latitude, prop.longitude], 13);
    L.popup()
      .setLatLng([prop.latitude, prop.longitude])
      .setContent(`<strong>${prop.title}</strong><br>$${prop.price.toLocaleString()}`)
      .openOn(map);
  }
}

modalClose.addEventListener("click", () => {
  modal.classList.add("hidden");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    modal.classList.add("hidden");
  }
});

function updateFavoriteButton() {
  if (!currentProperty) return;
  if (favorites.some((f) => f.id === currentProperty.id)) {
    favoriteBtn.textContent = "Remove from Favorites";
  } else {
    favoriteBtn.textContent = "Add to Favorites";
  }
}

favoriteBtn.addEventListener("click", () => {
  if (!currentProperty) return;
  const index = favorites.findIndex((f) => f.id === currentProperty.id);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(currentProperty);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavoriteButton();
  renderFavorites();
});

// --- Filtering, Sorting, Pagination ---
function filterSortPaginate() {
  const searchText = searchInput.value.toLowerCase();
  const bedFilterVal = bedroomFilter.value;
  const priceFilterVal = priceFilter.value;
  const sortVal = sortFilter.value;

  let filtered = properties.filter((prop) => {
    const matchesSearch =
      prop.location.toLowerCase().includes(searchText) ||
      prop.title.toLowerCase().includes(searchText);
    const matchesBedroom = bedFilterVal === "all" || prop.bedrooms >= parseInt(bedFilterVal);
    const matchesPrice = priceFilterVal === "all" || prop.price <= parseInt(priceFilterVal);
    return matchesSearch && matchesBedroom && matchesPrice;
  });

  switch (sortVal) {
    case "priceAsc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "priceDesc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "bedroomsAsc":
      filtered.sort((a, b) => a.bedrooms - b.bedrooms);
      break;
    case "bedroomsDesc":
      filtered.sort((a, b) => b.bedrooms - a.bedrooms);
      break;
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  renderProperties(paginated, propertyList);
  renderPagination(totalPages);
  renderMapMarkers(filtered);
  saveFilters();
}

// --- Events ---
searchInput.addEventListener("input", () => {
  currentPage = 1;
  filterSortPaginate();
});

bedroomFilter.addEventListener("change", () => {
  currentPage = 1;
  filterSortPaginate();
});

priceFilter.addEventListener("change", () => {
  currentPage = 1;
  filterSortPaginate();
});

sortFilter.addEventListener("change", () => {
  currentPage = 1;
  filterSortPaginate();
});

clearFiltersBtn.addEventListener("click", () => {
  searchInput.value = "";
  bedroomFilter.value = "all";
  priceFilter.value = "all";
  sortFilter.value = "";
  currentPage = 1;
  filterSortPaginate();
});

// Download favorites as CSV
document.getElementById("downloadCsvBtn").addEventListener("click", () => {
  if (favorites.length === 0) {
    alert("No favorites to download.");
    return;
  }

  const header = ["Title", "Location", "Price", "Bedrooms", "Amenities"];
  const rows = favorites.map((fav) => [
    `"${fav.title}"`,
    `"${fav.location}"`,
    `$${fav.price}`,
    fav.bedrooms,
    `"${fav.amenities.join(", ")}"`,
  ]);

  let csvContent = "data:text/csv;charset=utf-8," + header.join(",") + "\n";
  rows.forEach((row) => {
    csvContent += row.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "favorites.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});


// --- Init ---
restoreFilters();
filterSortPaginate();
renderFavorites();
