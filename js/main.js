
let shapes = [];
let totdconversion = ["night","morning","afternoon","evening"];

d3.csv('data/ufo_sightings.csv')
.then(data => {
    data.forEach(d => {
      //console.log(d);
      d.latitude = +d.latitude; //make sure these are not strings
      d.longitude = +d.longitude; //make sure these are not strings
      let n = d.date_time.indexOf("/", d.date_time.indexOf("/") + 1)+1;
      d.year = d.date_time.slice(n,n+4);
      n = d.date_time.indexOf("/");
      d.month = d.date_time.slice(0,n);
      n = d.date_time.indexOf(" ")+1;
      let n2 = d.date_time.indexOf(":");
      let hour = +(d.date_time.slice(n, n2));
      if(hour <= 5 || hour >= 21){d.totd = 0}
      else if(hour >= 6 && hour <= 11){ d.totd = 1}
      else if(hour >= 12 && hour <= 17){ d.totd = 2}
      else if(hour >= 18 && hour <= 20){ d.totd = 3}
      else {console.log(d);}
      if (shapes.includes(d.ufo_shape)){
        d.shape = shapes.indexOf(d.ufo_shape);
      }
      else {
        shapes.push(d.ufo_shape);
        d.shape = shapes.length-1;
      }
      //console.log(d);
    });
    //console.log(shapes);
    // Initialize chart and then show it
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);


  })
  .catch(error => console.error(error));


document.getElementById("colorby").onchange = function(){
  leafletMap.updateVis();
}

document.getElementById("mapimg").onchange = function(){
  leafletMap.updateVis();
}