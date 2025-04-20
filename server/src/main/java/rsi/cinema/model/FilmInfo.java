package rsi.cinema.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlType;
import jakarta.xml.bind.annotation.adapters.XmlJavaTypeAdapter;
import rsi.cinema.helpers.MapAdapter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "FilmInfo", propOrder = {"title", "director", "actors", "description", "imageName", "showtimes", "seatsByShowtime"})
public class FilmInfo {
    private String title;
    private String director;
    @XmlElementWrapper(name = "actors")
    @XmlElement(name = "actor")
    private List<String> actors;
    private String description;
    private String imageName;
    @XmlElementWrapper(name = "showtimes")
    @XmlElement(name = "showtime")
    private List<String> showtimes;
    @XmlJavaTypeAdapter(MapAdapter.class)
    private Map<String, List<String>> seatsByShowtime;

    public FilmInfo() {}
    public FilmInfo(String title, String director, List<String> actors, String description, String imageName, List<String> showtimes) {
        this.title = title;
        this.director = director;
        this.actors = actors;
        this.description = description;
        this.imageName = imageName;
        this.showtimes = showtimes;
        this.seatsByShowtime = new HashMap<>();
        for (String showtime : showtimes) {
            this.seatsByShowtime.put(showtime, new ArrayList<>(List.of(
                "A1", "A2", "A3", "A4", "A5",
                "B1", "B2", "B3", "B4", "B5",
                "C1", "C2", "C3", "C4", "C5",
                "D1", "D2", "D3", "D4", "D5",
                "E1", "E2", "E3", "E4", "E5"
            )));
        }
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
    public List<String> getShowtimes() { return showtimes; }
    public void setShowtimes(List<String> showtimes) { this.showtimes = showtimes; }
    public Map<String, List<String>> getSeatsByShowtime() { return seatsByShowtime; }
    public void setSeatsByShowtime(Map<String, List<String>> seatsByShowtime) { this.seatsByShowtime = seatsByShowtime; }
}