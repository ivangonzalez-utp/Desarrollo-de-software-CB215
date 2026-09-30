/**
 * Módulo 3 · Regla del Punto Medio
 * Dibuja los rectángulos de punto medio, marca cada x̄_i sobre el eje y sobre
 * la curva, y compara el error con el de la regla del trapecio.
 */
(function () {
  'use strict';

  var raiz = document.getElementById('vis-punto-medio');
  var comparacion = document.getElementById('comparacion-trapecio');
  if (!raiz || !window.Visualizador) return;

  var G = window.Graficas;
  var N = window.Numerics;
  var V = window.Visualizador;

  function trazas(ctx) {
    var color = ctx.colores.metodo.mid;
    var rectangulos = [];
    for (var i = 0; i < ctx.n; i++) {
      var izq = ctx.a + i * ctx.dx;
      var der = i === ctx.n - 1 ? ctx.b : izq + ctx.dx;
      rectangulos.push({ x: [izq, izq, der, der], y: [0, ctx.ys[i], ctx.ys[i], 0] });
    }
    var resultado = [G.trazaPoligonos(rectangulos, { nombre: 'Rectángulos M<sub>' + ctx.n + '</sub>', color: color })];
    if (ctx.n <= 60) {
      var indices = ctx.ys.map(function (y, k) { return k + 1; });
      resultado.push({
        x: ctx.nodos.x, y: ctx.nodos.x.map(function () { return 0; }), type: 'scatter', mode: 'markers',
        name: 'x̄<sub>i</sub> en el eje',
        marker: { symbol: 'triangle-up', color: color, size: 10, line: { color: ctx.colores.fondo, width: 1.5 } },
        customdata: indices,
        hovertemplate: 'x̄<sub>%{customdata}</sub> = %{x:.4f}<extra></extra>'
      });
      resultado.push({
        x: ctx.nodos.x, y: ctx.ys, type: 'scatter', mode: 'markers', name: '(x̄<sub>i</sub>, f(x̄<sub>i</sub>))',
        marker: { color: color, size: 9, line: { color: ctx.colores.fondo, width: 2 } },
        customdata: indices,
        hovertemplate: 'x̄<sub>%{customdata}</sub> = %{x:.4f}<br>f(x̄) = %{y:.4f}<extra></extra>'
      });
    }
    return resultado;
  }

  /** Compara con el trapecio de igual n: E_M / E_T ≈ −1/2 para funciones suaves. */
  function compararConTrapecio(ctx) {
    var T;
    try {
      T = N.trapezoid(ctx.f, ctx.a, ctx.b, ctx.n);
    } catch (e) {
      comparacion.textContent = '';
      return;
    }
    var eM = ctx.exacto - ctx.aprox;
    var eT = ctx.exacto - T;
    var razon = Math.abs(eT) > 1e-14 ? V.formatearTex(eM / eT, 4) : '\\text{—}';
    comparacion.innerHTML = 'Con el mismo $n$: $T_{' + ctx.n + '}=' + V.formatearTex(T, 8) + '$, error del trapecio $E_T=' +
      V.formatearTex(eT, 4) + '$ y error del punto medio $E_M=' + V.formatearTex(eM, 4) + '$. Razón $E_M/E_T=' + razon + '$.';
    window.CI.renderizarMatematicas(comparacion);
  }

  V.crear({
    raiz: raiz,
    inicial: { f: 'sin(x)', a: '0', b: 'pi/2', n: 4 },
    metodo: function () { return 'mid'; },
    nombreAprox: function (ctx) { return 'M_{' + ctx.n + '}'; },
    trazas: trazas,
    alActualizar: compararConTrapecio,
    alFallar: function () { comparacion.textContent = ''; }
  });
})();
