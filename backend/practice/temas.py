"""
Temas dos simulados — Por ELAS finance.
"""

TEMAS = [
    {"slug": "mercado-financeiro", "nome": "Mercado financeiro"},
    {"slug": "certificacoes", "nome": "Certificações / CPA"},
    {"slug": "matematica-financeira", "nome": "Matemática financeira"},
    {"slug": "excel", "nome": "Excel"},
    {"slug": "programacao-python", "nome": "Programação / Python"},
    {"slug": "ingles", "nome": "Inglês"},
]

TEMAS_SLUGS = {t["slug"] for t in TEMAS}

NOME_POR_SLUG = {t["slug"]: t["nome"] for t in TEMAS}
