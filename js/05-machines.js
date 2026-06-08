// ═══════════════════════════════════════════
// CADASTRO
// ═══════════════════════════════════════════
function cadastrarMaquina(e){
  e.preventDefault();
  var serial=document.getElementById('serial').value.trim().toUpperCase(),brand=document.getElementById('brand').value;
  if(!serial||!brand){alert('Preencha todos os dados.');return;}
  if(machines.some(function(m){return m.serial===serial;})){alert('Maquina ja cadastrada!');return;}
  machines.push({serial:serial,brand:brand,status:'Disponivel',history:[],reservations:[],showHistory:false});
  save();document.getElementById('serial').value='';document.getElementById('brand').value='';
}

// ═══════════════════════════════════════════
// SAIDA INDIVIDUAL
// ═══════════════════════════════════════════
function openExitModal(serial){var m=machines.find(function(m){return m.serial===serial;});if(!m)return;var rs=getRealStatus(m);if(rs==='Em uso'||rs==='Em atraso'){alert('Ja esta em uso.');return;}if(rs==='Manutencao'){alert('Maquina em manutencao.');return;}document.getElementById('exitSerial').value=serial;document.getElementById('exitEvent').value='';document.getElementById('exitCity').value='';document.getElementById('exitResponsible').value='';document.getElementById('exitAddress').value='';document.getElementById('exitStartDate').value='';document.getElementById('exitEndDate').value='';document.getElementById('exitStartDate').min=getToday();document.getElementById('exitEndDate').min=getToday();document.getElementById('exitConflictMsg').style.display='none';document.getElementById('exitConfirmBtn').disabled=false;document.getElementById('exitModal').classList.add('open');}
function closeExitModal(){document.getElementById('exitModal').classList.remove('open');}
function checkExitConflict(){var serial=document.getElementById('exitSerial').value,s=document.getElementById('exitStartDate').value,e=document.getElementById('exitEndDate').value;if(!s||!e)return;document.getElementById('exitEndDate').min=s;var m=machines.find(function(m){return m.serial===serial;});if(!m)return;var blocked=isBlockedForExit(m,s,e);if(blocked){document.getElementById('exitConflictMsg').style.display='block';document.getElementById('exitConflictMsg').textContent=blocked;document.getElementById('exitConfirmBtn').disabled=true;}else{document.getElementById('exitConflictMsg').style.display='none';document.getElementById('exitConfirmBtn').disabled=false;}}
function submitSaidaIndividual(e){e.preventDefault();var serial=document.getElementById('exitSerial').value,s=document.getElementById('exitStartDate').value,en=document.getElementById('exitEndDate').value;var m=machines.find(function(m){return m.serial===serial;});if(!m)return;var blocked=isBlockedForExit(m,s,en);if(blocked){alert(blocked);return;}var un=getCurrentUserName(),ue=getCurrentUserEmail(),addr=document.getElementById('exitAddress').value.trim();m.status='Em uso';m.history.push({type:'saida',event:document.getElementById('exitEvent').value.trim(),city:document.getElementById('exitCity').value.trim(),responsible:document.getElementById('exitResponsible').value.trim(),address:addr,startDate:s,endDate:en,date:new Date().toISOString(),user:un,userEmail:ue});closeExitModal();save();}

// ═══════════════════════════════════════════
// CONFIRMAR SAIDA DA RESERVA
// ═══════════════════════════════════════════
function confirmarSaidaDaReserva(serial){var today=getToday(),m=machines.find(function(m){return m.serial===serial;});if(!m)return;var res=m.reservations.find(function(r){return hasDateOverlap(r.startDate,r.endDate,today,today);});if(!res){alert('Nenhuma reserva ativa para hoje.');return;}if(!confirm('Confirmar saida de '+serial+' para "'+res.event+'"?'))return;var un=getCurrentUserName(),ue=getCurrentUserEmail();m.status='Em uso';m.history.push({type:'saida',event:res.event,city:res.city||'',responsible:res.responsible||'',address:res.address||'',startDate:res.startDate,endDate:res.endDate,date:new Date().toISOString(),user:un,userEmail:ue,fromReservation:true});save();}

