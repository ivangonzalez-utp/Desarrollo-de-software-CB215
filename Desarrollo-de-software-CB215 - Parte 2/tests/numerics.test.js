/**
 * Pruebas de assets/js/numerics.js (sin dependencias externas).
 *
 * Ejecutar desde la raíz del proyecto:
 *   node tests/numerics.test.js
 *
 * Termina con código 0 si todas las pruebas pasan y 1 si alguna falla.
 */
'use strict';

var assert = require('node:assert/strict');
var path = require('node:path');
var N = require(path.join(__dirname, '..', 'assets', 'js', 'numerics.js'));

var pasadas = 0;
var fallidas = 0;

function grupo(nombre) {
  console.log('\n' + nombre);
}

function prueba(nombre, fn) {
  try {
    fn();
    pasadas++;
    console.log('  ✓ ' + nombre);
  } catch (error) {
    fallidas++;
    console.log('  ✗ ' + nombre + '\n      ' + error.message);
  }
}

/** Afirma que |real − esperado| ≤ tol. */
function cerca(real, esperado, tol, contexto) {
  assert.ok(
    Math.abs(real - esperado) <= tol,
    (contexto ? contexto + ': ' : '') + 'se esperaba ' + esperado + ' y se obtuvo ' + real + ' (tolerancia ' + tol + ')'
  );
}

var cuadrado = function (x) { return x * x; };
var METODOS = ['riemannLeft', 'riemannRight', 'riemannMid', 'midpoint', 'trapezoid', 'simpson'];

/* -------------------------------------------------------------------- */
grupo('1. Valores exactos conocidos (n = 1000)');
/* -------------------------------------------------------------------- */

var CASOS_EXACTOS = [
  { nombre: '∫_0^2 x² dx = 8/3', f: cuadrado, a: 0, b: 2, exacto: 8 / 3 },
  { nombre: '∫_0^1 eˣ dx = e − 1', f: Math.exp, a: 0, b: 1, exacto: Math.E - 1 },
  { nombre: '∫_0^π sen x dx = 2', f: Math.sin, a: 0, b: Math.PI, exacto: 2 }
];
// Tolerancias acordes al orden de cada método: O(1/n) para Riemann
// izquierda/derecha, O(1/n²) para punto medio y trapecio, O(1/n⁴) para Simpson.
var TOLERANCIA = { riemannLeft: 5e-3, riemannRight: 5e-3, riemannMid: 1e-5, midpoint: 1e-5, trapezoid: 1e-5, simpson: 1e-11 };

CASOS_EXACTOS.forEach(function (caso) {
  METODOS.forEach(function (metodo) {
    prueba(metodo + ': ' + caso.nombre, function () {
      cerca(N[metodo](caso.f, caso.a, caso.b, 1000), caso.exacto, TOLERANCIA[metodo]);
    });
  });
});

prueba('reference() coincide con el valor exacto con 10 cifras', function () {
  CASOS_EXACTOS.forEach(function (caso) {
    cerca(N.reference(caso.f, caso.a, caso.b), caso.exacto, 1e-10, caso.nombre);
  });
});

/* -------------------------------------------------------------------- */
grupo('2. Simpson es exacto para polinomios de grado ≤ 3');
/* -------------------------------------------------------------------- */

/** Polinomio c0 + c1 x + c2 x² + c3 x³ y su antiderivada. */
function polinomio(c) {
  return {
    f: function (x) { return c[0] + c[1] * x + c[2] * x * x + c[3] * x * x * x; },
    F: function (x) { return c[0] * x + c[1] * x * x / 2 + c[2] * x * x * x / 3 + c[3] * x * x * x * x / 4; }
  };
}

