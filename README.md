# Mini Kahoot — Guía de uso

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
