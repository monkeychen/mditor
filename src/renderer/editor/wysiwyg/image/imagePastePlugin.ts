import { Plugin, PluginKey } from '@milkdown/prose/state';
import { saveClipboardImage, copyDroppedImage } from '../../../services/imageService';

export const imagePastePluginKey = new PluginKey('MDITOR_IMAGE_PASTE');

export function createImagePastePlugin(getDocFilePath: () => string | null): Plugin {
  return new Plugin({
    key: imagePastePluginKey,
    props: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              const docPath = getDocFilePath();
              saveClipboardImage(docPath, file).then((relPath) => {
                if (relPath) {
                  const imageType = view.state.schema.nodes.image;
                  if (imageType) {
                    const node = imageType.create({ src: relPath, alt: 'image' });
                    const tr = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(tr);
                  }
                }
              }).catch((err) => {
                console.error('[imagePastePlugin] Paste error:', err);
              });
              return true;
            }
          }
        }
        return false;
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name)) {
            event.preventDefault();
            const docPath = getDocFilePath();
            const originalPath = (file as unknown as { path?: string }).path;

            const handleSuccess = (relPath: string | null) => {
              if (relPath) {
                const imageType = view.state.schema.nodes.image;
                if (imageType) {
                  const node = imageType.create({ src: relPath, alt: 'image' });
                  const tr = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(tr);
                }
              }
            };

            if (originalPath) {
              copyDroppedImage(docPath, originalPath).then(handleSuccess).catch(console.error);
            } else {
              saveClipboardImage(docPath, file).then(handleSuccess).catch(console.error);
            }
            return true;
          }
        }
        return false;
      },
    },
  });
}