// ═══════════════════════════════════════════
// ENTRADA INDIVIDUAL
// ═══════════════════════════════════════════
function registerEntry(serial){var m=machines.find(function(m){return m.serial===serial;});if(!m)return;var rs=getRealStatus(m);if(rs==='Disponivel'){alert('Ja esta disponivel.');return;}if(rs==='Manutencao'){alert('Use o botao Liberar.');return;}var obs=prompt('Observacao da devolucao (opcional):'),un=getCurrentUserName(),ue=getCurrentUserEmail();m.status='Disponivel';m.history.push({type:'entrada',observation:obs||'',date:new Date().toISOString(),user:un,userEmail:ue});save();}

// ═══════════════════════════════════════════
// RESERVA INDIVIDUAL
// ═══════════════════════════════════════════
function openReserveModal(serial){var m=machines.find(function(m){return m.serial===serial;});if(!m)return;var rs=getRealStatus(m);if(rs==='Em uso'||rs==='Em atraso'){alert('Nao e possivel reservar uma maquina em uso.');return;}if(rs==='Manutencao'){alert('Maquina em manutencao.');return;}document.getElementById('reserveSerial').value=serial;document.getElementById('reserveEvent').value='';document.getElementById('reserveStartDate').value='';document.getElementById('reserveEndDate').value='';document.getElementById('reserveAddress').value='';document.getElementById('reserveStartDate').min=getToday();document.getElementById('reserveEndDate').min=getToday();document.getElementById('reserveModal').classList.add('open');}
function closeReserveModal(){document.getElementById('reserveModal').classList.remove('open');}
function submitReservaIndividual(e){e.preventDefault();var serial=document.getElementById('reserveSerial').value,m=machines.find(function(m){return m.serial===serial;});if(!m)return;var eventName=document.getElementById('reserveEvent').value.trim(),s=document.getElementById('reserveStartDate').value,en=document.getElementById('reserveEndDate').value,address=document.getElementById('reserveAddress').value.trim();if(en<s){alert('Data final nao pode ser menor.');return;}if(hasReservationConflict(m,s,en)){alert('Conflito: maquina ja reservada nesse periodo.');return;}var un=getCurrentUserName(),ue=getCurrentUserEmail();m.reservations.push({event:eventName,startDate:s,endDate:en,address:address,createdAt:new Date().toISOString(),createdBy:un,createdByEmail:ue});m.history.push({type:'reserva',event:eventName,startDate:s,endDate:en,address:address,date:new Date().toISOString(),user:un,userEmail:ue});closeReserveModal();save();}

