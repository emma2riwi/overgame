

> Cómo usarlo: pega todo este documento en Claude Design. Adjunta en el mismo mensaje los 3 archivos del logo:
> `og-mark.png` (monograma OG), `og-word.png` (palabra OVERGAME + lema) y `og-logo.png` (logo completo).


---

<rol>
Eres un diseñador de producto senior y un ingeniero front-end especializado en interfaces gamer inmersivas: estilo neón, oscuro, cinematográfico. Tu trabajo es reconstruir con fidelidad de píxel un producto que ya existe. No lo rediseñas ni lo "mejoras": lo replicas tal como está y le agregas solo lo que pide la sección <cambios_nuevos>.
</rol>

<objetivo>
Construye **Overgame**, un hub web para descubrir videojuegos, como prototipo navegable de alta fidelidad. Debe tener todas las pantallas, estados e interacciones que se describen aquí.
- Nombre: **Overgame**. Título de la pestaña en Inicio: `Overgame · Nexus Hub`.
- Slogan: **"Encuentra qué jugar según cómo te sientes, pruébalo gratis y no te pierdas ningún lanzamiento."**
- Idioma: español neutro (Colombia). Textos cortos y directos. Todos los textos visibles van **literalmente** como están entre comillas en este documento.
</objetivo>

<reglas_duras>
Si algo de este documento choca con tu criterio, gana el documento.
1. **Paleta cerrada de 4 colores.** Solo existen `#6045F4`, `#53E6D4`, `#EBEBED` y `#0F1417`, más sus transparencias `rgba()`. Está prohibido cualquier otro tono: ni blanco puro, ni negro puro (salvo el fondo del reproductor de video, que es `#000`), ni rojos, ni amarillos, ni grises inventados.
2. **Siempre oscuro.** No hay modo claro.
3. **Nada que "parezca hecho con IA".** Nada de etiquetas pequeñas genéricas encima de cada título, nada de texto de relleno, nada de emojis en la interfaz, nada de lorem ipsum. Donde haga falta una línea superior se usa `.meta-line`: 12 px, peso 600, mayúsculas, letter-spacing .06em, color menta.
4. **Inmersión en TODAS las vistas**, no solo en la primera: video de fondo, luces neón, títulos gigantes de contorno.
5. **Datos honestos.** El precio de Steam se marca "PRECIO REAL". Los precios de otras tiendas son de referencia y se marcan "REF.". Los datos de ejemplo se marcan "Ejemplo". Nunca se presenta como real algo inventado.
6. **Sin espacio muerto.** Ninguna columna queda vacía al hacer scroll. Ningún texto cruza un borde. Nunca hay scroll horizontal a 390 px.
7. **Accesible.** Foco visible (contorno menta de 2 px, separado 2 px). Áreas táctiles de al menos 44 px. Respeta `prefers-reduced-motion`: las duraciones bajan a 0,01 ms y se apagan los videos automáticos, los anillos, el parpadeo y la cuadrícula.
</reglas_duras>

---

## 1. SISTEMA DE DISEÑO (tokens exactos)

### 1.1 Color
```css
:root{
  --purple:#6045F4;  /* Royal Purple · color principal, ítem activo, pestañas */
  --mint:#53E6D4;    /* Neon Mint · botones, interactivos, cifras, acentos */
  --gray:#EBEBED;    /* Soft Gray · texto principal */
  --black:#0F1417;   /* Carbon Black · fondo */
  --text:var(--gray);
  --muted:rgba(235,235,237,.62);   /* texto secundario */
  --faint:rgba(235,235,237,.38);   /* texto terciario, etiquetas mono */
  --surface:rgba(235,235,237,.035);/* fondo de paneles */
  --surface-2:rgba(235,235,237,.06);
  --line:rgba(235,235,237,.09);    /* bordes */
  --line-2:rgba(235,235,237,.16);
  --purple-15:rgba(96,69,244,.15); --purple-30:rgba(96,69,244,.3);
  --mint-12:rgba(83,230,212,.12);  --mint-25:rgba(83,230,212,.25);
  --glow-mint:0 0 0 1px rgba(83,230,212,.35),0 0 24px rgba(83,230,212,.28);
  --glow-purple:0 0 0 1px rgba(96,69,244,.5),0 0 32px rgba(96,69,244,.35);
  --r-sm:8px; --r:14px; --r-lg:20px;
  --rail:78px;
  --ease:cubic-bezier(.22,1,.36,1);
  --ease-out-expo:cubic-bezier(.16,1,.3,1); /* se usa en casi todas las transiciones largas */
}
```
- La selección de texto va morada con texto gris.
- Barra de scroll de la página: pulgar `rgba(96,69,244,.6)` con radio de 10 px, riel negro, 10 px de ancho.
- El cursor de los inputs es menta.

### 1.2 Tipografía (Google Fonts)
- **Outfit** (400, 500, 600, 700, 800) para todo el texto. Base: 15 px, interlineado 1,5, suavizado de fuente activado.
- **JetBrains Mono** (500, 700) para cifras, etiquetas, tags, contadores, teclas y fechas.
- Títulos h1, h2 y h3: peso 700, letter-spacing −.02em, interlineado 1,08, `text-wrap: balance`.
- `.page-title`: `clamp(30px,4vw,46px)`, peso 800. Dentro de un escenario (stage) sube a `clamp(38px,5.4vw,72px)`, con letter-spacing −.04em e interlineado .96.
- La palabra destacada de cada título va en `<em>`: sin cursiva, color menta y brillo neón en 3 capas (`0 0 10px rgba(83,230,212,.75), 0 0 32px rgba(83,230,212,.5), 0 0 80px rgba(83,230,212,.3)`). Además tiene un parpadeo de letrero (`flicker`, 7 s, infinito): la opacidad baja a .55 al 20 % y al 22 % del ciclo.
- `.lede`: 16 px, color `--muted`, máximo 62ch.
- Títulos de sección (`.sec-head h2`): `clamp(22px,2.4vw,28px)`. El subtítulo va en 14 px, color muted. El enlace "Ver …" va a la derecha.

### 1.3 Componentes base
- **Botón** (`.btn`): 46 px de alto, padding 0 20px, radio 12 px, peso 700, 14,5 px. Al presionarlo se encoge a `scale(.97)`.
  - `.btn-mint`: fondo menta, texto negro y brillo `0 0 0 1px mint, 0 0 22px rgba(83,230,212,.55), 0 0 60px rgba(83,230,212,.25)`. En hover el brillo sube (30 px a .85 y 90 px a .4).
  - `.btn-purple`: fondo morado, texto gris y brillo morado equivalente.
  - `.btn-ghost`: fondo `--surface-2`, borde `--line-2` y texto gris. En hover el borde y el texto pasan a menta. El estado `.on` agrega fondo `--mint-12`.
  - **Destello:** los botones menta y morado llevan un reflejo diagonal (40 % de ancho, degradado transparente → `rgba(235,235,237,.55)` → transparente, inclinado −20°) que cruza el botón en .7 s al pasar el mouse.
  - `.btn-sm`: 36 px de alto, 13 px de texto, radio 10.
- **Tag** (`.tag`): JetBrains Mono 700, 10,5 px, mayúsculas, padding 4×8, radio 6, fondo `rgba(15,20,23,.82)` con desenfoque de 6 px.
  - Variantes: `.mint` (fondo menta, texto negro, brillo menta), `.purple` (fondo morado, brillo morado) y `.outline-mint` (texto menta, borde mint-25).
- **Chip**: mono 600, 11 px, padding 4×8, fondo surface-2.
- **Panel** (`.panel`): fondo surface, borde `--line`, radio 20. Tiene un **brillo que sigue al cursor**: un `radial-gradient` de 500 px en la posición del mouse, color `rgba(96,69,244,.1)`.
  - Las tarjetas de juego, los ítems de la línea de tiempo y los resultados usan el mismo brillo, pero de 380 px y en menta `rgba(83,230,212,.09)`.
- **Teclas** (`kbd`): mono 600, 11 px, padding 2×7, radio 6, borde line-2, color faint.
- **Toast:** centrado abajo (a 28 px del borde), fondo gris, texto negro, peso 600, radio 12. Entra subiendo 20 px y se va sola a los 2,2 s.
- **Íconos:** SVG de trazo con `stroke-width 1.8`, esquinas redondeadas, 18 px y `currentColor`.
  - Set: menu, grid, compass, pulse, filter, play, cal, heart, search, pc, pad (control), switch, phone, bolt, leaf, book, timer, arrow, back, x, bell, cloud, store, user, users, split, globe, check, ext, volume, mute, gift, admin (escudo con +) y edit.

