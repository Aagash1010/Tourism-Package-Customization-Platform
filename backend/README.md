# Ceylon Explore Backend

This folder contains the Spring Boot backend, Tourist, Destination, and Tour
Guide Management CRUD modules, and session-based account authentication.
Tour-package and booking management are also available.

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
- `GET http://localhost:8080/api/destinations` — public destination listing.
- `GET http://localhost:8080/api/destinations/{id}` — public destination details.
- `GET http://localhost:8080/api/destinations/search?keyword=sigiriya` — search by name, location, category, or description.
- `GET http://localhost:8080/api/destinations/category/{category}` — filter by category.
- `GET http://localhost:8080/api/destinations/active` — list active destinations.
- `POST http://localhost:8080/api/destinations` — create a destination (ADMIN).
- `PUT http://localhost:8080/api/destinations/{id}` — update a destination (ADMIN).
- `DELETE http://localhost:8080/api/destinations/{id}` — delete a destination (ADMIN).
- `GET http://localhost:8080/api/tour-guides` — public tour-guide listing.
- `GET http://localhost:8080/api/tour-guides/{id}` — public tour-guide details.
- `GET http://localhost:8080/api/tour-guides/search?name=nimal` — search guides by name.
- `GET http://localhost:8080/api/tour-guides/availability/{status}` — filter by `AVAILABLE`, `UNAVAILABLE`, or `ON_TOUR`.
- `GET http://localhost:8080/api/tour-guides/specialization/{specialization}` — filter by specialization.
- `GET http://localhost:8080/api/tour-guides/available` — list available guides.
- `POST http://localhost:8080/api/tour-guides` — create a guide (ADMIN).
- `PUT http://localhost:8080/api/tour-guides/{id}` — update a guide (ADMIN).
- `DELETE http://localhost:8080/api/tour-guides/{id}` — delete a guide (ADMIN).
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

Tour-guide create/update requests accept the complete management form:
`fullName`, `email`, `phoneNumber`, `address`, `city`, `district`,
`nationality`, `nicNumber`, `gender`, `dateOfBirth`, `licenseNumber`,
`qualification`, `languages`, `workingDays`, `preferredTourTypes`,
`specialization`, `experienceYears`, `dailyRate`, `profileImage`,
`availabilityStatus`, `employmentStatus`, `maxGroupSize`, `rating`,
`certifications`, and `description`. Languages, working days, and preferred
tour types are persisted in separate collection tables. Email, NIC, and license
number values are unique. Availability defaults to `AVAILABLE` on creation.
Profile images are optional HTTP(S) URLs or filenames under `assets/images`.
Guide reads are public; mutations require an ADMIN session and a valid CSRF
token. Creation returns HTTP 201, deletion returns HTTP 204, invalid requests
return HTTP 400, missing IDs return HTTP 404, and duplicate email/NIC/license
values return HTTP 409.

Destination create/update JSON uses `name`, `district`, `province`, `category`,
`shortDescription`, `fullDescription`, `entryFee`, `bestTime`, `duration`,
`openingHours`, `address`, `latitude`, `longitude`, `featured`, `status`, and
`imageUrl`. The numeric database ID and `createdAt`/`updatedAt` timestamps are
managed by the backend. Entry fees are non-negative decimal values in LKR;
coordinates are optional and range-validated. Destination names are
case-insensitively unique. Deletion and renaming are rejected with HTTP 409
when a tour package references the destination. Public clients may browse
destinations, while all destination mutations require an authenticated ADMIN
session and a valid CSRF token. Creation returns HTTP 201 and deletion returns
HTTP 204.

Hibernate uses the non-drop `update` schema mode to create/update mapped tables.
It does not issue a drop for existing tables or delete their records. The
Tourist and Destination tables are created when the application starts
successfully with a valid database connection.
The Tour Guide and Tour Guide Languages tables are also created or updated
without dropping existing tables or records.

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
`controller`, `service`, `repository`, and `entity`; Tour Guide Management
follows the same structure and uses request/response DTOs. Shared CORS
configuration and API error handling are in `config` and `exception`.

The Destination and Tour Guide Management frontends load records from these
endpoints using credentialed `fetch` requests and send the session CSRF token
for mutations. Serve the frontend over HTTP from an allowed CORS origin (Live
Server defaults to port 5500). Tour-guide records are stored in the database;
older browser-only tour-guide records are not imported automatically. The page
can reopen a non-demo local guide for review, but the ADMIN must provide its
missing NIC number before saving it. Tourist records likewise remain separate
from browser demo data.

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
endpoints and destination mutations require `ADMIN`, while destination GET
endpoints are public.

Sessions use HTTP-only cookies. Development uses `Secure=false` and
`SameSite=Lax`; the production profile forces secure cookies. Production CORS
must specify trusted frontend origins. If the deployed frontend and API are on
different sites, use HTTPS and configure an appropriate
`SESSION_COOKIE_SAME_SITE` value as well as the explicit CORS allowlist.

Authentication integration tests use a temporary in-memory H2 database and do
not modify MySQL.
