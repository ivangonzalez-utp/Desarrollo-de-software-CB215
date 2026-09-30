# IntegraLab · Plataforma interactiva de Cálculo Integral

Plataforma web educativa para estudiar **Cálculo Integral** con teoría, visualizadores interactivos y ejemplos resueltos paso a paso. Es el proyecto semestral del curso Cálculo Integral del programa **Tecnología en Desarrollo de Software** de la **Universidad Tecnológica de Pereira (UTP)**, periodo **2026-II**. Se construye en tres fases y al final del semestre se compartirá en la red académica como material de estudio.

**Demo en vivo:** <https://ivangonzalez-utp.github.io/Desarrollo-de-software-CB215/index.html>

**Repositorio:** <https://github.com/ivangonzalez-utp/Desarrollo-de-software-CB215>

## Contenido

- [Módulos](#módulos)
- [Qué ofrece cada módulo](#qué-ofrece-cada-módulo)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Ejecutar en local](#ejecutar-en-local)
- [Pruebas](#pruebas)
- [Cómo contribuir](#cómo-contribuir)
- [Hoja de ruta: fases 2 y 3](#hoja-de-ruta-fases-2-y-3)
- [Uso de inteligencia artificial](#uso-de-inteligencia-artificial)

## Módulos

| # | Módulo | Fase | Estado |
|---|--------|------|--------|
| 01 | [Sumas de Riemann](modulos/01-sumas-riemann/index.html) | Fase 1 | ✅ Disponible |
| 02 | [Regla del Trapecio](modulos/02-regla-trapecio/index.html) | Fase 1 | ✅ Disponible |
| 03 | [Regla del Punto Medio](modulos/03-punto-medio/index.html) | Fase 1 | ✅ Disponible |
| 04 | [Regla de Simpson](modulos/04-regla-simpson/index.html) | Fase 1 | ✅ Disponible |
| 05 | [Integral definida y área bajo la curva](modulos/05-integral-definida-area/index.html) | Fase 1 | ✅ Disponible |
| 06 | [Integración directa](modulos/06-integracion-directa/index.html) | Fase 1 | ✅ Disponible |
| 07 | [Sustitución: integrales de potencias](modulos/07-sustitucion-potencias/index.html) | Fase 2 | 🕓 Próximamente |
| 08 | [Integrales de funciones exponenciales](modulos/08-exponenciales/index.html) | Fase 2 | 🕓 Próximamente |
| 09 | [Integrales que producen logaritmos](modulos/09-logaritmicas/index.html) | Fase 2 | 🕓 Próximamente |
| 10 | [Integrales trigonométricas](modulos/10-trigonometricas/index.html) | Fase 2 | 🕓 Próximamente |
| 11 | [Integrales con trigonométricas inversas](modulos/11-trigonometricas-inversas/index.html) | Fase 3 | 🕓 Próximamente |
| 12 | [Integrales con hiperbólicas inversas](modulos/12-hiperbolicas-inversas/index.html) | Fase 3 | 🕓 Próximamente |
| 13 | [Integrales con trinomio cuadrático](modulos/13-trinomio-cuadratico/index.html) | Fase 3 | 🕓 Próximamente |
| 14 | [Integración por partes](modulos/14-integracion-por-partes/index.html) | Fase 3 | 🕓 Próximamente |

Los módulos 7 a 14 ya existen como páginas navegables con su tema, sus fórmulas clave y el aviso «Próximamente - Fase 2» o «Próximamente - Fase 3».

## Qué ofrece cada módulo

Cada módulo de la Fase 1 tiene tres pestañas:

1. **Teoría**: definiciones, fórmulas numeradas y notas al margen, escritas con KaTeX.
2. **Visualizador interactivo**: escribes tu propia $f(x)$ (o eliges un ejemplo), fijas los límites y ves los resultados en vivo.
3. **Ejemplos paso a paso**: ejercicios resueltos que se revelan con «Mostrar siguiente paso» y que se pueden cargar en el visualizador.

| Módulo | Lo más destacado del visualizador |
|--------|-----------------------------------|
| 1 · Riemann | Rectángulos por la izquierda, la derecha o el punto medio; gráfica de convergencia de $L_n$, $R_n$ y $M_n$ hacia el valor exacto. |
| 2 · Trapecio | Trapecios sombreados y comprobación en vivo de $T_n=\tfrac{L_n+R_n}{2}$. |
| 3 · Punto medio | Puntos medios marcados sobre el eje y la curva; comparación del error con el trapecio. |
| 4 · Simpson | Parábolas ajustadas por cada par de subintervalos, $n$ par (advertencia si es impar) y comparación de los cinco métodos con una gráfica de error en escala logarítmica. |
| 5 · Integral definida | Deslizadores para $a$ y $b$, regiones positivas (azul) y negativas (rojo), función de área $A(x)$, $F(b)-F(a)$ y modo «entre dos curvas» con cálculo de los puntos de corte. |
| 6 · Integración directa | Gráficas de $f(x)$ junto a $F(x)+C$ con deslizador para $C$, y un verificador que deriva tu antiderivada con math.js. |

En todos los visualizadores numéricos se muestran $\Delta x$, la aproximación, el valor «exacto» de referencia (Simpson con $n=10\,000$), el error absoluto, el error relativo y una tabla colapsable con los valores $x_i$ y $f(x_i)$. Las entradas inválidas (función mal escrita, $a\ge b$, $n$ impar en Simpson, divisiones por cero) producen mensajes claros en la interfaz, nunca errores en la consola.

## Tecnologías

| Herramienta | Uso | Versión |
|-------------|-----|---------|
| HTML, CSS y JavaScript *vanilla* | Toda la aplicación, sin frameworks ni paso de compilación | — |
| [KaTeX](https://katex.org/) (CDN) | Fórmulas con auto-render (`$...$` y `$$...$$`) | 0.16.11 |
| [Plotly.js](https://plotly.com/javascript/) (CDN, paquete *basic*) | Gráficas interactivas | 2.35.2 |
| [math.js](https://mathjs.org/) (CDN) | Interpretar y evaluar funciones escritas por el usuario; derivación simbólica en el módulo 6 | 13.2.0 |
| Node.js | Ejecutar las pruebas de `numerics.js` (no se necesita para usar el sitio) | 18 o superior |
| GitHub Pages | Publicación del sitio | — |

Las librerías se cargan desde jsDelivr con verificación de integridad (SRI). No hay otras dependencias.

## Arquitectura

```
Desarrollo-de-software-CB215/
├── index.html                  # Portada: hoja de ruta e índice de los 14 módulos
├── README.md
├── USO_DE_IA.md                # Documentación del uso de IA (lo exige el curso)
├── .nojekyll                   # GitHub Pages sirve los archivos tal cual
├── assets/
│   ├── favicon.svg
│   ├── css/styles.css          # Sistema de diseño completo (tokens, temas, componentes)
│   └── js/
│       ├── common.js           # Registro de módulos, navegación, tema, pie, KaTeX, pestañas y pasos
│       ├── numerics.js         # Métodos numéricos como funciones puras (navegador y Node)
│       ├── plot-helpers.js     # Utilidades compartidas de Plotly
│       └── visualizador.js     # Lógica compartida de los visualizadores (entrada, validación, visor, tabla)
├── modulos/
│   ├── 01-sumas-riemann/       # index.html + script.js
│   ├── …                       # 02 a 06: módulos completos
│   └── 07-… a 14-…/            # placeholders (solo index.html)
└── tests/numerics.test.js      # Pruebas con Node
```

### Cómo se comparten estilos y scripts

- **Rutas relativas.** Cada página declara en `<body>` su número de módulo y la ruta a la raíz: `<body data-modulo="3" data-raiz="../../">`. Con eso `common.js` arma todos los enlaces, así el sitio funciona igual en `http://localhost:8000/` y en `https://ivangonzalez-utp.github.io/Desarrollo-de-software-CB215/`.
- **Un solo registro de módulos.** El arreglo `MODULOS` de `common.js` (número, carpeta, título, descripción, fase y si está disponible) alimenta el índice lateral, las fichas de la portada y los botones Anterior / Siguiente.
- **Orden de carga.** Todas las páginas cargan las librerías con `defer` y luego, en este orden: `common.js` → `numerics.js` → `plot-helpers.js` → `visualizador.js` → `script.js` del módulo. Los placeholders solo necesitan KaTeX y `common.js`.
- **API compartida.** `common.js` expone `window.CI` (renderizar fórmulas, pestañas, tema); `numerics.js` expone `window.Numerics`; `plot-helpers.js` expone `window.Graficas`; `visualizador.js` expone `window.Visualizador`.

### `numerics.js`

Contiene únicamente **funciones puras** documentadas con JSDoc: reciben `f` como una función de JavaScript y devuelven un número, sin tocar el DOM. Todas las reglas se expresan como una suma ponderada $\sum w_i\,f(x_i)$ a partir de `nodes(regla, a, b, n)`, de modo que la tabla del visualizador usa exactamente los mismos nodos y pesos que el cálculo.

| Función | Qué calcula |
|---------|-------------|
| `riemannLeft`, `riemannRight`, `riemannMid` | Sumas de Riemann $L_n$, $R_n$, $M_n$ |
| `midpoint` | Regla del punto medio (igual a `riemannMid`) |
| `trapezoid` | Regla del trapecio $T_n$ |
| `simpson` | Regla de Simpson $S_n$ ($n$ par; lanza `RangeError` si es impar) |
| `reference` | Valor de referencia: Simpson con $n=10\,000$ |
| `absoluteError`, `relativeError` | Errores de una aproximación |
| `findRoots`, `signedArea` | Raíces, integral con signo y área total por tramos (módulo 5) |
| `parabolaThrough`, `cumulativeTrapezoid` | Parábolas de Simpson y función de área $A(x)$ |

Se usa con el patrón UMD: en el navegador queda como `window.Numerics` y en Node con `require('./assets/js/numerics.js')`.

### Diseño

- Mobile-first con variables CSS, Flexbox y Grid. Puntos de quiebre en 640 px (tablet), 1100 px (índice lateral fijo) y 1240 px (notas al margen).
- Tema claro «cuaderno cuadriculado» y tema oscuro «pizarra», que respetan la preferencia del sistema y se pueden alternar con el botón de la barra superior.
- Las gráficas leen sus colores de las variables CSS y usan una paleta categórica apta para daltonismo; cada método conserva su color en todo el sitio.
- Accesibilidad básica: HTML semántico, etiquetas en todos los controles, pestañas con teclado (flechas, Inicio, Fin), foco visible, enlace «Saltar al contenido» y una tabla de valores como alternativa a cada gráfica.

## Ejecutar en local

No hay nada que instalar. Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

y abre <http://localhost:8000/>. También sirve cualquier servidor estático (`npx serve`, la extensión *Live Server* de VS Code, etc.). Se necesita conexión a Internet para cargar KaTeX, Plotly y math.js desde el CDN.

## Pruebas

```bash
node tests/numerics.test.js
```

Las 63 pruebas (sin dependencias, con `node:assert`) verifican:

- Los métodos contra valores exactos conocidos: $\int_0^2 x^2\,dx=\tfrac83$, $\int_0^1 e^x\,dx=e-1$, $\int_0^\pi \sin x\,dx=2$.
- Que Simpson es exacto para polinomios de grado $\le 3$ (y que no lo es para $x^4$).
- Todos los valores numéricos publicados en los ejemplos resueltos de los módulos 1 a 6.
- Las relaciones $T_n=\tfrac{L_n+R_n}{2}$ y $S_{2n}=\tfrac{T_n+2M_n}{3}$ y los órdenes de convergencia (el error se divide ≈ 2, 4 y 16 al duplicar $n$).
- La validación de entradas: $n$ impar en Simpson, $a\ge b$, $n$ no entero y divisiones por cero.

## Cómo contribuir

### Flujo de ramas y pull requests

1. Crea una rama desde `main` con un prefijo según el tipo de cambio:
   - `modulo/07-sustitucion-potencias` para desarrollar un módulo,
   - `fix/simpson-n-impar` para corregir un error,
   - `docs/readme-fase-2` para documentación.
2. Haz commits pequeños con mensajes en español que digan qué cambia (por ejemplo, `Módulo 7: visualizador del cambio de variable`).
3. Abre un *pull request* hacia `main` y describe qué se hizo y cómo se probó. `main` es la rama que publica GitHub Pages, así que solo se fusiona lo que está revisado.

### Agregar (o publicar) un módulo

Los módulos 7 a 14 ya tienen carpeta y página. Para convertir uno en módulo completo:

1. Copia la estructura de un módulo existente, por ejemplo `modulos/02-regla-trapecio/index.html`, dentro de la carpeta del nuevo módulo. Conserva `data-raiz="../../"` y cambia `data-modulo` por su número.
2. Escribe el contenido en las tres pestañas (`#teoria`, `#visualizador`, `#ejemplos`). Las fórmulas van entre `$...$` o `$$...$$`; el signo `<` dentro de una fórmula se escribe `&lt;`.
3. Crea `script.js` en la carpeta del módulo. Si el visualizador es un método numérico, usa `Visualizador.crear({...})`; si no, reutiliza `Visualizador.compilarFuncion`, `Graficas.dibujar` y compañía.
4. Si el módulo necesita cálculos nuevos, agrégalos a `numerics.js` como funciones puras con JSDoc y escribe sus pruebas en `tests/numerics.test.js`.
5. En `assets/js/common.js`, marca el módulo con `disponible: true` en el arreglo `MODULOS`. Esto cambia su distintivo a «Fase N · Disponible» en el índice y en la portada.
6. Actualiza la tabla de módulos de este README.

Para un módulo totalmente nuevo (fuera de los 14), crea la carpeta con el siguiente número y agrega su entrada al arreglo `MODULOS`: la navegación, la portada y los botones Anterior / Siguiente se actualizan solos.

### Convenciones

- **Carpetas:** `NN-nombre-en-minusculas`, con dos dígitos, guiones y sin tildes (`09-logaritmicas`). Cada una tiene `index.html` y, si hay visualizador, `script.js`.
- **Código:** comentarios, identificadores de interfaz y mensajes en español; funciones en `camelCase`; clases CSS en español con estilo BEM (`bloque__elemento--modificador`). Las funciones de `numerics.js` conservan los nombres en inglés que pide el enunciado (`riemannLeft`, `trapezoid`, `simpson`…).
- **Colores y espaciado:** usa siempre las variables de `styles.css` (`--primario`, `--texto-2`, `--serie-1`…), nunca colores fijos, para que el tema oscuro funcione.
- **Ejemplos:** verifica numéricamente cada resultado y agrégalo a las pruebas. No uses los ejercicios del taller manual del curso.

### Lista de revisión antes del pull request

- [ ] `node tests/numerics.test.js` pasa sin fallos.
- [ ] La consola del navegador no muestra errores ni advertencias.
- [ ] A 375 px de ancho no hay scroll horizontal y las gráficas se adaptan.
- [ ] Todas las fórmulas se ven renderizadas (no queda texto con `$` sin procesar).
- [ ] Todas las rutas son relativas.
- [ ] Probado en modo claro y en modo oscuro.

## Hoja de ruta: fases 2 y 3

**Fase 2 · Métodos de integración I (módulos 7 a 10)**

- **07 · Sustitución (potencias):** visualizador del cambio de variable $u=g(x)$ que muestra cómo se transforman el integrando y los límites.
- **08 · Exponenciales:** integrales de $e^u$ y $a^u$; comparación gráfica de $e^{kx}$ para distintos $k$.
- **09 · Logarítmicas:** $\int\frac{g'(x)}{g(x)}\,dx=\ln|g(x)|+C$ y la importancia del valor absoluto, con dominios visibles en la gráfica.
- **10 · Trigonométricas:** potencias y productos de seno y coseno con identidades, y un verificador de identidades.

**Fase 3 · Métodos de integración II (módulos 11 a 14)**

- **11 · Trigonométricas inversas:** formas $\frac{1}{\sqrt{a^2-u^2}}$, $\frac{1}{a^2+u^2}$ y $\frac{1}{u\sqrt{u^2-a^2}}$.
- **12 · Hiperbólicas inversas:** formas logarítmicas de $\operatorname{senh}^{-1}$, $\cosh^{-1}$ y $\tanh^{-1}$.
- **13 · Trinomio cuadrático:** asistente para completar el cuadrado paso a paso.
- **14 · Integración por partes:** regla LIATE, método tabular e integrales cíclicas.

Mejoras generales previstas: un banco de ejercicios de práctica con retroalimentación, pruebas automáticas en GitHub Actions y la reutilización del verificador de antiderivadas del módulo 6 en todos los módulos de integración.

## Uso de inteligencia artificial

La parte de software de este proyecto se desarrolló con asistencia de IA. El detalle de qué se generó, qué se revisó y qué instrucciones se usaron está en [USO_DE_IA.md](USO_DE_IA.md).

## Autor

Iván González ([@ivangonzalez-utp](https://github.com/ivangonzalez-utp)) · Ingeniería Industrial· Universidad Tecnológica de Pereira · 2026-II.
