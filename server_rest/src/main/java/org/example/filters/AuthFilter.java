package org.example.filters;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;
import jakarta.ws.rs.core.Response;
import org.example.helpers.TokenValidator;

import java.io.IOException;

@Provider
public class AuthFilter implements ContainerRequestFilter {
    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String path = requestContext.getUriInfo().getPath();
        // Pozwól na rejestrację i logowanie bez tokena
        if (path.equals("cinema/login") || path.equals("cinema/register") || path.startsWith("cinema/films") || path.startsWith("cinema/images/")) {
            return;
        }
        String authHeader = requestContext.getHeaderString("Authorization");
        if (authHeader == null || !TokenValidator.isTokenValid(authHeader)) {
            requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                    .entity("Invalid or missing token").build());
        }
    }
}