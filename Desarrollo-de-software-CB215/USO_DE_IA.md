# Uso de inteligencia artificial en el proyecto

**Proyecto:** IntegraLab · Plataforma interactiva de Cálculo Integral (Fase 1)
**Curso:** Cálculo Integral · Desarrollo de Software · Universidad Tecnológica de Pereira · 2026-II
**Estudiante:** Iván González (@ivangonzalez-utp)

> Las secciones marcadas con ✍️ son para que yo, como estudiante, complete mis propias observaciones.

## 1. Declaración

La **Parte II (software)** del proyecto —la plataforma web publicada en este repositorio— se desarrolló con la asistencia de una herramienta de inteligencia artificial. La **Parte I (taller manual del parcial)** la resolví a mano, sin IA. Los ejemplos resueltos que aparecen en la plataforma son distintos a los ejercicios del taller; así se le pidió explícitamente a la IA.

## 2. Herramienta utilizada

| Aspecto | Detalle |
|---------|---------|
| Herramienta | Qwen Code (asistente de programación de Alibaba), extensión de VS Code |
| Modelo | Qwen 5.5 |
| Forma de uso | Conversación con instrucciones en español; la IA creó y editó los archivos del proyecto, ejecutó las pruebas y revisó las páginas en un navegador sin interfaz |
| Fecha | Septiembre de 2026 |

## 3. Qué generó la IA

| Componente | Archivos | Qué hizo la IA |
|------------|----------|----------------|
| Estructura y navegación | `index.html`, `assets/js/common.js` | Portada, registro de los 14 módulos, índice lateral con menú hamburguesa en móvil, botones Anterior / Siguiente, tema claro/oscuro, pestañas y pasos progresivos |
| Diseño visual | `assets/css/styles.css`, `assets/favicon.svg` | Sistema de diseño mobile-first («cuaderno» y «pizarra»), componentes de teoría, visualizadores y ejemplos |
| Métodos numéricos | `assets/js/numerics.js` | Funciones puras con JSDoc: Riemann, trapecio, punto medio, Simpson, errores, raíces y áreas por tramos |
| Pruebas | `tests/numerics.test.js` | 63 pruebas con Node contra valores exactos y contra los ejemplos publicados |
| Visualizadores | `assets/js/visualizador.js`, `assets/js/plot-helpers.js`, `modulos/*/script.js` | Entrada de funciones con math.js, validaciones con mensajes amigables, gráficas con Plotly, visor de resultados y tablas |
| Contenido | `modulos/01` a `modulos/06` | Redacción de la teoría, selección de ejemplos, desarrollo paso a paso y verificación numérica de cada resultado |
| Placeholders | `modulos/07` a `modulos/14` | Páginas con el tema, las fórmulas clave y el mensaje «Próximamente - Fase 2/3» |
| Documentación | `README.md`, este archivo | Descripción, arquitectura, guía de contribución, hoja de ruta y esta plantilla |
| Git | historial del repositorio | Commits en español por entregable |

## 4. Cómo verificó la IA su propio trabajo

- Ejecutó `node tests/numerics.test.js` (63 pruebas, todas aprobadas).
- Calculó con `numerics.js` cada valor que aparece en los ejemplos antes de escribirlo, y comprobó con diferencias numéricas que las antiderivadas del módulo 6 cumplen $F'(x)=f(x)$.
- Abrió las 15 páginas en Chrome sin interfaz, a 375 px y a 1280 px, y revisó en cada pestaña: errores o advertencias en la consola, scroll horizontal, fórmulas de KaTeX sin renderizar o con error, tamaño de las gráficas y enlaces rotos.
- Probó entradas inválidas (funciones mal escritas, símbolos desconocidos, $a\ge b$, $n$ impar en Simpson, divisiones por cero, raíces de negativos) y confirmó que solo aparecen mensajes en la interfaz.
- En ese proceso encontró y corrigió errores propios, por ejemplo: un `<` dentro de una fórmula que el HTML interpretaba como etiqueta, una fórmula en línea que desbordaba la pantalla en móvil, advertencias de KaTeX por caracteres no admitidos y dos afirmaciones incorrectas en las leyendas de las gráficas del módulo 6 (una raíz aproximada y el tipo de extremo local).

## 5. Qué revisé y ajusté yo ✍️

> Completa esta sección con lo que realmente hiciste. Algunas preguntas guía:

- [ ] Revisé la teoría de cada módulo y la comparé con mis apuntes y con el libro del curso.
  - Observaciones: …
- [ ] Rehice a mano al menos un ejemplo de cada módulo y comprobé que el resultado coincide.
  - Ejemplos revisados: …
- [ ] Probé los visualizadores con funciones propias.
  - Funciones probadas y resultado: …
- [ ] Revisé la plataforma en mi celular.
  - Dispositivo y observaciones: …
