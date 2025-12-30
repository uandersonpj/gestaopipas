// State Management
const appState = {
    currentUser: null, // { name: string, role: 'operator' | 'admin' }
    currentView: 'login-view',
    activityStartTime: null,
    activityInterval: null,
    photos: {
        step1: null,
        step2: null
    },
    geoCoords: null
};

// Data Manager (LocalStorage)
const DataManager = {
    getLogs: () => {
        const logs = localStorage.getItem('sv_logs');
        return logs ? JSON.parse(logs) : [];
    },
    saveLog: (log) => {
        const logs = DataManager.getLogs();
        logs.push(log);
        localStorage.setItem('sv_logs', JSON.stringify(logs));
    },
    clearLogs: () => {
        if(confirm("Tem certeza que deseja apagar todos os registros?")) {
            localStorage.removeItem('sv_logs');
            app.renderAdminLogs();
            app.updateAdminStats();
        }
    }
};

// Utils
const Utils = {
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('pt-BR');
    },
    formatTime: (date) => {
        return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },
    getCurrentDateTime: () => {
        const now = new Date();
        return {
            date: Utils.formatDate(now),
            time: Utils.formatTime(now),
            raw: now
        };
    },
    getGeoLocation: () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                resolve('N/A');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(`${pos.coords.latitude}, ${pos.coords.longitude}`),
                (err) => resolve('Erro Loc.')
            );
        });
    }
};

