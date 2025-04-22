package rsi.cinema.service;

import rsi.cinema.helpers.TokenValidator;
import rsi.cinema.model.FilmInfo;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.jws.HandlerChain;
import jakarta.jws.WebService;
import jakarta.mail.internet.HeaderTokenizer.Token;
import jakarta.activation.DataHandler;
import jakarta.activation.FileDataSource;
import jakarta.xml.ws.soap.MTOM;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@MTOM
@HandlerChain(file = "/handler-chain.xml")
@WebService(endpointInterface = "rsi.cinema.service.CinemaService")
public class CinemaServiceImpl implements CinemaService {
    private final List<FilmInfo> films;
    private final Map<String, String> users = new HashMap<>();
    public CinemaServiceImpl() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream in = getClass().getResourceAsStream("/films.json")) {
            films = mapper.readValue(in, new TypeReference<List<FilmInfo>>() {});
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

        return "Reservation successful for film: " + film.getTitle() + " at " + showtime + " for seats: " + String.join(", ", seats);
    }

    @Override
    public String cancelReservation(int filmIndex, String showtime, List<String> seats) {
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
            if (availableSeats.contains(seat)) {
                return "Seat " + seat + " is not reserved.";
            }
        }
    
        for (String seat : seats) {
            availableSeats.add(seat);
        }
    
        return "Reservation cancelled for film: " + film.getTitle() + " at " + showtime + " for seats: " + String.join(", ", seats);
    }

    @Override
    public String registerUser(String username, String password) {
        boolean success = TokenValidator.registerUser(username, password);
        if (!success) {
            return "Username already exists.";
        }
        return "User registered successfully.";
    }

    @Override
    public String loginUser(String username, String password) {
        String token = TokenValidator.loginUser(username, password);
        if (token == null) {
            return "Invalid username or password.";
        }
        return token; // Zwracamy token, który klient zapisze i użyje do autoryzacji
    }
}