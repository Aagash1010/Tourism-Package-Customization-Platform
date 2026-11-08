document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const actions = document.getElementById('accountNavActions');
    if (!actions) return;
    const apiBaseUrl = (window.location.protocol === 'file:' ? 'http:' : window.location.protocol) +
        '//' + (window.location.hostname || 'localhost') + ':8080';

    function link(href, text, icon, className) {
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.className = className;
        const glyph = document.createElement('i');
        glyph.className = 'bi ' + icon + ' me-1';
        anchor.appendChild(glyph);
        anchor.appendChild(document.createTextNode(text));
        return anchor;
    }

    function userAccountMenu() {
        const wrapper = document.createElement('div');
        wrapper.className = 'dropdown';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'btn btn-outline-emerald rounded-pill dropdown-toggle';
        toggle.setAttribute('data-bs-toggle', 'dropdown');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<i class="bi bi-person-circle me-1"></i>My Account';

        const menu = document.createElement('ul');
        menu.className = 'dropdown-menu dropdown-menu-end account-nav-menu';
        [
            { href: 'user-dashboard.html#bookings', text: 'My Bookings', icon: 'bi-ticket-perforated' },
            { href: 'user-dashboard.html#profile', text: 'Profile', icon: 'bi-person' }
        ].forEach(function (item) {
            const listItem = document.createElement('li');
            const anchor = document.createElement('a');
            anchor.className = 'dropdown-item';
            anchor.href = item.href;
            const glyph = document.createElement('i');
            glyph.className = 'bi ' + item.icon + ' me-2';
            anchor.appendChild(glyph);
            anchor.appendChild(document.createTextNode(item.text));
            listItem.appendChild(anchor);
            menu.appendChild(listItem);
        });
        wrapper.appendChild(toggle);
        wrapper.appendChild(menu);
        return wrapper;
    }

    async function logout(button) {
        button.disabled = true;
        try {
            const csrfResponse = await fetch(apiBaseUrl + '/api/auth/csrf', { credentials: 'include' });
            const csrf = await csrfResponse.json();
            if (!csrfResponse.ok || !csrf.csrfToken) throw new Error('Unable to initialize secure logout.');
            const response = await fetch(apiBaseUrl + '/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'X-CSRF-TOKEN': csrf.csrfToken }
            });
            if (!response.ok) throw new Error('Logout failed. Please try again.');
            window.location.reload();
        } catch (error) {
            button.disabled = false;
            button.title = error.message || 'Logout failed.';
        }
    }

    fetch(apiBaseUrl + '/api/auth/me', { credentials: 'include' }).then(async function (response) {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error('Unable to check the current sign-in session.');
        return response.json();
    }).then(function (body) {
        if (!body || !body.user || !body.user.role) return;
        actions.replaceChildren();
        const account = body.user;
        if (account.role === 'USER') {
            actions.appendChild(link('user-dashboard.html', 'My Dashboard', 'bi-grid-1x2', 'btn btn-admin-login'));
            actions.appendChild(userAccountMenu());
        } else if (account.role === 'ADMIN') {
            actions.appendChild(link('admin-dashboard.html', 'Admin Dashboard', 'bi-shield-lock', 'btn btn-admin-login'));
        } else {
            return;
        }
        const logoutButton = document.createElement('button');
        logoutButton.type = 'button';
        logoutButton.className = 'btn btn-outline-danger rounded-pill';
        logoutButton.innerHTML = '<i class="bi bi-box-arrow-right me-1"></i>Logout';
        logoutButton.addEventListener('click', function () { logout(logoutButton); });
        actions.appendChild(logoutButton);
    }).catch(function (error) {
        console.error('Unable to load public-site account navigation.', error);
    });
});
