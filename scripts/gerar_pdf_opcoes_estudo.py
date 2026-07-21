from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUT = Path("output/pdf")
OUT.mkdir(parents=True, exist_ok=True)

WINE = colors.HexColor("#2A0F14")
ACCENT = colors.HexColor("#A11D3E")
MUTED = colors.HexColor("#7F7074")
BORDER = colors.HexColor("#E8D8D5")
SOFT = colors.HexColor("#FBF7F5")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleV", parent=styles["Title"], fontName="Times-Bold", fontSize=24, leading=29, textColor=WINE, alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name="SubV", parent=styles["BodyText"], fontName="Helvetica", fontSize=10.5, leading=15, textColor=MUTED, alignment=TA_CENTER, spaceAfter=14))
styles.add(ParagraphStyle(name="H1V", parent=styles["Heading1"], fontName="Times-Bold", fontSize=18, leading=22, textColor=WINE, spaceBefore=9, spaceAfter=8))
styles.add(ParagraphStyle(name="H2V", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=ACCENT, spaceBefore=7, spaceAfter=5))
styles.add(ParagraphStyle(name="BodyV", parent=styles["BodyText"], fontName="Helvetica", fontSize=10, leading=15, textColor=colors.HexColor("#24191B"), spaceAfter=7))
styles.add(ParagraphStyle(name="SmallV", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=4))


def p(text, style="BodyV"):
    return Paragraph(text, styles[style])


def bullet(text):
    return p("- " + text)


def divider():
    return HRFlowable(width="100%", thickness=0.8, color=BORDER, spaceBefore=6, spaceAfter=10)


def table(rows, widths):
    t = Table(rows, colWidths=widths, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), SOFT),
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


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(1.6 * cm, 1.1 * cm, "Vesta - estudo pessoal sobre opcoes")
    canvas.drawRightString(A4[0] - 1.6 * cm, 1.1 * cm, f"pagina {doc.page}")
    canvas.restoreState()


