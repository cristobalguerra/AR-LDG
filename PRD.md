# PRD — Plataforma de Diseño ASCII / Dithering Editable

**Nombre tentativo:** Ditherlab
**Autor:** Equipo AR-LDG
**Versión:** 0.1 (Draft)
**Fecha:** 2026-05-20
**Estado:** En revisión

---

## 1. Resumen ejecutivo

Ditherlab es una plataforma web que permite a cualquier persona generar arte tipo ASCII / dithering a partir de una imagen, video o webcam, reemplazando los píxeles por **formas vectoriales personalizadas** (SVG, emoji, texto ASCII, etc.). El usuario controla la forma, el color y el tamaño de los píxeles de salida según su tono (highlights, midtones, shadows) y obtiene un resultado exportable como imagen, video o componente embebible.

La inspiración viene del flujo manual descrito por Anton Burmistrov (Part 119): crear shapes en SVG → aplicar un filtro de dithering que mapea tonos a shapes → iterar visualmente. Ditherlab convierte ese flujo manual en una herramienta visual con presets, capas y exportación.

---

## 2. Problema

Hoy, generar este tipo de gráfica requiere:
- Conocer suficientemente Photoshop / After Effects / código.
- Pedir a una IA generativa que produzca HTML/CSS/JS y debuggearlo a mano.
- Iterar manualmente sobre cada combinación tono ↔ forma.

Esto deja fuera a diseñadores junior, creadores de contenido, marketers y comunidades creativas que ven el resultado en redes pero no pueden replicarlo. Tampoco existe una herramienta que permita **guardar presets, compartir estilos y editar en vivo** con webcam o video.

---

## 3. Objetivos y métricas de éxito

### Objetivos producto
1. Que un usuario sin código pueda producir una pieza tipo "ASCII art" custom en **menos de 5 minutos** desde la primera visita.
2. Que el resultado sea exportable en al menos 3 formatos (PNG, SVG, MP4/GIF).
3. Que la plataforma permita compartir presets entre usuarios (URL pública).

### KPIs (primeros 90 días post-launch)
| Métrica | Target |
|---|---|
| Activación (usuario que exporta al menos 1 pieza) | ≥ 35% de visitantes únicos |
| Tiempo a primer export | < 5 min mediana |
| Presets públicos creados | ≥ 200 |
| Retención semana 4 | ≥ 15% |
| NPS | ≥ 40 |

### No-objetivos (v1)
- No es un editor de imágenes completo (no compite con Photoshop).
- No soporta animación frame-by-frame en v1 (solo render de video como secuencia).
- No incluye marketplace pago de presets en v1.

---

## 4. Usuarios objetivo

| Persona | Necesidad | Frecuencia esperada |
|---|---|---|
| **Diseñador/a visual junior–mid** | Producir gráfica con identidad propia sin código | Semanal |
| **Creador/a de contenido (TikTok/IG)** | Generar videos cortos con estética dithering | 1–3 por semana |
| **Director/a de arte de agencia** | Explorar estilos para campañas, exportar para entregables | Por proyecto |
| **Educador/a o estudiante de arte digital** | Aprender dithering / pixel art interactuando | Mensual |
| **Dev creativo** | Embeber el render en su propia web vía componente o API | Por proyecto |

---

## 5. Flujos de usuario clave

### 5.1 Flujo principal — "De imagen a pieza" (MVP)
1. Usuario entra a la home → ve un demo en vivo con webcam o imagen default.
2. Sube imagen / activa webcam / pega URL / elige stock.
3. Elige un **preset** (3–6 al inicio) o arranca de cero.
4. En el panel lateral edita:
   - Mapeo tonal: shape/color/tamaño para highlights, midtones, shadows.
   - Resolución de grilla (densidad de píxeles).
   - Espaciado y rotación.
   - Paleta de colores (fondo + acentos).
5. Ve el preview actualizándose en tiempo real (< 100 ms por frame en canvas).
6. Exporta: PNG / SVG / MP4 / GIF / link compartible.

