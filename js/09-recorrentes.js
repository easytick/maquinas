// RECORRENTES
// ═══════════════════════════════════════════
var recorrentes = [];
var recFiltroAtual = '';

function startRecorrentesListener() {
  db.ref('recorrentes').on('value', function(snap) {
    var d = snap.val();
    recorrentes = d ? Object.values(d) : [];
    renderRecPainel();
    renderDayAlertsRec();
  });
}
function saveRecorrentes() {
  var obj = {};
  recorrentes.forEach(function(r) { obj[r.id] = r; });
  db.ref('recorrentes').set(obj);
}

function getRecStatus(r) {
  if (r.status === 'inativo' || r.status === 'concluido') return 'inativo';
  var freq = r.frequencia || 'mensal';
  var today = getToday();
  var now = new Date(today + 'T00:00:00');
  var year = now.getFullYear(), month = now.getMonth();
  var lastPag = getLastRecPag(r);

  // UNICA: se ja pagou, em dia; se nao, vencendo
  if (freq === 'unica') {
    if (lastPag) return 'emdia';
    return 'vencendo';
  }

  // ANUAL: vence uma vez por ano (diaVenc + mesVenc)
  if (freq === 'anual') {
    var mesVenc = (r.mesVenc || 1) - 1; // 0-indexed
    var diaVenc = parseInt(r.diaVenc) || 1;
    if (lastPag) {
      var lastDate = new Date(lastPag.data + 'T00:00:00');
      var vencAnual = new Date(lastDate.getFullYear(), mesVenc, diaVenc);
      // Proximo vencimento apos ultimo pagamento
      if (lastDate < vencAnual) {
        var diffAnual = Math.floor((now - vencAnual) / (1000*60*60*24));
        if (diffAnual > 0) return 'atrasado';
        if (diffAnual >= -30) return 'vencendo';
        return 'emdia';
      }
      // Proximo ano
      var proxVenc = new Date(lastDate.getFullYear() + 1, mesVenc, diaVenc);
      var diffProx = Math.floor((now - proxVenc) / (1000*60*60*24));
      if (diffProx > 0) return 'atrasado';
      if (diffProx >= -30) return 'vencendo';
      return 'emdia';
    }
    // Nunca pagou - check vencimento deste ano
    var vencEsteAno = new Date(year, mesVenc, diaVenc);
    var diffEste = Math.floor((now - vencEsteAno) / (1000*60*60*24));
    if (diffEste > 0) return 'atrasado';
    if (diffEste >= -30) return 'vencendo';
    return 'emdia';
  }

  // MENSAL (default)
  // Logica: o proximo vencimento esperado e calculado a partir do ultimo pagamento.
  // Se nao pagou no ciclo atual (mes corrente ou anterior sem pagamento), acumula como pendencia.
  var dd = parseInt(r.diaVenc);
  var proxVencMensal;
  if (lastPag) {
    var lastDateM = new Date(lastPag.data + 'T00:00:00');
    // Proximo vencimento = mes seguinte ao do ultimo pagamento, no mesmo dia
    proxVencMensal = new Date(lastDateM.getFullYear(), lastDateM.getMonth() + 1, dd);
  } else {
    // Nunca pagou: vencimento do mes atual (ou passado se ja passou)
    proxVencMensal = new Date(year, month, dd);
    // Se o dia de vencimento deste mes ainda nao chegou e nunca houve pagamento,
    // considera como pendente desde o primeiro mes (nao deixa em "emdia" sem ter pago)
  }
  var diffM = Math.floor((now - proxVencMensal) / (1000*60*60*24));
  if (diffM > 0) return 'atrasado';
  if (diffM >= -5) return 'vencendo';
  return 'emdia';
}

