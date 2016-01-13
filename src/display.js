var Asteroids = {
  version: '0.1',
  svg: null
};

var ASTDATA = 'data/ast-proper14.csv',
    LIMIT = 14,
    LINECOL = "#fff",
    LINEWIDTH = 1.2,
    FONT = "12px sans-serif",
    margin = {h:40, v:20},
    width = 640 - margin.h * 2,
    height = 640 - margin.v * 2,
    halfwidth = width / 2,
    offset = {h: halfwidth + margin.h, v:halfwidth + margin.h},
    zoomlvl = 0.9, 
    showNames = true,
    angles = {
      ae: [0, 0, 0],   //a vs. e  
      ai: [90, 0, 0],  //a vs. i  
      ei: [0, 0, -90]  //e vs. i 
    },
    angle = angles.ae;

var color_btn = "rgba(255,255,255,0.1)",
    color_sel = "rgba(255,255,255,0.3)";
    
var rmatrix, canvas, sbos = [], families = [], axes;

// x,y,z scales
var scale = { 
  ap: d3.scale.linear().domain([2.0, 3.7]).range([-halfwidth, halfwidth]),
  ep: d3.scale.linear().domain([0.0, 0.3]).range([-halfwidth, halfwidth]),
  ip: d3.scale.linear().domain([0.0, 0.3]).range([-halfwidth, halfwidth])
};

//Scale for rotation with dragging
var rot = d3.scale.linear().domain([-halfwidth, halfwidth]).range([-90, 90]);

var zoom = d3.behavior.zoom().center([0, 0]).scaleExtent([0.7, 3]).scale(zoomlvl).on("zoom", redraw);
//rotationmatrix for angle [x,y,z]  
rmatrix = getRotation(angle);


Asteroids.display = function(config) {
  
  if (config) {
    if (has(config, "width")) setScale(config.width);
    if (has(config, "datapath") && config.datapath.search(/\.csv$/) !== -1) ASTDATA = config.datapath;
  }  

  canvas = d3.select("#map").append("canvas")
      .attr("width", width + margin.h * 2)
      .attr("height", height + margin.v * 2)
      .call(zoom).node().getContext("2d");
  
  //Buttons
  var nav = d3.select("#map").append("div").attr("class", "ctrl").html("Show ");
  nav.append("button").attr("class", "button").style("background", color_sel).attr("id", "ae").html("a vs. e").on("click", function() { angle = angles.ae; turn("ae"); });
  nav.append("button").attr("class", "button").attr("id", "ai").html("a vs. sin i").on("click", function() { angle = angles.ai; turn("ai"); });
  nav.append("button").attr("class", "button").attr("id", "ae").html("e vs. sin i").on("click", function() { angle = angles.ei; turn("ei"); });
  nav.append("button").attr("class", "button").attr("id", "names").html("No Names").on("click", function() { 
    showNames = !showNames; 
    d3.select("#names").html( function() { return showNames ? "No Names" : "Names"; } );
    redraw(); 
  });
  
  axes = {
    x: axis3d().scale(scale.ap).ticks(17).tickPadding(6).title("a\u209a / AU"),
    y: axis3d().scale(scale.ep).orient(["left", "front"]).ticks(12).tickPadding(6).title("e\u209a"),
    z: axis3d().scale(scale.ip).orient(["bottom", "left"]).ticks(12).tickPadding(6).title("sin i\u209a"),
    x1: axis3d().scale(scale.ap).orient(["top", "front"]).ticks(0).dash([2,4]),
    x2: axis3d().scale(scale.ap).orient(["bottom", "back"]).ticks(0).dash([2,4]),
    x3: axis3d().scale(scale.ap).orient(["top", "back"]).ticks(0).dash([2,4]),
    y1: axis3d().scale(scale.ep).orient(["right", "front"]).ticks(0).dash([2,4]),
    y2: axis3d().scale(scale.ep).orient(["left", "back"]).ticks(0).dash([2,4]),
    y3: axis3d().scale(scale.ep).orient(["right", "back"]).ticks(0).dash([2,4]),
    z1: axis3d().scale(scale.ip).orient(["top", "left"]).ticks(0).dash([2,4]),
    z2: axis3d().scale(scale.ip).orient(["bottom", "right"]).ticks(0).dash([2,4]),
    z3: axis3d().scale(scale.ip).orient(["top", "right"]).ticks(0).dash([2,4])
  };
  
  zoom.translate([rot.invert(angle[0]), rot.invert(angle[2])]);
  
  d3.csv(ASTDATA, function(error, csv) {
    if (error) return console.log(error);
          
    for (var key in csv) {
      if (!has(csv, key)) continue;
      //object: pos[x,y,z],color,r,[a,e,i]
      sbos.push(getObject(csv[key]));
    }
    redraw();
  });

  d3.csv('data/families.csv', function(error, csv) {
    if (error) return console.log(error);
          
    for (var key in csv) {
      if (!has(csv, key)) continue;
      //object: pos[x,y,z],name,color,r,[a,e,i]
      families.push(getFamily(csv[key]));
    }
    redraw();
  });

};


