// ═══════════════════════════════════════════
// PAINEL DE ADMINISTRACAO
// ═══════════════════════════════════════════

function openAdminPanel() {
  renderAdminEventos();
  populateAdminSelects();
  document.getElementById('adminModal').classList.add('open');
}
function closeAdminPanel() {
  document.getElementById('adminModal').classList.remove('open');
}
function setAdminTab(tab) {
  ['eventos','historico'].forEach(function(t) {
    document.getElementById('adminContent-'+t).style.display = t===tab ? 'block' : 'none';
    var btn = document.getElementById('adminTab-'+t);
    btn.style.background = t===tab ? '#eef6ff' : '#f9fafb';
    btn.style.color = t===tab ? 'var(--blue)' : '#6b7280';
    btn.style.fontWeight = t===tab ? 'bold' : 'normal';
    btn.style.borderColor = t===tab ? 'var(--blue)' : 'var(--border)';
  });
  if(tab==='historico') populateAdminSelects();
}
function getAllEvents() {
  var ev = new Set();
  machines.forEach(function(m) {
    (m.history||[]).forEach(function(h) { if(h.event) ev.add(h.event); });
    (m.reservations||[]).forEach(function(r) { if(r.event) ev.add(r.event); });
  });
  financeiro.forEach(function(f) { if(f.evento) ev.add(f.evento); });
  return Array.from(ev).sort(function(a,b){ return a.toLowerCase().localeCompare(b.toLowerCase()); });
}
function getMachineCountForEvent(evName) {
  return machines.filter(function(m) {
    return (m.history||[]).some(function(h){ return h.event===evName; }) ||
           (m.reservations||[]).some(function(r){ return r.event===evName; });
  }).length;
}
// Informacoes de um evento: ultima atividade, maquinas envolvidas e se ainda esta ativo
function getEventoInfo(evName) {
  var today = getToday();
  var ultima = '', count = 0, ativo = false;
  machines.forEach(function(m) {
    var envolvida = false;
    (m.history||[]).forEach(function(h) {
      if (h.event !== evName) return;
      envolvida = true;
      var dt = h.endDate || h.startDate || (h.date ? String(h.date).slice(0,10) : '');
      if (dt > ultima) ultima = dt;
    });
    (m.reservations||[]).forEach(function(r) {
      if (r.event !== evName) return;
      envolvida = true;
      if (r.endDate > ultima) ultima = r.endDate;
      if (r.endDate >= today) ativo = true; // reserva futura ou em andamento
    });
    if (envolvida) count++;
    var rs = getRealStatus(m);
    if (rs === 'Em uso' || rs === 'Em atraso') {
      for (var i = m.history.length - 1; i >= 0; i--) {
        if (m.history[i].type === 'saida') { if (m.history[i].event === evName) ativo = true; break; }
      }
    }
  });
  var finCount = financeiro.filter(function(f){ return f.evento === evName; }).length;
  var dias = ultima ? Math.floor((new Date(today+'T00:00:00') - new Date(ultima+'T00:00:00')) / 86400000) : null;
  return { nome: evName, ultima: ultima, dias: dias, count: count, ativo: ativo, finCount: finCount };
}

var adminSelecionados = {};

