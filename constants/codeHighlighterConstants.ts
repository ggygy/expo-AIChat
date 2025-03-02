// 扩展的关键字映射
export const KEYWORDS: Record<string, string[]> = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 
    'default', 'break', 'continue', 'class', 'import', 'export', 'from', 'as', 'async', 'await', 'try', 
    'catch', 'finally', 'throw', 'new', 'this', 'super', 'extends', 'static', 'get', 'set', 'typeof', 
    'instanceof', 'of', 'in', 'delete', 'yield', 'with', 'debugger'
  ],
  typescript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 
    'default', 'break', 'continue', 'class', 'interface', 'type', 'enum', 'namespace', 'module', 'import', 
    'export', 'from', 'as', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 
    'extends', 'implements', 'static', 'public', 'private', 'protected', 'readonly', 'abstract', 'get', 
    'set', 'typeof', 'instanceof', 'keyof', 'in', 'of', 'delete', 'is', 'yield', 'infer', 'declare'
  ],
  python: [
    'def', 'class', 'if', 'else', 'elif', 'for', 'while', 'in', 'not', 'is', 'from', 'import', 'as', 
    'try', 'except', 'finally', 'raise', 'assert', 'with', 'pass', 'continue', 'break', 'return', 'yield', 
    'lambda', 'global', 'nonlocal', 'del', 'async', 'await', 'and', 'or'
  ],
  java: [
    'public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 
    'abstract', 'synchronized', 'volatile', 'transient', 'native', 'strictfp', 'return', 'if', 'else', 
    'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally', 
    'throw', 'throws', 'new', 'this', 'super', 'enum', 'assert', 'package', 'import', 'instanceof', 
    'null', 'true', 'false'
  ],
  csharp: [
    'public', 'private', 'protected', 'internal', 'class', 'interface', 'struct', 'enum', 'namespace', 
    'using', 'return', 'if', 'else', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'default', 
    'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'base', 'static', 'readonly', 
    'const', 'virtual', 'override', 'abstract', 'sealed', 'partial', 'async', 'await', 'in', 'out', 'ref', 
    'params', 'null', 'true', 'false', 'event', 'delegate', 'where', 'select', 'from', 'group', 'into', 
    'orderby', 'join', 'let', 'by'
  ],
  go: [
    'package', 'import', 'func', 'return', 'defer', 'go', 'select', 'interface', 'struct', 'map', 
    'chan', 'type', 'const', 'var', 'if', 'else', 'switch', 'case', 'default', 'for', 'range', 'continue', 
    'break', 'fallthrough', 'goto'
  ],
  rust: [
    'fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'trait', 'impl', 'for', 'if', 'else', 
    'match', 'while', 'loop', 'continue', 'break', 'return', 'pub', 'self', 'super', 'where', 'async', 
    'await', 'move', 'unsafe', 'extern', 'use', 'mod', 'as', 'in', 'ref', 'type', 'dyn', 'crate'
  ],
  swift: [
    'class', 'struct', 'enum', 'protocol', 'extension', 'func', 'var', 'let', 'if', 'else', 'switch', 
    'case', 'default', 'for', 'while', 'repeat', 'do', 'return', 'break', 'continue', 'fallthrough', 
    'guard', 'defer', 'throw', 'try', 'catch', 'import', 'typealias', 'associatedtype', 'init', 'deinit', 
    'self', 'static', 'subscript', 'convenience', 'required', 'open', 'public', 'internal', 'private', 
    'fileprivate', 'final', 'lazy', 'mutating', 'nonmutating', 'override', 'where', 'as', 'is', 'nil', 
    'true', 'false'
  ],
  php: [
    'function', 'class', 'interface', 'trait', 'extends', 'implements', 'public', 'protected', 'private', 
    'final', 'abstract', 'static', 'var', 'const', 'if', 'else', 'elseif', 'while', 'do', 'for', 'foreach', 
    'switch', 'case', 'default', 'break', 'continue', 'return', 'require', 'include', 'require_once', 
    'include_once', 'echo', 'print', 'new', 'clone', 'try', 'catch', 'finally', 'throw', 'global', 'namespace', 
    'use', 'as', 'instanceof', 'insteadof'
  ],
  ruby: [
    'def', 'class', 'module', 'if', 'else', 'elsif', 'unless', 'while', 'until', 'for', 'begin', 'end', 
    'do', 'rescue', 'ensure', 'return', 'break', 'next', 'retry', 'redo', 'then', 'yield', 'super', 'self', 
    'nil', 'true', 'false', 'and', 'or', 'not', 'alias', 'require', 'require_relative', 'include', 'extend', 
    'attr_reader', 'attr_writer', 'attr_accessor', 'private', 'protected', 'public'
  ],
  sql: [
    'select', 'from', 'where', 'and', 'or', 'not', 'order by', 'group by', 'having', 'join', 'inner join', 
    'left join', 'right join', 'full join', 'on', 'as', 'insert', 'into', 'values', 'update', 'set', 'delete', 
    'create', 'alter', 'drop', 'table', 'view', 'index', 'procedure', 'function', 'database', 'schema', 
    'constraint', 'primary key', 'foreign key', 'unique', 'check', 'default', 'null', 'is null', 'is not null', 
    'between', 'like', 'in', 'exists', 'union', 'intersect', 'except', 'distinct'
  ],
  html: [
    'html', 'head', 'title', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'th', 
    'td', 'form', 'input', 'button', 'select', 'option', 'label', 'header', 'footer', 'nav', 'section', 
    'article', 'aside', 'main', 'script', 'style', 'link', 'meta', 'iframe'
  ],
  css: [
    '@media', '@import', '@keyframes', '@font-face', 'from', 'to', 'important', 'hover', 'active', 'focus', 
    'first-child', 'last-child', 'nth-child', 'before', 'after'
  ],
  shell: [
    'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'in', 'until', 
    'select', 'time', 'echo', 'exit', 'return', 'set', 'unset', 'export', 'alias', 'unalias', 'source', 
    'local', 'readonly', 'shift', 'cd', 'ls', 'pwd', 'mkdir', 'rmdir', 'cp', 'mv', 'rm', 'cat', 'grep', 'sed', 
    'awk', 'find', 'sort', 'uniq', 'chmod', 'chown'
  ],
  markdown: [
    'header', 'emphasis', 'strong', 'blockquote', 'code', 'list', 'link', 'image', 'table', 'horizontal rule'
  ],
  json: [],
  yaml: ['true', 'false', 'null'],
};

