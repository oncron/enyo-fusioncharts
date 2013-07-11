/**************************************************************
  Enyo control for FusionCharts v1.0 

  Copyright 2013 OnCron Engineering, Inc.

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

    // enable Flash charts? We'll use JS only by default
    // Currently flash charts are not implemented
    enableFlash: false,

    // Provide one and only one of the following
    // New data or URLs can be pushed to the chart
    // by way of setting the published property
    // (e.g. setJsonData)
    jsonUrl: null,
    jsonData: null,
    xmlUrl: null,
    xmlData: null,

    // Chart size, can be in pixels (do not append px) or percent
    // For dynamic resize you must specify in percent
    width: "100%",
    height: "100%",

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
    chartEvents: null

  },
  events: {
    onChartEvent: ""
  },
  handlers: {
  },
  components: [
  ],
  fusionChart: null,
  //* @protected
  create: function() {
    this.inherited(arguments);
    this.createChart();
    this.fillChart();
  },
  rendered: function() {
    this.inherited(arguments);
    this.renderChart();
  },
  destroy: function() {
    this.inherited(arguments);
    // Clean up FusionCharts references
    this.destroyChart();
  },
  // Create the FusionChart
  createChart: function() {

    if (this.enableFlash) {
      // Flas charts are not currently supported as correct pathing to
      // the swf files is required
      throw("Flash charts not currently supported");
    }

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
      chartOptions = $.extend({}, chartOptions, this.additionalOptions)
    }

    this.fusionChart = new FusionCharts(chartOptions);

    this.chartEventsChanged(null);

  },
  // Set the data source for the chart
  // We accept one and only one source
  // We don't throw an error if we don't find a source
  // We simply don't set it - that allows a user
  // to null one source and set another to effectively
  // re-render the data
  // Returns true if data set
  fillChart: function() {

    if (this.fusionChart) {

      if (this.jsonUrl) {
        this.fusionChart.setJSONUrl(this.jsonUrl);
      } else if (this.jsonData) {
        this.fusionChart.setJSONData(this.jsonData);
      } else if (this.xmlUrl) {
        this.fusionChart.setXMLUrl(this.xmlUrl);
      } else if (this.xmlData) {
        this.fusionChart.setXMLData(this.xmlData);
      } else {
        return false;
      }

      return true;

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
  jsonUrlChanged: function(oldValue) {
    this.fillChart();
  },
  jsonDataChanged: function(oldValue) {
    this.fillChart();
  },
  xmlUrlChanged: function(oldValue) {
    this.fillChart();
  },
  xmlDataChanged: function(oldValue) {
    this.fillChart();
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
  // packed into the enyo event
  chartEventListener: function(eventObject, argumentsObject) {
    this.doChartEvent({"eventObject": eventObject, "argumentsObject": argumentsObject});
  }

});

