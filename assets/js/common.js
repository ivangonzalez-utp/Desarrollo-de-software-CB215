/**
 * common.js — Componentes compartidos por todas las páginas de IntegraLab.
 *
 * - Registro único de los 14 módulos (MODULOS): alimenta el índice lateral,
 *   las fichas de la portada y los botones Anterior / Siguiente.
 * - Barra superior + índice lateral (cajón con menú hamburguesa en móvil).
 * - Tema claro / oscuro (respeta el sistema y recuerda la elección).
 * - Pie de página.
 * - Renderizado de fórmulas con KaTeX (auto-render: $...$ y $$...$$).
 * - Pasos progresivos en los ejemplos ("Mostrar siguiente paso").
 * - Pestañas de los módulos (Teoría · Visualizador · Ejemplos).
 *
 * Cada página indica en <body> su módulo y la ruta relativa a la raíz:
 *   <body data-modulo="3" data-raiz="../../">
 * Todas las rutas son relativas para funcionar en GitHub Pages bajo
 * /Desarrollo-de-software-CB215/ y también en un servidor local.
 */
(function () {
  'use strict';

  /** URL pública del repositorio (se usa en el pie de página). */
  var URL_REPOSITORIO = 'https://github.com/ivangonzalez-utp/Desarrollo-de-software-CB215';

  /** Información de cada fase del proyecto. */
  var FASES = {
    1: { nombre: 'Fase 1', clase: 'distintivo--fase1',
      resumen: 'Métodos numéricos, integral definida e integración directa' },
    2: { nombre: 'Fase 2', clase: 'distintivo--fase2',
      resumen: 'Sustitución, exponenciales, logarítmicas y trigonométricas' },
    3: { nombre: 'Fase 3', clase: 'distintivo--fase3',
      resumen: 'Inversas, trinomio cuadrático e integración por partes' }
  };

  /**
   * Registro de módulos. Para agregar, renombrar o publicar un módulo basta con
   * editar este arreglo (ver "Cómo contribuir" en el README). Un módulo con
   * `disponible: true` muestra el distintivo "Fase N · Disponible"; los demás
   * aparecen como "Fase N" (próximamente).
   */
  var MODULOS = [
    { num: 1, slug: '01-sumas-riemann', titulo: 'Sumas de Riemann', fase: 1, disponible: true,
      descripcion: 'Aproxima el área bajo una curva con rectángulos por la izquierda, la derecha y el punto medio.' },
    { num: 2, slug: '02-regla-trapecio', titulo: 'Regla del Trapecio', fase: 1, disponible: true,
      descripcion: 'Reemplaza la curva por segmentos rectos y suma el área de los trapecios formados.' },
    { num: 3, slug: '03-punto-medio', titulo: 'Regla del Punto Medio', fase: 1, disponible: true,
      descripcion: 'Rectángulos evaluados en el centro de cada subintervalo: más precisión con el mismo $n$.' },
    { num: 4, slug: '04-regla-simpson', titulo: 'Regla de Simpson', fase: 1, disponible: true,
      descripcion: 'Ajusta parábolas cada dos subintervalos y compara la precisión de todos los métodos.' },
    { num: 5, slug: '05-integral-definida-area', titulo: 'Integral definida y área bajo la curva', fase: 1, disponible: true,
      descripcion: 'Teorema Fundamental del Cálculo, área con signo, área total y área entre dos curvas.' },
    { num: 6, slug: '06-integracion-directa', titulo: 'Integración directa', fase: 1, disponible: true,
      descripcion: 'Antiderivadas, fórmulas básicas y linealidad, con la familia de curvas $F(x)+C$.' },
    { num: 7, slug: '07-sustitucion-potencias', titulo: 'Sustitución: integrales de potencias', fase: 2,
      descripcion: 'Cambio de variable $u=g(x)$ para integrales de la forma $\\int u^n\\,du$.' },
    { num: 8, slug: '08-exponenciales', titulo: 'Integrales de funciones exponenciales', fase: 2,
      descripcion: 'Integrales de $e^u$ y $a^u$ combinadas con sustitución.' },
    { num: 9, slug: '09-logaritmicas', titulo: 'Integrales que producen logaritmos', fase: 2,
      descripcion: 'Integrales que conducen a $\\ln|u|$, como $\\int \\frac{du}{u}$ y cocientes con la derivada arriba.' },
    { num: 10, slug: '10-trigonometricas', titulo: 'Integrales trigonométricas', fase: 2,
      descripcion: 'Integrales de seno, coseno, tangente, secante y sus potencias.' },
    { num: 11, slug: '11-trigonometricas-inversas', titulo: 'Integrales con trigonométricas inversas', fase: 3,
      descripcion: 'Integrales que producen arcoseno, arcotangente y arcosecante.' },
    { num: 12, slug: '12-hiperbolicas-inversas', titulo: 'Integrales con hiperbólicas inversas', fase: 3,
      descripcion: 'Integrales que conducen a $\\operatorname{senh}^{-1}$, $\\cosh^{-1}$ y $\\tanh^{-1}$ (formas logarítmicas).' },
    { num: 13, slug: '13-trinomio-cuadratico', titulo: 'Integrales con trinomio cuadrático', fase: 3,
      descripcion: 'Completar el cuadrado en $ax^2+bx+c$ para llegar a formas conocidas.' },
    { num: 14, slug: '14-integracion-por-partes', titulo: 'Integración por partes', fase: 3,
      descripcion: 'La fórmula $\\int u\\,dv = uv-\\int v\\,du$ y la regla LIATE para elegir $u$.' }
  ];

  var CLAVE_TEMA = 'ci-utp-tema';
  var cuerpo = document.body;
  var raiz = cuerpo.getAttribute('data-raiz') || './';
  var moduloActual = Number(cuerpo.getAttribute('data-modulo')) || 0;
  var oyentesTema = [];

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */

  /** Escapa texto para insertarlo de forma segura en HTML. */
  function escaparHTML(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Número con dos dígitos: 7 → "07". */
  function dosDigitos(n) {
    return (n < 10 ? '0' : '') + n;
  }

  /** Texto del distintivo de un módulo: "Fase 1 · Disponible", "Fase 2"… */
  function distintivoDe(modulo) {
    return FASES[modulo.fase].nombre + (modulo.disponible ? ' · Disponible' : '');
  }

  /** true si alguno de los módulos de la fase ya está publicado. */
  function faseDisponible(fase) {
    return MODULOS.some(function (m) { return m.fase === fase && m.disponible; });
  }

  /** Ruta relativa a la página de un módulo. */
  function urlModulo(modulo) {
    return raiz + 'modulos/' + modulo.slug + '/index.html';
  }

  /** Crea un elemento a partir de una cadena HTML. */
  function crearDesdeHTML(html) {
    var plantilla = document.createElement('template');
    plantilla.innerHTML = html.trim();
    return plantilla.content.firstElementChild;
  }

  /**
   * Convierte LaTeX en HTML con KaTeX. Si KaTeX no cargó (sin Internet),
   * devuelve el código escapado para que la página siga siendo legible.
   * @param {string} latex
   * @param {boolean} [enBloque=false]
   * @returns {string}
   */
  function tex(latex, enBloque) {
    if (window.katex && typeof window.katex.renderToString === 'function') {
      try {
        return window.katex.renderToString(latex, { displayMode: !!enBloque, throwOnError: false });
      } catch (e) {
        /* se usa el respaldo de abajo */
      }
    }
    return '<code>' + escaparHTML(latex) + '</code>';
  }

  /**
   * Renderiza las fórmulas delimitadas con $...$ o $$...$$ dentro de un elemento.
   * @param {Element} elemento
   */
  function renderizarMatematicas(elemento) {
    if (!elemento || typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(elemento, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'input', 'select'],
        throwOnError: false
      });
    } catch (e) {
      /* Un error de KaTeX nunca debe romper la página. */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Tema claro / oscuro                                                 */
  /* ------------------------------------------------------------------ */

  function temaDelSistema() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /** Devuelve 'dark' o 'light' según el tema que se está mostrando. */
  function temaActual() {
    var elegido = document.documentElement.getAttribute('data-theme');
    return elegido === 'dark' || elegido === 'light' ? elegido : temaDelSistema();
  }

  /** Registra una función que se llama cada vez que cambia el tema. */
  function alCambiarTema(funcion) {
    if (typeof funcion === 'function') oyentesTema.push(funcion);
  }

  function notificarTema() {
    oyentesTema.forEach(function (funcion) {
      try {
        funcion(temaActual());
      } catch (e) {
        /* un visualizador con error no debe afectar a los demás */
      }
    });
  }

  function actualizarBotonTema(boton) {
    var oscuro = temaActual() === 'dark';
    boton.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro (pizarra)');
    boton.querySelector('.boton-tema__texto').textContent = oscuro ? 'Claro' : 'Pizarra';
  }

  function iniciarTema(boton) {
    actualizarBotonTema(boton);
    boton.addEventListener('click', function () {
      var nuevo = temaActual() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nuevo);
      try {
        localStorage.setItem(CLAVE_TEMA, nuevo);
      } catch (e) {
        /* almacenamiento bloqueado: el tema dura solo esta visita */
      }
      actualizarBotonTema(boton);
      notificarTema();
    });

    if (window.matchMedia) {
      var consulta = window.matchMedia('(prefers-color-scheme: dark)');
      var alCambiarSistema = function () {
        if (!document.documentElement.getAttribute('data-theme')) {
          actualizarBotonTema(boton);
          notificarTema();
        }
      };
      if (consulta.addEventListener) consulta.addEventListener('change', alCambiarSistema);
      else if (consulta.addListener) consulta.addListener(alCambiarSistema);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Barra superior e índice lateral                                     */
  /* ------------------------------------------------------------------ */

  var ICONO_MENU =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M4 6h16M4 12h10M4 18h16"/></svg>';
  var ICONO_CERRAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICONOS_TEMA =
    '<svg class="icono-luna" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>' +
    '<svg class="icono-sol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

  function htmlEnlaceModulo(modulo) {
    var actual = modulo.num === moduloActual;
    var futuro = !modulo.disponible;
    return (
      '<li><a class="enlace-modulo' + (futuro ? ' enlace-modulo--futuro' : '') + '" href="' + urlModulo(modulo) + '"' +
      (actual ? ' aria-current="page"' : '') + '>' +
      '<span class="enlace-modulo__num">' + modulo.num + '</span>' +
      '<span>' + escaparHTML(modulo.titulo) +
      (futuro ? '<span class="visualmente-oculto"> (próximamente)</span>' : '') + '</span>' +
      '</a></li>'
    );
  }

  function construirNavegacion() {
    var grupos = [1, 2, 3].map(function (fase) {
      var items = MODULOS.filter(function (m) { return m.fase === fase; }).map(htmlEnlaceModulo).join('');
      var etiqueta = FASES[fase].nombre + (faseDisponible(fase) ? ' · Disponible' : ' · Próximamente');
      return (
        '<div class="lateral__grupo">' +
        '<p class="lateral__fase" id="lateral-fase-' + fase + '">' + escaparHTML(etiqueta) + '</p>' +
        '<ul aria-labelledby="lateral-fase-' + fase + '">' + items + '</ul></div>'
      );
    }).join('');

    var barra = crearDesdeHTML(
      '<header class="barra-sup">' +
      '<button type="button" class="boton-icono boton-menu" aria-expanded="false" aria-controls="lateral" aria-label="Abrir índice de módulos">' +
      ICONO_MENU + '</button>' +
      '<a class="marca" href="' + raiz + 'index.html" aria-label="IntegraLab, inicio">' +
      '<span class="marca__simbolo" aria-hidden="true">∫</span>' +
      '<span class="marca__nombre">Integra<span>Lab</span></span>' +
      '<span class="marca__sub">Cálculo Integral · UTP 2026-II</span></a>' +
      '<button type="button" class="boton-icono boton-tema">' + ICONOS_TEMA +
      '<span class="boton-tema__texto">Pizarra</span></button>' +
      '</header>'
    );

    var lateral = crearDesdeHTML(
      '<aside class="lateral" id="lateral" aria-label="Índice de módulos">' +
      '<div class="lateral__cabecera">' +
      '<p class="lateral__titulo">Índice del curso</p>' +
      '<button type="button" class="boton-icono boton-cerrar" aria-label="Cerrar índice">' + ICONO_CERRAR + '</button>' +
      '</div>' +
      '<nav class="lateral__desplazable" aria-label="Módulos del curso">' +
      '<a class="lateral__inicio" href="' + raiz + 'index.html"' + (moduloActual === 0 ? ' aria-current="page"' : '') + '>' +
      '<span aria-hidden="true">⌂</span> Inicio</a>' +
      grupos +
      '</nav>' +
      '<div class="lateral__pie">Proyecto semestral · 3 fases<br>' +
      '<a href="' + URL_REPOSITORIO + '" rel="noopener">Repositorio en GitHub</a></div>' +
      '</aside>'
    );

    var velo = crearDesdeHTML('<div class="velo" aria-hidden="true"></div>');
    var saltar = crearDesdeHTML('<a class="saltar-contenido" href="#contenido">Saltar al contenido</a>');

    cuerpo.insertBefore(velo, cuerpo.firstChild);
    cuerpo.insertBefore(lateral, velo);
    cuerpo.insertBefore(barra, lateral);
    cuerpo.insertBefore(saltar, barra);

    var botonMenu = barra.querySelector('.boton-menu');
    var botonCerrar = lateral.querySelector('.boton-cerrar');
    var escritorio = window.matchMedia ? window.matchMedia('(min-width: 1100px)') : null;

    function estaAbierto() {
      return lateral.classList.contains('lateral--abierta');
    }

    function abrir() {
      lateral.classList.add('lateral--abierta');
      velo.classList.add('velo--visible');
      cuerpo.classList.add('cajon-abierto');
      botonMenu.setAttribute('aria-expanded', 'true');
      var destino = lateral.querySelector('[aria-current="page"]') || botonCerrar;
      window.setTimeout(function () { destino.focus(); }, 30);
    }

    function cerrar(devolverFoco) {
      if (!estaAbierto()) return;
      lateral.classList.remove('lateral--abierta');
      velo.classList.remove('velo--visible');
      cuerpo.classList.remove('cajon-abierto');
      botonMenu.setAttribute('aria-expanded', 'false');
      if (devolverFoco) botonMenu.focus();
    }

    botonMenu.addEventListener('click', function () {
      if (estaAbierto()) cerrar(true);
      else abrir();
    });
    botonCerrar.addEventListener('click', function () { cerrar(true); });
    velo.addEventListener('click', function () { cerrar(true); });

    document.addEventListener('keydown', function (evento) {
      if (!estaAbierto()) return;
      if (evento.key === 'Escape') {
        cerrar(true);
        return;
      }
      /* Mantiene el foco dentro del cajón mientras está abierto (móvil). */
      if (evento.key === 'Tab') {
        var enfocables = lateral.querySelectorAll('a[href], button');
        var primero = enfocables[0];
        var ultimo = enfocables[enfocables.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    });

    /* Si la ventana pasa a escritorio, el índice queda fijo y el cajón se cierra. */
    if (escritorio) {
      var alCambiarAncho = function () { if (escritorio.matches) cerrar(false); };
      if (escritorio.addEventListener) escritorio.addEventListener('change', alCambiarAncho);
      else if (escritorio.addListener) escritorio.addListener(alCambiarAncho);
    }

    iniciarTema(barra.querySelector('.boton-tema'));
  }

  /* ------------------------------------------------------------------ */
  /* Portada: fichas de los 14 módulos agrupadas por fase                */
  /* ------------------------------------------------------------------ */

  function htmlFicha(modulo) {
    var fase = FASES[modulo.fase];
    var futuro = !modulo.disponible;
    return (
      '<li><a class="entrada' + (futuro ? ' entrada--futuro' : '') + '" href="' + urlModulo(modulo) + '">' +
      '<span class="entrada__num" aria-hidden="true">' + dosDigitos(modulo.num) + '</span>' +
      '<span class="entrada__cuerpo">' +
      '<span class="entrada__titulo"><span class="visualmente-oculto">Módulo ' + modulo.num + ': </span>' +
      escaparHTML(modulo.titulo) + '</span>' +
      '<span class="entrada__desc">' + modulo.descripcion + '</span></span>' +
      '<span class="entrada__flecha" aria-hidden="true">→</span>' +
      '<span class="entrada__estado distintivo ' + fase.clase + '">' + escaparHTML(distintivoDe(modulo)) + '</span>' +
      '</a></li>'
    );
  }

  function construirIndicePortada() {
    var contenedor = document.getElementById('indice-modulos');
    if (!contenedor) return;
    contenedor.innerHTML = [1, 2, 3].map(function (fase) {
      var modulos = MODULOS.filter(function (m) { return m.fase === fase; });
      var titulo = FASES[fase].nombre + (faseDisponible(fase) ? ' · Disponible' : ' · Próximamente') +
        ' — ' + FASES[fase].resumen;
      return (
        '<section class="indice__grupo" aria-labelledby="indice-fase-' + fase + '">' +
        '<h3 class="indice__fase" id="indice-fase-' + fase + '">' + escaparHTML(titulo) + '</h3>' +
        '<ul class="indice__lista">' + modulos.map(htmlFicha).join('') + '</ul>' +
        '</section>'
      );
    }).join('');
  }

  /* ------------------------------------------------------------------ */
  /* Navegación Anterior / Siguiente                                     */
  /* ------------------------------------------------------------------ */

  function construirAnteriorSiguiente() {
    var contenedor = document.querySelector('[data-prev-next]');
    if (!contenedor || !moduloActual) return;
    var indice = MODULOS.findIndex(function (m) { return m.num === moduloActual; });
    if (indice < 0) return;

    var anterior = MODULOS[indice - 1];
    var siguiente = MODULOS[indice + 1];
    var html = '';

    if (anterior) {
      html +=
        '<a class="prev-next__enlace prev-next__enlace--anterior" href="' + urlModulo(anterior) + '" rel="prev">' +
        '<span class="prev-next__rotulo">← Anterior · Módulo ' + anterior.num + '</span>' +
        '<span class="prev-next__titulo">' + escaparHTML(anterior.titulo) + '</span></a>';
    } else {
      html +=
        '<a class="prev-next__enlace prev-next__enlace--anterior" href="' + raiz + 'index.html">' +
        '<span class="prev-next__rotulo">← Anterior</span>' +
        '<span class="prev-next__titulo">Inicio de IntegraLab</span></a>';
    }

    if (siguiente) {
      html +=
        '<a class="prev-next__enlace prev-next__enlace--siguiente" href="' + urlModulo(siguiente) + '" rel="next">' +
        '<span class="prev-next__rotulo">Siguiente · Módulo ' + siguiente.num + ' →</span>' +
        '<span class="prev-next__titulo">' + escaparHTML(siguiente.titulo) + '</span></a>';
    } else {
      html +=
        '<a class="prev-next__enlace prev-next__enlace--siguiente" href="' + raiz + 'index.html">' +
        '<span class="prev-next__rotulo">Siguiente →</span>' +
        '<span class="prev-next__titulo">Volver al inicio</span></a>';
    }

    contenedor.innerHTML = html;
  }

  /* ------------------------------------------------------------------ */
  /* Pie de página                                                       */
  /* ------------------------------------------------------------------ */

  function construirPie() {
    var pie = crearDesdeHTML(
      '<footer class="pie">' +
      '<div class="contenedor pie__grid">' +
      '<div>' +
      '<p class="pie__titulo">IntegraLab · Plataforma de Cálculo Integral</p>' +
      '<p>Universidad Tecnológica de Pereira · Tecnología en Desarrollo de Software · Periodo 2026-II</p>' +
      '<p>Fórmulas con KaTeX · Gráficas con Plotly.js · Evaluación de funciones con math.js</p>' +
      '</div>' +
      '<p><a href="' + URL_REPOSITORIO + '" rel="noopener">Código fuente en GitHub</a></p>' +
      '</div>' +
      '</footer>'
    );
    cuerpo.appendChild(pie);
  }

  /* ------------------------------------------------------------------ */
  /* Ejemplos con pasos progresivos                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Convierte cada bloque [data-pasos] en una secuencia que se revela paso a
   * paso. Sin JavaScript todos los pasos quedan visibles.
   * @param {Element} contenedor
   */
  function iniciarPasos(contenedor) {
    var pasos = Array.prototype.slice.call(contenedor.querySelectorAll('.paso'));
    if (pasos.length < 2) return;

    var visibles = 1;
    var controles = crearDesdeHTML(
      '<div class="pasos-controles">' +
      '<button type="button" class="btn btn--pequeno" data-accion="siguiente">Mostrar siguiente paso</button>' +
      '<button type="button" class="btn btn--secundario btn--pequeno" data-accion="todo">Mostrar todo</button>' +
      '<button type="button" class="btn btn--texto btn--pequeno" data-accion="reiniciar">Reiniciar</button>' +
      '<span class="pasos-progreso" aria-live="polite"></span>' +
      '</div>'
    );
    contenedor.appendChild(controles);

    var botonSiguiente = controles.querySelector('[data-accion="siguiente"]');
    var botonTodo = controles.querySelector('[data-accion="todo"]');
    var botonReiniciar = controles.querySelector('[data-accion="reiniciar"]');
    var progreso = controles.querySelector('.pasos-progreso');

    function pintar(animarDesde) {
      pasos.forEach(function (paso, i) {
        paso.hidden = i >= visibles;
        paso.classList.toggle('paso--aparece', animarDesde !== undefined && i >= animarDesde && i < visibles);
      });
      botonSiguiente.disabled = visibles >= pasos.length;
      botonTodo.disabled = visibles >= pasos.length;
      botonReiniciar.disabled = visibles <= 1;
      progreso.textContent = 'Paso ' + visibles + ' de ' + pasos.length;
    }

    botonSiguiente.addEventListener('click', function () {
      if (visibles < pasos.length) {
        visibles += 1;
        pintar(visibles - 1);
        if (visibles >= pasos.length) botonReiniciar.focus();
      }
    });
    botonTodo.addEventListener('click', function () {
      var desde = visibles;
      visibles = pasos.length;
      pintar(desde);
      botonReiniciar.focus();
    });
    botonReiniciar.addEventListener('click', function () {
      visibles = 1;
      pintar();
      botonSiguiente.focus();
    });

    pintar();
  }

  /* ------------------------------------------------------------------ */
  /* Pestañas de los módulos (Teoría · Visualizador · Ejemplos)          */
  /* ------------------------------------------------------------------ */

  var gruposDePestanas = [];

  /** Ajusta las gráficas de Plotly de un panel que acaba de hacerse visible. */
  function redimensionarGraficas(panel) {
    if (!window.Plotly || !window.Plotly.Plots) return;
    window.requestAnimationFrame(function () {
      Array.prototype.forEach.call(panel.querySelectorAll('.js-plotly-plot'), function (grafica) {
        try {
          window.Plotly.Plots.resize(grafica);
        } catch (e) {
          /* la gráfica se ajustará en el próximo redibujo */
        }
      });
    });
  }

  /**
   * Pestañas accesibles (patrón WAI-ARIA "tabs" con activación automática).
   * Sin JavaScript los tres paneles quedan visibles uno debajo del otro.
   * @param {Element} contenedor Elemento con [data-pestanas].
   */
  function iniciarPestanas(contenedor) {
    var botones = Array.prototype.slice.call(contenedor.querySelectorAll('[role="tab"]'));
    var paneles = botones.map(function (b) { return document.getElementById(b.getAttribute('aria-controls')); });
    if (!botones.length || paneles.indexOf(null) >= 0) return;

    function activar(indice, opciones) {
      var o = opciones || {};
      botones.forEach(function (boton, i) {
        var activo = i === indice;
        boton.setAttribute('aria-selected', activo ? 'true' : 'false');
        boton.tabIndex = activo ? 0 : -1;
        paneles[i].hidden = !activo;
      });
      if (o.foco) botones[indice].focus();
      if (o.actualizarUrl && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + paneles[indice].id);
      }
      redimensionarGraficas(paneles[indice]);
    }

    botones.forEach(function (boton, i) {
      boton.addEventListener('click', function () { activar(i, { actualizarUrl: true }); });
      boton.addEventListener('keydown', function (evento) {
        var destino = null;
        if (evento.key === 'ArrowRight') destino = (i + 1) % botones.length;
        else if (evento.key === 'ArrowLeft') destino = (i - 1 + botones.length) % botones.length;
        else if (evento.key === 'Home') destino = 0;
        else if (evento.key === 'End') destino = botones.length - 1;
        if (destino !== null) {
          evento.preventDefault();
          activar(destino, { foco: true, actualizarUrl: true });
        }
      });
    });

    /** Abre la pestaña que contiene el destino del #ancla de la URL. */
    function desdeAncla() {
      var id = decodeURIComponent(window.location.hash.slice(1));
      var objetivo = id ? document.getElementById(id) : null;
      if (!objetivo) return false;
      var indice = paneles.findIndex(function (p) { return p === objetivo || p.contains(objetivo); });
      if (indice < 0) return false;
      activar(indice);
      (objetivo === paneles[indice] ? contenedor : objetivo).scrollIntoView({ block: 'start' });
      return true;
    }

    window.addEventListener('hashchange', desdeAncla);
    if (!desdeAncla()) {
      var inicial = botones.findIndex(function (b) { return b.getAttribute('aria-selected') === 'true'; });
      activar(Math.max(0, inicial));
    }
    gruposDePestanas.push({ contenedor: contenedor, paneles: paneles, activar: activar });
  }

  /**
   * Muestra la pestaña cuyo panel tiene el id indicado.
   * @param {string} id
   * @returns {boolean} true si existía.
   */
  function mostrarPestana(id) {
    return gruposDePestanas.some(function (grupo) {
      var i = grupo.paneles.findIndex(function (panel) { return panel.id === id; });
      if (i >= 0) grupo.activar(i, { actualizarUrl: true });
      return i >= 0;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Arranque                                                            */
  /* ------------------------------------------------------------------ */

  construirNavegacion();
  construirIndicePortada();
  construirAnteriorSiguiente();
  construirPie();
  Array.prototype.forEach.call(document.querySelectorAll('[data-pasos]'), iniciarPasos);
  Array.prototype.forEach.call(document.querySelectorAll('[data-pestanas]'), iniciarPestanas);
  renderizarMatematicas(document.body);

  /** API pública para los scripts de cada módulo. */
  window.CI = {
    MODULOS: MODULOS,
    FASES: FASES,
    escaparHTML: escaparHTML,
    tex: tex,
    renderizarMatematicas: renderizarMatematicas,
    temaActual: temaActual,
    alCambiarTema: alCambiarTema,
    mostrarPestana: mostrarPestana
  };
})();
