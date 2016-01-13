# Asteroid Families

 A 3D plot of asteroid families by proper elements and colors implemented with D3.js. Shows main belt asteroids grouped naturally by their proper orbital elements semi major axis (a<sub>p</sub>), inclnation (sin i<sub>p</sub>) and eccentricity (e<sub>p</sub>). The color coding is from diagnostic colors indicative of composition `astar = 0.89 * (g - r) + 0.45 * (r - i) - 0.57` and `i - z`, calculated from SDSS filter bands u, g, r, i, z (See paper linked below for details).

### Files

__CSV data files__

* `ast-proper.csv` Comma separated list of proper elements a,e,i  and colors for all asteroids from the [SDSS Moving Objects Catalog](http://www.astro.washington.edu/users/ivezic/sdssmoc/sdssmoc.html) that have proper elements linked from the [ASTORB Database](ftp://ftp.lowell.edu/pub/elgb/astorb.html)
* `ast-proper.csv` Same list as above, limited to asteroids brighter than absolute magnitude H 14
* `families.csv` Asteroid families with name, median proper elements and SDSS colors from Table 2 in Parker et al. The Size Distributions of Asteroid Families in the SDSS Moving Object Catalog 4 (http://arxiv.org/abs/0807.3762)


Thanks to Mike Bostock for [D3.js](http://d3js.org/) 

Released under [BSD License](LICENSE)