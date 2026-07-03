// ============================================================
// FARMAPOCKET - Notifications & Alarm Module
// Handles medication alarms and pending-dose reminders
// ============================================================

const Notifications = {
    config: { alarm: false, notifications: false },
    monitoringInterval: null,
    audioContext: null,
    alarmOscillator: null,
    alarmGain: null,
    pulseTimeout: null,
    alarmScheduleId: null,
    // Track which schedules have already triggered alarm/notification
    notifiedSchedules: {}, // { scheduleId: { alarmFiredAt, lastNotificationAt, notificationCount } }

    // Doses currently being shown in the alarm modal
    currentAlarmDoses: [],

    CHECK_INTERVAL_MS: 30000,      // Check every 30 seconds
    REMINDER_INTERVAL_MS: 300000,  // Remind every 5 minutes

    async init() {
        console.log('🔔 Notifications.init()');

        try {
            const config = await DB.getConfig();
            if (config) {
                this.config = {
                    alarm: !!config.alarm,
                    notifications: !!config.notifications
                };
                console.log('🔔 Config loaded:', this.config);
            }
        } catch (e) {
            console.error('❌ Error loading notification config:', e);
        }

        if (this.config.alarm || this.config.notifications) {
            this.startMonitoring();
        }

        // Re-check immediately when app returns to foreground
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkPendingDoses();
            }
        });
    },

    updateConfig(config) {
        const oldAlarm = this.config.alarm;
        const oldNotifications = this.config.notifications;
        this.config = { ...this.config, ...config };

        const anyEnabled = this.config.alarm || this.config.notifications;
        if (anyEnabled && !this.monitoringInterval) {
            this.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.startMonitoring();
                } else {
                    console.warn('🔔 Notification permission not granted');
                }
            });
        } else if (!anyEnabled && this.monitoringInterval) {
            this.stopMonitoring();
        }

        if (oldAlarm && !this.config.alarm) {
            this.stopAlarm();
        }
    },

    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('🔔 Notifications not supported in this browser');
            return 'denied';
        }
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';

        try {
            const permission = await Notification.requestPermission();
            return permission;
        } catch (e) {
            console.error('❌ Error requesting notification permission:', e);
            return 'denied';
        }
    },

    startMonitoring() {
        if (this.monitoringInterval) return;
        console.log('🔔 Start monitoring pending doses');
        this.checkPendingDoses();
        this.monitoringInterval = setInterval(() => this.checkPendingDoses(), this.CHECK_INTERVAL_MS);
    },

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🔔 Stop monitoring pending doses');
        }
    },

    async checkPendingDoses() {
        if (!Auth.isAuthenticated()) return;
        if (!this.config.alarm && !this.config.notifications) return;

        try {
            const dependents = await DB.getDependents();
            const now = new Date();

            for (const dependent of dependents) {
                const schedules = await DB.getNextDoseSchedules(dependent.id, 5);
                for (const item of schedules) {
                    const schedule = item.scheduling;
                    if (!schedule || schedule.action !== 'NEXT') continue;

                    const scheduledDateTime = this._scheduleToDateTime(schedule);
                    if (!scheduledDateTime) continue;

                    if (scheduledDateTime <= now) {
                        this._handlePendingDose(item, dependent, now, scheduledDateTime);
                    } else if (this.notifiedSchedules[schedule.id]) {
                        // Future again (e.g. after revert) - reset state
                        delete this.notifiedSchedules[schedule.id];
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error checking pending doses:', error);
        }
    },

    _scheduleToDateTime(schedule) {
        if (!schedule.schedule_date || !schedule.schedule_time) return null;
        const [hours, minutes] = schedule.schedule_time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;

        const dt = new Date(schedule.schedule_date + 'T00:00:00');
        dt.setHours(hours, minutes, 0, 0);
        return dt;
    },

    _handlePendingDose(item, dependent, now, scheduledDateTime) {
        const schedule = item.scheduling;
        const state = this.notifiedSchedules[schedule.id] || {
            alarmFiredAt: null,
            lastNotificationAt: null,
            notificationCount: 0
        };

        // Trigger alarm exactly when the dose time arrives
        if (this.config.alarm && !state.alarmFiredAt) {
            this._addAlarmDose(item, dependent, scheduledDateTime);
            this.playAlarm(schedule.id);
            state.alarmFiredAt = now.toISOString();
        }

        // Send reminder notification every 5 minutes while pending
        if (this.config.notifications) {
            const minutesLate = Math.floor((now - scheduledDateTime) / 60000);
            const shouldNotify = !state.lastNotificationAt ||
                (now - new Date(state.lastNotificationAt)) >= this.REMINDER_INTERVAL_MS;
            console.log('🔔 Checking notification:', { scheduleId: schedule.id, minutesLate, shouldNotify, permission: Notification.permission });

            if (shouldNotify) {
                const medicationNames = [
                    ...(item.treatments || []),
                    ...(item.medications || [])
                ]
                    .map(m => m.name || m.medication_name)
                    .filter(Boolean)
                    .join(', ');

                const title = i18n.t('notifications.pendingTitle') || '⏰ Dose pendente';
                const body = `${dependent.name} — ${medicationNames || 'Medicação'} (${minutesLate} min atrasada)`;

                this.showNotification(title, {
                    body,
                    tag: schedule.id,
                    requireInteraction: true,
                    data: {
                        scheduleId: schedule.id,
                        dependentId: dependent.id,
                        url: '/app.html'
                    }
                });

                state.lastNotificationAt = now.toISOString();
                state.notificationCount++;
            }
        }

        this.notifiedSchedules[schedule.id] = state;
    },

    _addAlarmDose(item, dependent, scheduledDateTime) {
        const schedule = item.scheduling;
        const medicationNames = [
            ...(item.treatments || []),
            ...(item.medications || [])
        ]
            .map(m => m.name || m.medication_name)
            .filter(Boolean)
            .join(', ');

        // Avoid duplicates
        if (!this.currentAlarmDoses.some(d => d.scheduleId === schedule.id)) {
            this.currentAlarmDoses.push({
                scheduleId: schedule.id,
                dependentName: dependent.name,
                medicationNames: medicationNames || 'Medicação',
                scheduledTime: scheduledDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
        }
    },

    showAlarmModal() {
        const modal = document.getElementById('modal-alarm');
        const listEl = document.getElementById('alarm-doses-list');
        if (!modal || !listEl) return;

        listEl.innerHTML = this.currentAlarmDoses.map(dose => `
            <div class="flex items-start gap-3 p-3 bg-white rounded-lg border border-sky-100">
                <span class="text-xl">💊</span>
                <div class="flex-1">
                    <p class="font-medium text-gray-800">${dose.dependentName}</p>
                    <p class="text-sm text-sky-700">${dose.medicationNames}</p>
                    <p class="text-xs text-gray-500">Horário: ${dose.scheduledTime}</p>
                </div>
            </div>
        `).join('');

        modal.classList.remove('hidden');
    },

    dismissAlarmModal() {
        this.stopAlarm();
        this.currentAlarmDoses = [];
        const modal = document.getElementById('modal-alarm');
        if (modal) modal.classList.add('hidden');
    },

    playAlarm(scheduleId) {
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn('🔔 Web Audio API not supported');
            return;
        }

        this.stopAlarm();
        this.alarmScheduleId = scheduleId;

        // Show modal with pending doses
        this.showAlarmModal();

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.alarmOscillator = this.audioContext.createOscillator();
            this.alarmGain = this.audioContext.createGain();

            this.alarmOscillator.type = 'square';
            this.alarmOscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
            this.alarmGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);

            this.alarmOscillator.connect(this.alarmGain);
            this.alarmGain.connect(this.audioContext.destination);
            this.alarmOscillator.start();

            this._pulseAlarm();
        } catch (e) {
            console.error('❌ Error playing alarm:', e);
        }
    },

    _pulseAlarm() {
        if (!this.alarmOscillator || !this.alarmGain || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        this.alarmGain.gain.setValueAtTime(0.1, now);
        this.alarmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        this.alarmGain.gain.setValueAtTime(0.1, now + 0.5);

        this.pulseTimeout = setTimeout(() => this._pulseAlarm(), 500);
    },

    stopAlarm() {
        if (this.pulseTimeout) {
            clearTimeout(this.pulseTimeout);
            this.pulseTimeout = null;
        }
        if (this.alarmOscillator) {
            try { this.alarmOscillator.stop(); } catch (e) {}
            this.alarmOscillator = null;
        }
        if (this.audioContext) {
            try { this.audioContext.close(); } catch (e) {}
            this.audioContext = null;
        }
        this.alarmGain = null;
        this.alarmScheduleId = null;
    },

    async showNotification(title, options = {}) {
        console.log('🔔 showNotification called:', { title, permission: Notification.permission, inWindow: 'Notification' in window });
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            console.warn('🔔 Cannot show notification: permission=', Notification.permission, 'supported=', 'Notification' in window);
            return;
        }

        const defaultOptions = {
            icon: '/android-chrome-192x192.png',
            badge: '/android-chrome-192x192.png',
            tag: 'farma-pocket-' + Date.now(),
            requireInteraction: true,
            ...options
        };

        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, defaultOptions);
            } else {
                new Notification(title, defaultOptions);
            }
        } catch (e) {
            console.error('❌ Error showing notification:', e);
            try {
                new Notification(title, defaultOptions);
            } catch (e2) {
                // ignore
            }
        }
    },

    onDoseActionTaken(scheduleId) {
        this.dismissAlarmModal();
        if (scheduleId) {
            delete this.notifiedSchedules[scheduleId];
        } else {
            // Reset all if no specific schedule provided
            this.notifiedSchedules = {};
        }
    }
};
