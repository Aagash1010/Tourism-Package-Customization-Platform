document.addEventListener('DOMContentLoaded', async function () {
    const API_BASE_URL = 'http://' + window.location.hostname + ':8080';
    const content = document.getElementById('userDashboardContent');
    const errorAlert = document.getElementById('userDashboardError');
    const logoutButton = document.getElementById('logoutButton');

    try {
        const accountResponse = await fetch(API_BASE_URL + '/api/auth/me', { credentials: 'include' });
        if (!accountResponse.ok) {
            window.location.replace('admin-login.html');
            return;
        }
        const accountBody = await accountResponse.json();
        if (!accountBody.user || accountBody.user.role !== 'USER') {
            window.location.replace(accountBody.user && accountBody.user.role === 'ADMIN'
                ? 'admin-dashboard.html'
                : 'admin-login.html');
            return;
        }

        const dashboardResponse = await fetch(API_BASE_URL + '/api/user/dashboard', { credentials: 'include' });
        if (!dashboardResponse.ok) {
            throw new Error('Unable to load your account dashboard.');
        }

        document.getElementById('userName').textContent = accountBody.user.fullName;
        document.getElementById('userEmail').textContent = accountBody.user.email;
        document.getElementById('userRole').textContent = accountBody.user.role;
        content.classList.remove('d-none');
    } catch (error) {
        errorAlert.textContent = error.message || 'Unable to connect to the backend.';
        errorAlert.classList.remove('d-none');
    }

    logoutButton.addEventListener('click', async function () {
        logoutButton.disabled = true;
        try {
            const csrfResponse = await fetch(API_BASE_URL + '/api/auth/csrf', { credentials: 'include' });
            const csrfBody = await csrfResponse.json();
            const logoutResponse = await fetch(API_BASE_URL + '/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'X-CSRF-TOKEN': csrfBody.csrfToken }
            });
            if (!logoutResponse.ok) {
                throw new Error('Logout failed. Please try again.');
            }
            window.location.replace('index.html');
        } catch (error) {
            errorAlert.textContent = error.message || 'Unable to connect to the backend.';
            errorAlert.classList.remove('d-none');
            logoutButton.disabled = false;
        }
    });
});
