/// <reference path="index.d.ts" />
declare namespace CRI {
    interface FrameAttachedEvent {
        frameId: FrameID,
        parentFrameId:FrameID,
        stack:StackTrace
    }
    interface FrameNavigatedEvent {
        frame: Frame
    }
    interface FrameDetachedEvent {
        frameId:FrameID
    }
    namespace Page {
        type ResourceType = 'Document' | 'Stylesheet' | 'Image' | 'Media' | 'Font' | 'Script' | 'TextTrack' | 'XHR' | 'Fetch' | 'EventSource' | 'WebSocket' | 'Manifest' | 'Other';
        interface FrameTree {
            frame:Frame,
            childFrames:Array<FrameTree>
        }
        interface NavigateResult {
            frameId:FrameID,
            loaderId:Network.LoaderID,
            errorText?:string
        }
        interface FrameResourceTree {
            frame:Frame,
            childFrames:Array<FrameResourceTree>,
            resources:Array<FrameResource>
        }
        interface FrameResource {
            url:string,
            type:ResourceType,
            mimeType:string,
            lastModified:Network.TimeSinceEpoch,
            contentSize:number,
            failed:boolean,
            canceled:boolean
        }
    }
    interface GetResourceTreeOptions {}
    interface GetResourceTreeResponse {
        frameTree: Page.FrameResourceTree
    }
    interface NavigateOptions {
        url:string,
        referrer?:string,
        transitionType?:TransitionType
    }
    interface GetResourceContentParams {
        frameId:FrameID,
        url:string
    }
    interface GetResourceContentResponse {
        content:string,
        base64Encoded:boolean
    }
    interface GetFrameTreeOptions{}
    interface CreateIsolatedWorldOptions {
        frameId:FrameID,
        worldName?:string
        grantUniversalAccess?:boolean
    }
    interface CreateIsolatedWorldResult {
        executionContextId:ExecutionContextID
    }

    interface Page {
        enable:()=>void;
        disable:()=>void;
        getResourceTree:(options:GetResourceTreeOptions, callback:(err:any, resources:GetResourceTreeResponse)=>any) => void;
        frameAttached:(callback:(FrameAttachedEvent)=>void) => void;
        frameDetached:(callback:(FrameDetachedEvent)=>void) => void;
        frameNavigated:(callback:(FrameNavigatedEvent)=>void) => void;
        navigate:(options:NavigateOptions, callback:(err:any, result:Page.NavigateResult)=>any) => void;
        getFrameTree:(options:GetFrameTreeOptions, callback:(err:any, result:Page.FrameTree)=>void)=>void;
        getResourceContent:(params:GetResourceContentParams, callback:(err:any, data:GetResourceContentResponse)=>any) => void;
        createIsolatedWorld:(params:CreateIsolatedWorldOptions, callback:(err:any, data:CreateIsolatedWorldResult)=>any) => void;
    }
}
