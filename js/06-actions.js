
// ═══════════════════════════════════════════
// MODO SELECAO
// ═══════════════════════════════════════════
var reserveMode='quantidade',exitMode='auto',reserveSelected=new Set(),exitSelected=new Set();
function setReserveMode(mode){
  reserveMode=mode;
  document.getElementById('reserveAutoBtn').className=mode==='auto'?'mode-btn mode-btn-active':'mode-btn';
  document.getElementById('reserveManualBtn').className=mode==='manual'?'mode-btn mode-btn-active':'mode-btn';
  document.getElementById('reserveQtyBtn').className=mode==='quantidade'?'mode-btn mode-btn-active':'mode-btn';
  document.getElementById('reserveAutoSection').style.display=mode==='auto'?'block':'none';
  document.getElementById('reserveManualSection').style.display=mode==='manual'?'block':'none';
  document.getElementById('reserveQtySection').style.display=mode==='quantidade'?'block':'none';
  if(mode==='manual') refreshReserveMachineList();
  if(mode==='quantidade') atualizarQtyDisponivel();
}
function setExitMode(mode){exitMode=mode;document.getElementById('exitAutoBtn').className=mode==='auto'?'mode-btn mode-btn-active':'mode-btn';document.getElementById('exitManualBtn').className=mode==='manual'?'mode-btn mode-btn-active':'mode-btn';document.getElementById('exitAutoSection').style.display=mode==='auto'?'block':'none';document.getElementById('exitManualSection').style.display=mode==='manual'?'block':'none';if(mode==='manual')refreshExitMachineList();}

function getEligibleForReserve(){var brands=getSelectedBrands('batchBrands'),s=document.getElementById('batchStartDate').value,e=document.getElementById('batchEndDate').value;return machines.filter(function(m){var rs=getRealStatus(m);return brands.indexOf(m.brand)>-1&&rs!=='Em uso'&&rs!=='Em atraso'&&rs!=='Manutencao'&&(!s||!e||!hasReservationConflict(m,s,e));}).sort(function(a,b){return(a.reservations.length-b.reservations.length)||(a.history.length-b.history.length);});}
function getEligibleForExit(){var brands=getSelectedBrands('batchExitBrands'),s=document.getElementById('batchExitStartDate').value,e=document.getElementById('batchExitEndDate').value;return machines.filter(function(m){var rs=getRealStatus(m);return brands.indexOf(m.brand)>-1&&rs!=='Em uso'&&rs!=='Em atraso'&&rs!=='Manutencao'&&(!s||!e||!hasReservationConflict(m,s,e));}).sort(function(a,b){return(a.history.length-b.history.length)||(a.reservations.length-b.reservations.length);});}

function buildSelectItem(serial, brand, usos, selectedSet, toggleFn) {
  return '<label class="machine-select-item'+(selectedSet.has(serial)?' selected':'')+'" onclick="'+toggleFn+'(\''+serial+'\')"><input type="checkbox"'+(selectedSet.has(serial)?' checked':'')+' onclick="event.stopPropagation();'+toggleFn+'(\''+serial+'\')" /><div style="flex:1"><b>'+serial+'</b> <span style="color:#6b7280;font-size:13px">- '+brand+'</span></div><span style="font-size:12px;color:#6b7280">'+usos+' uso(s)</span></label>';
}
function refreshReserveMachineList(){var el=getEligibleForReserve(),list=document.getElementById('reserveMachineList');if(!el.length){list.innerHTML='<p style="padding:12px;font-size:13px;color:#9ca3af">Nenhuma maquina disponivel para as marcas selecionadas.</p>';return;}list.innerHTML=el.map(function(m){return buildSelectItem(m.serial,m.brand,m.history.filter(function(h){return h.type==='saida';}).length,reserveSelected,'toggleReserveSel');}).join('');document.getElementById('reserveSelCount').textContent=reserveSelected.size+' selecionadas';}
function toggleReserveSel(s){if(reserveSelected.has(s))reserveSelected.delete(s);else reserveSelected.add(s);refreshReserveMachineList();}
function toggleAllReserve(){var el=getEligibleForReserve();if(reserveSelected.size===el.length)reserveSelected.clear();else el.forEach(function(m){reserveSelected.add(m.serial);});refreshReserveMachineList();}

function refreshExitMachineList(){var el=getEligibleForExit(),list=document.getElementById('exitMachineList');if(!el.length){list.innerHTML='<p style="padding:12px;font-size:13px;color:#9ca3af">Nenhuma maquina disponivel para as marcas selecionadas.</p>';return;}list.innerHTML=el.map(function(m){return buildSelectItem(m.serial,m.brand,m.history.filter(function(h){return h.type==='saida';}).length,exitSelected,'toggleExitSel');}).join('');document.getElementById('exitSelCount').textContent=exitSelected.size+' selecionadas';}
function toggleExitSel(s){if(exitSelected.has(s))exitSelected.delete(s);else exitSelected.add(s);refreshExitMachineList();}
function toggleAllExit(){var el=getEligibleForExit();if(exitSelected.size===el.length)exitSelected.clear();else el.forEach(function(m){exitSelected.add(m.serial);});refreshExitMachineList();}

