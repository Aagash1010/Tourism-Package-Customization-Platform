/**
 * Ceylon Explore - Admin Dashboard
 * Frontend demonstration interactions prepared for future CRUD modules.
 */

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('adminSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const demoToastElement = document.getElementById('demoToast');
    const demoToastBody = document.getElementById('demoToastBody');
    const demoToast = new bootstrap.Toast(demoToastElement, { delay: 3600 });
    const searchInput = document.getElementById('dashboardSearch');

    sidebarToggle.addEventListener('click', function () {
        const isOpen = sidebar.classList.toggle('is-open');
        sidebarBackdrop.classList.toggle('is-visible', isOpen);
        sidebarToggle.setAttribute('aria-expanded', String(isOpen));
    });

    sidebarBackdrop.addEventListener('click', closeSidebar);

    document.querySelectorAll('.module-placeholder').forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            setActiveSidebarLink(link);
            closeSidebar();
            showDemoToast(link.dataset.module + ' is prepared as a navigation placeholder for future Create, Read, Update, and Delete functionality.');
        });
    });

    document.querySelectorAll('.demo-action').forEach(function (button) {
        button.addEventListener('click', function () {
            const action = button.dataset.action || 'This action';
            showDemoToast(action + ' is a frontend demonstration. Backend saving will be added with Spring Boot later.');
        });
    });

    document.getElementById('notificationButton').addEventListener('click', function () {
        showDemoToast('Notifications are sample interface elements for the dashboard preview.');
    });

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.trim();
        if (query.length >= 3) {
            showDemoToast('Search preview for "' + query + '" is ready for a future Spring Boot endpoint.');
        }
    });

    function closeSidebar() {
        sidebar.classList.remove('is-open');
        sidebarBackdrop.classList.remove('is-visible');
        sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    function setActiveSidebarLink(activeLink) {
        document.querySelectorAll('.sidebar-link').forEach(function (link) {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    function showDemoToast(message) {
        demoToastBody.textContent = message;
        demoToast.show();
    }
});
