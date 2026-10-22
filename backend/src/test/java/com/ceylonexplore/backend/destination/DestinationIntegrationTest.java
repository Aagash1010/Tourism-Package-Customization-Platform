package com.ceylonexplore.backend.destination;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.Destination;
import com.ceylonexplore.backend.entity.TourPackage;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.repository.DestinationRepository;
import com.ceylonexplore.backend.repository.TourPackageRepository;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DestinationIntegrationTest {

    private static final String VALID_DESTINATION = """
            {
              "name": "Sigiriya",
              "district": "Matale",
              "province": "Central",
              "category": "Historical and Cultural",
              "shortDescription": "An ancient rock fortress.",
              "fullDescription": "A historic attraction in central Sri Lanka.",
              "entryFee": 1250.50,
              "bestTime": "January to April",
              "duration": "3–4 hours",
              "openingHours": "7:00 AM – 5:30 PM",
              "address": "Sigiriya, Matale District",
              "latitude": 7.957,
              "longitude": 80.760,
              "featured": true,
              "status": "Active",
              "imageUrl": "https://example.com/sigiriya.jpg"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private TourPackageRepository tourPackageRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        destinationRepository.deleteAll();
        userAccountRepository.deleteAll();
        userAccountRepository.save(new UserAccount(
                "Destination Test Admin",
                "destination-admin@example.com",
                passwordEncoder.encode("AdminPass123"),
                AccountRole.ADMIN,
                true
        ));
        userAccountRepository.save(new UserAccount(
                "Destination Test User",
                "destination-user@example.com",
                passwordEncoder.encode("UserPass123"),
                AccountRole.USER,
                true
        ));
    }

    @Test
    void destinationCrudPersistsRecordsAndValidatesRequests() throws Exception {
        MockHttpSession adminSession = login("destination-admin@example.com", "AdminPass123");

        mockMvc.perform(get("/api/destinations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        TokenAndSession createToken = csrfToken(adminSession);
        MvcResult createdResult = mockMvc.perform(post("/api/destinations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_DESTINATION)
                        .header("X-CSRF-TOKEN", createToken.token())
                        .session(createToken.session()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Sigiriya"))
                .andExpect(jsonPath("$.entryFee").value(1250.50))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andReturn();

        JsonNode created = objectMapper.readTree(createdResult.getResponse().getContentAsString());
        long id = created.get("id").asLong();
        Destination persistedDestination = destinationRepository.findById(id).orElseThrow();
        String createdAt = persistedDestination.getCreatedAt().toString();
        assertNotNull(persistedDestination.getCreatedAt());
        assertNotNull(persistedDestination.getUpdatedAt());

        TokenAndSession duplicateToken = csrfToken(createToken.session());
        mockMvc.perform(post("/api/destinations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_DESTINATION.replace("Sigiriya", "sigiriya"))
                        .header("X-CSRF-TOKEN", duplicateToken.token())
                        .session(duplicateToken.session()))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/destinations/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));

        TokenAndSession updateToken = csrfToken(createToken.session());
        mockMvc.perform(put("/api/destinations/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_DESTINATION.replace("Sigiriya", "Sigiriya Updated"))
                        .header("X-CSRF-TOKEN", updateToken.token())
                        .session(updateToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sigiriya Updated"));
        Destination updatedDestination = destinationRepository.findById(id).orElseThrow();
        assertEquals("Sigiriya Updated", updatedDestination.getName());
        assertEquals(createdAt, updatedDestination.getCreatedAt().toString());

        TokenAndSession invalidToken = csrfToken(updateToken.session());
        mockMvc.perform(post("/api/destinations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": " ",
                                  "district": "Matale",
                                  "province": "Central",
                                  "category": "Historical and Cultural",
                                  "shortDescription": "Invalid request",
                                  "entryFee": -1,
                                  "bestTime": "January",
                                  "duration": "2 hours",
                                  "address": "Matale",
                                  "latitude": 91,
                                  "featured": false,
                                  "status": "Active",
                                  "imageUrl": "javascript:alert(1)"
                                }
                                """)
                        .header("X-CSRF-TOKEN", invalidToken.token())
                        .session(invalidToken.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.entryFee").exists())
                .andExpect(jsonPath("$.errors.latitude").exists())
                .andExpect(jsonPath("$.errors.imageUrl").exists());

        mockMvc.perform(get("/api/destinations/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Destination with ID 999999 was not found."));

        TokenAndSession deleteToken = csrfToken(invalidToken.session());
        mockMvc.perform(delete("/api/destinations/{id}", id)
                        .header("X-CSRF-TOKEN", deleteToken.token())
                        .session(deleteToken.session()))
                .andExpect(status().isNoContent());
        assertFalse(destinationRepository.existsById(id));
    }

    @Test
    void searchCategoryAndActiveRoutesReturnMatchingDestinations() throws Exception {
        Destination active = objectMapper.readValue(VALID_DESTINATION, Destination.class);
        destinationRepository.save(active);
        Destination inactive = objectMapper.readValue(
                VALID_DESTINATION.replace("Sigiriya", "Inactive Sigiriya"),
                Destination.class
        );
        inactive.setStatus("Inactive");
        destinationRepository.save(inactive);

        mockMvc.perform(get("/api/destinations/search").param("keyword", "sigiriya"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/destinations/search").param("keyword", "matale"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/destinations/category/{category}", "Historical and Cultural"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/destinations/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("Active"));
    }

    @Test
    void destinationReferencedByTourPackageCannotBeDeleted() throws Exception {
        Destination destination = objectMapper.readValue(VALID_DESTINATION, Destination.class);
        destination = destinationRepository.save(destination);

        TourPackage tourPackage = new TourPackage();
        tourPackage.setName("Sigiriya package");
        tourPackage.setDestination(destination.getName());
        tourPackage.setDuration("2 days");
        tourPackage.setPrice(new java.math.BigDecimal("25000.00"));
        tourPackage.setMaxTravelers(8);
        tourPackage.setStatus("Active");
        TourPackage savedTourPackage = tourPackageRepository.save(tourPackage);

        MockHttpSession adminSession = login("destination-admin@example.com", "AdminPass123");
        TokenAndSession token = csrfToken(adminSession);
        mockMvc.perform(delete("/api/destinations/{id}", destination.getId())
                        .header("X-CSRF-TOKEN", token.token())
                        .session(token.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "This destination cannot be deleted because a tour package references it."
                ));
        assertTrue(destinationRepository.existsById(destination.getId()));
        tourPackageRepository.delete(savedTourPackage);
    }

    @Test
    void destinationBrowsingIsPublicButMutationsRequireAnAdmin() throws Exception {
        Destination destination = objectMapper.readValue(VALID_DESTINATION, Destination.class);
        destination = destinationRepository.save(destination);

        mockMvc.perform(get("/api/destinations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Sigiriya"));

        MockHttpSession userSession = login("destination-user@example.com", "UserPass123");
        TokenAndSession userToken = csrfToken(userSession);
        mockMvc.perform(post("/api/destinations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_DESTINATION)
                        .header("X-CSRF-TOKEN", userToken.token())
                        .session(userToken.session()))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/destinations/{id}", destination.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(VALID_DESTINATION)
                                .header("X-CSRF-TOKEN", userToken.token())
                                .session(userToken.session()))
                        .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/destinations/{id}", destination.getId())
                                .header("X-CSRF-TOKEN", userToken.token())
                                .session(userToken.session()))
                        .andExpect(status().isForbidden());
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
        return new TokenAndSession(body.get("csrfToken").asText(), (MockHttpSession) result.getRequest().getSession(false));
    }

    private record TokenAndSession(String token, MockHttpSession session) {
    }
}