// Main App Logic
const app = {
    init: () => {
        // Check for active session (simplified)
        app.renderView('login-view');

        // Setup Photo Previews
        app.setupPhotoInput('photo-input-1', 'preview-1', 'step1');
        app.setupPhotoInput('photo-input-2', 'preview-2', 'step2');
    },

    // Navigation
    renderView: (viewId) => {
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        appState.currentView = viewId;
    },

    // Auth
    showOperatorLogin: () => {
        document.getElementById('operator-login-form').classList.remove('hidden');
        document.querySelector('.login-options').classList.add('hidden');
    },
    showAdminLogin: () => {
        document.getElementById('admin-login-form').classList.remove('hidden');
        document.querySelector('.login-options').classList.add('hidden');
    },
    resetLogin: () => {
        document.getElementById('operator-login-form').classList.add('hidden');
        document.getElementById('admin-login-form').classList.add('hidden');
        document.querySelector('.login-options').classList.remove('hidden');
        document.getElementById('operator-select').value = "";
        document.getElementById('admin-password').value = "";
    },
    loginOperator: () => {
        const name = document.getElementById('operator-select').value;
        if (!name) return alert('Selecione um operador.');

        appState.currentUser = { name, role: 'operator' };
        document.getElementById('user-info').textContent = `Operador: ${name}`;
        app.renderView('operator-dashboard-view');
    },
    loginAdmin: () => {
        const pass = document.getElementById('admin-password').value;
        // Simple mock password
        if (pass === 'admin123' || pass === 'serraverde') {
            appState.currentUser = { name: 'Admin', role: 'admin' };
            document.getElementById('user-info').textContent = `Administrador`;
            app.renderView('admin-view');
            app.renderAdminLogs();
            app.updateAdminStats();
        } else {
            alert('Senha incorreta.');
        }
    },
    logout: () => {
        appState.currentUser = null;
        app.stopTimer();
        app.resetLogin();
        app.renderView('login-view');
        document.getElementById('user-info').textContent = '';
    },

    // Operator Dashboard Logic
    startActivity: () => {
        appState.activityStartTime = new Date();
        document.getElementById('current-status').textContent = 'Em Atividade (Umectação)';
        document.getElementById('btn-start-activity').classList.add('hidden');
        document.getElementById('btn-stop-activity').classList.remove('hidden');

        // Timer
        const timerDisplay = document.getElementById('status-timer');
        appState.activityInterval = setInterval(() => {
            const now = new Date();
            const diff = now - appState.activityStartTime;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            timerDisplay.textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);

        // Log Start
        Utils.getGeoLocation().then(coords => {
             // We can log this internally or just wait for the stop
             console.log(`Started at ${coords}`);
        });
    },
    stopActivity: () => {
        if (!confirm('Deseja finalizar a atividade e registrar o apontamento?')) return;

        app.stopTimer();
        // Go straight to form to fill details
        app.goToForm();
    },
    stopTimer: () => {
        if (appState.activityInterval) {
            clearInterval(appState.activityInterval);
            appState.activityInterval = null;
        }
        document.getElementById('current-status').textContent = 'Parado';
        document.getElementById('status-timer').textContent = '00:00:00';
        document.getElementById('btn-start-activity').classList.remove('hidden');
        document.getElementById('btn-stop-activity').classList.add('hidden');
    },

    // Form Logic
    goToForm: () => {
        app.renderView('form-view');
        // Reset Form
        document.getElementById('photo-input-1').value = '';
        document.getElementById('photo-input-2').value = '';
        document.getElementById('preview-1').innerHTML = '📸 Toque para tirar foto';
        document.getElementById('preview-2').innerHTML = '📸 Toque para tirar foto';
        appState.photos = { step1: null, step2: null };

        document.getElementById('form-step-1').classList.remove('hidden');
        document.getElementById('form-step-2').classList.add('hidden');
    },
    setupPhotoInput: (inputId, previewId, stepKey) => {
        document.getElementById(inputId).addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // In a real app we'd resize this. Here we keep it simple but aware of localStorage limits
                const reader = new FileReader();
                reader.onload = (e) => {
                    appState.photos[stepKey] = 'Foto registrada'; // e.target.result; // Not storing full base64 in localstorage to avoid quota limit in this demo, just flag
                    document.getElementById(previewId).innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:100%">`;
                };
                reader.readAsDataURL(file);
            }
        });
    },
    nextStep: () => {
        // Validate Step 1
        // if (!appState.photos.step1 && !appState.photos.step2) {
        //     if(!confirm("Nenhuma foto registrada. Deseja prosseguir?")) return;
        // }

        document.getElementById('form-step-1').classList.add('hidden');
        document.getElementById('form-step-2').classList.remove('hidden');

        // Pre-fill Step 2
        const now = Utils.getCurrentDateTime();
        document.getElementById('form-employee').value = appState.currentUser.name;
        document.getElementById('form-date').value = now.date;
        document.getElementById('form-time').value = now.time;

        // Calculate duration if coming from timer
        // Not explicitly asked to fill duration field, but good to know
    },
    prevStep: () => {
        document.getElementById('form-step-2').classList.add('hidden');
        document.getElementById('form-step-1').classList.remove('hidden');
    },
    cancelForm: () => {
        app.renderView('operator-dashboard-view');
    },
    submitForm: async () => {
        const volume = document.getElementById('form-volume').value;
        const source = document.getElementById('form-source').value;
        const destination = document.getElementById('form-destination').value;

        if (!volume || !source || !destination) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const coords = await Utils.getGeoLocation();

        const logData = {
            id: Date.now(),
            operator: appState.currentUser.name,
            date: document.getElementById('form-date').value,
            time: document.getElementById('form-time').value,
            volume: volume,
            source: source,
            destination: destination,
            geolocation: coords,
            hasPhotos: (appState.photos.step1 || appState.photos.step2) ? 'Sim' : 'Não'
        };

        DataManager.saveLog(logData);
        alert('Apontamento registrado com sucesso!');
        app.renderView('operator-dashboard-view');
        // Reset timer vars just in case
        appState.activityStartTime = null;
    },

    // Admin Logic
    renderAdminLogs: () => {
        const logs = DataManager.getLogs().reverse(); // Newest first
        const tbody = document.querySelector('#logs-table tbody');
        tbody.innerHTML = '';

        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${log.date} ${log.time}</td>
                <td>${log.operator}</td>
                <td>${log.hasPhotos === 'Sim' ? '📸' : ''} Abastecimento</td>
                <td>${log.source}</td>
                <td>${log.destination}</td>
                <td>${log.volume}</td>
            `;
            tbody.appendChild(tr);
        });
    },
    updateAdminStats: () => {
        const logs = DataManager.getLogs();
        const totalVol = logs.reduce((acc, log) => acc + Number(log.volume || 0), 0);

        document.getElementById('stat-volume').textContent = `${totalVol.toLocaleString()} m³`;
        document.getElementById('stat-count').textContent = logs.length;
    },
    clearData: () => {
        DataManager.clearLogs();
    },
    exportCSV: () => {
        const logs = DataManager.getLogs();
        if (logs.length === 0) return alert('Sem dados para exportar.');

        const headers = ['ID', 'Operador', 'Data', 'Hora', 'Volume (m3)', 'Origem', 'Destino', 'Coordenadas', 'Fotos?'];
        const csvContent = [
            headers.join(','),
            ...logs.map(log => [
                log.id,
                log.operator,
                log.date,
                log.time,
                log.volume,
                `"${log.source}"`, // Quote strings that might have commas
                `"${log.destination}"`,
                `"${log.geolocation}"`,
                log.hasPhotos
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `serra_verde_export_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', app.init);
