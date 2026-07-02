package com.travelai.auth.dto;

import java.util.List;

/**
 * Returned once when 2FA is enabled. The recovery codes are plaintext and shown
 * a single time — only their hashes are persisted.
 */
public record TwoFactorEnableResponse(
        List<String> recoveryCodes
) {}
