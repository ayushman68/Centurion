import {Suspense} from 'react';
import {LoginForm} from '@/components/login-form';
export const metadata={title:'Sign in',robots:{index:false,follow:false}};
export default function Login(){return <Suspense fallback={<main id="main" className="center-state">Loading sign-in…</main>}><LoginForm/></Suspense>;}
