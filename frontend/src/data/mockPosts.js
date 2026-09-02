import postImage1 from "../assets/images/sample-post-1.jpg";
import postImage2 from "../assets/images/sample-post-2.jpg";

export const posts = [
  {
    id: 1,
    userId: 1,
    caption: "Working on my React project today. Making good progress!",
    image: postImage1,
    createdAt: "2026-09-01T10:30:00",
    likes: 24,
  },
  {
    id: 2,
    userId: 2,
    caption: "Finally finished my latest programming assignment.",
    image: postImage2,
    createdAt: "2026-08-31T18:45:00",
    likes: 17,
  },
  {
    id: 3,
    userId: 3,
    caption: "Learning more about component architecture in React.",
    image: null,
    createdAt: "2026-08-30T14:20:00",
    likes: 31,
  },
  {
    id: 4,
    userId: 4,
    caption: "Spent the weekend learning about PostgreSQL.",
    image: postImage1,
    createdAt: "2026-08-29T09:15:00",
    likes: 12,
  },
  {
    id: 5,
    userId: 5,
    caption: "Trying out a new design for my portfolio website.",
    image: postImage2,
    createdAt: "2026-08-28T16:00:00",
    likes: 42,
  },
  {
    id: 6,
    userId: 1,
    caption: "There's something really satisfying about finally fixing a bug.",
    image: null,
    createdAt: "2026-08-27T20:10:00",
    likes: 19,
  },
];

export const reportReasons = [
  "Inappropriate Content",
  "Spam or Misleading",
  "Harassment or Bullying",
  "Intellectual Property Violation",
  "Hate Speech"
];

export const albums = [
  { id: 101, title: "React Dev Journey", userId: 1, postIds: [1, 6] },
  { id: 102, title: "Coursework", userId: 2, postIds: [2] }
];
