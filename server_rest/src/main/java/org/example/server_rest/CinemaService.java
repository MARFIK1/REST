package org.example.server_rest;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.example.dtos.ReservationRequestDto;
import org.example.model.FilmInfo;
import org.example.model.Reservation;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;

import java.util.List;

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

    public String cancelReservation(String username, int reservationIndex) {
        List<Reservation> userReservations = reservations.stream()
            .filter(r -> r.getUsername().equals(username))
            .toList();

        if (reservationIndex < 0 || reservationIndex >= userReservations.size()) {
            return "Invalid reservation index.";
        }

        Reservation toRemove = userReservations.get(reservationIndex);
        boolean removed = reservations.remove(toRemove);

        if (removed) {
            saveReservationsToFile();
            return "Reservation cancelled for film: " + toRemove.getFilmTitle() +
                " on " + toRemove.getDay() + " at " + toRemove.getShowtime() +
                " for seats: " + String.join(", ", toRemove.getSeats());
        } else {
            return "Reservation not found.";
        }
    }

    public String editReservation(String username, int reservationIndex, ReservationRequestDto req) {
        List<Reservation> userReservations = reservations.stream()
            .filter(r -> r.getUsername().equals(username))
            .toList();

        if (reservationIndex < 0 || reservationIndex >= userReservations.size()) {
            return "Invalid reservation index.";
        }

        Reservation oldReservation = userReservations.get(reservationIndex);

        FilmInfo film = films.stream()
            .filter(f -> f.getTitle().equals(oldReservation.getFilmTitle()))
            .findFirst().orElse(null);
        if (film != null) {
            for (String seat : oldReservation.getSeats()) {
                film.addSeat(oldReservation.getDay(), oldReservation.getShowtime(), seat);
            }
        }

        FilmInfo newFilm = films.get(req.filmIndex);
        List<String> availableSeats = newFilm.getAvailableSeats(req.day, req.showtime);
        for (String seat : req.seats) {
            if (!availableSeats.contains(seat)) {
                return "Seat " + seat + " is not available.";
            }
        }

        for (String seat : req.seats) {
            newFilm.removeSeat(req.day, req.showtime, seat);
        }

        oldReservation.setFilmTitle(newFilm.getTitle());
        oldReservation.setDay(req.day);
        oldReservation.setShowtime(req.showtime);
        oldReservation.setSeats(req.seats);

        saveReservationsToFile();
        return "Reservation updated successfully.";
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

    public byte[] generatePDF(int filmIndex, String day, String showtime, List<String> seats, String username) {
        try {
            FilmInfo film = getFilmInfo(filmIndex);
            if (film == null) return null;

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, baos);

            BaseFont baseFont = BaseFont.createFont("c:/windows/fonts/arial.ttf", BaseFont.CP1250, BaseFont.EMBEDDED);
            Font font = new Font(baseFont, 12, Font.NORMAL);

            document.open();
            PdfPTable table = new PdfPTable(2);
            table.addCell(new PdfPCell(new Phrase("Film Title:", font)));
            table.addCell(new PdfPCell(new Phrase(film.getTitle(), font)));
            table.addCell(new PdfPCell(new Phrase("Day:", font)));
            table.addCell(new PdfPCell(new Phrase(day, font)));
            table.addCell(new PdfPCell(new Phrase("Showtime:", font)));
            table.addCell(new PdfPCell(new Phrase(showtime, font)));
            table.addCell(new PdfPCell(new Phrase("Seats:", font)));
            table.addCell(new PdfPCell(new Phrase(String.join(", ", seats), font)));
            table.addCell(new PdfPCell(new Phrase("User:", font)));
            table.addCell(new PdfPCell(new Phrase(username, font)));
            table.addCell(new PdfPCell(new Phrase("Director:", font)));
            table.addCell(new PdfPCell(new Phrase(film.getDirector(), font)));
            table.addCell(new PdfPCell(new Phrase("Actors:", font)));
            table.addCell(new PdfPCell(new Phrase(String.join(", ", film.getActors()), font)));
            table.addCell(new PdfPCell(new Phrase("Description:", font)));
            table.addCell(new PdfPCell(new Phrase(film.getDescription(), font)));

            try {
                InputStream is = getClass().getClassLoader().getResourceAsStream("images/" + film.getImageName());
                if (is != null) {
                    byte[] imageBytes = is.readAllBytes();
                    Image image = Image.getInstance(imageBytes);
                    image.scaleToFit(500, 500);
                    PdfPCell cell = new PdfPCell(image);
                    cell.setColspan(2);
                    cell.setHorizontalAlignment(PdfPCell.ALIGN_CENTER);
                    table.addCell(cell);
                }
            } catch (Exception e) {
            }

            document.add(table);
            document.close();

            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}