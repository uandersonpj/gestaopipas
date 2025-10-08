document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000'; // Will be used later

    // --- SHARED MOCK DATA (until backend is connected) ---
    const mockUsers = [
      { username: "admin", password: "admin_password", role: "admin" },
      { username: "Nerias", password: "password123", role: "operator" },
      { username: "Ronivaldo", password: "password123", role: "operator" },
      { username: "Jorge", password: "password123", role: "operator" },
      { username: "Gustavo", password: "password123", role: "operator" }
    ];

    // --- ROUTING: Check which page is active ---
    if (document.querySelector('.login-container')) {
        initLoginPage();
    } else if (document.querySelector('.app-container')) {
        initAppPage();
    }

    // --- LOGIN PAGE LOGIC ---
    function initLoginPage() {
        const loginButton = document.getElementById('login-button');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const adminEmailInput = document.getElementById('admin-email');
        const loginError = document.getElementById('login-error');

        loginButton.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const adminEmail = adminEmailInput.value.trim();

            let user;
            if (adminEmail) { // Admin login
                user = mockUsers.find(u => u.username === 'admin' && u.role === 'admin' && adminEmail.includes('@')); // Simple check
            } else { // Operator login
                user = mockUsers.find(u => u.username === username && u.password === password && u.role === 'operator');
            }

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify({ username: user.username, role: user.role }));
                window.location.href = 'app.html';
            } else {
                loginError.textContent = 'Credenciais inválidas. Tente novamente.';
                loginError.style.display = 'block';
            }
        });
    }

    // --- MAIN APP PAGE LOGIC ---
    function initAppPage() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        // Auth Guard
        if (!currentUser) {
            window.location.href = 'index.html';
            return;
        }

        // --- Element References ---
        const currentUserSpan = document.getElementById('current-user');
        const logoutButton = document.getElementById('logout-button');
        const startUmectacaoBtn = document.getElementById('start-umectacao-btn');
        const endUmectacaoBtn = document.getElementById('end-umectacao-btn');
        const umectacaoStatus = document.getElementById('umectacao-status');
        const syncStatusDiv = document.getElementById('sync-status');

        // Form pages and navigation
        const page1 = document.getElementById('page1');
        const page2 = document.getElementById('page2');
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const saveBtn = document.getElementById('save-btn');
        const cancelBtn = document.getElementById('cancel-btn');

        // Form fields
        const dataInput = document.getElementById('data');
        const horarioInput = document.getElementById('horario');
        const funcionarioSelect = document.getElementById('funcionario');

        // --- Initial Setup ---
        currentUserSpan.textContent = currentUser.username;
        if (currentUser.role === 'operator') {
            funcionarioSelect.value = currentUser.username;
            funcionarioSelect.disabled = true;
        }

        setDefaultDateTime();
        updateSyncStatus();

        // --- Event Listeners ---
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('umectacaoStartTime');
            window.location.href = 'index.html';
        });

        nextBtn.addEventListener('click', () => {
            page1.style.display = 'none';
            page2.style.display = 'block';
        });

        prevBtn.addEventListener('click', () => {
            page2.style.display = 'none';
            page1.style.display = 'block';
        });

        cancelBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja cancelar e limpar o formulário?')) {
                resetForm();
            }
        });

        startUmectacaoBtn.addEventListener('click', startUmectacao);
        endUmectacaoBtn.addEventListener('click', endUmectacao);
        saveBtn.addEventListener('click', saveAppointment);

        // --- Functions ---
        function setDefaultDateTime() {
            const now = new Date();
            dataInput.value = now.toISOString().split('T')[0];
            horarioInput.value = now.toTimeString().split(' ')[0].substring(0, 5);
        }

        function getSimulatedLocation() {
            // Simulate getting GPS coordinates
            const lat = -14.235004;
            const lng = -51.92528;
            return `Lat: ${lat + (Math.random() - 0.5)}, Lng: ${lng + (Math.random() - 0.5)}`;
        }

        function startUmectacao() {
            const startTime = new Date();
            const startLocation = getSimulatedLocation();

            const umectacaoData = {
                startTime: startTime.toISOString(),
                startLocation: startLocation
            };

            localStorage.setItem('umectacaoData', JSON.stringify(umectacaoData));

            umectacaoStatus.innerHTML = `Umectação iniciada às ${startTime.toLocaleTimeString()} em ${startLocation}.`;
            umectacaoStatus.style.display = 'block';
            startUmectacaoBtn.disabled = true;
            endUmectacaoBtn.disabled = false;
        }

        function endUmectacao() {
            const umectacaoDataJSON = localStorage.getItem('umectacaoData');
            if (!umectacaoDataJSON) {
                alert("Erro: Nenhuma umectação foi iniciada.");
                return;
            }

            const umectacaoData = JSON.parse(umectacaoDataJSON);
            const endTime = new Date();
            const endLocation = getSimulatedLocation();

            umectacaoData.endTime = endTime.toISOString();
            umectacaoData.endLocation = endLocation;

            // For now, just display the result. This data should be linked to an appointment.
            umectacaoStatus.innerHTML += `<br>Finalizada às ${endTime.toLocaleTimeString()} em ${endLocation}.`;

            localStorage.removeItem('umectacaoData'); // Clear after finishing
            startUmectacaoBtn.disabled = false;
            endUmectacaoBtn.disabled = true;
        }

        function saveAppointment() {
            // Collect form data
            const appointment = {
                id: Date.now(), // Simple unique ID for offline use
                funcionario: funcionarioSelect.value,
                data: dataInput.value,
                horarioCarregamento: horarioInput.value,
                volume: document.getElementById('volume').value,
                localAbastecido: document.querySelector('input[name="local_abastecido"]:checked')?.value || '',
                localUmectado: document.getElementById('local-umectado').value,
                fotoEscata: document.getElementById('foto-escata').files[0]?.name || 'N/A',
                fotoBruta: document.getElementById('foto-bruta').files[0]?.name || 'N/A',
                apontamentoLocation: getSimulatedLocation(),
                status: 'pending'
            };

            // Basic validation
            if (!appointment.funcionario || !appointment.localAbastecido || !appointment.localUmectado) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            // Save to localStorage
            const unsyncedAppointments = JSON.parse(localStorage.getItem('unsyncedAppointments')) || [];
            unsyncedAppointments.push(appointment);
            localStorage.setItem('unsyncedAppointments', JSON.stringify(unsyncedAppointments));

            alert('Apontamento salvo com sucesso! Será sincronizado quando houver conexão.');
            resetForm();
            updateSyncStatus();
        }

        function resetForm() {
            document.querySelector('.form-container').reset();
            setDefaultDateTime();
            page2.style.display = 'none';
            page1.style.display = 'block';
        }

        function updateSyncStatus() {
            const unsyncedAppointments = JSON.parse(localStorage.getItem('unsyncedAppointments')) || [];
            if (unsyncedAppointments.length > 0) {
                syncStatusDiv.textContent = `${unsyncedAppointments.length} apontamento(s) pendente(s) para sincronizar.`;
                syncStatusDiv.style.backgroundColor = '#ffcdd2';
            } else {
                syncStatusDiv.textContent = 'Todos os apontamentos estão sincronizados.';
                syncStatusDiv.style.backgroundColor = '#c8e6c9';
            }
        }

        // Mock sync function - to be replaced with actual API call
        function syncData() {
            const unsyncedAppointments = JSON.parse(localStorage.getItem('unsyncedAppointments')) || [];
            if (unsyncedAppointments.length === 0) {
                console.log("No appointments to sync.");
                return;
            }

            console.log("Attempting to sync:", unsyncedAppointments);

            // In a real scenario, you would loop through these and send to the backend.
            // On success, you would remove them from localStorage.
            // For now, we just log them.
        }

        // Attempt to sync every 30 seconds
        setInterval(syncData, 30000);
    }
});