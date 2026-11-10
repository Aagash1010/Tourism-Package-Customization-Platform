/**
 * Ceylon Explore - Booking Management
 * Bookings are loaded from and persisted by the Ceylon Explore Spring Boot API.
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const STORAGE_KEY = 'ceylonExploreBookings';
    const PACKAGE_KEYS = ['ceylonExplorePackages', 'ceylonExplorePackageManagement', 'ceylonExplorePackagesV1'];
    const TOURIST_KEYS = ['ceylonExploreTourists', 'ceylonExplore.tourists.v1', 'ceylonExploreTouristsV1', 'ceylonExploreTouristManagement'];
    const PAYMENT_STATUS_OPTIONS = ['Unpaid', 'Partially Paid', 'Paid', 'Refunded'];
    const BOOKING_STATUS_OPTIONS = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

    const API_BASE_URL = (window.location.protocol === 'file:' ? 'http:' : window.location.protocol) +
        '//' + (window.location.hostname || 'localhost') + ':8080';

    const bookingFormModal = new bootstrap.Modal(document.getElementById('bookingFormModal'));
    const bookingDetailsModal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    const deleteBookingModal = new bootstrap.Modal(document.getElementById('deleteBookingModal'));
    const toast = new bootstrap.Toast(document.getElementById('bookingToast'), { delay: 3600 });

    const elements = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        searchInput: document.getElementById('bookingSearch'),
        statusFilter: document.getElementById('bookingStatusFilter'),
        paymentFilter: document.getElementById('paymentStatusFilter'),
        packageFilter: document.getElementById('packageFilter'),
        travelDateFilter: document.getElementById('travelDateFilter'),
        bookingDateFilter: document.getElementById('bookingDateFilter'),
        touristFilter: document.getElementById('touristFilter'),
        sortSelect: document.getElementById('sortSelect'),
        resultsSummary: document.getElementById('bookingResultsSummary'),
        storageHint: document.getElementById('bookingStorageHint'),
        bookingTableBody: document.getElementById('bookingTableBody'),
        bookingEmptyState: document.getElementById('bookingEmptyState'),
        addBookingButton: document.getElementById('addBookingButton'),
        bookingForm: document.getElementById('bookingForm'),
        bookingFormTitle: document.getElementById('bookingFormTitle'),
        bookingFormError: document.getElementById('bookingFormError'),
        pageStatus: document.getElementById('bookingPageStatus'),
        bookingId: document.getElementById('bookingId'),
        touristSelect: document.getElementById('touristSelect'),
        packageSelect: document.getElementById('packageSelect'),
        bookingDate: document.getElementById('bookingDate'),
        travelDate: document.getElementById('travelDate'),
        numberOfTravelers: document.getElementById('numberOfTravelers'),
        specialRequests: document.getElementById('specialRequests'),
        pricePerPerson: document.getElementById('pricePerPerson'),
        subtotal: document.getElementById('subtotal'),
        discount: document.getElementById('discount'),
        finalTotal: document.getElementById('finalTotal'),
        paymentStatus: document.getElementById('paymentStatus'),
        amountPaid: document.getElementById('amountPaid'),
        balanceDue: document.getElementById('balanceDue'),
        bookingStatus: document.getElementById('bookingStatus'),
        touristDataAlert: document.getElementById('touristDataAlert'),
        packageDataAlert: document.getElementById('packageDataAlert'),
        toastBody: document.getElementById('bookingToastBody'),
        deleteBookingIdText: document.getElementById('deleteBookingIdText'),
        deleteBookingTouristText: document.getElementById('deleteBookingTouristText'),
        bookingDetailsSummary: document.getElementById('bookingDetailsSummary'),
        bookingDetailContent: document.getElementById('bookingDetailContent'),
        profileAvatar: document.querySelector('.profile-avatar'),
        profileName: document.querySelector('.profile-name'),
        profileRole: document.querySelector('.profile-role')
    };

    const packageCatalog = [];
    const touristCatalog = [];
    const bookingRepository = createBookingRepository();
    let bookings = [];
    let editingBookingId = null;
    let detailsBookingId = null;
    let pendingDeleteBookingId = null;
    let isConnectedToBackend = false;

    bindEvents();
    initializeDashboardData();

    async function apiRequest(path, options) {
        const response = await fetch(API_BASE_URL + path, Object.assign({
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }, options || {}));

        let body = null;
        try {
            body = await response.json();
        } catch (error) {
            if (response.status !== 204) {
                throw new Error('The booking service returned an unreadable response.');
            }
        }

        if (!response.ok) {
            const fieldErrors = body && body.errors ? Object.values(body.errors).join(' ') : '';
            const error = new Error(fieldErrors || (body && body.message) || 'The request could not be completed.');
            error.status = response.status;
            throw error;
        }

        return body;
    }

    async function getCsrfToken() {
        try {
            const response = await fetch(API_BASE_URL + '/api/auth/csrf', {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json().catch(function () { return {}; });
            return (response.ok && data && data.csrfToken) ? data.csrfToken : '';
        } catch (error) {
            return '';
        }
    }

    async function initializeDashboardData() {
        if (elements.pageStatus) {
            elements.pageStatus.textContent = 'Connecting to Ceylon Explore API and loading bookings...';
            elements.pageStatus.className = 'demo-note alert alert-info border-0 rounded-3 small mb-4';
        }

        // Try to fetch current user profile
        try {
            const account = await apiRequest('/api/auth/me');
            const user = account && account.user;
            if (user) {
                if (elements.profileName) elements.profileName.textContent = user.fullName || user.name || 'Administrator';
                if (elements.profileAvatar) elements.profileAvatar.textContent = (user.fullName || user.name || 'A').charAt(0).toUpperCase();
                if (elements.profileRole) elements.profileRole.textContent = user.role === 'ADMIN' ? 'Administrator' : 'User';
            }
        } catch (e) {
            // Unauthenticated or network error; keep demo profile fallback
        }

        try {
            // Load tourists, packages, and bookings
            let fetchedTourists = [];
            let fetchedPackages = [];
            let fetchedBookings = [];

            try {
                fetchedTourists = await apiRequest('/api/tourists');
            } catch (err) {
                console.warn('Could not load tourists from API:', err.message);
                fetchedTourists = getTouristCatalog();
            }

            try {
                // Try active packages first; if empty try all packages
                fetchedPackages = await apiRequest('/api/tour-packages/active');
                if (!Array.isArray(fetchedPackages) || fetchedPackages.length === 0) {
                    fetchedPackages = await apiRequest('/api/tour-packages');
                }
            } catch (err) {
                try {
                    fetchedPackages = await apiRequest('/api/packages');
                } catch (pkgErr) {
                    console.warn('Could not load packages from API:', pkgErr.message);
                    fetchedPackages = getPackageCatalog();
                }
            }

            try {
                fetchedBookings = await apiRequest('/api/bookings');
                isConnectedToBackend = true;
            } catch (bErr) {
                console.warn('Could not load bookings from API:', bErr.message);
                fetchedBookings = bookingRepository.load();
                isConnectedToBackend = false;
            }

            touristCatalog.length = 0;
            packageCatalog.length = 0;

            if (Array.isArray(fetchedTourists)) {
                fetchedTourists.forEach(function (tourist) {
                    touristCatalog.push({
                        id: String(tourist.id),
                        name: tourist.fullName || tourist.name || 'Unnamed tourist',
                        phone: tourist.phone || tourist.contact || '',
                        email: tourist.email || '',
                        contact: tourist.phone || tourist.email || tourist.contact || ''
                    });
                });
            }

            if (Array.isArray(fetchedPackages)) {
                fetchedPackages.forEach(function (pkg) {
                    packageCatalog.push({
                        id: String(pkg.id),
                        name: pkg.name || 'Unnamed package',
                        price: Number(pkg.price || 0),
                        maxTravelers: Number(pkg.maxTravelers || pkg.capacity || 0),
                        status: pkg.status || 'Active'
                    });
                });
            }

            bookings = Array.isArray(fetchedBookings) ? fetchedBookings.map(normalizeBookingRecord) : [];

            populateLookupOptions();
            renderAll();

            if (elements.pageStatus) {
                if (isConnectedToBackend) {
                    elements.pageStatus.innerHTML = '<i class="bi bi-check-circle-fill me-1 text-success"></i> Connected to Spring Boot API. Booking records are synchronized with MySQL database.';
                    elements.pageStatus.className = 'demo-note alert alert-success-subtle text-emerald border-0 rounded-3 small mb-4';
                } else {
                    elements.pageStatus.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1 text-warning"></i> Showing local fallback data. Sign in as Admin on port 8080 to synchronize with the backend.';
                    elements.pageStatus.className = 'demo-note alert alert-warning border-0 rounded-3 small mb-4';
                }
            }

            if (elements.storageHint) {
                elements.storageHint.innerHTML = isConnectedToBackend
                    ? '<i class="bi bi-database-check me-1 text-success"></i>Database Persistence'
                    : '<i class="bi bi-hdd me-1"></i>Browser local storage';
            }
        } catch (error) {
            console.error('Unable to load dashboard data for bookings page:', error);
            bookings = bookingRepository.load();
            populateLookupOptions();
            renderAll();
            showToast('Unable to load data from backend. Showing local fallback data.');
        }
    }

    function bindEvents() {
        if (elements.sidebarToggle && elements.sidebar) {
            elements.sidebarToggle.addEventListener('click', function () {
                const isOpen = elements.sidebar.classList.toggle('is-open');
                if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.toggle('is-visible', isOpen);
                elements.sidebarToggle.setAttribute('aria-expanded', String(isOpen));
            });
        }

        if (elements.sidebarBackdrop && elements.sidebar) {
            elements.sidebarBackdrop.addEventListener('click', function () {
                elements.sidebar.classList.remove('is-open');
                elements.sidebarBackdrop.classList.remove('is-visible');
                if (elements.sidebarToggle) elements.sidebarToggle.setAttribute('aria-expanded', 'false');
            });
        }

        document.querySelectorAll('.module-placeholder').forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                if (elements.sidebar) elements.sidebar.classList.remove('is-open');
                if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.remove('is-visible');
                if (elements.sidebarToggle) elements.sidebarToggle.setAttribute('aria-expanded', 'false');
                showToast(link.dataset.module + ' is prepared as a future CRUD module.');
            });
        });

        const notifButton = document.getElementById('notificationButton');
        if (notifButton) {
            notifButton.addEventListener('click', function () {
                showToast('Notifications are interface placeholders for the admin dashboard.');
            });
        }

        if (elements.addBookingButton) {
            elements.addBookingButton.addEventListener('click', openCreateBookingModal);
        }
        if (elements.bookingForm) {
            elements.bookingForm.addEventListener('submit', handleBookingSubmit);
        }
        if (elements.bookingTableBody) {
            elements.bookingTableBody.addEventListener('click', handleTableAction);
        }

        const editFromDetails = document.getElementById('editFromDetailsButton');
        if (editFromDetails) {
            editFromDetails.addEventListener('click', function () {
                if (!detailsBookingId) return;
                const targetId = detailsBookingId;
                const modalEl = document.getElementById('bookingDetailsModal');
                const hiddenHandler = function () {
                    openEditBookingModal(targetId);
                };
                if (modalEl) modalEl.addEventListener('hidden.bs.modal', hiddenHandler, { once: true });
                bookingDetailsModal.hide();
            });
        }

        const confirmDeleteBtn = document.getElementById('confirmDeleteBookingButton');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', confirmDeleteBooking);
        }

        [
            elements.searchInput,
            elements.statusFilter,
            elements.paymentFilter,
            elements.packageFilter,
            elements.travelDateFilter,
            elements.bookingDateFilter,
            elements.touristFilter,
            elements.sortSelect
        ].forEach(function (control) {
            if (control) {
                control.addEventListener(control === elements.searchInput ? 'input' : 'change', renderBookings);
            }
        });

        const resetFiltersBtn = document.getElementById('resetFiltersButton');
        if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);

        const emptyResetBtn = document.getElementById('emptyResetButton');
        if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetFilters);

        if (elements.packageSelect) {
            elements.packageSelect.addEventListener('change', function () {
                const selectedPackage = getSelectedPackage();
                if (selectedPackage) {
                    elements.pricePerPerson.value = String(Number(selectedPackage.price || 0));
                    if (selectedPackage.status && selectedPackage.status.toLowerCase() === 'inactive') {
                        elements.packageSelect.classList.add('is-invalid');
                        showToast('Selected package is inactive. New bookings cannot be created for inactive packages.');
                    } else {
                        elements.packageSelect.classList.remove('is-invalid');
                    }
                } else {
                    elements.pricePerPerson.value = '0';
                }
                recalculateBookingTotals();
            });
        }

        if (elements.numberOfTravelers) elements.numberOfTravelers.addEventListener('input', recalculateBookingTotals);
        if (elements.discount) elements.discount.addEventListener('input', recalculateBookingTotals);
        if (elements.amountPaid) elements.amountPaid.addEventListener('input', recalculateBookingTotals);
        if (elements.paymentStatus) elements.paymentStatus.addEventListener('change', recalculateBookingTotals);

        if (elements.bookingDate) elements.bookingDate.addEventListener('input', clearFieldError);
        if (elements.travelDate) elements.travelDate.addEventListener('input', clearFieldError);
        if (elements.numberOfTravelers) elements.numberOfTravelers.addEventListener('input', clearFieldError);
        if (elements.discount) elements.discount.addEventListener('input', clearFieldError);
        if (elements.amountPaid) elements.amountPaid.addEventListener('input', clearFieldError);

        Array.prototype.slice.call(document.querySelectorAll('#bookingForm select, #bookingForm input, #bookingForm textarea')).forEach(function (control) {
            control.addEventListener('input', function () {
                if (control.classList.contains('is-invalid')) {
                    control.classList.remove('is-invalid');
                }
                const feedback = control.parentElement && control.parentElement.querySelector('.invalid-feedback');
                if (feedback) feedback.textContent = '';
                if (elements.bookingFormError) elements.bookingFormError.classList.add('d-none');
            });
        });
    }

    function renderAll() {
        renderStatistics();
        renderBookings();
        populateLookupOptions();
    }

    function renderStatistics() {
        const total = bookings.length;
        const confirmed = bookings.filter(function (booking) {
            return (booking.bookingStatus || '').toLowerCase() === 'confirmed';
        }).length;
        const pending = bookings.filter(function (booking) {
            return (booking.bookingStatus || '').toLowerCase() === 'pending';
        }).length;
        const revenue = bookings.filter(function (booking) {
            return (booking.bookingStatus || '').toLowerCase() !== 'cancelled';
        }).reduce(function (sum, booking) {
            return sum + Number(booking.finalTotal || 0);
        }, 0);

        const totalEl = document.getElementById('totalBookingsStat');
        const confirmedEl = document.getElementById('confirmedBookingsStat');
        const pendingEl = document.getElementById('pendingBookingsStat');
        const revenueEl = document.getElementById('totalRevenueStat');

        if (totalEl) totalEl.textContent = String(total);
        if (confirmedEl) confirmedEl.textContent = String(confirmed);
        if (pendingEl) pendingEl.textContent = String(pending);
        if (revenueEl) revenueEl.textContent = formatCurrency(revenue);
    }

    function renderBookings() {
        const filteredBookings = getFilteredBookings();
        const tbody = elements.bookingTableBody;
        if (!tbody) return;

        if (!filteredBookings.length) {
            tbody.innerHTML = '';
            if (elements.bookingEmptyState) elements.bookingEmptyState.classList.remove('d-none');
            if (elements.resultsSummary) elements.resultsSummary.textContent = 'Showing 0 bookings';
            return;
        }

        if (elements.bookingEmptyState) elements.bookingEmptyState.classList.add('d-none');
        if (elements.resultsSummary) {
            elements.resultsSummary.textContent = 'Showing ' + filteredBookings.length + ' booking' + (filteredBookings.length === 1 ? '' : 's');
        }

        tbody.innerHTML = filteredBookings.map(function (booking) {
            const paymentCss = getPaymentBadgeClass(booking.paymentStatus);
            const statusCss = getStatusBadgeClass(booking.bookingStatus);
            const displayId = booking.bookingReference || booking.id;

            return '<tr>' +
                '<td><strong>' + escapeHtml(displayId) + '</strong></td>' +
                '<td>' +
                    '<div class="fw-semibold">' + escapeHtml(booking.touristName || 'Unknown tourist') + '</div>' +
                    '<small class="text-muted">' + escapeHtml(booking.touristContact || ('ID: ' + booking.touristId)) + '</small>' +
                '</td>' +
                '<td>' +
                    '<div class="fw-semibold">' + escapeHtml(booking.packageName || 'Unknown package') + '</div>' +
                    '<small class="text-muted">' + escapeHtml('ID: ' + booking.packageId) + '</small>' +
                '</td>' +
                '<td>' + formatDate(booking.bookingDate) + '</td>' +
                '<td>' + formatDate(booking.travelDate) + '</td>' +
                '<td>' + escapeHtml(String(booking.numberOfTravelers || 0)) + '</td>' +
                '<td>' + formatCurrency(Number(booking.finalTotal || 0)) + '</td>' +
                '<td><span class="payment-badge ' + paymentCss + '">' + escapeHtml(booking.paymentStatus || 'Unpaid') + '</span></td>' +
                '<td><span class="status-badge ' + statusCss + '">' + escapeHtml(booking.bookingStatus || 'Pending') + '</span></td>' +
                '<td class="text-center">' +
                    '<div class="d-flex justify-content-center gap-2">' +
                        '<button class="table-action" type="button" data-action="view" data-id="' + escapeAttribute(booking.id) + '" title="View booking details" aria-label="View booking ' + escapeAttribute(displayId) + '"><i class="bi bi-eye"></i></button>' +
                        '<button class="table-action" type="button" data-action="edit" data-id="' + escapeAttribute(booking.id) + '" title="Edit booking" aria-label="Edit booking ' + escapeAttribute(displayId) + '"><i class="bi bi-pencil-square"></i></button>' +
                        '<button class="table-action delete-action" type="button" data-action="delete" data-id="' + escapeAttribute(booking.id) + '" title="Delete booking" aria-label="Delete booking ' + escapeAttribute(displayId) + '"><i class="bi bi-trash"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function getFilteredBookings() {
        const searchTerm = (elements.searchInput ? elements.searchInput.value : '').trim().toLowerCase();
        const bookingStatus = elements.statusFilter ? elements.statusFilter.value : '';
        const paymentStatus = elements.paymentFilter ? elements.paymentFilter.value : '';
        const packageFilter = elements.packageFilter ? elements.packageFilter.value : '';
        const travelDateFilter = elements.travelDateFilter ? elements.travelDateFilter.value : '';
        const bookingDateFilter = elements.bookingDateFilter ? elements.bookingDateFilter.value : '';
        const touristFilter = elements.touristFilter ? elements.touristFilter.value : '';
        const sortValue = elements.sortSelect ? elements.sortSelect.value : 'bookingDateDesc';

        let filtered = bookings.filter(function (booking) {
            const matchesSearch = !searchTerm || [
                booking.id,
                booking.bookingReference,
                booking.touristName,
                booking.touristId,
                booking.packageName,
                booking.packageId
            ].some(function (value) {
                return (value || '').toLowerCase().includes(searchTerm);
            });

            const matchesBookingStatus = !bookingStatus ||
                (booking.bookingStatus || '').toLowerCase() === bookingStatus.toLowerCase();
            const matchesPaymentStatus = !paymentStatus ||
                (booking.paymentStatus || '').toLowerCase() === paymentStatus.toLowerCase();
            const matchesPackage = !packageFilter || String(booking.packageId) === String(packageFilter);
            const matchesTravelDate = !travelDateFilter ||
                (booking.travelDate ? String(booking.travelDate).split('T')[0] : '') === travelDateFilter;
            const matchesBookingDate = !bookingDateFilter ||
                (booking.bookingDate ? String(booking.bookingDate).split('T')[0] : '') === bookingDateFilter;
            const matchesTourist = !touristFilter || String(booking.touristId) === String(touristFilter);

            return matchesSearch && matchesBookingStatus && matchesPaymentStatus && matchesPackage && matchesTravelDate && matchesBookingDate && matchesTourist;
        });

        filtered.sort(function (first, second) {
            switch (sortValue) {
                case 'bookingDateAsc':
                    return compareDates(first.bookingDate, second.bookingDate);
                case 'travelDateAsc':
                    return compareDates(first.travelDate, second.travelDate);
                case 'travelDateDesc':
                    return compareDates(second.travelDate, first.travelDate);
                case 'finalTotalAsc':
                    return Number(first.finalTotal || 0) - Number(second.finalTotal || 0);
                case 'finalTotalDesc':
                    return Number(second.finalTotal || 0) - Number(first.finalTotal || 0);
                case 'statusAsc':
                    return (first.bookingStatus || '').localeCompare(second.bookingStatus || '');
                default:
                    return compareDates(second.bookingDate, first.bookingDate);
            }
        });

        return filtered;
    }

    function getPaymentBadgeClass(paymentStatus) {
        switch ((paymentStatus || 'Unpaid').toLowerCase()) {
            case 'paid':
                return 'paid';
            case 'partially paid':
            case 'partially_paid':
                return 'partially-paid';
            case 'refunded':
                return 'refunded';
            default:
                return 'unpaid';
        }
    }

    function getStatusBadgeClass(status) {
        switch ((status || 'Pending').toLowerCase()) {
            case 'confirmed':
                return 'confirmed';
            case 'cancelled':
                return 'cancelled';
            case 'completed':
                return 'completed';
            default:
                return 'pending';
        }
    }

    function handleTableAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const bookingId = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');

        if (action === 'view') {
            openBookingDetails(bookingId);
        } else if (action === 'edit') {
            openEditBookingModal(bookingId);
        } else if (action === 'delete') {
            openDeleteConfirm(bookingId);
        }
    }

    function openCreateBookingModal() {
        editingBookingId = null;
        elements.bookingForm.reset();
        elements.bookingFormTitle.textContent = 'Add New Booking';
        elements.bookingId.value = 'Auto-generated on save';
        elements.bookingDate.value = getTodayString();
        elements.paymentStatus.value = 'Unpaid';
        elements.bookingStatus.value = 'Pending';
        elements.discount.value = '0';
        elements.amountPaid.value = '0';
        elements.pricePerPerson.value = '0';
        elements.subtotal.value = '0';
        elements.finalTotal.value = '0';
        elements.balanceDue.value = '0';

        if (elements.bookingFormError) {
            elements.bookingFormError.classList.add('d-none');
            elements.bookingFormError.textContent = '';
        }

        clearAllFieldErrors();
        bookingFormModal.show();
    }

    function openEditBookingModal(bookingId) {
        const targetBooking = bookings.find(function (item) {
            return String(item.id) === String(bookingId);
        });

        if (!targetBooking) {
            showToast('Selected booking could not be found.');
            return;
        }

        editingBookingId = String(targetBooking.id);
        elements.bookingFormTitle.textContent = 'Edit Booking';
        elements.bookingId.value = targetBooking.bookingReference || targetBooking.id;
        elements.touristSelect.value = String(targetBooking.touristId || '');
        elements.packageSelect.value = String(targetBooking.packageId || '');
        elements.bookingDate.value = targetBooking.bookingDate ? String(targetBooking.bookingDate).split('T')[0] : getTodayString();
        elements.travelDate.value = targetBooking.travelDate ? String(targetBooking.travelDate).split('T')[0] : '';
        elements.numberOfTravelers.value = String(targetBooking.numberOfTravelers || 1);
        elements.specialRequests.value = targetBooking.specialRequests || '';
        elements.pricePerPerson.value = String(targetBooking.pricePerPerson || 0);
        elements.discount.value = String(targetBooking.discount || 0);
        elements.paymentStatus.value = targetBooking.paymentStatus || 'Unpaid';
        elements.amountPaid.value = String(targetBooking.amountPaid || 0);
        elements.bookingStatus.value = targetBooking.bookingStatus || 'Pending';

        if (elements.bookingFormError) {
            elements.bookingFormError.classList.add('d-none');
            elements.bookingFormError.textContent = '';
        }

        clearAllFieldErrors();
        recalculateBookingTotals();
        bookingFormModal.show();
    }

    function clearAllFieldErrors() {
        Array.prototype.slice.call(document.querySelectorAll('#bookingForm select, #bookingForm input, #bookingForm textarea')).forEach(function (control) {
            control.classList.remove('is-invalid');
            const feedback = control.parentElement && control.parentElement.querySelector('.invalid-feedback');
            if (feedback) feedback.textContent = '';
        });
    }

    async function handleBookingSubmit(event) {
        event.preventDefault();

        const validation = validateBookingForm();
        if (!validation.valid) {
            if (elements.bookingFormError) {
                elements.bookingFormError.textContent = validation.message;
                elements.bookingFormError.classList.remove('d-none');
            }
            showToast(validation.message);
            return;
        }

        const payload = buildBookingPayload();
        const submitBtn = elements.bookingForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        }

        try {
            if (editingBookingId) {
                const updated = await saveBooking(payload, editingBookingId);
                const normalized = normalizeBookingRecord(updated);
                bookings = bookings.map(function (item) {
                    return String(item.id) === String(editingBookingId) ? normalized : item;
                });
                bookingRepository.save(bookings);
                showToast('Booking ' + (normalized.bookingReference || normalized.id) + ' updated successfully.');
            } else {
                const created = await saveBooking(payload);
                const normalized = normalizeBookingRecord(created);
                bookings = [normalized].concat(bookings);
                bookingRepository.save(bookings);
                showToast('Booking ' + (normalized.bookingReference || normalized.id) + ' created successfully.');
            }

            bookingFormModal.hide();
            renderAll();
        } catch (error) {
            const errorMsg = error.message || 'Booking request failed.';
            if (elements.bookingFormError) {
                elements.bookingFormError.textContent = errorMsg;
                elements.bookingFormError.classList.remove('d-none');
            }
            showToast(errorMsg);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    }

    function validateBookingForm() {
        const selectedTourist = getSelectedTourist();
        const selectedPackage = getSelectedPackage();
        const bookingDate = elements.bookingDate.value;
        const travelDate = elements.travelDate.value;
        const travelers = Number(elements.numberOfTravelers.value);
        const pricePerPerson = Number(elements.pricePerPerson.value || 0);
        const subtotal = Number(elements.subtotal.value || 0);
        const discount = Number(elements.discount.value || 0);
        const finalTotal = Number(elements.finalTotal.value || 0);
        const amountPaid = Number(elements.amountPaid.value || 0);

        if (!selectedTourist) {
            return { valid: false, message: 'Please select a valid tourist before saving the booking.' };
        }
        if (!selectedPackage) {
            return { valid: false, message: 'Please select a valid tour package before saving the booking.' };
        }
        if (!bookingDate) {
            return { valid: false, message: 'Booking date is required.' };
        }
        if (!travelDate) {
            return { valid: false, message: 'Travel date is required.' };
        }
        if (new Date(travelDate) < new Date(bookingDate)) {
            return { valid: false, message: 'Travel date cannot be earlier than the booking date.' };
        }
        if (!Number.isInteger(travelers) || travelers <= 0) {
            return { valid: false, message: 'Number of travelers must be a positive whole number.' };
        }
        if (selectedPackage.status && selectedPackage.status.toLowerCase() === 'inactive') {
            return { valid: false, message: 'The selected package is inactive. Choose an active package or reactivate it first.' };
        }
        if (selectedPackage.maxTravelers && travelers > Number(selectedPackage.maxTravelers)) {
            return { valid: false, message: 'Traveler count exceeds the selected package maximum capacity (' + selectedPackage.maxTravelers + ').' };
        }
        if (pricePerPerson < 0) {
            return { valid: false, message: 'Price per person cannot be negative.' };
        }
        if (discount < 0 || discount > subtotal) {
            return { valid: false, message: 'Discount cannot be negative and cannot exceed the subtotal.' };
        }
        if (amountPaid < 0 || amountPaid > finalTotal) {
            return { valid: false, message: 'Amount paid cannot be negative or exceed the final total.' };
        }
        if (finalTotal < 0) {
            return { valid: false, message: 'Final total cannot be negative.' };
        }

        return { valid: true };
    }

    function buildBookingPayload() {
        const selectedTourist = getSelectedTourist();
        const selectedPackage = getSelectedPackage();
        const travelers = Number(elements.numberOfTravelers.value || 0);
        const discountValue = Number(elements.discount.value || 0);
        const amountPaidValue = Number(elements.amountPaid.value || 0);

        // Normalize payment status for backend enum (e.g. "Partially Paid" -> "PARTIALLY_PAID")
        let paymentStatusValue = (elements.paymentStatus.value || 'Unpaid').toUpperCase().replace(/\s+/g, '_');
        let bookingStatusValue = (elements.bookingStatus.value || 'Pending').toUpperCase();

        let bookingDateVal = (elements.bookingDate.value || '').trim();
        if (bookingDateVal && bookingDateVal.length === 10) {
            bookingDateVal = bookingDateVal + 'T00:00:00';
        } else if (!bookingDateVal) {
            bookingDateVal = new Date().toISOString().slice(0, 19);
        }

        let travelDateVal = (elements.travelDate.value || '').trim();
        if (travelDateVal && travelDateVal.includes('T')) {
            travelDateVal = travelDateVal.split('T')[0];
        }

        return {
            touristId: Number(selectedTourist.id),
            packageId: Number(selectedPackage.id),
            numberOfPeople: travelers,
            bookingDate: bookingDateVal,
            travelDate: travelDateVal,
            discount: discountValue,
            amountPaid: amountPaidValue,
            paymentStatus: paymentStatusValue,
            bookingStatus: bookingStatusValue,
            specialRequests: elements.specialRequests.value.trim()
        };
    }

    function recalculateBookingTotals() {
        const selectedPackage = getSelectedPackage();
        const travelers = Number(elements.numberOfTravelers.value || 0);
        const pricePerPerson = Number(elements.pricePerPerson.value || (selectedPackage ? selectedPackage.price : 0) || 0);
        const subtotalValue = travelers > 0 ? travelers * pricePerPerson : 0;

        let discountValue = Number(elements.discount.value || 0);
        if (!Number.isFinite(discountValue) || discountValue < 0) {
            discountValue = 0;
        }
        if (discountValue > subtotalValue) {
            discountValue = subtotalValue;
        }
        elements.discount.value = String(discountValue);

        const finalTotalValue = Math.max(0, subtotalValue - discountValue);
        let amountPaidValue = Number(elements.amountPaid.value || 0);
        if (!Number.isFinite(amountPaidValue) || amountPaidValue < 0) {
            amountPaidValue = 0;
        }
        if (amountPaidValue > finalTotalValue) {
            amountPaidValue = finalTotalValue;
        }
        elements.amountPaid.value = String(amountPaidValue);

        const balanceDueValue = Math.max(0, finalTotalValue - amountPaidValue);

        elements.pricePerPerson.value = String(Number(selectedPackage ? selectedPackage.price || 0 : pricePerPerson));
        elements.subtotal.value = String(subtotalValue);
        elements.finalTotal.value = String(finalTotalValue);
        elements.balanceDue.value = String(balanceDueValue);

        if (selectedPackage && selectedPackage.status && selectedPackage.status.toLowerCase() === 'inactive') {
            elements.packageSelect.classList.add('is-invalid');
        } else {
            elements.packageSelect.classList.remove('is-invalid');
        }
    }

    function openBookingDetails(bookingId) {
        const booking = bookings.find(function (item) {
            return String(item.id) === String(bookingId);
        });

        if (!booking) {
            showToast('The requested booking could not be found.');
            return;
        }

        detailsBookingId = String(booking.id);
        const displayId = booking.bookingReference || booking.id;
        elements.bookingDetailsSummary.textContent = displayId + ' • ' + (booking.touristName || 'Unknown tourist');
        const contactDetails = booking.touristContact || 'Contact details unavailable';
        const packageState = booking.packageName || 'Package information unavailable';
        const specialRequests = booking.specialRequests || 'No special requests';

        elements.bookingDetailContent.innerHTML = '' +
            '<div class="detail-item"><span class="detail-label">Booking Reference</span><span class="detail-value fw-bold text-emerald">' + escapeHtml(displayId) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">System ID</span><span class="detail-value">' + escapeHtml(String(booking.id)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Tourist</span><span class="detail-value">' + escapeHtml(booking.touristName || 'Unknown tourist') + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Tourist ID</span><span class="detail-value">' + escapeHtml(String(booking.touristId || 'Unavailable')) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Tourist Contact</span><span class="detail-value">' + escapeHtml(contactDetails) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Package</span><span class="detail-value">' + escapeHtml(packageState) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Package ID</span><span class="detail-value">' + escapeHtml(String(booking.packageId || 'Unavailable')) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Booking Date</span><span class="detail-value">' + formatDate(booking.bookingDate) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Travel Date</span><span class="detail-value">' + formatDate(booking.travelDate) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Travelers</span><span class="detail-value">' + escapeHtml(String(booking.numberOfTravelers || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Price Per Person</span><span class="detail-value">' + formatCurrency(Number(booking.pricePerPerson || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Subtotal</span><span class="detail-value">' + formatCurrency(Number(booking.subtotal || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Discount</span><span class="detail-value">' + formatCurrency(Number(booking.discount || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Final Total</span><span class="detail-value">' + formatCurrency(Number(booking.finalTotal || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Amount Paid</span><span class="detail-value">' + formatCurrency(Number(booking.amountPaid || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Balance Due</span><span class="detail-value">' + formatCurrency(Number(booking.balanceDue || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Payment Status</span><span class="detail-value"><span class="payment-badge ' + getPaymentBadgeClass(booking.paymentStatus) + '">' + escapeHtml(booking.paymentStatus || 'Unpaid') + '</span></span></div>' +
            '<div class="detail-item"><span class="detail-label">Booking Status</span><span class="detail-value"><span class="status-badge ' + getStatusBadgeClass(booking.bookingStatus) + '">' + escapeHtml(booking.bookingStatus || 'Pending') + '</span></span></div>' +
            '<div class="detail-item" style="grid-column: 1 / -1"><span class="detail-label">Special Requests</span><span class="detail-value">' + escapeHtml(specialRequests) + '</span></div>';

        bookingDetailsModal.show();
    }

    function openDeleteConfirm(bookingId) {
        const booking = bookings.find(function (item) {
            return String(item.id) === String(bookingId);
        });

        if (!booking) {
            showToast('The selected booking is no longer available.');
            return;
        }

        pendingDeleteBookingId = String(booking.id);
        elements.deleteBookingIdText.textContent = booking.bookingReference || booking.id;
        elements.deleteBookingTouristText.textContent = booking.touristName || 'Unknown tourist';
        deleteBookingModal.show();
    }

    async function confirmDeleteBooking() {
        if (!pendingDeleteBookingId) return;

        const deleteBtn = document.getElementById('confirmDeleteBookingButton');
        const origText = deleteBtn ? deleteBtn.innerHTML : '';
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';
        }

        try {
            await deleteBookingById(pendingDeleteBookingId);
            bookings = bookings.filter(function (booking) {
                return String(booking.id) !== String(pendingDeleteBookingId);
            });
            bookingRepository.save(bookings);
            deleteBookingModal.hide();
            pendingDeleteBookingId = null;
            renderAll();
            showToast('Booking deleted successfully.');
        } catch (error) {
            showToast(error.message || 'Unable to delete this booking.');
        } finally {
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = origText;
            }
        }
    }

    function resetFilters() {
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.statusFilter) elements.statusFilter.value = '';
        if (elements.paymentFilter) elements.paymentFilter.value = '';
        if (elements.packageFilter) elements.packageFilter.value = '';
        if (elements.travelDateFilter) elements.travelDateFilter.value = '';
        if (elements.bookingDateFilter) elements.bookingDateFilter.value = '';
        if (elements.touristFilter) elements.touristFilter.value = '';
        if (elements.sortSelect) elements.sortSelect.value = 'bookingDateDesc';
        renderBookings();
    }

    function populateLookupOptions() {
        if (elements.packageFilter) {
            elements.packageFilter.innerHTML = '<option value="">All packages</option>' +
                packageCatalog.map(function (item) {
                    return '<option value="' + escapeAttribute(item.id) + '">' + escapeHtml(item.name) + ' (' + escapeHtml(item.id) + ')</option>';
                }).join('');
        }

        if (elements.packageSelect) {
            elements.packageSelect.innerHTML = '<option value="">Select a package</option>' +
                packageCatalog.map(function (item) {
                    return '<option value="' + escapeAttribute(item.id) + '">' + escapeHtml(item.name) + ' — ID ' + escapeHtml(item.id) + ' • ' + formatCurrency(Number(item.price || 0)) + '</option>';
                }).join('');
        }

        if (elements.touristFilter) {
            elements.touristFilter.innerHTML = '<option value="">All tourists</option>' +
                touristCatalog.map(function (item) {
                    return '<option value="' + escapeAttribute(item.id) + '">' + escapeHtml(item.name) + ' (' + escapeHtml(item.id) + ')</option>';
                }).join('');
        }

        if (elements.touristSelect) {
            elements.touristSelect.innerHTML = '<option value="">Select a tourist</option>' +
                touristCatalog.map(function (item) {
                    return '<option value="' + escapeAttribute(item.id) + '">' + escapeHtml(item.name) + ' — ID ' + escapeHtml(item.id) + (item.contact ? ' (' + escapeHtml(item.contact) + ')' : '') + '</option>';
                }).join('');
        }

        if (elements.packageDataAlert) {
            if (!packageCatalog.length) {
                elements.packageDataAlert.classList.remove('d-none');
                elements.packageDataAlert.textContent = 'Tour package records are not available yet. Create at least one package in Tour Package Management.';
            } else {
                elements.packageDataAlert.classList.add('d-none');
            }
        }

        if (elements.touristDataAlert) {
            if (!touristCatalog.length) {
                elements.touristDataAlert.classList.remove('d-none');
                elements.touristDataAlert.textContent = 'Tourist records are not available yet. Create tourist profiles in Tourist Management.';
            } else {
                elements.touristDataAlert.classList.add('d-none');
            }
        }
    }

    function getSelectedTourist() {
        const selectedId = elements.touristSelect ? elements.touristSelect.value : '';
        return touristCatalog.find(function (item) { return String(item.id) === String(selectedId); }) || null;
    }

    function getSelectedPackage() {
        const selectedId = elements.packageSelect ? elements.packageSelect.value : '';
        return packageCatalog.find(function (item) { return String(item.id) === String(selectedId); }) || null;
    }

    function createBookingRepository() {
        return {
            load: function () {
                const stored = safeReadStorage(STORAGE_KEY);
                if (stored === null || !Array.isArray(stored) || stored.length === 0) {
                    const sampleBookings = createSampleBookings();
                    safeWriteStorage(STORAGE_KEY, sampleBookings);
                    return sampleBookings;
                }
                return stored;
            },
            save: function (records) {
                safeWriteStorage(STORAGE_KEY, records);
            }
        };
    }

    async function saveBooking(payload, bookingId) {
        if (!isConnectedToBackend) {
            // Local fallback simulation
            if (bookingId) {
                const existing = bookings.find(function (b) { return String(b.id) === String(bookingId); });
                const tourist = touristCatalog.find(function (t) { return String(t.id) === String(payload.touristId); });
                const pkg = packageCatalog.find(function (p) { return String(p.id) === String(payload.packageId); });
                return Object.assign({}, existing, payload, {
                    touristName: tourist ? tourist.name : 'Unknown tourist',
                    touristContact: tourist ? tourist.contact : '',
                    packageName: pkg ? pkg.name : 'Unknown package',
                    packagePrice: pkg ? pkg.price : 0,
                    totalAmount: (pkg ? pkg.price : 0) * payload.numberOfPeople - (payload.discount || 0)
                });
            } else {
                const tourist = touristCatalog.find(function (t) { return String(t.id) === String(payload.touristId); });
                const pkg = packageCatalog.find(function (p) { return String(p.id) === String(payload.packageId); });
                const nextId = 'BK-' + String(Date.now()).slice(-6);
                return Object.assign({}, payload, {
                    id: nextId,
                    bookingReference: nextId,
                    touristName: tourist ? tourist.name : 'Unknown tourist',
                    touristContact: tourist ? tourist.contact : '',
                    packageName: pkg ? pkg.name : 'Unknown package',
                    packagePrice: pkg ? pkg.price : 0,
                    totalAmount: (pkg ? pkg.price : 0) * payload.numberOfPeople - (payload.discount || 0),
                    createdAt: new Date().toISOString()
                });
            }
        }

        const method = bookingId ? 'PUT' : 'POST';
        const url = bookingId ? '/api/bookings/' + encodeURIComponent(bookingId) : '/api/bookings';
        const csrf = await getCsrfToken();

        const response = await fetch(API_BASE_URL + url, {
            method: method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrf
            },
            body: JSON.stringify(payload)
        });

        const json = await response.json().catch(function () { return null; });
        if (!response.ok) {
            const fieldErrors = json && json.errors ? Object.values(json.errors).join(' ') : '';
            throw new Error(fieldErrors || (json && json.message) || 'Booking request failed.');
        }
        return json;
    }

    async function deleteBookingById(bookingId) {
        if (!isConnectedToBackend) {
            return;
        }

        const csrf = await getCsrfToken();
        const response = await fetch(API_BASE_URL + '/api/bookings/' + encodeURIComponent(bookingId), {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'X-CSRF-TOKEN': csrf
            }
        });

        if (!response.ok) {
            const body = await response.json().catch(function () { return null; });
            throw new Error(body && body.message ? body.message : 'Unable to delete booking.');
        }
    }

    function normalizeBookingRecord(booking) {
        let paymentStatus = booking.paymentStatus || 'UNPAID';
        paymentStatus = paymentStatus.replace(/_/g, ' ').toLowerCase();
        paymentStatus = paymentStatus.split(' ').map(function (w) {
            return w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ');

        let bookingStatus = booking.bookingStatus || 'PENDING';
        bookingStatus = bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1).toLowerCase();

        const touristIdStr = String(booking.touristId != null ? booking.touristId : '');
        const packageIdStr = String(booking.packageId != null ? booking.packageId : '');

        // Resolve tourist contact and package price if available in catalogs
        const matchedTourist = touristCatalog.find(function (t) { return String(t.id) === touristIdStr; });
        const matchedPackage = packageCatalog.find(function (p) { return String(p.id) === packageIdStr; });

        const pricePerPerson = Number(booking.packagePrice || (matchedPackage ? matchedPackage.price : 0) || 0);
        const numberOfPeople = Number(booking.numberOfPeople || 0);
        const discount = Number(booking.discount || 0);
        const totalAmount = Number(booking.totalAmount != null ? booking.totalAmount : (pricePerPerson * numberOfPeople));
        const amountPaid = Number(booking.amountPaid || 0);

        return {
            id: String(booking.id != null ? booking.id : (booking.bookingReference || '')),
            bookingReference: booking.bookingReference || (booking.id ? 'BK-' + booking.id : ''),
            touristId: touristIdStr,
            touristName: booking.touristName || (matchedTourist ? matchedTourist.name : 'Unknown tourist'),
            touristContact: booking.touristContact || (matchedTourist ? (matchedTourist.contact || matchedTourist.phone || matchedTourist.email) : ''),
            packageId: packageIdStr,
            packageName: booking.packageName || (matchedPackage ? matchedPackage.name : 'Unknown package'),
            bookingDate: booking.bookingDate ? String(booking.bookingDate).split('T')[0] : '',
            travelDate: booking.travelDate ? String(booking.travelDate).split('T')[0] : '',
            numberOfTravelers: numberOfPeople,
            pricePerPerson: pricePerPerson,
            subtotal: numberOfPeople * pricePerPerson,
            discount: discount,
            finalTotal: totalAmount,
            amountPaid: amountPaid,
            balanceDue: Math.max(0, totalAmount - amountPaid),
            paymentStatus: paymentStatus,
            bookingStatus: bookingStatus,
            specialRequests: booking.specialRequests || '',
            createdAt: booking.createdAt || new Date().toISOString()
        };
    }

    function createSampleBookings() {
        const touristSamples = touristCatalog.length ? touristCatalog : [
            { id: '1', name: 'Alice Fernando', email: 'alice.fernando@example.com', phone: '+94 77 123 4567' },
            { id: '2', name: 'Daniel Wijesinghe', email: 'daniel.wijesinghe@example.com', phone: '+94 77 765 4321' },
            { id: '3', name: 'Nadee Jayawardena', email: 'nadee.jayawardena@example.com', phone: '+94 77 345 1234' }
        ];

        const packageSamples = packageCatalog.length ? packageCatalog : [
            { id: '1', name: 'Cultural Triangle Escape', price: 32000, maxTravelers: 6, status: 'Active' },
            { id: '2', name: 'Southern Coast Serenity', price: 42000, maxTravelers: 4, status: 'Active' },
            { id: '3', name: 'Hill Country Retreat', price: 51000, maxTravelers: 5, status: 'Active' }
        ];

        return [
            {
                id: '1',
                bookingReference: 'BK-2026-1001',
                touristId: touristSamples[0].id,
                touristName: touristSamples[0].name,
                touristContact: touristSamples[0].phone || touristSamples[0].email,
                packageId: packageSamples[0].id,
                packageName: packageSamples[0].name,
                bookingDate: '2026-11-01',
                travelDate: '2026-11-15',
                numberOfTravelers: 2,
                pricePerPerson: 32000,
                subtotal: 64000,
                discount: 0,
                finalTotal: 64000,
                amountPaid: 64000,
                balanceDue: 0,
                paymentStatus: 'Paid',
                bookingStatus: 'Confirmed',
                specialRequests: 'Window seat requested on the return flight.'
            },
            {
                id: '2',
                bookingReference: 'BK-2026-1002',
                touristId: touristSamples[1].id,
                touristName: touristSamples[1].name,
                touristContact: touristSamples[1].phone || touristSamples[1].email,
                packageId: packageSamples[1].id,
                packageName: packageSamples[1].name,
                bookingDate: '2026-11-03',
                travelDate: '2026-12-02',
                numberOfTravelers: 3,
                pricePerPerson: 42000,
                subtotal: 126000,
                discount: 8000,
                finalTotal: 126000,
                amountPaid: 118000,
                balanceDue: 0,
                paymentStatus: 'Paid',
                bookingStatus: 'Confirmed',
                specialRequests: 'Please arrange a sunset dinner reservation.'
            },
            {
                id: '3',
                bookingReference: 'BK-2026-1003',
                touristId: touristSamples[2].id,
                touristName: touristSamples[2].name,
                touristContact: touristSamples[2].phone || touristSamples[2].email,
                packageId: packageSamples[2].id,
                packageName: packageSamples[2].name,
                bookingDate: '2026-11-05',
                travelDate: '2027-01-10',
                numberOfTravelers: 2,
                pricePerPerson: 51000,
                subtotal: 102000,
                discount: 0,
                finalTotal: 102000,
                amountPaid: 0,
                balanceDue: 102000,
                paymentStatus: 'Unpaid',
                bookingStatus: 'Pending',
                specialRequests: 'Need a deluxe room upgrade if available.'
            }
        ];
    }

    function getPackageCatalog() {
        const catalogs = PACKAGE_KEYS.map(function (key) {
            return safeReadStorage(key);
        }).filter(function (value) {
            return Array.isArray(value);
        });

        const allPackages = catalogs.flat();
        const validPackages = allPackages.filter(function (item) {
            return !!item && typeof item === 'object' && item.id != null && typeof item.name === 'string';
        });

        if (!validPackages.length) {
            return [
                { id: '1', name: 'Cultural Triangle Escape', price: 32000, maxTravelers: 6, status: 'Active' },
                { id: '2', name: 'Southern Coast Serenity', price: 42000, maxTravelers: 4, status: 'Active' },
                { id: '3', name: 'Hill Country Retreat', price: 51000, maxTravelers: 5, status: 'Active' }
            ];
        }

        const uniquePackages = [];
        validPackages.forEach(function (packageItem) {
            const pkgId = String(packageItem.id);
            if (!uniquePackages.some(function (entry) { return entry.id === pkgId; })) {
                uniquePackages.push({
                    id: pkgId,
                    name: packageItem.name,
                    price: Number(packageItem.price || packageItem.packagePrice || packageItem.amount || 0),
                    maxTravelers: Number(packageItem.maxTravelers || packageItem.capacity || 0),
                    status: packageItem.status || 'Active'
                });
            }
        });

        return uniquePackages;
    }

    function getTouristCatalog() {
        const catalogs = TOURIST_KEYS.map(function (key) {
            return safeReadStorage(key);
        }).filter(function (value) {
            return Array.isArray(value);
        });

        const allTourists = catalogs.flat();
        const validTourists = allTourists.filter(function (item) {
            return !!item && typeof item === 'object' && (item.id != null || item.touristId != null || item.touristID != null);
        });

        if (!validTourists.length) {
            return [
                { id: '1', name: 'Alice Fernando', email: 'alice.fernando@example.com', phone: '+94 77 123 4567' },
                { id: '2', name: 'Daniel Wijesinghe', email: 'daniel.wijesinghe@example.com', phone: '+94 77 765 4321' },
                { id: '3', name: 'Nadee Jayawardena', email: 'nadee.jayawardena@example.com', phone: '+94 77 345 1234' }
            ];
        }

        const uniqueTourists = [];
        validTourists.forEach(function (touristItem) {
            const touristId = String(touristItem.id || touristItem.touristId || touristItem.touristID);
            if (!uniqueTourists.some(function (entry) { return entry.id === touristId; })) {
                uniqueTourists.push({
                    id: touristId,
                    name: touristItem.name || touristItem.fullName || 'Unnamed Tourist',
                    phone: touristItem.phone || touristItem.contactNumber || touristItem.mobile || '',
                    email: touristItem.email || touristItem.contactEmail || '',
                    contact: touristItem.phone || touristItem.email || touristItem.contact || ''
                });
            }
        });

        return uniqueTourists;
    }

    function safeReadStorage(key) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? null : JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function safeWriteStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function formatCurrency(amount) {
        const parsed = Number(amount || 0);
        return 'LKR ' + parsed.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function formatDate(dateValue) {
        if (!dateValue) return '—';
        const strVal = String(dateValue).split('T')[0];
        const parsed = new Date(strVal + 'T00:00:00');
        if (Number.isNaN(parsed.getTime())) return strVal;
        return parsed.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function compareDates(firstDate, secondDate) {
        const first = new Date(firstDate ? String(firstDate).split('T')[0] : '1970-01-01').getTime();
        const second = new Date(secondDate ? String(secondDate).split('T')[0] : '1970-01-01').getTime();
        return first - second;
    }

    function getTodayString() {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localDate = new Date(today.getTime() - offset * 60000);
        return localDate.toISOString().slice(0, 10);
    }

    function clearFieldError(event) {
        const target = event.target;
        if (!target || !target.classList) return;
        target.classList.remove('is-invalid');
        const feedback = target.parentElement && target.parentElement.querySelector('.invalid-feedback');
        if (feedback) feedback.textContent = '';
    }

    function showToast(message) {
        if (elements.toastBody) {
            elements.toastBody.textContent = message;
            toast.show();
        }
    }

    function escapeHtml(value) {
        const safeValue = value !== undefined && value !== null ? value : '';
        return String(safeValue)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }
});
