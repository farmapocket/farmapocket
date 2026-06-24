// ============================================================
// FARMAPOCKET - Supabase Configuration
// ============================================================
// 
// INSTRUÇÕES:
// 1. Acesse seu projeto no Supabase (supabase.com)
// 2. Vá em Project Settings > API
// 3. Copie "Project URL" para SUPABASE_URL
// 4. Copie "anon public" para SUPABASE_ANON_KEY
// 5. Cole abaixo
//
// IMPORTANTE: Nunca compartilhe sua Service Role Key!
// A anon key é segura para usar no frontend.
// ============================================================

const CONFIG = {
    // Substitua pelos valores do seu projeto Supabase
    SUPABASE_URL: 'https://ezhzmvbrfepweyuporvk.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6aHptdmJyZmVwd2V5dXBvcnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTI1MTAsImV4cCI6MjA5NzM4ODUxMH0.gQXkUCL-lIZZM4QG61rE1tku8FF5AjbSGNPI2jGKQcs',


    // Configurações do app
    APP_NAME: 'FarmaPocket',
    APP_VERSION: '1.0.0',

    // Configurações de sincronização
    SYNC_INTERVAL: 30000,        // 30 segundos
    OFFLINE_RETRY_INTERVAL: 60000,  // 1 minuto

    // Configurações de cache
    CACHE_MAX_AGE: 1000 * 60 * 5,  // 5 minutos
};

// ============================================================
// Inicializar cliente Supabase
// ============================================================
// O CDN do Supabase cria 'window.supabase' como um namespace.
// NÃO podemos usar 'const supabase = ...' porque isso redeclararia.
// Usamos window.supabase diretamente para criar o cliente.

if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    window.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: localStorage
        },
        db: {
            schema: 'public'
        }
    });
    console.log('✅ Supabase client initialized');
} else {
    console.error('❌ Supabase library not loaded. Check if the CDN script is included before config.js');
}

// Verificar se as configurações foram preenchidas
if (CONFIG.SUPABASE_URL.includes('SEU-PROJETO')) {
    console.warn('⚠️ CONFIG: Você precisa preencher SUPABASE_URL e SUPABASE_ANON_KEY em js/config.js');
}

// Exportar para uso global
window.CONFIG = CONFIG;
