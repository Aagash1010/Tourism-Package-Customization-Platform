/**
 * Ceylon Explore - Destination Management
 * Destination records are loaded from and persisted by the Spring Boot API.
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const API_BASE_URL = (window.location.protocol === 'file:' ? 'http:' : window.location.protocol) +
        '//' + (window.location.hostname || 'localhost') + ':8080';
    const FALLBACK_IMAGE = 'assets/images/hero-bg.jpg';
    const provinces = ['Central', 'Eastern', 'North Central', 'Northern', 'North Western', 'Sabaragamuwa', 'Southern', 'Uva', 'Western'];
    const categories = ['Historical and Cultural', 'Beach', 'Wildlife', 'Nature and Adventure', 'Hill Country', 'Religious'];

    const elements = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        grid: document.getElementById('destinationGrid'),
        search: document.getElementById('destinationSearch'),
        district: document.getElementById('districtFilter'),
        province: document.getElementById('provinceFilter'),
        category: document.getElementById('categoryFilter'),
        status: document.getElementById('statusFilter'),
        featured: document.getElementById('featuredFilter'),
        sort: document.getElementById('sortFilter'),
        count: document.getElementById('destinationCount'),
        total: document.getElementById('totalDestinations'),
        popular: document.getElementById('popularDestinations'),
        districtsCovered: document.getElementById('districtsCovered'),
        averageFee: document.getElementById('averageEntryFee'),
        form: document.getElementById('destinationForm'),
        addButton: document.getElementById('addDestinationButton'),
        pageStatus: document.getElementById('destinationPageStatus'),
        profileAvatar: document.querySelector('.profile-avatar'),
        profileName: document.querySelector('.profile-name'),
        profileRole: document.querySelector('.profile-role'),
        formModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('destinationFormModal')),
        deleteModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteDestinationModal')),
        detailsModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('destinationDetailsModal')),
        toast: bootstrap.Toast.getOrCreateInstance(document.getElementById('destinationToast'), { delay: 3600 }),
        toastBody: document.getElementById('destinationToastBody'),
        formError: document.getElementById('destinationFormError')
    };

    function showToast(message) {
        elements.toastBody.textContent = message;
        elements.toast.show();
    }

    async function apiRequest(path, options) {
        const response = await fetch(API_BASE_URL + path, Object.assign({
            credentials: 'include'
        }, options || {}));
        let body = null;
        try {
            body = await response.json();
        } catch (error) {
            if (response.status !== 204) {
                throw new Error('The destination service returned an unreadable response.');
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

    async function mutateDestination(method, id, destination) {
        const csrf = await apiRequest('/api/auth/csrf');
        const body = destination ? {
            name: destination.name,
            district: destination.district,
            province: destination.province,
            category: destination.category,
            shortDescription: destination.shortDescription,
            fullDescription: destination.fullDescription,
            entryFee: destination.entryFee,
            bestTime: destination.bestTime,
            duration: destination.duration,
            openingHours: destination.openingHours,
            address: destination.address,
            latitude: destination.latitude,
            longitude: destination.longitude,
            featured: destination.featured,
            status: destination.status,
            imageUrl: destination.image || null
        } : undefined;
        return apiRequest('/api/destinations' + (id ? '/' + encodeURIComponent(id) : ''), {
            method: method,
            headers: Object.assign(
                { 'X-CSRF-TOKEN': csrf.csrfToken },
                body ? { 'Content-Type': 'application/json' } : {}
            ),
            body: body ? JSON.stringify(body) : undefined
        });
    }

    const DestinationStore = {
        records: [],

        getAll: function () {
            return this.records.slice();
        },

        load: async function () {
            const records = await apiRequest('/api/destinations');
            if (!Array.isArray(records)) {
                throw new Error('The destination service returned an invalid record list.');
            }
            this.records = records.map(function (record) {
                return Object.assign({}, record, {
                    id: String(record.id),
                    image: record.imageUrl || ''
                });
            });
        },

        getById: async function (id) {
            const record = await apiRequest('/api/destinations/' + encodeURIComponent(id));
            return Object.assign({}, record, { id: String(record.id), image: record.imageUrl || '' });
        },

        create: async function (destination) {
            return mutateDestination('POST', null, destination);
        },

        update: async function (id, destination) {
            return mutateDestination('PUT', id, destination);
        },

        remove: async function (id) {
            return mutateDestination('DELETE', id);
        }
    };

    let isAdmin = false;
    let editingId = null;
    let deletingId = null;

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[character];
        });
    }

    function safeImageUrl(value) {
        if (!value) {
            return FALLBACK_IMAGE;
        }
        const trimmedValue = value.trim();
        if (!/^[a-z][a-z\d+.-]*:/i.test(trimmedValue)) {
            return trimmedValue.indexOf('//') === 0 ? 'https:' + trimmedValue : trimmedValue;
        }
        try {
            const url = new URL(trimmedValue, window.location.href);
            return url.protocol === 'http:' || url.protocol === 'https:' ? trimmedValue : FALLBACK_IMAGE;
        } catch (error) {
            return FALLBACK_IMAGE;
        }
    }

    function isAllowedImageUrl(value) {
        if (!value) {
            return true;
        }
        const trimmedValue = value.trim();
        if (!/^[a-z][a-z\d+.-]*:/i.test(trimmedValue)) {
            return true;
        }
        try {
            const url = new URL(trimmedValue, window.location.href);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }

    function formatCurrency(value) {
        const amount = Number(value);
        return 'LKR ' + (Number.isFinite(amount) ? amount.toLocaleString('en-LK', { maximumFractionDigits: 2 }) : '0');
    }

    function refreshFilterOptions() {
        const selected = {
            district: elements.district.value,
            province: elements.province.value,
            category: elements.category.value
        };
        const destinations = DestinationStore.getAll();
        fillFilter(elements.district, uniqueSorted(destinations.map(function (destination) { return destination.district; })), 'All districts', selected.district);
        fillFilter(elements.province, uniqueSorted(provinces.concat(destinations.map(function (destination) { return destination.province; }))), 'All provinces', selected.province);
        fillFilter(elements.category, uniqueSorted(categories.concat(destinations.map(function (destination) { return destination.category; }))), 'All categories', selected.category);
    }

    function uniqueSorted(values) {
        return Array.from(new Set(values.filter(Boolean))).sort(function (left, right) {
            return left.localeCompare(right);
        });
    }

    function fillFilter(select, values, placeholder, selectedValue) {
        select.innerHTML = '<option value="">' + escapeHtml(placeholder) + '</option>' +
            values.map(function (value) {
                return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
            }).join('');
        if (values.includes(selectedValue)) {
            select.value = selectedValue;
        }
    }

    function getVisibleDestinations() {
        const query = elements.search.value.trim().toLocaleLowerCase();
        const selectedDistrict = elements.district.value;
        const selectedProvince = elements.province.value;
        const selectedCategory = elements.category.value;
        const selectedStatus = elements.status.value;
        const featuredOnly = elements.featured.checked;
        const sortBy = elements.sort.value;

        const filtered = DestinationStore.getAll().filter(function (destination) {
            const searchable = [
                destination.name, destination.district, destination.province, destination.address,
                destination.shortDescription, destination.fullDescription
            ].join(' ').toLocaleLowerCase();
            return (!query || searchable.includes(query)) &&
                (!selectedDistrict || destination.district === selectedDistrict) &&
                (!selectedProvince || destination.province === selectedProvince) &&
                (!selectedCategory || destination.category === selectedCategory) &&
                (!selectedStatus || destination.status === selectedStatus) &&
                (!featuredOnly || destination.featured === true);
        });

        filtered.sort(function (left, right) {
            if (sortBy === 'fee-asc') {
                return Number(left.entryFee || 0) - Number(right.entryFee || 0);
            }
            if (sortBy === 'fee-desc') {
                return Number(right.entryFee || 0) - Number(left.entryFee || 0);
            }
            return left.name.localeCompare(right.name);
        });
        return filtered;
    }

    function renderStatistics() {
        const destinations = DestinationStore.getAll();
        const districts = new Set(destinations.map(function (destination) { return destination.district; }).filter(Boolean));
        const totalFee = destinations.reduce(function (total, destination) {
            return total + (Number(destination.entryFee) || 0);
        }, 0);
        const average = destinations.length ? Math.round(totalFee / destinations.length) : 0;

        elements.total.textContent = String(destinations.length);
        elements.popular.textContent = String(destinations.filter(function (destination) { return destination.featured === true; }).length);
        elements.districtsCovered.textContent = String(districts.size);
        elements.averageFee.textContent = formatCurrency(average);
    }

    function renderCard(destination) {
        const statusClass = destination.status === 'Active' ? 'active' : 'inactive';
        const featuredBadge = destination.featured ? '<span class="destination-badge featured-badge"><i class="bi bi-star-fill"></i> Featured</span>' : '';
        const duration = destination.duration || 'Not specified';
        return '<article class="destination-card">' +
            '<div class="destination-image-wrap">' +
                '<img class="destination-image" src="' + escapeHtml(safeImageUrl(destination.image)) + '" alt="' + escapeHtml(destination.name) + '" loading="lazy">' +
                '<span class="destination-image-overlay" aria-hidden="true"></span>' +
                '<div class="destination-image-badges">' + featuredBadge +
                    '<span class="destination-badge category-badge">' + escapeHtml(destination.category) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="destination-card-body">' +
                '<div class="destination-card-title-row"><h3 class="destination-card-title">' + escapeHtml(destination.name) + '</h3>' +
                    '<span class="destination-status ' + statusClass + '">' + escapeHtml(destination.status || 'Inactive') + '</span></div>' +
                '<p class="destination-location"><i class="bi bi-geo-alt-fill"></i>' + escapeHtml(destination.district) + ' District, ' + escapeHtml(destination.province) + ' Province</p>' +
                '<p class="destination-description">' + escapeHtml(destination.shortDescription) + '</p>' +
                '<div class="destination-meta">' +
                    '<div class="destination-meta-item"><i class="bi bi-cash me-1"></i>Entry fee<strong>' + escapeHtml(formatCurrency(destination.entryFee)) + '</strong></div>' +
                    '<div class="destination-meta-item"><i class="bi bi-sun me-1"></i>Best time<strong>' + escapeHtml(destination.bestTime || 'Not specified') + '</strong></div>' +
                '</div>' +
            '</div>' +
            (isAdmin ? '<div class="destination-card-actions">' +
                '<button class="btn btn-outline-secondary btn-view" type="button" data-action="view" data-id="' + escapeHtml(destination.id) + '"><i class="bi bi-eye me-1"></i>View Details</button>' +
                '<button class="btn btn-outline-success btn-icon" type="button" data-action="edit" data-id="' + escapeHtml(destination.id) + '" aria-label="Edit ' + escapeHtml(destination.name) + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-outline-danger btn-icon" type="button" data-action="delete" data-id="' + escapeHtml(destination.id) + '" aria-label="Delete ' + escapeHtml(destination.name) + '" title="Delete"><i class="bi bi-trash3"></i></button>' +
            '</div>' : '<div class="destination-card-actions"><button class="btn btn-outline-secondary btn-view" type="button" data-action="view" data-id="' + escapeHtml(destination.id) + '"><i class="bi bi-eye me-1"></i>View Details</button></div>') +
        '</article>';
    }

    function renderDestinations() {
        const destinations = getVisibleDestinations();
        elements.count.textContent = destinations.length + (destinations.length === 1 ? ' destination' : ' destinations');
        if (destinations.length === 0) {
            elements.grid.innerHTML = '<div class="destination-empty">' +
                '<span class="destination-empty-icon"><i class="bi bi-geo-alt"></i></span>' +
                '<h3 class="h5 fw-bold">No destinations found</h3>' +
                '<p class="text-muted mb-3">Try adjusting your search or filters.' + (isAdmin ? ' You can also add a destination.' : '') + '</p>' +
                (isAdmin ? '<button class="btn btn-emerald" type="button" data-action="add">Add New Destination</button>' : '') +
                '</div>';
            return;
        }
        elements.grid.innerHTML = destinations.map(renderCard).join('');
        elements.grid.querySelectorAll('.destination-image').forEach(function (image) {
            image.addEventListener('error', function () {
                if (image.getAttribute('src') !== FALLBACK_IMAGE) {
                    image.src = FALLBACK_IMAGE;
                }
            }, { once: true });
        });
    }

    function refreshPage() {
        refreshFilterOptions();
        renderStatistics();
        renderDestinations();
        elements.addButton.classList.toggle('d-none', !isAdmin);
    }

    function closeSidebar() {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-visible');
        elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    function showForm(destination) {
        if (!isAdmin) {
            showToast('Sign in with an administrator account to manage destinations.');
            return;
        }
        editingId = destination ? destination.id : null;
        elements.form.reset();
        elements.form.classList.remove('was-validated');
        elements.formError.classList.add('d-none');
        elements.formError.textContent = '';
        document.getElementById('destinationFormTitle').textContent = destination ? 'Edit Destination' : 'Add New Destination';
        document.getElementById('saveDestinationLabel').textContent = destination ? 'Save Changes' : 'Save Destination';
        document.getElementById('destinationId').value = destination ? destination.id : 'Assigned when saved';

        if (destination) {
            document.getElementById('destinationName').value = destination.name || '';
            document.getElementById('destinationDistrict').value = destination.district || '';
            document.getElementById('destinationProvince').value = destination.province || '';
            document.getElementById('destinationCategory').value = destination.category || '';
            document.getElementById('destinationFee').value = Number(destination.entryFee) || 0;
            document.getElementById('destinationShortDescription').value = destination.shortDescription || '';
            document.getElementById('destinationFullDescription').value = destination.fullDescription || '';
            document.getElementById('destinationBestTime').value = destination.bestTime || '';
            document.getElementById('destinationDuration').value = destination.duration || '';
            document.getElementById('destinationHours').value = destination.openingHours || '';
            document.getElementById('destinationAddress').value = destination.address || '';
            document.getElementById('destinationLatitude').value = destination.latitude == null ? '' : destination.latitude;
            document.getElementById('destinationLongitude').value = destination.longitude == null ? '' : destination.longitude;
            document.getElementById('destinationFeatured').value = String(destination.featured === true);
            document.getElementById('destinationStatus').value = destination.status || 'Active';
            document.getElementById('destinationImage').value = destination.image || destination.imageUrl || '';
        } else {
            document.getElementById('destinationStatus').value = 'Active';
            document.getElementById('destinationFeatured').value = 'false';
            document.getElementById('destinationFee').value = '0';
        }
        elements.formModal.show();
    }

    function readDestinationForm() {
        return {
            name: document.getElementById('destinationName').value.trim(),
            district: document.getElementById('destinationDistrict').value.trim(),
            province: document.getElementById('destinationProvince').value,
            category: document.getElementById('destinationCategory').value,
            shortDescription: document.getElementById('destinationShortDescription').value.trim(),
            fullDescription: document.getElementById('destinationFullDescription').value.trim(),
            entryFee: Number(document.getElementById('destinationFee').value),
            bestTime: document.getElementById('destinationBestTime').value.trim(),
            duration: document.getElementById('destinationDuration').value.trim(),
            openingHours: document.getElementById('destinationHours').value.trim(),
            address: document.getElementById('destinationAddress').value.trim(),
            latitude: document.getElementById('destinationLatitude').value === '' ? null : Number(document.getElementById('destinationLatitude').value),
            longitude: document.getElementById('destinationLongitude').value === '' ? null : Number(document.getElementById('destinationLongitude').value),
            featured: document.getElementById('destinationFeatured').value === 'true',
            status: document.getElementById('destinationStatus').value,
            image: document.getElementById('destinationImage').value.trim()
        };
    }

    function validateCoordinates(destination) {
        const latitude = document.getElementById('destinationLatitude');
        const longitude = document.getElementById('destinationLongitude');
        const validLatitude = destination.latitude === null || (Number.isFinite(destination.latitude) && destination.latitude >= -90 && destination.latitude <= 90);
        const validLongitude = destination.longitude === null || (Number.isFinite(destination.longitude) && destination.longitude >= -180 && destination.longitude <= 180);
        latitude.setCustomValidity(validLatitude ? '' : 'Latitude must be between -90 and 90.');
        longitude.setCustomValidity(validLongitude ? '' : 'Longitude must be between -180 and 180.');
        return validLatitude && validLongitude;
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const destination = readDestinationForm();
        const coordinatesValid = validateCoordinates(destination);
        const imageInput = document.getElementById('destinationImage');
        imageInput.setCustomValidity(isAllowedImageUrl(destination.image) ? '' : 'Enter an HTTP, HTTPS, or relative image URL.');
        elements.form.classList.add('was-validated');
        if (!elements.form.checkValidity() || !coordinatesValid || !Number.isFinite(destination.entryFee) || destination.entryFee < 0) {
            if (destination.entryFee < 0) {
                document.getElementById('destinationFee').setCustomValidity('Entry fee must be zero or more.');
            } else {
                document.getElementById('destinationFee').setCustomValidity('');
            }
            elements.form.reportValidity();
            return;
        }

        const saveButton = elements.form.querySelector('button[type="submit"]');
        saveButton.disabled = true;
        try {
            if (editingId) {
                await DestinationStore.update(editingId, destination);
                elements.formModal.hide();
                await refreshAfterMutation(destination.name + ' was updated successfully.');
            } else {
                await DestinationStore.create(destination);
                elements.formModal.hide();
                await refreshAfterMutation(destination.name + ' was added successfully.');
            }
        } catch (error) {
            elements.formError.textContent = error.message;
            elements.formError.classList.remove('d-none');
        } finally {
            saveButton.disabled = false;
        }
    }

    async function showDetails(id) {
        try {
            const destination = await DestinationStore.getById(id);
            const statusClass = destination.status === 'Active' ? 'active' : 'inactive';
            const coordinates = destination.latitude == null || destination.longitude == null ?
                'Not provided' : destination.latitude + ', ' + destination.longitude;
            const detailsContent = document.getElementById('destinationDetailsContent');
            detailsContent.innerHTML =
                '<div class="position-relative">' +
                    '<img class="destination-details-image" src="' + escapeHtml(safeImageUrl(destination.image)) + '" alt="' + escapeHtml(destination.name) + '">' +
                    '<button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3 bg-dark bg-opacity-50 p-2" data-bs-dismiss="modal" aria-label="Close"></button>' +
                '</div>' +
                '<div class="destination-details-content">' +
                    '<div class="d-flex flex-wrap align-items-center gap-2 mb-2">' +
                        '<span class="destination-badge category-badge">' + escapeHtml(destination.category) + '</span>' +
                        (destination.featured ? '<span class="destination-badge featured-badge"><i class="bi bi-star-fill"></i> Featured</span>' : '') +
                        '<span class="destination-status ' + statusClass + '">' + escapeHtml(destination.status || 'Inactive') + '</span>' +
                    '</div>' +
                    '<p class="text-muted small mb-1">' + escapeHtml(destination.id) + '</p>' +
                    '<h2 class="h3 fw-bold" id="destinationDetailsTitle">' + escapeHtml(destination.name) + '</h2>' +
                    '<p class="details-location"><i class="bi bi-geo-alt-fill me-1"></i>' + escapeHtml(destination.district) + ' District, ' + escapeHtml(destination.province) + ' Province</p>' +
                    '<h3 class="h6 fw-bold mt-4">About this destination</h3>' +
                    '<p class="details-description mb-2">' + escapeHtml(destination.shortDescription) + '</p>' +
                    '<p class="details-description mb-0">' + escapeHtml(destination.fullDescription || 'No additional description provided.') + '</p>' +
                    '<div class="details-grid">' +
                        detailItem('Entry fee', formatCurrency(destination.entryFee)) +
                        detailItem('Best time to visit', destination.bestTime || 'Not specified') +
                        detailItem('Recommended duration', destination.duration || 'Not specified') +
                        detailItem('Opening hours', destination.openingHours || 'Not specified') +
                        detailItem('Address or location', destination.address || 'Not provided') +
                        detailItem('Coordinates', coordinates) +
                        detailItem('Featured destination', destination.featured ? 'Yes' : 'No') +
                        detailItem('Destination status', destination.status || 'Inactive') +
                        detailItem('Created', destination.createdAt || 'Not available') +
                        detailItem('Last updated', destination.updatedAt || destination.createdAt || 'Not available') +
                    '</div>' +
                    '<div class="text-end mt-4"><button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button></div>' +
                '</div>';
            const detailsImage = detailsContent.querySelector('.destination-details-image');
            detailsImage.addEventListener('error', function () {
                if (detailsImage.getAttribute('src') !== FALLBACK_IMAGE) {
                    detailsImage.src = FALLBACK_IMAGE;
                }
            }, { once: true });
            elements.detailsModal.show();
        } catch (error) {
            showToast(error.message);
        }
    }

    function detailItem(label, value) {
        return '<div class="details-item"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
    }

    function startDelete(id) {
        if (!isAdmin) {
            showToast('Sign in with an administrator account to manage destinations.');
            return;
        }
        const destination = DestinationStore.getAll().find(function (record) { return record.id === id; });
        if (!destination) {
            showToast('This destination could not be found.');
            return;
        }
        deletingId = id;
        document.getElementById('deleteDestinationName').textContent = destination.name;
        document.getElementById('deleteDestinationId').textContent = destination.id;
        elements.deleteModal.show();
    }

    async function confirmDelete() {
        if (!deletingId) {
            return;
        }
        const destination = DestinationStore.getAll().find(function (record) { return record.id === deletingId; });
        const deleteButton = document.getElementById('confirmDeleteButton');
        deleteButton.disabled = true;
        try {
            await DestinationStore.remove(deletingId);
            elements.deleteModal.hide();
            deletingId = null;
            await refreshAfterMutation((destination ? destination.name : 'Destination') + ' was deleted.');
        } catch (error) {
            showToast(error.message);
        } finally {
            deleteButton.disabled = false;
        }
    }

    async function refreshAfterMutation(successMessage) {
        try {
            await DestinationStore.load();
            refreshPage();
            showToast(successMessage);
        } catch (error) {
            elements.pageStatus.classList.remove('d-none', 'alert-info');
            elements.pageStatus.classList.add('alert-danger');
            elements.pageStatus.textContent = 'The change was saved, but the destination list could not be refreshed. ' + error.message;
            showToast(successMessage + ' Refresh the page to reload the latest records.');
        }
    }

    async function initializePage() {
        elements.pageStatus.textContent = 'Loading destinations from the backend...';
        elements.pageStatus.classList.remove('d-none', 'alert-danger');
        elements.pageStatus.classList.add('alert-info');

        try {
            const account = await apiRequest('/api/auth/me');
            const user = account && account.user;
            isAdmin = Boolean(user && user.role === 'ADMIN');
            if (user && elements.profileName) {
                elements.profileName.textContent = user.fullName || user.name || 'Administrator';
            }
            if (user && elements.profileAvatar) {
                elements.profileAvatar.textContent = (user.fullName || user.name || 'A').charAt(0).toUpperCase();
            }
            if (user && elements.profileRole) {
                elements.profileRole.textContent = user.role === 'ADMIN' ? 'Administrator' : 'Signed in';
            }
        } catch (error) {
            if (error.status !== 401) {
                showToast(error.message);
            }
            isAdmin = false;
        }

        try {
            await DestinationStore.load();
            refreshPage();
            if (isAdmin) {
                elements.pageStatus.classList.add('d-none');
            } else {
                elements.pageStatus.textContent = 'Sign in as an administrator to add, edit, or delete destinations.';
            }
        } catch (error) {
            elements.pageStatus.classList.remove('alert-info');
            elements.pageStatus.classList.add('alert-danger');
            elements.pageStatus.textContent = window.location.protocol === 'file:'
                ? 'Serve this page over HTTP (for example, with VS Code Live Server) to connect to the backend.'
                : 'Could not load destinations from ' + API_BASE_URL + ': ' + error.message;
            elements.grid.innerHTML = '<div class="destination-empty">' +
                '<h3 class="h5 fw-bold">Destinations are unavailable</h3>' +
                '<p class="text-muted mb-0">Check the backend connection and refresh this page. No demonstration records are shown.</p>' +
                '</div>';
        }
    }

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
            showToast(link.dataset.module + ' is a navigation placeholder for a future management module.');
        });
    });

    elements.addButton.addEventListener('click', function () {
        showForm(null);
    });
    document.getElementById('resetFiltersButton').addEventListener('click', function () {
        elements.search.value = '';
        elements.district.value = '';
        elements.province.value = '';
        elements.category.value = '';
        elements.status.value = '';
        elements.featured.checked = false;
        elements.sort.value = 'name';
        renderDestinations();
    });
    [elements.search, elements.district, elements.province, elements.category, elements.status, elements.featured, elements.sort].forEach(function (control) {
        control.addEventListener(control === elements.search ? 'input' : 'change', renderDestinations);
    });
    elements.form.addEventListener('submit', handleFormSubmit);
    document.getElementById('destinationFee').addEventListener('input', function () {
        this.setCustomValidity('');
    });
    document.getElementById('destinationLatitude').addEventListener('input', function () {
        this.setCustomValidity('');
    });
    document.getElementById('destinationLongitude').addEventListener('input', function () {
        this.setCustomValidity('');
    });
    elements.grid.addEventListener('click', function (event) {
        const button = event.target.closest('[data-action]');
        if (!button) {
            return;
        }
        const action = button.dataset.action;
        if (action === 'add') {
            showForm(null);
            return;
        }
        if (action === 'view') {
            showDetails(button.dataset.id);
            return;
        }
        const destination = DestinationStore.getAll().find(function (record) { return record.id === button.dataset.id; });
        if (!destination) {
            showToast('This destination could not be found. Refresh the page and try again.');
            return;
        }
        if (action === 'edit') {
            showForm(destination);
        } else if (action === 'delete') {
            startDelete(destination.id);
        }
    });
    document.getElementById('confirmDeleteButton').addEventListener('click', confirmDelete);

    initializePage();
});
