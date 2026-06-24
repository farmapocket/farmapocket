// ============================================================
// FARMAPOCKET v2 - Database Operations Module
// CRUD operations with Supabase + Dependents support
// ============================================================

const DB = {
    // ========== DEPENDENTS ==========

    async getDependents() {
        const userId = Auth.getUserId();
        if (!userId) return [];

        try {
            const { data, error } = await supabase
                .from('dependents')
                .select('*')
                .eq('account_owner_id', userId)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return data || [];

        } catch (error) {
            console.error('Error fetching dependents:', error);
            return await OfflineDB.getAll('dependents');
        }
    },

    async addDependent(dependent) {
        const userId = Auth.getUserId();
        if (!userId) throw new Error('User not authenticated');

        const payload = {
            ...dependent,
            account_owner_id: userId
        };

        try {
            const { data, error } = await supabase
                .from('dependents')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('dependents', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('dependents', 'insert', payload);
            throw error;
        }
    },

    async updateDependent(id, updates) {
        const payload = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from('dependents')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('dependents', id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('dependents', 'update', { id, ...payload });
            throw error;
        }
    },

    async deleteDependent(id) {
        try {
            // Soft delete - apenas desativa
            const { error } = await supabase
                .from('dependents')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            await OfflineDB.set('dependents', id, { ...await OfflineDB.get('dependents', id), is_active: false });

        } catch (error) {
            await OfflineDB.queueForSync('dependents', 'update', { id, is_active: false });
            throw error;
        }
    },

    // Cria um dependente "Eu mesmo" automaticamente se o usuário não tiver nenhum
    async ensureSelfDependent() {
        const userId = Auth.getUserId();
        if (!userId) return null;

        try {
            const existing = await this.getDependents();
            if (existing && existing.length > 0) {
                console.log('✅ User already has dependents, skipping auto-create');
                return existing[0];
            }

            const userName = Auth.getUserName();
            const selfDependent = {
                name: userName,
                relationship: 'self',
                account_owner_id: userId,
                is_active: true,
                avatar_url: Auth.getUserAvatar() || '👤'
            };

            console.log('🆕 Creating self dependent:', selfDependent.name);
            return await this.addDependent(selfDependent);

        } catch (error) {
            console.error('❌ Error creating self dependent:', error);
            return null;
        }
    },

    // ========== MEDICATIONS (now require dependentId) ==========

    async getMedications(dependentId) {
        if (!dependentId) return [];

        try {
            const { data, error } = await supabase
                .from('medications')
                .select(`
                    *,
                    laboratories:laboratory_id (name),
                    categories:category_id (name),
                    subcategories:subcategory_id (name)
                `)
                .eq('dependent_id', dependentId)
                .order('name');

            if (error) throw error;
            return data || [];

        } catch (error) {
            console.error('Error fetching medications:', error);
            const all = await OfflineDB.getAll('medications');
            return all.filter(m => m.dependent_id === dependentId);
        }
    },

    async addMedication(medication) {
        if (!medication.dependent_id) throw new Error('dependent_id is required');

        const payload = {
            ...medication,
            stock_last_updated: medication.stock_quantity > 0 ? new Date().toISOString() : null
        };

        try {
            const { data, error } = await supabase
                .from('medications')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('medications', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('medications', 'insert', payload);
            throw error;
        }
    },

    async updateMedication(id, updates) {
        const payload = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        if (updates.stock_quantity !== undefined) {
            payload.stock_last_updated = new Date().toISOString();
        }

        try {
            const { data, error } = await supabase
                .from('medications')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('medications', id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('medications', 'update', { id, ...payload });
            throw error;
        }
    },

    async deleteMedication(id) {
        try {
            const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await OfflineDB.delete('medications', id);

        } catch (error) {
            await OfflineDB.queueForSync('medications', 'delete', { id });
            throw error;
        }
    },

    // ========== HEALTHCARE PROFESSIONALS ==========

    async getProfessionals(dependentId) {
        if (!dependentId) return [];

        try {
            const { data, error } = await supabase
                .from('healthcare_professionals')
                .select('*')
                .eq('dependent_id', dependentId)
                .order('name');

            if (error) throw error;
            return data || [];

        } catch (error) {
            const all = await OfflineDB.getAll('healthcare_professionals');
            return all.filter(p => p.dependent_id === dependentId);
        }
    },

    async addProfessional(professional) {
        if (!professional.dependent_id) throw new Error('dependent_id is required');

        try {
            const { data, error } = await supabase
                .from('healthcare_professionals')
                .insert(professional)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('healthcare_professionals', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('healthcare_professionals', 'insert', professional);
            throw error;
        }
    },

    // ========== TREATMENTS ==========

    async getTreatments(dependentId) {
        if (!dependentId) return [];

        try {
            const { data, error } = await supabase
                .from('treatments')
                .select(`
                    *,
                    medications:medication_id (name, stock_quantity),
                    healthcare_professionals:prescribed_by (name, specialty)
                `)
                .eq('dependent_id', dependentId)
                .order('start_date', { ascending: false });

            if (error) throw error;
            return data || [];

        } catch (error) {
            const all = await OfflineDB.getAll('treatments');
            return all.filter(t => t.dependent_id === dependentId);
        }
    },

    async addTreatment(treatment) {
        if (!treatment.dependent_id) throw new Error('dependent_id is required');
        if (!treatment.medication_id) throw new Error('medication_id is required');

        const payload = {
            ...treatment,
            is_active: treatment.is_active !== false
        };

        try {
            const { data, error } = await supabase
                .from('treatments')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('treatments', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('treatments', 'insert', payload);
            throw error;
        }
    },

    async updateTreatment(id, updates) {
        const payload = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from('treatments')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('treatments', id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('treatments', 'update', { id, ...payload });
            throw error;
        }
    },

    async deleteTreatment(id) {
        try {
            const { error } = await supabase
                .from('treatments')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await OfflineDB.delete('treatments', id);

        } catch (error) {
            await OfflineDB.queueForSync('treatments', 'delete', { id });
            throw error;
        }
    },

    // ========== DASHBOARD STATS (aggregated across all dependents) ==========

    async getDashboardStats() {
        const dependents = await this.getDependents();
        if (dependents.length === 0) return { dependents: 0, medications: 0, treatments: 0, professionals: 0 };

        const depIds = dependents.map(d => d.id);

        try {
            const [medCount, treatCount, profCount] = await Promise.all([
                supabase.from('medications').select('*', { count: 'exact', head: true }).in('dependent_id', depIds),
                supabase.from('treatments').select('*', { count: 'exact', head: true }).in('dependent_id', depIds),
                supabase.from('healthcare_professionals').select('*', { count: 'exact', head: true }).in('dependent_id', depIds)
            ]);

            return {
                dependents: dependents.length,
                medications: medCount.count || 0,
                treatments: treatCount.count || 0,
                professionals: profCount.count || 0
            };

        } catch (error) {
            console.error('Error fetching stats:', error);
            return { dependents: dependents.length, medications: 0, treatments: 0, professionals: 0 };
        }
    },

    async getLowStockAlerts() {
        const dependents = await this.getDependents();
        if (dependents.length === 0) return [];

        try {
            const { data, error } = await supabase
                .from('v_medication_autonomy')
                .select('*')
                .eq('low_stock_alert', true)
                .in('dependent_id', dependents.map(d => d.id));

            if (error) throw error;
            return data || [];

        } catch (error) {
            return [];
        }
    },

    async getExpiringPrescriptions() {
        const dependents = await this.getDependents();
        if (dependents.length === 0) return [];

        try {
            const { data, error } = await supabase
                .from('v_prescription_status')
                .select('*')
                .eq('expiring_soon', true)
                .in('dependent_id', dependents.map(d => d.id));

            if (error) throw error;
            return data || [];

        } catch (error) {
            return [];
        }
    }
};

// Expor globalmente
window.DB = DB;
