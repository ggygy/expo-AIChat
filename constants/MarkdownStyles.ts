import { StyleSheet, TextStyle } from 'react-native';
import { Colors } from './Colors';

/**
 * 创建适用于亮色和深色模式的 Markdown 渲染样式配置
 * @param props 配置参数，包括颜色主题、字体等
 * @returns 返回 Markdown 样式对象
 */
export const getMarkdownStyles = (props: {
  colorScheme: 'light' | 'dark';
  textColor: string;
  tintColor: string;
  codeBackgroundColor: string;
  tableBorderColor?: string;
  tableHeaderBackgroundColor?: string;
  blockquoteBackgroundColor?: string;
  fontSizeMultiplier?: number;
}) => {
  const { 
    colorScheme, 
    textColor, 
    tintColor, 
    codeBackgroundColor,
    tableBorderColor = colorScheme === 'dark' ? '#424242' : '#E0E0E0',
    tableHeaderBackgroundColor = colorScheme === 'dark' ? '#333333' : '#f5f5f5',
    blockquoteBackgroundColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    fontSizeMultiplier = 1,
  } = props;

  // 语法高亮配色方案
  const syntaxColors = colorScheme === 'dark' 
    ? {
        // Dark 语法高亮
        keyword: '#CC99CD',    // 关键字 - 淡紫色
        string: '#7EC699',     // 字符串 - 淡绿色
        comment: '#767676',    // 注释 - 灰色
        number: '#F08D49',     // 数字 - 橙色
        function: '#6699CC',   // 函数 - 蓝色
        property: '#F2777A',   // 属性 - 红色
        tag: '#F2777A',        // HTML标签 - 红色
        attribute: '#F08D49',  // HTML属性 - 橙色
        variable: '#6699CC',   // 变量 - 蓝色
        operator: '#CCCCCC',   // 操作符 - 白色
      }
    : {
        // Light 语法高亮
        keyword: '#C678DD',    // 关键字 - 紫色
        string: '#98C379',     // 字符串 - 绿色
        comment: '#5C6370',    // 注释 - 灰色
        number: '#D19A66',     // 数字 - 橙色
        function: '#61AFEF',   // 函数 - 蓝色
        property: '#E06C75',   // 属性 - 红色
        tag: '#E06C75',        // HTML标签 - 红色
        attribute: '#D19A66',  // HTML属性 - 橙色
        variable: '#61AFEF',   // 变量 - 蓝色
        operator: '#56B6C2',   // 操作符 - 青色
      };

  const baseFontSize = 15 * fontSizeMultiplier;

  return {
    // 基础文本样式
    body: { 
      color: textColor, 
      fontSize: baseFontSize,
      lineHeight: baseFontSize * 1.5
    } as TextStyle,
    
    // 段落样式
    paragraph: { 
      color: textColor,
      marginVertical: 10,
      fontSize: baseFontSize,
      lineHeight: baseFontSize * 1.5
    } as TextStyle,
    
    // 链接样式
    link: { 
      color: tintColor, 
      textDecorationLine: 'underline' as TextStyle['textDecorationLine'] 
    } as TextStyle,
    
    // 代码块样式
    code_block: { 
      backgroundColor: codeBackgroundColor, 
      padding: 12,
      borderRadius: 8,
      marginVertical: 10,
      fontFamily: 'monospace',
    } as TextStyle,
    
    // 行内代码样式
    code_inline: { 
      backgroundColor: codeBackgroundColor, 
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
      color: syntaxColors.function,
    } as TextStyle,
    
    // 代码围栏样式
    fence: { 
      backgroundColor: codeBackgroundColor, 
      padding: 12,
      borderRadius: 8,
      marginVertical: 10,
      fontFamily: 'monospace',
    } as TextStyle,
    
    // 列表样式
    bullet_list: { 
      marginVertical: 8 
    },
    ordered_list: { 
      marginVertical: 8 
    },
    list_item: { 
      color: textColor, 
      marginVertical: 4,
      flexDirection: 'row',
      fontSize: baseFontSize,
    } as TextStyle,
    
    // 标题样式
    heading1: { 
      color: textColor, 
      fontSize: baseFontSize * 1.6, 
      fontWeight: 'bold', 
      marginVertical: 12 
    } as TextStyle,
    heading2: { 
      color: textColor, 
      fontSize: baseFontSize * 1.5, 
      fontWeight: 'bold', 
      marginVertical: 10 
    } as TextStyle,
    heading3: { 
      color: textColor, 
      fontSize: baseFontSize * 1.4, 
      fontWeight: 'bold', 
      marginVertical: 8 
    } as TextStyle,
    heading4: { 
      color: textColor, 
      fontSize: baseFontSize * 1.3, 
      fontWeight: 'bold', 
      marginVertical: 6 
    } as TextStyle,
    heading5: { 
      color: textColor, 
      fontSize: baseFontSize * 1.2, 
      fontWeight: 'bold', 
      marginVertical: 4 
    } as TextStyle,
    heading6: { 
      color: textColor, 
      fontSize: baseFontSize * 1.1, 
      fontWeight: 'bold', 
      marginVertical: 2 
    } as TextStyle,
    
    // 表格样式
    table: { 
      borderWidth: 1, 
      borderColor: tableBorderColor, 
      marginVertical: 10,
      width: '100%',
    },
    thead: { 
      backgroundColor: tableHeaderBackgroundColor,
    },
    th: { 
      padding: 8,
      borderWidth: 1,
      borderColor: tableBorderColor,
      fontWeight: 'bold',
    } as TextStyle,
    tbody: {},
    tr: {},
    td: { 
      padding: 8,
      borderWidth: 1,
      borderColor: tableBorderColor,
    },
    
    // 引用样式
    blockquote: { 
      borderLeftColor: tintColor, 
      borderLeftWidth: 4, 
      paddingLeft: 12,
      paddingVertical: 4,
      marginVertical: 10,
      backgroundColor: blockquoteBackgroundColor,
      borderRadius: 4 
    },
    
    // 水平线
    hr: { 
      backgroundColor: tableBorderColor, 
      height: 1, 
      marginVertical: 16 
    },
    
    // 图片
    image: { 
      maxWidth: '100%',
      height: 200,
      resizeMode: 'contain',
      marginVertical: 10,
    },

    // 强调
    strong: {
      fontWeight: 'bold'
    } as TextStyle,

    // 斜体
    em: {
      fontStyle: 'italic'
    } as TextStyle,

    // 删除线
    s: {
      textDecorationLine: 'line-through' as TextStyle['textDecorationLine']
    } as TextStyle,
  };
};

// 预定义的语法高亮样式
export const syntaxHighlightStyles = {
  light: {
    keyword: '#C678DD',    // 关键字 - 紫色
    string: '#98C379',     // 字符串 - 绿色
    comment: '#5C6370',    // 注释 - 灰色
    number: '#D19A66',     // 数字 - 橙色
    function: '#61AFEF',   // 函数 - 蓝色
    property: '#E06C75',   // 属性 - 红色
    tag: '#E06C75',        // HTML标签 - 红色
    attribute: '#D19A66',  // HTML属性 - 橙色
  },
  dark: {
    keyword: '#CC99CD',    // 关键字 - 淡紫色
    string: '#7EC699',     // 字符串 - 淡绿色
    comment: '#767676',    // 注释 - 灰色
    number: '#F08D49',     // 数字 - 橙色
    function: '#6699CC',   // 函数 - 蓝色
    property: '#F2777A',   // 属性 - 红色
    tag: '#F2777A',        // HTML标签 - 红色
    attribute: '#F08D49',  // HTML属性 - 橙色
  },
};
