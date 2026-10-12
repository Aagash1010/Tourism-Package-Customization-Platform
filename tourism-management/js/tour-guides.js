/**
 * Ceylon Explore - Tour Guide Management
 * Browser storage is isolated behind GuideStore so it can later be replaced by a REST adapter.
 */
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const STORAGE_KEY = 'ceylonExploreTourGuides';
    const FALLBACK_IMAGE = 'assets/images/hero-bg.jpg';
    const PAGE_SIZE = 5;
    const sampleGuides = [
        {
            id: 'GUIDE-0001',
            fullName: 'Nimal Perera',
            profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
            dob: '1988-05-12',
            gender: 'Male',
            nationality: 'Sri Lankan',
            contact: '+94 77 100 2201',
            email: 'nimal.perera@example.com',
            address: '15 Lake Road',
            city: 'Colombo',
            district: 'Colombo',
            licenseNumber: 'SLTG-1178',
            yearsOfExperience: 9,
            qualification: 'Bachelor of Tourism Management',
            specialization: 'Cultural Tours',
            languages: ['Sinhala', 'English', 'Tamil'],
            dailyRate: 9500,
            biography: 'Experienced cultural guide offering city and heritage tours for families and groups.',
            certifications: 'Certified Heritage Guide, First Aid Training',
            availability: 'Available',
            employmentStatus: 'Active',
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            preferredTourTypes: ['Cultural Tours', 'City Tours'],
            maxGroupSize: 15,
            rating: 4.7
        },
        {
            id: 'GUIDE-0002',
            fullName: 'Anusha Fernando',
            profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
            dob: '1992-11-28',
            gender: 'Female',
            nationality: 'Sri Lankan',
            contact: '+94 71 240 8844',
            email: 'anusha.fernando@example.com',
            address: '42 Temple Lane',
            city: 'Kandy',
            district: 'Kandy',
            licenseNumber: 'SLTG-2049',
            yearsOfExperience: 7,
            qualification: 'Diploma in Tour Guiding',
            specialization: 'Wildlife Tours',
            languages: ['English', 'Sinhala'],
            dailyRate: 8200,
            biography: 'Passionate wildlife guide specialising in eco-tourism and nature excursions across central Sri Lanka.',
            certifications: 'Wildlife Interpretation Certificate',
            availability: 'Busy',
            employmentStatus: 'Active',
            workingDays: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday'],
            preferredTourTypes: ['Wildlife Tours', 'Hiking Tours'],
            maxGroupSize: 10,
            rating: 4.5
        },
        {
            id: 'GUIDE-0003',
            fullName: 'Harith Silva',
            profilePhoto: '',
            dob: '1985-03-17',
            gender: 'Male',
            nationality: 'Sri Lankan',
            contact: '+94 76 560 3302',
            email: 'harith.silva@example.com',
            address: '19 Old Galle Road',
            city: 'Galle',
            district: 'Galle',
            licenseNumber: 'SLTG-3381',
            yearsOfExperience: 12,
            qualification: 'Advanced Tourist Guide Certificate',
            specialization: 'Beach Holidays',
            languages: ['English', 'Sinhala', 'French'],
            dailyRate: 11750,
            biography: 'Seasoned beach and heritage guide with strong experience in coastal tourism and guest handling.',
            certifications: 'Hospitality & Guest Handling',
            availability: 'Available',
            employmentStatus: 'Active',
            workingDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
            preferredTourTypes: ['Beach Holidays', 'City Tours'],
            maxGroupSize: 20,
            rating: null
        },
        {
            id: 'GUIDE-0004',
            fullName: 'Mithila Jayawardene',
            profilePhoto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80',
            dob: '1990-09-04',
            gender: 'Female',
            nationality: 'Sri Lankan',
            contact: '+94 75 431 8012',
            email: 'mithila.jayawardene@example.com',
            address: '7 Hill Crest',
            city: 'Ella',
            district: 'Badulla',
            licenseNumber: 'SLTG-4107',
            yearsOfExperience: 5,
            qualification: 'Certificate in Tour Operations',
            specialization: 'Adventure Tours',
            languages: ['English', 'Sinhala', 'Japanese'],
            dailyRate: 6800,
            biography: 'Adventure-focused guide who leads hiking, nature, and scenic route experiences with a safety-first approach.',
            certifications: 'Outdoor Leadership Certificate',
            availability: 'Unavailable',
            employmentStatus: 'Inactive',
            workingDays: ['Thursday', 'Friday', 'Saturday', 'Sunday'],
            preferredTourTypes: ['Hiking Tours', 'Adventure Tours'],
            maxGroupSize: 8,
            rating: 4.2
        },
        {
            id: 'GUIDE-0005',
            fullName: 'Roshan Raman',
            profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
            dob: '1983-02-20',
            gender: 'Male',
            nationality: 'Sri Lankan',
            contact: '+94 78 945 6407',
            email: 'roshan.raman@example.com',
            address: '23 Palm Avenue',
            city: 'Jaffna',
            district: 'Jaffna',
            licenseNumber: 'SLTG-5812',
            yearsOfExperience: 15,
            qualification: 'Master in Tourism Studies',
            specialization: 'Cultural Tours',
            languages: ['Tamil', 'English', 'Sinhala'],
            dailyRate: 14300,
            biography: 'Recognised cultural storyteller with deep heritage knowledge across the northern cultural circuit.',
            certifications: 'UNESCO Heritage Interpretation Course',
            availability: 'Available',
            employmentStatus: 'Active',
            workingDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
            preferredTourTypes: ['Cultural Tours', 'Family Tours'],
            maxGroupSize: 18,
            rating: 4.8
        }
    ];

    const elements = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        search: document.getElementById('guideSearch'),
        districtFilter: document.getElementById('districtFilter'),
        languageFilter: document.getElementById('languageFilter'),
        specializationFilter: document.getElementById('specializationFilter'),
        availabilityFilter: document.getElementById('availabilityFilter'),
        statusFilter: document.getElementById('statusFilter'),
        yearsFilter: document.getElementById('yearsFilter'),
        rateFilter: document.getElementById('rateFilter'),
        ratingFilter: document.getElementById('ratingFilter'),
        sortFilter: document.getElementById('sortFilter'),
        tableBody: document.getElementById('guideTableBody'),
        guideCount: document.getElementById('guideCount'),
        pagination: document.getElementById('guidePagination'),
        paginationSummary: document.getElementById('guidePaginationSummary'),
        form: document.getElementById('guideForm'),
        formModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('guideFormModal')),
        detailsModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('guideDetailsModal')),
        deleteModal: bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteGuideModal')),
        toast: bootstrap.Toast.getOrCreateInstance(document.getElementById('guideToast'), { delay: 3600 }),
        toastBody: document.getElementById('guideToastBody'),
        formError: document.getElementById('guideFormError')
    };

    function cloneSamples() {
        return sampleGuides.map(function (guide) {
            return Object.assign({}, guide, {
                languages: guide.languages ? guide.languages.slice() : [],
                workingDays: guide.workingDays ? guide.workingDays.slice() : [],
                preferredTourTypes: guide.preferredTourTypes ? guide.preferredTourTypes.slice() : []
            });
        });
    }

    function isValidGuideList(value) {
        return Array.isArray(value) && value.every(function (guide) {
            return guide && typeof guide === 'object' && typeof guide.id === 'string' && typeof guide.fullName === 'string';
        });
    }

    function showToast(message) {
        elements.toastBody.textContent = message;
        elements.toast.show();
    }

    function loadInitialGuides() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === null) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cloneSamples()));
                return cloneSamples();
            }
            const parsed = JSON.parse(stored);
            if (!isValidGuideList(parsed)) {
                throw new Error('Stored guide data has an invalid structure.');
            }
            return parsed;
        } catch (error) {
            showToast('Guide storage could not be read. Demonstration records are shown without replacing the saved value.');
            return cloneSamples();
        }
    }

    const GuideStore = {
        records: loadInitialGuides(),

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

        create: function (guide) {
            if (this.records.some(function (record) { return record.id === guide.id; })) {
                throw new Error('This guide ID is already in use. Please try again.');
            }
            const updated = this.getAll();
            updated.push(guide);
            return this.saveAll(updated);
        },

        update: function (id, guide) {
            const index = this.records.findIndex(function (record) { return record.id === id; });
            if (index === -1) {
                throw new Error('This guide could not be found. Refresh the page and try again.');
            }
            const updated = this.getAll();
            updated[index] = Object.assign({}, guide, { id: id });
            return this.saveAll(updated);
        },

        remove: function (id) {
            const updated = this.records.filter(function (record) { return record.id !== id; });
            if (updated.length === this.records.length) {
                throw new Error('This guide could not be found. Refresh the page and try again.');
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
            return (url.protocol === 'http:' || url.protocol === 'https:') ? candidate : FALLBACK_IMAGE;
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

    function generateGuideId() {
        const records = GuideStore.getAll();
        const usedIds = new Set(records.map(function (guide) { return guide.id; }));
        let nextNumber = records.reduce(function (highest, guide) {
            const match = /^GUIDE-(\d+)$/.exec(guide.id);
            return match ? Math.max(highest, Number(match[1])) : highest;
        }, 0) + 1;
        let candidate;
        do {
            candidate = 'GUIDE-' + String(nextNumber).padStart(4, '0');
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
        if (values.includes(selectedValue)) {
            select.value = selectedValue;
        }
    }

    function refreshFilterOptions() {
        const records = GuideStore.getAll();
        const selectedDistrict = elements.districtFilter.value;
        const selectedLanguage = elements.languageFilter.value;
        const selectedSpecialization = elements.specializationFilter.value;
        fillFilter(elements.districtFilter, uniqueSorted(records.map(function (guide) { return guide.district; })), 'All districts', selectedDistrict);
        fillFilter(elements.languageFilter, uniqueSorted(records.flatMap(function (guide) { return guide.languages || []; })), 'All languages', selectedLanguage);
        fillFilter(elements.specializationFilter, uniqueSorted(records.map(function (guide) { return guide.specialization; })), 'All specializations', selectedSpecialization);
    }

    function hasRating(guide) {
        return guide && guide.rating !== null && guide.rating !== undefined && Number.isFinite(Number(guide.rating));
    }

    function getVisibleGuides() {
        const query = elements.search.value.trim().toLowerCase();
        const district = elements.districtFilter.value;
        const language = elements.languageFilter.value;
        const specialization = elements.specializationFilter.value;
        const availability = elements.availabilityFilter.value;
        const status = elements.statusFilter.value;
        const yearsFilter = elements.yearsFilter.value;
        const rateFilter = elements.rateFilter.value;
        const ratingFilter = elements.ratingFilter.value;
        const sortBy = elements.sortFilter.value;

        const visible = GuideStore.getAll().filter(function (guide) {
            const searchable = [
                guide.id,
                guide.fullName,
                guide.contact,
                guide.email,
                guide.licenseNumber,
                guide.city,
                guide.district,
                (guide.languages || []).join(' '),
                guide.specialization
            ].join(' ').toLowerCase();

            const matchesQuery = !query || searchable.includes(query);
            const matchesDistrict = !district || guide.district === district;
            const matchesLanguage = !language || (guide.languages || []).includes(language);
            const matchesSpecialization = !specialization || guide.specialization === specialization;
            const matchesAvailability = !availability || guide.availability === availability;
            const matchesStatus = !status || guide.employmentStatus === status;
            const matchesYears = !yearsFilter || (function () {
                const yearsValue = Number(guide.yearsOfExperience);
                if (yearsFilter === '16+') return yearsValue >= 16;
                const [min, max] = yearsFilter.split('-').map(Number);
                return yearsValue >= min && yearsValue <= max;
            })();
            const matchesRate = !rateFilter || (function () {
                const rateValue = Number(guide.dailyRate);
                if (rateFilter === '20000+') return rateValue >= 20000;
                const [min, max] = rateFilter.split('-').map(Number);
                return rateValue >= min && rateValue <= max;
            })();
            const matchesRating = !ratingFilter || (function () {
                const guideRating = Number(guide.rating);
                return hasRating(guide) && guideRating >= Number(ratingFilter);
            })();

            return matchesQuery && matchesDistrict && matchesLanguage && matchesSpecialization && matchesAvailability && matchesStatus && matchesYears && matchesRate && matchesRating;
        });

        visible.sort(function (left, right) {
            if (sortBy === 'dailyRate') return Number(right.dailyRate) - Number(left.dailyRate);
            if (sortBy === 'yearsExperience') return Number(right.yearsOfExperience) - Number(left.yearsOfExperience);
            if (sortBy === 'rating') {
                const leftRating = Number(left.rating) || 0;
                const rightRating = Number(right.rating) || 0;
                return rightRating - leftRating;
            }
            return left.fullName.localeCompare(right.fullName) || left.id.localeCompare(right.id);
        });

        return visible;
    }

    function renderStatistics() {
        const records = GuideStore.getAll();
        const activeCount = records.filter(function (guide) { return guide.employmentStatus === 'Active'; }).length;
        const availableCount = records.filter(function (guide) { return guide.availability === 'Available'; }).length;
        const ratedGuides = records.filter(function (guide) { return hasRating(guide); });
        const ratingTotal = ratedGuides.reduce(function (total, guide) { return total + Number(guide.rating); }, 0);

        document.getElementById('totalGuides').textContent = String(records.length);
        document.getElementById('activeGuides').textContent = String(activeCount);
        document.getElementById('availableGuides').textContent = String(availableCount);

        const averageRatingField = document.getElementById('averageRating');
        if (!ratedGuides.length) {
            averageRatingField.textContent = 'No ratings';
            return;
        }
        averageRatingField.textContent = (ratingTotal / ratedGuides.length).toFixed(1) + '/5';
    }

    function statusBadge(status) {
        const active = status === 'Active';
        return '<span class="badge rounded-pill ' + (active ? 'guide-status-active' : 'guide-status-inactive') + '">' + escapeHtml(status || 'Inactive') + '</span>';
    }

    function availabilityBadge(availability) {
        const label = availability || 'Unavailable';
        const className = label === 'Available' ? 'guide-avail-available' : label === 'Busy' ? 'guide-avail-busy' : 'guide-avail-unavailable';
        return '<span class="badge rounded-pill ' + className + '">' + escapeHtml(label) + '</span>';
    }

    function renderRow(guide) {
        const imageUrl = escapeHtml(safeImageUrl(guide.profilePhoto));
        const languages = Array.isArray(guide.languages) ? guide.languages.join(', ') : 'Not specified';
        const ratingText = hasRating(guide) ? Number(guide.rating).toFixed(1) : 'No rating';
        return '<tr>' +
            '<td class="text-nowrap">' + escapeHtml(guide.id) + '</td>' +
            '<td><img class="guide-thumbnail" src="' + imageUrl + '" alt="' + escapeHtml(guide.fullName) + '" loading="lazy"></td>' +
            '<td class="guide-name-cell">' + escapeHtml(guide.fullName) + '</td>' +
            '<td class="text-nowrap">' + escapeHtml(guide.contact) + '</td>' +
            '<td class="text-nowrap">' + escapeHtml(guide.email) + '</td>' +
            '<td><span class="guide-language-list">' + escapeHtml(languages) + '</span></td>' +
            '<td><span class="guide-specialization">' + escapeHtml(guide.specialization || 'Not specified') + '</span></td>' +
            '<td class="text-nowrap">' + escapeHtml(formatCurrency(guide.dailyRate)) + '</td>' +
            '<td class="guide-rating"><i class="bi bi-star-fill"></i> ' + escapeHtml(ratingText) + '</td>' +
            '<td>' + availabilityBadge(guide.availability) + '</td>' +
            '<td>' + statusBadge(guide.employmentStatus) + '</td>' +
            '<td><div class="guide-actions">' +
                '<button class="btn btn-outline-secondary" type="button" data-action="view" data-id="' + escapeHtml(guide.id) + '" aria-label="View ' + escapeHtml(guide.fullName) + '" title="View"><i class="bi bi-eye"></i></button>' +
                '<button class="btn btn-outline-success" type="button" data-action="edit" data-id="' + escapeHtml(guide.id) + '" aria-label="Edit ' + escapeHtml(guide.fullName) + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-outline-danger" type="button" data-action="delete" data-id="' + escapeHtml(guide.id) + '" aria-label="Delete ' + escapeHtml(guide.fullName) + '" title="Delete"><i class="bi bi-trash3"></i></button>' +
            '</div></td></tr>';
    }

    function renderPagination(total, pageCount) {
        const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
        const end = Math.min(currentPage * PAGE_SIZE, total);
        elements.paginationSummary.textContent = total ? 'Showing ' + start + '-' + end + ' of ' + total + ' guides' : 'No guides to display';
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

    function renderGuides() {
        const guides = getVisibleGuides();
        const pageCount = Math.ceil(guides.length / PAGE_SIZE);
        currentPage = Math.min(Math.max(currentPage, 1), Math.max(pageCount, 1));
        elements.guideCount.textContent = guides.length + (guides.length === 1 ? ' guide' : ' guides');

        if (!guides.length) {
            elements.tableBody.innerHTML = '<tr><td class="guide-empty-cell" colspan="12"><i class="bi bi-person-badge"></i><strong>No guides found</strong><p class="text-muted mb-3">Try adjusting your search or filters, or add a guide.</p><button class="btn btn-emerald btn-sm" type="button" data-action="add">Add New Guide</button></td></tr>';
            renderPagination(0, 0);
            return;
        }

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        elements.tableBody.innerHTML = guides.slice(startIndex, startIndex + PAGE_SIZE).map(renderRow).join('');
        elements.tableBody.querySelectorAll('.guide-thumbnail').forEach(function (image) {
            image.addEventListener('error', function () {
                if (image.getAttribute('src') !== FALLBACK_IMAGE) image.src = FALLBACK_IMAGE;
            }, { once: true });
        });
        renderPagination(guides.length, pageCount);
    }

    function refreshPage(resetPage) {
        if (resetPage) currentPage = 1;
        refreshFilterOptions();
        renderStatistics();
        renderGuides();
    }

    function closeSidebar() {
        elements.sidebar.classList.remove('is-open');
        elements.sidebarBackdrop.classList.remove('is-visible');
        elements.sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    function showForm(guide) {
        editingId = guide ? guide.id : null;
        elements.form.reset();
        elements.form.classList.remove('was-validated');
        elements.formError.classList.add('d-none');
        elements.formError.textContent = '';
        document.getElementById('guideFormTitle').textContent = guide ? 'Edit Guide' : 'Add New Guide';
        document.getElementById('saveGuideLabel').textContent = guide ? 'Save Changes' : 'Save Guide';
        document.getElementById('guideId').value = guide ? guide.id : generateGuideId();

        if (guide) {
            document.getElementById('guideFullName').value = guide.fullName || '';
            document.getElementById('guideProfilePhoto').value = guide.profilePhoto || '';
            document.getElementById('guideDob').value = guide.dob || '';
            document.getElementById('guideGender').value = guide.gender || '';
            document.getElementById('guideNationality').value = guide.nationality || '';
            document.getElementById('guideContact').value = guide.contact || '';
            document.getElementById('guideEmail').value = guide.email || '';
            document.getElementById('guideAddress').value = guide.address || '';
            document.getElementById('guideCity').value = guide.city || '';
            document.getElementById('guideDistrict').value = guide.district || '';
            document.getElementById('guideLicenseNumber').value = guide.licenseNumber || '';
            document.getElementById('guideYearsExperience').value = guide.yearsOfExperience == null ? '' : guide.yearsOfExperience;
            document.getElementById('guideQualification').value = guide.qualification || '';
            document.getElementById('guideSpecialization').value = guide.specialization || '';
            document.getElementById('guideDailyRate').value = guide.dailyRate == null ? '' : guide.dailyRate;
            document.getElementById('guideBiography').value = guide.biography || '';
            document.getElementById('guideCertifications').value = guide.certifications || '';
            document.getElementById('guideAvailability').value = guide.availability || 'Available';
            document.getElementById('guideEmploymentStatus').value = guide.employmentStatus || 'Active';
            document.getElementById('guideMaxGroupSize').value = guide.maxGroupSize == null ? '' : guide.maxGroupSize;
            document.getElementById('guideRating').value = guide.rating == null ? '' : String(guide.rating);

            const selectedLanguages = Array.isArray(guide.languages) ? guide.languages : [];
            Array.from(document.getElementById('guideLanguages').options).forEach(function (option) {
                option.selected = selectedLanguages.includes(option.value);
            });
            const selectedWorkingDays = Array.isArray(guide.workingDays) ? guide.workingDays : [];
            Array.from(document.getElementById('guideWorkingDays').options).forEach(function (option) {
                option.selected = selectedWorkingDays.includes(option.value);
            });
            const selectedTourTypes = Array.isArray(guide.preferredTourTypes) ? guide.preferredTourTypes : [];
            Array.from(document.getElementById('guideTourTypes').options).forEach(function (option) {
                option.selected = selectedTourTypes.includes(option.value);
            });
        }

        elements.formModal.show();
    }

    function readGuideForm() {
        return {
            id: document.getElementById('guideId').value.trim(),
            fullName: document.getElementById('guideFullName').value.trim(),
            profilePhoto: document.getElementById('guideProfilePhoto').value.trim(),
            dob: document.getElementById('guideDob').value,
            gender: document.getElementById('guideGender').value,
            nationality: document.getElementById('guideNationality').value.trim(),
            contact: document.getElementById('guideContact').value.trim(),
            email: document.getElementById('guideEmail').value.trim(),
            address: document.getElementById('guideAddress').value.trim(),
            city: document.getElementById('guideCity').value.trim(),
            district: document.getElementById('guideDistrict').value.trim(),
            licenseNumber: document.getElementById('guideLicenseNumber').value.trim(),
            yearsOfExperience: Number(document.getElementById('guideYearsExperience').value),
            qualification: document.getElementById('guideQualification').value.trim(),
            specialization: document.getElementById('guideSpecialization').value.trim(),
            languages: Array.from(document.getElementById('guideLanguages').selectedOptions).map(function (option) { return option.value; }),
            dailyRate: Number(document.getElementById('guideDailyRate').value),
            biography: document.getElementById('guideBiography').value.trim(),
            certifications: document.getElementById('guideCertifications').value.trim(),
            availability: document.getElementById('guideAvailability').value,
            employmentStatus: document.getElementById('guideEmploymentStatus').value,
            workingDays: Array.from(document.getElementById('guideWorkingDays').selectedOptions).map(function (option) { return option.value; }),
            preferredTourTypes: Array.from(document.getElementById('guideTourTypes').selectedOptions).map(function (option) { return option.value; }),
            maxGroupSize: Number(document.getElementById('guideMaxGroupSize').value),
            rating: document.getElementById('guideRating').value === '' ? null : Number(document.getElementById('guideRating').value)
        };
    }

    function validateGuideForm(guide) {
        const profilePhoto = document.getElementById('guideProfilePhoto');
        const email = document.getElementById('guideEmail');
        const years = document.getElementById('guideYearsExperience');
        const dailyRate = document.getElementById('guideDailyRate');
        const maxGroupSize = document.getElementById('guideMaxGroupSize');
        const rating = document.getElementById('guideRating');

        let errorMessage = '';

        if (!guide.fullName) {
            errorMessage = 'Full name is required.';
        } else if (!guide.nationality) {
            errorMessage = 'Nationality is required.';
        } else if (!guide.contact) {
            errorMessage = 'Contact number is required.';
        } else if (!guide.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guide.email)) {
            errorMessage = 'Enter a valid email address.';
        } else if (!guide.address) {
            errorMessage = 'Address is required.';
        } else if (!guide.city) {
            errorMessage = 'City is required.';
        } else if (!guide.district) {
            errorMessage = 'District is required.';
        } else if (!guide.licenseNumber) {
            errorMessage = 'Guide license number is required.';
        } else if (!Number.isFinite(guide.yearsOfExperience) || guide.yearsOfExperience < 0) {
            errorMessage = 'Years of experience cannot be negative.';
        } else if (!guide.qualification) {
            errorMessage = 'Qualification is required.';
        } else if (!guide.specialization) {
            errorMessage = 'Specialization is required.';
        } else if (!guide.languages.length) {
            errorMessage = 'Select at least one language.';
        } else if (!Number.isFinite(guide.dailyRate) || guide.dailyRate <= 0) {
            errorMessage = 'Daily rate must be greater than zero.';
        } else if (!guide.biography) {
            errorMessage = 'Biography is required.';
        } else if (!guide.availability) {
            errorMessage = 'Availability status is required.';
        } else if (!guide.employmentStatus) {
            errorMessage = 'Employment status is required.';
        } else if (!guide.workingDays.length) {
            errorMessage = 'Select at least one working day.';
        } else if (!guide.preferredTourTypes.length) {
            errorMessage = 'Select at least one preferred tour type.';
        } else if (!Number.isFinite(guide.maxGroupSize) || guide.maxGroupSize <= 0) {
            errorMessage = 'Maximum group size must be greater than zero.';
        } else if (guide.profilePhoto && !isAllowedUrl(guide.profilePhoto)) {
            errorMessage = 'Enter a valid HTTP or HTTPS profile image URL.';
        } else if (guide.rating !== null && (!Number.isFinite(guide.rating) || guide.rating < 1 || guide.rating > 5)) {
            errorMessage = 'Rating must be between 1 and 5.';
        } else if (GuideStore.getAll().some(function (record) { return record.id !== editingId && record.id === guide.id; })) {
            errorMessage = 'This guide ID is already in use.';
        } else if (GuideStore.getAll().some(function (record) {
            return record.id !== editingId && String(record.licenseNumber || '').trim().toLowerCase() === String(guide.licenseNumber || '').trim().toLowerCase();
        })) {
            errorMessage = 'This license number is already in use.';
        }

        profilePhoto.setCustomValidity(guide.profilePhoto && !isAllowedUrl(guide.profilePhoto) ? 'Invalid URL' : '');
        email.setCustomValidity(!guide.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guide.email) ? 'Invalid email' : '');
        years.setCustomValidity(!Number.isFinite(guide.yearsOfExperience) || guide.yearsOfExperience < 0 ? 'Invalid experience' : '');
        dailyRate.setCustomValidity(!Number.isFinite(guide.dailyRate) || guide.dailyRate <= 0 ? 'Invalid rate' : '');
        maxGroupSize.setCustomValidity(!Number.isFinite(guide.maxGroupSize) || guide.maxGroupSize <= 0 ? 'Invalid group size' : '');
        rating.setCustomValidity(guide.rating !== null && (!Number.isFinite(guide.rating) || guide.rating < 1 || guide.rating > 5) ? 'Invalid rating' : '');

        elements.form.classList.add('was-validated');
        if (errorMessage) {
            elements.formError.textContent = errorMessage;
            elements.formError.classList.remove('d-none');
            elements.form.reportValidity();
            return false;
        }

        if (!elements.form.checkValidity()) {
            elements.formError.textContent = 'Please review the highlighted fields and try again.';
            elements.formError.classList.remove('d-none');
            elements.form.reportValidity();
            return false;
        }

        elements.formError.classList.add('d-none');
        return true;
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const guide = readGuideForm();
        if (!validateGuideForm(guide)) return;

        try {
            if (editingId) {
                guide.id = editingId;
                if (GuideStore.update(editingId, guide)) {
                    elements.formModal.hide();
                    refreshPage(true);
                    showToast(guide.fullName + ' was updated successfully.');
                }
            } else {
                guide.id = generateGuideId();
                if (GuideStore.create(guide)) {
                    elements.formModal.hide();
                    refreshPage(true);
                    showToast(guide.fullName + ' was added successfully.');
                }
            }
        } catch (error) {
            elements.formError.textContent = error.message;
            elements.formError.classList.remove('d-none');
        }
    }

    function detailItem(label, value) {
        return '<div class="guide-detail-item"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || 'Not provided') + '</strong></div>';
    }

    function showDetails(id) {
        const guide = GuideStore.getAll().find(function (record) { return record.id === id; });
        if (!guide) {
            showToast('This guide could not be found.');
            return;
        }

        const imageUrl = safeImageUrl(guide.profilePhoto);
        const ratingText = hasRating(guide) ? Number(guide.rating).toFixed(1) + ' / 5' : 'Not rated yet';
        const languages = Array.isArray(guide.languages) && guide.languages.length ? guide.languages.join(', ') : 'Not specified';
        const workingDays = Array.isArray(guide.workingDays) && guide.workingDays.length ? guide.workingDays.join(', ') : 'Not specified';
        const preferredTourTypes = Array.isArray(guide.preferredTourTypes) && guide.preferredTourTypes.length ? guide.preferredTourTypes.join(', ') : 'Not specified';
        const certifications = guide.certifications || 'No certifications listed';
        const statusClass = guide.employmentStatus === 'Active' ? 'guide-status-active' : 'guide-status-inactive';
        const availabilityClass = guide.availability === 'Available' ? 'guide-avail-available' : guide.availability === 'Busy' ? 'guide-avail-busy' : 'guide-avail-unavailable';

        const content = document.getElementById('guideDetailsContent');
        content.innerHTML = '<div class="position-relative"><img class="guide-details-image" src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(guide.fullName) + '"><button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3 bg-dark bg-opacity-50 p-2" data-bs-dismiss="modal" aria-label="Close"></button></div>' +
            '<div class="guide-details-content"><div class="d-flex flex-wrap align-items-center gap-2 mb-2"><span class="badge rounded-pill ' + statusClass + '">' + escapeHtml(guide.employmentStatus || 'Inactive') + '</span><span class="badge rounded-pill ' + availabilityClass + '">' + escapeHtml(guide.availability || 'Unavailable') + '</span></div>' +
            '<p class="text-muted small mb-1">' + escapeHtml(guide.id) + '</p><h2 class="h3 fw-bold" id="guideDetailsTitleText">' + escapeHtml(guide.fullName) + '</h2><p class="guide-details-description">' + escapeHtml(guide.biography || 'No biography provided.') + '</p>' +
            '<div class="guide-details-grid">' +
            detailItem('Date of birth', guide.dob ? guide.dob : 'Not provided') +
            detailItem('Nationality', guide.nationality) +
            detailItem('Contact number', guide.contact) +
            detailItem('Email address', guide.email) +
            detailItem('Address', [guide.address, guide.city, guide.district].filter(Boolean).join(', ')) +
            detailItem('License number', guide.licenseNumber) +
            detailItem('Qualification', guide.qualification) +
            detailItem('Years of experience', String(guide.yearsOfExperience)) +
            detailItem('Specialization', guide.specialization) +
            detailItem('Languages spoken', languages) +
            detailItem('Certifications', certifications) +
            detailItem('Daily rate', formatCurrency(guide.dailyRate)) +
            detailItem('Maximum group size', String(guide.maxGroupSize)) +
            detailItem('Working days', workingDays) +
            detailItem('Preferred tour types', preferredTourTypes) +
            detailItem('Availability status', guide.availability) +
            detailItem('Employment status', guide.employmentStatus) +
            detailItem('Rating', ratingText) +
            '</div><div class="text-end mt-4"><button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button></div></div>';

        const image = content.querySelector('.guide-details-image');
        image.addEventListener('error', function () {
            if (image.getAttribute('src') !== FALLBACK_IMAGE) image.src = FALLBACK_IMAGE;
        }, { once: true });
        elements.detailsModal.show();
    }

    function startDelete(id) {
        const guide = GuideStore.getAll().find(function (record) { return record.id === id; });
        if (!guide) {
            showToast('This guide could not be found.');
            return;
        }

        deletingId = id;
        document.getElementById('deleteGuideName').textContent = guide.fullName;
        document.getElementById('deleteGuideId').textContent = guide.id;
        elements.deleteModal.show();
    }

    function confirmDelete() {
        if (!deletingId) return;
        const guide = GuideStore.getAll().find(function (record) { return record.id === deletingId; });
        try {
            if (GuideStore.remove(deletingId)) {
                elements.deleteModal.hide();
                refreshPage(true);
                showToast((guide ? guide.fullName : 'Guide') + ' was deleted.');
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

    document.getElementById('addGuideButton').addEventListener('click', function () { showForm(null); });
    document.getElementById('resetFiltersButton').addEventListener('click', function () {
        elements.search.value = '';
        elements.districtFilter.value = '';
        elements.languageFilter.value = '';
        elements.specializationFilter.value = '';
        elements.availabilityFilter.value = '';
        elements.statusFilter.value = '';
        elements.yearsFilter.value = '';
        elements.rateFilter.value = '';
        elements.ratingFilter.value = '';
        elements.sortFilter.value = 'name';
        refreshPage(true);
    });

    elements.search.addEventListener('input', function () { refreshPage(true); });
    [elements.districtFilter, elements.languageFilter, elements.specializationFilter, elements.availabilityFilter, elements.statusFilter, elements.yearsFilter, elements.rateFilter, elements.ratingFilter, elements.sortFilter].forEach(function (control) {
        control.addEventListener('change', function () { refreshPage(true); });
    });
    elements.form.addEventListener('submit', handleFormSubmit);
    ['guideProfilePhoto', 'guideYearsExperience', 'guideDailyRate', 'guideMaxGroupSize', 'guideRating'].forEach(function (id) {
        document.getElementById(id).addEventListener('input', function () { this.setCustomValidity(''); });
    });
    elements.tableBody.addEventListener('click', function (event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        if (button.dataset.action === 'add') {
            showForm(null);
            return;
        }

        const guide = GuideStore.getAll().find(function (record) { return record.id === button.dataset.id; });
        if (!guide) {
            showToast('This guide could not be found.');
            return;
        }

        if (button.dataset.action === 'view') showDetails(guide.id);
        if (button.dataset.action === 'edit') showForm(guide);
        if (button.dataset.action === 'delete') startDelete(guide.id);
    });
    elements.pagination.addEventListener('click', function (event) {
        const button = event.target.closest('[data-page]');
        if (!button || button.parentElement.classList.contains('disabled')) return;
        currentPage = Number(button.dataset.page);
        renderGuides();
    });
    document.getElementById('confirmDeleteGuideButton').addEventListener('click', confirmDelete);
    document.getElementById('deleteGuideModal').addEventListener('hidden.bs.modal', function () { deletingId = null; });

    refreshPage(true);
});
