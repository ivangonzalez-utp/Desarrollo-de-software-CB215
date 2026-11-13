/**
 * Módulo 10 · Integrales trigonométricas
 *
 * 1. Gráficas de los ejemplos: f(x) junto a F(x) + C con deslizador para C.
 * 2. Verificador de identidades: compara u(x) y v(x) en cientos de puntos,
 *    grafica ambas expresiones y su diferencia (y detecta diferencias constantes).
 * 3. Verificador de antiderivadas: deriva F con math.js, compara F' con f y
 *    contrasta F(b) − F(a) con la integral numérica de f en la ventana.
 */
(function () {
  'use strict';

  var V = window.Visualizador;
  var G = window.Graficas;
  var N = window.Numerics;
  if (!V || !G || !N) return;
  var tex = window.CI.tex;

  var FAMILIA = [-4, -2, 0, 2, 4];

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
    var cf = G.muestrear(f, x0, x1, 400).y;
    var cF = G.muestrear(F, x0, x1, 400).y;
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
    G.dibujar(div, [
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
    ], G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: o.rango },
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
      dibujarEjemplo(div, { f: cf.f, F: cF.f, C: C, vista: datos.vista, rango: rango });
    }
    control.addEventListener('input', pintar);
    window.CI.alCambiarTema(pintar);
    pintar();
  });

  /* ---------------------------------------------------------------- */
  /* Utilidades comunes de los dos verificadores                       */
  /* ---------------------------------------------------------------- */

  var formId = document.getElementById('vis-identidad');
  var formAn = document.getElementById('vis-anti');
  if (!formId || !formAn) return;

  function compacta(t) {
    return V.normalizar(t).replace(/\s+/g, '');
  }

  /** Lee la ventana [xmin, xmax]; devuelve {ok, x0, x1} o {ok:false, control, error}. */
  function leerVentana(entMin, entMax) {
    var la = V.leerNumero(entMin.value, 'x_{\\min}');
    if (!la.ok) return { ok: false, control: entMin, error: la.error };
    var lb = V.leerNumero(entMax.value, 'x_{\\max}');
    if (!lb.ok) return { ok: false, control: entMax, error: lb.error };
    if (!(la.valor < lb.valor)) {
      return {
        ok: false, control: entMax,
        error: 'La ventana necesita $x_{\\min}&lt;x_{\\max}$: ahora $x_{\\min}=' + V.formatearTex(la.valor) + '$ y $x_{\\max}=' + V.formatearTex(lb.valor) + '$.'
      };
    }
    if (lb.valor - la.valor > 2000 || Math.abs(la.valor) > 1e5 || Math.abs(lb.valor) > 1e5) {
      return { ok: false, control: entMax, error: 'La ventana es demasiado grande. Usa un intervalo de menos de 2000 unidades y con $|x|\\le10^5$.' };
    }
    return { ok: true, x0: la.valor, x1: lb.valor };
  }

  function chipsHtml(lista, prefijo) {
    return lista.map(function (p, i) {
      return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false" title="' +
        window.CI.escaparHTML(p.titulo) + '">' + tex(p.tex) + '</button>';
    }).join('');
  }

  function programador(fn) {
    var pendiente = false;
    return function () {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(function () {
        pendiente = false;
        fn();
      });
    };
  }

  /* ---------------------------------------------------------------- */
  /* 2. Verificador de identidades                                     */
  /* ---------------------------------------------------------------- */

  var idUi = {
    u: document.getElementById('id-u'),
    v: document.getElementById('id-v'),
    xmin: document.getElementById('id-xmin'),
    xmax: document.getElementById('id-xmax'),
    chips: document.getElementById('chips-identidad'),
    mensaje: document.getElementById('mensaje-identidad'),
    grafica: document.getElementById('grafica-identidad'),
    lcd: document.getElementById('lcd-identidad')
  };

  var IDENTIDADES = [
    { tex: '\\sin^2x', u: 'sin(x)^2', v: '(1 - cos(2*x))/2', vista: [-6.5, 6.5], titulo: 'sin(x)^2 = (1 - cos(2x))/2' },
    { tex: '\\cos2x', u: 'cos(2*x)', v: '1 - 2*sin(x)^2', vista: [-6.5, 6.5], titulo: 'cos(2x) = 1 - 2 sin(x)^2' },
    { tex: '\\sin2x', u: 'sin(2*x)', v: '2*sin(x)*cos(x)', vista: [-6.5, 6.5], titulo: 'sin(2x) = 2 sin(x) cos(x)' },
    { tex: '1+\\tan^2x', u: '1 + tan(x)^2', v: 'sec(x)^2', vista: [-1.4, 1.4], titulo: '1 + tan(x)^2 = sec(x)^2' },
    { tex: '\\sin3x\\cos5x', u: 'sin(3*x)*cos(5*x)', v: '(sin(8*x) - sin(2*x))/2', vista: [-6.5, 6.5], titulo: 'producto a suma' },
    { tex: '\\cos^4x', u: 'cos(x)^4', v: '(3 + 4*cos(2*x) + cos(4*x))/8', vista: [-6.5, 6.5], titulo: 'cos(x)^4 reducido' },
    { tex: '\\sin^2x\\ \\text{y}\\ -\\cos^2x', u: 'sin(x)^2', v: '-cos(x)^2', vista: [-6.5, 6.5], titulo: 'difieren en una constante' },
    { tex: '\\text{falsa: }\\sin2x=2\\sin x', u: 'sin(2*x)', v: '2*sin(x)', vista: [-6.5, 6.5], titulo: 'identidad falsa' },
    { tex: '\\text{falsa: }\\cos2x=\\cos^2x', u: 'cos(2*x)', v: 'cos(x)^2', vista: [-6.5, 6.5], titulo: 'identidad falsa' }
  ];

  idUi.chips.innerHTML = chipsHtml(IDENTIDADES);

  function marcarChipsId() {
    var u = compacta(idUi.u.value);
    var v = compacta(idUi.v.value);
    Array.prototype.forEach.call(idUi.chips.querySelectorAll('.chip'), function (chip) {
      var p = IDENTIDADES[Number(chip.getAttribute('data-indice'))];
      chip.setAttribute('aria-pressed', compacta(p.u) === u && compacta(p.v) === v ? 'true' : 'false');
    });
  }

  function marcarInvalidoId(control) {
    [idUi.u, idUi.v, idUi.xmin, idUi.xmax].forEach(function (c) { c.setAttribute('aria-invalid', c === control ? 'true' : 'false'); });
  }

  function fallarId(control, html) {
    marcarInvalidoId(control);
    V.mostrarMensaje(idUi.mensaje, 'error', html);
    idUi.lcd.innerHTML = '';
    idUi.grafica.style.opacity = '0.35';
  }

  function verificarIdentidad() {
    try {
      var cu = V.compilarFuncion(idUi.u.value);
      if (!cu.ok) return fallarId(idUi.u, cu.error.replace('una función de $x$', 'una expresión $u(x)$'));
      var cv = V.compilarFuncion(idUi.v.value);
      if (!cv.ok) return fallarId(idUi.v, cv.error.replace('una función de $x$', 'una expresión $v(x)$'));
      var w = leerVentana(idUi.xmin, idUi.xmax);
      if (!w.ok) return fallarId(w.control, w.error);
      marcarInvalidoId(null);

      var x0 = w.x0;
      var x1 = w.x1;
      var n = 600;
      var comparados = 0;
      var soloUna = 0;
      var maxAbs = 0;
      var maxRel = 0;
      var peor = null;
      var dMin = Infinity;
      var dMax = -Infinity;
      for (var k = 0; k < n; k++) {
        var x = x0 + (x1 - x0) * (k + 0.37) / n;
        var a = cu.f(x);
        var b = cv.f(x);
        var fa = isFinite(a);
        var fb = isFinite(b);
        if (fa !== fb) { soloUna++; continue; }
        if (!fa || Math.abs(a) > 1e8 || Math.abs(b) > 1e8) continue;
        comparados++;
        var dif = a - b;
        var rel = Math.abs(dif) / Math.max(1, Math.abs(a), Math.abs(b));
        if (Math.abs(dif) > maxAbs) maxAbs = Math.abs(dif);
        if (rel > maxRel) { maxRel = rel; peor = { x: x, a: a, b: b }; }
        dMin = Math.min(dMin, dif);
        dMax = Math.max(dMax, dif);
      }

      var iguales = comparados >= 20 && maxRel <= 1e-9;
      var constante = !iguales && comparados >= 20 && (dMax - dMin) <= 1e-9 * Math.max(1, Math.abs(dMax), Math.abs(dMin));
      var veredicto = comparados < 20 ? 'sin datos' : iguales ? '✓ coinciden' : constante ? '≈ difieren en una constante' : '✗ no coinciden';

      if (comparados < 20) {
        V.mostrarMensaje(idUi.mensaje, 'adv', 'Hay muy pocos puntos de la ventana donde ambas expresiones están definidas (' + comparados + '). Cambia la ventana o las expresiones.');
      } else if (iguales) {
        V.mostrarMensaje(idUi.mensaje, soloUna ? 'adv' : 'exito',
          '$u(x)$ y $v(x)$ coinciden en los ' + comparados + ' puntos comparados (diferencia máxima $' + V.formatearTex(maxAbs, 3) + '$). Es consistente con una identidad, aunque una comprobación numérica no es una demostración.' +
          (soloUna ? ' Ojo: en ' + soloUna + ' puntos solo una de las dos está definida, así que sus dominios no son iguales.' : ''));
      } else if (constante) {
        V.mostrarMensaje(idUi.mensaje, 'info',
          'No son idénticas, pero $u(x)-v(x)$ vale siempre $' + V.formatearTex((dMax + dMin) / 2, 6) + '$: difieren en una constante. Por eso, como antiderivadas de la misma función, ambas serían correctas (cambia el valor de $C$).');
      } else {
        V.mostrarMensaje(idUi.mensaje, 'error',
          '$u$ y $v$ <strong>no</strong> son idénticas: en $x=' + V.formatearTex(peor.x, 4) + '$ se tiene $u=' + V.formatearTex(peor.a, 6) + '$ y $v=' + V.formatearTex(peor.b, 6) +
          '$. Un solo punto con valores distintos basta para refutar la identidad.');
      }

      idUi.lcd.innerHTML =
        V.lectura('Veredicto', veredicto, true) +
        V.lectura('Puntos comparados', String(comparados)) +
        V.lectura('Máx. ' + tex('|u-v|'), comparados ? V.formatear(maxAbs, 3) : '—') +
        V.lectura('Máx. diferencia relativa', comparados ? V.formatear(maxRel, 3) : '—');

      // Gráfica: arriba u y v; abajo la diferencia
      var c = G.colores();
      var cuvA = G.muestrear(cu.f, x0, x1, 700);
      var cuvB = G.muestrear(cv.f, x0, x1, 700);
      var diferencia = function (x) {
        var a = cu.f(x);
        var b = cv.f(x);
        return isFinite(a) && isFinite(b) ? a - b : NaN;
      };
      var cDif = G.muestrear(diferencia, x0, x1, 700);
      var rangoArriba = G.rangoY([cuvA.y, cuvB.y], { recorte: 0.02 });
      var rangoDif = maxAbs < 1e-6 ? [-1, 1] : G.rangoY([cDif.y], { recorte: 0.01, incluir: [0] });
      var layout = G.layoutBase({
        xaxis: { range: [x0, x1], title: { text: 'x' }, anchor: 'y2' },
        yaxis: { range: rangoArriba, domain: [0.4, 1] },
        hovermode: 'x'
      });
      layout.yaxis2 = Object.assign({}, layout.yaxis, {
        range: rangoDif, domain: [0, 0.28], anchor: 'x', title: { text: 'u − v', font: layout.yaxis.title && layout.yaxis.title.font }
      });
      layout.xaxis.domain = [0, 1];
      G.dibujar(idUi.grafica, [
        {
          x: cuvA.x, y: cuvA.y, type: 'scatter', mode: 'lines', name: 'u(x)',
          line: { color: c.serie[0], width: 3 }, hovertemplate: 'x = %{x:.3f}<br>u = %{y:.5f}<extra></extra>'
        },
        {
          x: cuvB.x, y: cuvB.y, type: 'scatter', mode: 'lines', name: 'v(x)',
          line: { color: c.serie[1], width: 2.2, dash: 'dash' }, hovertemplate: 'x = %{x:.3f}<br>v = %{y:.5f}<extra></extra>'
        },
        {
          x: cDif.x, y: cDif.y, type: 'scatter', mode: 'lines', name: 'u(x) − v(x)', yaxis: 'y2',
          line: { color: c.serie[2], width: 2 }, hovertemplate: 'x = %{x:.3f}<br>u − v = %{y:.3e}<extra></extra>'
        }
      ], layout);
      idUi.grafica.style.opacity = '';
      marcarChipsId();
    } catch (e) {
      fallarId(null, 'No se pudo comparar las expresiones. Revisa lo que escribiste.');
    }
  }

  var programarId = programador(verificarIdentidad);

  function cargarIdentidad(p) {
    idUi.u.value = p.u;
    idUi.v.value = p.v;
    var vista = p.vista || [-6.5, 6.5];
    idUi.xmin.value = String(vista[0]);
    idUi.xmax.value = String(vista[1]);
    verificarIdentidad();
  }

  idUi.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (chip) cargarIdentidad(IDENTIDADES[Number(chip.getAttribute('data-indice'))]);
  });
  [idUi.u, idUi.v, idUi.xmin, idUi.xmax].forEach(function (c) { c.addEventListener('input', programarId); });
  formId.addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---------------------------------------------------------------- */
  /* 3. Verificador de antiderivadas                                   */
  /* ---------------------------------------------------------------- */

  var anUi = {
    f: document.getElementById('an-f'),
    F: document.getElementById('an-F'),
    xmin: document.getElementById('an-xmin'),
    xmax: document.getElementById('an-xmax'),
    chips: document.getElementById('chips-anti'),
    mensaje: document.getElementById('mensaje-anti'),
    grafica: document.getElementById('grafica-anti'),
    lcd: document.getElementById('lcd-anti'),
    resultado: document.getElementById('resultado-anti')
  };

  var ANTIDERIVADAS = [
    { tex: '\\sin^3x', f: 'sin(x)^3', F: '-cos(x) + cos(x)^3/3', vista: [0, 6.2832], titulo: 'sin(x)^3' },
    { tex: '\\cos^4x', f: 'cos(x)^4', F: '3*x/8 + sin(2*x)/4 + sin(4*x)/32', vista: [-3.2, 3.2], titulo: 'cos(x)^4' },
    { tex: '\\sin3x\\cos5x', f: 'sin(3*x)*cos(5*x)', F: '-cos(8*x)/16 + cos(2*x)/4', vista: [0, 3.1416], titulo: 'sin(3x)cos(5x)' },
    { tex: '\\tan^3x', f: 'tan(x)^3', F: 'tan(x)^2/2 + log(abs(cos(x)))', vista: [-1.35, 1.35], titulo: 'tan(x)^3' },
    { tex: '\\sec^4x', f: 'sec(x)^4', F: 'tan(x) + tan(x)^3/3', vista: [-1.3, 1.3], titulo: 'sec(x)^4' },
    { tex: '\\tan x\\sec^3x', f: 'tan(x)*sec(x)^3', F: 'sec(x)^3/3', vista: [-1.3, 1.3], titulo: 'tan(x)sec(x)^3' },
    { tex: '\\sin x\\cos x', f: 'sin(x)*cos(x)', F: 'sin(x)^2/2', vista: [-6.5, 6.5], titulo: 'sin(x)cos(x), con F = sin²x/2' },
    { tex: '\\sin x\\cos x\\ (-\\cos2x/4)', f: 'sin(x)*cos(x)', F: '-cos(2*x)/4', vista: [-6.5, 6.5], titulo: 'otra antiderivada de sin(x)cos(x)' },
    { tex: '\\text{error: }\\sin^2x\\to\\tfrac{\\sin^3x}{3}', f: 'sin(x)^2', F: 'sin(x)^3/3', vista: [-6.5, 6.5], titulo: 'error frecuente' },
    { tex: '\\text{error: }\\sin2x\\to-\\cos2x', f: 'sin(2*x)', F: '-cos(2*x)', vista: [-6.5, 6.5], titulo: 'falta dividir entre 2' }
  ];

  anUi.chips.innerHTML = chipsHtml(ANTIDERIVADAS);

  function marcarChipsAn() {
    var f = compacta(anUi.f.value);
    var F = compacta(anUi.F.value);
    Array.prototype.forEach.call(anUi.chips.querySelectorAll('.chip'), function (chip) {
      var p = ANTIDERIVADAS[Number(chip.getAttribute('data-indice'))];
      chip.setAttribute('aria-pressed', compacta(p.f) === f && compacta(p.F) === F ? 'true' : 'false');
    });
  }

  function marcarInvalidoAn(control) {
    [anUi.f, anUi.F, anUi.xmin, anUi.xmax].forEach(function (c) { c.setAttribute('aria-invalid', c === control ? 'true' : 'false'); });
  }

  function fallarAn(control, html) {
    marcarInvalidoAn(control);
    V.mostrarMensaje(anUi.mensaje, 'error', html);
    anUi.lcd.innerHTML = '';
    anUi.resultado.innerHTML = '';
    anUi.grafica.style.opacity = '0.35';
  }

  /** Derivada de F: simbólica con math.js; si no se puede, diferencias centrales. */
  function derivar(cF) {
    var resultado = { f: null, tex: '', simbolica: false };
    try {
      var simplificada = window.math.derivative(cF.nodo, 'x');
      resultado.tex = simplificada.toTex({ parenthesis: 'auto', implicit: 'hide' });
      var sinSimplificar = window.math.derivative(cF.nodo, 'x', { simplify: false });
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
        return (cF.f(x + h) - cF.f(x - h)) / (2 * h);
      };
    }
    return resultado;
  }

  function verificarAntiderivada() {
    try {
      var cf = V.compilarFuncion(anUi.f.value);
      if (!cf.ok) return fallarAn(anUi.f, cf.error);
      var cF = V.compilarFuncion(anUi.F.value);
      if (!cF.ok) return fallarAn(anUi.F, cF.error.replace('una función de $x$', 'una antiderivada $F(x)$'));
      var w = leerVentana(anUi.xmin, anUi.xmax);
      if (!w.ok) return fallarAn(w.control, w.error);
      marcarInvalidoAn(null);

      var x0 = w.x0;
      var x1 = w.x1;
      var d = derivar(cF);
      var comparados = 0;
      var maxima = 0;
      var peor = null;
      for (var k = 0; k < 197; k++) {
        var x = x0 + (x1 - x0) * (k + 0.37) / 197;
        var fx = cf.f(x);
        var dx = d.f(x);
        if (!isFinite(fx) || !isFinite(dx) || Math.abs(fx) > 1e6) continue;
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
        V.mostrarMensaje(anUi.mensaje, 'adv', 'No hay suficientes puntos de la ventana donde $f$ y $F\'$ estén definidas a la vez. Revisa el dominio de las expresiones o cambia la ventana.');
      } else if (correcta) {
        V.mostrarMensaje(anUi.mensaje, 'exito', '¡Correcto! $F\'(x)=f(x)$ en los ' + comparados + ' puntos comparados, así que $\\int f(x)\\,dx=F(x)+C$ en esa ventana.');
      } else {
        V.mostrarMensaje(anUi.mensaje, 'error', '$F$ no es una antiderivada de $f$: en $x=' + V.formatearTex(peor.x, 4) + '$ se obtiene $F\'(x)=' +
          V.formatearTex(peor.dx, 6) + '$, pero $f(x)=' + V.formatearTex(peor.fx, 6) + '$. Revisa tu resultado derivándolo (¿signo? ¿dividiste entre el coeficiente del ángulo?).');
      }

      // Teorema fundamental: F(b) − F(a) frente a la integral numérica
      var lecturaTfc = '';
      var Fa = cF.f(x0);
      var Fb = cF.f(x1);
      if (isFinite(Fa) && isFinite(Fb)) {
        var simpson = null;
        try { simpson = N.simpson(cf.f, x0, x1, 2000); } catch (e) { simpson = null; }
        if (simpson !== null && isFinite(simpson)) {
          lecturaTfc =
            V.lectura(tex('\\int_{x_{\\min}}^{x_{\\max}}f\\,dx') + ' (Simpson)', V.formatear(simpson, 8)) +
            V.lectura(tex('F(x_{\\max})-F(x_{\\min})'), V.formatear(Fb - Fa, 8)) +
            V.lectura('Diferencia', V.formatear(Math.abs(simpson - (Fb - Fa)), 3));
        }
      }

      anUi.lcd.innerHTML =
        V.lectura('Veredicto', comparados < 10 ? 'sin datos' : correcta ? '✓ correcta' : '✗ no coincide', true) +
        V.lectura('Puntos comparados', String(comparados)) +
        V.lectura('Máx. ' + tex('|F\'-f|') + ' relativa', comparados ? V.formatear(maxima, 3) : '—') +
        lecturaTfc;

      anUi.resultado.innerHTML = d.simbolica && d.tex
        ? 'Derivada de $F$ calculada por math.js: $$F\'(x)=' + d.tex + '$$'
        : 'La derivada se aproximó numéricamente (diferencias centrales) porque la expresión no se pudo derivar simbólicamente.';
      window.CI.renderizarMatematicas(anUi.resultado);

      var c = G.colores();
      var curvaf = G.muestrear(cf.f, x0, x1, 700);
      var curvaF = G.muestrear(cF.f, x0, x1, 700);
      var curvaD = G.muestrear(d.f, x0, x1, 700);
      G.dibujar(anUi.grafica, [
        {
          x: curvaf.x, y: curvaf.y, type: 'scatter', mode: 'lines', name: 'f(x)',
          line: { color: c.serie[0], width: 2.5 }, hovertemplate: 'x = %{x:.3f}<br>f = %{y:.4f}<extra></extra>'
        },
        {
          x: curvaF.x, y: curvaF.y, type: 'scatter', mode: 'lines', name: 'F(x)',
          line: { color: c.serie[1], width: 3 }, hovertemplate: 'x = %{x:.3f}<br>F = %{y:.4f}<extra></extra>'
        },
        {
          x: curvaD.x, y: curvaD.y, type: 'scatter', mode: 'lines', name: 'F′(x) calculada',
          line: { color: c.curva, width: 1.8, dash: 'dot' }, hovertemplate: 'x = %{x:.3f}<br>F′ = %{y:.4f}<extra></extra>'
        }
      ], G.layoutBase({
        xaxis: { range: [x0, x1], title: { text: 'x' } },
        yaxis: { range: G.rangoY([curvaf.y, curvaF.y], { recorte: 0.03, incluir: [0] }) },
        hovermode: 'x'
      }));
      anUi.grafica.style.opacity = '';
      marcarChipsAn();
    } catch (e) {
      fallarAn(null, 'No se pudo verificar la antiderivada. Revisa las expresiones.');
    }
  }

  var programarAn = programador(verificarAntiderivada);

  function cargarAntiderivada(p) {
    anUi.f.value = p.f;
    anUi.F.value = p.F;
    var vista = p.vista || [-6.5, 6.5];
    anUi.xmin.value = String(vista[0]);
    anUi.xmax.value = String(vista[1]);
    verificarAntiderivada();
  }

  anUi.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (chip) cargarAntiderivada(ANTIDERIVADAS[Number(chip.getAttribute('data-indice'))]);
  });
  [anUi.f, anUi.F, anUi.xmin, anUi.xmax].forEach(function (c) { c.addEventListener('input', programarAn); });
  formAn.addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---------------------------------------------------------------- */
  /* Selector de herramienta y botones de los ejemplos                 */
  /* ---------------------------------------------------------------- */

  var radios = document.querySelectorAll('input[name="modo-trig"]');

  function mostrarHerramienta(modo) {
    var esId = modo === 'identidad';
    formId.hidden = !esId;
    formAn.hidden = esId;
    Array.prototype.forEach.call(radios, function (r) { r.checked = r.value === modo; });
    if (esId) verificarIdentidad(); else verificarAntiderivada();
  }

  Array.prototype.forEach.call(radios, function (r) {
    r.addEventListener('change', function () { if (r.checked) mostrarHerramienta(r.value); });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-anti]'), function (boton) {
    boton.addEventListener('click', function () {
      var datos;
      try { datos = JSON.parse(boton.getAttribute('data-cargar-anti')); } catch (e) { return; }
      formId.hidden = true;
      formAn.hidden = false;
      Array.prototype.forEach.call(radios, function (r) { r.checked = r.value === 'antiderivada'; });
      V.irAlVisualizador(formAn);
      cargarAntiderivada(datos);
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-identidad]'), function (boton) {
    boton.addEventListener('click', function () {
      var datos;
      try { datos = JSON.parse(boton.getAttribute('data-cargar-identidad')); } catch (e) { return; }
      formAn.hidden = true;
      formId.hidden = false;
      Array.prototype.forEach.call(radios, function (r) { r.checked = r.value === 'identidad'; });
      V.irAlVisualizador(formId);
      cargarIdentidad(datos);
    });
  });

  window.CI.alCambiarTema(function () {
    if (!formId.hidden) verificarIdentidad(); else verificarAntiderivada();
  });

  // Estado inicial: ambos formularios con datos; solo el de identidades es visible
  anUi.f.value = ANTIDERIVADAS[0].f;
  anUi.F.value = ANTIDERIVADAS[0].F;
  anUi.xmin.value = String(ANTIDERIVADAS[0].vista[0]);
  anUi.xmax.value = String(ANTIDERIVADAS[0].vista[1]);
  cargarIdentidad(IDENTIDADES[0]);
})();
