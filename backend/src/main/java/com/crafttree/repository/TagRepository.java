package com.crafttree.repository;

import com.crafttree.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findAllByOrderBySortOrderAsc();
}
