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
   data = rawData.map((d) => {
      if (d.latitude !== undefined) {
         d.latitude = +d.latitude; //make sure these are not strings
      }
      if (d.longitude !== undefined) {
         d.longitude = +d.longitude; //make sure these are not strings
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