def build():
    story = [
        p("Estudo pessoal: acoes encalhadas e opcoes", "TitleV"),
        p("Venda coberta, puts com caixa e um processo para estudar sem chute.", "SubV"),
        divider(),
        p("Aviso de escopo", "H1V"),
        p("Este material e educativo. Opcoes sao derivativos, podem gerar perdas relevantes e exigem acompanhamento. Nao e recomendacao de compra, venda ou estrategia para qualquer ativo especifico."),
        p("A pergunta deste estudo nao e 'como ganhar dinheiro facil com opcoes'. A pergunta boa e: existe um processo prudente para monetizar uma posicao em acoes enquanto se espera uma saida melhor?"),
        p("1. O que e uma opcao", "H1V"),
        p("Opcao e um contrato que da ao comprador um direito, mas nao uma obrigacao. Uma call da direito de comprar o ativo a um preco de exercicio. Uma put da direito de vender. Quem vende a opcao recebe um premio e assume uma obrigacao potencial."),
        p("Na B3, opcoes sobre acoes podem ser americanas ou europeias, tem premio cotado em reais e vencimentos padronizados. O exercicio pode ser automatico quando a opcao esta dentro do dinheiro no vencimento, conforme regras da B3."),
        table(
            [
                [p("<b>Termo</b>", "SmallV"), p("<b>Significado</b>", "SmallV")],
                [p("Ativo-objeto", "BodyV"), p("A acao ou ETF ao qual a opcao esta ligada.", "BodyV")],
                [p("Call", "BodyV"), p("Opcao de compra. O titular pode comprar pelo strike.", "BodyV")],
                [p("Put", "BodyV"), p("Opcao de venda. O titular pode vender pelo strike.", "BodyV")],
                [p("Strike", "BodyV"), p("Preco de exercicio combinado.", "BodyV")],
                [p("Premio", "BodyV"), p("Preco da opcao. Quem compra paga; quem vende recebe.", "BodyV")],
                [p("Vencimento", "BodyV"), p("Data limite da opcao. O calendario deve ser checado na B3.", "BodyV")],
            ],
            [4.2 * cm, 11.7 * cm],
        ),
        Spacer(1, 8),
        p("2. Venda coberta de call", "H1V"),
        p("A venda coberta e a estrategia mais intuitiva para quem ja tem a acao. Voce possui o papel e vende uma call. Recebe o premio. Se a acao nao ultrapassar o strike no vencimento, tende a ficar com a acao e com o premio. Se ultrapassar, pode ser exercida e vender a acao pelo strike."),
        table(
            [
                [p("<b>Se acontecer...</b>", "SmallV"), p("<b>Resultado pratico</b>", "SmallV")],
                [p("Acao fica abaixo do strike", "BodyV"), p("A call expira sem valor ou perto disso. Voce mantem a acao e o premio recebido.", "BodyV")],
                [p("Acao sobe acima do strike", "BodyV"), p("Pode ser exercida e vender a acao no strike. O ganho acima do strike fica limitado.", "BodyV")],
                [p("Acao cai muito", "BodyV"), p("O premio ajuda um pouco, mas nao protege totalmente contra queda do papel.", "BodyV")],
            ],
            [5.2 * cm, 10.7 * cm],
        ),
        Spacer(1, 8),
        p("Exemplo numerico simples", "H2V"),
        p("Acao comprada a R$ 100. Preco atual R$ 80. Voce aceitaria sair a R$ 90. Vende call strike R$ 90 e recebe R$ 1 de premio."),
        bullet("Se a acao ficar abaixo de R$ 90: fica com R$ 1 de premio e continua com a acao."),
        bullet("Se a acao for exercida a R$ 90: vende a acao a R$ 90, recebeu R$ 1, mas ainda saiu abaixo do PM de R$ 100."),
        bullet("O premio reduziu a dor; nao apagou a compra ruim."),
        p("3. Quando pode fazer sentido estudar", "H1V"),
        bullet("Voce ja tem a acao e aceitaria vender em um preco de saida definido."),
        bullet("A acao tem opcoes liquidas, com spread aceitavel e volume suficiente."),
        bullet("O premio e relevante em relacao ao risco assumido."),
        bullet("Voce consegue acompanhar vencimento, strike, rolagem e exercicio."),
        bullet("A posicao e pequena o bastante para erro operacional nao virar desastre familiar."),
        p("4. Quando evitar", "H1V"),
        bullet("Quando voce nao aceitaria vender a acao no strike escolhido."),
        bullet("Quando a opcao tem pouca liquidez e spread grande."),
        bullet("Quando a estrategia vira tentativa de recuperar prejuizo a qualquer custo."),
        bullet("Quando nao ha tempo para acompanhar vencimento e possivel exercicio."),
        bullet("Quando a carteira precisa de simplificacao, nao de mais complexidade."),
        p("5. Put com caixa reservado", "H1V"),
        p("Outra estrategia e vender put com caixa. Voce recebe premio e assume a possibilidade de comprar a acao no strike se ela cair. So faz sentido se voce realmente aceitaria comprar aquele ativo naquele preco e tiver o dinheiro reservado."),
        table(
            [
                [p("<b>Estrategia</b>", "SmallV"), p("<b>Uso possivel</b>", "SmallV"), p("<b>Risco</b>", "SmallV")],
                [p("Call coberta", "BodyV"), p("Gerar premio em acao ja comprada.", "BodyV"), p("Limita alta e pode vender a acao.", "BodyV")],
                [p("Put com caixa", "BodyV"), p("Tentar comprar acao desejada mais barata recebendo premio.", "BodyV"), p("Pode ser obrigada a comprar enquanto cai.", "BodyV")],
                [p("Travas", "BodyV"), p("Limitar ganho e perda com combinacoes.", "BodyV"), p("Mais complexidade e custo operacional.", "BodyV")],
            ],
            [4.1 * cm, 6.2 * cm, 5.6 * cm],
        ),
        Spacer(1, 8),
        p("6. Processo de estudo por ativo", "H1V"),
        table(
            [
                [p("<b>Passo</b>", "SmallV"), p("<b>Pergunta</b>", "SmallV"), p("<b>Decisao</b>", "SmallV")],
                [p("1. Liquidez", "BodyV"), p("Tem opcoes negociadas com volume e spread aceitavel?", "BodyV"), p("Se nao, descartar.", "BodyV")],
                [p("2. PM e preco atual", "BodyV"), p("Quanto falta ate breakeven?", "BodyV"), p("Definir se a meta e renda, saida ou espera.", "BodyV")],
                [p("3. Strike de saida", "BodyV"), p("Eu venderia feliz nesse preco?", "BodyV"), p("Se nao, nao vender call nesse strike.", "BodyV")],
                [p("4. Premio", "BodyV"), p("O premio compensa o risco de limitar a alta?", "BodyV"), p("Se for irrelevante, nao operar.", "BodyV")],
                [p("5. Plano de vencimento", "BodyV"), p("No vencimento eu deixo exercer, recompro ou rolo?", "BodyV"), p("Escrever antes de operar.", "BodyV")],
                [p("6. Tamanho", "BodyV"), p("Qual percentual da posicao entrara no teste?", "BodyV"), p("Comecar pequeno.", "BodyV")],
            ],
            [3 * cm, 7.3 * cm, 5.6 * cm],
        ),
        Spacer(1, 8),
        p("7. Como medir se funcionou", "H1V"),
        p("A avaliacao nao deve olhar so premio recebido. O correto e acompanhar o resultado economico total:"),
        p("<b>resultado = variacao da acao + premios liquidos - custos - impostos</b>"),
        p("E comparar com o que aconteceria em uma alternativa simples, como 90% do CDI liquido, LCI/LCA isenta ou IPCA+ adequado ao prazo."),
        p("Indicadores uteis:"),
        bullet("Premio liquido recebido no mes e no ano."),
        bullet("Premio como percentual do valor da acao."),
        bullet("Preco medio ajustado pelos premios recebidos."),
        bullet("Resultado total da posicao contra PM."),
        bullet("Resultado contra benchmark simples."),
        p("8. Riscos principais", "H1V"),
        bullet("Liquidez: pode ser dificil desmontar ou rolar uma opcao ruim."),
        bullet("Alta forte: a call coberta limita o ganho se a acao subir muito."),
        bullet("Queda forte: o premio nao protege totalmente contra queda da acao."),
        bullet("Operacional: vencimento, exercicio automatico, rolagem e imposto exigem controle."),
        bullet("Psicologico: tentar recuperar prejuizo pode levar a aumentar risco sem perceber."),
        p("9. Imposto e controle", "H1V"),
        p("Ganhos liquidos em operacoes em bolsa geralmente sao tributados. A Receita Federal informa aliquotas de 15% para operacoes comuns e 20% para day trade, alem de regras de compensacao de perdas e custos. Opcoes exigem controle proprio de notas, premios, exercicios e vencimentos."),
        p("Para estudo, a planilha minima deve registrar: data, ativo, tipo, vencimento, strike, premio, quantidade, custos, resultado, imposto estimado e decisao no vencimento."),
        p("10. Regra pessoal de seguranca", "H1V"),
        table(
            [
                [p("<b>Regra</b>", "SmallV"), p("<b>Por que existe</b>", "SmallV")],
                [p("So call coberta no inicio", "BodyV"), p("Evita venda descoberta e risco ilimitado.", "BodyV")],
                [p("So ativo com liquidez", "BodyV"), p("Sem liquidez, a teoria nao vira execucao decente.", "BodyV")],
                [p("Strike onde aceito vender", "BodyV"), p("Evita arrependimento se for exercida.", "BodyV")],
                [p("Tamanho pequeno", "BodyV"), p("Estudo primeiro, escala depois.", "BodyV")],
                [p("Plano antes da ordem", "BodyV"), p("Decide sem panico quando o preco mexer.", "BodyV")],
            ],
            [5 * cm, 10.9 * cm],
        ),
        Spacer(1, 8),
        p("11. Aplicando ao caso Murilo", "H1V"),
        p("Pelo snapshot importado em 20/07/2026, a carteira do Murilo nao aparece com acoes comuns liquidas para venda coberta. A parte de renda variavel e composta por FIIs/listados com final 11. Para o estudo de opcoes, isso muda bastante a conclusao: nao parece ser uma carteira naturalmente adequada a call coberta agora."),
        table(
            [
                [p("<b>Ativo/bloco</b>", "SmallV"), p("<b>Tipo no snapshot</b>", "SmallV"), p("<b>Viabilidade para opcoes</b>", "SmallV"), p("<b>Leitura</b>", "SmallV")],
                [p("Riza Lotus FIF RF", "BodyV"), p("Fundo DI/credito privado", "BodyV"), p("Nao elegivel", "BodyV"), p("Nao e acao para call coberta. Melhor comparar com LC/LCI/LCA/CDI e risco de credito/liquidez.", "BodyV")],
                [p("Tesouro Selic 2031", "BodyV"), p("LFT/Tesouro", "BodyV"), p("Nao elegivel", "BodyV"), p("Bloco defensivo. Comparar com Selic, prazo e necessidade de liquidez.", "BodyV")],
                [p("KNCR11, KNSC11, HSML11, RBRR11", "BodyV"), p("FIIs", "BodyV"), p("Baixa/nao usar como base", "BodyV"), p("Geram proventos, mas nao sao o universo tipico/liquido de opcoes sobre acoes.", "BodyV")],
                [p("JURO11, KDIF11, KNRI11, BTLG11", "BodyV"), p("FIIs", "BodyV"), p("Baixa/nao usar como base", "BodyV"), p("Analisar qualidade, desconto contra PM, recorrencia do rendimento e alternativa de renda fixa.", "BodyV")],
                [p("IFRA11, BDIF11, VISC11, CPTI11, PSEC11", "BodyV"), p("FIIs/listados", "BodyV"), p("Baixa/nao usar como base", "BodyV"), p("Melhor tratar como decisao de manter, girar ou travar, nao como estrategia de opcoes.", "BodyV")],
            ],
            [3.8 * cm, 3.4 * cm, 3.8 * cm, 4.9 * cm],
        ),
        Spacer(1, 8),
        p("Conclusao preliminar para ele", "H2V"),
        bullet("Opcoes nao parecem ser a ferramenta certa para resolver a carteira do Murilo neste momento."),
        bullet("A rota mais simples e comparar Riza Lotus, FIIs e Tesouro contra alternativas: LC/LCI/LCA, Tesouro Selic ou IPCA+ conforme prazo."),
        bullet("Se no futuro ele tiver acoes liquidas de verdade, como grandes blue chips com mercado de opcoes ativo, ai sim vale aplicar o checklist de call coberta."),
        bullet("Para os FIIs atuais, o estudo principal deve ser: provento recorrente, perda contra PM, qualidade do fundo, liquidez e custo de oportunidade."),
        Spacer(1, 8),
        p("Fontes consultadas", "H1V"),
        p("B3 - Opcoes sobre Acoes: https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/opcoes-sobre-acoes.htm", "SmallV"),
        p("B3 Educacao - Opcoes: https://edu.b3.com.br/w/opcoes", "SmallV"),
        p("Portal do Investidor/CVM - Riscos de derivativos: https://www.gov.br/investidor/pt-br/investir/tipos-de-investimentos/derivativos/riscos", "SmallV"),
        p("Receita Federal - Bolsa de Valores: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/renda-variavel/bolsa-de-valores-1/bolsa-de-valores/", "SmallV"),
        p("B3 - Calendario de vencimentos: https://www.b3.com.br/", "SmallV"),
    ]

    doc = SimpleDocTemplate(str(OUT / "guia_estudo_opcoes_acoes_encalhadas.pdf"), pagesize=A4, rightMargin=1.6 * cm, leftMargin=1.6 * cm, topMargin=1.6 * cm, bottomMargin=1.7 * cm)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT / "guia_estudo_opcoes_acoes_encalhadas.pdf")


if __name__ == "__main__":
    build()