### 1.4 Capas de fondo globales (siempre activas)
1. **Viñeta de color** en `body::before`: `radial-gradient(900px 500px at 85% -10%, rgba(96,69,244,.16), transparent 60%)` + `radial-gradient(700px 400px at 10% 110%, rgba(83,230,212,.07), transparent 60%)`.
2. **Luz ambiental:** la portada del juego que se está mirando, a pantalla completa y desenfocada.
   - Ocupa `inset:-12%` con `blur(80px) saturate(1.5)` y opacidad .3, más una viñeta radial negra encima.
   - Cambia con un fundido cruzado de 1,6 s cada vez que el mouse se queda 220 ms sobre una tarjeta.
3. **Piso synthwave:** una cuadrícula morada de 64 px en perspectiva.
   - `perspective(420px) rotateX(64deg)`, fija abajo, con 60vh de alto (40vh en celular).
   - Una máscara la desvanece hacia arriba. Opacidad .32.
   - Avanza sin parar: 2,4 s lineal, infinito.

### 1.5 Movimiento (curvas y tiempos exactos)
- **Cambio de página:** la vista sale en 200 ms (opacidad 0 y `translateY(-10px)`). Luego cada bloque hijo entra con `rise`: de opacidad 0, `translateY(22px) scale(.985) blur(4px)` a normal, en .8 s con `--ease-out-expo`. Los bloques entran escalonados 0, 80, 160, 240 y 300 ms.
- **Aparición al hacer scroll:** las tarjetas, minis, ítems de la línea de tiempo, paneles de estrategia, estadísticas y cartuchos aparecen con `rise` (.75 s) al entrar en pantalla. Se escalonan de a 70 ms por columna (índice mod 4).
- **Anillo de luz giratorio** sobre el hero, cada escenario, el arcade, el resultado n.º 1 y la vista flotante abierta:
  - Es un borde de 1,5 px hecho con `conic-gradient(from var(--ang), transparent 0 55%, purple 70%, mint 82%, gray 85%, transparent 92%)` y enmascarado para que solo se vea el contorno.
  - Gira 360° en 5 s, lineal, infinito (usa `@property --ang`).

---

## 2. ESTRUCTURA GENERAL (layout)

- Es una aplicación de una sola página con rutas por hash: `#/panel`, `#/inicio`, `#/mood`, `#/explorar`, `#/demos`, `#/calendario`, `#/biblioteca` y `#/admin`. Si el hash no existe, abre `#/inicio`.
- Cada ruta cambia el título de la pestaña: "Mi panel · Overgame", "Overgame · Nexus Hub", "Game Mood Finder · Overgame", "Explorar · Overgame", "Centro de Demos · Overgame", "Calendario & Preventas · Overgame", "Biblioteca · Overgame" y "Admin · Overgame".
- **Escritorio (más de 860 px):** riel lateral fijo de 78 px a la izquierda. El contenido lleva `padding-left: 78px`.
- **Barra superior** (sticky arriba, z 30):
  - Padding 14×32, fondo `rgba(15,20,23,.82)` con desenfoque de 14 px y borde inferior line. Sombra `0 1px 0 rgba(96,69,244,.25), 0 10px 40px rgba(15,20,23,.6)`.
  - **Buscador:** 42 px de alto, hasta 560 px de ancho, radio 12, fondo surface-2. Lleva ícono de lupa, el texto de ayuda "Buscar juegos, demos, géneros…" y la tecla `/` a la derecha.
    - Al enfocarlo: borde menta y brillo `0 0 0 1px mint, 0 0 26px rgba(83,230,212,.4), 0 0 60px rgba(96,69,244,.25)`.
    - La tecla `/` lo enfoca. Al escribir, a los 160 ms salta a Explorar y filtra.
  - **A la derecha:** botón de 42 px con corazón que lleva a Biblioteca. Tiene un punto menta de 8 px con brillo cuando hay favoritos o alertas.
- **Contenido (`#view`):** padding 28×32×64, columna con 44 px entre bloques.

---

## 3. MENÚ LATERAL (detalle crítico)

### 3.1 Cerrado (por defecto): riel de 78 px
- Fijo a la izquierda en toda la altura, z 70, padding 14×16.
- **Fondo sólido degradado:** `linear-gradient(180deg, #0F1417 0%, #0F1417 30%, rgba(96,69,244,.16) 62%, rgba(96,69,244,.42) 100%)` sobre `#0F1417`. Borde derecho de 1 px en `rgba(83,230,212,.22)`.
- **Cabecera fija (de arriba hacia abajo):**
  - Botón de menú de 46×42, radio 12, borde `rgba(83,230,212,.25)` e ícono menú en menta. Su hover tiene fondo mint-12.
  - Debajo, el monograma del logo (`og-mark.png`) a 46 px de ancho, con sombra `drop-shadow(0 0 10px rgba(96,69,244,.45))`.
- **Cuerpo con scroll propio**, sin barra visible.
  - El borde superior y el inferior se desvanecen con una máscara (10 px arriba y 18 px abajo).
  - Lleva solo íconos de 22 px en menta con `drop-shadow(0 0 5px rgba(83,230,212,.7))`.
  - Los títulos de sección se convierten en una **rayita centrada** de 24 px de ancho en `rgba(83,230,212,.35)`, con 10 px de margen vertical. Así la división entre grupos se nota igual.
- **Pie fijo:**
  - Línea divisoria arriba (`rgba(83,230,212,.2)`) y separación de 8 px entre botones.
  - "Admin": 46 px de ancho, borde **discontinuo** `rgba(83,230,212,.3)` e ícono de escudo.
  - "Menú principal": 46 px de ancho, borde line e ícono grid.
- **Globo de ayuda** (solo escritorio y con el menú cerrado):
  - Aparece al pasar el cursor por un ícono, o al llegar con Tab.
  - Va fijo a `left: 78px + 12px` y centrado en la vertical del ícono.
  - Estilo: fondo `rgba(15,20,23,.94)`, borde `rgba(83,230,212,.45)`, radio 12, padding 10×14 y ancho máximo 260. Sombra `0 10px 30px rgba(15,20,23,.6), 0 0 22px rgba(96,69,244,.3)`. Lleva una **flechita** de 10 px girada 45° a la izquierda, con el mismo borde.
  - Animación: entra desde −6 px con opacidad .18 s y movimiento .25 s.
  - Contenido: el nombre en 14 px gris y debajo una línea en 12,5 px muted. Textos exactos:
    - Mi panel · "Tu nivel, desafíos, logros y lo que dejaste a medias"
    - Inicio / Descubrir · "Lo destacado, lo que sale esta semana y las ofertas"
    - Game Mood Finder · "Cuatro preguntas y tres juegos para cómo te sientes"
    - Explorar catálogo · "Todo el catálogo con filtros por dispositivo, género y modo"
    - Centro de Demos · "Juega en el navegador o baja la demo oficial gratis"
    - Calendario & Preventas · "Fechas de salida, cuenta regresiva y precios por tienda"
    - Biblioteca / Favoritos · "Tus favoritos y alertas de precio"
    - Admin · "Agrega juegos con su tráiler y links de tiendas (requiere iniciar sesión)"
    - Menú principal · "Pantalla de bienvenida con todas las secciones (tecla M)"
    - Abrir menú · "Muestra los nombres de cada sección"
    - Overgame (logo) · "Volver al menú principal"

### 3.2 Abierto: 300 px, se abre SOLO con el botón de menú
- **En escritorio queda integrado:** el ancho pasa de 78 a 300 px y el contenido se corre igual (`padding-left` 78 → 300). Las dos cosas se mueven juntas en .5 s con `--ease-out-expo`.
  - **No** tapa la página y **no** la oscurece.
  - Se queda abierto mientras navegas. Se cierra con el mismo botón o con Esc.
- **Forma estilo GameHub** (SVG de fondo, viewBox `0 0 300 1000`, `preserveAspectRatio="none"`, aparece en .45 s):
  - Relleno: la forma `M0 0H300L292 640L252 800L236 1000H0Z` en 3 capas.
    - (a) `#0F1417` con opacidad .72.
    - (b) Degradado vertical morado con opacidad 0 → .04 (22 %) → .12 (45 %) → .24 (68 %) → .38 (86 %) → .5 (100 %).
    - (c) Brillo radial morado desde la esquina inferior izquierda (.45 → .12 → 0).
  - **Borde neón menta:** `M300 0L292 640L252 800L236 1000`, trazo de 2,5 px con `drop-shadow(0 0 4px rgba(83,230,212,.6))` y opacidad .85. Es casi recto arriba y a partir de dos tercios se mete hacia la izquierda en dos tramos.
  - **Segunda línea morada paralela por fuera:** `M296 700L266 830L254 1000`, trazo de 3 px y opacidad .6.
  - **Importante:** las capas de relleno no llevan contorno. Si la regla global de íconos (`svg{stroke:currentColor}`) les pone uno, aparece una línea blanca arriba y a la izquierda.
