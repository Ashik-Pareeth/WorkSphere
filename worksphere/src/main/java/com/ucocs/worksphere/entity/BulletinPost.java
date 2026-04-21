package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.PostType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bulletin_posts")
@Getter
@Setter
@NoArgsConstructor
public class BulletinPost extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType type;

    @Column(name = "room_id")
    private String roomId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Employee author;

    @Column(name = "author_display_name", nullable = false)
    private String authorDisplayName;

    @Column(name = "is_anonymous", nullable = false)
    private boolean anonymous = false;

    @Column(name = "is_pinned", nullable = false)
    private boolean pinned = false;

    @Column(name = "is_edited", nullable = false)
    private boolean isEdited = false;
}
