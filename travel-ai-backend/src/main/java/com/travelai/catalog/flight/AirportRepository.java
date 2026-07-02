package com.travelai.catalog.flight;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AirportRepository extends JpaRepository<Airport, String> {

    /**
     * Airports whose IATA code or city starts with the given prefix
     * (case-insensitive). IATA prefix matches rank first so "cd" surfaces CDG.
     */
    @Query("""
            select a from Airport a
            where lower(a.iata) like lower(concat(:q, '%'))
               or lower(a.city) like lower(concat(:q, '%'))
            order by
              case when lower(a.iata) like lower(concat(:q, '%')) then 0 else 1 end,
              a.city
            """)
    List<Airport> suggest(@Param("q") String q, Pageable limit);
}
