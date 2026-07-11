package com.travelai.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Registers the audit interceptor from within the audit module (so the shared web config
 * does not depend on this module — avoids a Modulith cycle).
 *
 * <p>The {@link AuditService} is injected as an {@link ObjectProvider} and never resolved
 * here: a {@code WebMvcConfigurer} that eagerly depends on an application bean forces that
 * bean's whole graph to be created while the MVC/AOP auto-proxy infrastructure is still
 * bootstrapping, which makes unrelated infrastructure beans (filters, interceptors) get
 * wrapped in JDK dynamic proxies and fail concrete-type injection. Keeping the dependency
 * lazy avoids that early-instantiation cascade.
 */
@Configuration
@RequiredArgsConstructor
public class AuditWebConfig implements WebMvcConfigurer {

    private final ObjectProvider<AuditService> auditService;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuditInterceptor(auditService))
                .addPathPatterns("/api/admin/**");
    }
}
