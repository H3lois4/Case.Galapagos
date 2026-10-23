# Design — 05-mentoria

## Visão geral

Dois blocos: a **IA mentora** (agente novo sobre a base da etapa 03) e a **agenda de mentorias**. O cerne técnico é o **agendamento sem reserva dupla**: transação com `select_for_update` no slot + restrição única. O Google Agenda e o e-mail entram **depois** da reserva confirmada e são **opcionais** (degradam com elegância se não configurados).

```
Empresa aprovada → cadastra Slot (data/hora/tema/mentora/email)
Usuária → GET /api/mentoria/horarios/ → "Agendar"
  POST /api/mentoria/horarios/<id>/agendar/
    → transaction.atomic + select_for_update(slot)
    → valida: disponível? usuária já tem 1 no mês?
    → marca reservado + cria Booking (unique por slot)
    → (melhor esforço) cria evento Google Agenda + e-mail
Usuária → cancela até 24h antes → libera slot + cancela evento
```

## Backend (`mentorship/`)

### Modelos (`mentorship/models.py`)
```python
class MentorshipSlot(models.Model):
    company = FK(Company, related_name="horarios_mentoria")
    criado_por = FK(Profile, null=True, on_delete=SET_NULL)
    mentora_nome = CharField(max_length=120)
    mentora_cargo = CharField(max_length=120, blank=True)
    mentora_email = EmailField()
    tema = CharField(max_length=160)
    inicio = DateTimeField(db_index=True)
    duracao_min = PositiveIntegerField(default=45)
    reservado = BooleanField(default=False)       # desnormalizado p/ filtro rápido
    criado_em = DateTimeField(auto_now_add=True)

class Booking(models.Model):
    slot = OneToOne(MentorshipSlot, related_name="reserva")   # unicidade do slot
    profile = FK(Profile, related_name="mentorias")
    ano_mes = CharField(max_length=7, db_index=True)          # "2026-11" (mês da sessão)
    status = CharField(choices=[("ativa","Ativa"),("cancelada","Cancelada")], default="ativa")
    google_event_id = CharField(max_length=256, blank=True)
    meet_link = URLField(blank=True)
    criado_em / cancelado_em
    class Meta:
        constraints = [
            UniqueConstraint(fields=["profile","ano_mes"],
                             condition=Q(status="ativa"),
                             name="uma_mentoria_ativa_por_mes"),
        ]
```
- `Booking.slot` OneToOne garante **no banco** que um slot só tem uma reserva.
- A `UniqueConstraint` parcial (status="ativa") garante **1 mentoria ativa por mês** por usuária — defesa no banco além da checagem na view.
- `reservado` no slot é só um atalho de leitura; a verdade é a existência de `Booking` ativa.

### Agendamento atômico (`mentorship/services.py`)
```python
def agendar(profile, slot_id) -> Booking:
    ano_mes = None
    with transaction.atomic():
        slot = MentorshipSlot.objects.select_for_update().get(pk=slot_id)
        if slot.inicio <= now(): raise Indisponivel("Horário no passado.")
        if slot.reservado or Booking.objects.filter(slot=slot, status="ativa").exists():
            raise Indisponivel("Horário já reservado.")
        ano_mes = slot.inicio.strftime("%Y-%m")
        if Booking.objects.filter(profile=profile, ano_mes=ano_mes, status="ativa").exists():
            raise LimiteMensal("Você já tem uma mentoria neste mês.")
        booking = Booking.objects.create(slot=slot, profile=profile, ano_mes=ano_mes)
        slot.reservado = True
        slot.save(update_fields=["reservado"])
    # fora da transação (efeitos colaterais): Google Agenda + e-mail (melhor esforço)
    _pos_reserva(booking)
    return booking
```
Captura `IntegrityError` (corrida que escapou do lock em certos bancos) e converte em `Indisponivel`. `select_for_update` funciona no Postgres (produção); em SQLite (dev/testes) é no-op, mas as **constraints** seguram a corrida mesmo assim.

