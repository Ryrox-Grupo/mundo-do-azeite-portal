// Portal do Fornecedor na internet (10-11-2026).
// Fora deste computador o portal não tem os dados no navegador: entra-se com o e-mail e a palavra-passe,
// a base de dados (Supabase) verifica-os e devolve só os dados desse fornecedor.
// O que o fornecedor faz no portal (pedidos, mensagens, conferências) volta para a base de dados.
(function(){
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === "file:";
  if(LOCAL) return;   // no computador da Ryrox, o portal usa os dados do programa, como sempre
  const URL_SB = "https://dxhpsgyysphzaeatafit.supabase.co/rest/v1/rpc/";
  const CHAVE_PUB = "sb_publishable_bCbZeDaIvcuvT1gQ_jDV2A_7F8DarY4";   // chave pública: só deixa chamar as duas funções do portal
  const SS_D = "mda-portal-online-dados", SS_C = "mda-portal-online-cred";
  const vazio = () => ({produtores:[], propriedades:[], campos:[], entregas:[], lagares:[], produtos:[], pedidosPag:[], pagamentos:[], mensagens:[], conciliacao:{}, precosManuais:[],
    tabelas:{modos:[], campanhas:[], classes:[], variedades:[], estados:[]}, conf:{campanha:""}, prestadores:[], clientes:[], guias:[], custos:[], vendas:[], movs:[], embalamentos:[], locais:[]});
  const ler = k => { try{ return JSON.parse(sessionStorage.getItem(k)) }catch(e){ return null } };
  const rpc = async (fn, body) => { const r = await fetch(URL_SB + fn, {method:"POST", headers:{"apikey":CHAVE_PUB, "Authorization":"Bearer "+CHAVE_PUB, "Content-Type":"application/json"}, body:JSON.stringify(body)});
    if(!r.ok) throw new Error("Sem ligação ao servidor ("+r.status+")"); return r.json() };

  // os dados vêm da sessão (depois de entrar); antes disso, nada
  mdaCarregar = function(){ return ler(SS_D) || vazio() };

  // o que o portal grava (pedidos, mensagens, conferências) fica na sessão e vai para a base de dados
  const setOrig = Storage.prototype.setItem;
  let envio = null;
  Storage.prototype.setItem = function(k, v){
    if(this === window.localStorage && k === MDA_CHAVE){
      try{ sessionStorage.setItem(SS_D, v) }catch(e){}
      const c = ler(SS_C); if(c){ clearTimeout(envio); envio = setTimeout(()=>{ let d; try{ d = JSON.parse(v) }catch(e){ return }
        rpc("mda_portal_guardar", {p_email:c.email, p_codigo:c.codigo, p_do_cliente:{pedidosPag:d.pedidosPag||[], mensagens:d.mensagens||[], conciliacao:d.conciliacao||{}, em:new Date().toISOString()}}).catch(()=>{}) }, 600) }
      return;
    }
    return setOrig.call(this, k, v);
  };

  // entrar: a base de dados confirma o e-mail e a palavra-passe e devolve os dados deste fornecedor
  window.MDA_ONLINE = {
    async entrar(email, codigo){
      const r = await rpc("mda_portal_entrar", {p_email:email, p_codigo:codigo});
      if(r && r.erro === "bloqueado") throw new Error("Muitas tentativas erradas. Espere 15 minutos ou peça ajuda à Ryrox.");
      if(!r || !r.dados) return null;
      try{ sessionStorage.setItem(SS_D, JSON.stringify(r.dados)); sessionStorage.setItem(SS_C, JSON.stringify({email, codigo})) }catch(e){}
      const p = (r.dados.produtores||[]).find(x=>x.id===r.prod), a = p && mdaAcessos(p).find(x=>x.id===r.pessoa || (x.email||"").toLowerCase()===String(email).trim().toLowerCase());
      return p && a ? {p, a} : null;
    },
    sair(){ try{ sessionStorage.removeItem(SS_D); sessionStorage.removeItem(SS_C) }catch(e){} }
  };
})();
