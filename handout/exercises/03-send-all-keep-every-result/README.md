# 03 · Send five jobs, but keep every result

Needs the internet. `node 03-send-all-keep-every-result.js`.

**Use case.** An admin screen sends a notification to five users. One of them can fail. You do not
want "4 succeeded, 1 failed" to come out as "everything failed": you want one line per user.

**Task.** Send all five at the same time and print one result per user, then a summary.

**Steps**

1. `sendNotification(user)` is provided. It fails for Mira, on purpose.
2. Try `Promise.all` first, with `users.map(...)`. Read what happened to Ana's result.
3. Replace it with the method that waits for every promise and never rejects. Each entry of its
   result has a `status`, `'fulfilled'` or `'rejected'`, and then a `value` or a `reason`.
4. Print one line per entry. The results come back in the same order as the users, so the index is
   the link between the two arrays.
5. Count the fulfilled ones and print `{ sent, failed }`.

**What you should see**

```
Ana sent
Dan sent
Mira failed: notifications disabled
Ioan sent
Sara sent
{ sent: 4, failed: 1 }
```

**Then answer:** why is `results[2]` Mira's, and not whichever request failed first?

**Done when** six lines in the users' order, Ana's success printed even though Mira failed, and no
`try` / `catch` in your code: the method did that for you.
