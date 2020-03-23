import * as React from 'react'
import * as Container from '../../../../../util/container'
import * as Kb from '../../../../../common-adapters'
import {LayoutEvent} from '../../../../../common-adapters/box'
import * as Constants from '../../../../../constants/chat2'
import * as Types from '../../../../../constants/types/chat2'
import * as Chat2Gen from '../../../../../actions/chat2-gen'
import * as RouteTreeGen from '../../../../../actions/route-tree-gen'
import * as Styles from '../../../../../styles'
import SkinTonePicker from './skin-tone-picker'
import EmojiPicker from '.'

type Props = {
  onDidPick: () => void
  onPick:
    | ((emoji: string) => void)
    | {
        conversationIDKey: Types.ConversationIDKey
        ordinal: Types.Ordinal
      }
}

type RoutableProps = Container.RouteProps<{
  conversationIDKey: Types.ConversationIDKey
  onDidPick: () => void
  ordinal: Types.Ordinal
}>

const useReacji = ({onPick, onDidPick}: Props) => {
  const topReacjis = Container.useSelector(state => state.chat2.userReacjis.topReacjis)
  const [filter, setFilter] = React.useState('')
  const dispatch = Container.useDispatch()
  const onAddReaction = React.useCallback(
    (emoji: string) => {
      typeof onPick === 'function'
        ? onPick(emoji)
        : dispatch(
            Chat2Gen.createToggleMessageReaction({
              conversationIDKey: onPick.conversationIDKey,
              emoji,
              ordinal: onPick.ordinal,
            })
          )
      onDidPick()
    },
    [dispatch, onPick, onDidPick]
  )
  return {
    filter,
    onAddReaction,
    setFilter,
    topReacjis,
  }
}

let lastSetSkinTone: undefined | Types.EmojiSkinTone = undefined
// This can only be used in one place at a time for now since when it's changed
// it doesn't cause other hook instances to update.
const useSkinTone = () => {
  const [currentSkinTone, _setSkinTone] = React.useState(lastSetSkinTone)
  const setSkinTone = React.useCallback(
    (skinTone: undefined | Types.EmojiSkinTone) => {
      lastSetSkinTone = skinTone
      _setSkinTone(skinTone)
    },
    [_setSkinTone]
  )
  return {currentSkinTone, setSkinTone}
}

const WrapperMobile = (props: Props) => {
  const {filter, onAddReaction, setFilter, topReacjis} = useReacji(props)
  const [width, setWidth] = React.useState(0)
  const onLayout = (evt: LayoutEvent) => evt.nativeEvent && setWidth(evt.nativeEvent.layout.width)
  const {currentSkinTone, setSkinTone} = useSkinTone()
  const dispatch = Container.useDispatch()
  const onCancel = () => dispatch(RouteTreeGen.createNavigateUp())
  return (
    <Kb.Box2 direction="vertical" onLayout={onLayout} fullWidth={true} fullHeight={true}>
      <Kb.Box2 direction="horizontal" fullWidth={true} alignItems="center">
        <Kb.ClickableBox onClick={onCancel} style={styles.cancelContainerMobile}>
          <Kb.Text type="BodyBigLink">Cancel</Kb.Text>
        </Kb.ClickableBox>
        <Kb.SearchFilter
          focusOnMount={true}
          size="small"
          icon="iconfont-search"
          placeholderText="Search"
          onChange={setFilter}
          style={styles.searchFilter}
        />
      </Kb.Box2>
      <EmojiPicker
        topReacjis={topReacjis}
        filter={filter}
        onChoose={onAddReaction}
        width={width}
        skinTone={currentSkinTone}
      />
      <Kb.Box2 direction="horizontal" fullWidth={true} alignItems="center" style={styles.footerContainer}>
        <SkinTonePicker currentSkinTone={currentSkinTone} setSkinTone={setSkinTone} />
      </Kb.Box2>
    </Kb.Box2>
  )
}

export const EmojiPickerDesktop = (props: Props) => {
  const {filter, onAddReaction, setFilter, topReacjis} = useReacji(props)
  const {currentSkinTone, setSkinTone} = useSkinTone()
  return (
    <Kb.Box style={styles.containerDesktop} onClick={e => e.stopPropagation()} gap="tiny">
      <Kb.Box2
        direction="horizontal"
        gap="tiny"
        fullWidth={true}
        alignItems="center"
        style={styles.topContainerDesktop}
      >
        <Kb.SearchFilter
          focusOnMount={true}
          size="full-width"
          icon="iconfont-search"
          placeholderText="Search"
          onChange={setFilter}
        />
        <SkinTonePicker currentSkinTone={currentSkinTone} setSkinTone={setSkinTone} />
      </Kb.Box2>
      <Kb.Box style={styles.emojiContainer}>
        <EmojiPicker
          topReacjis={topReacjis}
          filter={filter}
          onChoose={onAddReaction}
          width={336}
          skinTone={currentSkinTone}
        />
      </Kb.Box>
      {/* TODO
      <Kb.Box2
        direction="horizontal"
        fullWidth={true}
        alignItems="center"
        style={styles.footerContainer}
      ></Kb.Box2>
      */}
    </Kb.Box>
  )
}

const styles = Styles.styleSheetCreate(
  () =>
    ({
      cancelContainerMobile: {
        paddingBottom: Styles.globalMargins.tiny,
        paddingLeft: Styles.globalMargins.small,
        paddingTop: Styles.globalMargins.tiny,
      },
      containerDesktop: {
        ...Styles.globalStyles.flexBoxColumn,
        backgroundColor: Styles.globalColors.white,
      },
      emojiContainer: {
        flex: 1,
        flexGrow: 1,
        height: 443,
        minHeight: 443,
        overflow: 'hidden',
        width: 336,
      },
      footerContainer: Styles.platformStyles({
        common: {
          paddingLeft: Styles.globalMargins.small,
          paddingRight: Styles.globalMargins.small,
        },
        isElectron: {
          height: Styles.globalMargins.xlarge + Styles.globalMargins.xtiny,
        },
        isMobile: {
          backgroundColor: Styles.globalColors.blueGrey,
          height: Styles.globalMargins.mediumLarge + Styles.globalMargins.small,
        },
      }),
      input: {
        borderBottomWidth: 1,
        borderColor: Styles.globalColors.black_10,
        borderRadius: 0,
        borderWidth: 0,
        padding: Styles.globalMargins.small,
      },
      searchFilter: Styles.platformStyles({
        isMobile: {
          flexGrow: 1,
          flexShrink: 1,
        },
      }),
      topContainerDesktop: {
        padding: Styles.globalMargins.tiny,
      },
    } as const)
)

export const Routable = (routableProps: RoutableProps) => {
  const conversationIDKey = Container.getRouteProps(
    routableProps,
    'conversationIDKey',
    Constants.noConversationIDKey
  )
  const ordinal = Container.getRouteProps(routableProps, 'ordinal', Types.numberToOrdinal(0))
  const dispatch = Container.useDispatch()
  const navigateUp = () => dispatch(RouteTreeGen.createNavigateUp())
  return <WrapperMobile onPick={{conversationIDKey, ordinal}} onDidPick={navigateUp} />
}
