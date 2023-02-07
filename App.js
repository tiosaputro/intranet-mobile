import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, BackHandler, SafeAreaView, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
// import RNSimData from "react-native-sim-data";

PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE)

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function allowsNotificationsAsync() {
  const settings = await Notifications.getPermissionsAsync();
  return (
    settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function requestPermissionsAsync() {
  return await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowAnnouncements: true,
    },
    android: {
      sound: true,
      priority: 'max',
    }
  });
}

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionInfo }) => {
  // console.log('Received a notification in the background!');
  // Do something with the notification data
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

export default function App() {

  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [page, setPage] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();
  const domain = 'https://intra21.emp.id/login';
  // const domain = 'http://5518-111-95-220-21.ngrok.io/login'; //for testing
  const [currentUrl, setCurrentUrl] = useState(domain+'?extend=https://intra21.emp.id');
  // const [currentUrl, setCurrentUrl] = useState(domain+'?extend=http://e057-139-192-108-91.ngrok.io');
  var idUser = `
  document.getElementById('expotoken').value = '${expoPushToken}';
  document.getElementById('extend').value = '${currentUrl}';
  document.querySelector('.dt-button').style.display = 'none';
  window.ReactNativeWebView.postMessage(Math.max(document.body.offsetHeight, document.body.scrollHeight));
  `;
  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE)
  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS)
  const WebViewPage = ({navigation}) => {

    const WEBVIEW_REF = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);

    const backAction = () => {
      if(canGoBack){
        WEBVIEW_REF.current.goBack();
      }else{
        navigation.navigate('webview');        
      }
      return true;
    };
    const forwardAction = () => {
      // console.log("forward : "+canGoBack)
      if(canGoForward){
        WEBVIEW_REF.current.goForward();
      }
      return true;
    };

    useEffect(() => {    

        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
        // This listener is fired whenever a notification is received while the app is foregrounded. app is open
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          setNotification(notification);
          const onInteraction = notification.request.content.data.event;
            setCurrentUrl(onInteraction);
        });

        // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed) app is closed
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          const onInteraction = response.notification.request.content.data.event;
          setCurrentUrl(onInteraction);
        });

        Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
        BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => {
          BackHandler.removeEventListener('hardwareBackPress', backAction);
          Notifications.removeNotificationSubscription(notificationListener.current);
          Notifications.removeNotificationSubscription(responseListener.current);
          Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK)
        };
      },[canGoBack, lastNotificationResponse]); //end use effect

          
    const [webViewHeight, setWebViewHeight] = React.useState(null);
  
    const onMessage = (event) => {
      setWebViewHeight(Number(event.nativeEvent.data));
    }
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
              javaScriptEnabledAndroid={true}
              originWhitelist={['*']}
              allowFileAccess={true}
              allowFileAccessFromFileURLs={true}
              style={styles.webViewStyle}
              javaScriptCanOpenWindowsAutomatically={true}
              source={{ uri: `${currentUrl}`, "Accept-Language": navigator.language }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              nestedScrollEnabled={true}
              onMessage={onMessage}
              injectedJavaScript={idUser}
              allowsBackForwardNavigationGestures={true}
              requestDisallowInterceptTouchEvent={true}
              downloadingMessage={'Downloading...'}
              ref={WEBVIEW_REF}
              onNavigationStateChange={(navState) => {               
                setCanGoBack(navState.canGoBack);
                // setCurrentUrl(navState.url);
                // setCanGoForward(navState.canGoForward);
              }}
          />
      </SafeAreaView>
    );
  };
  //create stack navigator
  const Stack = createStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="webview" component={WebViewPage} options={{ headerShown : false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );

}

const styles = StyleSheet.create({
  stylBefore: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleAfter: {
    flex: 1,
  },
  webViewStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    // marginTop: 35,
  },
  activityIndicatorStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  ScrollStyle: {
    backgroundColor : 'white'
   }
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    // if (finalStatus !== 'granted') {
    //   alert('Failed to get push token for push notification!');
    //   return;
    // }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }
  return token;
}