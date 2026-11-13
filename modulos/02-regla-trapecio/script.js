/**
 * Módulo 2 · Regla del Trapecio
 * Dibuja los trapecios sombreados y muestra la relación T_n = (L_n + R_n)/2.
 */
(function () {
  'use strict';

  var raiz = document.getElementById('vis-trapecio');
  var relacion = document.getElementById('relacion-riemann');
  if (!raiz || !window.Visualizador) return;

  var G = window.Graficas;
  var V = window.Visualizador;

  /** Trapecios entre nodos consecutivos + los nodos marcados sobre la curva. */
  function trazas(ctx) {
    var color = ctx.colores.metodo.trapezoid;
    var trapecios = [];
    for (var i = 1; i <= ctx.n; i++) {
      var x0 = ctx.nodos.x[i - 1];
      var x1 = ctx.nodos.x[i];
      trapecios.push({ x: [x0, x0, x1, x1], y: [0, ctx.ys[i - 1], ctx.ys[i], 0] });
    }
    var resultado = [G.trazaPoligonos(trapecios, { nombre: 'Trapecios', color: color, opacidad: 0.3 })];
    if (ctx.n <= 50) {
      resultado.push({
        x: ctx.nodos.x, y: ctx.ys, type: 'scatter', mode: 'markers', name: 'Nodos (x<sub>i</sub>, f(x<sub>i</sub>))',
        marker: { color: color, size: 9, line: { color: ctx.colores.fondo, width: 2 } },
        customdata: ctx.ys.map(function (y, k) { return k; }),
        hovertemplate: 'x<sub>%{customdata}</sub> = %{x:.4f}<br>f = %{y:.4f}<extra></extra>'
      });
    }
    return resultado;
  }

  /** Muestra L_n, R_n y su promedio para comprobar T_n = (L_n + R_n)/2. */
  function mostrarRelacion(ctx) {
    var L = 0;
    var R = 0;
    for (var i = 0; i < ctx.n; i++) {
      L += ctx.ys[i] * ctx.dx;
      R += ctx.ys[i + 1] * ctx.dx;
    }
    relacion.innerHTML = 'Relación con Riemann: $L_{' + ctx.n + '}=' + V.formatearTex(L, 8) + '$, $R_{' + ctx.n + '}=' +
      V.formatearTex(R, 8) + '$ y $\\tfrac{L_{' + ctx.n + '}+R_{' + ctx.n + '}}{2}=' + V.formatearTex((L + R) / 2, 8) +
      '=T_{' + ctx.n + '}$.';
    window.CI.renderizarMatematicas(relacion);
  }

  V.crear({
    raiz: raiz,
    inicial: { f: 'exp(-x^2)', a: '0', b: '1', n: 4 },
    metodo: function () { return 'trapezoid'; },
    nombreAprox: function (ctx) { return 'T_{' + ctx.n + '}'; },
    trazas: trazas,
    alActualizar: mostrarRelacion,
    alFallar: function () { relacion.textContent = ''; }
  });
})();
