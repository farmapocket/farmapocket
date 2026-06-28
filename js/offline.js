// ============================================================
// FARMAPOCKET - Offline Support Module
// IndexedDB for local storage + sync queue
// ============================================================

const OfflineDB = {
    db: null,
    DB_NAME: 'FarmaPocketDB',
    DB_VERSION: 5,

    // Inicializar IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Stores para cada tabela
                if (!db.objectStoreNames.contains('dependents')) {
                    db.createObjectStore('dependents', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('medications')) {
                    db.createObjectStore('medications', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('healthcare_professionals')) {
                    db.createObjectStore('healthcare_professionals', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('treatments')) {
                    db.createObjectStore('treatments', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('symptoms')) {
                    db.createObjectStore('symptoms', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('events')) {
                    db.createObjectStore('events', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('prescriptions')) {
                    db.createObjectStore('prescriptions', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('scheduling')) {
                    db.createObjectStore('scheduling', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('treatments_in_schedule')) {
                    db.createObjectStore('treatments_in_schedule', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('medication_times_on_treatment')) {
                    db.createObjectStore('medication_times_on_treatment', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('subcategories')) {
                    db.createObjectStore('subcategories', { keyPath: 'id' });
                }

                // Fila de sincronização
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const queueStore = db.createObjectStore('syncQueue', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    queueStore.createIndex('table', 'table', { unique: false });
                    queueStore.createIndex('status', 'status', { unique: false });
                }

                // Cache de autenticação
                if (!db.objectStoreNames.contains('auth')) {
                    db.createObjectStore('auth', { keyPath: 'key' });
                }
            };
        });
    },

    // ========== CRUD BÁSICO ==========

    async getAll(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async get(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async set(storeName, id, data) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ ...data, id, _localUpdated: Date.now() });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async clear(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // ========== FILA DE SINCRONIZAÇÃO ==========

    async queueForSync(table, operation, data) {
        if (!this.db) await this.init();

        const queueItem = {
            table,
            operation,  // 'insert', 'update', 'delete'
            data,
            status: 'pending',
            createdAt: Date.now(),
            retries: 0
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.add(queueItem);

            request.onsuccess = () => {
                console.log(`Queued ${operation} on ${table} for sync`);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    },

    async getSyncQueue() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const index = store.index('status');
            const request = index.getAll('pending');

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async markSyncComplete(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async markSyncFailed(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const item = getReq.result;
                if (item) {
                    item.retries++;
                    item.status = item.retries >= 3 ? 'failed' : 'pending';
                    item.lastError = Date.now();
                    store.put(item);
                }
                resolve();
            };
            getReq.onerror = () => reject(getReq.error);
        });
    },

    // ========== SINCRONIZAÇÃO ==========

    async sync() {
        if (!navigator.onLine) {
            console.log('Offline: sync skipped');
            return { synced: 0, failed: 0 };
        }

        const queue = await this.getSyncQueue();
        if (queue.length === 0) return { synced: 0, failed: 0 };

        let synced = 0;
        let failed = 0;

        for (const item of queue) {
            try {
                const { table, operation, data } = item;

                if (operation === 'insert') {
                    const { error } = await supabase.from(table).insert(data);
                    if (error) throw error;
                } else if (operation === 'update') {
                    const { id, ...updates } = data;
                    const { error } = await supabase.from(table).update(updates).eq('id', id);
                    if (error) throw error;
                } else if (operation === 'delete') {
                    const { error } = await supabase.from(table).delete().eq('id', data.id);
                    if (error) throw error;
                }

                await this.markSyncComplete(item.id);
                synced++;

            } catch (error) {
                console.error(`Sync failed for item ${item.id}:`, error);
                await this.markSyncFailed(item.id);
                failed++;
            }
        }

        console.log(`Sync complete: ${synced} synced, ${failed} failed`);
        return { synced, failed };
    },

    // ========== CACHE DE AUTENTICAÇÃO ==========

    async cacheAuth(session) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['auth'], 'readwrite');
            const store = transaction.objectStore('auth');
            const request = store.put({ key: 'session', data: session, timestamp: Date.now() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async getCachedAuth() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['auth'], 'readonly');
            const store = transaction.objectStore('auth');
            const request = store.get('session');

            request.onsuccess = () => {
                const result = request.result;
                if (result && Date.now() - result.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },

    async clearAuth() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['auth'], 'readwrite');
            const store = transaction.objectStore('auth');
            const request = store.delete('session');

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

// ========== SERVICE WORKER REGISTRATION ==========

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('js/sw.js');
            console.log('SW registered:', registration.scope);

            // Verificar atualizações
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nova versão disponível
                        if (confirm('Nova versão disponível! Atualizar agora?')) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            window.location.reload();
                        }
                    }
                });
            });

        } catch (error) {
            console.error('SW registration failed:', error);
        }
    }
}

// ========== NETWORK STATUS ==========

function initNetworkStatus() {
    const statusEl = document.getElementById('connection-status');

    function updateStatus() {
        const isOnline = navigator.onLine;

        if (statusEl) {
            statusEl.className = `w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`;
        }

        if (isOnline) {
            // Tentar sincronizar quando voltar online
            OfflineDB.sync().then(result => {
                if (result.synced > 0) {
                    console.log(`Synced ${result.synced} items`);
                    // Recarregar dados se necessário
                    if (window.loadDashboard) window.loadDashboard();
                }
            });
        }
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();

    // Sincronização periódica
    setInterval(() => {
        if (navigator.onLine) {
            OfflineDB.sync();
        }
    }, CONFIG.SYNC_INTERVAL || 30000);
}

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
    OfflineDB.init().then(() => {
        console.log('OfflineDB initialized');
        registerServiceWorker();
        initNetworkStatus();
    }).catch(err => {
        console.error('Failed to init OfflineDB:', err);
    });
});

// Expor globalmente
window.OfflineDB = OfflineDB;
