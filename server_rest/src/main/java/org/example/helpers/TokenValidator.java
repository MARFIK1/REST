package org.example.helpers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.*;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.LinkedHashMap;

public class TokenValidator {
    private static final Map<String, String> validTokens = new HashMap<>();
    private static final Map<String, String> userPasswords = new HashMap<>();
    private static final String USERS_FILE = "data/users.json";
    private static final ObjectMapper mapper = new ObjectMapper();

    static {
        loadUsersFromFile();
    }

    private static void loadUsersFromFile() {
        File file = new File(USERS_FILE);
        if (!file.exists()) {
            System.out.println("Plik users.json nie istnieje, brak użytkowników do wczytania.");
            return;
        }
        try (InputStream is = new FileInputStream(file)) {
            List<Map<String, String>> users = mapper.readValue(is, new TypeReference<List<Map<String, String>>>() {});
            if (users != null) {
                for (Map<String, String> user : users) {
                    String username = user.get("username");
                    String password = user.get("password");
                    if (username != null && password != null) {
                        userPasswords.put(username, password);
                    }
                }
                System.out.println("Załadowano " + userPasswords.size() + " użytkowników.");
            }
        } catch (IOException e) {
            System.err.println("Błąd podczas ładowania użytkowników z pliku: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void saveUsersToFile() {
        File file = new File(USERS_FILE);
        file.getParentFile().mkdirs();
        try {
            List<Map<String, String>> users = new ArrayList<>();
            for (Map.Entry<String, String> entry : userPasswords.entrySet()) {
                Map<String, String> user = new LinkedHashMap<>();
                user.put("username", entry.getKey());
                user.put("password", entry.getValue());
                users.add(user);
            }
            mapper.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, false);
            mapper.writerWithDefaultPrettyPrinter().writeValue(file, users);
            System.out.println("Zapisano " + users.size() + " użytkowników do pliku: " + file.getAbsolutePath());
        } catch (IOException e) {
            System.err.println("Błąd podczas zapisywania użytkowników do pliku: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static boolean registerUser(String username, String password) {
        if (username == null || password == null || username.trim().isEmpty() || password.trim().isEmpty()) {
            System.out.println("Próba rejestracji z pustym username lub password");
            return false;
        }

        if (userPasswords.containsKey(username)) {
            System.out.println("Próba rejestracji istniejącego użytkownika: " + username);
            return false;
        }

        userPasswords.put(username, password);
        System.out.println("Zarejestrowano użytkownika: " + username);
        saveUsersToFile();
        return true;
    }

    public static String loginUser(String username, String password) {
        if (username == null || password == null) {
            System.out.println("Próba logowania z pustym username lub password");
            return null;
        }

        if (!userPasswords.containsKey(username)) {
            System.out.println("Próba logowania nieistniejącego użytkownika: " + username);
            return null;
        }

        if (!userPasswords.get(username).equals(password)) {
            System.out.println("Nieprawidłowe hasło dla użytkownika: " + username);
            return null;
        }

        String token = UUID.randomUUID().toString();
        validTokens.put(username, token);
        System.out.println("Zalogowano użytkownika: " + username + " z tokenem: " + token);
        return token;
    }

    public static boolean isTokenValid(String token) {
        boolean isValid = validTokens.containsValue(token);
        if (!isValid) {
            System.out.println("Próba użycia nieprawidłowego tokenu: " + token);
        }
        return isValid;
    }

    public static String getUsernameFromToken(String token) {
        for (Map.Entry<String, String> entry : validTokens.entrySet()) {
            if (entry.getValue().equals(token)) {
                return entry.getKey();
            }
        }
        return null;
    }
}