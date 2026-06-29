package com.travelai.admin.catalog;

import com.travelai.admin.catalog.dto.*;
import com.travelai.catalog.cruise.Cruise;
import com.travelai.catalog.cruise.CruiseRepository;
import com.travelai.catalog.flight.Flight;
import com.travelai.catalog.flight.FlightRepository;
import com.travelai.catalog.hotel.Hotel;
import com.travelai.catalog.hotel.HotelRepository;
import com.travelai.catalog.restaurant.Restaurant;
import com.travelai.catalog.restaurant.RestaurantRepository;
import com.travelai.destination.Destination;
import com.travelai.destination.DestinationRepository;
import com.travelai.partner.Partner;
import com.travelai.partner.PartnerRepository;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import com.travelai.stories.TravelStory;
import com.travelai.stories.TravelStoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Admin-only create/update/delete + full listing for catalog content. */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminCatalogService {

    private final HotelRepository hotelRepository;
    private final FlightRepository flightRepository;
    private final CruiseRepository cruiseRepository;
    private final RestaurantRepository restaurantRepository;
    private final DestinationRepository destinationRepository;
    private final TravelStoryRepository storyRepository;
    private final PartnerRepository partnerRepository;

    // ── Hotels ────────────────────────────────────────────────────────────

    public Page<AdminHotelDto.View> listHotels(Pageable pageable) {
        return hotelRepository.findAll(pageable).map(AdminHotelDto.View::from);
    }

    @Transactional
    public AdminHotelDto.View createHotel(AdminHotelDto.Upsert req) {
        Hotel hotel = new Hotel();
        applyHotel(hotel, req);
        Hotel saved = hotelRepository.save(hotel);
        log.info("Admin created hotel {}", saved.getId());
        return AdminHotelDto.View.from(saved);
    }

    @Transactional
    public AdminHotelDto.View updateHotel(UUID id, AdminHotelDto.Upsert req) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.HOTEL_NOT_FOUND));
        applyHotel(hotel, req);
        return AdminHotelDto.View.from(hotelRepository.save(hotel));
    }

    @Transactional
    public void deleteHotel(UUID id) {
        if (!hotelRepository.existsById(id)) {
            throw TravelAiException.notFound(ErrorCode.HOTEL_NOT_FOUND);
        }
        hotelRepository.deleteById(id);
        log.info("Admin deleted hotel {}", id);
    }

    private void applyHotel(Hotel h, AdminHotelDto.Upsert req) {
        h.setPartner(requirePartner(req.partnerId()));
        h.setName(req.name());
        h.setStars(req.stars());
        h.setDescription(req.description());
        h.setCity(req.city());
        h.setLatitude(req.latitude());
        h.setLongitude(req.longitude());
        h.setPetFriendly(req.petFriendly());
        h.setAccessible(req.accessible());
        h.setFamilyFriendly(req.familyFriendly());
        h.setSeaProximity(req.seaProximity());
        h.setImageUrl(req.imageUrl());
        h.setBasePriceNight(req.basePriceNight());
        h.setActive(req.active() == null || req.active());
    }

    // ── Flights ───────────────────────────────────────────────────────────

    public Page<AdminFlightDto.View> listFlights(Pageable pageable) {
        return flightRepository.findAll(pageable).map(AdminFlightDto.View::from);
    }

    @Transactional
    public AdminFlightDto.View createFlight(AdminFlightDto.Upsert req) {
        Flight flight = new Flight();
        applyFlight(flight, req);
        Flight saved = flightRepository.save(flight);
        log.info("Admin created flight {}", saved.getId());
        return AdminFlightDto.View.from(saved);
    }

    @Transactional
    public AdminFlightDto.View updateFlight(UUID id, AdminFlightDto.Upsert req) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.FLIGHT_NOT_FOUND));
        applyFlight(flight, req);
        return AdminFlightDto.View.from(flightRepository.save(flight));
    }

    @Transactional
    public void deleteFlight(UUID id) {
        if (!flightRepository.existsById(id)) {
            throw TravelAiException.notFound(ErrorCode.FLIGHT_NOT_FOUND);
        }
        flightRepository.deleteById(id);
        log.info("Admin deleted flight {}", id);
    }

    private void applyFlight(Flight f, AdminFlightDto.Upsert req) {
        f.setAirline(req.airline());
        f.setFlightNumber(req.flightNumber());
        f.setOriginIata(req.originIata());
        f.setDestIata(req.destIata());
        f.setDepartureAt(req.departureAt());
        f.setArrivalAt(req.arrivalAt());
        f.setPrice(req.price());
        f.setSeatsAvailable(req.seatsAvailable() != null ? req.seatsAvailable() : 0);
        f.setBaggageIncluded(req.baggageIncluded());
        f.setActive(req.active() == null || req.active());
    }

    // ── Cruises ───────────────────────────────────────────────────────────

    public Page<AdminCruiseDto.View> listCruises(Pageable pageable) {
        return cruiseRepository.findAll(pageable).map(AdminCruiseDto.View::from);
    }

    @Transactional
    public AdminCruiseDto.View createCruise(AdminCruiseDto.Upsert req) {
        Cruise cruise = new Cruise();
        applyCruise(cruise, req);
        Cruise saved = cruiseRepository.save(cruise);
        log.info("Admin created cruise {}", saved.getId());
        return AdminCruiseDto.View.from(saved);
    }

    @Transactional
    public AdminCruiseDto.View updateCruise(UUID id, AdminCruiseDto.Upsert req) {
        Cruise cruise = cruiseRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.CRUISE_NOT_FOUND));
        applyCruise(cruise, req);
        return AdminCruiseDto.View.from(cruiseRepository.save(cruise));
    }

    @Transactional
    public void deleteCruise(UUID id) {
        if (!cruiseRepository.existsById(id)) {
            throw TravelAiException.notFound(ErrorCode.CRUISE_NOT_FOUND);
        }
        cruiseRepository.deleteById(id);
        log.info("Admin deleted cruise {}", id);
    }

    private void applyCruise(Cruise c, AdminCruiseDto.Upsert req) {
        c.setOperator(req.operator());
        c.setName(req.name());
        c.setShipName(req.shipName());
        c.setDeparturePort(req.departurePort());
        c.setArrivalPort(req.arrivalPort());
        c.setDepartureDate(req.departureDate());
        c.setReturnDate(req.returnDate());
        c.setDurationNights(req.durationNights());
        c.setPricePerPerson(req.pricePerPerson());
        c.setCabinsAvailable(req.cabinsAvailable());
        c.setCruiseType(req.cruiseType());
        c.setDescription(req.description());
        c.setImageUrl(req.imageUrl());
        c.setItinerary(req.itinerary());
        c.setAllInclusive(req.allInclusive());
        c.setActive(req.active() == null || req.active());
    }

    // ── Restaurants ───────────────────────────────────────────────────────

    public Page<AdminRestaurantDto.View> listRestaurants(Pageable pageable) {
        return restaurantRepository.findAll(pageable).map(AdminRestaurantDto.View::from);
    }

    @Transactional
    public AdminRestaurantDto.View createRestaurant(AdminRestaurantDto.Upsert req) {
        Restaurant restaurant = new Restaurant();
        applyRestaurant(restaurant, req);
        Restaurant saved = restaurantRepository.save(restaurant);
        log.info("Admin created restaurant {}", saved.getId());
        return AdminRestaurantDto.View.from(saved);
    }

    @Transactional
    public AdminRestaurantDto.View updateRestaurant(UUID id, AdminRestaurantDto.Upsert req) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.RESTAURANT_NOT_FOUND));
        applyRestaurant(restaurant, req);
        return AdminRestaurantDto.View.from(restaurantRepository.save(restaurant));
    }

    @Transactional
    public void deleteRestaurant(UUID id) {
        if (!restaurantRepository.existsById(id)) {
            throw TravelAiException.notFound(ErrorCode.RESTAURANT_NOT_FOUND);
        }
        restaurantRepository.deleteById(id);
        log.info("Admin deleted restaurant {}", id);
    }

    private void applyRestaurant(Restaurant r, AdminRestaurantDto.Upsert req) {
        r.setPartner(requirePartner(req.partnerId()));
        r.setName(req.name());
        r.setCuisineType(req.cuisineType());
        r.setPriceTier(req.priceTier());
        r.setDescription(req.description());
        r.setCity(req.city());
        r.setLatitude(req.latitude());
        r.setLongitude(req.longitude());
        r.setPetFriendly(req.petFriendly());
        r.setAccessible(req.accessible());
        r.setImageUrl(req.imageUrl());
        r.setActive(req.active() == null || req.active());
    }

    // ── Destinations ──────────────────────────────────────────────────────

    public Page<AdminDestinationDto.View> listDestinations(Pageable pageable) {
        return destinationRepository.findAll(pageable).map(AdminDestinationDto.View::from);
    }

    @Transactional
    public AdminDestinationDto.View createDestination(AdminDestinationDto.Upsert req) {
        Destination destination = new Destination();
        applyDestination(destination, req);
        Destination saved = destinationRepository.save(destination);
        log.info("Admin created destination {}", saved.getId());
        return AdminDestinationDto.View.from(saved);
    }

    @Transactional
    public AdminDestinationDto.View updateDestination(UUID id, AdminDestinationDto.Upsert req) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.DESTINATION_NOT_FOUND));
        applyDestination(destination, req);
        return AdminDestinationDto.View.from(destinationRepository.save(destination));
    }

    @Transactional
    public void deleteDestination(UUID id) {
        if (!destinationRepository.existsById(id)) {
            throw TravelAiException.notFound(ErrorCode.DESTINATION_NOT_FOUND);
        }
        destinationRepository.deleteById(id);
        log.info("Admin deleted destination {}", id);
    }

    private void applyDestination(Destination d, AdminDestinationDto.Upsert req) {
        d.setName(req.name());
        d.setCountry(req.country());
        d.setContinent(req.continent());
        d.setDescription(req.description());
        d.setImageUrl(req.imageUrl());
        d.setGalleryUrls(req.galleryUrls());
        d.setTags(req.tags());
        d.setClimate(req.climate());
        d.setBestMonths(req.bestMonths());
        d.setAvgDailyCost(req.avgDailyCost());
        d.setCurrency(req.currency());
        d.setLanguage(req.language());
        d.setTimezone(req.timezone());
        d.setLatitude(req.latitude());
        d.setLongitude(req.longitude());
        d.setPopularityScore(req.popularityScore());
        d.setFeatured(req.featured());
        d.setActive(req.active() == null || req.active());
    }

    // ── Travel stories ────────────────────────────────────────────────────

    public Page<AdminStoryDto.View> listStories(Pageable pageable) {
        return storyRepository.findAll(pageable).map(AdminStoryDto.View::from);
    }

    @Transactional
    public AdminStoryDto.View createStory(AdminStoryDto.Upsert req) {
        TravelStory story = new TravelStory();
        applyStory(story, req);
        TravelStory saved = storyRepository.save(story);
        log.info("Admin created story {}", saved.getId());
        return AdminStoryDto.View.from(saved);
    }

    @Transactional
    public AdminStoryDto.View updateStory(UUID id, AdminStoryDto.Upsert req) {
        TravelStory story = storyRepository.findById(id)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.STORY_NOT_FOUND));
        applyStory(story, req);
        return AdminStoryDto.View.from(storyRepository.save(story));
    }

    @Transactional
    public void deleteStory(UUID id) {
        if (!storyRepository.existsById(id)) {
            throw TravelAiException.notFound(ErrorCode.STORY_NOT_FOUND);
        }
        storyRepository.deleteById(id);
        log.info("Admin deleted story {}", id);
    }

    private void applyStory(TravelStory s, AdminStoryDto.Upsert req) {
        s.setPlace(req.place());
        s.setCountry(req.country());
        s.setTag(req.tag());
        s.setMinutes(req.minutes());
        s.setPosterUrl(req.posterUrl());
        s.setVideoUrl(req.videoUrl());
        s.setFeatured(req.featured());
        s.setSortOrder(req.sortOrder());
        s.setActive(req.active() == null || req.active());
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Partner requirePartner(UUID partnerId) {
        return partnerRepository.findById(partnerId)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PARTNER_NOT_FOUND));
    }
}
