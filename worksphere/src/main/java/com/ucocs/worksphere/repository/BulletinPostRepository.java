package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.BulletinPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

import java.util.List;
import com.ucocs.worksphere.enums.PostType;

@Repository
public interface BulletinPostRepository extends JpaRepository<BulletinPost, UUID> {
    Page<BulletinPost> findByTypeInOrderByPinnedDescCreatedAtDesc(List<PostType> types, Pageable pageable);
    
    Page<BulletinPost> findByTypeAndRoomIdOrderByCreatedAtDesc(PostType type, String roomId, Pageable pageable);
}