var POLINOMIOS = [
  { nombre: 'constante 5', c: [5, 0, 0, 0] },
  { nombre: 'lineal 2 − 3x', c: [2, -3, 0, 0] },
  { nombre: 'cuadrático x² − 4x + 1', c: [1, -4, 1, 0] },
  { nombre: 'cúbico 2x³ − 5x + 7', c: [7, -5, 0, 2] },
  { nombre: 'cúbico −x³ + 3x² − x + 0.5', c: [0.5, -1, 3, -1] }
];
var INTERVALOS = [[0, 1], [-2, 3], [1.5, 4.25]];

POLINOMIOS.forEach(function (p) {
  prueba(p.nombre + ' con n = 2, 4, 6 y 10 en varios intervalos', function () {
    var poli = polinomio(p.c);
    INTERVALOS.forEach(function (ab) {
      var exacto = poli.F(ab[1]) - poli.F(ab[0]);
      [2, 4, 6, 10].forEach(function (n) {
        cerca(N.simpson(poli.f, ab[0], ab[1], n), exacto, 1e-10 * (1 + Math.abs(exacto)), '[' + ab + '] n=' + n);
      });
    });
  });
});

prueba('…pero NO es exacto para x⁴ (grado 4): S_2 en [0, 1] = 5/24 ≠ 1/5', function () {
  var s = N.simpson(function (x) { return Math.pow(x, 4); }, 0, 1, 2);
  cerca(s, 5 / 24, 1e-14);
  assert.ok(Math.abs(s - 0.2) > 1e-3);
});

/* -------------------------------------------------------------------- */
grupo('3. Valores de los ejemplos resueltos de la plataforma');
/* -------------------------------------------------------------------- */

var raiz = Math.sqrt;
var gauss = function (x) { return Math.exp(-x * x); };
var cubo1 = function (x) { return x * x * x + 1; };
var EJEMPLOS = [
  // Módulo 1
  ['M1: L_3 de x² en [0, 3] = 5', 'riemannLeft', cuadrado, 0, 3, 3, 5],
  ['M1: R_3 de x² en [0, 3] = 14', 'riemannRight', cuadrado, 0, 3, 3, 14],
  ['M1: M_3 de x² en [0, 3] = 8.75', 'riemannMid', cuadrado, 0, 3, 3, 8.75],
  ['M1: L_4 de x³ + 1 en [0, 1] = 1.140625', 'riemannLeft', cubo1, 0, 1, 4, 1.140625],
  ['M1: R_4 de x³ + 1 en [0, 1] = 1.390625', 'riemannRight', cubo1, 0, 1, 4, 1.390625],
  ['M1: M_4 de x³ + 1 en [0, 1] = 1.2421875', 'riemannMid', cubo1, 0, 1, 4, 1.2421875],
  // Módulo 2
  ['M2: T_3 de √x en [1, 4] ≈ 4.646264', 'trapezoid', raiz, 1, 4, 3, 4.646264],
  ['M2: T_4 de e^(−x²) en [0, 1] ≈ 0.742984', 'trapezoid', gauss, 0, 1, 4, 0.742984],
  // Módulo 3
  ['M3: M_4 de sen x en [0, π/2] ≈ 1.006455', 'midpoint', Math.sin, 0, Math.PI / 2, 4, 1.006455],
  ['M3: M_5 de 1/x en [1, 2] ≈ 0.691908', 'midpoint', function (x) { return 1 / x; }, 1, 2, 5, 0.691908],
  ['M3: T_5 de 1/x en [1, 2] ≈ 0.695635', 'trapezoid', function (x) { return 1 / x; }, 1, 2, 5, 0.695635],
  // Módulo 4
  ['M4: S_2 de x³ en [0, 2] = 4', 'simpson', function (x) { return x * x * x; }, 0, 2, 2, 4],
  ['M4: S_4 de ln x en [1, 3] ≈ 1.295322', 'simpson', Math.log, 1, 3, 4, 1.295322],
  ['M4: S_4 de e^(−x²) en [0, 1] ≈ 0.746855', 'simpson', gauss, 0, 1, 4, 0.746855]
];

