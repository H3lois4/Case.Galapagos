# Regras de Git (obrigatórias)

- Trabalhe sempre no repositório clonado `https://github.com/H3lois4/Case.Galapagos.git`.
- **Faça commit ao terminar cada task do spec** e **faça `git push` logo depois de cada commit. Sempre. Nunca termine uma task sem push.**
- Mensagens no padrão **Conventional Commits em português**, ex.:
  - `feat(aulas): upload de vídeo com URL pré-assinada`
  - `fix(mentoria): impedir reserva duplicada`
  - `docs: atualiza README`
- Commits pequenos e focados. Antes de cada commit, rode lint/build e os testes que existirem; **não suba código quebrado na `main`**.
- **Nunca** commitar `.env`, chaves, tokens ou arquivos de vídeo. Manter `.gitignore` atualizado.
- Se o push falhar (conflito ou autenticação), **pare e avise** com a mensagem de erro.

## Branch

- Trabalho direto na `main` conforme o fluxo do hackathon (deploy automático na Vercel a cada push na `main`).
