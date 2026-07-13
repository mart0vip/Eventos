# Identidad de Marca — Club Hípico Argentino

**Sitio:** clubhipicoargentino.org.ar
**Desarrollado por:** Latika IT
**CMS:** WordPress 6.2.2
**Fecha de relevamiento:** Julio 2026

---

## 1. LOGOTIPO

| Variante | URL | Uso |
|---|---|---|
| Logo principal (circular, color) | `/wp-content/uploads/2019/03/logo-90.png` | Header, interior |
| Logo blanco (footer) | `/wp-content/uploads/2019/02/logo-blanco-footer.png` | Pie de página |

**Descripción:**
Escudo circular con las iniciales estilizadas "CHA" sobre un fondo azul con borde blanco. El texto perimetral dice "CLUB HÍPICO ARGENTINO". El símbolo central incluye elementos ecuestres (saltador con valla). Tamaño de referencia: 90×90 px. El logo blanco se usa sobre fondos oscuros/azulados en el footer.

---

## 2. PALETA DE COLORES

| Nombre | HEX | RGB | Uso |
|---|---|---|---|
| **Azul Primario** | `#0096DC` | rgb(0, 150, 220) | Top bar, nav activo, hover, acentos |
| **Azul Marca (CSS)** | `#2194D3` | rgb(33, 148, 211) | Botones hover, links activos |
| **Texto Oscuro** | `#3C3C3B` | rgb(60, 60, 59) | Cuerpo de texto, párrafos |
| **Headings Negro** | `#111111` | rgb(17, 17, 17) | Títulos H3+ |
| **Blanco** | `#FFFFFF` | rgb(255, 255, 255) | Nav, botones, texto sobre azul |
| **Gris Footer BG** | `#242424` | rgb(36, 36, 36) | Fondo del pie de página |
| **Gris Claro Footer** | `#F7F7F7` | rgb(247, 247, 247) | Texto en footer |
| **Gris Link** | `#545454` | rgb(84, 84, 84) | Links en reposo |
| **Gris Borde** | `#E6E6E6` | rgb(230, 230, 230) | Bordes, divisores |

**Descripción de la paleta:**
Identidad bicolor predominante — azul deportivo + blanco, con neutros oscuros para contraste. El azul `#0096DC` es el color identificatorio principal del club.

---

## 3. TIPOGRAFÍA

### Fuente Principal — Navegación y Títulos
**Montserrat** (Google Fonts)
- Uso: Menú de navegación, headings H3
- Peso: 600–700 (SemiBold / Bold)
- Tamaño nav: 12px, UPPERCASE, letter-spacing: 0.5px
- Tamaño H3: 20px, Bold, line-height: 27px

### Fuente de Cuerpo — Texto General
**Open Sans** (Google Fonts)
- Uso: Párrafos, botones, footer, labels
- Peso: 400 (Regular) para cuerpo; 700 (Bold) para botones grandes
- Tamaño: 15px, line-height: 25.5px
- Color base: `#3C3C3B`

### Fuentes de Íconos
- **FontAwesome** — íconos generales (redes sociales, UI)
- **ElegantIcons** — íconos decorativos del tema
- **WP Event Manager Font** — íconos específicos del módulo de eventos

---

## 4. JERARQUÍA TIPOGRÁFICA

| Elemento | Fuente | Tamaño | Peso | Color |
|---|---|---|---|---|
| Nav links | Montserrat | 12px | 600 | `#FFFFFF` / activo `#0096DC` |
| H3 títulos | Montserrat | 20px | 700 | `#111111` |
| Slider hero (display) | Montserrat | ~27–40px | 700 | `#FFFFFF` |
| Cuerpo / párrafos | Open Sans | 15px | 400 | `#3C3C3B` |
| Botones CTAs | Open Sans | 27px | 700 | `#FFFFFF` |
| Footer texto | Open Sans | 15px | 400 | `#F7F7F7` |
| Top bar info | Open Sans | 12px | 400 | `#FFFFFF` |

---

## 5. IMÁGENES Y RECURSOS VISUALES

### Logo
- `https://clubhipicoargentino.org.ar/wp-content/uploads/2019/03/logo-90.png` — Logo color (90×90 px)
- `https://clubhipicoargentino.org.ar/wp-content/uploads/2019/02/logo-blanco-footer.png` — Logo blanco (122×123 px)

### Imagen de Marca / Miscelánea
- `https://clubhipicoargentino.org.ar/wp-content/uploads/2019/02/miselanea1.png` — Ilustración decorativa (474×422 px)

