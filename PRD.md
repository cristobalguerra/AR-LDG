# PRD — Generador de Composiciones Visuales (módulo de AR-LDG)

**Proyecto:** AR-LDG
**Módulo:** Composer (nombre tentativo)
**Autor:** Equipo AR-LDG
**Versión:** 0.2 (Draft)
**Fecha:** 2026-05-20
**Estado:** En revisión

---

## 1. Resumen

Composer es un **módulo nuevo dentro del sitio AR-LDG** (no una plataforma aparte) que permite a estudiantes de diseño gráfico generar composiciones visuales jugando con dithering y "píxeles" custom: shapes SVG, emoji, letras ASCII o colores. Es una **herramienta de juego y exploración en clase**, sin login, sin pagos, sin cuentas — abrís la URL y diseñás.

El módulo se suma a las pantallas existentes (`index`, `admin`, `ar`, `marker`) como una nueva entrada del nav: **"Componer"**. Las piezas generadas pueden además **subirse como posters al admin** y verse en AR sobre el marcador, cerrando el loop con lo que ya hace AR-LDG.

Inspiración del flujo: post de Anton Burmistrov (Part 119) sobre dithering manual SVG → HTML → filtro tonal. La idea es convertir eso en algo que un estudiante pueda usar en 30 segundos sin tutorial.

---

## 2. Por qué hacerlo

- En clase de diseño gráfico, los/las estudiantes ven estética dithering / ASCII en redes pero replicarla requiere Photoshop o código.
- AR-LDG ya tiene un caso de uso educativo (montar exposiciones AR con posters). Composer agrega el paso anterior: **crear el poster en el browser** sin software pago.
- El profesor puede dar una consigna ("componé algo con tres shapes y dos colores") y todo el curso trabaja desde cualquier laptop o celular.

---

## 3. Objetivos

### Producto
1. Que un estudiante sin experiencia previa genere una composición exportable en **< 3 minutos**.
2. Que la composición exportada **se pueda subir directo al admin** de AR-LDG y verse en AR.
3. Que **no haya cuentas, login ni pagos** — todo client-side y compartible por URL.

### Métricas de uso (en clase piloto)
- ≥ 80% de estudiantes del curso piloto logran exportar al menos 1 pieza en la primera clase de 40 min.
- ≥ 50% suben su pieza al módulo AR y la ven sobre el marcador en la misma sesión.
- Feedback cualitativo del/la docente: "fue jugable" / "lo usaría de nuevo".

### No-objetivos
- No hay cuentas ni perfiles.
- No hay monetización, ads, marketplace ni planes pagos.
- No es una herramienta profesional de producción — la meta es **explorar y jugar**, no reemplazar Photoshop.
- No requiere backend nuevo: todo corre en el browser; persistencia mínima vía URL con estado serializado.

---

## 4. Usuarios

| Rol | Necesidad | Contexto |
|---|---|---|
| **Estudiante de diseño** | Generar piezas rápido para una consigna de clase | Laptop o celular, 40–90 min de clase |
| **Docente** | Dar una consigna replicable, mostrar resultados en vivo, proyectar | Computadora del aula |
| **Visitante de la galería AR** | Ver las piezas resultantes como exposición | Celular escaneando el marcador |

---

## 5. Integración con el sitio actual

### Estructura actual del sitio
```
index.html       Landing (Hero, Cómo funciona)
admin.html       Subida de posters
ar.html          Visualización AR (entry)
ar-gyro.html     Variante AR (giroscopio)
ar-marker.html   Variante AR (marker tracking)
ar-webxr.html    Variante AR (WebXR)
marker.html      Marcador imprimible
```

### Cambios al sitio
- **Nuevo archivo:** `composer.html` con el editor.
- **Nuevo link en el nav** (todas las páginas): `Componer` entre `Admin` y `Ver AR`.
- **Botón en `composer.html`:** "Enviar a AR" → carga la pieza exportada al mismo storage que usa `admin.html` (localStorage del navegador, igual que el resto del sitio).
- **Sección nueva en `index.html`:** un cuarto step antes del flujo actual ("0. Componé tus piezas en el navegador") o sumarlo como camino alternativo en el hero.
- **Sin cambios** en `marker.html`, `ar-*.html`: la pieza generada es solo otra imagen del set de posters.

### Stack — alinearse con lo que ya hay
- HTML/CSS/JS vanilla, sin frameworks (consistente con `index.html` actual).
- Estilos en `css/style.css` existente (extender, no romper).
- Scripts en `js/` (crear `js/composer.js`).
- Sin backend, sin Supabase, sin auth — persistencia en `localStorage` igual que `admin.html`.

---

## 6. Funcionalidades

### 6.1 MVP — lo mínimo para llevar a clase
- [ ] Entrada de imagen: subir archivo (JPG/PNG/WebP) o usar webcam.
- [ ] Motor de dithering en `<canvas>` 2D con 3 bandas tonales (highlights / mids / shadows).
- [ ] Para cada banda, elegir:
  - Shape (galería built-in: círculo, cuadrado, triángulo, rombo, línea, asterisco, plus, dot — 8 shapes).
  - Color (color picker simple).
  - O un carácter / emoji (input de texto, 1 glifo).
- [ ] Slider de **densidad de grilla** (10×10 hasta 120×120).
- [ ] Slider de **espaciado** entre celdas.
- [ ] Color de fondo.
- [ ] Preview en vivo (< 100 ms por cambio sobre imagen ≤ 2 MP).
- [ ] **Export PNG** (download directo).
- [ ] **"Enviar a AR"** → guarda la pieza en `localStorage` para que `admin.html`/`ar.html` la lean.
- [ ] **Compartir por URL** → estado completo serializado en query string (`composer.html?cfg=...`) para que el docente proyecte la misma config en clase.

