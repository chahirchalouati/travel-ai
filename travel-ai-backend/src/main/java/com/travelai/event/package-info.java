/**
 * Shared domain events. Pure record payloads with no dependencies on other modules, so any
 * module can publish them and the notification module can consume them without creating a
 * dependency cycle (publisher -> event <- consumer, one direction each).
 */
@org.springframework.modulith.ApplicationModule(type = org.springframework.modulith.ApplicationModule.Type.OPEN)
package com.travelai.event;
