import postImage1 from "../assets/sample-post-1.jpeg";
import postImage2 from "../assets/sample-post-2.png";

export const posts = [
  {
    id: 1,
    userId: 1,
    caption: "Batman",
    image: postImage2,
    createdAt: "2026-09-01T10:30:00",
    likes: 24,
  },
  {
    id: 2,
    userId: 2,
    caption: "Spaceman.",
    image: postImage1,
    createdAt: "2026-08-31T18:45:00",
    likes: 17,
  },
  {
    id: 3,
    userId: 3,
    caption: "Another space man",
    image: postImage1,
    createdAt: "2026-08-30T14:20:00",
    likes: 31,
  },
  {
    id: 4,
    userId: 4,
    caption: "Damn this man is popular",
    image: postImage1,
    createdAt: "2026-08-29T09:15:00",
    likes: 12,
  },
  {
    id: 5,
    userId: 5,
    caption: "Atleast not a space man. ",
    image: postImage2,
    createdAt: "2026-08-28T16:00:00",
    likes: 42,
  },
  {
    id: 6,
    userId: 1,
    caption: "A space Batman would be cool",
    image: postImage2,
    createdAt: "2026-08-27T20:10:00",
    likes: 19,
  },
];

export const reportReasons = [
  "Inappropriate Content",
  "Spam or Misleading",
  "Harassment or Bullying",
  "Intellectual Property Violation"
];

export const albums = [
  { id: 101, title: "Batman", userId: 1, postIds: [1, 6] },
  { id: 102, title: "Spaceman", userId: 2, postIds: [2] }
];
