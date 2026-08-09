# Therapist Appointment Booking System

A full-stack appointment booking system built as part of the Associate Full-Stack Engineer take-home assignment.

The application allows patients to view therapist availability, temporarily hold appointment slots, book one-time or recurring appointments, and manage their bookings. Therapists can view their appointments, update appointment statuses, and manage their availability schedule.

## Live Demo

**Frontend:** https://wysa-assignment-murex.vercel.app

**Backend API:** https://wysa-assignment-wdp6.onrender.com

## GitHub Repository

https://github.com/kunaladhav/wysa-assignment

---

## Tech Stack

### Frontend

* React
* Vite
* React Router
* Axios
* Tailwind CSS
* React Toastify

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT authentication
* bcrypt
* CORS

### Deployment

* Vercel — Frontend
* Render — Backend
* MongoDB Atlas — Database

---

## User Roles

The application supports two roles:

### Patient

A patient can:

* Log in using seeded credentials
* View therapists
* View available appointment slots
* Temporarily hold an appointment slot
* Confirm one-time appointments
* Create recurring appointments
* Select daily, weekly, bi-weekly, or monthly recurrence
* View booked appointments
* Cancel appointments
* Cancel individual recurring appointment instances

### Therapist

A therapist can:

* Log in using seeded credentials
* View their assigned appointments
* View patient information for appointments
* Update appointment status
* View their availability schedule
* Update their schedule without modifying existing appointments

---

## Demo Credentials

### Patient

```text
Email: user1@gmail.com
Password: user1@123
```

### Therapist

```text
Email: rahul@test.com
Password: 12345678
```

> Demo credentials are provided separately for evaluation where required.

---

## Appointment Availability

Therapist availability is stored as a schedule in MongoDB.

The database stores availability windows rather than individual appointment slots.

For example:

```text
Monday
10:00 - 10:30
13:30 - 14:00
14:30 - 15:00
15:30 - 16:30
```

The backend derives the appointment availability for a requested date by:

1. Determining the day of the week.
2. Loading the therapist's schedule for that day.
3. Converting the configured windows into date-specific start and end times.
4. Checking existing appointments.
5. Checking active temporary slot holds.
6. Removing conflicting windows.
7. Returning the remaining available slots.

This means individual appointment slots do not need to be pre-seeded in the database.

---

## Temporary Slot Holding

When a patient selects a slot, the backend creates a temporary hold.

The hold:

* Is associated with the patient and therapist.
* Has an expiration time.
* Prevents another patient from selecting the same slot while active.
* Can survive a page refresh because the hold is stored in MongoDB.
* Becomes invalid once its expiration time has passed.

The availability API checks active holds before returning available slots.

---

## Appointment Booking

Appointments are stored with:

* Patient ID
* Therapist ID
* Start time
* End time
* Status
* Recurring series ID
* Idempotency key
* Booking key

Example:

```text
therapistId + startTime + endTime
```

is used to construct a booking key.

A unique database constraint helps prevent duplicate active bookings for the same therapist and time window.

---

## Recurring Appointments

The system supports:

* Daily
* Weekly
* Bi-weekly
* Monthly

Recurring appointments are represented using a `recurringSeriesId`.

Individual appointments remain separate database documents, allowing individual instances to be cancelled without necessarily cancelling the entire series.

For example:

```text
Recurring Series
       |
       +-- August 10
       +-- August 17
       +-- August 24
       +-- August 31
       +-- September 7
```

This approach makes individual appointment instances independently manageable.

---

## Appointment Status

Appointments support the following statuses:

```text
scheduled
completed
no_show
cancelled
```

Therapists can update the status of appointments assigned to them.

The backend verifies that the authenticated therapist owns the appointment before allowing the status update.

---

## Authentication

Authentication uses JWT tokens.

After login:

1. The backend verifies the credentials.
2. A JWT is generated containing the user's ID and role.
3. The frontend stores the token.
4. The token is sent with protected API requests.
5. `authUser` middleware verifies the token.
6. The authenticated user's ID and role are attached to `req.user`.

Role-based checks are then performed inside protected controller functions.

---

## Database Models

The main MongoDB collections/models include:

```text
User
TherapistSchedule
Appointment
SlotHold
RecurringSeries
```

### TherapistSchedule

Stores therapist availability by day:

```text
therapistId
dayOfWeek
windows[]
```

### Appointment

Stores individual appointment instances:

```text
patientId
therapistId
startTime
endTime
status
recurringSeriesId
idempotencyKey
bookingKey
```

---

## Architectural Challenges

### 1. Preventing Double Booking

Two patients must not be able to successfully book the same therapist/time window.

The implementation uses:

* Availability checks
* Temporary holds
* Booking keys
* MongoDB uniqueness constraints

The database constraint provides an additional layer of protection against race conditions.

### 2. Temporary Holds

A slot cannot simply be hidden in frontend state because another patient could still book it.

Therefore, holds are persisted in MongoDB with an expiration time.

This also allows the hold to remain valid after refreshing the browser.

### 3. Recurring Appointments

Recurring appointments are represented as a series while individual appointment instances remain separate.

This allows the system to support both:

* Cancelling an entire recurring series
* Cancelling only one appointment instance

### 4. Distributed Idempotency

The backend is assumed to run across multiple server clusters.

For this reason, relying on in-memory state would not be sufficient.

Idempotency and booking uniqueness are persisted in MongoDB using fields such as:

```text
idempotencyKey
bookingKey
```

and database-level unique constraints.

### 5. Schedule Updates

Updating a therapist's schedule must not modify existing appointments.

Schedules and appointments are therefore stored independently.

Changing a future schedule only affects newly derived availability; existing appointment documents retain their original start and end times.

---

## API Overview

### Authentication

```text
POST /api/user/login
POST /api/user/register
GET  /api/user/get-profile
```

### Therapists

```text
GET   /api/therapist/list
GET   /api/therapist/:therapistId/availability
GET   /api/therapist/appointments
GET   /api/therapist/schedule
POST  /api/therapist/schedule
PATCH /api/therapist/schedule
PATCH /api/therapist/appointment-status
```

### Doctors

Existing doctor-related endpoints from the base Prescripto application are also retained where applicable.

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/kunaladhav/wysa-assignment.git
cd wysa-assignment
```

### 2. Backend

```bash
cd backend
npm install
npm start
```

Create a `.env` file containing the required MongoDB, JWT, Cloudinary and other backend configuration values.

Example:

```env
PORT=4000
MONGODB_URI=<mongodb-connection-string>
JWT_SECRET=<jwt-secret>
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a frontend `.env` file:

```env
VITE_BACKEND_URL=http://localhost:4000/
```

The frontend can then be accessed through the Vite development server.

---

## Deployment

The frontend is deployed on Vercel and the backend is deployed on Render.

The frontend uses the deployed Render backend URL through:

```env
VITE_BACKEND_URL=https://wysa-assignment-wdp6.onrender.com/
```

The backend is configured to accept requests from the deployed Vercel frontend.

MongoDB Atlas is used as the production database.

---

## AI Usage

AI tools were used during development for:

* Understanding the existing codebase
* Reviewing API and database design
* Debugging authentication and CORS issues
* Designing therapist scheduling functionality
* Reviewing recurring appointment and idempotency approaches
* Building and debugging frontend functionality
* Preparing documentation

Detailed AI usage is documented in [`AI_USAGE.md`](./AI_USAGE.md).
