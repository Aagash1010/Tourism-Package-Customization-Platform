/**
 * Ceylon Explore - Hotel and Room Management
 * Hotel and room records are stored by the Spring Boot API.
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const apiBaseUrl = (window.location.protocol === 'file:' ? 'http:' : window.location.protocol) +
        '//' + (window.location.hostname || 'localhost') + ':8080';
    const pageSize = 5;
    const fallbackImage = 'assets/images/hero-bg.jpg';
    const elements = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        pageStatus: document.getElementById('hotelPageStatus'),
        search: document.getElementById('hotelSearch'),
        cityFilter: document.getElementById('cityFilter'),
        countryFilter: document.getElementById('countryFilter'),
        typeFilter: document.getElementById('typeFilter'),
        ratingFilter: document.getElementById('ratingFilter'),
        statusFilter: document.getElementById('statusFilter'),
        featuredFilter: document.getElementById('featuredFilter'),
        sortFilter: document.getElementById('sortFilter'),
        tableBody: document.getElementById('hotelTableBody'),
        hotelCount: document.getElementById('hotelCount'),
        pagination: document.getElementById('hotelPagination'),
        paginationSummary: document.getElementById('paginationSummary'),
        form: document.getElementById('hotelForm'),
        formError: document.getElementById('hotelFormError'),
        roomForm: document.getElementById('roomForm'),
        roomFormError: document.getElementById('roomFormError'),
        formModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('hotelFormModal')),
        deleteModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteHotelModal')),
        detailsModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('hotelDetailsModal')),
        roomFormModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('roomFormModal')),
        toast: bootstrap.Toast.getOrCreateInstance(document.getElementById('hotelToast'), { delay: 3600 }),
        toastBody: document.getElementById('hotelToastBody')
    };

    let hotels = [];
    let allHotels = [];
    let currentPage = 1;
    let editingHotelId = null;
    let deletingHotelId = null;
    let currentDetailsHotel = null;
    let editingRoomId = null;
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

    function setPageStatus(message, kind) {
        elements.pageStatus.className = 'alert border-0 rounded-3 small alert-' + (kind || 'info');
        elements.pageStatus.textContent = message;
    }

    async function apiRequest(path, options) {
        const requestOptions = Object.assign({
            credentials: 'include',
            headers: { Accept: 'application/json' }
        }, options || {});
        requestOptions.headers = Object.assign({ Accept: 'application/json' }, requestOptions.headers || {});
        const response = await fetch(apiBaseUrl + path, requestOptions);
        let body = null;
        try {
            body = await response.json();
        } catch (error) {
            if (response.status !== 204) throw new Error('The hotel service returned an unreadable response.');
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
        const body = await apiRequest('/api/auth/csrf');
        if (!body || !body.csrfToken) {
            throw new Error('Unable to initialize a secure request. Refresh the page and try again.');
        }
        return body.csrfToken;
    }

    async function requireAdministrator() {
        const response = await apiRequest('/api/auth/me');
        const user = response && response.user;
        if (!user || user.role !== 'ADMIN') {
            throw new Error('Administrator access is required to manage hotels and rooms.');
        }
        document.getElementById('adminProfileName').textContent = user.fullName || 'Administrator';
    }

    function hotelQueryPath() {
        const params = new URLSearchParams();
        const values = {
            keyword: elements.search.value.trim(),
            city: elements.cityFilter.value,
            country: elements.countryFilter.value,
            hotelType: elements.typeFilter.value,
            starRating: elements.ratingFilter.value,
            status: elements.statusFilter.value
        };
        Object.keys(values).forEach(function (key) {
            if (values[key]) params.set(key, values[key]);
        });
        return '/api/hotels' + (params.toString() ? '?' + params.toString() : '');
    }

    function uniqueSorted(values) {
        return Array.from(new Set(values.filter(Boolean))).sort(function (left, right) {
            return left.localeCompare(right);
        });
    }

    function fillFilter(select, values, placeholder, selectedValue) {
        select.innerHTML = '<option value="">' + escapeHtml(placeholder) + '</option>' + values.map(function (value) {
            return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
        }).join('');
        if (values.includes(selectedValue)) select.value = selectedValue;
    }

    function refreshFilterOptions() {
        const selectedCity = elements.cityFilter.value;
        const selectedCountry = elements.countryFilter.value;
        fillFilter(elements.cityFilter, uniqueSorted(allHotels.map(function (hotel) { return hotel.city; })), 'All cities', selectedCity);
        fillFilter(elements.countryFilter, uniqueSorted(allHotels.map(function (hotel) { return hotel.country; })), 'All countries', selectedCountry);
    }

    function formatCurrency(value) {
        const amount = Number(value);
        return 'LKR ' + (Number.isFinite(amount) ? amount.toLocaleString('en-LK', { maximumFractionDigits: 2 }) : '0');
    }

    function safeImageUrl(value) {
        if (!value) return fallbackImage;
        try {
            const url = new URL(value, window.location.href);
            return url.protocol === 'http:' || url.protocol === 'https:' ? value : fallbackImage;
        } catch (error) {
            return fallbackImage;
        }
    }

    function renderStatistics() {
        const activeCount = allHotels.filter(function (hotel) { return hotel.status === 'ACTIVE'; }).length;
        const ratingTotal = allHotels.reduce(function (total, hotel) { return total + (Number(hotel.starRating) || 0); }, 0);
        document.getElementById('totalHotels').textContent = String(allHotels.length);
        document.getElementById('activeHotels').textContent = String(activeCount);
        document.getElementById('inactiveHotels').textContent = String(allHotels.length - activeCount);
        document.getElementById('averageRating').textContent = allHotels.length ? (ratingTotal / allHotels.length).toFixed(1) : '0.0';
    }

    function statusBadge(status) {
        const active = status === 'ACTIVE' || status === 'AVAILABLE';
        const label = status === 'MAINTENANCE' ? 'Maintenance' : (status || 'INACTIVE').toLowerCase();
        return '<span class="badge rounded-pill ' + (active ? 'hotel-status-active' : 'hotel-status-inactive') + '">' +
            escapeHtml(label.charAt(0).toUpperCase() + label.slice(1)) + '</span>';
    }

    function visibleHotels() {
        const visible = hotels.filter(function (hotel) {
            return !elements.featuredFilter.checked || hotel.featured === true;
        });
        visible.sort(function (left, right) {
            if (elements.sortFilter.value === 'rating') return Number(right.starRating) - Number(left.starRating);
            if (elements.sortFilter.value === 'city') return left.city.localeCompare(right.city) || left.hotelName.localeCompare(right.hotelName);
            return left.hotelName.localeCompare(right.hotelName);
        });
        return visible;
    }

    function renderRow(hotel) {
        const name = escapeHtml(hotel.hotelName);
        return '<tr>' +
            '<td class="text-nowrap">' + escapeHtml(hotel.id) + '</td>' +
            '<td><img class="hotel-thumbnail" src="' + escapeHtml(safeImageUrl(hotel.imageUrl)) + '" alt="' + name + '" loading="lazy"></td>' +
            '<td class="hotel-name-cell">' + name + (hotel.featured ? '<span class="badge text-bg-warning-subtle ms-1">Featured</span>' : '') + '</td>' +
            '<td class="hotel-location">' + escapeHtml(hotel.city) + '<span class="d-block text-muted small">' + escapeHtml(hotel.country) + '</span></td>' +
            '<td>' + escapeHtml(String(hotel.hotelType || '').replace('_', ' ')) + '</td>' +
            '<td class="hotel-rating"><i class="bi bi-star-fill"></i> ' + escapeHtml(hotel.starRating) + '</td>' +
            '<td>' + escapeHtml(hotel.roomsCount) + '</td>' +
            '<td class="text-nowrap">' + escapeHtml(hotel.phone) + '</td>' +
            '<td>' + statusBadge(hotel.status) + '</td>' +
            '<td><div class="hotel-actions">' +
            '<button class="btn btn-outline-secondary" type="button" data-action="view" data-id="' + escapeHtml(hotel.id) + '" aria-label="View ' + name + '" title="View"><i class="bi bi-eye"></i></button>' +
            '<button class="btn btn-outline-success" type="button" data-action="edit" data-id="' + escapeHtml(hotel.id) + '" aria-label="Edit ' + name + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
            '<button class="btn btn-outline-danger" type="button" data-action="delete" data-id="' + escapeHtml(hotel.id) + '" aria-label="Delete ' + name + '" title="Delete"><i class="bi bi-trash3"></i></button>' +
            '</div></td></tr>';
    }

    function renderPagination(total) {
        const pageCount = Math.ceil(total / pageSize);
        currentPage = Math.min(Math.max(currentPage, 1), Math.max(pageCount, 1));
        const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, total);
        elements.paginationSummary.textContent = total ? 'Showing ' + start + '-' + end + ' of ' + total + ' hotels' : 'No hotels to display';
        if (pageCount <= 1) {
            elements.pagination.innerHTML = '';
            return;
        }
        let html = '<li class="page-item ' + (currentPage === 1 ? 'disabled' : '') + '"><button class="page-link" type="button" data-page="' + (currentPage - 1) + '" aria-label="Previous page">&laquo;</button></li>';
        for (let page = 1; page <= pageCount; page += 1) {
            html += '<li class="page-item ' + (page === currentPage ? 'active' : '') + '"><button class="page-link" type="button" data-page="' + page + '">' + page + '</button></li>';
        }
        html += '<li class="page-item ' + (currentPage === pageCount ? 'disabled' : '') + '"><button class="page-link" type="button" data-page="' + (currentPage + 1) + '" aria-label="Next page">&raquo;</button></li>';
        elements.pagination.innerHTML = html;
    }

    function renderHotels() {
        const records = visibleHotels();
        const pageCount = Math.ceil(records.length / pageSize);
        currentPage = Math.min(Math.max(currentPage, 1), Math.max(pageCount, 1));
        elements.hotelCount.textContent = records.length + (records.length === 1 ? ' hotel' : ' hotels');
        if (!records.length) {
            elements.tableBody.innerHTML = '<tr><td class="hotel-empty-cell" colspan="10"><i class="bi bi-building"></i><strong>No hotels found</strong><p class="text-muted mb-3">Try adjusting your search or filters, or add a hotel.</p><button class="btn btn-emerald btn-sm" type="button" data-action="add">Add New Hotel</button></td></tr>';
            renderPagination(0);
            return;
        }
        const start = (currentPage - 1) * pageSize;
        elements.tableBody.innerHTML = records.slice(start, start + pageSize).map(renderRow).join('');
        elements.tableBody.querySelectorAll('.hotel-thumbnail').forEach(function (image) {
            image.addEventListener('error', function () { image.src = fallbackImage; }, { once: true });
        });
        renderPagination(records.length);
    }

    async function refreshHotels(resetPage, reloadAll) {
        if (resetPage) currentPage = 1;
        const results = await apiRequest(hotelQueryPath());
        if (!Array.isArray(results)) throw new Error('The hotel service returned an invalid hotel list.');
        hotels = results;
        if (reloadAll) {
            allHotels = await apiRequest('/api/hotels');
            refreshFilterOptions();
            renderStatistics();
        }
        renderHotels();
    }

    function setFormHotel(hotel) {
        editingHotelId = hotel ? hotel.id : null;
        elements.form.reset();
        elements.form.classList.remove('was-validated');
        elements.formError.classList.add('d-none');
        elements.formError.textContent = '';
        document.getElementById('hotelFormTitle').textContent = hotel ? 'Edit Hotel' : 'Add New Hotel';
        document.getElementById('saveHotelLabel').textContent = hotel ? 'Save Changes' : 'Save Hotel';
        document.getElementById('hotelId').value = hotel ? hotel.id : 'Assigned after saving';
        if (hotel) {
            document.getElementById('hotelName').value = hotel.hotelName || '';
            document.getElementById('hotelDescription').value = hotel.description || '';
            document.getElementById('hotelAddress').value = hotel.address || '';
            document.getElementById('hotelCity').value = hotel.city || '';
            document.getElementById('hotelDistrict').value = hotel.district || '';
            document.getElementById('hotelProvince').value = hotel.province || '';
            document.getElementById('hotelCountry').value = hotel.country || '';
            document.getElementById('hotelContact').value = hotel.phone || '';
            document.getElementById('hotelEmail').value = hotel.email || '';
            document.getElementById('hotelWebsite').value = hotel.website || '';
            document.getElementById('hotelRating').value = String(hotel.starRating || '');
            document.getElementById('hotelType').value = hotel.hotelType || '';
            document.getElementById('hotelCheckIn').value = hotel.checkInTime || '';
            document.getElementById('hotelCheckOut').value = hotel.checkOutTime || '';
            document.getElementById('hotelImage').value = hotel.imageUrl || '';
            document.getElementById('hotelFeatured').value = String(hotel.featured === true);
            document.getElementById('hotelStatus').value = hotel.status || 'ACTIVE';
            document.querySelectorAll('#facilityOptions input').forEach(function (checkbox) {
                checkbox.checked = (hotel.facilities || []).includes(checkbox.value);
            });
        }
        elements.formModal.show();
    }

    function hotelPayload() {
        return {
            hotelName: document.getElementById('hotelName').value.trim(),
            description: document.getElementById('hotelDescription').value.trim(),
            address: document.getElementById('hotelAddress').value.trim(),
            city: document.getElementById('hotelCity').value.trim(),
            district: document.getElementById('hotelDistrict').value.trim(),
            province: document.getElementById('hotelProvince').value,
            country: document.getElementById('hotelCountry').value.trim(),
            phone: document.getElementById('hotelContact').value.trim(),
            email: document.getElementById('hotelEmail').value.trim(),
            website: document.getElementById('hotelWebsite').value.trim(),
            starRating: Number(document.getElementById('hotelRating').value),
            hotelType: document.getElementById('hotelType').value,
            checkInTime: document.getElementById('hotelCheckIn').value || null,
            checkOutTime: document.getElementById('hotelCheckOut').value || null,
            facilities: Array.from(document.querySelectorAll('#facilityOptions input:checked')).map(function (checkbox) { return checkbox.value; }),
            imageUrl: document.getElementById('hotelImage').value.trim() || null,
            featured: document.getElementById('hotelFeatured').value === 'true',
            status: document.getElementById('hotelStatus').value
        };
    }

    async function submitHotel(event) {
        event.preventDefault();
        elements.form.classList.add('was-validated');
        if (!elements.form.checkValidity()) return;
        const button = elements.form.querySelector('[type="submit"]');
        button.disabled = true;
        try {
            const token = await csrfToken();
            const method = editingHotelId ? 'PUT' : 'POST';
            const path = editingHotelId ? '/api/hotels/' + editingHotelId : '/api/hotels';
            const result = await apiRequest(path, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify(hotelPayload())
            });
            elements.formModal.hide();
            await refreshHotels(true, true);
            showToast((result.hotelName || 'Hotel') + (editingHotelId ? ' was updated.' : ' was added.'));
        } catch (error) {
            elements.formError.textContent = error.message;
            elements.formError.classList.remove('d-none');
        } finally {
            button.disabled = false;
        }
    }

    function detailItem(label, value) {
        return '<div class="hotel-detail-item"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || 'Not provided') + '</strong></div>';
    }

    function roomRow(room) {
        return '<tr><td>' + escapeHtml(room.roomNumber) + '</td><td>' + escapeHtml(String(room.roomType).replace('_', ' ')) +
            '</td><td>' + escapeHtml(room.capacity) + '</td><td>' + escapeHtml(room.availableRooms) + '</td><td>' +
            escapeHtml(formatCurrency(room.pricePerNight)) + '</td><td>' + statusBadge(room.status) + '</td><td>' +
            '<button class="btn btn-sm btn-outline-success me-1" data-room-action="edit" data-id="' + escapeHtml(room.id) + '" type="button" aria-label="Edit room"><i class="bi bi-pencil"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger" data-room-action="delete" data-id="' + escapeHtml(room.id) + '" type="button" aria-label="Delete room"><i class="bi bi-trash3"></i></button></td></tr>';
    }

    async function showDetails(hotel) {
        currentDetailsHotel = hotel;
        const facilities = (hotel.facilities || []).join(', ') || 'None listed';
        const content = document.getElementById('hotelDetailsContent');
        content.innerHTML = '<div class="hotel-details-content">' +
            '<div class="d-flex justify-content-between align-items-start"><div><p class="text-muted small mb-1">Hotel #' + escapeHtml(hotel.id) +
            '</p><h2 class="h3 fw-bold" id="hotelDetailsTitle">' + escapeHtml(hotel.hotelName) + '</h2></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>' +
            '<p class="hotel-details-description">' + escapeHtml(hotel.description || '') + '</p><div class="hotel-details-grid">' +
            detailItem('Address', [hotel.address, hotel.city, hotel.district, hotel.province, hotel.country].filter(Boolean).join(', ')) +
            detailItem('Contact', hotel.phone) + detailItem('Email', hotel.email) + detailItem('Website', hotel.website) +
            detailItem('Rating', hotel.starRating + ' out of 5') + detailItem('Type', String(hotel.hotelType || '').replace('_', ' ')) +
            detailItem('Check-in', hotel.checkInTime) + detailItem('Check-out', hotel.checkOutTime) +
            detailItem('Facilities', facilities) + detailItem('Status', hotel.status) +
            '</div><div class="d-flex justify-content-between align-items-center mt-4"><h3 class="h5 fw-bold mb-0">Rooms</h3>' +
            '<button type="button" class="btn btn-emerald btn-sm" data-room-action="add"><i class="bi bi-plus-lg me-1"></i>Add Room</button></div>' +
            '<div class="table-responsive mt-2"><table class="table table-sm align-middle"><thead><tr><th>Number</th><th>Type</th><th>Capacity</th><th>Available</th><th>Price / night</th><th>Status</th><th>Actions</th></tr></thead>' +
            '<tbody id="hotelRoomsBody"><tr><td colspan="7">Loading rooms…</td></tr></tbody></table></div></div>';
        elements.detailsModal.show();
        try {
            const rooms = await apiRequest('/api/rooms?hotelId=' + encodeURIComponent(hotel.id));
            const body = document.getElementById('hotelRoomsBody');
            if (body) body.innerHTML = rooms.length ? rooms.map(roomRow).join('') :
                '<tr><td colspan="7" class="text-muted">No rooms registered for this hotel.</td></tr>';
        } catch (error) {
            const body = document.getElementById('hotelRoomsBody');
            if (body) body.innerHTML = '<tr><td colspan="7" class="text-danger">' + escapeHtml(error.message) + '</td></tr>';
        }
    }

    function setRoomForm(room) {
        editingRoomId = room ? room.id : null;
        elements.roomForm.reset();
        elements.roomForm.classList.remove('was-validated');
        elements.roomFormError.classList.add('d-none');
        elements.roomFormError.textContent = '';
        document.getElementById('roomFormTitle').textContent = room ? 'Edit Room' : 'Add Room';
        document.getElementById('roomNumber').value = room ? room.roomNumber : '';
        document.getElementById('roomType').value = room ? room.roomType : '';
        document.getElementById('roomCapacity').value = room ? room.capacity : '';
        document.getElementById('roomPrice').value = room ? room.pricePerNight : '';
        document.getElementById('roomAvailable').value = room ? room.availableRooms : '';
        document.getElementById('roomDescription').value = room ? room.description || '' : '';
        document.getElementById('roomStatus').value = room ? room.status : 'AVAILABLE';
        const detailsElement = document.getElementById('hotelDetailsModal');
        detailsElement.addEventListener('hidden.bs.modal', function () {
            elements.roomFormModal.show();
        }, { once: true });
        elements.detailsModal.hide();
    }

    async function submitRoom(event) {
        event.preventDefault();
        elements.roomForm.classList.add('was-validated');
        if (!elements.roomForm.checkValidity()) return;
        const button = elements.roomForm.querySelector('[type="submit"]');
        button.disabled = true;
        const payload = {
            roomNumber: document.getElementById('roomNumber').value.trim(),
            roomType: document.getElementById('roomType').value,
            capacity: Number(document.getElementById('roomCapacity').value),
            pricePerNight: Number(document.getElementById('roomPrice').value),
            availableRooms: Number(document.getElementById('roomAvailable').value),
            description: document.getElementById('roomDescription').value.trim(),
            status: document.getElementById('roomStatus').value
        };
        try {
            const token = await csrfToken();
            const method = editingRoomId ? 'PUT' : 'POST';
            const path = editingRoomId ? '/api/rooms/' + editingRoomId : '/api/rooms/hotel/' + currentDetailsHotel.id;
            await apiRequest(path, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify(payload)
            });
            await refreshHotels(false, true);
            showToast('Room was ' + (editingRoomId ? 'updated.' : 'added.'));
            document.getElementById('roomFormModal').addEventListener('hidden.bs.modal', function () {
                showDetails(currentDetailsHotel);
            }, { once: true });
            elements.roomFormModal.hide();
        } catch (error) {
            elements.roomFormError.textContent = error.message;
            elements.roomFormError.classList.remove('d-none');
        } finally {
            button.disabled = false;
        }
    }

    async function deleteRoom(id) {
        if (!window.confirm('Delete this room?')) return;
        try {
            const token = await csrfToken();
            await apiRequest('/api/rooms/' + id, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': token } });
            await refreshHotels(false, true);
            showToast('Room was deleted.');
            await showDetails(currentDetailsHotel);
        } catch (error) {
            showToast(error.message);
        }
    }

    async function deleteHotel() {
        if (!deletingHotelId) return;
        const hotel = allHotels.find(function (record) { return record.id === deletingHotelId; });
        try {
            const token = await csrfToken();
            await apiRequest('/api/hotels/' + deletingHotelId, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': token } });
            elements.deleteModal.hide();
            deletingHotelId = null;
            await refreshHotels(true, true);
            showToast((hotel ? hotel.hotelName : 'Hotel') + ' was deleted.');
        } catch (error) {
            showToast(error.message);
        }
    }

    function startDelete(id) {
        const hotel = allHotels.find(function (record) { return record.id === id; });
        if (!hotel) return showToast('This hotel could not be found. Refresh the page and try again.');
        deletingHotelId = id;
        document.getElementById('deleteHotelName').textContent = hotel.hotelName;
        document.getElementById('deleteHotelId').textContent = hotel.id;
        elements.deleteModal.show();
    }

    function closeSidebar() {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-visible');
        elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    function debounceSearch() {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(function () {
            refreshHotels(true, false).catch(function (error) { showToast(error.message); });
        }, 250);
    }

    elements.sidebarToggle.addEventListener('click', function () {
        const isOpen = elements.sidebar.classList.toggle('is-open');
        elements.sidebarBackdrop.classList.toggle('is-visible', isOpen);
        elements.sidebarToggle.setAttribute('aria-expanded', String(isOpen));
    });
    elements.sidebarBackdrop.addEventListener('click', closeSidebar);
    document.getElementById('addHotelButton').addEventListener('click', function () { setFormHotel(null); });
    document.getElementById('resetFiltersButton').addEventListener('click', function () {
        [elements.search, elements.cityFilter, elements.countryFilter, elements.typeFilter,
            elements.ratingFilter, elements.statusFilter].forEach(function (control) {
            control.value = '';
        });
        elements.featuredFilter.checked = false;
        elements.sortFilter.value = 'name';
        refreshHotels(true, false).catch(function (error) { showToast(error.message); });
    });
    elements.search.addEventListener('input', debounceSearch);
    [elements.cityFilter, elements.countryFilter, elements.typeFilter, elements.ratingFilter, elements.statusFilter].forEach(function (control) {
        control.addEventListener('change', function () {
            refreshHotels(true, false).catch(function (error) { showToast(error.message); });
        });
    });
    [elements.featuredFilter, elements.sortFilter].forEach(function (control) {
        control.addEventListener('change', function () { currentPage = 1; renderHotels(); });
    });
    elements.form.addEventListener('submit', submitHotel);
    elements.roomForm.addEventListener('submit', submitRoom);
    elements.tableBody.addEventListener('click', function (event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        if (button.dataset.action === 'add') return setFormHotel(null);
        const hotel = hotels.find(function (record) { return String(record.id) === button.dataset.id; });
        if (!hotel) return showToast('This hotel could not be found. Refresh the page and try again.');
        if (button.dataset.action === 'view') showDetails(hotel);
        if (button.dataset.action === 'edit') setFormHotel(hotel);
        if (button.dataset.action === 'delete') startDelete(hotel.id);
    });
    document.getElementById('hotelDetailsContent').addEventListener('click', function (event) {
        const button = event.target.closest('[data-room-action]');
        if (!button) return;
        const action = button.dataset.roomAction;
        if (action === 'add') return setRoomForm(null);
        const roomId = button.dataset.id;
        const row = button.closest('tr');
        if (!row) return;
        if (action === 'edit') {
            const cells = row.querySelectorAll('td');
            const room = {
                id: roomId,
                roomNumber: cells[0].textContent,
                roomType: cells[1].textContent.trim().toUpperCase().replace(' ', '_'),
                capacity: Number(cells[2].textContent),
                availableRooms: Number(cells[3].textContent),
                pricePerNight: cells[4].textContent.replace(/[^\d.]/g, ''),
                status: cells[5].textContent.trim().toUpperCase()
            };
            apiRequest('/api/rooms/' + roomId).then(function (record) { setRoomForm(record); })
                .catch(function (error) { showToast(error.message); });
        } else if (action === 'delete') {
            deleteRoom(roomId);
        }
    });
    elements.pagination.addEventListener('click', function (event) {
        const button = event.target.closest('[data-page]');
        if (!button || button.parentElement.classList.contains('disabled')) return;
        currentPage = Number(button.dataset.page);
        renderHotels();
    });
    document.getElementById('confirmDeleteButton').addEventListener('click', deleteHotel);
    document.getElementById('deleteHotelModal').addEventListener('hidden.bs.modal', function () { deletingHotelId = null; });

    async function initialize() {
        try {
            await requireAdministrator();
            await refreshHotels(true, true);
            elements.pageStatus.classList.add('d-none');
        } catch (error) {
            setPageStatus(error.message + ' Sign in with an administrator account and reload this page.', 'danger');
            document.getElementById('addHotelButton').disabled = true;
        }
    }

    initialize();
});
