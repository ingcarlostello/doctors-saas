import type { Locale } from './config';

export interface CommonDictionary {
    navigation: {
        dashboard: string;
        calendar: string;
        patients: string;
        campaigns: string;
        whatsappTemplates: string;
        chat: string;
        settings: string;
        login: string;
        signUp: string;
        getStarted: string;
        logout: string;
    };
    common: {
        loading: string;
        error: string;
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        add: string;
        search: string;
        filter: string;
        actions: string;
        confirm: string;
        yes: string;
        no: string;
        close: string;
        back: string;
        next: string;
        previous: string;
        submit: string;
    };
    footer: {
        copyright: string;
        privacyPolicy: string;
        termsOfService: string;
    };
}

export interface LandingDictionary {
    header: {
        features: string;
        howItWorks: string;
        pricing: string;
        testimonials: string;
    };
    hero: {
        badge: string;
        title: string;
        titleHighlight: string;
        description: string;
        ctaPrimary: string;
        ctaSecondary: string;
    };
    features: {
        title: string;
        subtitle: string;
        items: Array<{
            title: string;
            description: string;
        }>;
    };
    howItWorks: {
        title: string;
        subtitle: string;
        steps: Array<{
            title: string;
            description: string;
        }>;
    };
    pricing: {
        title: string;
        subtitle: string;
        plans: Array<{
            name: string;
            price: string;
            description: string;
            features: string[];
            cta: string;
        }>;
    };
    testimonials: {
        title: string;
        subtitle: string;
        items: Array<{
            quote: string;
            author: string;
            role: string;
        }>;
    };
    cta: {
        title: string;
        description: string;
        button: string;
    };
}

export interface DashboardDictionary {
    sidebar: {
        closeSidebar: string;
    };
    stats: {
        revenueRecovered: string;
        noShowsPrevented: string;
        pendingRecalls: string;
    };
    dashboard: {
        title: string;
        welcome: string;
    };
}

export interface PatientsDictionary {
    title: string;
    addPatient: string;
    searchPlaceholder: string;
    columns: {
        name: string;
        email: string;
        phone: string;
        lastVisit: string;
        nextAppointment: string;
        status: string;
        actions: string;
    };
    status: {
        active: string;
        inactive: string;
        pending: string;
    };
    form: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dateOfBirth: string;
        notes: string;
    };
}

export interface CalendarDictionary {
    title: string;
    today: string;
    month: string;
    week: string;
    day: string;
    agenda: string;
    noEvents: string;
    addEvent: string;
    dialog: {
        title: string;
        eventTitleLabel: string;
        eventTitlePlaceholder: string;
        descriptionLabel: string;
        descriptionPlaceholder: string;
        patientLabel: string;
        patientSearchPlaceholder: string;
        noPatients: string;
        startTimeLabel: string;
        endTimeLabel: string;
        createButton: string;
    };
}

export interface ChatDictionary {
    title: string;
    searchPlaceholder: string;
    noConversations: string;
    typePlaceholder: string;
    send: string;
}

export interface Dictionary {
    common: CommonDictionary;
    landing: LandingDictionary;
    dashboard: DashboardDictionary;
    patients: PatientsDictionary;
    calendar: CalendarDictionary;
    chat: ChatDictionary;
}

export type DictionaryKey = keyof Dictionary;

export interface TranslationContextValue {
    dictionary: Dictionary;
    locale: Locale;
    setLocale: (locale: Locale) => void;
}
