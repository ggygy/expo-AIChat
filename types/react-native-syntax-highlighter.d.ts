declare module 'react-native-syntax-highlighter' {
  import { ReactNode } from 'react';
  import { StyleProp, TextStyle, ViewStyle } from 'react-native';

  interface SyntaxHighlighterProps {
    language?: string;
    style?: Record<string, any>;
    children: string;
    customStyle?: StyleProp<ViewStyle>;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    CodeTag?: (props: { style: any, children: ReactNode }) => JSX.Element;
    wrapLines?: boolean;
    lineProps?: ((lineNumber: number) => any) | object;
    showLineNumbers?: boolean;
    startingLineNumber?: number;
    lineNumberStyle?: StyleProp<TextStyle>;
  }

  export default function SyntaxHighlighter(props: SyntaxHighlighterProps): JSX.Element;
}

declare module 'react-syntax-highlighter/styles/hljs' {
  const atomOneDark: any;
  const atomOneLight: any;
  const docco: any;
  const github: any;
  const vs2015: any;
  const tomorrow: any;
  
  export { 
    atomOneDark, 
    atomOneLight, 
    docco, 
    github, 
    vs2015, 
    tomorrow 
  };
}

declare module 'react-syntax-highlighter/styles/prism' {
  const atomDark: any;
  const base16AteliersulphurpoolLight: any;
  const coldarkCold: any;
  const coldarkDark: any;
  const coy: any;
  const darcula: any;
  const dracula: any;
  const duotoneDark: any;
  const duotoneLight: any;
  const funky: any;
  const ghcolors: any;
  const gruvboxDark: any;
  const gruvboxLight: any;
  const holiTheme: any;
  const hopscotch: any;
  const materialDark: any;
  const materialLight: any;
  const materialOceanic: any;
  const nightOwl: any;
  const nord: any;
  const okaidia: any;
  const oneDark: any;
  const oneLight: any;
  const pojoaque: any;
  const prism: any;
  const shadesOfPurple: any;
  const solarizedlight: any;
  const synthwave84: any;
  const tomorrow: any;
  const twilight: any;
  const vscDarkPlus: any;
  const vsDark: any;
  const vsLight: any;

  export {
    atomDark,
    base16AteliersulphurpoolLight,
    coldarkCold,
    coldarkDark,
    coy,
    darcula,
    dracula,
    duotoneDark,
    duotoneLight,
    funky,
    ghcolors,
    gruvboxDark,
    gruvboxLight,
    holiTheme,
    hopscotch,
    materialDark,
    materialLight,
    materialOceanic,
    nightOwl,
    nord,
    okaidia,
    oneDark,
    oneLight,
    pojoaque,
    prism,
    shadesOfPurple,
    solarizedlight,
    synthwave84,
    tomorrow,
    twilight,
    vscDarkPlus,
    vsDark,
    vsLight
  };
}