// 扩展的类型映射
export const TYPES: Record<string, string[]> = {
  javascript: [
    'string', 'number', 'boolean', 'null', 'undefined', 'object', 'array', 'symbol', 'bigint', 'Function', 
    'Object', 'Array', 'String', 'Number', 'Boolean', 'RegExp', 'Date', 'Map', 'Set', 'Promise', 'Error'
  ],
  typescript: [
    'string', 'number', 'boolean', 'null', 'undefined', 'any', 'void', 'never', 'object', 'array', 'unknown', 
    'symbol', 'bigint', 'Function', 'Object', 'Array', 'String', 'Number', 'Boolean', 'RegExp', 'Date', 
    'Map', 'Set', 'Promise', 'Error', 'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Exclude', 
    'Extract', 'Parameters', 'ReturnType', 'Awaited'
  ],
  python: [
    'str', 'int', 'float', 'bool', 'list', 'dict', 'tuple', 'set', 'frozenset', 'bytes', 'bytearray', 
    'complex', 'None', 'True', 'False'
  ],
  java: [
    'int', 'byte', 'short', 'long', 'float', 'double', 'char', 'boolean', 'void', 'String', 'Integer', 'Long', 
    'Float', 'Double', 'Boolean', 'Object', 'List', 'Map', 'Set', 'Collection', 'ArrayList', 'HashMap', 'HashSet'
  ],
  csharp: [
    'int', 'uint', 'long', 'ulong', 'short', 'ushort', 'byte', 'sbyte', 'float', 'double', 'decimal', 
    'char', 'string', 'bool', 'object', 'void', 'var', 'dynamic', 'List', 'Dictionary', 'HashSet', 
    'IEnumerable', 'Task', 'Func', 'Action', 'Delegate', 'DateTime'
  ],
  go: [
    'int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 
    'float64', 'complex64', 'complex128', 'byte', 'rune', 'string', 'bool', 'error'
  ],
  rust: [
    'i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize', 'f32', 'f64', 
    'bool', 'char', 'str', 'String', 'Option', 'Result', 'Vec', 'Box', 'Rc', 'Arc', 'Cell', 'RefCell'
  ],
  swift: [
    'Int', 'Int8', 'Int16', 'Int32', 'Int64', 'UInt', 'UInt8', 'UInt16', 'UInt32', 'UInt64', 'Float', 
    'Double', 'Bool', 'Character', 'String', 'Array', 'Dictionary', 'Set', 'Optional', 'Any', 'AnyObject'
  ],
  php: [
    'int', 'float', 'bool', 'string', 'array', 'object', 'callable', 'iterable', 'null', 'void', 'mixed', 
    'self', 'parent', 'static', 'true', 'false', 'null'
  ],
  ruby: [
    'Integer', 'Float', 'String', 'Array', 'Hash', 'Symbol', 'Regexp', 'Range', 'Time', 'File', 'Dir', 
    'Exception', 'BasicObject', 'Object', 'Class', 'Module'
  ],
  sql: [
    'int', 'integer', 'bigint', 'smallint', 'tinyint', 'float', 'real', 'double', 'decimal', 'numeric', 
    'char', 'varchar', 'text', 'nchar', 'nvarchar', 'ntext', 'date', 'datetime', 'time', 'timestamp', 
    'boolean', 'bit', 'binary', 'varbinary', 'blob', 'clob', 'xml', 'json'
  ],
  html: [],
  css: [
    'px', 'em', 'rem', '%', 'vh', 'vw', 'vmin', 'vmax', 'auto', 'none', 'inline', 'block', 'flex', 'grid', 
    'absolute', 'relative', 'fixed', 'static', 'sticky', 'hidden', 'visible', 'inherit', 'initial', 'unset', 
    'transparent'
  ],
  shell: [],
  json: [],
  yaml: [],
};

