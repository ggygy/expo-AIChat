import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePromptStore } from '@/store/usePromptStore';
import { parseTemplateVariables } from '@/langchain/prompt';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CodeEditor } from '@/components/ui/CodeEditor';
import i18n from '@/i18n/i18n';

export default function PromptEditorScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const promptId = params?.id;

  const { templates, addTemplate, updateTemplate, deleteTemplate, getTemplateById } = usePromptStore();
  
  const promptTemplate = promptId ? getTemplateById(promptId) : undefined;
  const isSystemTemplate = promptTemplate?.isSystem;

  const [name, setName] = useState(promptTemplate?.name || '');
  const [description, setDescription] = useState(promptTemplate?.description || '');
  const [template, setTemplate] = useState(promptTemplate?.template || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 解析模板中的变量
  const variables = parseTemplateVariables(template);
  
  // 设置页面标题
  React.useEffect(() => {
    navigation.setOptions({
      title: promptId ? i18n.t('explore.editTemplate') : i18n.t('explore.createTemplate')
    });
  }, [navigation, promptId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('explore.nameRequired')
      );
      return;
    }

    if (!template.trim()) {
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('explore.templateRequired')
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (promptId) {
        // 更新现有模板
        updateTemplate(promptId, {
          name: name.trim(),
          description: description.trim(),
          template: template.trim(),
          inputVariables: variables,
          updatedAt: Date.now(),
        });
      } else {
        // 创建新模板
        addTemplate({
          name: name.trim(),
          description: description.trim(),
          template: template.trim(),
          inputVariables: variables,
        });
      }
      
      router.back();
    } catch (error) {
      console.error('保存模板失败:', error);
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
      i18n.t('explore.deleteTemplateConfirm'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        { 
          text: i18n.t('common.delete'), 
          style: 'destructive',
          onPress: () => {
            if (promptId) {
              deleteTemplate(promptId);
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
          placeholder={i18n.t('explore.namePlaceholder')}
          editable={!isSystemTemplate}
        />
        
        <Input 
          label={i18n.t('explore.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={i18n.t('explore.descriptionPlaceholder')}
          editable={!isSystemTemplate}
        />

        <ThemedView style={styles.codeSection}>
          <CodeEditor 
            label={i18n.t('explore.template')}
            value={template}
            onChangeText={setTemplate}
            placeholder={i18n.t('explore.templatePlaceholder')}
            editable={!isSystemTemplate}
            minHeight={250}
          />
        </ThemedView>

        {variables.length > 0 && (
          <ThemedView style={styles.variablesContainer}>
            <ThemedText style={styles.variablesTitle}>
              {i18n.t('explore.detectedVariables')}
            </ThemedText>
            <View style={styles.variableChips}>
              {variables.map(variable => (
                <View key={variable} style={styles.variableChip}>
                  <IconSymbol name="code" size={16} color="#666" style={styles.variableIcon} />
                  <ThemedText style={styles.variableText}>{variable}</ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>
        )}

        {!isSystemTemplate && (
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

            {promptId && (
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

        {isSystemTemplate && (
          <ThemedView style={styles.systemWarning}>
            <IconSymbol name="warning" size={20} color="#FFC107" />
            <ThemedText style={styles.systemWarningText}>
              {i18n.t('explore.systemTemplateWarning')}
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
  variablesContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  variablesTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  variableChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  variableIcon: {
    marginRight: 4,
  },
  variableText: {
    fontSize: 14,
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
