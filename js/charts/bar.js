import { LegendBuilder } from "../index.mjs";

export class Bar {
  constructor(_config, _data) {
    this.config = {
      parentElementSelector: _config.parentElementSelector,
      parentElement: document.querySelector(_config.parentElementSelector),
      margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
      id: _config.id,
      key: _config.key,
      yAxisTitle: _config.yAxisTitle,
      xAxisTitle: _config.xAxisTitle,
    };
    this.data = _data;
    this.initVis();

    window.addEventListener("resize", () => {
      this.setWidthAndHeight();
      this.updateVis();
    });
  }

  initVis() {
    const idInParent = document.querySelector(this.config.id);
    if (!idInParent) {
      this.mainDiv = d3
        .select(this.config.parentElementSelector)
        .append("div")
        .attr("height", "100%")
        .attr("width", "100%")
        .attr("id", this.config.id)
        .style("display", "grid")
        .style(
          "grid-template-areas",
          `
                  "y chart chart chart chart"
                  "y chart chart chart chart"
                  "y chart chart chart chart"
                  "y chart chart chart chart"
                  ". x x x x"
                  ". legend legend legend legend"
               `
        )
        .style("grid-template-columns", "max-content repeat(4, 1fr)")
        .style("grid-template-rows", "repeat(4, 1fr) repeat(2, max-content)");
    } else {
      this.mainDiv = d3.select(
        `${this.config.parentElementSelector} #${this.config.id}`
      );
    }

    this.buildFreqMap();

    this.setWidthAndHeight();

    this.mainDiv
      .append("p")
      .attr("class", "y-axis-title")
      .style("grid-area", "y")
      .style("writing-mode", "vertical-rl")
      .style("text-orientation", "mixed")
      .style("text-align", "center")
      .style("transform", "rotate(180deg)")
      .text(this.config.yAxisTitle);

    this.mainDiv
      .append("p")
      .attr("class", "x-axis-title")
      .style("grid-area", "x")
      .style("text-align", "center")
      .text(this.config.xAxisTitle);

    this.svg = this.mainDiv
      .append("svg")
      .attr("height", "100%")
      .attr("width", "100%")
      .style("grid-area", "chart");

    this.chart = this.svg
      .append("g")
      .attr(
        "transform",
        `translate(${this.config.margin.left},${this.config.margin.top / 2})`
      );

    this.dataGroup = this.chart
      .append("g")
      .attr("class", "data-group")
      .attr("clip-path", "url(#clip)");

    this.xScale = d3.scaleBand().range([0, this.width]).padding(0.2);

    this.xAxis = d3.axisBottom().scale(this.xScale);

    this.xAxisG = this.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("clip-path", "url(#clip)");

    this.yScale = d3.scaleLinear().range([this.height, 0]);

    this.yAxis = d3.axisLeft().scale(this.yScale);

    this.yAxisG = this.chart.append("g").attr("class", "axis y-axis");

    this.clipPath = this.svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", this.width)
      .attr("height", this.height);

    this.brush = d3
      .brushX()
      .handleSize(8)
      .on("end", (event) => this.brushing(event));

    this.disclaimer = this.svg
      .append("g")
      .attr("class", "disclaimer")
      .attr("text-anchor", "middle");
    this.disclaimer
      .append("text")
      .attr("fill", "red")
      .attr("font-size", ".75em")
      .attr("font-weight", "bold")
      .text(`No data points for selection`);

    this.colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    this.updateVis();
  }

  updateVis() {
    this.setWidthAndHeight();

    const selectedLegendGroups = this.legendBuilder?.selectedLegendGroups;
    const freqMapKeys = Object.keys(this.freqMap).filter(
      (k) =>
        (!formData.hideFrequencyCategoriesWithoutData || this.freqMap[k]) &&
        (!selectedLegendGroups || selectedLegendGroups.has(k))
    );

    this.colorScale.domain(Object.keys(this.freqMap));

    this.xScale.domain(freqMapKeys).range([0, this.width]);
    this.yScale
      .domain([0, d3.max(freqMapKeys, (k) => this.freqMap[k])])
      .range([this.height, 0]);
    this.dataGroup
      .selectAll(".data-point")
      .data(freqMapKeys)
      .join("rect")
      .attr("class", "data-point")
      .transition()
      .attr("x", (k) => this.xScale(k))
      .attr("y", (k) => this.yScale(this.freqMap[k]))
      .attr("width", this.xScale.bandwidth())
      .attr("height", (k) => this.height - this.yScale(this.freqMap[k]))
      .attr("fill", (d) => this.colorScale(d));

    this.updateLegend();
    this.updateDisclaimer();

    this.xAxisG.call(this.xAxis);
    this.yAxisG.call(this.yAxis);
  }

