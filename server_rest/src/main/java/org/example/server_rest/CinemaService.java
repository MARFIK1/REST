package org.example.server_rest;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.model.FilmInfo;
import org.example.model.Reservation;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

public class CinemaService {
    private final List<FilmInfo> films;
    private final List<Reservation> reservations = new ArrayList<>();

    public CinemaService() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream in = getClass().getResourceAsStream("/films.json")) {
            films = mapper.readValue(in, new TypeReference<List<FilmInfo>>() {});
        }
        loadReservationsFromFile();
    }

    private void loadReservationsFromFile() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String projectDir = System.getProperty("user.dir");
            File file = new File(projectDir, "data/reservations.json");
            if (file.exists() && file.length() > 0) {
                List<Reservation> loadedReservations = mapper.readValue(file, new TypeReference<List<Reservation>>() {});
                reservations.addAll(loadedReservations);
                System.out.println("Załadowano " + loadedReservations.size() + " rezerwacji z pliku.");
            } else {
                System.out.println("Plik reservations.json nie istnieje lub jest pusty.");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void saveReservationsToFile() {
        try {
            String projectDir = System.getProperty("user.dir");
            File resourceFile = new File(projectDir + "/data/reservations.json");
            ObjectMapper mapper = new ObjectMapper();
            mapper.writerWithDefaultPrettyPrinter().writeValue(resourceFile, reservations);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public List<FilmInfo> getFilmList() {
        return films;
    }

    public FilmInfo getFilmInfo(int id) {
        return films.get(id);
    }

    public byte[] getImage(String imageName) throws IOException {
        try (InputStream in = getClass().getResourceAsStream("/images/" + imageName)) {
            if (in == null) return null;
            return in.readAllBytes();
        }
    }

    public String makeReservation(int filmIndex, String day, String showtime, List<String> seats, String username) {
        if (filmIndex < 0 || filmIndex >= films.size()) {
            return "Invalid film index.";
        }
        FilmInfo film = films.get(filmIndex);
//        if (!film.getSchedule().containsKey(day)) {
//            return "Invalid day.";
//        }
//        if (!film.getSchedule().get(day).contains(showtime)) {
//            return "Invalid showtime for the selected day.";
//        }
        Map<String, List<String>> schedule = film.getSchedule();

        for (Map.Entry<String, List<String>> entry : schedule.entrySet()) {
            List<String> showtimes = entry.getValue();
            if (entry.getKey().equals(day) && entry.getValue().equals(showtimes)) {
                break;
            }
        }
        List<String> availableSeats = film.getAvailableSeats(day, showtime);
        if (availableSeats == null || availableSeats.isEmpty()) {
            return "No seats available for the selected showtime.";
        }
        for (String seat : seats) {
            if (!availableSeats.contains(seat)) {
                return "Seat " + seat + " is not available.";
            }
        }
        for (String seat : seats) {
            film.removeSeat(day, showtime, seat);
        }
        Reservation reservation = new Reservation(username, film.getTitle(), day, showtime, seats);
        reservations.add(reservation);
        saveReservationsToFile();
        return "Reservation successful for film: " + film.getTitle() + " on " + day + " at " + showtime + " for seats: " + String.join(", ", seats);
    }

    public List<Reservation> getUserReservations(String username) {
        return reservations.stream()
                .filter(reservation -> reservation.getUsername().equals(username))
                .collect(Collectors.toList());
    }

    public List<String> getOccupiedSeats(int filmIndex, String day, String showtime) {
        if (filmIndex < 0 || filmIndex >= films.size()) {
            throw new IllegalArgumentException("Invalid film index.");
        }
        FilmInfo film = films.get(filmIndex);
//        if (!film.getSchedule().containsKey(day)) {
//            throw new IllegalArgumentException("Invalid day.");
//        }
//        if (!film.getSchedule().get(day).contains(showtime)) {
//            throw new IllegalArgumentException("Invalid showtime for the selected day.");
//        }

        Map<String, List<String>> schedule = film.getSchedule();

        for (Map.Entry<String, List<String>> entry : schedule.entrySet()) {
            List<String> showtimes = entry.getValue();
            if (entry.getKey().equals(day) && entry.getValue().equals(showtimes)) {
                break;
            }
        }

        List<String> allSeats = new ArrayList<>();
        for (Reservation reservation : reservations) {
            System.out.println(reservation.getUsername()+ " " + reservation.getFilmTitle() + " " + reservation.getDay() + " " + reservation.getShowtime());
            System.out.println(film.getTitle() + " " + day + " " + showtime);
            if (reservation.getFilmTitle().equals(film.getTitle()) &&
                reservation.getDay().equals(day) &&
                reservation.getShowtime().equals(showtime)) {
                allSeats.addAll(reservation.getSeats());
            }
        }
        return allSeats;
    }
}