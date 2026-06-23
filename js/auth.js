// ============================================================
// FARMAPOCKET - Authentication Module v2
// Google SSO + Session Management + Debug Logs
// ============================================================

const Auth = {
    currentUser: null,
    initialized: false,

    // Inicializar módulo de autenticação
    async init() {
        if (this.initialized) {
            console.log('🔐 Auth already initialized');
            return;
        }
        this.initialized = true;

        console.log('🔐 Auth.init() started');
        console.log('📍 Current URL:', window.location.href);
        console.log('📍 Origin:', window.location.origin);
        console.log('📍 Pathname:', window.location.pathname);

        // Verificar se supabase está disponível
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase not loaded! Check config.js');
            this.showError('Erro de configuração. Recarregue a página.');
            return;
        }
        console.log('✅ Supabase client available');

        // Verificar sessão existente
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('❌ Auth init error:', error);
                return;
            }

            if (session) {
                console.log('✅ Session found:', session.user.email);
                this.currentUser = session.user;
                this.updateUI();

                // Se estiver na página de login e já tiver sessão, redirecionar
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                    console.log('🔄 Already logged in, redirecting to app.html...');
                    window.location.href = 'app.html';
                    return;
                }
            } else {
                console.log('ℹ️ No active session');
            }
        } catch (e) {
            console.error('❌ Error checking session:', e);
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
        console.log('🖱️ Button clicked at:', new Date().toISOString());

        try {
            this.showLoading(true);
            this.showError(null);

            // Detectar URL correta para redirect
            const currentOrigin = window.location.origin;
            const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');

            let redirectUrl;
            if (isLocalhost) {
                redirectUrl = currentOrigin + '/app.html';
            } else {
                redirectUrl = currentOrigin + '/app.html';
            }

            console.log('🔄 Redirect URL:', redirectUrl);
            console.log('🔄 Is localhost:', isLocalhost);
            console.log('🔄 Supabase URL:', CONFIG.SUPABASE_URL);

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

            console.log('✅ OAuth initiated successfully');
            console.log('📍 Provider URL:', data?.url);

            // O redirecionamento acontece automaticamente
            return data;

        } catch (error) {
            console.error('❌ Google login error:', error);
            console.error('❌ Error details:', error.message, error.stack);
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

            localStorage.removeItem('farma-pocket-lang');
            localStorage.removeItem('farma-pocket-current-dependent');

            console.log('✅ Signed out successfully');
            window.location.href = 'index.html';

        } catch (error) {
            console.error('❌ Logout error:', error);
            alert('Erro ao sair. Tente novamente.');
        }
    },

    getUser() { return this.currentUser; },
    isAuthenticated() { return !!this.currentUser; },
    getUserId() { return this.currentUser?.id || null; },

    getUserName() {
        return this.currentUser?.user_metadata?.full_name 
            || this.currentUser?.email 
            || 'Usuário';
    },

    getUserAvatar() {
        return this.currentUser?.user_metadata?.avatar_url || null;
    },

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

// Inicializar quando DOM estiver pronto - APENAS UM DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing auth...');
    console.log('📄 document.readyState:', document.readyState);

    // Inicializar auth
    Auth.init();

    // Bind do botão de login Google
    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        console.log('✅ Google login button found');
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Google login button clicked');
            Auth.signInWithGoogle();
        });
    } else {
        console.error('❌ Google login button NOT found!');
        console.error('❌ Available buttons:', document.querySelectorAll('button').length);
    }
});

// Expor globalmente
window.Auth = Auth;
