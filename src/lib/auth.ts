import { betterAuth } from 'better-auth';
import { db } from './db';
export const auth = betterAuth({
  appName:'Centurion', database:db,
  baseURL:process.env.BETTER_AUTH_URL,
  secret:process.env.BETTER_AUTH_SECRET,
  emailAndPassword:{enabled:true,minPasswordLength:12,maxPasswordLength:128},
  session:{expiresIn:60*60*24*7,updateAge:60*60*24},
  rateLimit:{enabled:true,storage:'database',window:60,max:100,customRules:{'/sign-in/email':{window:60,max:5},'/sign-up/email':{window:60,max:5}}},
  advanced:{ipAddress:{ipAddressHeaders:process.env.TRUSTED_IP_HEADER ? [process.env.TRUSTED_IP_HEADER] : []}},
});