- [ ] Cambios que pedí o hice sobre lo generado:
  - Pedí cambiar el diseño general y luego el diseño interno de los módulos para que la plataforma tuviera una identidad propia.
  - …
- [ ] Partes del código que estudié para poder explicarlas en la sustentación:
  - …

## 6. Prompts principales

1. **Prompt principal del proyecto.** Contexto del curso, stack obligatorio (HTML/CSS/JS *vanilla*, KaTeX, Plotly.js, math.js), estructura de carpetas, los cuatro entregables de la Fase 1, la regla de no usar los ejercicios del taller, requisitos de calidad de código, este documento, Git y despliegue, y la verificación final. El texto completo está en el [anexo](#anexo-prompt-principal).
2. **Correo para Git.** A la pregunta de la IA sobre el correo del primer commit respondí `ivan.gonzalez@utp.edu.co`.
3. **Repositorio.** «Este es el repositorio: https://github.com/ivangonzalez-utp/Desarrollo-de-software-CB215». Con esto la IA ajustó el nombre del repositorio y la URL de GitHub Pages, que en el prompt principal eran `calculo-integral-utp`.
4. **Diseño general.** «Cambia un poco el diseño, que no quede parecido a [otro sitio de referencia]». La IA revisó ese sitio y rediseñó la identidad visual: nombre IntegraLab, índice lateral, estilo cuaderno/pizarra y fichas por fase.
5. **Diseño interno de los módulos.** «Cambia el diseño interno de los módulos, que no se vean igual que los de [el mismo sitio]». La IA rehízo la estructura interna: cabecera con pizarra, pestañas, teoría estilo libro con notas al margen, visualizador tipo instrumento y ejemplos en hojas de cuaderno.

✍️ Si usé otros prompts (por ejemplo, para corregir algo o pedir explicaciones), los agrego aquí:

- …

## 7. Decisiones de la IA que conviene conocer

- Se agregó un archivo que no estaba en la estructura pedida: `assets/js/visualizador.js`, con la lógica compartida de los visualizadores para no repetirla en cada módulo.
- El valor «exacto» de los visualizadores es una referencia numérica (Simpson con $n=10\,000$), como pedía el enunciado; en el módulo 5 se compara además con $F(b)-F(a)$ cuando se conoce la antiderivada.
- Plotly se carga en su versión *basic* (más liviana), suficiente para las gráficas de líneas y áreas del proyecto.
- En `math.js`, `log(x)` es el logaritmo natural; la plataforma acepta también `ln`, `sen` y `tg`. Para $\ln|x|$ se escribe `log(abs(x))` y para la raíz cúbica `cbrt(x)`, porque `x^(1/3)` no está definido para $x<0$ en math.js.

## 8. Limitaciones conocidas

- Se necesita Internet para cargar KaTeX, Plotly y math.js desde el CDN.
- La búsqueda de raíces y puntos de corte es numérica: puede no detectar raíces muy juntas o funciones con oscilaciones extremadamente rápidas.
- El verificador del módulo 6 compara $F'$ y $f$ en puntos de la ventana visible; no es una demostración formal.

## 9. Reflexión personal ✍️

> ¿Qué aprendí de cálculo integral al revisar la plataforma? ¿Qué aprendí de desarrollo de software? ¿En qué me ayudó la IA y en qué no? ¿Qué haría distinto en las fases 2 y 3?

…

---

## Anexo: prompt principal

<details>
<summary>Ver el prompt completo usado para la Fase 1</summary>

```markdown
## Contexto

Soy estudiante de Desarrollo de Software en la Universidad Tecnológica de Pereira (UTP), curso Cálculo Integral, periodo 2026-II. Necesito construir la **Fase 1** de una plataforma web educativa e interactiva de cálculo integral. Es un proyecto semestral por fases; al final del semestre se compartirá en la red académica como material de estudio. Toda la interfaz y el contenido deben estar en **español**.

- **Usuario de GitHub:** `ivangonzalez-utp`
- **Repositorio:** `calculo-integral-utp` (público)
- **Despliegue:** GitHub Pages → `https://ivangonzalez-utp.github.io/calculo-integral-utp/`

## Stack obligatorio

- HTML + CSS + JavaScript **vanilla**, sin frameworks ni paso de build (debe funcionar directo en GitHub Pages).
- **KaTeX** (CDN) para todas las fórmulas, con auto-render (`$...$` y `$$...$$`).
- **Plotly.js** (CDN) para todas las gráficas interactivas.
- **math.js** (CDN) para parsear y evaluar funciones escritas por el usuario (ej. `x^2`, `sin(x)`, `exp(x)`, `sqrt(x)`, `log(x)`).
- Diseño **responsive** (móvil, tablet y escritorio), mobile-first, con CSS propio (variables CSS, Flexbox/Grid). Soporte de modo claro/oscuro.

## Estructura de carpetas (una carpeta por módulo)

calculo-integral-utp/
├── index.html                  # Inicio con navegación a los 14 módulos
├── README.md
├── USO_DE_IA.md                # Documentación del uso de IA (lo exige el curso)
├── .nojekyll
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── common.js           # Navbar, footer, KaTeX auto-render, tema
│       ├── numerics.js         # Riemann, trapecio, punto medio, Simpson (funciones puras)
│       └── plot-helpers.js     # Utilidades compartidas de Plotly
├── modulos/
│   ├── 01-sumas-riemann/index.html  (+ script.js)
│   ├── 02-regla-trapecio/
│   ├── 03-punto-medio/
│   ├── 04-regla-simpson/
│   ├── 05-integral-definida-area/
│   ├── 06-integracion-directa/
│   ├── 07-sustitucion-potencias/        # placeholder
│   ├── 08-exponenciales/                # placeholder
│   ├── 09-logaritmicas/                 # placeholder
│   ├── 10-trigonometricas/              # placeholder
│   ├── 11-trigonometricas-inversas/     # placeholder
│   ├── 12-hiperbolicas-inversas/        # placeholder
│   ├── 13-trinomio-cuadratico/          # placeholder
│   └── 14-integracion-por-partes/       # placeholder
└── tests/numerics.test.js      # Pruebas con Node (node tests/numerics.test.js)

## Entregable 1 — Estructura base

1. `index.html`: portada del proyecto (nombre de la plataforma, curso, UTP, periodo) y una **cuadrícula de 14 tarjetas**, una por módulo, con número, título, descripción corta y un distintivo de fase: "Fase 1 · Disponible" (1–6), "Fase 2" (7–10), "Fase 3" (11–14).
2. Barra de navegación común en todas las páginas (menú hamburguesa en móvil) con acceso a los 14 módulos y botones "Anterior / Siguiente" entre módulos.
3. Módulos 7 a 14: páginas placeholder con el título del módulo, una breve descripción del tema y el mensaje exacto **"Próximamente - Fase 2/3"** (indicando cuál fase le corresponde: 7–10 → Fase 2, 11–14 → Fase 3).
4. `README.md` completo: descripción, demo en vivo (enlace a Pages), tabla de los 14 módulos con estado y fase, tecnologías, arquitectura (explicar carpetas, `numerics.js`, cómo se comparten estilos/scripts), cómo ejecutar en local, **cómo contribuir** (cómo agregar un módulo nuevo, convenciones de nombres, flujo de ramas/PR) y hoja de ruta de las fases 2 y 3.

## Entregable 2 — Módulos 1 a 4 (métodos numéricos)

Cada módulo debe tener tres secciones: **Teoría**, **Visualizador interactivo** y **Ejemplos resueltos paso a paso** (mínimo 2).

Controles comunes de los visualizadores: campo para la función $f(x)$ (con funciones predefinidas en un selector), límites $a$ y $b$, y un **slider de $n$** (1 a 100). Al mover el slider la gráfica y los resultados se actualizan en vivo. Mostrar siempre: $\Delta x$, la aproximación, el valor "exacto" (calculado con Simpson de n muy grande como referencia), el **error absoluto y relativo**, y una tabla con $x_i$ y $f(x_i)$ (colapsable).

- **Módulo 1 – Sumas de Riemann:** teoría de $L_n$, $R_n$ y $M_n$ con $\Delta x = \frac{b-a}{n}$. Visualizador con selector izquierda/derecha/punto medio que dibuja los rectángulos sobre la curva, más una **gráfica de convergencia** (aproximación vs. $n$ hacia el valor exacto).
- **Módulo 2 – Regla del Trapecio:** fórmula $T_n = \frac{\Delta x}{2}[f(x_0) + 2\sum f(x_i) + f(x_n)]$ y justificación geométrica (área de trapecios). Visualizador que dibuja los trapecios sombreados sobre la curva.
- **Módulo 3 – Regla del Punto Medio:** fórmula $M_n = \Delta x \sum f(\bar{x}_i)$, $\bar{x}_i = \frac{x_{i-1}+x_i}{2}$. Visualizador con los rectángulos de punto medio y los puntos medios marcados.
- **Módulo 4 – Regla de Simpson:** fórmula con coeficientes 1-4-2-4-…-4-1 y la **condición de $n$ par** (el slider solo acepta pares o muestra advertencia). Visualizador que dibuja las **parábolas ajustadas** en cada par de subintervalos. Incluir una comparación entre los métodos (Riemann, Trapecio, Punto Medio, Simpson) para la misma función.

## Entregable 3 — Módulos 5 y 6

- **Módulo 5 – Integral definida y área bajo la curva:** explicación del **Teorema Fundamental del Cálculo** $\int_a^b f(x)\,dx = F(b)-F(a)$, diferencia entre integral y área ($\int |f(x)|dx$), y área entre curvas $\int_a^b |f(x)-g(x)|dx$. Visualizador con **sliders para ajustar los límites $a$ y $b$**, área sombreada (distinguir en color regiones positivas y negativas), y un modo "área entre dos curvas" que calcule los puntos de corte. Mínimo 2 ejemplos paso a paso, **al menos uno de área entre curvas**.
- **Módulo 6 – Integración directa:** tabla de fórmulas básicas ($\int x^n dx = \frac{x^{n+1}}{n+1}+C$, $n\neq -1$; $\int \frac{dx}{x} = \ln|x|+C$; linealidad). Mínimo **3 ejemplos** paso a paso renderizados con KaTeX (con botón "Mostrar siguiente paso" para revelar el desarrollo progresivamente) y **gráficas interactivas que muestren $f(x)$ y su antiderivada $F(x)$** juntas, con un slider para la constante $C$.

## Regla importante sobre los ejemplos

**No uses como ejemplos resueltos los ejercicios del taller manual del parcial** (esa parte debo resolverla yo a mano y no se permite IA ahí). Usa ejemplos distintos pero del mismo estilo, por ejemplo: $\int_0^3 x^2 dx$, $\int_0^1 (x^3+1)dx$, $\int_1^4 \sqrt{x}\,dx$, $\int_0^{\pi/2}\sin x\,dx$, área entre $y=x$ y $y=x^2$, $\int (2x^3 - 5x + 7)dx$, $\int \left(\sqrt[3]{x} + \frac{2}{x^3}\right)dx$, etc. Verifica cada resultado numéricamente.

## Calidad del código

- `numerics.js` con funciones puras y documentadas con JSDoc (`riemannLeft`, `riemannRight`, `riemannMid`, `trapezoid`, `midpoint`, `simpson`), exportables tanto en navegador como en Node.
- `tests/numerics.test.js` que verifique los métodos contra valores exactos conocidos (ej. $\int_0^2 x^2dx = 8/3$, $\int_0^1 e^x dx = e-1$, $\int_0^\pi \sin x\,dx = 2$) y que Simpson sea exacto para polinomios de grado ≤ 3. Ejecútalo y asegúrate de que pase.
- Validación de entradas: función inválida, $a \ge b$, $n$ impar en Simpson, divisiones por cero → mensaje amigable en la interfaz, nunca un error en consola.
- Código comentado en español, nombres claros, sin librerías innecesarias.
- Accesibilidad básica: etiquetas en los controles, contraste suficiente, HTML semántico.

## USO_DE_IA.md

Crea este archivo documentando que la Parte II (software) se desarrolló con asistencia de IA (Qwen Code), qué partes generó la IA, qué revisé y ajusté yo, y qué prompts principales se usaron. Déjalo con secciones claras para que yo complete mis propias observaciones.

## Git y despliegue

1. `git init`, configura el repo local con `git config user.name "ivangonzalez-utp"` (pregúntame el correo antes de hacer el primer commit).
2. Haz commits pequeños y descriptivos en español por cada entregable (estructura base → módulos 1–4 → módulos 5–6 → README/USO_DE_IA).
3. Si tengo `gh` instalado y autenticado, crea el repo con `gh repo create ivangonzalez-utp/calculo-integral-utp --public --source=. --push`. Si no, dame los comandos exactos para crearlo y hacer push manualmente.
4. Activa GitHub Pages desde la rama `main`, carpeta raíz (`gh api` o instrucciones paso a paso en Settings → Pages).
5. Todas las rutas deben ser **relativas** para que funcionen bajo `/calculo-integral-utp/`.

## Verificación final (antes de decirme que terminaste)

- Sirve el sitio en local (`python -m http.server`) y revisa que las 14 páginas carguen, que la navegación funcione y que KaTeX renderice en todas.
- Comprueba en vista móvil (≈375 px) que no haya scroll horizontal y que las gráficas se adapten.
- Corre los tests de `numerics.js`.
- Entrégame un resumen con: enlace al repositorio, enlace a GitHub Pages y una lista de chequeo contra esta rúbrica:
  - Estructura base: 14 módulos, navegación funcional, responsive, README completo (5 %)
  - Módulos 1–4: visualizadores interactivos, ejemplos claros, fórmulas bien renderizadas (5 %)
  - Módulos 5–6: ejemplos claros, gráficas interactivas, código documentado (5 %)
- Finalmente, dame un guion corto (2–3 minutos) para la parte de **"Demostración de la plataforma"** y **"Explicación técnica"** de mi video de sustentación: decisiones de diseño, herramientas usadas, desafíos y cómo se conecta la Fase 1 con las fases 2 y 3.

Trabaja por entregables en orden y muéstrame avances al terminar cada uno.
```

</details>
