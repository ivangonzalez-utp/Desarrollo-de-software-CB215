/**
 * Módulo 11 · Integrales con trigonométricas inversas
 *
 * Tres formas (con a > 0):
 *   1. 1/√(a² − u²)      → arcsen(u/a),            dominio |u| < a
 *   2. 1/(a² + u²)       → (1/a)·arctan(u/a),      todos los reales
 *   3. 1/(u√(u² − a²))   → (1/a)·arcsec(|u|/a),    dominio |u| > a (una sola rama)
 *
 * El visualizador dibuja el integrando con su dominio, sombrea el área entre
 * los límites y compara F(u₂) − F(u₁) con la regla de Simpson. Si los límites
 * salen del dominio muestra un mensaje explicando por qué.
 * También dibuja las gráficas de los ejemplos resueltos.
 */
(function () {
  'use strict';

  var V = window.Visualizador;
  var G = window.Graficas;
  var N = window.Numerics;
  if (!V || !G || !N) return;
  var tex = window.CI.tex;

  /* ---------------------------------------------------------------- */
  /* Modelo matemático de las tres formas                              */
  /* ---------------------------------------------------------------- */

  var FORMAS = {
    1: {
      integrando: function (a) { return function (u) { return Math.abs(u) < a ? 1 / Math.sqrt(a * a - u * u) : NaN; }; },
      antiderivada: function (a) { return function (u) { return Math.asin(u / a); }; },
      vistaBase: function (a) { return [-1.4 * a, 1.4 * a]; },
      limitesPorDefecto: function (a) { return [-0.5 * a, 0.8 * a]; },
      texIntegrando: function (a) { return '\\dfrac{1}{\\sqrt{' + V.formatearTex(a * a, 4) + '-u^2}}'; },
      texF: function (a) { return '\\arcsin\\dfrac{u}{' + V.formatearTex(a, 4) + '}'; },
      texDominio: function (a) { return '|u|<' + V.formatearTex(a, 4); },
      /** Devuelve null si [p, q] es válido, o el mensaje de error. */
      validar: function (a, p, q) {
        if (p > -a && q < a) return null;
        return 'Con $a=' + V.formatearTex(a, 4) + '$ el integrando $\\frac{1}{\\sqrt{a^2-u^2}}$ solo existe para $-a&lt;u&lt;a$, es decir, $|u|&lt;' +
          V.formatearTex(a, 4) + '$. Tus límites son $u_1=' + V.formatearTex(p, 4) + '$ y $u_2=' + V.formatearTex(q, 4) +
          '$, y alguno queda fuera (o justo en $\\pm a$, donde la raíz se anula y la integral es impropia). Elige límites dentro del intervalo $(-a,a)$.';
      }
    },
    2: {
      integrando: function (a) { return function (u) { return 1 / (a * a + u * u); }; },
      antiderivada: function (a) { return function (u) { return Math.atan(u / a) / a; }; },
      vistaBase: function (a) { return [-3 * a, 3 * a]; },
      limitesPorDefecto: function (a) { return [-a, a]; },
      texIntegrando: function (a) { return '\\dfrac{1}{' + V.formatearTex(a * a, 4) + '+u^2}'; },
      texF: function (a) { return '\\dfrac{1}{' + V.formatearTex(a, 4) + '}\\arctan\\dfrac{u}{' + V.formatearTex(a, 4) + '}'; },
      texDominio: function () { return 'u\\in\\mathbb{R}'; },
      validar: function () { return null; }
    },
    3: {
      integrando: function (a) {
        return function (u) { return Math.abs(u) > a ? 1 / (u * Math.sqrt(u * u - a * a)) : NaN; };
      },
      antiderivada: function (a) { return function (u) { return Math.acos(a / Math.abs(u)) / a; }; },
      vistaBase: function (a) { return [-3.2 * a, 3.2 * a]; },
      limitesPorDefecto: function (a) { return [1.5 * a, 3 * a]; },
      texIntegrando: function (a) { return '\\dfrac{1}{u\\sqrt{u^2-' + V.formatearTex(a * a, 4) + '}}'; },
      texF: function (a) { return '\\dfrac{1}{' + V.formatearTex(a, 4) + '}\\operatorname{arcsec}\\dfrac{|u|}{' + V.formatearTex(a, 4) + '}'; },
      texDominio: function (a) { return '|u|>' + V.formatearTex(a, 4); },
      validar: function (a, p, q) {
        if ((p > a && q > a) || (p < -a && q < -a)) return null;
        var cruza = p < a && q > -a && p <= -a && q >= a;
        return 'Con $a=' + V.formatearTex(a, 4) + '$ el integrando $\\frac{1}{u\\sqrt{u^2-a^2}}$ solo existe para $|u|&gt;a$, en dos ramas separadas: $u&gt;' +
          V.formatearTex(a, 4) + '$ o $u&lt;-' + V.formatearTex(a, 4) + '$. ' +
          (cruza ? 'El intervalo elegido atraviesa la zona prohibida $[-a,a]$. ' : 'Tus límites son $u_1=' + V.formatearTex(p, 4) + '$ y $u_2=' + V.formatearTex(q, 4) + '$ y alguno cae en $|u|\\le a$. ') +
          'Escribe los dos límites en una misma rama, por ejemplo ambos mayores que $a$.';
      }
    }
  };

  var EJEMPLOS = [
    { tex: '\\tfrac{1}{\\sqrt{4-u^2}}', forma: 1, a: 2, p: '-1', q: '1.5' },
    { tex: '\\tfrac{1}{\\sqrt{1-u^2}}', forma: 1, a: 1, p: '0', q: '0.8' },
    { tex: '\\tfrac{1}{1+u^2}', forma: 2, a: 1, p: '-1', q: '1' },
    { tex: '\\tfrac{1}{9+u^2}', forma: 2, a: 3, p: '0', q: '5' },
    { tex: '\\tfrac{1}{u\\sqrt{u^2-4}}', forma: 3, a: 2, p: '3', q: '6' },
    { tex: '\\tfrac{1}{u\\sqrt{u^2-1}}\\ (u<0)', forma: 3, a: 1, p: '-3', q: '-1.5' },
    { tex: '\\text{fuera del dominio}', forma: 1, a: 1, p: '0', q: '1.5' }
  ];

  /* ---------------------------------------------------------------- */
  /* Dibujo                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Dibuja el integrando de la forma indicada. Si hay límites válidos sombrea el área.
   * @param {HTMLElement} div
   * @param {{forma: number, a: number, vista: number[], p?: number, q?: number}} o
   * @param {boolean} sombrear
   */
  function dibujar(div, o, sombrear) {
    var c = G.colores();
    var modelo = FORMAS[o.forma];
    var f = modelo.integrando(o.a);
    var x0 = o.vista[0];
    var x1 = o.vista[1];
    var curva = G.muestrear(f, x0, x1, 700);
    var trazas = [];
    var rangos = [curva.y];

    if (sombrear) {
      var xs = [];
      var ys = [];
      var k;
      for (k = 0; k <= 160; k++) {
        var x = o.p + (o.q - o.p) * k / 160;
        xs.push(x);
        ys.push(f(x));
      }
      var base = xs.slice().reverse();
      var positivo = f((o.p + o.q) / 2) >= 0;
      trazas.push(G.trazaPoligonos([{ x: xs.concat(base), y: ys.concat(base.map(function () { return 0; })) }], {
        nombre: 'Área entre u₁ y u₂', color: positivo ? c.pos : c.neg, opacidad: 0.34
      }));
    }
    trazas.push({
      x: curva.x, y: curva.y, type: 'scatter', mode: 'lines', name: 'Integrando',
      line: { color: c.curva, width: 2.5 }, hovertemplate: 'u = %{x:.4f}<br>f(u) = %{y:.5f}<extra></extra>'
    });

    var shapes = [];
    var anotaciones = [];
    if (o.forma !== 2) {
      [-o.a, o.a].forEach(function (x) {
        shapes.push(Object.assign({}, G.lineaVertical(x, c.eje), { line: { color: c.eje, width: 1.2, dash: 'dot' } }));
      });
    }
    if (sombrear) {
      shapes.push(G.lineaVertical(o.p, c.eje), G.lineaVertical(o.q, c.eje));
      anotaciones.push(G.etiquetaSuperior(o.p, 'u₁', c.texto), G.etiquetaSuperior(o.q, 'u₂', c.texto));
    }
    var rango = G.rangoY(rangos, { incluir: [0], recorte: 0.04 });
    // En las formas con asíntotas se limita el pico para que la curva sea legible
    if (o.forma !== 2) rango[1] = Math.min(rango[1], 8 / o.a);
    if (o.forma === 3) rango[0] = Math.max(rango[0], -8 / o.a);
    G.dibujar(div, trazas, G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'u' } },
      yaxis: { range: rango },
      shapes: shapes,
      annotations: anotaciones,
      hovermode: 'x'
    }));
  }

  /** Vista que cubre la base de la forma y los límites dados. */
  function vistaCon(forma, a, p, q) {
    var v = FORMAS[forma].vistaBase(a).slice();
    [p, q].forEach(function (x) {
      if (typeof x !== 'number' || !isFinite(x)) return;
      var m = 0.1 * (v[1] - v[0]);
      if (x < v[0]) v[0] = x - m;
      if (x > v[1]) v[1] = x + m;
    });
    return v;
  }

  /* ---------------------------------------------------------------- */
  /* 1. Gráficas de los ejemplos                                       */
  /* ---------------------------------------------------------------- */

  var graficasEjemplos = [];
  Array.prototype.forEach.call(document.querySelectorAll('[data-grafica-trig]'), function (div) {
    var datos;
    try { datos = JSON.parse(div.getAttribute('data-grafica-trig')); } catch (e) { return; }
    var lp = V.leerNumero(datos.p, 'u₁');
    var lq = V.leerNumero(datos.q, 'u₂');
    if (!lp.ok || !lq.ok) return;
    var o = { forma: datos.forma, a: datos.a, p: lp.valor, q: lq.valor, vista: vistaCon(datos.forma, datos.a, lp.valor, lq.valor) };
    graficasEjemplos.push(function () { dibujar(div, o, true); });
  });
  graficasEjemplos.forEach(function (pintar) { pintar(); });
  if (graficasEjemplos.length) {
    window.CI.alCambiarTema(function () { graficasEjemplos.forEach(function (pintar) { pintar(); }); });
  }

  /* ---------------------------------------------------------------- */
  /* 2. Visualizador                                                   */
  /* ---------------------------------------------------------------- */

  var form = document.getElementById('vis-trig-inv');
  if (!form) return;

  var ui = {
    chips: document.getElementById('chips-trig-inv'),
    mensaje: document.getElementById('mensaje-trig-inv'),
    grafica: document.getElementById('grafica-trig-inv'),
    aRango: document.getElementById('a-param-rango'),
    aNumero: document.getElementById('a-param-numero'),
    pRango: document.getElementById('u1-rango'),
    pTexto: document.getElementById('u1-texto'),
    qRango: document.getElementById('u2-rango'),
    qTexto: document.getElementById('u2-texto'),
    lcd: document.getElementById('lcd-trig-inv'),
    nota: document.getElementById('nota-trig-inv')
  };

  var pendiente = false;

  function numeroCorto(v) { return String(Number(v.toFixed(4))); }

  function formaActual() {
    var marcado = form.querySelector('input[name="forma"]:checked');
    return marcado ? Number(marcado.value) : 1;
  }

  function leerA() {
    var a = Number(ui.aNumero.value);
    return isFinite(a) && a > 0 ? a : NaN;
  }

  ui.chips.innerHTML = EJEMPLOS.map(function (e, i) {
    return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false">' + tex(e.tex) + '</button>';
  }).join('');

  function marcarChip() {
    var forma = formaActual();
    var a = leerA();
    var p = V.leerNumero(ui.pTexto.value, 'u₁');
    var q = V.leerNumero(ui.qTexto.value, 'u₂');
    Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
      var e = EJEMPLOS[Number(chip.getAttribute('data-indice'))];
      var igual = e.forma === forma && Math.abs(e.a - a) < 1e-9 && p.ok && q.ok &&
        Math.abs(Number(e.p) - p.valor) < 1e-9 && Math.abs(Number(e.q) - q.valor) < 1e-9;
      chip.setAttribute('aria-pressed', igual ? 'true' : 'false');
    });
  }

  function marcarInvalido(control) {
    [ui.aNumero, ui.pTexto, ui.qTexto].forEach(function (c) { c.setAttribute('aria-invalid', c === control ? 'true' : 'false'); });
  }

  function configurarDeslizadores(vista) {
    var paso = (vista[1] - vista[0]) / 600;
    [ui.pRango, ui.qRango].forEach(function (r) {
      r.min = vista[0];
      r.max = vista[1];
      r.step = paso;
    });
  }

  function sincronizarDeslizador(texto, rango) {
    var l = V.leerNumero(texto.value, 'u');
    if (l.ok) rango.value = l.valor;
  }

  function fallar(control, html, tipo) {
    marcarInvalido(control);
    V.mostrarMensaje(ui.mensaje, tipo || 'error', html);
    ui.lcd.innerHTML = '';
    ui.nota.innerHTML = '';
    ui.grafica.style.opacity = '0.35';
  }

  function actualizar() {
    try {
      var forma = formaActual();
      var modelo = FORMAS[forma];
      var a = leerA();
      if (!isFinite(a)) return fallar(ui.aNumero, 'El parámetro $a$ debe ser un número positivo (entre 0.5 y 5).');
      var lp = V.leerNumero(ui.pTexto.value, 'u_1');
      if (!lp.ok) return fallar(ui.pTexto, lp.error);
      var lq = V.leerNumero(ui.qTexto.value, 'u_2');
      if (!lq.ok) return fallar(ui.qTexto, lq.error);
      var p = lp.valor;
      var q = lq.valor;

      var vista = vistaCon(forma, a, p, q);
      configurarDeslizadores(vista);
      sincronizarDeslizador(ui.pTexto, ui.pRango);
      sincronizarDeslizador(ui.qTexto, ui.qRango);

      if (p >= q) {
        dibujar(ui.grafica, { forma: forma, a: a, vista: vista }, false);
        return fallar(ui.qTexto, 'El límite inferior debe ser menor que el superior: ahora $u_1=' + V.formatearTex(p) + '$ y $u_2=' +
          V.formatearTex(q) + '$. Intercambia los valores (recuerda que $\\int_{u_2}^{u_1}=-\\int_{u_1}^{u_2}$).', 'adv');
      }
      var problema = modelo.validar(a, p, q);
      if (problema) {
        dibujar(ui.grafica, { forma: forma, a: a, vista: vista }, false);
        return fallar(ui.pTexto, problema, 'adv');
      }

      marcarInvalido(null);
      V.ocultarMensaje(ui.mensaje);
      var f = modelo.integrando(a);
      var F = modelo.antiderivada(a);
      var exacto = F(q) - F(p);
      var simpson = N.simpson(f, p, q, 1000);
      var dif = Math.abs(exacto - simpson);

      dibujar(ui.grafica, { forma: forma, a: a, vista: vista, p: p, q: q }, true);
      ui.grafica.style.opacity = '';

      ui.lcd.innerHTML =
        V.lectura(tex('F(u_2)-F(u_1)'), V.formatear(exacto, 9), true) +
        V.lectura('Simpson ' + tex('n=1000'), V.formatear(simpson, 9)) +
        V.lectura('Diferencia', dif < 1e-12 ? '< 1e-12' : V.formatear(dif, 3)) +
        V.lectura(tex('F(u_1)'), V.formatear(F(p), 7)) +
        V.lectura(tex('F(u_2)'), V.formatear(F(q), 7)) +
        V.lectura('Dominio', tex(modelo.texDominio(a)));

      ui.nota.innerHTML = 'Integrando $f(u)=' + modelo.texIntegrando(a) + '$ y antiderivada $F(u)=' + modelo.texF(a) + '$. ' +
        'Entonces $F(u_2)-F(u_1)=' + V.formatearTex(F(q), 7) + '-\\left(' + V.formatearTex(F(p), 7) + '\\right)=' + V.formatearTex(exacto, 7) + '$.' +
        (exacto < 0 ? ' El resultado es negativo porque en esa rama $f(u)&lt;0$.' : '');
      window.CI.renderizarMatematicas(ui.nota);
      marcarChip();
    } catch (e) {
      fallar(null, V.mensajeDeError(e));
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

  /**
   * Carga una configuración completa.
   * @param {{forma: number, a: number, p?: string, q?: string}} d Sin p y q usa los límites por defecto.
   */
  function cargar(d) {
    var radio = form.querySelector('input[name="forma"][value="' + d.forma + '"]');
    if (radio) radio.checked = true;
    ui.aNumero.value = String(d.a);
    ui.aRango.value = String(d.a);
    if (d.p === undefined || d.q === undefined) {
      var por = FORMAS[d.forma].limitesPorDefecto(d.a);
      ui.pTexto.value = numeroCorto(por[0]);
      ui.qTexto.value = numeroCorto(por[1]);
    } else {
      ui.pTexto.value = d.p;
      ui.qTexto.value = d.q;
    }
    actualizar();
  }

  Array.prototype.forEach.call(form.querySelectorAll('input[name="forma"]'), function (radio) {
    radio.addEventListener('change', function () {
      var a = leerA();
      cargar({ forma: formaActual(), a: isFinite(a) ? a : 2 });
    });
  });

  ui.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (chip) cargar(EJEMPLOS[Number(chip.getAttribute('data-indice'))]);
  });

  ui.aRango.addEventListener('input', function () {
    ui.aNumero.value = ui.aRango.value;
    programar();
  });
  ui.aNumero.addEventListener('input', function () {
    var v = Number(ui.aNumero.value);
    if (isFinite(v)) ui.aRango.value = Math.max(0.5, Math.min(5, v));
    programar();
  });

  [[ui.pRango, ui.pTexto], [ui.qRango, ui.qTexto]].forEach(function (par) {
    par[0].addEventListener('input', function () {
      par[1].value = numeroCorto(Number(par[0].value));
      programar();
    });
    par[1].addEventListener('input', programar);
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-trig]'), function (boton) {
    boton.addEventListener('click', function () {
      var datos;
      try { datos = JSON.parse(boton.getAttribute('data-cargar-trig')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(datos);
    });
  });

  window.CI.alCambiarTema(actualizar);
  cargar(EJEMPLOS[0]);
})();
