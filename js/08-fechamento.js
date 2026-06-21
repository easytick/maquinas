// ═══════════════════════════════════════════
function setFechTab(tab) {
  document.querySelectorAll('#page-fechamentos .lote-tab-btn').forEach(function(b,i){
    b.classList.toggle('active', (i===0&&tab==='novo')||(i===1&&tab==='historico')||(i===2&&tab==='festivals'));
  });
  document.getElementById('fech-novo').classList.toggle('active', tab==='novo');
  document.getElementById('fech-historico').classList.toggle('active', tab==='historico');
  var festTab = document.getElementById('fech-festivals');
  if (festTab) festTab.classList.toggle('active', tab==='festivals');
  if (tab === 'historico') renderFechHistorico();
  if (tab === 'festivals') renderFestHistorico();
}

function fechVoltarPasso1() {
  limparEstadoFechamento();
  document.getElementById('fech-passo1').style.display = 'block';
  document.getElementById('fech-passo2').style.display = 'none';
  document.getElementById('fech-passo3').style.display = 'none';
}
function fechVoltarPasso2() {
  document.getElementById('fech-passo2').style.display = 'block';
  document.getElementById('fech-passo3').style.display = 'none';
}

// ── MODO: RELATORIO vs MANUAL ──
function setFechModo(modo) {
  var isRel = modo === 'relatorio';
  document.getElementById('fech-modo-relatorio').style.display = isRel ? 'block' : 'none';
  document.getElementById('fech-modo-manual').style.display = isRel ? 'none' : 'block';
  document.getElementById('fech-modo-festival').style.display = 'none';
  document.getElementById('btn-modo-relatorio').style.borderColor = isRel ? 'var(--blue)' : 'var(--border)';
  document.getElementById('btn-modo-relatorio').style.background  = isRel ? '#eef6ff' : '#f9fafb';
  document.getElementById('btn-modo-relatorio').style.color       = isRel ? 'var(--blue)' : '#6b7280';
  document.getElementById('btn-modo-relatorio').style.fontWeight  = isRel ? 'bold' : 'normal';
  document.getElementById('btn-modo-manual').style.borderColor    = isRel ? 'var(--border)' : 'var(--blue)';
  document.getElementById('btn-modo-manual').style.background     = isRel ? '#f9fafb' : '#eef6ff';
  document.getElementById('btn-modo-manual').style.color          = isRel ? '#6b7280' : 'var(--blue)';
  document.getElementById('btn-modo-manual').style.fontWeight     = isRel ? 'normal' : 'bold';
  document.getElementById('btn-modo-festival').style.borderColor  = 'var(--border)';
  document.getElementById('btn-modo-festival').style.background   = '#f9fafb';
  document.getElementById('btn-modo-festival').style.color        = '#6b7280';
  document.getElementById('btn-modo-festival').style.fontWeight   = 'normal';
}

var _fechTipoManual = 'ficha';
var _fechPdvCounter = 0;

function setFechTipoManual(tipo) {
  _fechTipoManual = tipo;
  ['ficha','ingresso'].forEach(function(t) {
    var btn = document.getElementById('btn-tipo-' + t);
    var active = t === tipo;
    btn.style.borderColor = active ? 'var(--blue)' : 'var(--border)';
    btn.style.background  = active ? '#eef6ff' : '#f9fafb';
    btn.style.color       = active ? 'var(--blue)' : '#6b7280';
    btn.style.fontWeight  = active ? 'bold' : 'normal';
  });
  renderManualForm();
  document.getElementById('fech-manual-form').style.display = 'block';
}

function renderManualForm() {
  var tipo = _fechTipoManual;
  var formasDiv = document.getElementById('fech-manual-formas');
  var pdvDiv = document.getElementById('fech-manual-pdvs');
  var pdvLabel = document.getElementById('fech-manual-pdv-label');

  var formas = ['Debito','Credito','Pix','Dinheiro'];
  formasDiv.innerHTML = formas.map(function(f) {
    var isDin = f === 'Dinheiro';
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">' +
      '<span style="flex:1;font-size:13px;color:#374151">' + f + (isDin ? ' 💵' : '') + '</span>' +
      '<span style="font-size:12px;color:#6b7280">R$</span>' +
      '<input type="text" class="money-input" id="manual-forma-'+f.toLowerCase()+'" placeholder="0,00" ' +
      'onchange="recalcManualTotal()" ' +
      'style="width:110px;font-size:13px;padding:5px 8px;border:1.5px solid var(--border);border-radius:7px;text-align:right">' +
    '</div>';
  }).join('');

  pdvLabel.textContent = tipo === 'ingresso' ? 'Revendedores / Loja Virtual' : 'PDVs';
  _fechPdvCounter = 0;
  pdvDiv.innerHTML = '';
  fechAddPdv(); // começa com 1 PDV

  document.getElementById('fech-manual-total') && (document.getElementById('fech-manual-total').textContent = 'R$ 0,00');
  applyMoneyInputs();
}

function fechAddPdv() {
  _fechPdvCounter++;
  var div = document.getElementById('fech-manual-pdvs');
  var id = 'manual-pdv-' + _fechPdvCounter;
  var row = document.createElement('div');
  row.id = 'row-' + id;  // row-manual-pdv-N
  row.style.cssText = 'display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;margin-bottom:6px';
  row.innerHTML =
    '<input type="text" id="nome-'+id+'" placeholder="Nome do PDV" style="font-size:13px;padding:6px 8px">' +
    '<input type="text" class="money-input" id="val-'+id+'" placeholder="0,00" onchange="recalcManualTotal()" style="width:100px;font-size:13px;padding:6px 8px;text-align:right">' +
    '<button type="button" onclick="this.parentElement.remove();recalcManualTotal()" ' +
    'style="width:auto;padding:6px 10px;background:#fee2e2;color:#991b1b;border:none;border-radius:7px;font-size:12px;cursor:pointer">✕</button>';
  div.appendChild(row);
  initMoneyInput(document.getElementById('val-'+id));
}

function recalcManualTotal() {
  var total = 0;
  ['debito','credito','pix','dinheiro'].forEach(function(f) {
    var el = document.getElementById('manual-forma-' + f);
    if (el) total += parseMoney(el.value) || 0;
  });
  var el = document.getElementById('fech-manual-total');
  if (el) el.textContent = formatMoney(total);
}

function confirmarManual() {
  var formasNomes = ['Debito','Credito','Pix','Dinheiro'];
  var formas = {};
  var totalGeral = 0;
  formasNomes.forEach(function(f) {
    var el = document.getElementById('manual-forma-' + f.toLowerCase());
    var v = el ? (parseMoney(el.value)||0) : 0;
    formas[f] = { qtd: 0, valor: v };
    totalGeral += v;
  });

  var pdvDiv2 = document.getElementById('fech-manual-pdvs');
  var pdvs = {};
  pdvDiv2.querySelectorAll('div[id^="row-manual-pdv-"]').forEach(function(row) {
    var nEl = row.querySelector('input[type="text"]:not(.money-input)');
    var vEl = row.querySelector('.money-input');
    if (!nEl || !vEl) return;
    var nome = nEl.value.trim() || 'PDV';
    var val = parseMoney(vEl.value)||0;
    if (nome || val) pdvs[nome] = { qtd: 0, valor: val };
  });

  var dinheiro = formas['Dinheiro'] ? formas['Dinheiro'].valor : 0;

  window._fechDados = {
    tipo: _fechTipoManual,
    formas: formas,
    pdvs: pdvs,
    totalGeral: totalGeral,
    totalQtd: 0,
    dinheiro: dinheiro
  };
  window._fechFormasMap = {};
  formasNomes.forEach(function(f){
    window._fechFormasMap[f] = 'manual-forma-' + f.toLowerCase();
  });

  renderDadosLidos();
  window._fechParams = {};
  renderCobrancas();
  // Busca automática de saques pelo nome do evento (já preenchido no passo 1)
  var evInput = document.getElementById('fechEvento');
  if (evInput && evInput.value.trim()) {
    inicializarSaquesAuto(evInput.value.trim());
  }
  document.getElementById('fech-passo1').style.display = 'none';
  document.getElementById('fech-passo2').style.display = 'block';
}

// ── PARSER RELATORIO ──
// regex que aceita linha de total com ou sem colunas extras (ingresso tem: qtd  R$ val  qtd2  R$ val2)
function limparEstadoFechamento() {
  window._fechDados   = null;
  window._fechParams  = null;
  window._fechLinhas  = null;
  window._fechFormasMap = {};
  window._fechValorFinal = 0;
  window._fechTotalCobranças = 0;
  window._fechTotalSaques = 0;
  window._fechSaquesSelecionados = [];
  window._festOperacoes = [];
  window._festTotalRepasses = 0;
  window._fechTotalARepassar = 0;
  // Limpa listas visuais
  ['fechFormasList','fechPdvList','fechCobrancasList','fechResumoLinhas'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.innerHTML = '';
  });
  var tb = document.getElementById('fechTotalBruto'); if(tb) tb.innerHTML = 'R$ 0,00';
  var vf = document.getElementById('fechValorFinal'); if(vf) vf.textContent = 'R$ 0,00';
  // Limpa festival
  var festLista = document.getElementById('fest-ops-lista');
  if (festLista) festLista.innerHTML = '';
  var festGT = document.getElementById('fest-grand-total');
  if (festGT) festGT.textContent = 'R$ 0,00';
  var festSec = document.getElementById('fest-repasses-section');
  if (festSec) festSec.style.display = 'none';
  var festRpLista = document.getElementById('fest-repasses-lista');
  if (festRpLista) festRpLista.innerHTML = '';
  var festRpTot = document.getElementById('fest-repasses-total');
  if (festRpTot) festRpTot.textContent = 'R$ 0,00';
  var lbl = document.getElementById('fechValorFinalLabel');
  if (lbl) lbl.textContent = 'Valor a repassar ao produtor';
}

function matchTotalLinha(linha) {
  // Aceita qtd com ponto de milhar: "1.566", "3.695"
  // Para ingresso COM desconto: qtd  R$ValorIngresso  R$Desconto  R$ValorLiq  ...
  //   → pega ValorLiq (3° R$) que é o valor real após cupons
  // Para ingresso SEM desconto: qtd  R$Valor  qtd2  R$Valor2
  //   → pega 1° R$
  // Para ficha: qtd  R$Valor
  //   → pega 1° R$
  var l = linha.trim();
  // Tenta formato com desconto (3 valores R$ antes do qtd validado)
  var mDesc = l.match(/^([\d.]+)\s+R\$\s*[\d.,]+\s+R\$\s*[\d.,]+\s+R\$\s*([\d.,]+)/);
  if (mDesc) return { qtd: parseInt(mDesc[1].replace(/\./g,'')), valor: parseMoney(mDesc[2]) };
  // Formato padrao
  var m = l.match(/^([\d.]+)\s+R\$\s*([\d.,]+)/);
  if (!m) return null;
  return { qtd: parseInt(m[1].replace(/\./g,'')), valor: parseMoney(m[2]) };
}

function setFechTipoRelatorio(tipo) {
  var isFicha = tipo === 'ficha';
  document.getElementById('fech-campo-ficha').style.display = isFicha ? 'block' : 'none';
  document.getElementById('fech-campo-ingresso').style.display = isFicha ? 'none' : 'block';
  document.getElementById('btn-rel-ficha').style.borderColor = isFicha ? 'var(--blue)' : 'var(--border)';
  document.getElementById('btn-rel-ficha').style.background = isFicha ? '#eef6ff' : '#f9fafb';
  document.getElementById('btn-rel-ficha').style.color = isFicha ? 'var(--blue)' : '#6b7280';
  document.getElementById('btn-rel-ingresso').style.borderColor = isFicha ? 'var(--border)' : 'var(--blue)';
  document.getElementById('btn-rel-ingresso').style.background = isFicha ? '#f9fafb' : '#eef6ff';
  document.getElementById('btn-rel-ingresso').style.color = isFicha ? '#6b7280' : 'var(--blue)';
  window._fechTipoRelatorio = tipo;
}

// Extrai dados de um texto de relatório (ficha ou ingresso)
function extrairDadosRelatorio(texto) {
  if (!texto || !texto.trim()) return null;
  var tipo = 'ficha';
  if (/Ingressos:/i.test(texto) || /Agrupado por Lote/i.test(texto) || /Agrupado por Revendedor/i.test(texto)) tipo = 'ingresso';

  // Total geral — captura bruto, desconto e líquido
  var secaoProduto = tipo === 'ficha'
    ? (texto.split(/Agrupado por Produto/i)[1]||'').split(/Agrupado por/i)[0]
    : (texto.split(/Agrupado por Lote/i)[1]||'').split(/Agrupado por/i)[0];
  var totalGeral = 0, totalBruto = 0, totalDesconto = 0, totalQtd = 0;
  var linhasProd = secaoProduto.split('\n');
  for (var k = linhasProd.length - 1; k >= 0; k--) {
    var lk = linhasProd[k].trim();
    // Tenta capturar bruto + desconto + liquido numa linha só
    var mFull = lk.match(/^([\d.]+)\s+R\$\s*([\d.,]+)\s+R\$\s*([\d.,]+)\s+R\$\s*([\d.,]+)/);
    if (mFull && parseInt(mFull[1].replace(/\./g,'')) > 1) {
      totalQtd     = parseInt(mFull[1].replace(/\./g,''));
      totalBruto   = parseMoney(mFull[2]);
      totalDesconto= parseMoney(mFull[3]);
      totalGeral   = parseMoney(mFull[4]); // Valor Liq.
      break;
    }
    var mt = matchTotalLinha(lk);
    if (mt && mt.qtd > 1) { totalQtd = mt.qtd; totalGeral = mt.valor; totalBruto = mt.valor; break; }
  }
  if (totalGeral === 0) {
    for (var k2 = linhasProd.length - 1; k2 >= 0; k2--) {
      var mt2 = matchTotalLinha(linhasProd[k2].trim());
      if (mt2) { totalQtd = mt2.qtd; totalGeral = mt2.valor; totalBruto = mt2.valor; break; }
    }
  }
  if (!totalBruto) totalBruto = totalGeral;

  // Formas de pagamento
  var formas = {};
  var secaoForma = texto.split(/Agrupado por Forma\s*Pagamento/i)[1] || '';
  var formaAtual = null;
  secaoForma.split('\n').forEach(function(linha) {
    linha = linha.trim(); if (!linha) return;
    if (/^(Lote|Unitário|Produto|Preço|Total|Valor|Forma|Desconto)/i.test(linha) && !/^(Déb|Deb|Cré|Cre|Pix|Din|Bol|Não|Nao)/i.test(linha)) return;
    var isForma = /^(Déb|Deb|Cré|Cre|Pix|Din|Bol|Não\s*inf|Nao\s*inf)/i.test(linha) && !/R\$/.test(linha);
    if (isForma) { formaAtual = linha.replace(/\s+/g,' ').trim(); formas[formaAtual] = {qtd:0,valor:0}; return; }
    if (formaAtual) {
      var m = matchTotalLinha(linha);
      if (m) { formas[formaAtual].qtd = m.qtd; formas[formaAtual].valor = m.valor; formaAtual = null; }
    }
  });

  // PDVs / Revendedores
  var pdvs = {};
  var secaoPdv = tipo === 'ficha'
    ? (texto.split(/Agrupado por Ponto de Venda/i)[1]||'').split(/Agrupado por Forma/i)[0]
    : (texto.split(/Agrupado por Revendedor/i)[1]||'').split(/Agrupado por Forma/i)[0];
  var pdvAtual = null;
  secaoPdv.split('\n').forEach(function(lp) {
    lp = lp.trim(); if (!lp) return;
    if (/^(Lote|Unitário|Produto|Preço|Total|Valor|Revendedor|Ponto|Desconto)/i.test(lp)) return;
    if (/^PDV\s/i.test(lp) || /^Loja Virtual/i.test(lp)) { pdvAtual = lp; pdvs[pdvAtual] = {qtd:0,valor:0}; return; }
    // Revendedor = qualquer nome que não seja cabeçalho nem PDV
    if (!pdvAtual && lp && !/R\$/.test(lp) && lp.length > 2 && !/^\d/.test(lp)) { pdvAtual = lp; pdvs[pdvAtual] = {qtd:0,valor:0}; return; }
    if (pdvAtual) {
      var m = matchTotalLinha(lp);
      if (m) { pdvs[pdvAtual].qtd = m.qtd; pdvs[pdvAtual].valor = m.valor; pdvAtual = null; }
    }
  });

  // Fallback total
  var somaPdvs = 0; Object.keys(pdvs).forEach(function(p){ somaPdvs += pdvs[p].valor; });
  var somaFormas = 0; Object.keys(formas).forEach(function(f){ somaFormas += formas[f].valor; });
  if (somaPdvs > totalGeral) totalGeral = somaPdvs;
  if (somaFormas > totalGeral) totalGeral = somaFormas;

  // Detecta origem
  var origem = 'geral';
  if (/Origem:\s*Loja\s*virtual/i.test(texto)) origem = 'loja';
  else if (/Origem:\s*Aplicativo/i.test(texto)) origem = 'app';

  return { tipo:tipo, formas:formas, pdvs:pdvs, totalGeral:totalGeral, totalBruto:totalBruto, totalDesconto:totalDesconto, totalQtd:totalQtd, origem:origem };
}

