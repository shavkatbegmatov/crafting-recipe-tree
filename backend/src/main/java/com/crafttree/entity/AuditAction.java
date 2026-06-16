package com.crafttree.entity;

/**
 * Audit jurnalidagi amal turlari. DB'da {@code audit_logs.action} ustunida matn sifatida saqlanadi.
 * Erkin kengaytiriladi — yangi amal qo'shish uchun shu yerga konstanta qo'shing.
 */
public final class AuditAction {

    public static final String CREATE = "CREATE";
    public static final String UPDATE = "UPDATE";
    public static final String DELETE = "DELETE";
    public static final String ROLE_CHANGE = "ROLE_CHANGE";
    public static final String STATUS_CHANGE = "STATUS_CHANGE";
    public static final String PASSWORD_RESET = "PASSWORD_RESET";
    public static final String APPROVE = "APPROVE";
    public static final String REJECT = "REJECT";
    public static final String SET_CURRENT = "SET_CURRENT";

    private AuditAction() {
    }
}
