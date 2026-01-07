# Mini Kahoot — Guía de uso (Español)

Mini Kahoot es una aplicación estática (HTML/CSS/JS) para crear y realizar cuestionarios desde archivos JSON por temas. Está diseñada para usarse en navegadores de escritorio y móviles y puede desplegarse en cualquier hosting estático (GitHub Pages, Cloudflare Pages, Netlify...).

IMPORTANTE: La app carga las preguntas mediante `fetch()` desde archivos JSON, por lo que debe servirse por HTTP/HTTPS (no funciona abriendo `index.html` con `file://`).

**Resumen de funcionalidades**

- Varios temas (Tema 1..5) con preguntas almacenadas en `questions.json`, `questionsT2.json`, ..., `questionsT5.json`.
- Modo `Mix`: combina preguntas de todos los temas y toma N preguntas (configurable con `Número de preguntas`).
- Controles de juego: Iniciar, Anterior, Saltar, Terminar intento, Reiniciar.
- Contadores en tiempo real (correctas / incorrectas / no contestadas) y animaciones visuales.
- Opción para barajar respuestas por pregunta y opción para mezclar el orden de preguntas por tema.
- Tema claro/oscuro persistente en `localStorage`.
- Editor de preguntas integrado:
  - Abrir `Editor de preguntas` desde la pantalla de inicio.
  - Seleccionar tema a editar.
  - Entrar en `Editar` para modificar texto de pregunta y texto de cada respuesta, y seleccionar la respuesta correcta.
  - `Guardar` persiste los cambios en `localStorage` (por tema).
  - `Cancelar` descarta cambios no guardados.
  - `Resetear tema` restaura el tema desde el JSON original (elimina los edits locales de ese tema).
  - `Resetear todos` restaura todos los temas.
  - `Exportar JSON` descarga el JSON del tema (útil para subir al repo y compartir cambios).

Cómo funcionan las ediciones

- Las ediciones realizadas en el editor se guardan en `localStorage` bajo la clave `kahoot_edits_theme_<tema>`.
- El sitio al cargar aplica automáticamente las ediciones guardadas (si existen) para mostrar las preguntas modificadas.
- Si quieres que los cambios sean permanentes para todos, usa `Exportar JSON` y reemplaza el archivo JSON en el repositorio (o pégalo a un compañero).
- Si algo no funciona: ve al editor y `Resetear tema` para recuperar el JSON original.

Probar localmente

Opciones rápidas (desde la carpeta del proyecto):

- Con Python 3:

```powershell
python -m http.server 8000
# abrir http://localhost:8000
```

- Con Node (si tienes Node.js):

```powershell
npx http-server -p 8000
```

- PowerShell (script incluido):

```powershell
./serve.ps1
```

Despliegue recomendado (disponibilidad y uso móvil)

- GitHub Pages: rápido y gratis; conecta tu repositorio y activa Pages en Settings → Pages. Perfecto para proyectos estáticos y suficiente para tus compañeros.
- Cloudflare Pages: ofrece CDN global y despliegues rápidos; recomendado si esperas tráfico desde muchos países o quieres baja latencia.
- Netlify / Vercel: también funcionarán bien — soportan despliegues automáticos desde Git.

Cualquiera de estas opciones sirve HTTPS por defecto y funciona en móviles y ordenadores.

Pasos rápidos para GitHub Pages

1. Crea un repo en GitHub y sube todos los archivos del proyecto.
2. En la sección Settings → Pages, selecciona la rama `main` y la carpeta `/ (root)` como origen.
3. GitHub generará una URL pública (https://<usuario>.github.io/<repo>/).
4. Comparte esa URL con tus compañeros; pueden abrirla desde móvil o PC.

Buenas prácticas y notas sobre fallos

- La app es sencilla, pero pueden surgir errores en combinaciones concretas (Mix + barajar + ediciones locales). Si detectas un fallo:
  1. Prueba `Resetear tema` en el editor para ver si el problema viene de ediciones locales.
  2. Usa `Exportar JSON` para comprobar el contenido actual del tema (puedes abrirlo en un editor de texto).
  3. Si el problema persiste en la versión pública, comparte una captura y describe los pasos exactos para reproducirlo.
- Si el navegador bloquea la carga de JSON por CORS o por servir desde `file://`, asegúrate de usar un servidor HTTP tal como se indica en la sección "Probar localmente".

Cómo reportar un fallo o pedir mejoras

- Reúne:
  - URL donde ocurre (si está desplegado).
  - Pasos exactos para reproducir.
  - Tema y número de pregunta, y si has hecho ediciones en el editor.
  - Capturas de pantalla si es posible.

Privacidad y datos

- Ningún dato se envía a servidores externos por defecto. Las ediciones se guardan localmente en el navegador (`localStorage`).
- Si publicas cambios en un repo público o compartes JSON exportados, ten en cuenta que otros podrán verlos.

Siguientes pasos posibles (si quieres que te ayude)

- Puedo crear el repositorio en GitHub y publicar en GitHub Pages por ti (me tendrás que dar acceso o hacerlo junto a mis instrucciones).
- Puedo añadir una acción de GitHub Actions que despliegue automáticamente al hacer `push` a `main`.
- Puedo añadir un botón que descargue un ZIP con todos los JSON y archivos del proyecto.

Gracias por usar Mini Kahoot. Si quieres, te guío paso a paso para publicar en GitHub Pages o Cloudflare Pages y compartir la URL con tu clase.