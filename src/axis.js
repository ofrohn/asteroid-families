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

