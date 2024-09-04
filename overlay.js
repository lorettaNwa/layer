const map = new maplibregl.Map({
  container: "map", // container id
  style: {
    version: 8,
    sources: {
      esriWorldPhysical: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri",
      },
    },
    glyphs: "http://localhost:8001/glyphs/{fontstack}/{range}.pbf",
    layers: [
      {
        id: "esriWorldPhysical-layer",
        type: "raster",
        source: "esriWorldPhysical",
        minzoom: 0,
        maxzoom: 23,
        paint: {
          "raster-opacity": 0.3, // Adjust transparency as needed
        },
      },
    ],
  },
  center: [-98.35, 39.5], // Set the initial center of the map
  zoom: 4, // Set the initial zoom level
});

// Add scale control
const scale = new maplibregl.ScaleControl({
  maxWidth: 100,
  unit: "metric", // Use 'metric' for kilometers/meter scale
});
map.addControl(scale, "bottom-right");

// Toggle layer control visibility
document.querySelector(".layer-toggle").addEventListener("click", function () {
  const controlPanel = document.querySelector(".layer-control");
  controlPanel.style.display =
    controlPanel.style.display === "none" ? "block" : "none";
});

const layersConfig = {
  tears: { color: "purple", name: "Trails of Tears", dashArray: [2, 4] },
  Oregon: { color: "brown", name: "Oregon Trails", dashArray: [2, 4] },
  mormon: { color: "blue", name: "Mormon Trail", dashArray: [2, 4] },
  "cali-trails": {
    color: "green",
    name: "California Trails",
    dashArray: [2, 4],
  },
  "sante-fe-trail": {
    color: "orange",
    name: "Santa Fe Trail",
    dashArray: [2, 4],
  },
  railroads: { color: "grey", name: "Railroads", dashArray: [] },
  "erie-canal": { color: "navy", name: "Erie Canal", dashArray: [] },
  "great-wagon-road": {
    color: "darkred",
    name: "The Great Wagon Road",
    dashArray: [2, 4],
  },
};

function updateLegend() {
  // Clear existing legend items
  const legendContent = document.getElementById("legend-content");
  legendContent.innerHTML = "";

  // Loop through each layer and add to legend if visible
  for (const layer in layersConfig) {
    if (map.getLayoutProperty(layer, "visibility") === "visible") {
      const item = layersConfig[layer];
      const legendItem = document.createElement("div");
      legendItem.className = "legend-item";

      const symbol = document.createElement("div");
      symbol.className = "legend-symbol";
      symbol.style.backgroundColor = item.color;

      if (item.dashArray.length > 0) {
        symbol.style.borderTop = `2px dashed ${item.color}`;
        symbol.style.backgroundColor = "transparent";
      }

      const labelText = document.createTextNode(item.name);

      legendItem.appendChild(symbol);
      legendItem.appendChild(labelText);
      legendContent.appendChild(legendItem);
    }
  }
}

