package org.example.filters;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;
import jakarta.ws.rs.core.Response;
import org.example.helpers.TokenValidator;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Provider
public class AuthFilter implements ContainerRequestFilter {
    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String path = requestContext.getUriInfo().getPath();
        if (path.equals("cinema/login") || path.equals("cinema/register") || path.startsWith("cinema/films") || path.startsWith("cinema/images/") || path.equals("application.wadl") || path.startsWith("application.wadl/")) {
            return;
        }
        String authHeader = requestContext.getHeaderString("Authorization");
        if (authHeader == null || !authHeader.startsWith("Basic ")) {
            requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                    .entity("Missing or invalid Authorization header").build());
            return;
        }
        String base64Credentials = authHeader.substring("Basic ".length());
        String credentials = new String(Base64.getDecoder().decode(base64Credentials), StandardCharsets.UTF_8);
        String[] values = credentials.split(":", 2);
        if (values.length != 2 || !TokenValidator.isPasswordValid(values[0], values[1])) {
            requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                    .entity("Invalid username or password").build());
        }
        requestContext.setProperty("username", values[0]);
    }
}