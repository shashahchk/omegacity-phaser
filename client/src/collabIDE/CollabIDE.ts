import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from '@codemirror/basic-setup';
import { javascript } from '@codemirror/lang-javascript';
import { indentWithTab } from '@codemirror/commands';

// Assuming Phaser.Scene is imported correctly
// Define the function to set up the collaborative IDE
function setUpCollabIDE(scene: Phaser.Scene) {
    const editorSelector = document.getElementById('editorSelector') as HTMLSelectElement;
    const editorsContainer = document.getElementById('editors');

    // This object will hold the CodeMirror EditorView instances keyed by user names
    const editors: { [key: string]: EditorView } = {};

    function addUser(userName: string) {
        const editorElement = document.createElement('div');
        editorElement.id = `editor - ${userName}`;
        editorsContainer.appendChild(editorElement);

        const state = EditorState.create({
            doc: `// Code for ${userName}\n`,
            extensions: [
                basicSetup,
                // keymap.of([indentWithTab]), // Use the imported indentWithTab function
                javascript()
            ],
        });

        const editor = new EditorView({
            state,
            parent: editorElement
        });

        editors[userName] = editor;

        const option = new Option(userName, userName);
        editorSelector.add(option);
    }

    function removeUser(userName: string) {
        const editor = editors[userName];
        if (editor) {
            editor.destroy(); // Properly dispose of the editor view
            delete editors[userName];

            const optionToRemove = Array.from(editorSelector.options).find(option => option.value === userName);
            if (optionToRemove) {
                editorSelector.removeChild(optionToRemove);
            }
        }
    }

    // Example usage
    addUser('User1');
    addUser('User2');
    // removeUser('User1');

    // Add more logic here for real-time collaboration
}

// Assuming you have a way to handle module exports and imports correctly
export { setUpCollabIDE };