# Messaging Refactor Plan: Explicit Conversations

Status tracker for making `Conversation` a real part of the 1:1 messaging model. Each step leaves the build green, the tests passing and the app working. Every step is reviewed and approved before the next one starts.

**Scope:** refactor only. The product behaviour stays the same: 1:1 text messages between users with an accepted connection, an inbox, a paginated thread, read state, and SignalR push. No new messaging features (attachments, reactions, editing, typing, groups, etc.).

**Context:** production has no users yet, so migrations are squashed and regenerated rather than backfilled.

## Progress

| # | Step | Status |
|---|------|--------|
| 0 | Commit in-flight connections work | ☑ Approved (`94f4e08`) |
| 1 | Fix the current model's bugs | ◐ In progress (awaiting review) |
| 2 | Add Conversation; switch sending to it | ☐ Pending |
| 3 | Move read state to Conversation; make GetConversation read-only | ☐ Pending |
| 4 | Build the inbox query from the user's conversations | ☐ Pending |
| 5 | Conversation-based thread query with cursor pagination | ☐ Pending |
| 6 | Push `MessageCreated` to both participants | ☐ Pending |
| 7 | Cleanup, query-plan review, docs | ☐ Pending |

Status values: ☐ Pending · ◐ In progress · ☑ Approved

---

## Design decisions

### Target schema

```text
Conversation   Id, User1Id, User2Id, CreatedAt, LastMessageAt,
               User1LastReadAt (nullable), User2LastReadAt (nullable)
               UNIQUE(User1Id, User2Id), CHECK(User1Id < User2Id)
               INDEX(User2Id)   -- User1Id is covered by the unique index

Message        Id, ConversationId, SenderId, Content, CreatedAt
               INDEX(ConversationId, CreatedAt DESC, Id DESC)
```

**No `ConversationParticipant` table.** Conversations are strictly 1:1 and group conversations are not planned. `User1Id`/`User2Id` are the only record of who is in a conversation, and the only per-user state (read position) lives in two columns next to them. A separate participant table would store membership twice without adding anything.

### Rules

- **Membership and "which side am I".** A user is in a conversation when `User1Id = @me OR User2Id = @me`. The other user and the caller's read position come from `CASE WHEN User1Id = @me …`. That `CASE` logic lives in one repository helper, not repeated across queries.
- **How the user pair is ordered.** `User1Id` is the lower ID of the pair, and the `CHECK` constraint enforces this. The helper uses `Guid.CompareTo`, which orders GUIDs the same way Postgres orders `uuid` (field by field, unsigned, which matches the hex-string order). Never compare `Guid.ToByteArray()` bytes: .NET stores the first three fields little-endian, so that order disagrees with Postgres for about half of all pairs. One helper owns this rule.
- **One conversation per pair.** This is guaranteed by the unique constraint. Get-or-create uses `INSERT … ON CONFLICT (user1_id, user2_id) DO NOTHING` followed by a select. Nothing gets serialized across unrelated conversations.
- **When a conversation exists.** It is created on the first message sent. It is not created when a connection is accepted or when an empty thread is opened.
- **Send is one transaction.** The conversation (if new), the message and the `LastMessageAt` update are written together. The SignalR notification happens only after commit.
- **Read state is a timestamp.** The caller's `User1LastReadAt` or `User2LastReadAt` is set to the newest message's `CreatedAt` as stored in the database, never the current time, so a message that arrives mid-request isn't wrongly marked read. A message counts as read for the recipient when `CreatedAt <= recipient.LastReadAt`.
- **Messages are immutable.** `UpdatedAt`, `IsRead` and `ReceiverId` are removed. The API still returns `receiverId` and `isRead`, derived from the conversation.
- **Routes stay keyed by `otherUserId`.** DTOs expose `conversationId`, but URLs don't change. Profile "message" links only know the user ID.
- **The pagination cursor** is an opaque base64 string of `(CreatedAt, Id)`, passed as `?before=`. The response is `{ messages, nextCursor, hasMore }`. The query fetches `limit + 1` rows, and `hasMore = rows > limit`.
- **Permission to message** comes from the social graph (`ISocialGraphRepository.AcceptedConnectionExistsAsync`). Messaging persistence never queries `Connections` directly.
- **REST handles commands and queries; SignalR only delivers.** Messages are never created through hub methods.

