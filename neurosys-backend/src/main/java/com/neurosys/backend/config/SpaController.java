package com.neurosys.backend.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = {
        "/",
        "/dashboard",
        "/computers",
        "/software",
        "/analytics",
        "/settings",
        "/login"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
