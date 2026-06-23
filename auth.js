// ============================================================
// FARMAPOCKET - Authentication Module v2
// Google SSO + Session Management + Debug Logs
// ============================================================

const Auth = {
    currentUser: null,

    // Inicializar módulo de autenticação
    async init() {
        console.log('🔐 Auth.init() started');
        console.log('📍 Current URL:', window.location.href);
        console.log('📍 Origin:', window.location.origin);

        // Verificar sessão existente
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('❌ Auth init error:', error);
            return;
        }

        if (session) {
            console.log('✅ Session found:', session.user.email);
            this.currentUser = session.user;
            this.updateUI();
        } else {
            console.log('ℹ️ No active session');
        }

        // Escutar mudanças de autenticação
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state changed:', event);

            if (event === 'SIGNED_IN' && session) {
                console.log('✅ User signed in:', session.user.email);
                this.currentUser = session.user;
                this.updateUI();

                // Redirecionar para app se estiver na página de login
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                    console.log('🔄 Redirecting to app.html...');
                    window.location.href = 'app.html';
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('👋 User signed out');
                this.currentUser = null;
                window.location.href = 'index.html';
            } else if (event === 'INITIAL_SESSION') {
                console.log('📋 Initial session detected');
                if (session) {
                    this.currentUser = session.user;
                    this.updateUI();
                }
            }
        });

        console.log('🔐 Auth.init() completed');
    },

    // Login com Google
    async signInWithGoogle() {
        console.log('🔑 Starting Google Sign-In...');

        try {
            this.showLoading(true);
            this.showError(null);

            // Detectar URL correta para redirect
            const currentOrigin = window.location.origin;
            const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');

            let redirectUrl;
            if (isLocalhost) {
                // Desenvolvimento local
                redirectUrl = currentOrigin + '/app.html';
            } else if (currentOrigin.includes('netlify.app')) {
                // Netlify (subdomínio .netlify.app)
                redirectUrl = currentOrigin + '/app.html';
            } else {
                // Domínio próprio (farmapocket.com.br)
                redirectUrl = currentOrigin + '/app.html';
            }

            console.log('🔄 Redirect URL:', redirectUrl);
            console.log('🔄 Is localhost:', isLocalhost);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (error) {
                console.error('❌ OAuth error:', error);
                throw error;
            }

            console.log('✅ OAuth initiated:', data);

            // O redirecionamento acontece automaticamente
            // Não precisamos fazer nada aqui - o navegador vai para o Google
            return data;

        } catch (error) {
            console.error('❌ Google login error:', error);
            this.showError(error.message || 'Erro ao fazer login. Tente novamente.');
            this.showLoading(false);
        }
    },

    // Logout
    async signOut() {
        console.log('👋 Signing out...');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // Limpar dados locais
            localStorage.removeItem('farma-pocket-lang');
            localStorage.removeItem('farma-pocket-current-dependent');

            console.log('✅ Signed out successfully');
            window.location.href = 'index.html';

        } catch (error) {
            console.error('❌ Logout error:', error);
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
            const name = this.getUserName().split(' ')[0];
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
    console.log('📄 DOM loaded, initializing auth...');
    Auth.init();

    // Bind do botão de login Google
    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            console.log('🖱️ Google login button clicked');
            Auth.signInWithGoogle();
        });
    } else {
        console.warn('⚠️ Google login button not found');
    }
});

// Expor globalmente
window.Auth = Auth;