function renderAdminEventos() {
  var query = (document.getElementById('adminEventSearch').value||'').toLowerCase().trim();
  var hideZero = document.getElementById('adminHideZero') && document.getElementById('adminHideZero').checked;
  var idadeMin = parseInt((document.getElementById('adminIdadeFiltro')||{}).value || '0', 10);
  var infos = getAllEvents().map(getEventoInfo).filter(function(inf) {
    if (query && inf.nome.toLowerCase().indexOf(query) === -1) return false;
    if (hideZero && inf.count === 0) return false;
    if (idadeMin > 0 && (inf.ativo || inf.dias === null || inf.dias < idadeMin)) return false;
    return true;
  });
  // Mais antigos primeiro quando filtrando por idade; senao, mais recentes primeiro
  infos.sort(function(a,b) {
    var cmp = (a.ultima||'').localeCompare(b.ultima||'');
    return idadeMin > 0 ? cmp : -cmp;
  });
  // Descarta selecoes que sairam da lista
  var visiveis = {};
  infos.forEach(function(inf){ visiveis[inf.nome] = true; });
  Object.keys(adminSelecionados).forEach(function(k){ if (!visiveis[k]) delete adminSelecionados[k]; });

  var list = document.getElementById('adminEventosList');
  list.innerHTML = '';
  if (!infos.length) { list.innerHTML = '<p style="color:#9ca3af;font-size:13px;padding:8px">Nenhum evento encontrado.</p>'; atualizarAdminLoteBar(infos); return; }
  infos.forEach(function(inf) {
    var ev = inf.nome;
    var selecionavel = !inf.ativo && inf.count > 0;
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid var(--border)' + (inf.count===0?';opacity:0.5':'');

    var chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.style.cssText = 'width:auto;margin:0;flex-shrink:0';
    chk.disabled = !selecionavel;
    chk.checked = selecionavel && !!adminSelecionados[ev];
    chk.title = inf.ativo ? 'Evento ativo (maquina em uso ou reserva futura)' : (inf.count===0 ? 'Sem maquinas' : '');
    chk.onchange = (function(e){ return function(){ if (this.checked) adminSelecionados[e] = true; else delete adminSelecionados[e]; atualizarAdminLoteBar(); }; })(ev);

    var info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0';
    var countLabel = inf.count===0 ? '<span style="font-size:11px;color:#dc2626;margin-left:6px">sem maquinas</span>' : '<span style="font-size:11px;color:#6b7280;margin-left:6px">'+inf.count+' maquina'+(inf.count!==1?'s':'')+'</span>';
    var ativoLabel = inf.ativo ? '<span style="font-size:10px;background:#dcfce7;color:#166534;border-radius:999px;padding:1px 7px;margin-left:6px;font-weight:bold">ativo</span>' : '';
    var quando = inf.ultima ? ('Ultima atividade: ' + formatDate(inf.ultima) + (inf.dias > 0 ? ' (ha ' + inf.dias + ' dia' + (inf.dias!==1?'s':'') + ')' : (inf.dias < 0 ? ' (futuro)' : ' (hoje)'))) : 'Sem datas de maquinas';
    var finLabel = inf.finCount ? ' · ' + inf.finCount + ' lancamento' + (inf.finCount!==1?'s':'') + ' no financeiro' : '';
    info.innerHTML = '<b style="font-size:13px">' + ev + '</b>' + countLabel + ativoLabel +
      '<div style="font-size:11px;color:#9ca3af;margin-top:2px">' + quando + finLabel + '</div>';

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-shrink:0';
    var btnRen = document.createElement('button');
    btnRen.textContent = 'Renomear';
    btnRen.style.cssText = 'font-size:11px;padding:5px 9px;width:auto;background:#dbeafe;color:#1e40af;border:none;border-radius:6px;cursor:pointer;font-family:Arial,sans-serif';
    btnRen.onclick = (function(e){ return function(){ openRenomearModal(e); }; })(ev);
    btnRow.appendChild(btnRen);
    if (selecionavel) {
      var btnDel = document.createElement('button');
      btnDel.textContent = 'Apagar';
      btnDel.style.cssText = 'font-size:11px;padding:5px 9px;width:auto;background:#fee2e2;color:#991b1b;border:none;border-radius:6px;cursor:pointer;font-family:Arial,sans-serif';
      btnDel.onclick = (function(e){ return function(){ apagarEventoDoHistorico(e); }; })(ev);
      btnRow.appendChild(btnDel);
    }
    div.appendChild(chk); div.appendChild(info); div.appendChild(btnRow);
    list.appendChild(div);
  });
  atualizarAdminLoteBar(infos);
}

function atualizarAdminLoteBar(infos) {
  var n = Object.keys(adminSelecionados).length;
  var btn = document.getElementById('adminApagarLoteBtn');
  if (btn) {
    btn.textContent = '🗑️ Apagar selecionados (' + n + ')';
    btn.disabled = n === 0;
    btn.style.opacity = n === 0 ? '.5' : '1';
  }
  var todos = document.getElementById('adminSelTodos');
  if (todos && infos) {
    var selecionaveis = infos.filter(function(i){ return !i.ativo && i.count > 0; }).length;
    todos.checked = selecionaveis > 0 && n === selecionaveis;
  }
}

function toggleAdminSelTodos(marcar) {
  adminSelecionados = {};
  // Recalcula a partir da lista renderizada (respeita busca e filtros)
  var query = (document.getElementById('adminEventSearch').value||'').toLowerCase().trim();
  var hideZero = document.getElementById('adminHideZero') && document.getElementById('adminHideZero').checked;
  var idadeMin = parseInt((document.getElementById('adminIdadeFiltro')||{}).value || '0', 10);
  if (marcar) {
    getAllEvents().map(getEventoInfo).forEach(function(inf) {
      if (query && inf.nome.toLowerCase().indexOf(query) === -1) return;
      if (hideZero && inf.count === 0) return;
      if (idadeMin > 0 && (inf.ativo || inf.dias === null || inf.dias < idadeMin)) return;
      if (!inf.ativo && inf.count > 0) adminSelecionados[inf.nome] = true;
    });
  }
  renderAdminEventos();
}

// Remove historico e reservas (somente maquinas) dos eventos informados, protegendo eventos ativos
function removerEventosDasMaquinas(nomes) {
  var alvo = {};
  nomes.forEach(function(n){ if (!getEventoInfo(n).ativo) alvo[n] = true; });
  var removidos = Object.keys(alvo);
  if (!removidos.length) return [];
  machines.forEach(function(m) {
    m.history = (m.history||[]).filter(function(h){ return !alvo[h.event]; });
    m.reservations = (m.reservations||[]).filter(function(r){ return !alvo[r.event]; });
  });
  save();
  return removidos;
}

