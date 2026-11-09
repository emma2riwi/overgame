# Prompt — Overgame (versión actual)

Construye **Overgame**, una página web de descubrimiento de videojuegos (Game Discovery Hub).
Slogan: "Encuentra qué jugar según cómo te sientes, pruébalo gratis y no te pierdas ningún lanzamiento."

Antes de escribir código, hazme las preguntas que necesites para entender la idea, ordenar los requisitos y definir la lógica. Después constrúyela completa y pruébala en un navegador real, en computador y en celular.

## 1. Para quién es y qué hace el usuario
- **Público:** jugadores de 15 a 35 años que no saben qué jugar, que quieren probar antes de comprar o que siguen los lanzamientos.
- **El usuario necesita:**
  - descubrir juegos según su ánimo y el tiempo que tiene
  - comparar precios entre tiendas
  - probar demos gratis
  - seguir las fechas de lanzamiento
  - guardar favoritos y alertas
  - ver su propio progreso

## 2. Tecnología
- **Sin frameworks ni build:** HTML, CSS y JavaScript puro. Una sola página con rutas por hash (`#/inicio`, `#/mood`, etc.).
- **Archivos:** `index.html`, `styles.css`, `app.js`, `data.js` (catálogo), `arcade.js` (demos jugables), `rpg.js` (demo RPG) y `assets/` (logo, favicon).
- **Datos reales:** unos 55 juegos sacados de la API pública de Steam (`appdetails` y `featuredcategories`).
  - Campos de cada juego: nombre, descripción, portada, estudio, fecha, si aún no sale, precio, precio base, % de descuento, id de demo, Metacritic, plataformas, géneros y modos.
  - Tráiler: `microtrailer.webm`/`movie480.mp4`, o `.m3u8` (HLS) para los juegos recientes.
  - Hay que asignar a mano a cada juego: ánimos (adrenalina, relax, historia, rápido) y exigencia (1 a 3).
  - Se guarda en `data.js` como `window.OG_GAMES`, con la fecha de consulta.
- **Video HLS:** con hls.js desde cdnjs, con versión fija.
- **Persistencia en localStorage** (prefijo `og.`): favoritos, alertas, estadísticas, récords de cada demo y juegos agregados desde Admin. Toda lectura y escritura va dentro de try/catch.
- **Honestidad de datos:**
  - El precio de Steam es real y se marca "PRECIO REAL".
  - Los precios de otras tiendas son de referencia y se marcan "REF.".
  - Los datos de ejemplo se marcan "Ejemplo". Nunca se presenta como real algo inventado.

## 3. Diseño
- **Paleta exclusiva:** Royal Purple `#6045F4` (principal), Neon Mint `#53E6D4` (botones e interactivos), Soft Gray `#EBEBED` (textos), Carbon Black `#0F1417` (fondo). Solo se permiten transparencias de estos cuatro colores.
- **Estética:** gamer futurista, oscura, con luces neón fuertes. Lleva:
  - anillos de luz animados en los bordes
  - una cuadrícula synthwave en el piso del fondo
  - un fondo ambiental borroso con la portada del juego que se está mirando
  - un brillo que sigue al mouse en las tarjetas
- **Inmersión en TODAS las vistas, no solo en la primera:**
  - cada sección abre con un "escenario" a pantalla ancha con video de fondo y un título gigante de contorno
  - los elementos aparecen al hacer scroll
  - al cambiar de página hay una transición de salida corta (unos 200 ms)
- **Tipografía:** Outfit para el texto y JetBrains Mono para cifras y etiquetas.
- **Que no parezca hecho con IA:**
  - nada de etiquetas pequeñas genéricas encima de cada título
  - nada de texto de relleno
  - jerarquía clara y textos cortos y directos en español
- **Accesible y responsive:** sin scroll horizontal a 390 px, foco visible, `prefers-reduced-motion` respetado y áreas táctiles de al menos 44 px.

