package com.crafttree;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class CraftTreeApplication {

    public static void main(String[] args) {
        SpringApplication.run(CraftTreeApplication.class, args);
    }
}
