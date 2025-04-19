package rsi.cinema.server;

import jakarta.jws.WebService;

@WebService(endpointInterface = "rsi.cinema.server.CinemaService")
public class CinemaServiceImpl implements CinemaService {
    @Override
    public String getHello(String name) {
        return "Witaj w kinie, " + name + "!";
    }
}
