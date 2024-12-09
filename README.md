# Record Management API

A RESTful API service for managing records with MongoDB, featuring authentication, filtering, sorting and pagination capabilities.

## Features

- API key authentication for secure access
- CRUD operations for records
- Advanced filtering options (range-based and value-based)
- Sorting functionality
- Pagination support
- User-specific data isolation

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- dotenv for environment variables

## API Endpoints

### Records

- `POST /api/records` - Create a new record
- `GET /api/records` - Retrieve records with filtering, sorting and pagination
- `PUT /api/records/:id` - Update a specific record
- `DELETE /api/records/:id` - Delete a specific record
- `DELETE /api/records` - Delete all records for authenticated user

### Query Parameters

- `sortBy` - Field to sort by
- `order` - Sort order (asc/desc)
- `page` - Page number for pagination
- `limit` - Number of records per page
- `filterKey` - Field to filter on
- `filterValue` - Value(s) to filter by
- `filterMin` - Minimum value for range filtering
- `filterMax` - Maximum value for range filtering

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Authentication

Include your API key in request headers:

```javascript
{
  'api_key': 'your_api_key_here'
};
```

## Usage Examples

### Fetching Records

```javascript
// Example: Get records with filtering, sorting and pagination
const response = await fetch('http://localhost:3000/api/records?sortBy=createdAt&order=desc&page=1&limit=10&filterKey=status&filterValue=active', {
  method: 'GET',
  headers: {
    'api_key': 'your_api_key_here',
    'Accept': 'application/json'
  }
});

const data = await response.json();
```

This request will:
- Sort records by creation date in descending order
- Return the first page with 10 records per page
- Filter records where status is 'active'

