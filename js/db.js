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

    // Cria um dependente "Eu mesmo" automaticamente se o usuário nao tiver um
    async ensureSelfDependent() {
        const userId = Auth.getUserId();
        if (!userId) return null;

        try {
            const existing = await this.getDependents();
            const selfDependent = existing.find(d => d.relationship === 'self');

            if (selfDependent) {
                console.log('✅ Self dependent found:', selfDependent.name);
                return selfDependent;
            }

            const userName = Auth.getUserName();
            const newSelfDependent = {
                name: userName,
                relationship: 'self',
                account_owner_id: userId,
                is_active: true,
                avatar_url: Auth.getUserAvatar() || '👤'
            };

            console.log('🆕 Creating self dependent:', newSelfDependent.name);
            return await this.addDependent(newSelfDependent);

        } catch (error) {
            console.error('❌ Error creating self dependent:', error);
            return null;
        }
    },

    // ========== LABORATORIES ==========

    async getLaboratories() {
        try {
            const { data, error } = await supabase
                .from('laboratories')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];

        } catch (error) {
            const all = await OfflineDB.getAll('laboratories');
            return all.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
    },

    async addLaboratory(laboratory) {
        if (!laboratory.name) throw new Error('name is required');

        try {
            const { data, error } = await supabase
                .from('laboratories')
                .insert(laboratory)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('laboratories', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('laboratories', 'insert', laboratory);
            throw error;
        }
    },

    // ========== MEDICATIONS (now require dependentId) ==========

    async getMedications(dependentId, includeInactive = true) {
        if (!dependentId) return [];

        try {
            let query = supabase
                .from('medications')
                .select(`
                    *,
                    laboratories:laboratory_id (name)
                `)
                .eq('dependent_id', dependentId)
                .order('name');

            if (!includeInactive) {
                query = query.eq('is_active', true);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];

        } catch (error) {
            console.error('Error fetching medications:', error);
            const all = await OfflineDB.getAll('medications');
            const filtered = all.filter(m => m.dependent_id === dependentId);
            if (!includeInactive) return filtered.filter(m => m.is_active !== false);
            return filtered;
        }
    },

    async getActiveMedications(dependentId) {
        return this.getMedications(dependentId, false);
    },

    async addMedication(medication) {
        if (!medication.dependent_id) throw new Error('dependent_id is required');
        if (!medication.name || !medication.name.trim()) throw new Error('Nome do medicamento é obrigatório');

        const normalizedName = medication.name.trim().toLowerCase();

        // Verifica se já existe medicamento com mesmo nome
        const existing = await this._findMedicationByName(medication.dependent_id, normalizedName);
        if (existing) {
            if (existing.is_active === false) {
                const error = new Error('INACTIVE_MEDICATION_EXISTS');
                error.existingMedication = existing;
                throw error;
            }
            throw new Error('Já existe um medicamento ativo com este nome.');
        }

        const payload = {
            ...medication,
            name: medication.name.trim(),
            is_active: medication.is_active !== false,
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

    async _findMedicationByName(dependentId, name) {
        if (!dependentId || !name) return null;
        try {
            const { data, error } = await supabase
                .from('medications')
                .select('*')
                .eq('dependent_id', dependentId)
                .ilike('name', name)
                .limit(1);

            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error finding medication by name:', error);
            const all = await OfflineDB.getAll('medications');
            return all.find(m => m.dependent_id === dependentId && m.name && m.name.trim().toLowerCase() === name) || null;
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

    async _hasActiveTreatmentWithMedication(medicationId) {
        if (!medicationId) return false;
        try {
            const { data, error } = await supabase
                .from('treatments')
                .select('*')
                .eq('medication_id', medicationId)
                .eq('is_active', true)
                .limit(1);

            if (error) throw error;
            return data && data.length > 0;
        } catch (error) {
            console.error('Error checking active treatments:', error);
            const all = await OfflineDB.getAll('treatments');
            return all.some(t => t.medication_id === medicationId && t.is_active !== false);
        }
    },

    async deactivateMedication(id) {
        const hasActiveTreatment = await this._hasActiveTreatmentWithMedication(id);
        if (hasActiveTreatment) {
            throw new Error('Este medicamento não pode ser desativado porque está vinculado a um tratamento ativo.');
        }

        return await this.updateMedication(id, { is_active: false });
    },

    async reactivateMedication(id) {
        return await this.updateMedication(id, { is_active: true });
    },

    async deleteMedication(id) {
        // Mantido para compatibilidade, mas agora faz soft delete
        return await this.deactivateMedication(id);
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
                    medications:medication_id (id, name, stock_quantity, is_controlled, is_continuous_use),
                    healthcare_professionals:prescribed_by (name, specialty),
                    medication_times_on_treatment (*),
                    subcategories:subcategory_id (
                        id,
                        name,
                        categories:category_id (id, name)
                    )
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

    async addTreatment(treatment, weeklyTimes = null) {
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

            // Insere os horarios semanais ANTES de criar o schedule
            if (Array.isArray(weeklyTimes) && weeklyTimes.length > 0) {
                try {
                    await this.addTreatmentTimes(data.id, weeklyTimes);
                } catch (timesError) {
                    console.error('Error adding treatment times:', timesError);
                }
            }

            // Cria automaticamente o registro NEXT para a próxima dose
            try {
                console.log('🔍 addTreatment: creating next schedule for', data.id, 'schedule_type=', data.schedule_type, 'is_active=', data.is_active);
                if (data.schedule_type !== 'rescue') {
                    await this._ensureNextScheduleForTreatment(data);
                } else {
                    console.log('🔍 addTreatment: skipping rescue treatment');
                }
            } catch (nextError) {
                console.error('Error creating next schedule for treatment:', nextError);
            }

            return data;

        } catch (error) {
            await OfflineDB.queueForSync('treatments', 'insert', payload);
            throw error;
        }
    },

    async updateTreatment(id, updates, weeklyTimes = null) {
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

            // Atualiza os horarios semanais ANTES de recriar o schedule
            if (Array.isArray(weeklyTimes)) {
                try {
                    await this.updateTreatmentTimes(id, weeklyTimes);
                } catch (timesError) {
                    console.error('Error updating treatment times:', timesError);
                }
            }

            // Atualiza o schedule NEXT quando horario/frequencia mudam
            try {
                console.log('🔍 updateTreatment: updating next schedule for', data.id, 'schedule_type=', data.schedule_type, 'is_active=', data.is_active);
                if (data.schedule_type !== 'rescue' && data.is_active !== false) {
                    await this._removeNextScheduleForTreatment(id);
                    await this._ensureNextScheduleForTreatment(data);
                } else {
                    console.log('🔍 updateTreatment: removing schedule for rescue/inactive treatment');
                    await this._removeNextScheduleForTreatment(id);
                }
            } catch (nextError) {
                console.error('Error updating next schedule for treatment:', nextError);
            }

            return data;

        } catch (error) {
            await OfflineDB.queueForSync('treatments', 'update', { id, ...payload });
            throw error;
        }
    },

    async deleteTreatment(id) {
        try {
            // Remove todos os vinculos com schedules (NEXT e executados)
            await this._removeAllScheduleLinksForTreatment(id);

            // Remove horarios semanais, se houver
            try {
                await supabase.from('medication_times_on_treatment').delete().eq('treatment_id', id);
                const allTimes = await OfflineDB.getAll('medication_times_on_treatment');
                for (const item of allTimes.filter(mt => mt.treatment_id === id)) {
                    await OfflineDB.delete('medication_times_on_treatment', item.id);
                }
            } catch (e) {
                console.error('Error deleting treatment times:', e);
            }

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

    async _removeAllScheduleLinksForTreatment(treatmentId) {
        if (!treatmentId) return;

        try {
            const { data: links, error } = await supabase
                .from('treatments_in_schedule')
                .select('id, scheduling_id')
                .eq('treatment_id', treatmentId);

            if (error) throw error;
            if (!links || links.length === 0) return;

            const scheduleIds = [...new Set(links.map(l => l.scheduling_id).filter(Boolean))];

            // Deleta os links
            try {
                await supabase.from('treatments_in_schedule').delete().eq('treatment_id', treatmentId);
                for (const link of links) {
                    await OfflineDB.delete('treatments_in_schedule', link.id);
                }
            } catch (e) {
                console.error('Error deleting treatment schedule links:', e);
            }

            // Deleta schedules que ficaram orfaos
            for (const scheduleId of scheduleIds) {
                try {
                    const { data: remaining, error: countError } = await supabase
                        .from('treatments_in_schedule')
                        .select('id')
                        .eq('scheduling_id', scheduleId);
                    if (countError) throw countError;

                    if (!remaining || remaining.length === 0) {
                        await supabase.from('scheduling').delete().eq('id', scheduleId);
                        await OfflineDB.delete('scheduling', scheduleId);
                    }
                } catch (e) {
                    console.error('Error deleting orphan schedule:', e);
                }
            }
        } catch (error) {
            console.error('Error removing schedule links for treatment:', error);
        }
    },

    // ========== MEDICATION TIMES ON TREATMENT ==========

    async getTreatmentTimes(treatmentId) {
        if (!treatmentId) return [];

        try {
            const { data, error } = await supabase
                .from('medication_times_on_treatment')
                .select('*')
                .eq('treatment_id', treatmentId)
                .order('day_of_week', { ascending: true })
                .order('time', { ascending: true });

            if (error) throw error;
            return data || [];

        } catch (error) {
            const all = await OfflineDB.getAll('medication_times_on_treatment');
            return all.filter(mt => mt.treatment_id === treatmentId);
        }
    },

    async addTreatmentTimes(treatmentId, times) {
        if (!treatmentId) throw new Error('treatment_id is required');
        if (!Array.isArray(times) || times.length === 0) return [];

        const payload = times.map(t => ({
            treatment_id: treatmentId,
            day_of_week: t.day_of_week,
            time: t.time,
            dosage: t.dosage
        }));

        try {
            const { data, error } = await supabase
                .from('medication_times_on_treatment')
                .insert(payload)
                .select();

            if (error) throw error;
            for (const item of (data || [])) {
                await OfflineDB.set('medication_times_on_treatment', item.id, item);
            }
            return data || [];

        } catch (error) {
            for (const item of payload) {
                await OfflineDB.queueForSync('medication_times_on_treatment', 'insert', item);
            }
            throw error;
        }
    },

    async updateTreatmentTimes(treatmentId, times) {
        if (!treatmentId) throw new Error('treatment_id is required');

        // Delete existing and insert new (simplest sync-safe approach)
        try {
            await supabase
                .from('medication_times_on_treatment')
                .delete()
                .eq('treatment_id', treatmentId);

            const allOffline = await OfflineDB.getAll('medication_times_on_treatment');
            for (const item of allOffline.filter(mt => mt.treatment_id === treatmentId)) {
                await OfflineDB.delete('medication_times_on_treatment', item.id);
            }

            if (Array.isArray(times) && times.length > 0) {
                return await this.addTreatmentTimes(treatmentId, times);
            }
            return [];

        } catch (error) {
            await OfflineDB.queueForSync('medication_times_on_treatment', 'update', { treatment_id: treatmentId, times });
            throw error;
        }
    },

    // ========== PRESCRIPTIONS ==========

    async getPrescriptions(dependentId) {
        if (!dependentId) return [];

        try {
            const { data, error } = await supabase
                .from('prescriptions')
                .select(`
                    *,
                    medications:medication_id (name, laboratories:laboratory_id (name)),
                    healthcare_professionals:prescribed_by (name, specialty)
                `)
                .eq('dependent_id', dependentId)
                .order('expiration_date', { ascending: true });

            if (error) throw error;
            return data || [];

        } catch (error) {
            const all = await OfflineDB.getAll('prescriptions');
            return all.filter(p => p.dependent_id === dependentId);
        }
    },

    async getPrescriptionCountsByMedication(dependentId) {
        if (!dependentId) return {};

        try {
            const { data, error } = await supabase
                .from('prescriptions')
                .select('medication_id, units, status')
                .eq('dependent_id', dependentId)
                .eq('status', 'Valid');

            if (error) throw error;

            const counts = {};
            (data || []).forEach(p => {
                if (p.medication_id) {
                    if (!counts[p.medication_id]) {
                        counts[p.medication_id] = { count: 0, totalUnits: 0 };
                    }
                    counts[p.medication_id].count++;
                    counts[p.medication_id].totalUnits += parseInt(p.units) || 0;
                }
            });
            return counts;

        } catch (error) {
            const all = await OfflineDB.getAll('prescriptions');
            const counts = {};
            all.filter(p => p.dependent_id === dependentId && p.status === 'Valid').forEach(p => {
                if (p.medication_id) {
                    if (!counts[p.medication_id]) {
                        counts[p.medication_id] = { count: 0, totalUnits: 0 };
                    }
                    counts[p.medication_id].count++;
                    counts[p.medication_id].totalUnits += parseInt(p.units) || 0;
                }
            });
            return counts;
        }
    },

    async addPrescription(prescription) {
        if (!prescription.dependent_id) throw new Error('dependent_id is required');
        if (!prescription.medication_id) throw new Error('medication_id is required');

        const payload = {
            ...prescription,
            units: parseInt(prescription.units) || 0
        };

        try {
            const { data, error } = await supabase
                .from('prescriptions')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('prescriptions', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('prescriptions', 'insert', payload);
            throw error;
        }
    },

    async updatePrescription(id, updates) {
        const payload = {
            ...updates,
            units: updates.units !== undefined ? parseInt(updates.units) : undefined
        };

        try {
            const { data, error } = await supabase
                .from('prescriptions')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('prescriptions', id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('prescriptions', 'update', { id, ...payload });
            throw error;
        }
    },

    async deletePrescription(id) {
        try {
            const { error } = await supabase
                .from('prescriptions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await OfflineDB.delete('prescriptions', id);

        } catch (error) {
            await OfflineDB.queueForSync('prescriptions', 'delete', { id });
            throw error;
        }
    },

    async usePrescription(id) {
        if (!id) throw new Error('id is required');

        let prescription = null;

        try {
            // Fetch prescription with medication
            const { data: prescriptionData, error: prescriptionError } = await supabase
                .from('prescriptions')
                .select('*, medications(medication_id:id, stock_quantity, stock_last_updated)')
                .eq('id', id)
                .single();

            prescription = prescriptionData;

            if (prescriptionError) throw prescriptionError;
            if (!prescription) throw new Error('Receituário não encontrado');
            if (prescription.status === 'Used') throw new Error('Receituário já foi utilizado');

            const medicationId = prescription.medication_id;
            const units = parseInt(prescription.units) || 0;

            // Update medication stock
            const { data: medication, error: medicationError } = await supabase
                .from('medications')
                .select('stock_quantity')
                .eq('id', medicationId)
                .single();

            if (medicationError) throw medicationError;

            const newStock = (medication.stock_quantity || 0) + units;
            const now = new Date().toISOString();

            const { error: updateMedError } = await supabase
                .from('medications')
                .update({ stock_quantity: newStock, stock_last_updated: now })
                .eq('id', medicationId);

            if (updateMedError) throw updateMedError;

            // Update prescription status
            const { data: updatedPrescription, error: updatePresError } = await supabase
                .from('prescriptions')
                .update({ status: 'Used', used_date: now })
                .eq('id', id)
                .select()
                .single();

            if (updatePresError) throw updatePresError;

            // Update offline stores
            await OfflineDB.set('medications', medicationId, {
                ...medication,
                stock_quantity: newStock,
                stock_last_updated: now
            });
            await OfflineDB.set('prescriptions', id, updatedPrescription);

            return updatedPrescription;

        } catch (error) {
            await OfflineDB.queueForSync('prescriptions', 'update', { id, status: 'Used', used_date: new Date().toISOString() });
            await OfflineDB.queueForSync('medications', 'update', { id: prescription?.medication_id, stock_quantity: null }); // stock will be resolved online
            throw error;
        }
    },

    // ========== SCHEDULING ==========

    async getLastScheduling(dependentId) {
        if (!dependentId) return null;

        try {
            const { data, error } = await supabase
                .from('scheduling')
                .select('*')
                .eq('dependent_id', dependentId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching last scheduling:', error);
            const all = await OfflineDB.getAll('scheduling');
            const filtered = all.filter(s => s.dependent_id === dependentId);
            return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
        }
    },

    async getRecentSchedules(dependentId, limit = 10) {
        if (!dependentId) return [];

        try {
            const { data: schedules, error: schedulesError } = await supabase
                .from('scheduling')
                .select('*')
                .eq('dependent_id', dependentId)
                .neq('action', 'NEXT')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (schedulesError) throw schedulesError;
            if (!schedules || schedules.length === 0) return [];

            const enriched = await Promise.all(schedules.map(async (schedule) => {
                const links = await this._getScheduleLinks(schedule.id);
                return { scheduling: schedule, items: links };
            }));

            return enriched;

        } catch (error) {
            console.error('Error fetching recent schedules:', error);
            const all = await OfflineDB.getAll('scheduling');
            const filtered = all
                .filter(s => s.dependent_id === dependentId && s.action !== 'NEXT')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);

            return filtered.map(schedule => ({ scheduling: schedule, items: [] }));
        }
    },

    async getLastAction(dependentId) {
        if (!dependentId) return null;

        try {
            const { data: schedules, error } = await supabase
                .from('scheduling')
                .select('*')
                .eq('dependent_id', dependentId)
                .neq('action', 'NEXT')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (!schedules || schedules.length === 0) return null;

            const schedule = schedules[0];
            const links = await this._getScheduleLinks(schedule.id);
            return { scheduling: schedule, items: links };

        } catch (error) {
            console.error('Error fetching last action:', error);
            const all = await OfflineDB.getAll('scheduling');
            const filtered = all
                .filter(s => s.dependent_id === dependentId && s.action !== 'NEXT')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            if (filtered.length === 0) return null;
            return { scheduling: filtered[0], items: [] };
        }
    },

    async getNextDoseSchedules(dependentId, limit = 2) {
        if (!dependentId) return [];

        try {
            const { data: schedules, error } = await supabase
                .from('scheduling')
                .select('*')
                .eq('dependent_id', dependentId)
                .eq('action', 'NEXT')
                .order('schedule_date', { ascending: true })
                .order('schedule_time', { ascending: true })
                .limit(limit);

            console.log('🔍 getNextDoseSchedules raw:', { dependentId, count: schedules?.length, error, schedules });
            if (error) throw error;
            if (!schedules || schedules.length === 0) return [];

            const enriched = await Promise.all(schedules.map(async (schedule) => {
                const links = await this._getScheduleLinks(schedule.id);
                const treatments = links
                    .filter(l => l.treatments)
                    .map(l => ({ ...l.treatments, dosage: l.dosage }));
                const medications = links
                    .filter(l => l.medications && !l.treatments)
                    .map(l => ({ ...l.medications, dosage: l.dosage }));

                return {
                    scheduling: schedule,
                    time: this._scheduleToDate(schedule),
                    treatments,
                    medications,
                    items: links
                };
            }));

            console.log('🔍 getNextDoseSchedules enriched:', enriched);
            return enriched;

        } catch (error) {
            console.error('Error fetching next dose schedules:', error);
            const all = await OfflineDB.getAll('scheduling');
            const filtered = all
                .filter(s => s.dependent_id === dependentId && s.action === 'NEXT')
                .sort((a, b) => {
                    const da = `${a.schedule_date || ''}T${a.schedule_time || ''}`;
                    const db = `${b.schedule_date || ''}T${b.schedule_time || ''}`;
                    return da.localeCompare(db);
                })
                .slice(0, limit);
            return filtered.map(s => ({
                scheduling: s,
                time: this._scheduleToDate(s),
                treatments: [],
                medications: [],
                items: []
            }));
        }
    },

    async _getLastExecutedScheduleForTreatment(treatmentId) {
        if (!treatmentId) return null;
        try {
            const { data, error } = await supabase
                .from('treatments_in_schedule')
                .select(`
                    scheduling_id,
                    scheduling:scheduling_id (schedule_date, schedule_time, action)
                `)
                .eq('treatment_id', treatmentId)
                .neq('scheduling.action', 'NEXT');

            if (error) throw error;
            if (!data || data.length === 0) return null;

            // Ordena localmente pois Supabase nao permite order por coluna de tabela relacionada
            const sorted = data.sort((a, b) => {
                const da = `${a.scheduling.schedule_date || ''}T${a.scheduling.schedule_time || ''}`;
                const db = `${b.scheduling.schedule_date || ''}T${b.scheduling.schedule_time || ''}`;
                return db.localeCompare(da);
            });

            return sorted[0].scheduling;
        } catch (error) {
            console.error('Error fetching last executed schedule:', error);
            return null;
        }
    },

    async _calculateNextDoseTime(treatment, referenceTime = new Date()) {
        console.log('🔍 _calculateNextDoseTime called:', { treatmentId: treatment?.id, schedule_type: treatment?.schedule_type, start_date: treatment?.start_date, first_dose_time: treatment?.first_dose_time, frequency_hours: treatment?.frequency_hours });
        // Busca ultimo horario executado (Taken/Skipped) para este tratamento
        const lastExecuted = await this._getLastExecutedScheduleForTreatment(treatment.id);
        console.log('🔍 _calculateNextDoseTime: lastExecuted=', lastExecuted);

        // Weekly schedule
        if (treatment.schedule_type === 'weekly') {
            const times = await this.getTreatmentTimes(treatment.id);
            console.log('🔍 _calculateNextDoseTime: weekly times=', times);
            if (!times || times.length === 0) return null;

            const startDate = treatment.start_date ? new Date(treatment.start_date + 'T00:00:00') : null;
            const endDate = treatment.end_date ? new Date(treatment.end_date + 'T00:00:00') : null;

            // Se nunca foi executado, pula horarios passados (usando referenceTime)
            // Se ja foi executado, busca o proximo horario na sequencia (sem pular)
            let startSearch;
            if (lastExecuted && lastExecuted.schedule_date && lastExecuted.schedule_time) {
                const [y, m, d] = lastExecuted.schedule_date.split('-').map(Number);
                const [h, min] = lastExecuted.schedule_time.split(':').map(Number);
                startSearch = new Date(y, m - 1, d, h, min, 0, 0);
                startSearch = new Date(startSearch.getTime() + 60000); // 1 min apos ultima dose
            } else {
                startSearch = referenceTime;
            }

            // Busca o primeiro horario valido a partir do ponto de partida
            for (let i = 0; i < 28; i++) {
                const candidate = new Date(startSearch);
                candidate.setDate(candidate.getDate() + i);
                candidate.setHours(0, 0, 0, 0);

                if (startDate && candidate < startDate) continue;
                if (endDate && candidate > endDate) continue;

                const dayOfWeek = candidate.getDay();
                const dayTimes = times
                    .filter(t => t.day_of_week === dayOfWeek)
                    .sort((a, b) => a.time.localeCompare(b.time));

                for (const slot of dayTimes) {
                    const [hours, minutes] = slot.time.split(':').map(Number);
                    const doseTime = new Date(candidate);
                    doseTime.setHours(hours, minutes, 0, 0);
                    if (doseTime > startSearch) {
                        return doseTime;
                    }
                }
            }
            return null;
        }

        // Periodic schedule (legacy)
        const freqHours = treatment.frequency_hours || 0;
        if (freqHours <= 0) return null;

        const freqMs = freqHours * 60 * 60 * 1000;

        if (!treatment.start_date || !treatment.first_dose_time) return null;
        const [hours, minutes] = treatment.first_dose_time.split(':').map(Number);

        let baseTime;
        if (lastExecuted && lastExecuted.schedule_date && lastExecuted.schedule_time) {
            // Proximo horario apos o ultimo executado (sem pular)
            const [y, m, d] = lastExecuted.schedule_date.split('-').map(Number);
            const [h, min] = lastExecuted.schedule_time.split(':').map(Number);
            baseTime = new Date(y, m - 1, d, h, min, 0, 0);
            baseTime = new Date(baseTime.getTime() + freqMs);
        } else {
            // Nunca executado: primeiro horario futuro a partir de referenceTime
            baseTime = new Date(treatment.start_date + 'T00:00:00');
            baseTime.setHours(hours, minutes, 0, 0);
            while (baseTime <= referenceTime) {
                baseTime = new Date(baseTime.getTime() + freqMs);
            }
        }

        console.log('🔍 _calculateNextDoseTime: periodic baseTime=', baseTime);
        return baseTime;
    },

    _isSameDoseTime(time1, time2, freqMs) {
        // Check if two times are the same dose slot (within the same frequency interval)
        const diff = Math.abs(time1.getTime() - time2.getTime());
        return diff < 60000; // 1 minute tolerance
    },

    _toISODate(date) {
        return date.toISOString().split('T')[0];
    },

    _toLocalTimeString(date) {
        return date.toTimeString().slice(0, 5);
    },

    _scheduleToDate(schedule) {
        if (!schedule || !schedule.schedule_date || !schedule.schedule_time) return null;
        const [year, month, day] = schedule.schedule_date.split('-').map(Number);
        const [hours, minutes] = schedule.schedule_time.split(':').map(Number);
        // Cria o Date em horario local (sem conversao UTC)
        return new Date(year, month - 1, day, hours, minutes, 0, 0);
    },

    async _getSchedule(id) {
        if (!id) return null;
        try {
            const { data, error } = await supabase
                .from('scheduling')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching schedule:', error);
            return await OfflineDB.get('scheduling', id);
        }
    },

    async getSchedule(id) {
        return this._getSchedule(id);
    },

    async getScheduleWithLinks(id) {
        const schedule = await this._getSchedule(id);
        if (!schedule) return null;
        const items = await this._getScheduleLinks(id);
        return { scheduling: schedule, items };
    },

    async _getScheduleLinks(scheduleId) {
        if (!scheduleId) return [];
        try {
            const { data: links, error } = await supabase
                .from('treatments_in_schedule')
                .select('*')
                .eq('scheduling_id', scheduleId);
            if (error) throw error;

            const enriched = await Promise.all((links || []).map(async (link) => {
                if (link.treatment_id) {
                    const treatment = await this.getTreatment(link.treatment_id);
                    if (treatment) {
                        return {
                            ...link,
                            treatments: {
                                ...treatment,
                                medications: treatment.medication_id ? await this.getMedication(treatment.medication_id) : null
                            }
                        };
                    }
                }
                if (link.medication_id) {
                    const medication = await this.getMedication(link.medication_id);
                    return { ...link, medications: medication };
                }
                return link;
            }));
            return enriched;
        } catch (error) {
            console.error('Error fetching schedule links:', error);
            const all = await OfflineDB.getAll('treatments_in_schedule');
            return all.filter(l => l.scheduling_id === scheduleId);
        }
    },

    async _updateMedicationStock(medicationId, delta) {
        if (!medicationId || delta === 0) return;
        try {
            const medication = await this.getMedication(medicationId);
            if (!medication) return;
            const newStock = Math.max(0, (medication.stock_quantity || 0) + delta);
            await this.updateMedication(medicationId, {
                stock_quantity: newStock,
                stock_last_updated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating medication stock:', error);
        }
    },

    async _findOrCreateNextSchedule(dependentId, dateTime) {
        if (!dependentId || !dateTime) {
            console.log('🔍 _findOrCreateNextSchedule: missing dependentId or dateTime', { dependentId, dateTime });
            return null;
        }
        const dateStr = this._toISODate(dateTime);
        const timeStr = this._toLocalTimeString(dateTime);
        console.log('🔍 _findOrCreateNextSchedule:', { dependentId, dateStr, timeStr });

        try {
            const { data: existing, error } = await supabase
                .from('scheduling')
                .select('*')
                .eq('dependent_id', dependentId)
                .eq('schedule_date', dateStr)
                .eq('schedule_time', timeStr)
                .eq('action', 'NEXT');
            if (error) throw error;
            if (existing && existing.length > 0) {
                console.log('🔍 _findOrCreateNextSchedule: existing schedule found', existing[0]);
                return existing[0];
            }

            const payload = {
                dependent_id: dependentId,
                schedule_date: dateStr,
                schedule_time: timeStr,
                action: 'NEXT'
            };
            console.log('🔍 _findOrCreateNextSchedule: inserting schedule', payload);
            const { data, error: insertError } = await supabase
                .from('scheduling')
                .insert(payload)
                .select()
                .single();
            if (insertError) throw insertError;
            console.log('🔍 _findOrCreateNextSchedule: schedule created', data);
            await OfflineDB.set('scheduling', data.id, data);
            return data;
        } catch (error) {
            console.error('Error finding/creating next schedule:', error);
            const localId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : 'local-' + Date.now();
            const localSchedule = {
                id: localId,
                dependent_id: dependentId,
                schedule_date: dateStr,
                schedule_time: timeStr,
                action: 'NEXT',
                created_at: new Date().toISOString()
            };
            await OfflineDB.set('scheduling', localId, localSchedule);
            await OfflineDB.queueForSync('scheduling', 'insert', {
                dependent_id: dependentId,
                schedule_date: dateStr,
                schedule_time: timeStr,
                action: 'NEXT'
            });
            return localSchedule;
        }
    },

    async _linkTreatmentToSchedule(scheduleId, treatment, scheduleTime) {
        if (!scheduleId || !treatment) {
            console.log('🔍 _linkTreatmentToSchedule: missing scheduleId or treatment', { scheduleId, treatment });
            return;
        }
        const dose = await this._getTreatmentDoseForTime(treatment, scheduleTime);
        const payload = {
            scheduling_id: scheduleId,
            treatment_id: treatment.id,
            medication_id: treatment.medication_id,
            dosage: dose
        };
        console.log('🔍 _linkTreatmentToSchedule:', payload);
        try {
            const { data: existing, error: existingError } = await supabase
                .from('treatments_in_schedule')
                .select('*')
                .eq('scheduling_id', scheduleId)
                .eq('treatment_id', treatment.id);
            if (existingError) throw existingError;
            if (existing && existing.length > 0) {
                console.log('🔍 _linkTreatmentToSchedule: existing link found', existing[0]);
                return existing[0];
            }

            const { data, error } = await supabase
                .from('treatments_in_schedule')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            console.log('🔍 _linkTreatmentToSchedule: link created', data);
            await OfflineDB.set('treatments_in_schedule', data.id, data);
            return data;
        } catch (error) {
            await OfflineDB.queueForSync('treatments_in_schedule', 'insert', payload);
            console.error('Error linking treatment to schedule:', error);
        }
    },

    async _removeNextScheduleForTreatment(treatmentId) {
        if (!treatmentId) return;

        try {
            const { data: links, error } = await supabase
                .from('treatments_in_schedule')
                .select(`
                    id,
                    scheduling_id,
                    scheduling:scheduling_id (action)
                `)
                .eq('treatment_id', treatmentId)
                .eq('scheduling.action', 'NEXT');

            if (error) throw error;
            if (!links || links.length === 0) return;

            for (const link of links) {
                const scheduleId = link.scheduling_id;

                try {
                    await supabase.from('treatments_in_schedule').delete().eq('id', link.id);
                    await OfflineDB.delete('treatments_in_schedule', link.id);
                } catch (deleteError) {
                    console.error('Error deleting treatment-schedule link:', deleteError);
                    await OfflineDB.queueForSync('treatments_in_schedule', 'delete', { id: link.id });
                }

                // Se o schedule nao tem mais nenhum tratamento, remove ele tambem
                try {
                    const { data: remainingLinks, error: countError } = await supabase
                        .from('treatments_in_schedule')
                        .select('id')
                        .eq('scheduling_id', scheduleId);
                    if (countError) throw countError;

                    if (!remainingLinks || remainingLinks.length === 0) {
                        await supabase.from('scheduling').delete().eq('id', scheduleId);
                        await OfflineDB.delete('scheduling', scheduleId);
                    }
                } catch (e) {
                    console.error('Error checking remaining schedule links:', e);
                }
            }
        } catch (error) {
            console.error('Error removing next schedule for treatment:', error);
        }
    },

    async _ensureNextScheduleForTreatment(treatment, referenceTime = new Date()) {
        console.log('🔍 _ensureNextScheduleForTreatment called:', { treatmentId: treatment?.id, schedule_type: treatment?.schedule_type, is_active: treatment?.is_active, dependent_id: treatment?.dependent_id });
        if (!treatment || treatment.schedule_type === 'rescue' || treatment.is_active === false) {
            console.log('🔍 _ensureNextScheduleForTreatment: early return');
            return null;
        }
        const nextDoseTime = await this._calculateNextDoseTime(treatment, referenceTime);
        console.log('🔍 _ensureNextScheduleForTreatment: nextDoseTime=', nextDoseTime);
        if (!nextDoseTime) return null;
        const schedule = await this._findOrCreateNextSchedule(treatment.dependent_id, nextDoseTime);
        console.log('🔍 _ensureNextScheduleForTreatment: schedule=', schedule);
        if (schedule) {
            await this._linkTreatmentToSchedule(schedule.id, treatment, nextDoseTime);
        }
        return schedule;
    },

    async _getTreatmentDoseForTime(treatment, scheduleTime) {
        if (treatment.schedule_type !== 'weekly') {
            return parseFloat(treatment.dosage) || 0;
        }

        const times = await this.getTreatmentTimes(treatment.id);
        const st = new Date(scheduleTime);
        const dayOfWeek = st.getDay();
        const timeStr = st.toTimeString().slice(0, 5); // HH:MM

        const match = times.find(t => t.day_of_week === dayOfWeek && t.time === timeStr);
        if (match) return parseFloat(match.dosage) || 0;

        // Fallback to any matching time on the same day
        const dayMatch = times.find(t => t.day_of_week === dayOfWeek);
        if (dayMatch) return parseFloat(dayMatch.dosage) || 0;

        return parseFloat(treatment.dosage) || 0;
    },

    _toLocalISOString(date) {
        // Returns ISO string preserving local time (no UTC conversion)
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 19);
    },

    async recordDose(scheduleId, action, notes, extraMedications = []) {
        if (!scheduleId) throw new Error('schedule_id is required');
        if (!['Taken', 'Skipped'].includes(action)) throw new Error('Invalid action');

        const schedule = await this._getSchedule(scheduleId);
        if (!schedule) throw new Error('Schedule not found');
        if (schedule.action !== 'NEXT') throw new Error('Schedule is not a pending dose');

        const updates = { action, notes: notes || null };
        // Armazena timestamp tanto para TOMAR quanto para PULAR
        if (action === 'Taken' || action === 'Skipped') {
            updates.taken_at = new Date().toISOString();
        }

        try {
            // Update NEXT schedule to Taken/Skipped
            const { data: updatedRows, error } = await supabase
                .from('scheduling')
                .update(updates)
                .eq('id', scheduleId)
                .select();

            console.log('🔍 recordDose update result:', { scheduleId, updates, rows: updatedRows, error });
            if (error) throw error;

            const updatedSchedule = updatedRows && updatedRows.length > 0 ? updatedRows[0] : { ...schedule, ...updates };
            await OfflineDB.set('scheduling', updatedSchedule.id, updatedSchedule);

            // Add extra medication links (only for Taken)
            if (extraMedications && extraMedications.length > 0) {
                for (const extra of extraMedications) {
                    if (!extra.medication_id || !extra.dosage) continue;

                    const linkPayload = {
                        scheduling_id: scheduleId,
                        treatment_id: null,
                        medication_id: extra.medication_id,
                        dosage: parseFloat(extra.dosage) || 0
                    };

                    try {
                        const { data: linkData, error: linkError } = await supabase
                            .from('treatments_in_schedule')
                            .insert(linkPayload)
                            .select()
                            .single();

                        if (linkError) throw linkError;
                        await OfflineDB.set('treatments_in_schedule', linkData.id, linkData);
                    } catch (linkError) {
                        await OfflineDB.queueForSync('treatments_in_schedule', 'insert', linkPayload);
                        console.error('Error linking extra medication to schedule:', linkError);
                    }
                }
            }

            // Update medication stock for all linked items when Taken
            if (action === 'Taken') {
                const links = await this._getScheduleLinks(scheduleId);
                for (const link of links) {
                    const dosage = parseFloat(link.dosage) || 0;
                    if (dosage > 0) {
                        await this._updateMedicationStock(link.medication_id, -dosage);
                    }
                }
            }

            // Create next NEXT schedules for each linked treatment
            const links = await this._getScheduleLinks(scheduleId);
            const treatmentIds = [...new Set(links.filter(l => l.treatment_id).map(l => l.treatment_id))];
            for (const treatmentId of treatmentIds) {
                const treatment = await this.getTreatment(treatmentId);
                if (treatment && treatment.is_active !== false) {
                    await this._ensureNextScheduleForTreatment(treatment);
                }
            }

            return updatedSchedule;

        } catch (error) {
            console.error('Error recording dose:', error);
            throw error;
        }
    },

    async revertLastDose(dependentId) {
        if (!dependentId) throw new Error('dependent_id is required');

        try {
            // Find last non-NEXT schedule (Taken or Skipped)
            const { data: lastActions, error } = await supabase
                .from('scheduling')
                .select('*')
                .eq('dependent_id', dependentId)
                .neq('action', 'NEXT')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (!lastActions || lastActions.length === 0) {
                throw new Error('Nenhuma dose para reverter');
            }

            const lastScheduling = lastActions[0];

            // Restore stock if it was Taken
            if (lastScheduling.action === 'Taken') {
                const links = await this._getScheduleLinks(lastScheduling.id);
                for (const link of links) {
                    const dosage = parseFloat(link.dosage) || 0;
                    if (dosage > 0) {
                        await this._updateMedicationStock(link.medication_id, dosage);
                    }
                }
            }

            // Delete current NEXT schedules created after this action
            try {
                const { data: nextSchedules, error: nextError } = await supabase
                    .from('scheduling')
                    .select('*')
                    .eq('dependent_id', dependentId)
                    .eq('action', 'NEXT');

                if (nextError) throw nextError;

                for (const nextSchedule of (nextSchedules || [])) {
                    const { data: linksToDelete } = await supabase
                        .from('treatments_in_schedule')
                        .select('*')
                        .eq('scheduling_id', nextSchedule.id);

                    for (const link of (linksToDelete || [])) {
                        try {
                            await supabase.from('treatments_in_schedule').delete().eq('id', link.id);
                            await OfflineDB.delete('treatments_in_schedule', link.id);
                        } catch (e) {
                            await OfflineDB.queueForSync('treatments_in_schedule', 'delete', { id: link.id });
                        }
                    }

                    try {
                        await supabase.from('scheduling').delete().eq('id', nextSchedule.id);
                        await OfflineDB.delete('scheduling', nextSchedule.id);
                    } catch (e) {
                        await OfflineDB.queueForSync('scheduling', 'delete', { id: nextSchedule.id });
                    }
                }
            } catch (e) {
                console.error('Error deleting next schedules during revert:', e);
            }

            // Revert last schedule back to NEXT
            const { data: reverted, error: updateError } = await supabase
                .from('scheduling')
                .update({ action: 'NEXT', taken_at: null })
                .eq('id', lastScheduling.id)
                .select()
                .single();

            if (updateError) throw updateError;
            await OfflineDB.set('scheduling', reverted.id, reverted);

            return reverted;

        } catch (error) {
            console.error('Error reverting dose:', error);
            throw error;
        }
    },

    async getTreatment(id) {
        if (!id) return null;
        try {
            const { data, error } = await supabase
                .from('treatments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            return await OfflineDB.get('treatments', id);
        }
    },

    async getMedication(id) {
        if (!id) return null;
        try {
            const { data, error } = await supabase
                .from('medications')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            return await OfflineDB.get('medications', id);
        }
    },

    // ========== SYMPTOMS ==========

    async getSymptoms(dependentId) {
        if (!dependentId) return [];

        try {
            const { data, error } = await supabase
                .from('symptoms')
                .select('*')
                .eq('dependent_id', dependentId)
                .order('start_date', { ascending: false });

            if (error) throw error;
            return data || [];

        } catch (error) {
            const all = await OfflineDB.getAll('symptoms');
            return all.filter(s => s.dependent_id === dependentId);
        }
    },

    async addSymptom(symptom) {
        if (!symptom.dependent_id) throw new Error('dependent_id is required');
        if (!symptom.description) throw new Error('description is required');

        const payload = {
            ...symptom,
            severity: symptom.severity || null
        };

        try {
            const { data, error } = await supabase
                .from('symptoms')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('symptoms', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('symptoms', 'insert', payload);
            throw error;
        }
    },

    async updateSymptom(id, updates) {
        const payload = { ...updates };

        try {
            const { data, error } = await supabase
                .from('symptoms')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('symptoms', id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('symptoms', 'update', { id, ...payload });
            throw error;
        }
    },

    async deleteSymptom(id) {
        try {
            const { error } = await supabase
                .from('symptoms')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await OfflineDB.delete('symptoms', id);

        } catch (error) {
            await OfflineDB.queueForSync('symptoms', 'delete', { id });
            throw error;
        }
    },

    // ========== PROCEDURES (stored as events with event_type = 'Procedure') ==========

    async getProcedures(dependentId) {
        if (!dependentId) return [];

        try {
            const { data, error } = await supabase
                .from('events')
                .select('*, healthcare_professionals(name, specialty)')
                .eq('dependent_id', dependentId)
                .eq('event_type', 'Procedure')
                .order('event_date', { ascending: false });

            if (error) throw error;
            return data || [];

        } catch (error) {
            const all = await OfflineDB.getAll('events');
            return all.filter(e => e.dependent_id === dependentId && e.event_type === 'Procedure');
        }
    },

    async addProcedure(procedure) {
        if (!procedure.dependent_id) throw new Error('dependent_id is required');
        if (!procedure.description) throw new Error('description is required');
        if (!procedure.event_date) throw new Error('event_date is required');

        const payload = {
            ...procedure,
            event_type: 'Procedure'
        };

        try {
            const { data, error } = await supabase
                .from('events')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('events', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('events', 'insert', payload);
            throw error;
        }
    },

    async updateProcedure(id, updates) {
        const payload = { ...updates };

        try {
            const { data, error } = await supabase
                .from('events')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('events', id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('events', 'update', { id, ...payload });
            throw error;
        }
    },

    async deleteProcedure(id) {
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await OfflineDB.delete('events', id);

        } catch (error) {
            await OfflineDB.queueForSync('events', 'delete', { id });
            throw error;
        }
    },

    // ========== CATEGORIES ==========

    async getCategories(dependentId) {
        try {
            let query = supabase
                .from('categories')
                .select('*, subcategories(*)')
                .order('name', { ascending: true });

            if (dependentId) {
                query = query.eq('dependent_id', dependentId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];

        } catch (error) {
            const categories = await OfflineDB.getAll('categories');
            const subcategories = await OfflineDB.getAll('subcategories');
            return categories
                .filter(cat => !dependentId || cat.dependent_id === dependentId)
                .map(cat => ({
                    ...cat,
                    subcategories: subcategories.filter(sc => sc.category_id === cat.id)
                })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
    },

    async addCategory(category) {
        if (!category.name) throw new Error('name is required');
        if (!category.dependent_id) throw new Error('dependent_id is required');

        try {
            const { data, error } = await supabase
                .from('categories')
                .insert(category)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('categories', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('categories', 'insert', category);
            throw error;
        }
    },

    async updateCategory(id, updates) {
        const payload = { ...updates };

        try {
            const { data, error } = await supabase
                .from('categories')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('categories', id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('categories', 'update', { id, ...payload });
            throw error;
        }
    },

    async deleteCategory(id) {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await OfflineDB.delete('categories', id);

        } catch (error) {
            await OfflineDB.queueForSync('categories', 'delete', { id });
            throw error;
        }
    },

    // ========== SUBCATEGORIES ==========

    async getSubcategories(categoryId) {
        if (!categoryId) return [];

        try {
            const { data, error } = await supabase
                .from('subcategories')
                .select('*')
                .eq('category_id', categoryId)
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];

        } catch (error) {
            const all = await OfflineDB.getAll('subcategories');
            return all.filter(sc => sc.category_id === categoryId)
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
    },

    async addSubcategory(subcategory) {
        if (!subcategory.name) throw new Error('name is required');
        if (!subcategory.category_id) throw new Error('category_id is required');

        try {
            const { data, error } = await supabase
                .from('subcategories')
                .insert(subcategory)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('subcategories', data.id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('subcategories', 'insert', subcategory);
            throw error;
        }
    },

    async updateSubcategory(id, updates) {
        const payload = { ...updates };

        try {
            const { data, error } = await supabase
                .from('subcategories')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('subcategories', id, data);
            return data;

        } catch (error) {
            await OfflineDB.queueForSync('subcategories', 'update', { id, ...payload });
            throw error;
        }
    },

    async deleteSubcategory(id) {
        try {
            const { error } = await supabase
                .from('subcategories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await OfflineDB.delete('subcategories', id);

        } catch (error) {
            await OfflineDB.queueForSync('subcategories', 'delete', { id });
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
            const depIds = dependents.map(d => d.id);
            const [{ data: rows, error }, ...presCountsArr] = await Promise.all([
                supabase
                    .from('v_medication_autonomy')
                    .select('*')
                    .in('dependent_id', depIds),
                ...dependents.map(d => this.getPrescriptionCountsByMedication(d.id))
            ]);

            if (error) throw error;

            const prescriptionCounts = Object.assign({}, ...presCountsArr);

            // Agrupa por medicamento + dependente, somando o consumo diário de todos os tratamentos ativos
            const grouped = {};
            (rows || []).forEach(row => {
                if (!row.is_continuous_use) return;
                const key = `${row.medication_id}_${row.dependent_id}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        medication_id: row.medication_id,
                        medication_name: row.medication_name,
                        dependent_id: row.dependent_id,
                        dependent_name: row.dependent_name,
                        stock_quantity: parseFloat(row.stock_quantity) || 0,
                        is_controlled: row.is_controlled,
                        is_continuous_use: row.is_continuous_use,
                        daily_usage: 0
                    };
                }
                grouped[key].daily_usage += parseFloat(row.daily_usage) || 0;
            });

            const alerts = Object.values(grouped).map(item => {
                const weeks = item.daily_usage > 0 ? (item.stock_quantity / item.daily_usage / 7) : Infinity;
                const hasRx = !!prescriptionCounts[item.medication_id]?.count;
                return { ...item, weeks_remaining: weeks, has_valid_prescription: hasRx };
            }).filter(item => {
                if (item.is_controlled) {
                    return item.has_valid_prescription ? item.weeks_remaining <= 2 : item.weeks_remaining <= 3;
                }
                return item.weeks_remaining <= 1;
            });

            alerts.sort((a, b) => a.stock_quantity - b.stock_quantity);
            return alerts;

        } catch (error) {
            console.error('Error loading low stock alerts:', error);
            return [];
        }
    },

    async getExpiringPrescriptions() {
        const dependents = await this.getDependents();
        if (dependents.length === 0) return [];

        try {
            const depIds = dependents.map(d => d.id);
            const [{ data: expiringRows, error }, { data: allValid, error: countError }] = await Promise.all([
                supabase
                    .from('v_prescription_status')
                    .select('*')
                    .eq('computed_status', 'Valid')
                    .eq('expiring_soon', true)
                    .in('dependent_id', depIds)
                    .order('expiration_date', { ascending: true }),
                supabase
                    .from('prescriptions')
                    .select('medication_id, status')
                    .eq('status', 'Valid')
                    .in('dependent_id', depIds)
            ]);

            if (error) throw error;
            if (countError) throw countError;

            // Conta receitas válidas por medicamento
            const counts = {};
            (allValid || []).forEach(p => {
                if (!p.medication_id) return;
                counts[p.medication_id] = (counts[p.medication_id] || 0) + 1;
            });

            // Mantém apenas a receita mais próxima do vencimento para cada medicamento
            const seenMedications = new Set();
            const result = (expiringRows || []).filter(row => {
                if (seenMedications.has(row.medication_id)) return false;
                seenMedications.add(row.medication_id);
                return true;
            }).map(row => ({
                ...row,
                prescription_count: counts[row.medication_id] || 1,
                days_until_expiration: row.days_until_expiration ??
                    (row.expiration_date ? Math.max(Math.ceil((new Date(row.expiration_date) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)), 0) : null)
            }));

            return result;

        } catch (error) {
            console.error('Error loading expiring prescriptions:', error);
            return [];
        }
    },

    // ========== CONFIGURATION ==========

    async getConfig() {
        const userId = Auth.getUserId();
        if (!userId) return null;

        try {
            const { data, error } = await supabase
                .from('configuration')
                .select('*')
                .eq('owner_id', userId)
                .single();

            // PGRST116 = no rows returned
            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                await OfflineDB.set('configuration', userId, data);
                return data;
            }

            return await this.ensureConfig();

        } catch (error) {
            console.error('Error fetching configuration:', error);
            return await OfflineDB.get('configuration', userId);
        }
    },

    async ensureConfig() {
        const userId = Auth.getUserId();
        if (!userId) return null;

        try {
            const { data: existing, error: selectError } = await supabase
                .from('configuration')
                .select('*')
                .eq('owner_id', userId)
                .single();

            if (selectError && selectError.code !== 'PGRST116') throw selectError;
            if (existing) return existing;

            const payload = {
                owner_id: userId,
                language: (typeof i18n !== 'undefined' && i18n.getLanguage) ? i18n.getLanguage() : 'pt-BR',
                selected_dependent_id: null,
                alarm: false,
                notifications: false,
                show_all_dependents: false,
                show_all_treatments: false,
                show_all_prescriptions: false,
                show_all_events: false,
                show_all_symptoms: false
            };

            const { data, error } = await supabase
                .from('configuration')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            await OfflineDB.set('configuration', userId, data);
            return data;

        } catch (error) {
            console.error('Error ensuring configuration:', error);
            return null;
        }
    },

    async saveConfig(updates) {
        const userId = Auth.getUserId();
        if (!userId) throw new Error('User not authenticated');

        const payload = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from('configuration')
                .update(payload)
                .eq('owner_id', userId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    await this.ensureConfig();
                    return await this.saveConfig(updates);
                }
                throw error;
            }

            await OfflineDB.set('configuration', userId, data);
            return data;

        } catch (error) {
            console.error('Error saving configuration:', error);
            // Keep local copy up to date; will sync when user toggles again online
            const current = await OfflineDB.get('configuration', userId) || { owner_id: userId };
            await OfflineDB.set('configuration', userId, { ...current, ...payload });
            throw error;
        }
    }
};

// Expor globalmente
window.DB = DB;
