package rsi.cinema.helpers;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class TokenValidator {
    private static final Map<String, String> validTokens = new HashMap<>(); // Mapowanie: username -> token
    private static final Map<String, String> userPasswords = new HashMap<>(); // Mapowanie: username -> password

    // Rejestracja użytkownika
    public static boolean registerUser(String username, String password) {
        if (userPasswords.containsKey(username)) {
            return false; // Użytkownik już istnieje
        }
        userPasswords.put(username, password);
        return true;
    }

    // Logowanie użytkownika i generowanie tokenu
    public static String loginUser(String username, String password) {
        if (!userPasswords.containsKey(username) || !userPasswords.get(username).equals(password)) {
            return null; // Nieprawidłowe dane logowania
        }
        String token = UUID.randomUUID().toString(); // Generowanie unikalnego tokenu
        validTokens.put(username, token); // Przechowywanie tokenu w mapie
        return token;
    }

    // Weryfikacja tokenu
    public static boolean isTokenValid(String token) {
        return validTokens.containsValue(token);
    }

    // Pobranie nazwy użytkownika na podstawie tokenu
    public static String getUsernameFromToken(String token) {
        return validTokens.entrySet()
                .stream()
                .filter(entry -> entry.getValue().equals(token))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);
    }
}