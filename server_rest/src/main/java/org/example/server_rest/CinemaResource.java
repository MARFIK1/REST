package org.example.server_rest;

import jakarta.ws.rs.*;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.*;

import org.example.dtos.FilmInfoHateoasDto;
import org.example.dtos.RegisterOrLoginRequestDto;
import org.example.dtos.ReservationHateoasDto;
import org.example.dtos.ReservationRequestDto;
import org.example.helpers.TokenValidator;
import org.example.model.FilmInfo;
import org.example.model.Reservation;

import java.util.ArrayList;
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
    public List<FilmInfoHateoasDto> getFilmList(@Context UriInfo uriInfo) {
        List<FilmInfo> films = cinemaService.getFilmList();
        List<FilmInfoHateoasDto> result = new ArrayList<>();
        for (int i = 0; i < films.size(); i++) {
            result.add(new FilmInfoHateoasDto(films.get(i), i, uriInfo));
        }
        return result;
    }

    @GET
    @Path("/films/{filmId}")
    public FilmInfoHateoasDto getFilmInfo(@PathParam("filmId") int filmId, @Context UriInfo uriInfo) {
        FilmInfo film = cinemaService.getFilmInfo(filmId);
        if (film == null) {
            throw new NotFoundException("Film not found");
        }
        return new FilmInfoHateoasDto(film, filmId, uriInfo);
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
    public Response makeReservation(@Context ContainerRequestContext ctx, ReservationRequestDto req) {
        String username = (String) ctx.getProperty("username");
        String result = cinemaService.makeReservation(req.filmIndex, req.day, req.showtime, req.seats, username);
        if (result.startsWith("Reservation successful")) {
            return Response.ok(result).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity(result).build();
        }
    }

    @DELETE
    @Path("/reservation/{reservationIndex}")
    public Response cancelReservation(@Context ContainerRequestContext ctx, @PathParam("reservationIndex") int reservationIndex) {
        String username = (String) ctx.getProperty("username");
        String result = cinemaService.cancelReservation(username, reservationIndex);
        if (result.startsWith("Reservation cancelled")) {
            return Response.ok(result).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity(result).build();
        }
    }

    @PUT
    @Path("/reservation/{reservationIndex}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response editReservation(@Context ContainerRequestContext ctx, @PathParam("reservationIndex") int reservationIndex, ReservationRequestDto req) {
        String username = (String) ctx.getProperty("username");
        String result = cinemaService.editReservation(username, reservationIndex, req);
        if (result.startsWith("Reservation updated")) {
            return Response.ok(result).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity(result).build();
        }
    }

    @GET
    @Path("/reservations")
    public List<ReservationHateoasDto> getUserReservations(@Context ContainerRequestContext ctx, @Context UriInfo uriInfo) {
        String username = (String) ctx.getProperty("username");
        List<Reservation> reservations = cinemaService.getUserReservations(username);
        List<ReservationHateoasDto> result = new ArrayList<>();
        for (int i = 0; i < reservations.size(); i++) {
            result.add(new ReservationHateoasDto(reservations.get(i), i, uriInfo));
        }
        return result;
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

    @POST
    @Path("/generate-pdf")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces("application/pdf")
    public Response generatePDF(@Context ContainerRequestContext ctx, ReservationRequestDto req) {
        String username = (String) ctx.getProperty("username");
        byte[] pdf = cinemaService.generatePDF(req.filmIndex, req.day, req.showtime, req.seats, username);
        if (pdf == null) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("PDF generation failed").build();
        }
        return Response.ok(pdf)
                .header("Content-Disposition", "attachment; filename=reservation.pdf")
                .build();
    }
}