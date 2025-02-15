import React from 'react';
import { StyleSheet, Image, View, Linking } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import i18n from '@/i18n/i18n';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const VERSION = Constants.expoConfig?.version || '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || '1';

export default function VersionScreen() {
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

                <View style={styles.links}>
                    <Ionicons
                        name="logo-github"
                        size={28}
                        onPress={() => Linking.openURL('https://github.com/ggygy/expo-AIChat')}
                    />
                </View>
            </View>

            <ThemedText style={styles.copyright}>
                © 2024 AI Chat. {i18n.t('version.copyright')}
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
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
    },
    description: {
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    links: {
        flexDirection: 'row',
        gap: 20,
    },
    copyright: {
        fontSize: 12,
        opacity: 0.5,
        marginBottom: 20,
    },
});