// CSS属性列表
export const CSS_PROPERTIES: string[] = [
  'color', 'background', 'background-color', 'font-size', 'font-family', 'font-weight', 'margin',
  'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'right', 'bottom', 'left',
  'z-index', 'float', 'clear', 'overflow', 'text-align', 'text-decoration', 'text-transform',
  'line-height', 'letter-spacing', 'white-space', 'vertical-align', 'visibility', 'opacity',
  'transition', 'transform', 'animation', 'flex', 'grid', 'content', 'cursor', 'box-shadow',
  'border-radius', 'box-sizing', 'max-width', 'min-width', 'max-height', 'min-height', 'outline'
];

// HTML属性列表
export const HTML_ATTRIBUTES: string[] = [
  'id', 'class', 'style', 'href', 'src', 'alt', 'title', 'width', 'height', 'type', 'name',
  'value', 'placeholder', 'disabled', 'readonly', 'checked', 'selected', 'required', 'multiple',
  'action', 'method', 'target', 'rel', 'data-', 'aria-', 'role', 'lang', 'onclick', 'onchange',
  'onsubmit', 'onload', 'onkeydown', 'onkeyup', 'onmouseover', 'onmouseout'
];

// 语言别名映射
export const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  jsx: 'javascript',
  py: 'python',
  rb: 'ruby',
  cs: 'csharp',
  'c#': 'csharp',
  cpp: 'c++',
  sh: 'shell',
  bash: 'shell',
  md: 'markdown',
  yml: 'yaml',
};

// 运算符列表
export const OPERATORS = ['+', '-', '*', '/', '%', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||', '!'];

// 标点符号列表
export const PUNCTUATIONS = [';', ',', '.', ':', '(', ')', '[', ']', '{', '}', '<', '>'];

// 获取语法主题颜色
export const getThemeColors = (isDark: boolean) => {
  if (isDark) {
    return {
      text: '#c5c8c6',
      keyword: '#b294bb',
      type: '#81a2be',
      string: '#b5bd68',
      comment: '#8e908c',
      number: '#de935f',
      background: '#282c34',
      attribute: '#f0c674',
      property: '#8abeb7',
      tag: '#cc6666',
      operator: '#8abeb7',
      punctuation: '#c5c8c6'
    };
  } else {
    return {
      text: '#333',
      keyword: '#a71d5d',
      type: '#0086b3',
      string: '#183691',
      comment: '#969896',
      number: '#0086b3',
      background: '#f8f8f8',
      attribute: '#795da3',
      property: '#0086b3',
      tag: '#63a35c',
      operator: '#a71d5d',
      punctuation: '#333'
    };
  }
};
