# Totos Euromilhões

Dashboard da ronda, publicado no GitHub Pages.

- `index.html` — a página.
- `data.json` — jogadores, números, pagamentos e sorteios. É o que a página mostra.
- `scripts/verificar-sorteio.mjs` — lê a chave no site da Santa Casa.
- `.github/workflows/sorteio.yml` — corre a verificação às terças e sextas à noite.

O token de gestão fica no `data.json` **cifrado** com a palavra-passe da gestão (AES-256, PBKDF2).
