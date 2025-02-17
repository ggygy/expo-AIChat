import React, { useEffect } from 'react';
import { StyleSheet, Image, View, Linking, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import i18n from '@/i18n/i18n';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useThemeColor } from '@/hooks/useThemeColor';

const VERSION = Constants.expoConfig?.version || '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || '1';

export default function VersionScreen() {
    const textColor = useThemeColor({}, 'text');

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../assets/images/icon.png')}
                    style={styles.logo}
                />
                <ThemedText style={styles.title}>AI Chat</ThemedText>
                <ThemedText style={styles.version}>
                    Version {VERSION} ({BUILD_NUMBER})
                </ThemedText>
            </View>

            <View style={styles.content}>
                <ThemedText style={styles.description}>
                    {i18n.t('version.description')}
                </ThemedText>

                <TouchableOpacity
                    style={styles.links}
                    activeOpacity={0.7}
                    onPress={() => Linking.openURL('https://github.com/ggygy/expo-AIChat')}
                >
                    <ThemedText>ggygy</ThemedText>
                    <Ionicons name="logo-github" size={28} color={textColor} />
                </TouchableOpacity>
            </View>

            <ThemedText style={styles.copyright}>
                © 2025 AI Chat. {i18n.t('version.copyright')}
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
    },
    version: {
        fontSize: 16,
        marginTop: 8,
        opacity: 0.7,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        maxHeight: 200,
    },
    description: {
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    links: {
        flexDirection: 'row',
        gap: 10,
    },
    copyright: {
        fontSize: 12,
        opacity: 0.5,
        position: 'absolute',
        bottom: 120,
    },
});
