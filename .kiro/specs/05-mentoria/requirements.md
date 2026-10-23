# Requisitos — 05-mentoria

## Introdução

Esta etapa entrega a tela **Mentoria**: uma **IA mentora** (texto e voz) para conselhos de carreira e apoio emocional, e uma **agenda de mentorias** com as empresas. Empresas aprovadas cadastram horários; usuárias pessoais agendam por **ordem de chegada** (a primeira que confirmar leva o horário), com **limite de 1 mentoria por mês**. Ao confirmar, o sistema cria um evento no **Google Agenda** da plataforma (com link do Meet) e envia e-mail de confirmação.

Reaproveita a fundação de IA (`03-ia-base`) para a mentora e a autenticação/empresas de `01-auth-perfis`. Depende de `00-fundacao`, `01-auth-perfis` e `03-ia-base`.

## Requisitos

### Requisito 1 — IA mentora

**User Story:** Como usuária, quero conversar com uma IA mentora, para receber conselhos e apoio na carreira.

#### Acceptance Criteria
1. A tela Mentoria DEVE oferecer um **chat com a IA mentora** (texto e voz), usando o componente da etapa 03.
2. A mentora DEVE dar direcionamentos sobre decisões de carreira, negociação, posicionamento, networking e insegurança/síndrome da impostora.
3. A mentora DEVE seguir as regras globais (pt-BR, tom acolhedor, não recomendar investimento específico, não inventar fatos) e, em temas de saúde mental grave, acolher e sugerir apoio profissional.
4. Quando fizer sentido, a mentora DEVE sugerir **agendar uma mentoria humana** no app.

### Requisito 2 — Empresa cadastra horários

**User Story:** Como empresa aprovada, quero cadastrar horários de mentoria, para oferecer sessões às usuárias.

#### Acceptance Criteria
1. QUANDO a usuária é de empresa **aprovada** ENTÃO ela DEVE poder cadastrar um horário com: data, hora, duração, tema, **nome da mentora**, **cargo** e **e-mail corporativo da mentora** (obrigatório).
2. QUANDO a usuária NÃO é de empresa aprovada ENTÃO os endpoints de criação DEVEM retornar 403.
3. A empresa DEVE poder ver seus horários e **cancelar** um horário ainda não reservado (ou reservado, liberando a usuária).
4. Horários no passado NÃO DEVEM ser cadastráveis.

### Requisito 3 — Usuária vê e agenda

**User Story:** Como usuária, quero ver os horários disponíveis e agendar, para marcar uma mentoria.

#### Acceptance Criteria
1. O sistema DEVE listar os horários **disponíveis** (futuros, não reservados), com empresa, tema, mentora, data/hora e duração.
2. QUANDO a usuária toca em "Agendar" ENTÃO o sistema DEVE reservar o horário para ela.
3. O sistema DEVE mostrar as **"Minhas mentorias"** da usuária (agendadas e passadas).

### Requisito 4 — Concorrência: ordem de chegada

**User Story:** Como responsável pelo produto, quero que a primeira a agendar leve o horário, para não haver reserva dupla.

#### Acceptance Criteria
1. O agendamento DEVE ser **atômico**: usar transação com `select_for_update` no slot e uma **restrição única** que impeça duas reservas do mesmo horário.
2. SE duas usuárias tentam o mesmo horário ao mesmo tempo ENTÃO apenas **uma** DEVE conseguir; a outra recebe mensagem clara de "horário já reservado".
3. Um horário reservado NÃO DEVE aparecer mais na lista de disponíveis.

### Requisito 5 — Limite de 1 por mês

**User Story:** Como responsável pelo produto, quero limitar a uma mentoria por mês por usuária, para distribuir as vagas.

#### Acceptance Criteria
1. Uma usuária NÃO DEVE ter mais de **uma mentoria ativa no mesmo mês** (mês da data da mentoria).
2. QUANDO a usuária tenta agendar uma segunda no mesmo mês ENTÃO o sistema DEVE recusar com mensagem clara.
3. O limite considera o **mês da data da sessão** (não o mês da reserva).

### Requisito 6 — Cancelamento

**User Story:** Como usuária, quero cancelar minha mentoria, para liberar o horário se eu não puder ir.

#### Acceptance Criteria
1. A usuária DEVE poder cancelar sua mentoria **até 24 h antes** do início.
2. QUANDO cancela ENTÃO o horário DEVE voltar a ficar **disponível** e o evento do Google Agenda (se houver) DEVE ser cancelado.
3. SE faltar menos de 24 h ENTÃO o cancelamento DEVE ser recusado com mensagem clara.

### Requisito 7 — Google Agenda e e-mail

**User Story:** Como usuária, quero receber o convite com o link da reunião, para não perder a mentoria.

#### Acceptance Criteria
1. QUANDO uma mentoria é confirmada ENTÃO o sistema DEVE criar um **evento no Google Agenda** da plataforma com a usuária e a mentora como convidadas, **link do Meet** e `sendUpdates=all`.
2. O sistema DEVE enviar também um **e-mail de confirmação** próprio do app.
3. SE as credenciais do Google não estiverem configuradas ENTÃO o agendamento DEVE **funcionar mesmo assim** (sem o evento), sem quebrar — degradação graciosa, apenas sem o convite do Calendar.
4. As credenciais do Google DEVEM ficar em variáveis de ambiente.

### Requisito 8 — Segurança

#### Acceptance Criteria
1. Só usuária **autenticada** acessa a agenda e a IA mentora.
2. Apenas **empresa aprovada** cadastra/cancela horários da própria empresa; uma empresa não mexe nos horários de outra (403).
3. Uma usuária só cancela/vê a **própria** mentoria (403/404).
4. A IA mentora respeita o **rate limit** da etapa 03.
