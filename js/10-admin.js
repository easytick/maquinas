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
function renderAdminEventos() {
  var query = (document.getElementById('adminEventSearch').value||'').toLowerCase().trim();
  var hideZero = document.getElementById('adminHideZero') && document.getElementById('adminHideZero').checked;
  var events = getAllEvents().filter(function(e) {
    if (!query || e.toLowerCase().indexOf(query) > -1) {
      if (hideZero && getMachineCountForEvent(e) === 0) return false;
      return true;
    }
    return false;
  });
  var list = document.getElementById('adminEventosList');
  if (!events.length) { list.innerHTML = '<p style="color:#9ca3af;font-size:13px;padding:8px">Nenhum evento encontrado.</p>'; return; }
  list.innerHTML = '';
  events.forEach(function(ev) {
    var count = getMachineCountForEvent(ev);
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid var(--border)' + (count===0?';opacity:0.5':'');
    var info = document.createElement('div');
    info.style.flex = '1';
    var countLabel = count===0 ? '<span style="font-size:11px;color:#dc2626;margin-left:6px">sem maquinas</span>' : '<span style="font-size:11px;color:#6b7280;margin-left:6px">'+count+' maquina'+(count!==1?'s':'')+'</span>';
    info.innerHTML = '<b style="font-size:13px">' + ev + '</b>' + countLabel;
    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;flex-shrink:0';
    var btnRen = document.createElement('button');
    btnRen.textContent = 'Renomear';
    btnRen.style.cssText = 'font-size:11px;padding:5px 9px;width:auto;background:#dbeafe;color:#1e40af;border:none;border-radius:6px;cursor:pointer;font-family:Arial,sans-serif';
    btnRen.onclick = (function(e){ return function(){ openRenomearModal(e); }; })(ev);
    var btnDel = document.createElement('button');
    btnDel.textContent = 'Apagar';
    btnDel.style.cssText = 'font-size:11px;padding:5px 9px;width:auto;background:#fee2e2;color:#991b1b;border:none;border-radius:6px;cursor:pointer;font-family:Arial,sans-serif';
    btnDel.onclick = (function(e){ return function(){ apagarEventoDoHistorico(e); }; })(ev);
    btnRow.appendChild(btnRen); btnRow.appendChild(btnDel);
    div.appendChild(info); div.appendChild(btnRow);
    list.appendChild(div);
  });
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
  var count = getMachineCountForEvent(evName);
  if (!confirm('Apagar "' + evName + '" do historico de ' + count + ' maquina(s)?\n\nNao afeta maquinas atualmente em uso.\nISTO NAO PODE SER DESFEITO.')) return;



  machines.forEach(function(m) {
    var rs = getRealStatus(m);
    if (rs==='Em uso'||rs==='Em atraso') {
      var last = null;
      for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}
      if(last&&last.event===evName) return;
    }
    m.history = (m.history||[]).filter(function(h){return h.event!==evName;});
    m.reservations = (m.reservations||[]).filter(function(r){return r.event!==evName;});
  });
  save(); renderAdminEventos();
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

