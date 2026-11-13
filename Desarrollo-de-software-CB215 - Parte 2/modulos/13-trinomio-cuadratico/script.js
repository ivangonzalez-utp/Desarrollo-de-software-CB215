/**
 * Módulo 13 · Integrales con trinomio cuadrático
 *
 * 1. Modelo matemático: dado T(x) = ax² + bx + c y un numerador px + q, calcula
 *    el discriminante, el caso (arctan, ln, -1/u, senh⁻¹, arcsen…), la
 *    antiderivada F(x) y el integrando f(x) como funciones de JavaScript.
 * 2. Asistente (pestaña del visualizador): muestra en KaTeX cada paso de la
 *    solución, dibuja la parábola y el integrando con F, y verifica F con
 *    derivadas numéricas y con la regla de Simpson (Numerics.simpson).
 * 3. Gráficas de los ejemplos resueltos.
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
  /* Formato de números y fórmulas en LaTeX                              */
  /* ================================================================== */

  /** Representa v como p/q (q ≤ 720) si es racional "razonable"; si no, null. */
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

  /** Número en LaTeX: entero, fracción o decimal. */
  function tx(v) {
    if (Math.abs(v) < 1e-12) return '0';
    var r = racional(v);
    if (r) {
      if (r.q === 1) return String(r.p);
      return (r.p < 0 ? '-' : '') + '\\frac{' + Math.abs(r.p) + '}{' + r.q + '}';
    }
    return V.formatearTex(v, 5);
  }

  /** Número entre paréntesis si es negativo (para sustituir en fórmulas). */
  function par(v) {
    var r = racional(v);
    return (v >= 0 && r && r.q === 1) ? tx(v) : '(' + tx(v) + ')';
  }

  /** Suma de términos [{c: coeficiente, t: 'x^2'}] con signos bien escritos. */
  function sumaTex(items) {
    var salida = '';
    items.forEach(function (it) {
      if (Math.abs(it.c) < 1e-12) return;
      var neg = it.c < 0;
      var m = Math.abs(it.c);
      var cs = (Math.abs(m - 1) < 1e-12 && it.t) ? '' : tx(m);
      var termino = cs + it.t;
      if (!salida) salida = (neg ? '-' : '') + termino;
      else salida += (neg ? ' - ' : ' + ') + termino;
    });
    return salida || '0';
  }

  /** Une fragmentos ya con su signo ('-' inicial) como una suma. */
  function unir(partes) {
    var salida = '';
    partes.forEach(function (s) {
      if (!s) return;
      if (!salida) salida = s;
      else salida += s.charAt(0) === '-' ? ' - ' + s.slice(1) : ' + ' + s;
    });
    return salida || '0';
  }

  /** Raíz cuadrada de v ≥ 0 en LaTeX, simplificando factores cuadrados. */
  function raizTx(v) {
    if (v < 1e-12) return '0';
    var s = Math.sqrt(v);
    if (racional(s)) return tx(s);
    var r = racional(v);
    if (r && r.p * r.q < 1e12) {
      var m = r.p * r.q;
      var k = 1;
      for (var d = 2; d * d <= m; d++) {
        while (m % (d * d) === 0) { m /= d * d; k *= d; }
      }
      var num = (k === 1 ? '' : String(k)) + '\\sqrt{' + m + '}';
      return r.q === 1 ? num : '\\frac{' + num + '}{' + r.q + '}';
    }
    return '\\sqrt{' + V.formatearTex(v, 5) + '}';
  }

  /** 2√a en LaTeX (a > 0). */
  function dosRaiz(a) {
    var r = Math.sqrt(a);
    return racional(r) ? tx(2 * r) : '2' + raizTx(a);
  }

  /** Coeficiente numérico: {val, tex}. */
  function coefNum(v) {
    return { val: v, tex: tx(v) };
  }

  /** Coeficiente num/√R: {val, tex}. */
  function coefRaiz(num, R) {
    var s = Math.sqrt(R);
    var val = num / s;
    if (racional(s)) return { val: val, tex: tx(val) };
    var neg = num < 0;
    var cuerpo = Math.abs(num);
    return { val: val, tex: (neg ? '-' : '') + '\\frac{' + tx(cuerpo) + '}{' + raizTx(R) + '}' };
  }

  /** Coeficiente · cuerpo, omitiendo ±1. */
  function por(coef, cuerpo) {
    if (Math.abs(coef.val) < 1e-12) return '';
    if (Math.abs(coef.val - 1) < 1e-12) return cuerpo;
    if (Math.abs(coef.val + 1) < 1e-12) return '-' + cuerpo;
    return coef.tex + cuerpo;
  }

  /** Expresión lineal Ax + B en LaTeX. */
  function lineal(A, B) {
    return sumaTex([{ c: A, t: 'x' }, { c: B, t: '' }]);
  }

  /** Trinomio ax² + bx + c en LaTeX. */
  function trinomioTex(a, b, c) {
    return sumaTex([{ c: a, t: 'x^2' }, { c: b, t: 'x' }, { c: c, t: '' }]);
  }

  /** Integrando en LaTeX. */
  function integrandoTex(forma, a, b, c, p, q) {
    var num = lineal(p, q);
    var T = trinomioTex(a, b, c);
    var den = forma === 'raiz' ? '\\sqrt{' + T + '}' : T;
    return '\\frac{' + num + '}{' + den + '}';
  }

  /* ================================================================== */
  /* Modelo: discriminante, antiderivada e integrando                    */
  /* ================================================================== */

  /**
   * @param {string} forma 'racional' o 'raiz'.
   * @returns {Object} modelo con f, F, D, caso, valido, vista, intervalo, etc.
   */
  function modelo(forma, a, b, c, p, q) {
    var D = b * b - 4 * a * c;
    var escala = Math.max(1, b * b, Math.abs(4 * a * c));
    var caso = Math.abs(D) < 1e-9 * escala ? 'cero' : (D < 0 ? 'neg' : 'pos');
    if (caso === 'cero') D = 0;
    var h = b / (2 * a);
    var k = c - b * b / (4 * a);
    var m = q - p * b / (2 * a);
    var raizD = Math.sqrt(Math.abs(D));
    var s0 = raizD / (2 * Math.abs(a));
    var raiz = forma === 'raiz';
    var T = function (x) { return a * x * x + b * x + c; };
    var M = {
      forma: forma, a: a, b: b, c: c, p: p, q: q, D: D, caso: caso, h: h, k: k, m: m, raizD: raizD, s0: s0, T: T,
      valido: true, error: ''
    };

    if (raiz && a < 0 && caso !== 'pos') {
      M.valido = false;
      M.error = 'Con $a&lt;0$ y $D\\le0$ el trinomio $ax^2+bx+c$ es negativo (o cero) para todo $x$: la raíz no es real y la integral no existe en los reales. Prueba con $D&gt;0$ (hay un intervalo donde el radicando es positivo) o con $a&gt;0$.';
      return M;
    }

    // Primitiva de 1/T o de 1/√T
    var G0;
    if (!raiz) {
      if (caso === 'neg') G0 = function (x) { return 2 / raizD * Math.atan((2 * a * x + b) / raizD); };
      else if (caso === 'cero') G0 = function (x) { return -2 / (2 * a * x + b); };
      else G0 = function (x) { return Math.log(Math.abs((2 * a * x + b - raizD) / (2 * a * x + b + raizD))) / raizD; };
    } else if (a > 0) {
      var ra = Math.sqrt(a);
      if (caso === 'neg') G0 = function (x) { return Math.asinh((2 * a * x + b) / raizD) / ra; };
      else if (caso === 'cero') G0 = function (x) { var u = x + h; return u === 0 ? NaN : Math.sign(u) * Math.log(Math.abs(u)) / ra; };
      else G0 = function (x) { var t = T(x); return t > 0 ? Math.log(Math.abs(2 * ra * Math.sqrt(t) + 2 * a * x + b)) / ra : NaN; };
    } else {
      var rma = Math.sqrt(-a);
      G0 = function (x) {
        var u = (-2 * a * x - b) / raizD;
        return Math.abs(u) <= 1 ? Math.asin(u) / rma : NaN;
      };
    }

    M.f = function (x) {
      var t = T(x);
      if (!raiz) return (p * x + q) / t;
      return t > 0 ? (p * x + q) / Math.sqrt(t) : NaN;
    };
    M.F = function (x) {
      var t = T(x);
      var parte = 0;
      if (Math.abs(p) > 0) {
        if (!raiz) parte = p / (2 * a) * Math.log(Math.abs(t));
        else parte = t > 0 ? p / a * Math.sqrt(t) : NaN;
      }
      if (Math.abs(m) > 1e-12) parte += m * G0(x);
      else if (raiz && !(t > 0)) parte = NaN;
      return parte;
    };

    // Ventana de dibujo e intervalo de comprobación con Simpson (sin singularidades)
    var w;
    var interv;
    if (raiz && a < 0) {
      w = 1.35 * s0;
      interv = [-h - 0.6 * s0, -h + 0.6 * s0];
    } else {
      w = Math.max(3, 2 * s0 + 1.5);
      if (caso === 'pos' && !raiz) interv = [-h - 0.6 * s0, -h + 0.6 * s0];
      else if (caso === 'pos') interv = [-h + s0 + 0.5, -h + s0 + 2.5];
      else if (caso === 'cero') interv = [-h + 0.5, -h + 2];
      else interv = [-h - 1, -h + 1.5];
    }
    M.vista = [-h - w, -h + w];
    M.intervalo = interv;
    return M;
  }

  /* ================================================================== */
  /* Pasos en LaTeX                                                      */
  /* ================================================================== */

  /** @returns {{titulo: string, html: string}[]} */
  function generarPasos(M) {
    var a = M.a, b = M.b, c = M.c, p = M.p, q = M.q, D = M.D, h = M.h, m = M.m;
    var raiz = M.forma === 'raiz';
    var T = trinomioTex(a, b, c);
    var den = raiz ? '\\sqrt{T}' : 'T';
    var pasos = [];
    var conNumerador = Math.abs(p) > 0;
    var mCero = Math.abs(m) < 1e-12;
    var rD = raizTx(Math.abs(D));
    var lin2 = lineal(2 * a, b);

    // 1. Datos y discriminante
    var texto1 = '$$T(x)=' + T + ',\\qquad D=b^2-4ac=' + par(b) + '^2-4\\,' + par(a) + '\\,' + par(c) + '=' + tx(D) + '$$';
    var lectura;
    if (M.caso === 'neg') lectura = '$D&lt;0$: el trinomio no tiene raíces reales y, al completar el cuadrado, queda como $a\\,(u^2+s^2)$.';
    else if (M.caso === 'cero') lectura = '$D=0$: el trinomio tiene una raíz doble y es un cuadrado perfecto, $a\\,u^2$.';
    else {
      var r1 = (-b - M.raizD) / (2 * a);
      var r2 = (-b + M.raizD) / (2 * a);
      lectura = '$D&gt;0$: hay dos raíces reales, $x=' + tx(Math.min(r1, r2)) + '$ y $x=' + tx(Math.max(r1, r2)) + '$, y queda como $a\\,(u^2-s^2)$.';
    }
    if (raiz) {
      if (a > 0) lectura += ' Como $a&gt;0$, el radicando es positivo' + (M.caso === 'pos' ? ' fuera de las raíces.' : ' (salvo en la raíz doble).');
      else lectura += ' Como $a&lt;0$ y $D&gt;0$, el radicando es positivo solo entre las raíces.';
    }
    pasos.push({ titulo: 'Identificar el trinomio y el discriminante', html: texto1 + '<p>' + lectura + '</p>' });

    // 2. Numerador
    if (conNumerador) {
      var coefLog = coefNum(p / (2 * a));
      var cuerpoNum = por(coefLog, '\\left(' + lin2 + '\\right)');
      var descomposicion = unir([cuerpoNum, mCero ? '' : tx(m)]);
      var h2 = '$$' + lineal(p, q) + '=\\frac{p}{2a}\\,(2ax+b)+m=' + descomposicion + '$$';
      var integralSep;
      if (!raiz) {
        integralSep = '$$\\int\\frac{' + lineal(p, q) + '}{T}\\,dx=' + por(coefLog, '\\int\\frac{' + lin2 + '}{T}\\,dx') +
          (mCero ? '' : (m < 0 ? '-' : '+') + por(coefNum(Math.abs(m)), '\\int\\frac{dx}{T}')) + '$$';
      } else {
        integralSep = '$$\\int\\frac{' + lineal(p, q) + '}{\\sqrt T}\\,dx=' + por(coefLog, '\\int\\frac{' + lin2 + '}{\\sqrt T}\\,dx') +
          (mCero ? '' : (m < 0 ? '-' : '+') + por(coefNum(Math.abs(m)), '\\int\\frac{dx}{\\sqrt T}')) + '$$';
      }
      var parteDerivada = raiz
        ? '$$' + por(coefLog, '\\int\\frac{' + lin2 + '}{\\sqrt{T}}\\,dx') + '=' + por(coefNum(p / a), '\\sqrt{' + T + '}') + '$$'
        : '$$' + por(coefLog, '\\int\\frac{' + lin2 + '}{T}\\,dx') + '=' + por(coefLog, ((a > 0 && M.caso === 'neg') ? '\\ln\\left(' + T + '\\right)' : '\\ln\\left|' + T + '\\right|')) + '$$';
      var nota = '<p>Aquí $2ax+b=' + lin2 + '$ es la derivada de $T$ y $m=q-\\frac{pb}{2a}=' + tx(m) + '$.' +
        (mCero ? ' Como $m=0$, el numerador es exactamente un múltiplo de $T\'$ y ya no hace falta completar el cuadrado.' : '') + '</p>';
      pasos.push({ titulo: 'Separar el numerador (13.9)', html: h2 + integralSep + nota });
      pasos.push({ titulo: 'Parte con la derivada del trinomio (sustitución $w=T$)', html: parteDerivada });
    } else if (Math.abs(q - 1) > 1e-12) {
      pasos.push({
        titulo: 'Sacar la constante del numerador',
        html: '$$\\int\\frac{' + tx(q) + '}{' + den.replace('T', T) + '}\\,dx=' + tx(q) + '\\int\\frac{dx}{' + den.replace('T', T) + '}$$'
      });
    }

    if (mCero) {
      var finalMc = construirResultado(M);
      pasos.push({ titulo: 'Resultado', html: '<p><span class="resultado-final">$\\displaystyle\\int ' + integrandoTex(M.forma, a, b, c, p, q) + '\\,dx=' + finalMc + '+C$</span></p>' });
      return pasos;
    }

    // 3. Completar el cuadrado
    var s2 = c / a - h * h; // = k / a
    var vertice = '$$\\text{Vértice de la parábola: }\\left(' + tx(-h) + ',\\ ' + tx(M.k) + '\\right)$$';
    var factor = Math.abs(a - 1) < 1e-12 ? '' : tx(a);
    var abre = Math.abs(a - 1) < 1e-12 ? '' : '\\left[';
    var cierra = Math.abs(a - 1) < 1e-12 ? '' : '\\right]';
    var cuadrado = '\\left(' + sumaTex([{ c: 1, t: 'x' }, { c: h, t: '' }]) + '\\right)^2';
    if (Math.abs(a) === 1 && a < 0) { factor = '-'; abre = '\\left['; cierra = '\\right]'; }
    var cuerpoSq = Math.abs(s2) < 1e-12 ? cuadrado : unir([cuadrado, tx(s2)]);
    var pasoCuadrado = '$$' + T + '=' + factor + abre + 'x^2' + (Math.abs(b / a) < 1e-12 ? '' : (b / a < 0 ? '-' : '+') + por(coefNum(Math.abs(b / a)), 'x')) +
      (Math.abs(c / a) < 1e-12 ? '' : (c / a < 0 ? '-' : '+') + tx(Math.abs(c / a))) + cierra + '=' + factor + abre + cuerpoSq + cierra + '$$';
    if (Math.abs(a - 1) < 1e-12) {
      pasoCuadrado = '$$' + T + '=\\left(' + sumaTex([{ c: 1, t: 'x^2' }, { c: b, t: 'x' }, { c: h * h, t: '' }]) + '\\right)' +
        (Math.abs(s2) < 1e-12 ? '' : (s2 < 0 ? '-' : '+') + tx(Math.abs(s2))) + '=' + cuerpoSq + '$$';
    }
    pasos.push({
      titulo: 'Completar el cuadrado (13.1)',
      html: '<p>Se suma y resta $\\left(\\frac{b}{2a}\\right)^2=' + tx(h * h) + '$ dentro del corchete; con $h=\\frac{b}{2a}=' + tx(h) + '$:</p>' + pasoCuadrado + vertice
    });

    // 4. Sustitución y fórmula
    var u = sumaTex([{ c: 1, t: 'x' }, { c: h, t: '' }]);
    var htmlForm = '<p>Sea $u=' + u + '$, $du=dx$.</p>';
    var coefA = Math.abs(a - 1) < 1e-12 ? '' : (Math.abs(a + 1) < 1e-12 ? '-' : coefNum(1 / a).tex);
    var preA = Math.abs(a - 1) < 1e-12 ? '' : (Math.abs(a + 1) < 1e-12 ? '-' : coefNum(1 / a).tex + '\\cdot');
    var formaG; // descripción de la integral con u
    if (!raiz) {
      if (M.caso === 'neg') {
        htmlForm += '$$\\int\\frac{dx}{T}=' + coefA + '\\int\\frac{du}{u^2+' + tx(s2) + '}=' + preA + '\\frac{1}{' + raizTx(s2) + '}\\arctan\\frac{u}{' + raizTx(s2) + '}$$' +
          '<p>Usando $\\int\\frac{du}{u^2+s^2}=\\frac1s\\arctan\\frac us$ con $s^2=' + tx(s2) + '$. Simplificando, es la fórmula (13.3):</p>' +
          '$$\\int\\frac{dx}{T}=' + por(coefRaiz(2, -D), '\\arctan\\frac{' + lin2 + '}{' + raizTx(-D) + '}') + '$$';
      } else if (M.caso === 'cero') {
        htmlForm += '$$\\int\\frac{dx}{T}=' + coefA + '\\int u^{-2}\\,du=' + por(coefNum(-1 / a), '\\frac{1}{u}') + '=-\\frac{2}{' + lin2 + '}$$' +
          '<p>Es la fórmula (13.4).</p>';
      } else {
        htmlForm += '$$\\int\\frac{dx}{T}=' + coefA + '\\int\\frac{du}{u^2-' + tx(-s2) + '}=' + preA + '\\frac{1}{2\\cdot' + raizTx(-s2) + '}\\ln\\left|\\frac{u-' + raizTx(-s2) + '}{u+' + raizTx(-s2) + '}\\right|$$' +
          '<p>Usando $\\int\\frac{du}{u^2-s^2}=\\frac{1}{2s}\\ln\\left|\\frac{u-s}{u+s}\\right|$ con $s^2=' + tx(-s2) + '$. Simplificando, es la fórmula (13.5):</p>' +
          '$$\\int\\frac{dx}{T}=' + por(coefRaiz(1, D), '\\ln\\left|\\frac{' + lin2 + '-' + rD + '}{' + lin2 + '+' + rD + '}\\right|') + '$$';
      }
    } else if (a > 0) {
      var rA = raizTx(a);
      var cA = Math.abs(a - 1) < 1e-12 ? '' : '\\frac{1}{' + rA + '}';
      if (M.caso === 'neg') {
        htmlForm += '$$\\int\\frac{dx}{\\sqrt T}=' + cA + '\\int\\frac{du}{\\sqrt{u^2+' + tx(s2) + '}}=' + cA + '\\sinh^{-1}\\frac{u}{' + raizTx(s2) + '}$$' +
          '<p>Con $s^2=' + tx(s2) + '$ y $\\int\\frac{du}{\\sqrt{u^2+s^2}}=\\sinh^{-1}\\frac us=\\ln\\left(u+\\sqrt{u^2+s^2}\\right)$. Simplificando, (13.6):</p>' +
          '$$\\int\\frac{dx}{\\sqrt T}=' + por(coefRaiz(1, a), '\\sinh^{-1}\\frac{' + lin2 + '}{' + rD + '}') + '$$';
      } else if (M.caso === 'cero') {
        htmlForm += '$$\\int\\frac{dx}{\\sqrt T}=' + cA + '\\int\\frac{du}{|u|}=' + cA + '\\operatorname{sgn}(u)\\ln|u|$$' +
          '<p>Con $D=0$ la raíz es $\\sqrt a\\,|u|$.</p>';
      } else {
        htmlForm += '$$\\int\\frac{dx}{\\sqrt T}=' + cA + '\\int\\frac{du}{\\sqrt{u^2-' + tx(-s2) + '}}=' + cA + '\\ln\\left|u+\\sqrt{u^2-' + tx(-s2) + '}\\right|$$' +
          '<p>Con $s^2=' + tx(-s2) + '$ (para $|u|&gt;s$ es $\\cosh^{-1}\\frac{u}{s}$). Con $\\sqrt T=\\sqrt a\\sqrt{u^2-s^2}$, (13.7) queda:</p>' +
          '$$\\int\\frac{dx}{\\sqrt T}=' + por(coefRaiz(1, a), '\\ln\\left|' + dosRaiz(a) + '\\sqrt{T}+' + lin2 + '\\right|') + '$$';
      }
    } else {
      var s2n = M.k / Math.abs(a);
      htmlForm += '$$T=' + sumaTex([{ c: M.k, t: '' }, { c: a, t: 'u^2' }]) + (Math.abs(a + 1) < 1e-12 ? '' : '=' + por(coefNum(-a), '\\left[' + tx(s2n) + '-u^2\\right]')) + '\\ \\Rightarrow\\ ' +
        '\\int\\frac{dx}{\\sqrt{T}}=' + por(coefRaiz(1, -a), '\\int\\frac{du}{\\sqrt{' + tx(s2n) + '-u^2}}') + '=' + por(coefRaiz(1, -a), '\\arcsin\\frac{u}{' + raizTx(s2n) + '}') + '$$' +
        '<p>Con $u/s=-\\dfrac{2ax+b}{\\sqrt D}$ (porque $a&lt;0$), la fórmula (13.8) es:</p>' +
        '$$\\int\\frac{dx}{\\sqrt T}=' + por(coefRaiz(1, -a), '\\arcsin\\frac{' + lineal(-2 * a, -b) + '}{' + rD + '}') + '$$';
    }
    pasos.push({ titulo: 'Sustituir y aplicar la fórmula de la forma resultante', html: htmlForm });

    // 5. Resultado
    var F = construirResultado(M);
    pasos.push({
      titulo: 'Resultado',
      html: '<p><span class="resultado-final">$\\displaystyle\\int ' + integrandoTex(M.forma, a, b, c, p, q) + '\\,dx=' + F + '+C$</span></p>' +
        (raiz && a > 0 && M.caso === 'neg' ? '<p>También se puede escribir con logaritmos: $\\sinh^{-1}\\frac{2ax+b}{\\sqrt{-D}}=\\ln\\left(\\frac{2ax+b+2\\sqrt{aT}}{\\sqrt{-D}}\\right)$, que difiere solo en una constante.</p>' : '')
    });
    return pasos;
  }

  /** Antiderivada completa (sin «+ C») en LaTeX. */
  function construirResultado(M) {
    var a = M.a, b = M.b, c = M.c, p = M.p, m = M.m, D = M.D;
    var T = trinomioTex(a, b, c);
    var lin2 = lineal(2 * a, b);
    var rD = raizTx(Math.abs(D));
    var mCero = Math.abs(m) < 1e-12;
    var parte1 = '';
    var parte2 = '';
    if (M.forma === 'racional') {
      if (Math.abs(p) > 0) {
        var logT = (a > 0 && M.caso === 'neg') ? '\\ln\\left(' + T + '\\right)' : '\\ln\\left|' + T + '\\right|';
        parte1 = por(coefNum(p / (2 * a)), logT);
      }
      if (!mCero) {
        if (M.caso === 'neg') parte2 = por(coefRaiz(2 * m, -D), '\\arctan\\frac{' + lin2 + '}{' + raizTx(-D) + '}');
        else if (M.caso === 'cero') parte2 = (m < 0 ? '' : '-') + (Math.abs(Math.abs(m) - 0.5) < 1e-12 ? '\\frac{1}{' + lin2 + '}' : '\\frac{' + tx(2 * Math.abs(m)) + '}{' + lin2 + '}');
        else parte2 = por(coefRaiz(m, D), '\\ln\\left|\\frac{' + lin2 + '-' + rD + '}{' + lin2 + '+' + rD + '}\\right|');
      }
    } else {
      if (Math.abs(p) > 0) parte1 = por(coefNum(p / a), '\\sqrt{' + T + '}');
      if (!mCero) {
        if (a > 0 && M.caso === 'neg') parte2 = por(coefRaiz(m, a), '\\sinh^{-1}\\frac{' + lin2 + '}{' + rD + '}');
        else if (a > 0 && M.caso === 'cero') parte2 = por(coefRaiz(m, a), '\\operatorname{sgn}(' + sumaTex([{ c: 1, t: 'x' }, { c: M.h, t: '' }]) + ')\\ln\\left|' + sumaTex([{ c: 1, t: 'x' }, { c: M.h, t: '' }]) + '\\right|');
        else if (a > 0) parte2 = por(coefRaiz(m, a), '\\ln\\left|' + dosRaiz(a) + '\\sqrt{' + T + '}+' + lin2 + '\\right|');
        else parte2 = por(coefRaiz(m, -a), '\\arcsin\\frac{' + lineal(-2 * a, -b) + '}{' + rD + '}');
      }
    }
    return unir([parte1, parte2]);
  }

  /* ================================================================== */
  /* Gráficas                                                            */
  /* ================================================================== */

  /** Dibuja el integrando f y la antiderivada F (con C = 0). */
  function dibujarIntegrando(div, M) {
    var col = G.colores();
    var x0 = M.vista[0];
    var x1 = M.vista[1];
    var cf = G.muestrear(M.f, x0, x1, 600);
    var cF = G.muestrear(M.F, x0, x1, 600);
    G.dibujar(div, [
      {
        x: cf.x, y: cf.y, type: 'scatter', mode: 'lines', name: 'f(x)',
        line: { color: col.serie[0], width: 2.5 }, hovertemplate: 'x = %{x:.3f}<br>f(x) = %{y:.4f}<extra></extra>'
      },
      {
        x: cF.x, y: cF.y, type: 'scatter', mode: 'lines', name: 'F(x), C = 0',
        line: { color: col.serie[1], width: 3 }, hovertemplate: 'x = %{x:.3f}<br>F(x) = %{y:.4f}<extra></extra>'
      }
    ], G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: G.rangoY([cf.y, cF.y], { recorte: 0.02, incluir: [0] }) },
      hovermode: 'x'
    }));
  }

  /** Dibuja la parábola y = ax² + bx + c con su vértice y sus raíces. */
  function dibujarParabola(div, M) {
    var col = G.colores();
    var x0 = M.vista[0];
    var x1 = M.vista[1];
    var curva = G.muestrear(M.T, x0, x1, 300);
    var trazas = [{
      x: curva.x, y: curva.y, type: 'scatter', mode: 'lines', name: 'T(x) = ax² + bx + c',
      line: { color: col.serie[2], width: 2.5 }, hovertemplate: 'x = %{x:.3f}<br>T(x) = %{y:.4f}<extra></extra>'
    }, {
      x: [-M.h], y: [M.k], type: 'scatter', mode: 'markers', name: 'Vértice',
      marker: { color: col.serie[0], size: 10, line: { color: col.fondo, width: 2 } },
      hovertemplate: 'Vértice (%{x:.3f}, %{y:.3f})<extra></extra>'
    }];
    if (M.caso === 'pos') {
      var r = [(-M.b - M.raizD) / (2 * M.a), (-M.b + M.raizD) / (2 * M.a)];
      trazas.push({
        x: r, y: [0, 0], type: 'scatter', mode: 'markers', name: 'Raíces',
        marker: { color: col.serie[1], size: 9, symbol: 'diamond', line: { color: col.fondo, width: 2 } },
        hovertemplate: 'Raíz x = %{x:.4f}<extra></extra>'
      });
    }
    G.dibujar(div, trazas, G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: G.rangoY([curva.y, [M.k]], { recorte: 0.03, incluir: [0, M.k] }) },
      hovermode: 'closest'
    }));
  }

  /* ================================================================== */
  /* Verificación numérica                                               */
  /* ================================================================== */

  /** Compara F' con f (diferencias centrales) y F(β)-F(α) con Simpson. */
  function verificar(M) {
    var x0 = M.vista[0];
    var x1 = M.vista[1];
    var comparados = 0;
    var maxima = 0;
    for (var i = 0; i < 121; i++) {
      var x = x0 + (x1 - x0) * (i + 0.37) / 121;
      var fx = M.f(x);
      if (!isFinite(fx) || Math.abs(fx) > 50) continue;
      var e = 1e-5 * Math.max(1, Math.abs(x));
      var Fa = M.F(x + e);
      var Fb = M.F(x - e);
      if (!isFinite(Fa) || !isFinite(Fb)) continue;
      var dif = Math.abs((Fa - Fb) / (2 * e) - fx) / Math.max(1, Math.abs(fx));
      comparados++;
      if (dif > maxima) maxima = dif;
    }
    var simpson = NaN;
    var porF = NaN;
    try {
      simpson = window.Numerics.simpson(M.f, M.intervalo[0], M.intervalo[1], 2000);
      porF = M.F(M.intervalo[1]) - M.F(M.intervalo[0]);
    } catch (err) { /* intervalo no válido */ }
    var difSimpson = Math.abs(simpson - porF);
    return {
      comparados: comparados,
      maxima: maxima,
      simpson: simpson,
      porF: porF,
      difSimpson: difSimpson,
      correcta: comparados >= 10 && maxima < 1e-5 && isFinite(difSimpson) && difSimpson <= 1e-7 * Math.max(1, Math.abs(simpson))
    };
  }

  /* ================================================================== */
  /* 1. Gráficas de los ejemplos                                         */
  /* ================================================================== */

  Array.prototype.forEach.call(document.querySelectorAll('[data-trinomio]'), function (bloque) {
    var d;
    try { d = JSON.parse(bloque.getAttribute('data-trinomio')); } catch (e) { return; }
    var div = bloque.querySelector('[data-grafica]');
    var M = modelo(d.forma, d.a, d.b, d.c, d.p, d.q);
    if (!M.valido || !div) return;
    function pintar() { dibujarIntegrando(div, M); }
    window.CI.alCambiarTema(pintar);
    pintar();
  });

  /* ================================================================== */
  /* 2. Asistente (pestaña del visualizador)                             */
  /* ================================================================== */

  var form = document.getElementById('vis-trinomio');
  if (!form) return;

  var ui = {
    a: document.getElementById('tri-a'),
    b: document.getElementById('tri-b'),
    c: document.getElementById('tri-c'),
    p: document.getElementById('tri-p'),
    q: document.getElementById('tri-q'),
    chips: document.getElementById('chips-trinomio'),
    mensaje: document.getElementById('mensaje-trinomio'),
    parabola: document.getElementById('grafica-parabola'),
    integrando: document.getElementById('grafica-integrando'),
    lcd: document.getElementById('lcd-trinomio'),
    hoja: document.getElementById('hoja-trinomio'),
    titulo: document.getElementById('titulo-asistente'),
    pasos: document.getElementById('pasos-trinomio')
  };
  var entradas = [ui.a, ui.b, ui.c, ui.p, ui.q];
  var radios = form.querySelectorAll('input[name="forma"]');

  var PARES = [
    { forma: 'racional', a: 1, b: 4, c: 13, p: 0, q: 1 },
    { forma: 'racional', a: 1, b: 2, c: 5, p: 3, q: 2 },
    { forma: 'racional', a: 2, b: 3, c: -2, p: 0, q: 1 },
    { forma: 'racional', a: 4, b: -12, c: 9, p: 0, q: 1 },
    { forma: 'racional', a: -1, b: 2, c: -2, p: 0, q: 1 },
    { forma: 'raiz', a: 1, b: 6, c: 13, p: 0, q: 1 },
    { forma: 'raiz', a: 1, b: -4, c: 3, p: 0, q: 1 },
    { forma: 'raiz', a: -1, b: -2, c: 3, p: 2, q: 5 }
  ];
  var ETIQUETAS = ['D<0', 'D<0 con px+q', 'D>0', 'D=0', 'a<0, D<0', 'raíz, D<0', 'raíz, D>0', 'raíz, a<0'];
  var pendiente = false;

  ui.chips.innerHTML = PARES.map(function (par_, i) {
    return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false" title="' + ETIQUETAS[i] + '">' +
      tex(integrandoTex(par_.forma, par_.a, par_.b, par_.c, par_.p, par_.q)) + '</button>';
  }).join('');

  function formaActual() {
    return form.querySelector('input[name="forma"]:checked').value;
  }

  function leerEntradas() {
    var campos = [['a', ui.a], ['b', ui.b], ['c', ui.c], ['p', ui.p], ['q', ui.q]];
    var valores = {};
    for (var i = 0; i < campos.length; i++) {
      var r = V.leerNumero(campos[i][1].value, campos[i][0]);
      if (!r.ok) return { error: r.error, control: campos[i][1] };
      if (Math.abs(r.valor) > 1e6) return { error: 'El valor de $' + campos[i][0] + '$ es demasiado grande (usa $|' + campos[i][0] + '|\\le10^6$).', control: campos[i][1] };
      valores[campos[i][0]] = r.valor;
    }
    return { valores: valores };
  }

  function marcarInvalido(control) {
    entradas.forEach(function (e) { e.setAttribute('aria-invalid', e === control ? 'true' : 'false'); });
  }

  function marcarChip() {
    var forma = formaActual();
    var v = {};
    ['a', 'b', 'c', 'p', 'q'].forEach(function (k) { v[k] = Number(ui[k].value); });
    Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
      var P = PARES[Number(chip.getAttribute('data-indice'))];
      var igual = P.forma === forma && P.a === v.a && P.b === v.b && P.c === v.c && P.p === v.p && P.q === v.q;
      chip.setAttribute('aria-pressed', igual ? 'true' : 'false');
    });
  }

  function fallar(control, tipo, html) {
    marcarInvalido(control);
    V.mostrarMensaje(ui.mensaje, tipo || 'error', html);
    ui.lcd.innerHTML = '';
    ui.hoja.hidden = true;
    ui.parabola.style.opacity = '0.35';
    ui.integrando.style.opacity = '0.35';
  }

  function actualizar() {
    try {
      var lectura = leerEntradas();
      if (lectura.error) return fallar(lectura.control, 'error', lectura.error);
      var v = lectura.valores;
      if (v.a === 0) {
        return fallar(ui.a, 'error', 'Para que sea un trinomio cuadrático necesitas $a\\neq0$. Con $a=0$ la expresión es lineal y se integra directamente (módulos 6 y 9).');
      }
      var forma = formaActual();
      if (v.p === 0 && v.q === 0) {
        return fallar(ui.p, 'adv', 'Con $p=0$ y $q=0$ el numerador es cero y la integral es simplemente $C$. Escribe un numerador distinto de cero.');
      }
      var M = modelo(forma, v.a, v.b, v.c, v.p, v.q);
      if (!M.valido) return fallar(ui.a, 'adv', M.error);
      marcarInvalido(null);

      // Pasos en KaTeX
      var pasos = generarPasos(M);
      ui.titulo.innerHTML = '$\\displaystyle\\int ' + integrandoTex(forma, v.a, v.b, v.c, v.p, v.q) + '\\,dx$';
      ui.pasos.innerHTML = pasos.map(function (p) {
        return '<li class="paso"><span class="paso__titulo">' + p.titulo + '</span>' + p.html + '</li>';
      }).join('');
      ui.hoja.hidden = false;
      window.CI.renderizarMatematicas(ui.hoja);
      desplazables(ui.hoja);

      // Verificación
      var ver = verificar(M);
      if (ver.comparados < 10) {
        V.mostrarMensaje(ui.mensaje, 'adv', 'Hay muy pocos puntos de la ventana donde el integrando está definido para comparar. Revisa los coeficientes.');
      } else if (ver.correcta) {
        V.mostrarMensaje(ui.mensaje, 'exito', '¡Verificado! $F\'(x)=f(x)$ en ' + ver.comparados + ' puntos y $F(\\beta)-F(\\alpha)$ coincide con la regla de Simpson en $[' +
          V.formatearTex(M.intervalo[0], 4) + ',\\,' + V.formatearTex(M.intervalo[1], 4) + ']$.');
      } else {
        V.mostrarMensaje(ui.mensaje, 'error', 'La comprobación numérica no coincide (error máximo $' + V.formatearTex(ver.maxima, 3) + '$). Revisa los datos.');
      }

      var nombreCaso = M.caso === 'neg' ? 'D &lt; 0' : (M.caso === 'cero' ? 'D = 0' : 'D &gt; 0');
      var funcion;
      if (forma === 'racional') funcion = M.caso === 'neg' ? 'arctan' : (M.caso === 'cero' ? '−1/u' : 'ln');
      else funcion = v.a < 0 ? 'arcsen' : (M.caso === 'neg' ? 'senh⁻¹' : (M.caso === 'pos' ? 'ln' : 'sgn·ln'));
      ui.lcd.innerHTML =
        V.lectura('Discriminante ' + tex('D'), V.formatear(M.D, 6) + ' (' + nombreCaso + ')', true) +
        V.lectura('Función resultante', funcion) +
        V.lectura('Vértice', '(' + V.formatear(-M.h, 5) + ', ' + V.formatear(M.k, 5) + ')') +
        V.lectura('Máx. ' + tex('|F\'-f|'), V.formatear(ver.maxima, 3)) +
        V.lectura('Simpson en [' + V.formatear(M.intervalo[0], 3) + ', ' + V.formatear(M.intervalo[1], 3) + ']', V.formatear(ver.simpson, 9)) +
        V.lectura(tex('F(\\beta)-F(\\alpha)'), V.formatear(ver.porF, 9));
      window.CI.renderizarMatematicas(ui.lcd);

      dibujarParabola(ui.parabola, M);
      dibujarIntegrando(ui.integrando, M);
      ui.parabola.style.opacity = '';
      ui.integrando.style.opacity = '';
      marcarChip();
    } catch (e) {
      fallar(null, 'error', 'No se pudo calcular con esos valores. Revisa los coeficientes.');
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
    ui.a.value = d.a;
    ui.b.value = d.b;
    ui.c.value = d.c;
    ui.p.value = d.p;
    ui.q.value = d.q;
    Array.prototype.forEach.call(radios, function (r) { r.checked = r.value === d.forma; });
    actualizar();
  }

  ui.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (chip) cargar(PARES[Number(chip.getAttribute('data-indice'))]);
  });
  entradas.forEach(function (e) { e.addEventListener('input', programar); });
  Array.prototype.forEach.call(radios, function (r) { r.addEventListener('change', programar); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-trinomio]'), function (boton) {
    boton.addEventListener('click', function () {
      var d;
      try { d = JSON.parse(boton.getAttribute('data-cargar-trinomio')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(d);
    });
  });

  window.CI.alCambiarTema(actualizar);
  cargar(PARES[1]);
})();
