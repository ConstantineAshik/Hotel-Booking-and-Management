import {test} from "node:test";
import assert from "node:assert/strict";
import {contentDocumentSchema,contentInputSchema,contentVisible} from "../src/domain/content.js";
import {readJsonBody,RequestBodyError} from "../src/server/request-body.js";
test("content windows include the start and exclude the end",()=>{
 const document=contentDocumentSchema.parse({title:"Winter offer",startsAt:"2027-01-01T00:00:00.000Z",endsAt:"2027-02-01T00:00:00.000Z"});
 assert.equal(contentVisible(document,new Date("2026-12-31T23:59:59Z")),false);
 assert.equal(contentVisible(document,new Date(document.startsAt!)),true);
 assert.equal(contentVisible(document,new Date(document.endsAt!)),false);
 assert.equal(contentDocumentSchema.safeParse({...document,endsAt:document.startsAt}).success,false);
});
test("content rejects executable links, invalid addresses, and injected fields",()=>{
 const input={version:0,kind:"offers",slug:"winter-offer",locale:"en",mode:"draft",document:{title:"Winter offer"}};
 assert.equal(contentInputSchema.safeParse(input).success,true);
 assert.equal(contentInputSchema.safeParse({...input,slug:"../admin"}).success,false);
 assert.equal(contentInputSchema.safeParse({...input,document:{title:"Offer",url:"javascript:alert(1)"}}).success,false);
 assert.equal(contentInputSchema.safeParse({...input,propertyId:"another-property"}).success,false);
});
test("JSON reader limits streamed bodies without trusting content-length",async()=>{
 assert.deepEqual(await readJsonBody(new Request("http://localhost",{method:"POST",body:'{"title":"é"}'})),{title:"é"});
 await assert.rejects(()=>readJsonBody(new Request("http://localhost",{method:"POST",body:'{"large":"123456789"}'}),8),RequestBodyError);
 await assert.rejects(()=>readJsonBody(new Request("http://localhost",{method:"POST",body:"invalid"})),RequestBodyError);
});
