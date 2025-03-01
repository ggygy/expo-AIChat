import React, { useEffect } from 'react';
import { View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import CodeBlock from './CodeBlock';
import InlineCode from './InlineCode';

interface Props {
  children: string;
  style?: any;
  [key: string]: any;
}

const MarkdownWithCodeHighlight = ({ children, style, ...rest }: Props) => {
  // 创建自定义规则
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

  return (
    <View>
      <Markdown
        style={style}
        rules={{
          fence: customRules.fence,
          code_block: customRules.codeBlock,
          code_inline: customRules.inlineCode,
          // 添加这些备选规则名称
          codeBlock: customRules.codeBlock,
          inlineCode: customRules.inlineCode,
        }}
        {...rest}
      >
        {children}
      </Markdown>
    </View>
  );
};

export default MarkdownWithCodeHighlight;
