package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.bulletin.AnnouncementRequest;
import com.ucocs.worksphere.dto.bulletin.BulletinPostDTO;
import com.ucocs.worksphere.dto.bulletin.ChatRequest;
import com.ucocs.worksphere.entity.BulletinPost;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.enums.PostType;
import com.ucocs.worksphere.repository.BulletinPostRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import com.ucocs.worksphere.exception.ResourceNotFoundException;
import java.util.UUID;
import java.util.List;

import java.util.Random;

@Service
@RequiredArgsConstructor
public class BulletinService {

    private final BulletinPostRepository repo;
    private final EmployeeRepository employeeRepo;
    private final NotificationService notificationService;

    // ── Announcement ─────────────────────────────────────────────────────────

    public BulletinPost createAnnouncement(Employee poster, AnnouncementRequest req) {
        if (!canAnnounce(poster)) {
            throw new AccessDeniedException("Not authorized to post announcements");
        }

        BulletinPost post = new BulletinPost();
        post.setType(PostType.ANNOUNCEMENT);
        post.setContent(req.content());
        post.setAuthor(poster);
        post.setAuthorDisplayName(poster.getFirstName() + " " + poster.getLastName());
        post.setAnonymous(false);
        post.setPinned(req.pinned());
        repo.save(post);

        notificationService.sendToAll(
                NotificationType.NEW_ANNOUNCEMENT,
                "📢 " + poster.getFirstName() + " " + poster.getLastName(),
                req.content(),
                post.getId(),
                "BULLETIN_POST"
        );

        return post;
    }

    public void togglePin(UUID postId, boolean pinned, Employee user) {
        if (!canAnnounce(user)) {
            throw new AccessDeniedException("Not authorized to modify announcements");
        }

        BulletinPost post = repo.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));

        if (post.getType() != PostType.ANNOUNCEMENT) {
            throw new IllegalArgumentException("Only announcements can be pinned/unpinned");
        }

        post.setPinned(pinned);
        repo.save(post);
    }

    // ── Chat ─────────────────────────────────────────────────────────────────

    public BulletinPost createChatMessage(Employee poster, ChatRequest req) {
        ensureAliasExists(poster);

        BulletinPost post = new BulletinPost();
        post.setType(PostType.CHAT);
        post.setContent(req.content());
        post.setAuthor(poster);
        post.setAnonymous(poster.isChatAnonymous());
        post.setAuthorDisplayName(
                poster.isChatAnonymous()
                        ? poster.getAnonymousAlias()
                        : (poster.getFirstName() + " " + poster.getLastName())
        );
        return repo.save(post);
    }

    // ── Anonymous preference ──────────────────────────────────────────────────

    public void setAnonymousPreference(Employee user, boolean anonymous) {
        user.setChatAnonymous(anonymous);
        ensureAliasExists(user);
        employeeRepo.save(user);
    }

    // ── Feed ─────────────────────────────────────────────────────────────────

    public Page<BulletinPostDTO> getFeed(Pageable pageable) {
        return repo.findByTypeInOrderByPinnedDescCreatedAtDesc(
                List.of(PostType.ANNOUNCEMENT, PostType.CHAT), pageable)
                .map(this::toDTO);
    }

    // ── Team Chat ────────────────────────────────────────────────────────────

    public BulletinPost createTeamChatMessage(Employee poster, ChatRequest req) {
        BulletinPost post = new BulletinPost();
        post.setType(PostType.TEAM_CHAT);
        post.setContent(req.content());
        post.setAuthor(poster);
        post.setAnonymous(false); // Team chat is not anonymous
        post.setAuthorDisplayName(poster.getFirstName() + " " + poster.getLastName());
        post.setRoomId(computeRoomId(poster));
        return repo.save(post);
    }

    public Page<BulletinPostDTO> getTeamFeed(Employee user, Pageable pageable) {
        return repo.findByTypeAndRoomIdOrderByCreatedAtDesc(
                        PostType.TEAM_CHAT, computeRoomId(user), pageable)
                .map(this::toDTO);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void ensureAliasExists(Employee user) {
        if (user.getAnonymousAlias() == null || user.getAnonymousAlias().isEmpty()) {
            user.setAnonymousAlias("anonymous_" + (1000 + new Random().nextInt(9000)));
            employeeRepo.save(user);
        }
    }

    private String computeRoomId(Employee user) {
        if (user.getManager() != null) {
            return user.getManager().getId().toString();
        }
        return user.getId().toString();
    }

    private boolean canAnnounce(Employee employee) {
        return employee.getRoles().stream().anyMatch(r -> {
            String roleName = r.getRoleName();
            return "ROLE_SUPER_ADMIN".equals(roleName) || "SUPER_ADMIN".equals(roleName) ||
                   "ROLE_HR".equals(roleName) || "HR".equals(roleName) ||
                   "ROLE_AUDITOR".equals(roleName) || "AUDITOR".equals(roleName);
        });
    }

    public BulletinPostDTO toDTO(BulletinPost p) {
        return new BulletinPostDTO(
                p.getId(),
                p.getType(),
                p.getContent(),
                p.getAuthorDisplayName(),
                p.isAnonymous(),
                p.isPinned(),
                p.getCreatedAt()
        );
    }
}
