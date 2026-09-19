// ipcMain.handle rejections arrive wrapped as "Error invoking remote method
// '<name>': Error: <actual message>" — unwrap that back to the plain message.
export function ipcErrorMessage(error) {
    const raw = error?.message || '';
    const match = raw.match(/^Error invoking remote method '[^']+':\s*(?:Error:\s*)?([\s\S]*)$/);
    return (match ? match[1] : raw).trim();
}
