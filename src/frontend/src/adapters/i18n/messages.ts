/**
 * Словарь локализации (ru/en).
 *
 * BR-constraint.web-app-browser-chat: i18n-архитектура, без жёстко зашитых
 * строк; возможность добавления локалей. Ключи — kebab-case.
 *
 * Трассируемость: `BR-constraint.web-app-browser-chat` (ru/en, i18n без хардкода);
 * `BR-constraint.ui-header` (выбор языка).
 */

export type Locale = 'ru' | 'en';

export const messages = {
  ru: {
    'app.name': 'GraphRAG',
    'header.index-version': 'Индекс',
    'header.theme': 'Тема',
    'header.language': 'Язык',
    'theme.dark': 'Тёмная',
    'theme.light': 'Светлая',
    'sidebar.new-session': '+ Новая сессия',
    'sidebar.search-placeholder': 'Поиск сессий…',
    'sidebar.no-sessions': 'Сессий пока нет',
    'sidebar.no-sessions-hint': 'Нажмите «+ Новая сессия», чтобы начать',
    'sidebar.rename': 'Переименовать',
    'sidebar.delete': 'Удалить',
    'sidebar.sessions': 'Сессии',
    'chat.empty.title': 'Начните диалог',
    'chat.empty.subtitle': 'Спросите о спецификациях или коде',
    'chat.empty.new-session': 'Новая сессия',
    'chat.empty.select-session': 'Выберите или создайте сессию',
    'chat.empty.history-hint': 'История ваших вопросов будет сохранена в сессиях',
    'chat.empty.suggestion-1': 'Как устроен ретривер?',
    'chat.empty.suggestion-2': 'Как устроен пайплайн индексации?',
    'chat.empty.suggestion-3': 'Индекс актуален?',
    'chat.input-placeholder': 'Введите вопрос по документации…',
    'chat.submit': 'Отправить',
    'chat.loading.retrieval': 'Поиск источников…',
    'chat.loading.generation': 'Генерация ответа…',
    'chat.loading.hint': 'Обычно занимает 3–8 секунд',
    'chat.no-sources.title': 'Источники не найдены',
    'chat.no-sources.description':
      'В корпусе не удалось найти релевантные фрагменты для ответа на ваш запрос. Это может означать, что тема выходит за пределы индексированных документов или запрос слишком специфичен.',
    'chat.no-sources.try': 'Попробуйте:',
    'chat.no-sources.tip-1': 'Переформулируйте запрос более конкретно',
    'chat.no-sources.tip-2': 'Используйте термины из спецификаций или кода',
    'chat.no-sources.tip-3': 'Проверьте, проиндексирован ли нужный документ',
    'chat.contradiction.notice':
      'Найдены противоречия между источниками. Оба варианта представлены ниже.',
    'chat.ambiguous.title': 'Уточните запрос',
    'chat.error.title': 'Ошибка соединения',
    'chat.error.description':
      'Не удалось получить ответ от GraphRAG-сервиса. Проверьте соединение или попробуйте снова через несколько секунд.',
    'chat.error.retry': 'Повторить',
    'chat.error.code': 'Код ошибки',
    'provenance.title': 'Происхождение',
    'provenance.empty': 'Задайте вопрос, чтобы увидеть источники',
    'provenance.no-sources': 'Источники не найдены',
    'provenance.unavailable': 'Недоступно из-за ошибки',
    'provenance.index-version': 'Версия индекса',
    'provenance.source-count': 'источников',
    'footer.monitoring': 'Мониторинг',
  },
  en: {
    'app.name': 'GraphRAG',
    'header.index-version': 'Index',
    'header.theme': 'Theme',
    'header.language': 'Language',
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'sidebar.new-session': '+ New session',
    'sidebar.search-placeholder': 'Search sessions…',
    'sidebar.no-sessions': 'No sessions yet',
    'sidebar.no-sessions-hint': 'Press «+ New session» to start',
    'sidebar.rename': 'Rename',
    'sidebar.delete': 'Delete',
    'sidebar.sessions': 'Sessions',
    'chat.empty.title': 'Start a conversation',
    'chat.empty.subtitle': 'Ask about specs or code',
    'chat.empty.new-session': 'New session',
    'chat.empty.select-session': 'Select or create a session',
    'chat.empty.history-hint': 'Your questions will be saved in sessions',
    'chat.empty.suggestion-1': 'How does the retriever work?',
    'chat.empty.suggestion-2': 'How does the indexing pipeline work?',
    'chat.empty.suggestion-3': 'Is the index up to date?',
    'chat.input-placeholder': 'Ask a question about the docs…',
    'chat.submit': 'Send',
    'chat.loading.retrieval': 'Searching sources…',
    'chat.loading.generation': 'Generating answer…',
    'chat.loading.hint': 'Usually takes 3–8 seconds',
    'chat.no-sources.title': 'No sources found',
    'chat.no-sources.description':
      'No relevant fragments were found in the corpus for your query. The topic may be outside the indexed documents, or the query is too specific.',
    'chat.no-sources.try': 'Try:',
    'chat.no-sources.tip-1': 'Rephrase the query more specifically',
    'chat.no-sources.tip-2': 'Use terms from specs or code',
    'chat.no-sources.tip-3': 'Check that the needed document is indexed',
    'chat.contradiction.notice':
      'Contradictions were found between sources. Both variants are shown below.',
    'chat.ambiguous.title': 'Clarify your query',
    'chat.error.title': 'Connection error',
    'chat.error.description':
      'Could not get an answer from the GraphRAG service. Check the connection or try again in a few seconds.',
    'chat.error.retry': 'Retry',
    'chat.error.code': 'Error code',
    'provenance.title': 'Provenance',
    'provenance.empty': 'Ask a question to see sources',
    'provenance.no-sources': 'No sources found',
    'provenance.unavailable': 'Unavailable due to an error',
    'provenance.index-version': 'Index version',
    'provenance.source-count': 'sources',
    'footer.monitoring': 'Monitoring',
  },
} as const;

export type MessageKey = keyof (typeof messages)['ru'];
