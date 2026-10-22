package com.ceylonexplore.backend.repository;

import com.ceylonexplore.backend.entity.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DestinationRepository extends JpaRepository<Destination, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    List<Destination> findByCategoryIgnoreCase(String category);

    List<Destination> findByStatusIgnoreCase(String status);

    @Query("""
            select destination from Destination destination
            where lower(destination.name) like lower(concat('%', :keyword, '%'))
               or lower(destination.district) like lower(concat('%', :keyword, '%'))
               or lower(destination.province) like lower(concat('%', :keyword, '%'))
               or lower(destination.address) like lower(concat('%', :keyword, '%'))
               or lower(destination.category) like lower(concat('%', :keyword, '%'))
               or lower(destination.shortDescription) like lower(concat('%', :keyword, '%'))
               or lower(coalesce(destination.fullDescription, '')) like lower(concat('%', :keyword, '%'))
            """)
    List<Destination> search(@Param("keyword") String keyword);
}
