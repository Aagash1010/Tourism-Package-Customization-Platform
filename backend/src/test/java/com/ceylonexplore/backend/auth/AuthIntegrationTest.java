package com.ceylonexplore.backend.auth;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.Booking;
import com.ceylonexplore.backend.entity.BookingStatus;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.UserAccountRepository;
import com.ceylonexplore.backend.repository.TouristRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private TouristRepository touristRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUpAccounts() {
        var tourists = touristRepository.findAll();
        tourists.stream()
                .filter(tourist -> tourist.getUserAccount() != null)
                .forEach(tourist -> tourist.setUserAccount(null));
        touristRepository.saveAll(tourists);
        userAccountRepository.deleteAll();
        userAccountRepository.save(new UserAccount(
                "Test Tourist",
                "tourist@example.com",
                passwordEncoder.encode("TouristPass123"),
                AccountRole.USER,
                true
        ));
        userAccountRepository.save(new UserAccount(
                "Test Administrator",
                "admin@example.com",
                passwordEncoder.encode("AdminPass123"),
                AccountRole.ADMIN,
                true
        ));
    }

    @Test
    void registrationStoresOnlyEncodedPasswordAndAlwaysCreatesUserRole() throws Exception {
        MvcResult result = postWithCsrf(
                "/api/auth/register",
                "{\"fullName\":\"New Tourist\",\"email\":\"new@example.com\",\"password\":\"NewPass123\",\"phone\":\"+94771234567\",\"country\":\"Sri Lanka\",\"termsAccepted\":true}",
                null
        );

        status().isCreated().match(result);
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        org.junit.jupiter.api.Assertions.assertEquals("USER", body.at("/user/role").asText());
        org.junit.jupiter.api.Assertions.assertFalse(body.toString().contains("password"));
        UserAccount saved = userAccountRepository.findByEmailIgnoreCase("new@example.com").orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotEquals("NewPass123", saved.getPassword());
        org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches("NewPass123", saved.getPassword()));
    }

    @Test
    void registrationRejectsDuplicateAndInvalidAccounts() throws Exception {
        TokenAndSession duplicateToken = csrfToken();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Duplicate\",\"email\":\"TOURIST@example.com\",\"password\":\"NewPass123\",\"phone\":\"+94771234567\",\"country\":\"Sri Lanka\",\"termsAccepted\":true}")
                        .header("X-CSRF-TOKEN", duplicateToken.token())
                        .session(duplicateToken.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email address already exists."));

        TokenAndSession token = csrfToken();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\" \",\"email\":\"not-an-email\",\"password\":\"short\",\"phone\":\"+94771234567\",\"country\":\"Sri Lanka\",\"termsAccepted\":true}")
                        .header("X-CSRF-TOKEN", token.token())
                        .session(token.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.fullName").exists())
                .andExpect(jsonPath("$.errors.password").exists());

        TokenAndSession termsToken = csrfToken();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Valid Traveler\",\"email\":\"terms@example.com\",\"password\":\"NewPass123\",\"phone\":\"+94771234567\",\"country\":\"Sri Lanka\",\"termsAccepted\":false}")
                        .header("X-CSRF-TOKEN", termsToken.token())
                        .session(termsToken.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.termsAccepted").exists());
    }

    @Test
    void registrationCannotAssignAdminRole() throws Exception {
        TokenAndSession token = csrfToken();
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Public User\",\"email\":\"role-test@example.com\",\"password\":\"NewPass123\",\"phone\":\"+94771234567\",\"country\":\"Sri Lanka\",\"termsAccepted\":true,\"role\":\"ADMIN\"}")
                        .header("X-CSRF-TOKEN", token.token())
                        .session(token.session()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andReturn();

        org.junit.jupiter.api.Assertions.assertFalse(
                result.getResponse().getContentAsString().toLowerCase().contains("password")
        );
    }

    @Test
    void loginCreatesSessionAndInvalidCredentialsUseGenericUnauthorizedResponse() throws Exception {
        TokenAndSession token = csrfToken();
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"TOURIST@example.com\",\"password\":\"TouristPass123\"}")
                        .header("X-CSRF-TOKEN", token.token())
                        .session(token.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andReturn();
        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("tourist@example.com"))
                .andExpect(jsonPath("$.user.password").doesNotExist());

        TokenAndSession badLoginToken = csrfToken();
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"missing@example.com\",\"password\":\"WrongPass123\"}")
                        .header("X-CSRF-TOKEN", badLoginToken.token())
                        .session(badLoginToken.session()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    void roleAuthorizationAndLogoutAreEnforced() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized());

        MockHttpSession userSession = login("tourist@example.com", "TouristPass123");
        mockMvc.perform(get("/api/user/dashboard").session(userSession))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/dashboard").session(userSession))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/tourists").session(userSession))
                .andExpect(status().isForbidden());

        MockHttpSession adminSession = login("admin@example.com", "AdminPass123");
        mockMvc.perform(get("/api/admin/dashboard").session(adminSession))
                .andExpect(status().isOk());

        TokenAndSession logoutToken = csrfToken(adminSession);
        mockMvc.perform(post("/api/auth/logout")
                        .header("X-CSRF-TOKEN", logoutToken.token())
                        .session(adminSession))
                .andExpect(status().isOk())
                .andReturn();
        org.junit.jupiter.api.Assertions.assertTrue(adminSession.isInvalid());

        mockMvc.perform(get("/api/auth/me").session(adminSession))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanCreateTouristAndBookingRequest() throws Exception {
        MockHttpSession adminSession = login("admin@example.com", "AdminPass123");
        TokenAndSession adminToken = csrfToken(adminSession);

        mockMvc.perform(post("/api/tour-packages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Cultural Heritage Tour\",\"destination\":\"Kandy\",\"duration\":\"3 Days / 2 Nights\",\"price\":35000.00,\"maxTravelers\":10,\"status\":\"Active\"}")
                        .header("X-CSRF-TOKEN", adminToken.token())
                        .session(adminSession))
                .andExpect(status().isCreated());

        TokenAndSession touristToken = csrfToken(adminToken.session());
        MvcResult touristResult = mockMvc.perform(post("/api/tourists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Guest Traveler\",\"email\":\"guest@example.com\",\"phone\":\"+94770000000\",\"country\":\"Sri Lanka\"}")
                        .header("X-CSRF-TOKEN", touristToken.token())
                        .session(touristToken.session()))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode touristBody = objectMapper.readTree(touristResult.getResponse().getContentAsString());
        long touristId = touristBody.get("id").asLong();

        TokenAndSession bookingToken = csrfToken(touristToken.session());
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"touristId\":" + touristId + ",\"packageId\":1,\"numberOfPeople\":2,\"bookingDate\":\"2026-10-22T00:00:00\",\"travelDate\":\"2026-11-30\",\"specialRequests\":\"Need airport pickup\",\"discount\":0.00,\"amountPaid\":0.00}")
                        .header("X-CSRF-TOKEN", bookingToken.token())
                        .session(bookingToken.session()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingReference").exists())
                .andExpect(jsonPath("$.touristId").value(touristId));
    }

    @Test
    void userCanOnlyReadOwnBookingsAndDashboardCountsUseDatabaseRecords() throws Exception {
        MockHttpSession adminSession = login("admin@example.com", "AdminPass123");
        TokenAndSession adminToken = csrfToken(adminSession);
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String ownEmail = "dashboard-" + suffix + "@example.com";
        String otherEmail = "other-" + suffix + "@example.com";

        MvcResult packageResult = mockMvc.perform(post("/api/tour-packages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dashboard package " + suffix + "\",\"destination\":\"Ella\",\"duration\":\"3 Days / 2 Nights\",\"price\":42000.00,\"maxTravelers\":8,\"minTravelers\":1,\"status\":\"Active\"}")
                        .header("X-CSRF-TOKEN", adminToken.token())
                        .session(adminToken.session()))
                .andExpect(status().isCreated())
                .andReturn();
        long packageId = objectMapper.readTree(packageResult.getResponse().getContentAsString()).get("id").asLong();

        long ownTouristId = createTourist(adminToken, "Dashboard Traveler", ownEmail);
        long otherTouristId = createTourist(adminToken, "Other Traveler", otherEmail);
        String bookingDate = LocalDateTime.now().withNano(0).toString();
        LocalDate travelDate = LocalDate.now().plusDays(20);
        String ownReference = createBooking(adminToken, ownTouristId, packageId, bookingDate, travelDate);
        String otherReference = createBooking(adminToken, otherTouristId, packageId, bookingDate, travelDate);
        Booking ownBooking = bookingRepository.findByBookingReference(ownReference).orElseThrow();
        ownBooking.setBookingStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(ownBooking);

        MvcResult registration = postWithCsrf(
                "/api/auth/register",
                "{\"fullName\":\"Dashboard Traveler\",\"email\":\"" + ownEmail + "\",\"password\":\"NewPass123\",\"phone\":\"+94771234567\",\"country\":\"Sri Lanka\",\"termsAccepted\":true}",
                null
        );
        status().isCreated().match(registration);
        long accountId = objectMapper.readTree(registration.getResponse().getContentAsString())
                .at("/user/id").asLong();
        TokenAndSession linkToken = csrfToken(adminToken.session());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                                "/api/tourists/" + ownTouristId + "/account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountId\":" + accountId + "}")
                        .header("X-CSRF-TOKEN", linkToken.token())
                        .session(linkToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(accountId));
        MockHttpSession userSession = login(ownEmail, "NewPass123");

        mockMvc.perform(get("/api/users/me").session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(ownEmail))
                .andExpect(jsonPath("$.password").doesNotExist());
        mockMvc.perform(get("/api/users/me/bookings").session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].bookingReference").value(ownReference));
        mockMvc.perform(get("/api/users/me/bookings/upcoming").session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/users/me/bookings/" + ownReference).session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.touristEmail").value(ownEmail))
                .andExpect(jsonPath("$.destination").value("Ella"));
        mockMvc.perform(get("/api/users/me/dashboard").session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBookings").value(1))
                .andExpect(jsonPath("$.upcomingTrips").value(1))
                .andExpect(jsonPath("$.pendingBookings").value(0));
        mockMvc.perform(get("/api/users/me/bookings/" + otherReference).session(userSession))
                .andExpect(status().isNotFound());

        MockHttpSession adminAgain = login("admin@example.com", "AdminPass123");
        mockMvc.perform(get("/api/users/me").session(adminAgain))
                .andExpect(status().isForbidden());
    }

    @Test
    void signedInUserCanBookPackageAndBookingIsLinkedToTheirAccount() throws Exception {
        MockHttpSession adminSession = login("admin@example.com", "AdminPass123");
        TokenAndSession adminToken = csrfToken(adminSession);
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        MvcResult packageResult = mockMvc.perform(post("/api/tour-packages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"User booking package " + suffix + "\",\"destination\":\"Ella\",\"duration\":\"3 Days / 2 Nights\",\"price\":42000.00,\"maxTravelers\":8,\"minTravelers\":1,\"status\":\"Active\"}")
                        .header("X-CSRF-TOKEN", adminToken.token())
                        .session(adminToken.session()))
                .andExpect(status().isCreated())
                .andReturn();
        long packageId = objectMapper.readTree(packageResult.getResponse().getContentAsString()).get("id").asLong();

        UserAccount account = userAccountRepository.findByEmailIgnoreCase("tourist@example.com").orElseThrow();
        account.setCountry("Sri Lanka");
        account.setPhone("+94771234567");
        userAccountRepository.save(account);
        MockHttpSession userSession = login("tourist@example.com", "TouristPass123");
        TokenAndSession userToken = csrfToken(userSession);

        MvcResult bookingResult = mockMvc.perform(post("/api/users/me/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"packageId\":" + packageId + ",\"numberOfPeople\":2,\"travelDate\":\"" +
                                LocalDate.now().plusDays(30) + "\",\"specialRequests\":\"Window seat\"}")
                        .header("X-CSRF-TOKEN", userToken.token())
                        .session(userToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.touristName").value("Test Tourist"))
                .andExpect(jsonPath("$.packageId").value(packageId))
                .andExpect(jsonPath("$.bookingStatus").value("PENDING"))
                .andReturn();

        String bookingReference = objectMapper.readTree(bookingResult.getResponse().getContentAsString())
                .get("bookingReference").asText();
        org.junit.jupiter.api.Assertions.assertEquals(
                account.getId(),
                touristRepository.findByUserAccountId(account.getId()).orElseThrow().getUserAccount().getId()
        );
        mockMvc.perform(get("/api/users/me/bookings/" + bookingReference).session(userSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.packageName").value("User booking package " + suffix))
                .andExpect(jsonPath("$.touristEmail").value("tourist@example.com"));
    }

    @Test
    void profileUpdatesAndPasswordChangesPreserveAccountIdentityAndRole() throws Exception {
        MockHttpSession userSession = login("tourist@example.com", "TouristPass123");
        TokenAndSession profileToken = csrfToken(userSession);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Updated Traveler\",\"phone\":\"+94770001111\",\"country\":\"Sri Lanka\",\"address\":\"Colombo\",\"profileImage\":\"https://example.com/avatar.jpg\",\"email\":\"admin@example.com\",\"role\":\"ADMIN\"}")
                        .header("X-CSRF-TOKEN", profileToken.token())
                        .session(profileToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated Traveler"))
                .andExpect(jsonPath("$.email").value("tourist@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));

        TokenAndSession wrongPasswordToken = csrfToken(profileToken.session());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"incorrect\",\"newPassword\":\"NewPass123\",\"confirmNewPassword\":\"NewPass123\"}")
                        .header("X-CSRF-TOKEN", wrongPasswordToken.token())
                        .session(wrongPasswordToken.session()))
                .andExpect(status().isBadRequest());

        TokenAndSession passwordToken = csrfToken(wrongPasswordToken.session());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"TouristPass123\",\"newPassword\":\"ChangedPass123\",\"confirmNewPassword\":\"ChangedPass123\"}")
                        .header("X-CSRF-TOKEN", passwordToken.token())
                        .session(passwordToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        org.junit.jupiter.api.Assertions.assertTrue(
                passwordEncoder.matches(
                        "ChangedPass123",
                        userAccountRepository.findByEmailIgnoreCase("tourist@example.com").orElseThrow().getPassword()
                )
        );
    }

    private long createTourist(TokenAndSession token, String name, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/tourists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"" + name + "\",\"email\":\"" + email + "\",\"phone\":\"+94770000000\",\"country\":\"Sri Lanka\"}")
                        .header("X-CSRF-TOKEN", token.token())
                        .session(token.session()))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private String createBooking(
            TokenAndSession token,
            long touristId,
            long packageId,
            String bookingDate,
            LocalDate travelDate
    ) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"touristId\":" + touristId + ",\"packageId\":" + packageId +
                                ",\"numberOfPeople\":2,\"bookingDate\":\"" + bookingDate +
                                "\",\"travelDate\":\"" + travelDate + "\"}")
                        .header("X-CSRF-TOKEN", token.token())
                        .session(token.session()))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("bookingReference").asText();
    }

    private MockHttpSession login(String email, String password) throws Exception {
        TokenAndSession token = csrfToken();
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "email", email,
                                "password", password
                        )))
                        .header("X-CSRF-TOKEN", token.token())
                        .session(token.session()))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private TokenAndSession csrfToken() throws Exception {
        return csrfToken(null);
    }

    private TokenAndSession csrfToken(MockHttpSession session) throws Exception {
        var request = get("/api/auth/csrf");
        if (session != null) {
            request.session(session);
        }
        MvcResult result = mockMvc.perform(request).andExpect(status().isOk()).andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return new TokenAndSession(body.get("csrfToken").asText(), (MockHttpSession) result.getRequest().getSession(false));
    }

    private MvcResult postWithCsrf(String path, String content, MockHttpSession session) throws Exception {
        TokenAndSession token = csrfToken(session);
        var request = post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .content(content)
                .header("X-CSRF-TOKEN", token.token())
                .session(token.session());
        return mockMvc.perform(request).andReturn();
    }

    private record TokenAndSession(String token, MockHttpSession session) {
    }
}