  updateData(data) {
    this.data = data;
    this.buildFreqMap();
    this.updateVis();
  }

  updateDisclaimer() {
    const freqMapKeys = Object.keys(this.freqMap).filter(
      (k) => !formData.hideFrequencyCategoriesWithoutData || this.freqMap[k]
    );
    if (freqMapKeys.length <= 0) {
      this.disclaimer
        .attr("class", "disclaimer show")
        .attr(
          "transform",
          `translate(${this.width / 2 + this.config.margin.left}, ${
            this.height / 2 + this.config.margin.top
          })`
        );
    } else {
      this.disclaimer.attr("class", "disclaimer hide");
    }
  }

  intializeLegendBuilder(parentElement) {
    this.legendBuilder = new LegendBuilder(parentElement, () => {
      handleGlobalFilterChange();
    });
    this.updateLegend();
  }

  updateLegend() {
    this.legendBuilder?.setLegendColorScale(this.colorScale);
  }

  setWidthAndHeight() {
    const svg = document.getElementById(this.config.id)?.querySelector("svg");
    if (svg) {
      this.width =
        svg.getBoundingClientRect().width -
        this.config.margin.left -
        this.config.margin.right;
      this.height =
        svg.getBoundingClientRect().height -
        this.config.margin.top -
        this.config.margin.bottom;

      this.xAxisG?.attr("transform", `translate(0,${this.height})`);

      this.clipPath?.attr("width", this.width).attr("height", this.height);

      this.xScale?.range([0, this.width]);
      this.yScale?.range([this.height, 0]);
    }

    requestAnimationFrame(() => {
      this.brush?.extent([
        [0, 0],
        [this.width ?? 0, this.height ?? 0],
      ]);
      this.chart?.call(this.brush);
    });
  }

  buildFreqMap() {
    this.freqMap = {};

    let values = [];
    if (this.config.key === "totd") {
      values = Object.values(timeOfTheDay);
    } else if (this.config.key === "ufo_shape") {
      values = Array.from(shapes);
    } else if (this.config.key === "season") {
      values = Array.from(seasons);
    }

    values.forEach((v) => {
      this.freqMap[v] = 0;
    });

    this.data.forEach((d) => {
      this.freqMap[d[this.config.key]]++;
    });
  }

  brushing(event) {
    if (!event.selection && !event.sourceEvent) return;

    event.sourceEvent?.preventDefault();
    event.sourceEvent?.stopPropagation();

    const singleSelect = !event.selection;
    const [s0, s1] = !singleSelect
      ? event.selection
      : [1, 2].fill(event.sourceEvent.clientX);

    this.selectDomainFromBrush(s0, s1, singleSelect, event);
  }

  clearSelection() {
    this.selectedDomain = null;
    this.chart.transition().call(this.brush.move, [0, 0]);
    this.legendBuilder.updateSelectedLegendGroups(this.colorScale.domain());
  }

  filteredDomain(scale, min, max, singleSelect) {
    const domainVals = scale
      .domain()
      .map((d, i) => ({
        min: Math.floor(scale(d)),
        max: Math.ceil(scale(d) + scale.bandwidth()),
        i,
      }))
      .filter((d) => d.min <= max && min <= d.max);

    return scale
      .domain()
      .filter((d, i) => domainVals.map((d) => d.i).includes(i));
  }

  snappedSelection(bandScale, domain) {
    const domainVals = domain.map((d) => bandScale(d));
    return [d3.min(domainVals), d3.max(domainVals) + bandScale.bandwidth()];
  }

  selectDomainFromBrush(s0, s1, singleSelect, event) {
    this.selectedDomain = this.filteredDomain(
      this.xScale,
      s0,
      s1,
      singleSelect
    );
    this.legendBuilder.updateSelectedLegendGroups(
      this.selectedDomain.length > 0
        ? this.selectedDomain
        : this.colorScale.domain()
    );

    this.selection = this.snappedSelection(
      this.xScale,
      this.selectedDomain
    ).map((d) => (isNaN(d) || d === undefined ? -1 : d));

    if (event && event.sourceEvent && event.type === "end") {
      this.chart.transition().call(event.target.move, this.selection);
      this.updateVis();
    }
    handleGlobalFilterChange();
    if (formData.hideFrequencyCategoriesWithoutData) {
      // Reset brush selection since data change will cause data under selection to move
      this.chart.call(this.brush.move, null);
    }
  }
}
