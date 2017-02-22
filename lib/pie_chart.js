import * as d3 from "d3";
import barChart from './bar_chart';

const trafficData = require('../assets/data/traffic_bytes.json');
//starting point for splitting the data
const BYTE_START = 64;

export default () => {	
    let width = 700,
      height = 700,
      radius = (Math.min(width, height) - 50) / 3;

   let color = d3.scaleOrdinal(d3.schemeCategory10);

   let data  = listOfBytes(trafficData);

   //arc for the actual pie graph
   let arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(2);

    //label based on data group
   let labelArc = d3.arc()
    .outerRadius(radius + 20)
    .innerRadius(radius - 5 );

    //label based on count of traffic within that data group
   let valueArc = d3.arc()
    .outerRadius(radius)
    .innerRadius(radius - 110);

	let pie = d3.pie()
    .sort(null)
    .value( d =>  d.bytes.length);

  let svg = d3.select("#pie-plot")
    .attr("width", width)
    .attr("height",height)
    .append("g")
    	.attr("transform", "translate(" + height/2  + "," + width/2 + ")");

  //create a pie
  let g = svg.selectAll(".arc")
  	.data(pie(data))
  	.enter().append("g")
  		.attr("class", "arc")
  		.on("click", function(d, i){
        //when clicking on a pie piece, remove the previously selected item's class and add selected to the new item. Proceed to call the redraw function under bar chart
        svg.select(".selected").classed('selected', false)
        this.classList.toggle("selected")
  			barChartDrawn(d.data);
  		})
  		
  g.append("path")
  	.attr("d", arc)
  	.style("fill", d => color(d.data.name));

  g.append("text")
      .attr("class", "byte-label")
      .attr("transform", d => {
        //This creates labels the are perp. to the pie piece
        let midAngle = d.endAngle < Math.PI ? d.startAngle/2 + d.endAngle/2 : d.startAngle/2  + d.endAngle/2 + Math.PI ;
        return "translate(" + labelArc.centroid(d) + ") rotate(-90) rotate(" + (midAngle * 180/Math.PI) + ")"; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) {
        //based on the angle, place the anchor at either the start or the end to ensure they are appropriately distanced from the pie
        if (d.endAngle < Math.PI) { return "start" }
          return "end"
      })
      .text(d => `${d.data.name}`);

  g.append("text")
    .attr("class", "byte-count")
    .attr("transform", d => {
       let midAngle = d.endAngle < Math.PI ? d.startAngle/2 + d.endAngle/2 : d.startAngle/2  + d.endAngle/2 + Math.PI ;
        return "translate(" + valueArc.centroid(d) + ") rotate(-90) rotate(" + (midAngle * 180/Math.PI) + ")";
    })
    .attr("dy", ".35em")
    .attr("text-anchor", function(d) {
        if (d.endAngle < Math.PI) { return "end" }
          return "start"
      })
    .text(d => `${d.data.bytes.length} requests`);

    //create the bar chart with the first piece of data 
   let barChartDrawn = barChart(data[0]);
   //set that piece of the pie's class to selected
   svg.selectAll(".arc").each(function(d,i){ if (i === 0) { this.classList.toggle("selected") }})

	function parseTrafficData(data) {
    //pull in data from JSON file and convert to an array
   	 return data.split(/\n/).map(record => {
      	return JSON.parse(record);
   	 });
 	 }

   function listOfBytes(data) {
    //take in the JSON data and sort by the number of bytes
   		let byteList = [];
   		parseTrafficData(data).forEach(record => {
   			byteList.push(Number(record.result["sum_bytes"]));
   		})

   		let byteListSorted = mergeSort(byteList);
   		return breakIntoLogGroups(byteListSorted)

   }


   function breakIntoLogGroups(byteList) {
    //this goes through the sorted byteList and separates it based on a lognormal scale, and turns it into an array of objects that D3 can read from
   	let inc = BYTE_START;
   	let results = [];
   	let lastValue, beginning = 0, endText, beginningText;
   	while (beginning < byteList.length) {
   		if (byteList.slice(beginning).length / byteList.length < 0.1) {
   			lastValue = byteList.length - beginning;
   		} else {
   			lastValue = binarySearchLargest(byteList.slice(beginning), inc * 2) || byteList.length - beginning
   		}

      beginningText = Math.min(byteList[beginning], inc)
   		endText = Math.max(byteList[beginning + lastValue - 1], inc * 2)
   		results.push({
   			name: `${beginningText}-${endText}`, 
   			bytes: byteList.slice(beginning, lastValue + beginning) 
   		})
   		beginning += lastValue;
   		inc *= 2;
   	}	

   	return results;
   }

   //simple merge sort function to quickly sort the data
   function mergeSort(list) {
   		if (list.length < 2) { return list }
   		let left, right, mid, result = [];

   		mid = Math.floor(list.length / 2);
   		left = mergeSort(list.slice(0, mid));
   		right = mergeSort(list.slice(mid));

   		while (right.length > 0 && left.length > 0){
   			if (right[0] < left[0]) {
   				result.push(right.splice(0, 1)[0]);
   			} else {
   				result.push(left.splice(0, 1)[0]);
   			}
   		}

   		return result.concat(left).concat(right);
   }

   //method for searching for the first item larger than the target using binary search
   function binarySearchLargest(list, target) {
   		if (list.length === 0) { return null };
   		
   		let mid = Math.floor(list.length / 2);
   		
   		if (list[mid] >= target ) {
   			if (mid > 0 && list[mid - 1] < target || mid === 0) { return mid }
   			return binarySearchLargest(list.slice(0, mid), target);
   		} else {
   			if (mid < list.length - 1 && list[mid + 1] >= target) { return mid + 1}
   			let bSearch = binarySearchLargest(list.slice(mid + 1), target);
   			
   			if (bSearch) { return bSearch + mid + 1}
   			return null;
   		}
   }
}