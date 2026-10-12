/**
 * Ceylon Explore - Booking Management
 * Browser demo storage is isolated behind bookingRepository for future API replacement.
 */

document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'ceylonExploreBookings';
    const PACKAGE_KEYS = ['ceylonExplorePackages', 'ceylonExplorePackageManagement', 'ceylonExplorePackagesV1'];
    const TOURIST_KEYS = ['ceylonExploreTourists', 'ceylonExplore.tourists.v1', 'ceylonExploreTouristsV1', 'ceylonExploreTouristManagement'];
    const PAYMENT_STATUS_OPTIONS = ['Unpaid', 'Partially Paid', 'Paid'];
    const BOOKING_STATUS_OPTIONS = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
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
        bookingTableBody: document.getElementById('bookingTableBody'),
        bookingEmptyState: document.getElementById('bookingEmptyState'),
        addBookingButton: document.getElementById('addBookingButton'),
        bookingForm: document.getElementById('bookingForm'),
        bookingFormTitle: document.getElementById('bookingFormTitle'),
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
        bookingDetailContent: document.getElementById('bookingDetailContent')
    };

    const packageCatalog = getPackageCatalog();
    const touristCatalog = getTouristCatalog();
    const bookingRepository = createBookingRepository();
    let bookings = bookingRepository.load();
    let editingBookingId = null;
    let detailsBookingId = null;
    let pendingDeleteBookingId = null;

    bindEvents();
    populateLookupOptions();
    renderAll();

    function bindEvents() {
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

        document.querySelectorAll('.module-placeholder').forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                elements.sidebar.classList.remove('is-open');
                elements.sidebarBackdrop.classList.remove('is-visible');
                elements.sidebarToggle.setAttribute('aria-expanded', 'false');
                showToast(link.dataset.module + ' is prepared as a future CRUD module.');
            });
        });

        document.getElementById('notificationButton').addEventListener('click', function () {
            showToast('Notifications are interface placeholders for the admin dashboard.');
        });

        elements.addBookingButton.addEventListener('click', openCreateBookingModal);
        elements.bookingForm.addEventListener('submit', handleBookingSubmit);
        elements.bookingTableBody.addEventListener('click', handleTableAction);
        elements.bookingDetailsModal = document.getElementById('bookingDetailsModal');
        document.getElementById('editFromDetailsButton').addEventListener('click', function () {
            if (!detailsBookingId) {
                return;
            }
            const hiddenHandler = function () {
                openEditBookingModal(detailsBookingId);
            };
            document.getElementById('bookingDetailsModal').addEventListener('hidden.bs.modal', hiddenHandler, { once: true });
            bookingDetailsModal.hide();
        });

        document.getElementById('confirmDeleteBookingButton').addEventListener('click', confirmDeleteBooking);

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
            control.addEventListener(control === elements.searchInput ? 'input' : 'change', renderBookings);
        });

        document.getElementById('resetFiltersButton').addEventListener('click', resetFilters);
        document.getElementById('emptyResetButton').addEventListener('click', resetFilters);

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

        elements.numberOfTravelers.addEventListener('input', recalculateBookingTotals);
        elements.discount.addEventListener('input', recalculateBookingTotals);
        elements.amountPaid.addEventListener('input', recalculateBookingTotals);
        elements.paymentStatus.addEventListener('change', recalculateBookingTotals);

        elements.bookingDate.addEventListener('input', clearFieldError);
        elements.travelDate.addEventListener('input', clearFieldError);
        elements.numberOfTravelers.addEventListener('input', clearFieldError);
        elements.discount.addEventListener('input', clearFieldError);
        elements.amountPaid.addEventListener('input', clearFieldError);

        Array.prototype.slice.call(document.querySelectorAll('#bookingForm select, #bookingForm input, #bookingForm textarea')).forEach(function (control) {
            control.addEventListener('input', function () {
                if (control.classList.contains('is-invalid')) {
                    control.classList.remove('is-invalid');
                }
                const feedback = control.parentElement && control.parentElement.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.textContent = '';
                }
            });
        });
    }

    function isValidBookingRecord(item) {
        return !!item && typeof item === 'object'
            && typeof item.id === 'string' && /^BOOK-\d{4,}$/.test(item.id)
            && typeof item.touristId === 'string' && item.touristId.trim() !== ''
            && typeof item.packageId === 'string' && item.packageId.trim() !== ''
            && typeof item.bookingDate === 'string' && item.bookingDate.trim() !== ''
            && typeof item.travelDate === 'string' && item.travelDate.trim() !== ''
            && Number.isFinite(Number(item.numberOfTravelers)) && Number(item.numberOfTravelers) > 0
            && Number.isFinite(Number(item.finalTotal)) && Number(item.finalTotal) >= 0
            && BOOKING_STATUS_OPTIONS.includes(item.bookingStatus || '')
            && PAYMENT_STATUS_OPTIONS.includes(item.paymentStatus || '');
    }

    function renderAll() {
        renderStatistics();
        renderBookings();
        populateLookupOptions();
    }

    function renderStatistics() {
        const total = bookings.length;
        const confirmed = bookings.filter(function (booking) { return booking.bookingStatus === 'Confirmed'; }).length;
        const pending = bookings.filter(function (booking) { return booking.bookingStatus === 'Pending'; }).length;
        const revenue = bookings.filter(function (booking) { return booking.bookingStatus !== 'Cancelled'; }).reduce(function (sum, booking) {
            return sum + Number(booking.finalTotal || 0);
        }, 0);

        document.getElementById('totalBookingsStat').textContent = String(total);
        document.getElementById('confirmedBookingsStat').textContent = String(confirmed);
        document.getElementById('pendingBookingsStat').textContent = String(pending);
        document.getElementById('totalRevenueStat').textContent = formatCurrency(revenue);
    }

    function renderBookings() {
        const filteredBookings = getFilteredBookings();
        const tbody = elements.bookingTableBody;

        if (!filteredBookings.length) {
            tbody.innerHTML = '';
            elements.bookingEmptyState.classList.remove('d-none');
            elements.resultsSummary.textContent = 'Showing 0 bookings';
            return;
        }

        elements.bookingEmptyState.classList.add('d-none');
        elements.resultsSummary.textContent = 'Showing ' + filteredBookings.length + ' booking' + (filteredBookings.length === 1 ? '' : 's');

        tbody.innerHTML = filteredBookings.map(function (booking) {
            const paymentCss = getPaymentBadgeClass(booking.paymentStatus);
            const statusCss = getStatusBadgeClass(booking.bookingStatus);
            return '<tr>' +
                '<td><strong>' + escapeHtml(booking.id) + '</strong></td>' +
                '<td>' +
                    '<div class="fw-semibold">' + escapeHtml(booking.touristName || 'Unknown tourist') + '</div>' +
                    '<small class="text-muted">' + escapeHtml(booking.touristId || 'Tourist ID unavailable') + '</small>' +
                '</td>' +
                '<td>' +
                    '<div class="fw-semibold">' + escapeHtml(booking.packageName || 'Unknown package') + '</div>' +
                    '<small class="text-muted">' + escapeHtml(booking.packageId || 'Package ID unavailable') + '</small>' +
                '</td>' +
                '<td>' + formatDate(booking.bookingDate) + '</td>' +
                '<td>' + formatDate(booking.travelDate) + '</td>' +
                '<td>' + escapeHtml(String(booking.numberOfTravelers || 0)) + '</td>' +
                '<td>' + formatCurrency(Number(booking.finalTotal || 0)) + '</td>' +
                '<td><span class="payment-badge ' + paymentCss + '">' + escapeHtml(booking.paymentStatus || 'Unpaid') + '</span></td>' +
                '<td><span class="status-badge ' + statusCss + '">' + escapeHtml(booking.bookingStatus || 'Pending') + '</span></td>' +
                '<td class="text-center">' +
                    '<div class="d-flex justify-content-center gap-2">' +
                        '<button class="table-action" type="button" data-action="view" data-id="' + escapeAttribute(booking.id) + '" aria-label="View booking ' + escapeAttribute(booking.id) + '"><i class="bi bi-eye"></i></button>' +
                        '<button class="table-action" type="button" data-action="edit" data-id="' + escapeAttribute(booking.id) + '" aria-label="Edit booking ' + escapeAttribute(booking.id) + '"><i class="bi bi-pencil-square"></i></button>' +
                        '<button class="table-action delete-action" type="button" data-action="delete" data-id="' + escapeAttribute(booking.id) + '" aria-label="Delete booking ' + escapeAttribute(booking.id) + '"><i class="bi bi-trash"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    }

    function getFilteredBookings() {
        const searchTerm = (elements.searchInput.value || '').trim().toLowerCase();
        const bookingStatus = elements.statusFilter.value;
        const paymentStatus = elements.paymentFilter.value;
        const packageFilter = elements.packageFilter.value;
        const travelDateFilter = elements.travelDateFilter.value;
        const bookingDateFilter = elements.bookingDateFilter.value;
        const touristFilter = elements.touristFilter.value;
        const sortValue = elements.sortSelect.value;

        let filtered = bookings.filter(function (booking) {
            const matchesSearch = !searchTerm || [
                booking.id,
                booking.touristName,
                booking.touristId,
                booking.packageName,
                booking.packageId
            ].some(function (value) {
                return (value || '').toLowerCase().includes(searchTerm);
            });

            const matchesBookingStatus = !bookingStatus || booking.bookingStatus === bookingStatus;
            const matchesPaymentStatus = !paymentStatus || booking.paymentStatus === paymentStatus;
            const matchesPackage = !packageFilter || booking.packageId === packageFilter;
            const matchesTravelDate = !travelDateFilter || booking.travelDate === travelDateFilter;
            const matchesBookingDate = !bookingDateFilter || booking.bookingDate === bookingDateFilter;
            const matchesTourist = !touristFilter || booking.touristId === touristFilter;

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
                return 'partially-paid';
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
        if (!button) {
            return;
        }

        const bookingId = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');

        if (action === 'view') {
            openBookingDetails(bookingId);
        }
        if (action === 'edit') {
            openEditBookingModal(bookingId);
        }
        if (action === 'delete') {
            openDeleteConfirm(bookingId);
        }
    }

    function openCreateBookingModal() {
        editingBookingId = null;
        elements.bookingForm.reset();
        elements.bookingFormTitle.textContent = 'Add New Booking';
        elements.bookingId.value = generateNextBookingId(bookings);
        elements.bookingDate.value = getTodayString();
        elements.paymentStatus.value = 'Unpaid';
        elements.bookingStatus.value = 'Pending';
        elements.discount.value = '0';
        elements.amountPaid.value = '0';
        elements.pricePerPerson.value = '0';
        elements.subtotal.value = '0';
        elements.finalTotal.value = '0';
        elements.balanceDue.value = '0';
        bookingFormModal.show();
    }

    function openEditBookingModal(bookingId) {
        const targetBooking = bookings.find(function (item) { return item.id === bookingId; });
        if (!targetBooking) {
            showToast('Selected booking could not be found.');
            return;
        }

        editingBookingId = bookingId;
        elements.bookingFormTitle.textContent = 'Edit Booking';
        elements.bookingId.value = targetBooking.id;
        elements.touristSelect.value = targetBooking.touristId || '';
        elements.packageSelect.value = targetBooking.packageId || '';
        elements.bookingDate.value = targetBooking.bookingDate || getTodayString();
        elements.travelDate.value = targetBooking.travelDate || '';
        elements.numberOfTravelers.value = String(targetBooking.numberOfTravelers || 1);
        elements.specialRequests.value = targetBooking.specialRequests || '';
        elements.pricePerPerson.value = String(targetBooking.pricePerPerson || Number(targetBooking.finalTotal || 0));
        elements.discount.value = String(targetBooking.discount || 0);
        elements.paymentStatus.value = targetBooking.paymentStatus || 'Unpaid';
        elements.amountPaid.value = String(targetBooking.amountPaid || 0);
        elements.bookingStatus.value = targetBooking.bookingStatus || 'Pending';
        recalculateBookingTotals();
        bookingFormModal.show();
    }

    function handleBookingSubmit(event) {
        event.preventDefault();

        const validation = validateBookingForm();
        if (!validation.valid) {
            showToast(validation.message);
            return;
        }

        const payload = buildBookingPayload();

        if (editingBookingId) {
            bookings = bookings.map(function (item) {
                return item.id === editingBookingId ? Object.assign({}, item, payload) : item;
            });
            showToast('Booking updated successfully.');
        } else {
            bookings = bookings.concat(payload);
            showToast('Booking created successfully.');
        }

        bookingRepository.save(bookings);
        bookingFormModal.hide();
        renderAll();
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
            return { valid: false, message: 'Traveler count exceeds the selected package maximum capacity.' };
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
        const pricePerPerson = Number(elements.pricePerPerson.value || 0);
        const subtotalValue = Number(elements.subtotal.value || 0);
        const discountValue = Number(elements.discount.value || 0);
        const finalTotalValue = Number(elements.finalTotal.value || 0);
        const amountPaidValue = Number(elements.amountPaid.value || 0);
        const balanceDueValue = Number(elements.balanceDue.value || 0);

        const id = editingBookingId || elements.bookingId.value || generateNextBookingId(bookings);

        return {
            id: id,
            touristId: selectedTourist.id,
            touristName: selectedTourist.name,
            touristContact: selectedTourist.phone || selectedTourist.email || selectedTourist.contact || '',
            packageId: selectedPackage.id,
            packageName: selectedPackage.name,
            bookingDate: elements.bookingDate.value,
            travelDate: elements.travelDate.value,
            numberOfTravelers: travelers,
            pricePerPerson: pricePerPerson,
            subtotal: subtotalValue,
            discount: discountValue,
            finalTotal: finalTotalValue,
            amountPaid: amountPaidValue,
            balanceDue: balanceDueValue,
            paymentStatus: elements.paymentStatus.value,
            bookingStatus: elements.bookingStatus.value,
            specialRequests: elements.specialRequests.value.trim(),
            createdAt: new Date().toISOString()
        };
    }

    function recalculateBookingTotals() {
        const selectedPackage = getSelectedPackage();
        const travelers = Number(elements.numberOfTravelers.value || 0);
        const pricePerPerson = Number(elements.pricePerPerson.value || 0);
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
        const booking = bookings.find(function (item) { return item.id === bookingId; });
        if (!booking) {
            showToast('The requested booking could not be found.');
            return;
        }

        detailsBookingId = bookingId;
        elements.bookingDetailsSummary.textContent = booking.id + ' • ' + (booking.touristName || 'Unknown tourist');
        const contactDetails = booking.touristContact || 'Contact details unavailable';
        const packageState = booking.packageName || 'Package information unavailable';
        const specialRequests = booking.specialRequests || 'No special requests';

        elements.bookingDetailContent.innerHTML = '' +
            '<div class="detail-item"><span class="detail-label">Booking ID</span><span class="detail-value">' + escapeHtml(booking.id) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Tourist</span><span class="detail-value">' + escapeHtml(booking.touristName || 'Unknown tourist') + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Tourist ID</span><span class="detail-value">' + escapeHtml(booking.touristId || 'Unavailable') + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Tourist Contact</span><span class="detail-value">' + escapeHtml(contactDetails) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Package</span><span class="detail-value">' + escapeHtml(packageState) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Package ID</span><span class="detail-value">' + escapeHtml(booking.packageId || 'Unavailable') + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Booking Date</span><span class="detail-value">' + formatDate(booking.bookingDate) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Travel Date</span><span class="detail-value">' + formatDate(booking.travelDate) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Travelers</span><span class="detail-value">' + escapeHtml(String(booking.numberOfTravelers || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Price Per Person</span><span class="detail-value">' + formatCurrency(Number(booking.pricePerPerson || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Subtotal</span><span class="detail-value">' + formatCurrency(Number(booking.subtotal || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Discount</span><span class="detail-value">' + formatCurrency(Number(booking.discount || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Final Total</span><span class="detail-value">' + formatCurrency(Number(booking.finalTotal || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Amount Paid</span><span class="detail-value">' + formatCurrency(Number(booking.amountPaid || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Balance Due</span><span class="detail-value">' + formatCurrency(Number(booking.balanceDue || 0)) + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Payment Status</span><span class="detail-value">' + escapeHtml(booking.paymentStatus || 'Unpaid') + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">Booking Status</span><span class="detail-value">' + escapeHtml(booking.bookingStatus || 'Pending') + '</span></div>' +
            '<div class="detail-item" style="grid-column: 1 / -1"><span class="detail-label">Special Requests</span><span class="detail-value">' + escapeHtml(specialRequests) + '</span></div>';

        bookingDetailsModal.show();
    }

    function openDeleteConfirm(bookingId) {
        const booking = bookings.find(function (item) { return item.id === bookingId; });
        if (!booking) {
            showToast('The selected booking is no longer available.');
            return;
        }

        pendingDeleteBookingId = bookingId;
        elements.deleteBookingIdText.textContent = booking.id;
        elements.deleteBookingTouristText.textContent = booking.touristName || 'Unknown tourist';
        deleteBookingModal.show();
    }

    function confirmDeleteBooking() {
        if (!pendingDeleteBookingId) {
            return;
        }

        bookings = bookings.filter(function (booking) { return booking.id !== pendingDeleteBookingId; });
        bookingRepository.save(bookings);
        deleteBookingModal.hide();
        pendingDeleteBookingId = null;
        renderAll();
        showToast('Booking deleted successfully.');
    }

    function resetFilters() {
        elements.searchInput.value = '';
        elements.statusFilter.value = '';
        elements.paymentFilter.value = '';
        elements.packageFilter.value = '';
        elements.travelDateFilter.value = '';
        elements.bookingDateFilter.value = '';
        elements.touristFilter.value = '';
        elements.sortSelect.value = 'bookingDateDesc';
        renderBookings();
    }

    function populateLookupOptions() {
        elements.packageFilter.innerHTML = '<option value="">All packages</option>' +
            packageCatalog.map(function (item) {
                return '<option value="' + escapeAttribute(item.id) + '">' + escapeHtml(item.name) + ' (' + escapeHtml(item.id) + ')</option>';
            }).join('');

        elements.packageSelect.innerHTML = '<option value="">Select a package</option>' +
            packageCatalog.map(function (item) {
                return '<option value="' + escapeAttribute(item.id) + '">' + escapeHtml(item.name) + ' — ' + escapeHtml(item.id) + ' • ' + formatCurrency(Number(item.price || 0)) + '</option>';
            }).join('');

        elements.touristFilter.innerHTML = '<option value="">All tourists</option>' +
            touristCatalog.map(function (item) {
                return '<option value="' + escapeAttribute(item.id) + '">' + escapeHtml(item.name) + ' (' + escapeHtml(item.id) + ')</option>';
            }).join('');

        elements.touristSelect.innerHTML = '<option value="">Select a tourist</option>' +
            touristCatalog.map(function (item) {
                return '<option value="' + escapeAttribute(item.id) + '">' + escapeHtml(item.name) + ' — ' + escapeHtml(item.id) + '</option>';
            }).join('');

        if (!packageCatalog.length) {
            elements.packageDataAlert.classList.remove('d-none');
            elements.packageDataAlert.textContent = 'Tour package records are not available yet. Create at least one package before creating a booking.';
        } else {
            elements.packageDataAlert.classList.add('d-none');
        }

        if (!touristCatalog.length) {
            elements.touristDataAlert.classList.remove('d-none');
            elements.touristDataAlert.textContent = 'Tourist records are not available yet. Create tourist profiles before creating a booking.';
        } else {
            elements.touristDataAlert.classList.add('d-none');
        }
    }

    function getSelectedTourist() {
        const selectedId = elements.touristSelect.value;
        return touristCatalog.find(function (item) { return item.id === selectedId; }) || null;
    }

    function getSelectedPackage() {
        const selectedId = elements.packageSelect.value;
        return packageCatalog.find(function (item) { return item.id === selectedId; }) || null;
    }

    function createBookingRepository() {
        return {
            load: function () {
                const stored = safeReadStorage(STORAGE_KEY);
                if (stored === null) {
                    const sampleBookings = createSampleBookings();
                    safeWriteStorage(STORAGE_KEY, sampleBookings);
                    return sampleBookings;
                }

                if (!Array.isArray(stored)) {
                    const corrected = createSampleBookings();
                    safeWriteStorage(STORAGE_KEY, corrected);
                    return corrected;
                }

                const validData = stored.filter(isValidBookingRecord);
                if (validData.length !== stored.length) {
                    const corrected = stored.filter(isValidBookingRecord).length ? stored.filter(isValidBookingRecord) : createSampleBookings();
                    safeWriteStorage(STORAGE_KEY, corrected);
                    return corrected;
                }
                return stored;
            },
            save: function (records) {
                safeWriteStorage(STORAGE_KEY, records);
            }
        };
    }

    function createSampleBookings() {
        const touristSamples = touristCatalog.length ? touristCatalog : [
            { id: 'TUR-1001', name: 'Nethmi Wijesinghe', email: 'nethmi@gmail.com', phone: '+94 77 111 2222' },
            { id: 'TUR-1002', name: 'Sajith Perera', email: 'sajith@gmail.com', phone: '+94 71 233 3344' },
            { id: 'TUR-1003', name: 'Anika Silva', email: 'anika@gmail.com', phone: '+94 76 454 5588' },
            { id: 'TUR-1004', name: 'Harith Fernando', email: 'harith@gmail.com', phone: '+94 77 889 9900' },
            { id: 'TUR-1005', name: 'Madhavi Jayawardena', email: 'madhavi@gmail.com', phone: '+94 71 122 3445' },
            { id: 'TUR-1006', name: 'Lahiru Dissanayake', email: 'lahiru@gmail.com', phone: '+94 76 667 7788' }
        ];

        const packageSamples = packageCatalog.length ? packageCatalog : [
            { id: 'PKG-0001', name: 'Cultural Heritage Tour', price: 35000, maxTravelers: 12, status: 'Active' },
            { id: 'PKG-0002', name: 'Hill Country Escape', price: 48000, maxTravelers: 10, status: 'Active' },
            { id: 'PKG-0003', name: 'Tropical Beach Holiday', price: 32000, maxTravelers: 16, status: 'Active' },
            { id: 'PKG-0004', name: 'Wildlife Safari Adventure', price: 28500, maxTravelers: 8, status: 'Active' },
            { id: 'PKG-0005', name: 'Southern Coast Explorer', price: 42500, maxTravelers: 14, status: 'Active' },
            { id: 'PKG-0006', name: 'Northern Heritage Journey', price: 39000, maxTravelers: 10, status: 'Inactive' }
        ];

        const sampleBookings = [
            buildSampleBooking({
                id: 'BOOK-0001', tourist: touristSamples[0], packageInfo: packageSamples[0], bookingDate: '2026-10-08', travelDate: '2026-10-18', travelers: 2, discount: 0, paymentStatus: 'Paid', bookingStatus: 'Confirmed', amountPaid: 70000, specialRequests: 'Vegetarian meals requested.'
            }),
            buildSampleBooking({
                id: 'BOOK-0002', tourist: touristSamples[1], packageInfo: packageSamples[1], bookingDate: '2026-10-09', travelDate: '2026-10-23', travelers: 2, discount: 2500, paymentStatus: 'Partially Paid', bookingStatus: 'Pending', amountPaid: 38000, specialRequests: 'Need a quieter room.'
            }),
            buildSampleBooking({
                id: 'BOOK-0003', tourist: touristSamples[2], packageInfo: packageSamples[2], bookingDate: '2026-10-12', travelDate: '2026-11-05', travelers: 3, discount: 1000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', amountPaid: 95000, specialRequests: 'Early check-in preferred.'
            }),
            buildSampleBooking({
                id: 'BOOK-0004', tourist: touristSamples[3], packageInfo: packageSamples[3], bookingDate: '2026-10-14', travelDate: '2026-11-10', travelers: 1, discount: 0, paymentStatus: 'Unpaid', bookingStatus: 'Pending', amountPaid: 0, specialRequests: ''
            }),
            buildSampleBooking({
                id: 'BOOK-0005', tourist: touristSamples[4], packageInfo: packageSamples[4], bookingDate: '2026-10-20', travelDate: '2026-11-18', travelers: 4, discount: 3000, paymentStatus: 'Paid', bookingStatus: 'Completed', amountPaid: 150000, specialRequests: 'Family room arrangement.'
            }),
            buildSampleBooking({
                id: 'BOOK-0006', tourist: touristSamples[5], packageInfo: packageSamples[5], bookingDate: '2026-10-27', travelDate: '2026-11-08', travelers: 2, discount: 0, paymentStatus: 'Cancelled', bookingStatus: 'Cancelled', amountPaid: 0, specialRequests: 'Cancelled by customer.'
            })
        ];

        return sampleBookings;
    }

    function buildSampleBooking(config) {
        const travelers = Number(config.travelers || 1);
        const pricePerPerson = Number(config.packageInfo.price || 0);
        const subtotal = travelers * pricePerPerson;
        const discount = Number(config.discount || 0);
        const finalTotal = Math.max(0, subtotal - discount);
        const amountPaid = Number(config.amountPaid || 0);
        const balanceDue = Math.max(0, finalTotal - amountPaid);
        return {
            id: config.id,
            touristId: config.tourist.id,
            touristName: config.tourist.name,
            touristContact: config.tourist.phone || config.tourist.email || '',
            packageId: config.packageInfo.id,
            packageName: config.packageInfo.name,
            bookingDate: config.bookingDate,
            travelDate: config.travelDate,
            numberOfTravelers: travelers,
            pricePerPerson: pricePerPerson,
            subtotal: subtotal,
            discount: discount,
            finalTotal: finalTotal,
            amountPaid: amountPaid,
            balanceDue: balanceDue,
            paymentStatus: config.paymentStatus || 'Unpaid',
            bookingStatus: config.bookingStatus || 'Pending',
            specialRequests: config.specialRequests || '',
            createdAt: new Date().toISOString()
        };
    }

    function getPackageCatalog() {
        const catalogs = PACKAGE_KEYS.map(function (key) {
            return safeReadStorage(key);
        }).filter(function (value) {
            return Array.isArray(value);
        });

        const allPackages = catalogs.flat();
        const validPackages = allPackages.filter(function (item) {
            return !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string';
        });

        if (!validPackages.length) {
            return [];
        }

        const uniquePackages = [];
        validPackages.forEach(function (packageItem) {
            if (!uniquePackages.some(function (entry) { return entry.id === packageItem.id; })) {
                uniquePackages.push({
                    id: packageItem.id,
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
            return !!item && typeof item === 'object' && typeof (item.id || item.touristId || item.touristID) === 'string';
        });

        if (!validTourists.length) {
            return [];
        }

        const uniqueTourists = [];
        validTourists.forEach(function (touristItem) {
            const touristId = touristItem.id || touristItem.touristId || touristItem.touristID;
            if (!uniqueTourists.some(function (entry) { return entry.id === touristId; })) {
                uniqueTourists.push({
                    id: touristId,
                    name: touristItem.name || touristItem.fullName || 'Unnamed Tourist',
                    phone: touristItem.phone || touristItem.contactNumber || touristItem.mobile || '',
                    email: touristItem.email || touristItem.contactEmail || '',
                    contact: touristItem.contact || ''
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
            console.warn('Unable to read localStorage key:', key, error);
            return null;
        }
    }

    function safeWriteStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Unable to write to localStorage key:', key, error);
            return false;
        }
    }

    function generateNextBookingId(existingRecords) {
        const maxId = existingRecords.reduce(function (largest, booking) {
            const match = /^BOOK-(\d+)$/.exec(booking.id || '');
            if (!match) {
                return largest;
            }
            return Math.max(largest, Number(match[1]));
        }, 0);
        return 'BOOK-' + String(maxId + 1).padStart(4, '0');
    }

    function formatCurrency(amount) {
        const parsed = Number(amount || 0);
        return 'LKR ' + parsed.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return '—';
        }
        const parsed = new Date(dateValue + 'T00:00:00');
        if (Number.isNaN(parsed.getTime())) {
            return dateValue;
        }
        return parsed.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function compareDates(firstDate, secondDate) {
        const first = new Date(firstDate || '1970-01-01').getTime();
        const second = new Date(secondDate || '1970-01-01').getTime();
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
        if (!target || !target.classList) {
            return;
        }
        target.classList.remove('is-invalid');
        const feedback = target.parentElement && target.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = '';
        }
    }

    function showToast(message) {
        elements.toastBody.textContent = message;
        toast.show();
    }

    function escapeHtml(value) {
        var safeValue = value !== undefined && value !== null ? value : '';
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
