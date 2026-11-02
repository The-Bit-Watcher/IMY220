# IMY220 - LifeSocialCapture
Picture upload and sharing website (React + Vite frontend, Express + MongoDB backend, Redis for logout/token revocation).

## Test logins (from the seed)
Passwords are stored **unhashed**

| Role  | Email          | Password    |
|-------|----------------|-------------|
| User  | test@test.com  | test1234    |
| Admin | admin@test.com | admin1234   |
| Other seeded users (thandi@example.com, liam@example.com, ...) | | password123 |

`test@test.com` has 3 posts, 1 album, 3 friends, 1 incoming and 1 outgoing friend request, and meets every
verification rule (so you can request verification as test and approve it as admin).
Thandi Mokoena is already verified; Aisha Khan has a verification request waiting for review.

## Seed the database
Wipes the database in `DB_URL` and loads 9 users, 18 posts, 6 albums, comments, likes, a report and the report reasons:

```
cd backend
npm install
npm run seed
```

Re-run this after pulling these changes: the user model changed from `hashedPassword` to a plain `password` field, so old accounts can no longer log in.

## Roles
- **Logged out**: only the splash page (log in / sign up). Every other route redirects there.
- **User**: feeds, search, profiles, own posts/albums/comments. Non-friends only see another user's name and picture.
- **Admin**: everything a user can do, plus edit/delete any post, comment, album and account, see every full profile, review reports and add/remove report reasons (`/admin`).

## Bonus features
- **Fuzzy search + autocomplete**: header search box; typos like "snuset" still find "sunset".
- **Account verification**: a non-admin can request it from their own profile once the account is more than a week old,
  with at least 2 posts and 5 comments (the profile shows progress for each rule). Admins approve/deny requests under
  Admin -> Verification. Verified accounts get a blue check next to their name everywhere (profile, feed, posts, comments, search).
- **Light / dark theme**: sun/moon button in the header (and on the splash page). Remembered per browser; first visit follows the OS setting.

Admin rules are enforced on the server (`backend/src/Middleware/auth.js`); the frontend only hides what you can't use.

## Redis
Start redis command: sudo systemctl status redis-server

## Docker
sudo service docker start
sudo service docker status
DOCKER_API_VERSION=1.41 docker compose up -d --build

DOCKER_API_VERSION=1.41 docker compose up -d
docker compose logs -f
