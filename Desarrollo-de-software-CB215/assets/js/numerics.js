/**
 * numerics.js — Métodos numéricos de integración (funciones puras).
 *
 * Todas las funciones reciben f como una función de JavaScript (x => número),
 * no modifican nada fuera de ellas y siempre devuelven el mismo resultado para
 * las mismas entradas. Por eso pueden probarse con Node sin navegador:
 *
 *   node tests/numerics.test.js
 *
 * Funciona en ambos entornos (patrón UMD):
 *   - Navegador: queda disponible como window.Numerics
 *   - Node:      const Numerics = require('./assets/js/numerics.js')
 *
 * Notación: se integra f en [a, b] con n subintervalos de ancho Δx = (b − a)/n
 * y nodos x_i = a + iΔx, i = 0, 1, …, n.
 */
(function (raiz, fabrica) {
  'use strict';
  var api = fabrica();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    raiz.Numerics = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** Número de subintervalos que se usa para el valor de referencia ("exacto"). */
  var REFERENCE_N = 10000;

  /* ------------------------------------------------------------------ */
  /* Errores y validación                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Error que se lanza cuando f no produce un número finito en algún punto
   * (por ejemplo 1/x en x = 0 o sqrt(x) con x < 0).
   * @param {number} x Punto donde falló la evaluación.
   * @constructor
   */
  function NonFiniteError(x) {
    this.name = 'NonFiniteError';
    this.x = x;
    this.message = 'f(x) no es un número real finito en x = ' + x;
    if (Error.captureStackTrace) Error.captureStackTrace(this, NonFiniteError);
  }
  NonFiniteError.prototype = Object.create(Error.prototype);
  NonFiniteError.prototype.constructor = NonFiniteError;

  /**
   * Comprueba los argumentos comunes de todos los métodos.
   * @throws {TypeError|RangeError}
   */
  function validate(f, a, b, n) {
    if (typeof f !== 'function') throw new TypeError('f debe ser una función de una variable');
    if (typeof a !== 'number' || typeof b !== 'number' || !isFinite(a) || !isFinite(b)) {
      throw new RangeError('Los límites a y b deben ser números finitos');
    }
    if (!(a < b)) throw new RangeError('Se requiere a < b');
    if (typeof n !== 'number' || !isFinite(n) || Math.floor(n) !== n || n < 1) {
      throw new RangeError('n debe ser un entero positivo');
    }
  }

  /**
   * Evalúa f(x) y garantiza que el resultado sea un número finito.
   * @throws {NonFiniteError}
   */
  function evaluate(f, x) {
    var y = f(x);
    if (typeof y !== 'number' || !isFinite(y)) throw new NonFiniteError(x);
    return y;
  }

  /* ------------------------------------------------------------------ */
  /* Partición y nodos con pesos                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Partición regular de [a, b] en n subintervalos.
   * @param {number} a
   * @param {number} b
   * @param {number} n
   * @returns {number[]} Nodos x_0 = a, …, x_n = b (n + 1 valores).
   */
  function partition(a, b, n) {
    var dx = (b - a) / n;
    var x = new Array(n + 1);
    for (var i = 0; i <= n; i++) x[i] = a + i * dx;
    x[n] = b; // evita el error de redondeo en el último nodo
    return x;
  }

  /**
   * Coeficientes de la regla del trapecio: 1, 2, 2, …, 2, 1.
   * @param {number} n
   * @returns {number[]}
   */
  function trapezoidCoefficients(n) {
    var c = [];
    for (var i = 0; i <= n; i++) c.push(i === 0 || i === n ? 1 : 2);
    return c;
  }

  /**
   * Coeficientes de la regla de Simpson: 1, 4, 2, 4, …, 2, 4, 1 (n par).
   * @param {number} n
   * @returns {number[]}
   */
  function simpsonCoefficients(n) {
    var c = [];
    for (var i = 0; i <= n; i++) c.push(i === 0 || i === n ? 1 : (i % 2 === 1 ? 4 : 2));
    return c;
  }

  /**
   * Nodos y pesos de cada regla, de modo que la aproximación es Σ w_i · f(x_i).
   * Es la base común de todos los métodos y de las tablas del visualizador.
   *
   * @param {'left'|'right'|'mid'|'trapezoid'|'simpson'} rule Regla de integración.
   * @param {number} a
   * @param {number} b
   * @param {number} n
   * @returns {{x: number[], w: number[], dx: number}}
   */
  function nodes(rule, a, b, n) {
    var dx = (b - a) / n;
    var p = partition(a, b, n);
    var x = [];
    var w = [];
    var i;
    switch (rule) {
      case 'left':
        for (i = 0; i < n; i++) { x.push(p[i]); w.push(dx); }
        break;
      case 'right':
        for (i = 1; i <= n; i++) { x.push(p[i]); w.push(dx); }
        break;
      case 'mid':
        for (i = 1; i <= n; i++) { x.push((p[i - 1] + p[i]) / 2); w.push(dx); }
        break;
      case 'trapezoid':
        trapezoidCoefficients(n).forEach(function (c, j) { x.push(p[j]); w.push(c * dx / 2); });
        break;
      case 'simpson':
        if (n % 2 !== 0) throw new RangeError('La regla de Simpson requiere un número par de subintervalos (n = ' + n + ' es impar)');
        simpsonCoefficients(n).forEach(function (c, j) { x.push(p[j]); w.push(c * dx / 3); });
        break;
      default:
        throw new RangeError('Regla desconocida: ' + rule);
    }
    return { x: x, w: w, dx: dx };
  }

  /**
   * Suma ponderada Σ w_i · f(x_i).
   * @param {function(number): number} f
   * @param {{x: number[], w: number[]}} nodos
   * @returns {number}
   */
  function weightedSum(f, nodos) {
    var suma = 0;
    for (var i = 0; i < nodos.x.length; i++) suma += nodos.w[i] * evaluate(f, nodos.x[i]);
    return suma;
  }

  /* ------------------------------------------------------------------ */
  /* Métodos de integración                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Integra f en [a, b] con la regla indicada.
   * @param {'left'|'right'|'mid'|'trapezoid'|'simpson'} rule
   * @param {function(number): number} f
   * @param {number} a
   * @param {number} b
   * @param {number} n
   * @returns {number}
   */
  function integrate(rule, f, a, b, n) {
    validate(f, a, b, n);
    return weightedSum(f, nodes(rule, a, b, n));
  }

  /**
   * Suma de Riemann por la izquierda: L_n = Δx · Σ_{i=0}^{n−1} f(x_i).
   * @param {function(number): number} f Función a integrar.
   * @param {number} a Límite inferior.
   * @param {number} b Límite superior (a < b).
   * @param {number} n Número de subintervalos (entero ≥ 1).
   * @returns {number} Aproximación de ∫_a^b f(x) dx.
   */
  function riemannLeft(f, a, b, n) {
    return integrate('left', f, a, b, n);
  }

  /**
   * Suma de Riemann por la derecha: R_n = Δx · Σ_{i=1}^{n} f(x_i).
   * @param {function(number): number} f
   * @param {number} a
   * @param {number} b
   * @param {number} n
   * @returns {number}
   */
  function riemannRight(f, a, b, n) {
    return integrate('right', f, a, b, n);
  }

  /**
   * Suma de Riemann con punto medio: M_n = Δx · Σ_{i=1}^{n} f(x̄_i),
   * con x̄_i = (x_{i−1} + x_i)/2.
   * @param {function(number): number} f
   * @param {number} a
   * @param {number} b
   * @param {number} n
   * @returns {number}
   */
  function riemannMid(f, a, b, n) {
    return integrate('mid', f, a, b, n);
  }

  /**
   * Regla del punto medio. Es la misma fórmula que riemannMid; se expone con
   * su nombre propio porque así se estudia en el módulo 3.
   * @param {function(number): number} f
   * @param {number} a
   * @param {number} b
   * @param {number} n
   * @returns {number}
   */
  function midpoint(f, a, b, n) {
    return riemannMid(f, a, b, n);
  }

  /**
   * Regla del trapecio: T_n = (Δx/2) · [f(x_0) + 2f(x_1) + … + 2f(x_{n−1}) + f(x_n)].
   * @param {function(number): number} f
   * @param {number} a
   * @param {number} b
   * @param {number} n
   * @returns {number}
   */
  function trapezoid(f, a, b, n) {
    return integrate('trapezoid', f, a, b, n);
  }

  /**
   * Regla de Simpson: S_n = (Δx/3) · [f(x_0) + 4f(x_1) + 2f(x_2) + … + 4f(x_{n−1}) + f(x_n)].
   * Es exacta para polinomios de grado ≤ 3.
   * @param {function(number): number} f
   * @param {number} a
   * @param {number} b
   * @param {number} n Número PAR de subintervalos.
   * @returns {number}
   * @throws {RangeError} Si n es impar.
   */
  function simpson(f, a, b, n) {
    validate(f, a, b, n);
    if (n % 2 !== 0) throw new RangeError('La regla de Simpson requiere un número par de subintervalos (n = ' + n + ' es impar)');
    return weightedSum(f, nodes('simpson', a, b, n));
  }

  /**
   * Valor de referencia ("exacto") de la integral: Simpson con n muy grande.
   * @param {function(number): number} f
   * @param {number} a
   * @param {number} b
   * @param {number} [n=REFERENCE_N]
   * @returns {number}
   */
  function reference(f, a, b, n) {
    return simpson(f, a, b, n || REFERENCE_N);
  }

  /* ------------------------------------------------------------------ */
  /* Errores de aproximación                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Error absoluto |exacto − aproximación|.
   * @param {number} exacto
   * @param {number} aproximacion
   * @returns {number}
   */
  function absoluteError(exacto, aproximacion) {
    return Math.abs(exacto - aproximacion);
  }

  /**
   * Error relativo |exacto − aproximación| / |exacto|.
   * Devuelve NaN cuando el valor exacto es (prácticamente) cero, porque en ese
   * caso el error relativo no está definido.
   * @param {number} exacto
   * @param {number} aproximacion
   * @returns {number}
   */
  function relativeError(exacto, aproximacion) {
    if (Math.abs(exacto) < 1e-12) return NaN;
    return Math.abs(exacto - aproximacion) / Math.abs(exacto);
  }

  /* ------------------------------------------------------------------ */
  /* Utilidades geométricas                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Coeficientes de la parábola y = A x² + B x + C que pasa por tres puntos
   * con abscisas distintas (se usa para dibujar la regla de Simpson).
   * @returns {{A: number, B: number, C: number}}
   */
  function parabolaThrough(x0, y0, x1, y1, x2, y2) {
    // Diferencias divididas de Newton
    var d01 = (y1 - y0) / (x1 - x0);
    var d12 = (y2 - y1) / (x2 - x1);
    var A = (d12 - d01) / (x2 - x0);
    var B = d01 - A * (x0 + x1);
    var C = y0 - A * x0 * x0 - B * x0;
    return { A: A, B: B, C: C };
  }

  /** Evalúa f y devuelve NaN en lugar de lanzar si el valor no es finito. */
  function safe(f, x) {
    try {
      var y = f(x);
      return typeof y === 'number' && isFinite(y) ? y : NaN;
    } catch (e) {
      return NaN;
    }
  }

  /**
   * Busca las raíces de h en [a, b]: cambios de signo refinados por bisección
   * y ceros tangentes (mínimos locales de |h| prácticamente nulos). Descarta
   * los cambios de signo producidos por asíntotas (como 1/x en x = 0).
   *
   * @param {function(number): number} h
   * @param {number} a
   * @param {number} b
   * @param {{samples?: number}} [opciones]
   * @returns {number[]} Raíces ordenadas de menor a mayor.
   */
  function findRoots(h, a, b, opciones) {
    var muestras = (opciones && opciones.samples) || 1000;
    var dx = (b - a) / muestras;
    var xs = [];
    var ys = [];
    var escala = 1;
    var i;
    for (i = 0; i <= muestras; i++) {
      var x = i === muestras ? b : a + i * dx;
      var y = safe(h, x);
      xs.push(x);
      ys.push(y);
      if (isFinite(y)) escala = Math.max(escala, Math.abs(y));
    }

    var raices = [];
    var tolValor = 1e-9 * escala;

    function agregar(r) {
      raices.push(r);
    }

    function biseccion(x0, x1, y0) {
      for (var k = 0; k < 200 && x1 - x0 > 1e-15 * (1 + Math.abs(x0)); k++) {
        var xm = (x0 + x1) / 2;
        var ym = safe(h, xm);
        if (!isFinite(ym)) return null;
        if (ym === 0) return xm;
        if ((ym < 0) === (y0 < 0)) { x0 = xm; y0 = ym; } else { x1 = xm; }
      }
      var r = (x0 + x1) / 2;
      var hr = safe(h, r);
      // En una asíntota h(r) es enorme: no es una raíz
      return isFinite(hr) && Math.abs(hr) <= 1e-6 * escala ? r : null;
    }

    function minimoDeAbs(x0, x1) {
      // Búsqueda de sección dorada del mínimo de |h| en [x0, x1]
      var phi = (Math.sqrt(5) - 1) / 2;
      var c = x1 - phi * (x1 - x0);
      var d = x0 + phi * (x1 - x0);
      for (var k = 0; k < 80; k++) {
        if (Math.abs(safe(h, c)) < Math.abs(safe(h, d))) { x1 = d; } else { x0 = c; }
        c = x1 - phi * (x1 - x0);
        d = x0 + phi * (x1 - x0);
      }
      return (x0 + x1) / 2;
    }

    for (i = 0; i < muestras; i++) {
      var y0 = ys[i];
      var y1 = ys[i + 1];
      if (!isFinite(y0) || !isFinite(y1)) continue;
      if (y0 === 0) {
        agregar(xs[i]);
      } else if (y0 * y1 < 0) {
        var r = biseccion(xs[i], xs[i + 1], y0);
        if (r !== null) agregar(r);
      } else if (i > 0 && isFinite(ys[i - 1]) && y1 !== 0 &&
                 Math.abs(y0) < Math.abs(ys[i - 1]) && Math.abs(y0) <= Math.abs(y1) &&
                 (ys[i - 1] > 0) === (y0 > 0) && (y1 > 0) === (y0 > 0) &&
                 Math.abs(y0) < 1e-3 * escala) {
        // Posible raíz tangente (la curva toca el eje sin cruzarlo)
        var xm = minimoDeAbs(xs[i - 1], xs[i + 1]);
        if (Math.abs(safe(h, xm)) <= tolValor) agregar(xm);
      }
    }
    if (ys[muestras] === 0) agregar(b);

    // Ordena y elimina duplicados cercanos
    raices.sort(function (p, q) { return p - q; });
    var unicas = [];
    var tolX = 1e-9 * Math.max(1, b - a);
    raices.forEach(function (r) {
      if (!unicas.length || Math.abs(r - unicas[unicas.length - 1]) > tolX) unicas.push(r);
    });
    return unicas;
  }

  /**
   * Integral con signo y área total de h en [a, b], separando el intervalo en
   * los puntos donde h cambia de signo. Cada tramo se integra con Simpson.
   *
   * @param {function(number): number} h
   * @param {number} a
   * @param {number} b
   * @param {number} [nPorTramo=1000] Subintervalos de Simpson por tramo (par).
   * @returns {{roots: number[], pieces: Array<{a: number, b: number, integral: number}>,
   *            integral: number, area: number, positive: number, negative: number}}
   */
  function signedArea(h, a, b, nPorTramo) {
    if (!(a < b)) throw new RangeError('Se requiere a < b');
    var n = nPorTramo || 1000;
    var tolX = 1e-9 * Math.max(1, b - a);
    var raices = findRoots(h, a, b).filter(function (r) { return r > a + tolX && r < b - tolX; });
    var puntos = [a].concat(raices, [b]);
    var tramos = [];
    var integral = 0;
    var area = 0;
    var positiva = 0;
    var negativa = 0;
    for (var i = 0; i < puntos.length - 1; i++) {
      var p = puntos[i];
      var q = puntos[i + 1];
      var valor = simpson(h, p, q, n);
      tramos.push({ a: p, b: q, integral: valor });
      integral += valor;
      area += Math.abs(valor);
      if (valor >= 0) positiva += valor; else negativa += valor;
    }
    return { roots: raices, pieces: tramos, integral: integral, area: area, positive: positiva, negative: negativa };
  }

  /**
   * Integral acumulada A(x_k) = ∫_{x_0}^{x_k} f por trapecios sobre una malla
   * (se usa para dibujar la función de área del Teorema Fundamental).
   * @param {number[]} xs Abscisas crecientes.
   * @param {number[]} ys Valores de f (NaN corta la acumulación).
   * @returns {number[]}
   */
  function cumulativeTrapezoid(xs, ys) {
    var acumulado = [0];
    for (var i = 1; i < xs.length; i++) {
      var tramo = (xs[i] - xs[i - 1]) * (ys[i] + ys[i - 1]) / 2;
      acumulado.push(acumulado[i - 1] + tramo);
    }
    return acumulado;
  }

  return {
    REFERENCE_N: REFERENCE_N,
    NonFiniteError: NonFiniteError,
    partition: partition,
    nodes: nodes,
    weightedSum: weightedSum,
    trapezoidCoefficients: trapezoidCoefficients,
    simpsonCoefficients: simpsonCoefficients,
    integrate: integrate,
    riemannLeft: riemannLeft,
    riemannRight: riemannRight,
    riemannMid: riemannMid,
    midpoint: midpoint,
    trapezoid: trapezoid,
    simpson: simpson,
    reference: reference,
    absoluteError: absoluteError,
    relativeError: relativeError,
    parabolaThrough: parabolaThrough,
    findRoots: findRoots,
    signedArea: signedArea,
    cumulativeTrapezoid: cumulativeTrapezoid
  };
});
