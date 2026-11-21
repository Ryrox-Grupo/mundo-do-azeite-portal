// ---- Mensagens com os fornecedores (07-11-2026, pedido do Ricardo) ----
// Toda a comunicação com o fornecedor fica numa conversa só, vista dos dois lados: no portal (B2B) e no programa.
// Canais: "chat" (portal), "whatsapp" e "email" (abre o WhatsApp ou o e-mail com o texto e fica registado aqui) e "interna"
// (notas da equipa da Ryrox: o fornecedor nunca as vê). Usado por portal.html (modo "cliente" ou "ryrox" a ver como ele)
// e por index.html (modo "programa": lista de conversas de todos os fornecedores).
// Na maquete as mensagens ficam nos dados do navegador (D.mensagens); na versão a sério ficam na base de dados.
(function(){
  const CAN = {chat:["💬","Chat"], whatsapp:["🟢","WhatsApp"], email:["✉️","E-mail"], interna:["🔒","Nota interna"]};
  const e = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
  const quando = iso => { const d = new Date(iso), h = new Date(); return d.toDateString()===h.toDateString() ? d.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}) : d.toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}) };
  let O = null, aberto = false, conv = null, canal = "chat";
  const dados = () => (O.dados ? O.dados() : D);
  const msgs = pid => (dados().mensagens||[]).filter(m=>m.prod===pid && (O.modo!=="cliente" || m.canal!=="interna")).sort((a,b)=>a.data.localeCompare(b.data));
  // por ler: do lado do cliente, o que a Ryrox escreveu; do lado da Ryrox, o que o cliente escreveu
  const porLer = pid => msgs(pid).filter(m=>m.de===(O.modo==="cliente"?"ryrox":"cliente") && !m[O.modo==="cliente"?"lidaC":"lidaR"]).length;
  const prods = () => (dados().produtores||[]);
  function grava(fn){ const d = mdaCarregar(); d.mensagens = d.mensagens||[]; fn(d); if(O.grava) O.grava(d); else localStorage.setItem(MDA_CHAVE, JSON.stringify(d)); if(O.depois) O.depois(d) }
  // registo de uma mensagem (também usado pelos botões de partilha, que já não ficam fora da conversa)
  window.chatRegista = (pid, texto, can, de) => { de = de || (O&&O.modo==="cliente"?"cliente":"ryrox");
    grava(d=>d.mensagens.push({id:"M"+Date.now().toString(36)+Math.random().toString(36).slice(2,5), prod:pid, de, canal:can||"chat", texto, data:new Date().toISOString(), lidaR:de==="ryrox", lidaC:de==="cliente"})) };
  function marcaLidas(pid){ const k = O.modo==="cliente"?"lidaC":"lidaR", d = mdaCarregar(); let mud = false;
    (d.mensagens||[]).forEach(m=>{ if(m.prod===pid && !m[k] && m.de!==(O.modo==="cliente"?"cliente":"ryrox")){ m[k] = true; mud = true } }); if(mud){ if(O.grava) O.grava(d); else localStorage.setItem(MDA_CHAVE, JSON.stringify(d)); if(O.depois) O.depois(d) } }
  function botao(){ let b = document.getElementById("chatBt"); if(!b){ b = document.createElement("button"); b.id = "chatBt"; document.body.appendChild(b); b.onclick = () => { aberto = !aberto; desenha() } }
    const n = O.modo==="programa" ? prods().reduce((t,p)=>t+porLer(p.id),0) : porLer(O.prod());
    b.innerHTML = `💬 <span>Mensagens</span>${n?`<i>${n}</i>`:""}`; b.classList.toggle("on", aberto) }
  function desenha(){
    if(!O) return; botao(); let el = document.getElementById("chatP");
    if(!aberto){ if(el) el.remove(); return }
    if(!el){ el = document.createElement("aside"); el.id = "chatP"; document.body.appendChild(el) }
    if(O.modo!=="programa") conv = O.prod();
    const ryrox = O.modo!=="cliente", p = conv ? (prods().find(x=>x.id===conv)||{}) : null;
    if(O.modo==="programa" && !conv){
      const L = prods().map(x=>({x, m:msgs(x.id), n:porLer(x.id)})).sort((a,b)=>(b.m.length?b.m[b.m.length-1].data:"").localeCompare(a.m.length?a.m[a.m.length-1].data:"")||a.x.nome.localeCompare(b.x.nome));
      el.innerHTML = `<header><b>Mensagens com os fornecedores</b><button data-fecha title="Fechar">×</button></header><input class="chBusca" placeholder="Procurar fornecedor">
        <div class="chLista">${L.map(({x,m,n})=>`<button data-conv="${e(x.id)}"><b>${e(x.nome)}</b>${n?`<i>${n}</i>`:""}<small>${m.length?`${CAN[m[m.length-1].canal][0]} ${e(m[m.length-1].texto.slice(0,60))}`:"sem mensagens"}</small></button>`).join("")||'<p class="chVz">Ainda não há fornecedores.</p>'}</div>`;
      el.querySelector(".chBusca").oninput = ev=>{ const q = ev.target.value.toLowerCase(); el.querySelectorAll("[data-conv]").forEach(b=>b.hidden = !b.textContent.toLowerCase().includes(q)) };
    } else {
      const M = msgs(conv), tel = String(p.tel||"").replace(/\D/g,""), wa = tel.length===9 ? "351"+tel : tel, em = (window.mdaAcessos&&(mdaAcessos(p)[0]||{}).email)||p.email||"";
      el.innerHTML = `<header>${O.modo==="programa"?'<button data-volta title="Voltar">‹</button>':""}<b>${O.modo==="cliente"?"Mensagens com a Ryrox Agro":e(p.nome||"")}</b><button data-fecha title="Fechar">×</button></header>
        ${ryrox?`<div class="chInfo">${wa?"📱 "+e(p.tel):"sem telemóvel"} · ${em?"✉️ "+e(em):"sem e-mail"}</div>`:""}
        <div class="chMsgs">${M.length?M.map(m=>`<div class="chM ${m.canal==="interna"?"int":m.de===(O.modo==="cliente"?"cliente":"ryrox")?"eu":"ele"}"><div class="chB">${e(m.texto).replace(/\n/g,"<br>")}</div><small>${m.canal==="interna"?"🔒 nota interna (o fornecedor não vê)":`${m.de==="ryrox"?"Ryrox":e(O.modo==="cliente"?"Eu":p.nome)} · ${CAN[m.canal][0]} ${CAN[m.canal][1]}`} · ${quando(m.data)}</small></div>`).join(""):`<p class="chVz">${O.modo==="cliente"?"Escreva-nos aqui: respondemos por esta conversa.":"Ainda não há mensagens com este fornecedor."}</p>`}</div>
        <div class="chEsc">${ryrox?`<div class="chCan">${Object.entries(CAN).map(([k,[i,t]])=>`<button data-can="${k}" class="${k===canal?"on":""}" title="${k==="chat"?"Aparece no portal do fornecedor":k==="interna"?"Só a equipa da Ryrox vê":"Abre o "+t+" com o texto e fica registado aqui"}">${i} ${t}</button>`).join("")}</div>`:""}
          <div class="chLin"><textarea id="chTxt" rows="2" placeholder="${canal==="interna"&&ryrox?"Nota para a equipa (o fornecedor não vê)…":"Escreva a mensagem…"}"></textarea><button id="chEnv" title="Enviar">➤</button></div></div>`;
      const box = el.querySelector(".chMsgs"); box.scrollTop = box.scrollHeight; marcaLidas(conv);
      el.querySelectorAll("[data-can]").forEach(b=>b.onclick=()=>{ canal = b.dataset.can; desenha() });
      const envia = () => { const t = document.getElementById("chTxt").value.trim(); if(!t) return; const c = ryrox ? canal : "chat";
        if(c==="whatsapp") window.open(`https://wa.me/${wa}?text=${encodeURIComponent(t)}`, "_blank");
        if(c==="email") location.href = `mailto:${encodeURIComponent(em)}?subject=${encodeURIComponent("Ryrox Agro")}&body=${encodeURIComponent(t)}`;
        chatRegista(conv, t, c, ryrox?"ryrox":"cliente"); desenha() };
      document.getElementById("chEnv").onclick = envia;
      document.getElementById("chTxt").onkeydown = ev=>{ if(ev.key==="Enter" && !ev.shiftKey){ ev.preventDefault(); envia() } };
    }
    el.querySelectorAll("[data-conv]").forEach(b=>b.onclick=()=>{ conv = b.dataset.conv; desenha() });
    const v = el.querySelector("[data-volta]"); if(v) v.onclick = () => { conv = null; desenha() };
    el.querySelector("[data-fecha]").onclick = () => { aberto = false; desenha() };
  }
  // abre a conversa de um fornecedor (ex.: a partir da ficha dele no programa)
  window.chatAbre = pid => { if(pid) conv = pid; aberto = true; desenha() };
  window.chatIniciar = opts => { O = opts; desenha() };
  window.chatAtualiza = () => { if(O){ const t = document.getElementById("chTxt"), v = t ? t.value : ""; desenha(); const t2 = document.getElementById("chTxt"); if(t2 && v) t2.value = v } };
  window.addEventListener("storage", ev=>{ if(ev.key===MDA_CHAVE) setTimeout(()=>window.chatAtualiza(), 0) });
  const css = document.createElement("style"); css.textContent = `
#chatBt{position:fixed;right:22px;bottom:22px;z-index:60;border:0;background:#141a0d;color:#fff;font:700 15px Inter,"Segoe UI",sans-serif;padding:13px 18px;border-radius:3px;box-shadow:0 12px 30px #0004;cursor:pointer;display:flex;gap:8px;align-items:center}
#chatBt i{font-style:normal;background:#7cd23a;color:#141a0d;border-radius:3px;padding:1px 7px;font-size:13px}#chatBt.on{background:#3d5a1e}
#chatP{position:fixed;right:22px;bottom:80px;z-index:60;width:min(400px,calc(100vw - 24px));height:min(600px,calc(100vh - 110px));background:#fff;border:1.5px solid #141a0d;border-radius:3px;box-shadow:0 24px 60px #0005;display:flex;flex-direction:column;font:14px/1.4 Inter,"Segoe UI",sans-serif;color:#141a0d}
#chatP header{display:flex;align-items:center;gap:8px;background:#141a0d;color:#fff;padding:11px 12px;position:static;border:0;box-shadow:none}#chatP header b{flex:1;font-size:15px}
#chatP header button{border:0;background:#ffffff1f;color:#fff;width:30px;height:30px;border-radius:3px;cursor:pointer;font-size:18px;line-height:1}
.chInfo{font-size:12px;color:#5a6350;padding:7px 12px;border-bottom:1px solid #e3e6dc;background:#f6f7f2}
.chBusca{margin:10px 12px 4px;width:calc(100% - 24px)!important}
.chLista{overflow:auto;flex:1;padding:4px 8px 10px}.chLista button{display:grid;grid-template-columns:1fr auto;width:100%;text-align:left;border:0;border-bottom:1px solid #eef0e8;background:#fff;padding:10px 8px;cursor:pointer;font:inherit;color:inherit}
.chLista button:hover{background:#f1f8e8}.chLista button small{grid-column:1/3;color:#5a6350;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chLista i{font-style:normal;background:#7cd23a;border-radius:3px;padding:0 7px;font-weight:800;font-size:12px}
.chMsgs{flex:1;overflow:auto;padding:14px 12px;background:#f4f5f0;display:flex;flex-direction:column;gap:10px}
.chM{max-width:84%;display:flex;flex-direction:column}.chM small{font-size:11px;color:#5a6350;margin-top:3px}
.chM .chB{padding:9px 12px;border-radius:3px;background:#fff;border:1px solid #e3e6dc;white-space:normal;word-wrap:break-word}
.chM.eu{align-self:flex-end;align-items:flex-end}.chM.eu .chB{background:#141a0d;color:#fff;border-color:#141a0d}
.chM.ele{align-self:flex-start}.chM.int{align-self:flex-end;align-items:flex-end}.chM.int .chB{background:#fff6d6;border:1px dashed #b8860b}
.chVz{color:#5a6350;font-size:13px;text-align:center;margin:20px 10px}
.chEsc{border-top:1px solid #e3e6dc;padding:8px}
.chCan{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}.chCan button{border:1px solid #e3e6dc;background:#fff;border-radius:3px;padding:4px 8px;font:600 12px Inter,sans-serif;cursor:pointer}.chCan button.on{background:#141a0d;color:#fff;border-color:#141a0d}
.chLin{display:flex;gap:6px;align-items:flex-end}.chLin textarea{flex:1;resize:none;font:14px Inter,sans-serif;padding:8px 10px;border:1.5px solid #e3e6dc;border-radius:3px;background:#f6f7f2}
.chLin button{border:0;background:#7cd23a;color:#141a0d;width:44px;height:44px;border-radius:3px;font-size:18px;cursor:pointer;font-weight:800}
@media print{#chatBt,#chatP{display:none}}`;
  document.head.appendChild(css);
})();
