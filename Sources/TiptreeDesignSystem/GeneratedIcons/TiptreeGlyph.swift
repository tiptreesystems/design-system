// GENERATED from icons/icons.json v0.11.0; DO NOT EDIT.
// Solar by 480 Design (CC BY 4.0); see bundled Notices for provenance/modifications.
import SwiftUI

/// Canonical drawing names. Applications own role mappings and localized labels.
public enum TiptreeGlyph: String, CaseIterable, Sendable {
    case `add` = "add"
    case `alarm` = "alarm"
    case `altArrowDown` = "alt-arrow-down"
    case `altArrowLeft` = "alt-arrow-left"
    case `altArrowRight` = "alt-arrow-right"
    case `altArrowUp` = "alt-arrow-up"
    case `archiveDownMinimalistic` = "archive-down-minimalistic"
    case `archiveUpMinimalistic` = "archive-up-minimalistic"
    case `arrowDown` = "arrow-down"
    case `arrowLeft` = "arrow-left"
    case `arrowRight` = "arrow-right"
    case `arrowUp` = "arrow-up"
    case `bell` = "bell"
    case `blockquote` = "blockquote"
    case `bolt` = "bolt"
    case `book` = "book"
    case `bookBookmark` = "book-bookmark"
    case `bug` = "bug"
    case `buildings` = "buildings"
    case `calendar` = "calendar"
    case `camera` = "camera"
    case `chart2` = "chart-2"
    case `chatRound` = "chat-round"
    case `chatSquare` = "chat-square"
    case `check` = "check"
    case `checkCircle` = "check-circle"
    case `checklistMinimalistic` = "checklist-minimalistic"
    case `clipboard` = "clipboard"
    case `close` = "close"
    case `closeCircle` = "close-circle"
    case `code2` = "code-2"
    case `codeSquare` = "code-square"
    case `compass` = "compass"
    case `copy` = "copy"
    case `cpu` = "cpu"
    case `dangerCircle` = "danger-circle"
    case `dangerTriangle` = "danger-triangle"
    case `database` = "database"
    case `dialog` = "dialog"
    case `diskette` = "diskette"
    case `dislike` = "dislike"
    case `divider` = "divider"
    case `document` = "document"
    case `documents` = "documents"
    case `downloadMinimalistic` = "download-minimalistic"
    case `eye` = "eye"
    case `eyeClosed` = "eye-closed"
    case `file` = "file"
    case `filter` = "filter"
    case `folder` = "folder"
    case `gallery` = "gallery"
    case `ghost` = "ghost"
    case `global` = "global"
    case `gripDots` = "grip-dots"
    case `hamburgerMenu` = "hamburger-menu"
    case `hashtag` = "hashtag"
    case `heading` = "heading"
    case `history2` = "history-2"
    case `infoCircle` = "info-circle"
    case `layers` = "layers"
    case `letter` = "letter"
    case `lightbulb` = "lightbulb"
    case `lightbulbMinimalistic` = "lightbulb-minimalistic"
    case `like` = "like"
    case `linkRoundAngle` = "link-round-angle"
    case `list` = "list"
    case `listCheck` = "list-check"
    case `listNumbered` = "list-numbered"
    case `lockKeyhole` = "lock-keyhole"
    case `logout2` = "logout-2"
    case `magnifier` = "magnifier"
    case `map` = "map"
    case `maximize` = "maximize"
    case `menuDots` = "menu-dots"
    case `merge` = "merge"
    case `microphone` = "microphone"
    case `minimize` = "minimize"
    case `moon` = "moon"
    case `moonStars` = "moon-stars"
    case `notes` = "notes"
    case `panelRight` = "panel-right"
    case `paperclip` = "paperclip"
    case `pauseCircle` = "pause-circle"
    case `pen` = "pen"
    case `pin` = "pin"
    case `pinFilled` = "pin-filled"
    case `plane2` = "plane-2"
    case `play` = "play"
    case `plugCircle` = "plug-circle"
    case `plusHeavy` = "plus-heavy"
    case `question` = "question"
    case `questionCircle` = "question-circle"
    case `refresh` = "refresh"
    case `replyArrow` = "reply-arrow"
    case `rocket` = "rocket"
    case `route` = "route"
    case `routing` = "routing"
    case `scale` = "scale"
    case `server2` = "server-2"
    case `settings` = "settings"
    case `share` = "share"
    case `shieldStar` = "shield-star"
    case `smartphone` = "smartphone"
    case `sort` = "sort"
    case `sortHorizontal` = "sort-horizontal"
    case `sortVertical` = "sort-vertical"
    case `soundwave` = "soundwave"
    case `squareArrowRightUp` = "square-arrow-right-up"
    case `starsMinimalistic` = "stars-minimalistic"
    case `subheading` = "subheading"
    case `sun` = "sun"
    case `tableHeader` = "table-header"
    case `telescope` = "telescope"
    case `textBold` = "text-bold"
    case `textCross` = "text-cross"
    case `textFormat` = "text-format"
    case `textItalic` = "text-italic"
    case `transcript` = "transcript"
    case `trashBinMinimalistic` = "trash-bin-minimalistic"
    case `undoLeftRound` = "undo-left-round"
    case `undoRightRound` = "undo-right-round"
    case `unlink` = "unlink"
    case `uploadMinimalistic` = "upload-minimalistic"
    case `userCheckRounded` = "user-check-rounded"
    case `userId` = "user-id"
    case `userRounded` = "user-rounded"
    case `usersGroupRounded` = "users-group-rounded"
    case `volumeLoud` = "volume-loud"
    case `widget` = "widget"
    case `widget2` = "widget-2"
    case `widget4` = "widget-4"

