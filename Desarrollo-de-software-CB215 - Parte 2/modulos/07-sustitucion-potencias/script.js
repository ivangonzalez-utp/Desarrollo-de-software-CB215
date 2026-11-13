/**
 * Módulo 7 · Sustitución: integrales de potencias
 *
 * Visualizador del cambio de variable u = g(x):
 *  - Izquierda: integrando f(g(x))·g'(x) en [a, b] con el área sombreada.
 *  - Derecha:   integrando f(u) entre g(a) y g(b) con el área sombreada.
 *  Ambas integrales (Simpson) coinciden. Si se escribe una antiderivada F(u),
 *  se verifica derivándola con math.js y comparando F'(u) con f(u).
 * Las mismas gráficas se usan en los ejemplos resueltos.
 */
(function () {
  'use strict';

  var V = window.Visualizador;
  var G = window.Graficas;
  var N = window.Numerics;
  if (!V || !G || !N) return;
  var tex = window.CI.tex;

  var PUNTOS_SIMPSON = 2000;

  /* ---------------------------------------------------------------- */
  /* Utilidades                                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Compila una función escrita con la variable u (se traduce internamente a x).
   * @param {string} texto
   * @returns {{ok: boolean, f?: Function, nodo?: Object, error?: string}}
   */
  function compilarEnU(texto) {
    var t = V.normalizar(texto);
    if (!t) return { ok: false, error: 'Escribe una función de $u$, por ejemplo <code>u^3</code> o <code>sqrt(u)</code>.' };
    if (/\bx\b/.test(t)) {
      return { ok: false, error: 'Escribe esta función con la variable <code>u</code> (no con <code>x</code>): $f$ y $F$ dependen de $u=g(x)$.' };
    }
    try {
      window.math.parse(t);
    } catch (e) {
      return {
        ok: false,
        error: 'No pude interpretar <code>' + window.CI.escaparHTML(texto) + '</code>. Revisa los paréntesis y los operadores: usa ' +
          '<code>*</code> para multiplicar (<code>2*u</code>), <code>^</code> para potencias (<code>u^2</code>) y funciones como ' +
          '<code>sqrt(u)</code>, <code>exp(u)</code> o <code>sin(u)</code>.'
      };
    }
    var r = V.compilarFuncion(t.replace(/\bu\b/g, 'x'));
    if (!r.ok) {
      r.error = r.error.replace(/función de \$x\$/g, 'función de $u$').replace(/<code>x<\/code>/g, '<code>u</code>');
    }
    return r;
  }

  /** Derivada simbólica (math.js) de una función compilada; si falla, diferencias centrales. */
  function derivar(c) {
    var d = { f: null, tex: '', simbolica: false };
    try {
      var simple = window.math.derivative(c.nodo, 'x');
      d.tex = simple.toTex({ parenthesis: 'auto', implicit: 'hide' });
      var cruda = window.math.derivative(c.nodo, 'x', { simplify: false });
      var comp = V.compilarFuncion(cruda.toString());
      if (comp.ok) {
        d.f = comp.f;
        d.simbolica = true;
      }
    } catch (e) {
      /* se usa la aproximación numérica */
    }
    if (!d.f) {
      d.f = function (x) {
        var h = 1e-5 * Math.max(1, Math.abs(x));
        return (c.f(x + h) - c.f(x - h)) / (2 * h);
      };
    }
    return d;
  }

  /** Valor numérico de una cadena o número (acepta "pi/2"). */
  function valor(v) {
    if (typeof v === 'number') return v;
    var l = V.leerNumero(String(v), 'x');
    return l.ok ? l.valor : NaN;
  }

  function numeroCorto(v) {
    return String(Number(v.toFixed(4)));
  }

  function compacta(t) {
    return V.normalizar(t).replace(/\s+/g, '');
  }

  function limpio(v, escala) {
    return Math.abs(v) < 1e-12 * Math.max(1, escala || 0) ? 0 : v;
  }

  var cero = function () { return 0; };

  /** Polígono entre la curva y el eje en [p, q]. */
  function poligono(f, p, q) {
    var xs = [];
    var ys = [];
    var pasos = 80;
    var k;
    for (k = 0; k <= pasos; k++) {
      var x = p + (q - p) * k / pasos;
      xs.push(x);
      ys.push(f(x));
    }
    xs.push(q, p);
    ys.push(0, 0);
    return { x: xs, y: ys };
  }

  /** Trazas de relleno (azul sobre el eje, rojo bajo el eje) para f en [p, q]. */
  function rellenos(f, p, q, c, etiqueta) {
    var trazas = [];
    if (!(q - p > 1e-12)) return trazas;
    var r = N.signedArea(f, p, q, 400);
    var pos = [];
    var neg = [];
    r.pieces.forEach(function (t) {
      (t.integral >= 0 ? pos : neg).push(poligono(f, t.a, t.b));
    });
    if (pos.length) trazas.push(G.trazaPoligonos(pos, { nombre: etiqueta + ' (+)', color: c.pos, opacidad: 0.32 }));
    if (neg.length) trazas.push(G.trazaPoligonos(neg, { nombre: etiqueta + ' (−)', color: c.neg, opacidad: 0.32 }));
    return trazas;
  }

  function lineas(p, q, etP, etQ, c) {
    return {
      shapes: [G.lineaVertical(p, c.eje), G.lineaVertical(q, c.eje)],
      annotations: [G.etiquetaSuperior(p, etP, c.texto), G.etiquetaSuperior(q, etQ, c.texto)]
    };
  }

  /**
   * Calcula todo lo necesario para una configuración f(u), g(x), [a, b].
   * @param {{f: Object, g: Object, a: number, b: number}} p
   * @returns {{error?: string}|Object}
   */
  function calcular(p) {
    var dg = derivar(p.g);
    var h = function (x) { return p.f.f(p.g.f(x)) * dg.f(x); };
    var ga = p.g.f(p.a);
    var gb = p.g.f(p.b);
    if (!isFinite(ga) || !isFinite(gb)) {
      return { error: 'La función $g$ no está definida en un límite: $g(a)=' + V.formatearTex(ga) + '$, $g(b)=' + V.formatearTex(gb) + '$. Cambia $g$ o los límites.' };
    }
    var lo = Math.min(ga, gb);
    var hi = Math.max(ga, gb);
    var signo = gb >= ga ? 1 : -1;
    var integralX = N.simpson(h, p.a, p.b, PUNTOS_SIMPSON);
    var integralU = hi - lo > 1e-12 ? signo * N.simpson(p.f.f, lo, hi, PUNTOS_SIMPSON) : 0;
    var escala = Math.abs(integralX) + Math.abs(integralU);
    return {
      dg: dg, h: h, ga: ga, gb: gb, lo: lo, hi: hi,
      integralX: limpio(integralX, escala), integralU: limpio(integralU, escala), escala: escala
    };
  }

  /**
   * Dibuja las dos gráficas.
   * @param {HTMLElement} divX
   * @param {HTMLElement} divU
   * @param {Object} p Parámetros de entrada (f, g, a, b, vista, vistaU)
   * @param {Object} r Resultado de calcular
   * @param {Function} [dF] F'(u) para superponerla
   */
  function dibujar(divX, divU, p, r, dF) {
    var c = G.colores();
    var x0 = Math.min(p.vista[0], p.a);
    var x1 = Math.max(p.vista[1], p.b);
    var curvaX = G.muestrear(r.h, x0, x1, 600);
    var trazasX = rellenos(r.h, p.a, p.b, c, 'Área en x');
    trazasX.push({
      x: curvaX.x, y: curvaX.y, type: 'scatter', mode: 'lines', name: 'f(g(x))·g′(x)',
      line: { color: c.curva, width: 2.5 }, hovertemplate: 'x = %{x:.4f}<br>f(g(x))·g′(x) = %{y:.4f}<extra></extra>'
    });
    var lx = lineas(p.a, p.b, 'a', 'b', c);
    G.dibujar(divX, trazasX, G.layoutBase({
      xaxis: { range: [x0, x1], title: { text: 'x' } },
      yaxis: { range: G.rangoY([curvaX.y], { incluir: [0] }) },
      shapes: lx.shapes,
      annotations: lx.annotations,
      hovermode: 'x'
    }));

    var margen = Math.max(0.5, 0.35 * (r.hi - r.lo));
    var u0 = p.vistaU ? p.vistaU[0] : r.lo - margen;
    var u1 = p.vistaU ? p.vistaU[1] : r.hi + margen;
    var curvaU = G.muestrear(p.f.f, u0, u1, 600);
    var trazasU = rellenos(p.f.f, r.lo, r.hi, c, 'Área en u');
    trazasU.push({
      x: curvaU.x, y: curvaU.y, type: 'scatter', mode: 'lines', name: 'f(u)',
      line: { color: c.serie[1], width: 2.5 }, hovertemplate: 'u = %{x:.4f}<br>f(u) = %{y:.4f}<extra></extra>'
    });
    var listas = [curvaU.y];
    if (dF) {
      var d = G.muestrear(dF, u0, u1, 600);
      trazasU.push({
        x: d.x, y: d.y, type: 'scatter', mode: 'lines', name: 'F′(u) calculada',
        line: { color: c.curva, width: 1.8, dash: 'dot' }, hovertemplate: 'u = %{x:.4f}<br>F′(u) = %{y:.4f}<extra></extra>'
      });
      listas.push(d.y);
    }
    var lu = lineas(r.lo, r.hi, r.ga <= r.gb ? 'g(a)' : 'g(b)', r.ga <= r.gb ? 'g(b)' : 'g(a)', c);
    G.dibujar(divU, trazasU, G.layoutBase({
      xaxis: { range: [u0, u1], title: { text: 'u' } },
      yaxis: { range: G.rangoY(listas, { incluir: [0] }) },
      shapes: lu.shapes,
      annotations: lu.annotations,
      hovermode: 'x'
    }));
  }

  /* ---------------------------------------------------------------- */
  /* 1. Gráficas de los ejemplos resueltos                             */
  /* ---------------------------------------------------------------- */

  Array.prototype.forEach.call(document.querySelectorAll('[data-sustitucion]'), function (bloque) {
    var datos;
    try { datos = JSON.parse(bloque.getAttribute('data-sustitucion')); } catch (e) { return; }
    var divX = bloque.querySelector('[data-grafica-x]');
    var divU = bloque.querySelector('[data-grafica-u]');
    var cf = compilarEnU(datos.f);
    var cg = V.compilarFuncion(datos.g);
    var a = valor(datos.a);
    var b = valor(datos.b);
    if (!cf.ok || !cg.ok || !isFinite(a) || !isFinite(b)) {
      divX.innerHTML = '<p class="campo__ayuda">No se pudo preparar la gráfica (¿se cargó math.js?).</p>';
      return;
    }
    var p = { f: cf, g: cg, a: a, b: b, vista: datos.vista };
    function pintar() {
      try {
        var r = calcular(p);
        if (r.error) return;
        dibujar(divX, divU, p, r, null);
      } catch (e) {
        divX.innerHTML = '<p class="campo__ayuda">No se pudo dibujar la gráfica.</p>';
      }
    }
    window.CI.alCambiarTema(pintar);
    pintar();
  });

  /* ---------------------------------------------------------------- */
  /* 2. Visualizador                                                   */
  /* ---------------------------------------------------------------- */

  var form = document.getElementById('vis-sustitucion');
  if (!form) return;

  var ui = {
    fu: document.getElementById('fu'),
    gx: document.getElementById('gx'),
    Fu: document.getElementById('Fu'),
    chips: document.getElementById('chips-sust'),
    mensaje: document.getElementById('mensaje-sust'),
    graficaX: document.getElementById('grafica-x'),
    graficaU: document.getElementById('grafica-u'),
    aRango: document.getElementById('a-rango'),
    aTexto: document.getElementById('a-texto'),
    bRango: document.getElementById('b-rango'),
    bTexto: document.getElementById('b-texto'),
    lcd: document.getElementById('lcd-sust'),
    nota: document.getElementById('nota-sust')
  };

  var EJEMPLOS = [
    { tex: 'x(x^2+1)^3', f: 'u^3/2', g: 'x^2+1', F: 'u^4/8', a: '0', b: '1', vista: [-0.5, 1.5] },
    { tex: '(3x+1)^5', f: 'u^5/3', g: '3x+1', F: 'u^6/18', a: '0', b: '1', vista: [-0.4, 1.4] },
    { tex: 'x^2\\sqrt{x^3+4}', f: 'sqrt(u)/3', g: 'x^3+4', F: '2/9*u^(3/2)', a: '0', b: '2', vista: [-0.5, 2.5] },
    { tex: '\\sin^3x\\cos x', f: 'u^3', g: 'sin(x)', F: 'u^4/4', a: '0', b: 'pi/2', vista: [-0.3, 2] },
    { tex: '\\tfrac{x}{(x^2+1)^2}', f: '1/(2*u^2)', g: 'x^2+1', F: '-1/(2*u)', a: '1', b: '2', vista: [0, 3] },
    { tex: '2x(x^2-1)^2\\ (g\\text{ no monótona})', f: 'u^2', g: 'x^2-1', F: 'u^3/3', a: '-1', b: '2', vista: [-1.8, 2.5] },
    { tex: '\\text{error: } F\\text{ mal}', f: 'u^3/2', g: 'x^2+1', F: 'u^4/4', a: '0', b: '1', vista: [-0.5, 1.5] }
  ];

  var estado = { vista: [-0.5, 1.5] };
  var pendiente = false;

  ui.chips.innerHTML = EJEMPLOS.map(function (e, i) {
    return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false" title="f(u) = ' +
      window.CI.escaparHTML(e.f) + ', g(x) = ' + window.CI.escaparHTML(e.g) + '">' + tex(e.tex) + '</button>';
  }).join('');

  function marcarChip() {
    var f = compacta(ui.fu.value);
    var g = compacta(ui.gx.value);
    var F = compacta(ui.Fu.value);
    var a = compacta(ui.aTexto.value);
    var b = compacta(ui.bTexto.value);
    Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
      var e = EJEMPLOS[Number(chip.getAttribute('data-indice'))];
      var igual = compacta(e.f) === f && compacta(e.g) === g && compacta(e.F) === F && compacta(e.a) === a && compacta(e.b) === b;
      chip.setAttribute('aria-pressed', igual ? 'true' : 'false');
    });
  }

  function configurarDeslizadores() {
    var paso = (estado.vista[1] - estado.vista[0]) / 500;
    [ui.aRango, ui.bRango].forEach(function (r) {
      r.min = estado.vista[0];
      r.max = estado.vista[1];
      r.step = paso;
    });
  }

  function incluirEnVista(v) {
    var margen = 0.1 * (estado.vista[1] - estado.vista[0]);
    if (v < estado.vista[0]) estado.vista[0] = v - margen;
    if (v > estado.vista[1]) estado.vista[1] = v + margen;
    configurarDeslizadores();
  }

  function sincronizar(texto, rango) {
    var l = V.leerNumero(texto.value, 'x');
    if (!l.ok) return;
    incluirEnVista(l.valor);
    rango.value = l.valor;
  }

  function marcarInvalido(control) {
    [ui.fu, ui.gx, ui.Fu, ui.aTexto, ui.bTexto].forEach(function (c) {
      c.setAttribute('aria-invalid', c === control ? 'true' : 'false');
    });
  }

  function fallar(control, html, tipo) {
    marcarInvalido(control);
    V.mostrarMensaje(ui.mensaje, tipo || 'error', html);
    ui.lcd.innerHTML = '';
    ui.nota.innerHTML = '';
    ui.graficaX.style.opacity = '0.35';
    ui.graficaU.style.opacity = '0.35';
  }

  /** Compara F'(u) con f(u) en la ventana de u; devuelve el resultado de la verificación. */
  function verificarAntiderivada(cF, cf, u0, u1) {
    var d = derivar(cF);
    var comparados = 0;
    var maxima = 0;
    var peor = null;
    for (var k = 0; k < 97; k++) {
      var u = u0 + (u1 - u0) * (k + 0.37) / 97;
      var fu = cf.f(u);
      var du = d.f(u);
      if (!isFinite(fu) || !isFinite(du) || Math.abs(fu) > 1e8) continue;
      comparados++;
      var dif = Math.abs(du - fu) / Math.max(1, Math.abs(fu));
      if (dif > maxima) {
        maxima = dif;
        peor = { u: u, fu: fu, du: du };
      }
    }
    var tol = d.simbolica ? 1e-8 : 1e-5;
    return { d: d, comparados: comparados, maxima: maxima, peor: peor, correcta: comparados >= 10 && maxima <= tol };
  }

  function actualizar() {
    try {
      var cf = compilarEnU(ui.fu.value);
      if (!cf.ok) return fallar(ui.fu, cf.error);
      var cg = V.compilarFuncion(ui.gx.value);
      if (!cg.ok) return fallar(ui.gx, cg.error);
      var tieneF = V.normalizar(ui.Fu.value) !== '';
      var cF = null;
      if (tieneF) {
        cF = compilarEnU(ui.Fu.value);
        if (!cF.ok) return fallar(ui.Fu, cF.error.replace('una función de $u$', 'una antiderivada $F(u)$'));
      }
      var la = V.leerNumero(ui.aTexto.value, 'a');
      if (!la.ok) return fallar(ui.aTexto, la.error);
      var lb = V.leerNumero(ui.bTexto.value, 'b');
      if (!lb.ok) return fallar(ui.bTexto, lb.error);
      if (la.valor >= lb.valor) {
        return fallar(ui.bTexto, 'El límite inferior debe ser menor que el superior: ahora $a=' + V.formatearTex(la.valor) +
          '$ y $b=' + V.formatearTex(lb.valor) + '$. Mueve los controles para que $a&lt;b$.', 'adv');
      }
      marcarInvalido(null);

      var p = { f: cf, g: cg, a: la.valor, b: lb.valor, vista: estado.vista };
      var r = calcular(p);
      if (r.error) return fallar(null, r.error, 'adv');

      var verif = null;
      var tfc = NaN;
      if (cF) {
        var margen = Math.max(0.5, 0.35 * (r.hi - r.lo));
        verif = verificarAntiderivada(cF, cf, r.lo - margen, r.hi + margen);
        tfc = limpio(cF.f(r.gb) - cF.f(r.ga), r.escala);
      }
      dibujar(ui.graficaX, ui.graficaU, p, r, verif ? verif.d.f : null);

      // Mensaje de estado
      var diferencia = Math.abs(r.integralX - r.integralU);
      var coinciden = diferencia <= 1e-8 * Math.max(1, r.escala);
      var msg;
      var tipo = 'exito';
      if (verif) {
        if (verif.comparados < 10) {
          tipo = 'adv';
          msg = 'No hay suficientes puntos de la ventana donde $f$ y $F$ estén definidas a la vez. Revisa el dominio.';
        } else if (verif.correcta) {
          msg = '¡Correcto! $F\'(u)=f(u)$ en los ' + verif.comparados + ' puntos comparados, así que $F(g(x))$ es una antiderivada de $f(g(x))\\,g\'(x)$.';
        } else {
          tipo = 'error';
          msg = '$F$ no es una antiderivada de $f$: en $u=' + V.formatearTex(verif.peor.u, 4) + '$ se obtiene $F\'(u)=' +
            V.formatearTex(verif.peor.du, 6) + '$, pero $f(u)=' + V.formatearTex(verif.peor.fu, 6) + '$. Deriva tu resultado y revisa las constantes.';
        }
      } else {
        msg = 'Las dos integrales coinciden: $\\int_a^b f(g(x))\\,g\'(x)\\,dx=\\int_{g(a)}^{g(b)} f(u)\\,du=' + V.formatearTex(r.integralX, 7) + '$.';
      }
      if (!coinciden) {
        tipo = 'adv';
        msg = 'Las integrales difieren en ' + V.formatearTex(diferencia, 3) + ': revisa que la función sea continua en el intervalo (sin asíntotas).';
      }
      V.mostrarMensaje(ui.mensaje, tipo, msg);

      ui.lcd.innerHTML =
        V.lectura(tex('\\int_a^b f(g(x))\\,g\'(x)\\,dx'), V.formatear(r.integralX, 9), true) +
        V.lectura(tex('\\int_{g(a)}^{g(b)} f(u)\\,du'), V.formatear(r.integralU, 9), true) +
        V.lectura('Límites en ' + tex('u'), tex('g(a)=' + V.formatearTex(r.ga, 6) + ',\\ g(b)=' + V.formatearTex(r.gb, 6))) +
        V.lectura('Diferencia', V.formatear(diferencia, 3)) +
        V.lectura(tex('F(g(b))-F(g(a))'), verif ? V.formatear(tfc, 9) : 'sin F') +
        V.lectura('Veredicto de ' + tex('F'), verif ? (verif.comparados < 10 ? 'sin datos' : verif.correcta ? '✓ correcta' : '✗ no coincide') : '—');

      var partes = 'Con $u=g(x)$: $g(a)=' + V.formatearTex(r.ga, 6) + '$ y $g(b)=' + V.formatearTex(r.gb, 6) + '$. ';
      if (r.ga > r.gb) partes += 'Como $g(a)&gt;g(b)$, la integral en $u$ se recorre de derecha a izquierda. ';
      if (verif && verif.d.simbolica && verif.d.tex) partes += 'Derivada de $F$ calculada por math.js: $F\'(u)=' + verif.d.tex + '$.';
      ui.nota.innerHTML = partes;
      window.CI.renderizarMatematicas(ui.nota);

      ui.graficaX.style.opacity = '';
      ui.graficaU.style.opacity = '';
      marcarChip();
    } catch (e) {
      fallar(null, V.mensajeDeError ? V.mensajeDeError(e) : 'Ocurrió un problema al calcular. Revisa las funciones y los límites.');
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

  function cargar(d) {
    if (d.f !== undefined) ui.fu.value = d.f;
    if (d.g !== undefined) ui.gx.value = d.g;
    if (d.F !== undefined) ui.Fu.value = d.F;
    if (d.a !== undefined) ui.aTexto.value = d.a;
    if (d.b !== undefined) ui.bTexto.value = d.b;
    var vista = d.vista;
    if (!vista) {
      var la = V.leerNumero(ui.aTexto.value, 'a');
      var lb = V.leerNumero(ui.bTexto.value, 'b');
      var a = la.ok ? la.valor : 0;
      var b = lb.ok ? lb.valor : 1;
      var m = Math.max(0.5, 0.25 * Math.abs(b - a));
      vista = [Math.min(a, b) - m, Math.max(a, b) + m];
    }
    estado.vista = vista.slice();
    configurarDeslizadores();
    sincronizar(ui.aTexto, ui.aRango);
    sincronizar(ui.bTexto, ui.bRango);
    actualizar();
  }

  ui.chips.addEventListener('click', function (evento) {
    var chip = evento.target.closest('.chip');
    if (chip) cargar(EJEMPLOS[Number(chip.getAttribute('data-indice'))]);
  });

  [ui.fu, ui.gx, ui.Fu].forEach(function (c) { c.addEventListener('input', programar); });

  [[ui.aRango, ui.aTexto], [ui.bRango, ui.bTexto]].forEach(function (par) {
    par[0].addEventListener('input', function () {
      par[1].value = numeroCorto(Number(par[0].value));
      programar();
    });
    par[1].addEventListener('input', function () {
      sincronizar(par[1], par[0]);
      programar();
    });
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  Array.prototype.forEach.call(document.querySelectorAll('[data-cargar-sustitucion]'), function (boton) {
    boton.addEventListener('click', function () {
      var datos;
      try { datos = JSON.parse(boton.getAttribute('data-cargar-sustitucion')); } catch (e) { return; }
      V.irAlVisualizador(form);
      cargar(datos);
    });
  });

  window.CI.alCambiarTema(actualizar);
  cargar(EJEMPLOS[0]);
})();
