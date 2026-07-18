import type { ReactNode } from 'react';
import { Navigate,useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getPlayerDetails } from '../api/playerDetails';
export default function RequirePlayerDetails({children}:{children:ReactNode}){const{session}=useAuth();const location=useLocation();const query=useQuery({queryKey:['player-details',session?.user.id],queryFn:()=>getPlayerDetails(session!.user.id),enabled:!!session});if(query.isLoading)return <div className="center-screen"><p className="muted">Loading…</p></div>;if(!query.data)return <Navigate to="/player/profile" state={{from:location.pathname}} replace/>;return <>{children}</>}
