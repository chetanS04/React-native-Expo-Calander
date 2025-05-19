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
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Calendar from 'expo-calendar';
import DateTimePicker, {
  DateTimePickerEvent,
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

const ExpoCalendar: React.FC = () => {
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]); // use from expo calendar
  const [writableCalendars, setWritableCalendars] = useState<Calendar.Calendar[]>([]); 
  const [defaultCalendarId, setDefaultCalendarId] = useState<string | null>(null);
  const [events, setEvents] = useState<Calendar.Event[]>([]); // declare the type of event 
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  
  useEffect(() => {
    (async () => {
      try {
        const granted = await requestCalendarPermissions();
        if (granted) {
          const calendarList = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
          console.log('All Calendars:', calendarList);

          setCalendars(calendarList);

          const writable = calendarList.filter((cal) => cal.allowsModifications);
          console.log('Writable Calendars:', writable);

          setWritableCalendars(writable);

          if (writable.length > 0) {
            setDefaultCalendarId(writable[0].id);

            await getEvents();

            if (writable.length > 1) {
              setCalendarModalVisible(true);
            }
          } else {
            Alert.alert('No writable calendar', 'No calendar available for writing events.');
          }

        } else {
          Alert.alert('Permission Denied', 'We need calendar access to proceed.');
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        Alert.alert('Error', 'An error occurred while fetching calendar data.');
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

    const eventDetails = {
      title: title || 'Untitled Event',
      startDate,
      endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location,
      notes,
    };

    try {
      const eventId = await Calendar.createEventAsync(defaultCalendarId, eventDetails);
      Alert.alert('Success', `Event created with ID: ${eventId}`);
      setEventModalVisible(false);
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

    const start = new Date(now.getTime() - 5 * 60 * 1000); // before 5 minutes
    const end = new Date(oneMonthLater.getTime() + 5 * 60 * 1000); // after five minutes 

    try {
      const fetchedEvents = await Calendar.getEventsAsync([defaultCalendarId], start, end);
      setEvents(fetchedEvents);
    } catch (error: any) {
      Alert.alert('Error fetching events', error.message);
    }
  };

  const showAndroidDatePicker = (
    currentDate: Date,
    onChange: (event: DateTimePickerEvent, selectedDate?: Date) => void
  ) => {
    DateTimePickerAndroid.open({
      value: currentDate,
      mode: 'datetime',
      is24Hour: true,
      onChange,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📆 Expo Calendar Example</Text>

      <Button title="Create Event" onPress={() => setEventModalVisible(true)} />
      <Button title="Get Events" onPress={getEvents} />

      <Text style={styles.subtitle}>Selected Calendar:</Text>
      <Text>
        {defaultCalendarId
          ? calendars.find((c) => c.id === defaultCalendarId)?.title
          : 'None selected'}
      </Text>

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

      <Modal visible={calendarModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.subtitle}>Select a Calendar</Text>
            {writableCalendars.map((cal) => (
              <TouchableOpacity
                key={cal.id}
                style={styles.calendarOption}
                onPress={() => {
                  setDefaultCalendarId(cal.id);
                  setCalendarModalVisible(false);
                  setTimeout(getEvents, 500);
                }}
              >
                <Text style={{color: 'blue'}}>{cal.title} ({cal.source.name})</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={eventModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <ScrollView>
              <Text style={styles.subtitle}>Create New Event</Text>
              <TextInput placeholder="Event Title" value={title} onChangeText={setTitle} />
              <TextInput placeholder="Location" value={location} onChangeText={setLocation} />
              <TextInput placeholder="Notes" value={notes} onChangeText={setNotes} />

              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'android') {
                    showAndroidDatePicker(startDate, (event, date) => {
                      if (date) setStartDate(date);
                    });
                  } else {
                    setShowStartPicker(true);
                  }
                }}
                style={{ marginVertical: 10 }}
              >
                <Text>Start Date: {startDate.toLocaleString()}</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  style={{backgroundColor: 'black'}}
                  mode="datetime"
                  display="spinner"
                  onChange={(e, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}

              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'android') {
                    showAndroidDatePicker(endDate, (event, date) => {
                      if (date) setEndDate(date);
                    });
                  } else {
                    setShowEndPicker(true);
                  }
                }}
                style={{ marginVertical: 10 }}
              >
                <Text>End Date: {endDate.toLocaleString()}</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  style={{backgroundColor: 'pink'}}
                  mode="datetime"
                  display="spinner"
                  onChange={(e, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}

              <View style={{ marginTop: 20 }}>
                <Button title="Save Event" onPress={createEvent} />
                <Button title="Cancel" color="red" onPress={() => setEventModalVisible(false)} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
    width: '90%',
    maxHeight: '80%',
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
