# brandonbybran — Personal Site & Minigames

Un sitio web personal tipo "link-in-bio" interactivo, construido con **Next.js 16 (App Router)**, **React 19**, y **Tailwind CSS**. 

Este proyecto no solo sirve como portal hacia las redes sociales del creador (@brandonbybran), sino que incluye una colección de minijuegos interactivos completos y un sistema de temas visuales dinámicos.

## ✨ Características Principales

- **Sistema de Temas Dinámicos:** Selector de 16 paletas de colores distintas inspiradas en `shadcn/ui`, con soporte para modo claro/oscuro persistente vía `localStorage`.
- **Link-in-Bio:** Enlaces directos a redes sociales (Instagram, YouTube, TikTok) integrados de forma limpia y accesible.
- **Optimización SEO & JSON-LD:** Completamente preparado para motores de búsqueda e Inteligencias Artificiales, con Sitemap, Robots.txt y marcado Schema.org (`Person`).
- **Responsive Design:** Interfaces que se adaptan perfectamente a pantallas móviles y de escritorio.

## 🎮 Minijuegos Integrados

1. **Clicker (Idle Shop):** Un juego incremental donde el usuario genera "clics", pudiendo invertir su puntuación en una tienda de herramientas (Cursor, Abuelita, Bot, etc.) que generan CPS (Clics Por Segundo) automáticos.
2. **Ping Pong:** El clásico juego de arcade implementado en Canvas (`2D Context`). Soporta teclado para ordenadores (W/S y Flechas) y botones táctiles en pantalla para dispositivos móviles.
3. **Laser Terror:** Un minijuego de agilidad y precisión basado en esquivar obstáculos ("fantasmas") y sobrevivir el mayor tiempo posible usando el puntero del ratón o el dedo.

## 🛠️ Stack Tecnológico

- **Framework:** Next.js (App Router, Turbopack)
- **UI & Styling:** Tailwind CSS + Variables CSS Dinámicas
- **Componentes:** Componentes base accesibles y personalizables
- **Despliegue:** Preparado para Vercel o cualquier entorno de Node.js

## 🚀 Instalación y Desarrollo Local

1. Instala las dependencias (se recomienda usar `pnpm`):
   ```bash
   pnpm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```
3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## 📦 Producción

Para compilar y ejecutar el proyecto para producción:

```bash
pnpm build
pnpm start
```
