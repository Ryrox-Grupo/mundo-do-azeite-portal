// Mundo do Azeite — dados partilhados pelo programa (index.html), pela loja (loja.html) e pelo portal (portal.html).
// Esta base só tem as tabelas e as campanhas; os dados (entidades, talões, custos, vendas) entram pelo programa ou por
// importação e ficam guardados só neste navegador (localStorage). Pelo RGPD não se escrevem aqui nomes de pessoas.
const MDA_CHAVE = "mda-dados-v1";
const DENS = 0.916; // kg de azeite por litro

function mdaExemplo(){ return {
  conf:{responsaveis:[],controlador:"",tolHoras:0.5,tolLitros:10,precoGasoleo:1.45,precoAzeiteRef:4.20,campanha:"2026/27",margemVenda:0.2},
  // tabelas de apoio (menu Tabelas)
  tabelas:{
    campanhas:[
      {id:"2023/24",inicio:"2023-10-01",fim:"2024-09-30",estado:"Fechada",nota:""},
      {id:"2024/25",inicio:"2024-10-01",fim:"2025-09-30",estado:"Fechada",nota:""},
      {id:"2025/26",inicio:"2025-10-01",fim:"2026-09-30",estado:"Fechada",nota:""},
      {id:"2026/27",inicio:"2026-10-01",fim:"2027-09-30",estado:"Aberta",nota:""}],
    // classificação pela acidez: regra da Ryrox (02-11-2026); a última classe não tem limite
    classes:[
      {id:"VE",nome:"Virgem extra",acidezMax:0.5,legal:"até 0,8 %",cor:"#3d6b12"},
      {id:"V",nome:"Virgem",acidezMax:1.9,legal:"até 2,0 %",cor:"#b8860b"},
      {id:"L",nome:"Lampante",acidezMax:null,legal:"acima de 2,0 %",cor:"#a3402a"}],
    modos:[
      {id:"BIO",nome:"Biológico",bio:"Sim",cert:"Sim"},
      {id:"CONV",nome:"Convencional",bio:"Não",cert:"Não"},
      {id:"CONVR",nome:"Em conversão para biológico",bio:"Não",cert:"Sim"}],
    variedades:["Galega","Cobrançosa","Cordovil","Verdeal","Arbequina","Arbosana","Koroneiki","Picual"].map((n,i)=>({id:"V"+(i+1),nome:n,notas:""})),
    estadosAz:["Limpa","Folhas","Muita rama","Muita lenha","Terra","Picada / geada","Podre e gafa"].map((n,i)=>({id:"E"+(i+1),nome:n})),
    tiposContrato:["Compra de azeitona","Colheita","Gestão do olival","Prestador de serviços","Lagar","Venda a granel"].map((n,i)=>({id:"T"+(i+1),nome:n})),
    tiposCliente:["Granel","Restauração","Balcão","Online","Revenda","Distribuição"].map((n,i)=>({id:"K"+(i+1),nome:n})),
    // categorias do registo de custos (ecrã Contas)
    categoriasCusto:["Azeitona comprada (fatura)","Azeitona comprada (nota de encomenda)","Colheita e apanha","Lagar (maquia, embalamento, filtragem)","Análises e rótulos","Transporte e reparações","Pessoal","Gasóleo","Alugueres de máquinas","Equipamento","Outros"].map((n,i)=>({id:"CC"+(i+1),nome:n}))},
  lagares:[], produtores:[], prestadores:[], clientes:[],
  meios:[
    {id:"M1",nome:"Trator Ryrox + reboque",eurH:28},
    {id:"M2",nome:"Vibrador Ryrox",eurH:40},
    {id:"M3",nome:"Colaborador Ryrox",eurH:9}],
  propriedades:[], campos:[], obras:[], anexos:[], guias:[], entregas:[], lotesIniciais:[],
  produtos:[
    {id:"PR1",nome:"Virgem Extra Biológico",formato:"Garrafa 0,5 L",forma:"garrafa",litros:0.5,garrafa:0,rotulo:0,caixa:0,unCaixa:6,servico:0,preco:0,ini:0,desc:"Galega. Frutado verde, amargo e picante equilibrados."},
    {id:"PR2",nome:"Virgem Extra Biológico",formato:"Garrafão 5 L (PET)",forma:"caixa",litros:5,garrafa:0,rotulo:0,caixa:0,unCaixa:1,servico:2.00,preco:27.00,ini:0,desc:"Galega biológico em garrafão de 5 litros."}],
  locais:[{id:"CASA",nome:"Armazém Ryrox",tipo:"Próprio",ent:""}],
  rececoes:[], regrasDia:[], guiasT:[], caderno:[],
  embalamentos:[], pedidosPag:[], movs:[], vendas:[], contratos:[], custos:[], pendentes:[], precosManuais:[]
};}

