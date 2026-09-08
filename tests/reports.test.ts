import {test} from "node:test";
import assert from "node:assert/strict";
import {reportPeriodSchema,csvCell,csv} from "../src/domain/reports.js";
test("reports reject reversed, invalid, and unbounded periods",()=>{
 assert.equal(reportPeriodSchema.safeParse({from:"2028-02-29",to:"2028-03-01"}).success,true);
 for(const input of [{from:"2027-02-29",to:"2027-03-01"},{from:"2027-03-01",to:"2027-02-01"},{from:"2027-01-01",to:"2029-01-01"}])assert.equal(reportPeriodSchema.safeParse(input).success,false);
});
test("CSV escapes quotes and neutralizes formulas while retaining monetary numbers",()=>{
 assert.equal(csvCell('Hotel "A"'),'"Hotel ""A"""');assert.equal(csvCell("=HYPERLINK(1)"),'"\'=HYPERLINK(1)"');assert.equal(csvCell(" +SUM(A1)"),'"\' +SUM(A1)"');assert.equal(csvCell("-80.50"),'"-80.50"');assert.ok(csv([["a","line\nbreak"]]).startsWith("\uFEFF"));
});
