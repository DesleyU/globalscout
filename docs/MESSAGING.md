# Messaging (1:1 conversations)

This document describes the final model that came out of `docs/MESSAGING-REFACTOR-PLAN.md`: explicit `Conversation`s, cursor-paginated threads, and a `MessageCreated` SignalR push to both participants. It's the reference for anyone touching `Social/Messages/*`; the refactor plan doc stays as historical record of how the model got here.

**Scope:** 1:1 text messages between users with an accepted connection. No attachments, reactions, editing, groups, typing indicators, presence, or push notifications. Messaging does not check `UserBlock`.

---

## Model

```text
Conversation   Id, User1Id, User2Id, CreatedAt, LastMessageAt,
               User1LastReadAt (nullable), User2LastReadAt (nullable)
               UNIQUE(User1Id, User2Id), CHECK(User1Id < User2Id)
               INDEX(User2Id)   -- User1Id is covered by the unique index

Message        Id, ConversationId, SenderId, Content, CreatedAt
               INDEX(ConversationId, CreatedAt DESC, Id DESC)
```

There is no `ConversationParticipant` table — conversations are strictly 1:1, so `User1Id`/`User2Id` are the only record of membership, and the only per-user state (read position) lives in the two `*LastReadAt` columns next to them.

### Invariants

- **Membership.** A user is in a conversation when `User1Id = @me OR User2Id = @me`. The other participant and the caller's read position are picked with `CASE WHEN User1Id = @me …`; that logic lives once, in `MessageRepository`, not repeated per query.
- **Pair order.** `User1Id` is always the lower GUID, enforced by `ck_conversations_user_order`. `Conversation.OrderPair` uses `Guid.CompareTo`, which agrees with Postgres `uuid` ordering — never compare `Guid.ToByteArray()` bytes, which disagrees for about half of all pairs (.NET stores the first three fields little-endian).
- **One conversation per pair.** Enforced by `UNIQUE(User1Id, User2Id)`. Sending does a single `INSERT … ON CONFLICT (user1_id, user2_id) DO UPDATE SET last_message_at = GREATEST(…) RETURNING id`, which creates-or-finds the conversation and bumps `LastMessageAt` (never backwards) in one statement. Only concurrent senders in the *same* conversation wait on each other's row lock.
- **Creation.** A conversation is created on the first message sent — not when a connection is accepted, not when an empty thread is opened.
- **Send is one transaction.** The conversation upsert and the message insert commit together. The SignalR push happens only after commit.
- **Messages are immutable.** No `UpdatedAt`. `receiverId` and `isRead` are not stored on `Message` — they're derived from the conversation (the other participant; `CreatedAt <= recipient's LastReadAt`) every time they're read, so the API still returns both fields.
- **Read state is a timestamp.** Marking read advances the caller's own `User1LastReadAt`/`User2LastReadAt` to the newest message's stored `CreatedAt` — never "now" — so a message committed mid-request isn't wrongly marked read. It only ever moves forward.
- **Permission to message** comes from the social graph (`ISocialGraphRepository.AcceptedConnectionExistsAsync`). Messaging persistence never queries `Connections` directly.
- **REST handles commands and queries; SignalR only delivers.** Messages are never created through hub methods.

---

## HTTP surface

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/messages` | Send a message. Body: `{ receiverId, content }`. Requires an accepted connection; whitespace-only content is rejected, content is trimmed before saving. |
| `GET` | `/api/messages/conversations` | Inbox: the caller's conversations, each with the other participant, the last message, and the caller's unread count. Sorted by `LastMessageAt` desc. Runs a fixed 3 queries regardless of conversation count. |
| `GET` | `/api/messages/conversation/{otherUserId}?before=<cursor>&limit=` | One page of a thread, oldest-to-newest. `limit` defaults to 50, capped at 200. No conversation yet → an empty page, not an error. |
| `PUT` | `/api/messages/read/{otherUserId}` | Advances the caller's read position in that conversation to the newest message. No-op if there's no conversation. |

### Thread pagination

The cursor is an opaque base64 string encoding `(CreatedAt, Id)` of the oldest message already seen. Response shape:

```json
{ "messages": [...], "nextCursor": "<string|null>", "hasMore": true }
```

The query is a keyset scan: `WHERE ConversationId = @id AND (CreatedAt, Id) < (@cursorCreatedAt, @cursorId) ORDER BY CreatedAt DESC, Id DESC LIMIT @limit + 1`, fetching one extra row to compute `hasMore` without a second query. Each page is reversed to oldest-first before returning. An undecodable `before` value is a validation error (`Messages.InvalidCursor`), not a silently-ignored param.

### Routes stay keyed by `otherUserId`

DTOs expose `conversationId` (e.g. `ConversationListItemDto.ConversationId`), but every route is still keyed by the other user's ID — profile "Message" links only ever know a user ID, not a conversation ID.

---

## Realtime (SignalR)

Hub: `/hubs/messages` (`MessageHub`, authenticated). The hub has no server-callable methods — it exists only so `SignalRMessageNotifier` can push to connected clients.

After a send commits, `MessageCreated` is pushed to **both** participants (`hub.Clients.Users([senderId, recipientId])`), carrying the same `MessageDetailDto` the HTTP response returns. No push happens if the send fails.

Frontend (`features/messages/messages-provider.tsx`) dedupes by message ID: the tab that sent the message already has it from the HTTP response, so the push is only used to update the inbox preview/order. For the sender's own echoed message, the handler updates the preview and ordering but does **not** increment `unreadCount`. `conversation-thread-client.tsx` accepts the push into an open thread either when it's from the other participant (and then also marks the conversation read) or when it's the current user's own message arriving in another open tab/window of the same thread.

---

## Query plans

Reviewed with `EXPLAIN (ANALYZE, BUFFERS)` against 500 seeded conversations (20 messages each, ~10k messages) for one user:

- **Inbox** (`conversations WHERE user1_id = @me OR user2_id = @me`): a `BitmapOr` over `ix_conversations_user1_id_user2_id` and `ix_conversations_user2_id` — both sides of the OR use an index, no sequential scan.
- **Thread page** (`messages WHERE conversation_id = @id ORDER BY created_at DESC, id DESC LIMIT @n+1`): `Bitmap Index Scan` on `ix_messages_conversation_id_created_at_id`, satisfying both the filter and the sort.
- **Unread count** (`messages WHERE conversation_id = @id AND created_at > @readAt`, filtered further by `sender_id`): same composite index, `sender_id` applied as a filter after the index scan.

All three completed in well under a millisecond at this volume. If conversation/message volume grows by orders of magnitude, re-run this check — the composite index on `Message` is the one query-critical index and should stay the first two columns matching `(ConversationId, CreatedAt DESC, Id DESC)` if it's ever changed.

---

## History

`Message` originally carried `ReceiverId` and `UpdatedAt`, and `IsRead`. All three are gone — see `docs/MESSAGING-REFACTOR-PLAN.md` steps 2, 3, and 7 for why, and for the full step-by-step history of how the `Conversation` model was introduced without downtime (production had no users yet, so migrations were squashed and regenerated rather than backfilled at the end, instead of being carried as a long incremental chain).
