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
@XmlType(name = "FilmInfo", propOrder = {"title", "director", "actors", "description", "imageName", "schedule"})
public class FilmInfo {
    private String title;
    private String director;
    @XmlElementWrapper(name = "actors")
    @XmlElement(name = "actor")
    private List<String> actors;
    private String description;
    private String imageName;
    @XmlJavaTypeAdapter(MapAdapter.class)
    private Map<String, List<String>> schedule;
    private transient Map<String, Map<String, List<String>>> seatsBySchedule;

    public FilmInfo() {}
    
    public FilmInfo(String title, String director, List<String> actors, String description, String imageName, Map<String, List<String>> schedule) {
        this.title = title;
        this.director = director;
        this.actors = actors;
        this.description = description;
        this.imageName = imageName;
        this.schedule = schedule;
        this.seatsBySchedule = new HashMap<>();
        
        for (Map.Entry<String, List<String>> entry : schedule.entrySet()) {
            String day = entry.getKey();
            List<String> showtimes = entry.getValue();
            Map<String, List<String>> timeSeats = new HashMap<>();

            for (String showtime : showtimes) {
                timeSeats.put(showtime, generateStandardTheaterLayout());
            }
            
            this.seatsBySchedule.put(day, timeSeats);
        }
    }
    
    private List<String> generateStandardTheaterLayout() {
        List<String> seats = new ArrayList<>();
        char[] rows = {'A', 'B', 'C', 'D', 'E'};
        int seatsPerRow = 5;
        
        for (char row : rows) {
            for (int seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
                seats.add(row + String.valueOf(seatNum));
            }
        }
        
        return seats;
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
    public Map<String, List<String>> getSchedule() { return schedule; }
    public void setSchedule(Map<String, List<String>> schedule) { this.schedule = schedule; }
    
    public List<String> getAvailableSeats(String day, String showtime) {
        if (seatsBySchedule == null) {
            seatsBySchedule = new HashMap<>();
        }
        
        Map<String, List<String>> daySeats = seatsBySchedule.get(day);

        if (daySeats == null) {
            daySeats = new HashMap<>();
            seatsBySchedule.put(day, daySeats);
        }
        
        List<String> seats = daySeats.get(showtime);
        
        if (seats == null) {
            seats = generateStandardTheaterLayout();
            daySeats.put(showtime, seats);
        }
        
        return seats;
    }
    
    public void removeSeat(String day, String showtime, String seat) {
        List<String> seats = getAvailableSeats(day, showtime);
        seats.remove(seat);
    }
    
    public void addSeat(String day, String showtime, String seat) {
        List<String> seats = getAvailableSeats(day, showtime);
        if (!seats.contains(seat)) {
            seats.add(seat);
        }
    }
}