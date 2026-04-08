# Bulletin Board — Implementation Blueprint

Stack: Spring Boot · React + Vite · shadcn/ui · Tailwind CSS

---

## Phase 1 — Database & Entity

### 1.1 Migrate the `users` table

Add two columns to your existing `users` table. Do **not** create a new table.

```sql
ALTER TABLE users
  ADD COLUMN anonymous_alias VARCHAR(30) NULL,
  ADD COLUMN chat_anonymous  BOOLEAN NOT NULL DEFAULT false;
```

### 1.2 Create the `bulletin_posts` table

```sql
CREATE TABLE bulletin_posts (
  id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
  type                ENUM('ANNOUNCEMENT', 'CHAT') NOT NULL,
  content             TEXT NOT NULL,
  author_id           BIGINT NOT NULL REFERENCES users(id),
  author_display_name VARCHAR(60) NOT NULL,
  is_anonymous        BOOLEAN NOT NULL DEFAULT false,
  is_pinned           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 Add `PostType` enum (Java)

```java
public enum PostType {
    ANNOUNCEMENT,
    CHAT
}
```

### 1.4 Create the `BulletinPost` entity

```java
@Entity
@Table(name = "bulletin_posts")
@Getter @Setter @NoArgsConstructor
public class BulletinPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType type;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "author_display_name", nullable = false)
    private String authorDisplayName;

    @Column(name = "is_anonymous", nullable = false)
    private boolean anonymous = false;

    @Column(name = "is_pinned", nullable = false)
    private boolean pinned = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

### 1.5 Update the `User` entity

Add these two fields to your existing `User` class:

```java
@Column(name = "anonymous_alias")
private String anonymousAlias;

@Column(name = "chat_anonymous", nullable = false)
private boolean chatAnonymous = false;
```

---

## Phase 2 — Repository & DTOs

### 2.1 Repository

```java
public interface BulletinPostRepository extends JpaRepository<BulletinPost, Long> {

    @Query("SELECT b FROM BulletinPost b ORDER BY b.pinned DESC, b.createdAt DESC")
    Page<BulletinPost> findAllOrderByPinnedDescCreatedAtDesc(Pageable pageable);
}
```

### 2.2 Request DTOs

```java
// For SUPER_ADMIN, HR, AUDITOR only
public record AnnouncementRequest(
    @NotBlank String content,
    boolean pinned
) {}

// For all roles
public record ChatRequest(
    @NotBlank String content
) {}
```

### 2.3 Response DTO

```java
public record BulletinPostDTO(
    Long id,
    PostType type,
    String content,
    String authorDisplayName,   // already resolved — never leaks real name if anonymous
    boolean anonymous,
    boolean pinned,
    LocalDateTime createdAt
) {}
```

---

## Phase 3 — Service Layer

```java
@Service
@RequiredArgsConstructor
public class BulletinService {

    private final BulletinPostRepository repo;
    private final UserRepository userRepo;
    private final NotificationService notificationService; // your existing service

    // ── Announcement ─────────────────────────────────────────────────────────

    public BulletinPost createAnnouncement(User poster, AnnouncementRequest req) {
        if (!canAnnounce(poster.getRole())) {
            throw new AccessDeniedException("Not authorized to post announcements");
        }

        BulletinPost post = new BulletinPost();
        post.setType(PostType.ANNOUNCEMENT);
        post.setContent(req.content());
        post.setAuthor(poster);
        post.setAuthorDisplayName(poster.getFullName()); // always real name
        post.setAnonymous(false);
        post.setPinned(req.pinned());
        repo.save(post);

        // Call your existing NotificationService here
        notificationService.sendToAll(
            "📢 " + poster.getFullName(),
            req.content()
        );

        return post;
    }

    // ── Chat ─────────────────────────────────────────────────────────────────

    public BulletinPost createChatMessage(User poster, ChatRequest req) {
        ensureAliasExists(poster);

        BulletinPost post = new BulletinPost();
        post.setType(PostType.CHAT);
        post.setContent(req.content());
        post.setAuthor(poster);
        post.setAnonymous(poster.isChatAnonymous());
        post.setAuthorDisplayName(
            poster.isChatAnonymous()
                ? poster.getAnonymousAlias()
                : poster.getFullName()
        );
        return repo.save(post);
    }

    // ── Anonymous preference ──────────────────────────────────────────────────

    public void setAnonymousPreference(User user, boolean anonymous) {
        user.setChatAnonymous(anonymous);
        ensureAliasExists(user);
        userRepo.save(user);
    }

    // ── Feed ─────────────────────────────────────────────────────────────────

    public Page<BulletinPostDTO> getFeed(Pageable pageable) {
        return repo.findAllOrderByPinnedDescCreatedAtDesc(pageable)
                   .map(this::toDTO);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void ensureAliasExists(User user) {
        if (user.getAnonymousAlias() == null) {
            user.setAnonymousAlias("anonymous_" + (1000 + new Random().nextInt(9000)));
            userRepo.save(user);
        }
    }

    private boolean canAnnounce(Role role) {
        return role == Role.SUPER_ADMIN
            || role == Role.HR
            || role == Role.AUDITOR;
    }

    private BulletinPostDTO toDTO(BulletinPost p) {
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
```