EJEMPLOS.forEach(function (e) {
  prueba(e[0], function () {
    cerca(N[e[1]](e[2], e[3], e[4], e[5]), e[6], 5e-7);
  });
});

prueba('M5: ∫_0^3 x² dx = 9 y ∫_1^4 √x dx = 14/3', function () {
  cerca(N.simpson(cuadrado, 0, 3, 100), 9, 1e-12);
  cerca(N.simpson(raiz, 1, 4, 1000), 14 / 3, 1e-9);
});

prueba('M5: x² − 1 en [0, 2]: integral 2/3 y área total 2 (corte en x = 1)', function () {
  var r = N.signedArea(function (x) { return x * x - 1; }, 0, 2);
  cerca(r.integral, 2 / 3, 1e-10);
  cerca(r.area, 2, 1e-10);
  assert.equal(r.roots.length, 1);
  cerca(r.roots[0], 1, 1e-10);
});

prueba('M5: área entre y = x e y = x² es 1/6 (cortes en 0 y 1)', function () {
  var h = function (x) { return x - x * x; };
  var cortes = N.findRoots(h, -0.5, 1.5);
  assert.equal(cortes.length, 2);
  cerca(cortes[0], 0, 1e-10);
  cerca(cortes[1], 1, 1e-10);
  cerca(N.signedArea(h, cortes[0], cortes[1]).area, 1 / 6, 1e-12);
});

prueba('M6: las antiderivadas de los ejemplos cumplen F\'(x) = f(x)', function () {
  var derivada = function (F, x) { var h = 1e-5; return (F(x + h) - F(x - h)) / (2 * h); };
  var casos = [
    [function (x) { return 2 * x * x * x - 5 * x + 7; }, function (x) { return x * x * x * x / 2 - 5 * x * x / 2 + 7 * x; }],
    [function (x) { return Math.cbrt(x) + 2 / (x * x * x); }, function (x) { return 0.75 * Math.pow(Math.cbrt(x), 4) - 1 / (x * x); }],
    [function (x) { return (x * x + 3 * x - 4) / x; }, function (x) { return x * x / 2 + 3 * x - 4 * Math.log(Math.abs(x)); }],
    [function (x) { return (x * x + 1) * (x - 2); }, function (x) { return x * x * x * x / 4 - 2 * x * x * x / 3 + x * x / 2 - 2 * x; }]
  ];
  casos.forEach(function (par, i) {
    [-2.5, -1.2, -0.6, 0.5, 1.1, 2.3, 3.4].forEach(function (x) {
      var f = par[0](x);
      cerca(derivada(par[1], x), f, 1e-6 * Math.max(1, Math.abs(f)), 'ejemplo ' + (i + 1) + ' en x=' + x);
    });
  });
});

/* -------------------------------------------------------------------- */
grupo('4. Relaciones entre métodos y orden de convergencia');
/* -------------------------------------------------------------------- */

prueba('T_n = (L_n + R_n) / 2', function () {
  [1, 3, 8, 25].forEach(function (n) {
    var L = N.riemannLeft(Math.exp, 0, 2, n);
    var R = N.riemannRight(Math.exp, 0, 2, n);
    cerca(N.trapezoid(Math.exp, 0, 2, n), (L + R) / 2, 1e-12);
  });
});

prueba('S_2n = (T_n + 2·M_n) / 3', function () {
  [1, 2, 5, 12].forEach(function (n) {
    var T = N.trapezoid(Math.sin, 0, 3, n);
    var M = N.midpoint(Math.sin, 0, 3, n);
    cerca(N.simpson(Math.sin, 0, 3, 2 * n), (T + 2 * M) / 3, 1e-12);
  });
});

prueba('midpoint y riemannMid dan el mismo resultado', function () {
  assert.equal(N.midpoint(Math.cos, -1, 2, 17), N.riemannMid(Math.cos, -1, 2, 17));
});

