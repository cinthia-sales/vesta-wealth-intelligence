from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Flowable,
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUT = Path("output/pdf")
OUT.mkdir(parents=True, exist_ok=True)

WINE = colors.HexColor("#2A0F14")
ACCENT = colors.HexColor("#A11D3E")
MUTED = colors.HexColor("#7F7074")
GREEN = colors.HexColor("#4E7A5C")
WARN = colors.HexColor("#D97706")
RED = colors.HexColor("#C0392B")
CREAM = colors.HexColor("#FBF7F5")
BORDER = colors.HexColor("#E8D8D5")


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="VTitle",
        parent=styles["Title"],
        fontName="Times-Bold",
        fontSize=24,
        leading=29,
        textColor=WINE,
        alignment=TA_CENTER,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="VSub",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=14,
    )
)
styles.add(
    ParagraphStyle(
        name="H1",
        parent=styles["Heading1"],
        fontName="Times-Bold",
        fontSize=18,
        leading=22,
        textColor=WINE,
        spaceBefore=8,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="H2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        leading=16,
        textColor=ACCENT,
        spaceBefore=7,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyV",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#24191B"),
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="Small",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=MUTED,
    )
)
styles.add(
    ParagraphStyle(
        name="Callout",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#24191B"),
        leftIndent=8,
        rightIndent=8,
        spaceAfter=8,
    )
)


def p(text, style="BodyV"):
    return Paragraph(text, styles[style])


def bullet(text):
    return Paragraph("• " + text, styles["BodyV"])


def divider():
    return HRFlowable(width="100%", thickness=0.8, color=BORDER, spaceBefore=6, spaceAfter=10)


class Dot(Flowable):
    def __init__(self, color, size=7):
        super().__init__()
        self.color = color
        self.size = size
        self.width = size
        self.height = size

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.circle(self.size / 2, self.size / 2, self.size / 2, stroke=0, fill=1)


