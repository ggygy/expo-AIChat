import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import CodeBlock from './CodeBlock';
import InlineCode from './InlineCode';
import SelectableMarkdown from './SelectableMarkdown';
import { ThemedText } from '../ThemedText';

interface Props {
  children: string;
  style?: any;
  [key: string]: any;
}

const MarkdownWithCodeHighlight = ({
  children,
  style,
  ...rest
}: Props) => {
  const customRules = {
    fence: (node: any, children: any, parent: any, styles: any) => {
      return (
        <CodeBlock
          key={node.key}
          language={node.sourceInfo}
          literal={node.content}
        />
      );
    },
    codeBlock: (node: any, children: any, parent: any, styles: any) => {
      return (
        <CodeBlock
          key={node.key}
          language=""
          literal={node.content}
        />
      );
    },
    inlineCode: (node: any, children: any, parent: any, styles: any) => {
      return (
        <InlineCode
          key={node.key}
          literal={node.content}
        />
      );
    }
  };

  // 始终使用Markdown组件渲染，文本选择功能在上层组件中控制
  return (
    <Markdown
      style={style}
      rules={{
        fence: customRules.fence,
        code_block: customRules.codeBlock,
        code_inline: customRules.inlineCode,
        codeBlock: customRules.codeBlock,
        inlineCode: customRules.inlineCode,
      }}
      markdownit={MarkdownIt({
        breaks: true,
        html: true,
      }).disable('smartquotes')} // 配置 markdownit，避免一些默认行为可能影响滚动
      mergeStyle={true} // 确保样式正确合并
      {...rest}
    >
      {children}
    </Markdown>
  );
};

const styles = {
  container: {
    width: '100%',
  },
  markdownText: {
    fontSize: 15,
    lineHeight: 24,
  }
};

export default MarkdownWithCodeHighlight;
