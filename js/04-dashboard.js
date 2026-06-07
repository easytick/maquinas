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
// ALERTAS
// ═══════════════════════════════════════════
function renderDayAlerts(){
  var today=getToday(),saidasHoje={},retornosHoje={},atrasosHoje={};
  machines.forEach(function(m){
    if(m.status==='Em uso'||m.status==='Manutencao') return;
    m.reservations.forEach(function(r){if(hasDateOverlap(r.startDate,r.endDate,today,today)){if(!saidasHoje[r.event])saidasHoje[r.event]=[];saidasHoje[r.event].push(m);}});
  });
  machines.forEach(function(m){
    var rs=getRealStatus(m);
    if(rs==='Em atraso'){var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}if(last){var ev=last.event||'Evento';if(!atrasosHoje[ev])atrasosHoje[ev]=[];atrasosHoje[ev].push({m:m,last:last});}}
    if(rs!=='Em uso') return;
    var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}
    if(last&&last.endDate===today){var ev=last.event||'Evento';if(!retornosHoje[ev])retornosHoje[ev]=[];retornosHoje[ev].push(m);}
  });

  function makeAlert(elId, cssClass, title, subtitle, btnText, btnFn) {
    var el=document.getElementById(elId);
    if(!el) return;
    el.style.display='block';
    el.innerHTML='';
    var div=document.createElement('div');
    div.className='alert-box '+cssClass;
    var txt=document.createElement('div');
    txt.className='alert-box-text';
    var b=document.createElement('b');
    b.textContent=title;
    var p=document.createElement('p');
    p.textContent=subtitle;
    txt.appendChild(b);txt.appendChild(p);
    var btn=document.createElement('button');
    btn.textContent=btnText;
    btn.style.cssText='width:auto;font-size:12px;padding:7px 13px;flex-shrink:0';
    btn.onclick=btnFn;
    div.appendChild(txt);div.appendChild(btn);
    el.appendChild(div);
  }
  function hideAlert(elId){var el=document.getElementById(elId);if(el)el.style.display='none';}

  var elS=document.getElementById('alertaSaida');
  var ts=Object.values(saidasHoje).reduce(function(a,b){return a+b.length;},0);
  if(ts>0){makeAlert('alertaSaida','saida',ts+' maquina'+(ts>1?'s':'')+' sai'+(ts>1?'em':'')+' hoje',Object.keys(saidasHoje).join(', '),'Ver no Resumo',function(){setPage('inicio');showDayResume('today');});}
  else hideAlert('alertaSaida');

  var tr=Object.values(retornosHoje).reduce(function(a,b){return a+b.length;},0);
  if(tr>0){makeAlert('alertaRetorno','retorno',tr+' maquina'+(tr>1?'s':'')+' retorna'+(tr>1?'m':'')+' hoje',Object.keys(retornosHoje).join(', '),'Ver no Resumo',function(){setPage('inicio');showDayResume('today');});}
  else hideAlert('alertaRetorno');

  var ta=Object.values(atrasosHoje).reduce(function(a,b){return a+b.length;},0);
  if(ta>0){
    var nomes=Object.keys(atrasosHoje).map(function(ev){var items=atrasosHoje[ev];var d=daysDiff(items[0].last.endDate);return ev+' ('+d+' dia'+(d>1?'s':'')+' de atraso)';}).join(', ');
    makeAlert('alertaAtraso','atraso',ta+' maquina'+(ta>1?'s':'')+' em atraso!',nomes,'Ver em atraso',function(){setPage('maquinas');setStatusFilter2('Em atraso');});
  } else hideAlert('alertaAtraso');

  var elF=document.getElementById('alertaFinanceiro');
  if(elF){
    var fp=financeiro.filter(function(f){return f.status==='Pendente';});
    if(fp.length>0){makeAlert('alertaFinanceiro','financeiro',fp.length+' pagamento'+(fp.length>1?'s':'')+' pendente'+(fp.length>1?'s':''),fp.map(function(f){return f.evento+': '+formatMoney(f.valor);}).join(' / '),'Ver pendentes',function(){setPage('financeiro');setFinTab('pendentes');});}
    else hideAlert('alertaFinanceiro');
  }
  // Alerta reservas de intencao proximas
  if(typeof reservasIntencao !== 'undefined') {
    var hoje=getToday(), proxDias=new Date(); proxDias.setDate(proxDias.getDate()+3); proxDias=proxDias.toISOString().slice(0,10);
    var intProximas=reservasIntencao.filter(function(r){return r.status==='pendente'&&r.startDate>=hoje&&r.startDate<=proxDias;});
    if(intProximas.length>0){
      makeAlert('alertaFinanceiro','financeiro',
        intProximas.length+' reserva'+(intProximas.length>1?'s':'')+' de intencao com saida em ate 3 dias',
        intProximas.map(function(r){return r.evento+' ('+r.quantidade+'x '+r.marca+')';}).join(', '),
        'Ver reservas',function(){setPage('acoes');setLoteAba('intencoes');});
    }
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

