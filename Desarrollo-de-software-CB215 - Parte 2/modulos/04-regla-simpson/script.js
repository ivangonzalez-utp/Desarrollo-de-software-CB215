/**
 * Módulo 4 · Regla de Simpson
 * Dibuja las parábolas ajustadas en cada par de subintervalos y compara los
 * cinco métodos (L, R, M, T, S) con la misma función, intervalo y n.
 */
(function () {
  'use strict';

  var raiz = document.getElementById('vis-simpson');
  var tablaComparacion = document.getElementById('tabla-comparacion');
  var divErrores = document.getElementById('grafica-errores');
  if (!raiz || !window.Visualizador) return;

  var G = window.Graficas;
  var N = window.Numerics;
  var V = window.Visualizador;
  var METODOS = [
    { id: 'left', nombre: 'Izquierda', letra: 'L' },
    { id: 'right', nombre: 'Derecha', letra: 'R' },
    { id: 'mid', nombre: 'Punto medio', letra: 'M' },
    { id: 'trapezoid', nombre: 'Trapecio', letra: 'T' },
    { id: 'simpson', nombre: 'Simpson', letra: 'S' }
  ];
  var PISO_ERROR = 1e-16;
  var cacheErrores = { clave: null, datos: null };

  /** Una parábola por cada par de subintervalos; se alterna la intensidad del relleno. */
  function trazas(ctx) {
    var color = ctx.colores.metodo.simpson;
    var grupoA = [];
    var grupoB = [];
    for (var k = 0; k + 2 <= ctx.n; k += 2) {
      var x0 = ctx.nodos.x[k];
      var x1 = ctx.nodos.x[k + 1];
      var x2 = ctx.nodos.x[k + 2];
      var p = N.parabolaThrough(x0, ctx.ys[k], x1, ctx.ys[k + 1], x2, ctx.ys[k + 2]);
      var xs = [x0];
      var ys = [0];
      for (var j = 0; j <= 24; j++) {
        var x = x0 + (x2 - x0) * j / 24;
        xs.push(x);
        ys.push(p.A * x * x + p.B * x + p.C);
      }
      xs.push(x2);
      ys.push(0);
      ((k / 2) % 2 === 0 ? grupoA : grupoB).push({ x: xs, y: ys });
    }
    var coeficientes = N.simpsonCoefficients(ctx.n);
    var resultado = [
      G.trazaPoligonos(grupoA, { nombre: 'Parábolas S<sub>' + ctx.n + '</sub>', color: color, opacidad: 0.34 }),
      G.trazaPoligonos(grupoB, { nombre: 'Parábolas (par siguiente)', color: color, opacidad: 0.16, mostrarLeyenda: false })
    ];
    if (ctx.n <= 50) {
      resultado.push({
        x: ctx.nodos.x, y: ctx.ys, type: 'scatter', mode: 'markers', name: 'Nodos',
        marker: { color: color, size: 9, line: { color: ctx.colores.fondo, width: 2 } },
        customdata: coeficientes.map(function (c, i) { return [i, c]; }),
        hovertemplate: 'x<sub>%{customdata[0]}</sub> = %{x:.4f}<br>f = %{y:.4f}<br>coeficiente %{customdata[1]}<extra></extra>'
      });
    }
    return resultado;
  }

  /** Tabla con la aproximación y los errores de cada método para el n actual. */
  function pintarTabla(ctx) {
    var filas = METODOS.map(function (m) {
      var valor;
      try { valor = N.integrate(m.id, ctx.f, ctx.a, ctx.b, ctx.n); } catch (e) { valor = NaN; }
      return { m: m, valor: valor, abs: N.absoluteError(ctx.exacto, valor), rel: N.relativeError(ctx.exacto, valor) };
    });
    var mejor = filas.reduce(function (min, f) { return f.abs < min.abs ? f : min; }, filas[0]);
    tablaComparacion.innerHTML =
      '<table><thead><tr><th scope="col">Método</th><th class="num" scope="col">Aproximación</th>' +
      '<th class="num" scope="col">Error absoluto</th><th class="num" scope="col">Error relativo</th></tr></thead><tbody>' +
      filas.map(function (f) {
        return '<tr' + (f === mejor ? ' class="fila-destacada"' : '') + '><td>' +
          '<span class="muestra-color" style="background:' + ctx.colores.metodo[f.m.id] + '" aria-hidden="true"></span>' +
          f.m.nombre + ' ' + window.CI.tex(f.m.letra + '_{' + ctx.n + '}') + '</td>' +
          '<td class="num">' + V.formatear(f.valor, 9) + '</td>' +
          '<td class="num">' + V.formatear(f.abs, 4) + '</td>' +
          '<td class="num">' + (isNaN(f.rel) ? '—' : V.formatearPorcentaje(f.rel)) + '</td></tr>';
      }).join('') +
      '<tr><td>Referencia (exacto)</td><td class="num">' + V.formatear(ctx.exacto, 9) + '</td><td class="num">—</td><td class="num">—</td></tr>' +
      '</tbody></table>';
  }

  /** Errores de cada método para n = 2, 4, …, 100 (se recalcula solo si cambian f, a o b). */
  function seriesDeErrores(ctx) {
    var clave = ctx.expr + '|' + ctx.a + '|' + ctx.b;
    if (cacheErrores.clave === clave) return cacheErrores.datos;
    var datos = { n: [] };
    METODOS.forEach(function (m) { datos[m.id] = []; });
    for (var n = 2; n <= 100; n += 2) {
      datos.n.push(n);
      METODOS.forEach(function (m) {
        var error;
        try { error = Math.abs(ctx.exacto - N.integrate(m.id, ctx.f, ctx.a, ctx.b, n)); } catch (e) { error = null; }
        datos[m.id].push(error === null ? null : Math.max(error, PISO_ERROR));
      });
    }
    cacheErrores = { clave: clave, datos: datos };
    return datos;
  }

  function dibujarErrores(ctx) {
    var datos = seriesDeErrores(ctx);
    var c = ctx.colores;
    var indice = datos.n.indexOf(ctx.n);
    var trazasErrores = METODOS.map(function (m) {
      return {
        x: datos.n, y: datos[m.id], type: 'scatter', mode: 'lines', name: m.nombre,
        line: { color: c.metodo[m.id], width: m.id === 'simpson' ? 3 : 2 },
        hovertemplate: m.nombre + '<br>n = %{x}<br>error = %{y:.3e}<extra></extra>'
      };
    });
    if (indice >= 0) {
      trazasErrores.push({
        x: METODOS.map(function () { return ctx.n; }),
        y: METODOS.map(function (m) { return datos[m.id][indice]; }),
        type: 'scatter', mode: 'markers', name: 'n actual', showlegend: false,
        marker: { color: METODOS.map(function (m) { return c.metodo[m.id]; }), size: 10, line: { color: c.fondo, width: 2 } },
        hoverinfo: 'skip'
      });
    }
    var layout = G.layoutBase({
      xaxis: { type: 'log', title: { text: 'n (escala logarítmica)' } },
      yaxis: { type: 'log', title: { text: 'Error absoluto' }, exponentformat: 'power' }
    });
    divErrores.style.opacity = '';
    tablaComparacion.style.opacity = '';
    G.dibujar(divErrores, trazasErrores, layout);
  }

  V.crear({
    raiz: raiz,
    soloPares: true,
    inicial: { f: 'exp(-x^2)', a: '0', b: '1', n: 4 },
    metodo: function () { return 'simpson'; },
    nombreAprox: function (ctx) { return 'S_{' + ctx.n + '}'; },
    trazas: trazas,
    alActualizar: function (ctx) {
      pintarTabla(ctx);
      dibujarErrores(ctx);
    },
    alFallar: function () {
      divErrores.style.opacity = '0.35';
      tablaComparacion.style.opacity = '0.35';
    }
  });
})();