['batchStartDate','batchEndDate'].forEach(function(id){document.getElementById(id).addEventListener('change',function(){if(reserveMode==='manual')refreshReserveMachineList();});});
['batchExitStartDate','batchExitEndDate'].forEach(function(id){document.getElementById(id).addEventListener('change',function(){if(exitMode==='manual')refreshExitMachineList();});});

// ═══════════════════════════════════════════
// RESERVA EM LOTE
// ═══════════════════════════════════════════
function submitReservaLote(e){
  e.preventDefault();
  var eventName=document.getElementById('batchEvent').value.trim(),city=document.getElementById('batchCity').value.trim(),responsible=document.getElementById('batchResponsible').value.trim(),address=document.getElementById('batchAddress').value.trim();
  var brands=getSelectedBrands('batchBrands'),startDate=document.getElementById('batchStartDate').value,endDate=document.getElementById('batchEndDate').value;
  var result=document.getElementById('batchReserveResult');
  if(!eventName||!city||!responsible||!startDate||!endDate){alert('Preencha todos os dados.');return;}
  if(!brands.length){alert('Selecione ao menos uma marca.');return;}
  if(endDate<startDate){alert('Data final nao pode ser menor.');return;}
  var un=getCurrentUserName(),ue=getCurrentUserEmail();

  // ── MODO QUANTIDADE (Reserva de Intencao) ──
  if(reserveMode==='quantidade'){
    var qty=Number(document.getElementById('batchQtyIntencao').value);
    if(!qty||qty<=0){alert('Informe a quantidade.');return;}
    var id='int_'+Date.now();
    var marcas=brands;
    var intencao={id:id,evento:eventName,cidade:city,responsavel:responsible,endereco:address,marcas:marcas,marca:marcas[0],quantidade:qty,startDate:startDate,endDate:endDate,status:'pendente',criadoEm:new Date().toISOString(),criadoPor:un,criadoPorEmail:ue};
    reservasIntencao.push(intencao);
    saveReservasIntencao();
    result.className='batch-result show';
    result.innerHTML='<span class="batch-total">Reserva de intencao criada!</span><b>'+eventName+'</b> - '+qty+'x '+marcas.join('/')+'<br>'+formatDate(startDate)+' ate '+formatDate(endDate)+'<br><small style="color:#6b7280">Os seriais sao escolhidos na hora da saida.</small>';
    document.getElementById('batchQtyIntencao').value='';
    atualizarQtyDisponivel();
    return;
  }

  // ── MODOS AUTO E MANUAL ──
  var selected=[];
  if(reserveMode==='auto'){var qty=Number(document.getElementById('batchQuantity').value);if(!qty||qty<=0){alert('Informe a quantidade.');return;}var el=getEligibleForReserve();if(el.length<qty){result.className='batch-result show error';result.innerHTML='<b>Reserva nao realizada.</b><br>Pedido: '+qty+' - Disponiveis: '+el.length;return;}selected=el.slice(0,qty);}
  else{if(!reserveSelected.size){alert('Selecione ao menos uma maquina.');return;}selected=machines.filter(function(m){return reserveSelected.has(m.serial);});}
  selected.forEach(function(m){m.reservations.push({event:eventName,city:city,responsible:responsible,address:address,startDate:startDate,endDate:endDate,createdAt:new Date().toISOString(),batch:true,createdBy:un,createdByEmail:ue});m.history.push({type:'reserva',event:eventName,city:city,responsible:responsible,address:address,startDate:startDate,endDate:endDate,date:new Date().toISOString(),batch:true,user:un,userEmail:ue});});
  result.className='batch-result show';result.innerHTML='<span class="batch-total">'+selected.length+' maquina'+(selected.length>1?'s':'')+' reservada'+(selected.length>1?'s':'')+'!</span><b>Evento: '+eventName+'</b><br>'+formatDate(startDate)+' ate '+formatDate(endDate)+'<br>'+selected.map(function(m){return m.serial;}).join(', ');
  document.querySelectorAll('input[name="batchBrands"]').forEach(function(i){i.checked=true;});reserveSelected.clear();save();
}

