package com.travelai.tripcollab;

/** Effective access a user has on a trip. */
public enum TripAccessLevel {
    OWNER,
    EDITOR,
    VIEWER,
    NONE;

    public boolean canView() {
        return this != NONE;
    }

    public boolean canEdit() {
        return this == OWNER || this == EDITOR;
    }
}