function apagarEventosSelecionados() {
  var nomes = Object.keys(adminSelecionados);
  if (!nomes.length) return;
  var preview = nomes.slice(0, 10).join('\n• ') + (nomes.length > 10 ? '\n... e mais ' + (nomes.length - 10) : '');
  if (!confirm('Apagar o historico de ' + nomes.length + ' evento' + (nomes.length!==1?'s':'') + ' das maquinas?\n\n• ' + preview +
    '\n\nO financeiro e os fechamentos NAO serao apagados.\nISTO NAO PODE SER DESFEITO.')) return;
  var removidos = removerEventosDasMaquinas(nomes);
  adminSelecionados = {};
  renderAdminEventos(); populateAdminSelects();
  var pulados = nomes.length - removidos.length;
  alert(removidos.length + ' evento' + (removidos.length!==1?'s':'') + ' apagado' + (removidos.length!==1?'s':'') + ' do historico.' +
    (pulados ? '\n' + pulados + ' ignorado' + (pulados!==1?'s':'') + ' por estar' + (pulados!==1?'em':'') + ' ativo' + (pulados!==1?'s':'') + '.' : ''));
}

function openRenomearModal(evName) {
  document.getElementById('renomearOldName').value = evName;
  document.getElementById('renomearOldNameLabel').textContent = evName;
  document.getElementById('renomearNewName').value = evName;
  var count = getMachineCountForEvent(evName);
  document.getElementById('renomearInfo').textContent = 'Sera renomeado em ' + count + ' maquina' + (count!==1?'s':'') + ' (historico e reservas).';
  document.getElementById('renomearModal').classList.add('open');
}
function closeRenomearModal() { document.getElementById('renomearModal').classList.remove('open'); }
function confirmarRenomear() {
  var oldName = document.getElementById('renomearOldName').value;
  var newName = document.getElementById('renomearNewName').value.trim();
  if (!newName) { alert('Digite o novo nome.'); return; }
  if (newName === oldName) { alert('O nome e igual ao atual.'); return; }
  if (!confirm('Renomear "' + oldName + '" para "' + newName + '" em todas as maquinas e financeiro?')) return;
  var count = 0;
  machines.forEach(function(m) {
    (m.history||[]).forEach(function(h) { if(h.event===oldName){h.event=newName;count++;} });
    (m.reservations||[]).forEach(function(r) { if(r.event===oldName){r.event=newName;count++;} });
  });
  financeiro.forEach(function(f) { if(f.evento===oldName) f.evento=newName; });
  save(); saveFinanceiro();
  closeRenomearModal(); renderAdminEventos();
  alert('Renomeado em ' + count + ' registro(s)!');
}
function apagarEventoDoHistorico(evName) {
  var inf = getEventoInfo(evName);
  if (inf.ativo) { alert('"' + evName + '" esta ativo (maquina em uso ou reserva futura) e nao pode ser apagado.'); return; }
  if (!confirm('Apagar "' + evName + '" do historico de ' + inf.count + ' maquina' + (inf.count!==1?'s':'') + '?\n\nO financeiro e os fechamentos NAO serao apagados.\nISTO NAO PODE SER DESFEITO.')) return;
  removerEventosDasMaquinas([evName]);
  delete adminSelecionados[evName];
  renderAdminEventos();
  alert('Historico de "' + evName + '" apagado!');
}
function populateAdminSelects() {
  var events = getAllEvents();
  var opts = '<option value="">Selecione o evento</option>' + events.map(function(e){return'<option value="'+e+'">'+e+'</option>';}).join('');
  var s1=document.getElementById('adminHistEvento'), s2=document.getElementById('adminFinEvento');
  if(s1) s1.innerHTML=opts;
  if(s2) s2.innerHTML=opts;
}
function apagarHistoricoEvento() {
  var evName = document.getElementById('adminHistEvento').value;
  if(!evName){alert('Selecione um evento.');return;}
  apagarEventoDoHistorico(evName); populateAdminSelects();
}
function apagarFinanceiroEvento() {
  var evName = document.getElementById('adminFinEvento').value;
  if(!evName){alert('Selecione um evento.');return;}
  var count = financeiro.filter(function(f){return f.evento===evName;}).length;
  if(!count){alert('Nenhum lancamento encontrado.');return;}
  if(!confirm('Apagar '+count+' lancamento(s) de "'+evName+'"?\n\nISTO NAO PODE SER DESFEITO.')) return;


  financeiro = financeiro.filter(function(f){return f.evento!==evName;});
  saveFinanceiro(); populateAdminSelects();
  alert(count+' lancamento(s) apagado(s)!');
}

