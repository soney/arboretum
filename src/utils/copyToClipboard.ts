export function copyToClipboard(text:string):void {
    const copyListener = (e:ClipboardEvent):void => {
        e.clipboardData.setData('text/plain', text);
        e.preventDefault();
        document.removeEventListener('copy', copyListener);
    };
    document.addEventListener('copy', copyListener);
    document.execCommand('copy');
};