### Out of scope

- The new message features listed under Scope.
- Messaging does not check `UserBlock` today. This refactor doesn't change that.
- Presence, typing indicators, push notifications.

---

## Step 0: Commit in-flight connections work

The working tree has uncommitted connections changes, including a regenerated migration. Commit them first, so the messaging refactor and its migration squash land as a separate change.

**Done when:** the working tree is clean apart from unrelated local files.

---

## Step 1: Fix the current model's bugs

No schema change.

**Backend**
- `SendMessageCommandHandler` uses `ISocialGraphRepository.AcceptedConnectionExistsAsync`. Delete `IMessageRepository.HasAcceptedConnectionAsync` and its implementation.
- `SendMessageCommandValidator`: reject content that's only whitespace. Remove the handler's duplicate empty-content check. The handler trims once and saves the trimmed text.
- Rename `ConversationPartnerProfileDto.ProfilePicture` / `profilePicture` to `Avatar` / `avatar`, to match the other messaging DTOs.

**Frontend**
- `features/messages/conversation-thread-client.tsx` reads `hasMore` from the top level, but the API returns it at `pagination.hasMore`, so "Load older" never shows. Fix it.
- Update `packages/shared/src/types/messages.ts` and `features/messages/conversations-list-client.tsx` for the `avatar` rename.

**Tests**
- Unit: whitespace-only content is rejected, content is trimmed before saving, 1001 characters is rejected.
- Integration: a SignalR client connected to `/hubs/messages?access_token=…` receives `ReceiveMessage` when a message is sent to it. This confirms the SignalR user ID equals the Global Scout user ID.

**Done when:** "Load older" appears for threads longer than one page, and all tests pass.

---

## Step 2: Add Conversation; switch sending to it

**Backend**
- New entity `Conversation` in `Domain/Social/`, next to `Message`.
- EF configuration, constraints and indexes as in the target schema.
- Pair-ordering helper, with unit tests.
- `Message` gains `ConversationId` (required FK). `ReceiverId` and `IsRead` are **temporarily kept** so the existing read queries keep working unchanged.
- The send path does, in one transaction: get-or-create the conversation (`ON CONFLICT DO NOTHING`), insert the message, update `LastMessageAt`. Notify after commit.
- Squash and regenerate `InitialCreate`.

**Tests**
- A→B and B→A resolve to the same conversation.
- Concurrent first messages between the same pair (parallel requests against Testcontainers Postgres) produce exactly one conversation.
- The pair-ordering helper (`Guid.CompareTo`) agrees with Postgres `uuid` ordering, checked against the database.
- Existing send-rule tests still pass.

**Done when:** sending behaves exactly as before, and every message row has a `ConversationId`.

---

## Step 3: Move read state to Conversation; make GetConversation read-only

**Backend**
- `MarkMessagesReadCommand` finds the conversation for the normalized `(caller, otherUserId)` pair and advances the caller's side (`User1LastReadAt` or `User2LastReadAt`) to the newest message's `CreatedAt`. It does nothing if the conversation doesn't exist. Because the lookup is by the caller's own pair, a user can only ever move their own read position.
- `GetConversationQueryHandler` becomes read-only. Remove the `MarkMessagesReadAsync` call and the `IsRead` rewriting.
- Inbox unread counts and per-message `isRead` are derived from the relevant side's `LastReadAt`.
- Remove the `Message.IsRead` column.