### 5.2 Flujo secundario — "Custom shapes"
1. Usuario sube un SVG propio o lo dibuja en un mini-editor.
2. Lo asigna a uno de los tres tramos tonales (o a un valor específico).
3. Guarda el preset (privado o público).

### 5.3 Flujo secundario — "Webcam live"
1. Usuario activa webcam → ve su cara dithered en vivo.
2. Puede grabar 5–15 s y exportar como MP4/GIF.
3. Útil para contenido social y para demos en presentaciones.

### 5.4 Flujo secundario — "Compartir preset"
1. Usuario hace público un preset → recibe URL `ditherlab.app/p/{slug}`.
2. Otro usuario abre la URL → ve la pieza renderizada + botón "Editar copia".

---

## 6. Funcionalidades

### 6.1 MVP (v1.0)
- [ ] Entrada: subir imagen (JPG/PNG/WebP), drag&drop, webcam, URL pública.
- [ ] Motor de dithering en canvas/WebGL con mapeo tonal a 3 bandas (highlights / mids / shadows).
- [ ] Librería de shapes built-in (≥ 12: círculo, cuadrado, triángulo, rombo, líneas, emoji básicos).
- [ ] Subida de SVG custom como shape.
- [ ] Controles: densidad de grilla, espaciado, rotación, paleta de hasta 5 colores, color de fondo.
- [ ] Texto ASCII como shape (cualquier glifo / palabra como "píxel").
- [ ] Preview en vivo (< 100 ms para imágenes ≤ 2 MP).
- [ ] Export PNG y SVG.
- [ ] Presets default (mínimo 6 estilos curados).
- [ ] Guardar presets propios (auth simple — magic link).
- [ ] Compartir preset vía URL pública.

### 6.2 v1.1 (post-launch, ~6 semanas después)
- [ ] Webcam en vivo con grabación a MP4/GIF (5–30 s).
- [ ] Procesamiento de video subido (export como secuencia o MP4).
- [ ] Más bandas tonales (5–7 en vez de 3 fijas).
- [ ] Curva tonal editable (no solo bandas).
- [ ] Galería pública de presets con búsqueda y likes.

### 6.3 Backlog (v2+)
- [ ] API/SDK para embeber el render en sitios de terceros.
- [ ] Web Component `<ditherlab-canvas src="..." preset="..."/>`.
- [ ] Integración con cámaras de móvil (PWA con permisos nativos).
- [ ] Marketplace de presets (gratis + pago).
- [ ] Modo colaborativo en tiempo real.
- [ ] Plug-in de Figma que exporta una capa con el efecto aplicado.
- [ ] Integración con la galería AR de este proyecto (AR-LDG) para mostrar piezas dithered como posters en realidad aumentada.

---

## 7. Requisitos técnicos

### 7.1 Stack sugerido
- **Frontend:** Vite + TypeScript + React. Canvas 2D para v1; migrar a WebGL (shaders) si el FPS no alcanza con grillas densas o webcam.
- **Procesamiento:** Worker thread para dithering pesado; `OffscreenCanvas` donde sea soportado.
- **Backend:** Supabase (auth magic link, storage para SVGs subidos, Postgres para presets).
- **Hosting:** Vercel o Cloudflare Pages para el frontend; Supabase para el resto.
- **Export de video:** `MediaRecorder` para webcam; `ffmpeg.wasm` para video subido.

### 7.2 Modelo de datos (Supabase / Postgres)
```
users (id, email, created_at)
shapes (id, owner_id, name, svg_blob, is_public, created_at)
presets (
  id, owner_id, slug, name,
  config_json,   -- grilla, mapeo tonal, paleta, shapes refs
  thumbnail_url,
  is_public, fork_of, created_at, updated_at
)
renders (id, preset_id, source_type, source_hash, output_url, created_at)
likes (user_id, preset_id, created_at)
```

