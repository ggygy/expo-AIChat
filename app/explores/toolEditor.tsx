import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToolStore } from '@/store/useToolStore';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CodeEditor } from '@/components/ui/CodeEditor';
import i18n from '@/i18n/i18n';

export default function ToolEditorScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const toolId = params?.id;

  const { tools, addTool, updateTool, deleteTool, getToolById } = useToolStore();
  
  const toolDefinition = toolId ? getToolById(toolId) : undefined;
  const isSystemTool = toolDefinition?.isSystem;

  const [name, setName] = useState(toolDefinition?.name || '');
  const [description, setDescription] = useState(toolDefinition?.description || '');
  const [func, setFunc] = useState(toolDefinition?.func || '// 在此输入函数体\nconst result = args;\nreturn result;');
  
  // 提供一个默认的参数模板
  const defaultParameters = {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "输入参数"
      }
    },
    required: ["input"]
  };
  
  // 将参数转换为可编辑的JSON字符串
  const [parametersJson, setParametersJson] = useState(
    JSON.stringify(toolDefinition?.parameters || defaultParameters, null, 2)
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parametersError, setParametersError] = useState<string | undefined>();
  
  // 设置页面标题
  React.useEffect(() => {
    navigation.setOptions({
      title: toolId ? i18n.t('explore.editTool') : i18n.t('explore.createTool')
    });
  }, [navigation, toolId]);

  const validateParameters = (): boolean => {
    try {
      const parsed = JSON.parse(parametersJson);
      if (typeof parsed !== 'object') {
        setParametersError(i18n.t('explore.parametersNotObject'));
        return false;
      }
      if (parsed.type !== 'object') {
        setParametersError(i18n.t('explore.parametersTypeNotObject'));
        return false;
      }
      if (!parsed.properties || typeof parsed.properties !== 'object') {
        setParametersError(i18n.t('explore.parametersNoProperties'));
        return false;
      }
      setParametersError(undefined);
      return true;
    } catch (e) {
      setParametersError(i18n.t('explore.parametersInvalidJson'));
      return false;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('explore.nameRequired')
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('explore.descriptionRequired')
      );
      return;
    }

    if (!func.trim()) {
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('explore.functionRequired')
      );
      return;
    }

    if (!validateParameters()) {
      Alert.alert(
        i18n.t('common.error'),
        parametersError || i18n.t('explore.parametersInvalid')
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const parameters = JSON.parse(parametersJson);
      
      if (toolId) {
        // 更新现有工具
        updateTool(toolId, {
          name: name.trim(),
          description: description.trim(),
          func: func.trim(),
          parameters,
          updatedAt: Date.now(),
        });
      } else {
        // 创建新工具
        addTool({
          name: name.trim(),
          description: description.trim(),
          func: func.trim(),
          parameters,
          schema: undefined as any,
        });
      }
      
      router.back();
    } catch (error) {
      console.error('保存工具失败:', error);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('explore.saveError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      i18n.t('common.confirm'),
      i18n.t('explore.deleteToolConfirm'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        { 
          text: i18n.t('common.delete'), 
          style: 'destructive',
          onPress: () => {
            if (toolId) {
              deleteTool(toolId);
              router.back();
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ThemedView style={styles.form}>
        <Input 
          label={i18n.t('explore.name')}
          value={name}
          onChangeText={setName}
          placeholder={i18n.t('explore.toolNamePlaceholder')}
          editable={!isSystemTool}
        />
        
        <Input 
          label={i18n.t('explore.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={i18n.t('explore.toolDescriptionPlaceholder')}
          editable={!isSystemTool}
        />

        <ThemedView style={styles.codeSection}>
          <CodeEditor
            label={i18n.t('explore.functionImplementation')}
            value={func}
            onChangeText={setFunc}
            placeholder="// 在此输入函数体"
            editable={!isSystemTool}
            minHeight={250}
            language="javascript"
          />
          <ThemedText style={styles.codeTip}>
            {i18n.t('explore.functionImplementationTip')}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.codeSection}>
          <CodeEditor
            label={i18n.t('explore.parameters')}
            value={parametersJson}
            onChangeText={setParametersJson}
            placeholder="{}"
            editable={!isSystemTool}
            error={parametersError}
            minHeight={200}
            language="json"
          />
          <ThemedText style={styles.codeTip}>
            {i18n.t('explore.parametersTip')}
          </ThemedText>
        </ThemedView>

        {!isSystemTool && (
          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              onPress={handleSave}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              style={styles.saveButton}
            >
              {i18n.t('common.save')}
            </Button>

            {toolId && (
              <Button
                variant="danger"
                onPress={handleDelete}
                disabled={isSubmitting}
                style={styles.deleteButton}
              >
                {i18n.t('common.delete')}
              </Button>
            )}
          </View>
        )}

        {isSystemTool && (
          <ThemedView style={styles.systemWarning}>
            <IconSymbol name="warning" size={20} color="#FFC107" />
            <ThemedText style={styles.systemWarningText}>
              {i18n.t('explore.systemToolWarning')}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 90,
  },
  contentContainer: {
    padding: 16,
  },
  form: {
    gap: 16,
  },
  codeSection: {
    gap: 4,
  },
  codeHeader: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  codeTip: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 0.4,
  },
  systemWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  systemWarningText: {
    marginLeft: 8,
    color: '#6C4A00',
  },
});
