/**
 * Módulo 15 · Sólidos de revolución
 *
 * 1. Gráficas de los ejemplos: región plana, eje de giro y rectángulos de la
 *    partición (discos, arandelas o cascarones).
 * 2. Visualizador: región 2D con rectángulo representativo, sólido 3D (traza
 *    `surface` de Plotly gl3d) y lectura con el volumen de referencia
 *    (Numerics.diskVolume / washerVolume / shellVolume), el volumen aproximado
 *    con n rebanadas, el error y la integral planteada en LaTeX.
 *
 * Convenciones: la región está entre g (abajo) y f (arriba) sobre [a, b].
 * Discos y arandelas giran alrededor de rectas horizontales (y = k);
 * cascarones, alrededor de rectas verticales (x = k).
 */
(function () {
  'use strict';

  var V = window.Visualizador;
  var G = window.Graficas;
  var N = window.Numerics;
  if (!V || !G || !N) return;
  var tex = window.CI.tex;

  var MUESTRAS = 201;

  /* ---------------------------------------------------------------- */
  /* Preparación y validación                                          */
  /* ---------------------------------------------------------------- */

  function esHorizontal(eje) {
    return eje === 'hx' || eje === 'hk';
  }

  /** Resultado de error de validación. */
  function error(html, campo) {
    return { ok: false, error: html, campo: campo || null };
  }

  /**
   * Interpreta y valida una configuración (todo texto) y calcula los volúmenes.
   * @param {{f: string, g: string, a: string, b: string, metodo: string, eje: string, k: string}} cfg
   * @returns {Object} {ok: true, ...datos} o {ok: false, error, campo}
   */
  function preparar(cfg) {
    var cf = V.compilarFuncion(cfg.f);
    if (!cf.ok) return error(cf.error, 'fx');

    var hayG = String(cfg.g).trim() !== '';
    var cg = null;
    if (hayG) {
      cg = V.compilarFuncion(cfg.g);
      if (!cg.ok) return error(cg.error.replace('una función de $x$', 'una función $g(x)$'), 'gx');
    }
    var f = cf.f;
    var g = hayG ? cg.f : function () { return 0; };

    var la = V.leerNumero(cfg.a, 'a');
    if (!la.ok) return error(la.error, 'a-txt');
    var lb = V.leerNumero(cfg.b, 'b');
    if (!lb.ok) return error(lb.error, 'b-txt');
    var a = la.valor;
    var b = lb.valor;
    if (!(a < b)) {
      return error('El límite inferior debe ser menor que el superior: ahora $a=' + V.formatearTex(a, 6) + '$ y $b=' + V.formatearTex(b, 6) + '$. Intercambia los valores.', 'a-txt');
    }

    var k = 0;
    if (cfg.eje === 'hk' || cfg.eje === 'vk') {
      var lk = V.leerNumero(cfg.k, 'k');
      if (!lk.ok) return error(lk.error, 'k-txt');
      k = lk.valor;
    }

    var horizontal = esHorizontal(cfg.eje);
    var metodo = cfg.metodo;
    if (metodo !== 'cascarones' && !horizontal) {
      return error('Con <strong>discos</strong> y <strong>arandelas</strong> las rebanadas son perpendiculares al eje, y aquí se trabaja en $x$: el eje de giro debe ser horizontal (eje $x$ o $y=k$). Para girar alrededor de una recta vertical usa <strong>cascarones</strong>.', 'eje-sel');
    }
    if (metodo === 'cascarones' && horizontal) {
      return error('Los <strong>cascarones</strong> en $x$ giran alrededor de una recta vertical (eje $y$ o $x=k$). Para un eje horizontal usa discos o arandelas.', 'eje-sel');
    }

    // Muestreo para validar la región
    var dx = (b - a) / (MUESTRAS - 1);
    var signo = 0;
    for (var i = 0; i < MUESTRAS; i++) {
      var x = i === MUESTRAS - 1 ? b : a + i * dx;
      var fx = f(x);
      var gx = g(x);
      if (!isFinite(fx)) {
        return error('$f$ no da un número real finito en $x=' + V.formatearTex(x, 5) + '$. Cambia la función o el intervalo (raíces de negativos, divisiones por cero o logaritmos de valores $\\le 0$).', 'fx');
      }
      if (!isFinite(gx)) {
        return error('$g$ no da un número real finito en $x=' + V.formatearTex(x, 5) + '$. Cambia la función o el intervalo.', 'gx');
      }
      if (metodo !== 'discos' && fx < gx - 1e-9 * (1 + Math.abs(fx))) {
        return error('En $x=' + V.formatearTex(x, 5) + '$ se cumple $g(x)=' + V.formatearTex(gx, 5) + '>f(x)=' + V.formatearTex(fx, 5) + '$: $g$ debe quedar por debajo de $f$ en todo $[a,b]$. Intercambia las funciones.', 'gx');
      }
      if (metodo === 'arandelas') {
        var df = fx - k;
        var dg = gx - k;
        if (df * dg < -1e-12) {
          return error('La región cruza el eje de giro $y=' + V.formatearTex(k, 4) + '$ cerca de $x=' + V.formatearTex(x, 4) + '$: con arandelas la región debe quedar de un solo lado del eje. Cambia el eje, los límites o las funciones.', 'eje-sel');
        }
        if (signo === 0 && (Math.abs(df) > 1e-12 || Math.abs(dg) > 1e-12)) signo = Math.abs(df) >= Math.abs(dg) ? Math.sign(df) : Math.sign(dg);
      }
    }
    if (metodo === 'cascarones' && k > a && k < b) {
      return error('El eje $x=' + V.formatearTex(k, 4) + '$ atraviesa la región, porque $' + V.formatearTex(a, 4) + '<' + V.formatearTex(k, 4) + '<' + V.formatearTex(b, 4) +
        '$. Con cascarones el eje debe quedar fuera de $(a,b)$ (a la izquierda o a la derecha). Parte la región en dos tramos o mueve el eje.', 'k-txt');
    }

    // Funciones auxiliares por método
    var abajo = signo < 0; // arandelas con la región por debajo del eje
    var exterior = function (x) { return (f(x) - k >= 0) ? f(x) : g(x); };
    var interior = function (x) { return (f(x) - k >= 0) ? g(x) : f(x); };
    var altura = function (x) { return f(x) - g(x); };

    // Integrando V'(x): volumen por unidad de x (para la suma con n rebanadas)
    var densidad;
    if (metodo === 'discos') {
      densidad = function (x) { var r = f(x) - k; return Math.PI * r * r; };
    } else if (metodo === 'arandelas') {
      densidad = function (x) { var R = exterior(x) - k; var r = interior(x) - k; return Math.PI * (R * R - r * r); };
    } else {
      densidad = function (x) { return 2 * Math.PI * Math.abs(x - k) * altura(x); };
    }

    var referencia;
    try {
      if (metodo === 'discos') referencia = N.diskVolume(f, a, b, k);
      else if (metodo === 'arandelas') referencia = N.washerVolume(exterior, interior, a, b, k);
      else referencia = N.shellVolume(altura, a, b, k);
    } catch (e) {
      return error(V.mensajeDeError(e), 'fx');
    }
    if (!isFinite(referencia)) return error('El volumen no es un número finito con estas funciones. Revisa $f$, $g$ y los límites.', 'fx');

    return {
      ok: true, cf: cf, cg: cg, hayG: hayG, f: f, g: g, a: a, b: b, k: k, metodo: metodo, eje: cfg.eje,
      horizontal: horizontal, abajo: abajo, exterior: exterior, interior: interior, altura: altura,
      densidad: densidad, referencia: referencia
    };
  }

  /** Aproximación con n rebanadas evaluadas en su punto medio. */
  function aproximar(d, n) {
    var dx = (d.b - d.a) / n;
    var suma = 0;
    for (var i = 0; i < n; i++) suma += d.densidad(d.a + (i + 0.5) * dx);
    return suma * dx;
  }

  /* ---------------------------------------------------------------- */
  /* Integral en LaTeX                                                 */
  /* ---------------------------------------------------------------- */

  /** «(expr − k)» según el signo de k, sin escribir «− 0». */
  function menosK(expr, k) {
    if (k === 0) return '\\left(' + expr + '\\right)';
    return '\\left(' + expr + (k > 0 ? ' - ' + V.formatearTex(k, 5) : ' + ' + V.formatearTex(-k, 5)) + '\\right)';
  }

  function integralTex(d) {
    var lim = '_{' + V.formatearTex(d.a, 5) + '}^{' + V.formatearTex(d.b, 5) + '}';
    var F = d.cf.tex;
    var Gt = d.hayG ? d.cg.tex : '0';
    if (d.metodo === 'discos') {
      return 'V=\\pi\\int' + lim + menosK(F, d.k) + '^{2}\\,dx';
    }
    if (d.metodo === 'arandelas') {
      var R = d.abajo ? Gt : F;
      var r = d.abajo ? F : Gt;
      return 'V=\\pi\\int' + lim + '\\Big[' + menosK(R, d.k) + '^{2}-' + menosK(r, d.k) + '^{2}\\Big]dx';
    }
    var rho;
    if (d.k <= d.a) rho = d.k === 0 ? 'x' : '\\left(x - ' + V.formatearTex(d.k, 5) + '\\right)';
    else rho = d.k === 0 ? '\\left(-x\\right)' : '\\left(' + V.formatearTex(d.k, 5) + ' - x\\right)';
    if (d.k < 0 && d.k <= d.a) rho = '\\left(x + ' + V.formatearTex(-d.k, 5) + '\\right)';
    var h = d.hayG ? '\\left[' + F + ' - \\left(' + Gt + '\\right)\\right]' : '\\left(' + F + '\\right)';
    return 'V=2\\pi\\int' + lim + rho + h + '\\,dx';
  }

  /* ---------------------------------------------------------------- */
  /* Gráfica 2D: región, eje y rectángulos                             */
  /* ---------------------------------------------------------------- */

  function muestrasX(a, b, m) {
    var xs = [];
    for (var i = 0; i < m; i++) xs.push(i === m - 1 ? b : a + (b - a) * i / (m - 1));
    return xs;
  }

  /**
   * Dibuja la región plana con el eje de giro y los n rectángulos.
   * @param {HTMLElement} div
   * @param {Object} d Datos de preparar().
   * @param {number} n Número de rebanadas.
   */
  function dibujarRegion(div, d, n) {
    var c = G.colores();
    var xs = muestrasX(d.a, d.b, 160);
    var yf = xs.map(d.f);
    var ygCurva = xs.map(d.g);
    var discos = d.metodo === 'discos';
    var inferior = discos ? function () { return d.k; } : d.g;
    var yInf = xs.map(inferior);

    var margen = 0.12 * (d.b - d.a);
    var x0 = d.a - margen;
    var x1 = d.b + margen;
    if (!d.horizontal) { x0 = Math.min(x0, d.k - margen); x1 = Math.max(x1, d.k + margen); }
    var rango = G.rangoY([yf, yInf, ygCurva], { recorte: 0, incluir: d.horizontal ? [0, d.k] : [0] });
    var holgura = 0.08 * (rango[1] - rango[0] || 1);
    var y0 = rango[0] - holgura;
    var y1 = rango[1] + holgura;

    // Región completa
    var polX = xs.concat(xs.slice().reverse());
    var polY = yf.concat(yInf.slice().reverse());

    // Rectángulos de la partición
    var dx = (d.b - d.a) / n;
    var normales = [];
    var representativo = [];
    var medio = Math.floor(n / 2);
    for (var i = 0; i < n; i++) {
      var xi = d.a + i * dx;
      var xm = xi + dx / 2;
      var alto = d.f(xm);
      var bajo = inferior(xm);
      var rect = { x: [xi, xi + dx, xi + dx, xi], y: [bajo, bajo, alto, alto] };
      (i === medio ? representativo : normales).push(rect);
    }

    var trazas = [
      {
        x: polX, y: polY, type: 'scatter', mode: 'lines', fill: 'toself', fillcolor: G.alfa(c.serie[0], 0.12),
        line: { width: 0 }, name: 'Región', hoverinfo: 'skip', showlegend: false
      },
      G.trazaPoligonos(normales, { nombre: discos ? 'Rebanadas (radios)' : d.metodo === 'arandelas' ? 'Rebanadas (R − r)' : 'Rebanadas (alturas)', color: c.serie[0], opacidad: 0.25, grosor: 1 }),
      G.trazaPoligonos(representativo, { nombre: 'Rectángulo representativo', color: c.serie[2], opacidad: 0.6, grosor: 2 }),
      {
        x: xs, y: yf, type: 'scatter', mode: 'lines', name: 'f(x)', line: { color: c.serie[0], width: 2.5 },
        hovertemplate: 'x = %{x:.3f}<br>f(x) = %{y:.4f}<extra></extra>'
      }
    ];
    if (!discos) {
      trazas.push({
        x: xs, y: ygCurva, type: 'scatter', mode: 'lines', name: 'g(x)', line: { color: c.serie[1], width: 2.5 },
        hovertemplate: 'x = %{x:.3f}<br>g(x) = %{y:.4f}<extra></extra>'
      });
    }
    trazas.push({
      x: d.horizontal ? [x0, x1] : [d.k, d.k], y: d.horizontal ? [d.k, d.k] : [y0, y1],
      type: 'scatter', mode: 'lines', name: 'Eje de giro', line: { color: c.texto, width: 2, dash: 'dash' }, hoverinfo: 'skip'
    });

    G.dibujar(div, trazas, G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: [y0, y1], title: { text: 'y' } },
      hovermode: 'closest'
    }));
  }

  /* ---------------------------------------------------------------- */
  /* Gráfica 3D del sólido                                             */
  /* ---------------------------------------------------------------- */

  var PASOS_X = 64;
  var PASOS_ANGULO = 56;

  /** Superficie de Plotly a partir de una función (u, v) → [sx, sy, sz]. */
  function superficie(nu, nv, punto, color, nombre, opacidad) {
    var X = [];
    var Y = [];
    var Z = [];
    for (var j = 0; j <= nv; j++) {
      var fx = [];
      var fy = [];
      var fz = [];
      for (var i = 0; i <= nu; i++) {
        var p = punto(i / nu, j / nv);
        fx.push(p[0]);
        fy.push(p[1]);
        fz.push(p[2]);
      }
      X.push(fx);
      Y.push(fy);
      Z.push(fz);
    }
    return {
      type: 'surface', x: X, y: Y, z: Z, showscale: false, opacity: opacidad === undefined ? 0.92 : opacidad,
      colorscale: [[0, color], [1, color]], hoverinfo: 'skip', name: nombre || '', showlegend: !!nombre,
      lighting: { ambient: 0.62, diffuse: 0.75, specular: 0.15, roughness: 0.7 },
      contours: { x: { show: false }, y: { show: false }, z: { show: false } }
    };
  }

  function trazas3D(d, corte) {
    var c = G.colores();
    var thMax = corte ? 1.5 * Math.PI : 2 * Math.PI;
    var ang = function (v) { return v * thMax; };
    var a = d.a;
    var b = d.b;
    var k = d.k;
    var xAt = function (u) { return a + u * (b - a); };
    var trazas = [];

    if (d.horizontal) {
      // Eje a lo largo de x: (x, k + r cos θ, r sin θ)
      var giro = function (x, r, v) { return [x, k + r * Math.cos(ang(v)), r * Math.sin(ang(v))]; };
      if (d.metodo === 'discos') {
        trazas.push(superficie(PASOS_X, PASOS_ANGULO, function (u, v) { var x = xAt(u); return giro(x, d.f(x) - k, v); }, c.serie[0], 'Superficie'));
        [a, b].forEach(function (x0) {
          trazas.push(superficie(1, PASOS_ANGULO, function (u, v) { return giro(x0, u * (d.f(x0) - k), v); }, c.serie[0], null, 0.85));
        });
      } else {
        var Rf = function (x) { return d.exterior(x) - k; };
        var rf = function (x) { return d.interior(x) - k; };
        trazas.push(superficie(PASOS_X, PASOS_ANGULO, function (u, v) { var x = xAt(u); return giro(x, Rf(x), v); }, c.serie[0], 'Exterior (R)'));
        trazas.push(superficie(PASOS_X, PASOS_ANGULO, function (u, v) { var x = xAt(u); return giro(x, rf(x), v); }, c.serie[1], 'Interior (r)'));
        [a, b].forEach(function (x0) {
          trazas.push(superficie(1, PASOS_ANGULO, function (u, v) { return giro(x0, rf(x0) + u * (Rf(x0) - rf(x0)), v); }, c.serie[0], null, 0.85));
        });
      }
      trazas.push({
        type: 'scatter3d', mode: 'lines', x: [a, b], y: [k, k], z: [0, 0], name: 'Eje de giro',
        line: { color: c.texto, width: 4, dash: 'dash' }, hoverinfo: 'skip'
      });
    } else {
      // Eje vertical x = k: (k + (x − k) cos θ, (x − k) sin θ, y) con y hacia arriba
      var gira = function (x, y, v) { return [k + (x - k) * Math.cos(ang(v)), (x - k) * Math.sin(ang(v)), y]; };
      trazas.push(superficie(PASOS_X, PASOS_ANGULO, function (u, v) { var x = xAt(u); return gira(x, d.f(x), v); }, c.serie[0], 'Cara superior f'));
      trazas.push(superficie(PASOS_X, PASOS_ANGULO, function (u, v) { var x = xAt(u); return gira(x, d.g(x), v); }, c.serie[1], 'Cara inferior g'));
      [a, b].forEach(function (x0, idx) {
        trazas.push(superficie(1, PASOS_ANGULO, function (u, v) { return gira(x0, d.g(x0) + u * (d.f(x0) - d.g(x0)), v); }, c.serie[2], idx === 0 ? 'Paredes' : null, 0.9));
      });
      var ys = muestrasX(a, b, 80).map(function (x) { return [d.f(x), d.g(x)]; });
      var flat = [].concat.apply([], ys).concat([0]);
      var yMin = Math.min.apply(null, flat);
      var yMax = Math.max.apply(null, flat);
      trazas.push({
        type: 'scatter3d', mode: 'lines', x: [k, k], y: [0, 0], z: [yMin, yMax], name: 'Eje de giro',
        line: { color: c.texto, width: 4, dash: 'dash' }, hoverinfo: 'skip'
      });
    }
    return trazas;
  }

  function dibujar3D(div, d, corte) {
    var c = G.colores();
    var eje = function (titulo) {
      return {
        title: { text: titulo, font: { color: c.texto, size: 12 } },
        gridcolor: c.rejilla, zerolinecolor: c.eje, linecolor: c.eje, tickcolor: c.eje,
        tickfont: { color: c.texto, size: 10 }, backgroundcolor: c.fondo, showbackground: false
      };
    };
    var titulos = d.horizontal ? ['x', 'y', 'z'] : ['x', 'z', 'y'];
    var layout = G.layoutBase({
      margin: { l: 0, r: 0, t: 30, b: 0 },
      dragmode: 'turntable',
      scene: {
        xaxis: eje(titulos[0]), yaxis: eje(titulos[1]), zaxis: eje(titulos[2]),
        aspectmode: 'data', bgcolor: c.fondo, dragmode: 'turntable',
        camera: { eye: d.horizontal ? { x: 1.1, y: 1.7, z: 0.9 } : { x: 1.6, y: 1.6, z: 0.9 } }
      }
    });
    delete layout.xaxis;
    delete layout.yaxis;
    return G.dibujar(div, trazas3D(d, corte), layout);
  }

  /* ---------------------------------------------------------------- */
  /* 1. Gráficas de los ejemplos resueltos                             */
  /* ---------------------------------------------------------------- */

  var graficasEjemplos = [];
  Array.prototype.forEach.call(document.querySelectorAll('[data-solido]'), function (bloque) {
    var cfg;
    try { cfg = JSON.parse(bloque.getAttribute('data-solido')); } catch (e) { return; }
    var div = bloque.querySelector('[data-grafica]');
    var d = preparar(cfg);
    if (!div || !d.ok) {
      if (div) div.innerHTML = '<p class="campo__ayuda">No se pudo preparar la gráfica.</p>';
      return;
    }
    graficasEjemplos.push(function () { dibujarRegion(div, d, cfg.n || 8); });
  });
  graficasEjemplos.forEach(function (pintar) { pintar(); });
  window.CI.alCambiarTema(function () { graficasEjemplos.forEach(function (pintar) { pintar(); }); });

  /* ---------------------------------------------------------------- */
  /* 2. Visualizador                                                   */
  /* ---------------------------------------------------------------- */

  var form = document.getElementById('vis-solido');
  if (!form) return;

  var ui = {
    fx: document.getElementById('fx'),
    gx: document.getElementById('gx'),
    a: document.getElementById('a-txt'),
    b: document.getElementById('b-txt'),
    eje: document.getElementById('eje-sel'),
    k: document.getElementById('k-txt'),
    cajaK: document.getElementById('caja-k'),
    nRango: document.getElementById('n-rango'),
    nNumero: document.getElementById('n-numero'),
    corte: document.getElementById('corte-3d'),
    chips: document.getElementById('chips-solido'),
    mensaje: document.getElementById('mensaje-solido'),
    region: document.getElementById('grafica-region'),
    solido: document.getElementById('grafica-3d'),
    lcd: document.getElementById('lcd-solido'),
    integral: document.getElementById('integral-solido')
  };
  var campos = { 'fx': ui.fx, 'gx': ui.gx, 'a-txt': ui.a, 'b-txt': ui.b, 'eje-sel': ui.eje, 'k-txt': ui.k };

  var PRESETS = [
    { nombre: 'Cono', f: 'x', g: '', a: '0', b: '3', metodo: 'discos', eje: 'hx', k: '0', n: 8 },
    { nombre: 'Esfera', f: 'sqrt(1-x^2)', g: '', a: '-1', b: '1', metodo: 'discos', eje: 'hx', k: '0', n: 12 },
    { nombre: 'Paraboloide', f: 'sqrt(x)', g: '', a: '0', b: '4', metodo: 'discos', eje: 'hx', k: '0', n: 8 },
    { nombre: 'Toro', f: '2+sqrt(1-x^2)', g: '2-sqrt(1-x^2)', a: '-1', b: '1', metodo: 'arandelas', eje: 'hx', k: '0', n: 12 },
    { nombre: 'Arandelas: x+2 y x²', f: 'x+2', g: 'x^2', a: '-1', b: '2', metodo: 'arandelas', eje: 'hx', k: '0', n: 9 },
    { nombre: 'Eje y = −1', f: 'x^2', g: '', a: '0', b: '2', metodo: 'arandelas', eje: 'hk', k: '-1', n: 8 },
    { nombre: 'Cascarones: eje y', f: '3x-x^2', g: '', a: '0', b: '3', metodo: 'cascarones', eje: 'vy', k: '0', n: 10 },
    { nombre: 'Cascarones: eje x = 2', f: 'x', g: 'x^2', a: '0', b: '1', metodo: 'cascarones', eje: 'vk', k: '2', n: 8 }
  ];

  ui.chips.innerHTML = PRESETS.map(function (p, i) {
    return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false">' + window.CI.escaparHTML(p.nombre) + '</button>';
  }).join('');

  var pendiente = false;
  var claveSolido = '';

  function metodoActual() {
    var r = form.querySelector('input[name="metodo"]:checked');
    return r ? r.value : 'discos';
  }

  function leerCfg() {
    return {
      f: ui.fx.value, g: ui.gx.value, a: ui.a.value, b: ui.b.value,
      metodo: metodoActual(), eje: ui.eje.value, k: ui.k.value
    };
  }

  function leerN() {
    var n = Math.round(Number(ui.nNumero.value));
    if (!isFinite(n)) n = 8;
    return Math.max(1, Math.min(60, n));
  }

  function compacta(t) { return V.normalizar(String(t)).replace(/\s+/g, ''); }

  function marcarChip() {
    var cfg = leerCfg();
    Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
      var p = PRESETS[Number(chip.getAttribute('data-indice'))];
      var igual = compacta(p.f) === compacta(cfg.f) && compacta(p.g) === compacta(cfg.g) && compacta(p.a) === compacta(cfg.a) &&
        compacta(p.b) === compacta(cfg.b) && p.metodo === cfg.metodo && p.eje === cfg.eje &&
        ((p.eje === 'hk' || p.eje === 'vk') ? compacta(p.k) === compacta(cfg.k) : true);
      chip.setAttribute('aria-pressed', igual ? 'true' : 'false');
    });
  }

  function marcarInvalido(id) {
    Object.keys(campos).forEach(function (clave) { campos[clave].setAttribute('aria-invalid', clave === id ? 'true' : 'false'); });
  }

  function actualizarEje() {
    ui.cajaK.hidden = !(ui.eje.value === 'hk' || ui.eje.value === 'vk');
  }

  function fallar(r) {
    marcarInvalido(r.campo);
    V.mostrarMensaje(ui.mensaje, 'error', r.error);
    ui.lcd.innerHTML = '';
    ui.integral.innerHTML = '';
    ui.region.style.opacity = '0.35';
    ui.solido.style.opacity = '0.35';
  }

  function actualizar() {
    try {
      actualizarEje();
      var cfg = leerCfg();
      var d = preparar(cfg);
      if (!d.ok) return fallar(d);
      marcarInvalido(null);
      var n = leerN();

      if (d.metodo === 'discos' && d.hayG) {
        V.mostrarMensaje(ui.mensaje, 'info', 'Con discos se ignora $g(x)$: el borde inferior de la región es el eje de giro. Para una región entre dos curvas usa arandelas.');
      } else if (d.metodo === 'arandelas' && !d.hayG) {
        V.mostrarMensaje(ui.mensaje, 'info', 'Con $g$ vacía se toma $g(x)=0$: la región queda entre $f$ y el eje $x$.');
      } else {
        V.ocultarMensaje(ui.mensaje);
      }

      var aprox = aproximar(d, n);
      var abs = Math.abs(aprox - d.referencia);
      var rel = d.referencia !== 0 ? abs / Math.abs(d.referencia) : 0;
      var nombreMetodo = d.metodo === 'discos' ? 'Discos' : d.metodo === 'arandelas' ? 'Arandelas' : 'Cascarones';
      var textoEje = d.horizontal ? 'y = ' + V.formatear(d.k, 4) : 'x = ' + V.formatear(d.k, 4);

      ui.lcd.innerHTML =
        V.lectura('Volumen de referencia', V.formatear(d.referencia, 8), true) +
        V.lectura('Aproximación con ' + tex('n=' + n), V.formatear(aprox, 8)) +
        V.lectura('Error absoluto', V.formatear(abs, 3)) +
        V.lectura('Error relativo', V.formatearPorcentaje(rel)) +
        V.lectura('Método', nombreMetodo) +
        V.lectura('Eje de giro', textoEje);

      ui.integral.innerHTML = 'Integral planteada: $$' + integralTex(d) + '=' + V.formatearTex(d.referencia, 8) + '$$';
      window.CI.renderizarMatematicas(ui.integral);

      dibujarRegion(ui.region, d, n);
      ui.region.style.opacity = '';

      var clave = [cfg.f, cfg.g, cfg.a, cfg.b, cfg.metodo, cfg.eje, d.k, ui.corte.checked].join('|');
      if (clave !== claveSolido) {
        var ok = dibujar3D(ui.solido, d, ui.corte.checked);
        claveSolido = ok ? clave : '';
        if (!ok) {
          V.mostrarMensaje(ui.mensaje, 'adv', 'No se pudo dibujar el sólido en 3D (¿se cargó Plotly y tu navegador admite WebGL?). La región y los cálculos siguen funcionando.');
        }
      }
      ui.solido.style.opacity = '';
      marcarChip();
    } catch (e) {
      fallar({ campo: null, error: 'No se pudo calcular el sólido. Revisa las funciones, los límites y el eje.' });
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

  function cargar(p) {
    ui.fx.value = p.f;
    ui.gx.value = p.g;
    ui.a.value = p.a;
    ui.b.value = p.b;
    ui.k.value = p.k;
    ui.eje.value = p.eje;
    var radio = form.querySelector('input[name="metodo"][value="' + p.metodo + '"]');
    if (radio) radio.checked = true;
    var n = p.n || 8;
    ui.nNumero.value = n;
    ui.nRango.value = n;
    claveSolido = '';
    actualizar();
  }

  ui.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (chip) cargar(PRESETS[Number(chip.getAttribute('data-indice'))]);
  });

  [ui.fx, ui.gx, ui.a, ui.b, ui.k].forEach(function (c) { c.addEventListener('input', programar); });
  ui.eje.addEventListener('change', programar);
  ui.corte.addEventListener('change', programar);

  // Al cambiar de método, el eje se ajusta a la orientación que le corresponde
  Array.prototype.forEach.call(form.querySelectorAll('input[name="metodo"]'), function (r) {
    r.addEventListener('change', function () {
      var m = metodoActual();
      if (m === 'cascarones' && esHorizontal(ui.eje.value)) ui.eje.value = ui.eje.value === 'hk' ? 'vk' : 'vy';
      if (m !== 'cascarones' && !esHorizontal(ui.eje.value)) ui.eje.value = ui.eje.value === 'vk' ? 'hk' : 'hx';
      programar();
    });
  });

  ui.nRango.addEventListener('input', function () {
    ui.nNumero.value = ui.nRango.value;
    programar();
  });
  ui.nNumero.addEventListener('input', function () {
    var v = Math.round(Number(ui.nNumero.value));
    if (isFinite(v)) ui.nRango.value = Math.max(1, Math.min(60, v));
    programar();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-solido]'), function (boton) {
    boton.addEventListener('click', function () {
      var cfg;
      try { cfg = JSON.parse(boton.getAttribute('data-cargar-solido')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(cfg);
    });
  });

  window.CI.alCambiarTema(function () { claveSolido = ''; actualizar(); });
  cargar(PRESETS[0]);
})();
