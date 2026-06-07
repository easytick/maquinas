// ═══════════════════════════════════════════
// FINANCEIRO
// ═══════════════════════════════════════════
var FIN_ABAS=['solicitar','pendentes','extrato','saldo'];
function setFinTab(tab){FIN_ABAS.forEach(function(a){document.getElementById('fin-'+a).classList.toggle('active',a===tab);});document.querySelectorAll('#financeiroSection .lote-tab-btn').forEach(function(btn,i){btn.classList.toggle('active',FIN_ABAS[i]===tab);});if(tab==='pendentes'){refreshFinEventos();renderPendentes();}if(tab==='extrato'){refreshFinEventos();renderExtrato();}if(tab==='saldo'){renderSaldoEventoList();}}

function toggleFinTipo(){}
function togglePixFields(){var t=document.getElementById('finTipoPagamento').value;document.getElementById('pixFields').style.display=t==='Pix'?'block':'none';document.getElementById('naoPixFields').style.display=(t&&t!=='Pix'&&t!=='Dinheiro')?'block':'none';}
var _pixTipo='Celular';
function setPixTipo(btn,tipo){document.querySelectorAll('.pix-tipo-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');_pixTipo=tipo;document.getElementById('finPixTipo').value=tipo;}

function parsePixText() {
  var text = document.getElementById('finPasteText').value;
  if(!text.trim()) return;

  function extract(text, keys) {
    for(var i=0;i<keys.length;i++) {
      var key = keys[i];
      // Very flexible: ignore *, spaces, case. Match key + any combo of :*spaces
      var escaped = key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      // Allow optional * before and after key, flexible spacing around :
      var regex = new RegExp('\\*?\\s*'+escaped+'\\s*\\*?\\s*:\\s*\\*?\\s*([^\n]+)', 'i');
      var m = text.match(regex);
      if(m) {
        // Clean result: remove leading/trailing *, spaces
        return m[1].replace(/^[\s*]+|[\s*]+$/g,'').trim();
      }
    }
    return '';
  }

  // Try all possible key variations for each field
  var nome = extract(text, [
    'Nome Evento/Operacao','Nome Evento/Operação',
    'Nome do fornecedor/Operacao','Nome do fornecedor/Operação',
    'Nome do fornecedor','Nome Evento',
    'Operacao','Operação','Evento'
  ]);
  var chave = extract(text, [
    'Chave pix','Chave PIX','Chave Pix',
    'PIX','Pix'
  ]);
  var dest = extract(text, [
    'Nome destinatario','Nome destinatário',
    'Destinatario','Destinatário',
    'Nome do destinatario','Nome do destinatário'
  ]);
  var valorRaw = extract(text, ['Valor']);

  // Parse valor - handle R$2.833,58 or R$2833.58 or 2.833,58 or 2833,58
  var valorClean = valorRaw.replace(/R\$\s*/gi,'').replace(/\s/g,'').trim();
  var valor = '';
  if(valorClean) {
    // Brazilian format: dots as thousands separator, comma as decimal
    if(/\d,\d{1,2}$/.test(valorClean)) {
      valorClean = valorClean.replace(/\./g,'').replace(',','.');
    } else {
      // Already using dot as decimal or no decimal
      valorClean = valorClean.replace(/,/g,'');
    }
    valor = parseFloat(valorClean) || '';
  }

  if(nome)  document.getElementById('finEvento').value = nome;
  if(dest)  document.getElementById('finNome').value   = dest;
  if(valor) document.getElementById('finValor').value  = valor;

  if(chave) {
    document.getElementById('finTipoPagamento').value = 'Pix';
    togglePixFields();
    document.getElementById('finChavePix').value = chave;
    var chaveDigits = chave.replace(/\D/g,'');
    if(/^[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}$/.test(chave)) {
      setPixTipoByName('Email');
    } else if(chaveDigits.length === 14) {
      setPixTipoByName('CPF'); // CNPJ
    } else if(chaveDigits.length === 11 && /^[9][0-9]/.test(chaveDigits.substring(2))) {
      setPixTipoByName('Celular'); // DDD + 9 + numero
    } else if(chaveDigits.length === 11) {
      setPixTipoByName('CPF'); // CPF tem 11 digitos
    } else if(chaveDigits.length === 10) {
      setPixTipoByName('Celular');
    } else if(chave.length >= 32) {
      setPixTipoByName('Aleatoria');
    } else {
      setPixTipoByName('Celular');
    }
  }

  if(!document.getElementById('finTipoLancamento').value)
    document.getElementById('finTipoLancamento').value = 'saque_evento';

  document.getElementById('finPasteText').value = '';
  alert('Campos preenchidos! Revise e clique em Registrar.');
}
function setPixTipoByName(name) {
  document.querySelectorAll('.pix-tipo-btn').forEach(function(b){
    b.classList.remove('active');
    if(b.textContent.indexOf(name)>-1) b.classList.add('active');
  });
  document.getElementById('finPixTipo').value = name;
}
var finItens = [];
function adicionarItem(){
  var tipoLanc=document.getElementById('finTipoLancamento').value,evento=document.getElementById('finEvento').value.trim(),nome=document.getElementById('finNome').value.trim(),tipoPag=document.getElementById('finTipoPagamento').value,valor=parseFloat(document.getElementById('finValor').value),obs=document.getElementById('finObs').value.trim();
  var chave='';
  if(tipoPag==='Pix') chave=_pixTipo+': '+(document.getElementById('finChavePix').value.trim()||'');
  else if(document.getElementById('naoPixFields').style.display!=='none') chave=document.getElementById('finChaveOutros').value.trim();
  if(!tipoLanc||!evento||!nome||!tipoPag||!valor||valor<=0){alert('Preencha todos os campos para adicionar.');return;}
  var isEntrada=['recebimento_evento','deposito','outros_entrada'].indexOf(tipoLanc)>-1;
  finItens.push({tipoLancamento:tipoLanc,isEntrada:isEntrada,evento:evento,nome:nome,tipoPagamento:tipoPag,chave:chave,valor:valor,obs:obs});
  renderFinItens();
  // Clear value fields but keep evento
  document.getElementById('finTipoLancamento').value='';document.getElementById('finNome').value='';document.getElementById('finTipoPagamento').value='';document.getElementById('finChavePix').value='';document.getElementById('finChaveOutros').value='';document.getElementById('finValor').value='';document.getElementById('finObs').value='';document.getElementById('pixFields').style.display='none';document.getElementById('naoPixFields').style.display='none';
}
function renderFinItens(){
  var container=document.getElementById('finItensContainer');
  var lista=document.getElementById('finItensLista');
  if(!finItens.length){lista.style.display='none';container.innerHTML='';return;}
  lista.style.display='block';
  var total=finItens.reduce(function(a,i){return a+i.valor;},0);
  container.innerHTML='<div style="background:#f9fafb;border-radius:9px;overflow:hidden;border:1.5px solid var(--border)">'+
    finItens.map(function(item,i){return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--border);font-size:13px"><div><b>'+item.evento+'</b> - '+getTipoLabel(item.tipoLancamento)+'<br><span style="color:#6b7280">'+item.nome+' - '+item.tipoPagamento+(item.chave?' - '+item.chave:'')+'</span></div><div style="display:flex;align-items:center;gap:8px"><b style="color:'+(item.isEntrada?'#166534':'#991b1b')+'">'+(item.isEntrada?'+':'-')+formatMoney(item.valor)+'</b><button onclick="removerItem('+i+')" style="background:#fee2e2;color:#991b1b;border:none;width:auto;padding:3px 8px;font-size:12px;border-radius:6px">x</button></div></div>';}).join('')+
    '<div style="padding:8px 12px;font-weight:bold;font-size:13px;text-align:right">Total: '+formatMoney(total)+'</div></div>';
}
function removerItem(i){finItens.splice(i,1);renderFinItens();}

function solicitarPagamento(){
  var tipoLanc=document.getElementById('finTipoLancamento').value,evento=document.getElementById('finEvento').value.trim(),nome=document.getElementById('finNome').value.trim(),tipoPag=document.getElementById('finTipoPagamento').value,valor=parseFloat(document.getElementById('finValor').value),obs=document.getElementById('finObs').value.trim(),result=document.getElementById('finSolicitarResult');
  if(!tipoLanc||!evento||!nome||!tipoPag||!valor||valor<=0){alert('Preencha todos os campos obrigatorios.');return;}
  var chave='';
  if(tipoPag==='Pix') chave=_pixTipo+': '+(document.getElementById('finChavePix').value.trim()||'');
  else if(document.getElementById('finChaveOutros').style.display!=='none') chave=document.getElementById('finChaveOutros').value.trim();
  var isEntrada=['recebimento_evento','deposito','outros_entrada'].indexOf(tipoLanc)>-1;
  var id='fin_'+Date.now();var un=getCurrentUserName(),ue=getCurrentUserEmail();
  financeiro.push({id:id,tipoLancamento:tipoLanc,isEntrada:isEntrada,evento:evento,nome:nome,tipoPagamento:tipoPag,chave:chave,valor:valor,obs:obs,status:isEntrada?'Pago':'Pendente',dataSolicitacao:new Date().toISOString(),solicitadoPor:un,solicitadoEmail:ue,banco:isEntrada?'':''});
  saveFinanceiro();
  result.className='batch-result show';result.innerHTML='<b>Lancamento registrado!</b><br>'+(isEntrada?'Entrada':'Saida')+': '+evento+'<br>Valor: '+formatMoney(valor);
  document.getElementById('finTipoLancamento').value='';document.getElementById('finEvento').value='';document.getElementById('finNome').value='';document.getElementById('finTipoPagamento').value='';document.getElementById('finChavePix').value='';document.getElementById('finChaveOutros').value='';document.getElementById('finValor').value='';document.getElementById('finObs').value='';document.getElementById('pixFields').style.display='none';document.getElementById('naoPixFields').style.display='none';
  // Also save finItens
  var totalItens=finItens.length;
  finItens.forEach(function(item){var id2='fin_'+Date.now()+'_'+Math.random().toString(36).substr(2,5);var isEnt=item.isEntrada;financeiro.push({id:id2,tipoLancamento:item.tipoLancamento,isEntrada:isEnt,evento:item.evento,nome:item.nome,tipoPagamento:item.tipoPagamento,chave:item.chave,valor:item.valor,obs:item.obs,status:isEnt?'Pago':'Pendente',dataSolicitacao:new Date().toISOString(),solicitadoPor:un,solicitadoEmail:ue,banco:''});});
  if(totalItens>0){result.innerHTML+='<br>+'+totalItens+' lancamento'+(totalItens>1?'s':'')+' adicionado'+(totalItens>1?'s':'')+' da lista';}
  finItens=[];renderFinItens();if(totalItens>0)saveFinanceiro();
}

function refreshFinEventos(){
  var eventos=new Set();
  financeiro.forEach(function(f){if(f.evento)eventos.add(f.evento);});
  var sorted=Array.from(eventos).sort();
  var opts='<option value="">Todos os eventos</option>'+sorted.map(function(e){return'<option value="'+e+'">'+e+'</option>';}).join('');
  ['finPendentesFiltroEvento','finExtratoFiltroEvento'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){
      var cur=el.value;
      el.innerHTML=opts;
      if(cur)el.value=cur;
    }
  });
}

