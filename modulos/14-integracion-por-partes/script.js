/**
 * Módulo 14 · Integración por partes
 *
 * 1. Modelos de integrales por partes: x^n e^{kx}, x^n sen kx, x^n cos kx
 *    (partes repetidas y método tabular), e^{ax} sen bx y e^{ax} cos bx
 *    (integrales cíclicas), x^n ln x y x^n arctan x. Cada modelo entrega el
 *    integrando f, la antiderivada F, la elección LIATE y los pasos en KaTeX.
 * 2. Visualizador: muestra u, dv, du, v en cada paso, la tabla tabular, la
 *    gráfica (con el área si es definida) y la verificación numérica
 *    (F' contra f y Simpson contra F(β) - F(α)).
 * 3. Gráficas de los ejemplos resueltos con comparación con Simpson.
 */
(function () {
  'use strict';

  var V = window.Visualizador;
  var G = window.Graficas;
  if (!V || !G) return;
  var tex = window.CI.tex;

  /** Permite desplazar horizontalmente las ecuaciones largas en pantallas angostas. */
  function desplazables(raiz) {
    Array.prototype.forEach.call((raiz || document).querySelectorAll('.katex-display'), function (el) {
      el.style.overflowX = 'auto';
      el.style.overflowY = 'hidden';
    });
  }
  window.setTimeout(function () { desplazables(document); }, 800);


  /* ================================================================== */
  /* Formato en LaTeX                                                    */
  /* ================================================================== */

  function racional(v) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    var signo = v < 0 ? -1 : 1;
    var x = Math.abs(v);
    for (var q = 1; q <= 720; q++) {
      var p = Math.round(x * q);
      if (Math.abs(x - p / q) <= 1e-9 * Math.max(1, x)) return { p: signo * p, q: q };
    }
    return null;
  }

  function tx(v) {
    if (Math.abs(v) < 1e-12) return '0';
    var r = racional(v);
    if (r) {
      if (r.q === 1) return String(r.p);
      return (r.p < 0 ? '-' : '') + '\\frac{' + Math.abs(r.p) + '}{' + r.q + '}';
    }
    return V.formatearTex(v, 5);
  }

  function coefNum(v) {
    return { val: v, tex: tx(v) };
  }

  /** Coeficiente · cuerpo omitiendo ±1 (el cuerpo no debe estar vacío). */
  function por(coef, cuerpo) {
    if (Math.abs(coef.val) < 1e-12) return '';
    if (Math.abs(coef.val - 1) < 1e-12) return cuerpo;
    if (Math.abs(coef.val + 1) < 1e-12) return '-' + cuerpo;
    return coef.tex + cuerpo;
  }

  /** Une fragmentos con su signo inicial como una suma. */
  function unir(partes) {
    var salida = '';
    partes.forEach(function (s) {
      if (!s) return;
      if (!salida) salida = s;
      else salida += s.charAt(0) === '-' ? ' - ' + s.slice(1) : ' + ' + s;
    });
    return salida || '0';
  }

  /** «kx» en LaTeX: x, -x, 3x, \frac{1}{2}x. */
  function kx(k) {
    if (Math.abs(k - 1) < 1e-12) return 'x';
    if (Math.abs(k + 1) < 1e-12) return '-x';
    return tx(k) + 'x';
  }

  /** Función exp, sin o cos evaluada en kx, en LaTeX. */
  function funTex(f, k) {
    if (f === 'exp') return 'e^{' + kx(k) + '}';
    var nombre = f === 'sin' ? '\\sin' : '\\cos';
    return Math.abs(k - 1) < 1e-12 ? nombre + ' x' : nombre + '\\left(' + kx(k) + '\\right)';
  }

  /** Potencia de x en LaTeX ('' si el exponente es 0). */
  function xpow(e) {
    if (Math.abs(e) < 1e-12) return '';
    if (Math.abs(e - 1) < 1e-12) return 'x';
    return 'x^{' + tx(e) + '}';
  }

  /** Término c·x^pot (con la constante si pot = 0). */
  function termino(c, pot) {
    if (Math.abs(c) < 1e-12) return '';
    if (Math.abs(pot) < 1e-12) return tx(c);
    return por(coefNum(c), xpow(pot));
  }

  var LETRAS = { L: 'logarítmica', I: 'inversa trigonométrica', A: 'algebraica', T: 'trigonométrica', E: 'exponencial' };

  /** Párrafo con la clasificación LIATE de dos factores. */
  function textoLiate(f1, l1, f2, l2, u, dv) {
    var orden = 'LIATE';
    var primera = orden.indexOf(l1) <= orden.indexOf(l2) ? l1 : l2;
    return '<p>Clasificación LIATE: $' + f1 + '$ es <strong>' + l1 + '</strong> (' + LETRAS[l1] + ') y $' + f2 + '$ es <strong>' + l2 + '</strong> (' + LETRAS[l2] + '). ' +
      'En el orden L → I → A → T → E la letra <strong>' + primera + '</strong> aparece antes, así que $u=' + u + '$ y $dv=' + dv + '\\,dx$.</p>';
  }

  /* ================================================================== */
  /* Familias polinomio × (exp, sen, cos): partes repetidas y tabular    */
  /* ================================================================== */

  /** m-ésima antiderivada de φ(kx): {fun, c} con φ ∈ {exp, sin, cos}. */
  function antiderivada(tipo, m, k) {
    if (m === 0) return { fun: tipo, c: 1 };
    var km = Math.pow(k, m);
    if (tipo === 'exp') return { fun: 'exp', c: 1 / km };
    var tabla = tipo === 'sin'
      ? { 1: ['cos', -1], 2: ['sin', -1], 3: ['cos', 1], 0: ['sin', 1] }
      : { 1: ['sin', 1], 2: ['cos', -1], 3: ['sin', -1], 0: ['cos', 1] };
    var par = tabla[m % 4];
    return { fun: par[0], c: par[1] / km };
  }

  /** Filas del método tabular j = 0..n: signo, derivada, potencia, coeficiente del término. */
  function filasTabular(tipo, n, k) {
    var filas = [];
    var cd = 1;
    for (var j = 0; j <= n; j++) {
      if (j > 0) cd *= (n - j + 1);
      var I = antiderivada(tipo, j + 1, k);
      var signo = j % 2 ? -1 : 1;
      filas.push({ j: j, signo: signo, cd: cd, pot: n - j, I: I, coef: signo * cd * I.c });
    }
    return filas;
  }

  function evaluarFun(f, z) {
    return f === 'exp' ? Math.exp(z) : (f === 'sin' ? Math.sin(z) : Math.cos(z));
  }

  /** Resultado agrupado: e^{kx}(…) o cos(kx)(…) + sin(kx)(…). */
  function resultadoPolinomio(filas, k) {
    var grupos = {};
    var orden = [];
    filas.forEach(function (r) {
      var f = r.I.fun;
      if (!grupos[f]) { grupos[f] = []; orden.push(f); }
      grupos[f].push({ c: r.coef, pot: r.pot });
    });
    return unir(orden.map(function (f) {
      var items = grupos[f];
      if (items.length === 1) return por(coefNum(items[0].c), xpow(items[0].pot) + funTex(f, k));
      return funTex(f, k) + '\\left(' + unir(items.map(function (it) { return termino(it.c, it.pot); })) + '\\right)';
    }));
  }

  /** Pasos de partes repetidas. */
  function pasosRepetidos(tipo, n, k) {
    var pasos = [];
    var fun = tipo;
    var coefS = 1;
    var acumulado = [];
    var original = '\\int ' + xpow(n) + funTex(tipo, k) + '\\,dx';
    for (var j = 0; j <= n; j++) {
      var m = n - j;
      var ci;
      var sig;
      if (fun === 'exp') { ci = 1 / k; sig = 'exp'; } else if (fun === 'sin') { ci = -1 / k; sig = 'cos'; } else { ci = 1 / k; sig = 'sin'; }
      var phi = funTex(fun, k);
      var Phi = por(coefNum(ci), funTex(sig, k));
      var frontera = por(coefNum(coefS * ci), xpow(m) + funTex(sig, k));
      acumulado.push(frontera);
      if (m > 0) {
        var coefNext = -coefS * m * ci;
        var du = m === 1 ? 'dx' : tx(m) + xpow(m - 1) + '\\,dx';
        var resto = por(coefNum(coefNext), '\\int ' + xpow(m - 1) + funTex(sig, k) + '\\,dx');
        pasos.push({
          titulo: 'Partes ' + (j + 1) + ' de ' + n + ': $u=' + xpow(m) + '$, $dv=' + phi + '\\,dx$',
          html: '$$\\begin{aligned}u&=' + xpow(m) + ' & dv&=' + phi + '\\,dx\\\\ du&=' + du + ' & v&=' + Phi + '\\end{aligned}$$' +
            '$$\\int ' + xpow(m) + phi + '\\,dx=' + xpow(m) + '\\cdot\\left(' + Phi + '\\right)-' + (m === 1 ? '' : tx(m)) +
            '\\int ' + xpow(m - 1) + '\\left(' + Phi + '\\right)dx$$' +
            '<p>Acumulado hasta aquí:</p>$$' + original + '=' + unir(acumulado.concat([resto])) + '$$'
        });
        fun = sig;
        coefS = coefNext;
      } else {
        pasos.push({
          titulo: 'Última integral: ya es directa',
          html: '$$' + por(coefNum(coefS), '\\int ' + phi + '\\,dx') + '=' + frontera + '$$' +
            '<p>Ahora no queda ninguna integral pendiente:</p>$$' + original + '=' + unir(acumulado) + '$$'
        });
      }
    }
    return pasos;
  }

  /** Tabla del método tabular (HTML con fórmulas). */
  function tablaTabular(tipo, n, k, filas) {
    var cuerpo = '';
    for (var j = 0; j <= n + 1; j++) {
      var I = antiderivada(tipo, j, k);
      var celdaI = '$' + por(coefNum(I.c), funTex(I.fun, k)) + '$';
      var celdaD;
      var celdaP;
      var signo;
      if (j <= n) {
        var r = filas[j];
        celdaD = '$' + termino(r.cd, r.pot) + '$';
        signo = r.signo > 0 ? '$+$' : '$-$';
        celdaP = '$' + por(coefNum(r.coef), xpow(r.pot) + funTex(r.I.fun, k)) + '$';
      } else {
        celdaD = '$0$';
        signo = '';
        celdaP = 'se detiene: la derivada es 0';
      }
      cuerpo += '<tr><td>' + j + '</td><td>' + signo + '</td><td>' + celdaD + '</td><td>' + celdaI + '</td><td>' + (j <= n ? celdaP : '<em>' + celdaP + '</em>') + '</td></tr>';
    }
    return '<table class="tabla-formulas"><caption>Cada producto es (signo) × (derivada de la fila $j$) × (integral de la fila $j+1$). El resultado es la suma de los productos.</caption>' +
      '<thead><tr><th scope="col">$j$</th><th scope="col">Signo</th><th scope="col">Derivadas de $u=' + xpow(n) + '$</th><th scope="col">Integrales de $dv=' + funTex(tipo, k) + '\\,dx$</th><th scope="col">Producto diagonal</th></tr></thead><tbody>' +
      cuerpo + '</tbody></table>';
  }

  function modeloPolinomio(tipo, n, k) {
    var filas = filasTabular(tipo, n, k);
    var F = function (x) {
      var s = 0;
      for (var i = 0; i < filas.length; i++) {
        s += filas[i].coef * Math.pow(x, filas[i].pot) * evaluarFun(filas[i].I.fun, k * x);
      }
      return s;
    };
    var f = function (x) { return Math.pow(x, n) * evaluarFun(tipo, k * x); };
    var segundo = tipo === 'exp' ? 'E' : 'T';
    var segundoTex = funTex(tipo, k);
    var pasos = [{
      titulo: 'Elegir $u$ y $dv$ con LIATE',
      html: textoLiate(xpow(n), 'A', segundoTex, segundo, xpow(n), segundoTex)
    }].concat(pasosRepetidos(tipo, n, k));
    var resultado = resultadoPolinomio(filas, k);
    var w = tipo === 'exp' ? (Math.abs(k) > 1 ? 3 / Math.abs(k) + 1 : 3) : Math.max(3, 2 * Math.PI / Math.abs(k));
    return {
      f: f, F: F, integrandoTex: xpow(n) + funTex(tipo, k), resultadoTex: resultado, pasos: pasos,
      tabla: tablaTabular(tipo, n, k, filas), vista: [-w, w], dominioPositivo: false,
      lo: 0, hi: 1, u: xpow(n), dv: funTex(tipo, k) + '\\,dx', claseLiate: 'A' + segundo
    };
  }

  /* ================================================================== */
  /* Integrales cíclicas e^{ax} sen bx y e^{ax} cos bx                   */
  /* ================================================================== */

  function modeloCiclica(tipo, a, b) {
    var E = 'e^{' + kx(a) + '}';
    var S = funTex('sin', b);
    var C = funTex('cos', b);
    var ca = 1 / a;
    var cb = b / a;
    var den = a * a + b * b;
    var esSin = tipo === 'sin';
    var X = esSin ? S : C;
    var Y = esSin ? C : S;
    var nomX = esSin ? 'I' : 'J';
    var nomY = esSin ? 'J' : 'I';
    var s1 = esSin ? -1 : 1; // signo de cb en la primera aplicación
    var integralX = '\\int ' + E + X + '\\,dx';
    var integralY = '\\int ' + E + Y + '\\,dx';
    var uX = X;
    var duX = esSin ? por(coefNum(b), C + '\\,dx') : por(coefNum(-b), S + '\\,dx');
    var uY = Y;
    var duY = esSin ? por(coefNum(-b), S + '\\,dx') : por(coefNum(b), C + '\\,dx');
    var v = por(coefNum(ca), E);
    var primera = unir([por(coefNum(ca), E + X), por(coefNum(s1 * cb), nomY)]);
    var segunda = unir([por(coefNum(ca), E + Y), por(coefNum(-s1 * cb), nomX)]);
    var sustituida = unir([por(coefNum(ca), E + X), por(coefNum(s1 * cb * ca), E + Y), por(coefNum(-cb * cb), nomX)]);
    var lado = unir([por(coefNum(ca), E + X), por(coefNum(s1 * cb * ca), E + Y)]);
    var cX = a / den;
    var cY = s1 * b / den;
    var combo = unir([por(coefNum(a), X), por(coefNum(s1 * b), Y)]);
    var enteros = [a, b, den].every(function (v) { return Math.abs(v - Math.round(v)) < 1e-12; });
    var resultado = enteros
      ? '\\frac{' + E + '\\left(' + combo + '\\right)}{' + tx(den) + '}'
      : unir([por(coefNum(cX), E + X), por(coefNum(cY), E + Y)]);
    var pasos = [
      {
        titulo: 'Elegir $u$ y $dv$ con LIATE',
        html: textoLiate(X, 'T', E, 'E', X, E) + '<p>Se escribe $' + nomX + '=' + integralX + '$ y $' + nomY + '=' + integralY + '$. Se mantiene este mismo criterio en las dos aplicaciones.</p>'
      },
      {
        titulo: 'Primera aplicación: $u=' + uX + '$, $dv=' + E + '\\,dx$',
        html: '$$\\begin{aligned}u&=' + uX + ' & dv&=' + E + '\\,dx\\\\ du&=' + duX + ' & v&=' + v + '\\end{aligned}$$' +
          '$$' + nomX + '=' + primera + '$$'
      },
      {
        titulo: 'Segunda aplicación, con el mismo criterio: $u=' + uY + '$, $dv=' + E + '\\,dx$',
        html: '$$\\begin{aligned}u&=' + uY + ' & dv&=' + E + '\\,dx\\\\ du&=' + duY + ' & v&=' + v + '\\end{aligned}$$' +
          '$$' + nomY + '=' + segunda + '$$'
      },
      {
        titulo: 'Sustituir: reaparece $' + nomX + '$',
        html: '$$' + nomX + '=' + sustituida + '$$'
      },
      {
        titulo: 'Despejar $' + nomX + '$',
        html: '$$' + por(coefNum(1 + cb * cb), nomX) + '=' + lado + '$$' +
          '$$' + nomX + '=' + unir([por(coefNum(cX), E + X), por(coefNum(cY), E + Y)]) + (enteros ? '=' + resultado : '') + '$$'
      }
    ];
    var f = function (x) { return Math.exp(a * x) * (esSin ? Math.sin(b * x) : Math.cos(b * x)); };
    var F = function (x) {
      var e = Math.exp(a * x);
      return esSin ? e * (a * Math.sin(b * x) - b * Math.cos(b * x)) / den : e * (a * Math.cos(b * x) + b * Math.sin(b * x)) / den;
    };
    var w = Math.min(2 * Math.PI / Math.abs(b), 6 / Math.abs(a));
    return {
      f: f, F: F, integrandoTex: E + X, resultadoTex: resultado, pasos: pasos, tabla: null,
      vista: [-w, w], dominioPositivo: false, lo: 0, hi: 1, u: X, dv: E + '\\,dx', claseLiate: 'TE'
    };
  }

  /* ================================================================== */
  /* x^n ln x                                                            */
  /* ================================================================== */

  function modeloLogaritmo(n) {
    var p = n + 1;
    var potP = xpow(p);
    var segundoTex = xpow(n) || '1';
    var cA = 1 / p;
    var resultado = unir([por(coefNum(cA), potP + '\\ln x'), por(coefNum(-1 / (p * p)), potP)]);
    var pasos = [
      { titulo: 'Elegir $u$ y $dv$ con LIATE', html: textoLiate('\\ln x', 'L', segundoTex, 'A', '\\ln x', segundoTex) },
      {
        titulo: 'Calcular $du$ y $v$',
        html: '$$\\begin{aligned}u&=\\ln x & dv&=' + (xpow(n) || '') + '\\,dx\\\\ du&=\\frac{dx}{x} & v&=' + por(coefNum(cA), potP) + '\\end{aligned}$$'
      },
      {
        titulo: 'Aplicar $\\int u\\,dv=uv-\\int v\\,du$',
        html: '$$\\int ' + xpow(n) + '\\ln x\\,dx=' + por(coefNum(cA), potP + '\\ln x') + '-\\int ' + por(coefNum(cA), potP) + '\\cdot\\frac{1}{x}\\,dx=' +
          por(coefNum(cA), potP + '\\ln x') + '-' + (Math.abs(cA - 1) < 1e-12 ? '' : tx(cA)) + '\\int ' + (xpow(n) || '1') + '\\,dx$$'
      },
      {
        titulo: 'Integrar la potencia que queda',
        html: '$$' + (Math.abs(cA - 1) < 1e-12 ? '' : tx(cA)) + '\\int ' + (xpow(n) || '1') + '\\,dx=' + por(coefNum(cA * cA), potP) + '$$'
      }
    ];
    var f = function (x) { return x > 0 ? Math.pow(x, n) * Math.log(x) : NaN; };
    var F = function (x) { return x > 0 ? Math.pow(x, p) * Math.log(x) / p - Math.pow(x, p) / (p * p) : NaN; };
    return {
      f: f, F: F, integrandoTex: xpow(n) + '\\ln x', resultadoTex: resultado, pasos: pasos, tabla: null,
      vista: [n < 0 ? 0.3 : 0.05, 5], dominioPositivo: true, lo: 1, hi: 3, u: '\\ln x', dv: segundoTex + '\\,dx', claseLiate: 'LA'
    };
  }

  /* ================================================================== */
  /* x^n arctan x (n = 0, 1, 2)                                          */
  /* ================================================================== */

  function modeloArcotangente(n) {
    var segundoTex = xpow(n) || '1';
    var p = n + 1;
    var pasos = [
      { titulo: 'Elegir $u$ y $dv$ con LIATE', html: textoLiate('\\arctan x', 'I', segundoTex, 'A', '\\arctan x', segundoTex) },
      {
        titulo: 'Calcular $du$ y $v$',
        html: '$$\\begin{aligned}u&=\\arctan x & dv&=' + (xpow(n) || '') + '\\,dx\\\\ du&=\\frac{dx}{1+x^2} & v&=' + por(coefNum(1 / p), xpow(p)) + '\\end{aligned}$$'
      }
    ];
    var resultado;
    var f = function (x) { return Math.pow(x, n) * Math.atan(x); };
    var F;
    if (n === 0) {
      pasos.push({ titulo: 'Aplicar la fórmula', html: '$$\\int\\arctan x\\,dx=x\\arctan x-\\int\\frac{x}{1+x^2}\\,dx$$' });
      pasos.push({ titulo: 'Sustitución $w=1+x^2$', html: '$$\\int\\frac{x}{1+x^2}\\,dx=\\frac12\\ln\\left(1+x^2\\right)$$' });
      resultado = 'x\\arctan x-\\frac{1}{2}\\ln\\left(1+x^2\\right)';
      F = function (x) { return x * Math.atan(x) - Math.log(1 + x * x) / 2; };
    } else if (n === 1) {
      pasos.push({ titulo: 'Aplicar la fórmula', html: '$$\\int x\\arctan x\\,dx=\\frac{x^2}{2}\\arctan x-\\frac12\\int\\frac{x^2}{1+x^2}\\,dx$$' });
      pasos.push({ titulo: 'Dividir: $\\frac{x^2}{1+x^2}=1-\\frac{1}{1+x^2}$', html: '$$\\frac12\\int\\left(1-\\frac{1}{1+x^2}\\right)dx=\\frac{x}{2}-\\frac12\\arctan x$$' });
      resultado = '\\frac{x^2+1}{2}\\arctan x-\\frac{x}{2}';
      F = function (x) { return (x * x + 1) / 2 * Math.atan(x) - x / 2; };
    } else {
      pasos.push({ titulo: 'Aplicar la fórmula', html: '$$\\int x^2\\arctan x\\,dx=\\frac{x^3}{3}\\arctan x-\\frac13\\int\\frac{x^3}{1+x^2}\\,dx$$' });
      pasos.push({
        titulo: 'Dividir: $\\frac{x^3}{1+x^2}=x-\\frac{x}{1+x^2}$',
        html: '$$\\frac13\\int\\left(x-\\frac{x}{1+x^2}\\right)dx=\\frac{x^2}{6}-\\frac16\\ln\\left(1+x^2\\right)$$'
      });
      resultado = '\\frac{x^3}{3}\\arctan x-\\frac{x^2}{6}+\\frac{1}{6}\\ln\\left(1+x^2\\right)';
      F = function (x) { return x * x * x / 3 * Math.atan(x) - x * x / 6 + Math.log(1 + x * x) / 6; };
    }
    return {
      f: f, F: F, integrandoTex: xpow(n) + '\\arctan x', resultadoTex: resultado, pasos: pasos, tabla: null,
      vista: [-4, 4], dominioPositivo: false, lo: 0, hi: 2, u: '\\arctan x', dv: segundoTex + '\\,dx', claseLiate: 'IA'
    };
  }

  /* ================================================================== */
  /* Modelo general y verificación                                       */
  /* ================================================================== */

  var FAMILIAS = {
    exp: { nombre: 'x^n e^{kx}', usaN: true, usaK: true, usaB: false },
    sin: { nombre: 'x^n sen kx', usaN: true, usaK: true, usaB: false },
    cos: { nombre: 'x^n cos kx', usaN: true, usaK: true, usaB: false },
    cicsin: { nombre: 'e^{ax} sen bx', usaN: false, usaK: true, usaB: true },
    ciccos: { nombre: 'e^{ax} cos bx', usaN: false, usaK: true, usaB: true },
    log: { nombre: 'x^n ln x', usaN: true, usaK: false, usaB: false },
    atan: { nombre: 'x^n arctan x', usaN: true, usaK: false, usaB: false }
  };

  /** Construye el modelo o devuelve {error}. */
  function construirModelo(fam, n, k, b) {
    if (fam === 'exp' || fam === 'sin' || fam === 'cos') {
      if (!Number.isInteger(n) || n < 1 || n > 6) return { campo: 'n', error: 'Para $x^n$ con exponencial, seno o coseno, $n$ debe ser un entero entre 1 y 6 (con $n=0$ no hace falta integrar por partes).' };
      if (k === 0) return { campo: 'k', error: '$k$ debe ser distinto de cero: con $k=0$ el factor es constante y no hay nada que integrar por partes.' };
      return modeloPolinomio(fam, n, k);
    }
    if (fam === 'cicsin' || fam === 'ciccos') {
      if (k === 0 || b === 0) return { campo: k === 0 ? 'k' : 'b', error: 'En una integral cíclica $a$ y $b$ deben ser distintos de cero (con $a=0$ o $b=0$ la integral es directa).' };
      if (b < 0) return { campo: 'b', error: 'Usa $b&gt;0$: como $\\sin(-bx)=-\\sin bx$ y $\\cos(-bx)=\\cos bx$, el caso negativo se reduce al positivo.' };
      return modeloCiclica(fam === 'cicsin' ? 'sin' : 'cos', k, b);
    }
    if (fam === 'log') {
      if (Math.abs(n + 1) < 1e-12) return { campo: 'n', error: 'Con $n=-1$ la fórmula de $x^n\\ln x$ no aplica (divide entre $n+1=0$). Esa integral es $\\int\\frac{\\ln x}{x}dx=\\frac{(\\ln x)^2}{2}+C$ y se resuelve por sustitución $w=\\ln x$.' };
      if (Math.abs(n) > 10) return { campo: 'n', error: 'Usa un exponente $n$ con $|n|\\le10$.' };
      return modeloLogaritmo(n);
    }
    if (!Number.isInteger(n) || n < 0 || n > 2) return { campo: 'n', error: 'Para $x^n\\arctan x$ este visualizador admite $n=0$, $1$ o $2$.' };
    return modeloArcotangente(n);
  }

  /** Compara F' con f y F(β)-F(α) con Simpson. */
  function verificar(M, lo, hi) {
    var x0 = M.vista[0];
    var x1 = M.vista[1];
    var comparados = 0;
    var maxima = 0;
    for (var i = 0; i < 121; i++) {
      var x = x0 + (x1 - x0) * (i + 0.37) / 121;
      var fx = M.f(x);
      if (!isFinite(fx)) continue;
      var e = 1e-5 * Math.max(1, Math.abs(x));
      var Fa = M.F(x + e);
      var Fb = M.F(x - e);
      if (!isFinite(Fa) || !isFinite(Fb)) continue;
      var dif = Math.abs((Fa - Fb) / (2 * e) - fx) / Math.max(1, Math.abs(fx));
      comparados++;
      if (dif > maxima) maxima = dif;
    }
    var simpson = NaN;
    var exacto = NaN;
    try {
      simpson = window.Numerics.simpson(M.f, lo, hi, 2000);
      exacto = M.F(hi) - M.F(lo);
    } catch (err) { /* intervalo no válido */ }
    var dif2 = Math.abs(simpson - exacto);
    var tol = 1e-7 * Math.max(1, Math.abs(exacto));
    return {
      comparados: comparados, maxima: maxima, simpson: simpson, exacto: exacto, difSimpson: dif2,
      correcta: comparados >= 10 && maxima < 1e-5 && isFinite(dif2) && dif2 <= tol
    };
  }

  /* ================================================================== */
  /* Gráficas                                                            */
  /* ================================================================== */

  /**
   * Dibuja f, F y (opcional) el área entre lo y hi.
   * @param {HTMLElement} div
   * @param {Object} M modelo (f, F, vista, dominioPositivo)
   * @param {{definida: boolean, lo: number, hi: number, vista?: number[]}} o
   */
  function dibujar(div, M, o) {
    var col = G.colores();
    var v = (o.vista || M.vista).slice();
    if (o.definida) {
      var margen = 0.15 * (o.hi - o.lo);
      v[0] = Math.min(v[0], o.lo - margen);
      v[1] = Math.max(v[1], o.hi + margen);
    }
    if (M.dominioPositivo) v[0] = Math.max(v[0], 0.02);
    var cf = G.muestrear(M.f, v[0], v[1], 600);
    var cF = G.muestrear(M.F, v[0], v[1], 600);
    var trazas = [];
    if (o.definida) {
      var xs = [o.lo];
      var ys = [0];
      var n = 300;
      for (var i = 0; i <= n; i++) {
        var x = o.lo + (o.hi - o.lo) * i / n;
        var y = M.f(x);
        if (isFinite(y)) { xs.push(x); ys.push(y); }
      }
      xs.push(o.hi);
      ys.push(0);
      trazas.push(G.trazaPoligonos([{ x: xs, y: ys }], { color: col.serie[0], nombre: 'Área de α a β', opacidad: 0.28, grosor: 0.5 }));
    }
    trazas.push({
      x: cF.x, y: cF.y, type: 'scatter', mode: 'lines', name: 'F(x), C = 0',
      line: { color: col.serie[1], width: 2.2, dash: 'dot' }, hovertemplate: 'x = %{x:.3f}<br>F(x) = %{y:.4f}<extra></extra>'
    });
    trazas.push({
      x: cf.x, y: cf.y, type: 'scatter', mode: 'lines', name: 'f(x)',
      line: { color: col.serie[0], width: 2.8 }, hovertemplate: 'x = %{x:.3f}<br>f(x) = %{y:.4f}<extra></extra>'
    });
    G.dibujar(div, trazas, G.layoutBase({
      xaxis: { range: v, title: { text: 'x' } },
      yaxis: { range: G.rangoY([cf.y, cF.y], { recorte: 0.03, incluir: [0] }) },
      hovermode: 'x'
    }));
  }

  /* ================================================================== */
  /* 1. Gráficas de los ejemplos (funciones con math.js)                 */
  /* ================================================================== */

  Array.prototype.forEach.call(document.querySelectorAll('[data-parte]'), function (bloque) {
    var d;
    try { d = JSON.parse(bloque.getAttribute('data-parte')); } catch (e) { return; }
    var div = bloque.querySelector('[data-grafica]');
    var lcd = bloque.querySelector('[data-lcd]');
    var cf = V.compilarFuncion(d.f);
    var cF = V.compilarFuncion(d.F);
    if (!cf.ok || !cF.ok || !div) {
      if (div) div.innerHTML = '<p class="campo__ayuda">No se pudo preparar la gráfica (¿se cargó math.js?).</p>';
      return;
    }
    var M = { f: cf.f, F: cF.f, vista: d.vista, dominioPositivo: d.vista[0] <= 0.1 && d.vista[0] > 0 };
    var simpson = NaN;
    var exacto = NaN;
    try {
      simpson = window.Numerics.simpson(cf.f, d.a, d.b, 2000);
      exacto = cF.f(d.b) - cF.f(d.a);
    } catch (e) { /* se muestra sin comparación */ }
    if (lcd) {
      lcd.innerHTML = V.lectura(tex('F(\\beta)-F(\\alpha)'), V.formatear(exacto, 9), true) +
        V.lectura('Simpson, $n=2000$', V.formatear(simpson, 9)) +
        V.lectura('Diferencia', V.formatear(Math.abs(simpson - exacto), 3));
      window.CI.renderizarMatematicas(lcd);
    }
    function pintar() { dibujar(div, M, { definida: true, lo: d.a, hi: d.b }); }
    window.CI.alCambiarTema(pintar);
    pintar();
  });

  /* ================================================================== */
  /* 2. Visualizador                                                     */
  /* ================================================================== */

  var form = document.getElementById('vis-partes');
  if (!form) return;

  var ui = {
    fam: document.getElementById('par-fam'),
    n: document.getElementById('par-n'),
    k: document.getElementById('par-k'),
    b: document.getElementById('par-b'),
    etqK: document.getElementById('etq-k'),
    campoN: document.getElementById('campo-n'),
    campoK: document.getElementById('campo-k'),
    campoB: document.getElementById('campo-b'),
    def: document.getElementById('par-def'),
    lo: document.getElementById('par-lo'),
    hi: document.getElementById('par-hi'),
    campoLim: document.getElementById('campo-lim'),
    chips: document.getElementById('chips-partes'),
    mensaje: document.getElementById('mensaje-partes'),
    grafica: document.getElementById('grafica-partes'),
    lcd: document.getElementById('lcd-partes'),
    hoja: document.getElementById('hoja-partes'),
    titulo: document.getElementById('titulo-partes'),
    pasos: document.getElementById('pasos-partes'),
    tabular: document.getElementById('tabular-partes'),
    tabla: document.getElementById('tabla-partes')
  };
  var entradas = [ui.n, ui.k, ui.b, ui.lo, ui.hi];

  var PARES = [
    { fam: 'exp', n: 2, k: 3, tex: 'x^{2}e^{3x}' },
    { fam: 'exp', n: 3, k: -1, tex: 'x^{3}e^{-x}' },
    { fam: 'sin', n: 1, k: 1, tex: 'x\\sin x' },
    { fam: 'sin', n: 3, k: 2, tex: 'x^{3}\\sin 2x' },
    { fam: 'cos', n: 2, k: 2, tex: 'x^{2}\\cos 2x' },
    { fam: 'cicsin', n: 1, k: 2, b: 3, tex: 'e^{2x}\\sin 3x' },
    { fam: 'ciccos', n: 1, k: 1, b: 2, tex: 'e^{x}\\cos 2x' },
    { fam: 'log', n: 2, k: 1, tex: 'x^{2}\\ln x' },
    { fam: 'log', n: 0, k: 1, tex: '\\ln x' },
    { fam: 'atan', n: 1, k: 1, tex: 'x\\arctan x' }
  ];
  var pendiente = false;

  ui.chips.innerHTML = PARES.map(function (p, i) {
    return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false">' + tex(p.tex) + '</button>';
  }).join('');

  function ajustarCampos() {
    var F = FAMILIAS[ui.fam.value];
    ui.campoN.hidden = !F.usaN;
    ui.campoK.hidden = !F.usaK;
    ui.campoB.hidden = !F.usaB;
    var ciclica = ui.fam.value === 'cicsin' || ui.fam.value === 'ciccos';
    ui.etqK.innerHTML = ciclica ? '$a=$' : '$k=$';
    window.CI.renderizarMatematicas(ui.etqK);
    ui.campoLim.hidden = !ui.def.checked;
  }

  function limitesPorDefecto(fam) {
    if (fam === 'log') return ['1', '3'];
    if (fam === 'atan') return ['0', '2'];
    return ['0', '1'];
  }

  function marcarInvalido(control) {
    entradas.forEach(function (e) { e.setAttribute('aria-invalid', e === control ? 'true' : 'false'); });
  }

  function marcarChip() {
    var fam = ui.fam.value;
    Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
      var P = PARES[Number(chip.getAttribute('data-indice'))];
      var F = FAMILIAS[fam];
      var igual = P.fam === fam && (!F.usaN || P.n === Number(ui.n.value)) && (!F.usaK || P.k === Number(ui.k.value)) && (!F.usaB || P.b === Number(ui.b.value));
      chip.setAttribute('aria-pressed', igual ? 'true' : 'false');
    });
  }

  function fallar(control, tipo, html) {
    marcarInvalido(control);
    V.mostrarMensaje(ui.mensaje, tipo || 'error', html);
    ui.lcd.innerHTML = '';
    ui.hoja.hidden = true;
    ui.tabular.hidden = true;
    ui.grafica.style.opacity = '0.35';
  }

  function leer(control, nombre) {
    var r = V.leerNumero(control.value, nombre);
    if (!r.ok) return { error: r.error, control: control };
    if (Math.abs(r.valor) > 1e4) return { error: 'El valor de $' + nombre + '$ es demasiado grande (usa $|' + nombre + '|\\le10^4$).', control: control };
    return { valor: r.valor };
  }

  function actualizar() {
    try {
      var fam = ui.fam.value;
      var F = FAMILIAS[fam];
      var ciclica = fam === 'cicsin' || fam === 'ciccos';
      var n = 0;
      var k = 1;
      var b = 1;
      var l;
      if (F.usaN) {
        l = leer(ui.n, 'n');
        if (l.error) return fallar(l.control, 'error', l.error);
        n = l.valor;
      }
      if (F.usaK) {
        l = leer(ui.k, ciclica ? 'a' : 'k');
        if (l.error) return fallar(l.control, 'error', l.error);
        k = l.valor;
      }
      if (F.usaB) {
        l = leer(ui.b, 'b');
        if (l.error) return fallar(l.control, 'error', l.error);
        b = l.valor;
      }
      var M = construirModelo(fam, n, k, b);
      if (M.error) {
        var culpable = ui[M.campo] || ui.n;
        return fallar(culpable, 'adv', M.error);
      }

      // Límites (integral definida) o intervalo de comprobación por defecto
      var definida = ui.def.checked;
      var lo = M.lo;
      var hi = M.hi;
      if (definida) {
        var a1 = leer(ui.lo, '\\alpha');
        if (a1.error) return fallar(a1.control, 'error', a1.error);
        var b1 = leer(ui.hi, '\\beta');
        if (b1.error) return fallar(b1.control, 'error', b1.error);
        lo = a1.valor;
        hi = b1.valor;
        if (!(lo < hi)) return fallar(ui.hi, 'error', 'Debe cumplirse $\\alpha&lt;\\beta$.');
        if (M.dominioPositivo && lo <= 0) return fallar(ui.lo, 'error', 'Con $\\ln x$ el límite inferior debe ser positivo ($\\alpha&gt;0$).');
      }
      marcarInvalido(null);

      // Pasos
      ui.titulo.innerHTML = '$\\displaystyle\\int ' +  M.integrandoTex + '\\,dx$' + (definida ? ' &nbsp;y&nbsp; $\\displaystyle\\int_{' + V.formatearTex(lo, 4) + '}^{' + V.formatearTex(hi, 4) + '}' + M.integrandoTex + '\\,dx$' : '');
      var pasos = M.pasos.slice();
      pasos.push({
        titulo: 'Resultado',
        html: '<p><span class="resultado-final">$\\displaystyle\\int ' + M.integrandoTex + '\\,dx=' + M.resultadoTex + '+C$</span></p>'
      });
      ui.pasos.innerHTML = pasos.map(function (p) {
        return '<li class="paso"><span class="paso__titulo">' + p.titulo + '</span>' + p.html + '</li>';
      }).join('');
      ui.hoja.hidden = false;
      window.CI.renderizarMatematicas(ui.hoja);
      desplazables(ui.hoja);

      if (M.tabla) {
        ui.tabla.innerHTML = M.tabla;
        ui.tabular.hidden = false;
        window.CI.renderizarMatematicas(ui.tabla);
        desplazables(ui.tabla);
      } else {
        ui.tabular.hidden = true;
      }

      // Verificación
      var ver = verificar(M, lo, hi);
      var intervalo = '[' + V.formatearTex(lo, 4) + ',\\,' + V.formatearTex(hi, 4) + ']';
      if (ver.comparados < 10) {
        V.mostrarMensaje(ui.mensaje, 'adv', 'Hay muy pocos puntos de la ventana para comparar $F\'$ con $f$.');
      } else if (!isFinite(ver.simpson)) {
        V.mostrarMensaje(ui.mensaje, 'adv', 'La regla de Simpson no pudo evaluar el integrando en $' + intervalo + '$. Revisa los límites.');
      } else if (ver.correcta) {
        V.mostrarMensaje(ui.mensaje, 'exito', '¡Verificado! $F\'(x)=f(x)$ en ' + ver.comparados + ' puntos' +
          (definida ? ' y $\\int_\\alpha^\\beta f\\,dx=F(\\beta)-F(\\alpha)=' + V.formatearTex(ver.exacto, 8) + '$ coincide con Simpson.' : ' y $F(\\beta)-F(\\alpha)$ coincide con la regla de Simpson en $' + intervalo + '$.'));
      } else {
        V.mostrarMensaje(ui.mensaje, 'error', 'La verificación numérica no coincide (error máximo $' + V.formatearTex(ver.maxima, 3) + '$). Revisa los datos.');
      }

      ui.lcd.innerHTML =
        V.lectura('Elección LIATE', '$u=' + M.u + '$', true) +
        V.lectura('Factor ' + tex('dv'), '$dv=' + M.dv + '$') +
        V.lectura(tex('F(\\beta)-F(\\alpha)') + (definida ? '' : ' (prueba)'), V.formatear(ver.exacto, 9), definida) +
        V.lectura('Simpson, $n=2000$ en ' + tex(intervalo), V.formatear(ver.simpson, 9)) +
        V.lectura('Diferencia', V.formatear(ver.difSimpson, 3)) +
        V.lectura('Máx. ' + tex('|F\'-f|'), V.formatear(ver.maxima, 3));
      window.CI.renderizarMatematicas(ui.lcd);

      dibujar(ui.grafica, M, { definida: definida, lo: lo, hi: hi });
      ui.grafica.style.opacity = '';
      marcarChip();
    } catch (e) {
      fallar(null, 'error', 'No se pudo calcular con esos valores. Revisa los parámetros.');
    }
  }

  function programar() {
    if (pendiente) return;
    pendiente = true;
    window.requestAnimationFrame(function () {
      pendiente = false;
      actualizar();
    });
  }

  function cargar(d) {
    ui.fam.value = d.fam;
    ui.n.value = d.n === undefined ? 1 : d.n;
    ui.k.value = d.k === undefined ? 1 : d.k;
    ui.b.value = d.b === undefined ? 1 : d.b;
    var porDefecto = limitesPorDefecto(d.fam);
    ui.def.checked = !!d.def;
    ui.lo.value = d.lo !== undefined ? d.lo : porDefecto[0];
    ui.hi.value = d.hi !== undefined ? d.hi : porDefecto[1];
    ajustarCampos();
    actualizar();
  }

  ui.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (!chip) return;
    var P = PARES[Number(chip.getAttribute('data-indice'))];
    cargar({ fam: P.fam, n: P.n, k: P.k, b: P.b, def: ui.def.checked });
  });
  ui.fam.addEventListener('change', function () {
    var porDefecto = limitesPorDefecto(ui.fam.value);
    ui.lo.value = porDefecto[0];
    ui.hi.value = porDefecto[1];
    // Valores razonables al cambiar de familia
    var f = ui.fam.value;
    if (f === 'atan' && !(Number(ui.n.value) >= 0 && Number(ui.n.value) <= 2)) ui.n.value = 1;
    if ((f === 'exp' || f === 'sin' || f === 'cos') && !(Number(ui.n.value) >= 1 && Number(ui.n.value) <= 6)) ui.n.value = 2;
    if (f === 'log' && Number(ui.n.value) === -1) ui.n.value = 2;
    ajustarCampos();
    actualizar();
  });
  ui.def.addEventListener('change', function () {
    ajustarCampos();
    actualizar();
  });
  entradas.forEach(function (e) { e.addEventListener('input', programar); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-partes]'), function (boton) {
    boton.addEventListener('click', function () {
      var d;
      try { d = JSON.parse(boton.getAttribute('data-cargar-partes')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(d);
    });
  });

  window.CI.alCambiarTema(actualizar);
  cargar({ fam: 'exp', n: 2, k: 3 });
})();
