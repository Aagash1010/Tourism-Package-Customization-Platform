/**
 * Ceylon Explore - Tourist Management
 * Tourist records are read and persisted through the Spring Boot API.
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const apiBaseUrl = (window.location.protocol === 'file:' ? 'http:' : window.location.protocol) +
        '//' + (window.location.hostname || 'localhost') + ':8080';
    const elements = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        pageStatus: document.getElementById('touristPageStatus'),
        tableBody: document.getElementById('touristTableBody'),
        search: document.getElementById('touristSearch'),
        country: document.getElementById('countryFilter'),
        status: document.getElementById('statusFilter'),
        resultCount: document.getElementById('touristResultCount'),
        form: document.getElementById('touristForm'),
        formTitle: document.getElementById('touristFormTitle'),
        formError: document.getElementById('touristFormError'),
        saveButton: document.getElementById('saveTouristButton'),
        toastBody: document.getElementById('touristToastBody'),
        formModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('touristFormModal')),
        detailsModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('touristDetailsModal')),
        toast: bootstrap.Toast.getOrCreateInstance(document.getElementById('touristToast'), { delay: 3600 })
    };
    const fields = {
        fullName: document.getElementById('touristFullName'),
        email: document.getElementById('touristEmail'),
        phone: document.getElementById('touristPhone'),
        country: document.getElementById('touristCountry'),
        address: document.getElementById('touristAddress'),
        dateOfBirth: document.getElementById('touristDateOfBirth'),
        gender: document.getElementById('touristGender'),
        profileImage: document.getElementById('touristProfileImage'),
        status: document.getElementById('touristStatus')
    };

    let tourists = [];
    let editingId = null;
    let searchTimer = null;

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
        });
    }

    function showToast(message) {
        elements.toastBody.textContent = message;
        elements.toast.show();
    }

    async function apiRequest(path, options) {
        const response = await fetch(apiBaseUrl + path, Object.assign({
            credentials: 'include',
            headers: { Accept: 'application/json' }
        }, options || {}));
        let body = null;
        try {
            body = await response.json();
        } catch (error) {
            if (response.status !== 204) {
                throw new Error('The tourist service returned an unreadable response.');
            }
        }
        if (!response.ok) {
            const fieldErrors = body && body.errors ? Object.values(body.errors).join(' ') : '';
            const requestError = new Error(fieldErrors || (body && body.message) || 'The request could not be completed.');
            requestError.status = response.status;
            throw requestError;
        }
        return body;
    }

    async function csrfToken() {
        const response = await apiRequest('/api/auth/csrf');
        if (!response || !response.csrfToken) {
            throw new Error('Unable to initialize a secure request. Refresh the page and try again.');
        }
        return response.csrfToken;
    }

    async function loadTourists() {
        const keyword = elements.search.value.trim();
        const country = elements.country.value.trim();
        const status = elements.status.value;
        let path = '/api/tourists';
        if (country) {
            path = '/api/tourists/country/' + encodeURIComponent(country);
        } else if (status) {
            path = '/api/tourists/status/' + encodeURIComponent(status);
        } else if (keyword) {
            path = '/api/tourists/search?keyword=' + encodeURIComponent(keyword);
        }

        try {
            const records = await apiRequest(path);
            if (!Array.isArray(records)) {
                throw new Error('The tourist service returned an invalid record list.');
            }
            tourists = records.filter(function (tourist) {
                const matchesKeyword = !keyword || [tourist.fullName, tourist.email, tourist.phone]
                    .some(function (value) { return String(value || '').toLowerCase().includes(keyword.toLowerCase()); });
                const matchesCountry = !country || String(tourist.country || '').toLowerCase() === country.toLowerCase();
                const matchesStatus = !status || tourist.status === status;
                return matchesKeyword && matchesCountry && matchesStatus;
            });
            renderTourists();
            elements.pageStatus.classList.add('d-none');
        } catch (error) {
            elements.pageStatus.className = 'alert alert-danger border-0 rounded-3 small';
            elements.pageStatus.textContent = 'Could not load tourist records: ' + error.message;
            elements.tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-5">Tourists are unavailable. Check your connection and refresh.</td></tr>';
            elements.resultCount.textContent = 'Records unavailable';
        }
    }

    function renderTourists() {
        document.getElementById('totalTourists').textContent = String(tourists.length);
        document.getElementById('activeTourists').textContent = String(tourists.filter(function (tourist) {
            return tourist.status === 'ACTIVE';
        }).length);
        document.getElementById('inactiveTourists').textContent = String(tourists.filter(function (tourist) {
            return tourist.status === 'INACTIVE';
        }).length);
        elements.resultCount.textContent = tourists.length + (tourists.length === 1 ? ' tourist' : ' tourists');

        if (tourists.length === 0) {
            elements.tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-5">No tourist records match these filters.</td></tr>';
            return;
        }

        elements.tableBody.innerHTML = tourists.map(function (tourist) {
            const status = tourist.status === 'INACTIVE' ? 'inactive' : 'active';
            return '<tr>' +
                '<td>#' + escapeHtml(tourist.id) + '</td>' +
                '<td class="fw-semibold">' + escapeHtml(tourist.fullName) + '</td>' +
                '<td>' + escapeHtml(tourist.email) + '</td>' +
                '<td>' + escapeHtml(tourist.phone || '—') + '</td>' +
                '<td>' + escapeHtml(tourist.country || '—') + '</td>' +
                '<td><span class="tourist-status ' + status + '">' + escapeHtml(tourist.status || 'ACTIVE') + '</span></td>' +
                '<td>' + escapeHtml(formatDate(tourist.createdAt)) + '</td>' +
                '<td><div class="tourist-row-actions">' +
                '<button class="table-action" type="button" data-action="view" data-id="' + escapeHtml(tourist.id) + '" aria-label="View tourist ' + escapeHtml(tourist.fullName) + '"><i class="bi bi-eye"></i></button>' +
                '<button class="table-action" type="button" data-action="edit" data-id="' + escapeHtml(tourist.id) + '" aria-label="Edit tourist ' + escapeHtml(tourist.fullName) + '"><i class="bi bi-pencil"></i></button>' +
                '<button class="table-action delete-action" type="button" data-action="delete" data-id="' + escapeHtml(tourist.id) + '" aria-label="Delete tourist ' + escapeHtml(tourist.fullName) + '"><i class="bi bi-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    }

    function formatDate(value) {
        if (!value) {
            return '—';
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
    }

    function clearForm() {
        elements.form.reset();
        elements.form.classList.remove('was-validated');
        elements.formError.classList.add('d-none');
        elements.formError.textContent = '';
        fields.status.value = 'ACTIVE';
    }

    function openCreateForm() {
        editingId = null;
        clearForm();
        elements.formTitle.textContent = 'Add Tourist';
        elements.formModal.show();
    }

    function openEditForm(tourist) {
        editingId = tourist.id;
        clearForm();
        elements.formTitle.textContent = 'Edit Tourist';
        Object.keys(fields).forEach(function (name) {
            const value = tourist[name];
            fields[name].value = value == null ? '' : value;
        });
        elements.formModal.show();
    }

    function showDetails(tourist) {
        document.getElementById('touristDetailsTitle').textContent = tourist.fullName || 'Tourist Details';
        const details = [
            ['Tourist ID', tourist.id],
            ['Full Name', tourist.fullName],
            ['Email', tourist.email],
            ['Phone', tourist.phone],
            ['Country', tourist.country],
            ['Address', tourist.address],
            ['Date of Birth', tourist.dateOfBirth],
            ['Gender', tourist.gender],
            ['Status', tourist.status],
            ['Registered', formatDate(tourist.createdAt)],
            ['Last Updated', formatDate(tourist.updatedAt)]
        ];
        document.getElementById('touristDetailsContent').innerHTML = details.map(function (item) {
            return '<div class="tourist-detail-item"><span class="tourist-detail-label">' +
                escapeHtml(item[0]) + '</span><span class="tourist-detail-value">' +
                escapeHtml(item[1] || '—') + '</span></div>';
        }).join('');
        elements.detailsModal.show();
    }

    async function saveTourist(event) {
        event.preventDefault();
        elements.form.classList.add('was-validated');
        if (!elements.form.checkValidity()) {
            return;
        }

        const tourist = {};
        Object.keys(fields).forEach(function (name) {
            tourist[name] = fields[name].value.trim() || null;
        });
        elements.saveButton.disabled = true;
        elements.formError.classList.add('d-none');
        try {
            const token = await csrfToken();
            await apiRequest('/api/tourists' + (editingId ? '/' + encodeURIComponent(editingId) : ''), {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify(tourist)
            });
            elements.formModal.hide();
            showToast(editingId ? 'Tourist profile updated.' : 'Tourist profile created.');
            await loadTourists();
        } catch (error) {
            elements.formError.textContent = error.message;
            elements.formError.classList.remove('d-none');
        } finally {
            elements.saveButton.disabled = false;
        }
    }

    async function deleteTourist(tourist) {
        if (!window.confirm('Delete the tourist profile for ' + tourist.fullName + '? This cannot be undone.')) {
            return;
        }
        try {
            const token = await csrfToken();
            await apiRequest('/api/tourists/' + encodeURIComponent(tourist.id), {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': token }
            });
            showToast('Tourist profile deleted.');
            await loadTourists();
        } catch (error) {
            showToast(error.message);
        }
    }

    async function initializePage() {
        try {
            const response = await apiRequest('/api/auth/me');
            const user = response && response.user;
            if (!user || user.role !== 'ADMIN') {
                throw new Error('Administrator access is required to manage tourist profiles.');
            }
            document.getElementById('profileName').textContent = user.fullName || 'Administrator';
            document.getElementById('profileAvatar').textContent = (user.fullName || 'A').charAt(0).toUpperCase();
            await loadTourists();
        } catch (error) {
            elements.pageStatus.className = 'alert alert-warning border-0 rounded-3 small';
            elements.pageStatus.textContent = error.status === 401
                ? 'Sign in as an administrator to manage tourist profiles.'
                : error.message;
            elements.tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-5">Administrator sign-in is required to view tourist records.</td></tr>';
            document.getElementById('addTouristButton').disabled = true;
        }
    }

    elements.sidebarToggle.addEventListener('click', function () {
        const isOpen = elements.sidebar.classList.toggle('is-open');
        elements.sidebarBackdrop.classList.toggle('is-visible', isOpen);
        elements.sidebarToggle.setAttribute('aria-expanded', String(isOpen));
    });
    elements.sidebarBackdrop.addEventListener('click', function () {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-visible');
        elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    });
    document.getElementById('addTouristButton').addEventListener('click', openCreateForm);
    document.getElementById('resetFiltersButton').addEventListener('click', function () {
        elements.search.value = '';
        elements.country.value = '';
        elements.status.value = '';
        loadTourists();
    });
    [elements.country, elements.status].forEach(function (filter) {
        filter.addEventListener('change', loadTourists);
    });
    elements.search.addEventListener('input', function () {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(loadTourists, 250);
    });
    elements.form.addEventListener('submit', saveTourist);
    elements.tableBody.addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }
        const tourist = tourists.find(function (record) {
            return String(record.id) === button.dataset.id;
        });
        if (!tourist) {
            return;
        }
        if (button.dataset.action === 'view') {
            showDetails(tourist);
        } else if (button.dataset.action === 'edit') {
            openEditForm(tourist);
        } else if (button.dataset.action === 'delete') {
            deleteTourist(tourist);
        }
    });

    initializePage();
});
