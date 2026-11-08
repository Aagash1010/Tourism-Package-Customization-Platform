package com.ceylonexplore.backend.tourist;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.TouristRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TouristIntegrationTest {

    private static final String VALID_TOURIST = """
            {
              "fullName": "Test Tourist",
              "email": "tourist@example.com",
              "phone": "+94 77 123 4567",
              "country": "Sri Lanka",
              "address": "10 Lake Road",
              "dateOfBirth": "1998-04-15",
              "gender": "Female",
              "profileImage": "https://example.com/tourist.jpg"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TouristRepository touristRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        touristRepository.deleteAll();
        userAccountRepository.deleteAll();
        userAccountRepository.save(new UserAccount(
                "Tourist Test Admin", "tourist-admin@example.com",
                passwordEncoder.encode("AdminPass123"), AccountRole.ADMIN, true
        ));
        userAccountRepository.save(new UserAccount(
                "Tourist Test User", "tourist-user@example.com",
                passwordEncoder.encode("UserPass123"), AccountRole.USER, true
        ));
    }

    @Test
    void touristCrudSearchAndValidationRequireAdminAccess() throws Exception {
        mockMvc.perform(get("/api/tourists"))
                .andExpect(status().isUnauthorized());

        MockHttpSession userSession = login("tourist-user@example.com", "UserPass123");
        mockMvc.perform(get("/api/tourists").session(userSession))
                .andExpect(status().isForbidden());

        MockHttpSession adminSession = login("tourist-admin@example.com", "AdminPass123");
        TokenAndSession createToken = csrfToken(adminSession);
        MvcResult createdResult = mockMvc.perform(post("/api/tourists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOURIST)
                        .header("X-CSRF-TOKEN", createToken.token())
                        .session(createToken.session()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty())
                .andReturn();

        long id = objectMapper.readTree(createdResult.getResponse().getContentAsString())
                .get("id").asLong();
        assertEquals(1, touristRepository.count());

        mockMvc.perform(get("/api/tourists/{id}", id).session(createToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("10 Lake Road"));
        mockMvc.perform(get("/api/tourists/search").param("keyword", "example.com").session(createToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/tourists/country/{country}", "Sri Lanka").session(createToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/tourists/status/{status}", "ACTIVE").session(createToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        TokenAndSession duplicateToken = csrfToken(createToken.session());
        mockMvc.perform(post("/api/tourists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOURIST)
                        .header("X-CSRF-TOKEN", duplicateToken.token())
                        .session(duplicateToken.session()))
                .andExpect(status().isConflict());

        TokenAndSession invalidToken = csrfToken(duplicateToken.session());
        mockMvc.perform(post("/api/tourists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":" ","email":"invalid","phone":"x","country":""}
                                """)
                        .header("X-CSRF-TOKEN", invalidToken.token())
                        .session(invalidToken.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.fullName").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.country").exists());

        TokenAndSession updateToken = csrfToken(invalidToken.session());
        mockMvc.perform(put("/api/tourists/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOURIST.replace("Test Tourist", "Updated Tourist"))
                        .header("X-CSRF-TOKEN", updateToken.token())
                        .session(updateToken.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated Tourist"));

        TokenAndSession deleteToken = csrfToken(updateToken.session());
        mockMvc.perform(delete("/api/tourists/{id}", id)
                        .header("X-CSRF-TOKEN", deleteToken.token())
                        .session(deleteToken.session()))
                .andExpect(status().isNoContent());
        assertFalse(touristRepository.existsById(id));
    }

    @Test
    void touristMutationsAreForbiddenForNormalUsers() throws Exception {
        MockHttpSession userSession = login("tourist-user@example.com", "UserPass123");
        TokenAndSession token = csrfToken(userSession);

        mockMvc.perform(post("/api/tourists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TOURIST)
                        .header("X-CSRF-TOKEN", token.token())
                        .session(token.session()))
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
        return new TokenAndSession(
                body.get("csrfToken").asText(),
                (MockHttpSession) result.getRequest().getSession(false)
        );
    }

    private record TokenAndSession(String token, MockHttpSession session) {
    }
}
