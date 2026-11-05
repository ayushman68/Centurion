import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {auth} from '@/lib/auth';
import {Dashboard} from '@/components/dashboard';
export const dynamic='force-dynamic';
export const metadata={title:'Workspace',robots:{index:false,follow:false}};
export default async function Workspace(){const session=await auth.api.getSession({headers:await headers()});if(!session)redirect('/login');return <Dashboard user={{name:session.user.name,email:session.user.email}}/>;}
