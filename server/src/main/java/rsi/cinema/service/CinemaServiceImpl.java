package rsi.cinema.service;

import rsi.cinema.helpers.TokenValidator;
import rsi.cinema.model.FilmInfo;
import rsi.cinema.model.Reservation;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.text.Document;
import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;

import jakarta.jws.HandlerChain;
import jakarta.jws.WebService;
import jakarta.activation.DataHandler;
import jakarta.activation.FileDataSource;
import jakarta.annotation.Resource;
import jakarta.xml.ws.WebServiceContext;
import jakarta.xml.ws.soap.MTOM;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@MTOM
@HandlerChain(file = "/handler-chain.xml")
@WebService(endpointInterface = "rsi.cinema.service.CinemaService")
public class CinemaServiceImpl implements CinemaService {
    private final List<FilmInfo> films;
    private final List<Reservation> reservations = new ArrayList<>();

    @Resource
    private WebServiceContext wsContext;

    public CinemaServiceImpl() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream in = getClass().getResourceAsStream("/films.json")) {
            films = mapper.readValue(in, new TypeReference<List<FilmInfo>>() {});
        }
        loadReservationsFromFile();
    }

    private void loadReservationsFromFile() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream in = getClass().getResourceAsStream("/reservations.json");
            if (in != null && in.available() > 0) {
                List<Reservation> loadedReservations = mapper.readValue(in, new TypeReference<List<Reservation>>() {});
                reservations.addAll(loadedReservations);
                System.out.println("Załadowano " + reservations.size() + " rezerwacji z pliku.");
            } else {
                System.out.println("Plik reservations.json jest pusty lub nie istnieje.");
            }
        } catch (IOException e) {
            System.err.println("Błąd podczas ładowania rezerwacji z pliku: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void saveReservationsToFile() {
        try {
            String projectDir = System.getProperty("user.dir");
            File resourceFile = new File(projectDir + "/src/main/resources/reservations.json");

            ObjectMapper mapper = new ObjectMapper();
            mapper.writerWithDefaultPrettyPrinter().writeValue(resourceFile, reservations);
            System.out.println("Zapisano " + reservations.size() + " rezerwacji do pliku: " + resourceFile.getAbsolutePath());
        } catch (IOException e) {
            System.err.println("Błąd podczas zapisywania rezerwacji do pliku: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public List<FilmInfo> getFilmList() {
        return films;
    }

    @Override
    public DataHandler downloadImage(String imageName) {
        String path = getClass().getResource("/images/" + imageName).getFile();
        FileDataSource ds = new FileDataSource(path);
        return new DataHandler(ds);
    }

    @Override
    public String makeReservation(int filmIndex, String showtime, List<String> seats) {
        if (filmIndex < 0 || filmIndex >= films.size()) {
            return "Invalid film index.";
        }

        FilmInfo film = films.get(filmIndex);

        if (!film.getShowtimes().contains(showtime)) {
            return "Invalid showtime.";
        }

        List<String> availableSeats = film.getSeatsByShowtime().get(showtime);
        if (availableSeats == null) {
            return "No seat information available for the selected showtime.";
        }

        for (String seat : seats) {
            if (!availableSeats.contains(seat)) {
                return "Seat " + seat + " is not available.";
            }
        }

        for (String seat : seats) {
            availableSeats.remove(seat);
        }

        String username = TokenValidator.getUsernameFromToken(wsContext.getMessageContext().get("authToken").toString());
        if (username == null) {
            return "Invalid token. Please log in again.";
        }

        Reservation reservation = new Reservation(username, film.getTitle(), showtime, seats);
        reservations.add(reservation);

        saveReservationsToFile();

        return "Reservation successful for film: " + film.getTitle() + " at " + showtime + " for seats: " + String.join(", ", seats);
    }

    @Override
    public String cancelReservation(String filmTitle, String showtime, List<String> seats) {
        FilmInfo film = films.stream()
                .filter(f -> f.getTitle().equals(filmTitle))
                .findFirst()
                .orElse(null);

        if (film == null) {
            return "Invalid film title.";
        }

        if (!film.getShowtimes().contains(showtime)) {
            return "Invalid showtime.";
        }

        List<String> availableSeats = film.getSeatsByShowtime().get(showtime);
        if (availableSeats == null) {
            return "No seat information available for the selected showtime.";
        }

        for (String seat : seats) {
            if (!availableSeats.contains(seat)) {
                availableSeats.add(seat);
            }
        }

        boolean removed = reservations.removeIf(reservation ->
                reservation.getFilmTitle().equals(film.getTitle()) &&
                reservation.getShowtime().equals(showtime) &&
                reservation.getSeats().containsAll(seats)
        );

        if (removed) {
            saveReservationsToFile();
            return "Reservation cancelled for film: " + film.getTitle() + " at " + showtime + " for seats: " + String.join(", ", seats);
        } else {
            return "Reservation not found.";
        }
    }

    @Override
    public String registerUser(String username, String password) {
        boolean success = TokenValidator.registerUser(username, password);
        if (!success) {
            return "Username already exists.";
        }
        System.out.println("Zarejestrowano użytkownika: " + username);
        return "User registered successfully.";
    }

    @Override
    public String loginUser(String username, String password) {
        String token = TokenValidator.loginUser(username, password);
        if (token == null) {
            return "Invalid username or password.";
        }
        return token;
    }

    @Override
    public List<Reservation> getUserReservations(String authToken) {
        String username = TokenValidator.getUsernameFromToken(authToken);
        if (username == null) {
            System.out.println("Invalid token: " + authToken);
            throw new RuntimeException("Invalid token");
        }

        System.out.println("Fetching reservations for user: " + username);
        List<Reservation> userReservations = reservations.stream()
                .filter(reservation -> reservation.getUsername().equals(username))
                .collect(Collectors.toList());

        System.out.println("Found " + userReservations.size() + " reservations for user: " + username);
        return userReservations;
    }

    @Override
    public List<String> getOccupiedSeats(int filmIndex, String showtime) {
        if (filmIndex < 0 || filmIndex >= films.size()) {
            throw new IllegalArgumentException("Invalid film index.");
        }

        FilmInfo film = films.get(filmIndex);

        if (!film.getShowtimes().contains(showtime)) {
            throw new IllegalArgumentException("Invalid showtime.");
        }

        List<String> allSeats = new ArrayList<>();
        for(Reservation reservation : reservations) {
            if (reservation.getFilmTitle().equals(film.getTitle()) && reservation.getShowtime().equals(showtime)) {
                allSeats.addAll(reservation.getSeats());
            }
        }
        return allSeats;
    }

    @Override
    public void generatePDF(String filmTitle, String showtime, List<String> seats) {
        try {
            Document document = new Document();
            PdfWriter.getInstance(document, new FileOutputStream("Reservation_" + filmTitle.replaceAll("[ :]", "_") + "_" + showtime.replaceAll(":", "_") + "_Confirmation.pdf"));
            BaseFont baseFont = BaseFont.createFont("c:/windows/fonts/arial.ttf", BaseFont.CP1250, BaseFont.EMBEDDED);
            Font font = new Font(baseFont, 12, Font.NORMAL);
            document.open();
            PdfPTable table = new PdfPTable(2);
            table.addCell(new PdfPCell(new Phrase("Film Title:", font)));
            table.addCell(new PdfPCell(new Phrase(filmTitle, font)));
            table.addCell(new PdfPCell(new Phrase("Showtime:", font)));
            table.addCell(new PdfPCell(new Phrase(showtime, font)));
            table.addCell(new PdfPCell(new Phrase("Seats:", font)));
            table.addCell(new PdfPCell(new Phrase(String.join(", ", seats), font)));
            films.stream()
                .filter(film -> film.getTitle().equals(filmTitle))
                .findFirst()
                .ifPresent(film -> {
                    try {
                        table.addCell(new PdfPCell(new Phrase("Director:", font)));
                        table.addCell(new PdfPCell(new Phrase(film.getDirector(), font)));
                        table.addCell(new PdfPCell(new Phrase("Actors:", font)));
                        table.addCell(new PdfPCell(new Phrase(String.join(", ", film.getActors()), font)));
                        table.addCell(new PdfPCell(new Phrase("Description:", font)));
                        table.addCell(new PdfPCell(new Phrase(film.getDescription(), font)));
                        Image image = Image.getInstance(getClass().getResource("/images/" + film.getImageName()));
                        image.scaleToFit(500, 500);
                        PdfPCell cell = new PdfPCell(image);
                        cell.setColspan(2);
                        cell.setHorizontalAlignment(PdfPCell.ALIGN_CENTER);
                        table.addCell(cell);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            document.add(table);
            document.close();   
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("Generating PDF for film: " + filmTitle + ", showtime: " + showtime + ", seats: " + String.join(", ", seats));
    }
}