function renderPendentes(){
  var evFilt=document.getElementById('finPendentesFiltroEvento').value;
  refreshFinEventos();
  var _selP=document.getElementById('finPendentesFiltroEvento');if(_selP&&evFilt)_selP.value=evFilt;
  evFilt=document.getElementById('finPendentesFiltroEvento').value;
  var pendentes=financeiro.filter(function(f){return f.status==='Pendente'&&(!evFilt||f.evento===evFilt);});
  var list=document.getElementById('finPendentesList');
  list.innerHTML='';
  if(!pendentes.length){list.innerHTML='<p style="color:#9ca3af;font-size:13px">Nenhum pagamento pendente.</p>';return;}
  var header=document.createElement('div');
  header.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px';
  header.innerHTML='<span style="font-size:13px;color:#374151"><b>'+pendentes.length+'</b> pendente'+(pendentes.length>1?'s':'')+'</span><div style="display:flex;gap:8px"><button onclick="toggleAllPendentes()" style="font-size:12px;padding:6px 12px;width:auto;background:#f3f4f6;color:#374151;border:1px solid var(--border)">Selecionar todas</button><button onclick="aprovarSelecionados()" style="font-size:12px;padding:6px 12px;width:auto;background:var(--green)">Aprovar selecionadas</button></div>';
  list.appendChild(header);
  pendentes.forEach(function(f){
    var div=document.createElement('div');
    div.className='fin-select-item'+(pendentesSelected.has(f.id)?' selected':'');
    div.onclick=function(){togglePendentesSel(f.id);};
    var inner = document.createElement('div');
    inner.style.cssText = 'display:flex;align-items:flex-start;gap:10px';
    var chk = document.createElement('input');
    chk.type='checkbox'; chk.style.cssText='width:auto;margin-right:4px;flex-shrink:0';
    if(pendentesSelected.has(f.id)) chk.checked=true;
    chk.onclick=function(e){e.stopPropagation();togglePendentesSel(f.id);};
    var info = document.createElement('div'); info.style.flex='1';
    info.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap"><div><b style="font-size:14px">'+f.evento+'</b><br><span style="font-size:12px;color:#374151">'+getTipoLabel(f.tipoLancamento)+' | '+f.nome+' - '+f.tipoPagamento+(f.chave?' - '+f.chave:'')+'</span><br>'+(f.obs?'<span style="font-size:12px;color:#374151">Obs: '+f.obs+'</span><br>':'')+'<span style="font-size:11px;color:#9ca3af">'+f.solicitadoPor+' em '+new Date(f.dataSolicitacao).toLocaleString("pt-BR")+'</span></div><b style="font-size:16px;color:#166534;white-space:nowrap">'+formatMoney(f.valor)+'</b></div>';
    inner.appendChild(chk); inner.appendChild(info);
    div.appendChild(inner);
    var btn=document.createElement('button');
    btn.textContent='Confirmar individual';
    btn.style.cssText='margin-top:8px;background:#f3f4f6;color:#374151;border:1px solid var(--border);font-size:12px;padding:7px';
    btn.onclick=function(e){e.stopPropagation();openPagarModal(f.id);};
    div.appendChild(btn);list.appendChild(div);
  });
}
var pendentesSelected=new Set();
function togglePendentesSel(id){if(pendentesSelected.has(id))pendentesSelected.delete(id);else pendentesSelected.add(id);renderPendentes();}
function toggleAllPendentes(){var evFilt=document.getElementById('finPendentesFiltroEvento').value;var pendentes=financeiro.filter(function(f){return f.status==='Pendente'&&(!evFilt||f.evento===evFilt);});if(pendentesSelected.size===pendentes.length)pendentesSelected.clear();else pendentes.forEach(function(f){pendentesSelected.add(f.id);});renderPendentes();}
function aprovarSelecionados(){
  if(!pendentesSelected.size){alert('Selecione ao menos um pagamento.');return;}
  var banco=prompt('Informe o banco utilizado para todos:\nSantander / Efi Bank / Stone / PagBank / Sicoob');
  if(!banco||!banco.trim()){return;}
  var un=getCurrentUserName(),count=0;
  Array.from(pendentesSelected).forEach(function(id){var f=financeiro.find(function(f){return f.id===id;});if(!f)return;f.status='Pago';f.banco=banco.trim();f.dataPagamento=new Date().toISOString();f.pagoPor=un;count++;});
  saveFinanceiro();pendentesSelected.clear();
  alert(count+' pagamento'+(count>1?'s':'')+' confirmado'+(count>1?'s':'')+'!');
}

