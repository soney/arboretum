"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function copyToClipboard(text) {
    const copyListener = (e) => {
        e.clipboardData.setData('text/plain', text);
        e.preventDefault();
        document.removeEventListener('copy', copyListener);
    };
    document.addEventListener('copy', copyListener);
    document.execCommand('copy');
}
exports.copyToClipboard = copyToClipboard;
;
