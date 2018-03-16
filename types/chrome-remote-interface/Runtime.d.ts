/// <reference path="index.d.ts" />
declare namespace CRI {
    interface EvaluateParameters {
        expression:string,
        objectGroup?:string,
        includeCommandLineAPI?:boolean,
        silent?:boolean,
        contextId:ExecutionContextID,
        returnByValue?:boolean,
        generatePreview?:boolean,
        userGesture?:boolean,
        awaitPromise?:boolean
    }
    interface EvaluateResult {
        result:Runtime.RemoteObject,
        exceptionDetails:ExceptionDetails
    }
    interface CallFunctionOnArguments {
        functionDeclaration:string,
        objectId:Runtime.RemoteObjectID,
        arguments:Array<CallArgument>,
        silent?:boolean,
        returnByValue?:boolean,
        generatePreview?:boolean,
        userGesture?:boolean,
        awaitPromise?:boolean,
        executionContextId:ExecutionContextID,
        objectGroup?:string
    }
    interface CallFunctionOnResult {
        result:Runtime.RemoteObject,
        exceptionDetails:ExceptionDetails
    }
    interface ReleaseObjectOptions {
        objectId:Runtime.RemoteObjectID
    }
    interface ReleaseObjectResult {}
    interface GetPropertiesOptions {
        objectId:Runtime.RemoteObjectID,
        ownProperties:boolean,
        accessorPropertiesOnly?:boolean,
        generatePreview?:boolean
    }
    interface GetPropertiesResult {
        result:Array<PropertyDescriptor>,
        internalProperties:Array<InternalPropertyDescriptor>,
        exceptionDetails:ExceptionDetails
    }
    interface PropertyDescriptor {
        name:string,
        value:Runtime.RemoteObject
    }
    namespace Runtime {
        type ScriptID = string;
        type RemoteObjectID = string;
        interface RemoteObject {
            type:string,
            subtype:string,
            className:string,
            value:any,
            unserializableValue:UnserializableValue,
            description:string,
            objectId:Runtime.RemoteObjectID,
            preview: ObjectPreview,
            customPreview: CustomPreview
        }
    }
    interface Runtime {
        enable:()=>void,
        disable:()=>void,
        executionContextCreated:(callback:(event:ExecutionContextCreatedEvent)=>void) => void,
        evaluate:(params:EvaluateParameters, callback:(err:any, result:EvaluateResult)=>void) => void,
        callFunctionOn:(params:CallFunctionOnArguments, callback:(err:any, result:CallFunctionOnResult)=>void) => void,
        StackTrace:StackTrace
        releaseObject:(options:ReleaseObjectOptions, callback:(err:any, result:ReleaseObjectResult)=>any) => void
        getProperties:(options:GetPropertiesOptions, callback:(err:any, result:GetPropertiesResult)=>any) => void
    }
}
