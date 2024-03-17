export class LeafletMap {
   constructor(_config, _data) {
      this.config = {
         parentElementSelector: _config.parentElementSelector,
         parentElement: document.querySelector(_config.parentElementSelector),
         id: _config.id,
         margin: _config.margin ?? '0',
      };
      this.data = _data;
      this.initVis();

      window.addEventListener('resize', () => {
         this.updateVis();
      });
   }

   /**
    * We initialize scales/axes and append static elements, such as axis titles.
    */
   initVis() {
      //this is the base map layer, where we are showing the map background
      const mapLayer = mapLayerUrls[formData.mapImage];
      this.base_layer = L.tileLayer(mapLayer.url, {
         id: 'esri-image',
         attribution: mapLayer.attr,
         ext: 'png',
      });

      const idInParent = document.querySelector(this.config.id);
      if (!idInParent) {
         this.mainDiv = d3
            .select(this.config.parentElementSelector)
            .append('div')
            .attr('id', this.config.id);
      } else {
         this.mainDiv = d3.select(
            `${this.config.parentElementSelector} #${this.config.id}`
         );
      }
      this.mainDiv
         .style('overflow-x', 'hidden')
         .style('margin', this.config.margin);

      this.map = L.map(this.config.id, {
         center: [30, 0],
         zoom: 2,
         layers: [this.base_layer],
      });

      //if you stopped here, you would just have a map

      //initialize svg for d3 to add to map
      L.svg({ clickable: true }).addTo(this.map); // we have to make the svg layer clickable
      this.overlay = d3.select(this.map.getPanes().overlayPane);
      this.svg = this.overlay.select('svg').attr('pointer-events', 'auto');

      //handler here for updating the map, as you zoom in and out
      this.map.on('zoomend', () => {
         this.updateVis();
      });
   }

   updateVis() {
      //want to see how zoomed in you are?
      // console.log(vis.map.getZoom()); //how zoomed am I

      //want to control the size of the radius to be a certain number of meters?
      this.radiusSize = 3;

      // if(this.map.getZoom > 15 ){
      //   metresPerPixel = 40075016.686 * Math.abs(Math.cos(map.getCenter().lat * Math.PI/180)) / Math.pow(2, map.getZoom()+8);
      //   desiredMetersForPoint = 100; //or the uncertainty measure... =)
      //   radiusSize = desiredMetersForPoint / metresPerPixel;
      // }

      if (formData.colorBy === 'year') {
         this.colorScale = d3
            .scaleSequential()
            .domain(d3.extent(this.data, (d) => d.year))
            .interpolator(d3.interpolateViridis);
      } else if (formData.colorBy === 'month') {
         this.colorScale = d3
            .scaleSequential()
            .domain(d3.extent(this.data, (d) => d.month))
            .interpolator(d3.interpolateViridis);
      } else if (formData.colorBy === 'totd') {
         this.colorScale = d3.scaleOrdinal(d3.schemeTableau10);
      } else if (formData.colorBy === 'ufo_shape') {
         this.colorScale = d3.scaleOrdinal(d3.schemeTableau10);
      } else {
         this.colorScale = d3.scaleOrdinal(['steelblue']);
      }

      const { url, attr } = mapLayerUrls[formData.mapImage];
      if (
         url !== this.base_layer._url ||
         attr !== this.base_layer.options.attribution
      ) {
         this.map.removeLayer(this.base_layer);
         this.base_layer = L.tileLayer(url, {
            id: 'base-image',
            attribution: attr,
            ext: 'png',
         });
         this.map.addLayer(this.base_layer);
      }

      //these are the city locations, displayed as a set of dots
      this.dots = this.svg
         .selectAll('circle')
         .data(
            this.data.filter((d) => !isNaN(d.latitude) && !isNaN(d.longitude))
         )
         .join('circle')
         .on('mouseover', function (event, d) {
            //function to add mouseover event
            d3.select(this)
               .transition() //D3 selects the object we have moused over in order to perform operations on it
               .duration('150') //how long we are transitioning between the two states (works like keyframes)
               .attr('r', 4); //change radius

            //create a tool tip
            // Format number with million and thousand separator
            d3
               .select('#tooltip')
               .style('opacity', 1)
               .style('z-index', 1000000).html(`
                  <div>Date Time: ${d.date_time}</div>
                  <div>City Area: ${d.city_area}</div>
                  <div>Description: ${d.description}</div>
                  <div>UFO Shape: ${d.ufo_shape}
               `);
         })
         .on('mousemove', (event) => {
            //position the tooltip
            d3.select('#tooltip')
               .style('left', event.pageX + 10 + 'px')
               .style('top', event.pageY + 10 + 'px');
         })
         .on('mouseleave', function () {
            //function to add mouseover event
            d3.select(this)
               .transition() //D3 selects the object we have moused over in order to perform operations on it
               .duration('150') //how long we are transitioning between the two states (works like keyframes)
               .attr('r', 3); //change radius

            d3.select('#tooltip').style('opacity', 0); //turn off the tooltip
         })
         .on('click', (event, d) => {
            //experimental feature I was trying- click on point and then fly to it
            //this.newZoom =this.map.getZoom()+2;
            // if(this.newZoom > 18)
            // this.newZoom = 18;
            //this.map.flyTo([d.latitude, d.longitude],this.newZoom);
         });

      this.dots
         .attr('fill', (d) => this.colorScale(d[formData.colorBy]))
         .attr('stroke', 'black')
         //Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
         //leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
         //Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
         .attr(
            'cx',
            (d) => this.map.latLngToLayerPoint([d.latitude, d.longitude]).x
         )
         .attr(
            'cy',
            (d) => this.map.latLngToLayerPoint([d.latitude, d.longitude]).y
         )
         .attr('r', this.radiusSize);
   }

   updateData(data) {
      this.data = data;
      this.updateVis();
   }
}
