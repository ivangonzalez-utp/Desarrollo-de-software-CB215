/**
 * visualizador.js — Lógica compartida de los visualizadores interactivos.
 *
 * 1. Entrada de funciones: interpreta lo que escribe el usuario con math.js
 *    (x^2, sin(x), exp(x), sqrt(x), log(x)…) y lo valida con mensajes claros.
 * 2. Formato de números para resultados y tablas.
 * 3. Visualizador(.crear) de métodos numéricos (módulos 1 a 4): conecta los
 *    controles, calcula la aproximación y el valor de referencia, dibuja la
 *    gráfica y llena los resultados y la tabla de valores.
 *
 * Cada módulo solo aporta lo propio de su método (cómo dibujar rectángulos,
 * trapecios o parábolas). Queda disponible como window.Visualizador.
 */
(function () {
  'use strict';

  /**
   * Funciones de ejemplo que aparecen como botones ("chips") en los
   * visualizadores de los módulos 1 a 4. `tex` es la etiqueta que se muestra.
   */
  var FUNCIONES_PREDEFINIDAS = [
    { tex: 'x^2', expr: 'x^2', a: '0', b: '3' },
    { tex: 'x^3+1', expr: 'x^3 + 1', a: '0', b: '1' },
    { tex: '\\sqrt{x}', expr: 'sqrt(x)', a: '1', b: '4' },
    { tex: '\\sin x', expr: 'sin(x)', a: '0', b: 'pi' },
    { tex: 'e^{x}', expr: 'exp(x)', a: '0', b: '1' },
    { tex: 'e^{-x^2}', expr: 'exp(-x^2)', a: '0', b: '1' },
    { tex: '\\tfrac{1}{x}', expr: '1/x', a: '1', b: '2' },
    { tex: '\\ln x', expr: 'log(x)', a: '1', b: '3' },
    { tex: 'x^3-3x+1', expr: 'x^3 - 3x + 1', a: '-2', b: '2' },
    { tex: '\\cos x+2', expr: 'cos(x) + 2', a: '0', b: '2*pi' },
    { tex: 'x\\sin x', expr: 'x*sin(x)', a: '0', b: '4' }
  ];

  /** Constantes que se pueden usar en las expresiones. */
  var CONSTANTES = { pi: true, e: true, tau: true, phi: true };

  var escapar = function (t) { return window.CI ? window.CI.escaparHTML(t) : String(t); };
  var tex = function (t) { return window.CI ? window.CI.tex(t) : t; };

  /* ------------------------------------------------------------------ */
  /* 1. Entrada de funciones y números                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Normaliza la escritura: acepta símbolos y nombres en español
   * (sen, ln, tg, π, √, −, ·, ×) y los traduce a la sintaxis de math.js.
   * @param {string} texto
   * @returns {string}
   */
  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .trim()
      .replace(/[−–]/g, '-')
      .replace(/[·×]/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/√\s*\(/g, 'sqrt(')
      .replace(/√\s*([a-z0-9.]+)/gi, 'sqrt($1)')
      .replace(/\barcsen\s*\(/gi, 'asin(')
      .replace(/\bsen\s*\(/gi, 'sin(')
      .replace(/\btg\s*\(/gi, 'tan(')
      .replace(/\bln\s*\(/gi, 'log(');
  }

  /**
   * Convierte el resultado de math.js en un número real. Los complejos con
   * parte imaginaria (por ejemplo sqrt(-1)) y otros tipos se vuelven NaN.
   */
  function aReal(v) {
    if (typeof v === 'number') return v;
    if (v && typeof v.re === 'number' && typeof v.im === 'number') {
      return Math.abs(v.im) <= 1e-12 * (1 + Math.abs(v.re)) ? v.re : NaN;
    }
    if (v && typeof v.toNumber === 'function') {
      try { return v.toNumber(); } catch (e) { return NaN; }
    }
    return NaN;
  }

  /**
   * Interpreta y compila una función escrita por el usuario.
   * @param {string} texto Por ejemplo "x^2 + 3*sin(x)".
   * @param {{variables?: string[], valores?: Object<string, number>}} [opciones]
   *   Variables permitidas (por defecto solo x) y valores fijos para las que no son x
   *   (por ejemplo { C: 0 } para la constante de integración).
   * @returns {{ok: true, f: function(number): number, expr: string, tex: string} | {ok: false, error: string}}
   */
  function compilarFuncion(texto, opciones) {
    var permitidas = (opciones && opciones.variables) || ['x'];
    var valores = (opciones && opciones.valores) || {};
    if (!window.math) {
      return { ok: false, error: 'No se pudo cargar la librería math.js. Revisa tu conexión a Internet y recarga la página.' };
    }
    var expr = normalizar(texto);
    if (!expr) {
      return { ok: false, error: 'Escribe una función de $x$, por ejemplo <code>x^2</code>, <code>sin(x)</code> o <code>exp(-x^2)</code>.' };
    }

    var nodo;
    try {
      nodo = window.math.parse(expr);
    } catch (e) {
      return {
        ok: false,
        error: 'No pude interpretar <code>' + escapar(texto) + '</code>. Revisa los paréntesis y los operadores: usa ' +
          '<code>*</code> para multiplicar (<code>2*x</code>), <code>^</code> para potencias (<code>x^2</code>) y funciones como ' +
          '<code>sin(x)</code>, <code>exp(x)</code>, <code>sqrt(x)</code> o <code>log(x)</code>.'
      };
    }

    var problema = null;
    nodo.traverse(function (n, ruta, padre) {
      if (problema) return;
      if (n.isAssignmentNode || n.isFunctionAssignmentNode) {
        problema = 'Escribe solo la expresión, sin el signo <code>=</code>. Por ejemplo: <code>x^2 + 1</code>.';
        return;
      }
      if (!n.isSymbolNode) return;
      if (permitidas.indexOf(n.name) >= 0) return;
      var esNombreDeFuncion = padre && padre.isFunctionNode && padre.fn === n;
      if (esNombreDeFuncion) {
        if (typeof window.math[n.name] !== 'function') {
          problema = 'La función <code>' + escapar(n.name) + '</code> no existe. Prueba con <code>sin</code>, <code>cos</code>, ' +
            '<code>tan</code>, <code>exp</code>, <code>log</code>, <code>sqrt</code>, <code>cbrt</code> o <code>abs</code>.';
        }
      } else if (!CONSTANTES[n.name]) {
        problema = 'El símbolo <code>' + escapar(n.name) + '</code> no está permitido: la expresión solo puede depender de ' +
          permitidas.map(function (v) { return '<code>' + v + '</code>'; }).join(' y ') +
          ' (también puedes usar las constantes <code>pi</code> y <code>e</code>).';
      }
    });
    if (problema) return { ok: false, error: problema };

    var codigo;
    try {
      codigo = nodo.compile();
    } catch (e) {
      return { ok: false, error: 'La expresión <code>' + escapar(texto) + '</code> no se puede evaluar.' };
    }

    var ambito = Object.assign({}, valores);
    function f(x) {
      ambito.x = x;
      try {
        return aReal(codigo.evaluate(ambito));
      } catch (e) {
        return NaN;
      }
    }

    // La expresión debe producir un número (no una matriz, texto, etc.)
    var produceNumero = false;
    [0.5, 1.3, -0.7, 2.1, 0, 3.7].some(function (x) {
      try {
        var v = codigo.evaluate(Object.assign({}, valores, { x: x }));
        if (typeof v === 'number' || (v && typeof v.re === 'number') || (v && typeof v.toNumber === 'function')) {
          produceNumero = true;
        }
      } catch (e) {
        /* se prueba el siguiente punto */
      }
      return produceNumero;
    });
    if (!produceNumero) {
      return { ok: false, error: 'La expresión <code>' + escapar(texto) + '</code> no produce un número. Escribe una función de $x$ como <code>x^2 - 1</code>.' };
    }

    var latex = '';
    try {
      latex = nodo.toTex({ parenthesis: 'auto', implicit: 'hide' });
    } catch (e) {
      latex = expr;
    }
    return { ok: true, f: f, expr: expr, tex: latex, nodo: nodo };
  }

  /**
   * Lee un número escrito por el usuario; acepta expresiones como pi/2 o sqrt(2).
   * @param {string} texto
   * @param {string} nombre Nombre del campo para el mensaje de error (por ejemplo "a").
   * @returns {{ok: true, valor: number} | {ok: false, error: string}}
   */
  function leerNumero(texto, nombre) {
    var t = normalizar(texto).replace(/^(-?\d+),(\d+)$/, '$1.$2');
    if (!t) return { ok: false, error: 'Escribe un valor para $' + nombre + '$.' };
    var v = NaN;
    if (window.math) {
      try { v = aReal(window.math.evaluate(t)); } catch (e) { v = NaN; }
    } else {
      v = Number(t);
    }
    if (typeof v !== 'number' || !isFinite(v)) {
      return {
        ok: false,
        error: 'El valor de $' + nombre + '$ (<code>' + escapar(texto) + '</code>) no es un número válido. ' +
          'Puedes escribir valores como <code>2</code>, <code>-1.5</code>, <code>pi/2</code> o <code>sqrt(3)</code>.'
      };
    }
    return { ok: true, valor: v };
  }

  /* ------------------------------------------------------------------ */
  /* 2. Formato de números                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Da formato a un número (como HTML) con cierta cantidad de cifras
   * significativas. Los valores muy pequeños o muy grandes se muestran como
   * m × 10<sup>k</sup>.
   * @param {number} v
   * @param {number} [cifras=8]
   * @returns {string}
   */
  function formatear(v, cifras) {
    var c = cifras || 8;
    if (typeof v !== 'number' || !isFinite(v)) return '—';
    if (v === 0) return '0';
    var abs = Math.abs(v);
    if (abs < 1e-4 || abs >= 1e7) {
      var partes = v.toExponential(Math.max(0, c - 1)).split('e');
      var mantisa = partes[0].indexOf('.') >= 0 ? partes[0].replace(/\.?0+$/, '') : partes[0];
      return mantisa.replace('-', '−') + ' × 10<sup>' + String(Number(partes[1])).replace('-', '−') + '</sup>';
    }
    return String(Number(v.toPrecision(c))).replace('-', '−');
  }

  /**
   * Igual que formatear, pero produce LaTeX (para usar dentro de $...$).
   * @param {number} v
   * @param {number} [cifras=6]
   * @returns {string}
   */
  function formatearTex(v, cifras) {
    var c = cifras || 6;
    if (typeof v !== 'number' || !isFinite(v)) return '\\text{—}';
    if (v === 0) return '0';
    var abs = Math.abs(v);
    if (abs < 1e-4 || abs >= 1e7) {
      var partes = v.toExponential(Math.max(0, c - 1)).split('e');
      var mantisa = partes[0].indexOf('.') >= 0 ? partes[0].replace(/\.?0+$/, '') : partes[0];
      return mantisa + ' \\times 10^{' + Number(partes[1]) + '}';
    }
    return String(Number(v.toPrecision(c)));
  }

  /** Porcentaje con cuatro cifras significativas. */
  function formatearPorcentaje(fraccion) {
    if (typeof fraccion !== 'number' || !isFinite(fraccion)) return '—';
    return formatear(fraccion * 100, 4) + ' %';
  }

  /* ------------------------------------------------------------------ */
  /* 3. Mensajes                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Muestra un mensaje en la interfaz (nunca en la consola).
   * @param {HTMLElement} el
   * @param {'error'|'adv'|'info'|'exito'} tipo
   * @param {string} html
   */
  function mostrarMensaje(el, tipo, html) {
    if (!el) return;
    el.className = 'mensaje mensaje--' + tipo;
    el.innerHTML = '<div>' + html + '</div>';
    el.hidden = false;
    if (window.CI) window.CI.renderizarMatematicas(el);
  }

  function ocultarMensaje(el) {
    if (el) el.hidden = true;
  }

  /** Traduce un error de cálculo a un mensaje comprensible. */
  function mensajeDeError(e) {
    if (e && e.name === 'NonFiniteError') {
      return 'La función no da un número real finito en $x = ' + formatearTex(e.x, 6) + '$, que está dentro del intervalo. ' +
        'Suele pasar con divisiones por cero (como <code>1/x</code> en $x=0$), raíces de números negativos o logaritmos de valores ' +
        '$\\le 0$. Cambia el intervalo o la función.';
    }
    if (e instanceof RangeError) return escapar(e.message) + '.';
    return 'Ocurrió un problema al calcular. Revisa la función y los límites.';
  }

  /**
   * Una lectura del visor de resultados (etiqueta + valor).
   * @param {string} etiqueta HTML de la etiqueta.
   * @param {string} valor Texto del valor.
   * @param {boolean} [destacado]
   * @returns {string}
   */
  function lectura(etiqueta, valor, destacado) {
    return '<div class="lcd__item' + (destacado ? ' lcd__item--destacado' : '') + '">' +
      '<span class="lcd__etiqueta">' + etiqueta + '</span>' +
      '<span class="lcd__valor">' + valor + '</span></div>';
  }

  /** Abre la pestaña que contiene al visualizador y lo lleva a la vista. */
  function irAlVisualizador(elemento) {
    var panel = elemento.closest('[role="tabpanel"]');
    if (panel && window.CI && window.CI.mostrarPestana) window.CI.mostrarPestana(panel.id);
    window.requestAnimationFrame(function () {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 4. Visualizador de métodos numéricos (módulos 1 a 4)                */
  /* ------------------------------------------------------------------ */

  /** Encabezados de la tabla según el método. */
  var TABLAS = {
    left: { indice: 'i', punto: 'x_{i-1}', valor: 'f(x_{i-1})', aporte: 'f(x_{i-1})\\,\\Delta x', desde: 1 },
    right: { indice: 'i', punto: 'x_i', valor: 'f(x_i)', aporte: 'f(x_i)\\,\\Delta x', desde: 1 },
    mid: { indice: 'i', punto: '\\bar{x}_i', valor: 'f(\\bar{x}_i)', aporte: 'f(\\bar{x}_i)\\,\\Delta x', desde: 1 },
    trapezoid: { indice: 'i', punto: 'x_i', valor: 'f(x_i)', coef: 'c_i', aporte: 'c_i\\,f(x_i)', desde: 0, factor: '\\frac{\\Delta x}{2}' },
    simpson: { indice: 'i', punto: 'x_i', valor: 'f(x_i)', coef: 'c_i', aporte: 'c_i\\,f(x_i)', desde: 0, factor: '\\frac{\\Delta x}{3}' }
  };

  /**
   * Crea un visualizador de un método numérico.
   *
   * Dentro de `raiz` deben existir los controles marcados con data-control
   * (predefinidas, funcion, a, b, n, n-numero) y las salidas con data-salida
   * (grafica, mensaje, resultados, tabla).
   *
   * @param {Object} opciones
   * @param {HTMLElement} opciones.raiz Contenedor del visualizador.
   * @param {function(): string} opciones.metodo Devuelve 'left' | 'right' | 'mid' | 'trapezoid' | 'simpson'.
   * @param {function(Object): string} opciones.nombreAprox LaTeX del nombre de la aproximación (ej. "T_{8}").
   * @param {function(Object): Object[]} opciones.trazas Trazas de Plotly que dibujan el método.
   * @param {{f: string, a: string, b: string, n: number}} opciones.inicial Valores iniciales.
   * @param {boolean} [opciones.soloPares] true para la regla de Simpson.
   * @param {function(Object)} [opciones.alActualizar] Se llama con el contexto tras cada cálculo.
   * @param {function()} [opciones.alFallar] Se llama cuando las entradas no son válidas.
   * @param {function(Object)} [opciones.alCargar] Se llama al cargar un ejemplo (datos extra).
   * @returns {{actualizar: function(), cargar: function(Object)}}
   */
  function crear(opciones) {
    var raiz = opciones.raiz;
    var buscar = function (selector) { return raiz.querySelector(selector); };
    var ui = {
      chips: buscar('[data-control="predefinidas"]'),
      funcion: buscar('[data-control="funcion"]'),
      a: buscar('[data-control="a"]'),
      b: buscar('[data-control="b"]'),
      n: buscar('[data-control="n"]'),
      nNumero: buscar('[data-control="n-numero"]'),
      grafica: buscar('[data-salida="grafica"]'),
      mensaje: buscar('[data-salida="mensaje"]'),
      resultados: buscar('[data-salida="resultados"]'),
      tabla: buscar('[data-salida="tabla"]')
    };
    var soloPares = !!opciones.soloPares;
    var predefinidas = opciones.predefinidas || FUNCIONES_PREDEFINIDAS;
    var cacheFuncion = { texto: null, resultado: null };
    var cacheReferencia = { clave: null, valor: null };
    var pendiente = false;

    // Botones de funciones de ejemplo ("chips")
    ui.chips.innerHTML = predefinidas.map(function (p, i) {
      return '<button type="button" class="chip" data-indice="' + i + '" aria-pressed="false" title="' +
        escapar(p.expr) + ' en [' + escapar(p.a) + ', ' + escapar(p.b) + ']">' + tex(p.tex) + '</button>';
    }).join('');

    /** Marca el chip que coincide con la función escrita (ninguno si es personalizada). */
    function sincronizarSelector() {
      var texto = normalizar(ui.funcion.value).replace(/\s+/g, '');
      var indice = predefinidas.findIndex(function (p) { return p.expr.replace(/\s+/g, '') === texto; });
      Array.prototype.forEach.call(ui.chips.querySelectorAll('.chip'), function (chip) {
        chip.setAttribute('aria-pressed', Number(chip.getAttribute('data-indice')) === indice ? 'true' : 'false');
      });
    }

    function compilarConCache(texto) {
      if (cacheFuncion.texto !== texto) {
        cacheFuncion.texto = texto;
        cacheFuncion.resultado = compilarFuncion(texto);
      }
      return cacheFuncion.resultado;
    }

    /** Valor "exacto" de referencia; se recalcula solo si cambian f, a o b. */
    function referencia(entradas) {
      var clave = entradas.expr + '|' + entradas.a + '|' + entradas.b;
      if (cacheReferencia.clave !== clave) {
        cacheReferencia.clave = null;
        cacheReferencia.valor = window.Numerics.reference(entradas.f, entradas.a, entradas.b);
        cacheReferencia.clave = clave;
      }
      return cacheReferencia.valor;
    }

    function marcarInvalido(control) {
      [ui.funcion, ui.a, ui.b, ui.nNumero].forEach(function (c) {
        if (c) c.setAttribute('aria-invalid', c === control ? 'true' : 'false');
      });
    }

    function fallo(control, mensaje, tipo) {
      marcarInvalido(control);
      return { ok: false, error: mensaje, tipo: tipo || 'error' };
    }

    function leerEntradas() {
      var cf = compilarConCache(ui.funcion.value);
      if (!cf.ok) return fallo(ui.funcion, cf.error);
      var la = leerNumero(ui.a.value, 'a');
      if (!la.ok) return fallo(ui.a, la.error);
      var lb = leerNumero(ui.b.value, 'b');
      if (!lb.ok) return fallo(ui.b, lb.error);
      if (la.valor >= lb.valor) {
        return fallo(ui.b, 'El límite inferior debe ser menor que el superior: ahora $a = ' + formatearTex(la.valor) +
          '$ y $b = ' + formatearTex(lb.valor) + '$. Cambia los valores para que $a &lt; b$.');
      }
      if (lb.valor - la.valor > 1e6) {
        return fallo(ui.b, 'El intervalo es demasiado grande para visualizarlo. Usa un intervalo de longitud menor que un millón.');
      }
      var textoN = ui.nNumero ? ui.nNumero.value : ui.n.value;
      var n = Number(textoN);
      var minimo = soloPares ? 2 : 1;
      if (textoN === '' || Math.floor(n) !== n || n < minimo || n > 100) {
        return fallo(ui.nNumero, 'El número de subintervalos $n$ debe ser un entero entre ' + minimo + ' y 100.');
      }
      if (soloPares && n % 2 !== 0) {
        return fallo(ui.nNumero, 'La regla de Simpson necesita un número <strong>par</strong> de subintervalos, porque cada parábola ' +
          'ocupa dos de ellos. $n = ' + n + '$ es impar: prueba con $n = ' + (n + 1 <= 100 ? n + 1 : n - 1) + '$.', 'adv');
      }
      marcarInvalido(null);
      return { ok: true, f: cf.f, expr: cf.expr, tex: cf.tex, a: la.valor, b: lb.valor, n: n };
    }

    function atenuar(atenuado) {
      ui.grafica.style.opacity = atenuado ? '0.35' : '';
    }

    function limpiarSalidas() {
      ui.resultados.innerHTML = '';
      if (ui.tabla) ui.tabla.innerHTML = '<p class="campo__ayuda">Corrige los datos para ver la tabla.</p>';
      atenuar(true);
      if (opciones.alFallar) opciones.alFallar();
    }

    function dibujarPrincipal(ctx) {
      var G = window.Graficas;
      var c = ctx.colores;
      var largo = ctx.b - ctx.a;
      var x0 = ctx.a - 0.08 * largo;
      var x1 = ctx.b + 0.08 * largo;
      var curva = G.muestrear(ctx.f, x0, x1, 500);
      var trazas = opciones.trazas(ctx);
      trazas.push({
        x: curva.x, y: curva.y, type: 'scatter', mode: 'lines', name: 'f(x) = ' + ctx.expr,
        line: { color: c.curva, width: 2.5 },
        hovertemplate: 'x = %{x:.4f}<br>f(x) = %{y:.4f}<extra></extra>'
      });
      var layout = G.layoutBase({
        xaxis: { range: [x0, x1], title: { text: 'x' } },
        yaxis: { range: G.rangoY([curva.y, ctx.ys], { incluir: [0] }) },
        shapes: [G.lineaVertical(ctx.a, c.eje), G.lineaVertical(ctx.b, c.eje)],
        annotations: [G.etiquetaSuperior(ctx.a, 'a', c.texto), G.etiquetaSuperior(ctx.b, 'b', c.texto)]
      });
      G.dibujar(ui.grafica, trazas, layout);
      atenuar(false);
    }

    function pintarResultados(ctx) {
      var relativo = isNaN(ctx.errorRel) ? 'no definido' : formatearPorcentaje(ctx.errorRel);
      ui.resultados.innerHTML =
        lectura(tex('\\Delta x'), formatear(ctx.dx, 8)) +
        lectura('Aprox. ' + tex(opciones.nombreAprox(ctx)), formatear(ctx.aprox, 10), true) +
        lectura('Exacto (ref.)', formatear(ctx.exacto, 10)) +
        lectura('Error absoluto', formatear(ctx.errorAbs, 4)) +
        lectura('Error relativo', relativo);
    }

    function pintarTabla(ctx) {
      if (!ui.tabla) return;
      var def = TABLAS[ctx.metodo];
      var coeficientes = ctx.metodo === 'trapezoid' ? window.Numerics.trapezoidCoefficients(ctx.n)
        : ctx.metodo === 'simpson' ? window.Numerics.simpsonCoefficients(ctx.n) : null;
      var filas = [];
      var suma = 0;
      for (var k = 0; k < ctx.nodos.x.length; k++) {
        var y = ctx.ys[k];
        var aporte = coeficientes ? coeficientes[k] * y : y * ctx.dx;
        suma += aporte;
        filas.push('<tr><td class="num">' + (k + def.desde) + '</td>' +
          '<td class="num">' + formatear(ctx.nodos.x[k], 7) + '</td>' +
          '<td class="num">' + formatear(y, 7) + '</td>' +
          (coeficientes ? '<td class="num">' + coeficientes[k] + '</td>' : '') +
          '<td class="num">' + formatear(aporte, 7) + '</td></tr>');
      }
      var columnas = coeficientes ? 5 : 4;
      var pie = coeficientes
        ? '<tr class="fila-destacada"><td colspan="' + (columnas - 1) + '">' + tex('\\sum c_i\\,f(x_i)') + ' = ' + formatear(suma, 8) +
          ' ⇒ ' + tex(opciones.nombreAprox(ctx) + ' = ' + def.factor + '\\sum c_i f(x_i)') + '</td><td class="num">' + formatear(ctx.aprox, 8) + '</td></tr>'
        : '<tr class="fila-destacada"><td colspan="' + (columnas - 1) + '">Suma de las áreas ' + tex('= ' + opciones.nombreAprox(ctx)) +
          '</td><td class="num">' + formatear(ctx.aprox, 8) + '</td></tr>';
      ui.tabla.innerHTML =
        '<table><thead><tr>' +
        '<th class="num" scope="col">' + tex(def.indice) + '</th>' +
        '<th class="num" scope="col">' + tex(def.punto) + '</th>' +
        '<th class="num" scope="col">' + tex(def.valor) + '</th>' +
        (coeficientes ? '<th class="num" scope="col">' + tex(def.coef) + '</th>' : '') +
        '<th class="num" scope="col">' + tex(def.aporte) + '</th>' +
        '</tr></thead><tbody>' + filas.join('') + pie + '</tbody></table>';
    }

    /** Recalcula todo con los valores actuales de los controles. */
    function actualizar() {
      try {
        var entradas = leerEntradas();
        if (!entradas.ok) {
          mostrarMensaje(ui.mensaje, entradas.tipo, entradas.error);
          limpiarSalidas();
          return;
        }
        if (!window.Numerics || !window.Graficas) throw new Error('faltan librerías');
        var metodo = opciones.metodo();
        var exacto = referencia(entradas);
        var nodos = window.Numerics.nodes(metodo, entradas.a, entradas.b, entradas.n);
        var ys = nodos.x.map(function (x) {
          var y = entradas.f(x);
          if (typeof y !== 'number' || !isFinite(y)) throw new window.Numerics.NonFiniteError(x);
          return y;
        });
        var aprox = 0;
        for (var i = 0; i < ys.length; i++) aprox += nodos.w[i] * ys[i];

        var ctx = {
          f: entradas.f, expr: entradas.expr, tex: entradas.tex, a: entradas.a, b: entradas.b, n: entradas.n,
          dx: nodos.dx, metodo: metodo, nodos: nodos, ys: ys, aprox: aprox, exacto: exacto,
          errorAbs: window.Numerics.absoluteError(exacto, aprox),
          errorRel: window.Numerics.relativeError(exacto, aprox),
          colores: window.Graficas.colores()
        };
        ocultarMensaje(ui.mensaje);
        dibujarPrincipal(ctx);
        pintarResultados(ctx);
        pintarTabla(ctx);
        if (opciones.alActualizar) opciones.alActualizar(ctx);
      } catch (e) {
        mostrarMensaje(ui.mensaje, 'error', window.Numerics ? mensajeDeError(e)
          : 'No se pudieron cargar los scripts de la página. Recarga la página.');
        limpiarSalidas();
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

    /** Carga valores (desde un ejemplo o al iniciar). */
    function cargar(datos) {
      if (datos.f !== undefined) ui.funcion.value = datos.f;
      if (datos.a !== undefined) ui.a.value = datos.a;
      if (datos.b !== undefined) ui.b.value = datos.b;
      if (datos.n !== undefined) {
        ui.n.value = datos.n;
        if (ui.nNumero) ui.nNumero.value = datos.n;
      }
      if (opciones.alCargar) opciones.alCargar(datos);
      sincronizarSelector();
      actualizar();
    }

    // Eventos de los controles
    ui.chips.addEventListener('click', function (evento) {
      var chip = evento.target.closest('.chip');
      var p = chip ? predefinidas[Number(chip.getAttribute('data-indice'))] : null;
      if (!p) return;
      ui.funcion.value = p.expr;
      ui.a.value = p.a;
      ui.b.value = p.b;
      sincronizarSelector();
      actualizar();
    });
    ui.funcion.addEventListener('input', function () {
      sincronizarSelector();
      programar();
    });
    ui.a.addEventListener('input', programar);
    ui.b.addEventListener('input', programar);
    ui.n.addEventListener('input', function () {
      if (ui.nNumero) ui.nNumero.value = ui.n.value;
      programar();
    });
    if (ui.nNumero) {
      ui.nNumero.addEventListener('input', function () {
        var n = Number(ui.nNumero.value);
        if (Math.floor(n) === n && n >= 1 && n <= 100) ui.n.value = n;
        programar();
      });
    }
    raiz.addEventListener('submit', function (e) { e.preventDefault(); });

    // Botones "Resolver en el visualizador" de los ejemplos
    Array.prototype.forEach.call(document.querySelectorAll('[data-cargar]'), function (boton) {
      boton.addEventListener('click', function () {
        var datos;
        try { datos = JSON.parse(boton.getAttribute('data-cargar')); } catch (e) { return; }
        irAlVisualizador(raiz);
        cargar(datos);
      });
    });

    if (window.CI) window.CI.alCambiarTema(actualizar);
    cargar(opciones.inicial);
    return { actualizar: actualizar, cargar: cargar };
  }

  window.Visualizador = {
    FUNCIONES_PREDEFINIDAS: FUNCIONES_PREDEFINIDAS,
    normalizar: normalizar,
    compilarFuncion: compilarFuncion,
    leerNumero: leerNumero,
    formatear: formatear,
    formatearTex: formatearTex,
    formatearPorcentaje: formatearPorcentaje,
    mostrarMensaje: mostrarMensaje,
    ocultarMensaje: ocultarMensaje,
    mensajeDeError: mensajeDeError,
    lectura: lectura,
    irAlVisualizador: irAlVisualizador,
    crear: crear
  };
})();
