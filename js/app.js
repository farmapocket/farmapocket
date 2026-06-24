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
    openModal('modal-dependent');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        // Rolar o conteúdo do modal para o topo
        const content = modal.querySelector('.bg-white');
        if (content) {
            content.scrollTop = 0;
        }
        modal.scrollTop = 0;
    }
}

function scrollPageToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    openModal('modal-medication');
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

        listEl.innerHTML = treatments.map(t => {
            const specialty = t.healthcare_professionals?.specialty || t.prescribed_by_specialty || '';
            const prescribedByText = specialty ? `prescrito por ${specialty}` : '';
            const goalText = t.treatment_goal || '';
            const startDateText = t.start_date ? new Date(t.start_date).toLocaleDateString('pt-BR') : '';
            const durationText = formatTreatmentDuration(t.start_date, t.end_date);
            const subtitleParts = [
                `${t.dosage || 0}un. / ${t.frequency_hours || 0}h`,
                prescribedByText,
                goalText ? `para ${goalText}` : '',
                startDateText ? `em ${startDateText}` : '',
                durationText ? `- ${durationText} de tratamento` : ''
            ].filter(Boolean);

            return `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 pr-2">
                        <h3 class="font-semibold text-gray-800">${t.medications?.name || t.medication_name || 'Medicamento'}</h3>
                        <p class="text-sm text-gray-500">${subtitleParts.join(', ')}</p>
                    </div>
                    <div class="flex items-center gap-1">
                        ${t.is_active ? '<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Ativo</span>' : '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Encerrado</span>'}
                        <button onclick="editTreatment('${t.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center ml-1" title="Editar">
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading treatments:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar tratamentos</p>';
    }
}

async function loadTreatmentOptions() {
    const depId = AppState.getCurrentDependent();
    if (!depId) return;

    const [medications, professionals] = await Promise.all([
        DB.getMedications(depId),
        DB.getProfessionals(depId)
    ]);

    const medSelect = document.querySelector('#form-treatment select[name="medication_id"]');
    const profSelect = document.querySelector('#form-treatment select[name="prescribed_by"]');

    if (medSelect) {
        medSelect.innerHTML = '<option value="">Selecione um medicamento...</option>' +
            medications.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }

    if (profSelect) {
        profSelect.innerHTML = '<option value="">Selecione um profissional...</option>' +
            professionals.map(p => `<option value="${p.id}">${p.name}${p.specialty ? ' - ' + p.specialty : ''}</option>`).join('');
    }
}

// Calcula a duração de um tratamento em anos, meses e dias
function formatTreatmentDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months--;
        const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += previousMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years}a`);
    if (months > 0) parts.push(`${months}m`);
    if (days > 0 || parts.length === 0) parts.push(`${days}d`);

    return parts.join(', ').replace(/, ([^,]*)$/, ' e $1');
}

let currentEditingTreatmentId = null;

function showAddTreatment() {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    currentEditingTreatmentId = null;
    document.querySelector('#form-treatment').reset();
    loadTreatmentOptions();
    openModal('modal-treatment');
}

async function editTreatment(id) {
    event.stopPropagation();
    const depId = AppState.getCurrentDependent();
    if (!depId) return;

    const treatments = await DB.getTreatments(depId);
    const treatment = treatments.find(t => t.id === id);
    if (!treatment) {
        alert('Tratamento não encontrado');
        return;
    }

    currentEditingTreatmentId = id;
    await loadTreatmentOptions();

    const form = document.getElementById('form-treatment');
    form.querySelector('[name="medication_id"]').value = treatment.medication_id || '';
    form.querySelector('[name="prescribed_by"]').value = treatment.prescribed_by || '';
    form.querySelector('[name="dosage"]').value = treatment.dosage || '';
    form.querySelector('[name="frequency_hours"]').value = treatment.frequency_hours || '';
    form.querySelector('[name="first_dose_time"]').value = treatment.first_dose_time || '';
    form.querySelector('[name="start_date"]').value = treatment.start_date || '';
    form.querySelector('[name="end_date"]').value = treatment.end_date || '';
    form.querySelector('[name="treatment_goal"]').value = treatment.treatment_goal || '';
    form.querySelector('[name="admin_notes"]').value = treatment.administration_notes || treatment.admin_notes || '';
    form.querySelector('[name="is_active"]').checked = treatment.is_active !== false;

    openModal('modal-treatment');
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
    openModal('modal-professional');
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
                scrollPageToTop();

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
                scrollPageToTop();

            } catch (error) {
                alert('Erro ao salvar: ' + error.message);
            }
        });
    }

    // Treatment form
    const treatmentForm = document.getElementById('form-treatment');
    if (treatmentForm) {
        treatmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(treatmentForm);
            const treatment = {
                dependent_id: AppState.getCurrentDependent(),
                medication_id: formData.get('medication_id'),
                prescribed_by: formData.get('prescribed_by') || null,
                dosage: parseFloat(formData.get('dosage')) || 0,
                frequency_hours: parseInt(formData.get('frequency_hours')) || 0,
                first_dose_time: formData.get('first_dose_time') || null,
                start_date: formData.get('start_date') || null,
                end_date: formData.get('end_date') || null,
                treatment_goal: formData.get('treatment_goal') || null,
                administration_notes: formData.get('admin_notes') || null,
                is_active: formData.has('is_active')
            };

            try {
                if (currentEditingTreatmentId) {
                    await DB.updateTreatment(currentEditingTreatmentId, treatment);
                } else {
                    await DB.addTreatment(treatment);
                }
                currentEditingTreatmentId = null;
                closeModal('modal-treatment');
                treatmentForm.reset();
                loadTreatments();
                loadDashboard();
                scrollPageToTop();

            } catch (error) {
                alert('Erro ao salvar: ' + error.message);
            }
        });
    }

    // Professional form
    const profForm = document.getElementById('form-professional');
    if (profForm) {
        profForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(profForm);
            const professional = {
                dependent_id: AppState.getCurrentDependent(),
                name: formData.get('name'),
                specialty: formData.get('specialty') || null,
                phone: formData.get('phone') || null,
                email: formData.get('email') || null
            };

            try {
                await DB.addProfessional(professional);
                closeModal('modal-professional');
                profForm.reset();
                loadProfessionals();
                loadDashboard();
                scrollPageToTop();

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
