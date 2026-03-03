# 🚀 Social Media App

Scalable, event-driven, cloud-native social media platform built with microservices architecture and Domain-Driven Design principles.

---

## 📌 Overview

This project is a production-ready social media platform designed for scalability, security, and high availability.  
It follows microservices architecture, event-driven communication, and clean architectural layering to ensure maintainability and independent service evolution.

The system supports:

- Secure user authentication
- Post creation and interaction
- Social graph management (follow system)
- Real-time notifications
- Real-time messaging
- Media management
- Role-based authorization
- Horizontal scalability

---

## 🏗 Architecture Principles

- Microservices Architecture
- API Gateway Pattern
- Database per Service Pattern
- Event-Driven Communication (Kafka)
- Clean Architecture (Layered)
- Domain-Driven Design (Bounded Contexts)
- Stateless Services
- Idempotent Handlers
- Zero direct domain mutation from transport layer

---

## 🧩 Microservices

### 1️⃣ Auth Service
Handles authentication and authorization.

**Features:**
- JWT Access & Refresh Tokens
- Token rotation strategy
- Secure password hashing (BCrypt)
- Role-Based Access Control (RBAC)
- Claims-based authorization
- Token revocation mechanism

**Tech:**
- Spring Boot / Node.js
- PostgreSQL
- Optional Redis (token tracking)

---

<table>
<tr>
<td width="65%">

## 2️⃣ User Service

Manages user profiles and social relationships.

**Features:**

- Profile management  
- Follow / Unfollow system  
- User search  
- Social graph modeling  

**Database:** PostgreSQL

</td>

<td width="35%" align="right">

<img width="100%" alt="Ekran görüntüsü 2026-03-03 143054" src="https://github.com/user-attachments/assets/e3ec8acd-74d4-47d4-8939-3f014a7b93f0" />


</td>
</tr>
</table>

---

<table>
<tr>
<td width="65%">

## 3️⃣ Post Service

Manages content and engagement.

**Features:**

- Create / Update / Delete posts  
- Like / Comment system  
- Cursor-based pagination  
- Optimized feed queries  
- Event publishing on engagement  

**Performance Strategy:**

- Indexed queries  
- Query optimization  
- Efficient projections  

</td>

<td width="35%" align="right">
<img width="100%" alt="Ekran görüntüsü 2026-03-03 143916" src="https://github.com/user-attachments/assets/344139b0-bb35-4fa1-9756-169e8e0bed45" />


</td>
</tr>
</table>

---

<table>
<tr>
<td width="65%">

## 4️⃣ Notification Service

Event-driven notification processing.

**Features:**

- Kafka consumer  
- Notification persistence  
- WebSocket push updates  
- Horizontal scalability  

</td>

<td width="35%" align="right">

<img width="100%" alt="Ekran görüntüsü 2026-03-03 143839" src="https://github.com/user-attachments/assets/2d859f24-acb1-430e-831c-a3a1972fadc9" />


</td>
</tr>
</table>

---

<table>
<tr>
<td width="65%">

## 5️⃣ Chat Service

Real-time user messaging.

**Features:**

- WebSocket-based communication  
- Message persistence  
- Online presence tracking  

</td>

<td width="35%" align="right">


<img width="100%" alt="Ekran görüntüsü 2026-03-03 144835" src="https://github.com/user-attachments/assets/1e0020ba-12a7-48a0-af75-3aaaa3edfedc" />

</td>
</tr>
</table>


---

## 🔄 Event-Driven Communication

The platform uses Apache Kafka for asynchronous communication between services.

**Example Events:**
- UserRegisteredEvent
- PostCreatedEvent
- UserFollowedEvent
- LikeAddedEvent

**Benefits:**
- Loose coupling
- Service independence
- Fault tolerance
- Horizontal scalability

---

## 🌐 API Gateway

Central entry point for all client requests.

**Responsibilities:**
- Request routing
- Authentication validation
- Rate limiting
- Logging
- Service discovery integration

---

## 🔐 Security Architecture

Security is implemented as a first-class architectural concern.

**Authentication:**
- JWT-based
- Access & Refresh token separation
- Middleware validation

**Authorization:**
- Role-based policies
- Claims validation
- Fine-grained endpoint protection

**Additional Protections:**
- CORS configuration
- Input validation
- Global exception handling
- Audit logging
- Secure HTTP headers

---

## 🎨 Frontend

### Tech Stack

- React (TypeScript)
- Redux / Context API
- Axios
- React Router
- TailwindCSS / Ant Design
- WebSocket client

### Features

- Infinite scroll feed
- Optimistic UI updates
- Real-time notifications
- Protected routes
- Token lifecycle management
- Responsive design

---

## 🗄 Database Strategy

- PostgreSQL (primary database)
- Redis (optional cache/session)
- Database per Service isolation
- Indexed high-read endpoints
- Transactional consistency within service boundary

---

## 🐳 DevOps & Infrastructure

- Dockerized services
- Docker Compose (local development)
- Load balancer integration

---

## 📊 Observability & Monitoring

- Centralized logging
- Security telemetry
- Login metrics tracking
- Health check endpoints
- Prometheus integration (optional)
- Grafana dashboards (optional)

---

## 🧪 Testing Strategy

- Unit tests
- JWT validation tests
- API testing (Postman)



---

## 🔮 Future Improvements

- CQRS implementation
- Event sourcing
- GraphQL gateway
- AI-powered recommendation engine
- Elasticsearch integration
- Distributed tracing (Jaeger)

---

## 👨‍💻 Author

Enterprise-grade microservices-based social media platform focused on scalability, security, and maintainability.
