/**
 * Módulo 8 · Integrales de funciones exponenciales
 *
 * Visualizador: compara f(x) = e^{kx} (o a^{kx}) con su antiderivada
 * F(x) = f(x)/c, con c = k (base e) o c = k·ln a (base a). Un deslizador
 * controla k; el área sombreada bajo f entre a y b es la integral definida y
 * se compara con F(b) − F(a). Las gráficas de los ejemplos usan el mismo dibujo.
 */
(function () {
  'use strict';

  var V = window.Visualizador;
  var G = window.Graficas;
  var N = window.Numerics;
  if (!V || !G || !N) return;
  var tex = window.CI.tex;

  var PUNTOS_SIMPSON = 2000;
  var EPS_K = 1e-9;

  /* ---------------------------------------------------------------- */
  /* Utilidades                                                        */
  /* ---------------------------------------------------------------- */

  function valor(v) {
    if (typeof v === 'number') return v;
    var l = V.leerNumero(String(v), 'x');
    return l.ok ? l.valor : NaN;
  }

  function numeroCorto(v) {
    return String(Number(v.toFixed(4)));
  }

  function compacta(t) {
    return V.normalizar(String(t)).replace(/\s+/g, '');
  }

  function limpio(v, escala) {
    return Math.abs(v) < 1e-12 * Math.max(1, escala || 0) ? 0 : v;
  }

  function poligono(f, p, q) {
    var xs = [];
    var ys = [];
    var pasos = 80;
    for (var k = 0; k <= pasos; k++) {
      var x = p + (q - p) * k / pasos;
      xs.push(x);
      ys.push(f(x));
    }
    xs.push(q, p);
    ys.push(0, 0);
    return { x: xs, y: ys };
  }

  /** Trazas de relleno: azul sobre el eje, rojo bajo el eje. */
  function rellenos(f, p, q, c) {
    var trazas = [];
    var r = N.signedArea(f, p, q, 400);
    var pos = [];
    var neg = [];
    r.pieces.forEach(function (t) {
      (t.integral >= 0 ? pos : neg).push(poligono(f, t.a, t.b));
    });
    if (pos.length) trazas.push(G.trazaPoligonos(pos, { nombre: 'Área (+)', color: c.pos, opacidad: 0.32 }));
    if (neg.length) trazas.push(G.trazaPoligonos(neg, { nombre: 'Área (−)', color: c.neg, opacidad: 0.32 }));
    return trazas;
  }

  /**
   * Modelo f, F para la base y el valor de k dados.
   * @param {number} base 0 para la base e; si no, la base a (> 0, ≠ 1).
   * @param {number} k
   */
  function modelo(base, k) {
    var c = base === 0 ? k : k * Math.log(base);
    var f = function (x) { return Math.exp(c * x); };
    var F = Math.abs(c) < EPS_K ? function (x) { return x; } : function (x) { return Math.exp(c * x) / c; };
    return { f: f, F: F, c: c, cero: Math.abs(c) < EPS_K };
  }

  /**
   * Dibuja f, F (con C = 0), el área bajo f en [a, b] y los puntos (a, F(a)), (b, F(b)).
   * @param {HTMLElement} div
   * @param {{f: Function, F: Function, a: number, b: number, vista: number[], nombreF?: string}} o
   */
  function dibujar(div, o) {
    var c = G.colores();
    var x0 = Math.min(o.vista[0], o.a);
    var x1 = Math.max(o.vista[1], o.b);
    var curvaF = G.muestrear(o.f, x0, x1, 500);
    var curvaA = G.muestrear(o.F, x0, x1, 500);

    // Rango vertical según la zona de integración (las exponenciales crecen muy rápido)
    var ancho = o.b - o.a;
    var m0 = Math.max(x0, o.a - 0.25 * ancho);
    var m1 = Math.min(x1, o.b + 0.25 * ancho);
    var alto = 0;
    var bajo = 0;
    for (var k = 0; k <= 200; k++) {
      var x = m0 + (m1 - m0) * k / 200;
      [o.f(x), o.F(x)].forEach(function (y) {
        if (isFinite(y)) { alto = Math.max(alto, y); bajo = Math.min(bajo, y); }
      });
    }
    if (alto - bajo < 1e-9) { alto += 1; bajo -= 1; }
    var margen = 0.1 * (alto - bajo);

    var trazas = rellenos(o.f, o.a, o.b, c);
    trazas.push({
      x: curvaF.x, y: curvaF.y, type: 'scatter', mode: 'lines', name: 'f(x)',
      line: { color: c.serie[0], width: 2.5 }, hovertemplate: 'x = %{x:.3f}<br>f(x) = %{y:.4f}<extra></extra>'
    });
    trazas.push({
      x: curvaA.x, y: curvaA.y, type: 'scatter', mode: 'lines', name: o.nombreF || 'F(x) (C = 0)',
      line: { color: c.serie[1], width: 2.5, dash: 'dash' }, hovertemplate: 'x = %{x:.3f}<br>F(x) = %{y:.4f}<extra></extra>'
    });
    trazas.push({
      x: [o.a, o.b], y: [o.F(o.a), o.F(o.b)], type: 'scatter', mode: 'markers', name: 'F(a) y F(b)',
      marker: { color: c.serie[1], size: 10, line: { color: c.fondo, width: 2 } },
      hovertemplate: 'F(%{x:.3f}) = %{y:.5f}<extra></extra>'
    });
    G.dibujar(div, trazas, G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: [bajo - margen, alto + margen] },
      shapes: [G.lineaVertical(o.a, c.eje), G.lineaVertical(o.b, c.eje)],
      annotations: [G.etiquetaSuperior(o.a, 'a', c.texto), G.etiquetaSuperior(o.b, 'b', c.texto)],
      hovermode: 'x'
    }));
  }

  /* ---------------------------------------------------------------- */
  /* 1. Gráficas de los ejemplos resueltos                             */
  /* ---------------------------------------------------------------- */

  Array.prototype.forEach.call(document.querySelectorAll('[data-expo]'), function (bloque) {
    var datos;
    try { datos = JSON.parse(bloque.getAttribute('data-expo')); } catch (e) { return; }
    var div = bloque.querySelector('[data-grafica]');
    var cf = V.compilarFuncion(datos.f);
    var cF = V.compilarFuncion(datos.F);
    if (!cf.ok || !cF.ok) {
      div.innerHTML = '<p class="campo__ayuda">No se pudo preparar la gráfica (¿se cargó math.js?).</p>';
      return;
    }
    function pintar() {
      try {
        dibujar(div, { f: cf.f, F: cF.f, a: datos.a, b: datos.b, vista: datos.vista });
      } catch (e) {
        div.innerHTML = '<p class="campo__ayuda">No se pudo dibujar la gráfica.</p>';
      }
    }
    window.CI.alCambiarTema(pintar);
    pintar();
  });

  /* ---------------------------------------------------------------- */
  /* 2. Visualizador e^{kx} frente a e^{kx}/k                           */
  /* ---------------------------------------------------------------- */

  var form = document.getElementById('vis-expo');
  if (!form) return;

  var ui = {
    baseA: document.getElementById('base-a'),
    chips: document.getElementById('chips-expo'),
    mensaje: document.getElementById('mensaje-expo'),
    grafica: document.getElementById('grafica-expo'),
    kRango: document.getElementById('k-rango'),
    kNumero: document.getElementById('k-numero'),
    aRango: document.getElementById('a-rango'),
    aTexto: document.getElementById('a-texto'),
    bRango: document.getElementById('b-rango'),
    bTexto: document.getElementById('b-texto'),
    lcd: document.getElementById('lcd-expo'),
    nota: document.getElementById('nota-expo')
  };

  var EJEMPLOS = [
    { tex: 'e^{x}', base: 'e', k: 1, a: '0', b: '2', vista: [-2, 2.5] },
    { tex: 'e^{3x}', base: 'e', k: 3, a: '0', b: '1', vista: [-1, 1.3] },
    { tex: 'e^{-x/2}', base: 'e', k: -0.5, a: '0', b: '2', vista: [-2, 4] },
    { tex: 'e^{-2x}', base: 'e', k: -2, a: '0', b: '1.5', vista: [-1, 2] },
    { tex: '2^{3x}', base: 'a', baseA: '2', k: 3, a: '0', b: '1', vista: [-1, 1.3] },
    { tex: '10^{x}', base: 'a', baseA: '10', k: 1, a: '0', b: '1', vista: [-1, 1.5] },
    { tex: '(\\tfrac12)^{x}', base: 'a', baseA: '1/2', k: 1, a: '0', b: '3', vista: [-1, 4] },
    { tex: 'k=0\\ (f=1)', base: 'e', k: 0, a: '0', b: '2', vista: [-1, 3] }
  ];

  var estado = { vista: [-2, 2.5], base: 'e' };
  var pendiente = false;

  ui.chips.innerHTML = EJEMPLOS.map(function (e, i) {
    return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false">' + tex(e.tex) + '</button>';
  }).join('');

  function baseActual() {
    var marcado = form.querySelector('input[name="base"]:checked');
    return marcado ? marcado.value : 'e';
  }

  function mostrarSegunBase() {
    Array.prototype.forEach.call(form.querySelectorAll('[data-solo-base]'), function (el) {
      el.hidden = el.getAttribute('data-solo-base') !== estado.base;
    });
  }

  function marcarChip() {
    Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
      var e = EJEMPLOS[Number(chip.getAttribute('data-indice'))];
      var igual = e.base === estado.base &&
        (e.base === 'e' || compacta(e.baseA) === compacta(ui.baseA.value)) &&
        Math.abs(e.k - Number(ui.kNumero.value)) < 1e-9 &&
        compacta(e.a) === compacta(ui.aTexto.value) && compacta(e.b) === compacta(ui.bTexto.value);
      chip.setAttribute('aria-pressed', igual ? 'true' : 'false');
    });
  }

  function configurarDeslizadores() {
    var paso = (estado.vista[1] - estado.vista[0]) / 500;
    [ui.aRango, ui.bRango].forEach(function (r) {
      r.min = estado.vista[0];
      r.max = estado.vista[1];
      r.step = paso;
    });
  }

  function incluirEnVista(v) {
    var margen = 0.1 * (estado.vista[1] - estado.vista[0]);
    if (v < estado.vista[0]) estado.vista[0] = v - margen;
    if (v > estado.vista[1]) estado.vista[1] = v + margen;
    configurarDeslizadores();
  }

  function sincronizar(texto, rango) {
    var l = V.leerNumero(texto.value, 'x');
    if (!l.ok) return;
    incluirEnVista(l.valor);
    rango.value = l.valor;
  }

  function marcarInvalido(control) {
    [ui.baseA, ui.kNumero, ui.aTexto, ui.bTexto].forEach(function (c) {
      c.setAttribute('aria-invalid', c === control ? 'true' : 'false');
    });
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
      var k = Number(ui.kNumero.value);
      if (ui.kNumero.value.trim() === '' || !isFinite(k)) return fallar(ui.kNumero, 'Escribe un valor numérico para $k$, por ejemplo <code>1.5</code> o <code>-2</code>.');
      if (Math.abs(k) > 10) return fallar(ui.kNumero, 'Usa un valor de $k$ entre $-10$ y $10$: con $|k|$ grande la exponencial se sale de la gráfica.', 'adv');

      var base = 0;
      if (estado.base === 'a') {
        var lb0 = V.leerNumero(ui.baseA.value, 'a');
        if (!lb0.ok) return fallar(ui.baseA, lb0.error);
        if (!(lb0.valor > 0) || Math.abs(lb0.valor - 1) < 1e-12) {
          return fallar(ui.baseA, 'La base debe cumplir $a&gt;0$ y $a\\neq1$: con $a=' + V.formatearTex(lb0.valor) + '$ la fórmula $a^{kx}/(k\\ln a)$ no se puede usar.');
        }
        base = lb0.valor;
      }
      var la = V.leerNumero(ui.aTexto.value, 'a');
      if (!la.ok) return fallar(ui.aTexto, la.error);
      var lb = V.leerNumero(ui.bTexto.value, 'b');
      if (!lb.ok) return fallar(ui.bTexto, lb.error);
      if (la.valor >= lb.valor) {
        return fallar(ui.bTexto, 'El límite inferior debe ser menor que el superior: ahora $a=' + V.formatearTex(la.valor) +
          '$ y $b=' + V.formatearTex(lb.valor) + '$.', 'adv');
      }
      marcarInvalido(null);

      var m = modelo(base, k);
      var a = la.valor;
      var b = lb.valor;
      var numerica = N.simpson(m.f, a, b, PUNTOS_SIMPSON);
      var exacta = m.F(b) - m.F(a);
      var escala = Math.abs(numerica) + Math.abs(exacta);
      numerica = limpio(numerica, escala);
      exacta = limpio(exacta, escala);
      var dif = Math.abs(numerica - exacta);

      dibujar(ui.grafica, {
        f: m.f, F: m.F, a: a, b: b, vista: estado.vista,
        nombreF: m.cero ? 'F(x) = x (C = 0)' : 'F(x) = f(x)/' + (base === 0 ? 'k' : 'k·ln a') + ' (C = 0)'
      });

      var fTex = base === 0 ? 'e^{kx}' : 'a^{kx}';
      var cTex = base === 0 ? 'k' : 'k\\ln a';
      if (m.cero) {
        V.mostrarMensaje(ui.mensaje, 'info', 'Con $k=0$ el integrando es $f(x)=1$ y su antiderivada es $F(x)=x$; la fórmula $' + fTex + '/(' + cTex + ')$ no aplica porque divide entre cero. El área es $b-a=' + V.formatearTex(b - a, 7) + '$.');
      } else {
        V.mostrarMensaje(ui.mensaje, 'exito', 'Con $k=' + V.formatearTex(k, 4) + '$: $F(x)=\\dfrac{' + fTex + '}{' + cTex + '}$ y $\\int_a^b f\\,dx=F(b)-F(a)=' + V.formatearTex(exacta, 7) + '$.');
      }

      ui.lcd.innerHTML =
        V.lectura(tex('\\int_a^b f(x)\\,dx') + ' (Simpson)', V.formatear(numerica, 9), true) +
        V.lectura(tex('F(b)-F(a)'), V.formatear(exacta, 9), true) +
        V.lectura('Diferencia', V.formatear(dif, 3)) +
        V.lectura(tex('F(a)') + ' y ' + tex('F(b)'), V.formatear(m.F(a), 6) + '; ' + V.formatear(m.F(b), 6)) +
        V.lectura(tex('f(a)') + ' y ' + tex('f(b)'), V.formatear(m.f(a), 6) + '; ' + V.formatear(m.f(b), 6)) +
        V.lectura(m.cero ? 'Divisor' : 'Divisor ' + tex(cTex), m.cero ? 'no hay (k = 0)' : V.formatear(m.c, 6));

      var texto;
      if (m.cero) {
        texto = 'Con $k=0$, $f$ es la constante $1$: sombrea un rectángulo de base $b-a$.';
      } else if (m.c > 0) {
        texto = 'Como $' + cTex + '&gt;0$, $f$ crece y $F=\\tfrac{f}{' + cTex + '}$ es una versión de $f$ dividida entre ' + V.formatearTex(m.c, 4) + ': ' +
          (m.c > 1 ? 'queda por debajo de $f$.' : 'queda por encima de $f$.');
      } else {
        texto = 'Como $' + cTex + '&lt;0$, $f$ decrece pero $F=\\tfrac{f}{' + cTex + '}$ es negativa y creciente: su pendiente es $F\'=f&gt;0$.';
      }
      ui.nota.innerHTML = texto;
      window.CI.renderizarMatematicas(ui.nota);

      ui.grafica.style.opacity = '';
      marcarChip();
    } catch (e) {
      fallar(null, V.mensajeDeError ? V.mensajeDeError(e) : 'Ocurrió un problema al calcular. Revisa los datos.');
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

  function fijarK(k) {
    ui.kNumero.value = String(k);
    ui.kRango.value = String(Math.max(-3, Math.min(3, k)));
  }

  function cargar(d) {
    if (d.base) {
      estado.base = d.base;
      var radio = form.querySelector('input[name="base"][value="' + d.base + '"]');
      if (radio) radio.checked = true;
      mostrarSegunBase();
    }
    if (d.baseA !== undefined) ui.baseA.value = d.baseA;
    if (d.k !== undefined) fijarK(d.k);
    if (d.a !== undefined) ui.aTexto.value = d.a;
    if (d.b !== undefined) ui.bTexto.value = d.b;
    estado.vista = (d.vista || [-2, 3]).slice();
    configurarDeslizadores();
    sincronizar(ui.aTexto, ui.aRango);
    sincronizar(ui.bTexto, ui.bRango);
    actualizar();
  }

  Array.prototype.forEach.call(form.querySelectorAll('input[name="base"]'), function (radio) {
    radio.addEventListener('change', function () {
      estado.base = baseActual();
      mostrarSegunBase();
      if (estado.base === 'a' && !ui.baseA.value.trim()) ui.baseA.value = '2';
      actualizar();
    });
  });

  ui.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (chip) cargar(EJEMPLOS[Number(chip.getAttribute('data-indice'))]);
  });

  ui.baseA.addEventListener('input', programar);
  ui.kRango.addEventListener('input', function () {
    ui.kNumero.value = ui.kRango.value;
    programar();
  });
  ui.kNumero.addEventListener('input', function () {
    var v = Number(ui.kNumero.value);
    if (isFinite(v) && ui.kNumero.value.trim() !== '') ui.kRango.value = Math.max(-3, Math.min(3, v));
    programar();
  });

  [[ui.aRango, ui.aTexto], [ui.bRango, ui.bTexto]].forEach(function (par) {
    par[0].addEventListener('input', function () {
      par[1].value = numeroCorto(Number(par[0].value));
      programar();
    });
    par[1].addEventListener('input', function () {
      sincronizar(par[1], par[0]);
      programar();
    });
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-expo]'), function (boton) {
    boton.addEventListener('click', function () {
      var datos;
      try { datos = JSON.parse(boton.getAttribute('data-cargar-expo')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(datos);
    });
  });

  window.CI.alCambiarTema(actualizar);
  mostrarSegunBase();
  cargar(EJEMPLOS[1]);
})();
