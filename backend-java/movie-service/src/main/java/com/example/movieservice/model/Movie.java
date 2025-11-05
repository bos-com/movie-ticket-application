package com.example.movieservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document("movies")
public class Movie {
    @Id
    private String id;
    private String title;
    private String poster;
    private Integer totalSeats;
    private List<Integer> bookedSeats;
    private String showTime;
    private String genre;
    private String duration;
    private Double price;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPoster() { return poster; }
    public void setPoster(String poster) { this.poster = poster; }

    public Integer getTotalSeats() { return totalSeats; }
    public void setTotalSeats(Integer totalSeats) { this.totalSeats = totalSeats; }

    public List<Integer> getBookedSeats() { return bookedSeats; }
    public void setBookedSeats(List<Integer> bookedSeats) { this.bookedSeats = bookedSeats; }

    public String getShowTime() { return showTime; }
    public void setShowTime(String showTime) { this.showTime = showTime; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}
