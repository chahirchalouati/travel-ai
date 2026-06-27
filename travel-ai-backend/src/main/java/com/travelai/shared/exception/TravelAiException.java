package com.travelai.shared.exception;

import lombok.Getter;

@Getter
public class TravelAiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final int httpStatus;

    public TravelAiException(ErrorCode errorCode, int httpStatus) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public static TravelAiException notFound(ErrorCode errorCode) {
        return new TravelAiException(errorCode, 404);
    }

    public static TravelAiException conflict(ErrorCode errorCode) {
        return new TravelAiException(errorCode, 409);
    }

    public static TravelAiException unauthorized(ErrorCode errorCode) {
        return new TravelAiException(errorCode, 401);
    }

    public static TravelAiException forbidden(ErrorCode errorCode) {
        return new TravelAiException(errorCode, 403);
    }

    public static TravelAiException badRequest(ErrorCode errorCode) {
        return new TravelAiException(errorCode, 400);
    }
}
