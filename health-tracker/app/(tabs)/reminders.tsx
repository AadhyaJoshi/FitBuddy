import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS, CATEGORIES } from '../../utils/constants';
import { dateHelpers } from '../../utils/dateHelpers';
import api from '../../services/api';
import { notificationService } from '../../services/notificationService';

export default function RemindersScreen() {
  // const [reminders, setReminders] = useState([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'medication',
    time: new Date()
  });

  useEffect(() => {
    loadReminders();
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    await notificationService.requestPermissions();
  };

  // const loadReminders = async () => {
  //   try {
  //     const response = await api.get('/reminders');
  //     setReminders(response.data);
  //   } catch (error) {
  //     console.error('Failed to load reminders:', error);
  //   }
  // };
  const loadReminders = async () => {
  try {
    const response = await api.get('/reminders');
    // Ensure we're setting an array, fallback to empty array if response.data is undefined
    setReminders(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error('Failed to load reminders:', error);
    setReminders([]); // Set empty array on error
  }
};

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/reminders', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        time: formData.time.toISOString()
      });

      // Schedule local notification
      await notificationService.scheduleReminder(response.data);

      await loadReminders();
      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'medication',
      time: new Date()
    });
  };

  const toggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      await api.patch(`/reminders/${id}`, { isCompleted: !isCompleted });
      await loadReminders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const deleteReminder = async (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/reminders/${id}`);
              await loadReminders();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reminder');
            }
          }
        }
      ]
    );
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData({ ...formData, time: selectedTime });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {(reminders?.filter(r => r?.isActive) || []).length > 0 ? (
          reminders
            .filter(r => r?.isActive)
            .map((reminder) => (
              <Card key={reminder._id} style={styles.reminderCard}>
                <View style={styles.reminderContent}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      reminder.isCompleted && styles.checkboxCompleted
                    ]}
                    onPress={() => toggleComplete(reminder._id, reminder.isCompleted)}
                  >
                    {reminder.isCompleted && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.reminderDetails}>
                    <Text
                      style={[
                        styles.reminderTitle,
                        reminder.isCompleted && styles.reminderTitleCompleted
                      ]}
                    >
                      {reminder.title}
                    </Text>
                    <View style={styles.reminderMeta}>
                      <Text style={styles.categoryEmoji}>
                        {CATEGORIES.reminders[reminder.category]?.icon || '📌'}
                      </Text>
                      <Text style={styles.reminderTime}>
                        {dateHelpers.formatTime(reminder.time)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteReminder(reminder._id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No reminders set</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Input
              label="Title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g., Take vitamin D"
            />

            <Input
              label="Description (Optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Additional notes"
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {Object.entries(CATEGORIES.reminders).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryButton,
                    formData.category === key && styles.categoryButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, category: key })}
                >
                  <Text style={styles.categoryEmoji}>{val.icon}</Text>
                  <Text style={styles.categoryButtonText}>{val.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <Text style={styles.timeButtonText}>
                {dateHelpers.formatTime(formData.time)}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={formData.time}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}

            <Button onPress={handleSubmit} loading={loading}>
              Create Reminder
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  reminderCard: {
    marginBottom: 12,
    padding: 16,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  reminderDetails: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  reminderTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  reminderTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
    marginTop: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 24,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  }
});