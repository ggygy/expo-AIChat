import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePromptStore } from '@/store/usePromptStore';
import { parseTemplateVariables } from '@/langchain/prompt';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import i18n from '@/i18n/i18n';

export default function PromptEditorDetailScreen() {
  const { id } = useLocalSearchParams();
  const promptId = id as string;
  
  const { getTemplateById, updateTemplate, deleteTemplate } = usePromptStore();
  const promptTemplate = getTemplateById(promptId);
  const isSystemTemplate = promptTemplate?.isSystem;
  
  const [name, setName] = useState(promptTemplate?.name || '');
  const [description, setDescription] = useState(promptTemplate?.description || '');
  const [template, setTemplate] = useState(promptTemplate?.template || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const variables = parseTemplateVariables(template);
  const variableBgColor = useThemeColor({}, 'settingItemBackground');
  const variableTextColor = useThemeColor({}, 'secondaryText');
  const warningBgColor = useThemeColor({}, 'warning');
  const warningTextColor = useThemeColor({}, 'warning');
  
  // 检查模板是否存在
  useEffect(() => {
    if (!promptTemplate && promptId) {
      Alert.alert(
        i18n.t('common.error'),
        '模板不存在',
        [{ text: i18n.t('common.close'), onPress: () => router.back() }]
      );
    }
  }, [promptTemplate, promptId]);
  
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('explore.nameRequired'));
      return;
    }
    
    if (!template.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('explore.templateRequired'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      updateTemplate(promptId, {
        name: name.trim(),
        description: description.trim(),
        template: template.trim(),
        inputVariables: variables,
        updatedAt: Date.now(),
      });
      
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
            deleteTemplate(promptId);
            router.back();
          }
        }
      ]
    );
  };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: i18n.t('explore.editTemplate'),
        }} 
      />
      
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

          <Input 
            label={i18n.t('explore.template')}
            value={template}
            onChangeText={setTemplate}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            style={styles.templateInput}
            placeholder={i18n.t('explore.templatePlaceholder')}
            editable={!isSystemTemplate}
          />

          {variables.length > 0 && (
            <ThemedView style={styles.variablesContainer}>
              <ThemedText style={styles.variablesTitle}>
                {i18n.t('explore.detectedVariables')}
              </ThemedText>
              <View style={styles.variableChips}>
                {variables.map(variable => (
                  <View 
                    key={variable} 
                    style={[
                      styles.variableChip,
                      { backgroundColor: variableBgColor }
                    ]}
                  >
                    <IconSymbol name="code" size={16} color={variableTextColor} style={styles.variableIcon} />
                    <ThemedText style={[styles.variableText, { color: variableTextColor }]}>
                      {variable}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </ThemedView>
          )}

          {!isSystemTemplate ? (
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

              <Button
                variant="danger"
                onPress={handleDelete}
                disabled={isSubmitting}
                style={styles.deleteButton}
              >
                {i18n.t('common.delete')}
              </Button>
            </View>
          ) : (
            <ThemedView 
              style={[
                styles.systemWarning,
                { backgroundColor: warningBgColor }
              ]}
            >
              <IconSymbol name="warning" size={20} color={warningTextColor} />
              <ThemedText style={[styles.systemWarningText, { color: warningTextColor }]}>
                {i18n.t('explore.systemTemplateWarning')}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  form: {
    gap: 16,
  },
  templateInput: {
    height: 200,
    paddingTop: 12,
  },
  variablesContainer: {
    padding: 16,
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
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  systemWarningText: {
    marginLeft: 8,
  },
});
