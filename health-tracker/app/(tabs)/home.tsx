import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/constants';
import api from '../../services/api';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [stats, setStats] = useState({
    todayScreenTime: 0,
    daysTracked: 0,
    activeReminders: 0,
    upcomingReminders: []
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [screenTimeRes, remindersRes] = await Promise.all([
        api.get('/screentime/today'),
        api.get('/reminders/active')
      ]);

      // normalize upcoming reminders (ensure time is Date or null, ensure title and id exist)
      const rawUpcoming = remindersRes.data?.upcoming ?? [];
      const normalizeReminder = (r: any) => {
        const timeSource = r?.time ?? r?.date ?? null;
        const parsed = timeSource ? new Date(timeSource) : null;
        const time = parsed && !isNaN(parsed.getTime()) ? parsed : null;
        return {
          ...r,
          _id: r?._id ?? r?.id ?? null,
          id: r?._id ?? r?.id ?? null,
          title: r?.title ?? r?.name ?? '',
          time
        };
      };

      // const upcoming = Array.isArray(rawUpcoming)
      //   ? rawUpcoming.map(normalizeReminder).slice(0, 3)
      //   : [];

      setStats({
        todayScreenTime: screenTimeRes.data.totalMinutes || 0,
        daysTracked: screenTimeRes.data.daysTracked || 0,
        activeReminders: remindersRes.data.count || 0,
        upcomingReminders: remindersRes.data.upcoming?.slice(0, 3) || []
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const goal = 180; // 3 hours
  const progress = Math.min((stats.todayScreenTime / goal) * 100, 100);

  // safe formatter for reminder times (handles Date, ISO string, missing/invalid values)
  const formatReminderTime = (reminder: any) => {
    const t = reminder?.time ?? reminder?.date ?? null;
    if (!t) return '';
    const d = t instanceof Date ? t : new Date(t);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name || 'User'}!</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <Card style={styles.screenTimeCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Todays Screen Time</Text>
            <Ionicons name="time" size={24} color="#fff" />
          </View>
          <Text style={styles.screenTimeText}>
            {Math.floor(stats.todayScreenTime / 60)}h {stats.todayScreenTime % 60}m
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.goalText}>
            Goal: {Math.floor(goal / 60)}h {goal % 60}m
          </Text>
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.daysTracked}</Text>
            <Text style={styles.statLabel}>Days Tracked</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>
              {stats.activeReminders}
            </Text>
            <Text style={styles.statLabel}>Active Reminders</Text>
          </Card>
        </View>

        <Card style={styles.remindersCard}>
          <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
          {stats.upcomingReminders.length > 0 ? (
            stats.upcomingReminders.map((reminder: any, index: number) => (
              <View key={reminder._id ?? reminder.id ?? index} style={styles.reminderItem}>
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderTitle}>{reminder?.title ?? ''}</Text>
                  <Text style={styles.reminderTime}>
                    {formatReminderTime(reminder)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No upcoming reminders</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoutButton: {
    padding: 8,
  },
  screenTimeCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: COLORS.primary,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  screenTimeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  goalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  remindersCard: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  reminderContent: {
    flex: 1,
    marginLeft: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  reminderTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 24,
  }
});