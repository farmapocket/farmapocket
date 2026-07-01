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
                .order('created_at', { ascending: false })
                .limit(limit);

            if (schedulesError) throw schedulesError;
            if (!schedules || schedules.length === 0) return [];

            const enriched = await Promise.all(schedules.map(async (schedule) => {
                try {
                    const { data: links, error: linksError } = await supabase
                        .from('treatments_in_schedule')
                        .select('*')
                        .eq('scheduling_id', schedule.id);

                    if (linksError) throw linksError;

                    const enrichedLinks = await Promise.all((links || []).map(async (link) => {
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

                    return { scheduling: schedule, items: enrichedLinks };
                } catch (error) {
                    return { scheduling: schedule, items: [] };
                }
            }));

            return enriched;

        } catch (error) {
            console.error('Error fetching recent schedules:', error);
            const all = await OfflineDB.getAll('scheduling');
            const filtered = all
                .filter(s => s.dependent_id === dependentId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);

            return filtered.map(schedule => ({ scheduling: schedule, items: [] }));
        }
    },

    async getLastAction(dependentId) {
        if (!dependentId) return null;

        const lastScheduling = await this.getLastScheduling(dependentId);
        if (!lastScheduling) return null;

        try {
            const { data: links, error: linksError } = await supabase
                .from('treatments_in_schedule')
                .select('*')
                .eq('scheduling_id', lastScheduling.id);

            if (linksError) throw linksError;

            // Enrich links with medication/treatment details
            const enrichedLinks = await Promise.all((links || []).map(async (link) => {
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

            return {
                scheduling: lastScheduling,
                items: enrichedLinks
            };

        } catch (error) {
            console.error('Error fetching last action:', error);
            const allLinks = await OfflineDB.getAll('treatments_in_schedule');
            const links = allLinks.filter(l => l.scheduling_id === lastScheduling.id);
            return {
                scheduling: lastScheduling,
                items: links
            };
        }
    },

    async getNextDoseSchedules(dependentId, limit = 2) {
        if (!dependentId) return [];

        const treatments = await this.getTreatments(dependentId);
        const activeTreatments = treatments.filter(t => t.is_active !== false);

        if (activeTreatments.length === 0) return [];

        const lastScheduling = await this.getLastScheduling(dependentId);
        const now = new Date();

        // Load weekly times for treatments that need them
        const timesMap = {};
        for (const t of activeTreatments) {
            if (t.schedule_type === 'weekly') {
                timesMap[t.id] = await this.getTreatmentTimes(t.id);
            }
        }

        // Calculate next dose for each treatment
        const nextDoses = [];
        for (const t of activeTreatments) {
            const doseTime = await this._calculateNextDoseTime(t, lastScheduling, now, timesMap[t.id]);
            if (doseTime) {
                nextDoses.push({ treatment: t, doseTime });
            }
        }

        // Group by time
        const grouped = {};
        nextDoses.forEach(item => {
            const key = item.doseTime.toISOString();
            if (!grouped[key]) {
                grouped[key] = {
                    time: item.doseTime,
                    treatments: []
                };
            }
            grouped[key].treatments.push(item.treatment);
        });

        // Sort by time and take the next N
        return Object.values(grouped)
            .sort((a, b) => a.time - b.time)
            .slice(0, limit);
    },

    async _calculateNextDoseTime(treatment, lastScheduling, now, weeklyTimes) {
        // Weekly schedule: find next day_of_week + time on/after now
        if (treatment.schedule_type === 'weekly') {
            const times = weeklyTimes || await this.getTreatmentTimes(treatment.id);
            if (!times || times.length === 0) return null;

            const startDate = treatment.start_date ? new Date(treatment.start_date) : null;
            const endDate = treatment.end_date ? new Date(treatment.end_date) : null;

            // Search up to 14 days ahead
            for (let i = 0; i < 14; i++) {
                const candidate = new Date(now);
                candidate.setDate(candidate.getDate() + i);

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

                    if (doseTime > now) {
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
        let baseTime = new Date(treatment.start_date);
        baseTime.setHours(hours, minutes, 0, 0);

        while (baseTime <= now) {
            baseTime = new Date(baseTime.getTime() + freqMs);
        }

        if (lastScheduling && lastScheduling.schedule_time) {
            const lastTime = new Date(lastScheduling.schedule_time);
            if (this._isSameDoseTime(lastTime, baseTime, freqMs)) {
                baseTime = new Date(baseTime.getTime() + freqMs);
            }
        }

        return baseTime;
    },

    _isSameDoseTime(time1, time2, freqMs) {
        // Check if two times are the same dose slot (within the same frequency interval)
        const diff = Math.abs(time1.getTime() - time2.getTime());
        return diff < 60000; // 1 minute tolerance
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

    async recordDose(dependentId, scheduleTime, action, treatments, notes, extraMedications = []) {
        if (!dependentId) throw new Error('dependent_id is required');
        if (!scheduleTime) throw new Error('schedule_time is required');
        if (!['Taken', 'Skipped'].includes(action)) throw new Error('Invalid action');

        const schedulingPayload = {
            dependent_id: dependentId,
            schedule_time: this._toLocalISOString(new Date(scheduleTime)),
            action: action,
            notes: notes || null
        };

        try {
            // Insert scheduling record
            const { data: schedulingData, error: schedulingError } = await supabase
                .from('scheduling')
                .insert(schedulingPayload)
                .select()
                .single();

            if (schedulingError) throw schedulingError;
            await OfflineDB.set('scheduling', schedulingData.id, schedulingData);

            // Link scheduled treatments (for both Taken and Skipped)
            if (treatments && treatments.length > 0) {
                for (const treatment of treatments) {
                    const doseForSlot = await this._getTreatmentDoseForTime(treatment, scheduleTime);
                    const linkPayload = {
                        scheduling_id: schedulingData.id,
                        treatment_id: treatment.id,
                        medication_id: treatment.medication_id,
                        dosage: doseForSlot
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
                        console.error('Error linking treatment to schedule:', linkError);
                    }

                    // Update medication stock only when Taken
                    if (action === 'Taken') {
                        try {
                            const medication = await this.getMedication(treatment.medication_id);
                            if (medication) {
                                const newStock = Math.max(0, (medication.stock_quantity || 0) - doseForSlot);
                                await this.updateMedication(treatment.medication_id, {
                                    stock_quantity: newStock,
                                    stock_last_updated: new Date().toISOString()
                                });
                            }
                        } catch (stockError) {
                            console.error('Error updating medication stock:', stockError);
                        }
                    }
                }
            }

            // Extra medications (not linked to an active treatment)
            if (extraMedications && extraMedications.length > 0) {
                for (const extra of extraMedications) {
                    if (!extra.medication_id || !extra.dosage) continue;

                    const linkPayload = {
                        scheduling_id: schedulingData.id,
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

                    // Update medication stock only when Taken
                    if (action === 'Taken') {
                        try {
                            const medication = await this.getMedication(extra.medication_id);
                            if (medication) {
                                const newStock = Math.max(0, (medication.stock_quantity || 0) - linkPayload.dosage);
                                await this.updateMedication(extra.medication_id, {
                                    stock_quantity: newStock,
                                    stock_last_updated: new Date().toISOString()
                                });
                            }
                        } catch (stockError) {
                            console.error('Error updating extra medication stock:', stockError);
                        }
                    }
                }
            }

            return schedulingData;

        } catch (error) {
            await OfflineDB.queueForSync('scheduling', 'insert', schedulingPayload);
            throw error;
        }
    },

    async revertLastDose(dependentId) {
        if (!dependentId) throw new Error('dependent_id is required');

        const lastScheduling = await this.getLastScheduling(dependentId);
        if (!lastScheduling) {
            throw new Error('Nenhuma dose para reverter');
        }

        try {
            // Delete treatment links and restore stock if it was Taken
            try {
                const { data: links, error: linksError } = await supabase
                    .from('treatments_in_schedule')
                    .select('*')
                    .eq('scheduling_id', lastScheduling.id);

                if (linksError) throw linksError;

                if (links && links.length > 0) {
                    for (const link of links) {
                        // Restore stock only when the action was Taken
                        if (lastScheduling.action === 'Taken') {
                            try {
                                const medicationId = link.medication_id;
                                const dosage = parseFloat(link.dosage) || 0;

                                if (medicationId && dosage > 0) {
                                    const medication = await this.getMedication(medicationId);
                                    if (medication) {
                                        const restoredStock = (medication.stock_quantity || 0) + dosage;
                                        await this.updateMedication(medicationId, {
                                            stock_quantity: restoredStock,
                                            stock_last_updated: new Date().toISOString()
                                        });
                                    }
                                }
                            } catch (stockError) {
                                console.error('Error restoring medication stock:', stockError);
                            }
                        }

                        // Delete link
                        try {
                            const { error: deleteLinkError } = await supabase
                                .from('treatments_in_schedule')
                                .delete()
                                .eq('id', link.id);

                            if (deleteLinkError) throw deleteLinkError;
                            await OfflineDB.delete('treatments_in_schedule', link.id);
                        } catch (deleteLinkError) {
                            await OfflineDB.queueForSync('treatments_in_schedule', 'delete', { id: link.id });
                            console.error('Error deleting treatment_in_schedule:', deleteLinkError);
                        }
                    }
                }
            } catch (linksError) {
                console.error('Error fetching treatments_in_schedule:', linksError);
            }

            // Delete scheduling record
            try {
                const { error: deleteSchedulingError } = await supabase
                    .from('scheduling')
                    .delete()
                    .eq('id', lastScheduling.id);

                if (deleteSchedulingError) throw deleteSchedulingError;
                await OfflineDB.delete('scheduling', lastScheduling.id);

            } catch (deleteSchedulingError) {
                await OfflineDB.queueForSync('scheduling', 'delete', { id: lastScheduling.id });
                throw deleteSchedulingError;
            }

            return lastScheduling;

        } catch (error) {
            // If overall Supabase fails, reflect locally and queue individual operations
            try {
                await OfflineDB.delete('scheduling', lastScheduling.id);
            } catch (e) { /* ignore */ }
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

    async getCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*, subcategories(*)')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];

        } catch (error) {
            const categories = await OfflineDB.getAll('categories');
            const subcategories = await OfflineDB.getAll('subcategories');
            return categories.map(cat => ({
                ...cat,
                subcategories: subcategories.filter(sc => sc.category_id === cat.id)
            })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
    },

    async addCategory(category) {
        if (!category.name) throw new Error('name is required');

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
    }
};

// Expor globalmente
window.DB = DB;
