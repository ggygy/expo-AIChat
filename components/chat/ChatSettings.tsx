import React, { memo, useRef, useEffect, useState } from 'react';
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
  LayoutAnimation,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import PromptSelector from './PromptSelector';
import ToolSelector from './ToolSelector';
import i18n from '@/i18n/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 定义固定的高度档位
const HEIGHT_LEVELS = {
  COMPACT: Math.min(SCREEN_HEIGHT * 0.40, 400), // 紧凑视图
  NORMAL: Math.min(SCREEN_HEIGHT * 0.7, 600),  // 标准视图
  EXPANDED: Math.min(SCREEN_HEIGHT * 0.9, 800)  // 展开视图
};

// 使用固定值，方便类型检查
const MIN_HEIGHT = HEIGHT_LEVELS.COMPACT;
const MAX_HEIGHT = HEIGHT_LEVELS.EXPANDED;
const DEFAULT_HEIGHT = HEIGHT_LEVELS.NORMAL;

// 下滑关闭阈值 - 下滑超过这个距离将关闭浮层
const DISMISS_THRESHOLD = 40;

interface ChatSettingsProps {
  botId: string;
  onClose?: () => void;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({ botId, onClose }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const handleColor = useThemeColor({}, 'secondaryText');
  
  // 使用普通状态控制高度档位
  const [currentLevel, setCurrentLevel] = useState<keyof typeof HEIGHT_LEVELS>('NORMAL');
  const [isDragging, setIsDragging] = useState(false);
  
  // height不能用原生动画，需要使用JS动画
  const heightAnim = useRef(new Animated.Value(DEFAULT_HEIGHT)).current;
  
  // 这些可以用原生动画提高性能
  const translateYAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  
  // 记录拖动时的起始位置和状态
  const panStartY = useRef(0);
  const lastHeight = useRef(DEFAULT_HEIGHT);
  const dragDistance = useRef(0);
  
  // 使用 LayoutAnimation 来实现平滑过渡
  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  // 添加键盘高度状态
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // 监听键盘事件，避免输入框聚焦时浮层被顶起
  useEffect(() => {
    // 键盘显示时，切换到第一挡位（最紧凑视图）
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        // 获取键盘高度
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        
        // 当输入框获取焦点时，切换到第一挡位，确保不会超出屏幕
        if (currentLevel !== 'COMPACT') {
          toggleLevel('COMPACT');
        }
      }
    );
    
    // 键盘隐藏时重置键盘高度
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [currentLevel]);

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
    
    // 使用JS动画来处理高度
    Animated.spring(heightAnim, {
      toValue: HEIGHT_LEVELS[targetLevel],
      useNativeDriver: false, // 高度属性必须使用JS驱动
      bounciness: 0,
      speed: 12
    }).start();
    
    lastHeight.current = HEIGHT_LEVELS[targetLevel];
    
