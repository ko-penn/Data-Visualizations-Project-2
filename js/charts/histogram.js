export class Histogram {
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

      window.addEventListener('resize', () => {
         this.setWidthAndHeight();
         this.updateVis();
      });
   }

   initVis() {
      const idInParent = document.querySelector(this.config.id);
      if (!idInParent) {
         this.mainDiv = d3
            .select(this.config.parentElementSelector)
            .append('div')
            .attr('height', '100%')
            .attr('width', '100%')
            .attr('id', this.config.id)
            .style('display', 'grid')
            .style(
               'grid-template-areas',
               `
                  "y chart chart chart chart"
                  "y chart chart chart chart"
                  "y chart chart chart chart"
                  "y chart chart chart chart"
                  ". x x x x"
                  ". legend legend legend legend"
               `
            )
            .style('grid-template-columns', 'max-content repeat(4, 1fr)')
            .style(
               'grid-template-rows',
               'repeat(4, 1fr) repeat(2, max-content)'
            );
      } else {
         this.mainDiv = d3.select(
            `${this.config.parentElementSelector} #${this.config.id}`
         );
      }

      this.setWidthAndHeight();

      this.mainDiv
         .append('p')
         .attr('class', 'y-axis-title')
         .style('grid-area', 'y')
         .style('writing-mode', 'vertical-rl')
         .style('text-orientation', 'mixed')
         .style('text-align', 'center')
         .style('transform', 'rotate(180deg)')
         .text(this.config.yAxisTitle);

      this.mainDiv
         .append('p')
         .attr('class', 'x-axis-title')
         .style('grid-area', 'x')
         .style('text-align', 'center')
         .text(this.config.xAxisTitle);

      this.svg = this.mainDiv
         .append('svg')
         .attr('height', '100%')
         .attr('width', '100%')
         .style('grid-area', 'chart');

      this.chart = this.svg
         .append('g')
         .attr(
            'transform',
            `translate(${this.config.margin.left},${
               this.config.margin.top / 2
            })`
         );

      this.dataGroup = this.chart
         .append('g')
         .attr('class', 'data-group')
         .attr('clip-path', `url(#${this.config.id}-clip)`);

      this.xScale = d3.scaleBand().range([0, this.width]).padding(0.2);

      this.xAxis = d3.axisBottom().scale(this.xScale);

      this.xAxisG = this.chart
         .append('g')
         .attr('class', 'axis x-axis')
         .attr('clip-path', `url(#${this.config.id}-clip)`);

      this.yScale = d3.scaleLinear().range([this.height, 0]);

      this.yAxis = d3.axisLeft().scale(this.yScale);

      this.yAxisG = this.chart.append('g').attr('class', 'axis y-axis');

      this.clipPath = this.svg
         .append('defs')
         .append('clipPath')
         .attr('id', `${this.config.id}-clip`)
         .append('rect')
         .attr('width', this.width)
         .attr('height', this.height);

      this.brush = d3
         .brushX()
         .handleSize(8)
         .on('end', (event) => this.brushing(event));
      this.chart.call(this.brush);

      this.disclaimer = this.svg
         .append('g')
         .attr('class', 'disclaimer')
         .attr('text-anchor', 'middle');
      this.disclaimer
         .append('text')
         .attr('fill', 'red')
         .attr('font-size', '.75em')
         .attr('font-weight', 'bold')
         .text(`No data points for selection`);

      this.colorScale = d3.scaleOrdinal(d3.schemeTableau10);

      this.updateVis();
   }

   updateVis() {
      this.setWidthAndHeight();

      this.buildBins();

      /*const selectedLegendGroups = this.legendBuilder?.selectedLegendGroups;
      const freqMapKeys = Object.keys(this.freqMap).filter(
         (k) =>
            (!formData.hideFrequencyCategoriesWithoutData || this.freqMap[k]) &&
            (!selectedLegendGroups || selectedLegendGroups.has(k))
      );*/

      this.colorScale.domain([0, this.bins.length]);

      const xBinMap = (b) =>
         b.min === null || b.max === null
            ? ''
            : b.min === b.max
            ? b.min
            : `${b.min} - ${b.max}`;

      this.xScale
         .domain(this.bins.map((b) => xBinMap(b)))
         .range([0, this.width]);
      this.yScale
         .domain([
            0,
            d3.max(this.bins, (bin) => {
               return bin.counts.length;
            }),
         ])
         .range([this.height, 0])
         .nice();
      this.dataGroup
         .selectAll('.data-point')
         .data(this.bins)
         .join('rect')
         .attr('class', 'data-point')
         .transition()
         .attr('x', (bin) => this.xScale(xBinMap(bin)))
         .attr('y', (bin) => this.yScale(bin.counts.length))
         .attr('width', (bin) => this.xScale.bandwidth())
         .attr('height', (bin) => this.height - this.yScale(bin.counts.length))
         .attr('fill', (bin, i) => this.colorScale(i));

      this.updateDisclaimer();

      this.xAxisG.call(this.xAxis);
      this.yAxisG.call(this.yAxis);

      this.svg
         .select('.overlay')
         .on('mousemove', (event, k) => this.mouseOverTooltipCB(event))
         .on('mouseleave', () => this.mouseLeaveTooltipCB());
      this.svg
         .select('.selection')
         .on('mousemove', (event, k) => this.mouseOverTooltipCB(event))
         .on('mouseleave', () => this.mouseLeaveTooltipCB());

      const tooltip = d3.select('#tooltip');
      tooltip.on('mouseover', () => {
         tooltip.style('opacity', 1).style('pointer-events', 'all');
      });
      tooltip.on('mouseleave', () => {
         tooltip.style('opacity', 0).style('pointer-events', 'none');
      });
   }

   updateData(data) {
      this.data = data;
      this.updateVis();
   }

   updateDisclaimer() {
      let total = 0;
      this.bins.forEach((c) => {
         total = total + c.length;
      });
      if (total <= 0) {
         this.disclaimer
            .attr('class', 'disclaimer show')
            .attr(
               'transform',
               `translate(${this.width / 2 + this.config.margin.left}, ${
                  this.height / 2 + this.config.margin.top
               })`
            );
      } else {
         this.disclaimer.attr('class', 'disclaimer hide');
      }
   }

   setWidthAndHeight() {
      const svg = document.getElementById(this.config.id)?.querySelector('svg');
      if (svg) {
         this.width =
            svg.getBoundingClientRect().width -
            this.config.margin.left -
            this.config.margin.right;
         this.height =
            svg.getBoundingClientRect().height -
            this.config.margin.top -
            this.config.margin.bottom;

         this.xAxisG?.attr('transform', `translate(0,${this.height})`);

         this.clipPath?.attr('width', this.width).attr('height', this.height);

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

   buildBins() {
      const encounter_lengths = this.data
         .filter((d) => !isNaN(d.encounter_length))
         .map((d) => d.encounter_length);

      if (encounter_lengths.length === 0) {
         this.bins = [];
         return;
      }
      if (encounter_lengths.length === 1) {
         this.bins = [
            {
               counts: encounter_lengths,
               max: encounter_lengths[0],
               min: encounter_lengths[0],
            },
         ];
         return;
      }

      const mean = d3.mean(encounter_lengths);
      const deviation = d3.deviation(encounter_lengths);

      const minLength = Math.min(...encounter_lengths);
      const minDev = Math.floor((minLength - mean) / deviation);
      const maxLength = Math.max(...encounter_lengths);
      const maxDev = Math.floor((maxLength - mean) / deviation);

      const numBins = maxDev - minDev;
      const binCounts = Array.from({ length: numBins }, () => []);

      encounter_lengths.forEach((length) => {
         const dev = Math.floor((length - mean) / deviation);
         binCounts[Math.min(dev - minDev, numBins - 1)].push(length);
      });

      this.bins = binCounts.map((counts) => ({
         counts,
         max: counts.length > 0 ? Math.max(...counts) : null,
         min: counts.length > 0 ? Math.min(...counts) : null,
      }));
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
   }

   filteredDomain(scale, min, max, singleSelect) {
      const x0Index = Math.ceil(min / (scale.step())) - 1;
      const x1Index = Math.ceil(max / (scale.step())) - 1;
      const bin0 = this.bins[x0Index];
      const bin1 = this.bins[x1Index];

      return bin0 && bin1 ? [bin0.min, bin1.max] : null;
   }


   selectDomainFromBrush(s0, s1, singleSelect, event) {
      this.selectedDomain = this.filteredDomain(
         this.xScale,
         s0,
         s1,
         singleSelect
      );

      if (event && event.sourceEvent && event.type === 'end') {
         this.updateVis();
      }
      handleGlobalFilterChange();

      // Reset brush selection since data change will cause data under selection to move
      this.chart.call(this.brush.move, null);
   }

   mouseOverTooltipCB(event) {
      const tooltip = d3.select('#tooltip');
      const tooltipElm = tooltip.node();
      const tooltipBounds = tooltipElm.getBoundingClientRect();
      const chartBounds = this.config.parentElement.getBoundingClientRect();
      const { pageX, pageY } = event;

      const domain = this.xScale.domain();
      let xDomainIndex = Math.ceil(
         (event.offsetX -
            this.config.margin.left )/
            this.xScale.step()
      -1);

      if(xDomainIndex===-0){
         xDomainIndex = 0;
      }

      const domainSelection =
         domain[Math.max(Math.min(xDomainIndex, domain.length - 1), 0)];

      tooltip
         .style('pointer-events', 'all')
         .style('opacity', '1')
         .style(
            'left',
            Math.min(
               pageX,
               chartBounds.x + chartBounds.width - tooltipBounds.width
            ) + 'px'
         )
         .style(
            'top',
            Math.min(
               pageY,
               chartBounds.y + chartBounds.height - tooltipBounds.height
            ) +
               10 +
               'px'
         ).html(`
            <small><strong>${
               domainSelection != null && this.bins[xDomainIndex] != null ? domainSelection : 'undefined'
            }</strong></small>
            <p>${
               this.bins[xDomainIndex] != null ? this.bins[xDomainIndex].counts.length : 'undefined'
            } Occurrence${
               this.bins[xDomainIndex] != null
                  ? this.bins[xDomainIndex].counts.length === 1
                     ? ''
                     : 's'
                  : 's'
      }</p>
            <p>Average: ${
               this.bins[xDomainIndex] != null
                  ? this.bins[xDomainIndex].counts.length > 0
                     ? this.average(
                        this.bins[xDomainIndex].counts
                       )
                     : 'NA'
                  : 'NA'
            }</p>
            <p>Minimum: ${
               this.bins[xDomainIndex] != null
                  ? this.bins[xDomainIndex].counts.length > 0
                     ? this.bins[xDomainIndex].min
                     : 'NA'
                  : 'NA'
            }</p>
            <p>Maximum: ${
               this.bins[xDomainIndex] != null
                  ? this.bins[xDomainIndex].counts.length > 0
                     ? this.bins[xDomainIndex].max
                     : 'NA'
                  : 'NA'
            }</p>
         `);
   }

   mouseLeaveTooltipCB(event) {
      d3.select('#tooltip')
         .style('opacity', '0')
         .style('pointer-events', 'none');
   }

   average(data) {
      let avg = data.reduce((a, b) => a + b) / data.length;
      return avg;
   }

   minimum(data) {
      let min = (arr) => Math.min(...arr);
      return min(data);
   }

   maximum(data) {
      let max = (arr) => Math.max(...arr);
      return max(data);
   }
}