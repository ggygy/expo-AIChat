import React from 'react';
import { BaseToast, BaseToastProps, ErrorToast, ToastConfigParams } from 'react-native-toast-message';
import { View, Text } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export const toastConfig = {
  tomatoToast: (params: ToastConfigParams<any>) => (
    <View style={{ height: 60, width: '100%', backgroundColor: 'tomato', justifyContent: 'center' }}>
      <Text>{params.text1}</Text>
      <Text>{params.props?.uuid}</Text>
    </View>
  ),
};
