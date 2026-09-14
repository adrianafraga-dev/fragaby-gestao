// Conexão com o Supabase
const SUPABASE_URL = 'https://oyjqbucxweiqcvjodcmu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_REksvaGofFHV8NbBrgGmIA_ycxB8r7I';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Buscar dados do banco
async function carregarProdutosDoBanco() {
  const { data, error } = await supabase.from('produtos').select('*');
  if (error) {
    console.error('Erro ao buscar produtos:', error);
    return;
  }
  if (data && data.length > 0) {
    produtosEstoque = data;
    atualizarTabelaEstoque();
    atualizarResumosCabecalho();
  }
}
/**
 * ==========================================================================
 * DRINKS.BY GESTÃO INTELIGENTE - LÓGICA DA APLICAÇÃO (script.js)
 * Desenvolvido por: Fraga Tech Solutions
 * Empresa (Cliente): Drinks.By (Unidade Mairinque)
 * 
 * Descrição: Este arquivo contém as regras de negócio, manipulação do DOM,
 * simulação de leitura OCR de notas fiscais, cálculo de prazos de validade,
 * análise estatística de vendas e precificação dinâmica com validação de margem.
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. ESTADO INICIAL DA APLICAÇÃO E DADOS SIMULADOS (MOCK DATA)
// --------------------------------------------------------------------------

/**
 * Lista de Produtos no Estoque da Drinks.By (Unidade Mairinque)
 * Variáveis envolvidas: nome_produto, quantidade_atual, nivel_minimo, custo_aquisicao
 */
let produtosEstoque = [
  { id: 1, nome: "Gin Tanqueray London Dry 750ml", quantidade_atual: 8, nivel_minimo: 15, custo_aquisicao: 92.00 },
  { id: 2, nome: "Energético Red Bull Energy Drink 250ml", quantidade_atual: 120, nivel_minimo: 80, custo_aquisicao: 6.50 },
  { id: 3, nome: "Cerveja Heineken garrafa 600ml", quantidade_atual: 35, nivel_minimo: 100, custo_aquisicao: 7.20 },
  { id: 4, nome: "Whisky Johnnie Walker Red Label 1L", quantidade_atual: 5, nivel_minimo: 12, custo_aquisicao: 75.00 },
  { id: 5, nome: "Vodka Absolut Original 1L", quantidade_atual: 18, nivel_minimo: 15, custo_aquisicao: 68.00 },
  { id: 6, nome: "Gelo de Coco Especial Mairinque (Pacote 1kg)", quantidade_atual: 14, nivel_minimo: 30, custo_aquisicao: 4.50 }
];

/**
 * Lista de Lotes e Prazos de Validade
 * Variáveis envolvidas: numero_lote, data_validade, dias_para_vencer, status_alerta, desconto_promocional
 */
