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

            const destinationSelect = document.getElementById('searchDestination');
            const destinationText = destinationSelect.options[destinationSelect.selectedIndex].text;
            const travelDate = searchDateInput.value;
            const travelers = document.getElementById('searchTravelers').value;

            if (!destinationSelect.value || !travelDate) {
                showModal('Incomplete Search', '<p class="text-danger">Please select a destination and travel date to search for packages.</p>');
                return;
            }

            // Simulate searching results
            showModal(
                'Search Results',
                `<div class="text-center py-2">
                    <div class="mb-3 text-emerald"><i class="bi bi-compass-fill display-4"></i></div>
                    <h5 class="fw-bold mb-2">Available Packages Found!</h5>
                    <p class="text-muted small mb-3">
                        We found <strong>3 curated tour packages</strong> for <strong>${destinationText}</strong> departing on <strong>${travelDate}</strong> for <strong>${travelers} traveler(s)</strong>.
                    </p>
                    <div class="p-3 bg-light rounded-3 text-start mb-3 border">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold text-dark"> Ceylon Signature Tour</span>
                            <span class="badge bg-gold text-white">Available</span>
                        </div>
                        <span class="small text-muted">Includes private luxury vehicle, 4-star accommodation, and certified English-speaking tour guide.</span>
                    </div>
                    <div class="alert alert-info-subtle border-0 small text-start">
                        <i class="bi bi-info-circle me-1"></i> <strong>Frontend Demo Note:</strong> Ready for Java Spring Boot REST endpoint <code>GET /api/v1/packages/search</code>.
                    </div>
                </div>`
            );
        });
    }

    // ----------------------------------------------------------------------
    // 5. Destination Card Buttons Interactivity
    // ----------------------------------------------------------------------
    const exploreButtons = document.querySelectorAll('.btn-explore');
    exploreButtons.forEach(button => {
        button.addEventListener('click', function () {
            const destinationName = this.getAttribute('data-destination');
            
            showModal(
                `Explore ${destinationName}`,
                `<div class="py-2">
                    <h5 class="fw-bold mb-2 text-emerald"><i class="bi bi-geo-alt-fill me-2"></i>${destinationName} Overview</h5>
                    <p class="text-muted mb-3">
                        ${destinationName} is one of Sri Lanka's prime travel destinations offering rich cultural history, breathtaking landscapes, and unforgettable local adventures.
                    </p>
                    <div class="row g-2 mb-3 small">
                        <div class="col-6"><i class="bi bi-check2-circle text-emerald me-1"></i> Guided Heritage Walks</div>
                        <div class="col-6"><i class="bi bi-check2-circle text-emerald me-1"></i> Photography Spots</div>
                        <div class="col-6"><i class="bi bi-check2-circle text-emerald me-1"></i> Luxury Transfers</div>
                        <div class="col-6"><i class="bi bi-check2-circle text-emerald me-1"></i> Local Food Tastings</div>
                    </div>
                    <div class="d-grid">
                        <a href="#packages" class="btn btn-emerald rounded-pill" data-bs-dismiss="modal">View Packages for ${destinationName}</a>
                    </div>
                </div>`
            );
        });
    });

    // ----------------------------------------------------------------------
    // 6. Tour Package Details & Booking Interactivity
    // ----------------------------------------------------------------------
    const viewDetailButtons = document.querySelectorAll('.btn-view-details');
    viewDetailButtons.forEach(button => {
        button.addEventListener('click', function () {
            const pkgName = this.getAttribute('data-package');
            const pkgPrice = this.getAttribute('data-price');
            const pkgDuration = this.getAttribute('data-duration');
            const pkgDest = this.getAttribute('data-dest');

            showModal(
                `${pkgName} Details`,
                `<div class="py-2">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge bg-emerald-subtle text-emerald px-3 py-2 fs-6 rounded-pill"><i class="bi bi-clock me-1"></i> ${pkgDuration}</span>
                        <span class="fw-bold h5 text-emerald mb-0">${pkgPrice}</span>
                    </div>
                    <h6 class="fw-bold text-dark mb-1">Destinations Covered:</h6>
                    <p class="text-muted small mb-3"><i class="bi bi-geo-alt-fill text-gold me-1"></i> ${pkgDest}</p>
                    
                    <h6 class="fw-bold text-dark mb-1">Package Inclusions:</h6>
                    <ul class="small text-muted mb-4 ps-3">
                        <li>Luxury air-conditioned vehicle with driver-guide</li>
                        <li>Daily breakfast and traditional buffet dinner</li>
                        <li>All entrance tickets & safari jeep fees included</li>
                        <li>24/7 dedicated travel coordinator support</li>
                    </ul>

                    <div class="d-grid">
                        <button class="btn btn-emerald rounded-pill fw-bold btn-modal-book-now" data-package="${pkgName}">Book This Package</button>
                    </div>
                </div>`
            );

            // Re-bind modal book button
            setTimeout(() => {
                const modalBookBtn = document.querySelector('.btn-modal-book-now');
                if (modalBookBtn) {
                    modalBookBtn.addEventListener('click', function () {
                        triggerBookingFlow(pkgName, pkgPrice);
                    });
                }
            }, 200);
        });
    });

    const bookNowButtons = document.querySelectorAll('.btn-book-now');
    bookNowButtons.forEach(button => {
        button.addEventListener('click', function () {
            const pkgName = this.getAttribute('data-package');
            const pkgPrice = this.getAttribute('data-price');
            triggerBookingFlow(pkgName, pkgPrice);
        });
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
                    <input type="text" class="form-control py-2" placeholder="Enter your full name" required id="bookGuestName">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Email Address</label>
                    <input type="email" class="form-control py-2" placeholder="name@example.com" required id="bookGuestEmail">
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
                bookingForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    const name = document.getElementById('bookGuestName').value.trim();
                    const email = document.getElementById('bookGuestEmail').value.trim();
                    const travelDate = document.getElementById('bookDate').value;
                    const guests = Number(document.getElementById('bookGuests').value || 1);
                    const phone = document.getElementById('bookGuestPhone').value.trim();
                    const country = document.getElementById('bookGuestCountry').value.trim() || 'Sri Lanka';
                    const notes = document.getElementById('bookGuestNotes').value.trim();

                    if (!name || !email || !travelDate) {
                        showModal('Incomplete Booking Form', '<p class="text-danger mb-0">Please complete the required booking details before submitting.</p>');
                        return;
                    }

                    const bookingButton = bookingForm.querySelector('button[type="submit"]');
                    const originalText = bookingButton.innerHTML;
                    bookingButton.disabled = true;
                    bookingButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';

                    try {
                        const csrfToken = await getCsrfToken();
                        const packageRecord = await findPackageByName(pkgName);

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

                        const bookingDate = new Date().toISOString().slice(0, 10);
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

                        showModal(
                            'Booking Request Received!',
                            `<div class="text-center py-3">
                                <div class="text-success mb-3"><i class="bi bi-check-circle-fill display-3"></i></div>
                                <h5 class="fw-bold mb-2">Thank you, ${name}!</h5>
                                <p class="text-muted small mb-3">
                                    Your booking request for <strong>${pkgName}</strong> on <strong>${travelDate}</strong> has been sent to the admin team.
                                </p>
                                <div class="p-3 bg-light rounded-3 text-start small border">
                                    <div><strong>Status:</strong> Pending Admin Approval</div>
                                    <div><strong>Booking Reference:</strong> ${bookingBody.bookingReference || 'Awaiting confirmation'}</div>
                                </div>
                            </div>`
                        );
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
        const response = await fetch(apiBaseUrl + '/api/tour-packages', {
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
    const hotelInfoButtons = document.querySelectorAll('.btn-hotel-info');
    hotelInfoButtons.forEach(button => {
        button.addEventListener('click', function () {
            const hotelName = this.getAttribute('data-hotel');
            showModal(
                `${hotelName}`,
                `<div class="py-2 text-center">
                    <div class="text-emerald mb-2"><i class="bi bi-building-check display-4"></i></div>
                    <h5 class="fw-bold mb-2">Rooms Available!</h5>
                    <p class="text-muted small mb-3">
                        <strong>${hotelName}</strong> currently has executive deluxe suites available for online reservation.
                    </p>
                    <div class="p-3 bg-light rounded-3 text-start small mb-3 border">
                        <div><i class="bi bi-wifi me-2 text-emerald"></i>Free High-Speed Wi-Fi</div>
                        <div><i class="bi bi-cup-hot me-2 text-emerald"></i>Complimentary Ceylon Tea & Breakfast</div>
                        <div><i class="bi bi-droplet me-2 text-emerald"></i>Outdoor Swimming Pool Access</div>
                    </div>
                    <div class="alert alert-info-subtle border-0 small text-start mb-0">
                        <i class="bi bi-info-circle me-1"></i> Spring Boot Module: <code>Hotel Management System (/api/v1/hotels)</code>
                    </div>
                </div>`
            );
        });
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