// ═══════════════════════════════════════════
// VER RESERVAS / DAR SAIDA DA RESERVA FUTURA
// ═══════════════════════════════════════════
function openViewReservesModal(serial){document.getElementById('viewReservesModal').dataset.serial=serial;refreshViewReservesContent(serial);document.getElementById('viewReservesModal').classList.add('open');}
function refreshViewReservesContent(serial){
  var m=machines.find(function(m){return m.serial===serial;});if(!m)return;
  var content=document.getElementById('viewReservesContent');
  if(!m.reservations.length){content.innerHTML="<p style='color:#6b7280'>Nenhuma reserva cadastrada.</p>";return;}
  content.innerHTML='';
  m.reservations.forEach(function(r,idx){
    var div=document.createElement('div');div.className='reservation-detail';
    div.innerHTML='<b>'+r.event+'</b><br>'+formatDate(r.startDate)+' ate '+formatDate(r.endDate)+(r.city?'<br>Cidade: '+r.city:'')+(r.responsible?'<br>Responsavel: '+r.responsible:'')+(r.address?'<br>Endereco: '+r.address:'')+(r.createdBy?'<br><span class="history-user">'+r.createdBy+'</span>':'');
    var btnRow=document.createElement('div');btnRow.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:8px';
    var btnSaida=document.createElement('button');btnSaida.textContent='Saida agora';btnSaida.style.cssText='background:#dcfce7;color:#166534;border:1px solid #86efac;font-size:12px;padding:5px 12px;width:auto;font-weight:bold';btnSaida.onclick=(function(i){return function(){darSaidaDaReservaFutura(serial,i);};})(idx);
    var btnCancel=document.createElement('button');btnCancel.textContent='Cancelar reserva';btnCancel.style.cssText='background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;font-size:12px;padding:5px 12px;width:auto;font-weight:bold';btnCancel.onclick=(function(i){return function(){cancelReservation(serial,i);};})(idx);
    btnRow.appendChild(btnSaida);btnRow.appendChild(btnCancel);div.appendChild(btnRow);content.appendChild(div);
  });
}
function darSaidaDaReservaFutura(serial,idx){var m=machines.find(function(m){return m.serial===serial;});if(!m)return;var res=m.reservations[idx];if(!res)return;var rs=getRealStatus(m);if(rs==='Em uso'||rs==='Em atraso'){alert('Maquina ja esta em uso.');return;}if(rs==='Manutencao'){alert('Maquina em manutencao.');return;}if(!confirm('Confirmar saida de '+serial+' para: '+res.event+'? Periodo: '+formatDate(res.startDate)+' ate '+formatDate(res.endDate)))return;var un=getCurrentUserName(),ue=getCurrentUserEmail();m.status='Em uso';m.history.push({type:'saida',event:res.event,city:res.city||'',responsible:res.responsible||'',address:res.address||'',startDate:res.startDate,endDate:res.endDate,date:new Date().toISOString(),user:un,userEmail:ue,fromReservation:true,earlyExit:true});save();refreshViewReservesContent(serial);alert('Saida registrada!');}
function cancelReservation(serial,idx){var m=machines.find(function(m){return m.serial===serial;});if(!m)return;var res=m.reservations[idx];if(!res)return;if(!confirm('Cancelar a reserva "'+res.event+'" ('+formatDate(res.startDate)+' ate '+formatDate(res.endDate)+')?'))return;var un=getCurrentUserName(),ue=getCurrentUserEmail();m.history.push({type:'cancelamento de reserva',event:res.event,startDate:res.startDate,endDate:res.endDate,city:res.city||'',responsible:res.responsible||'',date:new Date().toISOString(),user:un,userEmail:ue});m.reservations.splice(idx,1);save();refreshViewReservesContent(serial);}
function closeViewReservesModal(){document.getElementById('viewReservesModal').classList.remove('open');}

// ═══════════════════════════════════════════
// MANUTENCAO INDIVIDUAL
// ═══════════════════════════════════════════
function sendToMaintenance(serial){var m=machines.find(function(m){return m.serial===serial;});if(!m)return;if(m.status==='Em uso'){alert('Nao e possivel colocar em manutencao uma maquina em uso.');return;}var reason=prompt('Motivo da manutencao:'),un=getCurrentUserName(),ue=getCurrentUserEmail();m.status='Manutencao';m.history.push({type:'manutencao',observation:reason||'',date:new Date().toISOString(),user:un,userEmail:ue});save();}
function returnFromMaintenance(serial){var m=machines.find(function(m){return m.serial===serial;});if(!m)return;var obs=prompt('Observacao da liberacao:'),un=getCurrentUserName(),ue=getCurrentUserEmail();m.status='Disponivel';m.history.push({type:'retorno manutencao',observation:obs||'',date:new Date().toISOString(),user:un,userEmail:ue});save();}

// ═══════════════════════════════════════════
// EXCLUIR
// ═══════════════════════════════════════════
function deleteMachine(serial){var m=machines.find(function(m){return m.serial===serial;});if(!m)return;if(m.status==='Em uso'){alert('Nao e possivel excluir uma maquina em uso.');return;}if(!confirm('Deseja realmente excluir essa maquina?'))return;machines=machines.filter(function(m){return m.serial!==serial;});save();}

