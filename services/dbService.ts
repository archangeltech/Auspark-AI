import { UserProfile } from "../types.ts";

/**
 * DB SERVICE (MOCK FOR SUPABASE/FIREBASE)
 * To connect to a real DB like Supabase:
 * 1. npm install @supabase/supabase-js
 * 2. Replace the logic below with supabase.from('profiles').upsert(...)
 */

export const dbService = {
  /**
   * Saves the user profile to the cloud database.
   */
  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    console.log("☁️ Syncing profile to database...", profile);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // For now, we still use localStorage but mark it as synced.
    // In production, this is where your 'fetch' or 'supabase' call goes.
    const updatedProfile = {
      ...profile,
      id: profile.id || crypto.randomUUID(),
      lastSynced: Date.now()
    };

    localStorage.setItem('auspark_profile_v3', JSON.stringify(updatedProfile));
    
    return updatedProfile;
  },

  /**
   * Fetches the profile from the database (e.g., after a fresh install/login).
   */
  async fetchProfile(email: string): Promise<UserProfile | null> {
    // This would normally be: supabase.from('profiles').select().eq('email', email)
    const local = localStorage.getItem('auspark_profile_v3');
    if (local) {
      return JSON.parse(local);
    }
    return null;
  }
};