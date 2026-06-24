// ============================================================
// FARMAPOCKET v2 - Main Application Logic
// With Dependents Support
// ============================================================

// ========== STATE ==========
const AppState = {
    currentDependent: null,  // ID do dependente selecionado
    dependents: [],          // Lista de dependentes

    setCurrentDependent(id) {
        this.currentDependent = id;
        localStorage.setItem('farma-pocket-current-dependent', id);
    },

    getCurrentDependent() {
        return this.currentDependent || localStorage.getItem('farma-pocket-current-dependent');
    },

    clearCurrentDependent() {
        this.currentDependent = null;
        localStorage.removeItem('farma-pocket-current-dependent');
    }
};

// ========== NAVEGAÇÃO ==========

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
    });

    if (page === 'dashboard') loadDashboard();
    if (page === 'medications') loadMedications();
    if (page === 'treatments') loadTreatments();
    if (page === 'professionals') loadProfessionals();

    window.scrollTo(0, 0);
}

// ========== DEPENDENT SELECTOR ==========

async function loadDependents() {
    try {
        AppState.dependents = await DB.getDependents();
        renderDependentSelector();
    } catch (error) {
        console.error('Error loading dependents:', error);
    }
}

// Renderiza o avatar de um dependente (URL de imagem ou emoji/texto)
function renderDependentAvatar(avatarUrl) {
    if (!avatarUrl) {
        return '<span class="text-lg">👤</span>';
    }
    // Se for uma URL, renderiza como imagem
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
        return `<img src="${avatarUrl}" alt="" class="w-6 h-6 rounded-full object-cover">`;
    }
    // Caso contrário, trata como emoji/texto
    return `<span class="text-lg">${avatarUrl}</span>`;
}

function renderDependentSelector() {
    const selector = document.getElementById('dependent-selector');
    if (!selector) return;

    if (AppState.dependents.length === 0) {
        selector.innerHTML = `
            <div class="text-center py-4">
                <p class="text-gray-500 text-sm">Nenhum dependente cadastrado</p>
                <button onclick="showAddDependent()" class="mt-2 text-sky-600 text-sm font-medium">+ Adicionar dependente</button>
            </div>
        `;
        return;
    }

    const currentId = AppState.getCurrentDependent();

    // Se não tem dependente selecionado, seleciona o primeiro
    if (!currentId && AppState.dependents.length > 0) {
        AppState.setCurrentDependent(AppState.dependents[0].id);
    }

    selector.innerHTML = `
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            ${AppState.dependents.map(dep => `
                <button 
                    onclick="selectDependent('${dep.id}')"
                    class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                        AppState.getCurrentDependent() === dep.id 
                            ? 'border-sky-500 bg-sky-50 text-sky-700' 
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }"
                >
                    ${renderDependentAvatar(dep.avatar_url)}
                    <span class="font-medium text-sm whitespace-nowrap">${dep.name}</span>
                </button>
            `).join('')}
            <button onclick="showAddDependent()" class="flex-shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-sky-400 hover:text-sky-500 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
        </div>
    `;
}

function selectDependent(id) {
    AppState.setCurrentDependent(id);
    renderDependentSelector();

    // Recarregar página atual
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageId = activePage.id.replace('page-', '');
        if (pageId === 'dashboard') loadDashboard();
        if (pageId === 'medications') loadMedications();
        if (pageId === 'treatments') loadTreatments();
        if (pageId === 'professionals') loadProfessionals();
    }
}

