/**
 * Ceylon Explore - Tour Package Management
 * Browser demo storage is isolated behind packageRepository for future API replacement.
 */

document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'ceylonExplorePackages';
    const CATEGORIES = [
        'Cultural Heritage',
        'Beach Holiday',
        'Hill Country',
        'Wildlife Adventure',
        'Nature and Adventure',
        'Family Holiday'
    ];
    const FALLBACK_IMAGE = 'assets/images/sigiriya.jpg';
    const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520"><rect width="900" height="520" fill="#e7f0eb"/><path d="M0 390 240 190l145 125 150-190 365 265v130H0z" fill="#7aa38c"/><circle cx="700" cy="115" r="52" fill="#f1d889"/><text x="450" y="470" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" fill="#1b4332">Ceylon Explore</text></svg>'
    );

    const samplePackages = [
        {
            id: 'PKG-0001', name: 'Cultural Heritage Tour', destination: 'Sigiriya and Kandy',
            description: 'Discover ancient kingdoms, sacred temples, and the timeless beauty of Sri Lanka’s cultural triangle.',
            fullDescription: 'Climb the iconic Sigiriya Rock Fortress, explore the Dambulla cave temples, and enjoy the cultural landmarks and lake views of Kandy. This guided heritage journey blends archaeology, local cuisine, and memorable scenery.',
            duration: 3, nights: 2, price: 35000, maxTravelers: 12, category: 'Cultural Heritage',
            accommodation: 'Yes', meals: 'Yes', transportation: 'Yes', featured: 'Yes', status: 'Active',
            imageUrl: 'assets/images/cultural-tour.jpg'
        },
        {
            id: 'PKG-0002', name: 'Hill Country Escape', destination: 'Ella and Nuwara Eliya',
            description: 'Ride through tea country, misty mountain views, and the famous Nine Arch Bridge.',
            fullDescription: 'Set off on a scenic rail journey through emerald tea estates, visit a working tea factory, and enjoy gentle walks around Ella and Nuwara Eliya. A relaxed escape for travelers who love cooler weather and highland scenery.',
            duration: 4, nights: 3, price: 48000, maxTravelers: 10, category: 'Hill Country',
            accommodation: 'Yes', meals: 'Yes', transportation: 'Yes', featured: 'Yes', status: 'Active',
            imageUrl: 'assets/images/ella.jpg'
        },
        {
            id: 'PKG-0003', name: 'Tropical Beach Holiday', destination: 'Trincomalee and Nilaveli',
            description: 'Unwind on the east coast with clear-water beaches, snorkeling, and ocean adventures.',
            fullDescription: 'Enjoy the peaceful sands of Nilaveli, take a boat trip to Pigeon Island, and discover Trincomalee’s coastal heritage. The itinerary leaves plenty of time for swimming, snorkeling, and relaxing by the sea.',
            duration: 3, nights: 2, price: 32000, maxTravelers: 16, category: 'Beach Holiday',
            accommodation: 'Yes', meals: 'No', transportation: 'Yes', featured: 'Yes', status: 'Active',
            imageUrl: 'assets/images/trincomalee.jpg'
        },
        {
            id: 'PKG-0004', name: 'Wildlife Safari Adventure', destination: 'Yala National Park',
            description: 'Explore Sri Lanka’s wild landscapes on a guided safari in search of elephants and leopards.',
            fullDescription: 'Spend time in the diverse habitats of Yala National Park with an experienced local guide. Early morning and afternoon game drives offer opportunities to spot elephants, crocodiles, colorful birds, and, with luck, the elusive leopard.',
            duration: 2, nights: 1, price: 28500, maxTravelers: 8, category: 'Wildlife Adventure',
            accommodation: 'Yes', meals: 'Yes', transportation: 'Yes', featured: 'No', status: 'Active',
            imageUrl: 'assets/images/yala.jpg'
        },
        {
            id: 'PKG-0005', name: 'Southern Coast Explorer', destination: 'Galle and Mirissa',
            description: 'Pair the charm of Galle Fort with sunny beaches and the relaxed southern coastline.',
            fullDescription: 'Wander the lanes of the UNESCO-listed Galle Fort, watch the sunset over the ramparts, and continue to Mirissa for laid-back beach time. Optional whale watching and local seafood experiences can be arranged in season.',
            duration: 4, nights: 3, price: 42500, maxTravelers: 14, category: 'Beach Holiday',
            accommodation: 'Yes', meals: 'Yes', transportation: 'Yes', featured: 'No', status: 'Active',
            imageUrl: 'assets/images/galle.jpg'
        },
        {
            id: 'PKG-0006', name: 'Northern Heritage Journey', destination: 'Jaffna',
            description: 'Experience northern Sri Lanka through its temples, island scenery, and distinctive cuisine.',
            fullDescription: 'Discover Jaffna’s cultural landmarks, lively markets, and memorable flavors, with time to visit the peninsula’s coastal and island communities. This welcoming itinerary introduces a different side of Sri Lanka.',
            duration: 3, nights: 2, price: 39000, maxTravelers: 10, category: 'Cultural Heritage',
            accommodation: 'Yes', meals: 'No', transportation: 'Yes', featured: 'No', status: 'Inactive',
            imageUrl: 'assets/images/sigiriya.jpg'
        }
    ];

    const packageFormModal = new bootstrap.Modal(document.getElementById('packageFormModal'));
    const packageDetailsModal = new bootstrap.Modal(document.getElementById('packageDetailsModal'));
    const deletePackageModal = new bootstrap.Modal(document.getElementById('deletePackageModal'));
    const toast = new bootstrap.Toast(document.getElementById('packageToast'), { delay: 3600 });
    const form = document.getElementById('packageForm');
    const elements = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        packageGrid: document.getElementById('packageGrid'),
        packageSearch: document.getElementById('packageSearch'),
        categoryFilter: document.getElementById('categoryFilter'),
        statusFilter: document.getElementById('statusFilter'),
        featuredFilter: document.getElementById('featuredFilter'),
        sortSelect: document.getElementById('sortSelect'),
        formTitle: document.getElementById('packageFormTitle'),
        packageId: document.getElementById('packageId'),
        toastBody: document.getElementById('packageToastBody')
    };

    const packageRepository = {
        // Replace repository methods with GET/POST/PUT/DELETE calls to /api/packages.
        load: function () {
            let storedValue;
            try {
                storedValue = localStorage.getItem(STORAGE_KEY);
            } catch (error) {
                console.error('Unable to access package demo storage.', error);
                return { records: samplePackages.slice(), storageError: true };
            }

            if (storedValue === null) {
                try {
                    this.save(samplePackages);
                    return { records: samplePackages.slice(), storageError: false };
                } catch (error) {
                    console.error('Unable to initialize package demo storage.', error);
                    return { records: samplePackages.slice(), storageError: true };
                }
            }

            try {
                const parsed = JSON.parse(storedValue);
                if (!Array.isArray(parsed) || !parsed.every(isValidPackage)) {
                    throw new Error('Stored package data has an invalid structure.');
                }
                return { records: parsed, storageError: false };
            } catch (error) {
                console.warn('Invalid package demo data found. Sample packages were restored.', error);
                let storageError = false;
                try {
                    this.save(samplePackages);
                } catch (saveError) {
                    console.error('Unable to restore sample packages to demo storage.', saveError);
                    storageError = true;
                }
                return { records: samplePackages.slice(), storageError: storageError, repaired: true };
            }
        },
        save: function (records) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        },
        create: function (records, packageData) {
            const updatedRecords = records.concat(packageData);
            this.save(updatedRecords);
            return updatedRecords;
        },
        update: function (records, id, packageData) {
            const index = records.findIndex(function (item) { return item.id === id; });
            if (index < 0) {
                throw new Error('Package not found: ' + id);
            }
            const updatedRecords = records.slice();
            updatedRecords[index] = Object.assign({}, records[index], packageData, { id: id });
            this.save(updatedRecords);
            return updatedRecords;
        },
        remove: function (records, id) {
            const updatedRecords = records.filter(function (item) { return item.id !== id; });
            this.save(updatedRecords);
            return updatedRecords;
        }
    };

    const loadedData = packageRepository.load();
    let packages = loadedData.records;
    let editingPackageId = null;
    let pendingDeleteId = null;
    let detailsPackageId = null;
    let returnFocusElement = null;

    bindEvents();
    renderAll();
    if (loadedData.storageError) {
        showToast('Browser storage is unavailable. Changes cannot be saved; package samples are shown for this session.');
    } else if (loadedData.repaired) {
        showToast('Stored package data was invalid. Sample packages were restored.');
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
                        ? returnFocusElement
                        : document.getElementById('addPackageButton');
                    document.activeElement.blur();
                    modalElement.addEventListener('hidden.bs.modal', function restoreFocus() {
                        focusTarget.focus();
                    }, { once: true });
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
                if (id) {
                    openEditModal(id);
                }
            }, { once: true });
            packageDetailsModal.hide();
        });

        [elements.packageSearch, elements.categoryFilter, elements.statusFilter, elements.featuredFilter, elements.sortSelect].forEach(function (control) {
            control.addEventListener(control === elements.packageSearch ? 'input' : 'change', renderPackages);
        });
        document.getElementById('resetFiltersButton').addEventListener('click', resetFilters);
        document.getElementById('emptyResetButton').addEventListener('click', resetFilters);
        form.querySelectorAll('input, textarea, select').forEach(function (control) {
            control.addEventListener('input', clearFieldError);
            control.addEventListener('change', clearFieldError);
        });
    }

    function isValidPackage(item) {
        return item && typeof item === 'object'
            && typeof item.id === 'string' && /^PKG-\d{4,}$/.test(item.id)
            && typeof item.name === 'string' && item.name.trim() !== ''
            && typeof item.destination === 'string' && item.destination.trim() !== ''
            && typeof item.description === 'string' && item.description.trim() !== ''
            && Number.isFinite(Number(item.duration)) && Number(item.duration) > 0
            && Number.isFinite(Number(item.nights)) && Number(item.nights) >= 0
            && Number.isFinite(Number(item.price)) && Number(item.price) > 0
            && Number.isFinite(Number(item.maxTravelers)) && Number(item.maxTravelers) > 0
            && CATEGORIES.includes(item.category)
            && ['Active', 'Inactive'].includes(item.status)
            && ['Yes', 'No'].includes(item.featured)
            && ['Yes', 'No'].includes(item.accommodation)
            && ['Yes', 'No'].includes(item.meals)
            && ['Yes', 'No'].includes(item.transportation);
    }

    function renderAll() {
        renderStatistics();
        renderPackages();
    }

    function renderStatistics() {
        const averagePrice = packages.length
            ? packages.reduce(function (total, item) { return total + Number(item.price); }, 0) / packages.length
            : 0;
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
        document.getElementById('packageResultsSummary').textContent = 'Showing ' + visiblePackages.length + ' of ' + packages.length + ' packages';
        attachImageFallbacks(elements.packageGrid);
    }

    function getFilteredPackages() {
        const query = elements.packageSearch.value.trim().toLocaleLowerCase();
        let result = packages.filter(function (item) {
            const matchesSearch = !query
                || item.name.toLocaleLowerCase().includes(query)
                || item.destination.toLocaleLowerCase().includes(query);
            const matchesCategory = !elements.categoryFilter.value || item.category === elements.categoryFilter.value;
            const matchesStatus = !elements.statusFilter.value || item.status === elements.statusFilter.value;
            const matchesFeatured = !elements.featuredFilter.value
                || item.featured === (elements.featuredFilter.value === 'yes' ? 'Yes' : 'No');
            return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
        });

        if (elements.sortSelect.value === 'priceAsc') {
            result.sort(function (a, b) { return Number(a.price) - Number(b.price); });
        } else if (elements.sortSelect.value === 'priceDesc') {
            result.sort(function (a, b) { return Number(b.price) - Number(a.price); });
        } else if (elements.sortSelect.value === 'durationAsc') {
            result.sort(function (a, b) { return Number(a.duration) - Number(b.duration); });
        }
        return result;
    }

    function createPackageCard(item) {
        const statusClass = item.status === 'Active' ? 'active' : 'inactive';
        const featuredBadge = item.featured === 'Yes'
            ? '<span class="badge rounded-pill package-featured-badge"><i class="bi bi-star-fill me-1"></i>Featured</span>'
            : '';
        return '<article class="package-card">'
            + '<div class="package-card-image-wrap">'
            + '<img class="package-card-image" src="' + escapeAttribute(getImageUrl(item.imageUrl)) + '" alt="' + escapeAttribute(item.name) + '" loading="lazy">'
            + '<div class="package-card-badges">' + featuredBadge + '<span class="badge rounded-pill package-status-badge ' + statusClass + '">' + escapeHtml(item.status) + '</span></div>'
            + '</div>'
            + '<div class="package-card-content">'
            + '<span class="package-card-category">' + escapeHtml(item.category) + '</span>'
            + '<h3 class="package-card-title">' + escapeHtml(item.name) + '</h3>'
            + '<div class="package-card-destination"><i class="bi bi-geo-alt-fill me-1"></i>' + escapeHtml(item.destination) + '</div>'
            + '<p class="package-card-description">' + escapeHtml(item.description) + '</p>'
            + '<div class="package-card-meta"><span><i class="bi bi-clock"></i>' + escapeHtml(String(item.duration)) + ' days / ' + escapeHtml(String(item.nights)) + ' nights</span><span><i class="bi bi-people"></i>Up to ' + escapeHtml(String(item.maxTravelers)) + '</span></div>'
            + '<div class="package-card-price">' + formatPrice(item.price) + ' <span>/ person</span></div>'
            + '<div class="package-card-actions">'
            + '<button class="btn btn-outline-emerald btn-sm rounded-pill fw-semibold btn-view-package" type="button" data-action="details" data-id="' + escapeAttribute(item.id) + '">View Details</button>'
            + '<button class="btn btn-outline-primary btn-sm rounded-circle edit-action" type="button" data-action="edit" data-id="' + escapeAttribute(item.id) + '" aria-label="Edit ' + escapeAttribute(item.name) + '" title="Edit package"><i class="bi bi-pencil-square"></i></button>'
            + '<button class="btn btn-outline-danger btn-sm rounded-circle delete-action" type="button" data-action="delete" data-id="' + escapeAttribute(item.id) + '" aria-label="Delete ' + escapeAttribute(item.name) + '" title="Delete package"><i class="bi bi-trash3"></i></button>'
            + '</div></div></article>';
    }

    function handlePackageAction(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }
        const id = button.dataset.id;
        returnFocusElement = button;
        if (button.dataset.action === 'details') {
            openDetailsModal(id);
        } else if (button.dataset.action === 'edit') {
            openEditModal(id);
        } else if (button.dataset.action === 'delete') {
            openDeleteModal(id);
        }
    }

    function openCreateModal() {
        returnFocusElement = document.getElementById('addPackageButton');
        editingPackageId = null;
        form.reset();
        clearAllFieldErrors();
        elements.formTitle.textContent = 'Add New Package';
        document.getElementById('savePackageLabel').textContent = 'Save Package';
        elements.packageId.value = generatePackageId();
        packageFormModal.show();
        window.setTimeout(function () { document.getElementById('packageName').focus(); }, 250);
    }

    function openEditModal(id) {
        const item = packages.find(function (record) { return record.id === id; });
        if (!item) {
            showToast('The selected package could not be found.');
            return;
        }
        editingPackageId = item.id;
        form.reset();
        clearAllFieldErrors();
        elements.formTitle.textContent = 'Edit Tour Package';
        document.getElementById('savePackageLabel').textContent = 'Save Changes';
        elements.packageId.value = item.id;
        ['name', 'destination', 'description', 'fullDescription', 'duration', 'nights', 'price', 'maxTravelers', 'category', 'status', 'accommodation', 'meals', 'transportation', 'featured', 'imageUrl'].forEach(function (key) {
            const control = form.elements.namedItem(key);
            if (control) {
                control.value = item[key] === undefined ? '' : String(item[key]);
            }
        });
        packageFormModal.show();
        window.setTimeout(function () { document.getElementById('packageName').focus(); }, 250);
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        clearAllFieldErrors();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            Object.keys(validationErrors).forEach(function (name) {
                const field = form.elements.namedItem(name);
                field.classList.add('is-invalid');
                field.nextElementSibling.textContent = validationErrors[name];
            });
            const firstInvalid = form.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
            }
            showToast('Please correct the highlighted package fields.');
            return;
        }

        const packageData = readFormData();
        if (editingPackageId) {
            try {
                packages = packageRepository.update(packages, editingPackageId, packageData);
            } catch (error) {
                console.error('Unable to update package in browser storage.', error);
                showToast('Package changes could not be saved to browser storage.');
                return;
            }
        } else {
            if (packages.some(function (item) { return item.id === packageData.id; })) {
                showToast('This package ID already exists. A new ID has been generated; please try again.');
                elements.packageId.value = generatePackageId();
                return;
            }
            try {
                packages = packageRepository.create(packages, packageData);
            } catch (error) {
                console.error('Unable to create package in browser storage.', error);
                showToast('Package changes could not be saved to browser storage.');
                return;
            }
        }

        packageFormModal.hide();
        renderAll();
        showToast(editingPackageId ? 'Tour package updated successfully.' : 'New tour package added successfully.');
    }

    function validateForm() {
        const errors = {};
        const requiredTextFields = ['name', 'destination', 'description'];
        requiredTextFields.forEach(function (name) {
            const field = form.elements.namedItem(name);
            if (!field.value.trim()) {
                errors[name] = 'This field is required.';
            }
        });

        const duration = Number(form.elements.duration.value);
        const nights = Number(form.elements.nights.value);
        const price = Number(form.elements.price.value);
        const maxTravelers = Number(form.elements.maxTravelers.value);
        if (!Number.isInteger(duration) || duration <= 0) {
            errors.duration = 'Enter a positive whole number of days.';
        }
        if (!Number.isInteger(nights) || nights < 0) {
            errors.nights = 'Enter zero or a positive whole number of nights.';
        }
        if (!Number.isFinite(price) || price <= 0) {
            errors.price = 'Enter a price greater than zero.';
        }
        if (!Number.isInteger(maxTravelers) || maxTravelers <= 0) {
            errors.maxTravelers = 'Enter a positive whole number of travelers.';
        }
        if (!CATEGORIES.includes(form.elements.category.value)) {
            errors.category = 'Select a package category.';
        }
        if (!['Active', 'Inactive'].includes(form.elements.status.value)) {
            errors.status = 'Select a valid package status.';
        }
        const imageUrl = form.elements.imageUrl;
        if (imageUrl.value && !imageUrl.checkValidity()) {
            errors.imageUrl = 'Enter a valid image URL, or leave this field empty.';
        }
        if (!editingPackageId && packages.some(function (item) { return item.id === elements.packageId.value; })) {
            errors.id = 'This package ID is already in use.';
        }
        return errors;
    }

    function readFormData() {
        return {
            id: elements.packageId.value,
            name: form.elements.name.value.trim(),
            destination: form.elements.destination.value.trim(),
            description: form.elements.description.value.trim(),
            fullDescription: form.elements.fullDescription.value.trim(),
            duration: Number(form.elements.duration.value),
            nights: Number(form.elements.nights.value),
            price: Number(form.elements.price.value),
            maxTravelers: Number(form.elements.maxTravelers.value),
            category: form.elements.category.value,
            accommodation: form.elements.accommodation.value,
            meals: form.elements.meals.value,
            transportation: form.elements.transportation.value,
            featured: form.elements.featured.value,
            status: form.elements.status.value,
            imageUrl: form.elements.imageUrl.value.trim()
        };
    }

    function openDetailsModal(id) {
        const item = packages.find(function (record) { return record.id === id; });
        if (!item) {
            showToast('The selected package could not be found.');
            return;
        }
        detailsPackageId = item.id;
        const detailsImage = document.getElementById('detailsImage');
        detailsImage.src = getImageUrl(item.imageUrl);
        detailsImage.alt = item.name;
        document.getElementById('packageDetailsTitle').textContent = item.name;
        document.getElementById('detailsCategory').textContent = item.category;
        document.getElementById('detailsDestination').textContent = item.destination;
        document.getElementById('detailsId').textContent = item.id;
        document.getElementById('detailsDescription').textContent = item.fullDescription || item.description;
        document.getElementById('detailsDuration').textContent = item.duration + ' days';
        document.getElementById('detailsNights').textContent = item.nights + (Number(item.nights) === 1 ? ' night' : ' nights');
        document.getElementById('detailsPrice').textContent = formatPrice(item.price);
        document.getElementById('detailsCapacity').textContent = 'Up to ' + item.maxTravelers + ' travelers';

        const serviceDetails = [
            ['Accommodation', item.accommodation],
            ['Meals', item.meals],
            ['Transportation', item.transportation]
        ];
        document.getElementById('detailsServices').innerHTML = serviceDetails.map(function (service) {
            const included = service[1] === 'Yes';
            return '<span class="included-service' + (included ? '' : ' not-included') + '"><i class="bi ' + (included ? 'bi-check-circle-fill' : 'bi-dash-circle') + ' me-1"></i>' + escapeHtml(service[0]) + ': ' + (included ? 'Included' : 'Not included') + '</span>';
        }).join('');
        const status = document.getElementById('detailsStatus');
        status.textContent = item.status;
        status.className = 'status-badge ' + (item.status === 'Active' ? 'confirmed' : 'inactive');
        attachImageFallbacks(document.getElementById('packageDetailsModal'));
        packageDetailsModal.show();
    }

    function openDeleteModal(id) {
        const item = packages.find(function (record) { return record.id === id; });
        if (!item) {
            showToast('The selected package could not be found.');
            return;
        }
        pendingDeleteId = id;
        document.getElementById('deletePackageName').textContent = item.name;
        document.getElementById('deletePackageId').textContent = item.id;
        deletePackageModal.show();
    }

    function confirmDeletePackage() {
        if (!pendingDeleteId) {
            return;
        }
        try {
            packages = packageRepository.remove(packages, pendingDeleteId);
        } catch (error) {
            console.error('Unable to delete package from browser storage.', error);
            showToast('The package could not be deleted from browser storage.');
            return;
        }
        pendingDeleteId = null;
        deletePackageModal.hide();
        renderAll();
        showToast('Tour package deleted successfully.');
    }

    function generatePackageId() {
        const highestId = packages.reduce(function (highest, item) {
            const match = /^PKG-(\d+)$/.exec(item.id);
            return match ? Math.max(highest, Number(match[1])) : highest;
        }, 0);
        let nextId = highestId + 1;
        let candidate = 'PKG-' + String(nextId).padStart(4, '0');
        while (packages.some(function (item) { return item.id === candidate; })) {
            nextId += 1;
            candidate = 'PKG-' + String(nextId).padStart(4, '0');
        }
        return candidate;
    }

    function resetFilters() {
        elements.packageSearch.value = '';
        elements.categoryFilter.value = '';
        elements.statusFilter.value = '';
        elements.featuredFilter.value = '';
        elements.sortSelect.value = 'default';
        renderPackages();
    }

    function clearFieldError(event) {
        const field = event.currentTarget;
        field.classList.remove('is-invalid');
        const feedback = field.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = '';
        }
    }

    function clearAllFieldErrors() {
        form.querySelectorAll('.is-invalid').forEach(function (field) {
            field.classList.remove('is-invalid');
        });
        form.querySelectorAll('.invalid-feedback').forEach(function (feedback) {
            feedback.textContent = '';
        });
    }

    function getImageUrl(imageUrl) {
        if (!imageUrl) {
            return FALLBACK_IMAGE;
        }
        try {
            const parsed = new URL(imageUrl, document.baseURI);
            return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : FALLBACK_IMAGE;
        } catch (error) {
            return FALLBACK_IMAGE;
        }
    }

    function attachImageFallbacks(container) {
        container.querySelectorAll('img').forEach(function (image) {
            image.addEventListener('error', function handleImageError() {
                image.removeEventListener('error', handleImageError);
                if (image.src !== new URL(FALLBACK_IMAGE, document.baseURI).href) {
                    image.src = FALLBACK_IMAGE;
                    image.addEventListener('error', function usePlaceholder() {
                        image.removeEventListener('error', usePlaceholder);
                        image.src = PLACEHOLDER_IMAGE;
                    }, { once: true });
                } else {
                    image.src = PLACEHOLDER_IMAGE;
                }
            }, { once: true });
        });
    }

    function formatPrice(value) {
        return 'LKR ' + Number(value).toLocaleString('en-LK', { maximumFractionDigits: 2 });
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
        });
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }

    function closeSidebar() {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-visible');
        elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    function showToast(message) {
        elements.toastBody.textContent = message;
        toast.show();
    }
});