// ═══════════════════════════════════════════
// SAIDA EM LOTE
// ═══════════════════════════════════════════
function submitSaidaLote(e){
  e.preventDefault();
  var eventName=document.getElementById('batchExitEvent').value.trim(),city=document.getElementById('batchExitCity').value.trim(),responsible=document.getElementById('batchExitResponsible').value.trim(),address=document.getElementById('batchExitAddress').value.trim();
  var brands=getSelectedBrands('batchExitBrands'),startDate=document.getElementById('batchExitStartDate').value,endDate=document.getElementById('batchExitEndDate').value;
  var result=document.getElementById('batchExitResult');
  if(!eventName||!city||!responsible||!startDate||!endDate){alert('Preencha todos os dados.');return;}
  if(!brands.length){alert('Selecione ao menos uma marca.');return;}
  if(endDate<startDate){alert('Data de retorno nao pode ser menor.');return;}
  var un=getCurrentUserName(),ue=getCurrentUserEmail(),selected=[];
  if(exitMode==='auto'){var qty=Number(document.getElementById('batchExitQuantity').value);if(!qty||qty<=0){alert('Informe a quantidade.');return;}var el=getEligibleForExit();if(el.length<qty){result.className='batch-result show error';result.innerHTML='<b>Saida nao realizada.</b><br>Pedido: '+qty+' - Disponiveis: '+el.length;return;}selected=el.slice(0,qty);}
  else{if(!exitSelected.size){alert('Selecione ao menos uma maquina.');return;}selected=machines.filter(function(m){return exitSelected.has(m.serial);});}
  selected.forEach(function(m){m.status='Em uso';m.history.push({type:'saida',event:eventName,city:city,responsible:responsible,address:address,startDate:startDate,endDate:endDate,date:new Date().toISOString(),batch:true,user:un,userEmail:ue});});
  result.className='batch-result show';result.innerHTML='<span class="batch-total">'+selected.length+' maquina'+(selected.length>1?'s':'')+' saiu'+(selected.length>1?'ram':'')+'!</span><b>Evento: '+eventName+'</b><br>'+formatDate(startDate)+' ate '+formatDate(endDate)+'<br>'+selected.map(function(m){return m.serial;}).join(', ');
  document.querySelectorAll('input[name="batchExitBrands"]').forEach(function(i){i.checked=true;});exitSelected.clear();save();
}

// ═══════════════════════════════════════════
// ENTRADA EM LOTE
// ═══════════════════════════════════════════
var entradaSelected=new Set();
function refreshEntradaEventos(){var sel=document.getElementById('entradaEventoSelect'),eventos=new Set();machines.forEach(function(m){var rs=getRealStatus(m);if(rs!=='Em uso'&&rs!=='Em atraso')return;var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}if(last&&last.event)eventos.add(last.event);});sel.innerHTML='<option value="">Selecione o evento</option>'+Array.from(eventos).map(function(ev){return'<option value="'+ev+'">'+ev+'</option>';}).join('');document.getElementById('entradaMachineBox').style.display='none';entradaSelected.clear();}
function refreshEntradaList(){var ev=document.getElementById('entradaEventoSelect').value,box=document.getElementById('entradaMachineBox');if(!ev){box.style.display='none';return;}box.style.display='block';var maquinas=machines.filter(function(m){var rs=getRealStatus(m);if(rs!=='Em uso'&&rs!=='Em atraso')return false;var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}return last&&last.event===ev;});var list=document.getElementById('entradaMachineList');if(!maquinas.length){list.innerHTML='<p style="padding:12px;font-size:13px;color:#9ca3af">Nenhuma maquina.</p>';return;}list.innerHTML=maquinas.map(function(m){var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}var isAtraso=getRealStatus(m)==='Em atraso';return'<label class="machine-select-item'+(entradaSelected.has(m.serial)?' selected':'')+'" onclick="toggleEntradaSel(\''+m.serial+'\')"><input type="checkbox"'+(entradaSelected.has(m.serial)?' checked':'')+' onclick="event.stopPropagation();toggleEntradaSel(\''+m.serial+'\')" /><div style="flex:1"><b>'+m.serial+'</b> <span style="color:#6b7280;font-size:13px">- '+m.brand+'</span></div><span style="font-size:12px;color:'+(isAtraso?'#9d174d':'#6b7280')+'">'+( isAtraso?'ATRASO: ':'Retorno: ')+formatDate(last?last.endDate:'')+'</span></label>';}).join('');document.getElementById('entradaSelCount').textContent=entradaSelected.size+' selecionadas';}
function toggleEntradaSel(s){if(entradaSelected.has(s))entradaSelected.delete(s);else entradaSelected.add(s);refreshEntradaList();}
function toggleAllEntrada(){var ev=document.getElementById('entradaEventoSelect').value,mqs=machines.filter(function(m){var rs=getRealStatus(m);if(rs!=='Em uso'&&rs!=='Em atraso')return false;var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}return last&&last.event===ev;});if(entradaSelected.size===mqs.length)entradaSelected.clear();else mqs.forEach(function(m){entradaSelected.add(m.serial);});refreshEntradaList();}
function confirmarEntradaEmLote(){if(!entradaSelected.size){alert('Selecione ao menos uma maquina.');return;}var obs=document.getElementById('entradaObservacao').value.trim(),result=document.getElementById('entradaResult');if(!confirm('Confirmar entrada de '+entradaSelected.size+' maquina(s)?'))return;var un=getCurrentUserName(),ue=getCurrentUserEmail(),selected=machines.filter(function(m){return entradaSelected.has(m.serial);});selected.forEach(function(m){m.status='Disponivel';m.history.push({type:'entrada',observation:obs||'',date:new Date().toISOString(),user:un,userEmail:ue});});result.className='batch-result show';result.innerHTML='<span class="batch-total">'+selected.length+' maquina'+(selected.length>1?'s':'')+' deu'+(selected.length>1?'ram':'')+' entrada!</span>'+selected.map(function(m){return m.serial;}).join(', ');entradaSelected.clear();document.getElementById('entradaObservacao').value='';refreshEntradaEventos();save();}

