import { TouchableOpacity, StyleSheet, FlatList, View, Switch } from 'react-native';
import type { ViewStyle } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { useState, useCallback } from 'react';
import React from 'react';

// 基础设置项接口
interface BaseItem {
  id: string;
  title: string;
  type: 'select' | 'switch' | 'link';
}

// 下拉选择类型
interface SelectItem extends BaseItem {
  type: 'select';
  currentValue: string;
  options: Array<{ label: string; value: string }>;
  onSelect: (value: string) => void;
}

// 开关类型
interface SwitchItem extends BaseItem {
  type: 'switch';
  value: boolean;
  onValueChange: (value: boolean) => void;
}

// 链接类型
interface LinkItem extends BaseItem {
  type: 'link';
  onPress: () => void;
  value?: string;
}

export type ListItem = SelectItem | SwitchItem | LinkItem;

interface SettingListProps {
  data: ListItem[];
  style?: ViewStyle;
}

interface ItemProps {
  itemData: ListItem
  isLast: boolean
}

// 下拉选择组件
const SelectControl = ({ currentValue, options, onSelect, title }: Partial<SelectItem>) => {
  const [isOpen, setIsOpen] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const currentOption = options?.find(opt => opt.value === currentValue);

  const handleSelect = useCallback((value: string) => {
    setIsOpen(false);
    onSelect?.(value);
  }, [onSelect]);

  return (
    <>
      <TouchableOpacity
        style={styles.valueContainer}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.6}
      >
        <ThemedText style={styles.value} type="defaultSemiBold">
          {currentOption?.label || ''}
        </ThemedText>
        <Ionicons
          name="chevron-down"
          size={20}
          color={textColor}
          style={styles.icon}
        />
      </TouchableOpacity>

      <BottomSheet
        isVisible={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle} type="defaultSemiBold">{title}</ThemedText>
          </View>
          {options?.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.optionItem}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.6}
            >
              <ThemedText 
                style={[
                  styles.optionText,
                  option.value === currentValue && { color: tintColor }
                ]}
              >
                {option.label}
              </ThemedText>
              {option.value === currentValue && (
                <Ionicons
                  name="checkmark"
                  size={24}
                  color={tintColor}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </>
  );
};

// 链接类型组件
const LinkControl = ({ value, onPress }: Partial<LinkItem>) => {
  const textColor = useThemeColor({}, 'text');
  
  return (
    <TouchableOpacity
      style={styles.valueContainer}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {value && (
        <ThemedText style={styles.value} type="defaultSemiBold">
          {value}
        </ThemedText>
      )}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={textColor}
        style={styles.icon}
      />
    </TouchableOpacity>
  );
};

const Item = (props: ItemProps) => {
  const { itemData, isLast } = props;
  const backgroundColor = useThemeColor({}, 'settingItemBackground');
  const tintColor = useThemeColor({}, 'tint');

  const renderControl = () => {
    switch (itemData.type) {
      case 'switch':
        return (
          <View style={styles.switchContainer}>
            <Switch
              value={itemData.value}
              onValueChange={itemData.onValueChange}
              trackColor={{ false: '#E1E3E5', true: tintColor }}
              thumbColor="#FFFFFF"
              style={styles.switch}
              ios_backgroundColor="#E1E3E5"
            />
          </View>
        );
      case 'select':
        return <SelectControl {...itemData} />;
      case 'link':
        return <LinkControl {...itemData} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.item, { backgroundColor }, isLast && styles.lastItem]}>
      <ThemedText style={styles.title} type="defaultSemiBold">{itemData.title}</ThemedText>
      {renderControl()}
    </View>
  );
};

export function SettingList({ data, style }: SettingListProps) {
  const separatorColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={[styles.container, style]}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Item itemData = {item} isLast={index === data.length - 1} />
        )}
        scrollEnabled={false}
        ItemSeparatorComponent={() => (
          <ThemedView style={[styles.separator, { backgroundColor: separatorColor }]} />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    opacity: 0.8,
  },
  icon: {
    marginLeft: 8,
    marginTop: 2,
    opacity: 0.3,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
  },
  selectedOption: {
    fontWeight: '600',
  },
  sheetContent: {
    paddingBottom: 34,  // 增加底部安全距离
  },
  sheetHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  switchContainer: {
    justifyContent: 'center',
    height: 28,
  },
  switch: {
    transform: [{ scaleY: 0.9 }],
  },
});

