/**
 * Ceylon Explore - Tourism Management System
 * Frontend Interactive Logic (Vanilla JavaScript)
 * Ready for future Java Spring Boot REST API Integration
 */

document.addEventListener('DOMContentLoaded', function () {
    // ----------------------------------------------------------------------
    // 1. DOM Element References
    // ----------------------------------------------------------------------
    const navbar = document.getElementById('mainNavbar');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarCollapse = document.getElementById('navbarContent');
    const backToTopBtn = document.getElementById('backToTopBtn');
    
    const heroSearchForm = document.getElementById('heroSearchForm');
    const searchDateInput = document.getElementById('searchDate');
    const contactForm = document.getElementById('contactForm');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const apiBaseUrl = 'http://' + window.location.hostname + ':8080';
    const homeDestinationGrid = document.getElementById('homeDestinationGrid');
    const homeDestinationStatus = document.getElementById('homeDestinationStatus');
    const homePackageGrid = document.getElementById('homePackageGrid');
    const homePackageStatus = document.getElementById('homePackageStatus');
    const homeHotelGrid = document.getElementById('homeHotelGrid');
    const homeHotelStatus = document.getElementById('homeHotelStatus');
    const searchDestination = document.getElementById('searchDestination');
    const packageRecords = new Map();
    const hotelRecords = new Map();
    let destinationRecords = [];
    
    // Demo Modal Elements
    const demoModalElement = document.getElementById('demoModal');
    const demoModal = new bootstrap.Modal(demoModalElement);
    const demoModalTitle = document.getElementById('demoModalTitle');
    const demoModalBody = document.getElementById('demoModalBody');

    // Set minimum date for search datepicker to today
    if (searchDateInput) {
        const today = new Date().toISOString().split('T')[0];
        searchDateInput.min = today;
    }

    // ----------------------------------------------------------------------
    // 2. Navbar Sticky & Scroll Background Effect
    // ----------------------------------------------------------------------
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
        
        // Back to Top Button Visibility
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('show-back-to-top');
        } else {
            backToTopBtn.classList.remove('show-back-to-top');
        }
        
        // Active Link Highlighting
        updateActiveNavLink();
    });

    // Back to top scroll click
    backToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Close mobile nav drawer when link clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }
        });
    });

    // ----------------------------------------------------------------------
    // 3. Dynamic Active Navigation Highlighting on Scroll
    // ----------------------------------------------------------------------
    const sections = document.querySelectorAll('header[id], section[id]');

    function updateActiveNavLink() {
        let scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
            const sectionId = current.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // ----------------------------------------------------------------------
    // 4. Hero Tour Search Form Validation & Interactivity
    // ----------------------------------------------------------------------
    if (heroSearchForm) {
        heroSearchForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const destinationId = Number(searchDestination.value);
            const selectedDestination = destinationRecords.find(function (destination) {
                return Number(destination.id) === destinationId;
            });
            const travelDate = searchDateInput.value;
            const travelers = Number(document.getElementById('searchTravelers').value);

            if (!selectedDestination || !travelDate) {
                showModal('Incomplete Search', '<p class="text-danger">Please select a database destination and travel date to search for packages.</p>');
                return;
            }

            const matchingPackages = Array.from(packageRecords.values()).filter(function (tourPackage) {
                const destinationMatches = Number(tourPackage.destinationId) === destinationId ||
                    normalizePackageName(tourPackage.destination).includes(normalizePackageName(selectedDestination.name));
                const dateMatches = (!tourPackage.startDate || travelDate >= tourPackage.startDate) &&
                    (!tourPackage.endDate || travelDate <= tourPackage.endDate);
                return destinationMatches && dateMatches && Number(tourPackage.maxTravelers || 0) >= travelers;
            });

            const resultsHtml = matchingPackages.length
                ? matchingPackages.map(function (tourPackage) {
                    const price = formatLkr(tourPackage.price);
                    return `<div class="p-3 bg-light rounded-3 text-start mb-3 border">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                            <strong class="text-dark">${escapeHtml(tourPackage.name)}</strong>
                            <span class="fw-bold text-emerald text-nowrap">${escapeHtml(price)}</span>
                        </div>
                        <div class="small text-muted mb-2">${escapeHtml(tourPackage.destination || '')} · ${escapeHtml(tourPackage.duration || '')}</div>
                        <button class="btn btn-emerald btn-sm rounded-pill btn-search-book" type="button" data-package-id="${escapeHtml(tourPackage.id)}">Book this package</button>
                    </div>`;
                }).join('')
                : '<p class="text-muted mb-0">No active database packages match this destination, date, and traveler count.</p>';

            showModal(
                'Database Package Search',
                `<div class="py-2">
                    <p class="text-muted small">Active packages for <strong>${escapeHtml(selectedDestination.name)}</strong>, departing ${escapeHtml(travelDate)}, for ${travelers} traveler(s):</p>
                    ${resultsHtml}
                </div>`
            );
        });
    }

    demoModalBody.addEventListener('click', function (event) {
        const button = event.target.closest('.btn-search-book');
        if (!button) return;
        const tourPackage = packageRecords.get(Number(button.dataset.packageId));
        if (!tourPackage) {
            showModal('Package unavailable', '<p class="text-danger mb-0">This package is no longer available. Reload the page and try again.</p>');
            return;
        }
        demoModal.hide();
        triggerBookingFlow(tourPackage.name, formatLkr(tourPackage.price));
    });

    // ----------------------------------------------------------------------
    // 5. Destination Card Buttons Interactivity
    // ----------------------------------------------------------------------
    if (homeDestinationGrid) {
        homeDestinationGrid.addEventListener('click', function (event) {
            const button = event.target.closest('.btn-explore');
            if (!button) {
                return;
            }

            const destinationName = button.dataset.destination;
            const destinationDescription = button.dataset.description;
            const destinationCategory = button.dataset.category;
            showModal(
                `Explore ${destinationName}`,
                `<div class="py-2">
                    <h5 class="fw-bold mb-2 text-emerald"><i class="bi bi-geo-alt-fill me-2"></i>${escapeHtml(destinationCategory)}</h5>
                    <p class="text-muted mb-3">${escapeHtml(destinationDescription)}</p>
                    <div class="d-grid">
                        <a href="#packages" class="btn btn-emerald rounded-pill" data-bs-dismiss="modal">View Tour Packages</a>
                    </div>
                </div>`
            );
        });
    }

    loadHomeDestinations();
    loadHomePackages();
    loadHomeHotels();

    async function loadHomeDestinations() {
        if (!homeDestinationGrid || !homeDestinationStatus) {
            return;
        }

        try {
            const response = await fetch(apiBaseUrl + '/api/destinations/active', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Destination request failed with status ' + response.status + '.');
            }

            const destinations = await response.json();
            if (!Array.isArray(destinations)) {
                throw new Error('The destination service returned an invalid response.');
            }

            destinationRecords = destinations;
            if (searchDestination) {
                searchDestination.replaceChildren(new Option('Where to go?', '', true, true));
                searchDestination.options[0].disabled = true;
                destinations.forEach(function (destination) {
                    searchDestination.add(new Option(destination.name, destination.id));
                });
            }

            homeDestinationGrid.innerHTML = destinations.map(function (destination) {
                const name = escapeHtml(destination.name);
                const category = escapeHtml(destination.category);
                const description = escapeHtml(destination.shortDescription || destination.fullDescription || '');
                const duration = escapeHtml(destination.duration || 'Visit duration not specified');
                const imageUrl = getDestinationImageUrl(destination.imageUrl);
                const image = imageUrl
                    ? `<img src="${escapeHtml(imageUrl)}" class="card-img-top destination-img" alt="${name}" loading="lazy">`
                    : '<div class="card-img-top destination-img d-flex align-items-center justify-content-center bg-light"><i class="bi bi-geo-alt text-secondary fs-1" aria-hidden="true"></i></div>';

                return `<div class="col-lg-4 col-md-6">
                    <div class="destination-card rounded-4 overflow-hidden shadow-sm h-100 bg-white border-0 position-relative">
                        <div class="card-img-wrapper position-relative overflow-hidden">
                            ${image}
                            <span class="badge-tag bg-emerald">${category}</span>
                        </div>
                        <div class="card-body p-4 d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h3 class="card-title h5 fw-bold mb-0">${name}</h3>
                            </div>
                            <p class="card-text text-muted small flex-grow-1">${description}</p>
                            <div class="pt-3 border-top d-flex justify-content-between align-items-center gap-2">
                                <span class="text-emerald fw-semibold small"><i class="bi bi-clock me-1"></i>${duration}</span>
                                <button class="btn btn-outline-emerald btn-sm rounded-pill px-3 btn-explore" type="button"
                                    data-destination="${name}" data-category="${category}" data-description="${description}">
                                    Explore More <i class="bi bi-arrow-right ms-1"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');

            homeDestinationStatus.textContent = destinations.length
                ? ''
                : 'No active destinations are available right now.';
        } catch (error) {
            console.error('Unable to load homepage destinations.', error);
            homeDestinationStatus.textContent = 'Destinations could not be loaded. Please try again later.';
            if (searchDestination) {
                searchDestination.replaceChildren(new Option('Destinations unavailable', '', true, true));
                searchDestination.options[0].disabled = true;
            }
        }
    }

    async function loadHomePackages() {
        if (!homePackageGrid || !homePackageStatus) return;
        try {
            const response = await fetch(apiBaseUrl + '/api/tour-packages/active', { credentials: 'include' });
            if (!response.ok) throw new Error('Package request failed with status ' + response.status + '.');
            const packages = await response.json();
            if (!Array.isArray(packages)) throw new Error('The package service returned an invalid response.');

            packageRecords.clear();
            packages.forEach(function (tourPackage) {
                if (tourPackage.id != null) packageRecords.set(Number(tourPackage.id), tourPackage);
            });
            homePackageGrid.innerHTML = packages.map(renderPackageCard).join('');
            homePackageStatus.textContent = packages.length ? '' : 'No active tour packages are available right now.';
        } catch (error) {
            console.error('Unable to load homepage tour packages.', error);
            homePackageStatus.textContent = 'Tour packages could not be loaded. Please try again later.';
        }
    }

    function renderPackageCard(tourPackage) {
        const name = escapeHtml(tourPackage.name || 'Tour package');
        const destination = escapeHtml(tourPackage.destination || 'Destination not specified');
        const duration = escapeHtml(tourPackage.duration || formatDuration(tourPackage));
        const price = escapeHtml(formatLkr(tourPackage.price));
        const category = escapeHtml(tourPackage.category || 'Tour package');
        const description = escapeHtml(tourPackage.description || 'No description provided.');
        const imageUrl = getDestinationImageUrl(tourPackage.imageUrl);
        const packageImage = imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" class="w-100 package-img" alt="${name}" loading="lazy">`
            : '<div class="w-100 package-img d-flex align-items-center justify-content-center bg-light"><i class="bi bi-image text-secondary fs-1" aria-hidden="true"></i></div>';
        const id = escapeHtml(tourPackage.id);

        return `<div class="col-lg-3 col-md-6">
            <div class="package-card rounded-4 border-0 shadow-sm overflow-hidden h-100 d-flex flex-column bg-white">
                <div class="package-img-container position-relative">
                    ${packageImage}
                    <span class="package-badge bg-emerald">${category}</span>
                </div>
                <div class="p-4 d-flex flex-column flex-grow-1">
                    <h3 class="h5 fw-bold mb-2">${name}</h3>
                    <div class="package-meta small text-muted mb-2">
                        <div><i class="bi bi-geo-alt-fill text-emerald me-1"></i>${destination}</div>
                        <div><i class="bi bi-clock-fill text-emerald me-1"></i>${duration}</div>
                    </div>
                    <p class="small text-muted">${description}</p>
                    <hr class="my-3 text-muted opacity-25">
                    <div class="mb-4">
                        <span class="small text-muted d-block">Price</span>
                        <span class="h4 fw-bold text-emerald mb-0">${price}</span>
                        <span class="small text-muted">/ person</span>
                    </div>
                    <div class="mt-auto d-grid gap-2">
                        <button class="btn btn-outline-emerald rounded-pill btn-sm fw-semibold btn-view-details" type="button" data-package-id="${id}">View Details</button>
                        <button class="btn btn-emerald rounded-pill btn-sm fw-semibold btn-book-now" type="button" data-package-id="${id}">Book Now</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    async function loadHomeHotels() {
        if (!homeHotelGrid || !homeHotelStatus) return;
        try {
            const response = await fetch(apiBaseUrl + '/api/hotels/active', { credentials: 'include' });
            if (!response.ok) throw new Error('Hotel request failed with status ' + response.status + '.');
            const hotels = await response.json();
            if (!Array.isArray(hotels)) throw new Error('The hotel service returned an invalid response.');

            hotelRecords.clear();
            hotels.forEach(function (hotel) {
                if (hotel.id != null) hotelRecords.set(Number(hotel.id), hotel);
            });
            homeHotelGrid.innerHTML = hotels.map(renderHotelCard).join('');
            homeHotelStatus.textContent = hotels.length ? '' : 'No active hotels are available right now.';
        } catch (error) {
            console.error('Unable to load homepage hotels.', error);
            homeHotelStatus.textContent = 'Hotels could not be loaded. Please try again later.';
        }
    }

    function renderHotelCard(hotel) {
        const name = escapeHtml(hotel.hotelName || 'Hotel');
        const location = escapeHtml([hotel.city, hotel.district, hotel.province, hotel.country].filter(Boolean).join(', '));
        const rating = Number(hotel.starRating);
        const facilities = Array.isArray(hotel.facilities) ? hotel.facilities : [];
        const description = escapeHtml(hotel.description || 'No description provided.');
        const imageUrl = getDestinationImageUrl(hotel.imageUrl);
        const hotelImage = imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" class="w-100 hotel-img" alt="${name}" loading="lazy">`
            : '<div class="w-100 hotel-img d-flex align-items-center justify-content-center bg-light"><i class="bi bi-building text-secondary fs-1" aria-hidden="true"></i></div>';

        return `<div class="col-lg-6 col-md-12">
            <div class="hotel-card h-100">
                ${hotelImage}
                <div class="hotel-content">
                    <div class="hotel-tier">${escapeHtml(String(hotel.hotelType || 'Hotel').replace(/_/g, ' '))}</div>
                    <div class="hotel-header">
                        <h4 class="hotel-title mb-0">${name}</h4>
                        ${Number.isFinite(rating) ? `<span class="hotel-rating"><i class="bi bi-star-fill me-1"></i>${escapeHtml(rating)} / 5</span>` : ''}
                    </div>
                    <p class="hotel-location"><i class="bi bi-geo-alt me-2"></i>${location || 'Location not specified'}</p>
                    <p class="hotel-tags">${escapeHtml(facilities.join(' · ') || 'No facilities listed')}</p>
                    <p class="hotel-description">${description}</p>
                    <button class="btn btn-outline-emerald rounded-pill w-100 hotel-button btn-hotel-info" type="button" data-hotel-id="${escapeHtml(hotel.id)}">View Details</button>
                </div>
            </div>
        </div>`;
    }

    function formatLkr(amount) {
        const value = Number(amount);
        return Number.isFinite(value)
            ? 'LKR ' + new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(value)
            : 'Price not specified';
    }

    function formatDuration(tourPackage) {
        if (!tourPackage.durationDays) return 'Duration not specified';
        const nights = Number(tourPackage.durationNights || 0);
        return tourPackage.durationDays + ' days' + (nights ? ' / ' + nights + ' nights' : '');
    }

    function getDestinationImageUrl(imageUrl) {
        if (typeof imageUrl !== 'string' || !imageUrl.trim() || imageUrl.trim().startsWith('//')) {
            return '';
        }

        try {
            const parsedUrl = new URL(imageUrl.trim(), window.location.href);
            return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
                ? parsedUrl.href
                : '';
        } catch (error) {
            return '';
        }
    }

    // ----------------------------------------------------------------------
    // 6. Tour Package Details & Booking Interactivity
    // ----------------------------------------------------------------------
    homePackageGrid.addEventListener('click', function (event) {
        const button = event.target.closest('.btn-view-details, .btn-book-now');
        if (!button) return;
        const tourPackage = packageRecords.get(Number(button.dataset.packageId));
        if (!tourPackage) {
            showModal('Package unavailable', '<p class="text-danger mb-0">This package is no longer available. Reload the page and try again.</p>');
            return;
        }

        if (button.classList.contains('btn-book-now')) {
            triggerBookingFlow(tourPackage.name, formatLkr(tourPackage.price));
            return;
        }

        const inclusions = tourPackage.inclusions
            ? `<h6 class="fw-bold text-dark mb-1">Inclusions</h6><p class="text-muted small">${escapeHtml(tourPackage.inclusions)}</p>`
            : '';
        const exclusions = tourPackage.exclusions
            ? `<h6 class="fw-bold text-dark mb-1">Exclusions</h6><p class="text-muted small">${escapeHtml(tourPackage.exclusions)}</p>`
            : '';
        const itinerary = Array.isArray(tourPackage.itinerary) && tourPackage.itinerary.length
            ? `<h6 class="fw-bold text-dark mb-1">Itinerary</h6><ul class="small text-muted">${tourPackage.itinerary.map(function (day) {
                return `<li><strong>Day ${escapeHtml(day.dayNumber)}: ${escapeHtml(day.title || '')}</strong>${day.description ? ' — ' + escapeHtml(day.description) : ''}</li>`;
            }).join('')}</ul>`
            : '';

        showModal(
            tourPackage.name + ' Details',
            `<div class="py-2">
                <div class="d-flex justify-content-between align-items-center gap-2 mb-3">
                    <span class="badge bg-emerald-subtle text-emerald px-3 py-2 rounded-pill"><i class="bi bi-clock me-1"></i>${escapeHtml(tourPackage.duration || formatDuration(tourPackage))}</span>
                    <span class="fw-bold h5 text-emerald mb-0">${escapeHtml(formatLkr(tourPackage.price))}</span>
                </div>
                <h6 class="fw-bold text-dark mb-1">Destination</h6>
                <p class="text-muted small mb-3">${escapeHtml(tourPackage.destination || 'Not specified')}</p>
                <p class="text-muted small">${escapeHtml(tourPackage.fullDescription || tourPackage.description || 'No description provided.')}</p>
                ${inclusions}${exclusions}${itinerary}
                <div class="d-grid">
                    <button class="btn btn-emerald rounded-pill fw-bold btn-modal-book-now" type="button" data-package-id="${escapeHtml(tourPackage.id)}">Book This Package</button>
                </div>
            </div>`
        );
    });

    demoModalBody.addEventListener('click', function (event) {
        const button = event.target.closest('.btn-modal-book-now');
        if (!button) return;
        const tourPackage = packageRecords.get(Number(button.dataset.packageId));
        if (!tourPackage) {
            showModal('Package unavailable', '<p class="text-danger mb-0">This package is no longer available. Reload the page and try again.</p>');
            return;
        }
        demoModal.hide();
        triggerBookingFlow(tourPackage.name, formatLkr(tourPackage.price));
    });

    function triggerBookingFlow(pkgName, pkgPrice) {
        showModal(
            `Book Tour: ${pkgName}`,
            `<form id="modalBookingForm" class="py-2">
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Package Selected</label>
                    <input type="text" class="form-control bg-light" value="${pkgName} (${pkgPrice})" readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Full Name</label>
                    <input type="text" class="form-control py-2" placeholder="Enter your full name" id="bookGuestName">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Email Address</label>
                    <input type="email" class="form-control py-2" placeholder="name@example.com" id="bookGuestEmail">
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <label class="form-label small fw-semibold">Travel Date</label>
                        <input type="date" class="form-control py-2" required id="bookDate">
                    </div>
                    <div class="col-6">
                        <label class="form-label small fw-semibold">Guests</label>
                        <input type="number" class="form-control py-2" value="2" min="1" max="20" required id="bookGuests">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Phone Number</label>
                    <input type="tel" class="form-control py-2" placeholder="+94 77 123 4567" id="bookGuestPhone">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Country</label>
                    <input type="text" class="form-control py-2" placeholder="Sri Lanka" id="bookGuestCountry">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Special Requests</label>
                    <textarea class="form-control py-2" rows="3" placeholder="Optional notes for the travel team" id="bookGuestNotes"></textarea>
                </div>
                <div class="alert alert-warning-subtle text-dark small border-0 mb-3">
                    <i class="bi bi-shield-check text-gold me-1"></i> No immediate payment required. Your request will be reviewed by the admin team.
                </div>
                <button type="submit" class="btn btn-emerald w-100 py-2 fw-bold rounded-pill">Confirm Reservation Request</button>
            </form>`
        );

        setTimeout(() => {
            const bookingForm = document.getElementById('modalBookingForm');
            if (bookingForm) {
                prefillUserBookingForm(bookingForm);
                bookingForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    const name = document.getElementById('bookGuestName').value.trim();
                    const email = document.getElementById('bookGuestEmail').value.trim();
                    const travelDate = document.getElementById('bookDate').value;
                    const guests = Number(document.getElementById('bookGuests').value || 1);
                    const phone = document.getElementById('bookGuestPhone').value.trim();
                    const country = document.getElementById('bookGuestCountry').value.trim() || 'Sri Lanka';
                    const notes = document.getElementById('bookGuestNotes').value.trim();

                    const bookingButton = bookingForm.querySelector('button[type="submit"]');
                    const originalText = bookingButton.innerHTML;
                    bookingButton.disabled = true;
                    bookingButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';

                    try {
                        const csrfToken = await getCsrfToken();
                        const packageRecord = await findPackageByName(pkgName);
                        const authResponse = await fetch(apiBaseUrl + '/api/auth/me', { credentials: 'include' });
                        let currentUser = null;
                        if (authResponse.ok) {
                            const authBody = await authResponse.json();
                            currentUser = authBody.user || null;
                        } else if (authResponse.status !== 401) {
                            throw new Error('Unable to verify your sign-in before booking.');
                        }

                        if (currentUser && currentUser.role === 'USER') {
                            const userBookingResponse = await fetch(apiBaseUrl + '/api/users/me/bookings', {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': csrfToken
                                },
                                body: JSON.stringify({
                                    packageId: packageRecord.id,
                                    numberOfPeople: guests,
                                    travelDate: travelDate,
                                    specialRequests: notes || null
                                })
                            });
                            const userBookingBody = await userBookingResponse.json().catch(() => ({}));
                            if (!userBookingResponse.ok) {
                                throw new Error(userBookingBody.message || 'Your booking request could not be submitted.');
                            }
                            showBookingConfirmation(
                                currentUser.fullName || name,
                                pkgName,
                                travelDate,
                                userBookingBody.bookingReference
                            );
                            bookingForm.reset();
                            return;
                        }

                        if (!name || !email) {
                            showModal('Incomplete Booking Form', '<p class="text-danger">Enter your name and email address to continue as a guest.</p>');
                            return;
                        }

                        const touristResponse = await fetch(apiBaseUrl + '/api/tourists', {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': csrfToken
                            },
                            body: JSON.stringify({
                                fullName: name,
                                email: email,
                                phone: phone || null,
                                country: country
                            })
                        });

                        let tourist = null;
                        if (touristResponse.ok) {
                            tourist = await touristResponse.json();
                        } else {
                            const touristBody = await touristResponse.json().catch(() => ({}));
                            if (touristResponse.status === 409 || touristResponse.status === 400) {
                                const existingTourists = await fetch(apiBaseUrl + '/api/tourists', {
                                    credentials: 'include',
                                    headers: { Accept: 'application/json' }
                                });
                                if (existingTourists.ok) {
                                    const tourists = await existingTourists.json();
                                    tourist = tourists.find(item => item.email && item.email.toLowerCase() === email.toLowerCase()) || null;
                                }
                                if (!tourist) {
                                    throw new Error(touristBody.message || 'Unable to create the traveler profile for this booking.');
                                }
                            } else {
                                throw new Error(touristBody.message || 'Unable to create the traveler profile for this booking.');
                            }
                        }

                        const bookingDate = new Date().toISOString().slice(0, 19);
                        const bookingResponse = await fetch(apiBaseUrl + '/api/bookings', {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': csrfToken
                            },
                            body: JSON.stringify({
                                touristId: tourist.id,
                                packageId: packageRecord.id,
                                numberOfPeople: guests,
                                bookingDate: bookingDate,
                                travelDate: travelDate,
                                specialRequests: notes || 'No additional requests',
                                bookingStatus: 'PENDING',
                                paymentStatus: 'UNPAID',
                                discount: 0,
                                amountPaid: 0
                            })
                        });

                        const bookingBody = await bookingResponse.json().catch(() => ({}));
                        if (!bookingResponse.ok) {
                            throw new Error(bookingBody.message || 'Your booking request could not be submitted to the admin team.');
                        }

                        showBookingConfirmation(name, pkgName, travelDate, bookingBody.bookingReference);
                        bookingForm.reset();
                    } catch (error) {
                        showModal('Booking Not Submitted', '<p class="text-danger mb-0">' + escapeHtml(error.message || 'Unable to send the booking request right now. Please try again.') + '</p>');
                    } finally {
                        bookingButton.disabled = false;
                        bookingButton.innerHTML = originalText;
                    }
                });
            }
        }, 200);
    }

    async function prefillUserBookingForm(bookingForm) {
        try {
            const response = await fetch(apiBaseUrl + '/api/auth/me', { credentials: 'include' });
            if (response.status === 401) return;
            if (!response.ok) throw new Error('Unable to verify your account details.');
            const authBody = await response.json();
            if (!authBody.user || authBody.user.role !== 'USER') return;

            const profileResponse = await fetch(apiBaseUrl + '/api/users/me', { credentials: 'include' });
            if (!profileResponse.ok) throw new Error('Unable to load your account profile.');
            const profile = await profileResponse.json();
            const setValue = function (id, value) {
                const input = bookingForm.querySelector('#' + id);
                if (input && value) input.value = value;
            };
            setValue('bookGuestName', profile.fullName);
            setValue('bookGuestEmail', profile.email);
            setValue('bookGuestPhone', profile.phone);
            setValue('bookGuestCountry', profile.country);
            bookingForm.querySelector('#bookGuestName').readOnly = true;
            bookingForm.querySelector('#bookGuestEmail').readOnly = true;
            const accountNotice = document.createElement('p');
            accountNotice.className = 'form-text mb-3';
            accountNotice.textContent = 'Your booking will use the name and email from your account profile.';
            bookingForm.querySelector('#bookGuestEmail').parentElement.appendChild(accountNotice);
        } catch (error) {
            console.error('Unable to prefill the booking form from the user account.', error);
        }
    }

    function showBookingConfirmation(name, packageName, travelDate, bookingReference) {
        showModal(
            'Booking Request Received!',
            `<div class="text-center py-3">
                <div class="text-success mb-3"><i class="bi bi-check-circle-fill display-3"></i></div>
                <h5 class="fw-bold mb-2">Thank you, ${escapeHtml(name)}!</h5>
                <p class="text-muted small mb-3">
                    Your booking request for <strong>${escapeHtml(packageName)}</strong> on <strong>${escapeHtml(travelDate)}</strong> has been sent to the admin team.
                </p>
                <div class="p-3 bg-light rounded-3 text-start small border">
                    <div><strong>Status:</strong> Pending Admin Approval</div>
                    <div><strong>Booking Reference:</strong> ${escapeHtml(bookingReference || 'Awaiting confirmation')}</div>
                </div>
            </div>`
        );
    }

    async function getCsrfToken() {
        const csrfResponse = await fetch(apiBaseUrl + '/api/auth/csrf', {
            credentials: 'include'
        });
        const csrfBody = await csrfResponse.json().catch(() => ({}));
        if (!csrfResponse.ok || !csrfBody.csrfToken) {
            throw new Error('Unable to initialize a secure booking request.');
        }
        return csrfBody.csrfToken;
    }

    async function findPackageByName(packageName) {
        const response = await fetch(apiBaseUrl + '/api/tour-packages/active', {
            credentials: 'include',
            headers: { Accept: 'application/json' }
        });
        const packages = await response.json().catch(() => []);
        if (!response.ok || !Array.isArray(packages)) {
            throw new Error('Unable to load the available tour packages.');
        }
        const normalizedTarget = normalizePackageName(packageName);
        const match = packages.find(pkg => normalizePackageName(pkg.name) === normalizedTarget);
        if (!match) {
            throw new Error('This selected package is currently unavailable.');
        }
        return match;
    }

    function normalizePackageName(value) {
        return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ----------------------------------------------------------------------
    // 7. Hotel Availability Interactivity
    // ----------------------------------------------------------------------
    homeHotelGrid.addEventListener('click', function (event) {
        const button = event.target.closest('.btn-hotel-info');
        if (!button) return;
        const hotel = hotelRecords.get(Number(button.dataset.hotelId));
        if (!hotel) {
            showModal('Hotel unavailable', '<p class="text-danger mb-0">This hotel is no longer active. Reload the page and try again.</p>');
            return;
        }

        const details = [
            ['Address', [hotel.address, hotel.city, hotel.district, hotel.province, hotel.country].filter(Boolean).join(', ')],
            ['Email', hotel.email],
            ['Phone', hotel.phone],
            ['Website', hotel.website],
            ['Check-in', hotel.checkInTime],
            ['Check-out', hotel.checkOutTime],
            ['Registered rooms', hotel.roomsCount]
        ].filter(function (item) { return item[1] !== null && item[1] !== undefined && item[1] !== ''; });

        showModal(
            hotel.hotelName,
            `<div class="py-2">
                <p class="text-muted">${escapeHtml(hotel.description || 'No description provided.')}</p>
                <dl class="row small mb-0">${details.map(function (item) {
                    return `<dt class="col-sm-4">${escapeHtml(item[0])}</dt><dd class="col-sm-8">${escapeHtml(item[1])}</dd>`;
                }).join('')}</dl>
            </div>`
        );
    });

    // ----------------------------------------------------------------------
    // 8. Contact Form Interactivity
    // ----------------------------------------------------------------------
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;

            showModal(
                'Message Sent!',
                `<div class="text-center py-3">
                    <div class="text-success mb-3"><i class="bi bi-send-check-fill display-3"></i></div>
                    <h5 class="fw-bold mb-2">Thank you, ${name}!</h5>
                    <p class="text-muted small mb-3">
                        We have received your message. Our travel specialist will contact you at <strong>${email}</strong> within 24 hours.
                    </p>
                </div>`
            );
            contactForm.reset();
        });
    }

    // ----------------------------------------------------------------------
    // 9. Admin Login Form Interactivity
    // ----------------------------------------------------------------------
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('adminUsername').value.trim();
            const password = document.getElementById('adminPassword').value;
            const apiBaseUrl = 'http://' + window.location.hostname + ':8080';

            try {
                const csrfResponse = await fetch(apiBaseUrl + '/api/auth/csrf', { credentials: 'include' });
                const csrfBody = await csrfResponse.json();
                if (!csrfResponse.ok || !csrfBody.csrfToken) {
                    throw new Error('Unable to initialize secure sign-in.');
                }
                const loginResponse = await fetch(apiBaseUrl + '/api/auth/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfBody.csrfToken
                    },
                    body: JSON.stringify({ email: email, password: password })
                });
                const loginBody = await loginResponse.json();
                if (!loginResponse.ok) {
                    throw new Error(loginBody.message || 'Invalid email or password.');
                }
                if (!loginBody.user || (loginBody.user.role !== 'ADMIN' && loginBody.user.role !== 'USER')) {
                    throw new Error('The server returned an invalid account response.');
                }
                window.location.href = loginBody.user.role === 'ADMIN'
                    ? 'admin-dashboard.html'
                    : 'user-dashboard.html';
            } catch (error) {
                const safeMessage = String(error.message || 'Unable to reach the authentication service.')
                    .replace(/[&<>"']/g, function (character) {
                        return {
                            '&': '&amp;',
                            '<': '&lt;',
                            '>': '&gt;',
                            '"': '&quot;',
                            "'": '&#39;'
                        }[character];
                    });
                showModal('Login failed', '<p class="text-danger mb-0">' + safeMessage + '</p>');
            }
        });
    }

    // ----------------------------------------------------------------------
    // 10. System Module Footer Links Click Handler
    // ----------------------------------------------------------------------
    const moduleLinks = document.querySelectorAll('.module-link');
    moduleLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('data-module') === 'Tourist Management') {
                return;
            }
            e.preventDefault();
            const moduleName = this.getAttribute('data-module');
            showModal(
                `Module: ${moduleName}`,
                `<div class="py-2">
                    <h5 class="fw-bold text-emerald mb-2"><i class="bi bi-code-slash me-2"></i>${moduleName}</h5>
                    <p class="text-muted small mb-3">
                        This module is part of the Ceylon Explore Java Spring Boot backend roadmap. It will allow administrators to create, update, search, and delete records for ${moduleName.toLowerCase()}.
                    </p>
                    <div class="p-3 bg-light rounded-3 small border">
                        <div><strong>Backend Tech Stack:</strong> Java 17+, Spring Boot 3, Spring Data JPA, PostgreSQL / MySQL</div>
                        <div><strong>REST Endpoint:</strong> <code>/api/v1/${moduleName.toLowerCase().replace(/\s+/g, '-')}</code></div>
                    </div>
                </div>`
            );
        });
    });

    // ----------------------------------------------------------------------
    // Helper Function to Show Modal Message
    // ----------------------------------------------------------------------
    function showModal(title, contentHtml) {
        demoModalTitle.textContent = title;
        demoModalBody.innerHTML = contentHtml;
        demoModal.show();
    }
});
