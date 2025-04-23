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

        if (!isOutbound) {
            try {
                SOAPMessage message = context.getMessage();
                SOAPHeader header = message.getSOAPHeader();

                QName operationQName = (QName) context.get(MessageContext.WSDL_OPERATION);
                String methodName = operationQName.getLocalPart();
                if ("registerUser".equals(methodName) || "loginUser".equals(methodName) || "getFilmList".equals(methodName)) {
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

                    if (!TokenValidator.isTokenValid(token)) {
                        throw new RuntimeException("Invalid token");
                    }
                    System.out.println("Authenticated user: " + TokenValidator.getUsernameFromToken(token));

                    context.put("authToken", token);
                    context.setScope("authToken", MessageContext.Scope.APPLICATION);
            
                } else {
                    throw new RuntimeException("Missing Authorization token");
                }
            } catch (Exception e) {
                throw new RuntimeException("Error processing SOAP headers: " + e.getMessage());
            }
        }

        return true;
    }

    @Override
    public boolean handleFault(SOAPMessageContext context) {
        System.err.println("SOAP Fault occurred:");
        try {
            SOAPMessage message = context.getMessage();
            message.writeTo(System.err);
            System.err.println();
        } catch (Exception e) {
            System.err.println("Error logging SOAP fault: " + e.getMessage());
        }
        return true;
    }

    @Override
    public void close(MessageContext context) {
    }

    @Override
    public Set<QName> getHeaders() {
        return null;
    }
}