import { createClient } from '@supabase/supabase-js';
import { UserProfile, ParkingReport } from "../types.ts";

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

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

  // NEW: Save report with image upload to Supabase Storage
  async saveReport(report: ParkingReport): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    if (!supabase) {
      throw new Error('Database not configured. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    try {
      let imageUrl: string | undefined;

      // Step 1: Upload image to Supabase Storage
      if (report.imageData && report.imageAttached) {
        try {
          // Convert base64 to blob
          const base64Data = report.imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });

          // Generate unique filename
          const fileName = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
          
          console.log('📤 Uploading image to Supabase Storage...');
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('parking-sign-images')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('❌ Image upload failed:', uploadError);
            throw new Error(`Image upload failed: ${uploadError.message}`);
          }

          console.log('✅ Image uploaded successfully:', uploadData);

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('parking-sign-images')
            .getPublicUrl(fileName);
          
          imageUrl = urlData.publicUrl;
          console.log('🔗 Public image URL:', imageUrl);

        } catch (uploadErr: any) {
          console.error('Image upload error:', uploadErr);
          // Continue anyway - save report without image
        }
      }

      // Step 2: Save report metadata to database
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
          image_url: imageUrl, // Store URL instead of base64
          source: report.source
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database save failed:', error);
        throw new Error(`Database save failed: ${error.message}`);
      }

      console.log('✅ Report saved to database:', data);

      return { 
        success: true, 
        imageUrl: imageUrl 
      };
      
    } catch (err: any) {
      console.error('💥 Report save error:', err);
      return {
        success: false,
        error: err.message || 'Unknown error'
      };
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