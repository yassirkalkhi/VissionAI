export type Language = 'en' | 'ar' | 'fr' | 'de' | 'it' | 'zh';

export interface Translations {
    // Common UI Elements
    send: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    loading: string;
    error: string;
    success: string;
    
    // Navigation & Headers
    newChat: string;
    conversations: string;
    settings: string;
    profile: string;
    logout: string;
    documentation: string;
    
    // Chat Interface
    typeMessage: string;
    attachFile: string;
    pressEnterToSend: string;
    pressCtrlEnterNewLine: string;
    thinking: string;
    processing: string;
    
    // File Upload
    uploadImage: string;
    removeImage: string;
    imageUploadTips: string;
    maxFileSize: string;
    supportedFormats: string;
    maxImages: string;
    
    // Code Snippets
    codeSnippet: string;
    copyCode: string;
    copied: string;
    preview: string;
    remove: string;
    
    // Getting Started Section
    gettingStarted: string;
    welcome: string;
    welcomeMessage: string;
    startNewChat: string;
    askQuestion: string;
    
    // Tips & Features
    tips: string;
    imageAnalysis: string;
    codeSupport: string;
    keyboardShortcuts: string;
    
    // Image Processing
    extractingText: string;
    textExtracted: string;
    extractionFailed: string;
    
    // Error Messages
    connectionError: string;
    uploadError: string;
    tryAgain: string;
    
    // Quiz Related
    quizzes: string;
    yourQuizzes: string;
    manageQuizzes: string;
    createQuiz: string;
    editQuiz: string;
    deleteQuiz: string;
    confirmDelete: string;
    questionCount: string;
    difficulty: string;
    timeLimit: string;
    enableTimer: string;
    title: string;
    description: string;
    easy: string;
    medium: string;
    hard: string;
    noLimit: string;
    minutes: string;
    startQuiz: string;
    submissions: string;
    noSubmissions: string;
    correctAnswers: string;
    timeTaken: string;
    dropFilesHere: string;
    dropToUpload: string;
    clickToUpload: string;
    unsupportedFormat: string;
    textPreview: string;
    confirmFile: string;
    skipFile: string;
    createFromDocument: string;
    search: string;
    filterBy: string;
    allDifficulties: string;
    actions: string;
    editQuizDescription: string;
    timeRemaining: string;
    submit: string;
    submitted : string;
    score: string;
    finish: string;
    correct: string;
    incorrect: string;
    explanation: string;
    question : string,
    overview : string;
    viewOverview : string;

    
    // Additional Quiz Properties needed for Create.tsx
    maxFilesAllowed: string;
    uploadSupportedFormats: string;
    noTextExtracted: string;
    checkReadableText: string;
    pdfExtractionFailed: string;
    docLegacyNotSupported: string;
    documentExtractionFailed: string;
    imageExtractionFailed: string;
    fileTooLarge: string;
    fileInvalidType: string;
    noContentExtracted: string;
    pleaseUploadFile: string;
    quizCreatedSuccess: string;
    failedToCreate: string;
    errorCreatingQuiz: string;
    filesTooLarge: string;
    notAuthorized: string;
    serverError: string;
    requestTimeout: string;
    unexpectedError: string;
    createNewQuiz: string;
    uploadDocumentsDescription: string;
    quizSettings: string;
    configurePreferences: string;
    selectDifficulty: string;
    timer: string;
    timePerQuestion: string;
    quizNoTimeLimit: string;
    totalQuizTime: string;
    basedOn: string;
    questions: string;
    minutesPerQuestion: string;
    uploadContent: string;
    uploadContentDescription: string;
    processingFiles: string;
    reviewCurrentFile: string;
    maxFilesReached: string;
    supportedFormatsExtended: string;
    maxFileSizeExtended: string;
    uploadedFiles: string;
    creatingQuiz: string;
    reviewExtractedText: string;
    
    // Conversation visibility
    shareConversation: string;
    makePublic: string;
    publicConversationNote: string;
    privateConversationNote: string;
    viewOnlyMode: string;
    noConversationFound: string;
    
    // New properties for visibility
    madePublic: string;
    madePrivate: string;
    visibilityChangeError: string;
    
    // Pagination
    showing: string;
    of: string;
    noQuizzesFound: string;
    tryDifferentSearch: string;
    previous: string;
    next: string;
    
    // Sidebar conversation categories
    recentConversations: string;
    yesterday: string;
    last7Days: string;
    last30Days: string;
    older: string;
    noConversationsYet: string;
    
    // Conversation actions
    rename: string;
    share: string;
    
    // Dialog actions and titles
    renameConversation: string;
    enterConversationName: string;
    deleteConversation: string;
    deleteConversationConfirm: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        // Common UI Elements
        send: 'Send',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        loading: 'Loading',
        error: 'Error',
        success: 'Success',
        
        // Navigation & Headers
        newChat: 'New Chat',
        conversations: 'Conversations',
        settings: 'Settings',
        profile: 'Profile',
        logout: 'Logout',
        documentation: 'Documentation',
        
        // Chat Interface
        typeMessage: 'Type a message...',
        attachFile: 'Attach file',
        pressEnterToSend: 'Press Enter to send',
        pressCtrlEnterNewLine: 'Press Ctrl+Enter for new line',
        thinking: 'Thinking',
        processing: 'Processing',
        
        // File Upload
        uploadImage: 'Upload Image',
        removeImage: 'Remove Image',
        imageUploadTips: 'Image Upload Tips',
        maxFileSize: 'Maximum file size: 5MB',
        supportedFormats: 'Supported formats: JPEG, PNG, GIF, WebP, SVG',
        maxImages: 'Maximum 3 images per message',
        
        // Code Snippets
        codeSnippet: 'Code Snippet',
        copyCode: 'Copy Code',
        copied: 'Copied!',
        preview: 'Preview',
        remove: 'Remove',
        
        // Getting Started Section
        gettingStarted: 'Getting Started',
        welcome: 'Welcome to VisionAI',
        welcomeMessage: 'Ask a question or upload an image to get started',
        startNewChat: 'Start a New Chat',
        askQuestion: 'Ask a question',
        
        // Tips & Features
        tips: 'Tips & Tricks',
        imageAnalysis: 'Enhanced Image Analysis',
        codeSupport: 'Code Snippet Support',
        keyboardShortcuts: 'Keyboard Shortcuts',
        
        // Image Processing
        extractingText: 'Extracting text',
        textExtracted: 'Text extracted',
        extractionFailed: 'Text extraction failed',
        
        // Error Messages
        connectionError: 'Connection error',
        uploadError: 'Upload failed',
        tryAgain: 'Please try again',
        
