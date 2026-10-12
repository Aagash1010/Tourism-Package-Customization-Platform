/**
 * Ceylon Explore - Session-based account login.
 */

document.addEventListener('DOMContentLoaded', function () {
    const API_BASE_URL = 'http://' + window.location.hostname + ':8080';
    const isFilePage = window.location.protocol === 'file:';
    const loginForm = document.getElementById('adminLoginPageForm');
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    const emailFeedback = document.getElementById('emailFeedback');
    const passwordFeedback = document.getElementById('passwordFeedback');
    const togglePassword = document.getElementById('togglePassword');
    const loginButton = document.getElementById('loginButton');
    const loginStatus = document.getElementById('loginStatus');

    togglePassword.addEventListener('click', function () {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        togglePassword.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        clearValidation();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        let isValid = true;

        if (!email || !emailInput.validity.valid) {
            showFieldError(emailInput, emailFeedback, 'Enter a valid email address.');
            isValid = false;
        }
        if (!password) {
            showFieldError(passwordInput, passwordFeedback, 'Please enter your password.');
            isValid = false;
        }
        if (!isValid) {
            showStatus('Please correct the highlighted fields.', 'danger');
            return;
        }
        if (isFilePage) {
            showStatus(
                'Serve this page with VS Code Live Server (for example, http://localhost:5500) instead of opening it as a file.',
                'danger'
            );
            return;
        }

        setLoadingState(true);
        try {
            const csrfResponse = await fetch(API_BASE_URL + '/api/auth/csrf', {
                method: 'GET',
                credentials: 'include'
            });
            const csrfBody = await readJsonResponse(csrfResponse);
            if (!csrfResponse.ok || !csrfBody.csrfToken) {
                throw new Error('Unable to initialize secure sign-in. Please try again.');
            }

            const loginResponse = await fetch(API_BASE_URL + '/api/auth/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfBody.csrfToken
                },
                body: JSON.stringify({ email: email, password: password })
            });
            const loginBody = await readJsonResponse(loginResponse);
            if (!loginResponse.ok) {
                throw new Error(loginBody.message || 'Invalid email or password.');
            }
            if (!loginBody.user || (loginBody.user.role !== 'ADMIN' && loginBody.user.role !== 'USER')) {
                throw new Error('The server returned an invalid account response.');
            }

            window.location.href = loginBody.user.role === 'ADMIN'
                ? 'admin-dashboard.html'
                : 'user-dashboard.html';
        } catch (error) {
            const message = error instanceof TypeError
                ? 'Cannot connect to the backend at ' + API_BASE_URL + '. Start Spring Boot and confirm it is listening on port 8080.'
                : error.message || 'Unable to reach the authentication service.';
            showStatus(message, 'danger');
            setLoadingState(false);
        }
    });

    [emailInput, passwordInput].forEach(function (input) {
        input.addEventListener('input', function () {
            input.closest('.admin-input-group').classList.remove('has-error');
            input.setAttribute('aria-invalid', 'false');
            (input === emailInput ? emailFeedback : passwordFeedback).textContent = '';
        });
    });

    async function readJsonResponse(response) {
        try {
            return await response.json();
        } catch (error) {
            throw new Error('The authentication service returned an unreadable response.');
        }
    }

    function showFieldError(input, feedbackElement, message) {
        input.setAttribute('aria-invalid', 'true');
        input.closest('.admin-input-group').classList.add('has-error');
        feedbackElement.textContent = message;
    }

    function clearValidation() {
        emailFeedback.textContent = '';
        passwordFeedback.textContent = '';
        document.querySelectorAll('.admin-input-group').forEach(function (group) {
            group.classList.remove('has-error');
        });
        [emailInput, passwordInput].forEach(function (input) {
            input.setAttribute('aria-invalid', 'false');
        });
        loginStatus.className = 'alert d-none rounded-3 small mb-3';
        loginStatus.textContent = '';
    }

    function showStatus(message, type) {
        loginStatus.className = 'alert rounded-3 small mb-3 alert-' + type;
        loginStatus.textContent = message;
    }

    function setLoadingState(isLoading) {
        loginButton.disabled = isLoading;
        loginButton.querySelector('.button-label').classList.toggle('d-none', isLoading);
        loginButton.querySelector('.button-loading').classList.toggle('d-none', !isLoading);
    }
});
