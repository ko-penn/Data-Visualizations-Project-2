import { LeafletMap } from './charts/index.mjs';
import { HeaderFormBuilder } from './index.mjs';

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
   night: 'Night',
   morning: 'Morning',
   afternoon: 'Afternoon',
   evening: 'Evening',
};

globalThis.mapLayerUrls = {
   esri: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
   },
   topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attr: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
   },
   geo: {
      url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
   },
};

// ---------- Form variables ----------
globalThis.colorBy = {
   year: 'Year',
   month: 'Month',
   totd: 'Time of the day',
   ufo_shape: 'Shape',
};

globalThis.mapImage = {
   esri: 'Esri',
   topo: 'Topo',
   geo: 'Geo',
};

globalThis.formData = {
   colorBy: 'year' ?? null,
   mapImage: 'esri' ?? null,
};

// ---------- Builder Variables----------
/**
 * @type {(TimelineBuilder | null)}
 * Object for header form build instance
 */
globalThis.timelineBuilder = null;

/**
 * @type {(HeaderFormBuilder | null)}
 * Object for header form build instance
 */
globalThis.formBuilder = null;

// ---------- Chart variables ----------

/**
 * @type {(LeafletMap | null)}
 * Object for map chart instance
 */
globalThis.map = null;

// ---------- Helper functions ----------

/**
 * Gets Width of the scrollbar.
 * Useful for when determining the width of a item without causing x overflow due to scrollbar adding extra width
 */
globalThis.getScrollBarWidth = (element) => {
   // Creating invisible container
   const outer = document.createElement('div');
   outer.style.visibility = 'hidden';
   outer.style.overflow = 'scroll'; // forcing scrollbar to appear
   // @ts-ignore
   outer.style['msOverflowStyle'] = 'scrollbar'; // needed for WinJS apps
   (element ?? document.body).appendChild(outer);

   // Creating inner element and placing it in the container
   const inner = document.createElement('div');
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
   } else {
      // TODO: update other visualizations when form changes
      map?.updateVis();
   }
};
