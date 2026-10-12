package com.ceylonexplore.backend.controller;

import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.service.TouristService;
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
@RequestMapping("/api/tourists")
public class TouristController {

    private final TouristService touristService;

    public TouristController(TouristService touristService) {
        this.touristService = touristService;
    }

    @GetMapping
    public List<Tourist> getAllTourists() {
        return touristService.getAllTourists();
    }

    @GetMapping("/{id}")
    public Tourist getTouristById(@PathVariable Long id) {
        return touristService.getTouristById(id);
    }

    @PostMapping
    public ResponseEntity<Tourist> createTourist(@Valid @RequestBody Tourist tourist) {
        Tourist createdTourist = touristService.createTourist(tourist);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdTourist.getId())
                .toUri();
        return ResponseEntity.created(location).body(createdTourist);
    }

    @PutMapping("/{id}")
    public Tourist updateTourist(@PathVariable Long id, @Valid @RequestBody Tourist tourist) {
        return touristService.updateTourist(id, tourist);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTourist(@PathVariable Long id) {
        touristService.deleteTourist(id);
        return ResponseEntity.noContent().build();
    }
}
