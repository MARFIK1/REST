package rsi.cinema.publisher;

import rsi.cinema.service.CinemaServiceImpl;

import com.sun.net.httpserver.Filter;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpsConfigurator;
import com.sun.net.httpserver.HttpsServer;

import jakarta.xml.ws.Endpoint;
import jakarta.xml.ws.soap.SOAPBinding;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.security.KeyStore;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

public class CinemaPublisher {
    public static void main(String[] args) throws Exception {
        String keystorePath = "C:\\Users\\szymo\\OneDrive\\Dokumenty\\GitHub\\SOAP\\server\\cinema_keystore.jks";
        String keystorePassword = "changeit";
        KeyStore keyStore = KeyStore.getInstance("JKS");
        try (FileInputStream fis = new FileInputStream(keystorePath)) {
            keyStore.load(fis, keystorePassword.toCharArray());
        }
        
        KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        kmf.init(keyStore, keystorePassword.toCharArray());

        TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        tmf.init(keyStore);

        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);

        HttpsServer https = HttpsServer.create(new InetSocketAddress("0.0.0.0", 9999), 0);
        https.setHttpsConfigurator(new HttpsConfigurator(sslContext));
        https.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());


        // HttpServer http = HttpServer.create(new InetSocketAddress("0.0.0.0",9999), 0);
        HttpContext ctx = https.createContext("/cinema");
        ctx.getFilters().add(new Filter() {

            @Override
            public String description() {
                return "CORS";
            }

            @Override
            public void doFilter(HttpExchange ex, Chain chain) throws IOException {
                ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                ex.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
                ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, SOAPAction, X-Requested-With, Accept");
                ex.getResponseHeaders().add("Access-Control-Max-Age", "3600");

                if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
                    ex.sendResponseHeaders(204, -1);
                    return;
                }
                chain.doFilter(ex);
            }

        });

        Endpoint ep = Endpoint.create(SOAPBinding.SOAP11HTTP_MTOM_BINDING, new CinemaServiceImpl());
        ep.publish(ctx);
        HttpContext imgCtx = https.createContext("/cinema/images");

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

        https.start();
        System.out.println("Service published");
    }
}