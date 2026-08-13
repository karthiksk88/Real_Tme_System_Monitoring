package com.neurosys.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward non-API SPA routes to index.html for React Router
        registry.addViewController("/{path:[^\\.]*}")
                .setViewName("forward:/index.html");
        registry.addViewController("/dashboard")
                .setViewName("forward:/index.html");
        registry.addViewController("/computers")
                .setViewName("forward:/index.html");
        registry.addViewController("/software")
                .setViewName("forward:/index.html");
        registry.addViewController("/analytics")
                .setViewName("forward:/index.html");
        registry.addViewController("/settings")
                .setViewName("forward:/index.html");
        registry.addViewController("/login")
                .setViewName("forward:/index.html");
    }
}
