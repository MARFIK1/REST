package org.example.dtos;

import org.example.model.FilmInfo;

import jakarta.ws.rs.core.UriInfo;

import java.util.List;
import java.util.Map;

public class FilmInfoHateoasDto {
    public String title;
    public String director;
    public List<String> actors;
    public String description;
    public String imageName;
    public Map<String, List<String>> schedule;
    public List<LinkDto> links;

    public FilmInfoHateoasDto(FilmInfo film, int filmId, UriInfo uriInfo) {
        this.title = film.getTitle();
        this.director = film.getDirector();
        this.actors = film.getActors();
        this.description = film.getDescription();
        this.imageName = film.getImageName();
        this.schedule = film.getSchedule();
        this.links = List.of(
            new LinkDto(
                "self",
                uriInfo.getBaseUriBuilder()
                    .path("cinema/films/" + filmId)
                    .build()
                    .toString(),
                "GET"
            ),
            new LinkDto(
                "makeReservation",
                uriInfo.getBaseUriBuilder()
                    .path("cinema/reservation")
                    .build()
                    .toString(),
                "POST"
            ),
            new LinkDto(
                "image",
                uriInfo.getBaseUriBuilder()
                    .path("cinema/images/" + film.getImageName())
                    .build()
                    .toString(),
                "GET"
            )
        );
    }
}