// Adding layers (adjust based on your data)
map.on("load", function () {
  const tooltip = document.getElementById("tooltip");

  // Mapping of layer IDs to their corresponding property names
  const layerProperties = {
    tears: "TRALTNAME", // Change to the actual property name for "Trails of Tears"
    Oregon: "TR_NAME", // Change to the actual property name for "Oregon Trails"
    mormon: "TR_NAME", // Change to the actual property name for "Mormon Trail"
    "cali-trails": "ROUTE_NAME", // Change to the actual property name for "California Trails"
    "sante-fe-trail": "TR_NAME", // Change to the actual property name for "Santa Fe Trail"
    railroads: "RRname", // Change to the actual property name for "Railroads"
    "erie-canal": "NAME", // Change to the actual property name for "Erie Canal"
    "great-wagon-road": "Ftr_Code", // Change to the actual property name for "The Great Wagon Road"
    //   states: "state_name", // Change to the actual property name for "States"
    //   counties: "county_name" // Change to the actual property name for "Counties"
  };

  function showTooltip(e, layerId) {
    const features = map.queryRenderedFeatures(e.point, {
      layers: [layerId],
    });

    if (features.length > 0) {
      const feature = features[0];
      const propertyName = layerProperties[layerId];
      const propertyValue = feature.properties[propertyName];

      // Set the tooltip content to just the property value
      tooltip.innerHTML = `${propertyValue}`;

      // Position the tooltip
      tooltip.style.left = `${e.originalEvent.pageX + 5}px`;
      tooltip.style.top = `${e.originalEvent.pageY + 5}px`;
      tooltip.style.display = "block";
    } else {
      tooltip.style.display = "none";
    }
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  // List of layer IDs for which you want tooltips
  const layersWithTooltip = [
    "tears",
    "Oregon",
    "mormon",
    "cali-trails",
    "sante-fe-trail",
    //   "railroads",
  ];

  layersWithTooltip.forEach((layerId) => {
    map.on("mousemove", layerId, (e) => showTooltip(e, layerId));
    map.on("mouseleave", layerId, hideTooltip);
  });

  // Erie Canal layer
  fetch("erie.json")
    .then((response) => response.json())
    .then((data) => {
      map.addLayer({
        id: "erie-canal",
        type: "line",
        source: {
          type: "geojson",
          data: data,
        },
        layout: {
          visibility: "none", // Hide by default
        },
        paint: {
          "line-color": "navy",
          "line-width": 2,
        },
      });

      // Add visibility control for Erie Canal
      document
        .getElementById("erie-canal")
        .addEventListener("change", function (e) {
          map.setLayoutProperty(
            "erie-canal",
            "visibility",
            e.target.checked ? "visible" : "none"
          );
          updateLegend();
        });
    })
    .catch((error) => {
      console.error("Error loading or parsing the GeoJSON data: ", error);
    });

  // The Great Wagon Road layer
  fetch("greatwagon.json")
    .then((response) => response.json())
    .then((data) => {
      map.addLayer({
        id: "great-wagon-road",
        type: "line",
        source: {
          type: "geojson",
          data: data,
        },
        layout: {
          visibility: "none", // Hide by default
        },
        paint: {
          "line-color": "darkred",
          "line-width": 2,
          "line-dasharray": [50, 5], // Broken dashes
        },
      });

      // Add visibility control for The Great Wagon Road
      document
        .getElementById("great-wagon-road")
        .addEventListener("change", function (e) {
          map.setLayoutProperty(
            "great-wagon-road",
            "visibility",
            e.target.checked ? "visible" : "none"
          );
          updateLegend();
        });
    })
    .catch((error) => {
      console.error("Error loading or parsing the GeoJSON data: ", error);
    });

  // Additional layers...
  // Trails of Tears layer
  map.addLayer({
    id: "tears",
    type: "line",
    source: {
      type: "geojson",
      data: "trail.json",
    },
    layout: {
      visibility: "none", // Hide by default
    },
    paint: {
      "line-color": "purple",
      "line-width": 2,
      "line-dasharray": [50, 5], // Broken dashes
    },
  });

  // Oregon Trails layer
  map.addLayer({
    id: "Oregon",
    type: "line",
    source: {
      type: "geojson",
      data: "oreg_nht_100k_line.json",
    },
    layout: {
      visibility: "none", // Hide by default
    },
    paint: {
      "line-color": "brown",
      "line-width": 2,
      "line-dasharray": [50, 5], // Broken dashes
    },
  });

  // Mormon Trail layer
  map.addLayer({
    id: "mormon",
    type: "line",
    source: {
      type: "geojson",
      data: "mormon.json",
    },
    layout: {
      visibility: "none", // Hide by default
    },
    paint: {
      "line-color": "blue",
      "line-width": 2,
      "line-dasharray": [50, 50], // Broken dashes
    },
  });

  // California Trails layer
  map.addLayer({
    id: "cali-trails",
    type: "line",
    source: {
      type: "geojson",
      data: "cali_trail.json",
    },
    layout: {
      visibility: "none", // Hide by default
    },
    paint: {
      "line-color": "green",
      "line-width": 2,
      "line-dasharray": [50, 5], // Broken dashes
    },
  });

  // Santa Fe Trail layer
  map.addLayer({
    id: "sante-fe-trail",
    type: "line",
    source: {
      type: "geojson",
      data: "SAFE_trail.json",
    },
    layout: {
      visibility: "none", // Hide by default
    },
    paint: {
      "line-color": "orange",
      "line-width": 2,
      "line-dasharray": [50, 5], // Broken dashes
    },
  });

  // Railroads layer (using rails.json)
  map.addLayer({
    id: "railroads",
    type: "line",
    source: {
      type: "geojson",
      data: "new_rails.json", // Replace with your GeoJSON file path
    },
    layout: {
      visibility: "none", // Hide by default
    },
    paint: {
      "line-color": "grey",
      "line-width": 0.5,
    },
  });

  // States layer
  map.addLayer({
    id: "states",
    type: "line",
    source: {
      type: "geojson",
      data: "states1920.geojson",
    },
    layout: {
      visibility: "none", // Hide by default
    },
    paint: {
      "line-color": "#000000",
      "line-width": 1,
    },
  });

  // Counties layer
  map.addLayer({
    id: "counties",
    type: "line",
    source: {
      type: "geojson",
      data: "us_county.json",
    },
    layout: {
      visibility: "none", // Hide by default
    },
    paint: {
      "line-color": "red",
      "line-width": 0.5,
    },
  });

  // State Labels layer using the LABEL field
  map.addLayer({
    id: "state-labels",
    type: "symbol",
    source: {
      type: "geojson",
      data: "states1920.geojson", // Use the state GeoJSON file
    },
    layout: {
      "text-field": [
        "format",
        ["get", "LABEL"], // Use the LABEL field from the states GeoJSON
        {
          "font-scale": 0.8,
          "text-font": ["literal", ["Metropolis-Light"]],
        },
      ],
      "text-size": 12,
      "text-anchor": "center",
      "text-justify": "center",
      "symbol-placement": "point",
      "text-allow-overlap": false, // Prevents text from overlapping with other symbols
      "text-ignore-placement": false, // Ensures placement logic is respected to avoid duplication
      "text-padding": 2, // Adds padding around text to avoid overlap
      visibility: "none",
    },
    paint: {
      "text-color": "black",
      "text-halo-color": "white",
      "text-halo-width": 1,
    },
  });

  // Layer control logic
  const checkboxes = document.querySelectorAll(".layer-checkbox input");
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function (e) {
      const layerId = e.target.id;
      map.setLayoutProperty(
        layerId,
        "visibility",
        e.target.checked ? "visible" : "none"
      );
      updateLegend();
    });
  });

  // Add the north arrow rotation logic
  map.on("rotate", updateNorthArrow);

  function updateNorthArrow() {
    const bearing = map.getBearing();
    const northArrow = document.getElementById("north-arrow");
    if (northArrow) {
      northArrow.style.transform = `rotate(${-bearing}deg)`;
    } else {
      console.error("North arrow element not found");
    }
  }

  // Initial update of the north arrow
  updateNorthArrow();
});
