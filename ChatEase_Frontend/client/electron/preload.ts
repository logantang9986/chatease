import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld(
    'api', {
        send: (channel: string, data: any) => {
            // whitelist channels
            let validChannels = ["toMain", "window-control"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel: string, func: Function) => {
            let validChannels = ["fromMain"];
            if (validChannels.includes(channel)) {
                // Use _event to silence the "unused variable" warning in strict mode
                ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: any[]) => func(...args));
            }
        },
        // NEW: Method to get app version
        getAppVersion: () => ipcRenderer.invoke('get-app-version')
    }
);