# Ceylon Explore Backend

This folder contains the Spring Boot backend, Tourist Management CRUD module,
and session-based account authentication. Other tourism CRUD modules have not
been implemented.

## Requirements

- JDK 21 or newer
- Apache Maven 3.6.3 or newer
- MySQL running locally with a database named `ceylon_explore`

## Configure and run

From this folder, set the MySQL password and start Spring Boot. To create the
first administrator, set the three `INITIAL_ADMIN_*` variables for one
successful startup:

```powershell
$env:DB_PASSWORD = "<your-mysql-password>"
$env:INITIAL_ADMIN_NAME = "Ceylon Explore Admin"
$env:INITIAL_ADMIN_EMAIL = "admin@example.com"
$env:INITIAL_ADMIN_PASSWORD = "<a-strong-initial-password>"
mvn spring-boot:run
```

The database username defaults to `root`. Override `DB_USERNAME` or `DB_URL` if
your local MySQL setup differs. The database password and initial administrator
password are read from environment variables and are not stored in this project.
The initializer creates the configured admin only when that email is absent;
it will not reset that account's password on subsequent starts. Omit the admin
variables after initialization. Public registration always creates a `USER`.

## Test endpoints

- `GET http://localhost:8080/api/test` — API liveness check.
- `GET http://localhost:8080/api/test/database` — executes `SELECT 1` against
  the configured database.
- `GET http://localhost:8080/api/tourists` — list tourists.
- `GET http://localhost:8080/api/tourists/{id}` — retrieve a tourist.
- `POST http://localhost:8080/api/tourists` — create a tourist.
- `PUT http://localhost:8080/api/tourists/{id}` — update a tourist.
- `DELETE http://localhost:8080/api/tourists/{id}` — delete a tourist.
- `GET http://localhost:8080/api/auth/csrf` — obtain a session CSRF token.
- `POST http://localhost:8080/api/auth/register` — register a normal user.
- `POST http://localhost:8080/api/auth/login` — login and establish a session.
- `GET http://localhost:8080/api/auth/me` — current authenticated account.
- `POST http://localhost:8080/api/auth/logout` — invalidate the session.
- `GET http://localhost:8080/api/user/dashboard` — USER or ADMIN.
- `GET http://localhost:8080/api/admin/dashboard` — ADMIN only.

Tourist create/update JSON uses `fullName`, `email`, `phone`, and `country`.
Successful creation returns HTTP 201; deletion returns HTTP 204. Validation
errors return HTTP 400, missing IDs return HTTP 404, and duplicate emails
return HTTP 409.

Hibernate uses the non-drop `update` schema mode to create/update mapped tables.
It does not issue a drop for existing tables or delete their records. The
Tourist table is created when the application starts successfully with a valid
database connection.

## Frontend CORS

Development allows only `http://localhost:5500` and
`http://127.0.0.1:5500`, the common VS Code Live Server origins. Override these
with a comma-separated `CORS_ALLOWED_ORIGINS` environment variable if the
frontend is served elsewhere. Do not open the HTML files directly using
`file://`; serve the frontend on an HTTP origin.

When using the `prod` Spring profile, `CORS_ALLOWED_ORIGINS` must be explicitly
set to the deployed frontend origin or origins. Wildcard origins are not used.

## Package structure

Java base package: `com.ceylonexplore.backend`. Tourist code is organized into
`controller`, `service`, `repository`, and `entity`; shared CORS configuration
and API error handling are in `config` and `exception`.

The current static frontend has no Tourist Management form/table page yet.
Its booking demo reads tourist records from browser `localStorage`; that data
is separate from this API and is not synchronized. A later frontend integration
should fetch the API endpoints and map the numeric `id` and `fullName` fields
into the booking UI's tourist lookup format.

## Authentication and sessions

Registration accepts `fullName`, `email`, and `password`; the role is always
assigned as `USER`. Passwords are BCrypt-hashed. Never send passwords in query
strings or save them in browser storage. For login and logout, first call
`GET /api/auth/csrf` with cookies enabled, then send its `csrfToken` as the
`X-CSRF-TOKEN` header on the POST request. Cross-origin browser requests must
use `credentials: "include"`.

The existing admin login page uses the shared login endpoint and redirects
based on the role returned by the server. The small `user-dashboard.html` page
provides a signed-in landing page for regular accounts. No registration form
existed in the frontend, so registration is currently available through the
API. Spring Security enforces roles independently of the frontend; Tourist
endpoints require `ADMIN`.

Sessions use HTTP-only cookies. Development uses `Secure=false` and
`SameSite=Lax`; the production profile forces secure cookies. Production CORS
must specify trusted frontend origins. If the deployed frontend and API are on
different sites, use HTTPS and configure an appropriate
`SESSION_COOKIE_SAME_SITE` value as well as the explicit CORS allowlist.

Authentication integration tests use a temporary in-memory H2 database and do
not modify MySQL.
