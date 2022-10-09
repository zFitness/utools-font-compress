/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 330:
/***/ ((module, exports, __nccwpck_require__) => {

/**
 * Module dependencies.
 */

var fs = __nccwpck_require__(7147),
  path = __nccwpck_require__(1017),
  fileURLToPath = __nccwpck_require__(9872),
  join = path.join,
  dirname = path.dirname,
  exists =
    (fs.accessSync &&
      function(path) {
        try {
          fs.accessSync(path);
        } catch (e) {
          return false;
        }
        return true;
      }) ||
    fs.existsSync ||
    path.existsSync,
  defaults = {
    arrow: process.env.NODE_BINDINGS_ARROW || ' → ',
    compiled: process.env.NODE_BINDINGS_COMPILED_DIR || 'compiled',
    platform: process.platform,
    arch: process.arch,
    nodePreGyp:
      'node-v' +
      process.versions.modules +
      '-' +
      process.platform +
      '-' +
      process.arch,
    version: process.versions.node,
    bindings: 'bindings.node',
    try: [
      // node-gyp's linked version in the "build" dir
      ['module_root', 'build', 'bindings'],
      // node-waf and gyp_addon (a.k.a node-gyp)
      ['module_root', 'build', 'Debug', 'bindings'],
      ['module_root', 'build', 'Release', 'bindings'],
      // Debug files, for development (legacy behavior, remove for node v0.9)
      ['module_root', 'out', 'Debug', 'bindings'],
      ['module_root', 'Debug', 'bindings'],
      // Release files, but manually compiled (legacy behavior, remove for node v0.9)
      ['module_root', 'out', 'Release', 'bindings'],
      ['module_root', 'Release', 'bindings'],
      // Legacy from node-waf, node <= 0.4.x
      ['module_root', 'build', 'default', 'bindings'],
      // Production "Release" buildtype binary (meh...)
      ['module_root', 'compiled', 'version', 'platform', 'arch', 'bindings'],
      // node-qbs builds
      ['module_root', 'addon-build', 'release', 'install-root', 'bindings'],
      ['module_root', 'addon-build', 'debug', 'install-root', 'bindings'],
      ['module_root', 'addon-build', 'default', 'install-root', 'bindings'],
      // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
      ['module_root', 'lib', 'binding', 'nodePreGyp', 'bindings']
    ]
  };

/**
 * The main `bindings()` function loads the compiled bindings for a given module.
 * It uses V8's Error API to determine the parent filename that this function is
 * being invoked from, which is then used to find the root directory.
 */

function bindings(opts) {
  // Argument surgery
  if (typeof opts == 'string') {
    opts = { bindings: opts };
  } else if (!opts) {
    opts = {};
  }

  // maps `defaults` onto `opts` object
  Object.keys(defaults).map(function(i) {
    if (!(i in opts)) opts[i] = defaults[i];
  });

  // Get the module root
  if (!opts.module_root) {
    opts.module_root = exports.getRoot(exports.getFileName());
  }

  // Ensure the given bindings name ends with .node
  if (path.extname(opts.bindings) != '.node') {
    opts.bindings += '.node';
  }

  // https://github.com/webpack/webpack/issues/4175#issuecomment-342931035
  var requireFunc =
     true
      ? eval("require")
      : 0;

  var tries = [],
    i = 0,
    l = opts.try.length,
    n,
    b,
    err;

  for (; i < l; i++) {
    n = join.apply(
      null,
      opts.try[i].map(function(p) {
        return opts[p] || p;
      })
    );
    tries.push(n);
    try {
      b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
      if (!opts.path) {
        b.path = n;
      }
      return b;
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND' &&
          e.code !== 'QUALIFIED_PATH_RESOLUTION_FAILED' &&
          !/not find/i.test(e.message)) {
        throw e;
      }
    }
  }

  err = new Error(
    'Could not locate the bindings file. Tried:\n' +
      tries
        .map(function(a) {
          return opts.arrow + a;
        })
        .join('\n')
  );
  err.tries = tries;
  throw err;
}
module.exports = exports = bindings;

/**
 * Gets the filename of the JavaScript file that invokes this function.
 * Used to help find the root directory of a module.
 * Optionally accepts an filename argument to skip when searching for the invoking filename
 */

exports.getFileName = function getFileName(calling_file) {
  var origPST = Error.prepareStackTrace,
    origSTL = Error.stackTraceLimit,
    dummy = {},
    fileName;

  Error.stackTraceLimit = 10;

  Error.prepareStackTrace = function(e, st) {
    for (var i = 0, l = st.length; i < l; i++) {
      fileName = st[i].getFileName();
      if (fileName !== __filename) {
        if (calling_file) {
          if (fileName !== calling_file) {
            return;
          }
        } else {
          return;
        }
      }
    }
  };

  // run the 'prepareStackTrace' function above
  Error.captureStackTrace(dummy);
  dummy.stack;

  // cleanup
  Error.prepareStackTrace = origPST;
  Error.stackTraceLimit = origSTL;

  // handle filename that starts with "file://"
  var fileSchema = 'file://';
  if (fileName.indexOf(fileSchema) === 0) {
    fileName = fileURLToPath(fileName);
  }

  return fileName;
};

/**
 * Gets the root directory of a module, given an arbitrary filename
 * somewhere in the module tree. The "root directory" is the directory
 * containing the `package.json` file.
 *
 *   In:  /home/nate/node-native-module/lib/index.js
 *   Out: /home/nate/node-native-module
 */

exports.getRoot = function getRoot(file) {
  var dir = dirname(file),
    prev;
  while (true) {
    if (dir === '.') {
      // Avoids an infinite loop in rare cases, like the REPL
      dir = process.cwd();
    }
    if (
      exists(join(dir, 'package.json')) ||
      exists(join(dir, 'node_modules'))
    ) {
      // Found the 'package.json' file or 'node_modules' dir; we're done
      return dir;
    }
    if (prev === dir) {
      // Got to the top
      throw new Error(
        'Could not find module root given file: "' +
          file +
          '". Do you have a `package.json` file? '
      );
    }
    // Try the parent dir next
    prev = dir;
    dir = join(dir, '..');
  }
};


/***/ }),

/***/ 7244:
/***/ ((module) => {

"use strict";


// Precision used to check determinant in quad and cubic solvers,
// any number lower than this is considered to be zero.
// `8.67e-19` is an example of real error occurring in tests.
var epsilon = 1e-16


function Point (x, y) {
  this.x = x
  this.y = y
}

Point.prototype.add = function (point) {
  return new Point(this.x + point.x, this.y + point.y)
}

Point.prototype.sub = function (point) {
  return new Point(this.x - point.x, this.y - point.y)
}

Point.prototype.mul = function (value) {
  return new Point(this.x * value, this.y * value)
}

Point.prototype.div = function (value) {
  return new Point(this.x / value, this.y / value)
}

/*Point.prototype.dist = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y)
}*/

Point.prototype.sqr = function () {
  return this.x * this.x + this.y * this.y
}

Point.prototype.dot = function (point) {
  return this.x * point.x + this.y * point.y
}

function calcPowerCoefficients (p1, c1, c2, p2) {
  // point(t) = p1*(1-t)^3 + c1*t*(1-t)^2 + c2*t^2*(1-t) + p2*t^3 = a*t^3 + b*t^2 + c*t + d
  // for each t value, so
  // a = (p2 - p1) + 3 * (c1 - c2)
  // b = 3 * (p1 + c2) - 6 * c1
  // c = 3 * (c1 - p1)
  // d = p1
  var a = p2.sub(p1).add(c1.sub(c2).mul(3))
  var b = p1.add(c2).mul(3).sub(c1.mul(6))
  var c = c1.sub(p1).mul(3)
  var d = p1
  return [a, b, c, d]
}

function calcPowerCoefficientsQuad (p1, c1, p2) {
  // point(t) = p1*(1-t)^2 + c1*t*(1-t) + p2*t^2 = a*t^2 + b*t + c
  // for each t value, so
  // a = p1 + p2 - 2 * c1
  // b = 2 * (c1 - p1)
  // c = p1
  var a = c1.mul(-2).add(p1).add(p2)
  var b = c1.sub(p1).mul(2)
  var c = p1
  return [a, b, c]
}

function calcPoint (a, b, c, d, t) {
  // a*t^3 + b*t^2 + c*t + d = ((a*t + b)*t + c)*t + d
  return a.mul(t).add(b).mul(t).add(c).mul(t).add(d)
}

function calcPointQuad (a, b, c, t) {
  // a*t^2 + b*t + c = (a*t + b)*t + c
  return a.mul(t).add(b).mul(t).add(c)
}

function calcPointDerivative (a, b, c, d, t) {
  // d/dt[a*t^3 + b*t^2 + c*t + d] = 3*a*t^2 + 2*b*t + c = (3*a*t + 2*b)*t + c
  return a.mul(3 * t).add(b.mul(2)).mul(t).add(c)
}

function quadSolve (a, b, c) {
  // a*x^2 + b*x + c = 0
  if (a === 0) {
    return (b === 0) ? [] : [-c / b]
  }
  var D = b * b - 4 * a * c
  if (Math.abs(D) < epsilon) {
    return [-b / (2 * a)]
  } else if (D < 0) {
    return []
  }
  var DSqrt = Math.sqrt(D)
  return [(-b - DSqrt) / (2 * a), (-b + DSqrt) / (2 * a)]
}

/*function cubicRoot(x) {
  return (x < 0) ? -Math.pow(-x, 1/3) : Math.pow(x, 1/3)
}

function cubicSolve(a, b, c, d) {
  // a*x^3 + b*x^2 + c*x + d = 0
  if (a === 0) {
    return quadSolve(b, c, d)
  }
  // solve using Cardan's method, which is described in paper of R.W.D. Nickals
  // http://www.nickalls.org/dick/papers/maths/cubic1993.pdf (doi:10.2307/3619777)
  var xn = -b / (3*a) // point of symmetry x coordinate
  var yn = ((a * xn + b) * xn + c) * xn + d // point of symmetry y coordinate
  var deltaSq = (b*b - 3*a*c) / (9*a*a) // delta^2
  var hSq = 4*a*a * Math.pow(deltaSq, 3) // h^2
  var D3 = yn*yn - hSq
  if (Math.abs(D3) < epsilon) { // 2 real roots
    var delta1 = cubicRoot(yn/(2*a))
    return [ xn - 2 * delta1, xn + delta1 ]
  } else if (D3 > 0) { // 1 real root
    var D3Sqrt = Math.sqrt(D3)
    return [ xn + cubicRoot((-yn + D3Sqrt)/(2*a)) + cubicRoot((-yn - D3Sqrt)/(2*a)) ]
  }
  // 3 real roots
  var theta = Math.acos(-yn / Math.sqrt(hSq)) / 3
  var delta = Math.sqrt(deltaSq)
  return [
    xn + 2 * delta * Math.cos(theta),
    xn + 2 * delta * Math.cos(theta + Math.PI * 2 / 3),
    xn + 2 * delta * Math.cos(theta + Math.PI * 4 / 3)
  ]
}*/

/*
 * Calculate a distance between a `point` and a line segment `p1, p2`
 * (result is squared for performance reasons), see details here:
 * https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
 */
function minDistanceToLineSq (point, p1, p2) {
  var p1p2 = p2.sub(p1)
  var dot = point.sub(p1).dot(p1p2)
  var lenSq = p1p2.sqr()
  var param = 0
  var diff
  if (lenSq !== 0) param = dot / lenSq
  if (param <= 0) {
    diff = point.sub(p1)
  } else if (param >= 1) {
    diff = point.sub(p2)
  } else {
    diff = point.sub(p1.add(p1p2.mul(param)))
  }
  return diff.sqr()
}

/*function minDistanceToQuad(point, p1, c1, p2) {
  // f(t) = (1-t)^2 * p1 + 2*t*(1 - t) * c1 + t^2 * p2 = a*t^2 + b*t + c, t in [0, 1],
  // a = p1 + p2 - 2 * c1
  // b = 2 * (c1 - p1)
  // c = p1; a, b, c are vectors because p1, c1, p2 are vectors too
  // The distance between given point and quadratic curve is equal to
  // sqrt((f(t) - point)^2), so these expression has zero derivative by t at points where
  // (f'(t), (f(t) - point)) = 0.
  // Substituting quadratic curve as f(t) one could obtain a cubic equation
  // e3*t^3 + e2*t^2 + e1*t + e0 = 0 with following coefficients:
  // e3 = 2 * a^2
  // e2 = 3 * a*b
  // e1 = (b^2 + 2 * a*(c - point))
  // e0 = (c - point)*b
  // One of the roots of the equation from [0, 1], or t = 0 or t = 1 is a value of t
  // at which the distance between given point and quadratic Bezier curve has minimum.
  // So to find the minimal distance one have to just pick the minimum value of
  // the distance on set {t = 0 | t = 1 | t is root of the equation from [0, 1] }.

  var a = p1.add(p2).sub(c1.mul(2))
  var b = c1.sub(p1).mul(2)
  var c = p1
  var e3 = 2 * a.sqr()
  var e2 = 3 * a.dot(b)
  var e1 = (b.sqr() + 2 * a.dot(c.sub(point)))
  var e0 = c.sub(point).dot(b)
  var candidates = cubicSolve(e3, e2, e1, e0).filter(function (t) { return t > 0 && t < 1 }).concat([ 0, 1 ])

  var minDistance = 1e9
  for (var i = 0; i < candidates.length; i++) {
    var distance = calcPointQuad(a, b, c, candidates[i]).sub(point).dist()
    if (distance < minDistance) {
      minDistance = distance
    }
  }
  return minDistance
}*/


function processSegment (a, b, c, d, t1, t2) {
  // Find a single control point for given segment of cubic Bezier curve
  // These control point is an interception of tangent lines to the boundary points
  // Let's denote that f(t) is a vector function of parameter t that defines the cubic Bezier curve,
  // f(t1) + f'(t1)*z1 is a parametric equation of tangent line to f(t1) with parameter z1
  // f(t2) + f'(t2)*z2 is the same for point f(t2) and the vector equation
  // f(t1) + f'(t1)*z1 = f(t2) + f'(t2)*z2 defines the values of parameters z1 and z2.
  // Defining fx(t) and fy(t) as the x and y components of vector function f(t) respectively
  // and solving the given system for z1 one could obtain that
  //
  //      -(fx(t2) - fx(t1))*fy'(t2) + (fy(t2) - fy(t1))*fx'(t2)
  // z1 = ------------------------------------------------------.
  //            -fx'(t1)*fy'(t2) + fx'(t2)*fy'(t1)
  //
  // Let's assign letter D to the denominator and note that if D = 0 it means that the curve actually
  // is a line. Substituting z1 to the equation of tangent line to the point f(t1), one could obtain that
  // cx = [fx'(t1)*(fy(t2)*fx'(t2) - fx(t2)*fy'(t2)) + fx'(t2)*(fx(t1)*fy'(t1) - fy(t1)*fx'(t1))]/D
  // cy = [fy'(t1)*(fy(t2)*fx'(t2) - fx(t2)*fy'(t2)) + fy'(t2)*(fx(t1)*fy'(t1) - fy(t1)*fx'(t1))]/D
  // where c = (cx, cy) is the control point of quadratic Bezier curve.

  var f1 = calcPoint(a, b, c, d, t1)
  var f2 = calcPoint(a, b, c, d, t2)
  var f1_ = calcPointDerivative(a, b, c, d, t1)
  var f2_ = calcPointDerivative(a, b, c, d, t2)

  var D = -f1_.x * f2_.y + f2_.x * f1_.y
  if (Math.abs(D) < 1e-8) {
    return [f1, f1.add(f2).div(2), f2] // straight line segment
  }
  var cx = (f1_.x * (f2.y * f2_.x - f2.x * f2_.y) + f2_.x * (f1.x * f1_.y - f1.y * f1_.x)) / D
  var cy = (f1_.y * (f2.y * f2_.x - f2.x * f2_.y) + f2_.y * (f1.x * f1_.y - f1.y * f1_.x)) / D
  return [f1, new Point(cx, cy), f2]
}

/*function isSegmentApproximationClose(a, b, c, d, tmin, tmax, p1, c1, p2, errorBound) {
  // a,b,c,d define cubic curve
  // tmin, tmax are boundary points on cubic curve
  // p1, c1, p2 define quadratic curve
  // errorBound is maximum allowed distance
  // Try to find maximum distance between one of N points segment of given cubic
  // and corresponding quadratic curve that estimates the cubic one, assuming
  // that the boundary points of cubic and quadratic points are equal.
  //
  // The distance calculation method comes from Hausdorff distance defenition
  // (https://en.wikipedia.org/wiki/Hausdorff_distance), but with following simplifications
  // * it looks for maximum distance only for finite number of points of cubic curve
  // * it doesn't perform reverse check that means selecting set of fixed points on
  //   the quadratic curve and looking for the closest points on the cubic curve
  // But this method allows easy estimation of approximation error, so it is enough
  // for practical purposes.

  var n = 10 // number of points + 1
  var dt = (tmax - tmin) / n
  for (var t = tmin + dt; t < tmax - dt; t += dt) { // don't check distance on boundary points
                                                    // because they should be the same
    var point = calcPoint(a, b, c, d, t)
    if (minDistanceToQuad(point, p1, c1, p2) > errorBound) {
      return false
    }
  }
  return true
}*/


/*
 * Divide cubic and quadratic curves into 10 points and 9 line segments.
 * Calculate distances between each point on cubic and nearest line segment
 * on quadratic (and vice versa), and make sure all distances are less
 * than `errorBound`.
 *
 * We need to calculate BOTH distance from all points on quadratic to any cubic,
 * and all points on cubic to any quadratic.
 *
 * If we do it only one way, it may lead to an error if the entire original curve
 * falls within errorBound (then **any** quad will erroneously treated as good):
 * https://github.com/fontello/svg2ttf/issues/105#issuecomment-842558027
 *
 *  - a,b,c,d define cubic curve (power coefficients)
 *  - tmin, tmax are boundary points on cubic curve (in 0-1 range)
 *  - p1, c1, p2 define quadratic curve (control points)
 *  - errorBound is maximum allowed distance
 */
function isSegmentApproximationClose (a, b, c, d, tmin, tmax, p1, c1, p2, errorBound) {
  var n = 10 // number of points
  var t, dt
  var p = calcPowerCoefficientsQuad(p1, c1, p2)
  var qa = p[0], qb = p[1], qc = p[2]
  var i, j, distSq
  var errorBoundSq = errorBound * errorBound
  var cubicPoints = []
  var quadPoints  = []
  var minDistSq

  dt = (tmax - tmin) / n
  for (i = 0, t = tmin; i <= n; i++, t += dt) {
    cubicPoints.push(calcPoint(a, b, c, d, t))
  }

  dt = 1 / n
  for (i = 0, t = 0; i <= n; i++, t += dt) {
    quadPoints.push(calcPointQuad(qa, qb, qc, t))
  }

  for (i = 1; i < cubicPoints.length - 1; i++) {
    minDistSq = Infinity
    for (j = 0; j < quadPoints.length - 1; j++) {
      distSq = minDistanceToLineSq(cubicPoints[i], quadPoints[j], quadPoints[j + 1])
      minDistSq = Math.min(minDistSq, distSq)
    }
    if (minDistSq > errorBoundSq) return false
  }

  for (i = 1; i < quadPoints.length - 1; i++) {
    minDistSq = Infinity
    for (j = 0; j < cubicPoints.length - 1; j++) {
      distSq = minDistanceToLineSq(quadPoints[i], cubicPoints[j], cubicPoints[j + 1])
      minDistSq = Math.min(minDistSq, distSq)
    }
    if (minDistSq > errorBoundSq) return false
  }

  return true
}

function _isApproximationClose (a, b, c, d, quadCurves, errorBound) {
  var dt = 1 / quadCurves.length
  for (var i = 0; i < quadCurves.length; i++) {
    var p1 = quadCurves[i][0]
    var c1 = quadCurves[i][1]
    var p2 = quadCurves[i][2]
    if (!isSegmentApproximationClose(a, b, c, d, i * dt, (i + 1) * dt, p1, c1, p2, errorBound)) {
      return false
    }
  }
  return true
}

function fromFlatArray (points) {
  var result = []
  var segmentsNumber = (points.length - 2) / 4
  for (var i = 0; i < segmentsNumber; i++) {
    result.push([
      new Point(points[4 * i], points[4 * i + 1]),
      new Point(points[4 * i + 2], points[4 * i + 3]),
      new Point(points[4 * i + 4], points[4 * i + 5])
    ])
  }
  return result
}

function toFlatArray (quadsList) {
  var result = []
  result.push(quadsList[0][0].x)
  result.push(quadsList[0][0].y)
  for (var i = 0; i < quadsList.length; i++) {
    result.push(quadsList[i][1].x)
    result.push(quadsList[i][1].y)
    result.push(quadsList[i][2].x)
    result.push(quadsList[i][2].y)
  }
  return result
}

function isApproximationClose (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, quads, errorBound) {
  // TODO: rewrite it in C-style and remove _isApproximationClose
  var pc = calcPowerCoefficients(
    new Point(p1x, p1y),
    new Point(c1x, c1y),
    new Point(c2x, c2y),
    new Point(p2x, p2y)
  )
  return _isApproximationClose(pc[0], pc[1], pc[2], pc[3], fromFlatArray(quads), errorBound)
}


/*
 * Split cubic bézier curve into two cubic curves, see details here:
 * https://math.stackexchange.com/questions/877725
 */
function subdivideCubic (x1, y1, x2, y2, x3, y3, x4, y4, t) {
  var u = 1 - t
  var v = t

  var bx = x1 * u + x2 * v
  var sx = x2 * u + x3 * v
  var fx = x3 * u + x4 * v
  var cx = bx * u + sx * v
  var ex = sx * u + fx * v
  var dx = cx * u + ex * v

  var by = y1 * u + y2 * v
  var sy = y2 * u + y3 * v
  var fy = y3 * u + y4 * v
  var cy = by * u + sy * v
  var ey = sy * u + fy * v
  var dy = cy * u + ey * v

  return [
    [x1, y1, bx, by, cx, cy, dx, dy],
    [dx, dy, ex, ey, fx, fy, x4, y4]
  ]
}

function byNumber (x, y) { return x - y }

/*
 * Find inflection points on a cubic curve, algorithm is similar to this one:
 * http://www.caffeineowl.com/graphics/2d/vectorial/cubic-inflexion.html
 */
function solveInflections (x1, y1, x2, y2, x3, y3, x4, y4) {
  var p = -(x4 * (y1 - 2 * y2 + y3)) + x3 * (2 * y1 - 3 * y2 + y4) +
            x1 * (y2 - 2 * y3 + y4) - x2 * (y1 - 3 * y3 + 2 * y4)
  var q = x4 * (y1 - y2) + 3 * x3 * (-y1 + y2) + x2 * (2 * y1 - 3 * y3 + y4) - x1 * (2 * y2 - 3 * y3 + y4)
  var r = x3 * (y1 - y2) + x1 * (y2 - y3) + x2 * (-y1 + y3)

  return quadSolve(p, q, r).filter(function (t) { return t > 1e-8 && t < 1 - 1e-8 }).sort(byNumber)
}


/*
 * Approximate cubic Bezier curve defined with base points p1, p2 and control points c1, c2 with
 * with a few quadratic Bezier curves.
 * The function uses tangent method to find quadratic approximation of cubic curve segment and
 * simplified Hausdorff distance to determine number of segments that is enough to make error small.
 * In general the method is the same as described here: https://fontforge.github.io/bezier.html.
 */
function _cubicToQuad (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, errorBound) {
  var p1 = new Point(p1x, p1y)
  var c1 = new Point(c1x, c1y)
  var c2 = new Point(c2x, c2y)
  var p2 = new Point(p2x, p2y)
  var pc = calcPowerCoefficients(p1, c1, c2, p2)
  var a = pc[0], b = pc[1], c = pc[2], d = pc[3]

  var approximation
  for (var segmentsCount = 1; segmentsCount <= 8; segmentsCount++) {
    approximation = []
    for (var t = 0; t < 1; t += (1 / segmentsCount)) {
      approximation.push(processSegment(a, b, c, d, t, t + (1 / segmentsCount)))
    }
    if (segmentsCount === 1 &&
      (approximation[0][1].sub(p1).dot(c1.sub(p1)) < 0 ||
       approximation[0][1].sub(p2).dot(c2.sub(p2)) < 0)) {
      // approximation concave, while the curve is convex (or vice versa)
      continue
    }
    if (_isApproximationClose(a, b, c, d, approximation, errorBound)) {
      break
    }
  }
  return toFlatArray(approximation)
}


/*
 * If this curve has any inflection points, split the curve and call
 * _cubicToQuad function on each resulting curve.
 */
function cubicToQuad (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, errorBound) {
  var inflections = solveInflections(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y)

  if (!inflections.length) {
    return _cubicToQuad(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, errorBound)
  }

  var result = []
  var curve = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y]
  var prevPoint = 0
  var quad, split

  for (var inflectionIdx = 0; inflectionIdx < inflections.length; inflectionIdx++) {
    split = subdivideCubic(
      curve[0], curve[1], curve[2], curve[3],
      curve[4], curve[5], curve[6], curve[7],
      // we make a new curve, so adjust inflection point accordingly
      1 - (1 - inflections[inflectionIdx]) / (1 - prevPoint)
    )

    quad = _cubicToQuad(
      split[0][0], split[0][1], split[0][2], split[0][3],
      split[0][4], split[0][5], split[0][6], split[0][7],
      errorBound
    )

    result = result.concat(quad.slice(0, -2))
    curve = split[1]
    prevPoint = inflections[inflectionIdx]
  }

  quad = _cubicToQuad(
    curve[0], curve[1], curve[2], curve[3],
    curve[4], curve[5], curve[6], curve[7],
    errorBound
  )

  return result.concat(quad)
}


module.exports = cubicToQuad
// following exports are for testing purposes
module.exports.isApproximationClose = isApproximationClose
//module.exports.cubicSolve = cubicSolve
module.exports.quadSolve = quadSolve


/***/ }),

/***/ 9872:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {


/**
 * Module dependencies.
 */

var sep = (__nccwpck_require__(1017).sep) || '/';

/**
 * Module exports.
 */

module.exports = fileUriToPath;

/**
 * File URI to Path function.
 *
 * @param {String} uri
 * @return {String} path
 * @api public
 */

function fileUriToPath (uri) {
  if ('string' != typeof uri ||
      uri.length <= 7 ||
      'file://' != uri.substring(0, 7)) {
    throw new TypeError('must pass in a file:// URI to convert to a file path');
  }

  var rest = decodeURI(uri.substring(7));
  var firstSlash = rest.indexOf('/');
  var host = rest.substring(0, firstSlash);
  var path = rest.substring(firstSlash + 1);

  // 2.  Scheme Definition
  // As a special case, <host> can be the string "localhost" or the empty
  // string; this is interpreted as "the machine from which the URL is
  // being interpreted".
  if ('localhost' == host) host = '';

  if (host) {
    host = sep + sep + host;
  }

  // 3.2  Drives, drive letters, mount points, file system root
  // Drive letters are mapped into the top of a file URI in various ways,
  // depending on the implementation; some applications substitute
  // vertical bar ("|") for the colon after the drive letter, yielding
  // "file:///c|/tmp/test.txt".  In some cases, the colon is left
  // unchanged, as in "file:///c:/tmp/test.txt".  In other cases, the
  // colon is simply omitted, as in "file:///c/tmp/test.txt".
  path = path.replace(/^(.+)\|/, '$1:');

  // for Windows, we need to invert the path separators from what a URI uses
  if (sep == '\\') {
    path = path.replace(/\//g, '\\');
  }

  if (/^.+\:/.test(path)) {
    // has Windows drive at beginning of path
  } else {
    // unix path…
    path = sep + path;
  }

  return host + path;
}


/***/ }),

/***/ 390:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var _ = __nccwpck_require__(5037)

var Class = (function() {
  var _mix = function(r, s) {
    for (var p in s) {
      if (s.hasOwnProperty(p)) {
        r[p] = s[p]
      }
    }
  }
  var _extend = function() {
    //开关 用来使生成原型时,不调用真正的构成流程init
    this.initPrototype = true
    var prototype = new this()
    this.initPrototype = false

    var items = Array.prototype.slice.call(arguments) || []
    var item

    //支持混入多个属性，并且支持{}也支持 Function
    while (item = items.shift()) {
      _mix(prototype, item.prototype || item)
    }
    var SubClass = function() {
      if (!SubClass.initPrototype && this.init) {
        this.init.apply(this, arguments) //调用init真正的构造函数
      }

    }

    // 赋值原型链，完成继承
    SubClass.prototype = prototype

    // 改变constructor引用
    SubClass.prototype.constructor = SubClass

    // 为子类也添加extend方法
    SubClass.extend = _extend

    return SubClass
  }
    //超级父类
  var Class = function() {}
    //为超级父类添加extend方法
  Class.extend = _extend

  return Class
})()

var BASE = Class.extend({
  defaultOptions: {},
  init: function(options) {
    this.setOptions(options)
  },
  setOptions: function(options) {
    if (!this.options) {
      this.options = _.extend({}, this.defaultOptions)
    }
    _.extend(this.options, options)

  },
  get: function(key) {
    //todo 支持getter,setter
    return this.options[key]
  },
  set: function(key, value) {
    //todo 支持getter,setter
    this.options[key] = value
  }

})

module.exports = BASE

/***/ }),

/***/ 4662:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var Base = __nccwpck_require__(390)
var engine = __nccwpck_require__(6206)
var helper = __nccwpck_require__(6773)
var Glyph = __nccwpck_require__(6314)
var Fontface = __nccwpck_require__(4456)
var config = __nccwpck_require__(2835)
var easySvg = __nccwpck_require__(2924)
var _ = __nccwpck_require__(5037)


//生成一个glyph对象
var _generateGlyph = function(value) {
  if (value instanceof Glyph) {
    //需要clone一个，不然会对上一个的产生影响
    //先new一个默认的字形
    var g = new Glyph(value.options)
    g.__font = value.__font
    return g
  }
  if (_.isString(value) && /\<svg/.test(value)) {
    return new Glyph({
      svg: value
    })
  }

  if (_.isObject(value)) {
    //需要解析好d参数，对于svg直接转换
    var ops = _.clone(value);
    return new Glyph(ops)
  }

  return null
}

var Font = Base.extend({
  defaultOptions: config.DEFAULT_OPTIONS.font,
  init: function(options) {
    var self = this
    self.__glyphs = {}
    self.__fontface = new Fontface()
    self.setOptions(options)
  },
  /**
   * 获取当前字体的fontface
   * @return {Fontface} 当前字体的Fontface对象
   */
  getFontface: function() {
    return this.__fontface
  },
  /**
   * 设置当前字体的fontface
   * @param {obj} options Fontface对象或者是构造参数
   */
  setFontface: function(options) {
    if (options instanceof Fontface) return options
    options = options || {}
    this.__fontface = new Fontface(options)
  },

  /**
   * 获取一个或多个字形的svg
   * @param  {string|array} keys 需要获取的字型的unicode,可以是数组也可以是单个
   *
   * @return {array} 如果只有一个就返回单个字符串，否则返回一个hash 集合
   */
  getSvg: function(keys,options) {
    var glys = this.getGlyph(keys)
    if (!glys) return ''

    options = options || {}

    if (glys instanceof Glyph) {
      return glys.toSvg(options)
    }

    if (_.keys(glys).length > 0) {
      return _.map(glys, function(gly) {
        return (gly && gly instanceof Glyph) ? gly.toSvg(options) : ''
      })
    }

    return ''
  },
  /**
   * 设置unicode对应svg
   * @param {string} key 需要设置的unicode
   * @param {glyph|object} value 需要设置的值，一个svg字符串
   * 支持同时设置多个，这时参数是一个对象
   * @param {object} maps 字形hash,key,value同上
   */
  setSvg: function() {
    //调用setGlyph来完成
    this.setGlyph.apply(this, _.toArray(arguments))
  },
  /**
   * 获取一个或多个字形
   * @param  {string|array} keys 需要获取的字型的unicode,可以是数组也可以是单个
   *
   * @return {array} 返回拿到的字形对象数组
   */
  getGlyph: function(keys) {
    var self = this
    var result = {}

    if (!keys) {
      helper.showError('need keys.')
    }

    if (_.isString(keys)) {
      keys = helper.toUnicode(keys)
    }

    if (_.isArray(keys)) {
      keys = _.map(keys, function(key) {
        return helper.normalizeUnicode(key)
      })
    }

    //单个key，直接返回对应的字形对象
    if (keys.length === 1) {
      return self.__glyphs[keys[0]]
    }

    _.each(keys, function(key) {
      result[key] = self.__glyphs[key]
    })

    return result

  },
  /**
   * 设置字形
   * @param {string} key 需要设置的unicode
   * @param {glyph|object} value 需要设置的值，可以是一个glyph对象也可以是glyph的options
   * 支持同时设置多个，这时参数是一个对象
   * @param {object} maps 字形hash,key,value同上
   */
  setGlyph: function() {
    var self = this
    var map = null
    if (arguments.length == 2) {
      map = {}
      map[arguments[0]] = arguments[1]
    }

    if (arguments.length == 1 && _.isObject(arguments[0])) {
      map = arguments[0]
    }

    if (!map) return
    var glyph
    _.each(map, function(value, unicode) {
      unicode = helper.normalizeUnicode(unicode)
      glyph = _generateGlyph.call(self, value)

      if (glyph) {
          //重写unicode
        glyph.set('unicode', unicode)
          //如果发现没有设置name,就使用unicode
        if (!glyph.get('glyphName')) glyph.set('glyphName', 'uni' + unicode.replace(/(&#x)|(;)/g, ''))
          //设置对应的新字体，进行各种适配转换
        glyph.setFont(self)
      }
    })
  },

  /**
   * 返回所有的字形对象
   * @return {array}       glyph hash
   */
  allGlyph: function() {
    return this.__glyphs
  },

  /**
   * 生成当前字体的svg字体内容
   * @return {string}         svg font
   */
  toString: function() {

    //渲染模板
    return _.template(config.FONT_TMPL)({
      font: this.options,
      fontface: helper.key2underline(this.__fontface.options),
      glyphs: this.__glyphs,
      //判断原始字体里面是否已经有了x,没有的话需要补上默认的。因为在xp下没有这个，会蓝屏。
      hasX: this.__glyphs['&#x78;'] ? true : false
    })

  },


  /**
   * 清空当前字体
   *
   * @return {font}  清空后的字体
   */
  clean: function() {
    this.__glyphs = {}
    return this
  },

  /**
   * 字体瘦身
   * @param {string} input 参考的字符串，支持unicode,文字,可以重复
   *
   * @return {font}  瘦身后的字体
   */
  min: function(input) {
    var tmpGlyphs = this.__glyphs
    var unicodes = helper.toUnicode(input)

    this.__glyphs = _.pickBy(tmpGlyphs, function(glyph, unicode) {
      return _.indexOf(unicodes, unicode) !== -1
    })
    return this
  },

  /**
   * 导出字体
   * @param {object} options 导出参数
   * @param {string} options.path 目标地址，没有后缀。可以不传，这样就会生成一个buffer对象，可以自己处置。
   * @param {string} options.types 导出的字体格式，默认是 ['svg', 'ttf', 'eot', 'woff', 'woff2']，lib/helper/engine.js 中的 ALL_FONTS_TYPES
   *
   * @return {array} 字体buffer对象数组
   */
  output: function(options) {
    options = options || {}
    if (!options.input) {
      options.input = this.toString()
    }
    return engine.convert(options)
  }

})

module.exports = Font


/***/ }),

/***/ 4456:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var Base = __nccwpck_require__(390)
var config = __nccwpck_require__(2835)

var Fontface = Base.extend({
  defaultOptions: config.DEFAULT_OPTIONS.fontface,
  init: function(options) {
    this.setOptions(options)
  }
})

module.exports = Fontface

/***/ }),

/***/ 6314:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var Base = __nccwpck_require__(390)

var _ = __nccwpck_require__(5037)
var helper = __nccwpck_require__(6773)
var config = __nccwpck_require__(2835)
var easySvg = __nccwpck_require__(2924)
var svgpath = __nccwpck_require__(455)
var _path = __nccwpck_require__(1017)
var fs = __nccwpck_require__(7147)

var Glyph = Base.extend({
  defaultOptions: config.DEFAULT_OPTIONS.glyph,
  init: function(options) {
    this.setOptions(options)
      //这边直接用require是为了防止循环引用
    var Font = __nccwpck_require__(4662)
    var Fontface = __nccwpck_require__(4456)

    //给一个默认的没有偏移的字体，不需要偏移转换
    this.__font = new Font({
      id: config.FONT_FAMILY,
      horizAdvX: this.get('horizAdvX'),
      vertAdvY: this.get('vertAdvY')
    })
    this.__font.__fontface = new Fontface({
      ascent: 0,
      descent: -this.get('vertAdvY'),
      unitsPerEm: this.get('vertAdvY'),
      fontFamily: config.FONT_FAMILY
    })

    //没有d参数，但是有svg参数，就进行转换
    if (!this.get('d') && options.svg) {
      var pathObj = easySvg.normalizeSvg(options.svg, {
          targetHeight: this.__font.get('vertAdvY')
        })
        //翻转
      pathObj.path = easySvg.reversal(pathObj.path)
      this.set('d', pathObj.path)
      this.set('horizAdvX', pathObj.viewbox[2])
      this.set('vertAdvY', pathObj.viewbox[3])
    }

  },
  getFont:function(){
    return this.__font
  },
  /**
   * 设置对应的字体，针对新的字体做出转换
   * @param {Font} dstFont 对应的字体对象
   *
   * @return {Font} 返回对应的字体对象
   */
  setFont: function(dstFont) {
    var dstFontAscent = dstFont.__fontface.get('ascent')
    var curFontAscent = this.__font.__fontface.get('ascent')
    var path = this.get('d')
    var scale, ascent
    //当前有新的字体就需要做出转换
    if (this.__font && this.__font != dstFont) {
      //算出字体的比例，进行缩放还有参数变化
      scale = this.__font.get('vertAdvY') / dstFont.get('vertAdvY')
      ascent = curFontAscent ? 0 : dstFontAscent * scale
      path = svgpath(path).scale(1 / scale).translate(0, ascent).round(config.PATH_DECIMAL).toString()

      this.set('d', path)
      this.set('horizAdvX', parseInt(this.get('horizAdvX') / scale))
      this.set('vertAdvY', parseInt(this.get('vertAdvY') / scale))

    }

    var unicode = this.get('unicode')
    //去掉老的引用
    //只有引用的是自己才需要移除，
    //因为存在一种情况就是这个glyph是使用当前的配置参数新建的
    //但是跟老的具有相同的字体引用，不能误删
    if (this.__font && this.__font.__glyphs[unicode] === this) {
      delete this.__font.__glyphs[unicode]
    }

    //设置新的引用
    dstFont.__glyphs[this.get('unicode')] = this

    this.__font = dstFont


    return dstFont
  },
  /**
   * 获取当前字形的svg
   * @param  {object} options 导入的选项
   * @param  {string} options.path            导出svg的路径，可以不传,不传就不会写文件
   * @param  {string} options.skipViewport    如果为true，那么将不会注入width和height
   * @param  {string} options.width           导出svg的宽度,默认100px
   * @param  {string} options.height          导出svg的高度,默认100px
   *
   * @return {string}  svg字符串
   */
  toSvg: function(options) {
      var data = _.clone(this.options)
      var ascent = this.__font.__fontface.get('ascent')
      var svgStr = ''

      data.d = svgpath(data.d).translate(0, -ascent).scale(1, -1).round(config.PATH_DECIMAL).toString()

      options = options || {}

      _.defaults(options, config.DEFAULT_EXPORT_OPTIONS)

      svgStr = _.template(config.SVG_TMPL)({
        glyph: data,
        options: options
      })
      if (options.path) {
        path = _path.resolve(process.cwd(), path)
        fs.writeFileSync(path, svgStr)
      }

      return svgStr
    }
    //todo toPng
})

module.exports = Glyph


/***/ }),

/***/ 2835:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var multiline = __nccwpck_require__(3812)

//导出svg的配置
exports.DEFAULT_EXPORT_OPTIONS = {
  width: '100px',
  height: '100px',
}

//path 保留小数位
exports.PATH_DECIMAL = 4

exports.FONT_FAMILY = 'iconfont'


//默认的配置参数
exports.DEFAULT_OPTIONS = {
  font: {
    id: this.FONT_FAMILY,
    horizAdvX: 1024,
    vertAdvY: 1024
      // horizOriginX: null,
      // horizOriginY: null,
      // vertOriginX: null,
      // vertOriginY: null
  },
  fontface: {
    fontFamily: this.FONT_FAMILY,
    fontWeight: '400',
    fontStretch: 'normal',
    unitsPerEm: '1024',
    ascent: '812',
    descent: '-212'
  },
  glyph: {
    unicode: '',
    glyphName: '',
    d: '',
    horizAdvX: 1024,
    vertAdvY: 1024
  }
}



exports.FONT_TMPL = multiline(function() {/*!
<?xml version="1.0" standalone="no"?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
  <svg>
  <metadata>
  Created by font-carrier
  </metadata>
  <defs>
  <font id="<%= font.id %>" horiz-adv-x="<%= font.horizAdvX %>" vert-adv-y="<%= font.horizAdvX %>" >
    <font-face
      <% for(var v in fontface){ %>
      <% print(v + '="' + fontface[v] + '"') %>
      <%} %>
    />
      <missing-glyph />

      <% if(!hasX){ %>
      <glyph glyph-name="x" unicode="&#x78;" horiz-adv-x="100"
        d="M20 20 L50 20 L50 -20 Z" />
      <% } %>

      <% for(var i in glyphs){
        var glyph = glyphs[i].options;
       %>
      <glyph glyph-name="<%= glyph['glyphName'] %>" unicode="<%= glyph['unicode']%>" d="<%= glyph['d']%>"  <% if (glyph['horizAdvX']) print('horiz-adv-x="'+ glyph['horizAdvX']+'"') %> <% if (glyph['vertAdvY']) print('vert-adv-y="'+ glyph['vertAdvY']+'"') %>  />

      <% } %>

  </font>
  </defs>
</svg>
*/
})


exports.SVG_TMPL = multiline(function() {/*!
<?xml version="1.0" encoding="utf-8"?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" <% if(!options['skipViewport']){ %>  x="0" y="0"   width="<%= options['width'] %>" height="<%= options['height'] %>" <% } %> viewBox="0 0 <%= glyph['horizAdvX'] %> <%= glyph['vertAdvY'] %>">
  <path d="<%= glyph['d'] %>"/>
  </svg>
*/
})


/***/ }),

/***/ 6206:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var path = __nccwpck_require__(1017)
var fs = __nccwpck_require__(7147);
var _ = __nccwpck_require__(5037)
var helper = __nccwpck_require__(6773)
var opentype = __nccwpck_require__(5423)
var DOMParser = (__nccwpck_require__(4887)/* .DOMParser */ .a)


var svg2ttf = __nccwpck_require__(526)
var ttf2svg = __nccwpck_require__(4821)
var ttf2eot = __nccwpck_require__(6689)
var ttf2woff = __nccwpck_require__(5610)
var ttf2woff2 = __nccwpck_require__(3218)

var fontEngine = {
  svg2svg: function(input) {
    if (Buffer.isBuffer(input)) return input
    return Buffer.from(input)
  },
  // TODO add test case
  svg2ttf: function(input, options) {
    if (Buffer.isBuffer(input)) input = input.toString()
    return Buffer.from(svg2ttf(input).buffer)
  },
  svg2eot: function(input, options) {
    var ttfBuffer = this.svg2ttf(input, options)
    return this.ttf2eot(ttfBuffer);
  },
  svg2woff: function(input, options) {
    var ttfBuffer = this.svg2ttf(input, options)
    return this.ttf2woff(ttfBuffer);
  },
  ttf2ttf: function(input) {
    if (Buffer.isBuffer(input)) return input
    return Buffer.from(input)
  },
  ttf2svg: function(input) {
    return Buffer.from(ttf2svg(input))
  },
  ttf2eot: function(input) {
    return Buffer.from(ttf2eot(input).buffer)
  },
  ttf2woff: function(input) {
    return Buffer.from(ttf2woff(input).buffer)
  },
  ttf2woff2: function(input) {
    return Buffer.from(ttf2woff2(input).buffer)
  },
}

var ALL_FONTS_TYPES = ['svg', 'ttf', 'eot', 'woff', 'woff2']



var _normalizeInput = function(input) {
  if (!input) return false
    //a buffer
  if (Buffer.isBuffer(input)) return input
    //a path
  if (_.isString(input) && fs.existsSync(input)) {
    return fs.readFileSync(input)
  }
  //a svg font string
  if (_.isString(input) && /font-face/.test(input)) {
    return Buffer.from(input)
  }
  return false
}

/**
 * 解析一个字体转换成js对象
 * @param  {[type]} input [description]
 * @return {[type]}         [description]
 */
fontEngine.parse = (function() {
  //参考  svg2ttf里面的解析代码
  //https://github.com/fontello/svg2ttf

  var _getGlyph = function(glyphElem) {
    var glyph = {};

    glyph.d = glyphElem.getAttribute('d').trim()
    glyph.unicode = helper.normalizeUnicode(glyphElem.getAttribute('unicode'))
    glyph.name = glyphElem.getAttribute('glyph-name')

    if (glyphElem.getAttribute('horiz-adv-x')) {
      glyph.horizAdvX = parseInt(glyphElem.getAttribute('horiz-adv-x'), 10)
    }

    return glyph;
  }

  var _parseTtfFont = function(ttfBuffer) {

    function toArrayBuffer(buffer) {
      var arrayBuffer = new ArrayBuffer(buffer.length)
      var data = new Uint8Array(arrayBuffer)
      for (var i = 0; i < buffer.length; i += 1) {
        data[i] = buffer[i]
      }

      return arrayBuffer
    }

    var font = opentype.parse(toArrayBuffer(ttfBuffer))

    if (!font.supported) {
      return helper.showError('Font is not supported (is this a Postscript font?)');
    }

    var hhea = font.tables.hhea
    var head = font.tables.head
    var name = font.tables.name
    var fontObjs = {
      options: {
        id: name.postScriptName.en || 'iconfont',
        horizAdvX: hhea.advanceWidthMax || 1024,
        vertAdvY: head.unitsPerEm || 1024
      },
      fontface: {
        fontFamily: name.fontFamily.en || 'iconfont',
        ascent: hhea.ascender,
        descent: hhea.descender,
        unitsPerEm: head.unitsPerEm
      },
      glyphs: {}
    }

    var path, unicode
    _.each(font.glyphs.glyphs, function(g) {
      try {
        path = g.path.toPathData()
        if (path && _.isArray(g.unicodes)) {
          _.each(g.unicodes,function(_unicode){
            unicode = '&#x' + (_unicode).toString(16) + ';'
            fontObjs.glyphs[unicode] = {
              d: path,
              unicode: unicode,
              name: g.name || 'uni' + _unicode,
              horizAdvX: g.advanceWidth,
              vertAdvY: fontObjs.options.vertAdvY
            }

          })
        }
      } catch (e) {
        //todo debug options
        //helper.showError(e)
      }

    })
    return fontObjs

  }

  var _parseSvgFont = function(svgBuffer) {
    var svgStr = svgBuffer.toString()
    var doc = (new DOMParser()).parseFromString(svgStr, 'application/xml')
    var fontElem = doc.getElementsByTagName('font')[0]
    var fontFaceElem = fontElem.getElementsByTagName('font-face')[0]

    var font = {
      options: {
        id: fontElem.getAttribute('id') || 'iconfont'
      },
      fontface: {
        fontFamily: fontFaceElem.getAttribute('font-family') || 'iconfont',
        fontStretch: fontFaceElem.getAttribute('font-stretch') || 'normal'
      },
      glyphs: {}
    }

    // Get <font-face> numeric attributes
    attrs = {
      ascent: 'ascent',
      descent: 'descent',
      unitsPerEm: 'units-per-em',
      fontWeight: 'font-weight'
    }

    _.forEach(attrs, function(val, key) {
      if (fontFaceElem.hasAttribute(val)) {
        font.fontface[key] = parseInt(fontFaceElem.getAttribute(val), 10)
      }
    })
    var fontfaceHeight = font.fontface.unitsPerEm


    var attrs = {
      horizAdvX: 'horiz-adv-x',
      vertAdvY: 'vert-adv-y'
        // horizOriginX: 'horiz-origin-x',
        // horizOriginY: 'horiz-origin-y',
        // vertOriginX: 'vert-origin-x',
        // vertOriginY: 'vert-origin-y'
    }
    _.forEach(attrs, function(val, key) {
      if (fontElem.hasAttribute(val)) {
        font.options[key] = parseInt(fontElem.getAttribute(val), 10)
      }
    })
    if (!font.options.vertAdvY) {
      font.options.vertAdvY = fontfaceHeight
    }
    if (!font.options.horizAdvX) {
      font.options.horizAdvX = fontfaceHeight
    }

    _.forEach(fontElem.getElementsByTagName('glyph'), function(glyphElem) {
      var glyph = _getGlyph(glyphElem)
      font.glyphs[glyph.unicode] = glyph

      if (!glyph.horizAdvX && font.options.horizAdvX) {
        glyph.horizAdvX = font.options.horizAdvX
      }
      if (!glyph.vertAdvY) {
        glyph.vertAdvY = font.options.vertAdvY ? font.options.vertAdvY : fontfaceHeight
      }

    })

    return font
  }

  var parse = function(input) {
    var inputBuffer = _normalizeInput(input)

    if (!inputBuffer) {
      helper.showError('font convert input error,support path,buffer,string！')
      return
    }

    if (/<svg/.test(inputBuffer.toString())) return _parseSvgFont(inputBuffer)

    //不是svg字体就默认是ttf字体,就使用ttf.js进行解析
    return _parseTtfFont(inputBuffer)
  }

  return parse

})()



/**
 * 一次性的生成其余几种字体,接受一个svg字体
 *
 * @param  {string|buffer|path} fontBuffer 字体输入可以是路径,buffer对象,string对象
 * @param  {string} outputTypes 字体输出的类型,默认是所有四种
 * @param  {string} outputPath 字体的输出路径,不需要带后缀
 * @return {array}  outFonts    返回转换后的字体buffer数组
 */
fontEngine.convert = (function() {

  var _normalizePath = function(p) {
    if (!p) return false

    if (path.extname(p)) {
      p = p.replace(path.extname(p), '')
    }
    return p
  }

  var _convert = function(fontBuffer, outputTypes, options) {
    var result = {}
    var input = fontBuffer
    var ttfBuffer

    if (options.inputTypes === 'ttf') {
      ttfBuffer = fontEngine.ttf2ttf(input, options)
    } else {
      ttfBuffer = fontEngine.svg2ttf(input, options)
    }

    _.each(outputTypes, function(type, k) {
      if (type === 'svg') {
        result[type] = input
      } else {
        result[type] = fontEngine['ttf2' + type](ttfBuffer, options)
      }
    })

    return result
  }

  var _writeFile = function(output, outFonts) {
    _.each(outFonts, function(font, type) {
      fs.writeFileSync(output + '.' + type, font)
    })
  }

  return function(options) {
    var inputBuffer = _normalizeInput(options.input)

    var outputPath = _normalizePath(options.path)
    var outputTypes = options.types || ALL_FONTS_TYPES

    if (!inputBuffer) {
      helper.showError('font convert input error,support path,buffer,string.please check if the file exist,while the input is a path.')
      return
    }

    var outFonts = _convert(inputBuffer, outputTypes, options)
    if (outputPath) {
      _writeFile(outputPath, outFonts)
    }
    return outFonts

  }
})()


/**
 * 字体转换引擎,提供 svg 到ttf, ttf 到 woff, woff2, eot, svg 的转换
 * 提供字体的解析与转换
 */
module.exports = fontEngine


/***/ }),

/***/ 6773:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

var _ = __nccwpck_require__(5037)


//http://purplebamboo.github.io/2014/12/17/javascript-unicode-doublebyte-handle/
if (!String.fromCodePoint) {
  (function() {
    var defineProperty = (function() {
      // IE 8 only supports `Object.defineProperty` on DOM elements
      try {
        var object = {}
        var $defineProperty = Object.defineProperty
        var result = $defineProperty(object, object, object) && $defineProperty
      } catch (error) {}
      return result
    }());
    var stringFromCharCode = String.fromCharCode
    var floor = Math.floor
    var fromCodePoint = function() {
      var MAX_SIZE = 0x4000
      var codeUnits = []
      var highSurrogate
      var lowSurrogate
      var index = -1
      var length = arguments.length
      if (!length) {
        return ''
      }
      var result = ''
      while (++index < length) {
        var codePoint = Number(arguments[index])
        if (!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
          codePoint < 0 || // not a valid Unicode code point
          codePoint > 0x10FFFF || // not a valid Unicode code point
          floor(codePoint) != codePoint // not an integer
        ) {
          throw RangeError('Invalid code point: ' + codePoint)
        }
        if (codePoint <= 0xFFFF) { // BMP code point
          codeUnits.push(codePoint)
        } else { // Astral code point; split in surrogate halves
          // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          codePoint -= 0x10000
          highSurrogate = (codePoint >> 10) + 0xD800
          lowSurrogate = (codePoint % 0x400) + 0xDC00
          codeUnits.push(highSurrogate, lowSurrogate)
        }
        if (index + 1 == length || codeUnits.length > MAX_SIZE) {
          result += stringFromCharCode.apply(null, codeUnits)
          codeUnits.length = 0
        }
      }
      return result
    };
    if (defineProperty) {
      defineProperty(String, 'fromCodePoint', {
        'value': fromCodePoint,
        'configurable': true,
        'writable': true
      })
    } else {
      String.fromCodePoint = fromCodePoint
    }
  }());
}


if (!String.prototype.codePointAt) {
  (function() {
    'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
    var codePointAt = function(position) {
      if (this == null) {
        throw TypeError()
      }
      var string = String(this)
      var size = string.length
      // `ToInteger`
      var index = position ? Number(position) : 0
      if (index != index) { // better `isNaN`
        index = 0
      }
      // Account for out-of-bounds indices:
      if (index < 0 || index >= size) {
        return undefined;
      }
      // Get the first code unit
      var first = string.charCodeAt(index)
      var second;
      if ( // check if it’s the start of a surrogate pair
        first >= 0xD800 && first <= 0xDBFF && // high surrogate
        size > index + 1 // there is a next code unit
      ) {
        second = string.charCodeAt(index + 1)
        if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
          // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000
        }
      }
      return first
    }
    if (Object.defineProperty) {
      Object.defineProperty(String.prototype, 'codePointAt', {
        'value': codePointAt,
        'configurable': true,
        'writable': true
      });
    } else {
      String.prototype.codePointAt = codePointAt
    }
  }());
}


/**
 * 字体里面的unicode千奇百怪有很多种形式，需要进行转换成16进制的unicode
 * 返回最终的16进制值组成的字符串
 */
function str2unicode(str) {
  //没有管\\u的情况
  str = str.replace(/&#(x?[a-f\d]+)(;?)/ig, function(m, u) {
    var HEX_BASE = 10;
    if (u.indexOf('x') === 0) {
      HEX_BASE = 16;
      u = u.substr(1);
    }
    return String.fromCodePoint(parseInt(u, HEX_BASE));
  });
  //将ascii码转换成unicode
  str = str.replace(/[\x00-\xff]/g, function($0) {
    return '&#' + $0.codePointAt(0) + ';'
  });
  //将汉字转成unicode
  str = str.replace(/[^\u0000-\u00FF]/g, function($0) {
    return escape($0).replace(/(%u)(\w{4})/gi, "\&#x$2;")
  });
  //将十进制的unicode转换成16进制的。
  str = str.replace(/\&\#(\d+)/g, function($0, $1) {
    return '&#x' + parseInt($1).toString(16)
  });

  return str;

}

function toUnicode(str) {
  var uArray = []
  var u = str2unicode(str)
  uArray = u.split(';')
  uArray.pop()
  uArray = _.map(uArray, function(unicode) {
    return unicode + ';'
  })

  return uArray
}

exports.str2unicode = str2unicode

exports.toUnicode = toUnicode

exports.normalizeUnicode = function(str) {
  return toUnicode(str)[0]
}


exports.toLine = function(str) {
  return str.replace(/([A-Z]{1})/g, function($, $1) {
    return '-' + $1.toString().toLowerCase()
  })
}

exports.key2underline = function(obj) {
  var result = {}
  var that = this
  _.each(obj, function(v, k) {

    k = that.toLine(k)
    result[k] = v
  })
  return result
}

exports.showError = function(err) {
  function _getErrorString(err) {
    if (err.stack) {
      return err.stack.replace(/^/gm, '  ') + '\n\n'
    }
    return err.toString()
  }
  console.log(_getErrorString(err))
}

/***/ }),

/***/ 9870:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var Font = __nccwpck_require__(4662)
var Glyph = __nccwpck_require__(6314)
var engine = __nccwpck_require__(6206)
var helper = __nccwpck_require__(6773)
var easySvg = __nccwpck_require__(2924)

var _ = __nccwpck_require__(5037)

var FontCarrier = {}

FontCarrier.Font = Font
FontCarrier.Glyph = Glyph
FontCarrier.engine = engine
FontCarrier.helper = helper
FontCarrier.easySvg = easySvg

/**
 * 生成一个新的空白字体
 * options 包括字体的各种配置
 *
 * @return {font} 字体对象
 */

FontCarrier.create = function(options) {
  return new Font(options)
}

/**
 * 装载一个字体，用于解析一个已有的字体，目前支持svg,ttf的字体格式
 * @param {string|buffer|path} input 需要转换的字体,可以是路径或者字体文本字符串
 * @return {font} 字体对象
 */
FontCarrier.transfer = function(input, options) {

  var parsedFontObject = engine.parse(input)

  options = options || {}
  options = _.extend(options, parsedFontObject.options)

  var font = new Font(options)
  font.setFontface(parsedFontObject.fontface)
    //对于转换的字形  是带字体的偏移等信息的，不能直接使用object
  var tmplGlyph
  _.map(parsedFontObject.glyphs, function(glyph, k) {
    tmplGlyph = new Glyph(glyph)
    tmplGlyph.__font = font
    font.setGlyph(k, tmplGlyph)
  })

  return font
}

module.exports = FontCarrier

/***/ }),

/***/ 2924:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

var DOMParser = (__nccwpck_require__(4887)/* .DOMParser */ .a)
var svgpath = __nccwpck_require__(455)
var CONFIG = __nccwpck_require__(2835)
var Path = __nccwpck_require__(5700)
var Viewbox = __nccwpck_require__(927)
var svgPathify = __nccwpck_require__(823)
var _ = __nccwpck_require__(5037)



/**
 * 翻转svgpath
 * @param  {string} path     path序列
 * @return {string}         反转后的path序列
 */
exports.reversal = function(path) {
  return svgpath(path).scale(1, -1).round(CONFIG.PATH_DECIMAL).toString()
}

/**
 * 转换svg为一个path,并且按照目标高度，偏移进行拉伸
 * @param  {string} svg     原始svg
 * @param  {object} options.targetHeight 目标高度
 * @return {object}         path序列和viewbox
 */
exports.normalizeSvg = function(svg, options) {

  var svgDocNode = new DOMParser().parseFromString(svgPathify(svg), 'application/xml')
  var svgNode = svgDocNode.getElementsByTagName('svg')[0]

  //解决所有的变换，生成一个path
  var path = Path.normalizePath(svgNode)

  var trans = svgpath(path)

  //根据目标viewbox进行变换
  var targetHeight = options.targetHeight

  if (targetHeight) {
    var viewObj = Viewbox.generateAmendTrans(svgNode, targetHeight)
    _.each(viewObj.transforms, function(viewTrans) {
      trans[viewTrans[0]].apply(trans, viewTrans[1])
    })
  }

  return {
    viewbox: viewObj.targetViewbox,
    path: trans.round(CONFIG.PATH_DECIMAL).toString()
  }

}

/***/ }),

/***/ 5700:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

var svgpath = __nccwpck_require__(455)
var _ = __nccwpck_require__(5037)

function generatePath(path, transforms) {
  var t = svgpath(path).abs()
  _.each(transforms, function(transform) {
    t.transform(transform)
  })
  return t.toString()
}

function getTransform(node) {
  return node.getAttribute('transform')
}

function parseNode(node, transforms) {
  var path = ''
  var newTransForms = transforms ? _.clone(transforms) : []

  if (node.getAttribute && node.getAttribute('transform')) {
    newTransForms.push(node.getAttribute('transform'))
  }

  if (!node.hasChildNodes() && node.tagName === 'path') {
    path = generatePath(node.getAttribute('d'), newTransForms)
  }

  if (node.hasChildNodes()) {
    _.each(node.childNodes, function(childNode) {

      path += parseNode(childNode, newTransForms)

    })
  }

  return path

}


exports.normalizePath = function(svgNode) {

  return parseNode(svgNode)
}

/***/ }),

/***/ 927:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

var _ = __nccwpck_require__(5037)

var _getViewBox = function(svgNode) {
  if (!svgNode) return

  var viewbox = svgNode.getAttribute('viewBox').replace(',', ' ').split(' ')
  if (viewbox && viewbox.length === 4) {
    return _.map(viewbox, function(v) {
      return parseFloat(v)
    })
  }

  var width, height
  width = parseFloat(svgNode.getAttribute('width'))
  height = parseFloat(svgNode.getAttribute('height'))
  if (width != 0 && height != 0) {
    return [0, 0, width, height]
  }
  //todo  bouding box
}

var _getViewPort = function(svgNode) {
  var width, height
  width = parseFloat(svgNode.getAttribute('width'))
  height = parseFloat(svgNode.getAttribute('height'))

  var viewbox = svgNode.getAttribute('viewBox').replace(',', ' ').split(' ')
  if (!width) width = parseFloat(viewbox[2])
  if (!height) height = parseFloat(viewbox[3])

  return [width, height]
    //todo  bouding box


}

// 根据 targetHeight 缩放 width
// 如: normalizeViewport([1024, 2048], 1024)
// #=> [0,0,512, 1024]
var _getTargetViewbox = function(viewport, targetHeight) {

  var width = viewport[0]
  var height = viewport[1]

  if (height != targetHeight) {
    width = parseInt(targetHeight / height * width)
    height = targetHeight
  }

  return [0, 0, width, height]

}


function _normalizeXY(viewbox, targetViewbox) {
  var x, y, targetX, targetY

  x = viewbox[0]
  y = viewbox[1]
  targetX = targetViewbox[0]
  targetY = targetViewbox[1]
    //可能会有x,y偏移的情况，所以这边需要做出相应的转换
  if (x != targetX || y != targetY) {
    return [
      ['translate', [targetX - x, targetY - y]]
    ]
  }
  return []

}

function _normalizeWidthHeight(viewbox, targetViewbox) {

  var width, height, targetWidth, targetHeight, widthScale, heightScale

  width = viewbox[2]
  height = viewbox[3]
  targetWidth = targetViewbox[2]
  targetHeight = targetViewbox[3]

  widthScale = width / targetWidth
  heightScale = height / targetHeight
    //比较正常的等比缩放
  if (widthScale == heightScale) {
    return [
      ['scale', [1 / widthScale, 1 / widthScale]]
    ]
  }

  //下面是不等比缩放
  //不等比缩放后
  var maxScale = _.max([widthScale, heightScale])
  var transforms = [],
    newWidth, newHeight

  if (widthScale < heightScale) {
    newWidth = targetWidth * maxScale
    transforms.push(['translate', [(newWidth - width) / 2, 0]])
  } else if (widthScale > heightScale) {
    newHeight = newHeight * maxScale
    transforms.push(['translate', [0, (newHeight - height) / 2]])
  }

  transforms.push(['scale', [1 / maxScale, 1 / maxScale]])

  return transforms
}

//返回需要进行的转换数组
var _normalizeViewBox = function(viewbox, targetViewbox) {

  var transforms = []
  transforms = transforms.concat(_normalizeXY(viewbox, targetViewbox))
  transforms = transforms.concat(_normalizeWidthHeight(viewbox, targetViewbox))
  return transforms
}

exports.generateAmendTrans = function(svgNode, targetHeight) {

  var viewport = _getViewPort(svgNode)
  var viewbox = _getViewBox(svgNode)
  var targetViewbox = _getTargetViewbox(viewport, targetHeight)

  return {
    transforms: _normalizeViewBox(viewbox, targetViewbox),
    targetViewbox: targetViewbox
  }

}

/***/ }),

/***/ 8589:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var theTTFToWOFF2Module = __nccwpck_require__(9614);

module.exports = function ttf2woff2(inputContent) {

  // Prepare input
  var inputBuffer = theTTFToWOFF2Module._malloc(inputContent.length + 1);
  var outputSizePtr = theTTFToWOFF2Module._malloc(4); // eslint-disable-line
  var outputBufferPtr;
  var outputSize;
  var outputContent;
  var i;

  theTTFToWOFF2Module.writeArrayToMemory(inputContent, inputBuffer);

  // Run
  outputBufferPtr = theTTFToWOFF2Module.convert(
    inputBuffer, inputContent.length, outputSizePtr
  );

  // Retrieve output
  outputSize = theTTFToWOFF2Module.getValue(outputSizePtr, 'i32');
  outputContent = Buffer.alloc(outputSize);

  for (i = 0; i < outputSize; i++) {
    outputContent[i] = theTTFToWOFF2Module.getValue(outputBufferPtr + i, 'i8');
  }

  theTTFToWOFF2Module.freePtrs(outputBufferPtr, outputSizePtr);

  return outputContent;
};


/***/ }),

/***/ 9614:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {

var asm=(function(global,env,buffer) {
"use asm";var a=global.Int8Array;var b=global.Int16Array;var c=global.Int32Array;var d=global.Uint8Array;var e=global.Uint16Array;var f=global.Uint32Array;var g=global.Float32Array;var h=global.Float64Array;var i=new a(buffer);var j=new b(buffer);var k=new c(buffer);var l=new d(buffer);var m=new e(buffer);var n=new f(buffer);var o=new g(buffer);var p=new h(buffer);var q=global.byteLength;var r=env.STACKTOP|0;var s=env.STACK_MAX|0;var t=env.tempDoublePtr|0;var u=env.ABORT|0;var v=env.cttz_i8|0;var w=0;var x=0;var y=0;var z=0;var A=global.NaN,B=global.Infinity;var C=0,D=0,E=0,F=0,G=0.0,H=0,I=0,J=0,K=0.0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=0;var U=0;var V=global.Math.floor;var W=global.Math.abs;var X=global.Math.sqrt;var Y=global.Math.pow;var Z=global.Math.cos;var _=global.Math.sin;var $=global.Math.tan;var aa=global.Math.acos;var ba=global.Math.asin;var ca=global.Math.atan;var da=global.Math.atan2;var ea=global.Math.exp;var fa=global.Math.log;var ga=global.Math.ceil;var ha=global.Math.imul;var ia=global.Math.min;var ja=global.Math.clz32;var ka=env.abort;var la=env.assert;var ma=env.invoke_iiii;var na=env.invoke_viiiii;var oa=env.invoke_i;var pa=env.invoke_vi;var qa=env.invoke_vii;var ra=env.invoke_ii;var sa=env.invoke_viii;var ta=env.invoke_v;var ua=env.invoke_iiiii;var va=env.invoke_viiiiii;var wa=env.invoke_iii;var xa=env.invoke_viiii;var ya=env._pthread_cleanup_pop;var za=env.floatReadValueFromPointer;var Aa=env.simpleReadValueFromPointer;var Ba=env.___syscall54;var Ca=env.__embind_register_memory_view;var Da=env.throwInternalError;var Ea=env.get_first_emval;var Fa=env._abort;var Ga=env.___cxa_guard_acquire;var Ha=env.___setErrNo;var Ia=env.extendError;var Ja=env.__embind_register_integer;var Ka=env.___assert_fail;var La=env.__embind_register_void;var Ma=env.___cxa_find_matching_catch;var Na=env._ceilf;var Oa=env.getShiftFromSize;var Pa=env.__embind_register_function;var Qa=env.embind_init_charCodes;var Ra=env.throwBindingError;var Sa=env._emscripten_set_main_loop_timing;var Ta=env.__emval_register;var Ua=env._sbrk;var Va=env.___cxa_allocate_exception;var Wa=env._emscripten_memcpy_big;var Xa=env.__embind_register_bool;var Ya=env.___resumeException;var Za=env.__ZSt18uncaught_exceptionv;var _a=env._sysconf;var $a=env._embind_repr;var ab=env.___cxa_begin_catch;var bb=env._pthread_getspecific;var cb=env.createNamedFunction;var db=env.__embind_register_emval;var eb=env.readLatin1String;var fb=env.throwUnboundTypeError;var gb=env._pthread_self;var hb=env.craftInvokerFunction;var ib=env.__emval_decref;var jb=env._pthread_once;var kb=env.__embind_register_float;var lb=env.makeLegalFunctionName;var mb=env._pthread_key_create;var nb=env.___unlock;var ob=env.heap32VectorToArray;var pb=env.init_emval;var qb=env.whenDependentTypesAreResolved;var rb=env._emscripten_set_main_loop;var sb=env.___cxa_guard_release;var tb=env.new_;var ub=env._pthread_setspecific;var vb=env.integerReadValueFromPointer;var wb=env.registerType;var xb=env.___cxa_throw;var yb=env.___lock;var zb=env.___syscall6;var Ab=env._pthread_cleanup_push;var Bb=env.ensureOverloadTable;var Cb=env.count_emval_handles;var Db=env._time;var Eb=env.requireFunction;var Fb=env.getTypeName;var Gb=env.__embind_register_std_wstring;var Hb=env.___syscall140;var Ib=env.exposePublicSymbol;var Jb=env.__embind_register_std_string;var Kb=env.replacePublicSymbol;var Lb=env.___syscall146;var Mb=env.runDestructors;var Nb=0.0;function Ob(newBuffer){if(q(newBuffer)&16777215||q(newBuffer)<=16777215||q(newBuffer)>2147483648)return false;i=new a(newBuffer);j=new b(newBuffer);k=new c(newBuffer);l=new d(newBuffer);m=new e(newBuffer);n=new f(newBuffer);o=new g(newBuffer);p=new h(newBuffer);buffer=newBuffer;return true}
// EMSCRIPTEN_START_FUNCS
function me(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0;x=r;r=r+32|0;u=x+24|0;w=x+12|0;v=x;ne(w,a);q=v+4|0;k[q>>2]=0;s=v+8|0;k[s>>2]=0;c=v+4|0;k[v>>2]=c;t=b+4|0;d=k[t>>2]|0;e=k[b>>2]|0;a:do if((d|0)==(e|0)){f=a;e=d;j=0}else{n=c;i=0;m=0;j=0;while(1){l=e+(m<<2)|0;if(i){h=k[l>>2]|0;f=c;g=i;b:do{while(1){if((k[g+16>>2]|0)>=(h|0)){f=g;break}g=k[g+4>>2]|0;if(!g)break b}g=k[f>>2]|0}while((g|0)!=0);if(!((f|0)!=(c|0)?(h|0)>=(k[f+16>>2]|0):0))p=12}else p=12;if((p|0)==12){do if(i){h=k[l>>2]|0;d=i;while(1){f=k[d+16>>2]|0;if((h|0)<(f|0)){f=k[d>>2]|0;if(!f){e=d;p=16;break}else d=f}else{if((f|0)>=(h|0)){p=22;break}f=d+4|0;g=k[f>>2]|0;if(!g){e=f;p=20;break}else d=g}}if((p|0)==16){k[u>>2]=d;p=23;break}else if((p|0)==20){k[u>>2]=d;p=23;break}else if((p|0)==22){p=0;k[u>>2]=d;if(!d){e=u;p=23;break}else break}}else{k[u>>2]=c;e=c;d=n;p=23}while(0);if((p|0)==23){p=0;f=og(24)|0;k[f+16>>2]=k[l>>2];k[f+20>>2]=0;k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=d;k[e>>2]=f;d=k[k[v>>2]>>2]|0;if(!d)d=f;else{k[v>>2]=d;d=k[e>>2]|0}Hc(k[q>>2]|0,d);k[s>>2]=(k[s>>2]|0)+1;e=k[b>>2]|0;d=f}k[d+20>>2]=j;ki((k[a>>2]|0)+(j*2832|0)|0,(k[w>>2]|0)+((k[e+(m<<2)>>2]|0)*2832|0)|0,2832)|0;d=k[t>>2]|0;e=k[b>>2]|0;j=j+1|0}f=m+1|0;if(f>>>0>=d-e>>2>>>0){f=a;break a}i=k[c>>2]|0;m=f}}while(0);h=a+4|0;i=k[h>>2]|0;f=k[f>>2]|0;g=(i-f|0)/2832|0;if(j>>>0<=g>>>0){if(j>>>0<g>>>0?(o=f+(j*2832|0)|0,(i|0)!=(o|0)):0)k[h>>2]=i+(~(((i+-2832-o|0)>>>0)/2832|0)*2832|0)}else{je(a,j-g|0);d=k[t>>2]|0;e=k[b>>2]|0}if((d|0)!=(e|0)){m=c;l=0;do{j=e+(l<<2)|0;f=k[c>>2]|0;do if(f){i=k[j>>2]|0;while(1){g=k[f+16>>2]|0;if((i|0)<(g|0)){g=k[f>>2]|0;if(!g){d=f;e=f;p=41;break}else f=g}else{if((g|0)>=(i|0)){p=47;break}g=f+4|0;h=k[g>>2]|0;if(!h){d=g;p=45;break}else f=h}}if((p|0)==41){k[u>>2]=e;g=d;d=e;p=48;break}else if((p|0)==45){k[u>>2]=f;g=d;d=f;p=48;break}else if((p|0)==47){p=0;k[u>>2]=f;if(!f){g=u;d=f;p=48;break}else break}}else{k[u>>2]=c;g=c;d=m;p=48}while(0);if((p|0)==48){f=og(24)|0;k[f+16>>2]=k[j>>2];k[f+20>>2]=0;k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=d;k[g>>2]=f;d=k[k[v>>2]>>2]|0;if(!d)d=f;else{k[v>>2]=d;d=k[g>>2]|0}Hc(k[q>>2]|0,d);k[s>>2]=(k[s>>2]|0)+1;e=k[b>>2]|0;d=k[t>>2]|0}k[e+(l<<2)>>2]=k[f+20>>2];l=l+1|0}while(l>>>0<d-e>>2>>>0)}_d(v,k[c>>2]|0);e=k[w>>2]|0;if(!e){r=x;return}c=w+4|0;d=k[c>>2]|0;if((d|0)!=(e|0))k[c>>2]=d+(~(((d+-2832-e|0)>>>0)/2832|0)*2832|0);rg(e);r=x;return}function ne(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;k[a>>2]=0;f=a+4|0;k[f>>2]=0;k[a+8>>2]=0;e=b+4|0;h=k[e>>2]|0;g=k[b>>2]|0;c=h-g|0;d=(c|0)/2832|0;if((h|0)==(g|0))return;if(d>>>0>1516584)mg(a);c=og(c)|0;k[f>>2]=c;k[a>>2]=c;k[a+8>>2]=c+(d*2832|0);d=k[b>>2]|0;b=k[e>>2]|0;if((d|0)==(b|0))return;do{ki(c|0,d|0,2832)|0;c=(k[f>>2]|0)+2832|0;k[f>>2]=c;d=d+2832|0}while((d|0)!=(b|0));return}function oe(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0.0,g=0,h=0.0,j=0.0,m=0.0,n=0.0,q=0.0,s=0.0,t=0.0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;C=r;r=r+3584|0;y=C+2880|0;x=C+40|0;z=C+2876|0;A=C+2872|0;B=C;w=C+8|0;if((c|0)==(d|0)){r=C;return}g=(d|0)<(c|0);u=g?c:d;g=g?d:c;k[w>>2]=g;k[w+4>>2]=u;i[w+8>>0]=1;c=k[b+(g<<2)>>2]|0;d=k[b+(u<<2)>>2]|0;b=d+c|0;t=+(c|0);if((c|0)<256)q=+o[4036+(c<<2)>>2];else q=+oh(t);s=+(d|0);if((d|0)<256)j=+o[4036+(d<<2)>>2];else j=+oh(s);m=+(b|0);if((b|0)<256)h=+o[4036+(b<<2)>>2];else h=+oh(m);v=w+24|0;d=a+(g*2832|0)|0;f=+p[a+(g*2832|0)+2824>>3];n=+p[a+(u*2832|0)+2824>>3];j=(t*q+s*j-m*h)*.5-f-n;p[v>>3]=j;do if(!(k[a+(g*2832|0)+2816>>2]|0)){p[w+16>>3]=n;f=n}else{b=k[a+(u*2832|0)+2816>>2]|0;if(!b){p[w+16>>3]=f;break}c=k[e>>2]|0;if((c|0)==(k[e+4>>2]|0))h=1.e+99;else{h=+p[c+24>>3];h=h>0.0?h:0.0}ki(x|0,d|0,2832)|0;d=x+2816|0;k[d>>2]=(k[d>>2]|0)+b;c=0;do{g=x+(c<<2)|0;k[g>>2]=(k[g>>2]|0)+(k[a+(u*2832|0)+(c<<2)>>2]|0);c=c+1|0}while((c|0)!=704);b=k[d>>2]|0;a:do if(!b)f=12.0;else{c=0;d=0;do{c=((k[x+(d<<2)>>2]|0)>0&1)+c|0;d=d+1|0}while((d|0)<704&(c|0)<5);g=c;switch(g|0){case 1:{f=12.0;break a}case 2:{f=+(b+20|0);break a}default:{}}gi(y|0,0,704)|0;Af(x,704,15,y);c=0;d=0;do{c=(ha(l[y+d>>0]|0,k[x+(d<<2)>>2]|0)|0)+c|0;d=d+1|0}while((d|0)!=704);switch(g|0){case 3:{c=c+28|0;break}case 4:{c=c+37|0;break}default:c=(Vd(y,704)|0)+c|0}f=+(c|0)}while(0);if(f<h-j){p[w+16>>3]=f;break}r=C;return}while(0);p[v>>3]=f+j;c=e+4|0;d=k[c>>2]|0;if((d|0)==(k[e+8>>2]|0)){ce(e,w);c=k[c>>2]|0}else{k[d>>2]=k[w>>2];k[d+4>>2]=k[w+4>>2];k[d+8>>2]=k[w+8>>2];k[d+12>>2]=k[w+12>>2];k[d+16>>2]=k[w+16>>2];k[d+20>>2]=k[w+20>>2];k[d+24>>2]=k[w+24>>2];k[d+28>>2]=k[w+28>>2];w=(k[c>>2]|0)+32|0;k[c>>2]=w;c=w}w=c;e=k[e>>2]|0;k[z>>2]=e;k[A>>2]=w;k[x>>2]=k[z>>2];k[y>>2]=k[A>>2];de(x,y,B,w-e>>5);r=C;return}function pe(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0;t=r;r=r+1040|0;s=t;c=(b>>>0)/(c>>>0)|0;o=c+1|0;o=(o|0)>(d|0)?d:o;j=(b>>>0)/(o>>>0)|0;if((o|0)<=0){r=t;return}m=b+-1-e|0;n=s+1024|0;q=f+4|0;p=f+8|0;i=c+1|0;i=(i|0)<(d|0)?i:d;if(!e){d=0;do{gi(s|0,0,1028)|0;c=k[q>>2]|0;if((c|0)==(k[p>>2]|0))ue(f,s);else{ki(c|0,s|0,1040)|0;k[q>>2]=(k[q>>2]|0)+1040}d=d+1|0}while((d|0)!=(i|0));r=t;return}else{c=7;h=0}do{d=((ha(h,b)|0)>>>0)/(o>>>0)|0;if(h){g=c*16807|0;g=(g|0)==0?1:g;c=g;d=((g>>>0)%(j>>>0)|0)+d|0}gi(s|0,0,1024)|0;k[n>>2]=e;d=a+((d+e|0)>>>0<b>>>0?d:m)|0;g=e;while(1){u=s+((l[d>>0]|0)<<2)|0;k[u>>2]=(k[u>>2]|0)+1;g=g+-1|0;if(!g)break;else d=d+1|0}d=k[q>>2]|0;if((d|0)==(k[p>>2]|0))ue(f,s);else{ki(d|0,s|0,1040)|0;k[q>>2]=(k[q>>2]|0)+1040}h=h+1|0}while((h|0)!=(i|0));r=t;return}function qe(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,m=0,n=0,o=0,p=0,q=0;p=r;r=r+1040|0;o=p;n=k[d>>2]|0;m=((k[d+4>>2]|0)-n|0)/1040|0;i=((b<<1>>>0)/(c>>>0)|0)+99+m|0;i=i-((i>>>0)%(m>>>0)|0)|0;if((i|0)<=0){r=p;return}h=b+1-c|0;j=o+1024|0;if(b>>>0<=c>>>0){f=(b|0)==0;g=0;do{gi(o|0,0,1024)|0;k[j>>2]=b;if(f)d=0;else{d=a;e=b;while(1){c=o+((l[d>>0]|0)<<2)|0;k[c>>2]=(k[c>>2]|0)+1;e=e+-1|0;if(!e)break;else d=d+1|0}d=k[j>>2]|0}e=(g>>>0)%(m>>>0)|0;c=n+(e*1040|0)+1024|0;k[c>>2]=(k[c>>2]|0)+d;d=0;do{c=n+(e*1040|0)+(d<<2)|0;k[c>>2]=(k[c>>2]|0)+(k[o+(d<<2)>>2]|0);d=d+1|0}while((d|0)!=256);g=g+1|0}while((g|0)<(i|0));r=p;return}f=(c|0)==0;g=7;b=0;do{gi(o|0,0,1024)|0;e=g*16807|0;g=(e|0)==0?1:e;k[j>>2]=c;if(f)d=0;else{d=a+((g>>>0)%(h>>>0)|0)|0;e=c;while(1){q=o+((l[d>>0]|0)<<2)|0;k[q>>2]=(k[q>>2]|0)+1;e=e+-1|0;if(!e)break;else d=d+1|0}d=k[j>>2]|0}e=(b>>>0)%(m>>>0)|0;q=n+(e*1040|0)+1024|0;k[q>>2]=(k[q>>2]|0)+d;d=0;do{q=n+(e*1040|0)+(d<<2)|0;k[q>>2]=(k[q>>2]|0)+(k[o+(d<<2)>>2]|0);d=d+1|0}while((d|0)!=256);b=b+1|0}while((b|0)<(i|0));r=p;return}function re(a,b,c,d,e){a=a|0;b=b|0;c=+c;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,m=0.0,n=0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0.0;n=k[d>>2]|0;d=(k[d+4>>2]|0)-n|0;v=(d|0)/1040|0;if(v>>>0<2){if(!b)return;gi(e|0,0,b|0)|0;return}u=v<<8;u=qg(u>>>0>536870911?-1:u<<3)|0;gi(u|0,0,v<<11|0)|0;t=(d|0)>0;h=0;do{if(t){g=ha(h,v)|0;j=0;do{d=k[n+(j*1040|0)+1024>>2]|0;f=k[n+(j*1040|0)+(h<<2)>>2]|0;if((d|0)<256)q=+o[4036+(d<<2)>>2];else q=+oh(+(d|0));if(!f)m=q+2.0;else{if((f|0)<256)m=+o[4036+(f<<2)>>2];else m=+oh(+(f|0));m=q-m}p[u+(j+g<<3)>>3]=m;j=j+1|0}while((j|0)<(v|0))}h=h+1|0}while((h|0)!=256);r=qg(v>>>0>536870911?-1:v<<3)|0;gi(r|0,0,v<<3|0)|0;n=ha(v,b)|0;s=qg(n)|0;gi(s|0,0,n|0)|0;if(b){j=0;do{h=ha(j,v)|0;d=ha(l[a+j>>0]|0,v)|0;if(t){f=e+j|0;g=0;m=1.e+99;while(1){n=r+(g<<3)|0;q=+p[u+(g+d<<3)>>3]+ +p[n>>3];p[n>>3]=q;if(q<m)i[f>>0]=g;else q=m;g=g+1|0;if((g|0)>=(v|0))break;else m=q}}else q=1.e+99;if(j>>>0<2e3)m=(+(j>>>0)*.07/2.0e3+.77)*c;else m=c;if(t){f=0;do{d=r+(f<<3)|0;w=+p[d>>3]-q;p[d>>3]=w;if(w>=m){p[d>>3]=m;i[s+(f+h)>>0]=1}f=f+1|0}while((f|0)<(v|0))}j=j+1|0}while((j|0)!=(b|0));d=b+-1|0;if((d|0)>0){n=d;h=l[e+d>>0]|0;j=ha(v,d)|0;while(1){g=n;n=n+-1|0;j=j-v|0;f=e+n|0;if(!(i[s+(j+h)>>0]|0))d=h;else d=l[f>>0]|0;i[f>>0]=d;if((g|0)<=1)break;else h=d}}}sg(u);sg(r);sg(s);return}function se(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,m=0;h=Fd(c,b)|0;i=k[d>>2]|0;m=d+4|0;e=k[m>>2]|0;f=i;if((e|0)==(i|0))g=i;else{g=e+(~(((e+-1040-f|0)>>>0)/1040|0)*1040|0)|0;k[m>>2]=g}e=(g-f|0)/1040|0;if(h>>>0<=e>>>0){if(h>>>0<e>>>0?(j=i+(h*1040|0)|0,(g|0)!=(j|0)):0)k[m>>2]=g+(~(((g+-1040-j|0)>>>0)/1040|0)*1040|0)}else we(d,h-e|0);if(!b)return;e=k[d>>2]|0;f=0;do{d=l[c+f>>0]|0;m=e+(d*1040|0)+((l[a+f>>0]|0)<<2)|0;k[m>>2]=(k[m>>2]|0)+1;d=e+(d*1040|0)+1024|0;k[d>>2]=(k[d>>2]|0)+1;f=f+1|0}while((f|0)!=(b|0));return}function te(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0;w=r;r=r+1088|0;u=w+1076|0;s=w+1064|0;m=w;q=w+1052|0;o=w+1040|0;k[u>>2]=0;v=u+4|0;k[v>>2]=0;k[u+8>>2]=0;k[s>>2]=0;t=s+4|0;k[t>>2]=0;k[s+8>>2]=0;n=(b|0)==0;do if(!n)if(b>>>0>1073741823)mg(s);else{h=b<<2;d=og(h)|0;k[s>>2]=d;j=d+(b<<2)|0;k[s+8>>2]=j;gi(d|0,0,h|0)|0;k[t>>2]=j;break}else d=0;while(0);gi(m|0,0,1028)|0;h=m+1024|0;j=u+8|0;g=0;e=0;a:while(1){while(1){if(e>>>0>=b>>>0)break a;f=e+1|0;if((f|0)==(b|0)){p=10;break}x=(i[c+e>>0]|0)==(i[c+f>>0]|0);k[d+(e<<2)>>2]=g;e=m+(l[a+e>>0]<<2)|0;k[e>>2]=(k[e>>2]|0)+1;k[h>>2]=(k[h>>2]|0)+1;if(x)e=f;else{e=f;break}}if((p|0)==10){p=0;k[d+(e<<2)>>2]=g;e=m+(l[a+e>>0]<<2)|0;k[e>>2]=(k[e>>2]|0)+1;k[h>>2]=(k[h>>2]|0)+1;e=b}f=k[v>>2]|0;if((f|0)==(k[j>>2]|0)){ue(u,m);d=k[s>>2]|0}else{ki(f|0,m|0,1040)|0;k[v>>2]=f+1040}gi(m|0,0,1028)|0;g=g+1|0}k[q>>2]=0;h=q+4|0;k[h>>2]=0;k[q+8>>2]=0;k[o>>2]=0;g=o+4|0;k[g>>2]=0;k[o+8>>2]=0;ve(u,1,((k[v>>2]|0)-(k[u>>2]|0)|0)/1040|0,256,q,o);if(n){d=k[o>>2]|0;if(d)p=19}else{f=k[s>>2]|0;d=k[o>>2]|0;e=0;do{i[c+e>>0]=k[d+(k[f+(e<<2)>>2]<<2)>>2];e=e+1|0}while((e|0)!=(b|0));p=19}if((p|0)==19){e=k[g>>2]|0;if((e|0)!=(d|0))k[g>>2]=e+(~((e+-4-d|0)>>>2)<<2);rg(d)}d=k[q>>2]|0;e=d;if(d){f=k[h>>2]|0;if((f|0)!=(d|0))k[h>>2]=f+(~(((f+-1040-e|0)>>>0)/1040|0)*1040|0);rg(d)}d=k[s>>2]|0;e=d;if(d){f=k[t>>2]|0;if((f|0)!=(d|0))k[t>>2]=f+(~((f+-4-e|0)>>>2)<<2);rg(d)}d=k[u>>2]|0;if(!d){r=w;return}e=k[v>>2]|0;if((e|0)!=(d|0))k[v>>2]=e+(~(((e+-1040-d|0)>>>0)/1040|0)*1040|0);rg(d);r=w;return}function ue(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;h=a+4|0;i=k[a>>2]|0;j=i;d=(((k[h>>2]|0)-j|0)/1040|0)+1|0;if(d>>>0>4129776)mg(a);l=a+8|0;e=i;c=((k[l>>2]|0)-e|0)/1040|0;if(c>>>0<2064888){c=c<<1;c=c>>>0<d>>>0?d:c;e=(k[h>>2]|0)-e|0;d=(e|0)/1040|0;if(!c){g=0;f=0;c=e}else m=6}else{e=(k[h>>2]|0)-e|0;c=4129776;d=(e|0)/1040|0;m=6}if((m|0)==6){g=c;f=og(c*1040|0)|0;c=e}ki(f+(d*1040|0)|0,b|0,1040)|0;m=f+((((c|0)/-1040|0)+d|0)*1040|0)|0;ki(m|0,i|0,c|0)|0;k[a>>2]=m;k[h>>2]=f+((d+1|0)*1040|0);k[l>>2]=f+(g*1040|0);if(!j)return;rg(j);return}function ve(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0.0,j=0,m=0,n=0,o=0,q=0,s=0,t=0,u=0,v=0;v=r;r=r+272|0;q=v+16|0;t=v;s=ha(c,b)|0;k[t>>2]=0;u=t+4|0;k[u>>2]=0;k[t+8>>2]=0;if(s){if(s>>>0>1073741823)mg(t);j=og(s<<2)|0;k[u>>2]=j;k[t>>2]=j;h=j+(s<<2)|0;k[t+8>>2]=h;g=s;while(1){k[j>>2]=1;g=g+-1|0;if(!g)break;else j=j+4|0}k[u>>2]=h}g=e+4|0;h=k[g>>2]|0;j=k[e>>2]|0;m=(h-j|0)/1040|0;if(s>>>0<=m>>>0){if(s>>>0<m>>>0?(n=j+(s*1040|0)|0,(h|0)!=(n|0)):0)k[g>>2]=h+(~(((h+-1040-n|0)>>>0)/1040|0)*1040|0)}else we(e,s-m|0);g=f+4|0;h=k[g>>2]|0;j=k[f>>2]|0;m=h-j>>2;if(s>>>0<=m>>>0){if(s>>>0<m>>>0?(o=j+(s<<2)|0,(h|0)!=(o|0)):0)k[g>>2]=h+(~((h+-4-o|0)>>>2)<<2)}else Ud(f,s-m|0);if((s|0)>0){g=k[e>>2]|0;o=0;do{ki(g+(o*1040|0)|0,(k[a>>2]|0)+(o*1040|0)|0,1040)|0;n=k[a>>2]|0;j=k[n+(o*1040|0)+1024>>2]|0;a:do if(!j)i=12.0;else{g=0;h=0;do{g=((k[n+(o*1040|0)+(h<<2)>>2]|0)>0&1)+g|0;h=h+1|0}while((h|0)<256&(g|0)<5);m=g;switch(m|0){case 1:{i=12.0;break a}case 2:{i=+(j+20|0);break a}default:{}}gi(q|0,0,256)|0;Af(n+(o*1040|0)|0,256,15,q);g=0;h=0;do{g=(ha(l[q+h>>0]|0,k[n+(o*1040|0)+(h<<2)>>2]|0)|0)+g|0;h=h+1|0}while((h|0)!=256);switch(m|0){case 3:{g=g+28|0;break}case 4:{g=g+37|0;break}default:g=(Vd(q,256)|0)+g|0}i=+(g|0)}while(0);g=k[e>>2]|0;p[g+(o*1040|0)+1032>>3]=i;k[(k[f>>2]|0)+(o<<2)>>2]=o;o=o+1|0}while((o|0)<(s|0))}if((b|0)>1&(c|0)>0){g=0;do{q=ha(g,b)|0;xe(k[e>>2]|0,k[t>>2]|0,(k[f>>2]|0)+(q<<2)|0,b,d);g=g+1|0}while((g|0)<(c|0))}xe(k[e>>2]|0,k[t>>2]|0,k[f>>2]|0,s,d);ye(k[a>>2]|0,s,k[e>>2]|0,k[f>>2]|0);ze(e,f);h=k[t>>2]|0;if(!h){r=v;return}g=k[u>>2]|0;if((g|0)!=(h|0))k[u>>2]=g+(~((g+-4-h|0)>>>2)<<2);rg(h);r=v;return}function we(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;i=a+8|0;e=k[i>>2]|0;j=a+4|0;c=k[j>>2]|0;d=c;if(((e-d|0)/1040|0)>>>0>=b>>>0){do{gi(c|0,0,1028)|0;c=(k[j>>2]|0)+1040|0;k[j>>2]=c;b=b+-1|0}while((b|0)!=0);return}c=k[a>>2]|0;d=((d-c|0)/1040|0)+b|0;if(d>>>0>4129776)mg(a);f=c;c=(e-f|0)/1040|0;if(c>>>0<2064888){c=c<<1;c=c>>>0<d>>>0?d:c;d=((k[j>>2]|0)-f|0)/1040|0;if(!c){e=0;g=0}else h=8}else{c=4129776;d=((k[j>>2]|0)-f|0)/1040|0;h=8}if((h|0)==8){e=c;g=og(c*1040|0)|0}c=g+(d*1040|0)|0;f=g+(e*1040|0)|0;e=c;do{gi(e|0,0,1028)|0;e=c+1040|0;c=e;b=b+-1|0}while((b|0)!=0);b=k[a>>2]|0;e=(k[j>>2]|0)-b|0;h=g+((((e|0)/-1040|0)+d|0)*1040|0)|0;ki(h|0,b|0,e|0)|0;k[a>>2]=h;k[j>>2]=c;k[i>>2]=f;if(!b)return;rg(b);return}function xe(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,q=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;I=r;r=r+96|0;x=I+8|0;w=I+92|0;v=I+88|0;y=I+84|0;z=I+80|0;A=I+76|0;B=I;H=I+64|0;E=I+52|0;D=I+40|0;s=H+4|0;k[s>>2]=0;t=H+8|0;k[t>>2]=0;F=H+4|0;k[H>>2]=F;k[E>>2]=0;G=E+4|0;k[G>>2]=0;k[E+8>>2]=0;C=(d|0)>0;if(C){o=F;q=E+8|0;l=0;f=0;while(1){n=c+(f<<2)|0;if(l){j=k[n>>2]|0;g=F;h=l;a:do{while(1){if((k[h+16>>2]|0)>=(j|0)){g=h;break}h=k[h+4>>2]|0;if(!h)break a}h=k[g>>2]|0}while((h|0)!=0);if(!((g|0)!=(F|0)?(j|0)>=(k[g+16>>2]|0):0))m=11}else m=11;do if((m|0)==11){m=0;do if(l){j=k[n>>2]|0;while(1){g=k[l+16>>2]|0;if((j|0)<(g|0)){g=k[l>>2]|0;if(!g){g=l;h=l;m=15;break}}else{if((g|0)>=(j|0)){g=l;m=20;break}h=l+4|0;g=k[h>>2]|0;if(!g){g=h;h=l;m=19;break}}l=g}if((m|0)==15){m=0;k[x>>2]=h;j=g;break}else if((m|0)==19){m=0;k[x>>2]=h;j=g;break}else if((m|0)==20){m=0;k[x>>2]=g;j=x;h=g;break}}else{k[x>>2]=F;j=F;h=o}while(0);if(!(k[j>>2]|0)){g=og(20)|0;k[g+16>>2]=k[n>>2];k[g>>2]=0;k[g+4>>2]=0;k[g+8>>2]=h;k[j>>2]=g;h=k[k[H>>2]>>2]|0;if(h){k[H>>2]=h;g=k[j>>2]|0}Hc(k[s>>2]|0,g);k[t>>2]=(k[t>>2]|0)+1}g=k[G>>2]|0;if((g|0)==(k[q>>2]|0)){Jd(E,n);break}else{k[g>>2]=k[n>>2];k[G>>2]=g+4;break}}while(0);f=f+1|0;if((f|0)>=(d|0))break;l=k[F>>2]|0}g=k[G>>2]|0;f=k[E>>2]|0}else{g=0;f=0}k[D>>2]=0;s=D+4|0;k[s>>2]=0;k[D+8>>2]=0;if((g|0)==(f|0))g=f;else{l=0;do{j=l;l=l+1|0;if(l>>>0<g-f>>2>>>0){h=l;do{Be(a,b,k[f+(j<<2)>>2]|0,k[f+(h<<2)>>2]|0,D);h=h+1|0;g=k[G>>2]|0;f=k[E>>2]|0}while(h>>>0<g-f>>2>>>0)}}while(l>>>0<g-f>>2>>>0)}b:do if(g-f>>2>>>0>1){u=0.0;q=1;while(1){while(1){m=k[D>>2]|0;if(+p[m+24>>3]>=u)break;o=k[m>>2]|0;n=k[m+4>>2]|0;h=a+(o*1040|0)+1024|0;k[h>>2]=(k[h>>2]|0)+(k[a+(n*1040|0)+1024>>2]|0);h=0;do{t=a+(o*1040|0)+(h<<2)|0;k[t>>2]=(k[t>>2]|0)+(k[a+(n*1040|0)+(h<<2)>>2]|0);h=h+1|0}while((h|0)!=256);p[a+(o*1040|0)+1032>>3]=+p[m+16>>3];t=b+(o<<2)|0;k[t>>2]=(k[t>>2]|0)+(k[b+(n<<2)>>2]|0);if(C){j=0;do{h=c+(j<<2)|0;if((k[h>>2]|0)==(n|0))k[h>>2]=o;j=j+1|0}while((j|0)!=(d|0))}j=g-f>>2;if(j>>>0>1){l=1;h=0;while(1){h=f+(h<<2)|0;if((k[h>>2]|0)>=(n|0))k[h>>2]=k[f+(l<<2)>>2];h=l+1|0;if(h>>>0<j>>>0){t=l;l=h;h=t}else break}}k[G>>2]=g+-4;f=k[s>>2]|0;g=(f|0)==(m|0);c:do if(!g){h=f-m>>5;l=0;do{j=k[m+(l<<5)>>2]|0;if(!((j|0)!=(o|0)?(t=k[m+(l<<5)+4>>2]|0,!((t|0)==(n|0)|((j|0)==(n|0)|(t|0)==(o|0)))):0))i[m+(l<<5)+8>>0]=0;l=l+1|0}while(l>>>0<h>>>0);if(!g){g=m;do{if(i[g+8>>0]|0)break c;h=g;j=f-h|0;if((j|0)>32){f=f+-32|0;k[x>>2]=k[g>>2];k[x+4>>2]=k[g+4>>2];k[x+8>>2]=k[g+8>>2];k[x+12>>2]=k[g+12>>2];k[x+16>>2]=k[g+16>>2];k[x+20>>2]=k[g+20>>2];k[x+24>>2]=k[g+24>>2];k[x+28>>2]=k[g+28>>2];k[g>>2]=k[f>>2];k[g+4>>2]=k[f+4>>2];k[g+8>>2]=k[f+8>>2];k[g+12>>2]=k[f+12>>2];k[g+16>>2]=k[f+16>>2];k[g+20>>2]=k[f+20>>2];k[g+24>>2]=k[f+24>>2];k[g+28>>2]=k[f+28>>2];k[f>>2]=k[x>>2];k[f+4>>2]=k[x+4>>2];k[f+8>>2]=k[x+8>>2];k[f+12>>2]=k[x+12>>2];k[f+16>>2]=k[x+16>>2];k[f+20>>2]=k[x+20>>2];k[f+24>>2]=k[x+24>>2];k[f+28>>2]=k[x+28>>2];k[y>>2]=h;k[z>>2]=f;k[A>>2]=h;k[v>>2]=k[y>>2];k[w>>2]=k[z>>2];k[x>>2]=k[A>>2];be(v,w,B,(j>>5)+-1|0,x);f=k[s>>2]|0;g=k[D>>2]|0}f=f+-32|0;k[s>>2]=f}while((g|0)!=(f|0))}}while(0);h=k[G>>2]|0;f=k[E>>2]|0;if((h|0)==(f|0)){g=h;f=h}else{h=0;do{Be(a,b,o,k[f+(h<<2)>>2]|0,D);h=h+1|0;g=k[G>>2]|0;f=k[E>>2]|0}while(h>>>0<g-f>>2>>>0)}if(g-f>>2>>>0<=q>>>0)break b}if(g-f>>2>>>0>e>>>0){u=1.e+99;q=e}else break}}while(0);g=k[D>>2]|0;h=g;if(g){f=k[s>>2]|0;if((f|0)!=(g|0))k[s>>2]=f+(~((f+-32-h|0)>>>5)<<5);rg(g);f=k[E>>2]|0}if(!f){G=k[F>>2]|0;$d(H,G);r=I;return}g=k[G>>2]|0;if((g|0)!=(f|0))k[G>>2]=g+(~((g+-4-f|0)>>>2)<<2);rg(f);G=k[F>>2]|0;$d(H,G);r=I;return}function ye(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0.0,i=0.0,j=0,m=0,n=0,o=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;D=r;r=r+1312|0;y=D+1056|0;z=D;C=D+1040|0;o=C+4|0;k[o>>2]=0;q=C+8|0;k[q>>2]=0;B=C+4|0;k[C>>2]=B;A=(b|0)>0;if(A){s=B;f=0;n=0;while(1){m=d+(n<<2)|0;do if(f){g=k[m>>2]|0;j=f;while(1){e=k[j+16>>2]|0;if((g|0)<(e|0)){e=k[j>>2]|0;if(!e){e=j;f=j;x=10;break}}else{if((e|0)>=(g|0)){e=j;x=15;break}f=j+4|0;e=k[f>>2]|0;if(!e){e=f;f=j;x=14;break}}j=e}if((x|0)==10){x=0;k[y>>2]=f;g=e;break}else if((x|0)==14){x=0;k[y>>2]=f;g=e;break}else if((x|0)==15){x=0;k[y>>2]=e;g=y;f=e;break}}else{k[y>>2]=B;g=B;f=s}while(0);if(!(k[g>>2]|0)){e=og(20)|0;k[e+16>>2]=k[m>>2];k[e>>2]=0;k[e+4>>2]=0;k[e+8>>2]=f;k[g>>2]=e;f=k[k[C>>2]>>2]|0;if(f){k[C>>2]=f;e=k[g>>2]|0}Hc(k[o>>2]|0,e);k[q>>2]=(k[q>>2]|0)+1}e=n+1|0;if((e|0)>=(b|0))break;f=k[B>>2]|0;n=e}if(A){u=z+1024|0;v=z+1024|0;w=0;while(1){e=k[((w|0)==0?d:d+(w+-1<<2)|0)>>2]|0;s=a+(w*1040|0)|0;t=a+(w*1040|0)+1024|0;if(!(k[t>>2]|0))h=0.0;else{ki(z|0,s|0,1040)|0;k[v>>2]=(k[v>>2]|0)+(k[c+(e*1040|0)+1024>>2]|0);f=0;do{q=z+(f<<2)|0;k[q>>2]=(k[q>>2]|0)+(k[c+(e*1040|0)+(f<<2)>>2]|0);f=f+1|0}while((f|0)!=256);j=k[v>>2]|0;a:do if(!j)h=12.0;else{f=0;g=0;do{f=((k[z+(g<<2)>>2]|0)>0&1)+f|0;g=g+1|0}while((g|0)<256&(f|0)<5);m=f;switch(m|0){case 1:{h=12.0;break a}case 2:{h=+(j+20|0);break a}default:{}}gi(y|0,0,256)|0;Af(z,256,15,y);f=0;g=0;do{f=(ha(l[y+g>>0]|0,k[z+(g<<2)>>2]|0)|0)+f|0;g=g+1|0}while((g|0)!=256);switch(m|0){case 3:{f=f+28|0;break}case 4:{f=f+37|0;break}default:f=(Vd(y,256)|0)+f|0}h=+(f|0)}while(0);h=h-+p[c+(e*1040|0)+1032>>3]}f=k[C>>2]|0;if((f|0)!=(B|0)){g=f;while(1){q=g+16|0;o=k[q>>2]|0;if(!(k[t>>2]|0))i=0.0;else{ki(z|0,s|0,1040)|0;k[u>>2]=(k[u>>2]|0)+(k[c+(o*1040|0)+1024>>2]|0);f=0;do{n=z+(f<<2)|0;k[n>>2]=(k[n>>2]|0)+(k[c+(o*1040|0)+(f<<2)>>2]|0);f=f+1|0}while((f|0)!=256);m=k[u>>2]|0;b:do if(!m)i=12.0;else{f=0;j=0;do{f=((k[z+(j<<2)>>2]|0)>0&1)+f|0;j=j+1|0}while((j|0)<256&(f|0)<5);n=f;switch(n|0){case 1:{i=12.0;break b}case 2:{i=+(m+20|0);break b}default:{}}gi(y|0,0,256)|0;Af(z,256,15,y);f=0;j=0;do{f=(ha(l[y+j>>0]|0,k[z+(j<<2)>>2]|0)|0)+f|0;j=j+1|0}while((j|0)!=256);switch(n|0){case 3:{f=f+28|0;break}case 4:{f=f+37|0;break}default:f=(Vd(y,256)|0)+f|0}i=+(f|0)}while(0);i=i-+p[c+(o*1040|0)+1032>>3]}if(i<h){h=i;e=k[q>>2]|0}f=k[g+4>>2]|0;if(!f)while(1){f=k[g+8>>2]|0;if((k[f>>2]|0)==(g|0))break;else g=f}else while(1){g=k[f>>2]|0;if(!g)break;else f=g}if((f|0)==(B|0))break;else g=f}}k[d+(w<<2)>>2]=e;w=w+1|0;if((w|0)>=(b|0)){g=B;e=C;break}}}else x=4}else x=4;if((x|0)==4){g=B;e=C}f=k[e>>2]|0;if((f|0)!=(g|0))while(1){gi(c+((k[f+16>>2]|0)*1040|0)|0,0,1028)|0;e=k[f+4>>2]|0;if(!e)while(1){e=k[f+8>>2]|0;if((k[e>>2]|0)==(f|0))break;else f=e}else while(1){f=k[e>>2]|0;if(!f)break;else e=f}if((e|0)==(B|0))break;else f=e}if(A)g=0;else{d=k[B>>2]|0;$d(C,d);r=D;return}do{e=k[d+(g<<2)>>2]|0;f=c+(e*1040|0)+1024|0;k[f>>2]=(k[f>>2]|0)+(k[a+(g*1040|0)+1024>>2]|0);f=0;do{A=c+(e*1040|0)+(f<<2)|0;k[A>>2]=(k[A>>2]|0)+(k[a+(g*1040|0)+(f<<2)>>2]|0);f=f+1|0}while((f|0)!=256);g=g+1|0}while((g|0)!=(b|0));d=k[B>>2]|0;$d(C,d);r=D;return}function ze(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0;x=r;r=r+32|0;u=x+24|0;w=x+12|0;v=x;Ae(w,a);q=v+4|0;k[q>>2]=0;s=v+8|0;k[s>>2]=0;c=v+4|0;k[v>>2]=c;t=b+4|0;d=k[t>>2]|0;e=k[b>>2]|0;a:do if((d|0)==(e|0)){f=a;e=d;j=0}else{n=c;i=0;m=0;j=0;while(1){l=e+(m<<2)|0;if(i){h=k[l>>2]|0;f=c;g=i;b:do{while(1){if((k[g+16>>2]|0)>=(h|0)){f=g;break}g=k[g+4>>2]|0;if(!g)break b}g=k[f>>2]|0}while((g|0)!=0);if(!((f|0)!=(c|0)?(h|0)>=(k[f+16>>2]|0):0))p=12}else p=12;if((p|0)==12){do if(i){h=k[l>>2]|0;d=i;while(1){f=k[d+16>>2]|0;if((h|0)<(f|0)){f=k[d>>2]|0;if(!f){e=d;p=16;break}else d=f}else{if((f|0)>=(h|0)){p=22;break}f=d+4|0;g=k[f>>2]|0;if(!g){e=f;p=20;break}else d=g}}if((p|0)==16){k[u>>2]=d;p=23;break}else if((p|0)==20){k[u>>2]=d;p=23;break}else if((p|0)==22){p=0;k[u>>2]=d;if(!d){e=u;p=23;break}else break}}else{k[u>>2]=c;e=c;d=n;p=23}while(0);if((p|0)==23){p=0;f=og(24)|0;k[f+16>>2]=k[l>>2];k[f+20>>2]=0;k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=d;k[e>>2]=f;d=k[k[v>>2]>>2]|0;if(!d)d=f;else{k[v>>2]=d;d=k[e>>2]|0}Hc(k[q>>2]|0,d);k[s>>2]=(k[s>>2]|0)+1;e=k[b>>2]|0;d=f}k[d+20>>2]=j;ki((k[a>>2]|0)+(j*1040|0)|0,(k[w>>2]|0)+((k[e+(m<<2)>>2]|0)*1040|0)|0,1040)|0;d=k[t>>2]|0;e=k[b>>2]|0;j=j+1|0}f=m+1|0;if(f>>>0>=d-e>>2>>>0){f=a;break a}i=k[c>>2]|0;m=f}}while(0);h=a+4|0;i=k[h>>2]|0;f=k[f>>2]|0;g=(i-f|0)/1040|0;if(j>>>0<=g>>>0){if(j>>>0<g>>>0?(o=f+(j*1040|0)|0,(i|0)!=(o|0)):0)k[h>>2]=i+(~(((i+-1040-o|0)>>>0)/1040|0)*1040|0)}else{we(a,j-g|0);d=k[t>>2]|0;e=k[b>>2]|0}if((d|0)!=(e|0)){m=c;l=0;do{j=e+(l<<2)|0;f=k[c>>2]|0;do if(f){i=k[j>>2]|0;while(1){g=k[f+16>>2]|0;if((i|0)<(g|0)){g=k[f>>2]|0;if(!g){d=f;e=f;p=41;break}else f=g}else{if((g|0)>=(i|0)){p=47;break}g=f+4|0;h=k[g>>2]|0;if(!h){d=g;p=45;break}else f=h}}if((p|0)==41){k[u>>2]=e;g=d;d=e;p=48;break}else if((p|0)==45){k[u>>2]=f;g=d;d=f;p=48;break}else if((p|0)==47){p=0;k[u>>2]=f;if(!f){g=u;d=f;p=48;break}else break}}else{k[u>>2]=c;g=c;d=m;p=48}while(0);if((p|0)==48){f=og(24)|0;k[f+16>>2]=k[j>>2];k[f+20>>2]=0;k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=d;k[g>>2]=f;d=k[k[v>>2]>>2]|0;if(!d)d=f;else{k[v>>2]=d;d=k[g>>2]|0}Hc(k[q>>2]|0,d);k[s>>2]=(k[s>>2]|0)+1;e=k[b>>2]|0;d=k[t>>2]|0}k[e+(l<<2)>>2]=k[f+20>>2];l=l+1|0}while(l>>>0<d-e>>2>>>0)}_d(v,k[c>>2]|0);e=k[w>>2]|0;if(!e){r=x;return}c=w+4|0;d=k[c>>2]|0;if((d|0)!=(e|0))k[c>>2]=d+(~(((d+-1040-e|0)>>>0)/1040|0)*1040|0);rg(e);r=x;return}function Ae(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;k[a>>2]=0;f=a+4|0;k[f>>2]=0;k[a+8>>2]=0;e=b+4|0;h=k[e>>2]|0;g=k[b>>2]|0;c=h-g|0;d=(c|0)/1040|0;if((h|0)==(g|0))return;if(d>>>0>4129776)mg(a);c=og(c)|0;k[f>>2]=c;k[a>>2]=c;k[a+8>>2]=c+(d*1040|0);d=k[b>>2]|0;b=k[e>>2]|0;if((d|0)==(b|0))return;do{ki(c|0,d|0,1040)|0;c=(k[f>>2]|0)+1040|0;k[f>>2]=c;d=d+1040|0}while((d|0)!=(b|0));return}function Be(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0.0,g=0,h=0.0,j=0.0,m=0.0,n=0.0,q=0.0,s=0.0,t=0.0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;C=r;r=r+1344|0;y=C+1088|0;x=C+40|0;z=C+1084|0;A=C+1080|0;B=C;w=C+8|0;if((c|0)==(d|0)){r=C;return}g=(d|0)<(c|0);u=g?c:d;g=g?d:c;k[w>>2]=g;k[w+4>>2]=u;i[w+8>>0]=1;c=k[b+(g<<2)>>2]|0;d=k[b+(u<<2)>>2]|0;b=d+c|0;t=+(c|0);if((c|0)<256)q=+o[4036+(c<<2)>>2];else q=+oh(t);s=+(d|0);if((d|0)<256)j=+o[4036+(d<<2)>>2];else j=+oh(s);m=+(b|0);if((b|0)<256)h=+o[4036+(b<<2)>>2];else h=+oh(m);v=w+24|0;d=a+(g*1040|0)|0;f=+p[a+(g*1040|0)+1032>>3];n=+p[a+(u*1040|0)+1032>>3];j=(t*q+s*j-m*h)*.5-f-n;p[v>>3]=j;do if(!(k[a+(g*1040|0)+1024>>2]|0)){p[w+16>>3]=n;f=n}else{b=k[a+(u*1040|0)+1024>>2]|0;if(!b){p[w+16>>3]=f;break}c=k[e>>2]|0;if((c|0)==(k[e+4>>2]|0))h=1.e+99;else{h=+p[c+24>>3];h=h>0.0?h:0.0}ki(x|0,d|0,1040)|0;d=x+1024|0;k[d>>2]=(k[d>>2]|0)+b;c=0;do{g=x+(c<<2)|0;k[g>>2]=(k[g>>2]|0)+(k[a+(u*1040|0)+(c<<2)>>2]|0);c=c+1|0}while((c|0)!=256);b=k[d>>2]|0;a:do if(!b)f=12.0;else{c=0;d=0;do{c=((k[x+(d<<2)>>2]|0)>0&1)+c|0;d=d+1|0}while((d|0)<256&(c|0)<5);g=c;switch(g|0){case 1:{f=12.0;break a}case 2:{f=+(b+20|0);break a}default:{}}gi(y|0,0,256)|0;Af(x,256,15,y);c=0;d=0;do{c=(ha(l[y+d>>0]|0,k[x+(d<<2)>>2]|0)|0)+c|0;d=d+1|0}while((d|0)!=256);switch(g|0){case 3:{c=c+28|0;break}case 4:{c=c+37|0;break}default:c=(Vd(y,256)|0)+c|0}f=+(c|0)}while(0);if(f<h-j){p[w+16>>3]=f;break}r=C;return}while(0);p[v>>3]=f+j;c=e+4|0;d=k[c>>2]|0;if((d|0)==(k[e+8>>2]|0)){ce(e,w);c=k[c>>2]|0}else{k[d>>2]=k[w>>2];k[d+4>>2]=k[w+4>>2];k[d+8>>2]=k[w+8>>2];k[d+12>>2]=k[w+12>>2];k[d+16>>2]=k[w+16>>2];k[d+20>>2]=k[w+20>>2];k[d+24>>2]=k[w+24>>2];k[d+28>>2]=k[w+28>>2];w=(k[c>>2]|0)+32|0;k[c>>2]=w;c=w}w=c;e=k[e>>2]|0;k[z>>2]=e;k[A>>2]=w;k[x>>2]=k[z>>2];k[y>>2]=k[A>>2];de(x,y,B,w-e>>5);r=C;return}function Ce(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0;f=k[b>>2]|0;d=c+(f>>3)|0;e=l[d>>0]|0;if(!a){c=d;a=c;i[a>>0]=e;i[a+1>>0]=e>>8;i[a+2>>0]=e>>16;i[a+3>>0]=e>>24;c=c+4|0;i[c>>0]=0;i[c+1>>0]=0;i[c+2>>0]=0;i[c+3>>0]=0;c=f+1|0;k[b>>2]=c;return}h=hi(1,0,f&7|0)|0;g=L;h=h|e;e=d;i[e>>0]=h;i[e+1>>0]=h>>8;i[e+2>>0]=h>>16;i[e+3>>0]=h>>24;d=d+4|0;i[d>>0]=g;i[d+1>>0]=g>>8;i[d+2>>0]=g>>16;i[d+3>>0]=g>>24;d=f+1|0;k[b>>2]=d;g=(ja(a|0)|0)^31;if(g>>>0>=8)Ka(195222,195244,52,195268);h=c+(d>>3)|0;j=l[h>>0]|0;d=hi(g|0,0,d&7|0)|0;e=L;j=d|j;d=h;h=d;i[h>>0]=j;i[h+1>>0]=j>>8;i[h+2>>0]=j>>16;i[h+3>>0]=j>>24;d=d+4|0;i[d>>0]=e;i[d+1>>0]=e>>8;i[d+2>>0]=e>>16;i[d+3>>0]=e>>24;f=f+4|0;k[b>>2]=f;d=a-(1<<g)|0;e=((d|0)<0)<<31>>31;h=hi(1,0,g|0)|0;a=L;if(!(a>>>0>e>>>0|(a|0)==(e|0)&h>>>0>d>>>0))Ka(195222,195244,52,195268);j=c+(f>>3)|0;c=l[j>>0]|0;a=hi(d|0,e|0,f&7|0)|0;h=L;a=c|a;c=j;i[c>>0]=a;i[c+1>>0]=a>>8;i[c+2>>0]=a>>16;i[c+3>>0]=a>>24;j=j+4|0;i[j>>0]=h;i[j+1>>0]=h>>8;i[j+2>>0]=h>>16;i[j+3>>0]=h>>24;j=f+g|0;k[b>>2]=j;return}function De(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,m=0,n=0;f=k[c>>2]|0;e=d+(f>>3)|0;j=l[e>>0]|0;h=hi(a&1|0,0,f&7|0)|0;g=L;j=h|j;h=e;i[h>>0]=j;i[h+1>>0]=j>>8;i[h+2>>0]=j>>16;i[h+3>>0]=j>>24;e=e+4|0;i[e>>0]=g;i[e+1>>0]=g>>8;i[e+2>>0]=g>>16;i[e+3>>0]=g>>24;e=f+1|0;k[c>>2]=e;g=(b|0)==0;if(a){h=d+(e>>3)|0;n=l[h>>0]|0;m=hi(g&1|0,0,e&7|0)|0;j=L;m=n|m;e=h;h=e;i[h>>0]=m;i[h+1>>0]=m>>8;i[h+2>>0]=m>>16;i[h+3>>0]=m>>24;e=e+4|0;i[e>>0]=j;i[e+1>>0]=j>>8;i[e+2>>0]=j>>16;i[e+3>>0]=j>>24;e=f+2|0;k[c>>2]=e;if(g){n=1;return n|0}}else if(g){n=0;return n|0}b=b+-1|0;if(b){f=((ja(b|0)|0)^31)+1|0;if(f>>>0>24){n=0;return n|0}}else f=1;g=(f|0)<16?4:(f+3|0)/4|0;f=g+-4|0;g=g<<2;if(f>>>0>=4)Ka(195222,195244,52,195268);m=d+(e>>3)|0;j=l[m>>0]|0;f=hi(f|0,((f|0)<0)<<31>>31|0,e&7|0)|0;n=L;j=f|j;f=m;m=f;i[m>>0]=j;i[m+1>>0]=j>>8;i[m+2>>0]=j>>16;i[m+3>>0]=j>>24;f=f+4|0;i[f>>0]=n;i[f+1>>0]=n>>8;i[f+2>>0]=n>>16;i[f+3>>0]=n>>24;e=e+2|0;k[c>>2]=e;f=((b|0)<0)<<31>>31;n=hi(1,0,g|0)|0;m=L;if(!(m>>>0>f>>>0|(m|0)==(f|0)&n>>>0>b>>>0))Ka(195222,195244,52,195268);n=d+(e>>3)|0;j=l[n>>0]|0;h=hi(b|0,f|0,e&7|0)|0;m=L;h=j|h;j=n;i[j>>0]=h;i[j+1>>0]=h>>8;i[j+2>>0]=h>>16;i[j+3>>0]=h>>24;n=n+4|0;i[n>>0]=m;i[n+1>>0]=m>>8;i[n+2>>0]=m>>16;i[n+3>>0]=m>>24;e=e+g|0;k[c>>2]=e;if(a){n=1;return n|0}n=d+(e>>3)|0;j=l[n>>0]|0;m=n;i[m>>0]=j;i[m+1>>0]=j>>8;i[m+2>>0]=j>>16;i[m+3>>0]=j>>24;n=n+4|0;i[n>>0]=0;i[n+1>>0]=0;i[n+2>>0]=0;i[n+3>>0]=0;k[c>>2]=e+1;n=1;return n|0}function Ee(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,m=0;d=k[b>>2]|0;f=c+(d>>3)|0;e=l[f>>0]|0;g=f;i[g>>0]=e;i[g+1>>0]=e>>8;i[g+2>>0]=e>>16;i[g+3>>0]=e>>24;f=f+4|0;i[f>>0]=0;i[f+1>>0]=0;i[f+2>>0]=0;i[f+3>>0]=0;f=d+1|0;k[b>>2]=f;g=a+-1|0;if(g){a=((ja(g|0)|0)^31)+1|0;if(a>>>0>24){b=0;return b|0}}else a=1;e=(a|0)<16?4:(a+3|0)/4|0;a=e+-4|0;e=e<<2;if(a>>>0>=4)Ka(195222,195244,52,195268);h=c+(f>>3)|0;j=l[h>>0]|0;a=hi(a|0,((a|0)<0)<<31>>31|0,f&7|0)|0;f=L;j=a|j;a=h;h=a;i[h>>0]=j;i[h+1>>0]=j>>8;i[h+2>>0]=j>>16;i[h+3>>0]=j>>24;a=a+4|0;i[a>>0]=f;i[a+1>>0]=f>>8;i[a+2>>0]=f>>16;i[a+3>>0]=f>>24;a=d+3|0;k[b>>2]=a;d=((g|0)<0)<<31>>31;f=hi(1,0,e|0)|0;h=L;if(!(h>>>0>d>>>0|(h|0)==(d|0)&f>>>0>g>>>0))Ka(195222,195244,52,195268);j=c+(a>>3)|0;m=l[j>>0]|0;f=hi(g|0,d|0,a&7|0)|0;h=L;f=m|f;g=j;i[g>>0]=f;i[g+1>>0]=f>>8;i[g+2>>0]=f>>16;i[g+3>>0]=f>>24;j=j+4|0;i[j>>0]=h;i[j+1>>0]=h>>8;i[j+2>>0]=h>>16;i[j+3>>0]=h>>24;j=a+e|0;h=c+(j>>3)|0;g=l[h>>0]|0;f=hi(1,0,j&7|0)|0;c=L;f=g|f;g=h;i[g>>0]=f;i[g+1>>0]=f>>8;i[g+2>>0]=f>>16;i[g+3>>0]=f>>24;h=h+4|0;i[h>>0]=c;i[h+1>>0]=c>>8;i[h+2>>0]=c>>16;i[h+3>>0]=c>>24;k[b>>2]=j+1;j=1;return j|0}function Fe(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,m=0,n=0;if((a|0)>1?(i[b+15>>0]|0)==0:0)if(!(i[b+14>>0]|0))if(!(i[b+13>>0]|0))if(!(i[b+12>>0]|0))if(!(i[b+11>>0]|0))if(!(i[b+10>>0]|0))if(!(i[b+9>>0]|0))if(!(i[b+8>>0]|0))if(!(i[b+7>>0]|0))if(!(i[b+16>>0]|0))if(!(i[b+6>>0]|0))if(!(i[b+17>>0]|0))if(!(i[b+5>>0]|0))if(!(i[b>>0]|0))if(!(i[b+4>>0]|0))if(!(i[b+3>>0]|0))if(!(i[b+2>>0]|0))h=(i[b+1>>0]|0)!=0&1;else h=2;else h=3;else h=4;else h=5;else h=6;else h=7;else h=8;else h=9;else h=10;else h=11;else h=12;else h=13;else h=14;else h=15;else h=16;else h=17;else h=18;if((i[b+1>>0]|0)==0?(i[b+2>>0]|0)==0:0)e=(i[b+3>>0]|0)==0?3:2;else e=0;a=k[c>>2]|0;g=d+(a>>3)|0;m=l[g>>0]|0;j=hi(e|0,0,a&7|0)|0;f=L;m=j|m;j=g;i[j>>0]=m;i[j+1>>0]=m>>8;i[j+2>>0]=m>>16;i[j+3>>0]=m>>24;g=g+4|0;i[g>>0]=f;i[g+1>>0]=f>>8;i[g+2>>0]=f>>16;i[g+3>>0]=f>>24;a=a+2|0;k[c>>2]=a;if(e>>>0>=h>>>0)return;while(1){g=l[b+(l[195278+e>>0]|0)>>0]|0;f=i[195296+g>>0]|0;g=l[195302+g>>0]|0;m=hi(1,0,f&255|0)|0;j=L;if(!(j>>>0>0|(j|0)==0&m>>>0>g>>>0)){a=9;break}m=d+(a>>3)|0;n=l[m>>0]|0;g=hi(g|0,0,a&7|0)|0;j=L;n=g|n;g=m;i[g>>0]=n;i[g+1>>0]=n>>8;i[g+2>>0]=n>>16;i[g+3>>0]=n>>24;m=m+4|0;i[m>>0]=j;i[m+1>>0]=j>>8;i[m+2>>0]=j>>16;i[m+3>>0]=j>>24;a=a+(f&255)|0;k[c>>2]=a;e=e+1|0;if((e|0)>=(h|0)){a=11;break}}if((a|0)==9)Ka(195222,195244,52,195268);else if((a|0)==11)return}function Ge(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,n=0,o=0,p=0,q=0,r=0,s=0;g=k[a+4>>2]|0;o=k[a>>2]|0;if((g|0)==(o|0))return;n=k[d>>2]|0;j=g-o|0;b=k[b>>2]|0;h=0;a:while(1){g=l[o+h>>0]|0;a=i[c+g>>0]|0;d=m[n+(g<<1)>>1]|0;p=hi(1,0,a&255|0)|0;q=L;if(!(q>>>0>0|(q|0)==0&p>>>0>d>>>0)){a=4;break}q=k[e>>2]|0;r=f+(q>>3)|0;s=l[r>>0]|0;d=hi(d|0,0,q&7|0)|0;p=L;s=d|s;d=r;r=d;i[r>>0]=s;i[r+1>>0]=s>>8;i[r+2>>0]=s>>16;i[r+3>>0]=s>>24;d=d+4|0;i[d>>0]=p;i[d+1>>0]=p>>8;i[d+2>>0]=p>>16;i[d+3>>0]=p>>24;d=q+(a&255)|0;k[e>>2]=d;switch(g|0){case 16:{a=i[b+h>>0]|0;if((a&255)>=4){a=7;break a}s=f+(d>>3)|0;q=l[s>>0]|0;p=hi(a&255|0,0,d&7|0)|0;r=L;p=q|p;q=s;i[q>>0]=p;i[q+1>>0]=p>>8;i[q+2>>0]=p>>16;i[q+3>>0]=p>>24;s=s+4|0;i[s>>0]=r;i[s+1>>0]=r>>8;i[s+2>>0]=r>>16;i[s+3>>0]=r>>24;k[e>>2]=d+2;break}case 17:{a=i[b+h>>0]|0;if((a&255)>=8){a=10;break a}s=f+(d>>3)|0;q=l[s>>0]|0;p=hi(a&255|0,0,d&7|0)|0;r=L;p=q|p;q=s;i[q>>0]=p;i[q+1>>0]=p>>8;i[q+2>>0]=p>>16;i[q+3>>0]=p>>24;s=s+4|0;i[s>>0]=r;i[s+1>>0]=r>>8;i[s+2>>0]=r>>16;i[s+3>>0]=r>>24;k[e>>2]=d+3;break}default:{}}h=h+1|0;if(h>>>0>=j>>>0){a=13;break}}if((a|0)==4)Ka(195222,195244,52,195268);else if((a|0)==7)Ka(195222,195244,52,195268);else if((a|0)==10)Ka(195222,195244,52,195268);else if((a|0)==13)return}function He(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,m=0,n=0,o=0,p=0,q=0,r=0;g=k[e>>2]|0;h=f+(g>>3)|0;n=l[h>>0]|0;o=hi(1,0,g&7|0)|0;j=L;n=o|n;o=h;i[o>>0]=n;i[o+1>>0]=n>>8;i[o+2>>0]=n>>16;i[o+3>>0]=n>>24;h=h+4|0;i[h>>0]=j;i[h+1>>0]=j>>8;i[h+2>>0]=j>>16;i[h+3>>0]=j>>24;h=g+2|0;k[e>>2]=h;j=c+-1|0;if(j>>>0>=4)Ka(195222,195244,52,195268);o=f+(h>>3)|0;m=l[o>>0]|0;j=hi(j|0,((j|0)<0)<<31>>31|0,h&7|0)|0;n=L;j=m|j;m=o;i[m>>0]=j;i[m+1>>0]=j>>8;i[m+2>>0]=j>>16;i[m+3>>0]=j>>24;o=o+4|0;i[o>>0]=n;i[o+1>>0]=n>>8;i[o+2>>0]=n>>16;i[o+3>>0]=n>>24;k[e>>2]=g+4;o=0;do{g=o;o=o+1|0;if((o|0)<(c|0)){m=b+(g<<2)|0;j=k[m>>2]|0;n=o;while(1){h=b+(n<<2)|0;g=k[h>>2]|0;if((l[a+g>>0]|0)<(l[a+j>>0]|0)){k[h>>2]=j;k[m>>2]=g}else g=j;n=n+1|0;if((n|0)==(c|0))break;else j=g}}}while((o|0)!=(c|0));if((c|0)==2){g=k[b>>2]|0;h=((g|0)<0)<<31>>31;m=hi(1,0,d|0)|0;n=L;if(!(n>>>0>h>>>0|(n|0)==(h|0)&m>>>0>g>>>0))Ka(195222,195244,52,195268);j=k[e>>2]|0;a=f+(j>>3)|0;c=l[a>>0]|0;g=hi(g|0,h|0,j&7|0)|0;h=L;c=g|c;g=a;a=g;i[a>>0]=c;i[a+1>>0]=c>>8;i[a+2>>0]=c>>16;i[a+3>>0]=c>>24;g=g+4|0;i[g>>0]=h;i[g+1>>0]=h>>8;i[g+2>>0]=h>>16;i[g+3>>0]=h>>24;j=j+d|0;k[e>>2]=j;g=k[b+4>>2]|0;h=((g|0)<0)<<31>>31;if(!(n>>>0>h>>>0|(n|0)==(h|0)&m>>>0>g>>>0))Ka(195222,195244,52,195268);f=f+(j>>3)|0;a=l[f>>0]|0;c=hi(g|0,h|0,j&7|0)|0;b=L;c=a|c;a=f;i[a>>0]=c;i[a+1>>0]=c>>8;i[a+2>>0]=c>>16;i[a+3>>0]=c>>24;f=f+4|0;i[f>>0]=b;i[f+1>>0]=b>>8;i[f+2>>0]=b>>16;i[f+3>>0]=b>>24;k[e>>2]=j+d;return}g=k[b>>2]|0;h=((g|0)<0)<<31>>31;m=hi(1,0,d|0)|0;n=L;if(!(n>>>0>h>>>0|(n|0)==(h|0)&m>>>0>g>>>0))Ka(195222,195244,52,195268);j=k[e>>2]|0;o=f+(j>>3)|0;p=l[o>>0]|0;g=hi(g|0,h|0,j&7|0)|0;h=L;p=g|p;g=o;o=g;i[o>>0]=p;i[o+1>>0]=p>>8;i[o+2>>0]=p>>16;i[o+3>>0]=p>>24;g=g+4|0;i[g>>0]=h;i[g+1>>0]=h>>8;i[g+2>>0]=h>>16;i[g+3>>0]=h>>24;g=j+d|0;k[e>>2]=g;h=k[b+4>>2]|0;j=((h|0)<0)<<31>>31;if(!(n>>>0>j>>>0|(n|0)==(j|0)&m>>>0>h>>>0))Ka(195222,195244,52,195268);p=f+(g>>3)|0;q=l[p>>0]|0;o=hi(h|0,j|0,g&7|0)|0;j=L;o=q|o;h=p;p=h;i[p>>0]=o;i[p+1>>0]=o>>8;i[p+2>>0]=o>>16;i[p+3>>0]=o>>24;h=h+4|0;i[h>>0]=j;i[h+1>>0]=j>>8;i[h+2>>0]=j>>16;i[h+3>>0]=j>>24;g=g+d|0;k[e>>2]=g;h=k[b+8>>2]|0;j=((h|0)<0)<<31>>31;if(!(n>>>0>j>>>0|(n|0)==(j|0)&m>>>0>h>>>0))Ka(195222,195244,52,195268);p=f+(g>>3)|0;r=l[p>>0]|0;o=hi(h|0,j|0,g&7|0)|0;q=L;o=r|o;j=p;p=j;i[p>>0]=o;i[p+1>>0]=o>>8;i[p+2>>0]=o>>16;i[p+3>>0]=o>>24;j=j+4|0;i[j>>0]=q;i[j+1>>0]=q>>8;i[j+2>>0]=q>>16;i[j+3>>0]=q>>24;j=g+d|0;k[e>>2]=j;if((c|0)==3)return;g=k[b+12>>2]|0;h=((g|0)<0)<<31>>31;if(!(n>>>0>h>>>0|(n|0)==(h|0)&m>>>0>g>>>0))Ka(195222,195244,52,195268);r=f+(j>>3)|0;p=l[r>>0]|0;c=hi(g|0,h|0,j&7|0)|0;q=L;c=p|c;p=r;i[p>>0]=c;i[p+1>>0]=c>>8;i[p+2>>0]=c>>16;i[p+3>>0]=c>>24;r=r+4|0;i[r>>0]=q;i[r+1>>0]=q>>8;i[r+2>>0]=q>>16;i[r+3>>0]=q>>24;r=j+d|0;k[e>>2]=r;q=f+(r>>3)|0;d=l[q>>0]|0;f=hi((i[a+(k[b>>2]|0)>>0]|0)==1|0,0,r&7|0)|0;p=L;d=f|d;f=q;i[f>>0]=d;i[f+1>>0]=d>>8;i[f+2>>0]=d>>16;i[f+3>>0]=d>>24;q=q+4|0;i[q>>0]=p;i[q+1>>0]=p>>8;i[q+2>>0]=p>>16;i[q+3>>0]=p>>24;k[e>>2]=r+1;return}function Ie(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0;v=r;r=r+144|0;t=v+24|0;p=v+12|0;q=v+40|0;n=v+112|0;o=v;k[t>>2]=0;u=t+4|0;k[u>>2]=0;k[t+8>>2]=0;k[p>>2]=0;s=p+4|0;k[s>>2]=0;k[p+8>>2]=0;h=og(256)|0;m=h;k[t>>2]=m;k[u>>2]=m;k[t+8>>2]=h+256;h=og(256)|0;m=h;k[p>>2]=m;k[s>>2]=m;k[p+8>>2]=h+256;Ef(a,b,t,p);h=q;m=h+72|0;do{k[h>>2]=0;h=h+4|0}while((h|0)<(m|0));a=k[u>>2]|0;e=k[t>>2]|0;if((a|0)==(e|0)){a=0;e=0;b=0}else{a=a-e|0;b=0;do{m=q+((l[e+b>>0]|0)<<2)|0;k[m>>2]=(k[m>>2]|0)+1;b=b+1|0}while(b>>>0<a>>>0);a=0;e=0;b=0}do{if(k[q+(e<<2)>>2]|0)if(b){if((b|0)==1){b=2;break}}else{a=e;b=1}e=e+1|0}while((e|0)<18);h=n;m=h+18|0;do{i[h>>0]=0;h=h+1|0}while((h|0)<(m|0));k[o>>2]=0;e=o+4|0;k[e>>2]=0;k[o+8>>2]=0;f=og(36)|0;k[o>>2]=f;g=f+36|0;k[o+8>>2]=g;h=f;m=h+36|0;do{j[h>>1]=0;h=h+2|0}while((h|0)<(m|0));k[e>>2]=g;Af(q,18,5,n);Ff(n,18,f);Fe(b,n,c,d);if((b|0)==1)i[n+a>>0]=0;Ge(t,p,n,o,c,d);k[e>>2]=f;rg(f);a=k[p>>2]|0;if(a){if((k[s>>2]|0)!=(a|0))k[s>>2]=a;rg(a)}a=k[t>>2]|0;if(!a){r=v;return}if((k[u>>2]|0)!=(a|0))k[u>>2]=a;rg(a);r=v;return}function Je(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,m=0,n=0,o=0,p=0;p=r;r=r+16|0;o=p;k[o>>2]=0;k[o+4>>2]=0;k[o+8>>2]=0;k[o+12>>2]=0;if(b){g=0;h=0;while(1){if(k[a+(h<<2)>>2]|0){if((g|0)>=4){if((g|0)>4){h=g;break}}else k[o+(g<<2)>>2]=h;g=g+1|0}h=h+1|0;if(h>>>0>=b>>>0){h=g;break}}g=b+-1|0;if(!g){g=h;m=0}else{j=h;n=9}}else{g=-1;j=0;n=9}if((n|0)==9){h=0;do{g=g>>1;h=h+1|0}while((g|0)!=0);g=j;m=h}if((g|0)<2){j=k[e>>2]|0;g=f+(j>>3)|0;a=l[g>>0]|0;b=hi(1,0,j&7|0)|0;h=L;a=b|a;b=g;i[b>>0]=a;i[b+1>>0]=a>>8;i[b+2>>0]=a>>16;i[b+3>>0]=a>>24;g=g+4|0;i[g>>0]=h;i[g+1>>0]=h>>8;i[g+2>>0]=h>>16;i[g+3>>0]=h>>24;j=j+4|0;k[e>>2]=j;g=k[o>>2]|0;h=((g|0)<0)<<31>>31;o=hi(1,0,m|0)|0;b=L;if(!(b>>>0>h>>>0|(b|0)==(h|0)&o>>>0>g>>>0))Ka(195222,195244,52,195268);f=f+(j>>3)|0;b=l[f>>0]|0;a=hi(g|0,h|0,j&7|0)|0;o=L;a=b|a;b=f;i[b>>0]=a;i[b+1>>0]=a>>8;i[b+2>>0]=a>>16;i[b+3>>0]=a>>24;f=f+4|0;i[f>>0]=o;i[f+1>>0]=o>>8;i[f+2>>0]=o>>16;i[f+3>>0]=o>>24;k[e>>2]=j+m;r=p;return}Af(a,b,15,c);Ff(c,b,d);if((g|0)<5){He(c,o,g,m,e,f);r=p;return}else{Ie(c,b,e,f);r=p;return}}function Ke(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0;s=r;r=r+32|0;h=s+12|0;q=s;d=k[b>>2]|0;g=b+4|0;f=k[g>>2]|0;if((d|0)==(f|0)){Te(a,b);r=s;return}c=d+4|0;if((c|0)==(f|0))c=d;else{e=c;c=d;do{l=(k[d>>2]|0)<(k[e>>2]|0);c=l?e:c;d=l?e:d;e=e+4|0}while((e|0)!=(f|0))}c=(k[c>>2]|0)+1|0;k[h>>2]=0;l=h+4|0;k[l>>2]=0;k[h+8>>2]=0;if(c){if(c>>>0>1073741823)mg(h);j=c<<2;e=og(j)|0;k[h>>2]=e;c=e+(c<<2)|0;k[h+8>>2]=c;gi(e|0,0,j|0)|0;k[l>>2]=c;if((c|0)!=(e|0)){c=c-e>>2;d=0;do{k[e+(d<<2)>>2]=d;d=d+1|0}while(d>>>0<c>>>0)}}c=k[g>>2]|0;d=k[b>>2]|0;e=c-d|0;f=e>>2;k[q>>2]=0;j=q+4|0;k[j>>2]=0;k[q+8>>2]=0;do if(f)if(f>>>0>1073741823)mg(q);else{o=og(e)|0;k[q>>2]=o;p=o+(f<<2)|0;k[q+8>>2]=p;gi(o|0,0,e|0)|0;k[j>>2]=p;i=k[g>>2]|0;m=k[b>>2]|0;n=o;break}else{i=c;m=d;n=0;o=0;p=0}while(0);a:do if((i|0)==(m|0))d=k[h>>2]|0;else{f=k[l>>2]|0;d=k[h>>2]|0;i=i-m>>2;h=f-d>>2;if((f|0)==(d|0)){c=f+-4|0;e=0;while(1){k[n+(e<<2)>>2]=-1;k[f>>2]=k[c>>2];e=e+1|0;if(e>>>0>=i>>>0)break a}}g=d+-4|0;b=0;do{c=k[m+(b<<2)>>2]|0;e=0;while(1){if((k[d+(e<<2)>>2]|0)==(c|0)){f=25;break}e=e+1|0;if(e>>>0>=h>>>0){f=24;break}}if((f|0)==24){k[n+(b<<2)>>2]=-1;c=k[g>>2]|0}else if((f|0)==25){k[n+(b<<2)>>2]=e;c=k[d+(e<<2)>>2]|0;if((e|0)>0)do{f=e;e=e+-1|0;k[d+(f<<2)>>2]=k[d+(e<<2)>>2]}while((f|0)>1)}k[d>>2]=c;b=b+1|0}while(b>>>0<i>>>0)}while(0);k[a>>2]=o;k[a+4>>2]=p;k[a+8>>2]=p;k[q+8>>2]=0;k[j>>2]=0;k[q>>2]=0;if(!d){r=s;return}c=k[l>>2]|0;if((c|0)!=(d|0))k[l>>2]=c+(~((c+-4-d|0)>>>2)<<2);rg(d);r=s;return}function Le(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0;w=r;r=r+32|0;p=w+16|0;q=w+12|0;v=w+8|0;s=w+4|0;t=w;u=a+4|0;l=k[u>>2]|0;h=k[a>>2]|0;j=(l|0)==(h|0);if(j){c=k[b>>2]|0;k[b>>2]=(c|0)<0?c:0;r=w;return}i=l-h>>2;f=0;e=0;do{a:do if(f>>>0<i>>>0)do{if(!(k[h+(f<<2)>>2]|0))break a;f=f+1|0}while(f>>>0<i>>>0);while(0);b:do if(f>>>0<i>>>0){g=0;do{if(k[h+(f<<2)>>2]|0)break b;g=g+1|0;f=f+1|0}while(f>>>0<i>>>0)}else g=0;while(0);e=(g|0)<(e|0)?e:g}while(f>>>0<i>>>0);if((e|0)>0)e=(ja(e|0)|0)^31;else e=0;o=k[b>>2]|0;k[b>>2]=(o|0)<(e|0)?o:e;if(j){r=w;return}j=c+4|0;m=c+8|0;n=d+4|0;o=d+8|0;f=l;i=0;while(1){e=k[h+(i<<2)>>2]|0;c:do if(!e){e=i+1|0;g=f-h>>2;if(e>>>0<g>>>0){f=1;do{if(k[h+(e<<2)>>2]|0)break;f=f+1|0;e=e+1|0}while(e>>>0<g>>>0);e=f+i|0;if(!f)break}else{e=i+1|0;f=1}h=k[b>>2]|0;while(1){if((f|0)<(2<<h|0))break;g=k[j>>2]|0;if((g|0)==(k[m>>2]|0))Jd(c,b);else{k[g>>2]=h;k[j>>2]=g+4}g=(1<<k[b>>2])+-1|0;k[t>>2]=g;h=k[n>>2]|0;if(h>>>0<(k[o>>2]|0)>>>0){k[h>>2]=g;k[n>>2]=h+4}else Nd(d,t);h=k[b>>2]|0;f=f+1+(-2<<h)|0;if(!f)break c}g=(ja(f|0)|0)^31;k[v>>2]=g;h=k[j>>2]|0;if((h|0)==(k[m>>2]|0))Jd(c,v);else{k[h>>2]=g;k[j>>2]=h+4}f=f-(1<<g)|0;k[s>>2]=f;g=k[n>>2]|0;if(g>>>0<(k[o>>2]|0)>>>0){k[g>>2]=f;k[n>>2]=g+4;break}else{Nd(d,s);break}}else{e=(k[b>>2]|0)+e|0;k[p>>2]=e;f=k[j>>2]|0;if(f>>>0<(k[m>>2]|0)>>>0){k[f>>2]=e;k[j>>2]=f+4}else Nd(c,p);k[q>>2]=0;e=k[n>>2]|0;if(e>>>0<(k[o>>2]|0)>>>0){k[e>>2]=0;k[n>>2]=e+4}else Nd(d,q);e=i+1|0}while(0);f=k[u>>2]|0;h=k[a>>2]|0;if(e>>>0>=f-h>>2>>>0)break;else i=e}r=w;return}function Me(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0;u=r;r=r+1136|0;t=u+1120|0;n=u+1108|0;s=u+1104|0;o=u;h=t+4|0;i=t+8|0;j=n+4|0;l=n+8|0;m=o+1088|0;b=0;p=1;q=0;f=2147483647;while(1){k[t>>2]=0;k[h>>2]=0;k[i>>2]=0;k[n>>2]=0;k[j>>2]=0;k[l>>2]=0;k[s>>2]=q;Le(a,s,t,n);if((k[s>>2]|0)<(q|0))g=0;else{gi(o|0,0,1092)|0;c=k[h>>2]|0;e=k[t>>2]|0;if((c|0)!=(e|0)){c=c-e>>2;d=0;do{g=o+(k[e+(d<<2)>>2]<<2)|0;k[g>>2]=(k[g>>2]|0)+1;k[m>>2]=(k[m>>2]|0)+1;d=d+1|0}while(d>>>0<c>>>0)}c=~~+Ue(o);c=(q|0)>0?c+4|0:c;if((q|0)>=1){d=1;do{c=(ha(k[o+(d<<2)>>2]|0,d)|0)+c|0;d=d+1|0}while((d|0)!=(p|0))}e=(c|0)<(f|0);g=1;b=e?q:b;f=e?c:f}c=k[n>>2]|0;d=c;if(c){e=k[j>>2]|0;if((e|0)!=(c|0))k[j>>2]=e+(~((e+-4-d|0)>>>2)<<2);rg(c)}c=k[t>>2]|0;d=c;if(c){e=k[h>>2]|0;if((e|0)!=(c|0))k[h>>2]=e+(~((e+-4-d|0)>>>2)<<2);rg(c)}q=q+1|0;if(!g){c=19;break}if((q|0)>=17){c=19;break}else p=p+1|0}if((c|0)==19){r=u;return b|0}return 0}function Ne(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;y=r;r=r+1984|0;x=y+1968|0;v=y+1120|0;o=y+1108|0;h=y+1104|0;j=y;q=y+1132|0;Ce(b+-1|0,c,d);if((b|0)==1){r=y;return}Ke(x,a);k[v>>2]=0;w=v+4|0;k[w>>2]=0;k[v+8>>2]=0;k[o>>2]=0;t=o+4|0;k[t>>2]=0;k[o+8>>2]=0;a=Me(x)|0;k[h>>2]=a;Le(x,h,v,o);gi(j|0,0,1092)|0;a=k[w>>2]|0;g=k[v>>2]|0;if((a|0)!=(g|0)){f=j+1088|0;a=a-g>>2;e=0;do{p=j+(k[g+(e<<2)>>2]<<2)|0;k[p>>2]=(k[p>>2]|0)+1;k[f>>2]=(k[f>>2]|0)+1;e=e+1|0}while(e>>>0<a>>>0)}p=k[h>>2]|0;n=(p|0)>0;a=k[c>>2]|0;e=d+(a>>3)|0;f=l[e>>0]|0;g=hi(n&1|0,0,a&7|0)|0;h=L;f=g|f;g=e;i[g>>0]=f;i[g+1>>0]=f>>8;i[g+2>>0]=f>>16;i[g+3>>0]=f>>24;e=e+4|0;i[e>>0]=h;i[e+1>>0]=h>>8;i[e+2>>0]=h>>16;i[e+3>>0]=h>>24;e=a+1|0;k[c>>2]=e;do if(n){f=p+-1|0;if(f>>>0<16){n=d+(e>>3)|0;g=l[n>>0]|0;f=hi(f|0,((f|0)<0)<<31>>31|0,e&7|0)|0;h=L;f=g|f;g=n;i[g>>0]=f;i[g+1>>0]=f>>8;i[g+2>>0]=f>>16;i[g+3>>0]=f>>24;n=n+4|0;i[n>>0]=h;i[n+1>>0]=h>>8;i[n+2>>0]=h>>16;i[n+3>>0]=h>>24;k[c>>2]=a+5;break}else Ka(195222,195244,52,195268)}while(0);gi(q|0,0,816)|0;Je(j,p+b|0,q,q+272|0,c,d);e=k[w>>2]|0;a=k[v>>2]|0;a:do if((e|0)!=(a|0)){n=e-a>>2;b=k[o>>2]|0;j=0;while(1){g=a+(j<<2)|0;f=k[g>>2]|0;e=i[q+f>>0]|0;f=m[q+272+(f<<1)>>1]|0;o=hi(1,0,e&255|0)|0;h=L;if(!(h>>>0>0|(h|0)==0&o>>>0>f>>>0)){e=13;break}h=k[c>>2]|0;o=d+(h>>3)|0;A=l[o>>0]|0;z=hi(f|0,0,h&7|0)|0;f=L;A=z|A;z=o;i[z>>0]=A;i[z+1>>0]=A>>8;i[z+2>>0]=A>>16;i[z+3>>0]=A>>24;o=o+4|0;i[o>>0]=f;i[o+1>>0]=f>>8;i[o+2>>0]=f>>16;i[o+3>>0]=f>>24;e=h+(e&255)|0;k[c>>2]=e;h=k[g>>2]|0;if(!((h|0)<1|(h|0)>(p|0))){f=k[b+(j<<2)>>2]|0;g=((f|0)<0)<<31>>31;A=hi(1,0,h|0)|0;z=L;if(!(z>>>0>g>>>0|(z|0)==(g|0)&A>>>0>f>>>0)){e=16;break}A=d+(e>>3)|0;o=l[A>>0]|0;g=hi(f|0,g|0,e&7|0)|0;z=L;g=o|g;o=A;i[o>>0]=g;i[o+1>>0]=g>>8;i[o+2>>0]=g>>16;i[o+3>>0]=g>>24;A=A+4|0;i[A>>0]=z;i[A+1>>0]=z>>8;i[A+2>>0]=z>>16;i[A+3>>0]=z>>24;e=h+e|0;k[c>>2]=e}j=j+1|0;if(j>>>0>=n>>>0){s=e;u=b;break a}}if((e|0)==13)Ka(195222,195244,52,195268);else if((e|0)==16)Ka(195222,195244,52,195268)}else{s=k[c>>2]|0;u=k[o>>2]|0}while(0);e=d+(s>>3)|0;d=l[e>>0]|0;z=hi(1,0,s&7|0)|0;A=L;d=z|d;z=e;i[z>>0]=d;i[z+1>>0]=d>>8;i[z+2>>0]=d>>16;i[z+3>>0]=d>>24;e=e+4|0;i[e>>0]=A;i[e+1>>0]=A>>8;i[e+2>>0]=A>>16;i[e+3>>0]=A>>24;k[c>>2]=s+1;e=u;if(u){a=k[t>>2]|0;if((a|0)!=(u|0))k[t>>2]=a+(~((a+-4-e|0)>>>2)<<2);rg(u);a=k[v>>2]|0}e=a;if(a){f=k[w>>2]|0;if((f|0)!=(a|0))k[w>>2]=f+(~((f+-4-e|0)>>>2)<<2);rg(a)}f=k[x>>2]|0;if(!f){r=y;return}a=x+4|0;e=k[a>>2]|0;if((e|0)!=(f|0))k[a>>2]=e+(~((e+-4-f|0)>>>2)<<2);rg(f);r=y;return}function Oe(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,n=0;do if((b|0)>0){e=k[(k[a>>2]|0)+(b<<2)>>2]|0;f=i[(k[a+48>>2]|0)+e>>0]|0;e=m[(k[a+60>>2]|0)+(e<<1)>>1]|0;h=hi(1,0,f&255|0)|0;g=L;if(g>>>0>0|(g|0)==0&h>>>0>e>>>0){h=k[c>>2]|0;g=d+(h>>3)|0;n=l[g>>0]|0;j=hi(e|0,0,h&7|0)|0;e=L;n=j|n;j=g;i[j>>0]=n;i[j+1>>0]=n>>8;i[j+2>>0]=n>>16;i[j+3>>0]=n>>24;g=g+4|0;i[g>>0]=e;i[g+1>>0]=e>>8;i[g+2>>0]=e>>16;i[g+3>>0]=e>>24;k[c>>2]=h+(f&255);break}else Ka(195222,195244,52,195268)}while(0);f=k[(k[a+12>>2]|0)+(b<<2)>>2]|0;e=i[(k[a+72>>2]|0)+f>>0]|0;f=m[(k[a+84>>2]|0)+(f<<1)>>1]|0;n=hi(1,0,e&255|0)|0;j=L;if(!(j>>>0>0|(j|0)==0&n>>>0>f>>>0))Ka(195222,195244,52,195268);g=k[c>>2]|0;h=d+(g>>3)|0;j=l[h>>0]|0;n=hi(f|0,0,g&7|0)|0;f=L;j=n|j;n=h;i[n>>0]=j;i[n+1>>0]=j>>8;i[n+2>>0]=j>>16;i[n+3>>0]=j>>24;h=h+4|0;i[h>>0]=f;i[h+1>>0]=f>>8;i[h+2>>0]=f>>16;i[h+3>>0]=f>>24;g=g+(e&255)|0;k[c>>2]=g;h=k[(k[a+24>>2]|0)+(b<<2)>>2]|0;e=k[(k[a+36>>2]|0)+(b<<2)>>2]|0;f=((e|0)<0)<<31>>31;n=hi(1,0,h|0)|0;j=L;if(j>>>0>f>>>0|(j|0)==(f|0)&n>>>0>e>>>0){n=d+(g>>3)|0;d=l[n>>0]|0;a=hi(e|0,f|0,g&7|0)|0;j=L;a=d|a;d=n;i[d>>0]=a;i[d+1>>0]=a>>8;i[d+2>>0]=a>>16;i[d+3>>0]=a>>24;n=n+4|0;i[n>>0]=j;i[n+1>>0]=j>>8;i[n+2>>0]=j>>16;i[n+3>>0]=j>>24;k[c>>2]=h+g;return}else Ka(195222,195244,52,195268)}function Pe(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;G=r;r=r+16|0;E=G;v=(k[a+4>>2]|0)-(k[a>>2]|0)|0;C=v>>2;D=c+2|0;k[E>>2]=0;F=E+4|0;k[F>>2]=0;k[E+8>>2]=0;do if(D)if(D>>>0>1073741823)mg(E);else{A=D<<2;z=og(A)|0;k[E>>2]=z;B=z+(D<<2)|0;k[E+8>>2]=B;gi(z|0,0,A|0)|0;k[F>>2]=B;break}while(0);B=og(104)|0;g=B;h=g+104|0;do{k[g>>2]=0;g=g+4|0}while((g|0)<(h|0));g=d+4|0;h=k[g>>2]|0;i=k[d>>2]|0;j=h-i>>2;if(C>>>0<=j>>>0){if(C>>>0<j>>>0?(l=i+(C<<2)|0,(h|0)!=(l|0)):0)k[g>>2]=h+(~((h+-4-l|0)>>>2)<<2)}else Ud(d,C-j|0);t=d+12|0;g=d+16|0;h=k[g>>2]|0;i=k[t>>2]|0;j=h-i>>2;if(C>>>0<=j>>>0){if(C>>>0<j>>>0?(m=i+(C<<2)|0,(h|0)!=(m|0)):0)k[g>>2]=h+(~((h+-4-m|0)>>>2)<<2)}else Ud(t,C-j|0);m=d+24|0;g=d+28|0;h=k[g>>2]|0;i=k[m>>2]|0;j=h-i>>2;if(C>>>0<=j>>>0){if(C>>>0<j>>>0?(n=i+(C<<2)|0,(h|0)!=(n|0)):0)k[g>>2]=h+(~((h+-4-n|0)>>>2)<<2)}else Ud(m,C-j|0);l=d+36|0;g=d+40|0;h=k[g>>2]|0;i=k[l>>2]|0;j=h-i>>2;if(C>>>0<=j>>>0){if(C>>>0<j>>>0?(o=i+(C<<2)|0,(h|0)!=(o|0)):0)k[g>>2]=h+(~((h+-4-o|0)>>>2)<<2)}else Ud(l,C-j|0);A=d+48|0;g=d+52|0;h=k[g>>2]|0;i=k[A>>2]|0;j=h-i|0;if(D>>>0<=j>>>0){if(D>>>0<j>>>0?(p=i+D|0,(h|0)!=(p|0)):0)k[g>>2]=p}else uc(A,D-j|0);z=d+60|0;h=d+64|0;i=k[h>>2]|0;j=k[z>>2]|0;g=i-j>>1;if(D>>>0<=g>>>0){if(D>>>0<g>>>0?(q=j+(D<<1)|0,(i|0)!=(q|0)):0)k[h>>2]=i+(~((i+-2-q|0)>>>1)<<1)}else Ve(z,D-g|0);y=d+72|0;g=d+76|0;h=k[g>>2]|0;i=k[y>>2]|0;j=h-i|0;if(j>>>0>=26){if(j>>>0>26?(s=i+26|0,(h|0)!=(s|0)):0)k[g>>2]=s}else uc(y,26-j|0);x=d+84|0;g=d+88|0;h=k[g>>2]|0;i=k[x>>2]|0;j=h-i>>1;if(j>>>0>=26){if(j>>>0>26?(u=i+52|0,(h|0)!=(u|0)):0)k[g>>2]=h+(~((h+-2-u|0)>>>1)<<1)}else Ve(x,26-j|0);if((v|0)>0){v=k[a>>2]|0;a=k[d>>2]|0;w=k[E>>2]|0;u=k[b>>2]|0;t=k[t>>2]|0;s=k[m>>2]|0;n=k[l>>2]|0;p=0;q=1;g=0;while(1){o=k[v+(p<<2)>>2]|0;if((o|0)==(q+1|0))g=1;else g=(o|0)==(g|0)?0:o+2|0;k[a+(p<<2)>>2]=g;if((p|0)>0){b=w+(g<<2)|0;k[b>>2]=(k[b>>2]|0)+1}i=k[u+(p<<2)>>2]|0;j=t+(p<<2)|0;l=s+(p<<2)|0;m=n+(p<<2)|0;k[j>>2]=0;h=0;while(1){g=h+1|0;if((k[1876+(g<<3)>>2]|0)>(i|0)){g=h;break}k[j>>2]=g;if((g|0)<25)h=g;else break}k[l>>2]=k[1876+(g<<3)+4>>2];k[m>>2]=i-(k[1876+(k[j>>2]<<3)>>2]|0);b=B+(k[j>>2]<<2)|0;k[b>>2]=(k[b>>2]|0)+1;p=p+1|0;if((p|0)>=(C|0))break;else{g=q;q=o}}}Ce(c+-1|0,e,f);if((c|0)>1){Je(k[E>>2]|0,D,k[A>>2]|0,k[z>>2]|0,e,f);Je(B,26,k[y>>2]|0,k[x>>2]|0,e,f);Oe(d,0,e,f)}rg(B);g=k[E>>2]|0;if(!g){r=G;return}h=k[F>>2]|0;if((h|0)!=(g|0))k[F>>2]=h+(~((h+-4-g|0)>>>2)<<2);rg(g);r=G;return}function Qe(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;x=r;r=r+48|0;v=x+24|0;u=x+12|0;t=x;Ce(a+-1|0,c,d);if((a|0)<=1){r=x;return}p=b+-1|0;n=(1<<p)+-1|0;j=p+a|0;k[v>>2]=0;w=v+4|0;k[w>>2]=0;k[v+8>>2]=0;do if(j){if(j>>>0>1073741823)mg(v);h=j<<2;g=og(h)|0;k[v>>2]=g;f=g+(j<<2)|0;k[v+8>>2]=f;gi(g|0,0,h|0)|0;k[w>>2]=f;k[u>>2]=0;f=u+4|0;k[f>>2]=0;k[u+8>>2]=0;h=(j|0)<0;if(h)mg(u);g=og(j)|0;k[f>>2]=g;k[u>>2]=g;k[u+8>>2]=g+j;e=j;do{i[g>>0]=0;g=(k[f>>2]|0)+1|0;k[f>>2]=g;e=e+-1|0}while((e|0)!=0);k[t>>2]=0;e=t+4|0;k[e>>2]=0;k[t+8>>2]=0;if(h)mg(t);else{q=j<<1;h=og(q)|0;k[t>>2]=h;o=h+(j<<1)|0;k[t+8>>2]=o;gi(h|0,0,q|0)|0;k[e>>2]=o;o=u;q=t;break}}else{k[u>>2]=0;k[u+4>>2]=0;k[u+8>>2]=0;k[t>>2]=0;k[t+4>>2]=0;k[t+8>>2]=0;o=u;q=t}while(0);e=k[c>>2]|0;f=d+(e>>3)|0;y=l[f>>0]|0;h=hi(1,0,e&7|0)|0;g=L;y=h|y;h=f;i[h>>0]=y;i[h+1>>0]=y>>8;i[h+2>>0]=y>>16;i[h+3>>0]=y>>24;f=f+4|0;i[f>>0]=g;i[f+1>>0]=g>>8;i[f+2>>0]=g>>16;i[f+3>>0]=g>>24;f=e+1|0;k[c>>2]=f;g=b+-2|0;if(g>>>0>=16)Ka(195222,195244,52,195268);h=d+(f>>3)|0;z=l[h>>0]|0;g=hi(g|0,((g|0)<0)<<31>>31|0,f&7|0)|0;y=L;g=z|g;f=h;h=f;i[h>>0]=g;i[h+1>>0]=g>>8;i[h+2>>0]=g>>16;i[h+3>>0]=g>>24;f=f+4|0;i[f>>0]=y;i[f+1>>0]=y>>8;i[f+2>>0]=y>>16;i[f+3>>0]=y>>24;k[c>>2]=e+5;f=k[v>>2]|0;k[f+(p<<2)>>2]=a;k[f>>2]=1;if((j|0)>(b|0)){g=b+a+-1|0;e=b;do{k[f+(e<<2)>>2]=1;e=e+1|0}while((e|0)!=(g|0))}Je(f,j,k[o>>2]|0,k[q>>2]|0,c,d);a:do if((a|0)>0){h=((n|0)<0)<<31>>31;z=hi(1,0,p|0)|0;y=L;if(y>>>0>h>>>0|(y|0)==(h|0)&z>>>0>n>>>0){b=0;while(1){f=(b|0)==0?0:p+b|0;e=i[(k[o>>2]|0)+f>>0]|0;f=m[(k[q>>2]|0)+(f<<1)>>1]|0;z=hi(1,0,e&255|0)|0;y=L;if(!(y>>>0>0|(y|0)==0&z>>>0>f>>>0)){e=25;break}g=k[c>>2]|0;y=d+(g>>3)|0;j=l[y>>0]|0;f=hi(f|0,0,g&7|0)|0;z=L;j=f|j;f=y;y=f;i[y>>0]=j;i[y+1>>0]=j>>8;i[y+2>>0]=j>>16;i[y+3>>0]=j>>24;f=f+4|0;i[f>>0]=z;i[f+1>>0]=z>>8;i[f+2>>0]=z>>16;i[f+3>>0]=z>>24;e=g+(e&255)|0;k[c>>2]=e;f=i[(k[o>>2]|0)+p>>0]|0;g=m[(k[q>>2]|0)+(p<<1)>>1]|0;z=hi(1,0,f&255|0)|0;y=L;if(!(y>>>0>0|(y|0)==0&z>>>0>g>>>0)){e=27;break}z=d+(e>>3)|0;A=l[z>>0]|0;y=hi(g|0,0,e&7|0)|0;j=L;y=A|y;g=z;i[g>>0]=y;i[g+1>>0]=y>>8;i[g+2>>0]=y>>16;i[g+3>>0]=y>>24;z=z+4|0;i[z>>0]=j;i[z+1>>0]=j>>8;i[z+2>>0]=j>>16;i[z+3>>0]=j>>24;e=(f&255)+e|0;z=d+(e>>3)|0;j=l[z>>0]|0;g=hi(n|0,h|0,e&7|0)|0;y=L;g=j|g;j=z;i[j>>0]=g;i[j+1>>0]=g>>8;i[j+2>>0]=g>>16;i[j+3>>0]=g>>24;z=z+4|0;i[z>>0]=y;i[z+1>>0]=y>>8;i[z+2>>0]=y>>16;i[z+3>>0]=y>>24;e=e+p|0;k[c>>2]=e;b=b+1|0;if((b|0)>=(a|0)){s=e;break a}}if((e|0)==25)Ka(195222,195244,52,195268);else if((e|0)==27)Ka(195222,195244,52,195268)}else{e=i[k[o>>2]>>0]|0;f=m[k[q>>2]>>1]|0;A=hi(1,0,e&255|0)|0;z=L;if(!(z>>>0>0|(z|0)==0&A>>>0>f>>>0))Ka(195222,195244,52,195268);g=k[c>>2]|0;z=d+(g>>3)|0;y=l[z>>0]|0;f=hi(f|0,0,g&7|0)|0;A=L;y=f|y;f=z;z=f;i[z>>0]=y;i[z+1>>0]=y>>8;i[z+2>>0]=y>>16;i[z+3>>0]=y>>24;f=f+4|0;i[f>>0]=A;i[f+1>>0]=A>>8;i[f+2>>0]=A>>16;i[f+3>>0]=A>>24;g=g+(e&255)|0;k[c>>2]=g;f=i[(k[o>>2]|0)+p>>0]|0;e=m[(k[q>>2]|0)+(p<<1)>>1]|0;A=hi(1,0,f&255|0)|0;z=L;if(z>>>0>0|(z|0)==0&A>>>0>e>>>0){A=d+(g>>3)|0;y=l[A>>0]|0;q=hi(e|0,0,g&7|0)|0;z=L;q=y|q;y=A;i[y>>0]=q;i[y+1>>0]=q>>8;i[y+2>>0]=q>>16;i[y+3>>0]=q>>24;A=A+4|0;i[A>>0]=z;i[A+1>>0]=z>>8;i[A+2>>0]=z>>16;i[A+3>>0]=z>>24;k[c>>2]=(f&255)+g;Ka(195222,195244,52,195268)}else Ka(195222,195244,52,195268)}}else s=k[c>>2]|0;while(0);g=d+(s>>3)|0;z=l[g>>0]|0;A=hi(1,0,s&7|0)|0;h=L;z=A|z;A=g;i[A>>0]=z;i[A+1>>0]=z>>8;i[A+2>>0]=z>>16;i[A+3>>0]=z>>24;g=g+4|0;i[g>>0]=h;i[g+1>>0]=h>>8;i[g+2>>0]=h>>16;i[g+3>>0]=h>>24;k[c>>2]=s+1;g=k[t>>2]|0;h=g;if(g){e=t+4|0;f=k[e>>2]|0;if((f|0)!=(g|0))k[e>>2]=f+(~((f+-2-h|0)>>>1)<<1);rg(g)}f=k[u>>2]|0;if(f){e=u+4|0;if((k[e>>2]|0)!=(f|0))k[e>>2]=f;rg(f)}e=k[v>>2]|0;if(!e){r=x;return}f=k[w>>2]|0;if((f|0)!=(e|0))k[w>>2]=f+(~((f+-4-e|0)>>>2)<<2);rg(e);r=x;return}function Re(a,b,c,d,e,f,g,h,m,n,o,p,q,s,t){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;s=s|0;t=t|0;var u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,M=0,N=0,O=0,P=0,Q=0;Q=r;r=r+448|0;P=Q+296|0;N=Q+148|0;K=Q;if(!(De(g,c,s,t)|0)){P=0;r=Q;return P|0}if(!c){P=(k[s>>2]|0)+7|0;k[s>>2]=P&-8;i[t+(P>>3)>>0]=0;P=1;r=Q;return P|0}D=k[q>>2]|0;E=q+4|0;F=q+16|0;k[P>>2]=256;k[P+4>>2]=D;k[P+8>>2]=E;k[P+12>>2]=F;O=P+16|0;u=P+116|0;y=O;z=y+100|0;do{k[y>>2]=0;y=y+4|0}while((y|0)<(z|0));c=k[F>>2]|0;if((c|0)==(k[q+20>>2]|0))c=0;else c=k[c>>2]|0;k[u>>2]=c;B=P+120|0;k[B>>2]=0;k[B+4>>2]=0;k[B+8>>2]=0;k[B+12>>2]=0;k[B+16>>2]=0;k[B+20>>2]=0;k[B+24>>2]=0;B=k[q+28>>2]|0;c=q+44|0;k[N>>2]=704;A=N+4|0;k[A>>2]=B;B=N+8|0;k[B>>2]=q+32;C=N+12|0;k[C>>2]=c;M=N+16|0;u=N+116|0;y=M;z=y+100|0;do{k[y>>2]=0;y=y+4|0}while((y|0)<(z|0));c=k[c>>2]|0;if((c|0)==(k[q+48>>2]|0))c=0;else c=k[c>>2]|0;k[u>>2]=c;v=N+120|0;k[v>>2]=0;k[v+4>>2]=0;k[v+8>>2]=0;k[v+12>>2]=0;k[v+16>>2]=0;k[v+20>>2]=0;k[v+24>>2]=0;v=k[q+56>>2]|0;c=q+72|0;k[K>>2]=h+16+(48<<m);u=K+4|0;k[u>>2]=v;v=K+8|0;k[v>>2]=q+60;w=K+12|0;k[w>>2]=c;J=K+16|0;x=K+116|0;y=J;z=y+100|0;do{k[y>>2]=0;y=y+4|0}while((y|0)<(z|0));c=k[c>>2]|0;if((c|0)==(k[q+76>>2]|0))c=0;else c=k[c>>2]|0;k[x>>2]=c;I=K+120|0;k[I>>2]=0;k[I+4>>2]=0;k[I+8>>2]=0;k[I+12>>2]=0;k[I+16>>2]=0;k[I+20>>2]=0;k[I+24>>2]=0;Pe(E,F,D,O,s,t);Pe(k[B>>2]|0,k[C>>2]|0,k[A>>2]|0,M,s,t);Pe(k[v>>2]|0,k[w>>2]|0,k[u>>2]|0,J,s,t);if(m>>>0>=4)Ka(195222,195244,52,195268);u=k[s>>2]|0;v=t+(u>>3)|0;H=l[v>>0]|0;I=hi(m|0,((m|0)<0)<<31>>31|0,u&7|0)|0;c=L;H=I|H;I=v;i[I>>0]=H;i[I+1>>0]=H>>8;i[I+2>>0]=H>>16;i[I+3>>0]=H>>24;v=v+4|0;i[v>>0]=c;i[v+1>>0]=c>>8;i[v+2>>0]=c>>16;i[v+3>>0]=c>>24;v=u+2|0;k[s>>2]=v;c=h>>m;if(c>>>0>=16)Ka(195222,195244,52,195268);H=t+(v>>3)|0;h=l[H>>0]|0;G=hi(c|0,((c|0)<0)<<31>>31|0,v&7|0)|0;I=L;G=h|G;c=H;H=c;i[H>>0]=G;i[H+1>>0]=G>>8;i[H+2>>0]=G>>16;i[H+3>>0]=G>>24;c=c+4|0;i[c>>0]=I;i[c+1>>0]=I>>8;i[c+2>>0]=I>>16;i[c+3>>0]=I>>24;c=u+6|0;k[s>>2]=c;if((k[q>>2]|0)>0){v=((n|0)<0)<<31>>31;if(n>>>0<4){u=0;do{I=t+(c>>3)|0;h=l[I>>0]|0;G=hi(n|0,v|0,c&7|0)|0;H=L;h=G|h;G=I;i[G>>0]=h;i[G+1>>0]=h>>8;i[G+2>>0]=h>>16;i[G+3>>0]=h>>24;I=I+4|0;i[I>>0]=H;i[I+1>>0]=H>>8;i[I+2>>0]=H>>16;i[I+3>>0]=H>>24;c=c+2|0;k[s>>2]=c;u=u+1|0}while((u|0)<(k[q>>2]|0))}else Ka(195222,195244,52,195268)}H=q+84|0;I=q+88|0;v=q+108|0;c=((k[q+112>>2]|0)-(k[v>>2]|0)|0)/1040|0;if((k[H>>2]|0)==(k[I>>2]|0))Qe(c,6,s,t);else Ne(H,c,s,t);h=q+96|0;G=q+100|0;c=q+132|0;u=((k[q+136>>2]|0)-(k[c>>2]|0)|0)/2096|0;if((k[h>>2]|0)==(k[G>>2]|0))Qe(u,2,s,t);else Ne(h,u,s,t);We(P,v,s,t);Xe(N,q+120|0,s,t);Ye(K,c,s,t);a:do if(p){m=(n|0)==0;u=e;c=f;F=0;z=b;while(1){y=k[o+(F<<5)>>2]|0;A=k[o+(F<<5)+4>>2]|0;B=j[o+(F<<5)+8>>1]|0;C=j[o+(F<<5)+10>>1]|0;x=o+(F<<5)+16|0;v=k[x>>2]|0;x=k[x+4>>2]|0;D=k[o+(F<<5)+24>>2]|0;E=B&65535;Ze(N,E,s,t);w=x&65535;x=ji(v|0,x|0,48)|0;b=hi(1,0,x|0)|0;f=L;if(!(f>>>0>w>>>0|(f|0)==(w|0)&b>>>0>v>>>0)){c=27;break}b=k[s>>2]|0;e=t+(b>>3)|0;q=l[e>>0]|0;v=hi(v|0,w|0,b&7|0)|0;f=L;q=v|q;v=e;e=v;i[e>>0]=q;i[e+1>>0]=q>>8;i[e+2>>0]=q>>16;i[e+3>>0]=q>>24;v=v+4|0;i[v>>0]=f;i[v+1>>0]=f>>8;i[v+2>>0]=f>>16;i[v+3>>0]=f>>24;k[s>>2]=b+x;v=(y|0)>0;b:do if((k[H>>2]|0)==(k[I>>2]|0))if(v){w=0;v=z;do{Ze(P,l[a+(v&d)>>0]|0,s,t);v=v+1|0;w=w+1|0}while((w|0)<(y|0));x=u;u=v}else{x=u;u=z}else if(v){if(m){c=u;w=0;u=z;while(1){v=i[a+(u&d)>>0]|0;_e(P,v&255,c&63,H,s,t);u=u+1|0;w=w+1|0;if((w|0)>=(y|0)){x=v;break b}else c=v}}else{x=0;w=z}while(1){switch(n|0){case 3:{c=((l[318858+(u&255)>>0]|0)<<3)+(l[318858+(c&255)>>0]|0)&255;break}case 1:{c=(u&255)>>>2;break}case 2:{c=i[318346+(c&255|256)>>0]|i[318346+(u&255)>>0];break}default:c=0}v=i[a+(w&d)>>0]|0;_e(P,v&255,c&255,H,s,t);w=w+1|0;x=x+1|0;if((x|0)>=(y|0)){x=v;c=u;u=w;break b}else{c=u;u=v}}}else{x=u;u=z}while(0);z=u+A|0;if((A|0)>0){c=i[a+(z+-2&d)>>0]|0;u=i[a+(z+-1&d)>>0]|0;if((B&65535)>127){w=C&65535;x=D>>>24;v=D&16777215;if((k[h>>2]|0)==(k[G>>2]|0))Ze(K,w,s,t);else{f=E>>>6;b=E&7;$e(K,w,b>>>0<3&((f|0)==7|((f|0)==4|(f&1021|0)==0))?b:3,h,s,t)}b=hi(1,0,x|0)|0;f=L;if(!(f>>>0>0|(f|0)==0&b>>>0>v>>>0)){c=45;break}b=k[s>>2]|0;f=t+(b>>3)|0;E=l[f>>0]|0;q=hi(v|0,0,b&7|0)|0;e=L;E=q|E;q=f;i[q>>0]=E;i[q+1>>0]=E>>8;i[q+2>>0]=E>>16;i[q+3>>0]=E>>24;f=f+4|0;i[f>>0]=e;i[f+1>>0]=e>>8;i[f+2>>0]=e>>16;i[f+3>>0]=e>>24;k[s>>2]=b+x}}else u=x;F=F+1|0;if(F>>>0>=p>>>0)break a}if((c|0)==27)Ka(195222,195244,52,195268);else if((c|0)==45)Ka(195222,195244,52,195268)}while(0);if(g){g=(k[s>>2]|0)+7|0;k[s>>2]=g&-8;i[t+(g>>3)>>0]=0}c=k[K+136>>2]|0;u=c;if(c){v=K+140|0;w=k[v>>2]|0;if((w|0)!=(c|0))k[v>>2]=w+(~((w+-2-u|0)>>>1)<<1);rg(c)}u=k[K+124>>2]|0;if(u){c=K+128|0;if((k[c>>2]|0)!=(u|0))k[c>>2]=u;rg(u)}af(J);c=k[N+136>>2]|0;u=c;if(c){v=N+140|0;w=k[v>>2]|0;if((w|0)!=(c|0))k[v>>2]=w+(~((w+-2-u|0)>>>1)<<1);rg(c)}u=k[N+124>>2]|0;if(u){c=N+128|0;if((k[c>>2]|0)!=(u|0))k[c>>2]=u;rg(u)}af(M);c=k[P+136>>2]|0;u=c;if(c){v=P+140|0;w=k[v>>2]|0;if((w|0)!=(c|0))k[v>>2]=w+(~((w+-2-u|0)>>>1)<<1);rg(c)}u=k[P+124>>2]|0;if(u){c=P+128|0;if((k[c>>2]|0)!=(u|0))k[c>>2]=u;rg(u)}af(O);P=1;r=Q;return P|0}function Se(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0;if(!(Ee(e,f,g)|0)){f=0;return f|0}j=(k[f>>2]|0)+7|0;h=j&-8;k[f>>2]=h;i[g+(j>>3)>>0]=0;c=d&c;d=d+1|0;if((c+e|0)>>>0>d>>>0){d=d-c|0;ki(g+(j>>3)|0,b+c|0,d|0)|0;h=h+(d<<3)|0;k[f>>2]=h;e=e-d|0;c=0}ki(g+(h>>3)|0,b+c|0,e|0)|0;c=h+(e<<3)|0;k[f>>2]=c;if(c&7)Ka(195308,195244,85,195323);h=g+(c>>3)|0;i[h>>0]=0;if(!a){f=1;return f|0}j=h;a=j;i[a>>0]=1;i[a+1>>0]=0;i[a+2>>0]=0;i[a+3>>0]=0;j=j+4|0;i[j>>0]=0;i[j+1>>0]=0;i[j+2>>0]=0;i[j+3>>0]=0;j=c+1|0;a=g+(j>>3)|0;d=l[a>>0]|0;j=hi(1,0,j&7|0)|0;b=L;d=j|d;j=a;i[j>>0]=d;i[j+1>>0]=d>>8;i[j+2>>0]=d>>16;i[j+3>>0]=d>>24;a=a+4|0;i[a>>0]=b;i[a+1>>0]=b>>8;i[a+2>>0]=b>>16;i[a+3>>0]=b>>24;a=c+9|0;k[f>>2]=a&-8;i[g+(a>>3)>>0]=0;f=1;return f|0}function Te(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;k[a>>2]=0;g=a+4|0;k[g>>2]=0;k[a+8>>2]=0;e=b+4|0;c=(k[e>>2]|0)-(k[b>>2]|0)|0;d=c>>2;if(!d)return;if(d>>>0>1073741823)mg(a);f=og(c)|0;k[g>>2]=f;k[a>>2]=f;k[a+8>>2]=f+(d<<2);c=k[b>>2]|0;b=k[e>>2]|0;if((c|0)==(b|0))return;a=(b+-4-c|0)>>>2;d=f;while(1){k[d>>2]=k[c>>2];c=c+4|0;if((c|0)==(b|0))break;else d=d+4|0}k[g>>2]=f+(a+1<<2);return}function Ue(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,j=0,m=0,n=0,o=0,p=0,q=0,s=0.0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;q=r;r=r+368|0;p=q;o=q+344|0;n=q+72|0;d=k[a+1088>>2]|0;if(!d){s=12.0;r=q;return +s}else{b=0;c=0}do{b=((k[a+(c<<2)>>2]|0)>0&1)+b|0;c=c+1|0}while((b|0)<5&(c|0)<272);switch(b|0){case 2:{s=+(d+20|0);r=q;return +s}case 1:{s=12.0;r=q;return +s}default:{gi(n|0,0,272)|0;Af(a,272,15,n);c=0;d=0;do{c=(ha(l[n+d>>0]|0,k[a+(d<<2)>>2]|0)|0)+c|0;d=d+1|0}while((d|0)!=272);switch(b|0){case 3:{b=c+28|0;break}case 4:{b=c+37|0;break}default:{d=p;a=d+72|0;do{k[d>>2]=0;d=d+4|0}while((d|0)<(a|0));j=p+68|0;m=p+64|0;d=0;b=1;h=8;a:while(1){g=d;while(1){e=i[n+g>>0]|0;f=e&255;b=(f|0)>(b|0)?f:b;d=g+1|0;b:do if((d|0)<272){a=1;do{if((i[n+d>>0]|0)!=e<<24>>24)break b;a=a+1|0;d=d+1|0}while((d|0)<272)}else a=1;while(0);g=a+g|0;d=e<<24>>24==0;if(d&(g|0)==272)break a;if(!d){e=g;d=a;break}if((a|0)<3)k[p>>2]=(k[p>>2]|0)+a;else{d=k[j>>2]|0;a=a+-2|0;do{d=d+1|0;a=a>>3}while((a|0)>0);k[j>>2]=d}if((g|0)>=272)break a}if((f|0)==(h|0))a=d;else{a=p+(f<<2)|0;k[a>>2]=(k[a>>2]|0)+1;a=d+-1|0}if((a|0)<3){h=p+(f<<2)|0;k[h>>2]=(k[h>>2]|0)+a}else{d=k[m>>2]|0;a=a+-2|0;do{d=d+1|0;a=a>>2}while((a|0)>0);k[m>>2]=d}if((e|0)<272){d=e;h=f}else break}d=o;a=d+18|0;do{i[d>>0]=0;d=d+1|0}while((d|0)<(a|0));Af(p,18,7,o);C=o+16|0;i[C>>0]=(l[C>>0]|0)+2;B=o+17|0;n=(l[B>>0]|0)+3|0;i[B>>0]=n;B=ha(l[o>>0]|0,k[p>>2]|0)|0;A=ha(l[o+1>>0]|0,k[p+4>>2]|0)|0;z=ha(l[o+2>>0]|0,k[p+8>>2]|0)|0;y=ha(l[o+3>>0]|0,k[p+12>>2]|0)|0;x=ha(l[o+4>>0]|0,k[p+16>>2]|0)|0;w=ha(l[o+5>>0]|0,k[p+20>>2]|0)|0;v=ha(l[o+6>>0]|0,k[p+24>>2]|0)|0;u=ha(l[o+7>>0]|0,k[p+28>>2]|0)|0;t=ha(l[o+8>>0]|0,k[p+32>>2]|0)|0;d=ha(l[o+9>>0]|0,k[p+36>>2]|0)|0;a=ha(l[o+10>>0]|0,k[p+40>>2]|0)|0;e=ha(l[o+11>>0]|0,k[p+44>>2]|0)|0;f=ha(l[o+12>>0]|0,k[p+48>>2]|0)|0;g=ha(l[o+13>>0]|0,k[p+52>>2]|0)|0;h=ha(l[o+14>>0]|0,k[p+56>>2]|0)|0;o=ha(l[o+15>>0]|0,k[p+60>>2]|0)|0;p=ha(l[C>>0]|0,k[m>>2]|0)|0;b=c+18+(b<<1)+B+A+z+y+x+w+v+u+t+d+a+e+f+g+h+o+p+(ha(k[j>>2]|0,n&255)|0)|0}}s=+(b|0);r=q;return +s}}return 0.0}function Ve(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0;g=a+8|0;d=k[g>>2]|0;j=a+4|0;e=k[j>>2]|0;c=e;if(d-c>>1>>>0>=b>>>0){gi(e|0,0,b<<1|0)|0;k[j>>2]=e+(b<<1);return}h=k[a>>2]|0;i=h;c=(c-i>>1)+b|0;if((c|0)<0)mg(a);l=h;f=d-l|0;f=f>>1>>>0<1073741823?(f>>>0<c>>>0?c:f):2147483647;c=e-l|0;d=c>>1;if(!f)e=0;else e=og(f<<1)|0;gi(e+(d<<1)|0,0,b<<1|0)|0;ki(e|0,h|0,c|0)|0;k[a>>2]=e;k[j>>2]=e+(d+b<<1);k[g>>2]=e+(f<<1);if(!i)return;rg(i);return}function We(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0;p=a+124|0;q=b+4|0;f=k[q>>2]|0;e=k[b>>2]|0;g=k[a>>2]|0;n=ha(g,(f-e|0)/1040|0)|0;h=a+128|0;i=k[h>>2]|0;j=k[p>>2]|0;l=i-j|0;if(n>>>0<=l>>>0){if(n>>>0<l>>>0?(m=j+n|0,(i|0)!=(m|0)):0)k[h>>2]=m}else{uc(p,n-l|0);f=k[q>>2]|0;e=k[b>>2]|0;g=k[a>>2]|0}m=a+136|0;g=ha(g,(f-e|0)/1040|0)|0;h=a+140|0;i=k[h>>2]|0;j=k[m>>2]|0;l=i-j>>1;if(g>>>0<=l>>>0){if(g>>>0<l>>>0?(o=j+(g<<1)|0,(i|0)!=(o|0)):0)k[h>>2]=i+(~((i+-2-o|0)>>>1)<<1)}else{Ve(m,g-l|0);f=k[q>>2]|0;e=k[b>>2]|0}if((f|0)==(e|0))return;else f=0;do{n=k[a>>2]|0;o=ha(n,f)|0;Je(e+(f*1040|0)|0,n,(k[p>>2]|0)+o|0,(k[m>>2]|0)+(o<<1)|0,c,d);f=f+1|0;e=k[b>>2]|0}while(f>>>0<(((k[q>>2]|0)-e|0)/1040|0)>>>0);return}function Xe(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0;p=a+124|0;q=b+4|0;f=k[q>>2]|0;e=k[b>>2]|0;g=k[a>>2]|0;n=ha(g,(f-e|0)/2832|0)|0;h=a+128|0;i=k[h>>2]|0;j=k[p>>2]|0;l=i-j|0;if(n>>>0<=l>>>0){if(n>>>0<l>>>0?(m=j+n|0,(i|0)!=(m|0)):0)k[h>>2]=m}else{uc(p,n-l|0);f=k[q>>2]|0;e=k[b>>2]|0;g=k[a>>2]|0}m=a+136|0;g=ha(g,(f-e|0)/2832|0)|0;h=a+140|0;i=k[h>>2]|0;j=k[m>>2]|0;l=i-j>>1;if(g>>>0<=l>>>0){if(g>>>0<l>>>0?(o=j+(g<<1)|0,(i|0)!=(o|0)):0)k[h>>2]=i+(~((i+-2-o|0)>>>1)<<1)}else{Ve(m,g-l|0);f=k[q>>2]|0;e=k[b>>2]|0}if((f|0)==(e|0))return;else f=0;do{n=k[a>>2]|0;o=ha(n,f)|0;Je(e+(f*2832|0)|0,n,(k[p>>2]|0)+o|0,(k[m>>2]|0)+(o<<1)|0,c,d);f=f+1|0;e=k[b>>2]|0}while(f>>>0<(((k[q>>2]|0)-e|0)/2832|0)>>>0);return}function Ye(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0;p=a+124|0;q=b+4|0;f=k[q>>2]|0;e=k[b>>2]|0;g=k[a>>2]|0;n=ha(g,(f-e|0)/2096|0)|0;h=a+128|0;i=k[h>>2]|0;j=k[p>>2]|0;l=i-j|0;if(n>>>0<=l>>>0){if(n>>>0<l>>>0?(m=j+n|0,(i|0)!=(m|0)):0)k[h>>2]=m}else{uc(p,n-l|0);f=k[q>>2]|0;e=k[b>>2]|0;g=k[a>>2]|0}m=a+136|0;g=ha(g,(f-e|0)/2096|0)|0;h=a+140|0;i=k[h>>2]|0;j=k[m>>2]|0;l=i-j>>1;if(g>>>0<=l>>>0){if(g>>>0<l>>>0?(o=j+(g<<1)|0,(i|0)!=(o|0)):0)k[h>>2]=i+(~((i+-2-o|0)>>>1)<<1)}else{Ve(m,g-l|0);f=k[q>>2]|0;e=k[b>>2]|0}if((f|0)==(e|0))return;else f=0;do{n=k[a>>2]|0;o=ha(n,f)|0;Je(e+(f*2096|0)|0,n,(k[p>>2]|0)+o|0,(k[m>>2]|0)+(o<<1)|0,c,d);f=f+1|0;e=k[b>>2]|0}while(f>>>0<(((k[q>>2]|0)-e|0)/2096|0)>>>0);return}function Ze(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;g=a+116|0;e=k[g>>2]|0;if(!e){h=a+112|0;e=(k[h>>2]|0)+1|0;k[h>>2]=e;k[g>>2]=k[(k[k[a+12>>2]>>2]|0)+(e<<2)>>2];h=ha(k[a>>2]|0,k[(k[k[a+8>>2]>>2]|0)+(e<<2)>>2]|0)|0;f=a+120|0;k[f>>2]=h;Oe(a+16|0,e,c,d);e=k[g>>2]|0}else f=a+120|0;k[g>>2]=e+-1;e=(k[f>>2]|0)+b|0;f=i[(k[a+124>>2]|0)+e>>0]|0;e=m[(k[a+136>>2]|0)+(e<<1)>>1]|0;h=hi(1,0,f&255|0)|0;a=L;if(a>>>0>0|(a|0)==0&h>>>0>e>>>0){h=k[c>>2]|0;d=d+(h>>3)|0;g=l[d>>0]|0;b=hi(e|0,0,h&7|0)|0;a=L;g=b|g;b=d;i[b>>0]=g;i[b+1>>0]=g>>8;i[b+2>>0]=g>>16;i[b+3>>0]=g>>24;d=d+4|0;i[d>>0]=a;i[d+1>>0]=a>>8;i[d+2>>0]=a>>16;i[d+3>>0]=a>>24;k[c>>2]=h+(f&255);return}else Ka(195222,195244,52,195268)}function _e(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;j=a+116|0;g=k[j>>2]|0;if(!g){h=a+112|0;g=(k[h>>2]|0)+1|0;k[h>>2]=g;k[j>>2]=k[(k[k[a+12>>2]>>2]|0)+(g<<2)>>2];h=a+120|0;k[h>>2]=k[(k[k[a+8>>2]>>2]|0)+(g<<2)>>2]<<6;Oe(a+16|0,g,e,f);g=k[j>>2]|0}else h=a+120|0;k[j>>2]=g+-1;g=(ha(k[a>>2]|0,k[(k[d>>2]|0)+((k[h>>2]|0)+c<<2)>>2]|0)|0)+b|0;h=i[(k[a+124>>2]|0)+g>>0]|0;g=m[(k[a+136>>2]|0)+(g<<1)>>1]|0;a=hi(1,0,h&255|0)|0;b=L;if(b>>>0>0|(b|0)==0&a>>>0>g>>>0){a=k[e>>2]|0;f=f+(a>>3)|0;c=l[f>>0]|0;d=hi(g|0,0,a&7|0)|0;b=L;c=d|c;d=f;i[d>>0]=c;i[d+1>>0]=c>>8;i[d+2>>0]=c>>16;i[d+3>>0]=c>>24;f=f+4|0;i[f>>0]=b;i[f+1>>0]=b>>8;i[f+2>>0]=b>>16;i[f+3>>0]=b>>24;k[e>>2]=a+(h&255);return}else Ka(195222,195244,52,195268)}function $e(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;j=a+116|0;g=k[j>>2]|0;if(!g){h=a+112|0;g=(k[h>>2]|0)+1|0;k[h>>2]=g;k[j>>2]=k[(k[k[a+12>>2]>>2]|0)+(g<<2)>>2];h=a+120|0;k[h>>2]=k[(k[k[a+8>>2]>>2]|0)+(g<<2)>>2]<<2;Oe(a+16|0,g,e,f);g=k[j>>2]|0}else h=a+120|0;k[j>>2]=g+-1;g=(ha(k[a>>2]|0,k[(k[d>>2]|0)+((k[h>>2]|0)+c<<2)>>2]|0)|0)+b|0;h=i[(k[a+124>>2]|0)+g>>0]|0;g=m[(k[a+136>>2]|0)+(g<<1)>>1]|0;a=hi(1,0,h&255|0)|0;b=L;if(b>>>0>0|(b|0)==0&a>>>0>g>>>0){a=k[e>>2]|0;f=f+(a>>3)|0;c=l[f>>0]|0;d=hi(g|0,0,a&7|0)|0;b=L;c=d|c;d=f;i[d>>0]=c;i[d+1>>0]=c>>8;i[d+2>>0]=c>>16;i[d+3>>0]=c>>24;f=f+4|0;i[f>>0]=b;i[f+1>>0]=b>>8;i[f+2>>0]=b>>16;i[f+3>>0]=b>>24;k[e>>2]=a+(h&255);return}else Ka(195222,195244,52,195268)}function af(a){a=a|0;var b=0,c=0,d=0,e=0;b=k[a+84>>2]|0;c=b;if(b){d=a+88|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-2-c|0)>>>1)<<1);rg(b)}b=k[a+72>>2]|0;if(b){c=a+76|0;if((k[c>>2]|0)!=(b|0))k[c>>2]=b;rg(b)}b=k[a+60>>2]|0;c=b;if(b){d=a+64|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-2-c|0)>>>1)<<1);rg(b)}b=k[a+48>>2]|0;if(b){c=a+52|0;if((k[c>>2]|0)!=(b|0))k[c>>2]=b;rg(b)}b=k[a+36>>2]|0;c=b;if(b){d=a+40|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}b=k[a+24>>2]|0;c=b;if(b){d=a+28|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}b=k[a+12>>2]|0;c=b;if(b){d=a+16|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}d=k[a>>2]|0;if(!d)return;b=a+4|0;c=k[b>>2]|0;if((c|0)!=(d|0))k[b>>2]=c+(~((c+-4-d|0)>>>2)<<2);rg(d);return}function bf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,m=0,n=0,o=0;d=i[b>>0]|0;e=d&255;if((e&128|0)==0?(k[a>>2]=e,d<<24>>24!=0):0){a=1;return a|0}if((c|0)>1){d=l[b>>0]|0;if(((d&224|0)==192?(f=l[b+1>>0]|0,(f&192|0)==128):0)?(f=f&63|d<<6&1984,k[a>>2]=f,f>>>0>127):0){a=2;return a|0}if((c|0)>2){d=l[b>>0]|0;if((((d&240|0)==224?(g=l[b+1>>0]|0,(g&192|0)==128):0)?(h=l[b+2>>0]|0,(h&192|0)==128):0)?(h=g<<6&4032|d<<12&61440|h&63,k[a>>2]=h,h>>>0>2047):0){a=3;return a|0}if((((((c|0)>3?(j=l[b>>0]|0,(j&248|0)==240):0)?(m=l[b+1>>0]|0,(m&192|0)==128):0)?(n=l[b+2>>0]|0,(n&192|0)==128):0)?(o=l[b+3>>0]|0,(o&192|0)==128):0)?(c=m<<12&258048|j<<18&1835008|n<<6&4032|o&63,k[a>>2]=c,(c+-65536|0)>>>0<1048576):0){a=4;return a|0}}}k[a>>2]=l[b>>0]|0|1114112;a=1;return a|0}function cf(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,l=0,n=0,o=0,p=0;if((d|c|0)==0|(b|0)==0)return;h=c+16|0;i=1<<d+2;l=(1<<d)+65535|0;n=0;do{if((k[a+(n<<5)+4>>2]|0)>0?(m[a+(n<<5)+8>>1]|0)>127:0){g=a+(n<<5)+10|0;f=j[g>>1]|0;c=f&65535;if((f&65535)<16){c=c+1|0;f=a+(n<<5)+24|0}else{f=a+(n<<5)+24|0;o=k[f>>2]|0;e=o>>>24;c=(o&16777215)+13+(c+-12-(e<<1)<<e)|0}e=c+-1|0;if((h|0)<(c|0)){c=e-h+i|0;if(!c)e=-2;else e=((ja(c|0)|0)^31)+-1|0;p=c>>>e&1;o=e-d|0;j[g>>1]=(c&l)+h+(((o<<1)+-2|p)<<d);c=c-((p|2)<<e)>>d|o<<24}else{j[g>>1]=e;c=0}k[f>>2]=c}n=n+1|0}while((n|0)!=(b|0));return}function df(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0;k[a>>2]=k[b>>2];k[a+4>>2]=k[b+4>>2];k[a+8>>2]=k[b+8>>2];k[a+12>>2]=k[b+12>>2];k[a+16>>2]=k[b+16>>2];b=a+24|0;j=og(36)|0;c=j;d=j;e=d+36|0;do{k[d>>2]=0;d=d+4|0}while((d|0)<(e|0));k[b>>2]=c;k[a+32>>2]=0;f=a+36|0;k[f>>2]=0;g=a+40|0;k[g>>2]=0;h=a+52|0;b=a+4|0;k[h>>2]=0;k[h+4>>2]=0;k[h+8>>2]=0;k[h+12>>2]=0;k[h+16>>2]=0;d=a+90|0;e=d+10|0;do{i[d>>0]=0;d=d+1|0}while((d|0)<(e|0));e=k[b>>2]|0;e=(e|0)>0?e:0;k[b>>2]=e;b=a+8|0;c=k[b>>2]|0;if((c|0)>=16)if((c|0)>24){k[b>>2]=24;d=24}else d=c;else{k[b>>2]=16;d=16}b=a+12|0;c=k[b>>2]|0;if(!c){k[b>>2]=16;if((e|0)>8)if((d|0)>16){c=(d|0)<21?d:21;k[b>>2]=c;b=c;c=10}else{b=16;c=10}else{b=16;c=11}}else{c=k[((c|0)>16?b:2088)>>2]|0;c=(c|0)<24?c:24;k[b>>2]=c;b=c;c=10}if((c|0)==10)if((e|0)<10)c=11;if((c|0)==11){i[a+16>>0]=0;i[a+17>>0]=0;i[a+18>>0]=1;i[a+19>>0]=0}k[a+20>>2]=(1<<d)+-16;l=d+1|0;c=b+1|0;l=(l|0)<(c|0)?c:l;c=og(20)|0;k[c>>2]=l;l=1<<l;k[c+4>>2]=l+-1;b=1<<b;k[c+8>>2]=b;k[c+12>>2]=0;l=b+l|0;m=qg((l|0)<-3?-1:l+3|0)|0;k[c+16>>2]=m;i[m+l>>0]=0;i[m+(l+1)>>0]=0;i[m+(l+2)>>0]=0;k[f>>2]=c;if((e|0)>9){k[a+44>>2]=b+-1;m=qg(b>>>0>1073741823?-1:b<<2)|0;k[g>>2]=m}m=(b|0)>262144?b:262144;k[a+48>>2]=m;m=qg(m>>>0>134217727?-1:m<<5)|0;k[h>>2]=m;if((d|0)==16){c=1;b=0}else{c=4;b=((d<<1)+222|1)&255}i[a+88>>0]=b;i[a+89>>0]=c;k[a+72>>2]=4;k[a+76>>2]=11;k[a+80>>2]=15;k[a+84>>2]=16;switch(e|0){case 1:case 0:{k[a+28>>2]=1;b=1;break}case 3:case 2:{k[a+28>>2]=2;b=2;break}case 4:{k[a+28>>2]=3;b=3;break}case 6:case 5:{k[a+28>>2]=4;b=4;break}case 7:{k[a+28>>2]=5;b=5;break}case 8:{k[a+28>>2]=6;b=6;break}case 9:{k[a+28>>2]=7;b=7;break}default:{b=(k[a>>2]|0)==0?8:9;k[a+28>>2]=b}}lf(j,b);if(k[a>>2]|0)return;if(!(i[a+16>>0]|0))return;b=(i[a+17>>0]|0)!=0;if(!(k[521]|0)){m=og(40)|0;k[m>>2]=0;k[m+4>>2]=0;k[m+8>>2]=0;k[m+12>>2]=0;o[m+16>>2]=1.0;l=m+20|0;k[l>>2]=0;k[l+4>>2]=0;k[l+8>>2]=0;k[l+12>>2]=0;o[m+36>>2]=1.0;k[521]=m;mf(m,b)}b=k[(k[a+24>>2]|0)+28>>2]|0;if(!b)return;k[b+33619976>>2]=k[521];return}function ef(a){a=a|0;var b=0,c=0;c=a+96|0;b=k[c>>2]|0;k[c>>2]=0;if(b)sg(b);c=a+52|0;b=k[c>>2]|0;k[c>>2]=0;if(b)sg(b);c=a+40|0;b=k[c>>2]|0;k[c>>2]=0;if(b)sg(b);c=a+36|0;b=k[c>>2]|0;k[c>>2]=0;if(b){c=k[b+16>>2]|0;if(c)sg(c);rg(b)}a=a+24|0;b=k[a>>2]|0;k[a>>2]=0;if(!b)return;nf(b);rg(b);return}function ff(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;A=r;r=r+16|0;m=A;q=a+32|0;f=k[q>>2]|0;v=a+68|0;g=k[v>>2]|0;w=f-g|0;s=k[a+36>>2]|0;z=k[s+16>>2]|0;s=k[s+4>>2]|0;t=a+12|0;if(w>>>0>1<<k[t>>2]>>>0){a=0;r=A;return a|0}u=a+19|0;if(!(i[u>>0]|0))p=0;else{l=s&g;if((f|0)==(g|0))h=0.0;else{g=0;f=0;do{p=bf(m,z+(g+l)|0,w-g|0)|0;g=p+g|0;f=((k[m>>2]|0)<1114112?p:0)+f|0}while(g>>>0<w>>>0);h=+(f>>>0)}p=h>+(w>>>0)*.75}o=a+40|0;g=k[o>>2]|0;do if(g){l=k[v>>2]|0;f=a+44|0;m=k[f>>2]|0;if(p){Mf(l,w,s,m,z,g);break}else{Nf(l,w,s,m,z,g);break}}else f=a+44|0;while(0);l=a+60|0;m=a+56|0;n=a+52|0;jd(w,k[v>>2]|0,z,s,k[o>>2]|0,k[f>>2]|0,k[a+20>>2]|0,(i[u>>0]|0)!=0?8.115:4.0,k[a+4>>2]|0,k[a+24>>2]|0,k[a+28>>2]|0,a+72|0,l,(k[n>>2]|0)+(k[m>>2]<<5)|0,m);if((!(b|c)?(x=1<<k[t>>2],((x>>>1)+(k[m>>2]|0)|0)>>>0<(k[a+48>>2]|0)>>>0):0)?(y=k[q>>2]|0,(y+x|0)>>>0<=(s+1+(k[a+64>>2]|0)|0)>>>0):0){k[v>>2]=y;k[d>>2]=0;a=1;r=A;return a|0}g=k[l>>2]|0;if((g|0)>0){do if((g|0)>=6){if((g|0)<130){c=g+-2|0;f=((ja(c|0)|0)^31)+-1|0;f=(c>>f)+2+(f<<1)|0;break}if((g|0)<2114){f=((ja(g+-66|0)|0)^31)+10|0;break}if((g|0)<6210)f=21;else f=(g|0)<22594?22:23}else f=g;while(0);x=g-(k[2188+(f<<2)>>2]|0)|0;y=(f<<3&56|k[2284+((f>>3)*3<<2)>>2]<<6|2)&65535;w=hi(k[2092+(f<<2)>>2]|0,0,48)|0;c=k[m>>2]|0;k[m>>2]=c+1;z=k[n>>2]|0;k[z+(c<<5)>>2]=g;k[z+(c<<5)+4>>2]=0;j[z+(c<<5)+8>>1]=y;j[z+(c<<5)+10>>1]=16;y=z+(c<<5)+16|0;k[y>>2]=x|w;k[y+4>>2]=((x|0)<0)<<31>>31|L;k[z+(c<<5)+24>>2]=0;k[l>>2]=0}a=gf(a,b,p,d,e)|0;r=A;return a|0}function gf(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,m=0.0,n=0.0,q=0,s=0,t=0.0,u=0.0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;J=r;r=r+1056|0;I=J+16|0;G=J+24|0;H=J;B=a+32|0;s=k[B>>2]|0;D=a+64|0;w=k[D>>2]|0;E=s-w|0;C=k[a+36>>2]|0;F=k[C+16>>2]|0;C=k[C+4>>2]|0;g=(E<<1)+500|0;h=a+92|0;if((k[h>>2]|0)>>>0<g>>>0){A=qg(g)|0;f=a+96|0;j=k[f>>2]|0;k[f>>2]=A;if(j)sg(j);k[h>>2]=g}else f=a+96|0;x=k[f>>2]|0;y=a+88|0;i[x>>0]=i[y>>0]|0;z=a+89|0;k[I>>2]=l[z>>0];A=a+56|0;g=k[A>>2]|0;if(g>>>0<((E>>>8)+2|0)>>>0){if((g|0)>0){h=k[a+52>>2]|0;j=0;f=0;do{f=(k[h+(j<<5)>>2]|0)+f|0;j=j+1|0}while((j|0)<(g|0))}else f=0;m=+(E>>>0);if(+(f|0)>m*.99){gi(G|0,0,1024)|0;if((i[200]|0)==0?(Ga(200)|0)!=0:0){p[26]=m*7.92/13.0;sb(200)}f=k[D>>2]|0;g=k[B>>2]|0;if(f>>>0<g>>>0)do{q=G+(l[F+(f&C)>>0]<<2)|0;k[q>>2]=(k[q>>2]|0)+1;f=f+13|0}while(f>>>0<g>>>0);q=G+1024|0;j=G;m=0.0;f=0;do{g=k[j>>2]|0;v=+(g|0);if((g|0)<256)u=+o[4036+(g<<2)>>2];else u=+oh(v);h=k[j+4>>2]|0;j=j+8|0;f=g+f+h|0;t=+(h|0);if((h|0)<256)n=+o[4036+(h<<2)>>2];else n=+oh(t);m=m-v*u-t*n}while(j>>>0<q>>>0);t=+(f|0);if(f){if((f|0)<256)n=+o[4036+(f<<2)>>2];else n=+oh(t);m=m+t*n}f=(m<t?t:m)>+p[26]}else f=0}else f=0;a:do if((s|0)==(w|0))if(De(b,0,I,x)|0){k[I>>2]=(k[I>>2]|0)+7&-8;break}else{a=0;r=J;return a|0}else{if(f){if(Se(b,F,k[D>>2]|0,C,E,I,x)|0)break;else f=0;r=J;return f|0}h=a+72|0;k[H>>2]=k[h>>2];k[H+4>>2]=k[h+4>>2];k[H+8>>2]=k[h+8>>2];k[H+12>>2]=k[h+12>>2];j=a+4|0;if((k[j>>2]|0)>9?(k[a>>2]|0)==1:0){cf(k[a+52>>2]|0,k[A>>2]|0,12,1);q=1;s=12}else{q=0;s=0}f=c?2:3;gi(G|0,0,144)|0;g=k[D>>2]|0;if(!(i[a+18>>0]|0))Of(F,g,C,i[a+90>>0]|0,i[a+91>>0]|0,k[a+52>>2]|0,k[A>>2]|0,f,(i[a+19>>0]|0)!=0,G);else Pf(F,g,C,k[a+52>>2]|0,k[A>>2]|0,G);if((k[j>>2]|0)>2)Qf(s,q,G);do if(Re(F,k[D>>2]|0,E,C,i[a+90>>0]|0,i[a+91>>0]|0,b,s,q,f,k[a+52>>2]|0,k[A>>2]|0,G,I,x)|0){if((E+4|0)>>>0<k[I>>2]>>3>>>0?(k[h>>2]=k[H>>2],k[h+4>>2]=k[H+4>>2],k[h+8>>2]=k[H+8>>2],k[h+12>>2]=k[H+12>>2],i[x>>0]=i[y>>0]|0,k[I>>2]=l[z>>0],!(Se(b,F,k[D>>2]|0,C,E,I,x)|0)):0)break;of(G);break a}while(0);of(G);a=0;r=J;return a|0}while(0);H=k[I>>2]|0;I=H>>3;i[y>>0]=i[x+I>>0]|0;i[z>>0]=H&7;H=k[B>>2]|0;k[D>>2]=H;k[a+68>>2]=H;i[a+90>>0]=i[F+(H+-1&C)>>0]|0;i[a+91>>0]=i[F+(H+-2&C)>>0]|0;k[A>>2]=0;k[e>>2]=x;k[d>>2]=I;a=1;r=J;return a|0}function hf(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;j=r;r=r+160|0;h=j+136|0;i=j+16|0;f=j+120|0;g=j;if(!(k[d>>2]|0)){i=0;r=j;return i|0};k[h>>2]=k[a>>2];k[h+4>>2]=k[a+4>>2];k[h+8>>2]=k[a+8>>2];k[h+12>>2]=k[a+12>>2];k[h+16>>2]=k[a+16>>2];df(i,h);bg(f,c,b);$f(g,e,k[d>>2]|0);k[h>>2]=k[a>>2];k[h+4>>2]=k[a+4>>2];k[h+8>>2]=k[a+8>>2];k[h+12>>2]=k[a+12>>2];k[h+16>>2]=k[a+16>>2];if(!(jf(h,f,g)|0))e=0;else{k[d>>2]=k[g+12>>2];e=1}ef(i);i=e;r=j;return i|0}function jf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0;i=r;r=r+128|0;g=i+108|0;e=i+104|0;f=i;h=i+4|0;k[e>>2]=0;k[g>>2]=k[a>>2];k[g+4>>2]=k[a+4>>2];k[g+8>>2]=k[a+8>>2];k[g+12>>2]=k[a+12>>2];k[g+16>>2]=k[a+16>>2];df(h,g);while(1){if(!(kf(b,h)|0))d=1;else d=(Pb[k[(k[b>>2]|0)+8>>2]&15](b,0,g)|0)==0;k[e>>2]=0;if(!(ff(h,d,0,e,f)|0)){a=0;d=8;break}a=k[e>>2]|0;if(!a)if(d){a=1;d=8;break}else continue;else{a=(Pb[k[(k[c>>2]|0)+8>>2]&15](c,k[f>>2]|0,a)|0)^1;if(d|a){a=a&1^1;d=8;break}else continue}}if((d|0)==8){ef(h);r=i;return a|0}return 0}function kf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0;u=r;r=r+16|0;q=u+4|0;s=u;n=1<<k[b+12>>2];k[q>>2]=0;l=Pb[k[(k[a>>2]|0)+8>>2]&15](a,n,q)|0;if(!l){t=0;r=u;return t|0}m=k[q>>2]|0;p=b+36|0;f=k[p>>2]|0;g=f+12|0;h=k[f+4>>2]&k[g>>2];j=f+8|0;c=k[j>>2]|0;if(c>>>0>h>>>0){o=f+16|0;c=c-h|0;ki((k[o>>2]|0)+((1<<k[f>>2])+h)|0,l|0,(c>>>0<m>>>0?c:m)|0)|0;c=o}else c=f+16|0;d=1<<k[f>>2];e=(k[c>>2]|0)+h|0;if((h+m|0)>>>0>d>>>0){o=(k[j>>2]|0)+(d-h)|0;ki(e|0,l|0,(o>>>0<m>>>0?o:m)|0)|0;o=(1<<k[f>>2])-h|0;ki(k[c>>2]|0,l+o|0,m-o|0)|0}else ki(e|0,l|0,m|0)|0;k[g>>2]=(k[g>>2]|0)+m;o=b+32|0;k[o>>2]=(k[o>>2]|0)+m;c=k[p>>2]|0;d=k[c+12>>2]|0;if(d>>>0<=(k[c+4>>2]|0)>>>0){m=(k[c+16>>2]|0)+d|0;i[m>>0]=0;i[m+1>>0]=0;i[m+2>>0]=0}c=k[q>>2]|0;if((n|0)==(c|0)){t=n;r=u;return t|0}m=n-c|0;while(1){k[s>>2]=0;f=Pb[k[(k[a>>2]|0)+8>>2]&15](a,m,s)|0;if(!f)break;g=k[s>>2]|0;h=k[p>>2]|0;j=h+12|0;l=k[h+4>>2]&k[j>>2];b=h+8|0;c=k[b>>2]|0;if(c>>>0>l>>>0){n=h+16|0;c=c-l|0;ki((k[n>>2]|0)+((1<<k[h>>2])+l)|0,f|0,(c>>>0<g>>>0?c:g)|0)|0;c=n}else c=h+16|0;d=1<<k[h>>2];e=(k[c>>2]|0)+l|0;if((l+g|0)>>>0>d>>>0){n=(k[b>>2]|0)+(d-l)|0;ki(e|0,f|0,(n>>>0<g>>>0?n:g)|0)|0;n=(1<<k[h>>2])-l|0;ki(k[c>>2]|0,f+n|0,g-n|0)|0}else ki(e|0,f|0,g|0)|0;k[j>>2]=(k[j>>2]|0)+g;k[o>>2]=(k[o>>2]|0)+g;c=k[p>>2]|0;d=k[c+12>>2]|0;if(d>>>0<=(k[c+4>>2]|0)>>>0){n=(k[c+16>>2]|0)+d|0;i[n>>0]=0;i[n+1>>0]=0;i[n+2>>0]=0}d=k[s>>2]|0;c=(k[q>>2]|0)+d|0;k[q>>2]=c;if((m|0)==(d|0)){t=23;break}else m=m-d|0}if((t|0)==23){r=u;return c|0}t=k[q>>2]|0;r=u;return t|0}function lf(a,b){a=a|0;b=b|0;var c=0,d=0;do switch(b|0){case 1:{c=og(262156)|0;gi(c|0,0,262156)|0;b=k[a>>2]|0;k[a>>2]=c;if(!b)return;rg(b);return}case 2:{d=og(524312)|0;gi(d|0,0,524312)|0;c=a+4|0;b=k[c>>2]|0;k[c>>2]=d;if(!b)return;rg(b);return}case 3:{c=og(1081356)|0;k[c+1081352>>2]=0;gi(c|0,0,32768)|0;k[c+1081344>>2]=0;k[c+1081348>>2]=0;d=a+8|0;b=k[d>>2]|0;k[d>>2]=c;if(!b)return;rg(b);return}case 4:{c=og(2129932)|0;k[c+2129928>>2]=0;gi(c|0,0,32768)|0;k[c+2129920>>2]=0;k[c+2129924>>2]=0;d=a+12|0;b=k[d>>2]|0;k[d>>2]=c;if(!b)return;rg(b);return}case 5:{c=og(8454156)|0;k[c+8454152>>2]=0;gi(c|0,0,65536)|0;k[c+8454144>>2]=0;k[c+8454148>>2]=0;d=a+16|0;b=k[d>>2]|0;k[d>>2]=c;if(!b)return;rg(b);return}case 6:{c=og(16842764)|0;k[c+16842760>>2]=0;gi(c|0,0,65536)|0;k[c+16842752>>2]=0;k[c+16842756>>2]=0;d=a+20|0;b=k[d>>2]|0;k[d>>2]=c;if(!b)return;rg(b);return}case 7:{c=og(33619980)|0;k[c+33619976>>2]=0;gi(c|0,0,65536)|0;k[c+33619968>>2]=0;k[c+33619972>>2]=0;d=a+24|0;b=k[d>>2]|0;k[d>>2]=c;if(!b)return;rg(b);return}case 8:{c=og(33619980)|0;k[c+33619976>>2]=0;gi(c|0,0,65536)|0;k[c+33619968>>2]=0;k[c+33619972>>2]=0;d=a+28|0;b=k[d>>2]|0;k[d>>2]=c;if(!b)return;rg(b);return}case 9:{c=og(33619980)|0;k[c+33619976>>2]=0;gi(c|0,0,65536)|0;k[c+33619968>>2]=0;k[c+33619972>>2]=0;d=a+32|0;b=k[d>>2]|0;k[d>>2]=c;if(!b)return;rg(b);return}default:return}while(0)}function mf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0;n=r;r=r+16|0;m=n;l=m+4|0;j=b?120:0;while(1){f=24;do{d=k[2320+(f<<2)>>2]|0;c=1<<d;d=j<<d;b=k[2420+(f<<2)>>2]|0;g=c;do{h=g;g=g+-1|0;e=g+d|0;pf(m,2520+(((e|0)/(c|0)|0)*12|0)|0,195347+((ha((e|0)%(c|0)|0,f)|0)+b)|0,f);o=i[m>>0]|0;if(((o&1)==0?(o&255)>>>1:k[l>>2]|0)>>>0>3)qf(a,m,f,e);bi(m)}while((h|0)>1);f=f+-1|0}while((f|0)>3);if((j|0)>0)j=j+-1|0;else break}r=n;return}function nf(a){a=a|0;var b=0,c=0;c=a+32|0;b=k[c>>2]|0;k[c>>2]=0;if(b)rg(b);c=a+28|0;b=k[c>>2]|0;k[c>>2]=0;if(b)rg(b);c=a+24|0;b=k[c>>2]|0;k[c>>2]=0;if(b)rg(b);c=a+20|0;b=k[c>>2]|0;k[c>>2]=0;if(b)rg(b);c=a+16|0;b=k[c>>2]|0;k[c>>2]=0;if(b)rg(b);c=a+12|0;b=k[c>>2]|0;k[c>>2]=0;if(b)rg(b);c=a+8|0;b=k[c>>2]|0;k[c>>2]=0;if(b)rg(b);c=a+4|0;b=k[c>>2]|0;k[c>>2]=0;if(b)rg(b);b=k[a>>2]|0;k[a>>2]=0;if(!b)return;rg(b);return}function of(a){a=a|0;var b=0,c=0,d=0,e=0;b=k[a+132>>2]|0;c=b;if(b){d=a+136|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~(((e+-2096-c|0)>>>0)/2096|0)*2096|0);rg(b)}b=k[a+120>>2]|0;c=b;if(b){d=a+124|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~(((e+-2832-c|0)>>>0)/2832|0)*2832|0);rg(b)}b=k[a+108>>2]|0;c=b;if(b){d=a+112|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~(((e+-1040-c|0)>>>0)/1040|0)*1040|0);rg(b)}b=k[a+96>>2]|0;c=b;if(b){d=a+100|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}b=k[a+84>>2]|0;c=b;if(b){d=a+88|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}b=k[a+72>>2]|0;c=b;if(b){d=a+76|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}b=k[a+60>>2]|0;c=b;if(b){d=a+64|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}b=k[a+44>>2]|0;c=b;if(b){d=a+48|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}b=k[a+32>>2]|0;c=b;if(b){d=a+36|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}b=k[a+16>>2]|0;c=b;if(b){d=a+20|0;e=k[d>>2]|0;if((e|0)!=(b|0))k[d>>2]=e+(~((e+-4-c|0)>>>2)<<2);rg(b)}d=k[a+4>>2]|0;if(!d)return;b=a+8|0;c=k[b>>2]|0;if((c|0)!=(d|0))k[b>>2]=c+(~((c+-4-d|0)>>>2)<<2);rg(d);return}function pf(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,m=0,n=0,o=0,p=0;p=r;r=r+48|0;m=p+24|0;j=p+12|0;o=p;n=k[b>>2]|0;ai(a,n,kh(n)|0);n=b+4|0;e=k[n>>2]|0;f=(e|0)<10?e:0;g=d-f|0;a:do if((g|0)>0){if((e|0)>11){d=e+-11|0;if((g|0)<=(d|0))break;f=c+d|0;h=c+g|0;c=h-f|0;if(c>>>0>4294967279)lg(m);if(c>>>0<11){i[m>>0]=c<<1;e=m+1|0}else{n=c+16&-16;e=og(n)|0;k[m+8>>2]=e;k[m>>2]=n|1;k[m+4>>2]=c}if((d|0)!=(g|0)){g=e;while(1){i[g>>0]=i[f>>0]|0;f=f+1|0;if((f|0)==(h|0))break;else g=g+1|0}e=e+c|0}i[e>>0]=0;n=i[m>>0]|0;j=(n&1)==0;ci(a,j?m+1|0:k[m+8>>2]|0,j?(n&255)>>>1:k[m+4>>2]|0)|0;bi(m);break}h=c+g|0;if(g>>>0<11){i[j>>0]=g<<1;e=j+1|0}else{m=g+16&-16;e=og(m)|0;k[j+8>>2]=e;k[j>>2]=m|1;k[j+4>>2]=g}if((f|0)!=(d|0)){f=c;d=e;while(1){i[d>>0]=i[f>>0]|0;f=f+1|0;if((f|0)==(h|0))break;else d=d+1|0}e=e+g|0}i[e>>0]=0;e=i[j>>0]|0;m=(e&1)==0;ci(a,m?j+1|0:k[j+8>>2]|0,m?(e&255)>>>1:k[j+4>>2]|0)|0;bi(j);e=i[a>>0]|0;if(!(e&1)){e=(e&255)>>>1;h=a+1|0}else{e=k[a+4>>2]|0;h=k[a+8>>2]|0}d=e-g|0;f=h+d|0;switch(k[n>>2]|0){case 10:{e=i[f>>0]|0;if((g|0)==1|(e&255)<192){if((e+-97&255)>=26)break a;i[f>>0]=e&255^32;break a}if((e&255)<224){n=h+(d+1)|0;i[n>>0]=(l[n>>0]|0)^32;break a}if((g|0)==2)break a;n=h+(d+2)|0;i[n>>0]=(l[n>>0]|0)^5;break a}case 11:break;default:break a}while(1){e=i[f>>0]|0;do if((g|0)==1|(e&255)<192)if((e+-97&255)<26){i[f>>0]=e&255^32;e=1}else e=1;else{if((e&255)<224){e=f+1|0;i[e>>0]=(l[e>>0]|0)^32;e=2;break}if((g|0)==2)e=2;else{e=f+2|0;i[e>>0]=(l[e>>0]|0)^5;e=3}}while(0);g=g-e|0;if((g|0)<=0)break;else f=f+e|0}}while(0);b=k[b+8>>2]|0;ai(o,b,kh(b)|0);b=i[o>>0]|0;n=(b&1)==0;ci(a,n?o+1|0:k[o+8>>2]|0,n?(b&255)>>>1:k[o+4>>2]|0)|0;bi(o);r=p;return}function qf(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,m=0;m=r;r=r+16|0;j=m;d=(d<<6)+c|0;e=rf(a,b)|0;if((e|0)!=0?(d|0)>=(k[e+20>>2]|0):0){r=m;return}c=sf(a,b)|0;k[c>>2]=d;k[j>>2]=0;d=i[b>>0]|0;c=(d&1)==0;e=b+4|0;d=c?(d&255)>>>1:k[e>>2]|0;c=c?b+1|0:k[b+8>>2]|0;if((((d|0)!=0?(f=i[c>>0]|0,k[j>>2]=f,d>>>0>1):0)?(g=(i[c+1>>0]<<8)+f|0,k[j>>2]=g,d>>>0>2):0)?(h=(i[c+2>>0]<<16)+g|0,k[j>>2]=h,d>>>0>3):0)k[j>>2]=(l[c+3>>0]<<24)+h;c=a+20|0;a=tf(c,j)|0;d=i[b>>0]|0;d=(d&1)==0?(d&255)>>>1:k[e>>2]|0;if((k[a>>2]|0)>>>0>=d>>>0){r=m;return}j=tf(c,j)|0;k[j>>2]=d;r=m;return}function rf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,m=0,n=0;m=i[b>>0]|0;j=(m&1)==0;n=j?b+1|0:k[b+8>>2]|0;m=j?(m&255)>>>1:k[b+4>>2]|0;if(m>>>0>3){c=m;d=n;b=m;while(1){j=ha(l[d>>0]|l[d+1>>0]<<8|l[d+2>>0]<<16|l[d+3>>0]<<24,1540483477)|0;b=(ha(j>>>24^j,1540483477)|0)^(ha(b,1540483477)|0);c=c+-4|0;if(c>>>0<=3)break;else d=d+4|0}c=m+-4|0;d=c&-4;c=c-d|0;d=n+(d+4)|0}else{c=m;d=n;b=m}switch(c|0){case 3:{e=l[d+2>>0]<<16^b;h=6;break}case 2:{e=b;h=6;break}case 1:{f=b;h=7;break}default:g=b}if((h|0)==6){f=l[d+1>>0]<<8^e;h=7}if((h|0)==7)g=ha(l[d>>0]^f,1540483477)|0;b=ha(g>>>13^g,1540483477)|0;b=b>>>15^b;f=k[a+4>>2]|0;if(!f){n=0;return n|0}g=f+-1|0;c=(g&f|0)==0;if(c)j=b&g;else j=(b>>>0)%(f>>>0)|0;b=k[(k[a>>2]|0)+(j<<2)>>2]|0;if(!b){n=0;return n|0}b=k[b>>2]|0;if(!b){n=0;return n|0}h=(m|0)==0;if(c){a:while(1){if((k[b+4>>2]&g|0)!=(j|0)){b=0;h=31;break}c=b+8|0;a=i[c>>0]|0;d=(a&1)==0;b:do if(((d?(a&255)>>>1:k[b+12>>2]|0)|0)==(m|0)){c=d?c+1|0:k[b+16>>2]|0;if(!d)if(!(mh(c,n,m)|0)){h=31;break a}else break;if(h){h=31;break a}else{e=m;d=n}while(1){if((i[c>>0]|0)!=(i[d>>0]|0))break b;e=e+-1|0;if(!e){h=31;break a}else{c=c+1|0;d=d+1|0}}}while(0);b=k[b>>2]|0;if(!b){b=0;h=31;break}}if((h|0)==31)return b|0}else{c:while(1){if((((k[b+4>>2]|0)>>>0)%(f>>>0)|0|0)!=(j|0)){b=0;h=31;break}c=b+8|0;a=i[c>>0]|0;d=(a&1)==0;d:do if(((d?(a&255)>>>1:k[b+12>>2]|0)|0)==(m|0)){c=d?c+1|0:k[b+16>>2]|0;if(!d)if(!(mh(c,n,m)|0)){h=31;break c}else break;if(h){h=31;break c}else{e=m;d=n}while(1){if((i[c>>0]|0)!=(i[d>>0]|0))break d;e=e+-1|0;if(!e){h=31;break c}else{c=c+1|0;d=d+1|0}}}while(0);b=k[b>>2]|0;if(!b){b=0;h=31;break}}if((h|0)==31)return b|0}return 0}function sf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;e=r;r=r+16|0;c=e;d=rf(a,b)|0;if(d){a=d;a=a+20|0;r=e;return a|0}d=og(24)|0;$h(d+8|0,b);k[d+20>>2]=0;xf(c,a,d);a=k[c>>2]|0;a=a+20|0;r=e;return a|0}function tf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0;i=r;r=r+16|0;h=i;f=k[b>>2]|0;d=k[a+4>>2]|0;a:do if(d){e=d+-1|0;c=(e&d|0)==0;if(c)g=e&f;else g=(f>>>0)%(d>>>0)|0;b=k[(k[a>>2]|0)+(g<<2)>>2]|0;if(b)if(c){do{b=k[b>>2]|0;if(!b)break a;if((k[b+4>>2]&e|0)!=(g|0))break a}while((k[b+8>>2]|0)!=(f|0));a=b+12|0;r=i;return a|0}else{do{b=k[b>>2]|0;if(!b)break a;if((((k[b+4>>2]|0)>>>0)%(d>>>0)|0|0)!=(g|0))break a}while((k[b+8>>2]|0)!=(f|0));a=b+12|0;r=i;return a|0}}while(0);g=og(16)|0;k[g+8>>2]=f;k[g+12>>2]=0;uf(h,a,g);a=k[h>>2]|0;a=a+12|0;r=i;return a|0}function uf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0.0,h=0.0,j=0,l=0,m=0,n=0,p=0,q=0,r=0;l=k[c+8>>2]|0;r=c+4|0;k[r>>2]=l;q=b+4|0;j=k[q>>2]|0;p=(j|0)==0;a:do if(!p){m=j+-1|0;n=(m&j|0)==0;if(n)e=m&l;else e=(l>>>0)%(j>>>0)|0;d=k[(k[b>>2]|0)+(e<<2)>>2]|0;if(d){while(1){d=k[d>>2]|0;if(!d)break a;f=k[d+4>>2]|0;if(n)f=f&m;else f=(f>>>0)%(j>>>0)|0;if((f|0)!=(e|0))break a;if((k[d+8>>2]|0)==(l|0)){e=0;break}}b=d;k[a>>2]=b;a=a+4|0;i[a>>0]=e;return}}else e=0;while(0);l=b+12|0;g=+(((k[l>>2]|0)+1|0)>>>0);h=+o[b+16>>2];do if(p|g>+(j>>>0)*h){if(j>>>0>2)d=(j+-1&j|0)==0;else d=0;f=(d&1|j<<1)^1;d=~~+ga(+(g/h))>>>0;vf(b,f>>>0<d>>>0?d:f);f=k[q>>2]|0;d=k[r>>2]|0;e=f+-1|0;if(!(e&f)){j=f;e=e&d;break}else{j=f;e=(d>>>0)%(f>>>0)|0;break}}while(0);d=k[(k[b>>2]|0)+(e<<2)>>2]|0;if(!d){d=b+8|0;k[c>>2]=k[d>>2];k[d>>2]=c;k[(k[b>>2]|0)+(e<<2)>>2]=d;d=k[c>>2]|0;if(d){d=k[d+4>>2]|0;e=j+-1|0;if(!(e&j))d=d&e;else d=(d>>>0)%(j>>>0)|0;k[(k[b>>2]|0)+(d<<2)>>2]=c}}else{k[c>>2]=k[d>>2];k[d>>2]=c}k[l>>2]=(k[l>>2]|0)+1;b=1;k[a>>2]=c;a=a+4|0;i[a>>0]=b;return}function vf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;if((b|0)!=1){if(b+-1&b)b=Zh(b)|0}else b=2;e=k[a+4>>2]|0;if(b>>>0>e>>>0){wf(a,b);return}if(b>>>0>=e>>>0)return;if(e>>>0>2)d=(e+-1&e|0)==0;else d=0;c=~~+ga(+(+((k[a+12>>2]|0)>>>0)/+o[a+16>>2]))>>>0;if(d)c=1<<32-(ja(c+-1|0)|0);else c=Zh(c)|0;b=b>>>0<c>>>0?c:b;if(b>>>0>=e>>>0)return;wf(a,b);return}function wf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;d=a+4|0;if(!b){c=k[a>>2]|0;k[a>>2]=0;if(c)rg(c);k[d>>2]=0;return}m=og(b<<2)|0;c=k[a>>2]|0;k[a>>2]=m;if(c)rg(c);k[d>>2]=b;c=0;do{k[(k[a>>2]|0)+(c<<2)>>2]=0;c=c+1|0}while((c|0)!=(b|0));d=a+8|0;f=k[d>>2]|0;if(!f)return;c=k[f+4>>2]|0;l=b+-1|0;m=(l&b|0)==0;if(m)e=c&l;else e=(c>>>0)%(b>>>0)|0;k[(k[a>>2]|0)+(e<<2)>>2]=d;c=k[f>>2]|0;if(!c)return;else{g=f;d=f}a:while(1){j=g;i=d;b:while(1){while(1){d=k[c+4>>2]|0;if(m)h=d&l;else h=(d>>>0)%(b>>>0)|0;if((h|0)==(e|0)){d=c;break}d=(k[a>>2]|0)+(h<<2)|0;if(!(k[d>>2]|0)){e=h;f=c;c=i;break b}g=c+8|0;d=c;while(1){f=k[d>>2]|0;if(!f)break;if((k[g>>2]|0)==(k[f+8>>2]|0))d=f;else break}k[i>>2]=f;k[d>>2]=k[k[(k[a>>2]|0)+(h<<2)>>2]>>2];k[k[(k[a>>2]|0)+(h<<2)>>2]>>2]=c;c=k[j>>2]|0;if(!c){c=27;break a}}c=k[d>>2]|0;if(!c){c=27;break a}else{j=d;i=d}}k[d>>2]=c;c=k[f>>2]|0;if(!c){c=27;break}else{g=f;d=f}}if((c|0)==27)return}function xf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0.0,j=0.0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;w=c+8|0;v=i[w>>0]|0;u=(v&1)==0;w=u?w+1|0:k[c+16>>2]|0;v=u?(v&255)>>>1:k[c+12>>2]|0;if(v>>>0>3){f=v;g=w;e=v;while(1){u=ha(l[g>>0]|l[g+1>>0]<<8|l[g+2>>0]<<16|l[g+3>>0]<<24,1540483477)|0;e=(ha(u>>>24^u,1540483477)|0)^(ha(e,1540483477)|0);f=f+-4|0;if(f>>>0<=3)break;else g=g+4|0}f=v+-4|0;g=f&-4;f=f-g|0;g=w+(g+4)|0}else{f=v;g=w;e=v}switch(f|0){case 3:{e=l[g+2>>0]<<16^e;m=6;break}case 2:{m=6;break}case 1:{m=7;break}default:{}}if((m|0)==6){e=l[g+1>>0]<<8^e;m=7}if((m|0)==7)e=ha(l[g>>0]^e,1540483477)|0;e=ha(e>>>13^e,1540483477)|0;e=e>>>15^e;u=c+4|0;k[u>>2]=e;t=b+4|0;g=k[t>>2]|0;s=(g|0)==0;a:do if(!s){q=g+-1|0;r=(q&g|0)==0;if(r)e=e&q;else e=(e>>>0)%(g>>>0)|0;f=k[(k[b>>2]|0)+(e<<2)>>2]|0;if((f|0)!=0?(d=k[f>>2]|0,(d|0)!=0):0){p=(v|0)==0;b:while(1){f=k[d+4>>2]|0;if(r)f=f&q;else f=(f>>>0)%(g>>>0)|0;if((f|0)!=(e|0))break a;f=d+8|0;n=i[f>>0]|0;m=(n&1)==0;c:do if(((m?(n&255)>>>1:k[d+12>>2]|0)|0)==(v|0)){f=m?f+1|0:k[d+16>>2]|0;if(!m)if(!(mh(f,w,v)|0)){e=0;m=40;break b}else break;if(p){e=0;m=40;break b}else{n=v;m=w}while(1){if((i[f>>0]|0)!=(i[m>>0]|0))break c;n=n+-1|0;if(!n){e=0;m=40;break b}else{f=f+1|0;m=m+1|0}}}while(0);d=k[d>>2]|0;if(!d)break a}if((m|0)==40){b=d;k[a>>2]=b;a=a+4|0;i[a>>0]=e;return}}}else e=0;while(0);m=b+12|0;h=+(((k[m>>2]|0)+1|0)>>>0);j=+o[b+16>>2];do if(s|h>+(g>>>0)*j){if(g>>>0>2)d=(g+-1&g|0)==0;else d=0;f=(d&1|g<<1)^1;d=~~+ga(+(h/j))>>>0;yf(b,f>>>0<d>>>0?d:f);f=k[t>>2]|0;d=k[u>>2]|0;e=f+-1|0;if(!(e&f)){g=f;e=e&d;break}else{g=f;e=(d>>>0)%(f>>>0)|0;break}}while(0);d=k[(k[b>>2]|0)+(e<<2)>>2]|0;if(!d){d=b+8|0;k[c>>2]=k[d>>2];k[d>>2]=c;k[(k[b>>2]|0)+(e<<2)>>2]=d;d=k[c>>2]|0;if(d){d=k[d+4>>2]|0;e=g+-1|0;if(!(e&g))d=d&e;else d=(d>>>0)%(g>>>0)|0;k[(k[b>>2]|0)+(d<<2)>>2]=c}}else{k[c>>2]=k[d>>2];k[d>>2]=c}k[m>>2]=(k[m>>2]|0)+1;b=1;k[a>>2]=c;a=a+4|0;i[a>>0]=b;return}function yf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;if((b|0)!=1){if(b+-1&b)b=Zh(b)|0}else b=2;e=k[a+4>>2]|0;if(b>>>0>e>>>0){zf(a,b);return}if(b>>>0>=e>>>0)return;if(e>>>0>2)d=(e+-1&e|0)==0;else d=0;c=~~+ga(+(+((k[a+12>>2]|0)>>>0)/+o[a+16>>2]))>>>0;if(d)c=1<<32-(ja(c+-1|0)|0);else c=Zh(c)|0;b=b>>>0<c>>>0?c:b;if(b>>>0>=e>>>0)return;zf(a,b);return}function zf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=a+4|0;if(!b){c=k[a>>2]|0;k[a>>2]=0;if(c)rg(c);k[d>>2]=0;return}t=og(b<<2)|0;c=k[a>>2]|0;k[a>>2]=t;if(c)rg(c);k[d>>2]=b;c=0;do{k[(k[a>>2]|0)+(c<<2)>>2]=0;c=c+1|0}while((c|0)!=(b|0));d=a+8|0;f=k[d>>2]|0;if(!f)return;c=k[f+4>>2]|0;s=b+-1|0;t=(s&b|0)==0;if(t)e=c&s;else e=(c>>>0)%(b>>>0)|0;k[(k[a>>2]|0)+(e<<2)>>2]=d;c=k[f>>2]|0;if(!c)return;else{g=f;d=f}a:while(1){r=d;b:while(1){while(1){d=k[c+4>>2]|0;if(t)q=d&s;else q=(d>>>0)%(b>>>0)|0;if((q|0)==(e|0)){d=c;break}d=(k[a>>2]|0)+(q<<2)|0;if(!(k[d>>2]|0)){e=q;f=c;c=r;break b}d=k[c>>2]|0;c:do if(!d)d=c;else{n=c+8|0;p=i[n>>0]|0;m=(p&1)==0;p=m?(p&255)>>>1:k[c+12>>2]|0;l=c+16|0;n=n+1|0;o=(p|0)==0;if(m)m=c;else{j=c;while(1){f=d+8|0;o=i[f>>0]|0;h=(o&1)==0;if((p|0)!=((h?(o&255)>>>1:k[d+12>>2]|0)|0)){d=j;break c}if(mh(k[l>>2]|0,h?f+1|0:k[d+16>>2]|0,p)|0){d=j;break c}f=k[d>>2]|0;if(!f)break c;else{j=d;d=f}}}while(1){f=d+8|0;l=i[f>>0]|0;h=(l&1)==0;if((p|0)!=((h?(l&255)>>>1:k[d+12>>2]|0)|0)){d=m;break c}if(!o){j=p;l=n;f=h?f+1|0:k[d+16>>2]|0;while(1){if((i[l>>0]|0)!=(i[f>>0]|0)){d=m;break c}j=j+-1|0;if(!j)break;else{l=l+1|0;f=f+1|0}}}f=k[d>>2]|0;if(!f)break;else{m=d;d=f}}}while(0);k[r>>2]=k[d>>2];k[d>>2]=k[k[(k[a>>2]|0)+(q<<2)>>2]>>2];k[k[(k[a>>2]|0)+(q<<2)>>2]>>2]=c;c=k[g>>2]|0;if(!c){c=35;break a}}c=k[d>>2]|0;if(!c){c=35;break a}else{g=d;r=d}}k[d>>2]=c;c=k[f>>2]|0;if(!c){c=35;break}else{g=f;d=f}}if((c|0)==35)return}function Af(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;I=r;r=r+32|0;v=I+16|0;D=I+12|0;F=I;G=F+4|0;w=F+8|0;x=b<<1|1;u=F+8|0;y=x<<3;z=(b|0)>0;A=d+b|0;B=d+1|0;E=b>>>0<2;C=1;a:while(1){k[D>>2]=C;k[F>>2]=0;k[G>>2]=0;k[w>>2]=0;e=og(y)|0;k[F>>2]=e;k[G>>2]=e;k[u>>2]=e+(x<<3);if(z){q=b;do{s=q;q=q+-1|0;e=a+(q<<2)|0;f=k[e>>2]|0;do if(f){n=k[((f|0)<(C|0)?D:e)>>2]|0;e=k[G>>2]|0;f=k[u>>2]|0;if(e>>>0<f>>>0){p=hi(q|0,0,48)|0;t=e;k[t>>2]=p|n;k[t+4>>2]=L|65535;k[G>>2]=(k[G>>2]|0)+8;break}p=k[F>>2]|0;o=p;g=(e-o>>3)+1|0;if(g>>>0>536870911){H=8;break a}h=p;e=f-h|0;if(e>>3>>>0<268435455){e=e>>2;e=e>>>0<g>>>0?g:e;g=(k[G>>2]|0)-h|0;f=g>>3;if(!e){m=0;h=0;e=g}else H=12}else{g=(k[G>>2]|0)-h|0;e=536870911;f=g>>3;H=12}if((H|0)==12){H=0;m=e;h=og(e<<3)|0;e=g}g=hi(q|0,0,48)|0;t=h+(f<<3)|0;k[t>>2]=g|n;k[t+4>>2]=L|65535;ki(h|0,p|0,e|0)|0;k[F>>2]=h;k[G>>2]=h+(f+1<<3);k[u>>2]=h+(m<<3);if(o)rg(o)}while(0)}while((s|0)>1);f=k[G>>2]|0;e=k[F>>2]|0}else f=e;t=f-e|0;p=t>>3;if((p|0)==1){H=17;break}k[v>>2]=1;if((t|0)>1024){g=p;while(1){h=pg(g<<3,320895)|0;if(h){H=23;break}if((g|0)>1)g=(g|0)/2|0;else{h=0;g=0;break}}if((H|0)==23)H=0;m=h}else{m=0;g=0;h=0}Hf(e,f,v,p,m,g);if(h)rg(h);e=k[G>>2]|0;if((e|0)==(k[u>>2]|0)){o=k[F>>2]|0;n=o;f=(e-n>>3)+1|0;if(f>>>0>536870911){H=31;break}g=o;e=e-g|0;if(e>>3>>>0<268435455){e=e>>2;e=e>>>0<f>>>0?f:e;f=(k[G>>2]|0)-g|0;g=f>>3;if(!e){m=0;h=0}else H=35}else{f=(k[G>>2]|0)-g|0;e=536870911;g=f>>3;H=35}if((H|0)==35){H=0;m=e;h=og(e<<3)|0}e=h+(g<<3)|0;k[e>>2]=2147483647;k[e+4>>2]=-1;e=h+(g+1<<3)|0;ki(h|0,o|0,f|0)|0;k[F>>2]=h;k[G>>2]=e;k[u>>2]=h+(m<<3);if(n){rg(n);e=k[G>>2]|0}}else{k[e>>2]=2147483647;k[e+4>>2]=-1;e=(k[G>>2]|0)+8|0;k[G>>2]=e}if((e|0)==(k[u>>2]|0)){o=k[F>>2]|0;n=o;f=(e-n>>3)+1|0;if(f>>>0>536870911){H=41;break}g=o;e=e-g|0;if(e>>3>>>0<268435455){e=e>>2;e=e>>>0<f>>>0?f:e;g=(k[G>>2]|0)-g|0;f=g>>3;if(!e){m=0;h=0;e=g}else H=45}else{g=(k[G>>2]|0)-g|0;e=536870911;f=g>>3;H=45}if((H|0)==45){H=0;m=e;h=og(e<<3)|0;e=g}s=h+(f<<3)|0;k[s>>2]=2147483647;k[s+4>>2]=-1;ki(h|0,o|0,e|0)|0;k[F>>2]=h;k[G>>2]=h+(f+1<<3);k[u>>2]=h+(m<<3);if(n)rg(n)}else{s=e;k[s>>2]=2147483647;k[s+4>>2]=-1;k[G>>2]=(k[G>>2]|0)+8}if((t|0)>8){q=0;s=p+1|0;o=p;do{o=o+-1|0;p=k[F>>2]|0;f=(k[p+(q<<3)>>2]|0)>(k[p+(s<<3)>>2]|0);g=f&1;h=(g^1)+q|0;g=g+s|0;f=f?s:q;n=(k[p+(h<<3)>>2]|0)>(k[p+(g<<3)>>2]|0);e=n&1;q=(e^1)+h|0;s=e+g|0;h=n?g:h;g=k[G>>2]|0;n=p;e=g-n>>3;m=e+-1|0;k[p+(m<<3)>>2]=(k[p+(h<<3)>>2]|0)+(k[p+(f<<3)>>2]|0);j[p+(m<<3)+4>>1]=f;j[p+(m<<3)+6>>1]=h;if((g|0)==(k[u>>2]|0)){f=e+1|0;if(f>>>0>536870911){H=54;break a}h=p;e=g-h|0;if(e>>3>>>0<268435455){e=e>>2;e=e>>>0<f>>>0?f:e;g=(k[G>>2]|0)-h|0;f=g>>3;if(!e){m=0;h=0;e=g}else H=58}else{g=(k[G>>2]|0)-h|0;e=536870911;f=g>>3;H=58}if((H|0)==58){H=0;m=e;h=og(e<<3)|0;e=g}g=h+(f<<3)|0;k[g>>2]=2147483647;k[g+4>>2]=-1;ki(h|0,p|0,e|0)|0;k[F>>2]=h;k[G>>2]=h+(f+1<<3);k[u>>2]=h+(m<<3);if(n)rg(n)}else{p=g;k[p>>2]=2147483647;k[p+4>>2]=-1;k[G>>2]=(k[G>>2]|0)+8}}while((o|0)>1)}s=k[F>>2]|0;If(s+((t>>2)+-1<<3)|0,s,d,0);if(E)e=d;else{e=d;f=B;do{e=(l[e>>0]|0)<(l[f>>0]|0)?f:e;f=f+1|0}while((f|0)!=(A|0))}e=(l[e>>0]|0)>(c|0);f=k[F>>2]|0;g=f;if(f){h=k[G>>2]|0;if((h|0)!=(f|0))k[G>>2]=h+(~((h+-8-g|0)>>>3)<<3);rg(f)}if(e)C=C<<1;else{H=68;break}}if((H|0)==8)mg(F);else if((H|0)==17){i[d+(j[e+6>>1]|0)>>0]=1;if(!e){r=I;return}if((f|0)!=(e|0))k[G>>2]=f+(~((f+-8-e|0)>>>3)<<3);rg(e);r=I;return}else if((H|0)==31)mg(F);else if((H|0)==41)mg(F);else if((H|0)==54)mg(F);else if((H|0)==68){r=I;return}}function Bf(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((a|0)!=(b|0)){o=b&255;q=d+4|0;a=k[q>>2]|0;r=d+8|0;j=k[r>>2]|0;if(a>>>0>=j>>>0){s=k[d>>2]|0;p=s;h=a-p+1|0;if((h|0)<0)mg(d);n=s;a=j-n|0;if(a>>>0<1073741823){a=a<<1;a=a>>>0<h>>>0?h:a;j=k[q>>2]|0;h=j-n|0;if(!a){m=0;l=0;a=j}else w=9}else{h=k[q>>2]|0;a=2147483647;j=h;h=h-n|0;w=9}if((w|0)==9){m=a;l=og(a)|0;a=j}i[l+h>>0]=o;t=a-n|0;u=l+(h-t)|0;ki(u|0,s|0,t|0)|0;k[d>>2]=u;k[q>>2]=l+(h+1);k[r>>2]=l+m;if(p)rg(p)}else{i[a>>0]=o;k[q>>2]=(k[q>>2]|0)+1}o=e+4|0;a=k[o>>2]|0;p=e+8|0;h=k[p>>2]|0;if(a>>>0>=h>>>0){q=k[e>>2]|0;r=q;j=a-r+1|0;if((j|0)<0)mg(e);n=q;a=h-n|0;if(a>>>0<1073741823){a=a<<1;a=a>>>0<j>>>0?j:a;j=k[o>>2]|0;h=j-n|0;if(!a){m=0;l=0;a=j}else w=19}else{h=k[o>>2]|0;a=2147483647;j=h;h=h-n|0;w=19}if((w|0)==19){m=a;l=og(a)|0;a=j}i[l+h>>0]=0;t=a-n|0;u=l+(h-t)|0;ki(u|0,q|0,t|0)|0;k[e>>2]=u;k[o>>2]=l+(h+1);k[p>>2]=l+m;if(r)rg(r)}else{i[a>>0]=0;k[o>>2]=(k[o>>2]|0)+1}c=c+-1|0}do if((c|0)==7){o=b&255;p=d+4|0;a=k[p>>2]|0;q=d+8|0;j=k[q>>2]|0;if(a>>>0>=j>>>0){r=k[d>>2]|0;s=r;h=a-s+1|0;if((h|0)<0)mg(d);n=r;a=j-n|0;if(a>>>0<1073741823){a=a<<1;a=a>>>0<h>>>0?h:a;j=k[p>>2]|0;h=j-n|0;if(!a){m=0;l=0;a=j}else w=31}else{h=k[p>>2]|0;a=2147483647;j=h;h=h-n|0;w=31}if((w|0)==31){m=a;l=og(a)|0;a=j}i[l+h>>0]=o;c=a-n|0;v=l+(h-c)|0;ki(v|0,r|0,c|0)|0;k[d>>2]=v;k[p>>2]=l+(h+1);k[q>>2]=l+m;if(s)rg(s)}else{i[a>>0]=o;k[p>>2]=(k[p>>2]|0)+1}o=e+4|0;a=k[o>>2]|0;p=e+8|0;h=k[p>>2]|0;if(a>>>0<h>>>0){i[a>>0]=0;k[o>>2]=(k[o>>2]|0)+1;v=6;break}q=k[e>>2]|0;r=q;j=a-r+1|0;if((j|0)<0)mg(e);n=q;a=h-n|0;if(a>>>0<1073741823){a=a<<1;a=a>>>0<j>>>0?j:a;j=k[o>>2]|0;h=j-n|0;if(!a){m=0;l=0;a=j}else w=41}else{h=k[o>>2]|0;a=2147483647;j=h;h=h-n|0;w=41}if((w|0)==41){m=a;l=og(a)|0;a=j}i[l+h>>0]=0;c=a-n|0;v=l+(h-c)|0;ki(v|0,q|0,c|0)|0;k[e>>2]=v;k[o>>2]=l+(h+1);k[p>>2]=l+m;if(!r)v=6;else{rg(r);v=6}}else if((c|0)<3){if((c|0)<=0)return;q=b&255;r=d+4|0;s=d+8|0;b=e+4|0;t=e+8|0;u=0;while(1){a=k[r>>2]|0;h=k[s>>2]|0;if(a>>>0>=h>>>0){o=k[d>>2]|0;p=o;j=a-p+1|0;if((j|0)<0){w=50;break}n=o;a=h-n|0;if(a>>>0<1073741823){a=a<<1;a=a>>>0<j>>>0?j:a;j=k[r>>2]|0;h=j-n|0;if(!a){m=0;l=0;a=j}else w=54}else{h=k[r>>2]|0;a=2147483647;j=h;h=h-n|0;w=54}if((w|0)==54){w=0;m=a;l=og(a)|0;a=j}i[l+h>>0]=q;j=a-n|0;n=l+(h-j)|0;ki(n|0,o|0,j|0)|0;k[d>>2]=n;k[r>>2]=l+(h+1);k[s>>2]=l+m;if(p)rg(p)}else{i[a>>0]=q;k[r>>2]=(k[r>>2]|0)+1}a=k[b>>2]|0;h=k[t>>2]|0;if(a>>>0>=h>>>0){o=k[e>>2]|0;p=o;j=a-p+1|0;if((j|0)<0){w=60;break}n=o;a=h-n|0;if(a>>>0<1073741823){a=a<<1;a=a>>>0<j>>>0?j:a;j=k[b>>2]|0;h=j-n|0;if(!a){m=0;l=0;a=j}else w=64}else{h=k[b>>2]|0;a=2147483647;j=h;h=h-n|0;w=64}if((w|0)==64){w=0;m=a;l=og(a)|0;a=j}i[l+h>>0]=0;j=a-n|0;n=l+(h-j)|0;ki(n|0,o|0,j|0)|0;k[e>>2]=n;k[b>>2]=l+(h+1);k[t>>2]=l+m;if(p)rg(p)}else{i[a>>0]=0;k[b>>2]=(k[b>>2]|0)+1}u=u+1|0;if((u|0)==(c|0)){w=99;break}}if((w|0)==50)mg(d);else if((w|0)==60)mg(e);else if((w|0)==99)return}else v=c;while(0);j=v+-3|0;c=d+4|0;l=k[c>>2]|0;h=k[d>>2]|0;a=l-h|0;do if((j|0)>-1){b=d+8|0;t=e+4|0;u=e+8|0;while(1){h=k[b>>2]|0;if(l>>>0>=h>>>0){q=k[d>>2]|0;r=q;l=l-r+1|0;if((l|0)<0){w=73;break}p=q;h=h-p|0;if(h>>>0<1073741823){h=h<<1;h=h>>>0<l>>>0?l:h;m=k[c>>2]|0;l=m-p|0;if(!h){o=0;n=0;h=m}else w=77}else{l=k[c>>2]|0;h=2147483647;m=l;l=l-p|0;w=77}if((w|0)==77){w=0;o=h;n=og(h)|0;h=m}i[n+l>>0]=16;s=h-p|0;v=n+(l-s)|0;ki(v|0,q|0,s|0)|0;k[d>>2]=v;k[c>>2]=n+(l+1);k[b>>2]=n+o;if(r)rg(r)}else{i[l>>0]=16;k[c>>2]=(k[c>>2]|0)+1}q=j&3;h=k[t>>2]|0;l=k[u>>2]|0;if(h>>>0>=l>>>0){r=k[e>>2]|0;s=r;m=h-s+1|0;if((m|0)<0){w=83;break}p=r;h=l-p|0;if(h>>>0<1073741823){h=h<<1;h=h>>>0<m>>>0?m:h;m=k[t>>2]|0;l=m-p|0;if(!h){o=0;n=0;h=m}else w=87}else{l=k[t>>2]|0;h=2147483647;m=l;l=l-p|0;w=87}if((w|0)==87){w=0;o=h;n=og(h)|0;h=m}i[n+l>>0]=q;q=h-p|0;v=n+(l-q)|0;ki(v|0,r|0,q|0)|0;k[e>>2]=v;k[t>>2]=n+(l+1);k[u>>2]=n+o;if(s)rg(s)}else{i[h>>0]=q;k[t>>2]=(k[t>>2]|0)+1}h=j>>2;l=k[c>>2]|0;if((h|0)>0)j=h+-1|0;else{f=l;w=91;break}}if((w|0)==73)mg(d);else if((w|0)==83)mg(e);else if((w|0)==91){g=f;f=k[d>>2]|0;break}}else{g=l;f=h}while(0);j=g-f|0;h=j+-1|0;if((h|0)>(a|0)){w=f+a|0;g=i[w>>0]|0;i[w>>0]=i[f+h>>0]|0;i[(k[d>>2]|0)+h>>0]=g;g=a+1|0;f=j+-2|0;if((g|0)<(f|0))do{u=k[d>>2]|0;v=u+g|0;w=i[v>>0]|0;i[v>>0]=i[u+f>>0]|0;i[(k[d>>2]|0)+f>>0]=w;g=g+1|0;f=f+-1|0}while((g|0)<(f|0));g=k[c>>2]|0;f=k[d>>2]|0}f=g-f+-1|0;if((f|0)<=(a|0))return;do{v=k[e>>2]|0;w=v+a|0;d=i[w>>0]|0;i[w>>0]=i[v+f>>0]|0;i[(k[e>>2]|0)+f>>0]=d;a=a+1|0;f=f+-1|0}while((a|0)<(f|0));return}function Cf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;do if((a|0)==11){n=b+4|0;e=k[n>>2]|0;p=b+8|0;h=k[p>>2]|0;if(e>>>0>=h>>>0){q=k[b>>2]|0;o=q;g=e-o+1|0;if((g|0)<0)mg(b);m=q;e=h-m|0;if(e>>>0<1073741823){e=e<<1;e=e>>>0<g>>>0?g:e;h=k[n>>2]|0;g=h-m|0;if(!e){l=0;j=0;e=h}else v=9}else{g=k[n>>2]|0;e=2147483647;h=g;g=g-m|0;v=9}if((v|0)==9){l=e;j=og(e)|0;e=h}i[j+g>>0]=0;u=e-m|0;a=j+(g-u)|0;ki(a|0,q|0,u|0)|0;k[b>>2]=a;k[n>>2]=j+(g+1);k[p>>2]=j+l;if(o)rg(o)}else{i[e>>0]=0;k[n>>2]=(k[n>>2]|0)+1}n=c+4|0;e=k[n>>2]|0;o=c+8|0;g=k[o>>2]|0;if(e>>>0<g>>>0){i[e>>0]=0;k[n>>2]=(k[n>>2]|0)+1;p=10;break}p=k[c>>2]|0;q=p;h=e-q+1|0;if((h|0)<0)mg(c);m=p;e=g-m|0;if(e>>>0<1073741823){e=e<<1;e=e>>>0<h>>>0?h:e;h=k[n>>2]|0;g=h-m|0;if(!e){l=0;j=0;e=h}else v=19}else{g=k[n>>2]|0;e=2147483647;h=g;g=g-m|0;v=19}if((v|0)==19){l=e;j=og(e)|0;e=h}i[j+g>>0]=0;u=e-m|0;a=j+(g-u)|0;ki(a|0,p|0,u|0)|0;k[c>>2]=a;k[n>>2]=j+(g+1);k[o>>2]=j+l;if(!q)p=10;else{rg(q);p=10}}else if((a|0)<3){if((a|0)<=0)return;q=b+4|0;r=b+8|0;s=c+4|0;t=c+8|0;u=0;while(1){e=k[q>>2]|0;h=k[r>>2]|0;if(e>>>0>=h>>>0){n=k[b>>2]|0;o=n;g=e-o+1|0;if((g|0)<0){v=28;break}m=n;e=h-m|0;if(e>>>0<1073741823){e=e<<1;e=e>>>0<g>>>0?g:e;h=k[q>>2]|0;g=h-m|0;if(!e){l=0;j=0;e=h}else v=32}else{g=k[q>>2]|0;e=2147483647;h=g;g=g-m|0;v=32}if((v|0)==32){v=0;l=e;j=og(e)|0;e=h}i[j+g>>0]=0;h=e-m|0;m=j+(g-h)|0;ki(m|0,n|0,h|0)|0;k[b>>2]=m;k[q>>2]=j+(g+1);k[r>>2]=j+l;if(o)rg(o)}else{i[e>>0]=0;k[q>>2]=(k[q>>2]|0)+1}e=k[s>>2]|0;g=k[t>>2]|0;if(e>>>0>=g>>>0){n=k[c>>2]|0;o=n;h=e-o+1|0;if((h|0)<0){v=38;break}m=n;e=g-m|0;if(e>>>0<1073741823){e=e<<1;e=e>>>0<h>>>0?h:e;h=k[s>>2]|0;g=h-m|0;if(!e){l=0;j=0;e=h}else v=42}else{g=k[s>>2]|0;e=2147483647;h=g;g=g-m|0;v=42}if((v|0)==42){v=0;l=e;j=og(e)|0;e=h}i[j+g>>0]=0;h=e-m|0;m=j+(g-h)|0;ki(m|0,n|0,h|0)|0;k[c>>2]=m;k[s>>2]=j+(g+1);k[t>>2]=j+l;if(o)rg(o)}else{i[e>>0]=0;k[s>>2]=(k[s>>2]|0)+1}u=u+1|0;if((u|0)==(a|0)){v=77;break}}if((v|0)==28)mg(b);else if((v|0)==38)mg(c);else if((v|0)==77)return}else p=a;while(0);h=p+-3|0;a=b+4|0;j=k[a>>2]|0;g=k[b>>2]|0;e=j-g|0;do if((h|0)>-1){s=b+8|0;t=c+4|0;u=c+8|0;while(1){g=k[s>>2]|0;if(j>>>0>=g>>>0){p=k[b>>2]|0;q=p;j=j-q+1|0;if((j|0)<0){v=51;break}o=p;g=g-o|0;if(g>>>0<1073741823){g=g<<1;g=g>>>0<j>>>0?j:g;l=k[a>>2]|0;j=l-o|0;if(!g){n=0;m=0;g=l}else v=55}else{j=k[a>>2]|0;g=2147483647;l=j;j=j-o|0;v=55}if((v|0)==55){v=0;n=g;m=og(g)|0;g=l}i[m+j>>0]=17;o=g-o|0;r=m+(j-o)|0;ki(r|0,p|0,o|0)|0;k[b>>2]=r;k[a>>2]=m+(j+1);k[s>>2]=m+n;if(q)rg(q)}else{i[j>>0]=17;k[a>>2]=(k[a>>2]|0)+1}p=h&7;g=k[t>>2]|0;j=k[u>>2]|0;if(g>>>0>=j>>>0){q=k[c>>2]|0;r=q;l=g-r+1|0;if((l|0)<0){v=61;break}o=q;g=j-o|0;if(g>>>0<1073741823){g=g<<1;g=g>>>0<l>>>0?l:g;l=k[t>>2]|0;j=l-o|0;if(!g){n=0;m=0;g=l}else v=65}else{j=k[t>>2]|0;g=2147483647;l=j;j=j-o|0;v=65}if((v|0)==65){v=0;n=g;m=og(g)|0;g=l}i[m+j>>0]=p;o=g-o|0;p=m+(j-o)|0;ki(p|0,q|0,o|0)|0;k[c>>2]=p;k[t>>2]=m+(j+1);k[u>>2]=m+n;if(r)rg(r)}else{i[g>>0]=p;k[t>>2]=(k[t>>2]|0)+1}g=h>>3;j=k[a>>2]|0;if((g|0)>0)h=g+-1|0;else{d=j;v=69;break}}if((v|0)==51)mg(b);else if((v|0)==61)mg(c);else if((v|0)==69){f=d;d=k[b>>2]|0;break}}else{f=j;d=g}while(0);h=f-d|0;g=h+-1|0;if((g|0)>(e|0)){v=d+e|0;f=i[v>>0]|0;i[v>>0]=i[d+g>>0]|0;i[(k[b>>2]|0)+g>>0]=f;f=e+1|0;d=h+-2|0;if((f|0)<(d|0))do{t=k[b>>2]|0;u=t+f|0;v=i[u>>0]|0;i[u>>0]=i[t+d>>0]|0;i[(k[b>>2]|0)+d>>0]=v;f=f+1|0;d=d+-1|0}while((f|0)<(d|0));f=k[a>>2]|0;d=k[b>>2]|0}d=f-d+-1|0;if((d|0)<=(e|0))return;do{a=k[c>>2]|0;v=a+e|0;b=i[v>>0]|0;i[v>>0]=i[a+d>>0]|0;i[(k[c>>2]|0)+d>>0]=b;e=e+1|0;d=d+-1|0}while((e|0)<(d|0));return}function Df(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0;if((a|0)>0){d=0;c=0}else{o=1;return o|0}do{c=((k[b+(d<<2)>>2]|0)!=0&1)+c|0;d=d+1|0}while((d|0)!=(a|0));if((c|0)<16){o=1;return o|0}else c=a;while(1){a=(c|0)>-1;if((c|0)==0|a^1){c=1;o=55;break}d=c+-1|0;if(!(k[b+(d<<2)>>2]|0))c=d;else break}if((o|0)==55)return c|0;if((c|0)>0){g=0;e=0;d=1073741824}else{o=1;return o|0}do{f=k[b+(g<<2)>>2]|0;if(f){e=e+1|0;d=(d|0)>(f|0)?f:d}g=g+1|0}while((g|0)!=(c|0));if((e|0)<5){o=1;return o|0}if((d|0)<4&(c-e|0)<6?(h=c+-1|0,(h|0)>1):0){d=1;do{if(((k[b+(d+-1<<2)>>2]|0)!=0?(j=b+(d<<2)|0,(k[j>>2]|0)==0):0)?(k[b+(d+1<<2)>>2]|0)!=0:0)k[j>>2]=1;d=d+1|0}while((d|0)!=(h|0))}if((e|0)<28){o=1;return o|0}l=Qh(c,1)|0;if(!l){o=0;return o|0}m=c+1|0;if(a){j=0;d=0;e=k[b>>2]|0;do{f=(j|0)==(c|0);if(!f?(k[b+(j<<2)>>2]|0)==(e|0):0)d=d+1|0;else{if((e|0)==0&(d|0)>4){if((d|0)>0)o=27}else if((d|0)>6&(e|0)!=0)o=27;if((o|0)==27){o=0;g=j+-1|0;h=0;do{i[l+(g-h)>>0]=1;h=h+1|0}while((h|0)!=(d|0))}if(f)d=1;else{d=1;e=k[b+(j<<2)>>2]|0}}j=j+1|0}while((j|0)<(m|0));if(a){g=c+-2|0;h=0;d=(((k[b+4>>2]|0)+(k[b>>2]|0)+(k[b+8>>2]|0)<<8|0)/3|0)+420|0;j=0;a=0;do{f=(h|0)==(c|0);do if(!f?(i[l+h>>0]|0)==0:0){if((h|0)!=0?(i[l+(h+-1)>>0]|0)!=0:0){o=40;break}e=(k[b+(h<<2)>>2]<<8)-d|0;if((((e|0)>-1?e:0-e|0)|0)<=1239)e=j;else o=40}else o=40;while(0);do if((o|0)==40){o=0;if(!((j|0)<=3?!((j|0)>2&(a|0)==0):0))o=42;if((o|0)==42?(o=0,n=(((j|0)/2|0)+a|0)/(j|0)|0,n=(a|0)==0?0:(n|0)<1?1:n,(j|0)>0):0){d=h+-1|0;a=0;do{k[b+(d-a<<2)>>2]=n;a=a+1|0}while((a|0)!=(j|0))}if((h|0)<(g|0)){d=(((k[b+(h+1<<2)>>2]|0)+(k[b+(h<<2)>>2]|0)+(k[b+(h+2<<2)>>2]|0)<<8|0)/3|0)+420|0;e=0;a=0;break}if((h|0)<(c|0)){d=k[b+(h<<2)>>2]<<8;e=0;a=0}else{d=0;e=0;a=0}}while(0);j=e+1|0;if(!f){a=(k[b+(h<<2)>>2]|0)+a|0;if((e|0)>2)d=(((j|0)/2|0)+(a<<8)|0)/(j|0)|0;d=(j|0)==4?d+120|0:d}h=h+1|0}while((h|0)<(m|0))}}Ph(l);o=1;return o|0}function Ef(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;if(!b)return;f=b+-1|0;g=0;e=b;do{if(i[a+(f-g)>>0]|0)break;e=e+-1|0;g=g+1|0}while(g>>>0<b>>>0);if(b>>>0>50){if(!e){b=0;h=0;e=0;f=0;g=0}else{b=0;h=0;m=0;f=0;g=0;do{l=i[a+m>>0]|0;j=m+1|0;a:do if(j>>>0<e>>>0){k=1;do{if((i[a+j>>0]|0)!=l<<24>>24)break a;k=k+1|0;j=j+1|0}while(j>>>0<e>>>0)}else k=1;while(0);j=l<<24>>24==0&(k|0)>2;h=(j&1)+h|0;g=(j?k:0)+g|0;l=l<<24>>24!=0&(k|0)>3;f=(l?k:0)+f|0;b=(l&1)+b|0;m=k+m|0}while(m>>>0<e>>>0);b=b<<1;h=h<<1}b=(f-b|0)>2&1;f=(g-h|0)>2&1;m=e}else{b=0;f=0;m=e}if(!m)return;l=f<<24>>24==0;if(!(b<<24>>24)){k=0;j=8;while(1){g=i[a+k>>0]|0;e=g&255;h=g<<24>>24==0;b:do if(!(l|g<<24>>24!=0)?(n=k+1|0,n>>>0<m>>>0):0){b=n;f=1;do{if((i[a+b>>0]|0)!=g<<24>>24)break b;f=f+1|0;b=b+1|0}while(b>>>0<m>>>0)}else f=1;while(0);if(h){Cf(f,c,d);e=j}else Bf(j,e,f,c,d);k=f+k|0;if(k>>>0>=m>>>0)break;else j=e}return}if(l){k=0;j=8}else{k=0;j=8;while(1){b=i[a+k>>0]|0;e=b&255;h=b<<24>>24==0;f=k+1|0;c:do if(f>>>0<m>>>0){g=1;while(1){if((i[a+f>>0]|0)!=b<<24>>24){f=g;break c}g=g+1|0;f=f+1|0;if(f>>>0>=m>>>0){f=g;break}}}else f=1;while(0);if(h){Cf(f,c,d);e=j}else Bf(j,e,f,c,d);k=f+k|0;if(k>>>0>=m>>>0)break;else j=e}return}while(1){b=i[a+k>>0]|0;f=b&255;h=b<<24>>24==0;do if(h){e=1;o=29}else{e=k+1|0;if(e>>>0<m>>>0){g=e;e=1;do{if((i[a+g>>0]|0)!=b<<24>>24)break;e=e+1|0;g=g+1|0}while(g>>>0<m>>>0);if(h){o=29;break}}else e=1;Bf(j,f,e,c,d)}while(0);if((o|0)==29){o=0;Cf(e,c,d);f=j}k=e+k|0;if(k>>>0>=m>>>0)break;else j=f}return}function Ff(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,n=0,o=0;o=r;r=r+64|0;f=o+32|0;n=o;d=f;e=d+32|0;do{j[d>>1]=0;d=d+2|0}while((d|0)<(e|0));d=(b|0)>0;if(d){e=0;do{h=f+((l[a+e>>0]|0)<<1)|0;j[h>>1]=(j[h>>1]|0)+1<<16>>16;e=e+1|0}while((e|0)!=(b|0))}j[f>>1]=0;j[n>>1]=0;j[n+2>>1]=0;h=(m[f+2>>1]|0)<<1;j[n+4>>1]=h;h=(m[f+4>>1]|0)+h<<1;j[n+6>>1]=h;h=(m[f+6>>1]|0)+h<<1;j[n+8>>1]=h;h=(m[f+8>>1]|0)+h<<1;j[n+10>>1]=h;h=(m[f+10>>1]|0)+h<<1;j[n+12>>1]=h;h=(m[f+12>>1]|0)+h<<1;j[n+14>>1]=h;h=(m[f+14>>1]|0)+h<<1;j[n+16>>1]=h;h=(m[f+16>>1]|0)+h<<1;j[n+18>>1]=h;h=(m[f+18>>1]|0)+h<<1;j[n+20>>1]=h;h=(m[f+20>>1]|0)+h<<1;j[n+22>>1]=h;h=(m[f+22>>1]|0)+h<<1;j[n+24>>1]=h;h=(m[f+24>>1]|0)+h<<1;j[n+26>>1]=h;h=(m[f+26>>1]|0)+h<<1;j[n+28>>1]=h;j[n+30>>1]=(m[f+28>>1]|0)+h<<1;if(d)h=0;else{r=o;return}do{e=i[a+h>>0]|0;if(e<<24>>24){g=e&255;d=n+(g<<1)|0;f=j[d>>1]|0;j[d>>1]=f+1<<16>>16;d=k[3972+((f&15)<<2)>>2]|0;if((e&255)>4){e=4;do{f=(f&65535)>>>4;d=k[3972+((f&15)<<2)>>2]|d<<4;e=e+4|0}while((e|0)<(g|0))}j[c+(h<<1)>>1]=d>>>(0-g&3)}h=h+1|0}while((h|0)!=(b|0));r=o;return}function Gf(a,b){a=a|0;b=b|0;return (k[a>>2]|0)<(k[b>>2]|0)|0}function Hf(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,l=0,m=0;l=r;r=r+16|0;i=l;switch(d|0){case 2:{g=b+-8|0;if(!(Zb[k[c>>2]&1](g,a)|0)){r=l;return}b=a;j=k[b>>2]|0;b=k[b+4>>2]|0;d=g;i=k[d+4>>2]|0;c=a;k[c>>2]=k[d>>2];k[c+4>>2]=i;c=g;k[c>>2]=j;k[c+4>>2]=b;r=l;return}case 1:case 0:{r=l;return}default:{if((d|0)<129){if((a|0)!=(b|0)?(g=a+8|0,(g|0)!=(b|0)):0){f=g;do{g=f;e=f;h=k[e+4>>2]|0;d=i;k[d>>2]=k[e>>2];k[d+4>>2]=h;a:do if((f|0)==(a|0))j=8;else{h=f;while(1){h=h+-8|0;e=g;if(!(Zb[k[c>>2]&1](i,h)|0)){g=e;break a}m=h;d=k[m+4>>2]|0;k[g>>2]=k[m>>2];k[g+4>>2]=d;g=e+-8|0;if((h|0)==(a|0)){j=8;break}}}while(0);if((j|0)==8)j=0;h=i;d=k[h+4>>2]|0;m=g;k[m>>2]=k[h>>2];k[m+4>>2]=d;f=f+8|0}while((f|0)!=(b|0))}r=l;return}g=(d|0)/2|0;h=a+(g<<3)|0;if((d|0)>(f|0)){Hf(a,h,c,g,e,f);m=d-g|0;Hf(h,b,c,m,e,f);Kf(a,h,b,c,g,m,e,f);r=l;return}Jf(a,h,c,g,e);i=e+(g<<3)|0;Jf(h,b,c,d-g|0,i);f=e+(d<<3)|0;b:do if((d+1|0)>>>0<3){e=i;g=a}else{h=i;g=a;while(1){if((h|0)==(f|0))break;if(Zb[k[c>>2]&1](h,e)|0){b=h;a=k[b+4>>2]|0;m=g;k[m>>2]=k[b>>2];k[m+4>>2]=a;h=h+8|0}else{b=e;a=k[b+4>>2]|0;m=g;k[m>>2]=k[b>>2];k[m+4>>2]=a;e=e+8|0}g=g+8|0;if((e|0)==(i|0)){e=h;break b}}if((e|0)==(i|0)){r=l;return}while(1){a=e;c=k[a+4>>2]|0;m=g;k[m>>2]=k[a>>2];k[m+4>>2]=c;e=e+8|0;if((e|0)==(i|0))break;else g=g+8|0}r=l;return}while(0);if((e|0)==(f|0)){r=l;return}while(1){a=e;c=k[a+4>>2]|0;m=g;k[m>>2]=k[a>>2];k[m+4>>2]=c;e=e+8|0;if((e|0)==(f|0))break;else g=g+8|0}r=l;return}}}function If(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=j[a+4>>1]|0;if(e<<16>>16>-1){do{d=d+1|0;If(b+(e<<16>>16<<3)|0,b,c,d);f=j[a+6>>1]|0;a=b+(f<<3)|0;e=j[b+(f<<3)+4>>1]|0}while(e<<16>>16>-1);e=d}else e=d;i[c+(j[a+6>>1]|0)>>0]=e;return}function Jf(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;switch(d|0){case 1:{g=a;c=k[g+4>>2]|0;b=e;k[b>>2]=k[g>>2];k[b+4>>2]=c;return}case 2:{d=b+-8|0;if(Zb[k[c>>2]&1](d,a)|0){b=d;c=k[b+4>>2]|0;g=e;k[g>>2]=k[b>>2];k[g+4>>2]=c;g=a;c=k[g+4>>2]|0;b=e+8|0;k[b>>2]=k[g>>2];k[b+4>>2]=c;return}else{b=a;c=k[b+4>>2]|0;g=e;k[g>>2]=k[b>>2];k[g+4>>2]=c;g=d;c=k[g+4>>2]|0;b=e+8|0;k[b>>2]=k[g>>2];k[b+4>>2]=c;return}}case 0:return;default:{if((d|0)<9){if((a|0)==(b|0))return;d=a;f=k[d+4>>2]|0;g=e;k[g>>2]=k[d>>2];k[g+4>>2]=f;a=a+8|0;if((a|0)==(b|0))return;else g=e;do{d=g;g=g+8|0;if(Zb[k[c>>2]&1](a,d)|0){i=d;h=k[i+4>>2]|0;f=g;k[f>>2]=k[i>>2];k[f+4>>2]=h;a:do if((d|0)==(e|0))d=e;else while(1){f=d;d=d+-8|0;if(!(Zb[k[c>>2]&1](a,d)|0)){d=f;break a}j=d;h=k[j+4>>2]|0;i=f;k[i>>2]=k[j>>2];k[i+4>>2]=h;if((d|0)==(e|0)){d=e;break}}while(0);h=a;i=k[h+4>>2]|0;j=d;k[j>>2]=k[h>>2];k[j+4>>2]=i}else{h=a;i=k[h+4>>2]|0;j=g;k[j>>2]=k[h>>2];k[j+4>>2]=i}a=a+8|0}while((a|0)!=(b|0));return}i=(d|0)/2|0;f=a+(i<<3)|0;Hf(a,f,c,i,e,i);j=d-i|0;Hf(f,b,c,j,e+(i<<3)|0,j);b:do if((d+1|0)>>>0<3)a=f;else{d=f;while(1){if((d|0)==(b|0))break;if(Zb[k[c>>2]&1](d,a)|0){h=d;i=k[h+4>>2]|0;j=e;k[j>>2]=k[h>>2];k[j+4>>2]=i;d=d+8|0}else{h=a;i=k[h+4>>2]|0;j=e;k[j>>2]=k[h>>2];k[j+4>>2]=i;a=a+8|0}e=e+8|0;if((a|0)==(f|0)){a=d;break b}}if((a|0)==(f|0))return;while(1){h=a;i=k[h+4>>2]|0;j=e;k[j>>2]=k[h>>2];k[j+4>>2]=i;a=a+8|0;if((a|0)==(f|0))break;else e=e+8|0}return}while(0);if((a|0)==(b|0))return;while(1){h=a;i=k[h+4>>2]|0;j=e;k[j>>2]=k[h>>2];k[j+4>>2]=i;a=a+8|0;if((a|0)==(b|0))break;else e=e+8|0}return}}}
function pd(a,b,c,d,e,f,g,h,i,m,n,o,q,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;m=m|0;n=n|0;o=o|0;q=q|0;s=s|0;var t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;X=r;r=r+80|0;Q=X+68|0;S=X+64|0;O=X+60|0;U=X+40|0;R=X+56|0;T=X+52|0;P=X+48|0;V=X+32|0;W=X;if(a>>>0>2&b>>>0>2){L=b+-3|0;K=c+(L&d)|0;K=(ha(l[K>>0]|l[K+1>>0]<<8|l[K+2>>0]<<16|l[K+3>>0]<<24,506832829)|0)>>>17;M=m+(K<<1)|0;N=j[M>>1]|0;k[m+65536+(K<<9)+((N&127)<<2)>>2]=L;j[M>>1]=N+1<<16>>16;M=b+-2|0;N=c+(M&d)|0;N=(ha(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24,506832829)|0)>>>17;K=m+(N<<1)|0;L=j[K>>1]|0;k[m+65536+(N<<9)+((L&127)<<2)>>2]=M;j[K>>1]=L+1<<16>>16;K=b+-1|0;L=c+(K&d)|0;L=(ha(l[L>>0]|l[L+1>>0]<<8|l[L+2>>0]<<16|l[L+3>>0]<<24,506832829)|0)>>>17;N=m+(L<<1)|0;M=j[N>>1]|0;k[m+65536+(L<<9)+((M&127)<<2)>>2]=K;j[N>>1]=M+1<<16>>16}t=k[o>>2]|0;u=d&b;E=b-u|0;F=u+a|0;G=(i|0)<9?64:512;if((u+3|0)>>>0>=F>>>0){d=q;c=a;g=t;c=g+c|0;k[o>>2]=c;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}H=G<<2;I=F+-4|0;J=F+-3|0;K=(i|0)<4;L=n+4|0;M=n+8|0;N=n+12|0;D=(i|0)>1;i=q;C=G+u|0;a:while(1){w=C+H|0;while(1){b=u+E|0;k[Q>>2]=0;k[S>>2]=0;k[O>>2]=0;p[U>>3]=h;if(yd(m,c,d,e,f,5.4,n,b,a,b>>>0>g>>>0?g:b,Q,S,O,U)|0){w=0;break}t=t+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<9)+((A&127)<<2)>>2]=b;j[B>>1]=A+1<<16>>16;b=u+1|0;do if(b>>>0>C>>>0)if(b>>>0>w>>>0){a=u+17|0;a=I>>>0<a>>>0?I:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<9)+((A&127)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+4|0;b=b+4|0}while(b>>>0<a>>>0)}else{a=u+9|0;a=J>>>0<a>>>0?J:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<9)+((A&127)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+2|0;b=b+2|0}while(b>>>0<a>>>0)}while(0);a=F-b|0;if((b+3|0)>>>0<F>>>0)u=b;else{b=34;break a}}while(1){a=a+-1|0;if(K){b=(k[Q>>2]|0)+-1|0;b=(a|0)<(b|0)?a:b}else b=0;k[R>>2]=b;k[T>>2]=0;k[P>>2]=0;p[V>>3]=h;y=u+E|0;C=y+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<9)+((A&127)<<2)>>2]=y;j[B>>1]=A+1<<16>>16;if(!(yd(m,c,d,e,f,5.4,n,C,a,C>>>0>g>>>0?g:C,R,T,P,V)|0)){b=u;break}v=+p[V>>3];if(!(v>=+p[U>>3]+7.0)){b=u;break}b=u+1|0;t=t+1|0;k[Q>>2]=k[R>>2];k[S>>2]=k[T>>2];k[O>>2]=k[P>>2];p[U>>3]=v;w=w+1|0;if((w|0)>=4)break;else u=b}A=k[Q>>2]|0;C=b+G+(A<<1)|0;B=b+E|0;x=k[O>>2]|0;a=x+16|0;do if(x>>>0<=(B>>>0>g>>>0?g:B)>>>0){y=k[n>>2]|0;if((x|0)==(y|0))a=1;else{z=k[L>>2]|0;u=k[M>>2]|0;if((x|0)!=(z|0))if((x|0)!=(u|0))if((x|0)!=(k[N>>2]|0)){b:do if(D&(x|0)>5){w=4;while(1){if((x|0)==((k[1044+(w<<2)>>2]|0)+(k[n+(k[980+(w<<2)>>2]<<2)>>2]|0)|0)?(x|0)>=(k[1492+(w<<2)>>2]|0):0){a=w;break}w=w+1|0;if((w|0)>=16)break b}a=a+1|0}while(0);if((a|0)<=1)break}else a=4;else{u=x;a=3}else a=2;k[N>>2]=u;k[M>>2]=z;k[L>>2]=y;k[n>>2]=x}}while(0);ud(W,t,A,k[S>>2]|0,a);w=i+32|0;k[i>>2]=k[W>>2];k[i+4>>2]=k[W+4>>2];k[i+8>>2]=k[W+8>>2];k[i+12>>2]=k[W+12>>2];k[i+16>>2]=k[W+16>>2];k[i+20>>2]=k[W+20>>2];k[i+24>>2]=k[W+24>>2];if((A|0)>1){t=1;do{x=c+(t+b)|0;x=(ha(l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24,506832829)|0)>>>17;z=m+(x<<1)|0;y=j[z>>1]|0;k[m+65536+(x<<9)+((y&127)<<2)>>2]=t+B;j[z>>1]=y+1<<16>>16;t=t+1|0}while((t|0)<(A|0))}u=A+b|0;a=F-u|0;if((u+3|0)>>>0>=F>>>0){i=w;t=0;b=34;break}else{i=w;t=0}}if((b|0)==34){d=t+a|0;k[o>>2]=d;d=i;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}}function qd(a,b,c,d,e,f,g,h,i,m,n,o,q,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;m=m|0;n=n|0;o=o|0;q=q|0;s=s|0;var t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;X=r;r=r+80|0;Q=X+68|0;S=X+64|0;O=X+60|0;U=X+40|0;R=X+56|0;T=X+52|0;P=X+48|0;V=X+32|0;W=X;if(a>>>0>2&b>>>0>2){L=b+-3|0;K=c+(L&d)|0;K=(ha(l[K>>0]|l[K+1>>0]<<8|l[K+2>>0]<<16|l[K+3>>0]<<24,506832829)|0)>>>17;M=m+(K<<1)|0;N=j[M>>1]|0;k[m+65536+(K<<10)+((N&255)<<2)>>2]=L;j[M>>1]=N+1<<16>>16;M=b+-2|0;N=c+(M&d)|0;N=(ha(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24,506832829)|0)>>>17;K=m+(N<<1)|0;L=j[K>>1]|0;k[m+65536+(N<<10)+((L&255)<<2)>>2]=M;j[K>>1]=L+1<<16>>16;K=b+-1|0;L=c+(K&d)|0;L=(ha(l[L>>0]|l[L+1>>0]<<8|l[L+2>>0]<<16|l[L+3>>0]<<24,506832829)|0)>>>17;N=m+(L<<1)|0;M=j[N>>1]|0;k[m+65536+(L<<10)+((M&255)<<2)>>2]=K;j[N>>1]=M+1<<16>>16}t=k[o>>2]|0;u=d&b;E=b-u|0;F=u+a|0;G=(i|0)<9?64:512;if((u+3|0)>>>0>=F>>>0){d=q;c=a;g=t;c=g+c|0;k[o>>2]=c;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}H=G<<2;I=F+-4|0;J=F+-3|0;K=(i|0)<4;L=n+4|0;M=n+8|0;N=n+12|0;D=(i|0)>1;i=q;C=G+u|0;a:while(1){w=C+H|0;while(1){b=u+E|0;k[Q>>2]=0;k[S>>2]=0;k[O>>2]=0;p[U>>3]=h;if(xd(m,c,d,e,f,5.4,n,b,a,b>>>0>g>>>0?g:b,Q,S,O,U)|0){w=0;break}t=t+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<10)+((A&255)<<2)>>2]=b;j[B>>1]=A+1<<16>>16;b=u+1|0;do if(b>>>0>C>>>0)if(b>>>0>w>>>0){a=u+17|0;a=I>>>0<a>>>0?I:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<10)+((A&255)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+4|0;b=b+4|0}while(b>>>0<a>>>0)}else{a=u+9|0;a=J>>>0<a>>>0?J:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<10)+((A&255)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+2|0;b=b+2|0}while(b>>>0<a>>>0)}while(0);a=F-b|0;if((b+3|0)>>>0<F>>>0)u=b;else{b=34;break a}}while(1){a=a+-1|0;if(K){b=(k[Q>>2]|0)+-1|0;b=(a|0)<(b|0)?a:b}else b=0;k[R>>2]=b;k[T>>2]=0;k[P>>2]=0;p[V>>3]=h;y=u+E|0;C=y+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<10)+((A&255)<<2)>>2]=y;j[B>>1]=A+1<<16>>16;if(!(xd(m,c,d,e,f,5.4,n,C,a,C>>>0>g>>>0?g:C,R,T,P,V)|0)){b=u;break}v=+p[V>>3];if(!(v>=+p[U>>3]+7.0)){b=u;break}b=u+1|0;t=t+1|0;k[Q>>2]=k[R>>2];k[S>>2]=k[T>>2];k[O>>2]=k[P>>2];p[U>>3]=v;w=w+1|0;if((w|0)>=4)break;else u=b}A=k[Q>>2]|0;C=b+G+(A<<1)|0;B=b+E|0;x=k[O>>2]|0;a=x+16|0;do if(x>>>0<=(B>>>0>g>>>0?g:B)>>>0){y=k[n>>2]|0;if((x|0)==(y|0))a=1;else{z=k[L>>2]|0;u=k[M>>2]|0;if((x|0)!=(z|0))if((x|0)!=(u|0))if((x|0)!=(k[N>>2]|0)){b:do if(D&(x|0)>5){w=4;while(1){if((x|0)==((k[1044+(w<<2)>>2]|0)+(k[n+(k[980+(w<<2)>>2]<<2)>>2]|0)|0)?(x|0)>=(k[1428+(w<<2)>>2]|0):0){a=w;break}w=w+1|0;if((w|0)>=16)break b}a=a+1|0}while(0);if((a|0)<=1)break}else a=4;else{u=x;a=3}else a=2;k[N>>2]=u;k[M>>2]=z;k[L>>2]=y;k[n>>2]=x}}while(0);ud(W,t,A,k[S>>2]|0,a);w=i+32|0;k[i>>2]=k[W>>2];k[i+4>>2]=k[W+4>>2];k[i+8>>2]=k[W+8>>2];k[i+12>>2]=k[W+12>>2];k[i+16>>2]=k[W+16>>2];k[i+20>>2]=k[W+20>>2];k[i+24>>2]=k[W+24>>2];if((A|0)>1){t=1;do{x=c+(t+b)|0;x=(ha(l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24,506832829)|0)>>>17;z=m+(x<<1)|0;y=j[z>>1]|0;k[m+65536+(x<<10)+((y&255)<<2)>>2]=t+B;j[z>>1]=y+1<<16>>16;t=t+1|0}while((t|0)<(A|0))}u=A+b|0;a=F-u|0;if((u+3|0)>>>0>=F>>>0){i=w;t=0;b=34;break}else{i=w;t=0}}if((b|0)==34){d=t+a|0;k[o>>2]=d;d=i;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}}function rd(a,b,c,d,e,f,g,h,i,m,n,q,s,t){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;m=m|0;n=n|0;q=q|0;s=s|0;t=t|0;var u=0,v=0,w=0.0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0,F=0.0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0.0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ia=0;ga=r;r=r+128|0;_=ga+120|0;ba=ga+116|0;X=ga+112|0;ea=ga+80|0;Y=ga+108|0;$=ga+104|0;V=ga+100|0;ca=ga+72|0;R=ga+40|0;Z=ga+96|0;aa=ga+92|0;W=ga+88|0;da=ga+32|0;fa=ga;if(a>>>0>2&b>>>0>2){S=b+-3|0;P=c+(S&d)|0;P=(ha(l[P>>0]|l[P+1>>0]<<8|l[P+2>>0]<<16|l[P+3>>0]<<24,506832829)|0)>>>17;T=m+(P<<1)|0;U=j[T>>1]|0;k[m+65536+(P<<10)+((U&255)<<2)>>2]=S;j[T>>1]=U+1<<16>>16;T=b+-2|0;U=c+(T&d)|0;U=(ha(l[U>>0]|l[U+1>>0]<<8|l[U+2>>0]<<16|l[U+3>>0]<<24,506832829)|0)>>>17;P=m+(U<<1)|0;S=j[P>>1]|0;k[m+65536+(U<<10)+((S&255)<<2)>>2]=T;j[P>>1]=S+1<<16>>16;P=b+-1|0;S=c+(P&d)|0;S=(ha(l[S>>0]|l[S+1>>0]<<8|l[S+2>>0]<<16|l[S+3>>0]<<24,506832829)|0)>>>17;U=m+(S<<1)|0;T=j[U>>1]|0;k[m+65536+(S<<10)+((T&255)<<2)>>2]=P;j[U>>1]=T+1<<16>>16}u=k[q>>2]|0;y=d&b;S=b-y|0;T=y+a|0;U=(i|0)<9?64:512;x=U+y|0;v=b+a|0;if(v>>>0>b>>>0){w=0.0;do{w=w+ +o[e+((b&f)<<2)>>2];b=b+1|0}while((b|0)!=(v|0))}else w=0.0;Q=(a|0)==0?w:w/+(a>>>0);k[_>>2]=0;k[ba>>2]=0;k[X>>2]=0;p[ea>>3]=0.0;if((y+3|0)>>>0>=T>>>0){d=s;c=a;g=u;c=g+c|0;k[q>>2]=c;q=s;q=d-q|0;q=q>>5;s=k[t>>2]|0;q=s+q|0;k[t>>2]=q;r=ga;return}I=U<<2;J=T+-4|0;K=T+-3|0;L=m+33619976|0;M=n+4|0;N=n+8|0;O=n+12|0;P=(i|0)>1;H=(i|0)<4;v=s;w=0.0;G=x;i=y;b=0;a:while(1){y=G+I|0;while(1){x=i+S|0;if((u|0)<8)z=+p[8+(u<<3)>>3]+h;else z=h;k[Y>>2]=0;k[$>>2]=0;k[V>>2]=0;p[ca>>3]=z;if(vd(m,c,d,e,f,Q,n,x,a,x>>>0>g>>>0?g:x,Y,$,V,ca)|0){B=x;F=z;break}u=u+1|0;D=c+i|0;D=(ha(l[D>>0]|l[D+1>>0]<<8|l[D+2>>0]<<16|l[D+3>>0]<<24,506832829)|0)>>>17;b=m+(D<<1)|0;E=j[b>>1]|0;k[m+65536+(D<<10)+((E&255)<<2)>>2]=x;j[b>>1]=E+1<<16>>16;b=i+1|0;do if(b>>>0>G>>>0)if(b>>>0>y>>>0){a=i+17|0;a=J>>>0<a>>>0?J:a;if(b>>>0>=a>>>0)break;do{C=c+b|0;C=(ha(l[C>>0]|l[C+1>>0]<<8|l[C+2>>0]<<16|l[C+3>>0]<<24,506832829)|0)>>>17;E=m+(C<<1)|0;D=j[E>>1]|0;k[m+65536+(C<<10)+((D&255)<<2)>>2]=b+S;j[E>>1]=D+1<<16>>16;u=u+4|0;b=b+4|0}while(b>>>0<a>>>0)}else{a=i+9|0;a=K>>>0<a>>>0?K:a;if(b>>>0>=a>>>0)break;do{C=c+b|0;C=(ha(l[C>>0]|l[C+1>>0]<<8|l[C+2>>0]<<16|l[C+3>>0]<<24,506832829)|0)>>>17;E=m+(C<<1)|0;D=j[E>>1]|0;k[m+65536+(C<<10)+((D&255)<<2)>>2]=b+S;j[E>>1]=D+1<<16>>16;u=u+2|0;b=b+2|0}while(b>>>0<a>>>0)}while(0);a=T-b|0;if((b+3|0)>>>0<T>>>0){i=b;b=0}else{b=56;break a}}if(b&w>+p[ca>>3]){x=v+-32|0;G=j[v+-22>>1]|0;b=k[v+-8>>2]|0;y=(k[v+-28>>2]|0)+-1|0;a=G&65535;if((G&65535)<16)b=a+1|0;else{G=b>>>24;b=(b&16777215)+13+(a+-12-(G<<1)<<G)|0}ud(R,k[v+-32>>2]|0,y,y,b);k[x>>2]=k[R>>2];k[x+4>>2]=k[R+4>>2];k[x+8>>2]=k[R+8>>2];k[x+12>>2]=k[R+12>>2];k[x+16>>2]=k[R+16>>2];k[x+20>>2]=k[R+20>>2];k[x+24>>2]=k[R+24>>2];a=c+i|0;a=(ha(l[a>>0]|l[a+1>>0]<<8|l[a+2>>0]<<16|l[a+3>>0]<<24,506832829)|0)>>>17;E=m+(a<<1)|0;C=j[E>>1]|0;k[m+65536+(a<<10)+((C&255)<<2)>>2]=B;j[E>>1]=C+1<<16>>16;E=k[_>>2]|0;k[Y>>2]=E;k[$>>2]=k[ba>>2];C=k[X>>2]|0;k[V>>2]=C;p[ca>>3]=w;a=i+-1|0}else{D=0;while(1){a=a+-1|0;C=k[Y>>2]|0;if(H){b=C+-1|0;b=(a|0)<(b|0)?a:b}else b=0;k[Z>>2]=b;k[aa>>2]=0;k[W>>2]=0;p[da>>3]=F;x=i+S|0;B=x+1|0;y=c+i|0;y=(ha(l[y>>0]|l[y+1>>0]<<8|l[y+2>>0]<<16|l[y+3>>0]<<24,506832829)|0)>>>17;G=m+(y<<1)|0;E=j[G>>1]|0;k[m+65536+(y<<10)+((E&255)<<2)>>2]=x;j[G>>1]=E+1<<16>>16;B=vd(m,c,d,e,f,Q,n,B,a,B>>>0>g>>>0?g:B,Z,aa,W,da)|0;if((C|0)>3)z=+o[e+((i+4&f)<<2)>>2]-Q+0.0;else z=0.0;b=k[Z>>2]|0;y=b+1-C|0;if((y|0)>0){x=0;do{z=z-(+o[e+((x+i+C&f)<<2)>>2]-Q);x=x+1|0}while((x|0)!=(y|0))}if(!B){b=C;a=i;break}A=+p[da>>3];if(!(A>=+p[ca>>3]+(+(D|0)*.2+2.0+((u|0)<1?z+.97:z)+ +o[e+((i&f)<<2)>>2]*.04))){b=C;a=i;break}i=i+1|0;u=u+1|0;k[Y>>2]=b;k[$>>2]=k[aa>>2];k[V>>2]=k[W>>2];p[ca>>3]=A;D=D+1|0;if((D|0)>=4){a=i;break}}E=b;C=k[V>>2]|0}G=a+U+(E<<1)|0;D=a+S|0;b=C+16|0;D=C>>>0>(D>>>0>g>>>0?g:D)>>>0;do if(!D){y=k[n>>2]|0;if((C|0)==(y|0))b=1;else{B=k[M>>2]|0;i=k[N>>2]|0;if((C|0)!=(B|0))if((C|0)!=(i|0))if((C|0)!=(k[O>>2]|0)){b:do if(P&(C|0)>5){x=4;while(1){if((C|0)==((k[1044+(x<<2)>>2]|0)+(k[n+(k[980+(x<<2)>>2]<<2)>>2]|0)|0)?(C|0)>=(k[1364+(x<<2)>>2]|0):0){b=x;break}x=x+1|0;if((x|0)>=16)break b}b=b+1|0}while(0);if((b|0)<=1)break}else b=4;else{i=C;b=3}else b=2;k[O>>2]=i;k[N>>2]=B;k[M>>2]=y;k[n>>2]=C}}while(0);ud(fa,u,E,k[$>>2]|0,b);B=v+32|0;k[v>>2]=k[fa>>2];k[v+4>>2]=k[fa+4>>2];k[v+8>>2]=k[fa+8>>2];k[v+12>>2]=k[fa+12>>2];k[v+16>>2]=k[fa+16>>2];k[v+20>>2]=k[fa+20>>2];k[v+24>>2]=k[fa+24>>2];u=a+1|0;v=E+-1|0;if((v|0)>1){y=(v|0)>2?v:2;i=a+-1|0;x=a;b=1;while(1){if((x+4|0)>>>0<T>>>0){ia=c+u|0;ia=(ha(l[ia>>0]|l[ia+1>>0]<<8|l[ia+2>>0]<<16|l[ia+3>>0]<<24,506832829)|0)>>>17;C=m+(ia<<1)|0;x=j[C>>1]|0;k[m+65536+(ia<<10)+((x&255)<<2)>>2]=u+S;j[C>>1]=x+1<<16>>16}b=b+1|0;if((b|0)>=(v|0))break;else{x=u;u=u+1|0}}v=i+y|0;u=a+y|0}else v=a;if(D|(v+21|0)>>>0<T>>>0&((E|0)>3&(k[L>>2]|0)!=0)^1)b=0;else{b=u+S|0;p[ea>>3]=F;b=vd(m,c,d,e,f,Q,n,b,T-u|0,b>>>0>g>>>0?g:b,_,ba,X,ea)|0;w=+p[ea>>3]}w=w-+o[e+((u&f)<<2)>>2]+-3.75;p[ea>>3]=w;if((v+4|0)>>>0<T>>>0){D=c+u|0;D=(ha(l[D>>0]|l[D+1>>0]<<8|l[D+2>>0]<<16|l[D+3>>0]<<24,506832829)|0)>>>17;ia=m+(D<<1)|0;E=j[ia>>1]|0;k[m+65536+(D<<10)+((E&255)<<2)>>2]=u+S;j[ia>>1]=E+1<<16>>16}i=v+2|0;a=T-i|0;if((v+5|0)>>>0>=T>>>0){v=B;u=0;b=56;break}else{v=B;u=0}}if((b|0)==56){ia=u+a|0;k[q>>2]=ia;q=v;ia=s;ia=q-ia|0;ia=ia>>5;q=k[t>>2]|0;ia=q+ia|0;k[t>>2]=ia;r=ga;return}}function sd(a,b,c,d,e,f,g,h,i,m,n,q,s,t){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;m=m|0;n=n|0;q=q|0;s=s|0;t=t|0;var u=0,v=0,w=0.0,x=0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;$=r;r=r+80|0;U=$+68|0;W=$+64|0;S=$+60|0;Y=$+40|0;V=$+56|0;X=$+52|0;T=$+48|0;Z=$+32|0;_=$;if(a>>>0>2&b>>>0>2){P=b+-3|0;N=c+(P&d)|0;N=(ha((l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24)&16777215,506832829)|0)>>>17;Q=m+(N<<1)|0;R=j[Q>>1]|0;k[m+65536+(N<<10)+((R&255)<<2)>>2]=P;j[Q>>1]=R+1<<16>>16;Q=b+-2|0;R=c+(Q&d)|0;R=(ha((l[R>>0]|l[R+1>>0]<<8|l[R+2>>0]<<16|l[R+3>>0]<<24)&16777215,506832829)|0)>>>17;N=m+(R<<1)|0;P=j[N>>1]|0;k[m+65536+(R<<10)+((P&255)<<2)>>2]=Q;j[N>>1]=P+1<<16>>16;N=b+-1|0;P=c+(N&d)|0;P=(ha((l[P>>0]|l[P+1>>0]<<8|l[P+2>>0]<<16|l[P+3>>0]<<24)&16777215,506832829)|0)>>>17;R=m+(P<<1)|0;Q=j[R>>1]|0;k[m+65536+(P<<10)+((Q&255)<<2)>>2]=N;j[R>>1]=Q+1<<16>>16}u=k[q>>2]|0;x=d&b;P=b-x|0;Q=x+a|0;R=(i|0)<9?64:512;z=R+x|0;v=b+a|0;if(v>>>0>b>>>0){w=0.0;do{w=w+ +o[e+((b&f)<<2)>>2];b=b+1|0}while((b|0)!=(v|0))}else w=0.0;O=(a|0)==0?w:w/+(a>>>0);if((x+3|0)>>>0>=Q>>>0){d=s;c=a;g=u;c=g+c|0;k[q>>2]=c;q=s;q=d-q|0;q=q>>5;s=k[t>>2]|0;q=s+q|0;k[t>>2]=q;r=$;return}H=R<<2;I=Q+-4|0;J=Q+-3|0;K=(i|0)<4;L=n+4|0;M=n+8|0;N=n+12|0;G=(i|0)>1;v=s;a:while(1){i=z+H|0;while(1){b=x+P|0;if((u|0)<8)w=+p[8+(u<<3)>>3]+h;else w=h;k[U>>2]=0;k[W>>2]=0;k[S>>2]=0;p[Y>>3]=w;if(td(m,c,d,e,f,O,n,b,a,b>>>0>g>>>0?g:b,U,W,S,Y)|0){b=x;E=w;break}u=u+1|0;C=c+x|0;C=(ha((l[C>>0]|l[C+1>>0]<<8|l[C+2>>0]<<16|l[C+3>>0]<<24)&16777215,506832829)|0)>>>17;F=m+(C<<1)|0;D=j[F>>1]|0;k[m+65536+(C<<10)+((D&255)<<2)>>2]=b;j[F>>1]=D+1<<16>>16;b=x+1|0;do if(b>>>0>z>>>0)if(b>>>0>i>>>0){a=x+17|0;a=I>>>0<a>>>0?I:a;if(b>>>0>=a>>>0)break;do{C=c+b|0;C=(ha((l[C>>0]|l[C+1>>0]<<8|l[C+2>>0]<<16|l[C+3>>0]<<24)&16777215,506832829)|0)>>>17;F=m+(C<<1)|0;D=j[F>>1]|0;k[m+65536+(C<<10)+((D&255)<<2)>>2]=b+P;j[F>>1]=D+1<<16>>16;u=u+4|0;b=b+4|0}while(b>>>0<a>>>0)}else{a=x+9|0;a=J>>>0<a>>>0?J:a;if(b>>>0>=a>>>0)break;do{C=c+b|0;C=(ha((l[C>>0]|l[C+1>>0]<<8|l[C+2>>0]<<16|l[C+3>>0]<<24)&16777215,506832829)|0)>>>17;F=m+(C<<1)|0;D=j[F>>1]|0;k[m+65536+(C<<10)+((D&255)<<2)>>2]=b+P;j[F>>1]=D+1<<16>>16;u=u+2|0;b=b+2|0}while(b>>>0<a>>>0)}while(0);a=Q-b|0;if((b+3|0)>>>0<Q>>>0)x=b;else{b=43;break a}}C=0;B=b;while(1){a=a+-1|0;z=k[U>>2]|0;if(K){b=z+-1|0;b=(a|0)<(b|0)?a:b}else b=0;k[V>>2]=b;k[X>>2]=0;k[T>>2]=0;p[Z>>3]=E;x=B+P|0;i=x+1|0;A=c+B|0;A=(ha((l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24)&16777215,506832829)|0)>>>17;F=m+(A<<1)|0;D=j[F>>1]|0;k[m+65536+(A<<10)+((D&255)<<2)>>2]=x;j[F>>1]=D+1<<16>>16;i=td(m,c,d,e,f,O,n,i,a,i>>>0>g>>>0?g:i,V,X,T,Z)|0;if((z|0)>3)w=+o[e+((B+4&f)<<2)>>2]-O+0.0;else w=0.0;A=k[V>>2]|0;x=A+1-z|0;if((x|0)>0){b=0;do{w=w-(+o[e+((b+B+z&f)<<2)>>2]-O);b=b+1|0}while((b|0)!=(x|0))}if(!i){F=z;D=B;break}y=+p[Z>>3];if(!(y>=+p[Y>>3]+(+(C|0)*.2+2.0+((u|0)<1?w+.97:w)+ +o[e+((B&f)<<2)>>2]*.04))){F=z;D=B;break}b=B+1|0;u=u+1|0;k[U>>2]=A;k[W>>2]=k[X>>2];k[S>>2]=k[T>>2];p[Y>>3]=y;C=C+1|0;if((C|0)>=4){F=A;D=b;break}else B=b}z=D+R+(F<<1)|0;C=D+P|0;i=k[S>>2]|0;b=i+16|0;do if(i>>>0<=(C>>>0>g>>>0?g:C)>>>0){A=k[n>>2]|0;if((i|0)==(A|0))b=1;else{B=k[L>>2]|0;a=k[M>>2]|0;if((i|0)!=(B|0))if((i|0)!=(a|0))if((i|0)!=(k[N>>2]|0)){b:do if(G&(i|0)>5){x=4;while(1){if((i|0)==((k[1044+(x<<2)>>2]|0)+(k[n+(k[980+(x<<2)>>2]<<2)>>2]|0)|0)?(i|0)>=(k[1108+(x<<2)>>2]|0):0){b=x;break}x=x+1|0;if((x|0)>=16)break b}b=b+1|0}while(0);if((b|0)<=1)break}else b=4;else{a=i;b=3}else b=2;k[N>>2]=a;k[M>>2]=B;k[L>>2]=A;k[n>>2]=i}}while(0);ud(_,u,F,k[W>>2]|0,b);b=v+32|0;k[v>>2]=k[_>>2];k[v+4>>2]=k[_+4>>2];k[v+8>>2]=k[_+8>>2];k[v+12>>2]=k[_+12>>2];k[v+16>>2]=k[_+16>>2];k[v+20>>2]=k[_+20>>2];k[v+24>>2]=k[_+24>>2];if((F|0)>1){u=1;do{i=c+(u+D)|0;i=(ha((l[i>>0]|l[i+1>>0]<<8|l[i+2>>0]<<16|l[i+3>>0]<<24)&16777215,506832829)|0)>>>17;B=m+(i<<1)|0;A=j[B>>1]|0;k[m+65536+(i<<10)+((A&255)<<2)>>2]=u+C;j[B>>1]=A+1<<16>>16;u=u+1|0}while((u|0)<(F|0))}x=F+D|0;a=Q-x|0;if((x+3|0)>>>0>=Q>>>0){v=b;u=0;b=43;break}else{v=b;u=0}}if((b|0)==43){d=u+a|0;k[q>>2]=d;d=v;q=s;q=d-q|0;q=q>>5;s=k[t>>2]|0;q=s+q|0;k[t>>2]=q;r=$;return}}function td(a,b,c,d,e,f,g,h,m,n,q,r,s,t){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;h=h|0;m=m|0;n=n|0;q=q|0;r=r|0;s=s|0;t=t|0;var u=0.0,v=0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0.0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0.0,N=0,O=0,P=0,Q=0,R=0.0,S=0;k[r>>2]=0;Q=h&c;if(!d){M=0.0;R=0.0;D=0.0}else{D=+o[d+((h&e)<<2)>>2]+ +o[d+((h+1&e)<<2)>>2];R=D+ +o[d+((h+2&e)<<2)>>2];M=R-f*3.0+.3;R=R+ +o[d+((h+3&e)<<2)>>2]-f*4.0;D=D-f*2.0+1.2}u=+p[t>>3];w=k[q>>2]|0;k[q>>2]=0;N=b+Q|0;I=b+(Q+m)|0;K=m+-4|0;J=b+(K+Q)|0;K=(K|0)<0;B=0;d=0;do{y=(k[1044+(B<<2)>>2]|0)+(k[g+(k[980+(B<<2)>>2]<<2)>>2]|0)|0;e=h-y|0;do if(((!(y>>>0>n>>>0|e>>>0>=h>>>0)?(C=e&c,E=w+Q|0,E>>>0<=c>>>0):0)?(F=C+w|0,F>>>0<=c>>>0):0)?(i[b+E>>0]|0)==(i[b+F>>0]|0):0){a:do if(K){e=0;x=N}else{e=0;x=N;do{H=b+(e+C)|0;if((l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24|0)!=(l[H>>0]|l[H+1>>0]<<8|l[H+2>>0]<<16|l[H+3>>0]<<24|0))break a;x=x+4|0;e=e+4|0}while(x>>>0<=J>>>0)}while(0);b:do if(x>>>0<I>>>0)do{if((i[b+(e+C)>>0]|0)!=(i[x>>0]|0))break b;x=x+1|0;e=e+1|0}while(x>>>0<I>>>0);while(0);if(e>>>0<3?!((B|0)<2&(e|0)==2):0)break;A=+(e|0)*f-+p[72+(B<<3)>>3];switch(e|0){case 2:{z=D;break}case 3:{z=M;break}default:z=R}z=A+z;if(u<z){k[q>>2]=e;k[r>>2]=e;k[s>>2]=y;p[t>>3]=z;w=e;u=z;d=1}}while(0);B=B+1|0}while((B|0)!=16);C=h+-64|0;C=(C|0)<0?0:C;A=D+-1.0;e=h+-1|0;c:do if((e|0)>(C|0)){B=b+(Q+1)|0;D=f*2.0;y=w;z=u;while(1){x=e;while(1){e=h-x|0;if(e>>>0>n>>>0){w=y;u=z;break c}H=x&c;if((i[N>>0]|0)==(i[b+H>>0]|0)?(i[B>>0]|0)==(i[b+(H+1)>>0]|0):0){if((x|0)==(h|0))w=-1;else w=(ja(e|0)|0)^31;u=A+(D-+(w|0)*2.3);if(z<u){d=x;break}}x=x+-1|0;if((x|0)<=(C|0)){w=y;u=z;break c}}k[q>>2]=2;k[r>>2]=2;k[s>>2]=e;e=d+-1|0;if((e|0)<=(C|0)){w=2;d=1;break}else{y=2;z=u;d=1}}}while(0);G=(ha((l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24)&16777215,506832829)|0)>>>17;H=j[a+(G<<1)>>1]|0;e=H&65535;H=(H&65535)>256?e+-256|0:0;d:do if((e|0)>(H|0)){g=w;z=u;while(1){F=g+Q|0;E=F>>>0>c>>>0;F=b+F|0;while(1){e=e+-1|0;C=k[a+65536+(G<<10)+((e&255)<<2)>>2]|0;if((C|0)>-1){w=h-C|0;if(w>>>0>n>>>0)break d;B=C&c;if((!E?(L=B+g|0,L>>>0<=c>>>0):0)?(i[F>>0]|0)==(i[b+L>>0]|0):0){e:do if(K){x=0;y=N}else{x=0;y=N;do{S=b+(x+B)|0;if((l[y>>0]|l[y+1>>0]<<8|l[y+2>>0]<<16|l[y+3>>0]<<24|0)!=(l[S>>0]|l[S+1>>0]<<8|l[S+2>>0]<<16|l[S+3>>0]<<24|0))break e;y=y+4|0;x=x+4|0}while(y>>>0<=J>>>0)}while(0);f:do if(y>>>0<I>>>0)do{if((i[b+(x+B)>>0]|0)!=(i[y>>0]|0))break f;y=y+1|0;x=x+1|0}while(y>>>0<I>>>0);while(0);if(x>>>0>=3){if((C|0)==(h|0))u=-1.2;else u=+((ja(w|0)|0)^31|0)*1.2;u=(x>>>0>3?R:M)+(+(x|0)*f-u);if(z<u){d=x;break}}}}if((e|0)<=(H|0))break d}k[q>>2]=d;k[r>>2]=d;k[s>>2]=w;p[t>>3]=u;if((e|0)>(H|0)){g=d;z=u;d=1}else{d=1;break}}return d|0}else z=u;while(0);if(d){S=1;return S|0}F=a+33619972|0;g=k[F>>2]|0;B=a+33619968|0;C=k[B>>2]|0;if(g>>>0<C>>>7>>>0){S=0;return S|0}y=(ha(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24,506832829)|0)>>>18<<1;E=n+1|0;k[B>>2]=C+1;S=j[6488+(y<<1)>>1]|0;d=S&65535;if(S<<16>>16!=0?(v=d&31,O=d>>>5,v>>>0<=m>>>0):0){w=(k[2420+(v<<2)>>2]|0)+(ha(v,O)|0)|0;e=72438+w|0;x=72438+(w+v)|0;w=72438+(v+-4+w)|0;g:do if(v>>>0<4)d=0;else{d=0;do{S=b+(d+Q)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[S>>0]|l[S+1>>0]<<8|l[S+2>>0]<<16|l[S+3>>0]<<24|0))break g;e=e+4|0;d=d+4|0}while(e>>>0<=w>>>0)}while(0);h:do if(e>>>0<x>>>0)do{if((i[b+(d+Q)>>0]|0)!=(i[e>>0]|0))break h;e=e+1|0;d=d+1|0}while(e>>>0<x>>>0);while(0);if((d|0)==(v|0)){d=E+O|0;if(!d)u=-1.2;else u=+((ja(d|0)|0)^31|0)*1.2;u=R+(+(v|0)*f-u);if(!(z<u))P=67}else P=67}else P=67;if((P|0)==67){k[B>>2]=C+2;S=j[6488+((y|1)<<1)>>1]|0;d=S&65535;if(!(S<<16>>16)){S=0;return S|0}v=d&31;y=d>>>5;if(v>>>0>m>>>0){S=0;return S|0}w=(k[2420+(v<<2)>>2]|0)+(ha(v,y)|0)|0;e=72438+w|0;x=72438+(w+v)|0;w=72438+(v+-4+w)|0;i:do if(v>>>0<4)d=0;else{d=0;do{S=b+(d+Q)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[S>>0]|l[S+1>>0]<<8|l[S+2>>0]<<16|l[S+3>>0]<<24|0))break i;e=e+4|0;d=d+4|0}while(e>>>0<=w>>>0)}while(0);j:do if(e>>>0<x>>>0)do{if((i[b+(d+Q)>>0]|0)!=(i[e>>0]|0))break j;e=e+1|0;d=d+1|0}while(e>>>0<x>>>0);while(0);if((d|0)!=(v|0)){S=0;return S|0}d=E+y|0;if(!d)u=-1.2;else u=+((ja(d|0)|0)^31|0)*1.2;u=R+(+(v|0)*f-u);if(!(z<u)){S=0;return S|0}}k[F>>2]=g+1;k[q>>2]=v;k[r>>2]=v;k[s>>2]=d;p[t>>3]=u;S=1;return S|0}function ud(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,l=0,m=0,n=0,o=0,p=0;k[a>>2]=b;k[a+4>>2]=c;c=a+10|0;if((e|0)<17){p=e+65535&65535;j[c>>1]=p;c=0}else{m=e+-13|0;o=((ja(m|0)|0)^31)+-1|0;n=m>>o;p=(o<<1)+12+n&65535;j[c>>1]=p;c=m-(n<<o)|o<<24}k[a+24>>2]=c;o=a+8|0;i=a+16|0;do if((b|0)>=6){if((b|0)<130){n=b+-2|0;g=((ja(n|0)|0)^31)+-1|0;g=(n>>g)+2+(g<<1)|0;break}if((b|0)<2114){g=((ja(b+-66|0)|0)^31)+10|0;break}if((b|0)<6210)g=21;else g=(b|0)<22594?22:23}else g=b;while(0);do if((d|0)>=10){if((d|0)<134){n=d+-6|0;h=((ja(n|0)|0)^31)+-1|0;h=(n>>h)+4+(h<<1)|0;break}if((d|0)<2118)h=((ja(d+-70|0)|0)^31)+12|0;else h=23}else h=d+-2|0;while(0);l=k[2092+(g<<2)>>2]|0;m=ii(k[1172+(h<<2)>>2]|0,0,l|0,((l|0)<0)<<31>>31|0)|0;n=L;b=b-(k[2188+(g<<2)>>2]|0)|0;f=((b|0)<0)<<31>>31;c=d-(k[1268+(h<<2)>>2]|0)|0;e=((c|0)<0)<<31>>31;a=h&7|g<<3&56;if(p<<16>>16==0&(g|0)<8&(h|0)<16){d=(h|0)<8?a:a|64;d=d&65535;j[o>>1]=d;o=hi(m|0,n|0,48)|0;d=L;n=hi(c|0,e|0,l|0)|0;p=L;o=b|o;d=f|d;n=o|n;p=d|p;d=i;o=d;k[o>>2]=n;d=d+4|0;k[d>>2]=p;return}else{d=k[2284+((h>>3)+((g>>3)*3|0)<<2)>>2]<<6|a;d=d&65535;j[o>>1]=d;o=hi(m|0,n|0,48)|0;d=L;n=hi(c|0,e|0,l|0)|0;p=L;o=b|o;d=f|d;n=o|n;p=d|p;d=i;o=d;k[o>>2]=n;d=d+4|0;k[d>>2]=p;return}}function vd(a,b,c,d,e,f,g,h,m,n,q,s,t,u){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;h=h|0;m=m|0;n=n|0;q=q|0;s=s|0;t=t|0;u=u|0;var v=0,w=0.0,x=0.0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0.0,L=0,M=0,N=0,O=0,P=0,Q=0.0,R=0,S=0,T=0;S=r;r=r+16|0;R=S;k[s>>2]=0;O=h&c;if(!d){K=0.0;Q=0.0}else{Q=+o[d+((h&e)<<2)>>2]+ +o[d+((h+1&e)<<2)>>2]+ +o[d+((h+2&e)<<2)>>2];K=Q-f*3.0+.3;Q=Q+ +o[d+((h+3&e)<<2)>>2]-f*4.0}w=+p[u>>3];z=k[q>>2]|0;k[q>>2]=0;P=b+O|0;H=b+(O+m)|0;J=m+-4|0;I=b+(J+O)|0;J=(J|0)<0;B=0;d=0;do{A=(k[1044+(B<<2)>>2]|0)+(k[g+(k[980+(B<<2)>>2]<<2)>>2]|0)|0;e=h-A|0;if(((!(A>>>0>n>>>0|e>>>0>=h>>>0)?(C=e&c,D=z+O|0,D>>>0<=c>>>0):0)?(E=C+z|0,E>>>0<=c>>>0):0)?(i[b+D>>0]|0)==(i[b+E>>0]|0):0){a:do if(J){e=0;y=P}else{e=0;y=P;do{G=b+(e+C)|0;if((l[y>>0]|l[y+1>>0]<<8|l[y+2>>0]<<16|l[y+3>>0]<<24|0)!=(l[G>>0]|l[G+1>>0]<<8|l[G+2>>0]<<16|l[G+3>>0]<<24|0))break a;y=y+4|0;e=e+4|0}while(y>>>0<=I>>>0)}while(0);b:do if(y>>>0<H>>>0)do{if((i[b+(e+C)>>0]|0)!=(i[y>>0]|0))break b;y=y+1|0;e=e+1|0}while(y>>>0<H>>>0);while(0);if(e>>>0>=4?(x=Q+(+(e|0)*f-+p[72+(B<<3)>>3]),w<x):0){k[q>>2]=e;k[s>>2]=e;k[t>>2]=A;p[u>>3]=x;z=e;w=x;d=1}}B=B+1|0}while((B|0)!=16);F=(ha(l[P>>0]|l[P+1>>0]<<8|l[P+2>>0]<<16|l[P+3>>0]<<24,506832829)|0)>>>17;G=j[a+(F<<1)>>1]|0;e=G&65535;G=(G&65535)>256?e+-256|0:0;c:do if((e|0)>(G|0)){x=w;while(1){g=z+O|0;E=g>>>0>c>>>0;g=b+g|0;while(1){e=e+-1|0;C=k[a+65536+(F<<10)+((e&255)<<2)>>2]|0;if((C|0)>-1){D=h-C|0;if(D>>>0>n>>>0){N=37;break c}B=C&c;if((!E?(L=B+z|0,L>>>0<=c>>>0):0)?(i[g>>0]|0)==(i[b+L>>0]|0):0){d:do if(J){y=0;A=P}else{y=0;A=P;do{T=b+(y+B)|0;if((l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24|0)!=(l[T>>0]|l[T+1>>0]<<8|l[T+2>>0]<<16|l[T+3>>0]<<24|0))break d;A=A+4|0;y=y+4|0}while(A>>>0<=I>>>0)}while(0);e:do if(A>>>0<H>>>0)do{if((i[b+(y+B)>>0]|0)!=(i[A>>0]|0))break e;A=A+1|0;y=y+1|0}while(A>>>0<H>>>0);while(0);if(y>>>0>=4){if((C|0)==(h|0))w=-1.2;else w=+((ja(D|0)|0)^31|0)*1.2;w=(y>>>0>3?Q:K)+(+(y|0)*f-w);if(x<w){d=D;z=y;break}}}}if((e|0)<=(G|0)){N=37;break c}}k[q>>2]=z;k[s>>2]=z;k[t>>2]=d;p[u>>3]=w;if((e|0)>(G|0)){x=w;d=1}else{d=1;break}}}else{x=w;N=37}while(0);do if((N|0)==37)if(!d){g=a+33619972|0;F=k[g>>2]|0;B=a+33619968|0;C=k[B>>2]|0;if(F>>>0<C>>>7>>>0){w=x;d=0}else{D=(ha(l[P>>0]|l[P+1>>0]<<8|l[P+2>>0]<<16|l[P+3>>0]<<24,506832829)|0)>>>18<<1;E=n+1|0;k[B>>2]=C+1;T=j[6488+(D<<1)>>1]|0;d=T&65535;if(T<<16>>16!=0?(v=d&31,M=d>>>5,v>>>0<=m>>>0):0){y=(k[2420+(v<<2)>>2]|0)+(ha(v,M)|0)|0;e=72438+y|0;A=72438+(y+v)|0;y=72438+(v+-4+y)|0;f:do if(v>>>0<4)d=0;else{d=0;do{T=b+(d+O)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[T>>0]|l[T+1>>0]<<8|l[T+2>>0]<<16|l[T+3>>0]<<24|0))break f;e=e+4|0;d=d+4|0}while(e>>>0<=y>>>0)}while(0);g:do if(e>>>0<A>>>0)do{if((i[b+(d+O)>>0]|0)!=(i[e>>0]|0))break g;e=e+1|0;d=d+1|0}while(e>>>0<A>>>0);while(0);if((d|0)==(v|0)){d=E+M|0;if(!d)w=-1.2;else w=+((ja(d|0)|0)^31|0)*1.2;w=Q+(+(v|0)*f-w);if(!(x<w))N=52}else N=52}else N=52;if((N|0)==52){k[B>>2]=C+2;T=j[6488+((D|1)<<1)>>1]|0;d=T&65535;if(!(T<<16>>16)){w=x;d=0;break}v=d&31;B=d>>>5;if(v>>>0>m>>>0){w=x;d=0;break}y=(k[2420+(v<<2)>>2]|0)+(ha(v,B)|0)|0;e=72438+y|0;A=72438+(y+v)|0;y=72438+(v+-4+y)|0;h:do if(v>>>0<4)d=0;else{d=0;do{T=b+(d+O)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[T>>0]|l[T+1>>0]<<8|l[T+2>>0]<<16|l[T+3>>0]<<24|0))break h;e=e+4|0;d=d+4|0}while(e>>>0<=y>>>0)}while(0);i:do if(e>>>0<A>>>0)do{if((i[b+(d+O)>>0]|0)!=(i[e>>0]|0))break i;e=e+1|0;d=d+1|0}while(e>>>0<A>>>0);while(0);if((d|0)!=(v|0)){w=x;d=0;break}d=E+B|0;if(!d)w=-1.2;else w=+((ja(d|0)|0)^31|0)*1.2;w=Q+(+(v|0)*f-w);if(!(x<w)){w=x;d=0;break}}k[g>>2]=F+1;k[q>>2]=v;k[s>>2]=v;k[t>>2]=d;p[u>>3]=w;z=v;d=1}}else{w=x;d=1}while(0);E=a+33619976|0;v=k[E>>2]|0;if(!v){T=d;r=S;return T|0}y=l[P>>0]|l[P+1>>0]<<8|l[P+2>>0]<<16|l[P+3>>0]<<24;A=k[v+24>>2]|0;j:do if(A){B=A+-1|0;C=(B&A|0)==0;if(C)D=B&y;else D=(y>>>0)%(A>>>0)|0;v=k[(k[v+20>>2]|0)+(D<<2)>>2]|0;if(v){do{v=k[v>>2]|0;if(!v){v=0;break j}e=k[v+4>>2]|0;if(C)e=e&B;else e=(e>>>0)%(A>>>0)|0;if((e|0)!=(D|0)){v=0;break j}}while((k[v+8>>2]|0)!=(y|0));v=k[v+12>>2]|0}else v=0}else v=0;while(0);v=v>>>0>m>>>0?m:v;if(!((v|0)>(z|0)&(v|0)>3)){T=d;r=S;return T|0}A=n+1|0;x=w;y=v;while(1){ai(R,P,y);v=wd(k[E>>2]|0,R)|0;if(v){v=k[v+20>>2]|0;e=A+(v>>6)|0;if(!e)w=-1.2;else w=+((ja(e|0)|0)^31|0)*1.2;w=Q+(+(y|0)*f-w);if(x<w){k[q>>2]=y;k[s>>2]=v&63;k[t>>2]=e;p[u>>3]=w;v=y;d=1}else{v=z;w=x}}else{v=z;w=x}bi(R);y=y+-1|0;if(!((y|0)>(v|0)&(y|0)>3))break;else{z=v;x=w}}r=S;return d|0}function wd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,m=0,n=0;m=i[b>>0]|0;j=(m&1)==0;n=j?b+1|0:k[b+8>>2]|0;m=j?(m&255)>>>1:k[b+4>>2]|0;if(m>>>0>3){c=m;d=n;b=m;while(1){j=ha(l[d>>0]|l[d+1>>0]<<8|l[d+2>>0]<<16|l[d+3>>0]<<24,1540483477)|0;b=(ha(j>>>24^j,1540483477)|0)^(ha(b,1540483477)|0);c=c+-4|0;if(c>>>0<=3)break;else d=d+4|0}c=m+-4|0;d=c&-4;c=c-d|0;d=n+(d+4)|0}else{c=m;d=n;b=m}switch(c|0){case 3:{b=l[d+2>>0]<<16^b;e=6;break}case 2:{e=6;break}case 1:{e=7;break}default:{}}if((e|0)==6){b=l[d+1>>0]<<8^b;e=7}if((e|0)==7)b=ha(l[d>>0]^b,1540483477)|0;b=ha(b>>>13^b,1540483477)|0;b=b>>>15^b;g=k[a+4>>2]|0;if(!g){n=0;return n|0}h=g+-1|0;j=(h&g|0)==0;if(j)f=b&h;else f=(b>>>0)%(g>>>0)|0;b=k[(k[a>>2]|0)+(f<<2)>>2]|0;if(!b){n=0;return n|0}b=k[b>>2]|0;if(!b){n=0;return n|0}a=(m|0)==0;a:while(1){c=k[b+4>>2]|0;if(j)c=c&h;else c=(c>>>0)%(g>>>0)|0;if((c|0)!=(f|0)){b=0;e=26;break}c=b+8|0;e=i[c>>0]|0;d=(e&1)==0;b:do if(((d?(e&255)>>>1:k[b+12>>2]|0)|0)==(m|0)){c=d?c+1|0:k[b+16>>2]|0;if(!d)if(!(mh(c,n,m)|0)){e=26;break a}else break;if(a){e=26;break a}else{e=m;d=n}while(1){if((i[c>>0]|0)!=(i[d>>0]|0))break b;e=e+-1|0;if(!e){e=26;break a}else{c=c+1|0;d=d+1|0}}}while(0);b=k[b>>2]|0;if(!b){b=0;e=26;break}}if((e|0)==26)return b|0;return 0}function xd(a,b,c,d,e,f,g,h,m,n,o,q,r,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;h=h|0;m=m|0;n=n|0;o=o|0;q=q|0;r=r|0;s=s|0;var t=0.0,u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;k[q>>2]=0;M=h&c;t=+p[s>>3];v=k[o>>2]|0;k[o>>2]=0;J=b+M|0;F=b+(M+m)|0;H=m+-4|0;G=b+(H+M)|0;H=(H|0)<0;z=0;d=0;do{x=(k[1044+(z<<2)>>2]|0)+(k[g+(k[980+(z<<2)>>2]<<2)>>2]|0)|0;e=h-x|0;if(((!(x>>>0>n>>>0|e>>>0>=h>>>0)?(A=e&c,B=v+M|0,B>>>0<=c>>>0):0)?(C=A+v|0,C>>>0<=c>>>0):0)?(i[b+B>>0]|0)==(i[b+C>>0]|0):0){a:do if(H){e=0;w=J}else{e=0;w=J;do{E=b+(e+A)|0;if((l[w>>0]|l[w+1>>0]<<8|l[w+2>>0]<<16|l[w+3>>0]<<24|0)!=(l[E>>0]|l[E+1>>0]<<8|l[E+2>>0]<<16|l[E+3>>0]<<24|0))break a;w=w+4|0;e=e+4|0}while(w>>>0<=G>>>0)}while(0);b:do if(w>>>0<F>>>0)do{if((i[b+(e+A)>>0]|0)!=(i[w>>0]|0))break b;w=w+1|0;e=e+1|0}while(w>>>0<F>>>0);while(0);if(e>>>0>=4?(y=+(e|0)*f-+p[72+(z<<3)>>3],t<y):0){k[o>>2]=e;k[q>>2]=e;k[r>>2]=x;p[s>>3]=y;v=e;t=y;d=1}}z=z+1|0}while((z|0)!=16);D=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>17;E=j[a+(D<<1)>>1]|0;e=E&65535;E=(E&65535)>256?e+-256|0:0;c:do if((e|0)>(E|0)){while(1){g=v+M|0;C=g>>>0>c>>>0;g=b+g|0;while(1){e=e+-1|0;A=k[a+65536+(D<<10)+((e&255)<<2)>>2]|0;if((A|0)>-1){B=h-A|0;if(B>>>0>n>>>0){y=t;break c}z=A&c;if((!C?(I=z+v|0,I>>>0<=c>>>0):0)?(i[g>>0]|0)==(i[b+I>>0]|0):0){d:do if(H){w=0;x=J}else{w=0;x=J;do{N=b+(w+z)|0;if((l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break d;x=x+4|0;w=w+4|0}while(x>>>0<=G>>>0)}while(0);e:do if(x>>>0<F>>>0)do{if((i[b+(w+z)>>0]|0)!=(i[x>>0]|0))break e;x=x+1|0;w=w+1|0}while(x>>>0<F>>>0);while(0);if(w>>>0>=4){if((A|0)==(h|0))y=-1.2;else y=+((ja(B|0)|0)^31|0)*1.2;y=+(w|0)*f-y;if(t<y){v=B;t=y;d=w;break}}}}if((e|0)<=(E|0)){y=t;break c}}k[o>>2]=d;k[q>>2]=d;k[r>>2]=v;p[s>>3]=t;if((e|0)>(E|0)){v=d;d=1}else{d=1;break}}return d|0}else y=t;while(0);if(d){N=1;return N|0}C=a+33619972|0;g=k[C>>2]|0;z=a+33619968|0;A=k[z>>2]|0;if(g>>>0<A>>>7>>>0){N=0;return N|0}x=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>18<<1;B=n+1|0;k[z>>2]=A+1;N=j[6488+(x<<1)>>1]|0;d=N&65535;if(N<<16>>16!=0?(u=d&31,K=d>>>5,u>>>0<=m>>>0):0){v=(k[2420+(u<<2)>>2]|0)+(ha(u,K)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;f:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break f;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);g:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break g;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)==(u|0)){d=B+K|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t))L=50}else L=50}else L=50;if((L|0)==50){k[z>>2]=A+2;N=j[6488+((x|1)<<1)>>1]|0;d=N&65535;if(!(N<<16>>16)){N=0;return N|0}u=d&31;x=d>>>5;if(u>>>0>m>>>0){N=0;return N|0}v=(k[2420+(u<<2)>>2]|0)+(ha(u,x)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;h:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break h;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);i:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break i;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)!=(u|0)){N=0;return N|0}d=B+x|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t)){N=0;return N|0}}k[C>>2]=g+1;k[o>>2]=u;k[q>>2]=u;k[r>>2]=d;p[s>>3]=t;N=1;return N|0}function yd(a,b,c,d,e,f,g,h,m,n,o,q,r,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;h=h|0;m=m|0;n=n|0;o=o|0;q=q|0;r=r|0;s=s|0;var t=0.0,u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;k[q>>2]=0;M=h&c;t=+p[s>>3];v=k[o>>2]|0;k[o>>2]=0;J=b+M|0;F=b+(M+m)|0;H=m+-4|0;G=b+(H+M)|0;H=(H|0)<0;z=0;d=0;do{x=(k[1044+(z<<2)>>2]|0)+(k[g+(k[980+(z<<2)>>2]<<2)>>2]|0)|0;e=h-x|0;if(((!(x>>>0>n>>>0|e>>>0>=h>>>0)?(A=e&c,B=v+M|0,B>>>0<=c>>>0):0)?(C=A+v|0,C>>>0<=c>>>0):0)?(i[b+B>>0]|0)==(i[b+C>>0]|0):0){a:do if(H){e=0;w=J}else{e=0;w=J;do{E=b+(e+A)|0;if((l[w>>0]|l[w+1>>0]<<8|l[w+2>>0]<<16|l[w+3>>0]<<24|0)!=(l[E>>0]|l[E+1>>0]<<8|l[E+2>>0]<<16|l[E+3>>0]<<24|0))break a;w=w+4|0;e=e+4|0}while(w>>>0<=G>>>0)}while(0);b:do if(w>>>0<F>>>0)do{if((i[b+(e+A)>>0]|0)!=(i[w>>0]|0))break b;w=w+1|0;e=e+1|0}while(w>>>0<F>>>0);while(0);if(e>>>0>=4?(y=+(e|0)*f-+p[72+(z<<3)>>3],t<y):0){k[o>>2]=e;k[q>>2]=e;k[r>>2]=x;p[s>>3]=y;v=e;t=y;d=1}}z=z+1|0}while((z|0)!=10);D=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>17;E=j[a+(D<<1)>>1]|0;e=E&65535;E=(E&65535)>128?e+-128|0:0;c:do if((e|0)>(E|0)){while(1){g=v+M|0;C=g>>>0>c>>>0;g=b+g|0;while(1){e=e+-1|0;A=k[a+65536+(D<<9)+((e&127)<<2)>>2]|0;if((A|0)>-1){B=h-A|0;if(B>>>0>n>>>0){y=t;break c}z=A&c;if((!C?(I=z+v|0,I>>>0<=c>>>0):0)?(i[g>>0]|0)==(i[b+I>>0]|0):0){d:do if(H){w=0;x=J}else{w=0;x=J;do{N=b+(w+z)|0;if((l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break d;x=x+4|0;w=w+4|0}while(x>>>0<=G>>>0)}while(0);e:do if(x>>>0<F>>>0)do{if((i[b+(w+z)>>0]|0)!=(i[x>>0]|0))break e;x=x+1|0;w=w+1|0}while(x>>>0<F>>>0);while(0);if(w>>>0>=4){if((A|0)==(h|0))y=-1.2;else y=+((ja(B|0)|0)^31|0)*1.2;y=+(w|0)*f-y;if(t<y){v=B;t=y;d=w;break}}}}if((e|0)<=(E|0)){y=t;break c}}k[o>>2]=d;k[q>>2]=d;k[r>>2]=v;p[s>>3]=t;if((e|0)>(E|0)){v=d;d=1}else{d=1;break}}return d|0}else y=t;while(0);if(d){N=1;return N|0}C=a+16842756|0;g=k[C>>2]|0;z=a+16842752|0;A=k[z>>2]|0;if(g>>>0<A>>>7>>>0){N=0;return N|0}x=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>18<<1;B=n+1|0;k[z>>2]=A+1;N=j[6488+(x<<1)>>1]|0;d=N&65535;if(N<<16>>16!=0?(u=d&31,K=d>>>5,u>>>0<=m>>>0):0){v=(k[2420+(u<<2)>>2]|0)+(ha(u,K)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;f:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break f;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);g:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break g;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)==(u|0)){d=B+K|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t))L=50}else L=50}else L=50;if((L|0)==50){k[z>>2]=A+2;N=j[6488+((x|1)<<1)>>1]|0;d=N&65535;if(!(N<<16>>16)){N=0;return N|0}u=d&31;x=d>>>5;if(u>>>0>m>>>0){N=0;return N|0}v=(k[2420+(u<<2)>>2]|0)+(ha(u,x)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;h:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break h;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);i:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break i;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)!=(u|0)){N=0;return N|0}d=B+x|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t)){N=0;return N|0}}k[C>>2]=g+1;k[o>>2]=u;k[q>>2]=u;k[r>>2]=d;p[s>>3]=t;N=1;return N|0}function zd(a,b,c,d,e,f,g,h,m,n,o,q,r,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;h=h|0;m=m|0;n=n|0;o=o|0;q=q|0;r=r|0;s=s|0;var t=0.0,u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;k[q>>2]=0;M=h&c;t=+p[s>>3];v=k[o>>2]|0;k[o>>2]=0;J=b+M|0;F=b+(M+m)|0;H=m+-4|0;G=b+(H+M)|0;H=(H|0)<0;z=0;d=0;do{x=(k[1044+(z<<2)>>2]|0)+(k[g+(k[980+(z<<2)>>2]<<2)>>2]|0)|0;e=h-x|0;if(((!(x>>>0>n>>>0|e>>>0>=h>>>0)?(A=e&c,B=v+M|0,B>>>0<=c>>>0):0)?(C=A+v|0,C>>>0<=c>>>0):0)?(i[b+B>>0]|0)==(i[b+C>>0]|0):0){a:do if(H){e=0;w=J}else{e=0;w=J;do{E=b+(e+A)|0;if((l[w>>0]|l[w+1>>0]<<8|l[w+2>>0]<<16|l[w+3>>0]<<24|0)!=(l[E>>0]|l[E+1>>0]<<8|l[E+2>>0]<<16|l[E+3>>0]<<24|0))break a;w=w+4|0;e=e+4|0}while(w>>>0<=G>>>0)}while(0);b:do if(w>>>0<F>>>0)do{if((i[b+(e+A)>>0]|0)!=(i[w>>0]|0))break b;w=w+1|0;e=e+1|0}while(w>>>0<F>>>0);while(0);if(e>>>0>=4?(y=+(e|0)*f-+p[72+(z<<3)>>3],t<y):0){k[o>>2]=e;k[q>>2]=e;k[r>>2]=x;p[s>>3]=y;v=e;t=y;d=1}}z=z+1|0}while((z|0)!=10);D=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>17;E=j[a+(D<<1)>>1]|0;e=E&65535;E=(E&65535)>64?e+-64|0:0;c:do if((e|0)>(E|0)){while(1){g=v+M|0;C=g>>>0>c>>>0;g=b+g|0;while(1){e=e+-1|0;A=k[a+65536+(D<<8)+((e&63)<<2)>>2]|0;if((A|0)>-1){B=h-A|0;if(B>>>0>n>>>0){y=t;break c}z=A&c;if((!C?(I=z+v|0,I>>>0<=c>>>0):0)?(i[g>>0]|0)==(i[b+I>>0]|0):0){d:do if(H){w=0;x=J}else{w=0;x=J;do{N=b+(w+z)|0;if((l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break d;x=x+4|0;w=w+4|0}while(x>>>0<=G>>>0)}while(0);e:do if(x>>>0<F>>>0)do{if((i[b+(w+z)>>0]|0)!=(i[x>>0]|0))break e;x=x+1|0;w=w+1|0}while(x>>>0<F>>>0);while(0);if(w>>>0>=4){if((A|0)==(h|0))y=-1.2;else y=+((ja(B|0)|0)^31|0)*1.2;y=+(w|0)*f-y;if(t<y){v=B;t=y;d=w;break}}}}if((e|0)<=(E|0)){y=t;break c}}k[o>>2]=d;k[q>>2]=d;k[r>>2]=v;p[s>>3]=t;if((e|0)>(E|0)){v=d;d=1}else{d=1;break}}return d|0}else y=t;while(0);if(d){N=1;return N|0}C=a+8454148|0;g=k[C>>2]|0;z=a+8454144|0;A=k[z>>2]|0;if(g>>>0<A>>>7>>>0){N=0;return N|0}x=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>18<<1;B=n+1|0;k[z>>2]=A+1;N=j[6488+(x<<1)>>1]|0;d=N&65535;if(N<<16>>16!=0?(u=d&31,K=d>>>5,u>>>0<=m>>>0):0){v=(k[2420+(u<<2)>>2]|0)+(ha(u,K)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;f:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break f;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);g:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break g;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)==(u|0)){d=B+K|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t))L=50}else L=50}else L=50;if((L|0)==50){k[z>>2]=A+2;N=j[6488+((x|1)<<1)>>1]|0;d=N&65535;if(!(N<<16>>16)){N=0;return N|0}u=d&31;x=d>>>5;if(u>>>0>m>>>0){N=0;return N|0}v=(k[2420+(u<<2)>>2]|0)+(ha(u,x)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;h:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break h;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);i:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break i;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)!=(u|0)){N=0;return N|0}d=B+x|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t)){N=0;return N|0}}k[C>>2]=g+1;k[o>>2]=u;k[q>>2]=u;k[r>>2]=d;p[s>>3]=t;N=1;return N|0}function Ad(a,b,c,d,e,f,g,h,m,n,o,q,r,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;h=h|0;m=m|0;n=n|0;o=o|0;q=q|0;r=r|0;s=s|0;var t=0.0,u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;k[q>>2]=0;M=h&c;t=+p[s>>3];v=k[o>>2]|0;k[o>>2]=0;J=b+M|0;F=b+(M+m)|0;H=m+-4|0;G=b+(H+M)|0;H=(H|0)<0;z=0;d=0;do{x=(k[1044+(z<<2)>>2]|0)+(k[g+(k[980+(z<<2)>>2]<<2)>>2]|0)|0;e=h-x|0;if(((!(x>>>0>n>>>0|e>>>0>=h>>>0)?(A=e&c,B=v+M|0,B>>>0<=c>>>0):0)?(C=A+v|0,C>>>0<=c>>>0):0)?(i[b+B>>0]|0)==(i[b+C>>0]|0):0){a:do if(H){e=0;w=J}else{e=0;w=J;do{E=b+(e+A)|0;if((l[w>>0]|l[w+1>>0]<<8|l[w+2>>0]<<16|l[w+3>>0]<<24|0)!=(l[E>>0]|l[E+1>>0]<<8|l[E+2>>0]<<16|l[E+3>>0]<<24|0))break a;w=w+4|0;e=e+4|0}while(w>>>0<=G>>>0)}while(0);b:do if(w>>>0<F>>>0)do{if((i[b+(e+A)>>0]|0)!=(i[w>>0]|0))break b;w=w+1|0;e=e+1|0}while(w>>>0<F>>>0);while(0);if(e>>>0>=4?(y=+(e|0)*f-+p[72+(z<<3)>>3],t<y):0){k[o>>2]=e;k[q>>2]=e;k[r>>2]=x;p[s>>3]=y;v=e;t=y;d=1}}z=z+1|0}while((z|0)!=4);D=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>18;E=j[a+(D<<1)>>1]|0;e=E&65535;E=(E&65535)>32?e+-32|0:0;c:do if((e|0)>(E|0)){while(1){g=v+M|0;C=g>>>0>c>>>0;g=b+g|0;while(1){e=e+-1|0;A=k[a+32768+(D<<7)+((e&31)<<2)>>2]|0;if((A|0)>-1){B=h-A|0;if(B>>>0>n>>>0){y=t;break c}z=A&c;if((!C?(I=z+v|0,I>>>0<=c>>>0):0)?(i[g>>0]|0)==(i[b+I>>0]|0):0){d:do if(H){w=0;x=J}else{w=0;x=J;do{N=b+(w+z)|0;if((l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break d;x=x+4|0;w=w+4|0}while(x>>>0<=G>>>0)}while(0);e:do if(x>>>0<F>>>0)do{if((i[b+(w+z)>>0]|0)!=(i[x>>0]|0))break e;x=x+1|0;w=w+1|0}while(x>>>0<F>>>0);while(0);if(w>>>0>=4){if((A|0)==(h|0))y=-1.2;else y=+((ja(B|0)|0)^31|0)*1.2;y=+(w|0)*f-y;if(t<y){v=B;t=y;d=w;break}}}}if((e|0)<=(E|0)){y=t;break c}}k[o>>2]=d;k[q>>2]=d;k[r>>2]=v;p[s>>3]=t;if((e|0)>(E|0)){v=d;d=1}else{d=1;break}}return d|0}else y=t;while(0);if(d){N=1;return N|0}C=a+2129924|0;g=k[C>>2]|0;z=a+2129920|0;A=k[z>>2]|0;if(g>>>0<A>>>7>>>0){N=0;return N|0}x=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>18<<1;B=n+1|0;k[z>>2]=A+1;N=j[6488+(x<<1)>>1]|0;d=N&65535;if(N<<16>>16!=0?(u=d&31,K=d>>>5,u>>>0<=m>>>0):0){v=(k[2420+(u<<2)>>2]|0)+(ha(u,K)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;f:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break f;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);g:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break g;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)==(u|0)){d=B+K|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t))L=50}else L=50}else L=50;if((L|0)==50){k[z>>2]=A+2;N=j[6488+((x|1)<<1)>>1]|0;d=N&65535;if(!(N<<16>>16)){N=0;return N|0}u=d&31;x=d>>>5;if(u>>>0>m>>>0){N=0;return N|0}v=(k[2420+(u<<2)>>2]|0)+(ha(u,x)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;h:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break h;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);i:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break i;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)!=(u|0)){N=0;return N|0}d=B+x|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t)){N=0;return N|0}}k[C>>2]=g+1;k[o>>2]=u;k[q>>2]=u;k[r>>2]=d;p[s>>3]=t;N=1;return N|0}function Bd(a,b,c,d,e,f,g,h,m,n,o,q,r,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;h=h|0;m=m|0;n=n|0;o=o|0;q=q|0;r=r|0;s=s|0;var t=0.0,u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;k[q>>2]=0;M=h&c;t=+p[s>>3];v=k[o>>2]|0;k[o>>2]=0;J=b+M|0;F=b+(M+m)|0;H=m+-4|0;G=b+(H+M)|0;H=(H|0)<0;z=0;d=0;do{x=(k[1044+(z<<2)>>2]|0)+(k[g+(k[980+(z<<2)>>2]<<2)>>2]|0)|0;e=h-x|0;if(((!(x>>>0>n>>>0|e>>>0>=h>>>0)?(A=e&c,B=v+M|0,B>>>0<=c>>>0):0)?(C=A+v|0,C>>>0<=c>>>0):0)?(i[b+B>>0]|0)==(i[b+C>>0]|0):0){a:do if(H){e=0;w=J}else{e=0;w=J;do{E=b+(e+A)|0;if((l[w>>0]|l[w+1>>0]<<8|l[w+2>>0]<<16|l[w+3>>0]<<24|0)!=(l[E>>0]|l[E+1>>0]<<8|l[E+2>>0]<<16|l[E+3>>0]<<24|0))break a;w=w+4|0;e=e+4|0}while(w>>>0<=G>>>0)}while(0);b:do if(w>>>0<F>>>0)do{if((i[b+(e+A)>>0]|0)!=(i[w>>0]|0))break b;w=w+1|0;e=e+1|0}while(w>>>0<F>>>0);while(0);if(e>>>0>=4?(y=+(e|0)*f-+p[72+(z<<3)>>3],t<y):0){k[o>>2]=e;k[q>>2]=e;k[r>>2]=x;p[s>>3]=y;v=e;t=y;d=1}}z=z+1|0}while((z|0)!=4);D=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>18;E=j[a+(D<<1)>>1]|0;e=E&65535;E=(E&65535)>16?e+-16|0:0;c:do if((e|0)>(E|0)){while(1){g=v+M|0;C=g>>>0>c>>>0;g=b+g|0;while(1){e=e+-1|0;A=k[a+32768+(D<<6)+((e&15)<<2)>>2]|0;if((A|0)>-1){B=h-A|0;if(B>>>0>n>>>0){y=t;break c}z=A&c;if((!C?(I=z+v|0,I>>>0<=c>>>0):0)?(i[g>>0]|0)==(i[b+I>>0]|0):0){d:do if(H){w=0;x=J}else{w=0;x=J;do{N=b+(w+z)|0;if((l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break d;x=x+4|0;w=w+4|0}while(x>>>0<=G>>>0)}while(0);e:do if(x>>>0<F>>>0)do{if((i[b+(w+z)>>0]|0)!=(i[x>>0]|0))break e;x=x+1|0;w=w+1|0}while(x>>>0<F>>>0);while(0);if(w>>>0>=4){if((A|0)==(h|0))y=-1.2;else y=+((ja(B|0)|0)^31|0)*1.2;y=+(w|0)*f-y;if(t<y){v=B;t=y;d=w;break}}}}if((e|0)<=(E|0)){y=t;break c}}k[o>>2]=d;k[q>>2]=d;k[r>>2]=v;p[s>>3]=t;if((e|0)>(E|0)){v=d;d=1}else{d=1;break}}return d|0}else y=t;while(0);if(d){N=1;return N|0}C=a+1081348|0;g=k[C>>2]|0;z=a+1081344|0;A=k[z>>2]|0;if(g>>>0<A>>>7>>>0){N=0;return N|0}x=(ha(l[J>>0]|l[J+1>>0]<<8|l[J+2>>0]<<16|l[J+3>>0]<<24,506832829)|0)>>>18<<1;B=n+1|0;k[z>>2]=A+1;N=j[6488+(x<<1)>>1]|0;d=N&65535;if(N<<16>>16!=0?(u=d&31,K=d>>>5,u>>>0<=m>>>0):0){v=(k[2420+(u<<2)>>2]|0)+(ha(u,K)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;f:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break f;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);g:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break g;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)==(u|0)){d=B+K|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t))L=50}else L=50}else L=50;if((L|0)==50){k[z>>2]=A+2;N=j[6488+((x|1)<<1)>>1]|0;d=N&65535;if(!(N<<16>>16)){N=0;return N|0}u=d&31;x=d>>>5;if(u>>>0>m>>>0){N=0;return N|0}v=(k[2420+(u<<2)>>2]|0)+(ha(u,x)|0)|0;e=72438+v|0;w=72438+(v+u)|0;v=72438+(u+-4+v)|0;h:do if(u>>>0<4)d=0;else{d=0;do{N=b+(d+M)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24|0))break h;e=e+4|0;d=d+4|0}while(e>>>0<=v>>>0)}while(0);i:do if(e>>>0<w>>>0)do{if((i[b+(d+M)>>0]|0)!=(i[e>>0]|0))break i;e=e+1|0;d=d+1|0}while(e>>>0<w>>>0);while(0);if((d|0)!=(u|0)){N=0;return N|0}d=B+x|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(u|0)*f-t;if(!(y<t)){N=0;return N|0}}k[C>>2]=g+1;k[o>>2]=u;k[q>>2]=u;k[r>>2]=d;p[s>>3]=t;N=1;return N|0}function Cd(a,b,c,d,e,f,g,h,m,n,o,q,r,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;h=h|0;m=m|0;n=n|0;o=o|0;q=q|0;r=r|0;s=s|0;var t=0.0,u=0,v=0,w=0,x=0,y=0,z=0,A=0.0,B=0,C=0,D=0.0,E=0,F=0,G=0;x=k[o>>2]|0;F=h&c;e=i[b+(x+F)>>0]|0;v=e&255;t=+p[s>>3];w=k[g>>2]|0;d=h-w|0;if(d>>>0<h>>>0?(y=d&c,e<<24>>24==(i[b+(y+x)>>0]|0)):0){e=b+F|0;u=b+(F+m)|0;E=m+-4|0;g=b+(E+F)|0;a:do if((E|0)<0)d=0;else{d=0;do{E=b+(d+y)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[E>>0]|l[E+1>>0]<<8|l[E+2>>0]<<16|l[E+3>>0]<<24|0))break a;e=e+4|0;d=d+4|0}while(e>>>0<=g>>>0)}while(0);b:do if(e>>>0<u>>>0)do{if((i[b+(d+y)>>0]|0)!=(i[e>>0]|0))break b;e=e+1|0;d=d+1|0}while(e>>>0<u>>>0);while(0);if((d|0)>3){t=+(d|0)*f+.6;k[o>>2]=d;k[q>>2]=d;k[r>>2]=w;p[s>>3]=t;g=d;v=l[b+(d+F)>>0]|0;d=1}else{g=x;d=0}}else{g=x;d=0}E=b+F|0;w=(ha(l[E>>0]|l[E+1>>0]<<8|l[E+2>>0]<<16|l[E+3>>0]<<24,506832829)|0)>>>15;u=a+(w+1<<2)|0;w=k[a+(w<<2)>>2]|0;e=F+m|0;C=b+e|0;z=m+-4|0;B=b+(z+F)|0;if((z|0)<0){B=(F|0)<(e|0);z=u;x=v;y=0;u=w;while(1){w=h-u|0;v=u&c;if(!(w>>>0>n>>>0|((u|0)==(h|0)?1:(x|0)!=(l[b+(v+g)>>0]|0)))?B:0){e=0;u=E;do{if((i[b+(e+v)>>0]|0)!=(i[u>>0]|0))break;u=u+1|0;e=e+1|0}while(u>>>0<C>>>0);if((e|0)>3?(A=+(e|0)*f-+((ja(w|0)|0)^31|0)*1.2,t<A):0){k[o>>2]=e;k[q>>2]=e;k[r>>2]=w;p[s>>3]=A;g=e;t=A;e=l[b+(e+F)>>0]|0;d=1}else e=x}else e=x;y=y+1|0;u=k[z>>2]|0;if((y|0)==4){A=t;break}else{z=z+4|0;x=e}}}else{z=u;y=0;u=w;while(1){x=h-u|0;w=u&c;if(!(x>>>0>n>>>0|((u|0)==(h|0)?1:(v|0)!=(l[b+(w+g)>>0]|0)))){e=0;u=E;do{G=b+(e+w)|0;if((l[u>>0]|l[u+1>>0]<<8|l[u+2>>0]<<16|l[u+3>>0]<<24|0)!=(l[G>>0]|l[G+1>>0]<<8|l[G+2>>0]<<16|l[G+3>>0]<<24|0))break;u=u+4|0;e=e+4|0}while(u>>>0<=B>>>0);c:do if(u>>>0<C>>>0)do{if((i[b+(e+w)>>0]|0)!=(i[u>>0]|0))break c;u=u+1|0;e=e+1|0}while(u>>>0<C>>>0);while(0);if((e|0)>3?(D=+(e|0)*f-+((ja(x|0)|0)^31|0)*1.2,t<D):0){k[o>>2]=e;k[q>>2]=e;k[r>>2]=x;p[s>>3]=D;g=e;t=D;e=l[b+(e+F)>>0]|0;d=1}else e=v}else e=v;y=y+1|0;u=k[z>>2]|0;if((y|0)==4){A=t;break}else{z=z+4|0;v=e}}}if(d){G=1;return G|0}x=a+524308|0;y=k[x>>2]|0;d=a+524304|0;e=k[d>>2]|0;if(y>>>0<e>>>7>>>0){G=0;return G|0}k[d>>2]=e+1;G=6488+((ha(l[E>>0]|l[E+1>>0]<<8|l[E+2>>0]<<16|l[E+3>>0]<<24,506832829)|0)>>>18<<1<<1)|0;G=j[G>>1]|0;d=G&65535;if(!(G<<16>>16)){G=0;return G|0}w=d&31;v=d>>>5;if(w>>>0>m>>>0){G=0;return G|0}g=(k[2420+(w<<2)>>2]|0)+(ha(w,v)|0)|0;e=72438+g|0;u=72438+(g+w)|0;g=72438+(w+-4+g)|0;d:do if(w>>>0<4)d=0;else{d=0;do{G=b+(d+F)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[G>>0]|l[G+1>>0]<<8|l[G+2>>0]<<16|l[G+3>>0]<<24|0))break d;e=e+4|0;d=d+4|0}while(e>>>0<=g>>>0)}while(0);e:do if(e>>>0<u>>>0)do{if((i[b+(d+F)>>0]|0)!=(i[e>>0]|0))break e;e=e+1|0;d=d+1|0}while(e>>>0<u>>>0);while(0);if((d|0)!=(w|0)){G=0;return G|0}d=n+1+v|0;if(!d)t=-1.2;else t=+((ja(d|0)|0)^31|0)*1.2;t=+(w|0)*f-t;if(!(A<t)){G=0;return G|0}k[x>>2]=y+1;k[o>>2]=w;k[q>>2]=w;k[r>>2]=d;p[s>>3]=t;G=1;return G|0}function Dd(a,b,c,d,e,f,g,h,j,m,n,o,q,r){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;g=g|0;h=h|0;j=j|0;m=m|0;n=n|0;o=o|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0;v=k[n>>2]|0;x=h&c;w=i[b+(v+x)>>0]|0;t=k[g>>2]|0;d=h-t|0;if(d>>>0<h>>>0?(u=d&c,w<<24>>24==(i[b+(u+v)>>0]|0)):0){e=b+x|0;s=b+(x+j)|0;d=j+-4|0;g=b+(d+x)|0;a:do if((d|0)<0)d=0;else{d=0;do{y=b+(d+u)|0;if((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)!=(l[y>>0]|l[y+1>>0]<<8|l[y+2>>0]<<16|l[y+3>>0]<<24|0))break a;e=e+4|0;d=d+4|0}while(e>>>0<=g>>>0)}while(0);b:do if(e>>>0<s>>>0)do{if((i[b+(d+u)>>0]|0)!=(i[e>>0]|0))break b;e=e+1|0;d=d+1|0}while(e>>>0<s>>>0);while(0);if((d|0)>3){k[n>>2]=d;k[o>>2]=d;k[q>>2]=t;p[r>>3]=+(d|0)*f+.6;y=1;return y|0}}e=b+x|0;s=l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24;d=a+((ha(s,506832829)|0)>>>16<<2)|0;d=k[d>>2]|0;a=h-d|0;u=d&c;if(w<<24>>24!=(i[b+(u+v)>>0]|0)){y=0;return y|0}if((d|0)==(h|0)|a>>>0>m>>>0){y=0;return y|0}t=b+(x+j)|0;y=j+-4|0;g=b+(y+x)|0;c:do if((y|0)>=0?(y=b+u|0,(s|0)==(l[y>>0]|l[y+1>>0]<<8|l[y+2>>0]<<16|l[y+3>>0]<<24|0)):0){d=0;do{e=e+4|0;d=d+4|0;if(e>>>0>g>>>0)break c;y=b+(d+u)|0}while((l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24|0)==(l[y>>0]|l[y+1>>0]<<8|l[y+2>>0]<<16|l[y+3>>0]<<24|0))}else d=0;while(0);d:do if(e>>>0<t>>>0)do{if((i[b+(d+u)>>0]|0)!=(i[e>>0]|0))break d;e=e+1|0;d=d+1|0}while(e>>>0<t>>>0);while(0);if((d|0)<=3){y=0;return y|0}k[n>>2]=d;k[o>>2]=d;k[q>>2]=a;f=+(d|0)*f-+((ja(a|0)|0)^31|0)*1.2;p[r>>3]=f;y=1;return y|0}function Ed(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,l=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if(!b)return;r=c+4|0;s=c+8|0;t=d+4|0;u=d+8|0;v=0;a:while(1){o=a+(v<<5)+8|0;f=k[r>>2]|0;if((f|0)==(k[s>>2]|0)){l=k[c>>2]|0;n=l;q=f-n|0;e=(q>>1)+1|0;if((q|0)<-2){w=6;break}q=l;h=f-q|0;h=h>>1>>>0<1073741823?(h>>>0<e>>>0?e:h):2147483647;e=f-q|0;f=e>>1;if(!h)g=0;else g=og(h<<1)|0;j[g+(f<<1)>>1]=j[o>>1]|0;ki(g|0,l|0,e|0)|0;k[c>>2]=g;k[r>>2]=g+(f+1<<1);k[s>>2]=g+(h<<1);if(n)rg(n)}else{j[f>>1]=j[o>>1]|0;k[r>>2]=f+2}do if((k[a+(v<<5)+4>>2]|0)>0?(m[o>>1]|0)>127:0){o=j[a+(v<<5)+10>>1]&255;e=k[t>>2]|0;f=k[u>>2]|0;if(e>>>0<f>>>0){i[e>>0]=o;k[t>>2]=(k[t>>2]|0)+1;break}p=k[d>>2]|0;q=p;g=e-q+1|0;if((g|0)<0){w=16;break a}n=p;e=f-n|0;if(e>>>0<1073741823){e=e<<1;e=e>>>0<g>>>0?g:e;g=k[t>>2]|0;f=g-n|0;if(!e){l=0;h=0;e=g}else w=20}else{f=k[t>>2]|0;e=2147483647;g=f;f=f-n|0;w=20}if((w|0)==20){w=0;l=e;h=og(e)|0;e=g}i[h+f>>0]=o;n=e-n|0;o=h+(f-n)|0;ki(o|0,p|0,n|0)|0;k[d>>2]=o;k[t>>2]=h+(f+1);k[u>>2]=h+l;if(q)rg(q)}while(0);v=v+1|0;if((v|0)==(b|0)){w=24;break}}if((w|0)==6)mg(c);else if((w|0)==16)mg(d);else if((w|0)==24)return}function Fd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0;v=r;r=r+16|0;t=v+12|0;u=v;q=u+4|0;k[q>>2]=0;s=u+8|0;k[s>>2]=0;d=u+4|0;k[u>>2]=d;o=(b|0)==0;if(!o){n=d;f=0;e=0;c=0;while(1){m=a+e|0;if(f){j=i[m>>0]|0;g=d;h=f;a:do{while(1){if((l[h+13>>0]|0)>=(j&255)){g=h;break}h=k[h+4>>2]|0;if(!h)break a}h=k[g>>2]|0}while((h|0)!=0);if(!((g|0)!=(d|0)?(j&255)>=(l[g+13>>0]|0):0))p=14}else p=14;if((p|0)==14){do if(f){j=i[m>>0]|0;while(1){g=i[f+13>>0]|0;if((j&255)<(g&255)){g=k[f>>2]|0;if(!g){g=f;p=18;break}else f=g}else{if((g&255)>=(j&255)){p=24;break}g=f+4|0;h=k[g>>2]|0;if(!h){p=22;break}else f=h}}if((p|0)==18){k[t>>2]=f;h=g;g=f;p=25;break}else if((p|0)==22){k[t>>2]=f;h=g;g=f;p=25;break}else if((p|0)==24){p=0;k[t>>2]=f;if(!f){h=t;g=f;p=25;break}else break}}else{k[t>>2]=d;h=d;g=n;p=25}while(0);if((p|0)==25){p=0;f=og(16)|0;i[f+13>>0]=i[m>>0]|0;i[f+14>>0]=0;k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=g;k[h>>2]=f;g=k[k[u>>2]>>2]|0;if(!g)g=f;else{k[u>>2]=g;g=k[h>>2]|0}Hc(k[q>>2]|0,g);k[s>>2]=(k[s>>2]|0)+1}i[f+14>>0]=c;c=c+1|0}e=e+1|0;if(e>>>0>=b>>>0)break;f=k[d>>2]|0}if(!o){j=d;n=0;do{m=a+n|0;e=k[d>>2]|0;do if(e){h=i[m>>0]|0;while(1){f=i[e+13>>0]|0;if((h&255)<(f&255)){f=k[e>>2]|0;if(!f){f=e;p=35;break}else e=f}else{if((f&255)>=(h&255)){p=41;break}f=e+4|0;g=k[f>>2]|0;if(!g){p=39;break}else e=g}}if((p|0)==35){k[t>>2]=e;p=42;break}else if((p|0)==39){k[t>>2]=e;p=42;break}else if((p|0)==41){p=0;k[t>>2]=e;if(!e){f=t;p=42;break}else break}}else{k[t>>2]=d;f=d;e=j;p=42}while(0);if((p|0)==42){g=og(16)|0;i[g+13>>0]=i[m>>0]|0;i[g+14>>0]=0;k[g>>2]=0;k[g+4>>2]=0;k[g+8>>2]=e;k[f>>2]=g;e=k[k[u>>2]>>2]|0;if(!e)e=g;else{k[u>>2]=e;e=k[f>>2]|0}Hc(k[q>>2]|0,e);k[s>>2]=(k[s>>2]|0)+1;e=g}i[m>>0]=i[e+14>>0]|0;n=n+1|0}while(n>>>0<b>>>0);b=k[d>>2]|0;Id(u,b);r=v;return c|0}}else c=0;a=d;b=c;a=k[a>>2]|0;Id(u,a);r=v;return b|0}function Gd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0;u=r;r=r+16|0;s=u+4|0;t=u;c=k[a>>2]|0;f=l[c>>0]|0;k[s>>2]=f;k[t>>2]=1;k[b>>2]=-1;o=a+4|0;d=k[o>>2]|0;q=b+8|0;p=b+12|0;if((d-c|0)>>>0>1){i=b+4|0;j=b+20|0;m=b+24|0;n=b+16|0;g=f;e=1;h=1;do{if((l[c+h>>0]|0|0)!=(g|0)){c=k[q>>2]|0;if((c|0)==(k[p>>2]|0))Jd(i,s);else{k[c>>2]=g;k[q>>2]=c+4}c=k[j>>2]|0;if((c|0)==(k[m>>2]|0))Jd(n,t);else{k[c>>2]=e;k[j>>2]=c+4}c=k[b>>2]|0;k[b>>2]=(c|0)<(f|0)?f:c;c=k[a>>2]|0;g=l[c+h>>0]|0;k[s>>2]=g;k[t>>2]=0;e=0;d=k[o>>2]|0;f=g}e=e+1|0;k[t>>2]=e;h=h+1|0}while(h>>>0<(d-c|0)>>>0)}else e=1;c=k[q>>2]|0;if((c|0)==(k[p>>2]|0))Jd(b+4|0,s);else{k[c>>2]=f;k[q>>2]=c+4}c=b+20|0;d=k[c>>2]|0;if((d|0)==(k[b+24>>2]|0)){Jd(b+16|0,t);t=k[b>>2]|0;s=(t|0)<(f|0);t=s?f:t;t=t+1|0;k[b>>2]=t;r=u;return}else{k[d>>2]=e;k[c>>2]=d+4;t=k[b>>2]|0;s=(t|0)<(f|0);t=s?f:t;t=t+1|0;k[b>>2]=t;r=u;return}}function Hd(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0;s=r;r=r+48|0;p=s+24|0;o=s+12|0;n=s;k[p>>2]=0;q=p+4|0;k[q>>2]=0;k[p+8>>2]=0;if(b){h=0;g=0;do{g=(k[a+(h<<5)>>2]|0)+g|0;h=h+1|0}while((h|0)!=(b|0));if(g){uc(p,g);j=0;l=0;m=0;while(1){h=a+(l<<5)|0;ki((k[p>>2]|0)+m|0,c+j|0,k[h>>2]|0)|0;h=k[h>>2]|0;m=h+m|0;i=l+1|0;if(!(i>>>0<b>>>0&m>>>0<g>>>0))break;else{j=h+j+(k[a+(l<<5)+4>>2]|0)|0;l=i}}}}k[o>>2]=0;j=o+4|0;k[j>>2]=0;k[o+8>>2]=0;k[n>>2]=0;h=n+4|0;k[h>>2]=0;k[n+8>>2]=0;Ed(a,b,o,n);Kd(p,544,100,70,28.1,d);Ld(o,530,50,40,13.5,e);Md(n,544,50,40,14.6,f);g=k[n>>2]|0;if(g){if((k[h>>2]|0)!=(g|0))k[h>>2]=g;rg(g)}g=k[o>>2]|0;h=g;if(g){i=k[j>>2]|0;if((i|0)!=(g|0))k[j>>2]=i+(~((i+-2-h|0)>>>1)<<1);rg(g)}g=k[p>>2]|0;if(!g){r=s;return}if((k[q>>2]|0)!=(g|0))k[q>>2]=g;rg(g);r=s;return}function Id(a,b){a=a|0;b=b|0;if(!b)return;else{Id(a,k[b>>2]|0);Id(a,k[b+4>>2]|0);rg(b);return}}function Jd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;h=a+4|0;i=k[a>>2]|0;j=i;d=((k[h>>2]|0)-j>>2)+1|0;if(d>>>0>1073741823)mg(a);l=a+8|0;e=i;c=(k[l>>2]|0)-e|0;if(c>>2>>>0<536870911){c=c>>1;c=c>>>0<d>>>0?d:c;e=(k[h>>2]|0)-e|0;d=e>>2;if(!c){g=0;f=0;c=e}else m=6}else{e=(k[h>>2]|0)-e|0;c=1073741823;d=e>>2;m=6}if((m|0)==6){g=c;f=og(c<<2)|0;c=e}k[f+(d<<2)>>2]=k[b>>2];ki(f|0,i|0,c|0)|0;k[a>>2]=f;k[h>>2]=f+(d+1<<2);k[l>>2]=f+(g<<2);if(!j)return;rg(j);return}function Kd(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=+e;f=f|0;var g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0;q=r;r=r+32|0;l=q+28|0;m=q+24|0;p=q+12|0;o=q;g=k[a>>2]|0;n=a+4|0;h=k[n>>2]|0;if((g|0)==(h|0)){k[f>>2]=1;r=q;return}j=h-g|0;if(j>>>0<128){k[f>>2]=1;k[l>>2]=0;j=f+8|0;b=k[j>>2]|0;if(b>>>0<(k[f+12>>2]|0)>>>0){k[b>>2]=0;k[j>>2]=b+4}else{Nd(f+4|0,l);h=k[n>>2]|0;g=k[a>>2]|0}g=h-g|0;k[m>>2]=g;h=f+20|0;j=k[h>>2]|0;if(j>>>0<(k[f+24>>2]|0)>>>0){k[j>>2]=g;k[h>>2]=j+4;r=q;return}else{Nd(f+16|0,m);r=q;return}}k[p>>2]=0;l=p+4|0;k[l>>2]=0;k[p+8>>2]=0;pe(g,j,b,c,d,p);h=k[a>>2]|0;qe(h,(k[n>>2]|0)-h|0,d,p);h=k[n>>2]|0;m=k[a>>2]|0;g=h-m|0;k[o>>2]=0;c=o+4|0;k[c>>2]=0;k[o+8>>2]=0;if((h|0)==(m|0)){b=h;g=0}else{if((g|0)<0)mg(o);h=og(g)|0;k[c>>2]=h;k[o>>2]=h;k[o+8>>2]=h+g;do{i[h>>0]=0;h=(k[c>>2]|0)+1|0;k[c>>2]=h;g=g+-1|0}while((g|0)!=0);b=k[n>>2]|0;h=k[a>>2]|0;g=k[o>>2]|0}j=h;h=b-h|0;b=0;do{re(j,h,e,p,g);j=k[a>>2]|0;se(j,(k[n>>2]|0)-j|0,k[o>>2]|0,p);b=b+1|0;j=k[a>>2]|0;h=(k[n>>2]|0)-j|0;g=k[o>>2]|0}while((b|0)<10);te(j,h,g);Gd(o,f);g=k[o>>2]|0;if(g){if((k[c>>2]|0)!=(g|0))k[c>>2]=g;rg(g)}g=k[p>>2]|0;if(!g){r=q;return}h=k[l>>2]|0;if((h|0)!=(g|0))k[l>>2]=h+(~(((h+-1040-g|0)>>>0)/1040|0)*1040|0);rg(g);r=q;return}function Ld(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=+e;f=f|0;var g=0,h=0,j=0,l=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;B=r;r=r+2864|0;w=B;j=B+2860|0;l=B+2856|0;A=B+2844|0;y=B+2832|0;g=k[a>>2]|0;x=a+4|0;h=k[x>>2]|0;if((g|0)==(h|0)){k[f>>2]=1;r=B;return}u=h-g>>1;if(u>>>0<128){k[f>>2]=1;k[j>>2]=0;b=f+8|0;c=k[b>>2]|0;if(c>>>0<(k[f+12>>2]|0)>>>0){k[c>>2]=0;k[b>>2]=c+4}else{Nd(f+4|0,j);h=k[x>>2]|0;g=k[a>>2]|0}g=h-g>>1;k[l>>2]=g;h=f+20|0;b=k[h>>2]|0;if(b>>>0<(k[f+24>>2]|0)>>>0){k[b>>2]=g;k[h>>2]=b+4;r=B;return}else{Nd(f+16|0,l);r=B;return}}k[A>>2]=0;z=A+4|0;k[z>>2]=0;k[A+8>>2]=0;b=((u>>>0)/(b>>>0)|0)+1|0;t=(b|0)>(c|0)?c:b;s=(u>>>0)/(t>>>0)|0;if((t|0)>0){n=u+~d|0;o=w+2816|0;p=(d|0)==0;q=A+8|0;j=(b|0)<(c|0)?b:c;h=7;l=0;do{b=((ha(l,u)|0)>>>0)/(t>>>0)|0;if(l){v=h*16807|0;v=(v|0)==0?1:v;h=v;b=((v>>>0)%(s>>>0)|0)+b|0}gi(w|0,0,2816)|0;k[o>>2]=d;if(!p){b=g+(((b+d|0)>>>0<u>>>0?b:n)<<1)|0;c=d;while(1){v=w+((m[b>>1]|0)<<2)|0;k[v>>2]=(k[v>>2]|0)+1;c=c+-1|0;if(!c)break;else b=b+2|0}}b=k[z>>2]|0;if((b|0)==(k[q>>2]|0))ee(A,w);else{ki(b|0,w|0,2832)|0;k[z>>2]=b+2832}l=l+1|0}while((l|0)!=(j|0));h=k[x>>2]|0;g=k[a>>2]|0;b=k[z>>2]|0;t=k[A>>2]|0}else{b=0;t=0}u=h-g|0;v=u>>1;l=(b-t|0)/2832|0;n=((u>>>0)/(d>>>0)|0)+99+l|0;n=n-((n>>>0)%(l>>>0)|0)|0;if((n|0)>0){o=v>>>0>d>>>0;p=1-d+v|0;q=w+2816|0;b=7;s=0;do{gi(w|0,0,2820)|0;if(o){j=b*16807|0;j=(j|0)==0?1:j;c=d;b=j;j=(j>>>0)%(p>>>0)|0}else{c=v;j=0}k[q>>2]=c;if(!c)c=0;else{j=g+(j<<1)|0;while(1){C=w+((m[j>>1]|0)<<2)|0;k[C>>2]=(k[C>>2]|0)+1;c=c+-1|0;if(!c)break;else j=j+2|0}c=k[q>>2]|0}j=(s>>>0)%(l>>>0)|0;C=t+(j*2832|0)+2816|0;k[C>>2]=(k[C>>2]|0)+c;c=0;do{C=t+(j*2832|0)+(c<<2)|0;k[C>>2]=(k[C>>2]|0)+(k[w+(c<<2)>>2]|0);c=c+1|0}while((c|0)!=704);s=s+1|0}while((s|0)<(n|0))}k[y>>2]=0;j=y+4|0;k[j>>2]=0;k[y+8>>2]=0;if(!v)c=0;else{if((u|0)<0)mg(y);h=og(v)|0;k[j>>2]=h;k[y>>2]=h;k[y+8>>2]=h+v;g=v;do{i[h>>0]=0;h=(k[j>>2]|0)+1|0;k[j>>2]=h;g=g+-1|0}while((g|0)!=0);h=k[x>>2]|0;g=k[a>>2]|0;c=k[y>>2]|0}b=g;h=h-g>>1;g=c;c=0;do{fe(b,h,e,A,g);b=k[a>>2]|0;ge(b,(k[x>>2]|0)-b>>1,k[y>>2]|0,A);c=c+1|0;b=k[a>>2]|0;h=(k[x>>2]|0)-b>>1;g=k[y>>2]|0}while((c|0)<10);he(b,h,g);Gd(y,f);g=k[y>>2]|0;if(g){if((k[j>>2]|0)!=(g|0))k[j>>2]=g;rg(g)}g=k[A>>2]|0;if(!g){r=B;return}h=k[z>>2]|0;if((h|0)!=(g|0))k[z>>2]=h+(~(((h+-2832-g|0)>>>0)/2832|0)*2832|0);rg(g);r=B;return}function Md(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=+e;f=f|0;var g=0,h=0,j=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;A=r;r=r+2128|0;v=A;j=A+2124|0;m=A+2120|0;z=A+2108|0;x=A+2096|0;g=k[a>>2]|0;w=a+4|0;h=k[w>>2]|0;if((g|0)==(h|0)){k[f>>2]=1;r=A;return}u=h-g|0;if(u>>>0<128){k[f>>2]=1;k[j>>2]=0;b=f+8|0;c=k[b>>2]|0;if(c>>>0<(k[f+12>>2]|0)>>>0){k[c>>2]=0;k[b>>2]=c+4}else{Nd(f+4|0,j);h=k[w>>2]|0;g=k[a>>2]|0}g=h-g|0;k[m>>2]=g;h=f+20|0;b=k[h>>2]|0;if(b>>>0<(k[f+24>>2]|0)>>>0){k[b>>2]=g;k[h>>2]=b+4;r=A;return}else{Nd(f+16|0,m);r=A;return}}k[z>>2]=0;y=z+4|0;k[y>>2]=0;k[z+8>>2]=0;b=((u>>>0)/(b>>>0)|0)+1|0;t=(b|0)>(c|0)?c:b;s=(u>>>0)/(t>>>0)|0;if((t|0)>0){n=u+~d|0;o=v+2080|0;p=(d|0)==0;q=z+8|0;j=(b|0)<(c|0)?b:c;h=7;m=0;do{b=((ha(m,u)|0)>>>0)/(t>>>0)|0;if(m){c=h*16807|0;c=(c|0)==0?1:c;h=c;b=((c>>>0)%(s>>>0)|0)+b|0}gi(v|0,0,2080)|0;k[o>>2]=d;if(!p){b=g+((b+d|0)>>>0<u>>>0?b:n)|0;c=d;while(1){B=v+((l[b>>0]|0)<<2)|0;k[B>>2]=(k[B>>2]|0)+1;c=c+-1|0;if(!c)break;else b=b+1|0}}b=k[y>>2]|0;if((b|0)==(k[q>>2]|0))Od(z,v);else{ki(b|0,v|0,2096)|0;k[y>>2]=b+2096}m=m+1|0}while((m|0)!=(j|0));h=k[w>>2]|0;g=k[a>>2]|0;b=k[y>>2]|0;t=k[z>>2]|0}else{b=0;t=0}u=h-g|0;m=(b-t|0)/2096|0;n=((u<<1>>>0)/(d>>>0)|0)+99+m|0;n=n-((n>>>0)%(m>>>0)|0)|0;if((n|0)>0){o=u>>>0>d>>>0;p=1-d+u|0;q=v+2080|0;b=7;s=0;do{gi(v|0,0,2084)|0;if(o){j=b*16807|0;j=(j|0)==0?1:j;c=d;b=j;j=(j>>>0)%(p>>>0)|0}else{c=u;j=0}k[q>>2]=c;if(!c)c=0;else{j=g+j|0;while(1){B=v+((l[j>>0]|0)<<2)|0;k[B>>2]=(k[B>>2]|0)+1;c=c+-1|0;if(!c)break;else j=j+1|0}c=k[q>>2]|0}j=(s>>>0)%(m>>>0)|0;B=t+(j*2096|0)+2080|0;k[B>>2]=(k[B>>2]|0)+c;c=0;do{B=t+(j*2096|0)+(c<<2)|0;k[B>>2]=(k[B>>2]|0)+(k[v+(c<<2)>>2]|0);c=c+1|0}while((c|0)!=520);s=s+1|0}while((s|0)<(n|0))}k[x>>2]=0;j=x+4|0;k[j>>2]=0;k[x+8>>2]=0;if((h|0)==(g|0)){c=h;g=0}else{if((u|0)<0)mg(x);h=og(u)|0;k[j>>2]=h;k[x>>2]=h;k[x+8>>2]=h+u;g=u;do{i[h>>0]=0;h=(k[j>>2]|0)+1|0;k[j>>2]=h;g=g+-1|0}while((g|0)!=0);c=k[w>>2]|0;h=k[a>>2]|0;g=k[x>>2]|0}b=h;h=c-h|0;c=0;do{Pd(b,h,e,z,g);b=k[a>>2]|0;Qd(b,(k[w>>2]|0)-b|0,k[x>>2]|0,z);c=c+1|0;b=k[a>>2]|0;h=(k[w>>2]|0)-b|0;g=k[x>>2]|0}while((c|0)<10);Rd(b,h,g);Gd(x,f);g=k[x>>2]|0;if(g){if((k[j>>2]|0)!=(g|0))k[j>>2]=g;rg(g)}g=k[z>>2]|0;if(!g){r=A;return}h=k[y>>2]|0;if((h|0)!=(g|0))k[y>>2]=h+(~(((h+-2096-g|0)>>>0)/2096|0)*2096|0);rg(g);r=A;return}function Nd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;h=a+4|0;i=k[a>>2]|0;j=i;d=((k[h>>2]|0)-j>>2)+1|0;if(d>>>0>1073741823)mg(a);l=a+8|0;e=i;c=(k[l>>2]|0)-e|0;if(c>>2>>>0<536870911){c=c>>1;c=c>>>0<d>>>0?d:c;e=(k[h>>2]|0)-e|0;d=e>>2;if(!c){g=0;f=0;c=e}else m=6}else{e=(k[h>>2]|0)-e|0;c=1073741823;d=e>>2;m=6}if((m|0)==6){g=c;f=og(c<<2)|0;c=e}k[f+(d<<2)>>2]=k[b>>2];ki(f|0,i|0,c|0)|0;k[a>>2]=f;k[h>>2]=f+(d+1<<2);k[l>>2]=f+(g<<2);if(!j)return;rg(j);return}function Od(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;h=a+4|0;i=k[a>>2]|0;j=i;d=(((k[h>>2]|0)-j|0)/2096|0)+1|0;if(d>>>0>2049125)mg(a);l=a+8|0;e=i;c=((k[l>>2]|0)-e|0)/2096|0;if(c>>>0<1024562){c=c<<1;c=c>>>0<d>>>0?d:c;e=(k[h>>2]|0)-e|0;d=(e|0)/2096|0;if(!c){g=0;f=0;c=e}else m=6}else{e=(k[h>>2]|0)-e|0;c=2049125;d=(e|0)/2096|0;m=6}if((m|0)==6){g=c;f=og(c*2096|0)|0;c=e}ki(f+(d*2096|0)|0,b|0,2096)|0;m=f+((((c|0)/-2096|0)+d|0)*2096|0)|0;ki(m|0,i|0,c|0)|0;k[a>>2]=m;k[h>>2]=f+((d+1|0)*2096|0);k[l>>2]=f+(g*2096|0);if(!j)return;rg(j);return}function Pd(a,b,c,d,e){a=a|0;b=b|0;c=+c;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,m=0.0,n=0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0.0;n=k[d>>2]|0;d=(k[d+4>>2]|0)-n|0;v=(d|0)/2096|0;if(v>>>0<2){if(!b)return;gi(e|0,0,b|0)|0;return}u=v*520|0;u=qg(u>>>0>536870911?-1:u<<3)|0;gi(u|0,0,v*4160|0)|0;t=(d|0)>0;h=0;do{if(t){g=ha(h,v)|0;j=0;do{d=k[n+(j*2096|0)+2080>>2]|0;f=k[n+(j*2096|0)+(h<<2)>>2]|0;if((d|0)<256)q=+o[4036+(d<<2)>>2];else q=+oh(+(d|0));if(!f)m=q+2.0;else{if((f|0)<256)m=+o[4036+(f<<2)>>2];else m=+oh(+(f|0));m=q-m}p[u+(j+g<<3)>>3]=m;j=j+1|0}while((j|0)<(v|0))}h=h+1|0}while((h|0)!=520);r=qg(v>>>0>536870911?-1:v<<3)|0;gi(r|0,0,v<<3|0)|0;n=ha(v,b)|0;s=qg(n)|0;gi(s|0,0,n|0)|0;if(b){j=0;do{h=ha(j,v)|0;d=ha(l[a+j>>0]|0,v)|0;if(t){f=e+j|0;g=0;m=1.e+99;while(1){n=r+(g<<3)|0;q=+p[u+(g+d<<3)>>3]+ +p[n>>3];p[n>>3]=q;if(q<m)i[f>>0]=g;else q=m;g=g+1|0;if((g|0)>=(v|0))break;else m=q}}else q=1.e+99;if(j>>>0<2e3)m=(+(j>>>0)*.07/2.0e3+.77)*c;else m=c;if(t){f=0;do{d=r+(f<<3)|0;w=+p[d>>3]-q;p[d>>3]=w;if(w>=m){p[d>>3]=m;i[s+(f+h)>>0]=1}f=f+1|0}while((f|0)<(v|0))}j=j+1|0}while((j|0)!=(b|0));d=b+-1|0;if((d|0)>0){n=d;h=l[e+d>>0]|0;j=ha(v,d)|0;while(1){g=n;n=n+-1|0;j=j-v|0;f=e+n|0;if(!(i[s+(j+h)>>0]|0))d=h;else d=l[f>>0]|0;i[f>>0]=d;if((g|0)<=1)break;else h=d}}}sg(u);sg(r);sg(s);return}function Qd(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,m=0;h=Fd(c,b)|0;i=k[d>>2]|0;m=d+4|0;e=k[m>>2]|0;f=i;if((e|0)==(i|0))g=i;else{g=e+(~(((e+-2096-f|0)>>>0)/2096|0)*2096|0)|0;k[m>>2]=g}e=(g-f|0)/2096|0;if(h>>>0<=e>>>0){if(h>>>0<e>>>0?(j=i+(h*2096|0)|0,(g|0)!=(j|0)):0)k[m>>2]=g+(~(((g+-2096-j|0)>>>0)/2096|0)*2096|0)}else Td(d,h-e|0);if(!b)return;e=k[d>>2]|0;f=0;do{d=l[c+f>>0]|0;m=e+(d*2096|0)+((l[a+f>>0]|0)<<2)|0;k[m>>2]=(k[m>>2]|0)+1;d=e+(d*2096|0)+2080|0;k[d>>2]=(k[d>>2]|0)+1;f=f+1|0}while((f|0)!=(b|0));return}function Rd(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0;w=r;r=r+2144|0;u=w+2132|0;s=w+2120|0;m=w;q=w+2108|0;o=w+2096|0;k[u>>2]=0;v=u+4|0;k[v>>2]=0;k[u+8>>2]=0;k[s>>2]=0;t=s+4|0;k[t>>2]=0;k[s+8>>2]=0;n=(b|0)==0;do if(!n)if(b>>>0>1073741823)mg(s);else{h=b<<2;d=og(h)|0;k[s>>2]=d;j=d+(b<<2)|0;k[s+8>>2]=j;gi(d|0,0,h|0)|0;k[t>>2]=j;break}else d=0;while(0);gi(m|0,0,2084)|0;h=m+2080|0;j=u+8|0;g=0;e=0;a:while(1){while(1){if(e>>>0>=b>>>0)break a;f=e+1|0;if((f|0)==(b|0)){p=10;break}x=(i[c+e>>0]|0)==(i[c+f>>0]|0);k[d+(e<<2)>>2]=g;e=m+(l[a+e>>0]<<2)|0;k[e>>2]=(k[e>>2]|0)+1;k[h>>2]=(k[h>>2]|0)+1;if(x)e=f;else{e=f;break}}if((p|0)==10){p=0;k[d+(e<<2)>>2]=g;e=m+(l[a+e>>0]<<2)|0;k[e>>2]=(k[e>>2]|0)+1;k[h>>2]=(k[h>>2]|0)+1;e=b}f=k[v>>2]|0;if((f|0)==(k[j>>2]|0)){Od(u,m);d=k[s>>2]|0}else{ki(f|0,m|0,2096)|0;k[v>>2]=f+2096}gi(m|0,0,2084)|0;g=g+1|0}k[q>>2]=0;h=q+4|0;k[h>>2]=0;k[q+8>>2]=0;k[o>>2]=0;g=o+4|0;k[g>>2]=0;k[o+8>>2]=0;Sd(u,1,((k[v>>2]|0)-(k[u>>2]|0)|0)/2096|0,256,q,o);if(n){d=k[o>>2]|0;if(d)p=19}else{f=k[s>>2]|0;d=k[o>>2]|0;e=0;do{i[c+e>>0]=k[d+(k[f+(e<<2)>>2]<<2)>>2];e=e+1|0}while((e|0)!=(b|0));p=19}if((p|0)==19){e=k[g>>2]|0;if((e|0)!=(d|0))k[g>>2]=e+(~((e+-4-d|0)>>>2)<<2);rg(d)}d=k[q>>2]|0;e=d;if(d){f=k[h>>2]|0;if((f|0)!=(d|0))k[h>>2]=f+(~(((f+-2096-e|0)>>>0)/2096|0)*2096|0);rg(d)}d=k[s>>2]|0;e=d;if(d){f=k[t>>2]|0;if((f|0)!=(d|0))k[t>>2]=f+(~((f+-4-e|0)>>>2)<<2);rg(d)}d=k[u>>2]|0;if(!d){r=w;return}e=k[v>>2]|0;if((e|0)!=(d|0))k[v>>2]=e+(~(((e+-2096-d|0)>>>0)/2096|0)*2096|0);rg(d);r=w;return}function Sd(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0.0,j=0,m=0,n=0,o=0,q=0,s=0,t=0,u=0,v=0;v=r;r=r+544|0;q=v+16|0;t=v;s=ha(c,b)|0;k[t>>2]=0;u=t+4|0;k[u>>2]=0;k[t+8>>2]=0;if(s){if(s>>>0>1073741823)mg(t);j=og(s<<2)|0;k[u>>2]=j;k[t>>2]=j;h=j+(s<<2)|0;k[t+8>>2]=h;g=s;while(1){k[j>>2]=1;g=g+-1|0;if(!g)break;else j=j+4|0}k[u>>2]=h}g=e+4|0;h=k[g>>2]|0;j=k[e>>2]|0;m=(h-j|0)/2096|0;if(s>>>0<=m>>>0){if(s>>>0<m>>>0?(n=j+(s*2096|0)|0,(h|0)!=(n|0)):0)k[g>>2]=h+(~(((h+-2096-n|0)>>>0)/2096|0)*2096|0)}else Td(e,s-m|0);g=f+4|0;h=k[g>>2]|0;j=k[f>>2]|0;m=h-j>>2;if(s>>>0<=m>>>0){if(s>>>0<m>>>0?(o=j+(s<<2)|0,(h|0)!=(o|0)):0)k[g>>2]=h+(~((h+-4-o|0)>>>2)<<2)}else Ud(f,s-m|0);if((s|0)>0){g=k[e>>2]|0;o=0;do{ki(g+(o*2096|0)|0,(k[a>>2]|0)+(o*2096|0)|0,2096)|0;n=k[a>>2]|0;j=k[n+(o*2096|0)+2080>>2]|0;a:do if(!j)i=12.0;else{g=0;h=0;do{g=((k[n+(o*2096|0)+(h<<2)>>2]|0)>0&1)+g|0;h=h+1|0}while((h|0)<520&(g|0)<5);m=g;switch(m|0){case 1:{i=12.0;break a}case 2:{i=+(j+20|0);break a}default:{}}gi(q|0,0,520)|0;Af(n+(o*2096|0)|0,520,15,q);g=0;h=0;do{g=(ha(l[q+h>>0]|0,k[n+(o*2096|0)+(h<<2)>>2]|0)|0)+g|0;h=h+1|0}while((h|0)!=520);switch(m|0){case 3:{g=g+28|0;break}case 4:{g=g+37|0;break}default:g=(Vd(q,520)|0)+g|0}i=+(g|0)}while(0);g=k[e>>2]|0;p[g+(o*2096|0)+2088>>3]=i;k[(k[f>>2]|0)+(o<<2)>>2]=o;o=o+1|0}while((o|0)<(s|0))}if((b|0)>1&(c|0)>0){g=0;do{q=ha(g,b)|0;Wd(k[e>>2]|0,k[t>>2]|0,(k[f>>2]|0)+(q<<2)|0,b,d);g=g+1|0}while((g|0)<(c|0))}Wd(k[e>>2]|0,k[t>>2]|0,k[f>>2]|0,s,d);Xd(k[a>>2]|0,s,k[e>>2]|0,k[f>>2]|0);Yd(e,f);h=k[t>>2]|0;if(!h){r=v;return}g=k[u>>2]|0;if((g|0)!=(h|0))k[u>>2]=g+(~((g+-4-h|0)>>>2)<<2);rg(h);r=v;return}function Td(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;i=a+8|0;e=k[i>>2]|0;j=a+4|0;c=k[j>>2]|0;d=c;if(((e-d|0)/2096|0)>>>0>=b>>>0){do{gi(c|0,0,2084)|0;c=(k[j>>2]|0)+2096|0;k[j>>2]=c;b=b+-1|0}while((b|0)!=0);return}c=k[a>>2]|0;d=((d-c|0)/2096|0)+b|0;if(d>>>0>2049125)mg(a);f=c;c=(e-f|0)/2096|0;if(c>>>0<1024562){c=c<<1;c=c>>>0<d>>>0?d:c;d=((k[j>>2]|0)-f|0)/2096|0;if(!c){e=0;g=0}else h=8}else{c=2049125;d=((k[j>>2]|0)-f|0)/2096|0;h=8}if((h|0)==8){e=c;g=og(c*2096|0)|0}c=g+(d*2096|0)|0;f=g+(e*2096|0)|0;e=c;do{gi(e|0,0,2084)|0;e=c+2096|0;c=e;b=b+-1|0}while((b|0)!=0);b=k[a>>2]|0;e=(k[j>>2]|0)-b|0;h=g+((((e|0)/-2096|0)+d|0)*2096|0)|0;ki(h|0,b|0,e|0)|0;k[a>>2]=h;k[j>>2]=c;k[i>>2]=f;if(!b)return;rg(b);return}function Ud(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;j=a+8|0;e=k[j>>2]|0;l=a+4|0;c=k[l>>2]|0;d=c;if(e-d>>2>>>0>=b>>>0){gi(c|0,0,b<<2|0)|0;k[l>>2]=c+(b<<2);return}h=k[a>>2]|0;i=h;d=(d-i>>2)+b|0;if(d>>>0>1073741823)mg(a);f=h;c=e-f|0;if(c>>2>>>0<536870911){c=c>>1;c=c>>>0<d>>>0?d:c;e=(k[l>>2]|0)-f|0;d=e>>2;if(!c){g=0;f=0;c=e}else m=8}else{e=(k[l>>2]|0)-f|0;c=1073741823;d=e>>2;m=8}if((m|0)==8){g=c;f=og(c<<2)|0;c=e}gi(f+(d<<2)|0,0,b<<2|0)|0;ki(f|0,h|0,c|0)|0;k[a>>2]=f;k[l>>2]=f+(d+b<<2);k[j>>2]=f+(g<<2);if(!i)return;rg(i);return}function Vd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,m=0,n=0,o=0,p=0,q=0;q=r;r=r+96|0;p=q;o=q+72|0;e=p;f=e+72|0;do{k[e>>2]=0;e=e+4|0}while((e|0)<(f|0));a:do if((b|0)>0){d=p+68|0;g=p+64|0;e=0;c=1;n=8;while(1){m=e;while(1){h=i[a+m>>0]|0;j=h&255;c=(j|0)>(c|0)?j:c;e=m+1|0;b:do if((e|0)<(b|0)){f=1;do{if((i[a+e>>0]|0)!=h<<24>>24)break b;f=f+1|0;e=e+1|0}while((e|0)<(b|0))}else f=1;while(0);m=f+m|0;e=h<<24>>24==0;if(e&(m|0)==(b|0))break a;if(!e){h=m;e=f;break}if((f|0)<3)k[p>>2]=(k[p>>2]|0)+f;else{e=k[d>>2]|0;f=f+-2|0;do{e=e+1|0;f=f>>3}while((f|0)>0);k[d>>2]=e}if((m|0)>=(b|0))break a}if((j|0)==(n|0))f=e;else{f=p+(j<<2)|0;k[f>>2]=(k[f>>2]|0)+1;f=e+-1|0}if((f|0)<3){n=p+(j<<2)|0;k[n>>2]=(k[n>>2]|0)+f}else{e=k[g>>2]|0;f=f+-2|0;do{e=e+1|0;f=f>>2}while((f|0)>0);k[g>>2]=e}if((h|0)<(b|0)){e=h;n=j}else break}}else{g=p+64|0;d=p+68|0;c=1}while(0);e=o;f=e+18|0;do{i[e>>0]=0;e=e+1|0}while((e|0)<(f|0));Af(p,18,7,o);a=o+16|0;i[a>>0]=(l[a>>0]|0)+2;b=o+17|0;i[b>>0]=(l[b>>0]|0)+3;n=(ha(l[o>>0]|0,k[p>>2]|0)|0)+((c<<1)+18)|0;n=(ha(l[o+1>>0]|0,k[p+4>>2]|0)|0)+n|0;n=(ha(l[o+2>>0]|0,k[p+8>>2]|0)|0)+n|0;n=(ha(l[o+3>>0]|0,k[p+12>>2]|0)|0)+n|0;n=(ha(l[o+4>>0]|0,k[p+16>>2]|0)|0)+n|0;n=(ha(l[o+5>>0]|0,k[p+20>>2]|0)|0)+n|0;n=(ha(l[o+6>>0]|0,k[p+24>>2]|0)|0)+n|0;n=(ha(l[o+7>>0]|0,k[p+28>>2]|0)|0)+n|0;n=(ha(l[o+8>>0]|0,k[p+32>>2]|0)|0)+n|0;n=(ha(l[o+9>>0]|0,k[p+36>>2]|0)|0)+n|0;n=(ha(l[o+10>>0]|0,k[p+40>>2]|0)|0)+n|0;n=(ha(l[o+11>>0]|0,k[p+44>>2]|0)|0)+n|0;n=(ha(l[o+12>>0]|0,k[p+48>>2]|0)|0)+n|0;n=(ha(l[o+13>>0]|0,k[p+52>>2]|0)|0)+n|0;n=(ha(l[o+14>>0]|0,k[p+56>>2]|0)|0)+n|0;p=(ha(l[o+15>>0]|0,k[p+60>>2]|0)|0)+n|0;p=(ha(l[a>>0]|0,k[g>>2]|0)|0)+p|0;p=(ha(l[b>>0]|0,k[d>>2]|0)|0)+p|0;r=q;return p|0}function Wd(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,q=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;I=r;r=r+96|0;x=I+8|0;w=I+92|0;v=I+88|0;y=I+84|0;z=I+80|0;A=I+76|0;B=I;H=I+64|0;E=I+52|0;D=I+40|0;s=H+4|0;k[s>>2]=0;t=H+8|0;k[t>>2]=0;F=H+4|0;k[H>>2]=F;k[E>>2]=0;G=E+4|0;k[G>>2]=0;k[E+8>>2]=0;C=(d|0)>0;if(C){o=F;q=E+8|0;l=0;f=0;while(1){n=c+(f<<2)|0;if(l){j=k[n>>2]|0;g=F;h=l;a:do{while(1){if((k[h+16>>2]|0)>=(j|0)){g=h;break}h=k[h+4>>2]|0;if(!h)break a}h=k[g>>2]|0}while((h|0)!=0);if(!((g|0)!=(F|0)?(j|0)>=(k[g+16>>2]|0):0))m=11}else m=11;do if((m|0)==11){m=0;do if(l){j=k[n>>2]|0;while(1){g=k[l+16>>2]|0;if((j|0)<(g|0)){g=k[l>>2]|0;if(!g){g=l;h=l;m=15;break}}else{if((g|0)>=(j|0)){g=l;m=20;break}h=l+4|0;g=k[h>>2]|0;if(!g){g=h;h=l;m=19;break}}l=g}if((m|0)==15){m=0;k[x>>2]=h;j=g;break}else if((m|0)==19){m=0;k[x>>2]=h;j=g;break}else if((m|0)==20){m=0;k[x>>2]=g;j=x;h=g;break}}else{k[x>>2]=F;j=F;h=o}while(0);if(!(k[j>>2]|0)){g=og(20)|0;k[g+16>>2]=k[n>>2];k[g>>2]=0;k[g+4>>2]=0;k[g+8>>2]=h;k[j>>2]=g;h=k[k[H>>2]>>2]|0;if(h){k[H>>2]=h;g=k[j>>2]|0}Hc(k[s>>2]|0,g);k[t>>2]=(k[t>>2]|0)+1}g=k[G>>2]|0;if((g|0)==(k[q>>2]|0)){Jd(E,n);break}else{k[g>>2]=k[n>>2];k[G>>2]=g+4;break}}while(0);f=f+1|0;if((f|0)>=(d|0))break;l=k[F>>2]|0}g=k[G>>2]|0;f=k[E>>2]|0}else{g=0;f=0}k[D>>2]=0;s=D+4|0;k[s>>2]=0;k[D+8>>2]=0;if((g|0)==(f|0))g=f;else{l=0;do{j=l;l=l+1|0;if(l>>>0<g-f>>2>>>0){h=l;do{ae(a,b,k[f+(j<<2)>>2]|0,k[f+(h<<2)>>2]|0,D);h=h+1|0;g=k[G>>2]|0;f=k[E>>2]|0}while(h>>>0<g-f>>2>>>0)}}while(l>>>0<g-f>>2>>>0)}b:do if(g-f>>2>>>0>1){u=0.0;q=1;while(1){while(1){m=k[D>>2]|0;if(+p[m+24>>3]>=u)break;o=k[m>>2]|0;n=k[m+4>>2]|0;h=a+(o*2096|0)+2080|0;k[h>>2]=(k[h>>2]|0)+(k[a+(n*2096|0)+2080>>2]|0);h=0;do{t=a+(o*2096|0)+(h<<2)|0;k[t>>2]=(k[t>>2]|0)+(k[a+(n*2096|0)+(h<<2)>>2]|0);h=h+1|0}while((h|0)!=520);p[a+(o*2096|0)+2088>>3]=+p[m+16>>3];t=b+(o<<2)|0;k[t>>2]=(k[t>>2]|0)+(k[b+(n<<2)>>2]|0);if(C){j=0;do{h=c+(j<<2)|0;if((k[h>>2]|0)==(n|0))k[h>>2]=o;j=j+1|0}while((j|0)!=(d|0))}j=g-f>>2;if(j>>>0>1){l=1;h=0;while(1){h=f+(h<<2)|0;if((k[h>>2]|0)>=(n|0))k[h>>2]=k[f+(l<<2)>>2];h=l+1|0;if(h>>>0<j>>>0){t=l;l=h;h=t}else break}}k[G>>2]=g+-4;f=k[s>>2]|0;g=(f|0)==(m|0);c:do if(!g){h=f-m>>5;l=0;do{j=k[m+(l<<5)>>2]|0;if(!((j|0)!=(o|0)?(t=k[m+(l<<5)+4>>2]|0,!((t|0)==(n|0)|((j|0)==(n|0)|(t|0)==(o|0)))):0))i[m+(l<<5)+8>>0]=0;l=l+1|0}while(l>>>0<h>>>0);if(!g){g=m;do{if(i[g+8>>0]|0)break c;h=g;j=f-h|0;if((j|0)>32){f=f+-32|0;k[x>>2]=k[g>>2];k[x+4>>2]=k[g+4>>2];k[x+8>>2]=k[g+8>>2];k[x+12>>2]=k[g+12>>2];k[x+16>>2]=k[g+16>>2];k[x+20>>2]=k[g+20>>2];k[x+24>>2]=k[g+24>>2];k[x+28>>2]=k[g+28>>2];k[g>>2]=k[f>>2];k[g+4>>2]=k[f+4>>2];k[g+8>>2]=k[f+8>>2];k[g+12>>2]=k[f+12>>2];k[g+16>>2]=k[f+16>>2];k[g+20>>2]=k[f+20>>2];k[g+24>>2]=k[f+24>>2];k[g+28>>2]=k[f+28>>2];k[f>>2]=k[x>>2];k[f+4>>2]=k[x+4>>2];k[f+8>>2]=k[x+8>>2];k[f+12>>2]=k[x+12>>2];k[f+16>>2]=k[x+16>>2];k[f+20>>2]=k[x+20>>2];k[f+24>>2]=k[x+24>>2];k[f+28>>2]=k[x+28>>2];k[y>>2]=h;k[z>>2]=f;k[A>>2]=h;k[v>>2]=k[y>>2];k[w>>2]=k[z>>2];k[x>>2]=k[A>>2];be(v,w,B,(j>>5)+-1|0,x);f=k[s>>2]|0;g=k[D>>2]|0}f=f+-32|0;k[s>>2]=f}while((g|0)!=(f|0))}}while(0);h=k[G>>2]|0;f=k[E>>2]|0;if((h|0)==(f|0)){g=h;f=h}else{h=0;do{ae(a,b,o,k[f+(h<<2)>>2]|0,D);h=h+1|0;g=k[G>>2]|0;f=k[E>>2]|0}while(h>>>0<g-f>>2>>>0)}if(g-f>>2>>>0<=q>>>0)break b}if(g-f>>2>>>0>e>>>0){u=1.e+99;q=e}else break}}while(0);g=k[D>>2]|0;h=g;if(g){f=k[s>>2]|0;if((f|0)!=(g|0))k[s>>2]=f+(~((f+-32-h|0)>>>5)<<5);rg(g);f=k[E>>2]|0}if(!f){G=k[F>>2]|0;$d(H,G);r=I;return}g=k[G>>2]|0;if((g|0)!=(f|0))k[G>>2]=g+(~((g+-4-f|0)>>>2)<<2);rg(f);G=k[F>>2]|0;$d(H,G);r=I;return}function Xd(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0.0,i=0.0,j=0,m=0,n=0,o=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;D=r;r=r+2640|0;y=D+2112|0;z=D;C=D+2096|0;o=C+4|0;k[o>>2]=0;q=C+8|0;k[q>>2]=0;B=C+4|0;k[C>>2]=B;A=(b|0)>0;if(A){s=B;f=0;n=0;while(1){m=d+(n<<2)|0;do if(f){g=k[m>>2]|0;j=f;while(1){e=k[j+16>>2]|0;if((g|0)<(e|0)){e=k[j>>2]|0;if(!e){e=j;f=j;x=10;break}}else{if((e|0)>=(g|0)){e=j;x=15;break}f=j+4|0;e=k[f>>2]|0;if(!e){e=f;f=j;x=14;break}}j=e}if((x|0)==10){x=0;k[y>>2]=f;g=e;break}else if((x|0)==14){x=0;k[y>>2]=f;g=e;break}else if((x|0)==15){x=0;k[y>>2]=e;g=y;f=e;break}}else{k[y>>2]=B;g=B;f=s}while(0);if(!(k[g>>2]|0)){e=og(20)|0;k[e+16>>2]=k[m>>2];k[e>>2]=0;k[e+4>>2]=0;k[e+8>>2]=f;k[g>>2]=e;f=k[k[C>>2]>>2]|0;if(f){k[C>>2]=f;e=k[g>>2]|0}Hc(k[o>>2]|0,e);k[q>>2]=(k[q>>2]|0)+1}e=n+1|0;if((e|0)>=(b|0))break;f=k[B>>2]|0;n=e}if(A){u=z+2080|0;v=z+2080|0;w=0;while(1){e=k[((w|0)==0?d:d+(w+-1<<2)|0)>>2]|0;s=a+(w*2096|0)|0;t=a+(w*2096|0)+2080|0;if(!(k[t>>2]|0))h=0.0;else{ki(z|0,s|0,2096)|0;k[v>>2]=(k[v>>2]|0)+(k[c+(e*2096|0)+2080>>2]|0);f=0;do{q=z+(f<<2)|0;k[q>>2]=(k[q>>2]|0)+(k[c+(e*2096|0)+(f<<2)>>2]|0);f=f+1|0}while((f|0)!=520);j=k[v>>2]|0;a:do if(!j)h=12.0;else{f=0;g=0;do{f=((k[z+(g<<2)>>2]|0)>0&1)+f|0;g=g+1|0}while((g|0)<520&(f|0)<5);m=f;switch(m|0){case 1:{h=12.0;break a}case 2:{h=+(j+20|0);break a}default:{}}gi(y|0,0,520)|0;Af(z,520,15,y);f=0;g=0;do{f=(ha(l[y+g>>0]|0,k[z+(g<<2)>>2]|0)|0)+f|0;g=g+1|0}while((g|0)!=520);switch(m|0){case 3:{f=f+28|0;break}case 4:{f=f+37|0;break}default:f=(Vd(y,520)|0)+f|0}h=+(f|0)}while(0);h=h-+p[c+(e*2096|0)+2088>>3]}f=k[C>>2]|0;if((f|0)!=(B|0)){g=f;while(1){q=g+16|0;o=k[q>>2]|0;if(!(k[t>>2]|0))i=0.0;else{ki(z|0,s|0,2096)|0;k[u>>2]=(k[u>>2]|0)+(k[c+(o*2096|0)+2080>>2]|0);f=0;do{n=z+(f<<2)|0;k[n>>2]=(k[n>>2]|0)+(k[c+(o*2096|0)+(f<<2)>>2]|0);f=f+1|0}while((f|0)!=520);m=k[u>>2]|0;b:do if(!m)i=12.0;else{f=0;j=0;do{f=((k[z+(j<<2)>>2]|0)>0&1)+f|0;j=j+1|0}while((j|0)<520&(f|0)<5);n=f;switch(n|0){case 1:{i=12.0;break b}case 2:{i=+(m+20|0);break b}default:{}}gi(y|0,0,520)|0;Af(z,520,15,y);f=0;j=0;do{f=(ha(l[y+j>>0]|0,k[z+(j<<2)>>2]|0)|0)+f|0;j=j+1|0}while((j|0)!=520);switch(n|0){case 3:{f=f+28|0;break}case 4:{f=f+37|0;break}default:f=(Vd(y,520)|0)+f|0}i=+(f|0)}while(0);i=i-+p[c+(o*2096|0)+2088>>3]}if(i<h){h=i;e=k[q>>2]|0}f=k[g+4>>2]|0;if(!f)while(1){f=k[g+8>>2]|0;if((k[f>>2]|0)==(g|0))break;else g=f}else while(1){g=k[f>>2]|0;if(!g)break;else f=g}if((f|0)==(B|0))break;else g=f}}k[d+(w<<2)>>2]=e;w=w+1|0;if((w|0)>=(b|0)){g=B;e=C;break}}}else x=4}else x=4;if((x|0)==4){g=B;e=C}f=k[e>>2]|0;if((f|0)!=(g|0))while(1){gi(c+((k[f+16>>2]|0)*2096|0)|0,0,2084)|0;e=k[f+4>>2]|0;if(!e)while(1){e=k[f+8>>2]|0;if((k[e>>2]|0)==(f|0))break;else f=e}else while(1){f=k[e>>2]|0;if(!f)break;else e=f}if((e|0)==(B|0))break;else f=e}if(A)g=0;else{d=k[B>>2]|0;$d(C,d);r=D;return}do{e=k[d+(g<<2)>>2]|0;f=c+(e*2096|0)+2080|0;k[f>>2]=(k[f>>2]|0)+(k[a+(g*2096|0)+2080>>2]|0);f=0;do{A=c+(e*2096|0)+(f<<2)|0;k[A>>2]=(k[A>>2]|0)+(k[a+(g*2096|0)+(f<<2)>>2]|0);f=f+1|0}while((f|0)!=520);g=g+1|0}while((g|0)!=(b|0));d=k[B>>2]|0;$d(C,d);r=D;return}function Yd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0;x=r;r=r+32|0;u=x+24|0;w=x+12|0;v=x;Zd(w,a);q=v+4|0;k[q>>2]=0;s=v+8|0;k[s>>2]=0;c=v+4|0;k[v>>2]=c;t=b+4|0;d=k[t>>2]|0;e=k[b>>2]|0;a:do if((d|0)==(e|0)){f=a;e=d;j=0}else{n=c;i=0;m=0;j=0;while(1){l=e+(m<<2)|0;if(i){h=k[l>>2]|0;f=c;g=i;b:do{while(1){if((k[g+16>>2]|0)>=(h|0)){f=g;break}g=k[g+4>>2]|0;if(!g)break b}g=k[f>>2]|0}while((g|0)!=0);if(!((f|0)!=(c|0)?(h|0)>=(k[f+16>>2]|0):0))p=12}else p=12;if((p|0)==12){do if(i){h=k[l>>2]|0;d=i;while(1){f=k[d+16>>2]|0;if((h|0)<(f|0)){f=k[d>>2]|0;if(!f){e=d;p=16;break}else d=f}else{if((f|0)>=(h|0)){p=22;break}f=d+4|0;g=k[f>>2]|0;if(!g){e=f;p=20;break}else d=g}}if((p|0)==16){k[u>>2]=d;p=23;break}else if((p|0)==20){k[u>>2]=d;p=23;break}else if((p|0)==22){p=0;k[u>>2]=d;if(!d){e=u;p=23;break}else break}}else{k[u>>2]=c;e=c;d=n;p=23}while(0);if((p|0)==23){p=0;f=og(24)|0;k[f+16>>2]=k[l>>2];k[f+20>>2]=0;k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=d;k[e>>2]=f;d=k[k[v>>2]>>2]|0;if(!d)d=f;else{k[v>>2]=d;d=k[e>>2]|0}Hc(k[q>>2]|0,d);k[s>>2]=(k[s>>2]|0)+1;e=k[b>>2]|0;d=f}k[d+20>>2]=j;ki((k[a>>2]|0)+(j*2096|0)|0,(k[w>>2]|0)+((k[e+(m<<2)>>2]|0)*2096|0)|0,2096)|0;d=k[t>>2]|0;e=k[b>>2]|0;j=j+1|0}f=m+1|0;if(f>>>0>=d-e>>2>>>0){f=a;break a}i=k[c>>2]|0;m=f}}while(0);h=a+4|0;i=k[h>>2]|0;f=k[f>>2]|0;g=(i-f|0)/2096|0;if(j>>>0<=g>>>0){if(j>>>0<g>>>0?(o=f+(j*2096|0)|0,(i|0)!=(o|0)):0)k[h>>2]=i+(~(((i+-2096-o|0)>>>0)/2096|0)*2096|0)}else{Td(a,j-g|0);d=k[t>>2]|0;e=k[b>>2]|0}if((d|0)!=(e|0)){m=c;l=0;do{j=e+(l<<2)|0;f=k[c>>2]|0;do if(f){i=k[j>>2]|0;while(1){g=k[f+16>>2]|0;if((i|0)<(g|0)){g=k[f>>2]|0;if(!g){d=f;e=f;p=41;break}else f=g}else{if((g|0)>=(i|0)){p=47;break}g=f+4|0;h=k[g>>2]|0;if(!h){d=g;p=45;break}else f=h}}if((p|0)==41){k[u>>2]=e;g=d;d=e;p=48;break}else if((p|0)==45){k[u>>2]=f;g=d;d=f;p=48;break}else if((p|0)==47){p=0;k[u>>2]=f;if(!f){g=u;d=f;p=48;break}else break}}else{k[u>>2]=c;g=c;d=m;p=48}while(0);if((p|0)==48){f=og(24)|0;k[f+16>>2]=k[j>>2];k[f+20>>2]=0;k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=d;k[g>>2]=f;d=k[k[v>>2]>>2]|0;if(!d)d=f;else{k[v>>2]=d;d=k[g>>2]|0}Hc(k[q>>2]|0,d);k[s>>2]=(k[s>>2]|0)+1;e=k[b>>2]|0;d=k[t>>2]|0}k[e+(l<<2)>>2]=k[f+20>>2];l=l+1|0}while(l>>>0<d-e>>2>>>0)}_d(v,k[c>>2]|0);e=k[w>>2]|0;if(!e){r=x;return}c=w+4|0;d=k[c>>2]|0;if((d|0)!=(e|0))k[c>>2]=d+(~(((d+-2096-e|0)>>>0)/2096|0)*2096|0);rg(e);r=x;return}function Zd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;k[a>>2]=0;f=a+4|0;k[f>>2]=0;k[a+8>>2]=0;e=b+4|0;h=k[e>>2]|0;g=k[b>>2]|0;c=h-g|0;d=(c|0)/2096|0;if((h|0)==(g|0))return;if(d>>>0>2049125)mg(a);c=og(c)|0;k[f>>2]=c;k[a>>2]=c;k[a+8>>2]=c+(d*2096|0);d=k[b>>2]|0;b=k[e>>2]|0;if((d|0)==(b|0))return;do{ki(c|0,d|0,2096)|0;c=(k[f>>2]|0)+2096|0;k[f>>2]=c;d=d+2096|0}while((d|0)!=(b|0));return}function _d(a,b){a=a|0;b=b|0;if(!b)return;else{_d(a,k[b>>2]|0);_d(a,k[b+4>>2]|0);rg(b);return}}function $d(a,b){a=a|0;b=b|0;if(!b)return;else{$d(a,k[b>>2]|0);$d(a,k[b+4>>2]|0);rg(b);return}}function ae(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0.0,g=0,h=0.0,j=0.0,m=0.0,n=0.0,q=0.0,s=0.0,t=0.0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;C=r;r=r+2672|0;y=C+2144|0;x=C+40|0;z=C+2140|0;A=C+2136|0;B=C;w=C+8|0;if((c|0)==(d|0)){r=C;return}g=(d|0)<(c|0);u=g?c:d;g=g?d:c;k[w>>2]=g;k[w+4>>2]=u;i[w+8>>0]=1;c=k[b+(g<<2)>>2]|0;d=k[b+(u<<2)>>2]|0;b=d+c|0;t=+(c|0);if((c|0)<256)q=+o[4036+(c<<2)>>2];else q=+oh(t);s=+(d|0);if((d|0)<256)j=+o[4036+(d<<2)>>2];else j=+oh(s);m=+(b|0);if((b|0)<256)h=+o[4036+(b<<2)>>2];else h=+oh(m);v=w+24|0;d=a+(g*2096|0)|0;f=+p[a+(g*2096|0)+2088>>3];n=+p[a+(u*2096|0)+2088>>3];j=(t*q+s*j-m*h)*.5-f-n;p[v>>3]=j;do if(!(k[a+(g*2096|0)+2080>>2]|0)){p[w+16>>3]=n;f=n}else{b=k[a+(u*2096|0)+2080>>2]|0;if(!b){p[w+16>>3]=f;break}c=k[e>>2]|0;if((c|0)==(k[e+4>>2]|0))h=1.e+99;else{h=+p[c+24>>3];h=h>0.0?h:0.0}ki(x|0,d|0,2096)|0;d=x+2080|0;k[d>>2]=(k[d>>2]|0)+b;c=0;do{g=x+(c<<2)|0;k[g>>2]=(k[g>>2]|0)+(k[a+(u*2096|0)+(c<<2)>>2]|0);c=c+1|0}while((c|0)!=520);b=k[d>>2]|0;a:do if(!b)f=12.0;else{c=0;d=0;do{c=((k[x+(d<<2)>>2]|0)>0&1)+c|0;d=d+1|0}while((d|0)<520&(c|0)<5);g=c;switch(g|0){case 1:{f=12.0;break a}case 2:{f=+(b+20|0);break a}default:{}}gi(y|0,0,520)|0;Af(x,520,15,y);c=0;d=0;do{c=(ha(l[y+d>>0]|0,k[x+(d<<2)>>2]|0)|0)+c|0;d=d+1|0}while((d|0)!=520);switch(g|0){case 3:{c=c+28|0;break}case 4:{c=c+37|0;break}default:c=(Vd(y,520)|0)+c|0}f=+(c|0)}while(0);if(f<h-j){p[w+16>>3]=f;break}r=C;return}while(0);p[v>>3]=f+j;c=e+4|0;d=k[c>>2]|0;if((d|0)==(k[e+8>>2]|0)){ce(e,w);c=k[c>>2]|0}else{k[d>>2]=k[w>>2];k[d+4>>2]=k[w+4>>2];k[d+8>>2]=k[w+8>>2];k[d+12>>2]=k[w+12>>2];k[d+16>>2]=k[w+16>>2];k[d+20>>2]=k[w+20>>2];k[d+24>>2]=k[w+24>>2];k[d+28>>2]=k[w+28>>2];w=(k[c>>2]|0)+32|0;k[c>>2]=w;c=w}w=c;e=k[e>>2]|0;k[z>>2]=e;k[A>>2]=w;k[x>>2]=k[z>>2];k[y>>2]=k[A>>2];de(x,y,B,w-e>>5);r=C;return}function be(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0.0,g=0,h=0.0,i=0,j=0,l=0,m=0,n=0,o=0,q=0.0,s=0,t=0,u=0,v=0,w=0;v=r;r=r+16|0;u=v;l=k[e>>2]|0;s=k[a>>2]|0;c=l-s|0;if((d|0)<2){r=v;return}t=(d+-2|0)/2|0;if((t|0)<(c>>5|0)){r=v;return}a=c>>4|1;c=s+(a<<5)|0;b=c;i=a+1|0;do if((i|0)<(d|0)){g=s+(i<<5)|0;f=+p[s+(a<<5)+24>>3];h=+p[s+(i<<5)+24>>3];if(f!=h){if(!(f>h)){g=b;break}}else{n=(k[c>>2]|0)-(k[s+(a<<5)+4>>2]|0)|0;o=(k[g>>2]|0)-(k[s+(i<<5)+4>>2]|0)|0;if((((n|0)>-1?n:0-n|0)|0)<=(((o|0)>-1?o:0-o|0)|0)){g=b;break}}a=i}else g=b;while(0);c=g;f=+p[c+24>>3];q=+p[l+24>>3];do if(f!=q)if(f>q){r=v;return}else{b=k[l+4>>2]|0;i=k[l>>2]|0;break}else{n=(k[c>>2]|0)-(k[c+4>>2]|0)|0;i=k[l>>2]|0;b=k[l+4>>2]|0;o=i-b|0;if((((n|0)>-1?n:0-n|0)|0)>(((o|0)>-1?o:0-o|0)|0)){r=v;return}}while(0);j=l+8|0;k[u>>2]=k[j>>2];k[u+4>>2]=k[j+4>>2];k[u+8>>2]=k[j+8>>2];k[u+12>>2]=k[j+12>>2];j=g;k[l>>2]=k[j>>2];k[l+4>>2]=k[j+4>>2];k[l+8>>2]=k[j+8>>2];k[l+12>>2]=k[j+12>>2];k[l+16>>2]=k[j+16>>2];k[l+20>>2]=k[j+20>>2];k[l+24>>2]=k[j+24>>2];k[l+28>>2]=k[j+28>>2];k[e>>2]=g;a:do if((t|0)>=(a|0)){o=i-b|0;o=(o|0)>-1?o:0-o|0;while(1){a=a<<1|1;g=s+(a<<5)|0;l=g;n=a+1|0;do if((n|0)<(d|0)){m=s+(n<<5)|0;f=+p[s+(a<<5)+24>>3];h=+p[s+(n<<5)+24>>3];if(f!=h){if(!(f>h))break}else{w=(k[g>>2]|0)-(k[s+(a<<5)+4>>2]|0)|0;g=(k[m>>2]|0)-(k[s+(n<<5)+4>>2]|0)|0;if((((w|0)>-1?w:0-w|0)|0)<=(((g|0)>-1?g:0-g|0)|0))break}l=m;a=n}while(0);g=l;f=+p[g+24>>3];if(f!=q){if(f>q)break a}else{w=(k[g>>2]|0)-(k[g+4>>2]|0)|0;if((((w|0)>-1?w:0-w|0)|0)>(o|0))break a}w=j;j=l;k[w>>2]=k[j>>2];k[w+4>>2]=k[j+4>>2];k[w+8>>2]=k[j+8>>2];k[w+12>>2]=k[j+12>>2];k[w+16>>2]=k[j+16>>2];k[w+20>>2]=k[j+20>>2];k[w+24>>2]=k[j+24>>2];k[w+28>>2]=k[j+28>>2];k[e>>2]=l;if((t|0)<(a|0)){c=g;break}else c=g}}while(0);k[c>>2]=i;k[c+4>>2]=b;w=c+8|0;k[w>>2]=k[u>>2];k[w+4>>2]=k[u+4>>2];k[w+8>>2]=k[u+8>>2];k[w+12>>2]=k[u+12>>2];p[c+24>>3]=q;r=v;return}function ce(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;h=a+4|0;i=k[a>>2]|0;j=i;d=((k[h>>2]|0)-j>>5)+1|0;if(d>>>0>134217727)mg(a);l=a+8|0;e=i;c=(k[l>>2]|0)-e|0;if(c>>5>>>0<67108863){c=c>>4;c=c>>>0<d>>>0?d:c;e=(k[h>>2]|0)-e|0;d=e>>5;if(!c){g=0;f=0;c=e}else m=6}else{e=(k[h>>2]|0)-e|0;c=134217727;d=e>>5;m=6}if((m|0)==6){g=c;f=og(c<<5)|0;c=e}m=f+(d<<5)|0;k[m>>2]=k[b>>2];k[m+4>>2]=k[b+4>>2];k[m+8>>2]=k[b+8>>2];k[m+12>>2]=k[b+12>>2];k[m+16>>2]=k[b+16>>2];k[m+20>>2]=k[b+20>>2];k[m+24>>2]=k[b+24>>2];k[m+28>>2]=k[b+28>>2];ki(f|0,i|0,c|0)|0;k[a>>2]=f;k[h>>2]=f+(d+1<<5);k[l>>2]=f+(g<<5);if(!j)return;rg(j);return}function de(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0.0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0.0,o=0,q=0,s=0;q=r;r=r+16|0;o=q;if((d|0)<=1){r=q;return}i=(d+-2|0)/2|0;m=k[a>>2]|0;c=m+(i<<5)|0;g=c;h=k[b>>2]|0;j=h+-32|0;k[b>>2]=j;e=+p[m+(i<<5)+24>>3];n=+p[h+-8>>3];do if(e!=n)if(e>n){a=k[h+-28>>2]|0;l=k[j>>2]|0;break}else{r=q;return}else{s=(k[c>>2]|0)-(k[m+(i<<5)+4>>2]|0)|0;f=k[j>>2]|0;a=k[h+-28>>2]|0;l=f-a|0;if((((s|0)>-1?s:0-s|0)|0)>(((l|0)>-1?l:0-l|0)|0))l=f;else{r=q;return}}while(0);s=h+-24|0;k[o>>2]=k[s>>2];k[o+4>>2]=k[s+4>>2];k[o+8>>2]=k[s+8>>2];k[o+12>>2]=k[s+12>>2];k[j>>2]=k[c>>2];k[j+4>>2]=k[c+4>>2];k[j+8>>2]=k[c+8>>2];k[j+12>>2]=k[c+12>>2];k[j+16>>2]=k[c+16>>2];k[j+20>>2]=k[c+20>>2];k[j+24>>2]=k[c+24>>2];k[j+28>>2]=k[c+28>>2];k[b>>2]=g;a:do if((d+-1|0)>>>0>=3){j=l-a|0;j=(j|0)>-1?j:0-j|0;h=c;while(1){f=i;i=(i+-1|0)/2|0;c=m+(i<<5)|0;g=c;e=+p[m+(i<<5)+24>>3];if(e!=n){if(!(e>n)){c=h;break a}}else{s=(k[c>>2]|0)-(k[m+(i<<5)+4>>2]|0)|0;if((((s|0)>-1?s:0-s|0)|0)<=(j|0)){c=h;break a}};k[h>>2]=k[c>>2];k[h+4>>2]=k[c+4>>2];k[h+8>>2]=k[c+8>>2];k[h+12>>2]=k[c+12>>2];k[h+16>>2]=k[c+16>>2];k[h+20>>2]=k[c+20>>2];k[h+24>>2]=k[c+24>>2];k[h+28>>2]=k[c+28>>2];k[b>>2]=g;if(f>>>0<3)break;else h=c}}while(0);k[c>>2]=l;k[c+4>>2]=a;s=c+8|0;k[s>>2]=k[o>>2];k[s+4>>2]=k[o+4>>2];k[s+8>>2]=k[o+8>>2];k[s+12>>2]=k[o+12>>2];p[c+24>>3]=n;r=q;return}function ee(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;h=a+4|0;i=k[a>>2]|0;j=i;d=(((k[h>>2]|0)-j|0)/2832|0)+1|0;if(d>>>0>1516584)mg(a);l=a+8|0;e=i;c=((k[l>>2]|0)-e|0)/2832|0;if(c>>>0<758292){c=c<<1;c=c>>>0<d>>>0?d:c;e=(k[h>>2]|0)-e|0;d=(e|0)/2832|0;if(!c){g=0;f=0;c=e}else m=6}else{e=(k[h>>2]|0)-e|0;c=1516584;d=(e|0)/2832|0;m=6}if((m|0)==6){g=c;f=og(c*2832|0)|0;c=e}ki(f+(d*2832|0)|0,b|0,2832)|0;m=f+((((c|0)/-2832|0)+d|0)*2832|0)|0;ki(m|0,i|0,c|0)|0;k[a>>2]=m;k[h>>2]=f+((d+1|0)*2832|0);k[l>>2]=f+(g*2832|0);if(!j)return;rg(j);return}function fe(a,b,c,d,e){a=a|0;b=b|0;c=+c;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,n=0.0,q=0,r=0.0,s=0,t=0,u=0,v=0,w=0,x=0.0;q=k[d>>2]|0;d=(k[d+4>>2]|0)-q|0;w=(d|0)/2832|0;if(w>>>0<2){if(!b)return;gi(e|0,0,b|0)|0;return}v=w*704|0;v=qg(v>>>0>536870911?-1:v<<3)|0;gi(v|0,0,w*5632|0)|0;u=(d|0)>0;h=0;do{if(u){g=ha(h,w)|0;j=0;do{d=k[q+(j*2832|0)+2816>>2]|0;f=k[q+(j*2832|0)+(h<<2)>>2]|0;if((d|0)<256)r=+o[4036+(d<<2)>>2];else r=+oh(+(d|0));if(!f)n=r+2.0;else{if((f|0)<256)n=+o[4036+(f<<2)>>2];else n=+oh(+(f|0));n=r-n}p[v+(j+g<<3)>>3]=n;j=j+1|0}while((j|0)<(w|0))}h=h+1|0}while((h|0)!=704);s=qg(w>>>0>536870911?-1:w<<3)|0;gi(s|0,0,w<<3|0)|0;q=ha(w,b)|0;t=qg(q)|0;gi(t|0,0,q|0)|0;if(b){j=0;do{h=ha(j,w)|0;d=ha(m[a+(j<<1)>>1]|0,w)|0;if(u){f=e+j|0;g=0;n=1.e+99;while(1){q=s+(g<<3)|0;r=+p[v+(g+d<<3)>>3]+ +p[q>>3];p[q>>3]=r;if(r<n)i[f>>0]=g;else r=n;g=g+1|0;if((g|0)>=(w|0))break;else n=r}}else r=1.e+99;if(j>>>0<2e3)n=(+(j>>>0)*.07/2.0e3+.77)*c;else n=c;if(u){f=0;do{d=s+(f<<3)|0;x=+p[d>>3]-r;p[d>>3]=x;if(x>=n){p[d>>3]=n;i[t+(f+h)>>0]=1}f=f+1|0}while((f|0)<(w|0))}j=j+1|0}while((j|0)!=(b|0));d=b+-1|0;if((d|0)>0){q=d;h=l[e+d>>0]|0;j=ha(w,d)|0;while(1){g=q;q=q+-1|0;j=j-w|0;f=e+q|0;if(!(i[t+(j+h)>>0]|0))d=h;else d=l[f>>0]|0;i[f>>0]=d;if((g|0)<=1)break;else h=d}}}sg(v);sg(s);sg(t);return}function ge(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,n=0;h=Fd(c,b)|0;i=k[d>>2]|0;n=d+4|0;e=k[n>>2]|0;f=i;if((e|0)==(i|0))g=i;else{g=e+(~(((e+-2832-f|0)>>>0)/2832|0)*2832|0)|0;k[n>>2]=g}e=(g-f|0)/2832|0;if(h>>>0<=e>>>0){if(h>>>0<e>>>0?(j=i+(h*2832|0)|0,(g|0)!=(j|0)):0)k[n>>2]=g+(~(((g+-2832-j|0)>>>0)/2832|0)*2832|0)}else je(d,h-e|0);if(!b)return;e=k[d>>2]|0;f=0;do{d=l[c+f>>0]|0;n=e+(d*2832|0)+((m[a+(f<<1)>>1]|0)<<2)|0;k[n>>2]=(k[n>>2]|0)+1;d=e+(d*2832|0)+2816|0;k[d>>2]=(k[d>>2]|0)+1;f=f+1|0}while((f|0)!=(b|0));return}function he(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,l=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0;w=r;r=r+2880|0;u=w+2868|0;s=w+2856|0;l=w;q=w+2844|0;o=w+2832|0;k[u>>2]=0;v=u+4|0;k[v>>2]=0;k[u+8>>2]=0;k[s>>2]=0;t=s+4|0;k[t>>2]=0;k[s+8>>2]=0;n=(b|0)==0;do if(!n)if(b>>>0>1073741823)mg(s);else{h=b<<2;d=og(h)|0;k[s>>2]=d;j=d+(b<<2)|0;k[s+8>>2]=j;gi(d|0,0,h|0)|0;k[t>>2]=j;break}else d=0;while(0);gi(l|0,0,2820)|0;h=l+2816|0;j=u+8|0;g=0;e=0;a:while(1){while(1){if(e>>>0>=b>>>0)break a;f=e+1|0;if((f|0)==(b|0)){p=10;break}x=(i[c+e>>0]|0)==(i[c+f>>0]|0);k[d+(e<<2)>>2]=g;e=l+(m[a+(e<<1)>>1]<<2)|0;k[e>>2]=(k[e>>2]|0)+1;k[h>>2]=(k[h>>2]|0)+1;if(x)e=f;else{e=f;break}}if((p|0)==10){p=0;k[d+(e<<2)>>2]=g;e=l+(m[a+(e<<1)>>1]<<2)|0;k[e>>2]=(k[e>>2]|0)+1;k[h>>2]=(k[h>>2]|0)+1;e=b}f=k[v>>2]|0;if((f|0)==(k[j>>2]|0)){ee(u,l);d=k[s>>2]|0}else{ki(f|0,l|0,2832)|0;k[v>>2]=f+2832}gi(l|0,0,2820)|0;g=g+1|0}k[q>>2]=0;h=q+4|0;k[h>>2]=0;k[q+8>>2]=0;k[o>>2]=0;g=o+4|0;k[g>>2]=0;k[o+8>>2]=0;ie(u,1,((k[v>>2]|0)-(k[u>>2]|0)|0)/2832|0,256,q,o);if(n){d=k[o>>2]|0;if(d)p=19}else{f=k[s>>2]|0;d=k[o>>2]|0;e=0;do{i[c+e>>0]=k[d+(k[f+(e<<2)>>2]<<2)>>2];e=e+1|0}while((e|0)!=(b|0));p=19}if((p|0)==19){e=k[g>>2]|0;if((e|0)!=(d|0))k[g>>2]=e+(~((e+-4-d|0)>>>2)<<2);rg(d)}d=k[q>>2]|0;e=d;if(d){f=k[h>>2]|0;if((f|0)!=(d|0))k[h>>2]=f+(~(((f+-2832-e|0)>>>0)/2832|0)*2832|0);rg(d)}d=k[s>>2]|0;e=d;if(d){f=k[t>>2]|0;if((f|0)!=(d|0))k[t>>2]=f+(~((f+-4-e|0)>>>2)<<2);rg(d)}d=k[u>>2]|0;if(!d){r=w;return}e=k[v>>2]|0;if((e|0)!=(d|0))k[v>>2]=e+(~(((e+-2832-d|0)>>>0)/2832|0)*2832|0);rg(d);r=w;return}function ie(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0.0,j=0,m=0,n=0,o=0,q=0,s=0,t=0,u=0,v=0;v=r;r=r+720|0;q=v+16|0;t=v;s=ha(c,b)|0;k[t>>2]=0;u=t+4|0;k[u>>2]=0;k[t+8>>2]=0;if(s){if(s>>>0>1073741823)mg(t);j=og(s<<2)|0;k[u>>2]=j;k[t>>2]=j;h=j+(s<<2)|0;k[t+8>>2]=h;g=s;while(1){k[j>>2]=1;g=g+-1|0;if(!g)break;else j=j+4|0}k[u>>2]=h}g=e+4|0;h=k[g>>2]|0;j=k[e>>2]|0;m=(h-j|0)/2832|0;if(s>>>0<=m>>>0){if(s>>>0<m>>>0?(n=j+(s*2832|0)|0,(h|0)!=(n|0)):0)k[g>>2]=h+(~(((h+-2832-n|0)>>>0)/2832|0)*2832|0)}else je(e,s-m|0);g=f+4|0;h=k[g>>2]|0;j=k[f>>2]|0;m=h-j>>2;if(s>>>0<=m>>>0){if(s>>>0<m>>>0?(o=j+(s<<2)|0,(h|0)!=(o|0)):0)k[g>>2]=h+(~((h+-4-o|0)>>>2)<<2)}else Ud(f,s-m|0);if((s|0)>0){g=k[e>>2]|0;o=0;do{ki(g+(o*2832|0)|0,(k[a>>2]|0)+(o*2832|0)|0,2832)|0;n=k[a>>2]|0;j=k[n+(o*2832|0)+2816>>2]|0;a:do if(!j)i=12.0;else{g=0;h=0;do{g=((k[n+(o*2832|0)+(h<<2)>>2]|0)>0&1)+g|0;h=h+1|0}while((h|0)<704&(g|0)<5);m=g;switch(m|0){case 1:{i=12.0;break a}case 2:{i=+(j+20|0);break a}default:{}}gi(q|0,0,704)|0;Af(n+(o*2832|0)|0,704,15,q);g=0;h=0;do{g=(ha(l[q+h>>0]|0,k[n+(o*2832|0)+(h<<2)>>2]|0)|0)+g|0;h=h+1|0}while((h|0)!=704);switch(m|0){case 3:{g=g+28|0;break}case 4:{g=g+37|0;break}default:g=(Vd(q,704)|0)+g|0}i=+(g|0)}while(0);g=k[e>>2]|0;p[g+(o*2832|0)+2824>>3]=i;k[(k[f>>2]|0)+(o<<2)>>2]=o;o=o+1|0}while((o|0)<(s|0))}if((b|0)>1&(c|0)>0){g=0;do{q=ha(g,b)|0;ke(k[e>>2]|0,k[t>>2]|0,(k[f>>2]|0)+(q<<2)|0,b,d);g=g+1|0}while((g|0)<(c|0))}ke(k[e>>2]|0,k[t>>2]|0,k[f>>2]|0,s,d);le(k[a>>2]|0,s,k[e>>2]|0,k[f>>2]|0);me(e,f);h=k[t>>2]|0;if(!h){r=v;return}g=k[u>>2]|0;if((g|0)!=(h|0))k[u>>2]=g+(~((g+-4-h|0)>>>2)<<2);rg(h);r=v;return}function je(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;i=a+8|0;e=k[i>>2]|0;j=a+4|0;c=k[j>>2]|0;d=c;if(((e-d|0)/2832|0)>>>0>=b>>>0){do{gi(c|0,0,2820)|0;c=(k[j>>2]|0)+2832|0;k[j>>2]=c;b=b+-1|0}while((b|0)!=0);return}c=k[a>>2]|0;d=((d-c|0)/2832|0)+b|0;if(d>>>0>1516584)mg(a);f=c;c=(e-f|0)/2832|0;if(c>>>0<758292){c=c<<1;c=c>>>0<d>>>0?d:c;d=((k[j>>2]|0)-f|0)/2832|0;if(!c){e=0;g=0}else h=8}else{c=1516584;d=((k[j>>2]|0)-f|0)/2832|0;h=8}if((h|0)==8){e=c;g=og(c*2832|0)|0}c=g+(d*2832|0)|0;f=g+(e*2832|0)|0;e=c;do{gi(e|0,0,2820)|0;e=c+2832|0;c=e;b=b+-1|0}while((b|0)!=0);b=k[a>>2]|0;e=(k[j>>2]|0)-b|0;h=g+((((e|0)/-2832|0)+d|0)*2832|0)|0;ki(h|0,b|0,e|0)|0;k[a>>2]=h;k[j>>2]=c;k[i>>2]=f;if(!b)return;rg(b);return}function ke(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,q=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;I=r;r=r+96|0;x=I+8|0;w=I+92|0;v=I+88|0;y=I+84|0;z=I+80|0;A=I+76|0;B=I;H=I+64|0;E=I+52|0;D=I+40|0;s=H+4|0;k[s>>2]=0;t=H+8|0;k[t>>2]=0;F=H+4|0;k[H>>2]=F;k[E>>2]=0;G=E+4|0;k[G>>2]=0;k[E+8>>2]=0;C=(d|0)>0;if(C){o=F;q=E+8|0;l=0;f=0;while(1){n=c+(f<<2)|0;if(l){j=k[n>>2]|0;g=F;h=l;a:do{while(1){if((k[h+16>>2]|0)>=(j|0)){g=h;break}h=k[h+4>>2]|0;if(!h)break a}h=k[g>>2]|0}while((h|0)!=0);if(!((g|0)!=(F|0)?(j|0)>=(k[g+16>>2]|0):0))m=11}else m=11;do if((m|0)==11){m=0;do if(l){j=k[n>>2]|0;while(1){g=k[l+16>>2]|0;if((j|0)<(g|0)){g=k[l>>2]|0;if(!g){g=l;h=l;m=15;break}}else{if((g|0)>=(j|0)){g=l;m=20;break}h=l+4|0;g=k[h>>2]|0;if(!g){g=h;h=l;m=19;break}}l=g}if((m|0)==15){m=0;k[x>>2]=h;j=g;break}else if((m|0)==19){m=0;k[x>>2]=h;j=g;break}else if((m|0)==20){m=0;k[x>>2]=g;j=x;h=g;break}}else{k[x>>2]=F;j=F;h=o}while(0);if(!(k[j>>2]|0)){g=og(20)|0;k[g+16>>2]=k[n>>2];k[g>>2]=0;k[g+4>>2]=0;k[g+8>>2]=h;k[j>>2]=g;h=k[k[H>>2]>>2]|0;if(h){k[H>>2]=h;g=k[j>>2]|0}Hc(k[s>>2]|0,g);k[t>>2]=(k[t>>2]|0)+1}g=k[G>>2]|0;if((g|0)==(k[q>>2]|0)){Jd(E,n);break}else{k[g>>2]=k[n>>2];k[G>>2]=g+4;break}}while(0);f=f+1|0;if((f|0)>=(d|0))break;l=k[F>>2]|0}g=k[G>>2]|0;f=k[E>>2]|0}else{g=0;f=0}k[D>>2]=0;s=D+4|0;k[s>>2]=0;k[D+8>>2]=0;if((g|0)==(f|0))g=f;else{l=0;do{j=l;l=l+1|0;if(l>>>0<g-f>>2>>>0){h=l;do{oe(a,b,k[f+(j<<2)>>2]|0,k[f+(h<<2)>>2]|0,D);h=h+1|0;g=k[G>>2]|0;f=k[E>>2]|0}while(h>>>0<g-f>>2>>>0)}}while(l>>>0<g-f>>2>>>0)}b:do if(g-f>>2>>>0>1){u=0.0;q=1;while(1){while(1){m=k[D>>2]|0;if(+p[m+24>>3]>=u)break;o=k[m>>2]|0;n=k[m+4>>2]|0;h=a+(o*2832|0)+2816|0;k[h>>2]=(k[h>>2]|0)+(k[a+(n*2832|0)+2816>>2]|0);h=0;do{t=a+(o*2832|0)+(h<<2)|0;k[t>>2]=(k[t>>2]|0)+(k[a+(n*2832|0)+(h<<2)>>2]|0);h=h+1|0}while((h|0)!=704);p[a+(o*2832|0)+2824>>3]=+p[m+16>>3];t=b+(o<<2)|0;k[t>>2]=(k[t>>2]|0)+(k[b+(n<<2)>>2]|0);if(C){j=0;do{h=c+(j<<2)|0;if((k[h>>2]|0)==(n|0))k[h>>2]=o;j=j+1|0}while((j|0)!=(d|0))}j=g-f>>2;if(j>>>0>1){l=1;h=0;while(1){h=f+(h<<2)|0;if((k[h>>2]|0)>=(n|0))k[h>>2]=k[f+(l<<2)>>2];h=l+1|0;if(h>>>0<j>>>0){t=l;l=h;h=t}else break}}k[G>>2]=g+-4;f=k[s>>2]|0;g=(f|0)==(m|0);c:do if(!g){h=f-m>>5;l=0;do{j=k[m+(l<<5)>>2]|0;if(!((j|0)!=(o|0)?(t=k[m+(l<<5)+4>>2]|0,!((t|0)==(n|0)|((j|0)==(n|0)|(t|0)==(o|0)))):0))i[m+(l<<5)+8>>0]=0;l=l+1|0}while(l>>>0<h>>>0);if(!g){g=m;do{if(i[g+8>>0]|0)break c;h=g;j=f-h|0;if((j|0)>32){f=f+-32|0;k[x>>2]=k[g>>2];k[x+4>>2]=k[g+4>>2];k[x+8>>2]=k[g+8>>2];k[x+12>>2]=k[g+12>>2];k[x+16>>2]=k[g+16>>2];k[x+20>>2]=k[g+20>>2];k[x+24>>2]=k[g+24>>2];k[x+28>>2]=k[g+28>>2];k[g>>2]=k[f>>2];k[g+4>>2]=k[f+4>>2];k[g+8>>2]=k[f+8>>2];k[g+12>>2]=k[f+12>>2];k[g+16>>2]=k[f+16>>2];k[g+20>>2]=k[f+20>>2];k[g+24>>2]=k[f+24>>2];k[g+28>>2]=k[f+28>>2];k[f>>2]=k[x>>2];k[f+4>>2]=k[x+4>>2];k[f+8>>2]=k[x+8>>2];k[f+12>>2]=k[x+12>>2];k[f+16>>2]=k[x+16>>2];k[f+20>>2]=k[x+20>>2];k[f+24>>2]=k[x+24>>2];k[f+28>>2]=k[x+28>>2];k[y>>2]=h;k[z>>2]=f;k[A>>2]=h;k[v>>2]=k[y>>2];k[w>>2]=k[z>>2];k[x>>2]=k[A>>2];be(v,w,B,(j>>5)+-1|0,x);f=k[s>>2]|0;g=k[D>>2]|0}f=f+-32|0;k[s>>2]=f}while((g|0)!=(f|0))}}while(0);h=k[G>>2]|0;f=k[E>>2]|0;if((h|0)==(f|0)){g=h;f=h}else{h=0;do{oe(a,b,o,k[f+(h<<2)>>2]|0,D);h=h+1|0;g=k[G>>2]|0;f=k[E>>2]|0}while(h>>>0<g-f>>2>>>0)}if(g-f>>2>>>0<=q>>>0)break b}if(g-f>>2>>>0>e>>>0){u=1.e+99;q=e}else break}}while(0);g=k[D>>2]|0;h=g;if(g){f=k[s>>2]|0;if((f|0)!=(g|0))k[s>>2]=f+(~((f+-32-h|0)>>>5)<<5);rg(g);f=k[E>>2]|0}if(!f){G=k[F>>2]|0;$d(H,G);r=I;return}g=k[G>>2]|0;if((g|0)!=(f|0))k[G>>2]=g+(~((g+-4-f|0)>>>2)<<2);rg(f);G=k[F>>2]|0;$d(H,G);r=I;return}function le(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0.0,i=0.0,j=0,m=0,n=0,o=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;D=r;r=r+3552|0;y=D+2848|0;z=D;C=D+2832|0;o=C+4|0;k[o>>2]=0;q=C+8|0;k[q>>2]=0;B=C+4|0;k[C>>2]=B;A=(b|0)>0;if(A){s=B;f=0;n=0;while(1){m=d+(n<<2)|0;do if(f){g=k[m>>2]|0;j=f;while(1){e=k[j+16>>2]|0;if((g|0)<(e|0)){e=k[j>>2]|0;if(!e){e=j;f=j;x=10;break}}else{if((e|0)>=(g|0)){e=j;x=15;break}f=j+4|0;e=k[f>>2]|0;if(!e){e=f;f=j;x=14;break}}j=e}if((x|0)==10){x=0;k[y>>2]=f;g=e;break}else if((x|0)==14){x=0;k[y>>2]=f;g=e;break}else if((x|0)==15){x=0;k[y>>2]=e;g=y;f=e;break}}else{k[y>>2]=B;g=B;f=s}while(0);if(!(k[g>>2]|0)){e=og(20)|0;k[e+16>>2]=k[m>>2];k[e>>2]=0;k[e+4>>2]=0;k[e+8>>2]=f;k[g>>2]=e;f=k[k[C>>2]>>2]|0;if(f){k[C>>2]=f;e=k[g>>2]|0}Hc(k[o>>2]|0,e);k[q>>2]=(k[q>>2]|0)+1}e=n+1|0;if((e|0)>=(b|0))break;f=k[B>>2]|0;n=e}if(A){u=z+2816|0;v=z+2816|0;w=0;while(1){e=k[((w|0)==0?d:d+(w+-1<<2)|0)>>2]|0;s=a+(w*2832|0)|0;t=a+(w*2832|0)+2816|0;if(!(k[t>>2]|0))h=0.0;else{ki(z|0,s|0,2832)|0;k[v>>2]=(k[v>>2]|0)+(k[c+(e*2832|0)+2816>>2]|0);f=0;do{q=z+(f<<2)|0;k[q>>2]=(k[q>>2]|0)+(k[c+(e*2832|0)+(f<<2)>>2]|0);f=f+1|0}while((f|0)!=704);j=k[v>>2]|0;a:do if(!j)h=12.0;else{f=0;g=0;do{f=((k[z+(g<<2)>>2]|0)>0&1)+f|0;g=g+1|0}while((g|0)<704&(f|0)<5);m=f;switch(m|0){case 1:{h=12.0;break a}case 2:{h=+(j+20|0);break a}default:{}}gi(y|0,0,704)|0;Af(z,704,15,y);f=0;g=0;do{f=(ha(l[y+g>>0]|0,k[z+(g<<2)>>2]|0)|0)+f|0;g=g+1|0}while((g|0)!=704);switch(m|0){case 3:{f=f+28|0;break}case 4:{f=f+37|0;break}default:f=(Vd(y,704)|0)+f|0}h=+(f|0)}while(0);h=h-+p[c+(e*2832|0)+2824>>3]}f=k[C>>2]|0;if((f|0)!=(B|0)){g=f;while(1){q=g+16|0;o=k[q>>2]|0;if(!(k[t>>2]|0))i=0.0;else{ki(z|0,s|0,2832)|0;k[u>>2]=(k[u>>2]|0)+(k[c+(o*2832|0)+2816>>2]|0);f=0;do{n=z+(f<<2)|0;k[n>>2]=(k[n>>2]|0)+(k[c+(o*2832|0)+(f<<2)>>2]|0);f=f+1|0}while((f|0)!=704);m=k[u>>2]|0;b:do if(!m)i=12.0;else{f=0;j=0;do{f=((k[z+(j<<2)>>2]|0)>0&1)+f|0;j=j+1|0}while((j|0)<704&(f|0)<5);n=f;switch(n|0){case 1:{i=12.0;break b}case 2:{i=+(m+20|0);break b}default:{}}gi(y|0,0,704)|0;Af(z,704,15,y);f=0;j=0;do{f=(ha(l[y+j>>0]|0,k[z+(j<<2)>>2]|0)|0)+f|0;j=j+1|0}while((j|0)!=704);switch(n|0){case 3:{f=f+28|0;break}case 4:{f=f+37|0;break}default:f=(Vd(y,704)|0)+f|0}i=+(f|0)}while(0);i=i-+p[c+(o*2832|0)+2824>>3]}if(i<h){h=i;e=k[q>>2]|0}f=k[g+4>>2]|0;if(!f)while(1){f=k[g+8>>2]|0;if((k[f>>2]|0)==(g|0))break;else g=f}else while(1){g=k[f>>2]|0;if(!g)break;else f=g}if((f|0)==(B|0))break;else g=f}}k[d+(w<<2)>>2]=e;w=w+1|0;if((w|0)>=(b|0)){g=B;e=C;break}}}else x=4}else x=4;if((x|0)==4){g=B;e=C}f=k[e>>2]|0;if((f|0)!=(g|0))while(1){gi(c+((k[f+16>>2]|0)*2832|0)|0,0,2820)|0;e=k[f+4>>2]|0;if(!e)while(1){e=k[f+8>>2]|0;if((k[e>>2]|0)==(f|0))break;else f=e}else while(1){f=k[e>>2]|0;if(!f)break;else e=f}if((e|0)==(B|0))break;else f=e}if(A)g=0;else{d=k[B>>2]|0;$d(C,d);r=D;return}do{e=k[d+(g<<2)>>2]|0;f=c+(e*2832|0)+2816|0;k[f>>2]=(k[f>>2]|0)+(k[a+(g*2832|0)+2816>>2]|0);f=0;do{A=c+(e*2832|0)+(f<<2)|0;k[A>>2]=(k[A>>2]|0)+(k[a+(g*2832|0)+(f<<2)>>2]|0);f=f+1|0}while((f|0)!=704);g=g+1|0}while((g|0)!=(b|0));d=k[B>>2]|0;$d(C,d);r=D;return}
function $b(a){a=a|0;var b=0;b=r;r=r+a|0;r=r+15&-16;return b|0}function ac(){return r|0}function bc(a){a=a|0;r=a}function cc(a,b){a=a|0;b=b|0;r=a;s=b}function dc(a,b){a=a|0;b=b|0;if(!w){w=a;x=b}}function ec(a){a=a|0;i[t>>0]=i[a>>0];i[t+1>>0]=i[a+1>>0];i[t+2>>0]=i[a+2>>0];i[t+3>>0]=i[a+3>>0]}function fc(a){a=a|0;i[t>>0]=i[a>>0];i[t+1>>0]=i[a+1>>0];i[t+2>>0]=i[a+2>>0];i[t+3>>0]=i[a+3>>0];i[t+4>>0]=i[a+4>>0];i[t+5>>0]=i[a+5>>0];i[t+6>>0]=i[a+6>>0];i[t+7>>0]=i[a+7>>0]}function gc(a){a=a|0;L=a}function hc(){return L|0}function ic(){return Qh(1,4)|0}function jc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=r;r=r+16|0;e=d;f=a;a=dd(f,b)|0;k[e>>2]=a;a=Qh(a,1)|0;ed(f,b,a,e)|0;k[c>>2]=k[e>>2];r=d;return a|0}function kc(a,b){a=a|0;b=b|0;Ph(a);Ph(b);return}function lc(a){a=a|0;return Rb[a&1]()|0}function mc(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return Pb[a&15](b,c,d)|0}function nc(a,b,c){a=a|0;b=b|0;c=c|0;Tb[a&1](b,c);return}function oc(){Pa(72024,1,696,72052,4,1);Pa(72035,4,700,72055,1,8);Pa(72043,3,716,72061,1,1);return}function pc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;J=r;r=r+16|0;I=J;if(b>>>0<2){I=0;r=J;return I|0}t=qh(l[a>>0]|l[a+1>>0]<<8)|0;if(!(t<<16>>16)){I=1;r=J;return I|0}if(b>>>0<4){I=0;r=J;return I|0}F=a+2|0;F=qh(l[F>>0]|l[F+1>>0]<<8)|0;j[c>>1]=F;if(b>>>0<6){I=0;r=J;return I|0}F=a+4|0;F=qh(l[F>>0]|l[F+1>>0]<<8)|0;j[c+4>>1]=F;if(b>>>0<8){I=0;r=J;return I|0}F=a+6|0;F=qh(l[F>>0]|l[F+1>>0]<<8)|0;j[c+2>>1]=F;if(b>>>0<10){I=0;r=J;return I|0}F=a+8|0;F=qh(l[F>>0]|l[F+1>>0]<<8)|0;j[c+6>>1]=F;if(t<<16>>16<=0){if(t<<16>>16!=-1){I=0;r=J;return I|0}p=c+36|0;i[p>>0]=0;k[c+28>>2]=a+10;f=10;s=0;while(1){q=f+2|0;if(q>>>0>b>>>0){y=0;w=143;break}n=a+f|0;n=qh(l[n>>0]|l[n+1>>0]<<8)|0;s=(n&65535)>>>8&1|s&255;o=s&255;i[p>>0]=o;f=(n&1)<<1;h=f|4;m=n&65535;do if(!(m&8))if(!(m&64)){h=(m&128|0)==0?h:f|12;break}else{h=h+4|0;break}else h=h+2|0;while(0);if(h>>>0>1073741824){y=0;w=143;break}f=h+q|0;if(f>>>0>b>>>0|q>>>0>(b-h|0)>>>0){y=0;w=143;break}if(!(n&32)){u=o;v=f;w=85;break}}if((w|0)==85){k[c+32>>2]=v+-10;e=c+8|0;if(!(u<<24>>24)){j[e>>1]=0;I=1;r=J;return I|0}d=v+2|0;if(d>>>0>b>>>0){I=0;r=J;return I|0}else{I=a+v|0;I=qh(l[I>>0]|l[I+1>>0]<<8)|0;j[e>>1]=I;k[c+12>>2]=a+d;I=I&65535;r=J;return d>>>0<=(b-I|0)>>>0&(I+d|0)>>>0<=b>>>0|0}}else if((w|0)==143){r=J;return y|0}}F=t<<16>>16;D=c+16|0;o=c+20|0;f=k[o>>2]|0;h=k[D>>2]|0;m=(f-h|0)/12|0;if(F>>>0<=m>>>0)if(F>>>0<m>>>0?(x=h+(F*12|0)|0,(f|0)!=(x|0)):0){h=f;while(1){f=h+-12|0;k[o>>2]=f;m=k[f>>2]|0;n=m;if(m){f=h+-8|0;h=k[f>>2]|0;if((h|0)!=(m|0))k[f>>2]=h+(~(((h+-12-n|0)>>>0)/12|0)*12|0);rg(m);f=k[o>>2]|0}if((f|0)==(x|0)){h=10;t=0;u=0;break}else h=f}}else{h=10;t=0;u=0}else{rc(D,F-m|0);h=10;t=0;u=0}while(1){f=h+2|0;if(f>>>0>b>>>0){y=0;w=143;break}o=a+h|0;n=u;u=qh(l[o>>0]|l[o+1>>0]<<8)|0;o=k[D>>2]|0;m=o+(t*12|0)|0;n=((t|0)==0&1)-(n&65535)+(u&65535)&65535;o=o+(t*12|0)+4|0;p=k[o>>2]|0;q=k[m>>2]|0;s=(p-q|0)/12|0;if(n>>>0<=s>>>0){if(n>>>0<s>>>0?(A=q+(n*12|0)|0,(p|0)!=(A|0)):0)k[o>>2]=p+(~(((p+-12-A|0)>>>0)/12|0)*12|0)}else sc(m,n-s|0);t=t+1|0;if((t|0)>=(F|0)){z=h;B=f;break}else h=f}if((w|0)==143){r=J;return y|0}f=z+4|0;if(f>>>0>b>>>0){I=0;r=J;return I|0}h=a+B|0;h=qh(l[h>>0]|l[h+1>>0]<<8)|0;j[c+8>>1]=h;k[c+12>>2]=a+f;c=h&65535;h=c+f|0;if(h>>>0>b>>>0|f>>>0>(b-c|0)>>>0){I=0;r=J;return I|0}tc(I,F);f=k[D>>2]|0;m=0;w=0;x=0;a:while(1){q=k[I>>2]|0;v=q+(x*12|0)|0;o=k[f+(x*12|0)+4>>2]|0;n=k[f+(x*12|0)>>2]|0;p=(o-n|0)/12|0;q=q+(x*12|0)+4|0;s=k[q>>2]|0;t=k[v>>2]|0;u=s-t|0;if(p>>>0<=u>>>0){if(p>>>0<u>>>0?(C=t+p|0,(s|0)!=(C|0)):0)k[q>>2]=C}else{uc(v,p-u|0);f=k[D>>2]|0;o=k[f+(x*12|0)+4>>2]|0;n=k[f+(x*12|0)>>2]|0}if((o|0)==(n|0))n=w;else{f=w;o=0;while(1){if(!(m<<24>>24)){m=h+1|0;if(m>>>0>b>>>0){w=89;break a}f=i[a+h>>0]|0;if(!(f&8)){n=f;h=m;m=0}else{h=h+2|0;if(h>>>0>b>>>0){w=98;break a}n=f;m=i[a+m>>0]|0}}else{n=f;m=m+-1<<24>>24}i[(k[(k[I>>2]|0)+(x*12|0)>>2]|0)+o>>0]=n;f=k[D>>2]|0;c=k[f+(x*12|0)>>2]|0;i[c+(o*12|0)+8>>0]=n&1;o=o+1|0;if(o>>>0>=(((k[f+(x*12|0)+4>>2]|0)-c|0)/12|0)>>>0)break;else f=n}}x=x+1|0;if((x|0)>=(F|0)){g=h;w=27;break}else w=n}if((w|0)==27){u=k[D>>2]|0;t=0;f=0;b:while(1){h=k[u+(t*12|0)+4>>2]|0;s=k[u+(t*12|0)>>2]|0;if((h|0)!=(s|0)){p=k[I>>2]|0;q=k[p+(t*12|0)>>2]|0;o=(h-s|0)/12|0;n=0;do{h=l[q+n>>0]|0;if(!(h&2)){if(!(h&16)){h=g+2|0;if(h>>>0>b>>>0){E=p;w=116;break b}m=a+g|0;m=qh(l[m>>0]|l[m+1>>0]<<8)|0;g=h}else m=0;f=(m<<16>>16)+f|0;k[s+(n*12|0)>>2]=f}else{m=g+1|0;if(m>>>0>b>>>0){d=p;w=107;break b}f=(ha(l[a+g>>0]|0,(h>>>3&2)+-1|0)|0)+f|0;k[s+(n*12|0)>>2]=f;g=m}n=n+1|0}while(n>>>0<o>>>0)}t=t+1|0;if((t|0)>=(F|0)){e=g;w=44;break}}if((w|0)==44){s=k[D>>2]|0;q=0;d=0;c:while(1){f=k[s+(q*12|0)+4>>2]|0;p=k[s+(q*12|0)>>2]|0;if((f|0)!=(p|0)){n=k[I>>2]|0;o=k[n+(q*12|0)>>2]|0;m=(f-p|0)/12|0;h=0;do{f=l[o+h>>0]|0;if(!(f&4)){if(!(f&32)){f=e+2|0;if(f>>>0>b>>>0){H=n;w=134;break c}g=a+e|0;g=qh(l[g>>0]|l[g+1>>0]<<8)|0;e=f}else g=0;d=(g<<16>>16)+d|0;k[p+(h*12|0)+4>>2]=d}else{g=e+1|0;if(g>>>0>b>>>0){G=n;w=125;break c}d=(ha(l[a+e>>0]|0,(f>>>4&2)+-1|0)|0)+d|0;k[p+(h*12|0)+4>>2]=d;e=g}h=h+1|0}while(h>>>0<m>>>0)}q=q+1|0;if((q|0)>=(F|0)){w=65;break}}if((w|0)==65){d=k[I>>2]|0;if(!d){I=1;r=J;return I|0}h=I+4|0;e=k[h>>2]|0;if((e|0)!=(d|0)){do{f=e+-12|0;k[h>>2]=f;g=k[f>>2]|0;if(!g)e=f;else{e=e+-8|0;if((k[e>>2]|0)!=(g|0))k[e>>2]=g;rg(g);e=k[h>>2]|0}}while((e|0)!=(d|0));d=k[I>>2]|0}rg(d);I=1;r=J;return I|0}else if((w|0)==125){if(!G){I=0;r=J;return I|0}g=I+4|0;d=k[g>>2]|0;if((d|0)==(G|0))d=G;else{do{e=d+-12|0;k[g>>2]=e;f=k[e>>2]|0;if(!f)d=e;else{d=d+-8|0;if((k[d>>2]|0)!=(f|0))k[d>>2]=f;rg(f);d=k[g>>2]|0}}while((d|0)!=(G|0));d=k[I>>2]|0}rg(d);I=0;r=J;return I|0}else if((w|0)==134){if(!H){I=0;r=J;return I|0}g=I+4|0;d=k[g>>2]|0;if((d|0)==(H|0))d=H;else{do{e=d+-12|0;k[g>>2]=e;f=k[e>>2]|0;if(!f)d=e;else{d=d+-8|0;if((k[d>>2]|0)!=(f|0))k[d>>2]=f;rg(f);d=k[g>>2]|0}}while((d|0)!=(H|0));d=k[I>>2]|0}rg(d);I=0;r=J;return I|0}}else if((w|0)==107){if(!d){I=0;r=J;return I|0}h=I+4|0;e=k[h>>2]|0;if((e|0)!=(d|0)){do{f=e+-12|0;k[h>>2]=f;g=k[f>>2]|0;if(!g)e=f;else{e=e+-8|0;if((k[e>>2]|0)!=(g|0))k[e>>2]=g;rg(g);e=k[h>>2]|0}}while((e|0)!=(d|0));d=k[I>>2]|0}rg(d);I=0;r=J;return I|0}else if((w|0)==116){if(!E){I=0;r=J;return I|0}g=I+4|0;d=k[g>>2]|0;if((d|0)==(E|0))d=E;else{do{e=d+-12|0;k[g>>2]=e;f=k[e>>2]|0;if(!f)d=e;else{d=d+-8|0;if((k[d>>2]|0)!=(f|0))k[d>>2]=f;rg(f);d=k[g>>2]|0}}while((d|0)!=(E|0));d=k[I>>2]|0}rg(d);I=0;r=J;return I|0}}else if((w|0)==89){d=k[I>>2]|0;if(!d){I=0;r=J;return I|0}h=I+4|0;e=k[h>>2]|0;if((e|0)!=(d|0)){do{f=e+-12|0;k[h>>2]=f;g=k[f>>2]|0;if(!g)e=f;else{e=e+-8|0;if((k[e>>2]|0)!=(g|0))k[e>>2]=g;rg(g);e=k[h>>2]|0}}while((e|0)!=(d|0));d=k[I>>2]|0}rg(d);I=0;r=J;return I|0}else if((w|0)==98){d=k[I>>2]|0;if(!d){I=0;r=J;return I|0}h=I+4|0;e=k[h>>2]|0;if((e|0)!=(d|0)){do{f=e+-12|0;k[h>>2]=f;g=k[f>>2]|0;if(!g)e=f;else{e=e+-8|0;if((k[e>>2]|0)!=(g|0))k[e>>2]=g;rg(g);e=k[h>>2]|0}}while((e|0)!=(d|0));d=k[I>>2]|0}rg(d);I=0;r=J;return I|0}return 0}function qc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+32|0;e=k[d>>2]|0;if(!e){z=a+20|0;w=k[z>>2]|0;y=a+16|0;x=k[y>>2]|0;d=(w-x|0)/12|0;if((w|0)!=(x|0)){if(d>>>0>32767){c=0;return c|0}w=k[c>>2]|0;x=ii(d<<1|0,0,12,0)|0;n=a+8|0;x=ii(x|0,L|0,m[n>>1]|0,0)|0;v=L;if(0<v>>>0|0==(v|0)&w>>>0<x>>>0){c=0;return c|0}i[b>>0]=d>>>8;i[b+1>>0]=d;d=j[a>>1]|0;i[b+2>>0]=(d&65535)>>>8;i[b+3>>0]=d;d=j[a+4>>1]|0;i[b+4>>0]=(d&65535)>>>8;i[b+5>>0]=d;d=j[a+2>>1]|0;i[b+6>>0]=(d&65535)>>>8;i[b+7>>0]=d;d=j[a+6>>1]|0;i[b+8>>0]=(d&65535)>>>8;i[b+9>>0]=d;d=k[y>>2]|0;h=k[z>>2]|0;a:do if((d|0)==(h|0))d=10;else{e=d;f=10;g=-1;while(1){x=((k[e+4>>2]|0)-(k[e>>2]|0)|0)/12|0;g=x+g|0;if(x>>>0>65535|(g|0)>65535){d=0;break}i[b+f>>0]=g>>>8;d=f+2|0;i[b+(f|1)>>0]=g;e=e+12|0;if((e|0)==(h|0))break a;else f=d}return d|0}while(0);x=j[n>>1]|0;i[b+d>>0]=(x&65535)>>>8;e=d+2|0;i[b+(d+1)>>0]=x;x=m[n>>1]|0;ki(b+e|0,k[a+12>>2]|0,x|0)|0;e=x+e|0;x=k[c>>2]|0;d=k[y>>2]|0;w=k[z>>2]|0;do if((d|0)!=(w|0)){n=-1;a=0;o=0;f=0;r=0;g=0;b:while(1){h=k[d>>2]|0;v=k[d+4>>2]|0;if((h|0)==(v|0))h=r;else{u=n;t=a;while(1){n=l[h+8>>0]|0;A=k[h>>2]|0;a=A-t|0;s=h+4|0;p=k[s>>2]|0;q=p-o|0;do if((A|0)!=(t|0))if((a+255|0)>>>0<511){n=((a|0)>0?18:2)|n;r=r+1|0;break}else{r=r+2|0;break}else n=n|16;while(0);do if((p|0)!=(o|0))if((q+255|0)>>>0<511){n=n|((q|0)>0?36:4);g=g+1|0;break}else{g=g+2|0;break}else n=n|32;while(0);if((f|0)!=255&(n|0)==(u|0)){A=b+(e+-1)|0;i[A>>0]=l[A>>0]|8;f=f+1|0}else{if(f){if(e>>>0>=x>>>0){d=0;n=49;break b}i[b+e>>0]=f;e=e+1|0}if(e>>>0>=x>>>0){d=0;n=49;break b}i[b+e>>0]=n;e=e+1|0;f=0}a=k[h>>2]|0;o=k[s>>2]|0;h=h+12|0;if((h|0)==(v|0)){h=r;break}else{u=n;t=a}}}d=d+12|0;if((d|0)==(w|0)){d=h;n=32;break}else r=h}if((n|0)==32){if(!f){h=e;e=g;break}if(e>>>0<x>>>0){i[b+e>>0]=f;h=e+1|0;e=g;break}else{A=0;return A|0}}else if((n|0)==49)return d|0}else{h=e;d=0;e=0}while(0);d=d+h|0;if((d+e|0)>>>0>x>>>0){A=0;return A|0}e=k[y>>2]|0;s=k[z>>2]|0;if((e|0)!=(s|0)){g=0;p=0;while(1){f=k[e>>2]|0;r=k[e+4>>2]|0;if((f|0)==(r|0))f=p;else{o=g;while(1){g=k[f>>2]|0;n=g-o|0;q=k[f+4>>2]|0;a=q-p|0;do if((g|0)!=(o|0))if((n+255|0)>>>0<511){i[b+h>>0]=(n|0)>-1?n:0-n|0;h=h+1|0;break}else{i[b+h>>0]=n>>>8;i[b+(h+1)>>0]=n;h=h+2|0;break}while(0);do if((q|0)!=(p|0))if((a+255|0)>>>0<511){i[b+d>>0]=(a|0)>-1?a:0-a|0;d=d+1|0;break}else{i[b+d>>0]=a>>>8;i[b+(d+1)>>0]=a;d=d+2|0;break}while(0);f=f+12|0;if((f|0)==(r|0)){f=q;break}else{o=g;p=q}}}e=e+12|0;if((e|0)==(s|0))break;else p=f}}}else d=0}else{z=k[c>>2]|0;f=a+36|0;A=(i[f>>0]|0)!=0;g=a+8|0;y=m[g>>1]|0;x=ii(e|0,0,10,0)|0;y=ii(x|0,L|0,y|0,0)|0;A=ii(y|0,L|0,(A?2:0)|0,(A?0:0)|0)|0;y=L;if(0<y>>>0|0==(y|0)&z>>>0<A>>>0){A=0;return A|0}i[b>>0]=-1;i[b+1>>0]=-1;e=j[a>>1]|0;i[b+2>>0]=(e&65535)>>>8;i[b+3>>0]=e;e=j[a+4>>1]|0;i[b+4>>0]=(e&65535)>>>8;i[b+5>>0]=e;e=j[a+2>>1]|0;i[b+6>>0]=(e&65535)>>>8;i[b+7>>0]=e;e=j[a+6>>1]|0;i[b+8>>0]=(e&65535)>>>8;i[b+9>>0]=e;e=k[d>>2]|0;ki(b+10|0,k[a+28>>2]|0,e|0)|0;d=e+10|0;if(i[f>>0]|0){A=j[g>>1]|0;i[b+d>>0]=(A&65535)>>>8;d=e+12|0;i[b+(e+11)>>0]=A;A=m[g>>1]|0;ki(b+d|0,k[a+12>>2]|0,A|0)|0;d=A+d|0}}k[c>>2]=d;A=1;return A|0}function rc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0;m=a+8|0;f=k[m>>2]|0;n=a+4|0;e=k[n>>2]|0;c=e;if(((f-c|0)/12|0)>>>0>=b>>>0){c=b;d=e;while(1){k[d>>2]=0;k[d+4>>2]=0;k[d+8>>2]=0;c=c+-1|0;if(!c)break;else d=d+12|0}k[n>>2]=e+(b*12|0);return}l=k[a>>2]|0;d=((c-l|0)/12|0)+b|0;if(d>>>0>357913941)mg(a);i=l;c=(f-i|0)/12|0;if(c>>>0<178956970){c=c<<1;c=c>>>0<d>>>0?d:c;e=k[n>>2]|0;d=(e-i|0)/12|0;if(!c){f=0;j=0;h=d}else g=9}else{e=k[n>>2]|0;c=357913941;d=(e-i|0)/12|0;g=9}if((g|0)==9){f=c;j=og(c*12|0)|0;h=d}d=j+(h*12|0)|0;g=j+(f*12|0)|0;c=b;f=d;while(1){k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=0;c=c+-1|0;if(!c)break;else f=f+12|0}c=d;f=j+((h+b|0)*12|0)|0;if((e|0)==(l|0))d=a;else{do{b=d+-12|0;j=e;e=e+-12|0;k[b>>2]=0;i=d+-8|0;k[i>>2]=0;k[d+-4>>2]=0;k[b>>2]=k[e>>2];b=j+-8|0;k[i>>2]=k[b>>2];j=j+-4|0;k[d+-4>>2]=k[j>>2];k[j>>2]=0;k[b>>2]=0;k[e>>2]=0;d=c+-12|0;c=d}while((e|0)!=(l|0));d=a;i=k[a>>2]|0}k[d>>2]=c;c=k[n>>2]|0;k[n>>2]=f;k[m>>2]=g;h=i;if((c|0)!=(h|0))do{d=c;c=c+-12|0;f=k[c>>2]|0;g=f;if(f){d=d+-8|0;e=k[d>>2]|0;if((e|0)!=(f|0))k[d>>2]=e+(~(((e+-12-g|0)>>>0)/12|0)*12|0);rg(f)}}while((c|0)!=(h|0));if(!i)return;rg(i);return}function sc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;i=a+8|0;e=k[i>>2]|0;j=a+4|0;c=k[j>>2]|0;d=c;if(((e-d|0)/12|0)>>>0>=b>>>0){do{k[c>>2]=0;k[c+4>>2]=0;k[c+8>>2]=0;c=(k[j>>2]|0)+12|0;k[j>>2]=c;b=b+-1|0}while((b|0)!=0);return}c=k[a>>2]|0;d=((d-c|0)/12|0)+b|0;if(d>>>0>357913941)mg(a);f=c;c=(e-f|0)/12|0;if(c>>>0<178956970){c=c<<1;c=c>>>0<d>>>0?d:c;d=((k[j>>2]|0)-f|0)/12|0;if(!c){e=0;g=0}else h=8}else{c=357913941;d=((k[j>>2]|0)-f|0)/12|0;h=8}if((h|0)==8){e=c;g=og(c*12|0)|0}c=g+(d*12|0)|0;f=g+(e*12|0)|0;e=c;do{k[e>>2]=0;k[e+4>>2]=0;k[e+8>>2]=0;e=c+12|0;c=e;b=b+-1|0}while((b|0)!=0);b=k[a>>2]|0;e=(k[j>>2]|0)-b|0;h=g+((((e|0)/-12|0)+d|0)*12|0)|0;ki(h|0,b|0,e|0)|0;k[a>>2]=h;k[j>>2]=c;k[i>>2]=f;if(!b)return;rg(b);return}function tc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;k[a>>2]=0;c=a+4|0;k[c>>2]=0;k[a+8>>2]=0;if(!b)return;if(b>>>0>357913941)mg(a);e=og(b*12|0)|0;k[c>>2]=e;k[a>>2]=e;d=e+(b*12|0)|0;k[a+8>>2]=d;a=e;while(1){k[a>>2]=0;k[a+4>>2]=0;k[a+8>>2]=0;b=b+-1|0;if(!b)break;else a=a+12|0}k[c>>2]=d;return}function uc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0;j=a+8|0;e=k[j>>2]|0;l=a+4|0;c=k[l>>2]|0;d=c;if((e-d|0)>>>0>=b>>>0){do{i[c>>0]=0;c=(k[l>>2]|0)+1|0;k[l>>2]=c;b=b+-1|0}while((b|0)!=0);return}c=k[a>>2]|0;d=d-c+b|0;if((d|0)<0)mg(a);f=c;c=e-f|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<d>>>0?d:c;d=(k[l>>2]|0)-f|0;if(!c){e=0;g=0}else h=8}else{c=2147483647;d=(k[l>>2]|0)-f|0;h=8}if((h|0)==8){e=c;g=og(c)|0}c=g+d|0;f=g+e|0;e=c;do{i[e>>0]=0;e=c+1|0;c=e;b=b+-1|0}while((b|0)!=0);b=k[a>>2]|0;e=(k[l>>2]|0)-b|0;h=g+(d-e)|0;ki(h|0,b|0,e|0)|0;k[a>>2]=h;k[l>>2]=c;k[j>>2]=f;if(!b)return;rg(b);return}function vc(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+12|0;c=k[d>>2]|0;if(!c)return 0;else a=d;a:do{while(1){if((k[c+16>>2]|0)>>>0>=b>>>0){a=c;break}c=k[c+4>>2]|0;if(!c)break a}c=k[a>>2]|0}while((c|0)!=0);if((a|0)==(d|0))return 0;else return ((k[a+16>>2]|0)>>>0>b>>>0?0:a+20|0)|0;return 0}function wc(a,b){a=a|0;b=b|0;var c=0,d=0;d=a+12|0;c=k[d>>2]|0;if(!c)return 0;else a=d;a:do{while(1){if((k[c+16>>2]|0)>>>0>=b>>>0){a=c;break}c=k[c+4>>2]|0;if(!c)break a}c=k[a>>2]|0}while((c|0)!=0);if((a|0)==(d|0))return 0;else return ((k[a+16>>2]|0)>>>0>b>>>0?0:a+20|0)|0;return 0}function xc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;j=r;r=r+16|0;h=j;k[a>>2]=0;i=a+4|0;k[i>>2]=0;k[a+8>>2]=0;c=k[b+8>>2]|0;f=b+12|0;if((c|0)==(f|0)){i=0;a=0;Rh(i,a,h);r=j;return}g=a+8|0;while(1){e=c+20|0;b=k[e>>2]|0;do if(!(b&-2139062144)){d=k[i>>2]|0;if((d|0)==(k[g>>2]|0)){Gc(a,e);break}else{k[d>>2]=b;k[i>>2]=d+4;break}}while(0);b=k[c+4>>2]|0;if(!b)while(1){b=k[c+8>>2]|0;if((k[b>>2]|0)==(c|0))break;else c=b}else while(1){c=k[b>>2]|0;if(!c)break;else b=c}if((b|0)==(f|0))break;else c=b}g=k[a>>2]|0;a=k[i>>2]|0;Rh(g,a,h);r=j;return}function yc(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;L=r;r=r+64|0;I=L+48|0;K=L+36|0;J=L;F=d+4|0;G=a+8|0;h=k[G>>2]|0;e=h+2|0;H=a+4|0;m=k[H>>2]|0;if(e>>>0>m>>>0){K=0;r=L;return K|0}g=(k[a>>2]|0)+h|0;g=qh(l[g>>0]|l[g+1>>0]<<8)|0;j[F>>1]=g;k[G>>2]=e;i=h+8|0;if(i>>>0>m>>>0|e>>>0>(m+-6|0)>>>0){K=0;r=L;return K|0}k[G>>2]=i;B=K+4|0;k[B>>2]=0;C=K+8|0;k[C>>2]=0;f=K+4|0;k[K>>2]=f;D=f;a:do if(!(g<<16>>16)){e=1;n=74}else{q=J+20|0;E=J+24|0;s=J+32|0;t=J+4|0;u=J+8|0;v=J+12|0;w=J+16|0;x=d+8|0;y=d+12|0;z=y;A=d+12|0;p=d+16|0;e=h+12|0;k[q>>2]=0;k[q+4>>2]=0;k[q+8>>2]=0;k[q+12>>2]=0;b:do if(e>>>0<=m>>>0){d=m;o=0;c:while(1){g=k[a>>2]|0;n=g+i|0;n=rh(l[n>>0]|l[n+1>>0]<<8|l[n+2>>0]<<16|l[n+3>>0]<<24)|0;k[J>>2]=n;k[G>>2]=e;if((i+8|0)>>>0>d>>>0){n=65;break}e=g+e|0;e=rh(l[e>>0]|l[e+1>>0]<<8|l[e+2>>0]<<16|l[e+3>>0]<<24)|0;k[t>>2]=e;e=i+8|0;k[G>>2]=e;if((i+12|0)>>>0>d>>>0){n=64;break}h=g+e|0;h=rh(l[h>>0]|l[h+1>>0]<<8|l[h+2>>0]<<16|l[h+3>>0]<<24)|0;k[u>>2]=h;e=i+12|0;k[G>>2]=e;if((i+16|0)>>>0>d>>>0){n=63;break}m=g+e|0;m=rh(l[m>>0]|l[m+1>>0]<<8|l[m+2>>0]<<16|l[m+3>>0]<<24)|0;k[v>>2]=m;k[G>>2]=i+16;if(h&3){n=67;break}if(m>>>0>c>>>0|(c-m|0)>>>0<h>>>0){n=68;break}e=k[f>>2]|0;do if(e){while(1){g=k[e+16>>2]|0;if(h>>>0<g>>>0){g=k[e>>2]|0;if(!g){g=e;n=13;break}else e=g}else{if(g>>>0>=h>>>0){n=19;break}g=e+4|0;d=k[g>>2]|0;if(!d){n=17;break}else e=d}}if((n|0)==13){k[I>>2]=e;n=20;break}else if((n|0)==17){k[I>>2]=e;n=20;break}else if((n|0)==19){n=0;k[I>>2]=e;if(!e){g=I;n=20;break}else break}}else{k[I>>2]=f;g=f;e=D;n=20}while(0);if((n|0)==20){d=og(24)|0;k[d+16>>2]=h;k[d+20>>2]=0;k[d>>2]=0;k[d+4>>2]=0;k[d+8>>2]=e;k[g>>2]=d;e=k[k[K>>2]>>2]|0;if(!e)e=d;else{k[K>>2]=e;e=k[g>>2]|0}Hc(k[B>>2]|0,e);k[C>>2]=(k[C>>2]|0)+1;e=d}k[e+20>>2]=m;k[w>>2]=b+(k[u>>2]|0);i=k[y>>2]|0;d=(i|0)==0;do if(!d){h=k[J>>2]|0;e=y;g=i;d:do{while(1){if((k[g+16>>2]|0)>>>0>=h>>>0){e=g;break}g=k[g+4>>2]|0;if(!g)break d}g=k[e>>2]|0}while((g|0)!=0);if((e|0)!=(y|0)?h>>>0>=(k[e+16>>2]|0)>>>0:0){n=69;break c}if(!d){d=k[J>>2]|0;h=i;while(1){e=k[h+16>>2]|0;if(d>>>0<e>>>0){e=k[h>>2]|0;if(!e){e=h;g=h;n=36;break}}else{if(e>>>0>=d>>>0){e=h;n=42;break}g=h+4|0;e=k[g>>2]|0;if(!e){e=g;g=h;n=40;break}}h=e}if((n|0)==36){k[I>>2]=g;i=e;n=43;break}else if((n|0)==40){k[I>>2]=g;i=e;n=43;break}else if((n|0)==42){n=0;k[I>>2]=e;if(!e){i=I;g=e;n=43;break}else break}}else n=41}else n=41;while(0);if((n|0)==41){k[I>>2]=y;i=y;g=z;n=43}if((n|0)==43){n=0;e=og(56)|0;k[e+16>>2]=k[J>>2];d=e+20|0;h=d+36|0;do{k[d>>2]=0;d=d+4|0}while((d|0)<(h|0));k[e>>2]=0;k[e+4>>2]=0;k[e+8>>2]=g;k[i>>2]=e;g=k[k[x>>2]>>2]|0;if(!g)g=e;else{k[x>>2]=g;g=k[i>>2]|0}Hc(k[A>>2]|0,g);k[p>>2]=(k[p>>2]|0)+1}m=e+20|0;k[m>>2]=k[J>>2];k[m+4>>2]=k[J+4>>2];k[m+8>>2]=k[J+8>>2];k[m+12>>2]=k[J+12>>2];k[m+16>>2]=k[J+16>>2];if((m|0)!=(J|0))Ic(e+40|0,k[q>>2]|0,k[E>>2]|0);k[e+52>>2]=k[s>>2];e=k[q>>2]|0;if(e){if((k[E>>2]|0)!=(e|0))k[E>>2]=e;rg(e)}o=o+1<<16>>16;d=j[F>>1]|0;if((o&65535)>=(d&65535)){n=54;break}i=k[G>>2]|0;d=k[H>>2]|0;e=i+4|0;k[q>>2]=0;k[q+4>>2]=0;k[q+8>>2]=0;k[q+12>>2]=0;if(e>>>0>d>>>0)break b}if((n|0)==54){e=k[K>>2]|0;if((e|0)==(f|0)){e=1;n=74;break a}g=e;d=(d&65535)<<4|12;while(1){e=k[g+16>>2]|0;if(e>>>0<d>>>0){e=0;n=74;break a}d=(k[g+20>>2]|0)+e|0;if(d>>>0<e>>>0){e=0;n=74;break a}e=k[g+4>>2]|0;if(!e)while(1){e=k[g+8>>2]|0;if((k[e>>2]|0)==(g|0))break;else g=e}else while(1){g=k[e>>2]|0;if(!g)break;else e=g}if((e|0)==(f|0)){e=1;n=74;break a}else g=e}}else if((n|0)==63){e=0;break a}else if((n|0)==64){e=0;break a}else if((n|0)==65){e=0;break a}else if((n|0)==67){e=0;break a}else if((n|0)==68){e=0;break a}else if((n|0)==69){e=k[q>>2]|0;if(e){if((k[E>>2]|0)!=(e|0))k[E>>2]=e;rg(e)}e=0;break a}}while(0);e=0}while(0);Jc(K,k[f>>2]|0);K=e;r=L;return K|0}function zc(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,m=0,n=0,o=0,p=0,q=0,s=0;s=r;r=r+16|0;q=s;f=a+8|0;g=k[f>>2]|0;if((g+4|0)>>>0>(k[a+4>>2]|0)>>>0){e=0;r=s;return e|0}p=(k[a>>2]|0)+g|0;p=rh(l[p>>0]|l[p+1>>0]<<8|l[p+2>>0]<<16|l[p+3>>0]<<24)|0;k[d>>2]=p;k[f>>2]=(k[f>>2]|0)+4;if(!(yc(a,b,c,d)|0)){e=0;r=s;return e|0}g=k[d+8>>2]|0;j=d+12|0;if((g|0)==(j|0)){e=1;r=s;return e|0}m=e+4|0;n=m;o=e+4|0;p=e+8|0;while(1){i=g+28|0;f=k[m>>2]|0;d=(f|0)==0;if(!d){c=k[i>>2]|0;b=m;a=f;a:do{while(1){if((k[a+16>>2]|0)>>>0>=c>>>0){b=a;break}a=k[a+4>>2]|0;if(!a)break a}a=k[b>>2]|0}while((a|0)!=0);if((b|0)!=(m|0)?c>>>0>=(k[b+16>>2]|0)>>>0:0){while(1){b=k[f+16>>2]|0;if(c>>>0<b>>>0){b=k[f>>2]|0;if(!b){b=f;c=38;break}else f=b}else{if(b>>>0>=c>>>0){c=43;break}b=f+4|0;a=k[b>>2]|0;if(!a){c=42;break}else f=a}}if((c|0)==38){k[q>>2]=f;a=b;b=f;c=44}else if((c|0)==42){k[q>>2]=f;a=b;b=f;c=44}else if((c|0)==43){c=0;k[q>>2]=f;if(!f){a=q;b=f;c=44}}if((c|0)==44){c=0;f=og(24)|0;k[f+16>>2]=k[i>>2];k[f+20>>2]=0;k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=b;k[a>>2]=f;b=k[k[e>>2]>>2]|0;if(!b)b=f;else{k[e>>2]=b;b=k[a>>2]|0}Hc(k[o>>2]|0,b);k[p>>2]=(k[p>>2]|0)+1}k[g+52>>2]=k[f+20>>2]}else c=13}else c=13;if((c|0)==13){c=k[g+20>>2]|0;a=k[j>>2]|0;if(a){b=j;b:do{while(1){if((k[a+16>>2]|0)>>>0>=c>>>0){b=a;break}a=k[a+4>>2]|0;if(!a)break b}a=k[b>>2]|0}while((a|0)!=0);if((b|0)!=(j|0))h=(k[b+16>>2]|0)>>>0>c>>>0?0:b+20|0;else h=0}else h=0;do if(!d){c=k[i>>2]|0;while(1){b=k[f+16>>2]|0;if(c>>>0<b>>>0){b=k[f>>2]|0;if(!b){b=f;c=24;break}else f=b}else{if(b>>>0>=c>>>0){c=30;break}b=f+4|0;a=k[b>>2]|0;if(!a){c=28;break}else f=a}}if((c|0)==24){k[q>>2]=f;c=31;break}else if((c|0)==28){k[q>>2]=f;c=31;break}else if((c|0)==30){c=0;k[q>>2]=f;if(!f){b=q;c=31;break}else break}}else{k[q>>2]=m;b=m;f=n;c=31}while(0);if((c|0)==31){a=og(24)|0;k[a+16>>2]=k[i>>2];k[a+20>>2]=0;k[a>>2]=0;k[a+4>>2]=0;k[a+8>>2]=f;k[b>>2]=a;f=k[k[e>>2]>>2]|0;if(!f)f=a;else{k[e>>2]=f;f=k[b>>2]|0}Hc(k[o>>2]|0,f);k[p>>2]=(k[p>>2]|0)+1;f=a}k[f+20>>2]=h}f=k[g+4>>2]|0;if(!f)while(1){f=k[g+8>>2]|0;if((k[f>>2]|0)==(g|0))break;else g=f}else while(1){g=k[f>>2]|0;if(!g)break;else f=g}if((f|0)==(j|0)){f=1;break}else g=f}r=s;return f|0}function Ac(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0;w=r;r=r+32|0;v=w+16|0;o=w+12|0;u=w;s=a+8|0;e=k[s>>2]|0;n=a+4|0;if((e+4|0)>>>0>(k[n>>2]|0)>>>0){v=0;r=w;return v|0}f=k[a>>2]|0;g=f+e|0;g=rh(l[g>>0]|l[g+1>>0]<<8|l[g+2>>0]<<16|l[g+3>>0]<<24)|0;k[d>>2]=g;g=k[s>>2]|0;e=g+4|0;k[s>>2]=e;h=g+8|0;i=k[n>>2]|0;if(h>>>0>i>>>0){v=0;r=w;return v|0}j=f+e|0;j=rh(l[j>>0]|l[j+1>>0]<<8|l[j+2>>0]<<16|l[j+3>>0]<<24)|0;k[s>>2]=h;k[v>>2]=0;t=v+4|0;k[t>>2]=0;k[v+8>>2]=0;a:do if(j){m=v+8|0;e=g+12|0;if(e>>>0>i>>>0)g=0;else{f=h;g=0;while(1){f=(k[a>>2]|0)+f|0;f=rh(l[f>>0]|l[f+1>>0]<<8|l[f+2>>0]<<16|l[f+3>>0]<<24)|0;k[o>>2]=f;k[s>>2]=e;e=k[t>>2]|0;if((e|0)==(k[m>>2]|0))Gc(v,o);else{k[e>>2]=f;k[t>>2]=e+4}g=g+1|0;if(g>>>0>=j>>>0)break;f=k[s>>2]|0;e=f+4|0;if(e>>>0>(k[n>>2]|0)>>>0){g=0;break a}}e=k[v>>2]|0;f=k[t>>2]|0;p=11}}else{e=0;f=0;p=11}while(0);if((p|0)==11){j=d+16|0;h=f-e>>2;i=d+20|0;e=k[i>>2]|0;f=k[j>>2]|0;g=(e-f|0)/20|0;if(h>>>0<=g>>>0){if(h>>>0<g>>>0?(q=f+(h*20|0)|0,(e|0)!=(q|0)):0)do{k[i>>2]=e+-20;Lc(e+-12|0,k[e+-8>>2]|0);e=k[i>>2]|0}while((e|0)!=(q|0))}else Kc(j,h-g|0);e=k[j>>2]|0;k[u+4>>2]=0;k[u+8>>2]=0;h=u+4|0;k[u>>2]=h;f=k[v>>2]|0;g=k[t>>2]|0;b:do if((f|0)==(g|0))e=1;else while(1){k[s>>2]=k[f>>2];f=f+4|0;if(!(zc(a,b,c,e,u)|0)){e=0;break b}if((f|0)==(g|0)){e=1;break}else e=e+20|0}while(0);Mc(u,k[h>>2]|0);g=e}e=k[v>>2]|0;if(!e){v=g;r=w;return v|0}f=k[t>>2]|0;if((f|0)!=(e|0))k[t>>2]=f+(~((f+-4-e|0)>>>2)<<2);rg(e);v=g;r=w;return v|0}function Bc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,m=0;m=r;r=r+16|0;j=m;k[j>>2]=a;k[j+4>>2]=b;d=j+8|0;k[d>>2]=0;if(b>>>0<4){b=0;r=m;return b|0}i=rh(l[a>>0]|l[a+1>>0]<<8|l[a+2>>0]<<16|l[a+3>>0]<<24)|0;k[d>>2]=4;if((i|0)==1953784678){b=Ac(j,a,b,c)|0;r=m;return b|0}g=c+16|0;f=c+20|0;d=k[f>>2]|0;e=k[g>>2]|0;c=(d-e|0)/20|0;if((d|0)!=(e|0)){if(c>>>0>1?(h=e+20|0,(d|0)!=(h|0)):0)do{k[f>>2]=d+-20;Lc(d+-12|0,k[d+-8>>2]|0);d=k[f>>2]|0}while((d|0)!=(h|0))}else Kc(g,1-c|0);h=k[g>>2]|0;k[h>>2]=i;b=yc(j,a,b,h)|0;r=m;return b|0}function Cc(a){a=a|0;return (k[a+32>>2]|0)!=0|0}function Dc(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;f=a+12|0;e=k[f>>2]|0;if(!e){f=0;return f|0}else{a=f;b=e}a:do{while(1){if((k[b+16>>2]|0)>>>0>=1751474532){a=b;break}b=k[b+4>>2]|0;if(!b)break a}b=k[a>>2]|0}while((b|0)!=0);if((a|0)==(f|0))c=0;else c=(k[a+16>>2]|0)>>>0>1751474532?0:a+20|0;a=f;b=e;b:do{while(1){if((k[b+16>>2]|0)>>>0>=1819239265){a=b;break}b=k[b+4>>2]|0;if(!b)break b}b=k[a>>2]|0}while((b|0)!=0);if((a|0)==(f|0)){f=0;return f|0}b=(k[a+16>>2]|0)>>>0>1819239265;d=b?0:a+20|0;if((c|0)==0|b){f=0;return f|0}if((k[c+12>>2]|0)>>>0<52){f=0;return f|0}else{a=f;b=e}c:do{while(1){if((k[b+16>>2]|0)>>>0>=1751474532){a=b;break}b=k[b+4>>2]|0;if(!b)break c}b=k[a>>2]|0}while((b|0)!=0);if((a|0)!=(f|0)?(k[a+16>>2]|0)>>>0<=1751474532:0)a=(i[(k[a+36>>2]|0)+51>>0]|0)==0?1:2;else a=1;f=((k[d+12>>2]|0)>>>a)+-1|0;return f|0}function Ec(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,m=0,n=0;if((b|0)<0){d=0;return d|0}j=a+12|0;h=k[j>>2]|0;if(!h){d=0;return d|0}else{a=j;e=h}a:do{while(1){if((k[e+16>>2]|0)>>>0>=1751474532){a=e;break}e=k[e+4>>2]|0;if(!e)break a}e=k[a>>2]|0}while((e|0)!=0);if((a|0)==(j|0))f=0;else f=(k[a+16>>2]|0)>>>0>1751474532?0:a+20|0;a=j;e=h;b:do{while(1){if((k[e+16>>2]|0)>>>0>=1819239265){a=e;break}e=k[e+4>>2]|0;if(!e)break b}e=k[a>>2]|0}while((e|0)!=0);if((a|0)==(j|0))g=0;else g=(k[a+16>>2]|0)>>>0>1819239265?0:a+20|0;a=j;e=h;c:do{while(1){if((k[e+16>>2]|0)>>>0>=1735162214){a=e;break}e=k[e+4>>2]|0;if(!e)break c}e=k[a>>2]|0}while((e|0)!=0);if((a|0)==(j|0)){d=0;return d|0}e=(k[a+16>>2]|0)>>>0>1735162214;m=e?0:a+20|0;if((f|0)==0|(g|0)==0|e){d=0;return d|0}if((k[f+12>>2]|0)>>>0<52){d=0;return d|0}else{e=j;a=h}d:do{while(1){if((k[a+16>>2]|0)>>>0>=1751474532){e=a;break}a=k[a+4>>2]|0;if(!a)break d}a=k[e>>2]|0}while((a|0)!=0);do if((e|0)!=(j|0)?(k[e+16>>2]|0)>>>0<=1751474532:0){j=k[g+16>>2]|0;g=k[g+12>>2]|0;if(i[(k[e+36>>2]|0)+51>>0]|0){a=b<<2;if(a>>>0>1073741824|a>>>0>g>>>0){d=0;return d|0}e=a+4|0;if(e>>>0>g>>>0){d=0;return d|0}f=j+a|0;f=rh(l[f>>0]|l[f+1>>0]<<8|l[f+2>>0]<<16|l[f+3>>0]<<24)|0;if((a+8|0)>>>0>g>>>0){d=0;return d|0}a=j+e|0;a=rh(l[a>>0]|l[a+1>>0]<<8|l[a+2>>0]<<16|l[a+3>>0]<<24)|0;if(a>>>0<f>>>0){d=0;return d|0}if(a>>>0>(k[m+12>>2]|0)>>>0){d=0;return d|0}else{k[c>>2]=(k[m+16>>2]|0)+f;a=a-f|0;break}}else{h=g;f=j;n=32}}else n=30;while(0);if((n|0)==30){h=k[g+12>>2]|0;f=k[g+16>>2]|0;n=32}do if((n|0)==32){a=b<<1;if(a>>>0>1073741824|a>>>0>h>>>0){d=0;return d|0}e=a+2|0;if(e>>>0>h>>>0){d=0;return d|0}g=f+a|0;g=qh(l[g>>0]|l[g+1>>0]<<8)|0;if((a+4|0)>>>0>h>>>0){d=0;return d|0}a=f+e|0;a=qh(l[a>>0]|l[a+1>>0]<<8)|0;e=g&65535;if((a&65535)<(g&65535)){d=0;return d|0}a=a&65535;if(a<<1>>>0>(k[m+12>>2]|0)>>>0){d=0;return d|0}else{k[c>>2]=(k[m+16>>2]|0)+(e<<1);a=a-e<<1;break}}while(0);k[d>>2]=a;d=1;return d|0}function Fc(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;f=a+8|0;d=a+12|0;g=k[d>>2]|0;if(!g)return 1;else{c=d;b=g}a:while(1){while(1){if((k[b+16>>2]|0)>>>0>=1146308935){c=b;break}b=k[b+4>>2]|0;if(!b){e=c;break a}}b=k[c>>2]|0;if(!b){e=c;break}}if((e|0)==(d|0))return 1;if((e|0)==(d|0)?1:(k[e+16>>2]|0)>>>0>1146308935)return 1;b=k[e+4>>2]|0;if(!b){c=e;while(1){b=k[c+8>>2]|0;if((k[b>>2]|0)==(c|0))break;else c=b}}else while(1){c=k[b>>2]|0;if(!c)break;else b=c}if((k[f>>2]|0)==(e|0))k[f>>2]=b;d=a+16|0;k[d>>2]=(k[d>>2]|0)+-1;Nc(g,e);b=k[e+40>>2]|0;if(b){c=e+44|0;if((k[c>>2]|0)!=(b|0))k[c>>2]=b;rg(b)}rg(e);j[a+4>>1]=k[d>>2];return 1}function Gc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;h=a+4|0;i=k[a>>2]|0;j=i;d=((k[h>>2]|0)-j>>2)+1|0;if(d>>>0>1073741823)mg(a);l=a+8|0;e=i;c=(k[l>>2]|0)-e|0;if(c>>2>>>0<536870911){c=c>>1;c=c>>>0<d>>>0?d:c;e=(k[h>>2]|0)-e|0;d=e>>2;if(!c){g=0;f=0;c=e}else m=6}else{e=(k[h>>2]|0)-e|0;c=1073741823;d=e>>2;m=6}if((m|0)==6){g=c;f=og(c<<2)|0;c=e}k[f+(d<<2)>>2]=k[b>>2];ki(f|0,i|0,c|0)|0;k[a>>2]=f;k[h>>2]=f+(d+1<<2);k[l>>2]=f+(g<<2);if(!j)return;rg(j);return}function Hc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;h=(b|0)==(a|0);i[b+12>>0]=h&1;if(h)return;while(1){f=k[b+8>>2]|0;e=f+12|0;if(i[e>>0]|0){b=37;break}h=f+8|0;d=b;b=k[h>>2]|0;c=k[b>>2]|0;if((c|0)==(f|0)){c=k[b+4>>2]|0;if(!c){c=d;g=h;e=h;d=b;a=b;b=7;break}c=c+12|0;if(i[c>>0]|0){c=d;g=h;e=h;d=b;a=b;b=7;break}i[e>>0]=1;i[b+12>>0]=(b|0)==(a|0)&1;i[c>>0]=1}else{if(!c){c=d;g=h;a=h;d=b;e=b;b=24;break}c=c+12|0;if(i[c>>0]|0){c=d;g=h;a=h;d=b;e=b;b=24;break}i[e>>0]=1;i[b+12>>0]=(b|0)==(a|0)&1;i[c>>0]=1}if((b|0)==(a|0)){b=37;break}}if((b|0)==7){if((k[f>>2]|0)==(c|0))b=f;else{h=f+4|0;b=k[h>>2]|0;c=k[b>>2]|0;k[h>>2]=c;if(!c)c=d;else{k[c+8>>2]=f;c=k[g>>2]|0}d=b+8|0;k[d>>2]=c;c=k[e>>2]|0;if((k[c>>2]|0)==(f|0))k[c>>2]=b;else k[c+4>>2]=b;k[b>>2]=f;k[g>>2]=b;a=k[d>>2]|0}i[b+12>>0]=1;i[a+12>>0]=0;d=k[a>>2]|0;e=d+4|0;b=k[e>>2]|0;k[a>>2]=b;if(b)k[b+8>>2]=a;b=a+8|0;k[d+8>>2]=k[b>>2];c=k[b>>2]|0;if((k[c>>2]|0)==(a|0))k[c>>2]=d;else k[c+4>>2]=d;k[e>>2]=a;k[b>>2]=d;return}else if((b|0)==24){if((k[f>>2]|0)==(c|0)){b=k[f>>2]|0;e=b+4|0;c=k[e>>2]|0;k[f>>2]=c;if(!c)c=d;else{k[c+8>>2]=f;c=k[g>>2]|0}d=b+8|0;k[d>>2]=c;c=k[a>>2]|0;if((k[c>>2]|0)==(f|0))k[c>>2]=b;else k[c+4>>2]=b;k[e>>2]=f;k[g>>2]=b;e=k[d>>2]|0}else b=f;i[b+12>>0]=1;i[e+12>>0]=0;h=e+4|0;d=k[h>>2]|0;b=k[d>>2]|0;k[h>>2]=b;if(b)k[b+8>>2]=e;b=e+8|0;k[d+8>>2]=k[b>>2];c=k[b>>2]|0;if((k[c>>2]|0)==(e|0))k[c>>2]=d;else k[c+4>>2]=d;k[d>>2]=e;k[b>>2]=d;return}else if((b|0)==37)return}function Ic(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,l=0;j=c-b|0;l=a+8|0;d=k[l>>2]|0;g=k[a>>2]|0;e=g;if(j>>>0<=(d-e|0)>>>0){f=a+4|0;e=(k[f>>2]|0)-e|0;if(j>>>0<=e>>>0){li(g|0,b|0,j|0)|0;d=g+j|0;if((k[f>>2]|0)==(d|0))return;k[f>>2]=d;return}d=b+e|0;li(g|0,b|0,e|0)|0;if((d|0)==(c|0))return;b=k[f>>2]|0;do{i[b>>0]=i[d>>0]|0;b=(k[f>>2]|0)+1|0;k[f>>2]=b;d=d+1|0}while((d|0)!=(c|0));return}if(g){d=a+4|0;if((k[d>>2]|0)!=(g|0))k[d>>2]=g;rg(g);k[l>>2]=0;k[d>>2]=0;k[a>>2]=0;d=0}f=(j|0)<0;if(f)mg(a);d=d-0|0;if(d>>>0<1073741823){e=d<<1;d=e>>>0>=j>>>0;if(d|f^1)h=d?e:j;else mg(a)}else h=2147483647;d=og(h)|0;e=a+4|0;k[e>>2]=d;k[a>>2]=d;k[l>>2]=d+h;if((b|0)==(c|0))return;do{i[d>>0]=i[b>>0]|0;d=(k[e>>2]|0)+1|0;k[e>>2]=d;b=b+1|0}while((b|0)!=(c|0));return}function Jc(a,b){a=a|0;b=b|0;if(!b)return;else{Jc(a,k[b>>2]|0);Jc(a,k[b+4>>2]|0);rg(b);return}}function Kc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,l=0,m=0,n=0,o=0,p=0,q=0;o=a+8|0;e=k[o>>2]|0;p=a+4|0;c=k[p>>2]|0;d=c;if(((e-d|0)/20|0)>>>0>=b>>>0){do{k[c>>2]=0;k[c+4>>2]=0;k[c+8>>2]=0;k[c+12>>2]=0;k[c+16>>2]=0;k[c+8>>2]=c+12;c=(k[p>>2]|0)+20|0;k[p>>2]=c;b=b+-1|0}while((b|0)!=0);return}c=k[a>>2]|0;d=((d-c|0)/20|0)+b|0;if(d>>>0>214748364)mg(a);f=c;c=(e-f|0)/20|0;if(c>>>0<107374182){c=c<<1;c=c>>>0<d>>>0?d:c;d=((k[p>>2]|0)-f|0)/20|0;if(!c){f=0;e=0;c=d}else g=8}else{c=214748364;d=((k[p>>2]|0)-f|0)/20|0;g=8}if((g|0)==8){f=c;e=og(c*20|0)|0;c=d}g=e+(c*20|0)|0;h=g;e=e+(f*20|0)|0;d=g;c=h;do{k[d>>2]=0;k[d+4>>2]=0;k[d+8>>2]=0;k[d+12>>2]=0;k[d+16>>2]=0;k[d+8>>2]=d+12;d=c+20|0;c=d;b=b+-1|0}while((b|0)!=0);n=c;d=k[a>>2]|0;c=k[p>>2]|0;if((c|0)==(d|0)){f=a;g=p;b=h}else{f=g;b=h;do{h=f+-20|0;g=c;c=c+-20|0;k[h>>2]=k[c>>2];j[h+4>>1]=j[c+4>>1]|0;h=f+-12|0;i=g+-12|0;k[h>>2]=k[i>>2];l=k[g+-8>>2]|0;k[f+-8>>2]=l;m=g+-4|0;q=k[m>>2]|0;k[f+-4>>2]=q;f=f+-8|0;if(!q)k[h>>2]=f;else{k[l+8>>2]=f;q=g+-8|0;k[i>>2]=q;k[q>>2]=0;k[m>>2]=0}f=b+-20|0;b=f}while((c|0)!=(d|0));c=b;f=a;g=p;b=c;d=k[a>>2]|0;c=k[p>>2]|0}k[f>>2]=b;k[g>>2]=n;k[o>>2]=e;b=d;if((c|0)!=(b|0))do{Lc(c+-12|0,k[c+-8>>2]|0);c=c+-20|0}while((c|0)!=(b|0));if(!d)return;rg(d);return}function Lc(a,b){a=a|0;b=b|0;var c=0;if(!b)return;Lc(a,k[b>>2]|0);Lc(a,k[b+4>>2]|0);a=k[b+40>>2]|0;if(a){c=b+44|0;if((k[c>>2]|0)!=(a|0))k[c>>2]=a;rg(a)}rg(b);return}function Mc(a,b){a=a|0;b=b|0;if(!b)return;else{Mc(a,k[b>>2]|0);Mc(a,k[b+4>>2]|0);rg(b);return}}function Nc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0;d=k[b>>2]|0;do if(d){c=k[b+4>>2]|0;if(!c){e=b;c=b;g=7;break}else while(1){d=k[c>>2]|0;if(!d){g=5;break}else c=d}}else{c=b;g=5}while(0);if((g|0)==5){d=k[c+4>>2]|0;if(!d){j=c+8|0;l=c;d=0;m=0;h=c}else{e=c;g=7}}if((g|0)==7){j=e+8|0;k[d+8>>2]=k[j>>2];l=e;m=1;h=c}e=k[j>>2]|0;c=k[e>>2]|0;if((c|0)==(l|0)){k[e>>2]=d;if((l|0)==(a|0)){a=d;c=0}else c=k[e+4>>2]|0}else k[e+4>>2]=d;f=l+12|0;g=(i[f>>0]|0)!=0;if((l|0)!=(b|0)){n=b+8|0;e=k[n>>2]|0;k[j>>2]=e;if((k[k[n>>2]>>2]|0)==(b|0))k[e>>2]=l;else k[e+4>>2]=l;e=k[b>>2]|0;k[h>>2]=e;k[e+8>>2]=l;e=k[b+4>>2]|0;k[l+4>>2]=e;if(e)k[e+8>>2]=l;i[f>>0]=i[b+12>>0]|0;a=(a|0)==(b|0)?l:a}if(!(g&(a|0)!=0))return;if(m){i[d+12>>0]=1;return}while(1){h=k[c+8>>2]|0;d=c+12|0;e=(i[d>>0]|0)!=0;if((k[h>>2]|0)==(c|0)){if(e)e=a;else{i[d>>0]=1;i[h+12>>0]=0;f=k[h>>2]|0;g=f+4|0;d=k[g>>2]|0;k[h>>2]=d;if(d)k[d+8>>2]=h;d=h+8|0;k[f+8>>2]=k[d>>2];e=k[d>>2]|0;if((k[e>>2]|0)==(h|0))k[e>>2]=f;else k[e+4>>2]=f;k[g>>2]=h;k[d>>2]=f;n=k[c+4>>2]|0;e=(a|0)==(n|0)?c:a;c=k[n>>2]|0}a=k[c>>2]|0;d=(a|0)==0;if(!d?(i[a+12>>0]|0)==0:0){g=68;break}n=k[c+4>>2]|0;if((n|0)!=0?(i[n+12>>0]|0)==0:0){g=67;break}i[c+12>>0]=0;c=k[c+8>>2]|0;a=c+12|0;if((c|0)==(e|0)|(i[a>>0]|0)==0){g=64;break}n=k[c+8>>2]|0;a=e;c=(k[n>>2]|0)==(c|0)?n+4|0:n}else{if(!e){i[d>>0]=1;i[h+12>>0]=0;n=h+4|0;f=k[n>>2]|0;d=k[f>>2]|0;k[n>>2]=d;if(d)k[d+8>>2]=h;d=h+8|0;k[f+8>>2]=k[d>>2];e=k[d>>2]|0;if((k[e>>2]|0)==(h|0))k[e>>2]=f;else k[e+4>>2]=f;k[f>>2]=h;k[d>>2]=f;n=k[c>>2]|0;a=(a|0)==(n|0)?c:a;c=k[n+4>>2]|0}d=k[c>>2]|0;if((d|0)!=0?(i[d+12>>0]|0)==0:0){e=c;a=d;f=c;g=38;break}e=k[c+4>>2]|0;if((e|0)!=0?(i[e+12>>0]|0)==0:0){a=d;d=c;f=c;g=39;break}i[c+12>>0]=0;c=k[c+8>>2]|0;if((c|0)==(a|0)){g=36;break}if(!(i[c+12>>0]|0)){a=c;g=36;break}n=k[c+8>>2]|0;c=(k[n>>2]|0)==(c|0)?n+4|0:n}c=k[c>>2]|0}if((g|0)==36){i[a+12>>0]=1;return}else if((g|0)==38){c=k[f+4>>2]|0;if(!c){d=e;g=40}else{d=e;e=c;g=39}}else if((g|0)==64){i[a>>0]=1;return}else if((g|0)==67)if(d){e=c;g=69}else g=68;if((g|0)==39)if(!(i[e+12>>0]|0)){c=e;a=f;g=46}else g=40;else if((g|0)==68)if(!(i[a+12>>0]|0))g=75;else{e=c;g=69}if((g|0)==40){i[a+12>>0]=1;i[f+12>>0]=0;e=a+4|0;c=k[e>>2]|0;k[d>>2]=c;if(c)k[c+8>>2]=f;c=f+8|0;k[a+8>>2]=k[c>>2];d=k[c>>2]|0;if((k[d>>2]|0)==(f|0))k[d>>2]=a;else k[d+4>>2]=a;k[e>>2]=f;k[c>>2]=a;c=f;g=46}else if((g|0)==69){n=e+4|0;d=k[n>>2]|0;i[d+12>>0]=1;i[e+12>>0]=0;a=k[d>>2]|0;k[n>>2]=a;if(a)k[a+8>>2]=e;a=e+8|0;k[d+8>>2]=k[a>>2];c=k[a>>2]|0;if((k[c>>2]|0)==(e|0))k[c>>2]=d;else k[c+4>>2]=d;k[d>>2]=e;k[a>>2]=d;a=e;c=d;g=75}if((g|0)==46){e=k[a+8>>2]|0;n=e+12|0;i[a+12>>0]=i[n>>0]|0;i[n>>0]=1;i[c+12>>0]=1;n=e+4|0;d=k[n>>2]|0;a=k[d>>2]|0;k[n>>2]=a;if(a)k[a+8>>2]=e;a=e+8|0;k[d+8>>2]=k[a>>2];c=k[a>>2]|0;if((k[c>>2]|0)==(e|0))k[c>>2]=d;else k[c+4>>2]=d;k[d>>2]=e;k[a>>2]=d;return}else if((g|0)==75){f=k[c+8>>2]|0;d=f+12|0;i[c+12>>0]=i[d>>0]|0;i[d>>0]=1;i[a+12>>0]=1;d=k[f>>2]|0;e=d+4|0;a=k[e>>2]|0;k[f>>2]=a;if(a)k[a+8>>2]=f;a=f+8|0;k[d+8>>2]=k[a>>2];c=k[a>>2]|0;if((k[c>>2]|0)==(f|0))k[c>>2]=d;else k[c+4>>2]=d;k[e>>2]=f;k[a>>2]=d;return}}function Oc(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0;b=vc(a,1128678944)|0;n=vc(a,1751474532)|0;j=vc(a,1735162214)|0;c=vc(a,1819239265)|0;if(!n){a=0;return a|0}d=(c|0)==0;e=(j|0)==0;if(e&((b|0)!=0&d)){a=1;return a|0}if(e|d){a=0;return a|0}m=Cc(c)|0;if(m^(Cc(j)|0)){a=0;return a|0}if(Cc(c)|0){a=1;return a|0}f=i[(k[n+16>>2]|0)+51>>0]|0;g=f&255;h=Dc(a)|0;l=~~(+(h<<1|0)+ +((k[j+12>>2]|0)>>>0)*1.1)>>>0;m=j+20|0;b=j+24|0;c=k[b>>2]|0;d=k[m>>2]|0;e=c-d|0;if(l>>>0<=e>>>0){if(l>>>0<e>>>0?(o=d+l|0,(c|0)!=(o|0)):0)k[b>>2]=o}else uc(m,l-e|0);if(Tc(g,h,a)|0){a=1;return a|0}if(f<<24>>24){a=0;return a|0}if(!(Tc(1,h,a)|0)){a=0;return a|0}i[(k[n+20>>2]|0)+51>>0]=1;a=1;return a|0}function Pc(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0;t=r;r=r+16|0;q=t+12|0;i=t;c=j[a+4>>1]|0;xc(i,a);b=k[i>>2]|0;s=i+4|0;p=k[s>>2]|0;if((b|0)!=(p|0)){l=a+8|0;m=a+12|0;n=m;o=a+12|0;h=a+16|0;g=(c&65535)<<4|12;while(1){e=k[b>>2]|0;a=k[m>>2]|0;do if(a){while(1){c=k[a+16>>2]|0;if(e>>>0<c>>>0){c=k[a>>2]|0;if(!c){c=a;d=12;break}else a=c}else{if(c>>>0>=e>>>0){d=18;break}c=a+4|0;d=k[c>>2]|0;if(!d){d=16;break}else a=d}}if((d|0)==12){k[q>>2]=a;d=19;break}else if((d|0)==16){k[q>>2]=a;d=19;break}else if((d|0)==18){d=0;k[q>>2]=a;if(!a){c=q;d=19;break}else break}}else{k[q>>2]=m;c=m;a=n;d=19}while(0);if((d|0)==19){f=og(56)|0;k[f+16>>2]=e;d=f+20|0;e=d+36|0;do{k[d>>2]=0;d=d+4|0}while((d|0)<(e|0));k[f>>2]=0;k[f+4>>2]=0;k[f+8>>2]=a;k[c>>2]=f;a=k[k[l>>2]>>2]|0;if(!a)a=f;else{k[l>>2]=a;a=k[c>>2]|0}Hc(k[o>>2]|0,a);k[h>>2]=(k[h>>2]|0)+1;a=f}k[a+28>>2]=g;a=k[a+32>>2]|0;b=b+4|0;if((b|0)==(p|0))break;else g=(a>>>0>4294967292?a:a+3&-4)+g|0}b=k[i>>2]|0}if(!b){r=t;return 1}a=k[s>>2]|0;if((a|0)!=(b|0))k[s>>2]=a+(~((a+-4-b|0)>>>2)<<2);rg(b);r=t;return 1}function Qc(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,l=0,m=0,n=0,o=0;b=vc(a,1751474532)|0;if(!b){o=0;return o|0}o=k[b+32>>2]|0;b=(o|0)==0?b:o;if((k[b+12>>2]|0)>>>0<12){o=0;return o|0}o=k[b+20>>2]|0;l=o+8|0;m=o+9|0;n=o+10|0;o=o+11|0;f=a+8|0;i[l>>0]=0;i[l+1>>0]=0;i[l+2>>0]=0;i[l+3>>0]=0;b=k[f>>2]|0;h=a+12|0;if((b|0)==(h|0))g=0;else{c=0;do{g=b+20|0;d=Cc(g)|0;g=d?k[b+52>>2]|0:g;d=bd(k[g+16>>2]|0,k[g+12>>2]|0)|0;k[g+4>>2]=d;c=d+c|0;d=k[b+4>>2]|0;if(!d)while(1){d=k[b+8>>2]|0;if((k[d>>2]|0)==(b|0)){b=d;break}else b=d}else{b=d;while(1){d=k[b>>2]|0;if(!d)break;else b=d}}}while((b|0)!=(h|0));g=c}e=k[a>>2]|0;b=j[a+4>>1]|0;if(b<<16>>16){b=b&65535;a=ja(b|0)|0;c=a^31;if((a|0)==31){d=0;c=0}else{d=1<<c+4&65535;c=c<<16}}else{b=0;d=0;c=0}b=(d|b<<16)+e+((b<<4)-d&65535|c)|0;c=k[f>>2]|0;if((c|0)!=(h|0)){d=c;while(1){c=d+20|0;f=Cc(c)|0;c=f?k[d+52>>2]|0:c;b=(k[c>>2]|0)+b+(k[c+4>>2]|0)+(k[c+8>>2]|0)+(k[c+12>>2]|0)|0;c=k[d+4>>2]|0;if(!c)while(1){c=k[d+8>>2]|0;if((k[c>>2]|0)==(d|0))break;else d=c}else while(1){d=k[c>>2]|0;if(!d)break;else c=d}if((c|0)==(h|0))break;else d=c}}h=-1313820742-g-b|0;i[l>>0]=h>>>24;i[m>>0]=h>>>16;i[n>>0]=h>>>8;i[o>>0]=h;o=1;return o|0}function Rc(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,j=0;j=vc(a,1751474532)|0;if(!j){a=0;return a|0}if(!(Cc(j)|0)){h=k[j+12>>2]|0;h=h>>>0>4294967292?h:h+3&-4;f=j+20|0;g=j+24|0;c=k[g>>2]|0;b=k[f>>2]|0;d=c-b|0;if(h>>>0<=d>>>0){if(h>>>0<d>>>0?(e=b+h|0,(c|0)!=(e|0)):0)k[g>>2]=e}else{uc(f,h-d|0);b=k[f>>2]|0}j=j+16|0;ki(b|0,k[j>>2]|0,h|0)|0;k[j>>2]=b}if(!(Fc(a)|0)){a=0;return a|0}b=vc(a,1751474532)|0;if(!b){a=0;return a|0}j=k[b+32>>2]|0;b=(j|0)==0?b:j;if((k[b+12>>2]|0)>>>0<17){a=0;return a|0}i[(k[b+20>>2]|0)+16>>0]=l[(k[b+16>>2]|0)+16>>0]|0|8;if(!(Oc(a)|0)){a=0;return a|0}Pc(a)|0;a=1;return a|0}function Sc(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;y=r;r=r+16|0;w=y+12|0;u=y;x=a+20|0;v=a+16|0;b=k[v>>2]|0;c=(k[x>>2]|0)-b|0;if((c|0)==20){if(!(Rc(b)|0)){x=0;r=y;return x|0}x=Qc(b)|0;r=y;return x|0}c=cd(k[a>>2]|0,(c|0)/20|0)|0;b=k[v>>2]|0;a=k[x>>2]|0;if((b|0)==(a|0)){x=1;r=y;return x|0}do{if(!(Rc(b)|0)){t=6;break}c=((m[b+4>>1]|0)<<4|12)+c|0;b=b+20|0}while((b|0)!=(a|0));if((t|0)==6){Dh(72066,27,1,k[1343]|0)|0;x=0;r=y;return x|0}b=k[v>>2]|0;q=k[x>>2]|0;if((b|0)==(q|0)){x=1;r=y;return x|0}s=u+4|0;do{xc(u,b);e=k[u>>2]|0;i=k[s>>2]|0;if((e|0)!=(i|0)){j=b+8|0;l=b+12|0;n=l;o=b+12|0;p=b+16|0;do{g=k[e>>2]|0;a=k[l>>2]|0;do if(a){while(1){d=k[a+16>>2]|0;if(g>>>0<d>>>0){d=k[a>>2]|0;if(!d){d=a;t=21;break}else a=d}else{if(d>>>0>=g>>>0){t=27;break}d=a+4|0;f=k[d>>2]|0;if(!f){t=25;break}else a=f}}if((t|0)==21){k[w>>2]=a;t=28;break}else if((t|0)==25){k[w>>2]=a;t=28;break}else if((t|0)==27){t=0;k[w>>2]=a;if(!a){d=w;t=28;break}else break}}else{k[w>>2]=l;d=l;a=n;t=28}while(0);if((t|0)==28){t=0;h=og(56)|0;k[h+16>>2]=g;f=h+20|0;g=f+36|0;do{k[f>>2]=0;f=f+4|0}while((f|0)<(g|0));k[h>>2]=0;k[h+4>>2]=0;k[h+8>>2]=a;k[d>>2]=h;a=k[k[j>>2]>>2]|0;if(!a)a=h;else{k[j>>2]=a;a=k[d>>2]|0}Hc(k[o>>2]|0,a);k[p>>2]=(k[p>>2]|0)+1;a=h}if(Cc(a+20|0)|0)d=k[(k[a+52>>2]|0)+8>>2]|0;else{h=k[a+32>>2]|0;d=c;c=(h>>>0>4294967292?h:h+3&-4)+c|0}k[a+28>>2]=d;e=e+4|0}while((e|0)!=(i|0));e=k[u>>2]|0}a=e;if(e){d=k[s>>2]|0;if((d|0)!=(e|0))k[s>>2]=d+(~((d+-4-a|0)>>>2)<<2);rg(e)}b=b+20|0}while((b|0)!=(q|0));b=k[v>>2]|0;c=k[x>>2]|0;if((b|0)==(c|0)){x=1;r=y;return x|0}while(1){if(!(Qc(b)|0))break;b=b+20|0;if((b|0)==(c|0)){b=1;t=39;break}}if((t|0)==39){r=y;return b|0}Dh(72094,24,1,k[1343]|0)|0;x=0;r=y;return x|0}function Tc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;J=r;r=r+64|0;A=J+16|0;B=J+8|0;C=J+4|0;z=J;H=vc(c,1735162214)|0;I=vc(c,1819239265)|0;D=(a|0)==0;l=D?2:4;G=I+20|0;m=b+1|0;a=ha((2147483646-b|0)<3?m:b+4&-4,l)|0;d=I+24|0;e=k[d>>2]|0;f=k[G>>2]|0;g=e-f|0;if(a>>>0<=g>>>0){if(a>>>0<g>>>0?(h=f+a|0,(e|0)!=(h|0)):0)k[d>>2]=h}else{uc(G,a-g|0);f=k[G>>2]|0}y=ha(m,l)|0;k[I+12>>2]=y;y=H+20|0;o=k[y>>2]|0;if((b|0)<=0){I=0;r=J;return I|0}p=A+8|0;q=A+16|0;s=A+20|0;t=A+24|0;u=A+32|0;v=H+24|0;w=A+16|0;a=0;h=0;x=0;do{if(D){i[f+a>>0]=h>>>9;i[f+(a+1)>>0]=h>>>1;a=a+2|0}else{i[f+a>>0]=h>>>24;i[f+(a+1)>>0]=h>>>16;i[f+(a+2)>>0]=h>>>8;i[f+(a+3)>>0]=h;a=a+4|0}j[p>>1]=0;k[q>>2]=0;k[s>>2]=0;k[t>>2]=0;k[u>>2]=0;do if(Ec(c,x,B,C)|0){d=k[C>>2]|0;if((d|0)!=0?!(pc(k[B>>2]|0,d,A)|0):0){n=0;break}k[z>>2]=(k[v>>2]|0)-h-(k[y>>2]|0);if(qc(A,o+h|0,z)|0){m=k[z>>2]|0;m=m>>>0>4294967292?m:m+3&-4;k[z>>2]=m;m=m+h|0;l=m>>>0<h>>>0|D&m>>>0>131071;n=l^1;h=l?h:m}else n=0}else n=0;while(0);d=k[w>>2]|0;if(d){e=k[s>>2]|0;if((e|0)!=(d|0)){do{g=e+-12|0;k[s>>2]=g;l=k[g>>2]|0;m=l;if(!l)e=g;else{e=e+-8|0;g=k[e>>2]|0;if((g|0)!=(l|0))k[e>>2]=g+(~(((g+-12-m|0)>>>0)/12|0)*12|0);rg(l);e=k[s>>2]|0}}while((e|0)!=(d|0));d=k[w>>2]|0}rg(d)}x=x+1|0;if(!n){a=0;E=37;break}}while((x|0)<(b|0));if((E|0)==37){r=J;return a|0}if(!h){I=0;r=J;return I|0}if(D){i[f+a>>0]=h>>>9;i[f+(a+1)>>0]=h>>>1}else{i[f+a>>0]=h>>>24;i[f+(a+1)>>0]=h>>>16;i[f+(a+2)>>0]=h>>>8;i[f+(a+3)>>0]=h}d=H+24|0;e=k[d>>2]|0;f=k[y>>2]|0;a=f;g=e-a|0;if(h>>>0<=g>>>0){if(h>>>0<g>>>0?(F=f+h|0,(e|0)!=(F|0)):0)k[d>>2]=F}else{uc(y,h-g|0);a=k[y>>2]|0}k[H+16>>2]=a;k[H+12>>2]=h;k[I+16>>2]=k[G>>2];I=1;r=J;return I|0}function Uc(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0;ya=r;r=r+160|0;xa=ya+48|0;sa=ya;ta=ya+44|0;ua=ya+40|0;b=vc(a,1735162214)|0;c=vc(a,1819239265)|0;if((c|0)==0&((b|0)==0&(vc(a,1128678944)|0)!=0)){xa=1;r=ya;return xa|0}va=Cc(b)|0;if(va^(Cc(c)|0)){xa=0;r=ya;return xa|0}if(Cc(b)|0){xa=1;r=ya;return xa|0}n=a+8|0;f=a+12|0;e=k[f>>2]|0;do if(e){d=e;while(1){b=k[d+16>>2]|0;if(b>>>0>3891067366){b=k[d>>2]|0;if(!b){b=d;c=d;va=7;break}}else{if(b>>>0>=3891067366){c=d;va=13;break}c=d+4|0;b=k[c>>2]|0;if(!b){b=c;c=d;va=11;break}}d=b}if((va|0)==7){k[xa>>2]=c;e=b;va=14;break}else if((va|0)==11){k[xa>>2]=c;e=b;va=14;break}else if((va|0)==13){k[xa>>2]=c;if(!c){e=xa;va=14;break}else{b=e;Z=c;break}}}else{k[xa>>2]=f;e=f;c=f;va=14}while(0);if((va|0)==14){d=og(56)|0;k[d+16>>2]=-403899930;g=d+20|0;h=g+36|0;do{k[g>>2]=0;g=g+4|0}while((g|0)<(h|0));k[d>>2]=0;k[d+4>>2]=0;k[d+8>>2]=c;k[e>>2]=d;b=k[k[n>>2]>>2]|0;if(!b)b=d;else{k[n>>2]=b;b=k[e>>2]|0}Hc(k[a+12>>2]|0,b);b=a+16|0;k[b>>2]=(k[b>>2]|0)+1;b=k[f>>2]|0;Z=d}do if(b){d=b;while(1){b=k[d+16>>2]|0;if(b>>>0>3975144417){b=k[d>>2]|0;if(!b){c=d;b=d;va=20;break}}else{if(b>>>0>=3975144417){b=d;va=26;break}c=d+4|0;b=k[c>>2]|0;if(!b){b=d;va=24;break}}d=b}if((va|0)==20){k[xa>>2]=b;va=27;break}else if((va|0)==24){k[xa>>2]=b;va=27;break}else if((va|0)==26){k[xa>>2]=b;if(!b){c=xa;va=27;break}else break}}else{k[xa>>2]=f;c=f;b=f;va=27}while(0);if((va|0)==27){d=og(56)|0;k[d+16>>2]=-319822879;g=d+20|0;h=g+36|0;do{k[g>>2]=0;g=g+4|0}while((g|0)<(h|0));k[d>>2]=0;k[d+4>>2]=0;k[d+8>>2]=b;k[c>>2]=d;b=k[k[n>>2]>>2]|0;if(!b)b=d;else{k[n>>2]=b;b=k[c>>2]|0}Hc(k[a+12>>2]|0,b);b=a+16|0;k[b>>2]=(k[b>>2]|0)+1;b=d}U=Dc(a)|0;la=xa+4|0;ia=xa+12|0;ka=xa+16|0;ga=xa+24|0;ja=xa+28|0;ea=xa+36|0;ha=xa+40|0;V=xa+48|0;fa=xa+52|0;ba=xa+60|0;da=xa+64|0;$=xa+72|0;ca=xa+76|0;_=xa+84|0;aa=xa+88|0;W=xa+96|0;g=xa;h=g+96|0;do{k[g>>2]=0;g=g+4|0}while((g|0)<(h|0));k[W>>2]=U;c=U+31>>5;if(c)uc(V,c<<2);a:do if((U|0)>0){R=sa+8|0;S=sa+16|0;X=sa+20|0;A=sa+24|0;B=sa+32|0;C=sa+4|0;D=sa+2|0;E=sa+6|0;F=xa+12|0;G=xa+24|0;H=xa+32|0;I=xa+72|0;J=xa+80|0;K=xa+84|0;L=sa+12|0;M=xa+48|0;N=xa+60|0;Y=sa+16|0;O=xa+36|0;P=sa+28|0;Q=sa+36|0;T=0;b:while(1){j[R>>1]=0;k[S>>2]=0;k[X>>2]=0;k[A>>2]=0;k[B>>2]=0;if(!(Ec(a,T,ta,ua)|0)){va=288;break}c=k[ua>>2]|0;if((c|0)!=0?!(pc(k[ta>>2]|0,c,sa)|0):0){va=278;break}do if(!(k[B>>2]|0)){c=k[X>>2]|0;d=k[S>>2]|0;if((c|0)==(d|0)){Vc(xa,0);break}q=c-d|0;z=(q|0)/12|0;Vc(xa,z);c=k[S>>2]|0;o=k[X>>2]|0;if((c|0)!=(o|0)?(qa=k[c>>2]|0,ra=k[c+4>>2]|0,(qa|0)!=(ra|0)):0){f=k[qa>>2]&65535;d=k[qa+4>>2]&65535;n=qa;p=ra;g=f;e=d;while(1){if((n|0)!=(p|0))do{y=k[n>>2]|0;x=y&65535;f=(y|0)<(f<<16>>16|0)?x:f;g=(y|0)>(g<<16>>16|0)?x:g;x=k[n+4>>2]|0;y=x&65535;d=(x|0)<(d<<16>>16|0)?y:d;e=(x|0)>(e<<16>>16|0)?y:e;n=n+12|0}while((n|0)!=(p|0));h=c+12|0;if((h|0)==(o|0))break;n=k[h>>2]|0;p=k[c+16>>2]|0;c=h}c=k[sa>>2]|0;if(!((c&65535)<<16>>16==f<<16>>16?(y=k[C>>2]|0,((y&65535)<<16>>16==d<<16>>16?(c>>>16&65535)<<16>>16==g<<16>>16:0)&(y>>>16&65535)<<16>>16==e<<16>>16):0))va=65}else{c=k[sa>>2]|0;if(!((c&65535)<<16>>16==0?(y=k[C>>2]|0,(c|y)>>>0<65536&(y&65535)<<16>>16==0):0))va=65}if((va|0)==65){va=0;y=(k[M>>2]|0)+(T>>3)|0;i[y>>0]=l[y>>0]|128>>>(T&7);Vc(N,j[sa>>1]|0);Vc(N,j[C>>1]|0);Vc(N,j[D>>1]|0);Vc(N,j[E>>1]|0)}if((q|0)>0){c=0;do{y=k[S>>2]|0;Zc(F,((k[y+(c*12|0)+4>>2]|0)-(k[y+(c*12|0)>>2]|0)|0)/12|0);c=c+1|0}while((c|0)<(z|0));y=0;f=0;c=0;while(1){w=k[S>>2]|0;d=k[w+(y*12|0)>>2]|0;w=(k[w+(y*12|0)+4>>2]|0)-d|0;x=(w|0)/12|0;c:do if((w|0)>0){e=0;h=c;while(1){w=k[d+(e*12|0)>>2]|0;c=k[d+(e*12|0)+4>>2]|0;o=w-f|0;g=c-h|0;t=(o|0)>-1?o:0-o|0;v=(g|0)>-1?g:0-g|0;n=(i[d+(e*12|0)+8>>0]|0)!=0?0:128;d=o>>>31^1;g=g>>>31^1;o=g<<1|d;do if((w|0)==(f|0)&(v|0)<1280){p=(g|n|v>>>7&30)&255;d=k[ja>>2]|0;f=k[H>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=p;k[ja>>2]=(k[ja>>2]|0)+1}else{q=k[G>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=73;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ja>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=77}else{f=k[ja>>2]|0;d=2147483647;g=f;f=f-o|0;va=77}if((va|0)==77){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;t=d-o|0;u=h+(f-t)|0;ki(u|0,q|0,t|0)|0;k[G>>2]=u;k[ja>>2]=h+(f+1);k[H>>2]=h+n;if(!s)break;rg(s)}while(0);p=v&255;d=k[ca>>2]|0;f=k[J>>2]|0;if(d>>>0<f>>>0){i[d>>0]=p;k[ca>>2]=(k[ca>>2]|0)+1;break}q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=83;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=87}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-o|0;va=87}if((va|0)==87){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;u=d-o|0;v=h+(f-u)|0;ki(v|0,q|0,u|0)|0;k[I>>2]=v;k[ca>>2]=h+(f+1);k[J>>2]=h+n;if(!s)break;rg(s)}else{if((c|0)==(h|0)&(t|0)<1280){p=((t>>>7&30)+(n|10)|d)&255;d=k[ja>>2]|0;f=k[H>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=p;k[ja>>2]=(k[ja>>2]|0)+1}else{q=k[G>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=94;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ja>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=98}else{f=k[ja>>2]|0;d=2147483647;g=f;f=f-o|0;va=98}if((va|0)==98){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;u=d-o|0;v=h+(f-u)|0;ki(v|0,q|0,u|0)|0;k[G>>2]=v;k[ja>>2]=h+(f+1);k[H>>2]=h+n;if(!s)break;rg(s)}while(0);p=t&255;d=k[ca>>2]|0;f=k[J>>2]|0;if(d>>>0<f>>>0){i[d>>0]=p;k[ca>>2]=(k[ca>>2]|0)+1;break}q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=104;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=108}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-o|0;va=108}if((va|0)==108){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;u=d-o|0;v=h+(f-u)|0;ki(v|0,q|0,u|0)|0;k[I>>2]=v;k[ca>>2]=h+(f+1);k[J>>2]=h+n;if(!s)break;rg(s);break}if((t|0)<65&(v|0)<65){u=t+-1|0;t=v+-1|0;p=((u&48)+(n|20)+(t>>>2&12)|o)&255;d=k[ja>>2]|0;f=k[H>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=p;k[ja>>2]=(k[ja>>2]|0)+1}else{q=k[G>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=115;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ja>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=119}else{f=k[ja>>2]|0;d=2147483647;g=f;f=f-o|0;va=119}if((va|0)==119){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;p=d-o|0;v=h+(f-p)|0;ki(v|0,q|0,p|0)|0;k[G>>2]=v;k[ja>>2]=h+(f+1);k[H>>2]=h+n;if(!s)break;rg(s)}while(0);p=(t&15|u<<4)&255;d=k[ca>>2]|0;f=k[J>>2]|0;if(d>>>0<f>>>0){i[d>>0]=p;k[ca>>2]=(k[ca>>2]|0)+1;break}q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=125;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=129}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-o|0;va=129}if((va|0)==129){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;u=d-o|0;v=h+(f-u)|0;ki(v|0,q|0,u|0)|0;k[I>>2]=v;k[ca>>2]=h+(f+1);k[J>>2]=h+n;if(!s)break;rg(s);break}if((t|0)<769&(v|0)<769){t=t+-1|0;u=v+-1|0;p=(((t>>>8&3)*12|0)+(n|84)+(u>>>6&12)|o)&255;d=k[ja>>2]|0;f=k[H>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=p;k[ja>>2]=(k[ja>>2]|0)+1}else{q=k[G>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=136;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ja>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=140}else{f=k[ja>>2]|0;d=2147483647;g=f;f=f-o|0;va=140}if((va|0)==140){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;p=d-o|0;v=h+(f-p)|0;ki(v|0,q|0,p|0)|0;k[G>>2]=v;k[ja>>2]=h+(f+1);k[H>>2]=h+n;if(!s)break;rg(s)}while(0);o=t&255;d=k[ca>>2]|0;f=k[J>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=o;d=(k[ca>>2]|0)+1|0;k[ca>>2]=d}else{q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=146;break b}p=q;d=f-p|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-p|0;if(!d){n=0;h=0}else va=150}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-p|0;va=150}if((va|0)==150){va=0;n=d;h=og(d)|0}i[h+f>>0]=o;d=h+(f+1)|0;t=g-p|0;v=h+(f-t)|0;ki(v|0,q|0,t|0)|0;k[I>>2]=v;k[ca>>2]=d;k[J>>2]=h+n;if(!s)break;rg(s);d=k[ca>>2]|0}while(0);p=u&255;f=k[J>>2]|0;if(d>>>0<f>>>0){i[d>>0]=p;k[ca>>2]=(k[ca>>2]|0)+1;break}q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=156;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=160}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-o|0;va=160}if((va|0)==160){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;u=d-o|0;v=h+(f-u)|0;ki(v|0,q|0,u|0)|0;k[I>>2]=v;k[ca>>2]=h+(f+1);k[J>>2]=h+n;if(!s)break;rg(s);break}d=o|n;if((t|0)<4096&(v|0)<4096){p=(d|120)&255;d=k[ja>>2]|0;f=k[H>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=p;k[ja>>2]=(k[ja>>2]|0)+1}else{q=k[G>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=167;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ja>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=171}else{f=k[ja>>2]|0;d=2147483647;g=f;f=f-o|0;va=171}if((va|0)==171){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;p=d-o|0;u=h+(f-p)|0;ki(u|0,q|0,p|0)|0;k[G>>2]=u;k[ja>>2]=h+(f+1);k[H>>2]=h+n;if(!s)break;rg(s)}while(0);o=t>>>4&255;d=k[ca>>2]|0;f=k[J>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=o;d=(k[ca>>2]|0)+1|0;k[ca>>2]=d}else{q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=177;break b}p=q;d=f-p|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-p|0;if(!d){n=0;h=0}else va=181}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-p|0;va=181}if((va|0)==181){va=0;n=d;h=og(d)|0}i[h+f>>0]=o;d=h+(f+1)|0;p=g-p|0;u=h+(f-p)|0;ki(u|0,q|0,p|0)|0;k[I>>2]=u;k[ca>>2]=d;k[J>>2]=h+n;if(!s)break;rg(s);d=k[ca>>2]|0}while(0);o=(v>>>8|t<<4)&255;f=k[J>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=o;d=(k[ca>>2]|0)+1|0;k[ca>>2]=d}else{q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=187;break b}p=q;d=f-p|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-p|0;if(!d){n=0;h=0}else va=191}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-p|0;va=191}if((va|0)==191){va=0;n=d;h=og(d)|0}i[h+f>>0]=o;d=h+(f+1)|0;t=g-p|0;u=h+(f-t)|0;ki(u|0,q|0,t|0)|0;k[I>>2]=u;k[ca>>2]=d;k[J>>2]=h+n;if(!s)break;rg(s);d=k[ca>>2]|0}while(0);p=v&255;f=k[J>>2]|0;if(d>>>0<f>>>0){i[d>>0]=p;k[ca>>2]=(k[ca>>2]|0)+1;break}q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=197;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=201}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-o|0;va=201}if((va|0)==201){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;u=d-o|0;v=h+(f-u)|0;ki(v|0,q|0,u|0)|0;k[I>>2]=v;k[ca>>2]=h+(f+1);k[J>>2]=h+n;if(!s)break;rg(s);break}p=(d|124)&255;d=k[ja>>2]|0;f=k[H>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=p;k[ja>>2]=(k[ja>>2]|0)+1}else{q=k[G>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=207;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ja>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=211}else{f=k[ja>>2]|0;d=2147483647;g=f;f=f-o|0;va=211}if((va|0)==211){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;p=d-o|0;u=h+(f-p)|0;ki(u|0,q|0,p|0)|0;k[G>>2]=u;k[ja>>2]=h+(f+1);k[H>>2]=h+n;if(!s)break;rg(s)}while(0);o=t>>>8&255;d=k[ca>>2]|0;f=k[J>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=o;d=(k[ca>>2]|0)+1|0;k[ca>>2]=d}else{q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=217;break b}p=q;d=f-p|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-p|0;if(!d){n=0;h=0}else va=221}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-p|0;va=221}if((va|0)==221){va=0;n=d;h=og(d)|0}i[h+f>>0]=o;d=h+(f+1)|0;p=g-p|0;u=h+(f-p)|0;ki(u|0,q|0,p|0)|0;k[I>>2]=u;k[ca>>2]=d;k[J>>2]=h+n;if(!s)break;rg(s);d=k[ca>>2]|0}while(0);o=t&255;f=k[J>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=o;d=(k[ca>>2]|0)+1|0;k[ca>>2]=d}else{q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=227;break b}p=q;d=f-p|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-p|0;if(!d){n=0;h=0}else va=231}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-p|0;va=231}if((va|0)==231){va=0;n=d;h=og(d)|0}i[h+f>>0]=o;d=h+(f+1)|0;t=g-p|0;u=h+(f-t)|0;ki(u|0,q|0,t|0)|0;k[I>>2]=u;k[ca>>2]=d;k[J>>2]=h+n;if(!s)break;rg(s);d=k[ca>>2]|0}while(0);o=v>>>8&255;f=k[J>>2]|0;do if(d>>>0<f>>>0){i[d>>0]=o;d=(k[ca>>2]|0)+1|0;k[ca>>2]=d}else{q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=237;break b}p=q;d=f-p|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;f=k[ca>>2]|0;g=f-p|0;if(!d){n=0;h=0}else va=241}else{g=k[ca>>2]|0;d=2147483647;f=g;g=g-p|0;va=241}if((va|0)==241){va=0;n=d;h=og(d)|0}i[h+g>>0]=o;d=h+(g+1)|0;t=f-p|0;u=h+(g-t)|0;ki(u|0,q|0,t|0)|0;k[I>>2]=u;k[ca>>2]=d;k[J>>2]=h+n;if(!s)break;rg(s);d=k[ca>>2]|0}while(0);p=v&255;f=k[J>>2]|0;if(d>>>0<f>>>0){i[d>>0]=p;k[ca>>2]=(k[ca>>2]|0)+1;break}q=k[I>>2]|0;s=q;g=d-s+1|0;if((g|0)<0){va=247;break b}o=q;d=f-o|0;if(d>>>0<1073741823){d=d<<1;d=d>>>0<g>>>0?g:d;g=k[ca>>2]|0;f=g-o|0;if(!d){n=0;h=0;d=g}else va=251}else{f=k[ca>>2]|0;d=2147483647;g=f;f=f-o|0;va=251}if((va|0)==251){va=0;n=d;h=og(d)|0;d=g}i[h+f>>0]=p;u=d-o|0;v=h+(f-u)|0;ki(v|0,q|0,u|0)|0;k[I>>2]=v;k[ca>>2]=h+(f+1);k[J>>2]=h+n;if(!s)break;rg(s)}while(0);e=e+1|0;if((e|0)>=(x|0)){d=w;break c}d=k[(k[S>>2]|0)+(y*12|0)>>2]|0;f=w;h=c}}else d=f;while(0);y=y+1|0;if((y|0)>=(z|0))break;else f=d}Zc(I,m[R>>1]|0);f=k[L>>2]|0;z=j[R>>1]|0;g=z&65535;if(z<<16>>16){e=k[aa>>2]|0;c=k[K>>2]|0;h=e-c|0;d=h+g|0;do if(h>>>0>=d>>>0){if(h>>>0>d>>>0){d=c+d|0;if((e|0)==(d|0))break;k[aa>>2]=d}}else{uc(K,g);c=k[K>>2]|0}while(0);ki(c+h|0,f|0,g|0)|0}}}else{Vc(xa,-1);f=(k[M>>2]|0)+(T>>3)|0;i[f>>0]=l[f>>0]|128>>>(T&7);Vc(N,j[sa>>1]|0);Vc(N,j[C>>1]|0);Vc(N,j[D>>1]|0);Vc(N,j[E>>1]|0);f=k[P>>2]|0;g=k[B>>2]|0;if(g){d=k[ha>>2]|0;c=k[O>>2]|0;h=d-c|0;e=h+g|0;if(h>>>0>=e>>>0){if(h>>>0>e>>>0?(ma=c+e|0,(d|0)!=(ma|0)):0)k[ha>>2]=ma}else{uc(O,g);c=k[O>>2]|0}ki(c+h|0,f|0,g|0)|0}if((i[Q>>0]|0)!=0?(Zc(I,m[R>>1]|0),na=k[L>>2]|0,z=j[R>>1]|0,oa=z&65535,z<<16>>16!=0):0){d=k[aa>>2]|0;c=k[K>>2]|0;f=d-c|0;e=f+oa|0;if(f>>>0>=e>>>0){if(f>>>0>e>>>0?(pa=c+e|0,(d|0)!=(pa|0)):0)k[aa>>2]=pa}else{uc(K,oa);c=k[K>>2]|0}ki(c+f|0,na|0,oa|0)|0}}while(0);c=k[Y>>2]|0;if(c){d=k[X>>2]|0;if((d|0)!=(c|0)){do{e=d+-12|0;k[X>>2]=e;f=k[e>>2]|0;g=f;if(!f)d=e;else{d=d+-8|0;e=k[d>>2]|0;if((e|0)!=(f|0))k[d>>2]=e+(~(((e+-12-g|0)>>>0)/12|0)*12|0);rg(f);d=k[X>>2]|0}}while((d|0)!=(c|0));c=k[Y>>2]|0}rg(c)}T=T+1|0;if((T|0)>=(U|0)){va=275;break a}}switch(va|0){case 73:{mg(G);break}case 83:{mg(I);break}case 94:{mg(G);break}case 104:{mg(I);break}case 115:{mg(G);break}case 125:{mg(I);break}case 136:{mg(G);break}case 146:{mg(I);break}case 156:{mg(I);break}case 167:{mg(G);break}case 177:{mg(I);break}case 187:{mg(I);break}case 197:{mg(I);break}case 207:{mg(G);break}case 217:{mg(I);break}case 227:{mg(I);break}case 237:{mg(I);break}case 247:{mg(I);break}case 278:{b=k[Y>>2]|0;if(b){c=k[X>>2]|0;if((c|0)!=(b|0)){do{d=c+-12|0;k[X>>2]=d;e=k[d>>2]|0;f=e;if(!e)c=d;else{c=c+-8|0;d=k[c>>2]|0;if((d|0)!=(e|0))k[c>>2]=d+(~(((d+-12-f|0)>>>0)/12|0)*12|0);rg(e);c=k[X>>2]|0}}while((c|0)!=(b|0));b=k[Y>>2]|0}rg(b)}wa=0;break a}case 288:{b=k[Y>>2]|0;if(b){c=k[X>>2]|0;if((c|0)!=(b|0)){do{d=c+-12|0;k[X>>2]=d;e=k[d>>2]|0;f=e;if(!e)c=d;else{c=c+-8|0;d=k[c>>2]|0;if((d|0)!=(e|0))k[c>>2]=d+(~(((d+-12-f|0)>>>0)/12|0)*12|0);rg(e);c=k[X>>2]|0}}while((c|0)!=(b|0));b=k[Y>>2]|0}rg(b)}wa=0;break a}}}else va=275;while(0);if((va|0)==275){d=Z+40|0;Wc(d,0);Vc(d,k[W>>2]|0);Vc(d,0);Wc(d,(k[la>>2]|0)-(k[xa>>2]|0)|0);sa=xa+12|0;Wc(d,(k[ka>>2]|0)-(k[sa>>2]|0)|0);ta=xa+24|0;Wc(d,(k[ja>>2]|0)-(k[ta>>2]|0)|0);ua=xa+72|0;Wc(d,(k[ca>>2]|0)-(k[ua>>2]|0)|0);va=xa+36|0;Wc(d,(k[ha>>2]|0)-(k[va>>2]|0)|0);wa=xa+60|0;Wc(d,(k[fa>>2]|0)-(k[V>>2]|0)+(k[da>>2]|0)-(k[wa>>2]|0)|0);c=xa+84|0;Wc(d,(k[aa>>2]|0)-(k[c>>2]|0)|0);Xc(d,xa);Xc(d,sa);Xc(d,ta);Xc(d,ua);Xc(d,va);Xc(d,V);Xc(d,wa);Xc(d,c);c=vc(a,1751474532)|0;if((c|0)!=0?(k[c+12>>2]|0)>>>0>=52:0){i[(k[d>>2]|0)+7>>0]=i[(k[c+16>>2]|0)+51>>0]|0;k[Z+20>>2]=-403899930;wa=k[d>>2]|0;k[Z+32>>2]=(k[Z+44>>2]|0)-wa;k[Z+36>>2]=wa;k[b+20>>2]=-319822879;k[b+32>>2]=0;k[b+36>>2]=0;wa=1}else wa=0}b=k[_>>2]|0;if(b){if((k[aa>>2]|0)!=(b|0))k[aa>>2]=b;rg(b)}b=k[$>>2]|0;if(b){if((k[ca>>2]|0)!=(b|0))k[ca>>2]=b;rg(b)}b=k[ba>>2]|0;if(b){if((k[da>>2]|0)!=(b|0))k[da>>2]=b;rg(b)}b=k[xa+48>>2]|0;if(b){if((k[fa>>2]|0)!=(b|0))k[fa>>2]=b;rg(b)}b=k[ea>>2]|0;if(b){if((k[ha>>2]|0)!=(b|0))k[ha>>2]=b;rg(b)}b=k[ga>>2]|0;if(b){if((k[ja>>2]|0)!=(b|0))k[ja>>2]=b;rg(b)}b=k[ia>>2]|0;if(b){if((k[ka>>2]|0)!=(b|0))k[ka>>2]=b;rg(b)}b=k[xa>>2]|0;if(b){if((k[la>>2]|0)!=(b|0))k[la>>2]=b;rg(b)}xa=wa;r=ya;return xa|0}function Vc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0;h=b>>>8&255;n=a+4|0;c=k[n>>2]|0;o=a+8|0;e=k[o>>2]|0;if(c>>>0>=e>>>0){m=k[a>>2]|0;l=m;d=c-l+1|0;if((d|0)<0)mg(a);j=m;c=e-j|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<d>>>0?d:c;d=k[n>>2]|0;e=d-j|0;if(!c){g=0;f=0}else p=8}else{e=k[n>>2]|0;c=2147483647;d=e;e=e-j|0;p=8}if((p|0)==8){g=c;f=og(c)|0}i[f+e>>0]=h;c=f+(e+1)|0;h=d-j|0;j=f+(e-h)|0;ki(j|0,m|0,h|0)|0;k[a>>2]=j;k[n>>2]=c;k[o>>2]=f+g;if(l){rg(l);c=k[n>>2]|0}}else{i[c>>0]=h;c=(k[n>>2]|0)+1|0;k[n>>2]=c}j=b&255;d=k[o>>2]|0;if(c>>>0<d>>>0){i[c>>0]=j;k[n>>2]=(k[n>>2]|0)+1;return}l=k[a>>2]|0;m=l;e=c-m+1|0;if((e|0)<0)mg(a);h=l;c=d-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<e>>>0?e:c;e=k[n>>2]|0;d=e-h|0;if(!c){g=0;f=0;c=e}else p=18}else{d=k[n>>2]|0;c=2147483647;e=d;d=d-h|0;p=18}if((p|0)==18){g=c;f=og(c)|0;c=e}i[f+d>>0]=j;b=c-h|0;p=f+(d-b)|0;ki(p|0,l|0,b|0)|0;k[a>>2]=p;k[n>>2]=f+(d+1);k[o>>2]=f+g;if(!m)return;rg(m);return}function Wc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0;h=b>>>24&255;n=a+4|0;c=k[n>>2]|0;o=a+8|0;e=k[o>>2]|0;if(c>>>0>=e>>>0){m=k[a>>2]|0;l=m;d=c-l+1|0;if((d|0)<0)mg(a);j=m;c=e-j|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<d>>>0?d:c;e=k[n>>2]|0;d=e-j|0;if(!c){g=0;f=0}else p=8}else{d=k[n>>2]|0;c=2147483647;e=d;d=d-j|0;p=8}if((p|0)==8){g=c;f=og(c)|0}i[f+d>>0]=h;c=f+(d+1)|0;h=e-j|0;j=f+(d-h)|0;ki(j|0,m|0,h|0)|0;k[a>>2]=j;k[n>>2]=c;k[o>>2]=f+g;if(l){rg(l);c=k[n>>2]|0}}else{i[c>>0]=h;c=(k[n>>2]|0)+1|0;k[n>>2]=c}h=b>>>16&255;d=k[o>>2]|0;if(c>>>0>=d>>>0){l=k[a>>2]|0;m=l;e=c-m+1|0;if((e|0)<0)mg(a);j=l;c=d-j|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<e>>>0?e:c;e=k[n>>2]|0;d=e-j|0;if(!c){g=0;f=0}else p=18}else{d=k[n>>2]|0;c=2147483647;e=d;d=d-j|0;p=18}if((p|0)==18){g=c;f=og(c)|0}i[f+d>>0]=h;c=f+(d+1)|0;h=e-j|0;j=f+(d-h)|0;ki(j|0,l|0,h|0)|0;k[a>>2]=j;k[n>>2]=c;k[o>>2]=f+g;if(m){rg(m);c=k[n>>2]|0}}else{i[c>>0]=h;c=(k[n>>2]|0)+1|0;k[n>>2]=c}j=b>>>8&255;d=k[o>>2]|0;if(c>>>0>=d>>>0){l=k[a>>2]|0;m=l;e=c-m+1|0;if((e|0)<0)mg(a);h=l;c=d-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<e>>>0?e:c;d=k[n>>2]|0;e=d-h|0;if(!c){g=0;f=0}else p=28}else{e=k[n>>2]|0;c=2147483647;d=e;e=e-h|0;p=28}if((p|0)==28){g=c;f=og(c)|0}i[f+e>>0]=j;c=f+(e+1)|0;h=d-h|0;j=f+(e-h)|0;ki(j|0,l|0,h|0)|0;k[a>>2]=j;k[n>>2]=c;k[o>>2]=f+g;if(m){rg(m);c=k[n>>2]|0}}else{i[c>>0]=j;c=(k[n>>2]|0)+1|0;k[n>>2]=c}j=b&255;d=k[o>>2]|0;if(c>>>0<d>>>0){i[c>>0]=j;k[n>>2]=(k[n>>2]|0)+1;return}l=k[a>>2]|0;m=l;e=c-m+1|0;if((e|0)<0)mg(a);h=l;c=d-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<e>>>0?e:c;e=k[n>>2]|0;d=e-h|0;if(!c){g=0;f=0;c=e}else p=38}else{d=k[n>>2]|0;c=2147483647;e=d;d=d-h|0;p=38}if((p|0)==38){g=c;f=og(c)|0;c=e}i[f+d>>0]=j;b=c-h|0;p=f+(d-b)|0;ki(p|0,l|0,b|0)|0;k[a>>2]=p;k[n>>2]=f+(d+1);k[o>>2]=f+g;if(!m)return;rg(m);return}function Xc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;o=b+4|0;c=k[b>>2]|0;if((k[o>>2]|0)==(c|0))return;p=a+4|0;q=a+8|0;n=0;while(1){m=c+n|0;c=k[p>>2]|0;if((c|0)==(k[q>>2]|0)){h=k[a>>2]|0;j=h;d=c-j+1|0;if((d|0)<0){r=6;break}l=h;c=c-l|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<d>>>0?d:c;e=k[p>>2]|0;d=e-l|0;if(!c){g=0;f=0;c=e}else r=10}else{d=k[p>>2]|0;c=2147483647;e=d;d=d-l|0;r=10}if((r|0)==10){r=0;g=c;f=og(c)|0;c=e}i[f+d>>0]=i[m>>0]|0;l=c-l|0;m=f+(d-l)|0;ki(m|0,h|0,l|0)|0;k[a>>2]=m;k[p>>2]=f+(d+1);k[q>>2]=f+g;if(j)rg(j)}else{i[c>>0]=i[m>>0]|0;k[p>>2]=(k[p>>2]|0)+1}n=n+1|0;c=k[b>>2]|0;if(n>>>0>=((k[o>>2]|0)-c|0)>>>0){r=14;break}}if((r|0)==6)mg(a);else if((r|0)==14)return}function Yc(a){a=a|0;return ((a&65535)<253?1:(a&65535)<762?2:3)|0}function Zc(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0;if((b|0)<253){j=b&255;m=a+4|0;c=k[m>>2]|0;n=a+8|0;e=k[n>>2]|0;if(c>>>0<e>>>0){i[c>>0]=j;k[m>>2]=(k[m>>2]|0)+1;return}o=k[a>>2]|0;l=o;d=c-l+1|0;if((d|0)<0)mg(a);h=o;c=e-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<d>>>0?d:c;e=k[m>>2]|0;d=e-h|0;if(!c){g=0;f=0;c=e}else p=9}else{d=k[m>>2]|0;c=2147483647;e=d;d=d-h|0;p=9}if((p|0)==9){g=c;f=og(c)|0;c=e}i[f+d>>0]=j;b=c-h|0;p=f+(d-b)|0;ki(p|0,o|0,b|0)|0;k[a>>2]=p;k[m>>2]=f+(d+1);k[n>>2]=f+g;if(!l)return;rg(l);return}if((b|0)<506){n=a+4|0;c=k[n>>2]|0;o=a+8|0;d=k[o>>2]|0;if(c>>>0>=d>>>0){j=k[a>>2]|0;l=j;e=c-l+1|0;if((e|0)<0)mg(a);h=j;c=d-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<e>>>0?e:c;e=k[n>>2]|0;d=e-h|0;if(!c){g=0;f=0}else p=20}else{d=k[n>>2]|0;c=2147483647;e=d;d=d-h|0;p=20}if((p|0)==20){g=c;f=og(c)|0}i[f+d>>0]=-1;c=f+(d+1)|0;h=e-h|0;m=f+(d-h)|0;ki(m|0,j|0,h|0)|0;k[a>>2]=m;k[n>>2]=c;k[o>>2]=f+g;if(l){rg(l);c=k[n>>2]|0}}else{i[c>>0]=-1;c=(k[n>>2]|0)+1|0;k[n>>2]=c}j=b+3&255;d=k[o>>2]|0;if(c>>>0<d>>>0){i[c>>0]=j;k[n>>2]=(k[n>>2]|0)+1;return}l=k[a>>2]|0;m=l;e=c-m+1|0;if((e|0)<0)mg(a);h=l;c=d-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<e>>>0?e:c;e=k[n>>2]|0;d=e-h|0;if(!c){g=0;f=0;c=e}else p=30}else{d=k[n>>2]|0;c=2147483647;e=d;d=d-h|0;p=30}if((p|0)==30){g=c;f=og(c)|0;c=e}i[f+d>>0]=j;b=c-h|0;p=f+(d-b)|0;ki(p|0,l|0,b|0)|0;k[a>>2]=p;k[n>>2]=f+(d+1);k[o>>2]=f+g;if(!m)return;rg(m);return}n=a+4|0;d=k[n>>2]|0;o=a+8|0;e=k[o>>2]|0;c=d>>>0<e>>>0;if((b|0)<762){if(!c){j=k[a>>2]|0;l=j;d=d-l+1|0;if((d|0)<0)mg(a);h=j;c=e-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<d>>>0?d:c;d=k[n>>2]|0;e=d-h|0;if(!c){g=0;f=0}else p=41}else{e=k[n>>2]|0;c=2147483647;d=e;e=e-h|0;p=41}if((p|0)==41){g=c;f=og(c)|0}i[f+e>>0]=-2;c=f+(e+1)|0;h=d-h|0;m=f+(e-h)|0;ki(m|0,j|0,h|0)|0;k[a>>2]=m;k[n>>2]=c;k[o>>2]=f+g;if(l){rg(l);c=k[n>>2]|0}}else{i[d>>0]=-2;c=(k[n>>2]|0)+1|0;k[n>>2]=c}j=b+6&255;d=k[o>>2]|0;if(c>>>0<d>>>0){i[c>>0]=j;k[n>>2]=(k[n>>2]|0)+1;return}l=k[a>>2]|0;m=l;e=c-m+1|0;if((e|0)<0)mg(a);h=l;c=d-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<e>>>0?e:c;e=k[n>>2]|0;d=e-h|0;if(!c){g=0;f=0;c=e}else p=51}else{d=k[n>>2]|0;c=2147483647;e=d;d=d-h|0;p=51}if((p|0)==51){g=c;f=og(c)|0;c=e}i[f+d>>0]=j;b=c-h|0;p=f+(d-b)|0;ki(p|0,l|0,b|0)|0;k[a>>2]=p;k[n>>2]=f+(d+1);k[o>>2]=f+g;if(!m)return;rg(m);return}if(!c){j=k[a>>2]|0;l=j;d=d-l+1|0;if((d|0)<0)mg(a);h=j;c=e-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<d>>>0?d:c;d=k[n>>2]|0;e=d-h|0;if(!c){g=0;f=0}else p=61}else{e=k[n>>2]|0;c=2147483647;d=e;e=e-h|0;p=61}if((p|0)==61){g=c;f=og(c)|0}i[f+e>>0]=-3;c=f+(e+1)|0;h=d-h|0;m=f+(e-h)|0;ki(m|0,j|0,h|0)|0;k[a>>2]=m;k[n>>2]=c;k[o>>2]=f+g;if(l){rg(l);c=k[n>>2]|0}}else{i[d>>0]=-3;c=(k[n>>2]|0)+1|0;k[n>>2]=c}h=b>>>8&255;d=k[o>>2]|0;if(c>>>0>=d>>>0){l=k[a>>2]|0;m=l;e=c-m+1|0;if((e|0)<0)mg(a);j=l;c=d-j|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<e>>>0?e:c;d=k[n>>2]|0;e=d-j|0;if(!c){g=0;f=0}else p=71}else{e=k[n>>2]|0;c=2147483647;d=e;e=e-j|0;p=71}if((p|0)==71){g=c;f=og(c)|0}i[f+e>>0]=h;c=f+(e+1)|0;h=d-j|0;j=f+(e-h)|0;ki(j|0,l|0,h|0)|0;k[a>>2]=j;k[n>>2]=c;k[o>>2]=f+g;if(m){rg(m);c=k[n>>2]|0}}else{i[c>>0]=h;c=(k[n>>2]|0)+1|0;k[n>>2]=c}j=b&255;d=k[o>>2]|0;if(c>>>0<d>>>0){i[c>>0]=j;k[n>>2]=(k[n>>2]|0)+1;return}l=k[a>>2]|0;m=l;e=c-m+1|0;if((e|0)<0)mg(a);h=l;c=d-h|0;if(c>>>0<1073741823){c=c<<1;c=c>>>0<e>>>0?e:c;e=k[n>>2]|0;d=e-h|0;if(!c){g=0;f=0;c=e}else p=81}else{d=k[n>>2]|0;c=2147483647;e=d;d=d-h|0;p=81}if((p|0)==81){g=c;f=og(c)|0;c=e}i[f+d>>0]=j;b=c-h|0;p=f+(d-b)|0;ki(p|0,l|0,b|0)|0;k[a>>2]=p;k[n>>2]=f+(d+1);k[o>>2]=f+g;if(!m)return;rg(m);return}function _c(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,l=0;h=r;r=r+16|0;d=h;k[d>>2]=0;g=d+4|0;k[g>>2]=0;k[d+8>>2]=0;Zc(d,a);a=k[d>>2]|0;d=k[g>>2]|0;e=(a|0)==(d|0);if(!e){f=a;do{l=i[f>>0]|0;j=k[b>>2]|0;k[b>>2]=j+1;i[c+j>>0]=l;f=f+1|0}while((f|0)!=(d|0))}if(!a){r=h;return}if(!e)k[g>>2]=a;rg(a);r=h;return}function $c(a){a=a|0;var b=0;if(a>>>0>127){b=1;while(1){b=b+1|0;if(a>>>0>16383)a=a>>>7;else{a=b;break}}}else a=1;return a|0}function ad(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;if(a>>>0>127){e=a;d=1;while(1){d=d+1|0;if(e>>>0>16383)e=e>>>7;else break}if(!d)return}else d=1;e=d+-1|0;f=0;do{h=a>>>(((d-f|0)*7|0)+-7|0);g=k[b>>2]|0;k[b>>2]=g+1;i[c+g>>0]=f>>>0<e>>>0?h|128:h&127;f=f+1|0}while((f|0)!=(d|0));return}function bd(a,b){a=a|0;b=b|0;var c=0,d=0;if(!b){b=0;return b|0}else{c=0;d=0}do{c=((l[a+(d|1)>>0]|0)<<16|(l[a+d>>0]|0)<<24|(l[a+(d|2)>>0]|0)<<8|(l[a+(d|3)>>0]|0))+c|0;d=d+4|0}while(d>>>0<b>>>0);return c|0}function cd(a,b){a=a|0;b=b|0;var c=0,d=0;c=(a|0)==131072?12:0;if((a|0)<131072)switch(a|0){case 65536:{d=2;break}default:{}}else switch(a|0){case 131072:{d=2;break}default:{}}if((d|0)==2)c=(b<<2)+12+c|0;return c|0}function dd(a,b){a=a|0;b=b|0;var c=0,d=0;a=r;r=r+16|0;c=a;ai(c,318131,0);d=i[c>>0]|0;b=b+1024+((d&1)==0?(d&255)>>>1:k[c+4>>2]|0)|0;bi(c);r=a;return b|0}function ed(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=r;r=r+16|0;f=e;ai(f,318131,0);d=fd(a,b,c,d,f)|0;bi(f);r=e;return d|0}function fd(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0;ha=r;r=r+224|0;X=ha+196|0;_=ha+16|0;Y=ha+8|0;N=ha;J=ha+164|0;I=ha+132|0;ga=ha+168|0;da=ha+152|0;ca=ha+120|0;ba=ha+108|0;aa=ha+96|0;$=ha+84|0;F=ha+72|0;G=ha+40|0;M=ha+28|0;Z=ha+24|0;k[ga+8>>2]=0;k[ga+12>>2]=0;fa=ga+8|0;k[ga+4>>2]=fa;R=ga+16|0;k[R>>2]=0;ea=ga+20|0;k[ea>>2]=0;k[ga+24>>2]=0;do if(Bc(a,b,ga)|0)if(Sc(ga)|0){a=k[R>>2]|0;b=k[ea>>2]|0;if((a|0)!=(b|0)){do{if(!(Uc(a)|0)){H=7;break}a=a+20|0}while((a|0)!=(b|0));if((H|0)==7){Dh(72154,28,1,k[1343]|0)|0;g=0;break}a=k[R>>2]|0;o=k[ea>>2]|0;if((a|0)!=(o|0)){b=0;do{f=k[a+8>>2]|0;n=a+12|0;if((f|0)==(n|0))f=0;else{h=f;f=0;while(1){g=h+20|0;do if(!(Cc(g)|0)){g=k[g>>2]|0;if((g&-2139062144|0)==0?(wc(a,g^-2139062144)|0)!=0:0)break;f=(k[h+32>>2]|0)+f|0}while(0);g=k[h+4>>2]|0;if(!g)while(1){g=k[h+8>>2]|0;if((k[g>>2]|0)==(h|0))break;else h=g}else while(1){h=k[g>>2]|0;if(!h)break;else g=h}if((g|0)==(n|0))break;else h=g}}b=f+b|0;a=a+20|0}while((a|0)!=(o|0))}else b=0}else b=0;q=~~(+(b>>>0)*1.2+10240.0)>>>0;k[da>>2]=0;W=da+4|0;k[W>>2]=0;k[da+8>>2]=0;if(q){if((q|0)<0)mg(da);f=og(q)|0;k[W>>2]=f;k[da>>2]=f;k[da+8>>2]=f+q;a=q;do{i[f>>0]=0;f=(k[W>>2]|0)+1|0;k[W>>2]=f;a=a+-1|0}while((a|0)!=0)}k[ca>>2]=0;V=ca+4|0;k[V>>2]=0;k[ca+8>>2]=0;if(b){if((b|0)<0)mg(ca);f=og(b)|0;k[V>>2]=f;k[ca>>2]=f;k[ca+8>>2]=f+b;a=b;do{i[f>>0]=0;f=(k[V>>2]|0)+1|0;k[V>>2]=f;a=a+-1|0}while((a|0)!=0)}a=k[R>>2]|0;p=k[ea>>2]|0;if((a|0)!=(p|0)){f=0;do{g=k[a+8>>2]|0;o=a+12|0;if((g|0)!=(o|0))do{h=g+20|0;n=wc(a,k[h>>2]^-2139062144)|0;if(!(Cc(h)|0)?(k[h>>2]&-2139062144|0)==0:0){T=(n|0)==0?h:n;U=k[T+12>>2]|0;ki((k[ca>>2]|0)+f|0,k[T+16>>2]|0,U|0)|0;f=U+f|0}h=k[g+4>>2]|0;if(!h)while(1){h=k[g+8>>2]|0;if((k[h>>2]|0)==(g|0)){g=h;break}else g=h}else{g=h;while(1){h=k[g>>2]|0;if(!h)break;else g=h}}}while((g|0)!=(o|0));a=a+20|0}while((a|0)!=(p|0))}T=k[ca>>2]|0;U=k[da>>2]|0;k[J>>2]=q;k[I>>2]=1;k[I+4>>2]=11;k[I+8>>2]=22;k[I+12>>2]=0;i[I+16>>0]=1;i[I+17>>0]=0;i[I+18>>0]=0;i[I+19>>0]=1;k[X>>2]=k[I>>2];k[X+4>>2]=k[I+4>>2];k[X+8>>2]=k[I+8>>2];k[X+12>>2]=k[I+12>>2];k[X+16>>2]=k[I+16>>2];if(hf(X,b,T,J,U)|0){K=k[J>>2]|0;a=i[e>>0]|0;L=e+4|0;b=k[L>>2]|0;g=~~(+(((a&1)==0?(a&255)>>>1:b)>>>0)*1.2+10240.0)>>>0;k[ba>>2]=0;U=ba+4|0;k[U>>2]=0;k[ba+8>>2]=0;if(g){if((g|0)<0)mg(ba);b=og(g)|0;k[U>>2]=b;k[ba>>2]=b;k[ba+8>>2]=b+g;a=g;do{i[b>>0]=0;b=(k[U>>2]|0)+1|0;k[U>>2]=b;a=a+-1|0}while((a|0)!=0);a=i[e>>0]|0;b=k[L>>2]|0}f=(a&1)==0;a=f?(a&255)>>>1:b;do if(a){S=f?e+1|0:k[e+8>>2]|0;T=k[ba>>2]|0;k[J>>2]=g;k[I>>2]=0;k[I+4>>2]=11;k[I+8>>2]=22;k[I+12>>2]=0;i[I+16>>0]=1;i[I+17>>0]=0;i[I+18>>0]=0;i[I+19>>0]=1;k[X>>2]=k[I>>2];k[X+4>>2]=k[I+4>>2];k[X+8>>2]=k[I+8>>2];k[X+12>>2]=k[I+12>>2];k[X+16>>2]=k[I+16>>2];if(!(hf(X,a,S,J,T)|0)){Dh(72222,41,1,k[1343]|0)|0;g=0;break}else{Q=k[J>>2]|0;H=55;break}}else{Q=0;H=55}while(0);if((H|0)==55){k[aa>>2]=0;T=aa+4|0;k[T>>2]=0;k[aa+8>>2]=0;O=$+4|0;k[O>>2]=0;P=$+8|0;k[P>>2]=0;S=$+4|0;k[$>>2]=S;a=k[R>>2]|0;w=k[ea>>2]|0;x=S;do if((a|0)!=(w|0)){E=F+4|0;y=G+4|0;z=G+12|0;A=G+16|0;B=G+24|0;C=G+28|0;D=aa+8|0;a:while(1){xc(F,a);b=k[F>>2]|0;u=k[E>>2]|0;if((b|0)!=(u|0)){v=a+12|0;do{h=k[b>>2]|0;f=k[v>>2]|0;if(!f){H=67;break a}while(1){g=k[f+16>>2]|0;if(h>>>0<g>>>0){f=k[f>>2]|0;if(!f){H=67;break a}}else{if(g>>>0>=h>>>0)break;f=k[f+4>>2]|0;if(!f){H=67;break a}}}if(!f){H=67;break a}t=f+20|0;do if(!(Cc(t)|0)){s=f+28|0;g=k[S>>2]|0;p=(g|0)==0;do if(!p){o=k[s>>2]|0;h=S;n=g;b:do{while(1){if((k[n+16>>2]|0)>>>0>=o>>>0){h=n;break}n=k[n+4>>2]|0;if(!n)break b}n=k[h>>2]|0}while((n|0)!=0);if((h|0)==(S|0))break;if(o>>>0>=(k[h+16>>2]|0)>>>0){H=100;break a}}while(0);q=((k[T>>2]|0)-(k[aa>>2]|0)|0)>>>5;do if(!p){o=k[s>>2]|0;while(1){h=k[g+16>>2]|0;if(o>>>0<h>>>0){h=k[g>>2]|0;if(!h){h=g;H=81;break}else g=h}else{if(h>>>0>=o>>>0){H=87;break}h=g+4|0;n=k[h>>2]|0;if(!n){H=85;break}else g=n}}if((H|0)==81){k[X>>2]=g;H=88;break}else if((H|0)==85){k[X>>2]=g;H=88;break}else if((H|0)==87){H=0;k[X>>2]=g;if(!g){h=X;H=88;break}else break}}else{k[X>>2]=S;h=S;g=x;H=88}while(0);if((H|0)==88){n=og(24)|0;k[n+16>>2]=k[s>>2];j[n+20>>1]=0;k[n>>2]=0;k[n+4>>2]=0;k[n+8>>2]=g;k[h>>2]=n;g=k[k[$>>2]>>2]|0;if(!g)g=n;else{k[$>>2]=g;g=k[h>>2]|0}Hc(k[O>>2]|0,g);k[P>>2]=(k[P>>2]|0)+1;g=n}j[g+20>>1]=q;H=k[t>>2]|0;k[G>>2]=H;k[y>>2]=0;f=k[f+32>>2]|0;k[z>>2]=f;k[A>>2]=f;f=wc(a,H^-2139062144)|0;if(!f)g=16;else{k[y>>2]=32;k[A>>2]=k[f+12>>2];g=48}f=k[T>>2]|0;if((k[aa>>2]|0)==(f|0)){k[B>>2]=K;k[C>>2]=k[da>>2]}else{k[B>>2]=0;k[C>>2]=0;k[y>>2]=g}if((f|0)==(k[D>>2]|0)){gd(aa,G);break}else{k[f>>2]=k[G>>2];k[f+4>>2]=k[G+4>>2];k[f+8>>2]=k[G+8>>2];k[f+12>>2]=k[G+12>>2];k[f+16>>2]=k[G+16>>2];k[f+20>>2]=k[G+20>>2];k[f+24>>2]=k[G+24>>2];k[f+28>>2]=k[G+28>>2];k[T>>2]=f+32;break}}while(0);b=b+4|0}while((b|0)!=(u|0));b=k[F>>2]|0}f=b;if(b){g=k[E>>2]|0;if((g|0)!=(b|0))k[E>>2]=g+(~((g+-4-f|0)>>>2)<<2);rg(b)}a=a+20|0;if((a|0)==(w|0)){H=110;break}}if((H|0)==67){ha=Va(8)|0;Xh(ha,72264);k[ha>>2]=5156;xb(ha|0,488,7)}else if((H|0)==100){a=k[F>>2]|0;if(!a){g=0;break}b=k[E>>2]|0;if((b|0)!=(a|0))k[E>>2]=b+(~((b+-4-a|0)>>>2)<<2);rg(a);g=0;break}else if((H|0)==110){x=S;a=k[$>>2]|0;H=111;break}}else{x=S;a=S;H=111}while(0);c:do if((H|0)==111){u=M+4|0;k[u>>2]=0;v=M+8|0;k[v>>2]=0;w=M+4|0;k[M>>2]=w;if((a|0)!=(x|0)){h=w;f=a;b=a;while(1){a=og(24)|0;g=a+16|0;G=f+16|0;H=k[G+4>>2]|0;f=g;k[f>>2]=k[G>>2];k[f+4>>2]=H;k[I>>2]=h;k[X>>2]=k[I>>2];g=hd(M,X,J,g)|0;f=k[g>>2]|0;if(f){if((f|0)!=(a|0))rg(a)}else{f=k[J>>2]|0;k[a>>2]=0;k[a+4>>2]=0;k[a+8>>2]=f;k[g>>2]=a;f=k[k[M>>2]>>2]|0;if(f){k[M>>2]=f;a=k[g>>2]|0}Hc(k[u>>2]|0,a);k[v>>2]=(k[v>>2]|0)+1}a=k[b+4>>2]|0;if(!a)while(1){a=k[b+8>>2]|0;if((k[a>>2]|0)==(b|0))break;else b=a}else while(1){b=k[a>>2]|0;if(!b)break;else a=b}if((a|0)==(S|0))break;else{f=a;b=a}}}a=k[aa>>2]|0;h=k[T>>2]|0;if((a|0)==(h|0))a=48;else{g=a;a=48;do{f=k[g>>2]|0;b=0;while(1){if((k[728+(b<<2)>>2]|0)==(f|0))break;b=b+1|0;if((b|0)>=63){b=63;break}}J=$c(k[g+12>>2]|0)|0;b=((b&63|0)!=63?1:5)+J|0;if(k[g+4>>2]&32)b=($c(k[g+16>>2]|0)|0)+b|0;a=b+a|0;g=g+32|0}while((g|0)!=(h|0))}b=((k[ea>>2]|0)-(k[R>>2]|0)|0)/20|0;if(b>>>0>1){a=a+4+(Yc(b&65535)|0)|0;s=k[ea>>2]|0;b=k[R>>2]|0;a=a+(((s-b|0)/20|0)<<2)|0;if((b|0)!=(s|0)){t=w;do{a=(Yc(k[b+16>>2]&65535)|0)+a|0;f=k[b+8>>2]|0;q=b+12|0;if((f|0)!=(q|0)){g=f;while(1){if(!(k[g+20>>2]&-2139062144)){p=g+28|0;f=k[w>>2]|0;do if(f){o=k[p>>2]|0;while(1){h=k[f+16>>2]|0;if(o>>>0<h>>>0){h=k[f>>2]|0;if(!h){h=f;H=140;break}else f=h}else{if(h>>>0>=o>>>0){H=146;break}h=f+4|0;n=k[h>>2]|0;if(!n){H=144;break}else f=n}}if((H|0)==140){k[X>>2]=f;H=147;break}else if((H|0)==144){k[X>>2]=f;H=147;break}else if((H|0)==146){H=0;k[X>>2]=f;if(!f){h=X;H=147;break}else break}}else{k[X>>2]=w;h=w;f=t;H=147}while(0);if((H|0)==147){n=og(24)|0;k[n+16>>2]=k[p>>2];j[n+20>>1]=0;k[n>>2]=0;k[n+4>>2]=0;k[n+8>>2]=f;k[h>>2]=n;f=k[k[M>>2]>>2]|0;if(!f)f=n;else{k[M>>2]=f;f=k[h>>2]|0}Hc(k[u>>2]|0,f);k[v>>2]=(k[v>>2]|0)+1;f=n}a=(Yc(j[f+20>>1]|0)|0)+a|0}f=k[g+4>>2]|0;if(!f)while(1){f=k[g+8>>2]|0;if((k[f>>2]|0)==(g|0))break;else g=f}else while(1){g=k[f>>2]|0;if(!g)break;else f=g}if((f|0)==(q|0))break;else g=f}}b=b+20|0}while((b|0)!=(s|0))}}b=k[aa>>2]|0;f=k[T>>2]|0;if((b|0)==(f|0))q=a;else{do{a=(k[b+24>>2]|0)+a|0;a=a>>>0>4294967292?a:a+3&-4;b=b+32|0}while((b|0)!=(f|0));q=a}f=q+Q|0;id(M,k[w>>2]|0);a=k[d>>2]|0;if(f>>>0>a>>>0){g=k[1343]|0;k[N>>2]=a;k[N+4>>2]=f;Eh(g,72288,N)|0;g=0;break}k[d>>2]=f;p=k[R>>2]|0;i[c>>0]=119;i[c+1>>0]=79;i[c+2>>0]=70;k[Z>>2]=4;i[c+3>>0]=50;a=(k[ea>>2]|0)-p|0;b=(a|0)==20;if(b){N=k[p>>2]|0;i[c+4>>0]=N>>>24;i[c+5>>0]=N>>>16;i[c+6>>0]=N>>>8;k[Z>>2]=8;i[c+7>>0]=N}else{i[c+4>>0]=116;i[c+5>>0]=116;i[c+6>>0]=99;k[Z>>2]=8;i[c+7>>0]=102}i[c+8>>0]=f>>>24;i[c+9>>0]=f>>>16;i[c+10>>0]=f>>>8;i[c+11>>0]=f;N=(k[T>>2]|0)-(k[aa>>2]|0)>>5;i[c+12>>0]=N>>>8;i[c+13>>0]=N;i[c+14>>0]=0;k[Z>>2]=16;i[c+15>>0]=0;do if(b){a=(m[p+4>>1]|0)<<4|12;b=k[p+8>>2]|0;g=p+12|0;if((b|0)==(g|0))break;f=b;while(1){b=f+20|0;do if(!(k[b>>2]&-2139062144)){if(Cc(b)|0)break;N=k[f+32>>2]|0;a=(N>>>0>4294967292?N:N+3&-4)+a|0}while(0);b=k[f+4>>2]|0;if(!b)while(1){b=k[f+8>>2]|0;if((k[b>>2]|0)==(f|0))break;else f=b}else while(1){f=k[b>>2]|0;if(!f)break;else b=f}if((b|0)==(g|0))break;else f=b}}else{a=cd(k[ga>>2]|0,(a|0)/20|0)|0;b=k[R>>2]|0;o=k[ea>>2]|0;if((b|0)==(o|0))break;do{f=(m[b+4>>1]|0)<<4|12;g=k[b+8>>2]|0;n=b+12|0;if((g|0)!=(n|0)){h=g;while(1){g=h+20|0;do if(!(k[g>>2]&-2139062144)){if(Cc(g)|0)break;N=k[h+32>>2]|0;f=(N>>>0>4294967292?N:N+3&-4)+f|0}while(0);g=k[h+4>>2]|0;if(!g)while(1){g=k[h+8>>2]|0;if((k[g>>2]|0)==(h|0))break;else h=g}else while(1){h=k[g>>2]|0;if(!h)break;else g=h}if((g|0)==(n|0))break;else h=g}}a=f+a|0;b=b+20|0}while((b|0)!=(o|0))}while(0);N=k[Z>>2]|0;i[c+N>>0]=a>>>24;i[c+(N+1)>>0]=a>>>16;i[c+(N+2)>>0]=a>>>8;i[c+(N+3)>>0]=a;i[c+(N+4)>>0]=K>>>24;i[c+(N+5)>>0]=K>>>16;i[c+(N+6)>>0]=K>>>8;k[Z>>2]=N+8;i[c+(N+7)>>0]=K;N=(wc(p,1751474532)|0)+16|0;N=(k[N>>2]|0)+4|0;a=k[Z>>2]|0;b=c+a|0;N=l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24;i[b>>0]=N;i[b+1>>0]=N>>8;i[b+2>>0]=N>>16;i[b+3>>0]=N>>24;b=a+4|0;k[Z>>2]=b;if(!Q){i[c+b>>0]=0;i[c+(a+5)>>0]=0;i[c+(a+6)>>0]=0;i[c+(a+7)>>0]=0;i[c+(a+8)>>0]=0;i[c+(a+9)>>0]=0;i[c+(a+10)>>0]=0;i[c+(a+11)>>0]=0;i[c+(a+12)>>0]=0;i[c+(a+13)>>0]=0;i[c+(a+14)>>0]=0;e=a+16|0;k[Z>>2]=e;i[c+(a+15)>>0]=0;a=e}else{i[c+b>>0]=q>>>24;i[c+(a+5)>>0]=q>>>16;i[c+(a+6)>>0]=q>>>8;i[c+(a+7)>>0]=q;i[c+(a+8)>>0]=Q>>>24;i[c+(a+9)>>0]=Q>>>16;i[c+(a+10)>>0]=Q>>>8;i[c+(a+11)>>0]=Q;N=i[e>>0]|0;N=(N&1)==0?(N&255)>>>1:k[L>>2]|0;i[c+(a+12)>>0]=N>>>24;i[c+(a+13)>>0]=N>>>16;i[c+(a+14)>>0]=N>>>8;e=a+16|0;k[Z>>2]=e;i[c+(a+15)>>0]=N;a=e}i[c+a>>0]=0;i[c+(a+1)>>0]=0;i[c+(a+2)>>0]=0;i[c+(a+3)>>0]=0;i[c+(a+4)>>0]=0;i[c+(a+5)>>0]=0;i[c+(a+6)>>0]=0;k[Z>>2]=a+8;i[c+(a+7)>>0]=0;a=k[aa>>2]|0;h=k[T>>2]|0;if((a|0)!=(h|0))do{b=k[a>>2]|0;f=0;while(1){if((k[728+(f<<2)>>2]|0)==(b|0))break;f=f+1|0;if((f|0)>=63){f=63;break}}b=k[Z>>2]|0;g=b+1|0;k[Z>>2]=g;i[c+b>>0]=f;if((f&63|0)==63){e=k[a>>2]|0;i[c+g>>0]=e>>>24;i[c+(b+2)>>0]=e>>>16;i[c+(b+3)>>0]=e>>>8;k[Z>>2]=b+5;i[c+(b+4)>>0]=e}ad(k[a+12>>2]|0,Z,c);if(k[a+4>>2]&32)ad(k[a+16>>2]|0,Z,c);a=a+32|0}while((a|0)!=(h|0));a=((k[ea>>2]|0)-(k[R>>2]|0)|0)/20|0;d:do if(a>>>0>1){e=k[ga>>2]|0;p=k[Z>>2]|0;i[c+p>>0]=e>>>24;i[c+(p+1)>>0]=e>>>16;i[c+(p+2)>>0]=e>>>8;k[Z>>2]=p+4;i[c+(p+3)>>0]=e;_c(a,Z,c);a=k[R>>2]|0;p=k[ea>>2]|0;if((a|0)==(p|0))break;n=a;e:while(1){g=n+8|0;a=k[g>>2]|0;o=n+12|0;if((a|0)==(o|0))a=0;else{b=0;do{b=((k[a+20>>2]&-2139062144|0)==0&1)+b<<16>>16;f=k[a+4>>2]|0;if(!f)while(1){f=k[a+8>>2]|0;if((k[f>>2]|0)==(a|0)){a=f;break}else a=f}else{a=f;while(1){f=k[a>>2]|0;if(!f)break;else a=f}}}while((a|0)!=(o|0));a=b}_c(a&65535,Z,c);R=k[n>>2]|0;a=k[Z>>2]|0;i[c+a>>0]=R>>>24;i[c+(a+1)>>0]=R>>>16;i[c+(a+2)>>0]=R>>>8;k[Z>>2]=a+4;i[c+(a+3)>>0]=R;a=k[g>>2]|0;if((a|0)!=(o|0)){b=a;while(1){a=b+20|0;if(!(k[a>>2]&-2139062144)){a=Cc(a)|0;a=k[(a?(k[b+52>>2]|0)+8|0:b+28|0)>>2]|0;h=k[S>>2]|0;if(!h)break e;else{f=x;g=h}f:do{while(1){if((k[g+16>>2]|0)>>>0>=a>>>0){f=g;break}g=k[g+4>>2]|0;if(!g)break f}g=k[f>>2]|0}while((g|0)!=0);if((f|0)==(x|0))break e;if(a>>>0<(k[f+16>>2]|0)>>>0)break e;while(1){f=k[h+16>>2]|0;if(a>>>0<f>>>0){f=k[h>>2]|0;if(!f){g=h;f=h;H=223;break}}else{if(f>>>0>=a>>>0){f=h;H=228;break}g=h+4|0;f=k[g>>2]|0;if(!f){f=h;H=227;break}}h=f}if((H|0)==223){k[X>>2]=f;H=229}else if((H|0)==227){k[X>>2]=f;H=229}else if((H|0)==228){H=0;k[X>>2]=f;if(!f){g=X;H=229}else a=f}if((H|0)==229){h=og(24)|0;k[h+16>>2]=a;j[h+20>>1]=0;k[h>>2]=0;k[h+4>>2]=0;k[h+8>>2]=f;k[g>>2]=h;a=k[k[$>>2]>>2]|0;if(!a)a=h;else{k[$>>2]=a;a=k[g>>2]|0}Hc(k[O>>2]|0,a);k[P>>2]=(k[P>>2]|0)+1;a=h}_c(m[a+20>>1]|0,Z,c)}a=k[b+4>>2]|0;if(!a)while(1){a=k[b+8>>2]|0;if((k[a>>2]|0)==(b|0))break;else b=a}else while(1){b=k[a>>2]|0;if(!b)break;else a=b}if((a|0)==(o|0))break;else b=a}}n=n+20|0;if((n|0)==(p|0))break d}g=k[1343]|0;k[Y>>2]=a;Eh(g,72341,Y)|0;g=0;break c}while(0);a=k[aa>>2]|0;f=k[T>>2]|0;if((a|0)==(f|0))a=k[Z>>2]|0;else{b=a;do{a=k[b+24>>2]|0;Y=k[Z>>2]|0;ki(c+Y|0,k[b+28>>2]|0,a|0)|0;a=Y+a|0;a=a>>>0>4294967292?a:a+3&-4;k[Z>>2]=a;b=b+32|0}while((b|0)!=(f|0))}ki(c+a|0,k[ba>>2]|0,Q|0)|0;b=a+Q|0;k[Z>>2]=b;a=k[d>>2]|0;if((a|0)==(b|0)){g=1;break}g=k[1343]|0;k[_>>2]=a;k[_+4>>2]=b;Eh(g,72380,_)|0;g=0}while(0);id($,k[S>>2]|0);a=k[aa>>2]|0;b=a;if(a){f=k[T>>2]|0;if((f|0)!=(a|0))k[T>>2]=f+(~((f+-32-b|0)>>>5)<<5);rg(a)}}a=k[ba>>2]|0;if(a){if((k[U>>2]|0)!=(a|0))k[U>>2]=a;rg(a)}}else{Dh(72183,38,1,k[1343]|0)|0;g=0}a=k[ca>>2]|0;if(a){if((k[V>>2]|0)!=(a|0))k[V>>2]=a;rg(a)}a=k[da>>2]|0;if(a){if((k[W>>2]|0)!=(a|0))k[W>>2]=a;rg(a)}}else g=0;else{Dh(72119,34,1,k[1343]|0)|0;g=0}while(0);f=ga+16|0;a=k[f>>2]|0;if(!a){ea=ga+4|0;ga=k[fa>>2]|0;Mc(ea,ga);r=ha;return g|0}b=k[ea>>2]|0;if((b|0)!=(a|0)){do{k[ea>>2]=b+-20;Lc(b+-12|0,k[b+-8>>2]|0);b=k[ea>>2]|0}while((b|0)!=(a|0));a=k[f>>2]|0}rg(a);ea=ga+4|0;ga=k[fa>>2]|0;Mc(ea,ga);r=ha;return g|0}function gd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0;h=a+4|0;i=k[a>>2]|0;j=i;d=((k[h>>2]|0)-j>>5)+1|0;if(d>>>0>134217727)mg(a);l=a+8|0;e=i;c=(k[l>>2]|0)-e|0;if(c>>5>>>0<67108863){c=c>>4;c=c>>>0<d>>>0?d:c;e=(k[h>>2]|0)-e|0;d=e>>5;if(!c){g=0;f=0;c=e}else m=6}else{e=(k[h>>2]|0)-e|0;c=134217727;d=e>>5;m=6}if((m|0)==6){g=c;f=og(c<<5)|0;c=e}m=f+(d<<5)|0;k[m>>2]=k[b>>2];k[m+4>>2]=k[b+4>>2];k[m+8>>2]=k[b+8>>2];k[m+12>>2]=k[b+12>>2];k[m+16>>2]=k[b+16>>2];k[m+20>>2]=k[b+20>>2];k[m+24>>2]=k[b+24>>2];k[m+28>>2]=k[b+28>>2];ki(f|0,i|0,c|0)|0;k[a>>2]=f;k[h>>2]=f+(d+1<<5);k[l>>2]=f+(g<<5);if(!j)return;rg(j);return}function hd(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;h=a+4|0;g=k[b>>2]|0;b=g;if((g|0)!=(h|0)?(f=k[d>>2]|0,e=k[g+16>>2]|0,f>>>0>=e>>>0):0){if(e>>>0>=f>>>0){k[c>>2]=b;return c|0}a=g+4|0;b=k[a>>2]|0;d=(b|0)==0;if(d){e=g;while(1){b=k[e+8>>2]|0;if((k[b>>2]|0)==(e|0))break;else e=b}}else while(1){e=k[b>>2]|0;if(!e)break;else b=e}if((b|0)!=(h|0)?f>>>0>=(k[b+16>>2]|0)>>>0:0){b=k[h>>2]|0;if(!b){k[c>>2]=h;c=h;return c|0}else a=b;while(1){b=k[a+16>>2]|0;if(f>>>0<b>>>0){b=k[a>>2]|0;if(!b){e=a;b=a;f=33;break}}else{if(b>>>0>=f>>>0){b=a;f=38;break}e=a+4|0;b=k[e>>2]|0;if(!b){b=a;f=37;break}}a=b}if((f|0)==33){k[c>>2]=b;c=e;return c|0}else if((f|0)==37){k[c>>2]=b;c=e;return c|0}else if((f|0)==38){k[c>>2]=b;return c|0}}if(d){k[c>>2]=g;c=a;return c|0}else{k[c>>2]=b;c=b;return c|0}}if((g|0)!=(k[a>>2]|0)){b=k[g>>2]|0;if(!b){e=g;while(1){b=k[e+8>>2]|0;if((k[b>>2]|0)==(e|0))e=b;else break}}else while(1){e=k[b+4>>2]|0;if(!e)break;else b=e}d=k[d>>2]|0;if((k[b+16>>2]|0)>>>0>=d>>>0){b=k[h>>2]|0;if(!b){k[c>>2]=h;c=h;return c|0}else a=b;while(1){b=k[a+16>>2]|0;if(d>>>0<b>>>0){b=k[a>>2]|0;if(!b){e=a;b=a;f=14;break}}else{if(b>>>0>=d>>>0){b=a;f=19;break}e=a+4|0;b=k[e>>2]|0;if(!b){b=a;f=18;break}}a=b}if((f|0)==14){k[c>>2]=b;c=e;return c|0}else if((f|0)==18){k[c>>2]=b;c=e;return c|0}else if((f|0)==19){k[c>>2]=b;return c|0}}}if(!(k[g>>2]|0)){k[c>>2]=g;c=g;return c|0}else{h=b;k[c>>2]=h;c=h+4|0;return c|0}return 0}function id(a,b){a=a|0;b=b|0;if(!b)return;else{id(a,k[b>>2]|0);id(a,k[b+4>>2]|0);rg(b);return}}function jd(a,b,c,d,e,f,g,h,i,j,l,m,n,o,p){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;j=j|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;do switch(l|0){case 1:{kd(a,b,c,d,e,f,g,h,i,k[j>>2]|0,m,n,o,p);return}case 2:{ld(a,b,c,d,e,f,g,h,i,k[j+4>>2]|0,m,n,o,p);return}case 3:{md(a,b,c,d,e,f,g,h,i,k[j+8>>2]|0,m,n,o,p);return}case 4:{nd(a,b,c,d,e,f,g,h,i,k[j+12>>2]|0,m,n,o,p);return}case 5:{od(a,b,c,d,e,f,g,h,i,k[j+16>>2]|0,m,n,o,p);return}case 6:{pd(a,b,c,d,e,f,g,h,i,k[j+20>>2]|0,m,n,o,p);return}case 7:{qd(a,b,c,d,e,f,g,h,i,k[j+24>>2]|0,m,n,o,p);return}case 8:{rd(a,b,c,d,e,f,g,h,i,k[j+28>>2]|0,m,n,o,p);return}case 9:{sd(a,b,c,d,e,f,g,h,i,k[j+32>>2]|0,m,n,o,p);return}default:return}while(0)}function kd(a,b,c,d,e,f,g,h,i,j,m,n,o,q){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;j=j|0;m=m|0;n=n|0;o=o|0;q=q|0;var s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;W=r;r=r+80|0;P=W+68|0;R=W+64|0;N=W+60|0;T=W+40|0;Q=W+56|0;S=W+52|0;O=W+48|0;U=W+32|0;V=W;if(a>>>0>2&b>>>0>2){L=b+-3|0;M=c+(L&d)|0;M=j+((ha(l[M>>0]|l[M+1>>0]<<8|l[M+2>>0]<<16|l[M+3>>0]<<24,506832829)|0)>>>16<<2)|0;k[M>>2]=L;M=b+-2|0;L=c+(M&d)|0;L=j+((ha(l[L>>0]|l[L+1>>0]<<8|l[L+2>>0]<<16|l[L+3>>0]<<24,506832829)|0)>>>16<<2)|0;k[L>>2]=M;L=b+-1|0;M=c+(L&d)|0;M=j+((ha(l[M>>0]|l[M+1>>0]<<8|l[M+2>>0]<<16|l[M+3>>0]<<24,506832829)|0)>>>16<<2)|0;k[M>>2]=L}s=k[n>>2]|0;t=d&b;D=b-t|0;E=t+a|0;F=(i|0)<9?64:512;if((t+3|0)>>>0>=E>>>0){d=o;c=a;g=s;c=g+c|0;k[n>>2]=c;n=o;n=d-n|0;n=n>>5;o=k[q>>2]|0;n=o+n|0;k[q>>2]=n;r=W;return}G=F<<2;H=E+-4|0;I=E+-3|0;J=(i|0)<4;K=m+4|0;L=m+8|0;M=m+12|0;C=(i|0)>1;i=o;B=F+t|0;a:while(1){v=B+G|0;while(1){b=t+D|0;k[P>>2]=0;k[R>>2]=0;k[N>>2]=0;p[T>>3]=h;if(Dd(j,c,d,e,f,5.4,m,b,a,b>>>0>g>>>0?g:b,P,R,N,T)|0){b=t;break}s=s+1|0;A=c+t|0;A=j+((ha(l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24,506832829)|0)>>>16<<2)|0;k[A>>2]=b;b=t+1|0;do if(b>>>0>B>>>0)if(b>>>0>v>>>0){a=t+17|0;a=H>>>0<a>>>0?H:a;if(b>>>0>=a>>>0)break;do{A=c+b|0;A=j+((ha(l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24,506832829)|0)>>>16<<2)|0;k[A>>2]=b+D;s=s+4|0;b=b+4|0}while(b>>>0<a>>>0)}else{a=t+9|0;a=I>>>0<a>>>0?I:a;if(b>>>0>=a>>>0)break;do{A=c+b|0;A=j+((ha(l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24,506832829)|0)>>>16<<2)|0;k[A>>2]=b+D;s=s+2|0;b=b+2|0}while(b>>>0<a>>>0)}while(0);a=E-b|0;if((b+3|0)>>>0<E>>>0)t=b;else{b=36;break a}}b:do if(J){t=0;do{a=a+-1|0;z=(k[P>>2]|0)+-1|0;k[Q>>2]=(a|0)<(z|0)?a:z;k[S>>2]=0;k[O>>2]=0;p[U>>3]=h;z=b+D|0;B=z+1|0;A=c+b|0;A=j+((ha(l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24,506832829)|0)>>>16<<2)|0;k[A>>2]=z;if(!(Dd(j,c,d,e,f,5.4,m,B,a,B>>>0>g>>>0?g:B,Q,S,O,U)|0))break b;u=+p[U>>3];if(!(u>=+p[T>>3]+7.0))break b;b=b+1|0;s=s+1|0;k[P>>2]=k[Q>>2];k[R>>2]=k[S>>2];k[N>>2]=k[O>>2];p[T>>3]=u;t=t+1|0}while((t|0)<4)}else{t=0;do{a=a+-1|0;k[Q>>2]=0;k[S>>2]=0;k[O>>2]=0;p[U>>3]=h;z=b+D|0;B=z+1|0;A=c+b|0;A=j+((ha(l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24,506832829)|0)>>>16<<2)|0;k[A>>2]=z;if(!(Dd(j,c,d,e,f,5.4,m,B,a,B>>>0>g>>>0?g:B,Q,S,O,U)|0))break b;u=+p[U>>3];if(!(u>=+p[T>>3]+7.0))break b;b=b+1|0;s=s+1|0;k[P>>2]=k[Q>>2];k[R>>2]=k[S>>2];k[N>>2]=k[O>>2];p[T>>3]=u;t=t+1|0}while((t|0)<4)}while(0);A=k[P>>2]|0;B=b+F+(A<<1)|0;z=b+D|0;w=k[N>>2]|0;a=w+16|0;do if(w>>>0<=(z>>>0>g>>>0?g:z)>>>0){x=k[m>>2]|0;if((w|0)==(x|0))a=1;else{y=k[K>>2]|0;t=k[L>>2]|0;if((w|0)!=(y|0))if((w|0)!=(t|0))if((w|0)!=(k[M>>2]|0)){c:do if(C&(w|0)>5){v=4;while(1){if((w|0)==((k[1044+(v<<2)>>2]|0)+(k[m+(k[980+(v<<2)>>2]<<2)>>2]|0)|0)?(w|0)>=(k[1812+(v<<2)>>2]|0):0){a=v;break}v=v+1|0;if((v|0)>=16)break c}a=a+1|0}while(0);if((a|0)<=1)break}else a=4;else{t=w;a=3}else a=2;k[M>>2]=t;k[L>>2]=y;k[K>>2]=x;k[m>>2]=w}}while(0);ud(V,s,A,k[R>>2]|0,a);v=i+32|0;k[i>>2]=k[V>>2];k[i+4>>2]=k[V+4>>2];k[i+8>>2]=k[V+8>>2];k[i+12>>2]=k[V+12>>2];k[i+16>>2]=k[V+16>>2];k[i+20>>2]=k[V+20>>2];k[i+24>>2]=k[V+24>>2];if((A|0)>1){s=1;do{y=c+(s+b)|0;y=j+((ha(l[y>>0]|l[y+1>>0]<<8|l[y+2>>0]<<16|l[y+3>>0]<<24,506832829)|0)>>>16<<2)|0;k[y>>2]=s+z;s=s+1|0}while((s|0)<(A|0))}t=A+b|0;a=E-t|0;if((t+3|0)>>>0>=E>>>0){i=v;s=0;b=36;break}else{i=v;s=0}}if((b|0)==36){d=s+a|0;k[n>>2]=d;d=i;n=o;n=d-n|0;n=n>>5;o=k[q>>2]|0;n=o+n|0;k[q>>2]=n;r=W;return}}function ld(a,b,c,d,e,f,g,h,i,j,m,n,o,q){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;j=j|0;m=m|0;n=n|0;o=o|0;q=q|0;var s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;W=r;r=r+80|0;P=W+68|0;R=W+64|0;N=W+60|0;T=W+40|0;Q=W+56|0;S=W+52|0;O=W+48|0;U=W+32|0;V=W;if(a>>>0>2&b>>>0>2){L=b+-3|0;M=c+(L&d)|0;M=j+(((ha(l[M>>0]|l[M+1>>0]<<8|l[M+2>>0]<<16|l[M+3>>0]<<24,506832829)|0)>>>15)+(L>>>3&3)<<2)|0;k[M>>2]=L;M=b+-2|0;L=c+(M&d)|0;L=j+(((ha(l[L>>0]|l[L+1>>0]<<8|l[L+2>>0]<<16|l[L+3>>0]<<24,506832829)|0)>>>15)+(M>>>3&3)<<2)|0;k[L>>2]=M;L=b+-1|0;M=c+(L&d)|0;M=j+(((ha(l[M>>0]|l[M+1>>0]<<8|l[M+2>>0]<<16|l[M+3>>0]<<24,506832829)|0)>>>15)+(L>>>3&3)<<2)|0;k[M>>2]=L}s=k[n>>2]|0;t=d&b;D=b-t|0;E=t+a|0;F=(i|0)<9?64:512;if((t+3|0)>>>0>=E>>>0){d=o;c=a;g=s;c=g+c|0;k[n>>2]=c;n=o;n=d-n|0;n=n>>5;o=k[q>>2]|0;n=o+n|0;k[q>>2]=n;r=W;return}G=F<<2;H=E+-4|0;I=E+-3|0;J=(i|0)<4;K=m+4|0;L=m+8|0;M=m+12|0;C=(i|0)>1;i=o;B=F+t|0;a:while(1){v=B+G|0;while(1){b=t+D|0;k[P>>2]=0;k[R>>2]=0;k[N>>2]=0;p[T>>3]=h;if(Cd(j,c,d,e,f,5.4,m,b,a,b>>>0>g>>>0?g:b,P,R,N,T)|0){v=0;break}s=s+1|0;A=c+t|0;A=j+(((ha(l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24,506832829)|0)>>>15)+(b>>>3&3)<<2)|0;k[A>>2]=b;b=t+1|0;do if(b>>>0>B>>>0)if(b>>>0>v>>>0){a=t+17|0;a=H>>>0<a>>>0?H:a;if(b>>>0>=a>>>0)break;do{A=c+b|0;z=b+D|0;A=j+(((ha(l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24,506832829)|0)>>>15)+(z>>>3&3)<<2)|0;k[A>>2]=z;s=s+4|0;b=b+4|0}while(b>>>0<a>>>0)}else{a=t+9|0;a=I>>>0<a>>>0?I:a;if(b>>>0>=a>>>0)break;do{A=c+b|0;z=b+D|0;A=j+(((ha(l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24,506832829)|0)>>>15)+(z>>>3&3)<<2)|0;k[A>>2]=z;s=s+2|0;b=b+2|0}while(b>>>0<a>>>0)}while(0);a=E-b|0;if((b+3|0)>>>0<E>>>0)t=b;else{b=34;break a}}while(1){a=a+-1|0;if(J){b=(k[P>>2]|0)+-1|0;b=(a|0)<(b|0)?a:b}else b=0;k[Q>>2]=b;k[S>>2]=0;k[O>>2]=0;p[U>>3]=h;z=t+D|0;B=z+1|0;A=c+t|0;A=j+(((ha(l[A>>0]|l[A+1>>0]<<8|l[A+2>>0]<<16|l[A+3>>0]<<24,506832829)|0)>>>15)+(z>>>3&3)<<2)|0;k[A>>2]=z;if(!(Cd(j,c,d,e,f,5.4,m,B,a,B>>>0>g>>>0?g:B,Q,S,O,U)|0)){b=t;break}u=+p[U>>3];if(!(u>=+p[T>>3]+7.0)){b=t;break}b=t+1|0;s=s+1|0;k[P>>2]=k[Q>>2];k[R>>2]=k[S>>2];k[N>>2]=k[O>>2];p[T>>3]=u;v=v+1|0;if((v|0)>=4)break;else t=b}z=k[P>>2]|0;B=b+F+(z<<1)|0;A=b+D|0;w=k[N>>2]|0;a=w+16|0;do if(w>>>0<=(A>>>0>g>>>0?g:A)>>>0){x=k[m>>2]|0;if((w|0)==(x|0))a=1;else{y=k[K>>2]|0;t=k[L>>2]|0;if((w|0)!=(y|0))if((w|0)!=(t|0))if((w|0)!=(k[M>>2]|0)){b:do if(C&(w|0)>5){v=4;while(1){if((w|0)==((k[1044+(v<<2)>>2]|0)+(k[m+(k[980+(v<<2)>>2]<<2)>>2]|0)|0)?(w|0)>=(k[1748+(v<<2)>>2]|0):0){a=v;break}v=v+1|0;if((v|0)>=16)break b}a=a+1|0}while(0);if((a|0)<=1)break}else a=4;else{t=w;a=3}else a=2;k[M>>2]=t;k[L>>2]=y;k[K>>2]=x;k[m>>2]=w}}while(0);ud(V,s,z,k[R>>2]|0,a);v=i+32|0;k[i>>2]=k[V>>2];k[i+4>>2]=k[V+4>>2];k[i+8>>2]=k[V+8>>2];k[i+12>>2]=k[V+12>>2];k[i+16>>2]=k[V+16>>2];k[i+20>>2]=k[V+20>>2];k[i+24>>2]=k[V+24>>2];if((z|0)>1){s=1;do{y=c+(s+b)|0;x=s+A|0;y=j+(((ha(l[y>>0]|l[y+1>>0]<<8|l[y+2>>0]<<16|l[y+3>>0]<<24,506832829)|0)>>>15)+(x>>>3&3)<<2)|0;k[y>>2]=x;s=s+1|0}while((s|0)<(z|0))}t=z+b|0;a=E-t|0;if((t+3|0)>>>0>=E>>>0){i=v;s=0;b=34;break}else{i=v;s=0}}if((b|0)==34){d=s+a|0;k[n>>2]=d;d=i;n=o;n=d-n|0;n=n>>5;o=k[q>>2]|0;n=o+n|0;k[q>>2]=n;r=W;return}}function md(a,b,c,d,e,f,g,h,i,m,n,o,q,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;m=m|0;n=n|0;o=o|0;q=q|0;s=s|0;var t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;X=r;r=r+80|0;Q=X+68|0;S=X+64|0;O=X+60|0;U=X+40|0;R=X+56|0;T=X+52|0;P=X+48|0;V=X+32|0;W=X;if(a>>>0>2&b>>>0>2){L=b+-3|0;K=c+(L&d)|0;K=(ha(l[K>>0]|l[K+1>>0]<<8|l[K+2>>0]<<16|l[K+3>>0]<<24,506832829)|0)>>>18;M=m+(K<<1)|0;N=j[M>>1]|0;k[m+32768+(K<<6)+((N&15)<<2)>>2]=L;j[M>>1]=N+1<<16>>16;M=b+-2|0;N=c+(M&d)|0;N=(ha(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24,506832829)|0)>>>18;K=m+(N<<1)|0;L=j[K>>1]|0;k[m+32768+(N<<6)+((L&15)<<2)>>2]=M;j[K>>1]=L+1<<16>>16;K=b+-1|0;L=c+(K&d)|0;L=(ha(l[L>>0]|l[L+1>>0]<<8|l[L+2>>0]<<16|l[L+3>>0]<<24,506832829)|0)>>>18;N=m+(L<<1)|0;M=j[N>>1]|0;k[m+32768+(L<<6)+((M&15)<<2)>>2]=K;j[N>>1]=M+1<<16>>16}t=k[o>>2]|0;u=d&b;E=b-u|0;F=u+a|0;G=(i|0)<9?64:512;if((u+3|0)>>>0>=F>>>0){d=q;c=a;g=t;c=g+c|0;k[o>>2]=c;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}H=G<<2;I=F+-4|0;J=F+-3|0;K=(i|0)<4;L=n+4|0;M=n+8|0;N=n+12|0;D=(i|0)>1;i=q;C=G+u|0;a:while(1){w=C+H|0;while(1){b=u+E|0;k[Q>>2]=0;k[S>>2]=0;k[O>>2]=0;p[U>>3]=h;if(Bd(m,c,d,e,f,5.4,n,b,a,b>>>0>g>>>0?g:b,Q,S,O,U)|0){w=0;break}t=t+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>18;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+32768+(z<<6)+((A&15)<<2)>>2]=b;j[B>>1]=A+1<<16>>16;b=u+1|0;do if(b>>>0>C>>>0)if(b>>>0>w>>>0){a=u+17|0;a=I>>>0<a>>>0?I:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>18;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+32768+(z<<6)+((A&15)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+4|0;b=b+4|0}while(b>>>0<a>>>0)}else{a=u+9|0;a=J>>>0<a>>>0?J:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>18;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+32768+(z<<6)+((A&15)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+2|0;b=b+2|0}while(b>>>0<a>>>0)}while(0);a=F-b|0;if((b+3|0)>>>0<F>>>0)u=b;else{b=34;break a}}while(1){a=a+-1|0;if(K){b=(k[Q>>2]|0)+-1|0;b=(a|0)<(b|0)?a:b}else b=0;k[R>>2]=b;k[T>>2]=0;k[P>>2]=0;p[V>>3]=h;y=u+E|0;C=y+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>18;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+32768+(z<<6)+((A&15)<<2)>>2]=y;j[B>>1]=A+1<<16>>16;if(!(Bd(m,c,d,e,f,5.4,n,C,a,C>>>0>g>>>0?g:C,R,T,P,V)|0)){b=u;break}v=+p[V>>3];if(!(v>=+p[U>>3]+7.0)){b=u;break}b=u+1|0;t=t+1|0;k[Q>>2]=k[R>>2];k[S>>2]=k[T>>2];k[O>>2]=k[P>>2];p[U>>3]=v;w=w+1|0;if((w|0)>=4)break;else u=b}A=k[Q>>2]|0;C=b+G+(A<<1)|0;B=b+E|0;x=k[O>>2]|0;a=x+16|0;do if(x>>>0<=(B>>>0>g>>>0?g:B)>>>0){y=k[n>>2]|0;if((x|0)==(y|0))a=1;else{z=k[L>>2]|0;u=k[M>>2]|0;if((x|0)!=(z|0))if((x|0)!=(u|0))if((x|0)!=(k[N>>2]|0)){b:do if(D&(x|0)>5){w=4;while(1){if((x|0)==((k[1044+(w<<2)>>2]|0)+(k[n+(k[980+(w<<2)>>2]<<2)>>2]|0)|0)?(x|0)>=(k[1684+(w<<2)>>2]|0):0){a=w;break}w=w+1|0;if((w|0)>=16)break b}a=a+1|0}while(0);if((a|0)<=1)break}else a=4;else{u=x;a=3}else a=2;k[N>>2]=u;k[M>>2]=z;k[L>>2]=y;k[n>>2]=x}}while(0);ud(W,t,A,k[S>>2]|0,a);w=i+32|0;k[i>>2]=k[W>>2];k[i+4>>2]=k[W+4>>2];k[i+8>>2]=k[W+8>>2];k[i+12>>2]=k[W+12>>2];k[i+16>>2]=k[W+16>>2];k[i+20>>2]=k[W+20>>2];k[i+24>>2]=k[W+24>>2];if((A|0)>1){t=1;do{x=c+(t+b)|0;x=(ha(l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24,506832829)|0)>>>18;z=m+(x<<1)|0;y=j[z>>1]|0;k[m+32768+(x<<6)+((y&15)<<2)>>2]=t+B;j[z>>1]=y+1<<16>>16;t=t+1|0}while((t|0)<(A|0))}u=A+b|0;a=F-u|0;if((u+3|0)>>>0>=F>>>0){i=w;t=0;b=34;break}else{i=w;t=0}}if((b|0)==34){d=t+a|0;k[o>>2]=d;d=i;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}}function nd(a,b,c,d,e,f,g,h,i,m,n,o,q,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;m=m|0;n=n|0;o=o|0;q=q|0;s=s|0;var t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;X=r;r=r+80|0;Q=X+68|0;S=X+64|0;O=X+60|0;U=X+40|0;R=X+56|0;T=X+52|0;P=X+48|0;V=X+32|0;W=X;if(a>>>0>2&b>>>0>2){L=b+-3|0;K=c+(L&d)|0;K=(ha(l[K>>0]|l[K+1>>0]<<8|l[K+2>>0]<<16|l[K+3>>0]<<24,506832829)|0)>>>18;M=m+(K<<1)|0;N=j[M>>1]|0;k[m+32768+(K<<7)+((N&31)<<2)>>2]=L;j[M>>1]=N+1<<16>>16;M=b+-2|0;N=c+(M&d)|0;N=(ha(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24,506832829)|0)>>>18;K=m+(N<<1)|0;L=j[K>>1]|0;k[m+32768+(N<<7)+((L&31)<<2)>>2]=M;j[K>>1]=L+1<<16>>16;K=b+-1|0;L=c+(K&d)|0;L=(ha(l[L>>0]|l[L+1>>0]<<8|l[L+2>>0]<<16|l[L+3>>0]<<24,506832829)|0)>>>18;N=m+(L<<1)|0;M=j[N>>1]|0;k[m+32768+(L<<7)+((M&31)<<2)>>2]=K;j[N>>1]=M+1<<16>>16}t=k[o>>2]|0;u=d&b;E=b-u|0;F=u+a|0;G=(i|0)<9?64:512;if((u+3|0)>>>0>=F>>>0){d=q;c=a;g=t;c=g+c|0;k[o>>2]=c;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}H=G<<2;I=F+-4|0;J=F+-3|0;K=(i|0)<4;L=n+4|0;M=n+8|0;N=n+12|0;D=(i|0)>1;i=q;C=G+u|0;a:while(1){w=C+H|0;while(1){b=u+E|0;k[Q>>2]=0;k[S>>2]=0;k[O>>2]=0;p[U>>3]=h;if(Ad(m,c,d,e,f,5.4,n,b,a,b>>>0>g>>>0?g:b,Q,S,O,U)|0){w=0;break}t=t+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>18;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+32768+(z<<7)+((A&31)<<2)>>2]=b;j[B>>1]=A+1<<16>>16;b=u+1|0;do if(b>>>0>C>>>0)if(b>>>0>w>>>0){a=u+17|0;a=I>>>0<a>>>0?I:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>18;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+32768+(z<<7)+((A&31)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+4|0;b=b+4|0}while(b>>>0<a>>>0)}else{a=u+9|0;a=J>>>0<a>>>0?J:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>18;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+32768+(z<<7)+((A&31)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+2|0;b=b+2|0}while(b>>>0<a>>>0)}while(0);a=F-b|0;if((b+3|0)>>>0<F>>>0)u=b;else{b=34;break a}}while(1){a=a+-1|0;if(K){b=(k[Q>>2]|0)+-1|0;b=(a|0)<(b|0)?a:b}else b=0;k[R>>2]=b;k[T>>2]=0;k[P>>2]=0;p[V>>3]=h;y=u+E|0;C=y+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>18;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+32768+(z<<7)+((A&31)<<2)>>2]=y;j[B>>1]=A+1<<16>>16;if(!(Ad(m,c,d,e,f,5.4,n,C,a,C>>>0>g>>>0?g:C,R,T,P,V)|0)){b=u;break}v=+p[V>>3];if(!(v>=+p[U>>3]+7.0)){b=u;break}b=u+1|0;t=t+1|0;k[Q>>2]=k[R>>2];k[S>>2]=k[T>>2];k[O>>2]=k[P>>2];p[U>>3]=v;w=w+1|0;if((w|0)>=4)break;else u=b}A=k[Q>>2]|0;C=b+G+(A<<1)|0;B=b+E|0;x=k[O>>2]|0;a=x+16|0;do if(x>>>0<=(B>>>0>g>>>0?g:B)>>>0){y=k[n>>2]|0;if((x|0)==(y|0))a=1;else{z=k[L>>2]|0;u=k[M>>2]|0;if((x|0)!=(z|0))if((x|0)!=(u|0))if((x|0)!=(k[N>>2]|0)){b:do if(D&(x|0)>5){w=4;while(1){if((x|0)==((k[1044+(w<<2)>>2]|0)+(k[n+(k[980+(w<<2)>>2]<<2)>>2]|0)|0)?(x|0)>=(k[1620+(w<<2)>>2]|0):0){a=w;break}w=w+1|0;if((w|0)>=16)break b}a=a+1|0}while(0);if((a|0)<=1)break}else a=4;else{u=x;a=3}else a=2;k[N>>2]=u;k[M>>2]=z;k[L>>2]=y;k[n>>2]=x}}while(0);ud(W,t,A,k[S>>2]|0,a);w=i+32|0;k[i>>2]=k[W>>2];k[i+4>>2]=k[W+4>>2];k[i+8>>2]=k[W+8>>2];k[i+12>>2]=k[W+12>>2];k[i+16>>2]=k[W+16>>2];k[i+20>>2]=k[W+20>>2];k[i+24>>2]=k[W+24>>2];if((A|0)>1){t=1;do{x=c+(t+b)|0;x=(ha(l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24,506832829)|0)>>>18;z=m+(x<<1)|0;y=j[z>>1]|0;k[m+32768+(x<<7)+((y&31)<<2)>>2]=t+B;j[z>>1]=y+1<<16>>16;t=t+1|0}while((t|0)<(A|0))}u=A+b|0;a=F-u|0;if((u+3|0)>>>0>=F>>>0){i=w;t=0;b=34;break}else{i=w;t=0}}if((b|0)==34){d=t+a|0;k[o>>2]=d;d=i;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}}function od(a,b,c,d,e,f,g,h,i,m,n,o,q,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;i=i|0;m=m|0;n=n|0;o=o|0;q=q|0;s=s|0;var t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;X=r;r=r+80|0;Q=X+68|0;S=X+64|0;O=X+60|0;U=X+40|0;R=X+56|0;T=X+52|0;P=X+48|0;V=X+32|0;W=X;if(a>>>0>2&b>>>0>2){L=b+-3|0;K=c+(L&d)|0;K=(ha(l[K>>0]|l[K+1>>0]<<8|l[K+2>>0]<<16|l[K+3>>0]<<24,506832829)|0)>>>17;M=m+(K<<1)|0;N=j[M>>1]|0;k[m+65536+(K<<8)+((N&63)<<2)>>2]=L;j[M>>1]=N+1<<16>>16;M=b+-2|0;N=c+(M&d)|0;N=(ha(l[N>>0]|l[N+1>>0]<<8|l[N+2>>0]<<16|l[N+3>>0]<<24,506832829)|0)>>>17;K=m+(N<<1)|0;L=j[K>>1]|0;k[m+65536+(N<<8)+((L&63)<<2)>>2]=M;j[K>>1]=L+1<<16>>16;K=b+-1|0;L=c+(K&d)|0;L=(ha(l[L>>0]|l[L+1>>0]<<8|l[L+2>>0]<<16|l[L+3>>0]<<24,506832829)|0)>>>17;N=m+(L<<1)|0;M=j[N>>1]|0;k[m+65536+(L<<8)+((M&63)<<2)>>2]=K;j[N>>1]=M+1<<16>>16}t=k[o>>2]|0;u=d&b;E=b-u|0;F=u+a|0;G=(i|0)<9?64:512;if((u+3|0)>>>0>=F>>>0){d=q;c=a;g=t;c=g+c|0;k[o>>2]=c;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}H=G<<2;I=F+-4|0;J=F+-3|0;K=(i|0)<4;L=n+4|0;M=n+8|0;N=n+12|0;D=(i|0)>1;i=q;C=G+u|0;a:while(1){w=C+H|0;while(1){b=u+E|0;k[Q>>2]=0;k[S>>2]=0;k[O>>2]=0;p[U>>3]=h;if(zd(m,c,d,e,f,5.4,n,b,a,b>>>0>g>>>0?g:b,Q,S,O,U)|0){w=0;break}t=t+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<8)+((A&63)<<2)>>2]=b;j[B>>1]=A+1<<16>>16;b=u+1|0;do if(b>>>0>C>>>0)if(b>>>0>w>>>0){a=u+17|0;a=I>>>0<a>>>0?I:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<8)+((A&63)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+4|0;b=b+4|0}while(b>>>0<a>>>0)}else{a=u+9|0;a=J>>>0<a>>>0?J:a;if(b>>>0>=a>>>0)break;do{z=c+b|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<8)+((A&63)<<2)>>2]=b+E;j[B>>1]=A+1<<16>>16;t=t+2|0;b=b+2|0}while(b>>>0<a>>>0)}while(0);a=F-b|0;if((b+3|0)>>>0<F>>>0)u=b;else{b=34;break a}}while(1){a=a+-1|0;if(K){b=(k[Q>>2]|0)+-1|0;b=(a|0)<(b|0)?a:b}else b=0;k[R>>2]=b;k[T>>2]=0;k[P>>2]=0;p[V>>3]=h;y=u+E|0;C=y+1|0;z=c+u|0;z=(ha(l[z>>0]|l[z+1>>0]<<8|l[z+2>>0]<<16|l[z+3>>0]<<24,506832829)|0)>>>17;B=m+(z<<1)|0;A=j[B>>1]|0;k[m+65536+(z<<8)+((A&63)<<2)>>2]=y;j[B>>1]=A+1<<16>>16;if(!(zd(m,c,d,e,f,5.4,n,C,a,C>>>0>g>>>0?g:C,R,T,P,V)|0)){b=u;break}v=+p[V>>3];if(!(v>=+p[U>>3]+7.0)){b=u;break}b=u+1|0;t=t+1|0;k[Q>>2]=k[R>>2];k[S>>2]=k[T>>2];k[O>>2]=k[P>>2];p[U>>3]=v;w=w+1|0;if((w|0)>=4)break;else u=b}A=k[Q>>2]|0;C=b+G+(A<<1)|0;B=b+E|0;x=k[O>>2]|0;a=x+16|0;do if(x>>>0<=(B>>>0>g>>>0?g:B)>>>0){y=k[n>>2]|0;if((x|0)==(y|0))a=1;else{z=k[L>>2]|0;u=k[M>>2]|0;if((x|0)!=(z|0))if((x|0)!=(u|0))if((x|0)!=(k[N>>2]|0)){b:do if(D&(x|0)>5){w=4;while(1){if((x|0)==((k[1044+(w<<2)>>2]|0)+(k[n+(k[980+(w<<2)>>2]<<2)>>2]|0)|0)?(x|0)>=(k[1556+(w<<2)>>2]|0):0){a=w;break}w=w+1|0;if((w|0)>=16)break b}a=a+1|0}while(0);if((a|0)<=1)break}else a=4;else{u=x;a=3}else a=2;k[N>>2]=u;k[M>>2]=z;k[L>>2]=y;k[n>>2]=x}}while(0);ud(W,t,A,k[S>>2]|0,a);w=i+32|0;k[i>>2]=k[W>>2];k[i+4>>2]=k[W+4>>2];k[i+8>>2]=k[W+8>>2];k[i+12>>2]=k[W+12>>2];k[i+16>>2]=k[W+16>>2];k[i+20>>2]=k[W+20>>2];k[i+24>>2]=k[W+24>>2];if((A|0)>1){t=1;do{x=c+(t+b)|0;x=(ha(l[x>>0]|l[x+1>>0]<<8|l[x+2>>0]<<16|l[x+3>>0]<<24,506832829)|0)>>>17;z=m+(x<<1)|0;y=j[z>>1]|0;k[m+65536+(x<<8)+((y&63)<<2)>>2]=t+B;j[z>>1]=y+1<<16>>16;t=t+1|0}while((t|0)<(A|0))}u=A+b|0;a=F-u|0;if((u+3|0)>>>0>=F>>>0){i=w;t=0;b=34;break}else{i=w;t=0}}if((b|0)==34){d=t+a|0;k[o>>2]=d;d=i;o=q;o=d-o|0;o=o>>5;q=k[s>>2]|0;o=q+o|0;k[s>>2]=o;r=X;return}}
function Kf(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;if((f|0)==0|(e|0)==0)return;a:while(1){i=e;m=a;while(1){l=b;a=m;while(1){e=a;if(Zb[k[d>>2]&1](l,e)|0){z=i;break}i=i+-1|0;if(!i){i=69;break a}else a=e+8|0}if(!((f|0)>(h|0)&(z|0)>(h|0))){j=z;i=8;break a}if((z|0)<(f|0)){j=(f|0)/2|0;o=l+(j<<3)|0;n=e;i=b-a>>3;b:while(1){while(1){if(!i){i=n;break b}m=(i|0)/2|0;if(Zb[k[d>>2]&1](o,n+(m<<3)|0)|0)i=m;else break}n=n+(m+1<<3)|0;i=i+-1-m|0}n=i;x=o;y=i-a>>3}else{if((z|0)==1){e=a;i=44;break a}o=(z|0)/2|0;n=e+(o<<3)|0;m=l;i=c-b>>3;c:while(1){while(1){if(!i){i=m;break c}j=(i|0)/2|0;if(Zb[k[d>>2]&1](m+(j<<3)|0,n)|0)break;else i=j}m=m+(j+1<<3)|0;i=i+-1-j|0}x=i;y=o;j=i-b>>3}o=b;b=x;w=n;i=z-y|0;v=f;f=f-j|0;m=o;d:do if((n|0)!=(l|0))if((l|0)==(x|0))l=n;else{if((n+8|0)==(l|0)){t=n;s=k[t>>2]|0;t=k[t+4>>2]|0;l=b-o|0;li(n|0,m|0,l|0)|0;l=n+(l>>3<<3)|0;u=l;k[u>>2]=s;k[u+4>>2]=t;break}if((l+8|0)==(x|0)){u=x+-8|0;t=u;s=k[t>>2]|0;t=k[t+4>>2]|0;u=u-w|0;l=x+(0-(u>>3)<<3)|0;li(l|0,n|0,u|0)|0;u=n;k[u>>2]=s;k[u+4>>2]=t;break}u=o-w>>3;t=b-o>>3;if((u|0)==(t|0)){m=n;o=l;while(1){t=m;s=k[t>>2]|0;t=k[t+4>>2]|0;q=o;r=k[q+4>>2]|0;u=m;k[u>>2]=k[q>>2];k[u+4>>2]=r;u=o;k[u>>2]=s;k[u+4>>2]=t;m=m+8|0;if((m|0)==(l|0))break d;else o=o+8|0}}else{l=u;m=t}while(1){l=(l|0)%(m|0)|0;if(!l){l=m;break}else{s=m;m=l;l=s}}if(l){s=u+-1|0;p=n+(l<<3)|0;do{l=p;p=p+-8|0;r=p;q=k[r>>2]|0;r=k[r+4>>2]|0;l=l+(s<<3)|0;o=p;while(1){B=l;A=k[B+4>>2]|0;m=o;o=l;k[m>>2]=k[B>>2];k[m+4>>2]=A;m=b-o>>3;m=(u|0)<(m|0)?l+(u<<3)|0:n+(u-m<<3)|0;if((m|0)==(p|0))break;else l=m}B=l;k[B>>2]=q;k[B+4>>2]=r}while((p|0)!=(n|0))}l=n+(t<<3)|0}else l=x;while(0);m=l;if((y+j|0)>=(i+f|0)){n=x;b=w;e=y;break}Kf(e,n,l,d,y,j,g,h);if((v|0)==(j|0)|(z|0)==(y|0)){i=69;break a}}Kf(l,n,c,d,i,f,g,h);if((j|0)==0|(e|0)==0){i=69;break}else{f=j;c=m}}if((i|0)==8){m=c;if((j|0)<=(f|0)){e:do if((e|0)!=(l|0)){f=(l+-8-a|0)>>>3;c=e;i=g;while(1){h=c;A=k[h+4>>2]|0;B=i;k[B>>2]=k[h>>2];k[B+4>>2]=A;c=c+8|0;if((c|0)==(l|0))break;else i=i+8|0}j=g+(f+1<<3)|0;if((j|0)!=(g|0)){f=b;i=b;c=l;a=g;b=g;while(1){if((c|0)==(m|0))break;if(Zb[k[d>>2]&1](c,a)|0){B=f;i=k[B+4>>2]|0;f=e;k[f>>2]=k[B>>2];k[f+4>>2]=i;c=c+8|0;f=c;i=c}else{A=b;B=k[A+4>>2]|0;b=e;k[b>>2]=k[A>>2];k[b+4>>2]=B;b=a+8|0}e=e+8|0;a=b;if((a|0)==(j|0)){b=i;break e}}li(e|0,b|0,j-b|0)|0;return}}else e=l;while(0);if((b|0)==(m|0))return;while(1){g=b;A=k[g+4>>2]|0;B=e;k[B>>2]=k[g>>2];k[B+4>>2]=A;b=b+8|0;if((b|0)==(m|0))break;else e=e+8|0}return}if((l|0)==(m|0))f=g;else{i=(m+-8-b|0)>>>3;f=l;a=g;while(1){h=f;A=k[h+4>>2]|0;B=a;k[B>>2]=k[h>>2];k[B+4>>2]=A;f=f+8|0;if((f|0)==(m|0))break;else a=a+8|0}f=g+(i+1<<3)|0}f:do if((l|0)==(e|0))e=f;else{while(1){i=f;if((i|0)==(g|0))break;i=i+-8|0;c=c+-8|0;if(Zb[k[d>>2]&1](i,l+-8|0)|0){b=b+-8|0;h=b;A=k[h+4>>2]|0;B=c;k[B>>2]=k[h>>2];k[B+4>>2]=A}else{A=i;B=k[A+4>>2]|0;f=c;k[f>>2]=k[A>>2];k[f+4>>2]=B;f=i}l=b;if((l|0)==(e|0)){e=f;break f}}f=b;if((f|0)==(e|0))return;while(1){c=c+-8|0;g=f+-8|0;A=k[g+4>>2]|0;B=c;k[B>>2]=k[g>>2];k[B+4>>2]=A;b=b+-8|0;if((b|0)==(e|0))break;else f=b}return}while(0);b=e;if((b|0)==(g|0))return;while(1){c=c+-8|0;d=b+-8|0;A=k[d+4>>2]|0;B=c;k[B>>2]=k[d>>2];k[B+4>>2]=A;e=e+-8|0;if((e|0)==(g|0))break;else b=e}return}else if((i|0)==44){d=e;A=d;g=k[A>>2]|0;A=k[A+4>>2]|0;B=b;z=B;h=k[z+4>>2]|0;k[d>>2]=k[z>>2];k[d+4>>2]=h;k[B>>2]=g;k[B+4>>2]=A;return}else if((i|0)==69)return}function Lf(a,b,c,d,e,f,g,h,n,o,p,q,r,s){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;var t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;J=k[c+16>>2]|0;if((J|0)==(k[c+20>>2]|0))v=0;else v=k[J>>2]|0;L=k[d+16>>2]|0;if((L|0)==(k[d+20>>2]|0))x=0;else x=k[L>>2]|0;K=k[e+16>>2]|0;if((K|0)==(k[e+20>>2]|0))t=0;else t=k[K>>2]|0;if(!b)return;I=d+4|0;H=e+4|0;G=c+4|0;u=0;w=0;y=0;A=0;z=0;e=x;d=0;F=0;c=g;while(1){if(!e){y=d+1|0;d=y;e=k[L+(y<<2)>>2]|0;y=k[(k[I>>2]|0)+(y<<2)>>2]|0}e=e+-1|0;C=k[r>>2]|0;D=j[a+(F<<5)+8>>1]|0;E=D&65535;B=C+(y*2832|0)+(E<<2)|0;k[B>>2]=(k[B>>2]|0)+1;C=C+(y*2832|0)+2816|0;k[C>>2]=(k[C>>2]|0)+1;C=a+(F<<5)|0;a:do if((k[C>>2]|0)>0){B=n;x=z;n=A;g=0;while(1){if(!v){x=n+1|0;z=x;v=k[J+(x<<2)>>2]|0;x=k[(k[G>>2]|0)+(x<<2)>>2]|0}else z=n;v=v+-1|0;n=x<<6;switch(k[(k[p>>2]|0)+(x<<2)>>2]|0){case 0:{o=B&63;break}case 1:{o=(B&255)>>>2;break}case 2:{o=i[318346+(o&255|256)>>0]|i[318346+(B&255)>>0];break}case 3:{o=((l[318858+(B&255)>>0]|0)<<3)+(l[318858+(o&255)>>0]|0)&255;break}default:o=0}A=(o&255)+n|0;o=k[q>>2]|0;n=f+(c&h)|0;M=o+(A*1040|0)+((l[n>>0]|0)<<2)|0;k[M>>2]=(k[M>>2]|0)+1;A=o+(A*1040|0)+1024|0;k[A>>2]=(k[A>>2]|0)+1;n=i[n>>0]|0;c=c+1|0;g=g+1|0;if((g|0)>=(k[C>>2]|0)){o=B;break a}else{o=B;B=n;n=z}}}else{x=z;z=A}while(0);M=k[a+(F<<5)+4>>2]|0;c=M+c|0;if((M|0)>0){o=i[f+(c+-2&h)>>0]|0;n=i[f+(c+-1&h)>>0]|0;if((D&65535)>127){if(!t){u=u+1|0;t=k[K+(u<<2)>>2]|0;w=k[(k[H>>2]|0)+(u<<2)>>2]|0}D=E>>>6;M=E&7;M=(M>>>0<3&((D|0)==7|((D|0)==4|(D&1021|0)==0))?M:3)+(w<<2)|0;E=k[s>>2]|0;D=E+(M*2096|0)+((m[a+(F<<5)+10>>1]|0)<<2)|0;k[D>>2]=(k[D>>2]|0)+1;M=E+(M*2096|0)+2080|0;k[M>>2]=(k[M>>2]|0)+1;t=t+-1|0}}F=F+1|0;if((F|0)==(b|0))break;else{A=z;z=x}}return}function Mf(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,m=0,n=0.0,p=0.0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;x=r;r=r+3088|0;v=x+16|0;w=x;k[v>>2]=0;k[v+4>>2]=0;k[v+8>>2]=0;t=(b|0)==0;if(t){g=0;h=0}else{j=0;m=0;do{h=i[e+(j+a&c)>>0]|0;if(h<<24>>24<=-1)if((h&255)>191)g=1;else g=m>>>0<224?0:2;else g=0;m=h&255;u=v+(g<<2)|0;k[u>>2]=(k[u>>2]|0)+1;j=j+1|0}while((j|0)!=(b|0));g=k[v+4>>2]|0;h=k[v+8>>2]|0}u=(h+g|0)>24&1;gi(v|0,0,3072)|0;k[w>>2]=0;k[w+4>>2]=0;k[w+8>>2]=0;if((b|0)>0|b>>>0>494){m=b>>>0<495?b:495;q=0;s=0;g=0;do{h=i[e+(q+a&c)>>0]|0;j=s;s=h&255;y=v+(g<<10)+(s<<2)|0;k[y>>2]=(k[y>>2]|0)+1;g=w+(g<<2)|0;k[g>>2]=(k[g>>2]|0)+1;if(h<<24>>24<=-1)if((h&255)>191)g=u;else g=j>>>0<224?0:u;else g=0;q=q+1|0}while((q|0)!=(m|0))}if(t){r=x;return}m=a+-495|0;q=a+495|0;s=0;do{if((s+-495|0)>-1){if((s|0)>=496){g=s+a|0;h=i[e+(g+-496&c)>>0]|0;if((s|0)<497)g=0;else g=l[e+(g+-497&c)>>0]|0;if(h<<24>>24<=-1)if((h&255)>191)g=u;else g=g>>>0<224?0:u;else g=0}else g=0;y=v+(g<<10)+((l[e+(m+s&c)>>0]|0)<<2)|0;k[y>>2]=(k[y>>2]|0)+-1;y=w+(g<<2)|0;k[y>>2]=(k[y>>2]|0)+-1}if((s+495|0)>>>0<b>>>0){h=s+a|0;g=i[e+(h+494&c)>>0]|0;h=i[e+(h+493&c)>>0]|0;if(g<<24>>24<=-1)if((g&255)>191)g=u;else g=(h&255)<224?0:u;else g=0;y=v+(g<<10)+((l[e+(q+s&c)>>0]|0)<<2)|0;k[y>>2]=(k[y>>2]|0)+1;y=w+(g<<2)|0;k[y>>2]=(k[y>>2]|0)+1}j=s+a|0;if((s|0)>=1){h=i[e+(j+-1&c)>>0]|0;if((s|0)<2)g=0;else g=l[e+(j+-2&c)>>0]|0;if(h<<24>>24<=-1)if((h&255)>191)g=u;else g=g>>>0<224?0:u;else g=0}else g=0;h=k[v+(g<<10)+((l[e+(j&c)>>0]|0)<<2)>>2]|0;h=(h|0)==0?1:h;g=k[w+(g<<2)>>2]|0;if((g|0)<256)p=+o[4036+(g<<2)>>2];else p=+oh(+(g|0));if((h|0)<256)n=+o[4036+(h<<2)>>2];else n=+oh(+(h|0));n=p-n+.02905;n=n<1.0?n*.5+.5:n;if((s|0)<2e3)n=n+(.7-+(2e3-s|0)/2.0e3*.35);o[f+((j&d)<<2)>>2]=n;s=s+1|0}while((s|0)!=(b|0));r=x;return}function Nf(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0.0,m=0.0,n=0,p=0,q=0,s=0,t=0;t=r;r=r+1024|0;s=t;gi(s|0,0,1024)|0;i=b>>>0<2e3?b:2e3;if((i|0)>0){g=b>>>0<2e3?b:2e3;h=0;do{q=s+((l[e+(h+a&c)>>0]|0)<<2)|0;k[q>>2]=(k[q>>2]|0)+1;h=h+1|0}while((h|0)!=(g|0))}if(!b){r=t;return}n=a+-2e3|0;p=a+2e3|0;q=0;g=i;do{if((q+-2e3|0)>-1){i=s+((l[e+(n+q&c)>>0]|0)<<2)|0;k[i>>2]=(k[i>>2]|0)+-1;g=g+-1|0}if((q+2e3|0)>>>0<b>>>0){i=s+((l[e+(p+q&c)>>0]|0)<<2)|0;k[i>>2]=(k[i>>2]|0)+1;g=g+1|0}i=q+a|0;h=k[s+((l[e+(i&c)>>0]|0)<<2)>>2]|0;h=(h|0)==0?1:h;if((g|0)<256)m=+o[4036+(g<<2)>>2];else m=+oh(+(g|0));if((h|0)<256)j=+o[4036+(h<<2)>>2];else j=+oh(+(h|0));m=m-j+.029;o[f+((i&d)<<2)>>2]=m<1.0?m*.5+.5:m;q=q+1|0}while((q|0)!=(b|0));r=t;return}function Of(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;B=r;r=r+48|0;z=B+24|0;y=B+12|0;w=B;u=j+28|0;v=j+56|0;Hd(f,g,a+(c&b)|0,j,u,v);l=k[j>>2]|0;k[z>>2]=0;A=z+4|0;k[A>>2]=0;k[z+8>>2]=0;if(!l)l=0;else{if(l>>>0>1073741823)mg(z);m=og(l<<2)|0;k[A>>2]=m;k[z>>2]=m;n=m+(l<<2)|0;k[z+8>>2]=n;while(1){k[m>>2]=h;l=l+-1|0;if(!l)break;else m=m+4|0}k[A>>2]=n;l=k[j>>2]|0}m=l<<6;q=k[v>>2]|0;t=q<<2;k[y>>2]=0;x=y+4|0;k[x>>2]=0;k[y+8>>2]=0;if(m){if(m>>>0>4129776)mg(y);o=og(l*66560|0)|0;k[x>>2]=o;k[y>>2]=o;k[y+8>>2]=o+(m*1040|0);h=l<<6;n=o;l=o;while(1){gi(n|0,0,1028)|0;l=l+1040|0;m=m+-1|0;if(!m)break;else n=l}k[x>>2]=o+(h*1040|0)}p=j+120|0;l=k[u>>2]|0;m=j+124|0;n=k[m>>2]|0;h=k[p>>2]|0;o=(n-h|0)/2832|0;if(l>>>0<=o>>>0){if(l>>>0<o>>>0?(s=h+(l*2832|0)|0,(n|0)!=(s|0)):0)k[m>>2]=n+(~(((n+-2832-s|0)>>>0)/2832|0)*2832|0)}else je(p,l-o|0);k[w>>2]=0;s=w+4|0;k[s>>2]=0;k[w+8>>2]=0;if(t){if(t>>>0>2049125)mg(w);o=og(q*8384|0)|0;k[s>>2]=o;k[w>>2]=o;k[w+8>>2]=o+(t*2096|0);h=q<<2;l=t;n=o;m=o;while(1){gi(n|0,0,2084)|0;m=m+2096|0;l=l+-1|0;if(!l)break;else n=m}k[s>>2]=o+(h*2096|0)}Lf(f,g,j,u,v,a,b,c,d,e,z,y,p,w);l=j+108|0;if((l|0)!=(y|0))Rf(l,k[y>>2]|0,k[x>>2]|0);m=k[j>>2]|0;n=j+84|0;if(i)ve(y,64,m,256,l,n);else Sf(y,64,m,256,l,n);n=j+132|0;if((n|0)!=(w|0))Tf(n,k[w>>2]|0,k[s>>2]|0);m=k[v>>2]|0;l=j+96|0;if(i)Sd(w,4,m,256,n,l);else Uf(w,4,m,256,n,l);l=k[w>>2]|0;m=l;if(l){n=k[s>>2]|0;if((n|0)!=(l|0))k[s>>2]=n+(~(((n+-2096-m|0)>>>0)/2096|0)*2096|0);rg(l)}l=k[y>>2]|0;m=l;if(l){n=k[x>>2]|0;if((n|0)!=(l|0))k[x>>2]=n+(~(((n+-1040-m|0)>>>0)/1040|0)*1040|0);rg(l)}m=k[z>>2]|0;if(!m){r=B;return}l=k[A>>2]|0;if((l|0)!=(m|0))k[A>>2]=l+(~((l+-4-m|0)>>>2)<<2);rg(m);r=B;return}function Pf(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;F=r;r=r+224|0;E=F+144|0;C=F+72|0;D=F;i=(e|0)==0;if(i)g=0;else{h=0;g=0;do{g=(k[d+(h<<5)>>2]|0)+g|0;h=h+1|0}while((h|0)!=(e|0))}Vf(E,256,512,400.0,g,f,f+108|0);Wf(C,704,1024,500.0,e,f+28|0,f+120|0);Xf(D,64,512,100.0,e,f+56|0,f+132|0);if(i){Zf(E,1);Yf(C,1);_f(D,1);r=F;return}p=C+24|0;q=C+36|0;s=C+32|0;t=C+28|0;u=D+24|0;v=D+36|0;w=D+32|0;x=D+28|0;y=E+24|0;z=E+36|0;A=E+32|0;B=E+28|0;g=b;o=0;do{i=k[d+(o<<5)>>2]|0;b=k[d+(o<<5)+4>>2]|0;m=j[d+(o<<5)+8>>1]|0;n=j[d+(o<<5)+10>>1]|0;f=k[q>>2]|0;h=k[k[p>>2]>>2]|0;G=h+(f*2832|0)+((m&65535)<<2)|0;k[G>>2]=(k[G>>2]|0)+1;f=h+(f*2832|0)+2816|0;k[f>>2]=(k[f>>2]|0)+1;f=(k[s>>2]|0)+1|0;k[s>>2]=f;if((f|0)==(k[t>>2]|0))Yf(C,0);if((i|0)>0){h=g;f=0;while(1){G=k[z>>2]|0;H=k[k[y>>2]>>2]|0;I=H+(G*1040|0)+((l[a+(h&c)>>0]|0)<<2)|0;k[I>>2]=(k[I>>2]|0)+1;G=H+(G*1040|0)+1024|0;k[G>>2]=(k[G>>2]|0)+1;G=(k[A>>2]|0)+1|0;k[A>>2]=G;if((G|0)==(k[B>>2]|0))Zf(E,0);f=f+1|0;if((f|0)==(i|0))break;else h=h+1|0}g=g+i|0}g=g+b|0;if((b|0)>0&(m&65535)>127?(I=k[v>>2]|0,H=k[k[u>>2]>>2]|0,G=H+(I*2096|0)+((n&65535)<<2)|0,k[G>>2]=(k[G>>2]|0)+1,I=H+(I*2096|0)+2080|0,k[I>>2]=(k[I>>2]|0)+1,I=(k[w>>2]|0)+1|0,k[w>>2]=I,(I|0)==(k[x>>2]|0)):0)_f(D,0);o=o+1|0}while((o|0)!=(e|0));Zf(E,1);Yf(C,1);_f(D,1);r=F;return}function Qf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;f=c+112|0;g=c+108|0;d=k[g>>2]|0;if((k[f>>2]|0)!=(d|0)){e=0;do{Df(256,d+(e*1040|0)|0)|0;e=e+1|0;d=k[g>>2]|0}while(e>>>0<(((k[f>>2]|0)-d|0)/1040|0)>>>0)}f=c+124|0;g=c+120|0;d=k[g>>2]|0;if((k[f>>2]|0)!=(d|0)){e=0;do{Df(704,d+(e*2832|0)|0)|0;e=e+1|0;d=k[g>>2]|0}while(e>>>0<(((k[f>>2]|0)-d|0)/2832|0)>>>0)}g=a+16+(48<<b)|0;b=c+136|0;f=c+132|0;d=k[f>>2]|0;if((k[b>>2]|0)==(d|0))return;else e=0;do{Df(g,d+(e*2096|0)|0)|0;e=e+1|0;d=k[f>>2]|0}while(e>>>0<(((k[b>>2]|0)-d|0)/2096|0)>>>0);return}function Rf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0;e=b;i=(c-e|0)/1040|0;l=a+8|0;d=k[l>>2]|0;h=k[a>>2]|0;g=h;if(i>>>0<=((d-g|0)/1040|0)>>>0){f=a+4|0;d=((k[f>>2]|0)-g|0)/1040|0;a=i>>>0>d>>>0;d=a?b+(d*1040|0)|0:c;l=d-e|0;li(h|0,b|0,l|0)|0;b=h+(((l|0)/1040|0)*1040|0)|0;if(!a){d=k[f>>2]|0;if((d|0)==(b|0))return;k[f>>2]=d+(~(((d+-1040-b|0)>>>0)/1040|0)*1040|0);return}if((d|0)==(c|0))return;b=k[f>>2]|0;do{ki(b|0,d|0,1040)|0;b=(k[f>>2]|0)+1040|0;k[f>>2]=b;d=d+1040|0}while((d|0)!=(c|0));return}if(h){d=a+4|0;e=k[d>>2]|0;if((e|0)!=(h|0))k[d>>2]=e+(~(((e+-1040-g|0)>>>0)/1040|0)*1040|0);rg(h);k[l>>2]=0;k[d>>2]=0;k[a>>2]=0;d=0}f=i>>>0>4129776;if(f)mg(a);d=(d-0|0)/1040|0;if(d>>>0<2064888){e=d<<1;d=e>>>0>=i>>>0;if(d|f^1)j=d?e:i;else mg(a)}else j=4129776;d=og(j*1040|0)|0;e=a+4|0;k[e>>2]=d;k[a>>2]=d;k[l>>2]=d+(j*1040|0);if((b|0)==(c|0))return;do{ki(d|0,b|0,1040)|0;d=(k[e>>2]|0)+1040|0;k[e>>2]=d;b=b+1040|0}while((b|0)!=(c|0));return}function Sf(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0;q=r;r=r+16|0;p=q;d=e+4|0;g=k[d>>2]|0;h=k[e>>2]|0;i=(g-h|0)/1040|0;if(i>>>0>=c>>>0){if(i>>>0>c>>>0?(j=h+(c*1040|0)|0,(g|0)!=(j|0)):0)k[d>>2]=g+(~(((g+-1040-j|0)>>>0)/1040|0)*1040|0)}else we(e,c-i|0);k[p>>2]=0;if((c|0)<=0){r=q;return}j=f+4|0;l=f+8|0;if((b|0)>0)m=0;else{d=0;do{gi((k[e>>2]|0)+(d*1040|0)|0,0,1028)|0;d=d+1|0}while((d|0)<(c|0));k[p>>2]=d;r=q;return}do{gi((k[e>>2]|0)+(m*1040|0)|0,0,1028)|0;n=ha(m,b)|0;o=0;do{d=k[e>>2]|0;g=n+o|0;h=k[a>>2]|0;i=d+(m*1040|0)+1024|0;k[i>>2]=(k[i>>2]|0)+(k[h+(g*1040|0)+1024>>2]|0);i=0;do{s=d+(m*1040|0)+(i<<2)|0;k[s>>2]=(k[s>>2]|0)+(k[h+(g*1040|0)+(i<<2)>>2]|0);i=i+1|0}while((i|0)!=256);d=k[j>>2]|0;if((d|0)==(k[l>>2]|0))Jd(f,p);else{k[d>>2]=m;k[j>>2]=d+4}o=o+1|0}while((o|0)!=(b|0));m=m+1|0;k[p>>2]=m}while((m|0)<(c|0));r=q;return}function Tf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0;e=b;i=(c-e|0)/2096|0;l=a+8|0;d=k[l>>2]|0;h=k[a>>2]|0;g=h;if(i>>>0<=((d-g|0)/2096|0)>>>0){f=a+4|0;d=((k[f>>2]|0)-g|0)/2096|0;a=i>>>0>d>>>0;d=a?b+(d*2096|0)|0:c;l=d-e|0;li(h|0,b|0,l|0)|0;b=h+(((l|0)/2096|0)*2096|0)|0;if(!a){d=k[f>>2]|0;if((d|0)==(b|0))return;k[f>>2]=d+(~(((d+-2096-b|0)>>>0)/2096|0)*2096|0);return}if((d|0)==(c|0))return;b=k[f>>2]|0;do{ki(b|0,d|0,2096)|0;b=(k[f>>2]|0)+2096|0;k[f>>2]=b;d=d+2096|0}while((d|0)!=(c|0));return}if(h){d=a+4|0;e=k[d>>2]|0;if((e|0)!=(h|0))k[d>>2]=e+(~(((e+-2096-g|0)>>>0)/2096|0)*2096|0);rg(h);k[l>>2]=0;k[d>>2]=0;k[a>>2]=0;d=0}f=i>>>0>2049125;if(f)mg(a);d=(d-0|0)/2096|0;if(d>>>0<1024562){e=d<<1;d=e>>>0>=i>>>0;if(d|f^1)j=d?e:i;else mg(a)}else j=2049125;d=og(j*2096|0)|0;e=a+4|0;k[e>>2]=d;k[a>>2]=d;k[l>>2]=d+(j*2096|0);if((b|0)==(c|0))return;do{ki(d|0,b|0,2096)|0;d=(k[e>>2]|0)+2096|0;k[e>>2]=d;b=b+2096|0}while((b|0)!=(c|0));return}function Uf(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0;q=r;r=r+16|0;p=q;d=e+4|0;g=k[d>>2]|0;h=k[e>>2]|0;i=(g-h|0)/2096|0;if(i>>>0>=c>>>0){if(i>>>0>c>>>0?(j=h+(c*2096|0)|0,(g|0)!=(j|0)):0)k[d>>2]=g+(~(((g+-2096-j|0)>>>0)/2096|0)*2096|0)}else Td(e,c-i|0);k[p>>2]=0;if((c|0)<=0){r=q;return}j=f+4|0;l=f+8|0;if((b|0)>0)m=0;else{d=0;do{gi((k[e>>2]|0)+(d*2096|0)|0,0,2084)|0;d=d+1|0}while((d|0)<(c|0));k[p>>2]=d;r=q;return}do{gi((k[e>>2]|0)+(m*2096|0)|0,0,2084)|0;n=ha(m,b)|0;o=0;do{d=k[e>>2]|0;g=n+o|0;h=k[a>>2]|0;i=d+(m*2096|0)+2080|0;k[i>>2]=(k[i>>2]|0)+(k[h+(g*2096|0)+2080>>2]|0);i=0;do{s=d+(m*2096|0)+(i<<2)|0;k[s>>2]=(k[s>>2]|0)+(k[h+(g*2096|0)+(i<<2)>>2]|0);i=i+1|0}while((i|0)!=520);d=k[j>>2]|0;if((d|0)==(k[l>>2]|0))Jd(f,p);else{k[d>>2]=m;k[j>>2]=d+4}o=o+1|0}while((o|0)!=(b|0));m=m+1|0;k[p>>2]=m}while((m|0)<(c|0));r=q;return}function Vf(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=+d;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,l=0,m=0,n=0,o=0;k[a>>2]=b;k[a+4>>2]=c;p[a+8>>3]=d;k[a+16>>2]=0;i=a+20|0;k[i>>2]=f;m=a+24|0;k[m>>2]=g;k[a+28>>2]=c;k[a+32>>2]=0;k[a+36>>2]=0;k[a+64>>2]=0;l=((e|0)/(c|0)|0)+1|0;n=(l|0)>257?257:l;b=f+16|0;g=f+20|0;c=k[g>>2]|0;e=k[b>>2]|0;h=c-e>>2;if(l>>>0<=h>>>0){if(l>>>0<h>>>0?(j=e+(l<<2)|0,(c|0)!=(j|0)):0)k[g>>2]=c+(~((c+-4-j|0)>>>2)<<2)}else{Ud(b,l-h|0);f=k[i>>2]|0}e=f+4|0;f=f+8|0;b=k[f>>2]|0;g=k[e>>2]|0;c=b-g>>2;if(l>>>0<=c>>>0){if(l>>>0<c>>>0?(o=g+(l<<2)|0,(b|0)!=(o|0)):0)k[f>>2]=b+(~((b+-4-o|0)>>>2)<<2)}else Ud(e,l-c|0);f=k[m>>2]|0;c=f+4|0;e=k[c>>2]|0;b=k[f>>2]|0;g=(e-b|0)/1040|0;if(n>>>0>g>>>0){we(f,n-g|0);o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}if(n>>>0>=g>>>0){o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}f=b+(n*1040|0)|0;if((e|0)==(f|0)){o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}k[c>>2]=e+(~(((e+-1040-f|0)>>>0)/1040|0)*1040|0);o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}function Wf(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=+d;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,l=0,m=0,n=0,o=0;k[a>>2]=b;k[a+4>>2]=c;p[a+8>>3]=d;k[a+16>>2]=0;i=a+20|0;k[i>>2]=f;m=a+24|0;k[m>>2]=g;k[a+28>>2]=c;k[a+32>>2]=0;k[a+36>>2]=0;k[a+64>>2]=0;l=((e|0)/(c|0)|0)+1|0;n=(l|0)>257?257:l;b=f+16|0;g=f+20|0;c=k[g>>2]|0;e=k[b>>2]|0;h=c-e>>2;if(l>>>0<=h>>>0){if(l>>>0<h>>>0?(j=e+(l<<2)|0,(c|0)!=(j|0)):0)k[g>>2]=c+(~((c+-4-j|0)>>>2)<<2)}else{Ud(b,l-h|0);f=k[i>>2]|0}e=f+4|0;f=f+8|0;b=k[f>>2]|0;g=k[e>>2]|0;c=b-g>>2;if(l>>>0<=c>>>0){if(l>>>0<c>>>0?(o=g+(l<<2)|0,(b|0)!=(o|0)):0)k[f>>2]=b+(~((b+-4-o|0)>>>2)<<2)}else Ud(e,l-c|0);f=k[m>>2]|0;c=f+4|0;e=k[c>>2]|0;b=k[f>>2]|0;g=(e-b|0)/2832|0;if(n>>>0>g>>>0){je(f,n-g|0);o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}if(n>>>0>=g>>>0){o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}f=b+(n*2832|0)|0;if((e|0)==(f|0)){o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}k[c>>2]=e+(~(((e+-2832-f|0)>>>0)/2832|0)*2832|0);o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}function Xf(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=+d;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,l=0,m=0,n=0,o=0;k[a>>2]=b;k[a+4>>2]=c;p[a+8>>3]=d;k[a+16>>2]=0;i=a+20|0;k[i>>2]=f;m=a+24|0;k[m>>2]=g;k[a+28>>2]=c;k[a+32>>2]=0;k[a+36>>2]=0;k[a+64>>2]=0;l=((e|0)/(c|0)|0)+1|0;n=(l|0)>257?257:l;b=f+16|0;g=f+20|0;c=k[g>>2]|0;e=k[b>>2]|0;h=c-e>>2;if(l>>>0<=h>>>0){if(l>>>0<h>>>0?(j=e+(l<<2)|0,(c|0)!=(j|0)):0)k[g>>2]=c+(~((c+-4-j|0)>>>2)<<2)}else{Ud(b,l-h|0);f=k[i>>2]|0}e=f+4|0;f=f+8|0;b=k[f>>2]|0;g=k[e>>2]|0;c=b-g>>2;if(l>>>0<=c>>>0){if(l>>>0<c>>>0?(o=g+(l<<2)|0,(b|0)!=(o|0)):0)k[f>>2]=b+(~((b+-4-o|0)>>>2)<<2)}else Ud(e,l-c|0);f=k[m>>2]|0;c=f+4|0;e=k[c>>2]|0;b=k[f>>2]|0;g=(e-b|0)/2096|0;if(n>>>0>g>>>0){Td(f,n-g|0);o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}if(n>>>0>=g>>>0){o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}f=b+(n*2096|0)|0;if((e|0)==(f|0)){o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}k[c>>2]=e+(~(((e+-2096-f|0)>>>0)/2096|0)*2096|0);o=a+44|0;k[o>>2]=0;a=a+40|0;k[a>>2]=0;return}function Yf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0.0,j=0.0,l=0,m=0.0,n=0,q=0.0,s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;I=r;r=r+5696|0;A=I+32|0;z=I+16|0;B=I;E=a+32|0;c=k[E>>2]|0;C=a+4|0;d=k[C>>2]|0;if((c|0)<(d|0)){k[E>>2]=d;c=d}G=a+16|0;v=k[G>>2]|0;if(v){if((c|0)>0){x=a+24|0;n=k[x>>2]|0;y=a+36|0;s=k[y>>2]|0;g=k[n>>2]|0;d=g+(s*2832|0)|0;t=k[a>>2]|0;g=g+(s*2832|0)+(t<<2)|0;u=(t&1|0)==0;if(u){i=0.0;f=0}else{m=0.0;f=0;D=27}while(1){if((D|0)==27){D=0;e=k[d>>2]|0;j=+(e|0);if((e|0)<256)i=+o[4036+(e<<2)>>2];else i=+oh(j);d=d+4|0;i=m-j*i;f=e+f|0}if(d>>>0>=g>>>0)break;e=k[d>>2]|0;m=+(e|0);if((e|0)<256)j=+o[4036+(e<<2)>>2];else j=+oh(m);d=d+4|0;m=i-m*j;f=e+f|0;D=27}m=+(f|0);if(f){if((f|0)<256)j=+o[4036+(f<<2)>>2];else j=+oh(m);i=i+m*j}gi(A|0,0,2820)|0;gi(A+2832|0,0,2820)|0;q=i<m?m:i;e=k[n>>2]|0;l=0;do{f=k[a+40+(l<<2)>>2]|0;g=A+(l*2832|0)|0;ki(g|0,e+(s*2832|0)|0,2832)|0;e=k[n>>2]|0;d=A+(l*2832|0)+2816|0;k[d>>2]=(k[d>>2]|0)+(k[e+(f*2832|0)+2816>>2]|0);d=0;do{h=A+(l*2832|0)+(d<<2)|0;k[h>>2]=(k[h>>2]|0)+(k[e+(f*2832|0)+(d<<2)>>2]|0);d=d+1|0}while((d|0)!=704);h=A+(l*2832|0)+(t<<2)|0;if(u){i=0.0;f=0}else{m=0.0;f=0;D=45}while(1){if((D|0)==45){D=0;d=k[g>>2]|0;j=+(d|0);if((d|0)<256)i=+o[4036+(d<<2)>>2];else i=+oh(j);g=g+4|0;i=m-j*i;f=d+f|0}if(g>>>0>=h>>>0)break;d=k[g>>2]|0;m=+(d|0);if((d|0)<256)j=+o[4036+(d<<2)>>2];else j=+oh(m);g=g+4|0;m=i-m*j;f=d+f|0;D=45}m=+(f|0);if(f){if((f|0)<256)j=+o[4036+(f<<2)>>2];else j=+oh(m);i=i+m*j}m=i<m?m:i;p[z+(l<<3)>>3]=m;p[B+(l<<3)>>3]=m-q-+p[a+48+(l<<3)>>3];l=l+1|0}while((l|0)!=2);g=a+20|0;f=k[g>>2]|0;i=+p[B>>3];if(((k[f>>2]|0)<256?(w=+p[a+8>>3],i>w):0)?+p[B+8>>3]>w:0){k[(k[f+16>>2]|0)+(v<<2)>>2]=c;k[(k[f+4>>2]|0)+(k[G>>2]<<2)>>2]=k[f>>2];B=a+40|0;k[a+44>>2]=k[B>>2];k[B>>2]=k[f>>2];B=a+48|0;p[a+56>>3]=+p[B>>3];p[B>>3]=q;k[G>>2]=(k[G>>2]|0)+1;k[f>>2]=(k[f>>2]|0)+1;k[y>>2]=(k[y>>2]|0)+1;k[E>>2]=0;k[a+64>>2]=0;k[a+28>>2]=k[C>>2]}else D=59;do if((D|0)==59){d=f+16|0;if(+p[B+8>>3]<i+-20.0){k[(k[d>>2]|0)+(v<<2)>>2]=c;u=k[G>>2]|0;B=k[f+4>>2]|0;k[B+(u<<2)>>2]=k[B+(u+-2<<2)>>2];u=a+40|0;B=a+44|0;v=k[u>>2]|0;D=k[B>>2]|0;k[u>>2]=D;k[B>>2]=v;ki(e+(D*2832|0)|0,A+2832|0,2832)|0;D=a+48|0;p[a+56>>3]=+p[D>>3];p[D>>3]=+p[z+8>>3];k[G>>2]=(k[G>>2]|0)+1;k[E>>2]=0;gi((k[k[x>>2]>>2]|0)+((k[y>>2]|0)*2832|0)|0,0,2820)|0;k[a+64>>2]=0;k[a+28>>2]=k[C>>2];break}D=(k[d>>2]|0)+(v+-1<<2)|0;k[D>>2]=(k[D>>2]|0)+c;ki(e+((k[a+40>>2]|0)*2832|0)|0,A|0,2832)|0;i=+p[z>>3];p[a+48>>3]=i;if((k[k[g>>2]>>2]|0)==1)p[a+56>>3]=i;k[E>>2]=0;gi((k[k[x>>2]>>2]|0)+((k[y>>2]|0)*2832|0)|0,0,2820)|0;D=a+64|0;E=k[D>>2]|0;k[D>>2]=E+1;if((E|0)>0){E=a+28|0;k[E>>2]=(k[E>>2]|0)+(k[C>>2]|0)}}while(0)}}else{g=k[a+20>>2]|0;k[k[g+16>>2]>>2]=c;k[k[g+4>>2]>>2]=0;c=k[k[a+24>>2]>>2]|0;C=k[a>>2]|0;f=c+(C<<2)|0;if(!(C&1)){i=0.0;e=0}else{m=0.0;e=0;D=10}while(1){if((D|0)==10){d=k[c>>2]|0;j=+(d|0);if((d|0)<256)i=+o[4036+(d<<2)>>2];else i=+oh(j);c=c+4|0;i=m-j*i;e=d+e|0}if(c>>>0>=f>>>0)break;d=k[c>>2]|0;m=+(d|0);if((d|0)<256)j=+o[4036+(d<<2)>>2];else j=+oh(m);c=c+4|0;m=i-m*j;e=d+e|0;D=10}m=+(e|0);if(e){if((e|0)<256)j=+o[4036+(e<<2)>>2];else j=+oh(m);i=i+m*j}w=i<m?m:i;p[a+48>>3]=w;p[a+56>>3]=w;k[G>>2]=(k[G>>2]|0)+1;k[g>>2]=(k[g>>2]|0)+1;D=a+36|0;k[D>>2]=(k[D>>2]|0)+1;k[E>>2]=0}if(!b){r=I;return}l=k[a+24>>2]|0;n=a+20|0;c=k[n>>2]|0;d=k[c>>2]|0;e=l+4|0;f=k[e>>2]|0;g=k[l>>2]|0;h=(f-g|0)/2832|0;if(d>>>0<=h>>>0){if(d>>>0<h>>>0?(F=g+(d*2832|0)|0,(f|0)!=(F|0)):0)k[e>>2]=f+(~(((f+-2832-F|0)>>>0)/2832|0)*2832|0)}else{je(l,d-h|0);c=k[n>>2]|0}d=c+4|0;h=k[G>>2]|0;e=c+8|0;f=k[e>>2]|0;g=k[d>>2]|0;l=f-g>>2;if(h>>>0<=l>>>0){if(h>>>0<l>>>0?(H=g+(h<<2)|0,(f|0)!=(H|0)):0)k[e>>2]=f+(~((f+-4-H|0)>>>2)<<2)}else{Ud(d,h-l|0);c=k[n>>2]|0;h=k[G>>2]|0}e=c+16|0;f=c+20|0;g=k[f>>2]|0;c=k[e>>2]|0;d=g-c>>2;if(h>>>0>d>>>0){Ud(e,h-d|0);r=I;return}if(h>>>0>=d>>>0){r=I;return}c=c+(h<<2)|0;if((g|0)==(c|0)){r=I;return}k[f>>2]=g+(~((g+-4-c|0)>>>2)<<2);r=I;return}function Zf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0.0,j=0.0,l=0,m=0.0,n=0,q=0.0,s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;I=r;r=r+2112|0;A=I+32|0;z=I+16|0;B=I;E=a+32|0;c=k[E>>2]|0;C=a+4|0;d=k[C>>2]|0;if((c|0)<(d|0)){k[E>>2]=d;c=d}G=a+16|0;v=k[G>>2]|0;if(v){if((c|0)>0){x=a+24|0;n=k[x>>2]|0;y=a+36|0;s=k[y>>2]|0;g=k[n>>2]|0;d=g+(s*1040|0)|0;t=k[a>>2]|0;g=g+(s*1040|0)+(t<<2)|0;u=(t&1|0)==0;if(u){i=0.0;f=0}else{m=0.0;f=0;D=27}while(1){if((D|0)==27){D=0;e=k[d>>2]|0;j=+(e|0);if((e|0)<256)i=+o[4036+(e<<2)>>2];else i=+oh(j);d=d+4|0;i=m-j*i;f=e+f|0}if(d>>>0>=g>>>0)break;e=k[d>>2]|0;m=+(e|0);if((e|0)<256)j=+o[4036+(e<<2)>>2];else j=+oh(m);d=d+4|0;m=i-m*j;f=e+f|0;D=27}m=+(f|0);if(f){if((f|0)<256)j=+o[4036+(f<<2)>>2];else j=+oh(m);i=i+m*j}gi(A|0,0,1028)|0;gi(A+1040|0,0,1028)|0;q=i<m?m:i;e=k[n>>2]|0;l=0;do{f=k[a+40+(l<<2)>>2]|0;g=A+(l*1040|0)|0;ki(g|0,e+(s*1040|0)|0,1040)|0;e=k[n>>2]|0;d=A+(l*1040|0)+1024|0;k[d>>2]=(k[d>>2]|0)+(k[e+(f*1040|0)+1024>>2]|0);d=0;do{h=A+(l*1040|0)+(d<<2)|0;k[h>>2]=(k[h>>2]|0)+(k[e+(f*1040|0)+(d<<2)>>2]|0);d=d+1|0}while((d|0)!=256);h=A+(l*1040|0)+(t<<2)|0;if(u){i=0.0;f=0}else{m=0.0;f=0;D=45}while(1){if((D|0)==45){D=0;d=k[g>>2]|0;j=+(d|0);if((d|0)<256)i=+o[4036+(d<<2)>>2];else i=+oh(j);g=g+4|0;i=m-j*i;f=d+f|0}if(g>>>0>=h>>>0)break;d=k[g>>2]|0;m=+(d|0);if((d|0)<256)j=+o[4036+(d<<2)>>2];else j=+oh(m);g=g+4|0;m=i-m*j;f=d+f|0;D=45}m=+(f|0);if(f){if((f|0)<256)j=+o[4036+(f<<2)>>2];else j=+oh(m);i=i+m*j}m=i<m?m:i;p[z+(l<<3)>>3]=m;p[B+(l<<3)>>3]=m-q-+p[a+48+(l<<3)>>3];l=l+1|0}while((l|0)!=2);g=a+20|0;f=k[g>>2]|0;i=+p[B>>3];if(((k[f>>2]|0)<256?(w=+p[a+8>>3],i>w):0)?+p[B+8>>3]>w:0){k[(k[f+16>>2]|0)+(v<<2)>>2]=c;k[(k[f+4>>2]|0)+(k[G>>2]<<2)>>2]=k[f>>2];B=a+40|0;k[a+44>>2]=k[B>>2];k[B>>2]=k[f>>2];B=a+48|0;p[a+56>>3]=+p[B>>3];p[B>>3]=q;k[G>>2]=(k[G>>2]|0)+1;k[f>>2]=(k[f>>2]|0)+1;k[y>>2]=(k[y>>2]|0)+1;k[E>>2]=0;k[a+64>>2]=0;k[a+28>>2]=k[C>>2]}else D=59;do if((D|0)==59){d=f+16|0;if(+p[B+8>>3]<i+-20.0){k[(k[d>>2]|0)+(v<<2)>>2]=c;u=k[G>>2]|0;B=k[f+4>>2]|0;k[B+(u<<2)>>2]=k[B+(u+-2<<2)>>2];u=a+40|0;B=a+44|0;v=k[u>>2]|0;D=k[B>>2]|0;k[u>>2]=D;k[B>>2]=v;ki(e+(D*1040|0)|0,A+1040|0,1040)|0;D=a+48|0;p[a+56>>3]=+p[D>>3];p[D>>3]=+p[z+8>>3];k[G>>2]=(k[G>>2]|0)+1;k[E>>2]=0;gi((k[k[x>>2]>>2]|0)+((k[y>>2]|0)*1040|0)|0,0,1028)|0;k[a+64>>2]=0;k[a+28>>2]=k[C>>2];break}D=(k[d>>2]|0)+(v+-1<<2)|0;k[D>>2]=(k[D>>2]|0)+c;ki(e+((k[a+40>>2]|0)*1040|0)|0,A|0,1040)|0;i=+p[z>>3];p[a+48>>3]=i;if((k[k[g>>2]>>2]|0)==1)p[a+56>>3]=i;k[E>>2]=0;gi((k[k[x>>2]>>2]|0)+((k[y>>2]|0)*1040|0)|0,0,1028)|0;D=a+64|0;E=k[D>>2]|0;k[D>>2]=E+1;if((E|0)>0){E=a+28|0;k[E>>2]=(k[E>>2]|0)+(k[C>>2]|0)}}while(0)}}else{g=k[a+20>>2]|0;k[k[g+16>>2]>>2]=c;k[k[g+4>>2]>>2]=0;c=k[k[a+24>>2]>>2]|0;C=k[a>>2]|0;f=c+(C<<2)|0;if(!(C&1)){i=0.0;e=0}else{m=0.0;e=0;D=10}while(1){if((D|0)==10){d=k[c>>2]|0;j=+(d|0);if((d|0)<256)i=+o[4036+(d<<2)>>2];else i=+oh(j);c=c+4|0;i=m-j*i;e=d+e|0}if(c>>>0>=f>>>0)break;d=k[c>>2]|0;m=+(d|0);if((d|0)<256)j=+o[4036+(d<<2)>>2];else j=+oh(m);c=c+4|0;m=i-m*j;e=d+e|0;D=10}m=+(e|0);if(e){if((e|0)<256)j=+o[4036+(e<<2)>>2];else j=+oh(m);i=i+m*j}w=i<m?m:i;p[a+48>>3]=w;p[a+56>>3]=w;k[G>>2]=(k[G>>2]|0)+1;k[g>>2]=(k[g>>2]|0)+1;D=a+36|0;k[D>>2]=(k[D>>2]|0)+1;k[E>>2]=0}if(!b){r=I;return}l=k[a+24>>2]|0;n=a+20|0;c=k[n>>2]|0;d=k[c>>2]|0;e=l+4|0;f=k[e>>2]|0;g=k[l>>2]|0;h=(f-g|0)/1040|0;if(d>>>0<=h>>>0){if(d>>>0<h>>>0?(F=g+(d*1040|0)|0,(f|0)!=(F|0)):0)k[e>>2]=f+(~(((f+-1040-F|0)>>>0)/1040|0)*1040|0)}else{we(l,d-h|0);c=k[n>>2]|0}d=c+4|0;h=k[G>>2]|0;e=c+8|0;f=k[e>>2]|0;g=k[d>>2]|0;l=f-g>>2;if(h>>>0<=l>>>0){if(h>>>0<l>>>0?(H=g+(h<<2)|0,(f|0)!=(H|0)):0)k[e>>2]=f+(~((f+-4-H|0)>>>2)<<2)}else{Ud(d,h-l|0);c=k[n>>2]|0;h=k[G>>2]|0}e=c+16|0;f=c+20|0;g=k[f>>2]|0;c=k[e>>2]|0;d=g-c>>2;if(h>>>0>d>>>0){Ud(e,h-d|0);r=I;return}if(h>>>0>=d>>>0){r=I;return}c=c+(h<<2)|0;if((g|0)==(c|0)){r=I;return}k[f>>2]=g+(~((g+-4-c|0)>>>2)<<2);r=I;return}function _f(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0.0,j=0.0,l=0,m=0.0,n=0,q=0.0,s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;I=r;r=r+4224|0;A=I+32|0;z=I+16|0;B=I;E=a+32|0;c=k[E>>2]|0;C=a+4|0;d=k[C>>2]|0;if((c|0)<(d|0)){k[E>>2]=d;c=d}G=a+16|0;v=k[G>>2]|0;if(v){if((c|0)>0){x=a+24|0;n=k[x>>2]|0;y=a+36|0;s=k[y>>2]|0;g=k[n>>2]|0;d=g+(s*2096|0)|0;t=k[a>>2]|0;g=g+(s*2096|0)+(t<<2)|0;u=(t&1|0)==0;if(u){i=0.0;f=0}else{m=0.0;f=0;D=27}while(1){if((D|0)==27){D=0;e=k[d>>2]|0;j=+(e|0);if((e|0)<256)i=+o[4036+(e<<2)>>2];else i=+oh(j);d=d+4|0;i=m-j*i;f=e+f|0}if(d>>>0>=g>>>0)break;e=k[d>>2]|0;m=+(e|0);if((e|0)<256)j=+o[4036+(e<<2)>>2];else j=+oh(m);d=d+4|0;m=i-m*j;f=e+f|0;D=27}m=+(f|0);if(f){if((f|0)<256)j=+o[4036+(f<<2)>>2];else j=+oh(m);i=i+m*j}gi(A|0,0,2084)|0;gi(A+2096|0,0,2084)|0;q=i<m?m:i;e=k[n>>2]|0;l=0;do{f=k[a+40+(l<<2)>>2]|0;g=A+(l*2096|0)|0;ki(g|0,e+(s*2096|0)|0,2096)|0;e=k[n>>2]|0;d=A+(l*2096|0)+2080|0;k[d>>2]=(k[d>>2]|0)+(k[e+(f*2096|0)+2080>>2]|0);d=0;do{h=A+(l*2096|0)+(d<<2)|0;k[h>>2]=(k[h>>2]|0)+(k[e+(f*2096|0)+(d<<2)>>2]|0);d=d+1|0}while((d|0)!=520);h=A+(l*2096|0)+(t<<2)|0;if(u){i=0.0;f=0}else{m=0.0;f=0;D=45}while(1){if((D|0)==45){D=0;d=k[g>>2]|0;j=+(d|0);if((d|0)<256)i=+o[4036+(d<<2)>>2];else i=+oh(j);g=g+4|0;i=m-j*i;f=d+f|0}if(g>>>0>=h>>>0)break;d=k[g>>2]|0;m=+(d|0);if((d|0)<256)j=+o[4036+(d<<2)>>2];else j=+oh(m);g=g+4|0;m=i-m*j;f=d+f|0;D=45}m=+(f|0);if(f){if((f|0)<256)j=+o[4036+(f<<2)>>2];else j=+oh(m);i=i+m*j}m=i<m?m:i;p[z+(l<<3)>>3]=m;p[B+(l<<3)>>3]=m-q-+p[a+48+(l<<3)>>3];l=l+1|0}while((l|0)!=2);g=a+20|0;f=k[g>>2]|0;i=+p[B>>3];if(((k[f>>2]|0)<256?(w=+p[a+8>>3],i>w):0)?+p[B+8>>3]>w:0){k[(k[f+16>>2]|0)+(v<<2)>>2]=c;k[(k[f+4>>2]|0)+(k[G>>2]<<2)>>2]=k[f>>2];B=a+40|0;k[a+44>>2]=k[B>>2];k[B>>2]=k[f>>2];B=a+48|0;p[a+56>>3]=+p[B>>3];p[B>>3]=q;k[G>>2]=(k[G>>2]|0)+1;k[f>>2]=(k[f>>2]|0)+1;k[y>>2]=(k[y>>2]|0)+1;k[E>>2]=0;k[a+64>>2]=0;k[a+28>>2]=k[C>>2]}else D=59;do if((D|0)==59){d=f+16|0;if(+p[B+8>>3]<i+-20.0){k[(k[d>>2]|0)+(v<<2)>>2]=c;u=k[G>>2]|0;B=k[f+4>>2]|0;k[B+(u<<2)>>2]=k[B+(u+-2<<2)>>2];u=a+40|0;B=a+44|0;v=k[u>>2]|0;D=k[B>>2]|0;k[u>>2]=D;k[B>>2]=v;ki(e+(D*2096|0)|0,A+2096|0,2096)|0;D=a+48|0;p[a+56>>3]=+p[D>>3];p[D>>3]=+p[z+8>>3];k[G>>2]=(k[G>>2]|0)+1;k[E>>2]=0;gi((k[k[x>>2]>>2]|0)+((k[y>>2]|0)*2096|0)|0,0,2084)|0;k[a+64>>2]=0;k[a+28>>2]=k[C>>2];break}D=(k[d>>2]|0)+(v+-1<<2)|0;k[D>>2]=(k[D>>2]|0)+c;ki(e+((k[a+40>>2]|0)*2096|0)|0,A|0,2096)|0;i=+p[z>>3];p[a+48>>3]=i;if((k[k[g>>2]>>2]|0)==1)p[a+56>>3]=i;k[E>>2]=0;gi((k[k[x>>2]>>2]|0)+((k[y>>2]|0)*2096|0)|0,0,2084)|0;D=a+64|0;E=k[D>>2]|0;k[D>>2]=E+1;if((E|0)>0){E=a+28|0;k[E>>2]=(k[E>>2]|0)+(k[C>>2]|0)}}while(0)}}else{g=k[a+20>>2]|0;k[k[g+16>>2]>>2]=c;k[k[g+4>>2]>>2]=0;c=k[k[a+24>>2]>>2]|0;C=k[a>>2]|0;f=c+(C<<2)|0;if(!(C&1)){i=0.0;e=0}else{m=0.0;e=0;D=10}while(1){if((D|0)==10){d=k[c>>2]|0;j=+(d|0);if((d|0)<256)i=+o[4036+(d<<2)>>2];else i=+oh(j);c=c+4|0;i=m-j*i;e=d+e|0}if(c>>>0>=f>>>0)break;d=k[c>>2]|0;m=+(d|0);if((d|0)<256)j=+o[4036+(d<<2)>>2];else j=+oh(m);c=c+4|0;m=i-m*j;e=d+e|0;D=10}m=+(e|0);if(e){if((e|0)<256)j=+o[4036+(e<<2)>>2];else j=+oh(m);i=i+m*j}w=i<m?m:i;p[a+48>>3]=w;p[a+56>>3]=w;k[G>>2]=(k[G>>2]|0)+1;k[g>>2]=(k[g>>2]|0)+1;D=a+36|0;k[D>>2]=(k[D>>2]|0)+1;k[E>>2]=0}if(!b){r=I;return}l=k[a+24>>2]|0;n=a+20|0;c=k[n>>2]|0;d=k[c>>2]|0;e=l+4|0;f=k[e>>2]|0;g=k[l>>2]|0;h=(f-g|0)/2096|0;if(d>>>0<=h>>>0){if(d>>>0<h>>>0?(F=g+(d*2096|0)|0,(f|0)!=(F|0)):0)k[e>>2]=f+(~(((f+-2096-F|0)>>>0)/2096|0)*2096|0)}else{Td(l,d-h|0);c=k[n>>2]|0}d=c+4|0;h=k[G>>2]|0;e=c+8|0;f=k[e>>2]|0;g=k[d>>2]|0;l=f-g>>2;if(h>>>0<=l>>>0){if(h>>>0<l>>>0?(H=g+(h<<2)|0,(f|0)!=(H|0)):0)k[e>>2]=f+(~((f+-4-H|0)>>>2)<<2)}else{Ud(d,h-l|0);c=k[n>>2]|0;h=k[G>>2]|0}e=c+16|0;f=c+20|0;g=k[f>>2]|0;c=k[e>>2]|0;d=g-c>>2;if(h>>>0>d>>>0){Ud(e,h-d|0);r=I;return}if(h>>>0>=d>>>0){r=I;return}c=c+(h<<2)|0;if((g|0)==(c|0)){r=I;return}k[f>>2]=g+(~((g+-4-c|0)>>>2)<<2);r=I;return}function $f(a,b,c){a=a|0;b=b|0;c=c|0;k[a>>2]=5068;k[a+4>>2]=b;k[a+8>>2]=c;k[a+12>>2]=0;return}function ag(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=a+12|0;e=k[d>>2]|0;if((e+c|0)>>>0>(k[a+8>>2]|0)>>>0){a=0;return a|0}ki((k[a+4>>2]|0)+e|0,b|0,c|0)|0;k[d>>2]=(k[d>>2]|0)+c;a=1;return a|0}function bg(a,b,c){a=a|0;b=b|0;c=c|0;k[a>>2]=5088;k[a+4>>2]=b;k[a+8>>2]=c;k[a+12>>2]=0;return}function cg(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=a+12|0;e=k[d>>2]|0;f=k[a+8>>2]|0;if((f|0)==(e|0)){a=0;return a|0}f=f-e|0;b=f>>>0<b>>>0?f:b;a=(k[a+4>>2]|0)+e|0;k[d>>2]=b+e;k[c>>2]=b;return a|0}function dg(a){a=a|0;return}function eg(a){a=a|0;rg(a);return}function fg(a){a=a|0;return}function gg(a){a=a|0;rg(a);return}function hg(a){a=a|0;return lh(k[a+4>>2]|0)|0}function ig(a){a=a|0;La(560,319200);Xa(568,319205,1,1,0);Ja(576,319210,1,-128,127);Ja(592,319215,1,-128,127);Ja(584,319227,1,0,255);Ja(600,319241,2,-32768,32767);Ja(608,319247,2,0,65535);Ja(616,319262,4,-2147483648,2147483647);Ja(624,319266,4,0,-1);Ja(632,319279,4,-2147483648,2147483647);Ja(640,319284,4,0,-1);kb(648,319298,4);kb(656,319304,8);Jb(264,319311);Jb(288,319323);Gb(312,4,319356);db(336,319369);Ca(344,0,319385);Ca(352,0,319415);Ca(360,1,319452);Ca(368,2,319491);Ca(376,3,319522);Ca(384,4,319562);Ca(392,5,319591);Ca(400,4,319629);Ca(408,5,319659);Ca(352,0,319698);Ca(360,1,319730);Ca(368,2,319763);Ca(376,3,319796);Ca(384,4,319830);Ca(392,5,319863);Ca(416,6,319897);Ca(424,7,319928);Ca(432,7,319960);return}function jg(){ig(0);return}function kg(a,b){a=a|0;b=b|0;var c=0;c=r;r=r+16|0;k[c>>2]=b;b=k[1343]|0;vh(b,a,c)|0;yh(10,b)|0;Fa()}function lg(a){a=a|0;Ka(320896,320925,1164,321012)}function mg(a){a=a|0;Ka(321033,321056,303,321012)}function ng(){var a=0,b=0;a=r;r=r+16|0;if(!(jb(5320,2)|0)){b=bb(k[1329]|0)|0;r=a;return b|0}else kg(321143,a);return 0}function og(a){a=a|0;var b=0;b=(a|0)==0?1:a;a=Oh(b)|0;a:do if(!a){while(1){a=yg()|0;if(!a)break;Wb[a&3]();a=Oh(b)|0;if(a)break a}b=Va(4)|0;k[b>>2]=5112;xb(b|0,448,5)}while(0);return a|0}function pg(a,b){a=a|0;b=b|0;return og(a)|0}function qg(a){a=a|0;return og(a)|0}function rg(a){a=a|0;Ph(a);return}function sg(a){a=a|0;rg(a);return}function tg(a){a=a|0;return}function ug(a){a=a|0;rg(a);return}function vg(a){a=a|0;return 321192}function wg(a){a=a|0;var b=0;b=r;r=r+16|0;Wb[a&3]();kg(321207,b)}function xg(){var a=0,b=0;a=ng()|0;if(((a|0)!=0?(b=k[a>>2]|0,(b|0)!=0):0)?(a=b+48|0,(k[a>>2]&-256|0)==1126902528?(k[a+4>>2]|0)==1129074247:0):0)wg(k[b+12>>2]|0);b=k[1275]|0;k[1275]=b+0;wg(b)}function yg(){var a=0;a=k[1281]|0;k[1281]=a+0;return a|0}function zg(a){a=a|0;return}function Ag(a){a=a|0;k[a>>2]=5136;eh(a+4|0);return}function Bg(a){a=a|0;Ag(a);rg(a);return}function Cg(a){a=a|0;return k[a+4>>2]|0}function Dg(a){a=a|0;Ag(a);rg(a);return}function Eg(a){a=a|0;return}function Fg(a){a=a|0;return}function Gg(a){a=a|0;return}function Hg(a){a=a|0;return}function Ig(a){a=a|0;rg(a);return}function Jg(a){a=a|0;rg(a);return}function Kg(a){a=a|0;rg(a);return}function Lg(a){a=a|0;rg(a);return}function Mg(a,b,c){a=a|0;b=b|0;c=c|0;return (a|0)==(b|0)|0}function Ng(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;g=r;r=r+64|0;f=g;if((a|0)!=(b|0))if((b|0)!=0?(e=Tg(b,512,528,0)|0,(e|0)!=0):0){b=f;d=b+56|0;do{k[b>>2]=0;b=b+4|0}while((b|0)<(d|0));k[f>>2]=e;k[f+8>>2]=a;k[f+12>>2]=-1;k[f+48>>2]=1;_b[k[(k[e>>2]|0)+28>>2]&3](e,f,k[c>>2]|0,1);if((k[f+24>>2]|0)==1){k[c>>2]=k[f+16>>2];b=1}else b=0}else b=0;else b=1;r=g;return b|0}function Og(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;a=b+16|0;e=k[a>>2]|0;do if(e){if((e|0)!=(c|0)){d=b+36|0;k[d>>2]=(k[d>>2]|0)+1;k[b+24>>2]=2;i[b+54>>0]=1;break}a=b+24|0;if((k[a>>2]|0)==2)k[a>>2]=d}else{k[a>>2]=c;k[b+24>>2]=d;k[b+36>>2]=1}while(0);return}function Pg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if((a|0)==(k[b+8>>2]|0))Og(0,b,c,d);return}function Qg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;if((a|0)==(k[b+8>>2]|0))Og(0,b,c,d);else{a=k[a+8>>2]|0;_b[k[(k[a>>2]|0)+28>>2]&3](a,b,c,d)}return}function Rg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;f=k[a+4>>2]|0;e=f>>8;if(f&1)e=k[(k[c>>2]|0)+e>>2]|0;a=k[a>>2]|0;_b[k[(k[a>>2]|0)+28>>2]&3](a,b,c+e|0,(f&2|0)!=0?d:2);return}function Sg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;a:do if((a|0)!=(k[b+8>>2]|0)){f=k[a+12>>2]|0;e=a+16+(f<<3)|0;Rg(a+16|0,b,c,d);if((f|0)>1){f=b+54|0;a=a+24|0;do{Rg(a,b,c,d);if(i[f>>0]|0)break a;a=a+8|0}while(a>>>0<e>>>0)}}else Og(0,b,c,d);while(0);return}function Tg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,l=0,m=0,n=0,o=0,p=0,q=0;q=r;r=r+64|0;p=q;o=k[a>>2]|0;n=a+(k[o+-8>>2]|0)|0;o=k[o+-4>>2]|0;k[p>>2]=c;k[p+4>>2]=a;k[p+8>>2]=b;k[p+12>>2]=d;d=p+16|0;a=p+20|0;b=p+24|0;e=p+28|0;f=p+32|0;g=p+40|0;h=(o|0)==(c|0);l=d;m=l+36|0;do{k[l>>2]=0;l=l+4|0}while((l|0)<(m|0));j[d+36>>1]=0;i[d+38>>0]=0;a:do if(h){k[p+48>>2]=1;Yb[k[(k[c>>2]|0)+20>>2]&3](c,p,n,n,1,0);d=(k[b>>2]|0)==1?n:0}else{Qb[k[(k[o>>2]|0)+24>>2]&3](o,p,n,1,0);switch(k[p+36>>2]|0){case 0:{d=(k[g>>2]|0)==1&(k[e>>2]|0)==1&(k[f>>2]|0)==1?k[a>>2]|0:0;break a}case 1:break;default:{d=0;break a}}if((k[b>>2]|0)!=1?!((k[g>>2]|0)==0&(k[e>>2]|0)==1&(k[f>>2]|0)==1):0){d=0;break}d=k[d>>2]|0}while(0);r=q;return d|0}function Ug(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;i[b+53>>0]=1;do if((k[b+4>>2]|0)==(d|0)){i[b+52>>0]=1;d=b+16|0;a=k[d>>2]|0;if(!a){k[d>>2]=c;k[b+24>>2]=e;k[b+36>>2]=1;if(!((e|0)==1?(k[b+48>>2]|0)==1:0))break;i[b+54>>0]=1;break}if((a|0)!=(c|0)){e=b+36|0;k[e>>2]=(k[e>>2]|0)+1;i[b+54>>0]=1;break}a=b+24|0;d=k[a>>2]|0;if((d|0)==2){k[a>>2]=e;d=e}if((d|0)==1?(k[b+48>>2]|0)==1:0)i[b+54>>0]=1}while(0);return}function Vg(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0;a:do if((a|0)==(k[b+8>>2]|0)){if((k[b+4>>2]|0)==(c|0)?(f=b+28|0,(k[f>>2]|0)!=1):0)k[f>>2]=d}else{if((a|0)!=(k[b>>2]|0)){q=k[a+12>>2]|0;h=a+16+(q<<3)|0;Xg(a+16|0,b,c,d,e);f=a+24|0;if((q|0)<=1)break;g=k[a+8>>2]|0;if((g&2|0)==0?(j=b+36|0,(k[j>>2]|0)!=1):0){if(!(g&1)){g=b+54|0;while(1){if(i[g>>0]|0)break a;if((k[j>>2]|0)==1)break a;Xg(f,b,c,d,e);f=f+8|0;if(f>>>0>=h>>>0)break a}}g=b+24|0;a=b+54|0;while(1){if(i[a>>0]|0)break a;if((k[j>>2]|0)==1?(k[g>>2]|0)==1:0)break a;Xg(f,b,c,d,e);f=f+8|0;if(f>>>0>=h>>>0)break a}}g=b+54|0;while(1){if(i[g>>0]|0)break a;Xg(f,b,c,d,e);f=f+8|0;if(f>>>0>=h>>>0)break a}}if((k[b+16>>2]|0)!=(c|0)?(p=b+20|0,(k[p>>2]|0)!=(c|0)):0){k[b+32>>2]=d;m=b+44|0;if((k[m>>2]|0)==4)break;g=k[a+12>>2]|0;h=a+16+(g<<3)|0;j=b+52|0;d=b+53|0;n=b+54|0;l=a+8|0;o=b+24|0;b:do if((g|0)>0){g=0;f=0;a=a+16|0;while(1){i[j>>0]=0;i[d>>0]=0;Wg(a,b,c,c,1,e);if(i[n>>0]|0){q=20;break b}do if(i[d>>0]|0){if(!(i[j>>0]|0))if(!(k[l>>2]&1)){f=1;q=20;break b}else{f=1;break}if((k[o>>2]|0)==1)break b;if(!(k[l>>2]&2))break b;else{g=1;f=1}}while(0);a=a+8|0;if(a>>>0>=h>>>0){q=20;break}}}else{g=0;f=0;q=20}while(0);do if((q|0)==20){if((!g?(k[p>>2]=c,c=b+40|0,k[c>>2]=(k[c>>2]|0)+1,(k[b+36>>2]|0)==1):0)?(k[o>>2]|0)==2:0){i[n>>0]=1;if(f)break}else q=24;if((q|0)==24?f:0)break;k[m>>2]=4;break a}while(0);k[m>>2]=3;break}if((d|0)==1)k[b+32>>2]=1}while(0);return}function Wg(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;h=k[a+4>>2]|0;g=h>>8;if(h&1)g=k[(k[d>>2]|0)+g>>2]|0;a=k[a>>2]|0;Yb[k[(k[a>>2]|0)+20>>2]&3](a,b,c,d+g|0,(h&2|0)!=0?e:2,f);return}function Xg(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;g=k[a+4>>2]|0;f=g>>8;if(g&1)f=k[(k[c>>2]|0)+f>>2]|0;a=k[a>>2]|0;Qb[k[(k[a>>2]|0)+24>>2]&3](a,b,c+f|0,(g&2|0)!=0?d:2,e);return}function Yg(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;a:do if((a|0)==(k[b+8>>2]|0)){if((k[b+4>>2]|0)==(c|0)?(f=b+28|0,(k[f>>2]|0)!=1):0)k[f>>2]=d}else{if((a|0)!=(k[b>>2]|0)){h=k[a+8>>2]|0;Qb[k[(k[h>>2]|0)+24>>2]&3](h,b,c,d,e);break}if((k[b+16>>2]|0)!=(c|0)?(g=b+20|0,(k[g>>2]|0)!=(c|0)):0){k[b+32>>2]=d;d=b+44|0;if((k[d>>2]|0)==4)break;f=b+52|0;i[f>>0]=0;j=b+53|0;i[j>>0]=0;a=k[a+8>>2]|0;Yb[k[(k[a>>2]|0)+20>>2]&3](a,b,c,c,1,e);if(i[j>>0]|0){if(!(i[f>>0]|0)){f=1;h=13}}else{f=0;h=13}do if((h|0)==13){k[g>>2]=c;j=b+40|0;k[j>>2]=(k[j>>2]|0)+1;if((k[b+36>>2]|0)==1?(k[b+24>>2]|0)==2:0){i[b+54>>0]=1;if(f)break}else h=16;if((h|0)==16?f:0)break;k[d>>2]=4;break a}while(0);k[d>>2]=3;break}if((d|0)==1)k[b+32>>2]=1}while(0);return}function Zg(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;do if((a|0)==(k[b+8>>2]|0)){if((k[b+4>>2]|0)==(c|0)?(g=b+28|0,(k[g>>2]|0)!=1):0)k[g>>2]=d}else if((a|0)==(k[b>>2]|0)){if((k[b+16>>2]|0)!=(c|0)?(f=b+20|0,(k[f>>2]|0)!=(c|0)):0){k[b+32>>2]=d;k[f>>2]=c;e=b+40|0;k[e>>2]=(k[e>>2]|0)+1;if((k[b+36>>2]|0)==1?(k[b+24>>2]|0)==2:0)i[b+54>>0]=1;k[b+44>>2]=4;break}if((d|0)==1)k[b+32>>2]=1}while(0);return}function _g(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0;if((a|0)==(k[b+8>>2]|0))Ug(0,b,c,d,e);else{m=b+52|0;n=i[m>>0]|0;o=b+53|0;p=i[o>>0]|0;l=k[a+12>>2]|0;g=a+16+(l<<3)|0;i[m>>0]=0;i[o>>0]=0;Wg(a+16|0,b,c,d,e,f);a:do if((l|0)>1){h=b+24|0;j=a+8|0;l=b+54|0;a=a+24|0;do{if(i[l>>0]|0)break a;if(!(i[m>>0]|0)){if((i[o>>0]|0)!=0?(k[j>>2]&1|0)==0:0)break a}else{if((k[h>>2]|0)==1)break a;if(!(k[j>>2]&2))break a}i[m>>0]=0;i[o>>0]=0;Wg(a,b,c,d,e,f);a=a+8|0}while(a>>>0<g>>>0)}while(0);i[m>>0]=n;i[o>>0]=p}return}function $g(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;if((a|0)==(k[b+8>>2]|0))Ug(0,b,c,d,e);else{a=k[a+8>>2]|0;Yb[k[(k[a>>2]|0)+20>>2]&3](a,b,c,d,e,f)}return}function ah(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;if((a|0)==(k[b+8>>2]|0))Ug(0,b,c,d,e);return}function bh(){var a=0,b=0,c=0,d=0,e=0,f=0,g=0,h=0;e=r;r=r+48|0;g=e+32|0;c=e+24|0;h=e+16|0;f=e;e=e+36|0;a=ng()|0;if((a|0)!=0?(d=k[a>>2]|0,(d|0)!=0):0){a=d+48|0;b=k[a>>2]|0;a=k[a+4>>2]|0;if(!((b&-256|0)==1126902528&(a|0)==1129074247)){k[c>>2]=k[1331];kg(321436,c)}if((b|0)==1126902529&(a|0)==1129074247)a=k[d+44>>2]|0;else a=d+80|0;k[e>>2]=a;d=k[d>>2]|0;a=k[d+4>>2]|0;if(Pb[k[(k[464>>2]|0)+16>>2]&15](464,d,e)|0){h=k[e>>2]|0;e=k[1331]|0;h=Ub[k[(k[h>>2]|0)+8>>2]&7](h)|0;k[f>>2]=e;k[f+4>>2]=a;k[f+8>>2]=h;kg(321350,f)}else{k[h>>2]=k[1331];k[h+4>>2]=a;kg(321395,h)}}kg(321474,g)}function ch(){var a=0;a=r;r=r+16|0;if(!(mb(5316,17)|0)){r=a;return}else kg(321247,a)}function dh(a){a=a|0;ab(a|0)|0;xg()}function eh(a){a=a|0;var b=0,c=0;c=(k[a>>2]|0)+-4|0;b=k[c>>2]|0;k[c>>2]=b+-1;if((b+-1|0)<0)rg((k[a>>2]|0)+-12|0);return}function fh(a){a=a|0;var b=0;b=r;r=r+16|0;Ph(a);if(!(ub(k[1329]|0,0)|0)){r=b;return}else kg(321297,b)}function gh(){var a=0;if(!(k[1332]|0))a=5380;else{a=(gb()|0)+60|0;a=k[a>>2]|0}return a|0}function hh(a){a=a|0;var b=0,c=0;b=0;while(1){if((l[321495+b>>0]|0)==(a|0)){c=2;break}b=b+1|0;if((b|0)==87){b=87;a=321583;c=5;break}}if((c|0)==2)if(!b)a=321583;else{a=321583;c=5}if((c|0)==5)while(1){c=a;while(1){a=c+1|0;if(!(i[c>>0]|0))break;else c=a}b=b+-1|0;if(!b)break;else c=5}return a|0}function ih(a){a=a|0;var b=0;if(a>>>0>4294963200){b=gh()|0;k[b>>2]=0-a;a=-1}return a|0}function jh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;f=b&255;d=(c|0)!=0;a:do if(d&(a&3|0)!=0){e=b&255;while(1){if((i[a>>0]|0)==e<<24>>24){g=6;break a}a=a+1|0;c=c+-1|0;d=(c|0)!=0;if(!(d&(a&3|0)!=0)){g=5;break}}}else g=5;while(0);if((g|0)==5)if(d)g=6;else c=0;b:do if((g|0)==6){e=b&255;if((i[a>>0]|0)!=e<<24>>24){d=ha(f,16843009)|0;c:do if(c>>>0>3)while(1){f=k[a>>2]^d;if((f&-2139062144^-2139062144)&f+-16843009)break;a=a+4|0;c=c+-4|0;if(c>>>0<=3){g=11;break c}}else g=11;while(0);if((g|0)==11)if(!c){c=0;break}while(1){if((i[a>>0]|0)==e<<24>>24)break b;a=a+1|0;c=c+-1|0;if(!c){c=0;break}}}}while(0);return ((c|0)!=0?a:0)|0}function kh(a){a=a|0;var b=0,c=0,d=0;d=a;a:do if(!(d&3))c=4;else{b=a;a=d;while(1){if(!(i[b>>0]|0))break a;b=b+1|0;a=b;if(!(a&3)){a=b;c=4;break}}}while(0);if((c|0)==4){while(1){b=k[a>>2]|0;if(!((b&-2139062144^-2139062144)&b+-16843009))a=a+4|0;else break}if((b&255)<<24>>24)do a=a+1|0;while((i[a>>0]|0)!=0)}return a-d|0}function lh(a){a=a|0;var b=0,c=0;c=(kh(a)|0)+1|0;b=Oh(c)|0;if(!b)b=0;else ki(b|0,a|0,c|0)|0;return b|0}function mh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;a:do if(!c)c=0;else{e=c;d=a;while(1){a=i[d>>0]|0;c=i[b>>0]|0;if(a<<24>>24!=c<<24>>24)break;e=e+-1|0;if(!e){c=0;break a}else{d=d+1|0;b=b+1|0}}c=(a&255)-(c&255)|0}while(0);return c|0}function nh(a,b){a=+a;b=b|0;var c=0,d=0,e=0;p[t>>3]=a;c=k[t>>2]|0;d=k[t+4>>2]|0;e=ji(c|0,d|0,52)|0;e=e&2047;switch(e|0){case 0:{if(a!=0.0){a=+nh(a*18446744073709551616.0,b);c=(k[b>>2]|0)+-64|0}else c=0;k[b>>2]=c;break}case 2047:break;default:{k[b>>2]=e+-1022;k[t>>2]=c;k[t+4>>2]=d&-2146435073|1071644672;a=+p[t>>3]}}return +a}function oh(a){a=+a;var b=0,c=0,d=0,e=0,f=0.0,g=0.0,h=0.0,i=0.0,j=0.0;p[t>>3]=a;c=k[t>>2]|0;b=k[t+4>>2]|0;d=(b|0)<0;do if(d|b>>>0<1048576){if((c|0)==0&(b&2147483647|0)==0){a=-1.0/(a*a);break}if(d){a=(a-a)/0.0;break}else{p[t>>3]=a*18014398509481984.0;b=k[t+4>>2]|0;d=k[t>>2]|0;c=-1077;e=9;break}}else if(b>>>0<=2146435071)if((c|0)==0&0==0&(b|0)==1072693248)a=0.0;else{d=c;c=-1023;e=9}while(0);if((e|0)==9){e=b+614242|0;k[t>>2]=d;k[t+4>>2]=(e&1048575)+1072079006;i=+p[t>>3]+-1.0;a=i*(i*.5);j=i/(i+2.0);g=j*j;h=g*g;p[t>>3]=i-a;d=k[t+4>>2]|0;k[t>>2]=0;k[t+4>>2]=d;f=+p[t>>3];a=j*(a+(h*(h*(h*.15313837699209373+.22222198432149784)+.3999999999940942)+g*(h*(h*(h*.14798198605116586+.1818357216161805)+.2857142874366239)+.6666666666666735)))+(i-f-a);i=f*1.4426950407214463;h=+(c+(e>>>20)|0);g=h+i;a=g+(i+(h-g)+(a*1.4426950407214463+(f+a)*1.6751713164886512e-10))}return +a}function ph(a,b){a=+a;b=b|0;return +(+nh(a,b))}function qh(a){a=a|0;a=a&65535;return (a<<8|a>>>8)&65535|0}function rh(a){a=a|0;return mi(a|0)|0}function sh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;e=r;r=r+80|0;d=e;k[a+36>>2]=5;if((k[a>>2]&64|0)==0?(k[d>>2]=k[a+60>>2],k[d+4>>2]=21505,k[d+8>>2]=e+12,(Ba(54,d|0)|0)!=0):0)i[a+75>>0]=-1;d=Bh(a,b,c)|0;r=e;return d|0}function th(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;e=r;r=r+32|0;f=e;d=e+20|0;k[f>>2]=k[a+60>>2];k[f+4>>2]=0;k[f+8>>2]=b;k[f+12>>2]=d;k[f+16>>2]=c;if((ih(Hb(140,f|0)|0)|0)<0){k[d>>2]=-1;a=-1}else a=k[d>>2]|0;r=e;return a|0}function uh(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0;j=r;r=r+16|0;h=j;g=b&255;i[h>>0]=g;d=a+16|0;e=k[d>>2]|0;if(!e)if(!(Ah(a)|0)){e=k[d>>2]|0;f=4}else c=-1;else f=4;do if((f|0)==4){d=a+20|0;f=k[d>>2]|0;if(f>>>0<e>>>0?(c=b&255,(c|0)!=(i[a+75>>0]|0)):0){k[d>>2]=f+1;i[f>>0]=g;break}if((Pb[k[a+36>>2]&15](a,h,1)|0)==1)c=l[h>>0]|0;else c=-1}while(0);r=j;return c|0}function vh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0;s=r;r=r+224|0;n=s+80|0;q=s+96|0;p=s;o=s+136|0;d=q;e=d+40|0;do{k[d>>2]=0;d=d+4|0}while((d|0)<(e|0));k[n>>2]=k[c>>2];if((Ih(0,b,n,p,q)|0)<0)c=-1;else{if((k[a+76>>2]|0)>-1)l=wh(a)|0;else l=0;c=k[a>>2]|0;m=c&32;if((i[a+74>>0]|0)<1)k[a>>2]=c&-33;c=a+48|0;if(!(k[c>>2]|0)){e=a+44|0;f=k[e>>2]|0;k[e>>2]=o;g=a+28|0;k[g>>2]=o;h=a+20|0;k[h>>2]=o;k[c>>2]=80;j=a+16|0;k[j>>2]=o+80;d=Ih(a,b,n,p,q)|0;if(f){Pb[k[a+36>>2]&15](a,0,0)|0;d=(k[h>>2]|0)==0?-1:d;k[e>>2]=f;k[c>>2]=0;k[j>>2]=0;k[g>>2]=0;k[h>>2]=0}}else d=Ih(a,b,n,p,q)|0;c=k[a>>2]|0;k[a>>2]=c|m;if(l)xh(a);c=(c&32|0)==0?d:-1}r=s;return c|0}function wh(a){a=a|0;return 0}function xh(a){a=a|0;return}function yh(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;if((k[b+76>>2]|0)>=0?(wh(b)|0)!=0:0){if((i[b+75>>0]|0)!=(a|0)?(d=b+20|0,e=k[d>>2]|0,e>>>0<(k[b+16>>2]|0)>>>0):0){k[d>>2]=e+1;i[e>>0]=a;c=a&255}else c=uh(b,a)|0;xh(b)}else g=3;do if((g|0)==3){if((i[b+75>>0]|0)!=(a|0)?(f=b+20|0,c=k[f>>2]|0,c>>>0<(k[b+16>>2]|0)>>>0):0){k[f>>2]=c+1;i[c>>0]=a;c=a&255;break}c=uh(b,a)|0}while(0);return c|0}function zh(a){a=a|0;var b=0,c=0;do if(a){if((k[a+76>>2]|0)<=-1){b=Jh(a)|0;break}c=(wh(a)|0)==0;b=Jh(a)|0;if(!c)xh(a)}else{if(!(k[1344]|0))b=0;else b=zh(k[1344]|0)|0;yb(5356);a=k[1338]|0;if(a)do{if((k[a+76>>2]|0)>-1)c=wh(a)|0;else c=0;if((k[a+20>>2]|0)>>>0>(k[a+28>>2]|0)>>>0)b=Jh(a)|0|b;if(c)xh(a);a=k[a+56>>2]|0}while((a|0)!=0);nb(5356)}while(0);return b|0}function Ah(a){a=a|0;var b=0,c=0;b=a+74|0;c=i[b>>0]|0;i[b>>0]=c+255|c;b=k[a>>2]|0;if(!(b&8)){k[a+8>>2]=0;k[a+4>>2]=0;b=k[a+44>>2]|0;k[a+28>>2]=b;k[a+20>>2]=b;k[a+16>>2]=b+(k[a+48>>2]|0);b=0}else{k[a>>2]=b|32;b=-1}return b|0}function Bh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0;p=r;r=r+48|0;m=p+16|0;l=p;d=p+32|0;n=a+28|0;e=k[n>>2]|0;k[d>>2]=e;o=a+20|0;e=(k[o>>2]|0)-e|0;k[d+4>>2]=e;k[d+8>>2]=b;k[d+12>>2]=c;i=a+60|0;j=a+44|0;b=2;e=e+c|0;while(1){if(!(k[1332]|0)){k[m>>2]=k[i>>2];k[m+4>>2]=d;k[m+8>>2]=b;g=ih(Lb(146,m|0)|0)|0}else{Ab(18,a|0);k[l>>2]=k[i>>2];k[l+4>>2]=d;k[l+8>>2]=b;g=ih(Lb(146,l|0)|0)|0;ya(0)}if((e|0)==(g|0)){e=6;break}if((g|0)<0){e=8;break}e=e-g|0;f=k[d+4>>2]|0;if(g>>>0<=f>>>0)if((b|0)==2){k[n>>2]=(k[n>>2]|0)+g;h=f;b=2}else h=f;else{h=k[j>>2]|0;k[n>>2]=h;k[o>>2]=h;h=k[d+12>>2]|0;g=g-f|0;d=d+8|0;b=b+-1|0}k[d>>2]=(k[d>>2]|0)+g;k[d+4>>2]=h-g}if((e|0)==6){m=k[j>>2]|0;k[a+16>>2]=m+(k[a+48>>2]|0);a=m;k[n>>2]=a;k[o>>2]=a}else if((e|0)==8){k[a+16>>2]=0;k[n>>2]=0;k[o>>2]=0;k[a>>2]=k[a>>2]|32;if((b|0)==2)c=0;else c=c-(k[d+4>>2]|0)|0}r=p;return c|0}function Ch(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=c+16|0;e=k[d>>2]|0;if(!e)if(!(Ah(c)|0)){e=k[d>>2]|0;f=4}else d=0;else f=4;a:do if((f|0)==4){g=c+20|0;f=k[g>>2]|0;if((e-f|0)>>>0<b>>>0){d=Pb[k[c+36>>2]&15](c,a,b)|0;break}b:do if((i[c+75>>0]|0)>-1){d=b;while(1){if(!d){e=f;d=0;break b}e=d+-1|0;if((i[a+e>>0]|0)==10)break;else d=e}if((Pb[k[c+36>>2]&15](c,a,d)|0)>>>0<d>>>0)break a;b=b-d|0;a=a+d|0;e=k[g>>2]|0}else{e=f;d=0}while(0);ki(e|0,a|0,b|0)|0;k[g>>2]=(k[g>>2]|0)+b;d=d+b|0}while(0);return d|0}function Dh(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=ha(c,b)|0;if((k[d+76>>2]|0)>-1){f=(wh(d)|0)==0;a=Ch(a,e,d)|0;if(!f)xh(d)}else a=Ch(a,e,d)|0;if((a|0)!=(e|0))c=(a>>>0)/(b>>>0)|0;return c|0}function Eh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=r;r=r+16|0;e=d;k[e>>2]=c;c=vh(a,b,e)|0;r=d;return c|0}function Fh(a){a=a|0;var b=0,c=0;b=r;r=r+16|0;c=b;k[c>>2]=k[a+60>>2];a=ih(zb(6,c|0)|0)|0;r=b;return a|0}function Gh(a,b){a=a|0;b=b|0;if(!a)a=0;else a=Hh(a,b,0)|0;return a|0}function Hh(a,b,c){a=a|0;b=b|0;c=c|0;do if(a){if(b>>>0<128){i[a>>0]=b;a=1;break}if(b>>>0<2048){i[a>>0]=b>>>6|192;i[a+1>>0]=b&63|128;a=2;break}if(b>>>0<55296|(b&-8192|0)==57344){i[a>>0]=b>>>12|224;i[a+1>>0]=b>>>6&63|128;i[a+2>>0]=b&63|128;a=3;break}if((b+-65536|0)>>>0<1048576){i[a>>0]=b>>>18|240;i[a+1>>0]=b>>>12&63|128;i[a+2>>0]=b>>>6&63|128;i[a+3>>0]=b&63|128;a=4;break}else{a=gh()|0;k[a>>2]=84;a=-1;break}}else a=1;while(0);return a|0}function Ih(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,m=0,n=0.0,o=0,q=0,s=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0;ga=r;r=r+624|0;ba=ga+24|0;da=ga+16|0;ca=ga+588|0;Y=ga+576|0;aa=ga;V=ga+536|0;fa=ga+8|0;ea=ga+528|0;M=(a|0)!=0;N=V+40|0;U=N;V=V+39|0;W=fa+4|0;X=Y+12|0;Y=Y+11|0;Z=ca;_=X;$=_-Z|0;O=-2-Z|0;P=_+2|0;Q=ba+288|0;R=ca+9|0;S=R;T=ca+8|0;w=b;b=0;g=0;f=0;a:while(1){do if((b|0)>-1)if((g|0)>(2147483647-b|0)){b=gh()|0;k[b>>2]=75;b=-1;break}else{b=g+b|0;break}while(0);g=i[w>>0]|0;if(!(g<<24>>24)){K=245;break}else h=w;b:while(1){switch(g<<24>>24){case 37:{g=h;K=9;break b}case 0:{g=h;break b}default:{}}J=h+1|0;g=i[J>>0]|0;h=J}c:do if((K|0)==9)while(1){K=0;if((i[g+1>>0]|0)!=37)break c;h=h+1|0;g=g+2|0;if((i[g>>0]|0)==37)K=9;else break}while(0);y=h-w|0;if(M?(k[a>>2]&32|0)==0:0)Ch(w,y,a)|0;if((h|0)!=(w|0)){w=g;g=y;continue}o=g+1|0;h=i[o>>0]|0;m=(h<<24>>24)+-48|0;if(m>>>0<10){J=(i[g+2>>0]|0)==36;g=J?g+3|0:o;h=i[g>>0]|0;u=J?m:-1;f=J?1:f}else{u=-1;g=o}m=h<<24>>24;d:do if((m&-32|0)==32){o=0;do{if(!(1<<m+-32&75913))break d;o=1<<(h<<24>>24)+-32|o;g=g+1|0;h=i[g>>0]|0;m=h<<24>>24}while((m&-32|0)==32)}else o=0;while(0);do if(h<<24>>24==42){m=g+1|0;h=(i[m>>0]|0)+-48|0;if(h>>>0<10?(i[g+2>>0]|0)==36:0){k[e+(h<<2)>>2]=10;f=1;g=g+3|0;h=k[d+((i[m>>0]|0)+-48<<3)>>2]|0}else{if(f){b=-1;break a}if(!M){g=m;x=o;f=0;J=0;break}f=(k[c>>2]|0)+(4-1)&~(4-1);h=k[f>>2]|0;k[c>>2]=f+4;f=0;g=m}if((h|0)<0){x=o|8192;J=0-h|0}else{x=o;J=h}}else{m=(h<<24>>24)+-48|0;if(m>>>0<10){h=0;do{h=(h*10|0)+m|0;g=g+1|0;m=(i[g>>0]|0)+-48|0}while(m>>>0<10);if((h|0)<0){b=-1;break a}else{x=o;J=h}}else{x=o;J=0}}while(0);e:do if((i[g>>0]|0)==46){m=g+1|0;h=i[m>>0]|0;if(h<<24>>24!=42){o=(h<<24>>24)+-48|0;if(o>>>0<10){g=m;h=0}else{g=m;o=0;break}while(1){h=(h*10|0)+o|0;g=g+1|0;o=(i[g>>0]|0)+-48|0;if(o>>>0>=10){o=h;break e}}}m=g+2|0;h=(i[m>>0]|0)+-48|0;if(h>>>0<10?(i[g+3>>0]|0)==36:0){k[e+(h<<2)>>2]=10;g=g+4|0;o=k[d+((i[m>>0]|0)+-48<<3)>>2]|0;break}if(f){b=-1;break a}if(M){g=(k[c>>2]|0)+(4-1)&~(4-1);o=k[g>>2]|0;k[c>>2]=g+4;g=m}else{g=m;o=0}}else o=-1;while(0);s=0;while(1){h=(i[g>>0]|0)+-65|0;if(h>>>0>57){b=-1;break a}q=g+1|0;h=i[324427+(s*58|0)+h>>0]|0;m=h&255;if((m+-1|0)>>>0<8){g=q;s=m}else{I=q;q=h;break}}if(!(q<<24>>24)){b=-1;break}h=(u|0)>-1;do if(q<<24>>24==19)if(h){b=-1;break a}else K=52;else{if(h){k[e+(u<<2)>>2]=m;G=d+(u<<3)|0;H=k[G+4>>2]|0;K=aa;k[K>>2]=k[G>>2];k[K+4>>2]=H;K=52;break}if(!M){b=0;break a}Lh(aa,m,c)}while(0);if((K|0)==52?(K=0,!M):0){w=I;g=y;continue}u=i[g>>0]|0;u=(s|0)!=0&(u&15|0)==3?u&-33:u;m=x&-65537;H=(x&8192|0)==0?x:m;f:do switch(u|0){case 110:switch(s|0){case 0:{k[k[aa>>2]>>2]=b;w=I;g=y;continue a}case 1:{k[k[aa>>2]>>2]=b;w=I;g=y;continue a}case 2:{w=k[aa>>2]|0;k[w>>2]=b;k[w+4>>2]=((b|0)<0)<<31>>31;w=I;g=y;continue a}case 3:{j[k[aa>>2]>>1]=b;w=I;g=y;continue a}case 4:{i[k[aa>>2]>>0]=b;w=I;g=y;continue a}case 6:{k[k[aa>>2]>>2]=b;w=I;g=y;continue a}case 7:{w=k[aa>>2]|0;k[w>>2]=b;k[w+4>>2]=((b|0)<0)<<31>>31;w=I;g=y;continue a}default:{w=I;g=y;continue a}}case 112:{s=H|8;o=o>>>0>8?o:8;u=120;K=64;break}case 88:case 120:{s=H;K=64;break}case 111:{m=aa;h=k[m>>2]|0;m=k[m+4>>2]|0;if((h|0)==0&(m|0)==0)g=N;else{g=N;do{g=g+-1|0;i[g>>0]=h&7|48;h=ji(h|0,m|0,3)|0;m=L}while(!((h|0)==0&(m|0)==0))}if(!(H&8)){h=H;s=0;q=324907;K=77}else{s=U-g+1|0;h=H;o=(o|0)<(s|0)?s:o;s=0;q=324907;K=77}break}case 105:case 100:{h=aa;g=k[h>>2]|0;h=k[h+4>>2]|0;if((h|0)<0){g=fi(0,0,g|0,h|0)|0;h=L;m=aa;k[m>>2]=g;k[m+4>>2]=h;m=1;q=324907;K=76;break f}if(!(H&2048)){q=H&1;m=q;q=(q|0)==0?324907:324909;K=76}else{m=1;q=324908;K=76}break}case 117:{h=aa;g=k[h>>2]|0;h=k[h+4>>2]|0;m=0;q=324907;K=76;break}case 99:{i[V>>0]=k[aa>>2];w=V;h=1;s=0;u=324907;g=N;break}case 109:{g=gh()|0;g=hh(k[g>>2]|0)|0;K=82;break}case 115:{g=k[aa>>2]|0;g=(g|0)!=0?g:324917;K=82;break}case 67:{k[fa>>2]=k[aa>>2];k[W>>2]=0;k[aa>>2]=fa;o=-1;K=86;break}case 83:{if(!o){Nh(a,32,J,0,H);g=0;K=98}else K=86;break}case 65:case 71:case 70:case 69:case 97:case 103:case 102:case 101:{n=+p[aa>>3];k[da>>2]=0;p[t>>3]=n;if((k[t+4>>2]|0)>=0)if(!(H&2048)){G=H&1;F=G;G=(G|0)==0?324925:324930}else{F=1;G=324927}else{n=-n;F=1;G=324924}p[t>>3]=n;E=k[t+4>>2]&2146435072;do if(E>>>0<2146435072|(E|0)==2146435072&0<0){v=+ph(n,da)*2.0;h=v!=0.0;if(h)k[da>>2]=(k[da>>2]|0)+-1;C=u|32;if((C|0)==97){w=u&32;y=(w|0)==0?G:G+9|0;x=F|2;g=12-o|0;do if(!(o>>>0>11|(g|0)==0)){n=8.0;do{g=g+-1|0;n=n*16.0}while((g|0)!=0);if((i[y>>0]|0)==45){n=-(n+(-v-n));break}else{n=v+n-n;break}}else n=v;while(0);h=k[da>>2]|0;g=(h|0)<0?0-h|0:h;g=Mh(g,((g|0)<0)<<31>>31,X)|0;if((g|0)==(X|0)){i[Y>>0]=48;g=Y}i[g+-1>>0]=(h>>31&2)+43;s=g+-2|0;i[s>>0]=u+15;q=(o|0)<1;m=(H&8|0)==0;h=ca;while(1){G=~~n;g=h+1|0;i[h>>0]=l[324891+G>>0]|w;n=(n-+(G|0))*16.0;do if((g-Z|0)==1){if(m&(q&n==0.0))break;i[g>>0]=46;g=h+2|0}while(0);if(!(n!=0.0))break;else h=g}o=(o|0)!=0&(O+g|0)<(o|0)?P+o-s|0:$-s+g|0;m=o+x|0;Nh(a,32,J,m,H);if(!(k[a>>2]&32))Ch(y,x,a)|0;Nh(a,48,J,m,H^65536);g=g-Z|0;if(!(k[a>>2]&32))Ch(ca,g,a)|0;h=_-s|0;Nh(a,48,o-(g+h)|0,0,0);if(!(k[a>>2]&32))Ch(s,h,a)|0;Nh(a,32,J,m,H^8192);g=(m|0)<(J|0)?J:m;break}g=(o|0)<0?6:o;if(h){h=(k[da>>2]|0)+-28|0;k[da>>2]=h;n=v*268435456.0}else{n=v;h=k[da>>2]|0}E=(h|0)<0?ba:Q;D=E;h=E;do{B=~~n>>>0;k[h>>2]=B;h=h+4|0;n=(n-+(B>>>0))*1.0e9}while(n!=0.0);m=h;h=k[da>>2]|0;if((h|0)>0){q=E;while(1){s=(h|0)>29?29:h;o=m+-4|0;do if(o>>>0<q>>>0)o=q;else{h=0;do{B=hi(k[o>>2]|0,0,s|0)|0;B=ii(B|0,L|0,h|0,0)|0;h=L;A=ui(B|0,h|0,1e9,0)|0;k[o>>2]=A;h=ti(B|0,h|0,1e9,0)|0;o=o+-4|0}while(o>>>0>=q>>>0);if(!h){o=q;break}o=q+-4|0;k[o>>2]=h}while(0);while(1){if(m>>>0<=o>>>0)break;h=m+-4|0;if(!(k[h>>2]|0))m=h;else break}h=(k[da>>2]|0)-s|0;k[da>>2]=h;if((h|0)>0)q=o;else break}}else o=E;if((h|0)<0){y=((g+25|0)/9|0)+1|0;z=(C|0)==102;w=o;while(1){x=0-h|0;x=(x|0)>9?9:x;do if(w>>>0<m>>>0){h=(1<<x)+-1|0;q=1e9>>>x;o=0;s=w;do{B=k[s>>2]|0;k[s>>2]=(B>>>x)+o;o=ha(B&h,q)|0;s=s+4|0}while(s>>>0<m>>>0);h=(k[w>>2]|0)==0?w+4|0:w;if(!o){o=h;break}k[m>>2]=o;o=h;m=m+4|0}else o=(k[w>>2]|0)==0?w+4|0:w;while(0);h=z?E:o;m=(m-h>>2|0)>(y|0)?h+(y<<2)|0:m;h=(k[da>>2]|0)+x|0;k[da>>2]=h;if((h|0)>=0){w=o;break}else w=o}}else w=o;do if(w>>>0<m>>>0){h=(D-w>>2)*9|0;q=k[w>>2]|0;if(q>>>0<10)break;else o=10;do{o=o*10|0;h=h+1|0}while(q>>>0>=o>>>0)}else h=0;while(0);A=(C|0)==103;B=(g|0)!=0;o=g-((C|0)!=102?h:0)+((B&A)<<31>>31)|0;if((o|0)<(((m-D>>2)*9|0)+-9|0)){s=o+9216|0;z=(s|0)/9|0;o=E+(z+-1023<<2)|0;s=((s|0)%9|0)+1|0;if((s|0)<9){q=10;do{q=q*10|0;s=s+1|0}while((s|0)!=9)}else q=10;x=k[o>>2]|0;y=(x>>>0)%(q>>>0)|0;if((y|0)==0?(E+(z+-1022<<2)|0)==(m|0):0)q=w;else K=163;do if((K|0)==163){K=0;v=(((x>>>0)/(q>>>0)|0)&1|0)==0?9007199254740992.0:9007199254740994.0;s=(q|0)/2|0;do if(y>>>0<s>>>0)n=.5;else{if((y|0)==(s|0)?(E+(z+-1022<<2)|0)==(m|0):0){n=1.0;break}n=1.5}while(0);do if(F){if((i[G>>0]|0)!=45)break;v=-v;n=-n}while(0);s=x-y|0;k[o>>2]=s;if(!(v+n!=v)){q=w;break}C=s+q|0;k[o>>2]=C;if(C>>>0>999999999){h=w;while(1){q=o+-4|0;k[o>>2]=0;if(q>>>0<h>>>0){h=h+-4|0;k[h>>2]=0}C=(k[q>>2]|0)+1|0;k[q>>2]=C;if(C>>>0>999999999)o=q;else{w=h;o=q;break}}}h=(D-w>>2)*9|0;s=k[w>>2]|0;if(s>>>0<10){q=w;break}else q=10;do{q=q*10|0;h=h+1|0}while(s>>>0>=q>>>0);q=w}while(0);C=o+4|0;w=q;m=m>>>0>C>>>0?C:m}y=0-h|0;while(1){if(m>>>0<=w>>>0){z=0;C=m;break}o=m+-4|0;if(!(k[o>>2]|0))m=o;else{z=1;C=m;break}}do if(A){g=(B&1^1)+g|0;if((g|0)>(h|0)&(h|0)>-5){u=u+-1|0;g=g+-1-h|0}else{u=u+-2|0;g=g+-1|0}m=H&8;if(m)break;do if(z){m=k[C+-4>>2]|0;if(!m){o=9;break}if(!((m>>>0)%10|0)){q=10;o=0}else{o=0;break}do{q=q*10|0;o=o+1|0}while(((m>>>0)%(q>>>0)|0|0)==0)}else o=9;while(0);m=((C-D>>2)*9|0)+-9|0;if((u|32|0)==102){m=m-o|0;m=(m|0)<0?0:m;g=(g|0)<(m|0)?g:m;m=0;break}else{m=m+h-o|0;m=(m|0)<0?0:m;g=(g|0)<(m|0)?g:m;m=0;break}}else m=H&8;while(0);x=g|m;q=(x|0)!=0&1;s=(u|32|0)==102;if(s){h=(h|0)>0?h:0;u=0}else{o=(h|0)<0?y:h;o=Mh(o,((o|0)<0)<<31>>31,X)|0;if((_-o|0)<2)do{o=o+-1|0;i[o>>0]=48}while((_-o|0)<2);i[o+-1>>0]=(h>>31&2)+43;D=o+-2|0;i[D>>0]=u;h=_-D|0;u=D}y=F+1+g+q+h|0;Nh(a,32,J,y,H);if(!(k[a>>2]&32))Ch(G,F,a)|0;Nh(a,48,J,y,H^65536);do if(s){o=w>>>0>E>>>0?E:w;h=o;do{m=Mh(k[h>>2]|0,0,R)|0;do if((h|0)==(o|0)){if((m|0)!=(R|0))break;i[T>>0]=48;m=T}else{if(m>>>0<=ca>>>0)break;do{m=m+-1|0;i[m>>0]=48}while(m>>>0>ca>>>0)}while(0);if(!(k[a>>2]&32))Ch(m,S-m|0,a)|0;h=h+4|0}while(h>>>0<=E>>>0);do if(x){if(k[a>>2]&32)break;Ch(324959,1,a)|0}while(0);if((g|0)>0&h>>>0<C>>>0){m=h;while(1){h=Mh(k[m>>2]|0,0,R)|0;if(h>>>0>ca>>>0)do{h=h+-1|0;i[h>>0]=48}while(h>>>0>ca>>>0);if(!(k[a>>2]&32))Ch(h,(g|0)>9?9:g,a)|0;m=m+4|0;h=g+-9|0;if(!((g|0)>9&m>>>0<C>>>0)){g=h;break}else g=h}}Nh(a,48,g+9|0,9,0)}else{s=z?C:w+4|0;if((g|0)>-1){q=(m|0)==0;o=w;do{h=Mh(k[o>>2]|0,0,R)|0;if((h|0)==(R|0)){i[T>>0]=48;h=T}do if((o|0)==(w|0)){m=h+1|0;if(!(k[a>>2]&32))Ch(h,1,a)|0;if(q&(g|0)<1){h=m;break}if(k[a>>2]&32){h=m;break}Ch(324959,1,a)|0;h=m}else{if(h>>>0<=ca>>>0)break;do{h=h+-1|0;i[h>>0]=48}while(h>>>0>ca>>>0)}while(0);m=S-h|0;if(!(k[a>>2]&32))Ch(h,(g|0)>(m|0)?m:g,a)|0;g=g-m|0;o=o+4|0}while(o>>>0<s>>>0&(g|0)>-1)}Nh(a,48,g+18|0,18,0);if(k[a>>2]&32)break;Ch(u,_-u|0,a)|0}while(0);Nh(a,32,J,y,H^8192);g=(y|0)<(J|0)?J:y}else{s=(u&32|0)!=0;q=n!=n|0.0!=0.0;h=q?0:F;o=h+3|0;Nh(a,32,J,o,m);g=k[a>>2]|0;if(!(g&32)){Ch(G,h,a)|0;g=k[a>>2]|0}if(!(g&32))Ch(q?(s?324951:324955):s?324943:324947,3,a)|0;Nh(a,32,J,o,H^8192);g=(o|0)<(J|0)?J:o}while(0);w=I;continue a}default:{m=H;h=o;s=0;u=324907;g=N}}while(0);g:do if((K|0)==64){m=aa;h=k[m>>2]|0;m=k[m+4>>2]|0;q=u&32;if(!((h|0)==0&(m|0)==0)){g=N;do{g=g+-1|0;i[g>>0]=l[324891+(h&15)>>0]|q;h=ji(h|0,m|0,4)|0;m=L}while(!((h|0)==0&(m|0)==0));K=aa;if((s&8|0)==0|(k[K>>2]|0)==0&(k[K+4>>2]|0)==0){h=s;s=0;q=324907;K=77}else{h=s;s=2;q=324907+(u>>4)|0;K=77}}else{g=N;h=s;s=0;q=324907;K=77}}else if((K|0)==76){g=Mh(g,h,N)|0;h=H;s=m;K=77}else if((K|0)==82){K=0;H=jh(g,0,o)|0;G=(H|0)==0;w=g;h=G?o:H-g|0;s=0;u=324907;g=G?g+o|0:H}else if((K|0)==86){K=0;h=0;g=0;q=k[aa>>2]|0;while(1){m=k[q>>2]|0;if(!m)break;g=Gh(ea,m)|0;if((g|0)<0|g>>>0>(o-h|0)>>>0)break;h=g+h|0;if(o>>>0>h>>>0)q=q+4|0;else break}if((g|0)<0){b=-1;break a}Nh(a,32,J,h,H);if(!h){g=0;K=98}else{m=0;o=k[aa>>2]|0;while(1){g=k[o>>2]|0;if(!g){g=h;K=98;break g}g=Gh(ea,g)|0;m=g+m|0;if((m|0)>(h|0)){g=h;K=98;break g}if(!(k[a>>2]&32))Ch(ea,g,a)|0;if(m>>>0>=h>>>0){g=h;K=98;break}else o=o+4|0}}}while(0);if((K|0)==98){K=0;Nh(a,32,J,g,H^8192);w=I;g=(J|0)>(g|0)?J:g;continue}if((K|0)==77){K=0;m=(o|0)>-1?h&-65537:h;h=aa;h=(k[h>>2]|0)!=0|(k[h+4>>2]|0)!=0;if((o|0)!=0|h){h=(h&1^1)+(U-g)|0;w=g;h=(o|0)>(h|0)?o:h;u=q;g=N}else{w=N;h=0;u=q;g=N}}q=g-w|0;h=(h|0)<(q|0)?q:h;o=s+h|0;g=(J|0)<(o|0)?o:J;Nh(a,32,g,o,m);if(!(k[a>>2]&32))Ch(u,s,a)|0;Nh(a,48,g,o,m^65536);Nh(a,48,h,q,0);if(!(k[a>>2]&32))Ch(w,q,a)|0;Nh(a,32,g,o,m^8192);w=I}h:do if((K|0)==245)if(!a)if(f){b=1;while(1){f=k[e+(b<<2)>>2]|0;if(!f)break;Lh(d+(b<<3)|0,f,c);b=b+1|0;if((b|0)>=10){b=1;break h}}if((b|0)<10)while(1){if(k[e+(b<<2)>>2]|0){b=-1;break h}b=b+1|0;if((b|0)>=10){b=1;break}}else b=1}else b=0;while(0);r=ga;return b|0}function Jh(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=a+20|0;f=a+28|0;if((k[b>>2]|0)>>>0>(k[f>>2]|0)>>>0?(Pb[k[a+36>>2]&15](a,0,0)|0,(k[b>>2]|0)==0):0)b=-1;else{g=a+4|0;c=k[g>>2]|0;d=a+8|0;e=k[d>>2]|0;if(c>>>0<e>>>0)Pb[k[a+40>>2]&15](a,c-e|0,1)|0;k[a+16>>2]=0;k[f>>2]=0;k[b>>2]=0;k[d>>2]=0;k[g>>2]=0;b=0}return b|0}function Kh(a){a=a|0;if(!(k[a+68>>2]|0))xh(a);return}function Lh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0.0;a:do if(b>>>0<=20)do switch(b|0){case 9:{d=(k[c>>2]|0)+(4-1)&~(4-1);b=k[d>>2]|0;k[c>>2]=d+4;k[a>>2]=b;break a}case 10:{d=(k[c>>2]|0)+(4-1)&~(4-1);b=k[d>>2]|0;k[c>>2]=d+4;d=a;k[d>>2]=b;k[d+4>>2]=((b|0)<0)<<31>>31;break a}case 11:{d=(k[c>>2]|0)+(4-1)&~(4-1);b=k[d>>2]|0;k[c>>2]=d+4;d=a;k[d>>2]=b;k[d+4>>2]=0;break a}case 12:{d=(k[c>>2]|0)+(8-1)&~(8-1);b=d;e=k[b>>2]|0;b=k[b+4>>2]|0;k[c>>2]=d+8;d=a;k[d>>2]=e;k[d+4>>2]=b;break a}case 13:{e=(k[c>>2]|0)+(4-1)&~(4-1);d=k[e>>2]|0;k[c>>2]=e+4;d=(d&65535)<<16>>16;e=a;k[e>>2]=d;k[e+4>>2]=((d|0)<0)<<31>>31;break a}case 14:{e=(k[c>>2]|0)+(4-1)&~(4-1);d=k[e>>2]|0;k[c>>2]=e+4;e=a;k[e>>2]=d&65535;k[e+4>>2]=0;break a}case 15:{e=(k[c>>2]|0)+(4-1)&~(4-1);d=k[e>>2]|0;k[c>>2]=e+4;d=(d&255)<<24>>24;e=a;k[e>>2]=d;k[e+4>>2]=((d|0)<0)<<31>>31;break a}case 16:{e=(k[c>>2]|0)+(4-1)&~(4-1);d=k[e>>2]|0;k[c>>2]=e+4;e=a;k[e>>2]=d&255;k[e+4>>2]=0;break a}case 17:{e=(k[c>>2]|0)+(8-1)&~(8-1);f=+p[e>>3];k[c>>2]=e+8;p[a>>3]=f;break a}case 18:{e=(k[c>>2]|0)+(8-1)&~(8-1);f=+p[e>>3];k[c>>2]=e+8;p[a>>3]=f;break a}default:break a}while(0);while(0);return}function Mh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if(b>>>0>0|(b|0)==0&a>>>0>4294967295)while(1){d=ui(a|0,b|0,10,0)|0;c=c+-1|0;i[c>>0]=d|48;d=ti(a|0,b|0,10,0)|0;if(b>>>0>9|(b|0)==9&a>>>0>4294967295){a=d;b=L}else{a=d;break}}if(a)while(1){c=c+-1|0;i[c>>0]=(a>>>0)%10|0|48;if(a>>>0<10)break;else a=(a>>>0)/10|0}return c|0}function Nh(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;h=r;r=r+256|0;g=h;do if((c|0)>(d|0)&(e&73728|0)==0){e=c-d|0;gi(g|0,b|0,(e>>>0>256?256:e)|0)|0;b=k[a>>2]|0;f=(b&32|0)==0;if(e>>>0>255){d=c-d|0;do{if(f){Ch(g,256,a)|0;b=k[a>>2]|0}e=e+-256|0;f=(b&32|0)==0}while(e>>>0>255);if(f)e=d&255;else break}else if(!f)break;Ch(g,e,a)|0}while(0);r=h;return}function Oh(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;do if(a>>>0<245){o=a>>>0<11?16:a+11&-8;a=o>>>3;h=k[1402]|0;c=h>>>a;if(c&3){a=(c&1^1)+a|0;d=a<<1;c=5648+(d<<2)|0;d=5648+(d+2<<2)|0;e=k[d>>2]|0;f=e+8|0;g=k[f>>2]|0;do if((c|0)!=(g|0)){if(g>>>0<(k[1406]|0)>>>0)Fa();b=g+12|0;if((k[b>>2]|0)==(e|0)){k[b>>2]=c;k[d>>2]=g;break}else Fa()}else k[1402]=h&~(1<<a);while(0);M=a<<3;k[e+4>>2]=M|3;M=e+(M|4)|0;k[M>>2]=k[M>>2]|1;M=f;return M|0}g=k[1404]|0;if(o>>>0>g>>>0){if(c){d=2<<a;d=c<<a&(d|0-d);d=(d&0-d)+-1|0;i=d>>>12&16;d=d>>>i;e=d>>>5&8;d=d>>>e;f=d>>>2&4;d=d>>>f;c=d>>>1&2;d=d>>>c;a=d>>>1&1;a=(e|i|f|c|a)+(d>>>a)|0;d=a<<1;c=5648+(d<<2)|0;d=5648+(d+2<<2)|0;f=k[d>>2]|0;i=f+8|0;e=k[i>>2]|0;do if((c|0)!=(e|0)){if(e>>>0<(k[1406]|0)>>>0)Fa();b=e+12|0;if((k[b>>2]|0)==(f|0)){k[b>>2]=c;k[d>>2]=e;j=k[1404]|0;break}else Fa()}else{k[1402]=h&~(1<<a);j=g}while(0);M=a<<3;g=M-o|0;k[f+4>>2]=o|3;h=f+o|0;k[f+(o|4)>>2]=g|1;k[f+M>>2]=g;if(j){e=k[1407]|0;c=j>>>3;b=c<<1;d=5648+(b<<2)|0;a=k[1402]|0;c=1<<c;if(a&c){a=5648+(b+2<<2)|0;b=k[a>>2]|0;if(b>>>0<(k[1406]|0)>>>0)Fa();else{l=a;m=b}}else{k[1402]=a|c;l=5648+(b+2<<2)|0;m=d}k[l>>2]=e;k[m+12>>2]=e;k[e+8>>2]=m;k[e+12>>2]=d}k[1404]=g;k[1407]=h;M=i;return M|0}a=k[1403]|0;if(a){c=(a&0-a)+-1|0;L=c>>>12&16;c=c>>>L;K=c>>>5&8;c=c>>>K;M=c>>>2&4;c=c>>>M;a=c>>>1&2;c=c>>>a;d=c>>>1&1;d=k[5912+((K|L|M|a|d)+(c>>>d)<<2)>>2]|0;c=(k[d+4>>2]&-8)-o|0;a=d;while(1){b=k[a+16>>2]|0;if(!b){b=k[a+20>>2]|0;if(!b){i=c;break}}a=(k[b+4>>2]&-8)-o|0;M=a>>>0<c>>>0;c=M?a:c;a=b;d=M?b:d}f=k[1406]|0;if(d>>>0<f>>>0)Fa();h=d+o|0;if(d>>>0>=h>>>0)Fa();g=k[d+24>>2]|0;c=k[d+12>>2]|0;do if((c|0)==(d|0)){a=d+20|0;b=k[a>>2]|0;if(!b){a=d+16|0;b=k[a>>2]|0;if(!b){n=0;break}}while(1){c=b+20|0;e=k[c>>2]|0;if(e){b=e;a=c;continue}c=b+16|0;e=k[c>>2]|0;if(!e)break;else{b=e;a=c}}if(a>>>0<f>>>0)Fa();else{k[a>>2]=0;n=b;break}}else{e=k[d+8>>2]|0;if(e>>>0<f>>>0)Fa();b=e+12|0;if((k[b>>2]|0)!=(d|0))Fa();a=c+8|0;if((k[a>>2]|0)==(d|0)){k[b>>2]=c;k[a>>2]=e;n=c;break}else Fa()}while(0);do if(g){b=k[d+28>>2]|0;a=5912+(b<<2)|0;if((d|0)==(k[a>>2]|0)){k[a>>2]=n;if(!n){k[1403]=k[1403]&~(1<<b);break}}else{if(g>>>0<(k[1406]|0)>>>0)Fa();b=g+16|0;if((k[b>>2]|0)==(d|0))k[b>>2]=n;else k[g+20>>2]=n;if(!n)break}a=k[1406]|0;if(n>>>0<a>>>0)Fa();k[n+24>>2]=g;b=k[d+16>>2]|0;do if(b)if(b>>>0<a>>>0)Fa();else{k[n+16>>2]=b;k[b+24>>2]=n;break}while(0);b=k[d+20>>2]|0;if(b)if(b>>>0<(k[1406]|0)>>>0)Fa();else{k[n+20>>2]=b;k[b+24>>2]=n;break}}while(0);if(i>>>0<16){M=i+o|0;k[d+4>>2]=M|3;M=d+(M+4)|0;k[M>>2]=k[M>>2]|1}else{k[d+4>>2]=o|3;k[d+(o|4)>>2]=i|1;k[d+(i+o)>>2]=i;b=k[1404]|0;if(b){f=k[1407]|0;c=b>>>3;b=c<<1;e=5648+(b<<2)|0;a=k[1402]|0;c=1<<c;if(a&c){b=5648+(b+2<<2)|0;a=k[b>>2]|0;if(a>>>0<(k[1406]|0)>>>0)Fa();else{p=b;q=a}}else{k[1402]=a|c;p=5648+(b+2<<2)|0;q=e}k[p>>2]=f;k[q+12>>2]=f;k[f+8>>2]=q;k[f+12>>2]=e}k[1404]=i;k[1407]=h}M=d+8|0;return M|0}else q=o}else q=o}else if(a>>>0<=4294967231){a=a+11|0;m=a&-8;l=k[1403]|0;if(l){c=0-m|0;a=a>>>8;if(a)if(m>>>0>16777215)j=31;else{q=(a+1048320|0)>>>16&8;v=a<<q;p=(v+520192|0)>>>16&4;v=v<<p;j=(v+245760|0)>>>16&2;j=14-(p|q|j)+(v<<j>>>15)|0;j=m>>>(j+7|0)&1|j<<1}else j=0;a=k[5912+(j<<2)>>2]|0;a:do if(!a){e=0;a=0;v=86}else{g=c;e=0;h=m<<((j|0)==31?0:25-(j>>>1)|0);i=a;a=0;while(1){f=k[i+4>>2]&-8;c=f-m|0;if(c>>>0<g>>>0)if((f|0)==(m|0)){f=i;a=i;v=90;break a}else a=i;else c=g;v=k[i+20>>2]|0;i=k[i+16+(h>>>31<<2)>>2]|0;e=(v|0)==0|(v|0)==(i|0)?e:v;if(!i){v=86;break}else{g=c;h=h<<1}}}while(0);if((v|0)==86){if((e|0)==0&(a|0)==0){a=2<<j;a=l&(a|0-a);if(!a){q=m;break}a=(a&0-a)+-1|0;n=a>>>12&16;a=a>>>n;l=a>>>5&8;a=a>>>l;p=a>>>2&4;a=a>>>p;q=a>>>1&2;a=a>>>q;e=a>>>1&1;e=k[5912+((l|n|p|q|e)+(a>>>e)<<2)>>2]|0;a=0}if(!e){h=c;i=a}else{f=e;v=90}}if((v|0)==90)while(1){v=0;q=(k[f+4>>2]&-8)-m|0;e=q>>>0<c>>>0;c=e?q:c;a=e?f:a;e=k[f+16>>2]|0;if(e){f=e;v=90;continue}f=k[f+20>>2]|0;if(!f){h=c;i=a;break}else v=90}if((i|0)!=0?h>>>0<((k[1404]|0)-m|0)>>>0:0){e=k[1406]|0;if(i>>>0<e>>>0)Fa();g=i+m|0;if(i>>>0>=g>>>0)Fa();f=k[i+24>>2]|0;c=k[i+12>>2]|0;do if((c|0)==(i|0)){a=i+20|0;b=k[a>>2]|0;if(!b){a=i+16|0;b=k[a>>2]|0;if(!b){o=0;break}}while(1){c=b+20|0;d=k[c>>2]|0;if(d){b=d;a=c;continue}c=b+16|0;d=k[c>>2]|0;if(!d)break;else{b=d;a=c}}if(a>>>0<e>>>0)Fa();else{k[a>>2]=0;o=b;break}}else{d=k[i+8>>2]|0;if(d>>>0<e>>>0)Fa();b=d+12|0;if((k[b>>2]|0)!=(i|0))Fa();a=c+8|0;if((k[a>>2]|0)==(i|0)){k[b>>2]=c;k[a>>2]=d;o=c;break}else Fa()}while(0);do if(f){b=k[i+28>>2]|0;a=5912+(b<<2)|0;if((i|0)==(k[a>>2]|0)){k[a>>2]=o;if(!o){k[1403]=k[1403]&~(1<<b);break}}else{if(f>>>0<(k[1406]|0)>>>0)Fa();b=f+16|0;if((k[b>>2]|0)==(i|0))k[b>>2]=o;else k[f+20>>2]=o;if(!o)break}a=k[1406]|0;if(o>>>0<a>>>0)Fa();k[o+24>>2]=f;b=k[i+16>>2]|0;do if(b)if(b>>>0<a>>>0)Fa();else{k[o+16>>2]=b;k[b+24>>2]=o;break}while(0);b=k[i+20>>2]|0;if(b)if(b>>>0<(k[1406]|0)>>>0)Fa();else{k[o+20>>2]=b;k[b+24>>2]=o;break}}while(0);b:do if(h>>>0>=16){k[i+4>>2]=m|3;k[i+(m|4)>>2]=h|1;k[i+(h+m)>>2]=h;b=h>>>3;if(h>>>0<256){a=b<<1;d=5648+(a<<2)|0;c=k[1402]|0;b=1<<b;if(c&b){b=5648+(a+2<<2)|0;a=k[b>>2]|0;if(a>>>0<(k[1406]|0)>>>0)Fa();else{s=b;t=a}}else{k[1402]=c|b;s=5648+(a+2<<2)|0;t=d}k[s>>2]=g;k[t+12>>2]=g;k[i+(m+8)>>2]=t;k[i+(m+12)>>2]=d;break}b=h>>>8;if(b)if(h>>>0>16777215)d=31;else{L=(b+1048320|0)>>>16&8;M=b<<L;K=(M+520192|0)>>>16&4;M=M<<K;d=(M+245760|0)>>>16&2;d=14-(K|L|d)+(M<<d>>>15)|0;d=h>>>(d+7|0)&1|d<<1}else d=0;b=5912+(d<<2)|0;k[i+(m+28)>>2]=d;k[i+(m+20)>>2]=0;k[i+(m+16)>>2]=0;a=k[1403]|0;c=1<<d;if(!(a&c)){k[1403]=a|c;k[b>>2]=g;k[i+(m+24)>>2]=b;k[i+(m+12)>>2]=g;k[i+(m+8)>>2]=g;break}b=k[b>>2]|0;c:do if((k[b+4>>2]&-8|0)!=(h|0)){d=h<<((d|0)==31?0:25-(d>>>1)|0);while(1){a=b+16+(d>>>31<<2)|0;c=k[a>>2]|0;if(!c)break;if((k[c+4>>2]&-8|0)==(h|0)){y=c;break c}else{d=d<<1;b=c}}if(a>>>0<(k[1406]|0)>>>0)Fa();else{k[a>>2]=g;k[i+(m+24)>>2]=b;k[i+(m+12)>>2]=g;k[i+(m+8)>>2]=g;break b}}else y=b;while(0);b=y+8|0;a=k[b>>2]|0;M=k[1406]|0;if(a>>>0>=M>>>0&y>>>0>=M>>>0){k[a+12>>2]=g;k[b>>2]=g;k[i+(m+8)>>2]=a;k[i+(m+12)>>2]=y;k[i+(m+24)>>2]=0;break}else Fa()}else{M=h+m|0;k[i+4>>2]=M|3;M=i+(M+4)|0;k[M>>2]=k[M>>2]|1}while(0);M=i+8|0;return M|0}else q=m}else q=m}else q=-1;while(0);c=k[1404]|0;if(c>>>0>=q>>>0){b=c-q|0;a=k[1407]|0;if(b>>>0>15){k[1407]=a+q;k[1404]=b;k[a+(q+4)>>2]=b|1;k[a+c>>2]=b;k[a+4>>2]=q|3}else{k[1404]=0;k[1407]=0;k[a+4>>2]=c|3;M=a+(c+4)|0;k[M>>2]=k[M>>2]|1}M=a+8|0;return M|0}a=k[1405]|0;if(a>>>0>q>>>0){L=a-q|0;k[1405]=L;M=k[1408]|0;k[1408]=M+q;k[M+(q+4)>>2]=L|1;k[M+4>>2]=q|3;M=M+8|0;return M|0}do if(!(k[1520]|0)){a=_a(30)|0;if(!(a+-1&a)){k[1522]=a;k[1521]=a;k[1523]=-1;k[1524]=-1;k[1525]=0;k[1513]=0;y=(Db(0)|0)&-16^1431655768;k[1520]=y;break}else Fa()}while(0);i=q+48|0;h=k[1522]|0;j=q+47|0;g=h+j|0;h=0-h|0;l=g&h;if(l>>>0<=q>>>0){M=0;return M|0}a=k[1512]|0;if((a|0)!=0?(t=k[1510]|0,y=t+l|0,y>>>0<=t>>>0|y>>>0>a>>>0):0){M=0;return M|0}d:do if(!(k[1513]&4)){a=k[1408]|0;e:do if(a){e=6056;while(1){c=k[e>>2]|0;if(c>>>0<=a>>>0?(r=e+4|0,(c+(k[r>>2]|0)|0)>>>0>a>>>0):0){f=e;a=r;break}e=k[e+8>>2]|0;if(!e){v=174;break e}}c=g-(k[1405]|0)&h;if(c>>>0<2147483647){e=Ua(c|0)|0;y=(e|0)==((k[f>>2]|0)+(k[a>>2]|0)|0);a=y?c:0;if(y){if((e|0)!=(-1|0)){w=e;p=a;v=194;break d}}else v=184}else a=0}else v=174;while(0);do if((v|0)==174){f=Ua(0)|0;if((f|0)!=(-1|0)){a=f;c=k[1521]|0;e=c+-1|0;if(!(e&a))c=l;else c=l-a+(e+a&0-c)|0;a=k[1510]|0;e=a+c|0;if(c>>>0>q>>>0&c>>>0<2147483647){y=k[1512]|0;if((y|0)!=0?e>>>0<=a>>>0|e>>>0>y>>>0:0){a=0;break}e=Ua(c|0)|0;y=(e|0)==(f|0);a=y?c:0;if(y){w=f;p=a;v=194;break d}else v=184}else a=0}else a=0}while(0);f:do if((v|0)==184){f=0-c|0;do if(i>>>0>c>>>0&(c>>>0<2147483647&(e|0)!=(-1|0))?(u=k[1522]|0,u=j-c+u&0-u,u>>>0<2147483647):0)if((Ua(u|0)|0)==(-1|0)){Ua(f|0)|0;break f}else{c=u+c|0;break}while(0);if((e|0)!=(-1|0)){w=e;p=c;v=194;break d}}while(0);k[1513]=k[1513]|4;v=191}else{a=0;v=191}while(0);if((((v|0)==191?l>>>0<2147483647:0)?(w=Ua(l|0)|0,x=Ua(0)|0,w>>>0<x>>>0&((w|0)!=(-1|0)&(x|0)!=(-1|0))):0)?(z=x-w|0,A=z>>>0>(q+40|0)>>>0,A):0){p=A?z:a;v=194}if((v|0)==194){a=(k[1510]|0)+p|0;k[1510]=a;if(a>>>0>(k[1511]|0)>>>0)k[1511]=a;g=k[1408]|0;g:do if(g){f=6056;do{a=k[f>>2]|0;c=f+4|0;e=k[c>>2]|0;if((w|0)==(a+e|0)){B=a;C=c;D=e;E=f;v=204;break}f=k[f+8>>2]|0}while((f|0)!=0);if(((v|0)==204?(k[E+12>>2]&8|0)==0:0)?g>>>0<w>>>0&g>>>0>=B>>>0:0){k[C>>2]=D+p;M=(k[1405]|0)+p|0;L=g+8|0;L=(L&7|0)==0?0:0-L&7;K=M-L|0;k[1408]=g+L;k[1405]=K;k[g+(L+4)>>2]=K|1;k[g+(M+4)>>2]=40;k[1409]=k[1524];break}a=k[1406]|0;if(w>>>0<a>>>0){k[1406]=w;a=w}c=w+p|0;f=6056;while(1){if((k[f>>2]|0)==(c|0)){e=f;c=f;v=212;break}f=k[f+8>>2]|0;if(!f){c=6056;break}}if((v|0)==212)if(!(k[c+12>>2]&8)){k[e>>2]=w;n=c+4|0;k[n>>2]=(k[n>>2]|0)+p;n=w+8|0;n=(n&7|0)==0?0:0-n&7;j=w+(p+8)|0;j=(j&7|0)==0?0:0-j&7;b=w+(j+p)|0;m=n+q|0;o=w+m|0;l=b-(w+n)-q|0;k[w+(n+4)>>2]=q|3;h:do if((b|0)!=(g|0)){if((b|0)==(k[1407]|0)){M=(k[1404]|0)+l|0;k[1404]=M;k[1407]=o;k[w+(m+4)>>2]=M|1;k[w+(M+m)>>2]=M;break}h=p+4|0;c=k[w+(h+j)>>2]|0;if((c&3|0)==1){i=c&-8;f=c>>>3;i:do if(c>>>0>=256){g=k[w+((j|24)+p)>>2]|0;d=k[w+(p+12+j)>>2]|0;do if((d|0)==(b|0)){e=j|16;d=w+(h+e)|0;c=k[d>>2]|0;if(!c){d=w+(e+p)|0;c=k[d>>2]|0;if(!c){J=0;break}}while(1){e=c+20|0;f=k[e>>2]|0;if(f){c=f;d=e;continue}e=c+16|0;f=k[e>>2]|0;if(!f)break;else{c=f;d=e}}if(d>>>0<a>>>0)Fa();else{k[d>>2]=0;J=c;break}}else{e=k[w+((j|8)+p)>>2]|0;if(e>>>0<a>>>0)Fa();a=e+12|0;if((k[a>>2]|0)!=(b|0))Fa();c=d+8|0;if((k[c>>2]|0)==(b|0)){k[a>>2]=d;k[c>>2]=e;J=d;break}else Fa()}while(0);if(!g)break;a=k[w+(p+28+j)>>2]|0;c=5912+(a<<2)|0;do if((b|0)!=(k[c>>2]|0)){if(g>>>0<(k[1406]|0)>>>0)Fa();a=g+16|0;if((k[a>>2]|0)==(b|0))k[a>>2]=J;else k[g+20>>2]=J;if(!J)break i}else{k[c>>2]=J;if(J)break;k[1403]=k[1403]&~(1<<a);break i}while(0);c=k[1406]|0;if(J>>>0<c>>>0)Fa();k[J+24>>2]=g;b=j|16;a=k[w+(b+p)>>2]|0;do if(a)if(a>>>0<c>>>0)Fa();else{k[J+16>>2]=a;k[a+24>>2]=J;break}while(0);b=k[w+(h+b)>>2]|0;if(!b)break;if(b>>>0<(k[1406]|0)>>>0)Fa();else{k[J+20>>2]=b;k[b+24>>2]=J;break}}else{d=k[w+((j|8)+p)>>2]|0;e=k[w+(p+12+j)>>2]|0;c=5648+(f<<1<<2)|0;do if((d|0)!=(c|0)){if(d>>>0<a>>>0)Fa();if((k[d+12>>2]|0)==(b|0))break;Fa()}while(0);if((e|0)==(d|0)){k[1402]=k[1402]&~(1<<f);break}do if((e|0)==(c|0))F=e+8|0;else{if(e>>>0<a>>>0)Fa();a=e+8|0;if((k[a>>2]|0)==(b|0)){F=a;break}Fa()}while(0);k[d+12>>2]=e;k[F>>2]=d}while(0);b=w+((i|j)+p)|0;e=i+l|0}else e=l;b=b+4|0;k[b>>2]=k[b>>2]&-2;k[w+(m+4)>>2]=e|1;k[w+(e+m)>>2]=e;b=e>>>3;if(e>>>0<256){a=b<<1;d=5648+(a<<2)|0;c=k[1402]|0;b=1<<b;do if(!(c&b)){k[1402]=c|b;K=5648+(a+2<<2)|0;L=d}else{b=5648+(a+2<<2)|0;a=k[b>>2]|0;if(a>>>0>=(k[1406]|0)>>>0){K=b;L=a;break}Fa()}while(0);k[K>>2]=o;k[L+12>>2]=o;k[w+(m+8)>>2]=L;k[w+(m+12)>>2]=d;break}b=e>>>8;do if(!b)d=0;else{if(e>>>0>16777215){d=31;break}K=(b+1048320|0)>>>16&8;L=b<<K;J=(L+520192|0)>>>16&4;L=L<<J;d=(L+245760|0)>>>16&2;d=14-(J|K|d)+(L<<d>>>15)|0;d=e>>>(d+7|0)&1|d<<1}while(0);b=5912+(d<<2)|0;k[w+(m+28)>>2]=d;k[w+(m+20)>>2]=0;k[w+(m+16)>>2]=0;a=k[1403]|0;c=1<<d;if(!(a&c)){k[1403]=a|c;k[b>>2]=o;k[w+(m+24)>>2]=b;k[w+(m+12)>>2]=o;k[w+(m+8)>>2]=o;break}b=k[b>>2]|0;j:do if((k[b+4>>2]&-8|0)!=(e|0)){d=e<<((d|0)==31?0:25-(d>>>1)|0);while(1){a=b+16+(d>>>31<<2)|0;c=k[a>>2]|0;if(!c)break;if((k[c+4>>2]&-8|0)==(e|0)){M=c;break j}else{d=d<<1;b=c}}if(a>>>0<(k[1406]|0)>>>0)Fa();else{k[a>>2]=o;k[w+(m+24)>>2]=b;k[w+(m+12)>>2]=o;k[w+(m+8)>>2]=o;break h}}else M=b;while(0);b=M+8|0;a=k[b>>2]|0;L=k[1406]|0;if(a>>>0>=L>>>0&M>>>0>=L>>>0){k[a+12>>2]=o;k[b>>2]=o;k[w+(m+8)>>2]=a;k[w+(m+12)>>2]=M;k[w+(m+24)>>2]=0;break}else Fa()}else{M=(k[1405]|0)+l|0;k[1405]=M;k[1408]=o;k[w+(m+4)>>2]=M|1}while(0);M=w+(n|8)|0;return M|0}else c=6056;while(1){a=k[c>>2]|0;if(a>>>0<=g>>>0?(b=k[c+4>>2]|0,d=a+b|0,d>>>0>g>>>0):0)break;c=k[c+8>>2]|0}e=a+(b+-39)|0;a=a+(b+-47+((e&7|0)==0?0:0-e&7))|0;e=g+16|0;a=a>>>0<e>>>0?g:a;b=a+8|0;c=w+8|0;c=(c&7|0)==0?0:0-c&7;M=p+-40-c|0;k[1408]=w+c;k[1405]=M;k[w+(c+4)>>2]=M|1;k[w+(p+-36)>>2]=40;k[1409]=k[1524];c=a+4|0;k[c>>2]=27;k[b>>2]=k[1514];k[b+4>>2]=k[1515];k[b+8>>2]=k[1516];k[b+12>>2]=k[1517];k[1514]=w;k[1515]=p;k[1517]=0;k[1516]=b;b=a+28|0;k[b>>2]=7;if((a+32|0)>>>0<d>>>0)do{M=b;b=b+4|0;k[b>>2]=7}while((M+8|0)>>>0<d>>>0);if((a|0)!=(g|0)){f=a-g|0;k[c>>2]=k[c>>2]&-2;k[g+4>>2]=f|1;k[a>>2]=f;b=f>>>3;if(f>>>0<256){a=b<<1;d=5648+(a<<2)|0;c=k[1402]|0;b=1<<b;if(c&b){b=5648+(a+2<<2)|0;a=k[b>>2]|0;if(a>>>0<(k[1406]|0)>>>0)Fa();else{G=b;H=a}}else{k[1402]=c|b;G=5648+(a+2<<2)|0;H=d}k[G>>2]=g;k[H+12>>2]=g;k[g+8>>2]=H;k[g+12>>2]=d;break}b=f>>>8;if(b)if(f>>>0>16777215)d=31;else{L=(b+1048320|0)>>>16&8;M=b<<L;K=(M+520192|0)>>>16&4;M=M<<K;d=(M+245760|0)>>>16&2;d=14-(K|L|d)+(M<<d>>>15)|0;d=f>>>(d+7|0)&1|d<<1}else d=0;c=5912+(d<<2)|0;k[g+28>>2]=d;k[g+20>>2]=0;k[e>>2]=0;b=k[1403]|0;a=1<<d;if(!(b&a)){k[1403]=b|a;k[c>>2]=g;k[g+24>>2]=c;k[g+12>>2]=g;k[g+8>>2]=g;break}b=k[c>>2]|0;k:do if((k[b+4>>2]&-8|0)!=(f|0)){d=f<<((d|0)==31?0:25-(d>>>1)|0);while(1){a=b+16+(d>>>31<<2)|0;c=k[a>>2]|0;if(!c)break;if((k[c+4>>2]&-8|0)==(f|0)){I=c;break k}else{d=d<<1;b=c}}if(a>>>0<(k[1406]|0)>>>0)Fa();else{k[a>>2]=g;k[g+24>>2]=b;k[g+12>>2]=g;k[g+8>>2]=g;break g}}else I=b;while(0);b=I+8|0;a=k[b>>2]|0;M=k[1406]|0;if(a>>>0>=M>>>0&I>>>0>=M>>>0){k[a+12>>2]=g;k[b>>2]=g;k[g+8>>2]=a;k[g+12>>2]=I;k[g+24>>2]=0;break}else Fa()}}else{M=k[1406]|0;if((M|0)==0|w>>>0<M>>>0)k[1406]=w;k[1514]=w;k[1515]=p;k[1517]=0;k[1411]=k[1520];k[1410]=-1;b=0;do{M=b<<1;L=5648+(M<<2)|0;k[5648+(M+3<<2)>>2]=L;k[5648+(M+2<<2)>>2]=L;b=b+1|0}while((b|0)!=32);M=w+8|0;M=(M&7|0)==0?0:0-M&7;L=p+-40-M|0;k[1408]=w+M;k[1405]=L;k[w+(M+4)>>2]=L|1;k[w+(p+-36)>>2]=40;k[1409]=k[1524]}while(0);b=k[1405]|0;if(b>>>0>q>>>0){L=b-q|0;k[1405]=L;M=k[1408]|0;k[1408]=M+q;k[M+(q+4)>>2]=L|1;k[M+4>>2]=q|3;M=M+8|0;return M|0}}M=gh()|0;k[M>>2]=12;M=0;return M|0}function Ph(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if(!a)return;b=a+-8|0;h=k[1406]|0;if(b>>>0<h>>>0)Fa();c=k[a+-4>>2]|0;d=c&3;if((d|0)==1)Fa();o=c&-8;q=a+(o+-8)|0;do if(!(c&1)){b=k[b>>2]|0;if(!d)return;i=-8-b|0;l=a+i|0;m=b+o|0;if(l>>>0<h>>>0)Fa();if((l|0)==(k[1407]|0)){b=a+(o+-4)|0;c=k[b>>2]|0;if((c&3|0)!=3){u=l;f=m;break}k[1404]=m;k[b>>2]=c&-2;k[a+(i+4)>>2]=m|1;k[q>>2]=m;return}e=b>>>3;if(b>>>0<256){d=k[a+(i+8)>>2]|0;c=k[a+(i+12)>>2]|0;b=5648+(e<<1<<2)|0;if((d|0)!=(b|0)){if(d>>>0<h>>>0)Fa();if((k[d+12>>2]|0)!=(l|0))Fa()}if((c|0)==(d|0)){k[1402]=k[1402]&~(1<<e);u=l;f=m;break}if((c|0)!=(b|0)){if(c>>>0<h>>>0)Fa();b=c+8|0;if((k[b>>2]|0)==(l|0))g=b;else Fa()}else g=c+8|0;k[d+12>>2]=c;k[g>>2]=d;u=l;f=m;break}g=k[a+(i+24)>>2]|0;d=k[a+(i+12)>>2]|0;do if((d|0)==(l|0)){c=a+(i+20)|0;b=k[c>>2]|0;if(!b){c=a+(i+16)|0;b=k[c>>2]|0;if(!b){j=0;break}}while(1){d=b+20|0;e=k[d>>2]|0;if(e){b=e;c=d;continue}d=b+16|0;e=k[d>>2]|0;if(!e)break;else{b=e;c=d}}if(c>>>0<h>>>0)Fa();else{k[c>>2]=0;j=b;break}}else{e=k[a+(i+8)>>2]|0;if(e>>>0<h>>>0)Fa();b=e+12|0;if((k[b>>2]|0)!=(l|0))Fa();c=d+8|0;if((k[c>>2]|0)==(l|0)){k[b>>2]=d;k[c>>2]=e;j=d;break}else Fa()}while(0);if(g){b=k[a+(i+28)>>2]|0;c=5912+(b<<2)|0;if((l|0)==(k[c>>2]|0)){k[c>>2]=j;if(!j){k[1403]=k[1403]&~(1<<b);u=l;f=m;break}}else{if(g>>>0<(k[1406]|0)>>>0)Fa();b=g+16|0;if((k[b>>2]|0)==(l|0))k[b>>2]=j;else k[g+20>>2]=j;if(!j){u=l;f=m;break}}c=k[1406]|0;if(j>>>0<c>>>0)Fa();k[j+24>>2]=g;b=k[a+(i+16)>>2]|0;do if(b)if(b>>>0<c>>>0)Fa();else{k[j+16>>2]=b;k[b+24>>2]=j;break}while(0);b=k[a+(i+20)>>2]|0;if(b)if(b>>>0<(k[1406]|0)>>>0)Fa();else{k[j+20>>2]=b;k[b+24>>2]=j;u=l;f=m;break}else{u=l;f=m}}else{u=l;f=m}}else{u=b;f=o}while(0);if(u>>>0>=q>>>0)Fa();b=a+(o+-4)|0;c=k[b>>2]|0;if(!(c&1))Fa();if(!(c&2)){if((q|0)==(k[1408]|0)){t=(k[1405]|0)+f|0;k[1405]=t;k[1408]=u;k[u+4>>2]=t|1;if((u|0)!=(k[1407]|0))return;k[1407]=0;k[1404]=0;return}if((q|0)==(k[1407]|0)){t=(k[1404]|0)+f|0;k[1404]=t;k[1407]=u;k[u+4>>2]=t|1;k[u+t>>2]=t;return}f=(c&-8)+f|0;e=c>>>3;do if(c>>>0>=256){g=k[a+(o+16)>>2]|0;b=k[a+(o|4)>>2]|0;do if((b|0)==(q|0)){c=a+(o+12)|0;b=k[c>>2]|0;if(!b){c=a+(o+8)|0;b=k[c>>2]|0;if(!b){p=0;break}}while(1){d=b+20|0;e=k[d>>2]|0;if(e){b=e;c=d;continue}d=b+16|0;e=k[d>>2]|0;if(!e)break;else{b=e;c=d}}if(c>>>0<(k[1406]|0)>>>0)Fa();else{k[c>>2]=0;p=b;break}}else{c=k[a+o>>2]|0;if(c>>>0<(k[1406]|0)>>>0)Fa();d=c+12|0;if((k[d>>2]|0)!=(q|0))Fa();e=b+8|0;if((k[e>>2]|0)==(q|0)){k[d>>2]=b;k[e>>2]=c;p=b;break}else Fa()}while(0);if(g){b=k[a+(o+20)>>2]|0;c=5912+(b<<2)|0;if((q|0)==(k[c>>2]|0)){k[c>>2]=p;if(!p){k[1403]=k[1403]&~(1<<b);break}}else{if(g>>>0<(k[1406]|0)>>>0)Fa();b=g+16|0;if((k[b>>2]|0)==(q|0))k[b>>2]=p;else k[g+20>>2]=p;if(!p)break}c=k[1406]|0;if(p>>>0<c>>>0)Fa();k[p+24>>2]=g;b=k[a+(o+8)>>2]|0;do if(b)if(b>>>0<c>>>0)Fa();else{k[p+16>>2]=b;k[b+24>>2]=p;break}while(0);b=k[a+(o+12)>>2]|0;if(b)if(b>>>0<(k[1406]|0)>>>0)Fa();else{k[p+20>>2]=b;k[b+24>>2]=p;break}}}else{d=k[a+o>>2]|0;c=k[a+(o|4)>>2]|0;b=5648+(e<<1<<2)|0;if((d|0)!=(b|0)){if(d>>>0<(k[1406]|0)>>>0)Fa();if((k[d+12>>2]|0)!=(q|0))Fa()}if((c|0)==(d|0)){k[1402]=k[1402]&~(1<<e);break}if((c|0)!=(b|0)){if(c>>>0<(k[1406]|0)>>>0)Fa();b=c+8|0;if((k[b>>2]|0)==(q|0))n=b;else Fa()}else n=c+8|0;k[d+12>>2]=c;k[n>>2]=d}while(0);k[u+4>>2]=f|1;k[u+f>>2]=f;if((u|0)==(k[1407]|0)){k[1404]=f;return}}else{k[b>>2]=c&-2;k[u+4>>2]=f|1;k[u+f>>2]=f}b=f>>>3;if(f>>>0<256){c=b<<1;e=5648+(c<<2)|0;d=k[1402]|0;b=1<<b;if(d&b){b=5648+(c+2<<2)|0;c=k[b>>2]|0;if(c>>>0<(k[1406]|0)>>>0)Fa();else{r=b;s=c}}else{k[1402]=d|b;r=5648+(c+2<<2)|0;s=e}k[r>>2]=u;k[s+12>>2]=u;k[u+8>>2]=s;k[u+12>>2]=e;return}b=f>>>8;if(b)if(f>>>0>16777215)e=31;else{r=(b+1048320|0)>>>16&8;s=b<<r;q=(s+520192|0)>>>16&4;s=s<<q;e=(s+245760|0)>>>16&2;e=14-(q|r|e)+(s<<e>>>15)|0;e=f>>>(e+7|0)&1|e<<1}else e=0;b=5912+(e<<2)|0;k[u+28>>2]=e;k[u+20>>2]=0;k[u+16>>2]=0;c=k[1403]|0;d=1<<e;a:do if(c&d){b=k[b>>2]|0;b:do if((k[b+4>>2]&-8|0)!=(f|0)){e=f<<((e|0)==31?0:25-(e>>>1)|0);while(1){c=b+16+(e>>>31<<2)|0;d=k[c>>2]|0;if(!d)break;if((k[d+4>>2]&-8|0)==(f|0)){t=d;break b}else{e=e<<1;b=d}}if(c>>>0<(k[1406]|0)>>>0)Fa();else{k[c>>2]=u;k[u+24>>2]=b;k[u+12>>2]=u;k[u+8>>2]=u;break a}}else t=b;while(0);b=t+8|0;c=k[b>>2]|0;s=k[1406]|0;if(c>>>0>=s>>>0&t>>>0>=s>>>0){k[c+12>>2]=u;k[b>>2]=u;k[u+8>>2]=c;k[u+12>>2]=t;k[u+24>>2]=0;break}else Fa()}else{k[1403]=c|d;k[b>>2]=u;k[u+24>>2]=b;k[u+12>>2]=u;k[u+8>>2]=u}while(0);u=(k[1410]|0)+-1|0;k[1410]=u;if(!u)b=6064;else return;while(1){b=k[b>>2]|0;if(!b)break;else b=b+8|0}k[1410]=-1;return}function Qh(a,b){a=a|0;b=b|0;var c=0;if(a){c=ha(b,a)|0;if((b|a)>>>0>65535)c=((c>>>0)/(a>>>0)|0|0)==(b|0)?c:-1}else c=0;b=Oh(c)|0;if(!b)return b|0;if(!(k[b+-4>>2]&3))return b|0;gi(b|0,0,c|0)|0;return b|0}function Rh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;a:while(1){o=b;d=b+-4|0;b:while(1){n=a;f=o-n|0;g=f>>2;switch(g|0){case 1:case 0:break a;case 2:{e=a;r=4;break a}case 3:{b=d;r=6;break a}case 4:{b=d;r=7;break a}case 5:{b=d;r=8;break a}default:{}}if((f|0)<124){r=10;break a}e=(g|0)/2|0;j=a+(e<<2)|0;if((f|0)>3996){m=(g|0)/4|0;e=Vh(a,a+(m<<2)|0,j,a+(m+e<<2)|0,d,c)|0}else e=Th(a,j,d,c)|0;i=k[a>>2]|0;h=k[j>>2]|0;do if(i>>>0<h>>>0)g=d;else{f=d;while(1){f=f+-4|0;if((a|0)==(f|0))break;g=k[f>>2]|0;if(g>>>0<h>>>0){r=29;break}}if((r|0)==29){r=0;k[a>>2]=g;k[f>>2]=i;g=f;e=e+1|0;break}e=a+4|0;h=k[d>>2]|0;if(i>>>0>=h>>>0){if((e|0)==(d|0))break a;else g=a;while(1){f=k[e>>2]|0;if(i>>>0<f>>>0)break;f=e+4|0;if((f|0)==(d|0))break a;else{g=e;e=f}}k[e>>2]=h;k[d>>2]=f;e=g+8|0}if((e|0)==(d|0))break a;else g=d;while(1){j=k[a>>2]|0;h=e;while(1){f=k[h>>2]|0;e=h+4|0;if(j>>>0<f>>>0){i=f;break}else h=e}f=g;while(1){g=f+-4|0;f=k[g>>2]|0;if(j>>>0<f>>>0)f=g;else break}if(h>>>0>=g>>>0){a=h;continue b}k[h>>2]=f;k[g>>2]=i}}while(0);f=a+4|0;c:do if(f>>>0<g>>>0){m=j;while(1){j=k[m>>2]|0;i=f;while(1){h=k[i>>2]|0;f=i+4|0;if(h>>>0<j>>>0)i=f;else{l=i;break}}do{g=g+-4|0;i=k[g>>2]|0}while(i>>>0>=j>>>0);j=g;g=i;if(l>>>0>j>>>0){g=l;f=m;break c}k[l>>2]=g;k[j>>2]=h;g=j;m=(m|0)==(l|0)?j:m;e=e+1|0}}else{g=f;f=j}while(0);if((g|0)!=(f|0)?(p=k[f>>2]|0,q=k[g>>2]|0,p>>>0<q>>>0):0){k[g>>2]=p;k[f>>2]=q;e=e+1|0}if(!e){e=Sh(a,g,c)|0;f=g+4|0;if(Sh(f,b,c)|0){r=42;break}if(e){a=f;continue}}m=g;if((m-n|0)>=(o-m|0)){d=g;r=46;break}Rh(a,g,c);a=g+4|0}if((r|0)==42){r=0;if(e)break;else{b=g;continue}}else if((r|0)==46){r=0;Rh(d+4|0,b,c);b=d;continue}}if((r|0)==4){b=k[d>>2]|0;a=k[e>>2]|0;if(b>>>0<a>>>0){k[e>>2]=b;k[d>>2]=a}}else if((r|0)==6)Th(a,a+4|0,b,c)|0;else if((r|0)==7)Uh(a,a+4|0,a+8|0,b,c)|0;else if((r|0)==8)Vh(a,a+4|0,a+8|0,a+12|0,b,c)|0;else if((r|0)==10)Wh(a,b,c);return}function Sh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0;a:do switch(b-a>>2|0){case 1:case 0:{c=1;break}case 2:{c=b+-4|0;d=k[c>>2]|0;e=k[a>>2]|0;if(d>>>0<e>>>0){k[a>>2]=d;k[c>>2]=e;c=1}else c=1;break}case 3:{Th(a,a+4|0,b+-4|0,c)|0;c=1;break}case 4:{Uh(a,a+4|0,a+8|0,b+-4|0,c)|0;c=1;break}case 5:{Vh(a,a+4|0,a+8|0,a+12|0,b+-4|0,c)|0;c=1;break}default:{e=a+8|0;Th(a,a+4|0,e,c)|0;c=a+12|0;if((c|0)==(b|0))c=1;else{d=0;while(1){h=k[c>>2]|0;f=k[e>>2]|0;if(h>>>0<f>>>0){g=c;while(1){k[g>>2]=f;if((e|0)==(a|0)){e=a;break}g=e+-4|0;f=k[g>>2]|0;if(h>>>0>=f>>>0)break;else{i=e;e=g;g=i}}k[e>>2]=h;d=d+1|0;if((d|0)==8)break}e=c+4|0;if((e|0)==(b|0)){c=1;break a}else{i=c;c=e;e=i}}c=(c+4|0)==(b|0)}}}while(0);return c|0}function Th(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;d=k[b>>2]|0;g=k[a>>2]|0;e=k[c>>2]|0;f=e>>>0<d>>>0;do if(d>>>0<g>>>0){if(f){k[a>>2]=e;k[c>>2]=g;d=1;break}k[a>>2]=d;k[b>>2]=g;d=k[c>>2]|0;if(d>>>0<g>>>0){k[b>>2]=d;k[c>>2]=g;d=2}else d=1}else if(f){k[b>>2]=e;k[c>>2]=d;d=k[b>>2]|0;e=k[a>>2]|0;if(d>>>0<e>>>0){k[a>>2]=d;k[b>>2]=e;d=2}else d=1}else d=0;while(0);return d|0}function Uh(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;e=Th(a,b,c,e)|0;f=k[d>>2]|0;g=k[c>>2]|0;if(f>>>0<g>>>0){k[c>>2]=f;k[d>>2]=g;f=e+1|0;g=k[c>>2]|0;d=k[b>>2]|0;if(g>>>0<d>>>0){k[b>>2]=g;k[c>>2]=d;g=k[b>>2]|0;f=k[a>>2]|0;if(g>>>0<f>>>0){k[a>>2]=g;k[b>>2]=f;e=e+3|0}else e=e+2|0}else e=f}return e|0}function Vh(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;f=Uh(a,b,c,d,f)|0;g=k[e>>2]|0;h=k[d>>2]|0;if(g>>>0<h>>>0){k[d>>2]=g;k[e>>2]=h;g=f+1|0;h=k[d>>2]|0;e=k[c>>2]|0;if(h>>>0<e>>>0){k[c>>2]=h;k[d>>2]=e;h=f+2|0;e=k[c>>2]|0;g=k[b>>2]|0;if(e>>>0<g>>>0){k[b>>2]=e;k[c>>2]=g;g=k[b>>2]|0;h=k[a>>2]|0;if(g>>>0<h>>>0){k[a>>2]=g;k[b>>2]=h;f=f+4|0}else f=f+3|0}else f=h}else f=g}return f|0}function Wh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;d=a+8|0;Th(a,a+4|0,d,c)|0;c=a+12|0;if((c|0)!=(b|0)){g=c;c=d;while(1){f=k[g>>2]|0;d=k[c>>2]|0;if(f>>>0<d>>>0){e=g;while(1){k[e>>2]=d;if((c|0)==(a|0)){c=a;break}e=c+-4|0;d=k[e>>2]|0;if(f>>>0>=d>>>0)break;else{h=c;c=e;e=h}}k[c>>2]=f}c=g+4|0;if((c|0)==(b|0))break;else{h=g;g=c;c=h}}}return}function Xh(a,b){a=a|0;b=b|0;k[a>>2]=5136;Yh(a+4|0,b);return}function Yh(a,b){a=a|0;b=b|0;var c=0,d=0;d=kh(b)|0;c=og(d+13|0)|0;k[c>>2]=d;k[c+4>>2]=d;k[c+8>>2]=0;c=c+12|0;ki(c|0,b|0,d+1|0)|0;k[a>>2]=c;return}function Zh(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0;i=r;r=r+16|0;b=i+8|0;g=i+4|0;c=i;k[g>>2]=a;do if(a>>>0>=212){f=(a>>>0)/210|0;d=f*210|0;k[c>>2]=a-d;b=(_h(6296,6488,c,b)|0)-6296>>2;e=b;b=(k[6296+(b<<2)>>2]|0)+d|0;a:while(1){d=5;while(1){if(d>>>0>=47){d=211;h=8;break}c=k[6104+(d<<2)>>2]|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=106;break a}if((b|0)==(ha(a,c)|0))break;else d=d+1|0}b:do if((h|0)==8)while(1){h=0;c=(b>>>0)/(d>>>0)|0;if(c>>>0<d>>>0){h=105;break a}if((b|0)==(ha(c,d)|0))break b;c=d+10|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+12|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+16|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+18|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+22|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+28|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+30|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+36|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+40|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+42|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+46|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+52|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+58|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+60|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+66|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+70|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+72|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+78|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+82|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+88|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+96|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+100|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+102|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+106|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+108|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+112|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+120|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+126|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+130|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+136|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+138|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+142|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+148|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+150|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+156|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+162|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+166|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+168|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+172|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+178|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+180|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+186|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+190|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+192|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+196|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+198|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break b;c=d+208|0;a=(b>>>0)/(c>>>0)|0;if(a>>>0<c>>>0){h=105;break a}if((b|0)==(ha(a,c)|0))break;else{d=d+210|0;h=8}}while(0);d=e+1|0;b=(d|0)==48;d=b?0:d;b=(b&1)+f|0;e=d;f=b;b=(k[6296+(d<<2)>>2]|0)+(b*210|0)|0}if((h|0)==105){k[g>>2]=b;break}else if((h|0)==106){k[g>>2]=b;break}}else{b=_h(6104,6296,g,b)|0;b=k[b>>2]|0}while(0);r=i;return b|0}function _h(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=k[c>>2]|0;d=a;c=b-a>>2;a:while(1){while(1){if(!c)break a;a=(c|0)/2|0;if((k[d+(a<<2)>>2]|0)>>>0<e>>>0)break;else c=a}d=d+(a+1<<2)|0;c=c+-1-a|0}return d|0}function $h(a,b){a=a|0;b=b|0;if(!(i[b>>0]&1)){k[a>>2]=k[b>>2];k[a+4>>2]=k[b+4>>2];k[a+8>>2]=k[b+8>>2]}else ai(a,k[b+8>>2]|0,k[b+4>>2]|0);return}function ai(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;if(c>>>0>4294967279)lg(a);if(c>>>0<11){i[a>>0]=c<<1;a=a+1|0}else{e=c+16&-16;d=og(e)|0;k[a+8>>2]=d;k[a>>2]=e|1;k[a+4>>2]=c;a=d}ki(a|0,b|0,c|0)|0;i[a+c>>0]=0;return}function bi(a){a=a|0;if(i[a>>0]&1)rg(k[a+8>>2]|0);return}function ci(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i[a>>0]|0;if(!(d&1))e=10;else{d=k[a>>2]|0;e=(d&-2)+-1|0;d=d&255}if(!(d&1))f=(d&255)>>>1;else f=k[a+4>>2]|0;if((e-f|0)>>>0>=c>>>0){if(c){if(!(d&1))e=a+1|0;else e=k[a+8>>2]|0;ki(e+f|0,b|0,c|0)|0;d=f+c|0;if(!(i[a>>0]&1))i[a>>0]=d<<1;else k[a+4>>2]=d;i[e+d>>0]=0}}else di(a,e,c-e+f|0,f,f,0,c,b);return a|0}function di(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,l=0,m=0;if((-18-b|0)>>>0<c>>>0)lg(a);if(!(i[a>>0]&1))m=a+1|0;else m=k[a+8>>2]|0;if(b>>>0<2147483623){j=c+b|0;l=b<<1;j=j>>>0<l>>>0?l:j;j=j>>>0<11?11:j+16&-16}else j=-17;l=og(j)|0;if(e)ki(l|0,m|0,e|0)|0;if(g)ki(l+e|0,h|0,g|0)|0;c=d-f|0;if((c|0)!=(e|0))ki(l+(g+e)|0,m+(f+e)|0,c-e|0)|0;if((b|0)!=10)rg(m);k[a+8>>2]=l;k[a>>2]=j|1;b=c+g|0;k[a+4>>2]=b;i[l+b>>0]=0;return}function ei(){}function fi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;d=b-d-(c>>>0>a>>>0|0)>>>0;return (L=d,a-c>>>0|0)|0}function gi(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a+c|0;if((c|0)>=20){b=b&255;f=a&3;g=b|b<<8|b<<16|b<<24;e=d&~3;if(f){f=a+4-f|0;while((a|0)<(f|0)){i[a>>0]=b;a=a+1|0}}while((a|0)<(e|0)){k[a>>2]=g;a=a+4|0}}while((a|0)<(d|0)){i[a>>0]=b;a=a+1|0}return a-c|0}function hi(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){L=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}L=a<<c-32;return 0}function ii(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=a+c>>>0;return (L=b+d+(c>>>0<a>>>0|0)>>>0,c|0)|0}function ji(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){L=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}L=0;return b>>>c-32|0}function ki(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((c|0)>=4096)return Wa(a|0,b|0,c|0)|0;d=a|0;if((a&3)==(b&3)){while(a&3){if(!c)return d|0;i[a>>0]=i[b>>0]|0;a=a+1|0;b=b+1|0;c=c-1|0}while((c|0)>=4){k[a>>2]=k[b>>2];a=a+4|0;b=b+4|0;c=c-4|0}}while((c|0)>0){i[a>>0]=i[b>>0]|0;a=a+1|0;b=b+1|0;c=c-1|0}return d|0}function li(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;if((b|0)<(a|0)&(a|0)<(b+c|0)){d=a;b=b+c|0;a=a+c|0;while((c|0)>0){a=a-1|0;b=b-1|0;c=c-1|0;i[a>>0]=i[b>>0]|0}a=d}else ki(a,b,c)|0;return a|0}function mi(a){a=a|0;return (a&255)<<24|(a>>8&255)<<16|(a>>16&255)<<8|a>>>24|0}function ni(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){L=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}L=(b|0)<0?-1:0;return b>>c-32|0}function oi(a){a=a|0;var b=0;b=i[v+(a&255)>>0]|0;if((b|0)<8)return b|0;b=i[v+(a>>8&255)>>0]|0;if((b|0)<8)return b+8|0;b=i[v+(a>>16&255)>>0]|0;if((b|0)<8)return b+16|0;return (i[v+(a>>>24)>>0]|0)+24|0}function pi(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=a&65535;e=b&65535;c=ha(e,f)|0;d=a>>>16;a=(c>>>16)+(ha(e,d)|0)|0;e=b>>>16;b=ha(e,f)|0;return (L=(a>>>16)+(ha(e,d)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|c&65535|0)|0}function qi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;j=b>>31|((b|0)<0?-1:0)<<1;i=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;f=d>>31|((d|0)<0?-1:0)<<1;e=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;h=fi(j^a,i^b,j,i)|0;g=L;a=f^j;b=e^i;return fi((vi(h,g,fi(f^c,e^d,f,e)|0,L,0)|0)^a,L^b,a,b)|0}function ri(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=r;r=r+16|0;h=e|0;g=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;j=d>>31|((d|0)<0?-1:0)<<1;i=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;a=fi(g^a,f^b,g,f)|0;b=L;vi(a,b,fi(j^c,i^d,j,i)|0,L,h)|0;d=fi(k[h>>2]^g,k[h+4>>2]^f,g,f)|0;c=L;r=e;return (L=c,d)|0}function si(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;f=c;c=pi(e,f)|0;a=L;return (L=(ha(b,f)|0)+(ha(d,e)|0)+a|a&0,c|0|0)|0}function ti(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return vi(a,b,c,d,0)|0}function ui(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;f=r;r=r+16|0;e=f|0;vi(a,b,c,d,e)|0;r=f;return (L=k[e+4>>2]|0,k[e>>2]|0)|0}function vi(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0;l=a;i=b;j=i;g=c;n=d;h=n;if(!j){f=(e|0)!=0;if(!h){if(f){k[e>>2]=(l>>>0)%(g>>>0);k[e+4>>2]=0}n=0;e=(l>>>0)/(g>>>0)>>>0;return (L=n,e)|0}else{if(!f){n=0;e=0;return (L=n,e)|0}k[e>>2]=a|0;k[e+4>>2]=b&0;n=0;e=0;return (L=n,e)|0}}f=(h|0)==0;do if(g){if(!f){f=(ja(h|0)|0)-(ja(j|0)|0)|0;if(f>>>0<=31){m=f+1|0;h=31-f|0;b=f-31>>31;g=m;a=l>>>(m>>>0)&b|j<<h;b=j>>>(m>>>0)&b;f=0;h=l<<h;break}if(!e){n=0;e=0;return (L=n,e)|0}k[e>>2]=a|0;k[e+4>>2]=i|b&0;n=0;e=0;return (L=n,e)|0}f=g-1|0;if(f&g){h=(ja(g|0)|0)+33-(ja(j|0)|0)|0;p=64-h|0;m=32-h|0;i=m>>31;o=h-32|0;b=o>>31;g=h;a=m-1>>31&j>>>(o>>>0)|(j<<m|l>>>(h>>>0))&b;b=b&j>>>(h>>>0);f=l<<p&i;h=(j<<p|l>>>(o>>>0))&i|l<<m&h-33>>31;break}if(e){k[e>>2]=f&l;k[e+4>>2]=0}if((g|0)==1){o=i|b&0;p=a|0|0;return (L=o,p)|0}else{p=oi(g|0)|0;o=j>>>(p>>>0)|0;p=j<<32-p|l>>>(p>>>0)|0;return (L=o,p)|0}}else{if(f){if(e){k[e>>2]=(j>>>0)%(g>>>0);k[e+4>>2]=0}o=0;p=(j>>>0)/(g>>>0)>>>0;return (L=o,p)|0}if(!l){if(e){k[e>>2]=0;k[e+4>>2]=(j>>>0)%(h>>>0)}o=0;p=(j>>>0)/(h>>>0)>>>0;return (L=o,p)|0}f=h-1|0;if(!(f&h)){if(e){k[e>>2]=a|0;k[e+4>>2]=f&j|b&0}o=0;p=j>>>((oi(h|0)|0)>>>0);return (L=o,p)|0}f=(ja(h|0)|0)-(ja(j|0)|0)|0;if(f>>>0<=30){b=f+1|0;h=31-f|0;g=b;a=j<<h|l>>>(b>>>0);b=j>>>(b>>>0);f=0;h=l<<h;break}if(!e){o=0;p=0;return (L=o,p)|0}k[e>>2]=a|0;k[e+4>>2]=i|b&0;o=0;p=0;return (L=o,p)|0}while(0);if(!g){j=h;i=0;h=0}else{m=c|0|0;l=n|d&0;j=ii(m|0,l|0,-1,-1)|0;c=L;i=h;h=0;do{d=i;i=f>>>31|i<<1;f=h|f<<1;d=a<<1|d>>>31|0;n=a>>>31|b<<1|0;fi(j,c,d,n)|0;p=L;o=p>>31|((p|0)<0?-1:0)<<1;h=o&1;a=fi(d,n,o&m,(((p|0)<0?-1:0)>>31|((p|0)<0?-1:0)<<1)&l)|0;b=L;g=g-1|0}while((g|0)!=0);j=i;i=0}g=0;if(e){k[e>>2]=a;k[e+4>>2]=b}o=(f|0)>>>31|(j|g)<<1|(g<<1|f>>>31)&0|i;p=(f<<1|0>>>31)&-2|h;return (L=o,p)|0}function wi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return Pb[a&15](b|0,c|0,d|0)|0}function xi(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;Qb[a&3](b|0,c|0,d|0,e|0,f|0)}function yi(a){a=a|0;return Rb[a&1]()|0}function zi(a,b){a=a|0;b=b|0;Sb[a&31](b|0)}function Ai(a,b,c){a=a|0;b=b|0;c=c|0;Tb[a&1](b|0,c|0)}function Bi(a,b){a=a|0;b=b|0;return Ub[a&7](b|0)|0}function Ci(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;Vb[a&1](b|0,c|0,d|0)}function Di(a){a=a|0;Wb[a&3]()}function Ei(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Xb[a&1](b|0,c|0,d|0,e|0)|0}function Fi(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;Yb[a&3](b|0,c|0,d|0,e|0,f|0,g|0)}function Gi(a,b,c){a=a|0;b=b|0;c=c|0;return Zb[a&1](b|0,c|0)|0}function Hi(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;_b[a&3](b|0,c|0,d|0,e|0)}function Ii(a,b,c){a=a|0;b=b|0;c=c|0;ka(0);return 0}function Ji(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ka(1)}function Ki(){ka(2);return 0}function Li(a){a=a|0;ka(3)}function Mi(a,b){a=a|0;b=b|0;ka(4)}function Ni(a){a=a|0;ka(5);return 0}function Oi(a,b,c){a=a|0;b=b|0;c=c|0;ka(6)}function Pi(){ka(7)}function Qi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ka(8);return 0}function Ri(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ka(9)}function Si(a,b){a=a|0;b=b|0;ka(10);return 0}function Ti(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ka(11)}

// EMSCRIPTEN_END_FUNCS
var Pb=[Ii,ag,cg,Mg,Ng,Bh,th,sh,jc,Ii,Ii,Ii,Ii,Ii,Ii,Ii];var Qb=[Ji,Zg,Yg,Vg];var Rb=[Ki,ic];var Sb=[Li,dg,eg,fg,gg,tg,ug,Ag,Bg,Dg,Fg,Ig,Gg,Hg,Jg,Kg,Lg,fh,Kh,Li,Li,Li,Li,Li,Li,Li,Li,Li,Li,Li,Li,Li];var Tb=[Mi,kc];var Ub=[Ni,vg,Cg,Fh,lc,Ni,Ni,Ni];var Vb=[Oi,nc];var Wb=[Pi,bh,ch,Pi];var Xb=[Qi,mc];var Yb=[Ri,ah,$g,_g];var Zb=[Si,Gf];var _b=[Ti,Pg,Qg,Sg];return{_i64Subtract:fi,_fflush:zh,_i64Add:ii,_memmove:li,_memset:gi,_malloc:Oh,_memcpy:ki,___getTypeName:hg,_llvm_bswap_i32:mi,_bitshift64Lshr:ji,_free:Ph,___errno_location:gh,_bitshift64Shl:hi,__GLOBAL__sub_I_fallback_cc:oc,__GLOBAL__sub_I_bind_cpp:jg,runPostSets:ei,_emscripten_replace_memory:Ob,stackAlloc:$b,stackSave:ac,stackRestore:bc,establishStackSpace:cc,setThrew:dc,setTempRet0:gc,getTempRet0:hc,dynCall_iiii:wi,dynCall_viiiii:xi,dynCall_i:yi,dynCall_vi:zi,dynCall_vii:Ai,dynCall_ii:Bi,dynCall_viii:Ci,dynCall_v:Di,dynCall_iiiii:Ei,dynCall_viiiiii:Fi,dynCall_iii:Gi,dynCall_viiii:Hi}})


// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg,Module.asmLibraryArg,buffer);var _i64Subtract=Module["_i64Subtract"]=asm["_i64Subtract"];var __GLOBAL__sub_I_bind_cpp=Module["__GLOBAL__sub_I_bind_cpp"]=asm["__GLOBAL__sub_I_bind_cpp"];var _fflush=Module["_fflush"]=asm["_fflush"];var runPostSets=Module["runPostSets"]=asm["runPostSets"];var _i64Add=Module["_i64Add"]=asm["_i64Add"];var _memmove=Module["_memmove"]=asm["_memmove"];var _memset=Module["_memset"]=asm["_memset"];var _malloc=Module["_malloc"]=asm["_malloc"];var __GLOBAL__sub_I_fallback_cc=Module["__GLOBAL__sub_I_fallback_cc"]=asm["__GLOBAL__sub_I_fallback_cc"];var _memcpy=Module["_memcpy"]=asm["_memcpy"];var ___getTypeName=Module["___getTypeName"]=asm["___getTypeName"];var ___errno_location=Module["___errno_location"]=asm["___errno_location"];var _bitshift64Lshr=Module["_bitshift64Lshr"]=asm["_bitshift64Lshr"];var _free=Module["_free"]=asm["_free"];var _emscripten_replace_memory=Module["_emscripten_replace_memory"]=asm["_emscripten_replace_memory"];var _llvm_bswap_i32=Module["_llvm_bswap_i32"]=asm["_llvm_bswap_i32"];var _bitshift64Shl=Module["_bitshift64Shl"]=asm["_bitshift64Shl"];var dynCall_iiii=Module["dynCall_iiii"]=asm["dynCall_iiii"];var dynCall_viiiii=Module["dynCall_viiiii"]=asm["dynCall_viiiii"];var dynCall_i=Module["dynCall_i"]=asm["dynCall_i"];var dynCall_vi=Module["dynCall_vi"]=asm["dynCall_vi"];var dynCall_vii=Module["dynCall_vii"]=asm["dynCall_vii"];var dynCall_ii=Module["dynCall_ii"]=asm["dynCall_ii"];var dynCall_viii=Module["dynCall_viii"]=asm["dynCall_viii"];var dynCall_v=Module["dynCall_v"]=asm["dynCall_v"];var dynCall_iiiii=Module["dynCall_iiiii"]=asm["dynCall_iiiii"];var dynCall_viiiiii=Module["dynCall_viiiiii"]=asm["dynCall_viiiiii"];var dynCall_iii=Module["dynCall_iii"]=asm["dynCall_iii"];var dynCall_viiii=Module["dynCall_viiii"]=asm["dynCall_viiii"];Runtime.stackAlloc=asm["stackAlloc"];Runtime.stackSave=asm["stackSave"];Runtime.stackRestore=asm["stackRestore"];Runtime.establishStackSpace=asm["establishStackSpace"];Runtime.setTempRet0=asm["setTempRet0"];Runtime.getTempRet0=asm["getTempRet0"];function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status}ExitStatus.prototype=new Error;ExitStatus.prototype.constructor=ExitStatus;var initialStackTop;var preloadStartTime=null;var calledMain=false;dependenciesFulfilled=function runCaller(){if(!Module["calledRun"])run();if(!Module["calledRun"])dependenciesFulfilled=runCaller};Module["callMain"]=Module.callMain=function callMain(args){assert(runDependencies==0,"cannot call main when async dependencies remain! (listen on __ATMAIN__)");assert(__ATPRERUN__.length==0,"cannot call main when preRun functions remain to be called");args=args||[];ensureInitRuntime();var argc=args.length+1;function pad(){for(var i=0;i<4-1;i++){argv.push(0)}}var argv=[allocate(intArrayFromString(Module["thisProgram"]),"i8",ALLOC_NORMAL)];pad();for(var i=0;i<argc-1;i=i+1){argv.push(allocate(intArrayFromString(args[i]),"i8",ALLOC_NORMAL));pad()}argv.push(0);argv=allocate(argv,"i32",ALLOC_NORMAL);try{var ret=Module["_main"](argc,argv,0);exit(ret,true)}catch(e){if(e instanceof ExitStatus){return}else if(e=="SimulateInfiniteLoop"){Module["noExitRuntime"]=true;return}else{if(e&&typeof e==="object"&&e.stack)Module.printErr("exception thrown: "+[e,e.stack]);throw e}}finally{calledMain=true}};function run(args){args=args||Module["arguments"];if(preloadStartTime===null)preloadStartTime=Date.now();if(runDependencies>0){return}preRun();if(runDependencies>0)return;if(Module["calledRun"])return;function doRun(){if(Module["calledRun"])return;Module["calledRun"]=true;if(ABORT)return;ensureInitRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();if(Module["_main"]&&shouldRunNow)Module["callMain"](args);postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout((function(){setTimeout((function(){Module["setStatus"]("")}),1);doRun()}),1)}else{doRun()}}Module["run"]=Module.run=run;function exit(status,implicit){if(implicit&&Module["noExitRuntime"]){return}if(Module["noExitRuntime"]){}else{ABORT=true;EXITSTATUS=status;STACKTOP=initialStackTop;exitRuntime();if(Module["onExit"])Module["onExit"](status)}if(ENVIRONMENT_IS_NODE){process["stdout"]["once"]("drain",(function(){process["exit"](status)}));console.log(" ");setTimeout((function(){process["exit"](status)}),500)}else if(ENVIRONMENT_IS_SHELL&&typeof quit==="function"){quit(status)}throw new ExitStatus(status)}Module["exit"]=Module.exit=exit;var abortDecorators=[];function abort(what){if(what!==undefined){Module.print(what);Module.printErr(what);what=JSON.stringify(what)}else{what=""}ABORT=true;EXITSTATUS=1;var extra="\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";var output="abort("+what+") at "+stackTrace()+extra;if(abortDecorators){abortDecorators.forEach((function(decorator){output=decorator(output,what)}))}throw output}Module["abort"]=Module.abort=abort;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}var shouldRunNow=true;if(Module["noInitialRun"]){shouldRunNow=false}run();module.exports=Module;Module.inspect=(function(){return"[Module]"})






/***/ }),

/***/ 3218:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


try {
  module.exports = __nccwpck_require__(330)('addon.node').convert;
} catch (err) {
  module.exports = __nccwpck_require__(8589);
}


/***/ }),

/***/ 5037:
/***/ (function(module, exports, __nccwpck_require__) {

/* module decorator */ module = __nccwpck_require__.nmd(module);
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
  var undefined;

  /** Used as the semantic version number. */
  var VERSION = '4.17.21';

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Error message constants. */
  var CORE_ERROR_TEXT = 'Unsupported core-js use. Try https://npms.io/search?q=ponyfill.',
      FUNC_ERROR_TEXT = 'Expected a function',
      INVALID_TEMPL_VAR_ERROR_TEXT = 'Invalid `variable` option passed into `_.template`';

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used as the maximum memoize cache size. */
  var MAX_MEMOIZE_SIZE = 500;

  /** Used as the internal argument placeholder. */
  var PLACEHOLDER = '__lodash_placeholder__';

  /** Used to compose bitmasks for cloning. */
  var CLONE_DEEP_FLAG = 1,
      CLONE_FLAT_FLAG = 2,
      CLONE_SYMBOLS_FLAG = 4;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG = 1,
      COMPARE_UNORDERED_FLAG = 2;

  /** Used to compose bitmasks for function metadata. */
  var WRAP_BIND_FLAG = 1,
      WRAP_BIND_KEY_FLAG = 2,
      WRAP_CURRY_BOUND_FLAG = 4,
      WRAP_CURRY_FLAG = 8,
      WRAP_CURRY_RIGHT_FLAG = 16,
      WRAP_PARTIAL_FLAG = 32,
      WRAP_PARTIAL_RIGHT_FLAG = 64,
      WRAP_ARY_FLAG = 128,
      WRAP_REARG_FLAG = 256,
      WRAP_FLIP_FLAG = 512;

  /** Used as default options for `_.truncate`. */
  var DEFAULT_TRUNC_LENGTH = 30,
      DEFAULT_TRUNC_OMISSION = '...';

  /** Used to detect hot functions by number of calls within a span of milliseconds. */
  var HOT_COUNT = 800,
      HOT_SPAN = 16;

  /** Used to indicate the type of lazy iteratees. */
  var LAZY_FILTER_FLAG = 1,
      LAZY_MAP_FLAG = 2,
      LAZY_WHILE_FLAG = 3;

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0,
      MAX_SAFE_INTEGER = 9007199254740991,
      MAX_INTEGER = 1.7976931348623157e+308,
      NAN = 0 / 0;

  /** Used as references for the maximum length and index of an array. */
  var MAX_ARRAY_LENGTH = 4294967295,
      MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1,
      HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

  /** Used to associate wrap methods with their bit flags. */
  var wrapFlags = [
    ['ary', WRAP_ARY_FLAG],
    ['bind', WRAP_BIND_FLAG],
    ['bindKey', WRAP_BIND_KEY_FLAG],
    ['curry', WRAP_CURRY_FLAG],
    ['curryRight', WRAP_CURRY_RIGHT_FLAG],
    ['flip', WRAP_FLIP_FLAG],
    ['partial', WRAP_PARTIAL_FLAG],
    ['partialRight', WRAP_PARTIAL_RIGHT_FLAG],
    ['rearg', WRAP_REARG_FLAG]
  ];

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      asyncTag = '[object AsyncFunction]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      domExcTag = '[object DOMException]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      nullTag = '[object Null]',
      objectTag = '[object Object]',
      promiseTag = '[object Promise]',
      proxyTag = '[object Proxy]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      symbolTag = '[object Symbol]',
      undefinedTag = '[object Undefined]',
      weakMapTag = '[object WeakMap]',
      weakSetTag = '[object WeakSet]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to match empty string literals in compiled template source. */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /** Used to match HTML entities and HTML characters. */
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g,
      reUnescapedHtml = /[&<>"']/g,
      reHasEscapedHtml = RegExp(reEscapedHtml.source),
      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

  /** Used to match template delimiters. */
  var reEscape = /<%-([\s\S]+?)%>/g,
      reEvaluate = /<%([\s\S]+?)%>/g,
      reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g,
      reHasRegExpChar = RegExp(reRegExpChar.source);

  /** Used to match leading whitespace. */
  var reTrimStart = /^\s+/;

  /** Used to match a single whitespace character. */
  var reWhitespace = /\s/;

  /** Used to match wrap detail comments. */
  var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,
      reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/,
      reSplitDetails = /,? & /;

  /** Used to match words composed of alphanumeric characters. */
  var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;

  /**
   * Used to validate the `validate` option in `_.template` variable.
   *
   * Forbids characters which could potentially change the meaning of the function argument definition:
   * - "()," (modification of function parameters)
   * - "=" (default value)
   * - "[]{}" (destructuring of function parameters)
   * - "/" (beginning of a comment)
   * - whitespace
   */
  var reForbiddenIdentifierChars = /[()=,{}\[\]\/\s]/;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /**
   * Used to match
   * [ES template delimiters](http://ecma-international.org/ecma-262/7.0/#sec-template-literal-lexical-components).
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /** Used to detect bad signed hexadecimal string values. */
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

  /** Used to detect binary string values. */
  var reIsBinary = /^0b[01]+$/i;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect octal string values. */
  var reIsOctal = /^0o[0-7]+$/i;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /** Used to match Latin Unicode letters (excluding mathematical operators). */
  var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;

  /** Used to ensure capturing order of template delimiters. */
  var reNoMatch = /($^)/;

  /** Used to match unescaped characters in compiled string literals. */
  var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

  /** Used to compose unicode character classes. */
  var rsAstralRange = '\\ud800-\\udfff',
      rsComboMarksRange = '\\u0300-\\u036f',
      reComboHalfMarksRange = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange = '\\u20d0-\\u20ff',
      rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
      rsDingbatRange = '\\u2700-\\u27bf',
      rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff',
      rsMathOpRange = '\\xac\\xb1\\xd7\\xf7',
      rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf',
      rsPunctuationRange = '\\u2000-\\u206f',
      rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000',
      rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde',
      rsVarRange = '\\ufe0e\\ufe0f',
      rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;

  /** Used to compose unicode capture groups. */
  var rsApos = "['\u2019]",
      rsAstral = '[' + rsAstralRange + ']',
      rsBreak = '[' + rsBreakRange + ']',
      rsCombo = '[' + rsComboRange + ']',
      rsDigits = '\\d+',
      rsDingbat = '[' + rsDingbatRange + ']',
      rsLower = '[' + rsLowerRange + ']',
      rsMisc = '[^' + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + ']',
      rsFitz = '\\ud83c[\\udffb-\\udfff]',
      rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
      rsNonAstral = '[^' + rsAstralRange + ']',
      rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
      rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
      rsUpper = '[' + rsUpperRange + ']',
      rsZWJ = '\\u200d';

  /** Used to compose unicode regexes. */
  var rsMiscLower = '(?:' + rsLower + '|' + rsMisc + ')',
      rsMiscUpper = '(?:' + rsUpper + '|' + rsMisc + ')',
      rsOptContrLower = '(?:' + rsApos + '(?:d|ll|m|re|s|t|ve))?',
      rsOptContrUpper = '(?:' + rsApos + '(?:D|LL|M|RE|S|T|VE))?',
      reOptMod = rsModifier + '?',
      rsOptVar = '[' + rsVarRange + ']?',
      rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
      rsOrdLower = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])',
      rsOrdUpper = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])',
      rsSeq = rsOptVar + reOptMod + rsOptJoin,
      rsEmoji = '(?:' + [rsDingbat, rsRegional, rsSurrPair].join('|') + ')' + rsSeq,
      rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

  /** Used to match apostrophes. */
  var reApos = RegExp(rsApos, 'g');

  /**
   * Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
   * [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
   */
  var reComboMark = RegExp(rsCombo, 'g');

  /** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
  var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

  /** Used to match complex or compound words. */
  var reUnicodeWord = RegExp([
    rsUpper + '?' + rsLower + '+' + rsOptContrLower + '(?=' + [rsBreak, rsUpper, '$'].join('|') + ')',
    rsMiscUpper + '+' + rsOptContrUpper + '(?=' + [rsBreak, rsUpper + rsMiscLower, '$'].join('|') + ')',
    rsUpper + '?' + rsMiscLower + '+' + rsOptContrLower,
    rsUpper + '+' + rsOptContrUpper,
    rsOrdUpper,
    rsOrdLower,
    rsDigits,
    rsEmoji
  ].join('|'), 'g');

  /** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
  var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboRange + rsVarRange + ']');

  /** Used to detect strings that need a more robust regexp to match words. */
  var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;

  /** Used to assign default `context` object properties. */
  var contextProps = [
    'Array', 'Buffer', 'DataView', 'Date', 'Error', 'Float32Array', 'Float64Array',
    'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Map', 'Math', 'Object',
    'Promise', 'RegExp', 'Set', 'String', 'Symbol', 'TypeError', 'Uint8Array',
    'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'WeakMap',
    '_', 'clearTimeout', 'isFinite', 'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify. */
  var templateCounter = -1;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  typedArrayTags[errorTag] = typedArrayTags[funcTag] =
  typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
  typedArrayTags[setTag] = typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] = false;

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag] = cloneableTags[arrayTag] =
  cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
  cloneableTags[boolTag] = cloneableTags[dateTag] =
  cloneableTags[float32Tag] = cloneableTags[float64Tag] =
  cloneableTags[int8Tag] = cloneableTags[int16Tag] =
  cloneableTags[int32Tag] = cloneableTags[mapTag] =
  cloneableTags[numberTag] = cloneableTags[objectTag] =
  cloneableTags[regexpTag] = cloneableTags[setTag] =
  cloneableTags[stringTag] = cloneableTags[symbolTag] =
  cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
  cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
  cloneableTags[errorTag] = cloneableTags[funcTag] =
  cloneableTags[weakMapTag] = false;

  /** Used to map Latin Unicode letters to basic Latin letters. */
  var deburredLetters = {
    // Latin-1 Supplement block.
    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
    '\xc7': 'C',  '\xe7': 'c',
    '\xd0': 'D',  '\xf0': 'd',
    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
    '\xcc': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
    '\xec': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
    '\xd1': 'N',  '\xf1': 'n',
    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
    '\xc6': 'Ae', '\xe6': 'ae',
    '\xde': 'Th', '\xfe': 'th',
    '\xdf': 'ss',
    // Latin Extended-A block.
    '\u0100': 'A',  '\u0102': 'A', '\u0104': 'A',
    '\u0101': 'a',  '\u0103': 'a', '\u0105': 'a',
    '\u0106': 'C',  '\u0108': 'C', '\u010a': 'C', '\u010c': 'C',
    '\u0107': 'c',  '\u0109': 'c', '\u010b': 'c', '\u010d': 'c',
    '\u010e': 'D',  '\u0110': 'D', '\u010f': 'd', '\u0111': 'd',
    '\u0112': 'E',  '\u0114': 'E', '\u0116': 'E', '\u0118': 'E', '\u011a': 'E',
    '\u0113': 'e',  '\u0115': 'e', '\u0117': 'e', '\u0119': 'e', '\u011b': 'e',
    '\u011c': 'G',  '\u011e': 'G', '\u0120': 'G', '\u0122': 'G',
    '\u011d': 'g',  '\u011f': 'g', '\u0121': 'g', '\u0123': 'g',
    '\u0124': 'H',  '\u0126': 'H', '\u0125': 'h', '\u0127': 'h',
    '\u0128': 'I',  '\u012a': 'I', '\u012c': 'I', '\u012e': 'I', '\u0130': 'I',
    '\u0129': 'i',  '\u012b': 'i', '\u012d': 'i', '\u012f': 'i', '\u0131': 'i',
    '\u0134': 'J',  '\u0135': 'j',
    '\u0136': 'K',  '\u0137': 'k', '\u0138': 'k',
    '\u0139': 'L',  '\u013b': 'L', '\u013d': 'L', '\u013f': 'L', '\u0141': 'L',
    '\u013a': 'l',  '\u013c': 'l', '\u013e': 'l', '\u0140': 'l', '\u0142': 'l',
    '\u0143': 'N',  '\u0145': 'N', '\u0147': 'N', '\u014a': 'N',
    '\u0144': 'n',  '\u0146': 'n', '\u0148': 'n', '\u014b': 'n',
    '\u014c': 'O',  '\u014e': 'O', '\u0150': 'O',
    '\u014d': 'o',  '\u014f': 'o', '\u0151': 'o',
    '\u0154': 'R',  '\u0156': 'R', '\u0158': 'R',
    '\u0155': 'r',  '\u0157': 'r', '\u0159': 'r',
    '\u015a': 'S',  '\u015c': 'S', '\u015e': 'S', '\u0160': 'S',
    '\u015b': 's',  '\u015d': 's', '\u015f': 's', '\u0161': 's',
    '\u0162': 'T',  '\u0164': 'T', '\u0166': 'T',
    '\u0163': 't',  '\u0165': 't', '\u0167': 't',
    '\u0168': 'U',  '\u016a': 'U', '\u016c': 'U', '\u016e': 'U', '\u0170': 'U', '\u0172': 'U',
    '\u0169': 'u',  '\u016b': 'u', '\u016d': 'u', '\u016f': 'u', '\u0171': 'u', '\u0173': 'u',
    '\u0174': 'W',  '\u0175': 'w',
    '\u0176': 'Y',  '\u0177': 'y', '\u0178': 'Y',
    '\u0179': 'Z',  '\u017b': 'Z', '\u017d': 'Z',
    '\u017a': 'z',  '\u017c': 'z', '\u017e': 'z',
    '\u0132': 'IJ', '\u0133': 'ij',
    '\u0152': 'Oe', '\u0153': 'oe',
    '\u0149': "'n", '\u017f': 's'
  };

  /** Used to map characters to HTML entities. */
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  /** Used to map HTML entities to characters. */
  var htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };

  /** Used to escape characters for inclusion in compiled string literals. */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Built-in method references without a dependency on `root`. */
  var freeParseFloat = parseFloat,
      freeParseInt = parseInt;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();

  /** Detect free variable `exports`. */
  var freeExports =  true && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && "object" == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;

      if (types) {
        return types;
      }

      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());

  /* Node.js helper references. */
  var nodeIsArrayBuffer = nodeUtil && nodeUtil.isArrayBuffer,
      nodeIsDate = nodeUtil && nodeUtil.isDate,
      nodeIsMap = nodeUtil && nodeUtil.isMap,
      nodeIsRegExp = nodeUtil && nodeUtil.isRegExp,
      nodeIsSet = nodeUtil && nodeUtil.isSet,
      nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

  /*--------------------------------------------------------------------------*/

  /**
   * A faster alternative to `Function#apply`, this function invokes `func`
   * with the `this` binding of `thisArg` and the arguments of `args`.
   *
   * @private
   * @param {Function} func The function to invoke.
   * @param {*} thisArg The `this` binding of `func`.
   * @param {Array} args The arguments to invoke `func` with.
   * @returns {*} Returns the result of `func`.
   */
  function apply(func, thisArg, args) {
    switch (args.length) {
      case 0: return func.call(thisArg);
      case 1: return func.call(thisArg, args[0]);
      case 2: return func.call(thisArg, args[0], args[1]);
      case 3: return func.call(thisArg, args[0], args[1], args[2]);
    }
    return func.apply(thisArg, args);
  }

  /**
   * A specialized version of `baseAggregator` for arrays.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} setter The function to set `accumulator` values.
   * @param {Function} iteratee The iteratee to transform keys.
   * @param {Object} accumulator The initial aggregated object.
   * @returns {Function} Returns `accumulator`.
   */
  function arrayAggregator(array, setter, iteratee, accumulator) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      var value = array[index];
      setter(accumulator, value, iteratee(value), array);
    }
    return accumulator;
  }

  /**
   * A specialized version of `_.forEach` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEach(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (iteratee(array[index], index, array) === false) {
        break;
      }
    }
    return array;
  }

  /**
   * A specialized version of `_.forEachRight` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEachRight(array, iteratee) {
    var length = array == null ? 0 : array.length;

    while (length--) {
      if (iteratee(array[length], length, array) === false) {
        break;
      }
    }
    return array;
  }

  /**
   * A specialized version of `_.every` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if all elements pass the predicate check,
   *  else `false`.
   */
  function arrayEvery(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (!predicate(array[index], index, array)) {
        return false;
      }
    }
    return true;
  }

  /**
   * A specialized version of `_.filter` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {Array} Returns the new filtered array.
   */
  function arrayFilter(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  /**
   * A specialized version of `_.includes` for arrays without support for
   * specifying an index to search from.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludes(array, value) {
    var length = array == null ? 0 : array.length;
    return !!length && baseIndexOf(array, value, 0) > -1;
  }

  /**
   * This function is like `arrayIncludes` except that it accepts a comparator.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @param {Function} comparator The comparator invoked per element.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludesWith(array, value, comparator) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (comparator(value, array[index])) {
        return true;
      }
    }
    return false;
  }

  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length,
        result = Array(length);

    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
        length = values.length,
        offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  /**
   * A specialized version of `_.reduce` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} [accumulator] The initial value.
   * @param {boolean} [initAccum] Specify using the first element of `array` as
   *  the initial value.
   * @returns {*} Returns the accumulated value.
   */
  function arrayReduce(array, iteratee, accumulator, initAccum) {
    var index = -1,
        length = array == null ? 0 : array.length;

    if (initAccum && length) {
      accumulator = array[++index];
    }
    while (++index < length) {
      accumulator = iteratee(accumulator, array[index], index, array);
    }
    return accumulator;
  }

  /**
   * A specialized version of `_.reduceRight` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} [accumulator] The initial value.
   * @param {boolean} [initAccum] Specify using the last element of `array` as
   *  the initial value.
   * @returns {*} Returns the accumulated value.
   */
  function arrayReduceRight(array, iteratee, accumulator, initAccum) {
    var length = array == null ? 0 : array.length;
    if (initAccum && length) {
      accumulator = array[--length];
    }
    while (length--) {
      accumulator = iteratee(accumulator, array[length], length, array);
    }
    return accumulator;
  }

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the size of an ASCII `string`.
   *
   * @private
   * @param {string} string The string inspect.
   * @returns {number} Returns the string size.
   */
  var asciiSize = baseProperty('length');

  /**
   * Converts an ASCII `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function asciiToArray(string) {
    return string.split('');
  }

  /**
   * Splits an ASCII `string` into an array of its words.
   *
   * @private
   * @param {string} The string to inspect.
   * @returns {Array} Returns the words of `string`.
   */
  function asciiWords(string) {
    return string.match(reAsciiWord) || [];
  }

  /**
   * The base implementation of methods like `_.findKey` and `_.findLastKey`,
   * without support for iteratee shorthands, which iterates over `collection`
   * using `eachFunc`.
   *
   * @private
   * @param {Array|Object} collection The collection to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {Function} eachFunc The function to iterate over `collection`.
   * @returns {*} Returns the found element or its key, else `undefined`.
   */
  function baseFindKey(collection, predicate, eachFunc) {
    var result;
    eachFunc(collection, function(value, key, collection) {
      if (predicate(value, key, collection)) {
        result = key;
        return false;
      }
    });
    return result;
  }

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 1 : -1);

    while ((fromRight ? index-- : ++index < length)) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    return value === value
      ? strictIndexOf(array, value, fromIndex)
      : baseFindIndex(array, baseIsNaN, fromIndex);
  }

  /**
   * This function is like `baseIndexOf` except that it accepts a comparator.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @param {Function} comparator The comparator invoked per element.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOfWith(array, value, fromIndex, comparator) {
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (comparator(array[index], value)) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.isNaN` without support for number objects.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
   */
  function baseIsNaN(value) {
    return value !== value;
  }

  /**
   * The base implementation of `_.mean` and `_.meanBy` without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {number} Returns the mean.
   */
  function baseMean(array, iteratee) {
    var length = array == null ? 0 : array.length;
    return length ? (baseSum(array, iteratee) / length) : NAN;
  }

  /**
   * The base implementation of `_.property` without support for deep paths.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function baseProperty(key) {
    return function(object) {
      return object == null ? undefined : object[key];
    };
  }

  /**
   * The base implementation of `_.propertyOf` without support for deep paths.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyOf(object) {
    return function(key) {
      return object == null ? undefined : object[key];
    };
  }

  /**
   * The base implementation of `_.reduce` and `_.reduceRight`, without support
   * for iteratee shorthands, which iterates over `collection` using `eachFunc`.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} accumulator The initial value.
   * @param {boolean} initAccum Specify using the first or last element of
   *  `collection` as the initial value.
   * @param {Function} eachFunc The function to iterate over `collection`.
   * @returns {*} Returns the accumulated value.
   */
  function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
    eachFunc(collection, function(value, index, collection) {
      accumulator = initAccum
        ? (initAccum = false, value)
        : iteratee(accumulator, value, index, collection);
    });
    return accumulator;
  }

  /**
   * The base implementation of `_.sortBy` which uses `comparer` to define the
   * sort order of `array` and replaces criteria objects with their corresponding
   * values.
   *
   * @private
   * @param {Array} array The array to sort.
   * @param {Function} comparer The function to define sort order.
   * @returns {Array} Returns `array`.
   */
  function baseSortBy(array, comparer) {
    var length = array.length;

    array.sort(comparer);
    while (length--) {
      array[length] = array[length].value;
    }
    return array;
  }

  /**
   * The base implementation of `_.sum` and `_.sumBy` without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {number} Returns the sum.
   */
  function baseSum(array, iteratee) {
    var result,
        index = -1,
        length = array.length;

    while (++index < length) {
      var current = iteratee(array[index]);
      if (current !== undefined) {
        result = result === undefined ? current : (result + current);
      }
    }
    return result;
  }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  /**
   * The base implementation of `_.toPairs` and `_.toPairsIn` which creates an array
   * of key-value pairs for `object` corresponding to the property names of `props`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array} props The property names to get values for.
   * @returns {Object} Returns the key-value pairs.
   */
  function baseToPairs(object, props) {
    return arrayMap(props, function(key) {
      return [key, object[key]];
    });
  }

  /**
   * The base implementation of `_.trim`.
   *
   * @private
   * @param {string} string The string to trim.
   * @returns {string} Returns the trimmed string.
   */
  function baseTrim(string) {
    return string
      ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, '')
      : string;
  }

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  /**
   * The base implementation of `_.values` and `_.valuesIn` which creates an
   * array of `object` property values corresponding to the property names
   * of `props`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array} props The property names to get values for.
   * @returns {Object} Returns the array of property values.
   */
  function baseValues(object, props) {
    return arrayMap(props, function(key) {
      return object[key];
    });
  }

  /**
   * Checks if a `cache` value for `key` exists.
   *
   * @private
   * @param {Object} cache The cache to query.
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function cacheHas(cache, key) {
    return cache.has(key);
  }

  /**
   * Used by `_.trim` and `_.trimStart` to get the index of the first string symbol
   * that is not found in the character symbols.
   *
   * @private
   * @param {Array} strSymbols The string symbols to inspect.
   * @param {Array} chrSymbols The character symbols to find.
   * @returns {number} Returns the index of the first unmatched string symbol.
   */
  function charsStartIndex(strSymbols, chrSymbols) {
    var index = -1,
        length = strSymbols.length;

    while (++index < length && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimEnd` to get the index of the last string symbol
   * that is not found in the character symbols.
   *
   * @private
   * @param {Array} strSymbols The string symbols to inspect.
   * @param {Array} chrSymbols The character symbols to find.
   * @returns {number} Returns the index of the last unmatched string symbol.
   */
  function charsEndIndex(strSymbols, chrSymbols) {
    var index = strSymbols.length;

    while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
    return index;
  }

  /**
   * Gets the number of `placeholder` occurrences in `array`.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} placeholder The placeholder to search for.
   * @returns {number} Returns the placeholder count.
   */
  function countHolders(array, placeholder) {
    var length = array.length,
        result = 0;

    while (length--) {
      if (array[length] === placeholder) {
        ++result;
      }
    }
    return result;
  }

  /**
   * Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
   * letters to basic Latin letters.
   *
   * @private
   * @param {string} letter The matched letter to deburr.
   * @returns {string} Returns the deburred letter.
   */
  var deburrLetter = basePropertyOf(deburredLetters);

  /**
   * Used by `_.escape` to convert characters to HTML entities.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  var escapeHtmlChar = basePropertyOf(htmlEscapes);

  /**
   * Used by `_.template` to escape characters for inclusion in compiled string literals.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(chr) {
    return '\\' + stringEscapes[chr];
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  /**
   * Checks if `string` contains Unicode symbols.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {boolean} Returns `true` if a symbol is found, else `false`.
   */
  function hasUnicode(string) {
    return reHasUnicode.test(string);
  }

  /**
   * Checks if `string` contains a word composed of Unicode symbols.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {boolean} Returns `true` if a word is found, else `false`.
   */
  function hasUnicodeWord(string) {
    return reHasUnicodeWord.test(string);
  }

  /**
   * Converts `iterator` to an array.
   *
   * @private
   * @param {Object} iterator The iterator to convert.
   * @returns {Array} Returns the converted array.
   */
  function iteratorToArray(iterator) {
    var data,
        result = [];

    while (!(data = iterator.next()).done) {
      result.push(data.value);
    }
    return result;
  }

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }

  /**
   * Replaces all `placeholder` elements in `array` with an internal placeholder
   * and returns an array of their indexes.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {*} placeholder The placeholder to replace.
   * @returns {Array} Returns the new array of placeholder indexes.
   */
  function replaceHolders(array, placeholder) {
    var index = -1,
        length = array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (value === placeholder || value === PLACEHOLDER) {
        array[index] = PLACEHOLDER;
        result[resIndex++] = index;
      }
    }
    return result;
  }

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }

  /**
   * Converts `set` to its value-value pairs.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the value-value pairs.
   */
  function setToPairs(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function(value) {
      result[++index] = [value, value];
    });
    return result;
  }

  /**
   * A specialized version of `_.indexOf` which performs strict equality
   * comparisons of values, i.e. `===`.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function strictIndexOf(array, value, fromIndex) {
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * A specialized version of `_.lastIndexOf` which performs strict equality
   * comparisons of values, i.e. `===`.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function strictLastIndexOf(array, value, fromIndex) {
    var index = fromIndex + 1;
    while (index--) {
      if (array[index] === value) {
        return index;
      }
    }
    return index;
  }

  /**
   * Gets the number of symbols in `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the string size.
   */
  function stringSize(string) {
    return hasUnicode(string)
      ? unicodeSize(string)
      : asciiSize(string);
  }

  /**
   * Converts `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function stringToArray(string) {
    return hasUnicode(string)
      ? unicodeToArray(string)
      : asciiToArray(string);
  }

  /**
   * Used by `_.trim` and `_.trimEnd` to get the index of the last non-whitespace
   * character of `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the index of the last non-whitespace character.
   */
  function trimmedEndIndex(string) {
    var index = string.length;

    while (index-- && reWhitespace.test(string.charAt(index))) {}
    return index;
  }

  /**
   * Used by `_.unescape` to convert HTML entities to characters.
   *
   * @private
   * @param {string} chr The matched character to unescape.
   * @returns {string} Returns the unescaped character.
   */
  var unescapeHtmlChar = basePropertyOf(htmlUnescapes);

  /**
   * Gets the size of a Unicode `string`.
   *
   * @private
   * @param {string} string The string inspect.
   * @returns {number} Returns the string size.
   */
  function unicodeSize(string) {
    var result = reUnicode.lastIndex = 0;
    while (reUnicode.test(string)) {
      ++result;
    }
    return result;
  }

  /**
   * Converts a Unicode `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function unicodeToArray(string) {
    return string.match(reUnicode) || [];
  }

  /**
   * Splits a Unicode `string` into an array of its words.
   *
   * @private
   * @param {string} The string to inspect.
   * @returns {Array} Returns the words of `string`.
   */
  function unicodeWords(string) {
    return string.match(reUnicodeWord) || [];
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new pristine `lodash` function using the `context` object.
   *
   * @static
   * @memberOf _
   * @since 1.1.0
   * @category Util
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns a new `lodash` function.
   * @example
   *
   * _.mixin({ 'foo': _.constant('foo') });
   *
   * var lodash = _.runInContext();
   * lodash.mixin({ 'bar': lodash.constant('bar') });
   *
   * _.isFunction(_.foo);
   * // => true
   * _.isFunction(_.bar);
   * // => false
   *
   * lodash.isFunction(lodash.foo);
   * // => false
   * lodash.isFunction(lodash.bar);
   * // => true
   *
   * // Create a suped-up `defer` in Node.js.
   * var defer = _.runInContext({ 'setTimeout': setImmediate }).defer;
   */
  var runInContext = (function runInContext(context) {
    context = context == null ? root : _.defaults(root.Object(), context, _.pick(root, contextProps));

    /** Built-in constructor references. */
    var Array = context.Array,
        Date = context.Date,
        Error = context.Error,
        Function = context.Function,
        Math = context.Math,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /** Used for built-in method references. */
    var arrayProto = Array.prototype,
        funcProto = Function.prototype,
        objectProto = Object.prototype;

    /** Used to detect overreaching core-js shims. */
    var coreJsData = context['__core-js_shared__'];

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /** Used to generate unique IDs. */
    var idCounter = 0;

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto.toString;

    /** Used to infer the `Object` constructor. */
    var objectCtorString = funcToString.call(Object);

    /** Used to restore the original `_` reference in `_.noConflict`. */
    var oldDash = root._;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /** Built-in value references. */
    var Buffer = moduleExports ? context.Buffer : undefined,
        Symbol = context.Symbol,
        Uint8Array = context.Uint8Array,
        allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined,
        getPrototype = overArg(Object.getPrototypeOf, Object),
        objectCreate = Object.create,
        propertyIsEnumerable = objectProto.propertyIsEnumerable,
        splice = arrayProto.splice,
        spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined,
        symIterator = Symbol ? Symbol.iterator : undefined,
        symToStringTag = Symbol ? Symbol.toStringTag : undefined;

    var defineProperty = (function() {
      try {
        var func = getNative(Object, 'defineProperty');
        func({}, '', {});
        return func;
      } catch (e) {}
    }());

    /** Mocked built-ins. */
    var ctxClearTimeout = context.clearTimeout !== root.clearTimeout && context.clearTimeout,
        ctxNow = Date && Date.now !== root.Date.now && Date.now,
        ctxSetTimeout = context.setTimeout !== root.setTimeout && context.setTimeout;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeCeil = Math.ceil,
        nativeFloor = Math.floor,
        nativeGetSymbols = Object.getOwnPropertySymbols,
        nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
        nativeIsFinite = context.isFinite,
        nativeJoin = arrayProto.join,
        nativeKeys = overArg(Object.keys, Object),
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeNow = Date.now,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random,
        nativeReverse = arrayProto.reverse;

    /* Built-in method references that are verified to be native. */
    var DataView = getNative(context, 'DataView'),
        Map = getNative(context, 'Map'),
        Promise = getNative(context, 'Promise'),
        Set = getNative(context, 'Set'),
        WeakMap = getNative(context, 'WeakMap'),
        nativeCreate = getNative(Object, 'create');

    /** Used to store function metadata. */
    var metaMap = WeakMap && new WeakMap;

    /** Used to lookup unminified function names. */
    var realNames = {};

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = toSource(DataView),
        mapCtorString = toSource(Map),
        promiseCtorString = toSource(Promise),
        setCtorString = toSource(Set),
        weakMapCtorString = toSource(WeakMap);

    /** Used to convert symbols to primitives and strings. */
    var symbolProto = Symbol ? Symbol.prototype : undefined,
        symbolValueOf = symbolProto ? symbolProto.valueOf : undefined,
        symbolToString = symbolProto ? symbolProto.toString : undefined;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps `value` to enable implicit method
     * chain sequences. Methods that operate on and return arrays, collections,
     * and functions can be chained together. Methods that retrieve a single value
     * or may return a primitive value will automatically end the chain sequence
     * and return the unwrapped value. Otherwise, the value must be unwrapped
     * with `_#value`.
     *
     * Explicit chain sequences, which must be unwrapped with `_#value`, may be
     * enabled using `_.chain`.
     *
     * The execution of chained methods is lazy, that is, it's deferred until
     * `_#value` is implicitly or explicitly called.
     *
     * Lazy evaluation allows several methods to support shortcut fusion.
     * Shortcut fusion is an optimization to merge iteratee calls; this avoids
     * the creation of intermediate arrays and can greatly reduce the number of
     * iteratee executions. Sections of a chain sequence qualify for shortcut
     * fusion if the section is applied to an array and iteratees accept only
     * one argument. The heuristic for whether a section qualifies for shortcut
     * fusion is subject to change.
     *
     * Chaining is supported in custom builds as long as the `_#value` method is
     * directly or indirectly included in the build.
     *
     * In addition to lodash methods, wrappers have `Array` and `String` methods.
     *
     * The wrapper `Array` methods are:
     * `concat`, `join`, `pop`, `push`, `shift`, `sort`, `splice`, and `unshift`
     *
     * The wrapper `String` methods are:
     * `replace` and `split`
     *
     * The wrapper methods that support shortcut fusion are:
     * `at`, `compact`, `drop`, `dropRight`, `dropWhile`, `filter`, `find`,
     * `findLast`, `head`, `initial`, `last`, `map`, `reject`, `reverse`, `slice`,
     * `tail`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, and `toArray`
     *
     * The chainable wrapper methods are:
     * `after`, `ary`, `assign`, `assignIn`, `assignInWith`, `assignWith`, `at`,
     * `before`, `bind`, `bindAll`, `bindKey`, `castArray`, `chain`, `chunk`,
     * `commit`, `compact`, `concat`, `conforms`, `constant`, `countBy`, `create`,
     * `curry`, `debounce`, `defaults`, `defaultsDeep`, `defer`, `delay`,
     * `difference`, `differenceBy`, `differenceWith`, `drop`, `dropRight`,
     * `dropRightWhile`, `dropWhile`, `extend`, `extendWith`, `fill`, `filter`,
     * `flatMap`, `flatMapDeep`, `flatMapDepth`, `flatten`, `flattenDeep`,
     * `flattenDepth`, `flip`, `flow`, `flowRight`, `fromPairs`, `functions`,
     * `functionsIn`, `groupBy`, `initial`, `intersection`, `intersectionBy`,
     * `intersectionWith`, `invert`, `invertBy`, `invokeMap`, `iteratee`, `keyBy`,
     * `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`, `matchesProperty`,
     * `memoize`, `merge`, `mergeWith`, `method`, `methodOf`, `mixin`, `negate`,
     * `nthArg`, `omit`, `omitBy`, `once`, `orderBy`, `over`, `overArgs`,
     * `overEvery`, `overSome`, `partial`, `partialRight`, `partition`, `pick`,
     * `pickBy`, `plant`, `property`, `propertyOf`, `pull`, `pullAll`, `pullAllBy`,
     * `pullAllWith`, `pullAt`, `push`, `range`, `rangeRight`, `rearg`, `reject`,
     * `remove`, `rest`, `reverse`, `sampleSize`, `set`, `setWith`, `shuffle`,
     * `slice`, `sort`, `sortBy`, `splice`, `spread`, `tail`, `take`, `takeRight`,
     * `takeRightWhile`, `takeWhile`, `tap`, `throttle`, `thru`, `toArray`,
     * `toPairs`, `toPairsIn`, `toPath`, `toPlainObject`, `transform`, `unary`,
     * `union`, `unionBy`, `unionWith`, `uniq`, `uniqBy`, `uniqWith`, `unset`,
     * `unshift`, `unzip`, `unzipWith`, `update`, `updateWith`, `values`,
     * `valuesIn`, `without`, `wrap`, `xor`, `xorBy`, `xorWith`, `zip`,
     * `zipObject`, `zipObjectDeep`, and `zipWith`
     *
     * The wrapper methods that are **not** chainable by default are:
     * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clamp`, `clone`,
     * `cloneDeep`, `cloneDeepWith`, `cloneWith`, `conformsTo`, `deburr`,
     * `defaultTo`, `divide`, `each`, `eachRight`, `endsWith`, `eq`, `escape`,
     * `escapeRegExp`, `every`, `find`, `findIndex`, `findKey`, `findLast`,
     * `findLastIndex`, `findLastKey`, `first`, `floor`, `forEach`, `forEachRight`,
     * `forIn`, `forInRight`, `forOwn`, `forOwnRight`, `get`, `gt`, `gte`, `has`,
     * `hasIn`, `head`, `identity`, `includes`, `indexOf`, `inRange`, `invoke`,
     * `isArguments`, `isArray`, `isArrayBuffer`, `isArrayLike`, `isArrayLikeObject`,
     * `isBoolean`, `isBuffer`, `isDate`, `isElement`, `isEmpty`, `isEqual`,
     * `isEqualWith`, `isError`, `isFinite`, `isFunction`, `isInteger`, `isLength`,
     * `isMap`, `isMatch`, `isMatchWith`, `isNaN`, `isNative`, `isNil`, `isNull`,
     * `isNumber`, `isObject`, `isObjectLike`, `isPlainObject`, `isRegExp`,
     * `isSafeInteger`, `isSet`, `isString`, `isUndefined`, `isTypedArray`,
     * `isWeakMap`, `isWeakSet`, `join`, `kebabCase`, `last`, `lastIndexOf`,
     * `lowerCase`, `lowerFirst`, `lt`, `lte`, `max`, `maxBy`, `mean`, `meanBy`,
     * `min`, `minBy`, `multiply`, `noConflict`, `noop`, `now`, `nth`, `pad`,
     * `padEnd`, `padStart`, `parseInt`, `pop`, `random`, `reduce`, `reduceRight`,
     * `repeat`, `result`, `round`, `runInContext`, `sample`, `shift`, `size`,
     * `snakeCase`, `some`, `sortedIndex`, `sortedIndexBy`, `sortedLastIndex`,
     * `sortedLastIndexBy`, `startCase`, `startsWith`, `stubArray`, `stubFalse`,
     * `stubObject`, `stubString`, `stubTrue`, `subtract`, `sum`, `sumBy`,
     * `template`, `times`, `toFinite`, `toInteger`, `toJSON`, `toLength`,
     * `toLower`, `toNumber`, `toSafeInteger`, `toString`, `toUpper`, `trim`,
     * `trimEnd`, `trimStart`, `truncate`, `unescape`, `uniqueId`, `upperCase`,
     * `upperFirst`, `value`, and `words`
     *
     * @name _
     * @constructor
     * @category Seq
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // Returns an unwrapped value.
     * wrapped.reduce(_.add);
     * // => 6
     *
     * // Returns a wrapped value.
     * var squares = wrapped.map(square);
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
        if (value instanceof LodashWrapper) {
          return value;
        }
        if (hasOwnProperty.call(value, '__wrapped__')) {
          return wrapperClone(value);
        }
      }
      return new LodashWrapper(value);
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} proto The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function object() {}
      return function(proto) {
        if (!isObject(proto)) {
          return {};
        }
        if (objectCreate) {
          return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object;
        object.prototype = undefined;
        return result;
      };
    }());

    /**
     * The function whose prototype chain sequence wrappers inherit from.
     *
     * @private
     */
    function baseLodash() {
      // No operation performed.
    }

    /**
     * The base constructor for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap.
     * @param {boolean} [chainAll] Enable explicit method chain sequences.
     */
    function LodashWrapper(value, chainAll) {
      this.__wrapped__ = value;
      this.__actions__ = [];
      this.__chain__ = !!chainAll;
      this.__index__ = 0;
      this.__values__ = undefined;
    }

    /**
     * By default, the template delimiters used by lodash are like those in
     * embedded Ruby (ERB) as well as ES2015 template strings. Change the
     * following template settings to use alternative delimiters.
     *
     * @static
     * @memberOf _
     * @type {Object}
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type {RegExp}
       */
      'escape': reEscape,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type {RegExp}
       */
      'evaluate': reEvaluate,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type {RegExp}
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type {string}
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type {Object}
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type {Function}
         */
        '_': lodash
      }
    };

    // Ensure wrappers are instances of `baseLodash`.
    lodash.prototype = baseLodash.prototype;
    lodash.prototype.constructor = lodash;

    LodashWrapper.prototype = baseCreate(baseLodash.prototype);
    LodashWrapper.prototype.constructor = LodashWrapper;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
     *
     * @private
     * @constructor
     * @param {*} value The value to wrap.
     */
    function LazyWrapper(value) {
      this.__wrapped__ = value;
      this.__actions__ = [];
      this.__dir__ = 1;
      this.__filtered__ = false;
      this.__iteratees__ = [];
      this.__takeCount__ = MAX_ARRAY_LENGTH;
      this.__views__ = [];
    }

    /**
     * Creates a clone of the lazy wrapper object.
     *
     * @private
     * @name clone
     * @memberOf LazyWrapper
     * @returns {Object} Returns the cloned `LazyWrapper` object.
     */
    function lazyClone() {
      var result = new LazyWrapper(this.__wrapped__);
      result.__actions__ = copyArray(this.__actions__);
      result.__dir__ = this.__dir__;
      result.__filtered__ = this.__filtered__;
      result.__iteratees__ = copyArray(this.__iteratees__);
      result.__takeCount__ = this.__takeCount__;
      result.__views__ = copyArray(this.__views__);
      return result;
    }

    /**
     * Reverses the direction of lazy iteration.
     *
     * @private
     * @name reverse
     * @memberOf LazyWrapper
     * @returns {Object} Returns the new reversed `LazyWrapper` object.
     */
    function lazyReverse() {
      if (this.__filtered__) {
        var result = new LazyWrapper(this);
        result.__dir__ = -1;
        result.__filtered__ = true;
      } else {
        result = this.clone();
        result.__dir__ *= -1;
      }
      return result;
    }

    /**
     * Extracts the unwrapped value from its lazy wrapper.
     *
     * @private
     * @name value
     * @memberOf LazyWrapper
     * @returns {*} Returns the unwrapped value.
     */
    function lazyValue() {
      var array = this.__wrapped__.value(),
          dir = this.__dir__,
          isArr = isArray(array),
          isRight = dir < 0,
          arrLength = isArr ? array.length : 0,
          view = getView(0, arrLength, this.__views__),
          start = view.start,
          end = view.end,
          length = end - start,
          index = isRight ? end : (start - 1),
          iteratees = this.__iteratees__,
          iterLength = iteratees.length,
          resIndex = 0,
          takeCount = nativeMin(length, this.__takeCount__);

      if (!isArr || (!isRight && arrLength == length && takeCount == length)) {
        return baseWrapperValue(array, this.__actions__);
      }
      var result = [];

      outer:
      while (length-- && resIndex < takeCount) {
        index += dir;

        var iterIndex = -1,
            value = array[index];

        while (++iterIndex < iterLength) {
          var data = iteratees[iterIndex],
              iteratee = data.iteratee,
              type = data.type,
              computed = iteratee(value);

          if (type == LAZY_MAP_FLAG) {
            value = computed;
          } else if (!computed) {
            if (type == LAZY_FILTER_FLAG) {
              continue outer;
            } else {
              break outer;
            }
          }
        }
        result[resIndex++] = value;
      }
      return result;
    }

    // Ensure `LazyWrapper` is an instance of `baseLodash`.
    LazyWrapper.prototype = baseCreate(baseLodash.prototype);
    LazyWrapper.prototype.constructor = LazyWrapper;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : undefined;
    }

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
    }

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
      return this;
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear;
    Hash.prototype['delete'] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;

    /*------------------------------------------------------------------------*/

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype['delete'] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        'hash': new Hash,
        'map': new (Map || ListCache),
        'string': new Hash
      };
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      var result = getMapData(this, key)['delete'](key);
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      var data = getMapData(this, key),
          size = data.size;

      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype['delete'] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;

    /*------------------------------------------------------------------------*/

    /**
     *
     * Creates an array cache object to store unique values.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var index = -1,
          length = values == null ? 0 : values.length;

      this.__data__ = new MapCache;
      while (++index < length) {
        this.add(values[index]);
      }
    }

    /**
     * Adds `value` to the array cache.
     *
     * @private
     * @name add
     * @memberOf SetCache
     * @alias push
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache instance.
     */
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }

    /**
     * Checks if `value` is in the array cache.
     *
     * @private
     * @name has
     * @memberOf SetCache
     * @param {*} value The value to search for.
     * @returns {number} Returns `true` if `value` is found, else `false`.
     */
    function setCacheHas(value) {
      return this.__data__.has(value);
    }

    // Add methods to `SetCache`.
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = new ListCache;
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the stack.
     *
     * @private
     * @name delete
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function stackDelete(key) {
      var data = this.__data__,
          result = data['delete'](key);

      this.size = data.size;
      return result;
    }

    /**
     * Gets the stack value for `key`.
     *
     * @private
     * @name get
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function stackGet(key) {
      return this.__data__.get(key);
    }

    /**
     * Checks if a stack value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function stackHas(key) {
      return this.__data__.has(key);
    }

    /**
     * Sets the stack `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = stackClear;
    Stack.prototype['delete'] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value),
          isArg = !isArr && isArguments(value),
          isBuff = !isArr && !isArg && isBuffer(value),
          isType = !isArr && !isArg && !isBuff && isTypedArray(value),
          skipIndexes = isArr || isArg || isBuff || isType,
          result = skipIndexes ? baseTimes(value.length, String) : [],
          length = result.length;

      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) &&
            !(skipIndexes && (
               // Safari 9 has enumerable `arguments.length` in strict mode.
               key == 'length' ||
               // Node.js 0.10 has enumerable non-index properties on buffers.
               (isBuff && (key == 'offset' || key == 'parent')) ||
               // PhantomJS 2 has enumerable non-index properties on typed arrays.
               (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
               // Skip index properties.
               isIndex(key, length)
            ))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.sample` for arrays.
     *
     * @private
     * @param {Array} array The array to sample.
     * @returns {*} Returns the random element.
     */
    function arraySample(array) {
      var length = array.length;
      return length ? array[baseRandom(0, length - 1)] : undefined;
    }

    /**
     * A specialized version of `_.sampleSize` for arrays.
     *
     * @private
     * @param {Array} array The array to sample.
     * @param {number} n The number of elements to sample.
     * @returns {Array} Returns the random elements.
     */
    function arraySampleSize(array, n) {
      return shuffleSelf(copyArray(array), baseClamp(n, 0, array.length));
    }

    /**
     * A specialized version of `_.shuffle` for arrays.
     *
     * @private
     * @param {Array} array The array to shuffle.
     * @returns {Array} Returns the new shuffled array.
     */
    function arrayShuffle(array) {
      return shuffleSelf(copyArray(array));
    }

    /**
     * This function is like `assignValue` except that it doesn't assign
     * `undefined` values.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignMergeValue(object, key, value) {
      if ((value !== undefined && !eq(object[key], value)) ||
          (value === undefined && !(key in object))) {
        baseAssignValue(object, key, value);
      }
    }

    /**
     * Assigns `value` to `key` of `object` if the existing value is not equivalent
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
          (value === undefined && !(key in object))) {
        baseAssignValue(object, key, value);
      }
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Aggregates elements of `collection` on `accumulator` with keys transformed
     * by `iteratee` and values set by `setter`.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} setter The function to set `accumulator` values.
     * @param {Function} iteratee The iteratee to transform keys.
     * @param {Object} accumulator The initial aggregated object.
     * @returns {Function} Returns `accumulator`.
     */
    function baseAggregator(collection, setter, iteratee, accumulator) {
      baseEach(collection, function(value, key, collection) {
        setter(accumulator, value, iteratee(value), collection);
      });
      return accumulator;
    }

    /**
     * The base implementation of `_.assign` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssign(object, source) {
      return object && copyObject(source, keys(source), object);
    }

    /**
     * The base implementation of `_.assignIn` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssignIn(object, source) {
      return object && copyObject(source, keysIn(source), object);
    }

    /**
     * The base implementation of `assignValue` and `assignMergeValue` without
     * value checks.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function baseAssignValue(object, key, value) {
      if (key == '__proto__' && defineProperty) {
        defineProperty(object, key, {
          'configurable': true,
          'enumerable': true,
          'value': value,
          'writable': true
        });
      } else {
        object[key] = value;
      }
    }

    /**
     * The base implementation of `_.at` without support for individual paths.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {string[]} paths The property paths to pick.
     * @returns {Array} Returns the picked elements.
     */
    function baseAt(object, paths) {
      var index = -1,
          length = paths.length,
          result = Array(length),
          skip = object == null;

      while (++index < length) {
        result[index] = skip ? undefined : get(object, paths[index]);
      }
      return result;
    }

    /**
     * The base implementation of `_.clamp` which doesn't coerce arguments.
     *
     * @private
     * @param {number} number The number to clamp.
     * @param {number} [lower] The lower bound.
     * @param {number} upper The upper bound.
     * @returns {number} Returns the clamped number.
     */
    function baseClamp(number, lower, upper) {
      if (number === number) {
        if (upper !== undefined) {
          number = number <= upper ? number : upper;
        }
        if (lower !== undefined) {
          number = number >= lower ? number : lower;
        }
      }
      return number;
    }

    /**
     * The base implementation of `_.clone` and `_.cloneDeep` which tracks
     * traversed objects.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Deep clone
     *  2 - Flatten inherited properties
     *  4 - Clone symbols
     * @param {Function} [customizer] The function to customize cloning.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The parent object of `value`.
     * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, bitmask, customizer, key, object, stack) {
      var result,
          isDeep = bitmask & CLONE_DEEP_FLAG,
          isFlat = bitmask & CLONE_FLAT_FLAG,
          isFull = bitmask & CLONE_SYMBOLS_FLAG;

      if (customizer) {
        result = object ? customizer(value, key, object, stack) : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return copyArray(value, result);
        }
      } else {
        var tag = getTag(value),
            isFunc = tag == funcTag || tag == genTag;

        if (isBuffer(value)) {
          return cloneBuffer(value, isDeep);
        }
        if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
          result = (isFlat || isFunc) ? {} : initCloneObject(value);
          if (!isDeep) {
            return isFlat
              ? copySymbolsIn(value, baseAssignIn(result, value))
              : copySymbols(value, baseAssign(result, value));
          }
        } else {
          if (!cloneableTags[tag]) {
            return object ? value : {};
          }
          result = initCloneByTag(value, tag, isDeep);
        }
      }
      // Check for circular references and return its corresponding clone.
      stack || (stack = new Stack);
      var stacked = stack.get(value);
      if (stacked) {
        return stacked;
      }
      stack.set(value, result);

      if (isSet(value)) {
        value.forEach(function(subValue) {
          result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
        });
      } else if (isMap(value)) {
        value.forEach(function(subValue, key) {
          result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
        });
      }

      var keysFunc = isFull
        ? (isFlat ? getAllKeysIn : getAllKeys)
        : (isFlat ? keysIn : keys);

      var props = isArr ? undefined : keysFunc(value);
      arrayEach(props || value, function(subValue, key) {
        if (props) {
          key = subValue;
          subValue = value[key];
        }
        // Recursively populate clone (susceptible to call stack limits).
        assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
      });
      return result;
    }

    /**
     * The base implementation of `_.conforms` which doesn't clone `source`.
     *
     * @private
     * @param {Object} source The object of property predicates to conform to.
     * @returns {Function} Returns the new spec function.
     */
    function baseConforms(source) {
      var props = keys(source);
      return function(object) {
        return baseConformsTo(object, source, props);
      };
    }

    /**
     * The base implementation of `_.conformsTo` which accepts `props` to check.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property predicates to conform to.
     * @returns {boolean} Returns `true` if `object` conforms, else `false`.
     */
    function baseConformsTo(object, source, props) {
      var length = props.length;
      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (length--) {
        var key = props[length],
            predicate = source[key],
            value = object[key];

        if ((value === undefined && !(key in object)) || !predicate(value)) {
          return false;
        }
      }
      return true;
    }

    /**
     * The base implementation of `_.delay` and `_.defer` which accepts `args`
     * to provide to `func`.
     *
     * @private
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {Array} args The arguments to provide to `func`.
     * @returns {number|Object} Returns the timer id or timeout object.
     */
    function baseDelay(func, wait, args) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * The base implementation of methods like `_.difference` without support
     * for excluding multiple arrays or iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Array} values The values to exclude.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     */
    function baseDifference(array, values, iteratee, comparator) {
      var index = -1,
          includes = arrayIncludes,
          isCommon = true,
          length = array.length,
          result = [],
          valuesLength = values.length;

      if (!length) {
        return result;
      }
      if (iteratee) {
        values = arrayMap(values, baseUnary(iteratee));
      }
      if (comparator) {
        includes = arrayIncludesWith;
        isCommon = false;
      }
      else if (values.length >= LARGE_ARRAY_SIZE) {
        includes = cacheHas;
        isCommon = false;
        values = new SetCache(values);
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee == null ? value : iteratee(value);

        value = (comparator || value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
          var valuesIndex = valuesLength;
          while (valuesIndex--) {
            if (values[valuesIndex] === computed) {
              continue outer;
            }
          }
          result.push(value);
        }
        else if (!includes(values, computed, comparator)) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.forEach` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     */
    var baseEach = createBaseEach(baseForOwn);

    /**
     * The base implementation of `_.forEachRight` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     */
    var baseEachRight = createBaseEach(baseForOwnRight, true);

    /**
     * The base implementation of `_.every` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`
     */
    function baseEvery(collection, predicate) {
      var result = true;
      baseEach(collection, function(value, index, collection) {
        result = !!predicate(value, index, collection);
        return result;
      });
      return result;
    }

    /**
     * The base implementation of methods like `_.max` and `_.min` which accepts a
     * `comparator` to determine the extremum value.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The iteratee invoked per iteration.
     * @param {Function} comparator The comparator used to compare values.
     * @returns {*} Returns the extremum value.
     */
    function baseExtremum(array, iteratee, comparator) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        var value = array[index],
            current = iteratee(value);

        if (current != null && (computed === undefined
              ? (current === current && !isSymbol(current))
              : comparator(current, computed)
            )) {
          var computed = current,
              result = value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.fill` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     */
    function baseFill(array, value, start, end) {
      var length = array.length;

      start = toInteger(start);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : toInteger(end);
      if (end < 0) {
        end += length;
      }
      end = start > end ? 0 : toLength(end);
      while (start < end) {
        array[start++] = value;
      }
      return array;
    }

    /**
     * The base implementation of `_.filter` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function baseFilter(collection, predicate) {
      var result = [];
      baseEach(collection, function(value, index, collection) {
        if (predicate(value, index, collection)) {
          result.push(value);
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.flatten` with support for restricting flattening.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {number} depth The maximum recursion depth.
     * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
     * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
     * @param {Array} [result=[]] The initial result value.
     * @returns {Array} Returns the new flattened array.
     */
    function baseFlatten(array, depth, predicate, isStrict, result) {
      var index = -1,
          length = array.length;

      predicate || (predicate = isFlattenable);
      result || (result = []);

      while (++index < length) {
        var value = array[index];
        if (depth > 0 && predicate(value)) {
          if (depth > 1) {
            // Recursively flatten arrays (susceptible to call stack limits).
            baseFlatten(value, depth - 1, predicate, isStrict, result);
          } else {
            arrayPush(result, value);
          }
        } else if (!isStrict) {
          result[result.length] = value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `baseForOwn` which iterates over `object`
     * properties returned by `keysFunc` and invokes `iteratee` for each property.
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * This function is like `baseFor` except that it iterates over properties
     * in the opposite order.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseForRight = createBaseFor(true);

    /**
     * The base implementation of `_.forOwn` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return object && baseFor(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.forOwnRight` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwnRight(object, iteratee) {
      return object && baseForRight(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.functions` which creates an array of
     * `object` function property names filtered from `props`.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} props The property names to filter.
     * @returns {Array} Returns the function names.
     */
    function baseFunctions(object, props) {
      return arrayFilter(props, function(key) {
        return isFunction(object[key]);
      });
    }

    /**
     * The base implementation of `_.get` without support for default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path) {
      path = castPath(path, object);

      var index = 0,
          length = path.length;

      while (object != null && index < length) {
        object = object[toKey(path[index++])];
      }
      return (index && index == length) ? object : undefined;
    }

    /**
     * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
     * `keysFunc` and `symbolsFunc` to get the enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @param {Function} symbolsFunc The function to get the symbols of `object`.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return (symToStringTag && symToStringTag in Object(value))
        ? getRawTag(value)
        : objectToString(value);
    }

    /**
     * The base implementation of `_.gt` which doesn't coerce arguments.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than `other`,
     *  else `false`.
     */
    function baseGt(value, other) {
      return value > other;
    }

    /**
     * The base implementation of `_.has` without support for deep paths.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHas(object, key) {
      return object != null && hasOwnProperty.call(object, key);
    }

    /**
     * The base implementation of `_.hasIn` without support for deep paths.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHasIn(object, key) {
      return object != null && key in Object(object);
    }

    /**
     * The base implementation of `_.inRange` which doesn't coerce arguments.
     *
     * @private
     * @param {number} number The number to check.
     * @param {number} start The start of the range.
     * @param {number} end The end of the range.
     * @returns {boolean} Returns `true` if `number` is in the range, else `false`.
     */
    function baseInRange(number, start, end) {
      return number >= nativeMin(start, end) && number < nativeMax(start, end);
    }

    /**
     * The base implementation of methods like `_.intersection`, without support
     * for iteratee shorthands, that accepts an array of arrays to inspect.
     *
     * @private
     * @param {Array} arrays The arrays to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of shared values.
     */
    function baseIntersection(arrays, iteratee, comparator) {
      var includes = comparator ? arrayIncludesWith : arrayIncludes,
          length = arrays[0].length,
          othLength = arrays.length,
          othIndex = othLength,
          caches = Array(othLength),
          maxLength = Infinity,
          result = [];

      while (othIndex--) {
        var array = arrays[othIndex];
        if (othIndex && iteratee) {
          array = arrayMap(array, baseUnary(iteratee));
        }
        maxLength = nativeMin(array.length, maxLength);
        caches[othIndex] = !comparator && (iteratee || (length >= 120 && array.length >= 120))
          ? new SetCache(othIndex && array)
          : undefined;
      }
      array = arrays[0];

      var index = -1,
          seen = caches[0];

      outer:
      while (++index < length && result.length < maxLength) {
        var value = array[index],
            computed = iteratee ? iteratee(value) : value;

        value = (comparator || value !== 0) ? value : 0;
        if (!(seen
              ? cacheHas(seen, computed)
              : includes(result, computed, comparator)
            )) {
          othIndex = othLength;
          while (--othIndex) {
            var cache = caches[othIndex];
            if (!(cache
                  ? cacheHas(cache, computed)
                  : includes(arrays[othIndex], computed, comparator))
                ) {
              continue outer;
            }
          }
          if (seen) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.invert` and `_.invertBy` which inverts
     * `object` with values transformed by `iteratee` and set by `setter`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} setter The function to set `accumulator` values.
     * @param {Function} iteratee The iteratee to transform values.
     * @param {Object} accumulator The initial inverted object.
     * @returns {Function} Returns `accumulator`.
     */
    function baseInverter(object, setter, iteratee, accumulator) {
      baseForOwn(object, function(value, key, object) {
        setter(accumulator, iteratee(value), key, object);
      });
      return accumulator;
    }

    /**
     * The base implementation of `_.invoke` without support for individual
     * method arguments.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the method to invoke.
     * @param {Array} args The arguments to invoke the method with.
     * @returns {*} Returns the result of the invoked method.
     */
    function baseInvoke(object, path, args) {
      path = castPath(path, object);
      object = parent(object, path);
      var func = object == null ? object : object[toKey(last(path))];
      return func == null ? undefined : apply(func, object, args);
    }

    /**
     * The base implementation of `_.isArguments`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     */
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }

    /**
     * The base implementation of `_.isArrayBuffer` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array buffer, else `false`.
     */
    function baseIsArrayBuffer(value) {
      return isObjectLike(value) && baseGetTag(value) == arrayBufferTag;
    }

    /**
     * The base implementation of `_.isDate` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
     */
    function baseIsDate(value) {
      return isObjectLike(value) && baseGetTag(value) == dateTag;
    }

    /**
     * The base implementation of `_.isEqual` which supports partial comparisons
     * and tracks traversed objects.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Unordered comparison
     *  2 - Partial comparison
     * @param {Function} [customizer] The function to customize comparisons.
     * @param {Object} [stack] Tracks traversed `value` and `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} [stack] Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray(object),
          othIsArr = isArray(other),
          objTag = objIsArr ? arrayTag : getTag(object),
          othTag = othIsArr ? arrayTag : getTag(other);

      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;

      var objIsObj = objTag == objectTag,
          othIsObj = othTag == objectTag,
          isSameTag = objTag == othTag;

      if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack);
        return (objIsArr || isTypedArray(object))
          ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
          : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object,
              othUnwrapped = othIsWrapped ? other.value() : other;

          stack || (stack = new Stack);
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack);
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }

    /**
     * The base implementation of `_.isMap` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a map, else `false`.
     */
    function baseIsMap(value) {
      return isObjectLike(value) && getTag(value) == mapTag;
    }

    /**
     * The base implementation of `_.isMatch` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @param {Array} matchData The property names, values, and compare flags to match.
     * @param {Function} [customizer] The function to customize comparisons.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     */
    function baseIsMatch(object, source, matchData, customizer) {
      var index = matchData.length,
          length = index,
          noCustomizer = !customizer;

      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (index--) {
        var data = matchData[index];
        if ((noCustomizer && data[2])
              ? data[1] !== object[data[0]]
              : !(data[0] in object)
            ) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
          if (objValue === undefined && !(key in object)) {
            return false;
          }
        } else {
          var stack = new Stack;
          if (customizer) {
            var result = customizer(objValue, srcValue, key, object, source, stack);
          }
          if (!(result === undefined
                ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack)
                : result
              )) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * The base implementation of `_.isRegExp` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
     */
    function baseIsRegExp(value) {
      return isObjectLike(value) && baseGetTag(value) == regexpTag;
    }

    /**
     * The base implementation of `_.isSet` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a set, else `false`.
     */
    function baseIsSet(value) {
      return isObjectLike(value) && getTag(value) == setTag;
    }

    /**
     * The base implementation of `_.isTypedArray` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     */
    function baseIsTypedArray(value) {
      return isObjectLike(value) &&
        isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }

    /**
     * The base implementation of `_.iteratee`.
     *
     * @private
     * @param {*} [value=_.identity] The value to convert to an iteratee.
     * @returns {Function} Returns the iteratee.
     */
    function baseIteratee(value) {
      // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
      // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
      if (typeof value == 'function') {
        return value;
      }
      if (value == null) {
        return identity;
      }
      if (typeof value == 'object') {
        return isArray(value)
          ? baseMatchesProperty(value[0], value[1])
          : baseMatches(value);
      }
      return property(value);
    }

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != 'constructor') {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeysIn(object) {
      if (!isObject(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object),
          result = [];

      for (var key in object) {
        if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.lt` which doesn't coerce arguments.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than `other`,
     *  else `false`.
     */
    function baseLt(value, other) {
      return value < other;
    }

    /**
     * The base implementation of `_.map` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function baseMap(collection, iteratee) {
      var index = -1,
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value, key, collection) {
        result[++index] = iteratee(value, key, collection);
      });
      return result;
    }

    /**
     * The base implementation of `_.matches` which doesn't clone `source`.
     *
     * @private
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new spec function.
     */
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
      }
      return function(object) {
        return object === source || baseIsMatch(object, source, matchData);
      };
    }

    /**
     * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
     *
     * @private
     * @param {string} path The path of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new spec function.
     */
    function baseMatchesProperty(path, srcValue) {
      if (isKey(path) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path), srcValue);
      }
      return function(object) {
        var objValue = get(object, path);
        return (objValue === undefined && objValue === srcValue)
          ? hasIn(object, path)
          : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
      };
    }

    /**
     * The base implementation of `_.merge` without support for multiple sources.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {number} srcIndex The index of `source`.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     */
    function baseMerge(object, source, srcIndex, customizer, stack) {
      if (object === source) {
        return;
      }
      baseFor(source, function(srcValue, key) {
        stack || (stack = new Stack);
        if (isObject(srcValue)) {
          baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
        }
        else {
          var newValue = customizer
            ? customizer(safeGet(object, key), srcValue, (key + ''), object, source, stack)
            : undefined;

          if (newValue === undefined) {
            newValue = srcValue;
          }
          assignMergeValue(object, key, newValue);
        }
      }, keysIn);
    }

    /**
     * A specialized version of `baseMerge` for arrays and objects which performs
     * deep merges and tracks traversed objects enabling objects with circular
     * references to be merged.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {string} key The key of the value to merge.
     * @param {number} srcIndex The index of `source`.
     * @param {Function} mergeFunc The function to merge values.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     */
    function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
      var objValue = safeGet(object, key),
          srcValue = safeGet(source, key),
          stacked = stack.get(srcValue);

      if (stacked) {
        assignMergeValue(object, key, stacked);
        return;
      }
      var newValue = customizer
        ? customizer(objValue, srcValue, (key + ''), object, source, stack)
        : undefined;

      var isCommon = newValue === undefined;

      if (isCommon) {
        var isArr = isArray(srcValue),
            isBuff = !isArr && isBuffer(srcValue),
            isTyped = !isArr && !isBuff && isTypedArray(srcValue);

        newValue = srcValue;
        if (isArr || isBuff || isTyped) {
          if (isArray(objValue)) {
            newValue = objValue;
          }
          else if (isArrayLikeObject(objValue)) {
            newValue = copyArray(objValue);
          }
          else if (isBuff) {
            isCommon = false;
            newValue = cloneBuffer(srcValue, true);
          }
          else if (isTyped) {
            isCommon = false;
            newValue = cloneTypedArray(srcValue, true);
          }
          else {
            newValue = [];
          }
        }
        else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          newValue = objValue;
          if (isArguments(objValue)) {
            newValue = toPlainObject(objValue);
          }
          else if (!isObject(objValue) || isFunction(objValue)) {
            newValue = initCloneObject(srcValue);
          }
        }
        else {
          isCommon = false;
        }
      }
      if (isCommon) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        stack.set(srcValue, newValue);
        mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
        stack['delete'](srcValue);
      }
      assignMergeValue(object, key, newValue);
    }

    /**
     * The base implementation of `_.nth` which doesn't coerce arguments.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {number} n The index of the element to return.
     * @returns {*} Returns the nth element of `array`.
     */
    function baseNth(array, n) {
      var length = array.length;
      if (!length) {
        return;
      }
      n += n < 0 ? length : 0;
      return isIndex(n, length) ? array[n] : undefined;
    }

    /**
     * The base implementation of `_.orderBy` without param guards.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {string[]} orders The sort orders of `iteratees`.
     * @returns {Array} Returns the new sorted array.
     */
    function baseOrderBy(collection, iteratees, orders) {
      if (iteratees.length) {
        iteratees = arrayMap(iteratees, function(iteratee) {
          if (isArray(iteratee)) {
            return function(value) {
              return baseGet(value, iteratee.length === 1 ? iteratee[0] : iteratee);
            }
          }
          return iteratee;
        });
      } else {
        iteratees = [identity];
      }

      var index = -1;
      iteratees = arrayMap(iteratees, baseUnary(getIteratee()));

      var result = baseMap(collection, function(value, key, collection) {
        var criteria = arrayMap(iteratees, function(iteratee) {
          return iteratee(value);
        });
        return { 'criteria': criteria, 'index': ++index, 'value': value };
      });

      return baseSortBy(result, function(object, other) {
        return compareMultiple(object, other, orders);
      });
    }

    /**
     * The base implementation of `_.pick` without support for individual
     * property identifiers.
     *
     * @private
     * @param {Object} object The source object.
     * @param {string[]} paths The property paths to pick.
     * @returns {Object} Returns the new object.
     */
    function basePick(object, paths) {
      return basePickBy(object, paths, function(value, path) {
        return hasIn(object, path);
      });
    }

    /**
     * The base implementation of  `_.pickBy` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The source object.
     * @param {string[]} paths The property paths to pick.
     * @param {Function} predicate The function invoked per property.
     * @returns {Object} Returns the new object.
     */
    function basePickBy(object, paths, predicate) {
      var index = -1,
          length = paths.length,
          result = {};

      while (++index < length) {
        var path = paths[index],
            value = baseGet(object, path);

        if (predicate(value, path)) {
          baseSet(result, castPath(path, object), value);
        }
      }
      return result;
    }

    /**
     * A specialized version of `baseProperty` which supports deep paths.
     *
     * @private
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new accessor function.
     */
    function basePropertyDeep(path) {
      return function(object) {
        return baseGet(object, path);
      };
    }

    /**
     * The base implementation of `_.pullAllBy` without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to remove.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns `array`.
     */
    function basePullAll(array, values, iteratee, comparator) {
      var indexOf = comparator ? baseIndexOfWith : baseIndexOf,
          index = -1,
          length = values.length,
          seen = array;

      if (array === values) {
        values = copyArray(values);
      }
      if (iteratee) {
        seen = arrayMap(array, baseUnary(iteratee));
      }
      while (++index < length) {
        var fromIndex = 0,
            value = values[index],
            computed = iteratee ? iteratee(value) : value;

        while ((fromIndex = indexOf(seen, computed, fromIndex, comparator)) > -1) {
          if (seen !== array) {
            splice.call(seen, fromIndex, 1);
          }
          splice.call(array, fromIndex, 1);
        }
      }
      return array;
    }

    /**
     * The base implementation of `_.pullAt` without support for individual
     * indexes or capturing the removed elements.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {number[]} indexes The indexes of elements to remove.
     * @returns {Array} Returns `array`.
     */
    function basePullAt(array, indexes) {
      var length = array ? indexes.length : 0,
          lastIndex = length - 1;

      while (length--) {
        var index = indexes[length];
        if (length == lastIndex || index !== previous) {
          var previous = index;
          if (isIndex(index)) {
            splice.call(array, index, 1);
          } else {
            baseUnset(array, index);
          }
        }
      }
      return array;
    }

    /**
     * The base implementation of `_.random` without support for returning
     * floating-point numbers.
     *
     * @private
     * @param {number} lower The lower bound.
     * @param {number} upper The upper bound.
     * @returns {number} Returns the random number.
     */
    function baseRandom(lower, upper) {
      return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
    }

    /**
     * The base implementation of `_.range` and `_.rangeRight` which doesn't
     * coerce arguments.
     *
     * @private
     * @param {number} start The start of the range.
     * @param {number} end The end of the range.
     * @param {number} step The value to increment or decrement by.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the range of numbers.
     */
    function baseRange(start, end, step, fromRight) {
      var index = -1,
          length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (length--) {
        result[fromRight ? length : ++index] = start;
        start += step;
      }
      return result;
    }

    /**
     * The base implementation of `_.repeat` which doesn't coerce arguments.
     *
     * @private
     * @param {string} string The string to repeat.
     * @param {number} n The number of times to repeat the string.
     * @returns {string} Returns the repeated string.
     */
    function baseRepeat(string, n) {
      var result = '';
      if (!string || n < 1 || n > MAX_SAFE_INTEGER) {
        return result;
      }
      // Leverage the exponentiation by squaring algorithm for a faster repeat.
      // See https://en.wikipedia.org/wiki/Exponentiation_by_squaring for more details.
      do {
        if (n % 2) {
          result += string;
        }
        n = nativeFloor(n / 2);
        if (n) {
          string += string;
        }
      } while (n);

      return result;
    }

    /**
     * The base implementation of `_.rest` which doesn't validate or coerce arguments.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     */
    function baseRest(func, start) {
      return setToString(overRest(func, start, identity), func + '');
    }

    /**
     * The base implementation of `_.sample`.
     *
     * @private
     * @param {Array|Object} collection The collection to sample.
     * @returns {*} Returns the random element.
     */
    function baseSample(collection) {
      return arraySample(values(collection));
    }

    /**
     * The base implementation of `_.sampleSize` without param guards.
     *
     * @private
     * @param {Array|Object} collection The collection to sample.
     * @param {number} n The number of elements to sample.
     * @returns {Array} Returns the random elements.
     */
    function baseSampleSize(collection, n) {
      var array = values(collection);
      return shuffleSelf(array, baseClamp(n, 0, array.length));
    }

    /**
     * The base implementation of `_.set`.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @param {Function} [customizer] The function to customize path creation.
     * @returns {Object} Returns `object`.
     */
    function baseSet(object, path, value, customizer) {
      if (!isObject(object)) {
        return object;
      }
      path = castPath(path, object);

      var index = -1,
          length = path.length,
          lastIndex = length - 1,
          nested = object;

      while (nested != null && ++index < length) {
        var key = toKey(path[index]),
            newValue = value;

        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return object;
        }

        if (index != lastIndex) {
          var objValue = nested[key];
          newValue = customizer ? customizer(objValue, key, nested) : undefined;
          if (newValue === undefined) {
            newValue = isObject(objValue)
              ? objValue
              : (isIndex(path[index + 1]) ? [] : {});
          }
        }
        assignValue(nested, key, newValue);
        nested = nested[key];
      }
      return object;
    }

    /**
     * The base implementation of `setData` without support for hot loop shorting.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var baseSetData = !metaMap ? identity : function(func, data) {
      metaMap.set(func, data);
      return func;
    };

    /**
     * The base implementation of `setToString` without support for hot loop shorting.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var baseSetToString = !defineProperty ? identity : function(func, string) {
      return defineProperty(func, 'toString', {
        'configurable': true,
        'enumerable': false,
        'value': constant(string),
        'writable': true
      });
    };

    /**
     * The base implementation of `_.shuffle`.
     *
     * @private
     * @param {Array|Object} collection The collection to shuffle.
     * @returns {Array} Returns the new shuffled array.
     */
    function baseShuffle(collection) {
      return shuffleSelf(values(collection));
    }

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = end > length ? length : end;
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * The base implementation of `_.some` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function baseSome(collection, predicate) {
      var result;

      baseEach(collection, function(value, index, collection) {
        result = predicate(value, index, collection);
        return !result;
      });
      return !!result;
    }

    /**
     * The base implementation of `_.sortedIndex` and `_.sortedLastIndex` which
     * performs a binary search of `array` to determine the index at which `value`
     * should be inserted into `array` in order to maintain its sort order.
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function baseSortedIndex(array, value, retHighest) {
      var low = 0,
          high = array == null ? low : array.length;

      if (typeof value == 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
        while (low < high) {
          var mid = (low + high) >>> 1,
              computed = array[mid];

          if (computed !== null && !isSymbol(computed) &&
              (retHighest ? (computed <= value) : (computed < value))) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return high;
      }
      return baseSortedIndexBy(array, value, identity, retHighest);
    }

    /**
     * The base implementation of `_.sortedIndexBy` and `_.sortedLastIndexBy`
     * which invokes `iteratee` for `value` and each element of `array` to compute
     * their sort ranking. The iteratee is invoked with one argument; (value).
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} iteratee The iteratee invoked per element.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function baseSortedIndexBy(array, value, iteratee, retHighest) {
      var low = 0,
          high = array == null ? 0 : array.length;
      if (high === 0) {
        return 0;
      }

      value = iteratee(value);
      var valIsNaN = value !== value,
          valIsNull = value === null,
          valIsSymbol = isSymbol(value),
          valIsUndefined = value === undefined;

      while (low < high) {
        var mid = nativeFloor((low + high) / 2),
            computed = iteratee(array[mid]),
            othIsDefined = computed !== undefined,
            othIsNull = computed === null,
            othIsReflexive = computed === computed,
            othIsSymbol = isSymbol(computed);

        if (valIsNaN) {
          var setLow = retHighest || othIsReflexive;
        } else if (valIsUndefined) {
          setLow = othIsReflexive && (retHighest || othIsDefined);
        } else if (valIsNull) {
          setLow = othIsReflexive && othIsDefined && (retHighest || !othIsNull);
        } else if (valIsSymbol) {
          setLow = othIsReflexive && othIsDefined && !othIsNull && (retHighest || !othIsSymbol);
        } else if (othIsNull || othIsSymbol) {
          setLow = false;
        } else {
          setLow = retHighest ? (computed <= value) : (computed < value);
        }
        if (setLow) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return nativeMin(high, MAX_ARRAY_INDEX);
    }

    /**
     * The base implementation of `_.sortedUniq` and `_.sortedUniqBy` without
     * support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     */
    function baseSortedUniq(array, iteratee) {
      var index = -1,
          length = array.length,
          resIndex = 0,
          result = [];

      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value) : value;

        if (!index || !eq(computed, seen)) {
          var seen = computed;
          result[resIndex++] = value === 0 ? 0 : value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.toNumber` which doesn't ensure correct
     * conversions of binary, hexadecimal, or octal string values.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     */
    function baseToNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      return +value;
    }

    /**
     * The base implementation of `_.toString` which doesn't convert nullish
     * values to empty strings.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {string} Returns the string.
     */
    function baseToString(value) {
      // Exit early for strings to avoid a performance hit in some environments.
      if (typeof value == 'string') {
        return value;
      }
      if (isArray(value)) {
        // Recursively convert values (susceptible to call stack limits).
        return arrayMap(value, baseToString) + '';
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : '';
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
    }

    /**
     * The base implementation of `_.uniqBy` without support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     */
    function baseUniq(array, iteratee, comparator) {
      var index = -1,
          includes = arrayIncludes,
          length = array.length,
          isCommon = true,
          result = [],
          seen = result;

      if (comparator) {
        isCommon = false;
        includes = arrayIncludesWith;
      }
      else if (length >= LARGE_ARRAY_SIZE) {
        var set = iteratee ? null : createSet(array);
        if (set) {
          return setToArray(set);
        }
        isCommon = false;
        includes = cacheHas;
        seen = new SetCache;
      }
      else {
        seen = iteratee ? [] : result;
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value) : value;

        value = (comparator || value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
          var seenIndex = seen.length;
          while (seenIndex--) {
            if (seen[seenIndex] === computed) {
              continue outer;
            }
          }
          if (iteratee) {
            seen.push(computed);
          }
          result.push(value);
        }
        else if (!includes(seen, computed, comparator)) {
          if (seen !== result) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.unset`.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {Array|string} path The property path to unset.
     * @returns {boolean} Returns `true` if the property is deleted, else `false`.
     */
    function baseUnset(object, path) {
      path = castPath(path, object);
      object = parent(object, path);
      return object == null || delete object[toKey(last(path))];
    }

    /**
     * The base implementation of `_.update`.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to update.
     * @param {Function} updater The function to produce the updated value.
     * @param {Function} [customizer] The function to customize path creation.
     * @returns {Object} Returns `object`.
     */
    function baseUpdate(object, path, updater, customizer) {
      return baseSet(object, path, updater(baseGet(object, path)), customizer);
    }

    /**
     * The base implementation of methods like `_.dropWhile` and `_.takeWhile`
     * without support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {Function} predicate The function invoked per iteration.
     * @param {boolean} [isDrop] Specify dropping elements instead of taking them.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseWhile(array, predicate, isDrop, fromRight) {
      var length = array.length,
          index = fromRight ? length : -1;

      while ((fromRight ? index-- : ++index < length) &&
        predicate(array[index], index, array)) {}

      return isDrop
        ? baseSlice(array, (fromRight ? 0 : index), (fromRight ? index + 1 : length))
        : baseSlice(array, (fromRight ? index + 1 : 0), (fromRight ? length : index));
    }

    /**
     * The base implementation of `wrapperValue` which returns the result of
     * performing a sequence of actions on the unwrapped `value`, where each
     * successive action is supplied the return value of the previous.
     *
     * @private
     * @param {*} value The unwrapped value.
     * @param {Array} actions Actions to perform to resolve the unwrapped value.
     * @returns {*} Returns the resolved value.
     */
    function baseWrapperValue(value, actions) {
      var result = value;
      if (result instanceof LazyWrapper) {
        result = result.value();
      }
      return arrayReduce(actions, function(result, action) {
        return action.func.apply(action.thisArg, arrayPush([result], action.args));
      }, result);
    }

    /**
     * The base implementation of methods like `_.xor`, without support for
     * iteratee shorthands, that accepts an array of arrays to inspect.
     *
     * @private
     * @param {Array} arrays The arrays to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of values.
     */
    function baseXor(arrays, iteratee, comparator) {
      var length = arrays.length;
      if (length < 2) {
        return length ? baseUniq(arrays[0]) : [];
      }
      var index = -1,
          result = Array(length);

      while (++index < length) {
        var array = arrays[index],
            othIndex = -1;

        while (++othIndex < length) {
          if (othIndex != index) {
            result[index] = baseDifference(result[index] || array, arrays[othIndex], iteratee, comparator);
          }
        }
      }
      return baseUniq(baseFlatten(result, 1), iteratee, comparator);
    }

    /**
     * This base implementation of `_.zipObject` which assigns values using `assignFunc`.
     *
     * @private
     * @param {Array} props The property identifiers.
     * @param {Array} values The property values.
     * @param {Function} assignFunc The function to assign values.
     * @returns {Object} Returns the new object.
     */
    function baseZipObject(props, values, assignFunc) {
      var index = -1,
          length = props.length,
          valsLength = values.length,
          result = {};

      while (++index < length) {
        var value = index < valsLength ? values[index] : undefined;
        assignFunc(result, props[index], value);
      }
      return result;
    }

    /**
     * Casts `value` to an empty array if it's not an array like object.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {Array|Object} Returns the cast array-like object.
     */
    function castArrayLikeObject(value) {
      return isArrayLikeObject(value) ? value : [];
    }

    /**
     * Casts `value` to `identity` if it's not a function.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {Function} Returns cast function.
     */
    function castFunction(value) {
      return typeof value == 'function' ? value : identity;
    }

    /**
     * Casts `value` to a path array if it's not one.
     *
     * @private
     * @param {*} value The value to inspect.
     * @param {Object} [object] The object to query keys on.
     * @returns {Array} Returns the cast property path array.
     */
    function castPath(value, object) {
      if (isArray(value)) {
        return value;
      }
      return isKey(value, object) ? [value] : stringToPath(toString(value));
    }

    /**
     * A `baseRest` alias which can be replaced with `identity` by module
     * replacement plugins.
     *
     * @private
     * @type {Function}
     * @param {Function} func The function to apply a rest parameter to.
     * @returns {Function} Returns the new function.
     */
    var castRest = baseRest;

    /**
     * Casts `array` to a slice if it's needed.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {number} start The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the cast slice.
     */
    function castSlice(array, start, end) {
      var length = array.length;
      end = end === undefined ? length : end;
      return (!start && end >= length) ? array : baseSlice(array, start, end);
    }

    /**
     * A simple wrapper around the global [`clearTimeout`](https://mdn.io/clearTimeout).
     *
     * @private
     * @param {number|Object} id The timer id or timeout object of the timer to clear.
     */
    var clearTimeout = ctxClearTimeout || function(id) {
      return root.clearTimeout(id);
    };

    /**
     * Creates a clone of  `buffer`.
     *
     * @private
     * @param {Buffer} buffer The buffer to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Buffer} Returns the cloned buffer.
     */
    function cloneBuffer(buffer, isDeep) {
      if (isDeep) {
        return buffer.slice();
      }
      var length = buffer.length,
          result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

      buffer.copy(result);
      return result;
    }

    /**
     * Creates a clone of `arrayBuffer`.
     *
     * @private
     * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new Uint8Array(result).set(new Uint8Array(arrayBuffer));
      return result;
    }

    /**
     * Creates a clone of `dataView`.
     *
     * @private
     * @param {Object} dataView The data view to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned data view.
     */
    function cloneDataView(dataView, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
      return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
    }

    /**
     * Creates a clone of `regexp`.
     *
     * @private
     * @param {Object} regexp The regexp to clone.
     * @returns {Object} Returns the cloned regexp.
     */
    function cloneRegExp(regexp) {
      var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
      result.lastIndex = regexp.lastIndex;
      return result;
    }

    /**
     * Creates a clone of the `symbol` object.
     *
     * @private
     * @param {Object} symbol The symbol object to clone.
     * @returns {Object} Returns the cloned symbol object.
     */
    function cloneSymbol(symbol) {
      return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
    }

    /**
     * Creates a clone of `typedArray`.
     *
     * @private
     * @param {Object} typedArray The typed array to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned typed array.
     */
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
      return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
    }

    /**
     * Compares values to sort them in ascending order.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {number} Returns the sort order indicator for `value`.
     */
    function compareAscending(value, other) {
      if (value !== other) {
        var valIsDefined = value !== undefined,
            valIsNull = value === null,
            valIsReflexive = value === value,
            valIsSymbol = isSymbol(value);

        var othIsDefined = other !== undefined,
            othIsNull = other === null,
            othIsReflexive = other === other,
            othIsSymbol = isSymbol(other);

        if ((!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
            (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
            (valIsNull && othIsDefined && othIsReflexive) ||
            (!valIsDefined && othIsReflexive) ||
            !valIsReflexive) {
          return 1;
        }
        if ((!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
            (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
            (othIsNull && valIsDefined && valIsReflexive) ||
            (!othIsDefined && valIsReflexive) ||
            !othIsReflexive) {
          return -1;
        }
      }
      return 0;
    }

    /**
     * Used by `_.orderBy` to compare multiple properties of a value to another
     * and stable sort them.
     *
     * If `orders` is unspecified, all values are sorted in ascending order. Otherwise,
     * specify an order of "desc" for descending or "asc" for ascending sort order
     * of corresponding values.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {boolean[]|string[]} orders The order to sort by for each property.
     * @returns {number} Returns the sort order indicator for `object`.
     */
    function compareMultiple(object, other, orders) {
      var index = -1,
          objCriteria = object.criteria,
          othCriteria = other.criteria,
          length = objCriteria.length,
          ordersLength = orders.length;

      while (++index < length) {
        var result = compareAscending(objCriteria[index], othCriteria[index]);
        if (result) {
          if (index >= ordersLength) {
            return result;
          }
          var order = orders[index];
          return result * (order == 'desc' ? -1 : 1);
        }
      }
      // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
      // that causes it, under certain circumstances, to provide the same value for
      // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
      // for more details.
      //
      // This also ensures a stable sort in V8 and other engines.
      // See https://bugs.chromium.org/p/v8/issues/detail?id=90 for more details.
      return object.index - other.index;
    }

    /**
     * Creates an array that is the composition of partially applied arguments,
     * placeholders, and provided arguments into a single array of arguments.
     *
     * @private
     * @param {Array} args The provided arguments.
     * @param {Array} partials The arguments to prepend to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @params {boolean} [isCurried] Specify composing for a curried function.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgs(args, partials, holders, isCurried) {
      var argsIndex = -1,
          argsLength = args.length,
          holdersLength = holders.length,
          leftIndex = -1,
          leftLength = partials.length,
          rangeLength = nativeMax(argsLength - holdersLength, 0),
          result = Array(leftLength + rangeLength),
          isUncurried = !isCurried;

      while (++leftIndex < leftLength) {
        result[leftIndex] = partials[leftIndex];
      }
      while (++argsIndex < holdersLength) {
        if (isUncurried || argsIndex < argsLength) {
          result[holders[argsIndex]] = args[argsIndex];
        }
      }
      while (rangeLength--) {
        result[leftIndex++] = args[argsIndex++];
      }
      return result;
    }

    /**
     * This function is like `composeArgs` except that the arguments composition
     * is tailored for `_.partialRight`.
     *
     * @private
     * @param {Array} args The provided arguments.
     * @param {Array} partials The arguments to append to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @params {boolean} [isCurried] Specify composing for a curried function.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgsRight(args, partials, holders, isCurried) {
      var argsIndex = -1,
          argsLength = args.length,
          holdersIndex = -1,
          holdersLength = holders.length,
          rightIndex = -1,
          rightLength = partials.length,
          rangeLength = nativeMax(argsLength - holdersLength, 0),
          result = Array(rangeLength + rightLength),
          isUncurried = !isCurried;

      while (++argsIndex < rangeLength) {
        result[argsIndex] = args[argsIndex];
      }
      var offset = argsIndex;
      while (++rightIndex < rightLength) {
        result[offset + rightIndex] = partials[rightIndex];
      }
      while (++holdersIndex < holdersLength) {
        if (isUncurried || argsIndex < argsLength) {
          result[offset + holders[holdersIndex]] = args[argsIndex++];
        }
      }
      return result;
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property identifiers to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @param {Function} [customizer] The function to customize copied values.
     * @returns {Object} Returns `object`.
     */
    function copyObject(source, props, object, customizer) {
      var isNew = !object;
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];

        var newValue = customizer
          ? customizer(object[key], source[key], key, object, source)
          : undefined;

        if (newValue === undefined) {
          newValue = source[key];
        }
        if (isNew) {
          baseAssignValue(object, key, newValue);
        } else {
          assignValue(object, key, newValue);
        }
      }
      return object;
    }

    /**
     * Copies own symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbols(source, object) {
      return copyObject(source, getSymbols(source), object);
    }

    /**
     * Copies own and inherited symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbolsIn(source, object) {
      return copyObject(source, getSymbolsIn(source), object);
    }

    /**
     * Creates a function like `_.groupBy`.
     *
     * @private
     * @param {Function} setter The function to set accumulator values.
     * @param {Function} [initializer] The accumulator object initializer.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter, initializer) {
      return function(collection, iteratee) {
        var func = isArray(collection) ? arrayAggregator : baseAggregator,
            accumulator = initializer ? initializer() : {};

        return func(collection, setter, getIteratee(iteratee, 2), accumulator);
      };
    }

    /**
     * Creates a function like `_.assign`.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @returns {Function} Returns the new assigner function.
     */
    function createAssigner(assigner) {
      return baseRest(function(object, sources) {
        var index = -1,
            length = sources.length,
            customizer = length > 1 ? sources[length - 1] : undefined,
            guard = length > 2 ? sources[2] : undefined;

        customizer = (assigner.length > 3 && typeof customizer == 'function')
          ? (length--, customizer)
          : undefined;

        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? undefined : customizer;
          length = 1;
        }
        object = Object(object);
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, index, customizer);
          }
        }
        return object;
      });
    }

    /**
     * Creates a `baseEach` or `baseEachRight` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        if (collection == null) {
          return collection;
        }
        if (!isArrayLike(collection)) {
          return eachFunc(collection, iteratee);
        }
        var length = collection.length,
            index = fromRight ? length : -1,
            iterable = Object(collection);

        while ((fromRight ? index-- : ++index < length)) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }

    /**
     * Creates a base function for methods like `_.forIn` and `_.forOwn`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index = -1,
            iterable = Object(object),
            props = keysFunc(object),
            length = props.length;

        while (length--) {
          var key = props[fromRight ? length : ++index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * Creates a function that wraps `func` to invoke it with the optional `this`
     * binding of `thisArg`.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createBind(func, bitmask, thisArg) {
      var isBind = bitmask & WRAP_BIND_FLAG,
          Ctor = createCtor(func);

      function wrapper() {
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(isBind ? thisArg : this, arguments);
      }
      return wrapper;
    }

    /**
     * Creates a function like `_.lowerFirst`.
     *
     * @private
     * @param {string} methodName The name of the `String` case method to use.
     * @returns {Function} Returns the new case function.
     */
    function createCaseFirst(methodName) {
      return function(string) {
        string = toString(string);

        var strSymbols = hasUnicode(string)
          ? stringToArray(string)
          : undefined;

        var chr = strSymbols
          ? strSymbols[0]
          : string.charAt(0);

        var trailing = strSymbols
          ? castSlice(strSymbols, 1).join('')
          : string.slice(1);

        return chr[methodName]() + trailing;
      };
    }

    /**
     * Creates a function like `_.camelCase`.
     *
     * @private
     * @param {Function} callback The function to combine each word.
     * @returns {Function} Returns the new compounder function.
     */
    function createCompounder(callback) {
      return function(string) {
        return arrayReduce(words(deburr(string).replace(reApos, '')), callback, '');
      };
    }

    /**
     * Creates a function that produces an instance of `Ctor` regardless of
     * whether it was invoked as part of a `new` expression or by `call` or `apply`.
     *
     * @private
     * @param {Function} Ctor The constructor to wrap.
     * @returns {Function} Returns the new wrapped function.
     */
    function createCtor(Ctor) {
      return function() {
        // Use a `switch` statement to work with class constructors. See
        // http://ecma-international.org/ecma-262/7.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
        // for more details.
        var args = arguments;
        switch (args.length) {
          case 0: return new Ctor;
          case 1: return new Ctor(args[0]);
          case 2: return new Ctor(args[0], args[1]);
          case 3: return new Ctor(args[0], args[1], args[2]);
          case 4: return new Ctor(args[0], args[1], args[2], args[3]);
          case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
          case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
          case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        }
        var thisBinding = baseCreate(Ctor.prototype),
            result = Ctor.apply(thisBinding, args);

        // Mimic the constructor's `return` behavior.
        // See https://es5.github.io/#x13.2.2 for more details.
        return isObject(result) ? result : thisBinding;
      };
    }

    /**
     * Creates a function that wraps `func` to enable currying.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {number} arity The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createCurry(func, bitmask, arity) {
      var Ctor = createCtor(func);

      function wrapper() {
        var length = arguments.length,
            args = Array(length),
            index = length,
            placeholder = getHolder(wrapper);

        while (index--) {
          args[index] = arguments[index];
        }
        var holders = (length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder)
          ? []
          : replaceHolders(args, placeholder);

        length -= holders.length;
        if (length < arity) {
          return createRecurry(
            func, bitmask, createHybrid, wrapper.placeholder, undefined,
            args, holders, undefined, undefined, arity - length);
        }
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return apply(fn, this, args);
      }
      return wrapper;
    }

    /**
     * Creates a `_.find` or `_.findLast` function.
     *
     * @private
     * @param {Function} findIndexFunc The function to find the collection index.
     * @returns {Function} Returns the new find function.
     */
    function createFind(findIndexFunc) {
      return function(collection, predicate, fromIndex) {
        var iterable = Object(collection);
        if (!isArrayLike(collection)) {
          var iteratee = getIteratee(predicate, 3);
          collection = keys(collection);
          predicate = function(key) { return iteratee(iterable[key], key, iterable); };
        }
        var index = findIndexFunc(collection, predicate, fromIndex);
        return index > -1 ? iterable[iteratee ? collection[index] : index] : undefined;
      };
    }

    /**
     * Creates a `_.flow` or `_.flowRight` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new flow function.
     */
    function createFlow(fromRight) {
      return flatRest(function(funcs) {
        var length = funcs.length,
            index = length,
            prereq = LodashWrapper.prototype.thru;

        if (fromRight) {
          funcs.reverse();
        }
        while (index--) {
          var func = funcs[index];
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          if (prereq && !wrapper && getFuncName(func) == 'wrapper') {
            var wrapper = new LodashWrapper([], true);
          }
        }
        index = wrapper ? index : length;
        while (++index < length) {
          func = funcs[index];

          var funcName = getFuncName(func),
              data = funcName == 'wrapper' ? getData(func) : undefined;

          if (data && isLaziable(data[0]) &&
                data[1] == (WRAP_ARY_FLAG | WRAP_CURRY_FLAG | WRAP_PARTIAL_FLAG | WRAP_REARG_FLAG) &&
                !data[4].length && data[9] == 1
              ) {
            wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
          } else {
            wrapper = (func.length == 1 && isLaziable(func))
              ? wrapper[funcName]()
              : wrapper.thru(func);
          }
        }
        return function() {
          var args = arguments,
              value = args[0];

          if (wrapper && args.length == 1 && isArray(value)) {
            return wrapper.plant(value).value();
          }
          var index = 0,
              result = length ? funcs[index].apply(this, args) : value;

          while (++index < length) {
            result = funcs[index].call(this, result);
          }
          return result;
        };
      });
    }

    /**
     * Creates a function that wraps `func` to invoke it with optional `this`
     * binding of `thisArg`, partial application, and currying.
     *
     * @private
     * @param {Function|string} func The function or method name to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to prepend to those provided to
     *  the new function.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [partialsRight] The arguments to append to those provided
     *  to the new function.
     * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
      var isAry = bitmask & WRAP_ARY_FLAG,
          isBind = bitmask & WRAP_BIND_FLAG,
          isBindKey = bitmask & WRAP_BIND_KEY_FLAG,
          isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG),
          isFlip = bitmask & WRAP_FLIP_FLAG,
          Ctor = isBindKey ? undefined : createCtor(func);

      function wrapper() {
        var length = arguments.length,
            args = Array(length),
            index = length;

        while (index--) {
          args[index] = arguments[index];
        }
        if (isCurried) {
          var placeholder = getHolder(wrapper),
              holdersCount = countHolders(args, placeholder);
        }
        if (partials) {
          args = composeArgs(args, partials, holders, isCurried);
        }
        if (partialsRight) {
          args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
        }
        length -= holdersCount;
        if (isCurried && length < arity) {
          var newHolders = replaceHolders(args, placeholder);
          return createRecurry(
            func, bitmask, createHybrid, wrapper.placeholder, thisArg,
            args, newHolders, argPos, ary, arity - length
          );
        }
        var thisBinding = isBind ? thisArg : this,
            fn = isBindKey ? thisBinding[func] : func;

        length = args.length;
        if (argPos) {
          args = reorder(args, argPos);
        } else if (isFlip && length > 1) {
          args.reverse();
        }
        if (isAry && ary < length) {
          args.length = ary;
        }
        if (this && this !== root && this instanceof wrapper) {
          fn = Ctor || createCtor(fn);
        }
        return fn.apply(thisBinding, args);
      }
      return wrapper;
    }

    /**
     * Creates a function like `_.invertBy`.
     *
     * @private
     * @param {Function} setter The function to set accumulator values.
     * @param {Function} toIteratee The function to resolve iteratees.
     * @returns {Function} Returns the new inverter function.
     */
    function createInverter(setter, toIteratee) {
      return function(object, iteratee) {
        return baseInverter(object, setter, toIteratee(iteratee), {});
      };
    }

    /**
     * Creates a function that performs a mathematical operation on two values.
     *
     * @private
     * @param {Function} operator The function to perform the operation.
     * @param {number} [defaultValue] The value used for `undefined` arguments.
     * @returns {Function} Returns the new mathematical operation function.
     */
    function createMathOperation(operator, defaultValue) {
      return function(value, other) {
        var result;
        if (value === undefined && other === undefined) {
          return defaultValue;
        }
        if (value !== undefined) {
          result = value;
        }
        if (other !== undefined) {
          if (result === undefined) {
            return other;
          }
          if (typeof value == 'string' || typeof other == 'string') {
            value = baseToString(value);
            other = baseToString(other);
          } else {
            value = baseToNumber(value);
            other = baseToNumber(other);
          }
          result = operator(value, other);
        }
        return result;
      };
    }

    /**
     * Creates a function like `_.over`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over iteratees.
     * @returns {Function} Returns the new over function.
     */
    function createOver(arrayFunc) {
      return flatRest(function(iteratees) {
        iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
        return baseRest(function(args) {
          var thisArg = this;
          return arrayFunc(iteratees, function(iteratee) {
            return apply(iteratee, thisArg, args);
          });
        });
      });
    }

    /**
     * Creates the padding for `string` based on `length`. The `chars` string
     * is truncated if the number of characters exceeds `length`.
     *
     * @private
     * @param {number} length The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padding for `string`.
     */
    function createPadding(length, chars) {
      chars = chars === undefined ? ' ' : baseToString(chars);

      var charsLength = chars.length;
      if (charsLength < 2) {
        return charsLength ? baseRepeat(chars, length) : chars;
      }
      var result = baseRepeat(chars, nativeCeil(length / stringSize(chars)));
      return hasUnicode(chars)
        ? castSlice(stringToArray(result), 0, length).join('')
        : result.slice(0, length);
    }

    /**
     * Creates a function that wraps `func` to invoke it with the `this` binding
     * of `thisArg` and `partials` prepended to the arguments it receives.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} partials The arguments to prepend to those provided to
     *  the new function.
     * @returns {Function} Returns the new wrapped function.
     */
    function createPartial(func, bitmask, thisArg, partials) {
      var isBind = bitmask & WRAP_BIND_FLAG,
          Ctor = createCtor(func);

      function wrapper() {
        var argsIndex = -1,
            argsLength = arguments.length,
            leftIndex = -1,
            leftLength = partials.length,
            args = Array(leftLength + argsLength),
            fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;

        while (++leftIndex < leftLength) {
          args[leftIndex] = partials[leftIndex];
        }
        while (argsLength--) {
          args[leftIndex++] = arguments[++argsIndex];
        }
        return apply(fn, isBind ? thisArg : this, args);
      }
      return wrapper;
    }

    /**
     * Creates a `_.range` or `_.rangeRight` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new range function.
     */
    function createRange(fromRight) {
      return function(start, end, step) {
        if (step && typeof step != 'number' && isIterateeCall(start, end, step)) {
          end = step = undefined;
        }
        // Ensure the sign of `-0` is preserved.
        start = toFinite(start);
        if (end === undefined) {
          end = start;
          start = 0;
        } else {
          end = toFinite(end);
        }
        step = step === undefined ? (start < end ? 1 : -1) : toFinite(step);
        return baseRange(start, end, step, fromRight);
      };
    }

    /**
     * Creates a function that performs a relational operation on two values.
     *
     * @private
     * @param {Function} operator The function to perform the operation.
     * @returns {Function} Returns the new relational operation function.
     */
    function createRelationalOperation(operator) {
      return function(value, other) {
        if (!(typeof value == 'string' && typeof other == 'string')) {
          value = toNumber(value);
          other = toNumber(other);
        }
        return operator(value, other);
      };
    }

    /**
     * Creates a function that wraps `func` to continue currying.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {Function} wrapFunc The function to create the `func` wrapper.
     * @param {*} placeholder The placeholder value.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to prepend to those provided to
     *  the new function.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary, arity) {
      var isCurry = bitmask & WRAP_CURRY_FLAG,
          newHolders = isCurry ? holders : undefined,
          newHoldersRight = isCurry ? undefined : holders,
          newPartials = isCurry ? partials : undefined,
          newPartialsRight = isCurry ? undefined : partials;

      bitmask |= (isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG);
      bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);

      if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
        bitmask &= ~(WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG);
      }
      var newData = [
        func, bitmask, thisArg, newPartials, newHolders, newPartialsRight,
        newHoldersRight, argPos, ary, arity
      ];

      var result = wrapFunc.apply(undefined, newData);
      if (isLaziable(func)) {
        setData(result, newData);
      }
      result.placeholder = placeholder;
      return setWrapToString(result, func, bitmask);
    }

    /**
     * Creates a function like `_.round`.
     *
     * @private
     * @param {string} methodName The name of the `Math` method to use when rounding.
     * @returns {Function} Returns the new round function.
     */
    function createRound(methodName) {
      var func = Math[methodName];
      return function(number, precision) {
        number = toNumber(number);
        precision = precision == null ? 0 : nativeMin(toInteger(precision), 292);
        if (precision && nativeIsFinite(number)) {
          // Shift with exponential notation to avoid floating-point issues.
          // See [MDN](https://mdn.io/round#Examples) for more details.
          var pair = (toString(number) + 'e').split('e'),
              value = func(pair[0] + 'e' + (+pair[1] + precision));

          pair = (toString(value) + 'e').split('e');
          return +(pair[0] + 'e' + (+pair[1] - precision));
        }
        return func(number);
      };
    }

    /**
     * Creates a set object of `values`.
     *
     * @private
     * @param {Array} values The values to add to the set.
     * @returns {Object} Returns the new set.
     */
    var createSet = !(Set && (1 / setToArray(new Set([,-0]))[1]) == INFINITY) ? noop : function(values) {
      return new Set(values);
    };

    /**
     * Creates a `_.toPairs` or `_.toPairsIn` function.
     *
     * @private
     * @param {Function} keysFunc The function to get the keys of a given object.
     * @returns {Function} Returns the new pairs function.
     */
    function createToPairs(keysFunc) {
      return function(object) {
        var tag = getTag(object);
        if (tag == mapTag) {
          return mapToArray(object);
        }
        if (tag == setTag) {
          return setToPairs(object);
        }
        return baseToPairs(object, keysFunc(object));
      };
    }

    /**
     * Creates a function that either curries or invokes `func` with optional
     * `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to wrap.
     * @param {number} bitmask The bitmask flags.
     *    1 - `_.bind`
     *    2 - `_.bindKey`
     *    4 - `_.curry` or `_.curryRight` of a bound function
     *    8 - `_.curry`
     *   16 - `_.curryRight`
     *   32 - `_.partial`
     *   64 - `_.partialRight`
     *  128 - `_.rearg`
     *  256 - `_.ary`
     *  512 - `_.flip`
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to be partially applied.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
      var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
      if (!isBindKey && typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var length = partials ? partials.length : 0;
      if (!length) {
        bitmask &= ~(WRAP_PARTIAL_FLAG | WRAP_PARTIAL_RIGHT_FLAG);
        partials = holders = undefined;
      }
      ary = ary === undefined ? ary : nativeMax(toInteger(ary), 0);
      arity = arity === undefined ? arity : toInteger(arity);
      length -= holders ? holders.length : 0;

      if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
        var partialsRight = partials,
            holdersRight = holders;

        partials = holders = undefined;
      }
      var data = isBindKey ? undefined : getData(func);

      var newData = [
        func, bitmask, thisArg, partials, holders, partialsRight, holdersRight,
        argPos, ary, arity
      ];

      if (data) {
        mergeData(newData, data);
      }
      func = newData[0];
      bitmask = newData[1];
      thisArg = newData[2];
      partials = newData[3];
      holders = newData[4];
      arity = newData[9] = newData[9] === undefined
        ? (isBindKey ? 0 : func.length)
        : nativeMax(newData[9] - length, 0);

      if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
        bitmask &= ~(WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG);
      }
      if (!bitmask || bitmask == WRAP_BIND_FLAG) {
        var result = createBind(func, bitmask, thisArg);
      } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
        result = createCurry(func, bitmask, arity);
      } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
        result = createPartial(func, bitmask, thisArg, partials);
      } else {
        result = createHybrid.apply(undefined, newData);
      }
      var setter = data ? baseSetData : setData;
      return setWrapToString(setter(result, newData), func, bitmask);
    }

    /**
     * Used by `_.defaults` to customize its `_.assignIn` use to assign properties
     * of source objects to the destination object for all destination properties
     * that resolve to `undefined`.
     *
     * @private
     * @param {*} objValue The destination value.
     * @param {*} srcValue The source value.
     * @param {string} key The key of the property to assign.
     * @param {Object} object The parent object of `objValue`.
     * @returns {*} Returns the value to assign.
     */
    function customDefaultsAssignIn(objValue, srcValue, key, object) {
      if (objValue === undefined ||
          (eq(objValue, objectProto[key]) && !hasOwnProperty.call(object, key))) {
        return srcValue;
      }
      return objValue;
    }

    /**
     * Used by `_.defaultsDeep` to customize its `_.merge` use to merge source
     * objects into destination objects that are passed thru.
     *
     * @private
     * @param {*} objValue The destination value.
     * @param {*} srcValue The source value.
     * @param {string} key The key of the property to merge.
     * @param {Object} object The parent object of `objValue`.
     * @param {Object} source The parent object of `srcValue`.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     * @returns {*} Returns the value to assign.
     */
    function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
      if (isObject(objValue) && isObject(srcValue)) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        stack.set(srcValue, objValue);
        baseMerge(objValue, srcValue, undefined, customDefaultsMerge, stack);
        stack['delete'](srcValue);
      }
      return objValue;
    }

    /**
     * Used by `_.omit` to customize its `_.cloneDeep` use to only clone plain
     * objects.
     *
     * @private
     * @param {*} value The value to inspect.
     * @param {string} key The key of the property to inspect.
     * @returns {*} Returns the uncloned value or `undefined` to defer cloning to `_.cloneDeep`.
     */
    function customOmitClone(value) {
      return isPlainObject(value) ? undefined : value;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `array` and `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      // Check that cyclic values are equal.
      var arrStacked = stack.get(array);
      var othStacked = stack.get(other);
      if (arrStacked && othStacked) {
        return arrStacked == other && othStacked == array;
      }
      var index = -1,
          result = true,
          seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

      stack.set(array, other);
      stack.set(other, array);

      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, arrValue, index, other, array, stack)
            : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== undefined) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (seen) {
          if (!arraySome(other, function(othValue, othIndex) {
                if (!cacheHas(seen, othIndex) &&
                    (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                  return seen.push(othIndex);
                }
              })) {
            result = false;
            break;
          }
        } else if (!(
              arrValue === othValue ||
                equalFunc(arrValue, othValue, bitmask, customizer, stack)
            )) {
          result = false;
          break;
        }
      }
      stack['delete'](array);
      stack['delete'](other);
      return result;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if ((object.byteLength != other.byteLength) ||
              (object.byteOffset != other.byteOffset)) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;

        case arrayBufferTag:
          if ((object.byteLength != other.byteLength) ||
              !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
            return false;
          }
          return true;

        case boolTag:
        case dateTag:
        case numberTag:
          // Coerce booleans to `1` or `0` and dates to milliseconds.
          // Invalid dates are coerced to `NaN`.
          return eq(+object, +other);

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case regexpTag:
        case stringTag:
          // Coerce regexes to strings and treat strings, primitives and objects,
          // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
          // for more details.
          return object == (other + '');

        case mapTag:
          var convert = mapToArray;

        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
          convert || (convert = setToArray);

          if (object.size != other.size && !isPartial) {
            return false;
          }
          // Assume cyclic values are equal.
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;

          // Recursively compare objects (susceptible to call stack limits).
          stack.set(object, other);
          var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
          stack['delete'](object);
          return result;

        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
          objProps = getAllKeys(object),
          objLength = objProps.length,
          othProps = getAllKeys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      // Check that cyclic values are equal.
      var objStacked = stack.get(object);
      var othStacked = stack.get(other);
      if (objStacked && othStacked) {
        return objStacked == other && othStacked == object;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);

      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, objValue, key, other, object, stack)
            : customizer(objValue, othValue, key, object, other, stack);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (!(compared === undefined
              ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
              : compared
            )) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack['delete'](object);
      stack['delete'](other);
      return result;
    }

    /**
     * A specialized version of `baseRest` which flattens the rest array.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @returns {Function} Returns the new function.
     */
    function flatRest(func) {
      return setToString(overRest(func, undefined, flatten), func + '');
    }

    /**
     * Creates an array of own enumerable property names and symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }

    /**
     * Creates an array of own and inherited enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeysIn(object) {
      return baseGetAllKeys(object, keysIn, getSymbolsIn);
    }

    /**
     * Gets metadata for `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {*} Returns the metadata for `func`.
     */
    var getData = !metaMap ? noop : function(func) {
      return metaMap.get(func);
    };

    /**
     * Gets the name of `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {string} Returns the function name.
     */
    function getFuncName(func) {
      var result = (func.name + ''),
          array = realNames[result],
          length = hasOwnProperty.call(realNames, result) ? array.length : 0;

      while (length--) {
        var data = array[length],
            otherFunc = data.func;
        if (otherFunc == null || otherFunc == func) {
          return data.name;
        }
      }
      return result;
    }

    /**
     * Gets the argument placeholder value for `func`.
     *
     * @private
     * @param {Function} func The function to inspect.
     * @returns {*} Returns the placeholder value.
     */
    function getHolder(func) {
      var object = hasOwnProperty.call(lodash, 'placeholder') ? lodash : func;
      return object.placeholder;
    }

    /**
     * Gets the appropriate "iteratee" function. If `_.iteratee` is customized,
     * this function returns the custom method, otherwise it returns `baseIteratee`.
     * If arguments are provided, the chosen function is invoked with them and
     * its result is returned.
     *
     * @private
     * @param {*} [value] The value to convert to an iteratee.
     * @param {number} [arity] The arity of the created iteratee.
     * @returns {Function} Returns the chosen function or its result.
     */
    function getIteratee() {
      var result = lodash.iteratee || iteratee;
      result = result === iteratee ? baseIteratee : result;
      return arguments.length ? result(arguments[0], arguments[1]) : result;
    }

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
    }

    /**
     * Gets the property names, values, and compare flags of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the match data of `object`.
     */
    function getMatchData(object) {
      var result = keys(object),
          length = result.length;

      while (length--) {
        var key = result[length],
            value = object[key];

        result[length] = [key, value, isStrictComparable(value)];
      }
      return result;
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag),
          tag = value[symToStringTag];

      try {
        value[symToStringTag] = undefined;
        var unmasked = true;
      } catch (e) {}

      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }

    /**
     * Creates an array of the own enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return arrayFilter(nativeGetSymbols(object), function(symbol) {
        return propertyIsEnumerable.call(object, symbol);
      });
    };

    /**
     * Creates an array of the own and inherited enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
      var result = [];
      while (object) {
        arrayPush(result, getSymbols(object));
        object = getPrototype(object);
      }
      return result;
    };

    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    var getTag = baseGetTag;

    // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
    if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
        (Map && getTag(new Map) != mapTag) ||
        (Promise && getTag(Promise.resolve()) != promiseTag) ||
        (Set && getTag(new Set) != setTag) ||
        (WeakMap && getTag(new WeakMap) != weakMapTag)) {
      getTag = function(value) {
        var result = baseGetTag(value),
            Ctor = result == objectTag ? value.constructor : undefined,
            ctorString = Ctor ? toSource(Ctor) : '';

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString: return dataViewTag;
            case mapCtorString: return mapTag;
            case promiseCtorString: return promiseTag;
            case setCtorString: return setTag;
            case weakMapCtorString: return weakMapTag;
          }
        }
        return result;
      };
    }

    /**
     * Gets the view, applying any `transforms` to the `start` and `end` positions.
     *
     * @private
     * @param {number} start The start of the view.
     * @param {number} end The end of the view.
     * @param {Array} transforms The transformations to apply to the view.
     * @returns {Object} Returns an object containing the `start` and `end`
     *  positions of the view.
     */
    function getView(start, end, transforms) {
      var index = -1,
          length = transforms.length;

      while (++index < length) {
        var data = transforms[index],
            size = data.size;

        switch (data.type) {
          case 'drop':      start += size; break;
          case 'dropRight': end -= size; break;
          case 'take':      end = nativeMin(end, start + size); break;
          case 'takeRight': start = nativeMax(start, end - size); break;
        }
      }
      return { 'start': start, 'end': end };
    }

    /**
     * Extracts wrapper details from the `source` body comment.
     *
     * @private
     * @param {string} source The source to inspect.
     * @returns {Array} Returns the wrapper details.
     */
    function getWrapDetails(source) {
      var match = source.match(reWrapDetails);
      return match ? match[1].split(reSplitDetails) : [];
    }

    /**
     * Checks if `path` exists on `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @param {Function} hasFunc The function to check properties.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     */
    function hasPath(object, path, hasFunc) {
      path = castPath(path, object);

      var index = -1,
          length = path.length,
          result = false;

      while (++index < length) {
        var key = toKey(path[index]);
        if (!(result = object != null && hasFunc(object, key))) {
          break;
        }
        object = object[key];
      }
      if (result || ++index != length) {
        return result;
      }
      length = object == null ? 0 : object.length;
      return !!length && isLength(length) && isIndex(key, length) &&
        (isArray(object) || isArguments(object));
    }

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
          result = new array.constructor(length);

      // Add properties assigned by `RegExp#exec`.
      if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      return (typeof object.constructor == 'function' && !isPrototype(object))
        ? baseCreate(getPrototype(object))
        : {};
    }

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag:
          return cloneArrayBuffer(object);

        case boolTag:
        case dateTag:
          return new Ctor(+object);

        case dataViewTag:
          return cloneDataView(object, isDeep);

        case float32Tag: case float64Tag:
        case int8Tag: case int16Tag: case int32Tag:
        case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
          return cloneTypedArray(object, isDeep);

        case mapTag:
          return new Ctor;

        case numberTag:
        case stringTag:
          return new Ctor(object);

        case regexpTag:
          return cloneRegExp(object);

        case setTag:
          return new Ctor;

        case symbolTag:
          return cloneSymbol(object);
      }
    }

    /**
     * Inserts wrapper `details` in a comment at the top of the `source` body.
     *
     * @private
     * @param {string} source The source to modify.
     * @returns {Array} details The details to insert.
     * @returns {string} Returns the modified source.
     */
    function insertWrapDetails(source, details) {
      var length = details.length;
      if (!length) {
        return source;
      }
      var lastIndex = length - 1;
      details[lastIndex] = (length > 1 ? '& ' : '') + details[lastIndex];
      details = details.join(length > 2 ? ', ' : ' ');
      return source.replace(reWrapComment, '{\n/* [wrapped with ' + details + '] */\n');
    }

    /**
     * Checks if `value` is a flattenable `arguments` object or array.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
     */
    function isFlattenable(value) {
      return isArray(value) || isArguments(value) ||
        !!(spreadableSymbol && value && value[spreadableSymbol]);
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER : length;

      return !!length &&
        (type == 'number' ||
          (type != 'symbol' && reIsUint.test(value))) &&
            (value > -1 && value % 1 == 0 && value < length);
    }

    /**
     * Checks if the given arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
     *  else `false`.
     */
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
            ? (isArrayLike(object) && isIndex(index, object.length))
            : (type == 'string' && index in object)
          ) {
        return eq(object[index], value);
      }
      return false;
    }

    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      if (isArray(value)) {
        return false;
      }
      var type = typeof value;
      if (type == 'number' || type == 'symbol' || type == 'boolean' ||
          value == null || isSymbol(value)) {
        return true;
      }
      return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
        (object != null && value in Object(object));
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
    }

    /**
     * Checks if `func` has a lazy counterpart.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` has a lazy counterpart,
     *  else `false`.
     */
    function isLaziable(func) {
      var funcName = getFuncName(func),
          other = lodash[funcName];

      if (typeof other != 'function' || !(funcName in LazyWrapper.prototype)) {
        return false;
      }
      if (func === other) {
        return true;
      }
      var data = getData(other);
      return !!data && func === data[0];
    }

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /**
     * Checks if `func` is capable of being masked.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `func` is maskable, else `false`.
     */
    var isMaskable = coreJsData ? isFunction : stubFalse;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

      return value === proto;
    }

    /**
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` if suitable for strict
     *  equality comparisons, else `false`.
     */
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }

    /**
     * A specialized version of `matchesProperty` for source values suitable
     * for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new spec function.
     */
    function matchesStrictComparable(key, srcValue) {
      return function(object) {
        if (object == null) {
          return false;
        }
        return object[key] === srcValue &&
          (srcValue !== undefined || (key in Object(object)));
      };
    }

    /**
     * A specialized version of `_.memoize` which clears the memoized function's
     * cache when it exceeds `MAX_MEMOIZE_SIZE`.
     *
     * @private
     * @param {Function} func The function to have its output memoized.
     * @returns {Function} Returns the new memoized function.
     */
    function memoizeCapped(func) {
      var result = memoize(func, function(key) {
        if (cache.size === MAX_MEMOIZE_SIZE) {
          cache.clear();
        }
        return key;
      });

      var cache = result.cache;
      return result;
    }

    /**
     * Merges the function metadata of `source` into `data`.
     *
     * Merging metadata reduces the number of wrappers used to invoke a function.
     * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
     * may be applied regardless of execution order. Methods like `_.ary` and
     * `_.rearg` modify function arguments, making the order in which they are
     * executed important, preventing the merging of metadata. However, we make
     * an exception for a safe combined case where curried functions have `_.ary`
     * and or `_.rearg` applied.
     *
     * @private
     * @param {Array} data The destination metadata.
     * @param {Array} source The source metadata.
     * @returns {Array} Returns `data`.
     */
    function mergeData(data, source) {
      var bitmask = data[1],
          srcBitmask = source[1],
          newBitmask = bitmask | srcBitmask,
          isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);

      var isCombo =
        ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_CURRY_FLAG)) ||
        ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_REARG_FLAG) && (data[7].length <= source[8])) ||
        ((srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG)) && (source[7].length <= source[8]) && (bitmask == WRAP_CURRY_FLAG));

      // Exit early if metadata can't be merged.
      if (!(isCommon || isCombo)) {
        return data;
      }
      // Use source `thisArg` if available.
      if (srcBitmask & WRAP_BIND_FLAG) {
        data[2] = source[2];
        // Set when currying a bound function.
        newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
      }
      // Compose partial arguments.
      var value = source[3];
      if (value) {
        var partials = data[3];
        data[3] = partials ? composeArgs(partials, value, source[4]) : value;
        data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source[4];
      }
      // Compose partial right arguments.
      value = source[5];
      if (value) {
        partials = data[5];
        data[5] = partials ? composeArgsRight(partials, value, source[6]) : value;
        data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source[6];
      }
      // Use source `argPos` if available.
      value = source[7];
      if (value) {
        data[7] = value;
      }
      // Use source `ary` if it's smaller.
      if (srcBitmask & WRAP_ARY_FLAG) {
        data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
      }
      // Use source `arity` if one is not provided.
      if (data[9] == null) {
        data[9] = source[9];
      }
      // Use source `func` and merge bitmasks.
      data[0] = source[0];
      data[1] = newBitmask;

      return data;
    }

    /**
     * This function is like
     * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * except that it includes inherited enumerable properties.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }

    /**
     * A specialized version of `baseRest` which transforms the rest array.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @param {Function} transform The rest array transform.
     * @returns {Function} Returns the new function.
     */
    function overRest(func, start, transform) {
      start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
          array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = transform(array);
        return apply(func, this, otherArgs);
      };
    }

    /**
     * Gets the parent value at `path` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} path The path to get the parent value of.
     * @returns {*} Returns the parent value.
     */
    function parent(object, path) {
      return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
    }

    /**
     * Reorder `array` according to the specified indexes where the element at
     * the first index is assigned as the first element, the element at
     * the second index is assigned as the second element, and so on.
     *
     * @private
     * @param {Array} array The array to reorder.
     * @param {Array} indexes The arranged array indexes.
     * @returns {Array} Returns `array`.
     */
    function reorder(array, indexes) {
      var arrLength = array.length,
          length = nativeMin(indexes.length, arrLength),
          oldArray = copyArray(array);

      while (length--) {
        var index = indexes[length];
        array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
      }
      return array;
    }

    /**
     * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function safeGet(object, key) {
      if (key === 'constructor' && typeof object[key] === 'function') {
        return;
      }

      if (key == '__proto__') {
        return;
      }

      return object[key];
    }

    /**
     * Sets metadata for `func`.
     *
     * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
     * period of time, it will trip its breaker and transition to an identity
     * function to avoid garbage collection pauses in V8. See
     * [V8 issue 2070](https://bugs.chromium.org/p/v8/issues/detail?id=2070)
     * for more details.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var setData = shortOut(baseSetData);

    /**
     * A simple wrapper around the global [`setTimeout`](https://mdn.io/setTimeout).
     *
     * @private
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @returns {number|Object} Returns the timer id or timeout object.
     */
    var setTimeout = ctxSetTimeout || function(func, wait) {
      return root.setTimeout(func, wait);
    };

    /**
     * Sets the `toString` method of `func` to return `string`.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var setToString = shortOut(baseSetToString);

    /**
     * Sets the `toString` method of `wrapper` to mimic the source of `reference`
     * with wrapper details in a comment at the top of the source body.
     *
     * @private
     * @param {Function} wrapper The function to modify.
     * @param {Function} reference The reference function.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @returns {Function} Returns `wrapper`.
     */
    function setWrapToString(wrapper, reference, bitmask) {
      var source = (reference + '');
      return setToString(wrapper, insertWrapDetails(source, updateWrapDetails(getWrapDetails(source), bitmask)));
    }

    /**
     * Creates a function that'll short out and invoke `identity` instead
     * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
     * milliseconds.
     *
     * @private
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new shortable function.
     */
    function shortOut(func) {
      var count = 0,
          lastCalled = 0;

      return function() {
        var stamp = nativeNow(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return arguments[0];
          }
        } else {
          count = 0;
        }
        return func.apply(undefined, arguments);
      };
    }

    /**
     * A specialized version of `_.shuffle` which mutates and sets the size of `array`.
     *
     * @private
     * @param {Array} array The array to shuffle.
     * @param {number} [size=array.length] The size of `array`.
     * @returns {Array} Returns `array`.
     */
    function shuffleSelf(array, size) {
      var index = -1,
          length = array.length,
          lastIndex = length - 1;

      size = size === undefined ? length : size;
      while (++index < size) {
        var rand = baseRandom(index, lastIndex),
            value = array[rand];

        array[rand] = array[index];
        array[index] = value;
      }
      array.length = size;
      return array;
    }

    /**
     * Converts `string` to a property path array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the property path array.
     */
    var stringToPath = memoizeCapped(function(string) {
      var result = [];
      if (string.charCodeAt(0) === 46 /* . */) {
        result.push('');
      }
      string.replace(rePropName, function(match, number, quote, subString) {
        result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    });

    /**
     * Converts `value` to a string key if it's not a string or symbol.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {string|symbol} Returns the key.
     */
    function toKey(value) {
      if (typeof value == 'string' || isSymbol(value)) {
        return value;
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
    }

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to convert.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Updates wrapper `details` based on `bitmask` flags.
     *
     * @private
     * @returns {Array} details The details to modify.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @returns {Array} Returns `details`.
     */
    function updateWrapDetails(details, bitmask) {
      arrayEach(wrapFlags, function(pair) {
        var value = '_.' + pair[0];
        if ((bitmask & pair[1]) && !arrayIncludes(details, value)) {
          details.push(value);
        }
      });
      return details.sort();
    }

    /**
     * Creates a clone of `wrapper`.
     *
     * @private
     * @param {Object} wrapper The wrapper to clone.
     * @returns {Object} Returns the cloned wrapper.
     */
    function wrapperClone(wrapper) {
      if (wrapper instanceof LazyWrapper) {
        return wrapper.clone();
      }
      var result = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
      result.__actions__ = copyArray(wrapper.__actions__);
      result.__index__  = wrapper.__index__;
      result.__values__ = wrapper.__values__;
      return result;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements split into groups the length of `size`.
     * If `array` can't be split evenly, the final chunk will be the remaining
     * elements.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to process.
     * @param {number} [size=1] The length of each chunk
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the new array of chunks.
     * @example
     *
     * _.chunk(['a', 'b', 'c', 'd'], 2);
     * // => [['a', 'b'], ['c', 'd']]
     *
     * _.chunk(['a', 'b', 'c', 'd'], 3);
     * // => [['a', 'b', 'c'], ['d']]
     */
    function chunk(array, size, guard) {
      if ((guard ? isIterateeCall(array, size, guard) : size === undefined)) {
        size = 1;
      } else {
        size = nativeMax(toInteger(size), 0);
      }
      var length = array == null ? 0 : array.length;
      if (!length || size < 1) {
        return [];
      }
      var index = 0,
          resIndex = 0,
          result = Array(nativeCeil(length / size));

      while (index < length) {
        result[resIndex++] = baseSlice(array, index, (index += size));
      }
      return result;
    }

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are falsey.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to compact.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array == null ? 0 : array.length,
          resIndex = 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result[resIndex++] = value;
        }
      }
      return result;
    }

    /**
     * Creates a new array concatenating `array` with any additional arrays
     * and/or values.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to concatenate.
     * @param {...*} [values] The values to concatenate.
     * @returns {Array} Returns the new concatenated array.
     * @example
     *
     * var array = [1];
     * var other = _.concat(array, 2, [3], [[4]]);
     *
     * console.log(other);
     * // => [1, 2, 3, [4]]
     *
     * console.log(array);
     * // => [1]
     */
    function concat() {
      var length = arguments.length;
      if (!length) {
        return [];
      }
      var args = Array(length - 1),
          array = arguments[0],
          index = length;

      while (index--) {
        args[index - 1] = arguments[index];
      }
      return arrayPush(isArray(array) ? copyArray(array) : [array], baseFlatten(args, 1));
    }

    /**
     * Creates an array of `array` values not included in the other given arrays
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons. The order and references of result values are
     * determined by the first array.
     *
     * **Note:** Unlike `_.pullAll`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @see _.without, _.xor
     * @example
     *
     * _.difference([2, 1], [2, 3]);
     * // => [1]
     */
    var difference = baseRest(function(array, values) {
      return isArrayLikeObject(array)
        ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true))
        : [];
    });

    /**
     * This method is like `_.difference` except that it accepts `iteratee` which
     * is invoked for each element of `array` and `values` to generate the criterion
     * by which they're compared. The order and references of result values are
     * determined by the first array. The iteratee is invoked with one argument:
     * (value).
     *
     * **Note:** Unlike `_.pullAllBy`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The values to exclude.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.differenceBy([2.1, 1.2], [2.3, 3.4], Math.floor);
     * // => [1.2]
     *
     * // The `_.property` iteratee shorthand.
     * _.differenceBy([{ 'x': 2 }, { 'x': 1 }], [{ 'x': 1 }], 'x');
     * // => [{ 'x': 2 }]
     */
    var differenceBy = baseRest(function(array, values) {
      var iteratee = last(values);
      if (isArrayLikeObject(iteratee)) {
        iteratee = undefined;
      }
      return isArrayLikeObject(array)
        ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true), getIteratee(iteratee, 2))
        : [];
    });

    /**
     * This method is like `_.difference` except that it accepts `comparator`
     * which is invoked to compare elements of `array` to `values`. The order and
     * references of result values are determined by the first array. The comparator
     * is invoked with two arguments: (arrVal, othVal).
     *
     * **Note:** Unlike `_.pullAllWith`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The values to exclude.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     *
     * _.differenceWith(objects, [{ 'x': 1, 'y': 2 }], _.isEqual);
     * // => [{ 'x': 2, 'y': 1 }]
     */
    var differenceWith = baseRest(function(array, values) {
      var comparator = last(values);
      if (isArrayLikeObject(comparator)) {
        comparator = undefined;
      }
      return isArrayLikeObject(array)
        ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true), undefined, comparator)
        : [];
    });

    /**
     * Creates a slice of `array` with `n` elements dropped from the beginning.
     *
     * @static
     * @memberOf _
     * @since 0.5.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.drop([1, 2, 3]);
     * // => [2, 3]
     *
     * _.drop([1, 2, 3], 2);
     * // => [3]
     *
     * _.drop([1, 2, 3], 5);
     * // => []
     *
     * _.drop([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function drop(array, n, guard) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      n = (guard || n === undefined) ? 1 : toInteger(n);
      return baseSlice(array, n < 0 ? 0 : n, length);
    }

    /**
     * Creates a slice of `array` with `n` elements dropped from the end.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRight([1, 2, 3]);
     * // => [1, 2]
     *
     * _.dropRight([1, 2, 3], 2);
     * // => [1]
     *
     * _.dropRight([1, 2, 3], 5);
     * // => []
     *
     * _.dropRight([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function dropRight(array, n, guard) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      n = (guard || n === undefined) ? 1 : toInteger(n);
      n = length - n;
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the end.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * invoked with three arguments: (value, index, array).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.dropRightWhile(users, function(o) { return !o.active; });
     * // => objects for ['barney']
     *
     * // The `_.matches` iteratee shorthand.
     * _.dropRightWhile(users, { 'user': 'pebbles', 'active': false });
     * // => objects for ['barney', 'fred']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.dropRightWhile(users, ['active', false]);
     * // => objects for ['barney']
     *
     * // The `_.property` iteratee shorthand.
     * _.dropRightWhile(users, 'active');
     * // => objects for ['barney', 'fred', 'pebbles']
     */
    function dropRightWhile(array, predicate) {
      return (array && array.length)
        ? baseWhile(array, getIteratee(predicate, 3), true, true)
        : [];
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the beginning.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * invoked with three arguments: (value, index, array).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.dropWhile(users, function(o) { return !o.active; });
     * // => objects for ['pebbles']
     *
     * // The `_.matches` iteratee shorthand.
     * _.dropWhile(users, { 'user': 'barney', 'active': false });
     * // => objects for ['fred', 'pebbles']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.dropWhile(users, ['active', false]);
     * // => objects for ['pebbles']
     *
     * // The `_.property` iteratee shorthand.
     * _.dropWhile(users, 'active');
     * // => objects for ['barney', 'fred', 'pebbles']
     */
    function dropWhile(array, predicate) {
      return (array && array.length)
        ? baseWhile(array, getIteratee(predicate, 3), true)
        : [];
    }

    /**
     * Fills elements of `array` with `value` from `start` up to, but not
     * including, `end`.
     *
     * **Note:** This method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 3.2.0
     * @category Array
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _.fill(array, 'a');
     * console.log(array);
     * // => ['a', 'a', 'a']
     *
     * _.fill(Array(3), 2);
     * // => [2, 2, 2]
     *
     * _.fill([4, 6, 8, 10], '*', 1, 3);
     * // => [4, '*', '*', 10]
     */
    function fill(array, value, start, end) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      if (start && typeof start != 'number' && isIterateeCall(array, value, start)) {
        start = 0;
        end = length;
      }
      return baseFill(array, value, start, end);
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * @static
     * @memberOf _
     * @since 1.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.findIndex(users, function(o) { return o.user == 'barney'; });
     * // => 0
     *
     * // The `_.matches` iteratee shorthand.
     * _.findIndex(users, { 'user': 'fred', 'active': false });
     * // => 1
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.findIndex(users, ['active', false]);
     * // => 0
     *
     * // The `_.property` iteratee shorthand.
     * _.findIndex(users, 'active');
     * // => 2
     */
    function findIndex(array, predicate, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = fromIndex == null ? 0 : toInteger(fromIndex);
      if (index < 0) {
        index = nativeMax(length + index, 0);
      }
      return baseFindIndex(array, getIteratee(predicate, 3), index);
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.findLastIndex(users, function(o) { return o.user == 'pebbles'; });
     * // => 2
     *
     * // The `_.matches` iteratee shorthand.
     * _.findLastIndex(users, { 'user': 'barney', 'active': true });
     * // => 0
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.findLastIndex(users, ['active', false]);
     * // => 2
     *
     * // The `_.property` iteratee shorthand.
     * _.findLastIndex(users, 'active');
     * // => 0
     */
    function findLastIndex(array, predicate, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = length - 1;
      if (fromIndex !== undefined) {
        index = toInteger(fromIndex);
        index = fromIndex < 0
          ? nativeMax(length + index, 0)
          : nativeMin(index, length - 1);
      }
      return baseFindIndex(array, getIteratee(predicate, 3), index, true);
    }

    /**
     * Flattens `array` a single level deep.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to flatten.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flatten([1, [2, [3, [4]], 5]]);
     * // => [1, 2, [3, [4]], 5]
     */
    function flatten(array) {
      var length = array == null ? 0 : array.length;
      return length ? baseFlatten(array, 1) : [];
    }

    /**
     * Recursively flattens `array`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to flatten.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flattenDeep([1, [2, [3, [4]], 5]]);
     * // => [1, 2, 3, 4, 5]
     */
    function flattenDeep(array) {
      var length = array == null ? 0 : array.length;
      return length ? baseFlatten(array, INFINITY) : [];
    }

    /**
     * Recursively flatten `array` up to `depth` times.
     *
     * @static
     * @memberOf _
     * @since 4.4.0
     * @category Array
     * @param {Array} array The array to flatten.
     * @param {number} [depth=1] The maximum recursion depth.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * var array = [1, [2, [3, [4]], 5]];
     *
     * _.flattenDepth(array, 1);
     * // => [1, 2, [3, [4]], 5]
     *
     * _.flattenDepth(array, 2);
     * // => [1, 2, 3, [4], 5]
     */
    function flattenDepth(array, depth) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      depth = depth === undefined ? 1 : toInteger(depth);
      return baseFlatten(array, depth);
    }

    /**
     * The inverse of `_.toPairs`; this method returns an object composed
     * from key-value `pairs`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} pairs The key-value pairs.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.fromPairs([['a', 1], ['b', 2]]);
     * // => { 'a': 1, 'b': 2 }
     */
    function fromPairs(pairs) {
      var index = -1,
          length = pairs == null ? 0 : pairs.length,
          result = {};

      while (++index < length) {
        var pair = pairs[index];
        result[pair[0]] = pair[1];
      }
      return result;
    }

    /**
     * Gets the first element of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @alias first
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the first element of `array`.
     * @example
     *
     * _.head([1, 2, 3]);
     * // => 1
     *
     * _.head([]);
     * // => undefined
     */
    function head(array) {
      return (array && array.length) ? array[0] : undefined;
    }

    /**
     * Gets the index at which the first occurrence of `value` is found in `array`
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons. If `fromIndex` is negative, it's used as the
     * offset from the end of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.indexOf([1, 2, 1, 2], 2);
     * // => 1
     *
     * // Search from the `fromIndex`.
     * _.indexOf([1, 2, 1, 2], 2, 2);
     * // => 3
     */
    function indexOf(array, value, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = fromIndex == null ? 0 : toInteger(fromIndex);
      if (index < 0) {
        index = nativeMax(length + index, 0);
      }
      return baseIndexOf(array, value, index);
    }

    /**
     * Gets all but the last element of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     */
    function initial(array) {
      var length = array == null ? 0 : array.length;
      return length ? baseSlice(array, 0, -1) : [];
    }

    /**
     * Creates an array of unique values that are included in all given arrays
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons. The order and references of result values are
     * determined by the first array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of intersecting values.
     * @example
     *
     * _.intersection([2, 1], [2, 3]);
     * // => [2]
     */
    var intersection = baseRest(function(arrays) {
      var mapped = arrayMap(arrays, castArrayLikeObject);
      return (mapped.length && mapped[0] === arrays[0])
        ? baseIntersection(mapped)
        : [];
    });

    /**
     * This method is like `_.intersection` except that it accepts `iteratee`
     * which is invoked for each element of each `arrays` to generate the criterion
     * by which they're compared. The order and references of result values are
     * determined by the first array. The iteratee is invoked with one argument:
     * (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new array of intersecting values.
     * @example
     *
     * _.intersectionBy([2.1, 1.2], [2.3, 3.4], Math.floor);
     * // => [2.1]
     *
     * // The `_.property` iteratee shorthand.
     * _.intersectionBy([{ 'x': 1 }], [{ 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }]
     */
    var intersectionBy = baseRest(function(arrays) {
      var iteratee = last(arrays),
          mapped = arrayMap(arrays, castArrayLikeObject);

      if (iteratee === last(mapped)) {
        iteratee = undefined;
      } else {
        mapped.pop();
      }
      return (mapped.length && mapped[0] === arrays[0])
        ? baseIntersection(mapped, getIteratee(iteratee, 2))
        : [];
    });

    /**
     * This method is like `_.intersection` except that it accepts `comparator`
     * which is invoked to compare elements of `arrays`. The order and references
     * of result values are determined by the first array. The comparator is
     * invoked with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of intersecting values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     * var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.intersectionWith(objects, others, _.isEqual);
     * // => [{ 'x': 1, 'y': 2 }]
     */
    var intersectionWith = baseRest(function(arrays) {
      var comparator = last(arrays),
          mapped = arrayMap(arrays, castArrayLikeObject);

      comparator = typeof comparator == 'function' ? comparator : undefined;
      if (comparator) {
        mapped.pop();
      }
      return (mapped.length && mapped[0] === arrays[0])
        ? baseIntersection(mapped, undefined, comparator)
        : [];
    });

    /**
     * Converts all elements in `array` into a string separated by `separator`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to convert.
     * @param {string} [separator=','] The element separator.
     * @returns {string} Returns the joined string.
     * @example
     *
     * _.join(['a', 'b', 'c'], '~');
     * // => 'a~b~c'
     */
    function join(array, separator) {
      return array == null ? '' : nativeJoin.call(array, separator);
    }

    /**
     * Gets the last element of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the last element of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     */
    function last(array) {
      var length = array == null ? 0 : array.length;
      return length ? array[length - 1] : undefined;
    }

    /**
     * This method is like `_.indexOf` except that it iterates over elements of
     * `array` from right to left.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 1, 2], 2);
     * // => 3
     *
     * // Search from the `fromIndex`.
     * _.lastIndexOf([1, 2, 1, 2], 2, 2);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = length;
      if (fromIndex !== undefined) {
        index = toInteger(fromIndex);
        index = index < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
      }
      return value === value
        ? strictLastIndexOf(array, value, index)
        : baseFindIndex(array, baseIsNaN, index, true);
    }

    /**
     * Gets the element at index `n` of `array`. If `n` is negative, the nth
     * element from the end is returned.
     *
     * @static
     * @memberOf _
     * @since 4.11.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=0] The index of the element to return.
     * @returns {*} Returns the nth element of `array`.
     * @example
     *
     * var array = ['a', 'b', 'c', 'd'];
     *
     * _.nth(array, 1);
     * // => 'b'
     *
     * _.nth(array, -2);
     * // => 'c';
     */
    function nth(array, n) {
      return (array && array.length) ? baseNth(array, toInteger(n)) : undefined;
    }

    /**
     * Removes all given values from `array` using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * **Note:** Unlike `_.without`, this method mutates `array`. Use `_.remove`
     * to remove elements from an array by predicate.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...*} [values] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = ['a', 'b', 'c', 'a', 'b', 'c'];
     *
     * _.pull(array, 'a', 'c');
     * console.log(array);
     * // => ['b', 'b']
     */
    var pull = baseRest(pullAll);

    /**
     * This method is like `_.pull` except that it accepts an array of values to remove.
     *
     * **Note:** Unlike `_.difference`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Array} values The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = ['a', 'b', 'c', 'a', 'b', 'c'];
     *
     * _.pullAll(array, ['a', 'c']);
     * console.log(array);
     * // => ['b', 'b']
     */
    function pullAll(array, values) {
      return (array && array.length && values && values.length)
        ? basePullAll(array, values)
        : array;
    }

    /**
     * This method is like `_.pullAll` except that it accepts `iteratee` which is
     * invoked for each element of `array` and `values` to generate the criterion
     * by which they're compared. The iteratee is invoked with one argument: (value).
     *
     * **Note:** Unlike `_.differenceBy`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Array} values The values to remove.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [{ 'x': 1 }, { 'x': 2 }, { 'x': 3 }, { 'x': 1 }];
     *
     * _.pullAllBy(array, [{ 'x': 1 }, { 'x': 3 }], 'x');
     * console.log(array);
     * // => [{ 'x': 2 }]
     */
    function pullAllBy(array, values, iteratee) {
      return (array && array.length && values && values.length)
        ? basePullAll(array, values, getIteratee(iteratee, 2))
        : array;
    }

    /**
     * This method is like `_.pullAll` except that it accepts `comparator` which
     * is invoked to compare elements of `array` to `values`. The comparator is
     * invoked with two arguments: (arrVal, othVal).
     *
     * **Note:** Unlike `_.differenceWith`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 4.6.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Array} values The values to remove.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [{ 'x': 1, 'y': 2 }, { 'x': 3, 'y': 4 }, { 'x': 5, 'y': 6 }];
     *
     * _.pullAllWith(array, [{ 'x': 3, 'y': 4 }], _.isEqual);
     * console.log(array);
     * // => [{ 'x': 1, 'y': 2 }, { 'x': 5, 'y': 6 }]
     */
    function pullAllWith(array, values, comparator) {
      return (array && array.length && values && values.length)
        ? basePullAll(array, values, undefined, comparator)
        : array;
    }

    /**
     * Removes elements from `array` corresponding to `indexes` and returns an
     * array of removed elements.
     *
     * **Note:** Unlike `_.at`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...(number|number[])} [indexes] The indexes of elements to remove.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = ['a', 'b', 'c', 'd'];
     * var pulled = _.pullAt(array, [1, 3]);
     *
     * console.log(array);
     * // => ['a', 'c']
     *
     * console.log(pulled);
     * // => ['b', 'd']
     */
    var pullAt = flatRest(function(array, indexes) {
      var length = array == null ? 0 : array.length,
          result = baseAt(array, indexes);

      basePullAt(array, arrayMap(indexes, function(index) {
        return isIndex(index, length) ? +index : index;
      }).sort(compareAscending));

      return result;
    });

    /**
     * Removes all elements from `array` that `predicate` returns truthy for
     * and returns an array of the removed elements. The predicate is invoked
     * with three arguments: (value, index, array).
     *
     * **Note:** Unlike `_.filter`, this method mutates `array`. Use `_.pull`
     * to pull elements from an array by value.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4];
     * var evens = _.remove(array, function(n) {
     *   return n % 2 == 0;
     * });
     *
     * console.log(array);
     * // => [1, 3]
     *
     * console.log(evens);
     * // => [2, 4]
     */
    function remove(array, predicate) {
      var result = [];
      if (!(array && array.length)) {
        return result;
      }
      var index = -1,
          indexes = [],
          length = array.length;

      predicate = getIteratee(predicate, 3);
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result.push(value);
          indexes.push(index);
        }
      }
      basePullAt(array, indexes);
      return result;
    }

    /**
     * Reverses `array` so that the first element becomes the last, the second
     * element becomes the second to last, and so on.
     *
     * **Note:** This method mutates `array` and is based on
     * [`Array#reverse`](https://mdn.io/Array/reverse).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _.reverse(array);
     * // => [3, 2, 1]
     *
     * console.log(array);
     * // => [3, 2, 1]
     */
    function reverse(array) {
      return array == null ? array : nativeReverse.call(array);
    }

    /**
     * Creates a slice of `array` from `start` up to, but not including, `end`.
     *
     * **Note:** This method is used instead of
     * [`Array#slice`](https://mdn.io/Array/slice) to ensure dense arrays are
     * returned.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function slice(array, start, end) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
        start = 0;
        end = length;
      }
      else {
        start = start == null ? 0 : toInteger(start);
        end = end === undefined ? length : toInteger(end);
      }
      return baseSlice(array, start, end);
    }

    /**
     * Uses a binary search to determine the lowest index at which `value`
     * should be inserted into `array` in order to maintain its sort order.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([30, 50], 40);
     * // => 1
     */
    function sortedIndex(array, value) {
      return baseSortedIndex(array, value);
    }

    /**
     * This method is like `_.sortedIndex` except that it accepts `iteratee`
     * which is invoked for `value` and each element of `array` to compute their
     * sort ranking. The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * var objects = [{ 'x': 4 }, { 'x': 5 }];
     *
     * _.sortedIndexBy(objects, { 'x': 4 }, function(o) { return o.x; });
     * // => 0
     *
     * // The `_.property` iteratee shorthand.
     * _.sortedIndexBy(objects, { 'x': 4 }, 'x');
     * // => 0
     */
    function sortedIndexBy(array, value, iteratee) {
      return baseSortedIndexBy(array, value, getIteratee(iteratee, 2));
    }

    /**
     * This method is like `_.indexOf` except that it performs a binary
     * search on a sorted `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.sortedIndexOf([4, 5, 5, 5, 6], 5);
     * // => 1
     */
    function sortedIndexOf(array, value) {
      var length = array == null ? 0 : array.length;
      if (length) {
        var index = baseSortedIndex(array, value);
        if (index < length && eq(array[index], value)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.sortedIndex` except that it returns the highest
     * index at which `value` should be inserted into `array` in order to
     * maintain its sort order.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedLastIndex([4, 5, 5, 5, 6], 5);
     * // => 4
     */
    function sortedLastIndex(array, value) {
      return baseSortedIndex(array, value, true);
    }

    /**
     * This method is like `_.sortedLastIndex` except that it accepts `iteratee`
     * which is invoked for `value` and each element of `array` to compute their
     * sort ranking. The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * var objects = [{ 'x': 4 }, { 'x': 5 }];
     *
     * _.sortedLastIndexBy(objects, { 'x': 4 }, function(o) { return o.x; });
     * // => 1
     *
     * // The `_.property` iteratee shorthand.
     * _.sortedLastIndexBy(objects, { 'x': 4 }, 'x');
     * // => 1
     */
    function sortedLastIndexBy(array, value, iteratee) {
      return baseSortedIndexBy(array, value, getIteratee(iteratee, 2), true);
    }

    /**
     * This method is like `_.lastIndexOf` except that it performs a binary
     * search on a sorted `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.sortedLastIndexOf([4, 5, 5, 5, 6], 5);
     * // => 3
     */
    function sortedLastIndexOf(array, value) {
      var length = array == null ? 0 : array.length;
      if (length) {
        var index = baseSortedIndex(array, value, true) - 1;
        if (eq(array[index], value)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.uniq` except that it's designed and optimized
     * for sorted arrays.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * _.sortedUniq([1, 1, 2]);
     * // => [1, 2]
     */
    function sortedUniq(array) {
      return (array && array.length)
        ? baseSortedUniq(array)
        : [];
    }

    /**
     * This method is like `_.uniqBy` except that it's designed and optimized
     * for sorted arrays.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * _.sortedUniqBy([1.1, 1.2, 2.3, 2.4], Math.floor);
     * // => [1.1, 2.3]
     */
    function sortedUniqBy(array, iteratee) {
      return (array && array.length)
        ? baseSortedUniq(array, getIteratee(iteratee, 2))
        : [];
    }

    /**
     * Gets all but the first element of `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.tail([1, 2, 3]);
     * // => [2, 3]
     */
    function tail(array) {
      var length = array == null ? 0 : array.length;
      return length ? baseSlice(array, 1, length) : [];
    }

    /**
     * Creates a slice of `array` with `n` elements taken from the beginning.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.take([1, 2, 3]);
     * // => [1]
     *
     * _.take([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.take([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.take([1, 2, 3], 0);
     * // => []
     */
    function take(array, n, guard) {
      if (!(array && array.length)) {
        return [];
      }
      n = (guard || n === undefined) ? 1 : toInteger(n);
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements taken from the end.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRight([1, 2, 3]);
     * // => [3]
     *
     * _.takeRight([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.takeRight([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.takeRight([1, 2, 3], 0);
     * // => []
     */
    function takeRight(array, n, guard) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      n = (guard || n === undefined) ? 1 : toInteger(n);
      n = length - n;
      return baseSlice(array, n < 0 ? 0 : n, length);
    }

    /**
     * Creates a slice of `array` with elements taken from the end. Elements are
     * taken until `predicate` returns falsey. The predicate is invoked with
     * three arguments: (value, index, array).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.takeRightWhile(users, function(o) { return !o.active; });
     * // => objects for ['fred', 'pebbles']
     *
     * // The `_.matches` iteratee shorthand.
     * _.takeRightWhile(users, { 'user': 'pebbles', 'active': false });
     * // => objects for ['pebbles']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.takeRightWhile(users, ['active', false]);
     * // => objects for ['fred', 'pebbles']
     *
     * // The `_.property` iteratee shorthand.
     * _.takeRightWhile(users, 'active');
     * // => []
     */
    function takeRightWhile(array, predicate) {
      return (array && array.length)
        ? baseWhile(array, getIteratee(predicate, 3), false, true)
        : [];
    }

    /**
     * Creates a slice of `array` with elements taken from the beginning. Elements
     * are taken until `predicate` returns falsey. The predicate is invoked with
     * three arguments: (value, index, array).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.takeWhile(users, function(o) { return !o.active; });
     * // => objects for ['barney', 'fred']
     *
     * // The `_.matches` iteratee shorthand.
     * _.takeWhile(users, { 'user': 'barney', 'active': false });
     * // => objects for ['barney']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.takeWhile(users, ['active', false]);
     * // => objects for ['barney', 'fred']
     *
     * // The `_.property` iteratee shorthand.
     * _.takeWhile(users, 'active');
     * // => []
     */
    function takeWhile(array, predicate) {
      return (array && array.length)
        ? baseWhile(array, getIteratee(predicate, 3))
        : [];
    }

    /**
     * Creates an array of unique values, in order, from all given arrays using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * _.union([2], [1, 2]);
     * // => [2, 1]
     */
    var union = baseRest(function(arrays) {
      return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
    });

    /**
     * This method is like `_.union` except that it accepts `iteratee` which is
     * invoked for each element of each `arrays` to generate the criterion by
     * which uniqueness is computed. Result values are chosen from the first
     * array in which the value occurs. The iteratee is invoked with one argument:
     * (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * _.unionBy([2.1], [1.2, 2.3], Math.floor);
     * // => [2.1, 1.2]
     *
     * // The `_.property` iteratee shorthand.
     * _.unionBy([{ 'x': 1 }], [{ 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    var unionBy = baseRest(function(arrays) {
      var iteratee = last(arrays);
      if (isArrayLikeObject(iteratee)) {
        iteratee = undefined;
      }
      return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), getIteratee(iteratee, 2));
    });

    /**
     * This method is like `_.union` except that it accepts `comparator` which
     * is invoked to compare elements of `arrays`. Result values are chosen from
     * the first array in which the value occurs. The comparator is invoked
     * with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     * var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.unionWith(objects, others, _.isEqual);
     * // => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 1 }]
     */
    var unionWith = baseRest(function(arrays) {
      var comparator = last(arrays);
      comparator = typeof comparator == 'function' ? comparator : undefined;
      return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), undefined, comparator);
    });

    /**
     * Creates a duplicate-free version of an array, using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons, in which only the first occurrence of each element
     * is kept. The order of result values is determined by the order they occur
     * in the array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * _.uniq([2, 1, 2]);
     * // => [2, 1]
     */
    function uniq(array) {
      return (array && array.length) ? baseUniq(array) : [];
    }

    /**
     * This method is like `_.uniq` except that it accepts `iteratee` which is
     * invoked for each element in `array` to generate the criterion by which
     * uniqueness is computed. The order of result values is determined by the
     * order they occur in the array. The iteratee is invoked with one argument:
     * (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * _.uniqBy([2.1, 1.2, 2.3], Math.floor);
     * // => [2.1, 1.2]
     *
     * // The `_.property` iteratee shorthand.
     * _.uniqBy([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniqBy(array, iteratee) {
      return (array && array.length) ? baseUniq(array, getIteratee(iteratee, 2)) : [];
    }

    /**
     * This method is like `_.uniq` except that it accepts `comparator` which
     * is invoked to compare elements of `array`. The order of result values is
     * determined by the order they occur in the array.The comparator is invoked
     * with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.uniqWith(objects, _.isEqual);
     * // => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }]
     */
    function uniqWith(array, comparator) {
      comparator = typeof comparator == 'function' ? comparator : undefined;
      return (array && array.length) ? baseUniq(array, undefined, comparator) : [];
    }

    /**
     * This method is like `_.zip` except that it accepts an array of grouped
     * elements and creates an array regrouping the elements to their pre-zip
     * configuration.
     *
     * @static
     * @memberOf _
     * @since 1.2.0
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip(['a', 'b'], [1, 2], [true, false]);
     * // => [['a', 1, true], ['b', 2, false]]
     *
     * _.unzip(zipped);
     * // => [['a', 'b'], [1, 2], [true, false]]
     */
    function unzip(array) {
      if (!(array && array.length)) {
        return [];
      }
      var length = 0;
      array = arrayFilter(array, function(group) {
        if (isArrayLikeObject(group)) {
          length = nativeMax(group.length, length);
          return true;
        }
      });
      return baseTimes(length, function(index) {
        return arrayMap(array, baseProperty(index));
      });
    }

    /**
     * This method is like `_.unzip` except that it accepts `iteratee` to specify
     * how regrouped values should be combined. The iteratee is invoked with the
     * elements of each group: (...group).
     *
     * @static
     * @memberOf _
     * @since 3.8.0
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @param {Function} [iteratee=_.identity] The function to combine
     *  regrouped values.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip([1, 2], [10, 20], [100, 200]);
     * // => [[1, 10, 100], [2, 20, 200]]
     *
     * _.unzipWith(zipped, _.add);
     * // => [3, 30, 300]
     */
    function unzipWith(array, iteratee) {
      if (!(array && array.length)) {
        return [];
      }
      var result = unzip(array);
      if (iteratee == null) {
        return result;
      }
      return arrayMap(result, function(group) {
        return apply(iteratee, undefined, group);
      });
    }

    /**
     * Creates an array excluding all given values using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * **Note:** Unlike `_.pull`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...*} [values] The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @see _.difference, _.xor
     * @example
     *
     * _.without([2, 1, 2, 3], 1, 2);
     * // => [3]
     */
    var without = baseRest(function(array, values) {
      return isArrayLikeObject(array)
        ? baseDifference(array, values)
        : [];
    });

    /**
     * Creates an array of unique values that is the
     * [symmetric difference](https://en.wikipedia.org/wiki/Symmetric_difference)
     * of the given arrays. The order of result values is determined by the order
     * they occur in the arrays.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of filtered values.
     * @see _.difference, _.without
     * @example
     *
     * _.xor([2, 1], [2, 3]);
     * // => [1, 3]
     */
    var xor = baseRest(function(arrays) {
      return baseXor(arrayFilter(arrays, isArrayLikeObject));
    });

    /**
     * This method is like `_.xor` except that it accepts `iteratee` which is
     * invoked for each element of each `arrays` to generate the criterion by
     * which by which they're compared. The order of result values is determined
     * by the order they occur in the arrays. The iteratee is invoked with one
     * argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.xorBy([2.1, 1.2], [2.3, 3.4], Math.floor);
     * // => [1.2, 3.4]
     *
     * // The `_.property` iteratee shorthand.
     * _.xorBy([{ 'x': 1 }], [{ 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 2 }]
     */
    var xorBy = baseRest(function(arrays) {
      var iteratee = last(arrays);
      if (isArrayLikeObject(iteratee)) {
        iteratee = undefined;
      }
      return baseXor(arrayFilter(arrays, isArrayLikeObject), getIteratee(iteratee, 2));
    });

    /**
     * This method is like `_.xor` except that it accepts `comparator` which is
     * invoked to compare elements of `arrays`. The order of result values is
     * determined by the order they occur in the arrays. The comparator is invoked
     * with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     * var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.xorWith(objects, others, _.isEqual);
     * // => [{ 'x': 2, 'y': 1 }, { 'x': 1, 'y': 1 }]
     */
    var xorWith = baseRest(function(arrays) {
      var comparator = last(arrays);
      comparator = typeof comparator == 'function' ? comparator : undefined;
      return baseXor(arrayFilter(arrays, isArrayLikeObject), undefined, comparator);
    });

    /**
     * Creates an array of grouped elements, the first of which contains the
     * first elements of the given arrays, the second of which contains the
     * second elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zip(['a', 'b'], [1, 2], [true, false]);
     * // => [['a', 1, true], ['b', 2, false]]
     */
    var zip = baseRest(unzip);

    /**
     * This method is like `_.fromPairs` except that it accepts two arrays,
     * one of property identifiers and one of corresponding values.
     *
     * @static
     * @memberOf _
     * @since 0.4.0
     * @category Array
     * @param {Array} [props=[]] The property identifiers.
     * @param {Array} [values=[]] The property values.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.zipObject(['a', 'b'], [1, 2]);
     * // => { 'a': 1, 'b': 2 }
     */
    function zipObject(props, values) {
      return baseZipObject(props || [], values || [], assignValue);
    }

    /**
     * This method is like `_.zipObject` except that it supports property paths.
     *
     * @static
     * @memberOf _
     * @since 4.1.0
     * @category Array
     * @param {Array} [props=[]] The property identifiers.
     * @param {Array} [values=[]] The property values.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.zipObjectDeep(['a.b[0].c', 'a.b[1].d'], [1, 2]);
     * // => { 'a': { 'b': [{ 'c': 1 }, { 'd': 2 }] } }
     */
    function zipObjectDeep(props, values) {
      return baseZipObject(props || [], values || [], baseSet);
    }

    /**
     * This method is like `_.zip` except that it accepts `iteratee` to specify
     * how grouped values should be combined. The iteratee is invoked with the
     * elements of each group: (...group).
     *
     * @static
     * @memberOf _
     * @since 3.8.0
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @param {Function} [iteratee=_.identity] The function to combine
     *  grouped values.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zipWith([1, 2], [10, 20], [100, 200], function(a, b, c) {
     *   return a + b + c;
     * });
     * // => [111, 222]
     */
    var zipWith = baseRest(function(arrays) {
      var length = arrays.length,
          iteratee = length > 1 ? arrays[length - 1] : undefined;

      iteratee = typeof iteratee == 'function' ? (arrays.pop(), iteratee) : undefined;
      return unzipWith(arrays, iteratee);
    });

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` wrapper instance that wraps `value` with explicit method
     * chain sequences enabled. The result of such sequences must be unwrapped
     * with `_#value`.
     *
     * @static
     * @memberOf _
     * @since 1.3.0
     * @category Seq
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36 },
     *   { 'user': 'fred',    'age': 40 },
     *   { 'user': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _
     *   .chain(users)
     *   .sortBy('age')
     *   .map(function(o) {
     *     return o.user + ' is ' + o.age;
     *   })
     *   .head()
     *   .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      var result = lodash(value);
      result.__chain__ = true;
      return result;
    }

    /**
     * This method invokes `interceptor` and returns `value`. The interceptor
     * is invoked with one argument; (value). The purpose of this method is to
     * "tap into" a method chain sequence in order to modify intermediate results.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Seq
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3])
     *  .tap(function(array) {
     *    // Mutate input array.
     *    array.pop();
     *  })
     *  .reverse()
     *  .value();
     * // => [2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * This method is like `_.tap` except that it returns the result of `interceptor`.
     * The purpose of this method is to "pass thru" values replacing intermediate
     * results in a method chain sequence.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Seq
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns the result of `interceptor`.
     * @example
     *
     * _('  abc  ')
     *  .chain()
     *  .trim()
     *  .thru(function(value) {
     *    return [value];
     *  })
     *  .value();
     * // => ['abc']
     */
    function thru(value, interceptor) {
      return interceptor(value);
    }

    /**
     * This method is the wrapper version of `_.at`.
     *
     * @name at
     * @memberOf _
     * @since 1.0.0
     * @category Seq
     * @param {...(string|string[])} [paths] The property paths to pick.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }, 4] };
     *
     * _(object).at(['a[0].b.c', 'a[1]']).value();
     * // => [3, 4]
     */
    var wrapperAt = flatRest(function(paths) {
      var length = paths.length,
          start = length ? paths[0] : 0,
          value = this.__wrapped__,
          interceptor = function(object) { return baseAt(object, paths); };

      if (length > 1 || this.__actions__.length ||
          !(value instanceof LazyWrapper) || !isIndex(start)) {
        return this.thru(interceptor);
      }
      value = value.slice(start, +start + (length ? 1 : 0));
      value.__actions__.push({
        'func': thru,
        'args': [interceptor],
        'thisArg': undefined
      });
      return new LodashWrapper(value, this.__chain__).thru(function(array) {
        if (length && !array.length) {
          array.push(undefined);
        }
        return array;
      });
    });

    /**
     * Creates a `lodash` wrapper instance with explicit method chain sequences enabled.
     *
     * @name chain
     * @memberOf _
     * @since 0.1.0
     * @category Seq
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // A sequence without explicit chaining.
     * _(users).head();
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // A sequence with explicit chaining.
     * _(users)
     *   .chain()
     *   .head()
     *   .pick('user')
     *   .value();
     * // => { 'user': 'barney' }
     */
    function wrapperChain() {
      return chain(this);
    }

    /**
     * Executes the chain sequence and returns the wrapped result.
     *
     * @name commit
     * @memberOf _
     * @since 3.2.0
     * @category Seq
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapped = _(array).push(3);
     *
     * console.log(array);
     * // => [1, 2]
     *
     * wrapped = wrapped.commit();
     * console.log(array);
     * // => [1, 2, 3]
     *
     * wrapped.last();
     * // => 3
     *
     * console.log(array);
     * // => [1, 2, 3]
     */
    function wrapperCommit() {
      return new LodashWrapper(this.value(), this.__chain__);
    }

    /**
     * Gets the next value on a wrapped object following the
     * [iterator protocol](https://mdn.io/iteration_protocols#iterator).
     *
     * @name next
     * @memberOf _
     * @since 4.0.0
     * @category Seq
     * @returns {Object} Returns the next iterator value.
     * @example
     *
     * var wrapped = _([1, 2]);
     *
     * wrapped.next();
     * // => { 'done': false, 'value': 1 }
     *
     * wrapped.next();
     * // => { 'done': false, 'value': 2 }
     *
     * wrapped.next();
     * // => { 'done': true, 'value': undefined }
     */
    function wrapperNext() {
      if (this.__values__ === undefined) {
        this.__values__ = toArray(this.value());
      }
      var done = this.__index__ >= this.__values__.length,
          value = done ? undefined : this.__values__[this.__index__++];

      return { 'done': done, 'value': value };
    }

    /**
     * Enables the wrapper to be iterable.
     *
     * @name Symbol.iterator
     * @memberOf _
     * @since 4.0.0
     * @category Seq
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var wrapped = _([1, 2]);
     *
     * wrapped[Symbol.iterator]() === wrapped;
     * // => true
     *
     * Array.from(wrapped);
     * // => [1, 2]
     */
    function wrapperToIterator() {
      return this;
    }

    /**
     * Creates a clone of the chain sequence planting `value` as the wrapped value.
     *
     * @name plant
     * @memberOf _
     * @since 3.2.0
     * @category Seq
     * @param {*} value The value to plant.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var wrapped = _([1, 2]).map(square);
     * var other = wrapped.plant([3, 4]);
     *
     * other.value();
     * // => [9, 16]
     *
     * wrapped.value();
     * // => [1, 4]
     */
    function wrapperPlant(value) {
      var result,
          parent = this;

      while (parent instanceof baseLodash) {
        var clone = wrapperClone(parent);
        clone.__index__ = 0;
        clone.__values__ = undefined;
        if (result) {
          previous.__wrapped__ = clone;
        } else {
          result = clone;
        }
        var previous = clone;
        parent = parent.__wrapped__;
      }
      previous.__wrapped__ = value;
      return result;
    }

    /**
     * This method is the wrapper version of `_.reverse`.
     *
     * **Note:** This method mutates the wrapped array.
     *
     * @name reverse
     * @memberOf _
     * @since 0.1.0
     * @category Seq
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _(array).reverse().value()
     * // => [3, 2, 1]
     *
     * console.log(array);
     * // => [3, 2, 1]
     */
    function wrapperReverse() {
      var value = this.__wrapped__;
      if (value instanceof LazyWrapper) {
        var wrapped = value;
        if (this.__actions__.length) {
          wrapped = new LazyWrapper(this);
        }
        wrapped = wrapped.reverse();
        wrapped.__actions__.push({
          'func': thru,
          'args': [reverse],
          'thisArg': undefined
        });
        return new LodashWrapper(wrapped, this.__chain__);
      }
      return this.thru(reverse);
    }

    /**
     * Executes the chain sequence to resolve the unwrapped value.
     *
     * @name value
     * @memberOf _
     * @since 0.1.0
     * @alias toJSON, valueOf
     * @category Seq
     * @returns {*} Returns the resolved unwrapped value.
     * @example
     *
     * _([1, 2, 3]).value();
     * // => [1, 2, 3]
     */
    function wrapperValue() {
      return baseWrapperValue(this.__wrapped__, this.__actions__);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` thru `iteratee`. The corresponding value of
     * each key is the number of times the key was returned by `iteratee`. The
     * iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 0.5.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([6.1, 4.2, 6.3], Math.floor);
     * // => { '4': 1, '6': 2 }
     *
     * // The `_.property` iteratee shorthand.
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      if (hasOwnProperty.call(result, key)) {
        ++result[key];
      } else {
        baseAssignValue(result, key, 1);
      }
    });

    /**
     * Checks if `predicate` returns truthy for **all** elements of `collection`.
     * Iteration is stopped once `predicate` returns falsey. The predicate is
     * invoked with three arguments: (value, index|key, collection).
     *
     * **Note:** This method returns `true` for
     * [empty collections](https://en.wikipedia.org/wiki/Empty_set) because
     * [everything is true](https://en.wikipedia.org/wiki/Vacuous_truth) of
     * elements of empty collections.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes'], Boolean);
     * // => false
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * // The `_.matches` iteratee shorthand.
     * _.every(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.every(users, ['active', false]);
     * // => true
     *
     * // The `_.property` iteratee shorthand.
     * _.every(users, 'active');
     * // => false
     */
    function every(collection, predicate, guard) {
      var func = isArray(collection) ? arrayEvery : baseEvery;
      if (guard && isIterateeCall(collection, predicate, guard)) {
        predicate = undefined;
      }
      return func(collection, getIteratee(predicate, 3));
    }

    /**
     * Iterates over elements of `collection`, returning an array of all elements
     * `predicate` returns truthy for. The predicate is invoked with three
     * arguments: (value, index|key, collection).
     *
     * **Note:** Unlike `_.remove`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     * @see _.reject
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.filter(users, function(o) { return !o.active; });
     * // => objects for ['fred']
     *
     * // The `_.matches` iteratee shorthand.
     * _.filter(users, { 'age': 36, 'active': true });
     * // => objects for ['barney']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.filter(users, ['active', false]);
     * // => objects for ['fred']
     *
     * // The `_.property` iteratee shorthand.
     * _.filter(users, 'active');
     * // => objects for ['barney']
     *
     * // Combining several predicates using `_.overEvery` or `_.overSome`.
     * _.filter(users, _.overSome([{ 'age': 36 }, ['age', 40]]));
     * // => objects for ['fred', 'barney']
     */
    function filter(collection, predicate) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      return func(collection, getIteratee(predicate, 3));
    }

    /**
     * Iterates over elements of `collection`, returning the first element
     * `predicate` returns truthy for. The predicate is invoked with three
     * arguments: (value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': true },
     *   { 'user': 'fred',    'age': 40, 'active': false },
     *   { 'user': 'pebbles', 'age': 1,  'active': true }
     * ];
     *
     * _.find(users, function(o) { return o.age < 40; });
     * // => object for 'barney'
     *
     * // The `_.matches` iteratee shorthand.
     * _.find(users, { 'age': 1, 'active': true });
     * // => object for 'pebbles'
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.find(users, ['active', false]);
     * // => object for 'fred'
     *
     * // The `_.property` iteratee shorthand.
     * _.find(users, 'active');
     * // => object for 'barney'
     */
    var find = createFind(findIndex);

    /**
     * This method is like `_.find` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param {number} [fromIndex=collection.length-1] The index to search from.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(n) {
     *   return n % 2 == 1;
     * });
     * // => 3
     */
    var findLast = createFind(findLastIndex);

    /**
     * Creates a flattened array of values by running each element in `collection`
     * thru `iteratee` and flattening the mapped results. The iteratee is invoked
     * with three arguments: (value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * function duplicate(n) {
     *   return [n, n];
     * }
     *
     * _.flatMap([1, 2], duplicate);
     * // => [1, 1, 2, 2]
     */
    function flatMap(collection, iteratee) {
      return baseFlatten(map(collection, iteratee), 1);
    }

    /**
     * This method is like `_.flatMap` except that it recursively flattens the
     * mapped results.
     *
     * @static
     * @memberOf _
     * @since 4.7.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * function duplicate(n) {
     *   return [[[n, n]]];
     * }
     *
     * _.flatMapDeep([1, 2], duplicate);
     * // => [1, 1, 2, 2]
     */
    function flatMapDeep(collection, iteratee) {
      return baseFlatten(map(collection, iteratee), INFINITY);
    }

    /**
     * This method is like `_.flatMap` except that it recursively flattens the
     * mapped results up to `depth` times.
     *
     * @static
     * @memberOf _
     * @since 4.7.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {number} [depth=1] The maximum recursion depth.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * function duplicate(n) {
     *   return [[[n, n]]];
     * }
     *
     * _.flatMapDepth([1, 2], duplicate, 2);
     * // => [[1, 1], [2, 2]]
     */
    function flatMapDepth(collection, iteratee, depth) {
      depth = depth === undefined ? 1 : toInteger(depth);
      return baseFlatten(map(collection, iteratee), depth);
    }

    /**
     * Iterates over elements of `collection` and invokes `iteratee` for each element.
     * The iteratee is invoked with three arguments: (value, index|key, collection).
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * **Note:** As with other "Collections" methods, objects with a "length"
     * property are iterated like arrays. To avoid this behavior use `_.forIn`
     * or `_.forOwn` for object iteration.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @alias each
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     * @see _.forEachRight
     * @example
     *
     * _.forEach([1, 2], function(value) {
     *   console.log(value);
     * });
     * // => Logs `1` then `2`.
     *
     * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
     *   console.log(key);
     * });
     * // => Logs 'a' then 'b' (iteration order is not guaranteed).
     */
    function forEach(collection, iteratee) {
      var func = isArray(collection) ? arrayEach : baseEach;
      return func(collection, getIteratee(iteratee, 3));
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @alias eachRight
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     * @see _.forEach
     * @example
     *
     * _.forEachRight([1, 2], function(value) {
     *   console.log(value);
     * });
     * // => Logs `2` then `1`.
     */
    function forEachRight(collection, iteratee) {
      var func = isArray(collection) ? arrayEachRight : baseEachRight;
      return func(collection, getIteratee(iteratee, 3));
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` thru `iteratee`. The order of grouped values
     * is determined by the order they occur in `collection`. The corresponding
     * value of each key is an array of elements responsible for generating the
     * key. The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([6.1, 4.2, 6.3], Math.floor);
     * // => { '4': [4.2], '6': [6.1, 6.3] }
     *
     * // The `_.property` iteratee shorthand.
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      if (hasOwnProperty.call(result, key)) {
        result[key].push(value);
      } else {
        baseAssignValue(result, key, [value]);
      }
    });

    /**
     * Checks if `value` is in `collection`. If `collection` is a string, it's
     * checked for a substring of `value`, otherwise
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * is used for equality comparisons. If `fromIndex` is negative, it's used as
     * the offset from the end of `collection`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
     * @returns {boolean} Returns `true` if `value` is found, else `false`.
     * @example
     *
     * _.includes([1, 2, 3], 1);
     * // => true
     *
     * _.includes([1, 2, 3], 1, 2);
     * // => false
     *
     * _.includes({ 'a': 1, 'b': 2 }, 1);
     * // => true
     *
     * _.includes('abcd', 'bc');
     * // => true
     */
    function includes(collection, value, fromIndex, guard) {
      collection = isArrayLike(collection) ? collection : values(collection);
      fromIndex = (fromIndex && !guard) ? toInteger(fromIndex) : 0;

      var length = collection.length;
      if (fromIndex < 0) {
        fromIndex = nativeMax(length + fromIndex, 0);
      }
      return isString(collection)
        ? (fromIndex <= length && collection.indexOf(value, fromIndex) > -1)
        : (!!length && baseIndexOf(collection, value, fromIndex) > -1);
    }

    /**
     * Invokes the method at `path` of each element in `collection`, returning
     * an array of the results of each invoked method. Any additional arguments
     * are provided to each invoked method. If `path` is a function, it's invoked
     * for, and `this` bound to, each element in `collection`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Array|Function|string} path The path of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [args] The arguments to invoke each method with.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * _.invokeMap([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invokeMap([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    var invokeMap = baseRest(function(collection, path, args) {
      var index = -1,
          isFunc = typeof path == 'function',
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value) {
        result[++index] = isFunc ? apply(path, value, args) : baseInvoke(value, path, args);
      });
      return result;
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` thru `iteratee`. The corresponding value of
     * each key is the last element responsible for generating the key. The
     * iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var array = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.keyBy(array, function(o) {
     *   return String.fromCharCode(o.code);
     * });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.keyBy(array, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     */
    var keyBy = createAggregator(function(result, value, key) {
      baseAssignValue(result, key, value);
    });

    /**
     * Creates an array of values by running each element in `collection` thru
     * `iteratee`. The iteratee is invoked with three arguments:
     * (value, index|key, collection).
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
     *
     * The guarded methods are:
     * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
     * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
     * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
     * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * _.map([4, 8], square);
     * // => [16, 64]
     *
     * _.map({ 'a': 4, 'b': 8 }, square);
     * // => [16, 64] (iteration order is not guaranteed)
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * // The `_.property` iteratee shorthand.
     * _.map(users, 'user');
     * // => ['barney', 'fred']
     */
    function map(collection, iteratee) {
      var func = isArray(collection) ? arrayMap : baseMap;
      return func(collection, getIteratee(iteratee, 3));
    }

    /**
     * This method is like `_.sortBy` except that it allows specifying the sort
     * orders of the iteratees to sort by. If `orders` is unspecified, all values
     * are sorted in ascending order. Otherwise, specify an order of "desc" for
     * descending or "asc" for ascending sort order of corresponding values.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Array[]|Function[]|Object[]|string[]} [iteratees=[_.identity]]
     *  The iteratees to sort by.
     * @param {string[]} [orders] The sort orders of `iteratees`.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 34 },
     *   { 'user': 'fred',   'age': 40 },
     *   { 'user': 'barney', 'age': 36 }
     * ];
     *
     * // Sort by `user` in ascending order and by `age` in descending order.
     * _.orderBy(users, ['user', 'age'], ['asc', 'desc']);
     * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
     */
    function orderBy(collection, iteratees, orders, guard) {
      if (collection == null) {
        return [];
      }
      if (!isArray(iteratees)) {
        iteratees = iteratees == null ? [] : [iteratees];
      }
      orders = guard ? undefined : orders;
      if (!isArray(orders)) {
        orders = orders == null ? [] : [orders];
      }
      return baseOrderBy(collection, iteratees, orders);
    }

    /**
     * Creates an array of elements split into two groups, the first of which
     * contains elements `predicate` returns truthy for, the second of which
     * contains elements `predicate` returns falsey for. The predicate is
     * invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the array of grouped elements.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': false },
     *   { 'user': 'fred',    'age': 40, 'active': true },
     *   { 'user': 'pebbles', 'age': 1,  'active': false }
     * ];
     *
     * _.partition(users, function(o) { return o.active; });
     * // => objects for [['fred'], ['barney', 'pebbles']]
     *
     * // The `_.matches` iteratee shorthand.
     * _.partition(users, { 'age': 1, 'active': false });
     * // => objects for [['pebbles'], ['barney', 'fred']]
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.partition(users, ['active', false]);
     * // => objects for [['barney', 'pebbles'], ['fred']]
     *
     * // The `_.property` iteratee shorthand.
     * _.partition(users, 'active');
     * // => objects for [['fred'], ['barney', 'pebbles']]
     */
    var partition = createAggregator(function(result, value, key) {
      result[key ? 0 : 1].push(value);
    }, function() { return [[], []]; });

    /**
     * Reduces `collection` to a value which is the accumulated result of running
     * each element in `collection` thru `iteratee`, where each successive
     * invocation is supplied the return value of the previous. If `accumulator`
     * is not given, the first element of `collection` is used as the initial
     * value. The iteratee is invoked with four arguments:
     * (accumulator, value, index|key, collection).
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.reduce`, `_.reduceRight`, and `_.transform`.
     *
     * The guarded methods are:
     * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `orderBy`,
     * and `sortBy`
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @returns {*} Returns the accumulated value.
     * @see _.reduceRight
     * @example
     *
     * _.reduce([1, 2], function(sum, n) {
     *   return sum + n;
     * }, 0);
     * // => 3
     *
     * _.reduce({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
     *   (result[value] || (result[value] = [])).push(key);
     *   return result;
     * }, {});
     * // => { '1': ['a', 'c'], '2': ['b'] } (iteration order is not guaranteed)
     */
    function reduce(collection, iteratee, accumulator) {
      var func = isArray(collection) ? arrayReduce : baseReduce,
          initAccum = arguments.length < 3;

      return func(collection, getIteratee(iteratee, 4), accumulator, initAccum, baseEach);
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @returns {*} Returns the accumulated value.
     * @see _.reduce
     * @example
     *
     * var array = [[0, 1], [2, 3], [4, 5]];
     *
     * _.reduceRight(array, function(flattened, other) {
     *   return flattened.concat(other);
     * }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, iteratee, accumulator) {
      var func = isArray(collection) ? arrayReduceRight : baseReduce,
          initAccum = arguments.length < 3;

      return func(collection, getIteratee(iteratee, 4), accumulator, initAccum, baseEachRight);
    }

    /**
     * The opposite of `_.filter`; this method returns the elements of `collection`
     * that `predicate` does **not** return truthy for.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     * @see _.filter
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false },
     *   { 'user': 'fred',   'age': 40, 'active': true }
     * ];
     *
     * _.reject(users, function(o) { return !o.active; });
     * // => objects for ['fred']
     *
     * // The `_.matches` iteratee shorthand.
     * _.reject(users, { 'age': 40, 'active': true });
     * // => objects for ['barney']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.reject(users, ['active', false]);
     * // => objects for ['fred']
     *
     * // The `_.property` iteratee shorthand.
     * _.reject(users, 'active');
     * // => objects for ['barney']
     */
    function reject(collection, predicate) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      return func(collection, negate(getIteratee(predicate, 3)));
    }

    /**
     * Gets a random element from `collection`.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to sample.
     * @returns {*} Returns the random element.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     */
    function sample(collection) {
      var func = isArray(collection) ? arraySample : baseSample;
      return func(collection);
    }

    /**
     * Gets `n` random elements at unique keys from `collection` up to the
     * size of `collection`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to sample.
     * @param {number} [n=1] The number of elements to sample.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the random elements.
     * @example
     *
     * _.sampleSize([1, 2, 3], 2);
     * // => [3, 1]
     *
     * _.sampleSize([1, 2, 3], 4);
     * // => [2, 3, 1]
     */
    function sampleSize(collection, n, guard) {
      if ((guard ? isIterateeCall(collection, n, guard) : n === undefined)) {
        n = 1;
      } else {
        n = toInteger(n);
      }
      var func = isArray(collection) ? arraySampleSize : baseSampleSize;
      return func(collection, n);
    }

    /**
     * Creates an array of shuffled values, using a version of the
     * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to shuffle.
     * @returns {Array} Returns the new shuffled array.
     * @example
     *
     * _.shuffle([1, 2, 3, 4]);
     * // => [4, 1, 3, 2]
     */
    function shuffle(collection) {
      var func = isArray(collection) ? arrayShuffle : baseShuffle;
      return func(collection);
    }

    /**
     * Gets the size of `collection` by returning its length for array-like
     * values or the number of own enumerable string keyed properties for objects.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns the collection size.
     * @example
     *
     * _.size([1, 2, 3]);
     * // => 3
     *
     * _.size({ 'a': 1, 'b': 2 });
     * // => 2
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      if (collection == null) {
        return 0;
      }
      if (isArrayLike(collection)) {
        return isString(collection) ? stringSize(collection) : collection.length;
      }
      var tag = getTag(collection);
      if (tag == mapTag || tag == setTag) {
        return collection.size;
      }
      return baseKeys(collection).length;
    }

    /**
     * Checks if `predicate` returns truthy for **any** element of `collection`.
     * Iteration is stopped once `predicate` returns truthy. The predicate is
     * invoked with three arguments: (value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var users = [
     *   { 'user': 'barney', 'active': true },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // The `_.matches` iteratee shorthand.
     * _.some(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.some(users, ['active', false]);
     * // => true
     *
     * // The `_.property` iteratee shorthand.
     * _.some(users, 'active');
     * // => true
     */
    function some(collection, predicate, guard) {
      var func = isArray(collection) ? arraySome : baseSome;
      if (guard && isIterateeCall(collection, predicate, guard)) {
        predicate = undefined;
      }
      return func(collection, getIteratee(predicate, 3));
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection thru each iteratee. This method
     * performs a stable sort, that is, it preserves the original sort order of
     * equal elements. The iteratees are invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {...(Function|Function[])} [iteratees=[_.identity]]
     *  The iteratees to sort by.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 30 },
     *   { 'user': 'barney', 'age': 34 }
     * ];
     *
     * _.sortBy(users, [function(o) { return o.user; }]);
     * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 30]]
     *
     * _.sortBy(users, ['user', 'age']);
     * // => objects for [['barney', 34], ['barney', 36], ['fred', 30], ['fred', 48]]
     */
    var sortBy = baseRest(function(collection, iteratees) {
      if (collection == null) {
        return [];
      }
      var length = iteratees.length;
      if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
        iteratees = [];
      } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
        iteratees = [iteratees[0]];
      }
      return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
    });

    /*------------------------------------------------------------------------*/

    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */
    var now = ctxNow || function() {
      return root.Date.now();
    };

    /*------------------------------------------------------------------------*/

    /**
     * The opposite of `_.before`; this method creates a function that invokes
     * `func` once it's called `n` or more times.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {number} n The number of calls before `func` is invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => Logs 'done saving!' after the two async saves have completed.
     */
    function after(n, func) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      n = toInteger(n);
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that invokes `func`, with up to `n` arguments,
     * ignoring any additional arguments.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Function
     * @param {Function} func The function to cap arguments for.
     * @param {number} [n=func.length] The arity cap.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Function} Returns the new capped function.
     * @example
     *
     * _.map(['6', '8', '10'], _.ary(parseInt, 1));
     * // => [6, 8, 10]
     */
    function ary(func, n, guard) {
      n = guard ? undefined : n;
      n = (func && n == null) ? func.length : n;
      return createWrap(func, WRAP_ARY_FLAG, undefined, undefined, undefined, undefined, n);
    }

    /**
     * Creates a function that invokes `func`, with the `this` binding and arguments
     * of the created function, while it's called less than `n` times. Subsequent
     * calls to the created function return the result of the last `func` invocation.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Function
     * @param {number} n The number of calls at which `func` is no longer invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * jQuery(element).on('click', _.before(5, addContactToList));
     * // => Allows adding up to 4 contacts to the list.
     */
    function before(n, func) {
      var result;
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      n = toInteger(n);
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = undefined;
        }
        return result;
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and `partials` prepended to the arguments it receives.
     *
     * The `_.bind.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for partially applied arguments.
     *
     * **Note:** Unlike native `Function#bind`, this method doesn't set the "length"
     * property of bound functions.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * function greet(greeting, punctuation) {
     *   return greeting + ' ' + this.user + punctuation;
     * }
     *
     * var object = { 'user': 'fred' };
     *
     * var bound = _.bind(greet, object, 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * // Bound with placeholders.
     * var bound = _.bind(greet, object, _, '!');
     * bound('hi');
     * // => 'hi fred!'
     */
    var bind = baseRest(function(func, thisArg, partials) {
      var bitmask = WRAP_BIND_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, getHolder(bind));
        bitmask |= WRAP_PARTIAL_FLAG;
      }
      return createWrap(func, bitmask, thisArg, partials, holders);
    });

    /**
     * Creates a function that invokes the method at `object[key]` with `partials`
     * prepended to the arguments it receives.
     *
     * This method differs from `_.bind` by allowing bound functions to reference
     * methods that may be redefined or don't yet exist. See
     * [Peter Michaux's article](http://peter.michaux.ca/articles/lazy-function-definition-pattern)
     * for more details.
     *
     * The `_.bindKey.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * @static
     * @memberOf _
     * @since 0.10.0
     * @category Function
     * @param {Object} object The object to invoke the method on.
     * @param {string} key The key of the method.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'user': 'fred',
     *   'greet': function(greeting, punctuation) {
     *     return greeting + ' ' + this.user + punctuation;
     *   }
     * };
     *
     * var bound = _.bindKey(object, 'greet', 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * object.greet = function(greeting, punctuation) {
     *   return greeting + 'ya ' + this.user + punctuation;
     * };
     *
     * bound('!');
     * // => 'hiya fred!'
     *
     * // Bound with placeholders.
     * var bound = _.bindKey(object, 'greet', _, '!');
     * bound('hi');
     * // => 'hiya fred!'
     */
    var bindKey = baseRest(function(object, key, partials) {
      var bitmask = WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, getHolder(bindKey));
        bitmask |= WRAP_PARTIAL_FLAG;
      }
      return createWrap(key, bitmask, object, partials, holders);
    });

    /**
     * Creates a function that accepts arguments of `func` and either invokes
     * `func` returning its result, if at least `arity` number of arguments have
     * been provided, or returns a function that accepts the remaining `func`
     * arguments, and so on. The arity of `func` may be specified if `func.length`
     * is not sufficient.
     *
     * The `_.curry.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for provided arguments.
     *
     * **Note:** This method doesn't set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curry(abc);
     *
     * curried(1)(2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // Curried with placeholders.
     * curried(1)(_, 3)(2);
     * // => [1, 2, 3]
     */
    function curry(func, arity, guard) {
      arity = guard ? undefined : arity;
      var result = createWrap(func, WRAP_CURRY_FLAG, undefined, undefined, undefined, undefined, undefined, arity);
      result.placeholder = curry.placeholder;
      return result;
    }

    /**
     * This method is like `_.curry` except that arguments are applied to `func`
     * in the manner of `_.partialRight` instead of `_.partial`.
     *
     * The `_.curryRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for provided arguments.
     *
     * **Note:** This method doesn't set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curryRight(abc);
     *
     * curried(3)(2)(1);
     * // => [1, 2, 3]
     *
     * curried(2, 3)(1);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // Curried with placeholders.
     * curried(3)(1, _)(2);
     * // => [1, 2, 3]
     */
    function curryRight(func, arity, guard) {
      arity = guard ? undefined : arity;
      var result = createWrap(func, WRAP_CURRY_RIGHT_FLAG, undefined, undefined, undefined, undefined, undefined, arity);
      result.placeholder = curryRight.placeholder;
      return result;
    }

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            timeWaiting = wait - timeSinceLastCall;

        return maxing
          ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
          : timeWaiting;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now());
      }

      function debounced() {
        var time = now(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            clearTimeout(timerId);
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }

    /**
     * Defers invoking the `func` until the current call stack has cleared. Any
     * additional arguments are provided to `func` when it's invoked.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to defer.
     * @param {...*} [args] The arguments to invoke `func` with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) {
     *   console.log(text);
     * }, 'deferred');
     * // => Logs 'deferred' after one millisecond.
     */
    var defer = baseRest(function(func, args) {
      return baseDelay(func, 1, args);
    });

    /**
     * Invokes `func` after `wait` milliseconds. Any additional arguments are
     * provided to `func` when it's invoked.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {...*} [args] The arguments to invoke `func` with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) {
     *   console.log(text);
     * }, 1000, 'later');
     * // => Logs 'later' after one second.
     */
    var delay = baseRest(function(func, wait, args) {
      return baseDelay(func, toNumber(wait) || 0, args);
    });

    /**
     * Creates a function that invokes `func` with arguments reversed.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Function
     * @param {Function} func The function to flip arguments for.
     * @returns {Function} Returns the new flipped function.
     * @example
     *
     * var flipped = _.flip(function() {
     *   return _.toArray(arguments);
     * });
     *
     * flipped('a', 'b', 'c', 'd');
     * // => ['d', 'c', 'b', 'a']
     */
    function flip(func) {
      return createWrap(func, WRAP_FLIP_FLAG);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided, it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is used as the map cache key. The `func`
     * is invoked with the `this` binding of the memoized function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     *
     *