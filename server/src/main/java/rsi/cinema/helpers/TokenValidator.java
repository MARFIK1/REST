package rsi.cinema.helpers;

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
    private static final Map<String, String> validTokens = new HashMap<>(); // Mapowanie: username -> token
    private static final Map<String, String> userPasswords = new HashMap<>(); // Mapowanie: username -> password
    private static final String USERS_FILE = "/users.json";
    private static final ObjectMapper mapper = new ObjectMapper();
    private static String userFilePath;
    
    static {
        try {
            URL resourceUrl = TokenValidator.class.getResource(USERS_FILE);

            if (resourceUrl != null) {
                userFilePath = resourceUrl.getPath();
                System.out.println("Ścieżka do pliku users.json: " + userFilePath);                
                loadUsersFromFile();
                System.out.println("Inicjalizacja systemu użytkowników z: " + userFilePath);
            }
            else {
                System.err.println("Nie można znaleźć pliku users.json w zasobach!");
            }
        } catch (Exception e) {
            System.err.println("Błąd podczas inicjalizacji systemu użytkowników: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void loadUsersFromFile() {
        try {
            URL resourceUrl = TokenValidator.class.getResource(USERS_FILE);

            if (resourceUrl == null) {
                System.err.println("Nie można znaleźć pliku users.json!");
                return;
            }
            
            try (InputStream is = resourceUrl.openStream()) {
                if (is.available() > 0) {
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
                }
                else {
                    System.out.println("Plik użytkowników jest pusty.");
                }
            }
        } catch (IOException e) {
            System.err.println("Błąd podczas ładowania użytkowników z pliku: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static void saveUsersToFile() {
        try {
            String projectDir = System.getProperty("user.dir");
            File resourceFile = new File(projectDir + "/src/main/resources" + USERS_FILE);

            if (resourceFile.exists() && resourceFile.canWrite()) {
                List<Map<String, String>> users = new ArrayList<>();
                
                for (Map.Entry<String, String> entry : userPasswords.entrySet()) {
                    Map<String, String> user = new LinkedHashMap<>();
                    user.put("username", entry.getKey());
                    user.put("password", entry.getValue());                    
                    users.add(user);
                }
                
                ObjectMapper mapper = new ObjectMapper();
                mapper.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, false);
                mapper.writerWithDefaultPrettyPrinter().writeValue(resourceFile, users);
                System.out.println("Zapisano " + users.size() + " użytkowników do pliku: " + resourceFile.getAbsolutePath());
            }
            else {
                System.err.println("Nie można zapisać do pliku users.json. Używanie tylko pamięci.");
                System.err.println("Ścieżka: " + resourceFile.getAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println("Błąd podczas zapisywania użytkowników do pliku: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Rejestracja użytkownika
    public static boolean registerUser(String username, String password) {
        if (username == null || password == null || username.trim().isEmpty() || password.trim().isEmpty()) {
            System.out.println("Próba rejestracji z pustym username lub password");
            return false;
        }
        
        if (userPasswords.containsKey(username)) {
            System.out.println("Próba rejestracji istniejącego użytkownika: " + username);
            return false; // Użytkownik już istnieje
        }
        
        userPasswords.put(username, password);
        System.out.println("Zarejestrowano użytkownika: " + username);
        saveUsersToFile();
        return true;
    }

    // Logowanie użytkownika i generowanie tokenu
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

    // Weryfikacja tokenu
    public static boolean isTokenValid(String token) {
        boolean isValid = validTokens.containsValue(token);
        if (!isValid) {
            System.out.println("Próba użycia nieprawidłowego tokenu: " + token);
        }
        return isValid;
    }

    // Pobranie nazwy użytkownika na podstawie tokenu
    public static String getUsernameFromToken(String token) {
        for (Map.Entry<String, String> entry : validTokens.entrySet()) {
            if (entry.getValue().equals(token)) {
                return entry.getKey();
            }
        }
        return null;
    }
}