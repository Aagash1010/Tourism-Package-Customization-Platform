package com.ceylonexplore.backend.controller;

import com.ceylonexplore.backend.dto.TourGuideRequest;
import com.ceylonexplore.backend.dto.TourGuideResponse;
import com.ceylonexplore.backend.entity.TourGuideAvailabilityStatus;
import com.ceylonexplore.backend.service.TourGuideService;
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

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tour-guides")
public class TourGuideController {

    private final TourGuideService tourGuideService;

    public TourGuideController(TourGuideService tourGuideService) {
        this.tourGuideService = tourGuideService;
    }

    @GetMapping
    public List<TourGuideResponse> getAllTourGuides() {
        return tourGuideService.getAllTourGuides();
    }

    @GetMapping("/search")
    public List<TourGuideResponse> searchTourGuides(@RequestParam(required = false) String name) {
        return tourGuideService.searchTourGuidesByName(name);
    }

    @GetMapping("/availability/{status}")
    public List<TourGuideResponse> getTourGuidesByAvailability(
            @PathVariable TourGuideAvailabilityStatus status
    ) {
        return tourGuideService.getTourGuidesByAvailability(status);
    }

    @GetMapping("/specialization/{specialization}")
    public List<TourGuideResponse> getTourGuidesBySpecialization(@PathVariable String specialization) {
        return tourGuideService.getTourGuidesBySpecialization(specialization);
    }

    @GetMapping("/available")
    public List<TourGuideResponse> getAvailableTourGuides() {
        return tourGuideService.getAvailableTourGuides();
    }

    @GetMapping("/{id}")
    public TourGuideResponse getTourGuideById(@PathVariable Long id) {
        return tourGuideService.getTourGuideById(id);
    }

    @PostMapping
    public ResponseEntity<TourGuideResponse> createTourGuide(@Valid @RequestBody TourGuideRequest request) {
        TourGuideResponse created = tourGuideService.createTourGuide(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public TourGuideResponse updateTourGuide(
            @PathVariable Long id,
            @Valid @RequestBody TourGuideRequest request
    ) {
        return tourGuideService.updateTourGuide(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTourGuide(@PathVariable Long id) {
        tourGuideService.deleteTourGuide(id);
        return ResponseEntity.noContent().build();
    }
}