function openPagarModal(id){var f=financeiro.find(function(f){return f.id===id;});if(!f)return;document.getElementById('pagarId').value=id;document.getElementById('pagarBanco').value='';document.getElementById('pagarInfo').innerHTML='<b>'+f.evento+'</b><br>Solicitante: '+f.nome+'<br>'+f.tipoPagamento+(f.chave?' - '+f.chave:'')+'<br>Valor: <b>'+formatMoney(f.valor)+'</b>'+(f.obs?'<br>Obs: '+f.obs:'');document.getElementById('pagarModal').classList.add('open');}
function closePagarModal(){document.getElementById('pagarModal').classList.remove('open');}
function confirmarPagamento(){var id=document.getElementById('pagarId').value,banco=document.getElementById('pagarBanco').value;if(!banco){alert('Selecione o banco utilizado.');return;}var f=financeiro.find(function(f){return f.id===id;});if(!f)return;var un=getCurrentUserName();f.status='Pago';f.banco=banco;f.dataPagamento=new Date().toISOString();f.pagoPor=un;saveFinanceiro();closePagarModal();renderPendentes();alert('Pagamento confirmado!');}

function renderExtrato(){
  var evFilt=document.getElementById('finExtratoFiltroEvento').value;
  refreshFinEventos();
  // Restore selection after refresh
  var _sel=document.getElementById('finExtratoFiltroEvento');if(_sel&&evFilt)_sel.value=evFilt;
  evFilt=document.getElementById('finExtratoFiltroEvento').value,statusFilt=document.getElementById('finExtratoFiltroStatus').value,bancoFilt=document.getElementById('finExtratoFiltroBanco').value,dataInicio=document.getElementById('finExtratoDataInicio').value,dataFim=document.getElementById('finExtratoDataFim').value;
  var filtered=financeiro.filter(function(f){
    if(evFilt&&f.evento!==evFilt)return false;
    if(statusFilt&&f.status!==statusFilt)return false;
    if(bancoFilt&&f.banco!==bancoFilt)return false;
    if(dataInicio&&f.dataSolicitacao<dataInicio)return false;
    if(dataFim&&f.dataSolicitacao>(dataFim+'T23:59:59'))return false;
    return true;
  });
  var list=document.getElementById('finExtratoList');list.innerHTML='';
  if(!filtered.length){list.innerHTML='<p style="color:#9ca3af;font-size:13px">Nenhuma movimentacao encontrada.</p>';return;}
  var sorted=filtered.slice().sort(function(a,b){return new Date(b.dataSolicitacao)-new Date(a.dataSolicitacao);});
  sorted.forEach(function(f){
    var isPago=f.status==='Pago';
    var div=document.createElement('div');
    div.style.cssText='border:1.5px solid '+(isPago?'#fed7aa':'#fcd34d')+';border-radius:12px;padding:12px;background:'+(isPago?'#fff7ed':'#fffbeb')+';margin-bottom:8px';
    div.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap"><div>'+
      '<span style="font-size:11px;font-weight:bold;padding:2px 7px;border-radius:999px;background:'+(isPago?'#dcfce7':'#fef3c7')+';color:'+(isPago?'#166534':'#92400e')+'">'+(isPago?'Pago':'Pendente')+'</span> '+
      '<b>'+f.evento+'</b><br>'+
      '<span style="font-size:12px;color:#374151">'+getTipoLabel(f.tipoLancamento)+' | '+f.nome+' - '+f.tipoPagamento+(f.chave?' - '+f.chave:'')+'</span><br>'+
      (isPago?'<span style="font-size:12px;color:#374151">Banco: '+f.banco+' - Pago por: '+f.pagoPor+'</span><br>':'')+
      '<span style="font-size:12px;color:#9ca3af">'+new Date(f.dataSolicitacao).toLocaleString("pt-BR")+' - '+f.solicitadoPor+'</span>'+
      '</div><b style="font-size:16px;color:'+(isPago?'#166534':'#92400e')+';white-space:nowrap">- '+formatMoney(f.valor)+'</b></div>';
    list.appendChild(div);
  });
}


