import {db} from '@/lib/db';
import {route,identity,body,json,AppError} from '@/lib/http';
import * as v from '@/lib/validation';
import * as service from '@/lib/portfolio-service';
export const dynamic='force-dynamic';
const handler=route(async request=>{
  const user=await identity(request);const url=new URL(request.url);const path=url.pathname.replace(/^\/api\/workspace\/?/,'').split('/').filter(Boolean);const method=request.method;
  if(!path.length){
    if(method==='GET'){const {page,limit}=v.pagination(url);const rows=(await db.query('SELECT p.id,p.name,p.is_demo,m.role FROM portfolios p JOIN members m ON m.portfolio_id=p.id WHERE m.user_id=$1 ORDER BY p.created_at DESC,p.id LIMIT $2 OFFSET $3',[user.id,limit+1,(page-1)*limit])).rows;return json({items:rows.slice(0,limit),hasMore:rows.length>limit,page});}
    if(method==='POST')return json(await service.createPortfolio(user.id,await body(request,v.portfolioInput)),201);
  }
  const id=v.uuid.parse(path[0]);const resource=path[1];
  if(path.length>2)throw new AppError(404,'NOT_FOUND','Endpoint not found.');
  if(!resource&&method==='GET')return json(await service.detail(user.id,id));
  if(resource==='holdings'&&method==='POST')return json(await service.addHolding(user.id,id,await body(request,v.holdingInput)),201);
  if(resource==='marks'&&method==='PATCH')return json(await service.markHolding(user.id,id,await body(request,v.markInput)));
  if(resource==='orders'&&method==='POST')return json(await service.executeOrder(user.id,id,await body(request,v.orderInput)),201);
  if((resource==='orders'||resource==='audit')&&method==='GET'){const {page,limit}=v.pagination(url);return json(await service.listHistory(user.id,id,resource,page,limit));}
  if(resource==='settings'&&method==='PATCH')return json(await service.setRiskLimit(user.id,id,(await body(request,v.settingsInput)).riskLimit));
  if(resource==='members'){
    if(method==='POST')return json(await service.setMember(user.id,id,await body(request,v.memberInput)));
    if(method==='DELETE'){const data=await body(request,(await import('zod')).z.object({userId:(await import('zod')).z.string().min(1).max(128)}).strict());return json(await service.removeMember(user.id,id,data.userId));}
    if(method==='GET'){await service.authorize(db,id,user.id,false,true);return json((await db.query('SELECT m.user_id,m.role,u.name,u.email FROM members m JOIN "user" u ON u.id=m.user_id WHERE m.portfolio_id=$1 ORDER BY u.name',[id])).rows);}
  }
  throw new AppError(405,'METHOD_NOT_ALLOWED','This operation is not supported.');
});
export {handler as GET,handler as POST,handler as PATCH,handler as DELETE};
