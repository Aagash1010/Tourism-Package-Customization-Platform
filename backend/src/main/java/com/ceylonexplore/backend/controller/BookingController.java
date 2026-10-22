package com.ceylonexplore.backend.controller;

import com.ceylonexplore.backend.dto.BookingRequest;
import com.ceylonexplore.backend.dto.BookingResponse;
import com.ceylonexplore.backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public List<BookingResponse> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @GetMapping("/{id}")
    public BookingResponse getBookingById(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {
        BookingResponse created = bookingService.createBooking(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public BookingResponse updateBooking(@PathVariable Long id, @Valid @RequestBody BookingRequest request) {
        return bookingService.updateBooking(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reference/{reference}")
    public BookingResponse getBookingByReference(@PathVariable String reference) {
        return bookingService.getBookingByReference(reference);
    }

    @GetMapping("/tourist/{touristId}")
    public List<BookingResponse> getBookingsByTourist(@PathVariable Long touristId) {
        return bookingService.getBookingsByTourist(touristId);
    }

    @GetMapping("/status/{status}")
    public List<BookingResponse> getBookingsByStatus(@PathVariable String status) {
        return bookingService.getBookingsByStatus(status);
    }
}