// ═══════════════════════════════════════════
// SALDO EVENTO
// ═══════════════════════════════════════════
var saldoEventos = {}; // { eventName: { valor, historico:[], ativo:true } }

function startSaldoListener() {
  db.ref('saldoEventos').on('value', function(snap) {
    var d = snap.val();
    saldoEventos = d || {};
    renderSaldoEventoList();
  });
}

function saveSaldoEventos() {
  db.ref('saldoEventos').set(saldoEventos);
}

function getSaquesDoEvento(eventName) {
  return financeiro.filter(function(f) {
    return f.evento === eventName && !f.isEntrada && f.status === 'Pago';
  }).reduce(function(a, f) { return a + parseFloat(f.valor||0); }, 0);
}

function getSaldoDisponivel(eventName) {
  var ev = saldoEventos[eventName];
  if (!ev || !ev.ativo) return null;
  var sacado = getSaquesDoEvento(eventName);
  return { disponivel: (ev.valor||0) - sacado, valor: ev.valor||0, sacado: sacado };
}

function checkSaldoDisponivel(eventName) {
  var alertEl = document.getElementById('finSaldoAlert');
  if (!alertEl) return;
  if (!eventName) { alertEl.style.display='none'; return; }
  var s = getSaldoDisponivel(eventName);
  if (!s) { alertEl.style.display='none'; return; }
  alertEl.style.display = 'block';
  var disp = s.disponivel;
  var cor, bg, bord;
  if (disp < 0) { cor='#991b1b'; bg='#fee2e2'; bord='#fca5a5'; }
  else if (disp < s.valor * 0.2) { cor='#92400e'; bg='#fef3c7'; bord='#fcd34d'; }
  else { cor='#166534'; bg='#dcfce7'; bord='#86efac'; }
  alertEl.style.cssText = 'display:block;border-radius:10px;padding:11px 13px;font-size:13px;margin-bottom:4px;background:'+bg+';border:1.5px solid '+bord+';color:'+cor;
  alertEl.innerHTML = '<b>💰 Saldo disponivel: ' + formatMoney(disp) + '</b>' +
    '<div style="font-size:12px;margin-top:3px">Valor no sistema: ' + formatMoney(s.valor) +
    ' · Ja sacado: ' + formatMoney(s.sacado) + '</div>';
}

