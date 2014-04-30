function runApp() {
  // --- MAP INITIALIZATION ---
  var tooltip = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

  // Create the Google Map…
  var map = new google.maps.Map(d3.select("#map").node(), {
    zoom: 12,
    center: new google.maps.LatLng(46.947756, 7.444824),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  
  
  // --- CHARTS INITIALIZATION ---
  // Add radio buttons
  var form = d3.select("#chart").append("form");
  form.append("input")
    .attr({
      type: "radio",
      name: "test",
      value: "gender"
    });
  form.append("label")
    .text("Geschlecht");
    
  form.append("input")
    .attr({
      type: "radio",
      name: "test",
      value: "lang"
    });
  form.append("label")
    .text("Sprache");
    
  form.append("input")
    .attr({
      type: "radio",
      name: "test",
      value: "ausl"
    });
  form.append("label")
    .text("Ausländeranteil");
  
  // Add svg for chart
  var width = parseFloat(d3.select("#chart").style("width")),
  height = parseFloat(d3.select("#chart").style("height")),
  radius = Math.min(width, height) / 2;
  
  var selectedElement;

  var color = d3.scale.category20();

  var pie = d3.layout.pie()
    .value(function(d) { return d.count; })
    .sort(null);

  var arc = d3.svg.arc()
    .innerRadius(radius - 100)
    .outerRadius(radius - 20);

  var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var path = svg.selectAll("path");        
  
  
  
  // --- LOAD CSV --
  // Load the csv data. When the data comes back, create an overlay.
  d3.csv("schulstat_2012_20131108_mit_koordinaten.csv", function(data) {
    // --- MAP ---
    var overlay = new google.maps.OverlayView();

    // Add the container when the overlay is added to the map.
    overlay.onAdd = function() {
      var layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
        .attr("class", "marker");

      // Draw each marker as a separate SVG element.
      // We could use a single SVG, but what size would it have?
      overlay.draw = function() {
        var projection = this.getProjection()

        var marker = layer.selectAll("svg")
          .data(d3.entries(data))
          .each(transform) // update existing markers
          .enter().append("svg:svg")
          .each(transform)
          .attr("class", "marker");

        // Add a circle.
        var circle = marker.append("svg:circle");
        circle.attr("r", calculateRadius)
          .attr("cx", calculatePadding)
          .attr("cy", calculatePadding);
        
        // Add click event.
        marker.on("click", function(d){
          selectedElement = d.value;
          change();
        });
        
        // Add mouseover event.
        marker.on("mouseover", function(d) {      
          tooltip.transition()        
            .duration(200)      
            .style("opacity", .9);      
          tooltip.html(d.value.Schule + "<br>" + d.value.Anzahl_Schueler)  
            .style("left", (d3.event.pageX) + "px")     
            .style("top", (d3.event.pageY - 28) + "px");    
        });
        
        // Add mouseout event.
        marker.on("mouseout", function(d) {
          tooltip.transition()        
            .duration(500)      
            .style("opacity", 0);   
        });
        
        function transform(d) {
          if((d.value.TabZeileNeu == 41 && map.getZoom() >= 14) || (d.value.TabZeileNeu == 31 && map.getZoom() < 14 && map.getZoom() >= 10) || (d.value.TabZeileNeu == 11 && map.getZoom() < 10)) {
            d3.select(this).style("visibility", "visible");
            e = new google.maps.LatLng(d.value.lat, d.value.lng);
            e = projection.fromLatLngToDivPixel(e);
            d3.select(this).select("circle")
              .attr("r", calculateRadius)
              .attr("cx", calculatePadding)
              .attr("cy", calculatePadding);
            return d3.select(this)
              .style("left", (e.x - calculatePadding(d)) + "px")
              .style("top", (e.y - calculatePadding(d)) + "px")
              .style("width", calculateRadius(d)*2+2 + "px")
              .style("height", calculateRadius(d)*2+2 + "px");
          } else
            d3.select(this).style("visibility", "hidden");
        }
        
        function calculateRadius(d) {
          var r = 0;
          if(d.value.TabZeileNeu == 41 && map.getZoom() >= 14)
            r = 0.03 * d.value.Anzahl_Schueler * (0.5 * map.getZoom() - 4.5) + 2;
          else if(d.value.TabZeileNeu == 31 && map.getZoom() < 14 && map.getZoom() >= 10)
            r = 0.005 * d.value.Anzahl_Schueler * (0.5 * map.getZoom() - 4.7) + 2;
          else
            r = 0.001 * d.value.Anzahl_Schueler * (0.5 * map.getZoom() - 3.4) + 10; 

          if(r <= 0)
            r = 1;
          return r;
        }
        
        function calculatePadding(d) {
          return calculateRadius(d)+1;
        }
        
        function calculateWidth(d) {
          return 2*calculateRadius(d)+2;
        }
      };
    };

    // Bind our overlay to the map…
    overlay.setMap(map);
    
    
    // --- CHARTS ---
    d3.select("form").selectAll("input")
      .on("change", change)
      .filter(function(d, i) { return !i; })
      .each(change)
      .property("checked", true);

    function change() {
      var dataset = data.filter(function(d) { return d == selectedElement; });
      if(dataset.length == 0) {
        dataset = data;
      }
      var element = dataset[0];
      var newData;
      
      var selectedChart = this.value;
      if(selectedChart == undefined) {
        d3.select("form").selectAll("input")
          .each(function() {if(this.checked) selectedChart = this.value;});
      }

      switch(selectedChart) {
        case "lang":
          newData = [{count: element.Anzahl_Schueler - element.Anzahl_Fremdspr, name: element.Unterrichtssprache, region: "east"}, {count: element.Anzahl_Fremdspr, name: "andere", region: "west"}]; 
          break;
        case "ausl":
          newData = [{count: element.Anzahl_Schueler - element.Anzahl_Ausl, name: "Schweizer", region: "east"}, {count: element.Anzahl_Ausl, name: "Ausländer", region: "west"}];
          break;
        default:
          newData = [{count: element.Anzahl_Schueler - element.Anzahl_Frauen, name: "männlich", region: "east"}, {count: element.Anzahl_Frauen, name: "weiblich", region: "west"}]; 
      }
      
      var data0 = path.data(),
      data1 = pie(newData);

      path = path.data(data1, key);

      path.enter().append("path")
        .each(function(d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
      
      path.attr("fill", function(d) { return getColor(d.data.name); });

      path.exit()
        .datum(function(d, i) { return findNeighborArc(i, data1, data0, key) || d; })
        .transition()
        .duration(750)
        .attrTween("d", arcTween)
        .remove();

      path.transition()
        .duration(750)
        .attrTween("d", arcTween);
        
      // Add mouseover event.
      path.on("mouseover", function(d) {      
        tooltip.transition()        
          .duration(200)      
          .style("opacity", .9);      
        tooltip.html(d.data.name)  
          .style("left", (d3.event.pageX) + "px")     
          .style("top", (d3.event.pageY - 28) + "px");    
      });
        
      // Add mouseout event.
      path.on("mouseout", function(d) {
        tooltip.transition()        
          .duration(500)      
          .style("opacity", 0);   
      });
    }
  });
  
  // --- CHARTS FUNCTIONS ---
  
  function key(d) {
    return d.data.region;
  }
  
  function getColor(name) {
    switch (name) {
    case "männlich":
      return "#5C8ADB";
    case "weiblich":
      return "#E629DF";
    case "Schweizer":
      return "#29E678";
    case "Ausländer":
      return "#FFFF00";
    case "Deutsch":
      return "#FFC400";
    case "Französisch":
      return "#A674FC";
    case "-":
      return "#FFC400";
    case "andere":
      return "#A674FC";          
    default:
      return "#000000";
    }
  };
  
  function findNeighborArc(i, data0, data1, key) {
    var d;
    return (d = findPreceding(i, data0, data1, key)) ? {startAngle: d.endAngle, endAngle: d.endAngle}
      : (d = findFollowing(i, data0, data1, key)) ? {startAngle: d.startAngle, endAngle: d.startAngle}
      : null;
  }

  // Find the element in data0 that joins the highest preceding element in data1.
  function findPreceding(i, data0, data1, key) {
    var m = data0.length;
    while (--i >= 0) {
      var k = key(data1[i]);
      for (var j = 0; j < m; ++j) {
        if (key(data0[j]) === k) return data0[j];
      }
    }
  }

  // Find the element in data0 that joins the lowest following element in data1.
  function findFollowing(i, data0, data1, key) {
    var n = data1.length, m = data0.length;
    while (++i < n) {
      var k = key(data1[i]);
      for (var j = 0; j < m; ++j) {
        if (key(data0[j]) === k) return data0[j];
      }
    }
  }

  function arcTween(d) {
    var i = d3.interpolate(this._current, d);
    this._current = i(0);
    return function(t) { return arc(i(t)); };
  }
}