import { Bar, LeafletMap } from "./charts/index.mjs";
import { HeaderFormBuilder, TimelineBuilder } from "./helpers/index.mjs";

document.addEventListener("DOMContentLoaded", () => {
  main();
});

async function main() {
  rawData = await d3.csv("data/ufo_sightings.csv");

  // TODO: this should be removed, only added to speed up development since lots of dots get laggy
  // rawData = rawData.slice(0, 2000);

  processData();
  initializeBuilders();
  initializeCharts();

  initializeEventListeners();
}

function processData() {
  processedData = rawData.map((d) => {
    if (d.latitude !== undefined) {
      d.latitude = +d.latitude; //make sure these are not strings
    }
    if (d.longitude !== undefined) {
      d.longitude = +d.longitude; //make sure these are not strings
    }
    if (d.encounter_length !== undefined) {
      d.encounter_length = +d.encounter_length; //make sure these are not strings
    }

    d.date_time = new Date(d.date_time);
    d.year = d.date_time.getFullYear();
    d.month = d.date_time.getMonth();
    d.hour = d.date_time.getHours();

    if (d.hour <= 5 || d.hour >= 21) {
      d.totd = timeOfTheDay["night"];
    } else if (d.hour >= 6 && d.hour <= 11) {
      d.totd = timeOfTheDay["morning"];
    } else if (d.hour >= 12 && d.hour <= 17) {
      d.totd = timeOfTheDay["afternoon"];
    } else if (d.hour >= 18 && d.hour <= 20) {
      d.totd = timeOfTheDay["evening"];
    }

    if (d.month <= 1 || d.month >= 11) {
      d.season = season["winter"];
    } else if (d.month >= 5 && d.month <= 7) {
      d.season = season["summer"];
    } else if (d.month >= 2 && d.month <= 4) {
      d.season = season["spring"];
    } else if (d.month >= 8 && d.month <= 10) {
      d.season = season["fall"];
    }

    seasons.add(d.season);
    shapes.add(d.ufo_shape);

    return d;
  });
  data = processedData;
}

function initializeCharts() {
  map = new LeafletMap(
    {
      parentElementSelector: "#map-chart-container",
      id: "my-map",
    },
    data
  );

  // Build bar charts
  const barChartsContainerSelector = "#bar-charts-container";
  const barConfigs = [
    {
      parentElementSelector: barChartsContainerSelector,
      id: "totd",
      key: "totd",
      yAxisTitle: "# of Occurrences",
      xAxisTitle: "Time of the Day",
    },
    {
      parentElementSelector: barChartsContainerSelector,
      id: "shape",
      key: "ufo_shape",
      yAxisTitle: "# of Occurrences",
      xAxisTitle: "UFO Shape",
    },
    {
      parentElementSelector: barChartsContainerSelector,
      id: "season",
      key: "season",
      yAxisTitle: "# of Occurrences",
      xAxisTitle: "Season",
    },
  ];
  document.querySelector(barChartsContainerSelector).style[
    "grid-template-columns"
  ] = `repeat(${barConfigs.length}, 1fr)`;
  barConfigs.forEach((c) => {
    const bar = new Bar(c, data);
    if (c.id === "totd") {
      totdFreqBar = bar;
    } else if (c.id === "shape") {
      shapeFreqBar = bar;
    } else if (c.id === "season") {
      seasonFreqBar = bar;
    }
  });

  // Build Histograms
  // encounterLengthFreqBar = new Bar(
  //    {
  //       parentElementSelector: barChartsContainerSelector,
  //       id: 'length',
  //       key: 'encounter_length',
  //    },
  //    data
  // );

  // Build scatter plot charts

  // Build word cloud
}

function initializeBuilders() {
  formBuilder = new HeaderFormBuilder();
  timelineBuilder = new TimelineBuilder(
    { parentElementSelector: "#timeline" },
    data
  );
}

function openProjectInformation() {
  // TODO
  alert("Open a dialog with information about the project");
}

function initializeEventListeners() {
  document
    .getElementById("info")
    .addEventListener("click", openProjectInformation);

  const freqHide = document.getElementById("freqHide");
  freqHide.checked = formData.hideFrequencyCategoriesWithoutData;
  freqHide.addEventListener("change", (event) => {
    formData.hideFrequencyCategoriesWithoutData = event.target.checked;
    updateAllVis();
  });
}
