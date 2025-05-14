# Blog Posts REST API

A RESTful API for managing blog posts with authentication and rate limiting.

## Features

- Full CRUD operations for blog posts
- JWT-based authentication
- Rate limiting (100 requests per 2 minutes)
- MySQL database integration
- Error handling
- CORS enabled

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd blog-posts-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
- Create a MySQL database
- Import the schema from `src/database.sql`

4. Configure the database connection:
- Update the database configuration in `src/server.js` with your MySQL credentials

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/login`
  - Body: `{ "username": "admin", "password": "password" }`
  - Returns: JWT token

### Blog Posts
- GET `/posts` - Get all posts
- GET `/posts/:id` - Get a specific post
- POST `/posts` - Create a new post (requires authentication)
  - Body: `{ "title": "Post Title", "content": "Post Content", "author": "Author Name" }`
- PUT `/posts/:id` - Update a post (requires authentication)
  - Body: `{ "title": "Updated Title", "content": "Updated Content", "author": "Author Name" }`
- DELETE `/posts/:id` - Delete a post (requires authentication)

## Authentication

To access protected endpoints, include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Rate Limiting

The API implements rate limiting:
- 100 requests per 2 minutes per IP address
- Exceeding the limit will result in a 429 Too Many Requests response

## Testing with Postman

1. Import the Postman collection (link to be added)
2. Set up environment variables in Postman:
   - `baseUrl`: http://localhost:3000
   - `token`: (after login)

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error 