// ── RENDER SALDO LIST ──
function renderSaldoEventoList() {
  var list = document.getElementById('saldoEventoList');
  if (!list) return;
  var eventos = Object.keys(saldoEventos).filter(function(k){ return saldoEventos[k].ativo; });
  if (!eventos.length) {
    list.innerHTML = '<p style="color:#9ca3af;font-size:13px">Nenhum evento monitorado. Clique em + Monitorar evento.</p>';
    return;
  }
  list.innerHTML = '';
  eventos.sort().forEach(function(evName) {
    var s = getSaldoDisponivel(evName);
    if (!s) return;
    var disp = s.disponivel;
    var ev = saldoEventos[evName];
    var lastUpdate = ev.historico && ev.historico.length ? ev.historico[ev.historico.length-1] : null;

    var card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:var(--shadow);border-left:4px solid ' + (disp < 0 ? 'var(--red)' : disp < s.valor*0.2 ? '#f59e0b' : 'var(--green)');

    var dispColor = disp < 0 ? 'var(--red)' : disp < s.valor*0.2 ? '#92400e' : 'var(--green)';

    card.innerHTML =
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">' +
        '<div><b style="font-size:15px">' + evName + '</b>' +
        (lastUpdate ? '<div style="font-size:11px;color:#9ca3af;margin-top:2px">Atualizado em ' + formatDate(lastUpdate.data) + ' · ' + lastUpdate.por + '</div>' : '') +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0"><div style="font-size:11px;color:#6b7280">Disponivel</div><b style="font-size:20px;color:' + dispColor + '">' + formatMoney(disp) + '</b></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f9fafb;border-radius:9px;padding:10px;font-size:12px;margin-bottom:10px">' +
        '<div><div style="color:#6b7280">Valor no sistema</div><b>' + formatMoney(s.valor) + '</b></div>' +
        '<div><div style="color:#6b7280">Ja sacado (pago)</div><b style="color:var(--red)">- ' + formatMoney(s.sacado) + '</b></div>' +
      '</div>';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px';

    var btnUp = document.createElement('button');
    btnUp.textContent = '📝 Atualizar valor';
    btnUp.style.cssText = 'flex:1;font-size:12px;padding:9px;background:var(--blue)';
    btnUp.onclick = (function(n){ return function(){ openAtualizarSaldoModal(n); }; })(evName);

    var btnHist = document.createElement('button');
    btnHist.textContent = '📋 Historico';
    btnHist.style.cssText = 'flex:1;font-size:12px;padding:9px;background:#f3f4f6;color:#374151;border:1px solid var(--border)';
    btnHist.onclick = (function(n){ return function(){ toggleSaldoHist(n); }; })(evName);

    var btnDel = document.createElement('button');
    btnDel.textContent = '⏸️';
    btnDel.style.cssText = 'width:auto;padding:9px 12px;font-size:12px;background:#fee2e2;color:#991b1b;border:none;border-radius:9px;cursor:pointer;font-family:Arial,sans-serif';
    btnDel.title = 'Desativar monitoramento';
    btnDel.onclick = (function(n){ return function(){ desativarSaldo(n); }; })(evName);

    row.appendChild(btnUp); row.appendChild(btnHist); row.appendChild(btnDel);
    card.appendChild(row);

    // Historico hidden
    var histDiv = document.createElement('div');
    histDiv.id = 'saldoHist-' + evName.replace(/\s/g,'_');
    histDiv.style.display = 'none';
    histDiv.style.cssText = 'margin-top:10px;padding:10px;background:#f9fafb;border-radius:9px;border:1px solid var(--border)';
    if (!ev.historico || !ev.historico.length) {
      histDiv.innerHTML = '<p style="color:#9ca3af;font-size:12px">Sem historico de atualizacoes.</p>';
    } else {
      histDiv.innerHTML = ev.historico.slice().reverse().map(function(h) {
        return '<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;font-size:12px">' +
          '<span style="color:#6b7280">' + formatDate(h.data) + ' · ' + h.por + '</span>' +
          '<b style="color:var(--blue)">' + formatMoney(h.valor) + '</b></div>';
      }).join('');
    }
    card.appendChild(histDiv);
    list.appendChild(card);
  });
}

