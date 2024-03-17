export class Bar {
   constructor(_config, _data) {
      this.config = {
         parentElementSelector: _config.parentElementSelector,
         parentElement: document.querySelector(_config.parentElementSelector),
         margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
         id: _config.id,
         key: _config.key,
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
            .attr('id', this.config.id);
      } else {
         this.mainDiv = d3.select(
            `${this.config.parentElementSelector} #${this.config.id}`
         );
      }

      this.buildFreqMap();

      this.setWidthAndHeight();

      this.svg = d3
         .select(`#${this.config.id}`)
         .append('svg')
         .attr('height', '100%')
         .attr('width', '100%');

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
         .attr('transform', `translate(0,${this.height})`)
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
         .attr(
            'transform',
            `translate(${this.width / 2 + this.config.margin.left}, ${
               this.height / 2 + this.config.margin.top
            })`
         )
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
         .domain(
            d3.extent(
               Object.keys(this.freqMap).filter((k) => this.freqMap[k]),
               (k) => this.freqMap[k]
            )
         )
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

   setWidthAndHeight() {
      this.width =
         document.getElementById(this.config.id).getBoundingClientRect().width -
         this.config.margin.left -
         this.config.margin.right;
      this.height =
         document.getElementById(this.config.id).getBoundingClientRect()
            .height -
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

   buildFreqMap() {
      this.freqMap = {};
      let values = [];
      if (this.config.key === 'totd') {
         values = Object.values(timeOfTheDay);
      } else if (this.config.key === 'ufo_shape') {
         values = Array.from(shapes);
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
