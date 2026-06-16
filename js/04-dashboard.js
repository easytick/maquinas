// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
function updateDashboard(){
  var st=machines.map(getRealStatus);
  document.getElementById('totalCount').textContent=machines.length;
  document.getElementById('availableCount').textContent=st.filter(function(s){return s==='Disponivel';}).length;
  document.getElementById('inUseCount').textContent=st.filter(function(s){return s==='Em uso'||s==='Em atraso';}).length;
  document.getElementById('maintenanceCount').textContent=st.filter(function(s){return s==='Manutencao';}).length;
}

// ═══════════════════════════════════════════
// ALERTAS — Opção C: strip + lista colorida
// ═══════════════════════════════════════════
function _makeChip(num, label, cor) {
  return '<div class="alert-chip ' + cor + '">' +
    '<div class="alert-chip-num">' + num + '</div>' +
    '<div class="alert-chip-label">' + label + '</div>' +
  '</div>';
}

function toggleAlertaItem(btn) {
  var body = btn.parentElement;
  var detail = body.querySelector('.alerta-item-detail');
  var aberto = detail.style.display !== 'none';
  detail.style.display = aberto ? 'none' : 'block';
  btn.textContent = aberto ? '▼ ver detalhes' : '▲ fechar';
}

// detalhe = array de strings para exibir na área expandida
function _makeAlertaItem(cor, icone, titulo, sub, detalhe, acaoLabel, acaoFn) {
  var div = document.createElement('div');
  div.className = 'alerta-item ' + cor;

  var detalheRows = (detalhe || []).map(function(d) {
    return '<div class="alerta-detail-row"><span style="color:#9ca3af;flex-shrink:0">·</span> ' + d + '</div>';
  }).join('');

  div.innerHTML =
    '<span class="alerta-item-icon">' + icone + '</span>' +
    '<div class="alerta-item-body">' +
      '<div class="alerta-item-title">' + titulo + '</div>' +
      (sub ? '<div class="alerta-item-sub">' + sub + '</div>' : '') +
      '<button class="alerta-expand-btn" onclick="toggleAlertaItem(this)">▼ ver detalhes</button>' +
      '<div class="alerta-item-detail">' +
        (detalheRows ? '<div class="alerta-detail-list">' + detalheRows + '</div>' : '') +
        '<button class="alerta-nav-btn">' + acaoLabel + ' →</button>' +
      '</div>' +
    '</div>';

  div.querySelector('.alerta-nav-btn').onclick = acaoFn;
  return div;
}

