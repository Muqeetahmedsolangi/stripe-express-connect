import { Tabs } from 'expo-router';
import React from 'react';
import { useSelector } from 'react-redux';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RootState } from '@/store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      {isAdmin ? (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.badge.shield.checkmark.fill" color={color} />,
          }}
        />
      ) : (
        <>
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Manage',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="bag.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="payouts"
            options={{
              title: 'Payouts',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="banknote" color={color} />,
            }}
          />
        </>
      )}
    </Tabs>
  );
}