---

## Phase 4 — Controller

```java
@RestController
@RequestMapping("/api/bulletin")
@RequiredArgsConstructor
public class BulletinController {

    private final BulletinService bulletinService;

    // POST /api/bulletin/announce
    @PostMapping("/announce")
    public ResponseEntity<BulletinPostDTO> announce(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody AnnouncementRequest req
    ) {
        return ResponseEntity.ok(bulletinService.createAnnouncement(user, req));
    }

    // POST /api/bulletin/chat
    @PostMapping("/chat")
    public ResponseEntity<BulletinPostDTO> chat(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody ChatRequest req
    ) {
        return ResponseEntity.ok(bulletinService.createChatMessage(user, req));
    }

    // PATCH /api/bulletin/me/anonymous?enabled=true
    @PatchMapping("/me/anonymous")
    public ResponseEntity<Void> setAnonymous(
        @AuthenticationPrincipal User user,
        @RequestParam boolean enabled
    ) {
        bulletinService.setAnonymousPreference(user, enabled);
        return ResponseEntity.ok().build();
    }

    // GET /api/bulletin/feed?page=0&size=20
    @GetMapping("/feed")
    public ResponseEntity<Page<BulletinPostDTO>> getFeed(
        @AuthenticationPrincipal User user,
        Pageable pageable
    ) {
        return ResponseEntity.ok(bulletinService.getFeed(pageable));
    }
}
```

---

## Phase 5 — Frontend

### 5.1 API service (`src/api/bulletin.js`)

```js
import axios from "@/lib/axios";

export const getAnnouncements = (page = 0) =>
  axios.get(`/api/bulletin/feed?page=${page}&size=20`);

export const postAnnouncement = (content, pinned = false) =>
  axios.post("/api/bulletin/announce", { content, pinned });

export const postChat = (content) =>
  axios.post("/api/bulletin/chat", { content });

export const setAnonymous = (enabled) =>
  axios.patch(`/api/bulletin/me/anonymous?enabled=${enabled}`);
```

### 5.2 Component tree

```
BulletinPage
├── AnnounceBanner          ← sticky strip, shows latest pinned post
├── PostComposer
│   ├── AnnouncementForm    ← visible only to SUPER_ADMIN / HR / AUDITOR
│   └── ChatInput           ← visible to all roles
├── FeedList
│   ├── AnnouncementCard    ← yellow highlight + bell icon
│   └── ChatBubble          ← plain card
└── AnonymousToggle         ← inside profile dropdown / popover
```

### 5.3 `AnonymousToggle` component

Place this inside your existing profile dropdown/popover.

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { setAnonymous } from "@/api/bulletin";

