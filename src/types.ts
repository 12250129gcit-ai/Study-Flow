/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  title: string;
  category: string;
  time?: string;
  dueDate?: string;
  durationMins: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface StudySession {
  id: string;
  type: 'focus' | 'break';
  subject: string;
  startTime: string; // HH:mm
  endTime?: string;
  durationMins: number; // For backward compatibility
  durationSecs: number; // New precise field
  date: string; // YYYY-MM-DD
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  email: string;
  bio: string;
  institution: string;
  grade: string;
  streak: number;
  lastStudyDate: string | null;
  onboarded: boolean;
}
