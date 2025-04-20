package rsi.cinema.service;

import rsi.cinema.model.FilmInfo;

import jakarta.jws.WebService;
import jakarta.jws.soap.SOAPBinding;
import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.activation.DataHandler;
import java.util.List;

@WebService
@SOAPBinding(style = SOAPBinding.Style.DOCUMENT, use = SOAPBinding.Use.LITERAL)
public interface CinemaService {
    @WebMethod
    List<FilmInfo> getFilmList();

    @WebMethod
    DataHandler downloadImage(@WebParam(name="imageName") String imageName);
}