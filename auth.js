// ============================================================
// FARMAPOCKET - Authentication Module
// Google SSO + Session Management
// ============================================================

const Auth = {
    currentUser: null,

    // Inicializar módulo de autenticação
    async init() {
        // Verificar sessão existente
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Auth init error:', error);
            return;
        }

        if (session) {
            this.currentUser = session.user;
            this.updateUI();
        }

        // Escutar mudanças de autenticação
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                this.updateUI();
                // Redirecionar para app se estiver na página de login
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                    window.location.href = 'app.html';
                }
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                window.location.href = 'index.html';
            }
        });
    },

    // Login com Google
    async signInWithGoogle() {
        try {
            this.showLoading(true);
            this.showError(null);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/app.html',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (error) throw error;

            // O redirecionamento acontece automaticamente
            return data;

        } catch (error) {
            console.error('Google login error:', error);
            this.showError(error.message || 'Erro ao fazer login. Tente novamente.');
            this.showLoading(false);
        }
    },

    // Logout
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // Limpar dados locais
            localStorage.removeItem('farma-pocket-lang');

            // Redirecionar para login
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Logout error:', error);
            alert('Erro ao sair. Tente novamente.');
        }
    },

    // Obter usuário atual
    getUser() {
        return this.currentUser;
    },

    // Verificar se está autenticado
    isAuthenticated() {
        return !!this.currentUser;
    },

    // Obter ID do usuário
    getUserId() {
        return this.currentUser?.id || null;
    },

    // Obter nome do usuário
    getUserName() {
        return this.currentUser?.user_metadata?.full_name 
            || this.currentUser?.email 
            || 'Usuário';
    },

    // Obter avatar do usuário
    getUserAvatar() {
        return this.currentUser?.user_metadata?.avatar_url || null;
    },

    // Atualizar UI com dados do usuário
    updateUI() {
        const avatarEl = document.getElementById('user-avatar');
        const welcomeEl = document.getElementById('welcome-text');

        if (avatarEl && this.currentUser) {
            const avatarUrl = this.getUserAvatar();
            if (avatarUrl) {
                avatarEl.innerHTML = `<img src="${avatarUrl}" class="w-8 h-8 rounded-full">`;
            }
        }

        if (welcomeEl && this.currentUser) {
            const name = this.getUserName().split(' ')[0]; // Primeiro nome
            welcomeEl.textContent = `Olá, ${name}!`;
        }
    },

    // Mostrar/esconder loading
    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.classList.toggle('hidden', !show);
        }

        const btn = document.getElementById('google-login');
        if (btn) {
            btn.disabled = show;
            btn.style.opacity = show ? '0.7' : '1';
        }
    },

    // Mostrar mensagem de erro
    showError(message) {
        const errorEl = document.getElementById('error-msg');
        if (errorEl) {
            if (message) {
                errorEl.textContent = message;
                errorEl.classList.remove('hidden');
            } else {
                errorEl.classList.add('hidden');
            }
        }
    }
};

// Função global de logout
function logout() {
    Auth.signOut();
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();

    // Bind do botão de login Google
    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => Auth.signInWithGoogle());
    }
});

// Expor globalmente
window.Auth = Auth;
