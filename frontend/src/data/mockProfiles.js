const getRandomAvatar = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

export const users = [
  {
    id: 1,
    username: "shaun",
    name: "Shaun Marx",
    email: "shaun@example.com",
    bio: "Software development student and technology enthusiast.",
    profileImage: getRandomAvatar("shaun"),
    location: "Pretoria, South Africa",
    joinedDate: "2024-02-15",
    // Friend IDs for relationship checks
    friendIds: [2, 3, 5],
    favoriteIds: [3]
  },
  {
    id: 2,
    username: "john_doe",
    name: "John Doe",
    email: "john@example.com",
    bio: "Computer science student who loves coding.",
    profileImage: getRandomAvatar("john_doe"),
    location: "Johannesburg, South Africa",
    joinedDate: "2024-03-20",
    friendIds: [1],
    favoriteIds: []
  },
  {
    id: 3,
    username: "sarah_dev",
    name: "Sarah Williams",
    email: "sarah@example.com",
    bio: "Frontend developer | React enthusiast.",
    profileImage: getRandomAvatar("sarah_dev"),
    location: "Cape Town, South Africa",
    joinedDate: "2024-04-10",
    friendIds: [1, 4],
    favoriteIds: [1]
  },
  {
    id: 4,
    username: "mike_r",
    name: "Mike Roberts",
    email: "mike@example.com",
    bio: "Backend developer and database enthusiast.",
    profileImage: getRandomAvatar("mike_r"),
    location: "Durban, South Africa",
    joinedDate: "2024-05-02",
    friendIds: [3],
    favoriteIds: []
  },
  {
    id: 5,
    username: "jane_smith",
    name: "Jane Smith",
    email: "jane@example.com",
    bio: "UI/UX designer and digital artist.",
    profileImage: getRandomAvatar("jane_smith"),
    location: "Pretoria, South Africa",
    joinedDate: "2024-06-18",
    friendIds: [1],
    favoriteIds: []
  }
];