document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const apiBaseUrl = (window.location.protocol === 'file:' ? 'http:' : window.location.protocol) +
        '//' + (window.location.hostname || 'localhost') + ':8080';
    const form = document.getElementById('registerForm');
    const button = document.getElementById('registerButton');
    const status = document.getElementById('registerStatus');
    const password = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const isFilePage = window.location.protocol === 'file:';

    function showStatus(message, type) {
        status.className = 'alert alert-' + type;
        status.textContent = message;
        status.classList.remove('d-none');
    }

    async function readJson(response) {
        let body = {};
        try {
            body = await response.json();
        } catch (error) {
            throw new Error('The account service returned an unreadable response.');
        }
        if (!response.ok) {
            const fieldErrors = body.errors ? Object.values(body.errors).join(' ') : '';
            throw new Error(fieldErrors || body.message || body.detail || 'Unable to create your account.');
        }
        return body;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        status.classList.add('d-none');
        form.classList.add('was-validated');
        password.setCustomValidity(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(password.value)
            ? '' : 'Use at least 8 characters with uppercase, lowercase, and a number.');
        confirmPassword.setCustomValidity(password.value === confirmPassword.value ? '' : 'Passwords do not match.');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        if (isFilePage) {
            showStatus('Open this page through VS Code Live Server to create an account.', 'danger');
            return;
        }

        button.disabled = true;
        button.querySelector('.button-label').classList.add('d-none');
        button.querySelector('.button-loading').classList.remove('d-none');
        try {
            const csrfResponse = await fetch(apiBaseUrl + '/api/auth/csrf', { credentials: 'include' });
            let csrfBody;
            try { csrfBody = await csrfResponse.json(); } catch (error) { throw new Error('Unable to initialize secure registration.'); }
            if (!csrfResponse.ok || !csrfBody.csrfToken) throw new Error('Unable to initialize secure registration.');
            await readJson(await fetch(apiBaseUrl + '/api/auth/register', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfBody.csrfToken },
                body: JSON.stringify({
                    fullName: document.getElementById('registerName').value.trim(),
                    email: document.getElementById('registerEmail').value.trim(),
                    phone: document.getElementById('registerPhone').value.trim(),
                    country: document.getElementById('registerCountry').value.trim(),
                    password: password.value,
                    termsAccepted: document.getElementById('termsAccepted').checked
                })
            }));
            window.location.replace('admin-login.html?registered=1');
        } catch (error) {
            showStatus(error instanceof TypeError
                ? 'Unable to connect to the account service. Please try again later.'
                : error.message, 'danger');
        } finally {
            button.disabled = false;
            button.querySelector('.button-label').classList.remove('d-none');
            button.querySelector('.button-loading').classList.add('d-none');
        }
    });

    [password, confirmPassword].forEach(function (field) {
        field.addEventListener('input', function () {
            password.setCustomValidity('');
            confirmPassword.setCustomValidity('');
        });
    });
});