prueba('Al duplicar n el error se divide ≈ 2 (Riemann), ≈ 4 (trapecio y punto medio), ≈ 16 (Simpson)', function () {
  var exacto = Math.E - 1;
  var razon = function (metodo) {
    return Math.abs(exacto - N[metodo](Math.exp, 0, 1, 20)) / Math.abs(exacto - N[metodo](Math.exp, 0, 1, 40));
  };
  cerca(razon('riemannLeft'), 2, 0.1, 'Riemann izquierda');
  cerca(razon('trapezoid'), 4, 0.05, 'trapecio');
  cerca(razon('midpoint'), 4, 0.05, 'punto medio');
  cerca(razon('simpson'), 16, 0.3, 'Simpson');
});

prueba('El error del punto medio es ≈ −1/2 del error del trapecio', function () {
  var exacto = Math.LN2;
  var inv = function (x) { return 1 / x; };
  var eT = exacto - N.trapezoid(inv, 1, 2, 50);
  var eM = exacto - N.midpoint(inv, 1, 2, 50);
  cerca(eM / eT, -0.5, 0.01);
});

/* -------------------------------------------------------------------- */
grupo('5. Validación de entradas');
/* -------------------------------------------------------------------- */

prueba('Simpson con n impar lanza RangeError', function () {
  assert.throws(function () { N.simpson(cuadrado, 0, 1, 7); }, RangeError);
});

prueba('a ≥ b lanza RangeError en todos los métodos', function () {
  METODOS.forEach(function (metodo) {
    assert.throws(function () { N[metodo](cuadrado, 2, 2, 4); }, RangeError, metodo);
    assert.throws(function () { N[metodo](cuadrado, 3, 1, 4); }, RangeError, metodo);
  });
});

prueba('n no entero, cero o negativo lanza RangeError', function () {
  [0, -2, 2.5, NaN, Infinity].forEach(function (n) {
    assert.throws(function () { N.trapezoid(cuadrado, 0, 1, n); }, RangeError, 'n=' + n);
  });
});

prueba('Límites no finitos lanzan RangeError y f no función lanza TypeError', function () {
  assert.throws(function () { N.trapezoid(cuadrado, 0, Infinity, 4); }, RangeError);
  assert.throws(function () { N.trapezoid(cuadrado, NaN, 1, 4); }, RangeError);
  assert.throws(function () { N.trapezoid('x^2', 0, 1, 4); }, TypeError);
});

prueba('División por cero: 1/x en [−1, 1] lanza NonFiniteError con el punto x', function () {
  var error = null;
  try {
    N.riemannRight(function (x) { return 1 / x; }, -1, 1, 4);
  } catch (e) {
    error = e;
  }
  assert.ok(error instanceof N.NonFiniteError, 'debe ser NonFiniteError');
  assert.equal(error.x, 0);
});

prueba('√x con x < 0 (NaN) también lanza NonFiniteError', function () {
  assert.throws(function () { N.midpoint(Math.sqrt, -1, 1, 4); }, N.NonFiniteError);
});

/* -------------------------------------------------------------------- */
grupo('6. Utilidades: nodos, errores, parábolas y raíces');
/* -------------------------------------------------------------------- */

prueba('partition devuelve n + 1 nodos que terminan exactamente en b', function () {
  var p = N.partition(0, 1, 3);
  assert.equal(p.length, 4);
  assert.equal(p[0], 0);
  assert.equal(p[3], 1);
});

prueba('La suma de los pesos de cada regla es b − a', function () {
  ['left', 'right', 'mid', 'trapezoid', 'simpson'].forEach(function (regla) {
    var nd = N.nodes(regla, -1, 3, 6);
    cerca(nd.w.reduce(function (s, w) { return s + w; }, 0), 4, 1e-12, regla);
  });
});

prueba('Coeficientes de Simpson 1-4-2-4-…-4-1 y del trapecio 1-2-…-2-1', function () {
  assert.deepEqual(N.simpsonCoefficients(6), [1, 4, 2, 4, 2, 4, 1]);
  assert.deepEqual(N.trapezoidCoefficients(4), [1, 2, 2, 2, 1]);
});

