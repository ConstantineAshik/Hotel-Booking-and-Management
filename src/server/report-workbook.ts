import ExcelJS from "exceljs";
import {propertyReport} from "./reports";

type Report=Awaited<ReturnType<typeof propertyReport>>;
const headerFill={type:"pattern" as const,pattern:"solid" as const,fgColor:{argb:"FF173C43"}};
function styleSheet(sheet:ExcelJS.Worksheet,widths:number[]){
 sheet.views=[{state:"frozen",ySplit:1}];sheet.autoFilter={from:{row:1,column:1},to:{row:1,column:widths.length}};
 sheet.getRow(1).eachCell(cell=>{cell.font={bold:true,color:{argb:"FFFFFFFF"}};cell.fill=headerFill;cell.alignment={vertical:"middle"};});
 sheet.getRow(1).height=24;widths.forEach((width,index)=>{sheet.getColumn(index+1).width=width;});
}
export async function reportWorkbook(report:Report){
 const workbook=new ExcelJS.Workbook();workbook.creator="Hotel Booking Platform";workbook.created=new Date();
 const summary=workbook.addWorksheet("Summary",{properties:{defaultRowHeight:20}});
 summary.addRows([["Hotel report",`${report.period.from} through ${report.period.to}`],["Timezone",report.timezone],["Currency",report.currency],[],["Metric","Value"],["Room revenue",Number(report.totals.roomRevenue)],["Net collected",Number(report.totals.net)],["Occupancy",Number(report.totals.occupancy)/100],["Average daily rate",Number(report.totals.adr)],["Revenue per available room",Number(report.totals.revpar)],["Average booking value",Number(report.totals.averageBookingValue)],["Cancellation rate",Number(report.totals.cancellationRate)/100]]);
 summary.mergeCells("A1:B1");summary.getCell("A1").font={bold:true,size:18,color:{argb:"FFFFFFFF"}};summary.getCell("A1").fill=headerFill;summary.getCell("A1").alignment={horizontal:"center"};summary.getColumn(1).width=31;summary.getColumn(2).width=24;summary.getRow(5).font={bold:true};for(const row of [6,7,9,10,11])summary.getCell(row,2).numFmt="#,##0.00";for(const row of [8,12])summary.getCell(row,2).numFmt="0.0%";
 const daily=workbook.addWorksheet("Daily activity");daily.addRow(["Date","Room revenue","Collected","Refunded","Net collected","New reservations","Occupied room-nights","Available room-nights"]);for(const day of report.days)daily.addRow([new Date(`${day.date}T00:00:00Z`),Number(day.roomRevenue),Number(day.collected),Number(day.refunded),Number(day.net),day.bookings,day.roomNights,day.availableRooms]);styleSheet(daily,[14,16,14,14,16,18,22,22]);daily.getColumn(1).numFmt="yyyy-mm-dd";for(let column=2;column<=5;column++)daily.getColumn(column).numFmt="#,##0.00";
 const addBreakdown=(name:string,headers:string[],rows:(string|number)[][],widths:number[])=>{const sheet=workbook.addWorksheet(name);sheet.addRow(headers);sheet.addRows(rows);styleSheet(sheet,widths);sheet.getColumn(headers.length).numFmt="#,##0.00";return sheet;};
 addBreakdown("Taxes",["Tax","Applications","Amount"],report.taxes.map(row=>[row.label,row.count,Number(row.amount)]),[30,16,18]);
 addBreakdown("Room performance",["Room type","Occupied room-nights","Room revenue"],report.rooms.map(row=>[row.label,row.roomNights,Number(row.amount)]),[32,24,20]);
 addBreakdown("Guests",["Guest","Reservations","Booking value"],report.guests.map(row=>[row.label,row.count,Number(row.amount)]),[44,16,20]);
 addBreakdown("Booking sources",["Source","Reservations","Booking value"],report.sources.map(row=>[row.label,row.count,Number(row.amount)]),[28,16,20]);
 return workbook.xlsx.writeBuffer();
}