**Frontend**
- The thread view calls `PUT /api/messages/read/{userId}` after loading, and again when a message from that user arrives while the thread is open.
- Keep `markConversationReadLocally` for the immediate badge update.

**Tests**
- Loading a thread doesn't change read state.
- Marking read advances only the caller's position.
- Inbox unread counts are correct before and after marking read.
- A message created after the read position is still unread.

**Done when:** unread badges in the UI behave the same as today.

---

## Step 4: Build the inbox query from the user's conversations

**Backend**
- Rewrite `GetConversationsAsync` to start from the caller's conversations (`User1Id = @me OR User2Id = @me`). Join the other user's profile and the latest message. Count unread messages from the other user after the caller's read position. Sort by `LastMessageAt DESC`.
- Use projections only, with a fixed number of queries no matter how many conversations there are.
- Resolve each avatar once per distinct user.
- DTOs gain `conversationId`.

**Tests**
- Inbox order, last-message preview, unread counts, empty inbox.
- Conversations the caller isn't part of never appear.

**Done when:** the inbox output matches the previous behaviour, and the query count is constant.

---

## Step 5: Conversation-based thread query with cursor pagination

**This changes the API contract.**

**Backend**
- `GET api/messages/conversation/{otherUserId}?before=<cursor>&limit=30`
  - Finds the conversation from the pair. If there's no conversation yet, returns an empty page.
  - Keyset query: `WHERE ConversationId = @id AND (CreatedAt, Id) < (@cursorCreatedAt, @cursorId) ORDER BY CreatedAt DESC, Id DESC LIMIT @limit + 1`.
  - Each page is returned oldest-to-newest.
  - Response: `{ messages, nextCursor, hasMore }`.
- Remove `page` handling.
- Avatars are resolved once per sender for the page.
- Thread DTOs derive `receiverId` from the conversation.

**Frontend**
- `features/messages/conversation-thread-client.tsx`: replace the page counter with a `nextCursor` state. Remove the step 1 `pagination.hasMore` workaround.
- `app/api/messages/conversation/[userId]/route.ts`, `lib/api/messages.ts`, `packages/shared` types: pass `before` through instead of `page`.

**Tests**
- The first page returns the newest N messages, oldest-to-newest.
- Following cursors covers the whole history with no duplicates or gaps.
- `hasMore` is correct when the total is an exact multiple of the page size.
- Messages created between page requests don't shift or duplicate older pages.
- An invalid cursor returns a validation error.

**Done when:** scrolling back through a long thread in the UI is correct.

---

## Step 6: Push `MessageCreated` to both participants

**Backend**
- `IMessageRealtimeNotifier` publishes a `MessageCreated` event to both the sender and the recipient, only after the send transaction commits.

**Frontend**
- `features/messages/messages-provider.tsx`: listen for `MessageCreated` instead of `ReceiveMessage`.
- Dedupe by message ID against messages already shown (the originating tab has the message from the HTTP response).
- For the sender's own messages, update the inbox preview and order but not the unread count.

**Tests**
- The recipient receives `MessageCreated`.
- A second SignalR connection belonging to the sender also receives it.
- No event is sent when saving the message fails.

**Done when:** a message sent in one tab appears in the sender's other open tabs, and in the recipient's.

---

## Step 7: Cleanup, query-plan review, docs

- Remove the `Message.ReceiverId` and `Message.UpdatedAt` columns, dead DTOs and unused repository methods.
- Final migration squash.
- Seed a realistic volume of data and run `EXPLAIN ANALYZE` on the inbox, thread page and unread-count queries. Adjust indexes based on the actual plans.
- Document the model, invariants and API contract (a new `docs/MESSAGING.md`, linked from `docs/AGENT-ONBOARDING.md`).
- Full verification: `dotnet test`, `pnpm typecheck`, `pnpm lint`.

**Done when:** nothing references the old message model, the query plans use the indexes, and the docs describe the new model.
