/**
 * Módulo 5 · Integral definida y área bajo la curva
 *
 * Dos modos:
 *  - "bajo": integral con signo y área total de f en [a, b]; regiones positivas
 *    en azul y negativas en rojo; F(b) − F(a) cuando se conoce la antiderivada y
 *    la función de área A(x) opcional (Teorema Fundamental del Cálculo).
 *  - "entre": área entre f y g, con los puntos de corte calculados numéricamente.
 */
(function () {
  'use strict';

  var form = document.getElementById('vis-area');
  if (!form || !window.Visualizador || !window.Numerics || !window.Graficas) return;

  var V = window.Visualizador;
  var G = window.Graficas;
  var N = window.Numerics;
  var tex = window.CI.tex;

  var ui = {
    fx: document.getElementById('fx'),
    gx: document.getElementById('gx'),
    chips: document.getElementById('chips-area'),
    mensaje: document.getElementById('mensaje-area'),
    grafica: document.getElementById('grafica-area'),
    aRango: document.getElementById('a-rango'),
    aTexto: document.getElementById('a-texto'),
    bRango: document.getElementById('b-rango'),
    bTexto: document.getElementById('b-texto'),
    mostrarA: document.getElementById('mostrar-area-acumulada'),
    usarCortes: document.getElementById('usar-cortes'),
    lcd: document.getElementById('lcd-area'),
    notaTfc: document.getElementById('nota-tfc'),
    tabla: document.getElementById('tabla-area')
  };

  /** Ejemplos de cada modo; `F` es una antiderivada conocida (para mostrar el TFC). */
  var EJEMPLOS = {
    bajo: [
      { tex: 'x^2-1', f: 'x^2 - 1', F: 'x^3/3 - x', Ftex: '\\tfrac{x^3}{3}-x', a: '0', b: '2', vista: [-2, 3] },
      { tex: '\\sin x', f: 'sin(x)', F: '-cos(x)', Ftex: '-\\cos x', a: '0', b: '2*pi', vista: [-1, 7] },
      { tex: 'x^2', f: 'x^2', F: 'x^3/3', Ftex: '\\tfrac{x^3}{3}', a: '0', b: '3', vista: [-1, 4] },
      { tex: '\\sqrt{x}', f: 'sqrt(x)', F: '2/3*x^(3/2)', Ftex: '\\tfrac{2}{3}x^{3/2}', a: '1', b: '4', vista: [0, 5] },
      { tex: 'x^3-3x', f: 'x^3 - 3x', F: 'x^4/4 - 3x^2/2', Ftex: '\\tfrac{x^4}{4}-\\tfrac{3x^2}{2}', a: '-2', b: '2', vista: [-2.5, 2.5] },
      { tex: '\\cos x', f: 'cos(x)', F: 'sin(x)', Ftex: '\\sin x', a: '0', b: 'pi', vista: [-1, 7] },
      { tex: 'e^{-x^2}', f: 'exp(-x^2)', F: null, a: '-1', b: '1.5', vista: [-3, 3] }
    ],
    entre: [
      { tex: 'x\\text{ y }x^2', f: 'x', g: 'x^2', a: '0', b: '1', vista: [-0.5, 1.5] },
      { tex: '4-x^2\\text{ y }x+2', f: '4 - x^2', g: 'x + 2', a: '-2', b: '1', vista: [-3, 2] },
      { tex: '\\sin x\\text{ y }\\cos x', f: 'sin(x)', g: 'cos(x)', a: 'pi/4', b: '5*pi/4', vista: [0, 6.5] },
      { tex: 'x^3\\text{ y }x', f: 'x^3', g: 'x', a: '-1', b: '1', vista: [-1.5, 1.5] },
      { tex: '\\sqrt{x}\\text{ y }\\tfrac{x}{2}', f: 'sqrt(x)', g: 'x/2', a: '0', b: '4', vista: [0, 5] }
    ]
  };

  var estado = { modo: 'bajo', vista: [-2, 3], cortes: [] };
  var pendiente = false;

  /* ---------------------------------------------------------------- */
  /* Utilidades                                                        */
  /* ---------------------------------------------------------------- */

  function compacta(texto) {
    return V.normalizar(texto).replace(/\s+/g, '');
  }

  /** Anula el ruido de redondeo (por ejemplo 3.6e-16 cuando el valor es 0). */
  function limpio(v, escala) {
    return Math.abs(v) < 1e-12 * Math.max(1, escala || 0) ? 0 : v;
  }

  function numeroCorto(v) {
    return String(Number(v.toFixed(4)));
  }

  function modoActual() {
    var marcado = form.querySelector('input[name="modo"]:checked');
    return marcado ? marcado.value : 'bajo';
  }

  /** Ejemplo cuyo f (y g) coincide con lo escrito; sirve para saber si hay F conocida. */
  function ejemploActual() {
    var f = compacta(ui.fx.value);
    var g = compacta(ui.gx.value);
    return EJEMPLOS[estado.modo].find(function (e) {
      return compacta(e.f) === f && (estado.modo === 'bajo' || compacta(e.g) === g);
    }) || null;
  }

  function mostrarSegunModo() {
    Array.prototype.forEach.call(form.querySelectorAll('[data-solo-modo]'), function (el) {
      el.hidden = el.getAttribute('data-solo-modo') !== estado.modo;
    });
  }

  function pintarChips() {
    ui.chips.innerHTML = EJEMPLOS[estado.modo].map(function (e, i) {
      return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false">' + tex(e.tex) + '</button>';
    }).join('');
    marcarChip();
  }

  function marcarChip() {
    var actual = ejemploActual();
    Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
      var e = EJEMPLOS[estado.modo][Number(chip.getAttribute('data-indice'))];
      chip.setAttribute('aria-pressed', e === actual ? 'true' : 'false');
    });
  }

  /** Ajusta el rango de los deslizadores a la ventana de la gráfica. */
  function configurarDeslizadores() {
    var paso = (estado.vista[1] - estado.vista[0]) / 500;
    [ui.aRango, ui.bRango].forEach(function (r) {
      r.min = estado.vista[0];
      r.max = estado.vista[1];
      r.step = paso;
    });
  }

  /** Amplía la ventana si un límite escrito queda fuera de ella. */
  function incluirEnVista(valor) {
    var margen = 0.1 * (estado.vista[1] - estado.vista[0]);
    if (valor < estado.vista[0]) estado.vista[0] = valor - margen;
    if (valor > estado.vista[1]) estado.vista[1] = valor + margen;
    configurarDeslizadores();
  }

  function sincronizarDeslizador(texto, rango) {
    var lectura = V.leerNumero(texto.value, 'x');
    if (!lectura.ok) return;
    incluirEnVista(lectura.valor);
    rango.value = lectura.valor;
  }

  function marcarInvalido(control) {
    [ui.fx, ui.gx, ui.aTexto, ui.bTexto].forEach(function (c) {
      c.setAttribute('aria-invalid', c === control ? 'true' : 'false');
    });
  }

  function fallar(control, html, tipo) {
    marcarInvalido(control);
    V.mostrarMensaje(ui.mensaje, tipo || 'error', html);
    ui.lcd.innerHTML = '';
    ui.tabla.innerHTML = '<p class="campo__ayuda">Corrige los datos para ver la tabla.</p>';
    ui.notaTfc.textContent = '';
    ui.grafica.style.opacity = '0.35';
  }

  /** Polígono entre la curva superior y la inferior en [p, q]. */
  function poligono(arriba, abajo, p, q) {
    var xs = [];
    var ys = [];
    var k;
    var pasos = 80;
    for (k = 0; k <= pasos; k++) {
      var x = p + (q - p) * k / pasos;
      xs.push(x);
      ys.push(arriba(x));
    }
    for (k = pasos; k >= 0; k--) {
      var x2 = p + (q - p) * k / pasos;
      xs.push(x2);
      ys.push(abajo(x2));
    }
    return { x: xs, y: ys };
  }

  var cero = function () { return 0; };

  function lineasLimites(a, b, c) {
    return {
      shapes: [G.lineaVertical(a, c.eje), G.lineaVertical(b, c.eje)],
      annotations: [G.etiquetaSuperior(a, 'a', c.texto), G.etiquetaSuperior(b, 'b', c.texto)]
    };
  }

  /** Función de área A(x) = ∫_a^x f(t) dt en toda la ventana (trapecios desde a). */
  function trazaFuncionDeArea(f, a, x0, x1, color) {
    var puntos = 300;
    var derecha = { x: [], y: [] };
    var izquierda = { x: [], y: [] };
    var k;
    for (k = 0; k <= puntos; k++) {
      derecha.x.push(a + (x1 - a) * k / puntos);
      izquierda.x.push(a - (a - x0) * k / puntos);
    }
    [derecha, izquierda].forEach(function (lado) {
      var fs = lado.x.map(function (x) { var y = f(x); return isFinite(y) ? y : NaN; });
      var acumulado = N.cumulativeTrapezoid(lado.x, fs);
      lado.y = acumulado.map(function (v) { return isFinite(v) ? v : null; });
    });
    var xs = izquierda.x.slice().reverse().concat(derecha.x.slice(1));
    var ys = izquierda.y.slice().reverse().concat(derecha.y.slice(1));
    return {
      x: xs, y: ys, type: 'scatter', mode: 'lines', name: 'A(x) = ∫<sub>a</sub><sup>x</sup> f(t) dt',
      line: { color: color, width: 2.5, dash: 'dash' },
      hovertemplate: 'x = %{x:.4f}<br>A(x) = %{y:.4f}<extra></extra>'
    };
  }

  /* ---------------------------------------------------------------- */
  /* Modo 1: área bajo la curva                                        */
  /* ---------------------------------------------------------------- */

  function calcularBajo(cf, a, b, c) {
    var r = N.signedArea(cf.f, a, b, 1000);
    r.integral = limpio(r.integral, r.area);
    var ejemplo = ejemploActual();
    var tfc = NaN;
    var cF = null;
    if (ejemplo && ejemplo.F) {
      cF = V.compilarFuncion(ejemplo.F);
      if (cF.ok) tfc = limpio(cF.f(b) - cF.f(a), Math.abs(cF.f(b)) + Math.abs(cF.f(a)));
    }

    var x0 = Math.min(estado.vista[0], a);
    var x1 = Math.max(estado.vista[1], b);
    var curva = G.muestrear(cf.f, x0, x1, 600);
    var positivas = [];
    var negativas = [];
    r.pieces.forEach(function (tramo) {
      (tramo.integral >= 0 ? positivas : negativas).push(poligono(cf.f, cero, tramo.a, tramo.b));
    });

    var trazas = [];
    if (positivas.length) trazas.push(G.trazaPoligonos(positivas, { nombre: 'Región sobre el eje (+)', color: c.pos, opacidad: 0.32 }));
    if (negativas.length) trazas.push(G.trazaPoligonos(negativas, { nombre: 'Región bajo el eje (−)', color: c.neg, opacidad: 0.32 }));
    trazas.push({
      x: curva.x, y: curva.y, type: 'scatter', mode: 'lines', name: 'f(x) = ' + cf.expr,
      line: { color: c.curva, width: 2.5 }, hovertemplate: 'x = %{x:.4f}<br>f(x) = %{y:.4f}<extra></extra>'
    });
    var rangos = [curva.y];
    if (ui.mostrarA.checked) {
      var A = trazaFuncionDeArea(cf.f, a, x0, x1, c.serie[1]);
      trazas.push(A);
      rangos.push(A.y);
      trazas.push({
        x: [b], y: [r.integral], type: 'scatter', mode: 'markers', name: 'A(b) = ∫<sub>a</sub><sup>b</sup> f',
        marker: { color: c.serie[1], size: 10, line: { color: c.fondo, width: 2 } },
        hovertemplate: 'A(b) = %{y:.6f}<extra></extra>'
      });
    }
    if (r.roots.length) {
      trazas.push({
        x: r.roots, y: r.roots.map(function () { return 0; }), type: 'scatter', mode: 'markers', name: 'Raíces de f',
        marker: { color: c.curva, size: 9, symbol: 'circle-open', line: { width: 2.5 } },
        hovertemplate: 'raíz: x = %{x:.5f}<extra></extra>'
      });
    }
    var limites = lineasLimites(a, b, c);
    G.dibujar(ui.grafica, trazas, G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: G.rangoY(rangos, { incluir: [0] }) },
      shapes: limites.shapes,
      annotations: limites.annotations
    }));

    ui.lcd.innerHTML =
      V.lectura(tex('\\int_a^b f(x)\\,dx'), V.formatear(r.integral, 9), true) +
      V.lectura('TFC ' + tex('F(b)-F(a)'), isNaN(tfc) ? 'sin F conocida' : V.formatear(tfc, 9)) +
      V.lectura('Área total ' + tex('\\int_a^b|f|'), V.formatear(r.area, 9)) +
      V.lectura('Parte positiva', V.formatear(r.positive, 7)) +
      V.lectura('Parte negativa', V.formatear(r.negative, 7)) +
      V.lectura('Raíces en (a, b)', r.roots.length ? r.roots.map(numeroCorto).join('; ') : 'ninguna');

    if (cF && cF.ok) {
      ui.notaTfc.innerHTML = 'Por el TFC, con $F(x)=' + ejemplo.Ftex + '$: $F(b)-F(a)=' + V.formatearTex(cF.f(b), 7) +
        '-\\left(' + V.formatearTex(cF.f(a), 7) + '\\right)=' + V.formatearTex(tfc, 7) +
        '$, que coincide con el valor numérico.';
    } else {
      ui.notaTfc.innerHTML = 'Para esta función se muestra el valor numérico (Simpson con $n=1000$ en cada tramo). ' +
        (ejemplo ? '$e^{-x^2}$ no tiene antiderivada elemental, así que el TFC no da una fórmula cerrada.' : 'En los ejemplos se compara además con $F(b)-F(a)$.');
    }
    window.CI.renderizarMatematicas(ui.notaTfc);

    ui.tabla.innerHTML = '<table><thead><tr><th scope="col">Tramo</th><th scope="col">Signo de f</th>' +
      '<th class="num" scope="col">Integral en el tramo</th><th class="num" scope="col">Área</th></tr></thead><tbody>' +
      r.pieces.map(function (t) {
        return '<tr><td>[' + numeroCorto(t.a) + ', ' + numeroCorto(t.b) + ']</td><td>' + (t.integral >= 0 ? 'positivo (+)' : 'negativo (−)') +
          '</td><td class="num">' + V.formatear(t.integral, 8) + '</td><td class="num">' + V.formatear(Math.abs(t.integral), 8) + '</td></tr>';
      }).join('') +
      '<tr class="fila-destacada"><td colspan="2">Total</td><td class="num">' + V.formatear(r.integral, 8) + '</td><td class="num">' +
      V.formatear(r.area, 8) + '</td></tr></tbody></table>';
  }

  /* ---------------------------------------------------------------- */
  /* Modo 2: área entre dos curvas                                     */
  /* ---------------------------------------------------------------- */

  function calcularEntre(cf, cg, a, b, c) {
    var h = function (x) { return cf.f(x) - cg.f(x); };
    var x0 = Math.min(estado.vista[0], a);
    var x1 = Math.max(estado.vista[1], b);
    estado.cortes = N.findRoots(h, x0, x1, { samples: 2000 });
    var r = N.signedArea(h, a, b, 1000);
    r.integral = limpio(r.integral, r.area);

    var fArriba = [];
    var gArriba = [];
    r.pieces.forEach(function (tramo) {
      if (tramo.integral >= 0) fArriba.push(poligono(cf.f, cg.f, tramo.a, tramo.b));
      else gArriba.push(poligono(cg.f, cf.f, tramo.a, tramo.b));
    });
    var curvaF = G.muestrear(cf.f, x0, x1, 600);
    var curvaG = G.muestrear(cg.f, x0, x1, 600);
    var trazas = [];
    if (fArriba.length) trazas.push(G.trazaPoligonos(fArriba, { nombre: 'f está arriba', color: c.serie[0], opacidad: 0.26, grosor: 0 }));
    if (gArriba.length) trazas.push(G.trazaPoligonos(gArriba, { nombre: 'g está arriba', color: c.serie[1], opacidad: 0.26, grosor: 0 }));
    trazas.push({
      x: curvaF.x, y: curvaF.y, type: 'scatter', mode: 'lines', name: 'f(x) = ' + cf.expr,
      line: { color: c.serie[0], width: 2.5 }, hovertemplate: 'x = %{x:.4f}<br>f(x) = %{y:.4f}<extra></extra>'
    });
    trazas.push({
      x: curvaG.x, y: curvaG.y, type: 'scatter', mode: 'lines', name: 'g(x) = ' + cg.expr,
      line: { color: c.serie[1], width: 2.5 }, hovertemplate: 'x = %{x:.4f}<br>g(x) = %{y:.4f}<extra></extra>'
    });
    if (estado.cortes.length) {
      trazas.push({
        x: estado.cortes, y: estado.cortes.map(cf.f), type: 'scatter', mode: 'markers', name: 'Puntos de corte',
        marker: { color: c.curva, size: 10, line: { color: c.fondo, width: 2 } },
        hovertemplate: 'corte: (%{x:.5f}, %{y:.5f})<extra></extra>'
      });
    }
    var limites = lineasLimites(a, b, c);
    G.dibujar(ui.grafica, trazas, G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: G.rangoY([curvaF.y, curvaG.y]) },
      shapes: limites.shapes,
      annotations: limites.annotations
    }));

    ui.usarCortes.disabled = estado.cortes.length < 2;
    ui.lcd.innerHTML =
      V.lectura('Área entre curvas ' + tex('\\int_a^b|f-g|'), V.formatear(r.area, 9), true) +
      V.lectura(tex('\\int_a^b (f-g)\\,dx') + ' con signo', V.formatear(r.integral, 9)) +
      V.lectura('Puntos de corte (ventana)', estado.cortes.length ? estado.cortes.map(numeroCorto).join('; ') : 'ninguno') +
      V.lectura('Regiones en [a, b]', String(r.pieces.length));

    ui.notaTfc.innerHTML = estado.cortes.length >= 2
      ? 'Las curvas se cortan en $x=' + estado.cortes.map(numeroCorto).join(',\\ ') + '$. Usa el botón para integrar exactamente entre el primer y el último corte.'
      : 'En la ventana visible hay menos de dos puntos de corte; el área se calcula entre los límites $a$ y $b$ elegidos.';
    window.CI.renderizarMatematicas(ui.notaTfc);

    ui.tabla.innerHTML = '<table><thead><tr><th scope="col">Tramo</th><th scope="col">Curva superior</th>' +
      '<th class="num" scope="col">Área del tramo</th></tr></thead><tbody>' +
      r.pieces.map(function (t) {
        return '<tr><td>[' + numeroCorto(t.a) + ', ' + numeroCorto(t.b) + ']</td><td>' + (t.integral >= 0 ? 'f(x)' : 'g(x)') +
          '</td><td class="num">' + V.formatear(Math.abs(t.integral), 8) + '</td></tr>';
      }).join('') +
      '<tr class="fila-destacada"><td colspan="2">Área total</td><td class="num">' + V.formatear(r.area, 8) + '</td></tr></tbody></table>';
  }

  /* ---------------------------------------------------------------- */
  /* Ciclo de actualización                                            */
  /* ---------------------------------------------------------------- */

  function actualizar() {
    try {
      var cf = V.compilarFuncion(ui.fx.value);
      if (!cf.ok) return fallar(ui.fx, cf.error);
      var cg = null;
      if (estado.modo === 'entre') {
        cg = V.compilarFuncion(ui.gx.value);
        if (!cg.ok) return fallar(ui.gx, cg.error);
      }
      var la = V.leerNumero(ui.aTexto.value, 'a');
      if (!la.ok) return fallar(ui.aTexto, la.error);
      var lb = V.leerNumero(ui.bTexto.value, 'b');
      if (!lb.ok) return fallar(ui.bTexto, lb.error);
      if (la.valor >= lb.valor) {
        return fallar(ui.bTexto, 'El límite inferior debe ser menor que el superior: ahora $a=' + V.formatearTex(la.valor) +
          '$ y $b=' + V.formatearTex(lb.valor) + '$. Mueve los controles para que $a&lt;b$ (recuerda que $\\int_b^a f=-\\int_a^b f$).', 'adv');
      }
      marcarInvalido(null);
      var c = G.colores();
      if (estado.modo === 'bajo') calcularBajo(cf, la.valor, lb.valor, c);
      else calcularEntre(cf, cg, la.valor, lb.valor, c);
      V.ocultarMensaje(ui.mensaje);
      ui.grafica.style.opacity = '';
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
   * Carga un ejemplo o valores sueltos.
   * @param {{modo?: string, f?: string, g?: string, a?: string, b?: string, vista?: number[]}} datos
   */
  function cargar(datos) {
    if (datos.modo && datos.modo !== estado.modo) {
      estado.modo = datos.modo;
      var radio = form.querySelector('input[name="modo"][value="' + datos.modo + '"]');
      if (radio) radio.checked = true;
      mostrarSegunModo();
      pintarChips();
    }
    if (datos.f !== undefined) ui.fx.value = datos.f;
    if (datos.g !== undefined) ui.gx.value = datos.g;
    if (datos.a !== undefined) ui.aTexto.value = datos.a;
    if (datos.b !== undefined) ui.bTexto.value = datos.b;
    var ejemplo = ejemploActual();
    var vista = datos.vista || (ejemplo && ejemplo.vista);
    if (!vista) {
      var la = V.leerNumero(ui.aTexto.value, 'a');
      var lb = V.leerNumero(ui.bTexto.value, 'b');
      var a = la.ok ? la.valor : -1;
      var b = lb.ok ? lb.valor : 1;
      var margen = Math.max(0.5, 0.25 * Math.abs(b - a));
      vista = [Math.min(a, b) - margen, Math.max(a, b) + margen];
    }
    estado.vista = vista.slice();
    configurarDeslizadores();
    sincronizarDeslizador(ui.aTexto, ui.aRango);
    sincronizarDeslizador(ui.bTexto, ui.bRango);
    actualizar();
  }

  /* ---------------------------------------------------------------- */
  /* Eventos                                                           */
  /* ---------------------------------------------------------------- */

  Array.prototype.forEach.call(form.querySelectorAll('input[name="modo"]'), function (radio) {
    radio.addEventListener('change', function () {
      var ejemplo = EJEMPLOS[radio.value][0];
      cargar({ modo: radio.value, f: ejemplo.f, g: ejemplo.g || ui.gx.value, a: ejemplo.a, b: ejemplo.b, vista: ejemplo.vista });
    });
  });

  ui.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (!chip) return;
    var e = EJEMPLOS[estado.modo][Number(chip.getAttribute('data-indice'))];
    cargar({ f: e.f, g: e.g, a: e.a, b: e.b, vista: e.vista });
  });

  [ui.fx, ui.gx].forEach(function (campo) { campo.addEventListener('input', programar); });

  [[ui.aRango, ui.aTexto], [ui.bRango, ui.bTexto]].forEach(function (par) {
    par[0].addEventListener('input', function () {
      par[1].value = numeroCorto(Number(par[0].value));
      programar();
    });
    par[1].addEventListener('input', function () {
      sincronizarDeslizador(par[1], par[0]);
      programar();
    });
  });

  ui.mostrarA.addEventListener('change', actualizar);

  ui.usarCortes.addEventListener('click', function () {
    if (estado.cortes.length < 2) return;
    cargar({
      a: String(Number(estado.cortes[0].toFixed(6))),
      b: String(Number(estado.cortes[estado.cortes.length - 1].toFixed(6))),
      vista: estado.vista
    });
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-area]'), function (boton) {
    boton.addEventListener('click', function () {
      var datos;
      try { datos = JSON.parse(boton.getAttribute('data-cargar-area')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(datos);
    });
  });

  window.CI.alCambiarTema(actualizar);

  // Estado inicial
  mostrarSegunModo();
  pintarChips();
  var inicial = EJEMPLOS.bajo[0];
  cargar({ f: inicial.f, a: inicial.a, b: inicial.b, vista: inicial.vista });
})();
