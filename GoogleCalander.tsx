import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import * as Calendar from 'expo-calendar';

const ExpoCalendar: React.FC = () => {
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [writableCalendars, setWritableCalendars] = useState<Calendar.Calendar[]>([]);
  const [defaultCalendarId, setDefaultCalendarId] = useState<string | null>(null);
  const [events, setEvents] = useState<Calendar.Event[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const granted = await requestCalendarPermissions();
      if (granted) {
        const calendarList = await Calendar.getCalendarsAsync();
        setCalendars(calendarList);
        const writable = calendarList.filter((cal) => cal.allowsModifications);
        setWritableCalendars(writable);

        if (writable.length > 0) {
          setModalVisible(true); 
        } else {
          Alert.alert('No writable calendar', 'No calendar available for writing events.');
        }
      }
    })();
  }, []);

  const requestCalendarPermissions = async (): Promise<boolean> => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Calendar permission is required to use this feature.');
      return false;
    }
    return true;
  };

  const createEvent = async (): Promise<void> => {
    if (!defaultCalendarId) {
      Alert.alert('Error', 'Please select a calendar first.');
      return;
    }

    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000); 

    const eventDetails = {
      title: 'Test Event',
      startDate: now,
      endDate: end,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: 'Online',
      notes: 'Created by Expo Calendar App',
    };

    try {
      const eventId = await Calendar.createEventAsync(defaultCalendarId, eventDetails);
      Alert.alert('Success', `Event created with ID: ${eventId}`);
      setTimeout(getEvents, 1000);
    } catch (error: any) {
      Alert.alert('Error creating event', error.message);
    }
  };

  const getEvents = async (): Promise<void> => {
    if (!defaultCalendarId) return;

    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);

    const start = new Date(now.getTime() - 5 * 60 * 1000);
    const end = new Date(oneMonthLater.getTime() + 5 * 60 * 1000);

    try {
      const fetchedEvents = await Calendar.getEventsAsync([defaultCalendarId], start, end);
      setEvents(fetchedEvents);
    } catch (error: any) {
      Alert.alert('Error fetching events', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📆 Expo Calendar Example</Text>

      <Button title="Create Event" onPress={createEvent} />
      <Button title="Get Events" onPress={getEvents} />

      <Text style={styles.subtitle}>Selected Calendar:</Text>
      <Text>
        {defaultCalendarId
          ? calendars.find((c) => c.id === defaultCalendarId)?.title
          : 'None selected'}
      </Text>

      <Text style={styles.subtitle}>All Calendars:</Text>
      {calendars.map((cal) => (
        <Text key={cal.id}>• {cal.title}</Text>
      ))}

      <Text style={styles.subtitle}>Events:</Text>
      {events.length === 0 ? (
        <Text>No events found</Text>
      ) : (
        events.map((event) => (
          <View key={event.id} style={styles.event}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text>{new Date(event.startDate).toLocaleString()}</Text>
            <Text>{new Date(event.endDate).toLocaleString()}</Text>
          </View>
        ))
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.subtitle}>Select a Calendar</Text>
            {writableCalendars.map((cal) => (
              <TouchableOpacity
                key={cal.id}
                style={styles.calendarOption}
                onPress={() => {
                  setDefaultCalendarId(cal.id);
                  setModalVisible(false);
                }}
              >
                <Text>{cal.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ExpoCalendar;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
  },
  event: {
    marginVertical: 10,
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 8,
  },
  eventTitle: {
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  calendarOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});