- **Que nada cruce la diagonal:** abajo el borde llega a x=236. Todo el contenido del panel abierto mide **como máximo 212 px** de ancho (16 de padding + 212 = 228 < 236).
- **Cabecera:** el botón de menú y el logo completo. El monograma va a 42 px y la palabra (`og-word.png`) a 150 px. Si la pantalla es baja, solo el cuerpo hace scroll: nada queda pegado ni escondido detrás del pie.
- **Secciones con título y línea:**
  - El título va en JetBrains Mono 700, 10,5 px, letter-spacing .14em, mayúsculas, color `rgba(83,230,212,.75)`.
  - A su derecha va una línea de 1 px que se desvanece: `linear-gradient(90deg, rgba(83,230,212,.4), rgba(96,69,244,.25) 60%, transparent)`.
  - **DESCUBRIR:** Mi panel (grid) · Inicio / Descubrir (compass) · Game Mood Finder (pulse) · Explorar catálogo (filter).
  - **JUGAR Y COMPRAR:** Centro de Demos (play) + etiqueta `LIVE` (mono 9 px, fondo mint-12, texto menta) · Calendario & Preventas (cal).
  - **TU COLECCIÓN:** Biblioteca / Favoritos (heart) + contador redondo menta con texto negro (mono 11 px). Solo aparece si hay favoritos.
  - **PLATAFORMAS:** cuadrícula de 2 columnas con PC, PS5, Xbox X|S y Switch, y "Móvil (iOS / Android)" a lo ancho.
    - Cada botón: 9×10 de padding, radio 9, borde line y 12,5 px. En hover el borde y el texto pasan a menta.
    - Cada uno lleva a Explorar con esa plataforma ya filtrada.
- **Ítems:** 14 px, padding 11×12 (11×10 a la derecha) y radio 10. El texto va en `rgba(235,235,237,.86)` y el ícono en menta. En hover el ícono se corre 2 px a la derecha.
- **Ítem activo:** una **píldora deslizante** (`.nav-ind`) que viaja entre opciones en .55 s con `--ease-out-expo`.
  - Fondo `linear-gradient(90deg, rgba(96,69,244,.55), rgba(96,69,244,.18))` y sombra `inset 0 0 0 1px rgba(96,69,244,.8), 0 0 26px rgba(96,69,244,.55), 0 0 60px rgba(96,69,244,.2)`.
  - Lleva una **barra menta de 3 px** pegada al borde izquierdo de la pantalla (16 px por fuera), que va del 22 % al 78 % de la altura y tiene brillo menta.
  - Al abrir o cerrar el menú, la píldora se recoloca.
- **Pie (212 px):** "Admin · Agregar juegos" (borde discontinuo; si está activo, borde sólido menta con brillo) y "Menú principal" + `kbd M`.
- **Animación de los textos:** al abrir aparecen con opacidad .35 s y un retraso de .15 s. Al cerrar se ocultan en .2 s.
- **Pantallas bajas (≤ 640 px de alto):** los ítems reducen el padding vertical a 8 px.

### 3.3 Celular (≤ 860 px)
- **No hay riel.** En la barra superior aparecen el botón de menú (42 px) y el logo (monograma de 44 px + palabra de 120 px). Por debajo de 480 px se ve solo el monograma de 22 px.
- **Cajón de 300 px** con la misma forma diagonal. Entra desde la izquierda (`translateX(-100%)` → 0 en .5 s) por encima de un velo `rgba(15,20,23,.6)`. Se cierra al tocar el velo o al elegir una opción.
- **Barra de pestañas fija abajo:**
  - Fondo `rgba(15,20,23,.92)` con desenfoque de 16 px, borde superior line y safe-area.
  - 5 pestañas: Inicio (compass), Mood (pulse), Panel (grid), Demos (play) y Agenda (cal).
  - Cada una: ícono de 21 px y texto de 11 px peso 600, color faint.
  - Activa: color menta, el ícono con `drop-shadow(0 0 6px rgba(83,230,212,.7))` y el texto con brillo menta.

---

## 4. MENÚ DE BIENVENIDA (pantalla completa, primer contacto)
Se muestra al abrir la app (en Inicio o sin hash) y cada vez que se pulsa la tecla **M**, se toca el logo o se elige "Menú principal".

- **Estructura:** fondo negro y cuadrícula de 2 columnas, `1fr minmax(260px,340px)`, con 3 filas: arriba, centro y pie. Padding `28px clamp(20px,4vw,56px)`.
- **Fondo:**
  - Video del juego de la opción activa, con 2 capas que se cruzan.
  - Primero se ve la imagen `library_hero.jpg` de Steam, con un zoom lento de `scale(1.08)` a 1 en 6 s y aparición de 1,1 s. Luego entra el video a opacidad .85.
- **Velo:**
  - `linear-gradient(90deg, #0F1417 0%, rgba(15,20,23,.96) 22%, rgba(15,20,23,.82) 38%, rgba(15,20,23,.45) 50%, rgba(15,20,23,.08) 62%, transparent 72%)`.
  - Más un degradado negro desde abajo (30 %), otro desde arriba (22 %) y un brillo morado radial en la esquina inferior izquierda.
  - Encima, líneas de escaneo horizontales (1 px cada 3 px) al 18 %.
- **Arriba:**
  - El logo proporcional: monograma `clamp(56px,5.2vw,74px)` + palabra `clamp(150px,14vw,200px)`, separados 14 px y centrados en vertical. El monograma nunca se ve más grande que la palabra.
  - A la derecha, el botón "Entrar →": 42 px, borde line-2, fondo `rgba(15,20,23,.5)` con desenfoque. En hover pasa a menta.
- **Slogan:** "Encuentra qué jugar **según cómo te sientes.**"
  - `clamp(20px,2.2vw,28px)`, peso 500, color muted. La parte en negrita va en gris.
- **Las 7 opciones**, numeradas por orden:
  1. "MI PANEL" · "Tu nivel, desafíos, logros y lo que dejaste a medias." (fondo: Hades)
  2. "DESCUBRIR" · "Lo destacado, lo que sale esta semana y las ofertas de hoy." (Clair Obscur: Expedition 33)
  3. "MOOD FINDER" · "Cuatro preguntas y tres juegos para cómo te sientes hoy." (Hades II)
  4. "EXPLORAR" · "Todo el catálogo, con filtros por dispositivo, género y modo." (ELDEN RING)
  5. "DEMOS" · "Juega en el navegador o baja la demo oficial gratis." (Tiny Glade)
  6. "CALENDARIO" · "Fechas de salida, cuenta regresiva y preventas." (juego destacado de noviembre)
  7. "BIBLIOTECA" · "Tus favoritos y alertas de precio." (Ghostrunner 2)
  - **Títulos:** Outfit 800, mayúsculas, letter-spacing −.035em, **siempre en una sola línea**.
    - Tamaño `clamp(26px, min(4.4vw, 6vh), 64px)`, para que las 7 quepan entre 620 px de alto y 4K.
    - Sin relleno: solo contorno `-webkit-text-stroke: 1.2px rgba(235,235,237,.32)`.
    - Separación entre opciones: `clamp(4px,1.1vh,12px)`.
  - **Hover / opción activa:**
    - El título se rellena de gris, se corre 10 px a la derecha y gana brillo morado (`0 0 40px rgba(96,69,244,.55)`).
    - Una **barra menta vertical de 4 px** con brillo (`0 0 18px mint, 0 0 40px rgba(83,230,212,.5)`) se desliza en .6 s hasta él y toma exactamente su altura.
    - La **descripción aparece AL LADO del título** (15 px muted, máx. 30ch) con una línea menta a su izquierda (`rgba(83,230,212,.45)`). Entra desde −10 px. No empuja ni se cruza con los otros títulos.
    - Solo con hover, el contorno sube a .7.
- **Tarjeta "En pantalla"** (abajo a la derecha):
  - Fondo `rgba(15,20,23,.6)` con desenfoque de 14 px, radio 16 y borde line-2.
  - Contenido: la portada, "EN PANTALLA" (mono 10 px menta), el nombre del juego (17 px) y sus géneros.
  - Al cambiar de opción, la tarjeta hace una animación corta de entrada.
