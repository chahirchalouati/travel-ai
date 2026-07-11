/**
 * Catalog module: hotels, flights, cruises and restaurants with their entities, repositories
 * and search services. Declared OPEN because it is a widely-consumed domain kernel — admin,
 * ai, itinerary and booking legitimately depend on its catalog types.
 */
@org.springframework.modulith.ApplicationModule(type = org.springframework.modulith.ApplicationModule.Type.OPEN)
package com.travelai.catalog;
