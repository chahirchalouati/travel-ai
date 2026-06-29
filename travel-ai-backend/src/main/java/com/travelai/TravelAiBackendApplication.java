package com.travelai;

import com.travelai.media.StorageProperties;
import com.travelai.shared.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, StorageProperties.class})
public class TravelAiBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TravelAiBackendApplication.class, args);
    }
}
