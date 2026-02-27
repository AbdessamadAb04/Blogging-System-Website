// MongoDB Seed Script for Voyagestics Database
const dbName = 'Voyagestics';
const db = db.getSiblingDB(dbName);

// Clear existing data (optional, but good for a fresh start)
db.authors.deleteMany({});
db.categories.deleteMany({});
db.posts.deleteMany({});
db.users.deleteMany({});
db.newsletterSubscribers.deleteMany({});
db.comments.deleteMany({});
db.postLikes.deleteMany({});

// 1. Create Authors
const author1Id = ObjectId();
const author2Id = ObjectId();

db.authors.insertMany([
    {
        _id: author1Id,
        fullName: "John Doe",
        description: "Senior tech writer and developer",
        joinedAt: new Date(),
        avatarUrl: "https://via.placeholder.com/150",
        postCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: author2Id,
        fullName: "Jane Smith",
        description: "Frontend developer and UI/UX enthusiast",
        joinedAt: new Date(),
        avatarUrl: "https://via.placeholder.com/150",
        postCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// 2. Create Categories
const techCatId = ObjectId();
const webCatId = ObjectId();

db.categories.insertMany([
    {
        _id: techCatId,
        name: "Technology",
        description: "Latest trends in technology and development",
        postCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: webCatId,
        name: "Web Development",
        description: "Frontend and backend web development topics",
        postCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// 3. Create Posts
const post1Id = ObjectId();
const post2Id = ObjectId();
const comment1Id = ObjectId();

db.posts.insertMany([
    {
        _id: post1Id,
        title: "Introduction to MongoDB with .NET",
        subtitle: "Learn how to integrate MongoDB with your .NET applications",
        content: "MongoDB is a powerful NoSQL database that works great with .NET applications...",
        featureImagePath: "https://via.placeholder.com/800x400",
        publishedDate: new Date(),
        categoryId: techCatId.toString(),
        authorId: author1Id.toString(),
        status: "Published",
        likeCount: 0,
        likedByUsers: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: post2Id,
        title: "Building Modern Web Applications",
        subtitle: "Best practices for frontend development",
        content: "Modern web applications require a solid architecture and good development practices...",
        featureImagePath: "https://via.placeholder.com/800x400",
        publishedDate: new Date(),
        categoryId: webCatId.toString(),
        authorId: author2Id.toString(),
        status: "Published",
        likeCount: 1,
        likedByUsers: ["user1"],
        comments: [
            {
                _id: comment1Id,
                userName: "Tech Enthusiast",
                content: "Great article! Very informative.",
                commentDate: new Date(),
                userId: "user1",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// 4. Create Standalone Comments
db.comments.insertOne({
    _id: comment1Id,
    userName: "Tech Enthusiast",
    content: "Great article! Very informative.",
    commentDate: new Date(),
    postId: post2Id.toString(),
    userId: "user1",
    createdAt: new Date(),
    updatedAt: new Date()
});

// 5. Create Standalone PostLikes
db.postLikes.insertOne({
    _id: ObjectId(),
    postId: post2Id.toString(),
    userId: "user1",
    likedAt: new Date()
});

// 6. Create Users
db.users.insertMany([
    {
        _id: ObjectId(),
        userName: "admin",
        normalizedUserName: "ADMIN",
        email: "admin@example.com",
        normalizedEmail: "ADMIN@EXAMPLE.COM",
        emailConfirmed: true,
        passwordHash: "hashed_password_here",
        securityStamp: "security_stamp",
        concurrencyStamp: "concurrency_stamp",
        fullName: "Administrator",
        role: "Admin",
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: ObjectId(),
        userName: "abdessamadstuff@gmail.com",
        normalizedUserName: "ABDESSAMADSTUFF@GMAIL.COM",
        email: "abdessamadstuff@gmail.com",
        normalizedEmail: "ABDESSAMADSTUFF@GMAIL.COM",
        emailConfirmed: true,
        passwordHash: "abdessamad2004",
        securityStamp: "security_stamp",
        concurrencyStamp: "concurrency_stamp",
        fullName: "Abdessamad",
        role: "Admin",
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// 7. Create Newsletter Subscribers
db.newsletterSubscribers.insertMany([
    {
        _id: ObjectId(),
        email: "subscriber1@example.com",
        subscribedAt: new Date(),
        isActive: true
    },
    {
        _id: ObjectId(),
        email: "subscriber2@example.com",
        subscribedAt: new Date(),
        isActive: true
    }
]);

print("Seeding completed successfully for 'Voyagestics' database.");
