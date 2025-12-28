# Juegos — Zoilo, Rosendo y la lluvia que no terminaba

Sitio estático (HTML/CSS/JS) pensado para **GitHub Pages**.

Incluye:
- Sopa de letras (generada en el navegador)
- Mini-crucigrama
- Trivia
- Busca y encuentra

## Cómo publicarlo en GitHub Pages

1. Creá un repo (ej: `zoilo-juego`)
2. Subí estos archivos a la raíz del repo:
   - `index.html`
   - `styles.css`
   - `script.js`
3. En GitHub: **Settings → Pages**
   - Source: `Deploy from a branch`
   - Branch: `main` / folder: `/root`
4. Guardá. Tu juego quedará en:
   `https://TUUSUARIO.github.io/zoilo-juego/`

## Personalización rápida

En `script.js` podés cambiar:
- Lista de palabras de la sopa: `WS.words`
- Preguntas de trivia: `TR.questions`
- Respuestas de “Busca y encuentra”: `bfCheck()`

## Licencia

Poné la licencia que prefieras (MIT recomendado para código).
