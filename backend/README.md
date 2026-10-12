# Ceylon Explore Backend

This folder contains the initial Spring Boot backend foundation. It does not yet
contain module CRUD endpoints, entities, repositories, or database tables.

## Requirements

- JDK 21 or newer
- Apache Maven 3.6.3 or newer
- MySQL running locally with a database named `ceylon_explore`

## Configure and run

From this folder, set the MySQL password in the current PowerShell session and
start Spring Boot:

```powershell
$env:DB_PASSWORD = "<your-mysql-password>"
mvn spring-boot:run
```

The database username defaults to `root`. Override `DB_USERNAME` or `DB_URL` if
your local MySQL setup differs. The password is read from `DB_PASSWORD` and is
not stored in this project.

## Test endpoints

- `GET http://localhost:8080/api/test` — API liveness check.
- `GET http://localhost:8080/api/test/database` — executes `SELECT 1` against
  the configured database; it does not create or modify tables.

The second endpoint returns HTTP 503 and a safe JSON error when MySQL is
unavailable or its settings are incorrect.

## Frontend CORS

Development allows only `http://localhost:5500` and
`http://127.0.0.1:5500`, the common VS Code Live Server origins. Override these
with a comma-separated `CORS_ALLOWED_ORIGINS` environment variable if the
frontend is served elsewhere. Do not open the HTML files directly using
`file://`; serve the frontend on an HTTP origin.

When using the `prod` Spring profile, `CORS_ALLOWED_ORIGINS` must be explicitly
set to the deployed frontend origin or origins. Wildcard origins are not used.

## Package structure

Java base package: `com.ceylonexplore.backend`. Module package folders are
prepared under this base package for future controller, service, repository,
entity, exception, and configuration work.
