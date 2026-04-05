package com.crafttree.exception;

public class ItemNotFoundException extends RuntimeException {

    public ItemNotFoundException(Long id) {
        super("Craft item not found with id: " + id);
    }
}