prueba('Errores absoluto y relativo (relativo no definido si el exacto es 0)', function () {
  assert.equal(N.absoluteError(2, 1.5), 0.5);
  cerca(N.relativeError(2, 1.5), 0.25, 1e-15);
  assert.ok(Number.isNaN(N.relativeError(0, 0.1)));
});

prueba('parabolaThrough: (0,1), (1,3), (2,7) → y = x² + x + 1', function () {
  var p = N.parabolaThrough(0, 1, 1, 3, 2, 7);
  cerca(p.A, 1, 1e-12);
  cerca(p.B, 1, 1e-12);
  cerca(p.C, 1, 1e-12);
});

prueba('findRoots: raíces de sen x en [0.5, 10] son π, 2π y 3π', function () {
  var r = N.findRoots(Math.sin, 0.5, 10);
  assert.equal(r.length, 3);
  cerca(r[0], Math.PI, 1e-10);
  cerca(r[1], 2 * Math.PI, 1e-10);
  cerca(r[2], 3 * Math.PI, 1e-10);
});

prueba('findRoots detecta raíces tangentes (x² en 0) e ignora asíntotas (1/x)', function () {
  var tangente = N.findRoots(cuadrado, -1, 1);
  assert.equal(tangente.length, 1);
  cerca(tangente[0], 0, 1e-6);
  assert.deepEqual(N.findRoots(function (x) { return 1 / x; }, -1, 1), []);
});

prueba('signedArea de sen x en [0, 2π]: integral 0 y área 4', function () {
  var r = N.signedArea(Math.sin, 0, 2 * Math.PI);
  cerca(r.integral, 0, 1e-10);
  cerca(r.area, 4, 1e-9);
  cerca(r.positive, 2, 1e-9);
  cerca(r.negative, -2, 1e-9);
});

prueba('cumulativeTrapezoid acumula el área: ∫_0^1 2x dx = 1', function () {
  var xs = N.partition(0, 1, 100);
  var ys = xs.map(function (x) { return 2 * x; });
  var A = N.cumulativeTrapezoid(xs, ys);
  assert.equal(A[0], 0);
  cerca(A[A.length - 1], 1, 1e-12);
});

/* -------------------------------------------------------------------- */
grupo('Ejemplos resueltos de los módulos 7 a 14 (Simpson vs valor exacto)');