// ═══════════════════════════════════════════
// HISTORICO
// ═══════════════════════════════════════════
function toggleHistory(serial){var m=machines.find(function(m){return m.serial===serial;});if(m){m.showHistory=!m.showHistory;render();}}

// ═══════════════════════════════════════════
// FILTROS
// ═══════════════════════════════════════════
function getEvents(){var ev=new Set();machines.forEach(function(m){m.history.forEach(function(h){if(h.event)ev.add(h.event);});m.reservations.forEach(function(r){if(r.event)ev.add(r.event);});});return Array.from(ev);}
function refreshEventFilter(sel){
  sel=sel||'';
  var ef=document.getElementById('eventFilter');
  if(!ef)return;
  var evs=getEvents().slice().sort();
  ef.innerHTML='<option value="">Todos os eventos</option>'+evs.map(function(e){return'<option value="'+e+'"'+(e===sel?' selected':'')+'>'+e+'</option>';}).join('');
}
function getCurrentEvent(m){var s=getRealStatus(m);if(s==='Em uso'||s==='Em atraso'){var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}return last?last.event:'-';}if(s==='Manutencao')return 'Em manutencao';if(s==='Reservada hoje'){var t=getToday(),a=m.reservations.find(function(r){return hasDateOverlap(r.startDate,r.endDate,t,t);});return a?a.event:'-';}return '-';}
function getNextReservation(m){var today=getToday();return m.reservations.filter(function(r){return r.endDate>=today;}).sort(function(a,b){return a.startDate.localeCompare(b.startDate);})[0]||null;}

