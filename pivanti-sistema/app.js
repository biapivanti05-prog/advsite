/* ===========================================================
   PIVANTI ADVOCACIA · Sistema de Gestão Jurídica
   =========================================================== */

// === Storage ===
const KEYS = {
  clients: 'pivanti_clients',
  processes: 'pivanti_processes',
  documents: 'pivanti_documents',
  tasks: 'pivanti_tasks',
  deadlines: 'pivanti_deadlines',
  financeiro: 'pivanti_financeiro'
};

function load(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } }
function persist(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }

// === State ===
const state = {
  route: 'dashboard',
  selectedClientId: null,
  selectedProcessId: null,
  detailTab: 'info',
  search: '',
  filter: {},
  docClientId: null,
  docFolder: null,
  calendar: { month: new Date().getMonth(), year: new Date().getFullYear() }
};

// === Catálogos ===
const PROCESS_TYPES = ['Cível', 'Trabalhista', 'Tributário', 'Família e Sucessões', 'Penal', 'Administrativo', 'Empresarial', 'Consumidor', 'Previdenciário', 'Outros'];
const PROCESS_STATUSES = ['Em andamento', 'Suspenso', 'Sentenciado', 'Em recurso', 'Acordo', 'Trânsito em julgado', 'Arquivado'];
const POLO_TYPES = ['Autor / Requerente', 'Réu / Requerido', 'Terceiro interessado'];
const DOC_TYPES = ['Proposta', 'Contrato', 'Procuração', 'Peças processuais', 'Decisões judiciais', 'Documentos pessoais', 'Comprovantes', 'Pareceres', 'Outros'];

// Mapeia tipos antigos para as pastas atuais (mantém compatibilidade com docs já cadastrados)
function folderFor(type) {
  if (!type) return 'Outros';
  const t = String(type).toLowerCase();
  if (t.includes('proposta')) return 'Proposta';
  if (t.includes('contrato')) return 'Contrato';
  if (t.includes('procuração') || t.includes('procuracao')) return 'Procuração';
  if (t.includes('petição') || t.includes('peticao') || t.includes('contestação') || t.includes('contestacao') || t.includes('réplica') || t.includes('replica') || t.includes('recurso') || t.includes('peças') || t.includes('pecas')) return 'Peças processuais';
  if (t.includes('sentença') || t.includes('sentenca') || t.includes('acórdão') || t.includes('acordao') || t.includes('decisão') || t.includes('decisoes') || t.includes('decisões')) return 'Decisões judiciais';
  if (t.includes('pessoa')) return 'Documentos pessoais';
  if (t.includes('comprovante')) return 'Comprovantes';
  if (t.includes('parecer')) return 'Pareceres';
  if (DOC_TYPES.includes(type)) return type;
  return 'Outros';
}
const TASK_PRIORITIES = [
  { v: 'alta', l: 'Alta' },
  { v: 'media', l: 'Média' },
  { v: 'baixa', l: 'Baixa' }
];
const DEADLINE_TYPES = [
  { v: 'processual', l: 'Prazo processual' },
  { v: 'interno', l: 'Prazo interno' }
];

const MONTHS_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const DAYNAMES_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// === Utils ===
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('pt-BR');
}

function formatDateLong(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

function formatBRL(value) {
  const n = Number(value);
  if (!n || isNaN(n)) return 'R$ 0,00';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCPF(v) {
  if (!v) return '';
  const d = v.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return v;
}

function formatProcessNumber(v) {
  if (!v) return '';
  const d = v.replace(/\D/g, '');
  if (d.length === 20) return d.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6');
  return v;
}

function fileIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('proposta')) return '◰';
  if (t.includes('petição') || t.includes('contestação') || t.includes('réplica') || t.includes('recurso') || t.includes('peças') || t.includes('pecas')) return '§';
  if (t.includes('sentença') || t.includes('acórdão') || t.includes('decisão') || t.includes('decisões') || t.includes('decisoes')) return '⚖';
  if (t.includes('procuração') || t.includes('contrato')) return '✎';
  if (t.includes('pessoa') || t.includes('comprovante')) return '◳';
  if (t.includes('parecer')) return '✦';
  return '▤';
}

function toast(msg, type) {
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// === Data access ===
const Clients = {
  all: () => load(KEYS.clients),
  find: id => Clients.all().find(c => c.id === id),
  save(item) {
    const list = Clients.all();
    if (item.id) {
      const i = list.findIndex(c => c.id === item.id);
      if (i >= 0) list[i] = { ...list[i], ...item, updatedAt: new Date().toISOString() };
    } else {
      item.id = uid();
      item.createdAt = new Date().toISOString();
      list.push(item);
    }
    persist(KEYS.clients, list);
    return item;
  },
  delete(id) {
    persist(KEYS.clients, Clients.all().filter(c => c.id !== id));
    persist(KEYS.processes, Processes.all().filter(p => p.clientId !== id));
    persist(KEYS.documents, Documents.all().filter(d => d.clientId !== id));
    persist(KEYS.tasks, Tasks.all().filter(t => t.clientId !== id));
    persist(KEYS.deadlines, Deadlines.all().filter(d => d.clientId !== id));
  }
};

const Processes = {
  all: () => load(KEYS.processes),
  find: id => Processes.all().find(p => p.id === id),
  forClient: cid => Processes.all().filter(p => p.clientId === cid),
  save(item) {
    const list = Processes.all();
    if (item.id) {
      const i = list.findIndex(p => p.id === item.id);
      if (i >= 0) list[i] = { ...list[i], ...item, updatedAt: new Date().toISOString() };
    } else {
      item.id = uid();
      item.createdAt = new Date().toISOString();
      list.push(item);
    }
    persist(KEYS.processes, list);
    return item;
  },
  delete(id) {
    persist(KEYS.processes, Processes.all().filter(p => p.id !== id));
    persist(KEYS.documents, Documents.all().filter(d => d.processId !== id));
    persist(KEYS.tasks, Tasks.all().filter(t => t.processId !== id));
    persist(KEYS.deadlines, Deadlines.all().filter(d => d.processId !== id));
  }
};

/* --- IndexedDB para arquivos de documentos --- */
const DocDB = (() => {
  let _db = null;
  function open() {
    return new Promise((res, rej) => {
      if (_db) return res(_db);
      const req = indexedDB.open('pivanti_docs', 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore('files', { keyPath: 'id' });
      req.onsuccess = e => { _db = e.target.result; res(_db); };
      req.onerror = e => rej(e.target.error);
    });
  }
  return {
    async saveFile(id, dataUrl) {
      const db = await open();
      return new Promise((res, rej) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put({ id, dataUrl });
        tx.oncomplete = () => res();
        tx.onerror = e => rej(e.target.error);
      });
    },
    async getFile(id) {
      const db = await open();
      return new Promise((res, rej) => {
        const req = db.transaction('files').objectStore('files').get(id);
        req.onsuccess = e => res(e.target.result ? e.target.result.dataUrl : null);
        req.onerror = e => rej(e.target.error);
      });
    },
    async deleteFile(id) {
      const db = await open();
      return new Promise((res, rej) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').delete(id);
        tx.oncomplete = () => res();
        tx.onerror = e => rej(e.target.error);
      });
    },
    async exportAll() {
      const db = await open();
      return new Promise((res, rej) => {
        const req = db.transaction('files').objectStore('files').getAll();
        req.onsuccess = e => res(e.target.result);
        req.onerror = e => rej(e.target.error);
      });
    },
    async importAll(files) {
      const db = await open();
      return new Promise((res, rej) => {
        const tx = db.transaction('files', 'readwrite');
        const store = tx.objectStore('files');
        files.forEach(f => store.put(f));
        tx.oncomplete = () => res();
        tx.onerror = e => rej(e.target.error);
      });
    }
  };
})();

const Documents = {
  all: () => load(KEYS.documents),
  find: id => Documents.all().find(d => d.id === id),
  forClient: cid => Documents.all().filter(d => d.clientId === cid),
  forProcess: pid => Documents.all().filter(d => d.processId === pid),
  save(item) {
    const list = Documents.all();
    // Nunca salvar o campo 'data' no localStorage — fica só no IndexedDB
    const { data, ...meta } = item;
    if (meta.id) {
      const i = list.findIndex(d => d.id === meta.id);
      if (i >= 0) list[i] = { ...list[i], ...meta };
    } else {
      meta.id = uid();
      meta.uploadedAt = new Date().toISOString();
      list.push(meta);
    }
    persist(KEYS.documents, list);
    return meta;
  },
  async saveWithFile(item, dataUrl) {
    const saved = Documents.save(item);
    if (dataUrl) await DocDB.saveFile(saved.id, dataUrl);
    return saved;
  },
  async delete(id) {
    persist(KEYS.documents, Documents.all().filter(d => d.id !== id));
    await DocDB.deleteFile(id);
  }
};

const Tasks = {
  all: () => load(KEYS.tasks),
  find: id => Tasks.all().find(t => t.id === id),
  forClient: cid => Tasks.all().filter(t => t.clientId === cid),
  forProcess: pid => Tasks.all().filter(t => t.processId === pid),
  save(item) {
    const list = Tasks.all();
    if (item.id) {
      const i = list.findIndex(t => t.id === item.id);
      if (i >= 0) list[i] = { ...list[i], ...item };
    } else {
      item.id = uid();
      item.createdAt = new Date().toISOString();
      item.completed = item.completed || false;
      list.push(item);
    }
    persist(KEYS.tasks, list);
    return item;
  },
  toggle(id) {
    const list = Tasks.all();
    const t = list.find(x => x.id === id);
    if (t) { t.completed = !t.completed; persist(KEYS.tasks, list); }
  },
  delete(id) { persist(KEYS.tasks, Tasks.all().filter(t => t.id !== id)); }
};

const Deadlines = {
  all: () => load(KEYS.deadlines),
  find: id => Deadlines.all().find(d => d.id === id),
  forClient: cid => Deadlines.all().filter(d => d.clientId === cid),
  forProcess: pid => Deadlines.all().filter(d => d.processId === pid),
  save(item) {
    const list = Deadlines.all();
    if (item.id) {
      const i = list.findIndex(d => d.id === item.id);
      if (i >= 0) list[i] = { ...list[i], ...item };
    } else {
      item.id = uid();
      item.createdAt = new Date().toISOString();
      item.completed = item.completed || false;
      list.push(item);
    }
    persist(KEYS.deadlines, list);
    return item;
  },
  toggle(id) {
    const list = Deadlines.all();
    const d = list.find(x => x.id === id);
    if (d) { d.completed = !d.completed; persist(KEYS.deadlines, list); }
  },
  delete(id) { persist(KEYS.deadlines, Deadlines.all().filter(d => d.id !== id)); }
};

// === Router ===
function navigate(route, opts = {}) {
  state.route = route;
  state.selectedClientId = opts.clientId || null;
  state.selectedProcessId = opts.processId || null;
  state.detailTab = opts.tab || 'info';
  state.search = '';
  state.docClientId = opts.docClientId || null;
  state.docFolder = opts.docFolder || null;
  document.getElementById('globalSearch').value = '';
  render();
}

// === Modal ===
function openModal(title, bodyHtml, onMount) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalOverlay').classList.add('open');
  if (onMount) onMount();
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

// === Confirm ===
function confirmAction(msg, onYes) {
  if (confirm(msg)) onYes();
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.route === state.route);
  });
  const content = document.getElementById('content');
  const title = document.getElementById('pageTitle');
  const btnNew = document.getElementById('btnNew');
  btnNew.style.display = state.route === 'dashboard' || state.route === 'calendario' ? 'none' : 'inline-flex';
  btnNew.textContent = {
    clientes: '+ Novo cliente',
    processos: '+ Novo processo',
    documentos: '+ Novo documento',
    tarefas: '+ Nova tarefa',
    prazos: '+ Novo prazo',
    financeiro: '+ Novo honorário'
  }[state.route] || '+ Novo';

  switch (state.route) {
    case 'dashboard': title.textContent = 'Painel'; renderDashboard(content); break;
    case 'clientes':
      title.textContent = state.selectedClientId ? 'Detalhes do cliente' : 'Clientes';
      state.selectedClientId ? renderClientDetail(content) : renderClients(content);
      break;
    case 'processos':
      title.textContent = state.selectedProcessId ? 'Detalhes do processo' : 'Processos';
      state.selectedProcessId ? renderProcessDetail(content) : renderProcesses(content);
      break;
    case 'documentos': title.textContent = 'Documentos'; renderDocuments(content); break;
    case 'tarefas': title.textContent = 'Tarefas'; renderTasks(content); break;
    case 'prazos': title.textContent = 'Prazos'; renderDeadlines(content); break;
    case 'calendario': title.textContent = 'Calendário'; renderCalendar(content); break;
    case 'financeiro': title.textContent = 'Financeiro'; renderFinanceiro(content); break;
  }
}