- **Pie:** línea arriba y a la izquierda "**57** juegos · **8** demos gratis · **13** salidas este mes" (cifras en menta, se calculan del catálogo). A la derecha: `↑` `↓` "navegar" · `Enter` "entrar".
- **Entrada:** escalonada, 70 ms por elemento más 150 ms de base, cada uno subiendo 18 px.
- **Salida:** al elegir, los elementos se van 30 px a la izquierda, el fondo hace zoom a 1,06 y todo se desvanece en .7 s.
- **Teclado:** ↑ y ↓ recorren las opciones en ciclo, Enter entra y Esc entra en la opción activa.
- **Celular:**
  - Una sola columna, sin la tarjeta y sin la guía de teclas.
  - El velo va de abajo hacia arriba: `linear-gradient(0deg, rgba(15,20,23,.97) 30%, rgba(15,20,23,.7) 65%, rgba(15,20,23,.85) 100%)`.
  - El menú se pega abajo. Títulos de `clamp(24px, min(8.6vw,5.4vh), 44px)` y la descripción debajo del título.

---

## 5. TARJETA DE JUEGO Y VISTA FLOTANTE (regla clave)

### 5.1 Tarjeta (`.card`)
- **Cuadrícula:** `repeat(auto-fill, minmax(232px,1fr))` con 18 px entre tarjetas. En celular son 2 columnas con 12 px.
- **Imagen:** proporción **460/215** (la del header de Steam). En hover hace un zoom lento a 1,035 en 1,1 s.
- **Insignias arriba a la izquierda:**
  - fecha corta (morada) si aún no sale
  - "DEMO" (menta)
  - "FREE" (menta)
  - "-X%" (contorno menta) si tiene descuento
  - "PREVENTA -X%"
- **Cuerpo** (padding 13×14):
  - Géneros (mono 10,5 px, mayúsculas, faint) y `★ 93` en menta a la derecha.
  - Nombre en 16,5 px.
  - Plataformas en chips mono de 9,5 px: PC, PS5, XSX, Switch, Móvil.
  - Precio en 18 px peso 700. Si tiene descuento, el precio base va tachado y al lado una pastilla menta "-20%". Si es gratis, "Gratis" va en menta.
- **Hover:** borde `rgba(83,230,212,.55)` y sombra `0 0 0 1px rgba(83,230,212,.25), 0 0 28px rgba(83,230,212,.22), 0 0 60px rgba(96,69,244,.25)`.

### 5.2 Vista flotante (peek con FLIP)
Solo en dispositivos con mouse.
- **Apertura:** tras 320 ms de hover se crea un panel fijo de ancho `min(max(ancho_tarjeta×1,5, 360px), ancho_pantalla−24)`, centrado sobre la tarjeta y siempre dentro de la pantalla (mínimo 76 px desde arriba).
- **FLIP:**
  - El panel arranca con `transform: translate(Δx,Δy) scale(ancho_tarjeta/ancho_panel)` para coincidir exactamente con la tarjeta.
  - Crece hasta `none` en .62 s `cubic-bezier(.16,1,.3,1)`.
  - Su sombra pasa a `0 34px 90px rgba(0,0,0,.65), 0 0 46px rgba(83,230,212,.14), 0 0 0 1px rgba(96,69,244,.28)` y lleva el anillo giratorio.
- **Media:**
  - La portada y, encima, el **microtráiler en silencio y en bucle**. Empieza a cargar a los 180 ms y entra con fundido de .7 s.
  - Insignia "▶ VISTA PREVIA" (menta).
  - Barra de progreso de 3 px menta con brillo, abajo, que avanza con el video.
- **Pliegue:** se despliega con `grid-template-rows 0fr → 1fr` en .6 s.
  - Géneros y ★, nombre en 19 px, descripción en 13 px cortada a 3 líneas.
  - Chips de exigencia y modos, y las plataformas.
  - Botones "▶ Probar demo" (menta, solo si hay demo), "Ver ficha →" (ghost, o menta si no hay demo) y un corazón de 36 px.
- **Cierre:** al salir el mouse (90 ms de gracia), vuelve a la geometría actual de la tarjeta con la misma técnica en .4 s, sin parpadeos ni zonas negras. También se cierra al hacer scroll.
- **Celular:** no hay vista flotante. El toque abre la ficha.

### 5.3 Ficha del juego (modal)
- **Velo:** `rgba(15,20,23,.78)` con desenfoque de 8 px.
- **Panel:** `min(920px,100%)`, radio 22, fondo negro y borde line-2. Sombra `0 40px 120px rgba(0,0,0,.7), 0 0 60px rgba(96,69,244,.2)`. Entra con la animación `pop`.
- **Cerrar:** botón de 42 px arriba a la derecha.
- **Tráiler 16:9 con controles y con sonido** (arranca en silencio). Es el mp4 completo o HLS.
- **Cuerpo en 2 columnas (1,2fr / 1fr):**
  - **Izquierda:**
    - Tags.
    - Nombre en 30 px peso 800.
    - Descripción.
    - Lista de datos: Estudio, Salida (con "faltan N días"), Plataformas en nombre largo, Modo, Exigencia y Metacritic `N/100`.
  - **Derecha:**
    - "COMPARATIVA DE TIENDAS" (meta-line) y la tabla de tiendas.
    - Nota: "Steam: precio real (8 nov 2026). “REF.”: precio de referencia del prototipo, sin conexión a esa tienda."
    - Botón principal menta: "Descargar demo gratis en Steam" si hay demo. Si no, "Comprar en {tienda más barata} · US$X" (o "Reservar" si aún no sale).
    - "♡ Favorito" y "🔔 Alerta" (ghost, `.on` cuando están activos).
- **Tabla de tiendas:** cada fila tiene el nombre, debajo una etiqueta mono de 9,5 px ("PRECIO REAL" o "REF.") y una pastilla menta ("MEJOR PRECIO" o "-X%"). A la derecha, el precio con el base tachado y un ícono de enlace externo. La fila con el mejor precio va con fondo mint-12.
- **Accesibilidad y celular:** el foco queda atrapado dentro del modal y Esc lo cierra. En celular el modal sale desde abajo, con radio 22 solo arriba y 94dvh de alto máximo.

---

## 6. VISTAS
Todas, menos Inicio, Admin y el Mood Finder, abren con un **ESCENARIO** (`.stage`):
- Radio 24, mínimo 330 px de alto, borde `rgba(96,69,244,.35)` y sombra `0 0 50px rgba(96,69,244,.22), 0 0 120px rgba(83,230,212,.06)`. Lleva el anillo giratorio.
- **Fondo:**
  - `library_hero.jpg` del juego con zoom Ken Burns (1,14 → 1,02 en 26 s). Encima entra su video a opacidad .9 en 1,3 s.
  - Velo `linear-gradient(90deg, rgba(15,20,23,.96) 0%, rgba(15,20,23,.72) 42%, rgba(15,20,23,.12) 100%)`, un degradado desde abajo y líneas de escaneo al 3,5 %.
- **Palabra gigante de contorno** abajo a la derecha:
  - `clamp(96px,16vw,240px)`, peso 800, mayúsculas.
  - `-webkit-text-stroke: 1.5px rgba(83,230,212,.22)` con brillo menta tenue.
- **Cuerpo:** padding 44×40×34, máx. 780 px. Lleva un título con una palabra en `<em>` y el lede.
- **Celular:** 300 px de alto, el velo va de abajo hacia arriba y la palabra mide 30vw y se pone arriba a la derecha.

### 6.1 Inicio / Descubrir (`#/inicio`)
1. **Hero** (radio 24, mínimo 440 px, anillo giratorio y brillo morado):
   - **Fondo:** `library_hero` del juego destacado (Clair Obscur: Expedition 33) y su tráiler en silencio.
   - **Tags:** "RPG" y "METACRITIC 91" (morado).
   - **Título:** `clamp(36px,5.6vw,68px)`, peso 800, letter-spacing −.035em, interlineado .95. La parte antes de ":" va en gris; la parte después, en una segunda línea, en menta neón ("Clair Obscur" / "Expedition 33").
   - **Descripción** y los botones "Lanzar Mood Finder" (menta, ícono pulse) y "Ver tráiler y precios" (ghost, ícono play).
   - **Botón de sonido** de 42 px abajo a la derecha (mute ↔ volume).
