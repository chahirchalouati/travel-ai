/**
 * Shared kernel: cross-cutting domain types ({@code ApiResponse}, {@code BaseEntity}),
 * exceptions and infrastructure config used by every business module. Declared OPEN so
 * any module may depend on these building blocks without tripping non-exposed-type checks.
 */
@org.springframework.modulith.ApplicationModule(type = org.springframework.modulith.ApplicationModule.Type.OPEN)
package com.travelai.shared;
