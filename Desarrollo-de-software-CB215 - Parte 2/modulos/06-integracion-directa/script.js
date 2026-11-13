/**
 * Módulo 6 · Integración directa
 *
 * 1. Gráficas de los ejemplos: f(x) junto a su antiderivada F(x) + C, con un
 *    deslizador para la constante C y la familia de curvas de fondo.
 * 2. Verificador de antiderivadas: deriva F con math.js (derivación simbólica)
 *    y compara F'(x) con f(x) en muchos puntos de la ventana.
 */
(function () {
  'use strict';

  var V = window.Visualizador;
  var G = window.Graficas;
  if (!V || !G) return;
  var tex = window.CI.tex;

  var FAMILIA = [-4, -2, 0, 2, 4];

  /** Una traza con varios miembros de la familia F(x) + k separados por null. */
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

  /** Rango vertical fijo para que la gráfica no "salte" al mover C. */
  function rangoVertical(f, F, x0, x1) {
    var cf = G.muestrear(f, x0, x1, 300).y;
    var cF = G.muestrear(F, x0, x1, 300).y;
    var arriba = cF.map(function (v) { return v === null ? null : v + 5; });
    var abajo = cF.map(function (v) { return v === null ? null : v - 5; });
    return G.rangoY([cf, arriba, abajo], { recorte: 0.03, incluir: [0] });
  }

  /**
   * Dibuja f, F + C y la familia. Opcionalmente también F'(x) punteada.
   * @param {HTMLElement} div
   * @param {{f: Function, F: Function, C: number, vista: number[], rango: number[], dF?: Function, textoF?: string}} o
   */
  function dibujarFamilia(div, o) {
    var c = G.colores();
    var x0 = o.vista[0];
    var x1 = o.vista[1];
    var curvaF = G.muestrear(o.f, x0, x1, 500);
    var curvaAnti = G.muestrear(function (x) { return o.F(x) + o.C; }, x0, x1, 500);
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
    if (o.dF) {
      var curvaD = G.muestrear(o.dF, x0, x1, 500);
      trazas.push({
        x: curvaD.x, y: curvaD.y, type: 'scatter', mode: 'lines', name: "F′(x) calculada",
        line: { color: c.curva, width: 1.8, dash: 'dot' }, hovertemplate: "x = %{x:.3f}<br>F′(x) = %{y:.4f}<extra></extra>"
      });
    }
    G.dibujar(div, trazas, G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: o.rango },
      hovermode: 'x'
    }));
  }

  /* ---------------------------------------------------------------- */
  /* 1. Gráficas de los ejemplos resueltos                             */
  /* ---------------------------------------------------------------- */

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
    var rango = rangoVertical(cf.f, cF.f, datos.vista[0], datos.vista[1]);
    function pintar() {
      var C = Number(control.value);
      salida.textContent = String(C).replace('-', '−');
      dibujarFamilia(div, { f: cf.f, F: cF.f, C: C, vista: datos.vista, rango: rango });
    }
    control.addEventListener('input', pintar);
    window.CI.alCambiarTema(pintar);
    pintar();
  });

  /* ---------------------------------------------------------------- */
  /* 2. Verificador de antiderivadas (pestaña del visualizador)        */
  /* ---------------------------------------------------------------- */

  var form = document.getElementById('vis-antiderivada');
  if (!form) return;

  var ui = {
    fx: document.getElementById('fx'),
    Fx: document.getElementById('Fx'),
    chips: document.getElementById('chips-antiderivada'),
    mensaje: document.getElementById('mensaje-antiderivada'),
    grafica: document.getElementById('grafica-antiderivada'),
    cRango: document.getElementById('c-rango'),
    cNumero: document.getElementById('c-numero'),
    lcd: document.getElementById('lcd-antiderivada'),
    derivada: document.getElementById('derivada-tex')
  };

  var PARES = [
    { tex: '3x^2', f: '3x^2', F: 'x^3', vista: [-2.5, 2.5] },
    { tex: '2x^3-5x+7', f: '2x^3 - 5x + 7', F: 'x^4/2 - 5x^2/2 + 7x', vista: [-2.6, 2.6] },
    { tex: '\\tfrac{1}{x}', f: '1/x', F: 'log(abs(x))', vista: [-4, 4] },
    { tex: '\\sqrt[3]{x}+\\tfrac{2}{x^3}', f: 'cbrt(x) + 2/x^3', F: '3/4*cbrt(x)^4 - 1/x^2', vista: [-3, 3] },
    { tex: '\\cos x', f: 'cos(x)', F: 'sin(x)', vista: [-6.5, 6.5] },
    { tex: 'x\\,e^{x}', f: 'x*exp(x)', F: '(x - 1)*exp(x)', vista: [-4, 1.6] },
    { tex: '\\text{error: }x^2\\to x^3', f: 'x^2', F: 'x^3', vista: [-2.5, 2.5] }
  ];
  var VISTA_POR_DEFECTO = [-4, 4];
  var estado = { vista: VISTA_POR_DEFECTO.slice() };
  var pendiente = false;

  ui.chips.innerHTML = PARES.map(function (p, i) {
    return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false" title="f(x) = ' +
      window.CI.escaparHTML(p.f) + ', F(x) = ' + window.CI.escaparHTML(p.F) + '">' + tex(p.tex) + '</button>';
  }).join('');

  function compacta(t) {
    return V.normalizar(t).replace(/\s+/g, '');
  }

  function marcarChip() {
    var f = compacta(ui.fx.value);
    var F = compacta(ui.Fx.value);
    Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
      var p = PARES[Number(chip.getAttribute('data-indice'))];
      chip.setAttribute('aria-pressed', compacta(p.f) === f && compacta(p.F) === F ? 'true' : 'false');
    });
  }

  function marcarInvalido(control) {
    [ui.fx, ui.Fx].forEach(function (c) { c.setAttribute('aria-invalid', c === control ? 'true' : 'false'); });
  }

  function fallar(control, html) {
    marcarInvalido(control);
    V.mostrarMensaje(ui.mensaje, 'error', html);
    ui.lcd.innerHTML = '';
    ui.derivada.innerHTML = '';
    ui.grafica.style.opacity = '0.35';
  }

  /** Derivada de F: simbólica con math.js; si no se puede, por diferencias centrales. */
  function derivar(cF) {
    var resultado = { f: null, tex: '', simbolica: false };
    try {
      var simplificada = window.math.derivative(cF.nodo, 'x');
      resultado.tex = simplificada.toTex({ parenthesis: 'auto', implicit: 'hide' });
      // Para evaluar se usa la derivada sin simplificar: evita potencias fraccionarias de x < 0
      var sinSimplificar = window.math.derivative(cF.nodo, 'x', { simplify: false });
      var compilada = V.compilarFuncion(sinSimplificar.toString(), { variables: ['x', 'C'], valores: { C: 0 } });
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
        return (cF.f(x + h) - cF.f(x - h)) / (2 * h);
      };
    }
    return resultado;
  }

  function verificar() {
    try {
      var cf = V.compilarFuncion(ui.fx.value);
      if (!cf.ok) return fallar(ui.fx, cf.error);
      var cF = V.compilarFuncion(ui.Fx.value, { variables: ['x', 'C'], valores: { C: 0 } });
      if (!cF.ok) return fallar(ui.Fx, cF.error.replace('una función de $x$', 'una antiderivada $F(x)$'));
      marcarInvalido(null);

      var C = Number(ui.cNumero.value);
      if (!isFinite(C)) C = 0;
      var d = derivar(cF);

      // Comparación punto a punto (se evitan valores exactos como x = 0)
      var x0 = estado.vista[0];
      var x1 = estado.vista[1];
      var comparados = 0;
      var maxima = 0;
      var peor = null;
      for (var k = 0; k < 97; k++) {
        var x = x0 + (x1 - x0) * (k + 0.37) / 97;
        var fx = cf.f(x);
        var dx = d.f(x);
        if (!isFinite(fx) || !isFinite(dx) || Math.abs(fx) > 1e8) continue;
        comparados++;
        var diferencia = Math.abs(dx - fx) / Math.max(1, Math.abs(fx));
        if (diferencia > maxima) {
          maxima = diferencia;
          peor = { x: x, fx: fx, dx: dx };
        }
      }
      var tolerancia = d.simbolica ? 1e-8 : 1e-5;
      var correcta = comparados >= 10 && maxima <= tolerancia;

      if (comparados < 10) {
        V.mostrarMensaje(ui.mensaje, 'adv', 'No hay suficientes puntos de la ventana donde $f$ y $F$ estén definidas a la vez. Revisa el dominio de las expresiones.');
      } else if (correcta) {
        V.mostrarMensaje(ui.mensaje, 'exito', '¡Correcto! $F\'(x)=f(x)$ en los ' + comparados + ' puntos comparados, así que $\\int f(x)\\,dx=F(x)+C$.');
      } else {
        V.mostrarMensaje(ui.mensaje, 'error', '$F$ no es una antiderivada de $f$: en $x=' + V.formatearTex(peor.x, 4) + '$ se obtiene $F\'(x)=' +
          V.formatearTex(peor.dx, 6) + '$, pero $f(x)=' + V.formatearTex(peor.fx, 6) + '$. Revisa tu resultado derivándolo.');
      }

      ui.lcd.innerHTML =
        V.lectura('Veredicto', comparados < 10 ? 'sin datos' : correcta ? '✓ correcta' : '✗ no coincide', true) +
        V.lectura('Puntos comparados', String(comparados)) +
        V.lectura('Máx. ' + tex('|F\'-f|') + ' relativa', V.formatear(maxima, 3)) +
        V.lectura('Constante ' + tex('C'), V.formatear(C, 3));

      ui.derivada.innerHTML = d.simbolica && d.tex
        ? 'Derivada de $F$ calculada por math.js: $$F\'(x)=' + d.tex + '$$'
        : 'La derivada se aproximó numéricamente (diferencias centrales) porque la expresión no se pudo derivar simbólicamente.';
      window.CI.renderizarMatematicas(ui.derivada);

      dibujarFamilia(ui.grafica, {
        f: cf.f, F: cF.f, C: C, vista: estado.vista, dF: d.f,
        rango: rangoVertical(cf.f, cF.f, estado.vista[0], estado.vista[1])
      });
      ui.grafica.style.opacity = '';
      marcarChip();
    } catch (e) {
      fallar(null, 'No se pudo verificar la antiderivada. Revisa las expresiones.');
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

  function cargar(par) {
    ui.fx.value = par.f;
    ui.Fx.value = par.F;
    var conocido = PARES.find(function (p) { return compacta(p.f) === compacta(par.f) && compacta(p.F) === compacta(par.F); });
    estado.vista = (par.vista || (conocido && conocido.vista) || VISTA_POR_DEFECTO).slice();
    verificar();
  }

  ui.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (chip) cargar(PARES[Number(chip.getAttribute('data-indice'))]);
  });
  ui.fx.addEventListener('input', programar);
  ui.Fx.addEventListener('input', programar);
  ui.cRango.addEventListener('input', function () {
    ui.cNumero.value = ui.cRango.value;
    programar();
  });
  ui.cNumero.addEventListener('input', function () {
    var v = Number(ui.cNumero.value);
    if (isFinite(v)) ui.cRango.value = Math.max(-5, Math.min(5, v));
    programar();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-antiderivada]'), function (boton) {
    boton.addEventListener('click', function () {
      var datos;
      try { datos = JSON.parse(boton.getAttribute('data-cargar-antiderivada')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(datos);
    });
  });

  window.CI.alCambiarTema(verificar);
  cargar(PARES[1]);
})();
