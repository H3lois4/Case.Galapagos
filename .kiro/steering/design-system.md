# Identidade visual (design system)

Aplicar em tokens CSS/Tailwind com suporte a tema **claro e escuro**.

## Cores

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `azul-elas` | #1F4E9E | #6F98E0 | Primária, botões, item ativo |
| `azul-elas-escuro` | #163B78 | #9DBBEE | Primária pressionada |
| `azul-elas-suave` | #E6EDF8 | #1B2742 | Fundos de destaque |
| `rosa-elas` | #EB839E | #EB839E | Identidade, conquistas, destaques |
| `rosa-elas-texto` | #B3365E | #F29BB2 | Texto em rosa |
| `rosa-elas-suave` | #FCE8EE | #3A1F2A | Trilhos de progresso, fundos |
| `cinza-logo` | #DDDDDD | #2A2D38 | |
| `fundo` | #FFFFFF | #12141C | |
| `fundo-alt` | #F6F5F8 | #1C1F2A | Campos, seções |
| `tinta` | #1A1D2B | #F2F2F5 | Texto principal |
| `tinta-suave` | #5B6070 | #A3A7B5 | Texto secundário, ícones |
| `borda` | #E3E2E7 | #2E3240 | |
| `sucesso` | #1A7A4C | #4FC08D | |
| `perigo` | #C8323C | #F2737B | |
| `alerta` | #9A6412 | #E3A64A | |

Proporção por tela: ~70% neutros, ~20% azul, ~10% rosa.

## Acessibilidade

- **Nunca** usar `rosa-elas` como cor de texto em fundo claro (use `rosa-elas-texto`).
- Texto sobre bloco rosa = `tinta`.
- Texto branco sobre `azul-elas` está aprovado.
- Garantir contraste adequado e foco visível em todos os controles.

## Tipografia (Google Fonts)

- **Montserrat** 600/700/800 — títulos.
  - `display` 40/44 800 · `titulo-1` 28/34 700 · `titulo-2` 22/28 700 · `titulo-3` 18/24 600.
- **Inter** 400/600/700 — interface.
  - `corpo` 16/24 400 · `corpo-forte` 16/24 600 · `legenda` 13/18 400 · `botao` 15/20 600.

## Espaçamento e formas

- Grade de 4px (4, 8, 12, 16, 24, 32, 48).
- Margem lateral 16px, entre cards 24px.
- Raios: 8px chips/campos, 12px botões, 20px cards, 999px filtros e barras.
- Sombras discretas só no tema claro.

## Componentes

- **Botão primário:** azul com texto branco, altura 48px.
- **Botão secundário:** borda 1,5px azul.
- **Botão de destaque:** rosa com texto `tinta` (no máximo um por tela).
- **Campos:** fundo `fundo-alt`, borda 1px `tinta-suave`, foco com borda 2px azul.
- **Ícones:** outline (Lucide), traço 1,5–2px; cor padrão `tinta-suave`, ativo `azul-elas`, conquista `rosa-elas`.

## Logo

- Usar o arquivo da logo em `frontend/public/brand/`.
- O "finance" da logo é branco: em fundo claro, usar a logo sobre um bloco `azul-elas` ou a versão adaptada.
- Ícone do PWA = só o símbolo de barras + seta, rosa sobre fundo azul.
- Tamanho mínimo da logo 96px de largura.

## Tom de voz

Próximo, encorajador e sem jargão, como uma amiga que entende do mercado. Nada de culpa ou alarme.
