/**
 * Módulo 9 · Integrales que producen logaritmos
 *
 * 1. Gráficas de los ejemplos: integrando f y antiderivada F(x) + C, con un
 *    deslizador para la constante y líneas verticales en las discontinuidades.
 * 2. Visualizador de ∫ g'/g dx = ln|g| + C: el usuario escribe g(x); se deriva
 *    con math.js, se grafican g'/g y ln|g|, se marcan los ceros de g (que parten
 *    el dominio) y se sombrean las zonas donde g < 0.
 */
(function () {
  'use strict';

  var V = window.Visualizador;
  var G = window.Graficas;
  var N = window.Numerics;
  if (!V || !G || !N) return;
  var tex = window.CI.tex;

  var FAMILIA = [-4, -2, 0, 2, 4];

  /** Línea vertical discontinua (cero de g o asíntota). */
  function lineaCorte(x, color) {
    var s = G.lineaVertical(x, color);
    s.line = { color: color, width: 1.4, dash: 'dash' };
    return s;
  }

  /* ---------------------------------------------------------------- */
  /* 1. Gráficas de los ejemplos resueltos                             */
  /* ---------------------------------------------------------------- */

  function trazaFamilia(F, x0, x1, C, color) {
    var xs = [];
    var ys = [];
    FAMILIA.forEach(function (k) {
      if (Math.abs(k - C) < 1e-9) return;
      var curva = G.muestrear(function (x) { return F(x) + k; }, x0, x1, 300);
      xs = xs.concat(curva.x, [null]);
      ys = ys.concat(curva.y, [null]);
    });
    return {
      x: xs, y: ys, type: 'scatter', mode: 'lines', name: 'Familia F(x) + C',
      line: { color: G.alfa(color, 0.35), width: 1.2 }, hoverinfo: 'skip'
    };
  }

  function rangoEjemplo(f, F, x0, x1) {
    var cf = G.muestrear(f, x0, x1, 300).y;
    var cF = G.muestrear(F, x0, x1, 300).y;
    var arriba = cF.map(function (v) { return v === null ? null : v + 5; });
    var abajo = cF.map(function (v) { return v === null ? null : v - 5; });
    return G.rangoY([cf, arriba, abajo], { recorte: 0.04, incluir: [0] });
  }

  function dibujarEjemplo(div, o) {
    var c = G.colores();
    var x0 = o.vista[0];
    var x1 = o.vista[1];
    var curvaF = G.muestrear(o.f, x0, x1, 600);
    var curvaAnti = G.muestrear(function (x) { return o.F(x) + o.C; }, x0, x1, 600);
    var trazas = [
      trazaFamilia(o.F, x0, x1, o.C, c.serie[1]),
      {
        x: curvaF.x, y: curvaF.y, type: 'scatter', mode: 'lines', name: 'f(x)',
        line: { color: c.serie[0], width: 2.5 }, hovertemplate: 'x = %{x:.3f}<br>f(x) = %{y:.4f}<extra></extra>'
      },
      {
        x: curvaAnti.x, y: curvaAnti.y, type: 'scatter', mode: 'lines',
        name: 'F(x) + C, C = ' + V.formatear(o.C, 3).replace(/<[^>]+>/g, ''),
        line: { color: c.serie[1], width: 3 }, hovertemplate: 'x = %{x:.3f}<br>F(x) + C = %{y:.4f}<extra></extra>'
      }
    ];
    G.dibujar(div, trazas, G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: o.rango },
      shapes: (o.cortes || []).map(function (x) { return lineaCorte(x, c.textoSuave); }),
      hovermode: 'x'
    }));
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-antiderivada]'), function (bloque) {
    var datos;
    try { datos = JSON.parse(bloque.getAttribute('data-antiderivada')); } catch (e) { return; }
    var div = bloque.querySelector('[data-grafica]');
    var control = bloque.querySelector('[data-c]');
    var salida = bloque.querySelector('[data-c-valor]');
    var cf = V.compilarFuncion(datos.f);
    var cF = V.compilarFuncion(datos.F);
    if (!cf.ok || !cF.ok) {
      div.innerHTML = '<p class="campo__ayuda">No se pudo preparar la gráfica (¿se cargó math.js?).</p>';
      return;
    }
    var rango = rangoEjemplo(cf.f, cF.f, datos.vista[0], datos.vista[1]);
    function pintar() {
      var C = Number(control.value);
      salida.textContent = String(C).replace('-', '−');
      dibujarEjemplo(div, { f: cf.f, F: cF.f, C: C, vista: datos.vista, rango: rango, cortes: datos.cortes });
    }
    control.addEventListener('input', pintar);
    window.CI.alCambiarTema(pintar);
    pintar();
  });

  /* ---------------------------------------------------------------- */
  /* 2. Visualizador de ∫ g'/g dx = ln|g| + C                          */
  /* ---------------------------------------------------------------- */

  var form = document.getElementById('vis-log');
  if (!form) return;

  var ui = {
    gx: document.getElementById('gx'),
    xmin: document.getElementById('xmin'),
    xmax: document.getElementById('xmax'),
    chips: document.getElementById('chips-log'),
    mostrarG: document.getElementById('mostrar-g'),
    mostrarLn: document.getElementById('mostrar-ln'),
    mensaje: document.getElementById('mensaje-log'),
    grafica: document.getElementById('grafica-log'),
    lcd: document.getElementById('lcd-log'),
    resultado: document.getElementById('resultado-log')
  };

  var EJEMPLOS = [
    { tex: 'x^2+1', g: 'x^2 + 1', vista: [-4, 4] },
    { tex: 'x', g: 'x', vista: [-4, 4] },
    { tex: 'x^2-4', g: 'x^2 - 4', vista: [-5, 5] },
    { tex: 'x^3-x', g: 'x^3 - x', vista: [-2.5, 2.5] },
    { tex: 'x^2', g: 'x^2', vista: [-3, 3] },
    { tex: '\\cos x', g: 'cos(x)', vista: [-6.5, 6.5] },
    { tex: '\\sin x', g: 'sin(x)', vista: [-7, 7] },
    { tex: '1+\\sin x', g: '1 + sin(x)', vista: [-6, 6] },
    { tex: 'e^x-2', g: 'exp(x) - 2', vista: [-3, 3] },
    { tex: '\\sec x+\\tan x', g: 'sec(x) + tan(x)', vista: [-1.45, 1.45] }
  ];
  var pendiente = false;

  ui.chips.innerHTML = EJEMPLOS.map(function (p, i) {
    return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false" title="g(x) = ' +
      window.CI.escaparHTML(p.g) + '">' + tex('g=' + p.tex) + '</button>';
  }).join('');

  function compacta(t) {
    return V.normalizar(t).replace(/\s+/g, '');
  }

  function marcarChip() {
    var g = compacta(ui.gx.value);
    var a = compacta(ui.xmin.value);
    var b = compacta(ui.xmax.value);
    Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
      var p = EJEMPLOS[Number(chip.getAttribute('data-indice'))];
      var activo = compacta(p.g) === g && String(p.vista[0]) === a && String(p.vista[1]) === b;
      chip.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
  }

  function marcarInvalido(control) {
    [ui.gx, ui.xmin, ui.xmax].forEach(function (c) { c.setAttribute('aria-invalid', c === control ? 'true' : 'false'); });
  }

  function fallar(control, html) {
    marcarInvalido(control);
    V.mostrarMensaje(ui.mensaje, 'error', html);
    ui.lcd.innerHTML = '';
    ui.resultado.innerHTML = '';
    ui.grafica.style.opacity = '0.35';
  }

  /** Derivada de g: simbólica con math.js; si no se puede, por diferencias centrales. */
  function derivar(cg) {
    var resultado = { f: null, tex: '', simbolica: false };
    try {
      var simplificada = window.math.derivative(cg.nodo, 'x');
      resultado.tex = simplificada.toTex({ parenthesis: 'auto', implicit: 'hide' });
      var sinSimplificar = window.math.derivative(cg.nodo, 'x', { simplify: false });
      var compilada = V.compilarFuncion(sinSimplificar.toString());
      if (compilada.ok) {
        resultado.f = compilada.f;
        resultado.simbolica = true;
      }
    } catch (e) {
      /* se usa la aproximación numérica */
    }
    if (!resultado.f) {
      resultado.f = function (x) {
        var h = 1e-5 * Math.max(1, Math.abs(x));
        return (cg.f(x + h) - cg.f(x - h)) / (2 * h);
      };
    }
    return resultado;
  }

  /** Texto corto para un número en etiquetas (sin HTML). */
  function corto(x) {
    return String(Number(x.toPrecision(4)));
  }

  /** Intervalos del dominio y signo de g en cada uno. */
  function tramos(g, x0, x1, ceros) {
    var puntos = [x0].concat(ceros, [x1]);
    var lista = [];
    for (var i = 0; i + 1 < puntos.length; i++) {
      if (puntos[i + 1] - puntos[i] < 1e-9 * Math.max(1, x1 - x0)) continue;
      var medio = (puntos[i] + puntos[i + 1]) / 2;
      var v = g(medio);
      if (!isFinite(v)) continue; // g no está definida en este tramo
      lista.push({ a: puntos[i], b: puntos[i + 1], signo: v > 0 ? 1 : v < 0 ? -1 : 0 });
    }
    return lista;
  }

  function verificar() {
    try {
      var cg = V.compilarFuncion(ui.gx.value);
      if (!cg.ok) return fallar(ui.gx, cg.error.replace('una función de $x$', 'una función $g(x)$'));
      var la = V.leerNumero(ui.xmin.value, 'x_{\\min}');
      if (!la.ok) return fallar(ui.xmin, la.error);
      var lb = V.leerNumero(ui.xmax.value, 'x_{\\max}');
      if (!lb.ok) return fallar(ui.xmax, lb.error);
      var x0 = la.valor;
      var x1 = lb.valor;
      if (!(x0 < x1)) {
        return fallar(ui.xmax, 'La ventana necesita $x_{\\min}&lt;x_{\\max}$: ahora $x_{\\min}=' + V.formatearTex(x0) + '$ y $x_{\\max}=' + V.formatearTex(x1) + '$.');
      }
      if (x1 - x0 > 2000 || Math.abs(x0) > 1e5 || Math.abs(x1) > 1e5) {
        return fallar(ui.xmax, 'La ventana es demasiado grande. Usa un intervalo de menos de 2000 unidades y con $|x|\\le10^5$.');
      }
      marcarInvalido(null);

      var g = cg.f;
      var d = derivar(cg);
      var integrando = function (x) {
        var gx = g(x);
        return gx === 0 ? NaN : d.f(x) / gx;
      };
      var lnAbs = function (x) {
        var gx = g(x);
        return gx === 0 || !isFinite(gx) ? NaN : Math.log(Math.abs(gx));
      };
      var lnSinAbs = function (x) {
        var gx = g(x);
        return gx > 0 && isFinite(gx) ? Math.log(gx) : NaN;
      };

      var ceros = [];
      try { ceros = N.findRoots(g, x0, x1); } catch (e) { ceros = []; }
      var secciones = tramos(g, x0, x1, ceros);

      // Comprobación numérica de (ln|g|)' = g'/g lejos de los ceros
      var ancho = x1 - x0;
      var comparados = 0;
      var maxima = 0;
      for (var k = 0; k < 97; k++) {
        var x = x0 + ancho * (k + 0.37) / 97;
        var cerca = ceros.some(function (z) { return Math.abs(z - x) < 0.01 * ancho; });
        if (cerca) continue;
        var h = 1e-6 * Math.max(1, Math.abs(x));
        var num = (lnAbs(x + h) - lnAbs(x - h)) / (2 * h);
        var teo = integrando(x);
        if (!isFinite(num) || !isFinite(teo) || Math.abs(teo) > 1e6) continue;
        comparados++;
        maxima = Math.max(maxima, Math.abs(num - teo) / Math.max(1, Math.abs(teo)));
      }

      // Gráfica
      var c = G.colores();
      var curvaI = G.muestrear(integrando, x0, x1, 700);
      var curvaL = G.muestrear(lnAbs, x0, x1, 700);
      var trazas = [];
      var listas = [curvaI.y, curvaL.y];
      var shapes = [];
      var annotations = [];

      secciones.forEach(function (t) {
        if (t.signo < 0) {
          shapes.push({
            type: 'rect', xref: 'x', yref: 'paper', x0: t.a, x1: t.b, y0: 0, y1: 1,
            fillcolor: G.alfa(c.neg, 0.12), line: { width: 0 }, layer: 'below'
          });
        }
      });
      ceros.forEach(function (z, i) {
        shapes.push(lineaCorte(z, c.textoSuave));
        if (i < 6) annotations.push(G.etiquetaSuperior(z, corto(z), c.textoSuave));
      });

      if (ui.mostrarG.checked) {
        var curvaG = G.muestrear(g, x0, x1, 500);
        listas.push(curvaG.y);
        trazas.push({
          x: curvaG.x, y: curvaG.y, type: 'scatter', mode: 'lines', name: 'g(x)',
          line: { color: c.curva, width: 1.6, dash: 'dot' }, hovertemplate: 'x = %{x:.3f}<br>g(x) = %{y:.4f}<extra></extra>'
        });
      }
      if (ui.mostrarLn.checked) {
        var curvaS = G.muestrear(lnSinAbs, x0, x1, 700);
        trazas.push({
          x: curvaS.x, y: curvaS.y, type: 'scatter', mode: 'lines', name: 'ln g(x) (solo donde g > 0)',
          line: { color: c.serie[2], width: 2.4, dash: 'dash' }, hovertemplate: 'x = %{x:.3f}<br>ln g = %{y:.4f}<extra></extra>'
        });
      }
      trazas.push({
        x: curvaI.x, y: curvaI.y, type: 'scatter', mode: 'lines', name: "g′(x)/g(x)",
        line: { color: c.serie[0], width: 2.5 }, hovertemplate: "x = %{x:.3f}<br>g′/g = %{y:.4f}<extra></extra>"
      });
      trazas.push({
        x: curvaL.x, y: curvaL.y, type: 'scatter', mode: 'lines', name: 'ln|g(x)|',
        line: { color: c.serie[1], width: 3 }, hovertemplate: 'x = %{x:.3f}<br>ln|g| = %{y:.4f}<extra></extra>'
      });

      var hayDatos = curvaI.y.some(function (v) { return v !== null; }) || curvaL.y.some(function (v) { return v !== null; });
      if (!hayDatos) {
        return fallar(ui.gx, 'La función $g$ no toma valores reales (o es siempre cero) en esta ventana. Cambia la expresión o los valores de $x_{\\min}$ y $x_{\\max}$.');
      }

      G.dibujar(ui.grafica, trazas, G.layoutBase({
        xaxis: { range: [x0, x1], title: { text: 'x' } },
        yaxis: { range: G.rangoY(listas, { recorte: 0.03, incluir: [0] }) },
        shapes: shapes,
        annotations: annotations,
        hovermode: 'x'
      }));
      ui.grafica.style.opacity = '';

      // Mensajes
      var tiene = secciones.some(function (t) { return t.signo < 0; });
      var avisos = [];
      if (comparados < 10) {
        avisos.push(['adv', 'Hay pocos puntos de la ventana donde $g$ y $g\'$ están definidas a la vez, así que la comprobación numérica no es concluyente.']);
      }
      if (ceros.length) {
        avisos.push(['info', 'En esta ventana $g$ se anula en ' + ceros.slice(0, 6).map(function (z) { return '$x=' + V.formatearTex(z, 4) + '$'; }).join(', ') +
          (ceros.length > 6 ? ' y otros puntos' : '') + '. Allí $\\frac{g\'}{g}$ no existe: ' + (ceros.length + 1) +
          ' tramos independientes, cada uno con su propia constante $C$. ' + (tiene ? 'En las zonas sombreadas $g&lt;0$ y $\\ln g$ no existe, pero $\\ln|g|$ sí.' : '')]);
      } else if (!tiene) {
        avisos.push(['exito', '$g$ no se anula en la ventana y es positiva: aquí el valor absoluto es opcional ($\\ln|g|=\\ln g$).']);
      } else {
        avisos.push(['info', '$g$ es negativa en toda la ventana: $\\ln g$ no existe, pero $\\ln|g|$ sí. Es el caso en que el valor absoluto es imprescindible.']);
      }
      if (avisos.length) {
        // Se muestra el aviso más importante: advertencia > información > éxito
        var orden = { adv: 0, info: 1, exito: 2 };
        avisos.sort(function (p, q) { return orden[p[0]] - orden[q[0]]; });
        V.mostrarMensaje(ui.mensaje, avisos[0][0], avisos[0][1]);
      }

      // Integral definida en toda la ventana (solo si no hay ceros)
      var lecturaIntegral = '';
      if (!ceros.length) {
        try {
          var simpson = N.simpson(integrando, x0, x1, 2000);
          var teorica = lnAbs(x1) - lnAbs(x0);
          if (isFinite(simpson) && isFinite(teorica)) {
            lecturaIntegral =
              V.lectura(tex('\\int_{x_{\\min}}^{x_{\\max}}\\frac{g\'}{g}\\,dx') + ' (Simpson)', V.formatear(simpson, 8), true) +
              V.lectura(tex('\\ln|g(x_{\\max})/g(x_{\\min})|'), V.formatear(teorica, 8)) +
              V.lectura('Diferencia', V.formatear(Math.abs(simpson - teorica), 3));
          }
        } catch (e) {
          lecturaIntegral = '';
        }
      }
      if (!lecturaIntegral) {
        lecturaIntegral = V.lectura(tex('\\int g\'/g\\,dx') + ' en la ventana', ceros.length ? 'cruza ceros de g' : 'no disponible', true);
      }

      ui.lcd.innerHTML =
        V.lectura('Ceros de ' + tex('g'), ceros.length ? ceros.slice(0, 4).map(function (z) { return V.formatear(z, 4); }).join(' ; ') + (ceros.length > 4 ? ' …' : '') : 'ninguno') +
        V.lectura('Tramos del dominio', String(secciones.length)) +
        V.lectura('Máx. ' + tex('|(\\ln|g|)\'-g\'/g|'), comparados ? V.formatear(maxima, 3) : '—') +
        lecturaIntegral;

      var dominio = secciones.map(function (t) {
        return '(' + V.formatearTex(t.a, 4) + ',\\,' + V.formatearTex(t.b, 4) + ')';
      }).join('\\ \\cup\\ ');
      ui.resultado.innerHTML =
        'Antiderivada: $$\\int\\frac{g\'(x)}{g(x)}\\,dx=\\ln\\left|' + cg.tex + '\\right|+C$$' +
        (d.simbolica && d.tex ? 'Derivada calculada por math.js: $$g\'(x)=' + d.tex + '$$' : 'La derivada se aproximó numéricamente porque no se pudo derivar de forma simbólica.') +
        ' Dominio de $\\frac{g\'}{g}$ en la ventana: $' + dominio + '$.';
      window.CI.renderizarMatematicas(ui.resultado);
      marcarChip();
    } catch (e) {
      fallar(null, 'No se pudo analizar la función. Revisa la expresión y la ventana.');
    }
  }

  function programar() {
    if (pendiente) return;
    pendiente = true;
    window.requestAnimationFrame(function () {
      pendiente = false;
      verificar();
    });
  }

  function cargar(p) {
    ui.gx.value = p.g;
    var vista = p.vista || [-4, 4];
    ui.xmin.value = String(vista[0]);
    ui.xmax.value = String(vista[1]);
    verificar();
  }

  ui.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (chip) cargar(EJEMPLOS[Number(chip.getAttribute('data-indice'))]);
  });
  [ui.gx, ui.xmin, ui.xmax].forEach(function (c) { c.addEventListener('input', programar); });
  [ui.mostrarG, ui.mostrarLn].forEach(function (c) { c.addEventListener('change', programar); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-g]'), function (boton) {
    boton.addEventListener('click', function () {
      var datos;
      try { datos = JSON.parse(boton.getAttribute('data-cargar-g')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(datos);
    });
  });

  window.CI.alCambiarTema(verificar);
  cargar(EJEMPLOS[2]);
})();
