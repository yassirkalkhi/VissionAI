export type Language = 'en' | 'ar' | 'fr' | 'es' | 'de' | 'zh' | 'ja' | 'ru';

export interface Translations {
    timeRemaining: string;
    submit: string;
    next: string;
    previous: string;
    finish: string;
    score: string;
    correct: string;
    incorrect: string;
    explanation: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        timeRemaining: 'Time remaining',
        submit: 'Submit',
        next: 'Next',
        previous: 'Previous',
        finish: 'Finish',
        score: 'Score',
        correct: 'Correct',
        incorrect: 'Incorrect',
        explanation: 'Explanation'
    },
    ar: {
        timeRemaining: 'الوقت المتبقي',
        submit: 'إرسال',
        next: 'التالي',
        previous: 'السابق',
        finish: 'إنهاء',
        score: 'الدرجة',
        correct: 'صحيح',
        incorrect: 'خطأ',
        explanation: 'شرح'
    },
    fr: {
        timeRemaining: 'Temps restant',
        submit: 'Soumettre',
        next: 'Suivant',
        previous: 'Précédent',
        finish: 'Terminer',
        score: 'Score',
        correct: 'Correct',
        incorrect: 'Incorrect',
        explanation: 'Explication'
    },
    es: {
        timeRemaining: 'Tiempo restante',
        submit: 'Enviar',
        next: 'Siguiente',
        previous: 'Anterior',
        finish: 'Finalizar',
        score: 'Puntuación',
        correct: 'Correcto',
        incorrect: 'Incorrecto',
        explanation: 'Explicación'
    },
    de: {
        timeRemaining: 'Verbleibende Zeit',
        submit: 'Einreichen',
        next: 'Weiter',
        previous: 'Zurück',
        finish: 'Beenden',
        score: 'Punktzahl',
        correct: 'Richtig',
        incorrect: 'Falsch',
        explanation: 'Erklärung'
    },
    zh: {
        timeRemaining: '剩余时间',
        submit: '提交',
        next: '下一个',
        previous: '上一个',
        finish: '完成',
        score: '分数',
        correct: '正确',
        incorrect: '错误',
        explanation: '解释'
    },
    ja: {
        timeRemaining: '残り時間',
        submit: '提出',
        next: '次へ',
        previous: '前へ',
        finish: '終了',
        score: 'スコア',
        correct: '正解',
        incorrect: '不正解',
        explanation: '説明'
    },
    ru: {
        timeRemaining: 'Оставшееся время',
        submit: 'Отправить',
        next: 'Следующий',
        previous: 'Предыдущий',
        finish: 'Завершить',
        score: 'Счет',
        correct: 'Правильно',
        incorrect: 'Неправильно',
        explanation: 'Объяснение'
    }
}; 