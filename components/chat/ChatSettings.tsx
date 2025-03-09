import React, { memo, useRef, useEffect, useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Animated, 
  Dimensions, 
  PanResponder, 
  Platform, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  LayoutAnimation
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import PromptSelector from './PromptSelector';
import ToolSelector from './ToolSelector';
import i18n from '@/i18n/i18n';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 定义固定的高度档位
const HEIGHT_LEVELS = {
  COMPACT: Math.min(SCREEN_HEIGHT * 0.45, 400), // 紧凑视图
  NORMAL: Math.min(SCREEN_HEIGHT * 0.7, 600),  // 标准视图
  EXPANDED: Math.min(SCREEN_HEIGHT * 1, 850)  // 展开视图
};

// 使用固定值，方便类型检查
const MIN_HEIGHT = HEIGHT_LEVELS.COMPACT;
const MAX_HEIGHT = HEIGHT_LEVELS.EXPANDED;
const DEFAULT_HEIGHT = HEIGHT_LEVELS.NORMAL;

interface ChatSettingsProps {
  botId: string;
  onClose?: () => void;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({ botId, onClose }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const handleColor = useThemeColor({}, 'secondaryText');
  
  // 使用普通状态控制高度
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [currentLevel, setCurrentLevel] = useState<keyof typeof HEIGHT_LEVELS>('NORMAL');
  
  // 动画值 - 只用于控制透明度和位移，这些属性可以使用原生动画
  const translateYAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // 记录拖动时的起始位置
  const panStartY = useRef(0);
  const lastHeight = useRef(DEFAULT_HEIGHT);
  
  // 使用 LayoutAnimation 来实现平滑过渡
  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  // 根据高度设置档位
  const snapToLevel = (newHeight: number, velocity = 0) => {
    let targetLevel: keyof typeof HEIGHT_LEVELS = 'NORMAL';

    // 考虑拖动速度 - 快速向上拖动时直接展开，快速向下拖动时直接收缩
    if (velocity < -1.5) {
      // 快速向上拖动 - 展开
      targetLevel = 'EXPANDED';
    } else if (velocity > 1.5) {
      // 快速向下拖动 - 收缩
      targetLevel = 'COMPACT';
    } else {
      // 根据当前高度与各档位的接近程度判断
      const compactDiff = Math.abs(newHeight - HEIGHT_LEVELS.COMPACT);
      const normalDiff = Math.abs(newHeight - HEIGHT_LEVELS.NORMAL);
      const expandedDiff = Math.abs(newHeight - HEIGHT_LEVELS.EXPANDED);
      
      if (compactDiff <= normalDiff && compactDiff <= expandedDiff) {
        targetLevel = 'COMPACT';
      } else if (normalDiff <= compactDiff && normalDiff <= expandedDiff) {
        targetLevel = 'NORMAL';
      } else {
        targetLevel = 'EXPANDED';
      }
    }
    
    setCurrentLevel(targetLevel);
    animateLayout();
    setHeight(HEIGHT_LEVELS[targetLevel]);
    lastHeight.current = HEIGHT_LEVELS[targetLevel];
    
    return targetLevel;
  };
  
  // 处理拖动手势
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (_, gestureState) => {
        panStartY.current = gestureState.y0;
        lastHeight.current = height;
      },
      
      onPanResponderMove: (_, gestureState) => {
        // 如果向上拖动，dy是负值，应该增加高度
        // 如果向下拖动，dy是正值，应该减少高度
        const deltaY = gestureState.moveY - panStartY.current;
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, lastHeight.current - deltaY));
        
        // 使用setState更新高度，不会触发原生动画兼容性问题
        setHeight(newHeight);
      },
      
      onPanResponderRelease: (_, gestureState) => {
        // 使用速度判断是否应该关闭
        if (gestureState.vy > 2 || (gestureState.vy > 0.5 && gestureState.dy > 100)) {
          onClose?.();
          return;
        }
        
        // 根据最终高度和速度计算应该停留在哪个档位
        const targetLevel = snapToLevel(height, gestureState.vy);
        
        // 如果是最小档位且向下拖动过多，则关闭面板
        if (targetLevel === 'COMPACT' && gestureState.dy > 70) {
          onClose?.();
        }
      }
    })
  ).current;

  // 在档位按钮之间切换
  const toggleLevel = (level: keyof typeof HEIGHT_LEVELS) => {
    setCurrentLevel(level);
    animateLayout();
    setHeight(HEIGHT_LEVELS[level]);
    lastHeight.current = HEIGHT_LEVELS[level];
  };

  // 入场动画
  useEffect(() => {
    // 配置进入动画
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // 使用原生支持的动画属性
    Animated.parallel([
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    return () => {
      translateYAnim.setValue(SCREEN_HEIGHT);
      opacityAnim.setValue(0);
    };
  }, [translateYAnim, opacityAnim]);

  // 背景点击关闭
  const handleBackdropPress = () => {
    onClose?.();
  };

  // 渲染档位指示器和切换按钮
  const renderLevelIndicator = () => (
    <View style={styles.levelIndicatorContainer}>
      <TouchableOpacity 
        style={[
          styles.levelButton, 
          currentLevel === 'COMPACT' && styles.activeLevelButton
        ]}
        onPress={() => toggleLevel('COMPACT')}
      >
        <View style={styles.levelButtonBar} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.levelButton, 
          currentLevel === 'NORMAL' && styles.activeLevelButton
        ]}
        onPress={() => toggleLevel('NORMAL')}
      >
        <View style={styles.levelButtonBar} />
        <View style={styles.levelButtonBar} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.levelButton, 
          currentLevel === 'EXPANDED' && styles.activeLevelButton
        ]}
        onPress={() => toggleLevel('EXPANDED')}
      >
        <View style={styles.levelButtonBar} />
        <View style={styles.levelButtonBar} />
        <View style={styles.levelButtonBar} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.fullScreenContainer}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View 
          style={[
            styles.overlay,
            { 
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: opacityAnim
            }
          ]}
        />
      </TouchableWithoutFeedback>
      
      <Animated.View
        style={[
          styles.container,
          {
            height: height, // 使用普通状态控制高度
            backgroundColor,
            transform: [{ translateY: translateYAnim }]
          }
        ]}
      >
        {/* 拖动手柄 */}
        <View 
          {...panResponder.panHandlers}
          style={styles.dragHandle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.handle, { backgroundColor: handleColor }]} />
          
          {renderLevelIndicator()}
        </View>
        
        {/* 内容区域 */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {i18n.t('chat.selectPromptTemplate')}
            </ThemedText>
            <PromptSelector botId={botId} />
          </View>
          
          <View style={[styles.section, styles.lastSection]}>
            <ThemedText style={styles.sectionTitle}>
              {i18n.t('chat.selectTools')}
            </ThemedText>
            <ToolSelector botId={botId} />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  container: {
    width: SCREEN_WIDTH,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    zIndex: 1001,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 15,
  },
  dragHandle: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    opacity: 0.5,
  },
  levelIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  levelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    opacity: 0.6,
  },
  activeLevelButton: {
    opacity: 1,
  },
  levelButtonBar: {
    width: 16,
    height: 2,
    backgroundColor: '#888',
    marginVertical: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  lastSection: {
    marginBottom: 20,
  },
});

// 使用 memo 并增加自定义比较函数，只有 botId 变化时才重新渲染
export default memo(ChatSettings, (prevProps, nextProps) => {
  return prevProps.botId === nextProps.botId;
});
