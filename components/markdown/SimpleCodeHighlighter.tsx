import React, { memo, useMemo } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { 
  KEYWORDS, 
  TYPES, 
  CSS_PROPERTIES, 
  HTML_ATTRIBUTES, 
  LANGUAGE_ALIASES, 
  OPERATORS, 
  PUNCTUATIONS, 
  getThemeColors 
} from '../../constants/codeHighlighterConstants';

interface Props {
  code: string;
  language?: string;
  isDark: boolean;
}

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
    
    // 标记是否在多行注释中
    let inMultilineComment = false;

    lines.forEach((line, lineIndex) => {
      // 如果在多行注释中，检查是否有结束标记
      if (inMultilineComment) {
        const commentEndIndex = line.indexOf('*/');
        if (commentEndIndex !== -1) {
          // 添加注释的结尾部分
          result.push({
            text: line.substring(0, commentEndIndex + 2),
            color: colors.comment
          });
          
          // 处理注释后的内容
          if (commentEndIndex + 2 < line.length) {
            // 重新处理注释后的内容
            processLine(line.substring(commentEndIndex + 2), result);
          }
          
          inMultilineComment = false;
        } else {
          // 整行都是注释
          result.push({
            text: line + (lineIndex < lines.length - 1 ? '\n' : ''),
            color: colors.comment
          });
        }
        
        // 添加换行符（如果不是最后一行）
        if (lineIndex < lines.length - 1 && !inMultilineComment) {
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
      
      // 检查多行注释的开始
      const commentStartIndex = line.indexOf('/*');
      if (commentStartIndex !== -1) {
        // 处理注释前的内容
        if (commentStartIndex > 0) {
          processLine(line.substring(0, commentStartIndex), result);
        }
        
        const commentEndIndex = line.indexOf('*/', commentStartIndex + 2);
        if (commentEndIndex !== -1) {
          // 单行内的多行注释
          result.push({
            text: line.substring(commentStartIndex, commentEndIndex + 2),
            color: colors.comment
          });
          
          // 处理注释后的内容
          if (commentEndIndex + 2 < line.length) {
            processLine(line.substring(commentEndIndex + 2), result);
          }
        } else {
          // 多行注释开始但没有结束
          result.push({
            text: line.substring(commentStartIndex),
            color: colors.comment
          });
          inMultilineComment = true;
        }
      } else {
        // 正常处理行
        processLine(line, result);
      }
      
      // 添加换行符（如果不是最后一行）
      if (lineIndex < lines.length - 1 && !inMultilineComment) {
        result.push({
          text: '\n',
          color: colors.text
        });
      }
    });
    
    return result;
    
    // 处理单行的函数
    function processLine(line: string, result: { text: string, color: string }[]) {
      let currentIndex = 0;
      const tagStack: string[] = []; // 用于跟踪HTML/XML标签
      
      // 处理HTML标签或JSX元素 - 用更复杂的解析方式
      if (
        (normalizedLanguage === 'html' || 
         normalizedLanguage === 'javascript' || 
         normalizedLanguage === 'typescript' || 
         normalizedLanguage === 'jsx' || 
         normalizedLanguage === 'tsx')
      ) {
        while (currentIndex < line.length) {
          // 查找下一个 < 或 > 字符
          const nextLT = line.indexOf('<', currentIndex);
          const nextGT = line.indexOf('>', currentIndex);
          
          if (nextLT !== -1 && (nextGT === -1 || nextLT < nextGT)) {
            // 处理 < 之前的文本
            if (nextLT > currentIndex) {
              processText(line.substring(currentIndex, nextLT), result);
            }
            
            // 检查是否是标签结束符
            if (line[nextLT + 1] === '/') {
              // 结束标签
              const closeTagEnd = line.indexOf('>', nextLT);
              if (closeTagEnd !== -1) {
                result.push({
                  text: line.substring(nextLT, closeTagEnd + 1),
                  color: colors.tag
                });
                currentIndex = closeTagEnd + 1;
              } else {
                result.push({
                  text: line.substring(nextLT),
                  color: colors.tag
                });
                currentIndex = line.length;
              }
            } else if (line[nextLT + 1] === '!') {
              // 可能是注释或DOCTYPE
              result.push({
                text: line.substring(nextLT, nextLT + 2),
                color: colors.comment
              });
              currentIndex = nextLT + 2;
            } else {
              // 开始标签
              // 找到标签名
              const tagNameMatch = /^<([a-zA-Z][a-zA-Z0-9\-_]*)/i.exec(line.substring(nextLT));
              if (tagNameMatch) {
                const tagName = tagNameMatch[1];
                tagStack.push(tagName);
                
                // 添加 < 和标签名
                result.push({
                  text: '<' + tagName,
                  color: colors.tag
                });
                
                // 移动到标签名之后
                currentIndex = nextLT + tagNameMatch[0].length;
                
                // 处理属性
                let isInAttribute = false;
                let attributeName = '';
                let quoteChar = '';
                
                while (currentIndex < line.length) {
                  const char = line[currentIndex];
                  
                  if (!isInAttribute) {
                    // 寻找属性名或标签结束
                    if (char === '>') {
                      result.push({
                        text: '>',
                        color: colors.tag
                      });
                      currentIndex++;
                      break;
                    } else if (char === '/') {
                      // 自闭合标签
                      if (line[currentIndex + 1] === '>') {
                        result.push({
                          text: '/>',
                          color: colors.tag
                        });
                        currentIndex += 2;
                        break;
                      }
                    } else if (/[a-zA-Z_]/.test(char)) {
                      // 可能是属性名
                      const attrMatch = /^([a-zA-Z_][a-zA-Z0-9_\-:]*)/i.exec(line.substring(currentIndex));
                      if (attrMatch) {
                        attributeName = attrMatch[1];
                        result.push({
                          text: attributeName,
                          color: colors.attribute
                        });
                        currentIndex += attributeName.length;
                        isInAttribute = true;
                      } else {
                        // 不是属性，添加普通字符
                        result.push({
                          text: char,
                          color: colors.text
                        });
                        currentIndex++;
                      }
                    } else {
                      // 空格或其他字符
                      result.push({
                        text: char,
                        color: colors.text
                      });
                      currentIndex++;
                    }
                  } else {
                    // 已经有属性名，寻找 = 或下一个属性
                    if (char === '=') {
                      result.push({
                        text: '=',
                        color: colors.operator
                      });
                      currentIndex++;
                      
                      // 跳过空格
                      while (currentIndex < line.length && /\s/.test(line[currentIndex])) {
                        result.push({
                          text: line[currentIndex],
                          color: colors.text
                        });
                        currentIndex++;
                      }
                      
                      // 处理属性值
                      if (currentIndex < line.length) {
                        if (line[currentIndex] === '"' || line[currentIndex] === "'") {
                          quoteChar = line[currentIndex];
                          result.push({
                            text: quoteChar,
                            color: colors.string
                          });
                          currentIndex++;
                          
                          // 找结束引号
                          const quoteEnd = line.indexOf(quoteChar, currentIndex);
                          if (quoteEnd !== -1) {
                            result.push({
                              text: line.substring(currentIndex, quoteEnd),
                              color: colors.string
                            });
                            currentIndex = quoteEnd;
                            result.push({
                              text: quoteChar,
                              color: colors.string
                            });
                            currentIndex++;
                          } else {
                            // 没找到结束引号
                            result.push({
                              text: line.substring(currentIndex),
                              color: colors.string
                            });
                            currentIndex = line.length;
                          }
                        } else {
                          // 非引号属性值
                          const valueEnd = line.indexOf(' ', currentIndex);
                          if (valueEnd !== -1) {
                            result.push({
                              text: line.substring(currentIndex, valueEnd),
                              color: colors.string
                            });
                            currentIndex = valueEnd;
                          } else {
                            result.push({
                              text: line.substring(currentIndex),
                              color: colors.string
                            });
                            currentIndex = line.length;
                          }
                        }
                      }
                      
                      isInAttribute = false;
                    } else {
                      // 处理下一个属性
                      if (/\s/.test(char)) {
                        result.push({
                          text: char,
                          color: colors.text
                        });
                        currentIndex++;
                        isInAttribute = false;
                      } else {
                        result.push({
                          text: char,
                          color: colors.text
                        });
                        currentIndex++;
                      }
                    }
                  }
                }
              } else {
                // 处理普通文本
                processText(line.substring(nextLT), result);
                currentIndex = line.length;
              }
            }
          } else if (nextGT !== -1) {
            // 处理 > 之前的文本
            processText(line.substring(currentIndex, nextGT + 1), result);
            currentIndex = nextGT + 1;
          } else {
            // 处理剩余文本
            processText(line.substring(currentIndex), result);
            currentIndex = line.length;
          }
        }
      } else {
        // 处理普通文本
        processText(line, result);
      }
    }
    
    // 处理普通文本的函数
    function processText(text: string, result: { text: string, color: string }[]) {
      let currentIndex = 0;
      
      while (currentIndex < text.length) {
        let matched = false;
        
        // 尝试匹配字符串
        if (text[currentIndex] === '"' || text[currentIndex] === "'" || text[currentIndex] === '`') {
          const quote = text[currentIndex];
          let endIndex = text.indexOf(quote, currentIndex + 1);
          
          while (endIndex > 0 && text[endIndex - 1] === '\\') {
            endIndex = text.indexOf(quote, endIndex + 1);
          }
          
          if (endIndex > 0) {
            result.push({
              text: text.substring(currentIndex, endIndex + 1),
              color: colors.string
            });
            currentIndex = endIndex + 1;
            matched = true;
          }
        }
        
        // 尝试匹配数字
        if (!matched) {
          const numMatch = /^\d+(\.\d+)?([eE][+-]?\d+)?/.exec(text.substring(currentIndex));
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
          const propertyMatch = /^([a-zA-Z-]+)\s*:/.exec(text.substring(currentIndex));
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
          const attrMatch = /^([a-zA-Z-]+)=["']/.exec(text.substring(currentIndex));
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
          const wordMatch = /^[a-zA-Z_]\w*/.exec(text.substring(currentIndex));
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
          const operator = OPERATORS.find(op => text.substring(currentIndex).startsWith(op));
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
          const punct = PUNCTUATIONS.find(p => text[currentIndex] === p);
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
            text: text[currentIndex],
            color: colors.text
          });
          currentIndex++;
        }
      }
    }
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

export default memo(SimpleCodeHighlighter);
