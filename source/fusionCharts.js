/**************************************************************
  Enyo control for FusionCharts v1.1.0

  Copyright 2018 OnCron Engineering, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 **************************************************************/

/*
 * Provides a control for the rendering of FusionCharts 
 * into and obtaining event notifications out of 
 *  
 * Please include FusionCharts in your package.js, e.g. 
 *  "$lib/fusion-charts/Charts/FusionCharts.js"
 *  
 */

enyo.kind({
  name: "oncron.FusionCharts",
  kind: "Control",
  published: {

    // Chart types can be found here
    // http://docs.fusioncharts.com/charts/contents/Introduction/ChartList.html
    // We do not verify against a list, simply pass it on
    chartType: "",

    // Chart size, can be in pixels (do not append px) or percent
    // For dynamic resize you must specify in percent
    width: "100%",
    height: "100%",

    // Automatically render on init
    // If set to false, call renderChart() when ready
    autoRender: true,

    // Additional options to be passed to FusionCharts constructor
    // For example, you may pass in a custom 'id' to specify
    // a unique DOM ID, or specify debugMode
    additionalOptions: null,

    // Events to listen for and provide via onChartEvent
    // Can be any event type or name as defined by FusionCharts
    // Can be a single event or an array of events
    // See http://docs.fusioncharts.com/charts/contents/JavaScript/API/Events.html
    // Set to null to disable events
    // NOTE: Initialized and Disposed events do not come through because
    // we are tying the event to the control which has already been created
    // by the time we register for events, and similarly we deregister
    // before destroying
    chartEvents: null,

    // Use these published properties only to pass data in on
    // initialization. For runtime updates, use the setChartData() function
    dataSource: null,
    dataFormat: null   

  },
  events: {
    onChartEvent: ""
  },
  handlers: {
  },
  components: [
  ],
  fusionChart: null,

  // Call to set the chart data
  // Mirrors the FusionCharts setChartData function
  // Use this instead of published properties because we
  // need to triger this function even if the value doesn't change
  // (to reload chart data from a URL, for example)
  // Also, because of issues with using an object for a property
  // noted on the Enyo Published Properties Wiki page, this is
  // the best implementation
  setChartData: function(inData, inFormat) {
    // Perform basic verification on format
    if (typeof inData !== "undefined" &&
        (inFormat === "xml" || 
         inFormat === "json" || 
         inFormat === "xmlurl" || 
         inFormat === "jsonurl")
        ) {
      this.dataSource = inData;
      this.dataFormat = inFormat;
      this.fillChart();
    } else {
      throw("Invalid chart data or format");
    }
  },
  // Call the FusionCharts API on the chart
  // For example, to call chart.setTransparent(true)
  // call callFusionChartsApi("setTransparent", true)
  callFusionChartsApi: function() {
    // Make a real array out of the arguments for easier manipulation
    var args = Array.prototype.slice.call(arguments);
    var apiCall = args.shift();

    if (this.fusionChart && apiCall) {
      return this.fusionChart[apiCall].apply(this.fusionChart, args);
    }
  },
  //* @protected
  create: function() {
    this.inherited(arguments);
    this.createChart();
    this.fillChart();
  },
  rendered: function() {
    this.inherited(arguments);
    if (this.autoRender) {
      this.renderChart();
    }
  },
  destroy: function() {
    this.inherited(arguments);
    // Clean up FusionCharts references
    this.destroyChart();
  },
  // Create the FusionChart
  createChart: function() {

    if (this.fusionChart) {
      throw("Chart already exists, please destroy existing");
    }

    var chartOptions = {
      type: this.chartType,
      width: this.width,
      height: this.height,
      // For ease of understanding, provide a unique ID 
      // based on our control's ID
      id: this.id + "_fusionChart"
    };

    // If additional options are provided, mutate chartOptions
    // with any additionalOptions overriding defaults
    if (this.additionalOptions) {
      enyo.mixin(chartOptions, this.additionalOptions);
    }

    this.fusionChart = new FusionCharts(chartOptions);

    this.chartEventsChanged(null);

  },
  // Set the data source for the chart
  fillChart: function() {

    if (this.fusionChart && this.dataSource && this.dataFormat) {
      this.fusionChart.setChartData(this.dataSource, this.dataFormat);
    }

  },
  // Only needs to be called once, don't call every time
  // data is updated
  renderChart: function() {
    if (this.fusionChart && this.hasNode()) {
      this.fusionChart.render(this.node);
    }
  },
  // Dispose of the chart for internal FusionCharts cleanup
  destroyChart: function() {
    if (this.fusionChart) {
      // Clean up the listener
      this.setChartEvents(null);
      this.fusionChart.dispose();
      this.fusionChart = null;
    }
  },
  chartEventsChanged: function(oldValue) {

    // Remove old event listener first
    if (oldValue) {
      this.fusionChart.removeEventListener(oldValue, enyo.bind(this, "chartEventListener"));
    }

    // Add the new one
    if (this.chartEvents) {
      this.fusionChart.addEventListener(this.chartEvents, enyo.bind(this, "chartEventListener"));
    }

  },
  // Received a listener callback
  // Send the event on with the original object and arguments
  // packed into the Enyo event
  chartEventListener: function(eventObject, argumentsObject) {
    this.doChartEvent({"eventObject": eventObject, "argumentsObject": argumentsObject});
  }

});

