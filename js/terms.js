// ============================================================
// FARMAPOCKET - Termos e Privacidade
// Verificação de aceite no primeiro login
// ============================================================

const Terms = {
    listenersInitialized: false,

    // Verificar se usuário já aceitou termos
    async checkAccepted() {
        const userId = Auth.getUserId();
        if (!userId) return false;

        try {
            // Verificar no metadata do usuário no Supabase
            const { data: { user } } = await supabase.auth.getUser();
            const metadata = user?.user_metadata || {};

            // Se já aceitou, retorna true
            if (metadata.accepted_terms === true && metadata.accepted_privacy === true) {
                console.log('✅ Termos já aceitos');
                return true;
            }

            // Se não aceitou, mostrar modal
            console.log('⚠️ Termos pendentes, mostrando modal');
            this.showModal();
            return false;

        } catch (error) {
            console.error('Erro ao verificar termos:', error);
            return false;
        }
    },

    // Mostrar modal de aceite
    showModal() {
        const modal = document.getElementById('terms-modal');
        if (modal) {
            modal.classList.remove('hidden');
            if (!this.listenersInitialized) {
                this.setupListeners();
                this.listenersInitialized = true;
            }
            this.resetForm();
        }
    },

    // Resetar estado do formulário
    resetForm() {
        const termsCheck = document.getElementById('accept-terms');
        const privacyCheck = document.getElementById('accept-privacy');
        const btnContinue = document.getElementById('btn-continue');
        const errorMsg = document.getElementById('terms-error');

        if (termsCheck) termsCheck.checked = false;
        if (privacyCheck) privacyCheck.checked = false;
        if (btnContinue) {
            btnContinue.disabled = true;
            btnContinue.className = 'w-full py-3 bg-gray-300 text-white rounded-lg font-medium cursor-not-allowed transition-colors';
        }
        if (errorMsg) errorMsg.classList.add('hidden');
    },

    // Esconder modal
    hideModal() {
        const modal = document.getElementById('terms-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // Configurar listeners do modal
    setupListeners() {
        const termsCheck = document.getElementById('accept-terms');
        const privacyCheck = document.getElementById('accept-privacy');
        const btnContinue = document.getElementById('btn-continue');
        const btnLogout = document.getElementById('btn-logout');
        const errorMsg = document.getElementById('terms-error');

        if (!termsCheck || !privacyCheck || !btnContinue) return;

        // Verificar se ambos estão marcados
        const checkBoth = () => {
            const bothChecked = termsCheck.checked && privacyCheck.checked;
            btnContinue.disabled = !bothChecked;
            btnContinue.className = bothChecked 
                ? 'w-full py-3 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors'
                : 'w-full py-3 bg-gray-300 text-white rounded-lg font-medium cursor-not-allowed transition-colors';
            errorMsg.classList.add('hidden');
        };

        termsCheck.addEventListener('change', checkBoth);
        privacyCheck.addEventListener('change', checkBoth);

        // Botão continuar
        btnContinue.addEventListener('click', async () => {
            if (!termsCheck.checked || !privacyCheck.checked) {
                errorMsg.classList.remove('hidden');
                return;
            }

            await this.acceptTerms();
        });

        // Botão sair
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                Auth.signOut();
            });
        }
    },

    // Registrar aceite no Supabase
    async acceptTerms() {
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    accepted_terms: true,
                    accepted_privacy: true,
                    accepted_at: new Date().toISOString()
                }
            });

            if (error) throw error;

            console.log('✅ Termos aceitos com sucesso');
            this.hideModal();

            // Redirecionar para app
            window.location.href = 'app.html';

        } catch (error) {
            console.error('Erro ao aceitar termos:', error);
            alert('Erro ao salvar aceite. Tente novamente.');
        }
    }
};

// Expor globalmente
window.Terms = Terms;
