var Asteroids = {
  version: '0.1',
  svg: null
};
  /* x Axis Object
     x  Line, Position, Values l h, Title, Visibility
       Ticks major minor
       No Axis when foreshortened
     x Families
     x Vesta,Flora,Baptistina,Nyssa-Polana,Agnia,Eunomia,Mitidika,Teutonia,Ursula,Koronis,Eos,Hygiea,Themis
     Gaps  2.5,2.82
   */
  var rmatrix, canvas, sbos = [], families = [], axes, 
      LINECOL = "#fff",
      LINEWIDTH = 1.2,
      FONT = "12px sans-serif",
      showNames = true;
  
  var margin = 25,
      width = 600 - margin * 2,
      height = width,
      halfwidth = width / 2,
      offset = halfwidth + margin,
      zoomlvl = 0.9, 
      angles = {
      //a vs. e  if (angle[0] < 10 && angle[2] < 10)
        ae: [0, 0, 0],
      //a vs. i   if (angle[0] > 80 && angle[2] < 10)
        ai: [90, 0, 0],
      //e vs. i   if (angle[0] < 10 && angle[2] > 80)
        ei: [0, 0, -90]
      },
      angle = angles.ae;
      
  //d3.scale.linear()
  var scale = { 
    ap: d3.scale.linear().domain([2.0, 3.7]).range([-halfwidth, halfwidth]),
    ep: d3.scale.linear().domain([0.0, 0.3]).range([-halfwidth, halfwidth]),
    ip: d3.scale.linear().domain([0.0, 0.3]).range([-halfwidth, halfwidth])
  }
  
  //Scales for rotation with dragging
  //x = d3.scale.linear().domain([-width/2, width/2]).range([-180+angle[0], 180+angle[0]]);
  //z = d3.scale.linear().domain([-height/2, height/2]).range([90-angle[2], -90-angle[2]]);
  x = d3.scale.linear().domain([-width/2, width/2]).range([-90, 90]);
  z = d3.scale.linear().domain([-height/2, height/2]).range([-90, 90]);

  var zoom = d3.behavior.zoom().center([0, 0]).scaleExtent([0.7, 3]).translate([x.invert(angle[0]), z.invert(angle[2])]).scale(zoomlvl).on("zoom", redraw);
  //
  var line = d3.svg.line().x( function(d) { return d[0]; } ).y( function(d) { return d[1]; } );

  rmatrix = getRotation(angle);
  
    //angle = [x(trans[1]), 0, z(trans[0])];
    //trans = ([x.invert(angle[2]), z.invert(angle[1])])
  
Asteroids.display = function(config) {
  
  d3.select("#names").on("click", function() {
    showNames = !showNames;
    redraw();
  });

  d3.select("#ae").on("click", function() {
    angle = angles.ae;
    zoom.translate([x.invert(angle[2]), z.invert(angle[0])])
    redraw();
  });
  d3.select("#ai").on("click", function() {
    angle = angles.ai;
    zoom.translate([x.invert(angle[2]), z.invert(angle[0])])
    redraw();
  });
  d3.select("#ei").on("click", function() {
    angle = angles.ei;
    zoom.translate([x.invert(angle[2]), z.invert(angle[0])])
    redraw();
  });

  canvas = d3.select("#map").append("canvas")
      .attr("width", width + margin * 2)
      .attr("height", height + margin * 2)
      .call(zoom)
      .node().getContext("2d");
  
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
  
  d3.csv('data/ast-proper14.csv', function(error, csv) {
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

}


function translate(d) {
  var p = vMultiply(rmatrix, d);
  
  p[0] *= zoomlvl; p[2] *= zoomlvl;  
  return [ p[0] + offset, -p[2] + offset ];
  //return "translate(" + p[0] + "," + -p[2] + ")";
}


function redraw() {
  zoomlvl = zoom.scale();  
  if (d3.event && d3.event.sourceEvent && d3.event.sourceEvent.type !== "wheel") {
    var trans = zoom.translate();
    angle = [x(trans[1]), 0, z(trans[0])];
  }
  
  rmatrix = getRotation(angle);

  canvas.clearRect(0, 0, width + margin * 2, height + margin * 2);
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
    
    for (var i=0; i < families.length; i++) {
      var t = families[i];
      canvas.fillStyle = t.col;
      text3d(t.n, t.pos);
    }
    canvas.globalAlpha = 1.0;
  }
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
  };
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

