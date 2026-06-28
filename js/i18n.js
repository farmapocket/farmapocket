// ============================================================
// FARMAPOCKET v2 - Internationalization Layer (i18n)
// Supports: English (en), Portuguese (pt-BR), Spanish (es)
// ============================================================

const i18n = {
    currentLang: localStorage.getItem('farma-pocket-lang') || 'pt-BR',

    languages: {
        'en': 'English',
        'pt-BR': 'Português (BR)',
        'es': 'Español'
    },

    translations: {
        // COMMON
        'app.name': { 'en': 'FarmaPocket', 'pt-BR': 'FarmaPocket', 'es': 'FarmaPocket' },
        'app.tagline': { 'en': 'Your Personal Medication Manager', 'pt-BR': 'Seu Gerenciador Pessoal de Medicamentos', 'es': 'Tu Gestor Personal de Medicamentos' },
        'common.save': { 'en': 'Save', 'pt-BR': 'Salvar', 'es': 'Guardar' },
        'common.cancel': { 'en': 'Cancel', 'pt-BR': 'Cancelar', 'es': 'Cancelar' },
        'common.delete': { 'en': 'Delete', 'pt-BR': 'Excluir', 'es': 'Eliminar' },
        'common.edit': { 'en': 'Edit', 'pt-BR': 'Editar', 'es': 'Editar' },
        'common.add': { 'en': 'Add', 'pt-BR': 'Adicionar', 'es': 'Agregar' },
        'common.search': { 'en': 'Search', 'pt-BR': 'Buscar', 'es': 'Buscar' },
        'common.loading': { 'en': 'Loading...', 'pt-BR': 'Carregando...', 'es': 'Cargando...' },
        'common.noData': { 'en': 'No data found', 'pt-BR': 'Nenhum dado encontrado', 'es': 'No se encontraron datos' },
        'common.success': { 'en': 'Success!', 'pt-BR': 'Sucesso!', 'es': '¡Éxito!' },
        'common.error': { 'en': 'Error', 'pt-BR': 'Erro', 'es': 'Error' },
        'common.offline': { 'en': 'You are offline. Changes will sync when connection returns.', 'pt-BR': 'Você está offline. As alterações serão sincronizadas quando a conexão retornar.', 'es': 'Estás offline. Los cambios se sincronizarán cuando vuelva la conexión.' },

        // NAV
        'nav.dashboard': { 'en': 'Dashboard', 'pt-BR': 'Painel', 'es': 'Panel' },
        'nav.medications': { 'en': 'Medications', 'pt-BR': 'Medicamentos', 'es': 'Medicamentos' },
        'nav.treatments': { 'en': 'Treatments', 'pt-BR': 'Tratamentos', 'es': 'Tratamientos' },
        'nav.professionals': { 'en': 'Professionals', 'pt-BR': 'Profissionais', 'es': 'Profesionales' },
        'nav.symptoms': { 'en': 'Symptoms', 'pt-BR': 'Sintomas', 'es': 'Síntomas' },
        'nav.procedures': { 'en': 'Procedures', 'pt-BR': 'Procedimentos', 'es': 'Procedimientos' },
        'nav.more': { 'en': 'More', 'pt-BR': 'Mais', 'es': 'Más' },
        'nav.events': { 'en': 'Events', 'pt-BR': 'Eventos', 'es': 'Eventos' },
        'nav.prescriptions': { 'en': 'Prescriptions', 'pt-BR': 'Receituários', 'es': 'Recetas' },
        'nav.settings': { 'en': 'Settings', 'pt-BR': 'Configurações', 'es': 'Configuración' },
        'nav.logout': { 'en': 'Logout', 'pt-BR': 'Sair', 'es': 'Cerrar sesión' },

        // AUTH
        'auth.login': { 'en': 'Login', 'pt-BR': 'Entrar', 'es': 'Iniciar sesión' },
        'auth.loginWithGoogle': { 'en': 'Login with Google', 'pt-BR': 'Entrar com Google', 'es': 'Iniciar sesión con Google' },
        'auth.welcome': { 'en': 'Welcome to FarmaPocket', 'pt-BR': 'Bem-vindo ao FarmaPocket', 'es': 'Bienvenido a FarmaPocket' },
        'auth.subtitle': { 'en': 'Manage your medications safely and simply', 'pt-BR': 'Gerencie seus medicamentos com segurança e simplicidade', 'es': 'Gestiona tus medicamentos de forma segura y sencilla' },

        // DEPENDENTS (NEW)
        'dependent.label': { 'en': 'Dependent', 'pt-BR': 'Dependente', 'es': 'Dependiente' },
        'dependent.addNew': { 'en': 'Add Dependent', 'pt-BR': 'Adicionar Dependente', 'es': 'Agregar Dependiente' },
        'dependent.name': { 'en': 'Name', 'pt-BR': 'Nome', 'es': 'Nombre' },
        'dependent.dateOfBirth': { 'en': 'Date of Birth', 'pt-BR': 'Data de Nascimento', 'es': 'Fecha de Nacimiento' },
        'dependent.relationship': { 'en': 'Relationship', 'pt-BR': 'Relacionamento', 'es': 'Relación' },
        'dependent.relationship.self': { 'en': 'Myself', 'pt-BR': 'Eu mesmo', 'es': 'Yo mismo' },
        'dependent.relationship.child': { 'en': 'Child', 'pt-BR': 'Filho(a)', 'es': 'Hijo(a)' },
        'dependent.relationship.spouse': { 'en': 'Spouse', 'pt-BR': 'Cônjuge', 'es': 'Cónyuge' },
        'dependent.relationship.parent': { 'en': 'Parent', 'pt-BR': 'Pai/Mãe', 'es': 'Padre/Madre' },
        'dependent.relationship.sibling': { 'en': 'Sibling', 'pt-BR': 'Irmão(ã)', 'es': 'Hermano(a)' },
        'dependent.relationship.other': { 'en': 'Other', 'pt-BR': 'Outro', 'es': 'Otro' },
        'dependent.selectFirst': { 'en': 'Select a dependent first', 'pt-BR': 'Selecione um dependente primeiro', 'es': 'Seleccione un dependiente primero' },
        'dependent.noDependents': { 'en': 'No dependents registered', 'pt-BR': 'Nenhum dependente cadastrado', 'es': 'Ningún dependiente registrado' },

        // MEDICATIONS
        'medication.name': { 'en': 'Name', 'pt-BR': 'Nome', 'es': 'Nombre' },
        'medication.activeIngredient': { 'en': 'Active Ingredient', 'pt-BR': 'Princípio Ativo', 'es': 'Principio Activo' },
        'medication.isControlled': { 'en': 'Controlled Substance', 'pt-BR': 'Medicamento Controlado', 'es': 'Medicamento Controlado' },
        'medication.isContinuousUse': { 'en': 'Continuous Use', 'pt-BR': 'Uso Contínuo', 'es': 'Uso Continuo' },
        'medication.isRescue': { 'en': 'Rescue Medication', 'pt-BR': 'Medicação de Resgate', 'es': 'Medicamento de Rescate' },
        'medication.stockQuantity': { 'en': 'Stock Quantity', 'pt-BR': 'Quantidade em Estoque', 'es': 'Cantidad en Stock' },
        'medication.addNew': { 'en': 'Add New Medication', 'pt-BR': 'Adicionar Novo Medicamento', 'es': 'Agregar Nuevo Medicamento' },
        'medication.edit': { 'en': 'Edit Medication', 'pt-BR': 'Editar Medicamento', 'es': 'Editar Medicamento' },
        'medication.lowStock': { 'en': 'Low Stock', 'pt-BR': 'Estoque Baixo', 'es': 'Stock Bajo' },

        // PRESCRIPTIONS
        'prescription.addNew': { 'en': 'Add New Prescription', 'pt-BR': 'Adicionar Receituário', 'es': 'Agregar Nueva Receta' },
        'prescription.edit': { 'en': 'Edit Prescription', 'pt-BR': 'Editar Receituário', 'es': 'Editar Receta' },
        'prescription.medication': { 'en': 'Medication', 'pt-BR': 'Medicamento', 'es': 'Medicamento' },
        'prescription.professional': { 'en': 'Prescribed By', 'pt-BR': 'Prescrito Por', 'es': 'Recetado Por' },
        'prescription.units': { 'en': 'Units', 'pt-BR': 'Unidades', 'es': 'Unidades' },
        'prescription.expirationDate': { 'en': 'Expiration Date', 'pt-BR': 'Data de Validade', 'es': 'Fecha de Vencimiento' },
        'prescription.status': { 'en': 'Status', 'pt-BR': 'Status', 'es': 'Estado' },
        'prescription.statusValid': { 'en': 'Valid', 'pt-BR': 'Válida', 'es': 'Válida' },
        'prescription.statusExpired': { 'en': 'Expired', 'pt-BR': 'Vencida', 'es': 'Vencida' },
        'prescription.statusUsed': { 'en': 'Used', 'pt-BR': 'Utilizada', 'es': 'Utilizada' },
        'prescription.usedDate': { 'en': 'Used Date', 'pt-BR': 'Data de Utilização', 'es': 'Fecha de Uso' },
        'prescription.use': { 'en': 'Use', 'pt-BR': 'Utilizar', 'es': 'Usar' },
        'prescription.useTitle': { 'en': 'Use Prescription', 'pt-BR': 'Utilizar Receituário', 'es': 'Usar Receta' },
        'prescription.useConfirm': { 'en': 'Do you want to use this prescription? Units will be added to stock.', 'pt-BR': 'Deseja utilizar este receituário? As unidades serão adicionadas ao estoque.', 'es': '¿Desea usar esta receta? Las unidades se agregarán al stock.' },
        'prescription.noData': { 'en': 'Add the first prescription', 'pt-BR': 'Adicione o primeiro receituário', 'es': 'Agregue la primera receta' },

        // SYMPTOMS
        'symptom.addNew': { 'en': 'Add New Symptom', 'pt-BR': 'Adicionar Sintoma', 'es': 'Agregar Síntoma' },
        'symptom.edit': { 'en': 'Edit Symptom', 'pt-BR': 'Editar Sintoma', 'es': 'Editar Síntoma' },
        'symptom.description': { 'en': 'Description', 'pt-BR': 'Descrição', 'es': 'Descripción' },
        'symptom.severity': { 'en': 'How are you feeling?', 'pt-BR': 'Como você está se sentindo?', 'es': '¿Cómo te sientes?' },
        'symptom.good': { 'en': 'Good', 'pt-BR': 'Bom', 'es': 'Bien' },
        'symptom.neutral': { 'en': 'Neutral', 'pt-BR': 'Neutro', 'es': 'Neutral' },
        'symptom.bad': { 'en': 'Bad', 'pt-BR': 'Ruim', 'es': 'Mal' },
        'symptom.startDate': { 'en': 'Start Date', 'pt-BR': 'Data de Início', 'es': 'Fecha de Inicio' },
        'symptom.endDate': { 'en': 'End Date', 'pt-BR': 'Data de Fim', 'es': 'Fecha de Fin' },
        'symptom.notes': { 'en': 'Notes', 'pt-BR': 'Observações', 'es': 'Observaciones' },
        'symptom.noData': { 'en': 'Add the first symptom', 'pt-BR': 'Adicione o primeiro sintoma', 'es': 'Agregue el primer síntoma' },

        // PROCEDURES
        'procedure.addNew': { 'en': 'Add New Procedure', 'pt-BR': 'Adicionar Procedimento', 'es': 'Agregar Procedimiento' },
        'procedure.edit': { 'en': 'Edit Procedure', 'pt-BR': 'Editar Procedimento', 'es': 'Editar Procedimiento' },
        'procedure.description': { 'en': 'Description', 'pt-BR': 'Descrição', 'es': 'Descripción' },
        'procedure.date': { 'en': 'Procedure Date', 'pt-BR': 'Data do Procedimento', 'es': 'Fecha del Procedimiento' },
        'procedure.goal': { 'en': 'Procedure Goal', 'pt-BR': 'Objetivo do Procedimento', 'es': 'Objetivo del Procedimiento' },
        'procedure.professional': { 'en': 'Responsible Professional', 'pt-BR': 'Profissional Responsável', 'es': 'Profesional Responsable' },
        'procedure.location': { 'en': 'Location', 'pt-BR': 'Local', 'es': 'Lugar' },
        'procedure.notes': { 'en': 'Notes', 'pt-BR': 'Observações', 'es': 'Observaciones' },
        'procedure.noData': { 'en': 'Add the first procedure', 'pt-BR': 'Adicione o primeiro procedimento', 'es': 'Agregue el primer procedimiento' },

        // DOSE ACTION
        'doseAction.confirmTaken': { 'en': 'Confirm Medication Taken', 'pt-BR': 'Confirmar Medicação Tomada', 'es': 'Confirmar Medicamento Tomado' },
        'doseAction.confirmSkipped': { 'en': 'Confirm Skipped Medication', 'pt-BR': 'Confirmar Medicação Pulada', 'es': 'Confirmar Medicamento Saltado' },
        'doseAction.time': { 'en': 'Time', 'pt-BR': 'Horário', 'es': 'Horario' },
        'doseAction.treatments': { 'en': 'Treatments', 'pt-BR': 'Tratamentos', 'es': 'Tratamientos' },
        'doseAction.notes': { 'en': 'Notes (optional)', 'pt-BR': 'Observações (opcional)', 'es': 'Observaciones (opcional)' },
        'doseAction.take': { 'en': 'Take', 'pt-BR': 'Tomar', 'es': 'Tomar' },
        'doseAction.skip': { 'en': 'Skip', 'pt-BR': 'Pular', 'es': 'Saltar' },
        'doseAction.revert': { 'en': 'Revert', 'pt-BR': 'Reverter', 'es': 'Revertir' },
        'doseAction.confirmRevert': { 'en': 'Revert last registered dose?', 'pt-BR': 'Deseja reverter a última dose registrada?', 'es': '¿Desea revertir la última dosis registrada?' },
        'doseAction.noDoseToRevert': { 'en': 'No dose to revert', 'pt-BR': 'Nenhuma dose para reverter', 'es': 'Ninguna dosis para revertir' },
        'doseAction.extraMedications': { 'en': 'Additional Medications', 'pt-BR': 'Medicações adicionais', 'es': 'Medicamentos adicionales' },
        'doseAction.addMedication': { 'en': '+ Add Medication', 'pt-BR': '+ Adicionar medicação', 'es': '+ Agregar medicamento' },
        'doseAction.remove': { 'en': 'Remove', 'pt-BR': 'Remover', 'es': 'Eliminar' },
        'doseAction.quantity': { 'en': 'Qty', 'pt-BR': 'Qtd', 'es': 'Cant' },

        // TREATMENTS
        'treatment.prescribedBy': { 'en': 'Prescribed By', 'pt-BR': 'Prescrito Por', 'es': 'Recetado Por' },
        'treatment.medication': { 'en': 'Medication', 'pt-BR': 'Medicação', 'es': 'Medicación' },
        'treatment.dosage': { 'en': 'Dosage (units)', 'pt-BR': 'Dosagem (unidades)', 'es': 'Dosis (unidades)' },
        'treatment.frequency': { 'en': 'Frequency (every X hours)', 'pt-BR': 'Frequência (a cada X horas)', 'es': 'Frecuencia (cada X horas)' },
        'treatment.firstDoseTime': { 'en': 'First Dose Time', 'pt-BR': 'Horário da Primeira Dose', 'es': 'Hora de la Primera Dosis' },
        'treatment.startDate': { 'en': 'Start Date', 'pt-BR': 'Data de Início', 'es': 'Fecha de Inicio' },
        'treatment.endDate': { 'en': 'End Date', 'pt-BR': 'Data de Encerramento', 'es': 'Fecha de Finalización' },
        'treatment.goal': { 'en': 'Treatment Goal', 'pt-BR': 'Objetivo do Tratamento', 'es': 'Objetivo del Tratamiento' },
        'treatment.adminNotes': { 'en': 'Administration Notes', 'pt-BR': 'Observações de Administração', 'es': 'Observaciones de Administración' },
        'treatment.isActive': { 'en': 'Active Treatment', 'pt-BR': 'Tratamento Ativo', 'es': 'Tratamiento Activo' },
        'treatment.autonomy': { 'en': 'Autonomy', 'pt-BR': 'Autonomia', 'es': 'Autonomía' },
        'treatment.daysRemaining': { 'en': 'Days Remaining', 'pt-BR': 'Dias Restantes', 'es': 'Días Restantes' },
        'treatment.addNew': { 'en': 'Add New Treatment', 'pt-BR': 'Adicionar Novo Tratamento', 'es': 'Agregar Nuevo Tratamiento' },

        // FREQUENCY
        'frequency.define': { 'en': 'Set Frequency', 'pt-BR': 'Definir frequência', 'es': 'Definir frecuencia' },
        'frequency.title': { 'en': 'Set Frequency', 'pt-BR': 'Definir Frequência', 'es': 'Definir Frecuencia' },
        'frequency.periodic': { 'en': 'Repeat every', 'pt-BR': 'Repetir a cada', 'es': 'Repetir cada' },
        'frequency.hours': { 'en': 'hours', 'pt-BR': 'horas', 'es': 'horas' },
        'frequency.manual': { 'en': 'Set manually', 'pt-BR': 'Definir manualmente', 'es': 'Definir manualmente' },
        'frequency.days': { 'en': 'Days of week', 'pt-BR': 'Dias da semana', 'es': 'Días de la semana' },
        'frequency.times': { 'en': 'Times', 'pt-BR': 'Horários', 'es': 'Horarios' },
        'frequency.addTime': { 'en': '+ Add time', 'pt-BR': '+ Adicionar horário', 'es': '+ Agregar horario' },
        'frequency.save': { 'en': 'Save Frequency', 'pt-BR': 'Salvar Frequência', 'es': 'Guardar Frecuencia' },
        'frequency.summary': { 'en': 'Schedule', 'pt-BR': 'Programação', 'es': 'Programación' },

        // WEEKDAYS
        'weekday.short.0': { 'en': 'S', 'pt-BR': 'D', 'es': 'D' },
        'weekday.short.1': { 'en': 'M', 'pt-BR': 'S', 'es': 'L' },
        'weekday.short.2': { 'en': 'T', 'pt-BR': 'T', 'es': 'M' },
        'weekday.short.3': { 'en': 'W', 'pt-BR': 'Q', 'es': 'M' },
        'weekday.short.4': { 'en': 'T', 'pt-BR': 'Q', 'es': 'J' },
        'weekday.short.5': { 'en': 'F', 'pt-BR': 'S', 'es': 'V' },
        'weekday.short.6': { 'en': 'S', 'pt-BR': 'S', 'es': 'S' },

        // PROFESSIONALS
        'professional.name': { 'en': 'Name', 'pt-BR': 'Nome', 'es': 'Nombre' },
        'professional.specialty': { 'en': 'Specialty', 'pt-BR': 'Especialidade', 'es': 'Especialidad' },
        'professional.phone': { 'en': 'Phone', 'pt-BR': 'Telefone', 'es': 'Teléfono' },
        'professional.addNew': { 'en': 'Add New Professional', 'pt-BR': 'Adicionar Novo Profissional', 'es': 'Agregar Nuevo Profesional' },

        // DASHBOARD
        'dashboard.activeTreatments': { 'en': 'Active Treatments', 'pt-BR': 'Tratamentos Ativos', 'es': 'Tratamientos Activos' },
        'dashboard.lowStock': { 'en': 'Low Stock Alerts', 'pt-BR': 'Alertas de Estoque Baixo', 'es': 'Alertas de Stock Bajo' },
        'dashboard.expiringPrescriptions': { 'en': 'Expiring Prescriptions', 'pt-BR': 'Receituários Vencendo', 'es': 'Recetas por Vencer' },
        'dashboard.nextDoses': { 'en': 'Next Doses', 'pt-BR': 'Próximas Doses', 'es': 'Próximas Dosis' },
        'dashboard.noSchedule': { 'en': 'No medications scheduled for today', 'pt-BR': 'Nenhum medicamento agendado para hoje', 'es': 'Ningún medicamento agendado para hoy' },
        'dashboard.lastAction': { 'en': 'Last Action', 'pt-BR': 'Última Ação', 'es': 'Última Acción' },
        'dashboard.noLastAction': { 'en': 'No action recorded', 'pt-BR': 'Nenhuma ação registrada', 'es': 'Ninguna acción registrada' },
        'dashboard.taken': { 'en': 'Taken', 'pt-BR': 'Tomadas', 'es': 'Tomadas' },
        'dashboard.skipped': { 'en': 'Skipped', 'pt-BR': 'Puladas', 'es': 'Saltadas' },

        // SETTINGS
        'settings.language': { 'en': 'Language', 'pt-BR': 'Idioma', 'es': 'Idioma' },
        'settings.notifications': { 'en': 'Notifications', 'pt-BR': 'Notificações', 'es': 'Notificaciones' },
        'settings.enableReminders': { 'en': 'Enable Medication Reminders', 'pt-BR': 'Ativar Lembretes de Medicamento', 'es': 'Activar Recordatorios de Medicamentos' },
        'settings.dataExport': { 'en': 'Export Data', 'pt-BR': 'Exportar Dados', 'es': 'Exportar Datos' },
        'settings.log': { 'en': 'Activity Log', 'pt-BR': 'Registro de Atividades', 'es': 'Registro de Actividades' },

        // LOG
        'log.title': { 'en': 'Activity Log', 'pt-BR': 'Registro de Atividades', 'es': 'Registro de Actividades' },
        'log.loading': { 'en': 'Loading...', 'pt-BR': 'Carregando...', 'es': 'Cargando...' },
        'log.noData': { 'en': 'No records found', 'pt-BR': 'Nenhum registro encontrado', 'es': 'No se encontraron registros' }
    },

    t(key, replacements = {}) {
        const translation = this.translations[key]?.[this.currentLang] 
            || this.translations[key]?.['en'] 
            || key;

        return translation.replace(/\{(\w+)\}/g, (match, placeholder) => {
            return replacements[placeholder] !== undefined ? replacements[placeholder] : match;
        });
    },

    setLanguage(lang) {
        if (this.languages[lang]) {
            this.currentLang = lang;
            localStorage.setItem('farma-pocket-lang', lang);
            document.documentElement.lang = lang;
            this.refreshUI();
        }
    },

    getLanguage() { return this.currentLang; },
    getLanguages() { return this.languages; },

    refreshUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const attr = el.getAttribute('data-i18n-attr');
            if (attr) {
                el.setAttribute(attr, this.t(key));
            } else {
                el.textContent = this.t(key);
            }
        });
        document.dispatchEvent(new CustomEvent('i18n:refresh', { detail: { lang: this.currentLang } }));
    },

    init() {
        document.documentElement.lang = this.currentLang;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.refreshUI());
        } else {
            this.refreshUI();
        }
    }
};

i18n.init();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
}
