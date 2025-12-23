// Dados das transações
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let currentFilter = "todas";

// Categorias por tipo
const categories = {
  receita: [
    "Salário",
    "Freelance",
    "Investimentos",
    "Venda",
    "Aluguel Recebido",
    "Outros",
  ],
  despesa: [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Saúde",
    "Educação",
    "Diversão",
    "Compras",
    "Contas",
    "Outros",
  ],
};

// Inicializar app
document.addEventListener("DOMContentLoaded", () => {
  setTodayDate();
  updateCategoryOptions();
  setupEventListeners();
  renderTransactions();
  updateBalance();
});

// Definir data de hoje como padrão
function setTodayDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("data").value = today;
}

// Atualizar opções de categoria
function updateCategoryOptions() {
  const tipo = document.getElementById("tipo").value;
  const categoriaSelect = document.getElementById("categoria");
  categoriaSelect.innerHTML = '<option value="">Selecione...</option>';
  categories[tipo].forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoriaSelect.appendChild(option);
  });
}

// Configurar event listeners
function setupEventListeners() {
  document
    .getElementById("transactionForm")
    .addEventListener("submit", addTransaction);
  document
    .getElementById("tipo")
    .addEventListener("change", updateCategoryOptions);

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.dataset.filter;
      renderTransactions();
    });
  });

  const exportBtnEl = document.getElementById("exportBtn");
  if (exportBtnEl) exportBtnEl.addEventListener("click", exportData);
  const exportPdfBtnEl = document.getElementById("exportPdfBtn");
  if (exportPdfBtnEl) exportPdfBtnEl.addEventListener("click", exportPDF);
  const clearBtnEl = document.getElementById("clearBtn");
  if (clearBtnEl) clearBtnEl.addEventListener("click", clearAllData);
}

// Adicionar transação
function addTransaction(e) {
  e.preventDefault();

  const descricao = document.getElementById("descricao").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const tipo = document.getElementById("tipo").value;
  const categoria = document.getElementById("categoria").value;
  const data = document.getElementById("data").value;

  if (!descricao || !valor || !categoria || !data) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  const transaction = {
    id: Date.now(),
    descricao,
    valor,
    tipo,
    categoria,
    data,
  };

  transactions.push(transaction);
  saveTransactions();

  // Limpar formulário
  document.getElementById("transactionForm").reset();
  setTodayDate();

  renderTransactions();
  updateBalance();
}

// Deletar transação
function deleteTransaction(id) {
  if (confirm("Tem certeza que deseja deletar esta transação?")) {
    transactions = transactions.filter((t) => t.id !== id);
    saveTransactions();
    renderTransactions();
    updateBalance();
  }
}

// Renderizar transações
function renderTransactions() {
  const listContainer = document.getElementById("transactionsList");

  let filtered = transactions;
  if (currentFilter !== "todas") {
    filtered = transactions.filter((t) => t.tipo === currentFilter);
  }

  // Ordenar por data decrescente
  filtered.sort((a, b) => new Date(b.data) - new Date(a.data));

  if (filtered.length === 0) {
    listContainer.innerHTML =
      '<p class="empty-message">Nenhuma transação registrada.</p>';
    return;
  }

  listContainer.innerHTML = filtered
    .map(
      (transaction) => `
        <div class="transaction-item ${transaction.tipo}">
            <div class="transaction-info">
                <div class="transaction-descricao">${transaction.descricao}</div>
                <div class="transaction-meta">
                    ${transaction.categoria} • ${new Date(
        transaction.data
      ).toLocaleDateString("pt-BR")}
                </div>
            </div>
            <div class="transaction-value ${transaction.tipo}">
                ${
                  transaction.tipo === "receita" ? "+" : "-"
                } R$ ${transaction.valor.toFixed(2)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})" title="Deletar">🗑️</button>
        </div>
    `
    )
    .join("");
}

// Atualizar saldo
function updateBalance() {
  const totalReceita = transactions
    .filter((t) => t.tipo === "receita")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesa = transactions
    .filter((t) => t.tipo === "despesa")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalReceita - totalDespesa;

  document.getElementById(
    "totalReceita"
  ).textContent = `R$ ${totalReceita.toFixed(2)}`;
  document.getElementById(
    "totalDespesa"
  ).textContent = `R$ ${totalDespesa.toFixed(2)}`;
  document.getElementById("saldo").textContent = `R$ ${saldo.toFixed(2)}`;

  // Mudar cor do saldo
  const saldoElement = document.getElementById("saldo");
  const saldoCard = saldoElement.parentElement;
  if (saldo < 0) {
    saldoCard.classList.add("despesa");
    saldoCard.classList.remove("receita", "balance");
  } else if (saldo > 0) {
    saldoCard.classList.add("receita");
    saldoCard.classList.remove("despesa", "balance");
  } else {
    saldoCard.classList.remove("receita", "despesa");
    saldoCard.classList.add("balance");
  }
}

