import React, { Component, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, RefreshControl, Button, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
export default class MainActivity extends Component {
  constructor(props) {
    super(props);
    this.state = { isVisible: true };
  }

  showLoader() {
    this.setState({ isVisible: true });
  }

  hideLoader() {
    this.setState({ isVisible: false });
  }

  render() {
    return (
      <View
        style={
          this.state.isVisible === true ? styles.stylBefore : styles.styleAfter
        }>
        {this.state.isVisible ? (
          <ActivityIndicator
            color="blue"
            size="large"
            style={styles.activityIndicatorStyle}
          />
        ) : null}
        <WebView          
          originWhitelist={['*']}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          style={styles.webViewStyle}
          javaScriptCanOpenWindowsAutomatically={true}
          source={{ uri: 'https://intra21.emp.id/', "Accept-Language": navigator.language,
          "User-Agent": Platform.OS, }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadStart={() => this.showLoader()}
          onLoad={() => this.hideLoader()}
          onMessage={event => this.onMessage(event)}
        />
      </View>
    );
  }
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
    marginTop: 40,
  },
  activityIndicatorStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  ScrollStyle: {
    backgroundColor : 'white',
    position: 'relative',
   }
});