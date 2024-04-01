export class WordSearch {
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


    initVis(){
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

         
    }

    


}