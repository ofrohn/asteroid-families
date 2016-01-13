// Copyright 2015 Olaf Frohn https://github.com/ofrohn, see LICENSE
!(function() {
var Asteroids = {
  version: '0.1',
  svg: null
};

var ASTDATA = "ast-proper14.csv",
    DATAPATH = "./data/",
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


Asteroids.display = function(config) {
  
  if (config) {
    if (has(config, "width")) setScale(config.width);
    if (has(config, "datapath")) DATAPATH = config.datapath;
  }  

  canvas = d3.select("#map").append("canvas")
      .attr("width", width + margin.h * 2)
      .attr("height", height + margin.v * 2)
      .call(zoom).node().getContext("2d");
  
  //Buttons
  var nav = d3.select("#map").append("div").attr("class", "ctrl").html("Show ");
  nav.append("button").attr("class", "button").style("background", color_sel).attr("id", "ae").html("a vs. e").on("click", function() { angle = angles.ae; turn("ae"); });
  nav.append("button").attr("class", "button").attr("id", "ai").html("a vs. sin i").on("click", function() { angle = angles.ai; turn("ai"); });
  nav.append("button").attr("class", "button").attr("id", "ei").html("e vs. sin i").on("click", function() { angle = angles.ei; turn("ei"); });
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
  
  //rmatrix = getRotation(angle);
  zoom.translate([rot.invert(angle[0]), rot.invert(angle[2])]);
  
  d3.csv(DATAPATH + ASTDATA, function(error, csv) {
    if (error) return console.log(error);
          
    for (var key in csv) {
      if (!has(csv, key)) continue;
      //object: pos[x,y,z],color,r,[a,e,i]
      sbos.push(getObject(csv[key]));
    }
    redraw();
  });

  d3.csv(DATAPATH + 'families.csv', function(error, csv) {
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
    canvas.globalAlpha = 0.7;
    
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


function $(id) { return document.getElementById(id); }
function px(n) { return n + "px"; } 
function Round(x, dg) { return(Math.round(Math.pow(10,dg)*x)/Math.pow(10,dg)); }
function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

function has(o, key) { return o !== null && hasOwnProperty.call(o, key); }
function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
function isArray(o) { return Object.prototype.toString.call(o) === "[object Array]"; }
function isObject(o) { var type = typeof o;  return type === 'function' || type === 'object' && !!o; }
function isFunction(o) { return typeof o == 'function' || false; }


function attach(node, event, func) {
  if (node.addEventListener) node.addEventListener(event, func, false);
  else node.attachEvent("on" + event, func); 
}

function stopPropagation(e) {
  if (typeof e.stopPropagation != "undefined") e.stopPropagation();
  else e.cancelBubble = true;
}

function dtParse(s) {
  if (!s) return; 
  var t = s.split(".");
  if (t.length < 1) return; 
  t = t[0].split("-");
  t[0] = t[0].replace(/\D/g, "");
  if (!t[0]) return; 
  t[1] = t[1]?t[1].replace(/\D/g, ""):"1";
  t[2] = t[2]?t[2].replace(/\D/g, ""):"1";
  
  return new Date(t[0], t[1]-1, t[2]);
}

function dtAdd(dt, val, type) {
  var t, ldt = dt.valueOf();
  if (!val) return new Date(ldt); 
  t = type || "d";
  switch (t) {
    case 'y': case 'yr': ldt += 31556926080*val; break;
    case 'm': case 'mo': ldt += 2629800000*val; break;
    case 'd': case 'dy': ldt += 86400000*val; break;
    case 'h': case 'hr': ldt += 3600000*val; break;
    case 'n': case 'mn': ldt += 60000*val; break;
    case 's': case 'sec': ldt += 1000*val; break;
    case 'ms': ldt += val; break;
  }
  return new Date(ldt);
}


function dtDiff(dt1, dt2, type) {
  var ldt, t, con;
  if (!dt2 || !dt1) return; 
  ldt = dt2.valueOf() - dt1.valueOf();
  t = type || "d";
  switch (t) {
    case 'y': case 'yr': ldt /= 31556926080; break;
    case 'm': case 'mo': ldt /= 2629800000; break;
    case 'd': case 'dy': ldt /= 86400000; break;
    case 'h': case 'hr': ldt /= 3600000; break;
    case 'n': case 'mn': ldt /= 60000; break;
    case 's': case 'sec': ldt /= 1000; break;
    case 'ms': break;
  }
  return ldt;
  //return Math.floor(ldt);
}

function dtFrac(dt) {
  return (dt.getHours() + dt.getTimezoneOffset()/60.0 + dt.getMinutes()/60.0 + dt.getSeconds()/3600.0) / 24;
}


var Trig = {
  sinh: function (val) { return (Math.pow(Math.E, val)-Math.pow(Math.E, -val))/2; },
  cosh: function (val) { return (Math.pow(Math.E, val)+Math.pow(Math.E, -val))/2; },
  tanh: function (val) { return 2.0 / (1.0 + Math.exp(-2.0 * val)) - 1.0; },
  asinh: function (val) { return Math.log(val + Math.sqrt(val * val + 1)); },
  acosh: function (val) { return Math.log(val + Math.sqrt(val * val - 1)); },
  normalize0: function(val) {  return ((val + Math.PI*3) % (Math.PI*2)) - Math.PI;  },
  normalize: function(val) {  return ((val + Math.PI*2) % (Math.PI*2));  },  
  deg2rad: function(val)  {  return val * Math.PI / 180; },
  hour2rad: function(val) {  return val * Math.PI / 12; },
  rad2deg: function(val)  {  return val * 180 / Math.PI; },
  rad2hour: function(val) {  return val * 12 / Math.PI; },
};

//Matrix calculations

//Multiply 3x3 matrix with 3d-vector
var vMultiply = function(m, v) {
  var res = []; 
  
  for (var i=0; i < 3; i++) {
    var sum = 0;
    for (var k=0; k < 3; k++) {
      sum += m[i][k] * v[k];
    }
    res[i] = sum;
  }
  return res;  
};

//Multiply two 3x3 matrices
var mMultiply = function(a, b) {
  var res = [];
  
  for (var i=0; i < 3; i++) {
    res[i] = [];
    for (var j=0; j < 3; j++) {
      var sum = 0;
      for (var k=0; k < 3; k++) {
        sum += b[i][k] * a[k][j];
      }
      res [i][j] = sum;
    }
  }
  return res;  
};

var getRotation = function(angle) {
  //Rotation by z- and x-axis
  return mMultiply(rMatrix("z", angle[2]), rMatrix("x", angle[0]));
};

//Get x/y/z-rotation matrix
var rMatrix = function(axis, θ) {
   var r = -θ * Math.PI / 180,
       c = Math.cos(r), s = Math.sin(r);
      
   switch (axis) {
     case "x": return [[1,0,0],[0,c,s],[0,-s,c]];
     case "y": return [[c,0,-s],[0,1,0],[s,0,c]];
     case "z": return [[c,s,0],[-s,c,0],[0,0,1]];
   }
};



var getObject = function(d) {
  var key,
      x = scale.ap(d.ap),
      y = scale.ep(d.ep),
      z = scale.ip(d.sinip),
      col = astColor(d), r;

  if (d.H && d.H !== "") r = Math.sqrt(LIMIT + 1 - d.H);
  else r = 0.9;
      
  return {pos:[x, y, z], col:col, r:r};
};

var getFamily = function(d) {
  var key,
      x = scale.ap(d.ap),
      y = scale.ep(d.ep),
      z = scale.ip(d.sinip); 
      col = "#fff"; //astColor(d), 
      n = d.Name;
      
  return {pos:[x, y, z], col:col, n:n};
};


function astColor(d) {
  var r = 255 * (parseFloat(d.astar) + 0.3) * 2;
  if (r < 0) r = 0;
  if (r > 255) r = 255;

  var b = 255 - r;

  var g = 255 * (parseFloat(d.iz) + 0.5) * 1.42;
  if (g < 0) g = 0;
  if (g > 255) g = 255;
  if (d.iz < 0) r *= (1 + parseFloat(d.iz));

  return "rgb(" + Math.floor(r) + "," + Math.floor(255 - g) + "," + Math.floor(b) + ")";
}

var orientations_3d = {bottomfront: 1, topfront: 1, bottomback: 1, topback: 1, bottomleft: 1, topleft: 1, bottomright: 1, topright: 1, leftfront: 1, rightfront: 1, leftback: 1, rightback: 1};

var axis3d = function() {
  var scale = d3.scale.linear(), orient_ = ["bottom", "front"], innerTickSize = 5, outerTickSize = 5, tickPadding = 4, titlePadding = 14, tickArguments_ = [ ], tickValues = null, tickFormat_, valueFraction = 5, title = "",
  font = "10px sans-serif", titleFont = "14px sans-serif", color = "#fff", width = 1, dash = [];
  
  function axis(ctx) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.setLineDash(dash);
    var ax = orientation(orient_);
    path3d(ax);
    ctx.fillStyle = color;
    if (title !== "") {
      ctx.font = titleFont;
      var r = scale.range(), ctr = (r[0] + r[1]) / 2, c = tickmark(ctr, titlePadding),
          ttl = textmark(c, titlePadding);
      
      text3d(title, ttl);
    }
    if (tickArguments_ === 0) return;
    ctx.font = font;
    var ticks = scale.ticks(tickArguments_); //tickmarks
    ticks.forEach( function(d, i) { 
      var x = scale(d);
      tick = tickmark(x);
      path3d(tick);
      if (i % valueFraction === 0) {  //values
        var txt = textmark(tick, tickPadding);
        text3d(d, txt);
      }
    });
  }
  function orientation(o) {
    var res, c = halfwidth,
        x = scale.range();
    // 
    switch (o.join("")) {
      case "bottomfront": res = [[ x[0],-c,-c], [ x[1],-c,-c]]; break;
      case "topfront":    res = [[ x[0], c,-c], [ x[1], c,-c]]; break;
      case "bottomback":  res = [[ x[0],-c, c], [ x[1],-c, c]]; break;
      case "topback":     res = [[ x[0], c, c], [ x[1], c, c]]; break;

      case "bottomleft":  res = [[-c, x[0],-c], [-c, x[1],-c]]; break;
      case "topleft":     res = [[ c, x[0],-c], [ c, x[1],-c]]; break;
      case "bottomright": res = [[-c, x[0], c], [-c, x[1], c]]; break;
      case "topright":    res = [[ c, x[0], c], [ c, x[1], c]]; break;
      
      case "leftfront":   res = [[-c,-c, x[0]], [-c,-c, x[1]]]; break;
      case "rightfront":  res = [[ c,-c, x[0]], [ c,-c, x[1]]]; break;
      case "leftback":    res = [[-c, c, x[0]], [-c, c, x[1]]]; break;
      case "rightback":   res = [[ c, c, x[0]], [ c, c, x[1]]]; break;
      default: res = [];
    }
    return res;
  }
  function tickmark(x) {
    var res, c = halfwidth, i = innerTickSize, o = outerTickSize;
    // 
    switch (orient_.join("")) {
      case "bottomfront": res = [[ x,-c + i,-c + i], [ x,-c - o,-c - o]]; break;
      case "topfront":    res = [[ x, c - i,-c - i], [ x, c + o,-c + o]]; break;
      case "bottomback":  res = [[ x,-c + i, c + i], [ x,-c - o, c - o]]; break;
      case "topback":     res = [[ x, c - i, c - i], [ x, c + o, c + o]]; break;

      case "bottomleft":  res = [[-c + i, x,-c + i], [-c - o, x,-c - o]]; break;
      case "topleft":     res = [[ c - i, x,-c - i], [ c + o, x,-c + o]]; break;
      case "bottomright": res = [[-c + i, x, c + i], [-c - o, x, c - o]]; break;
      case "topright":    res = [[ c - i, x, c - i], [ c + o, x, c + o]]; break;
      
      case "leftfront":   res = [[-c + i,-c + i, x], [-c - o,-c - o, x]]; break;
      case "rightfront":  res = [[ c - i,-c - i, x], [ c + o,-c + o, x]]; break;
      case "leftback":    res = [[-c + i, c + i, x], [-c - o, c - o, x]]; break;
      case "rightback":   res = [[ c - i, c - i, x], [ c + o, c + o, x]]; break;
      default: res = [];
    }
    return res;
  }

  function textmark(x, pad) {
    var res = x[1];
    // 
    switch (orient_.join("")) {
      case "bottomfront": case "bottomback":  res[1] -= pad; res[2] -= pad; break;
      case "topfront":    case "topback":     res[1] += pad; res[2] += pad; break;

      case "bottomleft":  case "bottomright": res[0] -= pad; res[2] -= pad; break;
      case "topleft":     case "topright":    res[0] += pad; res[2] += pad; break;
      
      case "leftfront":   case "leftback":    res[0] -= pad; res[1] -= pad; break;
      case "rightfront":  case "rightback":   res[0] += pad; res[1] += pad; break;
      default: res = [];
    }
    return res;
  }

  // [scale]
  axis.scale = function(x) {
    if (!arguments.length) return scale;
    scale = x;
    return axis;
  };
  // [bottom|top|left|right, front|back|bottom|top]
  axis.orient = function(x) {
    if (!arguments.length) return orient_;
    if (x.join("") in orientations_3d) orient_ = x;
    return axis;
  };
  // 
  axis.ticks = function() {
    if (!arguments.length) return tickArguments_;
    tickArguments_ = Array.prototype.slice.call(arguments);
    return axis;
  };
  // [n,n,..]
  axis.tickValues = function(x) {
    if (!arguments.length) return tickValues;
    tickValues = x;
    return axis;
  };
  // scale.tickFormat
  axis.tickFormat = function(x) {
    if (!arguments.length) return tickFormat_;
    tickFormat_ = x;
    return axis;
  };
  // [inner, outer]
  axis.tickSize = function(x) {
    var n = arguments.length;
    if (!n) return innerTickSize;
    innerTickSize = +x;
    outerTickSize = +arguments[n - 1];
    return axis;
  };
  axis.innerTickSize = function(x) {
    if (!arguments.length) return innerTickSize;
    innerTickSize = +x;
    return axis;
  };
  axis.outerTickSize = function(x) {
    if (!arguments.length) return outerTickSize;
    outerTickSize = +x;
    return axis;
  };
  axis.tickPadding = function(x) {
    if (!arguments.length) return tickPadding;
    tickPadding = +x;
    return axis;
  };
  axis.titlePadding = function(x) {
    if (!arguments.length) return titlePadding;
    titlePadding = +x;
    return axis;
  };
  axis.tickSubdivide = function() {
    return arguments.length && axis;
  };
  // [linedash]
  axis.dash = function(x) {
    if (!arguments.length) return dash;
    dash = x;
    return axis;
  };
  // [every x tick with value]
  axis.values = function(x) {
    if (!arguments.length) return valueFraction;
    valueFraction = +x;
    return axis;
  };
  axis.title = function(s) {
    if (!arguments.length) return title;
    title = s;
    return axis;
  };
  axis.font = function(s) {
    if (!arguments.length) return font;
    font = s;
    return axis;
  };
  axis.titleFont = function(s) {
    if (!arguments.length) return titleFont;
    titleFont = s;
    return axis;
  };
  return axis;

};

this.Asteroids = Asteroids;
})();