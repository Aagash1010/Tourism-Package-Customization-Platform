package com.ceylonexplore.backend.controller;

import com.ceylonexplore.backend.dto.HotelRequest;
import com.ceylonexplore.backend.dto.HotelResponse;
import com.ceylonexplore.backend.dto.RoomResponse;
import com.ceylonexplore.backend.entity.HotelStatus;
import com.ceylonexplore.backend.entity.HotelType;
import com.ceylonexplore.backend.entity.RoomType;
import com.ceylonexplore.backend.service.HotelService;
import com.ceylonexplore.backend.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService hotelService;
    private final RoomService roomService;

    public HotelController(HotelService hotelService, RoomService roomService) {
        this.hotelService = hotelService;
        this.roomService = roomService;
    }

    @GetMapping
    public List<HotelResponse> getHotels(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Integer starRating,
            @RequestParam(required = false) HotelType hotelType,
            @RequestParam(required = false) HotelStatus status
    ) {
        return hotelService.getHotels(keyword, city, country, starRating, hotelType, status);
    }

    @GetMapping("/active")
    public List<HotelResponse> getActiveHotels(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Integer starRating,
            @RequestParam(required = false) HotelType hotelType
    ) {
        return hotelService.getActiveHotels(keyword, city, country, starRating, hotelType);
    }

    @GetMapping("/{id}")
    public HotelResponse getHotel(@PathVariable Long id) {
        return hotelService.getHotel(id);
    }

    @GetMapping("/{id}/rooms")
    public List<RoomResponse> getPublicRooms(
            @PathVariable Long id,
            @RequestParam(required = false) RoomType roomType,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {
        return roomService.getRoomsForHotel(id, roomType, minPrice, maxPrice);
    }

    @PostMapping
    public ResponseEntity<HotelResponse> createHotel(@Valid @RequestBody HotelRequest request) {
        HotelResponse created = hotelService.createHotel(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public HotelResponse updateHotel(@PathVariable Long id, @Valid @RequestBody HotelRequest request) {
        return hotelService.updateHotel(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHotel(@PathVariable Long id) {
        hotelService.deleteHotel(id);
        return ResponseEntity.noContent().build();
    }
}
