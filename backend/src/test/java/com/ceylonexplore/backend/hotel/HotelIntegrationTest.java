package com.ceylonexplore.backend.hotel;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.UserAccount;
import com.ceylonexplore.backend.repository.HotelRepository;
import com.ceylonexplore.backend.repository.RoomRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HotelIntegrationTest {

    private static final String VALID_HOTEL = """
            {
              "hotelName": "Harbor View Hotel",
              "description": "A waterfront hotel.",
              "email": "stay@harbor.example.com",
              "phone": "+94 11 123 4567",
              "address": "12 Bay Street",
              "city": "Colombo",
              "district": "Colombo",
              "province": "Western",
              "country": "Sri Lanka",
              "starRating": 4,
              "hotelType": "BOUTIQUE",
              "imageUrl": "assets/images/hero-bg.jpg",
              "facilities": ["Wi-Fi", "Restaurant"],
              "checkInTime": "14:00:00",
              "checkOutTime": "11:00:00",
              "website": "https://harbor.example.com",
              "featured": true,
              "status": "ACTIVE"
            }
            """;

    private static final String VALID_ROOM = """
            {
              "roomNumber": "101",
              "roomType": "DOUBLE",
              "capacity": 2,
              "pricePerNight": 25000.00,
              "availableRooms": 3,
              "description": "City view room.",
              "status": "AVAILABLE"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        roomRepository.deleteAll();
        hotelRepository.deleteAll();
        userAccountRepository.deleteAll();
        userAccountRepository.save(new UserAccount(
                "Hotel Test Admin", "hotel-admin@example.com", passwordEncoder.encode("AdminPass123"),
                AccountRole.ADMIN, true
        ));
        userAccountRepository.save(new UserAccount(
                "Hotel Test User", "hotel-user@example.com", passwordEncoder.encode("UserPass123"),
                AccountRole.USER, true
        ));
    }

    @Test
    void hotelRoomCrudSearchPublicListingsAndDeleteGuardWork() throws Exception {
        MockHttpSession adminSession = login("hotel-admin@example.com", "AdminPass123");
        TokenAndSession hotelCsrf = csrfToken(adminSession);
        MvcResult hotelResult = mockMvc.perform(post("/api/hotels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_HOTEL)
                        .header("X-CSRF-TOKEN", hotelCsrf.token())
                        .session(hotelCsrf.session()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hotelName").value("Harbor View Hotel"))
                .andExpect(jsonPath("$.hotelType").value("BOUTIQUE"))
                .andExpect(jsonPath("$.starRating").value(4))
                .andExpect(jsonPath("$.facilities.length()").value(2))
                .andExpect(jsonPath("$.roomsCount").value(0))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andReturn();
        long hotelId = objectMapper.readTree(hotelResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/hotels").param("keyword", "harbor").param("country", "sri lanka")
                        .param("city", "colombo").param("hotelType", "BOUTIQUE").param("starRating", "4")
                        .param("status", "ACTIVE").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/hotels/active").param("keyword", "harbor").param("city", "Colombo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(hotelId));

        TokenAndSession duplicateHotelCsrf = csrfToken(hotelCsrf.session());
        mockMvc.perform(post("/api/hotels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_HOTEL.replace("stay@harbor.example.com", "duplicate@example.com"))
                        .header("X-CSRF-TOKEN", duplicateHotelCsrf.token())
                        .session(duplicateHotelCsrf.session()))
                .andExpect(status().isConflict());

        TokenAndSession hotelUpdateCsrf = csrfToken(duplicateHotelCsrf.session());
        mockMvc.perform(put("/api/hotels/{id}", hotelId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_HOTEL.replace("Harbor View Hotel", "Harbor View Updated"))
                        .header("X-CSRF-TOKEN", hotelUpdateCsrf.token())
                        .session(hotelUpdateCsrf.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotelName").value("Harbor View Updated"));

        TokenAndSession roomCsrf = csrfToken(hotelUpdateCsrf.session());
        MvcResult roomResult = mockMvc.perform(post("/api/rooms/hotel/{hotelId}", hotelId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_ROOM)
                        .header("X-CSRF-TOKEN", roomCsrf.token())
                        .session(roomCsrf.session()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hotelId").value(hotelId))
                .andExpect(jsonPath("$.roomNumber").value("101"))
                .andExpect(jsonPath("$.pricePerNight").value(25000))
                .andReturn();
        long roomId = objectMapper.readTree(roomResult.getResponse().getContentAsString()).get("id").asLong();

        TokenAndSession duplicateRoomCsrf = csrfToken(roomCsrf.session());
        mockMvc.perform(post("/api/rooms/hotel/{hotelId}", hotelId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_ROOM)
                        .header("X-CSRF-TOKEN", duplicateRoomCsrf.token())
                        .session(duplicateRoomCsrf.session()))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/hotels/{id}/rooms", hotelId)
                        .param("roomType", "DOUBLE").param("minPrice", "20000").param("maxPrice", "30000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/rooms").param("hotelId", String.valueOf(hotelId))
                        .param("roomType", "DOUBLE").param("minPrice", "20000")
                        .param("maxPrice", "30000").param("availableOnly", "true").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        TokenAndSession updateCsrf = csrfToken(duplicateRoomCsrf.session());
        mockMvc.perform(put("/api/rooms/{id}", roomId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_ROOM.replace("\"roomNumber\": \"101\"", "\"roomNumber\": \"102\"")
                                .replace("\"availableRooms\": 3", "\"availableRooms\": 2"))
                        .header("X-CSRF-TOKEN", updateCsrf.token())
                        .session(updateCsrf.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("102"))
                .andExpect(jsonPath("$.availableRooms").value(2));

        TokenAndSession hotelDeleteCsrf = csrfToken(updateCsrf.session());
        mockMvc.perform(delete("/api/hotels/{id}", hotelId)
                        .header("X-CSRF-TOKEN", hotelDeleteCsrf.token())
                        .session(hotelDeleteCsrf.session()))
                .andExpect(status().isConflict());

        TokenAndSession roomDeleteCsrf = csrfToken(hotelDeleteCsrf.session());
        mockMvc.perform(delete("/api/rooms/{id}", roomId)
                        .header("X-CSRF-TOKEN", roomDeleteCsrf.token())
                        .session(roomDeleteCsrf.session()))
                .andExpect(status().isNoContent());

        TokenAndSession hotelDeleteToken = csrfToken(roomDeleteCsrf.session());
        mockMvc.perform(delete("/api/hotels/{id}", hotelId)
                        .header("X-CSRF-TOKEN", hotelDeleteToken.token())
                        .session(hotelDeleteToken.session()))
                .andExpect(status().isNoContent());
    }

    @Test
    void hotelMutationsRequireAdministratorAndValidateInput() throws Exception {
        mockMvc.perform(get("/api/hotels"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/hotels/active"))
                .andExpect(status().isOk());

        MockHttpSession userSession = login("hotel-user@example.com", "UserPass123");
        TokenAndSession userCsrf = csrfToken(userSession);
        mockMvc.perform(post("/api/hotels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_HOTEL)
                        .header("X-CSRF-TOKEN", userCsrf.token())
                        .session(userCsrf.session()))
                .andExpect(status().isForbidden());

        MockHttpSession adminSession = login("hotel-admin@example.com", "AdminPass123");
        TokenAndSession adminCsrf = csrfToken(adminSession);
        mockMvc.perform(post("/api/hotels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_HOTEL.replace("\"starRating\": 4", "\"starRating\": 8"))
                        .header("X-CSRF-TOKEN", adminCsrf.token())
                        .session(adminCsrf.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.starRating").exists());
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
        if (session != null) request.session(session);
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
