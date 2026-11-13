/**
 * Módulo 12 · Integrales con hiperbólicas inversas
 *
 * Tres formas (con a > 0):
 *   1. 1/√(u² + a²)  → senh⁻¹(u/a)            = ln(u + √(u² + a²)) − ln a
 *   2. 1/√(u² − a²)  → cosh⁻¹(u/a), |u| > a   (en la rama u < −a: −cosh⁻¹(|u|/a))
 *   3. 1/(a² − u²)   → (1/a)·tanh⁻¹(u/a) si |u| < a; (1/a)·coth⁻¹(u/a) si |u| > a
 *
 * El visualizador compara la antiderivada hiperbólica inversa con su forma
 * logarítmica (difieren en una constante: ln a en las formas 1 y 2, ninguna en
 * la 3), calcula la integral definida con ambas y con Simpson, y avisa con un
 * mensaje claro cuando los límites salen del dominio.
 * También dibuja las gráficas de los ejemplos resueltos.
 */
(function () {
  'use strict';

  var V = window.Visualizador;
  var G = window.Graficas;
  var N = window.Numerics;
  if (!V || !G || !N) return;
  var tex = window.CI.tex;

  var fa = function (a) { return V.formatearTex(a, 4); };

  /* ---------------------------------------------------------------- */
  /* Modelo matemático de las tres formas                              */
  /* ---------------------------------------------------------------- */

  var FORMAS = {
    1: {
      integrando: function (a) { return function (u) { return 1 / Math.sqrt(u * u + a * a); }; },
      hip: function (a) { return function (u) { return Math.asinh(u / a); }; },
      log: function (a) { return function (u) { return Math.log(u + Math.sqrt(u * u + a * a)); }; },
      nombreHip: 'senh⁻¹(u/a)',
      nombreLog: 'ln(u + √(u²+a²))',
      constante: function (a) { return Math.log(a); },
      vistaBase: function (a) { return [-3 * a, 3 * a]; },
      limitesPorDefecto: function (a) { return [0, 2 * a]; },
      texIntegrando: function (a) { return '\\dfrac{1}{\\sqrt{u^2+' + fa(a * a) + '}}'; },
      texHip: function (a) { return '\\operatorname{senh}^{-1}\\dfrac{u}{' + fa(a) + '}'; },
      texLog: function (a) { return '\\ln\\left(u+\\sqrt{u^2+' + fa(a * a) + '}\\right)'; },
      texDominio: function () { return 'u\\in\\mathbb{R}'; },
      validar: function () { return null; }
    },
    2: {
      integrando: function (a) { return function (u) { return Math.abs(u) > a ? 1 / Math.sqrt(u * u - a * a) : NaN; }; },
      hip: function (a) {
        return function (u) { return Math.abs(u) > a ? (u > 0 ? 1 : -1) * Math.acosh(Math.abs(u) / a) : NaN; };
      },
      log: function (a) {
        return function (u) { return Math.abs(u) > a ? Math.log(Math.abs(u + Math.sqrt(u * u - a * a))) : NaN; };
      },
      nombreHip: 'cosh⁻¹(u/a)',
      nombreLog: 'ln|u + √(u²−a²)|',
      constante: function (a) { return Math.log(a); },
      vistaBase: function (a) { return [-3.2 * a, 3.2 * a]; },
      limitesPorDefecto: function (a) { return [1.5 * a, 3 * a]; },
      texIntegrando: function (a) { return '\\dfrac{1}{\\sqrt{u^2-' + fa(a * a) + '}}'; },
      texHip: function (a) { return '\\cosh^{-1}\\dfrac{u}{' + fa(a) + '}'; },
      texLog: function (a) { return '\\ln\\left|u+\\sqrt{u^2-' + fa(a * a) + '}\\right|'; },
      texDominio: function (a) { return '|u|>' + fa(a); },
      validar: function (a, p, q) {
        if ((p > a && q > a) || (p < -a && q < -a)) return null;
        return 'Con $a=' + fa(a) + '$ el integrando $\\frac{1}{\\sqrt{u^2-a^2}}$ solo existe para $|u|&gt;a$, en dos ramas separadas ($u&gt;' + fa(a) +
          '$ o $u&lt;-' + fa(a) + '$). Tus límites son $u_1=' + fa(p) + '$ y $u_2=' + fa(q) +
          '$: alguno cae en $|u|\\le a$ o están en ramas distintas. Escribe los dos en la misma rama, por ejemplo ambos mayores que $a$.';
      }
    },
    3: {
      integrando: function (a) {
        return function (u) { return Math.abs(Math.abs(u) - a) < 1e-12 ? NaN : 1 / (a * a - u * u); };
      },
      hip: function (a) {
        return function (u) {
          if (Math.abs(u) < a) return Math.atanh(u / a) / a;
          if (Math.abs(u) > a) return Math.atanh(a / u) / a; // coth⁻¹(u/a)
          return NaN;
        };
      },
      log: function (a) {
        return function (u) {
          return Math.abs(Math.abs(u) - a) < 1e-12 ? NaN : Math.log(Math.abs((a + u) / (a - u))) / (2 * a);
        };
      },
      nombreHip: '(1/a)·tanh⁻¹(u/a)  [coth⁻¹ si |u|>a]',
      nombreLog: '(1/2a)·ln|(a+u)/(a−u)|',
      constante: function () { return 0; },
      vistaBase: function (a) { return [-2.5 * a, 2.5 * a]; },
      limitesPorDefecto: function (a) { return [-0.5 * a, 0.5 * a]; },
      texIntegrando: function (a) { return '\\dfrac{1}{' + fa(a * a) + '-u^2}'; },
      texHip: function (a) { return '\\dfrac{1}{' + fa(a) + '}\\tanh^{-1}\\dfrac{u}{' + fa(a) + '}'; },
      texLog: function (a) { return '\\dfrac{1}{' + fa(2 * a) + '}\\ln\\left|\\dfrac{' + fa(a) + '+u}{' + fa(a) + '-u}\\right|'; },
      texDominio: function (a) { return 'u\\neq\\pm' + fa(a); },
      validar: function (a, p, q) {
        if ((p > -a && q < a) || (p > a && q > a) || (p < -a && q < -a)) return null;
        return 'Con $a=' + fa(a) + '$ el integrando $\\frac{1}{a^2-u^2}$ no existe en $u=\\pm' + fa(a) + '$ (asíntotas verticales), y la integral no converge si el intervalo las contiene o las toca. ' +
          'Tus límites son $u_1=' + fa(p) + '$ y $u_2=' + fa(q) + '$. Elige ambos dentro de $(-a,a)$, ambos mayores que $a$ o ambos menores que $-a$.';
      }
    }
  };

  var EJEMPLOS = [
    { tex: '\\tfrac{1}{\\sqrt{u^2+1}}', forma: 1, a: 1, p: '0', q: '2' },
    { tex: '\\tfrac{1}{\\sqrt{u^2+9}}', forma: 1, a: 3, p: '-3', q: '3' },
    { tex: '\\tfrac{1}{\\sqrt{u^2-1}}', forma: 2, a: 1, p: '2', q: '5' },
    { tex: '\\tfrac{1}{\\sqrt{u^2-4}}\\ (u<0)', forma: 2, a: 2, p: '-6', q: '-3' },
    { tex: '\\tfrac{1}{4-u^2}', forma: 3, a: 2, p: '-1', q: '1' },
    { tex: '\\tfrac{1}{1-u^2}\\ (u>1)', forma: 3, a: 1, p: '2', q: '5' },
    { tex: '\\text{cruza una asíntota}', forma: 3, a: 1, p: '0', q: '2' }
  ];

  /* ---------------------------------------------------------------- */
  /* Dibujo                                                            */
  /* ---------------------------------------------------------------- */

  /** Gráfica del integrando; sombrea el área si hay límites válidos. */
  function dibujarIntegrando(div, o, sombrear) {
    var c = G.colores();
    var modelo = FORMAS[o.forma];
    var f = modelo.integrando(o.a);
    var curva = G.muestrear(f, o.vista[0], o.vista[1], 700);
    var trazas = [];
    if (sombrear) {
      var xs = [];
      var ys = [];
      var k;
      for (k = 0; k <= 160; k++) {
        var x = o.p + (o.q - o.p) * k / 160;
        xs.push(x);
        ys.push(f(x));
      }
      var atras = xs.slice().reverse();
      trazas.push(G.trazaPoligonos([{ x: xs.concat(atras), y: ys.concat(atras.map(function () { return 0; })) }], {
        nombre: 'Área entre u₁ y u₂', color: f((o.p + o.q) / 2) >= 0 ? c.pos : c.neg, opacidad: 0.34
      }));
    }
    trazas.push({
      x: curva.x, y: curva.y, type: 'scatter', mode: 'lines', name: 'Integrando',
      line: { color: c.curva, width: 2.5 }, hovertemplate: 'u = %{x:.4f}<br>f(u) = %{y:.5f}<extra></extra>'
    });
    var shapes = [];
    var notas = [];
    if (o.forma !== 1) {
      [-o.a, o.a].forEach(function (x) {
        shapes.push(Object.assign({}, G.lineaVertical(x, c.eje), { line: { color: c.eje, width: 1.2, dash: 'dot' } }));
      });
    }
    if (sombrear) {
      shapes.push(G.lineaVertical(o.p, c.eje), G.lineaVertical(o.q, c.eje));
      notas.push(G.etiquetaSuperior(o.p, 'u₁', c.texto), G.etiquetaSuperior(o.q, 'u₂', c.texto));
    }
    var rango = G.rangoY([curva.y], { incluir: [0], recorte: 0.04 });
    if (o.forma !== 1) {
      rango[1] = Math.min(rango[1], 6 / o.a);
      rango[0] = Math.max(rango[0], -6 / o.a);
    }
    G.dibujar(div, trazas, G.layoutBase({
      xaxis: { range: o.vista, title: { text: 'u' } },
      yaxis: { range: rango },
      shapes: shapes,
      annotations: notas,
      hovermode: 'x'
    }));
  }

  /** Compara F hiperbólica inversa con F logarítmica. */
  function dibujarComparacion(div, o) {
    var c = G.colores();
    var modelo = FORMAS[o.forma];
    var Fh = modelo.hip(o.a);
    var Fl = modelo.log(o.a);
    var ch = G.muestrear(Fh, o.vista[0], o.vista[1], 500);
    var cl = G.muestrear(Fl, o.vista[0], o.vista[1], 500);
    var trazas = [
      {
        x: ch.x, y: ch.y, type: 'scatter', mode: 'lines', name: modelo.nombreHip,
        line: { color: c.serie[0], width: 3 }, hovertemplate: 'u = %{x:.4f}<br>F hiperbólica = %{y:.5f}<extra></extra>'
      },
      {
        x: cl.x, y: cl.y, type: 'scatter', mode: 'lines', name: modelo.nombreLog,
        line: { color: c.serie[1], width: 2.5, dash: 'dash' }, hovertemplate: 'u = %{x:.4f}<br>F logarítmica = %{y:.5f}<extra></extra>'
      }
    ];
    G.dibujar(div, trazas, G.layoutBase({
      xaxis: { range: o.vista, title: { text: 'u' } },
      yaxis: { range: G.rangoY([ch.y, cl.y], { recorte: 0.03 }) },
      hovermode: 'x'
    }));
  }

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
  Array.prototype.forEach.call(document.querySelectorAll('[data-grafica-hip]'), function (div) {
    var datos;
    try { datos = JSON.parse(div.getAttribute('data-grafica-hip')); } catch (e) { return; }
    var lp = V.leerNumero(datos.p, 'u₁');
    var lq = V.leerNumero(datos.q, 'u₂');
    if (!lp.ok || !lq.ok) return;
    var o = { forma: datos.forma, a: datos.a, p: lp.valor, q: lq.valor, vista: vistaCon(datos.forma, datos.a, lp.valor, lq.valor) };
    graficasEjemplos.push(function () { dibujarIntegrando(div, o, true); });
  });
  graficasEjemplos.forEach(function (pintar) { pintar(); });
  if (graficasEjemplos.length) {
    window.CI.alCambiarTema(function () { graficasEjemplos.forEach(function (pintar) { pintar(); }); });
  }

  /* ---------------------------------------------------------------- */
  /* 2. Visualizador                                                   */
  /* ---------------------------------------------------------------- */

  var form = document.getElementById('vis-hip-inv');
  if (!form) return;

  var ui = {
    chips: document.getElementById('chips-hip-inv'),
    mensaje: document.getElementById('mensaje-hip-inv'),
    grafica: document.getElementById('grafica-hip-inv'),
    comparacion: document.getElementById('grafica-hip-log'),
    aRango: document.getElementById('a-param-rango'),
    aNumero: document.getElementById('a-param-numero'),
    pRango: document.getElementById('u1-rango'),
    pTexto: document.getElementById('u1-texto'),
    qRango: document.getElementById('u2-rango'),
    qTexto: document.getElementById('u2-texto'),
    lcd: document.getElementById('lcd-hip-inv'),
    nota: document.getElementById('nota-hip-inv')
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
    ui.comparacion.style.opacity = '0.35';
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

      var sinSombra = { forma: forma, a: a, vista: vista };
      if (p >= q) {
        dibujarIntegrando(ui.grafica, sinSombra, false);
        dibujarComparacion(ui.comparacion, sinSombra);
        return fallar(ui.qTexto, 'El límite inferior debe ser menor que el superior: ahora $u_1=' + V.formatearTex(p) + '$ y $u_2=' +
          V.formatearTex(q) + '$. Intercambia los valores (recuerda que $\\int_{u_2}^{u_1}=-\\int_{u_1}^{u_2}$).', 'adv');
      }
      var problema = modelo.validar(a, p, q);
      if (problema) {
        dibujarIntegrando(ui.grafica, sinSombra, false);
        dibujarComparacion(ui.comparacion, sinSombra);
        return fallar(ui.pTexto, problema, 'adv');
      }

      marcarInvalido(null);
      V.ocultarMensaje(ui.mensaje);
      var f = modelo.integrando(a);
      var Fh = modelo.hip(a);
      var Fl = modelo.log(a);
      var viaHip = Fh(q) - Fh(p);
      var viaLog = Fl(q) - Fl(p);
      var simpson = N.simpson(f, p, q, 1000);
      var dif = Math.abs(viaHip - simpson);
      var desfase = Fl(q) - Fh(q);

      var o = { forma: forma, a: a, vista: vista, p: p, q: q };
      dibujarIntegrando(ui.grafica, o, true);
      dibujarComparacion(ui.comparacion, o);
      ui.grafica.style.opacity = '';
      ui.comparacion.style.opacity = '';

      ui.lcd.innerHTML =
        V.lectura('Hiperbólica ' + tex('F_h(u_2)-F_h(u_1)'), V.formatear(viaHip, 9), true) +
        V.lectura('Logarítmica ' + tex('F_\\ell(u_2)-F_\\ell(u_1)'), V.formatear(viaLog, 9)) +
        V.lectura('Simpson ' + tex('n=1000'), V.formatear(simpson, 9)) +
        V.lectura('Diferencia con Simpson', dif < 1e-12 ? '< 1e-12' : V.formatear(dif, 3)) +
        V.lectura(tex('F_\\ell-F_h') + ' (constante)', V.formatear(Math.abs(desfase) < 1e-12 ? 0 : desfase, 7)) +
        V.lectura('Dominio', tex(modelo.texDominio(a)));

      ui.nota.innerHTML = 'Integrando $f(u)=' + modelo.texIntegrando(a) + '$. Forma hiperbólica: $F_h(u)=' + modelo.texHip(a) +
        '$. Forma logarítmica: $F_\\ell(u)=' + modelo.texLog(a) + '$. ' +
        (forma === 3
          ? 'Las dos expresiones son la misma función: la gráfica inferior muestra una sola curva (la línea discontinua queda encima).'
          : 'Difieren en la constante $\\ln ' + fa(a) + '=' + V.formatearTex(Math.log(a), 5) + '$: las curvas son paralelas, pero al restar $F(u_2)-F(u_1)$ la constante se cancela y el valor es el mismo.') +
        ' Aquí $\\int_{u_1}^{u_2}f\\,du=' + V.formatearTex(viaHip, 7) + '$.';
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

  /** Carga una configuración; sin p y q usa los límites por defecto de la forma. */
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

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-hip]'), function (boton) {
    boton.addEventListener('click', function () {
      var datos;
      try { datos = JSON.parse(boton.getAttribute('data-cargar-hip')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(datos);
    });
  });

  window.CI.alCambiarTema(actualizar);
  cargar(EJEMPLOS[0]);
})();
