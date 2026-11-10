/**
 * Ceylon Explore - Tour Package Management
 * Package and itinerary records are persisted through the Spring Boot API.
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const apiBaseUrl = (window.location.protocol === 'file:' ? 'http:' : window.location.protocol) +
        '//' + (window.location.hostname || 'localhost') + ':8080';
    const categories = [
        'Cultural Heritage', 'Beach Holiday', 'Hill Country',
        'Wildlife Adventure', 'Nature and Adventure', 'Family Holiday'
    ];
    const fallbackDestinations = Object.freeze([
        'Sigiriya', 'Ella', 'Galle', 'Nuwara Eliya', 'Trincomalee', 'Yala'
    ]);
    const fallbackImage = 'assets/images/sigiriya.jpg';
    const placeholderImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520"><rect width="900" height="520" fill="#e7f0eb"/><path d="M0 390 240 190l145 125 150-190 365 265v130H0z" fill="#7aa38c"/><circle cx="700" cy="115" r="52" fill="#f1d889"/><text x="450" y="470" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" fill="#1b4332">Ceylon Explore</text></svg>'
    );
    const form = document.getElementById('packageForm');
    const elements = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        packageGrid: document.getElementById('packageGrid'),
        packageSearch: document.getElementById('packageSearch'),
        categoryFilter: document.getElementById('categoryFilter'),
        statusFilter: document.getElementById('statusFilter'),
        destinationFilter: document.getElementById('destinationFilter'),
        minPriceFilter: document.getElementById('minPriceFilter'),
        maxPriceFilter: document.getElementById('maxPriceFilter'),
        minDurationFilter: document.getElementById('minDurationFilter'),
        maxDurationFilter: document.getElementById('maxDurationFilter'),
        featuredFilter: document.getElementById('featuredFilter'),
        sortSelect: document.getElementById('sortSelect'),
        formTitle: document.getElementById('packageFormTitle'),
        packageId: document.getElementById('packageId'),
        toastBody: document.getElementById('packageToastBody'),
        pageStatus: document.getElementById('packagePageStatus'),
        formModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('packageFormModal')),
        detailsModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('packageDetailsModal')),
        deleteModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('deletePackageModal')),
        toast: bootstrap.Toast.getOrCreateInstance(document.getElementById('packageToast'), { delay: 3600 })
    };

    let packages = [];
    let destinations = [];
    let editingPackageId = null;
    let pendingDeleteId = null;
    let detailsPackageId = null;
    let returnFocusElement = null;
    let searchTimer = null;
    let isAdmin = false;

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
        });
    }

    function showToast(message) {
        elements.toastBody.textContent = message;
        elements.toast.show();
    }

    function showPageError(message, actionLabel, actionHref) {
        elements.pageStatus.replaceChildren(document.createTextNode(message));
        if (actionLabel && actionHref) {
            elements.pageStatus.appendChild(document.createTextNode(' '));
            const action = document.createElement('a');
            action.href = actionHref;
            action.textContent = actionLabel;
            action.className = 'alert-link';
            elements.pageStatus.appendChild(action);
        }
        elements.pageStatus.classList.remove('d-none', 'alert-info');
        elements.pageStatus.classList.add('alert-danger');
    }

    async function apiRequest(path, options) {
        const requestOptions = Object.assign({
            credentials: 'include',
            headers: { Accept: 'application/json' }
        }, options || {});
        requestOptions.headers = Object.assign({ Accept: 'application/json' }, requestOptions.headers || {});
        let response;
        try {
            response = await fetch(apiBaseUrl + path, requestOptions);
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('Cannot connect to the backend at ' + apiBaseUrl + '. Start Spring Boot and confirm it is listening on port 8080.');
            }
            throw error;
        }
        let body = null;
        try {
            body = await response.json();
        } catch (error) {
            if (response.status !== 204) throw new Error('The package service returned an unreadable response.');
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

    function mapPackage(record) {
        const days = Number(record.durationDays) || parseInt(record.duration, 10) || 1;
        const nights = record.durationNights == null ? Math.max(0, days - 1) : Number(record.durationNights);
        return Object.assign({}, record, {
            id: String(record.id),
            name: record.name || '',
            destination: record.destination || '',
            description: record.description || '',
            fullDescription: record.fullDescription || '',
            duration: days,
            nights: nights,
            price: Number(record.price) || 0,
            maxTravelers: Number(record.maxTravelers) || 1,
            minTravelers: Number(record.minTravelers) || 1,
            category: record.category || 'Uncategorized',
            difficultyLevel: record.difficultyLevel || '',
            featured: record.featured === true || record.featured === 'Yes' ? 'Yes' : 'No',
            status: String(record.status || 'Inactive').replace(/^./, function (c) { return c.toUpperCase(); }).toLowerCase() === 'active' ? 'Active' : 'Inactive',
            itinerary: Array.isArray(record.itinerary) ? record.itinerary : []
        });
    }

    function queryPath() {
        const params = new URLSearchParams();
        const values = {
            keyword: elements.packageSearch.value.trim(),
            destinationId: elements.destinationFilter.value,
            category: elements.categoryFilter.value,
            status: elements.statusFilter.value,
            minPrice: elements.minPriceFilter.value,
            maxPrice: elements.maxPriceFilter.value,
            minDuration: elements.minDurationFilter.value,
            maxDuration: elements.maxDurationFilter.value
        };
        Object.keys(values).forEach(function (key) {
            if (values[key]) params.set(key, values[key]);
        });
        return '/api/packages' + (params.toString() ? '?' + params.toString() : '');
    }

    async function loadPackages() {
        const result = await apiRequest(queryPath());
        if (!Array.isArray(result)) throw new Error('The package service returned an invalid package list.');
        packages = result.map(mapPackage);
        renderAll();
    }

    async function loadDestinations() {
        const result = await apiRequest('/api/destinations');
        if (!Array.isArray(result)) throw new Error('The destination service returned an invalid destination list.');
        destinations = result;
        const destinationSelect = form.elements.destinationId;
        const currentValue = elements.destinationFilter.value;
        const options = destinations.map(function (destination) {
            return '<option value="' + escapeHtml(destination.id) + '">' +
                escapeHtml(destination.name + ' — ' + destination.district + ', ' + destination.province) + '</option>';
        }).join('');
        destinationSelect.innerHTML = '<option value="">Select a destination</option>' + options;
        if (!destinations.length) {
            destinationSelect.innerHTML = '<option value="">Select a destination</option>' +
                fallbackDestinations.map(function (destination) {
                    return '<option value="legacy:' + escapeHtml(destination) + '">' +
                        escapeHtml(destination) + '</option>';
                }).join('');
        }
        document.getElementById('destinationFallbackHint').classList.toggle('d-none', destinations.length !== 0);
        elements.destinationFilter.innerHTML = '<option value="">All destinations</option>' +
            destinations.map(function (destination) {
                return '<option value="' + escapeHtml(destination.id) + '">' + escapeHtml(destination.name) + '</option>';
            }).join('');
        if (destinations.some(function (item) { return String(item.id) === currentValue; })) {
            elements.destinationFilter.value = currentValue;
        }
    }

    async function checkAdministrator() {
        const response = await apiRequest('/api/auth/me');
        const user = response && response.user;
        if (!user || user.role !== 'ADMIN') throw new Error('Administrator access is required to manage packages.');
        isAdmin = true;
        document.getElementById('adminProfileName').textContent = user.fullName || 'Administrator';
    }

    function bindEvents() {
        [
            document.getElementById('packageFormModal'),
            document.getElementById('packageDetailsModal'),
            document.getElementById('deletePackageModal')
        ].forEach(function (modalElement) {
            modalElement.addEventListener('hide.bs.modal', function () {
                if (modalElement.contains(document.activeElement)) {
                    const focusTarget = returnFocusElement && returnFocusElement.isConnected
                        ? returnFocusElement : document.getElementById('addPackageButton');
                    document.activeElement.blur();
                    modalElement.addEventListener('hidden.bs.modal', function () { focusTarget.focus(); }, { once: true });
                }
            });
        });

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
        document.getElementById('notificationButton').addEventListener('click', function () {
            showToast('Notifications are interface placeholders for the admin dashboard.');
        });
        document.getElementById('addPackageButton').addEventListener('click', openCreateModal);
        form.addEventListener('submit', handleFormSubmit);
        elements.packageGrid.addEventListener('click', handlePackageAction);
        document.getElementById('confirmDeletePackageButton').addEventListener('click', confirmDeletePackage);
        document.getElementById('editFromDetailsButton').addEventListener('click', function () {
            const id = detailsPackageId;
            document.getElementById('packageDetailsModal').addEventListener('hidden.bs.modal', function () {
                if (id) openEditModal(id);
            }, { once: true });
            elements.detailsModal.hide();
        });
        [elements.packageSearch, elements.categoryFilter, elements.statusFilter, elements.destinationFilter,
            elements.minPriceFilter, elements.maxPriceFilter, elements.minDurationFilter, elements.maxDurationFilter]
            .forEach(function (control) {
                control.addEventListener(control === elements.packageSearch ? 'input' : 'change', debounceLoad);
            });
        elements.featuredFilter.addEventListener('change', renderPackages);
        elements.sortSelect.addEventListener('change', renderPackages);
        document.getElementById('resetFiltersButton').addEventListener('click', resetFilters);
        document.getElementById('emptyResetButton').addEventListener('click', resetFilters);
        form.querySelectorAll('input, textarea, select').forEach(function (control) {
            control.addEventListener('input', clearFieldError);
            control.addEventListener('change', clearFieldError);
        });
    }

    function debounceLoad() {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(function () {
            loadPackages().catch(function (error) { showToast(error.message); });
        }, 200);
    }

    function renderAll() {
        renderStatistics();
        renderPackages();
    }

    function renderStatistics() {
        const averagePrice = packages.length
            ? packages.reduce(function (total, item) { return total + item.price; }, 0) / packages.length : 0;
        document.getElementById('totalPackagesStat').textContent = String(packages.length);
        document.getElementById('activePackagesStat').textContent = String(packages.filter(function (item) { return item.status === 'Active'; }).length);
        document.getElementById('featuredPackagesStat').textContent = String(packages.filter(function (item) { return item.featured === 'Yes'; }).length);
        document.getElementById('averagePackagePriceStat').textContent = formatPrice(averagePrice);
    }

    function renderPackages() {
        const visiblePackages = getFilteredPackages();
        elements.packageGrid.innerHTML = visiblePackages.map(createPackageCard).join('');
        elements.packageGrid.classList.toggle('d-none', visiblePackages.length === 0);
        document.getElementById('packageEmptyState').classList.toggle('d-none', visiblePackages.length !== 0);
        document.getElementById('packageResultsSummary').textContent =
            'Showing ' + visiblePackages.length + ' matching packages';
        attachImageFallbacks(elements.packageGrid);
    }

    function getFilteredPackages() {
        const featured = elements.featuredFilter.value;
        const result = packages.filter(function (item) {
            return !featured || item.featured === (featured === 'yes' ? 'Yes' : 'No');
        });
        if (elements.sortSelect.value === 'priceAsc') result.sort(function (a, b) { return a.price - b.price; });
        else if (elements.sortSelect.value === 'priceDesc') result.sort(function (a, b) { return b.price - a.price; });
        else if (elements.sortSelect.value === 'durationAsc') result.sort(function (a, b) { return a.duration - b.duration; });
        return result;
    }

    function createPackageCard(item) {
        const statusClass = item.status === 'Active' ? 'active' : 'inactive';
        const featuredBadge = item.featured === 'Yes'
            ? '<span class="badge rounded-pill package-featured-badge"><i class="bi bi-star-fill me-1"></i>Featured</span>' : '';
        const adminActions = isAdmin
            ? '<button class="btn btn-outline-primary btn-sm rounded-circle edit-action" type="button" data-action="edit" data-id="' + escapeHtml(item.id) + '" aria-label="Edit ' + escapeHtml(item.name) + '" title="Edit package"><i class="bi bi-pencil-square"></i></button>' +
              '<button class="btn btn-outline-danger btn-sm rounded-circle delete-action" type="button" data-action="delete" data-id="' + escapeHtml(item.id) + '" aria-label="Delete ' + escapeHtml(item.name) + '" title="Delete package"><i class="bi bi-trash3"></i></button>'
            : '';
        return '<article class="package-card"><div class="package-card-image-wrap">' +
            '<img class="package-card-image" src="' + escapeHtml(getImageUrl(item.imageUrl)) + '" alt="' + escapeHtml(item.name) + '" loading="lazy">' +
            '<div class="package-card-badges">' + featuredBadge + '<span class="badge rounded-pill package-status-badge ' + statusClass + '">' + escapeHtml(item.status) + '</span></div></div>' +
            '<div class="package-card-content"><span class="package-card-category">' + escapeHtml(item.category) + '</span>' +
            '<h3 class="package-card-title">' + escapeHtml(item.name) + '</h3>' +
            '<div class="package-card-destination"><i class="bi bi-geo-alt-fill me-1"></i>' + escapeHtml(item.destination) + '</div>' +
            '<p class="package-card-description">' + escapeHtml(item.description) + '</p>' +
            '<div class="package-card-meta"><span><i class="bi bi-clock"></i>' + escapeHtml(item.duration) + ' days / ' + escapeHtml(item.nights) +
            ' nights</span><span><i class="bi bi-people"></i>' + escapeHtml(item.minTravelers) + '–' + escapeHtml(item.maxTravelers) + ' travelers</span></div>' +
            '<div class="package-card-price">' + formatPrice(item.price) + ' <span>/ person</span></div>' +
            '<div class="package-card-actions"><button class="btn btn-outline-emerald btn-sm rounded-pill fw-semibold btn-view-package" type="button" data-action="details" data-id="' +
            escapeHtml(item.id) + '">View Details</button>' + adminActions + '</div></div></article>';
    }

    function handlePackageAction(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const id = button.dataset.id;
        returnFocusElement = button;
        if (button.dataset.action === 'details') openDetailsModal(id);
        else if (button.dataset.action === 'edit') openEditModal(id);
        else if (button.dataset.action === 'delete') openDeleteModal(id);
    }

    function openCreateModal() {
        if (!isAdmin) return showToast('Administrator access is required.');
        returnFocusElement = document.getElementById('addPackageButton');
        editingPackageId = null;
        form.reset();
        clearAllFieldErrors();
        elements.formTitle.textContent = 'Add New Package';
        document.getElementById('savePackageLabel').textContent = 'Save Package';
        elements.packageId.value = 'Assigned after saving';
        form.elements.minTravelers.value = '1';
        form.elements.status.value = 'Active';
        elements.formModal.show();
        window.setTimeout(function () { document.getElementById('packageName').focus(); }, 250);
    }

    async function openEditModal(id) {
        if (!isAdmin) return showToast('Administrator access is required.');
        const item = packages.find(function (record) { return record.id === id; });
        if (!item) return showToast('The selected package could not be found.');
        try {
            const saved = mapPackage(await apiRequest('/api/packages/' + encodeURIComponent(id)));
            editingPackageId = saved.id;
            form.reset();
            clearAllFieldErrors();
            elements.formTitle.textContent = 'Edit Tour Package';
            document.getElementById('savePackageLabel').textContent = 'Save Changes';
            elements.packageId.value = saved.id;
            form.elements.name.value = saved.name;
            form.elements.destinationId.value = saved.destinationId == null ? '' : String(saved.destinationId);
            if (!form.elements.destinationId.value) {
                const legacyOption = document.createElement('option');
                legacyOption.value = 'legacy:' + saved.destination;
                legacyOption.textContent = saved.destination + ' (legacy destination)';
                form.elements.destinationId.appendChild(legacyOption);
                form.elements.destinationId.value = legacyOption.value;
            }
            form.elements.description.value = saved.description;
            form.elements.fullDescription.value = saved.fullDescription;
            form.elements.duration.value = String(saved.duration);
            form.elements.nights.value = String(saved.nights);
            form.elements.price.value = String(saved.price);
            form.elements.maxTravelers.value = String(saved.maxTravelers);
            form.elements.minTravelers.value = String(saved.minTravelers);
            form.elements.category.value = saved.category;
            form.elements.difficultyLevel.value = saved.difficultyLevel;
            form.elements.status.value = saved.status;
            form.elements.accommodation.value = saved.accommodation || 'No';
            form.elements.meals.value = saved.meals || 'No';
            form.elements.transportation.value = saved.transportation || 'No';
            form.elements.featured.value = saved.featured;
            form.elements.imageUrl.value = saved.imageUrl || '';
            form.elements.inclusions.value = saved.inclusions || '';
            form.elements.exclusions.value = saved.exclusions || '';
            form.elements.startDate.value = saved.startDate || '';
            form.elements.endDate.value = saved.endDate || '';
            form.elements.itineraryText.value = saved.itinerary.map(function (entry) {
                return entry.title + (entry.description ? ' | ' + entry.description : '');
            }).join('\n');
            elements.formModal.show();
            window.setTimeout(function () { document.getElementById('packageName').focus(); }, 250);
        } catch (error) {
            showToast(error.message);
        }
    }

    function validateForm() {
        const errors = {};
        const fields = ['name', 'destinationId', 'description'];
        fields.forEach(function (name) {
            const field = form.elements.namedItem(name);
            if (!field.value.trim()) errors[name] = 'This field is required.';
        });
        const days = Number(form.elements.duration.value);
        const nights = Number(form.elements.nights.value);
        const price = Number(form.elements.price.value);
        const minTravelers = Number(form.elements.minTravelers.value);
        const maxTravelers = Number(form.elements.maxTravelers.value);
        if (!Number.isInteger(days) || days < 1) errors.duration = 'Enter a positive whole number of days.';
        if (!Number.isInteger(nights) || nights < 0) errors.nights = 'Enter zero or more whole nights.';
        if (!Number.isFinite(price) || price < 0) errors.price = 'Enter a valid non-negative price.';
        if (!Number.isInteger(minTravelers) || minTravelers < 1) errors.minTravelers = 'Minimum travelers must be at least one.';
        if (!Number.isInteger(maxTravelers) || maxTravelers < 1) errors.maxTravelers = 'Maximum travelers must be at least one.';
        if (minTravelers > maxTravelers) errors.minTravelers = 'Minimum travelers cannot exceed maximum travelers.';
        if (!categories.includes(form.elements.category.value)) errors.category = 'Select a package category.';
        if (form.elements.startDate.value && form.elements.endDate.value &&
            form.elements.startDate.value > form.elements.endDate.value) {
            errors.endDate = 'End date cannot be before start date.';
        }
        const itineraryLines = form.elements.itineraryText.value.split(/\r?\n/).filter(function (line) { return line.trim(); });
        if (itineraryLines.length > days) errors.itineraryText = 'Itinerary cannot contain more days than the package duration.';
        if (form.elements.imageUrl.value && !form.elements.imageUrl.checkValidity()) {
            errors.imageUrl = 'Enter a valid image URL, or leave this field empty.';
        }
        return errors;
    }

    function parseItinerary() {
        return form.elements.itineraryText.value.split(/\r?\n/).map(function (line, index) {
            const value = line.trim();
            if (!value) return null;
            const separator = value.indexOf('|');
            const title = separator >= 0 ? value.slice(0, separator).trim() : value;
            const description = separator >= 0 ? value.slice(separator + 1).trim() : '';
            return { dayNumber: index + 1, title: title, description: description };
        }).filter(Boolean);
    }

    function readFormData() {
        const destinationValue = form.elements.destinationId.value;
        const destination = destinations.find(function (item) { return String(item.id) === destinationValue; });
        const durationDays = Number(form.elements.duration.value);
        const durationNights = Number(form.elements.nights.value);
        return {
            name: form.elements.name.value.trim(),
            destinationId: destination ? Number(destination.id) : null,
            destination: destination ? destination.name : destinationValue.replace(/^legacy:/, ''),
            description: form.elements.description.value.trim(),
            fullDescription: form.elements.fullDescription.value.trim(),
            duration: durationDays + ' days / ' + durationNights + ' nights',
            durationDays: durationDays,
            durationNights: durationNights,
            price: Number(form.elements.price.value),
            minTravelers: Number(form.elements.minTravelers.value),
            maxTravelers: Number(form.elements.maxTravelers.value),
            category: form.elements.category.value,
            difficultyLevel: form.elements.difficultyLevel.value,
            inclusions: form.elements.inclusions.value.trim(),
            exclusions: form.elements.exclusions.value.trim(),
            startDate: form.elements.startDate.value || null,
            endDate: form.elements.endDate.value || null,
            status: form.elements.status.value,
            featured: form.elements.featured.value === 'Yes',
            accommodation: form.elements.accommodation.value,
            meals: form.elements.meals.value,
            transportation: form.elements.transportation.value,
            imageUrl: form.elements.imageUrl.value.trim(),
            itinerary: parseItinerary()
        };
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        clearAllFieldErrors();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length) {
            Object.keys(validationErrors).forEach(function (name) {
                const field = form.elements.namedItem(name);
                field.classList.add('is-invalid');
                const feedback = field.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) feedback.textContent = validationErrors[name];
            });
            const firstInvalid = form.querySelector('.is-invalid');
            if (firstInvalid) firstInvalid.focus();
            showToast('Please correct the highlighted package fields.');
            return;
        }
        const saveButton = document.getElementById('savePackageButton');
        saveButton.disabled = true;
        try {
            const token = await csrfToken();
            const method = editingPackageId ? 'PUT' : 'POST';
            const path = editingPackageId ? '/api/packages/' + encodeURIComponent(editingPackageId) : '/api/packages';
            const saved = await apiRequest(path, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify(readFormData())
            });
            elements.formModal.hide();
            await loadPackages();
            showToast((saved.name || 'Tour package') + (editingPackageId ? ' updated successfully.' : ' added successfully.'));
        } catch (error) {
            showToast(error.message);
        } finally {
            saveButton.disabled = false;
        }
    }

    async function openDetailsModal(id) {
        try {
            const item = mapPackage(await apiRequest('/api/packages/' + encodeURIComponent(id)));
            detailsPackageId = item.id;
            const detailsImage = document.getElementById('detailsImage');
            detailsImage.src = getImageUrl(item.imageUrl);
            detailsImage.alt = item.name;
            document.getElementById('packageDetailsTitle').textContent = item.name;
            document.getElementById('detailsCategory').textContent = item.category;
            document.getElementById('detailsDestination').textContent = item.destination;
            document.getElementById('detailsId').textContent = 'ID ' + item.id;
            document.getElementById('detailsDescription').textContent = item.fullDescription || item.description;
            document.getElementById('detailsDuration').textContent = item.duration + ' days';
            document.getElementById('detailsNights').textContent = item.nights + (item.nights === 1 ? ' night' : ' nights');
            document.getElementById('detailsPrice').textContent = formatPrice(item.price);
            document.getElementById('detailsCapacity').textContent = 'Up to ' + item.maxTravelers + ' travelers';
            document.getElementById('detailsDifficulty').textContent = item.difficultyLevel || 'Not specified';
            document.getElementById('detailsGroupSize').textContent = item.minTravelers + '–' + item.maxTravelers + ' travelers';
            document.getElementById('detailsAvailability').textContent = [item.startDate, item.endDate].filter(Boolean).join(' – ') || 'Open availability';
            const serviceDetails = [
                ['Accommodation', item.accommodation],
                ['Meals', item.meals],
                ['Transportation', item.transportation]
            ];
            document.getElementById('detailsServices').innerHTML = serviceDetails.map(function (service) {
                const included = service[1] === 'Yes';
                return '<span class="included-service' + (included ? '' : ' not-included') + '"><i class="bi ' +
                    (included ? 'bi-check-circle-fill' : 'bi-dash-circle') + ' me-1"></i>' + escapeHtml(service[0]) +
                    ': ' + (included ? 'Included' : 'Not included') + '</span>';
            }).join('');
            document.getElementById('detailsInclusions').textContent = item.inclusions || 'Not specified';
            document.getElementById('detailsExclusions').textContent = item.exclusions || 'Not specified';
            document.getElementById('detailsItinerary').innerHTML = item.itinerary.length
                ? '<ol>' + item.itinerary.map(function (entry) {
                    return '<li><strong>Day ' + escapeHtml(entry.dayNumber) + ': ' + escapeHtml(entry.title) + '</strong>' +
                        (entry.description ? ' — ' + escapeHtml(entry.description) : '') +
                        (entry.accommodation ? '<div>Accommodation: ' + escapeHtml(entry.accommodation) + '</div>' : '') +
                        (entry.meals ? '<div>Meals: ' + escapeHtml(entry.meals) + '</div>' : '') + '</li>';
                }).join('') + '</ol>' : '<p>No itinerary information provided.</p>';
            const status = document.getElementById('detailsStatus');
            status.textContent = item.status;
            status.className = 'status-badge ' + (item.status === 'Active' ? 'confirmed' : 'inactive');
            document.getElementById('editFromDetailsButton').classList.toggle('d-none', !isAdmin);
            attachImageFallbacks(document.getElementById('packageDetailsModal'));
            elements.detailsModal.show();
        } catch (error) {
            showToast(error.message);
        }
    }

    function openDeleteModal(id) {
        if (!isAdmin) return showToast('Administrator access is required.');
        const item = packages.find(function (record) { return record.id === id; });
        if (!item) return showToast('The selected package could not be found.');
        pendingDeleteId = item.id;
        document.getElementById('deletePackageName').textContent = item.name;
        document.getElementById('deletePackageId').textContent = item.id;
        elements.deleteModal.show();
    }

    async function confirmDeletePackage() {
        if (!pendingDeleteId) return;
        const button = document.getElementById('confirmDeletePackageButton');
        button.disabled = true;
        try {
            const token = await csrfToken();
            await apiRequest('/api/packages/' + encodeURIComponent(pendingDeleteId), {
                method: 'DELETE', headers: { 'X-CSRF-TOKEN': token }
            });
            pendingDeleteId = null;
            elements.deleteModal.hide();
            await loadPackages();
            showToast('Tour package deleted successfully.');
        } catch (error) {
            showToast(error.message);
        } finally {
            button.disabled = false;
        }
    }

    function resetFilters() {
        elements.packageSearch.value = '';
        elements.categoryFilter.value = '';
        elements.statusFilter.value = '';
        elements.destinationFilter.value = '';
        elements.minPriceFilter.value = '';
        elements.maxPriceFilter.value = '';
        elements.minDurationFilter.value = '';
        elements.maxDurationFilter.value = '';
        elements.featuredFilter.value = '';
        elements.sortSelect.value = 'default';
        loadPackages().catch(function (error) { showToast(error.message); });
    }

    function clearFieldError(event) {
        const field = event.currentTarget;
        field.classList.remove('is-invalid');
        const feedback = field.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) feedback.textContent = '';
    }

    function clearAllFieldErrors() {
        form.querySelectorAll('.is-invalid').forEach(function (field) { field.classList.remove('is-invalid'); });
        form.querySelectorAll('.invalid-feedback').forEach(function (feedback) { feedback.textContent = ''; });
    }

    function getImageUrl(imageUrl) {
        if (!imageUrl) return fallbackImage;
        try {
            const parsed = new URL(imageUrl, document.baseURI);
            return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : fallbackImage;
        } catch (error) {
            return fallbackImage;
        }
    }

    function attachImageFallbacks(container) {
        container.querySelectorAll('img').forEach(function (image) {
            image.addEventListener('error', function handleImageError() {
                image.removeEventListener('error', handleImageError);
                if (image.src !== new URL(fallbackImage, document.baseURI).href) {
                    image.src = fallbackImage;
                    image.addEventListener('error', function usePlaceholder() {
                        image.removeEventListener('error', usePlaceholder);
                        image.src = placeholderImage;
                    }, { once: true });
                } else {
                    image.src = placeholderImage;
                }
            }, { once: true });
        });
    }

    function formatPrice(value) {
        return 'LKR ' + Number(value).toLocaleString('en-LK', { maximumFractionDigits: 2 });
    }

    function closeSidebar() {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-visible');
        elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    async function initialize() {
        bindEvents();
        try {
            await checkAdministrator();
            await loadDestinations();
            await loadPackages();
            elements.pageStatus.classList.add('d-none');
        } catch (error) {
            if (error.status === 401) {
                showPageError('Your administrator session is missing or expired. Sign in to manage tour packages.', 'Sign in', 'admin-login.html');
            } else if (error.status === 403) {
                showPageError('This account does not have administrator access. Sign in with an administrator account.', 'Sign in', 'admin-login.html');
            } else if (error.status === 404) {
                showPageError('The package API was not found. Restart the backend so it loads the latest package-management routes.');
            } else {
                showPageError(error.message || 'Unable to load tour packages. Check that the backend is running, then reload this page.');
            }
            document.getElementById('addPackageButton').disabled = true;
        }
    }

    initialize();
});