// ═══════════════════════════════════════════
// RENOVAR
// ═══════════════════════════════════════════
var renovarSelected=new Set();
function refreshRenovarEventos(){var sel=document.getElementById('renovarEventoSelect'),eventos=new Set();machines.forEach(function(m){var rs=getRealStatus(m);if(rs!=='Em uso'&&rs!=='Em atraso')return;var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}if(last&&last.event)eventos.add(last.event);});sel.innerHTML='<option value="">Selecione o evento</option>'+Array.from(eventos).map(function(ev){return'<option value="'+ev+'">'+ev+'</option>';}).join('');document.getElementById('renovarMachineBox').style.display='none';renovarSelected.clear();}
function refreshRenovarList(){var ev=document.getElementById('renovarEventoSelect').value,box=document.getElementById('renovarMachineBox');if(!ev){box.style.display='none';return;}box.style.display='block';var mqs=machines.filter(function(m){var rs=getRealStatus(m);if(rs!=='Em uso'&&rs!=='Em atraso')return false;var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}return last&&last.event===ev;});var list=document.getElementById('renovarMachineList');if(!mqs.length){list.innerHTML='<p style="padding:12px;font-size:13px;color:#9ca3af">Nenhuma maquina.</p>';return;}list.innerHTML=mqs.map(function(m){var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}var isAtraso=getRealStatus(m)==='Em atraso';return'<label class="machine-select-item'+(renovarSelected.has(m.serial)?' selected':'')+'" onclick="toggleRenovarSel(\''+m.serial+'\')"><input type="checkbox"'+(renovarSelected.has(m.serial)?' checked':'')+' onclick="event.stopPropagation();toggleRenovarSel(\''+m.serial+'\')" /><div style="flex:1"><b>'+m.serial+'</b> <span style="color:#6b7280;font-size:13px">- '+m.brand+'</span></div><span style="font-size:12px;color:'+(isAtraso?'#9d174d':'#6b7280')+'">Vence: '+formatDate(last?last.endDate:'')+'</span></label>';}).join('');document.getElementById('renovarSelCount').textContent=renovarSelected.size+' selecionadas';}
function toggleRenovarSel(s){if(renovarSelected.has(s))renovarSelected.delete(s);else renovarSelected.add(s);refreshRenovarList();}
function toggleAllRenovar(){var ev=document.getElementById('renovarEventoSelect').value,mqs=machines.filter(function(m){var rs=getRealStatus(m);if(rs!=='Em uso'&&rs!=='Em atraso')return false;var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}return last&&last.event===ev;});if(renovarSelected.size===mqs.length)renovarSelected.clear();else mqs.forEach(function(m){renovarSelected.add(m.serial);});refreshRenovarList();}
function confirmarRenovacao(){if(!renovarSelected.size){alert('Selecione ao menos uma maquina.');return;}var novaData=document.getElementById('novaDataRetorno').value,result=document.getElementById('renovarResult');if(!novaData){alert('Informe a nova data de retorno.');return;}if(!confirm('Renovar prazo de '+renovarSelected.size+' maquina(s) ate '+formatDate(novaData)+'?'))return;var un=getCurrentUserName(),ue=getCurrentUserEmail(),selected=machines.filter(function(m){return renovarSelected.has(m.serial);});selected.forEach(function(m){for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){m.history[i].endDate=novaData;break;}}m.history.push({type:'renovacao de prazo',endDate:novaData,date:new Date().toISOString(),user:un,userEmail:ue});});result.className='batch-result show';result.innerHTML='<span class="batch-total">'+selected.length+' maquina'+(selected.length>1?'s':'')+' renovada'+(selected.length>1?'s':'')+'!</span>Nova data: '+formatDate(novaData)+'<br>'+selected.map(function(m){return m.serial;}).join(', ');renovarSelected.clear();document.getElementById('novaDataRetorno').value='';refreshRenovarEventos();save();}

