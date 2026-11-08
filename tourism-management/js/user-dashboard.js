document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const apiBaseUrl = (window.location.protocol === 'file:' ? 'http:' : window.location.protocol) +
        '//' + (window.location.hostname || 'localhost') + ':8080';
    const elements = {
        content: document.getElementById('userDashboardContent'),
        loading: document.getElementById('dashboardLoading'),
        alert: document.getElementById('dashboardAlert'),
        profileForm: document.getElementById('profileForm'),
        profileError: document.getElementById('profileError'),
        passwordForm: document.getElementById('passwordForm'),
        passwordError: document.getElementById('passwordError'),
        bookingDetails: bootstrap.Modal.getOrCreateInstance(document.getElementById('bookingDetailsModal')),
        bookingDetailsTitle: document.getElementById('bookingDetailsTitle'),
        bookingDetailsBody: document.getElementById('bookingDetailsBody')
    };
    const profileFields = {
        fullName: document.getElementById('profileName'),
        phone: document.getElementById('profilePhone'),
        country: document.getElementById('profileCountry'),
        address: document.getElementById('profileAddress'),
        profileImage: document.getElementById('profileImage')
    };
    let profile = null;
    let bookings = [];
    let activeSection = 'overview';

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
        });
    }

    async function readResponse(response) {
        let body = null;
        try {
            body = await response.json();
        } catch (error) {
            if (response.status !== 204) throw new Error('The server returned an unreadable response.');
        }
        if (!response.ok) {
            const details = body && body.errors ? Object.values(body.errors).join(' ') : '';
            const error = new Error(details || (body && (body.message || body.error || body.detail)) || 'The request could not be completed.');
            error.status = response.status;
            throw error;
        }
        return body;
    }

    async function apiRequest(path, options) {
        const requestOptions = Object.assign({ credentials: 'include' }, options || {});
        requestOptions.headers = Object.assign({ Accept: 'application/json' }, requestOptions.headers || {});
        return readResponse(await fetch(apiBaseUrl + path, requestOptions));
    }

    async function csrfToken() {
        const result = await apiRequest('/api/auth/csrf');
        if (!result || !result.csrfToken) throw new Error('Unable to initialize a secure request.');
        return result.csrfToken;
    }

    function showAlert(message, type) {
        elements.alert.className = 'alert alert-' + (type || 'danger');
        elements.alert.textContent = message;
        elements.alert.classList.remove('d-none');
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
    }

    function showFormError(target, message) {
        target.textContent = message;
        target.classList.remove('d-none');
    }

    function hideFormError(target) {
        target.textContent = '';
        target.classList.add('d-none');
    }

    function formatDate(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }

    function formatMoney(value) {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return '—';
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(amount);
    }

    function safeImage(url) {
        const image = String(url || '').trim();
        return /^(https?:\/\/|\/|assets\/|\.{1,2}\/)[^\s"'<>]*$/i.test(image)
            ? image
            : 'assets/images/hero-bg.jpg';
    }

    function statusBadge(status) {
        const key = String(status || '').toUpperCase();
        const className = {
            PENDING: 'status-pending',
            CONFIRMED: 'status-confirmed',
            COMPLETED: 'status-completed',
            CANCELLED: 'status-cancelled'
        }[key] || 'payment-badge';
        return '<span class="status-badge ' + className + '">' + escapeHtml(key || 'UNKNOWN') + '</span>';
    }

    function paymentBadge(status) {
        return '<span class="payment-badge">' + escapeHtml(String(status || 'UNPAID').toUpperCase()) + '</span>';
    }

    function emptyState(message, action) {
        return '<div class="empty-state"><i class="bi bi-suitcase2"></i><strong>' + escapeHtml(message) + '</strong>' +
            (action ? '<a class="btn btn-user-primary btn-sm rounded-pill mt-2" href="index.html#packages">Explore packages</a>' : '') + '</div>';
    }

    function renderTripRow(booking) {
        return '<article class="trip-row"><img class="trip-image" src="' + escapeHtml(safeImage(booking.packageImage || booking.destinationImage)) +
            '" alt="" loading="lazy"><div><h3>' + escapeHtml(booking.packageName) + '</h3><p>' +
            escapeHtml(booking.destination || 'Destination not specified') + ' · ' + escapeHtml(booking.numberOfPeople) +
            (Number(booking.numberOfPeople) === 1 ? ' traveler' : ' travelers') + '</p><p>Ref. ' +
            escapeHtml(booking.bookingReference) + '</p></div><time datetime="' + escapeHtml(booking.travelDate) + '">' +
            escapeHtml(formatDate(booking.travelDate)) + '</time></article>';
    }

    function bookingAction(booking) {
        return '<button class="btn btn-link btn-sm p-0" type="button" data-booking-reference="' +
            escapeHtml(booking.bookingReference) + '">View details</button>';
    }

    function renderRecentBookings(items) {
        const target = document.getElementById('recentBookings');
        if (!items.length) {
            target.innerHTML = '<tr><td colspan="6">' + emptyState('Your bookings will appear here when you have a reservation.', true) + '</td></tr>';
            return;
        }
        target.innerHTML = items.map(function (booking) {
            return '<tr><td><strong>' + escapeHtml(booking.bookingReference) + '</strong></td><td>' +
                escapeHtml(booking.packageName) + '<br><span class="text-secondary small">' + escapeHtml(booking.destination || '') +
                '</span></td><td>' + escapeHtml(formatDate(booking.travelDate)) + '</td><td>' +
                escapeHtml(booking.numberOfPeople) + '</td><td>' + statusBadge(booking.bookingStatus) + '</td><td>' +
                bookingAction(booking) + '</td></tr>';
        }).join('');
    }

    function renderBookings(items, targetId, type) {
        const target = document.getElementById(targetId);
        const emptyColumnCount = type === 'all' ? 9 : 6;
        if (!items.length) {
            target.innerHTML = '<tr><td colspan="' + emptyColumnCount + '">' +
                emptyState(type === 'history' ? 'Your past adventures will appear here.' : 'You do not have any bookings yet.', true) +
                '</td></tr>';
            return;
        }
        target.innerHTML = items.map(function (booking) {
            const base = '<td><strong>' + escapeHtml(booking.bookingReference) + '</strong></td><td>' +
                escapeHtml(booking.packageName) + '<br><span class="text-secondary small">' + escapeHtml(booking.destination || '') + '</span></td>';
            if (type === 'all') {
                return '<tr>' + base + '<td>' + escapeHtml(formatDate(booking.bookingDate)) + '</td><td>' +
                    escapeHtml(formatDate(booking.travelDate)) + '</td><td>' + escapeHtml(booking.numberOfPeople) +
                    '</td><td>' + escapeHtml(formatMoney(booking.totalAmount)) + '</td><td>' +
                    statusBadge(booking.bookingStatus) + '</td><td>' + paymentBadge(booking.paymentStatus) +
                    '</td><td>' + bookingAction(booking) + '</td></tr>';
            }
            return '<tr>' + base + '<td>' + escapeHtml(formatDate(booking.travelDate)) + '</td><td>' +
                escapeHtml(formatMoney(booking.totalAmount)) + '</td><td>' + statusBadge(booking.bookingStatus) +
                '</td><td>' + bookingAction(booking) + '</td></tr>';
        }).join('');
    }

    function renderTripCard(booking) {
        const days = booking.durationDays ? '<span><i class="bi bi-calendar3 me-1"></i>' + escapeHtml(booking.durationDays) + ' days</span>' : '';
        return '<article class="trip-card"><img class="trip-card-image" src="' +
            escapeHtml(safeImage(booking.packageImage || booking.destinationImage)) + '" alt="" loading="lazy">' +
            '<div class="trip-card-body"><span class="user-eyebrow">TRAVEL DATE · ' + escapeHtml(formatDate(booking.travelDate)) +
            '</span><h2>' + escapeHtml(booking.packageName) + '</h2><div class="trip-card-destination">' +
            escapeHtml(booking.destination || 'Destination not specified') + '</div><div class="trip-card-details">' +
            days + '<span><i class="bi bi-people me-1"></i>' + escapeHtml(booking.numberOfPeople) + ' people</span>' +
            '<span><i class="bi bi-ticket me-1"></i>' + escapeHtml(booking.bookingReference) + '</span></div>' +
            statusBadge(booking.bookingStatus) + '<button class="btn btn-user-outline btn-sm rounded-pill float-end" type="button" data-booking-reference="' +
            escapeHtml(booking.bookingReference) + '">View details</button></div></article>';
    }

    function updateProfileViews() {
        const fullName = profile.fullName || 'Traveler';
        document.getElementById('welcomeName').textContent = fullName.split(/\s+/)[0];
        document.getElementById('sidebarName').textContent = fullName;
        document.getElementById('summaryName').textContent = fullName;
        document.getElementById('summaryEmail').textContent = profile.email || '';
        document.getElementById('summaryCountry').textContent = profile.country || '—';
        document.getElementById('summaryPhone').textContent = profile.phone || '—';
        document.getElementById('summaryJoined').textContent = formatDate(profile.createdAt);
        document.getElementById('profileEmail').value = profile.email || '';
        document.getElementById('profileStatus').textContent = profile.enabled ? 'Active' : 'Disabled';
        document.getElementById('profileStatus').className = 'status-badge ' + (profile.enabled ? 'status-confirmed' : 'status-cancelled');
        document.getElementById('profileCreated').textContent = formatDate(profile.createdAt);
        Object.keys(profileFields).forEach(function (name) {
            profileFields[name].value = profile[name] || '';
        });
        const image = safeImage(profile.profileImage);
        ['sidebarAvatar', 'profileAvatar', 'editAvatar'].forEach(function (id) {
            document.getElementById(id).src = image;
        });
    }

    async function showBookingDetails(reference) {
        try {
            const booking = await apiRequest('/api/users/me/bookings/' + encodeURIComponent(reference));
            const imageUrl = safeImage(booking.packageImage || booking.destinationImage);
            elements.bookingDetailsTitle.textContent = 'Booking ' + booking.bookingReference;
            elements.bookingDetailsBody.innerHTML =
                '<div class="details-hero"><img src="' + escapeHtml(imageUrl) + '" alt=""><div><span class="user-eyebrow">' +
                escapeHtml(booking.bookingReference) + '</span><h3 class="h5 mt-1 mb-1">' + escapeHtml(booking.packageName) +
                '</h3><span class="text-secondary">' + escapeHtml(booking.destination || '') + '</span></div></div>' +
                '<div class="details-grid">' +
                detailCell('Tourist', booking.touristName) + detailCell('Email', booking.touristEmail) +
                detailCell('Phone', booking.touristPhone) + detailCell('Country', booking.touristCountry) +
                detailCell('Destination district', booking.destinationDistrict) +
                detailCell('Destination province', booking.destinationProvince) +
                detailCell('Destination address', booking.destinationAddress) +
                detailCell('Booking date', formatDate(booking.bookingDate)) + detailCell('Travel date', formatDate(booking.travelDate)) +
                detailCell('Number of people', booking.numberOfPeople) + detailCell('Total amount', formatMoney(booking.totalAmount)) +
                detailCell('Booking status', booking.bookingStatus) + detailCell('Payment status', booking.paymentStatus) +
                detailCell('Created', formatDate(booking.createdAt)) +
                '</div><div class="mt-3"><strong>Special requests</strong><p class="text-secondary mt-1 mb-0">' +
                escapeHtml(booking.specialRequests || 'No special requests.') + '</p></div>';
            elements.bookingDetails.show();
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    }

    function detailCell(label, value) {
        return '<div class="detail-cell"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || '—') + '</strong></div>';
    }

    function activateSection(name) {
        const section = document.getElementById('section-' + name) ? name : 'overview';
        activeSection = section;
        document.querySelectorAll('.user-section').forEach(function (element) {
            element.classList.toggle('active', element.id === 'section-' + section);
        });
        document.querySelectorAll('[data-section]').forEach(function (link) {
            link.classList.toggle('active', link.dataset.section === section);
        });
    }

    async function loadDashboard() {
        const session = await apiRequest('/api/auth/me');
        if (!session.user || session.user.role !== 'USER') {
            window.location.replace(session.user && session.user.role === 'ADMIN' ? 'admin-dashboard.html' : 'admin-login.html');
            return;
        }
        const results = await Promise.all([
            apiRequest('/api/users/me'),
            apiRequest('/api/users/me/dashboard'),
            apiRequest('/api/users/me/bookings'),
            apiRequest('/api/users/me/bookings/upcoming'),
            apiRequest('/api/users/me/bookings/history')
        ]);
        profile = results[0];
        const dashboard = results[1];
        bookings = results[2];
        updateProfileViews();
        document.getElementById('statTotal').textContent = dashboard.totalBookings;
        document.getElementById('statUpcoming').textContent = dashboard.upcomingTrips;
        document.getElementById('statCompleted').textContent = dashboard.completedTrips;
        document.getElementById('statPending').textContent = dashboard.pendingBookings;
        document.getElementById('overviewUpcoming').innerHTML = results[3].length
            ? results[3].slice(0, 3).map(renderTripRow).join('')
            : emptyState("You don't have any upcoming trips yet. Start exploring Sri Lanka!", true);
        document.getElementById('upcomingTrips').innerHTML = results[3].length
            ? results[3].map(renderTripCard).join('')
            : emptyState("You don't have any upcoming trips yet. Start exploring Sri Lanka!", true);
        renderRecentBookings(dashboard.recentBookings || []);
        renderBookings(bookings, 'allBookings', 'all');
        renderBookings(results[4], 'bookingHistory', 'history');
        elements.loading.classList.add('d-none');
        elements.content.classList.remove('d-none');
        activateSection(window.location.hash.slice(1) || activeSection);
    }

    async function saveProfile(event) {
        event.preventDefault();
        hideFormError(elements.profileError);
        elements.profileForm.classList.add('was-validated');
        if (!elements.profileForm.checkValidity()) return;
        const button = document.getElementById('saveProfileButton');
        button.disabled = true;
        try {
            const token = await csrfToken();
            profile = await apiRequest('/api/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify({
                    fullName: profileFields.fullName.value.trim(),
                    phone: profileFields.phone.value.trim(),
                    country: profileFields.country.value.trim(),
                    address: profileFields.address.value.trim(),
                    profileImage: profileFields.profileImage.value.trim()
                })
            });
            updateProfileViews();
            showAlert('Your profile was updated successfully.', 'success');
        } catch (error) {
            showFormError(elements.profileError, error.message);
        } finally {
            button.disabled = false;
        }
    }

    async function changePassword(event) {
        event.preventDefault();
        hideFormError(elements.passwordError);
        elements.passwordForm.classList.add('was-validated');
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const newPasswordField = document.getElementById('newPassword');
        const confirmField = document.getElementById('confirmPassword');
        newPasswordField.setCustomValidity(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(newPassword)
            ? '' : 'Use at least 8 characters with uppercase, lowercase, and a number.');
        confirmField.setCustomValidity(newPassword === confirmPassword ? '' : 'Passwords do not match.');
        if (!elements.passwordForm.checkValidity()) {
            elements.passwordForm.reportValidity();
            return;
        }
        const button = document.getElementById('savePasswordButton');
        button.disabled = true;
        try {
            const token = await csrfToken();
            await apiRequest('/api/users/me/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    confirmNewPassword: confirmPassword
                })
            });
            elements.passwordForm.reset();
            elements.passwordForm.classList.remove('was-validated');
            showAlert('Your password was updated successfully.', 'success');
        } catch (error) {
            showFormError(elements.passwordError, error.message);
        } finally {
            button.disabled = false;
        }
    }

    async function logout() {
        const buttons = Array.from(document.querySelectorAll('[data-logout], #logoutButton'));
        buttons.forEach(function (button) { button.disabled = true; });
        try {
            const token = await csrfToken();
            await apiRequest('/api/auth/logout', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': token }
            });
            window.location.replace('index.html');
        } catch (error) {
            showAlert(error.message, 'danger');
            buttons.forEach(function (button) { button.disabled = false; });
        }
    }

    document.querySelectorAll('[data-section]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const section = link.dataset.section;
            activateSection(section);
            history.replaceState(null, '', '#' + section);
        });
    });
    document.addEventListener('click', function (event) {
        const detailButton = event.target.closest('[data-booking-reference]');
        if (detailButton) showBookingDetails(detailButton.dataset.bookingReference);
    });
    elements.profileForm.addEventListener('submit', saveProfile);
    elements.passwordForm.addEventListener('submit', changePassword);
    document.getElementById('logoutButton').addEventListener('click', logout);
    document.querySelectorAll('[data-logout]').forEach(function (button) {
        button.addEventListener('click', logout);
    });
    document.getElementById('profileImage').addEventListener('input', function (event) {
        document.getElementById('editAvatar').src = safeImage(event.target.value);
    });

    loadDashboard().catch(function (error) {
        elements.loading.classList.add('d-none');
        if (error.status === 401) {
            window.location.replace('admin-login.html');
            return;
        }
        showAlert(error.message || 'Unable to load your dashboard. Please try again.', 'danger');
    });
});
