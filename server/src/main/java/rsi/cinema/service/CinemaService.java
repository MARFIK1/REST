package rsi.cinema.service;

import jakarta.jws.HandlerChain;
import rsi.cinema.model.FilmInfo;
import rsi.cinema.model.Reservation;
import jakarta.jws.WebService;
import jakarta.jws.soap.SOAPBinding;
import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.activation.DataHandler;
import java.util.List;

@HandlerChain(file = "/handler-chain.xml")
@WebService
@SOAPBinding(style = SOAPBinding.Style.DOCUMENT, use = SOAPBinding.Use.LITERAL)
public interface CinemaService {
    @WebMethod
    List<FilmInfo> getFilmList();

    @WebMethod
    DataHandler downloadImage(@WebParam(name = "imageName") String imageName);

    @WebMethod
    String makeReservation(@WebParam(name = "filmIndex") int filmIndex, @WebParam(name = "day") String day, @WebParam(name = "showtime") String showtime, @WebParam(name = "seats") List<String> seats);

    @WebMethod
    String cancelReservation(@WebParam(name = "filmTitle") String filmTitle, @WebParam(name = "day") String day, @WebParam(name = "showtime") String showtime, @WebParam(name = "seats") List<String> seats);

    @WebMethod
    String registerUser(@WebParam(name = "username") String username, @WebParam(name = "password") String password);

    @WebMethod
    String loginUser(@WebParam(name = "username") String username, @WebParam(name = "password") String password);

    @WebMethod
    List<Reservation> getUserReservations(@WebParam(name = "authToken") String authToken);

    @WebMethod
    List<String> getOccupiedSeats(@WebParam(name = "filmIndex") int filmIndex, @WebParam(name = "day") String day, @WebParam(name = "showtime") String showtime);

    @WebMethod
    void generatePDF(@WebParam(name = "filmTitle") String filmTitle, @WebParam(name = "day") String day, @WebParam(name = "showtime") String showtime, @WebParam(name = "seats") List<String> seats);
}