var PI = Math.PI;
var E = Math.E;
var EJEMPLOS = [
  // Módulo 7 · sustitución
  ['M7 x(x²+1)³ en [0,1]', function (x) { return x * Math.pow(x * x + 1, 3); }, 0, 1, 15 / 8],
  ['M7 (3x+1)⁵ en [0,1]', function (x) { return Math.pow(3 * x + 1, 5); }, 0, 1, 227.5],
  ['M7 x²√(x³+4) en [0,2]', function (x) { return x * x * Math.sqrt(Math.pow(x, 3) + 4); }, 0, 2, 2 / 9 * (Math.pow(12, 1.5) - 8)],
  ['M7 sen³x cos x en [0,π/2]', function (x) { return Math.pow(Math.sin(x), 3) * Math.cos(x); }, 0, PI / 2, 0.25],
  ['M7 x/(x²+1)² en [1,2]', function (x) { return x / Math.pow(x * x + 1, 2); }, 1, 2, 0.15],
  ['M7 2x(x²−1)² en [−1,2] (g no monótona)', function (x) { return 2 * x * Math.pow(x * x - 1, 2); }, -1, 2, 9],
  // Módulo 8 · exponenciales
  ['M8 e^{3x} en [0,1]', function (x) { return Math.exp(3 * x); }, 0, 1, (Math.exp(3) - 1) / 3],
  ['M8 e^{-x/2} en [0,2]', function (x) { return Math.exp(-x / 2); }, 0, 2, 2 * (1 - Math.exp(-1))],
  ['M8 2^{3x} en [0,1]', function (x) { return Math.pow(2, 3 * x); }, 0, 1, 7 / (3 * Math.log(2))],
  ['M8 x e^{x²} en [0,1]', function (x) { return x * Math.exp(x * x); }, 0, 1, (E - 1) / 2],
  ['M8 40e^{-0,1x} en [0,10]', function (x) { return 40 * Math.exp(-0.1 * x); }, 0, 10, 400 * (1 - Math.exp(-1))],
  // Módulo 9 · logaritmos
  ['M9 2x/(x²+1) en [0,2]', function (x) { return 2 * x / (x * x + 1); }, 0, 2, Math.log(5)],
  ['M9 x²/(x³−8) en [3,5]', function (x) { return x * x / (Math.pow(x, 3) - 8); }, 3, 5, Math.log(117 / 19) / 3],
  ['M9 (x²+2x+3)/(x+1) en [0,2]', function (x) { return (x * x + 2 * x + 3) / (x + 1); }, 0, 2, 4 + 2 * Math.log(3)],
  ['M9 tan 2x en [0,π/8]', function (x) { return Math.tan(2 * x); }, 0, PI / 8, Math.log(2) / 4],
  ['M9 sec x en [0,π/4]', function (x) { return 1 / Math.cos(x); }, 0, PI / 4, Math.log(1 + Math.SQRT2)],
  ['M9 sec²x/tan x en [π/6,π/4]', function (x) { return 1 / Math.pow(Math.cos(x), 2) / Math.tan(x); }, PI / 6, PI / 4, Math.log(3) / 2],
  // Módulo 10 · trigonométricas
  ['M10 sen³x en [0,π]', function (x) { return Math.pow(Math.sin(x), 3); }, 0, PI, 4 / 3],
  ['M10 cos⁴x en [0,π]', function (x) { return Math.pow(Math.cos(x), 4); }, 0, PI, 3 * PI / 8],
  ['M10 sen3x cos5x en [0,π/4]', function (x) { return Math.sin(3 * x) * Math.cos(5 * x); }, 0, PI / 4, -1 / 4],
  ['M10 tan³x en [0,π/4]', function (x) { return Math.pow(Math.tan(x), 3); }, 0, PI / 4, 0.5 - Math.log(2) / 2],
  ['M10 sec⁴x en [0,π/4]', function (x) { return 1 / Math.pow(Math.cos(x), 4); }, 0, PI / 4, 4 / 3],
  ['M10 tan x sec³x en [0,π/3]', function (x) { return Math.tan(x) / Math.pow(Math.cos(x), 3); }, 0, PI / 3, 7 / 3],
  // Módulo 11 · trigonométricas inversas
  ['M11 1/√(4−x²) en [0,√2] = π/4', function (x) { return 1 / Math.sqrt(4 - x * x); }, 0, Math.SQRT2, PI / 4],
  ['M11 1/(x²+9) en [−3,3] = π/6', function (x) { return 1 / (x * x + 9); }, -3, 3, PI / 6],
  ['M11 1/(x√(x²−4)) en [2√2,4] = π/24', function (x) { return 1 / (x * Math.sqrt(x * x - 4)); }, 2 * Math.SQRT2, 4, PI / 24],
  ['M11 1/√(9−4x²) en [0,1]', function (x) { return 1 / Math.sqrt(9 - 4 * x * x); }, 0, 1, Math.asin(2 / 3) / 2],
  ['M11 1/(x²−2x+5) en [1,3] = π/8', function (x) { return 1 / (x * x - 2 * x + 5); }, 1, 3, PI / 8],
  // Módulo 12 · hiperbólicas inversas
  ['M12 1/√(x²+9) en [0,4] = ln 3', function (x) { return 1 / Math.sqrt(x * x + 9); }, 0, 4, Math.log(3)],
  ['M12 1/√(x²−25) en [10,13]', function (x) { return 1 / Math.sqrt(x * x - 25); }, 10, 13, Math.log(5 / (2 + Math.sqrt(3)))],
  ['M12 1/(4−x²) en [−1,1] = ½ ln 3', function (x) { return 1 / (4 - x * x); }, -1, 1, Math.log(3) / 2],
  ['M12 1/(1−x²) en [3,5] (coth⁻¹)', function (x) { return 1 / (1 - x * x); }, 3, 5, Math.log(0.75) / 2],
  ['M12 1/√(x²+4x+13) en [0,2]', function (x) { return 1 / Math.sqrt(x * x + 4 * x + 13); }, 0, 2, Math.log(9 / (2 + Math.sqrt(13)))],
  ['M12 1/√(x²+1) en [0,2]', function (x) { return 1 / Math.sqrt(x * x + 1); }, 0, 2, Math.log(2 + Math.sqrt(5))],
  // Módulo 13 · trinomio cuadrático
  ['M13 1/(x²+4x+13) en [−2,1]', function (x) { return 1 / (x * x + 4 * x + 13); }, -2, 1, Math.atan(1) / 3],
  ['M13 (3x+2)/(x²+2x+5) en [0,2]', function (x) { return (3 * x + 2) / (x * x + 2 * x + 5); }, 0, 2, 1.5 * Math.log(13 / 5) - 0.5 * (Math.atan(1.5) - Math.atan(0.5))],
  ['M13 1/(2x²+3x−2) en [1,3] = ln 3 / 5', function (x) { return 1 / (2 * x * x + 3 * x - 2); }, 1, 3, Math.log(3) / 5],
  ['M13 1/(4x²−12x+9) en [2;3,5]', function (x) { return 1 / (4 * x * x - 12 * x + 9); }, 2, 3.5, 0.375],
  ['M13 1/√(x²+6x+13) en [−4;−1,5]', function (x) { return 1 / Math.sqrt(x * x + 6 * x + 13); }, -4, -1.5, Math.asinh(0.75) - Math.asinh(-0.5)],
  ['M13 (2x+5)/√(3−2x−x²) en [−2,0] = π', function (x) { return (2 * x + 5) / Math.sqrt(3 - 2 * x - x * x); }, -2, 0, PI],
  // Módulo 14 · integración por partes
  ['M14 x²e^{3x} en [0,1]', function (x) { return x * x * Math.exp(3 * x); }, 0, 1, (5 * Math.exp(3) - 2) / 27],
  ['M14 x²cos 2x en [0,π/2]', function (x) { return x * x * Math.cos(2 * x); }, 0, PI / 2, -PI / 4],
  ['M14 x²ln x en [1,e]', function (x) { return x * x * Math.log(x); }, 1, E, (2 * Math.exp(3) + 1) / 9],
  ['M14 e^{2x}sen 3x en [0,π]', function (x) { return Math.exp(2 * x) * Math.sin(3 * x); }, 0, PI, 3 * (Math.exp(2 * PI) + 1) / 13],
  ['M14 arctan x en [0,1]', function (x) { return Math.atan(x); }, 0, 1, PI / 4 - Math.log(2) / 2]
];

