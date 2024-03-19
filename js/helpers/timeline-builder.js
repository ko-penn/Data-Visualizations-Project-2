export class TimelineBuilder {
  constructor(_config, _data) {
    this.config = {
      parentElementSelector: _config.parentElementSelector,
      parentElement: document.querySelector(_config.parentElementSelector),
      margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
    };
    this.data = _data;
    this.initVis();

    this.config.parentElement.parentNode.addEventListener("click", () => {
      if (this.selectedYears !== null) {
        this.chart.call(this.brush.move, null);
        this.selectedYears = null;
        this.pause();
        this.updateVis();
        this.triggerDataUpdate();
      }
    });
    window.addEventListener("resize", () => {
      this.setWidthAndHeight();
      this.updateVis();
    });
  }

  initVis() {
    this.handleTimelineControls();

    this.setWidthAndHeight();

    this.buildYearCountMap();

    this.svg = d3.select(this.config.parentElementSelector);

    this.chart = this.svg
      .append("g")
      .attr(
        "transform",
        `translate(${this.config.margin.left},${this.config.margin.top / 2})`
      );

    this.dataGroup = this.chart.append("g").attr("class", "data-group");

    this.xScale = d3
      .scaleBand()
      .domain(Object.keys(this.yearCountMap))
      .range([0, this.width])
      .padding(0.2);

    this.xAxis = d3.axisBottom().scale(this.xScale);

    this.xAxisG = this.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${this.height})`);

    this.yScale = d3
      .scaleLinear()
      .domain(
        d3.extent(Object.keys(this.yearCountMap), (k) => this.yearCountMap[k])
      )
      .range([this.height, 0]);

    this.yAxis = d3.axisLeft().scale(this.yScale);

    this.yAxisG = this.chart.append("g").attr("class", "axis y-axis");

    const extent = [
      [0, 0],
      [this.width, this.height],
    ];
    this.brush = d3
      .brushX()
      .handleSize(8)
      .extent(extent)
      .on("end", (event) => this.brushing(event));
    this.chart.call(this.brush);

    this.updateVis();

    this.selection = this.snappedSelection(this.xScale, [
      Math.min(...Object.keys(this.yearCountMap)),
    ]);
    this.chart.call(this.brush.move, this.selection);
    this.triggerDataUpdate();
  }

  updateVis() {
    this.setWidthAndHeight();

    this.xScale.domain(Object.keys(this.yearCountMap)).range([0, this.width]);
    this.yScale
      .domain(
        d3.extent(Object.keys(this.yearCountMap), (k) => this.yearCountMap[k])
      )
      .range([this.height, 0]);

    this.dataGroup
      .selectAll(".data-point")
      .data(Object.keys(this.yearCountMap))
      .join("rect")
      .attr("class", "data-point")
      .attr("x", (k) => this.xScale(k))
      .attr("y", (k) => this.yScale(this.yearCountMap[k]))
      .attr("width", this.xScale.bandwidth())
      .attr("height", (k) => this.height - this.yScale(this.yearCountMap[k]))
      .attr("fill", "orange");

    // update bars
    this.dataGroup.selectAll(".data-point").attr("opacity", (k) => {
      return !this.selectedYears || this.selectedYears.includes(`${k}`)
        ? 1
        : 0.4;
    });

    this.xAxis.tickValues(this.xScale.domain().filter((d, i) => !(i % 3)));
    this.xAxisG.call(this.xAxis);
    this.yAxisG.call(this.yAxis);

    this.svg
      .select(".overlay")
      .on("mousemove", (event, k) => this.mouseOverTooltipCB(event))
      .on("mouseleave", () => this.mouseLeaveTooltipCB());
    this.svg
      .select(".selection")
      .on("mousemove", (event, k) => this.mouseOverTooltipCB(event))
      .on("mouseleave", () => this.mouseLeaveTooltipCB());

    const tooltip = d3.select("#tooltip");
    tooltip.on("mouseover", () => {
      tooltip.style("opacity", 1).style("pointer-events", "all");
    });
    tooltip.on("mouseleave", () => {
      tooltip.style("opacity", 0).style("pointer-events", "none");
    });
  }

  play() {
    if (this.playInterval) {
      clearInterval(this.playInterval);
    }

    const baseSpeed = 1000;
    let speed = baseSpeed;
    if (this.timelineSpeed === "extraSlow") {
      speed = baseSpeed + baseSpeed * 0.25;
    } else if (this.timelineSpeed === "slow") {
      speed = baseSpeed + baseSpeed * 0.5;
    } else if (this.timelineSpeed === "fast") {
      speed = baseSpeed / 2;
    } else if (this.timelineSpeed === "fastest") {
      speed = baseSpeed / 5;
    }

    const moveSelection1Year = (minYearInSelection) => {
      const maxYear = Math.max(...this.data.map((d) => d.year));

      if (minYearInSelection === maxYear) {
        clearInterval(this.playInterval);
        return;
      }

      let nextClosestYear = minYearInSelection + 1;
      if (formData.hideYearsWithoutData) {
        nextClosestYear = null;
        Object.keys(this.yearCountMap).forEach((k) => {
          if (
            k > minYearInSelection &&
            (k < nextClosestYear || nextClosestYear == null)
          ) {
            nextClosestYear = k;
          }
        });

        if (!nextClosestYear) {
          clearInterval(this.playInterval);
          return;
        }
      }

      this.selection = this.snappedSelection(this.xScale, [nextClosestYear]);
      this.chart.call(this.brush.move, this.selection);
      this.triggerDataUpdate();
      this.updateVis();
    };

    const minYearInSelection =
      Math.min(...(this.selectedYears ?? this.data.map((d) => d.year))) - 1;
    moveSelection1Year(minYearInSelection);

    this.playInterval = setInterval(() => {
      const minYearInSelection = Math.min(
        ...(this.selectedYears ?? this.data.map((d) => d.year))
      );
      moveSelection1Year(minYearInSelection);
    }, speed);
  }

  pause() {
    clearInterval(this.playInterval);
  }

  brushing(event) {
    if (!event.selection && !event.sourceEvent) return;

    event.sourceEvent?.preventDefault();
    event.sourceEvent?.stopPropagation();

    const singleSelect = !event.selection;
    const [s0, s1] = !singleSelect
      ? event.selection
      : [1, 2].fill(event.sourceEvent.offsetX);

    this.selectYearsFromBrush(s0, s1, singleSelect, event);
  }

  filteredDomain(scale, min, max, singleSelect) {
    let dif = scale(d3.min(scale.domain())) - scale.range()[0],
      iMin = min - dif < 0 ? 0 : Math.round((min - dif) / this.xScale.step()),
      iMax = Math.round((max - dif) / this.xScale.step());
    if (iMax == iMin) --iMin; // It happens with empty selections.

    if (singleSelect) {
      const margindiff = Math.floor(
        this.config.margin.left / this.xScale.bandwidth()
      );
      return [
        scale.domain()[
          Math.round((min - dif) / this.xScale.step()) !== iMin
            ? iMin - (margindiff - 1)
            : iMin - margindiff
        ],
      ];
    }

    return scale.domain().slice(iMin, iMax);
  }

  snappedSelection(bandScale, domain) {
    const min = d3.min(domain),
      max = d3.max(domain);
    return [bandScale(min), bandScale(max) + bandScale.bandwidth()];
  }

  setWidthAndHeight() {
    this.width =
      this.config.parentElement.getBoundingClientRect().width -
      this.config.margin.left -
      this.config.margin.right;
    this.height =
      this.config.parentElement.getBoundingClientRect().height -
      this.config.margin.top -
      this.config.margin.bottom;

    requestAnimationFrame(() => {
      this.brush?.extent([
        [0, 0],
        [this.width, this.height],
      ]);
      this.chart.call(this.brush);
      if (this.brush && this.xScale && this.selectedYears) {
        this.selection = this.snappedSelection(this.xScale, this.selectedYears);
        this.chart?.call(this.brush.move, this.selection);
      }
    });
  }

  selectYearsFromBrush(s0, s1, singleSelect, event) {
    this.selectedYears = this.filteredDomain(this.xScale, s0, s1, singleSelect);

    this.selection = this.snappedSelection(this.xScale, this.selectedYears);

    if (event && event.sourceEvent && event.type === "end") {
      this.chart.transition().call(event.target.move, this.selection);
      this.updateVis();
    }

    this.triggerDataUpdate();
  }

  triggerDataUpdate() {
    const preData = [...data];
    data = processedData.filter(
      (d) => !this.selectedYears || this.selectedYears.includes(`${d.year}`)
    );
    updateAllVis(JSON.stringify(data) !== JSON.stringify(preData));
  }

  handleTimelineControls() {
    const controls = document.getElementById("timeline-controls");

    const controlsTop = document.createElement("div");
    controlsTop.classList.add("controls-top");
    controlsTop.innerHTML = `
         <div class="buttons">
            <button id="play" type="button">
               <i class="fas fa-play"></i>
            </button>
            <button id="pause" type="button">
               <i class="fas fa-pause"></i>
            </button>
         </div>
      `;

    this.timelineSpeedControl = createSelect(timelineSpeeds, "Timeline Speed");
    this.timelineSpeedControl.querySelector("select").value = "normal";
    controlsTop.append(this.timelineSpeedControl);

    const controlsBottom = document.createElement("div");
    controlsBottom.classList.add("controls-bottom");
    this.hideYearsWithoutDataCheckbox =
      this.buildHideYearsWithoutDataCheckbox();
    controlsBottom.append(this.hideYearsWithoutDataCheckbox);

    controls.append(controlsTop);
    controls.append(controlsBottom);

    controls.addEventListener("click", (event) => {
      // Prevent click propogations from causing brush selection to be cleared
      event.stopPropagation();
      event.preventDefault();
    });

    this.timelineSpeedControl.addEventListener("change", () => {
      this.timelineSpeed =
        this.timelineSpeedControl.querySelector("select").value;
      if (this.playInterval !== undefined) {
        // Trigger play again to restart with correct speed
        this.play();
      }
    });

    document.getElementById("play").addEventListener("click", (event) => {
      this.play();
    });
    document.getElementById("pause").addEventListener("click", (event) => {
      this.pause();
    });
    this.hideYearsWithoutDataCheckbox.addEventListener("click", (event) => {
      const checked =
        !this.hideYearsWithoutDataCheckbox.querySelector("input").checked;
      this.setHideYearsWithoutDataCheckbox(checked);
    });
  }

  buildHideYearsWithoutDataCheckbox() {
    const checkboxContainer = document.createElement("div");
    checkboxContainer.id = "no-data-year-checkbox";

    const input = document.createElement("input");
    input.name = "no-data-year-checkbox";
    input.type = "checkbox";

    input.value = formData.hideYearsWithoutData;

    input.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.setHideYearsWithoutDataCheckbox(e.target.checked);
    });

    const label = document.createElement("label");
    label.setAttribute("for", "no-data-year-checkbox");
    label.innerText = "Hide years without data";

    checkboxContainer.append(input);
    checkboxContainer.append(label);

    return checkboxContainer;
  }

  setHideYearsWithoutDataCheckbox(checked) {
    requestAnimationFrame(() => {
      this.hideYearsWithoutDataCheckbox.querySelector("input").checked =
        checked;
      formData.hideYearsWithoutData = checked;
      this.buildYearCountMap();
      this.updateVis();
      this.selectedYears = this.selectedYears.filter((y) =>
        Object.keys(this.yearCountMap).includes(y)
      );
      this.selection = this.snappedSelection(this.xScale, this.selectedYears);

      if (
        this.selection[0] === null ||
        this.selection[0] === undefined ||
        isNaN(this.selection[0]) ||
        this.selection[1] === null ||
        this.selection[1] === undefined ||
        isNaN(this.selection[1])
      ) {
        this.selection = this.snappedSelection(this.xScale, [
          Math.min(...Object.keys(this.yearCountMap)),
        ]);
      }
      this.chart.call(this.brush.move, this.selection);
      this.triggerDataUpdate();

      if (this.playInterval !== undefined) {
        // Trigger play again to restart with correct year skips
        this.play();
      }
    });
  }

  buildYearCountMap() {
    const years = this.data.map((d) => d.year);
    this.yearCountMap = {};
    if (!formData.hideYearsWithoutData) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      for (let i = minYear; i <= maxYear; i++) {
        this.yearCountMap[i] = 0;
      }
    }
    this.data.forEach((d) => {
      if (!this.yearCountMap[d.year]) {
        this.yearCountMap[d.year] = 0;
      }
      this.yearCountMap[d.year]++;
    });
  }

  mouseOverTooltipCB(event) {
    const tooltip = d3.select("#tooltip");
    const tooltipElm = tooltip.node();
    const tooltipBounds = tooltipElm.getBoundingClientRect();
    const chartBounds = this.config.parentElement.getBoundingClientRect();
    const { pageX, pageY } = event;

    const domain = this.xScale.domain();
    const xDomainIndex = Math.ceil(
      (event.clientX - this.config.margin.left - this.config.margin.right) /
        this.xScale.step()
    );

    const year = domain[Math.min(xDomainIndex, domain.length - 1)];
    tooltip
      .style("pointer-events", "all")
      .style("opacity", "1")
      .style(
        "left",
        Math.min(
          pageX,
          chartBounds.x + chartBounds.width - tooltipBounds.width
        ) + "px"
      )
      .style(
        "top",
        Math.min(
          pageY,
          chartBounds.y + chartBounds.height - tooltipBounds.height
        ) +
          10 +
          "px"
      ).html(`
            <small><strong>${year}</strong></small>
            <p>${this.yearCountMap[year]} Occurrences</p>
          `);
  }

  mouseLeaveTooltipCB(event) {
    d3.select("#tooltip").style("opacity", "0").style("pointer-events", "none");
  }
}
