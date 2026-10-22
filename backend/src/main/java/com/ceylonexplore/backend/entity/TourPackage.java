package com.ceylonexplore.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "tour_packages",
        uniqueConstraints = @UniqueConstraint(name = "uk_tour_packages_name", columnNames = "name")
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TourPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @NotBlank(message = "Package name is required.")
    @Size(max = 120, message = "Package name must not exceed 120 characters.")
    @Column(nullable = false, length = 120)
    private String name;

    @Size(max = 1000, message = "Description must not exceed 1000 characters.")
    @Column(length = 1000)
    private String description;

    @NotBlank(message = "Destination is required.")
    @Size(max = 100, message = "Destination must not exceed 100 characters.")
    @Column(nullable = false, length = 100)
    private String destination;

    @NotBlank(message = "Duration is required.")
    @Size(max = 60, message = "Duration must not exceed 60 characters.")
    @Column(nullable = false, length = 60)
    private String duration;

    @NotNull(message = "Package price is required.")
    @DecimalMin(value = "0.00", message = "Package price must be zero or greater.")
    @Digits(integer = 10, fraction = 2, message = "Package price must have at most 10 integer digits and 2 decimal places.")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotNull(message = "Maximum travelers is required.")
    @Min(value = 1, message = "Maximum travelers must be at least 1.")
    @Column(name = "max_travelers", nullable = false)
    private Integer maxTravelers;

    @NotBlank(message = "Status is required.")
    @Pattern(regexp = "Active|Inactive", message = "Package status must be Active or Inactive.")
    @Column(nullable = false, length = 8)
    private String status = "Active";

    @Size(max = 500, message = "Image URL must not exceed 500 characters.")
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public TourPackage() {
    }

    public void setId(Long id) {
        this.id = id;
    }

    @PrePersist
    private void setCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getMaxTravelers() {
        return maxTravelers;
    }

    public void setMaxTravelers(Integer maxTravelers) {
        this.maxTravelers = maxTravelers;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
