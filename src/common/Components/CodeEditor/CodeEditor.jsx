import React, { useRef, useEffect, useMemo, useState } from 'react'
import ss from './CodeEditor.module.css'

// LANGUAGES 상수 정의
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'vex', label: 'VEX' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'sql', label: 'SQL' },
  { value: 'css', label: 'CSS' }
]

// 언어별 키워드 및 구문 정의
const SYNTAX = {
  javascript: {
    keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'return', 'class', 'extends', 'import', 'export', 'default', 'new', 'this', 'super', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'async', 'await'],
    declarations: ['const', 'let', 'var', 'function', 'class', 'import', 'export'],
    builtins: ['console', 'Math', 'Date', 'parseInt', 'parseFloat', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'JSON', 'Promise'],
    operators: ['=>', '===', '!==', '+=', '-=', '*=', '/=', '++', '--', '&&', '||', '??', '?.', '...'],
    strings: ['"', "'", '`'],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  python: {
    keywords: ['def', 'class', 'if', 'else', 'elif', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'for', 'while', 'in', 'is', 'not', 'and', 'or', 'pass', 'break', 'continue', 'raise', 'with', 'async', 'await', 'lambda'],
    declarations: ['def', 'class', 'import', 'from'],
    builtins: ['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'sum', 'min', 'max', 'sorted', 'enumerate', 'zip', 'map', 'filter'],
    operators: ['=', '+', '-', '*', '/', '**', '//', '+=', '-=', '*=', '/=', '==', '!=', '<', '>', '<=', '>='],
    strings: ['"', "'", '"""', "'''"],
    comments: {
      line: '#',
      block: { start: '"""', end: '"""' }
    }
  },
  vex: {
    keywords: ['if', 'else', 'for', 'while', 'return', 'break', 'continue'],
    declarations: ['float', 'vector', 'int', 'string', 'void', 'matrix'],
    builtins: [
      'set', 'addpoint', 'addprim', 'setprimgroup', 'setvertexpoint', 'addvertex', 
      'removepoint', 'removeprim', 'noise', 'rand', 'fit', 'lerp', 'clamp', 'mix',
      'print', 'printf'
    ],
    mathFuncs: [
      'sin', 'cos', 'tan', 'length', 'normalize', 'cross', 'dot', 'distance',
      'rotate', 'translate', 'scale', 'radians', 'degrees'
    ],
    operators: [
      '=', '+', '-', '*', '/', '@', '+=', '-=', '*=', '/=', 
      '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!'
    ],
    strings: ['"'],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  java: {
    keywords: [
      'public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized',
      'void', 'boolean', 'char', 'byte', 'short', 'int', 'long', 'float', 'double',
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'return', 'try', 'catch', 'finally', 'throw', 'throws', 'new', 'instanceof',
      'extends', 'implements', 'interface', 'class', 'package', 'import',
      'this', 'super', 'null', 'true', 'false', 'enum', 'assert', 'default',
      'native', 'strictfp', 'transient', 'volatile', 'const', 'goto'
    ],
    declarations: ['class', 'interface', 'enum', 'package', 'import', 'extends', 'implements'],
    builtins: ['System', 'String', 'Integer', 'Double', 'Boolean', 'Array', 'List', 'Map', 'Set'],
    types: ['void', 'boolean', 'char', 'byte', 'short', 'int', 'long', 'float', 'double'],
    operators: ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-='],
    strings: ['"', "'"],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  cpp: {
    keywords: [
      'auto', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 
      'delete', 'do', 'else', 'enum', 'explicit', 'export', 'extern', 'for',
      'friend', 'goto', 'if', 'inline', 'mutable', 'namespace', 'new', 'operator',
      'private', 'protected', 'public', 'register', 'return', 'sizeof', 'static',
      'struct', 'switch', 'template', 'this', 'throw', 'try', 'typedef', 'typeid',
      'typename', 'union', 'using', 'virtual', 'volatile', 'while'
    ],
    declarations: ['class', 'struct', 'enum', 'union', 'namespace', 'template', 'typedef'],
    builtins: ['cout', 'cin', 'endl', 'NULL', 'nullptr', 'true', 'false'],
    types: ['void', 'bool', 'char', 'int', 'float', 'double', 'unsigned', 'signed', 'short', 'long'],
    operators: ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-=', '->', '::', '<<', '>>'],
    strings: ['"', "'"],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  csharp: {
    keywords: ['public', 'private', 'protected', 'static', 'final', 'void', 'main', 'if', 'else', 'return', 'class', 'extends', 'implements', 'interface', 'abstract', 'new', 'this', 'super'],
    operators: ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-='],
    strings: ['"', "'"],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  php: {
    keywords: ['public', 'private', 'protected', 'static', 'final', 'void', 'main', 'if', 'else', 'return', 'class', 'extends', 'implements', 'interface', 'abstract', 'new', 'this', 'super'],
    operators: ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-='],
    strings: ['"', "'"],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  ruby: {
    keywords: ['def', 'class', 'if', 'else', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'for', 'while', 'in', 'is', 'not'],
    operators: ['=', '+', '-', '*', '/', '**', '//', '+=', '-=', '*=', '/='],
    strings: ['"', "'"],
    comments: {
      line: '#',
      block: { start: '=', end: 'end' }
    }
  },
  swift: {
    keywords: ['public', 'private', 'protected', 'static', 'final', 'void', 'main', 'if', 'else', 'return', 'class', 'extends', 'implements', 'interface', 'abstract', 'new', 'this', 'super'],
    operators: ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-='],
    strings: ['"', "'"],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  go: {
    keywords: ['func', 'var', 'const', 'type', 'package', 'import', 'return', 'if', 'else', 'switch', 'case', 'default', 'for', 'range', 'break', 'continue', 'select'],
    operators: ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-='],
    strings: ['"', "'"],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  rust: {
    keywords: ['fn', 'let', 'const', 'mut', 'if', 'else', 'return', 'struct', 'impl', 'trait', 'use', 'as', 'pub', 'crate', 'mod', 'self', 'super'],
    operators: ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-='],
    strings: ['"', "'"],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  typescript: {
    keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'return', 'class', 'extends', 'import', 'export', 'default', 'new', 'this', 'super'],
    operators: ['=>', '===', '!==', '+=', '-=', '*=', '/=', '++', '--'],
    strings: ['"', "'", '`'],
    comments: {
      line: '//',
      block: { start: '/*', end: '*/' }
    }
  },
  sql: {
    keywords: ['select', 'from', 'where', 'group', 'order', 'by', 'having', 'limit', 'offset', 'join', 'on', 'inner', 'outer', 'left', 'right', 'full', 'cross', 'union', 'intersect', 'except', 'case', 'when', 'then', 'else', 'end'],
    operators: ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-='],
    strings: ['"', "'"],
    comments: {
      line: '--',
      block: { start: '/*', end: '*/' }
    }
  },
  css: {
    keywords: [
      'width', 'height', 'margin', 'padding', 'border', 'color', 'background',
      'display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'clear',
      'overflow', 'overflow-x', 'overflow-y', 'z-index', 'font', 'font-family',
      'font-size', 'font-weight', 'line-height', 'text-align', 'text-decoration',
      'text-transform', 'white-space', 'vertical-align', 'visibility', 'opacity',
      'transform', 'transition', 'animation', 'box-shadow', 'border-radius',
      'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'justify-content',
      'align-items', 'align-content', 'order', 'flex-grow', 'flex-shrink',
      'flex-basis', 'align-self', 'grid', 'grid-template', 'grid-template-columns',
      'grid-template-rows', 'grid-template-areas', 'grid-column', 'grid-row',
      'grid-area', 'grid-gap', 'gap', 'column-gap', 'row-gap', 'list-style',
      'list-style-type', 'list-style-position', 'list-style-image', 'table-layout',
      'border-collapse', 'border-spacing', 'empty-cells', 'caption-side',
      'max-width', 'min-width', 'max-height', 'min-height', 'content', 'quotes',
      'counter-reset', 'counter-increment', 'resize', 'cursor', 'user-select',
      'pointer-events', 'outline', 'outline-width', 'outline-style', 'outline-color',
      'outline-offset', 'box-sizing', 'text-shadow', 'text-overflow', 'word-wrap',
      'word-break', 'word-spacing', 'letter-spacing', 'src', 'unicode-range',
      'font-variant', 'font-stretch', 'font-feature-settings', 'backface-visibility',
      'will-change', 'all', 'clip', 'clip-path', 'mask', 'filter', 'backdrop-filter',
      'scroll-behavior', 'overscroll-behavior', 'text-rendering', 'font-display',
      'object-fit', 'object-position', 'columns', 'column-count', 'column-width',
      'column-rule', 'column-span', 'break-before', 'break-after', 'break-inside',
      'page-break-before', 'page-break-after', 'page-break-inside', 'orphans',
      'widows', 'zoom', 'direction', 'unicode-bidi', 'writing-mode', 'text-orientation',
      'text-combine-upright', 'mix-blend-mode', 'isolation', 'background-blend-mode',
      'shape-outside', 'shape-margin', 'shape-image-threshold', 'touch-action',
      'caret-color', 'accent-color', 'scrollbar-color', 'scrollbar-width',
      'tab-size', 'appearance', 'hyphens', 'image-rendering', 'image-orientation',
      'image-resolution', 'ime-mode', 'initial-letter', 'initial-letter-align',
      'input-security', 'line-break', 'line-clamp', 'line-grid', 'line-snap',
      'margin-block', 'margin-block-end', 'margin-block-start', 'margin-inline',
      'margin-inline-end', 'margin-inline-start', 'padding-block', 'padding-block-end',
      'padding-block-start', 'padding-inline', 'padding-inline-end', 'padding-inline-start',
      'text-justify', 'text-underline-position', 'text-underline-offset',
      'text-decoration-thickness', 'text-decoration-skip-ink', 'text-decoration-skip',
      'text-emphasis', 'text-emphasis-color', 'text-emphasis-position', 'text-emphasis-style',
      'text-indent', 'text-size-adjust', 'hanging-punctuation', 'print-color-adjust',
      'stroke', 'fill', 'paint-order', 'font-synthesis', 'font-variant-alternates',
      'font-variant-caps', 'font-variant-east-asian', 'font-variant-ligatures',
      'font-variant-numeric', 'font-variant-position', 'font-optical-sizing',
      'font-palette', 'font-language-override', 'math-style', 'math-depth',
      'container', 'container-type', 'container-name', 'aspect-ratio', 'place-content',
      'place-items', 'place-self', 'row-gap', 'column-gap', 'inset', 'inset-block',
      'inset-inline', 'inset-block-start', 'inset-block-end', 'inset-inline-start',
      'inset-inline-end', 'border-block', 'border-block-color', 'border-block-style',
      'border-block-width', 'border-block-end', 'border-block-end-color',
      'border-block-end-style', 'border-block-end-width', 'border-block-start',
      'border-block-start-color', 'border-block-start-style', 'border-block-start-width',
      'border-inline', 'border-inline-color', 'border-inline-style', 'border-inline-width',
      'border-inline-end', 'border-inline-end-color', 'border-inline-end-style',
      'border-inline-end-width', 'border-inline-start', 'border-inline-start-color',
      'border-inline-start-style', 'border-inline-start-width', 'background-color',
      'background-image', 'background-repeat', 'background-position', 'background-size',
      'background-attachment', 'background-origin', 'background-clip', 'text-align-last',
      'text-decoration-line', 'text-decoration-color', 'text-decoration-style',
      'vertical-align', 'white-space', 'tab-size', 'word-break', 'word-spacing',
      'word-wrap', 'overflow-wrap', 'writing-mode', 'text-combine-upright',
      'text-orientation', 'text-indent', 'text-justify', 'text-underline-position',
      'text-transform', 'letter-spacing', 'color', 'opacity'
    ],
    declarations: [
      '@import', '@media', '@charset', '@keyframes', '@supports', '@font-face',
      '@namespace', '@document', '@page', '@viewport', '@layer', '@property',
      '@container', '@counter-style', '@font-feature-values', '@color-profile',
      '@scope', '@starting-style', '@try', '@catch', '@throw', '@when', '@else',
      '@nest', '@custom-media', '@custom-selector', '@apply', '@screen'
    ],
    builtins: [
      'auto', 'none', 'inherit', 'initial', 'unset', 'hidden', 'visible',
      'block', 'inline', 'flex', 'grid', 'absolute', 'relative', 'fixed',
      'sticky', 'static', 'bold', 'italic', 'underline', 'center', 'left',
      'right', 'justify', 'uppercase', 'lowercase', 'capitalize', 'normal',
      'solid', 'dotted', 'dashed', 'double', 'groove', 'ridge', 'inset', 'outset',
      'thin', 'medium', 'thick', 'transparent', 'currentColor', 'revert',
      'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
      'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji',
      'math', 'fangsong', 'break-word', 'break-all', 'keep-all', 'balance',
      'pretty', 'loose', 'strict', 'legacy', 'manual', 'auto-flow', 'dense',
      'span', 'minmax', 'fit-content', 'min-content', 'max-content',
      'subgrid', 'masonry', 'start', 'end', 'first', 'last', 'baseline',
      'first baseline', 'last baseline', 'space-between', 'space-around',
      'space-evenly', 'stretch', 'safe', 'unsafe', 'legacy', 'flat',
      'preserve-3d', 'content', 'padding', 'border', 'margin', 'fill',
      'stroke', 'color', 'background', 'shadow', 'filter', 'clip', 'path',
      'shape', 'contain', 'size', 'intrinsic', 'extrinsic', 'logical',
      'physical', 'ltr', 'rtl', 'horizontal-tb', 'vertical-rl', 'vertical-lr',
      'inline-start', 'inline-end', 'block-start', 'block-end', 'self-start',
      'self-end', 'self-center', 'self-stretch', 'self-baseline', 'flex-start',
      'flex-end', 'contents', 'flow-root', 'table', 'table-row', 'table-cell',
      'table-column', 'table-caption', 'table-header-group', 'table-row-group',
      'table-footer-group', 'table-column-group', 'run-in', 'list-item',
      'inline-block', 'inline-table', 'inline-flex', 'inline-grid',
      'ruby', 'ruby-base', 'ruby-text', 'ruby-base-container', 'ruby-text-container',
      'ellipsis', 'clip', 'blink', 'small-caps', 'all-small-caps', 'petite-caps',
      'all-petite-caps', 'unicase', 'titling-caps', 'common-ligatures',
      'no-common-ligatures', 'discretionary-ligatures', 'no-discretionary-ligatures',
      'historical-ligatures', 'no-historical-ligatures', 'contextual', 'no-contextual',
      'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions',
      'ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'default',
      'pointer', 'text', 'move', 'copy', 'not-allowed', 'grab', 'grabbing',
      'zoom-in', 'zoom-out', 'e-resize', 'n-resize', 'ne-resize', 'nw-resize',
      's-resize', 'se-resize', 'sw-resize', 'w-resize', 'ew-resize', 'ns-resize',
      'nesw-resize', 'nwse-resize', 'col-resize', 'row-resize', 'all-scroll',
      'crosshair', 'progress', 'wait', 'help', 'context-menu', 'cell', 'alias',
      'vertical-text', 'no-drop', 'all-scroll', 'forwards', 'backwards', 'both',
      'running', 'paused', 'infinite', 'alternate', 'alternate-reverse', 'reverse',
      'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start',
      'step-end', 'cover', 'contain', 'scale-down', 'fill', 'portrait', 'landscape',
      'dark', 'light', 'reduced', 'no-preference', 'high', 'low', 'forced-colors',
      'active', 'inactive', 'fullscreen', 'standalone', 'minimal-ui', 'browser',
      'fine', 'coarse', 'hover', 'none', 'interlace', 'progressive', 'slow',
      'fast', 'opaque', 'translucent', 'srgb', 'p3', 'rec2020', 'high', 'low',
      'standard', 'hdr10', 'hlg', 'dolby-vision'
    ],
    pseudoClasses: [
      ':hover', ':active', ':focus', ':visited', ':link', ':target', ':first-child',
      ':last-child', ':nth-child', ':nth-last-child', ':first-of-type', ':last-of-type',
      ':nth-of-type', ':nth-last-of-type', ':only-child', ':only-of-type', ':empty',
      ':checked', ':disabled', ':enabled', ':required', ':optional', ':valid', ':invalid',
      ':root', ':not', ':is', ':where', ':has', ':focus-within', ':focus-visible',
      ':default', ':defined', ':fullscreen', ':indeterminate', ':placeholder-shown',
      ':playing', ':paused', ':current', ':past', ':future', ':local-link', ':scope',
      ':target-within', ':user-invalid', ':modal', ':dir', ':any-link', ':blank',
      ':host', ':host-context', ':in-range', ':out-of-range', ':read-only', ':read-write',
      ':autofill', ':user-valid', ':popover-open', ':picture-in-picture', ':state',
      ':nth-col', ':nth-last-col', ':lang', ':matches', ':any', ':current', ':past',
      ':future', ':host-context', ':dir', ':role', ':local-link', ':target-within',
      ':user-invalid', ':user-valid', ':valid-drop-target', ':invalid-drop-target',
      ':drop', ':drop-valid', ':drop-invalid', ':drop-active', ':drop-inactive'
    ],
    pseudoElements: [
      '::before', '::after', '::first-line', '::first-letter', '::selection',
      '::marker', '::backdrop', '::placeholder', '::file-selector-button',
      '::slotted', '::part', '::cue', '::grammar-error', '::spelling-error',
      '::target-text', '::highlight', '::first-baseline', '::last-baseline',
      '::nth-fragment', '::view-transition', '::view-transition-group',
      '::view-transition-image-pair', '::view-transition-old', '::view-transition-new'
    ],
    operators: [':', ';', '!', '>', '+', '~', '*', '/', '=', ',', '[', ']'],
    strings: ['"', "'"],
    comments: {
      block: { start: '/*', end: '*/' }
    },
    functions: [
      'rgb', 'rgba', 'hsl', 'hsla', 'url', 'var', 'calc', 'attr',
      'linear-gradient', 'radial-gradient', 'conic-gradient', 'repeat',
      'minmax', 'fit-content', 'repeat', 'auto-fill', 'auto-fit',
      'clamp', 'min', 'max', 'env', 'translate', 'translateX', 'translateY',
      'translateZ', 'translate3d', 'scale', 'scaleX', 'scaleY', 'scaleZ',
      'scale3d', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'rotate3d',
      'skew', 'skewX', 'skewY', 'matrix', 'matrix3d', 'perspective',
      'blur', 'brightness', 'contrast', 'drop-shadow', 'grayscale',
      'hue-rotate', 'invert', 'opacity', 'saturate', 'sepia'
    ],
    importantKeywords: [
      'important'
    ],
    mediaQueryKeywords: [
      'screen', 'print', 'all', 'speech', 'only', 'and', 'or', 'not',
      'min-width', 'max-width', 'min-height', 'max-height', 'orientation',
      'portrait', 'landscape', 'aspect-ratio', 'resolution', 'color',
      'color-gamut', 'display-mode', 'hover', 'pointer', 'any-hover', 'any-pointer',
      'prefers-color-scheme', 'prefers-reduced-motion', 'prefers-contrast',
      'prefers-reduced-transparency', 'forced-colors'
    ],
    animationKeywords: [
      'animation-name', 'animation-duration', 'animation-timing-function', 
      'animation-delay', 'animation-iteration-count', 'animation-direction', 
      'animation-fill-mode', 'animation-play-state', 'ease', 'ease-in', 
      'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end', 
      'steps', 'cubic-bezier', 'infinite', 'forwards', 'backwards', 
      'both', 'normal', 'reverse', 'alternate', 'alternate-reverse', 
      'running', 'paused'
    ]
  }
}

const CodeEditor = ({ code, onChange, language = 'javascript', onLanguageChange, readOnly = false, showLineNumbers = true, theme = 'light', fontSize = '14px' }) => {
  const [showCopyAlert, setShowCopyAlert] = useState(false)
  const lines = (code || '').split('\n')
  const textareaRef = useRef(null)
  const lineNumbersRef = useRef(null)
  const highlightRef = useRef(null)

  const highlightedCode = useMemo(() => {
    if (!code) return ''
    
    const syntax = SYNTAX[language] || SYNTAX.javascript
    
    // HTML 이스케이프
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
    
    // 줄 단위로 처리
    const lines = escaped.split('\n');
    
    // 각 줄을 처리
    const processedLines = lines.map(line => {
      // 한 줄 주석 체크 (줄 시작 부분에 주석 기호가 있는지)
      if (syntax.comments?.line) {
        const lineCommentSymbol = syntax.comments.line;
        const trimmedLine = line.trimStart();
        
        if (trimmedLine.startsWith(lineCommentSymbol)) {
          // 주석 기호와 나머지 부분 분리
          const leadingSpaces = line.substring(0, line.indexOf(trimmedLine));
          const commentSymbolIndex = trimmedLine.indexOf(lineCommentSymbol);
          const commentSymbol = trimmedLine.substring(commentSymbolIndex, commentSymbolIndex + lineCommentSymbol.length);
          const restOfLine = trimmedLine.substring(commentSymbolIndex + lineCommentSymbol.length);
          
          // 주석 스타일 적용
          return `${leadingSpaces}<span class="${ss.lineComment}"><span class="${ss.commentStart}">${commentSymbol}</span>${restOfLine}</span>`;
        }
      }
      
      // CSS 블록 주석 처리 (/* ... */)
      let inBlockComment = false;
      let blockCommentStart = '';
      let blockCommentEnd = '';

      if (syntax.comments?.block) {
        blockCommentStart = syntax.comments.block.start;
        blockCommentEnd = syntax.comments.block.end;
        
        // 이전 줄에서 시작된 블록 주석이 계속되는지 확인
        if (inBlockComment) {
          // 현재 줄에 주석 종료가 있는지 확인
          const endIndex = line.indexOf(blockCommentEnd);
          
          if (endIndex !== -1) {
            // 주석이 현재 줄에서 종료
            const commentContent = line.substring(0, endIndex);
            const commentEnd = line.substring(endIndex, endIndex + blockCommentEnd.length);
            const afterComment = line.substring(endIndex + blockCommentEnd.length);
            
            // 주석 종료 후 inBlockComment 상태 변경
            inBlockComment = false;
            
            // 주석 스타일 적용
            return `<span class="${ss.blockComment}">${commentContent}<span class="${ss.commentEnd}">${commentEnd}</span></span>${afterComment}`;
          } else {
            // 주석이 계속됨
            return `<span class="${ss.blockComment}">${line}</span>`;
          }
        }
        
        // 새로운 블록 주석 시작 확인
        const startIndex = line.indexOf(blockCommentStart);
        if (startIndex !== -1) {
          // 같은 줄에 주석 종료가 있는지 확인
          const endIndex = line.indexOf(blockCommentEnd, startIndex + blockCommentStart.length);
          
          if (endIndex !== -1) {
            // 한 줄 내에서 블록 주석이 시작하고 끝나는 경우
            const beforeComment = line.substring(0, startIndex);
            const commentStart = line.substring(startIndex, startIndex + blockCommentStart.length);
            const commentContent = line.substring(startIndex + blockCommentStart.length, endIndex);
            const commentEnd = line.substring(endIndex, endIndex + blockCommentEnd.length);
            const afterComment = line.substring(endIndex + blockCommentEnd.length);
            
            // 주석 스타일 적용
            return `${beforeComment}<span class="${ss.blockComment}"><span class="${ss.commentStart}">${commentStart}</span>${commentContent}<span class="${ss.commentEnd}">${commentEnd}</span></span>${afterComment}`;
          } else {
            // 주석이 시작되고 현재 줄에서 끝나지 않음
            const beforeComment = line.substring(0, startIndex);
            const commentStart = line.substring(startIndex, startIndex + blockCommentStart.length);
            const commentContent = line.substring(startIndex + blockCommentStart.length);
            
            // 다음 줄에서 주석이 계속됨을 표시
            inBlockComment = true;
            
            // 주석 스타일 적용
            return `${beforeComment}<span class="${ss.blockComment}"><span class="${ss.commentStart}">${commentStart}</span>${commentContent}</span>`;
          }
        }
      }
      
      // 일반 토큰화 및 하이라이팅
      let tokens = line.split(/([<>{}()[\]"'`\s+\-*/=;,.])/g)
        .filter(token => token.length > 0)
        .map((token, index, array) => {
          // 공백 유지
          if (/^\s+$/.test(token)) {
            return token
          }
          
          // 언어별 특수 처리
          switch (language) {
            case 'javascript':
            case 'typescript':
              // 템플릿 리터럴 처리
              if (token === '`') {
                // 템플릿 리터럴 시작 또는 끝
                return `<span class="${ss.string}">${token}</span>`;
              }
              
              // 템플릿 리터럴 내 표현식 처리 (${...})
              if (token === '$' && index + 1 < array.length && array[index + 1] === '{') {
                return `<span class="${ss.operator}">${token}</span>`;
              }
              
              // JSX 태그 처리
              if ((token === '<' || token === '/>') && 
                  (index + 1 < array.length && /^[A-Z][a-zA-Z]*$/.test(array[index + 1]))) {
                return `<span class="${ss.declaration}">${token}</span>`;
              }
              break;
              
            case 'css':
              // CSS 선택자 처리
              if (token === '.' && index + 1 < array.length && 
                  /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(array[index + 1])) {
                return `<span class="${ss.selector}">${token}</span>`;
              }
              
              // CSS ID 선택자 처리
              if (token === '#' && index + 1 < array.length && 
                  /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(array[index + 1])) {
                return `<span class="${ss.selector}">${token}</span>`;
              }
              
              // CSS 클래스 이름 또는 ID 이름 처리
              if (/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(token) && 
                  (index > 0 && (array[index - 1] === '.' || array[index - 1] === '#'))) {
                return `<span class="${ss.selectorName}">${token}</span>`;
              }
              
              // CSS 속성 선택자 처리 ([attr])
              if ((token === '[' || token === ']') && 
                  (index + 1 < array.length || index > 0)) {
                return `<span class="${ss.attrSelector}">${token}</span>`;
              }
              
              // CSS 속성 선택자 내부 처리
              if (index > 1 && array[index - 2] === '[' && 
                  /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(token)) {
                return `<span class="${ss.attrName}">${token}</span>`;
              }
              
              // CSS 속성 선택자 연산자 처리
              if (index > 0 && array[index - 1] === '[' && 
                  (token === '=' || token === '~=' || token === '|=' || 
                   token === '^=' || token === '$=' || token === '*=')) {
                return `<span class="${ss.operator}">${token}</span>`;
              }
              
              // CSS 의사 클래스 처리
              if (syntax.pseudoClasses?.some(pseudo => token === pseudo || 
                  (token.startsWith(':') && pseudo.startsWith(':') && 
                   token.split('(')[0] === pseudo.split('(')[0]))) {
                return `<span class="${ss.pseudoClass}">${token}</span>`;
              }
              
              // CSS 의사 요소 처리
              if (syntax.pseudoElements?.some(pseudo => token === pseudo || 
                  (token.startsWith('::') && token.split('(')[0] === pseudo.split('(')[0]))) {
                return `<span class="${ss.pseudoElement}">${token}</span>`;
              }
              
              // CSS 속성 처리
              if (token === ':' && index > 0 && 
                  /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(array[index - 1])) {
                return `<span class="${ss.operator}">${token}</span>`;
              }
              
              // CSS 값 단위 처리 (px, em, rem 등)
              if (/^[a-zA-Z%]+$/.test(token) && index > 0 && 
                  /^-?\d*\.?\d+$/.test(array[index - 1])) {
                return `<span class="${ss.unit}">${token}</span>`;
              }
              
              // CSS 색상 값 처리 (#fff, #ffffff)
              if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(token)) {
                return `<span class="${ss.color}">${token}</span>`;
              }
              
              // CSS 함수 처리 (rgb, rgba, var 등)
              if (/^[a-zA-Z-]+\($/.test(token) || 
                  (token.endsWith('(') && /^[a-zA-Z-]+$/.test(token.slice(0, -1)))) {
                const funcName = token.endsWith('(') ? token.slice(0, -1) : token.slice(0, -1);
                const openParen = token.endsWith('(') ? '(' : '';
                
                if (syntax.functions?.includes(funcName)) {
                  return `<span class="${ss.function}"><span class="${ss.functionName}">${funcName}</span>${openParen}</span>`;
                }
                return `<span class="${ss.function}">${token}</span>`;
              }
              
              // CSS 함수 닫는 괄호 처리
              if (token === ')' && index > 0) {
                return `<span class="${ss.function}">${token}</span>`;
              }
              
              // CSS 선택자 처리 (태그 이름)
              if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(token) && 
                  (index === 0 || array[index - 1] === ' ' || array[index - 1] === '>' || 
                   array[index - 1] === '+' || array[index - 1] === '~' || array[index - 1] === ',')) {
                return `<span class="${ss.selector}">${token}</span>`;
              }
              
              // CSS 속성 이름 처리
              if (/^[a-zA-Z-][a-zA-Z0-9-]*$/.test(token) && 
                  (index + 1 < array.length && array[index + 1] === ':')) {
                // CSS 키워드 목록에 있는지 확인
                if (syntax.keywords?.includes(token)) {
                  return `<span class="${ss.property}">${token}</span>`;
                }
                return `<span class="${ss.property}">${token}</span>`;
              }
              
              // CSS 중괄호 처리
              if (token === '{' || token === '}') {
                return `<span class="${ss.bracket}">${token}</span>`;
              }
              
              // CSS 세미콜론 처리
              if (token === ';') {
                return `<span class="${ss.operator}">${token}</span>`;
              }
              
              // CSS 콤마 처리
              if (token === ',') {
                return `<span class="${ss.operator}">${token}</span>`;
              }
              
              // CSS 조합자 처리 (>, +, ~)
              if ((token === '>' || token === '+' || token === '~') && 
                  (index + 1 < array.length && /^[a-zA-Z.#\[]/.test(array[index + 1]))) {
                return `<span class="${ss.combinator}">${token}</span>`;
              }
              
              // CSS @규칙 처리
              if (token.startsWith('@')) {
                return `<span class="${ss.declaration}">${token}</span>`;
              }
              
              // CSS !important 처리
              if (token === '!' && index + 1 < array.length && 
                  array[index + 1] === 'important') {
                return `<span class="${ss.important}">${token}</span>`;
              }
              
              if (token === 'important' && index > 0 && array[index - 1] === '!') {
                return `<span class="${ss.important}">${token}</span>`;
              }
              
              // CSS 값 처리 (속성 값) 개선
              if (index > 1 && 
                  /^[a-zA-Z-][a-zA-Z0-9-]*$/.test(array[index - 2]) && 
                  array[index - 1] === ':' && 
                  /^[a-zA-Z-][a-zA-Z0-9-]*$/.test(token)) {
                if (syntax.builtins?.includes(token)) {
                  return `<span class="${ss.value}">${token}</span>`;
                }
                return `<span class="${ss.value}">${token}</span>`;
              }
              
              // 미디어 쿼리 키워드 처리
              if (syntax.mediaQueryKeywords?.includes(token) && 
                  index > 0 && array.slice(0, index).some(t => t === '@media')) {
                return `<span class="${ss.mediaQueryKeyword}">${token}</span>`;
              }
              
              // 애니메이션 키워드 처리
              if (syntax.animationKeywords?.includes(token) && 
                  (index > 0 && (array.slice(0, index).some(t => t === '@keyframes') || 
                                 array.slice(0, index).some(t => /animation/.test(t))))) {
                return `<span class="${ss.animationKeyword}">${token}</span>`;
              }
              break;
              
            case 'python':
              // f-string 처리
              if (token === 'f' && index + 1 < array.length && 
                  (array[index + 1] === "'" || array[index + 1] === '"')) {
                return `<span class="${ss.string}">${token}</span>`;
              }
              
              // 데코레이터 처리
              if (token === '@' && index + 1 < array.length) {
                return `<span class="${ss.declaration}">${token}</span>`;
              }
              break;
              
            case 'vex':
              // 변수 선언 패턴 (예: f@cd)
              const vexVarPattern = /^([a-zA-Z_]\w*)?@([a-zA-Z_]\w*)?$/
              if (vexVarPattern.test(token)) {
                return `<span class="${ss.variable}">${token}</span>`
              }
              // @ 기호가 포함된 경우
              if (token.includes('@')) {
                const parts = token.split('@')
                if (parts.length === 2) {
                  return `<span class="${ss.variable}">${parts[0]}@${parts[1]}</span>`
                }
              }
              
              // VEX 문자열 처리
              if (token === '"') {
                // 다음 토큰이 있고 그 다음에 닫는 따옴표가 있는 경우
                if (index + 1 < array.length && array.indexOf('"', index + 1) > index) {
                  const stringContent = array[index + 1]
                  // 문자열 전체를 하나의 클래스로 스타일링
                  return `<span class="${ss.string}"><span class="${ss.stringQuote}">"</span>${stringContent}<span class="${ss.stringQuote}">"</span></span>`
                }
                return `<span class="${ss.stringQuote}">${token}</span>`
              }
              
              // 이미 처리된 문자열 내용은 건너뛰기
              if (index > 0 && array[index - 1] === '"' && array[index + 1] === '"') {
                return `<span class="${ss.stringContent}">${token}</span>`
              }
              break;
              
            case 'java':
            case 'cpp':
            case 'csharp':
              // 제네릭 타입 처리
              if ((token === '<' || token === '>') && 
                  (index > 0 && /^[A-Z][a-zA-Z]*$/.test(array[index - 1]))) {
                return `<span class="${ss.type}">${token}</span>`;
              }
              
              // 어노테이션/애트리뷰트 처리
              if (token === '@' && index + 1 < array.length) {
                return `<span class="${ss.declaration}">${token}</span>`;
              }
              break;
              
            case 'sql':
              // SQL 키워드는 대소문자 구분 없이 처리
              if (syntax.keywords?.includes(token.toLowerCase())) {
                return `<span class="${ss.keyword}">${token}</span>`;
              }
              break;
              
            case 'ruby':
              // 심볼 처리 (:symbol)
              if (token.startsWith(':') && token.length > 1) {
                return `<span class="${ss.declaration}">${token}</span>`;
              }
              break;
              
            case 'rust':
              // 라이프타임 파라미터 처리 ('a)
              if (token.startsWith("'") && token.length > 1 && /^'[a-z]$/.test(token)) {
                return `<span class="${ss.declaration}">${token}</span>`;
              }
              break;
          }
          
          // 문자열
          if (syntax.strings?.some(quote => token.startsWith(quote) && token.endsWith(quote))) {
            return `<span class="${ss.string}">${token}</span>`
          }
          
          // 타입 체크를 키워드 체크보다 먼저 수행
          if (syntax.types?.includes(token)) {
            return `<span class="${ss.type}">${token}</span>`;
          }
          
          // 선언 키워드
          if (syntax.declarations?.includes(token)) {
            return `<span class="${ss.declaration}">${token}</span>`;
          }
          
          // 일반 키워드
          if (syntax.keywords?.includes(token)) {
            return `<span class="${ss.keyword}">${token}</span>`;
          }
          
          // 내장 함수
          if (syntax.builtins?.includes(token)) {
            return `<span class="${ss.builtin}">${token}</span>`
          }
          
          // 수학 함수 (VEX 전용)
          if (language === 'vex' && syntax.mathFuncs?.includes(token)) {
            return `<span class="${ss.mathFunc}">${token}</span>`
          }
          
          // 연산자
          if (syntax.operators?.includes(token)) {
            return `<span class="${ss.operator}">${token}</span>`
          }
          
          // 불리언 값
          if (token === 'true' || token === 'false') {
            return `<span class="${ss.boolean}">${token}</span>`
          }
          
          // null 값
          if (token === 'null' || token === 'None' || token === 'nil') {
            return `<span class="${ss.null}">${token}</span>`
          }
          
          // undefined 값
          if (token === 'undefined') {
            return `<span class="${ss.undefined}">${token}</span>`
          }
          
          // this 키워드
          if (token === 'this' || token === 'self') {
            return `<span class="${ss.this}">${token}</span>`
          }
          
          // 정규식 패턴 (JavaScript)
          if ((language === 'javascript' || language === 'typescript') && 
              token.startsWith('/') && token.endsWith('/') && token.length > 2) {
            return `<span class="${ss.regex}">${token}</span>`
          }
          
          // 속성 접근 (obj.prop)
          if (token === '.' && index > 0 && index + 1 < array.length && 
              /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(array[index + 1])) {
            return `<span class="${ss.operator}">${token}</span>`
          }
          
          // 속성 이름
          if (index > 0 && array[index - 1] === '.' && 
              /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(token)) {
            return `<span class="${ss.property}">${token}</span>`
          }
          
          // 숫자
          if (/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(token)) {
            return `<span class="${ss.number}">${token}</span>`
          }
          
          return token
        })
        .filter(Boolean)
      
      return tokens.join('')
    });
    
    // 처리된 줄들을 다시 합침
    return processedLines.join('\n');
  }, [code, language])

  // 스크롤 동기화
  useEffect(() => {
    const textarea = textareaRef.current
    const lineNumbers = lineNumbersRef.current
    const highlight = highlightRef.current

    const handleScroll = () => {
      if (lineNumbers) {
        lineNumbers.scrollTop = textarea.scrollTop
      }
      if (highlight) {
        highlight.scrollTop = textarea.scrollTop
        highlight.scrollLeft = textarea.scrollLeft
      }
    }

    textarea?.addEventListener('scroll', handleScroll)
    return () => textarea?.removeEventListener('scroll', handleScroll)
  }, [])

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setShowCopyAlert(true)
      setTimeout(() => {
        setShowCopyAlert(false)
      }, 2000) // 2초 후 알림 숨김
    }
  }

  return (
    <div className={ss.codeSection}>
      <div className={ss.codeHeader}>
        <span className={ss.codeTitle}>Code</span>
        <select 
          className={ss.languageSelect}
          value={language}
          onChange={(e) => onLanguageChange?.(e.target.value)}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <div className={ss.codeEditorWrap}>
        <div className={ss.lineNumbers} ref={lineNumbersRef}>
          {lines.map((_, i) => (
            <div key={i} className={ss.lineNumber}>
              {i + 1}
            </div>
          ))}
        </div>
        <div className={ss.editorContainer}>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className={ss.codeInput}
            spellCheck="false"
            placeholder="Write or paste your code here"
          />
          <pre 
            ref={highlightRef}
            className={ss.codeHighlight}
            data-language={language}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
          <button 
            className={ss.copyButton}
            onClick={handleCopy}
            title="Copy code"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          {showCopyAlert && (
            <div className={ss.copyAlert}>
              Copied to clipboard!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CodeEditor 