// ═══════════════════════════════════════════
// CANCELAR EM LOTE
// ═══════════════════════════════════════════
var cancelarSelected=new Set();
function refreshCancelarEventos(){var sel=document.getElementById('cancelarEventoSelect'),eventos=new Set();machines.forEach(function(m){m.reservations.forEach(function(r){if(r.event)eventos.add(r.event);});});sel.innerHTML='<option value="">Selecione o evento</option>'+Array.from(eventos).map(function(ev){return'<option value="'+ev+'">'+ev+'</option>';}).join('');document.getElementById('cancelarMachineBox').style.display='none';cancelarSelected.clear();}
function refreshCancelarList(){var ev=document.getElementById('cancelarEventoSelect').value,box=document.getElementById('cancelarMachineBox');if(!ev){box.style.display='none';return;}box.style.display='block';var items=[];machines.forEach(function(m){m.reservations.forEach(function(r){if(r.event===ev)items.push({machine:m,reservation:r});});});var list=document.getElementById('cancelarMachineList');if(!items.length){list.innerHTML='<p style="padding:12px;font-size:13px;color:#9ca3af">Nenhuma reserva.</p>';return;}list.innerHTML=items.map(function(item){var m=item.machine,r=item.reservation;return'<label class="machine-select-item'+(cancelarSelected.has(m.serial)?' selected':'')+'" onclick="toggleCancelarSel(\''+m.serial+'\')"><input type="checkbox"'+(cancelarSelected.has(m.serial)?' checked':'')+' onclick="event.stopPropagation();toggleCancelarSel(\''+m.serial+'\')" /><div style="flex:1"><b>'+m.serial+'</b> <span style="color:#6b7280;font-size:13px">- '+m.brand+'</span></div><span style="font-size:12px;color:#6b7280">'+formatDate(r.startDate)+' ate '+formatDate(r.endDate)+'</span></label>';}).join('');document.getElementById('cancelarSelCount').textContent=cancelarSelected.size+' selecionadas';}
function toggleCancelarSel(s){if(cancelarSelected.has(s))cancelarSelected.delete(s);else cancelarSelected.add(s);refreshCancelarList();}
function toggleAllCancelar(){var ev=document.getElementById('cancelarEventoSelect').value,seriais=machines.filter(function(m){return m.reservations.some(function(r){return r.event===ev;});}).map(function(m){return m.serial;});if(cancelarSelected.size===seriais.length)cancelarSelected.clear();else seriais.forEach(function(s){cancelarSelected.add(s);});refreshCancelarList();}
function confirmarCancelamentoLote(){if(!cancelarSelected.size){alert('Selecione ao menos uma maquina.');return;}var ev=document.getElementById('cancelarEventoSelect').value,result=document.getElementById('cancelarResult');if(!confirm('Cancelar reservas de '+cancelarSelected.size+' maquina(s) para "'+ev+'"?'))return;var un=getCurrentUserName(),ue=getCurrentUserEmail(),serials=Array.from(cancelarSelected);serials.forEach(function(serial){var m=machines.find(function(m){return m.serial===serial;});if(!m)return;var idx=m.reservations.findIndex(function(r){return r.event===ev;});if(idx===-1)return;var res=m.reservations[idx];m.history.push({type:'cancelamento de reserva',event:res.event,startDate:res.startDate,endDate:res.endDate,date:new Date().toISOString(),user:un,userEmail:ue});m.reservations.splice(idx,1);});result.className='batch-result show';result.innerHTML='<span class="batch-total">'+serials.length+' reserva'+(serials.length>1?'s':'')+' cancelada'+(serials.length>1?'s':'')+'!</span>Evento: '+ev+'<br>'+serials.join(', ');cancelarSelected.clear();refreshCancelarEventos();save();}

