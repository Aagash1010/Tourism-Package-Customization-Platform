package com.ceylonexplore.backend.tourpackage;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.repository.UserAccountRepository;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

import java.util.UUID;

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
class TourPackageIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUpAdmin() {
        userAccountRepository.deleteAll();
        userAccountRepository.save(new UserAccount(
                "Package Administrator",
                "package-admin@example.com",
                passwordEncoder.encode("AdminPass123"),
                AccountRole.ADMIN,
                true
        ));
    }

    @Test
    void packageAliasSupportsAdminCrudAndReturnsOrderedItinerary() throws Exception {
        mockMvc.perform(get("/api/packages/active"))
                .andExpect(status().isOk());

        MockHttpSession session = login();
        String uniqueName = "Package CRUD " + UUID.randomUUID();
        String request = """
                {
                  "name": "%s",
                  "destination": "Kandy",
                  "description": "A package integration test",
                  "duration": "2 days / 1 night",
                  "durationDays": 2,
                  "durationNights": 1,
                  "price": 12500.00,
                  "minTravelers": 1,
                  "maxTravelers": 8,
                  "category": "Cultural Heritage",
                  "status": "Active",
                  "itinerary": [
                    {"dayNumber": 2, "title": "Temple visit", "description": "Explore the city"},
                    {"dayNumber": 1, "title": "Arrival", "description": "Check in"}
                  ]
                }
                """.formatted(uniqueName);

        TokenAndSession createToken = csrfToken(session);
        MvcResult created = mockMvc.perform(post("/api/packages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request)
                        .header("X-CSRF-TOKEN", createToken.token())
                        .session(createToken.session()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(uniqueName))
                .andExpect(jsonPath("$.durationDays").value(2))
                .andReturn();
        JsonNode createdBody = objectMapper.readTree(created.getResponse().getContentAsString());
        long packageId = createdBody.get("id").asLong();
        assertNotNull(createdBody.get("id"));

        mockMvc.perform(get("/api/packages/{id}", packageId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itinerary[0].dayNumber").value(1))
                .andExpect(jsonPath("$.itinerary[1].dayNumber").value(2));

        ObjectNode updatedBody = (ObjectNode) objectMapper.readTree(request);
        updatedBody.put("name", uniqueName + " Updated");
        updatedBody.put("status", "Inactive");
        updatedBody.putArray("itinerary");
        String updatedRequest = objectMapper.writeValueAsString(updatedBody);
        TokenAndSession updateToken = csrfToken(createToken.session());
        mockMvc.perform(put("/api/packages/{id}", packageId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatedRequest)
                        .header("X-CSRF-TOKEN", updateToken.token())
                        .session(updateToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(uniqueName + " Updated"))
                .andExpect(jsonPath("$.status").value("Inactive"))
                .andExpect(jsonPath("$.itinerary").isEmpty());

        TokenAndSession deleteToken = csrfToken(updateToken.session());
        mockMvc.perform(delete("/api/packages/{id}", packageId)
                        .header("X-CSRF-TOKEN", deleteToken.token())
                        .session(deleteToken.session()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/packages/{id}", packageId))
                .andExpect(status().isNotFound());
    }

    private MockHttpSession login() throws Exception {
        TokenAndSession token = csrfToken(null);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"package-admin@example.com\",\"password\":\"AdminPass123\"}")
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
        return new TokenAndSession(body.get("csrfToken").asText(),
                (MockHttpSession) result.getRequest().getSession(false));
    }

    private record TokenAndSession(String token, MockHttpSession session) {
    }
}
