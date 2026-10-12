/**
 * Ceylon Explore - Hotel Management
 * Browser storage is isolated behind HotelStore so it can later be replaced by a REST adapter.
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const STORAGE_KEY = 'ceylonExploreHotels';
    const FALLBACK_IMAGE = 'assets/images/hero-bg.jpg';
    const PAGE_SIZE = 5;
    const sampleHotels = [
        {
            id: 'HOT-0001', name: 'Lakeview House Colombo', description: 'A fictional city hotel with quiet rooms, a leafy courtyard, and convenient access to central Colombo.',
            address: '18 Lotus Garden Road', city: 'Colombo', district: 'Colombo', province: 'Western', contact: '+94 11 555 0101',
            email: 'stay@lakeview.example.test', website: '', rating: 4, roomTypes: ['Double', 'Deluxe', 'Suite'], price: 28500, rooms: 42,
            checkIn: '14:00', checkOut: '11:00', facilities: ['Wi-Fi', 'Restaurant', 'Air Conditioning', 'Parking'],
            image: 'assets/images/hero-bg.jpg', featured: true, status: 'Active'
        },
        {
            id: 'HOT-0002', name: 'Kandy Canopy Retreat', description: 'A fictional hillside retreat overlooking Kandy, designed for relaxed stays near the city and lake.',
            address: '42 Temple View Lane', city: 'Kandy', district: 'Kandy', province: 'Central', contact: '+94 81 555 0102',
            email: 'hello@kandycanopy.example.test', website: '', rating: 5, roomTypes: ['Double', 'Deluxe', 'Suite'], price: 42000, rooms: 28,
            checkIn: '14:00', checkOut: '11:00', facilities: ['Wi-Fi', 'Swimming Pool', 'Restaurant', 'Gym', 'Spa'],
            image: 'assets/images/cultural-tour.jpg', featured: true, status: 'Active'
        },
        {
            id: 'HOT-0003', name: 'Galle Fort Courtyard Inn', description: 'A fictional boutique inn in the historic quarter with a shaded courtyard and locally inspired dining.',
            address: '7 Rampart Street', city: 'Galle', district: 'Galle', province: 'Southern', contact: '+94 91 555 0103',
            email: 'reservations@gallecourtyard.example.test', website: '', rating: 4, roomTypes: ['Single', 'Double', 'Twin'], price: 31500, rooms: 19,
            checkIn: '15:00', checkOut: '11:00', facilities: ['Wi-Fi', 'Restaurant', 'Air Conditioning'],
            image: 'assets/images/galle.jpg', featured: true, status: 'Active'
        },
        {
            id: 'HOT-0004', name: 'Jaffna Palmyra Guesthouse', description: 'A fictional family-run guesthouse offering simple, comfortable rooms and a welcoming northern Sri Lankan atmosphere.',
            address: '25 Nallur Heritage Road', city: 'Jaffna', district: 'Jaffna', province: 'Northern', contact: '+94 21 555 0104',
            email: 'welcome@palmyra.example.test', website: '', rating: 3, roomTypes: ['Single', 'Double', 'Twin'], price: 14500, rooms: 16,
            checkIn: '13:00', checkOut: '10:00', facilities: ['Wi-Fi', 'Restaurant', 'Parking'],
            image: 'assets/images/cultural-tour.jpg', featured: false, status: 'Active'
        },
        {
            id: 'HOT-0005', name: 'Ella Ridgeview Lodge', description: 'A fictional mountain lodge with veranda views across tea country and easy access to Ella town.',
            address: '9 Ridge Walk', city: 'Ella', district: 'Badulla', province: 'Uva', contact: '+94 57 555 0105',
            email: 'bookings@ridgeview.example.test', website: '', rating: 4, roomTypes: ['Double', 'Twin', 'Deluxe'], price: 26500, rooms: 23,
            checkIn: '14:00', checkOut: '11:00', facilities: ['Wi-Fi', 'Restaurant', 'Parking', 'Spa'],
            image: 'assets/images/ella.jpg', featured: true, status: 'Active'
        },
        {
            id: 'HOT-0006', name: 'Nuwara Eliya Fern House', description: 'A fictional country house stay with cool-climate rooms, a small garden, and a cosy dining room.',
            address: '33 Tea Estate Road', city: 'Nuwara Eliya', district: 'Nuwara Eliya', province: 'Central', contact: '+94 52 555 0106',
            email: 'stay@fernhouse.example.test', website: '', rating: 3, roomTypes: ['Single', 'Double', 'Deluxe'], price: 19800, rooms: 21,
            checkIn: '14:00', checkOut: '10:30', facilities: ['Wi-Fi', 'Restaurant', 'Air Conditioning'],
            image: 'assets/images/nuwara-eliya.jpg', featured: false, status: 'Active'
        },
        {
            id: 'HOT-0007', name: 'Sigiriya Garden Pavilion', description: 'A fictional garden hotel set among tropical greenery, with a pool and views toward the Sigiriya area.',
            address: '12 Pidurangala Access Road', city: 'Sigiriya', district: 'Matale', province: 'Central', contact: '+94 66 555 0107',
            email: 'reservations@gardenpavilion.example.test', website: '', rating: 5, roomTypes: ['Double', 'Deluxe', 'Suite'], price: 38500, rooms: 31,
            checkIn: '14:00', checkOut: '11:00', facilities: ['Wi-Fi', 'Swimming Pool', 'Restaurant', 'Air Conditioning', 'Spa'],
            image: 'assets/images/sigiriya.jpg', featured: true, status: 'Active'
        },
        {
            id: 'HOT-0008', name: 'Trinco Bluewater Stay', description: 'A fictional coastal stay with bright rooms, relaxed dining, and convenient access to Trincomalee beaches.',
            address: '5 Coral Bay Avenue', city: 'Trincomalee', district: 'Trincomalee', province: 'Eastern', contact: '+94 26 555 0108',
            email: 'hello@bluewater.example.test', website: '', rating: 4, roomTypes: ['Double', 'Twin', 'Suite'], price: 22900, rooms: 34,
            checkIn: '14:00', checkOut: '11:00', facilities: ['Wi-Fi', 'Swimming Pool', 'Restaurant', 'Parking'],
            image: 'assets/images/trincomalee.jpg', featured: false, status: 'Inactive'
        }
    ];

    const elements = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        search: document.getElementById('hotelSearch'),
        provinceFilter: document.getElementById('provinceFilter'),
        districtFilter: document.getElementById('districtFilter'),
        ratingFilter: document.getElementById('ratingFilter'),
        statusFilter: document.getElementById('statusFilter'),
        featuredFilter: document.getElementById('featuredFilter'),
        sortFilter: document.getElementById('sortFilter'),
        tableBody: document.getElementById('hotelTableBody'),
        hotelCount: document.getElementById('hotelCount'),
        pagination: document.getElementById('hotelPagination'),
        paginationSummary: document.getElementById('paginationSummary'),
        form: document.getElementById('hotelForm'),
        formModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('hotelFormModal')),
        deleteModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteHotelModal')),
        detailsModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('hotelDetailsModal')),
        toast: bootstrap.Toast.getOrCreateInstance(document.getElementById('hotelToast'), { delay: 3600 }),
        toastBody: document.getElementById('hotelToastBody'),
        formError: document.getElementById('hotelFormError')
    };

    function cloneSamples() {
        return sampleHotels.map(function (hotel) {
            return Object.assign({}, hotel, { roomTypes: hotel.roomTypes.slice(), facilities: hotel.facilities.slice() });
        });
    }

    function isValidHotelList(value) {
        return Array.isArray(value) && value.every(function (hotel) {
            return hotel && typeof hotel === 'object' && typeof hotel.id === 'string' &&
                typeof hotel.name === 'string' && typeof hotel.city === 'string';
        });
    }

    function showToast(message) {
        elements.toastBody.textContent = message;
        elements.toast.show();
    }

    function loadInitialHotels() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === null) {
                const samples = cloneSamples();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
                return samples;
            }
            const parsed = JSON.parse(stored);
            if (!isValidHotelList(parsed)) {
                throw new Error('Stored hotel data has an invalid structure.');
            }
            return parsed;
        } catch (error) {
            showToast('Hotel storage could not be read. Demonstration records are shown without replacing the saved value.');
            return cloneSamples();
        }
    }

    // Future adapter boundary: GET/POST/PUT/DELETE /api/hotels and GET /api/hotels/{id}.
    const HotelStore = {
        records: loadInitialHotels(),

        getAll: function () {
            return this.records.slice();
        },

        saveAll: function (records) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                this.records = records;
                return true;
            } catch (error) {
                showToast('Could not save to browser storage. Your changes were not applied.');
                return false;
            }
        },

        create: function (hotel) {
            if (this.records.some(function (record) { return record.id === hotel.id; })) {
                throw new Error('This hotel ID is already in use. Please try again.');
            }
            const updated = this.getAll();
            updated.push(hotel);
            return this.saveAll(updated);
        },

        update: function (id, hotel) {
            const index = this.records.findIndex(function (record) { return record.id === id; });
            if (index === -1) {
                throw new Error('This hotel could not be found. Refresh the page and try again.');
            }
            const updated = this.getAll();
            updated[index] = Object.assign({}, hotel, { id: id });
            return this.saveAll(updated);
        },

        remove: function (id) {
            const updated = this.records.filter(function (record) { return record.id !== id; });
            if (updated.length === this.records.length) {
                throw new Error('This hotel could not be found. Refresh the page and try again.');
            }
            return this.saveAll(updated);
        }
    };

    let editingId = null;
    let deletingId = null;
    let currentPage = 1;

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
        });
    }

    function safeImageUrl(value) {
        if (!value || typeof value !== 'string') return FALLBACK_IMAGE;
        const candidate = value.trim();
        try {
            const url = new URL(candidate, window.location.href);
            return url.protocol === 'http:' || url.protocol === 'https:' ? candidate : FALLBACK_IMAGE;
        } catch (error) {
            return FALLBACK_IMAGE;
        }
    }

    function isAllowedUrl(value) {
        if (!value) return true;
        try {
            const url = new URL(value.trim(), window.location.href);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }

    function formatCurrency(value) {
        const amount = Number(value);
        return 'LKR ' + (Number.isFinite(amount) ? amount.toLocaleString('en-LK', { maximumFractionDigits: 2 }) : '0');
    }

    function generateHotelId() {
        const records = HotelStore.getAll();
        const usedIds = new Set(records.map(function (hotel) { return hotel.id; }));
        let nextNumber = records.reduce(function (highest, hotel) {
            const match = /^HOT-(\d+)$/.exec(hotel.id);
            return match ? Math.max(highest, Number(match[1])) : highest;
        }, 0) + 1;
        let candidate;
        do {
            candidate = 'HOT-' + String(nextNumber).padStart(4, '0');
            nextNumber += 1;
        } while (usedIds.has(candidate));
        return candidate;
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
        const records = HotelStore.getAll();
        const selectedProvince = elements.provinceFilter.value;
        const selectedDistrict = elements.districtFilter.value;
        fillFilter(elements.provinceFilter, uniqueSorted(records.map(function (hotel) { return hotel.province; })), 'All provinces', selectedProvince);
        const matchingDistricts = selectedProvince ? records.filter(function (hotel) { return hotel.province === selectedProvince; }) : records;
        fillFilter(elements.districtFilter, uniqueSorted(matchingDistricts.map(function (hotel) { return hotel.district; })), 'All districts', selectedDistrict);
    }

    function getVisibleHotels() {
        const query = elements.search.value.trim().toLocaleLowerCase();
        const selectedProvince = elements.provinceFilter.value;
        const selectedDistrict = elements.districtFilter.value;
        const selectedRating = elements.ratingFilter.value;
        const selectedStatus = elements.statusFilter.value;
        const featuredOnly = elements.featuredFilter.checked;
        const visible = HotelStore.getAll().filter(function (hotel) {
            const searchable = [hotel.id, hotel.name, hotel.city, hotel.district, hotel.contact].join(' ').toLocaleLowerCase();
            return (!query || searchable.includes(query)) &&
                (!selectedProvince || hotel.province === selectedProvince) &&
                (!selectedDistrict || hotel.district === selectedDistrict) &&
                (!selectedRating || Number(hotel.rating) === Number(selectedRating)) &&
                (!selectedStatus || hotel.status === selectedStatus) &&
                (!featuredOnly || hotel.featured === true);
        });
        const sortBy = elements.sortFilter.value;
        visible.sort(function (left, right) {
            if (sortBy === 'price') return Number(left.price) - Number(right.price);
            if (sortBy === 'rating') return Number(right.rating) - Number(left.rating);
            if (sortBy === 'city') return left.city.localeCompare(right.city) || left.name.localeCompare(right.name);
            return left.name.localeCompare(right.name);
        });
        return visible;
    }

    function renderStatistics() {
        const records = HotelStore.getAll();
        const activeCount = records.filter(function (hotel) { return hotel.status === 'Active'; }).length;
        const ratingTotal = records.reduce(function (total, hotel) { return total + (Number(hotel.rating) || 0); }, 0);
        document.getElementById('totalHotels').textContent = String(records.length);
        document.getElementById('activeHotels').textContent = String(activeCount);
        document.getElementById('inactiveHotels').textContent = String(records.length - activeCount);
        document.getElementById('averageRating').textContent = records.length ? (ratingTotal / records.length).toFixed(1) : '0.0';
    }

    function statusBadge(status) {
        const active = status === 'Active';
        return '<span class="badge rounded-pill ' + (active ? 'hotel-status-active' : 'hotel-status-inactive') + '">' + escapeHtml(status || 'Inactive') + '</span>';
    }

    function renderRow(hotel) {
        const imageUrl = escapeHtml(safeImageUrl(hotel.image));
        const roomTypes = Array.isArray(hotel.roomTypes) ? hotel.roomTypes.join(', ') : '';
        return '<tr>' +
            '<td class="text-nowrap">' + escapeHtml(hotel.id) + '</td>' +
            '<td><img class="hotel-thumbnail" src="' + imageUrl + '" alt="' + escapeHtml(hotel.name) + '" loading="lazy"></td>' +
            '<td class="hotel-name-cell">' + escapeHtml(hotel.name) + (hotel.featured ? '<span class="badge text-bg-warning-subtle ms-1">Featured</span>' : '') + '</td>' +
            '<td class="hotel-location">' + escapeHtml(hotel.city) + '<span class="d-block text-muted small">' + escapeHtml(hotel.district) + '</span></td>' +
            '<td class="hotel-rating"><i class="bi bi-star-fill"></i> ' + escapeHtml(hotel.rating) + '</td>' +
            '<td><span class="hotel-room-list">' + escapeHtml(roomTypes) + '</span></td>' +
            '<td class="text-nowrap">' + escapeHtml(formatCurrency(hotel.price)) + '</td>' +
            '<td class="text-nowrap">' + escapeHtml(hotel.contact) + '</td>' +
            '<td>' + statusBadge(hotel.status) + '</td>' +
            '<td><div class="hotel-actions">' +
                '<button class="btn btn-outline-secondary" type="button" data-action="view" data-id="' + escapeHtml(hotel.id) + '" aria-label="View ' + escapeHtml(hotel.name) + '" title="View"><i class="bi bi-eye"></i></button>' +
                '<button class="btn btn-outline-success" type="button" data-action="edit" data-id="' + escapeHtml(hotel.id) + '" aria-label="Edit ' + escapeHtml(hotel.name) + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-outline-danger" type="button" data-action="delete" data-id="' + escapeHtml(hotel.id) + '" aria-label="Delete ' + escapeHtml(hotel.name) + '" title="Delete"><i class="bi bi-trash3"></i></button>' +
            '</div></td></tr>';
    }

    function renderPagination(total, pageCount) {
        const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
        const end = Math.min(currentPage * PAGE_SIZE, total);
        elements.paginationSummary.textContent = total ? 'Showing ' + start + '-' + end + ' of ' + total + ' hotels' : 'No hotels to display';
        if (pageCount <= 1) {
            elements.pagination.innerHTML = '';
            return;
        }
        let html = '<li class="page-item ' + (currentPage === 1 ? 'disabled' : '') + '"><button class="page-link" type="button" data-page="' + (currentPage - 1) + '" aria-label="Previous page">&laquo;</button></li>';
        for (let page = 1; page <= pageCount; page += 1) {
            html += '<li class="page-item ' + (page === currentPage ? 'active' : '') + '"><button class="page-link" type="button" data-page="' + page + '" aria-current="' + (page === currentPage ? 'page' : 'false') + '">' + page + '</button></li>';
        }
        html += '<li class="page-item ' + (currentPage === pageCount ? 'disabled' : '') + '"><button class="page-link" type="button" data-page="' + (currentPage + 1) + '" aria-label="Next page">&raquo;</button></li>';
        elements.pagination.innerHTML = html;
    }

    function renderHotels() {
        const hotels = getVisibleHotels();
        const pageCount = Math.ceil(hotels.length / PAGE_SIZE);
        currentPage = Math.min(Math.max(currentPage, 1), Math.max(pageCount, 1));
        elements.hotelCount.textContent = hotels.length + (hotels.length === 1 ? ' hotel' : ' hotels');
        if (!hotels.length) {
            elements.tableBody.innerHTML = '<tr><td class="hotel-empty-cell" colspan="10"><i class="bi bi-building"></i><strong>No hotels found</strong><p class="text-muted mb-3">Try adjusting your search or filters, or add a hotel.</p><button class="btn btn-emerald btn-sm" type="button" data-action="add">Add New Hotel</button></td></tr>';
            renderPagination(0, 0);
            return;
        }
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        elements.tableBody.innerHTML = hotels.slice(startIndex, startIndex + PAGE_SIZE).map(renderRow).join('');
        elements.tableBody.querySelectorAll('.hotel-thumbnail').forEach(function (image) {
            image.addEventListener('error', function () {
                if (image.getAttribute('src') !== FALLBACK_IMAGE) image.src = FALLBACK_IMAGE;
            }, { once: true });
        });
        renderPagination(hotels.length, pageCount);
    }

    function refreshPage(resetPage) {
        if (resetPage) currentPage = 1;
        refreshFilterOptions();
        renderStatistics();
        renderHotels();
    }

    function closeSidebar() {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-visible');
        elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    function showForm(hotel) {
        editingId = hotel ? hotel.id : null;
        elements.form.reset();
        elements.form.classList.remove('was-validated');
        elements.formError.classList.add('d-none');
        elements.formError.textContent = '';
        document.getElementById('hotelFormTitle').textContent = hotel ? 'Edit Hotel' : 'Add New Hotel';
        document.getElementById('saveHotelLabel').textContent = hotel ? 'Save Changes' : 'Save Hotel';
        document.getElementById('hotelId').value = hotel ? hotel.id : generateHotelId();
        if (hotel) {
            document.getElementById('hotelName').value = hotel.name || '';
            document.getElementById('hotelDescription').value = hotel.description || '';
            document.getElementById('hotelAddress').value = hotel.address || '';
            document.getElementById('hotelCity').value = hotel.city || '';
            document.getElementById('hotelDistrict').value = hotel.district || '';
            document.getElementById('hotelProvince').value = hotel.province || '';
            document.getElementById('hotelContact').value = hotel.contact || '';
            document.getElementById('hotelEmail').value = hotel.email || '';
            document.getElementById('hotelWebsite').value = hotel.website || '';
            document.getElementById('hotelRating').value = String(hotel.rating || '');
            document.getElementById('hotelPrice').value = hotel.price == null ? '' : hotel.price;
            document.getElementById('hotelRooms').value = hotel.rooms == null ? '' : hotel.rooms;
            document.getElementById('hotelCheckIn').value = hotel.checkIn || '';
            document.getElementById('hotelCheckOut').value = hotel.checkOut || '';
            document.getElementById('hotelImage').value = hotel.image || '';
            document.getElementById('hotelFeatured').value = String(hotel.featured === true);
            document.getElementById('hotelStatus').value = hotel.status || 'Active';
            const selectedTypes = Array.isArray(hotel.roomTypes) ? hotel.roomTypes : [];
            Array.from(document.getElementById('hotelRoomTypes').options).forEach(function (option) {
                option.selected = selectedTypes.includes(option.value);
            });
            const facilities = Array.isArray(hotel.facilities) ? hotel.facilities : [];
            document.querySelectorAll('#facilityOptions input').forEach(function (checkbox) {
                checkbox.checked = facilities.includes(checkbox.value);
            });
        }
        elements.formModal.show();
    }

    function readHotelForm() {
        return {
            id: document.getElementById('hotelId').value,
            name: document.getElementById('hotelName').value.trim(),
            description: document.getElementById('hotelDescription').value.trim(),
            address: document.getElementById('hotelAddress').value.trim(),
            city: document.getElementById('hotelCity').value.trim(),
            district: document.getElementById('hotelDistrict').value.trim(),
            province: document.getElementById('hotelProvince').value,
            contact: document.getElementById('hotelContact').value.trim(),
            email: document.getElementById('hotelEmail').value.trim(),
            website: document.getElementById('hotelWebsite').value.trim(),
            rating: Number(document.getElementById('hotelRating').value),
            roomTypes: Array.from(document.getElementById('hotelRoomTypes').selectedOptions).map(function (option) { return option.value; }),
            price: Number(document.getElementById('hotelPrice').value),
            rooms: Number(document.getElementById('hotelRooms').value),
            checkIn: document.getElementById('hotelCheckIn').value,
            checkOut: document.getElementById('hotelCheckOut').value,
            facilities: Array.from(document.querySelectorAll('#facilityOptions input:checked')).map(function (checkbox) { return checkbox.value; }),
            image: document.getElementById('hotelImage').value.trim(),
            featured: document.getElementById('hotelFeatured').value === 'true',
            status: document.getElementById('hotelStatus').value
        };
    }

    function validateForm(hotel) {
        const priceInput = document.getElementById('hotelPrice');
        const roomsInput = document.getElementById('hotelRooms');
        const imageInput = document.getElementById('hotelImage');
        const websiteInput = document.getElementById('hotelWebsite');
        priceInput.setCustomValidity(Number.isFinite(hotel.price) && hotel.price > 0 ? '' : 'Price must be greater than zero.');
        roomsInput.setCustomValidity(Number.isInteger(hotel.rooms) && hotel.rooms >= 0 ? '' : 'Available rooms must be a whole number of zero or more.');
        imageInput.setCustomValidity(isAllowedUrl(hotel.image) ? '' : 'Enter an HTTP, HTTPS, or relative image URL.');
        websiteInput.setCustomValidity(isAllowedUrl(hotel.website) ? '' : 'Enter an HTTP or HTTPS website URL.');
        elements.form.classList.add('was-validated');
        if (elements.form.checkValidity()) return true;
        elements.form.reportValidity();
        return false;
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        elements.formError.classList.add('d-none');
        const hotel = readHotelForm();
        if (!validateForm(hotel)) return;
        try {
            if (editingId) {
                if (!HotelStore.getAll().some(function (record) { return record.id === editingId; })) {
                    throw new Error('This hotel could not be found. Refresh the page and try again.');
                }
                hotel.id = editingId;
                if (HotelStore.update(editingId, hotel)) {
                    elements.formModal.hide();
                    refreshPage(true);
                    showToast(hotel.name + ' was updated successfully.');
                }
            } else {
                hotel.id = generateHotelId();
                if (HotelStore.create(hotel)) {
                    elements.formModal.hide();
                    refreshPage(true);
                    showToast(hotel.name + ' was added successfully.');
                }
            }
        } catch (error) {
            elements.formError.textContent = error.message;
            elements.formError.classList.remove('d-none');
        }
    }

    function detailItem(label, value) {
        return '<div class="hotel-detail-item"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || 'Not provided') + '</strong></div>';
    }

    function showDetails(id) {
        const hotel = HotelStore.getAll().find(function (record) { return record.id === id; });
        if (!hotel) {
            showToast('This hotel could not be found.');
            return;
        }
        const roomTypes = Array.isArray(hotel.roomTypes) ? hotel.roomTypes.join(', ') : 'Not provided';
        const facilities = Array.isArray(hotel.facilities) && hotel.facilities.length ? hotel.facilities.join(', ') : 'None listed';
        const statusClass = hotel.status === 'Active' ? 'hotel-status-active' : 'hotel-status-inactive';
        const content = document.getElementById('hotelDetailsContent');
        content.innerHTML = '<div class="position-relative"><img class="hotel-details-image" src="' + escapeHtml(safeImageUrl(hotel.image)) + '" alt="' + escapeHtml(hotel.name) + '"><button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3 bg-dark bg-opacity-50 p-2" data-bs-dismiss="modal" aria-label="Close"></button></div>' +
            '<div class="hotel-details-content"><div class="d-flex flex-wrap align-items-center gap-2 mb-2"><span class="badge rounded-pill ' + statusClass + '">' + escapeHtml(hotel.status || 'Inactive') + '</span>' + (hotel.featured ? '<span class="badge text-bg-warning"><i class="bi bi-star-fill me-1"></i>Featured</span>' : '') + '</div>' +
            '<p class="text-muted small mb-1">' + escapeHtml(hotel.id) + '</p><h2 class="h3 fw-bold" id="hotelDetailsTitle">' + escapeHtml(hotel.name) + '</h2><p class="hotel-details-description">' + escapeHtml(hotel.description) + '</p>' +
            '<div class="hotel-details-grid">' + detailItem('Full address', [hotel.address, hotel.city, hotel.district + ' District', hotel.province + ' Province'].filter(Boolean).join(', ')) +
            detailItem('Contact number', hotel.contact) + detailItem('Email address', hotel.email) + detailItem('Website', hotel.website) +
            detailItem('Star rating', String(hotel.rating) + ' out of 5') + detailItem('Available room types', roomTypes) +
            detailItem('Price per night', formatCurrency(hotel.price)) + detailItem('Available rooms', String(hotel.rooms)) +
            detailItem('Check-in time', hotel.checkIn) + detailItem('Check-out time', hotel.checkOut) +
            detailItem('Facilities', facilities) + detailItem('Featured hotel', hotel.featured ? 'Yes' : 'No') +
            detailItem('Hotel status', hotel.status) + '</div><div class="text-end mt-4"><button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button></div></div>';
        const image = content.querySelector('.hotel-details-image');
        image.addEventListener('error', function () {
            if (image.getAttribute('src') !== FALLBACK_IMAGE) image.src = FALLBACK_IMAGE;
        }, { once: true });
        elements.detailsModal.show();
    }

    function startDelete(id) {
        const hotel = HotelStore.getAll().find(function (record) { return record.id === id; });
        if (!hotel) {
            showToast('This hotel could not be found.');
            return;
        }
        deletingId = id;
        document.getElementById('deleteHotelName').textContent = hotel.name;
        document.getElementById('deleteHotelId').textContent = hotel.id;
        elements.deleteModal.show();
    }

    function confirmDelete() {
        if (!deletingId) return;
        const hotel = HotelStore.getAll().find(function (record) { return record.id === deletingId; });
        try {
            if (HotelStore.remove(deletingId)) {
                elements.deleteModal.hide();
                refreshPage(true);
                showToast((hotel ? hotel.name : 'Hotel') + ' was deleted.');
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
    document.getElementById('addHotelButton').addEventListener('click', function () { showForm(null); });
    document.getElementById('resetFiltersButton').addEventListener('click', function () {
        elements.search.value = '';
        elements.provinceFilter.value = '';
        elements.districtFilter.value = '';
        elements.ratingFilter.value = '';
        elements.statusFilter.value = '';
        elements.featuredFilter.checked = false;
        elements.sortFilter.value = 'name';
        refreshPage(true);
    });
    elements.search.addEventListener('input', function () { refreshPage(true); });
    [elements.provinceFilter, elements.districtFilter, elements.ratingFilter, elements.statusFilter, elements.featuredFilter, elements.sortFilter].forEach(function (control) {
        control.addEventListener('change', function () { refreshPage(true); });
    });
    elements.form.addEventListener('submit', handleFormSubmit);
    ['hotelPrice', 'hotelRooms', 'hotelImage', 'hotelWebsite'].forEach(function (id) {
        document.getElementById(id).addEventListener('input', function () { this.setCustomValidity(''); });
    });
    elements.tableBody.addEventListener('click', function (event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        if (button.dataset.action === 'add') {
            showForm(null);
            return;
        }
        const hotel = HotelStore.getAll().find(function (record) { return record.id === button.dataset.id; });
        if (!hotel) {
            showToast('This hotel could not be found.');
            return;
        }
        if (button.dataset.action === 'view') showDetails(hotel.id);
        if (button.dataset.action === 'edit') showForm(hotel);
        if (button.dataset.action === 'delete') startDelete(hotel.id);
    });
    elements.pagination.addEventListener('click', function (event) {
        const button = event.target.closest('[data-page]');
        if (!button || button.parentElement.classList.contains('disabled')) return;
        currentPage = Number(button.dataset.page);
        renderHotels();
    });
    document.getElementById('confirmDeleteButton').addEventListener('click', confirmDelete);
    document.getElementById('deleteHotelModal').addEventListener('hidden.bs.modal', function () { deletingId = null; });

    refreshPage(true);
});