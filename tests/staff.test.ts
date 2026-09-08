import {test} from "node:test";
import assert from "node:assert/strict";
import {assertManageablePermissions,staffInputSchema} from "../src/domain/staff.js";
import type {Principal} from "../src/domain/permissions.js";
test("staff managers cannot assign or modify grants they do not hold",()=>{
 const actor:Principal={userId:"actor",propertyId:"hotel",disabled:false,permissions:["users.manage","booking.view"]};
 assert.doesNotThrow(()=>assertManageablePermissions(actor,["booking.view"]));
 assert.throws(()=>assertManageablePermissions(actor,["users.manage","roles.manage"]));
});
test("new accounts require a strong initial password",()=>{
 const input={id:"",fingerprint:"",name:"Hotel operator",email:"operator@example.com",roleId:"bf9e6b21-2b7f-4aed-9a8a-ec499b5ec4ba",password:"",disabled:false};
 assert.equal(staffInputSchema.safeParse(input).success,false);
 assert.equal(staffInputSchema.safeParse({...input,password:"test-long-password"}).success,true);
 assert.equal(staffInputSchema.safeParse({...input,id:"bf9e6b21-2b7f-4aed-9a8a-ec499b5ec4ba"}).success,true);
});
