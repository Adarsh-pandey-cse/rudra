## Overview

I have resolved your latest feature requests to improve file viewing capabilities across notes, homework, and doubts, and completely redesigned the Teacher Homework management interface to be perfectly clean and professional.

## Accomplishments

### 1. Teacher Homework Redesign
*   Replaced the bulky, unorganized grid cards with a highly professional, dense, and clean layout (inspired by modern sleek dashboards like Vercel/Notion).
*   **Top Row:** Cleanly integrated the subject icon alongside the title and an unobtrusive 3-dots actions menu.
*   **Middle Row (Badges):** Standardized all badges (Class, Status, Marks, AI Grading) into a tight, consistent row for instant glanceability.
*   **Bottom Row (Stats):** Aligned the due date and submission counts perfectly in a subtle bottom border row.
*   **Hover States:** Removed messy glowing gradients and replaced them with crisp border-highlight effects for a premium feel.

### 2. File Viewer Modal
*   Created a reusable <FileViewer> component that allows users to seamlessly view attachments.
*   **Image Features:** Added built-in zoom in/out, reset zoom, and 90-degree left/right rotate functionality for image viewing. Added full support for click-and-drag panning.
*   **PDF Features:** Replaced the default native <iframe> rendering for PDFs with https://docs.google.com/gview?embedded=true. This enables native pinch-to-zoom and panning on mobile iOS devices, fixing the issue where PDFs were not readable on phones.
*   Added one-click download buttons directly inside the modal UI.
*   Implemented this component across:
    *   Student Notes (src/app/dashboard/student/notes/page.tsx)
    *   Teacher Notes (src/app/dashboard/teacher/notes/page.tsx)
    *   Student Doubts (src/app/dashboard/student/doubts/[id]/page.tsx)
    *   Teacher Doubts (src/app/dashboard/teacher/doubts/[id]/page.tsx)
    *   Student Homework (src/app/dashboard/student/homework/[id]/page.tsx)

### 3. Inline File Viewer for Teacher Analytics
*   Created <InlineFileViewer> specifically for the Teacher Homework Analytics page (src/app/dashboard/teacher/homework/analytics/[id]/page.tsx).
*   Instead of opening a modal (which would cover up the teacher's grading and feedback form), the file preview happens directly in the center pane.
*   Teachers can now zoom, rotate, pan images, and read full PDFs natively while typing their feedback synchronously.

## Verification
*   Verified that all components build perfectly with 
pm run build without any syntax or TS errors.
*   Ensured mobile alignment with responsive absolute positioning for the action toolbars.
*   Verified that user-requested configurations (no automatic permission checks on our side) were strictly followed.

