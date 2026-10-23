# Tarefas — 05-mentoria

- [x] 1. Modelos e agendamento atômico
- [x] 1.1 Modelos `MentorshipSlot` e `Booking` + admin + migração
  - Campos do design; `Booking.slot` FK + `UniqueConstraint` parcial (1 reserva ativa/slot) e (1 ativa/mês); admin.
  - _Requisitos: 2.1, 4.1, 5.1_
- [x] 1.2 Serviço de agendamento/cancelamento (`services.py`)
  - `agendar` com `transaction.atomic`+`select_for_update`, checagem de disponível e limite mensal, `IntegrityError`→Indisponivel; `cancelar` com janela de 24 h.
  - _Requisitos: 4.1, 4.2, 5.1, 5.2, 6.1, 6.3_

- [x] 2. Google Agenda e e-mail (opcionais)
- [x] 2.1 Cliente Google Calendar (`google_calendar.py`) + env
  - `criar_evento`/`cancelar_evento` com Meet e `sendUpdates=all`; no-op sem env; erros engolidos.
  - `GOOGLE_*` nas settings e `.env.example`; deps `google-api-python-client`/`google-auth`.
  - _Requisitos: 7.1, 7.3, 7.4_
- [x] 2.2 E-mail de confirmação + pós-reserva
  - `_pos_reserva`/`_pos_cancelamento` (melhor esforço) chamando Calendar + `send_mail`.
  - _Requisitos: 7.2_

- [x] 3. IA mentora (etapa 03)
- [x] 3.1 Agente mentora (prompt + conhecimento)
  - `ai/prompts/mentora.md`; `ai/knowledge/mentora/dicas.md`; entrada em `AGENTES`.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Endpoints
- [x] 4.1 Horários (listar/criar/meus/cancelar) e agendar/minhas/cancelar
  - Permissões empresa aprovada e dono; serializers; urls `/api/mentoria/*`.
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 6.1, 8.2, 8.3_
- [x] 4.2 Testes do backend
  - Empresa aprovada cadastra; disponíveis; agendamento atômico (2ª falha); limite mensal; cancelamento libera slot + janela 24 h; dono-only. (12 testes)
  - _Requisitos: 2.2, 4.2, 5.2, 6.1, 6.3, 8.2_

- [x] 5. Frontend
- [x] 5.1 Tela Mentoria (abas Agenda + IA mentora)
  - `SlotCard`, lista de disponíveis, "Minhas mentorias", `<ChatIA agente="mentora" />`.
  - _Requisitos: 1.1, 3.1, 3.3_
- [x] 5.2 Empresa cadastra/cancela horário
  - Botão "Cadastrar horário" (empresa aprovada) → `SlotForm`; cancelar slot; mensagens de erro claras.
  - _Requisitos: 2.1, 2.3_
- [x] 5.3 Agendar e cancelar (usuária)
  - "Agendar" com tratamento de já reservado/limite mensal; "Cancelar" com janela de 24 h.
  - _Requisitos: 3.2, 4.2, 5.2, 6.1, 6.3_
- [x] 5.4 Minhas mentorias no Perfil
  - Resumo das próximas sessões na seção "Minha jornada".
  - _Requisitos: 3.3_

- [x] 6. Verificação e documentação
- [x] 6.1 Verificar tudo
  - `check`, `migrate`, testes (68 ok), `npm run build`/`lint` verdes.
  - Teste manual (cadastrar/agendar/cancelar ok; Calendar com `GOOGLE_*`, IA com `GEMINI_API_KEY`): pendente das chaves.
  - _Requisitos: 4.1, 6.1 (validação geral)_
- [x] 6.2 README: seção de mentoria + Google Agenda
  - Como obter `GOOGLE_*` (OAuth da conta da plataforma), comportamento sem as chaves.
  - _Requisitos: 7.4_

- [ ] 7. Commit e push na main
  - Conventional Commits PT por bloco; push após cada commit.
