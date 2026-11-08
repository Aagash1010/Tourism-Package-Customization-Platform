package com.ceylonexplore.backend.controller;

import com.ceylonexplore.backend.entity.TourPackage;
import com.ceylonexplore.backend.service.TourPackageService;
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
@RequestMapping("/api/tour-packages")
public class TourPackageController {

    private final TourPackageService tourPackageService;

    public TourPackageController(TourPackageService tourPackageService) {
        this.tourPackageService = tourPackageService;
    }

    @GetMapping
    public List<TourPackage> getAllTourPackages() {
        return tourPackageService.getAllTourPackages();
    }

    @GetMapping("/{id}")
    public TourPackage getTourPackageById(@PathVariable Long id) {
        return tourPackageService.getTourPackageById(id);
    }

    @PostMapping
    public ResponseEntity<TourPackage> createTourPackage(@Valid @RequestBody TourPackage tourPackage) {
        TourPackage created = tourPackageService.createTourPackage(tourPackage);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public TourPackage updateTourPackage(@PathVariable Long id, @Valid @RequestBody TourPackage tourPackage) {
        return tourPackageService.updateTourPackage(id, tourPackage);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTourPackage(@PathVariable Long id) {
        tourPackageService.deleteTourPackage(id);
        return ResponseEntity.noContent().build();
    }
}
