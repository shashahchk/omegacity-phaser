// @ts-nocheck
import GameUi from "../scenes/GameUi";
import * as Colyseus from "colyseus.js";

import { keymap } from "@codemirror/view"
import { indentWithTab, defaultKeymap } from "@codemirror/commands"

import { EditorView, basicSetup } from "codemirror"
import { python } from "@codemirror/lang-python"
import { EditorState, Extension } from "@codemirror/state";
import { receiveUpdates, sendableUpdates } from "@codemirror/collab";

import { yCollab } from 'y-codemirror.next';

import * as Y from 'yjs';
import { Client } from 'colyseus.js';


function SetUpCollabIDE(scene: Phaser.Scene) {
    scene.ydocs = new Map();
    scene.ydoc = new Y.Doc();

    const editors = []; // Array to hold editor instances
    const editorContainer = document.getElementById('editor');
    editorContainer.innerHTML = ''; // Clear any existing content

    const selector = document.getElementById('editorSelector');
    selector.innerHTML = ''; // Clear existing dropdown options

    // Initialize a listener for server broadcasts about editor count updates
    scene.room.onMessage('editorCountUpdated', (message) => {
        const { count } = message;
        updateEditors(count); // Adjust the editor setup based on the new count
    });

    // Function to update the number and state of editors based on server instructions
    function updateEditors(newCount) {
        while (editors.length > newCount) {
            const editorToRemove = editors.pop();
            editorToRemove.destroy(); // Assuming a method to properly clean up
            editorToRemove.dom.parentNode.remove(); // Remove the editor's container
        }

        while (editors.length < newCount) {
            const editorIndex = editors.length;
            const editorDiv = document.createElement('div');
            editorDiv.style.display = 'none'; // Hide by default
            editorContainer.appendChild(editorDiv);

            const editor = initEditor(editorDiv);
            // Assume we have a way to associate a sessionId with each editor for simplicity
            editor.sessionId = `editorSession-${editorIndex}`;
            editors.push(editor);
        }

        selector.innerHTML = '';
        editors.forEach((_, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = `Editor ${index + 1}`;
            selector.appendChild(option);
        });

        if (editors.length > 0) {
            editors[0].dom.parentNode.style.display = 'block';
        }
    }

    // Listen for editor updates from the server
    scene.room.onMessage('ideUpdated', (message) => {
        const { sessionId, update } = message;
        console.log("IDE UPDATED")
        if (sessionId !== scene.room.sessionId) {
            const editorIndex = findEditorIndexBySessionId(sessionId);
            if (editorIndex !== undefined && editorIndex < editors.length) {
                // Apply the update to the Y.Doc associated with this editor
                Y.applyUpdate(editors[editorIndex].state, update);
            }
        }
    });

    function initEditor(editorParent) {
        const startExtensions = [
            basicSetup, // Basic editor setup, defined elsewhere
            keymap.of([indentWithTab]),
            python(), // Language support, defined elsewhere
            EditorView.updateListener.of(update => {
                if (update.docChanged) {
                    // Assuming `ydoc` is your Y.Doc instance associated with this editor
                    // and `yText` is a Y.Text type bound to this editor's content
                    const yText = scene.ydoc.getText('sharedText');
                    const currentText = update.state.doc.toString();
                    yText.doc.transact(() => {
                        yText.delete(0, yText.length);
                        yText.insert(0, currentText);
                    });

                    const updateContent = Y.encodeStateAsUpdate(ydoc);
                    // Convert to Uint8Array if not already
                    const updateToSend = new Uint8Array(updateContent);
                    // Send this update to the server
                    scene.room.send('ideUpdated', { update: updateToSend });
                    // Send this update to the server
                    console.log("update")
                    // scene.room.send('ideUpdated', { update: updateContent });
                }
            }),
        ];

        const startState = EditorState.create({
            doc: "// Start coding...\n",
            extensions: startExtensions,
        });

        return new EditorView({
            state: startState,
            parent: editorParent,
        });
    }


    // Function to find editor index by sessionId
    function findEditorIndexBySessionId(sessionId) {
        // Example logic, adjust according to how you track session IDs
        return editors.findIndex(editor => editor.sessionId === sessionId);
    }

    // Dynamic editor selection handling
    selector.addEventListener('change', function () {
        const selectedEditorIndex = parseInt(this.value, 10);
        editors.forEach((editor, index) => {
            editor.dom.parentNode.style.display = index === selectedEditorIndex ? 'block' : 'none';
        });
    });

    scene.room.onMessage('codeUpdated', (message) => {
        try {
            // Assuming message.update is already a Uint8Array
            Y.applyUpdate(scene.ydoc, message.update);
        } catch (err) {
            console.error('Error applying update from server:', err);
            // Additional error handling or re-sync logic
        }
    });
}




// this.room.onMessage('codeUpdated', (message) => {
//   try {
//     // Assuming message.update is already a Uint8Array
//     Y.applyUpdate(ydoc, message.update);
//   } catch (err) {
//     console.error('Error applying update from server:', err);
//     // Additional error handling or re-sync logic
//   }
// });

// // Send local changes to the server
// ydoc.on('update', (update) => {
//   // Send only the update delta, not the entire document state
//   this.room.send('codeUpdate', { update });
// });



export { SetUpCollabIDE };