package rsi.cinema.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlType;

import java.util.ArrayList;
import java.util.List;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name="FilmInfo", propOrder={"title","director","actors","description","imageName", "availableSeats","reservedSeats"})
public class FilmInfo {
    private String title;
    private String director;
    @XmlElementWrapper(name="actors")
    @XmlElement(name="actor")
    private List<String> actors;
    private String description;
    private String imageName;
    private List<String> availableSeats;
    private List<String> reservedSeats;

    public FilmInfo() {}
    public FilmInfo(String title, String director, List<String> actors, String description, String imageName) {
        this.title = title;
        this.director = director;
        this.actors = actors;
        this.description = description;
        this.imageName = imageName;
        this.availableSeats = new ArrayList<>(List.of(
            "A1", "A2", "A3", "A4", "A5",
            "B1", "B2", "B3", "B4", "B5",
            "C1", "C2", "C3", "C4", "C5",
            "D1", "D2", "D3", "D4", "D5",
            "E1", "E2", "E3", "E4", "E5"));
        this.reservedSeats = new ArrayList<>();
    }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDirector() { return director; }
    public void setDirector(String director) { this.director = director; }
    public List<String> getActors() { return actors; }
    public void setActors(List<String> actors) { this.actors = actors; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImageName() { return imageName; }
    public void setImageName(String imageName) { this.imageName = imageName; }
    public List<String> getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(List<String> availableSeats) { this.availableSeats = availableSeats; }
    public List<String> getReservedSeats() { return reservedSeats; }
    public void setReservedSeats(List<String> reservedSeats) { this.reservedSeats = reservedSeats; }
}