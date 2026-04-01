Food Delivery Backend System
1. Overview
Build a scalable backend system that supports users, restaurants, ordering workflows, and
real-time status updates. The system should be designed to handle high traffic, concurrent users,
and large datasets efficiently.
2. Recommended Tech Stack

Node.js, Express.js
MongoDB with Mongoose
Redis (for caching)
JWT Authentication
Swagger for API documentation
3. Core Modules & Schemas
User: name, email, password, role (user/admin)
Restaurant: name, location, cuisine, rating
MenuItem: restaurantId, name, price, stock, availability
Cart: userId, items (menuItemId, quantity)
Order: userId, items, totalAmount, status, paymentStatus
Payment: orderId, status, method
4. Core Features
1
2
3
4
5
6
7
User authentication & authorization
Restaurant listing and menu browsing
Cart management (add/update/remove items)
Order placement system
Order status tracking (placed, preparing, delivered)
Payment simulation
Admin dashboard for managing restaurants & orders
5. Advanced Requirements1
2
3
4
5
6
Implement MongoDB transactions for order placement
Ensure atomic operations while placing orders
Handle concurrency to avoid duplicate orders
Prevent stock inconsistencies during high traffic
Use aggregation pipelines for analytics
Implement proper indexing (userId, restaurantId, orderStatus)
6. Aggregation Requirements
1
2
3
4
Revenue calculation
Top performing restaurants
Most ordered items
Order trends over time
7. Performance Requirements
1
2
3
4
Insert at least 50,000+ records
Optimize queries using indexes
Ensure fast cart and order queries
Test APIs under concurrent load
8. API Design (Example Endpoints)
1
2
3
4
5
POST /auth/register, POST /auth/login
GET /restaurants, GET /restaurants/:id/menu
POST /cart, GET /cart
POST /orders, GET /orders/:id
PATCH /orders/:id/status (Admin)
9. Documentation Requirement
You must implement Swagger documentation for all APIs. Include request/response schemas,
authentication details, and proper grouping of endpoints.
