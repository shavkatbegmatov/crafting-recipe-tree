package com.crafttree.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private String username;
    private String displayName;
    private String role;
    private String referralCode;
    private int referralCount;
    private LocalDateTime createdAt;
}
