import { LeafletMap } from './charts/index.mjs';
import { HeaderFormBuilder } from './index.mjs';

// ---------- Data variables ----------

/**
 * The raw data retrieved from reading the csv
 */
globalThis.rawData = null;

/**
 * The processed raw data.
 * This should have the correct type castings and extra calculated fields built from rawData
 */
globalThis.data = null;

// ---------- Mapping variables ----------
globalThis.timeOfTheDay = {
   night: 'Night',
   morning: 'Morning',
   afternoon: 'Afternoon',
   evening: 'Evening',
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
};

globalThis.formData = {
   colorBy: 'year' ?? null,
   mapImage: 'esri' ?? null,
};

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
