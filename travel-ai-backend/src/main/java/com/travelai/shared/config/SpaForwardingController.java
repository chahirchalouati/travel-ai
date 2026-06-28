package com.travelai.shared.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

@Controller
@Profile("prod")
public class SpaForwardingController implements ErrorController {

    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request) {
        String path = (String) request.getAttribute("jakarta.servlet.error.request_uri");
        if (path != null && path.startsWith("/api")) {
            Integer status = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
            return ResponseEntity.status(status != null ? status : HttpStatus.NOT_FOUND.value())
                    .body(Map.of("success", false, "error", "Not found"));
        }
        return "forward:/index.html";
    }
}