// ═══════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════
function render(){
  updateDashboard();renderDayAlerts();
  var selEv=document.getElementById('eventFilter').value;refreshEventFilter(selEv);
  var search=document.getElementById('searchInput').value.toLowerCase(),brand=document.getElementById('brandFilter').value,status=currentStatusFilter,evFilt=document.getElementById('eventFilter').value;
  var filtered=machines.filter(function(m){var rs=getRealStatus(m);return m.serial.toLowerCase().indexOf(search)>-1&&(!brand||m.brand===brand)&&(!status||rs===status)&&(!evFilt||machineIsInEvent(m,evFilt));});
  var rc=document.getElementById('resultsCount');
  if(search||brand||status||evFilt){rc.style.display='block';rc.textContent=filtered.length+' maquina'+(filtered.length!==1?'s':'')+' encontrada'+(filtered.length!==1?'s':'')+(evFilt?' - Evento: '+evFilt:'')+(brand?' - '+brand:'')+(status?' - '+status:'');}
  else rc.style.display='none';
  var list=document.getElementById('machineList');list.innerHTML='';
  if(!filtered.length){list.innerHTML="<p style='color:#9ca3af'>Nenhuma maquina encontrada.</p>";return;}
  filtered.forEach(function(m){
    var rs=getRealStatus(m),nextRes=getNextReservation(m),today=getToday();
    var resHoje=rs==='Reservada hoje'?m.reservations.find(function(r){return hasDateOverlap(r.startDate,r.endDate,today,today);}):null;
    var lastSaida=null;if(rs==='Em uso'||rs==='Em atraso'){for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){lastSaida=m.history[i];break;}}}
    var infoHtml='';
    if(rs==='Disponivel') infoHtml=nextRes?'<p><b>Proxima reserva:</b> '+nextRes.event+' - '+formatDate(nextRes.startDate)+' ate '+formatDate(nextRes.endDate)+'</p>'+(nextRes.address?'<p><b>Endereco:</b> '+nextRes.address+'</p>':''):'<p style="color:#9ca3af">Sem reservas futuras</p>';
    if(rs==='Reservada hoje'&&resHoje) infoHtml='<p><b>Evento:</b> '+resHoje.event+'</p><p><b>Periodo:</b> '+formatDate(resHoje.startDate)+' ate '+formatDate(resHoje.endDate)+'</p>'+(resHoje.city?'<p><b>Cidade:</b> '+resHoje.city+'</p>':'')+(resHoje.responsible?'<p><b>Responsavel:</b> '+resHoje.responsible+'</p>':'')+(resHoje.address?'<p><b>Endereco:</b> '+resHoje.address+'</p>':'')+'<div class="alert-reservada">Sai hoje - clique em Confirmar saida</div>';
    if((rs==='Em uso'||rs==='Em atraso')&&lastSaida) infoHtml='<p><b>Evento:</b> '+(lastSaida.event||'-')+'</p>'+(lastSaida.city?'<p><b>Cidade:</b> '+lastSaida.city+'</p>':'')+(lastSaida.address?'<p><b>Endereco:</b> '+lastSaida.address+'</p>':'')+'<p><b>Retorno previsto:</b> '+formatDate(lastSaida.endDate)+'</p>'+(rs==='Em atraso'?'<div class="alert-atraso-card">ATRASO de '+daysDiff(lastSaida.endDate)+' dia'+(daysDiff(lastSaida.endDate)>1?'s':'')+'! Retorno era '+formatDate(lastSaida.endDate)+'</div>':'');
    if(rs==='Manutencao'){var lM=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='manutencao'){lM=m.history[i];break;}}infoHtml=lM&&lM.observation?'<p><b>Motivo:</b> '+lM.observation+'</p>':'';}
    var acoesHtml='';
    if(rs==='Disponivel') acoesHtml='<div class="actions-row"><button onclick="openExitModal(\''+m.serial+'\')">Saida</button><button onclick="openReserveModal(\''+m.serial+'\')">Reservar</button><button class="btn-secundario" onclick="openViewReservesModal(\''+m.serial+'\')">Ver reservas</button><button class="btn-secundario" onclick="toggleHistory(\''+m.serial+'\')">'+(m.showHistory?'Ocultar':'Historico')+'</button><button class="btn-gray" onclick="sendToMaintenance(\''+m.serial+'\')">Manutencao</button><button class="btn-danger" onclick="deleteMachine(\''+m.serial+'\')">Excluir</button></div>';
    if(rs==='Reservada hoje') acoesHtml='<div class="actions-row"><button class="btn-confirmar-saida" onclick="confirmarSaidaDaReserva(\''+m.serial+'\')">Confirmar saida</button><button class="btn-secundario" onclick="openViewReservesModal(\''+m.serial+'\')">Ver reservas</button><button class="btn-secundario" onclick="toggleHistory(\''+m.serial+'\')">'+(m.showHistory?'Ocultar':'Historico')+'</button></div>';
    if(rs==='Em uso'||rs==='Em atraso') acoesHtml='<div class="actions-row"><button class="btn-entrada" onclick="registerEntry(\''+m.serial+'\')">Registrar entrada</button><button class="btn-secundario" onclick="toggleHistory(\''+m.serial+'\')">'+(m.showHistory?'Ocultar':'Historico')+'</button></div>';
    if(rs==='Manutencao') acoesHtml='<div class="actions-row"><button style="background:var(--green)" onclick="returnFromMaintenance(\''+m.serial+'\')">Liberar</button><button class="btn-secundario" onclick="toggleHistory(\''+m.serial+'\')">'+(m.showHistory?'Ocultar':'Historico')+'</button><button class="btn-danger" onclick="deleteMachine(\''+m.serial+'\')">Excluir</button></div>';
    var historyHtml=m.showHistory?'<div class="history-box">'+(m.history.length===0?'<p>Sem historico.</p>':m.history.slice().reverse().map(function(h){return'<div class="history-item"><b>'+h.type.toUpperCase()+(h.batch?' EM LOTE':'')+'</b>'+(h.event?'<br>Evento: '+h.event:'')+(h.city?'<br>Cidade: '+h.city:'')+(h.responsible?'<br>Responsavel: '+h.responsible:'')+(h.address?'<br>Endereco: '+h.address:'')+(h.startDate?'<br>'+formatDate(h.startDate)+' ate '+formatDate(h.endDate):'')+(h.observation?'<br>Obs: '+h.observation:'')+'<br><small style="color:#9ca3af">'+formatDateTime(h.date)+'</small>'+(h.user?'<br><span class="history-user">'+h.user+'</span>':'')+'</div>';}).join(''))+'</div>':'';
    var div=document.createElement('div');div.className='machine-item';
    div.innerHTML='<div class="machine-header"><div><div class="machine-serial">'+m.serial+'</div><div class="machine-brand">'+m.brand+'</div></div><span class="status '+getStatusClass(rs)+'">'+rs+'</span></div><div class="machine-info">'+infoHtml+'</div><div class="actions">'+acoesHtml+'</div>'+historyHtml;
    list.appendChild(div);
  });
}

