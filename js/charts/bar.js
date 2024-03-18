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

      this.buildFreqMap();

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

      this.legend = this.mainDiv
         .append('div')
         .attr('class', 'legend')
         .style('grid-area', 'legend')
         .style('text-align', 'center');

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
         .attr('clip-path', 'url(#clip)');

      this.xScale = d3.scaleBand().range([0, this.width]).padding(0.2);

      this.xAxis = d3.axisBottom().scale(this.xScale);

      this.xAxisG = this.chart
         .append('g')
         .attr('class', 'axis x-axis')
         .attr('clip-path', 'url(#clip)');

      this.yScale = d3.scaleLinear().range([this.height, 0]);

      this.yAxis = d3.axisLeft().scale(this.yScale);

      this.yAxisG = this.chart.append('g').attr('class', 'axis y-axis');

      this.clipPath = this.svg
         .append('defs')
         .append('clipPath')
         .attr('id', 'clip')
         .append('rect')
         .attr('width', this.width)
         .attr('height', this.height);

      const extent = [
         [0, 0],
         [this.width, this.height],
      ];
      this.zoom = d3
         .zoom()
         .scaleExtent([1, 1000])
         .translateExtent(extent)
         .extent(extent)
         .on('zoom', (event) => this.zoomed(event));
      this.svg.call(this.zoom);

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

      this.updateVis();
   }

   updateVis() {
      this.setWidthAndHeight();

      this.xScale
         .domain(Object.keys(this.freqMap).filter((k) => this.freqMap[k]))
         .range([0, this.width]);
      this.yScale
         .domain([
            0,
            d3.max(
               Object.keys(this.freqMap).filter((k) => this.freqMap[k]),
               (k) => this.freqMap[k]
            ),
         ])
         .range([this.height, 0]);
      this.dataGroup
         .selectAll('.data-point')
         .data(Object.keys(this.freqMap).filter((k) => this.freqMap[k]))
         .join('rect')
         .attr('class', 'data-point')
         .transition()
         .attr('x', (k) => this.xScale(k))
         .attr('y', (k) => this.yScale(this.freqMap[k]))
         .attr('width', this.xScale.bandwidth())
         .attr('height', (k) => this.height - this.yScale(this.freqMap[k]))
         .attr('fill', 'orange');

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
      if (this.data.length <= 0) {
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

   updateLegend() {
      // TODO: build legend html from color scale/domain
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

         const extent = [
            [0, 0],
            [this.width, this.height],
         ];
         this.zoom?.translateExtent(extent).extent(extent);

         this.xAxisG?.attr('transform', `translate(0,${this.height})`);

         this.clipPath?.attr('width', this.width).attr('height', this.height);

         this.xScale?.range([0, this.width]);
         this.yScale?.range([this.height, 0]);
      }
   }

   buildFreqMap() {
      this.freqMap = {};
      let values = [];
      if (this.config.key === 'totd') {
         values = Object.values(timeOfTheDay);
      } else if (this.config.key === 'ufo_shape') {
         values = Array.from(shapes);
      } else if (this.config.key === 'season') {
         values = Array.from(seasons);
      }

      values.forEach((v) => {
         this.freqMap[v] = 0;
      });

      this.data.forEach((d) => {
         this.freqMap[d[this.config.key]]++;
      });
   }

   zoomed(event) {
      this.xScale.range([0, this.width].map((d) => event.transform.applyX(d)));

      this.dataGroup
         .selectAll('.data-point')
         .data(Object.keys(this.freqMap).filter((k) => this.freqMap[k]))
         .join('rect')
         .attr('class', 'data-point')
         .attr('x', (k) => this.xScale(k))
         .attr('width', this.xScale.bandwidth());

      this.svg.selectAll('.x-axis').call(this.xAxis);
   }
}