    /// Resolves canonical names and published compatibility aliases; unknown names return nil.
    public static func named(_ name: String) -> Self? {
        Self(rawValue: name)
    }

    /// The registry cut (linear, filled or solid); never inferred from the name.
    public var cut: String {
        switch self {
        case .`add`: "linear"
        case .`alarm`: "linear"
        case .`altArrowDown`: "linear"
        case .`altArrowLeft`: "linear"
        case .`altArrowRight`: "linear"
        case .`altArrowUp`: "linear"
        case .`archiveDownMinimalistic`: "linear"
        case .`archiveUpMinimalistic`: "linear"
        case .`arrowDown`: "linear"
        case .`arrowLeft`: "linear"
        case .`arrowRight`: "linear"
        case .`arrowUp`: "linear"
        case .`bell`: "linear"
        case .`blockquote`: "linear"
        case .`bolt`: "linear"
        case .`book`: "linear"
        case .`bookBookmark`: "linear"
        case .`bug`: "linear"
        case .`buildings`: "linear"
        case .`calendar`: "linear"
        case .`camera`: "linear"
        case .`chart2`: "linear"
        case .`chatRound`: "linear"
        case .`chatSquare`: "linear"
        case .`check`: "linear"
        case .`checkCircle`: "linear"
        case .`checklistMinimalistic`: "linear"
        case .`clipboard`: "linear"
        case .`close`: "linear"
        case .`closeCircle`: "linear"
        case .`code2`: "linear"
        case .`codeSquare`: "linear"
        case .`compass`: "linear"
        case .`copy`: "linear"
        case .`cpu`: "linear"
        case .`dangerCircle`: "linear"
        case .`dangerTriangle`: "linear"
        case .`database`: "linear"
        case .`dialog`: "linear"
        case .`diskette`: "linear"
        case .`dislike`: "linear"
        case .`divider`: "linear"
        case .`document`: "linear"
        case .`documents`: "linear"
        case .`downloadMinimalistic`: "linear"
        case .`eye`: "linear"
        case .`eyeClosed`: "linear"
        case .`file`: "linear"
        case .`filter`: "linear"
        case .`folder`: "linear"
        case .`gallery`: "linear"
        case .`ghost`: "linear"
        case .`global`: "linear"
        case .`gripDots`: "solid"
        case .`hamburgerMenu`: "linear"
        case .`hashtag`: "linear"
        case .`heading`: "linear"
        case .`history2`: "linear"
        case .`infoCircle`: "linear"
        case .`layers`: "linear"
        case .`letter`: "linear"
        case .`lightbulb`: "linear"
        case .`lightbulbMinimalistic`: "linear"
        case .`like`: "linear"
        case .`linkRoundAngle`: "linear"
        case .`list`: "linear"
        case .`listCheck`: "linear"
        case .`listNumbered`: "linear"
        case .`lockKeyhole`: "linear"
        case .`logout2`: "linear"
        case .`magnifier`: "linear"
        case .`map`: "linear"
        case .`maximize`: "linear"
        case .`menuDots`: "solid"
        case .`merge`: "linear"
        case .`microphone`: "linear"
        case .`minimize`: "linear"
        case .`moon`: "linear"
        case .`moonStars`: "linear"
        case .`notes`: "linear"
        case .`panelRight`: "linear"
        case .`paperclip`: "linear"
        case .`pauseCircle`: "linear"
        case .`pen`: "linear"
        case .`pin`: "linear"
        case .`pinFilled`: "filled"
        case .`plane2`: "linear"
        case .`play`: "linear"
        case .`plugCircle`: "linear"
        case .`plusHeavy`: "solid"
        case .`question`: "linear"
        case .`questionCircle`: "linear"
        case .`refresh`: "linear"
        case .`replyArrow`: "linear"
        case .`rocket`: "linear"
        case .`route`: "linear"
        case .`routing`: "linear"
        case .`scale`: "linear"
        case .`server2`: "linear"
        case .`settings`: "linear"
        case .`share`: "linear"
        case .`shieldStar`: "linear"
        case .`smartphone`: "linear"
        case .`sort`: "linear"
        case .`sortHorizontal`: "linear"
        case .`sortVertical`: "linear"
        case .`soundwave`: "linear"
        case .`squareArrowRightUp`: "linear"
        case .`starsMinimalistic`: "linear"
        case .`subheading`: "linear"
        case .`sun`: "linear"
        case .`tableHeader`: "linear"
        case .`telescope`: "linear"
        case .`textBold`: "linear"
        case .`textCross`: "linear"
        case .`textFormat`: "linear"
        case .`textItalic`: "linear"
        case .`transcript`: "linear"
        case .`trashBinMinimalistic`: "linear"
        case .`undoLeftRound`: "linear"
        case .`undoRightRound`: "linear"
        case .`unlink`: "linear"
        case .`uploadMinimalistic`: "linear"
        case .`userCheckRounded`: "linear"
        case .`userId`: "linear"
        case .`userRounded`: "linear"
        case .`usersGroupRounded`: "linear"
        case .`volumeLoud`: "linear"
        case .`widget`: "linear"
        case .`widget2`: "linear"
        case .`widget4`: "linear"
        }
    }