// ═══════════════════════════════════════════
// FILTROS LIVE + DATAS
// ═══════════════════════════════════════════
['searchInput','brandFilter','eventFilter'].forEach(function(id){var el=document.getElementById(id);if(el){el.addEventListener('input',render);el.addEventListener('change',render);}});
var _today=getToday();
['batchStartDate','batchEndDate','customStartDate','customEndDate','batchExitStartDate','batchExitEndDate','novaDataRetorno'].forEach(function(id){var el=document.getElementById(id);if(el)el.min=_today;});
document.getElementById('batchStartDate').addEventListener('change',function(){document.getElementById('batchEndDate').min=this.value;if(reserveMode==='manual')refreshReserveMachineList();});
document.getElementById('batchEndDate').addEventListener('change',function(){if(reserveMode==='manual')refreshReserveMachineList();});
document.getElementById('batchExitStartDate').addEventListener('change',function(){document.getElementById('batchExitEndDate').min=this.value;if(exitMode==='manual')refreshExitMachineList();});
document.getElementById('batchExitEndDate').addEventListener('change',function(){if(exitMode==='manual')refreshExitMachineList();});
document.getElementById('customStartDate').addEventListener('change',function(){document.getElementById('customEndDate').min=this.value;});



// ═══════════════════════════════════════════
// CADASTRO MODAL
// ═══════════════════════════════════════════
function openCadastroModal(){ document.getElementById('cadastroModal').classList.add('open'); }
function closeCadastroModal(){ document.getElementById('cadastroModal').classList.remove('open'); }

// ═══════════════════════════════════════════
// EXPAND STATE (in-memory, not persisted)
// ═══════════════════════════════════════════
var expandedMachines = {};
function toggleMachineExpand(serial) {
  expandedMachines[serial] = !expandedMachines[serial];
  renderMachines();
}

// ═══════════════════════════════════════════
// STATUS FILTER (CHIPS)
// ═══════════════════════════════════════════
var currentStatusFilter = '';
function goInicio(){setPage('inicio');showDayResume('today');}
function setStatusFilter(status) {
  currentStatusFilter = status;
  document.querySelectorAll('.chip').forEach(function(c){
    c.classList.remove('active');
    var txt = c.textContent.trim();
    if(status==='' && txt==='Todas') c.classList.add('active');
    else if(status && txt.toLowerCase().indexOf(status.toLowerCase().substring(0,5))>-1) c.classList.add('active');
  });
  renderMachines();
}
function setStatusFilter2(status) {
  currentStatusFilter = status;
  document.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('active'); });
  document.querySelectorAll('.chip').forEach(function(c){ if(c.textContent.trim().indexOf(status)>-1||( status==='' && c.textContent.trim()==='Todas')) c.classList.add('active'); });
  renderMachines();
}

