export interface Conversation {
  id: number;
  title: string;
  updated_at: string;
  is_public?: boolean;
} 
import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}
export interface Conversation {
    id: number
    title: string
    updated_at: string
    user_id?: number
  }
  
export interface Chat {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type Language = 'en' | 'ar' | 'fr' | 'es' | 'de' | 'zh' | 'ja' | 'ru';

export interface Quiz {
    id: number;
    title: string;
    description: string;
    user_id: number;
    difficulty: 'easy' | 'medium' | 'hard';
    settings: {
        time_limit: number | null;
        enable_timer: boolean;
        question_count: number;
        layout: 'ltr' | 'rtl';
        language: Language;
    };
    questions_count: number;
    attempts?: QuizAttempt[];
    created_at: string;
    updated_at: string;
}

export interface QuizAttempt {
    id: number;
    quiz_id: number;
    user_id: number;
    score: number;
    time_taken: number;
    answers: Record<number, string>;
    created_at: string;
}

export interface Question {
    id: number
    quiz_id: number
    question_text: string
    question_type: string
    options: any
    correct_answer: string
    explanation: string | null
    order: number
    settings: any
    created_at: string
    updated_at: string
  
}

export interface Answer {
    id: number
    question_id: number
    answer_text: string
    is_correct: boolean
    created_at: string
    updated_at: string
  }