export const LANGUAGES = [
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
    { value: 'sql', label: 'SQL' }
]

export const SYNTAX = {
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
        keywords: [
            'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch',
            'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate',
            'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false',
            'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit',
            'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace',
            'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private',
            'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short',
            'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw',
            'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort',
            'using', 'virtual', 'void', 'volatile', 'while'
        ],
        declarations: ['class', 'interface', 'enum', 'struct', 'namespace', 'using'],
        builtins: ['Console', 'Convert', 'String', 'Int32', 'Double', 'Boolean', 'Array', 'List', 'Dictionary'],
        types: ['void', 'bool', 'char', 'int', 'float', 'double', 'string', 'decimal', 'object'],
        operators: ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-=', '?.', '??'],
        strings: ['"', "'", '@"'],
        comments: {
            line: '//',
            block: { start: '/*', end: '*/' }
        }
    },
    php: {
        keywords: [
            'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch',
            'class', 'clone', 'const', 'continue', 'declare', 'default', 'die', 'do',
            'echo', 'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach',
            'endif', 'endswitch', 'endwhile', 'eval', 'exit', 'extends', 'final',
            'finally', 'fn', 'for', 'foreach', 'function', 'global', 'goto', 'if',
            'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface',
            'isset', 'list', 'match', 'namespace', 'new', 'or', 'print', 'private',
            'protected', 'public', 'require', 'require_once', 'return', 'static', 'switch',
            'throw', 'trait', 'try', 'unset', 'use', 'var', 'while', 'xor', 'yield'
        ],
        declarations: ['class', 'interface', 'trait', 'namespace', 'use', 'function'],
        builtins: ['array', 'string', 'int', 'float', 'bool', 'null', 'true', 'false'],
        operators: ['=', '+', '-', '*', '/', '.', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||', '!', '++', '--', '+=', '-=', '.='],
        strings: ['"', "'"],
        comments: {
            line: '//',
            block: { start: '/*', end: '*/' }
        }
    },
    ruby: {
        keywords: [
            'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined?',
            'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for', 'if', 'in',
            'module', 'next', 'nil', 'not', 'or', 'redo', 'rescue', 'retry',
            'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until',
            'when', 'while', 'yield'
        ],
        declarations: ['class', 'module', 'def'],
        builtins: ['puts', 'print', 'require', 'require_relative', 'include', 'extend', 'attr_accessor', 'attr_reader', 'attr_writer'],
        operators: ['=', '+', '-', '*', '/', '**', '%', '==', '===', '!=', '<', '>', '<=', '>=', '<<', '>>', '&&', '||', '!', '..', '...'],
        strings: ['"', "'", '`'],
        comments: {
            line: '#',
            block: { start: '=begin', end: '=end' }
        }
    },
    swift: {
        keywords: [
            'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate',
            'func', 'import', 'init', 'inout', 'internal', 'let', 'open', 'operator',
            'private', 'protocol', 'public', 'static', 'struct', 'subscript', 'typealias',
            'var', 'break', 'case', 'continue', 'default', 'defer', 'do', 'else',
            'fallthrough', 'for', 'guard', 'if', 'in', 'repeat', 'return', 'switch',
            'where', 'while', 'as', 'Any', 'catch', 'false', 'is', 'nil', 'rethrows',
            'super', 'self', 'Self', 'throw', 'throws', 'true', 'try'
        ],
        declarations: ['class', 'struct', 'enum', 'protocol', 'extension', 'func', 'var', 'let'],
        builtins: ['print', 'String', 'Int', 'Double', 'Bool', 'Array', 'Dictionary', 'Set'],
        types: ['Int', 'Double', 'String', 'Bool', 'Character', 'Float', 'Array', 'Dictionary', 'Set'],
        operators: ['=', '+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '??', '...', '..<'],
        strings: ['"'],
        comments: {
            line: '//',
            block: { start: '/*', end: '*/' }
        }
    },
    go: {
        keywords: [
            'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
            'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
            'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type',
            'var'
        ],
        declarations: ['func', 'type', 'var', 'const', 'import', 'package'],
        builtins: ['make', 'len', 'cap', 'new', 'append', 'copy', 'close', 'delete', 'panic', 'recover'],
        types: ['bool', 'string', 'int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr', 'float32', 'float64', 'complex64', 'complex128', 'byte', 'rune', 'error'],
        operators: ['=', '+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '&^', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '&^=', '&&', '||', '<-', '++', '--', '==', '!=', '<', '>', '<=', '>=', '!'],
        strings: ['"', "'", '`'],
        comments: {
            line: '//',
            block: { start: '/*', end: '*/' }
        }
    },
    rust: {
        keywords: [
            'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
            'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
            'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct',
            'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'async',
            'await', 'dyn', 'abstract', 'become', 'box', 'do', 'final', 'macro',
            'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield'
        ],
        declarations: ['fn', 'struct', 'enum', 'trait', 'impl', 'mod', 'use', 'type'],
        builtins: ['Some', 'None', 'Ok', 'Err', 'Vec', 'String', 'Option', 'Result'],
        types: ['i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize', 'f32', 'f64', 'bool', 'char', 'str'],
        operators: ['=', '+', '-', '*', '/', '%', '&', '|', '^', '!', '<', '>', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '==', '!=', '<=', '>=', '&&', '||', '<<', '>>', '=>'],
        strings: ['"', 'r#"'],
        comments: {
            line: '//',
            block: { start: '/*', end: '*/' }
        }
    },
    typescript: {
        keywords: [
            'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class',
            'const', 'continue', 'debugger', 'declare', 'default', 'delete', 'do',
            'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from',
            'function', 'get', 'if', 'implements', 'import', 'in', 'instanceof',
            'interface', 'let', 'new', 'null', 'of', 'package', 'private', 'protected',
            'public', 'return', 'set', 'static', 'super', 'switch', 'this', 'throw',
            'true', 'try', 'type', 'typeof', 'var', 'void', 'while', 'with', 'yield'
        ],
        declarations: ['class', 'interface', 'type', 'enum', 'namespace', 'module', 'import', 'export'],
        builtins: ['console', 'document', 'window', 'Array', 'String', 'Object', 'Number', 'Boolean', 'Function', 'RegExp', 'Promise', 'Date', 'Error'],
        types: ['any', 'boolean', 'null', 'number', 'object', 'string', 'undefined', 'void', 'never', 'symbol', 'unknown'],
        operators: ['=>', '...', '||=', '&&=', '??=', '||', '&&', '??', '|', '&', '==', '===', '!=', '!==', '>=', '<=', '>', '<', '+', '-', '*', '/', '%', '!'],
        strings: ['"', "'", '`'],
        comments: {
            line: '//',
            block: { start: '/*', end: '*/' }
        }
    },
    sql: {
        keywords: [
            'ADD', 'ALL', 'ALTER', 'AND', 'ANY', 'AS', 'ASC', 'BACKUP', 'BETWEEN',
            'CASE', 'CHECK', 'COLUMN', 'CONSTRAINT', 'CREATE', 'DATABASE', 'DEFAULT',
            'DELETE', 'DESC', 'DISTINCT', 'DROP', 'EXEC', 'EXISTS', 'FOREIGN',
            'FROM', 'FULL', 'GROUP', 'HAVING', 'IN', 'INDEX', 'INNER', 'INSERT',
            'INTO', 'IS', 'JOIN', 'LEFT', 'LIKE', 'LIMIT', 'NOT', 'NULL',
            'OR', 'ORDER', 'OUTER', 'PRIMARY', 'PROCEDURE', 'RIGHT', 'ROWNUM',
            'SELECT', 'SET', 'TABLE', 'TOP', 'TRUNCATE', 'UNION', 'UNIQUE',
            'UPDATE', 'VALUES', 'VIEW', 'WHERE'
        ],
        declarations: ['CREATE', 'ALTER', 'DROP', 'TRUNCATE'],
        builtins: [
            'AVG', 'COUNT', 'FIRST', 'LAST', 'MAX', 'MIN', 'SUM', 'UCASE',
            'LCASE', 'MID', 'LEN', 'ROUND', 'NOW', 'FORMAT'
        ],
        operators: ['=', '<>', '<', '>', '<=', '>=', '!=', 'AND', 'OR', 'LIKE', 'IN', 'BETWEEN', 'IS', 'NOT'],
        strings: ["'", '"'],
        comments: {
            line: '--',
            block: { start: '/*', end: '*/' }
        }
    }
}