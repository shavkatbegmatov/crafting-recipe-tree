package com.crafttree.service;

/**
 * Strategy for handling target-version recipes that already exist when copying a recipe sub-tree
 * from one game version to another.
 */
public enum ConflictPolicy {
    /** Leave existing target recipes untouched; only write items that have no recipe in the target version. */
    SKIP_EXISTING,

    /** Replace target recipes regardless of whether they exist. */
    OVERWRITE_ALL,

    /** Same as SKIP_EXISTING — kept as a distinct alias for clarity at the API surface. */
    FILL_GAPS_ONLY
}