function parsearRelatorio() {
  limparEstadoFechamento();
  var erro = document.getElementById('fechErro');
  erro.style.display = 'none';
  var tipoRel = window._fechTipoRelatorio || 'ficha';

  if (tipoRel === 'ficha') {
    var texto = document.getElementById('fechRelatorioTexto').value.trim();
    if (!texto) { erro.textContent = 'Cole o texto do relatorio de ficha antes de continuar.'; erro.style.display = 'block'; return; }
    var dados = extrairDadosRelatorio(texto);
    if (!dados || dados.totalGeral === 0) { erro.textContent = 'Nao foi possivel ler o relatorio.'; erro.style.display = 'block'; return; }
    var dinheiro = 0;
    Object.keys(dados.formas).forEach(function(f){ if(/dinheiro/i.test(f)) dinheiro = dados.formas[f].valor; });
    window._fechDados = { tipo:'ficha', formas:dados.formas, pdvs:dados.pdvs, totalGeral:dados.totalGeral, totalQtd:dados.totalQtd, dinheiro:dinheiro };

  } else {
    // INGRESSO: dois relatórios
    var textoLoja = document.getElementById('fechRelatorioLoja').value.trim();
    var textoApp  = document.getElementById('fechRelatorioApp').value.trim();
    if (!textoLoja && !textoApp) { erro.textContent = 'Cole ao menos um dos relatorios de ingresso.'; erro.style.display = 'block'; return; }

    var dadosLoja = textoLoja ? extrairDadosRelatorio(textoLoja) : null;
    var dadosApp  = textoApp  ? extrairDadosRelatorio(textoApp)  : null;

    // Loja Virtual: tudo que entrou pelo site (base do repasse)
    var totalLoja = dadosLoja ? dadosLoja.totalGeral : 0;
    var formasLoja = dadosLoja ? dadosLoja.formas : {};

    // Aplicativo: separa "Não informado" (digital, fica c/ produtor) de formas com pagamento (PDV físico)
    var totalApp = dadosApp ? dadosApp.totalGeral : 0;
    var formasApp = dadosApp ? dadosApp.formas : {};
    var totalDigital = 0; // não informado = app/whatsapp = fica c/ produtor
    var formasPdv = {};   // débito/crédito/pix do app = PDV físico

    Object.keys(formasApp).forEach(function(f) {
      if (/n.o\s*inf/i.test(f) || /nao\s*inf/i.test(f) || /não\s*inf/i.test(f)) {
        totalDigital += formasApp[f].valor;
      } else {
        formasPdv[f] = formasApp[f];
      }
    });

    // Monta formas consolidadas para exibição
    var formasConsolidadas = {};
    // Loja virtual como forma
    if (totalLoja > 0) formasConsolidadas['Loja Virtual'] = { qtd: dadosLoja ? dadosLoja.totalQtd : 0, valor: totalLoja, _isLoja: true };
    // Digital (app) como dinheiro do produtor
    if (totalDigital > 0) formasConsolidadas['Digital (App/WhatsApp)'] = { qtd: 0, valor: totalDigital, _isDigital: true };
    // PDV físico por forma
    Object.keys(formasPdv).forEach(function(f) {
      formasConsolidadas['PDV - ' + f] = formasPdv[f];
    });

    var totalPdv = 0;
    Object.keys(formasPdv).forEach(function(f){ totalPdv += formasPdv[f].valor; });
    // Total geral = Loja Virtual líquido + Digital + PDV físico
    var totalGeral = totalLoja + totalDigital + totalPdv;

    // Validação: LV + Digital + PDV deve bater com totalGeral
    window._fechValidacao = {
      loja: totalLoja,
      digital: totalDigital,
      pdv: totalPdv,
      total: totalGeral
    };

    // PDVs revendedores da loja
    var pdvs = dadosLoja ? dadosLoja.pdvs : {};
    if (dadosApp && dadosApp.pdvs) {
      Object.keys(dadosApp.pdvs).forEach(function(p){
        if (!pdvs[p]) pdvs[p] = dadosApp.pdvs[p];
      });
    }

    window._fechDados = {
      tipo: 'ingresso',
      formas: formasConsolidadas,
      formasLoja: formasLoja,
      formasPdv: formasPdv,
      totalDigital: totalDigital,
      pdvs: pdvs,
      totalGeral: totalGeral,
      totalBruto: dadosLoja ? (dadosLoja.totalBruto||dadosLoja.totalGeral) : totalGeral,
      totalDesconto: dadosLoja ? (dadosLoja.totalDesconto||0) : 0,
      totalLoja: totalLoja,
      totalPdv: totalPdv,
      totalQtd: (dadosLoja ? dadosLoja.totalQtd : 0) + (dadosApp ? dadosApp.totalQtd : 0),
      dinheiro: totalDigital  // digital fica c/ produtor, como dinheiro
    };
  }

  renderDadosLidos();
  window._fechParams = {};
  renderCobrancas();
  var evInput = document.getElementById('fechEvento');
  if (evInput && evInput.value.trim()) {
    inicializarSaquesAuto(evInput.value.trim());
  }
  document.getElementById('fech-passo1').style.display = 'none';
  document.getElementById('fech-passo2').style.display = 'block';
}

// Atualiza _fechDados quando usuário edita os campos de vendas
function fechRecalcFormas(dinheiroOverride) {
  var d = window._fechDados;
  if (!d) return;
  var map = window._fechFormasMap || {};
  var dinheiro = 0, totalGeral = 0;
  // Atualiza formas a partir dos inputs
  Object.keys(map).forEach(function(f) {
    var el = document.getElementById(map[f]);
    if (el) {
      var v = parseMoney(el.value)||0;
      d.formas[f].valor = v;
      totalGeral += v;
      if (/dinheiro/i.test(f)) dinheiro = v;
    }
  });
  // Atualiza total bruto com a soma das formas
  var tbInput = document.getElementById('fechTotalBrutoInput');
  if (tbInput) tbInput.value = totalGeral.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
  d.totalGeral = totalGeral;
  d.dinheiro = (dinheiroOverride !== undefined) ? dinheiroOverride : dinheiro;
  // Atualiza aviso dinheiro
  var dinEl = document.getElementById('fechValorDinheiro');
  if (dinEl) dinEl.textContent = d.dinheiro.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  recalcFech();
}

function fechAtualizarTotal() {
  fechRecalcFormas();
}

// ── RENDER DADOS LIDOS (usado por relatorio e manual) ──
function renderDadosLidos() {
  var d = window._fechDados;
  if (!d) return;

  document.getElementById('fechTipoBadge').innerHTML = d.tipo === 'ficha'
    ? '<span style="background:#dcfce7;color:#166534;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:bold">🍺 Ficha</span>'
    : d.tipo === 'festival'
    ? '<span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:bold">🎪 Festival</span>'
    : '<span style="background:#dbeafe;color:#1e40af;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:bold">🎟️ Ingresso</span>';

  // Total — para ingresso mostra loja + digital + pdv
  var tbEl = document.getElementById('fechTotalBruto');
  if (d.tipo === 'ingresso') {
    var linhasTotal = '<div>Total líquido: <b style="color:var(--blue);font-size:15px">' + formatMoney(d.totalGeral) + '</b></div>';
    linhasTotal += '<div style="font-size:11px;color:#6b7280">Loja Virtual: ' + formatMoney(d.totalLoja||0);
    if (d.totalDesconto > 0) linhasTotal += ' <span style="color:#dc2626">(cupons: -' + formatMoney(d.totalDesconto) + ')</span>';
    linhasTotal += '</div>';
    if ((d.totalDigital||0) > 0) linhasTotal += '<div style="font-size:11px;color:#92400e">Digital/App (produtor): ' + formatMoney(d.totalDigital||0) + '</div>';
    if ((d.totalPdv||0) > 0)     linhasTotal += '<div style="font-size:11px;color:#374151">PDV físico: ' + formatMoney(d.totalPdv||0) + '</div>';
    tbEl.innerHTML = '<div style="text-align:right;line-height:1.8">' + linhasTotal + '</div>';
  } else {
    tbEl.innerHTML = '<input type="text" readonly id="fechTotalBrutoInput" value="'+d.totalGeral.toFixed(2)+'" style="width:130px;font-size:15px;font-weight:bold;color:var(--blue);border:1.5px solid var(--blue);border-radius:7px;padding:4px 8px;text-align:right;background:#f0f7ff;cursor:default">';
  }

  // Formas editáveis
  var formasList = document.getElementById('fechFormasList');
  formasList.innerHTML = '';
  window._fechFormasMap = {};
  var dinheiro = d.dinheiro || 0;

  Object.keys(d.formas).forEach(function(f) {
    var v = d.formas[f];
    var isDigital = v._isDigital;
    var isLoja = v._isLoja;
    var isDin = /dinheiro/i.test(f);
    var isRed = isDigital || isDin;

    var fId = 'fv-' + f.replace(/\s/g,'_').replace(/[^a-zA-Z0-9_]/g,'');
    window._fechFormasMap[f] = fId;

    var row = document.createElement('div');
    var bgColor = isDigital ? '#fef3c7' : isLoja ? '#eff6ff' : '';
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid var(--border);font-size:12px;gap:8px;' + (bgColor ? 'background:'+bgColor+';border-radius:6px;' : '');

    var icon = isDigital ? '📱 ' : isLoja ? '🌐 ' : '';
    var suffix = isDigital ? ' <span style="font-size:10px;color:#92400e;font-weight:bold">fica c/ produtor</span>' : '';

    row.innerHTML = '<span style="color:#374151;flex:1">' + icon + f + (v.qtd ? ' <span style="color:#9ca3af">('+v.qtd+')</span>' : '') + suffix + '</span>' +
      '<input type="text" class="money-input" id="'+fId+'" value="'+v.valor.toFixed(2)+'" onchange="fechRecalcFormas()" ' +
      'style="width:110px;font-size:12px;font-weight:bold;color:'+(isRed?'#92400e':'#1f2937')+';border:1px solid var(--border);border-radius:6px;padding:3px 6px;text-align:right">' +
      (isRed ? '<span style="font-size:14px">💵</span>' : '');
    formasList.appendChild(row);
  });

  // Validação ingresso: LV + App = Total
  if (d.tipo === 'ingresso' && window._fechValidacao) {
    var val = window._fechValidacao;
    var soma = val.loja + val.digital + val.pdv;
    var bate = Math.abs(soma - val.total) < 0.01;
    var validEl = document.createElement('div');
    validEl.style.cssText = 'margin-top:8px;padding:8px 10px;border-radius:8px;font-size:12px;font-weight:bold;' +
      (bate ? 'background:#dcfce7;color:#166534;' : 'background:#fef3c7;color:#92400e;');
    validEl.innerHTML = (bate ? '✅ ' : '⚠️ ') +
      'Loja Virtual (' + formatMoney(val.loja) + ') + Digital (' + formatMoney(val.digital) + ')' +
      (val.pdv > 0 ? ' + PDV (' + formatMoney(val.pdv) + ')' : '') +
      ' = ' + formatMoney(soma) +
      (bate ? ' — confere!' : ' — diverge do total (' + formatMoney(val.total) + ')');
    formasList.appendChild(validEl);
  }

  // PDVs / Revendedores
  var pdvList = document.getElementById('fechPdvList');
  pdvList.innerHTML = '';
  document.getElementById('fechPdvLabel').textContent = d.tipo === 'ingresso' ? 'Por Revendedor / Loja Virtual' : 'Por PDV';
  Object.keys(d.pdvs).forEach(function(p) {
    var v = d.pdvs[p], isLoja = /loja virtual/i.test(p);
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px';
    row.innerHTML = '<span>' + (isLoja?'🌐 ':'👤 ') + p + '</span><b>' + formatMoney(v.valor) + (v.qtd ? ' <span style="color:#9ca3af;font-size:11px">('+v.qtd+')</span>' : '') + '</b>';
    pdvList.appendChild(row);
  });

  // Aviso dinheiro/digital
  var dinLabel = d.tipo === 'ingresso' ? (d.totalDigital||0) : dinheiro;
  document.getElementById('fechValorDinheiro').textContent = dinLabel.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  d.dinheiro = d.tipo === 'ingresso' ? (d.totalDigital||0) : dinheiro;
  applyMoneyInputs();
}

// ── PARSER ORÇAMENTO ──
// Extrai primeiro número válido de uma linha que casa com regex
function extrairValorTexto(texto, regex) {
  var m = texto.match(regex);
  if (!m) return 0;
  // Pega o primeiro grupo que não seja undefined
  for (var i = 1; i < m.length; i++) {
    if (m[i] !== undefined) return parseMoney(m[i]);
  }
  return 0;
}
function extrairPctTexto(texto, regex) {
  var m = texto.match(regex);
  if (!m) return 0;
  for (var i = 1; i < m.length; i++) {
    if (m[i] !== undefined) return parseFloat(m[i].replace(',','.')) || 0;
  }
  return 0;
}

function parsearOrcamento() {
  try {
    var texto = document.getElementById('fechOrcamentoTexto').value.trim();
    if (!texto) { alert('Cole o texto do orcamento antes de importar.'); return; }
    var d = window._fechDados;
    if (!d) { alert('Leia o relatorio antes de importar o orcamento.'); return; }

    var p = {};

    if (d.tipo === 'ficha') {
      // PDV: "R$89,90/ por terminal" ou "89,90 por terminal"
      p.pdvValor   = extrairValorTexto(texto, /R?\$\s*([\d.,]+)[^\n]*terminal/i) || extrairValorTexto(texto, /terminal[^\n]*R?\$\s*([\d.,]+)/i) || 89.90;
      // Taxas: "2,0% no débito" ou "débito: 2%" etc
      p.pctDebito  = extrairPctTexto(texto, /d[eé]b[^\n]*([\d,]+)\s*%/i) || extrairPctTexto(texto, /([\d,]+)\s*%[^\n]*d[eé]b/i) || 2.0;
      p.pctCredito = extrairPctTexto(texto, /cr[eé]d[^\n]*([\d,]+)\s*%/i) || extrairPctTexto(texto, /([\d,]+)\s*%[^\n]*cr[eé]d/i) || 4.0;
      p.pctPix     = extrairPctTexto(texto, /pix[^\n]*([\d,]+)\s*%/i)     || extrairPctTexto(texto, /([\d,]+)\s*%[^\n]*pix/i)     || 1.5;
      // Despesas
      p.tecnicoVal  = extrairValorTexto(texto, /t[eé]cnico[^\n]*R?\$\s*([\d.,]+)/i)  || extrairValorTexto(texto, /R?\$\s*([\d.,]+)[^\n]*t[eé]cnico/i)  || 200;
      p.operadorVal = extrairValorTexto(texto, /operador[^\n]*R?\$\s*([\d.,]+)/i)     || extrairValorTexto(texto, /R?\$\s*([\d.,]+)[^\n]*operador/i)     || 180;
      var deslTxt = (texto.match(/desloc[^\n]*/i)||[''])[0];
      p.desl = /calcular|combinar|definir|a calcular/i.test(deslTxt) ? 0 : (extrairValorTexto(texto, /desloc[^\n]*R?\$\s*([\d.,]+)/i) || 0);

    } else {
      // INGRESSO
      p.ativacao   = extrairValorTexto(texto, /ativa[çc][aã]o[^\n]*?(\d[\d.,]*)/i) || extrairValorTexto(texto, /(\d[\d.,]*)[^\n]*ativa[çc][aã]o/i) || 89.90;
      p.terminalVal= extrairValorTexto(texto, /terminal[^\n]*?R?\$?\s*([\d.,]+)/i)  || 89.90;
      p.ingrFisico = extrairValorTexto(texto, /f[ií]sico[^\n]*?R?\$?\s*([\d.,]+)/i) || extrairValorTexto(texto, /impresso[^\n]*?R?\$?\s*([\d.,]+)/i)  || 0.80;
      p.ingrDigital= extrairValorTexto(texto, /digital[^\n]*?R?\$?\s*([\d.,]+)/i)   || 0.50;
      p.cortesia   = extrairValorTexto(texto, /cortesia[^\n]*?R?\$?\s*([\d.,]+)/i)  || extrairValorTexto(texto, /cancelamento[^\n]*?R?\$?\s*([\d.,]+)/i) || 0.30;
      p.leitor     = extrairValorTexto(texto, /leitor[^\n]*?R?\$?\s*([\d.,]+)/i)    || 59.90;
      // Taxas maquininha PDV
      p.pctDebito  = extrairPctTexto(texto, /d[eé]b[^\n]*([\d,]+)\s*%/i)  || extrairPctTexto(texto, /([\d,]+)\s*%[^\n]*d[eé]b/i)  || 2.8;
      p.pctCredito = extrairPctTexto(texto, /cr[eé]d[^\n]*([\d,]+)\s*%/i) || extrairPctTexto(texto, /([\d,]+)\s*%[^\n]*cr[eé]d/i) || 4.9;
      p.pctPix     = extrairPctTexto(texto, /pix[^\n]*([\d,]+)\s*%/i)     || extrairPctTexto(texto, /([\d,]+)\s*%[^\n]*pix/i)     || 1.6;
      // Despesas
      p.kmVal      = extrairValorTexto(texto, /([\d.,]+)\s*\/\s*[Kk]m/i)  || extrairValorTexto(texto, /[Kk]m[^\n]*?([\d.,]+)/i)   || 1.20;
      p.alimentVal = extrairValorTexto(texto, /alimenta[çc][aã]o[^\n]*?R?\$?\s*([\d.,]+)/i) || extrairValorTexto(texto, /R?\$?\s*([\d.,]+)[^\n]*alimenta/i) || 30;
      p.operadorVal= extrairValorTexto(texto, /operador[^\n]*?R?\$?\s*([\d.,]+)/i)  || extrairValorTexto(texto, /R?\$?\s*([\d.,]+)[^\n]*operador/i)  || 180;
      p.tecnicoVal = extrairValorTexto(texto, /t[eé]cnico[^\n]*?R?\$?\s*([\d.,]+)/i)|| extrairValorTexto(texto, /R?\$?\s*([\d.,]+)[^\n]*t[eé]cnico/i) || 220;
    }

    window._fechParams = p;
    renderCobrancas();
    document.getElementById('fech-cobranças').style.display = 'block';
  } catch(e) { alert('Erro ao importar orcamento: ' + e.message); console.error(e); }
}

