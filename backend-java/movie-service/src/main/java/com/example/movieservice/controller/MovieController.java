package com.example.movieservice.controller;

import com.example.movieservice.model.Movie;
import com.example.movieservice.repository.MovieRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@CrossOrigin(origins = "*")
public class MovieController {

    private final MovieRepository movieRepository;

    public MovieController(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @GetMapping("/movies")
    public List<Movie> list() {
        return movieRepository.findAll();
    }

    @GetMapping("/movies/{id}")
    public ResponseEntity<Movie> get(@PathVariable String id) {
        return movieRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
