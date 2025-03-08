import React, { memo, useEffect, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Easing,
  Text,
  Dimensions,
  LayoutRectangle,
  FlatList
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export interface ActionMenuItem {
  id: string;
  icon: string;
  label: string;
  color?: string;
  onPress: () => void;
}

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: ActionMenuItem[];
  position: { x: number; y: number };
  menuWidth?: number;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  maxItemsPerRow?: number; // 每行最多显示的项目数
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  onClose,
  actions,
  position,
  menuWidth = 250,
  backgroundColor = '#fff',
  textColor = '#333',
  iconColor = '#555',
  maxItemsPerRow = 5,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [menuLayout, setMenuLayout] = useState<LayoutRectangle | null>(null);

  // 根据操作项数量和最大行数计算菜单尺寸
  const columnCount = Math.min(actions.length, maxItemsPerRow);
  const rowCount = Math.ceil(actions.length / maxItemsPerRow);
  
  // 每个项目的宽度 - 确保至少能显示4个字符
  const minimumItemWidth = 60; // 足够宽以确保能显示4个中文字符
  const calculatedItemWidth = menuWidth / columnCount;
  const itemWidth = Math.max(calculatedItemWidth, minimumItemWidth);
  
  // 调整总菜单宽度以适应项目宽度
  const adjustedMenuWidth = itemWidth * columnCount;
  
  // 计算菜单位置，确保不会超出屏幕
  const getMenuPosition = () => {
    if (!menuLayout) {
      return { left: 0, top: 0 };
    }

    // 计算菜单中心点与触摸点的偏移
    const menuHeight = menuLayout.height;
    const menuTotalWidth = Math.min(columnCount * itemWidth, adjustedMenuWidth);
    
    // 开始位置基于触摸点，但确保菜单不会超出屏幕边界
    let left = position.x - (menuTotalWidth / 2); // 居中显示
    let top = position.y - (menuHeight / 2); // 居中显示
    
    // 水平边界检查
    if (left < 10) {
      left = 10; // 左边距
    } else if (left + menuTotalWidth > screenWidth - 10) {
      left = screenWidth - menuTotalWidth - 10; // 右边距
    }
    
    // 垂直边界检查
    if (top < 10) {
      top = 10; // 上边距
    } else if (top + menuHeight > screenHeight - 10) {
      top = screenHeight - menuHeight - 10; // 下边距
    }
    
    return { left, top };
  };

  useEffect(() => {
    if (visible) {
      // 菜单出现动画
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 菜单消失动画
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleMenuPress = (action: ActionMenuItem) => {
    onClose();
    action.onPress();
  };

  const handleLayout = (event: any) => {
    setMenuLayout(event.nativeEvent.layout);
  };

  if (!visible) {
    return null;
  }

  const menuPosition = getMenuPosition();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          onLayout={handleLayout}
          style={[
            styles.menuContainer,
            {
              width: adjustedMenuWidth,
              backgroundColor,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              left: menuPosition.left,
              top: menuPosition.top,
            },
          ]}
        >
          <FlatList
            data={actions}
            numColumns={columnCount}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.menuItem, { width: itemWidth }]}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.menuItemContent}>
                  <FontAwesome
                    name={item.icon as any}
                    size={20}
                    color={item.color || iconColor}
                    style={styles.menuItemIcon}
                  />
                  <Text 
                    style={[styles.menuItemLabel, { color: item.color || textColor }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    borderRadius: 10,
    paddingVertical: 5,
    paddingRight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  menuItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  menuItemIcon: {
    marginBottom: 4,
  },
  menuItemLabel: {
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
});

export default memo(ActionMenu);