## 4. Navegación
- **Logo oficial del equipo:** `assets/og-mark.png` (monograma "OG" con cruceta y botones de control, degradado morado→menta) y `assets/og-word.png` ("OVER" en gris + "GAME" en degradado morado→menta, con el lema "JUEGA • DESCUBRE • COMPRA"). Favicon e ícono de app salen del monograma.
- **Menú lateral izquierdo** estilo panel gamer, en tres zonas:
  - **Cabecera fija:** el botón de menú y el logo.
  - **Cuerpo con scroll propio:** si la pantalla es baja, solo esta parte se desplaza. Nada queda pegado ni escondido detrás del pie.
  - **Pie fijo** con una línea divisoria encima: "Admin · Agregar juegos" y "Menú principal" (tecla M).
  - **Secciones con título y línea divisoria:**
    - DESCUBRIR: Mi panel, Inicio, Mood Finder, Explorar
    - JUGAR Y COMPRAR: Demos (con etiqueta LIVE), Calendario & Preventas
    - TU COLECCIÓN: Biblioteca / Favoritos (con contador)
    - PLATAFORMAS: accesos rápidos a PC, PS5, Xbox, Switch y Móvil
  - **Cerrado por defecto:** un riel de 78 px con íconos de contorno menta. Los títulos de sección se ven como rayitas, así la división entre secciones se nota igual.
  - **Abierto solo cuando el usuario toca el botón de menú:** se expande a 300 px.
  - **Forma estilo GameHub:** el panel abierto tiene un borde derecho diagonal neón menta. Es recto arriba y a partir de dos tercios se va metiendo hacia la izquierda en dos tramos. Lleva una segunda línea morada paralela por fuera, abajo.
  - **Relleno:** negro semitransparente con un degradado morado muy gradual (casi nada arriba, más intenso abajo) y un brillo morado tenue en la esquina inferior izquierda. Se funde con el fondo de la página, sin cortes bruscos.
  - **Cerrado por defecto (riel de íconos).** Al pasar el cursor por un ícono, o al llegar con Tab, aparece un globo a la derecha, alineado con el ícono. El globo tiene fondo oscuro, borde menta y una flechita, y muestra el nombre de la sección más una línea que dice a dónde lleva (por ejemplo: "Game Mood Finder · Cuatro preguntas y tres juegos para cómo te sientes"). El globo no aparece con el menú abierto ni en el celular.
  - **Integrado en escritorio:** al abrirse con el botón de menú, EMPUJA el contenido hacia la derecha (no lo tapa ni oscurece la página) y se queda abierto mientras navegas, como parte de la plataforma. En el celular es un cajón que se superpone y se cierra al elegir una opción.
  - **Sin contornos de más:** la regla global de íconos (`svg{stroke:currentColor}`) no debe aplicarse a la forma de fondo del menú. Si se aplica, aparece una línea blanca arriba y a la izquierda.
  - **Que nada cruce el borde:** todo el contenido del panel abierto (logo, ítems, plataformas, Admin, Menú principal) mide como máximo 212 px de ancho, para que ningún texto ni botón cruce la diagonal en ninguna altura de pantalla. El texto conserva el mismo color sobre el degradado.
  - **Ítem activo:** una "píldora" morada con brillo que se desliza entre opciones. Se recoloca al abrir o cerrar el menú.
  - El fondo oscuro de la página que aparece al abrirlo va DEBAJO del menú y sin desenfoque.
  - En el celular es un cajón lateral, y además hay una barra inferior con 5 pestañas.
- **Barra superior:** buscador (tecla `/`) y acceso a favoritos.
- **Menú de bienvenida** (página de inicio, el primer contacto; también con la tecla M), a pantalla completa:
  - **Arriba:** el logo con proporciones fijas (el monograma mide lo mismo de alto que el texto "OVERGAME", unos 35 px en escritorio) y el botón "Entrar".
  - **Fondo:** video que cambia con cada opción. Encima lleva un degradado negro sólido desde la izquierda que se desvanece hacia la mitad de la imagen, para que los textos resalten. En el celular el degradado va de abajo hacia arriba.
  - **Slogan:** "Encuentra qué jugar según cómo te sientes."
  - **Las 7 secciones** (Mi panel, Descubrir, Mood Finder, Explorar, Demos, Calendario, Biblioteca):
    - en mayúsculas grandes, con contorno y SIEMPRE en una sola línea
    - el tamaño depende del ancho Y del alto de la pantalla (`clamp(26px, min(4.4vw, 6vh), 64px)`), para que las 7 quepan sin pasar del pie en ninguna pantalla, de 620 px de alto hasta 4K
    - separadas entre sí para que no parezcan texto corrido
  - **Hover / opción activa** (se mantiene igual):
    - el título se rellena de gris claro con brillo morado y se corre un poco
    - una barra menta vertical se desliza hasta él y se alinea exactamente con el título
    - la descripción aparece AL LADO del título, con una línea menta a su izquierda, sin empujar ni cruzarse con los otros títulos
    - en el celular, la descripción sale debajo
  - **Tarjeta "En pantalla"** a la derecha con el juego del fondo.
  - **Pie:** datos (juegos, demos gratis, salidas del mes) y las teclas ↑ ↓ Enter.

