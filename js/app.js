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

let showAllDependentsDashboard = false;

function toggleShowAllDependents() {
    const toggle = document.getElementById('toggle-show-all-dependents');
    showAllDependentsDashboard = toggle ? toggle.checked : false;
    loadTodaySchedule();
    loadLastAction();
}

// ========== NAVEGAÇÃO ==========

function navigateTo(page) {
    hideSplashScreen();

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    const morePages = ['professionals', 'prescriptions', 'symptoms', 'procedures', 'categories', 'inventory-update', 'tour'];
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
    if (page === 'categories') loadCategories();
    if (page === 'inventory-update') loadInventoryUpdate();
    if (page === 'dependents') loadDependentsManagement();
    if (page === 'tour') loadTour();
    if (page === 'more') loadMore();
    if (page === 'activity-log') loadActivityLog();

    window.scrollTo(0, 0);
}

function loadMore() {
    // Página "Mais" é estática; nada a carregar dinamicamente
}

// ========== SPLASH SCREEN ==========

function showSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.classList.remove('pointer-events-none', 'opacity-0');
    }
}

function hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    splash.classList.add('opacity-0');
    setTimeout(() => {
        splash.classList.add('pointer-events-none');
    }, 500);
}

// ========== TOUR ==========

const tourSlides = [
    {
        icon: `<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        titleKey: 'tour.slide1.title',
        descriptionKey: 'tour.slide1.description'
    },
    {
        icon: `<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        titleKey: 'tour.slide2.title',
        descriptionKey: 'tour.slide2.description'
    },
    {
        icon: `<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>`,
        titleKey: 'tour.slide3.title',
        descriptionKey: 'tour.slide3.description'
    },
    {
        icon: `<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>`,
        titleKey: 'tour.slide4.title',
        descriptionKey: 'tour.slide4.description'
    }
];

let currentTourIndex = 0;
let tourTouchStartX = 0;
let tourTouchEndX = 0;

function getTourSeenKey() {
    const userId = Auth.getUserId ? Auth.getUserId() : null;
    return userId ? `farma-pocket-tour-seen-${userId}` : 'farma-pocket-tour-seen';
}

function hasSeenTour() {
    return localStorage.getItem(getTourSeenKey()) === 'true';
}

function markTourAsSeen() {
    localStorage.setItem(getTourSeenKey(), 'true');
}

function loadTour() {
    currentTourIndex = 0;
    renderTourCarousel();
}

function renderTourCarousel() {
    const container = document.getElementById('tour-carousel');
    const dotsContainer = document.getElementById('tour-dots');
    if (!container || !dotsContainer) return;

    const slidesHtml = tourSlides.map(slide => `
        <div class="tour-slide">
            <div class="w-28 h-28 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 mb-8">
                ${slide.icon}
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">${i18n.t(slide.titleKey)}</h3>
            <p class="text-gray-600 leading-relaxed max-w-xs text-base">${i18n.t(slide.descriptionKey)}</p>
        </div>
    `).join('');

    container.innerHTML = slidesHtml;

    dotsContainer.innerHTML = tourSlides.map((_, index) => `
        <div class="tour-dot ${index === currentTourIndex ? 'active' : ''}" onclick="goToTourSlide(${index})"></div>
    `).join('');

    updateTourCarouselPosition();
    updateTourButtons();
}

function updateTourCarouselPosition() {
    const carousel = document.getElementById('tour-carousel');
    if (carousel) {
        carousel.style.transform = `translateX(-${currentTourIndex * 100}%)`;
    }

    document.querySelectorAll('.tour-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentTourIndex);
    });
}

function updateTourButtons() {
    const prevBtn = document.getElementById('tour-prev');
    const nextBtn = document.getElementById('tour-next');

    if (prevBtn) {
        prevBtn.classList.toggle('invisible', currentTourIndex === 0);
    }

    if (nextBtn) {
        if (currentTourIndex === tourSlides.length - 1) {
            nextBtn.textContent = i18n.t('tour.start');
            nextBtn.onclick = finishTour;
        } else {
            nextBtn.textContent = i18n.t('tour.next');
            nextBtn.onclick = nextTourSlide;
        }
    }
}

function nextTourSlide() {
    if (currentTourIndex < tourSlides.length - 1) {
        currentTourIndex++;
        updateTourCarouselPosition();
        updateTourButtons();
    }
}

function prevTourSlide() {
    if (currentTourIndex > 0) {
        currentTourIndex--;
        updateTourCarouselPosition();
        updateTourButtons();
    }
}

function goToTourSlide(index) {
    if (index < 0 || index >= tourSlides.length) return;
    currentTourIndex = index;
    updateTourCarouselPosition();
    updateTourButtons();
}

function finishTour() {
    markTourAsSeen();
    showSplashScreen();
    navigateTo('dashboard');
    loadDashboard();
}

function skipTour() {
    markTourAsSeen();
    showSplashScreen();
    navigateTo('dashboard');
    loadDashboard();
}

function handleTourTouchStart(event) {
    tourTouchStartX = event.changedTouches[0].screenX;
}

function handleTourTouchEnd(event) {
    tourTouchEndX = event.changedTouches[0].screenX;
    const diff = tourTouchStartX - tourTouchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            nextTourSlide();
        } else {
            prevTourSlide();
        }
    }
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