// Salvar no localStorage
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Exportar dados
function exportData() {
  if (transactions.length === 0) {
    alert("Nenhuma transação para exportar!");
    return;
  }

  let csv = "Data,Descrição,Categoria,Tipo,Valor\n";

  transactions.forEach((t) => {
    csv += `${t.data},${t.descricao},${t.categoria},${t.tipo},R$ ${t.valor.toFixed(2)}\n`;
  });

  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  link.download = `financas_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

// Limpar todos os dados
function clearAllData() {
  if (
    confirm(
      "⚠️ Tem certeza que deseja deletar TODAS as transações? Esta ação não pode ser desfeita!"
    )
  ) {
    if (confirm("Última confirmação: deseja realmente deletar tudo?")) {
      transactions = [];
      saveTransactions();
      renderTransactions();
      updateBalance();
      alert("✓ Todos os dados foram removidos.");
    }
  }
}

// Exportar página atual (conteúdo da `.container`) para PDF
function exportPDF() {
  if (transactions.length === 0) {
    if (!confirm('Não há transações. Deseja gerar um PDF vazio do relatório?')) return;
  }

  // Clona o container para remover elementos interativos
  const container = document.querySelector('.container');
  const clone = container.cloneNode(true);

  // Remover botões do clone para impressão limpa
  clone.querySelectorAll('button').forEach(btn => btn.remove());

  // Inserir temporariamente na página de modo invisível, mas visível para layout
  // (html2canvas precisa que o elemento tenha tamanho computado)
  clone.style.position = 'fixed';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.width = container.offsetWidth + 'px';
  clone.style.visibility = 'hidden';
  clone.style.zIndex = '9999';
  document.body.appendChild(clone);

  const opt = {
    margin:       10,
    filename:     `financas_${new Date().toISOString().split('T')[0]}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

    // Tenta abrir o PDF em nova aba (melhor experiência); se popup for bloqueado, mostra fallback visível
    html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf) => {
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');
      if (newWin) {
        // abriu em nova aba — remove clone após curto delay
        setTimeout(() => document.body.removeChild(clone), 1000);
      } else {
        // popup bloqueado — mostrar fallback com link e botão de download
        document.body.removeChild(clone);
        showPdfFallback(url);
      }
    }).catch(() => {
      // fallback direto para save
      html2pdf().set(opt).from(clone).save().then(() => {
        document.body.removeChild(clone);
      }).catch(() => {
        document.body.removeChild(clone);
        alert('Erro ao gerar o PDF. Tente novamente.');
      });
    });
  }

  // Mostra overlay com link para abrir/baixar o PDF quando popup é bloqueado
  function showPdfFallback(url) {
    // criar overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = 0;
    overlay.style.top = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 10000;

    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.padding = '20px';
    box.style.borderRadius = '8px';
    box.style.maxWidth = '90%';
    box.style.textAlign = 'center';

    const title = document.createElement('div');
    title.textContent = 'Popup bloqueado — abra ou baixe o PDF manualmente';
    title.style.marginBottom = '12px';
    title.style.fontWeight = '700';

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Abrir PDF em nova aba';
    link.style.display = 'inline-block';
    link.style.margin = '8px 0';
    link.style.color = '#067df7';

    const dl = document.createElement('a');
    dl.href = url;
    dl.download = '';
    dl.textContent = 'Baixar PDF';
    dl.style.display = 'inline-block';
    dl.style.margin = '8px 12px';
    dl.style.color = '#067df7';

    const close = document.createElement('button');
    close.textContent = 'Fechar';
    close.style.display = 'block';
    close.style.margin = '14px auto 0 auto';
    close.style.padding = '8px 14px';
    close.style.borderRadius = '6px';
    close.style.border = 'none';
    close.style.background = '#667eea';
    close.style.color = 'white';
    close.style.cursor = 'pointer';

    close.addEventListener('click', () => {
      try { URL.revokeObjectURL(url); } catch(e){}
      document.body.removeChild(overlay);
    });

    box.appendChild(title);
    box.appendChild(link);
    box.appendChild(dl);
    box.appendChild(close);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }
}
