package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.BookingRequest;
import com.ceylonexplore.backend.dto.BookingResponse;
import com.ceylonexplore.backend.entity.Booking;
import com.ceylonexplore.backend.entity.BookingStatus;
import com.ceylonexplore.backend.entity.PaymentStatus;
import com.ceylonexplore.backend.entity.TourPackage;
import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.exception.BookingConflictException;
import com.ceylonexplore.backend.exception.BookingNotFoundException;
import com.ceylonexplore.backend.exception.TourPackageNotFoundException;
import com.ceylonexplore.backend.exception.TouristNotFoundException;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.TourPackageRepository;
import com.ceylonexplore.backend.repository.TouristRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class BookingService {

    private static final String BOOKING_PREFIX = "BK";

    private final BookingRepository bookingRepository;
    private final TouristRepository touristRepository;
    private final TourPackageRepository tourPackageRepository;

    public BookingService(
            BookingRepository bookingRepository,
            TouristRepository touristRepository,
            TourPackageRepository tourPackageRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.touristRepository = touristRepository;
        this.tourPackageRepository = tourPackageRepository;
    }

    public List<BookingResponse> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        List<BookingResponse> responses = new ArrayList<>();
        for (Booking booking : bookings) {
            responses.add(toResponse(booking));
        }
        return responses;
    }

    public BookingResponse getBookingById(Long id) {
        return toResponse(findBookingEntityById(id));
    }

    public BookingResponse getBookingByReference(String bookingReference) {
        Booking booking = bookingRepository.findByBookingReference(bookingReference)
                .orElseThrow(() -> new BookingNotFoundException(bookingReference));
        return toResponse(booking);
    }

    public List<BookingResponse> getBookingsByTourist(Long touristId) {
        return bookingRepository.findByTouristId(touristId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BookingResponse> getBookingsByStatus(String statusText) {
        BookingStatus status = BookingStatus.valueOf(statusText.trim().toUpperCase(Locale.ROOT));
        return bookingRepository.findByBookingStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        validateRequest(request);

        Tourist tourist = touristRepository.findById(request.touristId())
                .orElseThrow(() -> new TouristNotFoundException(request.touristId()));
        TourPackage tourPackage = tourPackageRepository.findById(request.packageId())
                .orElseThrow(() -> new TourPackageNotFoundException(request.packageId()));

        if (request.numberOfPeople() > tourPackage.getMaxTravelers()) {
            throw new BookingConflictException("Number of people exceeds the package capacity of " + tourPackage.getMaxTravelers() + ".");
        }

        BigDecimal discount = normalizeAmount(request.discount());
        BigDecimal amountPaid = normalizeAmount(request.amountPaid());
        BigDecimal totalAmount = calculateTotalAmount(tourPackage.getPrice(), request.numberOfPeople(), discount);
        if (amountPaid.compareTo(totalAmount) > 0) {
            throw new BookingConflictException("Amount paid cannot exceed the total booking amount.");
        }

        Booking booking = new Booking();
        booking.setBookingReference(generateBookingReference());
        booking.setTourist(tourist);
        booking.setTourPackage(tourPackage);
        booking.setNumberOfPeople(request.numberOfPeople());
        booking.setBookingDate(request.bookingDate());
        booking.setTravelDate(request.travelDate());
        booking.setTotalAmount(totalAmount);
        booking.setDiscount(discount);
        booking.setAmountPaid(amountPaid);
        booking.setBookingStatus(BookingStatus.PENDING);
        booking.setPaymentStatus(resolvePaymentStatus(amountPaid, totalAmount));
        booking.setSpecialRequests(normalizeOptionalText(request.specialRequests()));

        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse updateBooking(Long id, BookingRequest request) {
        Booking existingBooking = findBookingEntityById(id);
        validateRequest(request);

        Tourist tourist = touristRepository.findById(request.touristId())
                .orElseThrow(() -> new TouristNotFoundException(request.touristId()));
        TourPackage tourPackage = tourPackageRepository.findById(request.packageId())
                .orElseThrow(() -> new TourPackageNotFoundException(request.packageId()));

        if (request.numberOfPeople() > tourPackage.getMaxTravelers()) {
            throw new BookingConflictException("Number of people exceeds the package capacity of " + tourPackage.getMaxTravelers() + ".");
        }

        BigDecimal discount = normalizeAmount(request.discount());
        BigDecimal amountPaid = normalizeAmount(request.amountPaid());
        BigDecimal totalAmount = calculateTotalAmount(tourPackage.getPrice(), request.numberOfPeople(), discount);
        if (amountPaid.compareTo(totalAmount) > 0) {
            throw new BookingConflictException("Amount paid cannot exceed the total booking amount.");
        }

        BookingStatus nextBookingStatus = parseBookingStatus(request.bookingStatus(), existingBooking.getBookingStatus());

        existingBooking.setTourist(tourist);
        existingBooking.setTourPackage(tourPackage);
        existingBooking.setNumberOfPeople(request.numberOfPeople());
        existingBooking.setBookingDate(request.bookingDate());
        existingBooking.setTravelDate(request.travelDate());
        existingBooking.setTotalAmount(totalAmount);
        existingBooking.setDiscount(discount);
        existingBooking.setAmountPaid(amountPaid);
        existingBooking.setBookingStatus(nextBookingStatus);
        existingBooking.setPaymentStatus(resolvePaymentStatus(amountPaid, totalAmount));
        existingBooking.setSpecialRequests(normalizeOptionalText(request.specialRequests()));

        return toResponse(bookingRepository.save(existingBooking));
    }

    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = findBookingEntityById(id);
        if (booking.getBookingStatus() == BookingStatus.COMPLETED || booking.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BookingConflictException("Completed or fully paid bookings cannot be deleted.");
        }
        bookingRepository.delete(booking);
    }

    private Booking findBookingEntityById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException(id));
    }

    private void validateRequest(BookingRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Booking request body is required.");
        }
        if (request.bookingDate() == null || request.travelDate() == null) {
            throw new IllegalArgumentException("Booking date and travel date are required.");
        }
        if (request.travelDate().isBefore(request.bookingDate())) {
            throw new BookingConflictException("Travel date cannot be earlier than the booking date.");
        }
        if (request.numberOfPeople() == null || request.numberOfPeople() <= 0) {
            throw new IllegalArgumentException("Number of people must be greater than zero.");
        }
    }

    private BookingStatus parseBookingStatus(String requestedStatus, BookingStatus currentStatus) {
        if (requestedStatus == null || requestedStatus.isBlank()) {
            return currentStatus;
        }

        BookingStatus nextStatus = BookingStatus.valueOf(requestedStatus.trim().toUpperCase(Locale.ROOT));
        if (currentStatus == BookingStatus.COMPLETED && nextStatus != BookingStatus.COMPLETED) {
            throw new BookingConflictException("A completed booking cannot be reopened.");
        }
        if (currentStatus == BookingStatus.CANCELLED && nextStatus != BookingStatus.CANCELLED) {
            throw new BookingConflictException("A cancelled booking cannot be reactivated through a normal update.");
        }
        return nextStatus;
    }

    private PaymentStatus resolvePaymentStatus(BigDecimal amountPaid, BigDecimal totalAmount) {
        if (amountPaid == null || amountPaid.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentStatus.UNPAID;
        }
        if (amountPaid.compareTo(totalAmount) >= 0) {
            return PaymentStatus.PAID;
        }
        return PaymentStatus.PARTIALLY_PAID;
    }

    private BigDecimal calculateTotalAmount(BigDecimal packagePrice, Integer numberOfPeople, BigDecimal discount) {
        if (packagePrice == null) {
            packagePrice = BigDecimal.ZERO;
        }
        BigDecimal subtotal = packagePrice.multiply(BigDecimal.valueOf(numberOfPeople));
        BigDecimal total = subtotal.subtract(normalizeAmount(discount));
        return total.max(BigDecimal.ZERO).setScale(2);
    }

    private BigDecimal normalizeAmount(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.max(BigDecimal.ZERO).setScale(2);
    }

    private String generateBookingReference() {
        String reference;
        do {
            long suffix = System.currentTimeMillis() % 9_999_999L + 1_000_000L;
            reference = BOOKING_PREFIX + "-" + suffix;
        } while (bookingRepository.existsByBookingReference(reference));
        return reference;
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getBookingReference(),
                booking.getTourist() != null ? booking.getTourist().getId() : null,
                booking.getTourist() != null ? booking.getTourist().getFullName() : null,
                booking.getTourPackage() != null ? booking.getTourPackage().getId() : null,
                booking.getTourPackage() != null ? booking.getTourPackage().getName() : null,
                booking.getTourPackage() != null ? booking.getTourPackage().getPrice() : null,
                booking.getNumberOfPeople(),
                booking.getBookingDate(),
                booking.getTravelDate(),
                booking.getTotalAmount(),
                booking.getDiscount(),
                booking.getAmountPaid(),
                booking.getBookingStatus() != null ? booking.getBookingStatus().name() : null,
                booking.getPaymentStatus() != null ? booking.getPaymentStatus().name() : null,
                booking.getSpecialRequests(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
