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
import com.ceylonexplore.backend.exception.InvalidBookingException;
import com.ceylonexplore.backend.exception.TourPackageNotFoundException;
import com.ceylonexplore.backend.exception.TouristNotFoundException;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.TourPackageRepository;
import com.ceylonexplore.backend.repository.TouristRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
        List<Booking> bookings = bookingRepository.findAllWithDetails();
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

    public List<BookingResponse> getBookingsByPackage(Long packageId) {
        return bookingRepository.findByTourPackageId(packageId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BookingResponse> getBookingsByStatus(String statusText) {
        BookingStatus status = parseBookingStatus(statusText);
        return bookingRepository.findByBookingStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BookingResponse> searchBookings(String keyword) {
        String normalized = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            return getAllBookings();
        }
        return bookingRepository.findAllWithDetails().stream()
                .filter(booking -> {
                    String reference = booking.getBookingReference() != null ? booking.getBookingReference().toLowerCase(Locale.ROOT) : "";
                    String touristName = booking.getTourist() != null && booking.getTourist().getFullName() != null
                            ? booking.getTourist().getFullName().toLowerCase(Locale.ROOT) : "";
                    String packageName = booking.getTourPackage() != null && booking.getTourPackage().getName() != null
                            ? booking.getTourPackage().getName().toLowerCase(Locale.ROOT) : "";
                    return reference.contains(normalized) || touristName.contains(normalized) || packageName.contains(normalized);
                })
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        validateRequest(request, true);

        Tourist tourist = touristRepository.findById(request.touristId())
                .orElseThrow(() -> new TouristNotFoundException(request.touristId()));
        TourPackage tourPackage = tourPackageRepository.findById(request.packageId())
                .orElseThrow(() -> new TourPackageNotFoundException(request.packageId()));

        validatePackageBooking(tourPackage, request);

        BigDecimal totalAmount = calculateTotalAmount(tourPackage.getPrice(), request.numberOfPeople());
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidBookingException("Total amount cannot be negative.");
        }

        BigDecimal discount = request.discount() != null ? request.discount() : BigDecimal.ZERO;
        BigDecimal amountPaid = request.amountPaid() != null ? request.amountPaid() : BigDecimal.ZERO;

        Booking booking = new Booking();
        booking.setBookingReference(generateUniqueBookingReference());
        booking.setTourist(tourist);
        booking.setTourPackage(tourPackage);
        booking.setNumberOfPeople(request.numberOfPeople());
        booking.setBookingDate(request.bookingDate() != null ? request.bookingDate() : LocalDateTime.now());
        booking.setTravelDate(request.travelDate());
        booking.setTotalAmount(totalAmount);
        booking.setDiscount(discount);
        booking.setAmountPaid(amountPaid);
        booking.setBookingStatus(request.bookingStatus() != null && !request.bookingStatus().isBlank()
                ? parseBookingStatus(request.bookingStatus())
                : BookingStatus.PENDING);
        booking.setPaymentStatus(request.paymentStatus() != null && !request.paymentStatus().isBlank()
                ? parsePaymentStatus(request.paymentStatus())
                : PaymentStatus.UNPAID);
        booking.setSpecialRequests(normalizeOptionalText(request.specialRequests()));

        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse updateBooking(Long id, BookingRequest request) {
        Booking existingBooking = findBookingEntityById(id);
        validateRequest(request, false);

        Tourist tourist = touristRepository.findById(request.touristId())
                .orElseThrow(() -> new TouristNotFoundException(request.touristId()));
        TourPackage tourPackage = tourPackageRepository.findById(request.packageId())
                .orElseThrow(() -> new TourPackageNotFoundException(request.packageId()));

        validatePackageBooking(tourPackage, request);

        BigDecimal totalAmount = calculateTotalAmount(tourPackage.getPrice(), request.numberOfPeople());
        BigDecimal discount = request.discount() != null ? request.discount() : existingBooking.getDiscount();
        BigDecimal amountPaid = request.amountPaid() != null ? request.amountPaid() : existingBooking.getAmountPaid();

        existingBooking.setTourist(tourist);
        existingBooking.setTourPackage(tourPackage);
        existingBooking.setNumberOfPeople(request.numberOfPeople());
        if (request.bookingDate() != null) {
            existingBooking.setBookingDate(request.bookingDate());
        }
        existingBooking.setTravelDate(request.travelDate());
        existingBooking.setTotalAmount(totalAmount);
        existingBooking.setDiscount(discount != null ? discount : BigDecimal.ZERO);
        existingBooking.setAmountPaid(amountPaid != null ? amountPaid : BigDecimal.ZERO);

        if (request.bookingStatus() != null && !request.bookingStatus().isBlank()) {
            existingBooking.setBookingStatus(parseBookingStatus(request.bookingStatus()));
        }
        if (request.paymentStatus() != null && !request.paymentStatus().isBlank()) {
            existingBooking.setPaymentStatus(parsePaymentStatus(request.paymentStatus()));
        }

        existingBooking.setSpecialRequests(normalizeOptionalText(request.specialRequests()));
        existingBooking.setUpdatedAt(LocalDateTime.now());

        return toResponse(bookingRepository.save(existingBooking));
    }

    @Transactional
    public void deleteBooking(Long id) {
        Booking booking = findBookingEntityById(id);
        bookingRepository.delete(booking);
    }

    private Booking findBookingEntityById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException(id));
    }

    private void validateRequest(BookingRequest request, boolean isNew) {
        if (request == null) {
            throw new InvalidBookingException("Booking request body is required.");
        }

        if (request.touristId() == null) {
            throw new InvalidBookingException("Tourist ID is required.");
        }
        if (request.packageId() == null) {
            throw new InvalidBookingException("Tour package ID is required.");
        }
        if (request.numberOfPeople() == null || request.numberOfPeople() <= 0) {
            throw new InvalidBookingException("Number of people must be greater than zero.");
        }
        if (request.travelDate() == null) {
            throw new InvalidBookingException("Travel date is required.");
        }
        if (isNew && request.travelDate().isBefore(LocalDate.now())) {
            throw new InvalidBookingException("Travel date cannot be in the past.");
        }
        if (request.bookingDate() != null && request.bookingDate().toLocalDate().isAfter(request.travelDate())) {
            throw new InvalidBookingException("Travel date cannot be earlier than the booking date.");
        }
    }

    private void validatePackageBooking(TourPackage tourPackage, BookingRequest request) {
        if (!"Active".equalsIgnoreCase(tourPackage.getStatus())) {
            throw new BookingConflictException("Inactive tour packages cannot be booked.");
        }
        int minimumTravelers = tourPackage.getMinTravelers() == null ? 1 : tourPackage.getMinTravelers();
        if (request.numberOfPeople() < minimumTravelers) {
            throw new BookingConflictException("Number of people is below the package minimum of " + minimumTravelers + ".");
        }
        if (tourPackage.getMaxTravelers() != null && request.numberOfPeople() > tourPackage.getMaxTravelers()) {
            throw new BookingConflictException("Number of people exceeds the package capacity of " + tourPackage.getMaxTravelers() + ".");
        }
        if (tourPackage.getStartDate() != null && request.travelDate().isBefore(tourPackage.getStartDate())) {
            throw new BookingConflictException("Travel date is before this package's availability period.");
        }
        if (tourPackage.getEndDate() != null && request.travelDate().isAfter(tourPackage.getEndDate())) {
            throw new BookingConflictException("Travel date is after this package's availability period.");
        }
    }

    public BookingStatus parseBookingStatus(String statusText) {
        if (statusText == null || statusText.isBlank()) {
            return BookingStatus.PENDING;
        }
        String normalized = statusText.trim().replace(' ', '_').toUpperCase(Locale.ROOT);
        try {
            return BookingStatus.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            throw new InvalidBookingException("Invalid booking status: " + statusText);
        }
    }

    public PaymentStatus parsePaymentStatus(String statusText) {
        if (statusText == null || statusText.isBlank()) {
            return PaymentStatus.UNPAID;
        }
        String normalized = statusText.trim().replace(' ', '_').toUpperCase(Locale.ROOT);
        try {
            return PaymentStatus.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            throw new InvalidBookingException("Invalid payment status: " + statusText);
        }
    }

    private String generateUniqueBookingReference() {
        String reference;
        do {
            long suffix = System.currentTimeMillis() % 9_999_999L + 1_000_000L;
            reference = BOOKING_PREFIX + "-" + suffix;
        } while (bookingRepository.existsByBookingReference(reference));
        return reference;
    }

    private BigDecimal calculateTotalAmount(BigDecimal packagePrice, Integer numberOfPeople) {
        if (packagePrice == null) {
            packagePrice = BigDecimal.ZERO;
        }
        return packagePrice.multiply(BigDecimal.valueOf(numberOfPeople)).setScale(2, RoundingMode.HALF_UP);
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
                booking.getDiscount() != null ? booking.getDiscount() : BigDecimal.ZERO,
                booking.getAmountPaid() != null ? booking.getAmountPaid() : BigDecimal.ZERO,
                booking.getBookingStatus() != null ? booking.getBookingStatus().name() : null,
                booking.getPaymentStatus() != null ? booking.getPaymentStatus().name() : null,
                booking.getSpecialRequests(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
