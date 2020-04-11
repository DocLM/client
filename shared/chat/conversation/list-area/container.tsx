import * as Chat2Gen from '../../../actions/chat2-gen'
import * as ConfigGen from '../../../actions/config-gen'
import * as Constants from '../../../constants/chat2'
import * as Container from '../../../util/container'
import * as Types from '../../../constants/types/chat2'
import ListComponent from '.'
import throttle from 'lodash/throttle'

type OwnProps = {
  conversationIDKey: Types.ConversationIDKey
  onFocusInput: () => void
  scrollListDownCounter: number
  scrollListToBottomCounter: number
  scrollListUpCounter: number
}

const throttledLoadNewer = throttle(
  (dispatch: Container.TypedDispatch, conversationIDKey: Types.ConversationIDKey) => {
    dispatch(Chat2Gen.createLoadNewerMessagesDueToScroll({conversationIDKey}))
  },
  1000
)

const throttledLoadOlder = throttle(
  (dispatch: Container.TypedDispatch, conversationIDKey: Types.ConversationIDKey) => {
    dispatch(Chat2Gen.createLoadOlderMessagesDueToScroll({conversationIDKey}))
  },
  1000
)

const throttledJumpToUnread = throttle(
  (dispatch: Container.TypedDispatch, conversationIDKey: Types.ConversationIDKey, messageID: Types.MessageID) => {
    dispatch(Chat2Gen.createLoadMessagesCentered({conversationIDKey, highlightMode: 'flash', messageID}))
  },
  1000
)

export default Container.connect(
  (state, {conversationIDKey}: OwnProps) => {
    const messageOrdinals = Constants.getMessageOrdinals(state, conversationIDKey)
    const {metaMap} = state.chat2
    const readMsgID = metaMap.get(conversationIDKey)?.readMsgID
    const maxVisibleMsgID = metaMap.get(conversationIDKey)?.maxVisibleMsgID
    const lastOrdinal = [...messageOrdinals].pop()
    const maybeCenterMessage = Constants.getMessageCenterOrdinal(state, conversationIDKey)
    const centeredOrdinal =
      maybeCenterMessage === null || maybeCenterMessage === undefined ? undefined : maybeCenterMessage.ordinal
    const containsLatestMessage = state.chat2.containsLatestMessageMap.get(conversationIDKey) || false
    let lastMessageIsOurs = false
    if (lastOrdinal) {
      const m = Constants.getMessage(state, conversationIDKey, lastOrdinal)
      lastMessageIsOurs = !!m && m.author === state.config.username
    }

    return {
      centeredOrdinal,
      containsLatestMessage,
      conversationIDKey,
      readMsgID,
      maxVisibleMsgID,
      editingOrdinal: state.chat2.editingMap.get(conversationIDKey),
      lastMessageIsOurs,
      messageOrdinals,
    }
  },
  (dispatch, {conversationIDKey}: OwnProps) => ({
    copyToClipboard: (text: string) => dispatch(ConfigGen.createCopyToClipboard({text})),
    loadNewerMessages: () => throttledLoadNewer(dispatch, conversationIDKey),
    loadOlderMessages: () => throttledLoadOlder(dispatch, conversationIDKey),
    loadLastUnread: (lastUnreadId: Types.MessageID) => throttledJumpToUnread(dispatch, conversationIDKey, lastUnreadId),
    markInitiallyLoadedThreadAsRead: () =>
      dispatch(Chat2Gen.createMarkInitiallyLoadedThreadAsRead({conversationIDKey})),
    onJumpToRecent: () => dispatch(Chat2Gen.createJumpToRecent({conversationIDKey})),
  }),
  (stateProps, dispatchProps, ownProps: OwnProps) => ({
    centeredOrdinal: stateProps.centeredOrdinal,
    containsLatestMessage: stateProps.containsLatestMessage,
    conversationIDKey: stateProps.conversationIDKey,
    copyToClipboard: dispatchProps.copyToClipboard,
    editingOrdinal: stateProps.editingOrdinal,
    lastMessageIsOurs: stateProps.lastMessageIsOurs,
    loadNewerMessages: dispatchProps.loadNewerMessages,
    loadOlderMessages: dispatchProps.loadOlderMessages,
    loadLastUnread: () => {
      const readMsgID = stateProps?.readMsgID ? stateProps.readMsgID : 0
      const maxVisibleMsgID = stateProps?.maxVisibleMsgID ? stateProps.maxVisibleMsgID : 0
      if(maxVisibleMsgID >= readMsgID)
        return dispatchProps.loadLastUnread(readMsgID)
    },
    markInitiallyLoadedThreadAsRead: dispatchProps.markInitiallyLoadedThreadAsRead,
    messageOrdinals: [...stateProps.messageOrdinals],
    onFocusInput: ownProps.onFocusInput,
    onJumpToRecent: dispatchProps.onJumpToRecent,
    scrollListDownCounter: ownProps.scrollListDownCounter,
    scrollListToBottomCounter: ownProps.scrollListToBottomCounter,
    scrollListUpCounter: ownProps.scrollListUpCounter,
  })
)(ListComponent)
