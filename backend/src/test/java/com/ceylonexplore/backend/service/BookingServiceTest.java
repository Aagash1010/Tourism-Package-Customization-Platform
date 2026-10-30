package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.BookingRequest;
import com.ceylonexplore.backend.entity.BookingStatus;
import com.ceylonexplore.backend.entity.PaymentStatus;
import com.ceylonexplore.backend.entity.TourPackage;
import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.TourPackageRepository;
import com.ceylonexplore.backend.repository.TouristRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TouristRepository touristRepository;

    @Mock
    private TourPackageRepository tourPackageRepository;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void createBookingShouldCalculateTotalAndGenerateReference() {
        Tourist tourist = new Tourist();
        tourist.setId(1L);
        tourist.setFullName("Nimal Perera");
        tourist.setEmail("nimal@example.com");

        TourPackage tourPackage = new TourPackage();
        tourPackage.setId(2L);
        tourPackage.setName("Cultural Heritage Tour");
        tourPackage.setPrice(new BigDecimal("25000"));
        tourPackage.setMaxTravelers(10);
        tourPackage.setStatus("Active");

        when(touristRepository.findById(1L)).thenReturn(Optional.of(tourist));
        when(tourPackageRepository.findById(2L)).thenReturn(Optional.of(tourPackage));
        when(bookingRepository.existsByBookingReference(any())).thenReturn(false);
        when(bookingRepository.save(any())).thenAnswer(invocation -> {
            var booking = invocation.getArgument(0);
            var entity = (com.ceylonexplore.backend.entity.Booking) booking;
            entity.setBookingReference("BK-123456");
            return entity;
        });

        BookingRequest request = new BookingRequest(
                1L,
                2L,
                2,
                LocalDateTime.now().minusDays(1),
                LocalDate.now().plusDays(10),
                "Window seat",
                null,
                "PAID",
                BigDecimal.ZERO,
                BigDecimal.valueOf(10000)
        );

        var response = bookingService.createBooking(request);

        assertNotNull(response);
        assertEquals("BK-123456", response.bookingReference());
        assertEquals(new BigDecimal("50000.00"), response.totalAmount());
        assertEquals(PaymentStatus.UNPAID.name(), response.paymentStatus());
        assertEquals(BookingStatus.PENDING.name(), response.bookingStatus());
    }
}