// Calculando datas relativas a hoje para simulação realista
const hoje = new Date();
function criarDataRelativa(dias) {
  const d = new Date(hoje);
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

let lotesProdutos = [
  { id: 101, produto_id: 1, produto_nome: "Gin Tanqueray London Dry 750ml", numero_lote: "LT-TANQ-2026A", quantidade_lote: 8, data_validade: criarDataRelativa(5), desconto_aplicado: 0 },
  { id: 102, produto_id: 2, produto_nome: "Energético Red Bull Energy Drink 250ml", numero_lote: "LT-RB-8892", quantidade_lote: 120, data_validade: criarDataRelativa(45), desconto_aplicado: 0 },
  { id: 103, produto_id: 3, produto_nome: "Cerveja Heineken garrafa 600ml", numero_lote: "LT-HEIN-3301", quantidade_lote: 35, numero_lote_sub: "L-03", data_validade: criarDataRelativa(12), desconto_aplicado: 0 },
  { id: 104, produto_id: 4, produto_nome: "Whisky Johnnie Walker Red Label 1L", numero_lote: "LT-RED-1044", quantidade_lote: 5, data_validade: criarDataRelativa(4), desconto_aplicado: 0 },
  { id: 105, produto_id: 6, produto_nome: "Gelo de Coco Especial Mairinque (Pacote 1kg)", numero_lote: "LT-GELO-092", quantidade_lote: 14, data_validade: criarDataRelativa(14), desconto_aplicado: 0 }
];

/**
 * Base de Dados para o Dashboard de Consumo Mairinque
 */
const dadosConsumoMairinque = {
  "Segunda": { demanda: "Giro Baixo (-30%)", pico: "18h00 - 21h00", topCombo: "Cerveja Heineken 600ml", rec: "Manutenção de rotina e recebimento de fornecedores." },
  "Terça": { demanda: "Giro Moderado (-15%)", pico: "18h30 - 21h30", topCombo: "Cerveja Heineken + Gelo", rec: "Conferência de lotes e datas de validade." },
  "Quarta": { demanda: "Giro Moderado (Futebol)", pico: "20h00 - 23h00", topCombo: "Combo Cervejas Geladas", rec: "Estocar cervejas de garrafa para transmissão de jogos." },
  "Quinta": { demanda: "Planejamento FDS (+25%)", pico: "19h00 - 22h00", topCombo: "Combo Gin & Red Bull", rec: "SE Quinta-feira: Fazer pedidos preventivos de bebidas quentes e gelo." },
  "Sexta": { demanda: "Pico Noturno FDS (+75%)", pico: "21h00 - 03h00", topCombo: "Combo Gin Tanqueray + 4 Red Bull", rec: "SE Sexta-feira: Repor geladeiras de atendimento rápido." },
  "Sábado": { demanda: "Pico Máximo FDS (+90%)", pico: "20h00 - 04h00", topCombo: "Combo Whisky Red Label + Red Bull", rec: "SE Sábado: Manter combos pré-montados no balcão." },
  "Domingo": { demanda: "Consumo Fim de Tarde (+50%)", pico: "15h00 - 21h00", topCombo: "Vodka Absolut + Energético 2L", rec: "SE Domingo: Foco em pacotes de gelo e destilados." }
};

// --------------------------------------------------------------------------
// 2. INICIALIZAÇÃO DA APLICAÇÃO E EVENTOS DOM
// --------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  inicializarNavegacaoAbas();
  inicializarEventosModal();
  inicializarEventosOCR();
  inicializarCalculadoraPrecificacao();
  inicializarEventosDashboard();

  // Renderização Inicial
  atualizarTabelaEstoque();
  atualizarTabelaLotes();
  atualizarResumosCabecalho();
  carregarSelectProdutos();
  atualizarDashboardMairinque("Quinta");
});

// --------------------------------------------------------------------------
// 3. REGRA DE NAVEGAÇÃO DE ABAS
// --------------------------------------------------------------------------
function inicializarNavegacaoAbas() {
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTabId = button.getAttribute('data-tab');

      // Remover classe active de todos os botões e painéis
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));

      // Adicionar classe active ao botão e painel selecionado
      button.classList.add('active');
      document.getElementById(targetTabId).classList.add('active');
    });
  });
}

// --------------------------------------------------------------------------
// 4. MÓDULO 1: ESTOQUE E REPOSIÇÃO (REGRAS SE...ENTÃO DE ESTOQUE)
// --------------------------------------------------------------------------

/**
 * Atualiza a Tabela de Estoque e executa a Regra SE...ENTÃO:
 * SE quantidade_atual <= nivel_minimo, ENTÃO exibe alerta de reposição e sugere compra FDS.
 */