    var paths: [TiptreeGlyphPath] {
        switch self {
        case .`add`: GeneratedDrawingsA.`add`
        case .`alarm`: GeneratedDrawingsA.`alarm`
        case .`altArrowDown`: GeneratedDrawingsA.`altArrowDown`
        case .`altArrowLeft`: GeneratedDrawingsA.`altArrowLeft`
        case .`altArrowRight`: GeneratedDrawingsA.`altArrowRight`
        case .`altArrowUp`: GeneratedDrawingsA.`altArrowUp`
        case .`archiveDownMinimalistic`: GeneratedDrawingsA.`archiveDownMinimalistic`
        case .`archiveUpMinimalistic`: GeneratedDrawingsA.`archiveUpMinimalistic`
        case .`arrowDown`: GeneratedDrawingsA.`arrowDown`
        case .`arrowLeft`: GeneratedDrawingsA.`arrowLeft`
        case .`arrowRight`: GeneratedDrawingsA.`arrowRight`
        case .`arrowUp`: GeneratedDrawingsA.`arrowUp`
        case .`bell`: GeneratedDrawingsB.`bell`
        case .`blockquote`: GeneratedDrawingsB.`blockquote`
        case .`bolt`: GeneratedDrawingsB.`bolt`
        case .`book`: GeneratedDrawingsB.`book`
        case .`bookBookmark`: GeneratedDrawingsB.`bookBookmark`
        case .`bug`: GeneratedDrawingsB.`bug`
        case .`buildings`: GeneratedDrawingsB.`buildings`
        case .`calendar`: GeneratedDrawingsC.`calendar`
        case .`camera`: GeneratedDrawingsC.`camera`
        case .`chart2`: GeneratedDrawingsC.`chart2`
        case .`chatRound`: GeneratedDrawingsC.`chatRound`
        case .`chatSquare`: GeneratedDrawingsC.`chatSquare`
        case .`check`: GeneratedDrawingsC.`check`
        case .`checkCircle`: GeneratedDrawingsC.`checkCircle`
        case .`checklistMinimalistic`: GeneratedDrawingsC.`checklistMinimalistic`
        case .`clipboard`: GeneratedDrawingsC.`clipboard`
        case .`close`: GeneratedDrawingsC.`close`
        case .`closeCircle`: GeneratedDrawingsC.`closeCircle`
        case .`code2`: GeneratedDrawingsC.`code2`
        case .`codeSquare`: GeneratedDrawingsC.`codeSquare`
        case .`compass`: GeneratedDrawingsC.`compass`
        case .`copy`: GeneratedDrawingsC.`copy`
        case .`cpu`: GeneratedDrawingsC.`cpu`
        case .`dangerCircle`: GeneratedDrawingsD.`dangerCircle`
        case .`dangerTriangle`: GeneratedDrawingsD.`dangerTriangle`
        case .`database`: GeneratedDrawingsD.`database`
        case .`dialog`: GeneratedDrawingsD.`dialog`
        case .`diskette`: GeneratedDrawingsD.`diskette`
        case .`dislike`: GeneratedDrawingsD.`dislike`
        case .`divider`: GeneratedDrawingsD.`divider`
        case .`document`: GeneratedDrawingsD.`document`
        case .`documents`: GeneratedDrawingsD.`documents`
        case .`downloadMinimalistic`: GeneratedDrawingsD.`downloadMinimalistic`
        case .`eye`: GeneratedDrawingsE.`eye`
        case .`eyeClosed`: GeneratedDrawingsE.`eyeClosed`
        case .`file`: GeneratedDrawingsF.`file`
        case .`filter`: GeneratedDrawingsF.`filter`
        case .`folder`: GeneratedDrawingsF.`folder`
        case .`gallery`: GeneratedDrawingsG.`gallery`
        case .`ghost`: GeneratedDrawingsG.`ghost`
        case .`global`: GeneratedDrawingsG.`global`
        case .`gripDots`: GeneratedDrawingsG.`gripDots`
        case .`hamburgerMenu`: GeneratedDrawingsH.`hamburgerMenu`
        case .`hashtag`: GeneratedDrawingsH.`hashtag`
        case .`heading`: GeneratedDrawingsH.`heading`
        case .`history2`: GeneratedDrawingsH.`history2`
        case .`infoCircle`: GeneratedDrawingsI.`infoCircle`
        case .`layers`: GeneratedDrawingsL.`layers`
        case .`letter`: GeneratedDrawingsL.`letter`
        case .`lightbulb`: GeneratedDrawingsL.`lightbulb`
        case .`lightbulbMinimalistic`: GeneratedDrawingsL.`lightbulbMinimalistic`
        case .`like`: GeneratedDrawingsL.`like`
        case .`linkRoundAngle`: GeneratedDrawingsL.`linkRoundAngle`
        case .`list`: GeneratedDrawingsL.`list`
        case .`listCheck`: GeneratedDrawingsL.`listCheck`
        case .`listNumbered`: GeneratedDrawingsL.`listNumbered`
        case .`lockKeyhole`: GeneratedDrawingsL.`lockKeyhole`
        case .`logout2`: GeneratedDrawingsL.`logout2`
        case .`magnifier`: GeneratedDrawingsM.`magnifier`
        case .`map`: GeneratedDrawingsM.`map`
        case .`maximize`: GeneratedDrawingsM.`maximize`
        case .`menuDots`: GeneratedDrawingsM.`menuDots`
        case .`merge`: GeneratedDrawingsM.`merge`
        case .`microphone`: GeneratedDrawingsM.`microphone`
        case .`minimize`: GeneratedDrawingsM.`minimize`
        case .`moon`: GeneratedDrawingsM.`moon`
        case .`moonStars`: GeneratedDrawingsM.`moonStars`
        case .`notes`: GeneratedDrawingsN.`notes`
        case .`panelRight`: GeneratedDrawingsP.`panelRight`
        case .`paperclip`: GeneratedDrawingsP.`paperclip`
        case .`pauseCircle`: GeneratedDrawingsP.`pauseCircle`
        case .`pen`: GeneratedDrawingsP.`pen`
        case .`pin`: GeneratedDrawingsP.`pin`
        case .`pinFilled`: GeneratedDrawingsP.`pinFilled`
        case .`plane2`: GeneratedDrawingsP.`plane2`
        case .`play`: GeneratedDrawingsP.`play`
        case .`plugCircle`: GeneratedDrawingsP.`plugCircle`
        case .`plusHeavy`: GeneratedDrawingsP.`plusHeavy`
        case .`question`: GeneratedDrawingsQ.`question`
        case .`questionCircle`: GeneratedDrawingsQ.`questionCircle`
        case .`refresh`: GeneratedDrawingsR.`refresh`
        case .`replyArrow`: GeneratedDrawingsR.`replyArrow`
        case .`rocket`: GeneratedDrawingsR.`rocket`
        case .`route`: GeneratedDrawingsR.`route`
        case .`routing`: GeneratedDrawingsR.`routing`
        case .`scale`: GeneratedDrawingsS.`scale`
        case .`server2`: GeneratedDrawingsS.`server2`
        case .`settings`: GeneratedDrawingsS.`settings`
        case .`share`: GeneratedDrawingsS.`share`
        case .`shieldStar`: GeneratedDrawingsS.`shieldStar`
        case .`smartphone`: GeneratedDrawingsS.`smartphone`
        case .`sort`: GeneratedDrawingsS.`sort`
        case .`sortHorizontal`: GeneratedDrawingsS.`sortHorizontal`
        case .`sortVertical`: GeneratedDrawingsS.`sortVertical`
        case .`soundwave`: GeneratedDrawingsS.`soundwave`
        case .`squareArrowRightUp`: GeneratedDrawingsS.`squareArrowRightUp`
        case .`starsMinimalistic`: GeneratedDrawingsS.`starsMinimalistic`
        case .`subheading`: GeneratedDrawingsS.`subheading`
        case .`sun`: GeneratedDrawingsS.`sun`
        case .`tableHeader`: GeneratedDrawingsT.`tableHeader`
        case .`telescope`: GeneratedDrawingsT.`telescope`
        case .`textBold`: GeneratedDrawingsT.`textBold`
        case .`textCross`: GeneratedDrawingsT.`textCross`
        case .`textFormat`: GeneratedDrawingsT.`textFormat`
        case .`textItalic`: GeneratedDrawingsT.`textItalic`
        case .`transcript`: GeneratedDrawingsT.`transcript`
        case .`trashBinMinimalistic`: GeneratedDrawingsT.`trashBinMinimalistic`
        case .`undoLeftRound`: GeneratedDrawingsU.`undoLeftRound`
        case .`undoRightRound`: GeneratedDrawingsU.`undoRightRound`
        case .`unlink`: GeneratedDrawingsU.`unlink`
        case .`uploadMinimalistic`: GeneratedDrawingsU.`uploadMinimalistic`
        case .`userCheckRounded`: GeneratedDrawingsU.`userCheckRounded`
        case .`userId`: GeneratedDrawingsU.`userId`
        case .`userRounded`: GeneratedDrawingsU.`userRounded`
        case .`usersGroupRounded`: GeneratedDrawingsU.`usersGroupRounded`
        case .`volumeLoud`: GeneratedDrawingsV.`volumeLoud`
        case .`widget`: GeneratedDrawingsW.`widget`
        case .`widget2`: GeneratedDrawingsW.`widget2`
        case .`widget4`: GeneratedDrawingsW.`widget4`
        }
    }
}
