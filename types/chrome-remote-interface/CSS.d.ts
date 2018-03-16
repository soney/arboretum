/// <reference path="index.d.ts" />

declare namespace CRI {
    interface CSSProperty {
        name:string,
        value:string,
        important?:boolean,
        implicit?:boolean,
        text:string,
        parsedOk?:boolean,
        disabled?:boolean,
        range?:SourceRange
    }
    interface ShorthandEntry {
        name:string,
        value:string,
        important?:boolean
    }
    interface CSSStyle {
        styleSheetId:StyleSheetID,
        cssProperties:Array<CSSProperty>,
        shorthandEntries:Array<ShorthandEntry>,
        cssText:string,
        range:SourceRange
    }
    interface GetInlineStylesForNodeOptions {
        nodeId:NodeID
    }
    interface GetInlineStylesResponse {
        inlineStyle:CSSStyle,
        attributesStyle:CSSStyle
    }
    interface CSS {
        getInlineStylesForNode(options:GetInlineStylesForNodeOptions, callback:(err:any, data:GetInlineStylesResponse)=>any):void
    }
}
