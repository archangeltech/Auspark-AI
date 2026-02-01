import { createClient } from '@supabase/supabase-js';
import { UserProfile, ParkingReport } from "../types.ts";

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const dbService = {
  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    if (!supabase) {
      const offlineProfile = { ...profile, lastSynced: Date.now(), id: profile.id || crypto.randomUUID() };
      localStorage.setItem('auspark_profile_v3', JSON.stringify(offlineProfile));
      return offlineProfile;
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        email: profile.email,
        full_name: profile.fullName,
        has_disability_permit: profile.hasDisabilityPermit,
        has_resident_permit: profile.hasResidentPermit,
        has_loading_vehicle: profile.hasLoadingVehicle,
        has_horse_carriage: profile.hasHorseCarriage,
        has_bus_permit: profile.hasBusPermit,
        has_taxi_permit: profile.hasTaxiPermit,
        resident_area: profile.residentArea,
        last_synced: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw new Error(`Supabase Error: ${error.message}`);

    const updatedProfile: UserProfile = {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      hasDisabilityPermit: data.has_disability_permit,
      hasResidentPermit: data.has_resident_permit,
      hasLoadingVehicle: data.has_loading_vehicle,
      hasHorseCarriage: data.has_horse_carriage,
      hasBusPermit: data.has_bus_permit,
      hasTaxiPermit: data.has_taxi_permit,
      residentArea: data.resident_area,
      lastSynced: new Date(data.last_synced).getTime()
    };

    localStorage.setItem('auspark_profile_v3', JSON.stringify(updatedProfile));
    return updatedProfile;
  },

  async saveReport(report: ParkingReport): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('reports')
      .insert({
        user_email: report.userEmail,
        issue_category: report.issueCategory,
        description: report.description,
        ai_summary: report.aiSummary,
        ai_explanation: report.aiExplanation,
        timestamp: new Date(report.timestamp).toISOString(),
        image_attached: report.imageAttached,
        image_data: report.imageData,
        source: report.source
      });
    if (error) console.error("Report DB Error:", error.message);
  },

  async deleteProfile(email: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('email', email);
    if (error) throw new Error(`Deletion Error: ${error.message}`);
  },

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
      hasDisabilityPermit: data.has_disability_permit,
      hasResidentPermit: data.has_resident_permit,
      hasLoadingVehicle: data.has_loading_vehicle,
      hasHorseCarriage: data.has_horse_carriage,
      hasBusPermit: data.has_bus_permit,
      hasTaxiPermit: data.has_taxi_permit,
      residentArea: data.resident_area,
      lastSynced: new Date(data.last_synced).getTime()
    };
  }
};