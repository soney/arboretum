/// <reference path="index.d.ts" />
declare namespace CRI {
    interface GetResponseBodyParams {
        requestId:RequestID
    }
    interface GetResponseBodyResponse {
        body:string,
        base64Encoded:boolean
    }
    interface GetResourceContentParams {
        frameId:FrameID,
        url:string
    }
    interface GetResourceContentResponse {
        content:string,
        base64Encoded:boolean
    }
    interface RequestWillBeSentEvent {
        requestId:RequestID,
        loaderId:Network.LoaderID,
        documentURL:string,
        request:Request,
        timestamp:MonotonicTime,
        wallTime:Network.TimeSinceEpoch,
        initiator:Initiator,
        redirectResponse:Network.Response,
        type:Page.ResourceType,
        frameId:FrameID
    }
    interface ResponseReceivedEvent {
        requestId:RequestID,
        loaderId:Network.LoaderID,
        timestamp:MonotonicTime,
        type:Page.ResourceType,
        response:Network.Response,
        frameId:FrameID
    }
    interface Network {
        enable:()=>void,
        requestWillBeSent:(callback:(event:RequestWillBeSentEvent)=>void) => void,
        responseReceived:(callback:(event:ResponseReceivedEvent)=>void) => void
        getResponseBody:(params:GetResponseBodyParams, callback:(err:any, data:GetResponseBodyResponse)=>any) => void
        loadingFailed:(Callback:(event:LoadingFailedEvent)=>void) => void
        loadingFinished:(Callback:(event:LoadingFinishedEvent)=>void) => void
    }
    namespace Network {
        type BlockedReason = 'csp' | 'mixed-content' | 'origin' | 'inspector' | 'subresource-filter' | 'other';
        type LoaderID = string;
        type TimeSinceEpoch = number;
        interface Response {
            url:string,
            status:number,
            statusText:string,
            headers:Headers,
            headersText:string,
            mimeType:string,
            requestHeaders:Headers,
            requestHeadersText:string,
            connectionReused:boolean,
            connectionId:number,
            remoteIPAddress:string,
            remotePort:number,
            fromDiskCache:boolean,
            fromServiceWorker:boolean,
            encodedDataLength:number,
            timing:ResourceTiming,
            protocl:string,
            securityState:Security.SecurityState,
            securityDetails:SecurityDetails
        }
        interface Request {
            url:string,
            method:string,
            headers:Headers,
            postData:string,
            hasPostData:boolean,
            mixedContentType:Security.MixedContentType,
            initialPriority:ResourcePriority,
            referrerPolicy:string,
            isLinkPreload:boolean
        }
        interface SignedCertificateTimestamp {
            status:string,
            origin:string,
            logDescription:string,
            logId:string,
            timestamp:TimeSinceEpoch,
            hashAlgorithm:string,
            signatureAlgorithm:string,
            signatureData:string
        }
        interface SecurityDetails {
            protocol:string,
            keyExchange:string,
            keyExchangeGroup:string,
            cipher:string,
            mac:string,
            certificateId:Security.CertificateId,
            subjectName:string,
            sanList:Array<string>,
            issuer:string,
            validFrom:TimeSinceEpoch,
            validTo:TimeSinceEpoch,
            signedCertificateTimestampList:Array<SignedCertificateTimestamp>

        }
        interface ResourceTiming {
            proxyStart:number,
            proxyEnd:number,
            dnsStart:number,
            dnsEnd:number,
            connectStart:number,
            connectEnd:number,
            sslStart:number,
            sslEnd:number,
            workerStart:number,
            workerReady:number,
            sendStart:number,
            sendEnd:number,
            pushStart:number,
            pushEnd:number,
            receiveHeadersEnd:number
        }
    }
}
