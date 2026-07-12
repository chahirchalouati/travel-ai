package com.travelai.user;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.shared.domain.SpendingPriority;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import com.travelai.user.dto.PreferencesResponse;
import com.travelai.user.dto.UpdatePreferencesRequest;
import com.travelai.user.dto.UpdateProfileRequest;
import com.travelai.user.dto.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final UserMapper userMapper;

    /** Returns profile of the currently authenticated user. */
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = findUserByEmail(email);
        return userMapper.toProfileResponse(user);
    }

    /** Updates firstName, lastName, phone of the authenticated user. */
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findUserByEmail(email);
        userMapper.updateUserFromRequest(request, user);
        User saved = userRepository.save(user);
        log.info("Profile updated for user {}", email);
        return userMapper.toProfileResponse(saved);
    }

    /** Returns preferences, creating defaults if they don't exist yet. */
    @Transactional(readOnly = true)
    public PreferencesResponse getPreferences(String email) {
        User user = findUserByEmail(email);
        UserPreferences prefs = preferencesRepository.findByUserId(user.getId())
                .orElseGet(() -> defaultPreferences(user));
        return userMapper.toPreferencesResponse(prefs);
    }

    /** Upserts user preferences. */
    public PreferencesResponse updatePreferences(String email, UpdatePreferencesRequest request) {
        User user = findUserByEmail(email);
        UserPreferences prefs = preferencesRepository.findByUserId(user.getId())
                .orElseGet(() -> defaultPreferences(user));
        userMapper.updatePreferencesFromRequest(request, prefs);
        UserPreferences saved = preferencesRepository.save(prefs);
        log.info("Preferences updated for user {}", email);
        return userMapper.toPreferencesResponse(saved);
    }

    /** Returns full booking history summary for the authenticated user (stub — expanded in booking sprint). */
    @Transactional(readOnly = true)
    public List<UUID> getBookingIds(String email) {
        // Booking module will publish data; for now return empty list
        return List.of();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
    }

    private UserPreferences defaultPreferences(User user) {
        return UserPreferences.builder()
                .user(user)
                .spendingPriority(SpendingPriority.BALANCED)
                .constraints(List.of())
                .language("it")
                .build();
    }
}
