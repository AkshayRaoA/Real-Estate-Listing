const properties = [
  {
    id: 1,
    title: "Modern Family House",
    description: "Beautiful house with spacious rooms, garden, and garage.",
    location: "New York",
    price: 450000,
    bedrooms: 4,
    amenities: ["Garden", "Garage", "Swimming Pool"],
    latitude: 40.7128,
    longitude: -74.0060,
    images: [
      "https://images.unsplash.com/photo-1560448075-9a1a6760201e?auto=format&fit=crop&w=800&q=60",
      "https://images.unsplash.com/photo-1501183638714-1c1e2d6614b4?auto=format&fit=crop&w=800&q=60",
      "https://images.unsplash.com/photo-1572120360610-d971b9b2cd21?auto=format&fit=crop&w=800&q=60",
    ],
  },
  {
    id: 2,
    title: "Luxury Apartment",
    description: "Downtown apartment with amazing city views and modern amenities.",
    location: "San Francisco",
    price: 720000,
    bedrooms: 3,
    amenities: ["Gym", "24/7 Security", "Rooftop Terrace"],
    latitude: 37.7749,
    longitude: -122.4194,
    images: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=60",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=60",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=60",
    ],
  },
  // ... add other properties with latitude and longitude
];

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

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let currentProperty = null;
let currentPage = 1;
const itemsPerPage = 4;

// --- MAP ---
const map = L.map("map").setView([39.8283, -98.5795], 4); // Center US
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

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

// Render property cards
function renderProperties(propertiesArr, container) {
  container.innerHTML = "";
  if (propertiesArr.length === 0) {
    container.innerHTML = "<p>No properties found.</p>";
    return;
  }
  propertiesArr.forEach((prop) => {
    const card = document.createElement("div");
    card.className = "property-card";
    card.innerHTML = `
      <img src="${prop.images[0]}" alt="${prop.title}" />
      <div class="property-info">
        <h3>${prop.title}</h3>
        <p>${prop.location}</p>
        <p class="price">$${prop.price.toLocaleString()}</p>
      </div>
    `;
    card.addEventListener("click", () => openModal(prop));
    container.appendChild(card);
  });
}

// Open modal with property details
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

// Close modal
modalClose.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Filter, sort, and paginate
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
    default:
      break;
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  renderProperties(paginated, propertyList);
  renderPagination(totalPages);
  renderMapMarkers(filtered); // Update map markers
}

// Pagination buttons
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

// Favorite toggle
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

function renderFavorites() {
  favoritesList.innerHTML = "";
  if (favorites.length === 0) {
    favoritesList.innerHTML = "<p>No favorites added.</p>";
    return;
  }
  favorites.forEach((fav) => {
    const li = document.createElement("li");
    li.textContent = `${fav.title} - $${fav.price.toLocaleString()}`;
    favoritesList.appendChild(li);
  });
}

// Initial render
filterSortPaginate();
renderFavorites();

// Event listeners
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