### 7.3 Performance
- Imagen 2 MP @ grilla 80×80 → < 100 ms por frame en laptop M1 / equivalente.
- Webcam 720p @ grilla 60×60 → ≥ 24 FPS sostenido.
- Bundle inicial < 250 KB gzipped (sin el motor de video).

### 7.4 Privacidad y seguridad
- Imágenes/videos subidos se procesan client-side por default; solo se suben al backend si el usuario guarda render.
- Webcam nunca se transmite al servidor.
- SVGs subidos se sanitizan (whitelist de tags / atributos) antes de renderizar.
- Auth con magic link (no passwords).
- Cumplimiento GDPR básico: borrar cuenta + datos a pedido.

### 7.5 Accesibilidad
- WCAG 2.1 AA en UI.
- Todos los controles operables por teclado.
- Modo "alto contraste" para el panel de edición.
- Descripción textual generada para piezas exportadas (alt text).

---

## 8. UX / Wireframes (descripción)

**Layout principal (desktop):**
```
+---------------------------------------------------------------+
| Logo  Ditherlab          [ Presets ] [ Galería ] [ Login ]    |
+--------------------+------------------------------------------+
|                    |                                          |
|   PANEL DE         |                                          |
|   EDICIÓN          |          CANVAS / PREVIEW                |
|                    |          (drag & drop aquí)              |
|  - Source          |                                          |
|  - Grilla          |                                          |
|  - Shapes/banda    |                                          |
|  - Paleta          |                                          |
|  - Export          |                                          |
|                    |                                          |
+--------------------+------------------------------------------+
```

**Mobile:** panel colapsable como bottom-sheet; canvas full-width.

---

## 9. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Performance pobre en mobile mid-range | Alto | Limitar grilla por device tier; lazy load WebGL; degradar a Canvas 2D. |
| Costos de storage por subida de imágenes | Medio | Procesar client-side; subir solo render final o thumbnail. |
| Curva de aprendizaje muy alta | Alto | 6 presets de calidad al iniciar + onboarding interactivo de 30 s. |
| SVG malicioso subido por usuario | Alto | Sanitización estricta + sandbox iframe para render. |
| Comparación con herramientas free existentes | Medio | Diferenciar con webcam live + presets compartibles + AR integration. |
| Licencias de stock images | Medio | Solo aceptar uploads del usuario + librería propia/CC0 curada. |

---

## 10. Roadmap propuesto

| Semana | Hito |
|---|---|
| 1–2 | Spike técnico: motor de dithering en canvas + 3 bandas tonales, sin UI. |
| 3–4 | UI básica del editor, presets hardcoded, export PNG. |
| 5–6 | Auth + persistencia de presets en Supabase + URL pública. |
| 7 | Export SVG + onboarding + landing. |
| 8 | Beta cerrada (~30 usuarios). |
| 9 | Iteración sobre feedback de beta. |
| 10 | **Launch v1.0.** |
| 12–14 | v1.1: webcam live + video. |
| 16+ | Galería pública + API embed. |

---

## 11. Preguntas abiertas

1. ¿Monetización? Freemium (export con marca de agua para free, sin marca para pago) vs. donaciones vs. 100% free open-source.
2. ¿Open source el motor de dithering? Sería un acelerador de adopción técnica.
3. ¿Integrar con la galería AR de este repo desde v1 o dejarlo para v2?
4. ¿Soporte de browsers? Definir baseline (¿Chromium + Safari 16+ + Firefox 115+?).
5. ¿Necesitamos moderación de contenido en la galería pública desde día 1?

---

## 12. Apéndice — Inspiración

- Post de referencia: Anton Burmistrov, "Part 119", describiendo el flujo manual SVG → HTML → filtro de dithering.
- Técnicas relacionadas: Floyd-Steinberg dithering, ordered dithering (Bayer), ASCII art generators clásicos.
- Diferenciadores clave de Ditherlab vs. estado del arte: control total sobre la **forma** del píxel (no solo carácter), edición visual sin código, presets compartibles, integración con webcam y AR.