        // Quiz Related
        quizzes: 'Quizzes',
        yourQuizzes: 'Your Quizzes',
        manageQuizzes: 'Manage and take your quizzes',
        createQuiz: 'Create Quiz',
        editQuiz: 'Edit Quiz',
        deleteQuiz: 'Delete Quiz',
        confirmDelete: 'Are you sure you want to delete this quiz?',
        questionCount: 'Question Count',
        difficulty: 'Difficulty',
        timeLimit: 'Time Limit',
        enableTimer: 'Enable Timer',
        title: 'Title',
        description: 'Description',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        noLimit: 'No limit',
        minutes: 'min',
        startQuiz: 'Start Quiz',
        submissions: 'Submissions',
        noSubmissions: 'No submissions yet',
        correctAnswers: 'Correct answers',
        timeTaken: 'Time taken',
        dropFilesHere: 'Drop files here',
        dropToUpload: 'Drop files to upload',
        clickToUpload: 'or click to upload',
        unsupportedFormat: 'Unsupported file format',
        textPreview: 'Text Preview',
        confirmFile: 'Confirm',
        skipFile: 'Skip',
        createFromDocument: 'Create from Document',
        search: 'Search',
        filterBy: 'Filter by',
        allDifficulties: 'All Difficulties',
        actions: 'Actions',
        editQuizDescription: 'Make changes to your quiz settings here',
        timeRemaining: 'Time remaining',
        submit: 'Submit',
        submitted : 'Submitted',
        finish: 'Finish',
        score: 'Score',
        correct: 'Correct',
        incorrect: 'Incorrect',
        explanation: 'Explanation',
        question: 'Question',
        overview : 'Overview',
        viewOverview : 'View Overview',
        
        // Additional Quiz Properties for Create.tsx
        maxFilesAllowed: 'Maximum 5 files allowed',
        uploadSupportedFormats: 'Please upload files in supported formats',
        noTextExtracted: 'No text could be extracted from',
        checkReadableText: 'Please check that the file contains readable text',
        pdfExtractionFailed: 'Failed to extract text from PDF file',
        docLegacyNotSupported: 'Legacy .doc files are not supported, please convert to .docx',
        documentExtractionFailed: 'Failed to extract text from document',
        imageExtractionFailed: 'Failed to extract text from image',
        fileTooLarge: 'is too large (10MB max)',
        fileInvalidType: 'has an invalid file type',
        noContentExtracted: 'No content was extracted from the files. Please try again with different files.',
        pleaseUploadFile: 'Please upload at least one file',
        quizCreatedSuccess: 'Quiz created successfully!',
        failedToCreate: 'Failed to create quiz',
        errorCreatingQuiz: 'Error creating quiz. Please check your inputs and try again.',
        filesTooLarge: 'One or more files are too large',
        notAuthorized: 'You are not authorized to perform this action',
        serverError: 'Server error',
        requestTimeout: 'Request timed out. Please try again.',
        unexpectedError: 'An unexpected error occurred. Please try again.',
        createNewQuiz: 'Create New Quiz',
        uploadDocumentsDescription: 'Upload documents, images, or PDFs to create quiz questions from their content',
        quizSettings: 'Quiz Settings',
        configurePreferences: 'Configure your quiz preferences',
        selectDifficulty: 'Select difficulty',
        timer: 'Timer',
        timePerQuestion: 'Time per question',
        quizNoTimeLimit: 'Quiz will have no time limit',
        totalQuizTime: 'Total quiz time',
        basedOn: 'Based on',
        questions: 'questions',
        minutesPerQuestion: 'minutes per question',
        uploadContent: 'Upload Content',
        uploadContentDescription: 'Upload documents to extract content for your quiz',
        processingFiles: 'Processing files...',
        reviewCurrentFile: 'Please review the current file',
        maxFilesReached: 'Maximum number of files reached (5)',
        supportedFormatsExtended: 'Supported formats: PDF, DOCX, JPG, PNG',
        maxFileSizeExtended: 'Maximum file size: 10MB per file',
        uploadedFiles: 'Uploaded Files',
        creatingQuiz: 'Creating Quiz...',
        reviewExtractedText: 'Review the extracted text from',
        
        // Conversation visibility
        shareConversation: 'Share Conversation',
        makePublic: 'Make conversation public',
        publicConversationNote: 'Anyone with the link can view this conversation.',
        privateConversationNote: 'This conversation is private. Make it public to share.',
        viewOnlyMode: 'View-only mode',
        noConversationFound: 'No conversation found',
        
        // New properties for visibility
        madePublic: 'Conversation is now public',
        madePrivate: 'Conversation is now private',
        visibilityChangeError: 'Failed to change visibility',
        
        // Pagination
        showing: 'Showing',
        of: 'of',
        noQuizzesFound: 'No quizzes found',
        tryDifferentSearch: 'Try a different search term or clear filters',
        previous: 'Previous',
        next: 'Next',
        
        // Sidebar conversation categories
        recentConversations: 'Recent Conversations',
        yesterday: 'Yesterday',
        last7Days: 'Last 7 days',
        last30Days: 'Last 30 days',
        older: 'Older',
        noConversationsYet: 'No conversations yet',
        
        // Conversation actions
        rename: 'Rename',
        share: 'Share',
        
