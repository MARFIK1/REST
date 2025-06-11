package org.example.dtos;

public class LinkDto {
    public String rel;
    public String href;
    public String method;

    public LinkDto(String rel, String href, String method) {
        this.rel = rel;
        this.href = href;
        this.method = method;
    }
}