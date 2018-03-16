/// <reference path="index.d.ts" />

declare namespace CRI {
    interface GetEventListenersOptions {
        objectId:Runtime.RemoteObjectID,
        depth?:number,
        pierce?:boolean
    }
    interface GetEventListenersResult {
        listeners:Array<DOMDebugger.EventListener>
    }
    interface DOMDebugger {
        getEventListeners:(options:GetEventListenersOptions, callback:(err:any, result:GetEventListenersResult)=>any) => void;
    }

    namespace DOMDebugger {
        interface EventListener {
            type:string,
            useCapture:boolean,
            passive:boolean,
            once:boolean,
            scriptId:Runtime.ScriptID,
            lineNumber:number,
            columnNumber:number,
            handler:Runtime.RemoteObject,
            originalHandler:Runtime.RemoteObject,
            backendNodeID:DOM.BackendNodeID
        }
    }
}
