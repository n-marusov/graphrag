/**
 * Реестр иконок GraphRAG — единственный источник иконок для UI-компонентов.
 *
 * Геометрия — из канонических файлов `src/assets/icons/*.svg` (Task 2).
 * Обводка — `currentColor`: цвет задаётся на месте использования через класс
 * (например, `text-muted`, `text-accent`). Маска `icon-mask.svg` в реестр не входит:
 * она используется только макетными видами до их удаления (Task 12).
 *
 * Трассируемость: `BR-constraint.ui-visual-standards` (активное состояние — не только цветом).
 */

export interface IconDef {
  /** Прямоугольная область отрисовки (viewBox исходного SVG) */
  viewBox: string;
  /** Внутренняя разметка SVG (path/circle), обводка — currentColor */
  body: string;
}

export const icons = {
  'chevron-down': {
    viewBox: '0 0 12 12',
    body: '<path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"/>',
  },
  moon: {
    viewBox: '0 0 16 16',
    body: '<path d="M12.849 11.5329C12.1666 12.4699 11.2274 13.1891 10.145 13.6037C9.06254 14.0183 7.88318 14.1104 6.74948 13.869C5.61578 13.6276 4.57627 13.063 3.75661 12.2434C2.93695 11.4239 2.37222 10.3844 2.13071 9.25074C1.8892 8.11706 1.98123 6.9377 2.39569 5.85521C2.81014 4.77272 3.52927 3.83346 4.46615 3.15096C5.40303 2.46846 6.51755 2.07194 7.67497 2.00933C7.94497 1.99467 8.0863 2.316 7.94297 2.54467C7.56076 3.1562 7.35097 3.85969 7.33583 4.58068C7.32068 5.30167 7.50073 6.01334 7.85693 6.64039C8.21312 7.26743 8.73221 7.78652 9.35925 8.14271C9.98629 8.49891 10.698 8.67896 11.419 8.66381C12.14 8.64866 12.8434 8.43888 13.455 8.05667C13.6843 7.91333 14.005 8.054 13.9903 8.324C13.9278 9.48143 13.5314 10.596 12.849 11.5329Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.333333"/>',
  },
  'external-link': {
    viewBox: '0 0 12 12',
    body: '<path d="M7.5 1.5L10.5 1.5L10.5 4.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"/><path d="M5 7L10.5 1.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"/><path d="M9 6.5L9 9.5C9 9.67554 8.95379 9.84798 8.86602 10C8.77826 10.152 8.65202 10.2783 8.5 10.366C8.34798 10.4538 8.17554 10.5 8 10.5L2.5 10.5C2.32446 10.5 2.15202 10.4538 2 10.366C1.84798 10.2783 1.72174 10.152 1.63397 10C1.54621 9.84798 1.5 9.67554 1.5 9.5L1.5 4C1.5 3.82446 1.54621 3.65202 1.63397 3.5C1.72174 3.34798 1.84798 3.22174 2 3.13397C2.15202 3.04621 2.32446 3 2.5 3L5.5 3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"/>',
  },
  pencil: {
    viewBox: '0 0 14 14',
    body: '<path d="M12.8129 3.06827C12.8672 2.72534 12.8116 2.374 12.6539 2.06462C12.4963 1.75524 12.2449 1.50368 11.9355 1.346C11.6262 1.18832 11.2748 1.13261 10.9319 1.18684C10.5889 1.24108 10.272 1.40249 10.0264 1.64793L2.24121 9.43484C2.10577 9.56989 2.00561 9.73616 1.94954 9.91901L1.17896 12.4577C1.16388 12.5081 1.16275 12.5617 1.17566 12.6128C1.18858 12.6638 1.21508 12.7104 1.25234 12.7476C1.2896 12.7848 1.33624 12.8112 1.3873 12.8241C1.43837 12.8369 1.49195 12.8357 1.54238 12.8205L4.08163 12.0505C4.26431 11.995 4.43056 11.8954 4.56579 11.7606L12.3515 3.97368C12.597 3.72815 12.7585 3.41121 12.8129 3.06827Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><path d="M8.75 2.91666L11.0833 5.24999" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/>',
  },
  trash: {
    viewBox: '0 0 14 14',
    body: '<path d="M5.83337 6.41666L5.83337 9.91666" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><path d="M8.16663 6.41666L8.16663 9.91666" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><path d="M11.0833 3.5L11.0833 11.6667C11.0833 11.8715 11.0294 12.0726 10.927 12.25C10.8246 12.4274 10.6773 12.5746 10.5 12.677C10.3226 12.7794 10.1214 12.8333 9.91663 12.8333L4.08329 12.8333C3.8785 12.8333 3.67731 12.7794 3.49996 12.677C3.3226 12.5746 3.17533 12.4274 3.07293 12.25C2.97053 12.0726 2.91663 11.8715 2.91663 11.6667L2.91663 3.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><path d="M1.75 3.5L12.25 3.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><path d="M4.66663 3.49999L4.66663 2.33332C4.66663 2.12853 4.72053 1.92735 4.82293 1.74999C4.92533 1.57263 5.0726 1.42536 5.24996 1.32296C5.42732 1.22056 5.6285 1.16666 5.83329 1.16666L8.16663 1.16666C8.37142 1.16666 8.5726 1.22056 8.74996 1.32296C8.92731 1.42536 9.07459 1.57263 9.17699 1.74999C9.27938 1.92735 9.33329 2.12853 9.33329 2.33332L9.33329 3.49999" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/>',
  },
  search: {
    viewBox: '0 0 14 14',
    body: '<path d="M12.2499 12.25L9.71826 9.71832" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><circle cx="6.41666651" cy="6.41666651" r="4.66666651" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/>',
  },
  'search-x': {
    viewBox: '0 0 20 20',
    body: '<path d="M11.2502 7.08331L7.0835 11.25" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.666667"/><path d="M7.0835 7.08331L11.2502 11.25" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.666667"/><circle cx="9.16666603" cy="9.16666603" r="6.66666651" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.666667"/><path d="M17.4998 17.5L13.9165 13.9167" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.666667"/>',
  },
  'file-text': {
    viewBox: '0 0 14 14',
    body: '<path d="M2.91683 12.677C2.73947 12.5746 2.5922 12.4273 2.4898 12.25C2.3874 12.0726 2.3335 11.8714 2.3335 11.6666L2.3335 2.33329C2.3335 2.1285 2.3874 1.92732 2.4898 1.74996C2.5922 1.57261 2.73947 1.42533 2.91683 1.32293C3.09419 1.22054 3.29537 1.16663 3.50016 1.16663L8.16683 1.16663C8.35149 1.16633 8.53438 1.20256 8.70497 1.27324C8.87557 1.34392 9.03049 1.44765 9.16083 1.57846L11.2538 3.67146C11.385 3.80184 11.489 3.95691 11.5599 4.12772C11.6308 4.29853 11.6671 4.48169 11.6668 4.66663L11.6668 11.6666C11.6668 11.8714 11.6129 12.0726 11.5105 12.25C11.4081 12.4273 11.2609 12.5746 11.0835 12.677C10.9061 12.7794 10.705 12.8333 10.5002 12.8333L3.50016 12.8333C3.29537 12.8333 3.09418 12.7794 2.91683 12.677Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><path d="M8.1665 1.16663L8.1665 4.08329C8.1665 4.18569 8.19346 4.28628 8.24466 4.37496C8.29585 4.46364 8.36949 4.53728 8.45817 4.58847C8.54685 4.63967 8.64744 4.66663 8.74984 4.66663L11.6665 4.66663" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><path d="M5.83317 5.25L4.6665 5.25" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><path d="M9.33317 7.58331L4.6665 7.58331" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/><path d="M9.33317 9.91669L4.6665 9.91669" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.166667"/>',
  },
  'edit-square': {
    viewBox: '0 0 11.9583 11.9581',
    body: '<path d="M7.72925 1.89554L10.0626 4.22887" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.875"/><path d="M9.18771 0.437485L11.5211 2.77053L3.35441 10.9372L0.437744 11.5205L1.02108 8.60386L9.18771 0.437485Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.875"/><path d="M7.72925 1.89554L10.0626 4.22887" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.875"/><path d="M1.31274 8.60387L3.35441 10.6455" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.875"/><path d="M2.47925 9.47888L8.89591 3.06221" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.875"/>',
  },
  clock: {
    viewBox: '0 0 32 32',
    body: '<circle cx="16.0003262" cy="15.9999905" r="13.333334" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.666667"/><path d="M16 8L16 16L21.3333 18.6667" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.666667"/>',
  },
  'message-circle': {
    viewBox: '0 0 32 32',
    body: '<path d="M4.11458 23.3453L2.69458 27.732C2.64883 27.9545 2.66066 28.1849 2.72895 28.4015C2.79724 28.6181 2.91973 28.8137 3.0848 28.9697C3.24987 29.1257 3.45206 29.2369 3.67218 29.2929C3.8923 29.3488 4.12306 29.3476 4.34258 29.2893L8.89325 27.9587C9.38353 27.8614 9.89128 27.9039 10.3586 28.0813C12.8839 29.2607 15.7154 29.619 18.4549 29.1059C21.1944 28.5928 23.7042 27.2341 25.6316 25.2208C27.559 23.2076 28.8071 20.6409 29.2003 17.8816C29.5935 15.1223 29.1122 12.3092 27.824 9.83765C26.5357 7.36609 24.5053 5.36037 22.0182 4.10241C19.5311 2.84446 16.7123 2.39752 13.958 2.82444C11.2038 3.25135 8.65256 4.53064 6.66296 6.48249C4.67337 8.43434 3.34545 10.9606 2.86587 13.7062C2.38629 16.4518 2.77916 19.2786 3.98925 21.7893C4.1853 22.2839 4.22895 22.8258 4.11458 23.3453Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.666667"/>',
  },
  'refresh-cw': {
    viewBox: '0 0 16 16',
    body: '<path d="M2 8C2 6.94678 2.27724 5.91211 2.80385 5C3.33046 4.08788 4.08789 3.33046 5 2.80385C5.91212 2.27724 6.94678 2 8 2C8.83097 2.00313 9.65364 2.16556 10.4234 2.47851C11.1932 2.79145 11.8959 3.2491 12.4933 3.82667L14 5.33333" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.333333"/><path d="M14.0003 2L14.0003 5.33333L10.667 5.33333" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.333333"/><path d="M14 8C14 9.05322 13.7228 10.0879 13.1962 11C12.6695 11.9121 11.9121 12.6695 11 13.1962C10.0879 13.7228 9.05322 14 8 14C7.16903 13.9969 6.34636 13.8344 5.57656 13.5215C4.80677 13.2085 4.10411 12.7509 3.50667 12.1733L2 10.6667" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.333333"/><path d="M5.33333 10.6667L2 10.6667L2 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.333333"/>',
  },
  'server-crash': {
    viewBox: '0 0 28 28',
    body: '<path d="M6.99967 11.6667L4.66634 11.6667C4.25676 11.6667 3.85439 11.5589 3.49967 11.3541C3.14496 11.1493 2.85041 10.8547 2.64562 10.5C2.44082 10.1453 2.33301 9.74293 2.33301 9.33334L2.33301 4.66668C2.33301 4.25709 2.44082 3.85472 2.64562 3.50001C2.85041 3.1453 3.14496 2.85074 3.49967 2.64595C3.85439 2.44116 4.25676 2.33334 4.66634 2.33334L23.333 2.33334C23.7426 2.33334 24.145 2.44116 24.4997 2.64595C24.8544 2.85074 25.1489 3.1453 25.3537 3.50001C25.5585 3.85472 25.6663 4.25709 25.6663 4.66668L25.6663 9.33334C25.6663 9.74293 25.5585 10.1453 25.3537 10.5C25.1489 10.8547 24.8544 11.1493 24.4997 11.3541C24.145 11.5589 23.7426 11.6667 23.333 11.6667L20.9997 11.6667" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.333333"/><path d="M6.99967 16.3333L4.66634 16.3333C4.25676 16.3333 3.85439 16.4411 3.49967 16.6459C3.14496 16.8507 2.85041 17.1453 2.64562 17.5C2.44082 17.8547 2.33301 18.2571 2.33301 18.6666L2.33301 23.3333C2.33301 23.7429 2.44082 24.1453 2.64562 24.5C2.85041 24.8547 3.14496 25.1492 3.49967 25.354C3.85439 25.5588 4.25676 25.6666 4.66634 25.6666L23.333 25.6666C23.7426 25.6666 24.145 25.5588 24.4997 25.354C24.8544 25.1492 25.1489 24.8547 25.3537 24.5C25.5585 24.1453 25.6663 23.7429 25.6663 23.3333L25.6663 18.6666C25.6663 18.2571 25.5585 17.8547 25.3537 17.5C25.1489 17.1453 24.8544 16.8507 24.4997 16.6459C24.145 16.4411 23.7426 16.3333 23.333 16.3333L20.9997 16.3333" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.333333"/><path d="M7 7L7.01167 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.333333"/><path d="M7 21L7.01167 21" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.333333"/><path d="M15.1667 7L10.5 14L17.5 14L12.8333 21" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.333333"/>',
  },
  'triangle-alert': {
    viewBox: '0 0 18 18',
    body: '<path d="M10.2973 2.99998C10.1665 2.76914 9.97678 2.57713 9.74752 2.44354C9.51826 2.30995 9.25767 2.23956 8.99232 2.23956C8.72698 2.23956 8.46639 2.30995 8.23713 2.44354C8.00787 2.57713 7.81815 2.76914 7.68733 2.99998L1.68733 13.5C1.55509 13.729 1.48575 13.9889 1.48633 14.2534C1.48692 14.5178 1.55741 14.7774 1.69066 15.0059C1.82391 15.2343 2.01519 15.4234 2.2451 15.5541C2.47501 15.6848 2.73538 15.7524 2.99983 15.75L14.9998 15.75C15.263 15.7497 15.5215 15.6802 15.7493 15.5484C15.9771 15.4167 16.1662 15.2273 16.2977 14.9993C16.4292 14.7713 16.4984 14.5128 16.4983 14.2496C16.4982 13.9864 16.4289 13.7279 16.2973 13.5L10.2973 2.99998Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M9 6.75L9 9.75" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M9 12.75L9.0075 12.75" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>',
  },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof icons;
