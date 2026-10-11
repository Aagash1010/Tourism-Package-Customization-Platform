/**
 * Ceylon Explore - Tourist Management Module
 * Frontend CRUD demo using localStorage.
 * The loadTourists/saveTourists methods can later be replaced by Spring Boot REST API calls.
 */

document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'ceylonExploreTourists';
    const todayIso = new Date().toISOString().split('T')[0];

    const sampleTourists = [
        {
            id: 'TOUR-0001',
            fullName: 'Maya Rivers',
            email: 'maya.rivers@example.com',
            phone: '+44 20 5550 0134',
            nationality: 'United Kingdom',
            passportNumber: 'UKX482910',
            gender: 'Female',
            dateOfBirth: '1994-04-18',
            address: '42 Palm Avenue, London',
            registrationDate: '2026-09-18'
        },
        {
            id: 'TOUR-0002',
            fullName: 'Leo Martin',
            email: 'leo.martin@example.com',
            phone: '+33 1 5550 0172',
            nationality: 'France',
            passportNumber: 'FRP739204',
            gender: 'Male',
            dateOfBirth: '1989-11-02',
            address: '18 Rue Demo, Paris',
            registrationDate: '2026-09-24'
        },
        {
            id: 'TOUR-0003',
            fullName: 'Ava Chen',
            email: 'ava.chen@example.com',
            phone: '+65 5550 8821',
            nationality: 'Singapore',
            passportNumber: 'SGN204881',
            gender: 'Female',
            dateOfBirth: '1997-06-09',
            address: '7 Marina Demo Road, Singapore',
            registrationDate: '2026-10-01'
        },
        {
            id: 'TOUR-0004',
            fullName: 'Noah Silva',
            email: 'noah.silva@example.com',
            phone: '+61 2 5550 0148',
            nationality: 'Australia',
            passportNumber: 'AUP582104',
            gender: 'Male',
            dateOfBirth: '1992-01-30',
            address: '15 Harbour Street, Sydney',
            registrationDate: '2026-10-03'
        },
        {
            id: 'TOUR-0005',
            fullName: 'Sofia Anders',
            email: 'sofia.anders@example.com',
            phone: '+46 8 5550 0195',
            nationality: 'Sweden',
            passportNumber: 'SWE914720',
            gender: 'Female',
            dateOfBirth: '1990-08-16',
            address: '22 Nordic Lane, Stockholm',
            registrationDate: '2026-10-07'
        },
        {
            id: 'TOUR-0006',
            fullName: 'Ethan Brooks',
            email: 'ethan.brooks@example.com',
            phone: '+1 555 010 2684',
            nationality: 'Canada',
            passportNumber: 'CAN705318',
            gender: 'Male',
            dateOfBirth: '1987-03-25',
            address: '90 Maple Demo Street, Toronto',
            registrationDate: todayIso
        }
    ];

    const elements = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        notificationButton: document.getElementById('notificationButton'),
        touristSearch: document.getElementById('touristSearch'),
        nationalityFilter: document.getElementById('nationalityFilter'),
        sortSelect: document.getElementById('sortSelect'),
        pageSizeSelect: document.getElementById('pageSizeSelect'),
        resetFiltersButton: document.getElementById('resetFiltersButton'),
        activeFilterStrip: document.getElementById('activeFilterStrip'),
        addTouristButton: document.getElementById('addTouristButton'),
        touristTableBody: document.getElementById('touristTableBody'),
        emptyState: document.getElementById('emptyState'),
        tableSummary: document.getElementById('tableSummary'),
        prevPageButton: document.getElementById('prevPageButton'),
        nextPageButton: document.getElementById('nextPageButton'),
        pageIndicator: document.getElementById('pageIndicator'),
        totalTouristsStat: document.getElementById('totalTouristsStat'),
        activeTouristsStat: document.getElementById('activeTouristsStat'),
        newRegistrationsStat: document.getElementById('newRegistrationsStat'),
        countriesStat: document.getElementById('countriesStat'),
        touristForm: document.getElementById('touristForm'),
        touristFormTitle: document.getElementById('touristFormTitle'),
        touristId: document.getElementById('touristId'),
        fullName: document.getElementById('fullName'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        nationality: document.getElementById('nationality'),
        passportNumber: document.getElementById('passportNumber'),
        gender: document.getElementById('gender'),
        dateOfBirth: document.getElementById('dateOfBirth'),
        address: document.getElementById('address'),
        saveTouristButton: document.getElementById('saveTouristButton'),
        deleteTouristName: document.getElementById('deleteTouristName'),
        deleteTouristId: document.getElementById('deleteTouristId'),
        confirmDeleteButton: document.getElementById('confirmDeleteButton'),
        touristToastBody: document.getElementById('touristToastBody')
    };

    const touristFormModal = new bootstrap.Modal(document.getElementById('touristFormModal'));
    const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    const touristToast = new bootstrap.Toast(document.getElementById('touristToast'), { delay: 3500 });

    let tourists = loadTourists();
    let currentPage = 1;
    let editingTouristId = null;
    let pendingDeleteId = null;

    renderAll();
    bindEvents();

    function bindEvents() {
        elements.sidebarToggle.addEventListener('click', function () {
            const isOpen = elements.sidebar.classList.toggle('is-open');
            elements.sidebarBackdrop.classList.toggle('is-visible', isOpen);
            elements.sidebarToggle.setAttribute('aria-expanded', String(isOpen));
        });

        elements.sidebarBackdrop.addEventListener('click', closeSidebar);

        document.querySelectorAll('.module-placeholder').forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                closeSidebar();
                showToast(link.dataset.module + ' is prepared as a future CRUD module.');
            });
        });

        elements.notificationButton.addEventListener('click', function () {
            showToast('Notifications are interface placeholders for the admin dashboard.');
        });

        elements.addTouristButton.addEventListener('click', openCreateModal);
        elements.touristForm.addEventListener('submit', handleFormSubmit);
        elements.confirmDeleteButton.addEventListener('click', confirmDeleteTourist);

        elements.touristSearch.addEventListener('input', refreshFilteredTable);
        [elements.nationalityFilter, elements.sortSelect, elements.pageSizeSelect].forEach(function (control) {
            control.addEventListener('change', refreshFilteredTable);
        });

        function refreshFilteredTable() {
            currentPage = 1;
            renderTable();
        }

        elements.resetFiltersButton.addEventListener('click', function () {
            elements.touristSearch.value = '';
            elements.nationalityFilter.value = '';
            elements.sortSelect.value = 'registrationDateDesc';
            elements.pageSizeSelect.value = '10';
            currentPage = 1;
            renderTable();
        });

        elements.prevPageButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage -= 1;
                renderTable();
            }
        });

        elements.nextPageButton.addEventListener('click', function () {
            const totalPages = getTotalPages();
            if (currentPage < totalPages) {
                currentPage += 1;
                renderTable();
            }
        });

        elements.touristTableBody.addEventListener('click', function (event) {
            const actionButton = event.target.closest('[data-action]');
            if (!actionButton) {
                return;
            }

            const touristId = actionButton.dataset.id;
            if (actionButton.dataset.action === 'edit') {
                openEditModal(touristId);
            }

            if (actionButton.dataset.action === 'delete') {
                openDeleteModal(touristId);
            }
        });

        elements.touristForm.addEventListener('input', function (event) {
            if (event.target.matches('.form-control, .form-select')) {
                clearFieldError(event.target);
            }
        });
    }

    // Future API replacements:
    // GET /api/tourists, GET /api/tourists/{id}, POST /api/tourists,
    // PUT /api/tourists/{id}, DELETE /api/tourists/{id}
    function loadTourists() {
        const storedValue = localStorage.getItem(STORAGE_KEY);

        if (!storedValue) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleTourists));
            return sampleTourists.slice();
        }

        try {
            const parsed = JSON.parse(storedValue);
            if (!Array.isArray(parsed)) {
                throw new Error('Stored tourist data is not an array.');
            }
            return parsed.filter(isValidTouristRecord);
        } catch (error) {
            console.warn('Invalid tourist localStorage data found. Sample records were restored.', error);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleTourists));
            return sampleTourists.slice();
        }
    }

    function saveTourists(records) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }

    function isValidTouristRecord(record) {
        return record &&
            typeof record.id === 'string' &&
            typeof record.fullName === 'string' &&
            typeof record.email === 'string' &&
            typeof record.passportNumber === 'string';
    }

    function renderAll() {
        renderNationalityOptions();
        renderStats();
        renderTable();
    }

    function renderStats() {
        const totalTourists = tourists.length;
        const activeTourists = tourists.filter(function (tourist) {
            return tourist.fullName && tourist.email && tourist.phone && tourist.nationality && tourist.passportNumber;
        }).length;
        const newRegistrations = tourists.filter(function (tourist) {
            return getDaysSince(tourist.registrationDate) <= 30;
        }).length;
        const countries = new Set(tourists.map(function (tourist) {
            return tourist.nationality.trim().toLowerCase();
        }).filter(Boolean));

        elements.totalTouristsStat.textContent = totalTourists;
        elements.activeTouristsStat.textContent = activeTourists;
        elements.newRegistrationsStat.textContent = newRegistrations;
        elements.countriesStat.textContent = countries.size;
    }

    function renderNationalityOptions() {
        const currentValue = elements.nationalityFilter.value;
        const nationalities = Array.from(new Set(tourists.map(function (tourist) {
            return tourist.nationality;
        }).filter(Boolean))).sort(function (a, b) {
            return a.localeCompare(b);
        });

        elements.nationalityFilter.innerHTML = '<option value="">All nationalities</option>';
        nationalities.forEach(function (nationality) {
            const option = document.createElement('option');
            option.value = nationality;
            option.textContent = nationality;
            elements.nationalityFilter.appendChild(option);
        });

        if (nationalities.includes(currentValue)) {
            elements.nationalityFilter.value = currentValue;
        }
    }

    function renderTable() {
        const filteredTourists = getFilteredTourists();
        const pageSize = Number(elements.pageSizeSelect.value);
        const totalPages = Math.max(1, Math.ceil(filteredTourists.length / pageSize));

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const startIndex = (currentPage - 1) * pageSize;
        const pageRecords = filteredTourists.slice(startIndex, startIndex + pageSize);

        elements.touristTableBody.innerHTML = pageRecords.map(createTouristRow).join('');

        const hasRecords = pageRecords.length > 0;
        document.querySelector('.tourist-table-wrap').classList.toggle('d-none', !hasRecords);
        elements.emptyState.classList.toggle('d-none', hasRecords);

        const endIndex = hasRecords ? startIndex + pageRecords.length : 0;
        elements.tableSummary.textContent = hasRecords
            ? 'Showing ' + (startIndex + 1) + '-' + endIndex + ' of ' + filteredTourists.length + ' records'
            : 'Showing 0 records';

        elements.pageIndicator.textContent = 'Page ' + currentPage + ' of ' + totalPages;
        elements.prevPageButton.disabled = currentPage <= 1;
        elements.nextPageButton.disabled = currentPage >= totalPages;

        renderActiveFilters();
    }

    function createTouristRow(tourist) {
        return [
            '<tr>',
            '<td><strong>' + escapeHtml(tourist.id) + '</strong></td>',
            '<td>' + escapeHtml(tourist.fullName) + '</td>',
            '<td>' + escapeHtml(tourist.email) + '</td>',
            '<td>' + escapeHtml(tourist.phone) + '</td>',
            '<td>' + escapeHtml(tourist.nationality) + '</td>',
            '<td>' + escapeHtml(tourist.passportNumber) + '</td>',
            '<td>' + formatDisplayDate(tourist.registrationDate) + '</td>',
            '<td>',
            '<div class="tourist-actions">',
            '<button class="table-action edit-action" type="button" data-action="edit" data-id="' + escapeHtml(tourist.id) + '" aria-label="Edit ' + escapeHtml(tourist.fullName) + '"><i class="bi bi-pencil-square"></i></button>',
            '<button class="table-action delete-action" type="button" data-action="delete" data-id="' + escapeHtml(tourist.id) + '" aria-label="Delete ' + escapeHtml(tourist.fullName) + '"><i class="bi bi-trash3"></i></button>',
            '</div>',
            '</td>',
            '</tr>'
        ].join('');
    }

    function getFilteredTourists() {
        const query = elements.touristSearch.value.trim().toLowerCase();
        const nationality = elements.nationalityFilter.value;
        const sortBy = elements.sortSelect.value;

        return tourists
            .filter(function (tourist) {
                const searchableText = [
                    tourist.id,
                    tourist.fullName,
                    tourist.email,
                    tourist.nationality,
                    tourist.passportNumber
                ].join(' ').toLowerCase();

                const matchesSearch = !query || searchableText.includes(query);
                const matchesNationality = !nationality || tourist.nationality === nationality;
                return matchesSearch && matchesNationality;
            })
            .sort(function (a, b) {
                if (sortBy === 'nameAsc') {
                    return a.fullName.localeCompare(b.fullName);
                }
                if (sortBy === 'nameDesc') {
                    return b.fullName.localeCompare(a.fullName);
                }
                if (sortBy === 'registrationDateAsc') {
                    return new Date(a.registrationDate) - new Date(b.registrationDate);
                }
                return new Date(b.registrationDate) - new Date(a.registrationDate);
            });
    }

    function getTotalPages() {
        return Math.max(1, Math.ceil(getFilteredTourists().length / Number(elements.pageSizeSelect.value)));
    }

    function renderActiveFilters() {
        const activeFilters = [];
        const searchValue = elements.touristSearch.value.trim();
        const nationalityValue = elements.nationalityFilter.value;

        if (searchValue) {
            activeFilters.push('Search: "' + searchValue + '"');
        }

        if (nationalityValue) {
            activeFilters.push('Nationality: ' + nationalityValue);
        }

        elements.activeFilterStrip.classList.toggle('d-none', activeFilters.length === 0);
        elements.activeFilterStrip.textContent = activeFilters.length
            ? 'Active filters: ' + activeFilters.join(' | ')
            : '';
    }

    function openCreateModal() {
        editingTouristId = null;
        elements.touristForm.reset();
        clearAllFieldErrors();
        elements.touristFormTitle.textContent = 'Add New Tourist';
        elements.touristId.value = generateNextTouristId();
        touristFormModal.show();
        setTimeout(function () {
            elements.fullName.focus();
        }, 200);
    }

    function openEditModal(touristId) {
        const tourist = tourists.find(function (record) {
            return record.id === touristId;
        });

        if (!tourist) {
            showToast('The selected tourist record could not be found.');
            return;
        }

        editingTouristId = touristId;
        clearAllFieldErrors();
        elements.touristFormTitle.textContent = 'Edit Tourist';
        elements.touristId.value = tourist.id;
        elements.fullName.value = tourist.fullName;
        elements.email.value = tourist.email;
        elements.phone.value = tourist.phone;
        elements.nationality.value = tourist.nationality;
        elements.passportNumber.value = tourist.passportNumber;
        elements.gender.value = tourist.gender || '';
        elements.dateOfBirth.value = tourist.dateOfBirth || '';
        elements.address.value = tourist.address || '';
        touristFormModal.show();
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        clearAllFieldErrors();

        const touristData = getFormData();
        const validationErrors = validateTourist(touristData);

        if (Object.keys(validationErrors).length > 0) {
            showValidationErrors(validationErrors);
            showToast('Please correct the highlighted form fields.');
            return;
        }

        setSaveLoading(true);

        window.setTimeout(function () {
            if (editingTouristId) {
                tourists = tourists.map(function (tourist) {
                    if (tourist.id !== editingTouristId) {
                        return tourist;
                    }
                    return Object.assign({}, tourist, touristData, { id: editingTouristId });
                });
                showToast('Tourist record updated successfully.');
            } else {
                tourists.push(Object.assign({}, touristData, { registrationDate: todayIso }));
                showToast('New tourist saved to frontend demo storage.');
            }

            saveTourists(tourists);
            touristFormModal.hide();
            setSaveLoading(false);
            renderAll();
        }, 450);
    }

    function getFormData() {
        return {
            id: elements.touristId.value.trim(),
            fullName: elements.fullName.value.trim(),
            email: elements.email.value.trim().toLowerCase(),
            phone: elements.phone.value.trim(),
            nationality: elements.nationality.value.trim(),
            passportNumber: elements.passportNumber.value.trim().toUpperCase(),
            gender: elements.gender.value,
            dateOfBirth: elements.dateOfBirth.value,
            address: elements.address.value.trim()
        };
    }

    function validateTourist(touristData) {
        const errors = {};
        const existingRecords = tourists.filter(function (tourist) {
            return tourist.id !== editingTouristId;
        });

        if (!touristData.id) {
            errors.touristId = 'Tourist ID is required.';
        }

        if (existingRecords.some(function (tourist) { return tourist.id === touristData.id; })) {
            errors.touristId = 'This tourist ID already exists.';
        }

        if (!touristData.fullName) {
            errors.fullName = 'Full name is required.';
        }

        if (!touristData.email) {
            errors.email = 'Email address is required.';
        } else if (!isValidEmail(touristData.email)) {
            errors.email = 'Enter a valid email address.';
        } else if (existingRecords.some(function (tourist) { return tourist.email.toLowerCase() === touristData.email; })) {
            errors.email = 'A tourist with this email already exists.';
        }

        if (!touristData.phone) {
            errors.phone = 'Phone number is required.';
        }

        if (!touristData.nationality) {
            errors.nationality = 'Nationality is required.';
        }

        if (!touristData.passportNumber) {
            errors.passportNumber = 'Passport number is required.';
        } else if (existingRecords.some(function (tourist) { return tourist.passportNumber.toUpperCase() === touristData.passportNumber; })) {
            errors.passportNumber = 'A tourist with this passport number already exists.';
        }

        return errors;
    }

    function showValidationErrors(errors) {
        Object.keys(errors).forEach(function (fieldName) {
            const input = document.getElementById(fieldName);
            const errorElement = document.getElementById(fieldName + 'Error');

            if (input) {
                input.classList.add('is-invalid');
                input.setAttribute('aria-invalid', 'true');
            }

            if (errorElement) {
                errorElement.textContent = errors[fieldName];
            }
        });
    }

    function clearFieldError(input) {
        input.classList.remove('is-invalid');
        input.setAttribute('aria-invalid', 'false');
        const errorElement = document.getElementById(input.id + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    function clearAllFieldErrors() {
        elements.touristForm.querySelectorAll('.form-control, .form-select').forEach(clearFieldError);
    }

    function openDeleteModal(touristId) {
        const tourist = tourists.find(function (record) {
            return record.id === touristId;
        });

        if (!tourist) {
            showToast('The selected tourist record could not be found.');
            return;
        }

        pendingDeleteId = touristId;
        elements.deleteTouristName.textContent = tourist.fullName;
        elements.deleteTouristId.textContent = tourist.id;
        deleteConfirmModal.show();
    }

    function confirmDeleteTourist() {
        if (!pendingDeleteId) {
            return;
        }

        tourists = tourists.filter(function (tourist) {
            return tourist.id !== pendingDeleteId;
        });
        saveTourists(tourists);
        pendingDeleteId = null;
        deleteConfirmModal.hide();
        renderAll();
        showToast('Tourist record deleted from frontend demo storage.');
    }

    function generateNextTouristId() {
        const usedNumbers = tourists.map(function (tourist) {
            const match = tourist.id.match(/^TOUR-(\d{4})$/);
            return match ? Number(match[1]) : 0;
        });
        const nextNumber = Math.max(0, ...usedNumbers) + 1;
        return 'TOUR-' + String(nextNumber).padStart(4, '0');
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function getDaysSince(dateValue) {
        const parsedDate = new Date(dateValue);
        if (Number.isNaN(parsedDate.getTime())) {
            return Number.POSITIVE_INFINITY;
        }
        const difference = new Date() - parsedDate;
        return difference / (1000 * 60 * 60 * 24);
    }

    function formatDisplayDate(dateValue) {
        const parsedDate = new Date(dateValue + 'T00:00:00');
        if (Number.isNaN(parsedDate.getTime())) {
            return escapeHtml(dateValue || 'Not set');
        }
        return parsedDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function setSaveLoading(isLoading) {
        elements.saveTouristButton.disabled = isLoading;
        elements.saveTouristButton.querySelector('.save-label').classList.toggle('d-none', isLoading);
        elements.saveTouristButton.querySelector('.save-loading').classList.toggle('d-none', !isLoading);
    }

    function closeSidebar() {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-visible');
        elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    function showToast(message) {
        elements.touristToastBody.textContent = message;
        touristToast.show();
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