function renderDayAlerts() {
  var today = getToday();
  var saidasHoje = {}, retornosHoje = {}, atrasosHoje = {};

  machines.forEach(function(m) {
    if (m.status === 'Em uso' || m.status === 'Manutencao') return;
    m.reservations.forEach(function(r) {
      if (hasDateOverlap(r.startDate, r.endDate, today, today)) {
        if (!saidasHoje[r.event]) saidasHoje[r.event] = [];
        saidasHoje[r.event].push(m);
      }
    });
  });
  machines.forEach(function(m) {
    var rs = getRealStatus(m);
    if (rs === 'Em atraso') {
      var last = null;
      for (var i = m.history.length - 1; i >= 0; i--) { if (m.history[i].type === 'saida') { last = m.history[i]; break; } }
      if (last) { var ev = last.event || 'Evento'; if (!atrasosHoje[ev]) atrasosHoje[ev] = []; atrasosHoje[ev].push({m: m, last: last}); }
    }
    if (rs !== 'Em uso') return;
    var last2 = null;
    for (var j = m.history.length - 1; j >= 0; j--) { if (m.history[j].type === 'saida') { last2 = m.history[j]; break; } }
    if (last2 && last2.endDate === today) {
      var ev2 = last2.event || 'Evento';
      if (!retornosHoje[ev2]) retornosHoje[ev2] = [];
      retornosHoje[ev2].push(m);
    }
  });

  var ts = Object.keys(saidasHoje).reduce(function(a, k) { return a + saidasHoje[k].length; }, 0);
  var tr = Object.keys(retornosHoje).reduce(function(a, k) { return a + retornosHoje[k].length; }, 0);
  var ta = Object.keys(atrasosHoje).reduce(function(a, k) { return a + atrasosHoje[k].length; }, 0);

  var fp = financeiro.filter(function(f) { return f.status === 'Pendente'; });

  var fechPendentes = [];
  if (typeof fechamentos !== 'undefined') {
    fechPendentes = fechamentos.filter(function(f) { return getFechStatus(f) !== 'quitado'; });
  }

  var intProximas = [];
  if (typeof reservasIntencao !== 'undefined') {
    var proxDias = new Date(); proxDias.setDate(proxDias.getDate() + 3);
    var proxStr = proxDias.toISOString().slice(0, 10);
    intProximas = reservasIntencao.filter(function(r) {
      return r.status === 'pendente' && r.startDate >= today && r.startDate <= proxStr;
    });
  }

  var recAtrasados = [], recVencendo = [];
  if (typeof recorrentes !== 'undefined' && typeof getRecStatus === 'function') {
    recAtrasados = recorrentes.filter(function(r) { return r.status !== 'inativo' && getRecStatus(r) === 'atrasado'; });
    recVencendo  = recorrentes.filter(function(r) { return r.status !== 'inativo' && getRecStatus(r) === 'vencendo'; });
  }

  var movHoje = ts + tr;
  var temAlgo = movHoje > 0 || ta > 0 || fp.length > 0 || fechPendentes.length > 0 || intProximas.length > 0 || recAtrasados.length > 0 || recVencendo.length > 0;

  // ── STRIP ──
  var stripEl = document.getElementById('alertas-strip');
  if (stripEl) {
    if (temAlgo) {
      stripEl.style.display = '';
      stripEl.innerHTML =
        _makeChip(movHoje, 'hoje', movHoje > 0 ? 'blue' : 'gray') +
        _makeChip(ta, 'atraso', ta > 0 ? 'red' : 'gray') +
        _makeChip(fp.length, 'pgto', fp.length > 0 ? 'yellow' : 'gray') +
        _makeChip(fechPendentes.length, 'repasse', fechPendentes.length > 0 ? 'yellow' : 'gray');
    } else {
      stripEl.style.display = 'none';
      stripEl.innerHTML = '';
    }
  }

  // ── LABEL ──
  var labelEl = document.getElementById('alertas-section-label');
  if (labelEl) labelEl.style.display = temAlgo ? '' : 'none';

  // ── LISTA ──
  var listaEl = document.getElementById('alertas-lista');
  if (!listaEl) return;
  listaEl.innerHTML = '';
  if (!temAlgo) return;

  // Prioridade 1 — Em atraso (máquinas)
  if (ta > 0) {
    var detalheAtraso = Object.keys(atrasosHoje).map(function(ev) {
      var items = atrasosHoje[ev];
      var d = daysDiff(items[0].last.endDate);
      return '<b>' + ev + '</b> — ' + d + ' dia' + (d > 1 ? 's' : '') + ' de atraso (' + items.length + ' maq.)';
    });
    var subAtraso = detalheAtraso.slice(0, 2).join(', ') + (detalheAtraso.length > 2 ? '…' : '');
    listaEl.appendChild(_makeAlertaItem('red', '🔴',
      ta + ' máquina' + (ta > 1 ? 's' : '') + ' em atraso',
      subAtraso, detalheAtraso, 'Ver todas em atraso',
      function() { setPage('maquinas'); setStatusFilter2('Em atraso'); }));
  }

  // Prioridade 2 — Recorrentes atrasados/vencendo
  if (recAtrasados.length > 0 || recVencendo.length > 0) {
    var msgRec = [];
    if (recAtrasados.length) msgRec.push(recAtrasados.length + ' plano' + (recAtrasados.length > 1 ? 's' : '') + ' em atraso');
    if (recVencendo.length)  msgRec.push(recVencendo.length  + ' vencendo em breve');
    var detalheRec = recAtrasados.map(function(r) { return '<b>' + r.nome + '</b> — em atraso'; })
      .concat(recVencendo.map(function(r) { return '<b>' + r.nome + '</b> — vence em breve'; }));
    var subRec = recAtrasados.concat(recVencendo).slice(0, 2).map(function(r) { return r.nome; }).join(', ') + (recAtrasados.length + recVencendo.length > 2 ? '…' : '');
    listaEl.appendChild(_makeAlertaItem('red', '🔄',
      msgRec.join(' · '), subRec, detalheRec, 'Ver recorrentes',
      function() { setPage('recorrentes'); }));
  }

  // Prioridade 3 — Repasses de fechamento pendentes
  if (fechPendentes.length > 0) {
    var detalheRep = fechPendentes.map(function(f) {
      var saldo = (f.valorFinal || 0);
      return '<b>' + f.evento + '</b> — a repassar: ' + formatMoney(saldo);
    });
    var subRep = fechPendentes.slice(0, 2).map(function(f) { return f.evento; }).join(', ') + (fechPendentes.length > 2 ? '…' : '');
    listaEl.appendChild(_makeAlertaItem('yellow', '💰',
      fechPendentes.length + ' repasse' + (fechPendentes.length > 1 ? 's' : '') + ' pendente' + (fechPendentes.length > 1 ? 's' : ''),
      subRep, detalheRep, 'Ver fechamentos',
      function() { setPage('fechamentos'); setFechTab('historico'); setFechHistFiltroStatus('pendente'); }));
  }

  // Prioridade 4 — Pagamentos financeiros pendentes
  if (fp.length > 0) {
    var detalheFin = fp.map(function(f) { return '<b>' + (f.evento || '-') + '</b> — ' + formatMoney(f.valor); });
    var subFin = fp.slice(0, 2).map(function(f) { return f.evento + ': ' + formatMoney(f.valor); }).join(' · ') + (fp.length > 2 ? '…' : '');
    listaEl.appendChild(_makeAlertaItem('yellow', '🟡',
      fp.length + ' pagamento' + (fp.length > 1 ? 's' : '') + ' pendente' + (fp.length > 1 ? 's' : ''),
      subFin, detalheFin, 'Ver pendentes',
      function() { setPage('financeiro'); setFinTab('pendentes'); }));
  }

  // Prioridade 5 — Reservas de intenção próximas
  if (intProximas.length > 0) {
    var detalheInt = intProximas.map(function(r) {
      return '<b>' + r.evento + '</b> — ' + r.quantidade + 'x ' + r.marca + ' · saída ' + r.startDate;
    });
    var subInt = intProximas.slice(0, 2).map(function(r) { return r.evento; }).join(', ') + (intProximas.length > 2 ? '…' : '');
    listaEl.appendChild(_makeAlertaItem('yellow', '📋',
      intProximas.length + ' reserva' + (intProximas.length > 1 ? 's' : '') + ' de intenção em até 3 dias',
      subInt, detalheInt, 'Ver intenções',
      function() { setPage('inicio'); setTimeout(function(){ var el=document.getElementById('reservasIntencaoCard'); if(el) el.scrollIntoView({behavior:'smooth'}); },50); }));
  }

  // Prioridade 6 — Retornos hoje
  if (tr > 0) {
    var detalheRet = Object.keys(retornosHoje).map(function(ev) {
      return '<b>' + ev + '</b> — ' + retornosHoje[ev].length + ' maq.';
    });
    var subRet = Object.keys(retornosHoje).slice(0, 2).join(', ') + (Object.keys(retornosHoje).length > 2 ? '…' : '');
    listaEl.appendChild(_makeAlertaItem('blue', '🔵',
      tr + ' máquina' + (tr > 1 ? 's' : '') + ' retorna' + (tr > 1 ? 'm' : '') + ' hoje',
      subRet, detalheRet, 'Ver resumo do dia',
      function() { setPage('inicio'); showDayResume('today'); }));
  }

  // Prioridade 7 — Saídas hoje
  if (ts > 0) {
    var detalheSai = Object.keys(saidasHoje).map(function(ev) {
      return '<b>' + ev + '</b> — ' + saidasHoje[ev].length + ' maq.';
    });
    var subSai = Object.keys(saidasHoje).slice(0, 2).join(', ') + (Object.keys(saidasHoje).length > 2 ? '…' : '');
    listaEl.appendChild(_makeAlertaItem('blue', '🔵',
      ts + ' máquina' + (ts > 1 ? 's' : '') + ' sai' + (ts > 1 ? 'em' : '') + ' hoje',
      subSai, detalheSai, 'Ver resumo do dia',
      function() { setPage('inicio'); showDayResume('today'); }));
  }
}