// ═══════════════════════════════════════════
// MANUTENCAO EM LOTE
// ═══════════════════════════════════════════
var manutSelected=new Set();
function refreshManutList(){var brands=getSelectedBrands('manutBrands'),mqs=machines.filter(function(m){return brands.indexOf(m.brand)>-1&&getRealStatus(m)==='Disponivel';});var list=document.getElementById('manutMachineList');if(!mqs.length){list.innerHTML='<p style="padding:12px;font-size:13px;color:#9ca3af">Nenhuma maquina disponivel.</p>';return;}list.innerHTML=mqs.map(function(m){return buildSelectItem(m.serial,m.brand,m.history.filter(function(h){return h.type==='saida';}).length,manutSelected,'toggleManutSel');}).join('');document.getElementById('manutSelCount').textContent=manutSelected.size+' selecionadas';}
function toggleManutSel(s){if(manutSelected.has(s))manutSelected.delete(s);else manutSelected.add(s);refreshManutList();}
function toggleAllManut(){var brands=getSelectedBrands('manutBrands'),mqs=machines.filter(function(m){return brands.indexOf(m.brand)>-1&&getRealStatus(m)==='Disponivel';});if(manutSelected.size===mqs.length)manutSelected.clear();else mqs.forEach(function(m){manutSelected.add(m.serial);});refreshManutList();}
function confirmarManutencaoLote(){if(!manutSelected.size){alert('Selecione ao menos uma maquina.');return;}var motivo=document.getElementById('manutMotivo').value.trim(),result=document.getElementById('manutResult');if(!confirm('Enviar '+manutSelected.size+' maquina(s) para manutencao?'))return;var un=getCurrentUserName(),ue=getCurrentUserEmail(),selected=machines.filter(function(m){return manutSelected.has(m.serial);});selected.forEach(function(m){m.status='Manutencao';m.history.push({type:'manutencao',observation:motivo||'',date:new Date().toISOString(),user:un,userEmail:ue,batch:true});});result.className='batch-result show';result.innerHTML='<span class="batch-total">'+selected.length+' maquina'+(selected.length>1?'s':'')+' em manutencao!</span>'+selected.map(function(m){return m.serial;}).join(', ');manutSelected.clear();document.getElementById('manutMotivo').value='';refreshManutList();save();}


// ═══════════════════════════════════════════
// RESERVAS DE INTENCAO
// ═══════════════════════════════════════════
var reservasIntencao = [];

function startReservasIntencaoListener() {
  db.ref('reservasIntencao').on('value', function(snap) {
    var d = snap.val();
    reservasIntencao = d ? Object.values(d) : [];
    if(currentPage==='inicio'||currentPage==='acoes') renderReservasIntencao();
    updateDashboard();
  });
}

function saveReservasIntencao() {
  var obj = {};
  reservasIntencao.forEach(function(r){ obj[r.id] = r; });
  db.ref('reservasIntencao').set(obj);
}

function getIntencoesPendentesNoPeriodo(brand, startDate, endDate) {
  return reservasIntencao.filter(function(r){
    var marcas = r.marcas || (r.marca ? [r.marca] : []);
    return r.status==='pendente' && marcas.indexOf(brand)>-1 && hasDateOverlap(r.startDate, r.endDate, startDate, endDate);
  }).reduce(function(sum,r){ return sum+(r.quantidade||0); }, 0);
}

function getDisponiveisPorMarca(brand, startDate, endDate) {
  var total = machines.filter(function(m){
    var s = getRealStatus(m);
    return m.brand===brand && s!=='Manutencao' && s!=='Em uso';
  }).length;
  var comprometidas = getIntencoesPendentesNoPeriodo(brand, startDate, endDate);
  return Math.max(0, total - comprometidas);
}

function atualizarQtyDisponivel() {
  var el = document.getElementById('batchQtyDisponivel');
  if(!el) return;
  var s = document.getElementById('batchStartDate').value;
  var e = document.getElementById('batchEndDate').value;
  var brands = getSelectedBrands('batchBrands');
  if(!brands.length||!s||!e) { el.innerHTML=''; return; }
  var linhas = brands.map(function(b){
    var d = getDisponiveisPorMarca(b, s, e);
    return '<b style="color:'+(d>0?'#166534':'#991b1b')+'">'+b+': '+d+' disponivel'+(d!==1?'is':'')+'</b>';
  });
  el.innerHTML = 'Disponibilidade: '+linhas.join(' &nbsp;|&nbsp; ');
}

