package com.ceylonexplore.backend.repository;

import com.ceylonexplore.backend.entity.TourPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TourPackageRepository extends JpaRepository<TourPackage, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsByDestinationIgnoreCase(String destination);

    @Query("""
            select tp from TourPackage tp
            left join tp.destinationEntity destination
            where (:keyword is null
                or lower(tp.name) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(tp.description, '')) like lower(concat('%', :keyword, '%'))
                or lower(tp.destination) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(destination.name, '')) like lower(concat('%', :keyword, '%')))
              and (:destinationId is null or destination.id = :destinationId)
              and (:category is null or lower(coalesce(tp.category, '')) = lower(:category))
              and (:status is null or lower(tp.status) = lower(:status))
              and (:minPrice is null or tp.price >= :minPrice)
              and (:maxPrice is null or tp.price <= :maxPrice)
              and (:minDuration is null or coalesce(tp.durationDays, 0) >= :minDuration)
              and (:maxDuration is null or coalesce(tp.durationDays, 0) <= :maxDuration)
            """)
    java.util.List<TourPackage> search(
            @Param("keyword") String keyword,
            @Param("destinationId") Long destinationId,
            @Param("category") String category,
            @Param("status") String status,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            @Param("minDuration") Integer minDuration,
            @Param("maxDuration") Integer maxDuration
    );

    java.util.List<TourPackage> findByStatusIgnoreCase(String status);
}