// ── RENDER COBRANÇAS ──
function renderCobrancas() {
  var d = window._fechDados;
  var p = window._fechParams || {};
  var numPdvsFisicos = Object.keys(d.pdvs).filter(function(x){ return !/loja virtual/i.test(x); }).length;

  var linhas = [];

  if (d.tipo === 'ficha' || d.tipo === 'festival') {
    linhas = [
      { id:'pdv',      label:'PDV (por terminal)',           tipo:'qtd_unit', qtd:numPdvsFisicos, unit:p.pdvValor||89.90, obs:'terminais detectados: '+numPdvsFisicos },
      { id:'debito',   label:'Taxa Debito',                  tipo:'pct',      forma:'debito',  pct:p.pctDebito||2.0 },
      { id:'credito',  label:'Taxa Credito',                 tipo:'pct',      forma:'credito', pct:p.pctCredito||4.0 },
      { id:'pix',      label:'Taxa Pix',                     tipo:'pct',      forma:'pix',     pct:p.pctPix||1.5 },
      { id:'tecnico',  label:'Tecnico / Staff (por pessoa)',  tipo:'qtd_unit', qtd:0, unit:p.tecnicoVal||200 },
      { id:'operador', label:'Operador de caixa (por pessoa)',tipo:'qtd_unit', qtd:0, unit:p.operadorVal||180 },
      { id:'desl',     label:'Deslocamento / hospedagem',     tipo:'livre',    val:p.desl||0 },
    ];
  } else {
    // INGRESSO — taxas de modalidade têm toggle Produtor/Cliente
    linhas = [
      { id:'ativacao',   label:'Ativacao do sistema',              tipo:'fixo',     val:p.ativacao||89.90 },
      { id:'terminal',   label:'Terminal PDV (por unidade)',        tipo:'qtd_unit', qtd:numPdvsFisicos, unit:p.terminalVal||89.90, obs:'PDVs fisicos detectados: '+numPdvsFisicos },
      { id:'leitor',     label:'Leitor (dia do evento)',            tipo:'qtd_unit', qtd:0, unit:p.leitor||59.90 },
      { id:'ingFisico',  label:'Ingresso fisico / impresso (por und)', tipo:'qtd_unit', qtd:0, unit:p.ingrFisico||0.80 },
      { id:'ingDigital', label:'Ingresso digital / WhatsApp (por und)',tipo:'qtd_unit', qtd:0, unit:p.ingrDigital||0.50 },
      { id:'cortesia',   label:'Cortesia / cancelamento (por und)', tipo:'qtd_unit', qtd:0, unit:p.cortesia||0.30 },
      { id:'debito',     label:'Taxa Debito PDV',                   tipo:'pct_toggle', forma:'debito',  pct:p.pctDebito||2.8 },
      { id:'credito',    label:'Taxa Credito PDV',                  tipo:'pct_toggle', forma:'credito', pct:p.pctCredito||4.9 },
      { id:'pix',        label:'Taxa Pix PDV',                      tipo:'pct_toggle', forma:'pix',     pct:p.pctPix||1.6 },
      { id:'km',         label:'Deslocamento (R$/km)',               tipo:'qtd_unit', qtd:0, unit:p.kmVal||1.20 },
      { id:'aliment',    label:'Diaria alimentacao (por pessoa)',    tipo:'qtd_unit', qtd:0, unit:p.alimentVal||30 },
      { id:'operador',   label:'Diaria operador (por pessoa)',       tipo:'qtd_unit', qtd:0, unit:p.operadorVal||180 },
      { id:'tecnico',    label:'Diaria tecnico (por pessoa)',        tipo:'qtd_unit', qtd:0, unit:p.tecnicoVal||220 },
    ];
  }

  window._fechLinhas = linhas;
  var container = document.getElementById('fechCobrancasList');
  container.innerHTML = '';

  linhas.forEach(function(l) {
    var div = document.createElement('div');
    div.id = 'fech-linha-' + l.id;
    div.style.cssText = 'background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:10px;margin-bottom:8px';

    // Header: label + botão Não se aplica
    var header = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
      '<span style="font-size:12px;font-weight:bold;color:var(--gray)">' + l.label + '</span>' +
      '<button type="button" onclick="toggleNaoAplica(\'' + l.id + '\')" id="btn-na-'+l.id+'" ' +
      'style="font-size:10px;padding:3px 8px;width:auto;background:#f3f4f6;color:#6b7280;border:1px solid var(--border)">Nao se aplica</button>' +
    '</div>';

    var body = '';

    if (l.tipo === 'fixo' || l.tipo === 'livre') {
      var v0 = (l.val||0).toFixed(2);
      body = '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:12px;color:#6b7280">R$</span>' +
        '<input type="text" class="money-input" id="fi-'+l.id+'" value="'+v0+'" onchange="recalcFech()" style="flex:1;font-size:13px;padding:6px 8px">' +
        '<span style="font-size:13px;font-weight:bold;color:var(--red)" id="ft-'+l.id+'">- '+formatMoney(l.val||0)+'</span>' +
      '</div>';

    } else if (l.tipo === 'qtd_unit') {
      var calc0 = (l.qtd||0) * (l.unit||0);
      body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
        '<div><div style="font-size:11px;color:#6b7280">Qtd</div><input type="number" id="fq-'+l.id+'" inputmode="numeric" value="'+(l.qtd||0)+'" min="0" step="1" onchange="recalcFech()" style="font-size:13px;padding:6px 8px;margin-top:2px"></div>' +
        '<div><div style="font-size:11px;color:#6b7280">Valor unit. (R$)</div><input type="text" class="money-input" id="fu-'+l.id+'" value="'+(l.unit||0).toFixed(2)+'" onchange="recalcFech()" style="font-size:13px;padding:6px 8px;margin-top:2px"></div>' +
      '</div>' +
      (l.obs ? '<div style="font-size:11px;color:#9ca3af;margin-top:3px">'+l.obs+'</div>' : '') +
      '<div style="text-align:right;margin-top:5px;font-size:13px;font-weight:bold;color:var(--red)" id="ft-'+l.id+'">- '+formatMoney(calc0)+'</div>';

    } else if (l.tipo === 'pct') {
      // Taxa % sobre base (ficha) — sempre desconta do produtor
      var baseV = getBaseForma(d.formas, l.forma);
      var calcP = baseV * (l.pct||0) / 100;
      body = '<div style="font-size:11px;color:#6b7280;margin-bottom:4px">Base: <b id="fb-'+l.id+'">'+formatMoney(baseV)+'</b></div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
        '<input type="number" id="fp-'+l.id+'" inputmode="decimal" value="'+(l.pct||0)+'" min="0" step="0.1" onchange="recalcFech()" style="flex:1;font-size:13px;padding:6px 8px">' +
        '<span style="color:#6b7280;font-size:13px">%</span>' +
        '<span style="font-size:13px;font-weight:bold;color:var(--red)" id="ft-'+l.id+'">- '+formatMoney(calcP)+'</span>' +
      '</div>';

    } else if (l.tipo === 'pct_toggle') {
      // Taxa % com toggle Produtor / Cliente Final (padrão = Cliente = não desconta)
      var baseT = getBaseForma(d.formas, l.forma);
      var calcT = baseT * (l.pct||0) / 100;
      body = '<div style="font-size:11px;color:#6b7280;margin-bottom:6px">Base: <b id="fb-'+l.id+'">'+formatMoney(baseT)+'</b></div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">' +
        '<input type="number" id="fp-'+l.id+'" inputmode="decimal" value="'+(l.pct||0)+'" min="0" step="0.1" onchange="recalcFech()" style="flex:1;font-size:13px;padding:6px 8px">' +
        '<span style="color:#6b7280;font-size:13px">%</span>' +
        '</div>' +
        '<div style="display:flex;gap:6px;align-items:center">' +
        '<button type="button" id="btn-resp-'+l.id+'" onclick="toggleRespTaxa(\''+l.id+'\')" ' +
        'style="font-size:11px;padding:4px 10px;width:auto;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:7px">👤 Cliente Final</button>' +
        '<span style="font-size:11px;color:#9ca3af">Clique para mudar quem absorve a taxa</span>' +
        '<span style="font-size:13px;font-weight:bold;color:#9ca3af" id="ft-'+l.id+'">R$ 0,00</span>' +
      '</div>';
    }

    div.innerHTML = header + body;
    container.appendChild(div);
  });

  recalcFech();
  applyMoneyInputs();
}

function toggleRespTaxa(id) {
  var btn = document.getElementById('btn-resp-' + id);
  var isCliente = btn.getAttribute('data-resp') !== 'produtor';
  if (isCliente) {
    btn.setAttribute('data-resp','produtor');
    btn.textContent = '🏭 Produtor';
    btn.style.background = '#fee2e2'; btn.style.color = '#991b1b'; btn.style.borderColor = '#fca5a5';
  } else {
    btn.setAttribute('data-resp','cliente');
    btn.textContent = '👤 Cliente Final';
    btn.style.background = '#fef3c7'; btn.style.color = '#92400e'; btn.style.borderColor = '#fcd34d';
  }
  recalcFech();
}

function toggleNaoAplica(id) {
  var div = document.getElementById('fech-linha-' + id);
  var btn = document.getElementById('btn-na-' + id);
  var na = div.getAttribute('data-na') === '1';
  if (na) {
    div.setAttribute('data-na','0');
    div.style.opacity = '1';
    btn.textContent = 'Nao se aplica';
    btn.style.background = '#f3f4f6'; btn.style.color = '#6b7280'; btn.style.borderColor = 'var(--border)';
    div.querySelectorAll('input').forEach(function(i){ i.disabled = false; });
  } else {
    div.setAttribute('data-na','1');
    div.style.opacity = '0.4';
    btn.textContent = '✓ Nao se aplica';
    btn.style.background = '#fef3c7'; btn.style.color = '#92400e'; btn.style.borderColor = '#fcd34d';
    div.querySelectorAll('input').forEach(function(i){ i.disabled = true; });
  }
  recalcFech();
}

