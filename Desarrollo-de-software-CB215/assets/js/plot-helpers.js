/**
 * plot-helpers.js — Utilidades compartidas para las gráficas con Plotly.js.
 *
 * - Lee los colores de las variables CSS, así las gráficas siguen el tema
 *   claro u oscuro sin duplicar la paleta en JavaScript.
 * - Arma un layout y una configuración base (en español, responsive).
 * - Muestrea curvas cortando la línea en asíntotas y puntos no definidos.
 * - Convierte listas de polígonos (rectángulos, trapecios, parábolas) en una
 *   sola traza rellena, que es mucho más rápida que dibujar cien formas.
 *
 * Queda disponible como window.Graficas.
 */
(function () {
  'use strict';

  /** Colores fijos por método: la misma identidad en todas las gráficas. */
  var VARIABLE_POR_METODO = {
    left: '--serie-1',
    right: '--serie-2',
    mid: '--serie-3',
    trapezoid: '--serie-4',
    simpson: '--serie-5'
  };

  var localeRegistrado = false;

  /** Traducción de los textos de la barra de herramientas de Plotly. */
  function registrarEspanol() {
    if (localeRegistrado || !window.Plotly) return;
    try {
      window.Plotly.register({
        moduleType: 'locale',
        name: 'es',
        dictionary: {
          'Zoom': 'Zoom',
          'Pan': 'Desplazar',
          'Zoom in': 'Acercar',
          'Zoom out': 'Alejar',
          'Reset axes': 'Restablecer ejes',
          'Autoscale': 'Escala automática',
          'Download plot as a png': 'Descargar gráfica como PNG',
          'Double-click to zoom back out': 'Doble clic para restablecer el zoom',
          'Click to enter Colorscale title': '',
          'Click to enter X axis title': '',
          'Click to enter Y axis title': '',
          'Click to enter Plot title': ''
        }
      });
    } catch (e) {
      /* si falla, Plotly queda en inglés */
    }
    localeRegistrado = true;
  }

  /** Lee una variable CSS del elemento raíz. */
  function variable(nombre) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  }

  /**
   * Paleta actual de la gráfica según el tema.
   * @returns {Object<string, string|Object>}
   */
  function colores() {
    var metodos = {};
    Object.keys(VARIABLE_POR_METODO).forEach(function (m) { metodos[m] = variable(VARIABLE_POR_METODO[m]); });
    return {
      curva: variable('--g-curva'),
      serie: [variable('--serie-1'), variable('--serie-2'), variable('--serie-3'), variable('--serie-4'), variable('--serie-5')],
      metodo: metodos,
      pos: variable('--g-pos'),
      neg: variable('--g-neg'),
      fondo: variable('--g-fondo'),
      texto: variable('--g-texto'),
      textoSuave: variable('--g-texto-suave'),
      rejilla: variable('--g-rejilla'),
      eje: variable('--g-eje'),
      referencia: variable('--g-referencia'),
      fuente: variable('--fuente')
    };
  }

  /**
   * Convierte un color hexadecimal (#rrggbb) en rgba con transparencia.
   * @param {string} hex
   * @param {number} alfa Entre 0 y 1.
   * @returns {string}
   */
  function alfa(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  /** true en pantallas táctiles: allí el arrastre debe desplazar la página. */
  function esTactil() {
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  /** true si la pantalla es angosta (móvil). */
  function esAngosto() {
    return window.innerWidth < 640;
  }

  /**
   * Layout base de Plotly con los colores del tema.
   * @param {Object} [extra] Propiedades que se combinan con la base.
   * @returns {Object}
   */
  function layoutBase(extra) {
    var c = colores();
    var eje = {
      gridcolor: c.rejilla,
      zerolinecolor: c.eje,
      zerolinewidth: 1.5,
      linecolor: c.eje,
      tickcolor: c.eje,
      tickfont: { color: c.texto, size: 12 },
      title: { font: { color: c.texto, size: 13 } },
      automargin: true
    };
    var base = {
      paper_bgcolor: c.fondo,
      plot_bgcolor: c.fondo,
      font: { family: c.fuente || 'system-ui, sans-serif', color: c.texto, size: 13 },
      margin: { l: 44, r: 12, t: 36, b: 40 },
      xaxis: Object.assign({}, eje),
      yaxis: Object.assign({}, eje),
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0,
        xanchor: 'left',
        y: 1.02,
        yanchor: 'bottom',
        bgcolor: 'rgba(0,0,0,0)',
        font: { color: c.texto, size: esAngosto() ? 11 : 12 },
        // En móvil la leyenda se reparte en dos columnas para no robar alto a la gráfica
        entrywidthmode: esAngosto() ? 'fraction' : 'pixels',
        entrywidth: esAngosto() ? 0.5 : 0
      },
      hovermode: 'closest',
      hoverlabel: { bgcolor: c.fondo, bordercolor: c.eje, font: { color: c.texto, family: c.fuente } },
      dragmode: esTactil() ? false : 'zoom',
      autosize: true
    };
    return combinar(base, extra || {});
  }

  /** Combinación profunda sencilla (solo objetos planos). */
  function combinar(destino, origen) {
    Object.keys(origen).forEach(function (clave) {
      var valor = origen[clave];
      if (valor && typeof valor === 'object' && !Array.isArray(valor) && destino[clave] && typeof destino[clave] === 'object') {
        destino[clave] = combinar(Object.assign({}, destino[clave]), valor);
      } else {
        destino[clave] = valor;
      }
    });
    return destino;
  }

  /** Configuración común: responsive, en español y sin logo de Plotly. */
  function configuracion() {
    return {
      responsive: true,
      // En pantallas táctiles o angostas no hay zoom por arrastre: la barra sobra
      displayModeBar: esTactil() || esAngosto() ? false : 'hover',
      displaylogo: false,
      locale: 'es',
      scrollZoom: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines',
        'hoverClosestCartesian', 'hoverCompareCartesian'],
      toImageButtonOptions: { filename: 'integralab-grafica', scale: 2 }
    };
  }

  /**
   * Dibuja (o actualiza) una gráfica. Nunca lanza errores hacia la consola.
   * @param {HTMLElement} div
   * @param {Object[]} trazas
   * @param {Object} layout
   * @returns {boolean} true si se pudo dibujar.
   */
  function dibujar(div, trazas, layout) {
    if (!window.Plotly || !div) return false;
    registrarEspanol();
    try {
      window.Plotly.react(div, trazas, layout, configuracion());
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Borra una gráfica si existe. */
  function limpiar(div) {
    if (window.Plotly && div && div.data) {
      try { window.Plotly.purge(div); } catch (e) { /* nada */ }
    }
  }

  /**
   * Percentil de un arreglo ya ordenado.
   * @param {number[]} ordenados
   * @param {number} p Entre 0 y 1.
   */
  function percentil(ordenados, p) {
    if (!ordenados.length) return NaN;
    var i = Math.min(ordenados.length - 1, Math.max(0, Math.round(p * (ordenados.length - 1))));
    return ordenados[i];
  }

  /**
   * Muestrea f en [x0, x1]. Los puntos no definidos se guardan como null para
   * que Plotly corte la línea, y también se corta en saltos bruscos (asíntotas).
   * @param {function(number): number} f
   * @param {number} x0
   * @param {number} x1
   * @param {number} [puntos=400]
   * @returns {{x: number[], y: Array<number|null>}}
   */
  function muestrear(f, x0, x1, puntos) {
    var n = puntos || 400;
    var xs = [];
    var ys = [];
    for (var i = 0; i <= n; i++) {
      var x = x0 + (x1 - x0) * i / n;
      var y;
      try { y = f(x); } catch (e) { y = NaN; }
      xs.push(x);
      ys.push(typeof y === 'number' && isFinite(y) ? y : null);
    }
    var finitos = ys.filter(function (v) { return v !== null; }).sort(function (p, q) { return p - q; });
    var rango = Math.max(percentil(finitos, 0.95) - percentil(finitos, 0.05), 1e-9);
    var salidaX = [];
    var salidaY = [];
    for (var k = 0; k < xs.length; k++) {
      if (k > 0 && ys[k] !== null && ys[k - 1] !== null) {
        var salto = Math.abs(ys[k] - ys[k - 1]);
        var cambioSigno = (ys[k] > 0) !== (ys[k - 1] > 0);
        if (salto > 4 * rango && (cambioSigno || salto > 40 * rango)) {
          salidaX.push((xs[k] + xs[k - 1]) / 2);
          salidaY.push(null);
        }
      }
      salidaX.push(xs[k]);
      salidaY.push(ys[k]);
    }
    return { x: salidaX, y: salidaY };
  }

  /**
   * Rango vertical robusto: ignora picos extremos (asíntotas) usando
   * percentiles y agrega un margen. Puede forzar a incluir valores (como 0).
   * @param {Array<Array<number|null>>} listas
   * @param {{incluir?: number[], recorte?: number}} [opciones]
   * @returns {number[]} [mínimo, máximo]
   */
  function rangoY(listas, opciones) {
    var o = opciones || {};
    var recorte = o.recorte === undefined ? 0.01 : o.recorte;
    var valores = [];
    listas.forEach(function (lista) {
      lista.forEach(function (v) { if (typeof v === 'number' && isFinite(v)) valores.push(v); });
    });
    (o.incluir || []).forEach(function (v) { valores.push(v); });
    if (!valores.length) return [-1, 1];
    valores.sort(function (p, q) { return p - q; });
    var min = percentil(valores, recorte);
    var max = percentil(valores, 1 - recorte);
    (o.incluir || []).forEach(function (v) { min = Math.min(min, v); max = Math.max(max, v); });
    if (max - min < 1e-9) { min -= 1; max += 1; }
    var margen = (max - min) * 0.08;
    return [min - margen, max + margen];
  }

  /**
   * Une una lista de polígonos en una sola traza rellena.
   * @param {Array<{x: number[], y: number[]}>} poligonos
   * @param {{nombre: string, color: string, opacidad?: number, grosor?: number, mostrarLeyenda?: boolean}} opciones
   * @returns {Object} Traza de Plotly.
   */
  function trazaPoligonos(poligonos, opciones) {
    var x = [];
    var y = [];
    poligonos.forEach(function (p) {
      for (var i = 0; i < p.x.length; i++) {
        x.push(p.x[i]);
        y.push(p.y[i]);
      }
      x.push(p.x[0]);
      y.push(p.y[0]);
      x.push(null);
      y.push(null);
    });
    return {
      x: x,
      y: y,
      type: 'scatter',
      mode: 'lines',
      fill: 'toself',
      fillcolor: alfa(opciones.color, opciones.opacidad === undefined ? 0.28 : opciones.opacidad),
      line: { color: opciones.color, width: opciones.grosor === undefined ? 1.5 : opciones.grosor },
      name: opciones.nombre,
      hoverinfo: 'skip',
      showlegend: opciones.mostrarLeyenda !== false
    };
  }

  /**
   * Línea vertical (shape) de altura completa, por ejemplo en x = a y x = b.
   * @param {number} x
   * @param {string} color
   */
  function lineaVertical(x, color) {
    return {
      type: 'line', xref: 'x', yref: 'paper', x0: x, x1: x, y0: 0, y1: 1,
      line: { color: color, width: 1 }, layer: 'below'
    };
  }

  /**
   * Etiqueta de texto junto al borde superior interno del área de la gráfica
   * (por ejemplo "a" y "b" al lado de sus líneas verticales).
   * @param {number} x
   * @param {string} texto
   * @param {string} color
   */
  function etiquetaSuperior(x, texto, color) {
    return {
      x: x, xref: 'x', y: 1, yref: 'paper', yanchor: 'top', xanchor: 'left', xshift: 3,
      text: texto, showarrow: false,
      font: { color: color, size: 15, family: 'KaTeX_Math, "Times New Roman", serif' }
    };
  }

  window.Graficas = {
    colores: colores,
    alfa: alfa,
    layoutBase: layoutBase,
    configuracion: configuracion,
    dibujar: dibujar,
    limpiar: limpiar,
    muestrear: muestrear,
    rangoY: rangoY,
    trazaPoligonos: trazaPoligonos,
    lineaVertical: lineaVertical,
    etiquetaSuperior: etiquetaSuperior,
    esAngosto: esAngosto
  };
})();