// ═══════════════════════════════════════════
// RENDER MACHINES (separado do render geral)
// ═══════════════════════════════════════════
function renderMachines() {
  updateDashboard(); renderDayAlerts();
  var selEv = document.getElementById('eventFilter').value;
  refreshEventFilter(selEv);
  var search = document.getElementById('searchInput').value.toLowerCase();
  var brand  = document.getElementById('brandFilter').value;
  var status = currentStatusFilter;
  var evFilt = document.getElementById('eventFilter').value;
  var filtered = machines.filter(function(m){
    var rs = getRealStatus(m);
    return m.serial.toLowerCase().indexOf(search)>-1 && (!brand||m.brand===brand) && (!status||rs===status) && (!evFilt||machineIsInEvent(m,evFilt));
  });
  var rc = document.getElementById('resultsCount');
  if(search||brand||status||evFilt){ rc.style.display='block'; rc.textContent=filtered.length+' maquina'+(filtered.length!==1?'s':'')+' encontrada'+(filtered.length!==1?'s':'')+(evFilt?' - Evento: '+evFilt:'')+(brand?' - '+brand:'')+(status?' - '+status:''); }
  else rc.style.display='none';
  var list = document.getElementById('machineList'); list.innerHTML='';
  if(!filtered.length){ list.innerHTML="<p style='color:#9ca3af'>Nenhuma maquina encontrada.</p>"; return; }
  filtered.forEach(function(m){
    var rs=getRealStatus(m),nextRes=getNextReservation(m),today=getToday();
    var resHoje=rs==='Reservada hoje'?m.reservations.find(function(r){return hasDateOverlap(r.startDate,r.endDate,today,today);}):null;
    var lastSaida=null; if(rs==='Em uso'||rs==='Em atraso'){for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){lastSaida=m.history[i];break;}}}
    var infoHtml='';
    if(rs==='Disponivel') infoHtml=nextRes?'<p><b>Proxima reserva:</b> '+nextRes.event+' - '+formatDate(nextRes.startDate)+' ate '+formatDate(nextRes.endDate)+'</p>'+(nextRes.address?'<p><b>Endereco:</b> '+nextRes.address+'</p>':''):'<p style="color:#9ca3af">Sem reservas futuras</p>';
    if(rs==='Reservada hoje'&&resHoje) infoHtml='<p><b>Evento:</b> '+resHoje.event+'</p><p><b>Periodo:</b> '+formatDate(resHoje.startDate)+' ate '+formatDate(resHoje.endDate)+'</p>'+(resHoje.city?'<p><b>Cidade:</b> '+resHoje.city+'</p>':'')+(resHoje.address?'<p><b>Endereco:</b> '+resHoje.address+'</p>':'')+'<div class="alert-reservada">Sai hoje - clique em Confirmar saida</div>';
    if((rs==='Em uso'||rs==='Em atraso')&&lastSaida) infoHtml='<p><b>Evento:</b> '+(lastSaida.event||'-')+'</p>'+(lastSaida.city?'<p><b>Cidade:</b> '+lastSaida.city+'</p>':'')+(lastSaida.address?'<p><b>Endereco:</b> '+lastSaida.address+'</p>':'')+'<p><b>Retorno previsto:</b> '+formatDate(lastSaida.endDate)+'</p>'+(rs==='Em atraso'?'<div class="alert-atraso-card">ATRASO de '+daysDiff(lastSaida.endDate)+' dia'+(daysDiff(lastSaida.endDate)>1?'s':'')+'!</div>':'');
    if(rs==='Manutencao'){var lM=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='manutencao'){lM=m.history[i];break;}}infoHtml=lM&&lM.observation?'<p><b>Motivo:</b> '+lM.observation+'</p>':'';}
    var acoesHtml='';
    if(rs==='Disponivel') acoesHtml='<div class="actions-row"><button onclick="openExitModal(\''+m.serial+'\')">Saida</button><button onclick="openReserveModal(\''+m.serial+'\')">Reservar</button><button class="btn-secundario" onclick="openViewReservesModal(\''+m.serial+'\')">Ver reservas</button><button class="btn-secundario" onclick="toggleHistory(\''+m.serial+'\')">'+(m.showHistory?'Ocultar':'Historico')+'</button><button class="btn-gray" onclick="sendToMaintenance(\''+m.serial+'\')">Manutencao</button><button class="btn-danger" onclick="deleteMachine(\''+m.serial+'\')">Excluir</button></div>';
    if(rs==='Reservada hoje') acoesHtml='<div class="actions-row"><button class="btn-confirmar-saida" onclick="confirmarSaidaDaReserva(\''+m.serial+'\')">Confirmar saida</button><button class="btn-secundario" onclick="openViewReservesModal(\''+m.serial+'\')">Ver reservas</button><button class="btn-secundario" onclick="toggleHistory(\''+m.serial+'\')">'+(m.showHistory?'Ocultar':'Historico')+'</button></div>';
    if(rs==='Em uso'||rs==='Em atraso') acoesHtml='<div class="actions-row"><button class="btn-entrada" onclick="registerEntry(\''+m.serial+'\')">📥 Registrar entrada</button><button class="btn-secundario" onclick="toggleHistory(\''+m.serial+'\')">'+(m.showHistory?'Ocultar':'Historico')+'</button></div>';
    if(rs==='Manutencao') acoesHtml='<div class="actions-row"><button style="background:var(--green)" onclick="returnFromMaintenance(\''+m.serial+'\')">Liberar</button><button class="btn-secundario" onclick="toggleHistory(\''+m.serial+'\')">'+(m.showHistory?'Ocultar':'Historico')+'</button><button class="btn-danger" onclick="deleteMachine(\''+m.serial+'\')">Excluir</button></div>';
    var historyHtml=m.showHistory?'<div class="history-box">'+(m.history.length===0?'<p>Sem historico.</p>':m.history.slice().reverse().map(function(h){return'<div class="history-item"><b>'+h.type.toUpperCase()+(h.batch?' EM LOTE':'')+'</b>'+(h.event?'<br>Evento: '+h.event:'')+(h.city?'<br>Cidade: '+h.city:'')+(h.address?'<br>Endereco: '+h.address:'')+(h.startDate?'<br>'+formatDate(h.startDate)+' ate '+formatDate(h.endDate):'')+(h.observation?'<br>Obs: '+h.observation:'')+'<br><small style="color:#9ca3af">'+formatDateTime(h.date)+'</small>'+(h.user?'<br><span class="history-user">'+h.user+'</span>':'')+'</div>';}).join(''))+'</div>':'';
    var isExpanded=!!expandedMachines[m.serial];
    var div=document.createElement('div'); div.className='machine-item'+(isExpanded?' expanded':'');
    div.innerHTML=
      '<div class="machine-compact-row" onclick="toggleMachineExpand(\''+m.serial+'\')">'+
        '<div><div class="machine-serial">'+m.serial+'</div><div class="machine-brand">'+m.brand+'</div></div>'+
        '<span class="status '+getStatusClass(rs)+'">'+rs+'</span>'+
        '<button class="machine-expand-btn" onclick="event.stopPropagation();toggleMachineExpand(\''+m.serial+'\')">▼</button>'+
      '</div>'+
      '<div class="machine-detail">'+
        '<div class="machine-info">'+infoHtml+'</div>'+
        '<div class="actions">'+acoesHtml+'</div>'+
        historyHtml+
      '</div>';
    list.appendChild(div);
  });
}

// Override render to use renderMachines + update dashboard
function render(){ updateDashboard(); renderDayAlerts(); if(currentPage==='maquinas') renderMachines(); }

// Search input live filter
document.getElementById('searchInput').addEventListener('input', renderMachines);
document.getElementById('brandFilter').addEventListener('change', renderMachines);
document.getElementById('eventFilter').addEventListener('change', renderMachines);


