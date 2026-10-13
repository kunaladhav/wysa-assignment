# AI Usage

## Overview

AI tools were used throughout development as a development and reasoning assistant.

The primary purpose was not to blindly generate the application, but to understand the existing codebase, reason about architecture and edge cases, debug implementation issues, and review design decisions.

The final implementation was tested manually through the frontend, Postman/browser API requests, MongoDB Atlas, and the deployed application.

---

# Tools and Prompts

## AI Tool Used

### ChatGPT

ChatGPT was used for:

* Understanding the existing MERN codebase.
* Reviewing backend controllers and routes.
* Designing therapist scheduling functionality.
* Debugging API and CORS issues.
* Reviewing appointment and recurring appointment logic.
* Reasoning about authentication and role-based access.
* Helping prepare deployment and project documentation.

The following are exact prompts from the AI conversation used during development.

### Prompt 1

> Well you already gave me

> `const getTherapistAppointments = async (req, res) => { ... }`

> **Let's implement** **`getTherapistAppointments`** **first.** Once that works in Postman/browser, we'll build the dashboard UI on top of it.  lets do it

### Prompt 2

> Wait does the assignment document says that the therapist should have these things if not then do we have to build it

This was used to verify the therapist requirements against the assignment specification before implementing additional therapist functionality.

### Prompt 3

> So I need just these two things:

> 1. What appears at `http://localhost:4000/`
> 2. Your `VITE_BACKEND_URL=...`

This was used while debugging the frontend/backend connection and deployment configuration.

---

# Technical Decisions Discussed With AI

## 1. Therapist Schedule Representation

### Problem

The assignment requires therapist availability to be stored as schedules rather than pre-generated appointment slots.

### AI Discussion

The recommended approach was to store availability by:

```text
therapistId
dayOfWeek
windows[]
```

For example:

```text
MONDAY
10:00 - 10:30
13:30 - 14:00
14:30 - 15:00
15:30 - 16:30
```

### Implementation

The project uses a `therapistSchedule` MongoDB model.

Individual appointment slots are derived when the patient requests availability for a particular date.

### Reason

This avoids storing unnecessary appointment documents for every possible future slot and makes schedule changes independent from existing bookings.

---

## 2. Existing Appointments Must Not Change When Schedule Changes

### Problem

The assignment explicitly states that updating therapist availability must not affect existing one-time or recurring bookings.

### Decision

Schedules and appointments are stored independently.

An appointment stores its actual:

```text
startTime
endTime
```

Changing the therapist's schedule does not modify these fields.

### Result

A therapist can change future availability without rewriting existing appointment records.

---

## 3. Appointment Uniqueness

### Problem

Two patients could potentially attempt to book the same slot at approximately the same time.

A normal:

```text
find()
```

followed by:

```text
create()
```

is not sufficient by itself because two requests can pass the availability check before either creates the appointment.

### Decision

Appointments contain a `bookingKey`:

```text
therapistId + startTime + endTime
```

A unique partial index is used for active appointment statuses.

This gives MongoDB responsibility for enforcing uniqueness at the database level.

### Reason

Database-level uniqueness is more reliable than relying only on application-level checks, especially when multiple backend instances are running.

---

## 4. Idempotency

### Problem

The assignment assumes the backend is deployed across three server clusters.

An in-memory idempotency store would not work reliably because different requests could reach different server instances.

### Decision

An `idempotencyKey` is stored with the appointment.

The database uniqueness constraint ensures that the same idempotent operation cannot create duplicate appointment records.

### Trade-off

This adds database constraints and additional fields to the appointment model, but it makes the solution more suitable for a distributed deployment.

---

## 5. Temporary Slot Holds

### Problem

A patient should be able to temporarily reserve a slot while deciding whether to confirm it.

The hold must also survive a browser refresh.

### Decision

Temporary holds are stored in MongoDB instead of only in React state.

A hold contains an expiration time.

Availability checks ignore expired holds but exclude active holds.

### Reason

Persisting the hold means the state is shared across backend instances and survives page refreshes.

---

## 6. Recurring Appointments

### Problem

The system must support:

* Daily
* Weekly
* Bi-weekly
* Monthly

recurrence.

It must also allow an individual appointment instance to be cancelled without cancelling the entire series.

### Decision

A recurring appointment series is represented by a `recurringSeriesId`.

Each occurrence is still stored as its own appointment document.

For example:

```text
Recurring Series
        |
        +-- Appointment 1
        +-- Appointment 2
        +-- Appointment 3
        +-- Appointment 4
```

### Reason

This makes individual instances independently addressable while retaining their relationship to the overall series.

---

## 7. Role-Based Authorization

### Problem

A therapist should not be able to access or modify another therapist's appointments.

### Decision

JWT authentication stores the user's ID and role.

The authentication middleware attaches:

```javascript
req.user = {
  id,
  role
};
```

Controller-level authorization then verifies both the role and resource ownership.

For example, therapist appointment queries use:

```javascript
{
  therapistId: req.user.id
}
```

rather than accepting an arbitrary therapist ID from the frontend.

### Reason

This prevents users from simply changing an ID in the request to access another therapist's data.

---

# Incorrect or Problematic AI Suggestions

During development, AI assistance was treated as a debugging and reasoning tool rather than as an unquestioned source of truth.

One important example was the therapist schedule implementation.

The initial implementation exposed schedule creation functionality, but the assignment specifically required therapists to be able to **update** their schedules. This led to adding an update endpoint and therapist schedule UI rather than relying only on the original schedule creation endpoint.

Another issue occurred during deployment where the frontend appeared to have a CORS problem. The browser displayed a CORS error, but the deployed API endpoint itself was accessible successfully. The problem was investigated through the browser Network tab, Render deployment logs, backend configuration, and direct API requests rather than assuming the first error message represented the complete root cause.

---

# Verification Process

AI-generated or AI-assisted code was not considered complete until it was manually tested.

Verification included:

### Backend

* Testing API endpoints through Postman/browser.
* Checking authentication behaviour.
* Checking therapist authorization.
* Checking appointment retrieval.
* Checking appointment status updates.
* Checking schedule updates.

### Database

MongoDB Atlas was used to verify:

* Therapist records.
* Therapist schedules.
* Appointment records.
* Recurring series.
* Booking keys.
* Idempotency keys.

### Frontend

The React application was tested for:

* Patient login.
* Therapist login.
* Therapist dashboard navigation.
* Appointment display.
* Schedule display.
* Schedule updates.
* Logout behaviour.
* Frontend/backend communication.

### Deployment

The final deployment was tested using:

* Vercel frontend.
* Render backend.
* MongoDB Atlas.
* Browser Network/Console tools.

---

# Reflection on AI Usage

AI was particularly useful for quickly identifying implementation approaches and debugging unfamiliar issues.

However, several suggestions required verification against the actual assignment requirements and existing codebase.

The final implementation was therefore developed through an iterative process:

```text
AI suggestion
      ↓
Understand the reasoning
      ↓
Implement
      ↓
Test locally
      ↓
Inspect API/database behaviour
      ↓
Debug failures
      ↓
Verify against assignment requirements
```

The most important use of AI was therefore as a reasoning and development assistant rather than as a replacement for understanding the implementation.
