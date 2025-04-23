package rsi.cinema.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlType;

import java.util.List;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "Reservation", propOrder = {"username", "filmTitle", "showtime", "seats"})
public class Reservation {
    private String username;
    private String filmTitle;
    private String showtime;
    @XmlElement(name = "seat")
    private List<String> seats;

    public Reservation() {}

    public Reservation(String username, String filmTitle, String showtime, List<String> seats) {
        this.username = username;
        this.filmTitle = filmTitle;
        this.showtime = showtime;
        this.seats = seats;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFilmTitle() {
        return filmTitle;
    }

    public void setFilmTitle(String filmTitle) {
        this.filmTitle = filmTitle;
    }

    public String getShowtime() {
        return showtime;
    }

    public void setShowtime(String showtime) {
        this.showtime = showtime;
    }

    public List<String> getSeats() {
        return seats;
    }

    public void setSeats(List<String> seats) {
        this.seats = seats;
    }
}