// ── RENDER LISTA DE INTENCOES ──
function renderReservasIntencao() {
  var list = document.getElementById('intencoesList');
  if(!list) return;
  var filtroData   = (document.getElementById('intencaoFiltroData')||{}).value || 'todas';
  var filtroStatus = (document.getElementById('intencaoFiltroStatus')||{}).value || 'todas';
  var hoje = getToday();

  var filtered = reservasIntencao.filter(function(r){
    if(filtroStatus!=='todas' && r.status!==filtroStatus) return false;
    if(filtroData==='hoje'  && r.startDate!==hoje) return false;
    if(filtroData==='3dias' ){ var lim=new Date(); lim.setDate(lim.getDate()+3); if(r.startDate<hoje||r.startDate>lim.toISOString().slice(0,10)) return false; }
    if(filtroData==='7dias' ){ var lim=new Date(); lim.setDate(lim.getDate()+7); if(r.startDate<hoje||r.startDate>lim.toISOString().slice(0,10)) return false; }
    if(filtroData==='15dias'){ var lim=new Date(); lim.setDate(lim.getDate()+15);if(r.startDate<hoje||r.startDate>lim.toISOString().slice(0,10)) return false; }
    if(filtroData==='personalizado'){
      var di=(document.getElementById('intencaoFiltroDataInicio')||{}).value;
      var df=(document.getElementById('intencaoFiltroDataFim')||{}).value;
      if(di&&df&&(r.startDate<di||r.startDate>df)) return false;
    }
    return true;
  });

  filtered.sort(function(a,b){ return a.startDate.localeCompare(b.startDate); });

  if(!filtered.length) {
    list.innerHTML='<p style="color:#9ca3af;font-size:13px;padding:10px 0">Nenhuma reserva de intencao encontrada.</p>';
    return;
  }

  list.innerHTML = filtered.map(function(r){
    var marcasLabel = (r.marcas||[r.marca||'']).join('/');
    var statusColor = r.status==='pendente'?'#92400e':r.status==='concluida'?'#166534':'#991b1b';
    var statusBg    = r.status==='pendente'?'#fef3c7':r.status==='concluida'?'#dcfce7':'#fee2e2';
    var dispAtual   = r.status==='pendente' ? (function(){
      var marcas = r.marcas||(r.marca?[r.marca]:[]);
      return marcas.map(function(b){ return b+': '+getDisponiveisPorMarca(b,r.startDate,r.endDate); }).join(' / ');
    })() : null;
    var atrasada = r.status==='pendente' && r.startDate < hoje;
    return '<div style="background:#fff;border-radius:12px;padding:13px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-left:4px solid '+(atrasada?'#dc2626':r.status==='concluida'?'#16a34a':'#f59e0b')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">'+
        '<div>'+
          '<b style="font-size:14px">'+r.evento+'</b>'+
          '<div style="font-size:12px;color:#6b7280;margin-top:2px">'+r.quantidade+'x '+marcasLabel+' &nbsp;•&nbsp; '+formatDate(r.startDate)+' – '+formatDate(r.endDate)+'</div>'+
          (r.cidade?'<div style="font-size:12px;color:#6b7280">'+r.cidade+(r.responsavel?' — '+r.responsavel:'')+'</div>':'')+
          (r.endereco?'<div style="font-size:12px;color:#6b7280">📍 '+r.endereco+'</div>':'')+
        '</div>'+
        '<span style="background:'+statusBg+';color:'+statusColor+';font-size:11px;font-weight:bold;padding:3px 10px;border-radius:999px;white-space:nowrap">'+r.status+'</span>'+
      '</div>'+
      (dispAtual?'<div style="font-size:12px;color:#374151;margin-top:6px">Disponivel: '+dispAtual+'</div>':'')+
      (atrasada?'<div style="font-size:12px;color:#dc2626;font-weight:bold;margin-top:4px">⚠️ Data de saida passou!</div>':'')+
      (r.status==='pendente'?
        '<div style="display:flex;gap:8px;margin-top:10px">'+
          '<button onclick="abrirSaidaIntencao(\''+r.id+'\')" style="background:#dcfce7;color:#166534;border:1px solid #86efac;font-size:11px;padding:5px 9px;width:auto;font-weight:bold">Dar saida</button>'+
          '<button onclick="cancelarIntencao(\''+r.id+'\')" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;font-size:11px;padding:5px 9px;width:auto">Cancelar</button>'+
        '</div>':'')+
    '</div>';
  }).join('');
}

function onFiltroDataChange() {
  var v = (document.getElementById('intencaoFiltroData')||{}).value;
  var box = document.getElementById('intencaoFiltroPersonalizado');
  if(box) box.style.display = v==='personalizado' ? 'block' : 'none';
  if(v !== 'personalizado') renderReservasIntencao();
}

function cancelarIntencao(id) {
  var r = reservasIntencao.find(function(r){ return r.id===id; });
  if(!r) return;
  var marcasLabel = (r.marcas||[r.marca||'']).join('/');
  if(!confirm('Cancelar a reserva de intencao "'+r.evento+'" ('+r.quantidade+'x '+marcasLabel+')?')) return;
  r.status = 'cancelada';
  saveReservasIntencao();
}

