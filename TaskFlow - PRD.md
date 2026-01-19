TaskFlow
Product Requirements Document

Product Summary
A simple task board with three fixed columns for personal task management. Users must log in to access their board.

Core Features
1. User Accounts
Sign up and log in required

Email/password authentication

One board per user

2. Kanban Board
Three columns:

Queue (tasks to do)

In Progress (active tasks)

Completed (finished tasks)

Each task shows:

Title (required)

Description (optional)

Deadline (date picker, no time)

3. Task Actions
Create new tasks (default to Queue)

Edit existing tasks

Delete tasks

Drag and drop between columns

Auto-timestamp when completed

4. Search Function
Search bar at top of page

Searches task titles and descriptions

Real-time filtering as you type

5. Data Export
Export button

Options: JSON or CSV format

Downloads all tasks to user's device

Technical Stack
Frontend: Next.js/React (Vercel hosting)

Backend: Supabase (Auth + Database)

Data Storage
PostgreSQL database via Supabase

Each user gets their own task data

Tasks include: title, description, deadline, column position

User Experience Flow
User signs up or logs in

Views empty board with three columns

Adds tasks to Queue column

Drags tasks to In Progress when working

Drags tasks to Completed when done

Uses search when many tasks exist

Exports data when needed

Logs out

Visual Design
Clean, minimal interface

Mobile responsive (columns stack on mobile)

Color-coded deadlines:

Red = overdue

Yellow = due today

Normal = future dates

What We're Not Building
Team collaboration

File attachments

Custom columns

Time tracking

Notifications

Undo button

Implementation Priority
User authentication + basic board

Task creation/editing/deletion

Drag and drop functionality

Search feature

Export feature

Mobile responsiveness

