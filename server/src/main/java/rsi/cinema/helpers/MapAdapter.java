package rsi.cinema.helpers;

import jakarta.xml.bind.annotation.adapters.XmlAdapter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MapAdapter extends XmlAdapter<MapAdapter.AdaptedMap, Map<String, List<String>>> {

    public static class AdaptedMap {
        public List<Entry> entry = new ArrayList<>();
    }

    public static class Entry {
        public String key;
        public List<String> value;
    }

    @Override
    public Map<String, List<String>> unmarshal(AdaptedMap adaptedMap) throws Exception {
        Map<String, List<String>> map = new HashMap<>();
        for (Entry entry : adaptedMap.entry) {
            map.put(entry.key, entry.value);
        }
        return map;
    }

    @Override
    public AdaptedMap marshal(Map<String, List<String>> map) throws Exception {
        AdaptedMap adaptedMap = new AdaptedMap();
        for (Map.Entry<String, List<String>> entry : map.entrySet()) {
            Entry adaptedEntry = new Entry();
            adaptedEntry.key = entry.getKey();
            adaptedEntry.value = entry.getValue();
            adaptedMap.entry.add(adaptedEntry);
        }
        return adaptedMap;
    }
}