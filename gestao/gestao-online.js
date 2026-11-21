// Mundo do Azeite na internet, para a equipa (20-11-2026): o programa completo, só para consulta.
// Fora deste computador não há dados no navegador: entra-se com utilizador e palavra-passe,
// a base de dados (Supabase) verifica-os e devolve a cópia que o programa do escritório publica sozinho
// (ao abrir, um minuto depois de cada alteração e de hora a hora). O que se mexer aqui não volta ao escritório.
(function(){
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
  if(LOCAL) return;   // no computador da Ryrox o programa usa os seus próprios dados
  window.MDA_SO_CONSULTA = true;   // as caixas de conversa mostram as mensagens mas não deixam escrever
  const URL_SB = "https://dxhpsgyysphzaeatafit.supabase.co/rest/v1/rpc/";
  const CHAVE_PUB = "sb_publishable_bCbZeDaIvcuvT1gQ_jDV2A_7F8DarY4";   // chave pública: só deixa chamar as funções do portal e da gestão
  const K_D = "mda-gestao-dados", K_C = "mda-gestao-cred";
  const ler = (s, k) => { try{ return JSON.parse(s.getItem(k)) }catch(e){ return null } };
  // o servidor às vezes demora a acordar: tenta até 3 vezes antes de dar erro
  const rpc = async (fn, body) => { for(let i = 0; ; i++){ try{ return await rpc1(fn, body) }catch(e){ if(i >= 2) throw new Error("Sem ligação ao servidor. Tente outra vez daqui a pouco."); await new Promise(r=>setTimeout(r, 1500)) } } };
  const rpc1 = async (fn, body) => { const r = await fetch(URL_SB + fn, {method:"POST", headers:{"apikey":CHAVE_PUB, "Authorization":"Bearer "+CHAVE_PUB, "Content-Type":"application/json"}, body:JSON.stringify(body)});
    if(!r.ok) throw new Error("Sem ligação ao servidor ("+r.status+")"); return r.json() };
  const vazio = () => { const e = mdaExemplo(); Object.keys(e).forEach(k=>{ if(Array.isArray(e[k])) e[k] = [] }); return e };

  const cache = ler(sessionStorage, K_D);
  const cred = ler(localStorage, K_C);
  mdaCarregar = function(){ const c = ler(sessionStorage, K_D); return c ? c.dados : vazio() };
  // só consulta: nada do que se faz aqui é gravado
  const setOrig = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){ if(this === window.localStorage && (k === MDA_CHAVE || k === MDA_CHAVE+"-copia")) return; return setOrig.call(this, k, v) };

  const est = document.createElement("style");
  est.textContent = `.maq{display:none!important}
  #gOv{position:fixed;inset:0;z-index:99999;background:#0f1410;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:16px}
  #gOv form{background:#fff;padding:26px 22px;max-width:340px;width:100%;display:flex;flex-direction:column;gap:12px}
  #gOv img{max-width:190px;margin:0 auto 6px} #gOv h2{margin:0;font-size:18px;text-align:center}
  #gOv input{font-size:16px;padding:11px;border:1px solid #bbb} #gOv button{font-size:16px;padding:12px;background:#111;color:#d4ff3a;border:0;font-weight:700}
  #gOv .m{font-size:13px;color:#b00;min-height:16px;text-align:center} #gOv .s{font-size:12px;color:#666;text-align:center}
  #gBar{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#111;color:#eee;font:12px Inter,system-ui,sans-serif;padding:6px 12px;display:flex;gap:10px;align-items:center;justify-content:space-between}
  #gBar button{background:none;border:1px solid #666;color:#eee;padding:3px 8px;font-size:12px} body{padding-bottom:34px}`;
  document.head.appendChild(est);

  const quando = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit"})+" às "+d.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}) };
  async function buscar(c){
    const r = await rpc("mda_gestao_entrar", {p_utilizador:c.u, p_codigo:c.p});
    if(r && r.erro === "bloqueado") throw new Error("Muitas tentativas erradas. Espere 15 minutos.");
    if(!r || !r.dados) return false;
    setOrig.call(sessionStorage, K_D, JSON.stringify({dados:r.dados, atualizado:r.atualizado, nome:r.nome}));
    return true;
  }
  function ecraEntrar(msg){
    const ov = document.createElement("div"); ov.id = "gOv";
    ov.innerHTML = `<form><img src="logo-mundo-do-azeite.png" alt=""><h2>Mundo do Azeite</h2>
      <input id="gU" autocomplete="username" placeholder="Utilizador" autocapitalize="none">
      <input id="gP" type="password" autocomplete="current-password" placeholder="Palavra-passe">
      <button>Entrar</button><div class="m">${msg||""}</div><div class="s">Ryrox · acesso reservado</div></form>`;
    document.body.appendChild(ov);
    ov.querySelector("form").onsubmit = async ev => { ev.preventDefault(); const m = ov.querySelector(".m"); m.textContent = "A entrar…";
      const c = {u:ov.querySelector("#gU").value.trim(), p:ov.querySelector("#gP").value};
      try{ if(await buscar(c)){ setOrig.call(localStorage, K_C, JSON.stringify(c)); location.reload() } else m.textContent = "Utilizador ou palavra-passe errados." }
      catch(e){ m.textContent = e.message } };
  }
  function ecraEspera(){ const ov = document.createElement("div"); ov.id = "gOv"; ov.innerHTML = '<form><img src="logo-mundo-do-azeite.png" alt=""><h2>A carregar os dados…</h2></form>'; document.body.appendChild(ov) }
  function sair(){ try{ localStorage.removeItem(K_C); sessionStorage.removeItem(K_D) }catch(e){} location.reload() }

  document.addEventListener("DOMContentLoaded", async () => {
    if(!cred){ ecraEntrar(); return }
    if(!cache){ ecraEspera();
      try{ if(await buscar(cred)) location.reload(); else { localStorage.removeItem(K_C); document.getElementById("gOv").remove(); ecraEntrar("O acesso mudou. Entre outra vez.") } }
      catch(e){ document.getElementById("gOv").remove(); ecraEntrar(e.message) }
      return }
    const bar = document.createElement("div"); bar.id = "gBar";
    bar.innerHTML = `<span>👁 Só consulta · dados de ${quando(cache.atualizado)}</span><span><button id="gAt">↻ Atualizar</button> <button id="gSa">Sair</button></span>`;
    document.body.appendChild(bar);
    const atualizar = async () => { try{ if(await buscar(cred)) location.reload() }catch(e){ alert(e.message) } };
    bar.querySelector("#gAt").onclick = atualizar; bar.querySelector("#gSa").onclick = sair;
    // dados novos no escritório? vê ao abrir, ao voltar à página e de 2 em 2 minutos
    const ver = async () => { try{ const q = await rpc("mda_gestao_quando", {p_utilizador:cred.u, p_codigo:cred.p});
      if(q === null){ sair(); return }
      if(q && new Date(q) > new Date(cache.atualizado)){ const s = bar.querySelector("span"); s.innerHTML = "🔔 Há dados novos — a atualizar…"; atualizar() } }catch(e){} };
    ver(); setInterval(ver, 120000); document.addEventListener("visibilitychange", ()=>{ if(!document.hidden) ver() });
  });
})();
