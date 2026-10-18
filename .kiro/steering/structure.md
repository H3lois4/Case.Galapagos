# Estrutura de pastas

Monorepo com frontend (Next.js) e backend (Django) no mesmo repositório `Case.Galapagos`.

```
Case.Galapagos/
├── .kiro/steering/ … e .kiro/specs/ …
├── frontend/          # Next.js
│   ├── app/(auth)/login, cadastro, escolher-usuario, verificar-empresa
│   ├── app/(app)/aulas, carreira, mentoria, pratica, rede, perfil, u/[username], post/[id]
│   ├── components/    # UI reutilizável seguindo o design system
│   ├── lib/           # cliente da API, auth, voz
│   └── public/        # manifest, ícones do PWA, logo
├── backend/           # Django
│   ├── config/        # settings, urls
│   ├── accounts/      # usuários, empresas, verificação, Google login
│   ├── lessons/       # aulas
│   ├── careers/       # áreas do mercado e perfis
│   ├── mentorship/    # horários, reservas, Google Agenda
│   ├── practice/      # simulados e entrevistas simuladas
│   ├── network/       # posts, notícias, curtidas, comentários, seguidores
│   ├── ai/            # provedores de LLM, agentes, base de conhecimento
│   └── seed/          # comando `python manage.py seed_demo`
└── README.md
```

## Convenções

- Cada domínio é um app Django próprio (`accounts`, `lessons`, `careers`, `mentorship`, `practice`, `network`, `ai`).
- `config/` guarda settings e urls do projeto Django.
- O frontend usa route groups: `(auth)` para telas sem navegação principal e `(app)` para as telas com barra inferior / menu lateral.
- Componentes reutilizáveis ficam em `frontend/components/`; integrações (API, auth, voz) em `frontend/lib/`.
- Prompts de sistema das IAs em `backend/ai/prompts/*.md`; bases de conhecimento em `backend/ai/knowledge/<agente>/*.md`.
- Dados de seed editáveis (áreas de carreira, banco de questões) em arquivos JSON/YAML dentro do app correspondente ou de `backend/seed/`.