function translate(d) {
  var p = vMultiply(rmatrix, d);
  
  p[0] *= zoomlvl; p[2] *= zoomlvl;  
  return [ p[0] + offset.h, -p[2] + offset.v ];
  //return "translate(" + p[0] + "," + -p[2] + ")";
}

    
function turn(sel) {
  d3.select("#ae").style("background", function() { return sel === "ae" ? color_sel : color_btn; });
  d3.select("#ai").style("background", function() { return sel === "ai" ? color_sel : color_btn; });
  d3.select("#ei").style("background", function() { return sel === "ei" ? color_sel : color_btn; });
  zoom.translate([rot.invert(angle[2]), rot.invert(angle[0])]);
  //doesn't work that way
  //zoom.event(canvas.transition().duration(1000));
  redraw();
}


function redraw() {
  zoomlvl = zoom.scale();  
  if (d3.event && d3.event.sourceEvent && d3.event.sourceEvent.type !== "wheel") {
    var trans = zoom.translate();
    angle = [rot(trans[1]), 0, rot(trans[0])];
  }
  
  rmatrix = getRotation(angle);

  canvas.clearRect(0, 0, width + margin.h * 2, height + margin.v * 2);
  for (var key in axes) axes[key](canvas);

  //draw objects
  for (var i=0; i < sbos.length; i++) {
    circle3d(sbos[i]);
  }
  
  if (showNames) {
    //draw family names
    canvas.textAlign = "center";
    canvas.textBaseline = "middle";
    canvas.font = FONT;
    canvas.globalAlpha = 0.6;
    
    for (i=0; i < families.length; i++) {
      var t = families[i];
      canvas.fillStyle = t.col;
      text3d(t.n, t.pos);
    }
    canvas.globalAlpha = 1.0;
  }
}

function setScale(w) {
  //var par = $("map").parentNode;
  //if (par.offsetWidth > w) margin.h += (par.offsetWidth - w) / 2;
  width = w - margin.h * 2;
  height = w - margin.v * 2;
  halfwidth = width / 2;
  offset = {h: halfwidth + margin.h, v:halfwidth + margin.h};
  scale.ap.range([-halfwidth, halfwidth]);
  scale.ep.range([-halfwidth, halfwidth]);
  scale.ip.range([-halfwidth, halfwidth]);
  rot.domain([-halfwidth, halfwidth]);
}


function circle3d(d) {
  canvas.fillStyle = d.col;
  var pt = translate(d.pos);
  canvas.beginPath();
  canvas.arc(pt[0], pt[1], d.r, 0, 2 * Math.PI);
  canvas.closePath();
  canvas.fill();
}

function path3d(d) {
  var pt;
  //d.map( function(axe, i) {
  canvas.beginPath();
  for (var i = 0; i < d.length; i++) {
    pt = translate(d[i]);
    if (i === 0)
      canvas.moveTo(pt[0], pt[1]);
    else
      canvas.lineTo(pt[0], pt[1]);
  }
  canvas.stroke();
}

function text3d(txt, d, ang) {
  var pt = translate(d);
  if (ang) {
    canvas.save();     
    canvas.translate(pt[0], pt[1]);
    canvas.rotate(Math.PI/2); 
    canvas.fillText(txt, 0, 0);
    canvas.restore();     
  } else
    canvas.fillText(txt, pt[0], pt[1]);
}