function atualizarTabelaEstoque() {
  const tbody = document.getElementById('tbody-stock');
  const searchInput = document.getElementById('search-stock').value.toLowerCase();
  tbody.innerHTML = '';

  produtosEstoque.forEach(prod => {
    if (searchInput && !prod.nome.toLowerCase().includes(searchInput)) return;

    // Regra SE...ENTÃO de Estoque Baixo
    const precisaReposicao = prod.quantidade_atual <= prod.nivel_minimo;
    const sugestaoCompraFds = precisaReposicao ? (prod.nivel_minimo * 2) - prod.quantidade_atual : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${prod.nome}</strong></td>
      <td><span style="font-size: 1.05rem; font-weight: 700;">${prod.quantidade_atual}</span> un.</td>
      <td>${prod.nivel_minimo} un.</td>
      <td>R$ ${prod.custo_aquisicao.toFixed(2)}</td>
      <td>
        ${precisaReposicao 
          ? `<span class="badge badge-amber">⚠️ Reposição Necessária</span>` 
          : `<span class="badge badge-emerald">✓ Regular</span>`}
      </td>
      <td>
        ${precisaReposicao 
          ? `<strong class="text-amber">+${sugestaoCompraFds} unidades</strong>` 
          : `<span class="text-muted">Estoque Suficiente</span>`}
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="ajustarEstoque(${prod.id}, 10)" title="+10 un.">+10</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('search-stock').addEventListener('input', atualizarTabelaEstoque);
}

function ajustarEstoque(id, delta) {
  const item = produtosEstoque.find(p => p.id === id);
  if (item) {
    item.quantidade_atual += delta;
    atualizarTabelaEstoque();
    atualizarResumosCabecalho();
    exibirToast(`Estoque de "${item.nome}" atualizado!`, "emerald");
  }
}

// --------------------------------------------------------------------------
// 5. SIMULAÇÃO DE ENTRADA POR LEITURA OCR DA NOTA FISCAL
// --------------------------------------------------------------------------
function inicializarEventosOCR() {
  const btnTrigger = document.getElementById('btn-trigger-ocr');
  const statusBox = document.getElementById('ocr-status-box');
  const statusText = document.getElementById('ocr-status-text');

  btnTrigger.addEventListener('click', () => {
    statusBox.style.display = 'flex';
    statusText.innerHTML = '🔍 Conectando ao motor OCR... Analisando foto da Nota Fiscal do Fornecedor Drinks.By...';

    setTimeout(() => {
      statusText.innerHTML = '📄 Lendo itens: Extraindo produtos, quantidades de caixa e custos de aquisição...';
    }, 1200);

    setTimeout(() => {
      // Simulação de itens lidos na Nota Fiscal
      const itensLidosOCR = [
        { nome: "Cerveja Heineken garrafa 600ml", qtdAdicionada: 60, custo: 7.20 },
        { nome: "Gin Tanqueray London Dry 750ml", qtdAdicionada: 12, custo: 92.00 },
        { nome: "Vodka Smirnoff 998ml (Novo Item NF)", qtdAdicionada: 24, custo: 38.50 }
      ];

      // Processar cada item no estoque
      itensLidosOCR.forEach(itemNF => {
        let existente = produtosEstoque.find(p => p.nome.toLowerCase() === itemNF.nome.toLowerCase());
        if (existente) {
          existente.quantidade_atual += itemNF.qtdAdicionada;
          existente.custo_aquisicao = itemNF.custo;
        } else {
          produtosEstoque.push({
            id: Date.now() + Math.random(),
            nome: itemNF.nome,
            quantidade_atual: itemNF.qtdAdicionada,
            nivel_minimo: 20,
            custo_aquisicao: itemNF.custo
          });
        }
      });

      statusBox.style.display = 'none';
      atualizarTabelaEstoque();
      atualizarResumosCabecalho();
      carregarSelectProdutos();
      exibirToast("✅ Nota Fiscal lida com sucesso via OCR! +96 itens adicionados ao estoque.", "emerald");
    }, 2800);
  });
}

// --------------------------------------------------------------------------
// 6. MÓDULO 2: GESTÃO DE LOTES, VALIDADES E REGRAS SE...ENTÃO DE VENCIMENTO
// --------------------------------------------------------------------------

/**
 * Calcula a diferença em dias entre a data atual e a data de validade
 */
function calcularDiasParaVencer(dataValidadeStr) {
  const dataVal = new Date(dataValidadeStr + 'T00:00:00');
  const dataAtual = new Date();
  dataAtual.setHours(0, 0, 0, 0);

  const diffTempo = dataVal - dataAtual;
  const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
  return diffDias;
}

/**
 * Atualiza a Tabela de Lotes e executa a Regra SE...ENTÃO:
 * SE dias_para_vencer <= 15 -> Alerta de Atenção (Amber)
 * SE dias_para_vencer <= 7  -> Alerta Crítico (Danger) + Sugere Desconto Promocional (Queima de Estoque)
 */
function atualizarTabelaLotes() {
  const tbody = document.getElementById('tbody-lots');
  const filterStatus = document.getElementById('filter-lot-status').value;
  tbody.innerHTML = '';

  let countNormal = 0;
  let countWarning = 0;
  let countCritical = 0;

  lotesProdutos.forEach(lote => {
    const dias = calcularDiasParaVencer(lote.data_validade);
    let statusAlerta = "normal";
    let descontoSugerido = 0;
    let badgeHTML = "";

    // Aplicação estrita das regras condicionais de validade
    if (dias <= 7) {
      statusAlerta = "critico";
      descontoSugerido = 35; // 35% de desconto para queima rápida de estoque
      countCritical++;
      badgeHTML = `<span class="badge badge-danger">🚨 CRÍTICO (${dias}d)</span>`;
    } else if (dias <= 15) {
      statusAlerta = "atencao";
      descontoSugerido = 15; // 15% de desconto preventivo
      countWarning++;
      badgeHTML = `<span class="badge badge-amber">⚠️ ATENÇÃO (${dias}d)</span>`;
    } else {
      statusAlerta = "normal";
      countNormal++;
      badgeHTML = `<span class="badge badge-emerald">✓ Normal (${dias}d)</span>`;
    }

    // Aplicar filtro de exibição
    if (filterStatus === "critico" && statusAlerta !== "critico") return;
    if (filterStatus === "atencao" && statusAlerta !== "atencao") return;
    if (filterStatus === "normal" && statusAlerta !== "normal") return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${lote.numero_lote}</code></td>
      <td><strong>${lote.produto_nome}</strong></td>
      <td>${lote.quantidade_lote} un.</td>
      <td>${formatarData(lote.data_validade)}</td>
      <td><strong>${dias <= 0 ? 'VENCIDO!' : dias + ' dias'}</strong></td>
      <td>${badgeHTML}</td>
      <td>
        ${descontoSugerido > 0 
          ? `<strong class="text-danger">${descontoSugerido}% de Desconto</strong> (Queima)` 
          : `<span class="text-muted">Preço Normal</span>`}
      </td>
      <td>
        ${dias <= 7 
          ? `<button class="btn btn-emerald btn-sm" onclick="aplicarQueimaEstoque(${lote.id}, ${descontoSugerido})">Aplicar Queima</button>` 
          : dias <= 15 
          ? `<button class="btn btn-secondary btn-sm" onclick="aplicarQueimaEstoque(${lote.id}, ${descontoSugerido})">Promoção 15%</button>`
          : `<span class="text-muted">Sem Ação</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Atualizar contadores na tela de Lotes
  document.getElementById('stat-lots-normal').textContent = countNormal;
  document.getElementById('stat-lots-warning').textContent = countWarning;
  document.getElementById('stat-lots-critical').textContent = countCritical;

  document.getElementById('filter-lot-status').addEventListener('change', atualizarTabelaLotes);
}

function aplicarQueimaEstoque(loteId, pctDesconto) {
  const lote = lotesProdutos.find(l => l.id === loteId);
  if (lote) {
    lote.desconto_aplicado = pctDesconto;
    exibirToast(`🔥 Aplicado desconto de ${pctDesconto}% no lote ${lote.numero_lote} para Queima de Estoque!`, "danger");
    atualizarTabelaLotes();
  }
}

// --------------------------------------------------------------------------
// 7. MÓDULO 3: DASHBOARD DE VENDAS E CONSUMO LOCAL DE MAIRINQUE
// --------------------------------------------------------------------------

/**
 * Atualiza o Dashboard com base na Regra SE...ENTÃO:
 * SE dia_semana for Sexta, Sábado ou Domingo, ENTÃO destaca pico de demanda Mairinque
 */
function inicializarEventosDashboard() {
  const selectDia = document.getElementById('select-day-week');
  selectDia.addEventListener('change', (e) => {
    atualizarDashboardMairinque(e.target.value);
  });
}

function atualizarDashboardMairinque(diaSemana) {
  const info = dadosConsumoMairinque[diaSemana] || dadosConsumoMairinque["Quinta"];
  const eFimDeSemana = (diaSemana === "Sexta" || diaSemana === "Sábado" || diaSemana === "Domingo");

  const banner = document.getElementById('weekend-alert-banner');
  const bannerTitle = document.getElementById('weekend-banner-title');
  const bannerDesc = document.getElementById('weekend-banner-desc');

  // Regra SE...ENTÃO do Dashboard
  if (eFimDeSemana) {
    banner.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(245, 158, 11, 0.2) 100%)';
    banner.style.borderColor = 'var(--color-danger)';
    bannerTitle.textContent = `🚀 PICO DE VENDAS ATIVO: ${diaSemana.toUpperCase()} EM MAIRINQUE!`;
    bannerDesc.textContent = `Alta demanda detectada! Produtos quentes e gelo possuem taxa de saída acelerada nesta noite.`;
  } else {
    banner.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)';
    banner.style.borderColor = 'rgba(139, 92, 246, 0.4)';
    bannerTitle.textContent = `Planejamento Operacional: ${diaSemana}`;
    bannerDesc.textContent = info.rec;
  }

  document.getElementById('demand-forecast-value').textContent = info.demanda;
  document.getElementById('demand-forecast-desc').textContent = `Estimativa com base nos dados de vendas da Unidade Mairinque.`;
  document.getElementById('top-combo-name').textContent = info.topCombo;
  document.getElementById('peak-hours-value').textContent = info.pico;

  // Atualizar Lista de Combos Destaque Mairinque
  const comboList = document.getElementById('combo-ranking-list');
  comboList.innerHTML = `
    <li class="combo-item">
      <div>
        <div class="combo-title">1º ${info.topCombo}</div>
        <div class="combo-sub">Alta rentabilidade • Destilados com Energéticos</div>
      </div>
      <span class="badge badge-emerald">Líder Mairinque</span>
    </li>
    <li class="combo-item">
      <div>
        <div class="combo-title">2º Balde de Cerveja Heineken 600ml (6 un)</div>
        <div class="combo-sub">Giro rápido de final de semana</div>
      </div>
      <span class="badge badge-purple">+45% em Vendas</span>
    </li>
    <li class="combo-item">
      <div>
        <div class="combo-title">3º Combo Red Label + 5 Red Bull + Gelo Coco</div>
        <div class="combo-sub">Ticket Médio elevado</div>
      </div>
      <span class="badge badge-amber">Margem Alta</span>
    </li>
  `;

  // Recomendações
  const recContainer = document.getElementById('recommendations-container');
  recContainer.innerHTML = `
    <div class="rec-card">
      <strong>📌 Recomendação Preventiva:</strong> ${info.rec}
    </div>
    <div class="rec-card">
      <strong>⚡ Ajuste de Estoque:</strong> Garantir no mínimo 150 sacos de gelo de coco e 20 caixas de energéticos gelados no depósito.
    </div>
  `;
}

// --------------------------------------------------------------------------
// 8. MÓDULO 4: PRECIFICAÇÃO DINÂMICA E RENTABILIDADE (REGRAS SE...ENTÃO)
// --------------------------------------------------------------------------
function inicializarCalculadoraPrecificacao() {
  const costInput = document.getElementById('calc-cost-unit');
  const taxInput = document.getElementById('calc-tax-rate');
  const fixedCostInput = document.getElementById('calc-fixed-cost');
  const marginInput = document.getElementById('calc-target-margin');
  const compInput = document.getElementById('calc-competitor-price');
  const practicedInput = document.getElementById('calc-practiced-price');

  const btnApplySuggested = document.getElementById('btn-apply-suggested-price');

  // Adicionar listeners para recálculo automático em tempo real
  [costInput, taxInput, fixedCostInput, marginInput, compInput, practicedInput].forEach(elem => {
    elem.addEventListener('input', calcularPrecificacaoDinamica);
  });

  btnApplySuggested.addEventListener('click', () => {
    const sugerido = parseFloat(document.getElementById('res-suggested-price').dataset.valorBruto || 0);
    if (sugerido > 0) {
      practicedInput.value = sugerido.toFixed(2);
      calcularPrecificacaoDinamica();
      exibirToast("💡 Preço praticado ajustado automaticamente para a meta de margem!", "emerald");
    }
  });

  calcularPrecificacaoDinamica();
}

/**
 * Executa os cálculos financeiros e valida a Regra SE...ENTÃO:
 * SE margem_real < margem_lucro_desejada, ENTÃO notifica "Margem de lucro inviável" e ajusta o preço sugerido.
 */
function calcularPrecificacaoDinamica() {
  const custoUnit = parseFloat(document.getElementById('calc-cost-unit').value) || 0;
  const aliquotaImposto = parseFloat(document.getElementById('calc-tax-rate').value) || 0; // %
  const custoFixo = parseFloat(document.getElementById('calc-fixed-cost').value) || 0;     // %
  const margemDesejada = parseFloat(document.getElementById('calc-target-margin').value) || 0; // %
  const precoConcorrencia = parseFloat(document.getElementById('calc-competitor-price').value) || 0;
  const precoPraticado = parseFloat(document.getElementById('calc-practiced-price').value) || 0;

  // Custo Efetivo Total incluindo Impostos e Operacional
  const percentualDeducoes = (aliquotaImposto + custoFixo) / 100;
  const custoEfetivoTotal = custoUnit * (1 + percentualDeducoes);

  // Fórmula do Preço de Venda Sugerido para obter a Margem Desejada Líquida sobre a Venda
  // Preço Sugerido = CustoUnit / (1 - (Imposto% + CustoFixo% + MargemDesejada%))
  const percentualTotalDesejado = (aliquotaImposto + custoFixo + margemDesejada) / 100;
  let precoSugerido = 0;

  if (percentualTotalDesejado < 1) {
    precoSugerido = custoUnit / (1 - percentualTotalDesejado);
  } else {
    precoSugerido = custoUnit * 2; // Fallback de proteção
  }

  // Margem Real Líquida no Preço de Venda Simulado/Praticado
  // Lucro Líquido = PreçoPraticado - (PreçoPraticado * (Imposto% + CustoFixo%)) - CustoUnit
  const valorDeducoesPraticado = precoPraticado * percentualDeducoes;
  const lucroLiquidoReal = precoPraticado - valorDeducoesPraticado - custoUnit;
  const margemReal = precoPraticado > 0 ? (lucroLiquidoReal / precoPraticado) * 100 : 0;

  // Atualização dos Elementos da Interface
  document.getElementById('res-total-cost').textContent = `R$ ${custoEfetivoTotal.toFixed(2)}`;
  
  const elSuggested = document.getElementById('res-suggested-price');
  elSuggested.textContent = `R$ ${precoSugerido.toFixed(2)}`;
  elSuggested.dataset.valorBruto = precoSugerido;

  document.getElementById('res-real-margin').textContent = `${margemReal.toFixed(1)}%`;
  document.getElementById('res-real-profit').textContent = `R$ ${lucroLiquidoReal.toFixed(2)}`;

  // Comparação com a concorrência de Mairinque
  const elCompDiff = document.getElementById('res-competitor-diff');
  if (precoConcorrencia > 0) {
    const diff = precoPraticado - precoConcorrencia;
    if (diff > 0) {
      elCompDiff.textContent = `R$ +${diff.toFixed(2)} (Acima da Concorrência)`;
      elCompDiff.className = "text-amber";
    } else if (diff < 0) {
      elCompDiff.textContent = `R$ ${diff.toFixed(2)} (Abaixo da Concorrência)`;
      elCompDiff.className = "text-emerald";
    } else {
      elCompDiff.textContent = `Mesmo preço da concorrência`;
      elCompDiff.className = "text-muted";
    }
  }

  // REGRA SE...ENTÃO: Validação de Margem Inviável
  const alertBox = document.getElementById('pricing-alert-box');
  const alertText = document.getElementById('pricing-alert-text');
  const elRealMargin = document.getElementById('res-real-margin');

  if (margemReal < margemDesejada) {
    alertBox.style.display = 'flex';
    alertText.textContent = `A margem real (${margemReal.toFixed(1)}%) é INFERIOR à meta (${margemDesejada.toFixed(1)}%). Notificação: Margem de lucro inviável!`;
    elRealMargin.className = "p-value text-danger";
  } else {
    alertBox.style.display = 'none';
    elRealMargin.className = "p-value text-emerald";
  }
}

// --------------------------------------------------------------------------
// 9. EVENTOS DE MODAIS DE CADASTRO E UTILITÁRIOS
// --------------------------------------------------------------------------
function inicializarEventosModal() {
  // Modal de Produtos
  const modalProd = document.getElementById('modal-product');
  document.getElementById('btn-open-add-product').addEventListener('click', () => modalProd.style.display = 'flex');
  document.getElementById('btn-close-modal-product').addEventListener('click', () => modalProd.style.display = 'none');
  document.getElementById('btn-cancel-product').addEventListener('click', () => modalProd.style.display = 'none');

  document.getElementById('form-add-product').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('prod-name').value;
    const qty = parseInt(document.getElementById('prod-qty').value);
    const min = parseInt(document.getElementById('prod-min').value);
    const cost = parseFloat(document.getElementById('prod-cost').value);

    produtosEstoque.push({
      id: Date.now(),
      nome,
      quantidade_atual: qty,
      nivel_minimo: min,
      custo_aquisicao: cost
    });

    modalProd.style.display = 'none';
    e.target.reset();
    atualizarTabelaEstoque();
    atualizarResumosCabecalho();
    carregarSelectProdutos();
    exibirToast(`Produto "${nome}" cadastrado com sucesso!`, "emerald");
  });

  // Modal de Lotes
  const modalLot = document.getElementById('modal-lot');
  document.getElementById('btn-open-add-lot').addEventListener('click', () => modalLot.style.display = 'flex');
  document.getElementById('btn-close-modal-lot').addEventListener('click', () => modalLot.style.display = 'none');
  document.getElementById('btn-cancel-lot').addEventListener('click', () => modalLot.style.display = 'none');

  document.getElementById('form-add-lot').addEventListener('submit', (e) => {
    e.preventDefault();
    const prodId = parseInt(document.getElementById('lot-product-select').value);
    const numLote = document.getElementById('lot-number').value;
    const qtyLote = parseInt(document.getElementById('lot-qty').value);
    const dataVal = document.getElementById('lot-expiry-date').value;

    const prod = produtosEstoque.find(p => p.id === prodId);

    lotesProdutos.push({
      id: Date.now(),
      produto_id: prodId,
      produto_nome: prod ? prod.nome : "Produto",
      numero_lote: numLote,
      quantidade_lote: qtyLote,
      data_validade: dataVal,
      desconto_aplicado: 0
    });

    modalLot.style.display = 'none';
    e.target.reset();
    atualizarTabelaLotes();
    atualizarResumosCabecalho();
    exibirToast(`Lote ${numLote} registrado com sucesso!`, "emerald");
  });
}

function carregarSelectProdutos() {
  const selectCalc = document.getElementById('calc-product-select');
  const selectLot = document.getElementById('lot-product-select');

  selectCalc.innerHTML = '<option value="">-- Selecionar do Estoque --</option>';
  selectLot.innerHTML = '';

  produtosEstoque.forEach(p => {
    const optCalc = document.createElement('option');
    optCalc.value = p.id;
    optCalc.textContent = `${p.nome} (Custo: R$ ${p.custo_aquisicao.toFixed(2)})`;
    selectCalc.appendChild(optCalc);

    const optLot = document.createElement('option');
    optLot.value = p.id;
    optLot.textContent = p.nome;
    selectLot.appendChild(optLot);
  });

  selectCalc.addEventListener('change', (e) => {
    const idSelected = parseInt(e.target.value);
    const p = produtosEstoque.find(item => item.id === idSelected);
    if (p) {
      document.getElementById('calc-cost-unit').value = p.custo_aquisicao.toFixed(2);
      calcularPrecificacaoDinamica();
    }
  });
}

/**
 * Atualiza o resumo financeiro e contadores no cabeçalho superior
 */
function atualizarResumosCabecalho() {
  // Total do valor em estoque
  const valorTotal = produtosEstoque.reduce((acc, item) => acc + (item.quantidade_atual * item.custo_aquisicao), 0);
  document.getElementById('hdr-total-stock-value').textContent = `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  // Contadores de lotes
  let countWarning = 0;
  let countCritical = 0;

  lotesProdutos.forEach(lote => {
    const dias = calcularDiasParaVencer(lote.data_validade);
    if (dias <= 7) countCritical++;
    else if (dias <= 15) countWarning++;
  });

  document.getElementById('hdr-warning-count').textContent = `${countWarning} itens`;
  document.getElementById('hdr-critical-count').textContent = `${countCritical} itens`;
}

// --------------------------------------------------------------------------
// FUNÇÕES UTILITÁRIAS
// --------------------------------------------------------------------------
function formatarData(dataISO) {
  if (!dataISO) return '-';
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function exibirToast(mensagem, tipo = "emerald") {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    <span>${mensagem}</span>
    <button onclick="this.parentElement.remove()" style="background:none; border:none; color:white; cursor:pointer; font-weight:bold; margin-left:10px;">&times;</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}
// Exportar para Excel
function exportarEstoqueExcel() {
  const dados = produtosEstoque.map(p => ({
    "Produto": p.nome,
    "Quantidade": p.quantidade_atual,
    "Mínimo": p.nivel_minimo,
    "Custo (R$)": p.custo_aquisicao
  }));
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estoque");
  XLSX.writeFile(wb, `Estoque_FragaBy_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// Exportar para PDF
function exportarEstoquePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("FragaBy Gestão - Relatório de Estoque", 14, 20);
  
  const linhas = produtosEstoque.map(p => [p.nome, p.quantidade_atual, p.nivel_minimo, `R$ ${p.custo_aquisicao}`]);
  doc.autoTable({
    startY: 30,
    head: [["Produto", "Qtd", "Mínimo", "Custo"]],
    body: linhas
  });
  doc.save(`Estoque_FragaBy_${new Date().toISOString().slice(0,10)}.pdf`);
}