function getVencLabel(r) {
  var freq = r.frequencia || 'mensal';
  if (freq === 'unica') return 'Pagamento unico';
  var now = new Date(getToday() + 'T00:00:00');
  var venc;
  if (freq === 'anual') {
    var mes = (r.mesVenc || 1) - 1;
    venc = new Date(now.getFullYear(), mes, parseInt(r.diaVenc)||1);
    if (venc < now) venc = new Date(now.getFullYear()+1, mes, parseInt(r.diaVenc)||1);
  } else {
    venc = new Date(now.getFullYear(), now.getMonth(), parseInt(r.diaVenc));
  }
  var diff = Math.floor((venc - now) / (1000*60*60*24));
  if (diff === 0) return 'Vence hoje';
  if (diff > 0) return 'Vence em ' + diff + ' dia' + (diff > 1 ? 's' : '');
  return Math.abs(diff) + ' dia' + (Math.abs(diff) > 1 ? 's' : '') + ' de atraso';
}

var MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
function getFreqLabel(r) {
  var freq = r.frequencia || 'mensal';
  if (freq === 'mensal') return '📅 Mensal';
  if (freq === 'anual')  return '📆 Anual';
  if (freq === 'unica')  return '1️⃣ Unica';
  return freq;
}
function getVencInfo(r) {
  var freq = r.frequencia || 'mensal';
  if (freq === 'unica') return 'Pagamento unico';
  if (freq === 'anual') {
    var mes = MESES[(r.mesVenc||1)-1];
    return 'Vence: dia '+r.diaVenc+' de '+mes;
  }
  return 'Vence: dia '+r.diaVenc;
}
function getFreqLabelById(freq) {
  if (freq==='mensal') return 'Mensal';
  if (freq==='anual')  return 'Anual';
  if (freq==='unica')  return 'Unico';
  return freq||'';
}
function getLastRecPag(r) {
  if (!r.pagamentos || !r.pagamentos.length) return null;
  return r.pagamentos.slice().sort(function(a,b){ return new Date(b.data)-new Date(a.data); })[0];
}

function setRecTab(tab) {
  ['painel','cadastro','extrato'].forEach(function(t) {
    var el = document.getElementById('rec-'+t);
    var btn = document.getElementById('rsub-'+t);
    if (el) el.style.display = t===tab ? 'block' : 'none';
    if (btn) { btn.style.background=t===tab?'#eef6ff':'#f9fafb'; btn.style.color=t===tab?'var(--blue)':'#6b7280'; btn.style.fontWeight=t===tab?'bold':'normal'; }
  });
  if (tab==='extrato') renderRecExtrato();
  if (tab==='painel') renderRecPainel();
}

