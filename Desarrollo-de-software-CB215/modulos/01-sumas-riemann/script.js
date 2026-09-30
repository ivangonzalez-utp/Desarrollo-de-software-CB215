/**
 * Módulo 1 · Sumas de Riemann
 * Dibuja los rectángulos de L_n, R_n o M_n y la gráfica de convergencia.
 */
(function () {
  'use strict';

  var raiz = document.getElementById('vis-riemann');
  var divConvergencia = document.getElementById('grafica-convergencia');
  if (!raiz || !window.Visualizador) return;

  var G = window.Graficas;
  var N = window.Numerics;
  var NOMBRES = {
    left: { letra: 'L', texto: 'izquierda' },
    right: { letra: 'R', texto: 'derecha' },
    mid: { letra: 'M', texto: 'punto medio' }
  };
  var N_MAX = 100;
  var cacheConvergencia = { clave: null, series: null };

  function tipoSeleccionado() {
    var marcado = raiz.querySelector('input[name="tipo-suma"]:checked');
    return marcado ? marcado.value : 'left';
  }

  /** Rectángulos del método elegido + puntos de muestra. */
  function trazas(ctx) {
    var color = ctx.colores.metodo[ctx.metodo];
    var rectangulos = [];
    for (var i = 0; i < ctx.n; i++) {
      var izq = ctx.a + i * ctx.dx;
      var der = i === ctx.n - 1 ? ctx.b : izq + ctx.dx;
      var altura = ctx.ys[i];
      rectangulos.push({ x: [izq, izq, der, der], y: [0, altura, altura, 0] });
    }
    var resultado = [G.trazaPoligonos(rectangulos, { nombre: 'Rectángulos ' + NOMBRES[ctx.metodo].letra + '<sub>' + ctx.n + '</sub>', color: color })];
    if (ctx.n <= 50) {
      resultado.push({
        x: ctx.nodos.x, y: ctx.ys, type: 'scatter', mode: 'markers', name: 'Puntos x<sub>i</sub>*',
        marker: { color: color, size: 9, line: { color: ctx.colores.fondo, width: 2 } },
        customdata: ctx.ys.map(function (y, k) { return [k + 1, y * ctx.dx]; }),
        hovertemplate: 'Rectángulo %{customdata[0]}<br>x* = %{x:.4f}<br>f(x*) = %{y:.4f}<br>Área = %{customdata[1]:.4f}<extra></extra>'
      });
    }
    return resultado;
  }

  /** Calcula L_n, R_n y M_n para n = 1..100 (se reutiliza mientras no cambien f, a, b). */
  function seriesConvergencia(ctx) {
    var clave = ctx.expr + '|' + ctx.a + '|' + ctx.b;
    if (cacheConvergencia.clave === clave) return cacheConvergencia.series;
    var series = { n: [], left: [], right: [], mid: [] };
    for (var n = 1; n <= N_MAX; n++) {
      series.n.push(n);
      ['left', 'right', 'mid'].forEach(function (m) {
        var valor;
        try { valor = N.integrate(m, ctx.f, ctx.a, ctx.b, n); } catch (e) { valor = null; }
        series[m].push(valor);
      });
    }
    cacheConvergencia = { clave: clave, series: series };
    return series;
  }

  function dibujarConvergencia(ctx) {
    var s = seriesConvergencia(ctx);
    var c = ctx.colores;
    var trazasConv = ['left', 'right', 'mid'].map(function (m) {
      var elegido = m === ctx.metodo;
      return {
        x: s.n, y: s[m], type: 'scatter', mode: 'lines', name: NOMBRES[m].letra + '<sub>n</sub> (' + NOMBRES[m].texto + ')',
        line: { color: c.metodo[m], width: elegido ? 3 : 1.6 },
        opacity: elegido ? 1 : 0.6,
        hovertemplate: NOMBRES[m].letra + '<sub>%{x}</sub> = %{y:.6f}<extra></extra>'
      };
    });
    trazasConv.push({
      x: [1, N_MAX], y: [ctx.exacto, ctx.exacto], type: 'scatter', mode: 'lines', name: 'Valor exacto',
      line: { color: c.referencia, width: 1.5, dash: 'dash' }, hoverinfo: 'skip'
    });
    trazasConv.push({
      x: [ctx.n], y: [ctx.aprox], type: 'scatter', mode: 'markers', name: 'n actual', showlegend: false,
      marker: { color: c.metodo[ctx.metodo], size: 12, line: { color: c.fondo, width: 2 } },
      hovertemplate: 'n = %{x}<br>' + NOMBRES[ctx.metodo].letra + '<sub>n</sub> = %{y:.6f}<extra></extra>'
    });
    var layout = G.layoutBase({
      xaxis: { title: { text: 'n (número de subintervalos)' }, range: [0, N_MAX + 2] },
      yaxis: { title: { text: 'Aproximación' }, range: G.rangoY([s.left, s.right, s.mid], { incluir: [ctx.exacto], recorte: 0 }) },
      hovermode: 'x'
    });
    divConvergencia.style.opacity = '';
    G.dibujar(divConvergencia, trazasConv, layout);
  }

  var visualizador = window.Visualizador.crear({
    raiz: raiz,
    inicial: { f: 'x^2', a: '0', b: '3', n: 6 },
    metodo: tipoSeleccionado,
    nombreAprox: function (ctx) { return NOMBRES[ctx.metodo].letra + '_{' + ctx.n + '}'; },
    trazas: trazas,
    alActualizar: dibujarConvergencia,
    alFallar: function () { divConvergencia.style.opacity = '0.35'; },
    alCargar: function (datos) {
      if (!datos.metodo) return;
      var radio = raiz.querySelector('input[name="tipo-suma"][value="' + datos.metodo + '"]');
      if (radio) radio.checked = true;
    }
  });

  Array.prototype.forEach.call(raiz.querySelectorAll('input[name="tipo-suma"]'), function (radio) {
    radio.addEventListener('change', visualizador.actualizar);
  });
})();
