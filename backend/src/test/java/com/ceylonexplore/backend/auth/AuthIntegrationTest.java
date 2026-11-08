package com.ceylonexplore.backend.auth;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.repository.UserAccountRepository;
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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUpAccounts() {
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
                "{\"fullName\":\"New Tourist\",\"email\":\"new@example.com\",\"password\":\"NewPass123\"}",
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
                        .content("{\"fullName\":\"Duplicate\",\"email\":\"TOURIST@example.com\",\"password\":\"NewPass123\"}")
                        .header("X-CSRF-TOKEN", duplicateToken.token())
                        .session(duplicateToken.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email address already exists."));

        TokenAndSession token = csrfToken();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\" \",\"email\":\"not-an-email\",\"password\":\"short\"}")
                        .header("X-CSRF-TOKEN", token.token())
                        .session(token.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.fullName").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void registrationCannotAssignAdminRole() throws Exception {
        TokenAndSession token = csrfToken();
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Public User\",\"email\":\"role-test@example.com\",\"password\":\"NewPass123\",\"role\":\"ADMIN\"}")
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
    void anonymousUserCanCreateTouristAndBookingRequest() throws Exception {
        MockHttpSession adminSession = login("admin@example.com", "AdminPass123");
        TokenAndSession adminToken = csrfToken(adminSession);

        mockMvc.perform(post("/api/tour-packages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Cultural Heritage Tour\",\"destination\":\"Kandy\",\"duration\":\"3 Days / 2 Nights\",\"price\":35000.00,\"maxTravelers\":10,\"status\":\"Active\"}")
                        .header("X-CSRF-TOKEN", adminToken.token())
                        .session(adminSession))
                .andExpect(status().isCreated());

        TokenAndSession publicTouristToken = csrfToken();
        MvcResult touristResult = mockMvc.perform(post("/api/tourists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Guest Traveler\",\"email\":\"guest@example.com\",\"phone\":\"+94770000000\",\"country\":\"Sri Lanka\"}")
                        .header("X-CSRF-TOKEN", publicTouristToken.token())
                        .session(publicTouristToken.session()))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode touristBody = objectMapper.readTree(touristResult.getResponse().getContentAsString());
        long touristId = touristBody.get("id").asLong();

        TokenAndSession publicBookingToken = csrfToken();
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"touristId\":" + touristId + ",\"packageId\":1,\"numberOfPeople\":2,\"bookingDate\":\"2026-10-22\",\"travelDate\":\"2026-10-30\",\"specialRequests\":\"Need airport pickup\",\"discount\":0.00,\"amountPaid\":0.00}")
                        .header("X-CSRF-TOKEN", publicBookingToken.token())
                        .session(publicBookingToken.session()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingReference").exists())
                .andExpect(jsonPath("$.touristId").value(touristId));
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
