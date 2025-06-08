package org.example.server_rest;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import org.example.dtos.RegisterOrLoginRequestDto;
import org.example.dtos.ReservationRequestDto;
import org.example.helpers.TokenValidator;
import org.example.model.FilmInfo;
import org.example.model.Reservation;

import java.util.List;

@Path("/cinema")
@Produces(MediaType.APPLICATION_JSON)
public class CinemaResource {
    private static final CinemaService cinemaService;

    static {
        try {
            cinemaService = new CinemaService();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @GET
    @Path("/films")
    public List<FilmInfo> getFilmList() {
        return cinemaService.getFilmList();
    }

    @GET
    @Path("/films/{filmId}")
    public FilmInfo getFilmInfo(@PathParam("filmId") int filmId) {
        return cinemaService.getFilmInfo(filmId);
    }

    @GET
    @Path("/images/{imageName}")
    @Produces("image/jpeg")
    public Response downloadImage(@PathParam("imageName") String imageName) {
        try {
            byte[] image = cinemaService.getImage(imageName);
            if (image == null) return Response.status(Response.Status.NOT_FOUND).build();
            return Response.ok(image).build();
        } catch (Exception e) {
            return Response.serverError().build();
        }
    }

    @POST
    @Path("/reservation")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response makeReservation(@HeaderParam("Authorization") String authToken, ReservationRequestDto req) {
        String username = TokenValidator.getUsernameFromToken(authToken);
        if (username == null) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("Invalid token").build();
        }
        String result = cinemaService.makeReservation(req.filmIndex, req.day, req.showtime, req.seats, username);
        if (result.startsWith("Reservation successful")) {
            return Response.ok(result).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity(result).build();
        }
    }

    @GET
    @Path("/reservations")
    public List<Reservation> getUserReservations(@HeaderParam("Authorization") String authToken) {
        String username = TokenValidator.getUsernameFromToken(authToken);
        if (username == null) {
            throw new WebApplicationException("Invalid token", Response.Status.UNAUTHORIZED);
        }
        return cinemaService.getUserReservations(username);
    }

    @GET
    @Path("/occupied-seats")
    public List<String> getOccupiedSeats(@QueryParam("filmIndex") int filmIndex, @QueryParam("day") String day, @QueryParam("showtime") String showtime) {
        return cinemaService.getOccupiedSeats(filmIndex, day, showtime);
    }

    @POST
    @Path("/register")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response registerUser(RegisterOrLoginRequestDto req) {
        boolean success = TokenValidator.registerUser(req.username, req.password);
        if (!success) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Username already exists.").build();
        }
        return Response.ok("User registered successfully.").build();
    }

    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    public Response loginUser(RegisterOrLoginRequestDto req) {
        String token = TokenValidator.loginUser(req.username, req.password);
        if (token == null) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("Invalid username or password.").build();
        }
        return Response.ok(token).build();
    }

    public static class RegisterRequest {
        public String username;
        public String password;
    }

    public static class LoginRequest {
        public String username;
        public String password;
    }

    public static class ReservationRequest {
        public int filmIndex;
        public String day;
        public String showtime;
        public List<String> seats;
    }
}