// ---- contas base, partilhadas pelo programa (index.html) e pelo portal do fornecedor (portal.html) ----
// usam o D global de cada página
const by = (arr,id) => arr.find(x=>x.id===id) || {};
// o peso que conta: o da azeitona limpa (ticket limpo do lagar) quando existe; senão bruto − tara do ticket da balança
function liquido(e){ return +e.kgLimpo > 0 ? +e.kgLimpo : e.bruto - e.tara }
// azeitona suja (04-11-2026, Ricardo): o peso Ryrox é o da azeitona suja; se não a pesámos, vale o ticket de azeitona suja do lagar
// (a parte desta origem quando o camião trouxe duas, senão bruto − tara). A limpa é a do ticket limpo (liquido); a diferença é folha e terra.
function mdaSuja(e){ if(+e.pesoR>0) return +e.pesoR; if(+e.sujoParte>0) return +e.sujoParte; const s = (+e.bruto||0)-(+e.tara||0); return s>0 ? s : null }
function mdaFolha(e){ const s = mdaSuja(e), l = +e.kgLimpo||0; return s && l ? {kg:s-l, pct:(s-l)/s*100} : null }
// rendimentos como na folha "Pesagem e Rendimentos": líquido = bruto − desconto do lagar; MS = bruto ÷ (1 − humidade)
// acordos com o lagar: por campanha e, se for preciso, por variedade (o da variedade vence o de "todas")
const campanhaDe = d => (D.tabelas.campanhas.find(c=>d>=c.inicio&&(!c.fim||d<=c.fim))||{}).id||"";
function regraLagar(lid,camp,variedade){
  const A = by(D.lagares,lid).acordos||[];
  return A.find(a=>a.campanha===camp&&a.variedade&&a.variedade===variedade) || A.find(a=>a.campanha===camp&&!a.variedade) || null;
}
function acordoLagar(e){
  const A = by(D.lagares,e.lagar).acordos||[];
  if(e.acordo){ const a=A.find(x=>x.id===e.acordo); if(a) return a; }
  return regraLagar(e.lagar,campanhaDe(e.data),by(D.campos,e.campo).variedade) || {id:"",campanha:campanhaDe(e.data),variedade:"",maquia:"eur",valor:0,desconto:3.5,falta:true};
}
const descLag = e => acordoLagar(e).desconto ?? 3.5;
const rl = e => e.rb==null ? null : e.rb - descLag(e);
const msE = (rb,hum) => rb==null||hum==null ? null : rb/(1-hum/100);
// compra da azeitona ao produtor: kg do lagar × preço contratado (indexado = provisório até fechar)
// percentagem (03-11-2026): o proprietário recebe essa % da azeitona colhida, ao preço de referência por kg
// contrato de exploração: a azeitona é nossa; paga-se o valor anual do contrato, não há preço por kg
// último preço de mercado do azeite (Comissão Europeia, precos.js): só conta com menos de 60 dias; se o mercado escolhido não o tiver,
// passa à média de Portugal e depois à de Espanha. Usado no Dashboard e no B2B do fornecedor.
function mdaUltimoPreco(classe, merc){
  const PRx = typeof MDA_PRECOS!=="undefined" ? MDA_PRECOS : {series:{}}, recente = new Date(Date.now()-60*864e5).toISOString().slice(0,10);
  for(const m of [merc,"Portugal · média","Espanha · média"]){ const s=(PRx.series[m]||{})[classe]; if(s&&s.length&&s[s.length-1][0]>=recente){ const u=s[s.length-1], ant=s.filter(x=>x[0]<=new Date(new Date(u[0])-28*864e5).toISOString().slice(0,10)).pop(); return {preco:u[1],data:u[0],merc:m,ant:ant?ant[1]:null} } }
  return null;
}
// o preço do azeite de hoje, por classe (uma só conta para o programa, a maquia e o portal, 07-11-2026):
// o mais recente entre o lançado à mão (Poolred, Contas) e o da Comissão Europeia no Alentejo Central (a região onde colhemos).
function mdaPrecoHoje(classe, merc){
  const man = (D.precosManuais||[]).filter(x=>x.classe===classe).sort((a,b)=>b.data.localeCompare(a.data))[0], up = mdaUltimoPreco(classe, merc||MDA_MERC_MAQUIA);
  if(man && (!up || man.data>=up.data)) return {preco:+man.preco, data:man.data, merc:man.fonte||"lançado à mão", manual:true, ant:null};
  return up;
}
// a classe do azeite de um produto (garrafa): a escrita no produto; senão pelo nome; senão virgem extra
const mdaClasseProd = p => { const t = ((p||{}).nome||"")+" "+((p||{}).origem||""); return (p||{}).classe || (/lampante/i.test(t)?"Lampante":/virgem extra/i.test(t)?"Virgem extra":/virgem/i.test(t)?"Virgem":"Virgem extra") };
// maquia ao fornecedor (04-11-2026, Ricardo; regra na skill maquia-fornecedor): o fornecedor recebe uma % do azeite que a azeitona dele deu.
// 1) azeite = kg de azeitona limpa × rendimento líquido; 2) maquia = azeite × %; 3) classe verificada pela acidez (tabela de classes);
// 4) preço dessa classe ao dia, no mercado da região onde se colhe (Alentejo Central); 5) valor = kg de maquia × preço.
// Recebe em azeite (os kg) ou em dinheiro (o valor). A conta é sempre ao dia de hoje até ser paga.
const MDA_MERC_MAQUIA = "Alentejo Central";
function mdaClasseAcidez(e){
  if(e.acidez==null) return e.classe||"Virgem extra";
  const cs = (D.tabelas.classes||[]).slice(), o = cs.filter(c=>c.acidezMax!=null).sort((a,b)=>a.acidezMax-b.acidezMax).concat(cs.filter(c=>c.acidezMax==null));
  return (o.find(c=>c.acidezMax!=null&&e.acidez<=+c.acidezMax)||o[o.length-1]||{}).nome || e.classe || "Virgem extra";
}
function mdaMaquia(e, p){
  const R = rl(e); if(R==null) return null;
  const az = liquido(e)*R/100, pct = +p.pct||0, kgM = az*pct/100, classe = mdaClasseAcidez(e), merc = p.mercado||MDA_MERC_MAQUIA, up = mdaPrecoHoje(classe, merc);
  return {az, pct, kg:kgM, classe, merc: up ? up.merc : merc, preco: up ? up.preco : null, data: up ? up.data : null, valor: up ? kgM*up.preco : 0};
}
const mdaPrecoKg = p => p.contrato==="exploracao"||p.contrato==="gestao"||p.contrato==="maquia" ? 0 : p.contrato==="pct" ? (+p.preco||0)*(+p.pct||0)/100 : (+p.preco||0);
function mdaCompra(e){
  const p = by(D.produtores, by(D.campos,e.campo).prod), kgL = liquido(e);
  if(p.contrato==="maquia" && e.preco==null){ const m = mdaMaquia(e,p), v = m ? m.valor : 0; return {preco: kgL ? v/kgL : 0, valor:v, provisorio:true, maquia:m} }
  const pr = e.preco ?? mdaPrecoKg(p);
  return {preco:pr, valor:kgL*pr, provisorio:e.preco==null&&p.contrato==="indexado"};
}

