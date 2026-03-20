(function (window) {
    'use strict';

    const LANGUAGE_STORAGE_KEY = 'alphaPreferredLanguage';

    const languageCatalog = [
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
        { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
        { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
        { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
        { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
        { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
        { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' },
        { code: 'ur', name: 'Urdu (Roman)', nativeName: 'Roman Urdu', flag: '🇵🇰' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
        { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
        { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
        { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
        { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' }
    ];

    const emitEvent = (eventName, detail = {}) => {
        try {
            window.dispatchEvent(new CustomEvent(eventName, { detail }));
        } catch (error) {
            if (document && document.createEvent) {
                const event = document.createEvent('CustomEvent');
                event.initCustomEvent(eventName, false, false, detail);
                window.dispatchEvent(event);
            }
        }
    };

    const translations = {
        en: {
            'header.title': 'Profile',
            'stats.completed': 'Completed',
            'stats.active': 'Active',
            'stats.rating': 'Rating',
            'menu.complete_profile': 'Complete Profile',
            'menu.profile_pending': 'Documents & bank info required',
            'menu.profile_completed': 'Profile verified & payouts unlocked',
            'menu.edit_profile': 'Edit Profile',
            'menu.my_vehicles': 'My Vehicles',
            'menu.documents': 'Documents',
            'menu.bank_account': 'Bank Account',
            'menu.notifications': 'Notifications',
            'menu.support': 'Support',
            'menu.privacy_security': 'Privacy & Security',
            'menu.language': 'Language & Region',
            'menu.language_description': 'Choose how Alpha Freight speaks to you',
            'status.pending': 'Pending',
            'status.completed': 'Completed',
            'button.logout': 'Logout',
            'nav.home': 'Home',
            'nav.loads': 'Loads',
            'nav.messages': 'Messages',
            'nav.profile': 'Profile',
            'chatbot.title': 'Support Assistant',
            'chatbot.greeting': 'Hello! I\'m your support assistant. How can I help you today? I can answer questions about your profile, account settings, documents, vehicles, support options, and more. Just ask me anything!',
            'chatbot.placeholder': 'Type your message...',
            'language.modal_title': 'Switch language',
            'language.search_placeholder': 'Search languages',
            'language.sync_note': 'Applies across all Alpha Freight apps',
            'language.current': 'Current',
            'dialog.logout_confirm': 'Are you sure you want to logout?',
            'alerts.settings_coming': 'Settings page coming soon!',
            'alerts.vehicles_coming': 'Vehicle management coming soon!',
            'alerts.privacy_coming': 'Privacy settings coming soon!'
            ,'dashboard.header.account_status': 'Account Status:'
            ,'dashboard.header.last_update': 'Last Update:'
            ,'dashboard.status.checking': 'Checking...'
            ,'dashboard.status.reviewing': 'Hold tight while we review your documents.'
            ,'dashboard.status.label_verified': 'Verified'
            ,'dashboard.status.label_pending': 'Pending Review'
            ,'dashboard.status.label_rejected': 'Action Required'
            ,'dashboard.status.label_other': 'Status'
            ,'dashboard.status.message_verified': 'You are approved to receive loads & payouts.'
            ,'dashboard.status.message_pending': 'Our compliance team is reviewing your documents.'
            ,'dashboard.status.message_rejected': 'Please resubmit missing information.'
            ,'dashboard.status.message_other': 'Contact support for assistance.'
            ,'dashboard.status.fix_prefix': 'Fix & resubmit:'
            ,'dashboard.status.awaiting_update': 'Awaiting update'
            ,'dashboard.status.recently': 'Recently'
            ,'dashboard.card.active_loads': 'Active Loads'
            ,'dashboard.card.earnings': 'Earnings'
            ,'dashboard.section.quick_actions': 'Quick Actions'
            ,'dashboard.section.available_loads': 'Available Loads'
            ,'dashboard.actions.find_loads': 'Find Loads'
            ,'dashboard.actions.my_loads': 'My Loads'
            ,'dashboard.actions.share_location': 'Share Location'
            ,'dashboard.actions.wallet': 'Wallet'
            ,'dashboard.actions.documents': 'Documents'
            ,'dashboard.actions.support': 'Support'
            ,'dashboard.loads.loading': 'Loading available loads...'
            ,'dashboard.loads.empty': 'No available loads'
            ,'dashboard.loads.empty_country': 'No loads available in your country'
            ,'dashboard.loads.error': 'Error loading loads'
            ,'dashboard.loads.view': 'View'
            ,'dashboard.load.active_badge': 'Active'
            ,'dashboard.load.generic_cargo': 'General Cargo'
            ,'dashboard.load.tbd': 'TBD'
            ,'dashboard.welcome.generic': 'Welcome back'
            ,'dashboard.welcome.named': 'Welcome, {name}!'
            ,'loads.page.title': 'Available Loads'
            ,'loads.search.placeholder': 'Search by location or load ID...'
            ,'loads.filters.all': 'All Loads'
            ,'loads.filters.urgent': 'Urgent'
            ,'loads.filters.partial': 'Partial'
            ,'loads.filters.full': 'Full Load'
            ,'loads.badge.urgent': 'URGENT'
            ,'loads.badge.available': 'AVAILABLE'
            ,'loads.route.pickup': 'Pickup'
            ,'loads.route.delivery': 'Delivery'
            ,'loads.info.weight': 'Weight'
            ,'loads.info.type': 'Type'
            ,'loads.info.status': 'Status'
            ,'loads.info.active': 'Active'
            ,'loads.info.full': 'Full'
            ,'loads.info.partial': 'Partial'
            ,'loads.info.weight_unknown': 'N/A'
            ,'loads.payment.badge_half': '50% Upfront'
            ,'loads.payment.badge_full': 'Full Upfront'
            ,'loads.payment.label_half': '50% Upfront, 50% on Delivery'
            ,'loads.payment.label_full': 'Full Payment Upfront'
            ,'loads.actions.view_details': 'View Details'
            ,'loads.actions.accept_load': 'Accept Load'
            ,'loads.empty.none': 'No loads available'
            ,'loads.empty.error': 'Error loading loads'
            ,'loads.empty.country': 'No available loads in your country'
            ,'loads.modal.details_title': 'Load Details'
            ,'loads.modal.section.route': 'Route Information'
            ,'loads.modal.section.schedule': 'Schedule'
            ,'loads.modal.section.cargo': 'Cargo Details'
            ,'loads.modal.section.payment': 'Payment'
            ,'loads.modal.field.pickup_location': 'Pickup Location'
            ,'loads.modal.field.delivery_location': 'Delivery Location'
            ,'loads.modal.field.distance': 'Distance'
            ,'loads.modal.field.pickup_date': 'Pickup Date'
            ,'loads.modal.field.delivery_date': 'Delivery Date'
            ,'loads.modal.field.cargo_type': 'Cargo Type'
            ,'loads.modal.field.weight': 'Weight'
            ,'loads.modal.field.load_type': 'Load Type'
            ,'loads.modal.field.special_requirements': 'Special Requirements'
            ,'loads.modal.field.payment_amount': 'Payment Amount'
            ,'loads.modal.field.payment_method': 'Payment Method'
            ,'loads.modal.button.close': 'Close'
            ,'loads.modal.button.accept': 'Accept Load'
            ,'loads.modal.button.cancel': 'Cancel'
            ,'loads.modal.button.confirm': 'Confirm & Accept'
            ,'loads.modal.agreement_title': 'Carrier Agreement'
            ,'loads.modal.agreement_warning': 'Please read carefully before signing. By signing this agreement, you confirm that you have read, understood, and agree to all terms and conditions stated above.'
            ,'loads.alert.load_not_found': 'Load not found'
            ,'loads.alert.error_accept': 'Error accepting load. Please try again.'
            ,'loads.alert.success_accept': 'Load accepted successfully!'
            ,'loads.alert.sign_first': 'Please sign the agreement first!'
            ,'loads.alert.invalid_signature_file': 'Please select a valid image file'
            ,'loads.alert.signature_read_error': 'Error reading the file'
            ,'loads.alert.no_load_id': 'Error: Load ID not found. Please try again.'
            ,'loads.alert.open_agreement_error': 'Error opening agreement. Please try again.'
            ,'loads.alert.modal_missing': 'Error: Agreement modal not found. Please refresh the page.'
            ,'loads.alert.agreement_not_found': 'Agreement modal element not found. Please refresh the page.'
            ,'loads.alert.accept_general_error': 'Error opening agreement. Please refresh the page.'
            ,'loads.date.flexible': 'Flexible'
            ,'loads.distance.unit': 'miles'
            ,'loads.map.title': 'Route Preview'
            ,'loads.map.loading': 'Calculating best route...'
            ,'loads.map.error': 'Map unavailable for this load'
            ,'loads.map.geocode_error': 'Could not locate one of the addresses'
            ,'loads.map.route_error': 'Could not calculate route. Showing markers only.'
            ,'auth.signin.title': 'Sign In'
            ,'auth.signup.title': 'Create Account'
            ,'auth.email.label': 'Email Address'
            ,'auth.password.label': 'Password'
            ,'auth.name.label': 'Full Name'
            ,'auth.confirm_password.label': 'Confirm Password'
            ,'auth.forgot_password': 'Forgot Password?'
            ,'auth.signin.button': 'Sign In'
            ,'auth.signup.button': 'Sign Up'
            ,'auth.social.google': 'Continue with Google'
            ,'auth.social.facebook': 'Continue with Facebook'
            ,'auth.no_account': "Don't have an account?"
            ,'auth.have_account': 'Already have an account?'
        },
        es: {
            'header.title': 'Perfil',
            'stats.completed': 'Completado',
            'stats.active': 'Activo',
            'stats.rating': 'Calificación',
            'menu.complete_profile': 'Completar perfil',
            'menu.profile_pending': 'Se requieren documentos y datos bancarios',
            'menu.profile_completed': 'Perfil verificado y pagos habilitados',
            'menu.edit_profile': 'Editar perfil',
            'menu.my_vehicles': 'Mis vehículos',
            'menu.documents': 'Documentos',
            'menu.bank_account': 'Cuenta bancaria',
            'menu.notifications': 'Notificaciones',
            'menu.support': 'Soporte',
            'menu.privacy_security': 'Privacidad y seguridad',
            'menu.language': 'Idioma y región',
            'menu.language_description': 'Elige cómo te habla Alpha Freight',
            'status.pending': 'Pendiente',
            'status.completed': 'Completado',
            'button.logout': 'Cerrar sesión',
            'nav.home': 'Inicio',
            'nav.loads': 'Cargas',
            'nav.messages': 'Mensajes',
            'nav.profile': 'Perfil',
            'chatbot.title': 'Asistente de soporte',
            'chatbot.greeting': '¡Hola! Soy tu asistente de soporte. ¿Cómo puedo ayudarte hoy? Puedo responder preguntas sobre tu perfil, configuración de cuenta, documentos, vehículos, opciones de soporte y más. ¡Pregúntame lo que necesites!',
            'chatbot.placeholder': 'Escribe tu mensaje...',
            'language.modal_title': 'Cambiar idioma',
            'language.search_placeholder': 'Buscar idiomas',
            'language.sync_note': 'Se aplica en todas las apps de Alpha Freight',
            'language.current': 'Actual',
            'dialog.logout_confirm': '¿Seguro que deseas cerrar sesión?',
            'alerts.settings_coming': '¡La página de ajustes estará disponible pronto!',
            'alerts.vehicles_coming': '¡La gestión de vehículos estará disponible pronto!',
            'alerts.privacy_coming': '¡La configuración de privacidad llegará pronto!'
            ,'dashboard.header.account_status': 'Estado de la cuenta:'
            ,'dashboard.header.last_update': 'Última actualización:'
            ,'dashboard.status.checking': 'Comprobando...'
            ,'dashboard.status.reviewing': 'Estamos revisando tus documentos.'
            ,'dashboard.status.label_verified': 'Verificado'
            ,'dashboard.status.label_pending': 'En revisión'
            ,'dashboard.status.label_rejected': 'Acción requerida'
            ,'dashboard.status.label_other': 'Estado'
            ,'dashboard.status.message_verified': 'Estás aprobado para recibir cargas y pagos.'
            ,'dashboard.status.message_pending': 'Nuestro equipo de cumplimiento está revisando tu documentación.'
            ,'dashboard.status.message_rejected': 'Vuelve a enviar la información faltante.'
            ,'dashboard.status.message_other': 'Contacta soporte para recibir ayuda.'
            ,'dashboard.status.fix_prefix': 'Corrige y reenvía:'
            ,'dashboard.status.awaiting_update': 'Esperando actualización'
            ,'dashboard.status.recently': 'Hace poco'
            ,'dashboard.card.active_loads': 'Cargas activas'
            ,'dashboard.card.earnings': 'Ingresos'
            ,'dashboard.section.quick_actions': 'Acciones rápidas'
            ,'dashboard.section.available_loads': 'Cargas disponibles'
            ,'dashboard.actions.find_loads': 'Buscar cargas'
            ,'dashboard.actions.my_loads': 'Mis cargas'
            ,'dashboard.actions.share_location': 'Compartir ubicación'
            ,'dashboard.actions.wallet': 'Billetera'
            ,'dashboard.actions.documents': 'Documentos'
            ,'dashboard.actions.support': 'Soporte'
            ,'dashboard.loads.loading': 'Cargando cargas disponibles...'
            ,'dashboard.loads.empty': 'No hay cargas disponibles'
            ,'dashboard.loads.empty_country': 'No hay cargas en tu país'
            ,'dashboard.loads.error': 'Error al cargar las cargas'
            ,'dashboard.loads.view': 'Ver'
            ,'dashboard.load.active_badge': 'Activa'
            ,'dashboard.load.generic_cargo': 'Carga general'
            ,'dashboard.load.tbd': 'Por definir'
            ,'dashboard.welcome.generic': 'Bienvenido de nuevo'
            ,'dashboard.welcome.named': 'Bienvenido, {name}!'
            ,'loads.page.title': 'Cargas disponibles'
            ,'loads.search.placeholder': 'Buscar por ubicación o ID de carga...'
            ,'loads.filters.all': 'Todas las cargas'
            ,'loads.filters.urgent': 'Urgentes'
            ,'loads.filters.partial': 'Parciales'
            ,'loads.filters.full': 'Carga completa'
            ,'loads.badge.urgent': 'URGENTE'
            ,'loads.badge.available': 'DISPONIBLE'
            ,'loads.route.pickup': 'Recogida'
            ,'loads.route.delivery': 'Entrega'
            ,'loads.info.weight': 'Peso'
            ,'loads.info.type': 'Tipo'
            ,'loads.info.status': 'Estado'
            ,'loads.info.active': 'Activa'
            ,'loads.info.full': 'Completa'
            ,'loads.info.partial': 'Parcial'
            ,'loads.info.weight_unknown': 'N/D'
            ,'loads.payment.badge_half': '50 % anticipado'
            ,'loads.payment.badge_full': 'Pago completo'
            ,'loads.payment.label_half': '50 % antes y 50 % a la entrega'
            ,'loads.payment.label_full': 'Pago completo por adelantado'
            ,'loads.actions.view_details': 'Ver detalles'
            ,'loads.actions.accept_load': 'Aceptar carga'
            ,'loads.empty.none': 'No hay cargas disponibles'
            ,'loads.empty.error': 'Error al cargar las cargas'
            ,'loads.empty.country': 'No hay cargas en tu país'
            ,'loads.modal.details_title': 'Detalles de la carga'
            ,'loads.modal.section.route': 'Información de la ruta'
            ,'loads.modal.section.schedule': 'Horario'
            ,'loads.modal.section.cargo': 'Detalles de la carga'
            ,'loads.modal.section.payment': 'Pago'
            ,'loads.modal.field.pickup_location': 'Lugar de recogida'
            ,'loads.modal.field.delivery_location': 'Lugar de entrega'
            ,'loads.modal.field.distance': 'Distancia'
            ,'loads.modal.field.pickup_date': 'Fecha de recogida'
            ,'loads.modal.field.delivery_date': 'Fecha de entrega'
            ,'loads.modal.field.cargo_type': 'Tipo de carga'
            ,'loads.modal.field.weight': 'Peso'
            ,'loads.modal.field.load_type': 'Tipo de envío'
            ,'loads.modal.field.special_requirements': 'Requisitos especiales'
            ,'loads.modal.field.payment_amount': 'Importe del pago'
            ,'loads.modal.field.payment_method': 'Método de pago'
            ,'loads.modal.button.close': 'Cerrar'
            ,'loads.modal.button.accept': 'Aceptar carga'
            ,'loads.modal.button.cancel': 'Cancelar'
            ,'loads.modal.button.confirm': 'Confirmar y aceptar'
            ,'loads.modal.agreement_title': 'Acuerdo de transportista'
            ,'loads.modal.agreement_warning': 'Lee con atención antes de firmar. Al firmar confirmas que has leído, comprendido y aceptado todos los términos anteriores.'
            ,'loads.alert.load_not_found': 'No se encontró la carga'
            ,'loads.alert.error_accept': 'Error al aceptar la carga. Intenta de nuevo.'
            ,'loads.alert.success_accept': '¡Carga aceptada correctamente!'
            ,'loads.alert.open_agreement_error': 'Error al abrir el acuerdo. Intenta nuevamente.'
            ,'loads.alert.no_load_id': 'Error: no se encontró el ID de la carga.'
            ,'loads.alert.modal_missing': 'Error: no se encontró el acuerdo. Recarga la página.'
            ,'loads.alert.invalid_signature_file': 'Selecciona un archivo de imagen válido.'
            ,'loads.alert.signature_read_error': 'Error al leer el archivo.'
            ,'loads.alert.sign_first': 'Firma el acuerdo primero.'
            ,'loads.alert.accept_general_error': 'Error al procesar la carga. Intenta de nuevo.'
            ,'loads.date.flexible': 'Flexible'
            ,'loads.distance.unit': 'millas'
            ,'loads.map.title': 'Vista previa de la ruta'
            ,'loads.map.loading': 'Calculando la mejor ruta...'
            ,'loads.map.error': 'Mapa no disponible para esta carga'
            ,'loads.map.geocode_error': 'No pudimos localizar una de las direcciones'
            ,'loads.map.route_error': 'No se pudo calcular la ruta. Mostrando solo marcadores.'
        },
        pl: {
            'header.title': 'Profil',
            'stats.completed': 'Zakończone',
            'stats.active': 'Aktywne',
            'stats.rating': 'Ocena',
            'menu.complete_profile': 'Uzupełnij profil',
            'menu.profile_pending': 'Wymagane dokumenty i dane bankowe',
            'menu.profile_completed': 'Profil zweryfikowany, wypłaty odblokowane',
            'menu.edit_profile': 'Edytuj profil',
            'menu.my_vehicles': 'Moje pojazdy',
            'menu.documents': 'Dokumenty',
            'menu.bank_account': 'Konto bankowe',
            'menu.notifications': 'Powiadomienia',
            'menu.support': 'Wsparcie',
            'menu.privacy_security': 'Prywatność i bezpieczeństwo',
            'menu.language': 'Język i region',
            'menu.language_description': 'Wybierz, jak mówi Alpha Freight',
            'status.pending': 'Oczekuje',
            'status.completed': 'Zakończone',
            'button.logout': 'Wyloguj',
            'nav.home': 'Start',
            'nav.loads': 'Zlecenia',
            'nav.messages': 'Wiadomości',
            'nav.profile': 'Profil',
            'chatbot.title': 'Asystent wsparcia',
            'chatbot.greeting': 'Cześć! Jestem twoim asystentem wsparcia. W czym mogę pomóc? Odpowiadam na pytania o profil, konto, dokumenty, pojazdy, wsparcie i nie tylko. Po prostu zapytaj!',
            'chatbot.placeholder': 'Napisz wiadomość...',
            'language.modal_title': 'Zmień język',
            'language.search_placeholder': 'Szukaj języków',
            'language.sync_note': 'Działa we wszystkich aplikacjach Alpha Freight',
            'language.current': 'Aktualny',
            'dialog.logout_confirm': 'Czy na pewno chcesz się wylogować?',
            'alerts.settings_coming': 'Strona ustawień już wkrótce!',
            'alerts.vehicles_coming': 'Zarządzanie pojazdami już wkrótce!',
            'alerts.privacy_coming': 'Ustawienia prywatności pojawią się wkrótce!'
        },
        ro: {
            'header.title': 'Profil',
            'stats.completed': 'Finalizate',
            'stats.active': 'Active',
            'stats.rating': 'Scor',
            'menu.complete_profile': 'Completează profilul',
            'menu.profile_pending': 'Documente și date bancare necesare',
            'menu.profile_completed': 'Profil verificat și plăți activate',
            'menu.edit_profile': 'Editează profilul',
            'menu.my_vehicles': 'Vehiculele mele',
            'menu.documents': 'Documente',
            'menu.bank_account': 'Cont bancar',
            'menu.notifications': 'Notificări',
            'menu.support': 'Suport',
            'menu.privacy_security': 'Confidențialitate și securitate',
            'menu.language': 'Limbă și regiune',
            'menu.language_description': 'Alege cum îți vorbește Alpha Freight',
            'status.pending': 'În așteptare',
            'status.completed': 'Finalizat',
            'button.logout': 'Deconectare',
            'nav.home': 'Acasă',
            'nav.loads': 'Transporturi',
            'nav.messages': 'Mesaje',
            'nav.profile': 'Profil',
            'chatbot.title': 'Asistent de suport',
            'chatbot.greeting': 'Salut! Sunt asistentul tău de suport. Cu ce te pot ajuta astăzi? Pot răspunde la întrebări despre profil, setările contului, documente, vehicule, opțiuni de suport și multe altele. Spune-mi ce ai nevoie!',
            'chatbot.placeholder': 'Scrie mesajul tău...',
            'language.modal_title': 'Schimbă limba',
            'language.search_placeholder': 'Caută limbi',
            'language.sync_note': 'Se aplică în toate aplicațiile Alpha Freight',
            'language.current': 'Curentă',
            'dialog.logout_confirm': 'Sigur vrei să te deconectezi?',
            'alerts.settings_coming': 'Pagina de setări va fi disponibilă în curând!',
            'alerts.vehicles_coming': 'Gestionarea vehiculelor va fi disponibilă în curând!',
            'alerts.privacy_coming': 'Setările de confidențialitate vor fi disponibile în curând!'
        },
        uk: {
            'header.title': 'Профіль',
            'stats.completed': 'Завершено',
            'stats.active': 'Активно',
            'stats.rating': 'Рейтинг',
            'menu.complete_profile': 'Заповнити профіль',
            'menu.profile_pending': 'Потрібні документи та банківські дані',
            'menu.profile_completed': 'Профіль підтверджено, виплати відкриті',
            'menu.edit_profile': 'Редагувати профіль',
            'menu.my_vehicles': 'Мої транспортні засоби',
            'menu.documents': 'Документи',
            'menu.bank_account': 'Банківський рахунок',
            'menu.notifications': 'Сповіщення',
            'menu.support': 'Підтримка',
            'menu.privacy_security': 'Конфіденційність та безпека',
            'menu.language': 'Мова та регіон',
            'menu.language_description': 'Обери, як говорить Alpha Freight',
            'status.pending': 'Очікує',
            'status.completed': 'Завершено',
            'button.logout': 'Вийти',
            'nav.home': 'Головна',
            'nav.loads': 'Рейси',
            'nav.messages': 'Повідомлення',
            'nav.profile': 'Профіль',
            'chatbot.title': 'Помічник підтримки',
            'chatbot.greeting': 'Привіт! Я твій помічник підтримки. Чим можу допомогти? Відповім на запитання про профіль, налаштування облікового запису, документи, транспорт, підтримку та інше. Просто запитуй!',
            'chatbot.placeholder': 'Введи повідомлення...',
            'language.modal_title': 'Змінити мову',
            'language.search_placeholder': 'Пошук мов',
            'language.sync_note': 'Застосовується у всіх додатках Alpha Freight',
            'language.current': 'Поточна',
            'dialog.logout_confirm': 'Ви впевнені, що хочете вийти?',
            'alerts.settings_coming': 'Сторінка налаштувань з’явиться зовсім скоро!',
            'alerts.vehicles_coming': 'Керування транспортом з’явиться зовсім скоро!',
            'alerts.privacy_coming': 'Налаштування конфіденційності будуть доступні незабаром!'
        },
        tr: {
            'header.title': 'Profil',
            'stats.completed': 'Tamamlandı',
            'stats.active': 'Aktif',
            'stats.rating': 'Puan',
            'menu.complete_profile': 'Profili tamamla',
            'menu.profile_pending': 'Belge ve banka bilgileri gerekli',
            'menu.profile_completed': 'Profil onaylandı, ödemeler açıldı',
            'menu.edit_profile': 'Profili düzenle',
            'menu.my_vehicles': 'Araçlarım',
            'menu.documents': 'Belgeler',
            'menu.bank_account': 'Banka hesabı',
            'menu.notifications': 'Bildirimler',
            'menu.support': 'Destek',
            'menu.privacy_security': 'Gizlilik ve güvenlik',
            'menu.language': 'Dil ve bölge',
            'menu.language_description': 'Alpha Freight sana nasıl konuşsun?',
            'status.pending': 'Beklemede',
            'status.completed': 'Tamamlandı',
            'button.logout': 'Çıkış yap',
            'nav.home': 'Ana sayfa',
            'nav.loads': 'Yükler',
            'nav.messages': 'Mesajlar',
            'nav.profile': 'Profil',
            'chatbot.title': 'Destek asistanı',
            'chatbot.greeting': 'Merhaba! Ben destek asistanınım. Bugün sana nasıl yardımcı olabilirim? Profilin, hesap ayarların, belgelerin, araçların, destek seçeneklerin ve daha fazlası hakkında sorularını cevaplayabilirim. Sadece sor!',
            'chatbot.placeholder': 'Mesajını yaz...',
            'language.modal_title': 'Dili değiştir',
            'language.search_placeholder': 'Dil ara',
            'language.sync_note': 'Tüm Alpha Freight uygulamalarında geçerli',
            'language.current': 'Mevcut',
            'dialog.logout_confirm': 'Çıkış yapmak istediğine emin misin?',
            'alerts.settings_coming': 'Ayarlar sayfası yakında geliyor!',
            'alerts.vehicles_coming': 'Araç yönetimi çok yakında!',
            'alerts.privacy_coming': 'Gizlilik ayarları yakında hazır olacak!'
        },
        ru: {
            'header.title': 'Профиль',
            'stats.completed': 'Завершено',
            'stats.active': 'Активно',
            'stats.rating': 'Рейтинг',
            'menu.complete_profile': 'Заполнить профиль',
            'menu.profile_pending': 'Требуются документы и банковские данные',
            'menu.profile_completed': 'Профиль подтвержден, выплаты доступны',
            'menu.edit_profile': 'Редактировать профиль',
            'menu.my_vehicles': 'Мой транспорт',
            'menu.documents': 'Документы',
            'menu.bank_account': 'Банковский счет',
            'menu.notifications': 'Уведомления',
            'menu.support': 'Поддержка',
            'menu.privacy_security': 'Конфиденциальность и безопасность',
            'menu.language': 'Язык и регион',
            'menu.language_description': 'Выберите, как говорит Alpha Freight',
            'status.pending': 'Ожидает',
            'status.completed': 'Завершено',
            'button.logout': 'Выйти',
            'nav.home': 'Главная',
            'nav.loads': 'Рейсы',
            'nav.messages': 'Сообщения',
            'nav.profile': 'Профиль',
            'chatbot.title': 'Помощник поддержки',
            'chatbot.greeting': 'Привет! Я твой помощник поддержки. Чем могу помочь? Отвечаю на вопросы о профиле, настройках аккаунта, документах, транспорте, поддержке и многом другом. Просто спроси!',
            'chatbot.placeholder': 'Введите сообщение...',
            'language.modal_title': 'Сменить язык',
            'language.search_placeholder': 'Поиск языков',
            'language.sync_note': 'Работает во всех приложениях Alpha Freight',
            'language.current': 'Текущий',
            'dialog.logout_confirm': 'Вы уверены, что хотите выйти?',
            'alerts.settings_coming': 'Страница настроек скоро будет доступна!',
            'alerts.vehicles_coming': 'Управление транспортом появится совсем скоро!',
            'alerts.privacy_coming': 'Настройки конфиденциальности появятся в ближайшее время!'
        },
        de: {
            'header.title': 'Profil',
            'stats.completed': 'Abgeschlossen',
            'stats.active': 'Aktiv',
            'stats.rating': 'Bewertung',
            'menu.complete_profile': 'Profil vervollständigen',
            'menu.profile_pending': 'Dokumente und Bankdaten erforderlich',
            'menu.profile_completed': 'Profil verifiziert, Auszahlungen freigeschaltet',
            'menu.edit_profile': 'Profil bearbeiten',
            'menu.my_vehicles': 'Meine Fahrzeuge',
            'menu.documents': 'Dokumente',
            'menu.bank_account': 'Bankkonto',
            'menu.notifications': 'Benachrichtigungen',
            'menu.support': 'Support',
            'menu.privacy_security': 'Datenschutz & Sicherheit',
            'menu.language': 'Sprache & Region',
            'menu.language_description': 'Wähle, wie Alpha Freight mit dir spricht',
            'status.pending': 'Ausstehend',
            'status.completed': 'Abgeschlossen',
            'button.logout': 'Abmelden',
            'nav.home': 'Start',
            'nav.loads': 'Ladungen',
            'nav.messages': 'Nachrichten',
            'nav.profile': 'Profil',
            'chatbot.title': 'Support-Assistent',
            'chatbot.greeting': 'Hallo! Ich bin dein Support-Assistent. Wobei kann ich heute helfen? Ich beantworte Fragen zu Profil, Kontoeinstellungen, Dokumenten, Fahrzeugen, Support-Optionen und mehr. Frag einfach!',
            'chatbot.placeholder': 'Nachricht eingeben...',
            'language.modal_title': 'Sprache wechseln',
            'language.search_placeholder': 'Sprachen suchen',
            'language.sync_note': 'Gilt für alle Alpha Freight Apps',
            'language.current': 'Aktiv',
            'dialog.logout_confirm': 'Möchtest du dich wirklich abmelden?',
            'alerts.settings_coming': 'Die Einstellungsseite ist bald verfügbar!',
            'alerts.vehicles_coming': 'Das Fahrzeug-Management kommt in Kürze!',
            'alerts.privacy_coming': 'Die Datenschutzeinstellungen folgen bald!'
        },
        fr: {
            'header.title': 'Profil',
            'stats.completed': 'Terminés',
            'stats.active': 'Actifs',
            'stats.rating': 'Note',
            'menu.complete_profile': 'Compléter le profil',
            'menu.profile_pending': 'Documents et infos bancaires requis',
            'menu.profile_completed': 'Profil vérifié, paiements activés',
            'menu.edit_profile': 'Modifier le profil',
            'menu.my_vehicles': 'Mes véhicules',
            'menu.documents': 'Documents',
            'menu.bank_account': 'Compte bancaire',
            'menu.notifications': 'Notifications',
            'menu.support': 'Support',
            'menu.privacy_security': 'Confidentialité et sécurité',
            'menu.language': 'Langue et région',
            'menu.language_description': 'Choisissez comment Alpha Freight vous parle',
            'status.pending': 'En attente',
            'status.completed': 'Terminé',
            'button.logout': 'Déconnexion',
            'nav.home': 'Accueil',
            'nav.loads': 'Chargements',
            'nav.messages': 'Messages',
            'nav.profile': 'Profil',
            'chatbot.title': 'Assistant support',
            'chatbot.greeting': 'Bonjour ! Je suis votre assistant support. Comment puis-je vous aider aujourd’hui ? Je réponds à vos questions sur le profil, les paramètres du compte, les documents, les véhicules, les options d’assistance et plus encore. Demandez-moi tout !',
            'chatbot.placeholder': 'Tapez votre message...',
            'language.modal_title': 'Changer de langue',
            'language.search_placeholder': 'Rechercher une langue',
            'language.sync_note': 'S’applique à toutes les apps Alpha Freight',
            'language.current': 'Actuel',
            'dialog.logout_confirm': 'Voulez-vous vraiment vous déconnecter ?',
            'alerts.settings_coming': 'La page des paramètres arrive bientôt !',
            'alerts.vehicles_coming': 'La gestion des véhicules arrive bientôt !',
            'alerts.privacy_coming': 'Les paramètres de confidentialité seront bientôt disponibles !'
        },
        it: {
            'header.title': 'Profilo',
            'stats.completed': 'Completati',
            'stats.active': 'Attivi',
            'stats.rating': 'Valutazione',
            'menu.complete_profile': 'Completa il profilo',
            'menu.profile_pending': 'Documenti e dati bancari richiesti',
            'menu.profile_completed': 'Profilo verificato, pagamenti attivati',
            'menu.edit_profile': 'Modifica profilo',
            'menu.my_vehicles': 'I miei veicoli',
            'menu.documents': 'Documenti',
            'menu.bank_account': 'Conto bancario',
            'menu.notifications': 'Notifiche',
            'menu.support': 'Supporto',
            'menu.privacy_security': 'Privacy e sicurezza',
            'menu.language': 'Lingua e regione',
            'menu.language_description': 'Scegli come ti parla Alpha Freight',
            'status.pending': 'In attesa',
            'status.completed': 'Completato',
            'button.logout': 'Esci',
            'nav.home': 'Home',
            'nav.loads': 'Carichi',
            'nav.messages': 'Messaggi',
            'nav.profile': 'Profilo',
            'chatbot.title': 'Assistente di supporto',
            'chatbot.greeting': 'Ciao! Sono il tuo assistente di supporto. Come posso aiutarti oggi? Posso rispondere su profilo, impostazioni account, documenti, veicoli, opzioni di supporto e altro. Chiedimi pure!',
            'chatbot.placeholder': 'Scrivi il tuo messaggio...',
            'language.modal_title': 'Cambia lingua',
            'language.search_placeholder': 'Cerca lingue',
            'language.sync_note': 'Vale per tutte le app Alpha Freight',
            'language.current': 'Attuale',
            'dialog.logout_confirm': 'Sei sicuro di voler uscire?',
            'alerts.settings_coming': 'La pagina delle impostazioni sarà presto disponibile!',
            'alerts.vehicles_coming': 'La gestione dei veicoli arriverà presto!',
            'alerts.privacy_coming': 'Le impostazioni sulla privacy arriveranno a breve!'
        },
        pt: {
            'header.title': 'Perfil',
            'stats.completed': 'Concluídos',
            'stats.active': 'Ativos',
            'stats.rating': 'Avaliação',
            'menu.complete_profile': 'Completar perfil',
            'menu.profile_pending': 'Documentos e dados bancários necessários',
            'menu.profile_completed': 'Perfil verificado e pagamentos liberados',
            'menu.edit_profile': 'Editar perfil',
            'menu.my_vehicles': 'Meus veículos',
            'menu.documents': 'Documentos',
            'menu.bank_account': 'Conta bancária',
            'menu.notifications': 'Notificações',
            'menu.support': 'Suporte',
            'menu.privacy_security': 'Privacidade e segurança',
            'menu.language': 'Idioma e região',
            'menu.language_description': 'Escolha como a Alpha Freight fala com você',
            'status.pending': 'Pendente',
            'status.completed': 'Concluído',
            'button.logout': 'Sair',
            'nav.home': 'Início',
            'nav.loads': 'Cargas',
            'nav.messages': 'Mensagens',
            'nav.profile': 'Perfil',
            'chatbot.title': 'Assistente de suporte',
            'chatbot.greeting': 'Olá! Sou seu assistente de suporte. Como posso ajudar hoje? Respondo perguntas sobre perfil, configurações da conta, documentos, veículos, opções de suporte e muito mais. É só perguntar!',
            'chatbot.placeholder': 'Digite sua mensagem...',
            'language.modal_title': 'Mudar idioma',
            'language.search_placeholder': 'Buscar idiomas',
            'language.sync_note': 'Vale para todos os apps da Alpha Freight',
            'language.current': 'Atual',
            'dialog.logout_confirm': 'Tem certeza de que deseja sair?',
            'alerts.settings_coming': 'A página de configurações chegará em breve!',
            'alerts.vehicles_coming': 'A gestão de veículos estará disponível em breve!',
            'alerts.privacy_coming': 'As configurações de privacidade chegam em breve!'
        },
        ar: {
            'header.title': 'الملف الشخصي',
            'stats.completed': 'مكتمل',
            'stats.active': 'نشط',
            'stats.rating': 'التقييم',
            'menu.complete_profile': 'استكمل الملف الشخصي',
            'menu.profile_pending': 'مطلوب مستندات ومعلومات بنكية',
            'menu.profile_completed': 'تم التحقق من الملف وتم فتح الدفعات',
            'menu.edit_profile': 'تعديل الملف الشخصي',
            'menu.my_vehicles': 'مركباتي',
            'menu.documents': 'المستندات',
            'menu.bank_account': 'الحساب البنكي',
            'menu.notifications': 'الإشعارات',
            'menu.support': 'الدعم',
            'menu.privacy_security': 'الخصوصية والأمان',
            'menu.language': 'اللغة والمنطقة',
            'menu.language_description': 'اختر كيف تتحدث معك Alpha Freight',
            'status.pending': 'قيد الانتظار',
            'status.completed': 'مكتمل',
            'button.logout': 'تسجيل الخروج',
            'nav.home': 'الرئيسية',
            'nav.loads': 'الحمولات',
            'nav.messages': 'الرسائل',
            'nav.profile': 'الملف',
            'chatbot.title': 'مساعد الدعم',
            'chatbot.greeting': 'مرحباً! أنا مساعد الدعم الخاص بك. كيف أستطيع مساعدتك اليوم؟ أجيب عن أسئلتك حول الملف التعريفي، إعدادات الحساب، المستندات، المركبات، خيارات الدعم وأكثر. فقط اسأل!',
            'chatbot.placeholder': 'اكتب رسالتك...',
            'language.modal_title': 'تغيير اللغة',
            'language.search_placeholder': 'ابحث عن لغة',
            'language.sync_note': 'يُطبق على جميع تطبيقات Alpha Freight',
            'language.current': 'الحالي',
            'dialog.logout_confirm': 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
            'alerts.settings_coming': 'صفحة الإعدادات ستتوفر قريباً!',
            'alerts.vehicles_coming': 'إدارة المركبات قادمة قريباً!',
            'alerts.privacy_coming': 'إعدادات الخصوصية ستتوفر قريباً!'
        },
        ur: {
            'header.title': 'Profile',
            'stats.completed': 'Mukammal',
            'stats.active': 'Active',
            'stats.rating': 'Rating',
            'menu.complete_profile': 'Profile mukammal karein',
            'menu.profile_pending': 'Documents aur bank info darkar',
            'menu.profile_completed': 'Profile verify ho gaya, payouts unlock',
            'menu.edit_profile': 'Profile edit karein',
            'menu.my_vehicles': 'Meri gaariyaan',
            'menu.documents': 'Documents',
            'menu.bank_account': 'Bank account',
            'menu.notifications': 'Notifications',
            'menu.support': 'Support',
            'menu.privacy_security': 'Privacy aur security',
            'menu.language': 'Zabaan aur region',
            'menu.language_description': 'Alpha Freight aap se kis zabaan me baat kare',
            'status.pending': 'Baqi',
            'status.completed': 'Mukammal',
            'button.logout': 'Logout',
            'nav.home': 'Home',
            'nav.loads': 'Loads',
            'nav.messages': 'Messages',
            'nav.profile': 'Profile',
            'chatbot.title': 'Support assistant',
            'chatbot.greeting': 'Assalam o alaikum! Main aap ka support assistant hoon. Aaj kis chez me madad chahiye? Profile, account settings, documents, gaariyon, support options waghera ke sawalon ka jawab de sakta hoon. Bas poochain!',
            'chatbot.placeholder': 'Apna paigham likhein...',
            'language.modal_title': 'Zabaan badlein',
            'language.search_placeholder': 'Zabaan dhoondein',
            'language.sync_note': 'Alpha Freight ki tamam apps pe apply hota hai',
            'language.current': 'Filhal',
            'dialog.logout_confirm': 'Kya aap waqayi logout karna chahte hain?',
            'alerts.settings_coming': 'Settings page bohot jald aa rahi hai!',
            'alerts.vehicles_coming': 'Vehicle management jald hi available hoga!','alerts.privacy_coming': 'Privacy settings bohot jald add ki ja rahi hain!'
            ,'auth.signin.title': 'لاگ ان کریں'
            ,'auth.signup.title': 'نیا اکاؤنٹ بنائیں'
            ,'auth.email.label': 'ای میل ایڈریس'
            ,'auth.password.label': 'پاس ورڈ'
            ,'auth.name.label': 'پورا نام'
            ,'auth.confirm_password.label': 'پاس ورڈ کی تصدیق کریں'
            ,'auth.forgot_password': 'پاس ورڈ بھول گئے؟'
            ,'auth.signin.button': 'لاگ ان'
            ,'auth.signup.button': 'سائن اپ'
            ,'auth.social.google': 'گوگل کے ساتھ جاری رکھیں'
            ,'auth.social.facebook': 'فیس بک کے ساتھ جاری رکھیں'
            ,'auth.no_account': 'اکاؤنٹ نہیں ہے؟'
            ,'auth.have_account': 'پہلے سے اکاؤنٹ ہے؟'
        },
        hi: {
            'header.title': 'प्रोफ़ाइल',
            'stats.completed': 'पूर्ण',
            'stats.active': 'सक्रिय',
            'stats.rating': 'रेटिंग',
            'menu.complete_profile': 'प्रोफ़ाइल पूरा करें',
            'menu.profile_pending': 'दस्तावेज़ और बैंक जानकारी आवश्यक',
            'menu.profile_completed': 'प्रोफ़ाइल सत्यापित, भुगतान खुले',
            'menu.edit_profile': 'प्रोफ़ाइल संपादित करें',
            'menu.my_vehicles': 'मेरे वाहन',
            'menu.documents': 'दस्तावेज़',
            'menu.bank_account': 'बैंक खाता',
            'menu.notifications': 'सूचनाएँ',
            'menu.support': 'सहायता',
            'menu.privacy_security': 'गोपनीयता और सुरक्षा',
            'menu.language': 'भाषा और क्षेत्र',
            'menu.language_description': 'Alpha Freight आपसे कैसे बात करे चुनें',
            'status.pending': 'लंबित',
            'status.completed': 'पूर्ण',
            'button.logout': 'लॉगआउट',
            'nav.home': 'होम',
            'nav.loads': 'लोड',
            'nav.messages': 'संदेश',
            'nav.profile': 'प्रोफ़ाइल',
            'chatbot.title': 'सपोर्ट सहायक',
            'chatbot.greeting': 'नमस्ते! मैं आपका सपोर्ट सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ? मैं प्रोफ़ाइल, अकाउंट सेटिंग्स, दस्तावेज़, वाहन, सहायता विकल्प और बहुत कुछ पर सवालों के जवाब दे सकता हूँ। बस पूछिए!',
            'chatbot.placeholder': 'अपना संदेश लिखें...',
            'language.modal_title': 'भाषा बदलें',
            'language.search_placeholder': 'भाषा खोजें',
            'language.sync_note': 'सभी Alpha Freight ऐप्स पर लागू',
            'language.current': 'वर्तमान',
            'dialog.logout_confirm': 'क्या आप सच में लॉगआउट करना चाहते हैं?',
            'alerts.settings_coming': 'सेटिंग्स पेज जल्द ही आ रहा है!',
            'alerts.vehicles_coming': 'व्हीकल मैनेजमेंट फीचर जल्द उपलब्ध होगा!',
            'alerts.privacy_coming': 'प्राइवेसी सेटिंग्स बहुत जल्द आ रही हैं!'
        },
        bn: {
            'header.title': 'প্রোফাইল',
            'stats.completed': 'সম্পন্ন',
            'stats.active': 'সক্রিয়',
            'stats.rating': 'রেটিং',
            'menu.complete_profile': 'প্রোফাইল সম্পূর্ণ করুন',
            'menu.profile_pending': 'দস্তাবেজ ও ব্যাংক তথ্য প্রয়োজন',
            'menu.profile_completed': 'প্রোফাইল যাচাই হয়েছে, পেমেন্ট চালু',
            'menu.edit_profile': 'প্রোফাইল সম্পাদনা',
            'menu.my_vehicles': 'আমার যানবাহন',
            'menu.documents': 'দস্তাবেজ',
            'menu.bank_account': 'ব্যাংক অ্যাকাউন্ট',
            'menu.notifications': 'নোটিফিকেশন',
            'menu.support': 'সাপোর্ট',
            'menu.privacy_security': 'গোপনীয়তা ও নিরাপত্তা',
            'menu.language': 'ভাষা ও অঞ্চল',
            'menu.language_description': 'Alpha Freight আপনার সাথে কোন ভাষায় কথা বলবে',
            'status.pending': 'অপেক্ষমাণ',
            'status.completed': 'সম্পন্ন',
            'button.logout': 'লগ আউট',
            'nav.home': 'হোম',
            'nav.loads': 'লোড',
            'nav.messages': 'বার্তা',
            'nav.profile': 'প্রোফাইল',
            'chatbot.title': 'সাপোর্ট সহকারী',
            'chatbot.greeting': 'হ্যালো! আমি আপনার সাপোর্ট সহকারী। আজ কীভাবে সাহায্য করতে পারি? প্রোফাইল, অ্যাকাউন্ট সেটিংস, দস্তাবেজ, যানবাহন, সাপোর্ট অপশন ইত্যাদি বিষয়ে প্রশ্নের উত্তর দিতে পারি। শুধু জিজ্ঞেস করুন!',
            'chatbot.placeholder': 'আপনার বার্তা লিখুন...',
            'language.modal_title': 'ভাষা পরিবর্তন',
            'language.search_placeholder': 'ভাষা খুঁজুন',
            'language.sync_note': 'সমস্ত Alpha Freight অ্যাপে প্রযোজ্য',
            'language.current': 'বর্তমান',
            'dialog.logout_confirm': 'আপনি কি সত্যিই লগ আউট করতে চান?',
            'alerts.settings_coming': 'সেটিংস পেজ খুব শিগগিরই আসছে!',
            'alerts.vehicles_coming': 'যানবাহন ব্যবস্থাপনা ফিচার খুব শিগগিরই আসছে!',
            'alerts.privacy_coming': 'গোপনীয়তা সেটিংস খুব শিগগিরই উপলব্ধ হবে!'
        },
        zh: {
            'header.title': '个人资料',
            'stats.completed': '已完成',
            'stats.active': '进行中',
            'stats.rating': '评分',
            'menu.complete_profile': '完善资料',
            'menu.profile_pending': '需要提供文件和银行信息',
            'menu.profile_completed': '资料已验证，付款已开启',
            'menu.edit_profile': '编辑资料',
            'menu.my_vehicles': '我的车辆',
            'menu.documents': '文件',
            'menu.bank_account': '银行账户',
            'menu.notifications': '通知',
            'menu.support': '客服',
            'menu.privacy_security': '隐私与安全',
            'menu.language': '语言与地区',
            'menu.language_description': '选择 Alpha Freight 与你沟通的方式',
            'status.pending': '待处理',
            'status.completed': '已完成',
            'button.logout': '退出登录',
            'nav.home': '首页',
            'nav.loads': '货源',
            'nav.messages': '消息',
            'nav.profile': '资料',
            'chatbot.title': '客服助理',
            'chatbot.greeting': '你好！我是你的客服助理。需要什么帮助？我可以回答关于个人资料、账号设置、文件、车辆、支持选项等问题。随时来问！',
            'chatbot.placeholder': '输入你的消息...',
            'language.modal_title': '切换语言',
            'language.search_placeholder': '搜索语言',
            'language.sync_note': '适用于所有 Alpha Freight 应用',
            'language.current': '当前',
            'dialog.logout_confirm': '确定要退出登录吗？',
            'alerts.settings_coming': '设置页面即将上线！',
            'alerts.vehicles_coming': '车辆管理功能即将上线！',
            'alerts.privacy_coming': '隐私设置很快就会推出！'
        },
        ja: {
            'header.title': 'プロフィール',
            'stats.completed': '完了',
            'stats.active': '稼働中',
            'stats.rating': '評価',
            'menu.complete_profile': 'プロフィールを完了',
            'menu.profile_pending': '書類と銀行情報が必要です',
            'menu.profile_completed': 'プロフィール認証済み・支払い解放',
            'menu.edit_profile': 'プロフィールを編集',
            'menu.my_vehicles': '車両一覧',
            'menu.documents': '書類',
            'menu.bank_account': '銀行口座',
            'menu.notifications': '通知',
            'menu.support': 'サポート',
            'menu.privacy_security': 'プライバシーとセキュリティ',
            'menu.language': '言語と地域',
            'menu.language_description': 'Alpha Freightの表示言語を選択',
            'status.pending': '保留',
            'status.completed': '完了',
            'button.logout': 'ログアウト',
            'nav.home': 'ホーム',
            'nav.loads': '案件',
            'nav.messages': 'メッセージ',
            'nav.profile': 'プロフィール',
            'chatbot.title': 'サポートアシスタント',
            'chatbot.greeting': 'こんにちは！サポートアシスタントです。今日は何をお手伝いできますか？プロフィール、アカウント設定、書類、車両、サポートオプションなどについての質問にお答えします。気軽にどうぞ！',
            'chatbot.placeholder': 'メッセージを入力...',
            'language.modal_title': '言語を変更',
            'language.search_placeholder': '言語を検索',
            'language.sync_note': 'すべてのAlpha Freightアプリに適用',
            'language.current': '現在',
            'dialog.logout_confirm': '本当にログアウトしますか？',
            'alerts.settings_coming': '設定ページはまもなくリリースされます！',
            'alerts.vehicles_coming': '車両管理機能はまもなく公開予定です！',
            'alerts.privacy_coming': 'プライバシー設定はもうすぐ利用可能になります！'
        },
        ko: {
            'header.title': '프로필',
            'stats.completed': '완료',
            'stats.active': '진행 중',
            'stats.rating': '평점',
            'menu.complete_profile': '프로필 완료',
            'menu.profile_pending': '서류와 은행 정보가 필요합니다',
            'menu.profile_completed': '프로필 인증 완료, 정산 활성화',
            'menu.edit_profile': '프로필 수정',
            'menu.my_vehicles': '내 차량',
            'menu.documents': '문서',
            'menu.bank_account': '은행 계좌',
            'menu.notifications': '알림',
            'menu.support': '지원',
            'menu.privacy_security': '개인정보 & 보안',
            'menu.language': '언어 및 지역',
            'menu.language_description': 'Alpha Freight 표시 언어 선택',
            'status.pending': '대기',
            'status.completed': '완료',
            'button.logout': '로그아웃',
            'nav.home': '홈',
            'nav.loads': '화물',
            'nav.messages': '메시지',
            'nav.profile': '프로필',
            'chatbot.title': '지원 어시스턴트',
            'chatbot.greeting': '안녕하세요! 지원 어시스턴트입니다. 무엇을 도와드릴까요? 프로필, 계정 설정, 문서, 차량, 지원 옵션 등 다양한 질문에 답해 드립니다. 편하게 물어보세요!',
            'chatbot.placeholder': '메시지를 입력하세요...',
            'language.modal_title': '언어 변경',
            'language.search_placeholder': '언어 검색',
            'language.sync_note': '모든 Alpha Freight 앱에 적용',
            'language.current': '현재',
            'dialog.logout_confirm': '정말 로그아웃하시겠습니까?',
            'alerts.settings_coming': '설정 페이지가 곧 제공됩니다!',
            'alerts.vehicles_coming': '차량 관리 기능이 곧 제공될 예정입니다!',
            'alerts.privacy_coming': '개인정보 설정이 곧 공개됩니다!'
        },
        nl: {
            'header.title': 'Profiel',
            'stats.completed': 'Voltooid',
            'stats.active': 'Actief',
            'stats.rating': 'Beoordeling',
            'menu.complete_profile': 'Profiel afronden',
            'menu.profile_pending': 'Documenten en bankgegevens vereist',
            'menu.profile_completed': 'Profiel bevestigd, betalingen geactiveerd',
            'menu.edit_profile': 'Profiel bewerken',
            'menu.my_vehicles': 'Mijn voertuigen',
            'menu.documents': 'Documenten',
            'menu.bank_account': 'Bankrekening',
            'menu.notifications': 'Meldingen',
            'menu.support': 'Support',
            'menu.privacy_security': 'Privacy & veiligheid',
            'menu.language': 'Taal & regio',
            'menu.language_description': 'Kies hoe Alpha Freight met je communiceert',
            'status.pending': 'In behandeling',
            'status.completed': 'Voltooid',
            'button.logout': 'Uitloggen',
            'nav.home': 'Home',
            'nav.loads': 'Ladingen',
            'nav.messages': 'Berichten',
            'nav.profile': 'Profiel',
            'chatbot.title': 'Supportassistent',
            'chatbot.greeting': 'Hoi! Ik ben je supportassistent. Waarmee kan ik helpen? Ik beantwoord vragen over je profiel, accountinstellingen, documenten, voertuigen, supportopties en meer. Stel gerust je vraag!',
            'chatbot.placeholder': 'Typ je bericht...',
            'language.modal_title': 'Taal wijzigen',
            'language.search_placeholder': 'Zoek talen',
            'language.sync_note': 'Geldt voor alle Alpha Freight-apps',
            'language.current': 'Actief',
            'dialog.logout_confirm': 'Weet je zeker dat je wilt uitloggen?',
            'alerts.settings_coming': 'De instellingenpagina komt er snel aan!',
            'alerts.vehicles_coming': 'Voertuigbeheer is binnenkort beschikbaar!',
            'alerts.privacy_coming': 'De privacy-instellingen worden snel toegevoegd!'
        },
        sv: {
            'header.title': 'Profil',
            'stats.completed': 'Klart',
            'stats.active': 'Aktivt',
            'stats.rating': 'Betyg',
            'menu.complete_profile': 'Slutför profil',
            'menu.profile_pending': 'Dokument och bankinfo krävs',
            'menu.profile_completed': 'Profil verifierad och utbetalningar öppnade',
            'menu.edit_profile': 'Redigera profil',
            'menu.my_vehicles': 'Mina fordon',
            'menu.documents': 'Dokument',
            'menu.bank_account': 'Bankkonto',
            'menu.notifications': 'Aviseringar',
            'menu.support': 'Support',
            'menu.privacy_security': 'Sekretess & säkerhet',
            'menu.language': 'Språk & region',
            'menu.language_description': 'Välj hur Alpha Freight pratar med dig',
            'status.pending': 'Väntar',
            'status.completed': 'Klart',
            'button.logout': 'Logga ut',
            'nav.home': 'Hem',
            'nav.loads': 'Last',
            'nav.messages': 'Meddelanden',
            'nav.profile': 'Profil',
            'chatbot.title': 'Supportassistent',
            'chatbot.greeting': 'Hej! Jag är din supportassistent. Hur kan jag hjälpa dig i dag? Jag svarar på frågor om profil, kontoinställningar, dokument, fordon, supportalternativ och mer. Det är bara att fråga!',
            'chatbot.placeholder': 'Skriv ditt meddelande...',
            'language.modal_title': 'Byt språk',
            'language.search_placeholder': 'Sök språk',
            'language.sync_note': 'Gäller alla Alpha Freight-appar',
            'language.current': 'Aktiv',
            'dialog.logout_confirm': 'Vill du verkligen logga ut?',
            'alerts.settings_coming': 'Inställningssidan kommer snart!',
            'alerts.vehicles_coming': 'Fordons­hantering lanseras inom kort!',
            'alerts.privacy_coming': 'Sekretessinställningarna kommer mycket snart!'
        }
    };

    function fillMissingTranslations() {
        const base = translations.en || {};
        Object.keys(translations).forEach((lang) => {
            if (lang === 'en') return;
            const dict = translations[lang] || {};
            Object.keys(base).forEach((key) => {
                if (!Object.prototype.hasOwnProperty.call(dict, key)) {
                    dict[key] = base[key];
                }
            });
            translations[lang] = dict;
        });
    }

    fillMissingTranslations();

    class LocalizationManager {
        constructor(options) {
            this.languages = options.languages;
            this.translations = options.translations;
            this.defaultLanguage = options.defaultLanguage;
            this.currentLanguage = this.defaultLanguage;
            this.listeners = [];
        }

        init() {
            this.currentLanguage = this.detectLanguage();
            this.applyRootAttributes();
            this.applyTranslations();
        }

        detectLanguage() {
            try {
                const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (stored && this.translations[stored]) {
                    return stored;
                }
            } catch (error) {
                console.warn('Unable to read stored language preference', error);
            }

            const navigatorLanguage = (window.navigator.language || '').toLowerCase();
            const languageCode = navigatorLanguage.split('-')[0];
            if (this.translations[languageCode]) {
                return languageCode;
            }

            return this.defaultLanguage;
        }

        setLanguage(code) {
            const safeCode = this.translations[code] ? code : this.defaultLanguage;
            if (safeCode === this.currentLanguage) {
                return;
            }
            this.currentLanguage = safeCode;
            try {
                window.localStorage.setItem(LANGUAGE_STORAGE_KEY, safeCode);
            } catch (error) {
                console.warn('Unable to store language preference', error);
            }
            this.applyRootAttributes();
            this.applyTranslations();
            this.notifyListeners();
            emitEvent('i18n:change', { language: this.currentLanguage });
        }

        getLanguage() {
            return this.currentLanguage;
        }

        getLanguages() {
            return this.languages.slice();
        }

        onChange(callback) {
            if (typeof callback === 'function') {
                this.listeners.push(callback);
                callback(this.currentLanguage);
            }
        }

        notifyListeners() {
            this.listeners.forEach((cb) => cb(this.currentLanguage));
        }

        t(key, langCode) {
            const active = langCode || this.currentLanguage;
            const dictionary = this.translations[active] || {};
            if (dictionary[key]) {
                return dictionary[key];
            }
            const fallbackDictionary = this.translations[this.defaultLanguage] || {};
            return fallbackDictionary[key] || '';
        }

        translate(key, fallbackText = '', replacements) {
            let template = this.t(key) || fallbackText || '';
            if (!replacements || typeof template !== 'string') {
                return template;
            }
            return template.replace(/\{(\w+)\}/g, (_, token) => {
                if (Object.prototype.hasOwnProperty.call(replacements, token)) {
                    return replacements[token];
                }
                return `{${token}}`;
            });
        }

        applyRootAttributes() {
            if (document.documentElement) {
                document.documentElement.setAttribute('lang', this.currentLanguage);
            }
            if (document.body) {
                document.body.setAttribute('dir', this.currentLanguage === 'ar' ? 'rtl' : 'ltr');
            }
        }

        applyTranslations() {
            const textNodes = document.querySelectorAll('[data-i18n]');
            textNodes.forEach((node) => {
                const key = node.getAttribute('data-i18n');
                if (!key) {
                    return;
                }
                const translation = this.t(key);
                if (!translation) {
                    return;
                }
                const targetAttr = node.getAttribute('data-i18n-attr');
                if (targetAttr) {
                    node.setAttribute(targetAttr, translation);
                    return;
                }

                if (node.tagName === 'INPUT' && Object.prototype.hasOwnProperty.call(node, 'placeholder')) {
                    node.placeholder = translation;
                    return;
                }

                node.textContent = translation;
            });

            const htmlNodes = document.querySelectorAll('[data-i18n-html]');
            htmlNodes.forEach((node) => {
                const key = node.getAttribute('data-i18n-html');
                if (!key) {
                    return;
                }
                const translation = this.t(key);
                if (translation) {
                    node.innerHTML = translation;
                }
            });
        }
    }

    const manager = new LocalizationManager({
        languages: languageCatalog,
        translations,
        defaultLanguage: 'en'
    });

    function bootstrapLocalization() {
        manager.init();
        manager.notifyListeners();
        emitEvent('i18n:ready', { language: manager.getLanguage() });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrapLocalization);
    } else {
        bootstrapLocalization();
    }

    window.I18nManager = manager;
})(window);

