"""
Apaga a descrição antiga da Galapagos ("Gestora e banco de investimentos.").

Ela foi gravada por uma versão anterior do seed e estava errada — a Galapagos
não é um banco. Só limpa se o texto for exatamente o antigo, para não apagar
uma descrição escrita depois pela própria empresa. Migration só de dados.
"""

from django.db import migrations

DESCRICOES_ANTIGAS = ["Gestora e banco de investimentos."]


def limpar(apps, schema_editor):
    Company = apps.get_model("accounts", "Company")
    Company.objects.filter(descricao__in=DESCRICOES_ANTIGAS).update(descricao="")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_profile_is_admin"),
    ]

    operations = [
        # Reverter não restaura o texto errado de propósito.
        migrations.RunPython(limpar, migrations.RunPython.noop),
    ]