function getReservationsByRange(s,e){
  var showEmUso=document.getElementById('showEmUsoToggle')&&document.getElementById('showEmUsoToggle').checked;
  var l=[];
  machines.forEach(function(m){
    m.reservations.forEach(function(r){
      if(hasDateOverlap(r.startDate,r.endDate,s,e)){
        var st=getRealStatus(m);
        if(st==='Em uso'&&!showEmUso)return;
        l.push(Object.assign({},r,{serial:m.serial,brand:m.brand,status:st}));
      }
    });
  });
  return l;
}
function getRetornosByRange(s,e){
  var l=[];
  machines.forEach(function(m){
    var rs=getRealStatus(m);
    if(rs!=='Em uso'&&rs!=='Em atraso')return;
    var last=null;
    for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}
    if(last&&hasDateOverlap(last.endDate,last.endDate,s,e)){
      l.push(Object.assign({},last,{serial:m.serial,brand:m.brand,isAtraso:rs==='Em atraso',diasAtraso:rs==='Em atraso'?daysDiff(last.endDate):0}));
    }
  });
  return l;
}
function groupByEvent(list){
  return list.reduce(function(g,r){if(!g[r.event])g[r.event]=[];g[r.event].push(r);return g;},{});
}
function renderDayResume(start,end,label){
  _lastDayResume={s:start,e:end,l:label};
  var box=document.getElementById('dayResumeBox'),res=getReservationsByRange(start,end),ret=getRetornosByRange(start,end),today=getToday(),isToday=(start===today&&end===today);
  if(!res.length&&!ret.length){box.innerHTML='<b>'+label+'</b> - '+formatDate(start)+' ate '+formatDate(end)+'<br><br>Nenhuma movimentacao encontrada.';return;}
  var grouped=groupByEvent(res),grRet=groupByEvent(ret.map(function(r){return Object.assign({},r,{event:r.event||'Evento'});}));
  var html='<b>'+label+'</b> - '+formatDate(start)+' ate '+formatDate(end)+'<br>';
  if(res.length) html+='Saidas previstas: <b>'+res.length+'</b> &nbsp;';
  if(ret.length) html+='Retornos: <b>'+ret.length+'</b>';
  Object.keys(grouped).forEach(function(ev){
    var items=grouped[ev],pendentes=isToday?items.filter(function(i){return i.status==='Reservada hoje';}):items;
    var btnS=(isToday&&pendentes.length)?'<button onclick="confirmarSaidaLote(\''+ev+'\')" style="background:var(--green)">Saida em todas ('+pendentes.length+')</button>':'';
    html+='<div class="day-event-group"><h3>'+ev+' <small style="font-weight:normal;font-size:12px">('+items.length+' maquina'+(items.length>1?'s':'')+')</small> '+btnS+'</h3>'+items.map(function(i){return '<div class="day-item"><b>'+i.serial+'</b> - '+i.brand+(i.city?' - '+i.city:'')+(i.responsible?' - '+i.responsible:'')+(i.address?'<br>Endereco: '+i.address:'')+'<br>'+formatDate(i.startDate)+' ate '+formatDate(i.endDate)+' - <span class="status '+getStatusClass(i.status)+'" style="font-size:11px;padding:2px 8px">'+i.status+'</span>'+(i.createdBy?'<br><span class="history-user">'+i.createdBy+'</span>':'')+'</div>';}).join('')+'</div>';
  });
  if(ret.length){Object.keys(grRet).forEach(function(ev){var items=grRet[ev];var btnE=isToday?'<button class="entrada-btn" onclick="confirmarEntradaLote(\''+ev+'\')">Entrada em todas ('+items.length+')</button>':'';html+='<div class="'+(items.some(function(i){return i.isAtraso;})?'atraso-group':'retorno-group')+'"><h3>'+(items.some(function(i){return i.isAtraso;})?'ATRASO: ':'Retorno: ')+ev+' '+btnE+'</h3>'+items.map(function(i){return '<div class="day-item"><b>'+i.serial+'</b> - '+i.brand+(i.city?' - '+i.city:'')+'<br>'+(i.isAtraso?'<span style="color:#9d174d;font-weight:bold">Retorno era '+formatDate(i.endDate)+' - '+i.diasAtraso+' dia'+(i.diasAtraso>1?'s':'')+' de atraso</span>':'Retorno previsto: '+formatDate(i.endDate))+'</div>';}).join('')+'</div>';});}
  box.innerHTML=html;
}
function showDayResume(type){var today=getToday();if(type==='today')renderDayResume(today,today,'Hoje');else if(type==='week'){var w=getWeekRange();renderDayResume(w.start,w.end,'Esta semana');}else if(type==='15days')renderDayResume(today,addDays(today,15),'Proximos 15 dias');else{var mo=getMonthRange();renderDayResume(mo.start,mo.end,'Este mes');}}
function showCustomDayResume(){var s=document.getElementById('customStartDate').value,e=document.getElementById('customEndDate').value;if(!s||!e){alert('Selecione as duas datas.');return;}if(e<s){alert('Data final nao pode ser menor.');return;}renderDayResume(s,e,'Periodo personalizado');}