/* ===== DASHBOARD ===== */
function renderDashboard(el) {
  const clients = Clients.all();
  const processes = Processes.all();
  const activeProcesses = processes.filter(p => p.status === 'Em andamento' || !p.status);
  const tasks = Tasks.all();
  const pendingTasks = tasks.filter(t => !t.completed);
  const deadlines = Deadlines.all().filter(d => !d.completed);

  // Financeiro: parcelas atrasadas
  const finAtrasados = Financeiro.all().filter(f => {
    if (f.tipo === 'parcelado') return f.parcelas.some(p => !p.pago && daysUntil(p.vencimento) < 0);
    return !f.pago && f.vencimento && daysUntil(f.vencimento) < 0;
  });
  const upcoming = deadlines.filter(d => {
    const days = daysUntil(d.date);
    return days !== null && days >= 0 && days <= 7;
  }).sort((a, b) => a.date.localeCompare(b.date));
  const overdue = deadlines.filter(d => daysUntil(d.date) < 0);

  const recentProcesses = [...processes].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);

  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Clientes</div>
        <div class="stat-value">${clients.length}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">Processos ativos</div>
        <div class="stat-value">${activeProcesses.length}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">Prazos em 7 dias</div>
        <div class="stat-value">${upcoming.length}</div>
      </div>
      <div class="stat-card ${overdue.length ? 'danger' : 'gold'}">
        <div class="stat-label">${overdue.length ? 'Prazos vencidos' : 'Tarefas pendentes'}</div>
        <div class="stat-value">${overdue.length || pendingTasks.length}</div>
      </div>
      <div class="stat-card ${finAtrasados.length ? 'danger' : 'gold'}" style="cursor:pointer;" data-go="financeiro">
        <div class="stat-label">Hon. em atraso</div>
        <div class="stat-value">${finAtrasados.length}</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Próximos prazos</div>
          <a class="panel-link" data-go="prazos">Ver todos →</a>
        </div>
        ${upcoming.length === 0 ? `
          <div style="padding:20px 0;color:var(--text-light);font-size:13px;text-align:center;">Nenhum prazo nos próximos 7 dias.</div>
        ` : upcoming.slice(0, 6).map(d => {
          const days = daysUntil(d.date);
          const proc = d.processId ? Processes.find(d.processId) : null;
          const cli = d.clientId ? Clients.find(d.clientId) : null;
          const urg = days <= 1 ? 'danger' : days <= 3 ? 'warning' : 'info';
          return `
            <div class="list-item" data-deadline="${d.id}">
              <div class="list-item-main">
                <div class="list-item-title">${escapeHtml(d.title)}</div>
                <div class="list-item-subtitle">${formatDateLong(d.date)} ${cli ? '· ' + escapeHtml(cli.name) : ''} ${proc ? '· proc. ' + escapeHtml(proc.number || '') : ''}</div>
              </div>
              <span class="badge badge-${urg}">${days === 0 ? 'hoje' : days === 1 ? 'amanhã' : 'em ' + days + ' dias'}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Tarefas pendentes</div>
          <a class="panel-link" data-go="tarefas">Ver todas →</a>
        </div>
        ${pendingTasks.length === 0 ? `
          <div style="padding:20px 0;color:var(--text-light);font-size:13px;text-align:center;">Nenhuma tarefa pendente.</div>
        ` : pendingTasks.slice(0, 6).map(t => {
          const cli = t.clientId ? Clients.find(t.clientId) : null;
          return `
            <div class="list-item" data-task="${t.id}">
              <div class="list-item-main">
                <div class="list-item-title">${escapeHtml(t.title)}</div>
                <div class="list-item-subtitle">${t.dueDate ? formatDate(t.dueDate) : 'Sem data'} ${cli ? '· ' + escapeHtml(cli.name) : ''}</div>
              </div>
              <span class="badge badge-${t.priority === 'alta' ? 'danger' : t.priority === 'media' ? 'warning' : 'info'}">${t.priority || 'baixa'}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Processos recentes</div>
          <a class="panel-link" data-go="processos">Ver todos →</a>
        </div>
        ${recentProcesses.length === 0 ? `
          <div style="padding:20px 0;color:var(--text-light);font-size:13px;text-align:center;">Nenhum processo cadastrado ainda.</div>
        ` : recentProcesses.map(p => {
          const cli = p.clientId ? Clients.find(p.clientId) : null;
          return `
            <div class="list-item" data-process="${p.id}">
              <div class="list-item-main">
                <div class="list-item-title">${escapeHtml(p.number || 'Sem número')}</div>
                <div class="list-item-subtitle">${cli ? escapeHtml(cli.name) : 'Sem cliente'} ${p.type ? '· ' + escapeHtml(p.type) : ''}</div>
              </div>
              <span class="badge badge-${(p.status === 'Em andamento') ? 'success' : (p.status === 'Arquivado' ? 'neutral' : 'info')}">${escapeHtml(p.status || '—')}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Comece por aqui</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-secondary" data-action="new-client" style="justify-content:flex-start;">◐  Cadastrar novo cliente</button>
          <button class="btn btn-secondary" data-action="new-process" style="justify-content:flex-start;">▣  Cadastrar novo processo</button>
          <button class="btn btn-secondary" data-action="new-deadline" style="justify-content:flex-start;">◷  Lançar um prazo</button>
          <button class="btn btn-secondary" data-action="new-task" style="justify-content:flex-start;">✓  Criar tarefa</button>
        </div>
      </div>
    </div>
  `;

  el.querySelectorAll('[data-go]').forEach(a => a.onclick = () => navigate(a.dataset.go));
  el.querySelectorAll('[data-process]').forEach(a => a.onclick = () => navigate('processos', { processId: a.dataset.process }));
  el.querySelectorAll('[data-task]').forEach(a => a.onclick = () => navigate('tarefas'));
  el.querySelectorAll('[data-deadline]').forEach(a => a.onclick = () => navigate('prazos'));
  el.querySelector('[data-action="new-client"]').onclick = () => clientForm();
  el.querySelector('[data-action="new-process"]').onclick = () => processForm();
  el.querySelector('[data-action="new-deadline"]').onclick = () => deadlineForm();
  el.querySelector('[data-action="new-task"]').onclick = () => taskForm();
}

/* ===== CLIENTES ===== */
function renderClients(el) {
  const q = state.search.toLowerCase();
  let list = Clients.all();
  if (q) list = list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.cpfCnpj || '').includes(q) || (c.email || '').toLowerCase().includes(q));
  list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  if (list.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">◐</div>
        <div class="empty-state-title">${q ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</div>
        <div class="empty-state-text">${q ? 'Tente outra busca.' : 'Cadastre seu primeiro cliente para começar a organizar a sua pasta de processos.'}</div>
        ${q ? '' : '<button class="btn btn-primary" id="emptyNew">+ Cadastrar primeiro cliente</button>'}
      </div>`;
    if (!q) document.getElementById('emptyNew').onclick = () => clientForm();
    return;
  }

  el.innerHTML = `
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF / CNPJ</th>
            <th>Contato</th>
            <th>Processos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${list.map(c => {
            const procs = Processes.forClient(c.id);
            return `
              <tr class="clickable" data-id="${c.id}">
                <td><strong>${escapeHtml(c.name)}</strong></td>
                <td>${escapeHtml(formatCPF(c.cpfCnpj) || '—')}</td>
                <td>${escapeHtml(c.phone || c.email || '—')}</td>
                <td><span class="badge badge-info">${procs.length}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="icon-btn" data-edit="${c.id}" title="Editar">✎</button>
                    <button class="icon-btn danger" data-del="${c.id}" title="Excluir">×</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  el.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => navigate('clientes', { clientId: tr.dataset.id }));
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = e => { e.stopPropagation(); clientForm(b.dataset.edit); });
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    confirmAction('Excluir este cliente? Todos os processos, documentos, tarefas e prazos vinculados também serão excluídos.', () => {
      Clients.delete(b.dataset.del);
      toast('Cliente excluído', 'success');
      render();
    });
  });
}

function clientForm(id) {
  const c = id ? Clients.find(id) : {};
  if (id && !c) return;
  openModal(id ? 'Editar cliente' : 'Novo cliente', `
    <form id="clientFormEl">
      <div class="form-group">
        <label class="form-label">Nome completo / Razão social *</label>
        <input class="form-input" name="name" value="${escapeHtml(c.name || '')}" required autofocus>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">CPF / CNPJ</label>
          <input class="form-input" name="cpfCnpj" value="${escapeHtml(c.cpfCnpj || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">RG / Insc. Estadual</label>
          <input class="form-input" name="rg" value="${escapeHtml(c.rg || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">E-mail</label>
          <input class="form-input" type="email" name="email" value="${escapeHtml(c.email || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Telefone</label>
          <input class="form-input" name="phone" value="${escapeHtml(c.phone || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Endereço completo</label>
        <input class="form-input" name="address" value="${escapeHtml(c.address || '')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Profissão</label>
          <input class="form-input" name="profession" value="${escapeHtml(c.profession || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Estado civil</label>
          <input class="form-input" name="maritalStatus" value="${escapeHtml(c.maritalStatus || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Observações</label>
        <textarea class="form-textarea" name="notes">${escapeHtml(c.notes || '')}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="cancelBtn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${id ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
      </div>
    </form>
  `, () => {
    document.getElementById('cancelBtn').onclick = closeModal;
    document.getElementById('clientFormEl').onsubmit = e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      if (!fd.name.trim()) return;
      Clients.save({ ...c, ...fd });
      closeModal();
      toast(id ? 'Cliente atualizado' : 'Cliente cadastrado', 'success');
      render();
    };
  });
}

/* ===== CLIENTE DETALHE ===== */
function renderClientDetail(el) {
  const c = Clients.find(state.selectedClientId);
  if (!c) { navigate('clientes'); return; }
  const procs = Processes.forClient(c.id);
  const docs = Documents.forClient(c.id);
  const tasks = Tasks.forClient(c.id);
  const deadlines = Deadlines.forClient(c.id);

  el.innerHTML = `
    <a class="detail-back">← Voltar para clientes</a>
    <div class="detail-header">
      <div>
        <div class="detail-name">${escapeHtml(c.name)}</div>
        <div class="detail-sub">${escapeHtml(formatCPF(c.cpfCnpj) || 'sem CPF/CNPJ')} ${c.email ? '· ' + escapeHtml(c.email) : ''} ${c.phone ? '· ' + escapeHtml(c.phone) : ''}</div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-ghost" id="editClient">✎ Editar</button>
        <button class="btn btn-danger" id="delClient">Excluir</button>
      </div>
    </div>

    <div class="detail-tabs">
      <button class="detail-tab ${state.detailTab === 'info' ? 'active' : ''}" data-tab="info">Informações</button>
      <button class="detail-tab ${state.detailTab === 'processos' ? 'active' : ''}" data-tab="processos">Processos (${procs.length})</button>
      <button class="detail-tab ${state.detailTab === 'documentos' ? 'active' : ''}" data-tab="documentos">Documentos (${docs.length})</button>
      <button class="detail-tab ${state.detailTab === 'tarefas' ? 'active' : ''}" data-tab="tarefas">Tarefas (${tasks.length})</button>
      <button class="detail-tab ${state.detailTab === 'prazos' ? 'active' : ''}" data-tab="prazos">Prazos (${deadlines.length})</button>
      <button class="detail-tab ${state.detailTab === 'financeiro' ? 'active' : ''}" data-tab="financeiro">Financeiro (${Financeiro.forClient(c.id).length})</button>
    </div>

    <div id="clientTabContent"></div>
  `;

  el.querySelector('.detail-back').onclick = () => navigate('clientes');
  el.querySelector('#editClient').onclick = () => clientForm(c.id);
  el.querySelector('#delClient').onclick = () => confirmAction('Excluir este cliente e tudo vinculado?', () => {
    Clients.delete(c.id);
    toast('Cliente excluído', 'success');
    navigate('clientes');
  });
  el.querySelectorAll('.detail-tab').forEach(t => t.onclick = () => { state.detailTab = t.dataset.tab; renderClientDetail(el); });

  const tabEl = el.querySelector('#clientTabContent');
  switch (state.detailTab) {
    case 'info':
      tabEl.innerHTML = `
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Nome</div><div class="info-value">${escapeHtml(c.name)}</div></div>
          <div class="info-item"><div class="info-label">CPF / CNPJ</div><div class="info-value">${escapeHtml(formatCPF(c.cpfCnpj) || '—')}</div></div>
          <div class="info-item"><div class="info-label">RG / I.E.</div><div class="info-value">${escapeHtml(c.rg || '—')}</div></div>
          <div class="info-item"><div class="info-label">E-mail</div><div class="info-value">${escapeHtml(c.email || '—')}</div></div>
          <div class="info-item"><div class="info-label">Telefone</div><div class="info-value">${escapeHtml(c.phone || '—')}</div></div>
          <div class="info-item"><div class="info-label">Profissão</div><div class="info-value">${escapeHtml(c.profession || '—')}</div></div>
          <div class="info-item"><div class="info-label">Estado civil</div><div class="info-value">${escapeHtml(c.maritalStatus || '—')}</div></div>
          <div class="info-item" style="grid-column:1/-1;"><div class="info-label">Endereço</div><div class="info-value">${escapeHtml(c.address || '—')}</div></div>
        </div>
        ${c.notes ? `<div class="info-block"><div class="info-block-title">Observações</div><div class="info-block-content">${escapeHtml(c.notes)}</div></div>` : ''}
      `;
      break;
    case 'processos':
      renderProcessesIn(tabEl, procs, c.id);
      break;
    case 'documentos':
      renderDocumentsIn(tabEl, docs, { clientId: c.id });
      break;
    case 'tarefas':
      renderTasksIn(tabEl, tasks, { clientId: c.id });
      break;
    case 'prazos':
      renderDeadlinesIn(tabEl, deadlines, { clientId: c.id });
      break;
    case 'financeiro':
      renderFinanceiroIn(tabEl, Financeiro.forClient(c.id), { clientId: c.id });
      break;
  }
}

/* ===== PROCESSOS ===== */
function renderProcesses(el) {
  const q = state.search.toLowerCase();
  let list = Processes.all();
  if (q) list = list.filter(p => {
    const cli = p.clientId ? Clients.find(p.clientId) : null;
    return (p.number || '').toLowerCase().includes(q) ||
      (p.type || '').toLowerCase().includes(q) ||
      (p.court || '').toLowerCase().includes(q) ||
      (p.subject || '').toLowerCase().includes(q) ||
      (cli && cli.name.toLowerCase().includes(q));
  });
  if (state.filter.status) list = list.filter(p => p.status === state.filter.status);
  list.sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));

  el.innerHTML = `
    <div class="filter-bar">
      <span class="filter-chip ${!state.filter.status ? 'active' : ''}" data-filter="">Todos</span>
      ${PROCESS_STATUSES.map(s => `<span class="filter-chip ${state.filter.status === s ? 'active' : ''}" data-filter="${escapeHtml(s)}">${escapeHtml(s)}</span>`).join('')}
    </div>
    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">▣</div>
        <div class="empty-state-title">${q || state.filter.status ? 'Nenhum processo encontrado' : 'Nenhum processo cadastrado'}</div>
        <div class="empty-state-text">${q || state.filter.status ? 'Tente outro filtro.' : 'Cadastre seu primeiro processo para acompanhar prazos e documentos vinculados a ele.'}</div>
        ${q || state.filter.status ? '' : '<button class="btn btn-primary" id="emptyNew">+ Cadastrar primeiro processo</button>'}
      </div>
    ` : `
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Vara / Foro</th>
              <th>Status</th>
              <th>Próximo prazo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${list.map(p => {
              const cli = p.clientId ? Clients.find(p.clientId) : null;
              const next = Deadlines.forProcess(p.id).filter(d => !d.completed && daysUntil(d.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
              return `
                <tr class="clickable" data-id="${p.id}">
                  <td><strong>${escapeHtml(p.number || 'Sem número')}</strong></td>
                  <td>${cli ? escapeHtml(cli.name) : '<span class="text-light">—</span>'}</td>
                  <td>${escapeHtml(p.type || '—')}</td>
                  <td>${escapeHtml(p.court || '—')}</td>
                  <td><span class="badge badge-${p.status === 'Em andamento' ? 'success' : p.status === 'Arquivado' ? 'neutral' : 'info'}">${escapeHtml(p.status || '—')}</span></td>
                  <td>${next ? formatDate(next.date) : '<span class="text-light">—</span>'}</td>
                  <td>
                    <div class="table-actions">
                      <button class="icon-btn" data-edit="${p.id}" title="Editar">✎</button>
                      <button class="icon-btn danger" data-del="${p.id}" title="Excluir">×</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;

  el.querySelectorAll('.filter-chip').forEach(ch => ch.onclick = () => { state.filter.status = ch.dataset.filter || null; render(); });
  el.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => navigate('processos', { processId: tr.dataset.id }));
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = e => { e.stopPropagation(); processForm(b.dataset.edit); });
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    confirmAction('Excluir este processo e tudo vinculado?', () => { Processes.delete(b.dataset.del); toast('Processo excluído', 'success'); render(); });
  });
  const ne = el.querySelector('#emptyNew'); if (ne) ne.onclick = () => processForm();
}

function renderProcessesIn(el, procs, clientId) {
  el.innerHTML = `
    <div class="section-title">
      Processos do cliente
      <button class="btn btn-primary btn-sm" id="addProcLocal">+ Novo processo</button>
    </div>
    ${procs.length === 0 ? `
      <div class="empty-state"><div class="empty-state-icon">▣</div><div class="empty-state-title">Sem processos</div><div class="empty-state-text">Cadastre o primeiro processo deste cliente.</div></div>
    ` : `
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Número</th><th>Tipo</th><th>Vara / Foro</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${procs.map(p => `
              <tr class="clickable" data-id="${p.id}">
                <td><strong>${escapeHtml(p.number || 'Sem número')}</strong></td>
                <td>${escapeHtml(p.type || '—')}</td>
                <td>${escapeHtml(p.court || '—')}</td>
                <td><span class="badge badge-${p.status === 'Em andamento' ? 'success' : 'info'}">${escapeHtml(p.status || '—')}</span></td>
                <td><div class="table-actions"><button class="icon-btn" data-edit="${p.id}">✎</button></div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
  el.querySelector('#addProcLocal').onclick = () => processForm(null, clientId);
  el.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => navigate('processos', { processId: tr.dataset.id }));
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = e => { e.stopPropagation(); processForm(b.dataset.edit); });
}

function processForm(id, defaultClientId) {
  const p = id ? Processes.find(id) : { clientId: defaultClientId || '' };
  if (id && !p) return;
  const clients = Clients.all().sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Busca TODOS os honorários já vinculados a este processo (permite vários valores)
  const finList = id ? Financeiro.all().filter(f => f.processId === id) : [];

  openModal(id ? 'Editar processo' : 'Novo processo', `
    <form id="processFormEl">
      <div class="form-group">
        <label class="form-label">Número do processo</label>
        <input class="form-input" name="number" value="${escapeHtml(p.number || '')}" placeholder="0000000-00.0000.0.00.0000">
        <div class="form-help">CNJ: 7 dígitos · 2 verificadores · ano · justiça · tribunal · origem</div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cliente *</label>
          <select class="form-select" name="clientId" required>
            <option value="">— selecione —</option>
            ${clients.map(c => `<option value="${c.id}" ${p.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Polo do cliente</label>
          <select class="form-select" name="polo">
            <option value="">—</option>
            ${POLO_TYPES.map(t => `<option ${p.polo === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipo / Ramo</label>
          <select class="form-select" name="type">
            <option value="">—</option>
            ${PROCESS_TYPES.map(t => `<option ${p.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" name="status">
            ${PROCESS_STATUSES.map(s => `<option ${(p.status || 'Em andamento') === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Vara / Foro</label>
          <input class="form-input" name="court" value="${escapeHtml(p.court || '')}" placeholder="ex: 2ª Vara Cível de São Paulo">
        </div>
        <div class="form-group">
          <label class="form-label">Comarca / Tribunal</label>
          <input class="form-input" name="comarca" value="${escapeHtml(p.comarca || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Parte contrária</label>
          <input class="form-input" name="opposing" value="${escapeHtml(p.opposing || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Valor da causa</label>
          <input class="form-input" type="number" step="0.01" name="value" value="${p.value || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data de distribuição</label>
          <input class="form-input" type="date" name="distributionDate" value="${p.distributionDate || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Objeto / Assunto</label>
          <input class="form-input" name="subject" value="${escapeHtml(p.subject || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Observações / Histórico</label>
        <textarea class="form-textarea" name="notes" rows="3">${escapeHtml(p.notes || '')}</textarea>
      </div>

      <div style="margin:20px 0 14px;padding-top:16px;border-top:2px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px;">
          <div style="font-family:Georgia,serif;font-size:16px;color:var(--moss-darkest);">$ Honorários</div>
          <button type="button" class="btn btn-secondary btn-sm" id="addHonBtn">+ Adicionar honorário</button>
        </div>
        <div class="form-help" style="margin-bottom:12px;">Você pode cadastrar vários honorários para o mesmo processo — cada um com seu próprio valor e forma de pagamento (à vista ou parcelado), em momentos diferentes.</div>
        <div id="honList"></div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="cancelBtn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${id ? 'Salvar alterações' : 'Cadastrar processo'}</button>
      </div>
    </form>
  `, () => {
    document.getElementById('cancelBtn').onclick = closeModal;

    // ── Honorários: lista dinâmica (vários valores por processo) ──
    const honList = document.getElementById('honList');
    let honSeq = 0;
    const descPadrao = p.number ? 'Honorários – proc. ' + p.number : 'Honorários';

    function addHonBlock(data = {}) {
      const uidLocal = 'hon' + (honSeq++);
      const tipo = data.tipo === 'parcelado' ? 'parcelado' : 'unico';
      const numParc = data.parcelas ? data.parcelas.length : 2;
      const primVenc = data.parcelas ? (data.parcelas[0]?.vencimento || '') : '';
      const wrap = document.createElement('div');
      wrap.className = 'hon-block';
      wrap.dataset.finId = data.id || '';
      wrap.style.cssText = 'border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:12px;background:var(--cream);';
      wrap.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">
          <input class="form-input hon-desc" value="${escapeHtml(data.descricao || descPadrao)}" placeholder="ex: Honorários – entrada" style="font-weight:600;">
          <button type="button" class="icon-btn danger hon-remove" title="Remover honorário" style="flex-shrink:0;">×</button>
        </div>
        <div style="display:flex;gap:16px;margin-bottom:10px;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="radio" name="tipo_${uidLocal}" value="unico" class="hon-tipo hon-tipo-unico" ${tipo === 'unico' ? 'checked' : ''}> À vista
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="radio" name="tipo_${uidLocal}" value="parcelado" class="hon-tipo hon-tipo-parc" ${tipo === 'parcelado' ? 'checked' : ''}> Parcelado
          </label>
        </div>
        <div class="hon-campos-unico" style="${tipo === 'parcelado' ? 'display:none' : ''}">
          <div class="form-row">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Valor (R$)</label>
              <input class="form-input hon-valor" type="number" step="0.01" value="${tipo === 'unico' ? (data.valorTotal || '') : ''}">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Data de vencimento</label>
              <input class="form-input hon-venc" type="date" value="${tipo === 'unico' ? (data.vencimento || '') : ''}">
            </div>
          </div>
        </div>
        <div class="hon-campos-parc" style="${tipo !== 'parcelado' ? 'display:none' : ''}">
          <div class="form-row">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Valor total (R$)</label>
              <input class="form-input hon-valorparc" type="number" step="0.01" value="${tipo === 'parcelado' ? (data.valorTotal || '') : ''}">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Número de parcelas</label>
              <input class="form-input hon-numparc" type="number" min="2" max="120" value="${numParc}">
            </div>
          </div>
          <div class="form-group" style="margin-top:12px;margin-bottom:0;">
            <label class="form-label">Vencimento da 1ª parcela</label>
            <input class="form-input hon-primvenc" type="date" value="${primVenc}">
          </div>
        </div>
      `;
      // Toggle à vista / parcelado dentro deste bloco
      const camposUnico = wrap.querySelector('.hon-campos-unico');
      const camposParc = wrap.querySelector('.hon-campos-parc');
      wrap.querySelector('.hon-tipo-unico').onchange = () => { camposUnico.style.display = ''; camposParc.style.display = 'none'; };
      wrap.querySelector('.hon-tipo-parc').onchange = () => { camposUnico.style.display = 'none'; camposParc.style.display = ''; };
      wrap.querySelector('.hon-remove').onclick = () => wrap.remove();
      honList.appendChild(wrap);
    }

    // Popula com os honorários já cadastrados (ou nada, se novo)
    finList.forEach(f => addHonBlock(f));
    document.getElementById('addHonBtn').onclick = () => addHonBlock();

    document.getElementById('processFormEl').onsubmit = e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      if (!fd.clientId) { alert('Selecione um cliente.'); return; }

      const savedProc = Processes.save({ ...p, ...fd });
      const procId = savedProc.id || p.id;

      // Salvar cada bloco de honorário como um registro Financeiro independente
      const keptIds = [];
      honList.querySelectorAll('.hon-block').forEach(bl => {
        const finId = bl.dataset.finId || null;
        const existente = finId ? finList.find(f => f.id === finId) : null;
        const descricao = (bl.querySelector('.hon-desc').value.trim()) || descPadrao;
        const tipo = bl.querySelector('.hon-tipo:checked').value;

        if (tipo === 'parcelado') {
          const valor = Number(bl.querySelector('.hon-valorparc').value);
          const num = Number(bl.querySelector('.hon-numparc').value);
          const primVenc = bl.querySelector('.hon-primvenc').value;
          if (!valor || !num || !primVenc) return; // bloco incompleto: ignora
          const parcBase = existente && existente.tipo === 'parcelado' &&
            existente.parcelas && existente.parcelas.length === num
            ? existente.parcelas
            : gerarParcelas(valor, num, primVenc);
          const saved = Financeiro.save({
            ...(existente || {}),
            descricao,
            clientId: fd.clientId,
            processId: procId,
            tipo: 'parcelado',
            valorTotal: valor,
            vencimento: null,
            parcelas: parcBase
          });
          keptIds.push(saved.id);
        } else {
          const valor = Number(bl.querySelector('.hon-valor').value);
          if (!valor) return; // bloco incompleto: ignora
          const saved = Financeiro.save({
            ...(existente || {}),
            descricao,
            clientId: fd.clientId,
            processId: procId,
            tipo: 'unico',
            valorTotal: valor,
            vencimento: bl.querySelector('.hon-venc').value || '',
            parcelas: null,
            pago: existente ? existente.pago : false,
            dataPagamento: existente ? existente.dataPagamento : null
          });
          keptIds.push(saved.id);
        }
      });

      // Remove honorários que existiam mas foram apagados no formulário
      finList.forEach(f => { if (!keptIds.includes(f.id)) Financeiro.delete(f.id); });

      closeModal();
      toast(id ? 'Processo atualizado' : 'Processo cadastrado', 'success');
      render();
    };
  });
}

/* ===== PROCESSO DETALHE ===== */
function renderProcessDetail(el) {
  const p = Processes.find(state.selectedProcessId);
  if (!p) { navigate('processos'); return; }
  const cli = p.clientId ? Clients.find(p.clientId) : null;
  const docs = Documents.forProcess(p.id);
  const tasks = Tasks.forProcess(p.id);
  const deadlines = Deadlines.forProcess(p.id);

  el.innerHTML = `
    <a class="detail-back">← Voltar para processos</a>
    <div class="detail-header">
      <div>
        <div class="detail-name">${escapeHtml(p.number || 'Sem número')}</div>
        <div class="detail-sub">
          ${cli ? `<a class="panel-link" data-client="${cli.id}">${escapeHtml(cli.name)}</a>` : 'Sem cliente'}
          ${p.type ? '· ' + escapeHtml(p.type) : ''}
          · <span class="badge badge-${p.status === 'Em andamento' ? 'success' : 'info'}">${escapeHtml(p.status || '—')}</span>
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-ghost" id="editProc">✎ Editar</button>
        <button class="btn btn-danger" id="delProc">Excluir</button>
      </div>
    </div>

    <div class="detail-tabs">
      <button class="detail-tab ${state.detailTab === 'info' ? 'active' : ''}" data-tab="info">Informações</button>
      <button class="detail-tab ${state.detailTab === 'documentos' ? 'active' : ''}" data-tab="documentos">Documentos (${docs.length})</button>
      <button class="detail-tab ${state.detailTab === 'tarefas' ? 'active' : ''}" data-tab="tarefas">Tarefas (${tasks.length})</button>
      <button class="detail-tab ${state.detailTab === 'prazos' ? 'active' : ''}" data-tab="prazos">Prazos (${deadlines.length})</button>
    </div>

    <div id="procTabContent"></div>
  `;

  el.querySelector('.detail-back').onclick = () => navigate('processos');
  el.querySelector('#editProc').onclick = () => processForm(p.id);
  el.querySelector('#delProc').onclick = () => confirmAction('Excluir este processo e tudo vinculado?', () => { Processes.delete(p.id); toast('Processo excluído', 'success'); navigate('processos'); });
  const clientLink = el.querySelector('[data-client]');
  if (clientLink) clientLink.onclick = () => navigate('clientes', { clientId: clientLink.dataset.client });
  el.querySelectorAll('.detail-tab').forEach(t => t.onclick = () => { state.detailTab = t.dataset.tab; renderProcessDetail(el); });

  const tabEl = el.querySelector('#procTabContent');
  switch (state.detailTab) {
    case 'info': {
      const honProc = Financeiro.all().filter(f => f.processId === p.id);
      const honTotal = honProc.reduce((s, f) => s + (Number(f.valorTotal) || 0), 0);
      const honResumo = honProc.length
        ? `${honProc.length} ${honProc.length === 1 ? 'honorário' : 'honorários'} · ${formatBRL(honTotal)}`
        : escapeHtml(p.fees || '—');
      tabEl.innerHTML = `
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Número CNJ</div><div class="info-value">${escapeHtml(p.number || '—')}</div></div>
          <div class="info-item"><div class="info-label">Cliente</div><div class="info-value">${cli ? escapeHtml(cli.name) : '—'}</div></div>
          <div class="info-item"><div class="info-label">Polo do cliente</div><div class="info-value">${escapeHtml(p.polo || '—')}</div></div>
          <div class="info-item"><div class="info-label">Parte contrária</div><div class="info-value">${escapeHtml(p.opposing || '—')}</div></div>
          <div class="info-item"><div class="info-label">Tipo</div><div class="info-value">${escapeHtml(p.type || '—')}</div></div>
          <div class="info-item"><div class="info-label">Status</div><div class="info-value">${escapeHtml(p.status || '—')}</div></div>
          <div class="info-item"><div class="info-label">Vara / Foro</div><div class="info-value">${escapeHtml(p.court || '—')}</div></div>
          <div class="info-item"><div class="info-label">Comarca</div><div class="info-value">${escapeHtml(p.comarca || '—')}</div></div>
          <div class="info-item"><div class="info-label">Distribuição</div><div class="info-value">${formatDate(p.distributionDate)}</div></div>
          <div class="info-item"><div class="info-label">Valor da causa</div><div class="info-value">${p.value ? formatBRL(p.value) : '—'}</div></div>
          <div class="info-item"><div class="info-label">Honorários</div><div class="info-value">${honResumo}</div></div>
          <div class="info-item" style="grid-column:1/-1;"><div class="info-label">Objeto / Assunto</div><div class="info-value">${escapeHtml(p.subject || '—')}</div></div>
        </div>
        ${honProc.length ? `
          <div class="info-block">
            <div class="info-block-title">Honorários do processo (${honProc.length}) · Total ${formatBRL(honTotal)}</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">
              ${honProc.map(f => {
                const tipoLbl = f.tipo === 'parcelado'
                  ? `Parcelado em ${f.parcelas ? f.parcelas.length : 0}x`
                  : 'À vista';
                return `
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
                    <div style="min-width:0;">
                      <div style="font-weight:600;color:var(--text-dark);">${escapeHtml(f.descricao || 'Honorários')}</div>
                      <div style="font-size:12px;color:var(--text-light);">${tipoLbl}</div>
                    </div>
                    <div style="font-weight:600;color:var(--moss-dark);white-space:nowrap;">${formatBRL(f.valorTotal)}</div>
                  </div>
                `;
              }).join('')}
            </div>
            <div style="margin-top:10px;font-size:12px;color:var(--text-light);">Gerencie pagamentos e parcelas na aba <strong>Financeiro</strong>.</div>
          </div>
        ` : ''}
        ${p.notes ? `<div class="info-block"><div class="info-block-title">Observações / Histórico</div><div class="info-block-content">${escapeHtml(p.notes)}</div></div>` : ''}
      `;
      break;
    }
    case 'documentos':
      renderDocumentsIn(tabEl, docs, { processId: p.id, clientId: p.clientId });
      break;
    case 'tarefas':
      renderTasksIn(tabEl, tasks, { processId: p.id, clientId: p.clientId });
      break;
    case 'prazos':
      renderDeadlinesIn(tabEl, deadlines, { processId: p.id, clientId: p.clientId });
      break;
  }
}

/* ===== DOCUMENTOS ===== */
function renderDocuments(el) {
  const q = state.search.toLowerCase();
  const allDocs = Documents.all();

  // --- Modo busca: mostra resultados achatados ignorando a navegação por pastas
  if (q) {
    const list = allDocs.filter(d =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.type || '').toLowerCase().includes(q) ||
      (d.fileName || '').toLowerCase().includes(q)
    ).sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));

    el.innerHTML = `
      <div class="doc-breadcrumb">
        <a data-back="root">Pastas de clientes</a>
        <span class="doc-breadcrumb-sep">›</span>
        <span>Busca: "${escapeHtml(q)}"</span>
      </div>
      ${list.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">▤</div>
          <div class="empty-state-title">Nenhum documento encontrado</div>
          <div class="empty-state-text">Tente outro termo de busca.</div>
        </div>
      ` : `
        <div class="doc-grid">
          ${list.map(d => docCardHtml(d, true)).join('')}
        </div>
      `}
    `;
    attachDocActions(el);
    const back = el.querySelector('[data-back]'); if (back) back.onclick = () => { state.docClientId = null; state.docFolder = null; document.getElementById('globalSearch').value = ''; state.search = ''; render(); };
    return;
  }

  // --- Nível 1: nenhuma pasta de cliente aberta → mostra uma pasta por cliente
  if (!state.docClientId) {
    const clients = Clients.all().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const unassigned = allDocs.filter(d => !d.clientId).length;

    el.innerHTML = `
      <div class="doc-breadcrumb">
        <strong>Pastas de clientes</strong>
        <span class="doc-breadcrumb-hint">Clique em uma pasta para ver os documentos do cliente</span>
      </div>
      ${clients.length === 0 && unassigned === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">▤</div>
          <div class="empty-state-title">Sem clientes cadastrados</div>
          <div class="empty-state-text">Cadastre um cliente para criar a pasta de documentos dele.</div>
          <button class="btn btn-primary" id="goClients">Ir para Clientes</button>
        </div>
      ` : `
        <div class="folder-grid">
          ${clients.map(c => {
            const count = allDocs.filter(d => d.clientId === c.id).length;
            return `
              <div class="folder-card" data-open-client="${c.id}">
                <div class="folder-icon">▣</div>
                <div class="folder-name">${escapeHtml(c.name)}</div>
                <div class="folder-meta">${count} ${count === 1 ? 'documento' : 'documentos'}</div>
              </div>
            `;
          }).join('')}
          ${unassigned > 0 ? `
            <div class="folder-card folder-card-muted" data-open-client="_none">
              <div class="folder-icon">▣</div>
              <div class="folder-name">Sem cliente vinculado</div>
              <div class="folder-meta">${unassigned} ${unassigned === 1 ? 'documento' : 'documentos'}</div>
            </div>
          ` : ''}
        </div>
      `}
    `;
    el.querySelectorAll('[data-open-client]').forEach(card => {
      card.onclick = () => { state.docClientId = card.dataset.openClient; state.docFolder = null; render(); };
    });
    const go = el.querySelector('#goClients'); if (go) go.onclick = () => navigate('clientes');
    return;
  }

  // --- Nível 2: cliente aberto, sem subpasta selecionada → mostra divisões
  const isUnassigned = state.docClientId === '_none';
  const client = isUnassigned ? null : Clients.find(state.docClientId);
  if (!isUnassigned && !client) { state.docClientId = null; render(); return; }

  const clientDocs = isUnassigned
    ? allDocs.filter(d => !d.clientId)
    : allDocs.filter(d => d.clientId === state.docClientId);

  if (!state.docFolder) {
    const byFolder = {};
    DOC_TYPES.forEach(f => { byFolder[f] = 0; });
    clientDocs.forEach(d => {
      const f = folderFor(d.type);
      byFolder[f] = (byFolder[f] || 0) + 1;
    });

    el.innerHTML = `
      <div class="doc-breadcrumb">
        <a data-back="root">Pastas de clientes</a>
        <span class="doc-breadcrumb-sep">›</span>
        <strong>${escapeHtml(client ? client.name : 'Sem cliente vinculado')}</strong>
      </div>
      <div class="folder-header">
        <div>
          <h2 class="folder-title">▣ ${escapeHtml(client ? client.name : 'Sem cliente vinculado')}</h2>
          <div class="folder-subtitle">${clientDocs.length} ${clientDocs.length === 1 ? 'documento no total' : 'documentos no total'} · escolha uma divisão abaixo</div>
        </div>
      </div>
      <div class="folder-grid">
        ${DOC_TYPES.map(f => `
          <div class="folder-card folder-card-sub" data-open-folder="${escapeHtml(f)}">
            <div class="folder-icon">${fileIcon(f)}</div>
            <div class="folder-name">${escapeHtml(f)}</div>
            <div class="folder-meta">${byFolder[f] || 0} ${(byFolder[f] || 0) === 1 ? 'arquivo' : 'arquivos'}</div>
          </div>
        `).join('')}
      </div>
    `;
    el.querySelector('[data-back]').onclick = () => { state.docClientId = null; state.docFolder = null; render(); };
    el.querySelectorAll('[data-open-folder]').forEach(card => {
      card.onclick = () => { state.docFolder = card.dataset.openFolder; render(); };
    });
    return;
  }

  // --- Nível 3: dentro de uma divisão → mostra os documentos dela
  const list = clientDocs
    .filter(d => folderFor(d.type) === state.docFolder)
    .sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));

  el.innerHTML = `
    <div class="doc-breadcrumb">
      <a data-back="root">Pastas de clientes</a>
      <span class="doc-breadcrumb-sep">›</span>
      <a data-back="client">${escapeHtml(client ? client.name : 'Sem cliente vinculado')}</a>
      <span class="doc-breadcrumb-sep">›</span>
      <strong>${escapeHtml(state.docFolder)}</strong>
    </div>
    <div class="folder-header">
      <div>
        <h2 class="folder-title">${fileIcon(state.docFolder)} ${escapeHtml(state.docFolder)}</h2>
        <div class="folder-subtitle">${escapeHtml(client ? client.name : 'Sem cliente vinculado')} · ${list.length} ${list.length === 1 ? 'arquivo' : 'arquivos'}</div>
      </div>
      <div>
        <button class="btn btn-primary" id="addDocHere">+ Adicionar nesta pasta</button>
      </div>
    </div>
    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">${fileIcon(state.docFolder)}</div>
        <div class="empty-state-title">Sem arquivos em ${escapeHtml(state.docFolder)}</div>
        <div class="empty-state-text">Adicione o primeiro arquivo desta divisão.</div>
        <button class="btn btn-primary" id="addDocEmpty">+ Adicionar documento</button>
      </div>
    ` : `
      <div class="doc-grid">
        ${list.map(d => docCardHtml(d, false)).join('')}
      </div>
    `}
  `;
  el.querySelector('[data-back="root"]').onclick = () => { state.docClientId = null; state.docFolder = null; render(); };
  el.querySelector('[data-back="client"]').onclick = () => { state.docFolder = null; render(); };
  const ctx = { clientId: isUnassigned ? '' : state.docClientId, type: state.docFolder };
  const addHere = el.querySelector('#addDocHere'); if (addHere) addHere.onclick = () => documentForm(null, ctx);
  const addEmpty = el.querySelector('#addDocEmpty'); if (addEmpty) addEmpty.onclick = () => documentForm(null, ctx);
  attachDocActions(el);
}

// Renderiza um cartão de documento. Se `showContext` for true, mostra cliente/processo (útil em buscas).
function docCardHtml(d, showContext) {
  const cli = d.clientId ? Clients.find(d.clientId) : null;
  const proc = d.processId ? Processes.find(d.processId) : null;
  const date = formatDate((d.uploadedAt || '').split('T')[0]);
  return `
    <div class="doc-card">
      <div class="doc-icon">${fileIcon(d.type)}</div>
      <div class="doc-name" title="${escapeHtml(d.name)}">${escapeHtml(d.name)}</div>
      <div class="doc-type">${escapeHtml(folderFor(d.type))}</div>
      <div class="doc-meta">
        ${showContext && cli ? escapeHtml(cli.name) + '<br>' : ''}
        ${showContext && proc ? 'Proc. ' + escapeHtml(proc.number || '—') + '<br>' : ''}
        ${date}
      </div>
      <div class="doc-actions">
        <button class="icon-btn" data-download="${d.id}" title="Baixar">↓</button>
        <button class="icon-btn" data-edit="${d.id}" title="Editar">✎</button>
        <button class="icon-btn danger" data-del="${d.id}" title="Excluir">×</button>
      </div>
    </div>
  `;
}

function attachDocActions(el) {
  el.querySelectorAll('[data-download]').forEach(b => b.onclick = () => downloadDocument(b.dataset.download));
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => documentForm(b.dataset.edit));
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirmAction('Excluir este documento?', async () => { await Documents.delete(b.dataset.del); toast('Documento excluído', 'success'); render(); }));
}

function renderDocumentsIn(el, docs, ctx) {
  el.innerHTML = `
    <div class="section-title">
      Documentos
      <button class="btn btn-primary btn-sm" id="addDocLocal">+ Adicionar documento</button>
    </div>
    ${docs.length === 0 ? `
      <div class="empty-state"><div class="empty-state-icon">▤</div><div class="empty-state-title">Sem documentos</div><div class="empty-state-text">Adicione o primeiro arquivo desta pasta.</div></div>
    ` : `
      <div class="doc-grid">
        ${docs.map(d => `
          <div class="doc-card">
            <div class="doc-icon">${fileIcon(d.type)}</div>
            <div class="doc-name" title="${escapeHtml(d.name)}">${escapeHtml(d.name)}</div>
            <div class="doc-type">${escapeHtml(d.type || 'Documento')}</div>
            <div class="doc-meta">${formatDate((d.uploadedAt || '').split('T')[0])}</div>
            <div class="doc-actions">
              <button class="icon-btn" data-download="${d.id}" title="Baixar">↓</button>
              <button class="icon-btn" data-edit="${d.id}" title="Editar">✎</button>
              <button class="icon-btn danger" data-del="${d.id}" title="Excluir">×</button>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
  el.querySelector('#addDocLocal').onclick = () => documentForm(null, ctx);
  el.querySelectorAll('[data-download]').forEach(b => b.onclick = () => downloadDocument(b.dataset.download));
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => documentForm(b.dataset.edit));
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirmAction('Excluir este documento?', async () => { await Documents.delete(b.dataset.del); toast('Documento excluído', 'success'); render(); }));
}

function documentForm(id, ctx) {
  const d = id ? Documents.find(id) : { clientId: (ctx && ctx.clientId) || '', processId: (ctx && ctx.processId) || '', type: (ctx && ctx.type) || '' };
  if (id && !d) return;
  const clients = Clients.all().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const allProcs = Processes.all();

  openModal(id ? 'Editar documento' : 'Novo documento', `
    <form id="docFormEl">
      ${id ? '' : `
        <div class="form-group">
          <label class="form-label">Arquivo *</label>
          <input class="form-input" type="file" id="fileInput" required>
          <div class="form-help">Limite recomendado: 10 MB por arquivo. PDFs, imagens e documentos do Word são aceitos.</div>
        </div>
      `}
      <div class="form-group">
        <label class="form-label">Nome do documento</label>
        <input class="form-input" name="name" value="${escapeHtml(d.name || '')}" placeholder="Deixe em branco para usar o nome do arquivo">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Pasta / Divisão</label>
          <select class="form-select" name="type">
            <option value="">—</option>
            ${DOC_TYPES.map(t => `<option ${d.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            ${d.type && !DOC_TYPES.includes(d.type) ? `<option selected>${escapeHtml(d.type)}</option>` : ''}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Cliente</label>
          <select class="form-select" name="clientId" id="docClient">
            <option value="">—</option>
            ${clients.map(c => `<option value="${c.id}" ${d.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Processo</label>
        <select class="form-select" name="processId" id="docProcess">
          <option value="">—</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Observações</label>
        <textarea class="form-textarea" name="notes" rows="2">${escapeHtml(d.notes || '')}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="cancelBtn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${id ? 'Salvar' : 'Adicionar documento'}</button>
      </div>
    </form>
  `, () => {
    document.getElementById('cancelBtn').onclick = closeModal;
    const procSel = document.getElementById('docProcess');
    const cliSel = document.getElementById('docClient');
    function refreshProc() {
      const cid = cliSel.value;
      const filtered = cid ? allProcs.filter(p => p.clientId === cid) : allProcs;
      procSel.innerHTML = '<option value="">—</option>' + filtered.map(p => `<option value="${p.id}" ${d.processId === p.id ? 'selected' : ''}>${escapeHtml(p.number || 'Sem número')}</option>`).join('');
    }
    cliSel.onchange = refreshProc;
    refreshProc();

    document.getElementById('docFormEl').onsubmit = async e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      if (id) {
        Documents.save({ ...d, ...fd });
        closeModal();
        toast('Documento atualizado', 'success');
        render();
      } else {
        const file = document.getElementById('fileInput').files[0];
        if (!file) { alert('Selecione um arquivo.'); return; }
        if (file.size > 50 * 1024 * 1024) {
          alert('Arquivo muito grande (máx. 50 MB).');
          return;
        }
        const submitBtn = e.target.querySelector('[type=submit]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando…';
        const reader = new FileReader();
        reader.onload = async ev => {
          try {
            await Documents.saveWithFile({
              ...fd,
              name: fd.name.trim() || file.name,
              fileName: file.name,
              mimeType: file.type,
              size: file.size
            }, ev.target.result);
            closeModal();
            toast('Documento adicionado', 'success');
            render();
          } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Adicionar documento';
            alert('Erro ao salvar o arquivo: ' + err.message);
          }
        };
        reader.onerror = () => { submitBtn.disabled = false; submitBtn.textContent = 'Adicionar documento'; alert('Erro ao ler o arquivo.'); };
        reader.readAsDataURL(file);
      }
    };
  });
}

function downloadDocument(id) {
  const d = Documents.find(id);
  if (!d) return;
  // Tenta IndexedDB primeiro, fallback para campo 'data' legado no localStorage
  DocDB.getFile(id).then(dataUrl => {
    const url = dataUrl || d.data;
    if (!url) { alert('Arquivo não disponível. Pode ter sido salvo em uma versão anterior — exclua e adicione novamente.'); return; }
    const a = document.createElement('a');
    a.href = url;
    a.download = d.fileName || d.name || 'documento';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }).catch(() => {
    if (d.data) {
      const a = document.createElement('a');
      a.href = d.data;
      a.download = d.fileName || d.name || 'documento';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Arquivo não disponível.');
    }
  });
}

/* ===== TAREFAS ===== */
function renderTasks(el) {
  const q = state.search.toLowerCase();
  let list = Tasks.all();
  if (q) list = list.filter(t => (t.title || '').toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q));
  if (state.filter.taskStatus === 'pending') list = list.filter(t => !t.completed);
  else if (state.filter.taskStatus === 'done') list = list.filter(t => t.completed);
  if (state.filter.taskPriority) list = list.filter(t => t.priority === state.filter.taskPriority);
  list.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  });

  el.innerHTML = `
    <div class="filter-bar">
      <span class="filter-chip ${(state.filter.taskStatus || 'pending') === 'pending' ? 'active' : ''}" data-status="pending">Pendentes</span>
      <span class="filter-chip ${state.filter.taskStatus === 'done' ? 'active' : ''}" data-status="done">Concluídas</span>
      <span class="filter-chip ${state.filter.taskStatus === 'all' ? 'active' : ''}" data-status="all">Todas</span>
      <div style="width:1px;height:20px;background:var(--border);"></div>
      <span class="filter-chip ${!state.filter.taskPriority ? 'active' : ''}" data-priority="">Todas as prioridades</span>
      ${TASK_PRIORITIES.map(p => `<span class="filter-chip ${state.filter.taskPriority === p.v ? 'active' : ''}" data-priority="${p.v}">${p.l}</span>`).join('')}
    </div>
    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">✓</div>
        <div class="empty-state-title">Nenhuma tarefa</div>
        <div class="empty-state-text">Crie sua primeira tarefa para organizar o que precisa ser feito.</div>
        <button class="btn btn-primary" id="emptyNew">+ Criar tarefa</button>
      </div>
    ` : `
      <div class="task-list">
        ${list.map(t => taskItemHtml(t)).join('')}
      </div>
    `}
  `;
  el.querySelectorAll('[data-status]').forEach(c => c.onclick = () => { state.filter.taskStatus = c.dataset.status; render(); });
  el.querySelectorAll('[data-priority]').forEach(c => c.onclick = () => { state.filter.taskPriority = c.dataset.priority || null; render(); });
  attachTaskHandlers(el);
  const ne = el.querySelector('#emptyNew'); if (ne) ne.onclick = () => taskForm();
}

function renderTasksIn(el, tasks, ctx) {
  el.innerHTML = `
    <div class="section-title">
      Tarefas
      <button class="btn btn-primary btn-sm" id="addTaskLocal">+ Nova tarefa</button>
    </div>
    ${tasks.length === 0 ? `
      <div class="empty-state"><div class="empty-state-icon">✓</div><div class="empty-state-title">Sem tarefas</div><div class="empty-state-text">Crie a primeira tarefa.</div></div>
    ` : `<div class="task-list">${tasks.map(taskItemHtml).join('')}</div>`}
  `;
  el.querySelector('#addTaskLocal').onclick = () => taskForm(null, ctx);
  attachTaskHandlers(el);
}

function taskItemHtml(t) {
  const cli = t.clientId ? Clients.find(t.clientId) : null;
  const proc = t.processId ? Processes.find(t.processId) : null;
  const days = t.dueDate ? daysUntil(t.dueDate) : null;
  let dueLabel = '';
  if (t.dueDate) {
    if (days < 0) dueLabel = `<span style="color:var(--red);font-weight:500;">Vencida há ${-days}d</span>`;
    else if (days === 0) dueLabel = `<span style="color:var(--red);font-weight:500;">Hoje</span>`;
    else if (days === 1) dueLabel = `<span style="color:#8a6e2c;font-weight:500;">Amanhã</span>`;
    else dueLabel = `Vence ${formatDate(t.dueDate)}`;
  }
  return `
    <div class="task-item priority-${t.priority || 'baixa'} ${t.completed ? 'completed' : ''}" data-task="${t.id}">
      <input type="checkbox" class="task-checkbox" data-toggle="${t.id}" ${t.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="task-meta">
          ${dueLabel ? dueLabel + '<span class="task-meta-sep">·</span>' : ''}
          ${cli ? escapeHtml(cli.name) + '<span class="task-meta-sep">·</span>' : ''}
          ${proc ? 'proc. ' + escapeHtml(proc.number || '—') + '<span class="task-meta-sep">·</span>' : ''}
          <span class="badge badge-${t.priority === 'alta' ? 'danger' : t.priority === 'media' ? 'warning' : 'info'}">${t.priority || 'baixa'}</span>
        </div>
      </div>
      <div class="table-actions">
        <button class="icon-btn" data-edit="${t.id}">✎</button>
        <button class="icon-btn danger" data-del="${t.id}">×</button>
      </div>
    </div>
  `;
}

function attachTaskHandlers(el) {
  el.querySelectorAll('[data-toggle]').forEach(c => c.onchange = () => { Tasks.toggle(c.dataset.toggle); render(); });
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => taskForm(b.dataset.edit));
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirmAction('Excluir esta tarefa?', () => { Tasks.delete(b.dataset.del); toast('Tarefa excluída', 'success'); render(); }));
}

function taskForm(id, ctx) {
  const t = id ? Tasks.find(id) : { priority: 'media', clientId: (ctx && ctx.clientId) || '', processId: (ctx && ctx.processId) || '' };
  if (id && !t) return;
  const clients = Clients.all().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const allProcs = Processes.all();
  openModal(id ? 'Editar tarefa' : 'Nova tarefa', `
    <form id="taskFormEl">
      <div class="form-group">
        <label class="form-label">Título *</label>
        <input class="form-input" name="title" value="${escapeHtml(t.title || '')}" required autofocus>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data limite</label>
          <input class="form-input" type="date" name="dueDate" value="${t.dueDate || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Prioridade</label>
          <select class="form-select" name="priority">
            ${TASK_PRIORITIES.map(p => `<option value="${p.v}" ${t.priority === p.v ? 'selected' : ''}>${p.l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cliente (opcional)</label>
          <select class="form-select" name="clientId" id="taskClient">
            <option value="">—</option>
            ${clients.map(c => `<option value="${c.id}" ${t.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Processo (opcional)</label>
          <select class="form-select" name="processId" id="taskProcess">
            <option value="">—</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Detalhes</label>
        <textarea class="form-textarea" name="notes" rows="3">${escapeHtml(t.notes || '')}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="cancelBtn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${id ? 'Salvar' : 'Criar tarefa'}</button>
      </div>
    </form>
  `, () => {
    document.getElementById('cancelBtn').onclick = closeModal;
    const cliSel = document.getElementById('taskClient');
    const procSel = document.getElementById('taskProcess');
    function refreshProc() {
      const cid = cliSel.value;
      const filtered = cid ? allProcs.filter(p => p.clientId === cid) : allProcs;
      procSel.innerHTML = '<option value="">—</option>' + filtered.map(p => `<option value="${p.id}" ${t.processId === p.id ? 'selected' : ''}>${escapeHtml(p.number || 'Sem número')}</option>`).join('');
    }
    cliSel.onchange = refreshProc;
    refreshProc();

    document.getElementById('taskFormEl').onsubmit = e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      Tasks.save({ ...t, ...fd });
      closeModal();
      toast(id ? 'Tarefa atualizada' : 'Tarefa criada', 'success');
      render();
    };
  });
}

/* ===== PRAZOS ===== */
function renderDeadlines(el) {
  const q = state.search.toLowerCase();
  let list = Deadlines.all();
  if (q) list = list.filter(d => (d.title || '').toLowerCase().includes(q));
  if (state.filter.deadlineType) list = list.filter(d => d.type === state.filter.deadlineType);
  if (state.filter.deadlineStatus === 'pending') list = list.filter(d => !d.completed);
  else if (state.filter.deadlineStatus === 'done') list = list.filter(d => d.completed);
  else state.filter.deadlineStatus = 'pending', list = list.filter(d => !d.completed);
  list.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));

  el.innerHTML = `
    <div class="filter-bar">
      <span class="filter-chip ${state.filter.deadlineStatus === 'pending' ? 'active' : ''}" data-dstatus="pending">Pendentes</span>
      <span class="filter-chip ${state.filter.deadlineStatus === 'done' ? 'active' : ''}" data-dstatus="done">Cumpridos</span>
      <span class="filter-chip ${state.filter.deadlineStatus === 'all' ? 'active' : ''}" data-dstatus="all">Todos</span>
      <div style="width:1px;height:20px;background:var(--border);"></div>
      <span class="filter-chip ${!state.filter.deadlineType ? 'active' : ''}" data-dtype="">Todos os tipos</span>
      ${DEADLINE_TYPES.map(t => `<span class="filter-chip ${state.filter.deadlineType === t.v ? 'active' : ''}" data-dtype="${t.v}">${t.l}</span>`).join('')}
    </div>
    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">◷</div>
        <div class="empty-state-title">Nenhum prazo</div>
        <div class="empty-state-text">Lance o primeiro prazo para começar a acompanhar.</div>
        <button class="btn btn-primary" id="emptyNew">+ Novo prazo</button>
      </div>
    ` : list.map(d => deadlineCardHtml(d)).join('')}
  `;
  el.querySelectorAll('[data-dstatus]').forEach(c => c.onclick = () => { state.filter.deadlineStatus = c.dataset.dstatus; render(); });
  el.querySelectorAll('[data-dtype]').forEach(c => c.onclick = () => { state.filter.deadlineType = c.dataset.dtype || null; render(); });
  attachDeadlineHandlers(el);
  const ne = el.querySelector('#emptyNew'); if (ne) ne.onclick = () => deadlineForm();
}

function renderDeadlinesIn(el, deadlines, ctx) {
  el.innerHTML = `
    <div class="section-title">
      Prazos
      <button class="btn btn-primary btn-sm" id="addDeadlineLocal">+ Novo prazo</button>
    </div>
    ${deadlines.length === 0 ? `
      <div class="empty-state"><div class="empty-state-icon">◷</div><div class="empty-state-title">Sem prazos</div><div class="empty-state-text">Lance o primeiro prazo.</div></div>
    ` : deadlines.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999')).map(deadlineCardHtml).join('')}
  `;
  el.querySelector('#addDeadlineLocal').onclick = () => deadlineForm(null, ctx);
  attachDeadlineHandlers(el);
}

function deadlineCardHtml(d) {
  const days = daysUntil(d.date);
  const urg = d.completed ? 'done' : (days < 0 ? 'urgent' : days <= 3 ? 'soon' : days <= 7 ? 'soon' : 'future');
  const dt = d.date ? new Date(d.date + 'T00:00:00') : null;
  const cli = d.clientId ? Clients.find(d.clientId) : null;
  const proc = d.processId ? Processes.find(d.processId) : null;
  let status = '';
  if (!d.completed) {
    if (days < 0) status = `<span class="deadline-status urgent">VENCIDO HÁ ${-days}D</span>`;
    else if (days === 0) status = `<span class="deadline-status urgent">HOJE</span>`;
    else if (days === 1) status = `<span class="deadline-status soon">AMANHÃ</span>`;
    else if (days <= 7) status = `<span class="deadline-status soon">EM ${days} DIAS</span>`;
    else status = `<span class="deadline-status future">EM ${days} DIAS</span>`;
  } else status = `<span class="badge badge-success">Cumprido</span>`;

  return `
    <div class="deadline-card ${urg}">
      <div class="deadline-date">
        <div class="deadline-day">${dt ? dt.getDate() : '–'}</div>
        <div class="deadline-month">${dt ? MONTHS_ABREV[dt.getMonth()] : ''}</div>
      </div>
      <div class="deadline-info">
        <div class="deadline-title">${escapeHtml(d.title)} ${d.type === 'processual' ? '<span class="badge badge-danger" style="margin-left:6px;">processual</span>' : '<span class="badge badge-warning" style="margin-left:6px;">interno</span>'}</div>
        <div class="deadline-meta">
          ${status}
          ${cli ? '· ' + escapeHtml(cli.name) : ''}
          ${proc ? '· proc. ' + escapeHtml(proc.number || '—') : ''}
          ${d.notes ? '· ' + escapeHtml(d.notes.substring(0, 60)) + (d.notes.length > 60 ? '…' : '') : ''}
        </div>
      </div>
      <div class="deadline-actions">
        <button class="icon-btn" data-toggle="${d.id}" title="${d.completed ? 'Reabrir' : 'Marcar como cumprido'}">${d.completed ? '↺' : '✓'}</button>
        <button class="icon-btn" data-edit="${d.id}">✎</button>
        <button class="icon-btn danger" data-del="${d.id}">×</button>
      </div>
    </div>
  `;
}

function attachDeadlineHandlers(el) {
  el.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => { Deadlines.toggle(b.dataset.toggle); render(); });
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => deadlineForm(b.dataset.edit));
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirmAction('Excluir este prazo?', () => { Deadlines.delete(b.dataset.del); toast('Prazo excluído', 'success'); render(); }));
}

function deadlineForm(id, ctx) {
  const d = id ? Deadlines.find(id) : { type: 'processual', clientId: (ctx && ctx.clientId) || '', processId: (ctx && ctx.processId) || '' };
  if (id && !d) return;
  const clients = Clients.all().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const allProcs = Processes.all();
  openModal(id ? 'Editar prazo' : 'Novo prazo', `
    <form id="deadlineFormEl">
      <div class="form-group">
        <label class="form-label">Título / Descrição *</label>
        <input class="form-input" name="title" value="${escapeHtml(d.title || '')}" placeholder="ex: Apresentar contestação" required autofocus>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data *</label>
          <input class="form-input" type="date" name="date" value="${d.date || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-select" name="type">
            ${DEADLINE_TYPES.map(t => `<option value="${t.v}" ${d.type === t.v ? 'selected' : ''}>${t.l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cliente</label>
          <select class="form-select" name="clientId" id="dlClient">
            <option value="">—</option>
            ${clients.map(c => `<option value="${c.id}" ${d.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Processo</label>
          <select class="form-select" name="processId" id="dlProcess">
            <option value="">—</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Observações</label>
        <textarea class="form-textarea" name="notes" rows="2">${escapeHtml(d.notes || '')}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="cancelBtn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${id ? 'Salvar' : 'Criar prazo'}</button>
      </div>
    </form>
  `, () => {
    document.getElementById('cancelBtn').onclick = closeModal;
    const cliSel = document.getElementById('dlClient');
    const procSel = document.getElementById('dlProcess');
    function refreshProc() {
      const cid = cliSel.value;
      const filtered = cid ? allProcs.filter(p => p.clientId === cid) : allProcs;
      procSel.innerHTML = '<option value="">—</option>' + filtered.map(p => `<option value="${p.id}" ${d.processId === p.id ? 'selected' : ''}>${escapeHtml(p.number || 'Sem número')}</option>`).join('');
    }
    cliSel.onchange = refreshProc;
    refreshProc();

    document.getElementById('deadlineFormEl').onsubmit = e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      Deadlines.save({ ...d, ...fd });
      closeModal();
      toast(id ? 'Prazo atualizado' : 'Prazo criado', 'success');
      render();
    };
  });
}

/* ===== CALENDÁRIO ===== */
function renderCalendar(el) {
  const { month, year } = state.calendar;
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today();

  const tasks = Tasks.all().filter(t => !t.completed && t.dueDate);
  const deadlines = Deadlines.all().filter(d => !d.completed && d.date);

  const byDate = {};
  tasks.forEach(t => { (byDate[t.dueDate] = byDate[t.dueDate] || []).push({ type: 'task', label: t.title, ref: t }); });
  deadlines.forEach(d => { (byDate[d.date] = byDate[d.date] || []).push({ type: d.type || 'processual', label: d.title, ref: d }); });

  const cells = [];
  for (let i = 0; i < startDay; i++) {
    const prev = new Date(year, month, -startDay + i + 1);
    cells.push({ date: prev, other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), other: false });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), other: true });
    if (cells.length >= 42) break;
  }

  el.innerHTML = `
    <div class="calendar">
      <div class="calendar-header">
        <div class="calendar-month-name">${MONTHS_PT[month]} de ${year}</div>
        <div class="calendar-nav">
          <button class="btn btn-ghost btn-sm" id="prevMonth">‹ Anterior</button>
          <button class="btn btn-ghost btn-sm" id="todayBtn">Hoje</button>
          <button class="btn btn-ghost btn-sm" id="nextMonth">Próximo ›</button>
        </div>
      </div>
      <div class="calendar-grid">
        ${DAYNAMES_PT.map(d => `<div class="calendar-dayname">${d}</div>`).join('')}
        ${cells.map(c => {
          const iso = c.date.toISOString().split('T')[0];
          const events = byDate[iso] || [];
          return `
            <div class="calendar-day ${c.other ? 'other-month' : ''} ${iso === todayStr ? 'today' : ''}" data-date="${iso}">
              <span class="calendar-date">${c.date.getDate()}</span>
              ${events.slice(0, 3).map(ev => `<div class="calendar-event ${ev.type}" title="${escapeHtml(ev.label)}">${escapeHtml(ev.label)}</div>`).join('')}
              ${events.length > 3 ? `<div class="calendar-event" style="background:var(--beige);color:var(--text-medium);">+${events.length - 3} mais</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
      <div style="display:flex;gap:18px;margin-top:14px;font-size:12px;color:var(--text-light);">
        <span><span class="calendar-event processual" style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:4px;"></span>Prazo processual</span>
        <span><span class="calendar-event interno" style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:4px;"></span>Prazo interno</span>
        <span><span class="calendar-event task" style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:4px;"></span>Tarefa</span>
      </div>
    </div>
  `;

  document.getElementById('prevMonth').onclick = () => {
    state.calendar.month--;
    if (state.calendar.month < 0) { state.calendar.month = 11; state.calendar.year--; }
    render();
  };
  document.getElementById('nextMonth').onclick = () => {
    state.calendar.month++;
    if (state.calendar.month > 11) { state.calendar.month = 0; state.calendar.year++; }
    render();
  };
  document.getElementById('todayBtn').onclick = () => {
    state.calendar = { month: new Date().getMonth(), year: new Date().getFullYear() };
    render();
  };
  el.querySelectorAll('.calendar-day').forEach(d => d.onclick = () => {
    const date = d.dataset.date;
    const events = byDate[date] || [];
    if (events.length === 0) {
      if (confirm('Criar um novo prazo nesta data?')) {
        deadlineForm();
        setTimeout(() => { const inp = document.querySelector('input[name="date"]'); if (inp) inp.value = date; }, 50);
      }
    } else {
      dayDetailModal(date, events);
    }
  });
}

function dayDetailModal(date, events) {
  openModal(formatDateLong(date), `
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${events.map(ev => {
        const r = ev.ref;
        const cli = r.clientId ? Clients.find(r.clientId) : null;
        const proc = r.processId ? Processes.find(r.processId) : null;
        return `
          <div style="padding:14px 16px;background:var(--cream);border-radius:6px;border-left:3px solid var(--${ev.type === 'processual' ? 'red' : ev.type === 'interno' ? 'gold' : 'moss-medium'});">
            <div style="font-weight:500;margin-bottom:4px;">${escapeHtml(ev.label)}</div>
            <div style="font-size:12px;color:var(--text-light);">
              ${ev.type === 'task' ? 'Tarefa' : ev.type === 'processual' ? 'Prazo processual' : 'Prazo interno'}
              ${cli ? '· ' + escapeHtml(cli.name) : ''}
              ${proc ? '· proc. ' + escapeHtml(proc.number || '—') : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" id="closeDayModal">Fechar</button>
      <button class="btn btn-primary" id="addOnDay">+ Novo prazo nesta data</button>
    </div>
  `, () => {
    document.getElementById('closeDayModal').onclick = closeModal;
    document.getElementById('addOnDay').onclick = () => {
      closeModal();
      deadlineForm();
      setTimeout(() => { const inp = document.querySelector('input[name="date"]'); if (inp) inp.value = date; }, 50);
    };
  });
}

/* ============================================================
   EXPORT / IMPORT
   ============================================================ */
async function exportData() {
  const files = await DocDB.exportAll();
  const data = {
    exportedAt: new Date().toISOString(),
    version: 2,
    clients: Clients.all(),
    processes: Processes.all(),
    documents: Documents.all(),
    tasks: Tasks.all(),
    deadlines: Deadlines.all(),
    financeiro: Financeiro.all(),
    docFiles: files
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pivanti-backup-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Backup exportado', 'success');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!confirm('Importar este backup vai SUBSTITUIR todos os dados atuais. Continuar?')) return;
      if (data.clients) persist(KEYS.clients, data.clients);
      if (data.processes) persist(KEYS.processes, data.processes);
      if (data.documents) persist(KEYS.documents, data.documents);
      if (data.tasks) persist(KEYS.tasks, data.tasks);
      if (data.deadlines) persist(KEYS.deadlines, data.deadlines);
      if (data.financeiro) localStorage.setItem(KEYS_FIN, JSON.stringify(data.financeiro));
      // Restaura arquivos no IndexedDB (versão 2+) ou migra data inline legado (versão 1)
      if (data.docFiles && data.docFiles.length) {
        await DocDB.importAll(data.docFiles);
      } else if (data.documents) {
        // Migração: mover campo 'data' inline para IndexedDB
        const toMigrate = data.documents.filter(d => d.data);
        for (const d of toMigrate) {
          await DocDB.saveFile(d.id, d.data);
        }
        // Limpa campo 'data' do localStorage
        const clean = data.documents.map(({ data: _d, ...rest }) => rest);
        persist(KEYS.documents, clean);
      }
      toast('Backup importado com sucesso', 'success');
      navigate('dashboard');
    } catch (err) {
      alert('Arquivo inválido: ' + err.message);
    }
  };
  reader.readAsText(file);
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.addEventListener('click', () => navigate(n.dataset.route));
  });
  document.getElementById('modalClose').onclick = closeModal;
  document.getElementById('modalOverlay').onclick = e => { if (e.target.id === 'modalOverlay') closeModal(); };

  document.getElementById('btnNew').onclick = () => {
    switch (state.route) {
      case 'clientes': clientForm(); break;
      case 'processos': processForm(); break;
      case 'documentos': {
        const ctx = {};
        if (state.docClientId && state.docClientId !== '_none') ctx.clientId = state.docClientId;
        if (state.docFolder) ctx.type = state.docFolder;
        documentForm(null, ctx);
        break;
      }
      case 'tarefas': taskForm(); break;
      case 'prazos': deadlineForm(); break;
      case 'financeiro': finForm(); break;
    }
  };

  const search = document.getElementById('globalSearch');
  let searchTimer;
  search.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.search = search.value; render(); }, 200);
  };

  document.getElementById('btnExport').onclick = exportData;
  document.getElementById('btnImport').onclick = () => document.getElementById('fileImport').click();
  document.getElementById('fileImport').onchange = e => { if (e.target.files[0]) importData(e.target.files[0]); };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  render();
});

/* ============================================================
   FINANCEIRO
   ============================================================ */

const KEYS_FIN = 'pivanti_financeiro';

const Financeiro = {
  all: () => { try { return JSON.parse(localStorage.getItem(KEYS_FIN) || '[]'); } catch(e){ return []; } },
  find: id => Financeiro.all().find(f => f.id === id),
  forClient: cid => Financeiro.all().filter(f => f.clientId === cid),
  save(item) {
    const list = Financeiro.all();
    if (item.id) {
      const i = list.findIndex(f => f.id === item.id);
      if (i >= 0) list[i] = { ...list[i], ...item, updatedAt: new Date().toISOString() };
    } else {
      item.id = uid();
      item.createdAt = new Date().toISOString();
      list.push(item);
    }
    localStorage.setItem(KEYS_FIN, JSON.stringify(list));
    return item;
  },
  delete(id) { localStorage.setItem(KEYS_FIN, JSON.stringify(Financeiro.all().filter(f => f.id !== id))); },
  marcarParcela(finId, parcelaIdx, pago) {
    const list = Financeiro.all();
    const f = list.find(x => x.id === finId);
    if (!f || !f.parcelas) return;
    f.parcelas[parcelaIdx].pago = pago;
    f.parcelas[parcelaIdx].dataPagamento = pago ? today() : null;
    localStorage.setItem(KEYS_FIN, JSON.stringify(list));
  }
};

function statusParcela(p) {
  if (p.pago) return 'pago';
  const d = daysUntil(p.vencimento);
  if (d === null) return 'pendente';
  if (d < 0) return 'atrasado';
  if (d <= 5) return 'vence-breve';
  return 'pendente';
}

function gerarParcelas(total, qtd, primeiroVenc) {
  const valorParcela = Math.round((total / qtd) * 100) / 100;
  const parcelas = [];
  for (let i = 0; i < qtd; i++) {
    const d = new Date(primeiroVenc + 'T00:00:00');
    d.setMonth(d.getMonth() + i);
    const iso = d.toISOString().split('T')[0];
    parcelas.push({ vencimento: iso, valor: valorParcela, pago: false, dataPagamento: null });
  }
  return parcelas;
}

// IDs dos cards expandidos (persiste enquanto a página está aberta)
const finExpandidos = new Set();

function attachFinHandlers(el) {
  // Accordion toggle
  el.querySelectorAll('[data-toggle-fin]').forEach(btn => {
    btn.onclick = e => {
      // Não dispara se clicou num botão de ação dentro do header
      if (e.target.closest('[data-fin-edit],[data-fin-del]')) return;
      const id = btn.dataset.toggleFin;
      const card = el.querySelector(`[data-fin-id="${id}"]`);
      if (!card) return;
      const wrapper = card.querySelector('.fin-parcelas-wrapper');
      const chevron = card.querySelector('.fin-chevron');
      if (!wrapper) return;
      const aberto = wrapper.style.display !== 'none';
      if (aberto) { wrapper.style.display = 'none'; chevron.textContent = '▼'; finExpandidos.delete(id); }
      else { wrapper.style.display = ''; chevron.textContent = '▲'; finExpandidos.add(id); }
    };
  });

  el.querySelectorAll('[data-fin-edit]').forEach(b => b.onclick = e => { e.stopPropagation(); finForm(b.dataset.finEdit); });
  el.querySelectorAll('[data-fin-del]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    confirmAction('Excluir este honorário?', () => { Financeiro.delete(b.dataset.finDel); toast('Honorário excluído', 'success'); render(); });
  });
  el.querySelectorAll('[data-pagar]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const [finId, idx] = b.dataset.pagar.split(':');
    finExpandidos.add(finId);
    Financeiro.marcarParcela(finId, Number(idx), true);
    toast('Parcela marcada como paga ✓', 'success');
    render();
  });
  el.querySelectorAll('[data-despagar]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const [finId, idx] = b.dataset.despagar.split(':');
    finExpandidos.add(finId);
    Financeiro.marcarParcela(finId, Number(idx), false);
    render();
  });
  el.querySelectorAll('[data-pagar-unico]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const list2 = Financeiro.all();
    const f = list2.find(x => x.id === b.dataset.pagarUnico);
    if (!f) return;
    f.pago = true; f.dataPagamento = today();
    localStorage.setItem(KEYS_FIN, JSON.stringify(list2));
    toast('Pagamento registrado ✓', 'success');
    render();
  });
  el.querySelectorAll('[data-despagar-unico]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const list2 = Financeiro.all();
    const f = list2.find(x => x.id === b.dataset.despagarUnico);
    if (!f) return;
    f.pago = false; f.dataPagamento = null;
    localStorage.setItem(KEYS_FIN, JSON.stringify(list2));
    render();
  });
}

function renderFinanceiro(el) {
  const q = state.search.toLowerCase();
  let list = Financeiro.all();
  if (q) {
    list = list.filter(f => {
      const cli = f.clientId ? Clients.find(f.clientId) : null;
      return (f.descricao || '').toLowerCase().includes(q) ||
        (cli && cli.name.toLowerCase().includes(q));
    });
  }

  const statusFiltro = state.filter.finStatus || 'todos';
  if (statusFiltro === 'atrasado') {
    list = list.filter(f => {
      if (f.tipo === 'parcelado') return f.parcelas.some(p => !p.pago && daysUntil(p.vencimento) < 0);
      return !f.pago && f.vencimento && daysUntil(f.vencimento) < 0;
    });
  } else if (statusFiltro === 'pendente') {
    list = list.filter(f => {
      if (f.tipo === 'parcelado') return f.parcelas.some(p => !p.pago);
      return !f.pago;
    });
  } else if (statusFiltro === 'quitado') {
    list = list.filter(f => {
      if (f.tipo === 'parcelado') return f.parcelas.every(p => p.pago);
      return f.pago;
    });
  }

  // Ordena: atrasados primeiro, depois por criação
  list.sort((a, b) => {
    const aAtras = a.tipo === 'parcelado' ? a.parcelas.some(p => !p.pago && daysUntil(p.vencimento) < 0) : (!a.pago && a.vencimento && daysUntil(a.vencimento) < 0);
    const bAtras = b.tipo === 'parcelado' ? b.parcelas.some(p => !p.pago && daysUntil(p.vencimento) < 0) : (!b.pago && b.vencimento && daysUntil(b.vencimento) < 0);
    if (aAtras !== bAtras) return aAtras ? -1 : 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const todos = Financeiro.all();
  let totalReceber = 0, totalRecebido = 0, totalAtrasado = 0;
  todos.forEach(f => {
    if (f.tipo === 'parcelado') {
      f.parcelas.forEach(p => {
        if (p.pago) totalRecebido += p.valor;
        else { totalReceber += p.valor; if (daysUntil(p.vencimento) < 0) totalAtrasado += p.valor; }
      });
    } else {
      if (f.pago) totalRecebido += Number(f.valorTotal || 0);
      else { totalReceber += Number(f.valorTotal || 0); if (f.vencimento && daysUntil(f.vencimento) < 0) totalAtrasado += Number(f.valorTotal || 0); }
    }
  });

  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:20px;">
      <div class="stat-card success">
        <div class="stat-label">Total recebido</div>
        <div class="stat-value" style="font-size:22px;">${formatBRL(totalRecebido)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">A receber</div>
        <div class="stat-value" style="font-size:22px;">${formatBRL(totalReceber)}</div>
      </div>
      <div class="stat-card ${totalAtrasado > 0 ? 'danger' : 'gold'}">
        <div class="stat-label">Atrasado</div>
        <div class="stat-value" style="font-size:22px;">${formatBRL(totalAtrasado)}</div>
      </div>
    </div>

    <div class="filter-bar">
      <span class="filter-chip ${statusFiltro === 'todos' ? 'active' : ''}" data-finstatus="todos">Todos</span>
      <span class="filter-chip ${statusFiltro === 'pendente' ? 'active' : ''}" data-finstatus="pendente">Pendentes</span>
      <span class="filter-chip ${statusFiltro === 'atrasado' ? 'active' : ''}" data-finstatus="atrasado">⚠ Atrasados</span>
      <span class="filter-chip ${statusFiltro === 'quitado' ? 'active' : ''}" data-finstatus="quitado">Quitados</span>
    </div>

    ${list.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">$</div>
        <div class="empty-state-title">Nenhum honorário cadastrado</div>
        <div class="empty-state-text">Cadastre o primeiro honorário para começar a controlar os pagamentos dos clientes.</div>
        <button class="btn btn-primary" id="emptyNewFin">+ Cadastrar honorário</button>
      </div>
    ` : `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${list.map(f => finCardHtml(f, finExpandidos.has(f.id))).join('')}
      </div>
    `}
  `;

  el.querySelectorAll('[data-finstatus]').forEach(c => c.onclick = () => { state.filter.finStatus = c.dataset.finstatus; render(); });
  const ne = el.querySelector('#emptyNewFin'); if (ne) ne.onclick = () => finForm();
  attachFinHandlers(el);
}

function parcelaBadge(p, days) {
  if (p.pago) return `<span class="badge badge-success">✓ Pago ${p.dataPagamento ? formatDate(p.dataPagamento) : ''}</span>`;
  if (days < 0) return `<span class="badge badge-danger">Atrasado ${-days}d</span>`;
  if (days <= 5) return `<span class="badge badge-warning">Vence em ${days}d</span>`;
  return `<span class="badge badge-neutral">Pendente</span>`;
}

function finCardHtml(f, expandido) {
  const cli = f.clientId ? Clients.find(f.clientId) : null;
  const proc = f.processId ? Processes.find(f.processId) : null;
  const isOpen = expandido;

  if (f.tipo === 'parcelado') {
    const total = f.parcelas.reduce((s, p) => s + p.valor, 0);
    const pagas = f.parcelas.filter(p => p.pago).length;
    const atrasadas = f.parcelas.filter(p => !p.pago && daysUntil(p.vencimento) < 0).length;
    const proxima = f.parcelas.find(p => !p.pago);
    const progresso = Math.round((pagas / f.parcelas.length) * 100);
    const quitado = pagas === f.parcelas.length;

    // Próximo vencimento para mostrar no header recolhido
    let proximaInfo = '';
    if (!quitado && proxima) {
      const d = daysUntil(proxima.vencimento);
      if (d < 0) proximaInfo = `<span class="badge badge-danger" style="font-size:11px;">⚠ Próx. atrasada</span>`;
      else if (d <= 7) proximaInfo = `<span class="badge badge-warning" style="font-size:11px;">Próx. vence ${formatDate(proxima.vencimento)}</span>`;
      else proximaInfo = `<span style="font-size:12px;color:var(--text-light);">Próx. venc. ${formatDate(proxima.vencimento)}</span>`;
    }

    return `
      <div class="fin-card ${quitado ? 'fin-quitado' : atrasadas > 0 ? 'fin-atrasado' : ''}" data-fin-id="${f.id}">
        <div class="fin-card-header fin-accordion-trigger" data-toggle-fin="${f.id}" style="cursor:pointer;">
          <div class="fin-card-left">
            <div class="fin-title">
              ${escapeHtml(f.descricao || 'Honorários')}
              ${quitado ? '<span class="badge badge-success">Quitado</span>' : ''}
              ${atrasadas > 0 ? `<span class="badge badge-danger">⚠ ${atrasadas} atrasada${atrasadas>1?'s':''}</span>` : ''}
            </div>
            <div class="fin-meta">
              ${cli ? `<span>◐ ${escapeHtml(cli.name)}</span>` : ''}
              ${proc ? `<span>▣ ${escapeHtml(proc.number || '—')}</span>` : ''}
              <span>${pagas}/${f.parcelas.length} pagas · ${formatBRL(total)}</span>
              ${proximaInfo}
            </div>
            <div class="fin-progress-bar" style="margin-top:8px;"><div class="fin-progress-fill" style="width:${progresso}%"></div></div>
          </div>
          <div class="fin-card-actions" style="align-items:flex-start;">
            <span class="fin-chevron">${isOpen ? '▲' : '▼'}</span>
            <button class="icon-btn" data-fin-edit="${f.id}" title="Editar">✎</button>
            <button class="icon-btn danger" data-fin-del="${f.id}" title="Excluir">×</button>
          </div>
        </div>
        <div class="fin-parcelas-wrapper" style="${isOpen ? '' : 'display:none;'}">
          <div class="fin-parcelas">
            ${f.parcelas.map((p, i) => {
              const days = daysUntil(p.vencimento);
              const st = statusParcela(p);
              return `
                <div class="fin-parcela fin-parcela-${st}">
                  <div class="fin-parcela-num">${i+1}ª</div>
                  <div class="fin-parcela-info">
                    <span class="fin-parcela-valor">${formatBRL(p.valor)}</span>
                    <span class="fin-parcela-venc">Venc. ${formatDate(p.vencimento)}</span>
                    ${parcelaBadge(p, days)}
                  </div>
                  <div class="fin-parcela-action">
                    ${p.pago
                      ? `<button class="btn btn-ghost btn-sm" data-despagar="${f.id}:${i}">↺ Desfazer</button>`
                      : `<button class="btn btn-primary btn-sm" data-pagar="${f.id}:${i}">✓ Pago</button>`
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  } else {
    const days = daysUntil(f.vencimento);
    let statusBadge = '';
    if (f.pago) statusBadge = `<span class="badge badge-success">✓ Pago em ${formatDate(f.dataPagamento)}</span>`;
    else if (days < 0) statusBadge = `<span class="badge badge-danger">⚠ Atrasado há ${-days}d</span>`;
    else if (days <= 5) statusBadge = `<span class="badge badge-warning">Vence em ${days}d</span>`;
    else statusBadge = `<span class="badge badge-neutral">Venc. ${formatDate(f.vencimento)}</span>`;

    return `
      <div class="fin-card ${f.pago ? 'fin-quitado' : days !== null && days < 0 ? 'fin-atrasado' : ''}">
        <div class="fin-card-header">
          <div class="fin-card-left">
            <div class="fin-title">
              ${escapeHtml(f.descricao || 'Honorários')}
              ${statusBadge}
            </div>
            <div class="fin-meta">
              ${cli ? `<span>◐ ${escapeHtml(cli.name)}</span>` : ''}
              ${proc ? `<span>▣ ${escapeHtml(proc.number || '—')}</span>` : ''}
              <span style="font-weight:600;color:var(--moss-dark);">${formatBRL(f.valorTotal)}</span>
            </div>
          </div>
          <div class="fin-card-actions">
            ${f.pago
              ? `<button class="btn btn-ghost btn-sm" data-despagar-unico="${f.id}">↺ Desfazer</button>`
              : `<button class="btn btn-primary btn-sm" data-pagar-unico="${f.id}">✓ Marcar como pago</button>`
            }
            <button class="icon-btn" data-fin-edit="${f.id}" title="Editar">✎</button>
            <button class="icon-btn danger" data-fin-del="${f.id}" title="Excluir">×</button>
          </div>
        </div>
      </div>
    `;
  }
}

function renderFinanceiroIn(el, registros, ctx) {
  const atrasados = registros.filter(f => {
    if (f.tipo === 'parcelado') return f.parcelas.some(p => !p.pago && daysUntil(p.vencimento) < 0);
    return !f.pago && f.vencimento && daysUntil(f.vencimento) < 0;
  }).length;

  el.innerHTML = `
    <div class="section-title">
      Financeiro
      ${atrasados > 0 ? `<span class="badge badge-danger" style="margin-right:auto;">⚠ ${atrasados} em atraso</span>` : ''}
      <button class="btn btn-primary btn-sm" id="addFinLocal">+ Novo honorário</button>
    </div>
    ${registros.length === 0 ? `
      <div class="empty-state"><div class="empty-state-icon">$</div><div class="empty-state-title">Sem honorários cadastrados</div><div class="empty-state-text">Cadastre os honorários deste cliente.</div></div>
    ` : `<div style="display:flex;flex-direction:column;gap:8px;">${registros.map(f => finCardHtml(f, finExpandidos.has(f.id))).join('')}</div>`}
  `;
  el.querySelector('#addFinLocal').onclick = () => finForm(null, ctx);
  attachFinHandlers(el);
}

function finForm(id, ctx) {
  const f = id ? Financeiro.find(id) : { tipo: 'unico', clientId: (ctx && ctx.clientId) || '', processId: (ctx && ctx.processId) || '' };
  if (id && !f) return;
  const clients = Clients.all().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const allProcs = Processes.all();

  openModal(id ? 'Editar honorário' : 'Novo honorário', `
    <form id="finFormEl">
      <div class="form-group">
        <label class="form-label">Descrição *</label>
        <input class="form-input" name="descricao" value="${escapeHtml(f.descricao || '')}" placeholder="ex: Honorários – Ação Trabalhista" required autofocus>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cliente *</label>
          <select class="form-select" name="clientId" id="finClient" required>
            <option value="">— selecione —</option>
            ${clients.map(c => `<option value="${c.id}" ${f.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Processo (opcional)</label>
          <select class="form-select" name="processId" id="finProcess">
            <option value="">—</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de cobrança</label>
        <div style="display:flex;gap:12px;margin-top:4px;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="radio" name="tipo" value="unico" ${(f.tipo||'unico')==='unico'?'checked':''} id="tipoUnico"> Valor único
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="radio" name="tipo" value="parcelado" ${f.tipo==='parcelado'?'checked':''} id="tipoParcelado"> Parcelado
          </label>
        </div>
      </div>
      <div id="camposUnico" style="${f.tipo==='parcelado'?'display:none':''}">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Valor total (R$) *</label>
            <input class="form-input" type="number" step="0.01" name="valorTotal" value="${f.valorTotal || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Data de vencimento *</label>
            <input class="form-input" type="date" name="vencimento" value="${f.vencimento || ''}">
          </div>
        </div>
      </div>
      <div id="camposParcelado" style="${f.tipo!=='parcelado'?'display:none':''}">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Valor total (R$) *</label>
            <input class="form-input" type="number" step="0.01" name="valorTotalParc" value="${f.valorTotal || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Número de parcelas *</label>
            <input class="form-input" type="number" min="2" max="120" name="numParcelas" value="${f.parcelas ? f.parcelas.length : 2}" id="numParcelasInput">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Vencimento da 1ª parcela *</label>
          <input class="form-input" type="date" name="primeiroVenc" value="${f.parcelas ? f.parcelas[0]?.vencimento || '' : ''}">
        </div>
        <div class="form-help" style="margin-bottom:12px;">As parcelas seguintes vencerão mensalmente a partir da data informada.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Observações</label>
        <textarea class="form-textarea" name="observacoes" rows="2">${escapeHtml(f.observacoes || '')}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="cancelBtn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${id ? 'Salvar alterações' : 'Cadastrar'}</button>
      </div>
    </form>
  `, () => {
    document.getElementById('cancelBtn').onclick = closeModal;
    const cliSel = document.getElementById('finClient');
    const procSel = document.getElementById('finProcess');
    function refreshProc() {
      const cid = cliSel.value;
      const filtered = cid ? allProcs.filter(p => p.clientId === cid) : allProcs;
      procSel.innerHTML = '<option value="">—</option>' + filtered.map(p => `<option value="${p.id}" ${f.processId === p.id ? 'selected' : ''}>${escapeHtml(p.number || 'Sem número')}</option>`).join('');
    }
    cliSel.onchange = refreshProc;
    refreshProc();

    document.getElementById('tipoUnico').onchange = () => {
      document.getElementById('camposUnico').style.display = '';
      document.getElementById('camposParcelado').style.display = 'none';
    };
    document.getElementById('tipoParcelado').onchange = () => {
      document.getElementById('camposUnico').style.display = 'none';
      document.getElementById('camposParcelado').style.display = '';
    };

    document.getElementById('finFormEl').onsubmit = e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      if (!fd.clientId) { alert('Selecione um cliente.'); return; }

      let item = { ...f, descricao: fd.descricao, clientId: fd.clientId, processId: fd.processId, tipo: fd.tipo, observacoes: fd.observacoes };

      if (fd.tipo === 'parcelado') {
        if (!fd.valorTotalParc || !fd.numParcelas || !fd.primeiroVenc) { alert('Preencha valor, número de parcelas e vencimento da 1ª parcela.'); return; }
        item.valorTotal = Number(fd.valorTotalParc);
        // Se editando, preserva status de pagamento
        if (id && f.parcelas && f.parcelas.length === Number(fd.numParcelas)) {
          // Apenas atualiza vencimentos se mudou o total/qtd
          item.parcelas = f.parcelas;
        } else {
          item.parcelas = gerarParcelas(Number(fd.valorTotalParc), Number(fd.numParcelas), fd.primeiroVenc);
        }
      } else {
        if (!fd.valorTotal) { alert('Preencha o valor total.'); return; }
        item.valorTotal = Number(fd.valorTotal);
        item.vencimento = fd.vencimento;
        if (!id) { item.pago = false; item.dataPagamento = null; }
      }

      Financeiro.save(item);
      closeModal();
      toast(id ? 'Honorário atualizado' : 'Honorário cadastrado', 'success');
      render();
    };
  });
}
