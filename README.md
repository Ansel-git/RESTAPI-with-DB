# Blog Posts REST API

A RESTful API for managing blog posts with authentication and rate limiting.

# Project Context
This project was developed as part of a coursework assignment. It demonstrates the use of Node.js, Express.js, and MySQL to build a secure and robust REST API for blog post management. The code is structured for clarity, maintainability, and best practices, and is ready for review by instructors or peers.

# Features
- Full CRUD operations for blog posts
- JWT-based authentication for protected routes
- Rate limiting (100 requests per 2 minutes)
- MySQL database integration
- Error handling and clear feedback messages
- CORS enabled

# API Endpoints

# Authentication
- POST `/login`
  - Body: `username`, `password` (JSON or x-www-form-urlencoded)
  - Returns: JWT token

# Blog Posts
- GET `/posts` - Get all posts

- GET `/posts/:id` - Get a specific post

- POST `/posts` - Create a new post (requires authentication)
  - Body: `title`, `content`, `author` (JSON or x-www-form-urlencoded)

- PUT `/posts/:id` - Update a post (requires authentication)
  - Body: `title`, `content`, `author` (JSON or x-www-form-urlencoded)

- DELETE `/posts/:id` - Delete a post (requires authentication)

# Authentication Header
For protected endpoints, include the JWT token in the `Authorization` header:
```
Authorization: Bearer <your-token>
```

# Error Handling
The API returns clear HTTP status codes and feedback messages:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Notes for Reviewers
- The code is well-commented for clarity.
- All sensitive credentials are managed via environment variables.
- The project is ready for demonstration and grading.

---

**Submitted by:**
- JOHN ANSEL C. DOTON
- IT-NT-3201
- ASIA FINAL PROJECT