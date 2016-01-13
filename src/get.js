/* global has  */

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
