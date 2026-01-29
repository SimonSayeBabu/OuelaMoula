// taille de la map qui prend tout l'ecran
window.addEventListener("resize", () => {
  const mapEl = document.getElementById("map");
  if (mapEl) {
    mapEl.style.width = window.innerWidth + "px";
    mapEl.style.height = window.innerHeight + "px";
  }
});
let timeOpen;

window.onload = async () => {
  timeOpen = Date.now();

  // params de la map
  let map = L.map("map", {
    center: [48.856667, 2.352222],
    zoom: 5,
    minZoom: 2,
    zoomControl: false,
    maxBounds: [
      [90, 150],
      [-75, -250],
    ],
  });

  L.control.zoom({ position: "topright" }).addTo(map);

  let mode = -1;
  let filtersOpen = false;

  // les filtres
  const filterState = {
    gender: { m: false, f: false },
    selfMade: null,
    family: null,
    rank: { top100: false, top500: false },
    networth: null,
  };

  const modeChanger = document.getElementById("mode");
  const searchBox = document.getElementById("searchBox");
  const searchBar = document.getElementById("searchBar");
  const card = document.getElementById("card");
  const left = document.getElementById("left");
  const filtersToggle = document.getElementById("filtersToggle");
  const filtersPanel = document.getElementById("filtersPanel");
  const cardContent = document.getElementById("cardContent");
  const search = document.getElementById("search");
  const filtersGrid = document.querySelector(".filtersGrid");

  // listeners

  // le dark mode
  modeChanger.addEventListener("change", (event) => {
    map.removeLayer(mapLayer);
    mode *= -1;
    mapLayer = setLayer(mode);
  });

  // rechreche
  search.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      if (search.value) {
        searchBillionaire(search.value);
      } else {
        removeGeoLayer();
        geoLayer = createGeoLayer("", "");
        if (geoLayer && typeof geoLayer.getBounds === "function") {
          const bounds = geoLayer.getBounds();
          if (bounds && bounds.isValid && bounds.isValid()) {
            const leftWidth = left.getBoundingClientRect().width;
            map.fitBounds(bounds, {
              paddingTopLeft: [Math.round(leftWidth) + 20, 50],
              paddingBottomRight: [50, 50],
            });
          }
        }
      }
    }
  });

  // l'affichage des filtres
  filtersToggle.addEventListener("click", () => {
    filtersOpen = !filtersOpen;
    filtersPanel.classList.toggle("hidden", !filtersOpen);
    left.classList.toggle("filters-open", filtersOpen);
    filtersToggle.classList.toggle("open", filtersOpen);
    removeGeoLayer();
    geoLayer = createGeoLayer("ui", search.value || "");
    geoLayer.addTo(map);
    if (geoLayer && typeof geoLayer.getBounds === "function") {
      const bounds = geoLayer.getBounds();
      if (bounds && bounds.isValid && bounds.isValid()) {
        const leftWidth = left ? left.getBoundingClientRect().width || 0 : 0;
        map.fitBounds(bounds, {
          paddingTopLeft: [Math.round(leftWidth) + 20, 50],
          paddingBottomRight: [50, 50],
        });
      }
    }
  });

  // filtres + change la map
  filtersPanel.addEventListener("change", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    const token = el.dataset.filter;
    if (!token) return;

    const [k, v] = token.split(":");
    if (k === "gender") filterState.gender[v] = el.checked;
    if (k === "selfMade") filterState.selfMade = el.checked ? true : null;
    if (k === "family") filterState.family = el.checked ? true : null;
    if (k === "rank") {
      // keep individual flags so multiple rank checkboxes are supported
      filterState.rank = filterState.rank || { top100: false, top500: false };
      filterState.rank[v] = el.checked;
    }
    console.log(k, v, filterState);
    if (k === "networth") {
      const n = Number(el.value) || 0;
      filterState.networth = n > 0 ? n * 1000 : null;
    }

    removeGeoLayer();
    geoLayer = createGeoLayer("ui", search.value || "");
    geoLayer.addTo(map);
    if (geoLayer && typeof geoLayer.getBounds === "function") {
      const bounds = geoLayer.getBounds();
      if (bounds && bounds.isValid && bounds.isValid()) {
        const leftWidth = left ? left.getBoundingClientRect().width || 0 : 0;
        map.fitBounds(bounds, {
          paddingTopLeft: [Math.round(leftWidth), 20],
          paddingBottomRight: [20, 20],
        });
      }
    }
  });

  // layer de base
  let mapLayer = setLayer("dark");

  // layer des data
  let response = await fetch("./src/data/result.geojson");
  let data = await response.json();
  let geoLayer = createGeoLayer("", "citizenship");
  geoLayer.addTo(map);

  selectRandomPerson(data);

  // Fonctions
  function selectRandomPerson(data) {
    if (!data.features || !data.features.length) return;

    const randomIndex = Math.floor(Math.random() * data.features.length);
    const randomFeature = data.features[randomIndex];

    onMarkerClick(randomFeature);

    const [lng, lat] = randomFeature.geometry.coordinates;
    map.setView([lat, lng], 6);
  }

  // layer avec en arg le mode
  function setLayer(mode) {
    var layer;
    if (mode == 1) {
      layer = L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}",
        {
          minZoom: 0,
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          ext: "png",
        },
      );
      searchBox.classList.remove("light");
      searchBar.classList.remove("light");
      card.classList.remove("light");
      filtersToggle.classList.remove("light");
      search.classList.remove("light");
      filtersGrid.classList.remove("light");
      cardContent.classList.remove("light");
    } else {
      layer = L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}",
        {
          minZoom: 0,
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          ext: "png",
        },
      );
      searchBox.classList.add("light");
      searchBar.classList.add("light");
      card.classList.add("light");
      filtersToggle.classList.add("light");
      search.classList.add("light");
      filtersGrid.classList.add("light");
      cardContent.classList.add("light");
    }
    layer.addTo(map);
    return layer;
  }

  function createGeoLayer(filter, prop) {
    let markers = L.markerClusterGroup();
    L.geoJson(data, {
      filter: function (geoJsonFeature) {
        const p = geoJsonFeature.properties;

        if (prop && (filter === "name" || filter === "ui")) {
          if (!p.name?.toLowerCase().includes(prop.toLowerCase())) return false;
        }

        const wantM = filterState.gender.m;
        const wantF = filterState.gender.f;
        if (wantM || wantF) {
          if (p.gender === "m" && !wantM) return false;
          if (p.gender === "f" && !wantF) return false;
          if (p.gender !== "m" && p.gender !== "f") return false;
        }

        if (
          filterState.selfMade === true &&
          !(p.selfMade && p.selfMade._is === true)
        )
          return false;
        if (
          filterState.family === true &&
          !(p.selfMade && p.selfMade._is === false)
        )
          return false;

        if (filterState.rank) {
          if (filterState.rank.top100 && !(p.rank <= 100)) return false;
          if (filterState.rank.top500 && !(p.rank <= 500)) return false;
        }

        if (typeof filterState.networth === "number") {
          if (!(p.networth >= filterState.networth)) return false;
        }

        return true;
      },
      pointToLayer: function (geoJsonPoint, latlng) {
        let marker;
        var icon = new L.Icon({
          iconUrl: "./src/img/single_marker.png",
          iconSize: [25, 25],
          iconAnchor: [12.5, 12.5],
        });
        marker = L.marker(latlng, {
          icon: icon,
          title: geoJsonPoint.properties["name"],
        });

        marker.on("click", function (event) {
          onMarkerClick(geoJsonPoint);
        });
        markers.addLayer(marker);
      },
    });
    markers.addTo(map);
    return markers;
  }

  function removeGeoLayer() {
    map.removeLayer(geoLayer);
  }

  function searchBillionaire(name) {
    removeGeoLayer();
    geoLayer = createGeoLayer("name", name);
    geoLayer.addTo(map);
    if (geoLayer && typeof geoLayer.getBounds === "function") {
      const bounds = geoLayer.getBounds();
      if (bounds && bounds.isValid && bounds.isValid()) {
        const leftWidth = left ? left.getBoundingClientRect().width || 0 : 0;
        map.fitBounds(bounds, {
          paddingTopLeft: [Math.round(leftWidth) + 20, 50],
          paddingBottomRight: [50, 50],
        });
      } else {
        const layers = geoLayer.getLayers ? geoLayer.getLayers() : [];
        if (layers.length) {
          const first = layers[0];
          const latlng = first.getLatLng ? first.getLatLng() : null;
          if (latlng) {
            const leftWidth = left
              ? left.getBoundingClientRect().width || 0
              : 0;
            const optBounds = L.latLngBounds(latlng).pad(0.5);
            map.fitBounds(optBounds, {
              paddingTopLeft: [Math.round(leftWidth) + 20, 50],
              paddingBottomRight: [50, 50],
            });
          }
        }
      }
    }
  }
};