function confirmarSaidaLote(eventName){
  var today=getToday(),maquinas=machines.filter(function(m){if(m.status==='Em uso'||m.status==='Manutencao')return false;return m.reservations.some(function(r){return r.event===eventName&&hasDateOverlap(r.startDate,r.endDate,today,today);});});
  if(!maquinas.length){alert('Nenhuma maquina disponivel.');return;}if(!confirm('Confirmar saida de '+maquinas.length+' maquina(s) para "'+eventName+'"?'))return;
  var un=getCurrentUserName(),ue=getCurrentUserEmail();
  maquinas.forEach(function(m){var res=m.reservations.find(function(r){return r.event===eventName&&hasDateOverlap(r.startDate,r.endDate,today,today);});m.status='Em uso';m.history.push({type:'saida',event:eventName,city:res?res.city||'':'',responsible:res?res.responsible||'':'',address:res?res.address||'':'',startDate:res?res.startDate:today,endDate:res?res.endDate:today,date:new Date().toISOString(),user:un,userEmail:ue,fromReservation:true});});
  save();alert('Saida confirmada!');
}
function confirmarEntradaLote(eventName){
  var today=getToday(),maquinas=machines.filter(function(m){if(m.status!=='Em uso')return false;var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}return last&&last.event===eventName&&last.endDate===today;});
  if(!maquinas.length){alert('Nenhuma maquina encontrada.');return;}if(!confirm('Confirmar entrada de '+maquinas.length+' maquina(s)?'))return;
  var un=getCurrentUserName(),ue=getCurrentUserEmail();
  maquinas.forEach(function(m){m.status='Disponivel';m.history.push({type:'entrada',observation:'Entrada via Resumo do Dia',date:new Date().toISOString(),user:un,userEmail:ue});});
  save();alert('Entrada confirmada!');
}