2. **Cuadrícula en 2 columnas:** principal + lateral de 300 px (la lateral es sticky a 90 px).
   - **"¿Cómo quieres sentirte hoy?"** · "Elige y te llevamos directo al paso 2 del Mood Finder."
     - 4 tarjetas de ánimo.
     - Cada una lleva el ícono en un cuadro de 44 px morado con brillo y el contador "N juegos" (mono) arriba a la derecha.
     - Debajo van el título, la descripción y "Sintonizar →". Un halo morado aparece abajo a la derecha.
     - Ánimos:
       - Busco adrenalina · "Acción rápida, shooters y roguelikes que no perdonan."
       - Quiero relajarme · "Cozy, puzzles y simulación sin estrés ni cronómetro."
       - Quiero una gran historia · "RPG narrativos y aventuras para perderse horas."
       - Tengo 20 minutos libres · "Partidas cortas, arcade y móvil: entra y sal."
   - **"Lanzamientos de esta semana"** · "Lo que sale (o acaba de salir) en Steam alrededor de hoy." · "Ver calendario →".
     - Filas mini con imagen de 112 px, "En N días · 14 NOV" (o "Sale hoy" o "Ya disponible"), nombre, géneros y "Demo gratis" en menta.
   - **"Imprescindibles del catálogo"** · "Mejor valorados por la crítica. Pasa el mouse sobre una tarjeta para ver el tráiler." · 8 tarjetas.
   - **"Descuentos de hoy en Steam"** · "Free & Demos →" · 8 tarjetas con el mayor descuento.
   - **Lateral:**
     - **Tarjeta "Ofertas de la semana":**
       - Borde morado de 2 px y fondo `linear-gradient(150deg, rgba(96,69,244,.45), rgba(15,20,23,.9) 70%)`.
       - Ícono de regalo morado, "Hasta" en menta y "-66%" gigante (64 px, peso 900, menta neón).
       - "14 juegos con descuento en Steam hoy".
       - Un control (gamepad) de contorno menta de 140 px, girado −14° y asomado por la esquina.
     - **"Amigos en línea (3)"** con el tag "EJEMPLO" y una línea menta de 2 px debajo del título.
       - NovaX "Jugando a Hades II", Kairo "En partida de Baldur's Gate 3" y Lunara "Explorando Tiny Glade".
       - Cada avatar es un círculo de 44 px con la inicial en menta, borde morado y un punto verde menta de estado.
       - "Invitar amigos →" muestra: "Pronto podrás conectar tu cuenta de Steam o Discord para ver a tu escuadrón real."
   - Por debajo de 1180 px el lateral baja y queda en 2 columnas; en celular, en 1.

### 6.2 Game Mood Finder (`#/mood`)
- **Escenario-cabecera:** la palabra gigante es "MOOD" y el fondo cambia según el ánimo elegido: adrenalina = DOOM Eternal, relax = Tiny Glade, historia = Cyberpunk 2077, rápido = Balatro (o un arcade).
  - Título: "Sintonizador de experiencias: *paso N de 4*".
  - Lede: "Cuatro preguntas rápidas y te damos tres juegos que puedes empezar hoy."
  - **Barra de pasos:** 4 casillas de 36 px (01–04) unidas por líneas de 26 px, con las etiquetas ÁNIMO, CONTEXTO, DESAFÍO y RESULTADO.
    - La casilla activa va menta con brillo. Las completadas llevan ✓ con borde menta y la línea anterior también en menta.
- **Pasos 1 a 3:** columna principal + lateral "ASÍ VA TU BÚSQUEDA" de 330 px, sticky.
  - El lateral muestra el mejor candidato en vivo (imagen, "N% afinidad" y nombre) con un medidor de degradado morado→menta y un resumen con líneas punteadas: Ánimo, Plataforma, Compañía y Desafío.
  - Debajo: "**N** juegos compatibles con tu plataforma" y "Saltar y ver recomendaciones →".
  - **Paso 1:** "¿Qué te pide el cuerpo ahora?". Las 4 tarjetas de ánimo; la elegida lleva un check menta. Al elegir, avanza solo a los 260 ms.
  - **Paso 2:**
    - "¿Dónde vas a jugar ahora mismo?": PC "Windows, Mac o Linux" · Consola "PS5, Xbox Series o Switch" · Móvil "iOS o Android".
    - "¿Con quién?": Solo "Yo y el juego" · Amigos en línea "Cooperativo o competitivo" · Pantalla dividida "En el mismo sofá".
    - Avanza solo cuando están las dos respuestas.
  - **Paso 3:** "¿Cuánto reto quieres?"
    - Ligero "Controles sencillos, ideal para desconectar." · Desafío medio "Requiere atención y estrategia básica." · Hardcore / Retador "Mecánicas complejas, alta dificultad o competitivo."
    - Cada opción lleva un medidor de 3 barritas. El botón dice "Ver mis 3 juegos →".
  - **Navegación:** "← Atrás" (ghost) y "Continuar →" (menta; queda al 45 % de opacidad y desactivado hasta que se responde).
- **Paso 4 · "Tus 3 juegos para hoy":** el subtítulo resume las 4 respuestas y hay botones "← Ajustar" y "Empezar de nuevo". Van 3 resultados en columnas (2 en tablet, 1 en celular). Cada uno lleva:
  - Media 16:9 con el tráiler en bucle.
  - El n.º 1 lleva la insignia "MEJOR MATCH", borde menta y el anillo giratorio.
  - Insignia de afinidad abajo a la derecha: "99%" en 24 px peso 800, menta neón, y "AFINIDAD" en mono.
  - Géneros y ★, nombre en 21 px.
  - "Porque encaja con **busco adrenalina**, se juega **solo**, nivel **desafío medio**, justo lo que pediste."
  - 3 filas de tiendas, "▶ Demo gratis" (o "Ver ficha →") y un corazón.
  - Nota: "La afinidad pondera ánimo (40%), compañía (25%), desafío (25%) y valoración/demo/oferta (10%)."
- **Cálculo de afinidad:**
  - Ánimo: 40 si es el primer ánimo del juego, 28 si es secundario.
  - Compañía: 25 si encaja, 4 si no.
  - Exigencia: `25 − 11×|diferencia|`.
  - Bono: `(Metacritic − 75)/2`, +2 si tiene demo y +2 si tiene oferta.
  - Se normaliza sobre el puntaje máximo posible, con tope de 99 %.

### 6.3 Explorar catálogo (`#/explorar`)
- **Escenario:** palabra "EXPLORAR", fondo ELDEN RING, título "Explora el *catálogo*" y lede "Combina dispositivo, género y modo de juego. Pasa el mouse sobre una tarjeta para ver el tráiler."
- **Panel de filtros** con 3 filas: etiqueta mono de 96 px de ancho y chips de 34 px de alto.
  - DISPOSITIVO: PC, PS5, XSX, Switch, Móvil.
  - GÉNERO: todos los del catálogo, en orden alfabético.
  - MODO: Un jugador, Cooperativo online, Competitivo online, Pantalla dividida.
  - El chip activo va con fondo menta, texto negro y brillo.
  - En celular cada fila es un carrusel horizontal sin barra.
- **Barra de resultados:** "**N** juegos para “búsqueda”", "Limpiar filtros" y el orden: Mejor valorados / Precio: menor a mayor / Mayor descuento / Más recientes.
- La cuadrícula se actualiza al instante.
- **Vacío:** "Nada con esa combinación" · "Quita algún filtro o prueba otra búsqueda."

### 6.4 Centro de Demos (`#/demos`)
- **Escenario:** palabra "DEMOS", fondo Hades. Título "Pruébalo *gratis* antes de comprar" y lede "Tres formas de probar: jugar en el navegador, bajar la demo oficial de la tienda o (próximamente) en la nube."
- **Arcade** (columnas 1,5fr / 1fr):
  - **Lienzo:**
    - Canvas 16:10 de 960×600, borde purple-30, anillo giratorio y brillo morado.
    - Marcador arriba: "PUNTOS **0**" · el estado del juego · "RÉCORD **0**".
    - **Pantalla de inicio:** tag "HTML5 · SIN DESCARGAS" (morado), título con la segunda palabra en menta (p. ej. "SENDA **DEL VIENTO**"), descripción, controles en mono menta y el botón "Jugar".
    - **Fin de partida:** tag "FIN DE LA PARTIDA", "N **puntos**", "¡Nuevo récord!" o "Tu récord: N", y los botones de jugar otra vez y siguiente.
  - **Panel "Elige un cartucho":** "9 juegos originales que corren aquí mismo: cero descargas, cero espera. Tu récord se guarda en este navegador."
    - Cada cartucho lleva un ícono de 38 px en morado, el nombre (15,5 px), la etiqueta mono y "RÉCORD" a la derecha.
    - El activo va con borde menta y brillo. En hover el cartucho se corre 4 px.
  - Los 9 juegos son originales y usan solo la paleta:

| Juego | Etiqueta | Descripción | Controles |
|---|---|---|---|
| Senda del Viento | RPG de acción · Anime | Un ninja, una espada y oleadas de sombras. Sube de nivel, elige mejoras y vence al Oni de la Niebla. | WASD mover · J/clic espada · K esquiva · I shuriken · L espiral |
| Neon Drift | Esquivar · Adrenalina | Esquiva los bloques morados y atrapa orbes menta. Cada segundo es más rápido. | ← → o A D · en el celular, arrastra |
| Pulse Serpent | Arcade · 20 minutos | Come pulsos de energía para crecer sin chocar con los muros ni contigo. | Flechas o WASD · en el celular, desliza |
| Prism Break | Rompebloques · Rápido | Rebota la esfera con la barra y rompe todos los prismas. Tres vidas. | Mouse o ← → · clic o espacio para lanzar |
| Orbit Shift | Reflejos · Un botón | Salta entre dos órbitas para esquivar los arcos que giran hacia ti. | Clic, toque o espacio |
| Neon Defender | Disparos · Adrenalina | Tu nave dispara sola: muévete y limpia cada oleada antes de que llegue abajo. | Mouse o ← → · en el celular, arrastra |
| Pulse Runner | Corredor · Reflejos | Corre sin parar y salta los bloques. Puedes hacer doble salto. | Clic, toque o espacio para saltar |
| Beat Lanes | Ritmo · Con sonido | Pulsa cada nota justo cuando cruce la línea. Ocho fallos y se acaba. | Teclas D F J K · en el celular, toca el carril |
| Glyph Match | Memoria · Relajarme | Voltea las cartas y encuentra las 8 parejas de glifos. Sin prisa. | Clic o toque · flechas + Enter |

  - **Senda del Viento:**
    - Abre con 3 pantallas de historia: "La luna roja volvió a salir sobre el bosque de bambú." / "Los ninjas de la Sombra Sin Nombre quemaron tu aldea." / "Solo quedas tú, tu espada y el viento."
    - Avisos que salen durante el juego: "OLEADA N" y "JEFE: ONI DE LA NIEBLA" (cada 5 oleadas).
    - **Mejoras al subir de nivel** ("Elige una mejora (clic o teclas 1, 2, 3)"): Filo afilado, Pies de viento, Vitalidad, Lluvia de shurikens, Espiral mayor, Aura serena, Paso relámpago y Hoja sedienta.
    - Al morir: "CAÍSTE EN COMBATE".
    - Tiene controles táctiles en pantalla.
- **Speed & Streaming Test del sistema** (panel en 2 columnas):
  - **Texto:** "Revisa si tu navegador soporta las tecnologías de las demos web y si tu conexión aguanta streaming en la nube a 1080p. Se mide de verdad contra los servidores de video de Steam."
  - **Pastillas de estado** (punto menta con brillo, morado o apagado): "WebAssembly SIMD: **Habilitado**", "WebRTC DataChannels: **OK**", "WebGPU: **Activo / No disponible**" y "WASM Threads: **Requiere aislamiento**".
  - **Tarjeta "Overgame Telemetry Hook":**
    - Tag de estado: "Midiendo" / "Listo" / "Sin conexión".
    - "LATENCIA PING": 28 px menta neón, "N ms" y debajo "± N ms de jitter".
    - "ANCHO DE BANDA": "N Mbps" y el veredicto en morado: "Soporta 4K HDR" (≥ 25), "Soporta 1080p fluido" (≥ 8), "Alcanza para 720p" (≥ 4) o "Conexión justa para streaming".
    - Gráfica de línea menta con brillo, de 64 px de alto.
    - Botón "Volver a calibrar latencia".
- **"Demos oficiales en Steam"** · "8 juegos con demo gratuita activa hoy. El botón abre la demo en la tienda." Cuadrícula de tarjetas con demo + los juegos gratis.
- **"Cómo funcionan las demos en Overgame"**, 3 paneles:
  - **Web demos HTML5** [Activo]: "Juegos indie y prototipos exportados en WebGL/WebAssembly corren directo aquí. Carga instantánea, sin descargas ni costo de servidor."
  - **Enlaces a tiendas** [Activo]: "Botón directo a “Descargar demo” en Steam, PS Store o eShop. Respeta la licencia de cada estudio sin alojar archivos pesados."
  - **Demos en la nube** [Próximamente]: "Pruebas de 10 minutos de juegos AAA vía streaming, sin requisitos de hardware. Requiere acuerdo con un proveedor de cloud gaming." Lleva el botón morado "Avisarme cuando esté", que muestra el toast "Listo: te avisaremos cuando abran las demos en la nube".

### 6.5 Calendario & Preventas (`#/calendario`)
- **Escenario:** palabra "AGENDA". Título "Línea de tiempo de *salidas*" y lede "Fechas reales de Steam. Elige un juego para ver cuánto falta, comparar tiendas y activar una alerta de precio."
- **Pestañas de mes** dentro de una cápsula: "Septiembre 2026", "Octubre 2026", "Noviembre 2026". La activa va morada con brillo. Debajo, chips de plataforma: Todas, PC, PS5, XSX, Switch, Móvil.
- **Escritorio:** columnas `minmax(300px,380px) 1fr`.
  - **Línea de tiempo:**
    - Una línea vertical de 2 px con degradado menta→morado→transparente y brillo.
    - Cada ítem tiene un nodo circular de 12 px y muestra la fecha "14 NOV 2026" (mono menta), "N días" / "Hoy" / "Disponible", una imagen de 92 px, el nombre, "Estudio · Género" y el precio.
    - El ítem activo va con borde menta, brillo y el nodo relleno.
  - **Ficha del juego elegido:** queda **FIJA** (sticky a 88 px), con un alto máximo de `100dvh − 104px` y scroll propio. Así la columna derecha nunca queda vacía al bajar.
    - Media 21:9 con el video, un degradado a negro y los tags "PREVENTA" o "YA DISPONIBLE" + "DEMO DISPONIBLE".
    - Nombre en mayúsculas, `clamp(26px,3vw,36px)`, peso 800, montado 56 px sobre la imagen.
    - Datos en 3 celdas: FECHA OFICIAL · CUENTA REGRESIVA ("Faltan N días" en menta) · MEJOR PRECIO.
    - **Cuenta regresiva en vivo:** 4 casillas con Días, Horas, Min y Seg (26 px mono menta, cifras tabulares, actualiza cada segundo).
    - "Comparativa de tiendas oficiales" con Steam, Epic Games, PlayStation Store, Xbox Store, Nintendo eShop, App Store y Google Play, y "MEJOR PRECIO" marcado.
    - Nota: "Steam: precio real (8 nov 2026). “REF.”: referencia del prototipo. Bonos de reserva: se muestran en la página de cada tienda."
    - Acciones:
      - "Probar la demo gratis".
      - "Pre-ordenar en {tienda} (US$X)" o "Comprar en…". Si no hay precio: "Añadir a deseados en Steam".
      - "Activar alerta de precio" (morado; cambia a "Alerta activa").
      - Un corazón de 46 px.
- **Celular:** la ficha va debajo. Al elegir un juego, la pantalla baja hasta ella.

### 6.6 Biblioteca (`#/biblioteca`)
- **Escenario:** palabra "TUYO". Título "Favoritos y *alertas*" y lede "Se guarda en este navegador. Toca el corazón en cualquier juego para traerlo aquí."
- **3 estadísticas:** FAVORITOS · ALERTAS DE PRECIO · AHORRO HOY (30 px peso 800 menta).
- **Favoritos:** cuadrícula de tarjetas.
  - Vacío: "Todavía no guardas nada" · "Haz el test y guarda lo que te guste." · botón "Lanzar Mood Finder".
- **Alertas de precio:** filas mini con "Oferta activa · -X%" o "Vigilando precio" y el precio.
  - Vacío: "Sin alertas" · "Activa una desde el calendario o la ficha de un juego." · "Ir al calendario".

### 6.7 Mi panel (`#/panel`), con estadísticas reales del navegador
- **Escenario** de 250 px de alto, palabra "PANEL":
  - Nombre de jugador **editable** en el propio título (por defecto "Jugador", máx. 18 caracteres, subrayado discontinuo menta en hover y foco).
  - Insignia "NIVEL 1" (mono, morada, con brillo).
  - Barra de XP: "0 / 300 XP para el nivel 2".