function showAddDependent() {
    document.getElementById('modal-dependent').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// ========== DASHBOARD ==========

async function loadDashboard() {
    try {
        // Stats
        const stats = await DB.getDashboardStats();
        document.getElementById('stat-dependents').textContent = stats.dependents;
        document.getElementById('stat-medications').textContent = stats.medications;
        document.getElementById('stat-treatments').textContent = stats.treatments;

        // Data de hoje
        const today = new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'short' 
        });
        document.getElementById('today-date').textContent = today;

        // Low stock alerts
        const lowStock = await DB.getLowStockAlerts();
        const lowStockEl = document.getElementById('low-stock-list');
        if (lowStock.length > 0) {
            lowStockEl.innerHTML = lowStock.map(item => `
                <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                        <p class="font-medium text-gray-800">${item.medication_name}</p>
                        <p class="text-xs text-gray-500">${item.dependent_name}</p>
                        <p class="text-xs text-amber-600">${item.days_remaining} dias restantes</p>
                    </div>
                    <span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Estoque Baixo</span>
                </div>
            `).join('');
        } else {
            lowStockEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Nenhum alerta no momento</p>';
        }

        // Expiring prescriptions
        const expiring = await DB.getExpiringPrescriptions();
        const expiringEl = document.getElementById('expiring-prescriptions');
        if (expiring.length > 0) {
            expiringEl.innerHTML = expiring.map(item => `
                <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                        <p class="font-medium text-gray-800">${item.medication_name}</p>
                        <p class="text-xs text-gray-500">${item.dependent_name}</p>
                        <p class="text-xs text-red-600">Vence em ${new Date(item.expiration_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Vencendo</span>
                </div>
            `).join('');
        } else {
            expiringEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Nenhum receituário próximo do vencimento</p>';
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ========== MEDICATIONS ==========

async function loadMedications() {
    const listEl = document.getElementById('medications-list');
    const depId = AppState.getCurrentDependent();

    if (!depId) {
        listEl.innerHTML = `
            <div class="text-center py-8">
                <span class="text-4xl mb-2 block">👤</span>
                <p class="text-gray-500">Selecione um dependente primeiro</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = '<div class="skeleton h-20 rounded-xl"></div>'.repeat(3);

    try {
        const medications = await DB.getMedications(depId);

        if (medications.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl mb-2 block">💊</span>
                    <p class="text-gray-400" data-i18n="common.noData">Nenhum dado encontrado</p>
                    <p class="text-sm text-gray-400 mt-1">Adicione o primeiro medicamento</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = medications.map(med => `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover" onclick="showMedicationDetail('${med.id}')">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800">${med.name}</h3>
                        <p class="text-sm text-gray-500">${med.active_ingredient || 'Sem princípio ativo'}</p>
                        <div class="flex items-center gap-2 mt-2">
                            ${med.is_controlled ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Controlado</span>' : ''}
                            ${med.is_continuous_use ? '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Uso Contínuo</span>' : ''}
                            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${med.stock_quantity || 0} un</span>
                        </div>
                    </div>
                    <button class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center" onclick="event.stopPropagation(); editMedication('${med.id}')">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading medications:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar medicamentos</p>';
    }
}

function showAddMedication() {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    document.getElementById('modal-medication').classList.remove('hidden');
}

function showMedicationDetail(id) {
    console.log('Show detail for medication:', id);
}

function editMedication(id) {
    console.log('Edit medication:', id);
}

// ========== TREATMENTS ==========

async function loadTreatments() {
    const listEl = document.getElementById('treatments-list');
    const depId = AppState.getCurrentDependent();

    if (!depId) {
        listEl.innerHTML = `
            <div class="text-center py-8">
                <span class="text-4xl mb-2 block">👤</span>
                <p class="text-gray-500">Selecione um dependente primeiro</p>
            </div>
        `;
        return;
    }

    try {
        const treatments = await DB.getTreatments(depId);

        if (treatments.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl mb-2 block">📋</span>
                    <p class="text-gray-400" data-i18n="common.noData">Nenhum dado encontrado</p>
                    <p class="text-sm text-gray-400 mt-1">Adicione o primeiro tratamento</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = treatments.map(t => `
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <h3 class="font-semibold text-gray-800">${t.medications?.name || 'Medicamento'}</h3>
                        <p class="text-sm text-gray-500">${t.treatment_goal || 'Sem objetivo definido'}</p>
                    </div>
                    ${t.is_active ? '<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Ativo</span>' : '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Encerrado</span>'}
                </div>
                <div class="flex items-center gap-4 text-xs text-gray-500 mt-3">
                    <span class="flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        ${t.dosage} un / ${t.frequency_hours}h
                    </span>
                    <span class="flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${new Date(t.start_date).toLocaleDateString('pt-BR')}
                    </span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading treatments:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar tratamentos</p>';
    }
}

function showAddTreatment() {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    alert('Modal de tratamento - em desenvolvimento');
}

// ========== PROFESSIONALS ==========

async function loadProfessionals() {
    const listEl = document.getElementById('professionals-list');
    const depId = AppState.getCurrentDependent();

    if (!depId) {
        listEl.innerHTML = `
            <div class="text-center py-8">
                <span class="text-4xl mb-2 block">👤</span>
                <p class="text-gray-500">Selecione um dependente primeiro</p>
            </div>
        `;
        return;
    }

    try {
        const professionals = await DB.getProfessionals(depId);

        if (professionals.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl mb-2 block">👨‍⚕️</span>
                    <p class="text-gray-400" data-i18n="common.noData">Nenhum dado encontrado</p>
                    <p class="text-sm text-gray-400 mt-1">Adicione o primeiro profissional</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = professionals.map(p => `
            <div class="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-2xl">
                    👨‍⚕️
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800">${p.name}</h3>
                    <p class="text-sm text-gray-500">${p.specialty || 'Especialidade não informada'}</p>
                    ${p.phone ? `<p class="text-xs text-gray-400 mt-1">📞 ${p.phone}</p>` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading professionals:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar profissionais</p>';
    }
}

function showAddProfessional() {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    alert('Modal de profissional - em desenvolvimento');
}

// ========== FORM HANDLERS ==========

document.addEventListener('DOMContentLoaded', () => {
    // Dependent form
    const depForm = document.getElementById('form-dependent');
    if (depForm) {
        depForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(depForm);
            const dependent = {
                name: formData.get('name'),
                date_of_birth: formData.get('date_of_birth') || null,
                relationship: formData.get('relationship') || null,
                notes: formData.get('notes') || null
            };

            try {
                const newDep = await DB.addDependent(dependent);
                closeModal('modal-dependent');
                depForm.reset();

                // Atualizar lista e selecionar o novo
                await loadDependents();
                selectDependent(newDep.id);

            } catch (error) {
                alert('Erro ao salvar: ' + error.message);
            }
        });
    }

    // Medication form
    const medForm = document.getElementById('form-medication');
    if (medForm) {
        medForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(medForm);
            const medication = {
                dependent_id: AppState.getCurrentDependent(),
                name: formData.get('name'),
                active_ingredient: formData.get('active_ingredient') || null,
                is_controlled: formData.has('is_controlled'),
                is_continuous_use: formData.has('is_continuous_use'),
                stock_quantity: parseInt(formData.get('stock_quantity')) || 0
            };

            try {
                await DB.addMedication(medication);
                closeModal('modal-medication');
                medForm.reset();
                loadMedications();
                loadDashboard();

            } catch (error) {
                alert('Erro ao salvar: ' + error.message);
            }
        });
    }

    // Settings language
    const settingsLang = document.getElementById('settings-lang');
    if (settingsLang) {
        settingsLang.value = i18n.getLanguage();
        settingsLang.addEventListener('change', (e) => {
            i18n.setLanguage(e.target.value);
        });
    }
});

// ========== EXPORT DATA ==========

async function exportData() {
    try {
        const dependents = await DB.getDependents();
        const data = {
            app: 'FarmaPocket',
            version: CONFIG.APP_VERSION,
            exportedAt: new Date().toISOString(),
            dependents
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `farma-pocket-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        alert('Erro ao exportar: ' + error.message);
    }
}

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
    Auth.init().then(() => {
        if (!Auth.isAuthenticated() && !window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
            return;
        }

        // Carregar dependentes primeiro
        loadDependents().then(() => {
            loadDashboard();
        });
    });
});

// Expor funções globais
window.AppState = AppState;
window.loadDashboard = loadDashboard;
window.navigateTo = navigateTo;
window.selectDependent = selectDependent;
window.showAddDependent = showAddDependent;
window.showAddMedication = showAddMedication;
window.closeModal = closeModal;
window.exportData = exportData;
