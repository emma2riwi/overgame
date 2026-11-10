# Para pegar en Claude Design (adjunta también `overgame-media.json`)

Me gusta mucho cómo va. Ahora necesito que se parezca más a la versión original de Overgame en tres cosas: **portadas reales, videos y los dos menús**. No cambies nada más: paleta, tipografías, textos y secciones se quedan como están.

## 1. Portadas, fondos y videos reales (usa el archivo adjunto `overgame-media.json`)

Ese archivo trae los 80 juegos con su `id` y `name`, iguales a los del catálogo que ya tienes. Cruza los juegos por `id` (o por `name` si el id no coincide) y usa estos campos:

| Campo | Dónde va |
|---|---|
| `cover` | Portada de **todas** las tarjetas, de la tarjeta "En pantalla" del menú de bienvenida, de las filas mini, de la línea de tiempo, de los resultados del Mood Finder y de la ficha. Con `object-fit: cover`, proporción 460/215. |
| `hero` | Fondo panorámico de los escenarios de cada sección, del hero de Inicio, del menú de bienvenida y de "Continúa donde ibas" en Mi panel. Con `object-fit: cover` y `object-position: center 30%`. |
| `video_webm_hover` | Microtráiler para el hover de la tarjeta (vista flotante), en silencio y en bucle. Si el navegador no reproduce webm, usa `video_mp4`. |
| `video_mp4` | Tráiler del hero, del fondo del menú de bienvenida, de los escenarios, de los resultados del Mood Finder, de la ficha del Calendario y del modal (en el modal, con sonido y controles). |

- Borra las portadas de relleno (degradado con el nombre del juego). Ahora todas las tarjetas llevan su `cover`.
- **Si un juego tiene `video_mp4: null`, no tiene video:** se muestra solo su imagen, sin poner otro video.
- **Al pasar el mouse por una tarjeta:** se abre la vista flotante y, a los 180 ms, el video entra con un fundido de .7 s sobre la portada. Debajo avanza una barra de progreso menta de 3 px.
- **Logo:** usa las URLs de `logo` del archivo (`og-mark.png`, `og-word.png`, `og-logo.png`, `favicon.png`).
- **Si una imagen falla al cargar** (`onerror`), muestra el `cover` del juego; si también falla, deja un fondo `#0F1417`.
- **Pon de fondo el juego que corresponde a cada opción del menú de bienvenida:**
  - Mi panel → Hades (1145360)
  - Descubrir → Clair Obscur: Expedition 33 (1903340)
  - Mood Finder → Hades II (1145350)
  - Explorar → ELDEN RING (1245620)
  - Demos → Tiny Glade (2198150)
  - Calendario → 007 First Light (3768760)
  - Biblioteca → Split Fiction (2001120)
- **Fondo de cada escenario:**
  - Explorar → ELDEN RING (1245620)
  - Demos → Hades (1145360)
  - Calendario → 007 First Light (3768760)
  - Biblioteca → Split Fiction (2001120)
  - Mood Finder según el ánimo elegido: adrenalina → DOOM Eternal (782330), relax → Tiny Glade (2198150), historia → Baldur's Gate 3 (1086940), rápido → Balatro (2379780)
  - Mi panel → el último juego que viste

## 2. Menú de bienvenida (igual al original)

- **Fondo:** a pantalla completa, con el `hero` del juego de la opción activa y, encima, su `video_mp4` en silencio y en bucle.
  - Imagen y video entran con un fundido de 1,1 s.
  - La imagen hace un zoom lento de 1,08 a 1 en 6 s.
  - Al cambiar de opción, dos capas se cruzan para que nunca se vea negro.
- **Degradado:** encima del fondo va `linear-gradient(90deg, #0F1417 0%, rgba(15,20,23,.96) 22%, rgba(15,20,23,.82) 38%, rgba(15,20,23,.45) 50%, rgba(15,20,23,.08) 62%, transparent 72%)`. Así la mitad derecha deja ver el video.
- **Quita los números 01–07.** El original no los tiene: solo van el título y la barra menta.
- **Títulos más grandes**, que llenen el alto de la pantalla:
  - `font-size: clamp(26px, min(4.4vw, 6vh), 64px)`, peso 800, mayúsculas, letter-spacing −.035em, siempre en una línea.
  - Separación entre opciones: `clamp(4px, 1.1vh, 12px)`.
  - Las 7 opciones deben ocupar casi todo el espacio entre el slogan y el pie.
- **Opción activa:**
  - El título se rellena de gris `#EBEBED`, se corre 10 px a la derecha y gana brillo morado (`0 0 40px rgba(96,69,244,.55)`).
  - La barra menta de 4 px se desliza en .6 s hasta quedar exactamente a la altura del título.
- **"Entrar" tiene que funcionar:** el botón "Entrar", Enter, Esc o un clic en una opción cierran el menú y abren esa sección. Al salir, los elementos se van 30 px a la izquierda, el fondo hace zoom a 1,06 y todo se desvanece en .7 s.
- **Tarjeta "En pantalla":** muestra el `cover` real del juego del fondo, su nombre y sus géneros.

## 3. Menú lateral (hoy se queda corto: debe quedar como el original)

- **Cerrado (por defecto):**
  - Es un riel fijo de **78 px** que ocupa **todo el alto de la pantalla**, de arriba a abajo, en todas las vistas.
  - Fondo: `linear-gradient(180deg, #0F1417 0%, #0F1417 30%, rgba(96,69,244,.16) 62%, rgba(96,69,244,.42) 100%)` y un borde derecho de 1 px en `rgba(83,230,212,.22)`.
- **Tres zonas** que llenan todo el alto:
  1. **Cabecera fija:** el botón de menú (46×42, borde menta) y el monograma del logo de 46 px.
  2. **Cuerpo con scroll propio**, sin barra de scroll visible:
     - Los íconos de cada sección, de 22 px en menta con brillo.
     - Entre grupos va una **rayita** menta de 24 px (DESCUBRIR · JUGAR Y COMPRAR · TU COLECCIÓN).
  3. **Pie fijo pegado abajo**, con una línea menta encima:
     - "Admin · Agregar juegos", con borde discontinuo.
     - "Menú principal" con la tecla `M`.
- **Abierto (al tocar el botón de menú):**
  - Se expande a **300 px** y empuja el contenido: el contenido pasa de 78 a 300 px de margen y los dos se mueven juntos en .5 s con `cubic-bezier(.16,1,.3,1)`.
  - Muestra los nombres de cada sección, los títulos de sección con su línea, la cuadrícula de PLATAFORMAS (PC, PS5, Xbox X|S, Switch, Móvil) y el pie completo.
  - Lleva la forma diagonal con borde neón menta, como dice el prompt original.
  - Todo el contenido mide como máximo 212 px de ancho, para que nada cruce la diagonal.
- **Ítem activo:**
  - Una píldora morada que se desliza entre opciones en .55 s.
  - Una barra menta de 3 px pegada al borde izquierdo de la pantalla.
- **Globo de ayuda** (con el menú cerrado): al pasar el cursor por un ícono aparece a la derecha, con el nombre de la sección y una línea que dice a dónde lleva.

## 4. Comprueba antes de entregar

- Ninguna tarjeta queda con portada de relleno.
- El hover reproduce el video en los juegos que lo tienen.
- El menú de bienvenida muestra video de fondo y "Entrar" funciona.
- El riel lateral llega de arriba a abajo, con el pie pegado abajo.
- Al abrir el menú lateral, el contenido se corre a la derecha.
