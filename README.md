# 🌴 Ceylon Explore – Tourism Management System

**Discover Sri Lanka. Customize Your Journey. Explore with Ceylon Explore.**

Ceylon Explore is a web-based Tourism Management System designed to simplify and enhance the travel planning experience in Sri Lanka. The platform allows tourists to explore destinations, discover tour packages, browse hotels, and manage their travel bookings through a user-friendly interface.

The system also provides administrative functionalities to manage tourism-related information, including destinations, tour packages, hotels, tour guides, tourists, and bookings.

---

## ✨ Key Features

### 👤 User Management
- User registration and login.
- Secure authentication.
- User profile management.
- Personalized user dashboard.

### 🏝️ Destination Management
- Explore popular tourist destinations in Sri Lanka.
- View destination descriptions and details.
- Manage destination information.

### 🧳 Tour Package Management
- Browse available tour packages.
- View package details, prices, and duration.
- Customize travel experiences.
- Manage tour packages through the admin panel.

### 🏨 Hotel Management
- Manage hotel information.
- View hotel details and facilities.
- Manage room information.

### 🧑‍💼 Tour Guide Management
- Manage tour guide profiles.
- Maintain guide contact information and details.

### 📅 Booking Management
- Create and manage travel bookings.
- View booking information.
- Track booking and payment statuses.

### 🔐 Admin Dashboard
- Centralized administration.
- Manage tourists, destinations, tour packages, hotels, tour guides, and bookings.
- Perform CRUD operations.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Java | Backend programming |
| Spring Boot | Backend framework |
| Spring Data JPA | Database operations |
| Spring Security | Authentication and authorization |
| MySQL | Database management |
| HTML5 | Frontend structure |
| CSS3 | Styling and UI design |
| JavaScript | Frontend functionality |
| Bootstrap | Responsive UI components |
| Git & GitHub | Version control and collaboration |
| IntelliJ IDEA | Development environment |

*Note: Update this list to match the technologies and dependencies actually implemented in the project.*

---

## 🏗️ System Architecture

The application follows a layered architecture:

- **Presentation Layer:** HTML, CSS, JavaScript and Bootstrap.
- **Controller Layer:** Handles incoming HTTP requests and API endpoints.
- **Service Layer:** Contains business logic and application operations.
- **Repository Layer:** Handles database communication using Spring Data JPA.
- **Database Layer:** Stores application data in MySQL.

---

## 📂 Main System Modules

1. User Authentication and Management
2. Tourist Management
3. Destination Management
4. Tour Package Management
5. Hotel Management
6. Tour Guide Management
7. Booking Management
8. Admin Dashboard
9. User Dashboard

---

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- Java JDK
- IntelliJ IDEA
- MySQL Server
- MySQL Workbench
- Git
- Maven (if not using the included Maven Wrapper)

### 1. Clone the Repository

```bash
git clone https://github.com/Aagash1010/Tourism-Package-Customization-Platform.git
```

### 2. Open the Project

Open the cloned project using IntelliJ IDEA.

### 3. Configure the Database

Create a MySQL database:

```sql
CREATE DATABASE ceylon_explore;
```

Configure your database connection in `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ceylon_explore
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Replace `YOUR_PASSWORD` with your local MySQL password.

**Security:** Do not commit actual database passwords or other credentials to GitHub. Use environment variables or a local configuration file excluded from version control.

### 4. Run the Application

Run the main Spring Boot application class from IntelliJ IDEA.

Alternatively, use Maven:

```bash
mvn spring-boot:run
```

### 5. Access the Application

Once the application starts, open:

```text
http://localhost:8080
```

---

## 🧠 Object-Oriented Programming Concepts

This project demonstrates important Object-Oriented Programming concepts:

- **Encapsulation:** Protecting data using private attributes and controlled access.
- **Inheritance:** Reusing common properties and behaviours through inheritance where applicable.
- **Polymorphism:** Supporting different implementations through method overriding and interfaces where applicable.
- **Abstraction:** Separating implementation details from essential application functionality.

---

## 📸 Screenshots

Screenshots of the application will be added here.

| Homepage | User Dashboard |
|---|---|
| Add homepage screenshot here | Add dashboard screenshot here |

| Admin Dashboard | Destination Management |
|---|---|
| Add admin screenshot here | Add destination screenshot here |

---

## 🚀 Future Improvements

- Online payment gateway integration.
- Advanced tour package customization.
- Hotel room availability checking.
- Customer reviews and ratings.
- Email booking confirmations.
- Interactive maps and destination recommendations.
- Improved reporting and analytics.

---

## 👨‍💻 Development Team

**Project:** Ceylon Explore – Tourism Management System

**Repository:** [Tourism Package Customization Platform](https://github.com/Aagash1010/Tourism-Package-Customization-Platform)

Developed as an academic project to demonstrate Java development, Object-Oriented Programming, database management, and web application development.

---

## 📄 License

This project was developed for educational and academic purposes.
