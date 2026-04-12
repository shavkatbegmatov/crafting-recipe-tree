package com.crafttree.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    @Builder.Default
    private boolean authenticated = false;
    private String token;
    private String username;
    private String role;
    private String errorCode;
}
