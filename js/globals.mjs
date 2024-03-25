import { Bar, LeafletMap } from "./charts/index.mjs";
import { MapFormBuilder } from "./index.mjs";

// ---------- Data variables ----------

/**
 * The raw data retrieved from reading the csv
 */
globalThis.rawData = null;

/**
 * The processed raw data.
 * This should have the correct type castings and extra calculated fields built from rawData.
 * Its also what is used to build the data object with the correct filtering, grouping, etc...
 */
globalThis.processedData = null;

/**
 * The processed, filtered, and aggregated processedData.
 */
globalThis.data = null;

// ---------- Mapping variables ----------
globalThis.timeOfTheDay = {
  night: "Night",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

globalThis.season = {
  winter: "Winter",
  summer: "Summer",
  spring: "Spring",
  fall: "Fall",
};

globalThis.shapes = new Set();

globalThis.seasons = new Set();

globalThis.encounterLengthCategories = {
  xShort: "Extremely Short",
  short: "Short",
  average: "Average",
  long: "Long",
  xLong: "Extremely Long",
};

globalThis.mapLayerUrls = {
  esri: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attr: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  },
  geo: {
    url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  },
};

// ---------- Form variables ----------
globalThis.colorBy = {
  year: "Year",
  month: "Month",
  totd: "Time of the day",
  ufo_shape: "Shape",
};

globalThis.mapImage = {
  esri: "Esri",
  topo: "Topo",
  geo: "Geo",
};

globalThis.timelineSpeeds = {
  extraSlow: "0.25x speed",
  slow: "0.5x speed",
  normal: "Normal speed",
  fast: "2x speed",
  fastest: "5x speed",
};

globalThis.formData = {
  colorBy: "ufo_shape",
  mapImage: "geo",
  hideYearsWithoutData: false,
  hideFrequencyCategoriesWithoutData: true,
};

// ---------- Builder Variables----------
/**
 * @type {(TimelineBuilder | null)}
 * Object for header form build instance
 */
globalThis.timelineBuilder = null;

/**
 * @type {(MapFormBuilder | null)}
 * Object for header form build instance
 */
globalThis.mapFormBuilder = null;

// ---------- Chart variables ----------

/**
 * @type {(LeafletMap | null)}
 * Object for map chart instance
 */
globalThis.map = null;

/**
 * @type {(Bar | null)}
 * Object for time of the day freq bar chart instance
 */
globalThis.totdFreqBar = null;

/**
 * @type {(Bar | null)}
 * Object for shape freq bar chart instance
 */
globalThis.shapeFreqBar = null;

/**
 * @type {(Bar | null)}
 * Object for season freq bar chart instance
 */
globalThis.seasonFreqBar = null;

/**
 * @type {(Bar | null)}
 * Object for encounter length freq bar chart instance
 */
globalThis.encounterLengthFreqBar = null;

// ---------- Helper functions ----------

/**
 * Gets Width of the scrollbar.
 * Useful for when determining the width of a item without causing x overflow due to scrollbar adding extra width
 */
globalThis.getScrollBarWidth = (element) => {
  // Creating invisible container
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.overflow = "scroll"; // forcing scrollbar to appear
  // @ts-ignore
  outer.style["msOverflowStyle"] = "scrollbar"; // needed for WinJS apps
  (element ?? document.body).appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement("div");
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Removing temporary elements from the DOM
  outer.parentNode?.removeChild(outer);

  return scrollbarWidth;
};

/**
 * Gets whether element has vertical scrollbar.
 */
globalThis.hasVerticalScroll = (element) => {
  return element.scrollHeight > element.clientHeight;
};

/**
 * Updates all global instances of all visualizations
 */
globalThis.updateAllVis = (dataChange) => {
  if (dataChange) {
    map?.updateData(data);
    totdFreqBar?.updateData(data);
    shapeFreqBar?.updateData(data);
    seasonFreqBar?.updateData(data);
    encounterLengthFreqBar?.updateData(data);
  } else {
    map?.updateVis();
    totdFreqBar?.updateVis();
    shapeFreqBar?.updateVis();
    seasonFreqBar?.updateVis();
    encounterLengthFreqBar?.updateVis();
  }
};

/**
 * Handles refiltering processed data on a global filter change
 */
globalThis.handleGlobalFilterChange = () => {
  const preData = [...data];
  data = processedData.filter((d) => {
    // Timeline chart
    const meetsTimelineFilterContraints =
      !timelineBuilder?.selectedYears ||
      timelineBuilder.selectedYears.length === 0 ||
      timelineBuilder.selectedYears.includes(`${d.year}`);

    // Freq bar charts
    const meetsTotdFreqBarConstraint =
      !totdFreqBar?.legendBuilder.selectedLegendGroups ||
      totdFreqBar.legendBuilder.selectedLegendGroups.has(`${d.totd}`);
    const meetsShapeFreqBarConstraint =
      !shapeFreqBar?.legendBuilder.selectedLegendGroups ||
      shapeFreqBar.legendBuilder.selectedLegendGroups.has(`${d.ufo_shape}`);
    const meetsSeasonFreqBarConstraint =
      !seasonFreqBar?.legendBuilder.selectedLegendGroups ||
      seasonFreqBar.legendBuilder.selectedLegendGroups.has(`${d.season}`);

    return (
      meetsTimelineFilterContraints &&
      meetsTotdFreqBarConstraint &&
      meetsShapeFreqBarConstraint &&
      meetsSeasonFreqBarConstraint
    );
  });

  updateAllVis(JSON.stringify(data) !== JSON.stringify(preData));
};

/**
 * Creates a select dropdown from keys/value pairs passed in
 */
globalThis.createSelect = (object, label, keysToExclude = []) => {
  const keys = Object.keys(object).filter((a) => !keysToExclude.includes(a));

  const container = document.createElement("div");
  container.classList.add("select-container");
  container.id = label.split(" ").join("");

  const selectElm = document.createElement("select");
  keys.forEach((k) => {
    const option = document.createElement("option");
    option.value = k;
    option.innerText = object[k];
    selectElm.append(option);
  });
  selectElm.name = label;

  const labelElm = document.createElement("label");
  labelElm.for = label;
  labelElm.innerText = label;

  container.append(labelElm);
  container.append(selectElm);
  return container;
};