function toggleSaldoHist(evName) {
  var el = document.getElementById('saldoHist-' + evName.replace(/\s/g,'_'));
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function desativarSaldo(evName) {
  if (!confirm('Desativar monitoramento de "' + evName + '"?')) return;
  if (saldoEventos[evName]) { saldoEventos[evName].ativo = false; }
  saveSaldoEventos();
}

// ── NOVO SALDO MODAL ──
function openNovoSaldoModal() {
  var sel = document.getElementById('novoSaldoEvento');
  var events = getAllEvents ? getAllEvents() : getEvents();
  sel.innerHTML = '<option value="">Selecione o evento</option>' +
    events.filter(function(e){ return !saldoEventos[e] || !saldoEventos[e].ativo; })
    .map(function(e){ return '<option value="'+e+'">'+e+'</option>'; }).join('');
  document.getElementById('novoSaldoValor').value = '';
  document.getElementById('novoSaldoModal').classList.add('open');
}
function closeNovoSaldoModal() { document.getElementById('novoSaldoModal').classList.remove('open'); }
function confirmarNovoSaldo() {
  var evName = document.getElementById('novoSaldoEvento').value;
  var valor = parseFloat(document.getElementById('novoSaldoValor').value);
  if (!evName) { alert('Selecione o evento.'); return; }
  if (!valor || valor <= 0) { alert('Informe o valor.'); return; }
  var un = getCurrentUserName();
  var entry = { valor: valor, ativo: true, historico: [{ data: getToday(), valor: valor, por: un, registradoEm: new Date().toISOString() }] };
  if (saldoEventos[evName]) {
    saldoEventos[evName].valor = valor;
    saldoEventos[evName].ativo = true;
    if (!saldoEventos[evName].historico) saldoEventos[evName].historico = [];
    saldoEventos[evName].historico.push({ data: getToday(), valor: valor, por: un, registradoEm: new Date().toISOString() });
  } else {
    saldoEventos[evName] = entry;
  }
  saveSaldoEventos();
  closeNovoSaldoModal();
  alert('Monitoramento ativado para "' + evName + '"!');
}

// ── ATUALIZAR SALDO MODAL ──
function openAtualizarSaldoModal(evName) {
  document.getElementById('atualizarSaldoEvento').value = evName;
  document.getElementById('atualizarSaldoValor').value = '';
  var s = getSaldoDisponivel(evName);
  var info = document.getElementById('atualizarSaldoInfo');
  if (s && info) {
    info.innerHTML = '<b>' + evName + '</b><br>' +
      'Ultimo valor: ' + formatMoney(s.valor) + '<br>' +
      'Ja sacado: ' + formatMoney(s.sacado) + '<br>' +
      'Disponivel atual: <b>' + formatMoney(s.disponivel) + '</b>';
  }
  document.getElementById('atualizarSaldoModal').classList.add('open');
}
function closeAtualizarSaldoModal() { document.getElementById('atualizarSaldoModal').classList.remove('open'); }
function confirmarAtualizarSaldo() {
  var evName = document.getElementById('atualizarSaldoEvento').value;
  var valor = parseFloat(document.getElementById('atualizarSaldoValor').value);
  if (!valor || valor <= 0) { alert('Informe o valor.'); return; }
  var un = getCurrentUserName();
  if (!saldoEventos[evName]) saldoEventos[evName] = { ativo: true, historico: [] };
  saldoEventos[evName].valor = valor;
  if (!saldoEventos[evName].historico) saldoEventos[evName].historico = [];
  saldoEventos[evName].historico.push({ data: getToday(), valor: valor, por: un, registradoEm: new Date().toISOString() });
  saveSaldoEventos();
  closeAtualizarSaldoModal();
  renderSaldoEventoList();
}

// Hook saldo listener into startFirebaseListener
var _origSFLSaldo = startFirebaseListener;
startFirebaseListener = function() {
  _origSFLSaldo();
  startSaldoListener();
};

