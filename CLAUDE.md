# Easytick – Maquinas

## Visao geral

Aplicacao web SPA (Single Page Application) em HTML/CSS/JS puro com Firebase como backend. Todo o codigo vive em um unico arquivo `index.html` (~4800 linhas). Sem build step, sem framework, sem bundler.

## Stack

- **Frontend:** HTML + CSS + JavaScript vanilla (ES5 compativel)
- **Backend:** Firebase Realtime Database + Firebase Auth
- **Dependencias externas (CDN):** firebase-app-compat, firebase-auth-compat, firebase-database-compat (v9.23.0)

## Estrutura do arquivo index.html

1. `<head>` — imports Firebase CDN + todo o CSS inline
2. `<body>` — telas de login e app, paginas, nav inferior, modais
3. `<script>` — toda a logica JS (linha ~1252 em diante)

## Paginas (bottom nav — 6 abas)

| ID | Aba | Funcao principal |
|----|-----|-----------------|
| `page-inicio` | Inicio | Dashboard com contadores e alertas do dia |
| `page-maquinas` | Maquinas | Lista filtravel por status, marca, serial |
| `page-acoes` | Acoes | Operacoes em lote (reservar/saida/entrada/renovar/cancelar/manutencao/intencoes) |
| `page-financeiro` | Financeiro | Solicitar pagamento, pendentes, extrato, saldo por evento |
| `page-recorrentes` | Recorrentes | Clientes com cobrancas periodicas |
| `page-fechamentos` | Fechamento | Geracao de fechamento de evento com calculo de repasse |

## Dados no Firebase

| Ref | Conteudo |
|-----|---------|
| `/machines` | Maquinas: `{serial, brand, status, history[], reservations[]}` |
| `/financeiro` | Lancamentos: `{id, evento, nome, tipo, valor, status, ...}` |
| `/reservasIntencao` | Reservas sem serial definido (por quantidade) |
| `/saldoEventos` | Saldo disponivel por evento (monitoramento) |
| `/recorrentes` | Clientes recorrentes |
| `/recPagamentos` | Historico de pagamentos de recorrentes |

## Status das maquinas

```
Disponivel --> Reservada hoje --> Em uso --> Em atraso
                                        --> Disponivel (apos entrada)
Disponivel --> Manutencao --> Disponivel
```

- `getRealStatus(m)` — calcula status real (detecta atraso e reserva do dia automaticamente)
- `normalizeStatus(s)` — normaliza strings com/sem acento de dados antigos

## Fluxo de operacoes em lote (page-acoes)

- **Reservar:** 3 modos — Automatico (escolhe maquinas com menos uso), Manual (selecao), Quantidade (reserva de intencao sem serial)
- **Saida:** 2 modos — Automatico, Manual
- **Entrada:** seleciona evento → lista maquinas em uso naquele evento → confirma devolucao
- **Renovar:** estende `endDate` da ultima saida sem dar entrada/saida
- **Cancelar:** remove reservas de um evento especifico
- **Manutencao:** envia maquinas disponiveis para status Manutencao
- **Intencoes:** gerencia reservas por quantidade — permite dar saida definindo os seriais no momento

## Financeiro

- Parsing automatico de texto WhatsApp (padrao `*Campo:* Valor`)
- Tipos de lancamento: saque de evento, pagamento funcionario, servico, boleto, fornecedor, outros
- Tipos de pagamento: Pix (com tipo de chave), Transferencia, Dinheiro, Boleto
- Bancos: Santander, Efi Bank, Stone, PagBank, Sicoob
- Alertas de pagamentos pendentes na tela Inicio

## Fechamento de evento

- 2 modos de entrada: colar relatorio de vendas ou inserir manualmente
- 2 tipos de evento: Ficha (bares/festas) ou Ingresso
- Para ingresso: relatorio separado por origem (Loja Virtual + Aplicativo)
- Calculo: total bruto - dinheiro (fica com produtor) - cobranças/taxas - saques antecipados = valor a repassar
- Conciliacao automatica de saques do financeiro pelo nome do evento
- Exportacao: copiar texto ou baixar imagem

## Recorrentes

- Planos: Ficha, Ingresso, Mensalidade, Outro
- Frequencias: mensal (por dia do mes), anual (por mes), unica
- Status calculados: `emdia`, `vencendo` (proximo vencimento em ate 7 dias), `atrasado`, `inativo`
- Extrato com filtros por mes e cliente

## Padroes de codigo

- JavaScript ES5 (sem arrow functions, sem `let/const`, sem template literals em critico)
- Funcoes nomeadas globais para handlers de eventos inline (`onclick="fn()"`)
- Estado global: `machines[]`, `financeiro[]`, `currentUser`, `reservasIntencao[]`
- `save()` e `saveFinanceiro()` escrevem todo o objeto de volta no Firebase
- Autocomplete reutilizavel: `showAutocomplete()`, `handleAutocompleteKey()`, `hideAutocomplete()`
- Hooks de listeners encadeados com pattern `var _orig = fn; fn = function(){ _orig(); novoCodigo(); }`

## Marcas suportadas

`Sipag`, `PagBank`, `Stone`

## Variaveis CSS principais

```css
--blue: #004aad
--blue2: #003b8a
--green: #16a34a
--red: #dc2626
--gray: #374151
--border: #e5e7eb
```

## Alertas automaticos (tela Inicio)

- Maquinas com saida prevista para hoje (reservas)
- Maquinas com retorno previsto para hoje (em uso)
- Maquinas em atraso (passou da data de retorno)
- Pagamentos financeiros pendentes
- Reservas de intencao com saida em ate 3 dias

## Deploy

Arquivo unico `index.html` hospedado estaticamente. Sem servidor necessario alem do Firebase.
