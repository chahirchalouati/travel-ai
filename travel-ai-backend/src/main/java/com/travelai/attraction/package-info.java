/**
 * Attractions / Things-to-Do module — browse, search, and explore landmarks,
 * museums, tours and activities. Reviewable via the {@code review} module using
 * {@code target_type = "ATTRACTION"}. Declared OPEN because it is a widely-consumed
 * domain kernel (ai, itinerary and admin depend on its attraction types).
 */
@org.springframework.modulith.ApplicationModule(type = org.springframework.modulith.ApplicationModule.Type.OPEN)
package com.travelai.attraction;
