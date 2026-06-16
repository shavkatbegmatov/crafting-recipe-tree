package com.crafttree.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ItemNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleItemNotFound(ItemNotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
    }

    /** Biznes qoidasi buzilgani (masalan, noto'g'ri rol qiymati) — 400. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return body(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    /** Holatga bog'liq cheklov (masalan, oxirgi super-adminni o'chirish) — 409. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return body(HttpStatus.CONFLICT, "Conflict", ex.getMessage());
    }

    /** Ruxsat yetarli emas (imtiyoz chegarasi) — 403. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return body(HttpStatus.FORBIDDEN, "Forbidden", ex.getMessage());
    }

    /** @Valid validatsiyasi muvaffaqiyatsiz — birinchi xato xabarini qaytaramiz. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldError() != null
                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                : "Validation failed";
        return body(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        // Kutilmagan xatolarni serverda to'liq log qilamiz (keyinchalik tahlil uchun), lekin
        // tafsilotni mijozga oshkor qilmaymiz.
        log.error("Unhandled exception", ex);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Unexpected error");
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String error, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", error,
                "message", message != null ? message : error
        ));
    }
}
