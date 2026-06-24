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
        console.log('🔎 Has OAuth tokens in URL:', this.hasOAuthTokensInUrl());

        // Verificar se supabase está disponível
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase not loaded! Check config.js');
            this.showError('Erro de configuração. Recarregue a página.');
            return;
        }
        console.log('✅ Supabase client available');

        // Primeiro, tentar processar callback OAuth que pode estar na URL
        // (pode voltar para index.html ou app.html dependendo da configuração)
        await this.handleOAuthCallback();

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

                // Garantir que o usuário tenha pelo menos um dependente (ele mesmo)
                if (this.isAppPage()) {
                    await this.ensureSelfDependent();
                }

                // Se estiver na página de login e já tiver sessão, redirecionar
                if (this.isLoginPage()) {
                    console.log('🔄 Already logged in, redirecting to app.html...');
                    window.location.href = 'app.html';
                    return;
                }
            } else {
                console.log('ℹ️ No active session');

                // Se estiver em app.html sem sessão, voltar para login
                if (this.isAppPage()) {
                    console.log('🔄 No session on app page, redirecting to index.html...');
                    window.location.href = 'index.html';
                    return;
                }
            }
        } catch (e) {
            console.error('❌ Error checking session:', e);
        }

        // Escutar mudanças de autenticação
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 Auth state changed:', event);

            if (event === 'SIGNED_IN' && session) {
                console.log('✅ User signed in:', session.user.email);
                this.currentUser = session.user;
                this.updateUI();

                // Garantir dependente "Eu mesmo" ao fazer login
                if (this.isAppPage()) {
                    await this.ensureSelfDependent();
                }

                // Redirecionar para app se estiver na página de login
                if (this.isLoginPage()) {
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
                    if (this.isAppPage()) {
                        await this.ensureSelfDependent();
                    }
                }
            }
        });

        console.log('🔐 Auth.init() completed');
    },

    // Verifica se a URL atual contém tokens OAuth ou erros (hash ou query)
    hasOAuthTokensInUrl() {
        const hash = window.location.hash;
        const search = window.location.search;
        return hash.includes('access_token=') ||
               hash.includes('refresh_token=') ||
               search.includes('access_token=') ||
               search.includes('refresh_token=') ||
               search.includes('code=') ||
               search.includes('error=') ||
               hash.includes('error=');
    },

    // Extrai mensagem de erro da URL, se houver
    getOAuthErrorFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const error = params.get('error') || hashParams.get('error');
        const errorDescription = params.get('error_description') || hashParams.get('error_description');
        if (error) {
            return `${error}${errorDescription ? ': ' + errorDescription : ''}`;
        }
        return null;
    },

    // Verifica se está na página de login
    isLoginPage() {
        const path = window.location.pathname;
        return path.includes('index.html') || path === '/' || path === '' || path.endsWith('/');
    },

    // Verifica se está na página do app
    isAppPage() {
        return window.location.pathname.includes('app.html');
    },

    // Processa callback OAuth manualmente se necessário
    async handleOAuthCallback() {
        if (!this.hasOAuthTokensInUrl()) {
            return;
        }

        console.log('🔄 OAuth callback detected, processing...');
        this.showLoading(true);

        // Verificar se houve erro retornado pelo provedor
        const oauthError = this.getOAuthErrorFromUrl();
        if (oauthError) {
            console.error('❌ OAuth provider error:', oauthError);
            this.showError('Erro no login: ' + oauthError);
            this.showLoading(false);
            return;
        }

        try {
            // O Supabase com detectSessionInUrl:true já processa automaticamente,
            // mas aguardamos um pouco para garantir que a sessão foi estabelecida
            await new Promise(resolve => setTimeout(resolve, 800));

            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('❌ OAuth callback error:', error);
                this.showError('Erro ao processar login: ' + error.message);
                return;
            }

            if (session) {
                console.log('✅ OAuth callback successful:', session.user.email);
                this.currentUser = session.user;
                this.updateUI();

                // Limpar tokens da URL para segurança
                if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

                // Redirecionar para o app se ainda estiver na página de login
                if (this.isLoginPage()) {
                    console.log('🔄 OAuth callback on login page, redirecting to app.html...');
                    window.location.replace('app.html');
                }
            } else {
                console.warn('⚠️ OAuth callback detected but no session found');
                console.log('🔄 URL hash:', window.location.hash);
                console.log('🔄 URL search:', window.location.search);
                this.showError('Não foi possível completar o login. Tente novamente.');
            }
        } catch (e) {
            console.error('❌ Error handling OAuth callback:', e);
            this.showError('Erro inesperado ao processar login.');
        } finally {
            this.showLoading(false);
        }
    },

    // Garante que o usuário tenha um dependente "Eu mesmo"
    async ensureSelfDependent() {
        if (typeof DB !== 'undefined' && DB.ensureSelfDependent) {
            try {
                const dependent = await DB.ensureSelfDependent();
                if (dependent && typeof AppState !== 'undefined') {
                    AppState.setCurrentDependent(dependent.id);
                    console.log('✅ Self dependent selected:', dependent.name);
                }
            } catch (error) {
                console.error('❌ ensureSelfDependent error:', error);
            }
        }
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
            const currentUrl = window.location.href.split('#')[0].split('?')[0];
            const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');

            // Estratégia: voltar para a página atual (index.html) e depois
            // redirecionar para app.html. Isso evita problemas quando app.html
            // não está autorizada como redirect URL no Supabase.
            let redirectUrl = currentUrl;

            // Garantir que termina em index.html (não em /)
            if (redirectUrl.endsWith('/')) {
                redirectUrl += 'index.html';
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

            // Se por algum motivo o redirecionamento automático não acontecer,
            // fazemos manualmente
            if (data?.url) {
                console.log('🔄 Redirecting to provider URL...');
                window.location.href = data.url;
            }

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
