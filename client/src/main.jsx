import { Buffer } from 'buffer';
import process from 'process';

// Polyfill global, Buffer, process for simple-peer
if (typeof global === 'undefined') {
  window.global = window;
}
if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}
if (typeof window.process === 'undefined') {
  window.process = process;
}

import React from 'react'
import ReactDOM from 'react-dom/client'

import { Provider } from 'react-redux'
import store from './store.js'
import App from './App.jsx'
import { SocketContextProvider } from './context/SocketContext.jsx'
import { CallContextProvider } from './context/CallContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <SocketContextProvider>
      <CallContextProvider>
        <App />
      </CallContextProvider>
    </SocketContextProvider>
  </Provider>
)
