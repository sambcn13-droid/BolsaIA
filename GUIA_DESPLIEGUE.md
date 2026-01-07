# Guía de Despliegue Online para BolsaIA

Para que tu aplicación funcione correctamente en internet (Netlify), necesitas dos partes funcionando simultáneamente:

1.  **Frontend (Visible)**: Tu interfaz en React (Ya está en Netlify).
2.  **Backend (Cerebro)**: Tu servidor Python (Necesitamos subirlo a Render).

Actualmente, tu Netlify intenta conectarse a tu ordenador local (o a nada), por eso no carga datos. Sigue estos pasos para solucionarlo:

## Paso 1: Subir el Backend a Render.com (Gratis)

Render es un servicio excelente para alojar servidores Python gratis.

1.  Asegúrate de que tu código actual (carpeta `BolsaIA`) esté subido a **GitHub**.
2.  Crea una cuenta en [Render.com](https://render.com/).
3.  En el Dashboard de Render, haz clic en **New +** y selecciona **Web Service**.
4.  Conecta tu repositorio de GitHub.
5.  Render detectará el archivo `render.yaml` que he creado y configurará casi todo automáticamente. Si no lo detecta, configura manualmente:
    *   **Root Directory**: `.` (o déjalo vacío)
    *   **Build Command**: `pip install -r backend/requirements.txt`
    *   **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
6.  **IMPORTANTE (Variables de Entorno)**:
    Antes de finalizar, busca la sección "Environment Variables" en Render (o Advanced) y añade tus claves (las mismas que tienes en tu `.env` local):
    *   `GEMINI_API_KEY`: (Tu clave de Google Gemini)
    *   `SUPABASE_URL`: (Tu URL de Supabase)
    *   `SUPABASE_ANON_KEY`: (Tu clave Anon de Supabase)
7.  Haz clic en **Create Web Service**. Espera a que termine el despliegue (tardará unos minutos).
8.  Al finalizar, Render te dará una URL (ejemplo: `https://bolsaia-backend.onrender.com`). **Copia esta URL**.

## Paso 2: Conectar Netlify con el Backend

Ahora dile a tu frontend en Netlify dónde está el cerebro Python.

1.  Ve a tu panel de **Netlify** -> Tu proyecto -> **Site configuration**.
2.  Busca **Environment variables** en el menú lateral.
3.  Añade una nueva variable:
    *   **Key**: `VITE_API_URL`
    *   **Value**: `https://TU-APP-EN-RENDER.onrender.com/api` (Asegúrate de añadir `/api` al final si tu backend espera esa ruta base, aunque el código cliente suele añadir los endpoints. En tu `client.js` la base es `/api`, así que la URL debe ser la raíz del servidor + `/api`. **OJO**: Tu `client.js` concatena `/quote/...` a la `API_URL`.
        *   Si pones `...onrender.com`, `client.js` buscará `...onrender.com/quote`.
        *   Si pones `...onrender.com/api`, buscará `...onrender.com/api/quote`.
        *   Revisando tu código backend: `@app.get("/api/quote/{symbol}")`.
        *   **CORRECTO**: Pon el valor `https://<nombre-app>.onrender.com/api`.

4.  Añade también las variables de Supabase si tu frontend las usa directamente (opcional si todo pasa por backend, pero buena práctica si usas login en frontend):
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`

## Paso 3: Redesplegar Frontend

1.  En Netlify, ve a **Deploys**.
2.  Haz clic en **Trigger deploy** -> **Deploy site**.
3.  Esto reconstruirá tu frontend con la nueva URL del backend inyectada.

¡Y listo! Tu aplicación debería funcionar online.
