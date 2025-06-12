package org.example.server_rest;

import jakarta.ws.rs.ApplicationPath;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.wadl.internal.WadlResource;

@ApplicationPath("/")
public class HelloApplication extends ResourceConfig {
    public HelloApplication() {
        packages("org.example.server_rest");
        register(WadlResource.class);
        register(org.example.filters.AuthFilter.class);
    }
}