// ═══════════════════════════════════════════
// UTILITARIOS
// ═══════════════════════════════════════════
function getToday(){return new Date().toISOString().split('T')[0];}
function addDays(d,n){var dt=new Date(d+'T00:00:00');dt.setDate(dt.getDate()+n);return dt.toISOString().split('T')[0];}
function getWeekRange(){var t=new Date(getToday()+'T00:00:00'),day=t.getDay(),mon=new Date(t);mon.setDate(t.getDate()+(day===0?-6:1-day));var sun=new Date(mon);sun.setDate(mon.getDate()+6);return{start:mon.toISOString().split('T')[0],end:sun.toISOString().split('T')[0]};}
function getMonthRange(){var t=new Date(getToday()+'T00:00:00'),f=new Date(t.getFullYear(),t.getMonth(),1),l=new Date(t.getFullYear(),t.getMonth()+1,0);return{start:f.toISOString().split('T')[0],end:l.toISOString().split('T')[0]};}
function formatDate(d){return d?new Date(d+'T00:00:00').toLocaleDateString('pt-BR'):'-';}
function formatDateTime(d){if(!d)return '-';try{var dt=new Date(d);return isNaN(dt.getTime())?d:dt.toLocaleString('pt-BR');}catch(e){return d;}}
function formatMoney(v){return 'R$ '+parseFloat(v||0).toFixed(2).replace('.',',');}

function parseMoney(str) {
  if (!str && str !== 0) return 0;
  var s = String(str).replace(/R\$\s*/g, '').trim();
  if (s === '') return 0;
  var hasDot = s.indexOf('.') !== -1;
  var hasComma = s.indexOf(',') !== -1;
  if (hasDot && hasComma) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    s = s.replace(',', '.');
  }
  return parseFloat(s) || 0;
}

function initMoneyInput(el) {
  if (el.dataset.moneyInit) return;
  el.dataset.moneyInit = '1';
  el.type = 'text';
  el.setAttribute('inputmode', 'decimal');
  if (el.value !== '') {
    var iv = parseMoney(el.value);
    el.value = iv.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  el.addEventListener('focus', function() {
    var v = parseMoney(this.value);
    this.value = v ? v.toFixed(2).replace('.', ',') : '';
    this.select();
  });
  el.addEventListener('blur', function() {
    var v = parseMoney(this.value);
    this.value = v ? v.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
  });
  el.addEventListener('input', function() {
    this.value = this.value.replace(/[^\d,.]/g, '');
  });
  if (document.activeElement === el) {
    var va = parseMoney(el.value);
    el.value = va ? va.toFixed(2).replace('.', ',') : '';
    try { el.select(); } catch(e2) {}
  }
}

function setMoneyValue(id, v) {
  var el = document.getElementById(id);
  if (!el) return;
  initMoneyInput(el);
  var n = parseMoney(String(v||0));
  el.value = n ? n.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
}

function applyMoneyInputs() {
  document.querySelectorAll('.money-input').forEach(function(el) { initMoneyInput(el); });
}

document.addEventListener('DOMContentLoaded', function() {
  applyMoneyInputs();
  document.addEventListener('focus', function(e) {
    if (e.target && e.target.classList && e.target.classList.contains('money-input')) {
      initMoneyInput(e.target);
    }
  }, true);
});
function getTipoLabel(tipo){
  var labels={'saque_evento':'Saque de evento','pagamento_funcionario':'Pag. funcionario','pagamento_servico':'Pag. servico','pagamento_boleto':'Pag. boleto','fornecedor':'Fornecedor','outros_saida':'Outros (saida)','recebimento_evento':'Recebimento evento','deposito':'Deposito','outros_entrada':'Outros (entrada)'};
  return labels[tipo]||tipo||'';
}
function hasDateOverlap(sA,eA,sB,eB){return sA<=eB&&eA>=sB;}
function machineIsInEvent(m, evFilt) {
  if (!evFilt) return true;
  if (m.reservations.some(function(r){ return r.event===evFilt; })) return true;
  var rs = getRealStatus(m);
  if (rs==='Em uso' || rs==='Em atraso') {
    for (var i=m.history.length-1; i>=0; i--) {
      if (m.history[i].type==='saida') {
        return m.history[i].event===evFilt;
      }
    }
  }
  return false;
}
function scrollToMachines(){setTimeout(function(){var el=document.getElementById('machineList');if(el)el.scrollIntoView({behavior:'smooth'});},300);}
function daysDiff(d){var today=new Date(getToday()+'T00:00:00');var target=new Date(d+'T00:00:00');return Math.floor((today-target)/(1000*60*60*24));}

function normalizeStatus(s) {
  if(!s) return 'Disponivel';
  if(s==='Disponível'||s==='Disponivel') return 'Disponivel';
  if(s==='Manutenção'||s==='Manutencao') return 'Manutencao';
  if(s==='Em uso') return 'Em uso';
  return s;
}
function getRealStatus(m) {
  var st = normalizeStatus(m.status);
  if(st==='Manutencao') return 'Manutencao';
  if(st==='Em uso') {
    var last=null;for(var i=m.history.length-1;i>=0;i--){if(m.history[i].type==='saida'){last=m.history[i];break;}}
    if(last&&last.endDate&&last.endDate<getToday()) return 'Em atraso';
    return 'Em uso';
  }
  var t=getToday();
  if(m.reservations&&m.reservations.some(function(r){return hasDateOverlap(r.startDate,r.endDate,t,t);})) return 'Reservada hoje';
  return 'Disponivel';
}
function getStatusClass(s){
  var n=normalizeStatus(s);
  if(n==='Disponivel')    return 'disponivel';
  if(n==='Em uso')        return 'em-uso';
  if(n==='Manutencao')    return 'manutencao';
  if(s==='Reservada hoje')return 'reservada-hoje';
  if(s==='Em atraso')     return 'em-atraso';
  return '';
}
function hasReservationConflict(m,s,e){return m.reservations.some(function(r){return hasDateOverlap(s,e,r.startDate,r.endDate);});}
function isBlockedForExit(m,s,e){
  var rs=getRealStatus(m);
  if(rs==='Em uso'||rs==='Em atraso') return 'Maquina ja esta em uso.';
  if(rs==='Manutencao') return 'Maquina em manutencao.';
  var c=m.reservations.find(function(r){return hasDateOverlap(s,e,r.startDate,r.endDate);});
  if(c) return 'Conflito com reserva: '+c.event+' ('+formatDate(c.startDate)+' ate '+formatDate(c.endDate)+')';
  return null;
}
function getSelectedBrands(name){return Array.from(document.querySelectorAll('input[name="'+name+'"]:checked')).map(function(i){return i.value;});}