- **Cuadrícula** de 4 columnas (1,15fr 1fr .85fr 1,2fr) con 18 px de separación. Áreas: `"hero hero ring coll" "chal chal prof prof" "play play ach ach"`.
  - **Continúa donde ibas / Destacado:** imagen grande del último juego visto, el nombre en mayúsculas con brillo morado, "RPG · PC / PS5 / XSX", "Ver tráiler" y el corazón.
  - **PROGRESO DE TEMPORADA:** anillo cónico de 150 px en menta con brillo, "0%" en el centro, y las casillas LOGROS "0 / 6" y TIEMPO EN DEMOS "0s".
  - **Mi colección / Empieza tu colección:** 4 filas con imagen de 86 px, nombre, estado ("Sale en N días" / "En oferta · -X%" / "Demo disponible" / género) y un medidor. ★ a la derecha. Lleva el enlace "Ver todo →".
  - **Desafíos activos** ("Se actualizan con lo que haces"), con un hexágono de 52×56 morado (menta si está completo):
    - Explorador "Abre 10 fichas de juegos" 0/10
    - Sintonizador "Completa 3 Mood Finder" 0/3
    - Arcade total "Juega los 5 cartuchos" 0/5
    - Coleccionista "Guarda 5 favoritos" 0/5
  - **Perfil de jugador** (tag "ESTA SESIÓN Y ANTERIORES"):
    - Avatar circular de 84 px con un aro cónico morado↔menta que gira en 6 s y las iniciales en menta neón.
    - "Nivel 1 · 0 XP".
    - 4 casillas: JUGADO, PARTIDAS, FICHAS VISTAS y MEJOR PUNTAJE.
  - **Sigue jugando:** hexágono grande, "Aún no juegas ninguna demo web" / "5 juegos originales te esperan, sin descargas." y el botón "Empezar". Cuando ya jugó, muestra el último cartucho con su récord y el botón "Jugar".
  - **Logros** ("N desbloqueados"): 6 hexágonos (los apagados a .55 de opacidad):
    - Primera mirada "Abre la ficha de un juego"
    - Sintonizado "Completa el Mood Finder"
    - Coleccionista "Guarda 5 favoritos"
    - Rata de arcade "Juega los 5 cartuchos web"
    - Reflejos de neón "Pasa 500 puntos en Neon Drift"
    - Vigía de precios "Activa 3 alertas de precio"
- **XP:** fichas vistas×10 + Mood Finder×50 + partidas×20 + favoritos×15 + alertas×10 + logros×100. Se sube de nivel cada 300 XP.
- **Responsive:** por debajo de 1180 px la cuadrícula pasa a 2 columnas; en celular, a 1.

### 6.8 Admin (`#/admin`)
- **Login** (tarjeta centrada de 420 px):
  - Degradado morado arriba, borde `rgba(96,69,244,.45)`, radio 22 y escudo menta de 52 px.
  - "Acceso de administrador" · "Inicia sesión para agregar, editar o borrar juegos del catálogo."
  - Campos Usuario y Contraseña (46 px, radio 12; foco con borde menta y halo de 3 px). La contraseña tiene el botón "Ver" / "Ocultar".
  - Botón "✓ Entrar al panel" y el enlace "← Volver a la plataforma".
  - **Errores** en menta: "Escribe usuario y contraseña." / "Usuario o contraseña incorrectos." (la tarjeta tiembla 7 px) / "Demasiados intentos. Espera 30 s." (tras 5 fallos).
  - **Seguridad:** la contraseña nunca va escrita en el código. Solo se guarda su huella PBKDF2-SHA256 (sal + 150 000 iteraciones) y se compara con WebCrypto. La sesión dura 8 h en `sessionStorage`.
- **Panel "Admin · Catálogo":** "Agrega juegos con su tráiler y los links de cada tienda. Se guardan en este navegador; usa Exportar para pasarlos a otro equipo." Botones Exportar JSON / Importar / Cerrar sesión.
- **Formulario** en bloques (fieldsets con borde morado, degradado y leyenda menta en mayúsculas):
  - **"Juego nuevo"** (o "Editando: X"): Nombre *, Estudio, Descripción, Imagen de portada (URL) *, Video / tráiler (URL), Fecha de lanzamiento, Precio US$ ("vacío = por anunciar · 0 = gratis"), Descuento %, Metacritic, Exigencia y Géneros (separados por coma, con sugerencias).
    - Si el video es de YouTube, aparece este aviso: "YouTube no se puede reproducir al pasar el mouse: se mostrará como botón "Ver tráiler". Para el efecto hover usa un .mp4, .webm o .m3u8."
  - **Plataformas** · **Modo de juego** · **Ánimo (Mood Finder):** chips seleccionables en forma de píldora; seleccionados van morados con brillo.
  - **Links:** Steam, Epic Games, PlayStation Store, Xbox Store, Nintendo eShop, App Store, Google Play, Sitio oficial y Demo. Solo se aceptan links `https`.
  - Botón "Agregar al catálogo" / "Guardar cambios".
- **Lateral sticky** de 340 px:
  - Vista previa en vivo 16:9 con el video y el texto "Así se verá la tarjeta".
  - "Tus juegos (N)": cada fila lleva ver, editar y borrar. Borrar pide confirmar con un segundo toque ("¿Sí?").
- Los juegos agregados aparecen en Inicio, Explorar, Mood Finder, Calendario y Demos.

---

## 7. DATOS

### 7.1 Modelo de cada juego
`{ id, name, desc, img, dev, date (AAAA-MM-DD), soon, price, base, off, demo, meta, moods[], plats[], modes[], level (1-3), genres[], mt (microtrailer.webm), mp4 (movie480.mp4) | hls (.m3u8), votes? }`

- **Imágenes de Steam:**
  - Portada: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{id}/header.jpg`
  - Fondo panorámico: `…/apps/{id}/library_hero.jpg`
- **Video:** `https://cdn.akamai.steamstatic.com/steam/apps/{movieId}/microtrailer.webm` y `movie480.mp4`. Los juegos recientes usan HLS con hls.js 1.5.17 desde cdnjs.
- **Valores posibles:**
  - `moods`: adrenalina, relax, historia, rapido.
  - `plats`: pc, ps5, xbox, switch, mobile.
  - `modes`: solo, coop, comp, local.
- **Tiendas:** Steam usa el precio real; las demás usan un precio de referencia simulado y estable.
  - PlayStation ×1,1, Xbox ×1,05, eShop ×1,1 y móvil ×0,4.
  - Descuento elegido de forma determinista entre 0 y 40 %.
- **Formato de los datos:**
  - Fechas: "14 NOV 2026".
  - Dinero: "US$29.99"; precio 0 = "Gratis"; sin precio = "Por anunciar".

### 7.2 Catálogo actual (57 juegos de la API pública de Steam, consultada el 8 nov 2026)
DOOM Eternal, Hades II, Returnal, Vampire Survivors, Ghostrunner 2, Hades, Risk of Rain 2, HELLDIVERS 2, Counter-Strike 2, Deep Rock Galactic, Sekiro: Shadows Die Twice, ELDEN RING, Hollow Knight, Dead Cells, Stardew Valley, DAVE THE DIVER, Dorfromantik, Tiny Glade, Unpacking, A Short Hike, PowerWash Simulator, Terraria, Cyberpunk 2077, Disco Elysium, Baldur's Gate 3, Red Dead Redemption 2, The Witcher 3: Wild Hunt — Remastered, Clair Obscur: Expedition 33, Outer Wilds, It Takes Two, Split Fiction, Balatro, Brotato, Slay the Spire, Overcooked! 2, Celeste, Hi-Fi RUSH, Phantom Blade Zero, 007 First Light, CONTROL Resonant, PEAK, R.E.P.O., No Man's Sky, Loftia, Lightyear Frontier, Probably Stolen - Cyberpunk Shopkeeper Sim, Football Manager 27, DreamWorks Shrek 2 Remastered, Warhammer Survivors, Main Sequence, Melvor Idle 2, SONIC PICO PARK, Ashes of the Singularity II, DREADMOOR, Worst Class Ever, TANUKI: Pon's Summer y Spirit Crossing.

---

<cambios_nuevos>
## 8. JUEGOS VOTADOS POR EL GRUPO (lo único nuevo frente a la versión actual)

Agrega al catálogo estos 24 juegos, que salieron de una votación del grupo (24 juegos distintos, 55 votos en total: el resumen original decía 54, pero la suma de la lista da 55). Red Dead Redemption 2 ya está en el catálogo: no lo dupliques, solo agrégale sus votos. Cada juego lleva el campo `votes` con su número de votos.

