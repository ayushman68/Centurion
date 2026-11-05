import {z} from 'zod';
import {auth} from './auth';
import {db} from './db';
export class AppError extends Error {constructor(public status:number,public code:string,message:string){super(message);}}
export function json(data:unknown,status=200){return Response.json({data},{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});}
export async function body<T>(request:Request,schema:z.ZodType<T>):Promise<T>{
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new AppError(415,'CONTENT_TYPE','Send JSON data.');
  const text=await request.text(); if(text.length>16000)throw new AppError(413,'TOO_LARGE','Request is too large.');
  try{return schema.parse(JSON.parse(text));}catch(e){if(e instanceof z.ZodError)throw e;throw new AppError(400,'INVALID_JSON','Invalid JSON.');}
}
export async function identity(request:Request){
  if(!['GET','HEAD'].includes(request.method)){
    const origin=request.headers.get('origin');
    if(!origin || origin!==new URL(process.env.BETTER_AUTH_URL!).origin)throw new AppError(403,'ORIGIN','Request origin is not allowed.');
  }
  const session=await auth.api.getSession({headers:request.headers});
  if(!session)throw new AppError(401,'UNAUTHORIZED','Sign in to continue.');
  if(request.method!=='GET'){
    const bucket=Math.floor(Date.now()/60000);
    const {rows}=await db.query('INSERT INTO request_limits(key,bucket) VALUES($1,$2) ON CONFLICT(key,bucket) DO UPDATE SET count=request_limits.count+1 RETURNING count',[session.user.id,bucket]);
    if(rows[0].count>60)throw new AppError(429,'RATE_LIMITED','Too many requests. Try again in one minute.');
  }
  return session.user;
}
export function route(fn:(request:Request)=>Promise<Response>){return async(request:Request)=>{
  const requestId=crypto.randomUUID();const start=Date.now();let status=200;
  try{const response=await fn(request);status=response.status;return response;}
  catch(e){status=e instanceof AppError?e.status:e instanceof z.ZodError?422:500;
    const message=e instanceof AppError?e.message:e instanceof z.ZodError?e.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '):'Something went wrong. Please try again.';
    if(status===500)console.error(JSON.stringify({level:'error',event:'request_failed',requestId,errorType:e instanceof Error?e.name:'Unknown'}));
    return Response.json({error:{code:e instanceof AppError?e.code:status===422?'VALIDATION':'INTERNAL',message,requestId}},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'60'}:{})}});
  }finally{console.info(JSON.stringify({level:'info',event:'request',requestId,method:request.method,path:new URL(request.url).pathname,status,durationMs:Date.now()-start}));}
};}