function setRecFiltro(el, filtro) {
  recFiltroAtual = filtro;
  document.querySelectorAll('.rec-chip').forEach(function(c){ c.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderRecPainel();
}

function toggleRecFrequencia() {
  var freq = document.getElementById('recFrequencia').value;
  document.getElementById('recDiaVencWrap').style.display = freq==='unica' ? 'none' : 'block';
  document.getElementById('recMesVencWrap').style.display = freq==='anual' ? 'block' : 'none';
  var lbl = document.querySelector('#recDiaVencWrap label');
  if(lbl) lbl.childNodes[0].textContent = freq==='anual' ? 'Dia do vencimento anual (1-28)' : 'Dia de vencimento (1-28)';
}
function toggleRecEditFrequencia() {
  var freq = document.getElementById('recEditFrequencia').value;
  document.getElementById('recEditDiaWrap').style.display = freq==='unica' ? 'none' : 'block';
  document.getElementById('recEditMesWrap').style.display = freq==='anual' ? 'block' : 'none';
}
function cadastrarRecorrente(e) {
  e.preventDefault();
  var nome = document.getElementById('recNome').value.trim();
  var tipo = document.getElementById('recTipo').value;
  var freq = document.getElementById('recFrequencia').value;
  var valor = parseFloat(document.getElementById('recValor').value);
  var diaVenc = freq==='unica' ? 0 : parseInt(document.getElementById('recDiaVenc').value)||0;
  var mesVenc = freq==='anual' ? parseInt(document.getElementById('recMesVenc').value)||0 : 0;
  var obs = document.getElementById('recObs').value.trim();
  if (!nome || !valor) { alert('Preencha todos os campos obrigatorios.'); return; }
  if (freq!=='unica' && !diaVenc) { alert('Informe o dia de vencimento.'); return; }
  var id = 'rec_' + Date.now();
  recorrentes.push({ id:id, nome:nome, tipo:tipo, frequencia:freq, valor:valor, diaVenc:diaVenc, mesVenc:mesVenc, obs:obs, status:'ativo', pagamentos:[], criadoEm:new Date().toISOString() });
  saveRecorrentes();
  document.getElementById('recNome').value=''; document.getElementById('recValor').value='';
  document.getElementById('recDiaVenc').value=''; document.getElementById('recObs').value='';
  document.getElementById('recFrequencia').value='mensal'; toggleRecFrequencia();
  alert('Cliente "'+nome+'" cadastrado!');
  setRecTab('painel');
}

function openRecPagoModal(id) {
  var r = recorrentes.find(function(x){ return x.id===id; }); if (!r) return;
  document.getElementById('recPagoId').value = id;
  document.getElementById('recPagoForma').value = '';
  document.getElementById('recPagoBanco').value = '';
  document.getElementById('recPagoData').value = getToday();
  document.getElementById('recPagoInfo').innerHTML = '<b>'+r.nome+'</b><br>Tipo: '+r.tipo+'<br>Valor: <b>'+formatMoney(r.valor)+'</b><br>Vencimento: dia '+r.diaVenc;
  document.getElementById('recPagoModal').classList.add('open');
}
function closeRecPagoModal() { document.getElementById('recPagoModal').classList.remove('open'); }
function confirmarRecPago() {
  var id=document.getElementById('recPagoId').value, forma=document.getElementById('recPagoForma').value, banco=document.getElementById('recPagoBanco').value, data=document.getElementById('recPagoData').value;
  if (!forma) { alert('Selecione a forma de pagamento.'); return; }
  if (!banco) { alert('Selecione o banco.'); return; }
  var r=recorrentes.find(function(x){return x.id===id;}); if(!r) return;
  if (!r.pagamentos) r.pagamentos=[];
  r.pagamentos.push({id:'pag_'+Date.now(), data:data, forma:forma, banco:banco, valor:r.valor, registradoPor:getCurrentUserName(), registradoEm:new Date().toISOString()});
  // Unica: apos pagar, marcar como concluido (inativo)
  if ((r.frequencia||'mensal') === 'unica') { r.status = 'concluido'; }
  saveRecorrentes(); closeRecPagoModal();
  alert('Pagamento registrado!'+(r.status==='concluido'?' Plano unico concluido.':''));
}

function toggleRecStatus(id) {
  var r=recorrentes.find(function(x){return x.id===id;}); if(!r) return;
  if (r.status==='inativo') { if(!confirm('Reativar "'+r.nome+'"?'))return; r.status='ativo'; }
  else { if(!confirm('Desativar "'+r.nome+'"?'))return; r.status='inativo'; }
  saveRecorrentes();
}

function openRecEditModal(id) {
  var r=recorrentes.find(function(x){return x.id===id;}); if(!r) return;
  document.getElementById('recEditId').value=id;
  document.getElementById('recEditNome').value=r.nome;
  document.getElementById('recEditTipo').value=r.tipo;
  document.getElementById('recEditFrequencia').value=r.frequencia||'mensal';
  document.getElementById('recEditValor').value=r.valor;
  document.getElementById('recEditDiaVenc').value=r.diaVenc||'';
  document.getElementById('recEditMesVenc').value=r.mesVenc||1;
  document.getElementById('recEditObs').value=r.obs||'';
  toggleRecEditFrequencia();
  document.getElementById('recEditModal').classList.add('open');
}
function closeRecEditModal() { document.getElementById('recEditModal').classList.remove('open'); }
function salvarEditRecorrente(e) {
  e.preventDefault();
  var id=document.getElementById('recEditId').value;
  var r=recorrentes.find(function(x){return x.id===id;}); if(!r) return;
  r.nome=document.getElementById('recEditNome').value.trim();
  r.tipo=document.getElementById('recEditTipo').value;
  r.frequencia=document.getElementById('recEditFrequencia').value;
  r.valor=parseFloat(document.getElementById('recEditValor').value);
  r.diaVenc=r.frequencia==='unica'?0:parseInt(document.getElementById('recEditDiaVenc').value)||0;
  r.mesVenc=r.frequencia==='anual'?parseInt(document.getElementById('recEditMesVenc').value)||0:0;
  r.obs=document.getElementById('recEditObs').value.trim();
  saveRecorrentes(); closeRecEditModal();
}

function toggleRecHist(id) {
  var el=document.getElementById('rechist-'+id);
  if(el) el.style.display = el.style.display==='none' ? 'block' : 'none';
}

function renderRecPainel() {
  var all = recorrentes;
  var atrasados = all.filter(function(r){return r.status!=='inativo'&&getRecStatus(r)==='atrasado';});
  var vencendo  = all.filter(function(r){return r.status!=='inativo'&&getRecStatus(r)==='vencendo';});
  var emdia     = all.filter(function(r){return r.status!=='inativo'&&getRecStatus(r)==='emdia';});
  var inativos  = all.filter(function(r){return r.status==='inativo';});

  var ec=document.getElementById('recEmDiaCount'), vc=document.getElementById('recVencendoCount'), ac=document.getElementById('recAtrasadoCount');
  if(ec) ec.textContent=emdia.length;
  if(vc) vc.textContent=vencendo.length;
  if(ac) ac.textContent=atrasados.length;

  var filtered = all;
  if(recFiltroAtual==='atrasado') filtered=atrasados;
  else if(recFiltroAtual==='vencendo') filtered=vencendo;
  else if(recFiltroAtual==='emdia') filtered=emdia;
  else if(recFiltroAtual==='inativo') filtered=inativos;

  var list=document.getElementById('recClienteList'); if(!list) return;
  list.innerHTML='';
  if(!filtered.length){list.innerHTML='<p style="color:#9ca3af;font-size:13px">Nenhum cliente encontrado.</p>';return;}

  var order={atrasado:0,vencendo:1,emdia:2,inativo:3};
  filtered=filtered.slice().sort(function(a,b){return(order[getRecStatus(a)]||0)-(order[getRecStatus(b)]||0);});

  filtered.forEach(function(r) {
    var st=getRecStatus(r), lastPag=getLastRecPag(r);
    var freq = r.frequencia||'mensal';
    var isConc = r.status==='concluido';
    var badgeText = st==='emdia'?'Em dia':st==='inativo'?(isConc?'✅ Concluido':'Inativo'):getVencLabel(r);

    var div=document.createElement('div');
    div.className='rec-card '+st;
    div.innerHTML=
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:6px">'+
        '<div><div style="font-size:15px;font-weight:bold;color:#111827">'+r.nome+'</div>'+
        '<div style="font-size:12px;color:#6b7280;margin-top:1px">'+r.tipo+' · '+getFreqLabel(r)+'</div></div>'+
        '<span class="rec-badge '+st+'">'+badgeText+'</span>'+
      '</div>'+
      '<div style="border-top:1px solid var(--border);padding-top:7px;font-size:12px;color:#374151;line-height:1.7">'+
        '<b>Valor:</b> '+formatMoney(r.valor)+' &nbsp;·&nbsp; '+getFreqLabel(r)+' &nbsp;·&nbsp; '+getVencInfo(r)+
        (r.obs?'<br><b>Obs:</b> '+r.obs:'')+
        (lastPag?'<br><b>Ultimo pag:</b> '+formatDate(lastPag.data)+' via '+lastPag.forma+' - '+lastPag.banco:'<br><span style="color:#9ca3af">Sem pagamentos registrados</span>')+
      '</div>';

    // Historico
    var histDiv=document.createElement('div');
    histDiv.id='rechist-'+r.id; histDiv.style.display='none';
    histDiv.style.cssText='margin-top:8px;padding:9px;background:#f9fafb;border-radius:9px;border:1px solid var(--border);font-size:12px';
    histDiv.innerHTML=(!r.pagamentos||!r.pagamentos.length)?'<p style="color:#9ca3af">Sem historico.</p>':
      r.pagamentos.slice().reverse().map(function(p){
        return '<div style="padding:5px 0;border-bottom:1px solid var(--border)"><b>'+formatDate(p.data)+'</b> - '+formatMoney(p.valor)+' via '+p.forma+' ('+p.banco+')<br><span style="color:#9ca3af">'+p.registradoPor+'</span></div>';
      }).join('');
    div.appendChild(histDiv);

    // Botoes
    var row=document.createElement('div');
    row.style.cssText='display:flex;gap:6px;margin-top:9px;flex-wrap:wrap';

    if(st!=='inativo'){
      var bp=document.createElement('button');
      bp.textContent='✅ Marcar pago';
      bp.style.cssText='flex:1;min-width:80px;font-size:12px;padding:8px 6px;border-radius:8px;border:none;background:#dcfce7;color:#166534;font-family:Arial,sans-serif;cursor:pointer;font-weight:bold';
      bp.onclick=(function(id){return function(){openRecPagoModal(id);};})(r.id);
      row.appendChild(bp);
    }

    var bh=document.createElement('button');
    bh.textContent='📋 Hist.';
    bh.style.cssText='flex:1;min-width:55px;font-size:12px;padding:8px 6px;border-radius:8px;border:1px solid var(--border);background:#f3f4f6;color:#374151;font-family:Arial,sans-serif;cursor:pointer';
    bh.onclick=(function(id){return function(){toggleRecHist(id);};})(r.id);
    row.appendChild(bh);

    var be=document.createElement('button');
    be.textContent='✏️ Editar';
    be.style.cssText='flex:1;min-width:60px;font-size:12px;padding:8px 6px;border-radius:8px;border:none;background:#dbeafe;color:#1e40af;font-family:Arial,sans-serif;cursor:pointer';
    be.onclick=(function(id){return function(){openRecEditModal(id);};})(r.id);
    row.appendChild(be);

    var bt=document.createElement('button');
    bt.textContent=st==='inativo'?'▶️ Reativar':'⏸️ Desativar';
    bt.style.cssText='flex:1;min-width:70px;font-size:12px;padding:8px 6px;border-radius:8px;border:none;font-family:Arial,sans-serif;cursor:pointer;background:'+(st==='inativo'?'#dcfce7;color:#166534':'#fee2e2;color:#991b1b');
    bt.onclick=(function(id){return function(){toggleRecStatus(id);};})(r.id);
    row.appendChild(bt);

    div.appendChild(row);
    list.appendChild(div);
  });
}

function renderRecExtrato() {
  var cSel=document.getElementById('recExtratoCliente');
  if(cSel){var cur=cSel.value;cSel.innerHTML='<option value="">Todos os clientes</option>'+recorrentes.map(function(r){return'<option value="'+r.id+'">'+r.nome+'</option>';}).join('');if(cur)cSel.value=cur;}
  var mSel=document.getElementById('recExtratoMes');
  if(mSel){var months=new Set();recorrentes.forEach(function(r){(r.pagamentos||[]).forEach(function(p){months.add(p.data.substring(0,7));});});var curM=mSel.value;mSel.innerHTML='<option value="">Todos os meses</option>'+Array.from(months).sort().reverse().map(function(m){var p2=m.split('-');var lbl=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(p2[1])-1]+' '+p2[0];return'<option value="'+m+'">'+lbl+'</option>';}).join('');if(curM)mSel.value=curM;}

  var filtroMes=mSel?mSel.value:'', filtroCliente=cSel?cSel.value:'';
  var allPags=[];
  recorrentes.forEach(function(r){(r.pagamentos||[]).forEach(function(p){allPags.push(Object.assign({},p,{cNome:r.nome,cTipo:r.tipo,cId:r.id,cFreq:r.frequencia}));});});
  var filtered=allPags.filter(function(p){if(filtroMes&&!p.data.startsWith(filtroMes))return false;if(filtroCliente&&p.cId!==filtroCliente)return false;return true;});

  var totalPago=filtered.reduce(function(a,p){return a+parseFloat(p.valor);},0);
  var mesRef=filtroMes||getToday().substring(0,7);
  var totalAberto=recorrentes.filter(function(r){if(r.status==='inativo')return false;return!(r.pagamentos||[]).some(function(p){return p.data.startsWith(mesRef);});}).reduce(function(a,r){return a+parseFloat(r.valor);},0);

  var tr=document.getElementById('recTotalRecebido'),ta=document.getElementById('recTotalAberto');
  if(tr)tr.textContent=formatMoney(totalPago);
  if(ta)ta.textContent=formatMoney(totalAberto);

  var list=document.getElementById('recExtratoList');if(!list)return;list.innerHTML='';
  if(!filtered.length){list.innerHTML='<p style="color:#9ca3af;font-size:13px">Nenhum pagamento encontrado.</p>';return;}
  filtered.slice().sort(function(a,b){return new Date(b.data)-new Date(a.data);}).forEach(function(p){
    var div=document.createElement('div');
    div.style.cssText='border-radius:10px;padding:11px 13px;margin-bottom:8px;background:#f0fdf4;border:1.5px solid #86efac';
    div.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><b>'+p.cNome+'</b><br><span style="font-size:12px;color:#374151">'+p.cTipo+' · '+p.forma+' · '+p.banco+'</span><br><span style="font-size:11px;color:#9ca3af">'+formatDate(p.data)+' · '+p.registradoPor+'</span></div><b style="font-size:15px;color:#166534;white-space:nowrap">+ '+formatMoney(p.valor)+'</b></div>';
    list.appendChild(div);
  });
}

function renderDayAlertsRec() {
  var atrasados=recorrentes.filter(function(r){return r.status!=='inativo'&&getRecStatus(r)==='atrasado';});
  var vencendo=recorrentes.filter(function(r){return r.status!=='inativo'&&getRecStatus(r)==='vencendo';});
  var elR=document.getElementById('alertaRecorrentes');if(!elR)return;
  if(atrasados.length||vencendo.length){
    elR.style.display='block';elR.innerHTML='';
    var div=document.createElement('div');div.className='alert-box atraso';
    var txt=document.createElement('div');txt.className='alert-box-text';
    var b=document.createElement('b');
    var msg=[];
    if(atrasados.length)msg.push(atrasados.length+' plano'+(atrasados.length>1?'s':'')+' em atraso');
    if(vencendo.length)msg.push(vencendo.length+' vencendo em breve');
    b.textContent='🔄 '+msg.join(' · ');
    var p=document.createElement('p');
    p.textContent=atrasados.concat(vencendo).slice(0,3).map(function(r){return r.nome;}).join(', ');
    txt.appendChild(b);txt.appendChild(p);
    var btn=document.createElement('button');
    btn.textContent='Ver recorrentes';
    btn.style.cssText='width:auto;font-size:12px;padding:7px 13px;flex-shrink:0';
    btn.onclick=function(){setPage('recorrentes');};
    div.appendChild(txt);div.appendChild(btn);elR.appendChild(div);
  } else { elR.style.display='none'; }
}

// Hook into startFirebaseListener
var _origSFL = startFirebaseListener;
startFirebaseListener = function() {
  _origSFL();
  startRecorrentesListener();
  startFechamentosListener();
};

