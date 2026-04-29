import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { getRouteFromHash } from "../lib/utils";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data }) => { 
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => { 
      if (active) {
        setSession(nextSession);
      }
    });

    return () => { 
      active = false; 
      data.subscription.unsubscribe(); 
    };
  }, []);

  return { session, loading };
}
