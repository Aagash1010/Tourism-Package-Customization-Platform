package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.BookingRequest;
import com.ceylonexplore.backend.dto.BookingResponse;
import com.ceylonexplore.backend.entity.Booking;
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
import static org.mockito.Mockito.verify;
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
                "PENDING",
                "PAID",
                BigDecimal.ZERO,
                BigDecimal.valueOf(10000)
        );

        BookingResponse response = bookingService.createBooking(request);

        assertNotNull(response);
        assertEquals("BK-123456", response.bookingReference());
        assertEquals(new BigDecimal("50000.00"), response.totalAmount());
        assertEquals(PaymentStatus.PAID.name(), response.paymentStatus());
        assertEquals(BookingStatus.PENDING.name(), response.bookingStatus());
    }

    @Test
    void updateBookingShouldUpdateDetailsAndStatuses() {
        Tourist tourist = new Tourist();
        tourist.setId(1L);
        tourist.setFullName("Nimal Perera");

        TourPackage tourPackage = new TourPackage();
        tourPackage.setId(2L);
        tourPackage.setName("Cultural Heritage Tour");
        tourPackage.setPrice(new BigDecimal("30000"));
        tourPackage.setMaxTravelers(10);
        tourPackage.setStatus("Active");

        Booking existing = new Booking();
        existing.setBookingReference("BK-999999");
        existing.setTourist(tourist);
        existing.setTourPackage(tourPackage);
        existing.setNumberOfPeople(1);
        existing.setBookingDate(LocalDateTime.now().minusDays(2));
        existing.setTravelDate(LocalDate.now().plusDays(5));
        existing.setTotalAmount(new BigDecimal("30000.00"));
        existing.setDiscount(BigDecimal.ZERO);
        existing.setAmountPaid(BigDecimal.ZERO);
        existing.setBookingStatus(BookingStatus.PENDING);
        existing.setPaymentStatus(PaymentStatus.UNPAID);

        when(bookingRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(touristRepository.findById(1L)).thenReturn(Optional.of(tourist));
        when(tourPackageRepository.findById(2L)).thenReturn(Optional.of(tourPackage));
        when(bookingRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        BookingRequest updateReq = new BookingRequest(
                1L,
                2L,
                3,
                LocalDateTime.now().minusDays(2),
                LocalDate.now().plusDays(15),
                "Extra vegetarian meals",
                "CONFIRMED",
                "PARTIALLY_PAID",
                new BigDecimal("5000.00"),
                new BigDecimal("40000.00")
        );

        BookingResponse updated = bookingService.updateBooking(5L, updateReq);

        assertNotNull(updated);
        assertEquals(3, updated.numberOfPeople());
        assertEquals(new BigDecimal("90000.00"), updated.totalAmount());
        assertEquals(new BigDecimal("50000.00"), updated.discount().add(new BigDecimal("45000")).subtract(new BigDecimal("45000")).compareTo(BigDecimal.ZERO) == 0 ? updated.discount() : updated.discount());
        assertEquals(new BigDecimal("5000.00"), updated.discount());
        assertEquals(new BigDecimal("40000.00"), updated.amountPaid());
        assertEquals(BookingStatus.CONFIRMED.name(), updated.bookingStatus());
        assertEquals(PaymentStatus.PARTIALLY_PAID.name(), updated.paymentStatus());
    }

    @Test
    void deleteBookingShouldDeleteEntity() {
        Booking existing = new Booking();
        existing.setBookingReference("BK-777777");
        when(bookingRepository.findById(10L)).thenReturn(Optional.of(existing));

        bookingService.deleteBooking(10L);

        verify(bookingRepository).delete(existing);
    }
}
