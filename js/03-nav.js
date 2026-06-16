// ═══════════════════════════════════════════
// BUSCA NOS SELECTS
// ═══════════════════════════════════════════
function filterSelectList(listId, query) {
  var items=document.querySelectorAll('#'+listId+' .machine-select-item');
  var q = query.toLowerCase().trim();
  items.forEach(function(item){
    var text=item.textContent.toLowerCase();
    item.style.display=(!q||text.indexOf(q)>-1)?'flex':'none';
  });
}
function filterEventSelect(selectId, query) {
  var sel=document.getElementById(selectId);
  if(!sel) return;
  Array.from(sel.options).forEach(function(opt){
    opt.style.display=(!query||opt.value===''||opt.text.toLowerCase().indexOf(query.toLowerCase())>-1)?'':'none';
  });
}

// ═══════════════════════════════════════════
// ABAS LOTE
// ═══════════════════════════════════════════
var LOTE_ABAS=['reservar','saida','entrada','renovar','cancelar','manutencao'];
function setLoteAba(aba){
  LOTE_ABAS.forEach(function(a){document.getElementById('lote-'+a).classList.toggle('active',a===aba);});
  document.querySelectorAll('.lote-tab-btn').forEach(function(btn,i){btn.classList.toggle('active',LOTE_ABAS[i]===aba);});
  if(aba==='reservar'&&reserveMode==='manual') refreshReserveMachineList();
  if(aba==='saida'&&exitMode==='manual')       refreshExitMachineList();
  if(aba==='entrada')   refreshEntradaEventos();
  if(aba==='renovar')   refreshRenovarEventos();
  if(aba==='cancelar')  refreshCancelarEventos();
  if(aba==='manutencao')refreshManutList();
}

// ═══════════════════════════════════════════
// NAVEGACAO POR PAGINAS
// ═══════════════════════════════════════════
var currentPage = 'inicio';
function setPage(page) {
  currentPage = page;
  ['inicio','maquinas','acoes','financeiro','recorrentes','fechamentos'].forEach(function(p){
    document.getElementById('page-'+p).classList.toggle('active', p===page);
  });
  document.querySelectorAll('.nav-btn').forEach(function(btn,i){
    btn.classList.toggle('active', ['inicio','maquinas','acoes','financeiro','recorrentes','fechamentos'][i]===page);
  });
  var fab = document.getElementById('fabCadastrar');
  if(fab) fab.style.display = page==='maquinas' ? 'flex' : 'none';
  if(page==='inicio' && typeof renderReservasIntencao==='function') renderReservasIntencao();
  if(page==='maquinas') renderMachines();
  if(page==='financeiro') { refreshFinEventos(); renderPendentes(); renderExtrato(); renderSaldoEventoList(); }
  if(page==='recorrentes') { renderRecPainel(); }
}

// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// AUTOCOMPLETE DE EVENTOS
// ═══════════════════════════════════════════
function getEventSuggestions(query) {
  var all = getAllEvents ? getAllEvents() : getEvents();
  if (!all || !all.length) return [];
  query = (query||'').toLowerCase().trim();
  if (!query) return all.slice(0,8);
  return all.filter(function(e){ return e.toLowerCase().indexOf(query) > -1; }).slice(0,10);
}

function showAutocomplete(input, listId) {
  var list = document.getElementById(listId);
  if (!list) return;
  var suggestions = getEventSuggestions(input.value);
  if (!suggestions.length) { list.classList.remove('open'); return; }
  list.innerHTML = '';
  suggestions.forEach(function(ev) {
    var item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.textContent = ev;
    item.setAttribute('data-value', ev);
    item.addEventListener('mousedown', function(e) {
      e.preventDefault();
      selectAutocompleteItem(list, ev);
    });
    list.appendChild(item);
  });
  list.classList.add('open');
}

function selectAutocompleteItem(list, value) {
  if (!list) return;
  var input = list.previousElementSibling;
  if (input) {
    input.value = value;
    input.dispatchEvent(new Event('change'));
    autoFillFromEventHistory(input.id, value);
  }
  list.classList.remove('open');
}
function selectAutocomplete(listId, value) {
  selectAutocompleteItem(document.getElementById(listId), value);
}

function hideAutocomplete(listId) {
  var list = document.getElementById(listId);
  if (list) list.classList.remove('open');
}

function handleAutocompleteKey(event, listId) {
  var list = document.getElementById(listId);
  if (!list || !list.classList.contains('open')) return;
  var items = list.querySelectorAll('.autocomplete-item');
  var selected = list.querySelector('.autocomplete-item.selected');
  var idx = -1;
  items.forEach(function(item, i){ if(item===selected) idx=i; });

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (selected) selected.classList.remove('selected');
    var next = items[idx+1] || items[0];
    if (next) next.classList.add('selected');
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (selected) selected.classList.remove('selected');
    var prev = items[idx-1] || items[items.length-1];
    if (prev) prev.classList.add('selected');
  } else if (event.key === 'Enter') {
    if (selected) {
      event.preventDefault();
      selectAutocompleteItem(list, selected.getAttribute('data-value'));
    }
  } else if (event.key === 'Escape') {
    hideAutocomplete(listId);
  }
}

function autoFillFromEventHistory(fieldId, eventName) {
  // Find city and responsible from last history entry with this event
  var cityMap = {
    'batchEvent':    { city:'batchCity',        resp:'batchResponsible' },
    'batchExitEvent':{ city:'batchExitCity',     resp:'batchExitResponsible' },
    'exitEvent':     { city:'exitCity',          resp:'exitResponsible' },
  };
  var map = cityMap[fieldId];
  if (!map) return;
  // Search history for last entry with this event name
  var cityEl = document.getElementById(map.city);
  var respEl = document.getElementById(map.resp);
  if ((!cityEl || cityEl.value) && (!respEl || respEl.value)) return; // already filled
  for (var i = 0; i < machines.length; i++) {
    var m = machines[i];
    for (var j = (m.history||[]).length-1; j >= 0; j--) {
      var h = m.history[j];
      if (h.event === eventName) {
        if (cityEl && !cityEl.value && h.city) cityEl.value = h.city;
        if (respEl && !respEl.value && h.responsible) respEl.value = h.responsible;
        return;
      }
    }
    for (var k = (m.reservations||[]).length-1; k >= 0; k--) {
      var r = m.reservations[k];
      if (r.event === eventName) {
        if (cityEl && !cityEl.value && r.city) cityEl.value = r.city;
        if (respEl && !respEl.value && r.responsible) respEl.value = r.responsible;
        return;
      }
    }
  }
}

// Show suggestions on focus (click) even when empty
document.addEventListener('click', function(e) {
  var input = e.target;
  if (!input || input.tagName !== 'INPUT') return;
  var listId = null;
  if (input.id === 'batchEvent') listId = 'batchEvent-list';
  else if (input.id === 'batchExitEvent') listId = 'batchExitEvent-list';
  else if (input.id === 'exitEvent') listId = 'exitEvent-list';
  else if (input.id === 'reserveEvent') listId = 'reserveEvent-list';
  if (listId) showAutocomplete(input, listId);
});

