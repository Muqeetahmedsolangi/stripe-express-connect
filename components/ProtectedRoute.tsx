import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';
import { RootState } from '../store';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Add a small delay to allow for Redux state updates after registration
    const timeoutId = setTimeout(() => {
      if (!isLoading && !isAuthenticated && !user) {
        router.replace('/login');
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated && !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});