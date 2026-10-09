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
                <div class="alert alert-warning-subtle text-dark small border-0 mb-3">
                    <i class="bi bi-shield-check text-gold me-1"></i> No immediate payment required. Confirmation sent via email.
                </div>
                <button type="submit" class="btn btn-emerald w-100 py-2 fw-bold rounded-pill">Confirm Reservation Request</button>
            </form>`
        );

        setTimeout(() => {
            const bookingForm = document.getElementById('modalBookingForm');
            if (bookingForm) {
                bookingForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const name = document.getElementById('bookGuestName').value;
                    const date = document.getElementById('bookDate').value;
                    
                    showModal(
                        'Booking Request Received!',
                        `<div class="text-center py-3">
                            <div class="text-success mb-3"><i class="bi bi-check-circle-fill display-3"></i></div>
                            <h5 class="fw-bold mb-2">Thank you, ${name}!</h5>
                            <p class="text-muted small mb-3">
                                Your booking request for <strong>${pkgName}</strong> on <strong>${date}</strong> has been logged.
                            </p>
                            <div class="p-3 bg-light rounded-3 text-start small border">
                                <div><strong>Status:</strong> Pending Admin Approval</div>
                                <div><strong>Booking Reference:</strong> #CE-2026-${Math.floor(1000 + Math.random() * 9000)}</div>
                            </div>
                            <p class="small text-muted mt-3 mb-0">
                                <em>Spring Boot Backend Integration Ready: <code>POST /api/v1/bookings</code></em>
                            </p>
                        </div>`
                    );
                });
            }
        }, 200);
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
        adminLoginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const adminModalEl = document.getElementById('adminLoginModal');
            const adminBsModal = bootstrap.Modal.getInstance(adminModalEl);
            if (adminBsModal) {
                adminBsModal.hide();
            }

            setTimeout(() => {
                showModal(
                    'Admin Authentication',
                    `<div class="text-center py-3">
                        <div class="text-emerald mb-3"><i class="bi bi-shield-check display-3"></i></div>
                        <h5 class="fw-bold mb-2">Authentication Successful</h5>
                        <p class="text-muted small mb-3">
                            Welcome to the Ceylon Explore Administrative Portal.
                        </p>
                        <div class="p-3 bg-light text-start small border rounded-3 mb-3">
                            <h6 class="fw-bold mb-2 text-dark">Active Administrative Modules:</h6>
                            <ul class="mb-0 ps-3">
                                <li>Tourist Management</li>
                                <li>Tour Package Management</li>
                                <li>Destination Management</li>
                                <li>Booking & Hotel Management</li>
                                <li>Tour Guide Allocation</li>
                            </ul>
                        </div>
                        <div class="alert alert-success-subtle border-0 small text-start mb-0">
                            <i class="bi bi-gear-fill me-1"></i> Backend Target: Spring Boot Controller <code>@RestController /api/v1/admin</code>
                        </div>
                    </div>`
                );
            }, 300);
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
