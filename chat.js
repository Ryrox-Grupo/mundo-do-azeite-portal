// ---- Chat Ryrox no Mundo do Azeite (07-11-2026; conversas por documento a 21-11-2026) ----
// Segue o desenho comum dos programas (Projetos/_alicerce/specs/2026-11-21-conversas-design.md), ainda com os dados no
// programa (D.mensagens) e não na base central:
// - cada entidade (fornecedor, lagar, prestador, cliente) tem a sua conversa;
// - cada documento (talão, guia, venda, embalamento, receção, guia de transporte) tem a sua conversa, ligada à entidade:
//   a conversa da entidade mostra também as mensagens dos documentos dela, com a etiqueta do documento (a cadeia);
// - canais: "chat" (portal do fornecedor), "whatsapp" e "email" (abrem com o texto e ficam registados) e "interna"
//   (notas da equipa, amarelas: o fornecedor nunca as vê); as alterações (validar, reabrir...) ficam a cinzento.
// Usado por portal.html (modo "cliente" ou "ryrox" a ver como ele) e por index.html (modo "programa": caixa de todas as conversas
// e caixa de conversa dentro de cada ficha).
(function(){
  const CAN = {chat:["💬","Portal"], whatsapp:["🟢","WhatsApp"], email:["✉️","E-mail"], interna:["🔒","Nota interna"]};
  const e = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
  const quando = iso => { const d = new Date(iso), h = new Date(); return d.toDateString()===h.toDateString() ? d.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}) : d.toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}) };
  let O = null, aberto = false, conv = null, separador = "conversas";
  const canalDe = {};   // canal escolhido em cada conversa
  const dados = () => (O.dados ? O.dados() : D);
  const soConsulta = () => !!window.MDA_SO_CONSULTA;
  const cliente = () => O.modo==="cliente";
  // entidades de todos os papéis (o mesmo id pode ser fornecedor e cliente)
  const GRUPOS = [["produtores","Fornecedores"],["lagares","Lagares"],["prestadores","Prestadores"],["clientes","Clientes"]];
  function ents(){ const d = dados(), m = {};
    GRUPOS.forEach(([k])=>(d[k]||[]).forEach(r=>{ const x = m[r.id] = m[r.id]||{id:r.id, nome:r.nome, grupos:[]}; x.grupos.push(k);
      ["tel","email","portal","acessos"].forEach(c=>{ if(r[c]!=null && x[c]==null) x[c] = r[c] }) }));
    return m }
  const chave = c => c.doc ? "d|"+c.doc : "e|"+c.prod;
  const daConv = (m, c) => c.doc ? m.doc===c.doc : m.prod===c.prod;
  const todas = () => (dados().mensagens||[]).filter(m=>!cliente() || (m.canal!=="interna" && m.tipo!=="alt"));
  const msgs = c => todas().filter(m=>daConv(m,c)).sort((a,b)=>a.data.localeCompare(b.data));
  // por ler: do lado do cliente, o que a Ryrox escreveu; do lado da Ryrox, o que o cliente escreveu
  const kLida = () => cliente() ? "lidaC" : "lidaR";
  const naoLida = m => m.de===(cliente()?"ryrox":"cliente") && !m[kLida()];
  const porLer = c => msgs(c).filter(naoLida).length;
  function grava(fn){
    if(O.guardar){ const d = dados(); d.mensagens = d.mensagens||[]; fn(d); O.guardar(d); return }   // programa: mexe nos dados abertos
    const d = mdaCarregar(); d.mensagens = d.mensagens||[]; fn(d); if(O.grava) O.grava(d); else localStorage.setItem(MDA_CHAVE, JSON.stringify(d)); if(O.depois) O.depois(d) }
  const novaMsg = (o) => Object.assign({id:"M"+Date.now().toString(36)+Math.random().toString(36).slice(2,5), data:new Date().toISOString()}, o);
  // registo de uma mensagem (também usado pelos botões de partilha, que já não ficam fora da conversa)
  window.chatRegista = (pid, texto, can, de, doc) => { de = de || (O&&cliente()?"cliente":"ryrox");
    const x = {prod:pid, de, canal:can||"chat", texto, lidaR:de==="ryrox", lidaC:de==="cliente"};
    if(doc){ x.doc = doc.doc; x.docT = doc.docT; if(doc.docTipo) x.docTipo = doc.docTipo }
    grava(d=>d.mensagens.push(novaMsg(x))) };
  // alteração num documento (validar, reabrir, retificação...): fica na conversa a cinzento; quem chama grava os dados
  window.chatAlteracao = (pid, doc, texto) => { if(!O || cliente()) return; const d = dados(); d.mensagens = d.mensagens||[];
    d.mensagens.push(novaMsg({prod:pid||"", doc:doc&&doc.doc, docT:doc&&doc.docT, docTipo:doc&&doc.docTipo, de:"ryrox", canal:"interna", tipo:"alt", texto, lidaR:true, lidaC:true})) };
  function marcaLidas(c){ if(soConsulta()) return; const k = kLida(); if(!msgs(c).some(m=>naoLida(m))) return;
    grava(d=>(d.mensagens||[]).forEach(m=>{ if(daConv(m,c) && m.de===(cliente()?"ryrox":"cliente")) m[k] = true })) }

  const contacto = p => { const tel = String((p&&p.tel)||"").replace(/\D/g,""), wa = tel.length===9 ? "351"+tel : tel;
    // o e-mail da ficha; senão o da primeira pessoa com acesso ao portal (só se for mesmo um e-mail, há quem entre com utilizador)
    const L = [p&&p.email, ...((p&&p.portal&&p.portal.pessoas)||[]).map(a=>a.email), p&&p.portal&&p.portal.email];
    return {wa, em: L.find(x=>/@/.test(x||""))||""} };
  const temPortal = p => !!(p && p.portal && p.portal.ativo);
  const canais = p => cliente() ? ["chat"] : Object.keys(CAN).filter(k=>k!=="chat" || temPortal(p) || O.modo==="ryrox");
  const canalAtual = (c, p) => { const L = canais(p), k = chave(c); if(!L.includes(canalDe[k])) canalDe[k] = c.doc ? "interna" : L.includes("chat") ? "chat" : "interna"; return canalDe[k] };

  // uma mensagem na linha do tempo
  function bolha(m, c){ const E = ents(), p = E[m.prod]||{};
    const etq = !c.doc && m.doc ? `<span class="chDoc" data-chabre="${e(m.doc)}|${e(m.prod)}|${e(m.docT||m.doc)}|${e(m.docTipo||"")}" title="Abrir a conversa deste documento">📄 ${e(m.docT||m.doc)}</span> ` : "";
    if(m.tipo==="alt") return `<div class="chAlt">${etq}${e(m.texto)} · ${quando(m.data)}</div>`;
    const lado = m.canal==="interna" ? "int" : m.de===(cliente()?"cliente":"ryrox") ? "eu" : "ele";
    const quem = m.canal==="interna" ? "🔒 nota interna (o fornecedor não vê)" : `${m.de==="ryrox"?"Ryrox":e(cliente()?"Eu":p.nome||"")} · ${CAN[m.canal][0]} ${CAN[m.canal][1]}`;
    return `<div class="chM ${lado}"><div class="chB">${etq}${e(m.texto).replace(/\n/g,"<br>")}</div><small>${quem} · ${quando(m.data)}</small></div>` }

  // a caixa de escrever (painel e fichas)
  function escrever(c, p, onde){
    if(soConsulta()) return `<div class="chEsc chSo">👁 Só consulta: as mensagens escrevem-se no programa do escritório.</div>`;
    const ryrox = !cliente(), can = canalAtual(c, p), {wa, em} = contacto(p);
    const dica = k => k==="chat"?"Aparece no portal do fornecedor":k==="interna"?"Só a equipa da Ryrox vê":k==="whatsapp"?(wa?"Abre o WhatsApp com o texto e fica registado aqui":"Esta entidade não tem telemóvel"):(em?"Abre o e-mail com o texto e fica registado aqui":"Esta entidade não tem e-mail");
    const ph = can==="interna"&&ryrox ? "Nota para a equipa (o fornecedor não vê)…" : can==="whatsapp" ? `WhatsApp para ${p.nome||""}…` : can==="email" ? `E-mail para ${p.nome||""}…` : "Escreva a mensagem…";
    return `<div class="chEsc" data-chx="${e(JSON.stringify(c))}" data-onde="${onde}">${ryrox?`<div class="chCan">${canais(p).map(k=>`<button data-can="${k}" class="${k===can?"on":""}" title="${dica(k)}" ${(k==="whatsapp"&&!wa)||(k==="email"&&!em)?"disabled":""}>${CAN[k][0]} ${CAN[k][1]}</button>`).join("")}</div>`:""}
      <div class="chLin"><textarea rows="2" class="chTxt${can==="interna"&&ryrox?" int":""}" placeholder="${e(ph)}"></textarea><button class="chEnv" title="Enviar (Enter)">➤</button></div></div>` }
  function envia(box){ const c = JSON.parse(box.dataset.chx), t = box.querySelector(".chTxt").value.trim(); if(!t) return;
    const p = ents()[c.prod]||{}, ryrox = !cliente(), can = ryrox ? canalAtual(c, p) : "chat", {wa, em} = contacto(p);
    if(can==="whatsapp") window.open(`https://wa.me/${wa}?text=${encodeURIComponent(t)}`, "_blank");
    if(can==="email") location.href = `mailto:${encodeURIComponent(em)}?subject=${encodeURIComponent(c.docT ? c.docT+" · Ryrox Agro" : "Ryrox Agro")}&body=${encodeURIComponent(t)}`;
    chatRegista(c.prod, t, can, ryrox?"ryrox":"cliente", c.doc ? c : null); desenha() }

  // caixa de conversa dentro de uma ficha do programa (talão, guia, entidade...)
  window.chatCaixa = c => { if(!O) return ""; const p = ents()[c.prod]||{}, M = msgs(c), n = c.doc ? todas().filter(m=>m.prod===c.prod && m.doc!==c.doc).length : 0;
    const ult = M.slice(-6);
    return `<div class="box chCx" data-nonav><h3><span>💬 Conversa ${c.doc?"deste documento":"com "+e(p.nome||"")}</span><span style="display:flex;gap:6px">${porLer(c)?`<span class="pill w">${porLer(c)} por ler</span>`:""}<button class="act light sm" data-chabre="${e(c.doc||"")}|${e(c.prod||"")}|${e(c.docT||"")}|${e(c.docTipo||"")}">Abrir conversa ↗</button></span></h3>
      ${c.doc&&c.prod?`<div class="sub" style="margin:0 0 6px">Ligada a <b>${e(p.nome||c.prod)}</b>${n?` · há mais ${n} mensagem(ns) noutros documentos e na conversa geral`:""}.</div>`:""}
      <div class="chMsgs chMini">${M.length>ult.length?`<div class="chAlt">… ${M.length-ult.length} mensagem(ns) anteriores: abra a conversa</div>`:""}${ult.map(m=>bolha(m,c)).join("")||`<p class="chVz">Ainda não há mensagens. Escreva uma nota para a equipa ou uma mensagem para ${e(p.nome||"a entidade")}.</p>`}</div>
      ${escrever(c, p, "ficha")}</div>` };

  function botao(){ let b = document.getElementById("chatBt"); if(!b){ b = document.createElement("button"); b.id = "chatBt"; document.body.appendChild(b); b.onclick = () => { aberto = !aberto; desenha() } }
    const n = O.modo==="programa" ? todas().filter(naoLida).length : porLer({prod:O.prod()});
    b.innerHTML = `💬 <span>Conversas</span>${n?`<i>${n}</i>`:""}`; b.classList.toggle("on", aberto) }

  // lista de conversas (programa): as que têm mensagens, e as entidades de cada grupo para começar uma conversa nova
  function lista(){ const E = ents(), M = todas(), C = {};
    M.forEach(m=>{ const c = m.doc ? {doc:m.doc, docT:m.docT, docTipo:m.docTipo, prod:m.prod} : {prod:m.prod}, k = chave(c);
      const x = C[k] = C[k]||{c, ult:null, n:0}; if(!x.ult || m.data>x.ult.data) x.ult = m; if(naoLida(m)) x.n++ });
    const tabs = [["conversas","Conversas"],["porler","Por ler"],...GRUPOS];
    let L;
    if(separador==="conversas" || separador==="porler") L = Object.values(C).filter(x=>separador!=="porler"||x.n).sort((a,b)=>b.ult.data.localeCompare(a.ult.data));
    else L = Object.values(E).filter(x=>x.grupos.includes(separador)).map(x=>C["e|"+x.id]||{c:{prod:x.id}, ult:null, n:0}).sort((a,b)=>((b.ult||{}).data||"").localeCompare((a.ult||{}).data||"")||String(E[a.c.prod].nome).localeCompare(E[b.c.prod].nome));
    const linha = ({c,ult,n}) => { const p = E[c.prod]||{}, tit = c.doc ? `📄 ${c.docT||c.doc}` : p.nome||c.prod;
      return `<button data-conv="${e(JSON.stringify(c))}"><b>${e(tit)}</b>${n?`<i>${n}</i>`:""}<small>${c.doc?e(p.nome||"")+" · ":""}${ult?`${ult.tipo==="alt"?"✎":CAN[ult.canal][0]} ${e(ult.texto.slice(0,70))}`:"sem mensagens"}</small></button>` };
    return `<header><b>Conversas</b><button data-fecha title="Fechar">×</button></header>
      <div class="chTabs">${tabs.map(([k,t])=>`<button data-sep="${k}" class="${k===separador?"on":""}">${t}</button>`).join("")}</div>
      <input class="chBusca" placeholder="Procurar">
      <div class="chLista">${L.map(linha).join("")||`<p class="chVz">${separador==="porler"?"Não há mensagens por ler.":"Ainda não há conversas. Abra um talão, uma guia ou uma ficha e escreva na caixa 💬 Conversa."}</p>`}</div>` }

  function desenha(){
    if(!O) return; botao(); let el = document.getElementById("chatP");
    if(!aberto){ if(el) el.remove(); return }
    if(!el){ el = document.createElement("aside"); el.id = "chatP"; el.dataset.nonav = "1"; document.body.appendChild(el) }
    if(O.modo!=="programa") conv = {prod:O.prod()};
    const busca = el.querySelector(".chBusca"), q = busca ? busca.value : "";
    if(O.modo==="programa" && !conv){ el.innerHTML = lista();
      const b = el.querySelector(".chBusca"); b.value = q; const filtra = () => { const t = b.value.toLowerCase(); el.querySelectorAll("[data-conv]").forEach(x=>x.hidden = !x.textContent.toLowerCase().includes(t)) };
      b.oninput = filtra; if(q) filtra();
      el.querySelectorAll("[data-sep]").forEach(x=>x.onclick=()=>{ separador = x.dataset.sep; desenha() });
    } else {
      const c = conv, p = ents()[c.prod]||{}, M = msgs(c), {wa, em} = contacto(p), nGeral = c.doc ? todas().filter(m=>m.prod===c.prod && m.doc!==c.doc).length : 0;
      const tit = cliente() ? "Mensagens com a Ryrox Agro" : c.doc ? "📄 "+(c.docT||c.doc) : p.nome||"";
      el.innerHTML = `<header>${O.modo==="programa"?'<button data-volta title="Voltar">‹</button>':""}<b>${e(tit)}</b>${c.doc&&O.abreDoc?`<button data-irdoc title="Abrir o documento no programa">↗</button>`:""}<button data-fecha title="Fechar">×</button></header>
        ${!cliente()?`<div class="chInfo">${c.doc&&c.prod?`Ligada a <b class="chLk" data-chabre="|${e(c.prod)}||">${e(p.nome||c.prod)}</b>${nGeral?` (mais ${nGeral} mensagem(ns))`:""} · `:""}${wa?"📱 "+e(p.tel):"sem telemóvel"} · ${em?"✉️ "+e(em):"sem e-mail"}</div>`:""}
        <div class="chMsgs">${M.length?M.map(m=>bolha(m,c)).join(""):`<p class="chVz">${cliente()?"Escreva-nos aqui: respondemos por esta conversa.":c.doc?"Ainda não há mensagens sobre este documento.":"Ainda não há mensagens com esta entidade."}</p>`}</div>
        ${escrever(c, p, "painel")}`;
      const box = el.querySelector(".chMsgs"); box.scrollTop = box.scrollHeight; marcaLidas(c);
      const v = el.querySelector("[data-volta]"); if(v) v.onclick = () => { conv = null; desenha() };
      const d = el.querySelector("[data-irdoc]"); if(d) d.onclick = () => O.abreDoc(c);
      const t = el.querySelector(".chTxt"); if(t) setTimeout(()=>t.focus(), 0);
    }
    el.querySelectorAll("[data-conv]").forEach(b=>b.onclick=()=>{ conv = JSON.parse(b.dataset.conv); desenha() });
    el.querySelector("[data-fecha]").onclick = () => { aberto = false; desenha() };
  }
  // cliques e Enter nas caixas de escrever (painel e fichas) e nas etiquetas dos documentos
  document.addEventListener("click", ev=>{
    const a = ev.target.closest("[data-chabre]"); if(a){ ev.preventDefault(); ev.stopPropagation(); const [doc, prod, docT, docTipo] = a.dataset.chabre.split("|"); window.chatAbreDoc(doc ? {doc, prod, docT:docT||doc, docTipo} : {prod}); return }
    const k = ev.target.closest("[data-can]"); if(k && k.closest(".chEsc")){ const box = k.closest(".chEsc"), c = JSON.parse(box.dataset.chx), txt = box.querySelector(".chTxt").value;
      canalDe[chave(c)] = k.dataset.can; if(box.dataset.onde==="painel") desenha(); else if(O.redesenha) O.redesenha(); else desenha();
      const nb = [...document.querySelectorAll(".chEsc")].find(x=>x.dataset.chx===box.dataset.chx && x.dataset.onde===box.dataset.onde); if(nb && txt) nb.querySelector(".chTxt").value = txt; return }
    const s = ev.target.closest(".chEnv"); if(s){ envia(s.closest(".chEsc")); if(s.closest(".chCx") && O.redesenha) O.redesenha() }
  }, true);
  document.addEventListener("keydown", ev=>{ if(ev.key==="Enter" && !ev.shiftKey && ev.target.classList && ev.target.classList.contains("chTxt")){ ev.preventDefault(); const box = ev.target.closest(".chEsc"); envia(box); if(box.dataset.onde==="ficha" && O.redesenha) O.redesenha() } });

  // abre a conversa de uma entidade (ex.: a partir da ficha dele) ou de um documento
  window.chatAbre = pid => { if(pid) conv = {prod:pid}; aberto = true; desenha() };
  window.chatAbreDoc = c => { conv = c; aberto = true; desenha() };
  window.chatIniciar = opts => { O = opts; desenha() };
  window.chatAtualiza = () => { if(O){ const t = document.querySelector("#chatP .chTxt"), v = t ? t.value : ""; desenha(); const t2 = document.querySelector("#chatP .chTxt"); if(t2 && v) t2.value = v } };
  window.addEventListener("storage", ev=>{ if(typeof MDA_CHAVE!=="undefined" && ev.key===MDA_CHAVE) setTimeout(()=>window.chatAtualiza(), 0) });
  const css = document.createElement("style"); css.textContent = `
#chatBt{position:fixed;right:22px;bottom:22px;z-index:60;border:0;background:#141a0d;color:#fff;font:700 15px Inter,"Segoe UI",sans-serif;padding:13px 18px;border-radius:3px;box-shadow:0 12px 30px #0004;cursor:pointer;display:flex;gap:8px;align-items:center}
#chatBt i{font-style:normal;background:#7cd23a;color:#141a0d;border-radius:3px;padding:1px 7px;font-size:13px}#chatBt.on{background:#3d5a1e}
#chatP{position:fixed;right:22px;bottom:80px;z-index:60;width:min(420px,calc(100vw - 24px));height:min(620px,calc(100vh - 110px));background:#fff;border:1.5px solid #141a0d;border-radius:3px;box-shadow:0 24px 60px #0005;display:flex;flex-direction:column;font:14px/1.4 Inter,"Segoe UI",sans-serif;color:#141a0d}
#chatP header{display:flex;align-items:center;gap:8px;background:#141a0d;color:#fff;padding:11px 12px;position:static;border:0;box-shadow:none}#chatP header b{flex:1;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#chatP header button{border:0;background:#ffffff1f;color:#fff;width:30px;height:30px;border-radius:3px;cursor:pointer;font-size:18px;line-height:1}
.chInfo{font-size:12px;color:#5a6350;padding:7px 12px;border-bottom:1px solid #e3e6dc;background:#f6f7f2}.chLk{cursor:pointer;text-decoration:underline dotted}
.chTabs{display:flex;gap:4px;flex-wrap:wrap;padding:8px 12px 0}.chTabs button{border:1px solid #e3e6dc;background:#fff;border-radius:3px;padding:4px 8px;font:600 12px Inter,sans-serif;cursor:pointer}.chTabs button.on{background:#141a0d;color:#fff;border-color:#141a0d}
.chBusca{margin:8px 12px 4px;width:calc(100% - 24px)!important}
.chLista{overflow:auto;flex:1;padding:4px 8px 10px}.chLista button{display:grid;grid-template-columns:1fr auto;width:100%;text-align:left;border:0;border-bottom:1px solid #eef0e8;background:#fff;padding:10px 8px;cursor:pointer;font:inherit;color:inherit}
.chLista button:hover{background:#f1f8e8}.chLista button small{grid-column:1/3;color:#5a6350;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chLista i{font-style:normal;background:#7cd23a;border-radius:3px;padding:0 7px;font-weight:800;font-size:12px}
.chMsgs{flex:1;overflow:auto;padding:14px 12px;background:#f4f5f0;display:flex;flex-direction:column;gap:10px}
.chMini{max-height:300px;padding:10px;border:1px solid #e3e6dc;border-radius:3px}
.chM{max-width:84%;display:flex;flex-direction:column}.chM small{font-size:11px;color:#5a6350;margin-top:3px}
.chM .chB{padding:9px 12px;border-radius:3px;background:#fff;border:1px solid #e3e6dc;white-space:normal;word-wrap:break-word}
.chM.eu{align-self:flex-end;align-items:flex-end}.chM.eu .chB{background:#141a0d;color:#fff;border-color:#141a0d}
.chM.ele{align-self:flex-start}.chM.int{align-self:flex-end;align-items:flex-end}.chM.int .chB{background:#fff6d6;border:1px dashed #b8860b;color:#141a0d}
.chAlt{align-self:center;font-size:11px;color:#7a8270;text-align:center}
.chDoc{display:inline-block;font-size:11px;font-weight:700;background:#e9efe0;color:#3d5a1e;border-radius:3px;padding:0 5px;margin-right:4px;cursor:pointer}.chM.eu .chDoc{background:#3d5a1e;color:#fff}
.chVz{color:#5a6350;font-size:13px;text-align:center;margin:20px 10px}
.chEsc{border-top:1px solid #e3e6dc;padding:8px}.chCx .chEsc{border:0;padding:8px 0 0}.chSo{font-size:12px;color:#5a6350}
.chCan{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}.chCan button{border:1px solid #e3e6dc;background:#fff;border-radius:3px;padding:4px 8px;font:600 12px Inter,sans-serif;cursor:pointer}.chCan button.on{background:#141a0d;color:#fff;border-color:#141a0d}.chCan button:disabled{opacity:.4;cursor:default}
.chLin{display:flex;gap:6px;align-items:flex-end}.chLin textarea{flex:1;resize:none;font:14px Inter,sans-serif;padding:8px 10px;border:1.5px solid #e3e6dc;border-radius:3px;background:#f6f7f2}.chLin textarea.int{background:#fff9e3;border-color:#e6cf7a}
.chLin button{border:0;background:#7cd23a;color:#141a0d;width:44px;height:44px;border-radius:3px;font-size:18px;cursor:pointer;font-weight:800}
@media (max-width:600px){#chatP{right:6px;left:6px;width:auto;bottom:70px;height:calc(100vh - 90px)}#chatBt{right:12px;bottom:44px}}
@media print{#chatBt,#chatP,.chCx{display:none}}`;
  document.head.appendChild(css);
})();
