# Feigenbaum bifurcation plot

The logistic map
~~~~
 |R -> |R
 x(i) => lambda * x(i-1) * (1-x(i-1))
~~~~
when plotted gives a peek into deterministic chaos. Whilst lambda resides inside the range ~[0..3.2] everthing
seems fine and the recursive definition of the function gives (more or less) convergent series, the situation
changes for values beyond ~3.2, and for values larger than 3.6 the result becomes (pseudo) chaotic, als the
number of accumulation points increases.

Numberphile postet a really nice video about this function/map and the two Feigenbaum constants ...
for those who are new to this topic:
https://www.youtube.com/watch?v=ETrYE4MdoLQ


First attempt to visualize a fraction of the feigenbaum diagram
![Feigenbaum Plot (with errors)](screenshot-20181030_0.png)


Feigenbaum bifurcation (logistic map)
![Plotting the Feigenbaum bifurcation](screenshot-20181212_3_feigenbaum.png "Plotting the Feigenbaum bifurcation")

I made a high resultion plot (13776x924 pixels) which took my machine about an hour to compute.
[Find a live demo here](https://www.int2byte.de/public/feigenbaum-plot/screenshot-feigenbaum-2018-12-12-4-x8.png "Feigenbaum bifurcation live demo")
This file is about 40MB large:
 * plot range [3.2 to 3.83]
 * 500 iterations per sample
 * sample size 0.1 (10 samples per pixel, makes 137.760 samples for lambda)
 * plot (y axis) is scaled up from [0,1]
 * x(0) is 0.2 (this value does not seem to have any affect at all after some iterations)


[Find a live demo here](https://www.int2byte.de/public/feigenbaum-plot/main.html "Feigenbaum bifurcation live demo") (better have a quick engine)



### Changelog
* 2018-12-11
  * Replaced the plotting engine by the PlotBoilerplate.
  * Calculated the first hi-res plot <3
* 2018-10-23
  * Init



###
Dependencies
* HTML5 Canvas
* HTML5 WebGL
* PlotBoilerplate.js

