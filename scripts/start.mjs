import "dotenv/config";
import { cp, access } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const standalone = resolve(".next/standalone");
await access(resolve(standalone, "server.js"));
await cp(resolve(".next/static"), resolve(standalone, ".next/static"), {recursive:true,force:true});
try { await access(resolve("public")); await cp(resolve("public"), resolve(standalone,"public"), {recursive:true,force:true}); }
catch(error) { if(error.code!=="ENOENT") throw error; }
const child=spawn(process.execPath,[resolve(standalone,"server.js")],{
  stdio:"inherit",windowsHide:true,
  env:{...process.env,NODE_ENV:"production",HOSTNAME:process.env.HOSTNAME||"127.0.0.1",PORT:process.env.PORT||"3000",MEDIA_ROOT:resolve(process.env.MEDIA_ROOT||".uploads")},
});
for(const signal of ["SIGINT","SIGTERM"]) process.on(signal,()=>child.kill(signal));
child.on("error",()=>{console.error("Production server could not start.");process.exitCode=1;});
child.on("exit",code=>{process.exitCode=code??1;});
