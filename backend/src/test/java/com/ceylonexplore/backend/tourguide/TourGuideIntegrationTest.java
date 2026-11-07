package com.ceylonexplore.backend.tourguide;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.TourGuide;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.repository.TourGuideRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TourGuideIntegrationTest {

    private static final String VALID_TOUR_GUIDE = """
            {
              "fullName": "Nimal Perera",
              "email": "nimal@example.com",
              "phoneNumber": "+94 77 123 4567",
              "address": "10 Lake Road, Kandy",
              "city": "Kandy",
              "district": "Kandy",
              "nationality": "Sri Lankan",
              "nicNumber": "199012345678",
              "gender": "Male",
              "dateOfBirth": "1990-05-10",
              "licenseNumber": "SLTG-1178",
              "qualification": "Diploma in Tour Guiding",
              "languages": ["Sinhala", "English", "English"],
              "workingDays": ["Monday", "Tuesday"],
              "preferredTourTypes": ["Cultural Tours", "City Tours"],
              "specialization": "Cultural Tours",
              "experienceYears": 8,
              "dailyRate": 9500.00,
              "profileImage": "assets/images/avatar1.jpg",
              "employmentStatus": "Active",
              "maxGroupSize": 15,
              "rating": 4.70,
              "certifications": "First Aid Training",
              "description": "An experienced cultural tour guide."
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TourGuideRepository tourGuideRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        tourGuideRepository.deleteAll();
        userAccountRepository.deleteAll();
        userAccountRepository.save(new UserAccount(
                "Tour Guide Test Admin",
                "tour-guide-admin@example.com",
                passwordEncoder.encode("AdminPass123"),
                AccountRole.ADMIN,
                true
        ));
        userAccountRepository.save(new UserAccount(
                "Tour Guide Test User",
                "tour-guide-user@example.com",
                passwordEncoder.encode("UserPass123"),
                AccountRole.USER,
                true
        ));
    }

    @Test
    void tourGuideCrudSearchAndFiltersPersistRecords() throws Exception {
        MockHttpSession adminSession = login("tour-guide-admin@example.com", "AdminPass123");
        mockMvc.perform(get("/api/tour-guides"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        TokenAndSession createToken = csrfToken(adminSession);
        MvcResult createdResult = mockMvc.perform(post("/api/tour-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE)
                        .header("X-CSRF-TOKEN", createToken.token())
                        .session(createToken.session()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fullName").value("Nimal Perera"))
                .andExpect(jsonPath("$.email").value("nimal@example.com"))
                .andExpect(jsonPath("$.nicNumber").value("199012345678"))
                .andExpect(jsonPath("$.licenseNumber").value("SLTG-1178"))
                .andExpect(jsonPath("$.nationality").value("Sri Lankan"))
                .andExpect(jsonPath("$.availabilityStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.languages.length()").value(2))
                .andExpect(jsonPath("$.workingDays.length()").value(2))
                .andExpect(jsonPath("$.preferredTourTypes.length()").value(2))
                .andExpect(jsonPath("$.maxGroupSize").value(15))
                .andExpect(jsonPath("$.rating").value(4.70))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty())
                .andReturn();

        JsonNode created = objectMapper.readTree(createdResult.getResponse().getContentAsString());
        long id = created.get("id").asLong();
        TourGuide persisted = tourGuideRepository.findById(id).orElseThrow();
        String createdAt = persisted.getCreatedAt().toString();

        mockMvc.perform(get("/api/tour-guides/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.specialization").value("Cultural Tours"))
                .andExpect(jsonPath("$.languages.length()").value(2))
                .andExpect(jsonPath("$.workingDays[0]").value("Monday"))
                .andExpect(jsonPath("$.preferredTourTypes[0]").value("City Tours"));
        mockMvc.perform(get("/api/tour-guides/search").param("name", "nimal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/tour-guides/availability/AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/tour-guides/specialization/{specialization}", "Cultural Tours"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/tour-guides/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id));

        TokenAndSession updateToken = csrfToken(createToken.session());
        mockMvc.perform(put("/api/tour-guides/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE
                                .replace("Nimal Perera", "Nimal Updated")
                                .replace(
                                        "\"description\":",
                                        "\"availabilityStatus\": \"ON_TOUR\",\n  \"description\":"
                                ))
                        .header("X-CSRF-TOKEN", updateToken.token())
                        .session(updateToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Nimal Updated"))
                .andExpect(jsonPath("$.availabilityStatus").value("ON_TOUR"));
        TourGuide updated = tourGuideRepository.findById(id).orElseThrow();
        assertEquals(createdAt, updated.getCreatedAt().toString());
        assertNotNull(updated.getUpdatedAt());

        TokenAndSession deleteToken = csrfToken(updateToken.session());
        mockMvc.perform(delete("/api/tour-guides/{id}", id)
                        .header("X-CSRF-TOKEN", deleteToken.token())
                        .session(deleteToken.session()))
                .andExpect(status().isNoContent());
        assertFalse(tourGuideRepository.existsById(id));

        TokenAndSession missingToken = csrfToken(deleteToken.session());
        mockMvc.perform(delete("/api/tour-guides/{id}", 999999L)
                        .header("X-CSRF-TOKEN", missingToken.token())
                        .session(missingToken.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Tour guide with ID 999999 was not found."));
    }

    @Test
    void duplicateEmailNicAndLicenseReturnConflict() throws Exception {
        MockHttpSession adminSession = login("tour-guide-admin@example.com", "AdminPass123");
        TokenAndSession firstToken = csrfToken(adminSession);
        mockMvc.perform(post("/api/tour-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE)
                        .header("X-CSRF-TOKEN", firstToken.token())
                        .session(firstToken.session()))
                .andExpect(status().isCreated());

        TokenAndSession duplicateEmailToken = csrfToken(firstToken.session());
        mockMvc.perform(post("/api/tour-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE
                                .replace("nimal@example.com", "NIMAL@example.com")
                                .replace("199012345678", "200012345678"))
                        .header("X-CSRF-TOKEN", duplicateEmailToken.token())
                        .session(duplicateEmailToken.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A tour guide with this email already exists."));

        TokenAndSession duplicateNicToken = csrfToken(duplicateEmailToken.session());
        mockMvc.perform(post("/api/tour-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE
                                .replace("nimal@example.com", "another@example.com"))
                        .header("X-CSRF-TOKEN", duplicateNicToken.token())
                        .session(duplicateNicToken.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A tour guide with this NIC number already exists."));

        TokenAndSession duplicateLicenseToken = csrfToken(duplicateNicToken.session());
        mockMvc.perform(post("/api/tour-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE
                                .replace("nimal@example.com", "third@example.com")
                                .replace("199012345678", "200112345678"))
                        .header("X-CSRF-TOKEN", duplicateLicenseToken.token())
                        .session(duplicateLicenseToken.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A tour guide with this license number already exists."));
    }

    @Test
    void validationAndAuthorizationAreEnforced() throws Exception {
        mockMvc.perform(get("/api/tour-guides"))
                .andExpect(status().isOk());

        TokenAndSession anonymousToken = csrfToken(null);
        mockMvc.perform(post("/api/tour-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE)
                        .header("X-CSRF-TOKEN", anonymousToken.token())
                        .session(anonymousToken.session()))
                .andExpect(status().isUnauthorized());

        MockHttpSession userSession = login("tour-guide-user@example.com", "UserPass123");
        TokenAndSession userToken = csrfToken(userSession);
        mockMvc.perform(post("/api/tour-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE)
                        .header("X-CSRF-TOKEN", userToken.token())
                        .session(userToken.session()))
                .andExpect(status().isForbidden());

        MockHttpSession adminSession = login("tour-guide-admin@example.com", "AdminPass123");
        TokenAndSession createToken = csrfToken(adminSession);
        MvcResult createdResult = mockMvc.perform(post("/api/tour-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE)
                        .header("X-CSRF-TOKEN", createToken.token())
                        .session(createToken.session()))
                .andExpect(status().isCreated())
                .andReturn();
        long id = objectMapper.readTree(createdResult.getResponse().getContentAsString())
                .get("id")
                .asLong();

        TokenAndSession updateToken = csrfToken(userToken.session());
        mockMvc.perform(put("/api/tour-guides/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE)
                        .header("X-CSRF-TOKEN", updateToken.token())
                        .session(updateToken.session()))
                .andExpect(status().isForbidden());

        TokenAndSession deleteToken = csrfToken(updateToken.session());
        mockMvc.perform(delete("/api/tour-guides/{id}", id)
                        .header("X-CSRF-TOKEN", deleteToken.token())
                        .session(deleteToken.session()))
                .andExpect(status().isForbidden());

        TokenAndSession invalidToken = csrfToken(createToken.session());
        mockMvc.perform(post("/api/tour-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOUR_GUIDE
                                .replace("\"experienceYears\": 8", "\"experienceYears\": -1")
                                .replace("assets/images/avatar1.jpg", "../private.jpg"))
                        .header("X-CSRF-TOKEN", invalidToken.token())
                        .session(invalidToken.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.experienceYears").exists())
                .andExpect(jsonPath("$.errors.profileImage").exists());
    }

    private MockHttpSession login(String email, String password) throws Exception {
        TokenAndSession token = csrfToken(null);
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

    private TokenAndSession csrfToken(MockHttpSession session) throws Exception {
        var request = get("/api/auth/csrf");
        if (session != null) {
            request.session(session);
        }
        MvcResult result = mockMvc.perform(request).andExpect(status().isOk()).andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return new TokenAndSession(
                body.get("csrfToken").asText(),
                (MockHttpSession) result.getRequest().getSession(false)
        );
    }

    private record TokenAndSession(String token, MockHttpSession session) {
    }
}
