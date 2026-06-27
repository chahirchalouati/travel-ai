package com.travelai.user;

import com.travelai.auth.User;
import com.travelai.user.dto.PreferencesResponse;
import com.travelai.user.dto.UpdatePreferencesRequest;
import com.travelai.user.dto.UpdateProfileRequest;
import com.travelai.user.dto.UserProfileResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserProfileResponse toProfileResponse(User user);

    PreferencesResponse toPreferencesResponse(UserPreferences preferences);

    /** Applies non-null fields from request onto the User entity. */
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    @Mapping(target = "active", ignore = true)
    void updateUserFromRequest(UpdateProfileRequest request, @MappingTarget User user);

    /** Applies non-null fields from request onto UserPreferences. Ignores the user association. */
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updatePreferencesFromRequest(UpdatePreferencesRequest request, @MappingTarget UserPreferences preferences);
}
