"""
Registro de agentes de IA — Por ELAS finance.

Cada agente é definido por um prompt de sistema (.md) e, opcionalmente, uma
pasta de base de conhecimento (.md). "Treinar" o agente = editar esses
arquivos. No MVP o conhecimento é injetado direto no prompt (sem RAG).

Montamos o `system` final concatenando:
  1. regras globais (válidas para todos os agentes)
  2. prompt específico do agente
  3. base de conhecimento do agente
  4. contexto da usuária + resumo da conversa anterior (memória)
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROMPTS_DIR = BASE_DIR / "prompts"
KNOWLEDGE_DIR = BASE_DIR / "knowledge"


# Regras que valem para todas as IAs do app (steering: ai.md).
REGRAS_GLOBAIS = """\
Você é uma IA do Por ELAS finance, um app que ajuda mulheres a entrar, voltar
ou migrar para o mercado financeiro. Siga sempre estas regras:

- Responda em português do Brasil (ou em inglês, se a usuária pedir).
- Tom acolhedor, encorajador e direto, como uma amiga que entende do mercado.
  Nada de culpa, alarme ou jargão desnecessário.
- NÃO faça recomendação de investimento específico (não indique ativos, ações
  ou alocações). Fale de conceitos e educação financeira, não de "o que comprar".
- NÃO invente fatos sobre empresas, vagas, pessoas, cursos ou dados. Quando não
  souber, diga que não sabe.
- Nunca peça dados sensíveis (senha, CPF, dados bancários, cartão).
- Em temas de saúde mental grave (ex.: sinais de risco), acolha com empatia e
  sugira procurar apoio profissional (no Brasil, CVV 188).
"""


@dataclass(frozen=True)
class Agente:
    chave: str
    nome: str
    prompt_file: str  # relativo a ai/prompts/
    knowledge_dir: str | None = None  # relativo a ai/knowledge/
    temperatura: float = 0.7


AGENTES: dict[str, Agente] = {
    a.chave: a
    for a in [
        Agente(
            chave="assistente",
            nome="Assistente Por ELAS",
            prompt_file="assistente.md",
            knowledge_dir="assistente",
            temperatura=0.6,
        ),
        Agente(
            chave="carreira",
            nome="IA de carreira",
            prompt_file="carreira.md",
            knowledge_dir="carreira",
            temperatura=0.7,
        ),
        Agente(
            chave="mentora",
            nome="IA mentora",
            prompt_file="mentora.md",
            knowledge_dir="mentora",
            temperatura=0.75,
        ),
        # A entrevistadora entra na etapa 06 adicionando arquivos de
        # prompt/conhecimento e uma entrada aqui.
    ]
}


# Cache de leitura dos arquivos (serverless: por instância).
_cache_texto: dict[str, str] = {}


def _ler(caminho: Path) -> str:
    chave = str(caminho)
    if chave not in _cache_texto:
        try:
            _cache_texto[chave] = caminho.read_text(encoding="utf-8").strip()
        except FileNotFoundError:
            _cache_texto[chave] = ""
    return _cache_texto[chave]


def _ler_conhecimento(dir_rel: str | None) -> str:
    if not dir_rel:
        return ""
    pasta = KNOWLEDGE_DIR / dir_rel
    if not pasta.is_dir():
        return ""
    partes = []
    for arq in sorted(pasta.glob("*.md")):
        texto = _ler(arq)
        if texto:
            partes.append(texto)
    return "\n\n".join(partes)


def limpar_cache() -> None:
    _cache_texto.clear()


def get_agente(chave: str) -> Agente | None:
    return AGENTES.get(chave)


def _contexto_usuaria(profile) -> str:
    if profile is None:
        return ""
    partes = []
    nome = getattr(profile, "nome_exibicao", "") or getattr(profile, "username", "")
    if nome:
        partes.append(f"Nome: {nome}")
    tipo = getattr(profile, "account_type", "")
    if tipo:
        partes.append(f"Tipo de conta: {tipo}")
    empresa = getattr(profile, "company", None)
    if empresa:
        partes.append(f"Empresa: {empresa.nome}")
    if not partes:
        return ""
    return "Contexto da usuária:\n" + "\n".join(f"- {p}" for p in partes)


def montar_system(agente: Agente, profile=None, resumo: str = "") -> str:
    """Monta a instrução de sistema final do agente."""
    blocos = [REGRAS_GLOBAIS, _ler(PROMPTS_DIR / agente.prompt_file)]

    conhecimento = _ler_conhecimento(agente.knowledge_dir)
    if conhecimento:
        blocos.append(
            "Base de conhecimento (use como referência, não copie literalmente):\n"
            + conhecimento
        )

    contexto = _contexto_usuaria(profile)
    if contexto:
        blocos.append(contexto)

    if resumo:
        blocos.append(f"Resumo da conversa até aqui (memória):\n{resumo}")

    return "\n\n---\n\n".join(b for b in blocos if b.strip())
