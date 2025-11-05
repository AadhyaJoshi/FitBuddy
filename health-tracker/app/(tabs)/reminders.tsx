import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Card } from "../../components/common/Card";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { COLORS, CATEGORIES } from "../../utils/constants";
import { dateHelpers } from "../../utils/dateHelpers";
import api from "../../services/api";
import { notificationService } from "../../services/notificationService";

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === "web") {
    // For web, use browser's confirm/alert
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      const action = buttons.find(
        (b) =>
          b.style === "destructive" || b.text === "Delete" || b.text === "OK"
      );
      const cancel = buttons.find(
        (b) => b.style === "cancel" || b.text === "Cancel"
      );

      if (confirmed && action?.onPress) {
        action.onPress();
      } else if (!confirmed && cancel?.onPress) {
        cancel.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    // For mobile, use React Native Alert
    const Alert = require("react-native").Alert;
    Alert.alert(title, message, buttons);
  }
};

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "medication",
    time: new Date(),
  });

  useEffect(() => {
    loadReminders();
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    await notificationService.requestPermissions();
  };

  const loadReminders = async () => {
    try {
      const response = await api.get("/reminders");
      let items: any[] = [];
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (Array.isArray(response.data?.data)) {
        items = response.data.data;
      } else if (Array.isArray(response.data?.reminders)) {
        items = response.data.reminders;
      } else if (response.data) {
        items = [response.data];
      }

      const normalize = (r: any) => {
        const id = r?._id ?? r?.id ?? null;
        let timeObj = null;
        if (!r?.time) timeObj = new Date();
        else {
          const parsed = new Date(r.time);
          timeObj = isNaN(parsed.getTime()) ? new Date() : parsed;
        }
        return {
          ...r,
          _id: id,
          id: id,
          time: timeObj,
          isActive: typeof r?.isActive === "boolean" ? r.isActive : true,
          isCompleted:
            typeof r?.isCompleted === "boolean" ? r.isCompleted : false,
        };
      };

      setReminders(items.map(normalize));
    } catch (error) {
      console.error("Failed to load reminders:", error);
      setReminders([]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showAlert("Error", "Please enter a title");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/reminders", {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        time: formData.time.toISOString(),
      });

      const created =
        response.data?.data ?? response.data?.reminder ?? response.data;
      const normalizedCreated = {
        ...created,
        _id: created?._id ?? created?.id ?? Date.now().toString(),
        id: created?._id ?? created?.id ?? Date.now().toString(),
        time: created?.time
          ? isNaN(new Date(created.time).getTime())
            ? new Date()
            : new Date(created.time)
          : new Date(),
        isActive:
          typeof created?.isActive === "boolean" ? created.isActive : true,
        isCompleted:
          typeof created?.isCompleted === "boolean"
            ? created.isCompleted
            : false,
      };

      await notificationService.scheduleReminder(normalizedCreated);

      setReminders((prev) => [normalizedCreated, ...prev]);
      setShowModal(false);
      resetForm();

      // Refresh in background
      setTimeout(() => loadReminders(), 500);
    } catch (error) {
      console.error("Create reminder error:", error);
      showAlert("Error", "Failed to create reminder");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "medication",
      time: new Date(),
    });
  };

  const toggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      if (!id) throw new Error("Invalid reminder id");
      await api.patch(`/reminders/${id}`, { isCompleted: !isCompleted });
      await loadReminders();
    } catch (error) {
      console.error("Toggle complete error:", error);
      showAlert("Error", "Failed to update reminder");
    }
  };

  const deleteReminder = async (id: string) => {
    // await api.delete(`/reminders/${id}`);
    // // Cancel notification
    // try {
    //   await notificationService.cancelReminder(id);
    // } catch (notifError) {
    //   console.warn('Failed to cancel notification:', notifError);
    // }

    // // Refresh from server
    // setTimeout(() => loadReminders(), 300);

    if (!id) {
      console.error("Cannot delete reminder: Invalid ID");
      showAlert("Error", "Invalid reminder ID");
      return;
    }

    showAlert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Deleting reminder with ID:", id);

              // Optimistically update UI
              setReminders((prev) =>
                prev.filter((r) => {
                  const reminderId = r._id || r.id;
                  return reminderId !== id;
                })
              );

              // Make API call
              await api.delete(`/reminders/${id}`);
              console.log("Successfully deleted reminder");

              // Cancel notification
              try {
                await notificationService.cancelReminder(id);
              } catch (notifError) {
                console.warn("Failed to cancel notification:", notifError);
              }

              // Refresh from server
              setTimeout(() => loadReminders(), 300);
            } catch (error: any) {
              console.error("Delete failed:", error);
              console.error(
                "Error details:",
                error.response?.data || error.message
              );

              showAlert(
                "Error",
                "Failed to delete reminder. Please try again."
              );

              // Restore state on failure
              await loadReminders();
            }
          },
        },
      ]
    );
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    // On Android, the picker closes automatically
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (event.type === "dismissed") {
      setShowTimePicker(false);
      return;
    }

    if (selectedTime) {
      setFormData({ ...formData, time: selectedTime });

      // On iOS, close picker after selection
      if (Platform.OS === "ios") {
        // Optional: add a small delay for better UX on iOS
        setTimeout(() => setShowTimePicker(false), 100);
      }
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
        {(reminders?.filter((r) => r?.isActive) || []).length > 0 ? (
          reminders
            .filter((r) => r?.isActive)
            .map((reminder, idx) => {
              const reminderId =
                reminder._id || reminder.id || `reminder-${idx}`;

              return (
                <Card key={reminderId} style={styles.reminderCard}>
                  <View style={styles.reminderContent}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        reminder.isCompleted && styles.checkboxCompleted,
                      ]}
                      onPress={() =>
                        toggleComplete(reminderId, reminder.isCompleted)
                      }
                    >
                      {reminder.isCompleted && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>

                    <View style={styles.reminderDetails}>
                      <Text
                        style={[
                          styles.reminderTitle,
                          reminder.isCompleted && styles.reminderTitleCompleted,
                        ]}
                      >
                        {reminder.title || "Untitled"}
                      </Text>
                      <View style={styles.reminderMeta}>
                        <Text style={styles.categoryEmoji}>
                          {CATEGORIES.reminders[reminder.category]?.icon ||
                            "📌"}
                        </Text>
                        <Text style={styles.reminderTime}>
                          {dateHelpers.formatTime(reminder.time)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        console.log(
                          "Delete button pressed for ID:",
                          reminderId
                        );
                        deleteReminder(reminderId);
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color="#d1d5db"
            />
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label="Title"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                placeholder="e.g., Take vitamin D"
              />

              <Input
                label="Description (Optional)"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Additional notes"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {Object.entries(CATEGORIES.reminders).map(([key, val]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryButton,
                      formData.category === key && styles.categoryButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: key })}
                  >
                    <Text style={styles.categoryEmoji}>{val.icon}</Text>
                    <Text style={styles.categoryButtonText}>{val.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Time</Text>

              {Platform.OS === "web" ? (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                  }}
                >
                  <input
                    type="time"
                    value={
                      formData.time
                        ? `${formData.time
                            .getHours()
                            .toString()
                            .padStart(2, "0")}:${formData.time
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}`
                        : ""
                    }
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map(Number);
                      const newTime = new Date();
                      newTime.setHours(hours);
                      newTime.setMinutes(minutes);
                      setFormData({ ...formData, time: newTime });
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                      color: "#1f2937",
                      backgroundColor: "#fff",
                      marginBottom: "16px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowTimePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text style={styles.timeButtonText}>
                      {formData.time
                        ? dateHelpers.formatTime(formData.time)
                        : "Select Time"}
                    </Text>
                  </TouchableOpacity>

                  {showTimePicker && (
                    <View style={styles.timePickerContainer}>
                      <DateTimePicker
                        value={formData.time || new Date()}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={onTimeChange}
                        style={styles.timePicker}
                      />
                      {Platform.OS === "ios" && (
                        <TouchableOpacity
                          style={styles.doneButton}
                          onPress={() => setShowTimePicker(false)}
                        >
                          <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}

              <Button
                onPress={handleSubmit}
                loading={loading}
                style={styles.createButton}
              >
                Create Reminder
              </Button>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 4,
  },
  reminderTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  reminderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  reminderTime: {
    fontSize: 14,
    color: "#6b7280",
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  categoryButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#EEF2FF",
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1f2937",
    marginTop: 8,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  timeButtonText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  timePickerContainer: {
    marginBottom: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
  },
  timePicker: {
    width: "100%",
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});
