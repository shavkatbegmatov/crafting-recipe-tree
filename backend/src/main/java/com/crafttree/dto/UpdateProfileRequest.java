package com.crafttree.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(max = 50, message = "Display name max 50 characters")
    private String displayName;

    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String newPassword;

    /** Required when changing password */
    private String currentPassword;
}
