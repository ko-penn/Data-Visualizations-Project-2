import { LeafletMap } from './charts/index.mjs';
import { HeaderFormBuilder } from './helpers/index.mjs';

document.addEventListener('DOMContentLoaded', () => {
   main();
});

async function main() {
   rawData = await d3.csv('data/ufo_sightings.csv');

   // TODO: this should be removed, only added to speed up development since lots of dots get laggy
   rawData = rawData.slice(0, 2000);

   formBuilder = new HeaderFormBuilder();

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

      d.date_time = new Date(d.date_time);
      d.year = d.date_time.getYear();
      d.month = d.date_time.getMonth();
      d.hour = d.date_time.getHours();

      if (d.hour <= 5 || d.hour >= 21) {
         d.totd = timeOfTheDay['night'];
      } else if (d.hour >= 6 && d.hour <= 11) {
         d.totd = timeOfTheDay['morning'];
      } else if (d.hour >= 12 && d.hour <= 17) {
         d.totd = timeOfTheDay['afternoon'];
      } else if (d.hour >= 18 && d.hour <= 20) {
         d.totd = timeOfTheDay['evening'];
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
