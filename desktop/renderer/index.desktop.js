/* @flow */

import React, {Component} from '../../react-native/react/base-react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux'
import configureStore from '../../react-native/react/store/configure-store'
import Nav from '../../react-native/react/nav'
import injectTapEventPlugin from 'react-tap-event-plugin'
import {isDev} from '../../react-native/react/constants/platform'
import {reduxDevToolsSelect} from '../../react-native/react/local-debug.desktop'

// For Remote Components
import RemoteManager from '../../react-native/react/native/remote-manager'
import {ipcMain} from 'remote'

let DevTools = null
let DebugPanel = null
let LogMonitor = null

if (isDev) {
  const RDT = require('redux-devtools/lib/react')
  DevTools = RDT.DevTools
  DebugPanel = RDT.DebugPanel
  LogMonitor = RDT.LogMonitor
}

const store = configureStore()

class Keybase extends Component {
  constructor () {
    super()

    this.state = {
      panelShowing: false
    }

    if (isDev) {
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', event => {
          if (event.ctrlKey && event.keyCode === 72) {
            this.setState({panelShowing: !this.state.panelShowing})
          }
        })
      }
    }

    // Used by material-ui widgets.
    injectTapEventPlugin()

    // For remote window components
    ipcMain.removeAllListeners('dispatchAction')
    ipcMain.removeAllListeners('stateChange')
    ipcMain.removeAllListeners('subscribeStore')

    ipcMain.on('dispatchAction', (event, action) => {
      setImmediate(() => store.dispatch(action))
    })

    ipcMain.on('subscribeStore', (event, substore) => {
      const getStore = () => {
        if (substore) {
          return store.getState()[substore] || {}
        } else {
          return store.getState() || {}
        }
      }

      event.sender.send('stateChange', getStore())
      store.subscribe(() => {
        // TODO: use transit
        event.sender.send('stateChange', getStore())
      })
    })
  }

  renderNav () {
    return (
      <Provider store={store}>
        <div style={{display: 'flex', flex: 1}}>
          <RemoteManager />
          <Nav />
        </div>
      </Provider>
    )
  }

  render () {
    if (isDev) {
      return (
        <div style={{position: 'absolute', width: '100%', height: '100%', display: 'flex'}}>
          {this.renderNav()}
          <DebugPanel style={{height: '100%', width: this.state.panelShowing ? '30%' : 0, position: 'relative', maxHeight: 'initial'}}>
            <DevTools store={store} monitor={LogMonitor} visibleOnLoad={false} select={reduxDevToolsSelect}/>
          </DebugPanel>
        </div>
      )
    } else {
      return this.renderNav()
    }
  }
}

ReactDOM.render(<Keybase/>, document.getElementById('app'))
