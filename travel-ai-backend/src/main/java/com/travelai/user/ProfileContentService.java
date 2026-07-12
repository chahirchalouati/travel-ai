package com.travelai.user;

import com.travelai.auth.User;
import com.travelai.auth.UserRepository;
import com.travelai.user.dto.PhotoRequest;
import com.travelai.user.dto.PhotoResponse;
import com.travelai.user.dto.PlaceRequest;
import com.travelai.user.dto.PlaceResponse;
import com.travelai.user.dto.UpdateProfileMediaRequest;
import com.travelai.user.dto.UserProfileResponse;
import com.travelai.shared.exception.ErrorCode;
import com.travelai.shared.exception.TravelAiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Manages user-authored profile content: presentation fields (avatar/cover/bio),
 * travel-map places and the photo gallery. All operations are scoped to the
 * authenticated user.
 */
@Service
@RequiredArgsConstructor
public class ProfileContentService {

    private final UserRepository userRepository;
    private final UserPlaceRepository placeRepository;
    private final UserPhotoRepository photoRepository;
    private final UserMapper userMapper;

    @Transactional
    public UserProfileResponse updateMedia(String email, UpdateProfileMediaRequest request) {
        User user = user(email);
        if (request.avatarUrl() != null) user.setAvatarUrl(blankToNull(request.avatarUrl()));
        if (request.coverUrl() != null) user.setCoverUrl(blankToNull(request.coverUrl()));
        if (request.bio() != null) user.setBio(blankToNull(request.bio()));
        if (request.location() != null) user.setLocation(blankToNull(request.location()));
        if (request.handle() != null) user.setHandle(blankToNull(request.handle()));
        return userMapper.toProfileResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<PlaceResponse> listPlaces(String email) {
        return placeRepository.findByUserIdOrderByVisitedOnDesc(user(email).getId()).stream()
                .map(PlaceResponse::from)
                .toList();
    }

    @Transactional
    public PlaceResponse addPlace(String email, PlaceRequest request) {
        UUID userId = user(email).getId();
        UserPlace place = placeRepository.save(UserPlace.builder()
                .userId(userId)
                .name(request.name())
                .country(request.country())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .note(request.note())
                .visitedOn(request.visitedOn())
                .build());
        return PlaceResponse.from(place);
    }

    @Transactional
    public PlaceResponse updatePlace(String email, UUID placeId, PlaceRequest request) {
        UserPlace place = ownedPlace(email, placeId);
        place.setName(request.name());
        place.setCountry(request.country());
        place.setLatitude(request.latitude());
        place.setLongitude(request.longitude());
        place.setNote(request.note());
        place.setVisitedOn(request.visitedOn());
        return PlaceResponse.from(placeRepository.save(place));
    }

    @Transactional
    public void deletePlace(String email, UUID placeId) {
        placeRepository.delete(ownedPlace(email, placeId));
    }

    @Transactional(readOnly = true)
    public List<PhotoResponse> listPhotos(String email) {
        return photoRepository.findByUserIdOrderByCreatedAtDesc(user(email).getId()).stream()
                .map(PhotoResponse::from)
                .toList();
    }

    @Transactional
    public PhotoResponse addPhoto(String email, PhotoRequest request) {
        UUID userId = user(email).getId();
        UserPhoto photo = photoRepository.save(UserPhoto.builder()
                .userId(userId)
                .url(request.url())
                .caption(request.caption())
                .place(request.place())
                .build());
        return PhotoResponse.from(photo);
    }

    @Transactional
    public void deletePhoto(String email, UUID photoId) {
        UserPhoto photo = photoRepository.findByIdAndUserId(photoId, user(email).getId())
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PHOTO_NOT_FOUND));
        photoRepository.delete(photo);
    }

    private UserPlace ownedPlace(String email, UUID placeId) {
        return placeRepository.findByIdAndUserId(placeId, user(email).getId())
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.PLACE_NOT_FOUND));
    }

    private User user(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> TravelAiException.notFound(ErrorCode.USER_NOT_FOUND));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