function abrirSaidaIntencao(id) {
  var r = reservasIntencao.find(function(r){ return r.id===id; });
  if(!r) return;
  var marcas = r.marcas||(r.marca?[r.marca]:[]);

  document.getElementById('saidaIntencaoModal').dataset.id = id;
  document.getElementById('saidaIntencaoInfo').innerHTML =
    '<b>'+r.evento+'</b><br>'+
    r.quantidade+'x '+marcas.join('/')+' &nbsp;•&nbsp; '+formatDate(r.startDate)+' – '+formatDate(r.endDate)+
    (r.cidade?'<br>'+r.cidade+(r.responsavel?' — '+r.responsavel:''):'');

  var selectList = document.getElementById('saidaIntencaoMachineList');
  selectList.innerHTML = '';
  saidaIntencaoSelected.clear();

  var disponiveis = machines.filter(function(m){
    var s = getRealStatus(m);
    return marcas.indexOf(m.brand)>-1 && s!=='Em uso' && s!=='Manutencao';
  }).sort(function(a,b){ return a.history.filter(function(h){return h.type==='saida';}).length - b.history.filter(function(h){return h.type==='saida';}).length; });

  disponiveis.forEach(function(m){
    var usos = m.history.filter(function(h){return h.type==='saida';}).length;
    var item = document.createElement('div');
    item.className = 'machine-select-item';
    item.dataset.serial = m.serial;
    var label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:9px;width:100%;cursor:pointer';
    label.innerHTML='<input type="checkbox" onclick="event.stopPropagation();toggleSaidaIntencaoSel(\''+m.serial+'\')" /><div style="flex:1"><b>'+m.serial+'</b> <span style="color:#6b7280;font-size:13px">- '+m.brand+'</span></div><span style="font-size:12px;color:#6b7280">'+usos+' uso(s)</span>';
    label.onclick=function(e){ if(e.target.tagName!=='INPUT') toggleSaidaIntencaoSel(m.serial); };
    item.appendChild(label);
    selectList.appendChild(item);
  });

  atualizarContadorSaidaIntencao(r.quantidade);
  document.getElementById('saidaIntencaoModal').classList.add('open');
}

var saidaIntencaoSelected = new Set();

function toggleSaidaIntencaoSel(serial){
  var id = document.getElementById('saidaIntencaoModal').dataset.id;
  var r  = reservasIntencao.find(function(r){return r.id===id;});
  if(!r) return;
  if(saidaIntencaoSelected.has(serial)) saidaIntencaoSelected.delete(serial);
  else if(saidaIntencaoSelected.size < r.quantidade) saidaIntencaoSelected.add(serial);
  document.querySelectorAll('#saidaIntencaoMachineList .machine-select-item').forEach(function(item){
    var s = item.dataset.serial;
    var sel = saidaIntencaoSelected.has(s);
    item.classList.toggle('selected', sel);
    item.querySelector('input[type=checkbox]').checked = sel;
  });
  atualizarContadorSaidaIntencao(r.quantidade);
}

function atualizarContadorSaidaIntencao(qty){
  var c   = saidaIntencaoSelected.size;
  var btn = document.getElementById('btnConfirmarSaidaIntencao');
  var counter = document.getElementById('saidaIntencaoCounter');
  if(counter) counter.textContent = c+' de '+qty+' selecionadas';
  if(btn){ btn.disabled = (c===0); btn.textContent = 'Confirmar saida ('+c+')'; }
}

function confirmarSaidaIntencao(){
  var id = document.getElementById('saidaIntencaoModal').dataset.id;
  var r  = reservasIntencao.find(function(r){return r.id===id;});
  if(!r||!saidaIntencaoSelected.size) return;
  if(!confirm('Confirmar saida de '+saidaIntencaoSelected.size+' maquina(s) para "'+r.evento+'"?')) return;
  var un=getCurrentUserName(), ue=getCurrentUserEmail();
  var serials = Array.from(saidaIntencaoSelected);
  serials.forEach(function(serial){
    var m = machines.find(function(m){return m.serial===serial;});
    if(!m) return;
    m.status = 'Em uso';
    m.history.push({type:'saida',event:r.evento,city:r.cidade||'',responsible:r.responsavel||'',address:r.endereco||'',startDate:r.startDate,endDate:r.endDate,date:new Date().toISOString(),user:un,userEmail:ue,fromIntencao:true,batch:true});
  });
  if(saidaIntencaoSelected.size >= r.quantidade) r.status = 'concluida';
  else r.quantidade = r.quantidade - saidaIntencaoSelected.size;
  saveReservasIntencao();
  save();
  closeSaidaIntencaoModal();
  renderReservasIntencao();
  alert('Saida registrada para '+serials.length+' maquina(s)!');
}

function closeSaidaIntencaoModal(){
  document.getElementById('saidaIntencaoModal').classList.remove('open');
  saidaIntencaoSelected.clear();
}

// Hook Reservas de Intenção no listener existente
var _origSFLIntencao = startFirebaseListener;
startFirebaseListener = function() {
  _origSFLIntencao();
  startReservasIntencaoListener();
};

