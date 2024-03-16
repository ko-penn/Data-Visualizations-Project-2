import { LeafletMap } from './charts/index.mjs';

document.addEventListener('DOMContentLoaded', () => {
   main();
});

async function main() {
   rawData = await d3.csv('data/ufo_sightings.csv');
   processData();
   initializeCharts();
}

function processData() {
   let shapes = [];
   let totdconversion = ['night', 'morning', 'afternoon', 'evening'];

   data = rawData.map((d) => {
      if (d.latitude !== undefined) {
         d.latitude = +d.latitude; //make sure these are not strings
      }
      if (d.longitude !== undefined) {
         d.longitude = +d.longitude; //make sure these are not strings
      }

      let n = d.date_time.indexOf('/', d.date_time.indexOf('/') + 1) + 1;
      d.year = d.date_time.slice(n, n + 4);
      n = d.date_time.indexOf('/');
      d.month = d.date_time.slice(0, n);
      n = d.date_time.indexOf(' ') + 1;
      let n2 = d.date_time.indexOf(':');
      let hour = +d.date_time.slice(n, n2);
      if (hour <= 5 || hour >= 21) {
         d.totd = 0;
      } else if (hour >= 6 && hour <= 11) {
         d.totd = 1;
      } else if (hour >= 12 && hour <= 17) {
         d.totd = 2;
      } else if (hour >= 18 && hour <= 20) {
         d.totd = 3;
      }

      if (shapes.includes(d.ufo_shape)) {
         d.shape = shapes.indexOf(d.ufo_shape);
      } else {
         shapes.push(d.ufo_shape);
         d.shape = shapes.length - 1;
      }

      return d;
   });
}

function initializeCharts() {
   map = new LeafletMap(
      {
         parentElementSelector: '#charts',
         id: 'my-map',
         margin: '2em',
      },
      data
   );

   // Build bar charts

   // Build scatter plot charts

   // Build word cloud

   // TODO: remove this, just testing scrolling is working
   const d = document.createElement('div');
   d.innerText = `l;Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid,
     dignissimos. Itaque sint praesentium voluptas, iste esse illum eius
     aperiam magni atque eum voluptatem ullam voluptate explicabo dolor enim
     deserunt! Sunt. l;Lorem ipsum dolor sit amet consectetur adipisicing
     elit. Aliquid, dignissimos. Itaque sint praesentium voluptas, iste esse
     illum eius aperiam magni atque eum voluptatem ullam voluptate explicabo
     dolor enim deserunt! Sunt. l;Lorem ipsum dolor sit amet consectetur
     adipisicing elit. Aliquid, dignissimos. Itaque sint praesentium
     voluptas, iste esse illum eius aperiam magni atque eum voluptatem ullam
     voluptate explicabo dolor enim deserunt! Sunt.`;
   document.getElementById('charts').append(d);
}

document.getElementById('colorby').onchange = function () {
   map.updateVis();
};

document.getElementById('mapimg').onchange = function () {
   map.updateVis();
};