function onMarkerClick(feature) {
  const p = feature.properties;
  const cardContent = document.getElementById("cardContent");

  const residence = p.residence
    ? [p.residence.city, p.residence.state, p.residence.country]
        .filter(Boolean)
        .join(", ")
    : "—";

  const industries =
    Array.isArray(p.industry) && p.industry.length
      ? p.industry.join(", ")
      : "—";

  const sources =
    Array.isArray(p.source) && p.source.length ? p.source.join(", ") : "—";

  const selfMade = p.selfMade?._is ? "Yes" : "No";
  const family = p.family ? "Yes" : "No";

  const networthB =
    typeof p.networth === "number" ? (p.networth / 1000).toFixed(2) : "—";

  let gainHtml = "";

  const y2024Net =
    p.y2024 && typeof p.y2024.networth === "number" ? p.y2024.networth : null;
  let gainPerSec = null;
  if (
    typeof p.networth === "number" &&
    typeof y2024Net === "number" &&
    y2024Net >= 1
  ) {
    gainPerSec = ((p.networth - y2024Net) * 1e6) / 31622400;
    if (gainPerSec > 0) {
      gainHtml = `<div><span>Gained since your visit:</span><br><span id="gainedValue">$</span></div>
                  <div><span>Gain per second:</span> ${Number(gainPerSec).toFixed(2)} $/s</div>`;
      gainPerSec = { value: gainPerSec };
    } else {
      gainPerSec = null;
    }
  }
  const totalNetDollars = p.networth * 1e6;

  const avatar = p.image
    ? `<img class="cardAvatar" src="${p.image}" alt="${p.name}"
              onerror="this.outerHTML='<img class=\"cardAvatar\" src=/src/img/Mask_group.png alt=\"${p.name}\">`
    : `<img class="cardAvatar" src="/src/img/Mask_group.png" alt="${p.name}">`;
  cardContent.innerHTML = `
      <div class="cardHeader">
        ${avatar}
        <div>
          <div>${p.name ?? "—"}</div>
          <div id="rank">Rank #${p.rank ?? "Unranked"}</div>
        </div>
      </div>

      <div class="cardBody">
        <div><span>Networth :</span> ${networthB} B$</div>
        ${gainHtml}
        <div><span>Self-made :</span> ${selfMade}</div>
        <div><span>Industries :</span> ${industries}</div>
        <div><span>Sources :</span> ${sources}</div>
        <br/>
        <div><span>Citizenship :</span> ${(p.citizenship ?? "—").toUpperCase()}</div>
        <div><span>Residence :</span> ${residence}</div>
        <div><span>Gender :</span> ${p.gender === "m" ? "Male" : p.gender === "f" ? "Female" : "—"}</div>
        <div><span>Birth Date :</span> ${p.birthDate ?? "—"}</div>
        <div><span>Children :</span> ${p.children ?? "—"}</div>
        <div><span>Marital Status :</span> ${p.maritalStatus ?? "Single"}</div>
        <br/>
        <div class="comparisons">
          <div class="comparisonsTitle">
            What could you buy with their net worth?
          </div>
          <button
            id="comparisonsToggle"
            type="button"
            title="comparisons"
          ></button>
        </div>
        <div class="comparisonsList">
          <div><span>Ferrari (200k):</span> ${totalNetDollars !== null ? Number(totalNetDollars / 200000).toFixed(0) : "—"}</div>
          <div><span>House (500k):</span> ${totalNetDollars !== null ? Number(totalNetDollars / 500000).toFixed(0) : "—"}</div>
          <div><span>iPhone (1k):</span> ${totalNetDollars !== null ? Number(totalNetDollars / 1000).toFixed(0) : "—"}</div>
          <div><span>Coffee (4):</span> ${totalNetDollars !== null ? Number(totalNetDollars / 4).toFixed(0) : "—"}</div>
          <div><span>Yacht (1M):</span> ${totalNetDollars !== null ? Number(totalNetDollars / 1000000).toFixed(0) : "—"}</div>
        </div>
      </div>
    `;

    const comparisonsToggle = document.getElementById("comparisonsToggle");
    const comparisonsList = cardContent.querySelector(".comparisonsList");
    if (comparisonsList) comparisonsList.classList.add("hidden");
    if (comparisonsToggle && comparisonsList) {
      comparisonsToggle.addEventListener("click", () => {
        const isOpen = !comparisonsList.classList.toggle("hidden");
        comparisonsToggle.classList.toggle("open", isOpen);
      });
    }

  if (gainPerSec !== null && gainPerSec.value > 0) {
    const updateGain = () => {
      const timespent = Date.now() - timeOpen;
      const gained = (gainPerSec.value * timespent) / 1000;
      const el = document.getElementById("gainedValue");
      if (el) el.textContent = Number(gained).toFixed(2) + " $";
    };
    updateGain();
    setInterval(updateGain, 1000);
  }
}