function mdaCarregar(){ let d; try{ d = JSON.parse(localStorage.getItem(MDA_CHAVE)) }catch(e){} return d || mdaExemplo(); }
function mdaGravar(d){ try{ const t = JSON.stringify(d); localStorage.setItem(MDA_CHAVE, t);
  if((d.entregas||[]).length || (d.custos||[]).length || (d.vendas||[]).length) localStorage.setItem(MDA_CHAVE+"-copia", JSON.stringify({quando:new Date().toISOString(), dados:d})) }catch(e){} }
function mdaCopia(){ try{ return JSON.parse(localStorage.getItem(MDA_CHAVE+"-copia")) }catch(e){ return null } }

// custo da embalagem por unidade: garrafa + rótulo + caixa ÷ unidades por caixa + serviço de embalamento
const mdaCustoEmbUn = x => (+x.garrafa||0) + (+x.rotulo||0) + ((MDA_CAIXA[+x.litros]||+x.unCaixa||0) ? (+x.caixa||0)/(MDA_CAIXA[+x.litros]||+x.unCaixa) : (+x.caixa||0)) + (+x.servico||0) + (+x.custoEmb||0);
// unidades de um produto num local: stock inicial (no armazém) + embalamentos recebidos + movimentos − vendas desse local
function mdaStockLocal(d, id, local, ate){
  const p = d.produtos.find(x=>x.id===id); if(!p) return 0;
  const ok = dt => !ate || (dt||"") <= ate;
  let n = local==="CASA" ? (p.ini||0) : 0;
  (d.embalamentos||[]).filter(e=>e.estado==="Recebido"&&e.destino===local&&ok(e.recebido||e.data)).forEach(e=>e.linhas.filter(l=>l.produto===id).forEach(l=>n+=+(l.rec??l.qtd)||0));
  (d.movs||[]).filter(m=>m.produto===id&&ok(m.data)).forEach(m=>{ if(m.para===local) n+=m.qtd; if(m.de===local) n-=m.qtd; });
  d.vendas.forEach(v=>{ if((v.local||"CASA")===local&&ok(v.data)) v.linhas.filter(l=>l.produto===id).forEach(l=>n-=l.qtd) });
  return n;
}
// o que se pode vender já (balcão e loja online): o que está no armazém da Ryrox
function mdaStockProduto(d, id){ return mdaStockLocal(d, id, "CASA"); }


