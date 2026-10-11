/**
 * Ceylon Explore - Admin Login Page
 * Frontend-only validation prepared for future Spring Boot authentication.
 */

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('adminLoginPageForm');
    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');
    const usernameFeedback = document.getElementById('usernameFeedback');
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

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        clearValidation();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        let isValid = true;

        if (!username) {
            showFieldError(usernameInput, usernameFeedback, 'Please enter your administrator username.');
            isValid = false;
        }

        if (!password) {
            showFieldError(passwordInput, passwordFeedback, 'Please enter your password.');
            isValid = false;
        }

        if (!isValid) {
            showStatus('Please complete the highlighted fields before continuing.', 'danger');
            return;
        }

        setLoadingState(true);
        showStatus('Demo-only login flow. No real authentication is being performed.', 'success');

        window.setTimeout(function () {
            window.location.href = 'admin-dashboard.html';
        }, 1100);
    });

    [usernameInput, passwordInput].forEach(function (input) {
        input.addEventListener('input', function () {
            const group = input.closest('.admin-input-group');
            group.classList.remove('has-error');
            input.setAttribute('aria-invalid', 'false');

            if (input === usernameInput) {
                usernameFeedback.textContent = '';
            } else {
                passwordFeedback.textContent = '';
            }
        });
    });

    function showFieldError(input, feedbackElement, message) {
        input.setAttribute('aria-invalid', 'true');
        input.closest('.admin-input-group').classList.add('has-error');
        feedbackElement.textContent = message;
    }

    function clearValidation() {
        usernameFeedback.textContent = '';
        passwordFeedback.textContent = '';
        document.querySelectorAll('.admin-input-group').forEach(function (group) {
            group.classList.remove('has-error');
        });
        [usernameInput, passwordInput].forEach(function (input) {
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
