package com.ceylonexplore.backend.service;

import com.ceylonexplore.backend.dto.TouristRequest;
import com.ceylonexplore.backend.dto.TouristResponse;
import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.entity.TouristStatus;
import com.ceylonexplore.backend.exception.DuplicateTouristEmailException;
import com.ceylonexplore.backend.exception.TouristInUseException;
import com.ceylonexplore.backend.exception.TouristNotFoundException;
import com.ceylonexplore.backend.repository.BookingRepository;
import com.ceylonexplore.backend.repository.TouristRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TouristServiceTest {

    @Mock
    private TouristRepository touristRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private TouristService touristService;

    @Test
    void getAllTouristsReturnsResponseRecords() {
        Tourist tourist = tourist("Test Tourist", "test@example.com");
        when(touristRepository.findAll()).thenReturn(List.of(tourist));

        List<TouristResponse> results = touristService.getAllTourists();

        assertEquals(1, results.size());
        assertEquals("Test Tourist", results.getFirst().fullName());
    }

    @Test
    void createTouristNormalizesInputAndDefaultsToActive() {
        TouristRequest request = request(" Test Tourist ", " TEST@example.com ", null);
        when(touristRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(false);
        when(touristRepository.save(any(Tourist.class))).thenAnswer(invocation -> {
            Tourist saved = invocation.getArgument(0);
            saved.setId(7L);
            return saved;
        });

        TouristResponse response = touristService.createTourist(request);

        assertEquals(7L, response.id());
        assertEquals("test@example.com", response.email());
        assertEquals("Test Tourist", response.fullName());
        assertEquals(TouristStatus.ACTIVE, response.status());
        verify(touristRepository).save(any(Tourist.class));
    }

    @Test
    void createTouristRejectsDuplicateEmail() {
        when(touristRepository.existsByEmailIgnoreCase("test@example.com")).thenReturn(true);

        assertThrows(DuplicateTouristEmailException.class,
                () -> touristService.createTourist(request("Test Tourist", "TEST@example.com", null)));
        verify(touristRepository, never()).save(any(Tourist.class));
    }

    @Test
    void updateTouristPreservesCreationMetadataAndCanChangeStatus() {
        Tourist existing = tourist("Test Tourist", "test@example.com");
        existing.setId(7L);
        when(touristRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(touristRepository.existsByEmailIgnoreCaseAndIdNot("test@example.com", 7L)).thenReturn(false);
        when(touristRepository.save(existing)).thenReturn(existing);

        TouristResponse response = touristService.updateTourist(
                7L, request("Updated Tourist", "TEST@example.com", TouristStatus.INACTIVE));

        assertEquals(7L, response.id());
        assertEquals("Updated Tourist", response.fullName());
        assertEquals(TouristStatus.INACTIVE, response.status());
        verify(touristRepository).save(existing);
    }

    @Test
    void deleteTouristRejectsRecordsReferencedByBookings() {
        Tourist tourist = tourist("Test Tourist", "test@example.com");
        when(touristRepository.findById(7L)).thenReturn(Optional.of(tourist));
        when(bookingRepository.existsByTouristId(7L)).thenReturn(true);

        assertThrows(TouristInUseException.class, () -> touristService.deleteTourist(7L));
        verify(touristRepository, never()).delete(any(Tourist.class));
    }

    @Test
    void deleteTouristRejectsMissingTourist() {
        when(touristRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(TouristNotFoundException.class, () -> touristService.deleteTourist(404L));
        verify(bookingRepository, never()).existsByTouristId(anyLong());
        verify(touristRepository, never()).delete(any(Tourist.class));
    }

    private TouristRequest request(String fullName, String email, TouristStatus status) {
        return new TouristRequest(fullName, email, "0771234567", "Sri Lanka", null, null, null, null, status);
    }

    private Tourist tourist(String fullName, String email) {
        Tourist tourist = new Tourist();
        tourist.setFullName(fullName);
        tourist.setEmail(email);
        tourist.setPhone("0771234567");
        tourist.setCountry("Sri Lanka");
        tourist.setStatus(TouristStatus.ACTIVE);
        return tourist;
    }
}
