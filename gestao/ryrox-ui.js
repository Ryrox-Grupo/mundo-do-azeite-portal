/* RYROX UI · peças comuns de todos os programas Ryrox (27-11-2026). Fonte única: Projetos/_alicerce/ryrox-ui/.
   O motor de cada programa serve /ryrox-ui.js daqui; nenhum programa tem cópia.
   - RyroxUI.IC / RyroxUI.ic(k)      ícones do menu (traço, 24×24), os mesmos em todos os programas
   - RyroxUI.menu(nav, {chave, alfabetica})  liga um menu escrito no HTML: ícones (data-ic), recolher aos ícones, grupos que fecham, "Mais" no telemóvel, ordem alfabética nos grupos
   - RyroxUI.atalhos(el, nav, sels)  atalhos no topo, copiados do menu (mesma ação, mesmo estado)
   - RyroxUI.pesquisa(input, fn)     pesquisa geral do topo com lista de resultados
   - RyroxUI.pdf(el, url)            visor de PDF com zoom e arrastar com o rato (botão direito ou esquerdo) */
(function () {
  const IC = {
    painel: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
    entidades: 'M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2',
    cli: 'M3 11l4-4 4 2 3-2 7 5-3 3M7 7l-4 4 6 6 2-1 2 1 3-2',
    forn: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
    sub: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a2.5 2.5 0 1 0 0-5M17 14c2.5.3 4 2.6 4 6',
    grupos: 'M3 7h7v5H3zM14 7h7v5h-7zM8.5 16h7v5h-7zM6.5 12v2h11v-2M12 14v2',
    operadores: 'M4 16h16M5 16a7 7 0 0 1 14 0M12 9V5M3 16h18v2H3z',
    pessoas: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM4 7h2M4 12h2M4 17h2M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4M9 17c.5-1.7 1.6-2.5 3-2.5s2.5.8 3 2.5',
    out: 'M5 12h.01M12 12h.01M19 12h.01',
    herdades: 'M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
    ordens: 'M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M8 11h8M8 15h8M8 19h5',
    maquinas: 'M7 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4M4 13V8h7l2 5h5l1 2M9 8V5h4v3',
    servicos: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
    historico: 'M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 8v4l3 2',
    alertas: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
    manutencao: 'M14 7a4 4 0 1 1-3.5 5.9L4 19.5V16h3v-3h2.5A4 4 0 0 1 14 7z',
    relatorios: 'M4 4v16h16M8 16v-4M12 16V8M16 16v-6',
    campo: 'M9.5 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8M14.5 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8',
    contas: 'M12 3v18M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8', receber: 'M12 3v18M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8',
    liquidacoes: 'M4 6h16M4 12h16M4 18h10M18 16l2 2 3-4',
    juridico: 'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8',
    faturacao: 'M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21zM10 8h4M10 12h4',
    despesas: 'M3 7h18v12H3zM3 11h18M7 15h3', bancos: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
    recibos: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
    validacao: 'M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M8.5 14l2.5 2.5 4.5-5',
    rececao: 'M3 13l3-8h12l3 8M3 13v6h18v-6M3 13h5l1 3h6l1-3h5',
    pesagem: 'M12 4v3M5 21h14l-2-12H7zM9 9a3 3 0 0 1 6 0',
    stock: 'M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z',
    vendas: 'M3 4h2l2.5 11h11L21 7H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
    campanha: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    pedidos: 'M4 4h16v12H8l-4 4zM8 9h8M8 12h5',
    anterior: 'M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4zM20 5h-6M20 5v13h-6',
    tabelas: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14',
    contratos: 'M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h4',
    portal: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21c.8-4 4-6 8-6s7.2 2 8 6',
    loja: 'M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6',
    config: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    lagar: 'M3 21V10l5 3V10l5 3V6l8 4v11zM7 17h2M12 17h2M17 17h2',
    calendario: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
    estrela: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
    folha: 'M5 19c0-8 5-14 15-15-1 10-7 15-15 15zM5 19l7-7',
    certo: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M8 12l3 3 5-6',
    percent: 'M19 5L5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
    garrafa: 'M10 3h4v4l2 3v11H8V10l2-3zM8 14h8',
    armazem: 'M3 10l9-6 9 6v11H3zM7 21v-7h10v7M7 17h10',
    externo: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
    menu: 'M4 6h16M4 12h16M4 18h16', seta: 'M6 9l6 6 6-6', mais: 'M5 12h.01M12 12h.01M19 12h.01',
    zoomMais: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M21 21l-5-5M8 11h6M11 8v6', zoomMenos: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M21 21l-5-5M8 11h6',
    largura: 'M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4', mao: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5v-6a1.5 1.5 0 0 1 3 0V11M14 6.5a1.5 1.5 0 0 1 3 0V11M17 8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.9-2.6L4.3 15a1.6 1.6 0 0 1 2.6-1.8L8 14.5'
  };
  const ic = (k, t) => `<svg class="icm" viewBox="0 0 24 24" width="${t || 19}" height="${t || 19}" aria-hidden="true"><path d="${IC[k] || IC.out}" fill="none" stroke="currentColor" stroke-width="${k === 'out' || k === 'mais' ? 3 : 1.8}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const lerLS = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const gravarLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const telemovel = () => matchMedia('(max-width:700px)').matches;

  /* Menu escrito no HTML: <nav> com <h6>Grupo</h6> e <button data-ic="..."> (ou <a>). Marcar com class="mv" as páginas
     que ficam no menu de baixo do telemóvel (até 4). Pode chamar-se outra vez sem estragar nada. */
  function menu(nav, o) {
    o = o || {}; const ch = o.chave || 'rx';
    if (o.alfabetica && !nav.dataset.rxAlfa) { nav.dataset.rxAlfa = '1';   // dentro de cada grupo, por ordem alfabética (data-fixo fica em cima)
      const nome = b => b.textContent.replace(/[\d↗]+/g, ' ').replace(/\s+/g, ' ').trim();
      let grupo = [];
      const arruma = () => { if (grupo.length < 2) { grupo = []; return; } const ant = grupo[0].previousSibling, fix = grupo.filter(b => b.hasAttribute('data-fixo')), resto = grupo.filter(b => !b.hasAttribute('data-fixo')).sort((a, b) => nome(a).localeCompare(nome(b), 'pt'));
        let ref = ant; [...fix, ...resto].forEach(b => { ref ? ref.after(b) : nav.prepend(b); ref = b; }); grupo = []; };
      [...nav.children].forEach(x => { if (x.tagName === 'H6') { arruma(); return; } if (x.matches('button, a')) grupo.push(x); else arruma(); }); arruma();
    }
    nav.querySelectorAll('button, a').forEach(b => {
      if (b.dataset.rxOk || b.classList.contains('mtog') || b.classList.contains('rx-mais')) return; b.dataset.rxOk = '1';
      if (!b.title) b.title = b.textContent.replace(/\s+/g, ' ').trim();
      const lb = document.createElement('span'); lb.className = 'lb';
      [...b.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).forEach((n, i) => { if (!i) b.insertBefore(lb, n); lb.appendChild(n); });
      if (b.dataset.ic) b.insertAdjacentHTML('afterbegin', ic(b.dataset.ic));
    });
    if (!nav.querySelector('.mtog')) {
      const t = document.createElement('button'); t.type = 'button'; t.className = 'mtog'; nav.prepend(t);
      t.onclick = () => { const c = !document.body.classList.contains('menuCurto'); gravarLS(ch + '-menu-curto', c); aplica(); };
    }
    if (!nav.querySelector('.rx-mais')) {
      const m = document.createElement('button'); m.type = 'button'; m.className = 'rx-mais'; m.innerHTML = ic('menu') + '<span class="lb">Mais</span>'; nav.appendChild(m);
      m.onclick = ev => { ev.stopPropagation(); document.body.classList.toggle('rxMais'); m.querySelector('.lb').textContent = document.body.classList.contains('rxMais') ? 'Fechar' : 'Mais'; };
      nav.addEventListener('click', ev => { if (ev.target.closest('button:not(.rx-mais), a') && document.body.classList.contains('rxMais')) { document.body.classList.remove('rxMais'); m.querySelector('.lb').textContent = 'Mais'; } });
    }
    nav.querySelectorAll('h6').forEach(h => {
      if (h.dataset.rxOk) return; h.dataset.rxOk = '1'; h.dataset.g = h.dataset.g || h.textContent.trim(); h.insertAdjacentHTML('beforeend', ic('seta'));
      h.onclick = () => { const s = new Set(lerLS(ch + '-grupos-fechados', [])), g = h.dataset.g; s.has(g) ? s.delete(g) : s.add(g); gravarLS(ch + '-grupos-fechados', [...s]); aplica(); };
    });
    function aplica() {
      const curto = !!lerLS(ch + '-menu-curto', false), fech = lerLS(ch + '-grupos-fechados', []);
      document.body.classList.toggle('menuCurto', curto);
      const t = nav.querySelector('.mtog'); t.title = curto ? 'Abrir o menu' : 'Recolher o menu'; t.innerHTML = ic('menu') + '<span class="lb">Recolher menu</span>';
      let g = null;
      [...nav.children].forEach(x => { if (x.tagName === 'H6') { g = x.dataset.g; x.classList.toggle('fech', fech.includes(g)); x.title = (fech.includes(g) ? 'Mostrar ' : 'Esconder ') + g; return; }
        if (x.matches('button, a') && !x.classList.contains('mtog') && !x.classList.contains('rx-mais')) x.classList.toggle('esc', !!g && fech.includes(g) && !x.classList.contains('on')); });
    }
    aplica(); new MutationObserver(aplica).observe(nav, {subtree: true, attributes: true, attributeFilter: ['class']});
    return {aplica};
  }

  /* Atalhos no topo: cópias de botões do menu (lista de seletores). Carregar no atalho = carregar no botão do menu. */
  function atalhos(el, nav, sels) {
    const pinta = () => { el.innerHTML = ''; sels.forEach(s => { const b = nav.querySelector(s); if (!b) return;
      const a = document.createElement('button'); a.type = 'button'; a.title = b.title || b.textContent.trim(); a.className = b.classList.contains('on') ? 'on' : '';
      a.innerHTML = ic(b.dataset.ic) + `<span>${(b.querySelector('.lb') || b).textContent.trim()}</span>`;
      const n = b.querySelector('.bol'); if (n && n.textContent.trim()) a.insertAdjacentHTML('beforeend', `<b class="bol">${n.textContent.trim()}</b>`);
      a.onclick = () => b.click(); el.appendChild(a); }); };
    pinta(); let t = null; new MutationObserver(() => { clearTimeout(t); t = setTimeout(pinta, 30); }).observe(nav, {subtree: true, attributes: true, attributeFilter: ['class'], childList: true, characterData: true});
  }

  /* Pesquisa geral: fn(q) devolve [{grupo, t, s, ir}] (t = texto, s = detalhe à direita, ir = função a chamar). */
  function pesquisa(input, fn) {
    let lista = null, sel = 0, res = [];
    const fecha = () => { if (lista) lista.remove(); lista = null; };
    const abre = () => { const q = input.value.trim(); if (q.length < 2) return fecha();
      res = (fn(q) || []).slice(0, 30); sel = 0;
      if (!lista) { lista = document.createElement('div'); lista.className = 'rx-res'; document.body.appendChild(lista);
        lista.onmousedown = ev => { const b = ev.target.closest('button[data-i]'); if (!b) return; ev.preventDefault(); escolhe(+b.dataset.i); }; }
      const r = input.getBoundingClientRect(); lista.style.top = (r.bottom + 6) + 'px'; lista.style.left = Math.max(8, Math.min(r.left, innerWidth - 480)) + 'px'; lista.style.width = Math.min(480, innerWidth - 16) + 'px';
      let g = null; const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
      lista.innerHTML = res.length ? res.map((x, i) => (x.grupo !== g ? `<h6>${e(g = x.grupo)}</h6>` : '') + `<button type="button" data-i="${i}" class="${i === sel ? 'on' : ''}">${e(x.t)}${x.s ? `<small>${e(x.s)}</small>` : ''}</button>`).join('') : '<div class="vaz">Nada encontrado.</div>'; };
    const escolhe = i => { const x = res[i]; if (!x) return; fecha(); input.value = ''; input.blur(); x.ir(); };
    input.addEventListener('input', abre); input.addEventListener('focus', abre); input.addEventListener('blur', () => setTimeout(fecha, 150));
    input.addEventListener('keydown', ev => { if (!lista) return;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); sel = Math.max(0, Math.min(res.length - 1, sel + (ev.key === 'ArrowDown' ? 1 : -1)));
        lista.querySelectorAll('button[data-i]').forEach(b => b.classList.toggle('on', +b.dataset.i === sel)); const on = lista.querySelector('button.on'); if (on) on.scrollIntoView({block: 'nearest'}); }
      else if (ev.key === 'Enter') { ev.preventDefault(); escolhe(sel); } else if (ev.key === 'Escape') fecha(); });
  }

  /* Visor de PDF (pedido do Ricardo, 27-11-2026): aumentar e arrastar a fatura com o rato para ver os campos todos.
     Arrasta-se com o botão direito (ou o esquerdo); roda do rato desliza, Ctrl + roda aumenta/diminui. Usa o pdf.js. */
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  let pdfjsP = null;
  const carregaPdfjs = () => pdfjsP || (pdfjsP = new Promise((ok, falha) => { if (window.pdfjsLib) return ok(window.pdfjsLib);
    const s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js';
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(window.pdfjsLib); }; s.onerror = () => { pdfjsP = null; falha(new Error('sem pdf.js')); }; document.head.appendChild(s); }));
  if (!document.getElementById('rx-pdf-css')) { const st = document.createElement('style'); st.id = 'rx-pdf-css'; st.textContent = `
.rx-pdf{display:flex;flex-direction:column;background:#525659;border-radius:inherit;min-height:300px;height:var(--rx-pdf-h,80vh);font-family:var(--f-ui,sans-serif)}
.rx-pdf .rxp-bar{display:flex;align-items:center;gap:6px;padding:7px 10px;background:#323639;color:#fff;flex-wrap:wrap}
.rx-pdf .rxp-bar button{display:inline-flex;align-items:center;gap:6px;background:#ffffff14;color:#fff;border:0;border-radius:8px;padding:6px 10px;cursor:pointer;font:600 13px var(--f-ui,sans-serif)}
.rx-pdf .rxp-bar button:hover{background:#ffffff2a}.rx-pdf .rxp-bar b{min-width:52px;text-align:center;font-size:13px;font-variant-numeric:tabular-nums}
.rx-pdf .rxp-bar small{margin-left:auto;opacity:.7;font-size:12px;display:inline-flex;gap:6px;align-items:center}
.rx-pdf .rxp-vista{flex:1;min-height:0;overflow:auto;cursor:grab;user-select:none;padding:14px}.rx-pdf .rxp-vista.arrasta{cursor:grabbing}
.rx-pdf .rxp-pags{display:flex;flex-direction:column;align-items:center;gap:12px;width:max-content;min-width:100%}
.rx-pdf canvas{display:block;background:#fff;box-shadow:0 2px 10px #0006}
.rx-pdf .rxp-msg{color:#fff;padding:20px;font-size:14px}`; document.head.appendChild(st); }
  function pdf(el, url, o) {
    o = o || {}; el.classList.add('rx-pdf'); if (o.altura) el.style.setProperty('--rx-pdf-h', o.altura);
    el.innerHTML = `<div class="rxp-bar"><button type="button" data-z="-" title="Diminuir">${ic('zoomMenos', 16)}</button><b>—</b><button type="button" data-z="+" title="Aumentar">${ic('zoomMais', 16)}</button><button type="button" data-z="l" title="Ajustar à largura">${ic('largura', 16)}Largura</button><small>${ic('mao', 15)}arraste com o rato · Ctrl + roda para aumentar</small></div><div class="rxp-vista"><div class="rxp-pags"><div class="rxp-msg">A abrir o documento…</div></div></div>`;
    const vista = el.querySelector('.rxp-vista'), pags = el.querySelector('.rxp-pags'), lbl = el.querySelector('.rxp-bar b');
    let doc = null, esc = 0, larg = true, gera = 0;
    const desenha = async (cx, cy) => { if (!doc) return; const g = ++gera, p1 = await doc.getPage(1), v1 = p1.getViewport({scale: 1});
      const fx = cx != null ? (vista.scrollLeft + cx) / Math.max(1, pags.scrollWidth) : 0, fy = cy != null ? (vista.scrollTop + cy) / Math.max(1, pags.scrollHeight) : 0;
      if (larg) esc = Math.max(.2, (vista.clientWidth - 28) / v1.width);
      lbl.textContent = Math.round(esc * 100) + '%'; const dpr = window.devicePixelRatio || 1, novas = [];
      for (let i = 1; i <= doc.numPages; i++) { const p = i === 1 ? p1 : await doc.getPage(i); if (g !== gera) return; const v = p.getViewport({scale: esc}), c = document.createElement('canvas');
        c.width = Math.floor(v.width * dpr); c.height = Math.floor(v.height * dpr); c.style.width = Math.floor(v.width) + 'px'; c.style.height = Math.floor(v.height) + 'px';
        await p.render({canvasContext: c.getContext('2d'), viewport: v, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null}).promise; if (g !== gera) return; novas.push(c); }
      pags.replaceChildren(...novas);
      if (cx != null) { vista.scrollLeft = fx * pags.scrollWidth - cx; vista.scrollTop = fy * pags.scrollHeight - cy; } };
    const zoom = (f, cx, cy) => { larg = false; esc = Math.min(6, Math.max(.25, esc * f)); desenha(cx == null ? vista.clientWidth / 2 : cx, cy == null ? vista.clientHeight / 2 : cy); };
    el.querySelector('.rxp-bar').onclick = ev => { const b = ev.target.closest('[data-z]'); if (!b) return; const z = b.dataset.z;
      if (z === 'l') { larg = true; desenha(); } else zoom(z === '+' ? 1.25 : 0.8); };
    vista.addEventListener('wheel', ev => { if (!ev.ctrlKey) return; ev.preventDefault(); const r = vista.getBoundingClientRect(); zoom(ev.deltaY < 0 ? 1.15 : 1 / 1.15, ev.clientX - r.left, ev.clientY - r.top); }, {passive: false});
    let arr = null;
    vista.addEventListener('contextmenu', ev => ev.preventDefault());
    vista.addEventListener('pointerdown', ev => { if (ev.button !== 0 && ev.button !== 2) return; arr = {x: ev.clientX, y: ev.clientY, l: vista.scrollLeft, t: vista.scrollTop}; vista.classList.add('arrasta'); vista.setPointerCapture(ev.pointerId); });
    vista.addEventListener('pointermove', ev => { if (!arr) return; vista.scrollLeft = arr.l - (ev.clientX - arr.x); vista.scrollTop = arr.t - (ev.clientY - arr.y); });
    const larga = () => { arr = null; vista.classList.remove('arrasta'); }; vista.addEventListener('pointerup', larga); vista.addEventListener('pointercancel', larga);
    let rt = null; new ResizeObserver(() => { if (larg && doc) { clearTimeout(rt); rt = setTimeout(() => desenha(), 150); } }).observe(vista);
    carregaPdfjs().then(lib => lib.getDocument({url, withCredentials: false}).promise).then(d => { doc = d; return desenha(); })
      .catch(e => { pags.innerHTML = `<div class="rxp-msg">Não consegui mostrar o PDF aqui (${String(e.message || e).slice(0, 120)}). Use "Abrir noutra janela".</div>`; });
    return {zoom, largura: () => { larg = true; desenha(); }};
  }

  window.RyroxUI = {IC, ic, menu, atalhos, pesquisa, pdf, telemovel};
})();
