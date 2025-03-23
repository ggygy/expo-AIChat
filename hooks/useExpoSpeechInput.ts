import { useState, useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import i18n from '@/i18n/i18n';

/**
 * 使用Expo API实现语音功能的Hook
 * 包括语音识别模拟和文本朗读
 */
export function useExpoSpeechInput() {
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  
  // 录音相关引用
  const recording = useRef<Audio.Recording | null>(null);
  const audioPermissionChecked = useRef(false);
  
  // 检查和请求录音权限
  const checkAndRequestPermissions = useCallback(async () => {
    try {
      // 只在首次检查权限
      if (!audioPermissionChecked.current) {
        console.log('正在检查音频录制权限...');
        
        // 请求录音权限
        const { status: recordingStatus } = await Audio.requestPermissionsAsync();
        const hasRecordingPermission = recordingStatus === 'granted';
        
        console.log('录音权限状态:', recordingStatus);
        setIsPermissionGranted(hasRecordingPermission);
        audioPermissionChecked.current = true;
        
        // 如果没有权限，设置错误信息
        if (!hasRecordingPermission) {
          setError(i18n.t('common.micPermissionDenied'));
          return false;
        }
        
        // 初始化音频会话
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
      
      return isPermissionGranted;
    } catch (err) {
      console.error('权限检查失败', err);
      setError(i18n.t('common.micPermissionDenied'));
      return false;
    }
  }, [isPermissionGranted]);
  
  // 生成示例语音识别结果
  const getSampleText = () => {
    const zhPhrases = [
      '你好，这是一条测试消息',
      '我想了解更多关于这个主题的信息',
      '请告诉我今天的天气如何',
      '能否帮我总结一下这篇文章',
      '我需要你的帮助解决一个问题'
    ];
    
    const enPhrases = [
      'Hello, this is a test message',
      'I would like to learn more about this topic',
      'Please tell me about today\'s weather',
      'Can you help summarize this article for me',
      'I need your assistance with solving a problem'
    ];
    
    const phrases = i18n.locale.includes('zh') ? zhPhrases : enPhrases;
    return phrases[Math.floor(Math.random() * phrases.length)];
  };
  
  // 播放简单的哔声 (无需外部音频文件)
  const playBeep = async (isStart: boolean) => {
    try {
      // 使用Speech API发出简短的提示音
      const beepText = isStart ? '.' : ',';
      const options = {
        language: 'en',
        pitch: isStart ? 1.5 : 1.0,
        rate: 0.8,
        volume: isStart ? 0.3 : 0.2
      };
      
      // 直接使用Speech API播放提示音
      await Speech.speak(beepText, options);
      
      // 或者也可以使用自定义函数播放声音
    } catch (e) {
      console.log('提示音播放失败:', e);
    }
  };
  
  // 开始录音
  const startRecording = async () => {
    try {
      // 重置之前的状态
      if (recording.current) {
        await stopRecording();
      }
      
      // 准备新录音
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = newRecording;
      console.log('开始录音');
      
      // 播放简单提示音，而非依赖外部文件
      await playBeep(true);
      
      return true;
    } catch (err) {
      console.error('开始录音失败:', err);
      setError(i18n.t('chat.recordingFailed'));
      return false;
    }
  };
  
  // 停止录音
  const stopRecording = async () => {
    if (!recording.current) return '';
    
    try {
      console.log('停止录音');
      await recording.current.stopAndUnloadAsync();
      
      // 播放简单提示音，而非依赖外部文件
      await playBeep(false);
      
      // 在实际应用中，这里应该把录音发送到语音识别服务
      // 但目前我们使用示例文本代替
      const recognizedText = getSampleText();
      setSpeechResult(recognizedText);
      
      // 清理
      const uri = recording.current.getURI();
      recording.current = null;
      
      // 可选：删除录音文件
      if (uri && FileSystem.deleteAsync) {
        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (e) {
          console.log('删除录音文件失败:', e);
        }
      }
      
      return recognizedText;
    } catch (err) {
      console.error('停止录音失败:', err);
      setError(i18n.t('chat.recordingFailed'));
      recording.current = null;
      return '';
    }
  };
  
  // 开始语音输入
  const startListening = useCallback(async () => {
    try {
      setError(null);
      setSpeechResult('');
      
      // 检查权限
      const hasPermission = await checkAndRequestPermissions();
      if (!hasPermission) {
        console.log('没有麦克风权限');
        return false;
      }
      
      // 开始录音
      const started = await startRecording();
      if (started) {
        setIsListening(true);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('启动语音输入失败', err);
      setError(i18n.t('chat.speechRecognitionFailed'));
      return false;
    }
  }, [checkAndRequestPermissions]);
  
  // 停止语音输入
  const stopListening = useCallback(async () => {
    try {
      setIsListening(false);
      
      // 停止录音并获取识别结果
      const result = await stopRecording();
      return result;
    } catch (err) {
      console.error('停止语音输入失败', err);
      setError(i18n.t('chat.speechRecognitionFailed'));
      setIsListening(false);
      return '';
    }
  }, []);
  
  // 朗读文本
  const speakText = useCallback(async (text: string) => {
    try {
      await Speech.speak(text, {
        language: i18n.locale.includes('zh') ? 'zh-CN' : 'en-US',
        rate: 0.9,
        pitch: 1.0,
      });
      return true;
    } catch (err) {
      console.error('文本朗读失败', err);
      setError(i18n.t('chat.readError'));
      return false;
    }
  }, []);
  
  // 停止朗读
  const stopSpeaking = useCallback(async () => {
    try {
      await Speech.stop();
      return true;
    } catch (err) {
      console.error('停止朗读失败', err);
      return false;
    }
  }, []);
  
  // 重置语音结果
  const resetSpeechResult = useCallback(() => {
    setSpeechResult('');
  }, []);
  
  // 清理函数
  useEffect(() => {
    return () => {
      // 停止任何正在进行的录音
      if (recording.current) {
        recording.current.stopAndUnloadAsync().catch(console.error);
      }
      
      // 停止任何正在进行的朗读
      Speech.stop().catch(console.error);
    };
  }, []);
  
  return {
    isListening,
    startListening,
    stopListening,
    speechResult,
    resetSpeechResult,
    error,
    speakText,
    stopSpeaking,
    isPermissionGranted,
  };
}
