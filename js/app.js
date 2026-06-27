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

    const morePages = ['professionals', 'prescriptions', 'symptoms', 'procedures'];
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
        if (btn.dataset.page === 'more' && morePages.includes(page)) {
            btn.classList.add('active');
        }
    });

    if (page === 'dashboard') loadDashboard();
    if (page === 'medications') loadMedications();
    if (page === 'treatments') loadTreatments();
    if (page === 'professionals') loadProfessionals();
    if (page === 'prescriptions') loadPrescriptions();
    if (page === 'symptoms') loadSymptoms();
    if (page === 'procedures') loadProcedures();
    if (page === 'more') loadMore();
    if (page === 'activity-log') loadActivityLog();

    window.scrollTo(0, 0);
}

function loadMore() {
    // Página "Mais" é estática; nada a carregar dinamicamente
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

function formatDosage(dosage) {
    if (dosage === null || dosage === undefined || isNaN(dosage)) return '0';
    const num = parseFloat(dosage);
    if (Number.isInteger(num)) return num.toString();
    // Convert decimal to fraction-like string for common values
    if (num === 0.5) return '1/2';
    if (num === 0.25) return '1/4';
    if (num === 0.75) return '3/4';
    if (num === 0.33 || num === 0.333 || num === 0.3333) return '1/3';
    if (num === 0.67 || num === 0.667 || num === 0.6667) return '2/3';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ========== DASHBOARD ==========

function safeSetText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function safeSetHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

async function loadDashboard() {
    try {
        // Stats
        const stats = await DB.getDashboardStats();
        safeSetText('stat-dependents', stats.dependents);
        safeSetText('stat-medications', stats.medications);
        safeSetText('stat-treatments', stats.treatments);

        // Data de hoje
        const today = new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'short' 
        });
        safeSetText('today-date', today);

        // Low stock alerts
        const lowStock = await DB.getLowStockAlerts();
        if (lowStock.length > 0) {
            safeSetHtml('low-stock-list', lowStock.map(item => `
                <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                        <p class="font-medium text-gray-800">${item.medication_name}</p>
                        <p class="text-xs text-gray-500">${item.dependent_name}</p>
                        <p class="text-xs text-amber-600">${item.days_remaining} dias restantes</p>
                    </div>
                    <span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Estoque Baixo</span>
                </div>
            `).join(''));
        } else {
            safeSetHtml('low-stock-list', '<p class="text-gray-400 text-sm text-center py-4">Nenhum alerta no momento</p>');
        }

        // Expiring prescriptions
        const expiring = await DB.getExpiringPrescriptions();
        if (expiring.length > 0) {
            safeSetHtml('expiring-prescriptions', expiring.map(item => `
                <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                        <p class="font-medium text-gray-800">${item.medication_name}</p>
                        <p class="text-xs text-gray-500">${item.dependent_name}</p>
                        <p class="text-xs text-red-600">Vence em ${new Date(item.expiration_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Vencendo</span>
                </div>
            `).join(''));
        } else {
            safeSetHtml('expiring-prescriptions', '<p class="text-gray-400 text-sm text-center py-4">Nenhum receituário próximo do vencimento</p>');
        }

        // Today's schedule
        await loadTodaySchedule();

        // Last action
        await loadLastAction();

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ========== TODAY'S SCHEDULE ==========

let currentDoseSchedule = null;

async function loadTodaySchedule() {
    const scheduleEl = document.getElementById('today-schedule');
    const depId = AppState.getCurrentDependent();

    if (!depId) {
        scheduleEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Selecione um dependente</p>';
        return;
    }

    try {
        const schedules = await DB.getNextDoseSchedules(depId, 1);

        if (schedules.length === 0) {
            scheduleEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4" data-i18n="dashboard.noSchedule">Nenhum medicamento agendado para hoje</p>';
            return;
        }

        const schedule = schedules[0];
        const timeStr = schedule.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const scheduleJson = encodeURIComponent(JSON.stringify(schedule));

        scheduleEl.innerHTML = `
            <div class="bg-gray-50 rounded-xl p-4">
                <div class="flex items-start gap-4">
                    <div class="flex flex-col items-center gap-2 flex-shrink-0">
                        <p class="text-4xl font-bold text-sky-700">${timeStr}</p>
                        <button onclick="showDoseActionModal('Taken', '${timeStr}', '${scheduleJson}')" class="w-24 py-1.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors">
                            TOMAR
                        </button>
                        <button onclick="showDoseActionModal('Skipped', '${timeStr}', '${scheduleJson}')" class="w-24 py-1.5 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 transition-colors">
                            PULAR
                        </button>
                    </div>
                    <div class="flex-1 pt-1">
                        ${schedule.treatments.map(t => `
                            <p class="text-sm text-gray-800 leading-relaxed">${t.medications?.name || t.medication_name || t.name || 'Medicamento'} (${formatDosage(t.dosage)} un)</p>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading today schedule:', error);
        scheduleEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Erro ao carregar agenda</p>';
    }
}

async function loadLastAction() {
    const actionEl = document.getElementById('last-action');
    const depId = AppState.getCurrentDependent();

    if (!depId) {
        actionEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Selecione um dependente</p>';
        return;
    }

    try {
        const lastAction = await DB.getLastAction(depId);

        if (!lastAction || !lastAction.scheduling) {
            actionEl.innerHTML = `<p class="text-gray-400 text-sm text-center py-4" data-i18n="dashboard.noLastAction">Nenhuma ação registrada</p>`;
            return;
        }

        const scheduling = lastAction.scheduling;
        const timeStr = scheduling.schedule_time
            ? new Date(scheduling.schedule_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : '--:--';
        const isTaken = scheduling.action === 'Taken';
        const actionLabel = isTaken ? i18n.t('dashboard.taken') : i18n.t('dashboard.skipped');
        const actionBadgeClass = isTaken
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700';

        const items = lastAction.items || [];
        const itemsHtml = items.length > 0
            ? items.map(item => {
                const name = item.medications?.name
                    || item.treatments?.medications?.name
                    || item.treatments?.medication_name
                    || 'Medicamento';
                const dosage = item.dosage || item.treatments?.dosage || 0;
                return `<p class="text-sm text-gray-800 leading-relaxed">${name} (${formatDosage(dosage)} un)</p>`;
            }).join('')
            : '<p class="text-sm text-gray-400">Nenhuma medicação vinculada</p>';

        actionEl.innerHTML = `
            <div class="bg-gray-50 rounded-xl p-4">
                <div class="flex items-start gap-4">
                    <div class="flex flex-col items-center gap-2 flex-shrink-0">
                        <p class="text-4xl font-bold text-sky-700">${timeStr}</p>
                        <span class="text-xs px-2 py-0.5 rounded-full ${actionBadgeClass}">${actionLabel}</span>
                        <button onclick="revertLastDose()" class="w-24 py-1.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-colors">
                            REVERTER
                        </button>
                    </div>
                    <div class="flex-1 pt-1">
                        ${itemsHtml}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading last action:', error);
        actionEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Erro ao carregar última ação</p>';
    }
}

// ========== ACTIVITY LOG CAROUSEL ==========

let activityLogData = [];
let currentLogIndex = 0;
let logTouchStartX = 0;
let logTouchEndX = 0;

function showActivityLog() {
    navigateTo('activity-log');
}

async function loadActivityLog() {
    const container = document.getElementById('activity-log-container');
    const dotsContainer = document.getElementById('activity-log-dots');
    const depId = AppState.getCurrentDependent();

    if (!depId) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Selecione um dependente primeiro</p>';
        dotsContainer.innerHTML = '';
        return;
    }

    container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8" data-i18n="log.loading">Carregando...</p>';
    dotsContainer.innerHTML = '';

    try {
        activityLogData = await DB.getRecentSchedules(depId, 10);
        currentLogIndex = 0;

        if (activityLogData.length === 0) {
            container.innerHTML = `<p class="text-gray-400 text-sm text-center py-8" data-i18n="log.noData">Nenhum registro encontrado</p>`;
            return;
        }

        renderLogCarousel();
    } catch (error) {
        console.error('Error loading activity log:', error);
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Erro ao carregar registro</p>';
    }
}

function renderLogCarousel() {
    const container = document.getElementById('activity-log-container');
    const dotsContainer = document.getElementById('activity-log-dots');

    const slidesHtml = activityLogData.map((entry, index) => {
        const schedule = entry.scheduling;
        const timeStr = schedule.schedule_time
            ? new Date(schedule.schedule_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : '--:--';
        const dateStr = schedule.created_at
            ? new Date(schedule.created_at).toLocaleDateString('pt-BR')
            : '';
        const isTaken = schedule.action === 'Taken';
        const actionLabel = isTaken ? i18n.t('dashboard.taken') : i18n.t('dashboard.skipped');
        const actionBadgeClass = isTaken
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700';

        const items = entry.items || [];
        const itemsHtml = items.length > 0
            ? items.map(item => {
                const name = item.medications?.name
                    || item.treatments?.medications?.name
                    || item.treatments?.medication_name
                    || 'Medicamento';
                const dosage = item.dosage || item.treatments?.dosage || 0;
                return `
                    <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span class="text-sm text-gray-800">${name}</span>
                        <span class="text-xs text-gray-500">${formatDosage(dosage)} un</span>
                    </div>
                `;
            }).join('')
            : '<p class="text-sm text-gray-400 py-2">Nenhuma medicação vinculada</p>';

        return `
            <div class="log-slide">
                <div class="text-center mb-4">
                    <p class="text-5xl font-bold text-sky-700">${timeStr}</p>
                    <p class="text-sm text-gray-400 mt-1">${dateStr}</p>
                    <span class="inline-block mt-2 text-xs px-3 py-1 rounded-full ${actionBadgeClass}">${actionLabel}</span>
                </div>
                ${schedule.notes ? `<p class="text-sm text-gray-600 italic mb-3">"${schedule.notes}"</p>` : ''}
                <div class="bg-gray-50 rounded-xl p-3">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Medicações</p>
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="log-carousel" id="log-carousel" ontouchstart="handleLogTouchStart(event)" ontouchend="handleLogTouchEnd(event)">
            ${slidesHtml}
        </div>
    `;

    dotsContainer.innerHTML = activityLogData.map((_, index) => `
        <div class="log-dot ${index === currentLogIndex ? 'active' : ''}" onclick="goToLogSlide(${index})"></div>
    `).join('');

    updateLogCarouselPosition();
}

function updateLogCarouselPosition() {
    const carousel = document.getElementById('log-carousel');
    if (carousel) {
        carousel.style.transform = `translateX(-${currentLogIndex * 100}%)`;
    }

    document.querySelectorAll('.log-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentLogIndex);
    });
}

function goToLogSlide(index) {
    if (index < 0 || index >= activityLogData.length) return;
    currentLogIndex = index;
    updateLogCarouselPosition();
}

function nextLogSlide() {
    if (currentLogIndex < activityLogData.length - 1) {
        currentLogIndex++;
        updateLogCarouselPosition();
    }
}

function prevLogSlide() {
    if (currentLogIndex > 0) {
        currentLogIndex--;
        updateLogCarouselPosition();
    }
}

function handleLogTouchStart(event) {
    logTouchStartX = event.changedTouches[0].screenX;
}

function handleLogTouchEnd(event) {
    logTouchEndX = event.changedTouches[0].screenX;
    handleLogSwipe();
}

function handleLogSwipe() {
    const swipeThreshold = 50;
    const diff = logTouchStartX - logTouchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            nextLogSlide();
        } else {
            prevLogSlide();
        }
    }
}

async function showDoseActionModal(action, timeStr, scheduleJson) {
    const schedule = JSON.parse(decodeURIComponent(scheduleJson));
    currentDoseSchedule = { ...schedule, action };

    const titleEl = document.getElementById('dose-action-title');
    const timeEl = document.getElementById('dose-action-time');
    const treatmentsEl = document.getElementById('dose-action-treatments');
    const extraWrapper = document.getElementById('dose-action-extra-wrapper');
    const extraContainer = document.getElementById('dose-action-extra-medications');
    const scheduleTimeInput = document.getElementById('dose-action-schedule-time');
    const actionTypeInput = document.getElementById('dose-action-type');
    const form = document.getElementById('form-dose-action');

    titleEl.textContent = action === 'Taken' ? 'Confirmar Medicação Tomada' : 'Confirmar Medicação Pulada';
    timeEl.textContent = timeStr;
    scheduleTimeInput.value = schedule.time;
    actionTypeInput.value = action;

    treatmentsEl.innerHTML = schedule.treatments.map(t => `
        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-2">
            <span class="font-medium text-gray-800">${t.medications?.name || t.medication_name || t.name || 'Medicamento'}</span>
            <span class="text-sm text-gray-500">${t.dosage || 0} un</span>
        </div>
    `).join('');

    // Extra medications only for "Taken" action
    if (action === 'Taken') {
        extraWrapper.classList.remove('hidden');
        extraContainer.innerHTML = '';
        await loadDoseActionMedicationOptions();
    } else {
        extraWrapper.classList.add('hidden');
        extraContainer.innerHTML = '';
    }

    form.reset();
    openModal('modal-dose-action');
}

async function loadDoseActionMedicationOptions() {
    const depId = AppState.getCurrentDependent();
    if (!depId) return [];

    const medications = await DB.getMedications(depId);
    window._doseActionMedications = medications;
    return medications;
}

function addExtraMedicationRow() {
    const container = document.getElementById('dose-action-extra-medications');
    const medications = window._doseActionMedications || [];

    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 bg-gray-50 rounded-lg p-2';
    row.innerHTML = `
        <select class="extra-medication-id flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-sm" onchange="handleMedicationSelectChange(this)">
            <option value="">Selecione...</option>
            ${medications.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            <option value="__new__">+ ${i18n.t('medication.addNew')}</option>
        </select>
        <input type="number" min="0.1" step="0.1" class="extra-medication-dosage w-20 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm" placeholder="Qtd">
        <button type="button" onclick="this.closest('.bg-gray-50').remove()" class="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg" title="Remover">
            ✕
        </button>
    `;
    container.appendChild(row);
}

async function revertLastDose() {
    const depId = AppState.getCurrentDependent();
    if (!depId) {
        alert('Selecione um dependente primeiro');
        return;
    }

    if (!confirm(i18n.t('doseAction.confirmRevert'))) {
        return;
    }

    try {
        await DB.revertLastDose(depId);
        loadTodaySchedule();
        loadDashboard();
        scrollPageToTop();
    } catch (error) {
        alert(error.message || 'Erro ao reverter dose');
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
        const [medications, prescriptionCounts] = await Promise.all([
            DB.getMedications(depId),
            DB.getPrescriptionCountsByMedication(depId)
        ]);

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

        listEl.innerHTML = medications.map(med => {
            const prescriptionInfo = prescriptionCounts[med.id] || { count: 0, totalUnits: 0 };
            const prescriptionCount = prescriptionInfo.count;
            const prescriptionUnits = prescriptionInfo.totalUnits;
            return `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover" onclick="showMedicationDetail('${med.id}')">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800">${med.name}</h3>
                        <p class="text-sm text-gray-500">${med.active_ingredient || 'Sem princípio ativo'}</p>
                        <div class="flex items-center gap-2 mt-2 flex-wrap">
                            ${med.is_controlled ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Controlado</span>' : ''}
                            ${med.is_continuous_use ? '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Uso Contínuo</span>' : ''}
                            ${med.is_rescue_medication ? '<span class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Resgate</span>' : ''}
                            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${med.stock_quantity || 0} un</span>
                            ${prescriptionCount > 0 ? `<span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">${prescriptionCount} receita${prescriptionCount > 1 ? 's' : ''} (${prescriptionUnits} un)</span>` : ''}
                        </div>
                    </div>
                    <button class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center" onclick="event.stopPropagation(); editMedication('${med.id}')">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading medications:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar medicamentos</p>';
    }
}

function showAddMedication(callback) {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    currentEditingMedicationId = null;
    window._medicationSaveCallback = callback || null;
    document.getElementById('form-medication').reset();
    document.querySelector('#modal-medication h3').textContent = i18n.t('medication.addNew');
    openModal('modal-medication');
}

function handleMedicationSelectChange(select) {
    if (select.value === '__new__') {
        // Reset select to empty while modal opens
        select.value = '';
        openQuickAddMedication(select);
    }
}

function openQuickAddMedication(targetSelect) {
    window._pendingMedicationSelect = targetSelect;
    showAddMedication((newMedication) => {
        if (window._pendingMedicationSelect) {
            const select = window._pendingMedicationSelect;
            const option = document.createElement('option');
            option.value = newMedication.id;
            option.textContent = newMedication.name;

            // Insert before the "+ New" option
            const newOption = select.querySelector('option[value="__new__"]');
            if (newOption) {
                select.insertBefore(option, newOption);
            } else {
                select.appendChild(option);
            }

            select.value = newMedication.id;
            window._pendingMedicationSelect = null;
        }
    });
}

function showMedicationDetail(id) {
    console.log('Show detail for medication:', id);
}

async function editMedication(id) {
    event.stopPropagation();
    const depId = AppState.getCurrentDependent();
    if (!depId) return;

    const medications = await DB.getMedications(depId);
    const medication = medications.find(m => m.id === id);
    if (!medication) {
        alert('Medicamento não encontrado');
        return;
    }

    currentEditingMedicationId = id;
    const form = document.getElementById('form-medication');
    form.querySelector('[name="name"]').value = medication.name || '';
    form.querySelector('[name="active_ingredient"]').value = medication.active_ingredient || '';
    form.querySelector('[name="is_controlled"]').checked = medication.is_controlled === true;
    form.querySelector('[name="is_continuous_use"]').checked = medication.is_continuous_use === true;
    form.querySelector('[name="is_rescue_medication"]').checked = medication.is_rescue_medication === true;
    form.querySelector('[name="stock_quantity"]').value = medication.stock_quantity || 0;

    document.querySelector('#modal-medication h3').textContent = i18n.t('medication.edit');
    openModal('modal-medication');
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
            medications.map(m => `<option value="${m.id}">${m.name}</option>`).join('') +
            `<option value="__new__">+ ${i18n.t('medication.addNew')}</option>`;
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
let currentEditingMedicationId = null;
let currentEditingPrescriptionId = null;
let currentEditingSymptomId = null;
let currentEditingProcedureId = null;

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

// ========== PRESCRIPTIONS ==========

async function loadPrescriptions() {
    const listEl = document.getElementById('prescriptions-list');
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
        const prescriptions = await DB.getPrescriptions(depId);

        if (prescriptions.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl mb-2 block">📝</span>
                    <p class="text-gray-400" data-i18n="common.noData">Nenhum dado encontrado</p>
                    <p class="text-sm text-gray-400 mt-1" data-i18n="prescription.noData">Adicione o primeiro receituário</p>
                </div>
            `;
            return;
        }

        const statusClasses = {
            'Valid': 'bg-emerald-100 text-emerald-700',
            'Expired': 'bg-red-100 text-red-700',
            'Used': 'bg-gray-100 text-gray-600'
        };
        const statusLabels = {
            'Valid': i18n.t('prescription.statusValid'),
            'Expired': i18n.t('prescription.statusExpired'),
            'Used': i18n.t('prescription.statusUsed')
        };

        listEl.innerHTML = prescriptions.map(p => {
            const medName = p.medications?.name || p.medication_name || 'Medicamento';
            const profName = p.healthcare_professionals?.name || p.professional_name || '';
            const profSpecialty = p.healthcare_professionals?.specialty || '';
            const profText = profName ? (profSpecialty ? `${profName} (${profSpecialty})` : profName) : '';
            const expDate = p.expiration_date ? new Date(p.expiration_date).toLocaleDateString('pt-BR') : '';
            const usedDate = p.used_date ? new Date(p.used_date).toLocaleDateString('pt-BR') : '';
            const status = p.status || 'Valid';

            return `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 pr-2">
                        <h3 class="font-semibold text-gray-800">${medName}</h3>
                        <p class="text-sm text-gray-500">${p.units || 0} unidades</p>
                        ${profText ? `<p class="text-xs text-gray-400 mt-1">👨‍⚕️ ${profText}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="text-xs px-2 py-0.5 rounded-full ${statusClasses[status] || statusClasses['Valid']}">${statusLabels[status] || status}</span>
                        <button onclick="editPrescription('${p.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center ml-1" title="Editar">
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deletePrescription('${p.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center" title="Excluir">
                            <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                    <span>📅 Vence em ${expDate}</span>
                    ${usedDate ? `<span>✅ Utilizado em ${usedDate}</span>` : ''}
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading prescriptions:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar receituários</p>';
    }
}

async function loadPrescriptionOptions() {
    const depId = AppState.getCurrentDependent();
    if (!depId) return;

    const [medications, professionals] = await Promise.all([
        DB.getMedications(depId),
        DB.getProfessionals(depId)
    ]);

    const medSelect = document.querySelector('#form-prescription [name="medication_id"]');
    const profSelect = document.querySelector('#form-prescription [name="prescribed_by"]');

    medSelect.innerHTML = '<option value="">Selecione um medicamento...</option>' +
        medications.map(m => `<option value="${m.id}">${m.name}</option>`).join('') +
        `<option value="__new__">+ ${i18n.t('medication.addNew')}</option>`;

    profSelect.innerHTML = '<option value="">Selecione um profissional...</option>' +
        professionals.map(p => `<option value="${p.id}">${p.name}${p.specialty ? ` (${p.specialty})` : ''}</option>`).join('');
}

function showAddPrescription() {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    currentEditingPrescriptionId = null;
    document.getElementById('form-prescription').reset();
    document.querySelector('#modal-prescription h3').textContent = i18n.t('prescription.addNew');
    document.getElementById('prescription-used-date-wrapper').classList.add('hidden');
    loadPrescriptionOptions();
    openModal('modal-prescription');
}

async function editPrescription(id) {
    event.stopPropagation();
    const depId = AppState.getCurrentDependent();
    if (!depId) return;

    const prescriptions = await DB.getPrescriptions(depId);
    const prescription = prescriptions.find(p => p.id === id);
    if (!prescription) {
        alert('Receituário não encontrado');
        return;
    }

    currentEditingPrescriptionId = id;
    await loadPrescriptionOptions();

    const form = document.getElementById('form-prescription');
    form.querySelector('[name="medication_id"]').value = prescription.medication_id || '';
    form.querySelector('[name="prescribed_by"]').value = prescription.prescribed_by || '';
    form.querySelector('[name="units"]').value = prescription.units || 0;
    form.querySelector('[name="expiration_date"]').value = prescription.expiration_date || '';
    form.querySelector('[name="status"]').value = prescription.status || 'Valid';
    form.querySelector('[name="used_date"]').value = prescription.used_date || '';

    togglePrescriptionUsedDate(form.querySelector('[name="status"]'));
    document.querySelector('#modal-prescription h3').textContent = i18n.t('prescription.edit');
    openModal('modal-prescription');
}

async function deletePrescription(id) {
    if (!confirm('Tem certeza que deseja excluir este receituário?')) return;

    try {
        await DB.deletePrescription(id);
        loadPrescriptions();
        loadDashboard();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

function togglePrescriptionUsedDate(select) {
    const wrapper = document.getElementById('prescription-used-date-wrapper');
    if (select.value === 'Used') {
        wrapper.classList.remove('hidden');
    } else {
        wrapper.classList.add('hidden');
    }
}

// ========== SYMPTOMS ==========

async function loadSymptoms() {
    const listEl = document.getElementById('symptoms-list');
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
        const symptoms = await DB.getSymptoms(depId);

        if (symptoms.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl mb-2 block">😊</span>
                    <p class="text-gray-400" data-i18n="common.noData">Nenhum dado encontrado</p>
                    <p class="text-sm text-gray-400 mt-1" data-i18n="symptom.noData">Adicione o primeiro sintoma</p>
                </div>
            `;
            return;
        }

        const severityFace = (severity) => {
            if (!severity) return '';
            if (severity <= 3) return '😊';
            if (severity <= 6) return '😐';
            return '😞';
        };

        listEl.innerHTML = symptoms.map(s => {
            const startDate = s.start_date ? new Date(s.start_date).toLocaleDateString('pt-BR') : '';
            const endDate = s.end_date ? new Date(s.end_date).toLocaleDateString('pt-BR') : '';
            const face = severityFace(s.severity);
            return `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 pr-2">
                        <h3 class="font-semibold text-gray-800">${s.description}</h3>
                        <p class="text-sm text-gray-500">${startDate}${endDate ? ` → ${endDate}` : ''}</p>
                        ${s.notes ? `<p class="text-xs text-gray-400 mt-1">📝 ${s.notes}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1">
                        ${face ? `<span class="text-2xl" title="${i18n.t('symptom.severity')}: ${s.severity}/10">${face}</span>` : ''}
                        <button onclick="editSymptom('${s.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center ml-1" title="Editar">
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deleteSymptom('${s.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center" title="Excluir">
                            <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading symptoms:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar sintomas</p>';
    }
}

function showAddSymptom() {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    currentEditingSymptomId = null;
    document.getElementById('form-symptom').reset();
    document.querySelector('#modal-symptom h3').textContent = i18n.t('symptom.addNew');
    openModal('modal-symptom');
}

async function editSymptom(id) {
    event.stopPropagation();
    const depId = AppState.getCurrentDependent();
    if (!depId) return;

    const symptoms = await DB.getSymptoms(depId);
    const symptom = symptoms.find(s => s.id === id);
    if (!symptom) {
        alert('Sintoma não encontrado');
        return;
    }

    currentEditingSymptomId = id;
    const form = document.getElementById('form-symptom');
    form.querySelector('[name="description"]').value = symptom.description || '';
    const severity = symptom.severity || '';
    const severityInput = form.querySelector(`[name="severity"][value="${severity}"]`);
    if (severityInput) severityInput.checked = true;
    form.querySelector('[name="start_date"]').value = symptom.start_date || '';
    form.querySelector('[name="end_date"]').value = symptom.end_date || '';
    form.querySelector('[name="notes"]').value = symptom.notes || '';

    document.querySelector('#modal-symptom h3').textContent = i18n.t('symptom.edit');
    openModal('modal-symptom');
}

async function deleteSymptom(id) {
    if (!confirm('Tem certeza que deseja excluir este sintoma?')) return;

    try {
        await DB.deleteSymptom(id);
        loadSymptoms();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

// ========== PROCEDURES ==========

async function loadProcedures() {
    const listEl = document.getElementById('procedures-list');
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
        const procedures = await DB.getProcedures(depId);

        if (procedures.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl mb-2 block">🩺</span>
                    <p class="text-gray-400" data-i18n="common.noData">Nenhum dado encontrado</p>
                    <p class="text-sm text-gray-400 mt-1" data-i18n="procedure.noData">Adicione o primeiro procedimento</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = procedures.map(p => {
            const eventDate = p.event_date ? new Date(p.event_date).toLocaleDateString('pt-BR') : '';
            const prof = p.healthcare_professionals;
            const profText = prof ? (prof.specialty ? `${prof.name} (${prof.specialty})` : prof.name) : '';
            return `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 pr-2">
                        <h3 class="font-semibold text-gray-800">${p.description}</h3>
                        <p class="text-sm text-gray-500">📅 ${eventDate}</p>
                        ${p.procedure_goal ? `<p class="text-xs text-gray-500 mt-1">🎯 ${p.procedure_goal}</p>` : ''}
                        ${profText ? `<p class="text-xs text-gray-400 mt-1">👨‍⚕️ ${profText}</p>` : ''}
                        ${p.location ? `<p class="text-xs text-gray-400 mt-1">📍 ${p.location}</p>` : ''}
                        ${p.notes ? `<p class="text-xs text-gray-400 mt-1">📝 ${p.notes}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1">
                        <button onclick="editProcedure('${p.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center ml-1" title="Editar">
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deleteProcedure('${p.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center" title="Excluir">
                            <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading procedures:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar procedimentos</p>';
    }
}

async function loadProcedureOptions() {
    const depId = AppState.getCurrentDependent();
    if (!depId) return;

    const professionals = await DB.getProfessionals(depId);
    const profSelect = document.querySelector('#form-procedure [name="prescribed_by"]');

    profSelect.innerHTML = '<option value="">Selecione um profissional...</option>' +
        professionals.map(p => `<option value="${p.id}">${p.name}${p.specialty ? ` (${p.specialty})` : ''}</option>`).join('');
}

function showAddProcedure() {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    currentEditingProcedureId = null;
    document.getElementById('form-procedure').reset();
    document.querySelector('#modal-procedure h3').textContent = i18n.t('procedure.addNew');
    loadProcedureOptions();
    openModal('modal-procedure');
}

async function editProcedure(id) {
    event.stopPropagation();
    const depId = AppState.getCurrentDependent();
    if (!depId) return;

    const procedures = await DB.getProcedures(depId);
    const procedure = procedures.find(p => p.id === id);
    if (!procedure) {
        alert('Procedimento não encontrado');
        return;
    }

    currentEditingProcedureId = id;
    await loadProcedureOptions();

    const form = document.getElementById('form-procedure');
    form.querySelector('[name="description"]').value = procedure.description || '';
    form.querySelector('[name="event_date"]').value = procedure.event_date || '';
    form.querySelector('[name="procedure_goal"]').value = procedure.procedure_goal || '';
    form.querySelector('[name="prescribed_by"]').value = procedure.prescribed_by || '';
    form.querySelector('[name="location"]').value = procedure.location || '';
    form.querySelector('[name="notes"]').value = procedure.notes || '';

    document.querySelector('#modal-procedure h3').textContent = i18n.t('procedure.edit');
    openModal('modal-procedure');
}

async function deleteProcedure(id) {
    if (!confirm('Tem certeza que deseja excluir este procedimento?')) return;

    try {
        await DB.deleteProcedure(id);
        loadProcedures();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
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
                is_rescue_medication: formData.has('is_rescue_medication'),
                stock_quantity: parseInt(formData.get('stock_quantity')) || 0
            };

            try {
                let savedMedication;
                if (currentEditingMedicationId) {
                    savedMedication = await DB.updateMedication(currentEditingMedicationId, medication);
                } else {
                    savedMedication = await DB.addMedication(medication);
                }

                // Call callback if exists (quick add from select)
                if (window._medicationSaveCallback) {
                    window._medicationSaveCallback(savedMedication);
                    window._medicationSaveCallback = null;
                }

                currentEditingMedicationId = null;
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

    // Prescription form
    const prescriptionForm = document.getElementById('form-prescription');
    if (prescriptionForm) {
        prescriptionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(prescriptionForm);
            const status = formData.get('status');
            const prescription = {
                dependent_id: AppState.getCurrentDependent(),
                medication_id: formData.get('medication_id'),
                prescribed_by: formData.get('prescribed_by') || null,
                units: parseInt(formData.get('units')) || 0,
                expiration_date: formData.get('expiration_date') || null,
                status: status || 'Valid',
                used_date: status === 'Used' ? (formData.get('used_date') || null) : null
            };

            try {
                if (currentEditingPrescriptionId) {
                    await DB.updatePrescription(currentEditingPrescriptionId, prescription);
                } else {
                    await DB.addPrescription(prescription);
                }
                currentEditingPrescriptionId = null;
                closeModal('modal-prescription');
                prescriptionForm.reset();
                document.getElementById('prescription-used-date-wrapper').classList.add('hidden');
                loadPrescriptions();
                loadDashboard();
                scrollPageToTop();

            } catch (error) {
                alert('Erro ao salvar: ' + error.message);
            }
        });
    }

    // Symptom form
    const symptomForm = document.getElementById('form-symptom');
    if (symptomForm) {
        symptomForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(symptomForm);
            const symptom = {
                dependent_id: AppState.getCurrentDependent(),
                description: formData.get('description'),
                severity: parseInt(formData.get('severity')) || null,
                start_date: formData.get('start_date') || null,
                end_date: formData.get('end_date') || null,
                notes: formData.get('notes') || null
            };

            try {
                if (currentEditingSymptomId) {
                    await DB.updateSymptom(currentEditingSymptomId, symptom);
                } else {
                    await DB.addSymptom(symptom);
                }
                currentEditingSymptomId = null;
                closeModal('modal-symptom');
                symptomForm.reset();
                loadSymptoms();
                scrollPageToTop();

            } catch (error) {
                alert('Erro ao salvar: ' + error.message);
            }
        });
    }

    // Procedure form
    const procedureForm = document.getElementById('form-procedure');
    if (procedureForm) {
        procedureForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(procedureForm);
            const procedure = {
                dependent_id: AppState.getCurrentDependent(),
                description: formData.get('description'),
                event_date: formData.get('event_date') || null,
                procedure_goal: formData.get('procedure_goal') || null,
                prescribed_by: formData.get('prescribed_by') || null,
                location: formData.get('location') || null,
                notes: formData.get('notes') || null
            };

            try {
                if (currentEditingProcedureId) {
                    await DB.updateProcedure(currentEditingProcedureId, procedure);
                } else {
                    await DB.addProcedure(procedure);
                }
                currentEditingProcedureId = null;
                closeModal('modal-procedure');
                procedureForm.reset();
                loadProcedures();
                scrollPageToTop();

            } catch (error) {
                alert('Erro ao salvar: ' + error.message);
            }
        });
    }

    // Dose action form (Taken/Skipped)
    const doseActionForm = document.getElementById('form-dose-action');
    if (doseActionForm) {
        doseActionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentDoseSchedule) return;

            const formData = new FormData(doseActionForm);
            const notes = formData.get('notes');
            const depId = AppState.getCurrentDependent();

            // Collect extra medications only for Taken action
            const extraMedications = [];
            if (currentDoseSchedule.action === 'Taken') {
                document.querySelectorAll('#dose-action-extra-medications .bg-gray-50').forEach(row => {
                    const medId = row.querySelector('.extra-medication-id')?.value;
                    const dosage = row.querySelector('.extra-medication-dosage')?.value;
                    if (medId && dosage) {
                        extraMedications.push({ medication_id: medId, dosage: parseFloat(dosage) });
                    }
                });
            }

            try {
                await DB.recordDose(
                    depId,
                    currentDoseSchedule.time,
                    currentDoseSchedule.action,
                    currentDoseSchedule.treatments,
                    notes,
                    extraMedications
                );
                closeModal('modal-dose-action');
                doseActionForm.reset();
                document.getElementById('dose-action-extra-medications').innerHTML = '';
                currentDoseSchedule = null;
                loadTodaySchedule();
                loadDashboard();

            } catch (error) {
                alert('Erro ao registrar: ' + error.message);
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
window.handleMedicationSelectChange = handleMedicationSelectChange;
window.showAddTreatment = showAddTreatment;
window.showAddProfessional = showAddProfessional;
window.showAddPrescription = showAddPrescription;
window.editPrescription = editPrescription;
window.deletePrescription = deletePrescription;
window.togglePrescriptionUsedDate = togglePrescriptionUsedDate;
window.showActivityLog = showActivityLog;
window.showDoseActionModal = showDoseActionModal;
window.addExtraMedicationRow = addExtraMedicationRow;
window.revertLastDose = revertLastDose;
window.goToLogSlide = goToLogSlide;
window.handleLogTouchStart = handleLogTouchStart;
window.handleLogTouchEnd = handleLogTouchEnd;
window.closeModal = closeModal;
window.exportData = exportData;
