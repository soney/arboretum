/// <reference path="cri.d.ts" />

declare module 'chrome-remote-interface' {
    function CRIFunction(options:any):cri.Chrome;
    namespace CRIFunction {
        function listTabs(options:cri.ListTabsOptions, callback:(err:any, tabs:Array<cri.TabInfo>)=>any):void;
        function spawnTab();
        function closeTab();
        interface Protocol { }
        interface List { }
        interface New { }
        interface Activate { }
        interface Close { }
        interface Version { }
    }
    export = CRIFunction;
}
