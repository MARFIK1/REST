package rsi.cinema.server;

import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.jws.WebService;

@WebService
public interface CinemaService {
    @WebMethod
    String getHello(@WebParam(name="name") String name);
}