// ---- pedido de pagamento pelo fornecedor (07-11-2026, pedido do Ricardo) ----
// No portal o fornecedor pede o que lhe devemos em dinheiro ou em azeite (a granel ou embalado). No embalado paga a embalagem
// (garrafa + rótulo + caixa a dividir pelas unidades + serviço de embalamento) com a margem da Ryrox (D.conf.margemEmb, 15 %).
// A garrafa de 0,75 L nunca foi comprada: vale a de 0,50 L mais a diferença entre a de 0,50 L e a de 0,25 L (regra do Ricardo).
const MDA_FORMATOS = [0.25, 0.5, 0.75, 3, 5];
// garrafas por caixa (Ricardo, 07-11-2026): 0,25 L → 12, 0,50 L → 6, 0,75 L → 6, 3 L → 3; o garrafão de 5 L é à unidade.
// Todas se vendem também avulso (à unidade); a caixa só serve para encher depressa e para dividir o custo da caixa.
const MDA_CAIXA = {0.25:12, 0.5:6, 0.75:6, 3:3, 5:1};
const mdaMargemEmb = () => D.conf.margemEmb ?? 0.15;
function mdaEmbalagem(litros){
  const P = D.produtos||[], de = l => P.find(p=>+p.litros===l), p = de(litros);
  const parte = x => ({garrafa:+x.garrafa||0, rotulo:+x.rotulo||0, caixa:(+x.caixa||0)/(MDA_CAIXA[litros]||+x.unCaixa||1), servico:+x.servico||0});
  let c, nota = "";
  if(p) c = parte(p);
  else if(litros===0.75 && de(0.5) && de(0.25)){ const a = parte(de(0.5)), b = parte(de(0.25)); c = {...a, garrafa: a.garrafa + (a.garrafa - b.garrafa)}; nota = "garrafa de 0,75 L = a de 0,50 L + (0,50 L − 0,25 L)" }
  else if(de(0.5)) { const b = parte(de(0.5)); c = {garrafa:0, rotulo:b.rotulo, caixa:0, servico:b.servico}; nota = "falta o preço da garrafa" }
  else c = {garrafa:0, rotulo:0, caixa:0, servico:0};
  const custo = c.garrafa + c.rotulo + c.caixa + c.servico;
  // sem o preço da garrafa a embalagem fica "a confirmar" e não entra nas contas (preço 0) até ser lançada no Stock
  const falta = !custo || /falta/.test(nota);
  return {...c, custo, preco: falta ? 0 : custo*(1+mdaMargemEmb()), falta, nota};
}