### Google Agenda (`mentorship/google_calendar.py`)
Cliente opcional usando `google-api-python-client` com **OAuth da conta da plataforma** (refresh token em env). Funções:
- `criar_evento(booking)` → cria evento com convidadas (usuária + mentora), `conferenceDataVersion=1` (Meet), `sendUpdates="all"`; devolve `(event_id, meet_link)`.
- `cancelar_evento(event_id)`.
Se faltar qualquer env (`GOOGLE_*`), as funções viram **no-op** e o fluxo segue sem evento (requisito 7.3). Erros são logados e engolidos (não quebram a reserva).

### E-mail
`send_mail` (SMTP já configurado na etapa 01) com os dados da sessão e o link do Meet, para a usuária e a mentora. Melhor esforço (não quebra a reserva).

### Cancelamento
`cancelar(profile, booking_id)`: valida dono e janela de 24 h; marca `status="cancelada"`, `cancelado_em`, libera `slot.reservado=False`, e (melhor esforço) chama `cancelar_evento`.

### Agente IA mentora (etapa 03)
- `ai/prompts/mentora.md`: conselheira; conhece as três personas (retorno após pausa, primeira entrada, transição após os 40); acolhe insegurança; sugere mentoria humana quando couber.
- `ai/knowledge/mentora/` (opcional): dicas de posicionamento/negociação/networking.
- Entrada `mentora` no registro `AGENTES`.

### Endpoints (`/api/mentoria/`)
| Método | Rota | Permissão | Descrição |
| --- | --- | --- | --- |
| GET | `/api/mentoria/horarios/` | autenticada | Slots disponíveis (futuros, não reservados). |
| POST | `/api/mentoria/horarios/` | empresa aprovada | Cadastra slot. |
| GET | `/api/mentoria/horarios/meus/` | empresa aprovada | Slots da empresa (com estado). |
| DELETE | `/api/mentoria/horarios/<id>/` | empresa dona | Cancela o slot (libera reserva, se houver). |
| POST | `/api/mentoria/horarios/<id>/agendar/` | autenticada | Agenda (atômico). |
| GET | `/api/mentoria/minhas/` | autenticada | Minhas mentorias (ativas e passadas). |
| POST | `/api/mentoria/minhas/<id>/cancelar/` | dona | Cancela (até 24 h antes). |

## Frontend (`app/(app)/mentoria/`)

Abas (como em Carreira): **Agenda** e **IA mentora**.
- **Agenda:** lista de `SlotCard` (empresa, tema, mentora, data/hora, duração) com botão "Agendar"; seção "Minhas mentorias" com estado e "Cancelar". Empresa aprovada vê um botão **"Cadastrar horário"** → `SlotForm` (modal com os campos do requisito 2). Mensagens claras de erro (já reservado / limite mensal / janela de cancelamento).
- **IA mentora:** `<ChatIA agente="mentora" titulo="IA mentora" />`.

Perfil: a seção "Minha jornada" ganha **"Minhas mentorias"** (reaproveita o resumo das próximas sessões).

### Componentes
`SlotCard`, `SlotForm`, `MinhasMentorias`, e reuso de `ChatIA`.

## Dependências novas
- Backend: `google-api-python-client`, `google-auth` (só usados quando o Google está configurado; import preguiçoso).
- Frontend: nenhuma nova.

### Env novas
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` (padrão `primary`). Documentar no `.env.example` e README; sem elas, o Calendar é desligado.

## Estratégia de verificação
- Testes backend: cadastro só por empresa aprovada; listagem de disponíveis; **agendamento atômico** (segunda reserva do mesmo slot falha); **limite mensal** (segunda no mês falha); cancelamento libera slot; janela de 24 h; dono-only. Google/e-mail **mockados/desligados** nos testes.
- Teste manual: empresa cadastra horário, usuária agenda, aparece em "Minhas mentorias", cancela; com `GOOGLE_*` reais, confere o convite no Calendar. IA mentora depende da `GEMINI_API_KEY`.
- `check`, `migrate`, testes, `npm run build`/`lint` verdes.

## Fora de escopo
- Pagamento/avaliação de mentoria. Reagendamento (cancelar e agendar outro).
- Sincronização bidirecional com o Calendar (só criamos/cancelamos).
