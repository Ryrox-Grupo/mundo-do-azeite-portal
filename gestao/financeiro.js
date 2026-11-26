// ---- Financeiro como no RYROX SMART FARM (26-11-2026, pedido do Ricardo) ----
// Contas correntes (visão geral, a pagar, a receber, por antiguidade) · Liquidações (picar documentos, atribuir valores,
// pagar em dinheiro ou em maquia de azeite) · Pedidos de pagamento e recibos · Jurídico · conta corrente na ficha da entidade
// · página do documento com o PDF do Eticadata e a conversa desse documento.
// Os números do programa saem das mesmas funções de sempre (docsApagar, pagoDocs, dividaDe, totalDoc); o Eticadata (009, só leitura)
// junta as faturas que o programa ainda não tem. Nada dos dados que já existem é alterado: o que é novo fica em D.liquidacoes e D.juridico.
const FX = {lig:null, res:null, carregando:false, erro:"", modo:"geral", txt:"", soVenc:false, prox:{},
  liq:{lado:"pagar", ent:"", sel:{}, forma:"dinheiro", data:hoje(), valor:"", preco:null, lote:""}, recF:"tratar", cc:{}};
const ESC = ["A vencer","1-30 dias","31-60 dias","61-90 dias","Mais de 90 dias"];
const mot = (url, corpo) => fetch(url, corpo ? {method:"POST", headers:{"Content-Type":"application/json","X-Chave":window.MDA_MOTOR_CHAVE}, body:JSON.stringify(corpo)}
  : {headers:{"X-Chave":window.MDA_MOTOR_CHAVE}, cache:"no-store"}).then(r=>r.json());
const finEnts = () => ["produtores","clientes","lagares","prestadores"].flatMap(k=>D[k]).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
const ligDe = id => (FX.lig||{})[id] || {forn:[], cli:[], via:"—"};
const entDeCod = (lado, cod) => finEnts().find(e=>ligDe(e.id)[lado].includes(+cod));
const diasDe = d => d ? Math.floor((Date.now() - new Date(d+"T00:00:00").getTime())/864e5) : 0;
const escDe = d => { const n = diasDe(d); return n<=0?ESC[0]:n<=30?ESC[1]:n<=60?ESC[2]:n<=90?ESC[3]:ESC[4] };
const chaveErp = d => `${d.tp} ${d.ex}/${d.n}`;   // como o programa guarda os n.º do Eticadata (ex.: "V/FAC EX 2025/28")

async function finLigar(refazer){
  const ents = finEnts().map(e=>({id:e.id, nif:e.nif, nome:e.nome,
    compras:(D.custos||[]).filter(c=>c.ent===e.id&&c.fatura).map(c=>c.fatura.numInterno).filter(Boolean),
    vendas:D.vendas.filter(v=>v.cliente===e.id&&v.fatura).map(v=>v.fatura.numInterno).filter(Boolean)}));
  const j = await mot("/api/erp/entidades", {ents, refazer:!!refazer}); if(!j.ok) throw new Error(j.erro||"sem resposta"); FX.lig = j.lig }
async function finCarregar(refazer){
  if(!window.MDA_MOTOR_CHAVE){ FX.erro = "Abra o programa pelo atalho Mundo do Azeite (motor) para ver o Eticadata."; return }
  if(FX.carregando) return; FX.carregando = true; FX.erro = "";
  try{ if(!FX.lig || refazer) await finLigar(refazer);
    const L = Object.values(FX.lig), j = await mot("/api/erp/resumo", {forns:L.flatMap(x=>x.forn), clis:L.flatMap(x=>x.cli)});
    if(j.ok) FX.res = j.fin; else FX.erro = j.erro }catch(e){ FX.erro = "Eticadata: " + (e.message||e) }
  FX.carregando = false; finRedesenha() }
function finRedesenha(){ try{ if(vista==="vContas") contas(); else if(vista==="vEntid" && selEnt) entCC(selEnt) }catch(e){ console.warn(e) } }

// tudo o que está em aberto: o do programa (mesmas contas da conta corrente) + as faturas do Eticadata que o programa ainda não tem
function finAbertos(pagar){
  const camp = D.conf.campanha, C = (D.custos||[]).filter(c=>c.campanha===camp), V = D.vendas.filter(vendaNaCampanha), L = [];
  if(pagar){ const g = {}; docsApagar().filter(x=>x.val.estado==="validado").forEach(x=>(g[x.ent]=g[x.ent]||[]).push(x));
    Object.entries(g).forEach(([ent,xs])=>L.push(...pagoDocs(ent,xs).map(x=>({...x, porFaturar:true}))));
    C.filter(c=>c.fatura&&dividaDe(c)>0.005).forEach(c=>L.push({k:"C|"+c.id, ent:c.ent||"?"+(c.entNome||"—"), papel:"fatura", data:c.data, nome:"Fatura "+(c.fatura.numFornecedor||c.fatura.numInterno||c.id), num:c.fatura.numInterno, descr:esc(c.descr||c.categoria||""), valor:totalDoc(c), pago:totalDoc(c)-dividaDe(c), falta:dividaDe(c), doc:c})) }
  else V.filter(v=>v.fatura&&dividaDe(v)>0.005).forEach(v=>L.push({k:"V|"+v.id, ent:v.cliente||"?—", papel:"venda", data:v.data, nome:"Fatura "+(v.fatura.numInterno||v.id), num:v.fatura.numInterno, descr:v.linhas.map(descLinha).join(", "), valor:totalDoc(v), pago:totalDoc(v)-dividaDe(v), falta:dividaDe(v), doc:v}));
  const ja = new Set(L.map(x=>x.num).filter(Boolean)), lado = pagar?"forn":"cli";
  Object.entries(((FX.res||{})[pagar?"pagar":"receber"])||{}).forEach(([cod,o])=>{ const e = entDeCod(lado, cod); if(!e) return;
    o.docs.forEach(d=>{ const num = d.tp ? chaveErp(d) : d.num; if(ja.has(num) || ja.has(d.num)) return;
      L.push({k:"X|"+lado+"|"+(d.tp?[d.ex,d.sec,d.tp,d.n].join("|"):d.num), ent:e.id, papel:"Eticadata", data:d.data, venc:d.venc, nome:(d.tp?`${d.tp} ${d.n}`:d.num), num, descr:"Eticadata", valor:d.valor, pago:0, falta:d.valor, erp:d}) }) });
  return L.filter(x=>Math.abs(x.falta)>0.005).map(x=>({...x, esc:escDe(x.venc||x.data), dias:diasDe(x.venc||x.data)})).sort((a,b)=>(a.venc||a.data||"").localeCompare(b.venc||b.data||""));
}
function finPorEnt(L){ const m = {}; L.forEach(x=>{ const o = m[x.ent] = m[x.ent]||{ent:x.ent, total:0, esc:Object.fromEntries(ESC.map(e=>[e,0])), n:0, porFaturar:0, venc:0};
  o.total += x.falta; o.esc[x.esc] += x.falta; o.n++; if(x.porFaturar) o.porFaturar += x.falta; if(x.esc!==ESC[0]) o.venc += x.falta }); return Object.values(m).sort((a,b)=>b.total-a.total) }
