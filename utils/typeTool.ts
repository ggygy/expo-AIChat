/**
 * 提取枚举的字符串键类型
 * 处理数值枚举时会过滤掉自动生成的数字键
 */
export type EnumKeys<T extends object> = {
    [K in keyof T]: K extends `${number}` ? never : K
  }[keyof T];
  
/**
 * 提取枚举值组成联合类型
 * 支持字符串和数值枚举
 */
export type EnumValues<T extends object> = T[EnumKeys<T>];