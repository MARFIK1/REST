package rsi.cinema.handlers;

import jakarta.xml.ws.handler.MessageContext;
import jakarta.xml.ws.handler.soap.SOAPHandler;
import jakarta.xml.ws.handler.soap.SOAPMessageContext;
import rsi.cinema.helpers.TokenValidator;
import jakarta.xml.soap.SOAPElement;
import jakarta.xml.soap.SOAPHeader;
import jakarta.xml.soap.SOAPMessage;

import javax.xml.namespace.QName;
import java.util.Iterator;
import java.util.Set;

public class LoggingHandler implements SOAPHandler<SOAPMessageContext> {

    @Override
    public boolean handleMessage(SOAPMessageContext context) {
        Boolean isOutbound = (Boolean) context.get(MessageContext.MESSAGE_OUTBOUND_PROPERTY);

        if (!isOutbound) { // Inbound message
            try {
                SOAPMessage message = context.getMessage();
                SOAPHeader header = message.getSOAPHeader();

                // Pobierz nazwę metody z kontekstu SOAP
                QName operationQName = (QName) context.get(MessageContext.WSDL_OPERATION);
                String methodName = operationQName.getLocalPart(); // Pobierz nazwę metody jako String
                if ("registerUser".equals(methodName) || "loginUser".equals(methodName) || "getFilmList".equals(methodName)) {
                    // Pomijamy weryfikację tokenu dla tych metod
                    // System.out.println("Skipping token validation for method: " + methodName);
                    return true;
                }

                if (header == null) {
                    throw new RuntimeException("Missing SOAP header");
                }

                QName authQName = new QName("http://service.cinema.rsi/auth", "Authorization");
                Iterator<?> headerElements = header.getChildElements(authQName);

                if (headerElements.hasNext()) {
                    SOAPElement element = (SOAPElement) headerElements.next();
                    String token = element.getValue();
                    System.out.println("Authorization token: " + token);

                    // Walidacja tokenu
                    if (!TokenValidator.isTokenValid(token)) {
                        throw new RuntimeException("Invalid token");
                    }
                    System.out.println("Authenticated user: " + TokenValidator.getUsernameFromToken(token));
                } else {
                    throw new RuntimeException("Missing Authorization token");
                }
            } catch (Exception e) {
                throw new RuntimeException("Error processing SOAP headers: " + e.getMessage());
            }
        }

        return true; // Continue processing the message
    }

    @Override
    public boolean handleFault(SOAPMessageContext context) {
        System.err.println("SOAP Fault occurred:");
        try {
            SOAPMessage message = context.getMessage();
            message.writeTo(System.err); // Log the fault message
            System.err.println();
        } catch (Exception e) {
            System.err.println("Error logging SOAP fault: " + e.getMessage());
        }
        return true; // Continue processing the fault
    }

    @Override
    public void close(MessageContext context) {
        // No cleanup necessary
    }

    @Override
    public Set<QName> getHeaders() {
        return null; // No specific headers to process
    }
}