### 6.2 Nice-to-have (si sobra tiempo en el sprint)
- [ ] Subir SVG propio como shape custom (sanitizado).
- [ ] 5 presets de partida para que la primera vez no esté en blanco.
- [ ] Modo "consigna del día" — el docente arma una URL con config base y la pega en el aula virtual.
- [ ] Export SVG además de PNG.

### 6.3 Fuera de scope
- Auth, cuentas, perfiles.
- Galería pública con likes / búsqueda.
- Procesamiento de video.
- API / componente embebible.
- Marketplace / planes pagos.

---

## 7. Flujo principal

1. Estudiante abre `composer.html` (puede llegar desde el nav o desde una URL compartida por el/la docente con la consigna).
2. Si la URL trae `?cfg=...`, los controles se inicializan con esa config; si no, arranca con un preset default.
3. Sube una imagen o activa webcam.
4. Mueve sliders y elige shape + color por banda; ve el preview cambiar en vivo.
5. Acciones de salida:
   - **Descargar PNG.**
   - **Enviar a AR** → la pieza queda lista en `admin.html` como un poster más.
   - **Copiar link** → URL con la config para que cualquiera abra y vea el mismo render.
6. Va a `ar.html` desde su celular, escanea el marcador, y ve su pieza colgada en la pared.

---

## 8. UX

### Layout desktop (`composer.html`)
```
+---------------------------------------------------------------+
| AR GALLERY    Inicio · Admin · [Componer] · Ver AR             |
+--------------------+------------------------------------------+
|                    |                                          |
|  Fuente            |                                          |
|  [Subir] [Webcam]  |          CANVAS / PREVIEW                |
|                    |                                          |
|  Grilla   [——●——]  |                                          |
|  Espaciado[——●——]  |                                          |
|                    |                                          |
|  Highlights        |                                          |
|   ◯ ▢ △ ◇ + ✦ · *  |                                          |
|   color: [■]       |                                          |
|   o glifo: [   ]   |                                          |
|                    |                                          |
|  Midtones  (idem)  |                                          |
|  Shadows   (idem)  |                                          |
|                    |                                          |
|  Fondo: [■]        |                                          |
|                    |                                          |
|  [Descargar PNG]   |                                          |
|  [Enviar a AR]     |                                          |
|  [Copiar link]     |                                          |
+--------------------+------------------------------------------+
```

### Mobile
- Panel de controles colapsable como bottom sheet.
- Canvas ocupa todo el viewport detrás.
- Sliders y selección de shape en una sola columna scrolleable.

### Estilo visual
- Coherente con el resto del sitio (mismo nav, misma tipografía, misma paleta del `css/style.css`).
- Sin librerías de UI nuevas.

---

## 9. Notas técnicas

- **Render:** loop sobre la grilla; por cada celda, sampleo de luminancia del pixel correspondiente de la fuente, mapeo a banda (umbrales editables en futuro, fijos en MVP: 0–85 shadow, 86–170 mid, 171–255 highlight), draw del shape/glifo en esa celda.
- **Webcam:** `getUserMedia` → `<video>` oculto → `drawImage` al canvas → mismo pipeline.
- **Performance objetivo:** grilla 80×80 sobre imagen 2 MP a 24+ FPS en laptop modesta. Si no llega, bajar densidad por device tier.
- **Persistencia:**
  - Config del editor: solo en URL (`?cfg=` base64 del JSON).
  - Pieza enviada a AR: `localStorage`, misma key que use `admin.html` (chequear antes de implementar).
- **Sanitización SVG (si se implementa custom shapes):** whitelist de tags (`svg, path, circle, rect, polygon, line, g`) y atributos; sin `<script>`, sin `on*`, sin `href` externos.
- **Privacidad:** webcam nunca sale del browser; imágenes subidas tampoco. No hay tracking.

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Estudiantes con laptops viejas → FPS bajo | Detección de device tier; cap de grilla en mobile/low-end. |
| Conflicto de keys en `localStorage` con admin actual | Auditar `admin.html` antes; usar la misma estructura. |
| Curva de aprendizaje en clase de 40 min | Default preset visible al abrir + 3 piezas ejemplo en hover. |
| Imagen pesada cuelga el browser | Resize automático al cargar (max 2 MP). |
| Webcam denegada / no disponible | Fallback a imagen subida; mensaje claro. |

---

## 11. Roadmap

| Semana | Hito |
|---|---|
| 1 | Spike del motor de dithering en `<canvas>` con 3 bandas (sin UI). |
| 2 | UI del editor + shapes built-in + sliders + export PNG. |
| 3 | Integración con `admin.html`/`ar.html` ("Enviar a AR") + nav update + URL share. |
| 4 | Webcam + presets de partida + QA con un grupo piloto de estudiantes. |
| 5 | Ajustes post-piloto + docs para el/la docente. |

---

## 12. Preguntas abiertas

1. ¿El nombre del módulo es "Componer" o algo más jugable (ej. "Pixel Lab", "Trama")?
2. ¿La consigna inicial para la primera clase la define el equipo o el/la docente?
3. ¿Vale la pena el modo "consigna del día" (URL con config base) ya en el MVP, o lo dejamos para después del primer piloto?
4. ¿Querés que la pieza enviada a AR conserve metadata (config usada) para reabrirla y editarla, o se trata como imagen final inmutable?

---

## 13. Apéndice — Inspiración

Post de Anton Burmistrov (Part 119): flujo manual SVG → HTML generado por IA → filtro de dithering que swapea highlights/midtones/shadows por shapes custom. Composer toma ese flujo y lo vuelve un editor visual jugable, integrado en una herramienta que los estudiantes ya van a usar para montar la exposición AR.