    return targetLevel;
  };
  
  // 添加一个状态标记是否处于将要收起的状态
  const isClosing = useRef(false);

  // 添加一个当前实际档位的引用，不依赖状态更新
  const currentLevelRef = useRef<keyof typeof HEIGHT_LEVELS>('NORMAL');

  // 添加调试日志观察档位变化
  useEffect(() => {
    // 同步更新引用值
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  // 实时计算当前档位，不依赖状态
  const calculateCurrentLevel = (height: number): keyof typeof HEIGHT_LEVELS => {
    // 考虑到边界情况，增加一些容差
    const threshold = 20; // 容差值
    
    if (height <= HEIGHT_LEVELS.COMPACT + threshold) {
      return 'COMPACT';
    } else if (height <= HEIGHT_LEVELS.NORMAL + threshold) {
      return 'NORMAL';
    } else {
      return 'EXPANDED';
    }
  };

  // 处理拖动手势
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 只有明显的垂直拖动才响应
        return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      
      onPanResponderGrant: (_, gestureState) => {
        // 开始拖动时重置收起状态
        isClosing.current = false;
        setIsDragging(true);
        Keyboard.dismiss(); // 确保键盘被关闭
        panStartY.current = gestureState.y0;
        // 获取当前高度值
        heightAnim.stopAnimation(value => {
          lastHeight.current = value;
        });
        dragDistance.current = 0;
      },
      
      onPanResponderMove: (_, gestureState) => {
        const deltaY = gestureState.moveY - panStartY.current;
        dragDistance.current = deltaY;

        // 先计算新高度
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, lastHeight.current - deltaY));
        
        // 计算当前实际档位，不依赖状态
        const realLevel = calculateCurrentLevel(newHeight);
        
        // 强制更新引用中的档位值，不等待状态更新
        currentLevelRef.current = realLevel;

        // 使用引用中的档位值判断，不依赖状态
        if (realLevel === 'COMPACT' && deltaY > 12) {
          // 根据下拉距离判断是否要进入收起状态
          if (deltaY > DISMISS_THRESHOLD || gestureState.vy > 1.0) {
            isClosing.current = true;
          } else {
            isClosing.current = false;
          }

          // 更新高度动画
          heightAnim.setValue(newHeight);
          
          // 根据下拉距离计算面板透明度和背景透明度
          const panelOpacity = Math.max(0.3, 1 - (deltaY / 200));
          const bgOpacity = Math.max(0.1, 1 - (deltaY / 300));
          const translateY = Math.min(deltaY / 1.5, 150); // 让位移更明显
          
          // 原生动画属性 - 确保值正确应用
          translateYAnim.setValue(translateY);
          opacityAnim.setValue(panelOpacity);
          overlayOpacity.setValue(bgOpacity);
          
          // 更新状态的档位
          if (currentLevel !== realLevel) {
            setCurrentLevel(realLevel);
          }
          
          return;  // 重要：在这种情况下提前返回，不执行后续代码
        }
        
        // 重置收起状态
        isClosing.current = false;
        
        // 正常拖动 - JS动画更新高度
        heightAnim.setValue(newHeight);
        
        // 更新状态的档位
        if (currentLevel !== realLevel) {
          setCurrentLevel(realLevel);
        }
      },
      
      onPanResponderRelease: (_, gestureState) => {
        // 结束拖动
        setIsDragging(false);
        
        const deltaY = gestureState.moveY - panStartY.current;
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, lastHeight.current - deltaY));
        
        // 使用引用中的值，因为它会被onPanResponderMove实时更新
        const realLevel = currentLevelRef.current;
        // 如果标记为将要收起，执行收起动画
        if (isClosing.current) {
          Animated.parallel([
            Animated.timing(translateYAnim, {
              toValue: SCREEN_HEIGHT / 3,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start(() => {
            // 动画结束后才真正关闭
            onClose?.();
          });
          return;
        }
        
        // 当前是COMPACT档位并且有向下拖动，但不满足收起条件
        if (realLevel === 'COMPACT' && deltaY > 0) {
          Animated.parallel([
            Animated.spring(translateYAnim, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 8
            }),
            Animated.spring(opacityAnim, {
              toValue: 1,
              useNativeDriver: true,
              bounciness: 8
            }),
            Animated.spring(overlayOpacity, {
              toValue: 1,
              useNativeDriver: true,
              bounciness: 8
            })
          ]).start();
          
          // 确保高度设置正确
          Animated.spring(heightAnim, {
            toValue: HEIGHT_LEVELS.COMPACT,
            useNativeDriver: false,
            bounciness: 0,
            speed: 12
          }).start();
          
          lastHeight.current = HEIGHT_LEVELS.COMPACT;
          return;
        }
        
        // 重置动画值 - 对于非COMPACT档位
        translateYAnim.setValue(0);
        opacityAnim.setValue(1);
        overlayOpacity.setValue(1);
        
        // 如果是向下拖动较大距离或快速下滑
        if (deltaY > 50 || gestureState.vy > 0.5) {
          if (currentLevel === 'EXPANDED') {
            // 从第三档位向下拖，切换到第二档位
            toggleLevel('NORMAL');
            return;
          } else if (currentLevel === 'NORMAL') {
            // 从第二档位向下拖，切换到第一档位
            toggleLevel('COMPACT');
            return;
          }
        }
        
        animateLayout();
        const finalLevel = snapToLevel(newHeight, gestureState.vy);
        
        // 使用JS动画控制高度
        Animated.spring(heightAnim, {
          toValue: HEIGHT_LEVELS[finalLevel],
          useNativeDriver: false, // 高度必须使用JS驱动
          bounciness: 0,
          speed: 12
        }).start();
        
        lastHeight.current = HEIGHT_LEVELS[finalLevel];
      },
      
      onPanResponderTerminate: () => {
        // 拖动被中断
        setIsDragging(false);
        isClosing.current = false;
        translateYAnim.setValue(0);
        opacityAnim.setValue(1);
        overlayOpacity.setValue(1);
      }
    })
  ).current;

  // 在档位按钮之间切换
  const toggleLevel = (level: keyof typeof HEIGHT_LEVELS) => {
    // 如果键盘弹出状态下切换到EXPANDED，需要考虑可见高度
    if (level === 'EXPANDED' && keyboardHeight > 0) {
      const visibleHeight = SCREEN_HEIGHT - keyboardHeight;
      const targetHeight = Math.min(HEIGHT_LEVELS.EXPANDED, visibleHeight * 0.85);
      
      setCurrentLevel(level);
      animateLayout();
      
      Animated.spring(heightAnim, {
        toValue: targetHeight,
        useNativeDriver: false,
        bounciness: 0,
        speed: 12
      }).start();
      
      lastHeight.current = targetHeight;
    } else {
      setCurrentLevel(level);
      animateLayout();
      
      Animated.spring(heightAnim, {
        toValue: HEIGHT_LEVELS[level],
        useNativeDriver: false,
        bounciness: 0,
        speed: 12
      }).start();
      
      lastHeight.current = HEIGHT_LEVELS[level];
    }
  };

  // 入场动画
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // 设置初始高度，使用JS动画
    heightAnim.setValue(DEFAULT_HEIGHT);
    
    // 分开处理原生动画和JS动画
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
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    return () => {
      translateYAnim.setValue(SCREEN_HEIGHT);
      opacityAnim.setValue(0);
      overlayOpacity.setValue(0);
    };
  }, []);

  // 背景点击关闭
  const handleBackdropPress = () => {
    // 点击背景时先确保关闭键盘
    Keyboard.dismiss();
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

  // 在ScrollView中添加更大的底部边距，确保键盘弹出时内容仍然可见
  const getScrollViewPadding = () => {
    if (keyboardHeight > 0) {
      // 为键盘留出足够空间，确保内容不被遮挡
      return { paddingBottom: Math.max(40, keyboardHeight * 0.7) };
    }
    return { paddingBottom: Platform.OS === 'ios' ? 40 : 20 };
  };

  return (
    <View style={styles.fullScreenContainer}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View 
          style={[
            styles.overlay,
            { 
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: overlayOpacity
            }
          ]}
        />
      </TouchableWithoutFeedback>
      
      <Animated.View
        style={[
          styles.containerOuter,
          {
            transform: [{ translateY: translateYAnim }],
            opacity: opacityAnim
          }
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              height: heightAnim,
              backgroundColor,
            }
          ]}
        >
          {/* 拖动手柄 - 只有这里可以触发拖动 */}
            <View 
              {...panResponder.panHandlers}
              style={styles.dragHandle}
            >
              <View style={[styles.handle, { backgroundColor: handleColor }]} />
              {renderLevelIndicator()}
            </View>
            
            {/* 内容区域 - 可以自由滚动 */}
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                getScrollViewPadding()
              ]}
              scrollEnabled={!isDragging}
              keyboardShouldPersistTaps="handled" // 点击时不收起键盘
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
  containerOuter: {
    width: SCREEN_WIDTH,
    zIndex: 1001,
  },
  container: {
    width: SCREEN_WIDTH,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
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
    gap: 20,
  },
  levelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    opacity: 0.6,
    minWidth: 40,
    minHeight: 30,
  },
  activeLevelButton: {
    opacity: 1,
  },
  levelButtonBar: {
    width: 24,
    height: 3,
    backgroundColor: '#888',
    marginVertical: 1.5,
    borderRadius: 1.5,
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
