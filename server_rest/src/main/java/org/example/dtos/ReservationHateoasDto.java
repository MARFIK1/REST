package org.example.dtos;

import org.example.model.Reservation;
import org.example.server_rest.CinemaResource;

import jakarta.ws.rs.core.UriInfo;

import java.util.List;

public class ReservationHateoasDto {
    public String filmTitle;
    public String day;
    public String showtime;
    public List<String> seats;
    public List<LinkDto> links;

    public ReservationHateoasDto(Reservation r, int index, UriInfo uriInfo) {
        this.filmTitle = r.getFilmTitle();
        this.day = r.getDay();
        this.showtime = r.getShowtime();
        this.seats = r.getSeats();
        this.links = List.of(
            new LinkDto(
                "self",
                uriInfo.getBaseUriBuilder()
                    .path(CinemaResource.class)
                    .path("reservations")
                    .build().toString(),
                "GET"
            ),
            new LinkDto(
                "cancel",
                uriInfo.getBaseUriBuilder()
                    .path(CinemaResource.class)
                    .path("reservation/{reservationIndex}")
                    .resolveTemplate("reservationIndex", index)
                    .build().toString(),
                "DELETE"
            ),
            new LinkDto(
                "edit",
                uriInfo.getBaseUriBuilder()
                    .path(CinemaResource.class)
                    .path("reservation/{reservationIndex}")
                    .resolveTemplate("reservationIndex", index)
                    .build().toString(),
                "PUT"
            ),
            new LinkDto(
                "generatePDF",
                uriInfo.getBaseUriBuilder()
                    .path(CinemaResource.class)
                    .path("generate-pdf")
                    .build().toString(),
                "POST"
            )
        );
    }
}