EJEMPLOS.forEach(function (e) {
  prueba(e[0], function () {
    var tol = 1e-8 * Math.max(1, Math.abs(e[4]));
    cerca(N.simpson(e[1], e[2], e[3], 2000), e[4], tol);
  });
});

/* -------------------------------------------------------------------- */
grupo('Sólidos de revolución (módulo 15)');

prueba('Discos: cono de radio 2 y altura 4 (y = x/2 en [0, 4]) → V = 16π/3', function () {
  cerca(N.diskVolume(function (x) { return x / 2; }, 0, 4), 16 * Math.PI / 3, 1e-9);
});

prueba('Discos: esfera de radio 3 (y = √(9 − x²)) → V = 36π', function () {
  cerca(N.diskVolume(function (x) { return Math.sqrt(Math.max(0, 9 - x * x)); }, -3, 3), 36 * Math.PI, 1e-9);
});

prueba('Discos alrededor de y = 1: y = x² en [0, 1] → V = 8π/15', function () {
  cerca(N.diskVolume(function (x) { return x * x; }, 0, 1, 1), 8 * Math.PI / 15, 1e-9);
});

prueba('Arandelas: región entre y = x y y = x² sobre el eje x → V = 2π/15', function () {
  cerca(N.washerVolume(function (x) { return x; }, function (x) { return x * x; }, 0, 1), 2 * Math.PI / 15, 1e-9);
});

