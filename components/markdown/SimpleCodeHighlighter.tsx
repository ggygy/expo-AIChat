import React, { useMemo } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';

interface Props {
  code: string;
  language?: string;
  isDark: boolean;
}

// 扩展的关键字映射
const KEYWORDS: Record<string, string[]> = {
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
const TYPES: Record<string, string[]> = {
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

const CSS_PROPERTIES: string[] = [
  'color', 'background', 'background-color', 'font-size', 'font-family', 'font-weight', 'margin',
  'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'right', 'bottom', 'left',
  'z-index', 'float', 'clear', 'overflow', 'text-align', 'text-decoration', 'text-transform',
  'line-height', 'letter-spacing', 'white-space', 'vertical-align', 'visibility', 'opacity',
  'transition', 'transform', 'animation', 'flex', 'grid', 'content', 'cursor', 'box-shadow',
  'border-radius', 'box-sizing', 'max-width', 'min-width', 'max-height', 'min-height', 'outline'
];

const HTML_ATTRIBUTES: string[] = [
  'id', 'class', 'style', 'href', 'src', 'alt', 'title', 'width', 'height', 'type', 'name',
  'value', 'placeholder', 'disabled', 'readonly', 'checked', 'selected', 'required', 'multiple',
  'action', 'method', 'target', 'rel', 'data-', 'aria-', 'role', 'lang', 'onclick', 'onchange',
  'onsubmit', 'onload', 'onkeydown', 'onkeyup', 'onmouseover', 'onmouseout'
];

// 语言别名映射
const LANGUAGE_ALIASES: Record<string, string> = {
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

// 获取语法主题颜色
const getThemeColors = (isDark: boolean) => {
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

// 运算符列表
const OPERATORS = ['+', '-', '*', '/', '%', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||', '!'];

// 标点符号列表
const PUNCTUATIONS = [';', ',', '.', ':', '(', ')', '[', ']', '{', '}'];

const SimpleCodeHighlighter: React.FC<Props> = ({ code, language = "", isDark }) => {
  const fontFamily = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
  const colors = getThemeColors(isDark);
  
  // 标准化语言标识符
  const rawLang = language.toLowerCase();
  // 应用语言别名映射
  const normalizedLanguage = LANGUAGE_ALIASES[rawLang] || rawLang;
  
  // 查找适用的关键字集
  const keywords = KEYWORDS[normalizedLanguage] || [];
  const types = TYPES[normalizedLanguage] || [];

  // 解析并高亮代码
  const highlightedCode = useMemo(() => {
    if (!code) return [{ text: '', color: colors.text }];
    
    // 识别代码中的元素
    const lines = code.split('\n');
    const result: { text: string, color: string }[] = [];

    lines.forEach((line, lineIndex) => {
      let currentIndex = 0;
      
      // 处理HTML标签 (针对HTML和JSX)
      if ((normalizedLanguage === 'html' || normalizedLanguage === 'javascript' || normalizedLanguage === 'typescript') 
          && line.includes('<') && line.includes('>')) {
        // 这里简化处理HTML标签
        const tagMatch = /<\/?([a-zA-Z][a-zA-Z0-9]*)/g;
        let match;
        let lastIndex = 0;
        
        // 查找所有HTML标签
        while ((match = tagMatch.exec(line)) !== null) {
          // 添加标签前的文本
          if (match.index > lastIndex) {
            const textBefore = line.substring(lastIndex, match.index);
            result.push({
              text: textBefore,
              color: colors.text
            });
          }
          
          // 添加标签
          result.push({
            text: match[0],
            color: colors.tag
          });
          lastIndex = match.index + match[0].length;
        }
        
        // 添加最后剩余的文本
        if (lastIndex < line.length) {
          result.push({
            text: line.substring(lastIndex),
            color: colors.text
          });
        }
        
        // 添加换行符
        if (lineIndex < lines.length - 1) {
          result.push({
            text: '\n',
            color: colors.text
          });
        }
        
        return;
      }
      
      // 处理行注释
      if ((line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('--'))) {
        result.push({
          text: line + (lineIndex < lines.length - 1 ? '\n' : ''),
          color: colors.comment
        });
        return;
      }
      
      // 处理多行注释开始
      if (line.includes('/*') || line.includes('<!--')) {
        let commentStart = line.indexOf('/*');
        if (commentStart === -1) commentStart = line.indexOf('<!--');
        
        if (commentStart > 0) {
          // 添加注释前的文本
          result.push({
            text: line.substring(0, commentStart),
            color: colors.text
          });
        }
        
        // 添加注释
        result.push({
          text: line.substring(commentStart) + (lineIndex < lines.length - 1 ? '\n' : ''),
          color: colors.comment
        });
        return;
      }
      
      // 处理行内各种元素
      while (currentIndex < line.length) {
        let matched = false;
        
        // 尝试匹配字符串
        if (line[currentIndex] === '"' || line[currentIndex] === "'" || line[currentIndex] === '`') {
          const quote = line[currentIndex];
          let endIndex = line.indexOf(quote, currentIndex + 1);
          
          while (endIndex > 0 && line[endIndex - 1] === '\\') {
            endIndex = line.indexOf(quote, endIndex + 1);
          }
          
          if (endIndex > 0) {
            result.push({
              text: line.substring(currentIndex, endIndex + 1),
              color: colors.string
            });
            currentIndex = endIndex + 1;
            matched = true;
          }
        }
        
        // 尝试匹配数字
        if (!matched) {
          const numMatch = /^\d+(\.\d+)?([eE][+-]?\d+)?/.exec(line.substring(currentIndex));
          if (numMatch) {
            result.push({
              text: numMatch[0],
              color: colors.number
            });
            currentIndex += numMatch[0].length;
            matched = true;
          }
        }
        
        // 尝试匹配CSS属性 (针对CSS文件)
        if (!matched && normalizedLanguage === 'css') {
          const propertyMatch = /^([a-zA-Z-]+)\s*:/.exec(line.substring(currentIndex));
          if (propertyMatch && CSS_PROPERTIES.includes(propertyMatch[1])) {
            result.push({
              text: propertyMatch[1],
              color: colors.property
            });
            currentIndex += propertyMatch[1].length;
            matched = true;
          }
        }
        
        // 尝试匹配HTML属性 (针对HTML文件)
        if (!matched && normalizedLanguage === 'html') {
          const attrMatch = /^([a-zA-Z-]+)=["']/.exec(line.substring(currentIndex));
          if (attrMatch && HTML_ATTRIBUTES.some(attr => attrMatch[1].startsWith(attr))) {
            result.push({
              text: attrMatch[1],
              color: colors.attribute
            });
            currentIndex += attrMatch[1].length;
            matched = true;
          }
        }
        
        // 尝试匹配关键字或类型
        if (!matched) {
          const wordMatch = /^[a-zA-Z_]\w*/.exec(line.substring(currentIndex));
          if (wordMatch) {
            const word = wordMatch[0];
            if (keywords.includes(word.toLowerCase())) {
              result.push({
                text: word,
                color: colors.keyword
              });
            } else if (types.includes(word) || (word[0] === word[0].toUpperCase() && word.length > 1)) {
              result.push({
                text: word,
                color: colors.type
              });
            } else {
              result.push({
                text: word,
                color: colors.text
              });
            }
            currentIndex += word.length;
            matched = true;
          }
        }
        
        // 尝试匹配运算符
        if (!matched) {
          const operator = OPERATORS.find(op => line.substring(currentIndex).startsWith(op));
          if (operator) {
            result.push({
              text: operator,
              color: colors.operator
            });
            currentIndex += operator.length;
            matched = true;
          }
        }
        
        // 尝试匹配标点符号
        if (!matched) {
          const punct = PUNCTUATIONS.find(p => line[currentIndex] === p);
          if (punct) {
            result.push({
              text: punct,
              color: colors.punctuation
            });
            currentIndex++;
            matched = true;
          }
        }
        
        // 如果没有匹配，添加当前字符
        if (!matched) {
          result.push({
            text: line[currentIndex],
            color: colors.text
          });
          currentIndex++;
        }
      }
      
      // 添加换行符
      if (lineIndex < lines.length - 1) {
        result.push({
          text: '\n',
          color: colors.text
        });
      }
    });
    
    return result;
  }, [code, normalizedLanguage, isDark]);

  return (
    <Text style={[styles.codeText, { backgroundColor: colors.background }]}>
      {highlightedCode.map((segment, index) => (
        <Text 
          key={index} 
          style={{ 
            color: segment.color, 
            fontFamily: fontFamily,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
};

const styles = StyleSheet.create({
  codeText: {
    padding: 16,
  }
});

export default SimpleCodeHighlighter;