## 5. Tarjetas de juego (regla clave)
Al pasar el mouse sobre una tarjeta, esta **crece de forma suave desde su posición** (animación FLIP). Se convierte en una vista flotante que reproduce el tráiler en silencio y despliega:
- géneros
- precio
- botones "Probar demo" y "Ver ficha"

Al salir, vuelve a su sitio con la misma suavidad, sin parpadeos ni zonas negras. En el celular, el toque abre la ficha completa.

## 6. Secciones
1. **Inicio / Descubrir**
   - un juego destacado con video
   - accesos directos a los 4 ánimos
   - los mejor calificados
   - próximos lanzamientos
   - columna derecha con "Ofertas de la semana" (el descuento real más alto) y "Amigos en línea" (datos de ejemplo, marcados)
2. **Game Mood Finder** (4 pasos con barra de progreso):
   1. ánimo: relajarme, adrenalina, gran historia o 20 minutos libres
   2. plataforma (PC, consola o móvil) y compañía (solo, en línea o pantalla dividida)
   3. exigencia: ligero, desafío medio o hardcore
   4. 3 resultados, cada uno con:
      - % de afinidad calculado por puntos (ánimo 40, plataforma, compañía, exigencia 25, más un bono por calidad, demo u oferta)
      - por qué se recomienda
      - tráiler
      - enlace a la demo si existe
      - las tiendas con su indicador de oferta
3. **Explorar catálogo:** filtros combinables (plataforma, género y modo) más el buscador, con resultados al instante.
4. **Centro de Demos**, con las tres estrategias:
   - **Demos HTML5 en el navegador:** un arcade en canvas con 9 juegos originales hechos con la paleta. Son un RPG de acción y 8 arcade: esquivar, serpiente, rompebloques, órbitas, naves, corredor, ritmo y memoria. Cada uno tiene:
     - pantalla de inicio, controles visibles y récord guardado
     - controles de teclado y táctiles
   - **Links directos** a las demos oficiales de Steam.
   - **Nube:** una sección explicativa con enlaces a servicios de streaming.
   - **"Speed & Streaming Test"** con mediciones reales: ping y ancho de banda (descargando fragmentos de video de un CDN con CORS), y compatibilidad WebGPU, WASM SIMD y WebRTC. Al final dice si el equipo sirve para jugar en la nube.
5. **Calendario & Preventas:**
   - vista por mes con los lanzamientos
   - cuenta regresiva
   - comparación de precios entre Steam, Epic, PlayStation Store, Xbox, Nintendo eShop, App Store y Google Play, con "MEJOR PRECIO" marcado
   - botón de alerta
   - en escritorio: la línea de tiempo a la izquierda y la ficha del juego elegido a la derecha. La ficha queda FIJA debajo de la barra superior mientras bajas por la lista (position: sticky, con scroll propio si es más alta que la pantalla), para que la columna derecha nunca quede vacía. En el celular la ficha va debajo
6. **Biblioteca:** favoritos y alertas.
7. **Mi panel** (dashboard del jugador) con estadísticas reales del navegador:
   - nombre de jugador editable
   - nivel y XP
   - anillo de progreso
   - colección
   - retos
   - logros desbloqueables
   - "continuar jugando"
   - últimas demos jugadas
8. **Admin:** formulario para agregar juegos propios con:
   - nombre, estudio, descripción y portada
   - video (`.mp4`, `.webm` o `.m3u8`; si es de YouTube, se muestra como botón "Ver tráiler")
   - fecha, precio, descuento, Metacritic y exigencia
   - géneros, plataformas, modos y ánimos
   - links de cada tienda y de la demo (solo `https`)

   También tiene:
   - vista previa en vivo con el video
   - lista para editar o borrar (borrar exige tocar dos veces)
   - Exportar e Importar en JSON

   Los juegos agregados aparecen en todas las secciones.

## 7. Ficha del juego (ventana emergente)
La ficha muestra:
- tráiler con sonido
- descripción
- datos: estudio, fecha, modo, exigencia y Metacritic
- tabla de tiendas con precio y descuento
- botón principal: la demo si existe; si no, "Comprar" o "Reservar" en la tienda más barata
- botones de Favorito y Alerta

## 8. Pruebas antes de entregar
Probar en un navegador real a 1440 px y a 390 px, y el menú lateral también en una pantalla baja (620 px de alto):
- cada ruta
- el hover de las tarjetas
- el menú lateral abierto y cerrado
- el Mood Finder completo
- jugar una demo
- agregar y borrar un juego desde Admin
- recargar y comprobar que todo persiste

No debe haber errores en la consola ni scroll horizontal.

## 9. Publicación
Subir a GitHub Pages para compartir el link.