prueba('Cascarones: misma región alrededor del eje y → V = π/6', function () {
  cerca(N.shellVolume(function (x) { return x - x * x; }, 0, 1), Math.PI / 6, 1e-9);
});

prueba('Cascarones alrededor de x = 2: y = x² en [0, 1] → V = 5π/6', function () {
  cerca(N.shellVolume(function (x) { return x * x; }, 0, 1, 2), 5 * Math.PI / 6, 1e-9);
});

prueba('Discos y cascarones coinciden: y = √x en [0, 4] girada sobre el eje x', function () {
  // Discos en x: π∫_0^4 x dx = 8π. Cascarones en y: 2π∫_0^2 y(4 − y²) dy = 8π.
  cerca(N.diskVolume(Math.sqrt, 0, 4), 8 * Math.PI, 1e-6);
  cerca(N.shellVolume(function (y) { return 4 - y * y; }, 0, 2), 8 * Math.PI, 1e-9);
});

prueba('shellVolume rechaza un eje dentro de (a, b)', function () {
  assert.throws(function () { N.shellVolume(function () { return 1; }, 0, 2, 1); }, RangeError);
});

prueba('M15 ejemplos resueltos (discos, arandelas, cascarones, ejes desplazados)', function () {
  var cuad = function (x) { return x * x; };
  var cero = function () { return 0; };
  cerca(N.diskVolume(function (x) { return Math.sqrt(x + 1); }, 0, 3), 15 * PI / 2, 1e-6, 'Ej1 discos');
  cerca(N.washerVolume(function (x) { return x + 2; }, cuad, -1, 2), 72 * PI / 5, 1e-6, 'Ej2 arandelas');
  cerca(N.shellVolume(function (x) { return 3 * x - x * x; }, 0, 3), 27 * PI / 2, 1e-6, 'Ej3 cascarones');
  cerca(N.washerVolume(cuad, cero, 0, 2, -1), 176 * PI / 15, 1e-6, 'Ej4 eje y = −1');
  cerca(N.shellVolume(cuad, 0, 2), 8 * PI, 1e-6, 'Ej5 cascarones');
  cerca(N.washerVolume(function () { return 2; }, Math.sqrt, 0, 4), 8 * PI, 1e-4, 'Ej5 arandelas');
  cerca(N.shellVolume(function (x) { return x - x * x; }, 0, 1, 2), PI / 2, 1e-6, 'Ej6 eje x = 2');
  cerca(N.diskVolume(function (x) { return x; }, 0, 3), 9 * PI, 1e-6, 'cono');
  cerca(N.diskVolume(function (x) { return Math.sqrt(1 - x * x); }, -1, 1), 4 * PI / 3, 1e-6, 'esfera');
  cerca(N.washerVolume(function (x) { return 2 + Math.sqrt(1 - x * x); }, function (x) { return 2 - Math.sqrt(1 - x * x); }, -1, 1), 4 * PI * PI, 1e-3, 'toro');
});

/* -------------------------------------------------------------------- */
console.log('\n' + pasadas + ' pruebas pasaron, ' + fallidas + ' fallaron.');
process.exitCode = fallidas === 0 ? 0 : 1;