async function loadDependentsManagement() {
    const listEl = document.getElementById('dependents-management-list');
    if (!listEl) return;

    listEl.innerHTML = '<div class="skeleton h-20 rounded-xl"></div>'.repeat(2);

    try {
        await loadDependents();
        const dependents = AppState.dependents;

        if (dependents.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl mb-2 block">👤</span>
                    <p class="text-gray-400">Nenhum dependente cadastrado</p>
                </div>
            `;
            return;
        }

        const relationshipLabels = {
            self: 'Eu mesmo',
            child: 'Filho(a)',
            spouse: 'Cônjuge',
            parent: 'Pai/Mãe',
            sibling: 'Irmão(ã)',
            other: 'Outro'
        };

        listEl.innerHTML = dependents.map(dep => {
            const currentId = AppState.getCurrentDependent();
            const isCurrent = dep.id === currentId;
            const relationshipText = relationshipLabels[dep.relationship] || dep.relationship || '';
            const ageText = dep.date_of_birth ? calculateAge(dep.date_of_birth) + ' anos' : '';
            const subtitleParts = [relationshipText, ageText].filter(Boolean);

            return `
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                            ${renderDependentAvatar(dep.avatar_url)}
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-semibold text-gray-800">${dep.name}</h3>
                                ${isCurrent ? '<span class="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">Selecionado</span>' : ''}
                            </div>
                            ${subtitleParts.length > 0 ? `<p class="text-sm text-gray-500">${subtitleParts.join(' · ')}</p>` : ''}
                            ${dep.notes ? `<p class="text-xs text-gray-400 mt-1">${dep.notes}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <button onclick="editDependent('${dep.id}')" class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center" title="Editar">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        ${!isCurrent ? `
                        <button onclick="selectDependent('${dep.id}')" class="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center" title="Selecionar">
                            <svg class="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading dependents management:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar dependentes</p>';
    }
}

function calculateAge(dateOfBirth) {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
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

    // Ordena para que "Eu mesmo" (self) apareça primeiro
    const sortedDependents = [...AppState.dependents].sort((a, b) => {
        if (a.relationship === 'self' && b.relationship !== 'self') return -1;
        if (a.relationship !== 'self' && b.relationship === 'self') return 1;
        return a.name.localeCompare(b.name);
    });

    // Se não tem dependente selecionado, seleciona o primeiro
    if (!currentId && sortedDependents.length > 0) {
        AppState.setCurrentDependent(sortedDependents[0].id);
    }

    selector.innerHTML = `
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            ${sortedDependents.map(dep => `
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
    const form = document.getElementById('form-dependent');
    if (form) {
        form.reset();
        const idInput = form.querySelector('[name="id"]');
        if (idInput) idInput.value = '';
    }
    const titleEl = document.querySelector('#modal-dependent h3');
    if (titleEl) titleEl.textContent = 'Adicionar Dependente';
    openModal('modal-dependent');
}

async function editDependent(id) {
    const dep = AppState.dependents.find(d => d.id === id);
    if (!dep) {
        alert('Dependente não encontrado');
        return;
    }

    const form = document.getElementById('form-dependent');
    if (!form) return;

    form.reset();
    form.querySelector('[name="id"]').value = dep.id;
    form.querySelector('[name="name"]').value = dep.name || '';
    form.querySelector('[name="date_of_birth"]').value = dep.date_of_birth || '';
    form.querySelector('[name="relationship"]').value = dep.relationship || '';
    form.querySelector('[name="notes"]').value = dep.notes || '';

    const titleEl = document.querySelector('#modal-dependent h3');
    if (titleEl) titleEl.textContent = 'Editar Dependente';

    openModal('modal-dependent');
}

let currentModalZIndex = 50;

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.zIndex = '';
    }

    // Reset base z-index when no modal is visible
    const anyOpen = document.querySelector('.fixed.inset-0:not(.hidden)');
    if (!anyOpen) {
        currentModalZIndex = 50;
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        currentModalZIndex += 10;
        modal.style.zIndex = currentModalZIndex;
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

function calculateTreatmentDailyUsage(treatment) {
    if (!treatment) return 0;

    if (treatment.schedule_type === 'weekly') {
        const times = treatment.medication_times_on_treatment || [];
        const weeklyTotal = times.reduce((sum, slot) => sum + (parseFloat(slot.dosage) || 0), 0);
        return weeklyTotal / 7;
    }

    const freqHours = parseFloat(treatment.frequency_hours) || 0;
    const dosage = parseFloat(treatment.dosage) || 0;
    if (freqHours <= 0) return 0;
    return (24 / freqHours) * dosage;
}

function getStockBadgeClass(treatment, prescriptionCounts) {
    const medication = treatment?.medications || {};
    const stock = parseFloat(medication.stock_quantity) || 0;
    const dailyUsage = calculateTreatmentDailyUsage(treatment);

    const weeksRemaining = dailyUsage > 0 ? (stock / dailyUsage / 7) : Infinity;
    const isControlled = medication.is_controlled === true;
    const isContinuousUse = medication.is_continuous_use === true;
    const hasValidPrescription = !!prescriptionCounts?.[medication.id]?.count;

    if (isContinuousUse) {
        if (isControlled) {
            if (hasValidPrescription) {
                if (weeksRemaining <= 1) return 'bg-red-100 text-red-700';
                if (weeksRemaining <= 2) return 'bg-orange-100 text-orange-700';
                return 'bg-gray-100 text-gray-700';
            } else {
                if (weeksRemaining <= 1) return 'bg-red-100 text-red-700';
                if (weeksRemaining <= 3) return 'bg-orange-100 text-orange-700';
                return 'bg-gray-100 text-gray-700';
            }
        } else {
            // Não controlado de uso contínuo
            if (weeksRemaining <= 1) return 'bg-orange-100 text-orange-700';
            return 'bg-gray-100 text-gray-700';
        }
    }

    return 'bg-gray-100 text-gray-700';
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
    console.log('📊 loadDashboard() started');
    try {
        // Stats
        const stats = await DB.getDashboardStats();
        console.log('📊 Dashboard stats loaded:', stats);
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
        console.log('📊 Low stock alerts loaded:', lowStock.length);
        if (lowStock.length > 0) {
            const sections = {
                'SEM RECEITA': lowStock.filter(i => i.is_controlled && !i.has_valid_prescription),
                'COM RECEITA': lowStock.filter(i => i.is_controlled && i.has_valid_prescription),
                'NÃO CONTROLADOS': lowStock.filter(i => !i.is_controlled)
            };

            // Garante ordenação por estoque crescente dentro de cada seção
            Object.values(sections).forEach(list => list.sort((a, b) => a.stock_quantity - b.stock_quantity));

            safeSetHtml('low-stock-list', Object.entries(sections)
                .filter(([_, items]) => items.length > 0)
                .map(([title, items]) => `
                    <div class="mb-4 last:mb-0">
                        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">${title}</h4>
                        <div class="space-y-2">
                            ${items.map(item => `
                                <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p class="font-medium text-gray-800">${item.medication_name}</p>
                                        <p class="text-xs text-gray-500">${item.dependent_name}</p>
                                        <p class="text-xs text-amber-600">${Math.round(item.weeks_remaining)} semana(s) • ${item.stock_quantity} un. em estoque</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join(''));
        } else {
            safeSetHtml('low-stock-list', '<p class="text-gray-400 text-sm text-center py-4">Nenhum alerta no momento</p>');
        }

        // Expiring prescriptions
        const expiring = await DB.getExpiringPrescriptions();
        console.log('📊 Expiring prescriptions loaded:', expiring.length);
        if (expiring.length > 0) {
            safeSetHtml('expiring-prescriptions', expiring.map(item => {
                const days = item.days_until_expiration;
                const timeText = days === 0
                    ? 'Vence hoje'
                    : days === 1
                        ? 'Vence em 1 dia'
                        : `Vence em ${days} dias`;
                const profText = item.professional_name
                    ? (item.professional_specialty ? `${item.professional_name} (${item.professional_specialty})` : item.professional_name)
                    : '';
                const countText = item.prescription_count > 1
                    ? `${item.prescription_count} receitas`
                    : '1 receita';

                return `
                <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                        <p class="font-medium text-gray-800">${item.medication_name}</p>
                        <p class="text-xs text-gray-500">${item.dependent_name} • ${countText}</p>
                        ${profText ? `<p class="text-xs text-gray-400">👨‍⚕️ ${profText}</p>` : ''}
                        <p class="text-xs text-red-600">${timeText}</p>
                    </div>
                    <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Vencendo</span>
                </div>
                `;
            }).join(''));
        } else {
            safeSetHtml('expiring-prescriptions', '<p class="text-gray-400 text-sm text-center py-4">Nenhum receituário próximo do vencimento</p>');
        }

        // Today's schedule
        await loadTodaySchedule();
        console.log('📊 Today schedule loaded');

        // Last action
        await loadLastAction();
        console.log('📊 Last action loaded');

    } catch (error) {
        console.error('Error loading dashboard:', error);
    } finally {
        console.log('📊 loadDashboard() finished - hiding splash');
        hideSplashScreen();
    }
}

// ========== TODAY'S SCHEDULE ==========

let currentDoseSchedule = null;

function renderScheduleCard(schedule, dependentName, prescriptionCounts) {
    if (!schedule || !schedule.time) return '';

    const timeStr = schedule.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateLabel = schedule.time.toDateString() === new Date().toDateString()
        ? 'Hoje'
        : schedule.time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
    const scheduleId = schedule.scheduling.id;
    const now = new Date();
    const canSkip = now > schedule.time;

    const treatmentsHtml = schedule.treatments.map(t => {
        const med = t.medications || {};
        const name = med.name || t.medication_name || t.name || 'Medicamento';
        const stock = parseFloat(med.stock_quantity) || 0;
        const badgeClass = getStockBadgeClass(t, prescriptionCounts);
        return `
            <div class="flex items-center justify-between gap-3">
                <p class="text-sm text-gray-800 leading-relaxed">${name} (${formatDosage(t.dosage)} un.)</p>
                <span class="text-xs px-2 py-0.5 rounded-full ${badgeClass} flex-shrink-0">${i18n.t('dashboard.stockUnits', { units: formatDosage(stock) })}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="bg-gray-50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
                <div class="flex flex-col">
                    <p class="text-xs text-gray-500 mb-0.5">${dateLabel}${dependentName ? ` · <span class="font-medium text-sky-600">${dependentName}</span>` : ''}</p>
                    <p class="text-4xl font-bold text-sky-700 leading-none">${timeStr}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="showDoseActionModal('Taken', '${timeStr}', '${scheduleId}')" class="px-5 py-2 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors">
                        TOMAR
                    </button>
                    ${canSkip ? `
                    <button onclick="showDoseActionModal('Skipped', '${timeStr}', '${scheduleId}')" class="px-5 py-2 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 transition-colors">
                        PULAR
                    </button>
                    ` : ''}
                </div>
            </div>
            <div class="space-y-2">
                ${treatmentsHtml}
            </div>
        </div>
    `;
}

function renderLastActionCard(lastAction, dependentName) {
    if (!lastAction || !lastAction.scheduling) return '';

    const scheduling = lastAction.scheduling;
    const scheduleDate = (scheduling.schedule_date && scheduling.schedule_time)
        ? new Date(`${scheduling.schedule_date}T${scheduling.schedule_time}`)
        : null;
    const timeStr = scheduleDate
        ? scheduleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '--:--';
    const dateLabel = scheduleDate && scheduleDate.toDateString() === new Date().toDateString()
        ? 'Hoje'
        : (scheduleDate ? scheduleDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }) : '--');
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
            return `
                <div class="flex items-center justify-between gap-3">
                    <p class="text-sm text-gray-800 leading-relaxed">${name} (${formatDosage(dosage)} un.)</p>
                </div>
            `;
        }).join('')
        : '<p class="text-sm text-gray-400">Nenhuma medicação vinculada</p>';

    return `
        <div class="bg-gray-50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
                <div class="flex flex-col">
                    <p class="text-xs text-gray-500 mb-0.5">${dateLabel}${dependentName ? ` · <span class="font-medium text-sky-600">${dependentName}</span>` : ''}</p>
                    <p class="text-4xl font-bold text-sky-700 leading-none">${timeStr}</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <span class="text-xs px-2 py-0.5 rounded-full ${actionBadgeClass}">${actionLabel}</span>
                    <button onclick="revertLastDose()" class="px-4 py-1.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-colors">
                        REVERTER
                    </button>
                </div>
            </div>
            <div class="space-y-2">
                ${itemsHtml}
            </div>
        </div>
    `;
}

async function loadTodaySchedule() {
    const scheduleEl = document.getElementById('today-schedule');
    const currentDepId = AppState.getCurrentDependent();

    if (!currentDepId) {
        scheduleEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Selecione um dependente</p>';
        return;
    }

    try {
        let dependentsToShow;
        if (showAllDependentsDashboard) {
            dependentsToShow = await DB.getDependents();
        } else {
            const dep = AppState.dependents.find(d => d.id === currentDepId);
            dependentsToShow = dep ? [dep] : await DB.getDependents();
        }

        if (!dependentsToShow || dependentsToShow.length === 0) {
            scheduleEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Nenhum dependente encontrado</p>';
            return;
        }

        const cardsHtml = [];
        for (const dep of dependentsToShow) {
            const schedules = await DB.getNextDoseSchedules(dep.id, 1);
            if (schedules && schedules.length > 0) {
                const prescriptionCounts = await DB.getPrescriptionCountsByMedication(dep.id);
                cardsHtml.push(renderScheduleCard(schedules[0], dep.name, prescriptionCounts));
            }
        }

        if (cardsHtml.length === 0) {
            scheduleEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4" data-i18n="dashboard.noSchedule">Nenhum medicamento agendado</p>';
            return;
        }

        scheduleEl.innerHTML = cardsHtml.join('');

    } catch (error) {
        console.error('Error loading today schedule:', error);
        scheduleEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Erro ao carregar agenda</p>';
    }
}

async function loadLastAction() {
    const actionEl = document.getElementById('last-action');
    const currentDepId = AppState.getCurrentDependent();

    if (!currentDepId) {
        actionEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Selecione um dependente</p>';
        return;
    }

    try {
        let dependentsToShow;
        if (showAllDependentsDashboard) {
            dependentsToShow = await DB.getDependents();
        } else {
            const dep = AppState.dependents.find(d => d.id === currentDepId);
            dependentsToShow = dep ? [dep] : await DB.getDependents();
        }

        if (!dependentsToShow || dependentsToShow.length === 0) {
            actionEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Nenhum dependente encontrado</p>';
            return;
        }

        const cardsHtml = [];
        for (const dep of dependentsToShow) {
            const lastAction = await DB.getLastAction(dep.id);
            if (lastAction && lastAction.scheduling) {
                cardsHtml.push(renderLastActionCard(lastAction, dep.name));
            }
        }

        if (cardsHtml.length === 0) {
            actionEl.innerHTML = `<p class="text-gray-400 text-sm text-center py-4" data-i18n="dashboard.noLastAction">Nenhuma ação registrada</p>`;
            return;
        }

        actionEl.innerHTML = cardsHtml.join('');

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
        const dependent = AppState.dependents.find(d => d.id === schedule.dependent_id);
        const dependentName = dependent ? dependent.name : '';
        const timeStr = (schedule.schedule_date && schedule.schedule_time)
            ? new Date(`${schedule.schedule_date}T${schedule.schedule_time}`).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : '--:--';
        const dateStr = schedule.created_at
            ? new Date(schedule.created_at).toLocaleDateString('pt-BR')
            : '';
        const takenAtStr = schedule.taken_at
            ? new Date(schedule.taken_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : null;
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
                        <span class="text-xs text-gray-500">${formatDosage(dosage)} un.</span>
                    </div>
                `;
            }).join('')
            : '<p class="text-sm text-gray-400 py-2">Nenhuma medicação vinculada</p>';

        return `
            <div class="log-slide">
                <div class="text-center mb-4">
                    ${dependentName ? `<p class="text-sm font-medium text-sky-600 mb-1">${dependentName}</p>` : ''}
                    <p class="text-5xl font-bold text-sky-700">${timeStr}</p>
                    <p class="text-sm text-gray-400 mt-1">${dateStr}</p>
                    ${takenAtStr ? `<p class="text-xs text-gray-500 mt-1">Registrado em: ${takenAtStr}</p>` : ''}
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

async function showDoseActionModal(action, timeStr, scheduleId) {
    const scheduleData = await DB.getScheduleWithLinks(scheduleId);
    if (!scheduleData) return;

    const scheduling = scheduleData.scheduling;
    const [year, month, day] = scheduling.schedule_date.split('-').map(Number);
    const [hours, minutes] = scheduling.schedule_time.split(':').map(Number);
    const scheduleTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    currentDoseSchedule = { ...scheduleData, action, time: scheduleTime };

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
    scheduleTimeInput.value = scheduleTime.toISOString();
    actionTypeInput.value = action;

    const treatments = scheduleData.items
        .filter(l => l.treatments)
        .map(l => ({ ...l.treatments, dosage: l.dosage }));

    treatmentsEl.innerHTML = treatments.map(t => `
        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-2">
            <span class="font-medium text-gray-800">${t.medications?.name || t.medication_name || t.name || 'Medicamento'}</span>
            <span class="text-sm text-gray-500">${formatDosage(t.dosage || 0)} un.</span>
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

    const medications = await DB.getActiveMedications(depId);
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
            const isActive = med.is_active !== false;
            const opacityClass = isActive ? '' : 'opacity-60';
            const inactiveBadge = !isActive ? '<span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Inativo</span>' : '';
            const actionButton = isActive
                ? `<button class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center" onclick="event.stopPropagation(); deactivateMedication('${med.id}')" title="Desativar">
                    <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                   </button>`
                : `<button class="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center" onclick="event.stopPropagation(); reactivateMedication('${med.id}')" title="Reativar">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                   </button>`;

            return `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover ${opacityClass}" onclick="showMedicationDetail('${med.id}')">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800">${med.name}</h3>
                        <p class="text-sm text-gray-500">${med.active_ingredient || ''}</p>
                        <div class="flex items-center gap-2 mt-2 flex-wrap">
                            ${med.is_controlled ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Controlado</span>' : ''}
                            ${med.is_continuous_use ? '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Uso Contínuo</span>' : ''}
                            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${med.stock_quantity || 0} un.</span>
                            ${prescriptionCount > 0 ? `<span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">${prescriptionCount} receita${prescriptionCount > 1 ? 's' : ''} (${prescriptionUnits} un.)</span>` : ''}
                            ${inactiveBadge}
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <button class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center" onclick="event.stopPropagation(); editMedication('${med.id}')" title="Editar">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        ${actionButton}
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading medications:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar medicamentos</p>';
    }
}

async function loadLaboratoryOptions(selectedId = null) {
    const laboratories = await DB.getLaboratories();
    const select = document.querySelector('#form-medication select[name="laboratory_id"]');
    if (!select) return;

    select.innerHTML = '<option value="">' + i18n.t('medication.selectLaboratory') + '</option>' +
        laboratories.map(l => `<option value="${l.id}" ${l.id === selectedId ? 'selected' : ''}>${l.name}</option>`).join('') +
        `<option value="__new__">+ ${i18n.t('laboratory.addNew')}</option>`;
}

function handleLaboratorySelectChange(select) {
    if (select.value === '__new__') {
        select.value = '';
        const name = prompt(i18n.t('laboratory.promptName'));
        if (name && name.trim()) {
            DB.addLaboratory({ name: name.trim() }).then((lab) => {
                loadLaboratoryOptions(lab.id);
            }).catch((err) => {
                alert('Erro ao adicionar laboratório: ' + err.message);
            });
        }
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
    loadLaboratoryOptions();
    document.querySelector('#modal-medication h3').textContent = i18n.t('medication.addNew');
    openModal('modal-medication');
}

function handleMedicationSelectChange(select) {
    if (select.value === '__new__') {
        // Reset select to empty while modal opens
        select.value = '';
        openQuickAddMedication(select);
        return;
    }

    // Sempre resetar a programação ao trocar de medicamento
    resetTreatmentFrequency();
}

function handleTreatmentCategoryChange(select) {
    const categoryId = select.value;
    const subcategorySelect = document.querySelector('#form-treatment select[name="subcategory_id"]');
    if (!subcategorySelect) return;

    if (!categoryId) {
        subcategorySelect.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
        subcategorySelect.disabled = true;
        return;
    }

    const category = treatmentCategoriesCache.find(c => c.id === categoryId);
    const subcategories = category?.subcategories || [];

    subcategorySelect.innerHTML = '<option value="">Selecione uma subcategoria...</option>' +
        subcategories.map(sc => `<option value="${sc.id}">${sc.name}</option>`).join('');
    subcategorySelect.disabled = subcategories.length === 0;
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
    form.querySelector('[name="stock_quantity"]').value = medication.stock_quantity || 0;
    await loadLaboratoryOptions(medication.laboratory_id);

    document.querySelector('#modal-medication h3').textContent = i18n.t('medication.edit');
    openModal('modal-medication');
}

async function deactivateMedication(id) {
    event.stopPropagation();
    if (!confirm('Deseja desativar este medicamento?')) return;

    try {
        await DB.deactivateMedication(id);
        loadMedications();
        loadDashboard();
    } catch (error) {
        alert(error.message || 'Erro ao desativar medicamento');
    }
}

async function reactivateMedication(id) {
    event.stopPropagation();
    try {
        await DB.reactivateMedication(id);
        loadMedications();
        loadDashboard();
    } catch (error) {
        alert(error.message || 'Erro ao reativar medicamento');
    }
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
        let treatments = await DB.getTreatments(depId);

        if (!showInactiveTreatments) {
            treatments = treatments.filter(t => t.is_active !== false);
        }

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
            const categoryName = t.subcategories?.categories?.name || t.category_name || '';
            const subcategoryName = t.subcategories?.name || t.subcategory_name || '';
            const categoryText = categoryName && subcategoryName
                ? `${categoryName} > ${subcategoryName}`
                : (categoryName || subcategoryName || '');
            const startDateText = t.start_date ? new Date(t.start_date).toLocaleDateString('pt-BR') : '';
            const durationText = formatTreatmentDuration(t.start_date, t.end_date);

            let frequencyText = '';
            if (t.is_rescue) {
                frequencyText = `Medicação de resgate (${t.administration_notes || ''})`;
            } else if (t.schedule_type === 'weekly' && t.medication_times_on_treatment?.length > 0) {
                const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const grouped = {};
                t.medication_times_on_treatment.forEach(mt => {
                    if (!grouped[mt.day_of_week]) grouped[mt.day_of_week] = [];
                    grouped[mt.day_of_week].push(`${mt.time.substring(0, 5)} (${mt.dosage})`);
                });
                const daysText = Object.keys(grouped)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(day => `${dayLabels[day]}: ${grouped[day].join(', ')}`)
                    .join('; ');
                frequencyText = daysText;
            } else {
                frequencyText = `${t.dosage || 0}un. / ${t.frequency_hours || 0}h`;
            }

            const subtitleParts = [
                frequencyText,
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
                        ${categoryText ? `<p class="text-xs text-sky-600 font-medium mb-1">${categoryText}</p>` : ''}
                        <p class="text-sm text-gray-500">${subtitleParts.join(', ')}</p>
                    </div>
                    <div class="flex items-center gap-1">
                        ${t.is_active ? '<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Ativo</span>' : '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Encerrado</span>'}
                        <button onclick="editTreatment('${t.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center ml-1" title="Editar">
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deleteTreatment('${t.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center" title="Excluir">
                            <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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

    const [medications, professionals, treatments, categories] = await Promise.all([
        DB.getActiveMedications(depId),
        DB.getProfessionals(depId),
        DB.getTreatments(depId),
        DB.getCategories()
    ]);

    treatmentCategoriesCache = categories || [];

    const medSelect = document.querySelector('#form-treatment select[name="medication_id"]');
    const profSelect = document.querySelector('#form-treatment select[name="prescribed_by"]');
    const replacedSelect = document.querySelector('#form-treatment select[name="replaced_treatment_id"]');
    const replacedBySelect = document.querySelector('#form-treatment select[name="replaced_by_treatment_id"]');
    const categorySelect = document.querySelector('#form-treatment select[name="category_id"]');
    const subcategorySelect = document.querySelector('#form-treatment select[name="subcategory_id"]');

    if (medSelect) {
        medSelect.innerHTML = '<option value="">Selecione um medicamento...</option>' +
            medications.map(m => `<option value="${m.id}">${m.name}</option>`).join('') +
            `<option value="__new__">+ ${i18n.t('medication.addNew')}</option>`;
    }

    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Selecione uma categoria...</option>' +
            treatmentCategoriesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    if (subcategorySelect) {
        subcategorySelect.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
        subcategorySelect.disabled = true;
    }

    if (profSelect) {
        profSelect.innerHTML = '<option value="">Selecione um profissional...</option>' +
            professionals.map(p => `<option value="${p.id}">${p.name}${p.specialty ? ' - ' + p.specialty : ''}</option>`).join('') +
            `<option value="__new__">+ ${i18n.t('professional.addNew')}</option>`;
        profSelect.onchange = () => handleProfessionalSelectChange(profSelect);
    }

    const treatmentLabel = (t) => {
        const medName = t.medications?.name || t.medication_name || 'Tratamento';
        const start = t.start_date ? new Date(t.start_date).toLocaleDateString('pt-BR') : '';
        const end = t.end_date ? new Date(t.end_date).toLocaleDateString('pt-BR') : '';
        return `${medName}${start ? ' - ' + start : ''}${end ? ' → ' + end : ''}`;
    };

    const otherTreatments = treatments.filter(t => t.id !== currentEditingTreatmentId);
    const endedTreatments = otherTreatments.filter(t => t.end_date);
    const activeTreatments = otherTreatments.filter(t => !t.end_date && t.is_active !== false);

    if (replacedSelect) {
        replacedSelect.innerHTML = '<option value="">Nenhum</option>' +
            endedTreatments.map(t => `<option value="${t.id}">${treatmentLabel(t)}</option>`).join('');
    }

    if (replacedBySelect) {
        replacedBySelect.innerHTML = '<option value="">Nenhum</option>' +
            activeTreatments.map(t => `<option value="${t.id}">${treatmentLabel(t)}</option>`).join('');
    }
}

function toggleReplacedByVisibility() {
    const form = document.getElementById('form-treatment');
    if (!form) return;
    const wrapper = document.getElementById('replaced-by-treatment-wrapper');
    const endDate = form.querySelector('[name="end_date"]')?.value;
    if (wrapper) {
        wrapper.classList.toggle('hidden', !endDate);
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
let currentEditingProfessionalId = null;
let currentEditingCategoryId = null;
let currentEditingSubcategoryId = null;
let showInactiveTreatments = false;
let showOnlyValidPrescriptions = true;
let treatmentCategoriesCache = [];

// Estado temporário da programação de frequência no formulário de tratamento
let currentTreatmentFrequency = {
    schedule_type: 'periodic',
    frequency_hours: 8,
    first_dose_time: '',
    dosage: '',
    weeklyTimes: [], // { day_of_week, time, dosage }
    is_rescue: false
};

function resetTreatmentFrequency() {
    currentTreatmentFrequency = {
        schedule_type: 'periodic',
        frequency_hours: 8,
        first_dose_time: '',
        dosage: '',
        weeklyTimes: [],
        is_rescue: false
    };
    renderFrequencySummary();
}

function toggleShowInactiveTreatments() {
    const checkbox = document.getElementById('toggle-show-inactive-treatments');
    showInactiveTreatments = checkbox ? checkbox.checked : false;
    loadTreatments();
}

function toggleShowOnlyValidPrescriptions() {
    const checkbox = document.getElementById('toggle-show-only-valid-prescriptions');
    showOnlyValidPrescriptions = checkbox ? checkbox.checked : true;
    loadPrescriptions();
}

function showAddTreatment() {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    currentEditingTreatmentId = null;
    document.querySelector('#form-treatment').reset();
    resetTreatmentFrequency();
    loadTreatmentOptions();
    openModal('modal-treatment');
}

async function deleteTreatment(id) {
    if (!confirm('Tem certeza que deseja excluir este tratamento?')) return;

    try {
        await DB.deleteTreatment(id);
        loadTreatments();
        loadDashboard();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
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
    form.querySelector('[name="start_date"]').value = treatment.start_date || '';
    form.querySelector('[name="end_date"]').value = treatment.end_date || '';

    const categorySelect = form.querySelector('[name="category_id"]');
    const subcategorySelect = form.querySelector('[name="subcategory_id"]');
    if (subcategorySelect && treatment.subcategory_id && treatmentCategoriesCache) {
        for (const cat of treatmentCategoriesCache) {
            if (cat.subcategories?.some(sc => sc.id === treatment.subcategory_id)) {
                if (categorySelect) {
                    categorySelect.value = cat.id;
                    handleTreatmentCategoryChange(categorySelect);
                }
                break;
            }
        }
    }
    if (subcategorySelect) {
        subcategorySelect.value = treatment.subcategory_id || '';
    }

    form.querySelector('[name="treatment_goal"]').value = treatment.treatment_goal || '';
    form.querySelector('[name="admin_notes"]').value = treatment.administration_notes || treatment.admin_notes || '';
    form.querySelector('[name="is_active"]').checked = treatment.is_active !== false;
    form.querySelector('[name="replaced_treatment_id"]').value = treatment.replaced_treatment_id || '';
    form.querySelector('[name="replaced_by_treatment_id"]').value = treatment.replaced_by_treatment_id || '';
    toggleReplacedByVisibility();

    // Load frequency definition
    if (treatment.schedule_type === 'weekly') {
        const times = await DB.getTreatmentTimes(treatment.id);
        currentTreatmentFrequency = {
            schedule_type: 'weekly',
            frequency_hours: treatment.frequency_hours || 0,
            first_dose_time: treatment.first_dose_time || '',
            dosage: treatment.dosage || '',
            weeklyTimes: times.map(t => ({
                day_of_week: t.day_of_week,
                time: t.time,
                dosage: t.dosage
            })),
            is_rescue: false
        };
    } else if (treatment.schedule_type === 'rescue') {
        currentTreatmentFrequency = {
            schedule_type: 'rescue',
            frequency_hours: 0,
            first_dose_time: '',
            dosage: '',
            weeklyTimes: [],
            is_rescue: true
        };
    } else {
        currentTreatmentFrequency = {
            schedule_type: 'periodic',
            frequency_hours: treatment.frequency_hours || 8,
            first_dose_time: treatment.first_dose_time || '',
            dosage: treatment.dosage || '',
            weeklyTimes: [],
            is_rescue: false
        };
    }
    renderFrequencySummary();

    openModal('modal-treatment');
}

// ========== FREQUENCY MODAL ==========

function showFrequencyModal() {
    const form = document.getElementById('form-frequency');
    if (!form) return;

    form.reset();
    const scheduleType = currentTreatmentFrequency.schedule_type || 'periodic';
    form.querySelector(`[name="schedule_type"][value="${scheduleType}"]`).checked = true;
    form.querySelector('[name="frequency_hours"]').value = currentTreatmentFrequency.frequency_hours || 8;
    form.querySelector('[name="first_dose_time"]').value = currentTreatmentFrequency.first_dose_time || '';
    form.querySelector('[name="dosage"]').value = currentTreatmentFrequency.dosage || '';

    const timeRows = document.getElementById('frequency-time-rows');
    timeRows.innerHTML = '';

    // Uncheck all day checkboxes first
    form.querySelectorAll('[name="day_of_week"]').forEach(cb => cb.checked = false);

    if (currentTreatmentFrequency.weeklyTimes && currentTreatmentFrequency.weeklyTimes.length > 0) {
        // Group times by unique time+dosage and collect days
        const grouped = {};
        currentTreatmentFrequency.weeklyTimes.forEach(slot => {
            const key = `${slot.time}|${slot.dosage}`;
            if (!grouped[key]) {
                grouped[key] = { time: slot.time, dosage: slot.dosage, days: [] };
            }
            grouped[key].days.push(slot.day_of_week);
        });

        Object.values(grouped).forEach(group => addFrequencyTimeRow(group));

        // Mark days
        form.querySelectorAll('[name="day_of_week"]').forEach(cb => {
            cb.checked = Object.values(grouped).some(g => g.days.includes(parseInt(cb.value)));
        });
    } else if (scheduleType !== 'rescue') {
        addFrequencyTimeRow();
    }

    toggleFrequencyFields(scheduleType);
    openModal('modal-frequency');
}

function toggleFrequencyFields(scheduleType) {
    const weeklyFields = document.getElementById('weekly-fields');
    const periodicFields = document.getElementById('periodic-fields');
    if (!weeklyFields || !periodicFields) return;

    if (scheduleType === 'weekly') {
        weeklyFields.classList.remove('hidden');
        periodicFields.classList.add('hidden');
    } else if (scheduleType === 'rescue') {
        weeklyFields.classList.add('hidden');
        periodicFields.classList.add('hidden');
    } else {
        weeklyFields.classList.add('hidden');
        periodicFields.classList.remove('hidden');
    }
}

function addFrequencyTimeRow(slot = null) {
    const container = document.getElementById('frequency-time-rows');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'flex items-center gap-2';
    row.innerHTML = `
        <input type="time" class="frequency-time flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none" value="${slot ? slot.time : ''}">
        <input type="number" min="0.1" step="0.1" class="frequency-dosage w-20 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none" value="${slot ? slot.dosage : ''}" placeholder="Qtd">
        <button type="button" onclick="removeFrequencyTimeRow(this)" class="text-red-400 hover:text-red-600 px-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
    `;
    container.appendChild(row);
}

function removeFrequencyTimeRow(button) {
    const row = button.closest('div');
    if (row) row.remove();
}

function renderFrequencySummary() {
    const card = document.getElementById('frequency-summary-card');
    const content = document.getElementById('frequency-summary-content');
    if (!card || !content) return;

    card.classList.remove('hidden');

    if (currentTreatmentFrequency.schedule_type === 'rescue') {
        content.innerHTML = `<p class="text-amber-600 font-medium">${i18n.t('treatment.rescueMedication')}</p>`;
    } else if (currentTreatmentFrequency.schedule_type === 'weekly') {
        const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const grouped = {};
        (currentTreatmentFrequency.weeklyTimes || []).forEach(slot => {
            if (!grouped[slot.day_of_week]) grouped[slot.day_of_week] = [];
            grouped[slot.day_of_week].push(`${slot.time} (${slot.dosage})`);
        });

        const lines = Object.keys(grouped)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(day => `<p><span class="font-medium">${dayLabels[day]}:</span> ${grouped[day].join(', ')}</p>`);

        content.innerHTML = lines.length > 0 ? lines.join('') : '<p class="text-gray-400">Nenhum horário definido</p>';
    } else {
        const dosage = parseFloat(currentTreatmentFrequency.dosage) || 0;
        const hours = parseInt(currentTreatmentFrequency.frequency_hours) || 0;
        const firstDose = currentTreatmentFrequency.first_dose_time || '';

        if (dosage > 0 && hours > 0 && firstDose) {
            content.innerHTML = `<p>${dosage} un. a cada ${hours} horas, primeira dose às ${firstDose}</p>`;
        } else {
            content.innerHTML = `<p class="text-gray-400">Clique em "Definir frequência" para configurar a programação</p>`;
        }
    }
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

function showAddProfessional(callback) {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    currentEditingProfessionalId = null;
    window._professionalSaveCallback = callback || null;
    document.getElementById('form-professional').reset();
    document.querySelector('#modal-professional h3').textContent = i18n.t('professional.addNew');
    openModal('modal-professional');
}

function handleProfessionalSelectChange(select) {
    if (select.value === '__new__') {
        select.value = '';
        openQuickAddProfessional(select);
    }
}

function openQuickAddProfessional(targetSelect) {
    window._pendingProfessionalSelect = targetSelect;
    showAddProfessional((newProfessional) => {
        if (window._pendingProfessionalSelect) {
            const select = window._pendingProfessionalSelect;
            const option = document.createElement('option');
            option.value = newProfessional.id;
            option.textContent = newProfessional.specialty
                ? `${newProfessional.name} (${newProfessional.specialty})`
                : newProfessional.name;

            const newOption = select.querySelector('option[value="__new__"]');
            if (newOption) {
                select.insertBefore(option, newOption);
            } else {
                select.appendChild(option);
            }

            select.value = newProfessional.id;
            window._pendingProfessionalSelect = null;
        }
    });
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
        let prescriptions = await DB.getPrescriptions(depId);

        if (showOnlyValidPrescriptions) {
            prescriptions = prescriptions.filter(p => (p.status || 'Valid') === 'Valid');
        }

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
            const laboratoryName = p.medications?.laboratories?.name;
            const profName = p.healthcare_professionals?.name || p.professional_name || '';
            const profSpecialty = p.healthcare_professionals?.specialty || '';
            const profText = profName ? (profSpecialty ? `${profName} (${profSpecialty})` : profName) : '';
            const expDate = p.expiration_date ? new Date(p.expiration_date).toLocaleDateString('pt-BR') : 'Não informada';
            const usedDate = p.used_date ? new Date(p.used_date).toLocaleDateString('pt-BR') : '';
            const status = p.status || 'Valid';
            const canUse = status === 'Valid';

            return `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover">
                <div class="flex items-start justify-between mb-1">
                    <div class="flex-1 pr-2">
                        <h3 class="text-lg font-bold text-gray-800">${medName}</h3>
                        ${laboratoryName ? `<p class="text-sm text-gray-500">🏭 ${laboratoryName}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs px-2 py-0.5 rounded-full ${statusClasses[status] || statusClasses['Valid']}">${statusLabels[status] || status}</span>
                        <button onclick="editPrescription('${p.id}')" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600" title="Editar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deletePrescription('${p.id}')" class="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600" title="Excluir">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
                <p class="text-base text-gray-600 mb-2">${p.units || 0} unidades</p>
                ${profText ? `<p class="text-sm text-gray-500 mb-1">👨‍⚕️ ${profText}</p>` : ''}
                <div class="flex items-center justify-between mt-2">
                    <p class="text-sm text-gray-500">🗓️ ${status === 'Used' && usedDate ? `Utilizado em ${usedDate}` : (p.expiration_date ? `Vence em ${expDate}` : 'Sem data de validade')}</p>
                    ${canUse ? `<button onclick="showUsePrescriptionModal('${p.id}')" class="px-5 py-2 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors">UTILIZAR</button>` : ''}
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
        DB.getActiveMedications(depId),
        DB.getProfessionals(depId)
    ]);

    const medSelect = document.querySelector('#form-prescription [name="medication_id"]');
    const profSelect = document.querySelector('#form-prescription [name="prescribed_by"]');

    medSelect.innerHTML = '<option value="">Selecione um medicamento...</option>' +
        medications.map(m => `<option value="${m.id}">${m.name}</option>`).join('') +
        `<option value="__new__">+ ${i18n.t('medication.addNew')}</option>`;

    profSelect.innerHTML = '<option value="">Selecione um profissional...</option>' +
        professionals.map(p => `<option value="${p.id}">${p.name}${p.specialty ? ` (${p.specialty})` : ''}</option>`).join('') +
        `<option value="__new__">+ ${i18n.t('professional.addNew')}</option>`;
    profSelect.onchange = () => handleProfessionalSelectChange(profSelect);
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

let currentUsePrescriptionId = null;

async function showUsePrescriptionModal(id) {
    event.stopPropagation();
    const depId = AppState.getCurrentDependent();
    if (!depId) return;

    const prescriptions = await DB.getPrescriptions(depId);
    const prescription = prescriptions.find(p => p.id === id);
    if (!prescription) {
        alert('Receituário não encontrado');
        return;
    }

    currentUsePrescriptionId = id;
    document.getElementById('use-prescription-medication').textContent = prescription.medications?.name || prescription.medication_name || 'Medicamento';
    document.getElementById('use-prescription-units').textContent = `${prescription.units || 0} unidades`;
    openModal('modal-use-prescription');
}

async function confirmUsePrescription() {
    if (!currentUsePrescriptionId) return;

    try {
        await DB.usePrescription(currentUsePrescriptionId);
        currentUsePrescriptionId = null;
        closeModal('modal-use-prescription');
        loadPrescriptions();
        loadDashboard();
    } catch (error) {
        alert('Erro ao utilizar receituário: ' + error.message);
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
        professionals.map(p => `<option value="${p.id}">${p.name}${p.specialty ? ` (${p.specialty})` : ''}</option>`).join('') +
        `<option value="__new__">+ ${i18n.t('professional.addNew')}</option>`;
    profSelect.onchange = () => handleProfessionalSelectChange(profSelect);
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

// ========== CATEGORIES ==========

async function loadCategories() {
    const listEl = document.getElementById('categories-list');
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
        const categories = await DB.getCategories();

        if (categories.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl mb-2 block">🏷️</span>
                    <p class="text-gray-400" data-i18n="common.noData">Nenhum dado encontrado</p>
                    <p class="text-sm text-gray-400 mt-1" data-i18n="category.noData">Adicione a primeira categoria</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = categories.map(cat => {
            const subcategories = cat.subcategories || [];
            return `
            <div class="bg-white rounded-xl p-4 shadow-sm card-hover">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 pr-2">
                        <h3 class="font-semibold text-gray-800">${cat.name}</h3>
                        ${subcategories.length > 0 ? `
                            <div class="mt-2 pl-3 border-l-2 border-gray-200 space-y-1">
                                ${subcategories.map(sub => `
                                    <div class="flex items-center justify-between">
                                        <p class="text-sm text-gray-600">${sub.name}</p>
                                        <div class="flex items-center gap-1">
                                            <button onclick="editSubcategory('${sub.id}', '${cat.id}')" class="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center" title="Editar">
                                                <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </button>
                                            <button onclick="deleteSubcategory('${sub.id}')" class="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center" title="Excluir">
                                                <svg class="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p class="text-sm text-gray-400 mt-1" data-i18n="category.noSubcategories">Nenhuma subcategoria</p>'}
                    </div>
                    <div class="flex items-center gap-1">
                        <button onclick="showAddSubcategory('${cat.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center" title="Adicionar subcategoria">
                            <svg class="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                        <button onclick="editCategory('${cat.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center ml-1" title="Editar">
                            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deleteCategory('${cat.id}')" class="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center" title="Excluir">
                            <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading categories:', error);
        listEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar categorias</p>';
    }
}

function showAddCategory() {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    currentEditingCategoryId = null;
    document.getElementById('form-category').reset();
    document.querySelector('#modal-category h3').textContent = i18n.t('category.addNew');
    openModal('modal-category');
}

async function editCategory(id) {
    event.stopPropagation();

    const categories = await DB.getCategories();
    const category = categories.find(c => c.id === id);
    if (!category) {
        alert('Categoria não encontrada');
        return;
    }

    currentEditingCategoryId = id;
    const form = document.getElementById('form-category');
    form.querySelector('[name="name"]').value = category.name || '';

    document.querySelector('#modal-category h3').textContent = i18n.t('category.edit');
    openModal('modal-category');
}

async function deleteCategory(id) {
    const categories = await DB.getCategories();
    const category = categories.find(c => c.id === id);
    const subcategories = category?.subcategories || [];
    const subCount = subcategories.length;

    let message = i18n.t('category.deleteConfirm');
    if (subCount > 0) {
        message = i18n.t('category.deleteConfirmWithSubcategories', { count: subCount });
    }

    if (!confirm(message)) return;

    try {
        if (subcategories.length > 0) {
            await Promise.all(subcategories.map(sub => DB.deleteSubcategory(sub.id)));
        }
        await DB.deleteCategory(id);
        loadCategories();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

async function loadSubcategoryOptions(selectedCategoryId = null) {
    const categories = await DB.getCategories();
    const select = document.querySelector('#form-subcategory select[name="category_id"]');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione uma categoria...</option>' +
        categories.map(c => `<option value="${c.id}" ${c.id === selectedCategoryId ? 'selected' : ''}>${c.name}</option>`).join('');
}

function showAddSubcategory(categoryId = null) {
    if (!AppState.getCurrentDependent()) {
        alert('Selecione um dependente primeiro');
        return;
    }
    currentEditingSubcategoryId = null;
    document.getElementById('form-subcategory').reset();
    loadSubcategoryOptions(categoryId);
    document.querySelector('#modal-subcategory h3').textContent = i18n.t('subcategory.addNew');
    openModal('modal-subcategory');
}

async function editSubcategory(id, categoryId) {
    event.stopPropagation();

    const categories = await DB.getCategories();
    const subcategory = categories.flatMap(c => c.subcategories || []).find(s => s.id === id);
    if (!subcategory) {
        alert('Subcategoria não encontrada');
        return;
    }

    currentEditingSubcategoryId = id;
    const form = document.getElementById('form-subcategory');
    await loadSubcategoryOptions(subcategory.category_id || categoryId);
    form.querySelector('[name="category_id"]').value = subcategory.category_id || categoryId || '';
    form.querySelector('[name="name"]').value = subcategory.name || '';

    document.querySelector('#modal-subcategory h3').textContent = i18n.t('subcategory.edit');
    openModal('modal-subcategory');
}

async function deleteSubcategory(id) {
    if (!confirm('Tem certeza que deseja excluir esta subcategoria?')) return;

    try {
        await DB.deleteSubcategory(id);
        loadCategories();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

// ========== INVENTORY UPDATE ==========

async function loadInventoryUpdate() {
    const containerEl = document.getElementById('inventory-update-container');
    const depId = AppState.getCurrentDependent();

    if (!depId) {
        containerEl.innerHTML = `
            <div class="text-center py-8">
                <span class="text-4xl mb-2 block">👤</span>
                <p class="text-gray-500">Selecione um dependente primeiro</p>
            </div>
        `;
        return;
    }

    containerEl.innerHTML = '<div class="skeleton h-20 rounded-xl"></div>'.repeat(3);

    try {
        const medications = await DB.getActiveMedications(depId);

        if (medications.length === 0) {
            containerEl.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl mb-2 block">💊</span>
                    <p class="text-gray-400" data-i18n="common.noData">Nenhum dado encontrado</p>
                    <p class="text-sm text-gray-400 mt-1" data-i18n="inventoryUpdate.noData">Adicione o primeiro medicamento</p>
                </div>
            `;
            return;
        }

        const rows = medications.map(med => {
            const lastUpdated = med.stock_last_updated
                ? new Date(med.stock_last_updated).toLocaleString(i18n.getLanguage())
                : '-';
            return `
            <tr class="border-b border-gray-100 last:border-b-0" data-med-id="${med.id}" data-original-stock="${med.stock_quantity || 0}">
                <td class="px-4 py-3">
                    <div class="font-medium text-gray-800">${med.name}</div>
                    ${med.active_ingredient ? `<div class="text-xs text-gray-500">${med.active_ingredient}</div>` : ''}
                </td>
                <td class="px-4 py-3 w-24">
                    <input type="number" min="0" step="1" value="${med.stock_quantity || 0}"
                        class="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none text-right"
                        onchange="markInventoryRowChanged(this)">
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    ${lastUpdated}
                </td>
            </tr>
            `;
        }).join('');

        containerEl.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left font-semibold text-gray-700" data-i18n="inventoryUpdate.medication">Medicamento</th>
                            <th class="px-4 py-3 text-right font-semibold text-gray-700" data-i18n="medication.stockQuantity">Estoque</th>
                            <th class="px-4 py-3 text-left font-semibold text-gray-700" data-i18n="inventoryUpdate.lastUpdated">Última Atualização</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('btn-save-inventory').disabled = true;
        i18n.refreshUI();

    } catch (error) {
        console.error('Error loading inventory update:', error);
        containerEl.innerHTML = '<p class="text-center text-red-500 py-4">Erro ao carregar medicamentos</p>';
    }
}

function markInventoryRowChanged(input) {
    const row = input.closest('tr');
    const originalStock = parseInt(row.dataset.originalStock) || 0;
    const currentStock = parseInt(input.value) || 0;

    if (currentStock !== originalStock) {
        row.classList.add('bg-yellow-50');
    } else {
        row.classList.remove('bg-yellow-50');
    }

    const hasChanges = document.querySelector('#inventory-update-container tbody tr.bg-yellow-50') !== null;
    document.getElementById('btn-save-inventory').disabled = !hasChanges;
}

async function saveInventoryUpdate() {
    const rows = document.querySelectorAll('#inventory-update-container tbody tr.bg-yellow-50');
    if (rows.length === 0) return;

    const btn = document.getElementById('btn-save-inventory');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = i18n.t('common.loading');

    const errors = [];

    for (const row of rows) {
        const id = row.dataset.medId;
        const input = row.querySelector('input[type="number"]');
        const stockQuantity = parseInt(input.value) || 0;

        try {
            await DB.updateMedication(id, { stock_quantity: stockQuantity });
        } catch (error) {
            console.error(`Error updating medication ${id}:`, error);
            errors.push({ name: row.querySelector('td:first-child .font-medium').textContent });
        }
    }

    if (errors.length > 0) {
        alert(i18n.t('inventoryUpdate.saveError') + '\n' + errors.map(e => `- ${e.name}`).join('\n'));
    } else {
        alert(i18n.t('inventoryUpdate.saveSuccess'));
    }

    await loadInventoryUpdate();
    loadDashboard();
    loadMedications();
    btn.textContent = originalText;
}

// ========== FORM HANDLERS ==========

document.addEventListener('DOMContentLoaded', () => {
    // Dependent form
    const depForm = document.getElementById('form-dependent');
    if (depForm) {
        depForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(depForm);
            const id = formData.get('id');
            const dependent = {
                name: formData.get('name'),
                date_of_birth: formData.get('date_of_birth') || null,
                relationship: formData.get('relationship') || null,
                notes: formData.get('notes') || null
            };

            try {
                let savedDep;
                if (id) {
                    savedDep = await DB.updateDependent(id, dependent);
                } else {
                    savedDep = await DB.addDependent(dependent);
                }

                closeModal('modal-dependent');
                depForm.reset();

                // Atualizar lista
                await loadDependents();

                // Selecionar o dependente (novo ou atual)
                if (!id || AppState.getCurrentDependent() === id) {
                    selectDependent(savedDep.id);
                }

                // Recarregar página de gerenciamento se estiver aberta
                if (document.getElementById('page-dependents')?.classList.contains('active')) {
                    loadDependentsManagement();
                }

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
                laboratory_id: formData.get('laboratory_id') || null,
                is_controlled: formData.has('is_controlled'),
                is_continuous_use: formData.has('is_continuous_use'),
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
                if (error.message === 'INACTIVE_MEDICATION_EXISTS' && error.existingMedication) {
                    if (confirm(`Já existe um medicamento inativo chamado "${error.existingMedication.name}". Deseja reativá-lo?`)) {
                        try {
                            await DB.reactivateMedication(error.existingMedication.id);
                            const reactivated = await DB.getMedication(error.existingMedication.id);
                            if (window._medicationSaveCallback) {
                                window._medicationSaveCallback(reactivated);
                                window._medicationSaveCallback = null;
                            }
                            closeModal('modal-medication');
                            medForm.reset();
                            loadMedications();
                            loadDashboard();
                        } catch (reactivateError) {
                            alert('Erro ao reativar: ' + reactivateError.message);
                        }
                    }
                } else {
                    alert('Erro ao salvar: ' + error.message);
                }
            }
        });
    }

    // Treatment form
    const treatmentForm = document.getElementById('form-treatment');
    if (treatmentForm) {
        treatmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(treatmentForm);
            const isWeekly = currentTreatmentFrequency.schedule_type === 'weekly';
            const isRescue = currentTreatmentFrequency.schedule_type === 'rescue';

            if (isRescue) {
                const adminNotes = formData.get('admin_notes');
                if (!adminNotes || !adminNotes.trim()) {
                    alert('Para tratamentos de resgate, informe no campo Observações de Administração a condição de uso (Ex. Em caso de dor aguda)');
                    return;
                }
            }

            const treatment = {
                dependent_id: AppState.getCurrentDependent(),
                medication_id: formData.get('medication_id'),
                prescribed_by: formData.get('prescribed_by') || null,
                schedule_type: currentTreatmentFrequency.schedule_type || 'periodic',
                dosage: isRescue
                    ? 0
                    : (isWeekly
                        ? (currentTreatmentFrequency.weeklyTimes[0]?.dosage || 0)
                        : (parseFloat(currentTreatmentFrequency.dosage) || 0)),
                frequency_hours: isRescue || isWeekly
                    ? 0
                    : (parseInt(currentTreatmentFrequency.frequency_hours) || 0),
                first_dose_time: isRescue || isWeekly
                    ? null
                    : (currentTreatmentFrequency.first_dose_time || null),
                start_date: formData.get('start_date') || new Date().toISOString().split('T')[0],
                end_date: formData.get('end_date') || null,
                replaced_treatment_id: formData.get('replaced_treatment_id') || null,
                replaced_by_treatment_id: formData.get('end_date')
                    ? (formData.get('replaced_by_treatment_id') || null)
                    : null,
                treatment_goal: formData.get('treatment_goal') || null,
                administration_notes: formData.get('admin_notes') || null,
                //category_id: formData.get('category_id') || null,
                subcategory_id: formData.get('subcategory_id') || null,
                is_active: formData.has('is_active'),
                is_rescue: isRescue
            };

            try {
                let savedTreatment;
                if (currentEditingTreatmentId) {
                    savedTreatment = await DB.updateTreatment(currentEditingTreatmentId, treatment);
                } else {
                    savedTreatment = await DB.addTreatment(treatment);
                }

                // Persist weekly times
                if (isWeekly) {
                    await DB.updateTreatmentTimes(savedTreatment.id, currentTreatmentFrequency.weeklyTimes);
                } else if (currentEditingTreatmentId) {
                    // Clear any existing weekly times when switching to periodic or rescue
                    await DB.updateTreatmentTimes(savedTreatment.id, []);
                }

                currentEditingTreatmentId = null;
                closeModal('modal-treatment');
                treatmentForm.reset();
                resetTreatmentFrequency();
                loadTreatments();
                loadDashboard();
                scrollPageToTop();

            } catch (error) {
                alert('Erro ao salvar: ' + error.message);
            }
        });
    }

    // Frequency form
    const frequencyForm = document.getElementById('form-frequency');
    if (frequencyForm) {
        frequencyForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(frequencyForm);
            const scheduleType = formData.get('schedule_type') || 'periodic';

            if (scheduleType === 'rescue') {
                currentTreatmentFrequency = {
                    schedule_type: 'rescue',
                    frequency_hours: 0,
                    first_dose_time: '',
                    dosage: '',
                    weeklyTimes: [],
                    is_rescue: true
                };
            } else if (scheduleType === 'weekly') {
                const selectedDays = Array.from(frequencyForm.querySelectorAll('[name="day_of_week"]:checked')).map(cb => parseInt(cb.value));
                if (selectedDays.length === 0) {
                    alert('Selecione pelo menos um dia da semana.');
                    return;
                }

                const rows = document.querySelectorAll('#frequency-time-rows > div');
                const times = [];
                let hasEmptyTime = false;
                rows.forEach(row => {
                    const time = row.querySelector('.frequency-time').value;
                    const dosage = parseFloat(row.querySelector('.frequency-dosage').value) || 0;
                    if (time) {
                        if (dosage <= 0) {
                            alert('Informe uma dosagem maior que zero para cada horário.');
                            return;
                        }
                        selectedDays.forEach(day => {
                            times.push({ day_of_week: day, time, dosage });
                        });
                    } else {
                        hasEmptyTime = true;
                    }
                });

                if (times.length === 0) {
                    if (hasEmptyTime) {
                        alert('Informe pelo menos um horário.');
                    } else {
                        alert('Adicione pelo menos um horário.');
                    }
                    return;
                }

                currentTreatmentFrequency = {
                    schedule_type: 'weekly',
                    frequency_hours: 0,
                    first_dose_time: '',
                    dosage: '',
                    weeklyTimes: times,
                    is_rescue: false
                };
            } else {
                const frequencyHours = parseInt(formData.get('frequency_hours')) || 0;
                const firstDoseTime = formData.get('first_dose_time') || '';
                const dosage = parseFloat(formData.get('dosage')) || 0;

                if (frequencyHours <= 0) {
                    alert('Informe a frequência em horas.');
                    return;
                }
                if (!firstDoseTime) {
                    alert('Informe o horário da primeira dose.');
                    return;
                }
                if (dosage <= 0) {
                    alert('Informe a dosagem.');
                    return;
                }

                currentTreatmentFrequency = {
                    schedule_type: 'periodic',
                    frequency_hours: frequencyHours,
                    first_dose_time: firstDoseTime,
                    dosage: dosage,
                    weeklyTimes: [],
                    is_rescue: false
                };
            }

            renderFrequencySummary();
            closeModal('modal-frequency');
        });

        // Toggle fields when schedule type changes
        frequencyForm.querySelectorAll('[name="schedule_type"]').forEach(radio => {
            radio.addEventListener('change', (e) => toggleFrequencyFields(e.target.value));
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
                const savedProfessional = await DB.addProfessional(professional);

                if (window._professionalSaveCallback) {
                    window._professionalSaveCallback(savedProfessional);
                    window._professionalSaveCallback = null;
                }

                currentEditingProfessionalId = null;
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

    // Category form
    const categoryForm = document.getElementById('form-category');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(categoryForm);
            const category = {
                name: formData.get('name')
            };

            try {
                if (currentEditingCategoryId) {
                    await DB.updateCategory(currentEditingCategoryId, category);
                } else {
                    await DB.addCategory(category);
                }
                currentEditingCategoryId = null;
                closeModal('modal-category');
                categoryForm.reset();
                loadCategories();
                scrollPageToTop();

            } catch (error) {
                alert('Erro ao salvar: ' + error.message);
            }
        });
    }

    // Subcategory form
    const subcategoryForm = document.getElementById('form-subcategory');
    if (subcategoryForm) {
        subcategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(subcategoryForm);
            const subcategory = {
                category_id: formData.get('category_id'),
                name: formData.get('name')
            };

            try {
                if (currentEditingSubcategoryId) {
                    await DB.updateSubcategory(currentEditingSubcategoryId, subcategory);
                } else {
                    await DB.addSubcategory(subcategory);
                }
                currentEditingSubcategoryId = null;
                closeModal('modal-subcategory');
                subcategoryForm.reset();
                loadCategories();
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
                    currentDoseSchedule.scheduling.id,
                    currentDoseSchedule.action,
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
    const btn = document.querySelector('button[onclick="exportData()"]');
    const originalText = btn ? btn.textContent : '📥 Exportar para JSON';

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Exportando...';
    }

    try {
        const dependents = await DB.getDependents();
        const user = Auth.getUser();

        // Buscar dados de cada dependente em paralelo
        const dependentsWithData = await Promise.all(
            dependents.map(async (dependent) => {
                const [
                    medications,
                    professionals,
                    treatments,
                    prescriptions,
                    symptoms,
                    procedures
                ] = await Promise.all([
                    DB.getMedications(dependent.id),
                    DB.getProfessionals(dependent.id),
                    DB.getTreatments(dependent.id),
                    DB.getPrescriptions(dependent.id),
                    DB.getSymptoms(dependent.id),
                    DB.getProcedures(dependent.id)
                ]);

                return {
                    ...dependent,
                    medications,
                    professionals,
                    treatments,
                    prescriptions,
                    symptoms,
                    procedures
                };
            })
        );

        const data = {
            app: 'FarmaPocket',
            version: CONFIG.APP_VERSION || '2.0',
            exportedAt: new Date().toISOString(),
            user: user ? {
                id: user.id,
                email: user.email,
                name: Auth.getUserName(),
                provider: user.app_metadata?.provider || 'google'
            } : null,
            summary: {
                totalDependents: dependents.length,
                totalMedications: dependentsWithData.reduce((sum, d) => sum + (d.medications?.length || 0), 0),
                totalTreatments: dependentsWithData.reduce((sum, d) => sum + (d.treatments?.length || 0), 0),
                totalPrescriptions: dependentsWithData.reduce((sum, d) => sum + (d.prescriptions?.length || 0), 0),
                totalSymptoms: dependentsWithData.reduce((sum, d) => sum + (d.symptoms?.length || 0), 0),
                totalProcedures: dependentsWithData.reduce((sum, d) => sum + (d.procedures?.length || 0), 0)
            },
            dependents: dependentsWithData
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `farma-pocket-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ Data exported successfully');

    } catch (error) {
        console.error('❌ Export error:', error);
        alert('Erro ao exportar: ' + (error.message || 'Tente novamente.'));
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
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
            if (!hasSeenTour()) {
                navigateTo('tour');
            } else {
                showSplashScreen();
                loadDashboard();
            }
        });

        // Timeout de segurança para esconder a splash caso algo trave
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash && !splash.classList.contains('opacity-0')) {
                console.warn('⏱️ Splash screen safety timeout triggered');
                hideSplashScreen();
            }
        }, 10000);
    });
});

// Expor funções globais
window.AppState = AppState;
window.loadDashboard = loadDashboard;
window.navigateTo = navigateTo;
window.selectDependent = selectDependent;
window.showAddDependent = showAddDependent;
window.editDependent = editDependent;
window.loadDependentsManagement = loadDependentsManagement;
window.showAddMedication = showAddMedication;
window.editMedication = editMedication;
window.deactivateMedication = deactivateMedication;
window.reactivateMedication = reactivateMedication;
window.handleMedicationSelectChange = handleMedicationSelectChange;
window.handleTreatmentCategoryChange = handleTreatmentCategoryChange;
window.showAddTreatment = showAddTreatment;
window.editTreatment = editTreatment;
window.deleteTreatment = deleteTreatment;
window.showFrequencyModal = showFrequencyModal;
window.addFrequencyTimeRow = addFrequencyTimeRow;
window.removeFrequencyTimeRow = removeFrequencyTimeRow;
window.showAddProfessional = showAddProfessional;
window.handleProfessionalSelectChange = handleProfessionalSelectChange;
window.showAddPrescription = showAddPrescription;
window.editPrescription = editPrescription;
window.deletePrescription = deletePrescription;
window.showUsePrescriptionModal = showUsePrescriptionModal;
window.confirmUsePrescription = confirmUsePrescription;
window.togglePrescriptionUsedDate = togglePrescriptionUsedDate;
window.toggleShowAllDependents = toggleShowAllDependents;
window.showActivityLog = showActivityLog;
window.showDoseActionModal = showDoseActionModal;
window.addExtraMedicationRow = addExtraMedicationRow;
window.revertLastDose = revertLastDose;
window.goToLogSlide = goToLogSlide;
window.handleLogTouchStart = handleLogTouchStart;
window.handleLogTouchEnd = handleLogTouchEnd;
window.skipTour = skipTour;
window.nextTourSlide = nextTourSlide;
window.prevTourSlide = prevTourSlide;
window.goToTourSlide = goToTourSlide;
window.handleTourTouchStart = handleTourTouchStart;
window.handleTourTouchEnd = handleTourTouchEnd;
window.closeModal = closeModal;
window.exportData = exportData;
