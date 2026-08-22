# Goal: Offline Test Marks Feature

Create a clean feature for teachers to input manual offline test marks (out of 20) for students, which directly increments their XP/points and affects ranking. Students will be able to view their test marks date-wise and subject-wise.

## Proposed Changes

### [Store Layer]

#### [NEW] src/store/testStore.ts
- Create a Zustand store persisted to local storage (or Firestore if needed, but local storage + leaderboard sync is standard for now in this app) to hold TestMark records.
- Fields: id, studentId, 	eacherId, subjectId, classId, marks (number), maxMarks (number = 20), date (ISO string), createdAt.
- Actions: ddTestMark, deleteTestMark, getMarksForStudent, getMarksForClass.
- When ddTestMark is called, it will also call useLeaderboardStore.getState().addPoints(studentId, marks, "Offline Test") to directly increment their leaderboard points.

### [Teacher Dashboard]

#### [MODIFY] src/components/layout/DashboardLayout.tsx
- Add a new sidebar menu item for Teachers: Offline Tests (icon: PenTool or FileSpreadsheet) pointing to /dashboard/teacher/tests.
- Add a new sidebar menu item for Students: Test Marks (icon: FileSpreadsheet) pointing to /dashboard/student/tests.

#### [NEW] src/app/dashboard/teacher/tests/page.tsx
- Create a clean and professional UI where the teacher can:
  1. Select a Class
  2. Select a Subject
  3. View a list of students in that class.
- For each student, display an input field to enter marks out of 20.
- A "Save Marks" button that commits the marks to the 	estStore and increments the student's XP automatically.
- A "Recent Test Marks" section below to view/delete recently added marks.

### [Student Dashboard]

#### [NEW] src/app/dashboard/student/tests/page.tsx
- Create a clean student-facing page showing their history of offline test marks.
- The UI will group or list the marks date-wise and subject-wise.
- Use a polished list view showing the score (e.g., 18/20), date, and subject name, along with a visual indicator (like a progress ring or color-coding based on the score).

## Verification Plan
- Verify that saving a test mark adds it to the list.
- Verify that saving a test mark correctly increases the student's leaderboard points by the exact mark entered.
- Verify that the student can see the test mark in their dashboard correctly aligned date-wise and subject-wise.