const nomeX2 = id => String(id).startsWith("?") ? esc(String(id).slice(1)) : esc(nomeE(id));
const fxPassa = id => { const t = FX.txt.trim().toLowerCase(); if(!t) return true; const e = finEnts().find(x=>x.id===id)||{};
  return t.split(/\s+/).every(w=>[e.nome,e.nif,e.num,e.tel,e.email,numsEnt(id),...ligDe(id).forn,...ligDe(id).cli].join(" ").toLowerCase().includes(w)) };
const estadoErp = () => !window.MDA_MOTOR_CHAVE ? `<span class="pill w">Eticadata: abra pelo motor</span>` : FX.carregando ? `<span class="pill info">⏳ a ler o Eticadata…</span>`
  : FX.erro ? `<span class="pill bad" title="${esc(FX.erro)}">Eticadata sem resposta</span>` : FX.res ? `<span class="pill ok" title="Empresa ${esc(FX.res.empresa)} · só leitura">Eticadata ${esc(FX.res.empresa)} · ${dtl(FX.res.hoje)}</span>` : "";

// ---- Contas correntes ----
function finContas(el){
  if(!FX.res && !FX.carregando && !FX.erro) finCarregar();
  const P = finAbertos(true).filter(x=>fxPassa(x.ent)), R = finAbertos(false).filter(x=>fxPassa(x.ent)), tP = P.reduce((t,x)=>t+x.falta,0), tR = R.reduce((t,x)=>t+x.falta,0);
  const vP = P.filter(x=>x.esc!==ESC[0]).reduce((t,x)=>t+x.falta,0), vR = R.filter(x=>x.esc!==ESC[0]).reduce((t,x)=>t+x.falta,0);
  const tog = [["geral","Visão geral"],["receber","A receber (clientes)"],["pagar","A pagar (fornecedores)"]].map(([k,t])=>`<button data-fm="${k}" class="${FX.modo===k?"on":""}">${t}</button>`).join("");
  let corpo = "";
  if(FX.modo==="geral"){
    const eP = Object.fromEntries(ESC.map(e=>[e,P.filter(x=>x.esc===e).reduce((t,x)=>t+x.falta,0)])), eR = Object.fromEntries(ESC.map(e=>[e,R.filter(x=>x.esc===e).reduce((t,x)=>t+x.falta,0)]));
    const mx = Math.max(1, ...ESC.map(e=>Math.max(eP[e], eR[e])));
    const top = (L, pagar) => finPorEnt(L).slice(0,6).map(o=>`<tr class="click" data-fent="${esc(o.ent)}"><td>${nomeX2(o.ent)}</td><td class="num"><b>${eur(o.total)}</b></td></tr>`).join("") || `<tr><td class="vazio">Nada ${pagar?"a pagar":"a receber"}.</td></tr>`;
    corpo = `<div class="metricgrid q4">${[["A receber",tR,"clientes"],["A pagar",tP,"fornecedores, prestadores e lagares"],["Saldo",tR-tP,"a receber − a pagar"],["Vencido",vR-vP,`a receber ${eur(vR)} · a pagar ${eur(vP)}`]].map(([t,v,s])=>`<div class="metric"><small>${t.toUpperCase()}</small><b>${eur(v)}</b><span class="sb">${s}</span></div>`).join("")}</div>
      <section class="card"><h2>Antiguidade <small class="t">desde o vencimento (no programa, desde a data do documento)</small></h2>
        <div class="fxAnt">${ESC.map(e=>`<div><span>${e}</span><i class="r" style="width:${eR[e]/mx*100}%" data-fesc="receber|${e}" title="A receber ${eur(eR[e])}"></i><b>${eur(eR[e])}</b><i class="p" style="width:${eP[e]/mx*100}%" data-fesc="pagar|${e}" title="A pagar ${eur(eP[e])}"></i><b>${eur(eP[e])}</b></div>`).join("")}</div>
        <div class="sub"><span class="fxL r"></span> a receber · <span class="fxL p"></span> a pagar. Carregue numa barra para ver quem está nesse escalão.</div><div id="fxDrill"></div></section>
      <div class="bizgrid"><section class="card"><h2>Maiores devedores</h2><table class="tb">${top(R,false)}</table></section><section class="card"><h2>Maiores credores</h2><table class="tb">${top(P,true)}</table></section></div>`;
  } else {
    const pagar = FX.modo==="pagar", L = (pagar?P:R).filter(x=>!FX.soVenc||x.esc!==ESC[0]), E = finPorEnt(L), tot = k => E.reduce((t,o)=>t+(k?o.esc[k]:o.total),0);
    corpo = `<section class="card"><div style="overflow:auto"><table class="tb"><thead><tr><th>Entidade</th>${ESC.map(e=>`<th class="num">${e}</th>`).join("")}<th class="num">Total</th>${pagar?'<th class="num" title="Talões, maquias e guias validados que ainda não têm fatura">Por faturar</th>':""}<th></th></tr></thead><tbody>
      ${E.map(o=>{ const jur = (D.juridico||{})[o.ent]; return `<tr><td class="click" data-fent="${esc(o.ent)}"><b>${nomeX2(o.ent)}</b> <small class="t">${esc(numsEnt(o.ent)||"")}</small>${jur&&jur.estado!=="pago"?' <span class="pill bad">jurídico</span>':""}</td>${ESC.map(e=>`<td class="num">${o.esc[e]?eur(o.esc[e]):"—"}</td>`).join("")}<td class="num"><b>${eur(o.total)}</b></td>${pagar?`<td class="num">${o.porFaturar?eur(o.porFaturar):"—"}</td>`:""}
        <td style="white-space:nowrap"><button class="act sec sm" data-fliq="${pagar?"pagar":"receber"}|${esc(o.ent)}">${pagar?"Pagar":"Receber"}</button>${!pagar&&!String(o.ent).startsWith("?")?` <button class="act light sm" data-fjur="${esc(o.ent)}">${jur&&jur.estado!=="pago"?"Tirar do jurídico":"Passar ao jurídico"}</button>`:""}</td></tr>` }).join("") || `<tr><td colspan="9" class="vazio">Nada em aberto.</td></tr>`}</tbody>
      ${E.length?`<tfoot><tr><td>Total · ${E.length} entidades</td>${ESC.map(e=>`<td class="num">${eur(tot(e))}</td>`).join("")}<td class="num">${eur(tot())}</td>${pagar?`<td class="num">${eur(E.reduce((t,o)=>t+o.porFaturar,0))}</td>`:""}<td></td></tr></tfoot>`:""}</table></div>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="act light sm" id="fxCsv">⬇ Excel (CSV)</button></div></section>`;
  }
  el.innerHTML = `<div class="fxBarra"><div class="tabs" style="margin:0">${tog}</div><input class="fTxt" id="fxTxt" placeholder="Pesquisar: nome, n.º, NIF, telefone…" value="${esc(FX.txt)}">
    ${FX.modo!=="geral"?`<label class="fxChk"><input type="checkbox" id="fxVenc" ${FX.soVenc?"checked":""}> Só vencido</label>`:""}<span style="margin-left:auto">${estadoErp()} <button class="act light sm" id="fxAtual" title="Volta a ler o Eticadata">🔄</button></span></div>${corpo}`;
  el.querySelectorAll("[data-fm]").forEach(b=>b.onclick=()=>{ FX.modo = b.dataset.fm; contas() });
  const tx = $("fxTxt"); tx.oninput = () => { FX.txt = tx.value; clearTimeout(FX.tT); FX.tT = setTimeout(()=>{ contas(); const t = $("fxTxt"); if(t){ t.focus(); t.setSelectionRange(t.value.length,t.value.length) } }, 300) };
  if($("fxVenc")) $("fxVenc").onchange = ev => { FX.soVenc = ev.target.checked; contas() };
  $("fxAtual").onclick = () => { FX.res = null; finCarregar(true) };
  el.querySelectorAll("[data-fent]").forEach(t=>t.onclick=()=>{ const id = t.dataset.fent; if(id.startsWith("?")) return; selEnt = id; tabSel = "ent"; abre("vEntid") });
  el.querySelectorAll("[data-fliq]").forEach(b=>b.onclick=()=>{ const [lado,ent] = b.dataset.fliq.split("|"); finIrLiq(lado, ent) });
  el.querySelectorAll("[data-fjur]").forEach(b=>b.onclick=()=>{ D.juridico = D.juridico||{}; const id = b.dataset.fjur, j = D.juridico[id];
    if(j && j.estado!=="pago") j.estado = "pago"; else D.juridico[id] = {estado:"em cobrança", desde:hoje(), notas:""}; grava(); contas() });
  el.querySelectorAll("[data-fesc]").forEach(b=>b.onclick=()=>{ const [lado,e] = b.dataset.fesc.split("|"), L = (lado==="pagar"?P:R).filter(x=>x.esc===e);
    $("fxDrill").innerHTML = `<h3 style="margin:12px 0 6px">${lado==="pagar"?"A pagar":"A receber"} · ${e}</h3><table class="tb"><thead><tr><th>Entidade</th><th>Documento</th><th>Data</th><th class="num">Em aberto</th></tr></thead><tbody>${L.map(x=>`<tr class="click" data-fdoc="${esc(x.k)}"><td>${nomeX2(x.ent)}</td><td>${esc(x.nome)}</td><td>${dtl(x.data)}</td><td class="num">${eur(x.falta)}</td></tr>`).join("")}</tbody></table>`;
    $("fxDrill").querySelectorAll("[data-fdoc]").forEach(t=>t.onclick=()=>{ const x = L.find(y=>y.k===t.dataset.fdoc); if(x) docAbrir(x) }) });
  if($("fxCsv")) $("fxCsv").onclick = () => { const pagar = FX.modo==="pagar", E = finPorEnt(pagar?P:R), n = v => String(Math.round(v*100)/100).replace(".",",");
    const csv = ["Entidade;N.º;"+ESC.join(";")+";Total", ...E.map(o=>[nomeE(o.ent), numsEnt(o.ent), ...ESC.map(e=>n(o.esc[e])), n(o.total)].join(";"))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv"})); a.download = `contas-correntes-${pagar?"a-pagar":"a-receber"}-${hoje()}.csv`; a.click() };
}

// ---- Liquidações: picar documentos, atribuir, pagar em dinheiro ou em maquia de azeite ----
function finIrLiq(lado, ent, chaves){ FX.liq = {...FX.liq, lado, ent, sel:{}, valor:""}; finTab = "liq";
  if(chaves){ const L = finAbertos(lado==="pagar").filter(x=>x.ent===ent); chaves.forEach(k=>{ const x = L.find(y=>y.k===k); if(x) FX.liq.sel[k] = Math.round(x.falta*100)/100 }) }
  if(window.docFechar) docFechar(); abre("vContas") }
async function finProximo(tp){ if(FX.prox[tp] || !window.MDA_MOTOR_CHAVE) return; FX.prox[tp] = {num:"…"}; try{ const j = await mot("/api/erp/proximo?tp="+tp); FX.prox[tp] = j.ok ? j.doc : {num:"—"} }catch(e){ FX.prox[tp] = {num:"—"} } if(vista==="vContas" && finTab==="liq") contas() }
// preço do azeite de hoje (a mesma conta da maquia e do portal: mdaPrecoHoje); sem preço recente, o preço de referência
const precoAzeiteDia = () => { try{ const p = mdaPrecoHoje("Virgem extra"); if(p && p.preco) return Math.round(p.preco*100)/100 }catch(e){} return +D.conf.precoAzeiteRef||0 };
function finLiquidar(el){
  if(!FX.res && !FX.carregando && !FX.erro) finCarregar();
  const Q = FX.liq, pagar = Q.lado==="pagar", tp = pagar?"PAG":"REC"; finProximo(tp);
  const Tudo = finAbertos(pagar), E = finPorEnt(Tudo).filter(o=>!String(o.ent).startsWith("?"));
  const it = E.map(o=>({v:o.ent, t:nomeE(o.ent), sub:`${numsEnt(o.ent)||""} · em aberto ${eur(o.total)}`}));
  const L = Q.ent ? Tudo.filter(x=>x.ent===Q.ent) : [], soma = Object.values(Q.sel).reduce((t,v)=>t+(+v||0),0);
  if(Q.preco==null) Q.preco = precoAzeiteDia();
  const kgAz = Q.preco>0 ? soma/Q.preco : 0, LL = lotes().filter(l=>l.stock>0), prox = FX.prox[tp]||{};
  el.innerHTML = `<section class="card"><div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
      <div class="tabs" style="margin:0"><button data-lado="pagar" class="${pagar?"on":""}">Fornecedores · pagamentos (PAG)</button><button data-lado="receber" class="${!pagar?"on":""}">Clientes · recibos (REC)</button></div>
      <div style="flex:1;min-width:260px;max-width:480px"><label>${pagar?"Fornecedor":"Cliente"} (só quem tem saldo em aberto)</label>${caixaProcura("fxEnt", it, Q.ent, "escreva parte do nome, o n.º ou o NIF")}</div>
      <span style="margin-left:auto">${estadoErp()}</span></div>
    ${!Q.ent?`<div class="sub" style="margin-top:10px">${E.length} entidade(s) com saldo em aberto, ${eur(E.reduce((t,o)=>t+o.total,0))}. Escolha uma para picar os documentos.</div>`:""}</section>
    ${Q.ent?`<section class="card"><div class="fxDocCab">
        <div><label>Tipo</label><b>${tp} · ${pagar?"Pagamento a fornecedor":"Recibo de cliente"}</b></div>
        <div><label>Número (provisório)</label><b>${esc(prox.num||"…")}</b></div>
        <div><label>Data</label><input type="date" id="fxData" value="${Q.data}"></div>
        <div><label>Entidade</label><b>${esc(nomeE(Q.ent))}</b> <small class="t">${esc(numsEnt(Q.ent)||"")}${ligDe(Q.ent).forn.length||ligDe(Q.ent).cli.length?` · Eticadata ${[...ligDe(Q.ent).forn.map(c=>"F "+c),...ligDe(Q.ent).cli.map(c=>"C "+c)].join(", ")}`:" · sem ligação ao Eticadata"}</small></div>
        <div><label>Moeda</label><b>EUR</b></div></div>
      ${pagar?`<div class="fxForma"><span>Como se paga</span><button data-forma="dinheiro" class="${Q.forma==="dinheiro"?"on":""}">💶 Dinheiro</button><button data-forma="azeite" class="${Q.forma==="azeite"?"on":""}">🫒 Maquia de azeite</button></div>`:""}
      <div style="overflow:auto;margin-top:10px"><table class="tb"><thead><tr><th style="width:28px">Cf.</th><th>Documento</th><th>Descrição</th><th>Data</th><th>Vencimento</th><th class="num">Original</th><th class="num">Pendente</th><th class="num">Atribuído</th><th></th></tr></thead><tbody>
      ${L.map(x=>{ const v = Q.sel[x.k]; return `<tr><td><input type="checkbox" data-fsel="${esc(x.k)}" ${v!=null?"checked":""}></td><td><b>${esc(x.nome)}</b>${x.porFaturar?' <span class="pill w" title="Validado no programa; ainda sem fatura no Eticadata">por faturar</span>':x.papel==="Eticadata"?' <span class="pill info">Eticadata</span>':""}${(D.juridico||{})[x.ent]&&D.juridico[x.ent].estado!=="pago"?' <span class="pill bad">jurídico</span>':""}</td>
        <td><small>${x.descr||""}</small></td><td>${dtl(x.data)}</td><td>${x.venc?dtl(x.venc):"—"}${x.dias>0?` <span class="pill ${x.dias>90?"bad":"w"}">${x.dias} d</span>`:""}</td><td class="num">${eur(x.valor)}</td><td class="num">${eur(x.falta)}</td>
        <td class="num"><input data-fval="${esc(x.k)}" value="${v!=null?String(v).replace(".",","):""}" placeholder="0,00" style="width:100px;text-align:right;padding:4px 6px"></td><td><button class="act light sm" data-fver="${esc(x.k)}">Ver</button></td></tr>` }).join("") || '<tr><td colspan="9" class="vazio">Sem documentos em aberto.</td></tr>'}</tbody></table></div>
      <div class="fxAtrib"><label>Valor ${pagar?"a pagar":"recebido"}</label><input id="fxValor" value="${esc(Q.valor)}" placeholder="vazio = tudo" style="width:130px;text-align:right"><button class="act light sm" id="fxAuto">Atribuir automaticamente</button><button class="act light sm" id="fxLimpa">Limpar</button>
        <span style="margin-left:auto">Picado <b>${eur(soma)}</b> · ${Object.keys(Q.sel).length} documento(s)</span></div>
      ${pagar&&Q.forma==="azeite"?`<div class="fxAz"><div><label>Preço do azeite (€/kg)</label><input id="fxPreco" value="${String(Q.preco).replace(".",",")}" style="width:110px;text-align:right"></div>
        <div><label>Lote de onde sai (opcional)</label><select id="fxLote"><option value="">— a escolher depois —</option>${LL.map(l=>`<option value="${l.key}" ${l.key===Q.lote?"selected":""}>${esc(l.nome)} (${kg(l.stock-l.reservado)} disp.)</option>`).join("")}</select></div>
        <div class="fxKg"><small>Azeite a entregar</small><b>${n1(kgAz)} kg</b><small>${eur(soma)} ÷ ${n2(Q.preco)} €/kg</small></div></div>
        <div class="sub">A maquia de azeite fica como pedido nos <b>Pedidos dos fornecedores</b> (já aceite): segue os passos de sempre (requisitar ao lagar ou já temos em stock → entregue) e, quando for entregue, entra na conta corrente como pagamento em azeite.</div>`:""}
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">${!pagar?`<button class="act light" id="fxJur">Passar ao jurídico</button>`:""}<button class="act sec" id="fxGravar" ${soma>0.005?"":"disabled style=\"opacity:.45\""}>${pagar?(Q.forma==="azeite"?`Gravar pagamento em azeite · ${n1(kgAz)} kg`:`Gravar pedido de pagamento ${esc(prox.num||"")} · ${eur(soma)}`):`Gravar pedido de recibo ${esc(prox.num||"")} · ${eur(soma)}`}</button></div>
      <div class="sub" style="margin-top:6px">O programa não escreve no Eticadata: o ${pagar?"pagamento":"recibo"} é lançado lá à mão e o número fica como provisório até lá.</div></section>`:""}`;
  el.querySelectorAll("[data-lado]").forEach(b=>b.onclick=()=>{ FX.liq = {...Q, lado:b.dataset.lado, ent:"", sel:{}}; contas() });
  ligaProcura("fxEnt", it, v=>{ Q.ent = v; Q.sel = {}; contas() });
  if(!Q.ent) return;
  $("fxData").onchange = ev => Q.data = ev.target.value;
  el.querySelectorAll("[data-forma]").forEach(b=>b.onclick=()=>{ Q.forma = b.dataset.forma; contas() });
  el.querySelectorAll("[data-fsel]").forEach(c=>c.onchange=()=>{ const x = L.find(y=>y.k===c.dataset.fsel); if(c.checked) Q.sel[x.k] = Math.round(x.falta*100)/100; else delete Q.sel[x.k]; contas() });
  el.querySelectorAll("[data-fval]").forEach(i=>i.onchange=()=>{ const x = L.find(y=>y.k===i.dataset.fval), v = Math.min(x.falta, +String(i.value).replace(",",".")||0); if(v>0) Q.sel[x.k] = Math.round(v*100)/100; else delete Q.sel[x.k]; contas() });
  el.querySelectorAll("[data-fver]").forEach(b=>b.onclick=()=>{ const x = L.find(y=>y.k===b.dataset.fver); if(x) docAbrir(x) });
  $("fxValor").onchange = ev => Q.valor = ev.target.value;
  $("fxAuto").onclick = () => { let r = Q.valor.trim() ? +Q.valor.replace(",",".")||0 : Infinity; Q.sel = {};
    L.slice().sort((a,b)=>(a.venc||a.data||"").localeCompare(b.venc||b.data||"")).forEach(x=>{ if(r<=0.005) return; const v = Math.min(x.falta, r); Q.sel[x.k] = Math.round(v*100)/100; r -= v }); contas() };
  $("fxLimpa").onclick = () => { Q.sel = {}; Q.valor = ""; contas() };
  if($("fxPreco")) $("fxPreco").onchange = ev => { Q.preco = +String(ev.target.value).replace(",",".")||0; contas() };
  if($("fxLote")) $("fxLote").onchange = ev => Q.lote = ev.target.value;
  if($("fxJur")) $("fxJur").onclick = () => { D.juridico = D.juridico||{}; const j = D.juridico[Q.ent] = D.juridico[Q.ent]||{estado:"em cobrança", desde:hoje(), notas:"", docs:[]};
    j.estado = "em cobrança"; j.docs = [...new Set([...(j.docs||[]), ...Object.keys(Q.sel)])]; grava(); finTab = "jur"; contas() };
  $("fxGravar").onclick = () => { if(soma<=0.005) return;
    const docs = L.filter(x=>Q.sel[x.k]!=null).map(x=>({k:x.k, nome:x.nome, valor:Q.sel[x.k], erp:x.erp?{ex:x.erp.ex,sec:x.erp.sec,tp:x.erp.tp,n:x.erp.n}:null}));
    if(!confirm(`${pagar?(Q.forma==="azeite"?`Pagar ${eur(soma)} em azeite (${n1(kgAz)} kg a ${n2(Q.preco)} €/kg)`:`Pedir o pagamento de ${eur(soma)}`):`Pedir o recibo de ${eur(soma)}`} a ${nomeE(Q.ent)}?\n${docs.length} documento(s).`)) return;
    D.liquidacoes = D.liquidacoes||[]; let n = D.liquidacoes.length+1; while(D.liquidacoes.some(x=>x.id==="LQ-"+String(n).padStart(4,"0"))) n++;
    const lq = {id:"LQ-"+String(n).padStart(4,"0"), tipo:pagar?"pagamento":"recebimento", ent:Q.ent, data:Q.data||hoje(), campanha:D.conf.campanha, forma:pagar?Q.forma:"dinheiro",
      numProvisorio:prox.num||"", serie:prox.sec||"", exercicio:prox.ex||"", docs, valor:Math.round(soma*100)/100, estado:"pedido", criado:new Date().toISOString().slice(0,16), hist:[`${hoje()}: pedido criado na liquidação`]};
    if(lq.forma==="azeite"){ lq.azeite = {kg:Math.round(kgAz*10)/10, preco:Q.preco, lote:Q.lote||""};
      D.pedidosPag = D.pedidosPag||[]; let m = D.pedidosPag.length+1; while(D.pedidosPag.some(x=>x.id==="PP-"+String(m).padStart(4,"0"))) m++;
      const pp = {id:"PP-"+String(m).padStart(4,"0"), prod:Q.ent, campanha:D.conf.campanha, data:lq.data, tipo:"granel", descr:`Maquia de azeite a granel (liquidação ${lq.id})`, total:lq.valor, kg:lq.azeite.kg, emb:null, embFalta:false,
        linhas:[{k:"granel", q:lq.azeite.kg, litros:null, kg:lq.azeite.kg, emb:null, total:lq.valor, nome:`${n1(lq.azeite.kg)} kg de azeite a granel`}], precoKg:Q.preco, nota:`Liquidação ${lq.id}${Q.lote?" · lote "+Q.lote:""}`, estado:"Pedido", por:"Ryrox (liquidação)", extra:null, oferta:0, liq:lq.id};
      D.pedidosPag.push(pp); mdaEtapa(pp, "Aceite", "liquidação "+lq.id); lq.pp = pp.id }
    D.liquidacoes.push(lq); FX.prox = {}; grava(); FX.liq = {...Q, ent:"", sel:{}, valor:""}; finTab = "recibos"; contas() };
}

// ---- Pedidos de pagamento e recibos ----
function finRecibos(el){
  const Lq = (D.liquidacoes||[]).slice().sort((a,b)=>b.id.localeCompare(a.id)), pp = id => (D.pedidosPag||[]).find(x=>x.id===id)||{};
  const estado = x => x.forma==="azeite" ? (x.estado==="anulado"?"anulado":pp(x.pp).estado==="Pago"?"entregue":"pedido") : x.estado;
  const F = {tratar:x=>estado(x)==="pedido", feitos:x=>["pago","emitido","entregue"].includes(estado(x)), todos:()=>true}[FX.recF];
  const cor = {pedido:"w", pago:"ok", emitido:"ok", entregue:"ok", anulado:"bad"}, G = (D.guiasPag||[]).filter(g=>g.campanha===D.conf.campanha);
  el.innerHTML = `<section class="card"><div class="tabs" style="margin:0 0 10px">${[["tratar","Por tratar"],["feitos","Pagos / emitidos"],["todos","Todos"]].map(([k,t])=>`<button data-rf="${k}" class="${FX.recF===k?"on":""}">${t} (${Lq.filter({tratar:x=>estado(x)==="pedido", feitos:x=>["pago","emitido","entregue"].includes(estado(x)), todos:()=>true}[k]).length})</button>`).join("")}</div>
    <div style="overflow:auto"><table class="tb"><thead><tr><th>Pedido</th><th>Entidade</th><th>Documentos</th><th>Forma</th><th class="num">Valor</th><th>Estado</th><th>Fecho</th></tr></thead><tbody>
    ${Lq.filter(F).map(x=>{ const e = estado(x); return `<tr><td><b>${esc(x.id)}</b><br><small class="t">${x.tipo==="pagamento"?"Pagamento":"Recibo"} ${esc(x.numProvisorio||"")} · ${dtl(x.data)}</small></td><td>${esc(nomeE(x.ent))}</td>
      <td><small>${x.docs.map(d=>esc(d.nome)).join(", ")}</small></td><td>${x.forma==="azeite"?`🫒 ${n1(x.azeite.kg)} kg a ${n2(x.azeite.preco)} €/kg<br><small class="t">${esc(x.pp||"")} · ${esc(pp(x.pp).estado||"")}</small>`:"💶 Dinheiro"}</td>
      <td class="num"><b>${eur(x.valor)}</b></td><td><span class="pill ${cor[e]||"w"}">${e}</span>${x.ref?`<br><small class="t">${esc(x.ref)}${x.fecho?" · "+dtl(x.fecho):""}</small>`:""}</td>
      <td style="white-space:nowrap">${e==="pedido"&&x.forma!=="azeite"?`<input type="date" data-rd="${x.id}" value="${hoje()}" style="width:135px;padding:4px"> <input data-rr="${x.id}" placeholder="${x.tipo==="pagamento"?"n.º da transferência":"n.º do recibo"}" style="width:140px;padding:4px"> <button class="act sec sm" data-rok="${x.id}">${x.tipo==="pagamento"?"Pago":"Emitido"}</button> <button class="act light sm" data-ran="${x.id}" style="color:var(--bad)">Anular</button>`
        : e==="pedido"&&x.forma==="azeite"?`<button class="act light sm" data-rpp="1">Ver nos Pedidos dos fornecedores</button> <button class="act light sm" data-ran="${x.id}" style="color:var(--bad)">Anular</button>`:""}</td></tr>` }).join("") || '<tr><td colspan="7" class="vazio">Nada aqui. Os pedidos nascem nas Liquidações.</td></tr>'}</tbody></table></div>
    <div class="sub" style="margin-top:8px">Pago ou emitido: entra na conta corrente do programa com a referência. O ${"pagamento"} ou recibo lança-se também no Eticadata (o programa só lê o Eticadata).</div></section>
    ${G.length?`<section class="card"><h2>Guias de pagamento e recebimento anteriores</h2><div class="sub">${G.length} guia(s) desta campanha, emitidas pela conta corrente antiga. <button class="act light sm" data-rcc="1">Abrir</button></div></section>`:""}`;
  el.querySelectorAll("[data-rf]").forEach(b=>b.onclick=()=>{ FX.recF = b.dataset.rf; contas() });
  el.querySelectorAll("[data-rpp]").forEach(b=>b.onclick=()=>{ finTab = "pedidos"; contas() });
  el.querySelectorAll("[data-rcc]").forEach(b=>b.onclick=()=>{ finTab = "cc"; contas() });
  el.querySelectorAll("[data-rok]").forEach(b=>b.onclick=()=>{ const x = D.liquidacoes.find(y=>y.id===b.dataset.rok), ref = el.querySelector(`[data-rr="${x.id}"]`).value.trim(), dt = el.querySelector(`[data-rd="${x.id}"]`).value||hoje();
    if(!ref) return alert(x.tipo==="pagamento"?"Escreva o n.º da transferência.":"Escreva o n.º do recibo.");
    x.estado = x.tipo==="pagamento"?"pago":"emitido"; x.ref = ref; x.fecho = dt; x.hist.push(`${hoje()}: ${x.estado} (${ref})`);
    const ks = x.docs.map(d=>d.k).filter(k=>!k.startsWith("X|")), v = x.docs.filter(d=>!d.k.startsWith("X|")).reduce((t,d)=>t+d.valor,0);
    if(v>0.005) registaPag(x.ent, x.tipo, dt, v, x.tipo==="pagamento"?"Transferência":"Recebimento", `${x.id} · ${ref}`, ks);
    grava(); contas() });
  el.querySelectorAll("[data-ran]").forEach(b=>b.onclick=()=>{ const x = D.liquidacoes.find(y=>y.id===b.dataset.ran); if(!confirm(`Anular o pedido ${x.id}?`)) return;
    x.estado = "anulado"; x.hist.push(`${hoje()}: anulado`); if(x.pp){ const p = pp(x.pp); if(p.id && p.estado!=="Pago") mdaEtapa(p, "Recusado", "liquidação anulada") } grava(); contas() });
}

// ---- Jurídico (cobranças): só por decisão do Ricardo ----
function finJuridico(el){
  const J = Object.entries(D.juridico||{}), R = finAbertos(false), EST = ["em cobrança","carta enviada","acordo de pagamento","injunção","pago","perdido"];
  el.innerHTML = `<section class="card"><div style="overflow:auto"><table class="tb"><thead><tr><th>Cliente</th><th>Desde</th><th class="num">Em aberto</th><th class="num">Vencido</th><th>Estado</th><th>Notas</th></tr></thead><tbody>
    ${J.map(([id,j])=>{ const L = R.filter(x=>x.ent===id); return `<tr><td class="click" data-fent="${esc(id)}"><b>${esc(nomeE(id))}</b> <small class="t">${esc(numsEnt(id)||"")}</small></td><td>${dtl(j.desde)}</td><td class="num">${eur(L.reduce((t,x)=>t+x.falta,0))}</td><td class="num">${eur(L.filter(x=>x.esc!==ESC[0]).reduce((t,x)=>t+x.falta,0))}</td>
      <td><select data-je="${esc(id)}">${EST.map(s=>`<option ${s===j.estado?"selected":""}>${s}</option>`).join("")}</select></td><td><input data-jn="${esc(id)}" value="${esc(j.notas||"")}" style="width:100%"></td></tr>` }).join("") || '<tr><td colspan="6" class="vazio">Nenhum cliente no jurídico. Só entra quem passar por decisão sua (nas contas correntes ou nas liquidações).</td></tr>'}</tbody></table></div></section>`;
  el.querySelectorAll("[data-je]").forEach(s=>s.onchange=()=>{ D.juridico[s.dataset.je].estado = s.value; grava() });
  el.querySelectorAll("[data-jn]").forEach(s=>s.onchange=()=>{ D.juridico[s.dataset.jn].notas = s.value; grava() });
  el.querySelectorAll("[data-fent]").forEach(t=>t.onclick=()=>{ selEnt = t.dataset.fent; tabSel = "ent"; abre("vEntid") });
}

// ---- Conta corrente na ficha da entidade (logo no topo, como no Smart Farm) ----
async function entCCErp(id){ const l = ligDe(id), c = FX.cc[id] = {a:true, forn:[], cli:[]};
  try{ for(const cod of l.forn){ const j = await mot("/api/erp/ccforn?cod="+cod); if(j.ok) c.forn.push({cod, ...j.cc}) }
    for(const cod of l.cli){ const j = await mot("/api/erp/cc?cli="+cod); if(j.ok) c.cli.push({cod, ...j.cc}) } }catch(e){ c.erro = String(e.message||e) }
  c.a = false; if(vista==="vEntid" && selEnt===id) entCC(id) }
function entCC(id){
  const el = $("entCC"); if(!el || el.dataset.ent!==id) return;
  if(!FX.lig && window.MDA_MOTOR_CHAVE && !FX.carregando){ finCarregar(); }
  const P = finAbertos(true).filter(x=>x.ent===id), R = finAbertos(false).filter(x=>x.ent===id), l = ligDe(id), c = FX.cc[id];
  if(FX.lig && (l.forn.length||l.cli.length) && !c) entCCErp(id);
  const tP = P.reduce((t,x)=>t+x.falta,0), tR = R.reduce((t,x)=>t+x.falta,0), venc = [...P,...R].filter(x=>x.esc!==ESC[0]).reduce((t,x)=>t+x.falta,0);
  const linha = x => `<tr><td>${dtl(x.data)}</td><td><b>${esc(x.nome)}</b>${x.porFaturar?' <span class="pill w">por faturar</span>':""}</td><td><small>${x.descr||""}</small></td><td>${x.venc?dtl(x.venc):"—"}</td><td class="num">${eur(x.falta)}</td><td>${x.dias>0?`<span class="pill ${x.dias>90?"bad":"w"}">${x.dias} d</span>`:'<span class="pill info">a vencer</span>'}</td><td><button class="act light sm" data-cver="${esc(x.k)}">Ver</button></td></tr>`;
  // conta corrente do Eticadata (fornecedor: faturas e pagamentos; cliente: faturas e recibos), com saldo corrido
  const erp = c && !c.a ? [...c.forn.map(f=>{ let s = 0; const M = [...f.docs.map(d=>({data:d.data, nome:`${d.tp} ${d.n}${d.ext?" ("+d.ext+")":""}`, descr:d.descr, venc:d.venc, deve:0, haver:d.total, est:Math.abs(d.pend)<0.01?"paga":`por pagar ${eur(d.pend)}`, d})), ...f.pags.map(p=>({data:p.data, nome:p.num, descr:"Pagamento", deve:p.valor, haver:0, d:p}))].sort((a,b)=>(a.data||"").localeCompare(b.data||""));
      return `<h4 style="margin:12px 0 4px">Eticadata · fornecedor ${f.cod} <small class="t">${esc((f.fornecedor||{}).nome||"")}</small></h4><table class="tb"><thead><tr><th>Data</th><th>Documento</th><th>Descrição</th><th>Vencimento</th><th class="num">Pago (deve)</th><th class="num">Faturado (haver)</th><th class="num">Saldo</th><th>Estado</th><th></th></tr></thead><tbody>
        ${M.map(m=>{ s += m.haver - m.deve; return `<tr><td>${dtl(m.data)}</td><td>${esc(m.nome)}</td><td><small>${esc(m.descr||"")}</small></td><td>${m.venc?dtl(m.venc):""}</td><td class="num">${m.deve?eur(m.deve):""}</td><td class="num">${m.haver?eur(m.haver):""}</td><td class="num"><b>${eur(s)}</b></td><td><small>${m.est||""}</small></td><td><button class="act light sm" data-cerp='${esc(JSON.stringify({lado:"compra", ex:m.d.ex, sec:m.d.sec, tp:m.d.tp, n:m.d.n, nome:m.nome}))}'>Ver</button></td></tr>` }).join("")||'<tr><td colspan="9" class="vazio">Sem documentos.</td></tr>'}</tbody></table>` }),
    ...c.cli.map(f=>{ let s = 0; const M = [...(f.docs||[]).map(d=>{ const nc = String(d.tp).startsWith("NC"), ab = d.total-(d.liquidado||0); return {data:d.data, nome:d.num, descr:d.descr, venc:d.venc, deve:nc?0:d.total, haver:nc?Math.abs(d.total):0, est:nc?"":Math.abs(ab)<0.01?"paga":(d.liquidado>0?"parcial · ":"em aberto · ")+eur(ab), venda:d.num} }), ...(f.recs||[]).map(r=>({data:r.data, nome:r.num, descr:"Recibo", deve:0, haver:r.valor, rec:r}))].sort((a,b)=>(a.data||"").localeCompare(b.data||""));
      return `<h4 style="margin:12px 0 4px">Eticadata · cliente ${f.cod}</h4><table class="tb"><thead><tr><th>Data</th><th>Documento</th><th>Descrição</th><th>Vencimento</th><th class="num">Faturado (deve)</th><th class="num">Recebido (haver)</th><th class="num">Saldo</th><th>Estado</th><th></th></tr></thead><tbody>
        ${M.map(m=>{ s += m.deve - m.haver; return `<tr><td>${dtl(m.data)}</td><td>${esc(m.nome)}</td><td><small>${esc(m.descr||"")}</small></td><td>${m.venc?dtl(m.venc):""}</td><td class="num">${m.deve?eur(m.deve):""}</td><td class="num">${m.haver?eur(m.haver):""}</td><td class="num"><b>${eur(s)}</b></td><td><small>${m.est||""}</small></td><td>${m.venda?`<button class="act light sm" data-cerp='${esc(JSON.stringify({lado:"venda", num:m.venda, nome:m.nome}))}'>Ver</button>`:m.rec&&m.rec.tpe?`<button class="act light sm" data-cerp='${esc(JSON.stringify({lado:"compra", ex:m.rec.ex, sec:m.rec.sec, tp:m.rec.tpe, n:m.rec.n, nome:m.nome}))}'>Ver</button>`:""}</td></tr>` }).join("")||'<tr><td colspan="9" class="vazio">Sem documentos.</td></tr>'}</tbody></table>` })].join("") : "";
  el.innerHTML = `<section class="card fxFicha"><h2><span>💶 Conta corrente · ${esc(nomeE(id))}</span><span style="display:flex;gap:6px;flex-wrap:wrap">${tP>0.005?`<button class="act sec sm" data-cliq="pagar">Pagar ${eur(tP)}</button>`:""}${tR>0.005?`<button class="act sec sm" data-cliq="receber">Receber ${eur(tR)}</button>`:""}</span></h2>
    <div class="metricgrid q4" style="margin-bottom:8px">${[["A pagar-lhe",tP],["A receber dele",tR],["Saldo",tR-tP],["Vencido",venc]].map(([t,v])=>`<div class="metric"><small>${t.toUpperCase()}</small><b>${eur(v)}</b></div>`).join("")}</div>
    <div class="sub">Eticadata: ${!window.MDA_MOTOR_CHAVE?"abra o programa pelo motor.":!FX.lig?"⏳ a ligar…":l.forn.length||l.cli.length?`${[...l.forn.map(x=>"fornecedor "+x),...l.cli.map(x=>"cliente "+x)].join(" · ")} <small class="t">(${esc(l.via)})</small>`:"sem ligação"}${(l.duvida||[]).length?` <span class="pill w" title="As faturas desta entidade no programa estão no Eticadata em nome de outra entidade">a confirmar: ${l.duvida.map(d=>`${d.lado==="forn"?"fornecedor":"cliente"} ${d.cod} ${esc(d.nome)}`).join(" · ")}</span>`:""} <button class="act light sm" id="ccLig">${l.forn.length||l.cli.length?"Mudar a ligação":"Ligar ao Eticadata"}</button></div><div id="ccLigBox"></div>
    ${P.length||R.length?`<h4 style="margin:12px 0 4px">Em aberto</h4><div style="overflow:auto"><table class="tb"><thead><tr><th>Data</th><th>Documento</th><th>Descrição</th><th>Vencimento</th><th class="num">Em aberto</th><th>Estado</th><th></th></tr></thead><tbody>${[...P,...R].map(linha).join("")}</tbody></table></div>`:'<div class="sub" style="margin-top:8px">Nada em aberto.</div>'}
    ${c&&c.a?'<div class="sub">⏳ a ler a conta corrente no Eticadata…</div>':erp?`<details><summary style="cursor:pointer;font-weight:800;color:var(--azul);margin-top:10px">Conta corrente no Eticadata (todos os documentos, também do passado)</summary><div style="overflow:auto">${erp}</div></details>`:""}</section>`;
  el.querySelectorAll("[data-cliq]").forEach(b=>b.onclick=()=>finIrLiq(b.dataset.cliq, id));
  el.querySelectorAll("[data-cver]").forEach(b=>b.onclick=()=>{ const x = [...P,...R].find(y=>y.k===b.dataset.cver); if(x) docAbrir(x) });
  el.querySelectorAll("[data-cerp]").forEach(b=>b.onclick=()=>docAbrir({erpRef:JSON.parse(b.dataset.cerp), ent:id}));
  $("ccLig").onclick = () => { const bx = $("ccLigBox"); bx.innerHTML = `<div style="display:flex;gap:8px;align-items:center;margin-top:6px"><input id="ccQ" placeholder="nome, n.º ou NIF no Eticadata" style="max-width:320px" value="${esc(nomeE(id))}"><button class="act light sm" id="ccProc">Procurar</button></div><div id="ccRes"></div>`;
    $("ccProc").onclick = async () => { $("ccRes").innerHTML = '<div class="sub">⏳ a procurar…</div>'; const j = await mot("/api/erp/procurar", {q:$("ccQ").value});
      $("ccRes").innerHTML = (j.r||[]).map((x,i)=>`<label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13px;margin:3px 0"><input type="checkbox" data-cl="${i}" ${(x.lado==="forn"?l.forn:l.cli).includes(x.cod)?"checked":""} style="width:16px"> ${x.lado==="forn"?"Fornecedor":"Cliente"} ${x.cod} · <b>${esc(x.nome)}</b> <small class="t">${esc(x.nif||"")} ${esc(x.loc||"")}</small></label>`).join("") + `<button class="act sec sm" id="ccGrava" style="margin-top:6px">Gravar a ligação</button>` || '<div class="sub">Nada encontrado.</div>';
      if($("ccGrava")) $("ccGrava").onclick = async () => { const S = [...$("ccRes").querySelectorAll("[data-cl]:checked")].map(c=>j.r[+c.dataset.cl]);
        const k = await mot("/api/erp/ligar-mao", {ent:id, forn:S.filter(x=>x.lado==="forn").map(x=>x.cod), cli:S.filter(x=>x.lado==="cli").map(x=>x.cod)});
        if(k.ok){ FX.lig[id] = k.lig; delete FX.cc[id]; FX.res = null; finCarregar() } } } };
}

// ---- Página do documento: linhas, PDF do Eticadata e a conversa desse documento ----
window.docAberto = null;
async function docAbrir(x){
  let p = $("docPag"); if(!p){ p = document.createElement("div"); p.id = "docPag"; document.body.appendChild(p) }
  const ref = x.erpRef || (x.erp ? (x.erp.tp ? {lado:x.k.startsWith("X|forn")?"compra":"venda", ex:x.erp.ex, sec:x.erp.sec, tp:x.erp.tp, n:x.erp.n, num:x.erp.num} : {lado:"venda", num:x.erp.num}) : null);
  const doc = x.doc, ent = x.ent || "", titulo = x.nome || (ref&&ref.nome) || "Documento";
  window.docAberto = {tipo:ref&&ref.lado==="compra"?"compra":"fatura", id:(ref&&(ref.num||[ref.tp,ref.ex,ref.n].join(" ")))||x.k, titulo:`${titulo} · ${nomeE(ent)}`, ent};
  document.body.classList.add("comDoc"); try{ ladoDesenhar() }catch(e){}
  p.innerHTML = `<div class="dpCab"><button class="act light sm" id="dpFecha">← Voltar</button><h2>${esc(titulo)}</h2><span class="t">${esc(nomeE(ent))}</span><span id="dpAc" style="margin-left:auto"></span></div><div class="dpCorpo"><div class="dpLin" id="dpLin"><div class="sub">⏳ a ler…</div></div><div class="dpPdf" id="dpPdf"></div></div>`;
  $("dpFecha").onclick = docFechar;
  const ab = x.falta>0.005 && x.ent && !String(x.ent).startsWith("?");
  if(ab) $("dpAc").innerHTML = `<button class="act sec sm" id="dpLiq">${x.k.startsWith("V|")||x.k.startsWith("X|cli")?"Pedir recibo":"Pagar"} ${eur(x.falta)}</button>`;
  if($("dpLiq")) $("dpLiq").onclick = () => finIrLiq(x.k.startsWith("V|")||x.k.startsWith("X|cli")?"receber":"pagar", x.ent, [x.k]);
  if(!ref){   // documento só do programa (talão, guia, fatura importada sem chave)
    const f = doc && doc.fatura;
    $("dpLin").innerHTML = `<table class="tb"><tbody><tr><td>Documento</td><td><b>${esc(titulo)}</b></td></tr><tr><td>Data</td><td>${dtl(x.data)}</td></tr><tr><td>Descrição</td><td>${x.descr||""}</td></tr>
      ${f?`<tr><td>Fatura</td><td>${esc(f.numFornecedor||"")} ${esc(f.numInterno||"")}</td></tr><tr><td>Total</td><td>${eur(f.total)}</td></tr>`:`<tr><td>Valor</td><td>${eur(x.valor)}</td></tr>`}<tr><td>Em aberto</td><td><b>${eur(x.falta)}</b></td></tr></tbody></table>
      ${x.porFaturar?'<div class="alerta" style="margin-top:8px">Validado no programa, ainda sem fatura no Eticadata. Pode pagar-se em dinheiro (com a fatura do fornecedor) ou em maquia de azeite.</div>':""}
      ${doc&&doc.ticketLimpo!==undefined?`<button class="act light sm" id="dpTal" style="margin-top:8px">Abrir o talão</button>`:""}`;
    if($("dpTal")) $("dpTal").onclick = () => { docFechar(); selG = doc.id; abre("vVal") };
    $("dpPdf").innerHTML = '<div class="sub" style="padding:20px">Sem PDF do Eticadata para este documento.</div>'; return }
  try{ const q = ref.lado==="compra" ? `lado=compra&ex=${encodeURIComponent(ref.ex)}&sec=${encodeURIComponent(ref.sec)}&tp=${encodeURIComponent(ref.tp)}&n=${ref.n}` : `lado=venda&num=${encodeURIComponent(ref.num)}`;
    const j = await mot("/api/erp/docinfo?"+q); if(!j.ok) throw new Error(j.erro); const d = j.doc, c = d.cab, siva = (+c.total||0)-(+c.iva||0);
    $("dpLin").innerHTML = `<div class="sub">${esc(c.num||"")}${c.ext?" · n.º do fornecedor "+esc(c.ext):""} · ${dtl(c.data)}${c.venc?" · vence "+dtl(c.venc):""} · ${esc(c.nome||"")}</div>
      <table class="tb"><thead><tr><th>Artigo</th><th>Descrição</th><th class="num">Qtd.</th><th class="num">Preço</th><th class="num">IVA</th><th class="num">Valor</th></tr></thead><tbody>
      ${(d.linhas||[]).map(l=>`<tr><td><small>${esc(l.art||"")}</small></td><td>${esc(l.descr||"")}</td><td class="num">${l.qt??""}</td><td class="num">${eur(+l.preco||0)}</td><td class="num">${l.iva!=null?l.iva+" %":""}</td><td class="num">${eur(+l.valor||0)}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td colspan="5">Sem IVA</td><td class="num">${eur(siva)}</td></tr><tr><td colspan="5">IVA</td><td class="num">${eur(+c.iva||0)}</td></tr><tr><td colspan="5">Total</td><td class="num"><b>${eur(+c.total||0)}</b></td></tr></tfoot></table>
      ${c.pend!=null?`<div style="margin-top:6px">${Math.abs(+c.pend)<0.01?'<span class="pill ok">paga</span>':`<span class="pill w">por pagar ${eur(+c.pend)}</span>`}</div>`:""}
      ${(d.anexos||[]).length>1?`<div class="sub" style="margin-top:8px">Outros anexos: ${d.anexos.slice(1).map(a=>`<a href="/api/erp/anexo?id=${a.id}&chave=${encodeURIComponent(window.MDA_MOTOR_CHAVE)}" target="_blank">${esc(a.nome)}</a>`).join(" · ")}</div>`:""}`;
    const a = (d.anexos||[])[0];
    $("dpPdf").innerHTML = a ? `<iframe src="/api/erp/anexo?id=${a.id}&chave=${encodeURIComponent(window.MDA_MOTOR_CHAVE)}"></iframe><a class="act light sm" target="_blank" href="/api/erp/anexo?id=${a.id}&chave=${encodeURIComponent(window.MDA_MOTOR_CHAVE)}">Abrir o PDF noutra janela</a>`
      : '<div class="sub" style="padding:20px">O Eticadata não tem o PDF deste documento no arquivo digital.</div>';
  }catch(e){ $("dpLin").innerHTML = `<div class="alerta">Não consegui ler o documento no Eticadata: ${esc(e.message||e)}</div>` }
}
window.docFechar = () => { const p = $("docPag"); if(p) p.remove(); window.docAberto = null; document.body.classList.remove("comDoc"); try{ ladoDesenhar() }catch(e){} };
window.addEventListener("keydown", ev => { if(ev.key==="Escape" && window.docAberto) docFechar() });
