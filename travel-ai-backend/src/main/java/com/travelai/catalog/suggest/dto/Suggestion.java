package com.travelai.catalog.suggest.dto;

/**
 * A single typeahead suggestion.
 *
 * @param value the value applied to the filter when chosen (e.g. "CDG", "Paris")
 * @param label the primary text shown to the user
 * @param hint  optional secondary text (e.g. an airport's country); may be null
 */
public record Suggestion(String value, String label, String hint) {

    /** A plain suggestion whose value and label are identical, with no hint. */
    public static Suggestion of(String value) {
        return new Suggestion(value, value, null);
    }
}
