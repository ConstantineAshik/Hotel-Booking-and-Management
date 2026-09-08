import {test} from "node:test";
import assert from "node:assert/strict";
import {formDefinitionSchema,submissionSchema,type FormField} from "../src/domain/forms.js";
const fields:FormField[]=[{key:"email",label:"Email",type:"email",required:true,options:[]},{key:"consent",label:"Consent",type:"checkbox",required:true,options:[]},{key:"topic",label:"Topic",type:"dropdown",required:true,options:["Wedding","Conference"]}];
test("public submissions enforce configured email, consent and allowed choices",()=>{
 const schema=submissionSchema(fields);
 const valid={email:"guest@example.com",consent:true,topic:"Wedding"};
 assert.deepEqual(schema.parse(valid),valid);
 for(const patch of [{email:"invalid"},{consent:false},{topic:"Injected option"},{unexpected:"value"}])assert.equal(schema.safeParse({...valid,...patch}).success,false);
});
test("form definitions reject duplicate keys and unsafe field names",()=>{
 assert.equal(formDefinitionSchema.safeParse({name:"Inquiry",active:true,fields:[fields[0],fields[0]]}).success,false);
 assert.equal(formDefinitionSchema.safeParse({name:"Inquiry",active:true,fields:[{...fields[0],key:"__proto__"}]}).success,false);
});
test("optional number fields allow empty input but reject nonfinite and oversized numbers",()=>{
 const schema=submissionSchema([{key:"guests",label:"Guests",type:"number",required:false,options:[]}]);
 for(const guests of ["",0,100])assert.equal(schema.safeParse({guests}).success,true);
 for(const guests of [Infinity,NaN,10000001,"100"])assert.equal(schema.safeParse({guests}).success,false);
});
