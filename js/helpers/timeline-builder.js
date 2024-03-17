export class TimelineBuilder {
   constructor(_config, _data) {
      this.config = {
         parentElementSelector: _config.parentElementSelector,
         parentElement: document.querySelector(_config.parentElementSelector),
         margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
      };
      this.data = _data;
      this.initVis();

      this.config.parentElement.parentNode.addEventListener('click', () => {
         this.chart.call(this.brush.move, null);
         this.selectedYears = null;
         this.updateVis();
         this.triggerDataUpdate();
      });
      window.addEventListener('resize', () => {
         this.setWidthAndHeight();
         this.updateVis();
      });
   }

   initVis() {
      this.setWidthAndHeight();

      const years = this.data.map((d) => d.year);
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      this.yearCountMap = {};
      for (let i = minYear; i <= maxYear; i++) {
         this.yearCountMap[i] = 0;
      }
      this.data.forEach((d) => {
         this.yearCountMap[d.year]++;
      });

      this.svg = d3.select(this.config.parentElementSelector);

      this.chart = this.svg
         .append('g')
         .attr(
            'transform',
            `translate(${this.config.margin.left},${
               this.config.margin.top / 2
            })`
         );

      this.dataGroup = this.chart.append('g').attr('class', 'data-group');

      this.xScale = d3
         .scaleBand()
         .domain(Object.keys(this.yearCountMap))
         .range([0, this.width])
         .padding(0.2);

      this.xAxis = d3.axisBottom().scale(this.xScale);

      this.xAxisG = this.chart
         .append('g')
         .attr('class', 'axis x-axis')
         .attr('transform', `translate(0,${this.height})`);

      this.yScale = d3
         .scaleLinear()
         .domain(
            d3.extent(
               Object.keys(this.yearCountMap),
               (k) => this.yearCountMap[k]
            )
         )
         .range([this.height, 0]);

      this.yAxis = d3.axisLeft().scale(this.yScale);

      this.yAxisG = this.chart.append('g').attr('class', 'axis y-axis');

      const extent = [
         [0, 0],
         [this.width, this.height],
      ];
      this.brush = d3
         .brushX()
         .handleSize(8)
         .extent(extent)
         .on('end', (event) => this.brushing(event));
      this.chart.call(this.brush);

      this.updateVis();

      this.selection = this.snappedSelection(this.xScale, [minYear]);
      this.chart.call(this.brush.move, this.selection);
      this.triggerDataUpdate();
   }

   updateVis() {
      this.brush.extent([
         [0, 0],
         [this.width, this.height],
      ]);

      this.xScale.domain(Object.keys(this.yearCountMap)).range([0, this.width]);
      this.yScale
         .domain(
            d3.extent(
               Object.keys(this.yearCountMap),
               (k) => this.yearCountMap[k]
            )
         )
         .range([this.height, 0]);

      this.dataGroup
         .selectAll('.data-point')
         .data(Object.keys(this.yearCountMap))
         .join('rect')
         .attr('class', 'data-point')
         .attr('x', (k) => this.xScale(k))
         .attr('y', (k) => this.yScale(this.yearCountMap[k]))
         .attr('width', this.xScale.bandwidth())
         .attr('height', (k) => this.height - this.yScale(this.yearCountMap[k]))
         .attr('fill', 'orange');

      // update bars
      d3.selectAll('.data-point').attr('opacity', (k) => {
         return !this.selectedYears || this.selectedYears.includes(`${k}`)
            ? 1
            : 0.4;
      });

      this.xAxis.tickValues(this.xScale.domain().filter((d, i) => !(i % 3)));
      this.xAxisG.call(this.xAxis);
      this.yAxisG.call(this.yAxis);
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
         iMin =
            min - dif < 0 ? 0 : Math.round((min - dif) / this.xScale.step()),
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
   }

   selectYearsFromBrush(s0, s1, singleSelect, event) {
      this.selectedYears = this.filteredDomain(
         this.xScale,
         s0,
         s1,
         singleSelect
      );

      this.selection = this.snappedSelection(this.xScale, this.selectedYears);

      if (event && event.sourceEvent && event.type === 'end') {
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
}
