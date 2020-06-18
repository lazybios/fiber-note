import { EditorState, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { DOMParser } from "prosemirror-model"
import { buildInputRules, buildKeymap } from "prosemirror-example-setup"
import { keymap } from "prosemirror-keymap"
import { baseKeymap } from "prosemirror-commands"
import { dropCursor } from "prosemirror-dropcursor"
import { gapCursor } from "prosemirror-gapcursor"
import { history } from "prosemirror-history"

import NoteController from "controllers/note_controller"
import { schema } from "./editor/schema"

type UpdateTitleHandler = (newTitle: string) => void

// returns the new title or undefined
function titleChanged(transaction: Transaction) {
  let oldTitle = transaction.before.content.content[0].content.content[0].text
  let newTitle = transaction.doc.content.content[0].content.content[0].text

  if (oldTitle != newTitle) {
    return newTitle
  }
}

export default class Editor {
  constructor(
    private noteController: NoteController,
    editorHolder: Element,
    contentHolder: Element,
  ) {
    let state = EditorState.create({
      doc: DOMParser.fromSchema(schema).parse(contentHolder),
      plugins: [
        buildInputRules(schema),
        // TODO keymap around enter -> new list item
        // https://discuss.prosemirror.net/t/lists-paragraph-inside-li-instead-of-new-list-item/455
        // TODO keymap around tab and shift-tab
        // TODO extract hints about available keys
        // https://github.com/prosemirror/prosemirror-example-setup/blob/master/src/keymap.js
        keymap(buildKeymap(schema)),
        keymap(baseKeymap),
        dropCursor(),
        gapCursor(),
        history(),
      ]
    })

    let view = new EditorView(editorHolder, {
      state: state,
      dispatchTransaction: this.dispatchTransaction
    })
    view['editor'] = this
  }

  dispatchTransaction(transaction: Transaction) {
    // `this` will be bound to this EditorView
    let view = this as unknown as EditorView

    // standard protocol start
    let newState = view.state.apply(transaction)
    view.updateState(newState)
    // standard protocol end

    if (!transaction.docChanged) { return }

    let editor = <Editor>this['editor']

    console.log(transaction.doc)

    // update title as needed
    let newTitle = titleChanged(transaction)
    if (newTitle) {
      editor.noteController.updateTitle(newTitle)
    }
  }
}