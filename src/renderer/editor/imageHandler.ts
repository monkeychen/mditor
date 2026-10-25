import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { saveClipboardImage, copyDroppedImage } from '../services/imageService';

export function imageDropAndPasteExtension(getDocFilePath: () => string | null): Extension {
  return EditorView.domEventHandlers({
    paste(event, view) {
      const items = event.clipboardData?.items;
      if (!items) return false;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            const docPath = getDocFilePath();

            // 异步处理图片落盘
            saveClipboardImage(docPath, file).then((relPath) => {
              if (relPath) {
                const head = view.state.selection.main.head;
                const insertText = `\n![image](${relPath})\n`;
                view.dispatch({
                  changes: { from: head, insert: insertText },
                  selection: { anchor: head + insertText.length },
                });
              }
            });
            return true;
          }
        }
      }
      return false;
    },

    drop(event, view) {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name)) {
          event.preventDefault();
          const docPath = getDocFilePath();
          // Electron 中 File 对象具备 path 属性
          const originalPath = (file as unknown as { path?: string }).path;

          if (originalPath) {
            copyDroppedImage(docPath, originalPath).then((relPath) => {
              if (relPath) {
                const head = view.state.selection.main.head;
                const insertText = `\n![image](${relPath})\n`;
                view.dispatch({
                  changes: { from: head, insert: insertText },
                  selection: { anchor: head + insertText.length },
                });
              }
            });
            return true;
          } else {
            saveClipboardImage(docPath, file).then((relPath) => {
              if (relPath) {
                const head = view.state.selection.main.head;
                const insertText = `\n![image](${relPath})\n`;
                view.dispatch({
                  changes: { from: head, insert: insertText },
                  selection: { anchor: head + insertText.length },
                });
              }
            });
            return true;
          }
        }
      }
      return false;
    },
  });
}
