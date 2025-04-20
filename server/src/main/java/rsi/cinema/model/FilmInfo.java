package rsi.cinema.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlType;
import java.util.List;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name="FilmInfo", propOrder={"title","director","actors","description","imageName"})
public class FilmInfo {
    private String title;
    private String director;
    @XmlElementWrapper(name="actors")
    @XmlElement(name="actor")
    private List<String> actors;
    private String description;
    private String imageName;
    public FilmInfo() {}
    public FilmInfo(String title, String director, List<String> actors, String description, String imageName) {
        this.title = title;
        this.director = director;
        this.actors = actors;
        this.description = description;
        this.imageName = imageName;
    }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDirector() { return director; }
    public void setDirector(String director) { this.director = director; }
    public List<String> getActors() { return actors; }
    public void setActors(List<String> actors) { this.actors = actors; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImageName() { return imageName; }
    public void setImageName(String imageName) { this.imageName = imageName; }
}