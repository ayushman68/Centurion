import {z} from 'zod';
const number = (min:number,max:number) => z.number().finite().min(min).max(max);
export const portfolioInput=z.object({name:z.string().trim().min(2).max(80),cash:number(100,1_000_000_000),demo:z.boolean().default(false)}).strict();
export const holdingInput=z.object({symbol:z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9.-]{0,11}$/),quantity:number(0.000001,1_000_000).multipleOf(0.000001),price:number(0.0001,1_000_000).multipleOf(0.0001),volatility:number(0.0001,1)}).strict();
export const markInput=z.object({holdingId:z.uuid(),price:number(0.0001,1_000_000).multipleOf(0.0001),volatility:number(0.0001,1)}).strict();
export const orderInput=z.object({holdingId:z.uuid(),quantity:number(0.000001,1_000_000).multipleOf(0.000001),idempotencyKey:z.uuid()}).strict();
export const settingsInput=z.object({riskLimit:number(0.005,0.5)}).strict();
export const memberInput=z.object({email:z.email().max(254),role:z.enum(['manager','viewer'])}).strict();
export const uuid=z.uuid();
export function pagination(url:URL){return z.object({page:z.coerce.number().int().min(1).max(10000).default(1),limit:z.coerce.number().int().min(1).max(50).default(20)}).parse(Object.fromEntries(url.searchParams));}
