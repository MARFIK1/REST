package rsi.cinema.service;

import rsi.cinema.model.FilmInfo;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.jws.WebService;
import jakarta.activation.DataHandler;
import jakarta.activation.FileDataSource;
import jakarta.xml.ws.soap.MTOM;
import java.io.InputStream;
import java.util.List;

@MTOM
@WebService(endpointInterface = "rsi.cinema.service.CinemaService")
public class CinemaServiceImpl implements CinemaService {
    private final List<FilmInfo> films;
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
}