function semAcento(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function getBaseForma(formas, formaKey) {
  var base = 0;
  Object.keys(formas).forEach(function(f){
    if (semAcento(f).indexOf(semAcento(formaKey)) >= 0) base = formas[f].valor;
  });
  return base;
}

function getLinhaValor(l) {
  var div = document.getElementById('fech-linha-' + l.id);
  if (!div || div.getAttribute('data-na') === '1') return 0;
  var d = window._fechDados;

  if (l.tipo === 'fixo' || l.tipo === 'livre') {
    return parseMoney(document.getElementById('fi-'+l.id).value)||0;
  } else if (l.tipo === 'qtd_unit') {
    var q = parseFloat(document.getElementById('fq-'+l.id).value)||0;
    var u = parseMoney(document.getElementById('fu-'+l.id).value)||0;
    return q * u;
  } else if (l.tipo === 'pct') {
    var base = getBaseForma(d.formas, l.forma);
    var pct = parseFloat(document.getElementById('fp-'+l.id).value)||0;
    return base * pct / 100;
  } else if (l.tipo === 'pct_toggle') {
    var btn = document.getElementById('btn-resp-'+l.id);
    if (!btn || btn.getAttribute('data-resp') !== 'produtor') return 0; // cliente = nao desconta
    var base2 = getBaseForma(d.formas, l.forma);
    var pct2 = parseFloat(document.getElementById('fp-'+l.id).value)||0;
    return base2 * pct2 / 100;
  }
  return 0;
}

function recalcFech() {
  var d = window._fechDados;
  var linhas = window._fechLinhas;
  if (!d || !linhas) return;

  var totalCobranças = 0;
  linhas.forEach(function(l) {
    var v = getLinhaValor(l);
    totalCobranças += v;
    if (l.tipo === 'pct' || l.tipo === 'pct_toggle') {
      var fbEl = document.getElementById('fb-'+l.id);
      if (fbEl) fbEl.textContent = formatMoney(getBaseForma(d.formas, l.forma));
    }
    var ftEl = document.getElementById('ft-'+l.id);
    if (ftEl) {
      if (l.tipo === 'pct_toggle') {
        var btn = document.getElementById('btn-resp-'+l.id);
        var isProdutor = btn && btn.getAttribute('data-resp') === 'produtor';
        ftEl.textContent = isProdutor ? '- ' + formatMoney(v) : 'R$ 0,00';
        ftEl.style.color = isProdutor ? 'var(--red)' : '#9ca3af';
      } else {
        ftEl.textContent = '- ' + formatMoney(v);
      }
    }
  });

  // Soma saques antecipados
  var totalSaques = 0;
  (window._fechSaquesSelecionados || []).forEach(function(s){ totalSaques += s.valor; });

  // Base repasse = total cartao (sem dinheiro)
  var baseRepasse = d.totalGeral - d.dinheiro;

  // Calculo do valor final depende do tipo
  var valorFinal;
  if (d.tipo === 'festival') {
    var totalARepassar = baseRepasse - totalCobranças;
    var totalRepasses = window._festTotalRepasses || 0;
    valorFinal = totalARepassar - totalRepasses - totalSaques;
    window._fechTotalARepassar = totalARepassar;
  } else {
    valorFinal = baseRepasse - totalCobranças - totalSaques;
  }

  // Atualiza label do valor final
  var vfLabel = document.getElementById('fechValorFinalLabel');
  if (vfLabel) vfLabel.textContent = d.tipo === 'festival' ? 'Restante para o produtor' : 'Valor a repassar ao produtor';

  var resumoEl = document.getElementById('fechResumoLinhas');
  if (resumoEl) {
    var html = '';
    if (d.tipo === 'ingresso') {
      html +=
        '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">Loja Virtual (base)</span><span>'+formatMoney(d.totalLoja||0)+'</span></div>' +
        ((d.totalDigital||0) > 0 ? '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">(-) Digital/App (produtor)</span><span>- '+formatMoney(d.dinheiro)+'</span></div>' : '') +
        ((d.totalPdv||0) > 0 ? '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">PDV fisico</span><span>+'+formatMoney(d.totalPdv||0)+'</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.2);margin-top:4px;padding-top:4px"><span style="opacity:.8">= Base repasse</span><span>'+formatMoney(baseRepasse)+'</span></div>';
    } else if (d.tipo === 'festival') {
      var totalRep = window._festTotalRepasses || 0;
      var totalAR = window._fechTotalARepassar || 0;
      html +=
        '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">Total bruto</span><span>'+formatMoney(d.totalGeral)+'</span></div>' +
        (d.dinheiro > 0 ? '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">(-) Dinheiro produtor</span><span>- '+formatMoney(d.dinheiro)+'</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.15);margin-top:3px;padding-top:3px"><span style="opacity:.8">Total entrada cartao</span><span>'+formatMoney(baseRepasse)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">(-) Taxas + despesas</span><span>- '+formatMoney(totalCobranças)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-weight:bold;border-top:1px solid rgba(255,255,255,.15);margin-top:3px;padding-top:3px"><span>Total a repassar</span><span>'+formatMoney(totalAR)+'</span></div>' +
        (totalRep > 0 ? '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">(-) Repasses operacoes</span><span>- '+formatMoney(totalRep)+'</span></div>' : '') +
        (totalSaques > 0 ? '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">(-) Saques produtor</span><span>- '+formatMoney(totalSaques)+'</span></div>' : '');
    } else {
      html +=
        '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">Total bruto</span><span>'+formatMoney(d.totalGeral)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">(-) Dinheiro produtor</span><span>- '+formatMoney(d.dinheiro)+'</span></div>';
    }
    if (d.tipo !== 'festival') {
      html += '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">(-) Cobranças / despesas</span><span>- '+formatMoney(totalCobranças)+'</span></div>';
      if (totalSaques > 0) {
        html += '<div style="display:flex;justify-content:space-between"><span style="opacity:.8">(-) Saques antecipados</span><span>- '+formatMoney(totalSaques)+'</span></div>';
      }
    }
    resumoEl.innerHTML = html;
  }
  var vfEl = document.getElementById('fechValorFinal');
  if (vfEl) vfEl.textContent = formatMoney(valorFinal);
  window._fechValorFinal = valorFinal;
  window._fechTotalCobranças = totalCobranças;
  window._fechTotalSaques = totalSaques;
}



// ── CONCILIAÇÃO DE SAQUES ──
function semAcentoLower(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
}

function inicializarSaquesAuto(eventoNome) {
  window._fechSaquesSelecionados = window._fechSaquesSelecionados || [];
  var container = document.getElementById('fechSaquesAuto');
  if (!container) return;
  container.innerHTML = '';

  // Busca saques pagos para este evento
  var saques = (financeiro||[]).filter(function(f){
    return !f.isEntrada &&
           f.status === 'Pago' &&
           semAcentoLower(f.evento).indexOf(semAcentoLower(eventoNome)) >= 0;
  });

  if (saques.length === 0) {
    container.innerHTML = '<p style="font-size:12px;color:#9ca3af;margin:0">Nenhum saque encontrado para este evento.</p>';
    return;
  }

  var label = document.createElement('div');
  label.style.cssText = 'font-size:11px;font-weight:bold;color:#9ca3af;text-transform:uppercase;margin-bottom:6px';
  label.textContent = 'Saques encontrados para este evento:';
  container.appendChild(label);

  saques.forEach(function(s) {
    renderSaqueLinha(container, s, true);
  });
}

function buscarSaquesParaFechamento() {
  var q = semAcentoLower(document.getElementById('fechSaqueBusca').value.trim());
  var res = document.getElementById('fechSaqueBuscaResultados');
  res.innerHTML = '';
  if (!q || q.length < 2) return;

  var selecionadosIds = (window._fechSaquesSelecionados||[]).map(function(s){ return s.id; });

  var encontrados = (financeiro||[]).filter(function(f){
    if (f.isEntrada || selecionadosIds.indexOf(f.id) >= 0) return false;
    var campos = [f.evento, f.nome, f.chave, String(f.valor||'')].join(' ');
    return semAcentoLower(campos).indexOf(q) >= 0;
  }).slice(0,10);

  if (encontrados.length === 0) {
    res.innerHTML = '<p style="font-size:12px;color:#9ca3af;margin:4px 0">Nenhum resultado.</p>';
    return;
  }

  encontrados.forEach(function(s) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:#fff;border-radius:8px;border:1px solid var(--border);margin-bottom:4px;font-size:12px;cursor:pointer';
    row.innerHTML =
      '<div><b>' + (s.evento||'-') + '</b> — ' + (s.nome||'-') + '<br><span style="color:#9ca3af">' + (s.chave||'-') + ' · ' + formatDateTime(s.dataPagamento||s.dataSolicitacao) + '</span></div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<b style="color:var(--red)">- ' + formatMoney(s.valor) + '</b>' +
        '<button type="button" data-sid="' + s.id + '" onclick="saqueAdd(this)" style="font-size:11px;padding:3px 8px;width:auto;background:#1a56db;color:#fff;border:none;border-radius:6px">+ Incluir</button>' +
      '</div>';
    res.appendChild(row);
  });
}


function saqueAdd(btn) { adicionarSaqueManual(btn.getAttribute('data-sid')); }
function saqueToggle(btn) { toggleSaqueAuto(btn.getAttribute('data-sid'), btn); }
function saqueRemove(btn) { removerSaqueManual(btn.getAttribute('data-sid')); }

function adicionarSaqueManual(id) {
  var s = (financeiro||[]).find(function(f){ return f.id === id; });
  if (!s) return;
  window._fechSaquesSelecionados = window._fechSaquesSelecionados || [];
  if (window._fechSaquesSelecionados.find(function(x){ return x.id === id; })) return;
  window._fechSaquesSelecionados.push({ id:s.id, evento:s.evento, nome:s.nome, chave:s.chave, valor:s.valor, data:s.dataPagamento||s.dataSolicitacao });
  var container = document.getElementById('fechSaquesSelecionados');
  renderSaqueLinha(container, s, false);
  recalcFech();
  // Atualiza resultados da busca
  buscarSaquesParaFechamento();
}

function renderSaqueLinha(container, s, autoIncluir) {
  window._fechSaquesSelecionados = window._fechSaquesSelecionados || [];
  var jaIncluido = window._fechSaquesSelecionados.find(function(x){ return x.id === s.id; });

  var div = document.createElement('div');
  div.id = 'saque-linha-' + s.id;
  div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:#fff;border-radius:8px;border:1px solid var(--border);margin-bottom:4px;font-size:12px';

  var info = '<div><b>' + (s.evento||'-') + '</b> — ' + (s.nome||'-') + '<br><span style="color:#9ca3af">' + (s.chave||'-') + ' · ' + formatDateTime(s.dataPagamento||s.dataSolicitacao) + '</span></div>';

  var actions = '<div style="display:flex;align-items:center;gap:8px">' +
    '<b style="color:var(--red)">- ' + formatMoney(s.valor) + '</b>';

  if (autoIncluir) {
    // Botão incluir/excluir para saques automáticos
    if (jaIncluido) {
      actions += '<button type="button" data-sid="' + s.id + '" onclick="saqueToggle(this)" style="font-size:11px;padding:3px 8px;width:auto;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;border-radius:6px">✓ Incluido</button>';
    } else {
      actions += '<button type="button" data-sid="' + s.id + '" onclick="saqueToggle(this)" style="font-size:11px;padding:3px 8px;width:auto;background:#f3f4f6;color:#6b7280;border:1px solid var(--border);border-radius:6px">Incluir</button>';
    }
  } else {
    actions += '<button type="button" data-sid="' + s.id + '" onclick="saqueRemove(this)" style="font-size:11px;padding:3px 8px;width:auto;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;border-radius:6px">✕ Remover</button>';
  }

  actions += '</div>';
  div.innerHTML = info + actions;
  container.appendChild(div);
}

function toggleSaqueAuto(id, btn) {
  window._fechSaquesSelecionados = window._fechSaquesSelecionados || [];
  var idx = window._fechSaquesSelecionados.findIndex(function(x){ return x.id === id; });
  if (idx >= 0) {
    // Remove
    window._fechSaquesSelecionados.splice(idx, 1);
    btn.textContent = 'Incluir';
    btn.style.background = '#f3f4f6'; btn.style.color = '#6b7280'; btn.style.borderColor = 'var(--border)';
  } else {
    // Adiciona
    var s = (financeiro||[]).find(function(f){ return f.id === id; });
    if (!s) return;
    window._fechSaquesSelecionados.push({ id:s.id, evento:s.evento, nome:s.nome, chave:s.chave, valor:s.valor, data:s.dataPagamento||s.dataSolicitacao });
    btn.textContent = '✓ Incluido';
    btn.style.background = '#fee2e2'; btn.style.color = '#991b1b'; btn.style.borderColor = '#fca5a5';
  }
  recalcFech();
}

function removerSaqueManual(id) {
  window._fechSaquesSelecionados = window._fechSaquesSelecionados || [];
  window._fechSaquesSelecionados = window._fechSaquesSelecionados.filter(function(x){ return x.id !== id; });
  var el = document.getElementById('saque-linha-' + id);
  if (el) el.remove();
  recalcFech();
}

// ── GERAR FECHAMENTO FINAL ──
function gerarFechamento() {
  var d = window._fechDados;
  var linhas = window._fechLinhas;
  var evento = document.getElementById('fechEvento').value.trim() || 'Evento';
  if (!evento) { alert('Informe o nome do evento antes de gerar.'); return; }

  var tipo = d.tipo === 'ficha' ? '🍺 FICHA' : (d.tipo === 'festival' ? '🎪 FESTIVAL' : '🎟️ INGRESSO');
  var hoje = new Date().toLocaleDateString('pt-BR');
  var txt = '';
  txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  txt += '  FECHAMENTO DE EVENTO\n';
  txt += '  ' + evento.toUpperCase() + '\n';
  txt += '  ' + tipo + '  •  ' + hoje + '\n';
  txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  txt += '📊 VENDAS\n';
  if (d.tipo === 'ingresso') {
    var totalBrutoEvt = (d.totalBruto||d.totalLoja||0) + (d.totalDigital||0);
    txt += 'Total geral do evento: ' + formatMoney(totalBrutoEvt) + '\n';
    if ((d.totalDigital||0) > 0) txt += '(-) Digital/App (produtor): - ' + formatMoney(d.totalDigital||0) + '\n';
    txt += '(=) Loja Virtual bruto: ' + formatMoney(d.totalBruto||d.totalLoja||0) + '\n';
    if ((d.totalDesconto||0) > 0) txt += '(-) Cupons/descontos: - ' + formatMoney(d.totalDesconto||0) + '\n';
    txt += '(=) Loja Virtual liquido (base): ' + formatMoney(d.totalLoja||0) + '\n';
    if ((d.totalPdv||0) > 0) txt += '(+) PDV fisico: ' + formatMoney(d.totalPdv||0) + '\n';
  } else {
    txt += 'Total bruto: ' + formatMoney(d.totalGeral) + '\n';
    Object.keys(d.formas).forEach(function(f){
      txt += '  ' + f + ': ' + formatMoney(d.formas[f].valor) + ' (' + d.formas[f].qtd + ' vend.)\n';
    });
  }
  txt += '\n';

  if (Object.keys(d.pdvs).length > 0) {
    txt += '📍 PDVs\n';
    Object.keys(d.pdvs).forEach(function(p){
      txt += '  ' + p + ': ' + formatMoney(d.pdvs[p].valor) + '\n';
    });
    txt += '\n';
  }

  txt += '💼 COBRANÇAS\n';
  linhas.forEach(function(l) {
    var div = document.getElementById('fech-linha-'+l.id);
    if (div && div.getAttribute('data-na') === '1') return;
    var v = getLinhaValor(l);
    if (v === 0) return;
    txt += '  ' + l.label + ': - ' + formatMoney(v) + '\n';
  });
  txt += '\n';

  var saques = window._fechSaquesSelecionados || [];
  if (saques.length > 0) {
    txt += '💸 SAQUES ANTECIPADOS\n';
    saques.forEach(function(s){
      txt += '  ' + (s.evento||'-') + ' — ' + (s.nome||'-') + ': - ' + formatMoney(s.valor) + '\n';
    });
    txt += '\n';
  }

  txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  if (d.tipo === 'ingresso') {
    txt += '  Loja Virtual bruto:    ' + formatMoney(d.totalBruto||d.totalLoja||0) + '\n';
    if ((d.totalDesconto||0) > 0) txt += '  (-) Cupons/descontos:  - ' + formatMoney(d.totalDesconto||0) + '\n';
    txt += '  (=) Loja Virtual liq.: ' + formatMoney(d.totalLoja||0) + '\n';
    if ((d.totalPdv||0) > 0) txt += '  (+) PDV fisico:         ' + formatMoney(d.totalPdv||0) + '\n';
  } else if (d.tipo === 'festival') {
    var cartaoFest = d.totalGeral - d.dinheiro;
    txt += '  Total bruto:           ' + formatMoney(d.totalGeral) + '\n';
    if (d.dinheiro > 0) txt += '  (-) Dinheiro produtor: - ' + formatMoney(d.dinheiro) + '\n';
    txt += '  Total entrada cartao:  ' + formatMoney(cartaoFest) + '\n';
  } else {
    txt += '  Total bruto:          ' + formatMoney(d.totalGeral) + '\n';
    txt += '  (-) Dinheiro produtor: ' + formatMoney(d.dinheiro) + '\n';
  }
  txt += '  (-) Cobranças:         ' + formatMoney(window._fechTotalCobranças) + '\n';
  if (d.tipo === 'festival') {
    txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    txt += '  TOTAL A REPASSAR: ' + formatMoney(window._fechTotalARepassar||0) + '\n';
    txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    var repFest = festGetRepasses ? festGetRepasses() : [];
    if (repFest.length > 0) {
      txt += '💸 REPASSES POR OPERACAO\n';
      var totalRepFest = 0;
      repFest.forEach(function(r) {
        txt += (r.ok ? '✓ ' : '  ') + (r.nome||'-') + ': ' + formatMoney(r.valor);
        if (r.responsavel) txt += '  (' + r.responsavel + ')';
        if (r.chavePix) txt += '  Pix: ' + r.chavePix;
        txt += '\n';
        totalRepFest += r.valor;
      });
      txt += 'Total repasses: ' + formatMoney(totalRepFest) + '\n\n';
    }
    if ((window._fechTotalSaques||0) > 0) {
      txt += '💸 SAQUES DO PRODUTOR\n';
      (window._fechSaquesSelecionados||[]).forEach(function(s){
        txt += '  ' + (s.nome||'-') + ': - ' + formatMoney(s.valor) + '\n';
      });
      txt += '\n';
    }
    txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    txt += '  RESTANTE PARA O PRODUTOR: ' + formatMoney(window._fechValorFinal) + '\n';
    txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  } else {
    if ((window._fechTotalSaques||0) > 0) {
      txt += '  (-) Saques antecip.:   ' + formatMoney(window._fechTotalSaques) + '\n';
    }
    txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    txt += '  REPASSE AO PRODUTOR: ' + formatMoney(window._fechValorFinal) + '\n';
    txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  }
  txt += '\nEasytick • ' + hoje;

  document.getElementById('fechRelatorioFinal').textContent = txt;
  document.getElementById('fech-passo2').style.display = 'none';
  document.getElementById('fech-passo3').style.display = 'block';

  // Salva no Firebase
  var cobAtivas = [];
  (window._fechLinhas||[]).forEach(function(l) {
    var div = document.getElementById('fech-linha-'+l.id);
    if (div && div.getAttribute('data-na') === '1') return;
    var v = getLinhaValor(l);
    if (v === 0) return;
    cobAtivas.push({ label: l.label, valor: v });
  });
  saveFechamento({
    evento: evento,
    tipo: d.tipo,
    totalGeral: d.totalGeral,
    dinheiro: d.dinheiro,
    totalCobranças: window._fechTotalCobranças || 0,
    totalSaques: window._fechTotalSaques || 0,
    valorFinal: window._fechValorFinal || 0,
    totalARepassar: window._fechTotalARepassar || 0,
    formas: d.formas,
    pdvs: d.pdvs,
    cobranças: cobAtivas,
    saques: window._fechSaquesSelecionados || [],
    operacoes: d.operacoes || [],
    repasses: (typeof festGetRepasses === 'function') ? festGetRepasses() : [],
    textoFinal: txt
  });
}

function copiarFechamento() {
  var txt = document.getElementById('fechRelatorioFinal').textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(function(){ alert('Texto copiado!'); });
  } else {
    var ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    alert('Texto copiado!');
  }
}

// ── LOGO EASYTICK (base64) ──
var EASYTICK_LOGO = 'data:image/png;base64,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';

// ── GERADOR DE IMAGEM PNG DO FECHAMENTO ──
function baixarImagemFechamento() {
  var d = window._fechDados;
  var linhas = window._fechLinhas;
  if (!d || !linhas) { alert('Gere o fechamento antes de baixar a imagem.'); return; }

  var evento = (document.getElementById('fechEvento').value || 'Evento').toUpperCase();
  var hoje = new Date().toLocaleDateString('pt-BR');
  var tipoLabel = d.tipo === 'ficha' ? 'Fechamento fichas' : (d.tipo === 'festival' ? 'Fechamento festival' : 'Fechamento ingressos');

  function fmtImg(v) {
    return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Cobranças ativas separadas por tipo
  var taxasCartao = []; // pct — débito, crédito, pix
  var despesas   = []; // fixo, qtd_unit, livre — pdv, técnico, deslocamento etc
  var saques     = window._fechSaquesSelecionados || [];

  linhas.forEach(function(l) {
    var div = document.getElementById('fech-linha-'+l.id);
    if (div && div.getAttribute('data-na') === '1') return;
    var v = getLinhaValor(l);
    if (v === 0) return;

    var extra = '';
    if (l.tipo === 'pct' || l.tipo === 'pct_toggle') {
      var pEl = document.getElementById('fp-'+l.id);
      if (pEl) extra = ' (' + parseFloat(pEl.value).toFixed(1) + '%)';
    }
    var qtdLabel = '';
    if (l.tipo === 'qtd_unit') {
      var qEl = document.getElementById('fq-'+l.id);
      var uEl = document.getElementById('fu-'+l.id);
      if (qEl && uEl && parseFloat(qEl.value) > 0) qtdLabel = ' — ' + parseFloat(qEl.value) + ' x R$ ' + Number(parseFloat(uEl.value)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    }

    // Separa taxas de cartão (pct sobre formas débito/crédito/pix) das despesas gerais
    var isTaxa = (l.tipo === 'pct' || l.tipo === 'pct_toggle') &&
                 /debito|credito|pix/i.test(l.id);

    if (d.tipo === 'ficha' && isTaxa) {
      // Busca a base da forma pelo nome da linha (debito, credito, pix)
      var base = 0;
      var lidLower = l.id.toLowerCase();
      Object.keys(d.formas).forEach(function(f){
        var fLower = f.toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g,'') // remove acentos
          .replace(/\s+/g,'');
        // debito → debito, credito → credito/creditoavista, pix → pix
        var match = false;
        if (/debito/.test(lidLower) && /debito/.test(fLower)) match = true;
        if (/credito/.test(lidLower) && /credito/.test(fLower)) match = true;
        if (/pix/.test(lidLower) && /pix/.test(fLower)) match = true;
        if (match) base = d.formas[f].valor;
      });
      var pct = parseFloat((document.getElementById('fp-'+l.id)||{}).value||0);
      taxasCartao.push({ label: l.label + extra, base: base, pct: pct, valor: v });
    } else {
      despesas.push({ label: l.label + extra + qtdLabel, valor: v });
    }
  });

  var totalDed = (window._fechTotalCobranças||0) + (window._fechTotalSaques||0);
  var F = "font-family:'Segoe UI',Arial,sans-serif;";

  // ── HELPERS HTML ──
  function secLabel(t) {
    return '<div style="'+F+'font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;padding:10px 0 6px;border-bottom:1px solid #e2e8f0;margin-bottom:2px;">'+t+'</div>';
  }
  function dashedRow(label, val, red, last) {
    return '<div style="'+F+'display:flex;justify-content:space-between;align-items:center;padding:9px 0;'+(last?'':'border-bottom:1px dashed #e5e7eb;')+'">' +
      '<span style="font-size:13px;color:#475569;">'+label+'</span>' +
      '<span style="font-size:13px;font-weight:600;color:'+(red?'#dc2626':'#1e293b')+';">'+val+'</span>' +
      '</div>';
  }

  var html = '<div id="fech-img-wrap" style="'+F+'width:700px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">' +

  // ── HEADER ──
  '<div style="background:#1a3a6b;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;">' +
    '<img src="'+EASYTICK_LOGO+'" style="height:34px;object-fit:contain;" />' +
    '<div style="text-align:right;">' +
      '<div style="'+F+'font-size:10px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:.1em;margin-bottom:3px;">Fechamento de evento</div>' +
      '<div style="'+F+'font-size:17px;font-weight:700;color:#fff;">'+evento+'</div>' +
      '<div style="'+F+'font-size:11px;color:rgba(255,255,255,0.55);margin-top:3px;">'+tipoLabel+'&nbsp;&nbsp;•&nbsp;&nbsp;'+hoje+'</div>' +
    '</div>' +
  '</div>' +
  '<div style="height:3px;background:#2563eb;"></div>';

  if (d.tipo === 'ficha') {
    // ── ZONA 1: TABELA DE FORMAS ──
    var linhasFormas = '';
    var totalQtdFormas = 0;
    Object.keys(d.formas).forEach(function(f) {
      var v = d.formas[f];
      var isDin = /dinheiro/i.test(f);
      totalQtdFormas += v.qtd;
      var bg = isDin ? '#fffbeb' : '#fff';
      var tc = isDin ? '#92400e' : '#475569';
      var vc = isDin ? '#b45309' : '#1e293b';
      linhasFormas +=
        '<tr style="background:'+bg+'">' +
          '<td style="'+F+'font-size:13px;padding:8px 8px;border-bottom:1px dashed #e5e7eb;color:'+tc+';">'+(isDin?'💵 ':'')+f+'</td>' +
          '<td style="'+F+'font-size:13px;padding:8px 8px;border-bottom:1px dashed #e5e7eb;text-align:center;color:'+tc+';">'+v.qtd+'</td>' +
          '<td style="'+F+'font-size:13px;padding:8px 8px;border-bottom:1px dashed #e5e7eb;text-align:right;font-weight:600;color:'+vc+';">'+fmtImg(v.valor)+'</td>' +
        '</tr>';
    });
    // Linha total
    linhasFormas +=
      '<tr style="background:#f1f5f9;">' +
        '<td style="'+F+'font-size:13px;padding:8px 8px;font-weight:700;color:#374151;">Total bruto</td>' +
        '<td style="'+F+'font-size:13px;padding:8px 8px;text-align:center;font-weight:700;color:#374151;">'+totalQtdFormas+'</td>' +
        '<td style="'+F+'font-size:13px;padding:8px 8px;text-align:right;font-weight:700;color:#1e293b;">'+fmtImg(d.totalGeral)+'</td>' +
      '</tr>';

    html +=
      '<div style="padding:14px 28px 8px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">' +
        secLabel('Total máquinas — pontos de venda') +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:4px;">' +
          '<thead>' +
            '<tr style="background:#f1f5f9;">' +
              '<th style="'+F+'font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;text-align:left;">Forma de pagamento</th>' +
              '<th style="'+F+'font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;text-align:center;">Vendas</th>' +
              '<th style="'+F+'font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;text-align:right;">Valor</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>'+linhasFormas+'</tbody>' +
        '</table>' +
      '</div>';

    // ── ZONA 2: BASE (total cartão) ──
    var baseVal = d.totalGeral - d.dinheiro;
    html +=
      '<div style="padding:14px 28px 16px;background:#eef4fd;border-left:4px solid #185fa5;border-bottom:1px solid #b5d4f4;">' +
        '<div style="'+F+'font-size:10px;font-weight:700;color:#185fa5;letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px;">Total entrada cartão (base do repasse)</div>' +
        '<div style="'+F+'font-size:11px;color:#378add;margin-bottom:6px;">Total bruto &nbsp;−&nbsp; Dinheiro (ficou com o produtor)</div>' +
        '<div style="'+F+'font-size:26px;font-weight:700;color:#185fa5;">'+fmtImg(baseVal)+'</div>' +
      '</div>';

    // ── ZONA 3: TAXAS CARTÃO ──
    if (taxasCartao.length > 0) {
      var linhasTaxas = '';
      taxasCartao.forEach(function(t, i) {
        var last = i === taxasCartao.length - 1;
        linhasTaxas +=
          '<tr>' +
            '<td style="'+F+'font-size:13px;padding:8px 8px;'+(last?'':'border-bottom:1px dashed #e5e7eb;')+'color:#475569;">(-) '+t.label+'</td>' +
            '<td style="'+F+'font-size:13px;padding:8px 8px;'+(last?'':'border-bottom:1px dashed #e5e7eb;')+'text-align:right;color:#374151;">'+fmtImg(t.base||0)+'</td>' +
            '<td style="'+F+'font-size:13px;padding:8px 8px;'+(last?'':'border-bottom:1px dashed #e5e7eb;')+'text-align:right;color:#374151;">'+(t.pct||0).toFixed(1)+'%</td>' +
            '<td style="'+F+'font-size:13px;padding:8px 8px;'+(last?'':'border-bottom:1px dashed #e5e7eb;')+'text-align:right;font-weight:600;color:#dc2626;">- '+fmtImg(t.valor)+'</td>' +
          '</tr>';
      });
      html +=
        '<div style="padding:4px 28px 8px;background:#fff;border-bottom:1px solid #f1f5f9;">' +
          secLabel('Descontos taxas cartão') +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<thead>' +
              '<tr style="background:#fafafa;">' +
                '<th style="'+F+'font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;padding:5px 8px;text-align:left;">Modalidade</th>' +
                '<th style="'+F+'font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;padding:5px 8px;text-align:right;">Total bruto</th>' +
                '<th style="'+F+'font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;padding:5px 8px;text-align:right;">Taxa</th>' +
                '<th style="'+F+'font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;padding:5px 8px;text-align:right;">Desconto</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>'+linhasTaxas+'</tbody>' +
          '</table>' +
        '</div>';
    }

    // ── ZONA 4: DESPESAS ──
    if (despesas.length > 0 || saques.length > 0) {
      html += '<div style="padding:4px 28px 0;background:#fff;">';
      if (despesas.length > 0) {
        html += secLabel('Despesas / cobranças');
        despesas.forEach(function(c, i) {
          html += dashedRow('(-) '+c.label, '- '+fmtImg(c.valor), true, i===despesas.length-1 && saques.length===0);
        });
      }
      if (saques.length > 0) {
        html += secLabel('Saques antecipados');
        saques.forEach(function(s, i) {
          var ds = s.data ? new Date(s.data).toLocaleDateString('pt-BR') : '';
          html += dashedRow('(-) '+(s.nome||'-')+(ds?' — '+ds:''), '- '+fmtImg(s.valor), true, i===saques.length-1);
        });
      }
      html += '</div>';
    }

  } else {
    // ── INGRESSO: layout existente ──
    var compLinhas = [];
    var tbEvt = (d.totalBruto||d.totalLoja||0) + (d.totalDigital||0);
    compLinhas.push({ label: 'Total geral do evento', valor: fmtImg(tbEvt), red: false });
    if ((d.totalDigital||0) > 0) compLinhas.push({ label: '(-) Digital / App (ficou c/ produtor)', valor: '- ' + fmtImg(d.totalDigital), red: true });
    compLinhas.push({ label: '(=) Loja virtual bruto', valor: fmtImg(d.totalBruto||d.totalLoja||0), red: false });
    if ((d.totalDesconto||0) > 0) compLinhas.push({ label: '(-) Cupons / descontos', valor: '- ' + fmtImg(d.totalDesconto), red: true });
    if ((d.totalPdv||0) > 0) {
      if ((d.totalDesconto||0) > 0) compLinhas.push({ label: '(=) Loja virtual líquido', valor: fmtImg(d.totalLoja||0), red: false });
      compLinhas.push({ label: '(+) PDV físico (máquinas)', valor: fmtImg(d.totalPdv), green: true });
    }

    var compHTML = compLinhas.map(function(c,i) {
      var lColor = c.red ? '#92400e' : (c.green ? '#166534' : '#475569');
      var lWeight = (c.red || c.green) ? '500' : '400';
      var vColor = c.red ? '#b45309' : (c.green ? '#15803d' : '#1e293b');
      return '<div style="'+F+'display:flex;justify-content:space-between;align-items:center;padding:10px 0;'+(i===compLinhas.length-1?'':'border-bottom:1px dashed #dde3ed;')+'">' +
        '<span style="font-size:14px;color:'+lColor+';font-weight:'+lWeight+';">'+c.label+'</span>' +
        '<span style="font-size:14px;font-weight:600;color:'+vColor+';">'+c.valor+'</span></div>';
    }).join('');

    var hasPdv = (d.totalPdv||0) > 0;
    var baseVal = (d.totalLoja||0) + (d.totalPdv||0);
    var baseLabel = hasPdv ? 'Base do repasse — loja virtual + PDV' : 'Base do repasse — loja virtual líquido';

    var cobHTML = '', saqHTML = '';
    linhas.forEach(function(l) {
      var div = document.getElementById('fech-linha-'+l.id);
      if (div && div.getAttribute('data-na') === '1') return;
      var v = getLinhaValor(l); if (v === 0) return;
      var extra = '';
      if (l.tipo === 'pct'||l.tipo === 'pct_toggle') { var pEl = document.getElementById('fp-'+l.id); if (pEl) extra = ' ('+parseFloat(pEl.value).toFixed(1)+'%)'; }
      var qtdLabel = '';
      if (l.tipo === 'qtd_unit') { var qEl = document.getElementById('fq-'+l.id); var uEl = document.getElementById('fu-'+l.id); if (qEl&&uEl&&parseFloat(qEl.value)>0) qtdLabel = ' — '+parseFloat(qEl.value)+' x R$ '+Number(parseFloat(uEl.value)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
      cobHTML += '<div style="'+F+'display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed #e5e7eb;"><span style="font-size:13px;color:#475569;">(-) '+l.label+extra+qtdLabel+'</span><span style="font-size:13px;font-weight:600;color:#dc2626;">- '+fmtImg(v)+'</span></div>';
    });
    saques.forEach(function(s,i) {
      var ds = s.data ? new Date(s.data).toLocaleDateString('pt-BR') : '';
      var last = i===saques.length-1;
      saqHTML += '<div style="'+F+'display:flex;justify-content:space-between;align-items:center;padding:9px 0;'+(last?'':'border-bottom:1px dashed #e5e7eb;')+'"><span style="font-size:13px;color:#475569;">(-) '+(s.nome||'-')+(ds?' — '+ds:'')+'</span><span style="font-size:13px;font-weight:600;color:#dc2626;">- '+fmtImg(s.valor)+'</span></div>';
    });

    html +=
      '<div style="padding:14px 28px 8px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">' +
        '<div style="'+F+'font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;padding-bottom:6px;border-bottom:1px solid #e2e8f0;margin-bottom:2px;">Composição do total</div>' +
        compHTML +
      '</div>' +
      '<div style="height:1px;background:#e2e8f0;"></div>' +
      '<div style="padding:14px 28px 16px;background:#eef4fd;border-left:4px solid #185fa5;">' +
        '<div style="'+F+'font-size:10px;font-weight:700;color:#185fa5;letter-spacing:.07em;text-transform:uppercase;margin-bottom:5px;">'+baseLabel.toUpperCase()+'</div>' +
        '<div style="'+F+'font-size:26px;font-weight:700;color:#185fa5;">'+fmtImg(baseVal)+'</div>' +
        (hasPdv ? '<div style="'+F+'font-size:11px;color:#4b7cbf;margin-top:5px;">Loja Virtual: '+fmtImg(d.totalLoja||0)+'&nbsp;&nbsp;+&nbsp;&nbsp;PDV: '+fmtImg(d.totalPdv||0)+'</div>' : '') +
      '</div>' +
      '<div style="height:1px;background:#b5d4f4;"></div>' +
      '<div style="padding:4px 28px 0;background:#fff;">' +
        (cobHTML ? '<div style="'+F+'font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;padding:10px 0 2px;">Cobranças / despesas</div>'+cobHTML : '') +
        (saqHTML ? '<div style="'+F+'font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;padding:10px 0 2px;">Saques antecipados</div>'+saqHTML : '') +
      '</div>';
  }

  if (d.tipo === 'festival') {
    // ── FESTIVAL: TOTAL A REPASSAR ──
    html +=
      '<div style="'+F+'display:flex;justify-content:space-between;align-items:center;padding:14px 28px;background:#eef4fd;border-left:4px solid #185fa5;border-top:1px solid #b5d4f4;">' +
        '<div>' +
          '<div style="'+F+'font-size:10px;font-weight:700;color:#185fa5;letter-spacing:.07em;text-transform:uppercase;">Total a repassar para o contratante</div>' +
          '<div style="'+F+'font-size:11px;color:#4b7cbf;margin-top:3px;">Total cartao liquido — taxas e despesas EasyTick</div>' +
        '</div>' +
        '<div style="'+F+'font-size:22px;font-weight:700;color:#185fa5;">'+fmtImg(window._fechTotalARepassar||0)+'</div>' +
      '</div>';

    // ── FESTIVAL: TABELA REPASSES ──
    var repImg = (typeof festGetRepasses === 'function') ? festGetRepasses() : [];
    if (repImg.length > 0) {
      var rpRows = repImg.map(function(r, i) {
        var last = i === repImg.length - 1;
        var bd = last ? '' : 'border-bottom:1px dashed #e5e7eb;';
        return '<tr>' +
          '<td style="'+F+'font-size:13px;padding:8px 10px;'+bd+'color:#1e293b;">'+(r.ok?'✓ ':'')+( r.nome||'-')+'</td>' +
          '<td style="'+F+'font-size:12px;padding:8px 10px;'+bd+'color:#475569;">'+(r.responsavel||'—')+'</td>' +
          '<td style="'+F+'font-size:12px;padding:8px 10px;'+bd+'color:#64748b;">'+(r.chavePix||'—')+'</td>' +
          '<td style="'+F+'font-size:13px;padding:8px 10px;'+bd+'text-align:right;font-weight:600;color:#1e293b;">'+fmtImg(r.valor)+'</td>' +
        '</tr>';
      }).join('');
      var totalRepImg = repImg.reduce(function(a, r){ return a + r.valor; }, 0);
      html +=
        '<div style="padding:4px 28px 0;background:#fff;">' +
          secLabel('Repasses por operacao') +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<thead><tr style="background:#f8fafc;">' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:5px 10px;text-align:left;font-weight:600;">Operacao</th>' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:5px 10px;text-align:left;font-weight:600;">Responsavel</th>' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:5px 10px;text-align:left;font-weight:600;">Chave Pix</th>' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:5px 10px;text-align:right;font-weight:600;">Valor</th>' +
            '</tr></thead>' +
            '<tbody>'+rpRows+'</tbody>' +
          '</table>' +
          '<div style="'+F+'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1.5px solid #e2e8f0;margin-top:4px;">' +
            '<span style="font-size:13px;font-weight:700;color:#374151;">Total repasses</span>' +
            '<span style="font-size:13px;font-weight:700;color:#374151;">'+fmtImg(totalRepImg)+'</span>' +
          '</div>' +
        '</div>';
    }
    if ((window._fechTotalSaques||0) > 0) {
      html += '<div style="padding:4px 28px 0;background:#fff;">' + secLabel('Saques do produtor');
      (saques||[]).forEach(function(s,i){ html += dashedRow('(-) '+(s.nome||'-'), '- '+fmtImg(s.valor), true, i===saques.length-1); });
      html += '</div>';
    }
    // ── RESTANTE PRODUTOR ──
    html +=
      '<div style="background:#166534;padding:18px 28px;display:flex;justify-content:space-between;align-items:center;">' +
        '<div>' +
          '<div style="'+F+'font-size:10px;font-weight:600;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:.08em;">Restante para o produtor</div>' +
          '<div style="'+F+'font-size:12px;color:rgba(255,255,255,0.45);margin-top:3px;">'+evento+'&nbsp;&nbsp;—&nbsp;&nbsp;'+hoje+'</div>' +
        '</div>' +
        '<div style="'+F+'font-size:28px;font-weight:700;color:#fff;">'+fmtImg(window._fechValorFinal)+'</div>' +
      '</div>';
  } else {
    // ── TOTAL DEDUÇÕES (ficha / ingresso) ──
    html +=
      '<div style="'+F+'display:flex;justify-content:space-between;align-items:center;padding:11px 28px;border-top:1.5px solid #fca5a5;background:#fff5f5;">' +
        '<span style="font-size:14px;font-weight:600;color:#374151;">Total deduções</span>' +
        '<span style="font-size:14px;font-weight:700;color:#dc2626;">- '+fmtImg(totalDed)+'</span>' +
      '</div>' +
    // ── REPASSE FINAL ──
    '<div style="background:#166534;padding:18px 28px;display:flex;justify-content:space-between;align-items:center;">' +
      '<div>' +
        '<div style="'+F+'font-size:10px;font-weight:600;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:.08em;">Repasse ao produtor</div>' +
        '<div style="'+F+'font-size:12px;color:rgba(255,255,255,0.45);margin-top:3px;">'+evento+'&nbsp;&nbsp;—&nbsp;&nbsp;'+hoje+'</div>' +
      '</div>' +
      '<div style="'+F+'font-size:28px;font-weight:700;color:#fff;">'+fmtImg(window._fechValorFinal)+'</div>' +
    '</div>';
  }

  // ── RODAPÉ ──
  html +=
  '<div style="padding:10px 28px;text-align:center;">' +
    '<span style="'+F+'font-size:11px;color:#94a3b8;">Easytick&nbsp;&nbsp;•&nbsp;&nbsp;easytick.com.br&nbsp;&nbsp;•&nbsp;&nbsp;Gerado em '+hoje+'</span>' +
  '</div>' +
  '</div>';

  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  function capturar() {
    html2canvas(wrapper.querySelector('#fech-img-wrap'), {
      scale: 2.5, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: 760
    }).then(function(canvas) {
      document.body.removeChild(wrapper);
      var link = document.createElement('a');
      link.download = 'fechamento-'+evento.toLowerCase().replace(/[^a-z0-9]/g,'-')+'-'+hoje.replace(/\//g,'-')+'.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(function(e) {
      document.body.removeChild(wrapper);
      alert('Erro ao gerar imagem: '+e.message);
    });
  }

  if (typeof html2canvas !== 'undefined') {
    capturar();
  } else {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = capturar;
    script.onerror = function(){ alert('Erro ao carregar html2canvas.'); document.body.removeChild(wrapper); };
    document.head.appendChild(script);
  }
}



// ═══════════════════════════════════════════
// FECHAMENTOS — FIREBASE
// ═══════════════════════════════════════════
var fechamentos = [];
var _fechHistFiltroStatus = 'todos';

function startFechamentosListener() {
  var db = firebase.database();
  db.ref('fechamentos').on('value', function(snap) {
    fechamentos = [];
    var val = snap.val();
    if (val) {
      Object.keys(val).forEach(function(k) {
        fechamentos.push(val[k]);
      });
      // Ordena do mais recente para o mais antigo
      fechamentos.sort(function(a,b){ return new Date(b.criadoEm) - new Date(a.criadoEm); });
    }
    if (document.getElementById('fech-historico') &&
        document.getElementById('fech-historico').classList.contains('active')) {
      renderFechHistorico();
    }
    var festTab = document.getElementById('fech-festivals');
    if (festTab && festTab.classList.contains('active')) {
      var detalhe = document.getElementById('fest-detalhe');
      if (detalhe && detalhe.style.display !== 'none' && window._currentFestId) {
        renderFestivalDetalhe(window._currentFestId);
      } else {
        renderFestHistorico();
      }
    }
  });
}

function saveFechamento(dados) {
  var db = firebase.database();
  var id = 'fech_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
  var obj = {
    id: id,
    evento: dados.evento,
    tipo: dados.tipo,
    totalGeral: dados.totalGeral,
    dinheiro: dados.dinheiro,
    totalCobrancas: dados.totalCobranças || 0,
    totalSaques: dados.totalSaques || 0,
    valorFinal: dados.valorFinal,
    totalARepassar: dados.totalARepassar || 0,
    formas: JSON.stringify(dados.formas||{}),
    pdvs: JSON.stringify(dados.pdvs||{}),
    cobrancas: JSON.stringify(dados.cobranças||[]),
    saques: JSON.stringify(dados.saques||[]),
    operacoes: JSON.stringify(dados.operacoes||[]),
    repasses: JSON.stringify(dados.repasses||[]),
    textoFinal: dados.textoFinal || '',
    criadoEm: new Date().toISOString(),
    criadoPor: getCurrentUserName()
  };
  if (dados.tipo === 'festival') obj.statusFest = 'aberto';
  db.ref('fechamentos/' + id).set(obj);
  return id;
}

function deleteFechamento(id) {
  if (!confirm('Excluir este fechamento? Esta ação não pode ser desfeita.')) return;
  firebase.database().ref('fechamentos/' + id).remove();
}

function getFechStatus(f) {
  var dataFech = f.criadoEm ? new Date(f.criadoEm) : null;
  var saquesPos = (financeiro||[]).filter(function(x) {
    if (x.tipoLancamento !== 'saque_evento') return false;
    if ((x.evento||'').toLowerCase() !== (f.evento||'').toLowerCase()) return false;
    if (x.status !== 'Pago') return false;
    if (!dataFech) return false;
    var dataPag = x.dataPagamento || x.dataSolicitacao;
    return dataPag && new Date(dataPag) > dataFech;
  });
  var totalFin = saquesPos.reduce(function(acc, x){ return acc + (x.valor||0); }, 0);
  var totalBx = 0;
  if (f.baixasManual) Object.keys(f.baixasManual).forEach(function(k){ totalBx += (f.baixasManual[k].valor||0); });
  var saldo = (f.valorFinal||0) - totalFin - totalBx;
  if (Math.round(saldo * 100) <= 0) return 'quitado';
  if ((totalFin + totalBx) > 0) return 'parcial';
  return 'pendente';
}

function setFechHistFiltroStatus(status) {
  _fechHistFiltroStatus = status;
  ['todos','pendente','parcial','quitado'].forEach(function(s) {
    var btn = document.getElementById('btn-fst-' + s);
    if (!btn) return;
    var active = s === status;
    btn.style.background = active ? '#374151' : '#f9fafb';
    btn.style.color = active ? '#fff' : '#374151';
    btn.style.border = active ? '1.5px solid #374151' : '1.5px solid var(--border)';
    btn.style.fontWeight = active ? 'bold' : 'normal';
  });
  renderFechHistorico();
}

function renderFechHistorico() {
  var container = document.getElementById('fech-hist-lista');
  if (!container) return;

  var filtro = (document.getElementById('fech-hist-filtro') ? document.getElementById('fech-hist-filtro').value : '').trim().toLowerCase();
  var filtroStatus = _fechHistFiltroStatus || 'todos';
  var lista = fechamentos.filter(function(f) {
    if (f.tipo === 'festival') return false;
    var textoOk = !filtro || (f.evento||'').toLowerCase().indexOf(filtro) > -1;
    var statusOk = filtroStatus === 'todos' || getFechStatus(f) === filtroStatus;
    return textoOk && statusOk;
  });

  if (fechamentos.length === 0) {
    container.innerHTML = '<p style="color:#9ca3af;font-size:13px;text-align:center;padding:20px">Nenhum fechamento salvo ainda.</p>';
    return;
  }
  if (lista.length === 0) {
    var msgVazio = filtroStatus !== 'todos'
      ? 'Nenhum fechamento com status "' + filtroStatus + '"' + (filtro ? ' para "' + filtro + '"' : '') + '.'
      : 'Nenhum fechamento encontrado' + (filtro ? ' para "' + filtro + '"' : '') + '.';
    container.innerHTML = '<p style="color:#9ca3af;font-size:13px;text-align:center;padding:20px">' + msgVazio + '</p>';
    return;
  }

  container.innerHTML = '';
  lista.forEach(function(f) {
    var card = document.createElement('div');
    card.style.cssText = 'background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px';

    var tipoColor = f.tipo === 'ficha' ? '#166534' : (f.tipo === 'festival' ? '#92400e' : '#1e40af');
    var tipoBg = f.tipo === 'ficha' ? '#dcfce7' : (f.tipo === 'festival' ? '#fef3c7' : '#dbeafe');
    var tipoLabel = f.tipo === 'ficha' ? '🍺 Ficha' : (f.tipo === 'festival' ? '🎪 Festival' : '🎟️ Ingresso');
    var data = f.criadoEm ? new Date(f.criadoEm).toLocaleString('pt-BR') : '-';

    // Saques pagos APÓS o fechamento para este evento
    var dataFech = f.criadoEm ? new Date(f.criadoEm) : null;
    var saquesPos = (financeiro||[]).filter(function(x) {
      if (x.tipoLancamento !== 'saque_evento') return false;
      if ((x.evento||'').toLowerCase() !== (f.evento||'').toLowerCase()) return false;
      if (x.status !== 'Pago') return false;
      if (!dataFech) return false;
      var dataPag = x.dataPagamento || x.dataSolicitacao;
      return dataPag && new Date(dataPag) > dataFech;
    });
    var totalFinanceiro = saquesPos.reduce(function(acc, x) { return acc + (x.valor||0); }, 0);
    var baixasArr = [];
    if (f.baixasManual) {
      Object.keys(f.baixasManual).forEach(function(k) { baixasArr.push(f.baixasManual[k]); });
      baixasArr.sort(function(a,b){ return new Date(a.data)-new Date(b.data); });
    }
    var totalBaixas = baixasArr.reduce(function(acc, b) { return acc + (b.valor||0); }, 0);
    var totalRepassado = totalFinanceiro + totalBaixas;
    var valorFinal = f.valorFinal || 0;
    var saldoRestante = valorFinal - totalRepassado;

    var statusColor, statusBg, statusLabel;
    if (Math.round(saldoRestante * 100) <= 0) {
      statusColor = '#166534'; statusBg = '#dcfce7'; statusLabel = 'Quitado';
    } else if (totalRepassado > 0) {
      statusColor = '#92400e'; statusBg = '#fef3c7'; statusLabel = 'Parcial';
    } else {
      statusColor = '#991b1b'; statusBg = '#fee2e2'; statusLabel = 'Pendente';
    }

    var saquesHtml = '';
    if (saquesPos.length > 0 || baixasArr.length > 0) {
      saquesHtml = '<div style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px">';
      saquesPos.forEach(function(s) {
        var ds = s.dataPagamento ? new Date(s.dataPagamento).toLocaleDateString('pt-BR') : (s.dataSolicitacao ? new Date(s.dataSolicitacao).toLocaleDateString('pt-BR') : '-');
        saquesHtml += '<div style="display:flex;justify-content:space-between;font-size:11px;color:#374151;padding:2px 0">' +
          '<span>' + (s.nome||'-') + ' <span style="color:#9ca3af">· ' + ds + '</span></span>' +
          '<span style="color:var(--red)">- ' + formatMoney(s.valor||0) + '</span>' +
        '</div>';
      });
      baixasArr.forEach(function(b) {
        var db2 = b.data ? new Date(b.data).toLocaleDateString('pt-BR') : '-';
        saquesHtml += '<div style="display:flex;justify-content:space-between;font-size:11px;color:#374151;padding:2px 0">' +
          '<span>Baixa manual' + (b.obs ? ': ' + b.obs : '') + ' <span style="color:#9ca3af">· ' + db2 + (b.user ? ' · ' + b.user : '') + '</span></span>' +
          '<span style="color:var(--red)">- ' + formatMoney(b.valor||0) + '</span>' +
        '</div>';
      });
      saquesHtml += '</div>';
    }

    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">' +
        '<div>' +
          '<b style="font-size:14px;color:#1f2937">' + (f.evento||'-') + '</b>' +
          '<span style="background:'+tipoBg+';color:'+tipoColor+';border-radius:999px;padding:2px 8px;font-size:11px;font-weight:bold;margin-left:6px">' + tipoLabel + '</span>' +
          '<div style="font-size:11px;color:#9ca3af;margin-top:3px">' + data + ' · ' + (f.criadoPor||'-') + '</div>' +
        '</div>' +
        '<b style="font-size:18px;color:var(--green);white-space:nowrap">' + formatMoney(valorFinal) + '</b>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:12px;margin-bottom:10px">' +
        '<div style="background:#f9fafb;border-radius:8px;padding:6px;text-align:center"><div style="color:#9ca3af">Total bruto</div><b>' + formatMoney(f.totalGeral||0) + '</b></div>' +
        '<div style="background:#f9fafb;border-radius:8px;padding:6px;text-align:center"><div style="color:#9ca3af">Cobranças</div><b style="color:var(--red)">- ' + formatMoney(f.totalCobrancas||0) + '</b></div>' +
        '<div style="background:#f9fafb;border-radius:8px;padding:6px;text-align:center"><div style="color:#9ca3af">Saques</div><b style="color:var(--red)">- ' + formatMoney(f.totalSaques||0) + '</b></div>' +
      '</div>' +
      '<div style="background:#f0f4ff;border-radius:10px;padding:10px;margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<span style="font-size:12px;font-weight:bold;color:#1e3a5f">Repasse pós-fechamento</span>' +
          '<span style="background:'+statusBg+';color:'+statusColor+';border-radius:999px;padding:2px 8px;font-size:11px;font-weight:bold">' + statusLabel + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:12px">' +
          '<div style="background:#fff;border-radius:8px;padding:6px;text-align:center"><div style="color:#9ca3af">A repassar</div><b style="color:#1e3a5f">' + formatMoney(valorFinal) + '</b></div>' +
          '<div style="background:#fff;border-radius:8px;padding:6px;text-align:center"><div style="color:#9ca3af">Já repassado</div><b style="color:var(--green)">- ' + formatMoney(totalRepassado) + '</b></div>' +
          '<div style="background:#fff;border-radius:8px;padding:6px;text-align:center"><div style="color:#9ca3af">Saldo</div><b style="color:' + (saldoRestante <= 0 ? 'var(--green)' : 'var(--red)') + '">' + formatMoney(Math.max(0, saldoRestante)) + '</b></div>' +
        '</div>' +
        saquesHtml +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button type="button" data-fid="' + f.id + '" onclick="histVerTexto(this)" style="flex:1;font-size:12px;background:#f3f4f6;color:#374151;border:1px solid var(--border)">📋 Ver texto</button>' +
        (Math.round(saldoRestante * 100) > 0 ? '<button type="button" onclick="abrirBaixaManual(\''+f.id+'\')" style="flex:1;font-size:12px;background:#dcfce7;color:#166534;border:1px solid #86efac;font-weight:bold">✓ Dar baixa</button>' : '') +
        (Math.round(saldoRestante * 100) > 0 ? '<button type="button" onclick="abrirSolicitarSaqueFechamento(\''+f.id+'\')" style="flex:1;font-size:12px;background:#dbeafe;color:#1e40af;border:1px solid #93c5fd;font-weight:bold">💸 Saque</button>' : '') +
        '<button type="button" data-fid="' + f.id + '" onclick="histExcluir(this)" style="font-size:12px;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;padding:6px 10px;width:auto">🗑️</button>' +
      '</div>';

    container.appendChild(card);
  });
}


function abrirSolicitarSaqueFechamento(fid) {
  var f = fechamentos.find(function(x){ return x.id === fid; });
  if (!f) return;
  var dataFech = f.criadoEm ? new Date(f.criadoEm) : null;
  var saquesPos = (financeiro||[]).filter(function(x) {
    if (x.tipoLancamento !== 'saque_evento') return false;
    if ((x.evento||'').toLowerCase() !== (f.evento||'').toLowerCase()) return false;
    if (x.status !== 'Pago') return false;
    var dataPag = x.dataPagamento || x.dataSolicitacao;
    return dataFech && dataPag && new Date(dataPag) > dataFech;
  });
  var totalFin = saquesPos.reduce(function(a, x){ return a + (x.valor||0); }, 0);
  var totalBx = 0;
  if (f.baixasManual) Object.keys(f.baixasManual).forEach(function(k){ totalBx += f.baixasManual[k].valor||0; });
  var saldoRestante = Math.max(0, (f.valorFinal||0) - totalFin - totalBx);
  setPage('financeiro');
  setFinTab('solicitar');
  setTimeout(function() {
    document.getElementById('finTipoLancamento').value = 'saque_evento';
    document.getElementById('finEvento').value = f.evento || '';
    setMoneyValue('finValor', saldoRestante);
    checkSaldoDisponivel(f.evento || '');
    document.getElementById('finNome').focus();
  }, 50);
}

function fechHistFecharModal(btn) { var m = btn; while(m && m.style && !m.style.position.includes('fixed')) m = m.parentElement; if(m) m.remove(); }
function histVerTexto(btn) { verTextoFechamento(btn.getAttribute('data-fid')); }
function histExcluir(btn) { deleteFechamento(btn.getAttribute('data-fid')); }
function histCopiar(btn) { copiarTextoHist(btn.getAttribute('data-fid')); }

function verTextoFechamento(id) {
  var f = fechamentos.find(function(x){ return x.id === id; });
  if (!f || !f.textoFinal) { alert('Texto não disponível.'); return; }
  var modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:16px 16px 0 0;padding:20px;width:100%;max-width:600px;max-height:80vh;overflow-y:auto">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:12px">' +
        '<b style="font-size:15px">' + (f.evento||'-') + '</b>' +
        '<button type="button" onclick="fechHistFecharModal(this)" style="width:auto;padding:4px 10px;font-size:12px;background:#f3f4f6;color:#374151;border:1px solid var(--border)">✕ Fechar</button>' +
      '</div>' +
      '<pre style="font-size:12px;font-family:Arial,sans-serif;line-height:1.7;white-space:pre-wrap;margin:0">' + f.textoFinal + '</pre>' +
      '<button type="button" data-fid="' + f.id + '" onclick="histCopiar(this)" style="margin-top:10px;background:#374151;font-size:13px">📋 Copiar</button>' +
    '</div>';
  document.body.appendChild(modal);
}

function copiarTextoHist(id) {
  var f = fechamentos.find(function(x){ return x.id === id; });
  if (!f) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(f.textoFinal).then(function(){ alert('Copiado!'); });
  } else {
    var ta = document.createElement('textarea');
    ta.value = f.textoFinal; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    alert('Copiado!');
  }
}

function abrirBaixaManual(fid) {
  var f = fechamentos.find(function(x){ return x.id === fid; });
  if (!f) return;
  var dataFech = f.criadoEm ? new Date(f.criadoEm) : null;
  var saquesPos = (financeiro||[]).filter(function(x) {
    if (x.tipoLancamento !== 'saque_evento') return false;
    if ((x.evento||'').toLowerCase() !== (f.evento||'').toLowerCase()) return false;
    if (x.status !== 'Pago') return false;
    if (!dataFech) return false;
    var dataPag = x.dataPagamento || x.dataSolicitacao;
    return dataPag && new Date(dataPag) > dataFech;
  });
  var totalFin = saquesPos.reduce(function(acc, x){ return acc + (x.valor||0); }, 0);
  var baixasArr = [];
  if (f.baixasManual) { Object.keys(f.baixasManual).forEach(function(k){ baixasArr.push(f.baixasManual[k]); }); }
  var totalBx = baixasArr.reduce(function(acc, b){ return acc + (b.valor||0); }, 0);
  var saldo = Math.max(0, (f.valorFinal||0) - totalFin - totalBx);

  var el = document.getElementById('modal-baixa-manual');
  if (el) el.remove();
  var modal = document.createElement('div');
  modal.id = 'modal-baixa-manual';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:16px 16px 0 0;padding:20px;width:100%;max-width:600px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
        '<b style="font-size:15px">Dar baixa manual</b>' +
        '<button type="button" onclick="document.getElementById(\'modal-baixa-manual\').remove()" style="width:auto;padding:4px 10px;font-size:12px;background:#f3f4f6;color:#374151;border:1px solid var(--border)">✕ Fechar</button>' +
      '</div>' +
      '<p style="font-size:12px;color:#6b7280;margin:0 0 12px">Registra recebimento sem criar lancamento na aba Financeiro.</p>' +
      '<div style="background:#f9fafb;border-radius:8px;padding:8px 12px;margin-bottom:14px;font-size:12px;color:#374151">' +
        '<b>' + (f.evento||'-') + '</b> &nbsp;·&nbsp; Saldo pendente: <b style="color:var(--red)">' + formatMoney(saldo) + '</b>' +
      '</div>' +
      '<div style="display:grid;gap:10px">' +
        '<label style="font-size:12px;font-weight:bold;color:var(--gray)">Valor recebido<br>' +
          '<input type="text" class="money-input" id="baixa-val" value="' + saldo.toFixed(2) + '" style="margin-top:4px"></label>' +
        '<label style="font-size:12px;font-weight:bold;color:var(--gray)">Observacao<br>' +
          '<input type="text" id="baixa-obs" placeholder="Ex: Pix direto, dinheiro na mao..." style="margin-top:4px"></label>' +
        '<button type="button" onclick="salvarBaixaManual(\'' + fid + '\')" style="background:var(--green)">Confirmar baixa</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  applyMoneyInputs();
}

function salvarBaixaManual(fid) {
  var valEl = document.getElementById('baixa-val');
  var obsEl = document.getElementById('baixa-obs');
  var valor = parseMoney(valEl ? valEl.value : 0) || 0;
  if (valor <= 0) { alert('Informe um valor valido.'); return; }
  var obs = obsEl ? obsEl.value.trim() : '';
  var key = 'bx_' + Date.now();
  firebase.database().ref('fechamentos/' + fid + '/baixasManual/' + key).set({
    valor: valor,
    obs: obs,
    data: new Date().toISOString(),
    user: getCurrentUserName()
  });
  var modal = document.getElementById('modal-baixa-manual');
  if (modal) modal.remove();
}

// ═══════════════════════════════════════════════════════════════
//  FESTIVAL — funções de suporte
// ═══════════════════════════════════════════════════════════════

var _festOpCounter = 0;

function setFechModoFestival() {
  // Esconde os outros modos
  document.getElementById('fech-modo-relatorio').style.display = 'none';
  document.getElementById('fech-modo-manual').style.display    = 'none';
  document.getElementById('fech-modo-festival').style.display  = 'block';

  // Estiliza botão ativo
  ['btn-modo-relatorio','btn-modo-manual'].forEach(function(id) {
    var b = document.getElementById(id);
    if (!b) return;
    b.style.borderColor = 'var(--border)';
    b.style.background  = '#f9fafb';
    b.style.color       = '#6b7280';
    b.style.fontWeight  = 'normal';
  });
  var bFest = document.getElementById('btn-modo-festival');
  if (bFest) {
    bFest.style.borderColor = 'var(--blue)';
    bFest.style.background  = '#eff6ff';
    bFest.style.color       = 'var(--blue)';
    bFest.style.fontWeight  = '700';
  }

  initFestival();
}

function initFestival() {
  _festOpCounter = 0;
  window._festOperacoes = [];
  window._festTotalRepasses = 0;
  window._fechTotalARepassar = 0;
  var lista = document.getElementById('fest-ops-lista');
  if (lista) lista.innerHTML = '';
  var gt = document.getElementById('fest-grand-total');
  if (gt) gt.textContent = 'R$ 0,00';
  // Adiciona primeira operação já aberta
  festAddOperacao();
}

function festAddOperacao() {
  _festOpCounter++;
  var id = _festOpCounter;
  var lista = document.getElementById('fest-ops-lista');
  if (!lista) return;

  var card = document.createElement('div');
  card.className = 'fest-op-card';
  card.setAttribute('data-id', id);
  card.style.cssText = 'background:#fff;border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px;';

  card.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
      '<div style="font-size:13px;font-weight:700;color:var(--blue);">Operação #'+id+'</div>' +
      '<button type="button" onclick="festRemoveOp('+id+')" style="width:auto;padding:3px 9px;font-size:11px;background:#fee2e2;color:#dc2626;border:none;border-radius:6px;">✕ Remover</button>' +
    '</div>' +
    '<div style="display:grid;gap:8px;">' +
      '<label style="font-size:12px;font-weight:700;color:#374151;">Nome da operação<br>' +
        '<input type="text" id="fest-op-nome-'+id+'" placeholder="Ex: Bar do João" oninput="festRecalcOp('+id+')" style="margin-top:3px;">' +
      '</label>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
        '<label style="font-size:12px;font-weight:700;color:#374151;">Débito<br><input type="text" class="money-input" id="fest-op-deb-'+id+'" value="0,00" oninput="festRecalcOp('+id+')" style="margin-top:3px;"></label>' +
        '<label style="font-size:12px;font-weight:700;color:#374151;">Crédito<br><input type="text" class="money-input" id="fest-op-cred-'+id+'" value="0,00" oninput="festRecalcOp('+id+')" style="margin-top:3px;"></label>' +
        '<label style="font-size:12px;font-weight:700;color:#374151;">Pix<br><input type="text" class="money-input" id="fest-op-pix-'+id+'" value="0,00" oninput="festRecalcOp('+id+')" style="margin-top:3px;"></label>' +
        '<label style="font-size:12px;font-weight:700;color:#374151;">Dinheiro<br><input type="text" class="money-input" id="fest-op-din-'+id+'" value="0,00" oninput="festRecalcOp('+id+')" style="margin-top:3px;"></label>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;background:#f0fdf4;border-radius:6px;padding:8px 12px;">' +
        '<span style="font-size:12px;font-weight:700;color:#166534;">Total operação</span>' +
        '<span id="fest-op-total-'+id+'" style="font-size:14px;font-weight:700;color:#166534;">R$ 0,00</span>' +
      '</div>' +
      '<button type="button" onclick="festToggleOpRel('+id+')" style="width:auto;background:#f9fafb;color:#374151;border:1px solid var(--border);font-size:12px;padding:6px 12px;text-align:left;">📋 Colar relatório (opcional)</button>' +
      '<div id="fest-op-rel-'+id+'" style="display:none;">' +
        '<textarea id="fest-op-rel-txt-'+id+'" placeholder="Cole aqui o relatório desta operação..." style="font-size:11px;min-height:70px;margin-bottom:6px;"></textarea>' +
        '<button type="button" onclick="festParsearOpRel('+id+')" style="width:auto;background:var(--blue);color:#fff;font-size:12px;padding:6px 14px;">Extrair valores</button>' +
      '</div>' +
    '</div>';

  lista.appendChild(card);
  applyMoneyInputs();
}

function festRemoveOp(id) {
  var card = document.querySelector('.fest-op-card[data-id="'+id+'"]');
  if (card) card.remove();
  festRecalcGrandTotal();
}

function festToggleOpRel(id) {
  var el = document.getElementById('fest-op-rel-'+id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function festParsearOpRel(id) {
  var txtEl = document.getElementById('fest-op-rel-txt-'+id);
  if (!txtEl || !txtEl.value.trim()) return;
  var dados = extrairDadosRelatorio(txtEl.value.trim());
  if (!dados) { alert('Não foi possível extrair os dados. Verifique o formato do relatório.'); return; }

  function setFV(elId, v) {
    var el = document.getElementById(elId);
    if (el) { el.value = formatMoney(v||0).replace('R$','').trim(); }
  }

  var formas = dados.formas || {};
  var deb = 0, cred = 0, pix = 0, din = 0;
  Object.keys(formas).forEach(function(k) {
    var kl = k.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    var v = formas[k].valor || 0;
    if (/debito/.test(kl)) deb += v;
    else if (/credito/.test(kl)) cred += v;
    else if (/pix/.test(kl)) pix += v;
    else if (/dinheiro|especie/.test(kl)) din += v;
  });

  setFV('fest-op-deb-'+id,  deb);
  setFV('fest-op-cred-'+id, cred);
  setFV('fest-op-pix-'+id,  pix);
  setFV('fest-op-din-'+id,  din);

  if (dados.evento) {
    var nomeEl = document.getElementById('fest-op-nome-'+id);
    if (nomeEl && !nomeEl.value.trim()) nomeEl.value = dados.evento;
  }

  festRecalcOp(id);
  var relDiv = document.getElementById('fest-op-rel-'+id);
  if (relDiv) relDiv.style.display = 'none';
}

function festRecalcOp(id) {
  var parse = function(elId) { return parseMoney(( document.getElementById(elId)||{}).value||0) || 0; };
  var deb  = parse('fest-op-deb-'+id);
  var cred = parse('fest-op-cred-'+id);
  var pix  = parse('fest-op-pix-'+id);
  var din  = parse('fest-op-din-'+id);
  var total = deb + cred + pix + din;
  var el = document.getElementById('fest-op-total-'+id);
  if (el) el.textContent = formatMoney(total);
  festRecalcGrandTotal();
}

function festRecalcGrandTotal() {
  var ops = festGetOpsFromForm();
  var grand = ops.reduce(function(a, o) { return a + o.total; }, 0);
  var gt = document.getElementById('fest-grand-total');
  if (gt) gt.textContent = formatMoney(grand);
}

function festGetOpsFromForm() {
  var cards = document.querySelectorAll('.fest-op-card');
  var result = [];
  cards.forEach(function(card) {
    var id = card.getAttribute('data-id');
    var nome = (document.getElementById('fest-op-nome-'+id)||{}).value || ('Operação #'+id);
    var parse = function(elId) { return parseMoney(( document.getElementById(elId)||{}).value||0) || 0; };
    var deb  = parse('fest-op-deb-'+id);
    var cred = parse('fest-op-cred-'+id);
    var pix  = parse('fest-op-pix-'+id);
    var din  = parse('fest-op-din-'+id);
    result.push({ id: id, nome: nome, deb: deb, cred: cred, pix: pix, din: din, total: deb+cred+pix+din });
  });
  return result;
}

function confirmarFestival() {
  var ops = festGetOpsFromForm();
  if (ops.length === 0) { alert('Adicione ao menos uma operação.'); return; }
  var valid = ops.filter(function(o) { return o.total > 0; });
  if (valid.length === 0) { alert('Informe os valores de pelo menos uma operação.'); return; }

  var totalBruto  = ops.reduce(function(a, o) { return a + o.total; }, 0);
  var totalDin    = ops.reduce(function(a, o) { return a + o.din; }, 0);
  var totalCartao = totalBruto - totalDin;
  var totalDeb    = ops.reduce(function(a, o) { return a + o.deb; }, 0);
  var totalCred   = ops.reduce(function(a, o) { return a + o.cred; }, 0);
  var totalPix    = ops.reduce(function(a, o) { return a + o.pix; }, 0);

  window._festOperacoes = ops;

  // Monta _fechDados como festival
  window._fechDados = window._fechDados || {};
  window._fechDados.tipo       = 'festival';
  window._fechDados.totalGeral = totalBruto;   // recalcFech usa totalGeral - dinheiro = totalCartao
  window._fechDados.totalBruto = totalBruto;
  window._fechDados.formas     = {
    'Débito':   { valor: totalDeb },
    'Crédito':  { valor: totalCred },
    'Pix':      { valor: totalPix },
    'Dinheiro': { valor: totalDin }
  };
  window._fechDados.dinheiro  = totalDin;
  window._fechDados.pdvs      = {};
  window._fechDados.operacoes = ops;

  // Evento: tenta pegar do campo se já existir, senão padrão
  var evEl = document.getElementById('fechEvento');
  if (!window._fechDados.evento && evEl && evEl.value.trim()) {
    window._fechDados.evento = evEl.value.trim();
  }

  // Gera texto do relatório para produtor no preview
  var previewEl = document.getElementById('fest-relatorio-preview');
  if (previewEl) previewEl.textContent = gerarTextoRelatorioProdutor();

  // Vai para passo 2
  renderDadosLidos();
  window._fechParams = {};
  renderCobrancas();
  renderFestRepasses();
  var evInput = document.getElementById('fechEvento');
  if (evInput && evInput.value.trim()) {
    inicializarSaquesAuto(evInput.value.trim());
  }
  document.getElementById('fech-passo1').style.display = 'none';
  document.getElementById('fech-passo2').style.display = 'block';

  // Scroll para passo 2
  var p2 = document.getElementById('fech-passo2');
  if (p2) p2.scrollIntoView({ behavior: 'smooth' });
}

function _getFestEventoNome() {
  var evEl = document.getElementById('fechEvento');
  return (window._fechDados && window._fechDados.evento) || (evEl && evEl.value.trim()) || 'Festival';
}

function gerarTextoRelatorioProdutor() {
  var ops = (window._festOperacoes && window._festOperacoes.length > 0) ? window._festOperacoes : festGetOpsFromForm();
  if (ops.length === 0) return '';
  var evento = _getFestEventoNome();
  var hoje = new Date().toLocaleDateString('pt-BR');
  var sep = '─'.repeat(44);
  var txt = '🎪 RELATÓRIO POR OPERAÇÃO\n';
  txt += evento + ' — ' + hoje + '\n';
  txt += sep + '\n';
  var fmt = function(v) { return 'R$ ' + (v||0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 }); };
  ops.forEach(function(op) {
    txt += '\n📌 ' + op.nome + '\n';
    if (op.deb  > 0) txt += '  Débito:   ' + fmt(op.deb)  + '\n';
    if (op.cred > 0) txt += '  Crédito:  ' + fmt(op.cred) + '\n';
    if (op.pix  > 0) txt += '  Pix:      ' + fmt(op.pix)  + '\n';
    if (op.din  > 0) txt += '  Dinheiro: ' + fmt(op.din)  + '\n';
    txt += '  TOTAL:    ' + fmt(op.total) + '\n';
  });
  txt += '\n' + sep + '\n';
  var grand = ops.reduce(function(a,o){ return a+o.total; }, 0);
  txt += 'TOTAL GERAL: ' + fmt(grand) + '\n';
  return txt;
}

function copiarRelatorioProdutor(btn) {
  var txt = gerarTextoRelatorioProdutor();
  if (!txt) { alert('Preencha ao menos uma operação antes de copiar.'); return; }
  function feedback() {
    if (btn) { var orig = btn.textContent; btn.textContent = '✓ Copiado!'; setTimeout(function(){ btn.textContent = orig; }, 2000); }
  }
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); feedback(); } catch(e) { alert('Não foi possível copiar. Tente manualmente.'); }
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(feedback).catch(fallback);
  } else {
    fallback();
  }
}

function baixarImagemRelatorioProdutor() {
  var ops = (window._festOperacoes && window._festOperacoes.length > 0) ? window._festOperacoes : festGetOpsFromForm();
  if (ops.length === 0) { alert('Adicione ao menos uma operação antes de baixar.'); return; }
  var evento = _getFestEventoNome();
  var hoje = new Date().toLocaleDateString('pt-BR');
  var grand = ops.reduce(function(a,o){ return a+o.total; }, 0);
  var fmt = function(v) {
    return 'R$&nbsp;' + (v||0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
  };
  var F = "font-family:'Segoe UI',Arial,sans-serif;";

  var rows = ops.map(function(op, i) {
    var last = i === ops.length - 1;
    var bd = last ? '' : 'border-bottom:1px dashed #e5e7eb;';
    return '<tr>' +
      '<td style="'+F+'font-size:13px;padding:9px 10px;'+bd+'color:#1e293b;font-weight:600;">'+op.nome+'</td>' +
      '<td style="'+F+'font-size:12px;padding:9px 10px;'+bd+'text-align:right;color:#475569;">'+(op.deb>0?fmt(op.deb):'—')+'</td>' +
      '<td style="'+F+'font-size:12px;padding:9px 10px;'+bd+'text-align:right;color:#475569;">'+(op.cred>0?fmt(op.cred):'—')+'</td>' +
      '<td style="'+F+'font-size:12px;padding:9px 10px;'+bd+'text-align:right;color:#475569;">'+(op.pix>0?fmt(op.pix):'—')+'</td>' +
      '<td style="'+F+'font-size:12px;padding:9px 10px;'+bd+'text-align:right;color:#64748b;">'+(op.din>0?fmt(op.din):'—')+'</td>' +
      '<td style="'+F+'font-size:13px;padding:9px 10px;'+bd+'text-align:right;font-weight:700;color:#166534;">'+fmt(op.total)+'</td>' +
    '</tr>';
  }).join('');

  var html =
    '<div id="_fest-rel-img" style="width:640px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.12);">' +
      // Header
      '<div style="background:var(--blue,#004aad);padding:20px 28px;">' +
        '<div style="'+F+'font-size:11px;font-weight:600;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">Relatório por operação</div>' +
        '<div style="'+F+'font-size:18px;font-weight:700;color:#fff;">'+evento+'</div>' +
        '<div style="'+F+'font-size:12px;color:rgba(255,255,255,.5);margin-top:2px;">Gerado em '+hoje+'</div>' +
      '</div>' +
      // Tabela
      '<div style="padding:16px 20px;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead>' +
            '<tr style="background:#f8fafc;">' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:6px 10px;text-align:left;font-weight:600;">Operação</th>' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:6px 10px;text-align:right;font-weight:600;">Débito</th>' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:6px 10px;text-align:right;font-weight:600;">Crédito</th>' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:6px 10px;text-align:right;font-weight:600;">Pix</th>' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:6px 10px;text-align:right;font-weight:600;">Dinheiro</th>' +
              '<th style="'+F+'font-size:10px;color:#94a3b8;text-transform:uppercase;padding:6px 10px;text-align:right;font-weight:600;">Total</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>'+rows+'</tbody>' +
        '</table>' +
      '</div>' +
      // Total geral
      '<div style="background:#166534;padding:16px 28px;display:flex;justify-content:space-between;align-items:center;">' +
        '<div style="'+F+'font-size:12px;font-weight:600;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.06em;">Total geral</div>' +
        '<div style="'+F+'font-size:24px;font-weight:700;color:#fff;">'+fmt(grand)+'</div>' +
      '</div>' +
      '<div style="padding:8px 20px;text-align:center;">' +
        '<span style="'+F+'font-size:10px;color:#94a3b8;">Easytick&nbsp;•&nbsp;easytick.com.br&nbsp;•&nbsp;Gerado em '+hoje+'</span>' +
      '</div>' +
    '</div>';

  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
  var target = wrapper.querySelector('#_fest-rel-img');

  function capturarFest() {
    html2canvas(target, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false }).then(function(canvas) {
      document.body.removeChild(wrapper);
      var link = document.createElement('a');
      link.download = 'relatorio-produtor-' + (evento||'festival').replace(/\s+/g,'-').toLowerCase() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(function(e) {
      document.body.removeChild(wrapper);
      alert('Erro ao gerar imagem: ' + e.message);
    });
  }

  if (typeof html2canvas !== 'undefined') {
    capturarFest();
  } else {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = capturarFest;
    script.onerror = function() { alert('Erro ao carregar html2canvas.'); document.body.removeChild(wrapper); };
    document.head.appendChild(script);
  }
}

// ── PASSO 3: Repasses ──

var _festRpCounter = 0;

function renderFestRepasses() {
  var sec = document.getElementById('fest-repasses-section');
  if (sec) sec.style.display = 'block';
  var lista = document.getElementById('fest-repasses-lista');
  if (!lista) return;
  lista.innerHTML = '';
  _festRpCounter = 0;
  var ops = window._festOperacoes || [];
  // Pré-popula com uma linha por operação
  ops.forEach(function(op) {
    festAddRepasseRow(op.nome, '', 0, '');
  });
  festRecalcRepasses();
}

function festAddRepasseRow(nome, responsavel, valor, chavePix) {
  _festRpCounter++;
  var id = _festRpCounter;
  var lista = document.getElementById('fest-repasses-lista');
  if (!lista) return;

  var row = document.createElement('div');
  row.className = 'fest-rp-row';
  row.setAttribute('data-id', id);
  row.style.cssText = 'background:#f9fafb;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;';

  row.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
      '<span style="font-size:12px;font-weight:700;color:#374151;">Repasse #'+id+'</span>' +
      '<button type="button" onclick="festRemoveRepasse('+id+')" style="width:auto;padding:2px 8px;font-size:11px;background:#fee2e2;color:#dc2626;border:none;border-radius:6px;">✕</button>' +
    '</div>' +
    '<div style="display:grid;gap:7px;">' +
      '<label style="font-size:11px;font-weight:700;color:#374151;">Operação / Beneficiário<br>' +
        '<input type="text" id="fest-rp-nome-'+id+'" value="'+(nome||'')+'" style="margin-top:3px;" oninput="festRecalcRepasses()">' +
      '</label>' +
      '<label style="font-size:11px;font-weight:700;color:#374151;">Responsável<br>' +
        '<input type="text" id="fest-rp-resp-'+id+'" value="'+(responsavel||'')+'" placeholder="Nome do responsável" style="margin-top:3px;">' +
      '</label>' +
      '<label style="font-size:11px;font-weight:700;color:#374151;">Chave Pix<br>' +
        '<input type="text" id="fest-rp-pix-'+id+'" value="'+(chavePix||'')+'" placeholder="CPF, telefone, e-mail..." style="margin-top:3px;">' +
      '</label>' +
      '<label style="font-size:11px;font-weight:700;color:#374151;">Valor a repassar<br>' +
        '<input type="text" class="money-input" id="fest-rp-val-'+id+'" value="'+(valor > 0 ? (valor).toFixed(2) : '0,00')+'" oninput="festRecalcRepasses()" style="margin-top:3px;">' +
      '</label>' +
    '</div>';

  lista.appendChild(row);
  applyMoneyInputs();
}

function festRemoveRepasse(id) {
  var row = document.querySelector('.fest-rp-row[data-id="'+id+'"]');
  if (row) row.remove();
  festRecalcRepasses();
}

function festRecalcRepasses() {
  var reps = festGetRepasses();
  var total = reps.reduce(function(a, r) { return a + r.valor; }, 0);
  window._festTotalRepasses = total;
  var el = document.getElementById('fest-repasses-total');
  if (el) el.textContent = formatMoney(total);
  // Recalcula o fechamento completo
  if (typeof recalcFech === 'function') recalcFech();
}

function festGetRepasses() {
  var rows = document.querySelectorAll('.fest-rp-row');
  var result = [];
  rows.forEach(function(row) {
    var id  = row.getAttribute('data-id');
    var nome = (document.getElementById('fest-rp-nome-'+id)||{}).value || '';
    var resp = (document.getElementById('fest-rp-resp-'+id)||{}).value || '';
    var pix  = (document.getElementById('fest-rp-pix-'+id)||{}).value  || '';
    var val  = parseMoney((document.getElementById('fest-rp-val-'+id)||{}).value||0) || 0;
    result.push({ nome: nome, responsavel: resp, chavePix: pix, valor: val });
  });
  return result;
}

// ══════════════════════════════════════════════
// ABA FESTIVALS — histórico e gestão de repasses
// ══════════════════════════════════════════════

function renderFestHistorico() {
  var container = document.getElementById('fest-hist-lista');
  if (!container) return;
  var lista = fechamentos.filter(function(f) { return f.tipo === 'festival'; });
  if (lista.length === 0) {
    container.innerHTML = '<p style="color:#9ca3af;font-size:13px;text-align:center;padding:24px">Nenhum festival salvo ainda.<br>Crie um fechamento do tipo Festival.</p>';
    return;
  }
  container.innerHTML = '';
  lista.forEach(function(f) {
    var statusFest = f.statusFest || 'aberto';
    var isAberto = statusFest === 'aberto';
    var disponivel = f.valorFinal || 0;
    var log = _festParseLog(f);
    var distribuido = log.filter(function(r){ return r.status === 'pago'; }).reduce(function(a,r){ return a+(r.valor||0); }, 0);
    var pendente = log.filter(function(r){ return r.status !== 'pago'; }).reduce(function(a,r){ return a+(r.valor||0); }, 0);
    var restante = disponivel - distribuido - pendente;
    var data = f.criadoEm ? new Date(f.criadoEm).toLocaleDateString('pt-BR') : '-';
    var statusColor = isAberto ? '#92400e' : '#166534';
    var statusBg    = isAberto ? '#fef3c7' : '#dcfce7';
    var statusLabel = isAberto ? '🔄 Aberto' : '✓ Encerrado';
    var card = document.createElement('div');
    card.style.cssText = 'background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px';
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
        '<div>' +
          '<b style="font-size:14px;color:#1f2937">' + (f.evento||'-') + '</b>' +
          '<div style="font-size:11px;color:#9ca3af;margin-top:2px">' + data + ' · ' + (f.criadoPor||'-') + '</div>' +
        '</div>' +
        '<span style="background:'+statusBg+';color:'+statusColor+';border-radius:999px;padding:3px 10px;font-size:11px;font-weight:bold">' + statusLabel + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:12px;margin-bottom:10px">' +
        '<div style="background:#eff6ff;border-radius:8px;padding:7px;text-align:center"><div style="color:#1e40af;font-size:10px">Disponível</div><b style="color:var(--blue)">' + formatMoney(disponivel) + '</b></div>' +
        '<div style="background:#f0fdf4;border-radius:8px;padding:7px;text-align:center"><div style="color:#166534;font-size:10px">Pago</div><b style="color:var(--green)">' + formatMoney(distribuido) + '</b></div>' +
        '<div style="background:' + (restante > 0.01 ? '#fff7ed' : '#f9fafb') + ';border-radius:8px;padding:7px;text-align:center"><div style="color:' + (restante > 0.01 ? '#c2410c' : '#6b7280') + ';font-size:10px">Saldo</div><b style="color:' + (restante > 0.01 ? '#c2410c' : '#374151') + '">' + formatMoney(Math.max(0, restante)) + '</b></div>' +
      '</div>' +
      '<button type="button" onclick="abrirFestivalDetalhe(\''+f.id+'\')" style="width:100%;font-size:13px;background:var(--blue);color:#fff">📂 Abrir Festival</button>';
    container.appendChild(card);
  });
}

function _festParseLog(f) {
  var log = [];
  if (f.repassesLog && typeof f.repassesLog === 'object') {
    Object.keys(f.repassesLog).forEach(function(k) {
      log.push(Object.assign({}, f.repassesLog[k], { _id: k }));
    });
    log.sort(function(a, b) { return (a.data || '') < (b.data || '') ? -1 : 1; });
  }
  return log;
}

function abrirFestivalDetalhe(id) {
  window._currentFestId = id;
  document.getElementById('fest-hist-lista').style.display = 'none';
  var d = document.getElementById('fest-detalhe');
  if (d) { d.style.display = 'block'; renderFestivalDetalhe(id); }
}

function fecharFestivalDetalhe() {
  window._currentFestId = null;
  var d = document.getElementById('fest-detalhe');
  if (d) d.style.display = 'none';
  document.getElementById('fest-hist-lista').style.display = 'block';
  renderFestHistorico();
}

function renderFestivalDetalhe(id) {
  var f = fechamentos.find(function(x){ return x.id === id; });
  if (!f) { fecharFestivalDetalhe(); return; }
  var detalhe = document.getElementById('fest-detalhe');
  if (!detalhe) return;

  var disponivel = f.valorFinal || 0;
  var ops = []; try { ops = JSON.parse(f.operacoes||'[]'); } catch(e){}
  var log = _festParseLog(f);
  var totalPago    = log.filter(function(r){ return r.status === 'pago'; }).reduce(function(a,r){ return a+(r.valor||0); }, 0);
  var totalPend    = log.filter(function(r){ return r.status !== 'pago'; }).reduce(function(a,r){ return a+(r.valor||0); }, 0);
  var saldoLivre   = disponivel - totalPago - totalPend;

  var statusFest = f.statusFest || 'aberto';
  var isAberto   = statusFest === 'aberto';
  var sColor = isAberto ? '#92400e' : '#166534';
  var sBg    = isAberto ? '#fef3c7' : '#dcfce7';
  var sLabel = isAberto ? '🔄 Aberto' : '✓ Encerrado';

  // operacoes summary
  var totalCard = ops.reduce(function(a,o){ return a+(o.deb||0)+(o.cred||0)+(o.pix||0); }, 0);
  var opsHtml = ops.map(function(op) {
    var card = (op.deb||0)+(op.cred||0)+(op.pix||0);
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">' +
      '<span style="font-weight:600;color:#1f2937">' + (op.nome||'Operação') + '</span>' +
      '<div style="text-align:right">' +
        '<div style="font-weight:bold">' + formatMoney(op.total||0) + '</div>' +
        '<div style="font-size:10px;color:#6b7280">cartão: ' + formatMoney(card) + ' · din: ' + formatMoney(op.din||0) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  // log entries
  var tipoLabel = { repasse: 'Repasse', saque: 'Saque', despesa: 'Despesa' };
  var tColor = { repasse: '#166534', saque: '#92400e', despesa: '#991b1b' };
  var tBg    = { repasse: '#dcfce7', saque: '#fef3c7', despesa: '#fee2e2' };
  var logHtml = log.length === 0
    ? '<p style="color:#9ca3af;font-size:12px;text-align:center;padding:12px">Nenhum lançamento ainda. Clique em + Adicionar.</p>'
    : log.map(function(r) {
        var isPago = r.status === 'pago';
        var tl = tipoLabel[r.tipo] || r.tipo;
        var tc = tColor[r.tipo] || '#374151';
        var tb = tBg[r.tipo] || '#f3f4f6';
        var df = r.data ? new Date(r.data+'T12:00:00').toLocaleDateString('pt-BR') : '-';
        return '<div style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
            '<div>' +
              '<span style="background:'+tb+';color:'+tc+';border-radius:999px;padding:2px 7px;font-size:10px;font-weight:bold">'+tl+'</span>' +
              ' <b style="font-size:12px;color:#1f2937">'+r.beneficiario+'</b>' +
              (r.tipoBenef === 'produtor' ? ' <span style="font-size:10px;color:#6b7280">produtor</span>' : '') +
            '</div>' +
            '<b style="font-size:14px;color:var(--blue)">'+formatMoney(r.valor||0)+'</b>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<span style="font-size:10px;color:#9ca3af">' + df + (r.chavePix?' · '+r.chavePix:'') + (r.obs?' · '+r.obs:'') + '</span>' +
            '<div style="display:flex;gap:4px">' +
              '<button type="button" onclick="festToggleLogStatus(\''+f.id+'\',\''+r._id+'\',\''+r.status+'\')" style="width:auto;padding:3px 8px;font-size:10px;background:'+(isPago?'#dcfce7':'#fef3c7')+';color:'+(isPago?'#166534':'#92400e')+';border:none;border-radius:5px">'+(isPago?'✓ Pago':'⏳ Pendente')+'</button>' +
              '<button type="button" onclick="festRemoverLogEntry(\''+f.id+'\',\''+r._id+'\')" style="width:auto;padding:3px 6px;font-size:10px;background:#fee2e2;color:#dc2626;border:none;border-radius:5px">✕</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

  // beneficiary balances
  var benefMap = {};
  log.forEach(function(r) {
    if (!benefMap[r.beneficiario]) benefMap[r.beneficiario] = { pago: 0, pend: 0, tipo: r.tipoBenef };
    if (r.status === 'pago') benefMap[r.beneficiario].pago += (r.valor||0);
    else benefMap[r.beneficiario].pend += (r.valor||0);
  });
  var benefHtml = Object.keys(benefMap).length === 0
    ? '<p style="font-size:12px;color:#9ca3af;text-align:center">Sem movimentações.</p>'
    : Object.keys(benefMap).map(function(b) {
        var bm = benefMap[b];
        var icon = bm.tipo === 'produtor' ? '🎪' : '🏪';
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">' +
          '<span style="color:#374151">'+icon+' '+b+'</span>' +
          '<div style="text-align:right">' +
            '<div style="color:var(--green);font-weight:bold">pago: '+formatMoney(bm.pago)+'</div>' +
            (bm.pend > 0 ? '<div style="font-size:10px;color:#92400e">pendente: '+formatMoney(bm.pend)+'</div>' : '') +
          '</div>' +
        '</div>';
      }).join('');

  // beneficiary options for form
  var benefOpts = '<option value="">-- Selecionar --</option><option value="Produtor" data-tipo="produtor">🎪 Produtor</option>';
  ops.forEach(function(op){ benefOpts += '<option value="'+(op.nome||'Operação')+'" data-tipo="operacao">🏪 '+(op.nome||'Operação')+'</option>'; });

  detalhe.innerHTML =
    // Header
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
      '<button type="button" onclick="fecharFestivalDetalhe()" style="width:auto;padding:5px 12px;background:#f3f4f6;color:#374151;border:1px solid var(--border);font-size:12px">← Voltar</button>' +
      '<div style="flex:1"><b style="font-size:15px;color:#1f2937">'+(f.evento||'-')+'</b><div style="font-size:11px;color:#9ca3af">'+(f.criadoEm?new Date(f.criadoEm).toLocaleDateString('pt-BR'):'-')+'</div></div>' +
      '<span style="background:'+sBg+';color:'+sColor+';border-radius:999px;padding:3px 10px;font-size:11px;font-weight:bold">'+sLabel+'</span>' +
    '</div>' +
    // Summary bar
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">' +
      '<div style="background:#eff6ff;border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;color:#1e40af">Disponível</div><b style="font-size:15px;color:var(--blue)">'+formatMoney(disponivel)+'</b></div>' +
      '<div style="background:#f0fdf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;color:#166534">Pago</div><b style="font-size:15px;color:var(--green)">'+formatMoney(totalPago)+'</b></div>' +
      '<div style="background:'+(totalPend>0?'#fef3c7':'#f9fafb')+';border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;color:'+(totalPend>0?'#92400e':'#6b7280')+'">Pendente</div><b style="font-size:15px;color:'+(totalPend>0?'#92400e':'#374151')+'">'+formatMoney(totalPend)+'</b></div>' +
    '</div>' +
    // Operacoes
    '<details style="margin-bottom:12px">' +
      '<summary style="font-size:12px;font-weight:bold;color:#374151;cursor:pointer;padding:10px;background:#f9fafb;border:1.5px solid var(--border);border-radius:10px">📊 Operações do Festival · total '+formatMoney(f.totalGeral||0)+'</summary>' +
      '<div style="background:#f9fafb;border:1.5px solid var(--border);border-top:none;border-radius:0 0 10px 10px;padding:10px">' +
        opsHtml +
        '<div style="display:flex;justify-content:space-between;font-size:11px;color:#6b7280;padding-top:6px"><span>Em cartão (Easytick recebeu)</span><span>'+formatMoney(totalCard)+'</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--red);margin-top:2px"><span>(-) Cobranças Easytick</span><span>'+formatMoney(f.totalCobrancas||0)+'</span></div>' +
        (f.totalSaques > 0 ? '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--red);margin-top:2px"><span>(-) Saques antecipados</span><span>'+formatMoney(f.totalSaques||0)+'</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:bold;color:#166534;margin-top:6px;padding-top:6px;border-top:1px solid var(--border)"><span>Disponível para distribuir</span><span>'+formatMoney(disponivel)+'</span></div>' +
      '</div>' +
    '</details>' +
    // Repasses log
    '<div style="background:#f9fafb;border:1.5px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
        '<div style="font-size:12px;font-weight:bold;color:#374151">💸 Repasses & Saques</div>' +
        '<button type="button" onclick="festToggleAddForm(\''+f.id+'\',\''+benefOpts.replace(/'/g,'&#39;')+'\')" id="btn-fest-add" style="width:auto;padding:4px 10px;font-size:11px;background:var(--blue);color:#fff;border:none;border-radius:6px">+ Adicionar</button>' +
      '</div>' +
      '<div id="fest-log-form" style="display:none;background:#fff;border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:10px"></div>' +
      '<div id="fest-log-entries">' + logHtml + '</div>' +
    '</div>' +
    // Balances
    '<div style="background:#f9fafb;border:1.5px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px">' +
      '<div style="font-size:12px;font-weight:bold;color:#374151;margin-bottom:8px">👥 Por Beneficiário</div>' +
      benefHtml +
      (saldoLivre > 0.01 ? '<div style="display:flex;justify-content:space-between;font-size:12px;padding-top:6px;margin-top:4px;border-top:1px solid var(--border)"><span style="color:#6b7280">Saldo livre (não alocado)</span><b style="color:var(--blue)">'+formatMoney(saldoLivre)+'</b></div>' : '') +
    '</div>' +
    // Footer
    '<div style="display:flex;gap:8px">' +
      (isAberto
        ? '<button type="button" onclick="festEncerrarFestival(\''+f.id+'\')" style="flex:1;background:#dcfce7;color:#166534;border:1.5px solid #86efac;font-size:13px">✓ Encerrar Festival</button>'
        : '<button type="button" onclick="festReabrirFestival(\''+f.id+'\')" style="flex:1;background:#fef3c7;color:#92400e;border:1.5px solid #fcd34d;font-size:13px">🔄 Reabrir Festival</button>') +
      '<button type="button" onclick="festDeletar(\''+f.id+'\')" style="width:auto;padding:8px 12px;background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;font-size:13px">🗑️</button>' +
    '</div>';
}

function festToggleAddForm(festId, benefOptsHtml) {
  var form = document.getElementById('fest-log-form');
  if (!form) return;
  if (form.style.display !== 'none') { form.style.display = 'none'; return; }
  form.innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">' +
      '<label style="font-size:11px;font-weight:bold;color:#374151">Data<br><input type="date" id="flf-data" value="'+new Date().toISOString().substr(0,10)+'" style="margin-top:3px;font-size:12px;padding:6px 8px;width:100%;box-sizing:border-box"></label>' +
      '<label style="font-size:11px;font-weight:bold;color:#374151">Tipo<br><select id="flf-tipo" style="margin-top:3px;font-size:12px;padding:6px 8px;width:100%;box-sizing:border-box"><option value="repasse">Repasse final</option><option value="saque">Saque / Adiantamento</option><option value="despesa">Despesa do produtor</option></select></label>' +
    '</div>' +
    '<div style="margin-bottom:8px"><label style="font-size:11px;font-weight:bold;color:#374151">Beneficiário<br><select id="flf-benef" style="margin-top:3px;font-size:12px;padding:6px 8px;width:100%;box-sizing:border-box">'+benefOptsHtml+'</select></label></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">' +
      '<label style="font-size:11px;font-weight:bold;color:#374151">Valor<br><input type="text" class="money-input" id="flf-valor" placeholder="0,00" style="margin-top:3px"></label>' +
      '<label style="font-size:11px;font-weight:bold;color:#374151">Chave Pix<br><input type="text" id="flf-pix" placeholder="CPF, tel, e-mail..." style="margin-top:3px;font-size:12px;padding:6px 8px"></label>' +
    '</div>' +
    '<div style="margin-bottom:10px"><label style="font-size:11px;font-weight:bold;color:#374151">Observação<br><input type="text" id="flf-obs" placeholder="Opcional..." style="margin-top:3px;font-size:12px;padding:6px 8px;width:100%;box-sizing:border-box"></label></div>' +
    '<div style="display:flex;gap:8px">' +
      '<button type="button" onclick="festSalvarLogEntry(\''+festId+'\')" style="flex:1;font-size:13px;background:var(--green)">✓ Salvar</button>' +
      '<button type="button" onclick="document.getElementById(\'fest-log-form\').style.display=\'none\'" style="flex:1;font-size:13px;background:#f3f4f6;color:#374151;border:1px solid var(--border)">Cancelar</button>' +
    '</div>';
  form.style.display = 'block';
  applyMoneyInputs();
}

function festSalvarLogEntry(festId) {
  var data  = (document.getElementById('flf-data')||{}).value || new Date().toISOString().substr(0,10);
  var tipo  = (document.getElementById('flf-tipo')||{}).value || 'repasse';
  var benefSel = document.getElementById('flf-benef');
  var benefNome = benefSel ? benefSel.value : '';
  var opt = benefSel && benefSel.options ? benefSel.options[benefSel.selectedIndex] : null;
  var tipoBenef = opt ? (opt.getAttribute('data-tipo')||'operacao') : 'operacao';
  var valor = parseMoney((document.getElementById('flf-valor')||{}).value||'0') || 0;
  var pix   = (document.getElementById('flf-pix')||{}).value || '';
  var obs   = (document.getElementById('flf-obs')||{}).value || '';
  if (!benefNome) { alert('Selecione o beneficiário.'); return; }
  if (valor <= 0)  { alert('Informe um valor maior que zero.'); return; }
  var entry = { data: data, beneficiario: benefNome, tipoBenef: tipoBenef, tipo: tipo, valor: valor, chavePix: pix, obs: obs, status: 'pendente', criadoEm: new Date().toISOString() };
  firebase.database().ref('fechamentos/' + festId + '/repassesLog').push(entry).catch(function(e){ alert('Erro: ' + e.message); });
}

function festToggleLogStatus(festId, entryId, current) {
  var next = current === 'pago' ? 'pendente' : 'pago';
  firebase.database().ref('fechamentos/' + festId + '/repassesLog/' + entryId + '/status').set(next);
}

function festRemoverLogEntry(festId, entryId) {
  if (!confirm('Remover este lançamento?')) return;
  firebase.database().ref('fechamentos/' + festId + '/repassesLog/' + entryId).remove();
}

function festEncerrarFestival(id) {
  if (!confirm('Encerrar este festival? Você poderá reabrir se necessário.')) return;
  firebase.database().ref('fechamentos/' + id + '/statusFest').set('encerrado');
}

function festReabrirFestival(id) {
  firebase.database().ref('fechamentos/' + id + '/statusFest').set('aberto');
}

function festDeletar(id) {
  if (!confirm('Excluir este festival permanentemente? Esta ação não pode ser desfeita.')) return;
  firebase.database().ref('fechamentos/' + id).remove().then(function() { fecharFestivalDetalhe(); });
}

