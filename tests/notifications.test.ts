import {test} from "node:test";
import assert from "node:assert/strict";
import {notificationTemplateSchema,renderNotification,defaultNotificationTemplates} from "../src/domain/notifications.js";
test("templates reject unknown placeholders and multiline subjects",()=>{
 const input={key:"booking.confirmation",locale:"en",active:true,...defaultNotificationTemplates["booking.confirmation"]};
 assert.equal(notificationTemplateSchema.safeParse(input).success,true);
 assert.equal(notificationTemplateSchema.safeParse({...input,subject:"Hello\nBcc: someone"}).success,false);
 assert.equal(notificationTemplateSchema.safeParse({...input,body:"Hello {{password}}"}).success,false);
 assert.equal(notificationTemplateSchema.safeParse({...input,body:"Hello {{guest_name"}).success,false);
});
test("template substitution treats guest values as plain text without recursive evaluation",()=>{
 assert.equal(renderNotification("Hello {{guest_name}} at {{hotel_name}}",{guest_name:"{{amount}}",hotel_name:"Harbour Hotel",amount:"100"}),"Hello {{amount}} at Harbour Hotel");
});
