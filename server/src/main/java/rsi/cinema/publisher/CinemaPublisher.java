package rsi.cinema.publisher;

import rsi.cinema.service.CinemaServiceImpl;

import com.sun.net.httpserver.Filter;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import jakarta.xml.ws.Endpoint;
import jakarta.xml.ws.soap.SOAPBinding;
import java.io.IOException;
import java.net.InetSocketAddress;

public class CinemaPublisher {
    public static void main(String[] args) throws Exception {
        HttpServer http = HttpServer.create(new InetSocketAddress(9999), 0);
        HttpContext ctx = http.createContext("/cinema");
        ctx.getFilters().add(new Filter() {

            @Override
            public String description() {
                return "CORS";
            }

            @Override
            public void doFilter(HttpExchange ex, Chain chain) throws IOException {
                ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                ex.getResponseHeaders().add("Access-Control-Allow-Methods", "POST,OPTIONS");
                ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type,SOAPAction");
                if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
                    ex.sendResponseHeaders(204, -1);
                    return;
                }
                chain.doFilter(ex);
            }

        });

        Endpoint ep = Endpoint.create(SOAPBinding.SOAP11HTTP_MTOM_BINDING, new CinemaServiceImpl());
        ep.publish(ctx);
        HttpContext imgCtx = http.createContext("/cinema/images");

        imgCtx.setHandler(ex -> {
            String full = ex.getRequestURI().getPath();
            String name = full.substring("/cinema/images/".length());
            var in = CinemaPublisher.class.getResourceAsStream("/images/" + name);
            if (in == null) {
                ex.sendResponseHeaders(404, -1);
                return;
            }
            byte[] buf = in.readAllBytes();
            ex.getResponseHeaders().add("Content-Type", "image/jpeg");
            ex.sendResponseHeaders(200, buf.length);
            ex.getResponseBody().write(buf);
            ex.close();
        });

        http.start();
        System.out.println("Service published");
    }
}