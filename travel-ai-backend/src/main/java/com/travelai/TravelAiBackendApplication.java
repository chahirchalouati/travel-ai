package com.travelai;

import com.travelai.media.StorageProperties;
import com.travelai.shared.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, StorageProperties.class})
// Serialize Page responses via a stable DTO (content[] + nested "page" metadata)
// instead of PageImpl as-is, whose JSON shape Spring does not guarantee across
// versions. Frontend PageWrapper mirrors this shape.
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)
public class TravelAiBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TravelAiBackendApplication.class, args);
    }
}