### Hero / Slider (Revolution Slider)
- `https://clubhipicoargentino.org.ar/wp-content/uploads/2021/03/IMG-20210317-WA0032.jpg` — Slide 1
- `https://clubhipicoargentino.org.ar/wp-content/uploads/2021/03/IMG-20210317-WA0034.jpg` — Slide 2

### Fondos de Sección (Parallax)
- `https://clubhipicoargentino.org.ar/wp-content/uploads/2019/02/bg-resultados.jpg` — Sección Resultados
- `https://clubhipicoargentino.org.ar/wp-content/uploads/2019/02/bg-adiestramiento.jpg` — Sección Adiestramiento
- `https://clubhipicoargentino.org.ar/wp-content/uploads/2019/02/bg-socios.jpg` — Sección Socios
- `https://clubhipicoargentino.org.ar/wp-content/uploads/2019/02/bg-footer.jpg` — Fondo Footer

**Estilo fotográfico:**
Imágenes de equitación en competencias reales. Los fondos de sección usan superposición semitransparente azul/oscuro para mantener legibilidad del texto. Estética deportiva e institucional.

---

## 6. ELEMENTOS DE DISEÑO / UI PATTERNS

**Botones:**
Sin border-radius (esquinas cuadradas, `border-radius: 0px`). Texto en mayúsculas, Open Sans Bold. Estilo outline (borde blanco sobre fondo transparente) en contextos oscuros.

**Overlay decorativo:**
Arco circular en azul de marca (`#0096DC`) que aparece como elemento gráfico decorativo en secciones intermedias (visible en sección "Socios" en la home).

**Cards de eventos:**
Fondo oscuro semi-transparente con fecha, título y datos del evento. Estilo sobrio y funcional.

**Separadores:**
Líneas finas en `#E6E6E6` para dividir bloques de contenido.

**Top bar:**
Barra horizontal full-width en azul `#0096DC`, con datos de contacto (email + teléfono) e íconos de redes sociales (Facebook, Instagram).

---

## 7. ESTRUCTURA DE LAYOUT

- **Header sticky** blanco con logo a la izquierda + menú horizontal a la derecha.
- **Top bar** azul con info de contacto (siempre visible arriba de todo).
- **Hero slider** full-width con Revolution Slider (imágenes de competencias).
- **Secciones alternadas** con fondos de imagen parallax + overlay de color.
- **Footer** fondo muy oscuro (`#242424`) con logo blanco centrado, nombre del club en display grande, copyright y crédito de desarrollador.

---

## 8. NAVEGACIÓN

Menú principal horizontal con items:
- HOME
- INSTITUCIONAL
- SALTO (con submenú: Próximos Concursos, Resultados)
- ADIESTRAMIENTO (con submenú: Próximos Concursos)
- SOCIOS
- ESCUELA
- EVENTOS
- CONTACTO

---

## 9. REDES SOCIALES Y CONTACTO

| Canal | Dato |
|---|---|
| Facebook | facebook.com/hipicoargentinofanpage |
| Instagram | instagram.com/clubhipicoargentino |
| Email | secretaria@clubhipicoargentino.org.ar |
| Teléfono | +54 11-4787-1003 |

---

## 10. STACK TECNOLÓGICO

| Componente | Tecnología |
|---|---|
| CMS | WordPress 6.2.2 |
| Tema | RealFactory / GoodLayers Core |
| Slider | Revolution Slider 5.4.1 |
| Gestión de Eventos | WP Event Manager v3.1.34 |
| Formularios | Contact Form 7 v5.7.7 |
| SEO | All in One SEO (AIOSEO) 4.4.0.1 |
| Fuentes | Google Fonts (Montserrat + Open Sans) |
| Íconos | FontAwesome + ElegantIcons |
| Desarrollador | Latika IT (latikait.com) |

---

## 11. RESUMEN DE IDENTIDAD DE MARCA

El Club Hípico Argentino proyecta una identidad **deportiva, institucional y tradicional**, basada en:

- **Color:** Azul `#0096DC` como color central de marca (deporte, confianza, dinamismo).
- **Tipografía:** Montserrat para display (moderna, geométrica, deportiva) + Open Sans para cuerpo (legibilidad).
- **Fotografía:** Imágenes reales de competencias ecuestres como eje visual principal.
- **Diseño:** Limpio y funcional, sin decorados excesivos, con énfasis en información deportiva (concursos, resultados, eventos).
- **Logo:** Escudo circular institucional que evoca tradición y formalidad del deporte ecuestre argentino.
- **Tono:** Institucional, formal, orientado a la comunidad hípica profesional y familiar.

---

*Documento generado automáticamente — Julio 2026*
