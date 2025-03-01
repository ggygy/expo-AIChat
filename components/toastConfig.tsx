import React from 'react';
import { ToastConfigParams } from 'react-native-toast-message';
import { View, Text } from 'react-native';

export const toastConfig = {
  tomatoToast: (params: ToastConfigParams<any>) => (
    <View style={{ height: 60, width: '100%', backgroundColor: 'tomato', justifyContent: 'center' }}>
      <Text>{params.text1}</Text>
      <Text>{params.props?.uuid}</Text>
    </View>
  ),
};
