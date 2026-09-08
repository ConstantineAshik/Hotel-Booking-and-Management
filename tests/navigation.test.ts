import {test} from "node:test";
import assert from "node:assert/strict";
import {navigationSchema} from "../src/domain/navigation.js";
import {roleTemplates} from "../src/domain/permissions.js";

const item=(overrides:Record<string,unknown>={})=>({id:crypto.randomUUID(),label:"Link",url:"/",linkType:"internal",pageId:null,externalUrl:null,parentId:null,visible:true,newTab:false,...overrides});

test("navigation accepts root internal paths and trims labels",()=>{
 const result=navigationSchema.safeParse({name:"header",items:[item({label:"  Home  ",url:"/"}),item({label:"Rooms",url:"/rooms"})]});
 assert.equal(result.success,true);
 if(result.success)assert.equal(result.data.items[0].label,"Home");
});

test("navigation accepts http and https external URLs",()=>{
 assert.equal(navigationSchema.safeParse({name:"header",items:[item({linkType:"external",url:"https://example.com/stays"})]}).success,true);
 assert.equal(navigationSchema.safeParse({name:"header",items:[item({linkType:"external",url:"javascript:alert(1)"})]}).success,false);
});

test("navigation rejects empty labels and invalid hierarchy",()=>{
 const first=crypto.randomUUID();
 assert.equal(navigationSchema.safeParse({name:"header",items:[item({label:"  ",id:first})]}).success,false);
 assert.equal(navigationSchema.safeParse({name:"header",items:[item({id:first,parentId:first})]}).success,false);
 assert.equal(navigationSchema.safeParse({name:"header",items:[item({id:first,parentId:crypto.randomUUID()})]}).success,false);
});

test("navigation allows nested menus and CMS page references",()=>{
 const root=crypto.randomUUID();
 const result=navigationSchema.safeParse({name:"header",items:[item({id:root,label:"Experiences"}),item({linkType:"page",pageId:crypto.randomUUID(),parentId:root,label:"Spa"})]});
 assert.equal(result.success,true);
});

test("Super Admin has the permission used by navigation management",()=>{
 assert.equal(roleTemplates["Super Admin"].includes("website.edit"),true);
});
