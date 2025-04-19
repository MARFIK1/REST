package rsi.cinema.server;

import com.sun.net.httpserver.Filter;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import jakarta.xml.ws.Endpoint;
import java.io.IOException;
import java.net.InetSocketAddress;

public class CinemaPublisher {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(9999), 0);
        HttpContext ctx = server.createContext("/cinema/hello");
        ctx.getFilters().add(new Filter() {

            @Override public String description() {
                return "CORS";
            }

            @Override public void doFilter(HttpExchange ex, Chain chain) throws IOException {
                ex.getResponseHeaders().add("Access-Control-Allow-Origin",  "*");
                ex.getResponseHeaders().add("Access-Control-Allow-Methods", "POST,OPTIONS");
                ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type,SOAPAction");
                if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
                    ex.sendResponseHeaders(204, -1);
                    return;
                }
                chain.doFilter(ex);
            }

        });
        Endpoint.create(new CinemaServiceImpl()).publish(ctx);
        server.start();
        System.out.println("Service published");
    }
}