        // Dialog actions and titles
        renameConversation: 'Rename Conversation',
        enterConversationName: 'Enter conversation name',
        deleteConversation: 'Delete Conversation',
        deleteConversationConfirm: 'Are you sure you want to delete this conversation? This action cannot be undone.',
    },
    ar: {
        // Common UI Elements
        send: 'إرسال',
        cancel: 'إلغاء',
        save: 'حفظ',
        delete: 'حذف',
        edit: 'تعديل',
        close: 'إغلاق',
        loading: 'جاري التحميل',
        error: 'خطأ',
        success: 'نجاح',
        
        // Navigation & Headers
        newChat: 'محادثة جديدة',
        conversations: 'المحادثات',
        settings: 'الإعدادات',
        profile: 'الملف الشخصي',
        logout: 'تسجيل الخروج',
        documentation: 'الوثائق',
        
        // Chat Interface
        typeMessage: 'اكتب رسالة...',
        attachFile: 'إرفاق ملف',
        pressEnterToSend: 'اضغط Enter للإرسال',
        pressCtrlEnterNewLine: 'اضغط Ctrl+Enter لسطر جديد',
        thinking: 'يفكر',
        processing: 'جاري المعالجة',
    
        
        // File Upload
        uploadImage: 'رفع صورة',
        removeImage: 'إزالة الصورة',
        imageUploadTips: 'نصائح رفع الصور',
        maxFileSize: 'الحد الأقصى لحجم الملف: 5 ميجابايت',
        supportedFormats: 'الصيغ المدعومة: JPEG، PNG، GIF، WebP، SVG',
        maxImages: 'الحد الأقصى 3 صور لكل رسالة',
        
        // Code Snippets
        codeSnippet: 'مقتطف برمجي',
        copyCode: 'نسخ الكود',
        copied: 'تم النسخ!',
        preview: 'معاينة',
        remove: 'إزالة',
        
        // Getting Started Section
        gettingStarted: 'البداية',
        welcome: 'مرحباً بك في VisionAI',
        welcomeMessage: 'اطرح سؤالاً أو ارفع صورة للبدء',
        startNewChat: 'بدء محادثة جديدة',
        askQuestion: 'اطرح سؤالاً',
        
        // Tips & Features
        tips: 'نصائح وحيل',
        imageAnalysis: 'تحليل الصور المحسن',
        codeSupport: 'دعم مقتطفات البرمجة',
        keyboardShortcuts: 'اختصارات لوحة المفاتيح',
        
        // Image Processing
        extractingText: 'جاري استخراج النص',
        textExtracted: 'تم استخراج النص',
        extractionFailed: 'فشل استخراج النص',
        
        // Error Messages
        connectionError: 'خطأ في الاتصال',
        uploadError: 'فشل الرفع',
        tryAgain: 'يرجى المحاولة مرة أخرى',
        
        // Quiz Related
        quizzes: 'الاختبارات',
        yourQuizzes: 'اختباراتك',
        manageQuizzes: 'إدارة وأخذ الاختبارات',
        createQuiz: 'إنشاء اختبار',
        editQuiz: 'تعديل الاختبار',
        deleteQuiz: 'حذف الاختبار',
        confirmDelete: 'هل أنت متأكد من حذف هذا الاختبار؟',
        questionCount: 'عدد الأسئلة',
        difficulty: 'الصعوبة',
        timeLimit: 'الوقت المحدد',
        enableTimer: 'تفعيل المؤقت',
        title: 'العنوان',
        description: 'الوصف',
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        noLimit: 'بدون حد',
        minutes: 'دقيقة',
        startQuiz: 'بدء الاختبار',
        submissions: 'التقديمات',
        noSubmissions: 'لا توجد تقديمات حتى الآن',
        correctAnswers: 'الإجابات الصحيحة',
        timeTaken: 'الوقت المستغرق',
        dropFilesHere: 'أسقط الملفات هنا',
        dropToUpload: 'أسقط الملفات للتحميل',
        clickToUpload: 'أو انقر للتحميل',
        unsupportedFormat: 'تنسيق ملف غير مدعوم',
        textPreview: 'معاينة النص',
        confirmFile: 'تأكيد',
        skipFile: 'تخطي',
        createFromDocument: 'إنشاء من مستند',
        search: 'بحث',
        filterBy: 'تصفية حسب',
        allDifficulties: 'جميع المستويات',
        actions: 'إجراءات',
        editQuizDescription: 'قم بإجراء تغييرات على إعدادات الاختبار هنا',
        timeRemaining: 'الوقت المتبقي',
        submit: 'إرسال',
        finish: 'إنهاء',
        score: 'الدرجة',
        submitted : 'تم الإرسال',
        correct: 'صحيح',
        incorrect: 'خطأ',
        explanation: 'شرح',
        question: 'السؤال',
        overview : 'نظرة عامة',
        viewOverview : 'عرض النظرة العامة',
        
        // Additional Quiz Properties for Create.tsx
        maxFilesAllowed: 'الحد الأقصى 5 ملفات مسموحة',
        uploadSupportedFormats: 'يرجى رفع الملفات بتنسيقات مدعومة',
        noTextExtracted: 'لم يتم استخراج نص من',
        checkReadableText: 'يرجى التحقق من أن الملف يحتوي على نص قابل للقراءة',
        pdfExtractionFailed: 'فشل استخراج النص من ملف PDF',
        docLegacyNotSupported: 'ملفات .doc التقليدية ليست مدعومة، يرجى تحويلها إلى .docx',
        documentExtractionFailed: 'فشل استخراج النص من المستند',
        imageExtractionFailed: 'فشل استخراج النص من الصورة',
        fileTooLarge: 'ثقيل جداً (حد أقصى 10MB)',
        fileInvalidType: 'له نوع ملف غير صالح',
        noContentExtracted: 'لم يتم استخراج محتوى من الملفات. يرجى المحاولة مرة أخرى مع ملفات مختلفة.',
        pleaseUploadFile: 'يرجى رفع ملف واحد على الأقل',
        quizCreatedSuccess: 'تم إنشاء الاختبار بنجاح!',
        failedToCreate: 'فشل إنشاء الاختبار',
        errorCreatingQuiz: 'خطأ إنشاء الاختبار. يرجى التحقق من مدخلاتك وإعادة المحاولة.',
        filesTooLarge: 'إحدى الملفات ثقيلة جداً',
        notAuthorized: 'أنت غير مصرح بإجراء هذا الإجراء',
        serverError: 'خطأ الخادم',
        requestTimeout: 'انتهت صلاحية الطلب. يرجى المحاولة مرة أخرى.',
        unexpectedError: 'أظهر خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
        createNewQuiz: 'إنشاء اختبار جديد',
        uploadDocumentsDescription: 'رفع مستندات، صور، أو ملفات PDF لإنشاء أسئلة اختبار من محتواها',
        quizSettings: 'إعدادات الاختبار',
        configurePreferences: 'تكوين تفضيلات الاختبار',
        selectDifficulty: 'اختيار الصعوبة',
        timer: 'الموقت',
        timePerQuestion: 'الوقت لكل سؤال',
        quizNoTimeLimit: 'سيكون الاختبار بدون حد زمني',
        totalQuizTime: 'مدة الاختبار الكلية',
        basedOn: 'مبني على',
        questions: 'الأسئلة',
        minutesPerQuestion: 'دقائق لكل سؤال',
        uploadContent: 'رفع المحتوى',
        uploadContentDescription: 'رفع مستندات لاستخراج محتوى لاختبارك',
        processingFiles: 'معالجة الملفات...',
        reviewCurrentFile: 'يرجى مراجعة الملف الحالي',
        maxFilesReached: 'تم الوصول إلى عدد الملفات الأقصى (5)',
        supportedFormatsExtended: 'التنسيقات المدعومة: PDF، DOCX، JPG، PNG',
        maxFileSizeExtended: 'حد أقصى لحجم الملف: 10MB لكل ملف',
        uploadedFiles: 'الملفات المرفوعة',
        creatingQuiz: 'إنشاء الاختبار...',
        reviewExtractedText: 'مراجعة النص المستخرج من',
        
        // Conversation visibility
        shareConversation: 'مشاركة المحادثة',
        makePublic: 'جعل المحادثة عامة',
        publicConversationNote: 'يمكن لأي شخص لديه الرابط عرض هذه المحادثة.',
        privateConversationNote: 'هذه المحادثة خاصة. اجعلها عامة للمشاركة.',
        viewOnlyMode: 'وضع العرض فقط',
        noConversationFound: 'لم يتم العثور على محادثة',
        
        // New properties for visibility
        madePublic: 'المحادثة أصبحت عامة الآن',
        madePrivate: 'المحادثة أصبحت خاصة الآن',
        visibilityChangeError: 'فشل في تغيير حالة الرؤية',
        
        // Pagination
        showing: 'عرض',
        of: 'من',
        noQuizzesFound: 'لم يتم العثور على اختبارات',
        tryDifferentSearch: 'جرب مصطلح بحث مختلف أو امسح المرشحات',
        previous: 'السابق',
        next: 'التالي',
        
        // Sidebar conversation categories
        recentConversations: 'المحادثات الأخيرة',
        yesterday: 'الأمس',
        last7Days: 'آخر 7 أيام',
        last30Days: 'آخر 30 يوم',
        older: 'أقدم',
        noConversationsYet: 'لا توجد محادثات بعد',
        
        // Conversation actions
        rename: 'إعادة تسمية',
        share: 'مشاركة',
        
        // Dialog actions and titles
        renameConversation: 'إعادة تسمية المحادثة',
        enterConversationName: 'أدخل اسم المحادثة',
        deleteConversation: 'حذف المحادثة',
        deleteConversationConfirm: 'هل أنت متأكد أنك تريد حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.',
    },
    fr: {
        // Common UI Elements
        send: 'Envoyer',
        cancel: 'Annuler',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        close: 'Fermer',
        loading: 'Chargement',
        error: 'Erreur',
        success: 'Succès',
        
        // Navigation & Headers
        newChat: 'Nouvelle Discussion',
        conversations: 'Conversations',
        settings: 'Paramètres',
        profile: 'Profil',
        logout: 'Déconnexion',
        documentation: 'Documentation',
        
        // Chat Interface
        typeMessage: 'Écrivez un message...',
        attachFile: 'Joindre un fichier',
        pressEnterToSend: 'Appuyez sur Entrée pour envoyer',
        pressCtrlEnterNewLine: 'Appuyez sur Ctrl+Entrée pour une nouvelle ligne',
        thinking: 'Réflexion',
        processing: 'Traitement',
        
        // File Upload
        uploadImage: 'Télécharger une image',
        removeImage: 'Supprimer l\'image',
        imageUploadTips: 'Conseils pour le téléchargement d\'images',
        maxFileSize: 'Taille maximale du fichier : 5 Mo',
        supportedFormats: 'Formats supportés : JPEG, PNG, GIF, WebP, SVG',
        maxImages: 'Maximum 3 images par message',
        
        // Code Snippets
        codeSnippet: 'Extrait de code',
        copyCode: 'Copier le code',
        copied: 'Copié !',
        preview: 'Aperçu',
        remove: 'Supprimer',
        
        // Getting Started Section
        gettingStarted: 'Commencer',
        welcome: 'Bienvenue sur VisionAI',
        welcomeMessage: 'Posez une question ou téléchargez une image pour commencer',
        startNewChat: 'Démarrer une nouvelle discussion',
        askQuestion: 'Poser une question',
        
        // Tips & Features
        tips: 'Conseils et astuces',
        imageAnalysis: 'Analyse d\'image améliorée',
        codeSupport: 'Support des extraits de code',
        keyboardShortcuts: 'Raccourcis clavier',
        
        // Image Processing
        extractingText: 'Extraction du texte',
        textExtracted: 'Texte extrait',
        extractionFailed: 'Échec de l\'extraction',
        
        // Error Messages
        connectionError: 'Erreur de connexion',
        uploadError: 'Échec du téléchargement',
        tryAgain: 'Veuillez réessayer',
        
        // Quiz Related
        quizzes: 'Quiz',
        yourQuizzes: 'Vos Quiz',
        manageQuizzes: 'Gérer et passer vos quiz',
        createQuiz: 'Créer un Quiz',
        editQuiz: 'Modifier le Quiz',
        deleteQuiz: 'Supprimer le Quiz',
        confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce quiz ?',
        questionCount: 'Nombre de questions',
        difficulty: 'Difficulté',
        timeLimit: 'Limite de temps',
        enableTimer: 'Activer le minuteur',
        title: 'Titre',
        description: 'Description',
        easy: 'Facile',
        medium: 'Moyen',
        hard: 'Difficile',
        noLimit: 'Sans limite',
        minutes: 'min',
        startQuiz: 'Commencer le Quiz',
        submissions: 'Soumissions',
        noSubmissions: 'Pas encore de soumissions',
        correctAnswers: 'Réponses correctes',
        timeTaken: 'Temps pris',
        dropFilesHere: 'Déposez les fichiers ici',
        dropToUpload: 'Déposez les fichiers pour télécharger',
        clickToUpload: 'ou cliquez pour télécharger',
        unsupportedFormat: 'Format de fichier non pris en charge',
        textPreview: 'Aperçu du texte',
        confirmFile: 'Confirmer',
        skipFile: 'Ignorer',
        createFromDocument: 'Créer à partir d\'un document',
        search: 'Rechercher',
        filterBy: 'Filtrer par',
        allDifficulties: 'Toutes les difficultés',
        actions: 'Actions',
        editQuizDescription: 'Apportez des modifications aux paramètres de votre quiz ici',
        timeRemaining: 'Temps restant',
        submit: 'Soumettre',
        finish: 'Terminer',
        score: 'Score',
        submitted : 'Soumis',
        correct: 'Correct',
        incorrect: 'Incorrect',
        explanation: 'Explication',
        question: 'Question',
        overview : 'Aperçu',
        viewOverview : 'Voir l\'aperçu',
        
        // Additional Quiz Properties for Create.tsx
        maxFilesAllowed: 'Maximum 5 fichiers autorisés',
        uploadSupportedFormats: 'Veuillez télécharger des fichiers dans des formats pris en charge',
        noTextExtracted: 'Aucun texte n\'a pu être extrait de',
        checkReadableText: 'Veuillez vérifier que le fichier contient du texte lisible',
        pdfExtractionFailed: 'Échec de l\'extraction du texte à partir du fichier PDF',
        docLegacyNotSupported: 'Les fichiers .doc hérités ne sont pas pris en charge, veuillez les convertir en .docx',
        documentExtractionFailed: 'Échec de l\'extraction du texte à partir du document',
        imageExtractionFailed: 'Échec de l\'extraction du texte à partir de l\'image',
        fileTooLarge: 'est trop volumineux (10MB max)',
        fileInvalidType: 'a un type de fichier non valide',
        noContentExtracted: 'Aucun contenu n\'a été extrait des fichiers. Veuillez réessayer avec différents fichiers.',
        pleaseUploadFile: 'Veuillez télécharger au moins un fichier',
        quizCreatedSuccess: 'Quiz créé avec succès !',
        failedToCreate: 'Échec de la création du quiz',
        errorCreatingQuiz: 'Erreur lors de la création du quiz. Veuillez vérifier vos entrées et réessayer.',
        filesTooLarge: 'Un ou plusieurs fichiers sont trop volumineux',
        notAuthorized: 'Vous n\'êtes pas autorisé à effectuer cette action',
        serverError: 'Erreur de serveur',
        requestTimeout: 'La demande a expiré. Veuillez réessayer.',
        unexpectedError: 'Une erreur inattendue est survenue. Veuillez réessayer.',
        createNewQuiz: 'Créer un nouveau quiz',
        uploadDocumentsDescription: 'Télécharger des documents, des images ou des fichiers PDF pour créer des questions de quiz à partir de leur contenu',
        quizSettings: 'Paramètres du quiz',
        configurePreferences: 'Configurer vos préférences de quiz',
        selectDifficulty: 'Sélectionner la difficulté',
        timer: 'Minuteur',
        timePerQuestion: 'Temps par question',
        quizNoTimeLimit: 'Le quiz n\'aura pas de limite de temps',
        totalQuizTime: 'Temps total du quiz',
        basedOn: 'Basé sur',
        questions: 'questions',
        minutesPerQuestion: 'minutes par question',
        uploadContent: 'Télécharger le contenu',
        uploadContentDescription: 'Télécharger des documents pour extraire le contenu de votre quiz',
        processingFiles: 'Traitement des fichiers...',
        reviewCurrentFile: 'Veuillez examiner le fichier actuel',
        maxFilesReached: 'Nombre maximum de fichiers atteint (5)',
        supportedFormatsExtended: 'Formats supportés : PDF, DOCX, JPG, PNG',
        maxFileSizeExtended: 'Taille maximale du fichier : 10MB par fichier',
        uploadedFiles: 'Fichiers téléchargés',
        creatingQuiz: 'Création du quiz...',
        reviewExtractedText: 'Examiner le texte extrait de',
        
        // Conversation visibility
        shareConversation: 'Partager la conversation',
        makePublic: 'Rendre la conversation publique',
        publicConversationNote: 'Toute personne disposant du lien peut visualiser cette conversation.',
        privateConversationNote: 'Cette conversation est privée. Rendez-la publique pour la partager.',
        viewOnlyMode: 'Mode lecture seule',
        noConversationFound: 'Aucune conversation trouvée',
        
        // Visibility state feedback
        madePublic: 'La conversation est maintenant publique',
        madePrivate: 'La conversation est maintenant privée',
        visibilityChangeError: 'Échec du changement de visibilité',
        
        // Pagination
        showing: 'Affichage',
        of: 'sur',
        noQuizzesFound: 'Aucun quiz trouvé',
        tryDifferentSearch: 'Essayez un terme de recherche différent ou effacez les filtres',
        previous: 'Précédent',
        next: 'Suivant',
        
        // Sidebar conversation categories
        recentConversations: 'Conversations récentes',
        yesterday: 'Hier',
        last7Days: '7 derniers jours',
        last30Days: '30 derniers jours',
        older: 'Plus ancien',
        noConversationsYet: 'Pas encore de conversations',
        
        // Conversation actions
        rename: 'Renommer',
        share: 'Partager',
        
        // Dialog actions and titles
        renameConversation: 'Renommer la conversation',
        enterConversationName: 'Entrez le nom de la conversation',
        deleteConversation: 'Supprimer la conversation',
        deleteConversationConfirm: 'Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action ne peut pas être annulée.',
    },
    de: {
        // Common UI Elements
        send: 'Senden',
        cancel: 'Abbrechen',
        save: 'Speichern',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        close: 'Schließen',
        loading: 'Laden',
        error: 'Fehler',
        success: 'Erfolg',
        
        // Navigation & Headers
        newChat: 'Neuer Chat',
        conversations: 'Gespräche',
        settings: 'Einstellungen',
        profile: 'Profil',
        logout: 'Abmelden',
        documentation: 'Dokumentation',
        
        // Chat Interface
        typeMessage: 'Nachricht eingeben...',
        attachFile: 'Datei anhängen',
        pressEnterToSend: 'Enter zum Senden drücken',
        pressCtrlEnterNewLine: 'Strg+Enter für neue Zeile',
        thinking: 'Denken',
        processing: 'Verarbeitung',
        
        // File Upload
        uploadImage: 'Bild hochladen',
        removeImage: 'Bild entfernen',
        imageUploadTips: 'Tipps zum Bildupload',
        maxFileSize: 'Maximale Dateigröße: 5MB',
        supportedFormats: 'Unterstützte Formate: JPEG, PNG, GIF, WebP, SVG',
        maxImages: 'Maximal 3 Bilder pro Nachricht',
        
        // Code Snippets
        codeSnippet: 'Code-Snippet',
        copyCode: 'Code kopieren',
        copied: 'Kopiert!',
        preview: 'Vorschau',
        remove: 'Entfernen',
        
        // Getting Started Section
        gettingStarted: 'Erste Schritte',
        welcome: 'Willkommen bei VisionAI',
        welcomeMessage: 'Stellen Sie eine Frage oder laden Sie ein Bild hoch',
        startNewChat: 'Neuen Chat starten',
        askQuestion: 'Frage stellen',
        
        // Tips & Features
        tips: 'Tipps & Tricks',
        imageAnalysis: 'Verbesserte Bildanalyse',
        codeSupport: 'Code-Snippet Unterstützung',
        keyboardShortcuts: 'Tastenkombinationen',
        
        // Image Processing
        extractingText: 'Text wird extrahiert',
        textExtracted: 'Text extrahiert',
        extractionFailed: 'Textextraktion fehlgeschlagen',
        
        // Error Messages
        connectionError: 'Verbindungsfehler',
        uploadError: 'Upload fehlgeschlagen',
        tryAgain: 'Bitte versuchen Sie es erneut',
        
        // Quiz Related
        quizzes: 'Quiz',
        yourQuizzes: 'Ihre Quiz',
        manageQuizzes: 'Verwalten und absolvieren Sie Ihre Quiz',
        createQuiz: 'Quiz erstellen',
        editQuiz: 'Quiz bearbeiten',
        deleteQuiz: 'Quiz löschen',
        confirmDelete: 'Sind Sie sicher, dass Sie dieses Quiz löschen möchten?',
        questionCount: 'Anzahl der Fragen',
        difficulty: 'Schwierigkeit',
        timeLimit: 'Zeitlimit',
        enableTimer: 'Timer aktivieren',
        title: 'Titel',
        description: 'Beschreibung',
        easy: 'Leicht',
        medium: 'Mittel',
        hard: 'Schwer',
        noLimit: 'Kein Limit',
        minutes: 'Min',
        startQuiz: 'Quiz starten',
        submissions: 'Einreichungen',
        noSubmissions: 'Noch keine Einreichungen',
        correctAnswers: 'Richtige Antworten',
        timeTaken: 'Benötigte Zeit',
        dropFilesHere: 'Dateien hier ablegen',
        dropToUpload: 'Dateien zum Hochladen ablegen',
        clickToUpload: 'oder klicken zum Hochladen',
        unsupportedFormat: 'Nicht unterstütztes Dateiformat',
        textPreview: 'Textvorschau',
        confirmFile: 'Bestätigen',
        skipFile: 'Überspringen',
        createFromDocument: 'Aus Dokument erstellen',
        search: 'Suchen',
        filterBy: 'Filtern nach',
        allDifficulties: 'Alle Schwierigkeiten',
        actions: 'Aktionen',
        editQuizDescription: 'Änderungen an den Quiz-Einstellungen hier vornehmen',
        timeRemaining: 'Verbleibende Zeit',
        submit: 'Einreichen',
        finish: 'Beenden',
        score: 'Punktzahl',
        submitted : 'Eingereicht',
        correct: 'Richtig',
        incorrect: 'Falsch',
        explanation: 'Erklärung',
        question: 'Frage',
        overview : 'Übersicht',
        viewOverview : 'Übersicht anzeigen',
        
        // Additional Quiz Properties for Create.tsx
        maxFilesAllowed: 'Maximum 5 Dateien erlaubt',
        uploadSupportedFormats: 'Bitte laden Sie Dateien in unterstützten Formaten hoch',
        noTextExtracted: 'Kein Text konnte aus',
        checkReadableText: 'Bitte überprüfen Sie, ob der Datei lesbarer Text enthalten ist',
        pdfExtractionFailed: 'Text aus PDF-Datei konnte nicht extrahiert werden',
        docLegacyNotSupported: 'Legacy .doc-Dateien werden nicht unterstützt, bitte konvertieren Sie sie in .docx',
        documentExtractionFailed: 'Text aus Dokument konnte nicht extrahiert werden',
        imageExtractionFailed: 'Text aus Bild konnte nicht extrahiert werden',
        fileTooLarge: 'ist zu groß (max. 10MB)',
        fileInvalidType: 'hat einen ungültigen Dateityp',
        noContentExtracted: 'Kein Inhalt konnte aus den Dateien extrahiert werden. Bitte versuchen Sie es erneut mit anderen Dateien.',
        pleaseUploadFile: 'Bitte laden Sie mindestens eine Datei hoch',
        quizCreatedSuccess: 'Quiz erstellt!',
        failedToCreate: 'Quiz konnte nicht erstellt werden',
        errorCreatingQuiz: 'Fehler beim Erstellen des Quiz. Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.',
        filesTooLarge: 'Eine oder mehrere Dateien sind zu groß',
        notAuthorized: 'Sie sind nicht berechtigt, diese Aktion auszuführen',
        serverError: 'Serverfehler',
        requestTimeout: 'Anfrage abgelaufen. Bitte versuchen Sie es erneut.',
        unexpectedError: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
        createNewQuiz: 'Neues Quiz erstellen',
        uploadDocumentsDescription: 'Dokumente, Bilder oder PDFs hochladen, um Quizfragen aus ihrem Inhalt zu erstellen',
        quizSettings: 'Quiz-Einstellungen',
        configurePreferences: 'Quiz-Einstellungen konfigurieren',
        selectDifficulty: 'Schwierigkeit auswählen',
        timer: 'Zeitgeber',
        timePerQuestion: 'Zeit pro Frage',
        quizNoTimeLimit: 'Quiz hat keine Zeitbegrenzung',
        totalQuizTime: 'Gesamt-Quizzeit',
        basedOn: 'Basierend auf',
        questions: 'Fragen',
        minutesPerQuestion: 'Minuten pro Frage',
        uploadContent: 'Inhalt hochladen',
        uploadContentDescription: 'Dokumente hochladen, um Inhalt für Ihr Quiz zu extrahieren',
        processingFiles: 'Dateien verarbeiten...',
        reviewCurrentFile: 'Bitte überprüfen Sie die aktuelle Datei',
        maxFilesReached: 'Maximale Dateianzahl erreicht (5)',
        supportedFormatsExtended: 'Unterstützte Formate: PDF, DOCX, JPG, PNG',
        maxFileSizeExtended: 'Maximale Dateigröße: 10MB pro Datei',
        uploadedFiles: 'Hochgeladene Dateien',
        creatingQuiz: 'Quiz erstellen...',
        reviewExtractedText: 'Überprüfen Sie den extrahierten Text von',
        
        // Conversation visibility
        shareConversation: 'Gespräch teilen',
        makePublic: 'Gespräch öffentlich machen',
        publicConversationNote: 'Jeder mit dem Link kann dieses Gespräch einsehen.',
        privateConversationNote: 'Dieses Gespräch ist privat. Machen Sie es öffentlich, um es zu teilen.',
        viewOnlyMode: 'Nur-Lese-Modus',
        noConversationFound: 'Kein Gespräch gefunden',
        
        // Visibility state feedback
        madePublic: 'Das Gespräch ist jetzt öffentlich',
        madePrivate: 'Das Gespräch ist jetzt privat',
        visibilityChangeError: 'Fehler beim Ändern der Sichtbarkeit',
        
        // Pagination
        showing: 'Zeige',
        of: 'von',
        noQuizzesFound: 'Keine Quiz gefunden',
        tryDifferentSearch: 'Versuchen Sie einen anderen Suchbegriff oder löschen Sie die Filter',
        previous: 'Zurück',
        next: 'Weiter',
        
        // Sidebar conversation categories
        recentConversations: 'Neueste Gespräche',
        yesterday: 'Gestern',
        last7Days: 'Letzte 7 Tage',
        last30Days: 'Letzte 30 Tage',
        older: 'Älter',
        noConversationsYet: 'Noch keine Gespräche',
        
        // Conversation actions
        rename: 'Umbenennen',
        share: 'Teilen',
        
        // Dialog actions and titles
        renameConversation: 'Gespräch umbenennen',
        enterConversationName: 'Gesprächsname eingeben',
        deleteConversation: 'Gespräch löschen',
        deleteConversationConfirm: 'Sind Sie sicher, dass Sie dieses Gespräch löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
    },
    it: {
        // Common UI Elements
        send: 'Invia',
        cancel: 'Annulla',
        save: 'Salva',
        delete: 'Elimina',
        edit: 'Modifica',
        close: 'Chiudi',
        loading: 'Caricamento',
        error: 'Errore',
        success: 'Successo',
        
        // Navigation & Headers
        newChat: 'Nuova Chat',
        conversations: 'Conversazioni',
        settings: 'Impostazioni',
        profile: 'Profilo',
        logout: 'Esci',
        documentation: 'Documentazione',
        
        // Chat Interface
        typeMessage: 'Scrivi un messaggio...',
        attachFile: 'Allega file',
        pressEnterToSend: 'Premi Invio per inviare',
        pressCtrlEnterNewLine: 'Premi Ctrl+Invio per nuova riga',
        thinking: 'Pensando',
        processing: 'Elaborazione',
        
        // File Upload
        uploadImage: 'Carica immagine',
        removeImage: 'Rimuovi immagine',
        imageUploadTips: 'Suggerimenti per il caricamento',
        maxFileSize: 'Dimensione massima file: 5MB',
        supportedFormats: 'Formati supportati: JPEG, PNG, GIF, WebP, SVG',
        maxImages: 'Massimo 3 immagini per messaggio',
        
        // Code Snippets
        codeSnippet: 'Frammento di codice',
        copyCode: 'Copia codice',
        copied: 'Copiato!',
        preview: 'Anteprima',
        remove: 'Rimuovi',
        
        // Getting Started Section
        gettingStarted: 'Per iniziare',
        welcome: 'Benvenuto su VisionAI',
        welcomeMessage: 'Fai una domanda o carica un\'immagine per iniziare',
        startNewChat: 'Inizia una nuova chat',
        askQuestion: 'Fai una domanda',
        
        // Tips & Features
        tips: 'Suggerimenti e trucchi',
        imageAnalysis: 'Analisi immagini avanzata',
        codeSupport: 'Supporto frammenti di codice',
        keyboardShortcuts: 'Scorciatoie da tastiera',
        
        // Image Processing
        extractingText: 'Estrazione testo',
        textExtracted: 'Testo estratto',
        extractionFailed: 'Estrazione fallita',
        
        // Error Messages
        connectionError: 'Errore di connessione',
        uploadError: 'Caricamento fallito',
        tryAgain: 'Riprova per favore',
        
        // Quiz Related
        quizzes: 'Quiz',
        yourQuizzes: 'I tuoi Quiz',
        manageQuizzes: 'Gestisci e svolgi i tuoi quiz',
        createQuiz: 'Crea Quiz',
        editQuiz: 'Modifica Quiz',
        deleteQuiz: 'Elimina Quiz',
        confirmDelete: 'Sei sicuro di voler eliminare questo quiz?',
        questionCount: 'Numero di domande',
        difficulty: 'Difficoltà',
        timeLimit: 'Limite di tempo',
        enableTimer: 'Abilita timer',
        title: 'Titolo',
        description: 'Descrizione',
        easy: 'Facile',
        medium: 'Medio',
        hard: 'Difficile',
        noLimit: 'Nessun limite',
        minutes: 'min',
        startQuiz: 'Inizia Quiz',
        submissions: 'Invii',
        noSubmissions: 'Ancora nessun invio',
        correctAnswers: 'Risposte corrette',
        timeTaken: 'Tempo impiegato',
        dropFilesHere: 'Trascina qui i file',
        dropToUpload: 'Trascina i file per caricarli',
        clickToUpload: 'o clicca per caricare',
        unsupportedFormat: 'Formato file non supportato',
        textPreview: 'Anteprima testo',
        confirmFile: 'Conferma',
        skipFile: 'Salta',
        createFromDocument: 'Crea da documento',
        search: 'Ricerca',
        filterBy: 'Filtra per',
        allDifficulties: 'Tutte le difficoltà',
        actions: 'Azioni',
        editQuizDescription: 'Apporta modifiche ai parametri del quiz qui',
        timeRemaining: 'Tempo rimanente',
        submit: 'Invia',
        finish: 'Termina',  
        score: 'Punteggio',
        submitted : 'Inviato',
        correct: 'Corretto',
        incorrect: 'Errato',
        explanation: 'Spiegazione',
        question: 'Domanda',
        overview : 'Panoramica',
        viewOverview : 'Visualizza panoramica',


        
        // Additional Quiz Properties for Create.tsx
        maxFilesAllowed: 'Maximum 5 files allowed',
        uploadSupportedFormats: 'Please upload files in supported formats',
        noTextExtracted: 'No text could be extracted from',
        checkReadableText: 'Please check that the file contains readable text',
        pdfExtractionFailed: 'Failed to extract text from PDF file',
        docLegacyNotSupported: 'Legacy .doc files are not supported, please convert to .docx',
        documentExtractionFailed: 'Failed to extract text from document',
        imageExtractionFailed: 'Failed to extract text from image',
        fileTooLarge: 'is too large (10MB max)',
        fileInvalidType: 'has an invalid file type',
        noContentExtracted: 'No content was extracted from the files. Please try again with different files.',
        pleaseUploadFile: 'Please upload at least one file',
        quizCreatedSuccess: 'Quiz created successfully!',
        failedToCreate: 'Failed to create quiz',
        errorCreatingQuiz: 'Error creating quiz. Please check your inputs and try again.',
        filesTooLarge: 'One or more files are too large',
        notAuthorized: 'You are not authorized to perform this action',
        serverError: 'Server error',
        requestTimeout: 'Request timed out. Please try again.',
        unexpectedError: 'An unexpected error occurred. Please try again.',
        createNewQuiz: 'Create New Quiz',
        uploadDocumentsDescription: 'Upload documents, images, or PDFs to create quiz questions from their content',
        quizSettings: 'Quiz Settings',
        configurePreferences: 'Configure your quiz preferences',
        selectDifficulty: 'Select difficulty',
        timer: 'Timer',
        timePerQuestion: 'Time per question',
        quizNoTimeLimit: 'Quiz will have no time limit',
        totalQuizTime: 'Total quiz time',
        basedOn: 'Based on',
        questions: 'questions',
        minutesPerQuestion: 'minutes per question',
        uploadContent: 'Upload Content',
        uploadContentDescription: 'Upload documents to extract content for your quiz',
        processingFiles: 'Processing files...',
        reviewCurrentFile: 'Please review the current file',
        maxFilesReached: 'Maximum number of files reached (5)',
        supportedFormatsExtended: 'Supported formats: PDF, DOCX, JPG, PNG',
        maxFileSizeExtended: 'Maximum file size: 10MB per file',
        uploadedFiles: 'Uploaded Files',
        creatingQuiz: 'Creating Quiz...',
        reviewExtractedText: 'Review the extracted text from',
        
        // Conversation visibility
        shareConversation: 'Condividi conversazione',
        makePublic: 'Rendi pubblica la conversazione',
        publicConversationNote: 'Chiunque abbia il link può visualizzare questa conversazione.',
        privateConversationNote: 'Questa conversazione è privata. Rendila pubblica per condividerla.',
        viewOnlyMode: 'Modalità di sola visualizzazione',
        noConversationFound: 'Nessuna conversazione trovata',
        
        // Visibility state feedback
        madePublic: 'La conversazione è ora pubblica',
        madePrivate: 'La conversazione è ora privata',
        visibilityChangeError: 'Impossibile modificare la visibilità',
        
        // Pagination
        showing: 'Mostrati',
        of: 'di',
        noQuizzesFound: 'Nessun quiz trovato',
        tryDifferentSearch: 'Prova un termine di ricerca diverso o cancella i filtri',
        previous: 'Precedente',
        next: 'Successivo',
        
        // Sidebar conversation categories
        recentConversations: 'Conversazioni recenti',
        yesterday: 'Ieri',
        last7Days: 'Ultimi 7 giorni',
        last30Days: 'Ultimi 30 giorni',
        older: 'Più vecchie',
        noConversationsYet: 'Nessuna conversazione ancora',
        
        // Conversation actions
        rename: 'Rinomina',
        share: 'Condividi',
        
        // Dialog actions and titles
        renameConversation: 'Rinomina conversazione',
        enterConversationName: 'Inserisci nome conversazione',
        deleteConversation: 'Elimina conversazione',
        deleteConversationConfirm: 'Sei sicuro di voler eliminare questa conversazione? Questa azione non può essere annullata.',
    },
    zh: {
        // Common UI Elements
        send: '发送',
        cancel: '取消',
        save: '保存',
        delete: '删除',
        edit: '编辑',
        close: '关闭',
        loading: '加载中',
        error: '错误',
        success: '成功',
        
        // Navigation & Headers
        newChat: '新对话',
        conversations: '对话列表',
        settings: '设置',
        profile: '个人资料',
        logout: '退出登录',
        documentation: '文档',
        
        // Chat Interface
        typeMessage: '输入消息...',
        attachFile: '附加文件',
        pressEnterToSend: '按回车键发送',
        pressCtrlEnterNewLine: '按Ctrl+回车键换行',
        thinking: '思考中',
        processing: '处理中',
        
        // File Upload
        uploadImage: '上传图片',
        removeImage: '删除图片',
        imageUploadTips: '图片上传提示',
        maxFileSize: '最大文件大小：5MB',
        supportedFormats: '支持格式：JPEG、PNG、GIF、WebP、SVG',
        maxImages: '每条消息最多3张图片',
        
        // Code Snippets
        codeSnippet: '代码片段',
        copyCode: '复制代码',
        copied: '已复制！',
        preview: '预览',
        remove: '删除',
        
        // Getting Started Section
        gettingStarted: '开始使用',
        welcome: '欢迎使用 VisionAI',
        welcomeMessage: '提出问题或上传图片即可开始',
        startNewChat: '开始新对话',
        askQuestion: '提问',
        
        // Tips & Features
        tips: '使用技巧',
        imageAnalysis: '增强图像分析',
        codeSupport: '代码片段支持',
        keyboardShortcuts: '键盘快捷键',
        
        // Image Processing
        extractingText: '正在提取文本',
        textExtracted: '文本已提取',
        extractionFailed: '文本提取失败',
        
        // Error Messages
        connectionError: '连接错误',
        uploadError: '上传失败',
        tryAgain: '请重试',
        
        // Quiz Related
        quizzes: '测验',
        yourQuizzes: '您的测验',
        manageQuizzes: '管理和参加您的测验',
        createQuiz: '创建测验',
        editQuiz: '编辑测验',
        deleteQuiz: '删除测验',
        confirmDelete: '您确定要删除此测验吗？',
        questionCount: '问题数量',
        difficulty: '难度',
        timeLimit: '时间限制',
        enableTimer: '启用计时器',
        title: '标题',
        description: '描述',
        easy: '简单',
        medium: '中等',
        hard: '困难',
        noLimit: '无限制',
        minutes: '分钟',
        startQuiz: '开始测验',
        submissions: '提交',
        noSubmissions: '暂无提交',
        correctAnswers: '正确答案',
        timeTaken: '花费时间',
        dropFilesHere: '将文件拖放到此处',
        dropToUpload: '拖放文件以上传',
        clickToUpload: '或点击上传',
        unsupportedFormat: '不支持的文件格式',
        textPreview: '文本预览',
        confirmFile: '确认',
        skipFile: '跳过',
        createFromDocument: '从文档创建',
        search: '搜索',
        filterBy: '筛选',
        allDifficulties: '所有难度',
        actions: '操作',
        editQuizDescription: '在这里更改测验设置',
        timeRemaining: '剩余时间',
        submit: '提交',
        finish: '完成',
        score: '分数',
        submitted : '已提交',   
        correct: '正确',
        incorrect: '错误',
        explanation: '解释',
        question: '问题',
        overview : '概述',
        viewOverview : '查看概述',

        
        // Additional Quiz Properties for Create.tsx
        maxFilesAllowed: 'Maximum 5 files allowed',
        uploadSupportedFormats: 'Please upload files in supported formats',
        noTextExtracted: 'No text could be extracted from',
        checkReadableText: 'Please check that the file contains readable text',
        pdfExtractionFailed: 'Failed to extract text from PDF file',
        docLegacyNotSupported: 'Legacy .doc files are not supported, please convert to .docx',
        documentExtractionFailed: 'Failed to extract text from document',
        imageExtractionFailed: 'Failed to extract text from image',
        fileTooLarge: 'is too large (10MB max)',
        fileInvalidType: 'has an invalid file type',
        noContentExtracted: 'No content was extracted from the files. Please try again with different files.',
        pleaseUploadFile: 'Please upload at least one file',
        quizCreatedSuccess: 'Quiz created successfully!',
        failedToCreate: 'Failed to create quiz',
        errorCreatingQuiz: 'Error creating quiz. Please check your inputs and try again.',
        filesTooLarge: 'One or more files are too large',
        notAuthorized: 'You are not authorized to perform this action',
        serverError: 'Server error',
        requestTimeout: 'Request timed out. Please try again.',
        unexpectedError: 'An unexpected error occurred. Please try again.',
        createNewQuiz: 'Create New Quiz',
        uploadDocumentsDescription: 'Upload documents, images, or PDFs to create quiz questions from their content',
        quizSettings: 'Quiz Settings',
        configurePreferences: 'Configure your quiz preferences',
        selectDifficulty: 'Select difficulty',
        timer: 'Timer',
        timePerQuestion: 'Time per question',
        quizNoTimeLimit: 'Quiz will have no time limit',
        totalQuizTime: 'Total quiz time',
        basedOn: 'Based on',
        questions: 'questions',
        minutesPerQuestion: 'minutes per question',
        uploadContent: 'Upload Content',
        uploadContentDescription: 'Upload documents to extract content for your quiz',
        processingFiles: 'Processing files...',
        reviewCurrentFile: 'Please review the current file',
        maxFilesReached: 'Maximum number of files reached (5)',
        supportedFormatsExtended: 'Supported formats: PDF, DOCX, JPG, PNG',
        maxFileSizeExtended: 'Maximum file size: 10MB per file',
        uploadedFiles: 'Uploaded Files',
        creatingQuiz: 'Creating Quiz...',
        reviewExtractedText: 'Review the extracted text from',
        
        // Conversation visibility
        shareConversation: '分享对话',
        makePublic: '公开对话',
        publicConversationNote: '任何拥有链接的人都可以查看此对话。',
        privateConversationNote: '此对话是私密的。公开它以分享。',
        viewOnlyMode: '仅查看模式',
        noConversationFound: '未找到对话',
        
        // Visibility state feedback
        madePublic: '对话现已公开',
        madePrivate: '对话现已设为私密',
        visibilityChangeError: '更改可见性失败',
        
        // Pagination
        showing: '显示',
        of: '共',
        noQuizzesFound: '未找到测验',
        tryDifferentSearch: '尝试其他搜索词或清除筛选条件',
        previous: '上一页',
        next: '下一页',
        
        // Sidebar conversation categories
        recentConversations: '最近对话',
        yesterday: '昨天',
        last7Days: '过去7天',
        last30Days: '过去30天',
        older: '更早',
        noConversationsYet: '暂无对话',
        
        // Conversation actions
        rename: '重命名',
        share: '分享',
        
        // Dialog actions and titles
        renameConversation: '重命名对话',
        enterConversationName: '输入对话名称',
        deleteConversation: '删除对话',
        deleteConversationConfirm: '确定要删除此对话吗？此操作无法撤销。',
    }
};
