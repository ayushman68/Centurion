import type {calculateRisk} from './risk';
export interface Portfolio {id:string;name:string;cash:string;risk_limit:string;is_demo:boolean;role:'owner'|'manager'|'viewer'}
export interface Holding {id:string;symbol:string;quantity:string;price:string;cost:string;volatility:string;marked_at:string}
export interface Snapshot {portfolio:Portfolio;holdings:Holding[];risk:ReturnType<typeof calculateRisk>;asOf:string}
export interface HistoryRow {id:string;created_at:string;symbol?:string;quantity?:string;price?:string;proceeds?:string;action?:string;actor_name?:string;detail?:Record<string,unknown>}
export interface Member {user_id:string;name:string;email:string;role:string}
export interface Page<T>{items:T[];hasMore:boolean;page:number}
