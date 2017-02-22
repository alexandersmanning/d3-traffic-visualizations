import * as d3 from "d3";
const timeData = require('../assets/data/time.json');


export default () => {
  //this is the time plot to display the traffic per IP over time (time.json)
  
  let margin = {top: 20, right: 120, bottom: 110, left: 70},
      marginScrub = {top: 430, right: 20, bottom: 30, left: 70},
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      heightScrub = 500 - marginScrub.top - marginScrub.bottom
    //separate height variable for the scrub margin
      
  let svg = d3.select("#time-plot")
      .attr("width", width + margin.left + margin.right)
      .attr("height",height + heightScrub + margin.bottom + margin.top)

    //the xScrub variable will be used to have a consistent x axis for the scrub, while the x axis for the main chart will change
  let x = d3.scaleTime().range([0, width]),
      xScrub = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0]),
      yScrub = d3.scaleLinear().range([heightScrub, 0]);

  let parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S");
  

    //global axis variables for both pieces of graph
   let xAxis = d3.axisBottom(x),
       xAxisScrub = d3.axisBottom(xScrub),
       yAxis = d3.axisLeft(y);

  //Using d3's brush function to draw a box on the scrub portion, which will translate to the parameters
  let brush = d3.brushX()
      .extent([[0, 0], [width, heightScrub]])
      .on("brush end", brushed)

  let zoom = d3.zoom()
      .scaleExtent([1, Infinity])
      .translateExtent([[0,0], [width, height]])
      .extent([[0,0], [width, height]])
      .on("zoom", zoomed);

  var color = d3.scaleOrdinal(d3.schemeCategory10); // to generate a different color for each line

  // where the line gets its properties, how it will be interpolated
  let line = d3.line("basis")
    .x(function(d){ return x(d.date)})
    .y(function(d){ return y(d.bytes)});

  //separate line for the scrub, using the different scales for x and y
  let lineScrub = d3.line("basis")
        .x(function(d){ return xScrub(d.date)})
        .y(function(d){ return yScrub(d.bytes)});

  //This is a simple way of setting boundaries, so that as the chart "zooms" in, the data will not go beyond the axis on either side. 
  svg.append("defs").append("clipPath")
     .attr("id", "clip")
     .append("rect")
     .attr("width", width + 4)
     .attr("height", height + 4)
     .attr("y", -4)

  //setting a main view, which will be affected by the scrub
  var mainView = svg.append("g")
    .attr("class", "main-view")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let brushView = svg.append("g")
    .attr("class", "brush-view")
    .attr("transform", "translate(" + marginScrub.left + "," + marginScrub.top + ")");


  // define the x axis and its class, append it to mainView 

  mainView.append("svg:g")
    .attr("class", "x axis");

  // define the y axis and its class, append it to mainView

  mainView.append("svg:g")
    .attr("class", "y axis");

  // define the x axis and its class, append it to brushView 

  brushView.append("svg:g")
    .attr("class", "x axis");


  //handling data and drawing graph 
  let dataSet = listOfIPs(timeData);

  //This pulls the minimum and maximum date for the domain. Although the current data set is done by the same date, this allows for different IPs being reported at different times 

  x.domain([
    d3.min(dataSet, function(c) {
        return d3.min(c.values, function(v) {
          return v.date;
        });
      }),
    d3.max(dataSet, function(c) {
        return d3.max(c.values, function(v) {
          return v.date;
        });
      })
    ]);

   y.domain([
      d3.min(dataSet, function(c) {
        return d3.min(c.values, function(v) {
          return v.bytes;
        });
      }),
      d3.max(dataSet, function(c) {
        return d3.max(c.values, function(v) {
          return v.bytes;
        });
      })
    ]);

  xScrub.domain(x.domain());
  yScrub.domain(y.domain());

  mainView.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  mainView.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);


  let IP = mainView.selectAll(".ip")
    .data(dataSet)
    .enter().append("g")
    .attr("class", "ip");

  IP.append("path")
    .attr("class","line")
    .attr("id", d => d.name)
    .attr("d", d => line(d.values))
    .style("stroke", d => color(d.name));

  IP.selectAll("circle")
    .data(d => d.values)
    .enter().append("circle")
    .attr("class", "byte-point")
    .attr("r", 4)
    .attr("cx", (d, i) => x(d.date))
    .attr("cy", (d, i) => y(d.bytes))

  IP.append("text")
    .attr("class", "ip-name")
    .attr("transform", function(d) {
      return findBrushedDate(d);
    })
    .attr("x", 4)
    .attr("dy", ".35em")
    .text(d => d.name);
    
  let smallIP = brushView.selectAll(".ip")
    .data(dataSet)
    .enter().append("g")
    .attr("class","ip");

  smallIP.append("path")
    .attr("class", "line")
    .attr("d", d => lineScrub(d.values))
    .style("stroke", d => color(d.name));

  brushView.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + heightScrub + ")")
      .call(xAxisScrub);

  brushView.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

  svg.append("rect")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoom);
    
  function formatJSONToArray(data) {
    //pulls from the JSON file and formats to an array 
    return data.split(/\n/).map(record => {
      return JSON.parse(record);
    });
  }

  function getIPList(record) {
    //gets the IPs for each time record
    if (!record.result) { return []}
    return Object.keys(record.result).filter(key => key !== "_time")
  }

  function IPDataPerTime(data) {
    //Take in the JSON file of bytes transferred to the IP and create and object IPs and their transfers at different times 
    let IPDataSet = {};
    let individualData;
    formatJSONToArray(data).forEach(record => {
     getIPList(record).forEach(IP => {
        individualData = {
          bytes: Number(record.result[IP]),
          date: parseDate(record.result._time.slice(0,19))
        }
        IPDataSet[IP] = (IPDataSet[IP] || []).concat(individualData)
      });
    });

    return IPDataSet;
  }

  function listOfIPs(data) {
    //convert the IP object list into an array of objects that D3 can read
    let dataSet = IPDataPerTime(data);
    return Object.keys(dataSet).map(IP => {
      return { name: IP, values: dataSet[IP] }
    })
  }

  function brushed() {
    //whenever the brush moves, update the x domain and values for the main view 
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; 
    var s = d3.event.selection || xScrub.range();
    x.domain(s.map(xScrub.invert, xScrub));
    mainView.selectAll(".line").attr("d", function(d) { return line(d.values)});

    mainView.selectAll("circle")
      .attr("cx", function(d,i) { return x(d.date) })
      .attr("cy", function(d,i) { return y(d.bytes) })

    mainView.selectAll(".ip-name")
    .attr("transform", function(d) {
      return findBrushedDate(d);
    })

    mainView.select(".axis--x").call(xAxis);
    svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
        .scale(width / (s[1] - s[0]))
        .translate(-s[0], 0));
  }

  function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; 
    var t = d3.event.transform;
    x.domain(t.rescaleX(xScrub).domain());
    mainView.selectAll(".line").attr("d", function(d) { return line(d.values)});

    mainView.selectAll("circle")
      .attr("cx", function(d,i) {  return x(d.date) })
      .attr("cy", function(d,i) { return y(d.bytes) });

    mainView.selectAll(".ip-name")
      .attr("transform", function(d) {
        return findBrushedDate(d);
      })

    mainView.select(".axis--x").call(xAxis);
    brushView.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  } 


  function findBrushedDate(d) {
    //move the text for the IP to the last interpolated point based on the length and positioning of the brush
    let beginning = x(x.domain()[1]);
    let path = document.getElementById(d.name)
    let l = path.getTotalLength();

    //fraction of line covered by brush
    let addOnLength = (xScrub(x.domain()[0]))/ (xScrub(xScrub.domain()[1]) -xScrub(xScrub.domain()[0]))
    
    let p = path.getPointAtLength(beginning + addOnLength * l);

    return "translate(" + p.x  + "," + p.y + ")";
  }
}