export function AnonymousToggle({ user, onUpdate }) {
  const handleChange = async (value) => {
    await setAnonymous(value === "anon");
    onUpdate();
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Chat identity
      </p>
      <RadioGroup
        value={user.chatAnonymous ? "anon" : "real"}
        onValueChange={handleChange}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="real" id="identity-real" />
          <Label htmlFor="identity-real">{user.fullName}</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="anon" id="identity-anon" />
          <Label htmlFor="identity-anon" className="text-muted-foreground">
            {user.anonymousAlias ?? "anonymous_????"}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

### 5.4 `AnnouncementCard` component

```tsx
import { Bell, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function AnnouncementCard({ post }) {
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-yellow-600" />
        <span className="text-xs font-medium text-yellow-700 uppercase tracking-wide">
          Announcement
        </span>
        {post.pinned && (
          <Badge variant="outline" className="text-yellow-700 border-yellow-400 text-xs gap-1">
            <Pin className="w-3 h-3" /> Pinned
          </Badge>
        )}
      </div>
      <p className="text-sm text-gray-800 dark:text-gray-100">{post.content}</p>
      <p className="text-xs text-muted-foreground">
        — {post.authorDisplayName} · {formatDistanceToNow(new Date(post.createdAt))} ago
      </p>
    </div>
  );
}
```

### 5.5 `ChatBubble` component

```tsx
import { formatDistanceToNow } from "date-fns";

export function ChatBubble({ post }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {post.authorDisplayName}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(post.createdAt))} ago
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{post.content}</p>
    </div>
  );
}
```

### 5.6 `BulletinPage` — feed + composer

```tsx
import { useEffect, useState } from "react";
import { getAnnouncements, postAnnouncement, postChat } from "@/api/bulletin";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { ChatBubble } from "@/components/ChatBubble";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/useAuthUser";

const CAN_ANNOUNCE = ["SUPER_ADMIN", "HR", "AUDITOR"];

export default function BulletinPage() {
  const { user } = useAuthUser();
  const [posts, setPosts] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [announceInput, setAnnounceInput] = useState("");
  const [pinned, setPinned] = useState(false);

  const load = async () => {
    const res = await getAnnouncements(0);
    setPosts(res.data.content);
  };

  useEffect(() => { load(); }, []);

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    await postChat(chatInput.trim());
    setChatInput("");
    load();
  };

  const handleAnnounce = async () => {
    if (!announceInput.trim()) return;
    await postAnnouncement(announceInput.trim(), pinned);
    setAnnounceInput("");
    setPinned(false);
    load();
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6 px-4">

      {/* Announcement composer — privileged roles only */}
      {CAN_ANNOUNCE.includes(user.role) && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 p-4 space-y-3">
          <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">
            Post announcement
          </p>
          <Textarea
            placeholder="Write an announcement..."
            value={announceInput}
            onChange={(e) => setAnnounceInput(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded"
              />
              Pin this announcement
            </label>
            <Button onClick={handleAnnounce} size="sm">Send announcement</Button>
          </div>
        </div>
      )}

      {/* Chat composer — all roles */}
      <div className="flex gap-2">
        <Textarea
          placeholder={
            user.chatAnonymous
              ? `Chatting as ${user.anonymousAlias}...`
              : "Write a message..."
          }
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          rows={2}
          className="flex-1"
        />
        <Button onClick={handleChat} className="self-end">Send</Button>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {posts.map((post) =>
          post.type === "ANNOUNCEMENT"
            ? <AnnouncementCard key={post.id} post={post} />
            : <ChatBubble key={post.id} post={post} />
        )}
      </div>

    </div>
  );
}
```

---

## Phase 6 — Role & Permission Guard

### Backend — method-level guard (alternative to the service check)

If you already use Spring Security method annotations, you can replace the `canAnnounce()` check with:

```java
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR', 'AUDITOR')")
@PostMapping("/announce")
public ResponseEntity<BulletinPostDTO> announce(...) { ... }
```

### Frontend — hide UI per role

```tsx
const CAN_ANNOUNCE = ["SUPER_ADMIN", "HR", "AUDITOR"];

// in JSX:
{CAN_ANNOUNCE.includes(user.role) && <AnnouncementForm />}
```

> Never rely on frontend-only role checks for security. The backend guard is mandatory.

---

## Phase 7 — Notification Integration

Inside `BulletinService.createAnnouncement()`, after `repo.save(post)`:

```java
// Adjust the method signature to match your NotificationService's actual API
notificationService.sendToAll(
    "📢 " + poster.getFullName(),   // title
    req.content()                   // body
);
```

If your `NotificationService` uses a different signature (e.g. takes a `Notification` object, a list of user IDs, or a topic string), adapt only this call — the rest of the service is unchanged.

---

## Summary

| Phase | What gets built |
|---|---|
| 1 | `bulletin_posts` table + 2 columns on `users` + JPA entities |
| 2 | Repository query + request/response DTOs |
| 3 | `BulletinService` — announce, chat, anonymous toggle, feed |
| 4 | `BulletinController` — 4 endpoints |
| 5 | React components — page, feed, cards, chat input, anonymous toggle |
| 6 | Role guards — backend `@PreAuthorize` + frontend render guard |
| 7 | Wire `notificationService.sendToAll()` inside announcement creation |

**Total new tables: 1. Total new columns on existing tables: 2.**
