import timePlot from './time_plot';
import pieChart from './pie_chart'

document.addEventListener("DOMContentLoaded", () => {
	//This is a simple root file that gets called once the content has loaded, so that it can load the relate graphs
	timePlot();
	pieChart();
});