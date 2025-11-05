import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS, CATEGORIES } from '../../utils/constants';
import { dateHelpers } from '../../utils/dateHelpers';
import api from '../../services/api';

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      const action = buttons.find(b => b.style === 'destructive' || b.text === 'Delete' || b.text === 'OK');
      const cancel = buttons.find(b => b.style === 'cancel' || b.text === 'Cancel');
      
      if (confirmed && action?.onPress) {
        action.onPress();
      } else if (!confirmed && cancel?.onPress) {
        cancel.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    const Alert = require('react-native').Alert;
    Alert.alert(title, message, buttons);
  }
};

export default function ScreenTimeScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: dateHelpers.getTodayDate(),
    hours: '0',
    minutes: '0',
    category: 'social'
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await api.get('/screentime');
      setEntries(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load screen time:', error);
    }
  };

  const handleSubmit = async () => {
    const totalMinutes = parseInt(formData.hours) * 60 + parseInt(formData.minutes);
    
    if (totalMinutes <= 0) {
      showAlert('Error', 'Please enter valid time');
      return;
    }

    setLoading(true);
    try {
      await api.post('/screentime', {
        date: formData.date,
        totalMinutes,
        category: formData.category
      });
      
      await loadEntries();
      setShowModal(false);
      setFormData({
        date: dateHelpers.getTodayDate(),
        hours: '0',
        minutes: '0',
        category: 'social'
      });
    } catch (error) {
      showAlert('Error', 'Failed to save screen time');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete entry logic added
  const handleDeleteEntry = (id: string) => {
    showAlert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/screentime/${id}`);
              await loadEntries();
              showAlert('Deleted', 'Entry removed successfully');
            } catch (error) {
              console.error('Failed to delete entry:', error);
              showAlert('Error', 'Could not delete entry');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Screen Time</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {entries.length > 0 ? (
          entries.map((entry) => (
            <Card key={entry._id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View>
                  <Text style={styles.entryDate}>
                    {dateHelpers.formatDate(entry.date)}
                  </Text>
                  <Text style={styles.entryTime}>
                    {Math.floor(entry.totalMinutes / 60)}h {entry.totalMinutes % 60}m
                  </Text>
                </View>

                {/* 🗑️ Delete button added here */}
                <TouchableOpacity onPress={() => handleDeleteEntry(entry._id)}>
                  <Ionicons name="trash" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {entry.breakdown?.map((item: { category: string | number; minutes: number; }, idx: React.Key | null | undefined) => (
                <View key={idx} style={styles.breakdownItem}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: CATEGORIES.screenTime[item.category]?.color || '#6b7280' }
                    ]}
                  />
                  <Text style={styles.categoryName}>
                    {CATEGORIES.screenTime[item.category]?.name || 'Other'}
                  </Text>
                  <Text style={styles.categoryTime}>
                    {Math.floor(item.minutes / 60)}h {item.minutes % 60}m
                  </Text>
                </View>
              ))}
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No screen time logged yet</Text>
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
              <Text style={styles.modalTitle}>Add Screen Time</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Input
              label="Date"
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {Object.entries(CATEGORIES.screenTime).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryButton,
                    formData.category === key && styles.categoryButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, category: key })}
                >
                  <Text style={styles.categoryButtonText}>{val.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeRow}>
              <Input
                label="Hours"
                value={formData.hours}
                onChangeText={(text) => setFormData({ ...formData, hours: text })}
                keyboardType="numeric"
                style={styles.timeInput}
              />
              <Input
                label="Minutes"
                value={formData.minutes}
                onChangeText={(text) => setFormData({ ...formData, minutes: text })}
                keyboardType="numeric"
                style={styles.timeInput}
              />
            </View>

            <Button onPress={handleSubmit} loading={loading}>
              Save Entry
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
  entryCard: {
    marginBottom: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  entryTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  categoryTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
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
    maxHeight: '80%',
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
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
});