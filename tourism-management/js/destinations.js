/**
 * Ceylon Explore - Destination Management
 * The storage object is deliberately isolated so it can be replaced by API calls later.
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const STORAGE_KEY = 'ceylonExplore.destinations.v1';
    const FALLBACK_IMAGE = 'assets/images/hero-bg.jpg';
    const provinces = ['Central', 'Eastern', 'North Central', 'Northern', 'North Western', 'Sabaragamuwa', 'Southern', 'Uva', 'Western'];
    const categories = ['Historical and Cultural', 'Beach', 'Wildlife', 'Nature and Adventure', 'Hill Country', 'Religious'];
    const sampleDestinations = [
        {
            id: 'DST-0001', name: 'Sigiriya Rock Fortress', district: 'Matale', province: 'Central',
            category: 'Historical and Cultural',
            shortDescription: 'Climb the ancient rock citadel for remarkable frescoes, water gardens, and panoramic views.',
            fullDescription: 'A UNESCO World Heritage Site rising dramatically above the central plains. Explore the landscaped water gardens, historic frescoes, and the remains of the fifth-century royal citadel. Sample international visitor fees are estimates for demonstration purposes.',
            entryFee: 7500, bestTime: 'January to April', duration: '3–4 hours',
            openingHours: '7:00 AM – 5:30 PM', address: 'Sigiriya, Dambulla, Matale District',
            latitude: 7.957, longitude: 80.760, featured: true, status: 'Active', image: 'assets/images/sigiriya.jpg'
        },
        {
            id: 'DST-0002', name: 'Nine Arch Bridge', district: 'Badulla', province: 'Uva',
            category: 'Nature and Adventure',
            shortDescription: 'A graceful stone railway bridge surrounded by tea-covered hills near Ella.',
            fullDescription: 'Built during the colonial era, the Nine Arch Bridge is one of Ella’s best-known landmarks. Walk to a viewpoint through tea fields and forest, and check local railway times before visiting. Entry fee is estimated demonstration data; access routes may have separate charges.',
            entryFee: 500, bestTime: 'January to April', duration: '1–2 hours',
            openingHours: 'Open daily, daylight hours', address: 'Demodara, near Ella, Badulla District',
            latitude: 6.876, longitude: 81.060, featured: true, status: 'Active', image: 'assets/images/ella.jpg'
        },
        {
            id: 'DST-0003', name: 'Galle Fort', district: 'Galle', province: 'Southern',
            category: 'Historical and Cultural',
            shortDescription: 'Wander the UNESCO-listed ramparts, lighthouse, and lively streets of the old coastal fort.',
            fullDescription: 'The historic fortified city blends Portuguese and Dutch-era architecture with contemporary galleries, cafés, and local shops. A walk along the sea-facing ramparts is especially memorable around sunset. Walking through the public fort area is generally free; any listed fee is an estimated demonstration value.',
            entryFee: 0, bestTime: 'November to April', duration: '2–4 hours',
            openingHours: 'Open daily, daylight hours', address: 'Galle Fort, Galle District',
            latitude: 6.026, longitude: 80.217, featured: true, status: 'Active', image: 'assets/images/galle.jpg'
        },
        {
            id: 'DST-0004', name: 'Horton Plains National Park', district: 'Nuwara Eliya', province: 'Central',
            category: 'Hill Country',
            shortDescription: 'Discover cloud forest, rolling grasslands, Baker’s Falls, and the famous World’s End viewpoint.',
            fullDescription: 'This high-altitude national park offers a scenic circular trail through montane grassland and cloud forest. Start early for clearer views at World’s End, and bring layers for cool, changeable weather. Park entrance charges vary by visitor category; the fee shown is estimated sample data.',
            entryFee: 6000, bestTime: 'January to March', duration: '5–6 hours',
            openingHours: '6:00 AM – 4:00 PM', address: 'Ohiya Road, Nuwara Eliya District',
            latitude: 6.802, longitude: 80.807, featured: true, status: 'Active', image: 'assets/images/nuwara-eliya.jpg'
        },
        {
            id: 'DST-0005', name: 'Yala National Park', district: 'Hambantota', province: 'Southern',
            category: 'Wildlife',
            shortDescription: 'Explore dry-zone wilderness known for elephants, crocodiles, birds, and elusive leopards.',
            fullDescription: 'Yala protects a varied landscape of scrub, lagoons, and forest along Sri Lanka’s southeast coast. Wildlife is best observed on a guided safari, and sightings are never guaranteed. Entrance and jeep charges change; the fee here is only an estimated demonstration value.',
            entryFee: 8500, bestTime: 'February to July', duration: 'Half or full day',
            openingHours: '6:00 AM – 6:00 PM', address: 'Palatupana, Hambantota District',
            latitude: 6.372, longitude: 81.518, featured: true, status: 'Active', image: 'assets/images/yala.jpg'
        },
        {
            id: 'DST-0006', name: 'Nilaveli Beach', district: 'Trincomalee', province: 'Eastern',
            category: 'Beach',
            shortDescription: 'Relax beside calm turquoise water and pale sand on Sri Lanka’s northeastern coast.',
            fullDescription: 'Nilaveli is a peaceful beach base near Trincomalee, with seasonal boat trips to Pigeon Island and opportunities for swimming and snorkelling when sea conditions are suitable. Public beach access is generally free; the listed fee is estimated demonstration data and excludes activities.',
            entryFee: 0, bestTime: 'May to September', duration: '2–5 hours',
            openingHours: 'Open daily, daylight hours', address: 'Nilaveli, Trincomalee District',
            latitude: 8.693, longitude: 81.197, featured: false, status: 'Active', image: 'assets/images/trincomalee.jpg'
        },
        {
            id: 'DST-0007', name: 'Jaffna Fort', district: 'Jaffna', province: 'Northern',
            category: 'Historical and Cultural',
            shortDescription: 'Explore the broad stone ramparts of a historic coastal fort in northern Sri Lanka.',
            fullDescription: 'Jaffna Fort stands beside the lagoon and offers a window into the region’s layered Portuguese, Dutch, and British history. Walk the bastions and open grounds, and visit respectfully as restoration work continues. Any entry charge may change; the amount shown is an estimate for this frontend demonstration.',
            entryFee: 1000, bestTime: 'January to April', duration: '1–2 hours',
            openingHours: '8:00 AM – 6:00 PM', address: 'Fort Road, Jaffna',
            latitude: 9.661, longitude: 80.011, featured: false, status: 'Active', image: 'assets/images/galle.jpg'
        },
        {
            id: 'DST-0008', name: 'Temple of the Tooth', district: 'Kandy', province: 'Central',
            category: 'Religious',
            shortDescription: 'Visit the revered temple complex beside Kandy Lake, an important Buddhist pilgrimage site.',
            fullDescription: 'Sri Dalada Maligawa is a sacred temple complex in the heart of Kandy, known for its religious significance and richly decorated spaces. Visitors should dress modestly and follow site guidance during worship and ceremonies. The entry fee shown is estimated demonstration data.',
            entryFee: 2000, bestTime: 'January to April', duration: '1–2 hours',
            openingHours: '5:30 AM – 8:00 PM', address: 'Sri Dalada Veediya, Kandy',
            latitude: 7.294, longitude: 80.641, featured: true, status: 'Active', image: 'assets/images/cultural-tour.jpg'
        }
    ];

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
        formModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('destinationFormModal')),
        deleteModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteDestinationModal')),
        detailsModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('destinationDetailsModal')),
        toast: bootstrap.Toast.getOrCreateInstance(document.getElementById('destinationToast'), { delay: 3600 }),
        toastBody: document.getElementById('destinationToastBody'),
        formError: document.getElementById('destinationFormError')
    };

    function cloneSamples() {
        return sampleDestinations.map(function (destination) {
            return Object.assign({}, destination);
        });
    }

    function isValidDestinationList(value) {
        return Array.isArray(value) && value.every(function (destination) {
            return destination && typeof destination === 'object' &&
                typeof destination.id === 'string' && typeof destination.name === 'string';
        });
    }

    function showToast(message) {
        elements.toastBody.textContent = message;
        elements.toast.show();
    }

    function loadInitialDestinations() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === null) {
                const samples = cloneSamples();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
                return samples;
            }

            const parsed = JSON.parse(stored);
            if (!isValidDestinationList(parsed)) {
                throw new Error('Stored destination data has an invalid structure.');
            }
            return parsed;
        } catch (error) {
            const recoverySamples = cloneSamples();
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(recoverySamples));
                showToast('Stored destination data was invalid and has been restored with demonstration records.');
            } catch (storageError) {
                showToast('Browser storage is unavailable. Changes will only last until this page is closed.');
            }
            return recoverySamples;
        }
    }

    // Future API adapter: GET /api/destinations, GET /api/destinations/{id},
    // POST /api/destinations, PUT /api/destinations/{id}, DELETE /api/destinations/{id}.
    const DestinationStore = {
        records: loadInitialDestinations(),

        getAll: function () {
            return this.records.slice();
        },

        saveAll: function (records) {
            this.records = records;
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                return true;
            } catch (error) {
                showToast('Could not save to browser storage. Changes are currently available only until this page is closed.');
                return false;
            }
        },

        create: function (destination) {
            if (this.records.some(function (record) { return record.id === destination.id; })) {
                throw new Error('This destination ID is already in use. Please try again.');
            }
            const updated = this.getAll();
            updated.push(destination);
            return this.saveAll(updated);
        },

        update: function (id, destination) {
            const index = this.records.findIndex(function (record) { return record.id === id; });
            if (index === -1) {
                throw new Error('This destination could not be found. Refresh the page and try again.');
            }
            const updated = this.getAll();
            updated[index] = Object.assign({}, destination, { id: id });
            return this.saveAll(updated);
        },

        remove: function (id) {
            const updated = this.records.filter(function (record) { return record.id !== id; });
            if (updated.length === this.records.length) {
                throw new Error('This destination could not be found. Refresh the page and try again.');
            }
            return this.saveAll(updated);
        }
    };

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

    function generateDestinationId() {
        const usedIds = new Set(DestinationStore.getAll().map(function (destination) {
            return destination.id;
        }));
        let nextNumber = DestinationStore.getAll().reduce(function (highest, destination) {
            const match = /^DST-(\d+)$/.exec(destination.id);
            return match ? Math.max(highest, Number(match[1])) : highest;
        }, 0) + 1;
        let candidate = '';
        do {
            candidate = 'DST-' + String(nextNumber).padStart(4, '0');
            nextNumber += 1;
        } while (usedIds.has(candidate));
        return candidate;
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
                destination.name, destination.district, destination.province,
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
            '<div class="destination-card-actions">' +
                '<button class="btn btn-outline-secondary btn-view" type="button" data-action="view" data-id="' + escapeHtml(destination.id) + '"><i class="bi bi-eye me-1"></i>View Details</button>' +
                '<button class="btn btn-outline-success btn-icon" type="button" data-action="edit" data-id="' + escapeHtml(destination.id) + '" aria-label="Edit ' + escapeHtml(destination.name) + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-outline-danger btn-icon" type="button" data-action="delete" data-id="' + escapeHtml(destination.id) + '" aria-label="Delete ' + escapeHtml(destination.name) + '" title="Delete"><i class="bi bi-trash3"></i></button>' +
            '</div>' +
        '</article>';
    }

    function renderDestinations() {
        const destinations = getVisibleDestinations();
        elements.count.textContent = destinations.length + (destinations.length === 1 ? ' destination' : ' destinations');
        if (destinations.length === 0) {
            elements.grid.innerHTML = '<div class="destination-empty">' +
                '<span class="destination-empty-icon"><i class="bi bi-geo-alt"></i></span>' +
                '<h3 class="h5 fw-bold">No destinations found</h3>' +
                '<p class="text-muted mb-3">Try adjusting your search or filters, or add a new destination.</p>' +
                '<button class="btn btn-emerald" type="button" data-action="add">Add New Destination</button>' +
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
    }

    function closeSidebar() {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-visible');
        elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    function showForm(destination) {
        editingId = destination ? destination.id : null;
        elements.form.reset();
        elements.form.classList.remove('was-validated');
        elements.formError.classList.add('d-none');
        elements.formError.textContent = '';
        document.getElementById('destinationFormTitle').textContent = destination ? 'Edit Destination' : 'Add New Destination';
        document.getElementById('saveDestinationLabel').textContent = destination ? 'Save Changes' : 'Save Destination';
        document.getElementById('destinationId').value = destination ? destination.id : generateDestinationId();

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
            document.getElementById('destinationImage').value = destination.image || '';
        } else {
            document.getElementById('destinationStatus').value = 'Active';
            document.getElementById('destinationFeatured').value = 'false';
            document.getElementById('destinationFee').value = '0';
        }
        elements.formModal.show();
    }

    function readDestinationForm() {
        return {
            id: document.getElementById('destinationId').value,
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

    function handleFormSubmit(event) {
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

        try {
            if (editingId) {
                const existing = DestinationStore.getAll().find(function (record) { return record.id === editingId; });
                if (!existing) {
                    throw new Error('This destination could not be found. Refresh the page and try again.');
                }
                destination.id = editingId;
                if (DestinationStore.update(editingId, destination)) {
                    elements.formModal.hide();
                    refreshPage();
                    showToast(destination.name + ' was updated successfully.');
                }
            } else {
                destination.id = generateDestinationId();
                if (DestinationStore.create(destination)) {
                    elements.formModal.hide();
                    refreshPage();
                    showToast(destination.name + ' was added successfully.');
                }
            }
        } catch (error) {
            elements.formError.textContent = error.message;
            elements.formError.classList.remove('d-none');
        }
    }

    function showDetails(id) {
        const destination = DestinationStore.getAll().find(function (record) { return record.id === id; });
        if (!destination) {
            showToast('This destination could not be found.');
            return;
        }
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
                    detailItem('Entry fee (estimated)', formatCurrency(destination.entryFee)) +
                    detailItem('Best time to visit', destination.bestTime || 'Not specified') +
                    detailItem('Recommended duration', destination.duration || 'Not specified') +
                    detailItem('Opening hours', destination.openingHours || 'Not specified') +
                    detailItem('Address or location', destination.address || 'Not provided') +
                    detailItem('Coordinates', coordinates) +
                    detailItem('Featured destination', destination.featured ? 'Yes' : 'No') +
                    detailItem('Destination status', destination.status || 'Inactive') +
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
    }

    function detailItem(label, value) {
        return '<div class="details-item"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
    }

    function startDelete(id) {
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

    function confirmDelete() {
        if (!deletingId) {
            return;
        }
        const destination = DestinationStore.getAll().find(function (record) { return record.id === deletingId; });
        try {
            if (DestinationStore.remove(deletingId)) {
                elements.deleteModal.hide();
                refreshPage();
                showToast((destination ? destination.name : 'Destination') + ' was deleted.');
                deletingId = null;
            }
        } catch (error) {
            showToast(error.message);
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

    document.getElementById('addDestinationButton').addEventListener('click', function () {
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
        const destination = DestinationStore.getAll().find(function (record) { return record.id === button.dataset.id; });
        if (!destination) {
            showToast('This destination could not be found.');
            return;
        }
        if (action === 'view') {
            showDetails(destination.id);
        } else if (action === 'edit') {
            showForm(destination);
        } else if (action === 'delete') {
            startDelete(destination.id);
        }
    });
    document.getElementById('confirmDeleteButton').addEventListener('click', confirmDelete);

    refreshPage();
});