| Votos | Juego (franquicia votada → edición que se muestra) | Plataformas | Precio y tienda | Ánimos | Exigencia | Modos |
|---|---|---|---|---|---|---|
| 6 | Valorant | pc, ps5, xbox | Gratis · Riot | adrenalina | 3 | comp |
| 5 | League of Legends (LOL) | pc | Gratis · Riot | adrenalina | 3 | comp |
| 5 | Minecraft | pc, ps5, xbox, switch, mobile | Pago · Minecraft.net / tiendas de consola / móvil | relax, historia | 1 | solo, coop, local |
| 4 | Call of Duty → Call of Duty: Black Ops 6 | pc, ps5, xbox | Pago · Steam / Battle.net | adrenalina | 3 | solo, comp, coop |
| 4 | GTA → Grand Theft Auto V | pc, ps5, xbox | Pago · Steam (id 271590) | adrenalina, historia | 2 | solo, comp |
| 3 | God of War (2018) | pc, ps5 | Pago · Steam (id 1593500) | historia, adrenalina | 2 | solo |
| 3 | Roblox | pc, xbox, ps5, mobile | Gratis · Roblox | rapido, relax | 1 | coop, comp |
| 3 | Plants vs. Zombies (GOTY) | pc, mobile | Pago · Steam (id 3590) | rapido, relax | 1 | solo |
| 3 | Halo → Halo: The Master Chief Collection | pc, xbox | Pago · Steam (id 976730) | adrenalina, historia | 2 | solo, coop, comp |
| 2 | Metroid → Metroid Dread | switch | Pago · Nintendo eShop | adrenalina | 3 | solo |
| 2 | Fortnite | pc, ps5, xbox, switch, mobile | Gratis · Epic | adrenalina, rapido | 2 | comp, coop |
| 2 | Forza → Forza Horizon 5 | pc, xbox | Pago · Steam (id 1551360) | rapido, relax | 1 | solo, coop, comp |
| 2 | Resident Evil → Resident Evil 4 (2023) | pc, ps5, xbox | Pago · Steam (id 2050650) | adrenalina, historia | 2 | solo |
| 1 | Fallout → Fallout 4 | pc, ps5, xbox | Pago · Steam (id 377160) | historia | 2 | solo |
| 1 | Spider-Man → Marvel's Spider-Man Remastered | pc, ps5 | Pago · Steam (id 1817070) | historia, adrenalina | 2 | solo |
| 1 | FIFA → EA SPORTS FC (FIFA cambió de nombre) | pc, ps5, xbox, switch | Pago · Steam / EA | rapido, adrenalina | 2 | solo, comp, local |
| 1 | Gears of War → Gears 5 | pc, xbox | Pago · Steam (id 1097840) | adrenalina | 3 | solo, coop, local |
| 1 | Zelda: Breath of the Wild | switch | Pago · Nintendo eShop | historia, relax | 2 | solo |
| 1 | Red Dead Redemption 2 *(ya existe)* | pc, ps5, xbox | ya cargado | historia | 2 | solo |
| 1 | Fall Guys | pc, ps5, xbox, switch | Gratis · Epic / consolas | rapido | 1 | comp |
| 1 | Left 4 Dead 2 | pc | Pago · Steam (id 550) | adrenalina | 2 | coop |
| 1 | Free Fire | mobile | Gratis · Garena | adrenalina, rapido | 2 | comp |
| 1 | Rocket League | pc, ps5, xbox, switch | Gratis · Epic | rapido, adrenalina | 2 | comp, local |
| 1 | Brawl Stars | mobile | Gratis · Supercell | rapido | 1 | comp |

**Reglas para estos juegos (mantienen la honestidad de datos):**
- **Juegos que están en Steam:** usa el precio, la portada y el tráiler reales de Steam y márcalos "PRECIO REAL".
- **Juegos que no están en Steam** (Valorant, LoL, Minecraft, Roblox, Fortnite, Zelda, Metroid, Free Fire, Brawl Stars, Fall Guys, Rocket League):
  - Gratis = "Gratis" (es real).
  - Pago = precio de referencia, marcado "REF.", con enlace a su tienda oficial.
  - Portada: un arte oficial de la tienda correspondiente. Si no hay, usa un placeholder con el nombre en Outfit 800 sobre degradado morado→negro; nunca una imagen inventada que parezca oficial.
- **Ningún** precio, fecha o Metacritic inventado se presenta como real. Si no hay dato verificado, va "Por anunciar" o se omite.
- **Ánimos:** el primer ánimo de la lista es el principal, que vale 40 puntos en el Mood Finder.
- **Bloque nuevo en Inicio**, justo debajo de "¿Cómo quieres sentirte hoy?":
  - Título: **"Los más votados por el grupo"**. Subtítulo: "55 votos · 24 juegos" (se calcula sumando los votos).
  - Es una fila horizontal de tarjetas normales (con vista flotante), ordenadas de más a menos votos.
  - Cada tarjeta lleva una insignia morada adicional "N VOTOS".
  - El podio va con insignias menta: "1º" Valorant (6), "2º" League of Legends y Minecraft (5) y "3º" Call of Duty y GTA (4).
  - El estilo es el mismo de las otras secciones: no inventes un componente visual nuevo.
- **Explorar:** suma la opción de orden "Más votados".
- **Menú de bienvenida:** el contador del pie se actualiza solo con el nuevo total de juegos.
</cambios_nuevos>

---

## 9. RESPONSIVE (puntos de quiebre)
- **≤ 1180 px:**
  - El Mood Finder pasa a 1 columna y su lateral deja de ser fijo.
  - Ánimos en 2 columnas. Demos en 1 columna.
  - El lateral de Inicio baja. Mi panel pasa a 2 columnas.
- **≤ 980 px:** resultados en 2 columnas. El calendario y las estrategias en 1.
- **≤ 860 px:**
  - Se oculta el riel. Aparecen el cajón, la barra de pestañas y el logo en la barra superior.
  - Padding del contenido: 20×16, con 96 px abajo para no quedar tapado por las pestañas.
  - Modal tipo hoja inferior. El velo del hero va de abajo hacia arriba.
- **≤ 620 px:**
  - Tarjetas en 2 columnas, sin chips de plataforma. Ánimos sin descripción.
  - Los filtros se vuelven carruseles horizontales y las pestañas de mes se desplazan.
  - Los datos de la ficha pasan a 2 columnas.
- **Pantalla baja (≤ 640 px de alto, escritorio):** el menú de bienvenida usa títulos de `clamp(24px,5.6vh,44px)` y un slogan de 18 px.
- **Pantallas táctiles (sin hover):** se quitan los zoom y saltos de hover.

## 10. ESTADO Y PERSISTENCIA
- **localStorage** con el prefijo `og.`: `favs`, `alerts`, `stats` (views, viewed[12], moods, plays{}, time, last, tag), `hi.<cartucho>` y `custom`. Toda lectura y escritura va dentro de try/catch.
- **sessionStorage:** `og.adminSession`.
- **Toasts:**
  - "Guardado en tu biblioteca" / "Quitado de favoritos"
  - "Te avisaremos si baja de precio" / "Alerta desactivada"
  - "Sesión iniciada" / "Sesión cerrada"
- **Atajos:** `/` buscar · `M` menú de bienvenida · `Esc` cierra el modal, la vista flotante o el cajón · Enter y Espacio sobre una tarjeta abren la ficha.

## 11. CRITERIOS DE ACEPTACIÓN (revisa cada uno antes de entregar)
1. Las 8 rutas se ven a 1440 px y a 390 px, sin scroll horizontal y sin errores en la consola.
2. **Menú de bienvenida:**
   - Las 7 opciones caben sin pasar del pie a 1440×900, 1440×620 y 390×844.
   - El hover rellena el título, la barra menta queda alineada con él y la descripción no se cruza con otros títulos.
3. **Menú lateral cerrado:** riel de 78 px, rayitas entre grupos y globos de ayuda alineados con cada ícono.
4. **Menú lateral abierto:**
   - Empuja el contenido y no lo oscurece.
   - Ningún texto ni botón cruza la diagonal a ninguna altura.
   - No se ve barra de scroll y no aparece una línea blanca en el borde.
5. **Vista flotante:** crece desde la tarjeta, reproduce el tráiler en silencio y vuelve a su sitio sin parpadeo.
6. **Mood Finder:** completo en 4 pasos, con avance automático, candidato en vivo y 3 resultados con su % de afinidad.
7. **Calendario:** la ficha de la derecha acompaña el scroll y la cuenta regresiva corre cada segundo.
8. **Demos:** se puede jugar al menos un cartucho y el récord se guarda.
9. **Admin:** contraseña incorrecta, bloqueo de 30 s, entrar, recargar sin perder la sesión, cerrar sesión, y agregar y borrar un juego.
10. **Los 24 juegos votados:**
    - Aparecen en Explorar, en el Mood Finder y en "Los más votados por el grupo".
    - Están en el orden correcto, con el podio bien marcado.
    - Cada precio lleva su etiqueta "PRECIO REAL" o "REF.".
11. Solo se usan los 4 colores de la paleta y sus transparencias.

## 12. LO QUE NO DEBES HACER
- No cambiar tipografías, colores, radios, tiempos ni textos.
- No agregar secciones, gráficos ni ilustraciones que no estén descritos aquí.
- No usar personajes, nombres ni arte de franquicias reales en los juegos del arcade: son 100 % originales.
- No usar el modo claro, ni degradados arcoíris, ni sombras grises genéricas.
- No dejar columnas vacías ni textos que pasen por encima de bordes.
