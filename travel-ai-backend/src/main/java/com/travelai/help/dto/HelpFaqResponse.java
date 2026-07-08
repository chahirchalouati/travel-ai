package com.travelai.help.dto;

import java.util.UUID;

public record HelpFaqResponse(
        UUID id,
        String question,
        String answer,
        String category
) {}
