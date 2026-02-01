import { createClient } from '@supabase/supabase-js';
import { UserProfile, ParkingReport } from "../types.ts";

// Access variables injected by Vite
const supabaseUrl = (typeof process !== 'undefined' && process.env.SUPABASE_URL) || '';
const supabaseAnonKey = (typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY) || '';

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

  async saveReport(report: ParkingReport): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    if (!supabase) {
      throw new Error('Database not configured. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    try {
      let imageUrl: string | undefined;

      if (report.imageData && report.imageAttached) {
        try {
          const base64Data = report.imageData.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          const fileName = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('parking-sign-images')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Image upload failed: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from('parking-sign-images')
            .getPublicUrl(fileName);
          
          imageUrl = urlData.publicUrl;
        } catch (uploadErr: any) {
          console.error('Image upload error:', uploadErr);
        }
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_email: report.userEmail,
          issue_category: report.issueCategory,
          description: report.description,
          ai_summary: report.aiSummary,
          ai_explanation: report.aiExplanation,
          timestamp: new Date(report.timestamp).toISOString(),
          image_attached: !!imageUrl,
          image_url: imageUrl,
          source: report.source
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database save failed: ${error.message}`);
      }

      return { success: true, imageUrl: imageUrl };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unknown error' };
    }
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