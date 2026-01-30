import { createClient } from '@supabase/supabase-js';
import { UserProfile } from "../types.ts";

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Only initialize if keys are present to prevent crashes in local dev without DB
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const dbService = {
  /**
   * Saves or updates the user profile in Supabase.
   */
  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    if (!supabase) {
      console.warn("Supabase not configured. Saving to LocalStorage only.");
      const offlineProfile = { ...profile, lastSynced: Date.now(), id: profile.id || crypto.randomUUID() };
      localStorage.setItem('auspark_profile_v3', JSON.stringify(offlineProfile));
      return offlineProfile;
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        email: profile.email, // Using email as the unique constraint
        full_name: profile.fullName,
        vehicle_number: profile.vehicleNumber,
        has_disability_permit: profile.hasDisabilityPermit,
        has_resident_permit: profile.hasResidentPermit,
        has_loading_zone_permit: profile.hasLoadingZonePermit,
        has_business_permit: profile.hasBusinessPermit,
        resident_area: profile.residentArea,
        last_synced: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase Error: ${error.message}`);
    }

    // Map DB snake_case back to our camelCase interface
    const updatedProfile: UserProfile = {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      vehicleNumber: data.vehicle_number,
      hasDisabilityPermit: data.has_disability_permit,
      hasResidentPermit: data.has_resident_permit,
      hasLoadingZonePermit: data.has_loading_zone_permit,
      hasBusinessPermit: data.has_business_permit,
      residentArea: data.resident_area,
      lastSynced: new Date(data.last_synced).getTime()
    };

    localStorage.setItem('auspark_profile_v3', JSON.stringify(updatedProfile));
    return updatedProfile;
  },

  /**
   * Fetches the profile from the database by email.
   */
  async fetchProfile(email: string): Promise<UserProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      vehicleNumber: data.vehicle_number,
      hasDisabilityPermit: data.has_disability_permit,
      hasResidentPermit: data.has_resident_permit,
      hasLoadingZonePermit: data.has_loading_zone_permit,
      hasBusinessPermit: data.has_business_permit,
      residentArea: data.resident_area,
      lastSynced: new Date(data.last_synced).getTime()
    };
  }
};