def card_table(rows, widths=None):
    t = Table(rows, colWidths=widths, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(1.6 * cm, 1.1 * cm, "Vesta Wealth Intelligence")
    canvas.drawRightString(A4[0] - 1.6 * cm, 1.1 * cm, f"pagina {doc.page}")
    canvas.restoreState()


def build_tecnico():
    story = []
    story += [
        p("Guia Vesta: carrego, taxa comparavel e giro", "VTitle"),
        p("Um mapa para separar fluxo, rentabilidade, perda de principal e custo de oportunidade.", "VSub"),
        divider(),
    ]
    story += [
        p("1. O problema", "H1"),
        p(
            "A palavra 'carrego' costuma confundir porque pode significar coisas diferentes. Em uma carteira de renda fixa, ela parece uma taxa anual. Em FIIs, acoes e fundos listados, muitas vezes ela vira apenas o fluxo de proventos. Se essas duas leituras forem colocadas lado a lado, a comparacao fica injusta.",
        ),
        p(
            "A pergunta correta da Vesta deve ser: quanto este patrimonio tende a render daqui para frente, em uma regua comparavel, e quanto ja ganhou ou perdeu economicamente desde a compra?",
        ),
        p("2. Quatro metricas separadas", "H1"),
        card_table(
            [
                [p("<b>Metrica</b>", "Small"), p("<b>O que responde</b>", "Small"), p("<b>Formula simples</b>", "Small")],
                [p("Fluxo anual identificado", "BodyV"), p("Quanto pinga ou rende em dinheiro recorrente por ano.", "BodyV"), p("proventos + juros esperados / valor atual", "BodyV")],
                [p("Taxa anual esperada comparavel", "BodyV"), p("Quanto a carteira tende a render em 1 ano usando uma premissa comum.", "BodyV"), p("soma(valor x taxa esperada) / patrimonio", "BodyV")],
                [p("Resultado economico", "BodyV"), p("Se o investimento ganhou ou perdeu dinheiro de verdade.", "BodyV"), p("valor atual + proventos recebidos - valor investido", "BodyV")],
                [p("Custo de oportunidade", "BodyV"), p("O que se perdeu contra uma alternativa simples.", "BodyV"), p("resultado da alternativa - resultado atual", "BodyV")],
            ],
            [4.2 * cm, 6.2 * cm, 5.5 * cm],
        ),
        Spacer(1, 8),
        p("3. Por que 4,7% nao conversa com 10,53%", "H1"),
        p(
            "Se uma carteira de renda fixa mostra 10,53% a.a., isso geralmente e uma taxa anual esperada: titulos com taxa contratada, indexador conhecido e horizonte definido. Se outra carteira mostra 4,7% porque so foram identificados proventos ou juros seguros nos dados importados, isso e fluxo identificado, nao a mesma metrica.",
        ),
        p(
            "Por isso, uma tela honesta deve mostrar: 'fluxo anual identificado' separado de 'taxa anual esperada comparavel'. O primeiro mostra o pingado. O segundo tenta estimar a rentabilidade futura numa regua comum.",
        ),
        p("4. Calculo da taxa anual esperada comparavel", "H1"),
        p("Para cada ativo, atribui-se uma taxa esperada anual. Depois calcula-se a media ponderada pelo valor atual:"),
        p("<b>taxa da carteira = soma(valor do ativo x taxa esperada do ativo) / patrimonio total</b>"),
        card_table(
            [
                [p("<b>Ativo</b>", "Small"), p("<b>Como estimar</b>", "Small")],
                [p("CDB, LC, LCI, LCA", "BodyV"), p("Taxa contratada ou % CDI x CDI esperado. Ajustar IR quando comparacao for liquida.", "BodyV")],
                [p("Tesouro Selic / LFT", "BodyV"), p("Selic/CDI esperado. Se a taxa nao foi reconhecida, marcar 'taxa a confirmar'.", "BodyV")],
                [p("IPCA+", "BodyV"), p("IPCA esperado + taxa real contratada.", "BodyV")],
                [p("Prefixado", "BodyV"), p("Taxa contratada, considerando vencimento e risco de marcação a mercado se vender antes.", "BodyV")],
                [p("FII / acao", "BodyV"), p("Nao tem taxa contratada. Usar cenario: conservador, base e otimista. Separar provento de valorizacao.", "BodyV")],
            ],
            [4.2 * cm, 11.7 * cm],
        ),
        Spacer(1, 8),
        p("5. Resultado economico: onde o pingado perde a fantasia", "H1"),
        p("Um ativo pode pagar proventos e mesmo assim ter dado prejuizo. O calculo e:"),
        p("<b>resultado economico = valor atual + proventos recebidos - valor investido</b>"),
        p("Exemplo: comprou por R$ 100, hoje vale R$ 80 e pagou R$ 5. O fluxo existiu, mas o resultado economico e -R$ 15."),
        p("6. Giro compativel com a Projecao patrimonio", "H1"),
        p("Para comparar o giro, a base nao deve ser recalculada por outra taxa. A regra correta e:"),
        p("<b>patrimonio com giro = patrimonio base da Projecao - bloco candidato como estava + bloco candidato na taxa alvo</b>"),
        p("Assim, a parte que nao mexe continua exatamente com a mesma premissa da Projecao patrimonio. So muda o bloco que de fato seria realocado."),
        p("7. E se as acoes ruins virassem boas opcoes?", "H1"),
        p(
            "Esse e um cenario alternativo, nao uma garantia. A forma honesta de modelar e criar tres cenarios para a parte de RV: conservador, base e otimista. O conservador pode assumir so dividendos identificados ou ate 0% de valorizacao. O base pode assumir uma recuperacao moderada. O otimista pode assumir que a selecao melhora e parte da perda contra PM e recuperada.",
        ),
        card_table(
            [
                [p("<b>Cenario</b>", "Small"), p("<b>Premissa</b>", "Small"), p("<b>Uso</b>", "Small")],
                [p("Conservador", "BodyV"), p("Nao conta recuperacao de preco; considera apenas fluxo seguro identificado.", "BodyV"), p("Mostra o risco de ficar parado.", "BodyV")],
                [p("Base", "BodyV"), p("Alguma recuperacao/retorno medio, mas sem prometer volta ao PM.", "BodyV"), p("Comparacao com uma carteira normal.", "BodyV")],
                [p("Otimista", "BodyV"), p("Acoes/FIIs ruins viram boas escolhas e recuperam parte do principal.", "BodyV"), p("Teste de esperanca: quanto precisaria dar certo para valer manter.", "BodyV")],
            ],
            [3.8 * cm, 7 * cm, 5.1 * cm],
        ),
        Spacer(1, 8),
        p("8. Acoes como base para contratos de opcao", "H1"),
        p(
            "Em tese, sim: algumas acoes podem ser usadas em estrategias com opcoes, principalmente venda coberta de calls. Mas isso nao transforma automaticamente ativo ruim em ativo bom. A opcao gera premio, e esse premio pode melhorar o fluxo, mas tambem limita ganho, cria obrigacoes e exige controle de vencimento, liquidez e preco de exercicio.",
        ),
        card_table(
            [
                [p("<b>Estrategia</b>", "Small"), p("<b>Como funciona</b>", "Small"), p("<b>Risco principal</b>", "Small")],
                [p("Venda coberta de call", "BodyV"), p("Tem a acao e vende uma opcao de compra para receber premio.", "BodyV"), p("Se a acao subir muito, pode ser exercido e entregar a acao no strike.", "BodyV")],
                [p("Venda de put com caixa", "BodyV"), p("Reserva caixa e vende put para tentar comprar mais barato recebendo premio.", "BodyV"), p("Pode ser obrigado a comprar a acao se ela cair.", "BodyV")],
                [p("Trava", "BodyV"), p("Combina compra e venda de opcoes para limitar ganho e perda.", "BodyV"), p("Mais complexa; exige liquidez e acompanhamento.", "BodyV")],
            ],
            [4.2 * cm, 6.2 * cm, 5.5 * cm],
        ),
        Spacer(1, 8),
        p(
            "Para a Vesta, opcoes deveriam aparecer como um cenario separado: 'renda extra via opcoes'. O calculo correto seria premio liquido esperado por mes/ano, menos custos e impostos, comparado com o risco de entregar a acao ou aumentar posicao. Sem liquidez e sem regra clara de strike/vencimento, melhor nao contar esse premio como renda garantida.",
        ),
        Spacer(1, 8),
        p("Regra de ouro", "H1"),
        p(
            "Provento nao e patrimonio recomposto automaticamente. Primeiro ele precisa pagar a perda de principal, depois a inflacao, depois o benchmark. So entao vira ganho economico.",
        ),
    ]
    doc = SimpleDocTemplate(str(OUT / "guia_vesta_carrego_taxa_giro.pdf"), pagesize=A4, rightMargin=1.6 * cm, leftMargin=1.6 * cm, topMargin=1.6 * cm, bottomMargin=1.7 * cm)
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def build_resumo():
    story = []
    story += [
        p("Resumo consolidado - Carteira Murilo", "VTitle"),
        p("Leitura preliminar para conversa familiar. Valores aproximados com base nos arquivos importados e nas telas atuais do Vesta.", "VSub"),
        divider(),
        p("Diagnostico em uma frase", "H1"),
        p(
            "A carteira tem patrimonio aproximado de R$ 118 mil, com concentracao relevante em renda variavel/listados abaixo do preco medio e uma parte em Tesouro/LFT. O principal ponto nao e apenas quanto pinga por mes, mas se o conjunto rende melhor que alternativas simples e seguras.",
        ),
        p("Numeros de referencia", "H1"),
        card_table(
            [
                [p("<b>Item</b>", "Small"), p("<b>Leitura</b>", "Small")],
                [p("Patrimonio atual", "BodyV"), p("aprox. R$ 118 mil", "BodyV")],
                [p("Projecao base em 10 anos", "BodyV"), p("aprox. R$ 230 mil no cenario base atual da tela Projecao patrimonio", "BodyV")],
                [p("CAGR medio da Projecao", "BodyV"), p("aprox. 6,95% a.a. no cenario base", "BodyV")],
                [p("Fluxo anual identificado", "BodyV"), p("nao deve ser comparado diretamente com taxa de renda fixa; e apenas o que foi reconhecido como juros/proventos", "BodyV")],
                [p("Renda variavel/listados", "BodyV"), p("varios ativos abaixo do preco medio, exigindo estudo de venda, troca ou travamento", "BodyV")],
            ],
            [5 * cm, 10.8 * cm],
        ),
        Spacer(1, 8),
        p("O que esta incomodando", "H1"),
        bullet("Receber proventos nao significa que o investimento foi bom."),
        bullet("Se a cota caiu mais do que os proventos pagaram, houve perda economica."),
        bullet("Se o resultado nao supera CDI/IPCA ou uma LC/LCI/LCA simples, ha custo de oportunidade."),
        bullet("Ativos sem taxa clara nao devem ser projetados com otimismo automatico."),
        p("Possiveis caminhos", "H1"),
        card_table(
            [
                [p("<b>Caminho</b>", "Small"), p("<b>Ideia</b>", "Small"), p("<b>Cuidado</b>", "Small")],
                [p("Manter", "BodyV"), p("So faz sentido para ativo bom, travado por estrategia ou com tese clara de recuperacao.", "BodyV"), p("Nao confundir espera com plano.", "BodyV")],
                [p("Girar parte da RV", "BodyV"), p("Vender ativos fracos e levar para renda fixa limpa com taxa melhor.", "BodyV"), p("Ver IR, custo de execucao e se a venda realiza prejuizo desnecessario.", "BodyV")],
                [p("Travar com cadeado", "BodyV"), p("Nao mexer temporariamente quando o desagio ou breakeven nao compensam.", "BodyV"), p("Precisa ter prazo e motivo registrado.", "BodyV")],
                [p("Esperar parte da RV", "BodyV"), p("Testar quanto precisaria recuperar para justificar manter temporariamente.", "BodyV"), p("Nao tratar como promessa.", "BodyV")],
            ],
            [4.2 * cm, 6.5 * cm, 5.2 * cm],
        ),
        Spacer(1, 8),
        p("E se as acoes ruins recuperassem?", "H1"),
        p(
            "Esse teste serve para evitar uma decisao puramente emocional. A pergunta e: quanto essas posicoes teriam que recuperar, e em quanto tempo, para bater uma alternativa simples como 90% do CDI, IPCA+ alto ou uma LC/LCI/LCA adequada?",
        ),
        p(
            "Se mesmo em um cenario otimista a carteira empata pouco ou demora demais para superar uma alternativa simples, o giro fica mais forte. Se o cenario otimista mostrar recuperacao convincente, pode fazer sentido manter alguns ativos com cadeado e prazo de revisao.",
        ),
        p("Proposta de leitura para o Murilo", "H1"),
        bullet("Separar o que e renda contratada, o que e provento e o que e aposta em recuperacao."),
        bullet("Nao avaliar a carteira so pelo dinheiro que pinga."),
        bullet("Comparar cada bloco com uma alternativa simples de risco semelhante."),
        bullet("Priorizar caminhos simples: LC/LCI/LCA com taxa adequada, Tesouro quando fizer sentido e travamento temporario quando vender agora nao compensar."),
        bullet("Definir quais ativos ficam, quais entram em estudo de venda e quais ficam travados por breakeven."),
        p("Proxima etapa no Vesta", "H1"),
        p(
            "Ajustar a tela para mostrar duas metricas principais: taxa anual esperada comparavel e fluxo anual identificado. Em paralelo, calcular resultado economico contra preco medio e custo de oportunidade contra CDI/IPCA.",
        ),
        Spacer(1, 8),
        p(
            "Nota: este resumo e uma ferramenta de organizacao e estudo. Nao substitui avaliacao profissional, dados completos de compra/venda, impostos, custos e suitability.",
            "Small",
        ),
    ]
    doc = SimpleDocTemplate(str(OUT / "resumo_consolidado_carteira_murilo.pdf"), pagesize=A4, rightMargin=1.6 * cm, leftMargin=1.6 * cm, topMargin=1.6 * cm, bottomMargin=1.7 * cm)
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


if __name__ == "__main__":
    build_tecnico()
    build_resumo()
    print(OUT / "guia_vesta_carrego_taxa_giro.pdf")
    print(OUT / "resumo_consolidado_carteira_murilo.pdf")
