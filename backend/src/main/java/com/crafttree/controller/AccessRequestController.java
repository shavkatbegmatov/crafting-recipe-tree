package com.crafttree.controller;

import com.crafttree.dto.CreateAccessRequestRequest;
import com.crafttree.dto.MyAccessRequestDto;
import com.crafttree.entity.User;
import com.crafttree.service.AccessRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Foydalanuvchining o'z "admin huquqi" arizasini boshqarishi. Barcha endpointlar
 * autentifikatsiya talab qiladi (SecurityConfig'da {@code /api/access-requests/** → authenticated}).
 */
@RestController
@RequestMapping("/api/access-requests")
@RequiredArgsConstructor
@Tag(name = "Access Requests", description = "Admin huquqini so'rash (foydalanuvchi)")
public class AccessRequestController {

    private final AccessRequestService accessRequestService;

    @PostMapping
    @Operation(summary = "Admin huquqi uchun ariza yuborish")
    public MyAccessRequestDto create(@Valid @RequestBody(required = false) CreateAccessRequestRequest request,
                                     @AuthenticationPrincipal User actor) {
        String message = (request != null) ? request.message() : null;
        return accessRequestService.createRequest(actor, message);
    }

    @GetMapping("/me")
    @Operation(summary = "Mening eng so'nggi arizam holati (yo'q bo'lsa — 204)")
    public ResponseEntity<MyAccessRequestDto> myLatest(@AuthenticationPrincipal User actor) {
        MyAccessRequestDto dto = accessRequestService.getMyLatest(actor);
        return (dto != null) ? ResponseEntity.ok(dto) : ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "O'z arizamni bekor qilish")
    public MyAccessRequestDto cancel(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        return accessRequestService.cancelMyRequest(actor, id);
    }
}
