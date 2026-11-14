"""Descarrega os preços semanais do azeite da Comissão Europeia (dados abertos, agridata.ec.europa.eu)
e grava-os em Projetos/mundo-do-azeite/app/precos.js, que o painel do Mundo do Azeite lê.

Uso:  python Recursos/ferramentas/precos-azeite.py
Corre sozinho todos os dias pela tarefa do Windows "Ryrox - precos do azeite" (07:30, ao ligar o computador e, se falhar, de hora a hora).
Fonte: https://ec.europa.eu/agrifood/api/oliveOil/prices  (preços em €/100 kg, por semana e por mercado)
A Poolred não entra aqui: as condições dela proíbem a recolha automática; os preços dela lançam-se à mão no painel.
"""
import json, urllib.request, datetime, pathlib, time, io, re, sys

API = "https://api.tech.ec.europa.eu/agrifood/api/oliveOil/prices?memberStateCodes={ms}&beginDate={ini}&endDate={fim}"
PRODUTOS = {"Extra virgin olive oil (up to 0.8%)": "Virgem extra", "Virgin olive oil (up to 2%)": "Virgem", "Lampante olive oil (2%)": "Lampante"}
MERCADOS = {
    "PT": {"Average national price": "Portugal · média", "Alentejo Central (PT183)": "Alentejo Central", "Alentejo Norte": "Alentejo Norte", "Alentejo Sul": "Alentejo Sul", "Trás-os-Montes": "Trás-os-Montes"},
    "ES": {"Average national price": "Espanha · média", "Jaén (ES616)": "Jaén", "Córdoba (ES613)": "Córdoba", "Sevilla (ES618)": "Sevilha"},
}
import os
# no computador: o precos.js do programa; no GitHub (portal na internet): o caminho dado em MDA_PRECOS_DESTINO
DESTINO = pathlib.Path(os.environ["MDA_PRECOS_DESTINO"]) if os.environ.get("MDA_PRECOS_DESTINO") else pathlib.Path(__file__).resolve().parents[2] / "Projetos" / "mundo-do-azeite" / "app" / "precos.js"


def descarrega(ms, ini, fim):
    # o serviço da Comissão às vezes falha (erro 500): tenta 3 vezes; se falhar, o precos.js antigo fica como está
    for tentativa in range(3):
        try:
            with urllib.request.urlopen(API.format(ms=ms, ini=ini.strftime("%d/%m/%Y"), fim=fim.strftime("%d/%m/%Y")), timeout=90) as r:
                return json.load(r)
        except Exception:
            if tentativa == 2:
                raise
            time.sleep(30)


# segunda fonte (10-11-2026): quando a API da Comissão está em baixo, a folha de Excel semanal da mesma Comissão
PAGINA_XLSX = "https://agriculture.ec.europa.eu/data-and-analysis/markets/price-data/price-monitoring-sector/olive-oil_en"
XLSX_MERC = {"PT": {"National": "Portugal · média", "Alentejo Central": "Alentejo Central", "Alentejo Norte": "Alentejo Norte", "Alentejo Sul": "Alentejo Sul", "Trás-os-Montes": "Trás-os-Montes"},
             "ES": {"National": "Espanha · média", "Jaén": "Jaén", "Córdoba": "Córdoba", "Sevilla": "Sevilha"}}


def ler(url, timeout=120):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Ryrox Mundo do Azeite)"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def series_do_xlsx(ini):
    import openpyxl
    html = ler(PAGINA_XLSX).decode("utf-8", "ignore")
    m = re.search(r'href="([^"]*document/download/[^"]*olive-oil-market-prices[^"]*\.xlsx)"', html)
    url = m.group(1).replace("&amp;", "&") if m else "https://agriculture.ec.europa.eu/document/download/159086d1-4f6a-4c56-97d2-30c57ad867a3_en?filename=olive-oil-market-prices_en.xlsx"
    if url.startswith("/"):
        url = "https://agriculture.ec.europa.eu" + url
    wb = openpyxl.load_workbook(io.BytesIO(ler(url, 300)), read_only=True, data_only=True)
    series = {}
    for r in wb["Data"].iter_rows(min_row=2, values_only=True):
        ms, prodN, fim, preco, merc = r[1], r[2], r[5], r[6], r[7]
        prod, mm = PRODUTOS.get(prodN), XLSX_MERC.get(ms, {}).get(merc)
        if not prod or not mm or not fim or preco is None or fim.date() < ini:
            continue
        series.setdefault(mm, {}).setdefault(prod, {})[fim.date().isoformat()] = round(float(preco) / 100, 3)
    return series


def main():
    fim = datetime.date.today()
    ini = datetime.date(fim.year - 2, 10, 1)  # duas campanhas para trás
    series, fonte = {}, "Comissão Europeia, agridata.ec.europa.eu (preços semanais à saída do lagar, €/kg)"
    try:
        dados = {ms: descarrega(ms, ini, fim) for ms in MERCADOS}
    except Exception as e:
        print("API da Comissão em baixo (", e, "): vou à folha de Excel semanal", file=sys.stderr)
        series = series_do_xlsx(ini)
        dados, fonte = {}, "Comissão Europeia, folha semanal de preços do azeite (agriculture.ec.europa.eu), €/kg à saída do lagar"
    for ms, mercados in MERCADOS.items():
        for x in dados.get(ms, []):
            prod, merc = PRODUTOS.get(x["product"]), mercados.get(x["market"])
            if not prod or not merc:
                continue
            d = datetime.datetime.strptime(x["endDate"], "%d/%m/%Y").date().isoformat()
            preco = float(x["price"].replace("€", "").replace(",", "")) / 100  # €/100 kg -> €/kg
            series.setdefault(merc, {}).setdefault(prod, {})[d] = round(preco, 3)
    saida = {
        "fonte": fonte,
        "atualizado": fim.isoformat(),
        "series": {m: {p: sorted(v.items()) for p, v in ps.items()} for m, ps in series.items()},
    }
    DESTINO.write_text("// Gerado por Recursos/ferramentas/precos-azeite.py — não editar à mão\nconst MDA_PRECOS = "
                       + json.dumps(saida, ensure_ascii=False) + ";\n", encoding="utf-8")
    n = sum(len(v) for ps in series.values() for v in ps.values())
    print(f"{n} preços gravados em {DESTINO}")


if __name__ == "__main__":
    main()
