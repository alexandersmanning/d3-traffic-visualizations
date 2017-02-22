import * as d3 from "d3";
//standard number of bars in the chart
const NO_BARS = 20;
//transition time
const duration = 750;

export default (trafficData) => {
	let margin = {top: 20, right: 120, bottom: 150, left: 70},
      width = 1000 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom

  let svg = d3.select("#bar-plot")
      .attr("width", width + margin.left + margin.right)
      .attr("height",height + margin.bottom + margin.top)

  let x = d3.scaleBand().rangeRound([0, width]),
  		y = d3.scaleLinear().rangeRound([height, 0]);

  let data  = breakIntoGroups(trafficData.bytes);

  var color = d3.scaleOrdinal(d3.schemeCategory20); // to generate a different color for each line


   x.domain(data.map(d => d.name));
	 y.domain([0, d3.max(data, d => d.count)]);

  let g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//x axis with labels that are vertical
  g.append("g")
   		.attr("class", "axis axis--x")
   		.attr("transform", "translate(0, " + height + ")")
   		.call(d3.axisBottom(x))
   		.selectAll("text")
    	.attr("y", 0)
    	.attr("x", 9)
    	.attr("dy", ".35em")
    	.attr("transform", "rotate(90)")
    	.style("text-anchor", "start");

    g.append("g")
   		.attr("class", "axis axis--y")
   		.attr("transform", "translate(0, 0)")
   		.call(d3.axisLeft(y))
   

   g.append("text")
       .attr("text-anchor", "middle")  
        .attr("transform", "translate("+ (-50) +","+(height/2)+")rotate(-90)") 
        .text("Number of Requests");

   g.append("text")
       .attr("text-anchor", "middle")  
        .attr("transform", "translate("+ (width / 2) +","+(height + 125)+")") 
        .text("Byte Size");

    //add a bar for each item in the data
	  g.selectAll(".bar")
	  		.data(data)
	  		.enter().append("rect")
	      .attr("class", "bar")
	      .attr("fill", d => color(d.name))
	      .attr("x", (d) => x(d.name))
	      .attr("y", (d) => y(d.count))
	      .attr("width", x.bandwidth())
	      .attr("height", function(d) { return height - y(d.count) });	

	   //add text of the count for each item in the data
		g.selectAll(".bartext")
			.data(data)
			.enter()
			.append("text")
			.attr("class", "bartext")
			.attr("text-anchor", "middle")
			.attr("fill", "black")
			.attr("x", function(d,i) {
			    return x(d.name) + x.bandwidth()/2;
			})
			.attr("y", function(d,i) {
			    return y(d.count) - 5;
			})
			.text(function(d){
			     return d.count;
			});

  //this is called whenever a new piece of the pie is clicked on
  function redraw(trafficData) {
	  let newData  = breakIntoGroups(trafficData.bytes);
	 	x.domain(newData.map(d => d.name));
	 	y.domain([0, d3.max(newData, d => d.count)]);
	 
	 	let newSvg = d3.select("#bar-plot g")

    // Make the changes
    let bars = newSvg.selectAll(".bar")
    		.data(newData);

    //append the new bars based on updated data
    bars.enter().append("rect")
    		.attr("class", "bar")
    		.attr("fill", d => color(d.name))
    		.attr("y", y(0))
   			.attr("height", height - y(0)).transition().duration(duration);


   //set the transition to the change in bars by their data
   bars.transition().duration(duration)
    .attr("x", function(d) {
    	return x(d.name)})
    .attr("y", function(d){
    	return y(d.count)})
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - y(d.count) })
    
    //remove old bars
    bars.exit()
    	.transition()
    		.duration(duration)
    	.attr("y", y(0))
    	.attr("height", height - y(0))
    	.style('fill-opacity', 1e-6)
    	.remove()

    	//do the same, but with the bar text
    let bartext = newSvg.selectAll(".bartext")
    	.data(newData);

    	bartext.enter()
			.append("text")
			.attr("class", "bartext")
			.attr("text-anchor", "middle")
			.attr("fill", "black")
			.attr("y", y(0))

			bartext.transition().duration(duration)
				.attr("x", function(d,i) {
				    return x(d.name) + x.bandwidth()/2;
				})
				.attr("y", function(d,i) {
				    return y(d.count) - 5;
				})
				.text(function(d){
				     return d.count;
				});
  
    bartext.exit()
    	.transition()
    		.duration(duration)
    	.attr("y", y(0))
    	.attr("height", height - y(0))
    	.style('fill-opacity', 1e-6)
    	.remove()

    	//update the x and y based on the new data
    newSvg.transition().select(".axis.axis--x") // change the x axis
        .duration(duration)
        .call(d3.axisBottom(x))
        .selectAll("text")
			    .attr("y", 0)
			    .attr("x", 9)
			    .attr("dy", ".35em")
			    .attr("transform", "rotate(90)")
			    .style("text-anchor", "start");

    newSvg.transition().select(".axis.axis--y") // change the y axis
        .duration(duration)
        .call(d3.axisLeft(y));

	      	
  }

  //return this function so that it can be called once the graph is loaded
  return redraw.bind(this);

   function breakIntoGroups(byteList) {
   	//this separate the provided data into groups of 20
   		let results = {};
   		let inc = (byteList.slice(-1)[0] - byteList[0]) / NO_BARS;

   		for (let i = 0; i <= NO_BARS; i++) {
   			results[i] = 0;
   		};

   		byteList.forEach(byte => {
   			results[Math.round((byte - byteList[0]) / inc)]++;
   		})
   		return listByGroup(results, inc, byteList[0]);
   }

   function listByGroup(resultList, inc, start) {
   	//this converts the data into an array of object in which d3 can use for each bar
   		let results = [];
   		let upperBound, lowerBound;

   		Object.keys(resultList).forEach(result => {
   			upperBound = parseInt(Number(result) * inc + start + inc - 1)
   			lowerBound = parseInt(Number(result) * (inc) + start)
   			results.push({
   				name: `${lowerBound}-${upperBound}`,
   				count: resultList[result]
   			})
   		});

   		return results;
   }
}