// ---- rastreio da encomenda do fornecedor (07-11-2026, pedido do Ricardo) ----
// Pedido → Aceite → Pedido ao lagar (requisição de embalamento EB) → No armazém (receção do EB no Stock; o cliente é avisado)
// → Entregue. Em dinheiro: Pedido → Aceite → Pago. Cada passo fica com a data em x.etapas; o fornecedor e a Ryrox veem o mesmo trilho.
const mdaEtapasPed = x => x.tipo==="dinheiro" ? [["Pedido","Pedido feito"],["Aceite","Aceite pela Ryrox"],["Pago","Pago"]]
  : [["Pedido","Pedido feito"],["Aceite","Aceite pela Ryrox"],["Requisitado","Pedido ao lagar"],["No armazém","Pronto no armazém"],["Pago","Entregue"]];
function mdaEtapa(x, estado, nota){ x.estado = estado; x.etapas = x.etapas || [{e:"Pedido", data:x.data}]; x.etapas.push({e:estado, data:new Date().toISOString().slice(0,10), nota:nota||""}) }
function mdaTrilho(x){
  const E = mdaEtapasPed(x), i = x.estado==="Recusado" ? -1 : E.findIndex(e=>e[0]===x.estado), dat = k => ((x.etapas||[]).filter(t=>t.e===k).pop()||(k==="Pedido"?{data:x.data}:{})).data;
  if(x.estado==="Recusado") return `<div style="color:#b42318;font-weight:700;font-size:13px">✕ Pedido recusado</div>`;
  return `<div style="display:flex;align-items:flex-start;gap:0;margin:6px 0 2px;font:12px/1.3 Inter,'Segoe UI',sans-serif">${E.map(([k,t],j)=>{ const ok = j<=i, ag = j===i, d = dat(k);
    return `<div style="flex:1;min-width:0;text-align:center;position:relative">${j?`<i style="position:absolute;top:11px;right:50%;width:100%;height:3px;background:${j<=i?"#7cd23a":"#e3e6dc"}"></i>`:""}
      <span style="position:relative;display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;font-weight:800;font-size:12px;background:${ok?(ag?"#141a0d":"#7cd23a"):"#fff"};color:${ok?(ag?"#7cd23a":"#141a0d"):"#9aa38e"};border:2px solid ${ok?(ag?"#141a0d":"#7cd23a"):"#e3e6dc"}">${ok&&!ag?"✓":j+1}</span>
      <div style="font-weight:${ag?800:600};color:${ok?"#141a0d":"#9aa38e"};margin-top:3px">${t}</div>${ok&&d?`<div style="color:#5a6350;font-size:11px">${d.split("-").reverse().join("/")}</div>`:""}</div>` }).join("")}</div>`;
}

// ---- pessoas com acesso ao B2B (09-11-2026, pedido do Ricardo) ----
// Cada fornecedor pode ter várias pessoas, cada uma com nome, e-mail, telemóvel e palavra-passe. Os acessos antigos (um e-mail
// por fornecedor) passam a ser a primeira pessoa.
function mdaAcessos(p){ const pt = p.portal = p.portal || {ativo:false, desde:""};
  if(!pt.pessoas) pt.pessoas = pt.email ? [{id:"A1", nome:"", email:pt.email, tel:"", senha:pt.codigo||"", ativo:true, criado:pt.desde||"", enviado:pt.enviado||null}] : [];
  return pt.pessoas }
// entrada no portal: devolve {p, a} (fornecedor e pessoa) ou null
function mdaEntrar(email, senha){ const em = String(email||"").trim().toLowerCase(); if(!em || !senha) return null;
  for(const p of D.produtores){ if(!(p.portal && p.portal.ativo)) continue;
    const a = mdaAcessos(p).find(x=>x.ativo!==false && (x.email||"").toLowerCase()===em);
    if(a) return a.senha && a.senha===senha ? {p, a} : null }
  return null }
